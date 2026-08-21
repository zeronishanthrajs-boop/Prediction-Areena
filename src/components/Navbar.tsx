'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Zap, 
  Coins, 
  Gift, 
  Trophy, 
  Users, 
  User as UserIcon, 
  Volume2, 
  VolumeX, 
  PlusCircle, 
  Flame, 
  LogIn, 
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';
import { sounds } from '@/lib/audio';
import { User, Wallet } from '@/lib/types';

import { UserAvatar } from '@/components/UserAvatar';

interface NavbarProps {
  user: User | null;
  wallet: Wallet | null;
  onOpenAuth: () => void;
  onOpenDailyReward: () => void;
  onOpenRefill: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  wallet,
  onOpenAuth,
  onOpenDailyReward,
  onOpenRefill,
  onLogout,
}) => {
  const pathname = usePathname();
  const [isMuted, setIsMuted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMuted(sounds.getMuted());
  }, []);

  const handleSoundToggle = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.playClick();
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/play', label: 'Infinite Market', icon: Zap },
    { href: '/sports', label: 'Sports', icon: Flame },
    { href: '/rankings', label: 'Rankings', icon: Trophy },
    { href: '/friends', label: 'Friends', icon: Users },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ href: '/admin', label: 'Admin', icon: ShieldAlert });
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-[#07090e]/85 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <Link 
            href="/" 
            onClick={() => sounds.playClick()}
            className="flex items-center gap-2 group flex-shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#07090e] rounded-[10px] flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 fill-cyan-400/20" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-300 font-sans">
                PREDICTION<span className="text-cyan-400">ARENA</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 tracking-widest uppercase -mt-1 font-semibold">
                Social Simulator
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => sounds.playClick()}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Balance, Daily Streak, Audio, User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
          {/* Sound Mute Toggle — hidden on small mobile */}
          <button
            onClick={handleSoundToggle}
            className="hidden sm:flex w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
            title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Practice Coin Balance Chip — desktop only */}
          {user && wallet && (
            <div className="hidden sm:flex items-center gap-2 bg-[#131926]/90 border border-amber-500/30 rounded-xl px-2.5 py-1.5 shadow-md shadow-amber-500/5">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <Coins className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="hidden lg:block text-[10px] text-amber-400/80 font-bold uppercase tracking-wider leading-none">
                  Practice Coins
                </span>
                <span className="font-mono-numbers text-xs sm:text-sm font-bold text-amber-300 leading-tight">
                  {wallet.balance.toLocaleString()}
                </span>
              </div>
              {wallet.balance < 500 && (
                <button
                  onClick={() => { sounds.playClick(); onOpenRefill(); }}
                  className="ml-1 text-cyan-400 hover:text-cyan-300"
                  title="Free Refill"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Daily Streak — desktop only */}
          {user && (
            <button
              onClick={() => { sounds.playClick(); onOpenDailyReward(); }}
              className="hidden sm:flex relative items-center gap-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/40 text-purple-300 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm shadow-purple-500/10"
              title="Claim Daily Streak Bonus"
            >
              <Gift className="w-4 h-4 text-purple-400 animate-bounce" />
              <span className="hidden md:inline">Streak</span>
              <span className="bg-purple-500/40 text-purple-200 text-[10px] px-1.5 py-0.5 rounded-md font-extrabold">
                {user.daily_streak || 0}D
              </span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-[#07090e]" />
            </button>
          )}

          {/* User Account / Auth */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/profile"
                onClick={() => sounds.playClick()}
                className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl p-1.5 sm:px-2.5 sm:py-1.5 transition-all group"
              >
                <UserAvatar
                  src={user.avatar_url}
                  alt={user.username}
                  fallbackName={user.username}
                  className="w-7 h-7 rounded-lg ring-1 ring-cyan-400/40"
                />
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200 leading-none group-hover:text-cyan-400 transition-colors">
                    {user.username}
                  </span>
                  <span className="text-[10px] text-cyan-400/90 font-semibold leading-tight">
                    Lv. {user.level} • {user.rating} Elo
                  </span>
                </div>
              </Link>
              <button
                onClick={() => { sounds.playClick(); onLogout(); }}
                className="hidden sm:flex text-slate-400 hover:text-rose-400 text-xs px-2 py-1.5 rounded-lg transition-colors"
                title="Sign out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => { sounds.playClick(); onOpenAuth(); }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs px-3 py-2 rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}

          {/* Hamburger — only on mobile (md:hidden), since BottomNav handles main navigation */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Secondary Quick-Bar: Balance + Streak (logged-in only, mobile only) */}
      {user && wallet && (
        <div className="sm:hidden flex items-center gap-2 px-4 py-1.5 bg-[#07090e]/60 border-b border-white/[0.05]">
          {/* Coins chip */}
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-0.5 flex-1 min-w-0">
            <Coins className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="font-mono-numbers text-xs font-bold text-amber-300 truncate">
              {wallet.balance.toLocaleString()}
            </span>
            <span className="text-[9px] text-amber-500/60 uppercase tracking-wide flex-shrink-0">PC</span>
            {wallet.balance < 500 && (
              <button
                onClick={() => { sounds.playClick(); onOpenRefill(); }}
                className="ml-auto text-cyan-400 flex-shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Streak chip */}
          <button
            onClick={() => { sounds.playClick(); onOpenDailyReward(); }}
            className="relative flex items-center gap-1 bg-purple-500/10 border border-purple-500/25 text-purple-300 px-2 py-0.5 rounded-lg text-[10px] font-bold flex-shrink-0"
          >
            <Gift className="w-3 h-3 text-purple-400" />
            <span>{user.daily_streak || 0}D Streak</span>
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
          </button>

          {/* Sound toggle on mobile */}
          <button
            onClick={handleSoundToggle}
            className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 flex-shrink-0"
          >
            {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
          </button>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0e17] border-b border-white/10 px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => { sounds.playClick(); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-white/[0.04]'
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>
            );
          })}
          {user && (
            <button
              onClick={() => { sounds.playClick(); setMobileMenuOpen(false); onLogout(); }}
              className="w-full text-left px-3 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl font-medium"
            >
              Sign Out ({user.username})
            </button>
          )}
        </div>
      )}
    </header>
  );
};
