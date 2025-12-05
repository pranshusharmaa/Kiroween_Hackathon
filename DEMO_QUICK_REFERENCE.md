# 🎃 Runbook Revenant - Demo Quick Reference

## Pre-Demo Checklist

### Environment Setup
- [ ] PostgreSQL running on localhost:5432
- [ ] Database seeded with demo data
- [ ] `.env` file configured
- [ ] Dev server running on port 3000
- [ ] Browser tabs prepared (see below)

### Browser Tabs (in order)
1. **Dashboard**: http://localhost:3000/orgs/demo-org/incidents
2. **Incident Detail**: http://localhost:3000/orgs/demo-org/incidents/[id]
3. **GitHub**: https://github.com/yourusername/runbook-revenant
4. **Kiro IDE**: VS Code with .kiro/ folder open

### Demo Data Verification
```bash
# Check incidents exist
curl http://localhost:3000/api/orgs/[orgId]/incidents | jq '.incidents | length'

# Check watchlist has entries
curl http://localhost:3000/api/orgs/[orgId]/watchlist | jq '.entries | length'

# Should see 3+ incidents and 2+ watchlist entries
```

---

## Demo Flow (3 minutes)

### Part 1: Problem (20 seconds)
**Show**: Chaotic incident response (multiple tabs, scattered info)
**Say**: "3 AM pages, dead runbooks, fragmented context"

### Part 2: Dashboard (30 seconds)
**Show**: Incident list + SLA Watchlist sidebar
**Say**: 
- "All incidents in one place"
- "Proactive SLA monitoring catches issues early"
- "95% risk score on checkout service"

**Actions**:
- Hover over watchlist entry
- Show risk score and log snippet
- Point out Halloween theme 🎃

### Part 3: War Room (40 seconds)
**Show**: Incident detail page
**Say**:
- "Event-sourced timeline - complete audit trail"
- "AI guidance from your runbooks"
- "Suggested actions with safety levels"

**Actions**:
- Scroll through timeline
- Highlight AI suggestions
- Click "Execute" on safe action
- Show diagnostic questions

### Part 4: Postmortem (30 seconds)
**Show**: Postmortem generation + GitHub PR
**Say**:
- "One-click blameless postmortem"
- "Structured, fact-based, actionable"
- "Push to GitHub for team review"

**Actions**:
- Click "Generate Postmortem"
- Scroll through markdown
- Click "Create PR"
- Show GitHub PR preview

### Part 5: Kiro Magic (40 seconds)
**Show**: Kiro IDE with .kiro/ folder
**Say**:
- "Built entirely with Kiro IDE"
- "Steering files guide AI"
- "Specs ensure correctness"
- "Hooks automate toil"

**Actions**:
- Open .kiro/steering/product.md
- Open .kiro/specs/ folder
- Open .kiro/hooks/backend-tests.kiro.hook
- Show quick code generation

### Part 6: Closing (20 seconds)
**Show**: Dashboard with stats
**Say**: "Runbook Revenant - bringing runbooks back from the dead"

---

## Key Talking Points

### Problem Statement
- "Dead runbooks buried in wikis"
- "Fragmented context across tools"
- "Inconsistent, blame-y postmortems"

### Solution Highlights
- "Event-sourced timeline"
- "AI-powered guidance"
- "Proactive SLA monitoring"
- "Automated postmortems"
- "Multi-tenant, production-ready"

### Kiro Showcase
- "Steering files provide context"
- "Specs enable incremental development"
- "Agent hooks reduce toil"
- "MCP connectors integrate tools"
- "Vibe coding just works"

### Technical Highlights
- "Event sourcing for audit trails"
- "Multi-tenant with RBAC"
- "PostgreSQL + Prisma"
- "Next.js + TypeScript"
- "Modular monolith architecture"

---

## Demo Commands

### Start Dev Server
```bash
npm run dev
```

### Seed Fresh Data
```bash
npx prisma migrate reset --force
npx prisma db seed
```

### Check API Health
```bash
# List orgs
curl http://localhost:3000/api/orgs | jq

# List incidents
curl http://localhost:3000/api/orgs/[orgId]/incidents | jq

# Get watchlist
curl http://localhost:3000/api/orgs/[orgId]/watchlist | jq
```

### Generate Test Incident
```bash
curl -X POST http://localhost:3000/api/orgs/[orgId]/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Gateway 5xx Errors",
    "serviceName": "api-gateway",
    "severity": "SEV1",
    "environment": "production"
  }'
```

---

## Backup Plans

### If Live Demo Fails
1. **Screenshots**: Have key screens pre-captured
2. **Video**: Pre-recorded demo as fallback
3. **Curl**: Show API responses in terminal
4. **Code**: Walk through key files instead

### If Questions Arise

**Q: "How does it scale?"**
A: "Event sourcing scales horizontally. Async projections planned for v0.2."

**Q: "What about security?"**
A: "Multi-tenant with strict org isolation. RBAC. JWT auth. Every query scoped by orgId."

**Q: "Integration with existing tools?"**
A: "MCP connectors for GitHub, Jira, Slack. Webhook endpoints for Grafana, Datadog."

**Q: "AI accuracy?"**
A: "Grounded in your runbooks and past incidents. Gets better over time."

**Q: "Why Kiro?"**
A: "Steering files provide context. Specs ensure correctness. Hooks automate toil. It just works."

---

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Restart if needed
brew services restart postgresql
```

### Port 3000 Already in Use
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Prisma Client Out of Sync
```bash
npx prisma generate
```

### Missing Environment Variables
```bash
# Copy example
cp .env.example .env

# Edit with your values
nano .env
```

---

## Post-Demo Actions

### Collect Feedback
- Note questions asked
- Record feature requests
- Capture bug reports

### Follow-Up
- Share GitHub repo link
- Provide documentation links
- Offer to answer questions

### Social Media
- Tweet demo highlights
- Post on LinkedIn
- Share in Kiro community

---

## Key Metrics to Mention

- **5 Service Modules**: IAS, ITS, CIS, KRS, IGS
- **Event-Sourced**: Complete audit trail
- **Multi-Tenant**: Strict org isolation
- **AI-Powered**: Guidance from runbooks
- **Production-Ready**: PostgreSQL + Prisma

---

## Elevator Pitch (30 seconds)

> "Runbook Revenant is an AI-powered incident copilot for SRE teams. It centralizes alerts, logs, and actions into an event-sourced timeline, provides AI guidance from your runbooks, and generates blameless postmortems automatically. Built with Kiro IDE to showcase AI-native development with steering files, specs, and agent hooks. It's production-ready with multi-tenancy, RBAC, and event sourcing. Try it at github.com/yourusername/runbook-revenant."

---

## Demo Timing Breakdown

| Section | Duration | Cumulative |
|---------|----------|------------|
| Problem | 20s | 0:20 |
| Dashboard | 30s | 0:50 |
| War Room | 40s | 1:30 |
| Postmortem | 30s | 2:00 |
| Kiro Magic | 40s | 2:40 |
| Closing | 20s | 3:00 |

**Total**: 3 minutes

---

## Emergency Contacts

- **Kiro Support**: [Discord/Slack link]
- **Team Member**: [Phone number]
- **Backup Presenter**: [Name]

---

**Good luck! You've got this! 🎃**
