import { createClient, type Client, type ResultSet, type InArgs } from '@libsql/client';
import { INITIAL_MARKETS, INITIAL_ACHIEVEMENTS, INITIAL_SPORTS_EVENTS } from './constants';
import bcrypt from 'bcryptjs';

// Global singleton client to survive Next.js hot-reloading
declare global {
  // eslint-disable-next-line no-var
  var __libsqlClient: Client | undefined;
  // eslint-disable-next-line no-var
  var __dbInitPromise: Promise<void> | undefined;
}

export function getDb(): Client {
  if (global.__libsqlClient) {
    return global.__libsqlClient;
  }

  const url = process.env.TURSO_DATABASE_URL || 
    (process.env.DB_PATH ? `file:${process.env.DB_PATH}` : 
    (process.env.VERCEL ? 'file:/tmp/prediction_arena.db' : 'file:prediction_arena.db'));

  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  global.__libsqlClient = client;
  return client;
}

// Helpers for extracting objects from ResultSet
export function rowsToObjects<T = Record<string, unknown>>(result: ResultSet): T[] {
  if (!result || !result.rows) return [];
  return result.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    result.columns.forEach((col, idx) => {
      const val = (row as Record<string, unknown>)[col] !== undefined 
        ? (row as Record<string, unknown>)[col] 
        : (row as unknown as Record<number, unknown>)[idx];
      obj[col] = val;
    });
    return obj as T;
  });
}

export function firstRow<T = Record<string, unknown>>(result: ResultSet): T | null {
  if (!result || !result.rows || result.rows.length === 0) return null;
  const row = result.rows[0];
  const obj: Record<string, unknown> = {};
  result.columns.forEach((col, idx) => {
    const val = (row as Record<string, unknown>)[col] !== undefined 
      ? (row as Record<string, unknown>)[col] 
      : (row as unknown as Record<number, unknown>)[idx];
    obj[col] = val;
  });
  return obj as T;
}

export async function query<T = Record<string, unknown>>(sql: string, args: InArgs = []): Promise<T[]> {
  const db = getDb();
  await ensureDbInitialized();
  const res = await db.execute({ sql, args });
  return rowsToObjects<T>(res);
}

export async function queryOne<T = Record<string, unknown>>(sql: string, args: InArgs = []): Promise<T | null> {
  const db = getDb();
  await ensureDbInitialized();
  const res = await db.execute({ sql, args });
  return firstRow<T>(res);
}

export async function execute(sql: string, args: InArgs = []): Promise<ResultSet> {
  const db = getDb();
  await ensureDbInitialized();
  return await db.execute({ sql, args });
}

export async function ensureDbInitialized(): Promise<void> {
  if (global.__dbInitPromise) {
    return global.__dbInitPromise;
  }

  global.__dbInitPromise = (async () => {
    const db = getDb();
    await initSchema(db);
    await seedInitialData(db);
  })();

  return global.__dbInitPromise;
}

