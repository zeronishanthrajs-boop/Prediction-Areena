import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { SportsService } from '@/lib/sportsService';
import { z } from 'zod';

const sportsPredictSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  selectedOption: z.string().min(1, 'Prediction option is required'),
  stake: z.number().int().positive().min(100, 'Minimum sports stake is 100 coins'),
});

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to place a prediction' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = sportsPredictSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const result = SportsService.placeSportsPrediction({
      userId: session.user.id,
      eventId: parsed.data.eventId,
      selectedOption: parsed.data.selectedOption,
      stake: parsed.data.stake,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, prediction: result.prediction });
  } catch (error) {
    console.error('Sports prediction error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
