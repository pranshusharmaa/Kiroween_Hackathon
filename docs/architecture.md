# Runbook Revenant Architecture 🎃

## Overview

Runbook Revenant is a multi-tenant incident copilot built as a **modular monolith** with clear service boundaries. The architecture emphasizes event sourcing for incident management, proactive SLA monitoring, and AI-powered guidance—all while maintaining strict tenant isolation and following SRE best practices.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Web Application                          │
│              (Next.js App Router + React)                    │
│                   TailwindCSS Styling                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│         (Next.js API Routes + Authentication)                │
│              JWT Tokens + RBAC Enforcement                   │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│     IAS      │   │     ITS      │   │     CIS      │
│   Identity   │   │  Incidents   │   │  Connectors  │
│   & Access   │   │  & Timeline  │   │  & Ingestion │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│     KRS      │   │     IGS      │   │  PostgreSQL  │
│  Knowledge   │   │ Intelligence │   │   Database   │
│  & Runbooks  │   │  & Guidance  │   │   (Prisma)   │
└──────────────┘   └──────────────┘   └──────────────┘
                            │
                            ▼
                   ┌──────────────┐
                   │     MCP      │
                   │  Connectors  │
                   │ (GitHub/etc) │
                   └──────────────┘
```

## Core Data Flow: From Alert to Postmortem

### 1. Signal Ingestion (CIS)
```
External Alert (Grafana/Datadog)
    ↓
Webhook Endpoint: POST /connectors/:id/webhook
    ↓
Raw Event Received
    ↓
Normalization Pipeline
    ↓
NormalizedEvent {
  orgId, serviceName, environment,
  metrics: { errorRate, latency, availability },
  logs: [...],
  correlationKey, traceId
}
```

### 2. Risk Evaluation (CIS)
```
NormalizedEvent
    ↓
Risk Evaluator
    ↓
Compare metrics against SLA thresholds:
  - Error Rate: warning 1%, critical 5%
  - Latency: warning 500ms, critical 1000ms
  - Availability: warning 99%, critical 95%
    ↓
Calculate Risk Score (0.0-1.0)
    ↓
Determine Status: AT_RISK | BREACHED | CLEARED
    ↓
Upsert SLAWatchEntry
    ↓
Display in Watchlist Sidebar 🎃
```

### 3. Incident Correlation (CIS → ITS)
```
NormalizedEvent
    ↓
Correlation Engine:
  1. Check correlationKey match
  2. Check traceId match
  3. Check temporal + service match (5min window)
    ↓
Match Found?
  YES → Attach to existing incident
  NO  → Create new incident
    ↓
Append IncidentEvent (event sourcing)
```

### 4. Event Sourcing & Projections (ITS)
```
IncidentEvent (append-only log)
  - INCIDENT_CREATED
  - SIGNAL_ATTACHED
  - ACTION_ADDED
  - STATUS_CHANGED
  - SEVERITY_UPDATED
    ↓
Projection Engine
    ↓
Build Read Models:
  - IncidentSnapshot (current state)
  - IncidentSignal (attached signals)
  - IncidentAction (human/AI actions)
  - SLOViolation (SLA breaches)
    ↓
Query API: GET /api/orgs/:orgId/incidents/:id
```

### 5. AI Guidance Generation (IGS)
```
Incident Context:
  - Current status & severity
  - Attached signals & metrics
  - Service name & environment
  - Timeline of actions
    ↓
Intelligence Service
    ↓
Retrieve from KRS:
  - Relevant runbook sections
  - Similar past incidents
  - Historical postmortems
    ↓
Generate Guidance:
  - Suggested Actions (with safety levels)
  - Diagnostic Questions
  - Related Incidents
    ↓
Return to UI: GET /api/orgs/:orgId/incidents/:id/guidance
```

### 6. Postmortem Generation (IGS → KRS)
```
User clicks "Generate Postmortem"
    ↓
POST /api/orgs/:orgId/incidents/:id/postmortem
    ↓
IGS analyzes:
  - Complete incident timeline
  - All signals and actions
  - Duration and severity
  - Related incidents
    ↓
Generate Blameless Postmortem:
  - Summary
  - Timeline
  - Root Cause Analysis
  - Impact Assessment
  - Action Items
    ↓
Store in KRS: Postmortem table
    ↓
Return Markdown to UI
```

### 7. GitHub PR Creation (IGS → MCP)
```
User clicks "Create PR"
    ↓
POST /api/orgs/:orgId/incidents/:id/postmortem/pr
    ↓
IGS retrieves postmortem markdown
    ↓
MCP GitHub Connector:
  1. Create branch: postmortem/incident-{id}
  2. Write file: postmortems/YYYY-MM-DD-{title}.md
  3. Create pull request
  4. Add labels: postmortem, incident
    ↓
