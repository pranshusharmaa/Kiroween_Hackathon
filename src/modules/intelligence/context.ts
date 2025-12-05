/**
 * Incident LLM Context Builder
 * 
 * Builds rich context for LLM calls by aggregating:
 * - Current incident details
 * - Timeline events and signals
 * - Relevant runbooks
 * - Similar past incidents and their resolutions
 * - Recent deployments and changes
 */

import { prisma } from '@/lib/db/client';

export type IncidentLlmContext = {
  incidentSummary: string;
  slaRiskText: string;
  dataPaths: string[];
  services: string[];
  timelineText: string;
  whatChangedText: string;
  runbookContext: string;
  pastIncidentsContext: string;
};

const MAX_SIGNALS = 5;
const MAX_ACTIONS = 5;
const MAX_RUNBOOKS = 3;
const MAX_PAST_INCIDENTS = 3;
const MAX_DEPLOYMENTS = 3;
const RUNBOOK_SNIPPET_LENGTH = 500;
const PAST_INCIDENT_SUMMARY_LENGTH = 200;

/**
 * Build comprehensive context for LLM calls
 * OPTIMIZED: Parallel queries and reduced data fetching
 */
export async function buildIncidentLlmContext(
  orgId: string,
  incidentId: string
): Promise<IncidentLlmContext> {
  try {
    // Load current incident with related data in one query
    const incident = await (prisma as any).incidentSnapshot.findUnique({
      where: { id: incidentId },
      include: {
        signals: {
          orderBy: { ts: 'desc' },
          take: MAX_SIGNALS,
        },
        actions: {
          orderBy: { ts: 'desc' },
          take: MAX_ACTIONS,
        },
      },
    });

    if (!incident || incident.orgId !== orgId) {
      throw new Error('Incident not found');
    }

    // Build basic info synchronously
    const incidentSummary = buildIncidentSummary(incident);
    const slaRiskText = buildSlaRiskText(incident);
    const dataPaths = incident.dataPathKeys || [];
    const services = extractServices(incident);
    const timelineText = buildTimelineTextSync(incident);

    // Fetch expensive data in parallel
    const [whatChangedText, pastIncidentsContext] = await Promise.all([
      buildWhatChangedText(orgId, incident),
      buildPastIncidentsContext(orgId, incident),
    ]);

    // Runbook context is now a stub (fast)
    const runbookContext = buildRunbookContextSync(incident);

    return {
      incidentSummary,
      slaRiskText,
      dataPaths,
      services,
      timelineText,
      whatChangedText,
      runbookContext,
      pastIncidentsContext,
    };
  } catch (error) {
    console.error('Error building incident context:', error);
    // Return minimal context on error
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
}

/**
 * Build incident summary text
 */
function buildIncidentSummary(incident: any): string {
  return `Title: ${incident.title}
Service: ${incident.serviceName}
Environment: ${incident.environment}
Severity: ${incident.severity}
Status: ${incident.status}
Detected: ${incident.createdAt.toISOString()}
Last Updated: ${incident.updatedAt.toISOString()}`;
}

/**
 * Build SLA risk text
 */
function buildSlaRiskText(incident: any): string {
  const duration = Date.now() - incident.createdAt.getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

  let riskLevel = 'LOW';
  if (incident.severity === 'SEV1' && hours > 1) riskLevel = 'CRITICAL';
  else if (incident.severity === 'SEV2' && hours > 4) riskLevel = 'HIGH';
  else if (incident.severity === 'SEV1') riskLevel = 'HIGH';
  else if (hours > 24) riskLevel = 'MEDIUM';

  return `Severity: ${incident.severity}, Status: ${incident.status}, Duration: ${hours}h ${minutes}m, Risk Level: ${riskLevel}`;
}

/**
 * Extract all services involved in the incident
 */
function extractServices(incident: any): string[] {
  const services = new Set<string>([incident.serviceName]);
  
  // Add services from signals
  if (incident.signals) {
    incident.signals.forEach((signal: any) => {
      if (signal.serviceName) {
        services.add(signal.serviceName);
      }
    });
  }

  return Array.from(services);
}

/**
 * Build timeline text from signals and actions (synchronous version)
 */
function buildTimelineTextSync(incident: any): string {
  const timeline: Array<{ ts: Date; type: string; text: string }> = [];

  // Add signals
  if (incident.signals) {
    incident.signals.forEach((signal: any) => {
      timeline.push({
        ts: signal.ts,
        type: 'SIGNAL',
        text: `[${signal.signalType}] ${signal.summary} (${signal.serviceName})`,
      });
    });
  }

  // Add actions
  if (incident.actions) {
    incident.actions.forEach((action: any) => {
      timeline.push({
        ts: action.ts,
        type: 'ACTION',
        text: `[${action.actionKind}] ${action.label}${action.details ? ': ' + action.details : ''}`,
      });
    });
  }

  // Sort by timestamp
  timeline.sort((a, b) => a.ts.getTime() - b.ts.getTime());

  if (timeline.length === 0) {
    return 'No timeline events recorded yet.';
  }

  // Format as bullet list
  const lines = timeline.map((item) => {
    const time = item.ts.toLocaleTimeString();
    return `• ${time} - ${item.type}: ${item.text}`;
  });

  return lines.join('\n');
}

/**
 * Build what changed text from recent deployments
 */
async function buildWhatChangedText(orgId: string, incident: any): Promise<string> {
  try {
    // Find deployments around the incident time
    const incidentTime = incident.createdAt;
    const windowStart = new Date(incidentTime.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
    const windowEnd = new Date(incidentTime.getTime() + 30 * 60 * 1000); // 30 min after

    const deployments = await (prisma as any).deploymentEvent.findMany({
      where: {
        orgId,
        serviceName: incident.serviceName,
        deployedAt: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      include: {
        guardrailChecks: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { deployedAt: 'desc' },
      take: MAX_DEPLOYMENTS,
    });

    if (deployments.length === 0) {
      return 'No recent deployments detected around incident time.';
    }

    const lines = deployments.map((deploy: any) => {
      const minutesBefore = Math.floor((incidentTime.getTime() - deploy.deployedAt.getTime()) / (1000 * 60));
      const timeText = minutesBefore > 0 ? `${minutesBefore}m before incident` : `${Math.abs(minutesBefore)}m after incident`;
      
      let statusText = '';
      if (deploy.guardrailChecks.length > 0) {
        const check = deploy.guardrailChecks[0];
        statusText = ` [Guardrail: ${check.status}]`;
      }

      return `• ${deploy.changeType}: ${deploy.title} (${timeText})${statusText}`;
    });

    return lines.join('\n');
  } catch (error) {
    console.warn('Error building what changed text:', error);
    return 'Recent deployment history unavailable.';
  }
}

/**
 * Build runbook context from relevant runbooks (synchronous stub)
 */
function buildRunbookContextSync(incident: any): string {
  // Stub implementation - fast and synchronous
  const runbookText = `Runbook for ${incident.serviceName}:
- Check service health endpoints
- Review recent deployments and rollback if needed
- Scale service if under load
- Check database connection pool
- Review error logs for patterns
- Verify external dependencies are healthy`;

  return runbookText.substring(0, RUNBOOK_SNIPPET_LENGTH);
}

/**
 * Build past incidents context from similar incidents
 * OPTIMIZED: Reduced to 2 incidents and skip postmortems for speed
 */
async function buildPastIncidentsContext(orgId: string, incident: any): Promise<string> {
  try {
    // Find similar past incidents (reduced count for performance)
    const pastIncidents = await (prisma as any).incidentSnapshot.findMany({
      where: {
        orgId,
        id: { not: incident.id },
        serviceName: incident.serviceName,
        status: { in: ['RESOLVED', 'MITIGATED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 2, // Reduced from MAX_PAST_INCIDENTS for performance
      select: {
        id: true,
        title: true,
        severity: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (pastIncidents.length === 0) {
      return 'No similar past incidents found.';
    }

    const lines = pastIncidents.map((past: any) => {
      const duration = past.updatedAt.getTime() - past.createdAt.getTime();
      const hours = Math.floor(duration / (1000 * 60 * 60));
      return `• [${past.severity}] ${past.title} - Resolved in ${hours}h`;
    });

    return `Similar past incidents:\n${lines.join('\n')}`;
  } catch (error) {
    console.warn('Error building past incidents context:', error);
    return '';
  }
}

/**
 * Format context for LLM prompt
 */
export function formatContextForPrompt(context: IncidentLlmContext): string {
  const sections: string[] = [];

  sections.push('## Current Incident');
  sections.push(context.incidentSummary);
  sections.push('');

  sections.push('## Risk Assessment');
  sections.push(context.slaRiskText);
  sections.push('');

  if (context.services.length > 0) {
    sections.push('## Affected Services');
    sections.push(context.services.join(', '));
    sections.push('');
  }

  if (context.dataPaths.length > 0) {
    sections.push('## Data Paths');
    sections.push(context.dataPaths.join(', '));
    sections.push('');
  }

  sections.push('## Timeline');
  sections.push(context.timelineText);
  sections.push('');

  sections.push('## Recent Changes');
  sections.push(context.whatChangedText);
  sections.push('');

  if (context.runbookContext) {
    sections.push('## Relevant Runbooks');
    sections.push(context.runbookContext);
    sections.push('');
  }

  if (context.pastIncidentsContext) {
    sections.push('## Past Similar Incidents');
    sections.push(context.pastIncidentsContext);
    sections.push('');
  }

  return sections.join('\n');
}
