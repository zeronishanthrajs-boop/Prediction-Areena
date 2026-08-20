import { query, queryOne, execute } from './db';
import { Friendship, Challenge, PrivateRoom, User } from './types';
import crypto from 'crypto';

export class SocialService {
  /**
   * Search users by username (excluding self)
   */
  static async searchUsers(currentUserId: string, searchStr: string, limit = 10): Promise<User[]> {
    if (!searchStr.trim()) return [];
    return await query<User>(`
      SELECT id, username, avatar_url, xp, level, rating, current_streak, total_predictions, total_wins
      FROM users
      WHERE id != ? AND username LIKE ? AND is_banned = 0
      LIMIT ?
    `, [currentUserId, `%${searchStr.trim()}%`, limit]);
  }

  /**
   * Get user's friend list with friend stats
   */
  static async getFriends(userId: string): Promise<Friendship[]> {
    return await query<Friendship>(`
      SELECT f.*, u.username as friend_username, u.avatar_url as friend_avatar, u.rating as friend_rating, u.level as friend_level
      FROM friendships f
      JOIN users u ON (CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END) = u.id
      WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'ACCEPTED'
    `, [userId, userId, userId]);
  }

  /**
   * Get pending incoming friend requests
   */
  static async getPendingRequests(userId: string): Promise<Friendship[]> {
    return await query<Friendship>(`
      SELECT f.*, u.username as friend_username, u.avatar_url as friend_avatar, u.rating as friend_rating, u.level as friend_level
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'PENDING'
    `, [userId]);
  }

  /**
   * Send a friend request
   */
  static async sendFriendRequest(userId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> {
    if (userId === targetUserId) {
      return { success: false, error: 'Cannot send friend request to yourself' };
    }

    const existing = await queryOne<Friendship>(`
      SELECT * FROM friendships 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `, [userId, targetUserId, targetUserId, userId]);

    if (existing) {
      if (existing.status === 'ACCEPTED') return { success: false, error: 'Already friends' };
      if (existing.status === 'PENDING') return { success: false, error: 'Friend request already pending' };
    }

    const id = `fr-${crypto.randomUUID()}`;
    await execute(`
      INSERT INTO friendships (id, user_id, friend_id, status, created_at)
      VALUES (?, ?, ?, 'PENDING', ?)
    `, [id, userId, targetUserId, new Date().toISOString()]);

    return { success: true };
  }

  /**
   * Accept or decline a friend request
   */
  static async respondToFriendRequest(requestId: string, currentUserId: string, action: 'ACCEPT' | 'DECLINE'): Promise<{ success: boolean; error?: string }> {
    const request = await queryOne<Friendship>('SELECT * FROM friendships WHERE id = ?', [requestId]);
    if (!request || request.friend_id !== currentUserId) {
      return { success: false, error: 'Friend request not found or unauthorized' };
    }

    if (action === 'ACCEPT') {
      await execute("UPDATE friendships SET status = 'ACCEPTED' WHERE id = ?", [requestId]);
    } else {
      await execute("DELETE FROM friendships WHERE id = ?", [requestId]);
    }

    return { success: true };
  }

  /**
   * Create a Head-to-Head Challenge against a friend
   */
  static async createChallenge(params: {
    creatorId: string;
    opponentId: string;
    marketId: string;
    roundsTotal: number;
  }): Promise<{ success: boolean; challenge?: Challenge; error?: string }> {
    const { creatorId, opponentId, marketId, roundsTotal } = params;

    const id = `ch-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    await execute(`
      INSERT INTO challenges (id, creator_id, opponent_id, market_id, rounds_total, rounds_completed, creator_wins, opponent_wins, status, created_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, 0, 'ACTIVE', ?)
    `, [id, creatorId, opponentId, marketId, roundsTotal, now]);

    const challenge: Challenge = {
      id,
      creator_id: creatorId,
      opponent_id: opponentId,
      market_id: marketId,
      rounds_total: roundsTotal,
      rounds_completed: 0,
      creator_wins: 0,
      opponent_wins: 0,
      status: 'ACTIVE',
      created_at: now,
    };

    return { success: true, challenge };
  }

  /**
   * Get user's active & recent challenges
   */
  static async getUserChallenges(userId: string): Promise<Challenge[]> {
    return await query<Challenge>(`
      SELECT c.*, 
             u1.username as creator_username, u1.avatar_url as creator_avatar,
             u2.username as opponent_username, u2.avatar_url as opponent_avatar
      FROM challenges c
      JOIN users u1 ON c.creator_id = u1.id
      JOIN users u2 ON c.opponent_id = u2.id
      WHERE c.creator_id = ? OR c.opponent_id = ?
      ORDER BY c.created_at DESC
      LIMIT 20
    `, [userId, userId]);
  }

  /**
   * Create a custom Private Room with auto-generated or custom room code
   */
  static async createPrivateRoom(params: {
    creatorId: string;
    name: string;
    marketId: string;
    rounds: number;
    roundDuration?: number;
    customRoomCode?: string;
  }): Promise<{ success: boolean; room?: PrivateRoom; error?: string }> {
    const { creatorId, name, marketId, rounds, roundDuration = 30, customRoomCode } = params;
    
    let roomCode = customRoomCode?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!roomCode || roomCode.length < 3) {
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Check code collision
    const existing = await queryOne<{ id: string }>('SELECT id FROM private_rooms WHERE room_code = ?', [roomCode]);
    if (existing) {
      if (customRoomCode) {
        return { success: false, error: 'Room code already taken. Please choose another or generate a new code.' };
      }
      roomCode = `${roomCode}${Math.floor(Math.random() * 90 + 10)}`;
    }

    const id = `room-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    await execute(`
      INSERT INTO private_rooms (id, room_code, name, creator_id, market_id, rounds, round_duration, status, participants_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'WAITING', 1, ?)
    `, [id, roomCode, name, creatorId, marketId, rounds, roundDuration, now]);

    const room: PrivateRoom = {
      id,
      room_code: roomCode,
      name,
      creator_id: creatorId,
      market_id: marketId,
      rounds,
      round_duration: roundDuration,
      status: 'WAITING',
      participants_count: 1,
      created_at: now,
    };

    return { success: true, room };
  }

  /**
   * Join an existing Private Room by Room Code
   */
  static async joinPrivateRoom(roomCode: string, userId: string): Promise<{ success: boolean; room?: PrivateRoom; error?: string }> {
    const sanitizedCode = roomCode.trim().toUpperCase();
    const room = await queryOne<PrivateRoom>('SELECT * FROM private_rooms WHERE room_code = ?', [sanitizedCode]);

    if (!room) {
      return { success: false, error: `No private room found with code "${sanitizedCode}"` };
    }

    if (room.status === 'FINISHED') {
      return { success: false, error: 'This room match has already concluded.' };
    }

    // Increment participants count if joining user is not creator
    if (room.creator_id !== userId) {
      await execute('UPDATE private_rooms SET participants_count = participants_count + 1 WHERE id = ?', [room.id]);
      room.participants_count += 1;
    }

    return { success: true, room };
  }

  /**
   * List available active private rooms
   */
  static async getPrivateRooms(): Promise<PrivateRoom[]> {
    return await query<PrivateRoom>(`
      SELECT * FROM private_rooms 
      WHERE status != 'FINISHED' 
      ORDER BY created_at DESC 
      LIMIT 20
    `);
  }
}
