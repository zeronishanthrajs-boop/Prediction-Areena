import { query, queryOne, execute, getDb, ensureDbInitialized } from './db';
import { Prediction, PredictionDirection, PredictionResult, RoundOutcome } from './types';
import { WalletService } from './walletService';
import { getRankByXp } from './constants';
import crypto from 'crypto';

export class PredictionService {
  /**
   * Submit a new 30-second market prediction
   */
  static async placePrediction(params: {
    userId: string;
    marketId: string;
    direction: PredictionDirection;
    stake: number;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; prediction?: Prediction; error?: string }> {
    const { userId, marketId, direction, stake, idempotencyKey } = params;

    if (stake < 50) {
      return { success: false, error: 'Minimum stake is 50 Practice Coins' };
    }

    // 1. Fetch active round for market
    const round = await queryOne<{
      id: string;
      start_price: number;
      lock_time: number;
      status: string;
    }>(`
      SELECT id, start_price, lock_time, status FROM market_rounds 
      WHERE market_id = ? AND status = 'OPEN' 
      ORDER BY start_time DESC LIMIT 1
    `, [marketId]);

    if (!round) {
      return { success: false, error: 'No open round available. Please wait for next round.' };
    }

    const now = Date.now();
    if (now >= round.lock_time) {
      return { success: false, error: 'Round is locked. Prediction window closed for this round.' };
    }

    // 2. Fetch current market price
    const market = await queryOne<{ current_price: number }>('SELECT current_price FROM markets WHERE id = ?', [marketId]);
    const entryPrice = market?.current_price || round.start_price;

    // 3. Atomically debit stake from wallet
    const debitResult = await WalletService.mutateBalance({
      userId,
      amount: -stake,
      type: 'PREDICTION_STAKE',
      idempotencyKey,
      metadata: { marketId, roundId: round.id, direction, entryPrice },
    });

    if (!debitResult.success) {
      return { success: false, error: debitResult.error || 'Failed to debit stake' };
    }

    // 4. Create prediction record
    const predictionId = `pred-${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();

    await execute(`
      INSERT INTO predictions (id, user_id, market_id, round_id, direction, stake, entry_price, result, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `, [predictionId, userId, marketId, round.id, direction, stake, entryPrice, createdAt]);

    const prediction: Prediction = {
      id: predictionId,
      user_id: userId,
      market_id: marketId,
      round_id: round.id,
      direction,
      stake,
      entry_price: entryPrice,
      result: 'PENDING',
      created_at: createdAt,
    };

    return { success: true, prediction };
  }

  /**
   * Resolve all predictions for a completed round
   */
  static async resolveRound(roundId: string, startPrice: number, endPrice: number, outcome: RoundOutcome) {
    const pendingPredictions = await query<Prediction>(`
      SELECT * FROM predictions WHERE round_id = ? AND result = 'PENDING'
    `, [roundId]);

    for (const pred of pendingPredictions) {
      const isWin = (pred.direction === 'UP' && outcome === 'UP') || (pred.direction === 'DOWN' && outcome === 'DOWN');
      const isDraw = outcome === 'FLAT';

      let result: PredictionResult = 'LOSS';
      let payout = 0;
      let xpAward = 15; // Participation base XP
      let ratingDelta = -10;

      if (isWin) {
        result = 'WIN';
        payout = Math.floor(pred.stake * 1.90);
        xpAward = 40;
        ratingDelta = 16;
      } else if (isDraw) {
        result = 'DRAW';
        payout = pred.stake;
        xpAward = 20;
        ratingDelta = 0;
      }

      try {
        await ensureDbInitialized();
        const db = getDb();

        // 1. Credit winnings if any
        if (payout > 0) {
          await WalletService.mutateBalance({
            userId: pred.user_id,
            amount: payout,
            type: result === 'WIN' ? 'PREDICTION_WIN' : 'PREDICTION_REFUND',
            idempotencyKey: `payout-${pred.id}`,
            metadata: { predictionId: pred.id, roundId, outcome, startPrice, endPrice },
          });
        }

        // 2. Fetch user stats
        const user = await queryOne<{
          xp: number;
          level: number;
          rating: number;
          current_streak: number;
          best_streak: number;
          total_predictions: number;
          total_wins: number;
        }>('SELECT xp, level, rating, current_streak, best_streak, total_predictions, total_wins FROM users WHERE id = ?', [pred.user_id]);

        if (user) {
          const newXp = user.xp + xpAward;
          const { level: newLevel } = getRankByXp(newXp);
          const newRating = Math.max(100, user.rating + ratingDelta);
          const newTotalPredictions = user.total_predictions + 1;
          const newTotalWins = result === 'WIN' ? user.total_wins + 1 : user.total_wins;
          const newCurrentStreak = result === 'WIN' ? user.current_streak + 1 : 0;
          const newBestStreak = Math.max(user.best_streak, newCurrentStreak);

          await db.batch([
            {
              sql: `UPDATE users 
                    SET xp = ?, level = ?, rating = ?, total_predictions = ?, total_wins = ?, current_streak = ?, best_streak = ?
                    WHERE id = ?`,
              args: [newXp, newLevel, newRating, newTotalPredictions, newTotalWins, newCurrentStreak, newBestStreak, pred.user_id],
            },
            {
              sql: `UPDATE predictions 
                    SET exit_price = ?, payout = ?, xp_awarded = ?, rating_delta = ?, result = ?
                    WHERE id = ?`,
              args: [endPrice, payout, xpAward, ratingDelta, result, pred.id],
            }
          ], 'write');

          // Check achievements
          await this.checkAchievements(pred.user_id, {
            totalPredictions: newTotalPredictions,
            currentStreak: newCurrentStreak,
            totalWins: newTotalWins,
          });
        } else {
          await execute(`
            UPDATE predictions 
            SET exit_price = ?, payout = ?, xp_awarded = ?, rating_delta = ?, result = ?
            WHERE id = ?
          `, [endPrice, payout, xpAward, ratingDelta, result, pred.id]);
        }
      } catch (err) {
        console.error(`Failed to resolve prediction ${pred.id}:`, err);
      }
    }
  }

  /**
   * Check and unlock achievements
   */
  private static async checkAchievements(userId: string, stats: { totalPredictions: number; currentStreak: number; totalWins: number }) {
    const accuracy = stats.totalPredictions > 0 ? (stats.totalWins / stats.totalPredictions) * 100 : 0;

    // 1. FIRST_CALL
    if (stats.totalPredictions >= 1) {
      await this.unlockAchievement(userId, 'FIRST_CALL');
    }

    // 2. HOT_STREAK
    if (stats.currentStreak >= 5) {
      await this.unlockAchievement(userId, 'HOT_STREAK');
    }

    // 3. MARKET_READER (at least 10 predictions and >= 65% accuracy)
    if (stats.totalPredictions >= 10 && accuracy >= 65) {
      await this.unlockAchievement(userId, 'MARKET_READER');
    }

    // 4. CENTURION
    if (stats.totalPredictions >= 100) {
      await this.unlockAchievement(userId, 'CENTURION');
    }
  }

  private static async unlockAchievement(userId: string, code: string) {
    const ach = await queryOne<{
      id: string;
      xp_reward: number;
      coin_reward: number;
    }>('SELECT id, xp_reward, coin_reward FROM achievements WHERE code = ?', [code]);

    if (!ach) return;

    const existing = await queryOne<{ id: string }>('SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?', [userId, ach.id]);
    if (existing) return; // already unlocked

    const now = new Date().toISOString();
    await execute(`
      INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at)
      VALUES (?, ?, ?, ?)
    `, [`uach-${crypto.randomUUID()}`, userId, ach.id, now]);

    // Grant bonus coins and XP
    await WalletService.mutateBalance({
      userId,
      amount: ach.coin_reward,
      type: 'QUEST_REWARD',
      metadata: { achievementCode: code },
    });

    await execute('UPDATE users SET xp = xp + ? WHERE id = ?', [ach.xp_reward, userId]);
  }

  /**
   * Get user's recent predictions
   */
  static async getUserPredictions(userId: string, limit = 30): Promise<Prediction[]> {
    return await query<Prediction>(`
      SELECT p.*, m.name as market_name, m.symbol as market_symbol
      FROM predictions p
      JOIN markets m ON p.market_id = m.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ?
    `, [userId, limit]);
  }
}
