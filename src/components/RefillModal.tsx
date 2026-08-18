'use client';

import React, { useState } from 'react';
import { PlusCircle, Coins, ShieldCheck, X, Loader2 } from 'lucide-react';
import { sounds } from '@/lib/audio';

interface RefillModalProps {
  onClose: () => void;
  onRefill: () => Promise<{ success: boolean; refillAmount?: number; error?: string }>;
}

export const RefillModal: React.FC<RefillModalProps> = ({ onClose, onRefill }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefillClick = async () => {
    setIsSubmitting(true);
    setError(null);
    sounds.playClick();

    const res = await onRefill();
    setIsSubmitting(false);
    if (res.success) {
      sounds.playWinFanfare();
      onClose();
    } else {
      setError(res.error || 'Refill failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-[#0d111a] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative flex flex-col items-center text-center">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20">
          <PlusCircle className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-black text-white">Emergency Refill</h2>
        <p className="text-xs text-slate-400 mt-1">
          Running low on virtual coins? Claim an instant <strong>1,500 Practice Coins</strong> refill to jump straight back into the arena!
        </p>

        {error && (
          <div className="w-full mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="my-5 bg-[#131926] border border-white/10 rounded-2xl p-4 w-full flex items-center justify-center gap-3 font-mono-numbers">
          <Coins className="w-6 h-6 text-amber-400" />
          <span className="text-2xl font-black text-amber-300">+1,500 Practice Coins</span>
        </div>

        <div className="w-full flex flex-col gap-2">
          <button
            onClick={handleRefillClick}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Claim 1,500 Free Coins</span>
          </button>

          <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1 mt-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Free Virtual Currency
          </span>
        </div>
      </div>
    </div>
  );
};
