import React from 'react';
import * as LucideIcons from 'lucide-react';

export type PaymentAppIcon3DSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export interface PaymentApp3DIconProps {
  name?: string;
  appId?: string;
  appName?: string;
  color?: string;
  icon?: string;
  symbol?: string;
  theme?: string;
  gradient?: string;
  size?: PaymentAppIcon3DSize;
  className?: string;
  glow?: boolean;
}

// Visual and brand specifications for Indian Payment Apps & UPI Channels
const PAYMENT_APPS_3D_CONFIG: Record<
  string,
  {
    gradient: string;
    shadow: string;
    textColor: string;
    symbol: string;
    isText?: boolean;
    defaultIcon: string;
  }
> = {
  phonepe: {
    gradient: 'linear-gradient(135deg, #6739B7 0%, #4A148C 100%)',
    shadow: 'rgba(103, 57, 183, 0.55)',
    textColor: '#ffffff',
    symbol: 'पे',
    isText: true,
    defaultIcon: 'Smartphone',
  },
  gpay: {
    gradient: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
    shadow: 'rgba(26, 115, 232, 0.5)',
    textColor: '#ffffff',
    symbol: 'GPay',
    isText: true,
    defaultIcon: 'Smartphone',
  },
  paytm: {
    gradient: 'linear-gradient(135deg, #002970 0%, #00b9f5 100%)',
    shadow: 'rgba(0, 185, 245, 0.5)',
    textColor: '#ffffff',
    symbol: 'Paytm',
    isText: true,
    defaultIcon: 'Smartphone',
  },
  cred: {
    gradient: 'linear-gradient(135deg, #1e293b 0%, #020617 100%)',
    shadow: 'rgba(15, 23, 42, 0.65)',
    textColor: '#ffffff',
    symbol: 'CRED',
    isText: true,
    defaultIcon: 'ShieldCheck',
  },
  bhim: {
    gradient: 'linear-gradient(135deg, #007934 0%, #e65100 100%)',
    shadow: 'rgba(0, 121, 52, 0.5)',
    textColor: '#ffffff',
    symbol: 'BHIM',
    isText: true,
    defaultIcon: 'QrCode',
  },
  amazonpay: {
    gradient: 'linear-gradient(135deg, #ff9900 0%, #232f3e 100%)',
    shadow: 'rgba(255, 153, 0, 0.55)',
    textColor: '#ffffff',
    symbol: 'a',
    isText: true,
    defaultIcon: 'ShoppingBag',
  },
  whatsapp: {
    gradient: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
    shadow: 'rgba(37, 211, 102, 0.5)',
    textColor: '#ffffff',
    symbol: 'WA',
    isText: true,
    defaultIcon: 'MessageSquare',
  },
  cash: {
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    shadow: 'rgba(16, 185, 129, 0.5)',
    textColor: '#ffffff',
    symbol: '₹',
    isText: true,
    defaultIcon: 'Banknote',
  },
  netbanking: {
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    shadow: 'rgba(2, 132, 199, 0.5)',
    textColor: '#ffffff',
    symbol: 'Net',
    isText: false,
    defaultIcon: 'Landmark',
  },
  card: {
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    shadow: 'rgba(139, 92, 246, 0.5)',
    textColor: '#ffffff',
    symbol: 'Card',
    isText: false,
    defaultIcon: 'CreditCard',
  },
  wallet: {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    shadow: 'rgba(245, 158, 11, 0.5)',
    textColor: '#ffffff',
    symbol: 'Wallet',
    isText: false,
    defaultIcon: 'Wallet',
  },
  cheque: {
    gradient: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
    shadow: 'rgba(100, 116, 139, 0.5)',
    textColor: '#ffffff',
    symbol: 'Chq',
    isText: false,
    defaultIcon: 'Receipt',
  },
  applepay: {
    gradient: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
    shadow: 'rgba(0, 0, 0, 0.55)',
    textColor: '#ffffff',
    symbol: 'Apple',
    isText: false,
    defaultIcon: 'Smartphone',
  },
};

