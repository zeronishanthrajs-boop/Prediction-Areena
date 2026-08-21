export interface AvatarOption {
  id: string;
  name: string;
  gender: 'blank' | 'male' | 'female';
  url: string;
  description: string;
}

export const AVATAR_PRESETS: AvatarOption[] = [
  // Blank / Default
  {
    id: 'blank',
    name: 'Default Blank',
    gender: 'blank',
    url: '',
    description: 'Minimalist neutral silhouette',
  },

  // Male Avatars
  {
    id: 'male-1',
    name: 'Alex (Quant)',
    gender: 'male',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    description: 'Clean modern strategist',
  },
  {
    id: 'male-2',
    name: 'Marcus (Trader)',
    gender: 'male',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
    description: 'Casual crypto analyst',
  },
  {
    id: 'male-3',
    name: 'David (Apex)',
    gender: 'male',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    description: 'Professional market maker',
  },
  {
    id: 'male-4',
    name: 'Leo (Cyber)',
    gender: 'male',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    description: 'High-frequency specialist',
  },
  {
    id: 'male-5',
    name: 'Ryan (Alpha)',
    gender: 'male',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    description: 'Bull run champion',
  },

  // Female Avatars
  {
    id: 'female-1',
    name: 'Elena (Wave)',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    description: 'Trend reversal analyst',
  },
  {
    id: 'female-2',
    name: 'Sarah (Signals)',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    description: 'Neural pattern reader',
  },
  {
    id: 'female-3',
    name: 'Maya (Nova)',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    description: 'Quantitative researcher',
  },
  {
    id: 'female-4',
    name: 'Zoe (Titan)',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
    description: 'Volatility conqueror',
  },
  {
    id: 'female-5',
    name: 'Chloe (Apex)',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    description: 'Strategic market forecaster',
  },
];

export const DEFAULT_MALE_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
export const DEFAULT_FEMALE_AVATAR = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80';
