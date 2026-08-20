import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { AdRewardService } from '@/lib/adRewardService';
import { z } from 'zod';

const verifySchema = z.object({
  nonce: z.string().min(1, 'Nonce is required'),
  signature: z.string().min(1, 'Signature is required'),
});

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const result = await AdRewardService.verifyAndCreditReward({
      nonce: parsed.data.nonce,
      userId: session.user.id,
      signature: parsed.data.signature,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      coinsAwarded: result.coinsAwarded,
    });
  } catch (error) {
    console.error('Ad verify error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
