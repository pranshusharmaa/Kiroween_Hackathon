import { getIncidentWithDetails, getIncidentEvents } from '../incidents/queries';
import { getRunbookForService } from '../knowledge/runbooks';
import { savePostmortem } from '../knowledge/postmortems';
import { GeneratedPostmortem, PostmortemOptions } from './types';
import { buildIncidentLlmContext, formatContextForPrompt } from './context';

/**
 * Generate a postmortem for an incident
 * Follows SRE principles: blameless, fact-based, actionable
 * Now enriched with runbooks and past incidents context
 */
export async function generatePostmortem(
  orgId: string,
  incidentId: string,
  options: PostmortemOptions = {}
): Promise<GeneratedPostmortem> {
  // Build rich LLM context
  const llmContext = await buildIncidentLlmContext(orgId, incidentId);

  // Gather incident context
  const incident = await getIncidentWithDetails(orgId, incidentId);
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  const events = await getIncidentEvents(orgId, incidentId);
  const runbook = await getRunbookForService(orgId, incident.serviceName);

  // Calculate duration
  const startTime = new Date(incident.createdAt);
  const endTime = incident.status === 'RESOLVED' ? new Date(incident.updatedAt) : new Date();
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = Math.floor(durationMs / (1000 * 60));
  const durationHours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;
  const duration =
    durationHours > 0
      ? `${durationHours}h ${remainingMinutes}m`
      : `${durationMinutes}m`;

  // Generate markdown (enriched with LLM context)
  const markdown = generatePostmortemMarkdown(incident, events, duration, runbook, options, llmContext);

  // Generate summary
  const summaryText = generateSummary(incident, duration);

  // Generate tags
  const tags = generateTags(incident, events);

  // Save postmortem
  await savePostmortem(orgId, {
    incidentId,
    markdown,
    summaryText,
    tags,
  });

  return {
    markdown,
    summaryText,
    tags,
    metadata: {
      incidentId,
      serviceName: incident.serviceName,
      severity: incident.severity,
      duration,
      generatedAt: new Date(),
    },
  };
}

/**
 * Generate postmortem markdown following SRE best practices
 * Now enriched with LLM context including runbooks and past incidents
 */
function generatePostmortemMarkdown(
  incident: any,
  events: any[],
  duration: string,
  runbook: string | null,
  options: PostmortemOptions,
  llmContext: any
): string {
  const sections: string[] = [];

  // Title
  sections.push(`# Postmortem: ${incident.title}\n`);

  // Metadata
  sections.push(`**Incident ID:** ${incident.id}`);
  sections.push(`**Service:** ${incident.serviceName}`);
  sections.push(`**Severity:** ${incident.severity}`);
  sections.push(`**Environment:** ${incident.environment}`);
  sections.push(`**Duration:** ${duration}`);
  sections.push(`**Detected:** ${new Date(incident.createdAt).toISOString()}`);
  if (incident.status === 'RESOLVED') {
    sections.push(`**Resolved:** ${new Date(incident.updatedAt).toISOString()}`);
  }
  sections.push('');

  // Summary
  sections.push(`## Summary\n`);
  sections.push(
    `On ${new Date(incident.createdAt).toLocaleDateString()}, the ${incident.serviceName} service experienced ${getSeverityDescription(incident.severity)} lasting ${duration}. The incident was detected by ${incident.detectedBy} and ${incident.status === 'RESOLVED' ? 'has been resolved' : 'is currently being investigated'}.\n`
  );

  // Impact
  sections.push(`## Impact\n`);
  sections.push(getImpactDescription(incident));
  sections.push('');

  // Root Cause (blameless language)
  sections.push(`## Root Cause\n`);
  sections.push(generateRootCauseAnalysis(incident, events));
  sections.push('');

  // Timeline
  if (options.includeTimeline !== false) {
    sections.push(`## Timeline\n`);
    sections.push(generateTimeline(incident, events));
    sections.push('');
  }

  // Detection
  sections.push(`## Detection\n`);
  sections.push(
    `The incident was detected by ${incident.detectedBy}. ${incident.signals.length > 0 ? `${incident.signals.length} signal(s) were captured during the incident.` : 'No automated signals were captured.'}\n`
  );

  // Response
  sections.push(`## Response\n`);
  sections.push(generateResponseSection(incident));
  sections.push('');

  // Resolution
  sections.push(`## Resolution\n`);
  sections.push(generateResolutionSection(incident, events));
  sections.push('');

  // Action Items
  sections.push(`## Action Items\n`);
  sections.push(generateActionItems(incident, runbook));
  sections.push('');

  // Lessons Learned
  sections.push(`## Lessons Learned\n`);
  sections.push(generateLessonsLearned(incident, events));
  sections.push('');

  // Past Similar Incidents (if available from LLM context)
  if (llmContext && llmContext.pastIncidentsContext && llmContext.pastIncidentsContext !== 'No similar past incidents found.') {
    sections.push(`## Related Past Incidents\n`);
    sections.push(llmContext.pastIncidentsContext);
    sections.push('\n');
  }

  return sections.join('\n');
}

