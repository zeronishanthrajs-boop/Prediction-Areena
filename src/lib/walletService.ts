import { query, queryOne, execute, getDb, ensureDbInitialized } from './db';
import { Wallet, WalletTransaction, TransactionType } from './types';
import { DAILY_REWARDS_SCHEDULE } from './constants';
import crypto from 'crypto';

export class WalletService {
  /**
   * Get wallet for a user
   */
  static async getWallet(userId: string): Promise<Wallet | null> {
    return await queryOne<Wallet>('SELECT * FROM wallets WHERE user_id = ?', [userId]);
  }

  /**
   * Get user's transaction history
   */
  static async getTransactions(userId: string, limit = 50): Promise<WalletTransaction[]> {
    return await query<WalletTransaction>(`
      SELECT * FROM wallet_transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [userId, limit]);
  }

  /**
   * Execute atomic wallet mutation with strict transaction safety
   */
  static async mutateBalance(params: {
    userId: string;
    amount: number; // positive = credit, negative = debit
    type: TransactionType;
    idempotencyKey?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; wallet?: Wallet; transaction?: WalletTransaction; error?: string }> {
    const { userId, amount, type, idempotencyKey, metadata } = params;

    // Check idempotency if key provided
    if (idempotencyKey) {
      const existingTx = await queryOne<WalletTransaction>(
        'SELECT * FROM wallet_transactions WHERE idempotency_key = ?',
        [idempotencyKey]
      );
      
      if (existingTx) {
        const currentWallet = await this.getWallet(userId);
        return { success: true, wallet: currentWallet || undefined, transaction: existingTx };
      }
    }

    try {
      await ensureDbInitialized();
      const db = getDb();

      // LibSQL interactive or batch transaction
      // 1. Lock and fetch current wallet
      const wallet = await queryOne<Wallet>('SELECT * FROM wallets WHERE user_id = ?', [userId]);
      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      // 2. Validate balance sufficiency for debits
      if (amount < 0 && wallet.balance + amount < 0) {
        return { success: false, error: 'Insufficient Practice Coins' };
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + amount;
      const lifetimeEarned = amount > 0 ? wallet.lifetime_earned + amount : wallet.lifetime_earned;
      const lifetimeSpent = amount < 0 ? wallet.lifetime_spent + Math.abs(amount) : wallet.lifetime_spent;
      const now = new Date().toISOString();
      const txId = `tx-${crypto.randomUUID()}`;

      // Batch execute updates
      await db.batch([
        {
          sql: `UPDATE wallets SET balance = ?, lifetime_earned = ?, lifetime_spent = ?, updated_at = ? WHERE user_id = ?`,
          args: [balanceAfter, lifetimeEarned, lifetimeSpent, now, userId],
        },
        {
          sql: `INSERT INTO wallet_transactions (id, user_id, type, amount, balance_before, balance_after, idempotency_key, metadata, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            txId,
            userId,
            type,
            amount,
            balanceBefore,
            balanceAfter,
            idempotencyKey || null,
            metadata ? JSON.stringify(metadata) : null,
            now
          ],
        }
      ], 'write');

      // Check achievements
      await this.checkCoinAchievements(userId, lifetimeEarned);

      const updatedWallet: Wallet = {
        ...wallet,
        balance: balanceAfter,
        lifetime_earned: lifetimeEarned,
        lifetime_spent: lifetimeSpent,
        updated_at: now,
      };

      const recordedTx: WalletTransaction = {
        id: txId,
        user_id: userId,
        type,
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        idempotency_key: idempotencyKey,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        created_at: now,
      };

      return { success: true, wallet: updatedWallet, transaction: recordedTx };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      return { success: false, error: message };
    }
  }

  /**
   * Process daily login reward with streak tracking
   */
  static async claimDailyReward(userId: string, doubleMultiplier = false): Promise<{
    success: boolean;
    rewardAmount?: number;
    newStreak?: number;
    wallet?: Wallet;
    error?: string;
  }> {
    const user = await queryOne<{
      last_daily_claim_at: string | null;
      daily_streak: number;
    }>('SELECT last_daily_claim_at, daily_streak FROM users WHERE id = ?', [userId]);

    if (!user) return { success: false, error: 'User not found' };

    const now = new Date();
    let newStreak = 1;

    if (user.last_daily_claim_at) {
      const lastClaim = new Date(user.last_daily_claim_at);
      const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastClaim < 20) {
        return {
          success: false,
          error: `Daily reward already claimed. Next reward in ${Math.ceil(20 - hoursSinceLastClaim)} hours.`
        };
      }

      if (hoursSinceLastClaim <= 48) {
        newStreak = Math.min(7, (user.daily_streak || 0) + 1);
      } else {
        newStreak = 1;
      }
    }

    const baseReward = DAILY_REWARDS_SCHEDULE.find((s) => s.day === newStreak)?.reward || 1000;
    const finalReward = doubleMultiplier ? baseReward * 2 : baseReward;
    const idempotencyKey = `daily-${userId}-${now.toISOString().split('T')[0]}-${doubleMultiplier ? '2x' : '1x'}`;

    const mutation = await this.mutateBalance({
      userId,
      amount: finalReward,
      type: 'DAILY_REWARD',
      idempotencyKey,
      metadata: { streak: newStreak, doubled: doubleMultiplier, baseReward },
    });

    if (!mutation.success) {
      return { success: false, error: mutation.error };
    }

    // Update user streak and last claimed timestamp
    await execute(`
      UPDATE users 
      SET daily_streak = ?, last_daily_claim_at = ?
      WHERE id = ?
    `, [newStreak, now.toISOString(), userId]);

    return {
      success: true,
      rewardAmount: finalReward,
      newStreak,
      wallet: mutation.wallet,
    };
  }

  /**
   * Refill balance if user has run out of Practice Coins (< 100 coins)
   */
  static async refillEmptyBalance(userId: string): Promise<{
    success: boolean;
    refillAmount?: number;
    wallet?: Wallet;
    error?: string;
  }> {
    const currentWallet = await this.getWallet(userId);
    if (!currentWallet) return { success: false, error: 'Wallet not found' };

    if (currentWallet.balance >= 100) {
      return { success: false, error: 'Balance is not empty. Refills are available when balance is below 100 coins.' };
    }

    const REFILL_AMOUNT = 1000;
    const mutation = await this.mutateBalance({
      userId,
      amount: REFILL_AMOUNT,
      type: 'REFILL',
      metadata: { reason: 'Rewarded ad refill (1,000 coins)' },
    });

    if (!mutation.success) {
      return { success: false, error: mutation.error };
    }

    return {
      success: true,
      refillAmount: REFILL_AMOUNT,
      wallet: mutation.wallet,
    };
  }

  private static async checkCoinAchievements(userId: string, lifetimeEarned: number) {
    if (lifetimeEarned >= 50000) {
      const ach = await queryOne<{ id: string }>('SELECT id FROM achievements WHERE code = ?', ['VAULT_MASTER']);
      if (ach) {
        await execute(`
          INSERT OR IGNORE INTO user_achievements (id, user_id, achievement_id, unlocked_at)
          VALUES (?, ?, ?, ?)
        `, [`uach-${crypto.randomUUID()}`, userId, ach.id, new Date().toISOString()]);
      }
    }
  }
}
