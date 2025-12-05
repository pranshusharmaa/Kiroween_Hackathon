import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getCurrentUser } from '@/modules/identity/service';

/**
 * GET /api/orgs
 * List all organizations the current user belongs to
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgs = await prisma.organization.findMany({
      where: {
        memberships: {
          some: {
            userId: currentUser.id,
          },
        },
      },
      include: {
        memberships: {
          where: {
            userId: currentUser.id,
          },
          select: {
            role: true,
          },
        },
      },
    });

    const result = orgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      billingPlan: org.billingPlan,
      createdAt: org.createdAt,
      role: org.memberships[0]?.role,
    }));

    return NextResponse.json({ orgs: result });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orgs
 * Create a new organization (for demo/setup purposes)
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Create org and membership in a transaction
    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        memberships: {
          create: {
            userId: currentUser.id,
            role: 'ORG_ADMIN',
          },
        },
      },
      include: {
        memberships: {
          where: {
            userId: currentUser.id,
          },
        },
      },
    });

    return NextResponse.json({
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        billingPlan: org.billingPlan,
        createdAt: org.createdAt,
        role: org.memberships[0]?.role,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
