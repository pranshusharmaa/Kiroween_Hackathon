import { prisma } from '@/lib/db/client';
import { DataPathFeatures } from './types';

export interface DataPathFlowEntry {
  id: string;
  orgId: string;
  projectId: string;
  dataPathKey: string;
  serviceName: string;
  environment: string;
  route: string | null;
  accountId: string | null;
  customerId: string | null;
  orderId: string | null;
  userId: string | null;
  eventCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

/**
 * Upsert a data path flow entry
 * Tracks business flows across services
 */
export async function upsertDataPathFlow(
  orgId: string,
  projectId: string,
  serviceName: string,
  environment: string,
  dataPathKey: string,
  features: DataPathFeatures
): Promise<DataPathFlowEntry> {
  const existing = await prisma.dataPathFlow.findUnique({
    where: {
      orgId_projectId_dataPathKey: {
        orgId,
        projectId,
        dataPathKey,
      },
    },
  });

  if (existing) {
    // Update existing flow
    const updated = await prisma.dataPathFlow.update({
      where: { id: existing.id },
      data: {
        eventCount: { increment: 1 },
        lastSeenAt: new Date(),
      },
    });
    return updated as DataPathFlowEntry;
  } else {
    // Create new flow
    const created = await prisma.dataPathFlow.create({
      data: {
        orgId,
        projectId,
        dataPathKey,
        serviceName,
        environment,
        route: features.route || null,
        accountId: features.accountId || null,
        customerId: features.customerId || null,
        orderId: features.orderId || null,
        userId: features.userId || null,
        eventCount: 1,
      },
    });
    return created as DataPathFlowEntry;
  }
}

/**
 * Get data path flows for an organization
 */
export async function getDataPathFlows(
  orgId: string,
  filters: {
    projectId?: string;
    serviceName?: string;
    environment?: string;
    dataPathKey?: string;
    limit?: number;
  } = {}
): Promise<DataPathFlowEntry[]> {
  const { projectId, serviceName, environment, dataPathKey, limit = 50 } = filters;

  const where: any = { orgId };

  if (projectId) where.projectId = projectId;
  if (serviceName) where.serviceName = serviceName;
  if (environment) where.environment = environment;
  if (dataPathKey) where.dataPathKey = dataPathKey;

  const flows = await prisma.dataPathFlow.findMany({
    where,
    orderBy: [
      { lastSeenAt: 'desc' },
      { eventCount: 'desc' },
    ],
    take: limit,
  });

  return flows as DataPathFlowEntry[];
}

/**
 * Get data path flows for a specific incident
 * Uses the incident's data path keys
 */
export async function getDataPathFlowsForIncident(
  orgId: string,
  dataPathKeys: string[]
): Promise<DataPathFlowEntry[]> {
  if (dataPathKeys.length === 0) {
    return [];
  }

  const flows = await prisma.dataPathFlow.findMany({
    where: {
      orgId,
      dataPathKey: {
        in: dataPathKeys,
      },
    },
    orderBy: [
      { lastSeenAt: 'desc' },
    ],
  });

  return flows as DataPathFlowEntry[];
}

/**
 * Get active data path flows (seen in last N minutes)
 */
export async function getActiveDataPathFlows(
  orgId: string,
  projectId: string,
  minutesAgo: number = 60
): Promise<DataPathFlowEntry[]> {
  const cutoff = new Date();
  cutoff.setMinutes(cutoff.getMinutes() - minutesAgo);

  const flows = await prisma.dataPathFlow.findMany({
    where: {
      orgId,
      projectId,
      lastSeenAt: {
        gte: cutoff,
      },
    },
    orderBy: [
      { eventCount: 'desc' },
      { lastSeenAt: 'desc' },
    ],
    take: 20,
  });

  return flows as DataPathFlowEntry[];
}
