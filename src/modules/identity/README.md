# Identity & Access Service (IAS)

This module handles multi-tenant identity, authentication, and role-based access control (RBAC).

## Models

- **Organization**: Top-level tenant entity
- **User**: Individual users across all organizations
- **Membership**: Links users to organizations with specific roles
- **Project**: Services/projects within an organization

## Roles

- `ORG_ADMIN`: Full control over organization settings, billing, members, and connectors
- `SRE_LEAD`: Manage projects, incident severity thresholds, and runbooks
- `ONCALL_ENGINEER`: View and act on incidents, create postmortems
- `VIEWER`: Read-only access

## API Endpoints

### Organizations

- `GET /api/orgs` - List organizations for current user
- `POST /api/orgs` - Create new organization
- `GET /api/orgs/:orgId` - Get organization details

### Projects

- `GET /api/orgs/:orgId/projects` - List projects (requires membership)
- `POST /api/orgs/:orgId/projects` - Create project (requires ORG_ADMIN or SRE_LEAD)

### Memberships

- `GET /api/orgs/:orgId/memberships` - List members (requires membership)
- `POST /api/orgs/:orgId/memberships` - Add member (requires ORG_ADMIN)

## Setup

1. Ensure PostgreSQL is running
2. Set `DATABASE_URL` in `.env`
3. Run migrations: `npm run db:push`
4. Seed demo data: `npm run db:seed`

## Usage

```typescript
import { assertOrgMember, assertRole, getCurrentUser } from '@/modules/identity/service';

// In an API route
const user = await getCurrentUser();
await assertOrgMember(orgId, user.id);
await assertRole(orgId, user.id, ['ORG_ADMIN', 'SRE_LEAD']);
```
