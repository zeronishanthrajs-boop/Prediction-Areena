'use client';

import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Trophy, 
  Award, 
  Flame, 
  Coins, 
  Target, 
  Zap, 
  CheckCircle2, 
  Lock, 
  History, 
  Sparkles,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Camera
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sounds } from '@/lib/audio';
import { Achievement, WalletTransaction, Prediction } from '@/lib/types';
import { UserAvatar } from '@/components/UserAvatar';
import { AvatarPickerModal } from '@/components/AvatarPickerModal';

export default function ProfilePage() {
  const { user, wallet, openAuth, logout, refreshSession } = useApp();
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [activeTab, setActiveTab] = useState<'achievements' | 'transactions' | 'predictions'>('achievements');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const [profRes, txRes, predRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/wallet/transactions?limit=30'),
          fetch('/api/prediction/history?limit=30'),
        ]);

        if (profRes.ok) {
          const pData = await profRes.json();
          setProfileData(pData.user || null);
          setAchievements(pData.achievements || []);
        }

        if (txRes.ok) {
          const tData = await txRes.json();
          setTransactions(tData.transactions || []);
        }

        if (predRes.ok) {
          const prData = await predRes.json();
          setPredictions(prData.predictions || []);
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      }
    }

    loadProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Player Profile</h2>
        <p className="text-xs text-slate-400">
          Sign in or switch to a demo account to view your forecasting records, Elo rating, and unlocked achievements.
        </p>
        <button
          onClick={() => {
            sounds.playClick();
            openAuth();
          }}
          className="px-6 py-3 rounded-xl bg-cyan-500 text-black font-extrabold text-xs shadow-lg"
        >
          Sign In / Demo Login
        </button>
      </div>
    );
  }

  const rankInfo = (profileData?.rankInfo as {
    rank: { name: string; level: number };
    nextRank?: { name: string; level: number };
    progressPercent: number;
    xpToNext: number;
  }) || {
    rank: { name: 'Predictor', level: user.level },
    progressPercent: 50,
    xpToNext: 200,
  };

  const accuracy = user.total_predictions > 0 ? Math.round((user.total_wins / user.total_predictions) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 animate-fade-in pb-24 sm:pb-8">
      
      {/* Player Profile Hero Card */}
      <div className="bg-[#0d111a] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* Interactive Avatar with Hover Change Overlay */}
            <div 
              className="relative group cursor-pointer"
              onClick={() => { sounds.playClick(); setIsAvatarModalOpen(true); }}
              title="Click to change profile picture"
            >
              <UserAvatar
                src={user.avatar_url}
                alt={user.username}
                fallbackName={user.username}
                className="w-24 h-24 rounded-3xl ring-4 ring-cyan-500/40 shadow-xl shadow-cyan-500/20"
              />
              <div className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-xs">
                <Camera className="w-6 h-6 text-cyan-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Change</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{user.username}</h1>
                <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-full font-bold font-mono">
                  Level {user.level}
                </span>
              </div>
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                {rankInfo.rank.name}
              </p>
              <span className="text-[11px] text-slate-400 block font-mono">
                {user.email} • Member since {new Date(user.created_at).toLocaleDateString()}
              </span>
              <div className="pt-1 flex justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => { sounds.playClick(); setIsAvatarModalOpen(true); }}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-400/40 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Change Profile Picture</span>
                </button>
              </div>
            </div>
          </div>

          {/* Practice Coin Card */}
          <div className="bg-[#131926] border border-amber-500/30 rounded-2xl p-4 flex flex-col items-center sm:items-end text-center sm:text-right min-w-[200px]">
            <span className="text-xs text-amber-400/80 font-bold uppercase tracking-wider flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" /> Virtual Balance
            </span>
            <span className="font-mono-numbers text-2xl font-black text-amber-300 mt-1">
              {(wallet?.balance || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Practice Coins Only</span>
          </div>
        </div>

        {/* XP Level Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" /> XP Progress: <strong className="text-white">{user.xp.toLocaleString()} XP</strong>
            </span>
            <span className="text-cyan-400 font-bold">
              {rankInfo.nextRank ? `${rankInfo.xpToNext} XP to ${rankInfo.nextRank.name}` : 'Max Rank Achieved'}
            </span>
          </div>

          <div className="w-full bg-[#07090e] rounded-full h-3 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-full rounded-full transition-all duration-500 shadow-md shadow-cyan-500/50"
              style={{ width: `${rankInfo.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0d111a] border border-white/[0.08] rounded-2xl p-4 flex flex-col">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
            <Award className="w-4 h-4 text-purple-400" /> Elo Skill Rating
          </span>
          <span className="font-mono-numbers text-2xl font-black text-purple-300">
            {user.rating}
          </span>
          <span className="text-[10px] text-slate-500 mt-1">Based on forecasting accuracy</span>
        </div>

        <div className="bg-[#0d111a] border border-white/[0.08] rounded-2xl p-4 flex flex-col">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
            <Target className="w-4 h-4 text-emerald-400" /> Win Accuracy
          </span>
          <span className="font-mono-numbers text-2xl font-black text-emerald-400">
            {accuracy}%
          </span>
          <span className="text-[10px] text-slate-500 mt-1">{user.total_wins} wins of {user.total_predictions} calls</span>
        </div>

        <div className="bg-[#0d111a] border border-white/[0.08] rounded-2xl p-4 flex flex-col">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
            <Flame className="w-4 h-4 text-orange-400" /> Current / Best Streak
          </span>
          <span className="font-mono-numbers text-2xl font-black text-orange-400">
            {user.current_streak} <span className="text-xs text-slate-500 font-normal">/ {user.best_streak}</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-1">Consecutive round wins</span>
        </div>

        <div className="bg-[#0d111a] border border-white/[0.08] rounded-2xl p-4 flex flex-col">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
            <Sparkles className="w-4 h-4 text-amber-400" /> Daily Streak
          </span>
          <span className="font-mono-numbers text-2xl font-black text-amber-300">
            {user.daily_streak || 0} Days
          </span>
          <span className="text-[10px] text-slate-500 mt-1">Consecutive logins</span>
        </div>
      </div>

      {/* Tabs: Achievements, Transactions, Predictions */}
      <div className="flex items-center gap-2 bg-[#0d111a] border border-white/10 p-1.5 rounded-2xl w-fit text-xs font-bold">
        <button
          onClick={() => { sounds.playClick(); setActiveTab('achievements'); }}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'achievements' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Achievements ({achievements.filter((a) => a.unlocked_at).length}/{achievements.length})
        </button>
        <button
          onClick={() => { sounds.playClick(); setActiveTab('predictions'); }}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'predictions' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Recent Calls ({predictions.length})
        </button>
        <button
          onClick={() => { sounds.playClick(); setActiveTab('transactions'); }}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'transactions' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Coin Ledger ({transactions.length})
        </button>
      </div>

      {/* TAB 1: ACHIEVEMENTS */}
      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => {
            const isUnlocked = Boolean(ach.unlocked_at);
            return (
              <div
                key={ach.id}
                className={`rounded-3xl p-5 border transition-all flex flex-col justify-between gap-3 ${
                  isUnlocked
                    ? 'bg-gradient-to-b from-[#161f30] to-[#0d111a] border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-[#0d111a] border-white/[0.06] opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isUnlocked
                      ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-white/[0.04] text-slate-500'
                  }`}>
                    {isUnlocked ? <Trophy className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isUnlocked ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-white/[0.05] text-slate-500'
                  }`}>
                    {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{ach.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{ach.description}</p>
                </div>

                {/* Progress bar if locked */}
                {!isUnlocked && (
                  <div className="w-full space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Progress</span>
                      <span>{ach.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-[#07090e] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full rounded-full"
                        style={{ width: `${ach.progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono font-bold">
                  <span className="text-amber-400">+{ach.coin_reward} Coins</span>
                  <span className="text-cyan-400">+{ach.xp_reward} XP</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: RECENT PREDICTIONS */}
      {activeTab === 'predictions' && (
        <div className="bg-[#0d111a] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-numbers">
              <thead>
                <tr className="text-slate-500 border-b border-white/[0.06] pb-2 font-sans">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Market</th>
                  <th className="py-2.5 px-3">Call</th>
                  <th className="py-2.5 px-3">Stake</th>
                  <th className="py-2.5 px-3">Entry → Exit</th>
                  <th className="py-2.5 px-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {predictions.map((p) => {
                  const isWin = p.result === 'WIN';
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3 text-slate-400 font-sans">
                        {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 text-white font-sans font-bold">
                        {p.market_id}
                      </td>
                      <td className="py-3 px-3 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans inline-flex items-center gap-1 ${
                          p.direction === 'UP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {p.direction === 'UP' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {p.direction}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-amber-300 font-bold">{p.stake}</td>
                      <td className="py-3 px-3 text-slate-300">
                        {p.entry_price.toFixed(2)} → {p.exit_price ? p.exit_price.toFixed(2) : '...'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans ${
                          isWin ? 'bg-emerald-500/20 text-emerald-400' : p.result === 'DRAW' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {isWin ? `WIN (+${p.payout})` : p.result}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTION LEDGER */}
      {activeTab === 'transactions' && (
        <div className="bg-[#0d111a] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-numbers">
              <thead>
                <tr className="text-slate-500 border-b border-white/[0.06] pb-2 font-sans">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3 text-slate-400 font-sans">
                        {new Date(tx.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 uppercase">
                          {tx.type}
                        </span>
                      </td>
                      <td className={`py-3 px-3 font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? `+${tx.amount.toLocaleString()}` : `${tx.amount.toLocaleString()}`}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-300">
                        {tx.balance_after.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Avatar Selection Modal */}
      {user && (
        <AvatarPickerModal
          isOpen={isAvatarModalOpen}
          currentAvatar={user.avatar_url || ''}
          username={user.username}
          onClose={() => setIsAvatarModalOpen(false)}
          onSuccess={async () => {
            await refreshSession();
          }}
        />
      )}
    </div>
  );
}
