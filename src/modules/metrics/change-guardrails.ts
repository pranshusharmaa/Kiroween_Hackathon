/**
 * Change Guardrails
 * 
 * Automatically checks performance metrics when deployments occur
 * and classifies the impact as PASS/WARN/FAIL based on thresholds.
 */

import { prisma } from '@/lib/db/client';
import { getMetricSummaryForServiceWindow, MetricWindow } from './metrics-adapter';

// Guardrail thresholds
const THRESHOLDS = {
  // Latency increase thresholds
  LATENCY_WARN_PCT: 20, // 20% increase triggers warning
  LATENCY_FAIL_PCT: 50, // 50% increase triggers failure
  
  // Error rate increase thresholds
  ERROR_RATE_WARN_PCT: 50, // 50% increase triggers warning
  ERROR_RATE_FAIL_PCT: 100, // 100% (2x) increase triggers failure
  
  // Absolute error rate thresholds
  ERROR_RATE_ABSOLUTE_WARN: 0.05, // 5% error rate triggers warning
  ERROR_RATE_ABSOLUTE_FAIL: 0.10, // 10% error rate triggers failure
};

// Time window configuration
const WINDOW_CONFIG = {
  BASELINE_DURATION_MIN: 30, // 30 minutes before deployment
  NEW_DURATION_MIN: 15, // 15 minutes after deployment
};

export interface GuardrailCheckResult {
  id: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  reason: string;
  baselineP95LatencyMs: number;
  baselineErrorRate: number;
  newP95LatencyMs: number;
  newErrorRate: number;
  latencyDeltaPct: number;
  errorRateDeltaPct: number;
}

/**
 * Run a guardrail check for a deployment.
 * Compares metrics before and after the deployment to detect degradation.
 */
export async function runGuardrailCheckForDeployment(
  orgId: string,
  deploymentId: string
): Promise<GuardrailCheckResult> {
  // Fetch the deployment
  const deployment = await prisma.deploymentEvent.findUnique({
    where: { id: deploymentId },
  });

  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  if (deployment.orgId !== orgId) {
    throw new Error('Deployment does not belong to this organization');
  }

  // Define time windows
  const deployedAt = deployment.deployedAt;
  
  const baselineWindow: MetricWindow = {
    start: new Date(deployedAt.getTime() - WINDOW_CONFIG.BASELINE_DURATION_MIN * 60 * 1000),
    end: deployedAt,
  };

  const newWindow: MetricWindow = {
    start: deployedAt,
    end: new Date(deployedAt.getTime() + WINDOW_CONFIG.NEW_DURATION_MIN * 60 * 1000),
  };

  // Fetch metrics for both windows
  const baselineMetrics = await getMetricSummaryForServiceWindow(
    orgId,
    deployment.serviceName,
    deployment.environment,
    baselineWindow
  );

  const newMetrics = await getMetricSummaryForServiceWindow(
    orgId,
    deployment.serviceName,
    deployment.environment,
    newWindow
  );

  // Calculate deltas
  const latencyDeltaPct = baselineMetrics.p95LatencyMs > 0
    ? ((newMetrics.p95LatencyMs - baselineMetrics.p95LatencyMs) / baselineMetrics.p95LatencyMs) * 100
    : 0;

  const errorRateDeltaPct = baselineMetrics.errorRate > 0
    ? ((newMetrics.errorRate - baselineMetrics.errorRate) / baselineMetrics.errorRate) * 100
    : 0;

  // Classify the result
  const classification = classifyGuardrailResult(
    latencyDeltaPct,
    errorRateDeltaPct,
    newMetrics.errorRate
  );

  // Store the check result
  const check = await prisma.changeGuardrailCheck.create({
    data: {
      orgId,
      deploymentId,
      serviceName: deployment.serviceName,
      environment: deployment.environment,
      status: classification.status,
      reason: classification.reason,
      baselineWindowStart: baselineWindow.start,
      baselineWindowEnd: baselineWindow.end,
      newWindowStart: newWindow.start,
      newWindowEnd: newWindow.end,
      baselineP95LatencyMs: baselineMetrics.p95LatencyMs,
      baselineErrorRate: baselineMetrics.errorRate,
      newP95LatencyMs: newMetrics.p95LatencyMs,
      newErrorRate: newMetrics.errorRate,
      latencyDeltaPct,
      errorRateDeltaPct,
    },
  });

  return {
    id: check.id,
    status: check.status as 'PASS' | 'WARN' | 'FAIL',
    reason: check.reason,
    baselineP95LatencyMs: check.baselineP95LatencyMs,
    baselineErrorRate: check.baselineErrorRate,
    newP95LatencyMs: check.newP95LatencyMs,
    newErrorRate: check.newErrorRate,
    latencyDeltaPct: check.latencyDeltaPct,
    errorRateDeltaPct: check.errorRateDeltaPct,
  };
}

