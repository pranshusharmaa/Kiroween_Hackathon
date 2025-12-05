import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, assertOrgMember } from '@/modules/identity/service';
import { prisma } from '@/lib/db/client';
import { getDataPathFlowsForIncident } from '@/modules/connectors/data-path-flow';

/**
 * GET /api/orgs/:orgId/incidents/:incidentId/data-paths
 * Get data path flows associated with an incident
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

    // Get incident to retrieve data path keys
    const incident = await prisma.incidentSnapshot.findFirst({
      where: {
        id: incidentId,
        orgId,
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Get data path flows
    const dataPathKeys = incident.dataPathKeys || [];
    const flows = await getDataPathFlowsForIncident(orgId, dataPathKeys);

    return NextResponse.json({ flows });
  } catch (error) {
    console.error('Error fetching data paths:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
