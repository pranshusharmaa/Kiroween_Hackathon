# Technical Steering – Runbook Revenant

## Language & frameworks

- Backend / API:
  - TypeScript + Node.js
  - Next.js App Router for API routes (or an equivalent Node HTTP framework if needed).
- Frontend:
  - Next.js (React) with TailwindCSS.
- Database:
  - PostgreSQL (primary transactional store).
  - Prisma as ORM and migration tool.

## Architectural style

- **Modular monolith** in v0.1:
  - Clear boundaries between modules (IAS, ITS, CIS, KRS, IGS) in a single repo and deployment.
  - Modules live under `src/modules/<serviceName>` and expose well-defined interfaces.
- Event-sourced **Incident & Timeline Service**:
  - Only append to `IncidentEvent`.
  - Maintain read models (`IncidentSnapshot`, `IncidentSignal`, `IncidentAction`, `SLOViolation`) via projections.

## Data storage & access

- PostgreSQL:
  - All tenant-scoped tables **must** include `orgId`.
  - Strong indexing on common query patterns (orgId, projectId, status, severity, createdAt, correlationKey).
- Prisma:
  - All models defined in `prisma/schema.prisma`.
  - Migrations kept in version control.
  - Use generated TypeScript types for domain models.

## Integration & connectors

- Connectors exposed as code modules under `src/modules/connectors`.
- Webhooks for inbound events:
  - `POST /connectors/:connectorId/webhook`.
- MCP servers for outbound/control-plane integration (GitHub, Jira, Slack, observability APIs).
- Normalization pipeline that converts external alerts/logs into a canonical `IngestedEvent.normalized` shape.

## Security & auth

- JWT/opaque tokens carrying:
  - `orgId`, `userId`, `roles`.
- All tenant-scoped APIs must:
  - Validate that the caller is a member of the org.
  - Enforce RBAC based on roles and spec rules.
- Secret management:
  - Connector secrets stored in a pluggable secret store (env vars or dev-only local table is acceptable for now, but design for Vault/KMS).

## Reliability & performance

- Use transactions where multiple tables must be updated together (events + projections).
- Keep `IncidentEvent` append-only and partition-friendly.
- Use pagination + cursors for incident listing and event listing.
- For v0.1, synchronous projection updates are acceptable; design with an eventual async projector in mind.

## Logging, metrics, and observability (for Runbook Revenant itself)

- Instrument the app with basic logs and metrics (request latency, error rates).
- If time permits, dogfood the incident engine on its own metrics (meta!).

## Testing strategy

- Unit tests for:
  - Command handlers (incident creation, status change, action addition).
  - Projection logic from `IncidentEvent` → read models.
  - Normalization logic for connectors.
- Integration tests for critical API flows.

## Kiro-specific technical guidance

- Kiro should:
  - Treat `src/modules/*` as the main boundary units.
  - Prefer generating pure, testable domain logic, then wrapping it in API handlers.
  - Keep infra-specific details (e.g., HTTP, DB) in adapters, not core logic.
