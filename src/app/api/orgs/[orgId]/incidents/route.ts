import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, assertOrgMember } from '@/modules/identity/service';
import { listIncidents } from '@/modules/incidents/queries';
import { createIncident } from '@/modules/incidents/commands';
import { INCIDENT_SEVERITIES } from '@/modules/incidents/types';

/**
 * GET /api/orgs/:orgId/incidents
 * List incidents with filtering and pagination
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
    const environment = searchParams.get('environment') || undefined;
    const status = searchParams.getAll('status') as any[];
    const severity = searchParams.getAll('severity') as any[];
    const searchQuery = searchParams.get('searchQuery') || undefined;
    const sortBy = (searchParams.get('sortBy') as any) || 'createdAt';
    const direction = (searchParams.get('direction') as any) || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor') || undefined;

    const result = await listIncidents(orgId, {
      projectId,
      environment,
      status: status.length > 0 ? status : undefined,
      severity: severity.length > 0 ? severity : undefined,
      searchQuery,
      sortBy,
      direction,
      limit,
      cursor,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing incidents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/orgs/:orgId/incidents
 * Create a new incident
 */
export async function POST(
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

    const body = await request.json();
    const {
      projectId,
      title,
      serviceName,
      severity,
      environment,
      detectedBy,
      initialCorrelationKey,
      runbookPath,
    } = body;

    // Validate required fields
    if (!projectId || !title || !serviceName || !severity || !environment) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, title, serviceName, severity, environment' },
        { status: 400 }
      );
    }

    // Validate severity
    if (!INCIDENT_SEVERITIES[severity as keyof typeof INCIDENT_SEVERITIES]) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${Object.keys(INCIDENT_SEVERITIES).join(', ')}` },
        { status: 400 }
      );
    }

    const incidentId = await createIncident({
      orgId,
      projectId,
      title,
      serviceName,
      severity,
      environment,
      detectedBy: detectedBy || 'user',
      initialCorrelationKey,
      runbookPath,
    });

    return NextResponse.json({ incidentId }, { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
