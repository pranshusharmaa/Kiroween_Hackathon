import { prisma } from '@/lib/db/client';
import { ListIncidentsFilters, IncidentSnapshot, IncidentWithDetails } from './types';

/**
 * List incidents with filtering, sorting, and pagination
 */
export async function listIncidents(
  orgId: string,
  filters: ListIncidentsFilters = {}
): Promise<{ incidents: IncidentSnapshot[]; nextCursor?: string }> {
  const {
    projectId,
    environment,
    status,
    severity,
    searchQuery,
    sortBy = 'createdAt',
    direction = 'desc',
    limit = 50,
    cursor,
  } = filters;

  // Build where clause
  const where: any = {
    orgId,
  };

  if (projectId) {
    where.projectId = projectId;
  }

  if (environment) {
    where.environment = environment;
  }

  if (status && status.length > 0) {
    where.status = { in: status };
  }

  if (severity && severity.length > 0) {
    where.severity = { in: severity };
  }

  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { serviceName: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  // Handle cursor-based pagination
  const cursorClause = cursor ? { id: cursor } : undefined;

  // Query incidents
  const incidents = await prisma.incidentSnapshot.findMany({
    where,
    orderBy: { [sortBy]: direction },
    take: limit + 1, // Fetch one extra to determine if there's a next page
    ...(cursorClause && { cursor: cursorClause, skip: 1 }),
  });

  // Determine next cursor
  const hasMore = incidents.length > limit;
  const results = hasMore ? incidents.slice(0, limit) : incidents;
  const nextCursor = hasMore ? results[results.length - 1].id : undefined;

  return {
    incidents: results as IncidentSnapshot[],
    nextCursor,
  };
}

/**
 * Get incident details with signals and actions
 */
export async function getIncidentWithDetails(
  orgId: string,
  incidentId: string
): Promise<IncidentWithDetails | null> {
  const incident = await prisma.incidentSnapshot.findFirst({
    where: {
      id: incidentId,
      orgId,
    },
    include: {
      signals: {
        orderBy: { ts: 'asc' },
      },
      actions: {
        orderBy: { ts: 'asc' },
      },
    },
  });

  if (!incident) {
    return null;
  }

  return incident as IncidentWithDetails;
}

/**
 * Get incident events (for debugging or timeline reconstruction)
 */
export async function getIncidentEvents(
  orgId: string,
  incidentId: string
): Promise<any[]> {
  const events = await prisma.incidentEvent.findMany({
    where: {
      orgId,
      incidentId,
    },
    orderBy: { ts: 'asc' },
  });

  return events;
}

/**
 * Get incidents by correlation key (for signal grouping)
 */
export async function getIncidentsByCorrelationKey(
  orgId: string,
  correlationKey: string
): Promise<IncidentSnapshot[]> {
  const incidents = await prisma.incidentSnapshot.findMany({
    where: {
      orgId,
      correlationKeys: {
        has: correlationKey,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return incidents as IncidentSnapshot[];
}

/**
 * Get recent incidents for a service (for pattern detection)
 */
export async function getRecentIncidentsForService(
  orgId: string,
  serviceName: string,
  limit: number = 10
): Promise<IncidentSnapshot[]> {
  const incidents = await prisma.incidentSnapshot.findMany({
    where: {
      orgId,
      serviceName,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return incidents as IncidentSnapshot[];
}
