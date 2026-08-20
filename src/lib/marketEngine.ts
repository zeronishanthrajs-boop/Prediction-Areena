import { query, queryOne, execute, ensureDbInitialized } from './db';
import { Market, MarketRound, MarketTick, MarketProfile } from './types';
import { PredictionService } from './predictionService';
import { INITIAL_MARKETS } from './constants';

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
    this.bootstrap();
  }

  public static getInstance(): MarketEngine {
    if (!MarketEngine.instance) {
      MarketEngine.instance = new MarketEngine();
    }
    return MarketEngine.instance;
  }

  private async bootstrap() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      await ensureDbInitialized();
      await this.init();
    } catch (err) {
      console.error('MarketEngine bootstrap error:', err);
      // Fallback with INITIAL_MARKETS in memory
      this.initFallback();
    }

    this.startTicker();
  }

  private async init() {
    const markets = await query<Market>("SELECT * FROM markets WHERE status = 'ACTIVE'");
    const activeMarkets = markets.length > 0 ? markets : INITIAL_MARKETS;
    const now = Date.now();

    for (const m of activeMarkets) {
      let activeRound = await queryOne<MarketRound>(`
        SELECT * FROM market_rounds 
        WHERE market_id = ? AND status IN ('OPEN', 'LOCKED') 
        ORDER BY start_time DESC LIMIT 1
      `, [m.id]);

      if (!activeRound || activeRound.end_time <= now) {
        activeRound = await this.createNewRound(m.id, m.current_price, now);
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
  }

  private initFallback() {
    const now = Date.now();
    for (const m of INITIAL_MARKETS) {
      const activeRound: MarketRound = {
        id: `rnd-${m.id}-1-${now}`,
        market_id: m.id,
        round_number: 1,
        start_time: now,
        lock_time: now + 25000,
        end_time: now + 30000,
        start_price: m.current_price,
        lock_price: null,
        end_price: null,
        status: 'OPEN',
        outcome: null,
      };

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

      // Add to recent ticks (buffer last 150 ticks)
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
        round.status = 'LOCKED';
        round.lock_price = newPrice;
        execute(`
          UPDATE market_rounds 
          SET status = 'LOCKED', lock_price = ? 
          WHERE id = ?
        `, [newPrice, round.id]).catch((e) => console.warn('Error locking round in DB:', e));
      } else if (now >= round.end_time) {
        round.status = 'RESOLVED';
        round.end_price = newPrice;
        const outcome = newPrice > round.start_price ? 'UP' : newPrice < round.start_price ? 'DOWN' : 'FLAT';
        round.outcome = outcome;

        const resolvedRoundId = round.id;
        const startPrice = round.start_price;

        execute(`
          UPDATE market_rounds 
          SET status = 'RESOLVED', end_price = ?, outcome = ? 
          WHERE id = ?
        `, [newPrice, outcome, resolvedRoundId]).catch((e) => console.warn('Error resolving round in DB:', e));

        // Resolve predictions
        PredictionService.resolveRound(resolvedRoundId, startPrice, newPrice, outcome).catch((e) => {
          console.error(`Error resolving predictions for round ${resolvedRoundId}:`, e);
        });

        // Start next round immediately in memory
        const nextRoundNumber = round.round_number + 1;
        const nextRoundId = `rnd-${marketId}-${nextRoundNumber}-${now}`;
        const nextRound: MarketRound = {
          id: nextRoundId,
          market_id: marketId,
          round_number: nextRoundNumber,
          start_time: now,
          lock_time: now + 25000,
          end_time: now + 30000,
          start_price: newPrice,
          lock_price: null,
          end_price: null,
          status: 'OPEN',
          outcome: null,
        };

        state.activeRound = nextRound;

        execute(`
          INSERT INTO market_rounds (id, market_id, round_number, start_time, lock_time, end_time, start_price, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [nextRound.id, nextRound.market_id, nextRound.round_number, nextRound.start_time, nextRound.lock_time, nextRound.end_time, nextRound.start_price, nextRound.status])
        .catch((e) => console.warn('Error inserting new round in DB:', e));
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
        const meanPull = (market.base_price - currentPrice) / market.base_price * 0.05;
        const shock = (Math.random() - 0.5) * vol;
        deltaPercent = meanPull + shock;
        break;
      }
      case 'VOLATILE': {
        const fatTail = Math.random() < 0.1 ? (Math.random() - 0.5) * 3 : 1;
        const shock = (Math.random() - 0.5) * vol * 2.2 * fatTail;
        deltaPercent = shock;
        break;
      }
      case 'MOMENTUM': {
        state.momentum = state.momentum * 0.75 + (Math.random() - 0.48) * vol * 1.5;
        deltaPercent = state.momentum;
        break;
      }
      case 'REVERSAL': {
        state.trend = (state.trend + 0.15) % (Math.PI * 2);
        const wave = Math.sin(state.trend) * vol * 1.2;
        const noise = (Math.random() - 0.5) * vol * 0.5;
        deltaPercent = wave + noise;
        break;
      }
      case 'CHAOS':
      default: {
        const shock = (Math.random() - 0.5) * vol * 2.8;
        deltaPercent = shock;
        break;
      }
    }

    const calculated = currentPrice * (1 + deltaPercent);
    return Number(Math.max(1, calculated).toFixed(2));
  }

  private async createNewRound(marketId: string, startPrice: number, now: number): Promise<MarketRound> {
    const lastRound = await queryOne<{ round_number: number }>(`
      SELECT round_number FROM market_rounds 
      WHERE market_id = ? 
      ORDER BY round_number DESC LIMIT 1
    `, [marketId]);

    const roundNumber = (lastRound?.round_number || 0) + 1;
    const roundId = `rnd-${marketId}-${roundNumber}-${now}`;
    const startTime = now;
    const lockTime = now + 25000;
    const endTime = now + 30000;

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

    await execute(`
      INSERT INTO market_rounds (id, market_id, round_number, start_time, lock_time, end_time, start_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [round.id, round.market_id, round.round_number, round.start_time, round.lock_time, round.end_time, round.start_price, round.status]);

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