function getSeverityDescription(severity: string): string {
  const descriptions: Record<string, string> = {
    SEV1: 'a critical outage',
    SEV2: 'a major service degradation',
    SEV3: 'a minor service impairment',
    SEV4: 'a low-impact issue',
  };
  return descriptions[severity] || 'an incident';
}

function getImpactDescription(incident: any): string {
  const impacts: Record<string, string> = {
    SEV1: `- Complete service outage affecting all users\n- ${incident.serviceName} was unavailable\n- Critical business operations were impacted`,
    SEV2: `- Major functionality degraded for a significant subset of users\n- ${incident.serviceName} experienced elevated error rates\n- User experience was significantly impacted`,
    SEV3: `- Minor functionality impaired with workarounds available\n- ${incident.serviceName} experienced intermittent issues\n- Limited user impact`,
    SEV4: `- Cosmetic or minimal impact\n- ${incident.serviceName} functioned normally for most users\n- No significant business impact`,
  };
  return impacts[incident.severity] || `- Impact assessment pending`;
}

function generateRootCauseAnalysis(incident: any, events: any[]): string {
  // Use blameless language
  const analysis: string[] = [];

  // Check for deployment-related events
  const deployEvents = events.filter((e) =>
    e.payload?.details?.toLowerCase().includes('deploy')
  );

  if (deployEvents.length > 0) {
    analysis.push(
      `The incident appears to be correlated with a recent deployment. The change introduced a condition that led to ${incident.title.toLowerCase()}.`
    );
  } else {
    analysis.push(
      `The root cause is under investigation. Initial analysis suggests the issue originated in the ${incident.serviceName} service.`
    );
  }

  // Add correlation key context
  if (incident.correlationKeys && incident.correlationKeys.length > 0) {
    analysis.push(
      `\nCorrelation keys: ${incident.correlationKeys.join(', ')}`
    );
  }

  // Note: Avoid blaming individuals or teams
  analysis.push(
    `\n*Note: This analysis focuses on system and process factors, not individual actions.*`
  );

  return analysis.join('\n');
}

function generateTimeline(incident: any, events: any[]): string {
  const timeline: string[] = [];

  // Add incident creation
  timeline.push(
    `- **${new Date(incident.createdAt).toISOString()}** - Incident detected and created`
  );

  // Add status changes
  const statusEvents = events.filter((e) => e.type === 'INCIDENT_STATUS_CHANGED');
  for (const event of statusEvents) {
    timeline.push(
      `- **${new Date(event.ts).toISOString()}** - Status changed to ${event.payload.newStatus}`
    );
  }

  // Add key actions
  const actionEvents = events.filter((e) =>
    ['INCIDENT_PLAYBOOK_ACTION_EXECUTED', 'INCIDENT_NOTE_ADDED'].includes(e.type)
  );
  for (const event of actionEvents.slice(0, 5)) {
    // Limit to 5 actions
    timeline.push(
      `- **${new Date(event.ts).toISOString()}** - ${event.payload.label || 'Action taken'}`
    );
  }

  return timeline.join('\n');
}

