import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, assertOrgMember } from '@/modules/identity/service';
import { getGuidanceForIncident } from '@/modules/intelligence/guidance';

/**
 * GET /api/orgs/:orgId/incidents/:incidentId/guidance
 * Get AI-powered guidance for an incident
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

    const guidance = await getGuidanceForIncident(orgId, incidentId);

    return NextResponse.json(guidance);
  } catch (error: any) {
    console.error('Error generating guidance:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
