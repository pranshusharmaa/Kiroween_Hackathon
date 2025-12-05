# Quick Start Guide - Runbook Revenant

## Prerequisites
- Node.js 20+
- PostgreSQL running locally
- Docker (if using containerized Postgres)

## Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database
Your `.env` file should already have:
```
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/runbook_revenant?schema=public"
```

### 3. Initialize Database
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Seed demo data
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

Server will start at `http://localhost:3000`

## Demo Data

After seeding, you'll have:
- **User**: demo@runbookrevenant.dev (ORG_ADMIN)
- **Organization**: Demo Organization (slug: demo-org)
- **Projects**: Checkout Service, Search Service

## API Endpoints

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

### List Members
```bash
curl http://localhost:3000/api/orgs/{orgId}/memberships
```

## RBAC Roles

- **ORG_ADMIN**: Full control (org settings, billing, members, connectors)
- **SRE_LEAD**: Manage projects, incident thresholds, runbooks
- **ONCALL_ENGINEER**: View/act on incidents, create postmortems
- **VIEWER**: Read-only access

## Project Structure

```
src/
  app/api/orgs/              # API routes
  modules/identity/          # Identity & Access Service
  lib/db/                    # Database client
prisma/
  schema.prisma              # Database schema
  seed.js                    # Demo data seeding
```

## Common Tasks

### Reset Database
```bash
npm run db:push -- --force-reset
npm run db:seed
```

### View Database
```bash
npx prisma studio
```

### Check Logs
Development server logs include Prisma queries for debugging.

## Troubleshooting

### "Cannot reach database server"
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Verify port 5432 is not blocked

### "Module not found" errors
```bash
npm install
npm run db:generate
```

### API returns 401 Unauthorized
- Database might be empty
- Run `npm run db:seed` to create demo user

## Next Steps

1. Explore the API endpoints
2. Review `src/modules/identity/` for RBAC implementation
3. Check `IMPLEMENTATION_SUMMARY.md` for architecture details
4. Start building the Incident & Timeline Service (ITS)
