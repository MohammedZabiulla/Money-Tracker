import React, { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Custom3DEmblem } from '../../types';

export type EmblemShape = 'squircle' | 'circle' | 'shield' | 'diamond' | 'hexagon' | 'star' | 'octagon';
export type EmblemFinish = 'gloss' | 'metallic' | 'hologram' | 'glass' | 'neon' | 'matte' | 'crystal';

export interface Emblem3DPreset {
  id: string;
  name: string;
  category: 'Wealth & Vault' | 'Tech & Cyber' | 'Luxury & Gems' | 'Lifestyle & Food' | 'Travel & Adventure' | 'Power & Health' | 'Home & Living' | 'Entertainment & Art';
  icon: string;
  from: string;
  via?: string;
  to: string;
  shadow: string;
  accent: string;
  shape?: EmblemShape;
  finish?: EmblemFinish;
  glow?: boolean;
  tag?: string;
}

// 60+ Named 3D Icon Emblems Presets
export const NAMED_3D_EMBLEMS: Emblem3DPreset[] = [
  // --- Wealth & Vault ---
  {
    id: 'emblem_royal_vault',
    name: 'Royal Gold Vault',
    category: 'Wealth & Vault',
    icon: 'Landmark',
    from: '#f59e0b',
    via: '#d97706',
    to: '#78350f',
    shadow: 'rgba(217, 119, 6, 0.55)',
    accent: '#fef3c7',
    shape: 'shield',
    finish: 'metallic',
    glow: true,
    tag: 'Banking & Gold',
  },
  {
    id: 'emblem_crypto_nexus',
    name: 'Crypto Nexus',
    category: 'Wealth & Vault',
    icon: 'Coins',
    from: '#eab308',
    via: '#ca8a04',
    to: '#854d0e',
    shadow: 'rgba(234, 179, 8, 0.5)',
    accent: '#fef9c3',
    shape: 'hexagon',
    finish: 'gloss',
    glow: true,
    tag: 'Bullion & Coins',
  },
  {
    id: 'emblem_bull_rally',
    name: 'Bull Market Surge',
    category: 'Wealth & Vault',
    icon: 'TrendingUp',
    from: '#10b981',
    via: '#059669',
    to: '#064e3b',
    shadow: 'rgba(16, 185, 129, 0.55)',
    accent: '#a7f3d0',
    shape: 'squircle',
    finish: 'gloss',
    glow: true,
    tag: 'Stocks & Equity',
  },
  {
    id: 'emblem_diamond_wealth',
    name: 'Imperial Diamond',
    category: 'Wealth & Vault',
    icon: 'Gem',
    from: '#38bdf8',
    via: '#0284c7',
    to: '#1e3a8a',
    shadow: 'rgba(56, 189, 248, 0.5)',
    accent: '#e0f2fe',
    shape: 'diamond',
    finish: 'crystal',
    glow: true,
    tag: 'High Net Worth',
  },
  {
    id: 'emblem_crown_jewel',
    name: 'Sovereign Crown',
    category: 'Wealth & Vault',
    icon: 'Crown',
    from: '#fbbf24',
    via: '#f59e0b',
    to: '#b45309',
    shadow: 'rgba(245, 158, 11, 0.55)',
    accent: '#fffbeb',
    shape: 'shield',
    finish: 'metallic',
    glow: true,
    tag: 'Luxury Capital',
  },
  {
    id: 'emblem_shield_safeguard',
    name: 'Titanium Safe',
    category: 'Wealth & Vault',
    icon: 'ShieldCheck',
    from: '#64748b',
    via: '#334155',
    to: '#0f172a',
    shadow: 'rgba(51, 65, 85, 0.5)',
    accent: '#cbd5e1',
    shape: 'shield',
    finish: 'metallic',
    glow: false,
    tag: 'Insurance & Safety',
  },
  {
    id: 'emblem_piggy_reserve',
    name: 'Fortune Chest',
    category: 'Wealth & Vault',
    icon: 'PiggyBank',
    from: '#f43f5e',
    via: '#e11d48',
    to: '#881337',
    shadow: 'rgba(244, 63, 94, 0.5)',
    accent: '#ffe4e6',
    shape: 'squircle',
    finish: 'gloss',
    glow: true,
    tag: 'Savings & FD',
  },
  {
    id: 'emblem_rupee_sovereign',
    name: 'Bharat Rupee Crest',
    category: 'Wealth & Vault',
    icon: 'IndianRupee',
    from: '#ff9933',
    via: '#138808',
    to: '#000080',
    shadow: 'rgba(255, 153, 51, 0.45)',
    accent: '#ffffff',
    shape: 'circle',
    finish: 'hologram',
    glow: true,
    tag: 'Sovereign INR',
  },

  // --- Tech & Cyber ---
  {
    id: 'emblem_cyber_rocket',
    name: 'Hyperdrive Rocket',
    category: 'Tech & Cyber',
    icon: 'Rocket',
    from: '#8b5cf6',
    via: '#6d28d9',
    to: '#3b0764',
    shadow: 'rgba(139, 92, 246, 0.55)',
    accent: '#ede9fe',
    shape: 'squircle',
    finish: 'neon',
    glow: true,
    tag: 'Growth & Startups',
  },
  {
    id: 'emblem_ai_spark',
    name: 'Quantum Intelligence',
    category: 'Tech & Cyber',
    icon: 'Sparkles',
    from: '#ec4899',
    via: '#8b5cf6',
    to: '#3b82f6',
    shadow: 'rgba(236, 72, 153, 0.5)',
    accent: '#fdf2f8',
    shape: 'squircle',
    finish: 'hologram',
    glow: true,
    tag: 'AI & Neural',
  },
  {
    id: 'emblem_neon_code',
    name: 'Cyber Terminal',
    category: 'Tech & Cyber',
    icon: 'Terminal',
    from: '#10b981',
    via: '#047857',
    to: '#022c22',
    shadow: 'rgba(16, 185, 129, 0.5)',
    accent: '#6ee7b7',
    shape: 'squircle',
    finish: 'neon',
    glow: true,
    tag: 'Dev & Coding',
  },
  {
    id: 'emblem_cloud_mesh',
    name: 'Cloud Nimbus',
    category: 'Tech & Cyber',
    icon: 'Cloud',
    from: '#0ea5e9',
    via: '#0284c7',
    to: '#0369a1',
    shadow: 'rgba(14, 165, 233, 0.5)',
    accent: '#e0f2fe',
    shape: 'circle',
    finish: 'glass',
    glow: true,
    tag: 'Cloud & Hosting',
  },
  {
    id: 'emblem_circuit_brain',
    name: 'Silicon Core',
    category: 'Tech & Cyber',
    icon: 'Cpu',
    from: '#6366f1',
    via: '#4338ca',
    to: '#1e1b4b',
    shadow: 'rgba(99, 102, 241, 0.5)',
    accent: '#e0e7ff',
    shape: 'hexagon',
    finish: 'metallic',
    glow: true,
    tag: 'Hardware & Chips',
  },

  // --- Luxury & Gems ---
  {
    id: 'emblem_sapphire_abyss',
    name: 'Sapphire Abyss',
    category: 'Luxury & Gems',
    icon: 'Sparkle',
    from: '#2563eb',
    via: '#1d4ed8',
    to: '#172554',
    shadow: 'rgba(37, 99, 235, 0.55)',
    accent: '#dbeafe',
    shape: 'diamond',
    finish: 'crystal',
    glow: true,
    tag: 'Sapphire Grade',
  },
  {
    id: 'emblem_emerald_crest',
    name: 'Imperial Emerald',
    category: 'Luxury & Gems',
    icon: 'Shield',
    from: '#059669',
    via: '#047857',
    to: '#064e3b',
    shadow: 'rgba(5, 150, 105, 0.55)',
    accent: '#d1fae5',
    shape: 'shield',
    finish: 'crystal',
    glow: true,
    tag: 'Emerald Elite',
  },
  {
    id: 'emblem_ruby_flame',
    name: 'Royal Ruby Flame',
    category: 'Luxury & Gems',
    icon: 'Flame',
    from: '#e11d48',
    via: '#be123c',
    to: '#4c0519',
    shadow: 'rgba(225, 29, 72, 0.55)',
    accent: '#ffe4e6',
    shape: 'squircle',
    finish: 'crystal',
    glow: true,
    tag: 'Ruby Red',
  },
  {
    id: 'emblem_amethyst_dream',
    name: 'Celestial Amethyst',
    category: 'Luxury & Gems',
    icon: 'Moon',
    from: '#9333ea',
    via: '#7e22ce',
    to: '#3b0764',
    shadow: 'rgba(147, 51, 234, 0.55)',
    accent: '#f3e8ff',
    shape: 'circle',
    finish: 'glass',
    glow: true,
    tag: 'Amethyst Violet',
  },
  {
    id: 'emblem_rose_gold_luxe',
    name: 'Rose Gold Shimmer',
    category: 'Luxury & Gems',
    icon: 'Watch',
    from: '#fb7185',
    via: '#e11d48',
    to: '#9f1239',
    shadow: 'rgba(251, 113, 133, 0.5)',
    accent: '#fff1f2',
    shape: 'squircle',
    finish: 'metallic',
    glow: true,
    tag: 'Watches & Jewelry',
  },
  {
    id: 'emblem_platinum_shield',
    name: 'Platinum Aegis',
    category: 'Luxury & Gems',
    icon: 'Award',
    from: '#94a3b8',
    via: '#475569',
    to: '#0f172a',
    shadow: 'rgba(100, 116, 139, 0.5)',
    accent: '#f8fafc',
    shape: 'shield',
    finish: 'metallic',
    glow: true,
    tag: 'Platinum Tier',
  },

  // --- Lifestyle & Food ---
  {
    id: 'emblem_chef_flame',
    name: 'Gourmet Master',
    category: 'Lifestyle & Food',
    icon: 'Utensils',
    from: '#ea580c',
    via: '#c2410c',
    to: '#7c2d12',
    shadow: 'rgba(234, 88, 12, 0.5)',
    accent: '#ffedd5',
    shape: 'squircle',
    finish: 'gloss',
    glow: true,
    tag: 'Fine Dining',
  },
  {
    id: 'emblem_coffee_espresso',
    name: 'Artisan Espresso',
    category: 'Lifestyle & Food',
    icon: 'Coffee',
    from: '#78350f',
    via: '#451a03',
    to: '#1c0a00',
    shadow: 'rgba(120, 53, 15, 0.55)',
    accent: '#fde68a',
    shape: 'squircle',
    finish: 'gloss',
    glow: true,
    tag: 'Cafes & Brews',
  },
  {
    id: 'emblem_shopping_bag_luxe',
    name: 'Boutique Spree',
    category: 'Lifestyle & Food',
    icon: 'ShoppingBag',
    from: '#db2777',
    via: '#be185d',
    to: '#500724',
    shadow: 'rgba(219, 39, 119, 0.5)',
    accent: '#fce7f3',
    shape: 'squircle',
    finish: 'gloss',
    glow: true,
    tag: 'Fashion & Mall',
  },
  {
    id: 'emblem_cocktail_oasis',
    name: 'Sunset Lounge',
    category: 'Lifestyle & Food',
    icon: 'Wine',
    from: '#f43f5e',
    via: '#e11d48',
    to: '#4c0519',
    shadow: 'rgba(244, 63, 94, 0.5)',
    accent: '#ffe4e6',
    shape: 'circle',
    finish: 'glass',
    glow: true,
    tag: 'Nightlife & Drinks',
  },
  {
    id: 'emblem_groceries_harvest',
    name: 'Fresh Harvest',
    category: 'Lifestyle & Food',
    icon: 'Apple',
    from: '#16a34a',
    via: '#15803d',
    to: '#052e16',
    shadow: 'rgba(22, 163, 74, 0.5)',
    accent: '#bbf7d0',
    shape: 'squircle',
    finish: 'gloss',
    glow: true,
    tag: 'Organic & Farm',
  },
  {
    id: 'emblem_pizza_fiesta',
    name: 'Woodfire Feast',
    category: 'Lifestyle & Food',
    icon: 'Pizza',
    from: '#f97316',
    via: '#ea580c',
    to: '#9a3412',
    shadow: 'rgba(249, 115, 22, 0.5)',
    accent: '#fed7aa',
    shape: 'circle',
    finish: 'gloss',
    glow: true,
    tag: 'Fast Food',
  },

  // --- Travel & Adventure ---
  {
    id: 'emblem_wanderlust_plane',
    name: 'Aero Voyager',
    category: 'Travel & Adventure',
    icon: 'Plane',
    from: '#0284c7',
    via: '#0369a1',
    to: '#082f49',
    shadow: 'rgba(2, 132, 199, 0.55)',
    accent: '#bae6fd',
    shape: 'circle',
    finish: 'metallic',
    glow: true,
    tag: 'Flights & Global',
  },
  {
    id: 'emblem_compass_expedition',
    name: 'Nautical Navigator',
    category: 'Travel & Adventure',
    icon: 'Compass',
    from: '#0d9488',
    via: '#0f766e',
    to: '#042f2e',
    shadow: 'rgba(13, 148, 136, 0.5)',
    accent: '#99f6e4',
    shape: 'circle',
    finish: 'metallic',
    glow: true,
    tag: 'Expeditions',
  },
  {
    id: 'emblem_mountain_summit',
    name: 'Alpine Peak',
    category: 'Travel & Adventure',
    icon: 'Mountain',
    from: '#059669',
    via: '#047857',
    to: '#022c22',
    shadow: 'rgba(5, 150, 105, 0.5)',
    accent: '#a7f3d0',
    shape: 'shield',
    finish: 'gloss',
    glow: true,
    tag: 'Hills & Treks',
  },
  {
    id: 'emblem_supercar_turbo',
    name: 'Grand Tourer',
    category: 'Travel & Adventure',
    icon: 'Car',
    from: '#ef4444',
    via: '#b91c1c',
    to: '#450a0a',
    shadow: 'rgba(239, 68, 68, 0.55)',
    accent: '#fecaca',
    shape: 'squircle',
    finish: 'metallic',
    glow: true,
    tag: 'Sports Car & Drive',
  },
  {
    id: 'emblem_luxury_resort',
    name: 'Paradise Oasis',
    category: 'Travel & Adventure',
    icon: 'Palmtree',
    from: '#06b6d4',
    via: '#0891b2',
    to: '#164e63',
    shadow: 'rgba(6, 182, 212, 0.5)',
    accent: '#cffafe',
    shape: 'squircle',
    finish: 'glass',
    glow: true,
    tag: 'Hotels & Resorts',
  },
  {
    id: 'emblem_fuel_power',
    name: 'Nitro Refuel',
    category: 'Travel & Adventure',
    icon: 'Fuel',
    from: '#f59e0b',
    via: '#ea580c',
    to: '#7c2d12',
    shadow: 'rgba(245, 158, 11, 0.5)',
    accent: '#fef3c7',
    shape: 'squircle',
    finish: 'metallic',
    glow: true,
    tag: 'Fuel & Highway',
  },

  // --- Power & Health ---
  {
    id: 'emblem_iron_titan',
    name: 'Iron Forge Titan',
    category: 'Power & Health',
    icon: 'Dumbbell',
    from: '#475569',
    via: '#1e293b',
    to: '#020617',
    shadow: 'rgba(30, 41, 59, 0.6)',
    accent: '#f8fafc',
    shape: 'squircle',
    finish: 'metallic',
    glow: false,
    tag: 'Gym & Fitness',
  },
  {
    id: 'emblem_vital_pulse',
    name: 'Life Pulse Beacon',
    category: 'Power & Health',
    icon: 'HeartPulse',
    from: '#e11d48',
    via: '#be123c',
    to: '#4c0519',
    shadow: 'rgba(225, 29, 72, 0.55)',
    accent: '#ffe4e6',
    shape: 'shield',
    finish: 'neon',
    glow: true,
    tag: 'Medical & Health',
  },
  {
    id: 'emblem_zen_lotus',
    name: 'Serenity Lotus',
    category: 'Power & Health',
    icon: 'Flower2',
    from: '#a855f7',
    via: '#7c3aed',
    to: '#2e1065',
    shadow: 'rgba(168, 85, 247, 0.5)',
    accent: '#f3e8ff',
    shape: 'circle',
    finish: 'glass',
    glow: true,
    tag: 'Mind & Yoga',
  },
  {
    id: 'emblem_lightning_strike',
    name: 'Thunderbolt Prime',
    category: 'Power & Health',
    icon: 'Zap',
    from: '#facc15',
    via: '#eab308',
    to: '#713f12',
    shadow: 'rgba(250, 204, 21, 0.6)',
    accent: '#fef9c3',
    shape: 'diamond',
    finish: 'neon',
    glow: true,
    tag: 'Energy & Power',
  },

  // --- Home & Living ---
  {
    id: 'emblem_castle_manor',
    name: 'Grand Manor',
    category: 'Home & Living',
    icon: 'Home',
    from: '#7c3aed',
    via: '#5b21b6',
    to: '#1e1b4b',
    shadow: 'rgba(124, 58, 237, 0.5)',
    accent: '#ede9fe',
    shape: 'squircle',
    finish: 'metallic',
    glow: true,
    tag: 'Real Estate & Villa',
  },
  {
    id: 'emblem_peer_handshake',
    name: 'Trust Alliance',
    category: 'Home & Living',
    icon: 'Handshake',
    from: '#0d9488',
    via: '#0f766e',
    to: '#115e59',
    shadow: 'rgba(13, 148, 136, 0.5)',
    accent: '#ccfbf1',
    shape: 'squircle',
    finish: 'gloss',
    glow: true,
    tag: 'Lent & Borrowed',
  },
  {
    id: 'emblem_family_crest',
    name: 'Harmony Clan',
    category: 'Home & Living',
    icon: 'Users',
    from: '#ec4899',
    via: '#db2777',
    to: '#831843',
    shadow: 'rgba(236, 72, 153, 0.5)',
    accent: '#fce7f3',
    shape: 'circle',
    finish: 'gloss',
    glow: true,
    tag: 'Family & Kin',
  },
  {
    id: 'emblem_sparkle_clean',
    name: 'Crystal Clean',
    category: 'Home & Living',
    icon: 'Sparkles',
    from: '#06b6d4',
    via: '#0891b2',
    to: '#155e75',
    shadow: 'rgba(6, 182, 212, 0.5)',
    accent: '#cffafe',
    shape: 'squircle',
    finish: 'glass',
    glow: true,
    tag: 'Home Care',
  },
  {
    id: 'emblem_pet_guardian',
    name: 'Paws & Whiskers',
    category: 'Home & Living',
    icon: 'Dog',
    from: '#f97316',
    via: '#c2410c',
    to: '#7c2d12',
    shadow: 'rgba(249, 115, 22, 0.5)',
    accent: '#fed7aa',
    shape: 'squircle',
    finish: 'gloss',
    glow: true,
    tag: 'Pets & Animals',
  },

  // --- Entertainment & Art ---
  {
    id: 'emblem_gaming_arcade',
    name: 'Cyber Arcade',
    category: 'Entertainment & Art',
    icon: 'Gamepad2',
    from: '#6366f1',
    via: '#4f46e5',
    to: '#312e81',
    shadow: 'rgba(99, 102, 241, 0.55)',
    accent: '#e0e7ff',
    shape: 'squircle',
    finish: 'neon',
    glow: true,
    tag: 'Gaming & Stream',
  },
  {
    id: 'emblem_cinema_star',
    name: 'Silver Screen',
    category: 'Entertainment & Art',
    icon: 'Film',
    from: '#e11d48',
    via: '#be123c',
    to: '#4c0519',
    shadow: 'rgba(225, 29, 72, 0.5)',
    accent: '#ffe4e6',
    shape: 'squircle',
    finish: 'gloss',
    glow: true,
    tag: 'OTT & Movies',
  },
  {
    id: 'emblem_music_sonic',
    name: 'Sonic Vinyl',
    category: 'Entertainment & Art',
    icon: 'Music',
    from: '#10b981',
    via: '#047857',
    to: '#064e3b',
    shadow: 'rgba(16, 185, 129, 0.5)',
    accent: '#a7f3d0',
    shape: 'circle',
    finish: 'hologram',
    glow: true,
    tag: 'Spotify & Tracks',
  },
  {
    id: 'emblem_graduation_scholar',
    name: 'Athena Scholar',
    category: 'Entertainment & Art',
    icon: 'GraduationCap',
    from: '#2563eb',
    via: '#1d4ed8',
    to: '#1e3a8a',
    shadow: 'rgba(37, 99, 235, 0.5)',
    accent: '#dbeafe',
    shape: 'squircle',
    finish: 'metallic',
    glow: true,
    tag: 'Courses & Study',
  },
];

