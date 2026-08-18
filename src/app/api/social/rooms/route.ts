import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { SocialService } from '@/lib/socialService';
import { z } from 'zod';

const createRoomSchema = z.object({
  action: z.literal('CREATE').optional(),
  name: z.string().min(2, 'Room name must be at least 2 characters').max(30),
  marketId: z.string().min(1, 'Market ID required'),
  rounds: z.number().int().min(3).max(50).default(10),
  roundDuration: z.number().int().min(15).max(60).default(30),
  customRoomCode: z.string().max(8).optional(),
});

const joinRoomSchema = z.object({
  action: z.literal('JOIN'),
  roomCode: z.string().min(3).max(8),
});

export async function GET() {
  try {
    const rooms = SocialService.getPrivateRooms();
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Rooms GET error:', error);
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

    // Route to JOIN handler if action is JOIN
    if (body.action === 'JOIN') {
      const parsed = joinRoomSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      const result = SocialService.joinPrivateRoom(parsed.data.roomCode, session.user.id);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      return NextResponse.json({ success: true, room: result.room });
    }

    // Default: CREATE room
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const result = SocialService.createPrivateRoom({
      creatorId: session.user.id,
      name: parsed.data.name,
      marketId: parsed.data.marketId,
      rounds: parsed.data.rounds,
      roundDuration: parsed.data.roundDuration,
      customRoomCode: parsed.data.customRoomCode,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, room: result.room });
  } catch (error) {
    console.error('Room create/join error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