export const PaymentApp3DIcon: React.FC<PaymentApp3DIconProps> = ({
  name,
  appId,
  appName,
  color,
  icon,
  symbol,
  gradient,
  size = 'md',
  className = '',
  glow = true,
}) => {
  // Combine all possible identifier inputs to match properly
  const rawKey = (appName || name || appId || '').toLowerCase().trim();
  const cleanKey = rawKey.replace(/[\s_\-\/\.]/g, '');

  let matchedConfigKey = Object.keys(PAYMENT_APPS_3D_CONFIG).find(key => cleanKey.includes(key));

  if (!matchedConfigKey) {
    if (cleanKey.includes('phonepe') || cleanKey.includes('phone') || cleanKey.includes('pe')) {
      matchedConfigKey = 'phonepe';
    } else if (cleanKey.includes('google') || cleanKey.includes('gpay') || cleanKey.includes('tez')) {
      matchedConfigKey = 'gpay';
    } else if (cleanKey.includes('paytm')) {
      matchedConfigKey = 'paytm';
    } else if (cleanKey.includes('cred')) {
      matchedConfigKey = 'cred';
    } else if (cleanKey.includes('bhim') || cleanKey.includes('upi')) {
      matchedConfigKey = 'bhim';
    } else if (cleanKey.includes('amazon')) {
      matchedConfigKey = 'amazonpay';
    } else if (cleanKey.includes('whatsapp') || cleanKey.includes('whats')) {
      matchedConfigKey = 'whatsapp';
    } else if (cleanKey.includes('cash') || cleanKey.includes('hand') || cleanKey.includes('cashinhand')) {
      matchedConfigKey = 'cash';
    } else if (cleanKey.includes('net') || cleanKey.includes('bank') || cleanKey.includes('imps') || cleanKey.includes('neft') || cleanKey.includes('rtgs')) {
      matchedConfigKey = 'netbanking';
    } else if (cleanKey.includes('card') || cleanKey.includes('pos') || cleanKey.includes('visa') || cleanKey.includes('master') || cleanKey.includes('rupay')) {
      matchedConfigKey = 'card';
    } else if (cleanKey.includes('wallet') || cleanKey.includes('mobikwik') || cleanKey.includes('freecharge')) {
      matchedConfigKey = 'wallet';
    } else if (cleanKey.includes('apple')) {
      matchedConfigKey = 'applepay';
    }
  }

  const matchedConfig = matchedConfigKey ? PAYMENT_APPS_3D_CONFIG[matchedConfigKey] : undefined;

  let pxSize = 34;
  let iconSize = 16;
  let textSize = 'text-[9px] font-black';

  if (typeof size === 'number') {
    pxSize = size;
    iconSize = Math.max(10, Math.floor(size * 0.52));
    textSize = pxSize < 24 ? 'text-[7px] font-black' : pxSize < 34 ? 'text-[9px] font-bold' : 'text-xs font-black';
  } else {
    switch (size) {
      case 'xs':
        pxSize = 20;
        iconSize = 10;
        textSize = 'text-[7px] font-black';
        break;
      case 'sm':
        pxSize = 26;
        iconSize = 13;
        textSize = 'text-[8px] font-black';
        break;
      case 'md':
        pxSize = 36;
        iconSize = 18;
        textSize = 'text-[10px] font-black';
        break;
      case 'lg':
        pxSize = 44;
        iconSize = 22;
        textSize = 'text-xs font-black';
        break;
      case 'xl':
        pxSize = 56;
        iconSize = 28;
        textSize = 'text-sm font-black';
        break;
    }
  }

  const bgGradient =
    gradient ||
    matchedConfig?.gradient ||
    (color
      ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
      : 'linear-gradient(135deg, #059669 0%, #047857 100%)');

  const glowShadow = color ? `${color}66` : matchedConfig?.shadow || 'rgba(5, 150, 105, 0.4)';

  // Choose appropriate Lucide icon safely (never default to HelpCircle)
  const defaultIconName = icon || matchedConfig?.defaultIcon || 'Smartphone';
  const LucideComp = (LucideIcons as any)[defaultIconName] || (LucideIcons as any)[icon || ''] || LucideIcons.Smartphone;

  // Custom SVG / Symbol renderer for high-fidelity brand representations
  const renderBrandContent = () => {
    // 0. If explicit symbol is provided
    if (symbol) {
      return (
        <span className={`font-black text-white ${textSize} leading-none tracking-tight`}>
          {symbol}
        </span>
      );
    }

    // 1. PhonePe
    if (matchedConfigKey === 'phonepe') {
      return (
        <span
          className={`font-black text-white ${textSize} leading-none tracking-tight`}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          पे
        </span>
      );
    }

    // 2. Google Pay / GPay
    if (matchedConfigKey === 'gpay') {
      if (pxSize <= 22) {
        return (
          <span className="font-black text-[8px] text-white tracking-tighter">
            G
          </span>
        );
      }
      return (
        <span className={`font-black text-white ${textSize} tracking-tight`}>
          GPay
        </span>
      );
    }

    // 3. Cash
    if (matchedConfigKey === 'cash') {
      return (
        <span className={`font-black text-emerald-100 ${textSize} leading-none`}>
          ₹
        </span>
      );
    }

    // 4. Paytm
    if (matchedConfigKey === 'paytm') {
      if (pxSize <= 22) {
        return <span className="font-black text-[8px] text-sky-200">P</span>;
      }
      return (
        <span className={`font-black text-white ${textSize} tracking-tighter`}>
          Paytm
        </span>
      );
    }

    // 5. CRED
    if (matchedConfigKey === 'cred') {
      if (pxSize <= 22) {
        return <LucideIcons.ShieldCheck size={iconSize} color="#ffffff" strokeWidth={2.5} />;
      }
      return (
        <span className={`font-black text-white ${textSize} tracking-tighter`}>
          CRED
        </span>
      );
    }

    // 6. BHIM
    if (matchedConfigKey === 'bhim') {
      if (pxSize <= 22) {
        return <LucideIcons.QrCode size={iconSize} color="#ffffff" strokeWidth={2.5} />;
      }
      return (
        <span className={`font-black text-white ${textSize} tracking-tight`}>
          BHIM
        </span>
      );
    }

    // 7. Amazon Pay
    if (matchedConfigKey === 'amazonpay') {
      return (
        <span className={`font-black text-white ${textSize} leading-none italic font-serif`}>
          a
        </span>
      );
    }

    // 8. WhatsApp
    if (matchedConfigKey === 'whatsapp') {
      return <LucideIcons.MessageSquare size={iconSize} color="#ffffff" strokeWidth={2.4} />;
    }

    // Fallback: Icon
    return <LucideComp size={iconSize} color="#ffffff" strokeWidth={2.4} />;
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl select-none transition-transform duration-200 active:scale-95 ${className}`}
      style={{
        width: `${pxSize}px`,
        height: `${pxSize}px`,
        background: bgGradient,
        boxShadow: glow
          ? `0 5px 12px -2px ${glowShadow}, inset 0 1px 1px rgba(255, 255, 255, 0.45), inset 0 -2px 4px rgba(0, 0, 0, 0.25)`
          : `inset 0 1px 1px rgba(255, 255, 255, 0.35), inset 0 -1px 2px rgba(0, 0, 0, 0.2)`,
        border: '1px solid rgba(255, 255, 255, 0.22)',
      }}
    >
      {/* 3D Specular Highlight */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 25% 15%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 65%)',
        }}
      />

      {/* Symbol / Monogram / Icon Content */}
      <div className="relative z-10 flex items-center justify-center filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {renderBrandContent()}
      </div>
    </div>
  );
};
