import React from 'react';
import * as LucideIcons from 'lucide-react';

export type Icon3DSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;

interface Category3DIconProps {
  name?: string;
  categoryName?: string;
  color?: string;
  size?: Icon3DSize;
  className?: string;
  shape?: 'squircle' | 'circle' | 'rounded';
  glow?: boolean;
  interactive?: boolean;
}

// 3D Gradient Recipes for different category identities
interface GradientRecipe {
  from: string;
  via?: string;
  to: string;
  shadow: string;
  accent: string;
  fallbackIcon: string;
}

const CATEGORY_3D_PALETTES: Record<string, GradientRecipe> = {
  // Food & Dining
  food_dining: {
    from: '#ff4b4b',
    via: '#ff6b35',
    to: '#e83151',
    shadow: 'rgba(255, 75, 75, 0.45)',
    accent: '#ffeaa7',
    fallbackIcon: 'Utensils',
  },
  // Groceries & Daily Needs
  groceries: {
    from: '#10b981',
    via: '#059669',
    to: '#047857',
    shadow: 'rgba(16, 185, 129, 0.45)',
    accent: '#a7f3d0',
    fallbackIcon: 'ShoppingCart',
  },
  // Shopping & Apparel
  shopping: {
    from: '#f43f5e',
    via: '#ec4899',
    to: '#d946ef',
    shadow: 'rgba(244, 63, 94, 0.45)',
    accent: '#fbcfe8',
    fallbackIcon: 'ShoppingBag',
  },
  // Commute & Travel
  transport: {
    from: '#f59e0b',
    via: '#f97316',
    to: '#ea580c',
    shadow: 'rgba(245, 158, 11, 0.45)',
    accent: '#fef3c7',
    fallbackIcon: 'Car',
  },
  // Fuel & Vehicle
  fuel_petrol: {
    from: '#fb923c',
    via: '#ea580c',
    to: '#c2410c',
    shadow: 'rgba(234, 88, 12, 0.45)',
    accent: '#ffedd5',
    fallbackIcon: 'Fuel',
  },
  // Bills & Utilities
  bills_utilities: {
    from: '#38bdf8',
    via: '#0284c7',
    to: '#1e40af',
    shadow: 'rgba(2, 132, 199, 0.45)',
    accent: '#bae6fd',
    fallbackIcon: 'Receipt',
  },
  // Home & Rent
  home_rent: {
    from: '#a855f7',
    via: '#8b5cf6',
    to: '#6d28d9',
    shadow: 'rgba(139, 92, 246, 0.45)',
    accent: '#e9d5ff',
    fallbackIcon: 'Home',
  },
  // Healthcare & Pharmacy
  health_medical: {
    from: '#2dd4bf',
    via: '#14b8a6',
    to: '#0f766e',
    shadow: 'rgba(20, 184, 166, 0.45)',
    accent: '#ccfbf1',
    fallbackIcon: 'HeartPulse',
  },
  // Fitness & Sports
  fitness_sports: {
    from: '#84cc16',
    via: '#22c55e',
    to: '#15803d',
    shadow: 'rgba(34, 197, 94, 0.45)',
    accent: '#dcfce7',
    fallbackIcon: 'Dumbbell',
  },
  // Gaming & Entertainment
  entertainment_ott: {
    from: '#818cf8',
    via: '#6366f1',
    to: '#4338ca',
    shadow: 'rgba(99, 102, 241, 0.45)',
    accent: '#e0e7ff',
    fallbackIcon: 'Gamepad2',
  },
  // Subscriptions & OTT
  subscriptions: {
    from: '#22d3ee',
    via: '#06b6d4',
    to: '#0369a1',
    shadow: 'rgba(6, 182, 212, 0.45)',
    accent: '#cffafe',
    fallbackIcon: 'Tv',
  },
  // Travel & Vacations
  travel_holidays: {
    from: '#38bdf8',
    via: '#0ea5e9',
    to: '#2563eb',
    shadow: 'rgba(14, 165, 233, 0.45)',
    accent: '#e0f2fe',
    fallbackIcon: 'Plane',
  },
  // Education & Courses
  education_learning: {
    from: '#60a5fa',
    via: '#3b82f6',
    to: '#1d4ed8',
    shadow: 'rgba(59, 130, 246, 0.45)',
    accent: '#dbeafe',
    fallbackIcon: 'GraduationCap',
  },
  // Personal Care & Grooming
  personal_care: {
    from: '#fb7185',
    via: '#f43f5e',
    to: '#be123c',
    shadow: 'rgba(244, 63, 94, 0.45)',
    accent: '#ffe4e6',
    fallbackIcon: 'Sparkles',
  },
  // Gifts & Celebrations
  gifts_donations: {
    from: '#f472b6',
    via: '#db2777',
    to: '#9d174d',
    shadow: 'rgba(219, 39, 119, 0.45)',
    accent: '#fce7f3',
    fallbackIcon: 'Gift',
  },
  // Family & Kids
  family_kids: {
    from: '#fbbf24',
    via: '#f59e0b',
    to: '#d97706',
    shadow: 'rgba(245, 158, 11, 0.45)',
    accent: '#fef3c7',
    fallbackIcon: 'Users',
  },
  // Pets & Animals
  pets_animals: {
    from: '#f97316',
    via: '#d97706',
    to: '#b45309',
    shadow: 'rgba(217, 119, 6, 0.45)',
    accent: '#fef3c7',
    fallbackIcon: 'Dog',
  },
  // Investments
  investments_stocks: {
    from: '#34d399',
    via: '#059669',
    to: '#065f46',
    shadow: 'rgba(5, 150, 105, 0.45)',
    accent: '#d1fae5',
    fallbackIcon: 'TrendingUp',
  },
  // Salary
  salary_income: {
    from: '#10b981',
    via: '#047857',
    to: '#064e3b',
    shadow: 'rgba(16, 185, 129, 0.5)',
    accent: '#6ee7b7',
    fallbackIcon: 'Briefcase',
  },
  // Freelance / Business
  business_freelance: {
    from: '#6366f1',
    via: '#4f46e5',
    to: '#3730a3',
    shadow: 'rgba(79, 70, 229, 0.45)',
    accent: '#c7d2fe',
    fallbackIcon: 'Laptop',
  },
  // Gold / Jewellery
  gold_jewellery: {
    from: '#fde047',
    via: '#eab308',
    to: '#ca8a04',
    shadow: 'rgba(234, 179, 8, 0.5)',
    accent: '#fef9c3',
    fallbackIcon: 'Coins',
  },
  // Khata / Lent
  khata_lent: {
    from: '#fbbf24',
    via: '#d97706',
    to: '#92400e',
    shadow: 'rgba(217, 119, 6, 0.45)',
    accent: '#fef3c7',
    fallbackIcon: 'HandCoins',
  },
  // Default Transfer
  transfer: {
    from: '#60a5fa',
    via: '#3b82f6',
    to: '#1d4ed8',
    shadow: 'rgba(59, 130, 246, 0.45)',
    accent: '#dbeafe',
    fallbackIcon: 'ArrowRightLeft',
  },
  // Default Card Payment
  card_payment: {
    from: '#c084fc',
    via: '#9333ea',
    to: '#6b21a8',
    shadow: 'rgba(147, 51, 234, 0.45)',
    accent: '#f3e8ff',
    fallbackIcon: 'CreditCard',
  },
};

