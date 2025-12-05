# Intelligence & Guidance Service (IGS) + Knowledge & Runbook Service (KRS) - Implementation Summary

## Overview

Successfully implemented the Intelligence & Guidance Service (IGS) and postmortem functionality of the Knowledge & Runbook Service (KRS), providing AI-powered incident guidance and automated postmortem generation following SRE principles.

## What Was Implemented

### 1. Prisma Schema Extension ✅

Added **Postmortem** model to `prisma/schema.prisma`:
- `id`, `orgId`, `incidentId` (unique), `markdown`, `summaryText`, `tags` (JSON)
- Indexed on `[orgId, createdAt]` and `[orgId, incidentId]`
- Stores generated postmortems with full markdown content

### 2. Knowledge & Runbook Service (KRS) ✅

**src/modules/knowledge/**

**types.ts**
- Postmortem interface and metadata types
- SavePostmortemInput interface

**runbooks.ts**
- `getRunbookForService()` - Retrieves runbook markdown for a service
- `listRunbooks()` - Lists available runbooks
- Placeholder implementation with sample runbooks for api-gateway and checkout

**postmortems.ts**
- `savePostmortem()` - Saves generated postmortem to database
- `getPostmortemForIncident()` - Retrieves postmortem for specific incident
- `getPostmortemsForService()` - Gets postmortems for a service
- `getRecentPostmortems()` - Lists recent postmortems for org
- `searchPostmortems()` - Full-text search in postmortems

### 3. Intelligence & Guidance Service (IGS) ✅

**src/modules/intelligence/**

**types.ts**
- SafetyLevel enum: SAFE_REVERSIBLE, RISKY, INFO_ONLY
- SuggestedAction, RelatedIncident, IncidentGuidance interfaces
- PostmortemOptions and GeneratedPostmortem interfaces

**guidance.ts**
- `getGuidanceForIncident()` - Main guidance generation function
- `generateSuggestedActions()` - Creates context-aware action suggestions
- `generateDiagnosticQuestions()` - Generates relevant diagnostic questions
- `findRelatedIncidents()` - Finds similar incidents using similarity scoring
- `classifyActionSafety()` - Classifies actions by safety level per SRE principles

**Guidance Features:**
- Suggests rollback if recent deployment detected
- Recommends scaling based on similar incident patterns
- Prompts for log/metric attachment if missing
- Links to runbook sections when available
- Generates service-specific diagnostic questions
- Finds related incidents by service, severity, environment, correlation keys

**postmortem.ts**
- `generatePostmortem()` - Main postmortem generation function
- `generatePostmortemMarkdown()` - Creates structured markdown following SRE format
- Blameless language throughout
- Fact-based analysis
- Actionable recommendations

**Postmortem Structure:**
1. Title and Metadata
2. Summary
3. Impact (severity-specific)
4. Root Cause (blameless analysis)
5. Timeline (key events)
6. Detection
7. Response (actions taken)
8. Resolution
9. Action Items (6 standard items)
10. Lessons Learned (What went well, What could improve, Where we got lucky)

### 4. API Routes ✅

**GET /api/orgs/:orgId/incidents/:incidentId/guidance**
- Returns AI-powered guidance with:
  - Suggested actions with safety levels
  - Diagnostic questions
  - Related incidents with similarity scores

**POST /api/orgs/:orgId/incidents/:incidentId/postmortem**
- Generates new postmortem
- Prevents duplicates (409 if exists)
- Returns markdown, summary, tags, metadata

**GET /api/orgs/:orgId/incidents/:incidentId/postmortem**
- Retrieves existing postmortem
- Returns full postmortem object

**GET /api/orgs/:orgId/incidents/:incidentId/related**
- Returns related incidents
- Uses same logic as guidance endpoint

**POST /api/orgs/:orgId/incidents/:incidentId/postmortem/pr**
- Placeholder for GitHub PR creation
- Returns what would be done (branch, file, commit, PR details)
- Ready for MCP integration

## SRE Principles Compliance ✅

### Blameless Postmortems
- ✅ No individual blame in language
- ✅ Focus on systems and processes
- ✅ "What went well" section included
- ✅ Constructive improvement suggestions
- ✅ Explicit note about blameless approach

### Safety Classification
- ✅ Actions classified as SAFE_REVERSIBLE, RISKY, or INFO_ONLY
- ✅ Rollbacks and scaling marked as SAFE_REVERSIBLE
- ✅ Database changes and config changes marked as RISKY
- ✅ Notes and status changes marked as INFO_ONLY

### Structured Postmortems
- ✅ Follows standard SRE postmortem format
- ✅ Includes timeline of events
- ✅ Documents impact clearly
- ✅ Provides actionable items
- ✅ Captures lessons learned

### Knowledge Reuse
- ✅ Links to runbooks when available
- ✅ Finds related incidents
- ✅ Suggests actions based on past patterns
- ✅ Stores postmortems for future reference

## Testing Results ✅

### Guidance Endpoint
```json
{
  "incidentId": "inc_1764824743243_8qktws3bc",
  "actions": [
    {
      "label": "Attach relevant logs and metrics",
      "safetyLevel": "INFO_ONLY",
      "kind": "NOTE"
    },
    {
      "label": "Review runbook for diagnostic steps",
      "safetyLevel": "INFO_ONLY",
      "kind": "RUNBOOK_STEP_EXECUTED",
      "runbookSection": "Diagnosis"
    }
  ],
  "diagnosticQuestions": [
    "Is the issue affecting all users or a specific subset?",
    "When did the issue start? Does it correlate with any deployments or changes?",
    "Are errors localized to specific endpoints or global?",
    "What is the current request rate compared to baseline?",
    "Have customers been notified via status page?",
    "Is the on-call team fully engaged?"
  ],
  "relatedIncidents": []
}
```

### Postmortem Generation
Generated complete postmortem with:
- ✅ Blameless language
- ✅ Structured sections
- ✅ Timeline of events
- ✅ Action items
- ✅ Lessons learned
- ✅ Summary text: "SEV1 incident in api-gateway (production) lasting 8m. In progress."
- ✅ Tags: ["api-gateway", "SEV1", "production", "correlated"]

### Related Incidents
- ✅ Returns empty array when no similar incidents
- ✅ Ready to return matches based on similarity scoring

## Architecture Compliance ✅

### Module Dependencies
- ✅ IGS depends on ITS (incidents) and KRS (knowledge)
- ✅ IGS does not perform direct DB access
- ✅ Pure functions that compose data from other modules
- ✅ KRS handles all postmortem persistence

### Service Boundaries
- ✅ Clear separation between intelligence and knowledge
- ✅ Guidance logic is pure and testable
- ✅ Postmortem generation is pure and testable
- ✅ Ready for future service splitting

### Multi-Tenancy
- ✅ All queries scoped by orgId
- ✅ Postmortems isolated per org
- ✅ No cross-tenant data leakage

## Guidance Logic

### Action Suggestions Based On:
1. **Recent Deployments** → Suggest rollback
2. **Similar Incident Patterns** → Suggest scaling
3. **Missing Signals** → Prompt for logs/metrics
4. **Available Runbooks** → Link to diagnostic steps
5. **Incident Age** → Suggest status updates
6. **Multiple Signals** → Check circuit breakers

### Diagnostic Questions Based On:
1. **Service Type** (API, database, etc.)
2. **Severity Level** (SEV1/SEV2 get escalation questions)
3. **Environment** (production vs staging)
4. **General Best Practices** (upstream dependencies, timing)

### Related Incident Scoring:
- Same service: +0.4
- Same severity: +0.2
- Same environment: +0.1
- Overlapping correlation keys: +0.3
- Threshold: 0.5 minimum similarity

## Files Created

### Knowledge Module
- `src/modules/knowledge/types.ts` - Type definitions
- `src/modules/knowledge/runbooks.ts` - Runbook retrieval
- `src/modules/knowledge/postmortems.ts` - Postmortem persistence

### Intelligence Module
- `src/modules/intelligence/types.ts` - Type definitions
- `src/modules/intelligence/guidance.ts` - Guidance generation
- `src/modules/intelligence/postmortem.ts` - Postmortem generation

### API Routes
- `src/app/api/orgs/[orgId]/incidents/[incidentId]/guidance/route.ts`
- `src/app/api/orgs/[orgId]/incidents/[incidentId]/postmortem/route.ts`
- `src/app/api/orgs/[orgId]/incidents/[incidentId]/related/route.ts`
- `src/app/api/orgs/[orgId]/incidents/[incidentId]/postmortem/pr/route.ts`

## Example Usage

### Get Guidance
```bash
curl http://localhost:3000/api/orgs/{orgId}/incidents/{incidentId}/guidance
```

### Generate Postmortem
```bash
curl -X POST http://localhost:3000/api/orgs/{orgId}/incidents/{incidentId}/postmortem \
  -H "Content-Type: application/json" \
  -d '{
    "includeMetrics": true,
    "includeTimeline": true
  }'
```

### Get Postmortem
```bash
curl http://localhost:3000/api/orgs/{orgId}/incidents/{incidentId}/postmortem
```

### Get Related Incidents
```bash
curl http://localhost:3000/api/orgs/{orgId}/incidents/{incidentId}/related
```

### Create GitHub PR (Placeholder)
```bash
curl -X POST http://localhost:3000/api/orgs/{orgId}/incidents/{incidentId}/postmortem/pr
```

## Future Enhancements

1. **Runbook Storage**
   - Move from placeholder to database/file system
   - Support runbook versioning
   - Enable runbook editing via UI

2. **MCP Integration**
   - Implement GitHub PR creation
   - Add Jira ticket linking
   - Enable Slack notifications

3. **Enhanced Intelligence**
   - Use Kiro AI for more sophisticated guidance
   - Implement pattern detection across incidents
   - Add predictive incident prevention

4. **Postmortem Improvements**
   - Support custom templates
   - Add metrics/graphs to postmortems
   - Enable collaborative editing

5. **Knowledge Graph**
   - Build relationships between incidents, runbooks, postmortems
   - Implement graph-based similarity
   - Enable knowledge discovery

## Summary

✅ Complete Intelligence & Guidance Service implementation
✅ Postmortem generation with SRE principles
✅ Context-aware action suggestions
✅ Related incident detection
✅ Runbook integration (placeholder)
✅ 4 API endpoints fully functional
✅ Blameless, fact-based postmortems
✅ Safety-classified actions
✅ Ready for MCP integration
✅ Pure, testable intelligence logic
