# Connectors & Signal Correlation

## Connector Architecture

### Connector Types

1. **Push Connectors (Webhooks)**
   - External systems send events to our ingestion endpoints
   - Examples: PagerDuty webhooks, Datadog webhooks, Grafana alerts
   - Require webhook URL registration in external system
   - Handle authentication via shared secrets or API keys

2. **Pull Connectors (Polling)**
   - System periodically fetches data from external APIs
   - Examples: Prometheus queries, CloudWatch metrics
   - Require API credentials and polling intervals
   - Handle rate limiting and pagination

3. **Streaming Connectors**
   - Real-time event streams (Kafka, Kinesis, etc.)
   - Continuous data flow with offset management
   - Require consumer group configuration

### Connector Configuration

Each connector should store:
- **Type**: webhook, polling, streaming
- **Provider**: datadog, grafana, prometheus, pagerduty, etc.
- **Credentials**: API keys, tokens, secrets (encrypted)
- **Endpoint**: URL or connection string
- **Mapping Rules**: How to transform external events to internal signals
- **Enabled**: Active/inactive status
- **Organization**: Tenant isolation

## Event Normalization

### Raw Event Ingestion

```typescript
interface RawEvent {
  connectorId: string;
  receivedAt: Date;
  payload: unknown; // Provider-specific format
  headers?: Record<string, string>;
}
```

### Normalized Signal Format

All external events should be normalized to a common format:

```typescript
interface NormalizedSignal {
  // Identity
  signalId: string;
  connectorId: string;
  externalId?: string; // Provider's event ID
  
  // Classification
  type: 'alert' | 'metric' | 'log' | 'trace' | 'event';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  
  // Content
  title: string;
  description?: string;
  source: string; // Service or component name
  
  // Correlation
  correlationKey?: string; // For grouping related signals
  traceId?: string; // Distributed trace ID
  spanId?: string;
  
  // Context
  tags: Record<string, string>; // key-value metadata
  timestamp: Date;
  
  // Links
  externalUrl?: string; // Link back to provider
  rawPayload: unknown; // Original event for reference
}
```

### Normalization Rules

Each connector type has specific mapping rules:

**Datadog Alert Example:**
```typescript
{
  title: event.title,
  severity: mapDatadogPriority(event.priority),
  source: event.tags.service || 'unknown',
  correlationKey: event.aggregation_key,
  traceId: event.tags.trace_id,
  tags: event.tags,
  externalUrl: event.url
}
```

**Grafana Alert Example:**
```typescript
{
  title: alert.title,
  severity: mapGrafanaState(alert.state),
  source: alert.labels.service || alert.labels.job,
  correlationKey: alert.fingerprint,
  tags: alert.labels,
  externalUrl: alert.generatorURL
}
```

## Signal Correlation

### Correlation Strategies

1. **Explicit Correlation Keys**
   - Use provider-supplied correlation IDs
   - Examples: Datadog aggregation_key, Grafana fingerprint
   - Group signals with matching correlation keys

2. **Trace-Based Correlation**
   - Use distributed trace IDs to link signals
   - Connect frontend errors to backend failures
   - Build causal chains across services

3. **Temporal Correlation**
   - Group signals occurring within time window (e.g., 5 minutes)
   - Same service or related services
   - Similar error patterns or symptoms

4. **Service Topology Correlation**
   - Use service dependency graph
   - Correlate upstream/downstream failures
   - Identify cascading failures

### Correlation Algorithm

```typescript
async function correlateSignal(signal: NormalizedSignal): Promise<string | null> {
  // 1. Check for explicit correlation key
  if (signal.correlationKey) {
    const existing = await findIncidentByCorrelationKey(signal.correlationKey);
    if (existing) return existing.id;
  }
  
  // 2. Check for trace ID match
  if (signal.traceId) {
    const existing = await findIncidentByTraceId(signal.traceId);
    if (existing) return existing.id;
  }
  
  // 3. Temporal + service correlation
  const timeWindow = 5 * 60 * 1000; // 5 minutes
  const candidates = await findRecentIncidents({
    service: signal.source,
    since: new Date(signal.timestamp.getTime() - timeWindow),
    status: ['open', 'investigating']
  });
  
  if (candidates.length > 0) {
    // Use similarity scoring to find best match
    const match = findBestMatch(signal, candidates);
    if (match.score > CORRELATION_THRESHOLD) {
      return match.incidentId;
    }
  }
  
  // 4. No correlation found - create new incident
  return null;
}
```

### Correlation Confidence

Track confidence level for correlations:
- **High**: Explicit correlation key or trace ID match
- **Medium**: Temporal + service match with high similarity
- **Low**: Weak temporal correlation only

Allow manual override of correlation decisions.

## Incident Creation from Signals

### Auto-Incident Rules

Define rules for when signals should create incidents:

```typescript
interface IncidentCreationRule {
  name: string;
  conditions: {
    signalType?: string[];
    severity?: string[];
    source?: string[];
    tagMatches?: Record<string, string>;
  };
  incidentTemplate: {
    title: string; // Can use template variables
    severity: string;
    assignTo?: string; // Team or user
    runbookId?: string;
  };
  enabled: boolean;
}
```

Example rule:
```typescript
{
  name: "Critical API errors",
  conditions: {
    severity: ["critical"],
    source: ["api-gateway"],
    tagMatches: { "error_type": "5xx" }
  },
  incidentTemplate: {
    title: "Critical API Gateway errors detected",
    severity: "sev-1",
    assignTo: "backend-oncall",
    runbookId: "api-gateway-5xx"
  }
}
```

### Signal Attachment

When a signal correlates to an existing incident:
1. Attach signal to incident timeline
2. Update incident severity if signal is more severe
3. Notify responders of new signal
4. Re-evaluate incident status

When no correlation found:
1. Check auto-incident rules
2. Create incident if rules match
3. Otherwise, store signal for manual review

## Connector Health & Monitoring

### Health Checks
- Verify connector connectivity periodically
- Track last successful event received
- Alert on connector failures or stale data
- Monitor ingestion rate and latency

### Metrics to Track
- Events received per connector
- Normalization success/failure rate
- Correlation hit rate
- Incident creation rate
- Signal-to-incident ratio

### Error Handling
- Retry failed normalizations with exponential backoff
- Dead letter queue for unparseable events
- Alert admins on repeated connector failures
- Graceful degradation when connectors are down
# Connectors, Ingestion, and Correlation Steering

## Connector philosophy

- Connectors are responsible for:
  - Fetching or receiving events from external systems (observability, issue trackers, chat).
  - Normalizing those events into a canonical shape.
  - Handing normalized events to the Incident & Timeline Service for mapping.

- Each connector type has:
  - A configuration model (orgId, projectId?, type, displayName, config JSON).
  - A secrets reference (e.g., token ID) that resolves to stored credentials.

## Normalized event shape

All ingested events must be normalized to a common structure before mapping:

```ts
type NormalizedEvent = {
  orgId: string;
  connectorId: string;
  serviceName: string;
  environment: string;
  severity: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  message: string;
  traceId?: string;
  requestId?: string;
  correlationKey: string;  // required
  sourceType: string;      // e.g. GRAFANA_ALERT, DATADOG_ALERT, CLOUDWATCH_ALARM
  context: Record<string, unknown>;
  occurredAt: Date;
};
