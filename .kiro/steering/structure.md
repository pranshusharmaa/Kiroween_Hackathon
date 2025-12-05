# Code Structure Steering – Runbook Revenant

## High-level directory structure

Expected layout (TypeScript + Next.js):

```text
src/
  app/                    # Next.js routes (UI + API)
    api/
      orgs/[orgId]/...    # Org-scoped APIs (incidents, connectors, intelligence)
    orgs/[orgSlug]/...    # Frontend pages for org dashboards
  modules/
    identity/             # IAS: orgs, users, memberships, RBAC
    incidents/            # ITS: incident events, projections, queries, commands
    connectors/           # CIS: connectors config, ingestion, normalization
    knowledge/            # KRS: runbooks, postmortems, search
    intelligence/         # IGS: guidance, suggestions, related incidents, postmortems
  lib/
    db/                   # Prisma client, database helpers
    http/                 # Common HTTP helpers, error handling
    mcp/                  # Wrappers for MCP tools (GitHub/Jira/Slack etc.)
prisma/
  schema.prisma           # Database schema
  migrations/             # Prisma migrations
.kiro/
  steering/               # These steering files
  specs/                  # Specs for each service & feature
  hooks/                  # Agent hooks
  settings/               # Kiro/MCP settings
