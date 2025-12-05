import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, assertOrgMember } from '@/modules/identity/service';
import { generatePostmortem } from '@/modules/intelligence/postmortem';
import { getPostmortemForIncident } from '@/modules/knowledge/postmortems';

/**
 * GET /api/orgs/:orgId/incidents/:incidentId/postmortem
 * Get existing postmortem for an incident
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

    const postmortem = await getPostmortemForIncident(orgId, incidentId);

    if (!postmortem) {
      return NextResponse.json({ error: 'Postmortem not found' }, { status: 404 });
    }

    return NextResponse.json({ postmortem });
  } catch (error) {
    console.error('Error fetching postmortem:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/orgs/:orgId/incidents/:incidentId/postmortem
 * Generate a new postmortem for an incident
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

    // Check if postmortem already exists
    const existing = await getPostmortemForIncident(orgId, incidentId);
    if (existing) {
      return NextResponse.json(
        { error: 'Postmortem already exists for this incident' },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const options = {
      includeMetrics: body.includeMetrics !== false,
      includeTimeline: body.includeTimeline !== false,
      format: body.format || 'markdown',
    };

    const postmortem = await generatePostmortem(orgId, incidentId, options);

    return NextResponse.json(postmortem, { status: 201 });
  } catch (error: any) {
    console.error('Error generating postmortem:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
