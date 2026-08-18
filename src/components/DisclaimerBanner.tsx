import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="w-full bg-[#0d111a]/90 border-y border-white/5 py-2 px-4 text-xs text-slate-400 backdrop-blur-md flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 max-w-4xl mx-auto overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="flex h-2 w-2 relative flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <span className="font-semibold text-cyan-400 flex-shrink-0 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 inline" /> VIRTUAL SIMULATOR:
        </span>
        <span className="truncate">
          Practice Coins are 100% virtual tokens for skill competition and practice. No real money value, deposits, or cashouts.
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 flex-shrink-0">
        <Info className="w-3 h-3" /> Skill-Based
      </div>
    </div>
  );
};
