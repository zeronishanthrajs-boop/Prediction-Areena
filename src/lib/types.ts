export type Role = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash?: string;
  avatar_url: string;
  xp: number;
  level: number;
  rating: number; // Elo-style prediction rating
  current_streak: number;
  best_streak: number;
  total_predictions: number;
  total_wins: number;
  last_daily_claim_at: string | null;
  daily_streak: number;
  role: Role;
  is_banned: number;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number; // Strictly Practice Coins
  lifetime_earned: number;
  lifetime_spent: number;
  updated_at: string;
}

export type TransactionType =
  | 'STARTING_GRANT'
  | 'DAILY_REWARD'
  | 'REWARDED_AD'
  | 'PREDICTION_STAKE'
  | 'PREDICTION_WIN'
  | 'PREDICTION_REFUND'
  | 'REFILL'
  | 'CHALLENGE_REWARD'
  | 'QUEST_REWARD'
  | 'ADMIN_ADJUSTMENT';

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  idempotency_key?: string;
  metadata?: string;
  created_at: string;
}

export type MarketProfile = 'STABLE' | 'VOLATILE' | 'MOMENTUM' | 'REVERSAL' | 'CHAOS';

export interface Market {
  id: string;
  name: string;
  symbol: string;
  profile: MarketProfile;
  base_price: number;
  current_price: number;
  volatility: number;
  status: 'ACTIVE' | 'PAUSED';
  category: 'INDEX' | 'CRYPTO' | 'TECH' | 'FX';
  change_24h: number;
  updated_at: string;
}

export type RoundStatus = 'OPEN' | 'LOCKED' | 'RESOLVING' | 'RESOLVED';
export type RoundOutcome = 'UP' | 'DOWN' | 'FLAT';

export interface MarketRound {
  id: string;
  market_id: string;
  round_number: number;
  start_time: number; // Epoch ms
  lock_time: number;  // Epoch ms (e.g. start + 25s)
  end_time: number;   // Epoch ms (e.g. start + 30s)
  start_price: number;
  lock_price: number | null;
  end_price: number | null;
  status: RoundStatus;
  outcome: RoundOutcome | null;
  up_pool?: number;
  down_pool?: number;
}

export interface MarketTick {
  market_id: string;
  price: number;
  change: number;
  timestamp: number;
}

export type PredictionDirection = 'UP' | 'DOWN';
export type PredictionResult = 'PENDING' | 'WIN' | 'LOSS' | 'DRAW';

export interface Prediction {
  id: string;
  user_id: string;
  market_id: string;
  round_id: string;
  direction: PredictionDirection;
  stake: number;
  entry_price: number;
  exit_price?: number | null;
  payout?: number;
  xp_awarded?: number;
  rating_delta?: number;
  result: PredictionResult;
  created_at: string;
  username?: string;
  avatar_url?: string;
}

export interface SportsEvent {
  id: string;
  category: 'CRICKET' | 'FOOTBALL' | 'BASKETBALL' | 'TENNIS' | 'ESPORTS';
  title: string;
  team_a: string;
  team_b: string;
  team_a_logo?: string;
  team_b_logo?: string;
  status: 'UPCOMING' | 'LIVE' | 'RESOLVED';
  start_time: string;
  closing_time: string;
  team_a_multiplier: number;
  team_b_multiplier: number;
  draw_multiplier?: number;
  total_participants: number;
  winning_option?: string | null;
}

export interface SportsPrediction {
  id: string;
  user_id: string;
  event_id: string;
  selected_option: string;
  stake: number;
  multiplier: number;
  payout?: number;
  result: PredictionResult;
  created_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  created_at: string;
  friend_username?: string;
  friend_avatar?: string;
  friend_rating?: number;
  friend_level?: number;
}

export interface Challenge {
  id: string;
  creator_id: string;
  opponent_id: string;
  market_id: string;
  rounds_total: number;
  rounds_completed: number;
  creator_wins: number;
  opponent_wins: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DECLINED';
  winner_id?: string | null;
  created_at: string;
  creator_username?: string;
  creator_avatar?: string;
  opponent_username?: string;
  opponent_avatar?: string;
}

export interface PrivateRoom {
  id: string;
  room_code: string;
  name: string;
  creator_id: string;
  market_id: string;
  rounds: number;
  round_duration: number; // in seconds
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  participants_count: number;
  created_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  xp_reward: number;
  coin_reward: number;
  icon: string;
  requirement_type: 'PREDICTIONS_COUNT' | 'STREAK' | 'ACCURACY' | 'CHALLENGES_WON' | 'COINS_EARNED';
  requirement_value: number;
  unlocked_at?: string | null;
  progress?: number;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  xp_reward: number;
  coin_reward: number;
  icon: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url: string;
  rating: number;
  accuracy: number;
  streak: number;
  total_predictions: number;
  rank_change: number; // e.g. +3, -1, 0
  is_current_user?: boolean;
}
