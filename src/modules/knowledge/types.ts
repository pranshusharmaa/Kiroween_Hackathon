// Knowledge & Runbook Service (KRS) Types

export interface Postmortem {
  id: string;
  orgId: string;
  incidentId: string;
  markdown: string;
  summaryText: string;
  tags: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostmortemMetadata {
  tags: string[];
  serviceName: string;
  severity: string;
  duration?: string;
}

export interface SavePostmortemInput {
  incidentId: string;
  markdown: string;
  summaryText: string;
  tags?: string[];
}
