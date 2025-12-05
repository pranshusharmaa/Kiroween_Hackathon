import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, assertOrgMember } from '@/modules/identity/service';
import { getPostmortemForIncident } from '@/modules/knowledge/postmortems';

/**
 * POST /api/orgs/:orgId/incidents/:incidentId/postmortem/pr
 * Create a GitHub PR with the postmortem
 * 
 * TODO: Integrate with GitHub MCP tools
 * For now, returns the markdown that would be committed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; incidentId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, incidentId } = await params;

    // Verify user is a member
    try {
      await assertOrgMember(orgId, currentUser.id);
    } catch (error) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get postmortem
    const postmortem = await getPostmortemForIncident(orgId, incidentId);

    if (!postmortem) {
      return NextResponse.json(
        { error: 'Postmortem not found. Generate it first.' },
        { status: 404 }
      );
    }

    // TODO: Use GitHub MCP tools to:
    // 1. Create a new branch: postmortem/incident-{incidentId}
    // 2. Add file: incidents/postmortems/incident-{incidentId}.md
    // 3. Commit with message: "Add postmortem for incident {incidentId}"
    // 4. Create PR with summary from postmortem.summaryText

    // For demo: return a simulated PR URL
    // In production, this would call GitHub MCP tools
    const prNumber = Math.floor(Math.random() * 1000) + 100;
    const prUrl = `https://github.com/yourusername/runbook-revenant/pull/${prNumber}`;
    
    const prDetails = {
      branch: `postmortem/incident-${incidentId}`,
      filePath: `incidents/postmortems/incident-${incidentId}.md`,
      commitMessage: `Add postmortem for incident ${incidentId}`,
      prTitle: `Postmortem: ${postmortem.summaryText}`,
      prBody: `This PR adds the postmortem for incident ${incidentId}.\n\n${postmortem.summaryText}\n\nPlease review and merge to add this to our knowledge base.`,
      markdown: postmortem.markdown,
    };

    return NextResponse.json({
      prUrl,
      message: 'PR created successfully (demo mode)',
      prDetails,
    });
  } catch (error) {
    console.error('Error creating PR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
