# Runbook Revenant – Product Steering

## One-line description

Runbook Revenant is a multi-tenant incident copilot for SRE + platform teams, combining observability signals, runbooks, and postmortems into a single guided incident war-room.

## Primary users

- SREs and on-call engineers at SaaS / platform companies
- Platform and reliability teams
- Engineering managers responsible for incident response and postmortems

## Core value

- Centralize **signals** (alerts, metrics summaries, logs) and **human actions** (notes, playbook commands) into an event-sourced incident timeline.
- Provide **guided next steps** using runbooks + past incidents, with strong safety constraints.
- Generate **consistent, high-quality postmortems** and push them to existing systems (GitHub, Jira, Slack) via connectors/MCP.
- Support **multiple organizations and teams** in one deployment with strong tenant isolation and RBAC.

## What the product is NOT

- Not a generic log viewer or metrics dashboard (we integrate with those).
- Not a replacement for full-blown incident management suites on day one; we augment existing tools with guidance and knowledge.
- Not a toy demo: architecture must scale to many orgs, incidents, and timeline events.

## Problems we solve

1. **Dead runbooks & scattered knowledge**
   - Runbooks and old postmortems are buried in wikis and repos.
   - People rarely consult them during active incidents.
   - We surface the *right* runbook sections and prior incidents at the right time.

2. **Fragmented incident view**
   - Alerts in Grafana, logs in Datadog, tickets in Jira, chat in Slack.
   - We normalize alerts/logs into a common schema and attach them to an incident timeline using correlation keys and trace IDs.

3. **Inconsistent postmortems**
   - Postmortems are often late, incomplete, or blame-y.
   - We generate structured drafts that teams can review and refine, using an SRE-style, non-blaming tone.

## Key flows

1. **Incident creation & aggregation**
   - Ingest alert/log signals via connectors → normalize → map to an incident (create or attach).
   - Build an event-sourced timeline (signals, actions, status changes).

2. **War-room dashboard**
   - For a given incident:
     - Show metrics trend, log highlights, signals, actions, status, severity.
     - Provide suggested next steps + diagnostic questions.
     - Allow safe “playbook actions” (simulated for this project).

3. **Postmortem workflow**
   - After mitigation:
     - Generate a structured postmortem from the timeline and context.
     - Let users approve/edit.
     - Publish to GitHub (PR), Jira, Slack via MCP-based connectors.

4. **Knowledge loop**
   - Use past incidents + postmortems as a knowledge base to inform new guidance.
   - Group incidents by correlation keys and service to identify recurring patterns.

## Product constraints & priorities

- Prioritize **clarity and safety** over aggressive automation.
- Prefer **safe, reversible actions** and always label risk levels.
- Everything must be scoped per org and project; no cross-tenant leakage.
- The MVP should be deployable as a single app, but the codebase structure must anticipate future service separation.
