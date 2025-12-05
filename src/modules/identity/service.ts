import { prisma } from '@/lib/db/client';
import { Role, ROLES, UserWithMemberships } from './types';

// Re-export types and constants
export { ROLES, type Role, type UserWithMemberships } from './types';

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Get user with all their organization memberships
 */
export async function getUserWithMemberships(userId: string): Promise<UserWithMemberships | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  return user;
}

/**
 * Assert that a user is a member of an organization
 */
export async function assertOrgMember(orgId: string, userId: string): Promise<void> {
  const membership = await prisma.membership.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new UnauthorizedError(`User ${userId} is not a member of organization ${orgId}`);
  }
}

/**
 * Assert that a user has a specific role in an organization
 */
export async function assertRole(
  orgId: string,
  userId: string,
  requiredRole: Role | Role[]
): Promise<void> {
  const membership = await prisma.membership.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new UnauthorizedError(`User ${userId} is not a member of organization ${orgId}`);
  }

  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  if (!requiredRoles.includes(membership.role as Role)) {
    throw new ForbiddenError(
      `User ${userId} does not have required role(s) ${requiredRoles.join(', ')} in organization ${orgId}`
    );
  }
}

/**
 * Get user's role in an organization
 */
export async function getUserRole(orgId: string, userId: string): Promise<Role | null> {
  const membership = await prisma.membership.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId,
      },
    },
  });

  return membership?.role as Role | null;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(
  orgId: string,
  userId: string,
  roles: Role[]
): Promise<boolean> {
  const userRole = await getUserRole(orgId, userId);
  return userRole ? roles.includes(userRole) : false;
}

/**
 * Temporary helper for demo: returns a hardcoded demo user
 * In production, this would extract user from JWT/session
 */
export async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
  // For now, return the first user in the database
  const user = await prisma.user.findFirst();
  return user ? { id: user.id, email: user.email } : null;
}
