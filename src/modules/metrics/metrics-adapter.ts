/**
 * Metrics Adapter
 * 
 * Provides an abstraction layer for fetching metrics from observability providers.
 * Currently uses simulated data, but designed to integrate with real providers
 * like Prometheus, Datadog, CloudWatch, etc.
 */

export interface MetricWindow {
  start: Date;
  end: Date;
}

export interface MetricSummary {
  p95LatencyMs: number;
  errorRate: number; // 0.0 to 1.0 (e.g., 0.05 = 5%)
}

export interface MetricsProvider {
  getMetricSummaryForServiceWindow(
    orgId: string,
    serviceName: string,
    environment: string,
    window: MetricWindow
  ): Promise<MetricSummary>;
}

/**
 * Simulated metrics provider for demo purposes.
 * In production, this would call actual observability APIs.
 */
class SimulatedMetricsProvider implements MetricsProvider {
  async getMetricSummaryForServiceWindow(
    orgId: string,
    serviceName: string,
    environment: string,
    window: MetricWindow
  ): Promise<MetricSummary> {
    // Simulate realistic baseline metrics
    const baseP95 = 150 + Math.random() * 100; // 150-250ms
    const baseErrorRate = 0.001 + Math.random() * 0.004; // 0.1-0.5%
    
    // Add some variance based on time window
    const windowDurationMs = window.end.getTime() - window.start.getTime();
    const isRecentWindow = Date.now() - window.end.getTime() < 30 * 60 * 1000; // Last 30 min
    
    // Recent windows might show degradation (simulating a deployment impact)
    const degradationFactor = isRecentWindow ? 1.2 + Math.random() * 0.3 : 1.0;
    
    return {
      p95LatencyMs: Math.round(baseP95 * degradationFactor),
      errorRate: Math.min(baseErrorRate * degradationFactor, 0.1), // Cap at 10%
    };
  }
}

/**
 * Factory function to get the appropriate metrics provider.
 * In the future, this could return different providers based on configuration.
 */
export function getMetricsProvider(): MetricsProvider {
  // TODO: Check environment variables or config to determine which provider to use
  // For now, always return simulated provider
  return new SimulatedMetricsProvider();
}

/**
 * Convenience function to get metric summary for a service window.
 */
export async function getMetricSummaryForServiceWindow(
  orgId: string,
  serviceName: string,
  environment: string,
  window: MetricWindow
): Promise<MetricSummary> {
  const provider = getMetricsProvider();
  return provider.getMetricSummaryForServiceWindow(orgId, serviceName, environment, window);
}
