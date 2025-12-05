# Service Architecture Steering – Runbook Revenant

## Logical services

The code should be organized as if these services existed as separate deployables, even if they share a monolith:

1. **Identity & Access Service (IAS)**
   - Owns organizations, users, memberships, roles, auth tokens.
   - Responsible for RBAC checks and org-scoping logic.

2. **Incident & Timeline Service (ITS)**
   - Owns incident events, snapshots, signals, actions, SLO violations.
   - Responsible for all incident mutations and queries.
   - Implements event sourcing and projections.

3. **Connector & Ingestion Service (CIS)**
   - Owns connectors, ingestion endpoints, event normalization and mapping.
   - Responsible for turning external alerts/logs into internal signals and incidents.

4. **Knowledge & Runbook Service (KRS)**
   - Owns runbook and postmortem storage and search.
   - Builds knowledge graphs or indexes relating services, incidents, and mitigations.

5. **Intelligence & Guidance Service (IGS)**
   - Owns guidance generation, postmortem drafting, related-incident suggestions.
   - Responsible for connecting Kiro + MCP tools to the internal domain model.
   - Does not perform direct DB writes; uses module APIs.

6. **API Gateway & Web App**
   - Exposes a REST (or GraphQL) interface to clients.
   - Handles HTTP-specific concerns (auth, routing, serialization).
   - Web UI lives here and calls the service modules.

## Cross-service contracts

- IAS provides:
  - `getUser(orgId, userId)` and `getRoles(orgId, userId)`.
  - Helpers to enforce “is member of org / has role” checks.

- ITS provides:
  - Command API:
    - `createIncident`, `updateIncidentStatus`, `addIncidentAction`, `attachSignal`, etc.
  - Query API:
    - `listIncidents`, `getIncidentWithDetails`.

- CIS provides:
  - `handleIngestedEvent(connectorId, rawPayload)`.
  - Normalization helpers:
    - `normalizeAlert(raw, connectorType)` → normalized with correlationKey and traceId.
    - `mapNormalizedEventToIncident(normalized)` → incidentId.

- KRS provides:
  - `getRunbookForService(orgId, serviceName)` → markdown text.
  - `getPostmortems(orgId, filters)` and `savePostmortem`.

- IGS provides:
  - `getGuidanceForIncident(orgId, incidentId)`.
  - `generatePostmortem(orgId, incidentId, options)`.
  - `findRelatedIncidents(orgId, incidentId)`.

## Module-level constraints

- Avoid circular dependencies:
  - IAS should not depend on ITS/CIS/KRS/IGS.
  - ITS should depend only on IAS (for RBAC), not on intelligence or connectors.
  - CIS depends on ITS to attach signals / create incidents, and on IAS for org scoping.
  - KRS depends on ITS only via IDs, not vice versa.
  - IGS may depend on ITS, KRS, CIS (for context), but must not own persistence.

- When Kiro creates new modules or files:
  - Place domain logic in `src/modules/<service>` and keep API handlers thin.
  - Respect these directional dependencies.

## Future split

- The code should be written so that:
  - CIS and IGS can be moved to separate processes:
    - Use well-defined interfaces that can later be converted into HTTP/gRPC calls or message bus topics.
  - Projections (for incidents) can be run asynchronously via a queue.
