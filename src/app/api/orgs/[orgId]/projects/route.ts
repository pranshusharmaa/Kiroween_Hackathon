import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getCurrentUser, assertOrgMember, assertRole } from '@/modules/identity/service';

/**
 * GET /api/orgs/:orgId/projects
 * List all projects within an organization
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

    // Verify user is a member of the org
    try {
      await assertOrgMember(orgId, currentUser.id);
    } catch (error) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const projects = await prisma.project.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orgs/:orgId/projects
 * Create a new project within an organization
 * Requires ORG_ADMIN or SRE_LEAD role
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

    // Verify user has required role
    try {
      await assertRole(orgId, currentUser.id, ['ORG_ADMIN', 'SRE_LEAD']);
    } catch (error) {
      return NextResponse.json(
        { error: 'Forbidden: Requires ORG_ADMIN or SRE_LEAD role' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, slug, environments, defaultRunbookPath } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        orgId,
        name,
        slug,
        environments: environments || ['production', 'staging'],
        defaultRunbookPath,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    
    // Handle unique constraint violation
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'A project with this slug already exists in this organization' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
