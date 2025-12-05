# SRE Principles & Incident Management Philosophy

## Core SRE Principles

### Error Budgets & SLOs
- Track service-level objectives (SLOs) and error budgets
- Incidents should be linked to SLO violations when applicable
- Error budget burn rate informs incident severity and urgency
- Post-incident reviews should assess impact on error budgets

### Blameless Postmortems
- Focus on systems and processes, not individuals
- Root cause analysis should identify contributing factors, not culprits
- Action items should improve systems, not punish people
- Psychological safety is essential for honest incident analysis

### Toil Reduction
- Automate repetitive incident response tasks
- Runbooks should be executable, not just documentation
- Track time spent on incidents to identify automation opportunities
- Measure and reduce mean time to resolution (MTTR)

## Incident Severity Framework

### Severity Levels
- **SEV-1 (Critical)**: Complete service outage or data loss affecting all users
- **SEV-2 (High)**: Major functionality degraded, affecting significant user subset
- **SEV-3 (Medium)**: Minor functionality impaired, workarounds available
- **SEV-4 (Low)**: Cosmetic issues or minimal impact

### Severity Implications
- SEV-1/SEV-2: Immediate response required, page on-call
- SEV-3: Response during business hours
- SEV-4: Can be scheduled as regular work

## Incident Lifecycle

### States
1. **Detected**: Alert fired or issue reported
2. **Acknowledged**: Responder assigned and aware
3. **Investigating**: Root cause analysis in progress
4. **Mitigating**: Temporary fix being applied
5. **Resolved**: Service restored to normal
6. **Closed**: Postmortem complete, action items tracked

### Key Metrics
- **MTTD** (Mean Time to Detect): Alert to acknowledgment
- **MTTA** (Mean Time to Acknowledge): Detection to response
- **MTTR** (Mean Time to Resolve): Detection to resolution
- **MTTF** (Mean Time to Failure): Time between incidents

## Observability & Signals

### Signal Types
- **Alerts**: Threshold-based notifications from monitoring systems
- **Logs**: Structured or unstructured event records
- **Metrics**: Time-series data (latency, error rate, throughput)
- **Traces**: Distributed request flows across services
- **Events**: Discrete occurrences (deploys, config changes)

### Signal Correlation
- Group related signals to reduce noise
- Use correlation keys (trace IDs, request IDs, service names)
- Temporal correlation: signals within time windows
- Causal correlation: upstream/downstream service relationships

## Runbook Best Practices

### Runbook Structure
1. **Symptom**: What the alert or issue looks like
2. **Impact**: User-facing consequences
3. **Diagnosis**: How to confirm the issue
4. **Mitigation**: Step-by-step resolution
5. **Prevention**: Long-term fixes or improvements

### Runbook Maintenance
- Update runbooks after each incident
- Version control runbook changes
- Test runbooks regularly (chaos engineering)
- Link runbooks to specific alert types

## On-Call & Escalation

### On-Call Principles
- Clear escalation paths
- Handoff protocols for shift changes
- Support for on-call engineers (backup, resources)
- Rotation schedules to prevent burnout

### Escalation Triggers
- Incident not resolved within SLA
- Severity upgrade during investigation
- Need for specialized expertise
- Cross-team coordination required

## Continuous Improvement

### Learning from Incidents
- Every incident is a learning opportunity
- Track recurring issues and patterns
- Measure effectiveness of action items
- Share learnings across teams

### Action Item Tracking
- Assign owners and due dates
- Prioritize based on impact and likelihood
- Review action item completion regularly
- Close the loop: verify fixes prevent recurrence

## Integration with Development

### Incident-Driven Development
- Incidents inform reliability roadmap
- Balance feature work with reliability improvements
- Use error budgets to justify reliability investments
- Embed SRE practices in development workflow

### Deployment & Rollback
- Link incidents to recent deployments
- Fast rollback capabilities
- Gradual rollouts (canary, blue-green)
- Automated rollback on SLO violations

---

### 4. `.kiro/steering/sre-principles.md`

```md
# SRE & Incident Management Principles – Runbook Revenant

## Incident lifecycle

Use the following canonical lifecycle:

- `OPEN`          – incident has been detected/declared.
- `INVESTIGATING` – team is actively diagnosing.
- `MITIGATED`     – impact has been reduced or removed; root cause may still be unknown.
- `RESOLVED`      – incident fully understood; remedial actions in place.
- `CANCELLED`     – incident declared in error or superseded.

Status transitions should be recorded as explicit events (`INCIDENT_STATUS_CHANGED`) and reflected in `IncidentSnapshot`.

## Severity model

Use four severities:

- `SEV1` – critical outage or major impact to many users.
- `SEV2` – serious degradation or outage for a subset of users.
- `SEV3` – minor degradation, partial feature impact.
- `SEV4` – low urgency, cosmetic or non-user-visible.

Only `SRE_LEAD` and `ORG_ADMIN` are expected to change severity; changes must be auditable.

## Safety & action types

- Categorize actions as:
  - `SAFE_REVERSIBLE` – e.g., rollback a deploy, scale up, toggle a feature flag.
  - `RISKY` – changes that can cause downtime or data changes.
  - `INFO_ONLY` – adding notes, tagging incidents, linking tickets.
- For this project, **actual destructive actions (like dropping databases) must not be implemented**.
- Playbook actions in the UI should be **simulated**:
  - They write `IncidentAction` events and update the timeline.
  - They should be clearly labeled as “Demo only / simulated”.

## Postmortem philosophy

- Postmortems must be:
  - **Blameless** – no personal blame; focus on systems, processes, and signals.
  - **Fact-based** – anchored on actual timeline events and metrics.
  - **Actionable** – specific follow-up items with owners.

- Language guidelines:
  - Avoid “X broke the system”, prefer “The change to component A caused…”.
  - Highlight detection, diagnosis, and mitigation gaps, not individual failures.

## Observability & correlation

- Encourage use of:
  - Distributed tracing (`traceId`, `spanId`).
  - App-level request IDs when tracing is unavailable.
- All ingested logs/alerts should be tied to:
  - `serviceName`, `environment`, `traceId?`, `requestId?`, and a derived `correlationKey`.
- Incidents should group related signals via these correlation keys and trace IDs.

## Knowledge reuse

- During active incidents:
  - Surface relevant runbook sections and similar past incidents.
- After incidents:
  - Ensure postmortems are stored and discoverable.
  - Use tags and correlation keys to group recurring patterns.

## User experience expectations

- Optimize the UI for:
  - Fast situational awareness (what’s broken, how bad, what changed?).
  - Minimal context switching (metrics, logs, actions, guidance on a single screen).
- Avoid noisy animations and distractions; favor calm clarity.
