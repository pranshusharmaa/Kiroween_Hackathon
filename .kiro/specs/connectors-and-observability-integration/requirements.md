
---

### 3. `.kiro/specs/connectors-and-observability-integration.md`

```md
# Spec: Connectors and Observability Integration

## Overview

Define how Runbook Revenant integrates with external systems via connectors and MCP:

- Connector configuration per org/project
- Ingestion pipeline for alerts/log-type events
- Normalization and correlation (serviceName, env, traceId, correlationKey)
- Mapping normalized events to incidents

This spec focuses on the Connector & Ingestion Service (CIS).

---

## Goals

- Provide a consistent way to plug in multiple external tools (observability, issue trackers, chat).
- Normalize all ingested events into a single **NormalizedEvent** shape.
- Smartly attach events to existing incidents or create new ones using correlation.
- Use MCP where possible for outbound calls to external APIs.

---

## Non-Goals

- Full observability stack (we integrate with Grafana/Datadog/CloudWatch/etc., not replace them).
- Fully generic ETL system: connectors can be opinionated and tuned for incidents.

---

## Connector Types

Initial categories:

1. **Issue & Code Systems**
   - GitHub, GitLab, Jira.

2. **Alerting & Observability**
   - Grafana, Datadog, CloudWatch, Prometheus-compatible alerts.

3. **Communication**
   - Slack (and optionally Teams).

Each connector has:

- `id`
- `orgId`
- `projectId?` (optional, if scoped to one project)
- `type` (e.g., `GITHUB`, `JIRA`, `GRAFANA`, `DATADOG`, `SLACK`, `DEMO_OBS`)
- `displayName`
- `config` (JSON; includes mapping rules, endpoints, IDs)
- `secretsRef` (pointer to stored credentials, not raw secret)
- `createdAt`

---

## Ingestion Model

### IngestedEvent

Raw ingestion record:

- `id`
- `orgId`
- `connectorId`
- `sourceType` (e.g., `GRAFANA_ALERT`, `DATADOG_ALERT`, `CLOUDWATCH_ALARM`, `SLACK_MESSAGE`)
- `externalId` (ID on the remote system, if available)
- `receivedAt`
- `payload` (raw JSON)
- `normalized` (JSON) — see below

### NormalizedEvent

All ingested events must be normalized to:

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
  correlationKey: string;     // required
  sourceType: string;         // e.g. GRAFANA_ALERT, DATADOG_ALERT
  context: Record<string, unknown>;
  occurredAt: Date;
};
