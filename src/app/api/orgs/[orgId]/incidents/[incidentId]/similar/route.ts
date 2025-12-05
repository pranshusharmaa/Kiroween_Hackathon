import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getCurrentUser, assertOrgMember } from '@/modules/identity/service';
import { findSimilarIncidents } from '@/modules/intelligence/similarity';

/**
 * GET /api/orgs/:orgId/incidents/:incidentId/similar
 * Find similar incidents using cosine similarity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; incidentId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, incidentId } = await params;

    // Verify user is a member
    try {
      await assertOrgMember(orgId, currentUser.id);
    } catch (error) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get target incident
    const targetIncident = await prisma.incidentSnapshot.findUnique({
      where: { id: incidentId, orgId },
    });

    if (!targetIncident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Get all incidents from the same org (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const allIncidents = await prisma.incidentSnapshot.findMany({
      where: {
        orgId,
        createdAt: {
          gte: ninetyDaysAgo,
        },
      },
      select: {
        id: true,
        title: true,
        serviceName: true,
        severity: true,
        status: true,
        environment: true,
        createdAt: true,
        updatedAt: true,
        actions: {
          where: {
            actionKind: 'RESOLUTION_DOCUMENTED',
          },
          orderBy: {
            ts: 'desc',
          },
          take: 1,
          select: {
            details: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Find similar incidents
    const similarIncidents = findSimilarIncidents(
      {
        id: targetIncident.id,
        title: targetIncident.title,
        description: undefined,
        serviceName: targetIncident.serviceName,
        severity: targetIncident.severity,
        status: targetIncident.status,
      },
      allIncidents.map(inc => ({
        id: inc.id,
        title: inc.title,
        description: undefined,
        serviceName: inc.serviceName,
        severity: inc.severity,
        status: inc.status,
      })),
      0.2, // Lower threshold to get more results
      10 // Limit to top 10
    );

    // Enrich with full incident data including resolution
    const enrichedResults = similarIncidents.map(result => {
      const fullIncident = allIncidents.find((i: any) => i.id === result.incident.id);
      let resolutionSummary = null;
      
      // Extract resolution summary from action details
      if (fullIncident?.actions && fullIncident.actions.length > 0) {
        try {
          const details = JSON.parse(fullIncident.actions[0].details || '{}');
          resolutionSummary = details.summary || null;
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      return {
        ...result.incident,
        similarity: result.similarity,
        similarityScore: Math.round(result.similarity * 100),
        createdAt: fullIncident?.createdAt,
        updatedAt: fullIncident?.updatedAt,
        environment: fullIncident?.environment,
        resolutionSummary,
      };
    });

    return NextResponse.json({
      targetIncident: {
        id: targetIncident.id,
        title: targetIncident.title,
        serviceName: targetIncident.serviceName,
        severity: targetIncident.severity,
        status: targetIncident.status,
      },
      similarIncidents: enrichedResults,
      count: enrichedResults.length,
    });
  } catch (error) {
    console.error('Error finding similar incidents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
