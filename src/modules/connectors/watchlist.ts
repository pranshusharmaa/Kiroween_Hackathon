import { prisma } from '@/lib/db/client';
import { SLAWatchUpdate, SLAWatchEntry } from './types';

/**
 * Upsert an SLA watch entry
 * Updates existing entry or creates new one
 */
export async function upsertWatchEntry(
  update: SLAWatchUpdate
): Promise<SLAWatchEntry> {
  const whereClause: any = {
    orgId: update.orgId,
    projectId: update.projectId,
    serviceName: update.serviceName,
    environment: update.environment,
  };

  if (update.correlationKey) {
    whereClause.correlationKey = update.correlationKey;
  }
  
  if (update.dataPathKey) {
    whereClause.dataPathKey = update.dataPathKey;
  }

  // Try to find existing entry
  const existing = await prisma.sLAWatchEntry.findFirst({
    where: whereClause,
  });

  if (existing) {
    // Update existing entry
    const updated = await prisma.sLAWatchEntry.update({
      where: { id: existing.id },
      data: {
        status: update.status,
        riskScore: update.riskScore,
        source: update.source,
        logsSnapshot: update.logsSnapshot,
        lastUpdatedAt: new Date(),
      },
    });
    return updated as SLAWatchEntry;
  } else {
    // Create new entry
    const created = await prisma.sLAWatchEntry.create({
      data: {
        orgId: update.orgId,
        projectId: update.projectId,
        serviceName: update.serviceName,
        environment: update.environment,
        correlationKey: update.correlationKey || null,
        dataPathKey: update.dataPathKey || null,
        status: update.status,
        riskScore: update.riskScore,
        source: update.source,
        logsSnapshot: update.logsSnapshot,
      },
    });
    return created as SLAWatchEntry;
  }
}

/**
 * Get watchlist entries for an organization
 */
export async function getWatchlistEntries(
  orgId: string,
  filters: {
    projectId?: string;
    serviceName?: string;
    environment?: string;
    status?: string[];
    limit?: number;
  } = {}
): Promise<SLAWatchEntry[]> {
  const { projectId, serviceName, environment, status, limit = 50 } = filters;

  const where: any = {
    orgId,
    status: {
      in: status || ['AT_RISK', 'BREACHED'],
    },
  };

  if (projectId) {
    where.projectId = projectId;
  }

  if (serviceName) {
    where.serviceName = serviceName;
  }

  if (environment) {
    where.environment = environment;
  }

  const entries = await prisma.sLAWatchEntry.findMany({
    where,
    orderBy: [
      { riskScore: 'desc' },
      { lastUpdatedAt: 'desc' },
    ],
    take: limit,
  });

  return entries as SLAWatchEntry[];
}

/**
 * Clear a watchlist entry (mark as CLEARED)
 */
export async function clearWatchEntry(
  orgId: string,
  entryId: string
): Promise<SLAWatchEntry | null> {
  // Verify the entry belongs to the org
  const entry = await prisma.sLAWatchEntry.findFirst({
    where: {
      id: entryId,
      orgId,
    },
  });

  if (!entry) {
    return null;
  }

  const updated = await prisma.sLAWatchEntry.update({
    where: { id: entryId },
    data: {
      status: 'CLEARED',
      lastUpdatedAt: new Date(),
    },
  });

  return updated as SLAWatchEntry;
}

/**
 * Get watchlist entries for a specific service
 */
export async function getWatchlistForService(
  orgId: string,
  serviceName: string,
  environment?: string
): Promise<SLAWatchEntry[]> {
  const where: any = {
    orgId,
    serviceName,
    status: {
      in: ['AT_RISK', 'BREACHED'],
    },
  };

  if (environment) {
    where.environment = environment;
  }

  const entries = await prisma.sLAWatchEntry.findMany({
    where,
    orderBy: [
      { riskScore: 'desc' },
      { lastUpdatedAt: 'desc' },
    ],
  });

  return entries as SLAWatchEntry[];
}

/**
 * Clean up old CLEARED entries (housekeeping)
 */
export async function cleanupClearedEntries(
  orgId: string,
  olderThanDays: number = 7
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.sLAWatchEntry.deleteMany({
    where: {
      orgId,
      status: 'CLEARED',
      lastUpdatedAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}
