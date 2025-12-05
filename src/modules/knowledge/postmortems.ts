import { prisma } from '@/lib/db/client';
import { SavePostmortemInput, Postmortem } from './types';

/**
 * Save a postmortem for an incident
 */
export async function savePostmortem(
  orgId: string,
  input: SavePostmortemInput
): Promise<Postmortem> {
  const postmortem = await prisma.postmortem.create({
    data: {
      orgId,
      incidentId: input.incidentId,
      markdown: input.markdown,
      summaryText: input.summaryText,
      tags: input.tags || [],
    },
  });

  return postmortem as Postmortem;
}

/**
 * Get postmortem for an incident
 */
export async function getPostmortemForIncident(
  orgId: string,
  incidentId: string
): Promise<Postmortem | null> {
  const postmortem = await prisma.postmortem.findFirst({
    where: {
      orgId,
      incidentId,
    },
  });

  return postmortem as Postmortem | null;
}

/**
 * Get postmortems for a service
 */
export async function getPostmortemsForService(
  orgId: string,
  serviceName: string,
  limit: number = 10
): Promise<Postmortem[]> {
  // Get incidents for this service, then their postmortems
  const incidents = await prisma.incidentSnapshot.findMany({
    where: {
      orgId,
      serviceName,
    },
    select: {
      id: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit * 2, // Get more incidents to ensure we have enough postmortems
  });

  const incidentIds = incidents.map((i) => i.id);

  const postmortems = await prisma.postmortem.findMany({
    where: {
      orgId,
      incidentId: {
        in: incidentIds,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return postmortems as Postmortem[];
}

/**
 * Get recent postmortems for an organization
 */
export async function getRecentPostmortems(
  orgId: string,
  limit: number = 20
): Promise<Postmortem[]> {
  const postmortems = await prisma.postmortem.findMany({
    where: {
      orgId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return postmortems as Postmortem[];
}

/**
 * Search postmortems by tags or text
 */
export async function searchPostmortems(
  orgId: string,
  query: string,
  limit: number = 10
): Promise<Postmortem[]> {
  const postmortems = await prisma.postmortem.findMany({
    where: {
      orgId,
      OR: [
        {
          summaryText: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          markdown: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return postmortems as Postmortem[];
}