/**
 * Classify guardrail result based on thresholds.
 */
function classifyGuardrailResult(
  latencyDeltaPct: number,
  errorRateDeltaPct: number,
  absoluteErrorRate: number
): { status: 'PASS' | 'WARN' | 'FAIL'; reason: string } {
  const issues: string[] = [];
  let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';

  // Check latency degradation
  if (latencyDeltaPct >= THRESHOLDS.LATENCY_FAIL_PCT) {
    status = 'FAIL';
    issues.push(`P95 latency increased by ${latencyDeltaPct.toFixed(1)}%`);
  } else if (latencyDeltaPct >= THRESHOLDS.LATENCY_WARN_PCT) {
    status = 'WARN';
    issues.push(`P95 latency increased by ${latencyDeltaPct.toFixed(1)}%`);
  }

  // Check error rate degradation
  if (errorRateDeltaPct >= THRESHOLDS.ERROR_RATE_FAIL_PCT || absoluteErrorRate >= THRESHOLDS.ERROR_RATE_ABSOLUTE_FAIL) {
    status = 'FAIL';
    issues.push(`Error rate increased by ${errorRateDeltaPct.toFixed(1)}% to ${(absoluteErrorRate * 100).toFixed(2)}%`);
  } else if (errorRateDeltaPct >= THRESHOLDS.ERROR_RATE_WARN_PCT || absoluteErrorRate >= THRESHOLDS.ERROR_RATE_ABSOLUTE_WARN) {
    if (status === 'PASS') status = 'WARN';
    issues.push(`Error rate increased by ${errorRateDeltaPct.toFixed(1)}% to ${(absoluteErrorRate * 100).toFixed(2)}%`);
  }

  // Generate reason
  let reason: string;
  if (status === 'PASS') {
    reason = 'Metrics within acceptable thresholds';
  } else {
    reason = issues.join('; ');
  }

  return { status, reason };
}

/**
 * Get existing guardrail checks for a deployment.
 */
export async function getGuardrailChecksForDeployment(
  orgId: string,
  deploymentId: string
): Promise<GuardrailCheckResult[]> {
  const checks = await prisma.changeGuardrailCheck.findMany({
    where: {
      orgId,
      deploymentId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return checks.map((check) => ({
    id: check.id,
    status: check.status as 'PASS' | 'WARN' | 'FAIL',
    reason: check.reason,
    baselineP95LatencyMs: check.baselineP95LatencyMs,
    baselineErrorRate: check.baselineErrorRate,
    newP95LatencyMs: check.newP95LatencyMs,
    newErrorRate: check.newErrorRate,
    latencyDeltaPct: check.latencyDeltaPct,
    errorRateDeltaPct: check.errorRateDeltaPct,
  }));
}

/**
 * Get deployments for an incident with their guardrail checks.
 */
export async function getDeploymentsForIncident(
  orgId: string,
  incidentId: string
) {
  const deployments = await prisma.deploymentEvent.findMany({
    where: {
      orgId,
      incidentId,
    },
    include: {
      guardrailChecks: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1, // Get the most recent check
      },
    },
    orderBy: {
      deployedAt: 'desc',
    },
  });

  return deployments;
}
