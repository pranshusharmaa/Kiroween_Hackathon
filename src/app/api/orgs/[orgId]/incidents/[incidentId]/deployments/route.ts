import { NextRequest, NextResponse } from 'next/server';
import { getDeploymentsForIncident } from '@/modules/metrics/change-guardrails';

/**
 * GET /api/orgs/[orgId]/incidents/[incidentId]/deployments
 * Get deployments related to an incident with their guardrail checks
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; incidentId: string }> }
) {
  try {
    const { orgId, incidentId } = await params;

    const deployments = await getDeploymentsForIncident(orgId, incidentId);

    return NextResponse.json({ deployments });
  } catch (error: any) {
    console.error('Error fetching deployments for incident:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deployments' },
      { status: 500 }
    );
  }
}
