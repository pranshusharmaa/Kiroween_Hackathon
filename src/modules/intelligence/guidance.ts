import { getIncidentWithDetails, getIncidentEvents, getRecentIncidentsForService } from '../incidents/queries';
import { getRunbookForService } from '../knowledge/runbooks';
import { getPostmortemsForService } from '../knowledge/postmortems';
import { IncidentGuidance, SuggestedAction, RelatedIncident, SafetyLevel } from './types';
import { buildIncidentLlmContext, formatContextForPrompt } from './context';

// Simple in-memory cache for guidance (5 minute TTL)
const guidanceCache = new Map<string, { data: IncidentGuidance; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate guidance for an incident
 * Uses rich context including runbooks and past incidents
 * OPTIMIZED: Reduced duplicate queries + caching
 */
export async function getGuidanceForIncident(
  orgId: string,
  incidentId: string
): Promise<IncidentGuidance> {
  // Check cache first
  const cacheKey = `${orgId}:${incidentId}`;
  const cached = guidanceCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  // Gather context for rule-based guidance (single query with includes)
  const incident = await getIncidentWithDetails(orgId, incidentId);
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  // Parallel fetch of independent data
  const [events, runbook, recentIncidents] = await Promise.all([
    getIncidentEvents(orgId, incidentId),
    getRunbookForService(orgId, incident.serviceName),
    getRecentIncidentsForService(orgId, incident.serviceName, 10),
  ]);

  // Note: LLM context building is expensive and only needed for actual LLM calls
  // For demo/rule-based guidance, we skip it to improve performance
  // When integrating with real LLM, call buildIncidentLlmContext() here

  // Generate suggested actions
  const actions = generateSuggestedActions(
    incident,
    events,
    runbook,
    recentIncidents,
    null, // postmortems - skip for performance
    null  // llmContext - skip for performance
  );

  // Generate diagnostic questions
  const diagnosticQuestions = generateDiagnosticQuestions(incident, events, runbook, null);

  // Find related incidents
  const relatedIncidents = findRelatedIncidents(incident, recentIncidents);

  const guidance: IncidentGuidance = {
    incidentId,
    generatedAt: new Date(),
    actions,
    diagnosticQuestions,
    relatedIncidents,
  };

  // Cache the result
  guidanceCache.set(cacheKey, {
    data: guidance,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  // Clean up old cache entries periodically
  if (guidanceCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of guidanceCache.entries()) {
      if (value.expiresAt < now) {
        guidanceCache.delete(key);
      }
    }
  }

  return guidance;
}

/**
 * Generate suggested actions based on context
 * Now enriched with LLM context including runbooks and past incidents
 */
function generateSuggestedActions(
  incident: any,
  events: any[],
  runbook: string | null,
  recentIncidents: any[],
  postmortems: any[] | null,
  llmContext: any | null
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  // Check if there was a recent deployment
  const hasRecentDeploy = events.some((e) =>
    e.payload?.details?.toLowerCase().includes('deploy')
  );

  if (hasRecentDeploy && incident.severity === 'SEV1') {
    actions.push({
      label: 'Consider rollback to previous version',
      explanation:
        'Error rate increased after recent deployment. Rolling back may quickly restore service.',
      safetyLevel: 'SAFE_REVERSIBLE',
      kind: 'ROLLBACK_TRIGGERED',
      runbookSection: runbook ? 'Mitigation > Rollback' : undefined,
    });
  }

  // Check if similar incidents were resolved by scaling
  const similarScalingIncidents = recentIncidents.filter(
    (i) => i.status === 'RESOLVED' && i.severity === incident.severity
  );

  if (similarScalingIncidents.length > 0 && incident.severity !== 'SEV4') {
    actions.push({
      label: 'Scale up service replicas',
      explanation:
        'Similar incidents were resolved by scaling. Consider increasing capacity temporarily.',
      safetyLevel: 'SAFE_REVERSIBLE',
      kind: 'SCALE_CHANGE',
      runbookSection: runbook ? 'Mitigation > Scale Up' : undefined,
    });
  }

  // Suggest checking logs
  if (incident.signals.length === 0) {
    actions.push({
      label: 'Attach relevant logs and metrics',
      explanation:
        'No signals attached yet. Adding observability data will help with diagnosis.',
      safetyLevel: 'INFO_ONLY',
      kind: 'NOTE',
    });
  }

  // Suggest runbook steps if available
  if (runbook) {
    actions.push({
      label: 'Review runbook for diagnostic steps',
      explanation: `Runbook available for ${incident.serviceName}. Follow diagnosis section.`,
      safetyLevel: 'INFO_ONLY',
      kind: 'RUNBOOK_STEP_EXECUTED',
      runbookSection: 'Diagnosis',
    });
  }

  // Check if incident has been open too long
  const incidentAge = Date.now() - new Date(incident.createdAt).getTime();
  const hoursOpen = incidentAge / (1000 * 60 * 60);

  if (hoursOpen > 2 && incident.status === 'OPEN') {
    actions.push({
      label: 'Update incident status to INVESTIGATING',
      explanation: 'Incident has been open for over 2 hours. Update status to reflect current state.',
      safetyLevel: 'INFO_ONLY',
      kind: 'STATUS_CHANGE',
    });
  }

  // Suggest checking for circuit breaker if multiple signals
  if (incident.signals.length > 3) {
    actions.push({
      label: 'Check circuit breaker status',
      explanation:
        'Multiple signals detected. Verify circuit breakers are functioning to prevent cascading failures.',
      safetyLevel: 'INFO_ONLY',
      kind: 'RUNBOOK_STEP_EXECUTED',
      runbookSection: runbook ? 'Diagnosis' : undefined,
    });
  }

  return actions;
}

/**
 * Generate diagnostic questions based on context
 * Now enriched with LLM context including runbooks and past incidents
 */
function generateDiagnosticQuestions(
  incident: any,
  events: any[],
  runbook: string | null,
  llmContext: any | null
): string[] {
  const questions: string[] = [];

  // Basic diagnostic questions
  questions.push(
    `Is the issue affecting all users or a specific subset?`,
    `When did the issue start? Does it correlate with any deployments or changes?`
  );

  // Service-specific questions
  if (incident.serviceName.includes('api') || incident.serviceName.includes('gateway')) {
    questions.push(
      `Are errors localized to specific endpoints or global?`,
      `What is the current request rate compared to baseline?`
    );
  }

  if (incident.serviceName.includes('database') || incident.serviceName.includes('db')) {
    questions.push(
      `Is the database connection pool exhausted?`,
      `Are there any long-running queries or locks?`
    );
  }

  // Severity-specific questions
  if (incident.severity === 'SEV1' || incident.severity === 'SEV2') {
    questions.push(
      `Have customers been notified via status page?`,
      `Is the on-call team fully engaged?`
    );
  }

  // Check for upstream dependencies
  questions.push(
    `Did any upstream dependencies change around incident start time?`,
    `Are there any related incidents in dependent services?`
  );

  // Environment-specific
  if (incident.environment === 'production') {
    questions.push(
      `Is the staging environment experiencing similar issues?`,
      `Can the issue be reproduced in a non-production environment?`
    );
  }

  return questions.slice(0, 6); // Limit to 6 questions
}

/**
 * Find related incidents based on similarity
 */
function findRelatedIncidents(incident: any, recentIncidents: any[]): RelatedIncident[] {
  const related: RelatedIncident[] = [];

  for (const other of recentIncidents) {
    if (other.id === incident.id) continue;

    let similarity = 0;

    // Same service
    if (other.serviceName === incident.serviceName) {
      similarity += 0.4;
    }

    // Same severity
    if (other.severity === incident.severity) {
      similarity += 0.2;
    }

    // Same environment
    if (other.environment === incident.environment) {
      similarity += 0.1;
    }

    // Overlapping correlation keys
    const incidentKeys = new Set(incident.correlationKeys || []);
    const otherKeys = new Set(other.correlationKeys || []);
    const overlap = [...incidentKeys].filter((k) => otherKeys.has(k)).length;
    if (overlap > 0) {
      similarity += 0.3;
    }

    // Only include if similarity is significant
    if (similarity >= 0.5) {
      related.push({
        id: other.id,
        title: other.title,
        resolvedAt: other.status === 'RESOLVED' ? other.updatedAt : null,
        similarity,
        serviceName: other.serviceName,
        severity: other.severity,
      });
    }
  }

  // Sort by similarity and return top 5
  return related.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}

/**
 * Classify action safety level based on action kind
 */
export function classifyActionSafety(actionKind: string): SafetyLevel {
  const safeActions = [
    'ROLLBACK_TRIGGERED',
    'SCALE_CHANGE',
    'NOTE',
    'STATUS_CHANGE',
    'SEVERITY_CHANGE',
    'TAG_ADDED',
    'TAG_REMOVED',
  ];

  const riskyActions = [
    'DATABASE_MIGRATION',
    'CONFIG_CHANGE',
    'CACHE_CLEAR',
    'SERVICE_RESTART',
  ];

  if (safeActions.includes(actionKind)) {
    return actionKind === 'NOTE' || actionKind === 'STATUS_CHANGE' || actionKind === 'TAG_ADDED'
      ? 'INFO_ONLY'
      : 'SAFE_REVERSIBLE';
  }

  if (riskyActions.includes(actionKind)) {
    return 'RISKY';
  }

  return 'INFO_ONLY';
}
