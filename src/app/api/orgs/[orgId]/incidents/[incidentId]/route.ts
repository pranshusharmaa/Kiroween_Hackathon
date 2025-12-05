import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, assertOrgMember } from '@/modules/identity/service';
import { getIncidentWithDetails } from '@/modules/incidents/queries';

/**
 * GET /api/orgs/:orgId/incidents/:incidentId
 * Get incident details with signals and actions
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

    const incident = await getIncidentWithDetails(orgId, incidentId);

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ incident });
  } catch (error) {
    console.error('Error fetching incident:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
