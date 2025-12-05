# LLM Integration Guide

## Overview

Runbook Revenant is architected to be **LLM-ready** while maintaining full demo functionality without requiring external LLM services. The system uses a **context builder pattern** that enriches AI-powered features with relevant runbooks, past incidents, and deployment data.

## Architecture

### Context Builder Module

**Location**: `src/modules/intelligence/context.ts`

The context builder aggregates rich incident context for LLM calls:

```typescript
export type IncidentLlmContext = {
  incidentSummary: string;        // Current incident details
  slaRiskText: string;            // Risk assessment
  dataPaths: string[];            // Affected business flows
  services: string[];             // Involved services
  timelineText: string;           // Event timeline
  whatChangedText: string;        // Recent deployments
  runbookContext: string;         // Relevant runbook snippets
  pastIncidentsContext: string;   // Similar past incidents
};
```

### Key Function

```typescript
buildIncidentLlmContext(orgId: string, incidentId: string): Promise<IncidentLlmContext>
```

This function:
1. Loads the current incident with signals and actions
2. Builds a timeline from recent events
3. Finds relevant runbooks for the service
4. Queries similar past incidents with their resolutions
5. Summarizes recent deployments with guardrail results
6. Returns structured context ready for LLM prompts

## Integration Points

### 1. Incident Guidance

**File**: `src/modules/intelligence/guidance.ts`

**Current**: Rule-based guidance generation  
**LLM-Ready**: Context builder provides rich input

```typescript
// Build context
const llmContext = await buildIncidentLlmContext(orgId, incidentId);

// Use in LLM call (when integrated)
const prompt = `
${formatContextForPrompt(llmContext)}

Generate suggested actions for this incident.
Focus on safe, reversible actions first.
`;

// For now, uses rule-based logic enriched with context
const actions = generateSuggestedActions(
  incident,
  events,
  runbook,
  recentIncidents,
  postmortems,
  llmContext  // ← Context available for future LLM use
);
```

### 2. Postmortem Generation

**File**: `src/modules/intelligence/postmortem.ts`

**Current**: Template-based postmortem generation  
**LLM-Ready**: Context builder provides timeline, runbooks, and past incidents

```typescript
// Build context
const llmContext = await buildIncidentLlmContext(orgId, incidentId);

// Use in LLM call (when integrated)
const prompt = `
${formatContextForPrompt(llmContext)}

Generate a blameless postmortem following SRE best practices.
Include: summary, timeline, root cause, impact, resolution, action items.
`;

// For now, uses template generation enriched with context
const markdown = generatePostmortemMarkdown(
  incident,
  events,
  duration,
  runbook,
  options,
  llmContext  // ← Context available for future LLM use
);
```

## Demo Mode vs Production Mode

### Demo Mode (Current)

- **No external LLM required**
- Rule-based guidance generation
- Template-based postmortem generation
- Context builder still runs and enriches output
- Fully functional for demonstrations

### Production Mode (Future)

To integrate a real LLM:

1. **Add LLM Client**
   ```typescript
   // src/lib/llm/client.ts
   export async function callLLM(prompt: string): Promise<string> {
     // OpenAI, Anthropic, or other LLM API
   }
   ```

2. **Update Guidance Module**
   ```typescript
   // src/modules/intelligence/guidance.ts
   import { callLLM } from '@/lib/llm/client';
   
   const llmContext = await buildIncidentLlmContext(orgId, incidentId);
   const prompt = formatContextForPrompt(llmContext) + "\n\nGenerate guidance...";
   const llmResponse = await callLLM(prompt);
   
   // Parse LLM response into SuggestedAction[]
   ```

3. **Update Postmortem Module**
   ```typescript
   // src/modules/intelligence/postmortem.ts
   import { callLLM } from '@/lib/llm/client';
   
   const llmContext = await buildIncidentLlmContext(orgId, incidentId);
   const prompt = formatContextForPrompt(llmContext) + "\n\nGenerate postmortem...";
   const markdown = await callLLM(prompt);
   ```

## Context Builder Features

### 1. Incident Summary
- Title, service, environment, severity, status
- Creation and update timestamps
- Current state assessment

### 2. SLA Risk Assessment
- Duration calculation
- Risk level based on severity and time
- Automatic escalation indicators

### 3. Timeline Construction
- Recent signals (alerts, metrics, logs)
- User actions (investigations, mitigations)
- Chronologically sorted
- Formatted as bullet list

### 4. What Changed Analysis
- Deployments within 2-hour window before incident
- Guardrail check results (PASS/WARN/FAIL)
- Change types (DEPLOY, CONFIG, ROLLBACK, SCALE)
- Time correlation with incident

### 5. Runbook Context
- Finds runbooks for affected service
- Extracts relevant sections
- Truncates to manageable size (500 chars)
- Falls back gracefully if unavailable

