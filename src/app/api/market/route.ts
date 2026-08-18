import { NextResponse } from 'next/server';
import { marketEngine } from '@/lib/marketEngine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('id');

    if (marketId) {
      const state = marketEngine.getMarketState(marketId);
      if (!state) {
        return NextResponse.json({ error: 'Market not found' }, { status: 404 });
      }

      const ticks = marketEngine.getRecentTicks(marketId);
      const timeRemaining = Math.max(0, Math.ceil((state.activeRound.end_time - Date.now()) / 1000));

      return NextResponse.json({
        market: state.market,
        currentPrice: state.currentPrice,
        previousPrice: state.previousPrice,
        activeRound: state.activeRound,
        timeRemaining,
        ticks,
      });
    }

    const snapshots = marketEngine.getAllMarketSnapshots();
    return NextResponse.json({ markets: snapshots });
  } catch (error) {
    console.error('Market API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
