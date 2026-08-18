import { Market, Achievement, DailyQuest, SportsEvent } from './types';

export const INITIAL_MARKETS: Market[] = [
  {
    id: 'ai-index',
    name: 'AI Neural 100',
    symbol: 'AINX',
    profile: 'MOMENTUM',
    base_price: 10428.50,
    current_price: 10428.50,
    volatility: 0.0035,
    status: 'ACTIVE',
    category: 'INDEX',
    change_24h: 3.42,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cyber-pulse',
    name: 'Cyber Pulse 50',
    symbol: 'CYBR',
    profile: 'VOLATILE',
    base_price: 68420.00,
    current_price: 68420.00,
    volatility: 0.0065,
    status: 'ACTIVE',
    category: 'CRYPTO',
    change_24h: -1.85,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'quantum-tech',
    name: 'Quantum Tech Titan',
    symbol: 'QTTN',
    profile: 'STABLE',
    base_price: 4950.25,
    current_price: 4950.25,
    volatility: 0.0018,
    status: 'ACTIVE',
    category: 'TECH',
    change_24h: 1.12,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fx-synth',
    name: 'Global FX Synth',
    symbol: 'GFXS',
    profile: 'REVERSAL',
    base_price: 142.85,
    current_price: 142.85,
    volatility: 0.0022,
    status: 'ACTIVE',
    category: 'FX',
    change_24h: 0.45,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'apex-chaos',
    name: 'Apex Hyper Drift',
    symbol: 'APEX',
    profile: 'CHAOS',
    base_price: 2580.00,
    current_price: 2580.00,
    volatility: 0.0090,
    status: 'ACTIVE',
    category: 'INDEX',
    change_24h: 5.68,
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_ACHIEVEMENTS: Omit<Achievement, 'unlocked_at' | 'progress'>[] = [
  {
    id: 'ach-first-call',
    code: 'FIRST_CALL',
    title: 'First Call',
    description: 'Lock in your very first market prediction',
    xp_reward: 100,
    coin_reward: 500,
    icon: 'Target',
    requirement_type: 'PREDICTIONS_COUNT',
    requirement_value: 1,
  },
  {
    id: 'ach-hot-streak',
    code: 'HOT_STREAK',
    title: 'Hot Streak',
    description: 'Win 5 consecutive predictions in a row',
    xp_reward: 350,
    coin_reward: 2000,
    icon: 'Flame',
    requirement_type: 'STREAK',
    requirement_value: 5,
  },
  {
    id: 'ach-market-reader',
    code: 'MARKET_READER',
    title: 'Market Reader',
    description: 'Reach a 65% win accuracy across at least 10 predictions',
    xp_reward: 500,
    coin_reward: 3000,
    icon: 'TrendingUp',
    requirement_type: 'ACCURACY',
    requirement_value: 65,
  },
  {
    id: 'ach-centurion',
    code: 'CENTURION',
    title: 'Centurion',
    description: 'Complete 100 total predictions',
    xp_reward: 1000,
    coin_reward: 5000,
    icon: 'Award',
    requirement_type: 'PREDICTIONS_COUNT',
    requirement_value: 100,
  },
  {
    id: 'ach-grandmaster',
    code: 'GRANDMASTER',
    title: 'Social Champion',
    description: 'Win 5 Head-to-Head friend challenges',
    xp_reward: 750,
    coin_reward: 3500,
    icon: 'Crown',
    requirement_type: 'CHALLENGES_WON',
    requirement_value: 5,
  },
  {
    id: 'ach-vault-master',
    code: 'VAULT_MASTER',
    title: 'Vault Master',
    description: 'Accumulate over 50,000 Practice Coins earned lifetime',
    xp_reward: 1200,
    coin_reward: 10000,
    icon: 'Coins',
    requirement_type: 'COINS_EARNED',
    requirement_value: 50000,
  },
];

export const INITIAL_SPORTS_EVENTS: SportsEvent[] = [
  {
    id: 'sport-cricket-ind-aus',
    category: 'CRICKET',
    title: 'T20 Championship Semi-Final',
    team_a: 'India',
    team_b: 'Australia',
    status: 'LIVE',
    start_time: new Date(Date.now() - 3600000).toISOString(),
    closing_time: new Date(Date.now() + 7200000).toISOString(),
    team_a_multiplier: 1.75,
    team_b_multiplier: 2.10,
    total_participants: 1420,
  },
  {
    id: 'sport-football-rma-mci',
    category: 'FOOTBALL',
    title: 'European Champions League Final',
    team_a: 'Real Madrid',
    team_b: 'Manchester City',
    status: 'LIVE',
    start_time: new Date(Date.now() - 1800000).toISOString(),
    closing_time: new Date(Date.now() + 5400000).toISOString(),
    team_a_multiplier: 2.20,
    team_b_multiplier: 1.80,
    draw_multiplier: 3.40,
    total_participants: 2890,
  },
  {
    id: 'sport-nba-bos-lal',
    category: 'BASKETBALL',
    title: 'Pro Basketball Showcase',
    team_a: 'Boston Celtics',
    team_b: 'LA Lakers',
    status: 'UPCOMING',
    start_time: new Date(Date.now() + 14400000).toISOString(),
    closing_time: new Date(Date.now() + 14300000).toISOString(),
    team_a_multiplier: 1.65,
    team_b_multiplier: 2.30,
    total_participants: 845,
  },
  {
    id: 'sport-tennis-alc-sin',
    category: 'TENNIS',
    title: 'Grand Slam Men\'s Final',
    team_a: 'Carlos Alcaraz',
    team_b: 'Jannik Sinner',
    status: 'UPCOMING',
    start_time: new Date(Date.now() + 28800000).toISOString(),
    closing_time: new Date(Date.now() + 28700000).toISOString(),
    team_a_multiplier: 1.90,
    team_b_multiplier: 1.90,
    total_participants: 1120,
  },
  {
    id: 'sport-esports-t1-gen',
    category: 'ESPORTS',
    title: 'Worlds League Grand Finals',
    team_a: 'T1 Telecom',
    team_b: 'Gen.G Esports',
    status: 'LIVE',
    start_time: new Date(Date.now() - 900000).toISOString(),
    closing_time: new Date(Date.now() + 4500000).toISOString(),
    team_a_multiplier: 1.85,
    team_b_multiplier: 1.95,
    total_participants: 3640,
  },
];

export const DAILY_REWARDS_SCHEDULE = [
  { day: 1, reward: 1000 },
  { day: 2, reward: 1250 },
  { day: 3, reward: 1500 },
  { day: 4, reward: 2000 },
  { day: 5, reward: 2500 },
  { day: 6, reward: 3000 },
  { day: 7, reward: 5000 },
];

export const RANKS = [
  { level: 1, name: 'Rookie Predictor', minXp: 0, icon: 'ShieldAlert' },
  { level: 2, name: 'Junior Analyst', minXp: 200, icon: 'Compass' },
  { level: 3, name: 'Market Predictor', minXp: 600, icon: 'Activity' },
  { level: 4, name: 'Tactical Strategist', minXp: 1200, icon: 'Cpu' },
  { level: 5, name: 'Arena Specialist', minXp: 2200, icon: 'Zap' },
  { level: 6, name: 'Elite Expert', minXp: 3800, icon: 'Target' },
  { level: 7, name: 'Grandmaster', minXp: 6000, icon: 'Award' },
  { level: 8, name: 'Apex Legend', minXp: 10000, icon: 'Crown' },
];

export function getRankByXp(xp: number) {
  let currentRank = RANKS[0];
  let nextRank = RANKS[1];

  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].minXp) {
      currentRank = RANKS[i];
      nextRank = RANKS[i + 1] || null;
    } else {
      break;
    }
  }

  const currentLevelMin = currentRank.minXp;
  const nextLevelMin = nextRank ? nextRank.minXp : currentRank.minXp * 1.5;
  const xpInCurrentLevel = xp - currentLevelMin;
  const xpNeededForNextLevel = nextLevelMin - currentLevelMin;
  const progressPercent = nextRank ? Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100)) : 100;

  return {
    rank: currentRank,
    nextRank,
    level: currentRank.level,
    progressPercent: Math.round(progressPercent),
    xpToNext: nextRank ? nextLevelMin - xp : 0,
  };
}