Return PR URL to user
    ↓
Team reviews and merges 🎃
```

## Service Modules Deep Dive

### IAS (Identity & Access Service)
**Location**: `src/modules/identity/`

**Responsibilities**:
- Multi-tenant organization management
- User authentication and authorization
- Membership and role-based access control (RBAC)
- Org-scoped API enforcement

**Key Models**:
```typescript
Organization {
  id, name, slug, billingPlan
  memberships[], projects[]
}

User {
  id, email, name, authProvider
  memberships[]
}

Membership {
  id, orgId, userId, role
  // role: ORG_ADMIN | SRE_LEAD | RESPONDER
}
```

**API Endpoints**:
- `GET /api/orgs` - List user's organizations
- `POST /api/orgs` - Create organization
- `GET /api/orgs/:orgId/members` - List members

**Security**:
- All API routes call `assertOrgMember(orgId, userId)`
- JWT tokens carry `orgId`, `userId`, `roles`
- No cross-tenant data leakage

### ITS (Incident & Timeline Service)
**Location**: `src/modules/incidents/`

**Responsibilities**:
- Event-sourced incident management
- Timeline tracking (signals, actions, status changes)
- Incident projections and queries
- SLO violation tracking

**Key Models**:
```typescript
IncidentEvent {
  id, orgId, incidentId, ts, type, payload
  // Append-only event log
}

IncidentSnapshot {
  id, orgId, projectId, title, serviceName
  status, severity, environment
  signals[], actions[], sloViolations[]
  // Projection from events
}

IncidentSignal {
  id, incidentId, signalType, source, summary
  correlationKey, traceId, data, ts
}

IncidentAction {
  id, incidentId, actorType, actionKind
  label, details, ts
}
```

**Event Sourcing Flow**:
```
Command: createIncident(data)
    ↓
Append: IncidentEvent { type: INCIDENT_CREATED, payload: data }
    ↓
Project: Create IncidentSnapshot from event
    ↓
Query: getIncidentById() returns snapshot
```

**API Endpoints**:
- `GET /api/orgs/:orgId/incidents` - List with filters
- `POST /api/orgs/:orgId/incidents` - Create incident
- `GET /api/orgs/:orgId/incidents/:id` - Get details
- `POST /api/orgs/:orgId/incidents/:id/actions` - Add action
- `PATCH /api/orgs/:orgId/incidents/:id/status` - Update status

**Lifecycle States**:
- `OPEN` → `INVESTIGATING` → `MITIGATED` → `RESOLVED`
- `CANCELLED` (declared in error)

**Severity Levels**:
- `SEV1` - Critical outage
- `SEV2` - Major degradation
- `SEV3` - Minor impact
- `SEV4` - Low urgency

### CIS (Connector & Ingestion Service)
**Location**: `src/modules/connectors/`

**Responsibilities**:
- Ingest events from external systems
- Normalize alerts/logs to canonical format
- Evaluate SLA risk from metrics
- Manage watchlist for at-risk services
- Correlate signals to incidents

**Key Models**:
```typescript
SLAWatchEntry {
  id, orgId, projectId, serviceName, environment
  status, riskScore, source, logsSnapshot
  correlationKey, firstDetectedAt, lastUpdatedAt
}

NormalizedEvent {
  orgId, projectId, serviceName, environment
  metrics: { errorRate, latency, availability }
  logs: [{ level, message, timestamp }]
  correlationKey, traceId
}
```

**Risk Evaluation**:
```typescript
function evaluateRiskFromNormalizedEvent(event) {
  if (!event.metrics) return null;
  
  let maxRiskScore = 0;
  let status = 'CLEARED';
  
  // Check error rate
  if (errorRate >= 0.05) {
    status = 'BREACHED';
    maxRiskScore = 1.0;
  } else if (errorRate >= 0.01) {
    status = 'AT_RISK';
    maxRiskScore = 0.75;
  }
  
  // Check latency, availability...
  
  return {
    orgId, serviceName, environment,
    status, riskScore: maxRiskScore,
    logsSnapshot: event.logs.slice(0, 5)
  };
}
```

**API Endpoints**:
- `GET /api/orgs/:orgId/watchlist` - Get SLA watchlist
- `POST /api/orgs/:orgId/watchlist/:id/clear` - Clear entry

**Correlation Strategies**:
1. **Explicit Keys**: Match `correlationKey` from provider
2. **Trace IDs**: Match distributed `traceId`
3. **Temporal**: Same service within 5-minute window
4. **Service Topology**: Upstream/downstream relationships

### KRS (Knowledge & Runbook Service)
**Location**: `src/modules/knowledge/`

**Responsibilities**:
- Store and retrieve runbooks
- Manage postmortems
- Search historical incidents
- Build knowledge graphs

**Key Models**:
```typescript
Postmortem {
  id, orgId, incidentId, markdown
  summaryText, tags, createdAt, updatedAt
}

