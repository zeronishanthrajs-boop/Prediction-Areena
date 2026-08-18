import { db } from './db';
import { Market, MarketRound, MarketTick, MarketProfile } from './types';
import { PredictionService } from './predictionService';

interface MarketState {
  market: Market;
  currentPrice: number;
  previousPrice: number;
  recentTicks: MarketTick[];
  activeRound: MarketRound;
  momentum: number;
  trend: number;
}

class MarketEngine {
  private static instance: MarketEngine;
  private marketStates: Map<string, MarketState> = new Map();
  private tickInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {
    this.init();
  }

  public static getInstance(): MarketEngine {
    if (!MarketEngine.instance) {
      MarketEngine.instance = new MarketEngine();
    }
    return MarketEngine.instance;
  }

  private init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Load active markets from DB
    const markets = db.prepare("SELECT * FROM markets WHERE status = 'ACTIVE'").all() as Market[];

    const now = Date.now();

    for (const m of markets) {
      // Find or create current active round
      let activeRound = db.prepare(`
        SELECT * FROM market_rounds 
        WHERE market_id = ? AND status IN ('OPEN', 'LOCKED') 
        ORDER BY start_time DESC LIMIT 1
      `).get(m.id) as MarketRound | undefined;

      if (!activeRound || activeRound.end_time <= now) {
        activeRound = this.createNewRound(m.id, m.current_price, now);
      }

      // Generate seed history ticks
      const seedTicks: MarketTick[] = [];
      let simulated = m.current_price;
      for (let i = 60; i >= 0; i--) {
        const tickTime = now - i * 500;
        const delta = (Math.random() - 0.49) * m.current_price * m.volatility;
        simulated = Math.max(1, simulated + delta);
        seedTicks.push({
          market_id: m.id,
          price: Number(simulated.toFixed(2)),
          change: Number(delta.toFixed(2)),
          timestamp: tickTime,
        });
      }

      this.marketStates.set(m.id, {
        market: m,
        currentPrice: m.current_price,
        previousPrice: m.current_price,
        recentTicks: seedTicks,
        activeRound,
        momentum: 0,
        trend: 0,
      });
    }

