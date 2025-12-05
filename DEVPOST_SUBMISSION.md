# Runbook Revenant - Devpost Submission 🎃

## Tagline
Your AI-powered incident copilot that brings dead runbooks back to life.

---

## Inspiration

At 3 AM, when production is down and your pager goes off, you need answers fast. But your runbooks are buried in wikis from 2019, alerts are scattered across five different tools, and you're not sure where to start. We've all been there.

Runbook Revenant was born from this frustration. We wanted to build an incident copilot that:
- Centralizes all incident context in one place
- Provides AI-powered guidance from your own runbooks
- Generates blameless postmortems automatically
- Helps teams learn from every incident

And we wanted to build it using Kiro IDE to showcase the power of AI-native development.

---

## What it does

Runbook Revenant is a multi-tenant incident management platform that transforms how SRE teams respond to outages:

### 🚨 Proactive Monitoring
- **SLA Watchlist** evaluates metrics (error rate, latency, availability) against thresholds
- Catches services at risk before they breach SLAs
- Displays risk scores and log snippets for quick diagnosis

### 📊 Unified War Room
- **Event-sourced timeline** captures every signal, action, and status change
- Correlates alerts from multiple sources using trace IDs and correlation keys
- No more context switching between Grafana, Datadog, Jira, and Slack

### 🤖 AI-Powered Guidance
- Analyzes incidents and suggests next steps from your runbooks
- Generates diagnostic questions to guide investigation
- Finds related incidents from your history
- Categorizes actions by safety level (safe, risky, info-only)

### 📝 Automated Postmortems
- One-click generation of blameless, structured postmortems
- Follows SRE best practices (no blame, fact-based, actionable)
- Pushes to GitHub as pull requests via MCP connectors
- Preserves knowledge for future incidents

### 🏢 Enterprise-Ready
- Multi-tenant architecture with strict org isolation
- Role-based access control (RBAC)
- Event sourcing for complete audit trails
- PostgreSQL + Prisma for reliability

---

## How we built it

### Technology Stack
- **Frontend**: Next.js 16 (App Router) + React + TailwindCSS
- **Backend**: TypeScript + Node.js
- **Database**: PostgreSQL with Prisma ORM
- **AI Development**: Kiro IDE with MCP connectors
- **Integrations**: GitHub via Model Context Protocol

### Architecture
We built Runbook Revenant as a **modular monolith** with five service modules:

1. **IAS (Identity & Access)** - Multi-tenant org management, RBAC
2. **ITS (Incident & Timeline)** - Event-sourced incident tracking
3. **CIS (Connector & Ingestion)** - Alert normalization, SLA monitoring
4. **KRS (Knowledge & Runbooks)** - Runbook and postmortem storage
5. **IGS (Intelligence & Guidance)** - AI-powered suggestions

### Kiro-Powered Development

This project showcases Kiro IDE's AI-native workflow:

**📋 Steering Files** (`.kiro/steering/`)
- Define product vision, technical standards, SRE principles
- Guide every AI interaction with context
- Ensure consistency across the codebase

**📐 Specs** (`.kiro/specs/`)
- Formal requirements with EARS-compliant acceptance criteria
- Design documents with correctness properties
- Task lists for incremental implementation

**🪝 Agent Hooks** (`.kiro/hooks/`)
- Auto-update tests when code changes
- Keep documentation synchronized
- Reduce manual toil

**🔌 MCP Integration** (`.kiro/settings/mcp.json`)
- GitHub connector for postmortem PRs
- Extensible for Jira, Slack, observability tools

**💬 Vibe Coding**
```
"Add an SLA watchlist feature that evaluates risk from metrics 
and displays at-risk services in the sidebar"
```
Kiro reads the steering files, follows the specs, and implements the feature end-to-end.

### Key Technical Decisions

**Event Sourcing**: All incident changes append to an event log, enabling complete audit trails and time-travel debugging.

**Multi-Tenancy**: Every table includes `orgId` for strict tenant isolation. All queries automatically scoped.

**Risk Evaluation**: Metrics compared against configurable thresholds (error rate, latency, availability) to calculate risk scores.

**Blameless Culture**: Postmortems focus on systems and processes, not individuals. Language carefully crafted to avoid blame.

---

## Challenges we ran into

### 1. Event Sourcing Complexity
Implementing event sourcing for incidents was more complex than traditional CRUD. We had to:
- Design a projection system to rebuild current state from events
- Handle concurrent updates to the same incident
- Balance synchronous vs asynchronous projections

**Solution**: Started with synchronous projections for v0.1, designed interfaces for future async workers.

### 2. Multi-Tenant Data Isolation
Ensuring no cross-tenant data leakage required:
- Every query filtered by `orgId`
- Careful index design for performance
- RBAC enforcement at multiple layers

**Solution**: Created `assertOrgMember()` helper used by all API routes. Comprehensive testing of tenant boundaries.

### 3. SLA Risk Scoring
Determining when a service is "at risk" vs "breached" required:
- Configurable thresholds per metric type
- Combining multiple metrics into a single risk score
- Avoiding false positives

**Solution**: Implemented a weighted scoring system with clear thresholds (warning/critical) and status classification.

