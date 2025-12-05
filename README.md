# 🎃 Runbook Revenant

**Your AI-powered incident copilot that brings dead runbooks back to life.**

Runbook Revenant is a multi-tenant incident management platform built for SRE and platform teams. It combines observability signals, runbooks, and postmortems into a single guided war-room experience—helping you respond faster, learn from every incident, and prevent future outages.

## The Problem

When incidents strike, your team faces:
- **Dead runbooks** buried in wikis that nobody reads during the chaos
- **Fragmented context** scattered across Grafana, Datadog, Jira, and Slack
- **Inconsistent postmortems** that arrive late, incomplete, or blame individuals instead of systems

## The Solution

Runbook Revenant centralizes everything you need to respond to incidents:

✅ **Event-Sourced Timeline** - Every signal, action, and status change in one place  
✅ **AI-Powered Guidance** - Get suggested next steps from runbooks and past incidents  
✅ **SLA Watchlist** - Catch services approaching thresholds before they breach  
✅ **Change Guardrails** - Automatic performance checks for deployments with PASS/WARN/FAIL status  
✅ **Data Flow Mapping** - Visual service topology with error highlighting  
✅ **Automated Postmortems** - Generate blameless, structured retrospectives  
✅ **GitHub Integration** - Push postmortems as PRs via MCP connectors  
✅ **Multi-Tenant** - Secure org isolation with RBAC

## Who It's For

- **SREs & On-Call Engineers** responding to production incidents
- **Platform Teams** managing reliability across multiple services
- **Engineering Managers** tracking incident trends and action items

## Architecture

Runbook Revenant is built as a **modular monolith** with clear service boundaries:

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js Web App                         │
│              (React + TailwindCSS)                       │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│     IAS      │  │     ITS      │  │     CIS      │
│   Identity   │  │  Incidents   │  │  Connectors  │
│  & Access    │  │  & Timeline  │  │  & Ingestion │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│     KRS      │  │     IGS      │  │  PostgreSQL  │
│  Knowledge   │  │ Intelligence │  │   (Prisma)   │
│  & Runbooks  │  │  & Guidance  │  └──────────────┘
└──────────────┘  └──────────────┘
```

### Service Modules

**IAS (Identity & Access Service)** - Multi-tenant org management, users, RBAC  
**ITS (Incident & Timeline Service)** - Event-sourced incident tracking with projections  
**CIS (Connector & Ingestion Service)** - Normalize alerts/logs, evaluate SLA risk  
**KRS (Knowledge & Runbook Service)** - Store runbooks and postmortems  
**IGS (Intelligence & Guidance Service)** - AI-powered suggestions and postmortem generation

## Built with Kiro

This project showcases **Kiro IDE's** AI-native development workflow:

### 🎯 Steering Files (`.kiro/steering/`)
Define product vision, technical standards, and SRE principles that guide every AI interaction:
- `product.md` - What we're building and why
- `tech.md` - Stack, patterns, and constraints
- `architecture-services.md` - Service boundaries and contracts
- `sre-principles.md` - Incident management philosophy

### 📋 Specs (`.kiro/specs/`)
Formal requirements and design documents for each feature:
- Requirements with EARS-compliant acceptance criteria
- Design documents with correctness properties
- Task lists for incremental implementation

### 🪝 Agent Hooks (`.kiro/hooks/`)
Automated workflows that trigger on file save:
- `backend-tests.kiro.hook` - Auto-update and run tests
- `docs-sync.kiro.hook` - Keep documentation current

### 🔌 MCP Integration (`.kiro/settings/mcp.json`)
Model Context Protocol servers for external integrations:
- GitHub for postmortem PRs
- Jira for ticket creation
- Slack for notifications

### 💬 Vibe Coding
Natural language development with Kiro:
```
"Add an SLA watchlist feature that evaluates risk from metrics 
and displays at-risk services in the sidebar"
```
Kiro reads the steering files, follows the specs, and implements the feature end-to-end.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/runbook-revenant.git
cd runbook-revenant
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/runbook_revenant"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Setup Database
```bash
# Run migrations
npx prisma migrate dev

# Seed demo data
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎃

### 5. Explore Demo Data
- **Organization**: demo-org
- **User**: demo@example.com
- **Sample Incidents**: Pre-populated with signals and actions
- **SLA Watchlist**: Services approaching thresholds

## Key Features

### 📊 Incident Dashboard
- Real-time incident list with filtering by status/severity
- SLA watchlist sidebar showing at-risk services
- Halloween-themed UI with pumpkin icons 🎃

### 🔍 Incident War Room
- Event-sourced timeline of signals and actions
- AI-generated diagnostic questions
- Suggested next steps from runbooks
- Related incident discovery

