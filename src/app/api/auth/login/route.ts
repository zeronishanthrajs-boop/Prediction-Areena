import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { User, Wallet } from '@/lib/types';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(2, 'Username or email required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { identifier, password } = parsed.data;

    const user = await queryOne<User>(`
      SELECT * FROM users 
      WHERE (email = ? OR username = ?) AND is_banned = 0
    `, [identifier, identifier]);

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user.id,
      role: user.role,
      username: user.username,
    });

    await setSessionCookie(token);

    const wallet = await queryOne<Wallet>('SELECT * FROM wallets WHERE user_id = ?', [user.id]);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        xp: user.xp,
        level: user.level,
        rating: user.rating,
        current_streak: user.current_streak,
        role: user.role,
      },
      wallet,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
