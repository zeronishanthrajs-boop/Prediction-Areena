'use client';

import React, { useState } from 'react';
import { LogIn, UserPlus, Zap, Sparkles, X, Loader2 } from 'lucide-react';
import { sounds } from '@/lib/audio';
import { clearGuestWallet } from '@/lib/guestWallet';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      clearGuestWallet();
      sounds.playWinFanfare();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sign up failed');
      }

      clearGuestWallet();
      sounds.playWinFanfare();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0d111a] border border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative flex flex-col">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand mark */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-black">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Prediction Arena</h2>
            <p className="text-[11px] text-slate-400">Join the competitive social simulation arena</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-[#131926] p-1 rounded-xl mb-4 text-xs font-bold">
          <button
            onClick={() => { sounds.playClick(); setTab('signin'); setError(null); }}
            className={`py-2.5 rounded-lg transition-all ${
              tab === 'signin' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { sounds.playClick(); setTab('signup'); setError(null); }}
            className={`py-2.5 rounded-lg transition-all ${
              tab === 'signup' ? 'bg-emerald-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register (+10K Coins)
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Sign In Tab */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Username or Email</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. NovaPredictor"
                className="w-full bg-[#131926] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#131926] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>Sign In</span>
            </button>
            <p className="text-center text-[11px] text-slate-500 pt-1">
              Don't have an account?{' '}
              <button type="button" onClick={() => { setTab('signup'); setError(null); }} className="text-cyan-400 hover:underline">
                Create one free →
              </button>
            </p>
          </form>
        )}

        {/* Sign Up Tab */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>Includes <strong>10,000 Practice Coins</strong> starting bonus + full leaderboard tracking!</span>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. NovaPredictor"
                className="w-full bg-[#131926] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-[#131926] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 4 characters"
                className="w-full bg-[#131926] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>Create Account & Get 10,000 Coins</span>
            </button>
            <p className="text-center text-[11px] text-slate-500 pt-1">
              Already registered?{' '}
              <button type="button" onClick={() => { setTab('signin'); setError(null); }} className="text-cyan-400 hover:underline">
                Sign in →
              </button>
            </p>
          </form>
        )}

        {/* Guest note at bottom */}
        <p className="text-center text-[10px] text-slate-600 mt-4 pt-3 border-t border-white/[0.05]">
          Just visiting? Close this to try <strong className="text-slate-500">500 free trial coins</strong> without an account.
        </p>
      </div>
    </div>
  );
};
