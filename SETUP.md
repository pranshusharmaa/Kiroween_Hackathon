# Runbook Revenant - Platform Setup

## What's Been Implemented

### Prisma Models (Identity & Access Service)

Created the following models in `prisma/schema.prisma`:

- **Organization**: Multi-tenant top-level entity with name, slug, and billing plan
- **User**: Individual users with email, name, and auth provider
- **Membership**: Links users to organizations with RBAC roles
- **Project**: Services/projects within organizations with environments

### Identity Module (`src/modules/identity/`)

- **types.ts**: Role definitions and type interfaces
- **service.ts**: Core identity functions:
  - `getUserWithMemberships()` - Get user with all org memberships
  - `assertOrgMember()` - Verify user belongs to org
  - `assertRole()` - Verify user has required role(s)
  - `getUserRole()` - Get user's role in org
  - `hasAnyRole()` - Check if user has any of specified roles
  - `getCurrentUser()` - Demo helper (returns first user)

### API Routes (`src/app/api/orgs/`)

#### Organizations
- `GET /api/orgs` - List orgs for current user
- `POST /api/orgs` - Create new org (creates membership with ORG_ADMIN)
- `GET /api/orgs/:orgId` - Get org details with user's role

#### Projects
- `GET /api/orgs/:orgId/projects` - List projects (requires membership)
- `POST /api/orgs/:orgId/projects` - Create project (requires ORG_ADMIN or SRE_LEAD)

#### Memberships
- `GET /api/orgs/:orgId/memberships` - List members (requires membership)
- `POST /api/orgs/:orgId/memberships` - Add member (requires ORG_ADMIN)

### RBAC Roles

- **ORG_ADMIN**: Full control (org settings, billing, members, connectors)
- **SRE_LEAD**: Manage projects, incident thresholds, runbooks
- **ONCALL_ENGINEER**: View/act on incidents, create postmortems
- **VIEWER**: Read-only access

### Database Helpers

- `src/lib/db/client.ts` - Prisma client singleton with dev logging

### Seed Script

- `prisma/seed.ts` - Creates demo data:
  - Demo user: `demo@runbookrevenant.dev`
  - Demo org: `demo-org` (slug)
  - Membership with ORG_ADMIN role
  - Two projects: `checkout` and `search`

## Setup Instructions

### Prerequisites

- Node.js 20+
- PostgreSQL database running

### Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure database**
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your PostgreSQL connection string

3. **Generate Prisma client**
   ```bash
   npm run db:generate
   ```

4. **Push schema to database**
   ```bash
   npm run db:push
   ```

5. **Seed demo data**
   ```bash
   npm run db:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## Testing the APIs

### List Organizations
```bash
curl http://localhost:3000/api/orgs
```

### Get Organization Details
```bash
curl http://localhost:3000/api/orgs/{orgId}
```

### List Projects
```bash
curl http://localhost:3000/api/orgs/{orgId}/projects
```

### Create Project
```bash
curl -X POST http://localhost:3000/api/orgs/{orgId}/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Payment Service",
    "slug": "payment",
    "environments": ["production", "staging"],
    "defaultRunbookPath": "/runbooks/payment.md"
  }'
```

### List Memberships
```bash
curl http://localhost:3000/api/orgs/{orgId}/memberships
```

## Architecture Notes

### Tenant Isolation

- All tenant-scoped resources MUST include `orgId`
- All APIs verify user membership before allowing access
- Role-based access control enforced at API layer

### Module Boundaries

- Identity module is independent (no dependencies on other services)
- Other services will depend on Identity for RBAC checks
- Clean separation allows future service splitting

### Security

- JWT/token auth to be implemented (currently using demo user)
- All org-scoped APIs enforce membership checks
- Role requirements enforced per endpoint
- Secrets will be encrypted (placeholder for now)

## Next Steps

1. Implement JWT authentication
2. Add incident models (ITS module)
3. Add connector models (CIS module)
4. Add runbook/postmortem models (KRS module)
5. Implement intelligence service (IGS module)
