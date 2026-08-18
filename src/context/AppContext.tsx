'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Wallet } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { AuthModal } from '@/components/AuthModal';
import { DailyRewardModal } from '@/components/DailyRewardModal';
import { RefillModal } from '@/components/RefillModal';

interface AppContextType {
  user: User | null;
  wallet: Wallet | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  updateWalletBalance: (newBalance: number) => void;
  openAuth: () => void;
  openDailyReward: () => void;
  openRefill: () => void;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isRefillOpen, setIsRefillOpen] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setWallet(data.wallet);
      } else {
        setUser(null);
        setWallet(null);
      }
    } catch {
      setUser(null);
      setWallet(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const updateWalletBalance = (newBalance: number) => {
    if (wallet) {
      setWallet({ ...wallet, balance: newBalance });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setWallet(null);
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  const handleClaimDaily = async (doubleMultiplier: boolean) => {
    try {
      const res = await fetch('/api/wallet/claim-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubleReward: doubleMultiplier }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.wallet) setWallet(data.wallet);
        if (user) setUser({ ...user, daily_streak: data.newStreak, last_daily_claim_at: new Date().toISOString() });
        return { success: true, rewardAmount: data.rewardAmount };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Network error claiming daily reward' };
    }
  };

  const handleRefill = async () => {
    try {
      const res = await fetch('/api/wallet/refill', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.wallet) setWallet(data.wallet);
        return { success: true, refillAmount: data.refillAmount };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Network error refilling balance' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        wallet,
        isLoading,
        refreshSession,
        updateWalletBalance,
        openAuth: () => setIsAuthOpen(true),
        openDailyReward: () => setIsDailyOpen(true),
        openRefill: () => setIsRefillOpen(true),
        logout: handleLogout,
      }}
    >
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
        <DisclaimerBanner />
        <Navbar
          user={user}
          wallet={wallet}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenDailyReward={() => setIsDailyOpen(true)}
          onOpenRefill={() => setIsRefillOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 pb-20 md:pb-8">
          {children}
        </main>

        <BottomNav />

        {/* Global Modals */}
        {isAuthOpen && (
          <AuthModal
            onClose={() => setIsAuthOpen(false)}
            onSuccess={() => refreshSession()}
          />
        )}

        {isDailyOpen && (
          <DailyRewardModal
            currentStreak={user?.daily_streak || 0}
            onClose={() => setIsDailyOpen(false)}
            onClaim={handleClaimDaily}
          />
        )}

        {isRefillOpen && (
          <RefillModal
            onClose={() => setIsRefillOpen(false)}
            onRefill={handleRefill}
          />
        )}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
