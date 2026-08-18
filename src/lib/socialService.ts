import { db } from './db';
import { Friendship, Challenge, PrivateRoom, User } from './types';
import crypto from 'crypto';

export class SocialService {
  /**
   * Search users by username (excluding self)
   */
  static searchUsers(currentUserId: string, query: string, limit = 10): User[] {
    if (!query.trim()) return [];
    return db.prepare(`
      SELECT id, username, avatar_url, xp, level, rating, current_streak, total_predictions, total_wins
      FROM users
      WHERE id != ? AND username LIKE ? AND is_banned = 0
      LIMIT ?
    `).all(currentUserId, `%${query.trim()}%`, limit) as User[];
  }

  /**
   * Get user's friend list with friend stats
   */
  static getFriends(userId: string): Friendship[] {
    return db.prepare(`
      SELECT f.*, u.username as friend_username, u.avatar_url as friend_avatar, u.rating as friend_rating, u.level as friend_level
      FROM friendships f
      JOIN users u ON (CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END) = u.id
      WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'ACCEPTED'
    `).all(userId, userId, userId) as Friendship[];
  }

  /**
   * Get pending incoming friend requests
   */
  static getPendingRequests(userId: string): Friendship[] {
    return db.prepare(`
      SELECT f.*, u.username as friend_username, u.avatar_url as friend_avatar, u.rating as friend_rating, u.level as friend_level
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'PENDING'
    `).all(userId) as Friendship[];
  }

  /**
   * Send a friend request
   */
  static sendFriendRequest(userId: string, targetUserId: string): { success: boolean; error?: string } {
    if (userId === targetUserId) {
      return { success: false, error: 'Cannot send friend request to yourself' };
    }

    const existing = db.prepare(`
      SELECT * FROM friendships 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `).get(userId, targetUserId, targetUserId, userId) as Friendship | undefined;

    if (existing) {
      if (existing.status === 'ACCEPTED') return { success: false, error: 'Already friends' };
      if (existing.status === 'PENDING') return { success: false, error: 'Friend request already pending' };
    }

    const id = `fr-${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO friendships (id, user_id, friend_id, status, created_at)
      VALUES (?, ?, ?, 'PENDING', ?)
    `).run(id, userId, targetUserId, new Date().toISOString());

    return { success: true };
  }

  /**
   * Accept or decline a friend request
   */
  static respondToFriendRequest(requestId: string, currentUserId: string, action: 'ACCEPT' | 'DECLINE'): { success: boolean; error?: string } {
    const request = db.prepare('SELECT * FROM friendships WHERE id = ?').get(requestId) as Friendship | undefined;
    if (!request || request.friend_id !== currentUserId) {
      return { success: false, error: 'Friend request not found or unauthorized' };
    }

    if (action === 'ACCEPT') {
      db.prepare("UPDATE friendships SET status = 'ACCEPTED' WHERE id = ?").run(requestId);
    } else {
      db.prepare("DELETE FROM friendships WHERE id = ?").run(requestId);
    }

    return { success: true };
  }

  /**
   * Create a Head-to-Head Challenge against a friend
   */
  static createChallenge(params: {
    creatorId: string;
    opponentId: string;
    marketId: string;
    roundsTotal: number;
  }): { success: boolean; challenge?: Challenge; error?: string } {
    const { creatorId, opponentId, marketId, roundsTotal } = params;

    const id = `ch-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO challenges (id, creator_id, opponent_id, market_id, rounds_total, rounds_completed, creator_wins, opponent_wins, status, created_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, 0, 'ACTIVE', ?)
    `).run(id, creatorId, opponentId, marketId, roundsTotal, now);

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
  static getUserChallenges(userId: string): Challenge[] {
    return db.prepare(`
      SELECT c.*, 
             u1.username as creator_username, u1.avatar_url as creator_avatar,
             u2.username as opponent_username, u2.avatar_url as opponent_avatar
      FROM challenges c
      JOIN users u1 ON c.creator_id = u1.id
      JOIN users u2 ON c.opponent_id = u2.id
      WHERE c.creator_id = ? OR c.opponent_id = ?
      ORDER BY c.created_at DESC
      LIMIT 20
    `).all(userId, userId) as Challenge[];
  }

  /**
   * Create a custom Private Room with auto-generated or custom room code
   */
  static createPrivateRoom(params: {
    creatorId: string;
    name: string;
    marketId: string;
    rounds: number;
    roundDuration?: number;
    customRoomCode?: string;
  }): { success: boolean; room?: PrivateRoom; error?: string } {
    const { creatorId, name, marketId, rounds, roundDuration = 30, customRoomCode } = params;
    
    let roomCode = customRoomCode?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!roomCode || roomCode.length < 3) {
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Check code collision
    const existing = db.prepare('SELECT id FROM private_rooms WHERE room_code = ?').get(roomCode);
    if (existing) {
      if (customRoomCode) {
        return { success: false, error: 'Room code already taken. Please choose another or generate a new code.' };
      }
      roomCode = `${roomCode}${Math.floor(Math.random() * 90 + 10)}`;
    }

    const id = `room-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO private_rooms (id, room_code, name, creator_id, market_id, rounds, round_duration, status, participants_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'WAITING', 1, ?)
    `).run(id, roomCode, name, creatorId, marketId, rounds, roundDuration, now);

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
  static joinPrivateRoom(roomCode: string, userId: string): { success: boolean; room?: PrivateRoom; error?: string } {
    const sanitizedCode = roomCode.trim().toUpperCase();
    const room = db.prepare('SELECT * FROM private_rooms WHERE room_code = ?').get(sanitizedCode) as PrivateRoom | undefined;

    if (!room) {
      return { success: false, error: `No private room found with code "${sanitizedCode}"` };
    }

    if (room.status === 'FINISHED') {
      return { success: false, error: 'This room match has already concluded.' };
    }

    // Increment participants count if joining user is not creator
    if (room.creator_id !== userId) {
      db.prepare('UPDATE private_rooms SET participants_count = participants_count + 1 WHERE id = ?').run(room.id);
      room.participants_count += 1;
    }

    return { success: true, room };
  }

  /**
   * List available active private rooms
   */
  static getPrivateRooms(): PrivateRoom[] {
    return db.prepare(`
      SELECT * FROM private_rooms 
      WHERE status != 'FINISHED' 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all() as PrivateRoom[];
  }
}
