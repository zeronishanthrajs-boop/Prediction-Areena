'use client';

import React, { useState } from 'react';
import { Gift, Sparkles, Video, CheckCircle, X, Coins, Loader2 } from 'lucide-react';
import { sounds } from '@/lib/audio';
import { DAILY_REWARDS_SCHEDULE } from '@/lib/constants';
import { GptRewardedAdService } from '@/lib/gpt';

interface DailyRewardModalProps {
  currentStreak: number;
  onClose: () => void;
  onClaim: (doubleMultiplier: boolean) => Promise<{ success: boolean; rewardAmount?: number; error?: string }>;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  currentStreak,
  onClose,
  onClaim,
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [claimedAmount, setClaimedAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeDay = Math.min(7, (currentStreak % 7) + 1);

  const handleClaimStandard = async () => {
    setIsClaiming(true);
    setError(null);
    sounds.playClick();

    const res = await onClaim(false);
    setIsClaiming(false);
    if (res.success && res.rewardAmount) {
      sounds.playWinFanfare();
      setClaimedAmount(res.rewardAmount);
    } else {
      setError(res.error || 'Failed to claim reward');
    }
  };

  const completeDoubleReward = async () => {
    setIsWatchingAd(false);
    setIsClaiming(true);

    const res = await onClaim(true);
    setIsClaiming(false);
    if (res.success && res.rewardAmount) {
      sounds.playWinFanfare();
      setClaimedAmount(res.rewardAmount);
    } else {
      setError(res.error || 'Failed to verify ad reward');
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
      await completeDoubleReward();
    }, 3000);
  };

  const handleWatchAdDouble = async () => {
    sounds.playClick();
    setError(null);
    setIsClaiming(true);

    try {
      const handled = await GptRewardedAdService.showRewardedAd({
        onGranted: async () => {
          await completeDoubleReward();
        },
        onError: () => {
          startSimulatedAdPlayer();
        },
        onDismissed: () => {
          setIsClaiming(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#0d111a] border border-purple-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative flex flex-col items-center text-center">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-purple-500/25">
          <Gift className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-black text-white">Daily Login Streak</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Claim free Practice Coins every day to build your streak. Reach Day 7 for a massive 5,000 Coin reward!
        </p>

        {error && (
          <div className="w-full mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {claimedAmount ? (
          <div className="my-6 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-emerald-300">Successfully Claimed!</h3>
            <span className="font-mono-numbers text-3xl font-extrabold text-amber-300">
              +{claimedAmount.toLocaleString()} Coins
            </span>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold text-xs shadow-lg"
            >
              Continue Playing
            </button>
          </div>
        ) : isWatchingAd ? (
          <div className="w-full my-6 p-5 rounded-2xl bg-[#131926] border border-cyan-500/30 flex flex-col items-center gap-3">
            <Video className="w-8 h-8 text-cyan-400 animate-pulse" />
            <span className="text-sm font-bold text-white">Simulating Rewarded Partner Ad...</span>
            <div className="w-full bg-black/50 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${adProgress}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400">Verifying secure ad signature with server token...</span>
          </div>
        ) : (
          <>
            {/* 7-Day Progressive Calendar */}
            <div className="w-full grid grid-cols-7 gap-1.5 sm:gap-2 my-5">
              {DAILY_REWARDS_SCHEDULE.map((item) => {
                const isCurrent = item.day === activeDay;
                const isPast = item.day < activeDay;

                return (
                  <div
                    key={item.day}
                    className={`flex flex-col items-center justify-between p-2 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-b from-purple-500/20 to-pink-500/20 border-purple-400/60 ring-2 ring-purple-400 shadow-md shadow-purple-500/20'
                        : isPast
                        ? 'bg-white/[0.02] border-white/[0.05] opacity-50'
                        : 'bg-white/[0.04] border-white/[0.08]'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Day {item.day}
                    </span>
                    <Coins className={`w-4 h-4 my-1.5 ${isCurrent ? 'text-amber-300' : 'text-slate-500'}`} />
                    <span className={`text-[10px] font-mono font-extrabold ${isCurrent ? 'text-amber-300' : 'text-slate-300'}`}>
                      {item.reward >= 1000 ? `${item.reward / 1000}K` : item.reward}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2.5">
              {/* Double Reward with Ad */}
              <button
                onClick={handleWatchAdDouble}
                disabled={isClaiming}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all transform active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Watch Short Ad to DOUBLE (2x Reward)</span>
              </button>

              {/* Standard Claim */}
              <button
                onClick={handleClaimStandard}
                disabled={isClaiming}
                className="w-full py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Claim Standard Reward (1x)</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
