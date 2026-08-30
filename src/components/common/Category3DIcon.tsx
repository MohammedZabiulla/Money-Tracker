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
  // Flights & Air Travel
  flight_travel: {
    from: '#0284c7',
    via: '#0369a1',
    to: '#1e3a8a',
    shadow: 'rgba(2, 132, 199, 0.5)',
    accent: '#bae6fd',
    fallbackIcon: 'Plane',
  },
  // Commute & Transport (Cabs / Metro / Auto)
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

// Keyword matcher function to find the best 3D palette & icon
function matchCategoryPalette(categoryName?: string, name?: string, customColor?: string): { palette: GradientRecipe; iconName: string } {
  const text = `${categoryName || ''} ${name || ''}`.toLowerCase();

  // 1. Flight / Aviation / Airport / Plane
  if (/flight|plane|airline|airport|airways|indigo|airindia|vistara|spicejet|emirates|ticket|boarding|boardingpass|air\s*ticket|flight\s*ticket|flightbooking/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.flight_travel, iconName: 'Plane' };
  }

  // 2. Travel / Holidays / Vacation / Tourism
  if (/travel|transit|trip|vacation|holiday|tour|hotel|resort|airbnb|makemytrip|easemytrip|cleartrip|yatra|booking/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.travel_holidays, iconName: 'Plane' };
  }

  // 3. Commute / Cabs / Auto / Metro / Train
  if (/cab|uber|ola|auto|taxi|metro|train|irctc|bus|commute|transport|ride|rapido|fastag|toll/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.transport, iconName: 'Car' };
  }

  // 4. Fuel / Petrol / Diesel / Gas / CNG
  if (/fuel|petrol|diesel|cng|gas\s*station|shell|indianoil|hpcl|bpcl/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.fuel_petrol, iconName: 'Fuel' };
  }

  // 5. Food & Dining / Restaurant / Swiggy / Zomato
  if (/food|dining|swiggy|zomato|restaurant|cafe|meal|snack|dinner|lunch|breakfast|pizza|burger|starbucks|mcdonalds|eat|beverage|drink|bar|pub/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.food_dining, iconName: 'Utensils' };
  }

  // 6. Groceries / Blinkit / Zepto / Supermarket
  if (/grocer|blinkit|zepto|instamart|bigbasket|supermarket|vegetable|fruit|dairy|milk|kirana|dmart|spencer/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.groceries, iconName: 'ShoppingCart' };
  }

  // 7. Shopping / E-commerce / Apparel
  if (/shop|amazon|flipkart|myntra|ajio|meesho|cloth|apparel|shoe|fashion|mall|electronic|gadget|zara|h&m/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.shopping, iconName: 'ShoppingBag' };
  }

  // 8. Bills / Utilities / Electricity / Recharge
  if (/bill|utility|electricity|power|water|gas|recharge|mobile|wifi|broadband|dth|airtel|jio|vi|bescom|tneb|cesc|postpaid|prepaid/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.bills_utilities, iconName: 'Receipt' };
  }

  // 9. Rent / Housing / Maintenance
  if (/rent|house|flat|apartment|society|maintenance|landlord|home|decor|furniture/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.home_rent, iconName: 'Home' };
  }

  // 10. Medical / Doctor / Pharmacy / Health
  if (/health|medic|pharma|doctor|hospital|clinic|1mg|apollo|pharmeasy|dentist|lab|surgery|diagnostic/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.health_medical, iconName: 'HeartPulse' };
  }

  // 11. Fitness / Gym / Sports
  if (/gym|fitness|cult|workout|sport|badminton|football|cricket|yoga|swimming/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.fitness_sports, iconName: 'Dumbbell' };
  }

  // 12. Entertainment / Movies / Cinema / OTT
  if (/movie|cinema|inox|pvr|bookmyshow|theatre|ott|netflix|prime|hotstar|spotify|youtube|game|gaming|playstation/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.entertainment_ott, iconName: 'Film' };
  }

  // 13. Education / Courses / Books
  if (/education|school|college|tuition|course|book|exam|upskill|udemy|coursera/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.education_learning, iconName: 'GraduationCap' };
  }

  // 14. Investments / Stocks / SIP / Mutual Funds
  if (/invest|sip|mutual\s*fund|stock|share|groww|zerodha|upstox|crypto|fund|trading/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.investments_stocks, iconName: 'TrendingUp' };
  }

  // 15. Salary / Income / Refund / Cashback
  if (/salary|payroll|income|bonus|cashback|refund|dividend/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.salary_income, iconName: 'Briefcase' };
  }

  // 16. Credit Card Bill Payment
  if (/card\s*payment|card\s*bill|credit\s*card\s*bill|cred|bill\s*pay/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.card_payment, iconName: 'CreditCard' };
  }

  // 17. Bank Transfer / Self Transfer
  if (/transfer|neft|rtgs|imps|upi|self\s*transfer/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.transfer, iconName: 'ArrowRightLeft' };
  }

  // 18. Lend / Borrow / Loan / Debt
  if (/lend|borrow|loan|debt|credit|khata|dues|advance|lent/.test(text)) {
    return { palette: CATEGORY_3D_PALETTES.khata_lent, iconName: 'HandCoins' };
  }

  // Fallback: Check if name matches any Lucide icon
  let resolvedIcon = name || 'Receipt';
  if (resolvedIcon === 'HelpCircle' || !resolvedIcon) {
    resolvedIcon = 'Receipt';
  }

  // Color sanitization to prevent white-on-white
  let baseColor = customColor || '#3b82f6';
  if (baseColor.toLowerCase() === '#ffffff' || baseColor.toLowerCase() === '#fff' || baseColor.toLowerCase() === '#f8fafc') {
    baseColor = '#0284c7';
  }

  return {
    palette: {
      from: baseColor,
      to: baseColor,
      shadow: `${baseColor}60`,
      accent: '#ffffff',
      fallbackIcon: resolvedIcon,
    },
    iconName: resolvedIcon,
  };
}

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

  const { palette, iconName } = matchCategoryPalette(categoryName, name, color);

  // Dynamic Icon Component
  const IconComponent =
    (LucideIcons as any)[name && name !== 'HelpCircle' ? name : iconName] ||
    (LucideIcons as any)[iconName] ||
    (LucideIcons as any)[palette.fallbackIcon] ||
    LucideIcons.Receipt;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none border border-black/10 dark:border-white/15 ${roundedClass} ${className} ${
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
          filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.45))',
        }}
      >
        <IconComponent size={iconSizePx} strokeWidth={2.4} className="text-white" />
      </div>
    </div>
  );
};

