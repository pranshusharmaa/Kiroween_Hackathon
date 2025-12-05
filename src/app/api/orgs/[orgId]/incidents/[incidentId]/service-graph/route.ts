import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, assertOrgMember } from '@/modules/identity/service';
import { buildServiceGraphForIncident } from '@/modules/incidents/service-graph';

/**
 * GET /api/orgs/:orgId/incidents/:incidentId/service-graph
 * Get the service graph (data flow map) for an incident
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

    // Build service graph
    const graph = await buildServiceGraphForIncident(orgId, incidentId);

    return NextResponse.json({
      graph,
      incidentId,
    });
  } catch (error: any) {
    console.error('Error building service graph:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
