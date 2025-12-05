// Connector & Ingestion Service (CIS) Types

export interface DataPathFeatures {
  route?: string;           // HTTP route, topic, queue name
  accountId?: string;       // Business account identifier
  customerId?: string;      // Customer identifier
  orderId?: string;         // Order/transaction identifier
  userId?: string;          // User identifier
  tenantId?: string;        // Tenant identifier
  [key: string]: string | undefined;
}

export interface NormalizedEvent {
  id: string;
  orgId: string;
  projectId: string;
  serviceName: string;
  environment: string;
  eventType: string;
  source: string;
  timestamp: Date;
  correlationKey?: string;
  traceId?: string;
  dataPathKey?: string;     // Stable business flow identifier
  dataPathFeatures?: DataPathFeatures;
  metrics?: {
    errorRate?: number;
    latency?: number;
    throughput?: number;
    availability?: number;
  };
  logs?: Array<{
    level: string;
    message: string;
    timestamp: Date;
  }>;
  metadata: Record<string, unknown>;
}

export interface SLAWatchUpdate {
  orgId: string;
  projectId: string;
  serviceName: string;
  environment: string;
  correlationKey?: string;
  dataPathKey?: string;
  status: 'AT_RISK' | 'BREACHED' | 'CLEARED';
  riskScore: number;
  source: string;
  logsSnapshot: Array<{
    level: string;
    message: string;
    timestamp: Date;
  }>;
}

export interface SLAWatchEntry {
  id: string;
  orgId: string;
  projectId: string;
  serviceName: string;
  environment: string;
  correlationKey: string | null;
  status: string;
  riskScore: number;
  source: string;
  logsSnapshot: unknown;
  firstDetectedAt: Date;
  lastUpdatedAt: Date;
}

// SLA Thresholds (configurable per service)
export interface SLAThresholds {
  errorRate: {
    warning: number; // e.g., 0.01 (1%)
    critical: number; // e.g., 0.05 (5%)
  };
  latency: {
    warning: number; // e.g., 500ms
    critical: number; // e.g., 1000ms
  };
  availability: {
    warning: number; // e.g., 0.99 (99%)
    critical: number; // e.g., 0.95 (95%)
  };
}
