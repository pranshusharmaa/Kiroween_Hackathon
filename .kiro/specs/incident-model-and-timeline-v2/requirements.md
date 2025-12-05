# Spec: Incident Model and Event-Sourced Timeline (v2)

## Overview

Define a robust, event-sourced incident model suitable for multi-tenant, production use.

This expands a simple incident model into:

- A canonical `Incident` aggregate
- An append-only `IncidentEvent` log as the single source of truth
- Derived read models / projections for:
  - `IncidentSnapshot` (current state)
  - `IncidentSignal` (alerts, metrics summaries)
  - `IncidentAction` (human/system actions)
  - `SLOViolation` entries

---

## Goals

- Provide a solid, auditable foundation for incidents.
- Support multi-tenant scaling and rich queries for the UI and intelligence engine.
- Make all incident state reconstructable from events.

---

## Non-Goals

- Real-time websockets/streaming (polling is OK for now).
- Full SLO management UI; we just model SLO violations and attach them.

---

## Core Concepts

### Incident Aggregate

Each incident exists within:

- `orgId`
- `projectId`
- `environment` (e.g., `prod`, `staging`)

`IncidentSnapshot` fields:

- `id` (UUID)
- `orgId`
- `projectId`
- `title`
- `serviceName`
- `status` (enum: `OPEN`, `INVESTIGATING`, `MITIGATED`, `RESOLVED`, `CANCELLED`)
- `severity` (enum: `SEV1`, `SEV2`, `SEV3`, `SEV4`)
- `createdAt`
- `updatedAt`
- `detectedBy` (e.g., `alert`, `user`, `external-system`)
- `primarySignalId` (the alert/metric that triggered it, optional)
- `runbookPath` (default runbook for this incident)
- `externalRefs` (JSON array; e.g., Jira issue IDs, PagerDuty incident IDs)
- `correlationKeys` (array of strings; see connectors spec)

This snapshot is derived entirely from the `IncidentEvent` stream.

---

## Event Sourcing Model

### IncidentEvent

Append-only table:

- `id` (UUID)
- `orgId`
- `incidentId`
- `ts`
- `type` (string enum)
- `payload` (JSONB with `version` field)

Event types (initial set):

- `INCIDENT_CREATED`
- `INCIDENT_UPDATED`
- `INCIDENT_STATUS_CHANGED`
- `INCIDENT_SEVERITY_CHANGED`
- `INCIDENT_TAG_ADDED`
- `INCIDENT_TAG_REMOVED`
- `INCIDENT_SIGNAL_INGESTED` (from connectors)
- `INCIDENT_NOTE_ADDED` (from humans)
- `INCIDENT_PLAYBOOK_ACTION_EXECUTED`
- `INCIDENT_SLO_VIOLATION_RECORDED`
- `INCIDENT_LINKED_TO_TICKET` (e.g., Jira, GitHub Issue)
- `INCIDENT_RESOLVED`

`payload` examples:

- `INCIDENT_CREATED`:
  - `title`, `serviceName`, `severity`, `environment`, `detectedBy`, `projectId`, optional `initialCorrelationKey`.

- `INCIDENT_STATUS_CHANGED`:
  - `oldStatus`, `newStatus`, `actorId`, `reason`.

- `INCIDENT_SIGNAL_INGESTED`:
  - `signalId`, `source`, `summary`, `severity`, `correlationKey`, `traceId?`.

All payload subtypes must include a `version` field for forwards compatibility.

---

## Derived Models

Derived tables are built from the event stream:

### IncidentSnapshot (read model)

Denormalized table for fast queries:

- Fields listed under Incident aggregate above.
- Projection logic:
  - Applies events in time order per incident.
  - Updates status, severity, correlationKeys, etc.
  - Updates `updatedAt` on each event.

### IncidentSignal

Summarized signals related to the incident (in addition to raw metrics/logs):

- `id`
- `incidentId`
- `orgId`
- `projectId`
- `signalType` (e.g., `ALERT`, `METRIC_SPIKE`, `ERROR_BURST`)
- `serviceName`
- `environment`
- `correlationKey`
- `traceId?`
- `source` (Grafana, Datadog, CloudWatch, internal)
- `summary` (short text)
- `data` (JSON; may contain metric IDs, alert payload, tags)
- `ts`

### IncidentAction

Human/system actions:

- `id`
- `incidentId`
- `orgId`
- `actorType` (`USER`, `SYSTEM`, `CONNECTOR`)
- `actorRef` (userId or system name)
- `actionKind` (`RUNBOOK_STEP_EXECUTED`, `ROLLBACK_TRIGGERED`, `SCALE_CHANGE`, `NOTE`, `STATUS_CHANGE`, etc.)
- `label`
- `details` (string/JSON)
- `ts`

### SLOViolation

Optional, but important for serious SRE use:

- `id`
- `incidentId`
- `orgId`
- `sloId`
- `windowStart`
- `windowEnd`
- `errorBudgetConsumed`
- `thresholdBreached` (bool)
- `details` (JSON)

---

## API Surface (Incident Service v2)

All routes must be scoped by `orgId` and enforce RBAC using IAS.

### List incidents (searchable, multi-tenant)

`GET /orgs/:orgId/incidents`

Query params:

- `projectId`
- `environment`
- `status[]`
- `severity[]`
- `searchQuery` (on title, serviceName, externalRefs)
- `sortBy` (createdAt, updatedAt, severity)
- `direction` (asc, desc)
- `limit` (page size)
- `cursor` (for pagination)

Response:

```json
{
  "incidents": [
    {
      "id": "inc_123",
      "orgId": "org_1",
      "projectId": "proj_checkout",
      "title": "Error rate spike in checkout",
      "serviceName": "checkout-api",
      "status": "OPEN",
      "severity": "SEV1",
      "createdAt": "...",
      "updatedAt": "...",
      "environment": "prod"
    }
  ],
  "nextCursor": "..."
}
