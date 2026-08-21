import React from 'react';
import { Emblem3D } from '../common/Emblem3DSystem';

export type SubscriptionIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SubscriptionBrandIconProps {
  name: string;
  size?: SubscriptionIconSize;
  color?: string;
  fallbackIcon?: string;
  className?: string;
  interactive?: boolean;
}

const SIZE_MAP: Record<SubscriptionIconSize, { container: string; iconSize: number; badgeSize: string }> = {
  xs: { container: 'w-7 h-7 rounded-lg', iconSize: 16, badgeSize: 'text-[9px]' },
  sm: { container: 'w-9 h-9 rounded-xl', iconSize: 20, badgeSize: 'text-[10px]' },
  md: { container: 'w-11 h-11 rounded-2xl', iconSize: 24, badgeSize: 'text-xs' },
  lg: { container: 'w-13 h-13 rounded-2xl', iconSize: 30, badgeSize: 'text-sm' },
  xl: { container: 'w-16 h-16 rounded-3xl', iconSize: 38, badgeSize: 'text-base' },
};

export const SubscriptionBrandIcon: React.FC<SubscriptionBrandIconProps> = ({
  name = '',
  size = 'md',
  color,
  fallbackIcon = 'Repeat',
  className = '',
  interactive = true,
}) => {
  const norm = name.toLowerCase().trim();
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  // Authentic Brand Vector Logos
  // 1. Netflix
  if (norm.includes('netflix')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#181818] to-[#0a0a0a] border border-red-950/60 shadow-md shadow-red-950/40 flex items-center justify-center overflow-hidden shrink-0 group ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(229, 9, 20, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />
        <svg
          viewBox="0 0 111 200"
          className="w-3/5 h-3/5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Netflix Red Ribbon N */}
          <path d="M0 0H33.7V200H0V0Z" fill="#B81D24" />
          <path d="M77.3 0H111V200H77.3V0Z" fill="#B81D24" />
          <path
            d="M0 0H33.7L111 200H77.3L0 0Z"
            fill="url(#netflix_grad)"
            filter="drop-shadow(-2px 0px 4px rgba(0,0,0,0.5))"
          />
          <defs>
            <linearGradient id="netflix_grad" x1="0" y1="0" x2="111" y2="200" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E50914" />
              <stop offset="0.5" stopColor="#E50914" />
              <stop offset="1" stopColor="#B81D24" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // 2. Amazon Prime / Prime Video
  if (norm.includes('prime') || norm.includes('amazon')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#00A8E1] via-[#007EB9] to-[#00385F] border border-cyan-400/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 group ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(0, 168, 225, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.35)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Prime Video stylized typography & Amazon Smile */}
          <text
            x="50"
            y="44"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="28"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-1"
          >
            prime
          </text>
          {/* Curved Amazon Smile Arrow */}
          <path
            d="M 22 62 Q 50 82 78 63"
            stroke="#FF9900"
            strokeWidth="5.5"
            strokeLinecap="round"
            fill="none"
          />
          <polygon points="76,57 84,63 76,69" fill="#FF9900" />
        </svg>
      </div>
    );
  }

  // 3. Disney+ / Hotstar
  if (norm.includes('hotstar') || norm.includes('disney')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#0C3868] via-[#051E3C] to-[#020B17] border border-blue-400/30 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(12, 56, 104, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Disney arch */}
          <path
            d="M 18 56 C 25 22 75 22 82 56"
            stroke="url(#disney_glow)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Center 'D+' */}
          <text
            x="44"
            y="64"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="32"
            fontWeight="900"
            fontFamily="system-ui, serif"
          >
            D
          </text>
          <text
            x="70"
            y="54"
            textAnchor="middle"
            fill="#38BDF8"
            fontSize="26"
            fontWeight="900"
          >
            +
          </text>
          <defs>
            <linearGradient id="disney_glow" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#38BDF8" />
              <stop offset="1" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // 4. YouTube / YouTube Premium / YouTube Music
  if (norm.includes('youtube')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#FF0000] via-[#D80000] to-[#990000] border border-red-400/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(255, 0, 0, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Centered crisp play triangle */}
          <path
            d="M 38 30 L 72 50 L 38 70 Z"
            fill="#FFFFFF"
            filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"
          />
        </svg>
      </div>
    );
  }

  // 5. Spotify
  if (norm.includes('spotify')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#1ED760] via-[#1DB954] to-[#12803B] border border-emerald-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(29, 185, 84, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Spotify 3 curved sound waves */}
          <path
            d="M 22 36 C 45 28 72 34 82 40"
            stroke="#121212"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 27 50 C 46 44 68 49 76 54"
            stroke="#121212"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 32 64 C 47 60 62 63 69 67"
            stroke="#121212"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  // 6. Apple Music / Apple TV+ / Apple iCloud / Apple Fitness / Apple One
  if (norm.includes('apple') || norm.includes('icloud')) {
    const isAppleMusic = norm.includes('music');
    const isAppleTv = norm.includes('tv');
    const isIcloud = norm.includes('icloud') || norm.includes('cloud');
    const isFitness = norm.includes('fit');

    const bgGradient = isAppleMusic
      ? 'from-[#FA243C] via-[#D81B60] to-[#880E4F]'
      : isAppleTv
      ? 'from-[#2C2C2E] via-[#1C1C1E] to-[#0A0A0A]'
      : isIcloud
      ? 'from-[#007AFF] via-[#34AADC] to-[#5856D6]'
      : isFitness
      ? 'from-[#30D158] via-[#248A3D] to-[#0A3B14]'
      : 'from-[#1C1C1E] via-[#2C2C2E] to-[#3A3A3C]';

    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b ${bgGradient} border border-white/20 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.35)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 170 170" className="w-3/5 h-3/5 fill-white" xmlns="http://www.w3.org/2000/svg">
          {/* Apple Logo Silhouette */}
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.78-7.99-12.28-14.73-6.53-9.87-11.75-21.2-15.66-33.99-3.91-12.79-5.87-24.89-5.87-36.32 0-14.15 3.63-26.06 10.9-35.73 7.27-9.67 16.48-14.62 27.63-14.85 4.8.11 10.15 1.34 16.05 3.68 5.9 2.34 9.68 3.56 11.35 3.68 1.9-.22 5.97-1.56 12.2-4.01 6.24-2.46 11.79-3.52 16.65-3.19 12.87 1.01 23.01 5.94 30.43 14.8-11.2 6.81-16.69 16.27-16.46 28.38.22 9.5 3.82 17.5 10.8 24 6.98 6.5 15.22 10.17 24.72 11.01-2.24 6.7-5.04 13.6-8.41 20.7zM119.22 33.09c0-7.38 2.65-14.35 7.95-20.9 5.3-6.55 11.97-10.74 20.02-12.57.11 1.23.17 2.35.17 3.35 0 7.37-2.76 14.44-8.29 21.22-5.53 6.78-12.18 10.89-19.95 12.33-.45-1.12-.68-2.26-.68-3.43z" />
        </svg>
      </div>
    );
  }

  // 7. ChatGPT / OpenAI
  if (norm.includes('chatgpt') || norm.includes('openai')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#10A37F] via-[#0E8A6C] to-[#085C47] border border-emerald-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(16, 163, 127, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* OpenAI Rosette Spiral */}
          <g stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 50 18 L 68 28 L 68 49 L 50 59 L 32 49 L 32 28 Z" />
            <path d="M 50 18 L 50 39" />
            <path d="M 68 49 L 50 39" />
            <path d="M 32 49 L 50 39" />
            <path d="M 68 28 L 84 55 L 67 84" />
            <path d="M 32 28 L 16 55 L 33 84" />
            <path d="M 50 59 L 50 82" />
          </g>
        </svg>
      </div>
    );
  }

  // 8. Claude / Anthropic
  if (norm.includes('claude') || norm.includes('anthropic')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#D97706] via-[#CC6B49] to-[#8C3A1A] border border-amber-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(204, 107, 73, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Anthropic / Claude Asterisk */}
          <g fill="#FFFFFF">
            <rect x="44" y="14" width="12" height="72" rx="6" />
            <rect x="14" y="44" width="72" height="12" rx="6" />
            <rect x="44" y="14" width="12" height="72" rx="6" transform="rotate(45 50 50)" />
            <rect x="44" y="14" width="12" height="72" rx="6" transform="rotate(-45 50 50)" />
          </g>
        </svg>
      </div>
    );
  }

  // 9. GitHub / GitHub Copilot
  if (norm.includes('github') || norm.includes('copilot')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#24292F] via-[#1B1F23] to-[#0D1117] border border-purple-400/30 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(109, 40, 217, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.25)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/15 to-white/20 pointer-events-none" />
        <svg viewBox="0 0 98 96" className="w-3/5 h-3/5 fill-white" xmlns="http://www.w3.org/2000/svg">
          {/* GitHub Octocat */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.215-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
          />
        </svg>
      </div>
    );
  }

  // 10. Google One / Google Drive / Google
  if (norm.includes('google')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(66, 133, 244, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Google 4-Color Loop */}
          <path
            d="M 50 18 A 32 32 0 0 1 82 50"
            stroke="#4285F4"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M 82 50 A 32 32 0 0 1 50 82"
            stroke="#34A853"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M 50 82 A 32 32 0 0 1 18 50"
            stroke="#FBBC05"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M 18 50 A 32 32 0 0 1 50 18"
            stroke="#EA4335"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <text
            x="50"
            y="57"
            textAnchor="middle"
            fill="#4285F4"
            fontSize="24"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
          >
            1
          </text>
        </svg>
      </div>
    );
  }

  // 11. Microsoft 365 / Office
  if (norm.includes('microsoft') || norm.includes('office') || norm.includes('365')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#D83B01] via-[#EA4A1B] to-[#992200] border border-orange-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(216, 59, 1, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.35)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Microsoft 4-Color Grid */}
          <rect x="22" y="22" width="24" height="24" rx="4" fill="#F25022" />
          <rect x="54" y="22" width="24" height="24" rx="4" fill="#7FBA00" />
          <rect x="22" y="54" width="24" height="24" rx="4" fill="#00A4EF" />
          <rect x="54" y="54" width="24" height="24" rx="4" fill="#FFB900" />
        </svg>
      </div>
    );
  }

  // 12. Notion
  if (norm.includes('notion')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-white dark:bg-[#1E1E1E] border border-slate-300 dark:border-slate-700 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(0, 0, 0, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.6)',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Notion N */}
          <rect x="18" y="18" width="64" height="64" rx="12" fill="#000000" className="dark:fill-white" />
          <text
            x="50"
            y="65"
            textAnchor="middle"
            fill="#FFFFFF"
            className="dark:fill-black"
            fontSize="44"
            fontWeight="900"
            fontFamily="Georgia, serif"
          >
            N
          </text>
        </svg>
      </div>
    );
  }

  // 13. Swiggy / Swiggy One
  if (norm.includes('swiggy')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#FC8019] via-[#E26A06] to-[#A34400] border border-orange-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(252, 128, 25, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Swiggy Pin & 'S' Shape */}
          <path
            d="M 50 15 C 33 15 20 28 20 45 C 20 62 45 85 50 85 C 55 85 80 62 80 45 C 80 28 67 15 50 15 Z"
            fill="#FFFFFF"
          />
          <path
            d="M 58 35 C 58 35 44 32 44 42 C 44 52 56 50 56 60 C 56 68 42 66 42 66"
            stroke="#FC8019"
            strokeWidth="5.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  // 14. Zomato / Zomato Gold
  if (norm.includes('zomato')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#CB202D] via-[#A81520] to-[#600A10] border border-red-400/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(203, 32, 45, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Zomato Script Logo */}
          <text
            x="50"
            y="54"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="24"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="system-ui, sans-serif"
          >
            zomato
          </text>
          {/* Gold Crown / Star */}
          <path
            d="M 32 68 L 40 62 L 50 72 L 60 62 L 68 68 Z"
            fill="#FBBF24"
          />
        </svg>
      </div>
    );
  }

  // 15. Sony LIV
  if (norm.includes('sonyliv') || norm.includes('sony')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#00539B] via-[#003766] to-[#001D38] border border-blue-400/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(0, 83, 155, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.35)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* LIV Bars */}
          <rect x="20" y="32" width="10" height="36" rx="4" fill="#E50914" />
          <rect x="35" y="24" width="10" height="44" rx="4" fill="#F59E0B" />
          <rect x="50" y="36" width="10" height="32" rx="4" fill="#10B981" />
          <rect x="65" y="28" width="10" height="40" rx="4" fill="#3B82F6" />
        </svg>
      </div>
    );
  }

  // 16. ZEE5
  if (norm.includes('zee5') || norm.includes('zee')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#8230C6] via-[#5B1F8C] to-[#2B0B47] border border-purple-400/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(130, 48, 198, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* ZEE5 Emblem */}
          <circle cx="50" cy="50" r="32" stroke="#FFFFFF" strokeWidth="4" fill="none" />
          <text
            x="50"
            y="62"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="34"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
          >
            5
          </text>
        </svg>
      </div>
    );
  }

  // 17. Jio / JioCinema / JioFiber
  if (norm.includes('jio')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#0A2885] via-[#0B3FC2] to-[#041A5C] border border-blue-400/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(10, 40, 133, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Jio lowercase bold */}
          <circle cx="50" cy="50" r="34" fill="#E50914" />
          <text
            x="50"
            y="59"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="26"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
          >
            Jio
          </text>
        </svg>
      </div>
    );
  }

  // 18. Airtel / Airtel Xstream
  if (norm.includes('airtel')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#E40000] via-[#C00000] to-[#750000] border border-red-400/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(228, 0, 0, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Airtel Swoosh 'a' */}
          <path
            d="M 50 20 C 30 20 20 35 20 55 C 20 75 35 85 55 85 C 75 85 85 70 85 55"
            stroke="#FFFFFF"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="55" cy="52" r="8" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 19. PlayStation Plus (PS Plus)
  if (norm.includes('playstation') || norm.includes('ps plus') || norm.includes('ps5') || norm.includes('ps4')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#003791] via-[#00246B] to-[#001038] border border-blue-400/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(0, 55, 145, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* PS Plus Gold Plus & Shapes */}
          <text
            x="36"
            y="64"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="32"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
          >
            PS
          </text>
          <path
            d="M 68 34 L 76 34 L 76 44 L 86 44 L 86 52 L 76 52 L 76 62 L 68 62 L 68 52 L 58 52 L 58 44 L 68 44 Z"
            fill="#F59E0B"
          />
        </svg>
      </div>
    );
  }

  // 20. Xbox / Game Pass
  if (norm.includes('xbox') || norm.includes('game pass') || norm.includes('gamepass')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#107C10] via-[#0E680E] to-[#053305] border border-emerald-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(16, 124, 16, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Xbox Sphere 'X' */}
          <circle cx="50" cy="50" r="36" fill="#FFFFFF" />
          <path
            d="M 30 30 Q 50 48 70 30 Q 58 50 72 70 Q 50 56 28 70 Q 42 50 30 30 Z"
            fill="#107C10"
          />
        </svg>
      </div>
    );
  }

  // 21. Cult.fit / Cultpass
  if (norm.includes('cult') || norm.includes('cult.fit') || norm.includes('cultpass')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#FF3278] via-[#D81159] to-[#800330] border border-pink-400/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(255, 50, 120, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Cult Winged Crest */}
          <path
            d="M 20 40 L 50 75 L 80 40 L 65 40 L 50 58 L 35 40 Z"
            fill="#FFFFFF"
          />
          <path
            d="M 30 25 L 50 50 L 70 25 L 58 25 L 50 35 L 42 25 Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    );
  }

  // 22. Blinkit
  if (norm.includes('blinkit')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#F7D200] via-[#E5BF00] to-[#A88C00] border border-amber-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(247, 210, 0, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/30 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text
            x="50"
            y="62"
            textAnchor="middle"
            fill="#0F8A3B"
            fontSize="46"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
          >
            b
          </text>
        </svg>
      </div>
    );
  }

  // 23. Zepto
  if (norm.includes('zepto')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#9A16E6] via-[#750DB3] to-[#470370] border border-purple-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(154, 22, 230, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text
            x="50"
            y="64"
            textAnchor="middle"
            fill="#FF2E93"
            fontSize="46"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="system-ui, sans-serif"
          >
            Z
          </text>
        </svg>
      </div>
    );
  }

  // 24. Canva
  if (norm.includes('canva')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#00C4CC] via-[#7D2AE8] to-[#450C94] border border-cyan-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(0, 196, 204, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text
            x="50"
            y="65"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="48"
            fontWeight="900"
            fontFamily="Brush Script MT, cursive, serif"
          >
            C
          </text>
        </svg>
      </div>
    );
  }

  // 25. Figma
  if (norm.includes('figma')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-[#1E1E1E] border border-slate-700 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="25" y="15" width="25" height="25" rx="12.5" fill="#F24E1E" />
          <rect x="50" y="15" width="25" height="25" rx="12.5" fill="#FF7262" />
          <rect x="25" y="40" width="25" height="25" rx="12.5" fill="#A259FF" />
          <circle cx="62.5" cy="52.5" r="12.5" fill="#1ABCFE" />
          <rect x="25" y="65" width="25" height="25" rx="12.5" fill="#0ACF83" />
        </svg>
      </div>
    );
  }

  // 26. Duolingo
  if (norm.includes('duolingo')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#58CC02] via-[#46A302] to-[#2E6B01] border border-lime-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(88, 204, 2, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Duo Eyes & Beak */}
          <circle cx="38" cy="45" r="12" fill="#FFFFFF" />
          <circle cx="38" cy="45" r="6" fill="#121212" />
          <circle cx="62" cy="45" r="12" fill="#FFFFFF" />
          <circle cx="62" cy="45" r="6" fill="#121212" />
          <polygon points="44,54 56,54 50,66" fill="#FF9600" />
        </svg>
      </div>
    );
  }

  // 27. Audible
  if (norm.includes('audible')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#F8991C] via-[#D67C00] to-[#8C4E00] border border-amber-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(248, 153, 28, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 30 70 A 30 30 0 0 1 70 70" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
          <path d="M 38 70 A 20 20 0 0 1 62 70" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
          <path d="M 46 70 A 10 10 0 0 1 54 70" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // 28. Discord Nitro
  if (norm.includes('discord') || norm.includes('nitro')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#5865F2] via-[#4752C4] to-[#2C3280] border border-indigo-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(88, 101, 242, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M78 28c-5.5-2.5-11.5-4.3-17.7-5.3-0.8 1.4-1.7 3.2-2.3 4.7-6.6-1-13.2-1-19.7 0-0.6-1.5-1.5-3.3-2.3-4.7-6.2 1-12.2 2.8-17.7 5.3-11.2 16.7-14.2 33-12.7 49 7.4 5.5 14.6 8.8 21.6 11 1.8-2.4 3.3-5 4.6-7.8-2.5-1-5-2.2-7.2-3.7 0.6-0.4 1.2-0.9 1.8-1.3 14 6.5 29.2 6.5 43 0 0.6 0.4 1.2 0.9 1.8 1.3-2.3 1.5-4.7 2.7-7.2 3.7 1.3 2.8 2.9 5.4 4.6 7.8 7-2.2 14.2-5.5 21.6-11 1.8-18.6-3-34.8-12.4-49zM36.4 63.8c-4.2 0-7.7-3.9-7.7-8.6s3.4-8.6 7.7-8.6c4.3 0 7.8 3.9 7.7 8.6 0 4.7-3.4 8.6-7.7 8.6zm27.2 0c-4.2 0-7.7-3.9-7.7-8.6s3.4-8.6 7.7-8.6c4.3 0 7.8 3.9 7.7 8.6 0 4.7-3.4 8.6-7.7 8.6z" />
        </svg>
      </div>
    );
  }

  // 29. Tata Play / Tata Sky
  if (norm.includes('tata')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#E91E63] via-[#9C27B0] to-[#3F51B5] border border-pink-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(233, 30, 99, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="32" stroke="#FFFFFF" strokeWidth="4" />
          <polygon points="44,36 64,50 44,64" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 30. Times Prime
  if (norm.includes('times prime') || norm.includes('times')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#F59E0B] via-[#D97706] to-[#78350F] border border-amber-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(245, 158, 11, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Royal Crown */}
          <path d="M 25 65 L 75 65 L 80 40 L 62 52 L 50 30 L 38 52 L 20 40 Z" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 31. Midjourney
  if (norm.includes('midjourney')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#0F172A] via-[#020617] to-[#000000] border border-indigo-400/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(99, 102, 241, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.25)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Midjourney Sailboat */}
          <path d="M 50 20 L 50 70 L 25 55 Z" fill="#FFFFFF" />
          <path d="M 54 28 L 54 70 L 75 60 Z" fill="#FFFFFF" opacity="0.8" />
          <path d="M 20 74 Q 50 82 80 74 L 75 80 Q 50 86 25 80 Z" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 32. Perplexity Pro
  if (norm.includes('perplexity')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#20B2AA] via-[#008B8B] to-[#004D40] border border-teal-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(32, 178, 170, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Perplexity Asterisk / Lattice */}
          <g stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round">
            <line x1="50" y1="20" x2="50" y2="80" />
            <line x1="20" y1="50" x2="80" y2="50" />
            <line x1="29" y1="29" x2="71" y2="71" />
            <line x1="29" y1="71" x2="71" y2="29" />
          </g>
        </svg>
      </div>
    );
  }

  // 33. Adobe / Adobe Creative Cloud
  if (norm.includes('adobe')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#FA0F00] via-[#D60000] to-[#800000] border border-red-400/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(250, 15, 0, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Adobe 'A' */}
          <polygon points="18,18 36,82 18,82" fill="#FFFFFF" />
          <polygon points="82,18 64,82 82,82" fill="#FFFFFF" />
          <polygon points="50,42 66,82 54,82 46,62 38,82 26,82" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 34. Strava
  if (norm.includes('strava')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#FC4C02] via-[#D63D00] to-[#8F2800] border border-orange-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(252, 76, 2, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Strava Arrows */}
          <path d="M 40 20 L 60 55 L 48 55 L 40 40 L 32 55 L 20 55 Z" fill="#FFFFFF" />
          <path d="M 60 55 L 72 75 L 64 75 L 60 68 L 56 75 L 48 75 Z" fill="#FFFFFF" opacity="0.8" />
        </svg>
      </div>
    );
  }

  // 35. 1Password
  if (norm.includes('1password') || norm.includes('password')) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-b from-[#0A85EA] via-[#0560AA] to-[#023561] border border-blue-300/40 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${
          interactive ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
        } ${className}`}
        style={{
          boxShadow: '0 4px 14px -2px rgba(10, 133, 234, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/25 pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 1Password Ring & Keyhole */}
          <circle cx="50" cy="50" r="32" stroke="#FFFFFF" strokeWidth="6" />
          <rect x="46" y="34" width="8" height="32" rx="4" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // Fallback: Dynamic 3D Emblem with specified color or fallback icon
  const derivedColor = color || '#8B5CF6';
  return (
    <Emblem3D
      icon={fallbackIcon || 'Repeat'}
      from={derivedColor}
      to={derivedColor}
      size={size}
      interactive={interactive}
      className={className}
    />
  );
};
