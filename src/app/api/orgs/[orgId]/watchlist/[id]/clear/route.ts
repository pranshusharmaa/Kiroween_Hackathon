import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, assertOrgMember } from '@/modules/identity/service';
import { clearWatchEntry } from '@/modules/connectors/watchlist';

/**
 * POST /api/orgs/:orgId/watchlist/:id/clear
 * Clear (mark as CLEARED) a watchlist entry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, id } = await params;

    // Verify user is a member
    try {
      await assertOrgMember(orgId, currentUser.id);
    } catch (error) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const entry = await clearWatchEntry(orgId, id);

    if (!entry) {
      return NextResponse.json({ error: 'Watchlist entry not found' }, { status: 404 });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Error clearing watchlist entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
