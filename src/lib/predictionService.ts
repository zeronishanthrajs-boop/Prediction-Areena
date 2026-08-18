import { db } from './db';
import { Prediction, PredictionDirection, PredictionResult, RoundOutcome } from './types';
import { WalletService } from './walletService';
import { getRankByXp } from './constants';
import crypto from 'crypto';

export class PredictionService {
  /**
   * Submit a new 30-second market prediction
   */
  static placePrediction(params: {
    userId: string;
    marketId: string;
    direction: PredictionDirection;
    stake: number;
    idempotencyKey?: string;
  }): { success: boolean; prediction?: Prediction; error?: string } {
    const { userId, marketId, direction, stake, idempotencyKey } = params;

    if (stake < 50) {
      return { success: false, error: 'Minimum stake is 50 Practice Coins' };
    }

    // 1. Fetch active round for market
    const round = db.prepare(`
      SELECT * FROM market_rounds 
      WHERE market_id = ? AND status = 'OPEN' 
      ORDER BY start_time DESC LIMIT 1
    `).get(marketId) as {
      id: string;
      start_price: number;
      lock_time: number;
      status: string;
    } | undefined;

    if (!round) {
      return { success: false, error: 'No open round available. Please wait for next round.' };
    }

    const now = Date.now();
    if (now >= round.lock_time) {
      return { success: false, error: 'Round is locked. Prediction window closed for this round.' };
    }

    // 2. Fetch current market price
    const market = db.prepare('SELECT current_price FROM markets WHERE id = ?').get(marketId) as { current_price: number } | undefined;
    const entryPrice = market?.current_price || round.start_price;

    // 3. Atomically debit stake from wallet
    const debitResult = WalletService.mutateBalance({
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

    db.prepare(`
      INSERT INTO predictions (id, user_id, market_id, round_id, direction, stake, entry_price, result, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(predictionId, userId, marketId, round.id, direction, stake, entryPrice, createdAt);

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
  static resolveRound(roundId: string, startPrice: number, endPrice: number, outcome: RoundOutcome) {
    const pendingPredictions = db.prepare(`
      SELECT * FROM predictions WHERE round_id = ? AND result = 'PENDING'
    `).all(roundId) as Prediction[];

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

      // Execute in atomic transaction
      const tx = db.transaction(() => {
        // 1. Credit winnings if any
        if (payout > 0) {
          WalletService.mutateBalance({
            userId: pred.user_id,
            amount: payout,
            type: result === 'WIN' ? 'PREDICTION_WIN' : 'PREDICTION_REFUND',
            idempotencyKey: `payout-${pred.id}`,
            metadata: { predictionId: pred.id, roundId, outcome, startPrice, endPrice },
          });
        }

        // 2. Fetch user stats
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(pred.user_id) as {
          xp: number;
          level: number;
          rating: number;
          current_streak: number;
          best_streak: number;
          total_predictions: number;
          total_wins: number;
        } | undefined;

        if (user) {
          const newXp = user.xp + xpAward;
          const { level: newLevel } = getRankByXp(newXp);
          const newRating = Math.max(100, user.rating + ratingDelta);
          const newTotalPredictions = user.total_predictions + 1;
          const newTotalWins = result === 'WIN' ? user.total_wins + 1 : user.total_wins;
          const newCurrentStreak = result === 'WIN' ? user.current_streak + 1 : 0;
          const newBestStreak = Math.max(user.best_streak, newCurrentStreak);

          db.prepare(`
            UPDATE users 
            SET xp = ?, level = ?, rating = ?, total_predictions = ?, total_wins = ?, current_streak = ?, best_streak = ?
            WHERE id = ?
          `).run(newXp, newLevel, newRating, newTotalPredictions, newTotalWins, newCurrentStreak, newBestStreak, pred.user_id);

          // Check achievements
          this.checkAchievements(pred.user_id, {
            totalPredictions: newTotalPredictions,
            currentStreak: newCurrentStreak,
            totalWins: newTotalWins,
          });
        }

        // 3. Update prediction status
        db.prepare(`
          UPDATE predictions 
          SET exit_price = ?, payout = ?, xp_awarded = ?, rating_delta = ?, result = ?
          WHERE id = ?
        `).run(endPrice, payout, xpAward, ratingDelta, result, pred.id);
      });

      try {
        tx();
      } catch (err) {
        console.error(`Failed to resolve prediction ${pred.id}:`, err);
      }
    }
  }

  /**
   * Check and unlock achievements
   */
  private static checkAchievements(userId: string, stats: { totalPredictions: number; currentStreak: number; totalWins: number }) {
    const accuracy = stats.totalPredictions > 0 ? (stats.totalWins / stats.totalPredictions) * 100 : 0;

    // 1. FIRST_CALL
    if (stats.totalPredictions >= 1) {
      this.unlockAchievement(userId, 'FIRST_CALL');
    }

    // 2. HOT_STREAK
    if (stats.currentStreak >= 5) {
      this.unlockAchievement(userId, 'HOT_STREAK');
    }

    // 3. MARKET_READER (at least 10 predictions and >= 65% accuracy)
    if (stats.totalPredictions >= 10 && accuracy >= 65) {
      this.unlockAchievement(userId, 'MARKET_READER');
    }

    // 4. CENTURION
    if (stats.totalPredictions >= 100) {
      this.unlockAchievement(userId, 'CENTURION');
    }
  }

  private static unlockAchievement(userId: string, code: string) {
    const ach = db.prepare('SELECT * FROM achievements WHERE code = ?').get(code) as {
      id: string;
      xp_reward: number;
      coin_reward: number;
    } | undefined;

    if (!ach) return;

    const existing = db.prepare('SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?').get(userId, ach.id);
    if (existing) return; // already unlocked

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at)
      VALUES (?, ?, ?, ?)
    `).run(`uach-${crypto.randomUUID()}`, userId, ach.id, now);

    // Grant bonus coins and XP
    WalletService.mutateBalance({
      userId,
      amount: ach.coin_reward,
      type: 'QUEST_REWARD',
      metadata: { achievementCode: code },
    });

    db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(ach.xp_reward, userId);
  }

  /**
   * Get user's recent predictions
   */
  static getUserPredictions(userId: string, limit = 30): Prediction[] {
    return db.prepare(`
      SELECT p.*, m.name as market_name, m.symbol as market_symbol
      FROM predictions p
      JOIN markets m ON p.market_id = m.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(userId, limit) as Prediction[];
  }
}
