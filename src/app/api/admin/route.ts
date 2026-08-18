import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
    const totalPredictions = (db.prepare('SELECT COUNT(*) as count FROM predictions').get() as { count: number }).count;
    const totalVolume = (db.prepare('SELECT SUM(stake) as total FROM predictions').get() as { total: number | null }).total || 0;
    const totalCoinsCirculating = (db.prepare('SELECT SUM(balance) as total FROM wallets').get() as { total: number | null }).total || 0;

    const users = db.prepare(`
      SELECT u.*, w.balance, w.lifetime_earned, w.lifetime_spent 
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      ORDER BY u.created_at DESC
      LIMIT 20
    `).all();

    const markets = db.prepare('SELECT * FROM markets').all();
    const recentPredictions = db.prepare(`
      SELECT p.*, u.username, m.name as market_name
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      JOIN markets m ON p.market_id = m.id
      ORDER BY p.created_at DESC
      LIMIT 20
    `).all();

    const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 30').all();

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalPredictions,
        totalVolume,
        totalCoinsCirculating,
      },
      users,
      markets,
      recentPredictions,
      auditLogs,
    });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, marketId, volatility, profile, status, targetUserId, isBanned, adjustmentCoins } = body;

    if (action === 'UPDATE_MARKET') {
      db.prepare(`
        UPDATE markets 
        SET volatility = COALESCE(?, volatility), 
            profile = COALESCE(?, profile), 
            status = COALESCE(?, status),
            updated_at = ?
        WHERE id = ?
      `).run(volatility, profile, status, new Date().toISOString(), marketId);

      return NextResponse.json({ success: true, message: 'Market updated' });
    }

    if (action === 'MODERATE_USER') {
      db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(isBanned ? 1 : 0, targetUserId);
      return NextResponse.json({ success: true, message: 'User updated' });
    }

    if (action === 'ADJUST_COINS') {
      db.prepare('UPDATE wallets SET balance = balance + ? WHERE user_id = ?').run(adjustmentCoins, targetUserId);
      return NextResponse.json({ success: true, message: 'Balance adjusted' });
    }

    return NextResponse.json({ error: 'Invalid admin action' }, { status: 400 });
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
