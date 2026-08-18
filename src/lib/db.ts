import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { INITIAL_MARKETS, INITIAL_ACHIEVEMENTS, INITIAL_SPORTS_EVENTS } from './constants';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'prediction_arena.db');

// Global singleton to prevent multiple instances during Next.js hot-reloading
declare global {
  // eslint-disable-next-line no-var
  var __dbInstance: Database.Database | undefined;
}

function getDatabase(): Database.Database {
  if (global.__dbInstance) {
    return global.__dbInstance;
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initSchema(db);
  seedInitialData(db);

  global.__dbInstance = db;
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      avatar_url TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      rating INTEGER DEFAULT 1200,
      current_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      total_predictions INTEGER DEFAULT 0,
      total_wins INTEGER DEFAULT 0,
      last_daily_claim_at TEXT,
      daily_streak INTEGER DEFAULT 0,
      role TEXT DEFAULT 'user',
      is_banned INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      balance INTEGER DEFAULT 10000,
      lifetime_earned INTEGER DEFAULT 10000,
      lifetime_spent INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_before INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      idempotency_key TEXT UNIQUE,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS markets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      profile TEXT NOT NULL,
      base_price REAL NOT NULL,
      current_price REAL NOT NULL,
      volatility REAL NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      category TEXT DEFAULT 'INDEX',
      change_24h REAL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS market_rounds (
      id TEXT PRIMARY KEY,
      market_id TEXT NOT NULL,
      round_number INTEGER NOT NULL,
      start_time INTEGER NOT NULL,
      lock_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      start_price REAL NOT NULL,
      lock_price REAL,
      end_price REAL,
      status TEXT NOT NULL,
      outcome TEXT,
      FOREIGN KEY(market_id) REFERENCES markets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      market_id TEXT NOT NULL,
      round_id TEXT NOT NULL,
      direction TEXT NOT NULL,
      stake INTEGER NOT NULL,
      entry_price REAL NOT NULL,
      exit_price REAL,
      payout INTEGER DEFAULT 0,
      xp_awarded INTEGER DEFAULT 0,
      rating_delta INTEGER DEFAULT 0,
      result TEXT DEFAULT 'PENDING',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(round_id) REFERENCES market_rounds(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sports_events (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      team_a TEXT NOT NULL,
      team_b TEXT NOT NULL,
      status TEXT NOT NULL,
      start_time TEXT NOT NULL,
      closing_time TEXT NOT NULL,
      team_a_multiplier REAL NOT NULL,
      team_b_multiplier REAL NOT NULL,
      draw_multiplier REAL,
      total_participants INTEGER DEFAULT 0,
      winning_option TEXT
    );

    CREATE TABLE IF NOT EXISTS sports_predictions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      selected_option TEXT NOT NULL,
      stake INTEGER NOT NULL,
      multiplier REAL NOT NULL,
      payout INTEGER DEFAULT 0,
      result TEXT DEFAULT 'PENDING',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(event_id) REFERENCES sports_events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      friend_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(friend_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, friend_id)
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL,
      opponent_id TEXT NOT NULL,
      market_id TEXT NOT NULL,
      rounds_total INTEGER NOT NULL,
      rounds_completed INTEGER DEFAULT 0,
      creator_wins INTEGER DEFAULT 0,
      opponent_wins INTEGER DEFAULT 0,
      status TEXT NOT NULL,
      winner_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(creator_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(opponent_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS private_rooms (
      id TEXT PRIMARY KEY,
      room_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      market_id TEXT NOT NULL,
      rounds INTEGER NOT NULL,
      round_duration INTEGER DEFAULT 30,
      status TEXT DEFAULT 'WAITING',
      participants_count INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY(creator_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      xp_reward INTEGER NOT NULL,
      coin_reward INTEGER NOT NULL,
      icon TEXT NOT NULL,
      requirement_type TEXT NOT NULL,
      requirement_value INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
      UNIQUE(user_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS ad_intents (
      nonce TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      reward_type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT DEFAULT 'PENDING',
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
    CREATE INDEX IF NOT EXISTS idx_predictions_round ON predictions(round_id);
    CREATE INDEX IF NOT EXISTS idx_rounds_market ON market_rounds(market_id, status);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON wallet_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC);
  `);
}

function seedInitialData(db: Database.Database) {
  // Seed Markets
  const checkMarket = db.prepare('SELECT COUNT(*) as count FROM markets').get() as { count: number };
  if (checkMarket.count === 0) {
    const insertMarket = db.prepare(`
      INSERT INTO markets (id, name, symbol, profile, base_price, current_price, volatility, status, category, change_24h, updated_at)
      VALUES (@id, @name, @symbol, @profile, @base_price, @current_price, @volatility, @status, @category, @change_24h, @updated_at)
    `);

    for (const m of INITIAL_MARKETS) {
      insertMarket.run(m);
    }
  }

  // Seed Achievements
  const checkAch = db.prepare('SELECT COUNT(*) as count FROM achievements').get() as { count: number };
  if (checkAch.count === 0) {
    const insertAch = db.prepare(`
      INSERT INTO achievements (id, code, title, description, xp_reward, coin_reward, icon, requirement_type, requirement_value)
      VALUES (@id, @code, @title, @description, @xp_reward, @coin_reward, @icon, @requirement_type, @requirement_value)
    `);

    for (const a of INITIAL_ACHIEVEMENTS) {
      insertAch.run(a);
    }
  }

  // Seed Sports
  const checkSports = db.prepare('SELECT COUNT(*) as count FROM sports_events').get() as { count: number };
  if (checkSports.count === 0) {
    const insertSport = db.prepare(`
      INSERT INTO sports_events (id, category, title, team_a, team_b, status, start_time, closing_time, team_a_multiplier, team_b_multiplier, draw_multiplier, total_participants, winning_option)
      VALUES (@id, @category, @title, @team_a, @team_b, @status, @start_time, @closing_time, @team_a_multiplier, @team_b_multiplier, @draw_multiplier, @total_participants, @winning_option)
    `);

    for (const s of INITIAL_SPORTS_EVENTS) {
      insertSport.run({
        ...s,
        draw_multiplier: s.draw_multiplier || null,
        winning_option: s.winning_option || null,
      });
    }
  }

  // Seed Seed/Demo Users
  const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (checkUsers.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('demo1234', salt);

    const demoUsers = [
      {
        id: 'usr-admin-01',
        username: 'Admin',
        email: 'admin@predictionarena.game',
        password_hash: passwordHash,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        xp: 12500,
        level: 8,
        rating: 2840,
        current_streak: 7,
        best_streak: 15,
        total_predictions: 420,
        total_wins: 295,
        daily_streak: 14,
        role: 'admin',
        balance: 75000,
      },
      {
        id: 'usr-alex-pro',
        username: 'Alex_Quant',
        email: 'alex@predictionarena.game',
        password_hash: passwordHash,
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        xp: 8400,
        level: 7,
        rating: 2615,
        current_streak: 4,
        best_streak: 12,
        total_predictions: 310,
        total_wins: 215,
        daily_streak: 9,
        role: 'user',
        balance: 48500,
      },
      {
        id: 'usr-elena-wave',
        username: 'Elena_Alpha',
        email: 'elena@predictionarena.game',
        password_hash: passwordHash,
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        xp: 6200,
        level: 7,
        rating: 2480,
        current_streak: 6,
        best_streak: 10,
        total_predictions: 245,
        total_wins: 168,
        daily_streak: 7,
        role: 'user',
        balance: 34200,
      },
      {
        id: 'usr-cyber-bull',
        username: 'CyberBull_99',
        email: 'cyber@predictionarena.game',
        password_hash: passwordHash,
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        xp: 4100,
        level: 6,
        rating: 2310,
        current_streak: 2,
        best_streak: 8,
        total_predictions: 190,
        total_wins: 122,
        daily_streak: 5,
        role: 'user',
        balance: 22800,
      },
      {
        id: 'usr-sarah-m',
        username: 'Sarah_Signals',
        email: 'sarah@predictionarena.game',
        password_hash: passwordHash,
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
        xp: 2600,
        level: 5,
        rating: 2150,
        current_streak: 3,
        best_streak: 7,
        total_predictions: 110,
        total_wins: 72,
        daily_streak: 4,
        role: 'user',
        balance: 16400,
      },
      {
        id: 'usr-rookie-leo',
        username: 'Leo_Apex',
        email: 'leo@predictionarena.game',
        password_hash: passwordHash,
        avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        xp: 950,
        level: 3,
        rating: 1890,
        current_streak: 1,
        best_streak: 4,
        total_predictions: 45,
        total_wins: 28,
        daily_streak: 2,
        role: 'user',
        balance: 12100,
      }
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (id, username, email, password_hash, avatar_url, xp, level, rating, current_streak, best_streak, total_predictions, total_wins, daily_streak, role, is_banned, created_at)
      VALUES (@id, @username, @email, @password_hash, @avatar_url, @xp, @level, @rating, @current_streak, @best_streak, @total_predictions, @total_wins, @daily_streak, @role, 0, @created_at)
    `);

    const insertWallet = db.prepare(`
      INSERT INTO wallets (id, user_id, balance, lifetime_earned, lifetime_spent, updated_at)
      VALUES (@id, @user_id, @balance, @lifetime_earned, 0, @updated_at)
    `);

    const insertTx = db.prepare(`
      INSERT INTO wallet_transactions (id, user_id, type, amount, balance_before, balance_after, idempotency_key, metadata, created_at)
      VALUES (@id, @user_id, 'STARTING_GRANT', @amount, 0, @balance_after, @idempotency_key, @metadata, @created_at)
    `);

    const now = new Date().toISOString();

    for (const u of demoUsers) {
      insertUser.run({
        id: u.id,
        username: u.username,
        email: u.email,
        password_hash: u.password_hash,
        avatar_url: u.avatar_url,
        xp: u.xp,
        level: u.level,
        rating: u.rating,
        current_streak: u.current_streak,
        best_streak: u.best_streak,
        total_predictions: u.total_predictions,
        total_wins: u.total_wins,
        daily_streak: u.daily_streak,
        role: u.role,
        created_at: now,
      });

      insertWallet.run({
        id: `wal-${u.id}`,
        user_id: u.id,
        balance: u.balance,
        lifetime_earned: u.balance,
        updated_at: now,
      });

      insertTx.run({
        id: `tx-init-${u.id}`,
        user_id: u.id,
        amount: u.balance,
        balance_after: u.balance,
        idempotency_key: `init-grant-${u.id}`,
        metadata: JSON.stringify({ reason: 'Initial Demo Seed Grant' }),
        created_at: now,
      });
    }

    // Seed some friendship relationships
    const insertFriend = db.prepare(`
      INSERT OR IGNORE INTO friendships (id, user_id, friend_id, status, created_at)
      VALUES (?, ?, ?, 'ACCEPTED', ?)
    `);
    insertFriend.run('fr-1', 'usr-admin-01', 'usr-alex-pro', now);
    insertFriend.run('fr-2', 'usr-alex-pro', 'usr-admin-01', now);
    insertFriend.run('fr-3', 'usr-admin-01', 'usr-elena-wave', now);
    insertFriend.run('fr-4', 'usr-elena-wave', 'usr-admin-01', now);
  }
}

export const db = getDatabase();
