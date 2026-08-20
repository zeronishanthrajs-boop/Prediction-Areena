import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="w-full bg-[#0d111a]/90 border-b border-white/[0.05] py-1.5 px-4 text-[10px] sm:text-xs text-slate-400 backdrop-blur-md flex items-center gap-2 overflow-hidden">
      <span className="flex h-1.5 w-1.5 relative flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
      </span>
      <span className="font-semibold text-cyan-400 flex-shrink-0 flex items-center gap-1">
        <ShieldCheck className="w-3 h-3 inline" /> VIRTUAL ONLY:
      </span>
      <span className="truncate">
        Practice Coins have no real money value. No deposits or cashouts.
      </span>
    </div>
  );
};
