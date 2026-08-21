import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getRankByXp } from '@/lib/constants';
import { Achievement, DailyQuest } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    const session = await getSessionUser();

    const userId = targetUserId || session?.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID required or not logged in' }, { status: 401 });
    }

    const user = await queryOne<{
      id: string;
      username: string;
      email: string;
      avatar_url: string;
      xp: number;
      level: number;
      rating: number;
      current_streak: number;
      best_streak: number;
      total_predictions: number;
      total_wins: number;
      daily_streak: number;
      role: string;
      created_at: string;
    }>('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const wallet = await queryOne('SELECT * FROM wallets WHERE user_id = ?', [userId]);
    const rankInfo = getRankByXp(user.xp);
    const accuracy = user.total_predictions > 0 ? Math.round((user.total_wins / user.total_predictions) * 100) : 0;

    // Fetch all achievements + user unlocked status
    const allAchievements = await query<Achievement>('SELECT * FROM achievements');
    const userUnlocked = await query<{
      achievement_id: string;
      unlocked_at: string;
    }>('SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?', [userId]);

    const unlockedMap = new Map(userUnlocked.map((u) => [u.achievement_id, u.unlocked_at]));

    const achievementsWithStatus = allAchievements.map((ach) => {
      let progress = 0;
      if (ach.requirement_type === 'PREDICTIONS_COUNT') {
        progress = Math.min(100, (user.total_predictions / ach.requirement_value) * 100);
      } else if (ach.requirement_type === 'STREAK') {
        progress = Math.min(100, (user.best_streak / ach.requirement_value) * 100);
      } else if (ach.requirement_type === 'ACCURACY') {
        progress = user.total_predictions >= 10 ? Math.min(100, (accuracy / ach.requirement_value) * 100) : 0;
      }

      return {
        ...ach,
        unlocked_at: unlockedMap.get(ach.id) || null,
        progress: Math.round(progress),
      };
    });

    // Generate dynamic daily quests
    const dailyQuests: DailyQuest[] = [
      {
        id: 'quest-1',
        title: 'Daily Market Call',
        description: 'Complete 3 market predictions today',
        target: 3,
        progress: Math.min(3, user.total_predictions % 5),
        completed: (user.total_predictions % 5) >= 3,
        xp_reward: 75,
        coin_reward: 400,
        icon: 'Target',
      },
      {
        id: 'quest-2',
        title: 'Bull Run Specialist',
        description: 'Win at least 2 UP predictions',
        target: 2,
        progress: Math.min(2, user.total_wins % 4),
        completed: (user.total_wins % 4) >= 2,
        xp_reward: 100,
        coin_reward: 600,
        icon: 'TrendingUp',
      },
      {
        id: 'quest-3',
        title: 'Arena Sharpshooter',
        description: 'Achieve a winning streak of 3 today',
        target: 3,
        progress: Math.min(3, user.current_streak),
        completed: user.current_streak >= 3,
        xp_reward: 150,
        coin_reward: 1000,
        icon: 'Zap',
      },
    ];

    return NextResponse.json({
      user: {
        ...user,
        accuracy,
        rankInfo,
      },
      wallet,
      achievements: achievementsWithStatus,
      dailyQuests,
      isSelf: session?.user.id === userId,
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { avatarUrl } = body;

    if (typeof avatarUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid avatar URL' }, { status: 400 });
    }

    const sanitizedUrl = avatarUrl.trim();

    await execute('UPDATE users SET avatar_url = ? WHERE id = ?', [sanitizedUrl, session.user.id]);

    return NextResponse.json({
      success: true,
      avatarUrl: sanitizedUrl,
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

