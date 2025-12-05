// Incident & Timeline Service (ITS) Types

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED' | 'CANCELLED';
export type IncidentSeverity = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
export type SignalType = 'ALERT' | 'METRIC_SPIKE' | 'ERROR_BURST' | 'LOG_PATTERN' | 'TRACE_ANOMALY';
export type ActorType = 'USER' | 'SYSTEM' | 'CONNECTOR';
export type ActionKind = 
  | 'RUNBOOK_STEP_EXECUTED'
  | 'ROLLBACK_TRIGGERED'
  | 'SCALE_CHANGE'
  | 'NOTE'
  | 'STATUS_CHANGE'
  | 'SEVERITY_CHANGE'
  | 'TAG_ADDED'
  | 'TAG_REMOVED';

export const INCIDENT_STATUSES: Record<IncidentStatus, IncidentStatus> = {
  OPEN: 'OPEN',
  INVESTIGATING: 'INVESTIGATING',
  MITIGATED: 'MITIGATED',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED',
};

export const INCIDENT_SEVERITIES: Record<IncidentSeverity, IncidentSeverity> = {
  SEV1: 'SEV1',
  SEV2: 'SEV2',
  SEV3: 'SEV3',
  SEV4: 'SEV4',
};

// Event types
export type IncidentEventType =
  | 'INCIDENT_CREATED'
  | 'INCIDENT_UPDATED'
  | 'INCIDENT_STATUS_CHANGED'
  | 'INCIDENT_SEVERITY_CHANGED'
  | 'INCIDENT_TAG_ADDED'
  | 'INCIDENT_TAG_REMOVED'
  | 'INCIDENT_SIGNAL_INGESTED'
  | 'INCIDENT_NOTE_ADDED'
  | 'INCIDENT_PLAYBOOK_ACTION_EXECUTED'
  | 'INCIDENT_SLO_VIOLATION_RECORDED'
  | 'INCIDENT_LINKED_TO_TICKET'
  | 'INCIDENT_RESOLVED';

// Event payloads
export interface IncidentCreatedPayload {
  version: number;
  title: string;
  serviceName: string;
  severity: IncidentSeverity;
  environment: string;
  detectedBy: string;
  projectId: string;
  initialCorrelationKey?: string;
  runbookPath?: string;
}

export interface IncidentStatusChangedPayload {
  version: number;
  oldStatus: IncidentStatus;
  newStatus: IncidentStatus;
  actorId: string;
  reason?: string;
}

export interface IncidentSeverityChangedPayload {
  version: number;
  oldSeverity: IncidentSeverity;
  newSeverity: IncidentSeverity;
  actorId: string;
  reason?: string;
}

export interface IncidentSignalIngestedPayload {
  version: number;
  signalId: string;
  signalType: SignalType;
  source: string;
  summary: string;
  severity?: string;
  correlationKey?: string;
  traceId?: string;
  data?: Record<string, unknown>;
}

export interface IncidentNoteAddedPayload {
  version: number;
  actorId: string;
  note: string;
}

export interface IncidentActionExecutedPayload {
  version: number;
  actorId: string;
  actionKind: ActionKind;
  label: string;
  details?: string;
}

// Command inputs
export interface CreateIncidentInput {
  orgId: string;
  projectId: string;
  title: string;
  serviceName: string;
  severity: IncidentSeverity;
  environment: string;
  detectedBy: string;
  initialCorrelationKey?: string;
  runbookPath?: string;
}

export interface ChangeStatusInput {
  newStatus: IncidentStatus;
  actorId: string;
  reason?: string;
}

export interface ChangeSeverityInput {
  newSeverity: IncidentSeverity;
  actorId: string;
  reason?: string;
}

export interface AddActionInput {
  actorType: ActorType;
  actorRef: string;
  actionKind: ActionKind;
  label: string;
  details?: string;
}

export interface AttachSignalInput {
  signalType: SignalType;
  serviceName: string;
  environment: string;
  source: string;
  summary: string;
  correlationKey?: string;
  traceId?: string;
  data?: Record<string, unknown>;
}

// Query filters
export interface ListIncidentsFilters {
  projectId?: string;
  environment?: string;
  status?: IncidentStatus[];
  severity?: IncidentSeverity[];
  searchQuery?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'severity';
  direction?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

// Domain models (matching Prisma)
export interface IncidentSnapshot {
  id: string;
  orgId: string;
  projectId: string;
  title: string;
  serviceName: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  environment: string;
  detectedBy: string;
  primarySignalId: string | null;
  runbookPath: string | null;
  externalRefs: unknown;
  correlationKeys: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentSignal {
  id: string;
  incidentId: string;
  orgId: string;
  projectId: string;
  signalType: string;
  serviceName: string;
  environment: string;
  correlationKey: string | null;
  traceId: string | null;
  source: string;
  summary: string;
  data: unknown;
  ts: Date;
}

export interface IncidentAction {
  id: string;
  incidentId: string;
  orgId: string;
  actorType: string;
  actorRef: string;
  actionKind: string;
  label: string;
  details: string | null;
  ts: Date;
}

export interface IncidentWithDetails extends IncidentSnapshot {
  signals: IncidentSignal[];
  actions: IncidentAction[];
}
