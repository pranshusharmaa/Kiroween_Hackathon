import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, assertOrgMember } from '@/modules/identity/service';
import { getWatchlistEntries } from '@/modules/connectors/watchlist';

/**
 * GET /api/orgs/:orgId/watchlist
 * Get SLA watchlist entries for an organization
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId') || undefined;
    const serviceName = searchParams.get('serviceName') || undefined;
    const environment = searchParams.get('environment') || undefined;
    const status = searchParams.getAll('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const entries = await getWatchlistEntries(orgId, {
      projectId,
      serviceName,
      environment,
      status: status.length > 0 ? status : undefined,
      limit,
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
