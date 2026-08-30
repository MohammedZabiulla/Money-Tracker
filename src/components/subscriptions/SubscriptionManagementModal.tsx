import React, { useState, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Subscription, SubscriptionCatalogItem, RecurrenceFrequency } from '../../types';
import { formatINR } from '../../lib/currency';
import { Category3DIcon, SubscriptionBrandIcon } from '../common/IconHelper';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { CustomDatePicker } from '../common/CustomDatePicker';
import {
  X,
  Plus,
  Search,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  Repeat,
  CreditCard as CreditCardIcon,
  CheckCircle2,
  Layers,
  TrendingUp,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface SubscriptionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SUBSCRIPTIONS_CATALOGUE: SubscriptionCatalogItem[] = [
  // 1. OTT & Streaming
  {
    id: 'sub_netflix',
    name: 'Netflix',
    tagline: 'Movies, TV shows & Netflix originals in 4K HDR',
    category: 'OTT & Streaming',
    defaultAmount: 649,
    frequency: 'MONTHLY',
    icon: 'Tv',
    color: '#E50914',
    gradient: 'from-[#E50914] via-[#B81D24] to-[#221F1F]',
    popular: true,
    plans: [
      { name: 'Mobile (480p)', amount: 149, frequency: 'MONTHLY' },
      { name: 'Basic (720p)', amount: 199, frequency: 'MONTHLY' },
      { name: 'Standard (1080p)', amount: 499, frequency: 'MONTHLY' },
      { name: 'Premium (4K Ultra HD)', amount: 649, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_prime',
    name: 'Amazon Prime',
    tagline: 'Prime Video, free 1-day delivery & Amazon Music',
    category: 'OTT & Streaming',
    defaultAmount: 1499,
    frequency: 'YEARLY',
    icon: 'ShoppingBag',
    color: '#00A8E1',
    gradient: 'from-[#00A8E1] via-[#007EB9] to-[#002F54]',
    popular: true,
    plans: [
      { name: 'Prime Monthly', amount: 299, frequency: 'MONTHLY' },
      { name: 'Prime Quarterly', amount: 599, frequency: 'QUARTERLY' },
      { name: 'Prime Annual', amount: 1499, frequency: 'YEARLY' },
      { name: 'Prime Shopping Edition', amount: 399, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_hotstar',
    name: 'Disney+ Hotstar',
    tagline: 'Live cricket, Disney, Marvel, HBO & Hotstar Specials',
    category: 'OTT & Streaming',
    defaultAmount: 899,
    frequency: 'YEARLY',
    icon: 'Tv',
    color: '#0C3868',
    gradient: 'from-[#113CCF] via-[#0C3868] to-[#04142B]',
    popular: true,
    plans: [
      { name: 'Super (Full HD - 2 screens)', amount: 899, frequency: 'YEARLY' },
      { name: 'Premium (4K - 4 screens)', amount: 1499, frequency: 'YEARLY' },
      { name: 'Premium Monthly', amount: 299, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_youtube_prem',
    name: 'YouTube Premium',
    tagline: 'Ad-free YouTube & YouTube Music with background play',
    category: 'OTT & Streaming',
    defaultAmount: 149,
    frequency: 'MONTHLY',
    icon: 'Film',
    color: '#FF0000',
    gradient: 'from-[#FF0000] via-[#CC0000] to-[#282828]',
    popular: true,
    plans: [
      { name: 'Individual Monthly', amount: 149, frequency: 'MONTHLY' },
      { name: 'Family Plan (5 members)', amount: 299, frequency: 'MONTHLY' },
      { name: 'Student Plan', amount: 79, frequency: 'MONTHLY' },
      { name: 'Annual Individual', amount: 1290, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_jiocinema',
    name: 'JioCinema Premium',
    tagline: 'HBO, Peacock, Warner Bros blockbusters & 4K live sports',
    category: 'OTT & Streaming',
    defaultAmount: 29,
    frequency: 'MONTHLY',
    icon: 'Tv',
    color: '#0B3FC2',
    gradient: 'from-[#0A2885] via-[#0B3FC2] to-[#041A5C]',
    popular: true,
    plans: [
      { name: 'Premium Monthly (1 Screen)', amount: 29, frequency: 'MONTHLY' },
      { name: 'Family Monthly (4 Screens)', amount: 89, frequency: 'MONTHLY' },
      { name: 'Annual Premium', amount: 299, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_sonyliv',
    name: 'Sony LIV',
    tagline: 'UEFA Champions League, WWE, MasterChef & Shark Tank',
    category: 'OTT & Streaming',
    defaultAmount: 999,
    frequency: 'YEARLY',
    icon: 'Tv',
    color: '#00539B',
    gradient: 'from-[#00539B] via-[#002D54] to-[#0F172A]',
    popular: true,
    plans: [
      { name: 'Premium Annual', amount: 999, frequency: 'YEARLY' },
      { name: 'Premium Monthly', amount: 299, frequency: 'MONTHLY' },
      { name: 'Mobile Only (Annual)', amount: 599, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_zee5',
    name: 'ZEE5 Premium',
    tagline: 'Indian blockbusters, regional web series & live TV channels',
    category: 'OTT & Streaming',
    defaultAmount: 699,
    frequency: 'YEARLY',
    icon: 'Tv',
    color: '#8230C6',
    gradient: 'from-[#8230C6] via-[#5B1F8C] to-[#240B3B]',
    popular: false,
    plans: [
      { name: 'Premium 4K Annual', amount: 699, frequency: 'YEARLY' },
      { name: 'Premium Monthly', amount: 149, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_appletv',
    name: 'Apple TV+',
    tagline: 'Critically acclaimed Apple Original films and series',
    category: 'OTT & Streaming',
    defaultAmount: 99,
    frequency: 'MONTHLY',
    icon: 'Tv',
    color: '#1E293B',
    gradient: 'from-[#334155] via-[#1E293B] to-[#0F172A]',
    popular: false,
    plans: [{ name: 'Monthly Plan', amount: 99, frequency: 'MONTHLY' }],
  },
  {
    id: 'sub_crunchyroll',
    name: 'Crunchyroll',
    tagline: 'World\'s largest anime library with simuldubs and manga',
    category: 'OTT & Streaming',
    defaultAmount: 99,
    frequency: 'MONTHLY',
    icon: 'Tv',
    color: '#F47521',
    gradient: 'from-[#F47521] via-[#D35400] to-[#23120B]',
    popular: false,
    plans: [
      { name: 'Fan (1 Screen)', amount: 79, frequency: 'MONTHLY' },
      { name: 'Mega Fan (4 Screens)', amount: 99, frequency: 'MONTHLY' },
      { name: 'Mega Fan Annual', amount: 999, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_sunnxt',
    name: 'Sun NXT',
    tagline: 'Tamil, Telugu, Malayalam & Kannada movies and TV shows',
    category: 'OTT & Streaming',
    defaultAmount: 499,
    frequency: 'YEARLY',
    icon: 'Tv',
    color: '#FF6B00',
    gradient: 'from-[#FF6B00] via-[#E65100] to-[#3E1600]',
    popular: false,
    plans: [{ name: 'Annual Premium', amount: 499, frequency: 'YEARLY' }],
  },
  {
    id: 'sub_aha',
    name: 'Aha Video',
    tagline: '100% Telugu & Tamil regional blockbusters and originals',
    category: 'OTT & Streaming',
    defaultAmount: 699,
    frequency: 'YEARLY',
    icon: 'Tv',
    color: '#FF4500',
    gradient: 'from-[#FF4500] via-[#C0392B] to-[#3B0E07]',
    popular: false,
    plans: [{ name: 'Aha Gold Annual', amount: 699, frequency: 'YEARLY' }],
  },
  {
    id: 'sub_mubi',
    name: 'MUBI',
    tagline: 'Hand-picked independent and world cinema streaming',
    category: 'OTT & Streaming',
    defaultAmount: 499,
    frequency: 'MONTHLY',
    icon: 'Film',
    color: '#1A1A2E',
    gradient: 'from-[#1A1A2E] via-[#16213E] to-[#0F3460]',
    popular: false,
    plans: [
      { name: 'Monthly Membership', amount: 499, frequency: 'MONTHLY' },
      { name: 'Annual Membership', amount: 3588, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_lionsgate',
    name: 'Lionsgate Play',
    tagline: 'Hollywood action, drama franchises & star-studded cinema',
    category: 'OTT & Streaming',
    defaultAmount: 699,
    frequency: 'YEARLY',
    icon: 'Film',
    color: '#BFA15F',
    gradient: 'from-[#BFA15F] via-[#8C7338] to-[#1C1605]',
    popular: false,
    plans: [{ name: 'Annual VIP', amount: 699, frequency: 'YEARLY' }],
  },
  {
    id: 'sub_discovery_plus',
    name: 'Discovery+',
    tagline: 'Science, history, wildlife, food & reality documentaries',
    category: 'OTT & Streaming',
    defaultAmount: 399,
    frequency: 'YEARLY',
    icon: 'Tv',
    color: '#0033A0',
    gradient: 'from-[#0033A0] via-[#002266] to-[#001133]',
    popular: false,
    plans: [{ name: 'Annual Premium', amount: 399, frequency: 'YEARLY' }],
  },

  // 2. Music & Audio
  {
    id: 'sub_spotify',
    name: 'Spotify Premium',
    tagline: 'High quality music streaming, offline downloads & podcasts',
    category: 'Music & Audio',
    defaultAmount: 119,
    frequency: 'MONTHLY',
    icon: 'Music',
    color: '#1DB954',
    gradient: 'from-[#1DB954] via-[#168E40] to-[#121212]',
    popular: true,
    plans: [
      { name: 'Individual', amount: 119, frequency: 'MONTHLY' },
      { name: 'Duo (2 Accounts)', amount: 149, frequency: 'MONTHLY' },
      { name: 'Family (6 Accounts)', amount: 179, frequency: 'MONTHLY' },
      { name: 'Student', amount: 59, frequency: 'MONTHLY' },
      { name: 'Annual Individual', amount: 1189, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_applemusic',
    name: 'Apple Music',
    tagline: 'Lossless Audio, Spatial Audio with Dolby Atmos & lyrics',
    category: 'Music & Audio',
    defaultAmount: 99,
    frequency: 'MONTHLY',
    icon: 'Music',
    color: '#FA243C',
    gradient: 'from-[#FA243C] via-[#D81B60] to-[#880E4F]',
    popular: true,
    plans: [
      { name: 'Individual Monthly', amount: 99, frequency: 'MONTHLY' },
      { name: 'Family (up to 6 members)', amount: 149, frequency: 'MONTHLY' },
      { name: 'Student', amount: 49, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_youtubemusic',
    name: 'YouTube Music',
    tagline: 'Ad-free official tracks, live albums, remixes & music videos',
    category: 'Music & Audio',
    defaultAmount: 99,
    frequency: 'MONTHLY',
    icon: 'Music',
    color: '#FF0000',
    gradient: 'from-[#FF0000] via-[#CC0000] to-[#1C1C1C]',
    popular: false,
    plans: [
      { name: 'Individual Monthly', amount: 99, frequency: 'MONTHLY' },
      { name: 'Family Plan', amount: 149, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_audible',
    name: 'Audible India',
    tagline: 'Audiobooks, exclusive podcasts & bestselling audio stories',
    category: 'Music & Audio',
    defaultAmount: 199,
    frequency: 'MONTHLY',
    icon: 'BookOpen',
    color: '#F8991C',
    gradient: 'from-[#F8991C] via-[#C96B00] to-[#2B1B00]',
    popular: true,
    plans: [{ name: '1 Credit / Month', amount: 199, frequency: 'MONTHLY' }],
  },
  {
    id: 'sub_jiosaavn',
    name: 'JioSaavn Pro',
    tagline: 'High quality 320kbps music streaming & unlimited JioTunes',
    category: 'Music & Audio',
    defaultAmount: 99,
    frequency: 'MONTHLY',
    icon: 'Music',
    color: '#2BC5B4',
    gradient: 'from-[#2BC5B4] via-[#1E998B] to-[#0A4740]',
    popular: false,
    plans: [
      { name: 'Monthly Pro', amount: 99, frequency: 'MONTHLY' },
      { name: 'Annual Pro', amount: 749, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_gaana',
    name: 'Gaana Plus',
    tagline: 'HD songs, regional playlists & offline download modes',
    category: 'Music & Audio',
    defaultAmount: 399,
    frequency: 'YEARLY',
    icon: 'Music',
    color: '#E72C30',
    gradient: 'from-[#E72C30] via-[#A81E21] to-[#3B0708]',
    popular: false,
    plans: [{ name: 'Annual Plus', amount: 399, frequency: 'YEARLY' }],
  },
  {
    id: 'sub_kukufm',
    name: 'Kuku FM',
    tagline: 'Regional Indian audiobooks, podcasts, book summaries & stories',
    category: 'Music & Audio',
    defaultAmount: 399,
    frequency: 'YEARLY',
    icon: 'Radio',
    color: '#FF5722',
    gradient: 'from-[#FF5722] via-[#E64A19] to-[#3E1407]',
    popular: false,
    plans: [{ name: 'Annual VIP', amount: 399, frequency: 'YEARLY' }],
  },
  {
    id: 'sub_pocketfm',
    name: 'Pocket FM',
    tagline: 'Audio series, romantic audio stories and suspense thrillers',
    category: 'Music & Audio',
    defaultAmount: 199,
    frequency: 'MONTHLY',
    icon: 'Radio',
    color: '#FF2A54',
    gradient: 'from-[#FF2A54] via-[#C91A3E] to-[#400410]',
    popular: false,
    plans: [{ name: 'Monthly VIP', amount: 199, frequency: 'MONTHLY' }],
  },

  // 3. Productivity & AI
  {
    id: 'sub_chatgpt',
    name: 'ChatGPT Plus',
    tagline: 'Access to GPT-4o, DALL·E 3, Voice Mode & Custom GPTs',
    category: 'Productivity & AI',
    defaultAmount: 1999,
    frequency: 'MONTHLY',
    icon: 'Sparkles',
    color: '#10A37F',
    gradient: 'from-[#10A37F] via-[#0B7057] to-[#1A1A1A]',
    popular: true,
    plans: [{ name: 'ChatGPT Plus Monthly', amount: 1999, frequency: 'MONTHLY' }],
  },
  {
    id: 'sub_claude_pro',
    name: 'Claude Pro (Anthropic)',
    tagline: '5x more usage of Claude 3.5 Sonnet, Projects & Artifacts',
    category: 'Productivity & AI',
    defaultAmount: 1999,
    frequency: 'MONTHLY',
    icon: 'Sparkles',
    color: '#D97706',
    gradient: 'from-[#D97706] via-[#CC6B49] to-[#8C3A1A]',
    popular: true,
    plans: [{ name: 'Claude Pro Monthly', amount: 1999, frequency: 'MONTHLY' }],
  },
  {
    id: 'sub_googleone',
    name: 'Google One',
    tagline: 'Cloud storage for Google Photos, Drive & Gmail (100 GB+)',
    category: 'Productivity & AI',
    defaultAmount: 130,
    frequency: 'MONTHLY',
    icon: 'Cloud',
    color: '#4285F4',
    gradient: 'from-[#4285F4] via-[#34A853] to-[#EA4335]',
    popular: true,
    plans: [
      { name: 'Basic (100 GB Monthly)', amount: 130, frequency: 'MONTHLY' },
      { name: 'Standard (200 GB Monthly)', amount: 210, frequency: 'MONTHLY' },
      { name: 'Premium (2 TB Monthly + AI)', amount: 650, frequency: 'MONTHLY' },
      { name: 'AI Premium (2 TB + Gemini Advanced)', amount: 1950, frequency: 'MONTHLY' },
      { name: 'Basic 100 GB (Annual)', amount: 1300, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_icloud',
    name: 'Apple iCloud+',
    tagline: 'Secure Apple cloud storage, Private Relay & Hide My Email',
    category: 'Productivity & AI',
    defaultAmount: 75,
    frequency: 'MONTHLY',
    icon: 'Cloud',
    color: '#007AFF',
    gradient: 'from-[#007AFF] via-[#0051A8] to-[#1C1C1E]',
    popular: true,
    plans: [
      { name: '50 GB Plan', amount: 75, frequency: 'MONTHLY' },
      { name: '200 GB Plan (Shareable)', amount: 219, frequency: 'MONTHLY' },
      { name: '2 TB Plan (Shareable)', amount: 749, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_microsoft365',
    name: 'Microsoft 365 (Office)',
    tagline: 'Word, Excel, PowerPoint & 1 TB OneDrive storage per user',
    category: 'Productivity & AI',
    defaultAmount: 489,
    frequency: 'MONTHLY',
    icon: 'Layers',
    color: '#D83B01',
    gradient: 'from-[#D83B01] via-[#B83100] to-[#1E1E1E]',
    popular: true,
    plans: [
      { name: 'Personal (1 User / 1 TB)', amount: 489, frequency: 'MONTHLY' },
      { name: 'Family (6 Users / 6 TB)', amount: 619, frequency: 'MONTHLY' },
      { name: 'Personal (Annual)', amount: 4899, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_github_copilot',
    name: 'GitHub Copilot',
    tagline: 'AI pair programmer for code completion and chat',
    category: 'Productivity & AI',
    defaultAmount: 850,
    frequency: 'MONTHLY',
    icon: 'Terminal',
    color: '#24292F',
    gradient: 'from-[#4F46E5] via-[#24292F] to-[#0F172A]',
    popular: true,
    plans: [
      { name: 'Individual Monthly', amount: 850, frequency: 'MONTHLY' },
      { name: 'Individual Annual', amount: 8500, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_notion',
    name: 'Notion Plus',
    tagline: 'Unlimited blocks, file uploads & collaborative workspace',
    category: 'Productivity & AI',
    defaultAmount: 850,
    frequency: 'MONTHLY',
    icon: 'BookOpen',
    color: '#000000',
    gradient: 'from-[#2F3437] via-[#191919] to-[#0A0A0A]',
    popular: true,
    plans: [{ name: 'Notion Plus Monthly', amount: 850, frequency: 'MONTHLY' }],
  },
  {
    id: 'sub_canva_pro',
    name: 'Canva Pro',
    tagline: 'Premium templates, brand kit, magic resize & background remover',
    category: 'Productivity & AI',
    defaultAmount: 499,
    frequency: 'MONTHLY',
    icon: 'Palette',
    color: '#00C4CC',
    gradient: 'from-[#00C4CC] via-[#7D2AE8] to-[#450C94]',
    popular: true,
    plans: [
      { name: 'Canva Pro Monthly', amount: 499, frequency: 'MONTHLY' },
      { name: 'Canva Pro Annual', amount: 3999, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_figma',
    name: 'Figma Professional',
    tagline: 'Collaborative UI/UX design, shared libraries & dev mode',
    category: 'Productivity & AI',
    defaultAmount: 1200,
    frequency: 'MONTHLY',
    icon: 'Layout',
    color: '#F24E1E',
    gradient: 'from-[#F24E1E] via-[#A259FF] to-[#0ACF83]',
    popular: false,
    plans: [{ name: 'Figma Pro Editor', amount: 1200, frequency: 'MONTHLY' }],
  },
  {
    id: 'sub_midjourney',
    name: 'Midjourney AI',
    tagline: 'State of the art generative AI image art creation',
    category: 'Productivity & AI',
    defaultAmount: 850,
    frequency: 'MONTHLY',
    icon: 'Sparkles',
    color: '#6366F1',
    gradient: 'from-[#0F172A] via-[#020617] to-[#000000]',
    popular: false,
    plans: [
      { name: 'Basic Plan', amount: 850, frequency: 'MONTHLY' },
      { name: 'Standard Plan', amount: 2500, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_perplexity',
    name: 'Perplexity Pro',
    tagline: 'Deep research, multi-model AI reasoning & file analysis',
    category: 'Productivity & AI',
    defaultAmount: 1700,
    frequency: 'MONTHLY',
    icon: 'Sparkles',
    color: '#20B2AA',
    gradient: 'from-[#20B2AA] via-[#008B8B] to-[#004D40]',
    popular: false,
    plans: [{ name: 'Perplexity Pro Monthly', amount: 1700, frequency: 'MONTHLY' }],
  },
  {
    id: 'sub_grammarly',
    name: 'Grammarly Premium',
    tagline: 'Tone adjustments, clarity suggestions & plagiarism checker',
    category: 'Productivity & AI',
    defaultAmount: 999,
    frequency: 'MONTHLY',
    icon: 'Check',
    color: '#15C39A',
    gradient: 'from-[#15C39A] via-[#0FA07E] to-[#064234]',
    popular: false,
    plans: [
      { name: 'Monthly Premium', amount: 999, frequency: 'MONTHLY' },
      { name: 'Annual Premium', amount: 5999, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_adobe_cc',
    name: 'Adobe Creative Cloud',
    tagline: 'Photoshop, Illustrator, Premiere Pro, After Effects & Acrobat',
    category: 'Productivity & AI',
    defaultAmount: 4230,
    frequency: 'MONTHLY',
    icon: 'Layers',
    color: '#FA0F00',
    gradient: 'from-[#FA0F00] via-[#D60000] to-[#800000]',
    popular: false,
    plans: [
      { name: 'Photography Plan (Photoshop + Lightroom)', amount: 799, frequency: 'MONTHLY' },
      { name: 'All Apps Creative Cloud', amount: 4230, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_1password',
    name: '1Password',
    tagline: 'Ultra-secure password manager, passkeys & vault sharing',
    category: 'Productivity & AI',
    defaultAmount: 299,
    frequency: 'MONTHLY',
    icon: 'Key',
    color: '#0A85EA',
    gradient: 'from-[#0A85EA] via-[#0560AA] to-[#023561]',
    popular: false,
    plans: [
      { name: 'Individual', amount: 299, frequency: 'MONTHLY' },
      { name: 'Family (5 Members)', amount: 499, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_todoist',
    name: 'Todoist Pro',
    tagline: 'Task manager, reminders, calendar sync & productivity graphs',
    category: 'Productivity & AI',
    defaultAmount: 350,
    frequency: 'MONTHLY',
    icon: 'CheckCircle2',
    color: '#E44332',
    gradient: 'from-[#E44332] via-[#B82E20] to-[#3B0C07]',
    popular: false,
    plans: [
      { name: 'Pro Monthly', amount: 350, frequency: 'MONTHLY' },
      { name: 'Pro Annual', amount: 3000, frequency: 'YEARLY' },
    ],
  },

  // 4. Food & Delivery
  {
    id: 'sub_swiggy_one',
    name: 'Swiggy One',
    tagline: 'Unlimited free food & Instamart grocery delivery above ₹149',
    category: 'Food & Delivery',
    defaultAmount: 299,
    frequency: 'QUARTERLY',
    icon: 'ShoppingBag',
    color: '#FC8019',
    gradient: 'from-[#FC8019] via-[#E26A06] to-[#451A03]',
    popular: true,
    plans: [
      { name: '3 Months Plan', amount: 299, frequency: 'QUARTERLY' },
      { name: '1 Year Plan', amount: 899, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_zomato_gold',
    name: 'Zomato Gold',
    tagline: 'Free delivery on food orders & up to 40% off dining out',
    category: 'Food & Delivery',
    defaultAmount: 199,
    frequency: 'QUARTERLY',
    icon: 'Utensils',
    color: '#CB202D',
    gradient: 'from-[#CB202D] via-[#A81520] to-[#450A0A]',
    popular: true,
    plans: [
      { name: '3 Months Plan', amount: 199, frequency: 'QUARTERLY' },
      { name: 'Annual Plan', amount: 699, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_blinkit_pass',
    name: 'Blinkit Pass',
    tagline: 'Free 10-minute grocery delivery & exclusive product discounts',
    category: 'Food & Delivery',
    defaultAmount: 99,
    frequency: 'MONTHLY',
    icon: 'ShoppingBag',
    color: '#F7D200',
    gradient: 'from-[#F7D200] via-[#E5BF00] to-[#A88C00]',
    popular: true,
    plans: [{ name: 'Monthly Pass', amount: 99, frequency: 'MONTHLY' }],
  },
  {
    id: 'sub_zepto_pass',
    name: 'Zepto Pass',
    tagline: 'Unlimited free 10-min grocery delivery & cafe discounts',
    category: 'Food & Delivery',
    defaultAmount: 99,
    frequency: 'MONTHLY',
    icon: 'Zap',
    color: '#9A16E6',
    gradient: 'from-[#9A16E6] via-[#750DB3] to-[#470370]',
    popular: true,
    plans: [
      { name: 'Monthly Pass', amount: 99, frequency: 'MONTHLY' },
      { name: 'Quarterly Pass', amount: 199, frequency: 'QUARTERLY' },
    ],
  },
  {
    id: 'sub_bbstar',
    name: 'BBstar (BigBasket)',
    tagline: 'Free priority delivery, reserved delivery slots & cashback',
    category: 'Food & Delivery',
    defaultAmount: 299,
    frequency: 'HALF_YEARLY',
    icon: 'ShoppingBag',
    color: '#84C225',
    gradient: 'from-[#84C225] via-[#639915] to-[#1C3602]',
    popular: false,
    plans: [
      { name: '6 Months Membership', amount: 299, frequency: 'HALF_YEARLY' },
      { name: 'Annual Membership', amount: 499, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_eazydiner',
    name: 'EazyDiner Prime',
    tagline: 'Guaranteed 25% to 50% discount at 3000+ luxury restaurants',
    category: 'Food & Delivery',
    defaultAmount: 1995,
    frequency: 'YEARLY',
    icon: 'Utensils',
    color: '#FF6B00',
    gradient: 'from-[#FF6B00] via-[#E65100] to-[#381400]',
    popular: false,
    plans: [{ name: 'Annual Prime', amount: 1995, frequency: 'YEARLY' }],
  },

  // 5. Gaming
  {
    id: 'sub_ps_plus',
    name: 'PlayStation Plus',
    tagline: 'Online multiplayer, monthly PS4/PS5 games & Game Catalog',
    category: 'Gaming',
    defaultAmount: 499,
    frequency: 'MONTHLY',
    icon: 'Gamepad2',
    color: '#003791',
    gradient: 'from-[#003791] via-[#00246B] to-[#0A0E1A]',
    popular: true,
    plans: [
      { name: 'Essential (Monthly)', amount: 499, frequency: 'MONTHLY' },
      { name: 'Extra (Game Catalog - Annual)', amount: 6699, frequency: 'YEARLY' },
      { name: 'Deluxe (Classics - Annual)', amount: 7599, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_xbox_gamepass',
    name: 'Xbox Game Pass',
    tagline: 'Day-one access to new Xbox & PC games and EA Play',
    category: 'Gaming',
    defaultAmount: 549,
    frequency: 'MONTHLY',
    icon: 'Gamepad2',
    color: '#107C10',
    gradient: 'from-[#107C10] via-[#0B540B] to-[#041F04]',
    popular: true,
    plans: [
      { name: 'PC Game Pass', amount: 349, frequency: 'MONTHLY' },
      { name: 'Ultimate (Console + PC)', amount: 549, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_discord_nitro',
    name: 'Discord Nitro',
    tagline: 'Custom emojis everywhere, 500MB uploads, HD streaming & Nitro badges',
    category: 'Gaming',
    defaultAmount: 299,
    frequency: 'MONTHLY',
    icon: 'Gamepad2',
    color: '#5865F2',
    gradient: 'from-[#5865F2] via-[#4752C4] to-[#2C3280]',
    popular: true,
    plans: [
      { name: 'Nitro Basic', amount: 99, frequency: 'MONTHLY' },
      { name: 'Full Nitro Monthly', amount: 299, frequency: 'MONTHLY' },
      { name: 'Full Nitro Annual', amount: 2990, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_nintendo_online',
    name: 'Nintendo Switch Online',
    tagline: 'Online play, cloud backup saves & classic NES/SNES titles',
    category: 'Gaming',
    defaultAmount: 199,
    frequency: 'MONTHLY',
    icon: 'Gamepad2',
    color: '#E60012',
    gradient: 'from-[#E60012] via-[#B8000E] to-[#400005]',
    popular: false,
    plans: [
      { name: 'Individual (Monthly)', amount: 199, frequency: 'MONTHLY' },
      { name: 'Individual (Annual)', amount: 1600, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_ea_play',
    name: 'EA Play',
    tagline: 'Access top EA titles, early game trials and 10% member discounts',
    category: 'Gaming',
    defaultAmount: 315,
    frequency: 'MONTHLY',
    icon: 'Gamepad2',
    color: '#FF4747',
    gradient: 'from-[#FF4747] via-[#D81159] to-[#2E0213]',
    popular: false,
    plans: [
      { name: 'Monthly Membership', amount: 315, frequency: 'MONTHLY' },
      { name: 'Annual Membership', amount: 1990, frequency: 'YEARLY' },
    ],
  },

  // 6. Fitness & Wellness
  {
    id: 'sub_cultfit',
    name: 'Cult.fit / Cultpass',
    tagline: 'Unlimited access to Cult centres, gym workouts & yoga',
    category: 'Fitness & Wellness',
    defaultAmount: 1499,
    frequency: 'MONTHLY',
    icon: 'Dumbbell',
    color: '#FF3278',
    gradient: 'from-[#FF3278] via-[#D81159] to-[#2E0213]',
    popular: true,
    plans: [
      { name: 'Cultpass ELITE (Annual)', amount: 16990, frequency: 'YEARLY' },
      { name: 'Cultpass PRO (Annual)', amount: 11990, frequency: 'YEARLY' },
      { name: 'Cultpass Monthly', amount: 1499, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_headspace',
    name: 'Headspace',
    tagline: 'Guided meditation, sleep casts & mindfulness mental wellness',
    category: 'Fitness & Wellness',
    defaultAmount: 1499,
    frequency: 'YEARLY',
    icon: 'Flower2',
    color: '#F47D31',
    gradient: 'from-[#F47D31] via-[#D95F16] to-[#3B1502]',
    popular: true,
    plans: [{ name: 'Annual Membership', amount: 1499, frequency: 'YEARLY' }],
  },
  {
    id: 'sub_calm',
    name: 'Calm',
    tagline: 'Sleep stories, ambient soundscapes and anxiety breathing sessions',
    category: 'Fitness & Wellness',
    defaultAmount: 1499,
    frequency: 'YEARLY',
    icon: 'Flower2',
    color: '#3B82F6',
    gradient: 'from-[#3B82F6] via-[#1D4ED8] to-[#0A194E]',
    popular: false,
    plans: [{ name: 'Annual Calm Premium', amount: 1499, frequency: 'YEARLY' }],
  },
  {
    id: 'sub_strava',
    name: 'Strava Summit',
    tagline: 'Route planning, segment leaderboards, live beacon & training analysis',
    category: 'Fitness & Wellness',
    defaultAmount: 399,
    frequency: 'MONTHLY',
    icon: 'Activity',
    color: '#FC4C02',
    gradient: 'from-[#FC4C02] via-[#D63D00] to-[#8F2800]',
    popular: false,
    plans: [
      { name: 'Monthly Subscription', amount: 399, frequency: 'MONTHLY' },
      { name: 'Annual Subscription', amount: 2499, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_myfitnesspal',
    name: 'MyFitnessPal Premium',
    tagline: 'Barcode food scanner, macro tracking & custom calorie goals',
    category: 'Fitness & Wellness',
    defaultAmount: 699,
    frequency: 'MONTHLY',
    icon: 'HeartPulse',
    color: '#0066EE',
    gradient: 'from-[#0066EE] via-[#004DB3] to-[#002255]',
    popular: false,
    plans: [
      { name: 'Monthly Premium', amount: 699, frequency: 'MONTHLY' },
      { name: 'Annual Premium', amount: 3499, frequency: 'YEARLY' },
    ],
  },

  // 7. Cloud & Utilities
  {
    id: 'sub_airtel_fiber',
    name: 'Airtel Xstream Fiber',
    tagline: 'High-speed home optical fiber broadband connection',
    category: 'Cloud & Utilities',
    defaultAmount: 999,
    frequency: 'MONTHLY',
    icon: 'Wifi',
    color: '#E40000',
    gradient: 'from-[#E40000] via-[#B30000] to-[#1C0000]',
    popular: true,
    plans: [
      { name: 'Basic (40 Mbps)', amount: 499, frequency: 'MONTHLY' },
      { name: 'Standard (100 Mbps)', amount: 799, frequency: 'MONTHLY' },
      { name: 'Entertainment (200 Mbps)', amount: 999, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_jio_fiber',
    name: 'JioFiber / AirFiber',
    tagline: 'Unlimited high-speed internet with free OTT bundle',
    category: 'Cloud & Utilities',
    defaultAmount: 699,
    frequency: 'MONTHLY',
    icon: 'Wifi',
    color: '#0A2885',
    gradient: 'from-[#0A2885] via-[#05164D] to-[#01071A]',
    popular: true,
    plans: [
      { name: 'Monthly 30 Mbps', amount: 399, frequency: 'MONTHLY' },
      { name: 'Monthly 100 Mbps + OTT', amount: 699, frequency: 'MONTHLY' },
      { name: 'Monthly 150 Mbps + 14 OTTs', amount: 999, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_tataplay',
    name: 'Tata Play DTH',
    tagline: 'Direct-to-Home satellite television broadcast with HD packages',
    category: 'Cloud & Utilities',
    defaultAmount: 399,
    frequency: 'MONTHLY',
    icon: 'Tv',
    color: '#E91E63',
    gradient: 'from-[#E91E63] via-[#9C27B0] to-[#3F51B5]',
    popular: true,
    plans: [
      { name: 'Hindi Super Value Pack', amount: 249, frequency: 'MONTHLY' },
      { name: 'Family HD Mega Pack', amount: 499, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_act_fiber',
    name: 'ACT Fibernet',
    tagline: 'Gigabit fiber optic broadband with low latency gaming speed',
    category: 'Cloud & Utilities',
    defaultAmount: 799,
    frequency: 'MONTHLY',
    icon: 'Wifi',
    color: '#E53935',
    gradient: 'from-[#E53935] via-[#B71C1C] to-[#3B0707]',
    popular: false,
    plans: [
      { name: 'ACT Silver (100 Mbps)', amount: 799, frequency: 'MONTHLY' },
      { name: 'ACT Platinum (250 Mbps)', amount: 1049, frequency: 'MONTHLY' },
    ],
  },

  // 8. News & Learning
  {
    id: 'sub_times_prime',
    name: 'Times Prime',
    tagline: 'All-in-one super membership: Disney+ Hotstar, SonyLIV, TOI+, Uber & Swiggy',
    category: 'News & Learning',
    defaultAmount: 1199,
    frequency: 'YEARLY',
    icon: 'Crown',
    color: '#F59E0B',
    gradient: 'from-[#F59E0B] via-[#D97706] to-[#78350F]',
    popular: true,
    plans: [{ name: 'Annual Super Pass', amount: 1199, frequency: 'YEARLY' }],
  },
  {
    id: 'sub_duolingo',
    name: 'Duolingo Super',
    tagline: 'Learn 40+ languages ad-free with unlimited hearts & mistake reviews',
    category: 'News & Learning',
    defaultAmount: 159,
    frequency: 'MONTHLY',
    icon: 'BookOpen',
    color: '#58CC02',
    gradient: 'from-[#58CC02] via-[#46A302] to-[#2E6B01]',
    popular: true,
    plans: [
      { name: 'Super Individual (Monthly)', amount: 159, frequency: 'MONTHLY' },
      { name: 'Super Family (6 accounts - Monthly)', amount: 249, frequency: 'MONTHLY' },
      { name: 'Super Annual', amount: 1299, frequency: 'YEARLY' },
    ],
  },
  {
    id: 'sub_linkedin_prem',
    name: 'LinkedIn Premium',
    tagline: 'InMail credits, see who viewed profile, applicant insights & learning',
    category: 'News & Learning',
    defaultAmount: 1499,
    frequency: 'MONTHLY',
    icon: 'Award',
    color: '#0A66C2',
    gradient: 'from-[#0A66C2] via-[#004182] to-[#001D3D]',
    popular: true,
    plans: [
      { name: 'Career Monthly', amount: 1499, frequency: 'MONTHLY' },
      { name: 'Business Monthly', amount: 2499, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_coursera_plus',
    name: 'Coursera Plus',
    tagline: 'Unlimited access to 7,000+ courses, degrees and professional certificates',
    category: 'News & Learning',
    defaultAmount: 19999,
    frequency: 'YEARLY',
    icon: 'Award',
    color: '#0056D2',
    gradient: 'from-[#0056D2] via-[#003B94] to-[#001F52]',
    popular: false,
    plans: [
      { name: 'Annual Unlimited Pass', amount: 19999, frequency: 'YEARLY' },
      { name: 'Monthly Pass', amount: 4999, frequency: 'MONTHLY' },
    ],
  },
  {
    id: 'sub_the_ken',
    name: 'The Ken',
    tagline: 'Deep-dive original investigative business journalism from India & Asia',
    category: 'News & Learning',
    defaultAmount: 2750,
    frequency: 'YEARLY',
    icon: 'BookOpen',
    color: '#FF6F00',
    gradient: 'from-[#FF6F00] via-[#E65100] to-[#3E1600]',
    popular: false,
    plans: [{ name: 'Annual Premium', amount: 2750, frequency: 'YEARLY' }],
  },
  {
    id: 'sub_the_hindu',
    name: 'The Hindu e-Paper',
    tagline: 'Authoritative national journalism, digital daily edition & archives',
    category: 'News & Learning',
    defaultAmount: 1499,
    frequency: 'YEARLY',
    icon: 'BookOpen',
    color: '#0B2545',
    gradient: 'from-[#0B2545] via-[#134074] to-[#00171F]',
    popular: false,
    plans: [{ name: 'Annual ePaper Plan', amount: 1499, frequency: 'YEARLY' }],
  },
  {
    id: 'sub_medium',
    name: 'Medium Membership',
    tagline: 'Unlimited reading of insightful stories, tech blogs & human perspectives',
    category: 'News & Learning',
    defaultAmount: 415,
    frequency: 'MONTHLY',
    icon: 'BookOpen',
    color: '#000000',
    gradient: 'from-[#242424] via-[#121212] to-[#000000]',
    popular: false,
    plans: [
      { name: 'Monthly Membership', amount: 415, frequency: 'MONTHLY' },
      { name: 'Annual Membership', amount: 4150, frequency: 'YEARLY' },
    ],
  },
];

export const SubscriptionManagementModal: React.FC<SubscriptionManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    subscriptions,
    accounts,
    creditCards,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  } = useMoney();

  const [activeTab, setActiveTab] = useState<'CATALOGUE' | 'ACTIVE' | 'CUSTOM'>('CATALOGUE');

  // Catalogue search & category
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string>('ALL');

  // Quick Adopt Modal State
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<SubscriptionCatalogItem | null>(null);
  const [adoptPlanAmount, setAdoptPlanAmount] = useState<string>('');
  const [adoptFrequency, setAdoptFrequency] = useState<RecurrenceFrequency>('MONTHLY');
  const [adoptBillingDate, setAdoptBillingDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().substring(0, 10);
  });
  const [adoptAccountId, setAdoptAccountId] = useState<string>('');

  // Custom Form State
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customFrequency, setCustomFrequency] = useState<RecurrenceFrequency>('MONTHLY');
  const [customBillingDate, setCustomBillingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().substring(0, 10);
  });
  const [customIcon] = useState('Repeat');
  const [customColor, setCustomColor] = useState('#8B5CF6');
  const [customAccountId, setCustomAccountId] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  // Editing active subscription
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Accounts options
  const paymentSourcesOptions: SelectOption<string>[] = useMemo(() => {
    const opts: SelectOption<string>[] = [
      { value: '', label: 'Default / Unlinked Account', sublabel: 'Auto pay or manual' },
    ];
    accounts.forEach(a => {
      opts.push({
        value: a.id,
        label: a.name,
        sublabel: `${a.institution} • ${formatINR(a.calculatedBalance)}`,
        rightText: formatINR(a.calculatedBalance),
        icon: <Category3DIcon name={a.icon} color={a.color} size="xs" />,
        isBankAccount: true,
        bankTheme: a.institution || a.name || a.type,
      });
    });
    creditCards.forEach(c => {
      opts.push({
        value: c.id,
        label: `${c.name} (${c.lastFourDigits})`,
        sublabel: `Due: ${formatINR(c.currentOutstanding)} • Avail: ${formatINR(Math.max(0, c.creditLimit - c.currentOutstanding))}`,
        isCreditCard: true,
        cardTheme: c.cardTheme,
        network: c.network,
        rightText: `Due: ${formatINR(c.currentOutstanding)}`,
      });
    });
    return opts;
  }, [accounts, creditCards]);

  const frequencyOptions: SelectOption<RecurrenceFrequency>[] = [
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly (3 Months)' },
    { value: 'HALF_YEARLY', label: 'Half-Yearly (6 Months)' },
    { value: 'YEARLY', label: 'Yearly (Annual)' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'DAILY', label: 'Daily' },
  ];

  // Calculations for active subscriptions
  const activeSubscriptions = useMemo(() => (subscriptions || []).filter(s => !s.isDeleted), [subscriptions]);

  const { totalMonthlySpend, totalAnnualSpend, upcomingCount } = useMemo(() => {
    let monthly = 0;
    let upcoming = 0;
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    activeSubscriptions.forEach(s => {
      if (!s.isActive) return;
      let mCost = s.amount;
      if (s.frequency === 'YEARLY') mCost = s.amount / 12;
      if (s.frequency === 'QUARTERLY') mCost = s.amount / 3;
      if (s.frequency === 'HALF_YEARLY') mCost = s.amount / 6;
      if (s.frequency === 'WEEKLY') mCost = s.amount * 4.33;
      if (s.frequency === 'DAILY') mCost = s.amount * 30;
      monthly += mCost;

      if (s.nextBillingDate) {
        const bDate = new Date(s.nextBillingDate);
        if (bDate >= now && bDate <= next7Days) {
          upcoming += 1;
        }
      }
    });

    return {
      totalMonthlySpend: monthly,
      totalAnnualSpend: monthly * 12,
      upcomingCount: upcoming,
    };
  }, [activeSubscriptions]);

  const filteredCatalogue = useMemo(() => {
    return SUBSCRIPTIONS_CATALOGUE.filter(item => {
      const matchSearch =
        !catalogSearch.trim() ||
        item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.tagline.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchCat = catalogCategory === 'ALL' || item.category === catalogCategory;
      return matchSearch && matchCat;
    });
  }, [catalogSearch, catalogCategory]);

  const handleOpenAdoptModal = (item: SubscriptionCatalogItem) => {
    setSelectedCatalogItem(item);
    setAdoptPlanAmount(item.defaultAmount.toString());
    setAdoptFrequency(item.frequency);
    if (accounts.length > 0) setAdoptAccountId(accounts[0].id);
  };

  const handleConfirmAdopt = () => {
    if (!selectedCatalogItem) return;
    const amt = parseFloat(adoptPlanAmount) || selectedCatalogItem.defaultAmount;

    addSubscription({
      name: selectedCatalogItem.name,
      amount: amt,
      frequency: adoptFrequency,
      nextBillingDate: adoptBillingDate,
      icon: selectedCatalogItem.icon,
      color: selectedCatalogItem.color,
      accountId: adoptAccountId || undefined,
      isActive: true,
      notes: selectedCatalogItem.tagline,
    });

    setSelectedCatalogItem(null);
    setActiveTab('ACTIVE');
  };

  const handleCreateCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customName.trim()) {
      setCustomError('Please enter a subscription or service name');
      return;
    }
    const amt = parseFloat(customAmount);
    if (isNaN(amt) || amt <= 0) {
      setCustomError('Please enter a valid amount (e.g. 799)');
      return;
    }

    addSubscription({
      name: customName.trim(),
      amount: amt,
      frequency: customFrequency,
      nextBillingDate: customBillingDate,
      icon: customIcon || 'Repeat',
      color: customColor || '#8B5CF6',
      accountId: customAccountId || undefined,
      isActive: true,
      notes: customNotes.trim() || undefined,
    });

    setCustomName('');
    setCustomAmount('');
    setCustomNotes('');
    setCustomError(null);
    setActiveTab('ACTIVE');
  };

  const handleSaveEdit = () => {
    if (!editingSub) return;
    updateSubscription(editingSub.id, {
      name: editingSub.name,
      amount: editingSub.amount,
      frequency: editingSub.frequency,
      nextBillingDate: editingSub.nextBillingDate,
      color: editingSub.color,
      icon: editingSub.icon,
      accountId: editingSub.accountId,
      isActive: editingSub.isActive,
      notes: editingSub.notes,
    });
    setEditingSub(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[92vh] sm:h-auto sm:max-h-[88vh] my-auto overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25">
              <Repeat size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Subscriptions & Recurring Bills
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-extrabold tracking-wide uppercase border border-purple-500/20">
                  Catalogue & Tracker
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="grid grid-cols-3 gap-2 p-3 sm:px-5 bg-purple-500/5 dark:bg-purple-950/20 border-b border-purple-500/10 shrink-0 text-xs">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <TrendingUp size={16} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Monthly Expense</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                {formatINR(totalMonthlySpend)}/mo
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Clock size={16} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Annual Commitment</span>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm">
                {formatINR(totalAnnualSpend)}/yr
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Tracked Active</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                {activeSubscriptions.length} Services {upcomingCount > 0 && `• ${upcomingCount} Due soon`}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 px-4 sm:px-5 pt-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <button
            onClick={() => setActiveTab('CATALOGUE')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
              activeTab === 'CATALOGUE'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Preset Subscriptions Catalogue ({SUBSCRIPTIONS_CATALOGUE.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
              activeTab === 'ACTIVE'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>My Active Subscriptions ({activeSubscriptions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
              activeTab === 'CUSTOM'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus size={14} />
            <span>Create Custom Subscription</span>
          </button>
        </div>

        {/* Tab 1: SUBSCRIPTIONS CATALOGUE */}
        {activeTab === 'CATALOGUE' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Netflix, Spotify, ChatGPT, Gym, Fiber..."
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto w-full pb-1 scrollbar-none">
                {[
                  'ALL',
                  'OTT & Streaming',
                  'Music & Audio',
                  'Productivity & AI',
                  'Food & Delivery',
                  'Gaming',
                  'Fitness & Wellness',
                  'Cloud & Utilities',
                  'News & Learning',
                ].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCatalogCategory(cat)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                      catalogCategory === cat
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Preset Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredCatalogue.map((item, idx) => {
                const alreadySubscribed = activeSubscriptions.some(
                  s => s.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(s.name.toLowerCase())
                );

                return (
                  <div
                    key={`sub_cat_${item.id}_${idx}`}
                    className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-purple-400 dark:hover:border-purple-600 transition-all flex flex-col justify-between space-y-3 group hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <SubscriptionBrandIcon
                            name={item.name}
                            color={item.color}
                            fallbackIcon={item.icon}
                            size="md"
                            interactive={true}
                          />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                              {item.category}
                            </span>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                              {item.name}
                            </h4>
                          </div>
                        </div>

                        {alreadySubscribed && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            Active
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {item.tagline}
                      </p>

                      {/* Default Cost pill */}
                      <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-slate-400 text-[11px]">Standard Pricing:</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {formatINR(item.defaultAmount)} / {item.frequency.toLowerCase()}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleOpenAdoptModal(item)}
                      className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-1.5 active:scale-98 transition-all"
                    >
                      <Plus size={13} />
                      <span>{alreadySubscribed ? 'Add Another Plan' : '1-Click Subscribe'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: ACTIVE SUBSCRIPTIONS */}
        {activeTab === 'ACTIVE' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Tracked Subscriptions ({activeSubscriptions.length})
              </h4>
              <button
                onClick={() => setActiveTab('CUSTOM')}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm flex items-center space-x-1"
              >
                <Plus size={13} />
                <span>Add Custom</span>
              </button>
            </div>

            {activeSubscriptions.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 dark:bg-slate-850 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <Repeat size={36} className="text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No subscriptions logged yet
                </p>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Browse our catalogue to add your Netflix, Prime, Spotify, Gym or Broadband with 1-click!
                </p>
                <button
                  onClick={() => setActiveTab('CATALOGUE')}
                  className="px-4 py-2 rounded-2xl bg-purple-600 text-white font-bold text-xs shadow-md"
                >
                  Browse Catalogue
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeSubscriptions.map((sub, idx) => (
                  <div
                    key={`sub_${sub.id}_${idx}`}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center space-x-3">
                      <SubscriptionBrandIcon
                        name={sub.name}
                        color={sub.color || '#8B5CF6'}
                        fallbackIcon={sub.icon || 'Repeat'}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                            {sub.name}
                          </h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 uppercase">
                            {sub.frequency}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Renews on <strong className="text-slate-700 dark:text-slate-300">{sub.nextBillingDate}</strong>
                          {sub.notes && ` • ${sub.notes}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3">
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                          {formatINR(sub.amount)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {sub.frequency === 'YEARLY'
                            ? `~${formatINR(sub.amount / 12)}/mo`
                            : `Annual: ${formatINR(sub.amount * 12)}`}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingSub(sub)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Edit Subscription"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteSubscription(sub.id)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-500 transition-colors"
                          title="Delete Subscription"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: CREATE CUSTOM SUBSCRIPTION */}
        {activeTab === 'CUSTOM' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-w-xl mx-auto w-full">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Create Custom Subscription Record
              </h4>
              <p className="text-xs text-slate-500">
                Track custom recurring bills like gym, coaching, maid salary, newspaper, milk, etc.
              </p>
            </div>

            <div className="space-y-3">
              {customError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300 flex items-center space-x-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{customError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Subscription / Service Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gold Gym Membership, Milk Supply, Coursera"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 799"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-extrabold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Billing Cycle
                  </label>
                  <CustomSelect
                    value={customFrequency}
                    onChange={val => setCustomFrequency(val as RecurrenceFrequency)}
                    options={frequencyOptions}
                    size="sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <CustomDatePicker
                    label="Next Renewal Date"
                    value={customBillingDate}
                    onChange={d => setCustomBillingDate(d)}
                    size="sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Pay From Account
                  </label>
                  <CustomSelect
                    value={customAccountId}
                    onChange={val => setCustomAccountId(val)}
                    options={paymentSourcesOptions}
                    size="sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Accent Color
                </label>
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  {['#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#1E293B'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCustomColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                        customColor === c ? 'scale-110 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {customColor === c && <Check size={12} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes / Plan Perks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4 screens UHD, expires in December"
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              <button
                onClick={handleCreateCustom}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-98"
              >
                Save Custom Subscription
              </button>
            </div>
          </div>
        )}

        {/* 1-Click Adopt / Subscribe Modal Dialog */}
        {selectedCatalogItem && (
          <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full space-y-4 border border-purple-200 dark:border-purple-900/40 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <SubscriptionBrandIcon
                    name={selectedCatalogItem.name}
                    color={selectedCatalogItem.color}
                    fallbackIcon={selectedCatalogItem.icon}
                    size="sm"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Subscribe to {selectedCatalogItem.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">{selectedCatalogItem.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCatalogItem(null)}
                  className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Plan Options Selector if item has plans */}
              {selectedCatalogItem.plans && selectedCatalogItem.plans.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Select Plan Tier
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedCatalogItem.plans.map(p => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setAdoptPlanAmount(p.amount.toString());
                          setAdoptFrequency(p.frequency);
                        }}
                        className={`w-full p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          adoptPlanAmount === p.amount.toString() && adoptFrequency === p.frequency
                            ? 'bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300 font-bold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{p.name}</span>
                        <span>{formatINR(p.amount)} / {p.frequency.toLowerCase()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={adoptPlanAmount}
                    onChange={e => setAdoptPlanAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>

                <div>
                  <CustomDatePicker
                    label="Next Billing Date"
                    value={adoptBillingDate}
                    onChange={d => setAdoptBillingDate(d)}
                    size="sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Pay From Account / Card
                </label>
                <CustomSelect
                  value={adoptAccountId}
                  onChange={val => setAdoptAccountId(val)}
                  options={paymentSourcesOptions}
                  size="sm"
                />
              </div>

              <button
                onClick={handleConfirmAdopt}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-98"
              >
                Confirm & Track Subscription
              </button>
            </div>
          </div>
        )}

        {/* Edit Active Subscription Dialog */}
        {editingSub && (
          <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full space-y-4 border border-purple-200 dark:border-purple-900/40 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Edit Subscription: {editingSub.name}
                </h3>
                <button
                  onClick={() => setEditingSub(null)}
                  className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Service Name
                  </label>
                  <input
                    type="text"
                    value={editingSub.name}
                    onChange={e => setEditingSub({ ...editingSub, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={editingSub.amount}
                      onChange={e => setEditingSub({ ...editingSub, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Billing Cycle
                    </label>
                    <CustomSelect
                      value={editingSub.frequency}
                      onChange={val => setEditingSub({ ...editingSub, frequency: val as RecurrenceFrequency })}
                      options={frequencyOptions}
                      size="sm"
                    />
                  </div>
                </div>

                <div>
                  <CustomDatePicker
                    label="Next Billing Date"
                    value={editingSub.nextBillingDate}
                    onChange={d => setEditingSub({ ...editingSub, nextBillingDate: d })}
                    size="sm"
                  />
                </div>

                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
