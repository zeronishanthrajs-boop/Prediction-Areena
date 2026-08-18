import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { PredictionService } from '@/lib/predictionService';
import { z } from 'zod';

const submitSchema = z.object({
  marketId: z.string().min(1, 'Market ID is required'),
  direction: z.enum(['UP', 'DOWN']),
  stake: z.number().int().positive('Stake must be a positive integer').min(50, 'Minimum stake is 50 coins'),
  idempotencyKey: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to place a prediction' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { marketId, direction, stake, idempotencyKey } = parsed.data;

    const result = PredictionService.placePrediction({
      userId: session.user.id,
      marketId,
      direction,
      stake,
      idempotencyKey,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      prediction: result.prediction,
    });
  } catch (error) {
    console.error('Prediction submission error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
