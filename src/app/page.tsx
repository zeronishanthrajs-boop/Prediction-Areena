'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  TrendingUp, 
  Flame, 
  Trophy, 
  Users, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Coins, 
  Award,
  ChevronRight,
  ShieldCheck,
  Target
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sounds } from '@/lib/audio';
import { Market, LeaderboardEntry, DailyQuest } from '@/lib/types';
import { UserAvatar } from '@/components/UserAvatar';

export default function HomePage() {
  const { user, wallet, openAuth, openDailyReward } = useApp();
  const [featuredMarket, setFeaturedMarket] = useState<Market | null>(null);
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [quickPrice, setQuickPrice] = useState<number>(10428.50);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    // Fetch initial market data & top leaderboard
    async function loadData() {
      try {
        const [marketRes, leadRes, profileRes] = await Promise.all([
          fetch('/api/market?id=ai-index'),
          fetch('/api/leaderboard?tab=global'),
          fetch('/api/profile'),
        ]);

        if (marketRes.ok) {
          const mData = await marketRes.json();
          if (mData.market) {
            setFeaturedMarket(mData.market);
            setQuickPrice(mData.currentPrice);
          }
        }

        if (leadRes.ok) {
          const lData = await leadRes.json();
          setTopPlayers(lData.entries?.slice(0, 5) || []);
        }

        if (profileRes.ok) {
          const pData = await profileRes.json();
          setQuests(pData.dailyQuests || []);
        }
      } catch (e) {
        console.error('Error loading home data:', e);
      }
    }

    loadData();

    // Setup live price ticker simulation for hero
    const interval = setInterval(() => {
      setQuickPrice((prev) => {
        const delta = (Math.random() - 0.48) * 8.5;
        const next = Math.max(100, prev + delta);
        setPriceFlash(delta >= 0 ? 'up' : 'down');
        setTimeout(() => setPriceFlash(null), 500);
        return Number(next.toFixed(2));
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in pb-24 sm:pb-8">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0d111a] via-[#111625] to-[#07090e] border border-white/[0.08] p-6 sm:p-10 shadow-2xl">
        {/* Background glow accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Vision & Pitch */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Social Prediction Arena
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Test your call.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                Dominate the Arena.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
              Predict continuous 30-second synthetic markets and real-world sports fixtures with free virtual Practice Coins. Earn XP, elevate your Elo skill rating, and climb global leaderboards.
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/play"
                onClick={() => sounds.playClick()}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition-all transform active:scale-95"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>Enter Infinite Market</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <Link
                href="/sports"
                onClick={() => sounds.playClick()}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-slate-200 font-bold text-sm transition-all"
              >
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Sports Lobby</span>
              </Link>
            </div>

            {/* Micro badges */}
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Zero Real Money Risk
              </span>
              <span className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-amber-400" /> 10,000 Starting Coins
              </span>
            </div>
          </div>

          {/* Right Column: Live Interactive Quick-Call Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#131926]/90 border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl relative flex flex-col gap-4">
              
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    AI
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white leading-tight">AI Neural 100</h2>
                    <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase">
                      30S SIMULATED ROUND
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md text-xs font-bold font-mono">
                  <TrendingUp className="w-3 h-3" /> +3.42%
                </div>
              </div>

              {/* Dynamic Live Price Display */}
              <div className="text-center py-4 bg-[#07090e]/60 rounded-2xl border border-white/[0.04]">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                  Live Synthetic Price
                </span>
                <div className={`font-mono-numbers text-3xl sm:text-4xl font-black transition-colors ${
                  priceFlash === 'up' ? 'text-emerald-400 flash-green' : priceFlash === 'down' ? 'text-rose-400 flash-red' : 'text-white'
                }`}>
                  {quickPrice.toFixed(2)}
                </div>
                <span className="text-[11px] text-cyan-300/80 font-medium mt-1 inline-block">
                  Will it be higher or lower in 30s?
                </span>
              </div>

              {/* 1-Click Fast Jump Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/play?market=ai-index&call=UP"
                  onClick={() => sounds.playClick()}
                  className="py-3 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 hover:from-emerald-400 text-black font-black text-center text-sm shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
                >
                  CALL UP ↑
                </Link>
                <Link
                  href="/play?market=ai-index&call=DOWN"
                  onClick={() => sounds.playClick()}
                  className="py-3 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 hover:from-rose-500 text-white font-black text-center text-sm shadow-lg shadow-rose-600/20 transition-all transform active:scale-95"
                >
                  CALL DOWN ↓
                </Link>
              </div>

              <div className="text-center">
                <span className="text-[11px] text-slate-500">
                  Fixed 30s settlement • 1.90x Practice Coin return
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Player Quick Stats Ribbon (if logged in) */}
      {user && wallet && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#0d111a] border border-white/[0.08] rounded-2xl p-4 flex flex-col">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <Coins className="w-4 h-4 text-amber-400" /> Practice Balance
            </span>
            <span className="font-mono-numbers text-xl sm:text-2xl font-black text-amber-300">
              {wallet.balance.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 mt-1">Virtual practice points</span>
          </div>

          <div className="bg-[#0d111a] border border-white/[0.08] rounded-2xl p-4 flex flex-col">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <Award className="w-4 h-4 text-purple-400" /> Skill Elo Rating
            </span>
            <span className="font-mono-numbers text-xl sm:text-2xl font-black text-purple-300">
              {user.rating}
            </span>
            <span className="text-[10px] text-slate-500 mt-1">Tier: Level {user.level}</span>
          </div>

          <div className="bg-[#0d111a] border border-white/[0.08] rounded-2xl p-4 flex flex-col">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <Flame className="w-4 h-4 text-orange-400" /> Win Streak
            </span>
            <span className="font-mono-numbers text-xl sm:text-2xl font-black text-orange-400">
              {user.current_streak} Wins
            </span>
            <span className="text-[10px] text-slate-500 mt-1">Best: {user.best_streak} in a row</span>
          </div>

          <div className="bg-[#0d111a] border border-white/[0.08] rounded-2xl p-4 flex flex-col">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <Target className="w-4 h-4 text-cyan-400" /> Total Predictions
            </span>
            <span className="font-mono-numbers text-xl sm:text-2xl font-black text-cyan-300">
              {user.total_predictions}
            </span>
            <span className="text-[10px] text-slate-500 mt-1">
              Win rate: {user.total_predictions > 0 ? Math.round((user.total_wins / user.total_predictions) * 100) : 0}%
            </span>
          </div>
        </section>
      )}

      {/* Featured Arena Modes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Arena Game Modes</h2>
            <p className="text-xs text-slate-400">Choose your competitive challenge</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Mode 1: Infinite Market */}
          <Link
            href="/play"
            onClick={() => sounds.playClick()}
            className="group bg-[#0d111a] hover:bg-[#111625] border border-white/[0.08] hover:border-cyan-500/40 rounded-3xl p-6 transition-all flex flex-col justify-between shadow-lg relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider">
                Flagship Mode
              </span>
              <h3 className="text-lg font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors">
                Infinite Synthetic Market
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Live 30-second continuous market simulator. Call UP or DOWN before the 5-second lock and watch the tick chart move in real-time.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-cyan-400 font-bold">
              <span>Launch Market</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Mode 2: Sports Prediction */}
          <Link
            href="/sports"
            onClick={() => sounds.playClick()}
            className="group bg-[#0d111a] hover:bg-[#111625] border border-white/[0.08] hover:border-orange-500/40 rounded-3xl p-6 transition-all flex flex-col justify-between shadow-lg relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-orange-400 font-extrabold uppercase tracking-wider">
                Sports Lobby
              </span>
              <h3 className="text-lg font-bold text-white mt-1 group-hover:text-orange-300 transition-colors">
                Sports Fixture Calls
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Cricket, Football, Basketball, Tennis & Esports. Pick match winners with dynamic Practice Coin multiplier odds.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-orange-400 font-bold">
              <span>View Fixtures</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Mode 3: 1v1 Social Challenges */}
          <Link
            href="/friends"
            onClick={() => sounds.playClick()}
            className="group bg-[#0d111a] hover:bg-[#111625] border border-white/[0.08] hover:border-purple-500/40 rounded-3xl p-6 transition-all flex flex-col justify-between shadow-lg relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-wider">
                Social Competition
              </span>
              <h3 className="text-lg font-bold text-white mt-1 group-hover:text-purple-300 transition-colors">
                Head-to-Head Challenges
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Invite friends to 3, 5, or 10-round 1v1 prediction showdowns or create private rooms with custom rules.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-purple-400 font-bold">
              <span>Challenge Friends</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Split Row: Daily Quests & Top Ranked Players */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Daily Quests */}
        <div className="lg:col-span-7 bg-[#0d111a] border border-white/[0.08] rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Daily Arena Objectives
                </h3>
                <p className="text-xs text-slate-400">Complete objectives to earn bonus XP and Practice Coins</p>
              </div>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                Resets Daily
              </span>
            </div>

            <div className="space-y-3">
              {quests.map((q) => (
                <div key={q.id} className="bg-[#131926] border border-white/[0.06] rounded-2xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      q.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.04] text-slate-400'
                    }`}>
                      {q.completed ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{q.title}</h4>
                      <p className="text-[11px] text-slate-400">{q.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300 font-mono">
                      <span>+{q.coin_reward} Coins</span>
                      <span className="text-cyan-400">+{q.xp_reward} XP</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      q.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.05] text-slate-400'
                    }`}>
                      {q.completed ? 'DONE' : `${q.progress}/${q.target}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-slate-400">Need more coins?</span>
            <button
              onClick={() => {
                sounds.playClick();
                openDailyReward();
              }}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold"
            >
              Claim Daily Streak Bonus →
            </button>
          </div>
        </div>

        {/* Right: Global Top Predictors Podium Preview */}
        <div className="lg:col-span-5 bg-[#0d111a] border border-white/[0.08] rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Leaderboard Leaders
                </h3>
                <p className="text-xs text-slate-400">Highest ranked Arena predictors</p>
              </div>
              <Link
                href="/rankings"
                onClick={() => sounds.playClick()}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-2.5">
              {topPlayers.map((player) => (
                <div
                  key={player.user_id}
                  className="bg-[#131926] border border-white/[0.06] rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                      player.rank === 1 ? 'bg-amber-400 text-black' : player.rank === 2 ? 'bg-slate-300 text-black' : player.rank === 3 ? 'bg-amber-700 text-white' : 'bg-white/10 text-slate-400'
                    }`}>
                      {player.rank}
                    </div>
                    <UserAvatar
                      src={player.avatar_url}
                      alt={player.username}
                      fallbackName={player.username}
                      className="w-8 h-8 rounded-xl ring-1 ring-white/10"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">{player.username}</span>
                      <span className="text-[10px] text-slate-400">{player.accuracy}% Accuracy • {player.streak} Streak</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono-numbers text-xs font-extrabold text-cyan-300 block">
                      {player.rating} Elo
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {player.rank_change > 0 ? `↑ ${player.rank_change}` : '• Stable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/rankings"
            onClick={() => sounds.playClick()}
            className="mt-4 pt-4 border-t border-white/[0.06] text-center text-xs text-slate-400 hover:text-cyan-400 font-bold block"
          >
            Check your personal ranking on the global leaderboard
          </Link>
        </div>
      </section>
    </div>
  );
}