### 📝 Automated Postmortems
- Generate blameless postmortems from incident timeline
- Structured format following SRE best practices
- One-click GitHub PR creation
- Markdown export

### ⚠️ SLA Watchlist
- Proactive monitoring of error rates, latency, availability
- Risk scoring (0.0-1.0) with color-coded alerts
- Log snippets for quick diagnosis
- Clear entries when resolved

### 🚀 Change Guardrails
- Automatic performance checks for every deployment
- Before/after metrics comparison (P95 latency, error rate)
- PASS/WARN/FAIL classification with configurable thresholds
- Visual indicators in "What Changed?" section
- Helps identify problematic deployments quickly

### 🗺️ Data Flow Mapping
- Visual service topology showing dependencies
- Error highlighting on affected services
- Hot service detection based on error frequency
- Interactive graph for incident investigation

## API Endpoints

### Incidents
```
GET    /api/orgs/:orgId/incidents
POST   /api/orgs/:orgId/incidents
GET    /api/orgs/:orgId/incidents/:id
POST   /api/orgs/:orgId/incidents/:id/actions
PATCH  /api/orgs/:orgId/incidents/:id/status
```

### Guidance & Intelligence
```
GET    /api/orgs/:orgId/incidents/:id/guidance
POST   /api/orgs/:orgId/incidents/:id/postmortem
GET    /api/orgs/:orgId/incidents/:id/related
```

### SLA Watchlist
```
GET    /api/orgs/:orgId/watchlist
POST   /api/orgs/:orgId/watchlist/:id/clear
```

### Change Guardrails
```
GET    /api/orgs/:orgId/incidents/:id/deployments
POST   /api/orgs/:orgId/deployments/:id/guardrail-check
GET    /api/orgs/:orgId/deployments/:id/guardrail-check
```

### Data Flow & Service Graph
```
GET    /api/orgs/:orgId/incidents/:id/service-graph
GET    /api/orgs/:orgId/data-paths
```

## Development

### Project Structure
```
src/
├── app/                    # Next.js routes (UI + API)
│   ├── api/               # API endpoints
│   └── orgs/              # Frontend pages
├── modules/               # Service modules
│   ├── identity/          # IAS
│   ├── incidents/         # ITS
│   ├── connectors/        # CIS
│   ├── knowledge/         # KRS
│   └── intelligence/      # IGS
└── lib/                   # Shared utilities

.kiro/
├── steering/              # AI guidance documents
├── specs/                 # Feature specifications
├── hooks/                 # Automated workflows
└── settings/              # MCP configuration
```

### Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test -- risk-evaluator.test.ts

# Watch mode
npm test -- --watch
```

### Database Migrations
```bash
# Create migration
npx prisma migrate dev --name add_feature

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

## Technology Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **UI**: React + TailwindCSS
- **AI**: Kiro IDE with MCP connectors
- **Testing**: (Framework TBD)

## Design Principles

### Event Sourcing
All incident changes append to `IncidentEvent` table. Projections rebuild current state from events, enabling:
- Complete audit trail
- Time-travel debugging
- Replay for testing

### Multi-Tenancy
Every table includes `orgId` for strict tenant isolation. All queries filter by org to prevent data leakage.

### Blameless Culture
Postmortems focus on systems and processes, not individuals. Language avoids blame and emphasizes learning.

### Safety First
Actions are categorized as SAFE_REVERSIBLE, RISKY, or INFO_ONLY. Destructive operations are simulated in demo mode.

## Roadmap

### v0.2 - Connector Integration
- [ ] Grafana webhook connector
- [ ] Datadog alert ingestion
- [ ] PagerDuty integration
- [ ] Automatic incident creation from alerts

### v0.3 - Advanced Intelligence
- [ ] Incident pattern detection
- [ ] Anomaly detection in metrics
- [ ] Runbook recommendations
- [ ] Action item tracking

### v0.4 - Collaboration
- [ ] Real-time incident collaboration
- [ ] Slack notifications
- [ ] On-call scheduling
- [ ] Escalation policies

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Create a feature spec in `.kiro/specs/`
2. Use Kiro to implement following steering guidelines
3. Agent hooks auto-update tests and docs
4. Submit PR with spec + implementation

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built with ❤️ using [Kiro IDE](https://kiro.ai) for the Kiroween Hackathon 2025.

Special thanks to:
- The Kiro team for building an incredible AI-native IDE
- The SRE community for incident management best practices
- Everyone who's ever been paged at 3am 🎃

---

**Ready to bring your runbooks back from the dead?** 🎃

[Get Started](#quick-start) | [Documentation](docs/architecture.md) | [Report Bug](https://github.com/yourusername/runbook-revenant/issues)
