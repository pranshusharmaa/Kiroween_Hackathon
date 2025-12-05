import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getCurrentUser, assertOrgMember } from '@/modules/identity/service';

/**
 * GET /api/orgs/:orgId/dashboard
 * Get dashboard statistics and metrics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;

    // Verify user is a member
    try {
      await assertOrgMember(orgId, currentUser.id);
    } catch (error) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get date ranges
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get incident counts
    const [
      totalIncidents,
      openIncidents,
      criticalIncidents,
      incidents24h,
      incidents7d,
      incidentsByStatus,
      incidentsBySeverity,
      recentIncidents,
    ] = await Promise.all([
      // Total incidents
      prisma.incidentSnapshot.count({ where: { orgId } }),
      
      // Open incidents
      prisma.incidentSnapshot.count({
        where: { orgId, status: { in: ['OPEN', 'INVESTIGATING'] } },
      }),
      
      // Critical incidents
      prisma.incidentSnapshot.count({
        where: { orgId, severity: 'SEV1', status: { in: ['OPEN', 'INVESTIGATING'] } },
      }),
      
      // Incidents in last 24h
      prisma.incidentSnapshot.count({
        where: { orgId, createdAt: { gte: last24h } },
      }),
      
      // Incidents in last 7d
      prisma.incidentSnapshot.count({
        where: { orgId, createdAt: { gte: last7d } },
      }),
      
      // Group by status
      prisma.incidentSnapshot.groupBy({
        by: ['status'],
        where: { orgId },
        _count: { status: true },
      }),
      
      // Group by severity
      prisma.incidentSnapshot.groupBy({
        by: ['severity'],
        where: { orgId },
        _count: { severity: true },
      }),
      
      // Recent incidents for trend
      prisma.incidentSnapshot.findMany({
        where: { orgId, createdAt: { gte: last7d } },
        select: { createdAt: true, severity: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Calculate trends (last 7 days)
    const incidentTrend = Array(7).fill(0);
    recentIncidents.forEach(inc => {
      const dayIndex = Math.floor((now.getTime() - new Date(inc.createdAt).getTime()) / (24 * 60 * 60 * 1000));
      if (dayIndex >= 0 && dayIndex < 7) {
        incidentTrend[6 - dayIndex]++;
      }
    });

    // Calculate MTTR (Mean Time To Resolution) - simplified
    const resolvedIncidents = await prisma.incidentSnapshot.findMany({
      where: {
        orgId,
        status: 'RESOLVED',
        createdAt: { gte: last30d },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    let avgMTTR = 0;
    if (resolvedIncidents.length > 0) {
      const totalTime = resolvedIncidents.reduce((sum, inc) => {
        return sum + (new Date(inc.updatedAt).getTime() - new Date(inc.createdAt).getTime());
      }, 0);
      avgMTTR = totalTime / resolvedIncidents.length / (60 * 60 * 1000); // Convert to hours
    }

    // Get watchlist stats
    const watchlistStats = await prisma.sLAWatchEntry.groupBy({
      by: ['status'],
      where: { orgId },
      _count: { status: true },
    });

    // Get data path stats
    const dataPathStats = await prisma.dataPathFlow.aggregate({
      where: { orgId },
      _count: { id: true },
      _sum: { eventCount: true },
    });

    return NextResponse.json({
      overview: {
        totalIncidents,
        openIncidents,
        criticalIncidents,
        incidents24h,
        incidents7d,
        avgMTTR: avgMTTR.toFixed(1),
      },
      trends: {
        incidentTrend,
      },
      breakdown: {
        byStatus: incidentsByStatus.map(s => ({
          status: s.status,
          count: s._count.status,
        })),
        bySeverity: incidentsBySeverity.map(s => ({
          severity: s.severity,
          count: s._count.severity,
        })),
      },
      watchlist: {
        total: watchlistStats.reduce((sum, s) => sum + s._count.status, 0),
        byStatus: watchlistStats.map(s => ({
          status: s.status,
          count: s._count.status,
        })),
      },
      dataPaths: {
        totalFlows: dataPathStats._count.id || 0,
        totalEvents: dataPathStats._sum.eventCount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
