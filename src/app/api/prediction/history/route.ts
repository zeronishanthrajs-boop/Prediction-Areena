import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { PredictionService } from '@/lib/predictionService';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'user';
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    if (scope === 'recent-rounds') {
      const rounds = await query(`
        SELECT r.*, m.name as market_name, m.symbol as market_symbol
        FROM market_rounds r
        JOIN markets m ON r.market_id = m.id
        WHERE r.status = 'RESOLVED'
        ORDER BY r.end_time DESC
        LIMIT ?
      `, [limit]);
      return NextResponse.json({ rounds });
    }

    if (!session) {
      return NextResponse.json({ predictions: [] });
    }

    const predictions = await PredictionService.getUserPredictions(session.user.id, limit);
    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('Prediction history error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