    // Start 500ms ticker loop
    this.startTicker();
  }

  private startTicker() {
    if (this.tickInterval) clearInterval(this.tickInterval);

    this.tickInterval = setInterval(() => {
      this.tickAllMarkets();
    }, 500);
  }

  private tickAllMarkets() {
    const now = Date.now();

    for (const [marketId, state] of this.marketStates.entries()) {
      // 1. Calculate price movement based on profile
      const newPrice = this.generateNextPrice(state);
      const priceChange = newPrice - state.currentPrice;

      state.previousPrice = state.currentPrice;
      state.currentPrice = newPrice;

      // Add to recent ticks (buffer last 120 ticks = 60s history)
      state.recentTicks.push({
        market_id: marketId,
        price: newPrice,
        change: priceChange,
        timestamp: now,
      });

      if (state.recentTicks.length > 150) {
        state.recentTicks.shift();
      }

      // 2. Handle round lifecycle
      const round = state.activeRound;

      if (round.status === 'OPEN' && now >= round.lock_time) {
        // Transition to LOCKED (5 seconds before settlement)
        round.status = 'LOCKED';
        round.lock_price = newPrice;
        db.prepare(`
          UPDATE market_rounds 
          SET status = 'LOCKED', lock_price = ? 
          WHERE id = ?
        `).run(newPrice, round.id);
      } else if (now >= round.end_time) {
        // Transition to RESOLVED & Settle Predictions
        round.status = 'RESOLVED';
        round.end_price = newPrice;
        const outcome = newPrice > round.start_price ? 'UP' : newPrice < round.start_price ? 'DOWN' : 'FLAT';
        round.outcome = outcome;

        db.prepare(`
          UPDATE market_rounds 
          SET status = 'RESOLVED', end_price = ?, outcome = ? 
          WHERE id = ?
        `).run(newPrice, outcome, round.id);

        // Resolve all predictions for this round
        try {
          PredictionService.resolveRound(round.id, round.start_price, newPrice, outcome);
        } catch (e) {
          console.error(`Error resolving round ${round.id}:`, e);
        }

        // Start next round immediately
        state.activeRound = this.createNewRound(marketId, newPrice, now);
      }
    }
  }

  private generateNextPrice(state: MarketState): number {
    const { market, currentPrice } = state;
    const profile: MarketProfile = market.profile;
    const vol = market.volatility;
    let deltaPercent = 0;

    switch (profile) {
      case 'STABLE': {
        // Mean-reverting Gaussian walk
        const meanPull = (market.base_price - currentPrice) / market.base_price * 0.05;
        const shock = (Math.random() - 0.5) * vol;
        deltaPercent = meanPull + shock;
        break;
      }
      case 'VOLATILE': {
        // Larger jumps with fat-tail shocks
        const fatTail = Math.random() < 0.1 ? (Math.random() - 0.5) * 3 : 1;
        const shock = (Math.random() - 0.5) * vol * 2.2 * fatTail;
        deltaPercent = shock;
        break;
      }
      case 'MOMENTUM': {
        // Positive auto-correlation
        state.momentum = state.momentum * 0.75 + (Math.random() - 0.48) * vol * 1.5;
        deltaPercent = state.momentum;
        break;
      }
      case 'REVERSAL': {
        // Oscillating cycles
        state.trend = (state.trend + 0.15) % (Math.PI * 2);
        const wave = Math.sin(state.trend) * vol * 1.2;
        const noise = (Math.random() - 0.5) * vol * 0.5;
        deltaPercent = wave + noise;
        break;
      }
      case 'CHAOS':
      default: {
        // Regime-switching random walk
        const shock = (Math.random() - 0.5) * vol * 2.8;
        deltaPercent = shock;
        break;
      }
    }

    const calculated = currentPrice * (1 + deltaPercent);
    // Ensure precision based on scale
    const decimals = market.base_price < 500 ? 2 : 2;
    return Number(Math.max(1, calculated).toFixed(decimals));
  }

  private createNewRound(marketId: string, startPrice: number, now: number): MarketRound {
    const lastRound = db.prepare(`
      SELECT round_number FROM market_rounds 
      WHERE market_id = ? 
      ORDER BY round_number DESC LIMIT 1
    `).get(marketId) as { round_number: number } | undefined;

    const roundNumber = (lastRound?.round_number || 0) + 1;
    const roundId = `rnd-${marketId}-${roundNumber}-${now}`;
    const startTime = now;
    const lockTime = now + 25000; // 25s (lock betting)
    const endTime = now + 30000;  // 30s (settle)

    const round: MarketRound = {
      id: roundId,
      market_id: marketId,
      round_number: roundNumber,
      start_time: startTime,
      lock_time: lockTime,
      end_time: endTime,
      start_price: startPrice,
      lock_price: null,
      end_price: null,
      status: 'OPEN',
      outcome: null,
    };

    db.prepare(`
      INSERT INTO market_rounds (id, market_id, round_number, start_time, lock_time, end_time, start_price, status)
      VALUES (@id, @market_id, @round_number, @start_time, @lock_time, @end_time, @start_price, @status)
    `).run(round);

    return round;
  }

  public getMarketState(marketId: string) {
    return this.marketStates.get(marketId) || null;
  }

  public getAllMarketSnapshots() {
    const snapshots: Array<{
      market: Market;
      currentPrice: number;
      change24h: number;
      activeRound: MarketRound;
      timeRemaining: number;
    }> = [];

    const now = Date.now();

    for (const state of this.marketStates.values()) {
      const timeRemaining = Math.max(0, Math.ceil((state.activeRound.end_time - now) / 1000));
      snapshots.push({
        market: state.market,
        currentPrice: state.currentPrice,
        change24h: state.market.change_24h,
        activeRound: state.activeRound,
        timeRemaining,
      });
    }

    return snapshots;
  }

  public getRecentTicks(marketId: string): MarketTick[] {
    return this.marketStates.get(marketId)?.recentTicks || [];
  }
}

export const marketEngine = MarketEngine.getInstance();