async function initSchema(db: Client) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
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
    )`,
    `CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      balance INTEGER DEFAULT 10000,
      lifetime_earned INTEGER DEFAULT 10000,
      lifetime_spent INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS wallet_transactions (
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
    )`,
    `CREATE TABLE IF NOT EXISTS markets (
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
    )`,
    `CREATE TABLE IF NOT EXISTS market_rounds (
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
    )`,
    `CREATE TABLE IF NOT EXISTS predictions (
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
    )`,
    `CREATE TABLE IF NOT EXISTS sports_events (
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
    )`,
    `CREATE TABLE IF NOT EXISTS sports_predictions (
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
    )`,
    `CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      friend_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(friend_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, friend_id)
    )`,
    `CREATE TABLE IF NOT EXISTS challenges (
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
    )`,
    `CREATE TABLE IF NOT EXISTS private_rooms (
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
    )`,
    `CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      xp_reward INTEGER NOT NULL,
      coin_reward INTEGER NOT NULL,
      icon TEXT NOT NULL,
      requirement_type TEXT NOT NULL,
      requirement_value INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
      UNIQUE(user_id, achievement_id)
    )`,
    `CREATE TABLE IF NOT EXISTS ad_intents (
      nonce TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      reward_type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT DEFAULT 'PENDING',
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_predictions_round ON predictions(round_id)`,
    `CREATE INDEX IF NOT EXISTS idx_rounds_market ON market_rounds(market_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_user ON wallet_transactions(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating)`
  ];

  for (const sql of tables) {
    try {
      await db.execute(sql);
    } catch (e) {
      console.warn('Schema statement warning:', e);
    }
  }
}

async function seedInitialData(db: Client) {
  // Seed Markets
  const checkMarket = await db.execute('SELECT COUNT(*) as count FROM markets');
  const marketCount = Number(firstRow(checkMarket)?.count || 0);
  if (marketCount === 0) {
    for (const m of INITIAL_MARKETS) {
      await db.execute({
        sql: `INSERT INTO markets (id, name, symbol, profile, base_price, current_price, volatility, status, category, change_24h, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [m.id, m.name, m.symbol, m.profile, m.base_price, m.current_price, m.volatility, m.status, m.category, m.change_24h, m.updated_at],
      });
    }
  }

  // Seed Achievements
  const checkAch = await db.execute('SELECT COUNT(*) as count FROM achievements');
  const achCount = Number(firstRow(checkAch)?.count || 0);
  if (achCount === 0) {
    for (const a of INITIAL_ACHIEVEMENTS) {
      await db.execute({
        sql: `INSERT INTO achievements (id, code, title, description, xp_reward, coin_reward, icon, requirement_type, requirement_value)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [a.id, a.code, a.title, a.description, a.xp_reward, a.coin_reward, a.icon, a.requirement_type, a.requirement_value],
      });
    }
  }

  // Seed Sports
  const checkSports = await db.execute('SELECT COUNT(*) as count FROM sports_events');
  const sportsCount = Number(firstRow(checkSports)?.count || 0);
  if (sportsCount === 0) {
    for (const s of INITIAL_SPORTS_EVENTS) {
      await db.execute({
        sql: `INSERT INTO sports_events (id, category, title, team_a, team_b, status, start_time, closing_time, team_a_multiplier, team_b_multiplier, draw_multiplier, total_participants, winning_option)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          s.id,
          s.category,
          s.title,
          s.team_a,
          s.team_b,
          s.status,
          s.start_time,
          s.closing_time,
          s.team_a_multiplier,
          s.team_b_multiplier,
          s.draw_multiplier || null,
          s.total_participants || 0,
          s.winning_option || null,
        ],
      });
    }
  }

  // Seed Demo Users
  const checkUsers = await db.execute('SELECT COUNT(*) as count FROM users');
  const usersCount = Number(firstRow(checkUsers)?.count || 0);
  if (usersCount === 0) {
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
      },
    ];

    const now = new Date().toISOString();

    for (const u of demoUsers) {
      await db.execute({
        sql: `INSERT INTO users (id, username, email, password_hash, avatar_url, xp, level, rating, current_streak, best_streak, total_predictions, total_wins, daily_streak, role, is_banned, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        args: [u.id, u.username, u.email, u.password_hash, u.avatar_url, u.xp, u.level, u.rating, u.current_streak, u.best_streak, u.total_predictions, u.total_wins, u.daily_streak, u.role, now],
      });

      await db.execute({
        sql: `INSERT INTO wallets (id, user_id, balance, lifetime_earned, lifetime_spent, updated_at)
              VALUES (?, ?, ?, ?, 0, ?)`,
        args: [`wal-${u.id}`, u.id, u.balance, u.balance, now],
      });

      await db.execute({
        sql: `INSERT INTO wallet_transactions (id, user_id, type, amount, balance_before, balance_after, idempotency_key, metadata, created_at)
              VALUES (?, ?, 'STARTING_GRANT', ?, 0, ?, ?, ?, ?)`,
        args: [`tx-init-${u.id}`, u.id, u.balance, u.balance, `init-grant-${u.id}`, JSON.stringify({ reason: 'Initial Demo Seed Grant' }), now],
      });
    }

    // Seed friendships
    const friendships = [
      ['fr-1', 'usr-admin-01', 'usr-alex-pro'],
      ['fr-2', 'usr-alex-pro', 'usr-admin-01'],
      ['fr-3', 'usr-admin-01', 'usr-elena-wave'],
      ['fr-4', 'usr-elena-wave', 'usr-admin-01'],
    ];

    for (const [id, uid, fid] of friendships) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO friendships (id, user_id, friend_id, status, created_at) VALUES (?, ?, ?, 'ACCEPTED', ?)`,
        args: [id, uid, fid, now],
      });
    }
  }
}
