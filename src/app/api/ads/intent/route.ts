import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { AdRewardService } from '@/lib/adRewardService';
import { z } from 'zod';

const intentSchema = z.object({
  rewardType: z.enum(['DOUBLE_DAILY', 'REFILL', 'CHALLENGE_BONUS']),
  amount: z.number().int().positive().default(1000),
});

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = intentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const intent = AdRewardService.generateAdIntent(
      session.user.id,
      parsed.data.rewardType,
      parsed.data.amount
    );

    return NextResponse.json({ success: true, intent });
  } catch (error) {
    console.error('Ad intent error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
