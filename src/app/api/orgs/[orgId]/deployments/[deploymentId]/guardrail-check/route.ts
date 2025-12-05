import { NextRequest, NextResponse } from 'next/server';
import {
  runGuardrailCheckForDeployment,
  getGuardrailChecksForDeployment,
} from '@/modules/metrics/change-guardrails';

/**
 * POST /api/orgs/[orgId]/deployments/[deploymentId]/guardrail-check
 * Run a new guardrail check for a deployment
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; deploymentId: string }> }
) {
  try {
    const { orgId, deploymentId } = await params;

    const result = await runGuardrailCheckForDeployment(orgId, deploymentId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error running guardrail check:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run guardrail check' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orgs/[orgId]/deployments/[deploymentId]/guardrail-check
 * Get existing guardrail checks for a deployment
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; deploymentId: string }> }
) {
  try {
    const { orgId, deploymentId } = await params;

    const checks = await getGuardrailChecksForDeployment(orgId, deploymentId);

    return NextResponse.json({ checks });
  } catch (error: any) {
    console.error('Error fetching guardrail checks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch guardrail checks' },
      { status: 500 }
    );
  }
}
