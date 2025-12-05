import { NormalizedEvent, SLAWatchUpdate, SLAThresholds } from './types';

/**
 * Default SLA thresholds - in production, these would be configurable per service
 */
const DEFAULT_THRESHOLDS: SLAThresholds = {
  errorRate: {
    warning: 0.01, // 1%
    critical: 0.05, // 5%
  },
  latency: {
    warning: 500, // 500ms
    critical: 1000, // 1000ms
  },
  availability: {
    warning: 0.99, // 99%
    critical: 0.95, // 95%
  },
};

/**
 * Evaluate risk from a normalized event
 * Returns an SLA watch update if metrics approach thresholds
 */
export function evaluateRiskFromNormalizedEvent(
  normalized: NormalizedEvent
): SLAWatchUpdate | null {
  const { metrics, logs } = normalized;

  if (!metrics) {
    return null; // No metrics to evaluate
  }

  let maxRiskScore = 0;
  let status: 'AT_RISK' | 'BREACHED' | 'CLEARED' = 'CLEARED';
  const riskFactors: string[] = [];

  // Evaluate error rate
  if (metrics.errorRate !== undefined) {
    const errorRisk = evaluateErrorRate(metrics.errorRate);
    if (errorRisk.score > maxRiskScore) {
      maxRiskScore = errorRisk.score;
      status = errorRisk.status;
    }
    if (errorRisk.score > 0) {
      riskFactors.push(`Error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
    }
  }

  // Evaluate latency
  if (metrics.latency !== undefined) {
    const latencyRisk = evaluateLatency(metrics.latency);
    if (latencyRisk.score > maxRiskScore) {
      maxRiskScore = latencyRisk.score;
      status = latencyRisk.status;
    }
    if (latencyRisk.score > 0) {
      riskFactors.push(`Latency: ${metrics.latency}ms`);
    }
  }

  // Evaluate availability
  if (metrics.availability !== undefined) {
    const availabilityRisk = evaluateAvailability(metrics.availability);
    if (availabilityRisk.score > maxRiskScore) {
      maxRiskScore = availabilityRisk.score;
      status = availabilityRisk.status;
    }
    if (availabilityRisk.score > 0) {
      riskFactors.push(`Availability: ${(metrics.availability * 100).toFixed(2)}%`);
    }
  }

  // Only create watch entry if there's actual risk
  if (maxRiskScore === 0) {
    return null;
  }

  // Prepare logs snapshot
  const logsSnapshot = logs
    ? logs
        .filter((log) => log.level === 'ERROR' || log.level === 'WARN')
        .slice(0, 5) // Keep only 5 most relevant logs
    : [];

  // Add risk factors to logs if no error/warn logs exist
  if (logsSnapshot.length === 0 && riskFactors.length > 0) {
    logsSnapshot.push({
      level: 'WARN',
      message: `SLA threshold approaching: ${riskFactors.join(', ')}`,
      timestamp: normalized.timestamp,
    });
  }

  return {
    orgId: normalized.orgId,
    projectId: normalized.projectId,
    serviceName: normalized.serviceName,
    environment: normalized.environment,
    correlationKey: normalized.correlationKey,
    dataPathKey: normalized.dataPathKey,
    status,
    riskScore: maxRiskScore,
    source: normalized.source,
    logsSnapshot,
  };
}

/**
 * Evaluate error rate risk
 */
function evaluateErrorRate(errorRate: number): { score: number; status: 'AT_RISK' | 'BREACHED' | 'CLEARED' } {
  const thresholds = DEFAULT_THRESHOLDS.errorRate;

  if (errorRate >= thresholds.critical) {
    return {
      score: Math.min(1.0, errorRate / thresholds.critical),
      status: 'BREACHED',
    };
  }

  if (errorRate >= thresholds.warning) {
    return {
      score: 0.5 + (errorRate - thresholds.warning) / (thresholds.critical - thresholds.warning) * 0.4,
      status: 'AT_RISK',
    };
  }

  return { score: 0, status: 'CLEARED' };
}

/**
 * Evaluate latency risk
 */
function evaluateLatency(latency: number): { score: number; status: 'AT_RISK' | 'BREACHED' | 'CLEARED' } {
  const thresholds = DEFAULT_THRESHOLDS.latency;

  if (latency >= thresholds.critical) {
    return {
      score: Math.min(1.0, latency / thresholds.critical),
      status: 'BREACHED',
    };
  }

  if (latency >= thresholds.warning) {
    return {
      score: 0.5 + (latency - thresholds.warning) / (thresholds.critical - thresholds.warning) * 0.4,
      status: 'AT_RISK',
    };
  }

  return { score: 0, status: 'CLEARED' };
}

/**
 * Evaluate availability risk
 */
function evaluateAvailability(availability: number): { score: number; status: 'AT_RISK' | 'BREACHED' | 'CLEARED' } {
  const thresholds = DEFAULT_THRESHOLDS.availability;

  if (availability <= thresholds.critical) {
    return {
      score: Math.min(1.0, (thresholds.warning - availability) / (thresholds.warning - thresholds.critical)),
      status: 'BREACHED',
    };
  }

  if (availability <= thresholds.warning) {
    return {
      score: 0.5 + (thresholds.warning - availability) / (thresholds.warning - thresholds.critical) * 0.4,
      status: 'AT_RISK',
    };
  }

  return { score: 0, status: 'CLEARED' };
}

/**
 * Get service-specific thresholds (placeholder for future configuration)
 */
export function getServiceThresholds(
  orgId: string,
  serviceName: string
): SLAThresholds {
  // TODO: Implement service-specific threshold configuration
  // For now, return defaults
  return DEFAULT_THRESHOLDS;
}
