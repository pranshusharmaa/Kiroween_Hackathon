import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, assertOrgMember, assertRole } from '@/modules/identity/service';
import { changeIncidentStatus } from '@/modules/incidents/commands';
import { INCIDENT_STATUSES } from '@/modules/incidents/types';

/**
 * POST /api/orgs/:orgId/incidents/:incidentId/status
 * Change incident status
 * Requires SRE_LEAD or ONCALL_ENGINEER role
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; incidentId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, incidentId } = await params;

    // Verify user has required role
    try {
      await assertRole(orgId, currentUser.id, ['ORG_ADMIN', 'SRE_LEAD', 'ONCALL_ENGINEER']);
    } catch (error) {
      return NextResponse.json(
        { error: 'Forbidden: Requires SRE_LEAD or ONCALL_ENGINEER role' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { newStatus, reason } = body;

    // Validate status
    if (!newStatus) {
      return NextResponse.json({ error: 'newStatus is required' }, { status: 400 });
    }

    if (!INCIDENT_STATUSES[newStatus as keyof typeof INCIDENT_STATUSES]) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${Object.keys(INCIDENT_STATUSES).join(', ')}` },
        { status: 400 }
      );
    }

    await changeIncidentStatus(orgId, incidentId, {
      newStatus,
      actorId: currentUser.id,
      reason,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error changing incident status:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
