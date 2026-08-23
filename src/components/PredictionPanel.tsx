'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Lock, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { sounds } from '@/lib/audio';
import { MarketRound, Prediction } from '@/lib/types';

interface PredictionPanelProps {
  balance: number;
  activeRound: MarketRound | null;
  timeRemaining: number;
  lockRemaining: number;
  currentPrice: number;
  activeUserPrediction: Prediction | null;
  onPlacePrediction: (direction: 'UP' | 'DOWN', stake: number) => Promise<void>;
  isLoading?: boolean;
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  balance,
  activeRound,
  timeRemaining,
  lockRemaining,
  currentPrice,
  activeUserPrediction,
  onPlacePrediction,
  isLoading = false,
}) => {
  const [stake, setStake] = useState<number>(500);
  const [customStakeInput, setCustomStakeInput] = useState<string>('500');

  const stakeChips = [100, 250, 500, 1000, 2500];

  const handleChipClick = (amount: number) => {
    sounds.playClick();
    const finalAmount = Math.min(amount, balance);
    setStake(finalAmount);
    setCustomStakeInput(String(finalAmount));
  };

  const handleMaxClick = () => {
    sounds.playClick();
    const maxAllowed = Math.min(balance, 10000);
    setStake(maxAllowed);
    setCustomStakeInput(String(maxAllowed));
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomStakeInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setStake(Math.min(balance, num));
    }
  };

  const handlePredict = async (direction: 'UP' | 'DOWN') => {
    if (isLocked || isLoading || balance < stake || stake < 50) return;
    sounds.playBetPlaced();
    await onPlacePrediction(direction, stake);
  };

  const isLocked = lockRemaining <= 0 || activeRound?.status === 'LOCKED' || activeRound?.status === 'RESOLVED';
  const payoutPotential = Math.floor(stake * 1.90);

  // Active prediction live status
  let isCurrentlyWinning = false;
  if (activeUserPrediction && activeUserPrediction.entry_price) {
    if (activeUserPrediction.direction === 'UP') {
      isCurrentlyWinning = currentPrice >= activeUserPrediction.entry_price;
    } else {
      isCurrentlyWinning = currentPrice <= activeUserPrediction.entry_price;
    }
  }

  return (
    <div className="w-full bg-[#0d111a]/95 border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl backdrop-blur-xl relative overflow-hidden">
      
      {/* Top Header: Round Timer & Status */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-400 font-medium">Round #{activeRound?.round_number || 1}</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            isLocked
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
          }`}>
            {isLocked ? 'LOCKED • RESOLVING' : 'OPEN FOR PREDICTIONS'}
          </span>
        </div>

        {/* 30s Countdown Display */}
        <div className="flex items-center gap-1.5 font-mono-numbers">
          <span className="text-xs text-slate-400">Time Left:</span>
          <div className={`px-2.5 py-1 rounded-lg font-bold text-sm flex items-center gap-1 ${
            timeRemaining <= 5
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-bounce'
              : 'bg-white/[0.06] text-white border border-white/[0.1]'
          }`}>
            <span>00:{timeRemaining < 10 ? `0${timeRemaining}` : timeRemaining}</span>
          </div>
        </div>
      </div>

      {/* Active Bet Live Floating Banner (if user already made a call for this round) */}
      {activeUserPrediction ? (
        <div className={`rounded-xl p-3.5 border transition-all ${
          isCurrentlyWinning
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/10'
            : 'bg-rose-500/10 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-500/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Your Call:</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-extrabold flex items-center gap-1 ${
                activeUserPrediction.direction === 'UP' ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'
              }`}>
                {activeUserPrediction.direction === 'UP' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {activeUserPrediction.direction}
              </span>
              <span className="text-xs font-mono text-slate-300">
                @ {activeUserPrediction.entry_price.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-1 font-bold text-xs">
              <span className="text-slate-400">Stake:</span>
              <span className="text-amber-300">{activeUserPrediction.stake}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isCurrentlyWinning ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
              <span className="font-bold">
                {isCurrentlyWinning ? 'CURRENTLY IN THE MONEY (+1.90x)' : 'OUT OF THE MONEY'}
              </span>
            </div>
            <span className="font-mono font-bold text-amber-300">
              Win: +{Math.floor(activeUserPrediction.stake * 1.90)} Coins
            </span>
          </div>
        </div>
      ) : null}

      {/* Stake Quick Chips & Custom Input */}
      {!activeUserPrediction && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" /> Choose Practice Stake:
            </span>
            <span className="font-mono text-slate-300">
              Balance: <strong className="text-amber-400">{balance.toLocaleString()}</strong>
            </span>
          </div>

          {/* Preset Chips */}
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {stakeChips.map((amount) => {
              const isSelected = stake === amount;
              const isDisabled = balance < amount;
              return (
                <button
                  key={amount}
                  onClick={() => handleChipClick(amount)}
                  disabled={isDisabled || isLocked}
                  className={`py-1.5 px-1 rounded-xl text-xs font-extrabold transition-all text-center ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400 scale-[1.02]'
                      : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.09] border border-white/[0.06]'
                  } ${isDisabled ? 'opacity-35 cursor-not-allowed' : ''}`}
                >
                  {amount >= 1000 ? `${amount / 1000}K` : amount}
                </button>
              );
            })}
            <button
              onClick={handleMaxClick}
              disabled={balance <= 0 || isLocked}
              className={`py-1.5 px-1 rounded-xl text-xs font-black transition-all ${
                stake === balance
                  ? 'bg-amber-500 text-black ring-1 ring-amber-300'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              MAX
            </button>
          </div>

          {/* Custom Stake Input */}
          <div className="flex items-center gap-2 bg-[#07090e] border border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-400 font-semibold">Custom:</span>
            <input
              type="text"
              value={customStakeInput}
              onChange={handleCustomChange}
              disabled={isLocked}
              placeholder="Stake amount"
              className="bg-transparent text-sm font-mono font-bold text-white focus:outline-none w-full text-right"
            />
            <span className="text-xs text-amber-400 font-bold">Coins</span>
          </div>
        </div>
      )}

      {/* Payout Forecast */}
      <div className="flex items-center justify-between text-xs bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.04]">
        <span className="text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Multiplier: <strong>1.90x</strong>
        </span>
        <span className="text-slate-300">
          Potential Return: <strong className="text-emerald-400 font-mono font-bold">+{payoutPotential.toLocaleString()} Practice Coins</strong>
        </span>
      </div>

      {/* Main Action Buttons: UP (Green) & DOWN (Red) */}
      {!activeUserPrediction ? (
        <div className="grid grid-cols-2 gap-3 relative">
          
          {/* UP Button */}
          <button
            onClick={() => handlePredict('UP')}
            disabled={isLocked || isLoading || balance < stake}
            className={`relative group overflow-hidden rounded-2xl p-4 flex flex-col items-center justify-center gap-1 text-black font-extrabold transition-all transform active:scale-95 ${
              isLocked || balance < stake
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-tr from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 shadow-xl shadow-emerald-500/25 ring-1 ring-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2 text-lg sm:text-xl tracking-wider">
              <TrendingUp className="w-6 h-6 stroke-[3]" />
              <span>UP ↑</span>
            </div>
            <span className="text-[11px] font-bold opacity-90 tracking-wide">
              HIGHER IN 30S
            </span>
          </button>

          {/* DOWN Button */}
          <button
            onClick={() => handlePredict('DOWN')}
            disabled={isLocked || isLoading || balance < stake}
            className={`relative group overflow-hidden rounded-2xl p-4 flex flex-col items-center justify-center gap-1 text-white font-extrabold transition-all transform active:scale-95 ${
              isLocked || balance < stake
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-tr from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 shadow-xl shadow-rose-600/25 ring-1 ring-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 text-lg sm:text-xl tracking-wider">
              <TrendingDown className="w-6 h-6 stroke-[3]" />
              <span>DOWN ↓</span>
            </div>
            <span className="text-[11px] font-bold opacity-90 tracking-wide">
              LOWER IN 30S
            </span>
          </button>

          {/* Lock Overlay when round betting is closed (final 5 seconds) */}
          {isLocked && (
            <div className="absolute inset-0 bg-[#07090e]/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-rose-500/30 text-center z-10 animate-fade-in">
              <Lock className="w-5 h-5 text-rose-400 animate-pulse" />
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                Prediction Window Closed ({timeRemaining}s to Settle)
              </span>
              <span className="text-[11px] text-slate-400">
                Next 30s round starting immediately
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-cyan-500/20 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-1.5">
          <CheckCircle2 className="w-6 h-6 text-cyan-400" />
          <span className="text-sm font-bold text-white">Prediction Locked In!</span>
          <span className="text-xs text-slate-400">
            Waiting for round settlement in <strong>{timeRemaining} seconds</strong>...
          </span>
        </div>
      )}

      {/* Balance Warning if empty */}
      {balance < 50 && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Low Practice Coins! Click the <strong>+ Refill</strong> button above to watch an ad for 1,000 free coins, or claim your daily streak reward.</span>
        </div>
      )}
    </div>
  );
};
