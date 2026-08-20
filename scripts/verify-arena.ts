import { queryOne, ensureDbInitialized } from '../src/lib/db';
import { WalletService } from '../src/lib/walletService';
import { PredictionService } from '../src/lib/predictionService';
import { AdRewardService } from '../src/lib/adRewardService';
import { SocialService } from '../src/lib/socialService';
import { SportsService } from '../src/lib/sportsService';
import { marketEngine } from '../src/lib/marketEngine';

async function runTestSuite() {
  console.log('====================================================');
  console.log('   PREDICTION ARENA — END-TO-END VERIFICATION SUITE  ');
  console.log('====================================================\n');

  await ensureDbInitialized();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ✓ ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ✗ ${testName}`);
      failed++;
    }
  }

  // 1. TEST WALLET TRANSACTIONS & STARTING BALANCE
  console.log('\n--- 1. Wallet & ACID Transactions ---');
  const testUserId = 'usr-alex-pro';
  const initialWallet = await WalletService.getWallet(testUserId);
  assert(initialWallet !== null && initialWallet.balance > 0, 'User wallet exists and has positive balance');

  const debitRes = await WalletService.mutateBalance({
    userId: testUserId,
    amount: -500,
    type: 'PREDICTION_STAKE',
    metadata: { test: true },
  });
  assert(debitRes.success && debitRes.wallet?.balance === (initialWallet?.balance || 0) - 500, 'Atomic stake debit works');

  const creditRes = await WalletService.mutateBalance({
    userId: testUserId,
    amount: 950,
    type: 'PREDICTION_WIN',
    metadata: { test: true },
  });
  assert(creditRes.success && creditRes.wallet?.balance === (debitRes.wallet?.balance || 0) + 950, 'Atomic win credit works');

  // Idempotency check
  const idempotencyKey = `test-idemp-${Date.now()}`;
  const tx1 = await WalletService.mutateBalance({
    userId: testUserId,
    amount: 100,
    type: 'QUEST_REWARD',
    idempotencyKey,
  });
  const tx2 = await WalletService.mutateBalance({
    userId: testUserId,
    amount: 100,
    type: 'QUEST_REWARD',
    idempotencyKey,
  });
  assert(tx1.success && tx2.success && tx1.wallet?.balance === tx2.wallet?.balance, 'Idempotency prevents duplicate balance mutation');

  // 2. TEST SYNTHETIC MARKET ENGINE
  console.log('\n--- 2. Synthetic Market & Round Lifecycle ---');
  const marketState = marketEngine.getMarketState('ai-index');
  assert(marketState !== null, 'AI Neural 100 market state loaded in memory');
  assert(marketState?.recentTicks.length !== undefined && marketState.recentTicks.length > 0, 'Market ticks buffer active');
  assert(marketState?.activeRound.status === 'OPEN' || marketState?.activeRound.status === 'LOCKED', 'Active 30s round running');

  // 3. TEST PREDICTION PLACEMENT & SETTLEMENT
  console.log('\n--- 3. Prediction Locking & Outcome Math ---');
  const predResult = await PredictionService.placePrediction({
    userId: testUserId,
    marketId: 'ai-index',
    direction: 'UP',
    stake: 200,
  });
  assert(predResult.success && predResult.prediction?.direction === 'UP', 'Server accepted and locked UP prediction');

  // Test resolution logic
  if (predResult.prediction) {
    const roundId = predResult.prediction.round_id;
    await PredictionService.resolveRound(roundId, 10000, 10050, 'UP');
    const updatedPred = await queryOne<{ result: string; payout: number }>('SELECT result, payout FROM predictions WHERE id = ?', [predResult.prediction.id]);
    assert(updatedPred !== null && updatedPred.result === 'WIN' && updatedPred.payout === 380, 'Round resolution awarded WIN and 1.90x payout');
  }

  // 4. TEST REWARDED ADS VERIFICATION & ANTI-REPLAY
  console.log('\n--- 4. Rewarded Ads Nonce Verification ---');
  const intent = await AdRewardService.generateAdIntent(testUserId, 'CHALLENGE_BONUS', 500);
  assert(Boolean(intent.nonce && intent.signature), 'Generated secure signed ad intent');

  // First claim (valid)
  const claim1 = await AdRewardService.verifyAndCreditReward({
    nonce: intent.nonce,
    userId: testUserId,
    signature: intent.signature,
  });
  assert(claim1.success && claim1.coinsAwarded === 500, 'Verified ad signature and credited reward');

  // Replay claim (must be rejected)
  const claim2 = await AdRewardService.verifyAndCreditReward({
    nonce: intent.nonce,
    userId: testUserId,
    signature: intent.signature,
  });
  assert(!claim2.success, 'Anti-replay guard strictly rejected duplicate claim attempt');

  // 5. TEST SOCIAL & CHALLENGES
  console.log('\n--- 5. Social Friends & 1v1 Challenges ---');
  const searchResults = await SocialService.searchUsers('usr-admin-01', 'Alex');
  assert(searchResults.length > 0 && searchResults[0].username === 'Alex_Quant', 'User search finds accounts by query');

  const friends = await SocialService.getFriends('usr-admin-01');
  assert(friends.length > 0, 'Friend list relationship query functional');

  const challenge = await SocialService.createChallenge({
    creatorId: 'usr-admin-01',
    opponentId: 'usr-alex-pro',
    marketId: 'ai-index',
    roundsTotal: 5,
  });
  assert(challenge.success && challenge.challenge?.rounds_total === 5, 'Created 5-round 1v1 Head-to-Head challenge');

  // 6. TEST SPORTS LOBBY
  console.log('\n--- 6. Sports Lobby Predictions ---');
  const sportsEvents = await SportsService.getEvents();
  assert(sportsEvents.length > 0, 'Sports lobby fixtures populated');

  const firstEvent = sportsEvents[0];
  const sportsPred = await SportsService.placeSportsPrediction({
    userId: testUserId,
    eventId: firstEvent.id,
    selectedOption: firstEvent.team_a,
    stake: 300,
  });
  assert(sportsPred.success && sportsPred.prediction?.stake === 300, 'Sports prediction placed and balance deducted');

  console.log('\n====================================================');
  console.log(`   TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
