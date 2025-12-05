// Intelligence & Guidance Service (IGS) Types

export type SafetyLevel = 'SAFE_REVERSIBLE' | 'RISKY' | 'INFO_ONLY';

export interface SuggestedAction {
  label: string;
  explanation: string;
  safetyLevel: SafetyLevel;
  kind: string;
  runbookSection?: string;
}

export interface RelatedIncident {
  id: string;
  title: string;
  resolvedAt: Date | null;
  similarity: number;
  serviceName: string;
  severity: string;
}

export interface IncidentGuidance {
  incidentId: string;
  generatedAt: Date;
  actions: SuggestedAction[];
  diagnosticQuestions: string[];
  relatedIncidents: RelatedIncident[];
}

export interface PostmortemOptions {
  includeMetrics?: boolean;
  includeTimeline?: boolean;
  format?: 'markdown' | 'html';
}

export interface GeneratedPostmortem {
  markdown: string;
  summaryText: string;
  tags: string[];
  metadata: {
    incidentId: string;
    serviceName: string;
    severity: string;
    duration: string;
    generatedAt: Date;
  };
}
