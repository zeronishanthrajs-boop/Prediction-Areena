'use client';

import React, { useState } from 'react';
import { Video, Coins, ShieldCheck, X, Loader2, Sparkles, CheckCircle2, Play } from 'lucide-react';
import { sounds } from '@/lib/audio';
import { GptRewardedAdService } from '@/lib/gpt';

interface RefillModalProps {
  onClose: () => void;
  onRefill: () => Promise<{ success: boolean; refillAmount?: number; error?: string }>;
}

export const RefillModal: React.FC<RefillModalProps> = ({ onClose, onRefill }) => {
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successAmount, setSuccessAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completeReward = async () => {
    setIsWatchingAd(false);
    setIsSubmitting(true);
    const res = await onRefill();
    setIsSubmitting(false);

    if (res.success) {
      sounds.playWinFanfare();
      setSuccessAmount(res.refillAmount || 1000);
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setError(res.error || 'Refill failed');
    }
  };

  const startSimulatedAdPlayer = () => {
    setIsWatchingAd(true);
    setAdProgress(0);
    setError(null);

    const interval = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 34;
      });
    }, 800);

    setTimeout(async () => {
      clearInterval(interval);
      await completeReward();
    }, 3000);
  };

  const handleWatchAdRefill = async () => {
    sounds.playClick();
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Try Google Publisher Tag official Rewarded Web Ad
      const handled = await GptRewardedAdService.showRewardedAd({
        onGranted: async () => {
          await completeReward();
        },
        onError: () => {
          startSimulatedAdPlayer();
        },
        onDismissed: () => {
          setIsSubmitting(false);
        },
      });

      if (!handled) {
        startSimulatedAdPlayer();
      }
    } catch {
      startSimulatedAdPlayer();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-[#0d111a] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative flex flex-col items-center text-center">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-black flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/25">
          <Video className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-black text-white">Watch Ad for Coins</h2>
        <p className="text-xs text-slate-400 mt-1">
          Want more coins? Watch a short ad to claim an instant <strong className="text-amber-300">+1,000 Practice Coins</strong> boost anytime!
        </p>

        {error && (
          <div className="w-full mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Reward Highlight Box */}
        <div className="my-5 bg-[#131926] border border-amber-500/30 rounded-2xl p-4 w-full flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-2">
            <Coins className="w-7 h-7 text-amber-400" />
            <span className="font-mono-numbers text-2xl font-black text-amber-300">+1,000 Coins</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> 1 Ad = +1,000 Coins • Watch Anytime
          </span>
        </div>

        {/* Watching Ad State */}
        {isWatchingAd ? (
          <div className="w-full space-y-3 py-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-cyan-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Playing Sponsored Ad...
              </span>
              <span className="font-mono">{Math.min(100, adProgress)}%</span>
            </div>
            <div className="w-full bg-[#131926] rounded-full h-3 overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-700 shadow-md shadow-cyan-500/50"
                style={{ width: `${Math.min(100, adProgress)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">Reward will unlock immediately after completion</p>
          </div>
        ) : successAmount ? (
          <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>+1,000 Practice Coins Added to Wallet!</span>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-2">
            <button
              onClick={handleWatchAdRefill}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-sm shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading Ad...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Watch Ad to Get +1,000 Coins</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> 100% Free Virtual Currency • Boost your balance anytime
            </span>
          </div>
        )}

      </div>
    </div>
  );
};
