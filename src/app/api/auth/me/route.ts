import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null, wallet: null });
    }
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        username: session.user.username,
        email: session.user.email,
        avatar_url: session.user.avatar_url,
        xp: session.user.xp,
        level: session.user.level,
        rating: session.user.rating,
        current_streak: session.user.current_streak,
        best_streak: session.user.best_streak,
        total_predictions: session.user.total_predictions,
        total_wins: session.user.total_wins,
        daily_streak: session.user.daily_streak,
        last_daily_claim_at: session.user.last_daily_claim_at,
        role: session.user.role,
      },
      wallet: session.wallet,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
