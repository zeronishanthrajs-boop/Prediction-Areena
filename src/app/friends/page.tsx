'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Swords, 
  Search, 
  Check, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Share2, 
  Loader2,
  Trophy
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sounds } from '@/lib/audio';
import { Friendship, Challenge, PrivateRoom, User } from '@/lib/types';
import { INITIAL_MARKETS } from '@/lib/constants';

export default function FriendsPage() {
  const { user, openAuth } = useApp();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [rooms, setRooms] = useState<PrivateRoom[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'challenges' | 'rooms'>('friends');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modals
  const [challengeFriend, setChallengeFriend] = useState<Friendship | null>(null);
  const [challengeRounds, setChallengeRounds] = useState<number>(5);
  const [challengeMarket, setChallengeMarket] = useState<string>('ai-index');
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomRounds, setRoomRounds] = useState<number>(10);
  const [roomMarket, setRoomMarket] = useState<string>('ai-index');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSocialData = async () => {
    if (!user) return;
    try {
      const [fRes, cRes, rRes] = await Promise.all([
        fetch('/api/social/friends'),
        fetch('/api/social/challenges'),
        fetch('/api/social/rooms'),
      ]);

      if (fRes.ok) {
        const fData = await fRes.json();
        setFriends(fData.friends || []);
        setPendingRequests(fData.pendingRequests || []);
      }

      if (cRes.ok) {
        const cData = await cRes.json();
        setChallenges(cData.challenges || []);
      }

      if (rRes.ok) {
        const rData = await rRes.json();
        setRooms(rData.rooms || []);
      }
    } catch (e) {
      console.error('Error loading social data:', e);
    }
  };

  useEffect(() => {
    loadSocialData();
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    sounds.playClick();

    try {
      const res = await fetch(`/api/social/friends?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!user) {
      openAuth();
      return;
    }
    sounds.playClick();
    try {
      const res = await fetch('/api/social/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEND', targetUserId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playWinFanfare();
        setFeedback({ type: 'success', text: 'Friend request sent successfully!' });
        loadSocialData();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to send request' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error' });
    }
  };

  const handleRespondRequest = async (requestId: string, response: 'ACCEPT' | 'DECLINE') => {
    sounds.playClick();
    try {
      const res = await fetch('/api/social/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESPOND', requestId, response }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (response === 'ACCEPT') sounds.playWinFanfare();
        loadSocialData();
      }
    } catch (e) {
      console.error('Failed to respond:', e);
    }
  };

  const handleCreateChallengeSubmit = async () => {
    if (!challengeFriend || !user) return;
    setIsCreatingChallenge(true);
    sounds.playClick();

    const targetFriendId = challengeFriend.user_id === user.id ? challengeFriend.friend_id : challengeFriend.user_id;

    try {
      const res = await fetch('/api/social/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponentId: targetFriendId,
          marketId: challengeMarket,
          roundsTotal: challengeRounds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playWinFanfare();
        setFeedback({ type: 'success', text: '1v1 Challenge created! Opponent notified.' });
        setChallengeFriend(null);
        setActiveTab('challenges');
        loadSocialData();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to create challenge' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error creating challenge' });
    } finally {
      setIsCreatingChallenge(false);
    }
  };

  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !user) return;
    setIsCreatingRoom(true);
    sounds.playClick();

    try {
      const res = await fetch('/api/social/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName,
          marketId: roomMarket,
          rounds: roomRounds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playWinFanfare();
        setFeedback({ type: 'success', text: `Private Room created! Invite Code: ${data.room.room_code}` });
        setIsCreateRoomOpen(false);
        setRoomName('');
        setActiveTab('rooms');
        loadSocialData();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to create room' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error creating room' });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0d111a] via-[#1f162e] to-[#0d111a] border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" /> Social Arena Hub
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Friends & 1v1 Showdowns
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Battle your friends head-to-head in multi-round market showdowns, compare forecasting accuracy, and host private rooms.
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={() => {
            if (!user) { openAuth(); return; }
            sounds.playClick();
            setIsCreateRoomOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 transition-all transform active:scale-95"
        >
          <Lock className="w-4 h-4" />
          <span>Create Private Room</span>
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in ${
          feedback.type === 'error'
            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white ml-2">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-[#0d111a] border border-white/10 p-1.5 rounded-2xl w-fit text-xs font-bold">
        <button
          onClick={() => { sounds.playClick(); setActiveTab('friends'); }}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'friends' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => { sounds.playClick(); setActiveTab('challenges'); }}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'challenges' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          1v1 Battles ({challenges.length})
        </button>
        <button
          onClick={() => { sounds.playClick(); setActiveTab('rooms'); }}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'rooms' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Private Rooms ({rooms.length})
        </button>
      </div>

      {/* TAB 1: FRIENDS & SEARCH */}
      {activeTab === 'friends' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Friends List & Incoming Requests */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Pending Friend Requests */}
            {pendingRequests.length > 0 && (
              <div className="bg-[#0d111a] border border-purple-500/30 rounded-3xl p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Pending Friend Requests ({pendingRequests.length})
                </h3>
                <div className="divide-y divide-white/[0.06]">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={req.friend_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt={req.friend_username}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-purple-400"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">{req.friend_username}</span>
                          <span className="text-[10px] text-slate-400">Rating: {req.friend_rating || 1200} Elo</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRespondRequest(req.id, 'ACCEPT')}
                          className="px-3 py-1 rounded-xl bg-emerald-500 text-black text-xs font-bold flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          onClick={() => handleRespondRequest(req.id, 'DECLINE')}
                          className="px-3 py-1 rounded-xl bg-white/[0.05] text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Friends List */}
            <div className="bg-[#0d111a] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white">Your Arena Friends</h3>

              {friends.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No friends added yet. Use the search bar to find competitors!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {friends.map((f) => (
                    <div
                      key={f.id}
                      className="bg-[#131926] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={f.friend_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt={f.friend_username}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">{f.friend_username}</span>
                          <span className="text-[10px] text-cyan-400 font-mono">
                            Lv. {f.friend_level || 1} • {f.friend_rating || 1200} Elo
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          sounds.playClick();
                          setChallengeFriend(f);
                        }}
                        className="p-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                        title="Challenge 1v1"
                      >
                        <Swords className="w-4 h-4" />
                        <span className="hidden sm:inline">1v1</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Find Predictors Search */}
          <div className="lg:col-span-4 bg-[#0d111a] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" /> Find Predictors
              </h3>
              <p className="text-xs text-slate-400">Search users by username to send invites</p>
            </div>

            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username..."
                className="w-full bg-[#131926] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs flex items-center justify-center flex-shrink-0"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="divide-y divide-white/[0.06] pt-2">
                {searchResults.map((usr) => (
                  <div key={usr.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={usr.avatar_url}
                        alt={usr.username}
                        className="w-8 h-8 rounded-xl object-cover"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">{usr.username}</span>
                        <span className="text-[10px] text-slate-400">{usr.rating} Elo</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendFriendRequest(usr.id)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1 border border-cyan-500/40"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 1v1 HEAD-TO-HEAD CHALLENGES */}
      {activeTab === 'challenges' && (
        <div className="bg-[#0d111a] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Swords className="w-5 h-5 text-purple-400" /> Head-to-Head Challenge Arena
              </h3>
              <p className="text-xs text-slate-400">Real-time accuracy battle over fixed round series</p>
            </div>
          </div>

          {challenges.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No active challenges right now. Click on a friend to challenge them to a 1v1!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map((ch) => (
                <div
                  key={ch.id}
                  className="bg-[#131926] border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                      {ch.rounds_total}-Round Showdown
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/[0.05] text-slate-300">
                      {ch.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-around my-2">
                    {/* Creator */}
                    <div className="flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ch.creator_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                        alt="Creator"
                        className="w-10 h-10 rounded-xl object-cover mb-1 ring-1 ring-cyan-400/50"
                      />
                      <span className="text-xs font-bold text-white">{ch.creator_username || 'Creator'}</span>
                      <span className="text-lg font-black text-amber-300 font-mono">{ch.creator_wins}</span>
                    </div>

                    <span className="text-xs font-black text-slate-500 uppercase">VS</span>

                    {/* Opponent */}
                    <div className="flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ch.opponent_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                        alt="Opponent"
                        className="w-10 h-10 rounded-xl object-cover mb-1 ring-1 ring-purple-400/50"
                      />
                      <span className="text-xs font-bold text-white">{ch.opponent_username || 'Opponent'}</span>
                      <span className="text-lg font-black text-amber-300 font-mono">{ch.opponent_wins}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.06]">
                    <span>Rounds: {ch.rounds_completed}/{ch.rounds_total}</span>
                    <span className="text-purple-300 font-bold">Best accuracy wins</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRIVATE ROOMS */}
      {activeTab === 'rooms' && (
        <div className="bg-[#0d111a] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" /> Private Custom Rooms
              </h3>
              <p className="text-xs text-slate-400">Join a private lobby with an invite code</p>
            </div>
            <button
              onClick={() => setIsCreateRoomOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs"
            >
              + Host Room
            </button>
          </div>

          {rooms.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No private rooms currently hosted. Click &quot;Host Room&quot; to create your own!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rooms.map((rm) => (
                <div key={rm.id} className="bg-[#131926] border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-extrabold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                      CODE: {rm.room_code}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-2">{rm.name}</h4>
                    <span className="text-xs text-slate-400">{rm.rounds} Rounds • {rm.round_duration}s per call</span>
                  </div>
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-slate-400">{rm.participants_count} Players</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(rm.room_code);
                        sounds.playClick();
                        setFeedback({ type: 'success', text: `Room Code ${rm.room_code} copied to clipboard!` });
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Copy Code
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create 1v1 Challenge */}
      {challengeFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0d111a] border border-purple-500/40 rounded-3xl p-6 shadow-2xl relative flex flex-col">
            <button
              onClick={() => setChallengeFriend(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <Swords className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create 1v1 Challenge</h3>
                <span className="text-xs text-purple-300">
                  Opponent: {challengeFriend.friend_username}
                </span>
              </div>
            </div>

            <div className="space-y-4 my-2">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Select Market</label>
                <select
                  value={challengeMarket}
                  onChange={(e) => setChallengeMarket(e.target.value)}
                  className="w-full bg-[#131926] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                >
                  {INITIAL_MARKETS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.symbol})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Rounds Series</label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setChallengeRounds(num)}
                      className={`py-2 rounded-xl text-xs font-bold ${
                        challengeRounds === num ? 'bg-purple-500 text-white' : 'bg-white/[0.04] text-slate-400'
                      }`}
                    >
                      {num} Rounds
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateChallengeSubmit}
              disabled={isCreatingChallenge}
              className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2"
            >
              {isCreatingChallenge ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
              <span>Send 1v1 Invitation</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Create Private Room */}
      {isCreateRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0d111a] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl relative flex flex-col">
            <button
              onClick={() => setIsCreateRoomOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Host Private Room</h3>
            <p className="text-xs text-slate-400 mb-4">Set up a multiplayer simulation room</p>

            <form onSubmit={handleCreateRoomSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Quant Masters Arena"
                  className="w-full bg-[#131926] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Market</label>
                <select
                  value={roomMarket}
                  onChange={(e) => setRoomMarket(e.target.value)}
                  className="w-full bg-[#131926] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                >
                  {INITIAL_MARKETS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.symbol})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Series Rounds</label>
                <input
                  type="number"
                  min="3"
                  max="50"
                  value={roomRounds}
                  onChange={(e) => setRoomRounds(parseInt(e.target.value, 10))}
                  className="w-full bg-[#131926] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingRoom}
                className="w-full py-3 rounded-2xl bg-cyan-500 text-black font-extrabold text-sm shadow-xl flex items-center justify-center gap-2"
              >
                {isCreatingRoom ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Generate Room Code</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
