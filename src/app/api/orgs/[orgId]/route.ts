import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getCurrentUser, assertOrgMember } from '@/modules/identity/service';

/**
 * GET /api/orgs/:orgId
 * Get organization details with current user's role
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

    // Verify user is a member
    try {
      await assertOrgMember(orgId, currentUser.id);
    } catch (error) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        memberships: {
          where: {
            userId: currentUser.id,
          },
          select: {
            role: true,
          },
        },
        _count: {
          select: {
            memberships: true,
            projects: true,
          },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        billingPlan: org.billingPlan,
        createdAt: org.createdAt,
        role: org.memberships[0]?.role,
        memberCount: org._count.memberships,
        projectCount: org._count.projects,
      },
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
