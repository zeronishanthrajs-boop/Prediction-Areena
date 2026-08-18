import { NextResponse } from 'next/server';
import { SportsService } from '@/lib/sportsService';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;

    const events = SportsService.getEvents(category);
    const session = await getSessionUser();

    let userPredictions: unknown[] = [];
    if (session) {
      userPredictions = SportsService.getUserSportsPredictions(session.user.id);
    }

    return NextResponse.json({ events, userPredictions });
  } catch (error) {
    console.error('Sports API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
