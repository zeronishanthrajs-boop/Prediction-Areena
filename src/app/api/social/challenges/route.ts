import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { SocialService } from '@/lib/socialService';
import { z } from 'zod';

const challengeSchema = z.object({
  opponentId: z.string().min(1, 'Opponent ID required'),
  marketId: z.string().min(1, 'Market ID required'),
  roundsTotal: z.number().int().min(1).max(20).default(5),
});

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const challenges = await SocialService.getUserChallenges(session.user.id);
    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Challenges GET error:', error);
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
    const parsed = challengeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const result = await SocialService.createChallenge({
      creatorId: session.user.id,
      opponentId: parsed.data.opponentId,
      marketId: parsed.data.marketId,
      roundsTotal: parsed.data.roundsTotal,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, challenge: result.challenge });
  } catch (error) {
    console.error('Challenge create error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