### 6. Past Incidents Context
- Queries similar incidents (same service)
- Includes resolved incidents only
- Extracts resolution details from postmortems
- Provides pattern recognition data
- Truncates summaries (200 chars each)

## Error Handling

The context builder is **robust by design**:

```typescript
try {
  // Build context
} catch (error) {
  // Return minimal context instead of failing
  return {
    incidentSummary: `Incident ${incidentId}`,
    slaRiskText: 'Unknown risk level',
    dataPaths: [],
    services: [],
    timelineText: 'Timeline unavailable',
    whatChangedText: 'Change history unavailable',
    runbookContext: '',
    pastIncidentsContext: '',
  };
}
```

Each sub-function also handles errors gracefully:
- Missing runbooks → empty string
- No past incidents → empty string
- Failed deployment queries → fallback message

## Prompt Engineering

### Format Helper

```typescript
formatContextForPrompt(context: IncidentLlmContext): string
```

Formats context into a structured prompt:

```
## Current Incident
Title: API Gateway 500 errors spike
Service: api-gateway
...

## Risk Assessment
Severity: SEV2, Status: OPEN, Duration: 2h 15m, Risk Level: HIGH

## Timeline
• 14:23:15 - SIGNAL: [ERROR_RATE_SPIKE] Error rate increased to 5.2% (api-gateway)
• 14:25:30 - ACTION: [INVESTIGATION_STARTED] Team notified via PagerDuty
...

## Recent Changes
• DEPLOY: Update payment gateway timeout settings (12m before incident) [Guardrail: WARN]
...

## Relevant Runbooks
Runbook for api-gateway:
- Check service health endpoints
- Review recent deployments and rollback if needed
...

## Past Similar Incidents
• [SEV2] API Gateway timeout spike - Resolved in 3h
  Resolution: Rolled back deployment #456, scaled service to 10 replicas...
```

## Benefits

### 1. Separation of Concerns
- Context building is separate from LLM calls
- Easy to test context builder independently
- Can swap LLM providers without changing context logic

### 2. Demo-Friendly
- Works without external dependencies
- Rule-based fallbacks provide value
- Context enriches even non-LLM features

### 3. Production-Ready
- Structured context for consistent prompts
- Error handling prevents failures
- Truncation prevents token limit issues

### 4. Knowledge Leverage
- Automatically includes runbooks
- Learns from past incidents
- Correlates with recent changes

## Testing

### Test Context Builder

```typescript
// scripts/test-context-builder.ts
import { buildIncidentLlmContext } from '../src/modules/intelligence/context';

const context = await buildIncidentLlmContext(orgId, incidentId);
console.log(JSON.stringify(context, null, 2));
```

### Verify Prompt Format

```typescript
import { formatContextForPrompt } from '../src/modules/intelligence/context';

const formatted = formatContextForPrompt(context);
console.log(formatted);
```

## Future Enhancements

### 1. Streaming Responses
```typescript
export async function streamLLMResponse(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<void>
```

### 2. Multi-Turn Conversations
```typescript
export type ConversationContext = {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  incidentContext: IncidentLlmContext;
};
```

### 3. Fine-Tuning Data
Export context + responses for fine-tuning:
```typescript
export async function exportTrainingData(
  orgId: string,
  startDate: Date,
  endDate: Date
): Promise<TrainingExample[]>
```

### 4. Caching
Cache context for repeated calls:
```typescript
const contextCache = new Map<string, IncidentLlmContext>();
```

## Configuration

### Environment Variables (Future)

```env
# LLM Provider
LLM_PROVIDER=openai  # or anthropic, azure, etc.
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4
LLM_MAX_TOKENS=2000
LLM_TEMPERATURE=0.7

# Feature Flags
ENABLE_LLM_GUIDANCE=true
ENABLE_LLM_POSTMORTEMS=true
FALLBACK_TO_RULES=true  # Use rule-based if LLM fails
```

### Feature Flags

```typescript
// src/lib/feature-flags.ts
export const isLLMEnabled = () => {
  return process.env.ENABLE_LLM_GUIDANCE === 'true';
};

export const shouldFallbackToRules = () => {
  return process.env.FALLBACK_TO_RULES !== 'false';
};
```

## Summary

Runbook Revenant's LLM integration architecture:

✅ **Works today** without external LLM services  
✅ **Ready for production** LLM integration  
✅ **Enriches context** with runbooks and past incidents  
✅ **Handles errors** gracefully  
✅ **Separates concerns** for maintainability  
✅ **Supports testing** and iteration  

The system demonstrates best practices for building LLM-ready applications that remain functional and valuable even without LLM integration.

---

**🎃 Built for the future, works today! 🎃**
