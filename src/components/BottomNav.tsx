'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Zap, Flame, Trophy, Users, User } from 'lucide-react';
import { sounds } from '@/lib/audio';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const items = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/play', label: 'Play', icon: Zap, highlight: true },
    { href: '/sports', label: 'Sports', icon: Flame },
    { href: '/rankings', label: 'Rankings', icon: Trophy },
    { href: '/friends', label: 'Friends', icon: Users },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07090e]/95 backdrop-blur-2xl border-t border-white/[0.08] px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => sounds.playClick()}
                className="flex flex-col items-center -mt-4 group"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-tr from-cyan-400 to-blue-600 text-black shadow-cyan-500/40 scale-105 ring-2 ring-cyan-400'
                    : 'bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/40 shadow-cyan-500/20'
                }`}>
                  <Icon className="w-6 h-6 fill-current" />
                </div>
                <span className={`text-[10px] font-extrabold mt-1 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => sounds.playClick()}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-[10px] font-medium mt-1 ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
