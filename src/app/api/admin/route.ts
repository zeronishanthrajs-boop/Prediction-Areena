import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const totalUsersRow = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalUsersRow?.count || 0;

    const totalPredsRow = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM predictions');
    const totalPredictions = totalPredsRow?.count || 0;

    const totalVolRow = await queryOne<{ total: number | null }>('SELECT SUM(stake) as total FROM predictions');
    const totalVolume = totalVolRow?.total || 0;

    const totalCoinsRow = await queryOne<{ total: number | null }>('SELECT SUM(balance) as total FROM wallets');
    const totalCoinsCirculating = totalCoinsRow?.total || 0;

    const users = await query(`
      SELECT u.*, w.balance, w.lifetime_earned, w.lifetime_spent 
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      ORDER BY u.created_at DESC
      LIMIT 20
    `);

    const markets = await query('SELECT * FROM markets');
    const recentPredictions = await query(`
      SELECT p.*, u.username, m.name as market_name
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      JOIN markets m ON p.market_id = m.id
      ORDER BY p.created_at DESC
      LIMIT 20
    `);

    const auditLogs = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 30');

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
      await execute(`
        UPDATE markets 
        SET volatility = COALESCE(?, volatility), 
            profile = COALESCE(?, profile), 
            status = COALESCE(?, status),
            updated_at = ?
        WHERE id = ?
      `, [volatility, profile, status, new Date().toISOString(), marketId]);

      return NextResponse.json({ success: true, message: 'Market updated' });
    }

    if (action === 'MODERATE_USER') {
      await execute('UPDATE users SET is_banned = ? WHERE id = ?', [isBanned ? 1 : 0, targetUserId]);
      return NextResponse.json({ success: true, message: 'User updated' });
    }

    if (action === 'ADJUST_COINS') {
      await execute('UPDATE wallets SET balance = balance + ? WHERE user_id = ?', [adjustmentCoins, targetUserId]);
      return NextResponse.json({ success: true, message: 'Balance adjusted' });
    }

    return NextResponse.json({ error: 'Invalid admin action' }, { status: 400 });
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
