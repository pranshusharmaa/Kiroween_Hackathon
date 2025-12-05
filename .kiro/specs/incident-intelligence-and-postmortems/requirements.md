
---

### 4. `.kiro/specs/incident-intelligence-and-postmortems.md`

```md
# Spec: Incident Intelligence and Postmortems (Enterprise-Grade)

## Overview

Define how Runbook Revenant provides:

1. Context-aware **guided actions** during incidents.
2. High-quality **postmortems** that feed into a growing knowledge base.
3. A **related incidents** and **runbook suggestions** mechanism.

This is built on top of:

- Incident events + derived models (from ITS)
- Runbooks and existing postmortems (from KRS)
- Connector context (from CIS)
- SRE principles & tone (from steering)
- MCP servers (for GitHub, Jira, Slack)

---

## Goals

- Make incidents **more actionable** via suggested next steps and diagnostic questions.
- Turn timelines into structured, SRE-style **postmortems** in one click.
- Reuse knowledge by linking similar past incidents and relevant runbooks.

---

## Non-Goals

- Training a custom ML model; we use heuristics + Kiro for now.
- Fully automatic remediation; humans remain in control.

---

## Inputs & Context

For any intelligence request, the IGS must gather:

1. **Incident context** (from ITS):
   - `IncidentSnapshot`
   - Recent events (`IncidentEvent` within a time window)
   - `IncidentSignal[]`
   - `IncidentAction[]`
   - `SLOViolation[]`

2. **Connector context** (from CIS):
   - Recent alerts and metadata tied to the incident.
   - Linked tickets (Jira, GitHub).
   - Optionally, Slack thread references.

3. **Knowledge context** (from KRS):
   - Runbook markdown for the incident’s `serviceName` (`runbooks/<service>.md`).
   - Previous `Postmortem`s for:
     - Same service
     - Same or similar correlationKeys

4. **Steering context**:
   - SRE principles (blameless, safety).
   - Postmortem structure and tone.

---

## Suggested Actions & Guidance

### API

`GET /orgs/:orgId/incidents/:id/guidance`

Response:

```json
{
  "incidentId": "inc_123",
  "generatedAt": "2025-10-05T11:00:00Z",
  "actions": [
    {
      "label": "Rollback deploy 2025-10-05-1234",
      "explanation": "Error rate and latency increased immediately after this deploy; a prior incident with similar correlationKey was resolved by rollback.",
      "safetyLevel": "SAFE_REVERSIBLE",
      "kind": "RUNBOOK_STEP",
      "runbookSection": "Mitigations > Rollback"
    }
  ],
  "diagnosticQuestions": [
    "Are errors localized to the checkout endpoint or global?",
    "Did any upstream dependencies change around incident start time?"
  ],
  "relatedIncidents": [
    {
      "id": "inc_045",
      "title": "Checkout 5xx spike after deploy",
      "resolvedAt": "2025-08-01T12:10:00Z",
      "similarity": 0.82
    }
  ]
}
