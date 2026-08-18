import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { WalletService } from '@/lib/walletService';

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { doubleReward } = await request.json().catch(() => ({ doubleReward: false }));

    const result = WalletService.claimDailyReward(session.user.id, Boolean(doubleReward));
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      rewardAmount: result.rewardAmount,
      newStreak: result.newStreak,
      wallet: result.wallet,
    });
  } catch (error) {
    console.error('Daily claim error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
