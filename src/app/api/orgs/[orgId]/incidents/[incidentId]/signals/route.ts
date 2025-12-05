import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, assertOrgMember } from '@/modules/identity/service';
import { attachSignal } from '@/modules/incidents/commands';

/**
 * POST /api/orgs/:orgId/incidents/:incidentId/signals
 * Attach a signal to an incident
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

    // Verify user is a member
    try {
      await assertOrgMember(orgId, currentUser.id);
    } catch (error) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      signalType,
      serviceName,
      environment,
      source,
      summary,
      correlationKey,
      traceId,
      data,
    } = body;

    // Validate required fields
    if (!signalType || !serviceName || !environment || !source || !summary) {
      return NextResponse.json(
        { error: 'signalType, serviceName, environment, source, and summary are required' },
        { status: 400 }
      );
    }

    await attachSignal(orgId, incidentId, {
      signalType,
      serviceName,
      environment,
      source,
      summary,
      correlationKey,
      traceId,
      data,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error attaching signal:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