Runbook {
  // Future: structured runbook storage
  serviceName, markdown, sections[]
}
```

**Key Functions**:
- `getRunbookForService(orgId, serviceName)` - Retrieve runbook
- `savePostmortem(orgId, incidentId, markdown)` - Store postmortem
- `searchPostmortems(orgId, query)` - Full-text search

**API Endpoints**:
- `GET /api/orgs/:orgId/runbooks/:service` - Get runbook
- `GET /api/orgs/:orgId/postmortems` - List postmortems
- `POST /api/orgs/:orgId/postmortems` - Create postmortem

### IGS (Intelligence & Guidance Service)
**Location**: `src/modules/intelligence/`

**Responsibilities**:
- Generate incident guidance
- Suggest diagnostic questions
- Find related incidents
- Generate postmortem drafts
- Orchestrate MCP connectors

**Key Functions**:
```typescript
async function getGuidanceForIncident(orgId, incidentId) {
  const incident = await ITS.getIncident(incidentId);
  const runbook = await KRS.getRunbookForService(incident.serviceName);
  const related = await findRelatedIncidents(incident);
  
  return {
    actions: extractSuggestedActions(runbook, incident),
    diagnosticQuestions: generateQuestions(incident),
    relatedIncidents: related
  };
}

async function generatePostmortem(orgId, incidentId) {
  const incident = await ITS.getIncidentWithTimeline(incidentId);
  const related = await findRelatedIncidents(incident);
  
  return generateBlamelessPostmortem({
    incident,
    timeline: incident.events,
    relatedIncidents: related
  });
}
```

**API Endpoints**:
- `GET /api/orgs/:orgId/incidents/:id/guidance` - Get guidance
- `POST /api/orgs/:orgId/incidents/:id/postmortem` - Generate postmortem
- `POST /api/orgs/:orgId/incidents/:id/postmortem/pr` - Create GitHub PR
- `GET /api/orgs/:orgId/incidents/:id/related` - Find related

**MCP Integration**:
```typescript
// .kiro/settings/mcp.json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "..." }
    }
  }
}
```

## Multi-Tenancy Architecture

### Tenant Isolation

**Database Level**:
```sql
-- Every table has orgId
CREATE TABLE incidents (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  ...
);

-- Every query filters by orgId
SELECT * FROM incidents 
WHERE org_id = $1 AND status = $2;

-- Indexes include orgId
CREATE INDEX idx_incidents_org_status 
ON incidents(org_id, status, severity);
```

**Application Level**:
```typescript
// All API routes enforce org membership
export async function GET(req, { params }) {
  const user = await getCurrentUser();
  const { orgId } = await params;
  
  // Throws if user not member
  await assertOrgMember(orgId, user.id);
  
  // All queries automatically scoped
  const incidents = await getIncidents(orgId, filters);
  return Response.json({ incidents });
}
```

**RBAC Enforcement**:
```typescript
enum Role {
  ORG_ADMIN = 'ORG_ADMIN',      // Full access
  SRE_LEAD = 'SRE_LEAD',        // Manage incidents, change severity
  RESPONDER = 'RESPONDER',      // View, add actions
  VIEWER = 'VIEWER'             // Read-only
}

function canChangeSeverity(user, incident) {
  return user.roles.includes('ORG_ADMIN') || 
         user.roles.includes('SRE_LEAD');
}
```

## Event Sourcing Deep Dive

### Why Event Sourcing?

**Benefits**:
- Complete audit trail of all changes
- Time-travel debugging (replay events)
- Easy to add new projections
- Natural fit for incident timelines

**Trade-offs**:
- More complex than CRUD
- Eventual consistency for projections
- Storage grows over time

### Event Types

```typescript
type IncidentEventType =
  | 'INCIDENT_CREATED'
  | 'SIGNAL_ATTACHED'
  | 'ACTION_ADDED'
  | 'STATUS_CHANGED'
  | 'SEVERITY_UPDATED'
  | 'ASSIGNEE_CHANGED';

