import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { WalletService } from '@/lib/walletService';

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const transactions = WalletService.getTransactions(session.user.id, limit);
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Wallet transactions error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
