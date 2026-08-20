import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { createSessionToken, setSessionCookie } from '@/lib/auth';
import { User, Wallet } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { role } = await request.json().catch(() => ({ role: 'user' }));

    let user: User | null = null;
    if (role === 'admin') {
      user = await queryOne<User>('SELECT * FROM users WHERE role = ? LIMIT 1', ['admin']);
    } else {
      user = await queryOne<User>('SELECT * FROM users WHERE username = ? LIMIT 1', ['Alex_Quant']);
    }

    if (!user) {
      user = await queryOne<User>('SELECT * FROM users LIMIT 1');
    }

    if (!user) {
      return NextResponse.json({ error: 'Demo user not found' }, { status: 404 });
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
    console.error('Demo login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