interface IncidentEvent {
  id: string;
  orgId: string;
  incidentId: string;
  ts: Date;
  type: IncidentEventType;
  payload: unknown;
}
```

### Projection Logic

```typescript
async function projectIncidentSnapshot(incidentId: string) {
  const events = await prisma.incidentEvent.findMany({
    where: { incidentId },
    orderBy: { ts: 'asc' }
  });
  
  let snapshot: IncidentSnapshot = null;
  
  for (const event of events) {
    switch (event.type) {
      case 'INCIDENT_CREATED':
        snapshot = createSnapshotFromEvent(event);
        break;
      case 'STATUS_CHANGED':
        snapshot.status = event.payload.newStatus;
        snapshot.updatedAt = event.ts;
        break;
      case 'SIGNAL_ATTACHED':
        // Signal stored separately, linked by incidentId
        break;
      // ... other event types
    }
  }
  
  return snapshot;
}
```

### Synchronous vs Async Projections

**v0.1 (Current)**: Synchronous
```typescript
async function createIncident(data) {
  await prisma.$transaction(async (tx) => {
    // 1. Append event
    await tx.incidentEvent.create({ ... });
    
    // 2. Update projection immediately
    await tx.incidentSnapshot.create({ ... });
  });
}
```

**Future**: Asynchronous
```typescript
async function createIncident(data) {
  // 1. Append event only
  await prisma.incidentEvent.create({ ... });
  
  // 2. Publish to event bus
  await eventBus.publish('incident.created', { incidentId });
  
  // 3. Worker processes event and updates projection
}
```

## Technology Stack

### Core
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 7.x
- **UI**: React 18 + TailwindCSS

### Development
- **AI IDE**: Kiro with MCP connectors
- **Testing**: (Framework TBD - Jest/Vitest)
- **Linting**: ESLint + TypeScript strict mode

### Infrastructure
- **Deployment**: Vercel / Docker
- **Database**: Managed PostgreSQL (Supabase/Neon)
- **Secrets**: Environment variables (future: Vault)

## Performance Considerations

### Database Optimization

**Indexes**:
```sql
-- Incident queries
CREATE INDEX idx_incidents_org_status_severity 
ON incident_snapshots(org_id, status, severity);

CREATE INDEX idx_incidents_org_created 
ON incident_snapshots(org_id, created_at DESC);

-- Signal correlation
CREATE INDEX idx_signals_correlation 
ON incident_signals(org_id, correlation_key);

CREATE INDEX idx_signals_trace 
ON incident_signals(trace_id);

-- Watchlist queries
CREATE INDEX idx_watchlist_org_status 
ON sla_watch_entries(org_id, status, risk_score DESC);
```

**Query Patterns**:
```typescript
// Good: Uses index
const incidents = await prisma.incidentSnapshot.findMany({
  where: { orgId, status: 'OPEN' },
  orderBy: { createdAt: 'desc' },
  take: 50
});

// Bad: Full table scan
const incidents = await prisma.incidentSnapshot.findMany({
  where: { title: { contains: 'database' } }
});
```

### Pagination

```typescript
// Cursor-based pagination
async function listIncidents(orgId, cursor?, limit = 50) {
  return prisma.incidentSnapshot.findMany({
    where: { orgId },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' }
  });
}
```

## Security

### Authentication
- JWT tokens with `orgId`, `userId`, `roles`
- Tokens validated on every API request
- Session management via NextAuth

### Authorization
- RBAC enforced at service layer
- `assertOrgMember()` checks membership
- Role-based permissions for sensitive operations

### Data Protection
- All queries scoped by `orgId`
- No cross-tenant data leakage
- Secrets encrypted at rest
- HTTPS in production

## Monitoring & Observability

### Application Metrics
- Request latency (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- Incident creation rate

### Business Metrics
- Active incidents by severity
- Mean time to resolution (MTTR)
- SLA breach rate
- Postmortem completion rate

### Dogfooding
Use Runbook Revenant to monitor itself:
- Ingest app metrics as signals
- Create incidents for errors
- Track SLAs for API endpoints

## Future Architecture

### Microservices Split

```
┌─────────────┐
│   Gateway   │
│   (Next.js) │
└─────────────┘
       │
   ┌───┴───┬───────┬───────┐
   ▼       ▼       ▼       ▼
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│ IAS │ │ ITS │ │ CIS │ │ IGS │
└─────┘ └─────┘ └─────┘ └─────┘
   │       │       │       │
   └───────┴───────┴───────┘
           │
      ┌────┴────┬────────┐
      ▼         ▼        ▼
   ┌─────┐  ┌─────┐  ┌─────┐
   │ DB  │  │Event│  │Cache│
   │     │  │ Bus │  │     │
   └─────┘  └─────┘  └─────┘
```

### Async Projections
- Event bus (Kafka/RabbitMQ)
- Worker processes for projections
- Eventual consistency
- Replay capability

### Caching Layer
- Redis for hot data
- Incident snapshots
- Guidance responses
- Runbook sections

## References

- [Product Steering](../.kiro/steering/product.md)
- [Technical Steering](../.kiro/steering/tech.md)
- [SRE Principles](../.kiro/steering/sre-principles.md)
- [Service Architecture](../.kiro/steering/architecture-services.md)

---

**Last Updated**: 2025-12-04  
**Version**: 0.1.0  
**Status**: Active Development 🎃
