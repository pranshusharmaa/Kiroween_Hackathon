import { Prisma } from '@prisma/client';
import {
  IncidentEventType,
  IncidentCreatedPayload,
  IncidentStatusChangedPayload,
  IncidentSeverityChangedPayload,
  IncidentSignalIngestedPayload,
} from './types';

/**
 * Apply an incident event to update the snapshot projection
 * Pure function that returns the update data for IncidentSnapshot
 */
export function applyEventToSnapshot(
  event: {
    type: IncidentEventType;
    payload: unknown;
    ts: Date;
  },
  currentSnapshot?: {
    status: string;
    severity: string;
    correlationKeys: string[];
  }
): Prisma.IncidentSnapshotUpdateInput | Prisma.IncidentSnapshotCreateInput {
  const baseUpdate: Prisma.IncidentSnapshotUpdateInput = {
    updatedAt: event.ts,
  };

  switch (event.type) {
    case 'INCIDENT_CREATED': {
      const payload = event.payload as IncidentCreatedPayload;
      return {
        title: payload.title,
        serviceName: payload.serviceName,
        severity: payload.severity,
        environment: payload.environment,
        detectedBy: payload.detectedBy,
        projectId: payload.projectId,
        status: 'OPEN',
        runbookPath: payload.runbookPath || null,
        correlationKeys: payload.initialCorrelationKey ? [payload.initialCorrelationKey] : [],
        externalRefs: [],
        createdAt: event.ts,
        updatedAt: event.ts,
      };
    }

    case 'INCIDENT_STATUS_CHANGED': {
      const payload = event.payload as IncidentStatusChangedPayload;
      return {
        ...baseUpdate,
        status: payload.newStatus,
      };
    }

    case 'INCIDENT_SEVERITY_CHANGED': {
      const payload = event.payload as IncidentSeverityChangedPayload;
      return {
        ...baseUpdate,
        severity: payload.newSeverity,
      };
    }

    case 'INCIDENT_SIGNAL_INGESTED': {
      const payload = event.payload as IncidentSignalIngestedPayload;
      // Add correlation key if not already present
      if (payload.correlationKey && currentSnapshot) {
        const keys = currentSnapshot.correlationKeys || [];
        if (!keys.includes(payload.correlationKey)) {
          return {
            ...baseUpdate,
            correlationKeys: [...keys, payload.correlationKey],
          };
        }
      }
      return baseUpdate;
    }

    case 'INCIDENT_RESOLVED': {
      return {
        ...baseUpdate,
        status: 'RESOLVED',
      };
    }

    default:
      // For other event types, just update the timestamp
      return baseUpdate;
  }
}

/**
 * Build IncidentSignal data from INCIDENT_SIGNAL_INGESTED event
 */
export function buildSignalFromEvent(
  incidentId: string,
  orgId: string,
  projectId: string,
  event: {
    type: IncidentEventType;
    payload: unknown;
    ts: Date;
  }
): Prisma.IncidentSignalCreateInput | null {
  if (event.type !== 'INCIDENT_SIGNAL_INGESTED') {
    return null;
  }

  const payload = event.payload as IncidentSignalIngestedPayload;

  return {
    incident: {
      connect: { id: incidentId },
    },
    orgId,
    projectId,
    signalType: payload.signalType,
    serviceName: payload.summary, // Using summary as serviceName for now
    environment: 'production', // Default, should come from incident
    source: payload.source,
    summary: payload.summary,
    correlationKey: payload.correlationKey || null,
    traceId: payload.traceId || null,
    data: (payload.data || {}) as any,
    ts: event.ts,
  };
}

/**
 * Build IncidentAction data from action-related events
 */
export function buildActionFromEvent(
  incidentId: string,
  orgId: string,
  event: {
    type: IncidentEventType;
    payload: unknown;
    ts: Date;
  }
): Prisma.IncidentActionCreateInput | null {
  switch (event.type) {
    case 'INCIDENT_STATUS_CHANGED': {
      const payload = event.payload as IncidentStatusChangedPayload;
      return {
        incident: {
          connect: { id: incidentId },
        },
        orgId,
        actorType: 'USER',
        actorRef: payload.actorId,
        actionKind: 'STATUS_CHANGE',
        label: `Changed status from ${payload.oldStatus} to ${payload.newStatus}`,
        details: payload.reason || null,
        ts: event.ts,
      };
    }

    case 'INCIDENT_SEVERITY_CHANGED': {
      const payload = event.payload as IncidentSeverityChangedPayload;
      return {
        incident: {
          connect: { id: incidentId },
        },
        orgId,
        actorType: 'USER',
        actorRef: payload.actorId,
        actionKind: 'SEVERITY_CHANGE',
        label: `Changed severity from ${payload.oldSeverity} to ${payload.newSeverity}`,
        details: payload.reason || null,
        ts: event.ts,
      };
    }

    case 'INCIDENT_NOTE_ADDED': {
      const payload = event.payload as any;
      return {
        incident: {
          connect: { id: incidentId },
        },
        orgId,
        actorType: 'USER',
        actorRef: payload.actorId,
        actionKind: 'NOTE',
        label: 'Added note',
        details: payload.note,
        ts: event.ts,
      };
    }

    case 'INCIDENT_PLAYBOOK_ACTION_EXECUTED': {
      const payload = event.payload as any;
      return {
        incident: {
          connect: { id: incidentId },
        },
        orgId,
        actorType: payload.actorType || 'USER',
        actorRef: payload.actorId,
        actionKind: payload.actionKind,
        label: payload.label,
        details: payload.details || null,
        ts: event.ts,
      };
    }

    default:
      return null;
  }
}

/**
 * Add a data path key to an incident
 * Updates the dataPathKeys array on the incident snapshot
 */
export async function addDataPathKeyToIncident(
  incidentId: string,
  dataPathKey: string
): Promise<void> {
  const { prisma } = await import('@/lib/db/client');
  
  await prisma.incidentSnapshot.update({
    where: { id: incidentId },
    data: {
      dataPathKeys: {
        push: dataPathKey,
      },
    },
  });
}