export const Category3DIcon: React.FC<Category3DIconProps> = ({
  name = 'HelpCircle',
  categoryName,
  color,
  size = 'md',
  className = '',
  shape = 'squircle',
  glow = true,
  interactive = false,
}) => {
  // Determine sizing in pixels & classes
  let containerSizePx = 36;
  let iconSizePx = 18;
  let roundedClass = 'rounded-2xl';

  if (typeof size === 'number') {
    containerSizePx = size;
    iconSizePx = Math.round(size * 0.5);
  } else {
    switch (size) {
      case 'xs':
        containerSizePx = 22;
        iconSizePx = 11;
        roundedClass = 'rounded-lg';
        break;
      case 'sm':
        containerSizePx = 28;
        iconSizePx = 14;
        roundedClass = 'rounded-xl';
        break;
      case 'md':
        containerSizePx = 38;
        iconSizePx = 19;
        roundedClass = 'rounded-2xl';
        break;
      case 'lg':
        containerSizePx = 46;
        iconSizePx = 23;
        roundedClass = 'rounded-2xl';
        break;
      case 'xl':
        containerSizePx = 56;
        iconSizePx = 28;
        roundedClass = 'rounded-3xl';
        break;
      case '2xl':
        containerSizePx = 72;
        iconSizePx = 36;
        roundedClass = 'rounded-3xl';
        break;
    }
  }

  if (shape === 'circle') {
    roundedClass = 'rounded-full';
  }

  // Find matching palette
  let palette: GradientRecipe | null = null;

  // Search by category key or name
  if (categoryName) {
    const cleanKey = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    for (const [key, p] of Object.entries(CATEGORY_3D_PALETTES)) {
      if (cleanKey.includes(key) || key.includes(cleanKey)) {
        palette = p;
        break;
      }
    }
  }

  // Fallback search by icon name
  if (!palette && name) {
    for (const p of Object.values(CATEGORY_3D_PALETTES)) {
      if (p.fallbackIcon.toLowerCase() === name.toLowerCase()) {
        palette = p;
        break;
      }
    }
  }

  // Default color-based palette if no match
  if (!palette) {
    const baseColor = color || '#3b82f6';
    palette = {
      from: baseColor,
      to: baseColor,
      shadow: `${baseColor}60`,
      accent: '#ffffff',
      fallbackIcon: name || 'Receipt',
    };
  }

  // Dynamic Icon Component
  const IconComponent = (LucideIcons as any)[name] || (LucideIcons as any)[palette.fallbackIcon] || LucideIcons.Receipt;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${roundedClass} ${className} ${
        interactive ? 'transition-transform duration-200 hover:scale-108 hover:-translate-y-0.5 active:scale-95 cursor-pointer' : ''
      }`}
      style={{
        width: `${containerSizePx}px`,
        height: `${containerSizePx}px`,
        background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.via || palette.from} 50%, ${palette.to} 100%)`,
        boxShadow: glow
          ? `0 6px 14px -2px ${palette.shadow}, 0 2px 5px -1px ${palette.shadow}, inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.7), inset 0 -2px 4px 0 rgba(0, 0, 0, 0.35)`
          : `inset 0 1px 1px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 3px 0 rgba(0, 0, 0, 0.25)`,
      }}
    >
      {/* 3D Gloss Sheen Arc (Top-Left Highlight) */}
      <div
        className={`absolute inset-0 ${roundedClass} pointer-events-none overflow-hidden`}
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.1) 40%, rgba(255, 255, 255, 0) 65%)',
        }}
      />

      {/* Subtle Inner 3D Sphere Highlight */}
      <div
        className="absolute top-1 left-1.5 w-1/3 h-1/4 rounded-full opacity-60 pointer-events-none blur-[0.5px]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%)',
        }}
      />

      {/* Embossed Inner Icon with 3D Depth Shadow */}
      <div
        className="relative z-10 flex items-center justify-center text-white"
        style={{
          filter: 'drop-shadow(0 2px 2.5px rgba(0, 0, 0, 0.4))',
        }}
      >
        <IconComponent size={iconSizePx} strokeWidth={2.5} className="text-white" />
      </div>
    </div>
  );
};
