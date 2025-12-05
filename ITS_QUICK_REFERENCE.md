# Incident & Timeline Service - Quick Reference

## API Endpoints

### List Incidents
```
GET /api/orgs/:orgId/incidents
```

**Query Parameters:**
- `projectId` - Filter by project
- `environment` - Filter by environment (production, staging, etc.)
- `status` - Filter by status (can specify multiple)
- `severity` - Filter by severity (can specify multiple)
- `searchQuery` - Search in title and serviceName
- `sortBy` - Sort field (createdAt, updatedAt, severity)
- `direction` - Sort direction (asc, desc)
- `limit` - Page size (default: 50)
- `cursor` - Pagination cursor

**Example:**
```bash
curl "http://localhost:3000/api/orgs/{orgId}/incidents?status=OPEN&severity=SEV1&limit=10"
```

### Create Incident
```
POST /api/orgs/:orgId/incidents
```

**Body:**
```json
{
  "projectId": "string",
  "title": "string",
  "serviceName": "string",
  "severity": "SEV1|SEV2|SEV3|SEV4",
  "environment": "string",
  "detectedBy": "string",
  "initialCorrelationKey": "string (optional)",
  "runbookPath": "string (optional)"
}
```

### Get Incident Details
```
GET /api/orgs/:orgId/incidents/:incidentId
```

**Returns:** Incident with signals and actions timeline

### Change Status
```
POST /api/orgs/:orgId/incidents/:incidentId/status
```

**Requires:** SRE_LEAD or ONCALL_ENGINEER role

**Body:**
```json
{
  "newStatus": "OPEN|INVESTIGATING|MITIGATED|RESOLVED|CANCELLED",
  "reason": "string (optional)"
}
```

### Change Severity
```
POST /api/orgs/:orgId/incidents/:incidentId/severity
```

**Requires:** ORG_ADMIN or SRE_LEAD role

**Body:**
```json
{
  "newSeverity": "SEV1|SEV2|SEV3|SEV4",
  "reason": "string (optional)"
}
```

### Add Action
```
POST /api/orgs/:orgId/incidents/:incidentId/actions
```

**Body:**
```json
{
  "actionKind": "NOTE|RUNBOOK_STEP_EXECUTED|ROLLBACK_TRIGGERED|SCALE_CHANGE|etc",
  "label": "string",
  "details": "string (optional)"
}
```

### Attach Signal
```
POST /api/orgs/:orgId/incidents/:incidentId/signals
```

**Body:**
```json
{
  "signalType": "ALERT|METRIC_SPIKE|ERROR_BURST|LOG_PATTERN|TRACE_ANOMALY",
  "serviceName": "string",
  "environment": "string",
  "source": "string",
  "summary": "string",
  "correlationKey": "string (optional)",
  "traceId": "string (optional)",
  "data": {} (optional)
}
```

## Incident Lifecycle

```
OPEN → INVESTIGATING → MITIGATED → RESOLVED
  ↓
CANCELLED
```

## Severity Levels

- **SEV1**: Critical outage or data loss affecting all users
- **SEV2**: Major functionality degraded, affecting significant user subset
- **SEV3**: Minor functionality impaired, workarounds available
- **SEV4**: Cosmetic issues or minimal impact

## Event Types

All incident mutations create events in the append-only event stream:

1. `INCIDENT_CREATED` - Incident created
2. `INCIDENT_STATUS_CHANGED` - Status transition
3. `INCIDENT_SEVERITY_CHANGED` - Severity changed
4. `INCIDENT_SIGNAL_INGESTED` - Signal attached
5. `INCIDENT_NOTE_ADDED` - Note added
6. `INCIDENT_PLAYBOOK_ACTION_EXECUTED` - Action executed
7. `INCIDENT_SLO_VIOLATION_RECORDED` - SLO violation recorded
8. `INCIDENT_LINKED_TO_TICKET` - External ticket linked
9. `INCIDENT_RESOLVED` - Incident resolved

## Module Functions

### Commands (src/modules/incidents/commands.ts)
```typescript
createIncident(input: CreateIncidentInput): Promise<string>
changeIncidentStatus(orgId, incidentId, input: ChangeStatusInput): Promise<void>
changeIncidentSeverity(orgId, incidentId, input: ChangeSeverityInput): Promise<void>
addIncidentAction(orgId, incidentId, input: AddActionInput): Promise<void>
attachSignal(orgId, incidentId, input: AttachSignalInput): Promise<void>
```

### Queries (src/modules/incidents/queries.ts)
```typescript
listIncidents(orgId, filters: ListIncidentsFilters): Promise<{incidents, nextCursor}>
getIncidentWithDetails(orgId, incidentId): Promise<IncidentWithDetails | null>
getIncidentEvents(orgId, incidentId): Promise<Event[]>
getIncidentsByCorrelationKey(orgId, correlationKey): Promise<IncidentSnapshot[]>
getRecentIncidentsForService(orgId, serviceName, limit): Promise<IncidentSnapshot[]>
```

## Database Models

### IncidentEvent (Append-only)
- Source of truth for all incident state
- Never updated or deleted
- Used to reconstruct incident state

### IncidentSnapshot (Projection)
- Current state of incident
- Derived from event stream
- Optimized for queries

### IncidentSignal
- Observability signals (alerts, metrics, logs)
- Linked to incidents
- Supports correlation and tracing

### IncidentAction
- Human and system actions
- Timeline of incident response
- Tracks who did what when

### SLOViolation
- Links incidents to SLO breaches
- Tracks error budget consumption
- Supports SRE metrics

## RBAC Rules

| Action | Required Role |
|--------|--------------|
| View incidents | Any org member |
| Create incident | Any org member |
| Add action/note | Any org member |
| Change status | SRE_LEAD, ONCALL_ENGINEER, ORG_ADMIN |
| Change severity | SRE_LEAD, ORG_ADMIN |
| Attach signal | Any org member |

## Example Workflow

1. **Incident Detected**
   ```bash
   POST /api/orgs/{orgId}/incidents
   # Creates incident with status=OPEN
   ```

2. **Team Acknowledges**
   ```bash
   POST /api/orgs/{orgId}/incidents/{id}/status
   # Changes to INVESTIGATING
   ```

3. **Add Investigation Notes**
   ```bash
   POST /api/orgs/{orgId}/incidents/{id}/actions
   # Adds NOTE actions
   ```

4. **Attach Related Signals**
   ```bash
   POST /api/orgs/{orgId}/incidents/{id}/signals
   # Links observability data
   ```

5. **Apply Mitigation**
   ```bash
   POST /api/orgs/{orgId}/incidents/{id}/status
   # Changes to MITIGATED
   ```

6. **Resolve Incident**
   ```bash
   POST /api/orgs/{orgId}/incidents/{id}/status
   # Changes to RESOLVED
   ```

## Correlation & Tracing

Incidents support correlation via:
- **Correlation Keys**: Group related signals (e.g., alert fingerprints)
- **Trace IDs**: Link to distributed traces
- **Service Names**: Group by affected service

Query incidents by correlation:
```typescript
getIncidentsByCorrelationKey(orgId, 'api-gw-500-spike')
```

## Event Sourcing

All incident state is reconstructable from events:

```typescript
// Get raw event stream
const events = await getIncidentEvents(orgId, incidentId);

// Replay events to rebuild state
let state = {};
for (const event of events) {
  state = applyEventToSnapshot(event, state);
}
```

This enables:
- Complete audit trail
- Time-travel debugging
- State reconstruction
- Event replay for testing
