import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSessionToken, setSessionCookie, getRandomAvatar } from '@/lib/auth';
import { z } from 'zod';
import crypto from 'crypto';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { username, email, password } = parsed.data;

    // Check unique username and email
    const existing = db.prepare('SELECT id, username, email FROM users WHERE username = ? OR email = ?').get(username, email) as { username: string; email: string } | undefined;
    if (existing) {
      if (existing.username.toLowerCase() === username.toLowerCase()) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }

    const userId = `usr-${crypto.randomUUID()}`;
    const passwordHash = hashPassword(password);
    const avatarUrl = getRandomAvatar();
    const now = new Date().toISOString();
    const STARTING_BALANCE = 10000;

    // Atomic user & wallet creation with 10,000 Starting Practice Coins
    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO users (id, username, email, password_hash, avatar_url, xp, level, rating, current_streak, best_streak, total_predictions, total_wins, daily_streak, role, is_banned, created_at)
        VALUES (?, ?, ?, ?, ?, 0, 1, 1200, 0, 0, 0, 0, 0, 'user', 0, ?)
      `).run(userId, username, email, passwordHash, avatarUrl, now);

      db.prepare(`
        INSERT INTO wallets (id, user_id, balance, lifetime_earned, lifetime_spent, updated_at)
        VALUES (?, ?, ?, ?, 0, ?)
      `).run(`wal-${userId}`, userId, STARTING_BALANCE, STARTING_BALANCE, now);

      db.prepare(`
        INSERT INTO wallet_transactions (id, user_id, type, amount, balance_before, balance_after, idempotency_key, metadata, created_at)
        VALUES (?, ?, 'STARTING_GRANT', ?, 0, ?, ?, ?, ?)
      `).run(
        `tx-start-${userId}`,
        userId,
        STARTING_BALANCE,
        STARTING_BALANCE,
        `start-grant-${userId}`,
        JSON.stringify({ reason: 'New Player 10,000 Practice Coins Welcome Bonus' }),
        now
      );
    });

    tx();

    const token = await createSessionToken({
      userId,
      role: 'user',
      username,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        username,
        email,
        avatar_url: avatarUrl,
        xp: 0,
        level: 1,
        rating: 1200,
        current_streak: 0,
        role: 'user',
      },
      wallet: {
        id: `wal-${userId}`,
        user_id: userId,
        balance: STARTING_BALANCE,
        lifetime_earned: STARTING_BALANCE,
        lifetime_spent: 0,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
