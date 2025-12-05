import { prisma } from '@/lib/db/client';
import {
  CreateIncidentInput,
  ChangeStatusInput,
  ChangeSeverityInput,
  AddActionInput,
  AttachSignalInput,
  IncidentEventType,
  IncidentCreatedPayload,
  IncidentStatusChangedPayload,
  IncidentSeverityChangedPayload,
  IncidentSignalIngestedPayload,
  IncidentActionExecutedPayload,
  INCIDENT_STATUSES,
  INCIDENT_SEVERITIES,
} from './types';
import { applyEventToSnapshot, buildSignalFromEvent, buildActionFromEvent } from './projections';

/**
 * Create a new incident
 * Appends INCIDENT_CREATED event and creates initial snapshot
 */
export async function createIncident(input: CreateIncidentInput): Promise<string> {
  const incidentId = `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const payload: IncidentCreatedPayload = {
    version: 1,
    title: input.title,
    serviceName: input.serviceName,
    severity: input.severity,
    environment: input.environment,
    detectedBy: input.detectedBy,
    projectId: input.projectId,
    initialCorrelationKey: input.initialCorrelationKey,
    runbookPath: input.runbookPath,
  };

  const eventType: IncidentEventType = 'INCIDENT_CREATED';
  const now = new Date();

  // Transaction: append event + create snapshot
  await prisma.$transaction(async (tx) => {
    // Append event
    await tx.incidentEvent.create({
      data: {
        incidentId,
        orgId: input.orgId,
        type: eventType,
        payload: payload as any,
        ts: now,
      },
    });

    // Create snapshot
    const snapshotData = applyEventToSnapshot({ type: eventType, payload, ts: now });
    await tx.incidentSnapshot.create({
      data: {
        id: incidentId,
        orgId: input.orgId,
        ...snapshotData,
      } as any,
    });
  });

  return incidentId;
}

/**
 * Change incident status
 * Appends INCIDENT_STATUS_CHANGED event and updates snapshot
 */
export async function changeIncidentStatus(
  orgId: string,
  incidentId: string,
  input: ChangeStatusInput
): Promise<void> {
  // Validate status
  if (!INCIDENT_STATUSES[input.newStatus]) {
    throw new Error(`Invalid status: ${input.newStatus}`);
  }

  // Get current snapshot
  const snapshot = await prisma.incidentSnapshot.findFirst({
    where: { id: incidentId, orgId },
  });

  if (!snapshot) {
    throw new Error(`Incident ${incidentId} not found in org ${orgId}`);
  }

  const payload: IncidentStatusChangedPayload = {
    version: 1,
    oldStatus: snapshot.status as any,
    newStatus: input.newStatus,
    actorId: input.actorId,
    reason: input.reason,
  };

  const eventType: IncidentEventType = 'INCIDENT_STATUS_CHANGED';
  const now = new Date();

  // Transaction: append event + update snapshot + create action
  await prisma.$transaction(async (tx) => {
    // Append event
    await tx.incidentEvent.create({
      data: {
        incidentId,
        orgId,
        type: eventType,
        payload: payload as any,
        ts: now,
      },
    });

    // Update snapshot
    const updateData = applyEventToSnapshot({ type: eventType, payload, ts: now }, snapshot);
    await tx.incidentSnapshot.update({
      where: { id: incidentId },
      data: updateData,
    });

    // Create action
    const actionData = buildActionFromEvent(incidentId, orgId, { type: eventType, payload, ts: now });
    if (actionData) {
      await tx.incidentAction.create({
        data: actionData as any,
      });
    }
  });
}

/**
 * Change incident severity
 * Appends INCIDENT_SEVERITY_CHANGED event and updates snapshot
 */
export async function changeIncidentSeverity(
  orgId: string,
  incidentId: string,
  input: ChangeSeverityInput
): Promise<void> {
  // Validate severity
  if (!INCIDENT_SEVERITIES[input.newSeverity]) {
    throw new Error(`Invalid severity: ${input.newSeverity}`);
  }

  // Get current snapshot
  const snapshot = await prisma.incidentSnapshot.findFirst({
    where: { id: incidentId, orgId },
  });

  if (!snapshot) {
    throw new Error(`Incident ${incidentId} not found in org ${orgId}`);
  }

  const payload: IncidentSeverityChangedPayload = {
    version: 1,
    oldSeverity: snapshot.severity as any,
    newSeverity: input.newSeverity,
    actorId: input.actorId,
    reason: input.reason,
  };

  const eventType: IncidentEventType = 'INCIDENT_SEVERITY_CHANGED';
  const now = new Date();

  // Transaction: append event + update snapshot + create action
  await prisma.$transaction(async (tx) => {
    // Append event
    await tx.incidentEvent.create({
      data: {
        incidentId,
        orgId,
        type: eventType,
        payload: payload as any,
        ts: now,
      },
    });

    // Update snapshot
    const updateData = applyEventToSnapshot({ type: eventType, payload, ts: now }, snapshot);
    await tx.incidentSnapshot.update({
      where: { id: incidentId },
      data: updateData,
    });

    // Create action
    const actionData = buildActionFromEvent(incidentId, orgId, { type: eventType, payload, ts: now });
    if (actionData) {
      await tx.incidentAction.create({
        data: actionData as any,
      });
    }
  });
}

/**
 * Add an action to an incident
 * Appends INCIDENT_PLAYBOOK_ACTION_EXECUTED event and creates action
 */
export async function addIncidentAction(
  orgId: string,
  incidentId: string,
  input: AddActionInput
): Promise<void> {
  // Verify incident exists
  const snapshot = await prisma.incidentSnapshot.findFirst({
    where: { id: incidentId, orgId },
  });

  if (!snapshot) {
    throw new Error(`Incident ${incidentId} not found in org ${orgId}`);
  }

  const payload: IncidentActionExecutedPayload = {
    version: 1,
    actorId: input.actorRef,
    actionKind: input.actionKind,
    label: input.label,
    details: input.details,
  };

  const eventType: IncidentEventType = 'INCIDENT_PLAYBOOK_ACTION_EXECUTED';
  const now = new Date();

  // Transaction: append event + create action + update snapshot timestamp
  await prisma.$transaction(async (tx) => {
    // Append event
    await tx.incidentEvent.create({
      data: {
        incidentId,
        orgId,
        type: eventType,
        payload: payload as any,
        ts: now,
      },
    });

    // Create action
    await tx.incidentAction.create({
      data: {
        incidentId,
        orgId,
        actorType: input.actorType,
        actorRef: input.actorRef,
        actionKind: input.actionKind,
        label: input.label,
        details: input.details || null,
        ts: now,
      },
    });

    // Update snapshot timestamp
    await tx.incidentSnapshot.update({
      where: { id: incidentId },
      data: { updatedAt: now },
    });
  });
}

/**
 * Attach a signal to an incident
 * Appends INCIDENT_SIGNAL_INGESTED event and creates signal
 */
export async function attachSignal(
  orgId: string,
  incidentId: string,
  input: AttachSignalInput
): Promise<void> {
  // Verify incident exists
  const snapshot = await prisma.incidentSnapshot.findFirst({
    where: { id: incidentId, orgId },
  });

  if (!snapshot) {
    throw new Error(`Incident ${incidentId} not found in org ${orgId}`);
  }

  const signalId = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const payload: IncidentSignalIngestedPayload = {
    version: 1,
    signalId,
    signalType: input.signalType,
    source: input.source,
    summary: input.summary,
    correlationKey: input.correlationKey,
    traceId: input.traceId,
    data: input.data,
  };

  const eventType: IncidentEventType = 'INCIDENT_SIGNAL_INGESTED';
  const now = new Date();

  // Transaction: append event + create signal + update snapshot
  await prisma.$transaction(async (tx) => {
    // Append event
    await tx.incidentEvent.create({
      data: {
        incidentId,
        orgId,
        type: eventType,
        payload: payload as any,
        ts: now,
      },
    });

    // Create signal
    await tx.incidentSignal.create({
      data: {
        id: signalId,
        incidentId,
        orgId,
        projectId: snapshot.projectId,
        signalType: input.signalType,
        serviceName: input.serviceName,
        environment: input.environment,
        source: input.source,
        summary: input.summary,
        correlationKey: input.correlationKey || null,
        traceId: input.traceId || null,
        data: (input.data || {}) as any,
        ts: now,
      },
    });

    // Update snapshot (add correlation key if new)
    const updateData = applyEventToSnapshot({ type: eventType, payload, ts: now }, snapshot);
    await tx.incidentSnapshot.update({
      where: { id: incidentId },
      data: updateData,
    });
  });
}
