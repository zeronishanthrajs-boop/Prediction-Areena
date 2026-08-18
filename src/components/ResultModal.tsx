'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Zap, 
  Award, 
  ArrowRight, 
  X,
  Sparkles
} from 'lucide-react';
import { sounds } from '@/lib/audio';
import { Prediction } from '@/lib/types';

interface ResultModalProps {
  prediction: Prediction;
  onClose: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ prediction, onClose }) => {
  const isWin = prediction.result === 'WIN';
  const isDraw = prediction.result === 'DRAW';

  useEffect(() => {
    if (isWin) {
      sounds.playWinFanfare();
      // Trigger festive confetti blast
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00e5ff', '#00e676', '#ffd700', '#a855f7'],
      });
    } else if (!isDraw) {
      sounds.playLossChime();
    }
  }, [isWin, isDraw]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className={`w-full max-w-md bg-[#0d111a] border rounded-3xl p-6 sm:p-7 shadow-2xl relative flex flex-col items-center text-center overflow-hidden ${
        isWin ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-slate-800'
      }`}>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Status Header Badge & Icon */}
        <div className="mb-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl ${
            isWin
              ? 'bg-gradient-to-tr from-emerald-500 to-green-400 text-black shadow-emerald-500/30 ring-4 ring-emerald-500/20 animate-bounce'
              : isDraw
              ? 'bg-amber-500/20 text-amber-300 ring-2 ring-amber-400'
              : 'bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/30'
          }`}>
            {isWin ? <Trophy className="w-8 h-8" /> : isDraw ? <Sparkles className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
          </div>

          <h2 className="text-2xl font-black text-white tracking-wide">
            {isWin ? 'YOU CALLED IT!' : isDraw ? 'MARKET WAS FLAT' : 'ROUND RESOLVED'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isWin
              ? 'Excellent market prediction. Rewards credited to your wallet!'
              : isDraw
              ? 'Market concluded flat. Your stake has been fully refunded.'
              : 'The market moved against your call. Keep analyzing and try the next 30s round!'}
          </p>
        </div>

        {/* Price movement breakdown */}
        <div className="w-full bg-[#131926] border border-white/[0.06] rounded-2xl p-3.5 my-3 flex items-center justify-around font-mono-numbers">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Entry Value</span>
            <span className="text-sm font-bold text-white">
              {prediction.entry_price.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center text-cyan-400 font-bold">
            <ArrowRight className="w-4 h-4 mx-2" />
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Exit Value</span>
            <span className={`text-sm font-bold ${
              (prediction.exit_price || 0) >= prediction.entry_price ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {(prediction.exit_price || prediction.entry_price).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Rewards Earned Grid */}
        <div className="w-full grid grid-cols-3 gap-2 my-2">
          
          {/* Practice Coins */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5 flex flex-col items-center">
            <Coins className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] text-slate-400 font-medium">Practice Coins</span>
            <span className={`text-xs font-bold font-mono-numbers ${isWin ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isWin ? `+${(prediction.payout || 0).toLocaleString()}` : isDraw ? `±${prediction.stake}` : `-${prediction.stake}`}
            </span>
          </div>

          {/* XP */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5 flex flex-col items-center">
            <Zap className="w-4 h-4 text-cyan-400 mb-1" />
            <span className="text-[10px] text-slate-400 font-medium">XP Gained</span>
            <span className="text-xs font-bold text-cyan-300 font-mono-numbers">
              +{prediction.xp_awarded || (isWin ? 40 : 15)} XP
            </span>
          </div>

          {/* Elo Rating */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5 flex flex-col items-center">
            <Award className="w-4 h-4 text-purple-400 mb-1" />
            <span className="text-[10px] text-slate-400 font-medium">Rating</span>
            <span className={`text-xs font-bold font-mono-numbers ${
              (prediction.rating_delta || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {(prediction.rating_delta || 0) >= 0 ? `+${prediction.rating_delta || 16}` : `${prediction.rating_delta || -10}`}
            </span>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95"
        >
          Continue to Next Round
        </button>
      </div>
    </div>
  );
};
