import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { WalletService } from '@/lib/walletService';

export async function POST() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await WalletService.refillEmptyBalance(session.user.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      refillAmount: result.refillAmount,
      wallet: result.wallet,
    });
  } catch (error) {
    console.error('Refill error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
