'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Crown, 
  Flame, 
  Target, 
  Award, 
  TrendingUp, 
  Users, 
  Clock, 
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sounds } from '@/lib/audio';
import { LeaderboardEntry } from '@/lib/types';
import { UserAvatar } from '@/components/UserAvatar';

export default function RankingsPage() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'global' | 'friends' | 'weekly' | 'monthly' | 'all-time'>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'global', label: 'Global' },
    { id: 'friends', label: 'Friends' },
    { id: 'weekly', label: 'Weekly Season' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'all-time', label: 'All-Time' },
  ];

  const loadLeaderboard = async (tab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?tab=${tab}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setCurrentUserEntry(data.currentUserEntry || null);
      }
    } catch (e) {
      console.error('Error loading leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard(activeTab);
  }, [activeTab]);

  const top3 = entries.slice(0, 3);
  const remainingEntries = entries.slice(3);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 animate-fade-in pb-24 sm:pb-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0d111a] via-[#1a1c26] to-[#0d111a] border border-amber-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1 sm:space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" /> Skill-Based Ranking System
          </div>
          <h1 className="text-xl sm:text-4xl font-black text-white">
            Arena Leaderboards
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-400 max-w-xl">
            Ranked by Elo prediction skill rating, win streaks, and forecast accuracy.
          </p>
        </div>
      </div>

      {/* Tab switcher — separate scrollable row below header */}
      <div className="flex items-center gap-1.5 bg-[#0d111a] border border-white/10 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playClick();
                setActiveTab(tab.id as typeof activeTab);
              }}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Top 3 Podium Section */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          
          {/* 2nd Place */}
          {top3[1] && (
            <div className="order-2 md:order-1 bg-[#0d111a] border border-slate-700/60 rounded-3xl p-6 flex flex-col items-center text-center justify-between shadow-xl relative mt-4 md:mt-6">
              <div className="w-10 h-10 rounded-full bg-slate-300 text-black font-black flex items-center justify-center -mt-10 mb-2 shadow-lg ring-4 ring-[#0d111a]">
                2
              </div>
              <UserAvatar
                src={top3[1].avatar_url}
                alt={top3[1].username}
                fallbackName={top3[1].username}
                className="w-16 h-16 rounded-2xl ring-2 ring-slate-400/50 mb-3"
              />
              <div>
                <h3 className="text-base font-bold text-white">{top3[1].username}</h3>
                <span className="text-xs text-slate-400">{top3[1].accuracy}% Accuracy • {top3[1].streak} Streak</span>
              </div>
              <div className="my-3 px-4 py-1.5 bg-slate-400/10 border border-slate-400/30 rounded-xl font-mono text-sm font-black text-slate-200">
                {top3[1].rating} Elo
              </div>
              <span className="text-[11px] text-slate-500">Silver Predictor</span>
            </div>
          )}

          {/* 1st Place (Gold Champion) */}
          {top3[0] && (
            <div className="order-1 md:order-2 bg-gradient-to-b from-[#191e2b] to-[#0d111a] border border-amber-400/60 rounded-3xl p-7 flex flex-col items-center text-center justify-between shadow-2xl relative shadow-amber-500/10 scale-105 z-10">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-black font-black flex items-center justify-center -mt-12 mb-2 shadow-xl ring-4 ring-[#0d111a] animate-bounce">
                <Crown className="w-6 h-6 fill-current" />
              </div>
              <UserAvatar
                src={top3[0].avatar_url}
                alt={top3[0].username}
                fallbackName={top3[0].username}
                className="w-20 h-20 rounded-2xl ring-4 ring-amber-400/80 mb-3 shadow-lg shadow-amber-500/20"
              />
              <div>
                <h3 className="text-lg font-black text-white flex items-center justify-center gap-1.5">
                  {top3[0].username} <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <span className="text-xs text-amber-300/80 font-semibold">{top3[0].accuracy}% Accuracy • {top3[0].streak} Streak</span>
              </div>
              <div className="my-3 px-5 py-2 bg-amber-500/20 border border-amber-400/50 rounded-xl font-mono text-base font-black text-amber-300 shadow-md">
                {top3[0].rating} Elo
              </div>
              <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider">
                Arena Grandmaster #1
              </span>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="order-3 bg-[#0d111a] border border-amber-800/60 rounded-3xl p-6 flex flex-col items-center text-center justify-between shadow-xl relative mt-4 md:mt-6">
              <div className="w-10 h-10 rounded-full bg-amber-700 text-white font-black flex items-center justify-center -mt-10 mb-2 shadow-lg ring-4 ring-[#0d111a]">
                3
              </div>
              <UserAvatar
                src={top3[2].avatar_url}
                alt={top3[2].username}
                fallbackName={top3[2].username}
                className="w-16 h-16 rounded-2xl ring-2 ring-amber-700/50 mb-3"
              />
              <div>
                <h3 className="text-base font-bold text-white">{top3[2].username}</h3>
                <span className="text-xs text-slate-400">{top3[2].accuracy}% Accuracy • {top3[2].streak} Streak</span>
              </div>
              <div className="my-3 px-4 py-1.5 bg-amber-800/20 border border-amber-800/40 rounded-xl font-mono text-sm font-black text-amber-400">
                {top3[2].rating} Elo
              </div>
              <span className="text-[11px] text-slate-500">Bronze Predictor</span>
            </div>
          )}
        </div>
      )}

      {/* Ranked Table */}
      <div className="bg-[#0d111a] border border-white/[0.08] rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-white/[0.06] pb-2">
                <th className="py-2.5 px-3 font-semibold">Rank</th>
                <th className="py-2.5 px-3 font-semibold">Predictor</th>
                <th className="py-2.5 px-3 font-semibold text-center">Movement</th>
                <th className="py-2.5 px-3 font-semibold text-center">Win Accuracy</th>
                <th className="py-2.5 px-3 font-semibold text-center">Streak</th>
                <th className="py-2.5 px-3 font-semibold text-right">Skill Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono-numbers">
              {entries.map((entry) => {
                const isCurrent = entry.is_current_user;
                return (
                  <tr
                    key={entry.user_id}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-cyan-500/10 border-y border-cyan-500/40 font-bold'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                        entry.rank === 1 ? 'bg-amber-400 text-black' : entry.rank === 2 ? 'bg-slate-300 text-black' : entry.rank === 3 ? 'bg-amber-700 text-white' : 'bg-white/[0.05] text-slate-400'
                      }`}>
                        {entry.rank}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          src={entry.avatar_url}
                          alt={entry.username}
                          fallbackName={entry.username}
                          className="w-8 h-8 rounded-xl ring-1 ring-white/10"
                        />
                        <div>
                          <span className="font-bold text-white block">
                            {entry.username} {isCurrent && <span className="text-[10px] text-cyan-400 font-extrabold ml-1">(YOU)</span>}
                          </span>
                          <span className="text-[10px] text-slate-500">{entry.total_predictions} Total Calls</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {entry.rank_change > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <ArrowUp className="w-3 h-3" /> {entry.rank_change}
                        </span>
                      ) : entry.rank_change < 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                          <ArrowDown className="w-3 h-3" /> {Math.abs(entry.rank_change)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] text-slate-500">
                          <Minus className="w-3 h-3" />
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center text-slate-300 font-bold">
                      {entry.accuracy}%
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-orange-400 font-bold text-xs">
                        <Flame className="w-3.5 h-3.5" /> {entry.streak}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span className="text-sm font-extrabold text-cyan-300 font-mono">
                        {entry.rating} Elo
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
  );
}
