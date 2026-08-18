import { db } from './db';
import { WalletService } from './walletService';
import crypto from 'crypto';

const HMAC_SECRET = process.env.AD_VERIFICATION_SECRET || 'ad-verification-secret-crypto-hash-key-2026';

export interface AdIntent {
  nonce: string;
  userId: string;
  rewardType: 'DOUBLE_DAILY' | 'REFILL' | 'CHALLENGE_BONUS';
  amount: number;
  expiresAt: number;
  signature: string;
}

export class AdRewardService {
  /**
   * Step 1: Client requests an Ad Intent before viewing an ad.
   * Server generates a signed nonce with expiration and stores pending intent.
   */
  static generateAdIntent(userId: string, rewardType: 'DOUBLE_DAILY' | 'REFILL' | 'CHALLENGE_BONUS', amount: number): AdIntent {
    const nonce = `ad-nonce-${crypto.randomUUID()}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute validity window

    // Generate HMAC signature for tampering protection
    const signature = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(`${nonce}:${userId}:${rewardType}:${amount}:${expiresAt}`)
      .digest('hex');

    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO ad_intents (nonce, user_id, reward_type, amount, status, expires_at, created_at)
      VALUES (?, ?, ?, ?, 'PENDING', ?, ?)
    `).run(nonce, userId, rewardType, amount, expiresAt, now);

    return {
      nonce,
      userId,
      rewardType,
      amount,
      expiresAt,
      signature,
    };
  }

  /**
   * Step 2: Client or Ad Callback verifies ad completion.
   * Server validates signature, checks nonce uniqueness, ensures it was not previously claimed, and credits Practice Coins atomically.
   */
  static verifyAndCreditReward(params: {
    nonce: string;
    userId: string;
    signature: string;
  }): { success: boolean; coinsAwarded?: number; error?: string } {
    const { nonce, userId, signature } = params;

    // 1. Fetch pending intent
    const intent = db.prepare('SELECT * FROM ad_intents WHERE nonce = ?').get(nonce) as {
      nonce: string;
      user_id: string;
      reward_type: string;
      amount: number;
      status: string;
      expires_at: number;
    } | undefined;

    if (!intent) {
      return { success: false, error: 'Invalid or expired ad verification token' };
    }

    if (intent.user_id !== userId) {
      return { success: false, error: 'Unauthorized reward claimant' };
    }

    if (intent.status === 'CLAIMED') {
      return { success: false, error: 'Reward has already been claimed (Anti-replay violation)' };
    }

    if (Date.now() > intent.expires_at) {
      return { success: false, error: 'Ad session expired. Please start a new session.' };
    }

    // 2. Validate HMAC signature
    const expectedSig = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(`${nonce}:${userId}:${intent.reward_type}:${intent.amount}:${intent.expires_at}`)
      .digest('hex');

    if (signature !== expectedSig) {
      return { success: false, error: 'Invalid ad verification signature' };
    }

    // 3. Mark intent as CLAIMED inside atomic transaction & credit wallet
    const tx = db.transaction(() => {
      db.prepare("UPDATE ad_intents SET status = 'CLAIMED' WHERE nonce = ?").run(nonce);

      if (intent.reward_type === 'DOUBLE_DAILY') {
        const dailyResult = WalletService.claimDailyReward(userId, true);
        if (!dailyResult.success) throw new Error(dailyResult.error);
        return dailyResult.rewardAmount || intent.amount;
      } else if (intent.reward_type === 'REFILL') {
        const refillResult = WalletService.refillEmptyBalance(userId);
        if (!refillResult.success) throw new Error(refillResult.error);
        return refillResult.refillAmount || intent.amount;
      } else {
        const creditResult = WalletService.mutateBalance({
          userId,
          amount: intent.amount,
          type: 'REWARDED_AD',
          idempotencyKey: `ad-reward-${nonce}`,
          metadata: { rewardType: intent.reward_type, nonce },
        });
        if (!creditResult.success) throw new Error(creditResult.error);
        return intent.amount;
      }
    });

    try {
      const coinsAwarded = tx();
      return { success: true, coinsAwarded };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to credit ad reward';
      return { success: false, error: msg };
    }
  }
}
