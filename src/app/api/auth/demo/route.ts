import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, setSessionCookie } from '@/lib/auth';
import { User } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { role } = await request.json().catch(() => ({ role: 'user' }));

    let user: User | undefined;
    if (role === 'admin') {
      user = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get('admin') as User | undefined;
    } else {
      user = db.prepare('SELECT * FROM users WHERE username = ? LIMIT 1').get('Alex_Quant') as User | undefined;
    }

    if (!user) {
      user = db.prepare('SELECT * FROM users LIMIT 1').get() as User | undefined;
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

    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(user.id);

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