### 4. AI Guidance Quality
Generating useful suggestions without hallucinations:
- Needed to ground guidance in actual runbooks
- Avoid suggesting dangerous actions
- Provide context-aware recommendations

**Solution**: Categorized actions by safety level, retrieved relevant runbook sections, used past incidents as examples.

### 5. Kiro Learning Curve
Learning to work effectively with Kiro IDE:
- Writing effective steering files
- Structuring specs for AI consumption
- Debugging when AI misunderstood requirements

**Solution**: Iterative refinement of steering files, clear acceptance criteria in specs, frequent checkpoints.

---

## Accomplishments that we're proud of

### 🏗️ Production-Ready Architecture
Built a scalable, multi-tenant system with event sourcing, not a toy demo. The architecture can handle real production workloads.

### 🤖 Effective AI Collaboration
Demonstrated that AI can build complex systems when given proper guidance through steering files and specs.

### 🎃 Delightful UX
Created a Halloween-themed UI that's both functional and fun. The pumpkin icons and orange accents make incident response a little less stressful.

### 📚 Comprehensive Documentation
Generated detailed architecture docs, API references, and demo scripts—all maintained by AI agent hooks.

### 🔒 Security First
Implemented proper multi-tenancy, RBAC, and tenant isolation from day one. No shortcuts on security.

### 🧪 SRE Best Practices
Followed industry standards for incident management: blameless postmortems, safety categorization, error budgets.

---

## What we learned

### About Incident Management
- Event sourcing is a natural fit for incident timelines
- Correlation is harder than it looks (trace IDs, correlation keys, temporal matching)
- Blameless language requires careful thought and iteration
- Proactive monitoring (SLA watchlist) is as important as reactive response

### About AI-Native Development
- **Steering files are crucial**: They provide context that makes AI suggestions relevant
- **Specs enable incremental progress**: Breaking features into tasks helps AI stay focused
- **Agent hooks reduce toil**: Automated test updates and doc sync save hours
- **MCP unlocks integrations**: External tools become part of the development workflow

### About Kiro IDE
- Vibe coding works when you have good steering
- Specs with correctness properties lead to better code
- Agent hooks can automate repetitive tasks
- The AI learns your codebase patterns over time

### Technical Lessons
- PostgreSQL indexes matter for multi-tenant queries
- Event sourcing requires careful schema design
- TypeScript strict mode catches bugs early
- Prisma migrations are easy to manage

---

## What's next for Runbook Revenant

### v0.2 - Connector Integration (Next 2 weeks)
- [ ] Grafana webhook connector
- [ ] Datadog alert ingestion
- [ ] PagerDuty integration
- [ ] Automatic incident creation from alerts
- [ ] Real-time signal correlation

### v0.3 - Advanced Intelligence (1 month)
- [ ] Incident pattern detection using ML
- [ ] Anomaly detection in metrics
- [ ] Runbook recommendations based on incident type
- [ ] Action item tracking and follow-up
- [ ] Slack notifications for critical incidents

### v0.4 - Collaboration Features (2 months)
- [ ] Real-time incident collaboration (WebSockets)
- [ ] On-call scheduling and rotation
- [ ] Escalation policies
- [ ] Mobile app for on-call engineers
- [ ] Video call integration for war rooms

### v0.5 - Enterprise Features (3 months)
- [ ] SSO integration (SAML, OAuth)
- [ ] Advanced RBAC with custom roles
- [ ] Audit logs and compliance reports
- [ ] SLA/SLO configuration UI
- [ ] Custom runbook templates
- [ ] Metrics dashboard for incident trends

### Long-Term Vision
- **Async Projections**: Move to event bus for scalability
- **Microservices**: Split CIS and IGS into separate services
- **AI Training**: Fine-tune models on customer's incident history
- **Chaos Engineering**: Integrate with chaos tools for proactive testing
- **Marketplace**: Community-contributed runbooks and connectors

---

## Try it yourself

### Quick Start
```bash
git clone https://github.com/yourusername/runbook-revenant.git
cd runbook-revenant
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎃

### Demo Credentials
- **Organization**: demo-org
- **User**: demo@example.com
- **Sample Data**: Pre-populated incidents and SLA violations

### Documentation
- [README.md](README.md) - Getting started guide
- [docs/architecture.md](docs/architecture.md) - Technical deep dive
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md) - Video demo script

---

## Built With

- Next.js
- React
- TypeScript
- PostgreSQL
- Prisma
- TailwindCSS
- Kiro IDE
- Model Context Protocol (MCP)

---

## Team

Built by [Your Name] for the Kiroween Hackathon 2025.

Special thanks to the Kiro team for building an incredible AI-native IDE that made this project possible.

---

## Links

- **GitHub Repository**: https://github.com/yourusername/runbook-revenant
- **Demo Video**: [YouTube Link]
- **Live Demo**: [Deployment URL]
- **Documentation**: [GitHub Pages Link]

---

## License

MIT License - Open source and free to use.

---

**Ready to bring your runbooks back from the dead?** 🎃

Try Runbook Revenant today and transform how your team responds to incidents.