function generateResponseSection(incident: any): string {
  const actions = incident.actions || [];

  if (actions.length === 0) {
    return `No actions were recorded during the incident response.`;
  }

  const response: string[] = [];
  response.push(`The team took the following actions during incident response:\n`);

  for (const action of actions.slice(0, 10)) {
    // Limit to 10 actions
    response.push(`- ${action.label}${action.details ? `: ${action.details}` : ''}`);
  }

  return response.join('\n');
}

function generateResolutionSection(incident: any, events: any[]): string {
  if (incident.status !== 'RESOLVED') {
    return `The incident is currently ${incident.status.toLowerCase()}. Resolution is in progress.`;
  }

  const resolution: string[] = [];
  resolution.push(
    `The incident was resolved by ${getResolutionMethod(events)}. Service was restored to normal operation.`
  );

  return resolution.join('\n');
}

function getResolutionMethod(events: any[]): string {
  // Look for resolution-related actions
  const rollbackEvents = events.filter((e) =>
    e.payload?.label?.toLowerCase().includes('rollback')
  );
  if (rollbackEvents.length > 0) {
    return 'rolling back to the previous version';
  }

  const scaleEvents = events.filter((e) =>
    e.payload?.label?.toLowerCase().includes('scale')
  );
  if (scaleEvents.length > 0) {
    return 'scaling up service capacity';
  }

  return 'applying mitigation steps from the runbook';
}

function generateActionItems(incident: any, runbook: string | null): string {
  const items: string[] = [];

  items.push(`1. **Improve Detection** - Review and enhance monitoring to detect similar issues earlier`);
  items.push(`2. **Update Runbook** - Document the resolution steps taken during this incident`);
  items.push(`3. **Prevent Recurrence** - Implement safeguards to prevent similar incidents`);

  if (incident.severity === 'SEV1' || incident.severity === 'SEV2') {
    items.push(`4. **Review Deployment Process** - Evaluate deployment procedures and add safety checks`);
  }

  if (!runbook) {
    items.push(`5. **Create Runbook** - Develop a runbook for ${incident.serviceName}`);
  }

  items.push(`6. **Share Learnings** - Present findings to the broader team`);

  return items.join('\n');
}

function generateLessonsLearned(incident: any, events: any[]): string {
  const lessons: string[] = [];

  lessons.push(`### What Went Well\n`);
  lessons.push(`- Incident was detected ${incident.detectedBy === 'alert' ? 'automatically' : 'promptly'}`);
  lessons.push(`- Team responded and began investigation quickly`);
  if (incident.actions && incident.actions.length > 0) {
    lessons.push(`- ${incident.actions.length} action(s) were documented during response`);
  }

  lessons.push(`\n### What Could Be Improved\n`);
  lessons.push(`- Detection time could be reduced with better monitoring`);
  lessons.push(`- Response procedures could be more clearly documented`);
  lessons.push(`- Communication channels could be streamlined`);

  lessons.push(`\n### Where We Got Lucky\n`);
  lessons.push(`- The incident occurred during business hours when the team was available`);
  lessons.push(`- No data loss occurred`);

  return lessons.join('\n');
}

function generateSummary(incident: any, duration: string): string {
  return `${incident.severity} incident in ${incident.serviceName} (${incident.environment}) lasting ${duration}. ${incident.status === 'RESOLVED' ? 'Resolved' : 'In progress'}.`;
}

function generateTags(incident: any, events: any[]): string[] {
  const tags: string[] = [];

  tags.push(incident.serviceName);
  tags.push(incident.severity);
  tags.push(incident.environment);

  // Add tags based on actions
  if (events.some((e) => e.payload?.label?.toLowerCase().includes('rollback'))) {
    tags.push('rollback');
  }

  if (events.some((e) => e.payload?.label?.toLowerCase().includes('scale'))) {
    tags.push('scaling');
  }

  if (incident.correlationKeys && incident.correlationKeys.length > 0) {
    tags.push('correlated');
  }

  return [...new Set(tags)]; // Remove duplicates
}
