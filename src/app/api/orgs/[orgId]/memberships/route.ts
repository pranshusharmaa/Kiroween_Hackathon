import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getCurrentUser, assertRole, ROLES } from '@/modules/identity/service';

/**
 * GET /api/orgs/:orgId/memberships
 * List all memberships in an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;

    // Verify user is a member (any role can view memberships)
    try {
      await assertRole(orgId, currentUser.id, Object.values(ROLES));
    } catch (error) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const memberships = await prisma.membership.findMany({
      where: { orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ memberships });
  } catch (error) {
    console.error('Error fetching memberships:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orgs/:orgId/memberships
 * Add a new member to an organization
 * Requires ORG_ADMIN role
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;

    // Verify user has ORG_ADMIN role
    try {
      await assertRole(orgId, currentUser.id, 'ORG_ADMIN');
    } catch (error) {
      return NextResponse.json(
        { error: 'Forbidden: Requires ORG_ADMIN role' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${Object.values(ROLES).join(', ')}` },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const membership = await prisma.membership.create({
      data: {
        orgId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    console.error('Error creating membership:', error);
    
    // Handle unique constraint violation
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
