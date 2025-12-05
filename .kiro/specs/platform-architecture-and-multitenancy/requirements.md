# Spec: Platform Architecture and Multitenancy

## Overview

Runbook Revenant is a multi-tenant incident copilot for SRE + platform teams.

This spec defines the **platform-level architecture**:

- Multi-tenant model (organizations, users, projects/services)
- Authentication and RBAC
- Core services and boundaries
- Tech stack expectations
- Non-functional requirements (NFRs)

Other specs (incident model, connectors, intelligence) depend on this one.

---

## Goals

- Provide a clean, opinionated **multi-tenant foundation** for all other services.
- Ensure strict **org isolation** with a clear RBAC model.
- Keep the codebase in a **modular monolith** layout with service boundaries that can be split later.
- Make it easy for other modules (incidents, connectors, intelligence) to call identity/RBAC helpers.

---

## Non-Goals

- Full-featured auth provider (SSO, OAuth, etc.) — dev-friendly local auth is fine for now.
- Billing implementation — just model the concept of plans.
- User management UI — can be basic or stubbed for this project.

---

## High-Level Architecture

Target a **modular service architecture**, deployable as:

- A single monolith for small teams
- Or split services for scaling in future

Core logical services:

1. **Identity & Access Service (IAS)**
   - Organizations, users, roles, API tokens, SSO integration (future).

2. **Incident & Timeline Service (ITS)**
   - Source of truth for incidents, signals, timelines, and states.
   - Event-sourced timeline (see incident-model spec).

3. **Connector & Ingestion Service (CIS)**
   - Manages connectors to external tools (GitHub, Jira, Slack, Grafana, CloudWatch, Datadog, etc.).
   - Normalizes ingested events (alerts, logs, metrics summaries).

4. **Knowledge & Runbook Service (KRS)**
   - Stores runbooks, postmortems, and a graph of relationships.
   - Provides search + retrieval for intelligence engine.

5. **Intelligence & Guidance Service (IGS)**
   - Uses Kiro + MCP + runbooks/incidents to:
     - Generate suggestions
     - Build postmortems
     - Surface related incidents.

6. **API Gateway & Web App**
   - API gateway exposing REST/GraphQL to the UI and external integrations.
   - Web dashboard for human users.

For now, code may live in a single repo, but modules must reflect these boundaries so they can be split later.

---

## Multitenancy Model

### Entities

- `Organization`
  - `id`
  - `name`
  - `slug`
  - `billingPlan` (string or enum)
  - `createdAt`

- `User`
  - `id`
  - `email`
  - `name`
  - `authProvider` (e.g., `local`, `google`, `sso`)
  - `createdAt`
  - Many-to-many with `Organization` via `Membership`.

- `Membership`
  - `id`
  - `orgId`
  - `userId`
  - `role` (see RBAC below)
  - `createdAt`

- `Project` (or `ServiceGroup`)
  - `id`
  - `orgId`
  - `name`
  - `slug`
  - `environments` (e.g., `["prod","staging"]` or simple enum)
  - `defaultRunbookPath` (for that service)
  - `createdAt`

**Constraint:**  
All tenant-specific resources (incidents, connectors, runbooks, alerts, etc.) **must** reference `orgId` and usually `projectId`.

---

## RBAC

Roles (per Organization):

- `ORG_ADMIN`
  - Manage org settings, billing, members, connectors.
- `SRE_LEAD`
  - Manage projects, incident severity thresholds, runbooks.
- `ONCALL_ENGINEER`
  - View and act on incidents, create postmortems.
- `VIEWER`
  - Read-only access.

RBAC rules:

- Only `ORG_ADMIN` can add/remove members and change billing.
- Only `ORG_ADMIN` or `SRE_LEAD` can create/update connectors for the org.
- Only `SRE_LEAD` and `ONCALL_ENGINEER` can perform actions that alter incident state (status, severity, actions).
- Anyone with membership in an org can view incidents within that org.

Implementation:

- Use JWT/opaque tokens containing `orgId`, `userId`, and `roles` array.
- All incident- and connector-related APIs must:
  - Verify the caller is a member of the target `orgId`.
  - Enforce role requirements from the rules above.

---

## API Requirements (IAS)

### 1. Org & project management

- `GET /orgs`
  - Returns orgs the current user belongs to.

- `GET /orgs/:orgId`
  - Returns org details, membership, and role for current user.

- `POST /orgs`
  - For now, seeded / admin-only; may be used by setup scripts.

- `GET /orgs/:orgId/projects`
  - List projects within the org.

- `POST /orgs/:orgId/projects`
  - Create project (ORG_ADMIN or SRE_LEAD).

### 2. Membership & RBAC

- `GET /orgs/:orgId/memberships`
- `POST /orgs/:orgId/memberships`
  - Add member with specific role (ORG_ADMIN only).

- `PATCH /orgs/:orgId/memberships/:id`
  - Change role (ORG_ADMIN only).

---

## Non-Functional Requirements

- **Security**
  - All external credentials (e.g., API tokens) stored encrypted (KMS/Vault in real; acceptable dev placeholder).
  - Strict org isolation: no leakage of incidents across orgs.

- **Scalability**
  - Should scale to:
    - 100s of orgs
    - 1,000s of incidents per org
    - 10,000s of timeline events per incident.
  - Use an append-only event/timeline table with partitioning strategy for incidents.

- **Reliability**
  - Incident data is critical; all writes must be durable (transactional DB).
  - Ingestion service must handle retries and backoff for external APIs.

- **Auditability**
  - All user-driven changes to incidents (status, severity, tags) must be auditable via events.

---

## Tech Stack Expectations

- Backend: TypeScript (Node).
- API Gateway: REST (Next.js API routes or similar).
- Database: PostgreSQL with proper indexes and Prisma ORM.
- Queue/Event bus (for ingestion & async projections, later): Kafka/NATS/RabbitMQ (design for it).
- MCP: used for external tool access wrappers (GitHub, Jira, Slack, observability).

---

## Design

- Implement IAS as `src/modules/identity`:
  - Prisma models: `Organization`, `User`, `Membership`, `Project`.
  - Domain functions:
    - `getUserWithMemberships(userId)`
    - `assertOrgMember(orgId, userId)`
    - `assertRole(orgId, userId, requiredRole)`

- API handlers under:
  - `src/app/api/orgs/route.ts` (list/create orgs)
  - `src/app/api/orgs/[orgId]/projects/route.ts`
  - `src/app/api/orgs/[orgId]/memberships/route.ts`

All other services must call identity helpers rather than touching membership tables directly.

---

## Implementation Notes

- Provide a **seed script** that:
  - Creates one `Organization` (slug: `demo-org`).
  - Creates one `User` and `Membership` with `ORG_ADMIN`.
  - Creates two `Project`s (`checkout`, `search`).

- Provide a simple `getCurrentUser()` helper (initially hardcoded to the seeded user for demo), later wired to real auth.

---

## Test Scenarios

1. User with `ORG_ADMIN` role can create projects and add members.
2. User with `SRE_LEAD` can create projects but not change org billing.
3. `ONCALL_ENGINEER` can view projects but not manage members.
4. APIs reject access to orgs where the user has no membership.
