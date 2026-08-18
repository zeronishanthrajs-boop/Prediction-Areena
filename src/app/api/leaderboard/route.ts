import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { LeaderboardEntry } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'global'; // 'global' | 'friends' | 'weekly' | 'monthly' | 'all-time'
    const session = await getSessionUser();
    const currentUserId = session?.user.id;

    let usersQuery = `
      SELECT id, username, avatar_url, rating, current_streak, best_streak, total_predictions, total_wins
      FROM users
      WHERE is_banned = 0
    `;

    if (tab === 'friends' && currentUserId) {
      // Filter for friends + self
      usersQuery = `
        SELECT u.id, u.username, u.avatar_url, u.rating, u.current_streak, u.best_streak, u.total_predictions, u.total_wins
        FROM users u
        WHERE u.id = '${currentUserId}' OR u.id IN (
          SELECT CASE WHEN f.user_id = '${currentUserId}' THEN f.friend_id ELSE f.user_id END
          FROM friendships f
          WHERE (f.user_id = '${currentUserId}' OR f.friend_id = '${currentUserId}') AND f.status = 'ACCEPTED'
        )
      `;
    }

    usersQuery += ' ORDER BY rating DESC, total_wins DESC LIMIT 100';

    const rawUsers = db.prepare(usersQuery).all() as Array<{
      id: string;
      username: string;
      avatar_url: string;
      rating: number;
      current_streak: number;
      best_streak: number;
      total_predictions: number;
      total_wins: number;
    }>;

    let currentUserEntry: LeaderboardEntry | null = null;

    const entries: LeaderboardEntry[] = rawUsers.map((u, index) => {
      const rank = index + 1;
      const accuracy = u.total_predictions > 0 ? Math.round((u.total_wins / u.total_predictions) * 100) : 0;
      // Deterministic mock rank movement based on streak/id
      const rankChange = u.current_streak > 3 ? Math.min(8, u.current_streak * 2) : u.current_streak === 0 ? -1 : 0;

      const entry: LeaderboardEntry = {
        rank,
        user_id: u.id,
        username: u.username,
        avatar_url: u.avatar_url,
        rating: u.rating,
        accuracy,
        streak: u.current_streak,
        total_predictions: u.total_predictions,
        rank_change: rankChange,
        is_current_user: u.id === currentUserId,
      };

      if (u.id === currentUserId) {
        currentUserEntry = entry;
      }

      return entry;
    });

    return NextResponse.json({ entries, currentUserEntry, tab });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
