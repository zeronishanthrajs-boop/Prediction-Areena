'use client';

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Trophy, 
  Users, 
  Clock, 
  Sparkles, 
  Coins, 
  CheckCircle2, 
  X, 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sounds } from '@/lib/audio';
import { SportsEvent, SportsPrediction } from '@/lib/types';

export default function SportsPage() {
  const { user, wallet, refreshSession, openAuth } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [userPredictions, setUserPredictions] = useState<SportsPrediction[]>([]);
  const [activeTab, setActiveTab] = useState<'fixtures' | 'my-calls'>('fixtures');
  
  // Predict Modal state
  const [selectedEvent, setSelectedEvent] = useState<SportsEvent | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [stake, setStake] = useState<number>(500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const categories = ['ALL', 'CRICKET', 'FOOTBALL', 'BASKETBALL', 'TENNIS', 'ESPORTS'];

  const loadEvents = async (cat: string) => {
    try {
      const url = cat === 'ALL' ? '/api/sports' : `/api/sports?category=${cat}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setUserPredictions(data.userPredictions || []);
      }
    } catch (e) {
      console.error('Error loading sports:', e);
    }
  };

  useEffect(() => {
    loadEvents(selectedCategory);
  }, [selectedCategory]);

  const handleOpenPredictModal = (event: SportsEvent, option: string) => {
    if (!user) {
      openAuth();
      return;
    }
    sounds.playClick();
    setSelectedEvent(event);
    setSelectedOption(option);
    setStake(500);
    setModalSuccess(null);
    setModalError(null);
  };

  const handleConfirmSportsPrediction = async () => {
    if (!selectedEvent || !selectedOption || !user) return;
    sounds.playBetPlaced();
    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await fetch('/api/sports/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          selectedOption,
          stake,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setModalError(data.error || 'Failed to submit prediction');
      } else {
        sounds.playWinFanfare();
        setModalSuccess(`Successfully locked in ${selectedOption} with ${stake} Practice Coins!`);
        refreshSession();
        loadEvents(selectedCategory);
        setTimeout(() => {
          setSelectedEvent(null);
        }, 1800);
      }
    } catch {
      setModalError('Network error submitting prediction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stakeOptions = [100, 250, 500, 1000, 2500];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0d111a] via-[#1a1426] to-[#0d111a] border border-orange-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" /> Sports Prediction Arena
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Call Real-World Matches
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Pick winners across Cricket, Football, Basketball, Tennis and Esports using virtual Practice Coins. Multipliers update based on arena consensus.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#07090e]/80 border border-white/10 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('fixtures');
            }}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'fixtures' ? 'bg-orange-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Live & Upcoming ({events.length})
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('my-calls');
            }}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'my-calls' ? 'bg-orange-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            My Calls ({userPredictions.length})
          </button>
        </div>
      </div>

      {/* Category Pills */}
      {activeTab === 'fixtures' && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  sounds.playClick();
                  setSelectedCategory(cat);
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50 shadow-md shadow-orange-500/10'
                    : 'bg-[#0d111a] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'fixtures' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="bg-[#0d111a] border border-white/[0.08] hover:border-orange-500/30 rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between gap-4 group"
            >
              {/* Event Card Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/30 uppercase">
                  {ev.category}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className={`w-2 h-2 rounded-full ${ev.status === 'LIVE' ? 'bg-rose-500 animate-ping' : 'bg-cyan-400'}`} />
                  <span className="font-bold text-[11px] uppercase tracking-wider">{ev.status}</span>
                </div>
              </div>

              {/* Title & Matchup */}
              <div>
                <h3 className="text-xs text-slate-400 font-medium">{ev.title}</h3>
                <div className="flex items-center justify-between my-3">
                  <div className="text-left">
                    <span className="text-base font-black text-white block">{ev.team_a}</span>
                    <span className="text-xs font-mono font-extrabold text-orange-400">{ev.team_a_multiplier}x Return</span>
                  </div>
                  <span className="text-xs font-black text-slate-600 uppercase px-2">VS</span>
                  <div className="text-right">
                    <span className="text-base font-black text-white block">{ev.team_b}</span>
                    <span className="text-xs font-mono font-extrabold text-orange-400">{ev.team_b_multiplier}x Return</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleOpenPredictModal(ev, ev.team_a)}
                  className="py-2.5 px-2 rounded-xl bg-white/[0.05] hover:bg-orange-500/20 hover:border-orange-500/40 border border-white/[0.08] text-xs font-bold text-slate-200 transition-all text-center"
                >
                  Pick {ev.team_a} ({ev.team_a_multiplier}x)
                </button>
                <button
                  onClick={() => handleOpenPredictModal(ev, ev.team_b)}
                  className="py-2.5 px-2 rounded-xl bg-white/[0.05] hover:bg-orange-500/20 hover:border-orange-500/40 border border-white/[0.08] text-xs font-bold text-slate-200 transition-all text-center"
                >
                  Pick {ev.team_b} ({ev.team_b_multiplier}x)
                </button>
              </div>

              {/* Footer details */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/[0.04]">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> {ev.total_participants.toLocaleString()} players
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Closes in 2h
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* My Sports Predictions Tab */
        <div className="bg-[#0d111a] border border-white/[0.08] rounded-3xl p-5 sm:p-6">
          <h3 className="text-base font-bold text-white mb-4">Your Active & Past Sports Calls</h3>
          {userPredictions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              You haven&apos;t placed any sports predictions yet. Switch to Live & Upcoming to make a call!
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {userPredictions.map((pred) => (
                <div key={pred.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Picked: <strong className="text-orange-400">{pred.selected_option}</strong>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Stake: {pred.stake} Coins • Multiplier: {pred.multiplier}x
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                      pred.result === 'WIN' ? 'bg-emerald-500/20 text-emerald-400' : pred.result === 'LOSS' ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-300'
                    }`}>
                      {pred.result === 'PENDING' ? 'MATCH IN PROGRESS' : pred.result}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Potential: +{Math.floor(pred.stake * pred.multiplier)} Coins
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Predict Stake Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0d111a] border border-orange-500/40 rounded-3xl p-6 shadow-2xl relative flex flex-col">
            
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{selectedEvent.title}</h3>
                <span className="text-[11px] text-orange-400 font-semibold uppercase">
                  Picked: {selectedOption}
                </span>
              </div>
            </div>

            {modalSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {modalError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 mb-3">
                {modalError}
              </div>
            )}

            {/* Stake selector chips */}
            <div className="space-y-3 my-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Select Stake:</span>
                <span className="font-mono text-slate-300">
                  Balance: <strong className="text-amber-400">{(wallet?.balance || 0).toLocaleString()}</strong>
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {stakeOptions.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      sounds.playClick();
                      setStake(amount);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                      stake === amount
                        ? 'bg-orange-500 text-black ring-1 ring-orange-300'
                        : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]'
                    }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>

              {/* Potential return banner */}
              <div className="p-3 bg-[#131926] rounded-xl border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Estimated Return:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  +{Math.floor(stake * (selectedOption === selectedEvent.team_a ? selectedEvent.team_a_multiplier : selectedEvent.team_b_multiplier))} Coins
                </span>
              </div>
            </div>

            <button
              onClick={handleConfirmSportsPrediction}
              disabled={isSubmitting || (wallet?.balance || 0) < stake}
              className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-black font-extrabold text-sm shadow-xl shadow-orange-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
              <span>Lock In Call ({stake} Practice Coins)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
