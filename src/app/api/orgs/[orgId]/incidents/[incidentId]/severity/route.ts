import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, assertRole } from '@/modules/identity/service';
import { changeIncidentSeverity } from '@/modules/incidents/commands';
import { INCIDENT_SEVERITIES } from '@/modules/incidents/types';

/**
 * POST /api/orgs/:orgId/incidents/:incidentId/severity
 * Change incident severity
 * Requires ORG_ADMIN or SRE_LEAD role (per SRE principles)
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

    // Only ORG_ADMIN and SRE_LEAD can change severity (per steering)
    try {
      await assertRole(orgId, currentUser.id, ['ORG_ADMIN', 'SRE_LEAD']);
    } catch (error) {
      return NextResponse.json(
        { error: 'Forbidden: Only ORG_ADMIN and SRE_LEAD can change severity' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { newSeverity, reason } = body;

    // Validate severity
    if (!newSeverity) {
      return NextResponse.json({ error: 'newSeverity is required' }, { status: 400 });
    }

    if (!INCIDENT_SEVERITIES[newSeverity as keyof typeof INCIDENT_SEVERITIES]) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${Object.keys(INCIDENT_SEVERITIES).join(', ')}` },
        { status: 400 }
      );
    }

    await changeIncidentSeverity(orgId, incidentId, {
      newSeverity,
      actorId: currentUser.id,
      reason,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error changing incident severity:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
