'use client';

import React, { useState } from 'react';
import { X, Check, Sparkles, User as UserIcon, Loader2, RefreshCw } from 'lucide-react';
import { AVATAR_PRESETS } from '@/lib/avatars';
import { UserAvatar } from '@/components/UserAvatar';
import { sounds } from '@/lib/audio';

interface AvatarPickerModalProps {
  isOpen: boolean;
  currentAvatar: string;
  username: string;
  onClose: () => void;
  onSuccess: (newAvatarUrl: string) => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  currentAvatar,
  username,
  onClose,
  onSuccess,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || '');
  const [activeTab, setActiveTab] = useState<'all' | 'blank' | 'male' | 'female' | 'custom'>('all');
  const [customUrl, setCustomUrl] = useState<string>(
    currentAvatar && !AVATAR_PRESETS.some(a => a.url === currentAvatar) ? currentAvatar : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredAvatars = AVATAR_PRESETS.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'blank') return item.gender === 'blank';
    if (activeTab === 'male') return item.gender === 'male';
    if (activeTab === 'female') return item.gender === 'female';
    return false;
  });

  const handleSelect = (url: string) => {
    sounds.playClick();
    setSelectedAvatar(url);
    setError(null);
  };

  const handleApplyCustom = () => {
    if (!customUrl.trim()) {
      setError('Please enter a valid image URL');
      return;
    }
    sounds.playClick();
    setSelectedAvatar(customUrl.trim());
    setError(null);
  };

  const handleSave = async () => {
    sounds.playClick();
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: selectedAvatar }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile picture');
      }

      sounds.playWinFanfare();
      onSuccess(selectedAvatar);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating avatar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-[#0d111a] border border-cyan-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={() => { sounds.playClick(); onClose(); }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Choose Profile Picture</h2>
            <p className="text-xs text-slate-400">Select Male, Female, Blank default, or use a custom image.</p>
          </div>
        </div>

        {/* Live Preview Bar */}
        <div className="bg-[#131926] border border-white/[0.08] rounded-2xl p-3.5 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={selectedAvatar}
              alt={username}
              fallbackName={username}
              className="w-12 h-12 rounded-2xl ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-500/20"
            />
            <div>
              <span className="text-xs text-slate-400 block font-medium">Selected Picture</span>
              <span className="text-sm font-black text-white">
                {selectedAvatar === '' ? (
                  <span className="text-slate-400 italic">Default Blank Avatar</span>
                ) : (
                  AVATAR_PRESETS.find(a => a.url === selectedAvatar)?.name || 'Custom Image'
                )}
              </span>
            </div>
          </div>

          {selectedAvatar !== '' && (
            <button
              onClick={() => handleSelect('')}
              className="text-[11px] font-bold text-slate-400 hover:text-rose-400 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset to Blank</span>
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-5 gap-1 bg-[#131926] p-1 rounded-xl mb-3 text-xs font-bold">
          <button
            onClick={() => { sounds.playClick(); setActiveTab('all'); }}
            className={`py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'all' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab('blank'); }}
            className={`py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'blank' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            👤 Blank
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab('male'); }}
            className={`py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'male' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            👨 Male
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab('female'); }}
            className={`py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'female' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            👩 Female
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab('custom'); }}
            className={`py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'custom' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🔗 URL
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Scrollable Gallery Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {activeTab === 'custom' ? (
            <div className="bg-[#131926] border border-white/[0.08] rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                Paste Direct Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="flex-1 bg-[#0d111a] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all"
                >
                  Preview
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Supports JPG, PNG, WebP, or SVG direct image links.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredAvatars.map((opt) => {
                const isSelected = selectedAvatar === opt.url;
                const isBlank = opt.gender === 'blank';

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.url)}
                    className={`relative p-2.5 rounded-2xl border text-left transition-all flex flex-col items-center gap-2 group ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/15 scale-[1.02]'
                        : 'bg-[#131926] border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Selected Checkmark Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    {/* Avatar Display */}
                    {isBlank ? (
                      <div className="w-14 h-14 rounded-2xl bg-[#0d111a] border border-dashed border-white/20 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors">
                        <UserIcon className="w-7 h-7" />
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={opt.url}
                        alt={opt.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-1 ring-white/10 group-hover:ring-cyan-400/50 transition-all"
                      />
                    )}

                    {/* Details */}
                    <div className="text-center w-full">
                      <span className="text-xs font-bold text-white block truncate">
                        {opt.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {opt.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 mt-3 border-t border-white/[0.08] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => { sounds.playClick(); onClose(); }}
            className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
            <span>Save Profile Picture</span>
          </button>
        </div>

      </div>
    </div>
  );
};
