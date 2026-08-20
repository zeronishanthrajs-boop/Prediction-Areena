'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  Flame, 
  ShieldCheck, 
  History,
  Coins,
  AlertCircle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { MarketChart } from '@/components/MarketChart';
import { PredictionPanel } from '@/components/PredictionPanel';
import { ResultModal } from '@/components/ResultModal';
import { sounds } from '@/lib/audio';
import { Market, MarketRound, MarketTick, Prediction } from '@/lib/types';
import { INITIAL_MARKETS } from '@/lib/constants';

function PlayPageContent() {
  const { user, wallet, refreshSession, openAuth } = useApp();
  const searchParams = useSearchParams();
  
  const [selectedMarketId, setSelectedMarketId] = useState<string>(
    searchParams.get('market') || 'ai-index'
  );
  
  const [markets, setMarkets] = useState<Market[]>(INITIAL_MARKETS);
  const [currentPrice, setCurrentPrice] = useState<number>(10428.50);
  const [activeRound, setActiveRound] = useState<MarketRound | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [lockRemaining, setLockRemaining] = useState<number>(25);
  const [ticks, setTicks] = useState<MarketTick[]>([]);
  
  // User's active prediction in current round
  const [activePrediction, setActivePrediction] = useState<Prediction | null>(null);
  // Resolved prediction to display in celebration modal
  const [resolvedPrediction, setResolvedPrediction] = useState<Prediction | null>(null);
  const [recentRounds, setRecentRounds] = useState<Array<Record<string, unknown>>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const prevRoundIdRef = useRef<string | null>(null);

  // Load initial market state
  const loadMarketData = useCallback(async (marketId: string) => {
    try {
      const res = await fetch(`/api/market?id=${marketId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.market) {
          setCurrentPrice(data.currentPrice);
          setActiveRound(data.activeRound);
          setTimeRemaining(data.timeRemaining);
          setTicks(data.ticks || []);
        }
      }

      // Load recent round history
      const historyRes = await fetch('/api/prediction/history?scope=recent-rounds&limit=10');
      if (historyRes.ok) {
        const hData = await historyRes.json();
        setRecentRounds(hData.rounds || []);
      }
    } catch (e) {
      console.error('Error loading market:', e);
    }
  }, []);

  useEffect(() => {
    loadMarketData(selectedMarketId);
  }, [selectedMarketId, loadMarketData]);

  // Connect to SSE Stream for live ticks and round state
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(`/api/market/stream?marketId=${selectedMarketId}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.marketId === selectedMarketId) {
            setCurrentPrice(data.price);
            setTimeRemaining(data.timeRemaining);
            setLockRemaining(data.lockRemaining);

            if (data.activeRound) {
              const newRound = data.activeRound as MarketRound;
              
              // Detect round settlement transition
              if (prevRoundIdRef.current && prevRoundIdRef.current !== newRound.id) {
                // Round transitioned! Check for resolved user prediction
                if (activePrediction) {
                  fetchUserLatestResult(activePrediction.id);
                }
                loadMarketData(selectedMarketId);
              }
              prevRoundIdRef.current = newRound.id;
              setActiveRound(newRound);
            }

            // Append tick to canvas history buffer
            setTicks((prev) => {
              const newTick: MarketTick = {
                market_id: data.marketId,
                price: data.price,
                change: data.price - (prev[prev.length - 1]?.price || data.price),
                timestamp: data.timestamp,
              };
              const updated = [...prev, newTick];
              if (updated.length > 120) updated.shift();
              return updated;
            });
          }
        } catch {}
      };

      eventSource.onerror = () => {
        // SSE will automatically retry
      };
    } catch (e) {
      console.error('SSE initialization error:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [selectedMarketId, activePrediction, loadMarketData]);

  // Check and fetch resolved user prediction
  const fetchUserLatestResult = async (predictionId: string) => {
    try {
      const res = await fetch('/api/prediction/history?limit=5');
      if (res.ok) {
        const data = await res.json();
        const found = (data.predictions as Prediction[] || []).find((p) => p.id === predictionId);
        if (found && found.result !== 'PENDING') {
          setResolvedPrediction(found);
          setActivePrediction(null);
          refreshSession();
        }
      }
    } catch (e) {
      console.error('Error fetching result:', e);
    }
  };

  // Place UP or DOWN prediction
  const handlePlacePrediction = async (direction: 'UP' | 'DOWN', stake: number) => {
    if (!user) {
      openAuth();
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/prediction/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: selectedMarketId,
          direction,
          stake,
          idempotencyKey: `pred-${user.id}-${activeRound?.id}-${direction}-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedbackMessage({ type: 'error', text: data.error || 'Failed to place prediction' });
      } else {
        setActivePrediction(data.prediction);
        setFeedbackMessage({ type: 'success', text: `Prediction locked: ${direction} with ${stake} Practice Coins!` });
        refreshSession();
      }
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Network error placing prediction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMarket = markets.find((m) => m.id === selectedMarketId) || markets[0];
  const isUp = activeRound ? currentPrice >= activeRound.start_price : true;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 animate-fade-in">
      
      {/* Market Selector Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {markets.map((m) => {
          const isSelected = m.id === selectedMarketId;
          return (
            <button
              key={m.id}
              onClick={() => {
                sounds.playClick();
                setSelectedMarketId(m.id);
                setActivePrediction(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/10 scale-[1.02]'
                  : 'bg-[#0d111a] text-slate-400 hover:text-slate-200 border border-white/[0.06] hover:bg-white/[0.04]'
              }`}
            >
              <span className="font-mono text-cyan-300 font-extrabold">{m.symbol}</span>
              <span>{m.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                m.change_24h >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {m.change_24h >= 0 ? `+${m.change_24h}%` : `${m.change_24h}%`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in ${
          feedbackMessage.type === 'error'
            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
        }`}>
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-white ml-2">×</button>
        </div>
      )}

      {/* Main Arena Workspace (Chart on Left/Top, Prediction Controller on Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 1. Live Chart Screen */}
        <div className="lg:col-span-8 order-1 flex flex-col gap-4">
          <div className="bg-[#0d111a] border border-white/[0.08] rounded-3xl p-4 sm:p-6 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            
            {/* Top Market Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-black text-white">{currentMarket.name}</h1>
                    <span className="text-[10px] bg-white/[0.06] text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                      {currentMarket.profile} PROFILE
                    </span>
                  </div>
                  <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 30-Second Continuous Simulated Market
                  </span>
                </div>
              </div>

              {/* Price & Trend Header */}
              <div className="text-right font-mono-numbers">
                <div className={`text-2xl sm:text-3xl font-black ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currentPrice.toFixed(2)}
                </div>
                <div className="text-xs font-bold flex items-center justify-end gap-1 text-slate-400">
                  <span>Base: {activeRound?.start_price.toFixed(2) || currentPrice.toFixed(2)}</span>
                  <span className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
                    ({isUp ? `+${(currentPrice - (activeRound?.start_price || currentPrice)).toFixed(2)}` : `${(currentPrice - (activeRound?.start_price || currentPrice)).toFixed(2)}`})
                  </span>
                </div>
              </div>
            </div>

            {/* Canvas Chart Area */}
            <div className="w-full h-72 sm:h-96 my-2 relative">
              <MarketChart
                ticks={ticks}
                currentPrice={currentPrice}
                activeRound={activeRound}
                userEntryPrice={activePrediction?.entry_price || null}
                userDirection={activePrediction?.direction || null}
              />
            </div>

            {/* Live Chart Footer Stats */}
            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/[0.06] pt-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Fixed 30s Round Cadence
              </span>
              <span className="text-slate-400">
                Lock Period: <strong className="text-rose-400">Final 5 Seconds</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 2. Prediction Control Panel (Right Column on Desktop, directly under Chart on Mobile) */}
        <div className="lg:col-span-4 order-2 lg:order-3 flex flex-col gap-4">
          <PredictionPanel
            balance={wallet?.balance || 0}
            activeRound={activeRound}
            timeRemaining={timeRemaining}
            lockRemaining={lockRemaining}
            currentPrice={currentPrice}
            activeUserPrediction={activePrediction}
            onPlacePrediction={handlePlacePrediction}
            isLoading={isSubmitting}
          />
        </div>

        {/* 3. Recent Rounds Table (Under Prediction Control on Mobile, under Chart on Desktop) */}
        <div className="lg:col-span-8 order-3 lg:order-2 flex flex-col gap-4">
          <div className="bg-[#0d111a] border border-white/[0.08] rounded-3xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" /> Recent Round Resolutions
              </h3>
              <span className="text-[11px] text-slate-500">Live Platform Feed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-white/[0.06] pb-2">
                    <th className="py-2 font-semibold">Round</th>
                    <th className="py-2 font-semibold">Market</th>
                    <th className="py-2 font-semibold">Base Price</th>
                    <th className="py-2 font-semibold">Exit Price</th>
                    <th className="py-2 font-semibold text-right">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono-numbers">
                  {recentRounds.map((rnd, idx) => {
                    const outcome = String(rnd.outcome || 'UP');
                    const startP = Number(rnd.start_price || 0);
                    const endP = Number(rnd.end_price || 0);
                    return (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 font-bold text-slate-300">#{String(rnd.round_number)}</td>
                        <td className="py-2.5 text-slate-400">{String(rnd.market_symbol || 'AINX')}</td>
                        <td className="py-2.5 text-slate-300">{startP.toFixed(2)}</td>
                        <td className={`py-2.5 font-bold ${outcome === 'UP' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {endP.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right font-extrabold">
                          <span className={`px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1 ${
                            outcome === 'UP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {outcome === 'UP' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {outcome}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 4. Quick Guide Card (At the bottom) */}
        <div className="lg:col-span-4 order-4 lg:order-4 flex flex-col gap-4">
          <div className="bg-[#0d111a] border border-white/[0.08] rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> How It Works
            </h4>
            <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">1</span>
                <span>Select your Practice Coin stake (minimum 50 coins).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">2</span>
                <span>Choose <strong>UP</strong> if you predict price will rise in 30s, or <strong>DOWN</strong> if you predict it will drop.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">3</span>
                <span>Predictions lock at T-5s. Winning calls receive <strong>+1.90x Coins, +40 XP & +16 Elo Rating</strong>!</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* Result Modal when round settles */}
      {resolvedPrediction && (
        <ResultModal
          prediction={resolvedPrediction}
          onClose={() => setResolvedPrediction(null)}
        />
      )}
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 text-sm">
          Loading Arena Market...
        </div>
      }
    >
      <PlayPageContent />
    </Suspense>
  );
}

