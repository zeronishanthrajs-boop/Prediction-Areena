import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { SocialService } from '@/lib/socialService';

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (query) {
      const searchResults = await SocialService.searchUsers(session.user.id, query);
      return NextResponse.json({ users: searchResults });
    }

    const friends = await SocialService.getFriends(session.user.id);
    const pendingRequests = await SocialService.getPendingRequests(session.user.id);

    return NextResponse.json({ friends, pendingRequests });
  } catch (error) {
    console.error('Friends API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, targetUserId, requestId } = body;

    if (action === 'SEND') {
      if (!targetUserId) return NextResponse.json({ error: 'Target user required' }, { status: 400 });
      const result = await SocialService.sendFriendRequest(session.user.id, targetUserId);
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === 'RESPOND') {
      if (!requestId || !body.response) {
        return NextResponse.json({ error: 'Request ID and response (ACCEPT/DECLINE) required' }, { status: 400 });
      }
      const result = await SocialService.respondToFriendRequest(requestId, session.user.id, body.response);
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Friends POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