// Helper to get all custom emblems stored in localStorage
const CUSTOM_EMBLEMS_STORAGE_KEY = 'money_custom_3d_emblems_v1';

export function getStoredCustomEmblems(): Custom3DEmblem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_EMBLEMS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse custom emblems', err);
    return [];
  }
}

export function saveCustomEmblem(emblem: Omit<Custom3DEmblem, 'id' | 'createdAt'>): Custom3DEmblem {
  const existing = getStoredCustomEmblems();
  const newEmblem: Custom3DEmblem = {
    ...emblem,
    id: `custom_emblem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
  };
  const updated = [newEmblem, ...existing.filter(e => e.name.toLowerCase() !== emblem.name.toLowerCase())];
  try {
    localStorage.setItem(CUSTOM_EMBLEMS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save custom emblem', err);
  }
  return newEmblem;
}

export function deleteCustomEmblem(id: string): void {
  const existing = getStoredCustomEmblems();
  const updated = existing.filter(e => e.id !== id);
  try {
    localStorage.setItem(CUSTOM_EMBLEMS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete custom emblem', err);
  }
}

// 3D Emblem Pure Component
interface Emblem3DProps {
  name?: string;
  icon?: string;
  presetId?: string;
  from?: string;
  via?: string;
  to?: string;
  shadow?: string;
  accent?: string;
  shape?: EmblemShape;
  finish?: EmblemFinish;
  glow?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export const Emblem3D: React.FC<Emblem3DProps> = ({
  name,
  icon,
  presetId,
  from,
  via,
  to,
  shadow,
  accent,
  shape = 'squircle',
  finish = 'gloss',
  glow = true,
  size = 'md',
  className = '',
  interactive = false,
  onClick,
}) => {
  // Find matching preset if presetId or name given
  let activePreset: Emblem3DPreset | null = null;
  if (presetId) {
    activePreset = NAMED_3D_EMBLEMS.find(p => p.id === presetId) || null;
  }
  if (!activePreset && name) {
    activePreset = NAMED_3D_EMBLEMS.find(p => p.name.toLowerCase() === name.toLowerCase()) || null;
  }

  const effectiveFrom = from || activePreset?.from || '#3b82f6';
  const effectiveVia = via || activePreset?.via;
  const effectiveTo = to || activePreset?.to || '#1d4ed8';
  const effectiveShadow = shadow || activePreset?.shadow || `${effectiveFrom}60`;
  const effectiveAccent = accent || activePreset?.accent || '#ffffff';
  const effectiveShape = shape || activePreset?.shape || 'squircle';
  const effectiveFinish = finish || activePreset?.finish || 'gloss';
  const effectiveIcon = icon || activePreset?.icon || 'Sparkles';
  const effectiveGlow = glow ?? activePreset?.glow ?? true;

  // Sizing
  let containerSizePx = 38;
  let iconSizePx = 19;
  let borderRad = '16px';

  if (typeof size === 'number') {
    containerSizePx = size;
    iconSizePx = Math.round(size * 0.5);
    borderRad = `${Math.round(size * 0.35)}px`;
  } else {
    switch (size) {
      case 'xs':
        containerSizePx = 24;
        iconSizePx = 12;
        borderRad = '8px';
        break;
      case 'sm':
        containerSizePx = 30;
        iconSizePx = 15;
        borderRad = '10px';
        break;
      case 'md':
        containerSizePx = 40;
        iconSizePx = 20;
        borderRad = '14px';
        break;
      case 'lg':
        containerSizePx = 48;
        iconSizePx = 24;
        borderRad = '18px';
        break;
      case 'xl':
        containerSizePx = 60;
        iconSizePx = 30;
        borderRad = '22px';
        break;
      case '2xl':
        containerSizePx = 76;
        iconSizePx = 38;
        borderRad = '26px';
        break;
    }
  }

  // Shape class or clip
  let shapeClass = 'rounded-2xl';
  let clipPathStyle: string | undefined = undefined;

  switch (effectiveShape) {
    case 'circle':
      shapeClass = 'rounded-full';
      borderRad = '9999px';
      break;
    case 'shield':
      shapeClass = 'rounded-t-2xl rounded-b-[24px]';
      break;
    case 'diamond':
      shapeClass = 'rounded-2xl rotate-45';
      break;
    case 'hexagon':
      clipPathStyle = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
      break;
    case 'octagon':
      clipPathStyle = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
      break;
    default:
      shapeClass = 'rounded-2xl';
  }

  const IconComp = (LucideIcons as any)[effectiveIcon] || LucideIcons.Sparkles;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${shapeClass} ${className} ${
        interactive ? 'cursor-pointer hover:scale-108 active:scale-95 transition-all duration-200 shadow-md hover:shadow-xl' : ''
      }`}
      style={{
        width: `${containerSizePx}px`,
        height: `${containerSizePx}px`,
        borderRadius: clipPathStyle ? undefined : borderRad,
        clipPath: clipPathStyle,
        background: `linear-gradient(135deg, ${effectiveFrom} 0%, ${effectiveVia || effectiveFrom} 48%, ${effectiveTo} 100%)`,
        boxShadow: effectiveGlow
          ? `0 8px 18px -3px ${effectiveShadow}, 0 3px 6px -2px ${effectiveShadow}, inset 0 2px 2px 0 rgba(255,255,255,0.7), inset 0 -2.5px 5px 0 rgba(0,0,0,0.4)`
          : `inset 0 1.5px 1.5px 0 rgba(255,255,255,0.5), inset 0 -2px 4px 0 rgba(0,0,0,0.3)`,
      }}
    >
      {/* 3D Curved Gloss Surface Highlight */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          borderRadius: clipPathStyle ? undefined : borderRad,
          background:
            effectiveFinish === 'metallic'
              ? 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.3) 100%)'
              : effectiveFinish === 'neon'
              ? 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 80%)'
              : effectiveFinish === 'hologram'
              ? 'linear-gradient(45deg, rgba(255,0,128,0.2) 0%, rgba(0,255,255,0.3) 50%, rgba(255,255,0,0.2) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.48) 0%, rgba(255, 255, 255, 0.1) 42%, rgba(255, 255, 255, 0) 65%)',
        }}
      />

      {/* Specular Highlight Orb */}
      <div
        className="absolute top-1 left-1.5 w-1/3 h-1/4 rounded-full opacity-65 pointer-events-none blur-[0.5px]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 75%)',
        }}
      />

      {/* Embossed Lucide Icon */}
      <div
        className={`relative z-10 flex items-center justify-center text-white ${effectiveShape === 'diamond' ? '-rotate-45' : ''}`}
        style={{
          filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.45)) drop-shadow(0 0.5px 0.5px rgba(255,255,255,0.25))',
        }}
      >
        <IconComp size={iconSizePx} strokeWidth={2.4} className="text-white" />
      </div>
    </div>
  );
};
