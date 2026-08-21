'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Users, 
  Coins, 
  Sliders, 
  CheckCircle2, 
  Ban, 
  PlusCircle, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sounds } from '@/lib/audio';
import { Market, User } from '@/lib/types';
import { UserAvatar } from '@/components/UserAvatar';

export default function AdminPage() {
  const { user, openAuth } = useApp();
  const [metrics, setMetrics] = useState<{
    totalUsers: number;
    totalPredictions: number;
    totalVolume: number;
    totalCoinsCirculating: number;
  } | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [usersList, setUsersList] = useState<Array<User & { balance: number }>>([]);
  const [auditLogs, setAuditLogs] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics || null);
        setMarkets(data.markets || []);
        setUsersList(data.users || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Admin Console Restricted</h2>
        <p className="text-xs text-slate-400">
          This portal requires administrator privileges. Use the Quick Demo button in the login modal to test as Admin.
        </p>
        <button
          onClick={() => {
            sounds.playClick();
            openAuth();
          }}
          className="px-6 py-3 rounded-xl bg-purple-500 text-white font-extrabold text-xs shadow-lg"
        >
          Open Demo Login (Select Admin)
        </button>
      </div>
    );
  }

  const handleUpdateMarket = async (marketId: string, volatility: number, profile: string) => {
    sounds.playClick();
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_MARKET',
          marketId,
          volatility,
          profile,
        }),
      });
      if (res.ok) {
        sounds.playWinFanfare();
        setFeedback(`Updated market ${marketId} configuration`);
        loadAdminData();
      }
    } catch {
      setFeedback('Failed to update market');
    }
  };

  const handleAdjustCoins = async (targetUserId: string, adjustmentCoins: number) => {
    sounds.playClick();
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADJUST_COINS',
          targetUserId,
          adjustmentCoins,
        }),
      });
      if (res.ok) {
        sounds.playWinFanfare();
        setFeedback(`Adjusted coins for user`);
        loadAdminData();
      }
    } catch {
      setFeedback('Failed to adjust coins');
    }
  };

  const handleModerateUser = async (targetUserId: string, isBanned: boolean) => {
    sounds.playClick();
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MODERATE_USER',
          targetUserId,
          isBanned,
        }),
      });
      if (res.ok) {
        setFeedback(`User moderation status updated`);
        loadAdminData();
      }
    } catch {
      setFeedback('Failed to moderate user');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0d111a] via-[#1c142c] to-[#0d111a] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" /> Operations & Simulation Control
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Admin Master Console
          </h1>
          <p className="text-xs text-slate-400">
            Monitor real-time market engines, inspect game volume, configure brownian volatility, and moderate accounts.
          </p>
        </div>

        <button
          onClick={() => { sounds.playClick(); loadAdminData(); }}
          className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-bold flex items-center gap-2 text-slate-200"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">×</button>
        </div>
      )}

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0d111a] border border-white/[0.08] rounded-2xl p-4 flex flex-col">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <Users className="w-4 h-4 text-cyan-400" /> Total Users
            </span>
            <span className="font-mono-numbers text-2xl font-black text-white">
              {metrics.totalUsers.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#0d111a] border border-white/[0.08] rounded-2xl p-4 flex flex-col">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <Activity className="w-4 h-4 text-emerald-400" /> Predictions Executed
            </span>
            <span className="font-mono-numbers text-2xl font-black text-emerald-400">
              {metrics.totalPredictions.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#0d111a] border border-white/[0.08] rounded-2xl p-4 flex flex-col">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <Coins className="w-4 h-4 text-amber-400" /> Total Stake Volume
            </span>
            <span className="font-mono-numbers text-2xl font-black text-amber-300">
              {metrics.totalVolume.toLocaleString()} Coins
            </span>
          </div>

          <div className="bg-[#0d111a] border border-white/[0.08] rounded-2xl p-4 flex flex-col">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <Coins className="w-4 h-4 text-purple-400" /> Circulating Coins
            </span>
            <span className="font-mono-numbers text-2xl font-black text-purple-300">
              {metrics.totalCoinsCirculating.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Market Engine Control Grid */}
      <div className="bg-[#0d111a] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" /> Synthetic Market Profile & Volatility Engine
            </h3>
            <p className="text-xs text-slate-400">Adjust the brownian motion parameterization per market in real-time</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {markets.map((m) => (
            <div key={m.id} className="bg-[#131926] border border-white/[0.06] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{m.name}</h4>
                  <span className="text-[10px] text-cyan-400 font-mono">{m.symbol} • Base: {m.base_price}</span>
                </div>
                <span className="text-[10px] bg-white/[0.05] text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                  {m.status}
                </span>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Profile Mode</label>
                <select
                  defaultValue={m.profile}
                  onChange={(e) => handleUpdateMarket(m.id, m.volatility, e.target.value)}
                  className="w-full bg-[#07090e] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="STABLE">STABLE (Low Noise)</option>
                  <option value="VOLATILE">VOLATILE (High Jumps)</option>
                  <option value="MOMENTUM">MOMENTUM (Auto-Correlated)</option>
                  <option value="REVERSAL">REVERSAL (Oscillating)</option>
                  <option value="CHAOS">CHAOS (Regime Shifts)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Volatility Coefficient (Current: {(m.volatility * 100).toFixed(2)}%)
                </label>
                <input
                  type="range"
                  min="0.001"
                  max="0.02"
                  step="0.001"
                  defaultValue={m.volatility}
                  onChange={(e) => handleUpdateMarket(m.id, parseFloat(e.target.value), m.profile)}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Moderation Table */}
      <div className="bg-[#0d111a] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" /> User Accounts & Practice Balance Adjuster
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-numbers">
            <thead>
              <tr className="text-slate-500 border-b border-white/[0.06] pb-2 font-sans">
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Rating</th>
                <th className="py-2.5 px-3">Practice Balance</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-sans">
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        src={u.avatar_url}
                        alt={u.username}
                        fallbackName={u.username}
                        className="w-6 h-6 rounded-lg ring-1 ring-white/10"
                      />
                      <div>
                        <span className="font-bold text-white block">{u.username}</span>
                        <span className="text-[10px] text-slate-500">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/[0.05] text-slate-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-cyan-300 font-bold">{u.rating} Elo</td>
                  <td className="py-3 px-3 text-amber-300 font-bold">{(u.balance || 0).toLocaleString()} Coins</td>
                  <td className="py-3 px-3 text-right font-sans space-x-1.5">
                    <button
                      onClick={() => handleAdjustCoins(u.id, 5000)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold"
                      title="Grant +5,000 Practice Coins"
                    >
                      +5K Coins
                    </button>
                    {u.is_banned ? (
                      <button
                        onClick={() => handleModerateUser(u.id, false)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-bold"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        onClick={() => handleModerateUser(u.id, true)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-[11px] font-bold"
                      >
                        Ban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
