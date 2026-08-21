import React from 'react';
import * as LucideIcons from 'lucide-react';

export type BankIcon3DSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

interface Bank3DIconProps {
  name?: string;
  institution?: string;
  type?: string;
  color?: string;
  size?: BankIcon3DSize;
  className?: string;
  glow?: boolean;
}

// Color and monogram map for Indian Banks & Financial Institutions
const BANK_3D_METADATA: Record<
  string,
  {
    shortName: string;
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    accentGlow: string;
    badgeText?: string;
  }
> = {
  'HDFC Bank': {
    shortName: 'HDFC',
    primaryColor: '#004c8f',
    secondaryColor: '#00284d',
    textColor: '#ffffff',
    accentGlow: 'rgba(0, 76, 143, 0.45)',
    badgeText: 'HDFC',
  },
  'State Bank of India': {
    shortName: 'SBI',
    primaryColor: '#280071',
    secondaryColor: '#14003d',
    textColor: '#29b6f6',
    accentGlow: 'rgba(40, 0, 113, 0.45)',
    badgeText: 'SBI',
  },
  'ICICI Bank': {
    shortName: 'ICICI',
    primaryColor: '#f37e20',
    secondaryColor: '#b84e03',
    textColor: '#ffffff',
    accentGlow: 'rgba(243, 126, 32, 0.45)',
    badgeText: 'i',
  },
  'Axis Bank': {
    shortName: 'AXIS',
    primaryColor: '#97144d',
    secondaryColor: '#5c062c',
    textColor: '#ffffff',
    accentGlow: 'rgba(151, 20, 77, 0.45)',
    badgeText: 'A',
  },
  'Kotak Mahindra Bank': {
    shortName: 'KOTAK',
    primaryColor: '#e21e25',
    secondaryColor: '#91080d',
    textColor: '#ffffff',
    accentGlow: 'rgba(226, 30, 37, 0.45)',
    badgeText: '811',
  },
  'Punjab National Bank': {
    shortName: 'PNB',
    primaryColor: '#a20a3a',
    secondaryColor: '#5b021d',
    textColor: '#ffc107',
    accentGlow: 'rgba(162, 10, 58, 0.45)',
    badgeText: 'PNB',
  },
  'Bank of Baroda': {
    shortName: 'BOB',
    primaryColor: '#f26522',
    secondaryColor: '#a13b0c',
    textColor: '#ffffff',
    accentGlow: 'rgba(242, 101, 34, 0.45)',
    badgeText: 'BOB',
  },
  'Canara Bank': {
    shortName: 'CANARA',
    primaryColor: '#0091da',
    secondaryColor: '#005885',
    textColor: '#ffd100',
    accentGlow: 'rgba(0, 145, 218, 0.45)',
    badgeText: 'CB',
  },
  'IndusInd Bank': {
    shortName: 'INDUS',
    primaryColor: '#861f41',
    secondaryColor: '#4d0b21',
    textColor: '#ffffff',
    accentGlow: 'rgba(134, 31, 65, 0.45)',
    badgeText: 'IN',
  },
  'IDFC FIRST Bank': {
    shortName: 'IDFC',
    primaryColor: '#9d2235',
    secondaryColor: '#5a0d1b',
    textColor: '#ffffff',
    accentGlow: 'rgba(157, 34, 53, 0.45)',
    badgeText: '1ST',
  },
  'Yes Bank': {
    shortName: 'YES',
    primaryColor: '#00529b',
    secondaryColor: '#002a52',
    textColor: '#ed1b24',
    accentGlow: 'rgba(0, 82, 155, 0.45)',
    badgeText: 'YES',
  },
  'Union Bank of India': {
    shortName: 'UNION',
    primaryColor: '#005b94',
    secondaryColor: '#c8102e',
    textColor: '#ffffff',
    accentGlow: 'rgba(0, 91, 148, 0.45)',
    badgeText: 'UBI',
  },
  'Federal Bank': {
    shortName: 'FED',
    primaryColor: '#003087',
    secondaryColor: '#fdb913',
    textColor: '#ffffff',
    accentGlow: 'rgba(0, 48, 135, 0.45)',
    badgeText: 'FB',
  },
  'Amazon Pay': {
    shortName: 'AMZ',
    primaryColor: '#ff9900',
    secondaryColor: '#146eb4',
    textColor: '#ffffff',
    accentGlow: 'rgba(255, 153, 0, 0.5)',
    badgeText: 'pay',
  },
  'Paytm': {
    shortName: 'PAYTM',
    primaryColor: '#002970',
    secondaryColor: '#00b9f5',
    textColor: '#ffffff',
    accentGlow: 'rgba(0, 185, 245, 0.45)',
    badgeText: 'Paytm',
  },
  'PhonePe': {
    shortName: 'PHONEPE',
    primaryColor: '#5f259f',
    secondaryColor: '#391363',
    textColor: '#ffffff',
    accentGlow: 'rgba(95, 37, 159, 0.5)',
    badgeText: 'पे',
  },
  'CRED': {
    shortName: 'CRED',
    primaryColor: '#0f172a',
    secondaryColor: '#000000',
    textColor: '#ffffff',
    accentGlow: 'rgba(15, 23, 42, 0.5)',
    badgeText: 'CRED',
  },
  'Cash': {
    shortName: 'CASH',
    primaryColor: '#059669',
    secondaryColor: '#047857',
    textColor: '#d1fae5',
    accentGlow: 'rgba(5, 150, 105, 0.45)',
    badgeText: '₹',
  },
};

export const Bank3DIcon: React.FC<Bank3DIconProps> = ({
  name = 'Building2',
  institution,
  color,
  size = 'md',
  className = '',
  glow = true,
}) => {
  // Determine pixel size
  let pxSize = 36;
  let iconSize = 18;
  let textSize = 'text-[10px]';

  if (typeof size === 'number') {
    pxSize = size;
    iconSize = Math.max(12, Math.floor(size * 0.48));
    textSize = pxSize < 24 ? 'text-[8px]' : pxSize < 36 ? 'text-[10px]' : 'text-xs';
  } else {
    switch (size) {
      case 'xs':
        pxSize = 22;
        iconSize = 12;
        textSize = 'text-[7px]';
        break;
      case 'sm':
        pxSize = 30;
        iconSize = 15;
        textSize = 'text-[9px]';
        break;
      case 'md':
        pxSize = 38;
        iconSize = 19;
        textSize = 'text-[11px]';
        break;
      case 'lg':
        pxSize = 48;
        iconSize = 24;
        textSize = 'text-xs';
        break;
      case 'xl':
        pxSize = 64;
        iconSize = 32;
        textSize = 'text-sm font-black';
        break;
    }
  }

  // Lookup matched bank
  const bankMeta = institution ? BANK_3D_METADATA[institution] : undefined;
  const primary = color || bankMeta?.primaryColor || '#0284c7';
  const secondary = bankMeta?.secondaryColor || '#0369a1';
  const textCol = bankMeta?.textColor || '#ffffff';
  const glowColor = bankMeta?.accentGlow || `${primary}55`;

  // Render Lucide icon or Monogram
  const LucideComp = (LucideIcons as any)[name] || (LucideIcons as any)['Building2'] || LucideIcons.HelpCircle;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl select-none transition-transform duration-200 active:scale-95 ${className}`}
      style={{
        width: `${pxSize}px`,
        height: `${pxSize}px`,
        background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        boxShadow: glow
          ? `0 6px 14px -3px ${glowColor}, inset 0 1px 1px rgba(255, 255, 255, 0.45), inset 0 -2px 4px rgba(0, 0, 0, 0.25)`
          : `inset 0 1px 1px rgba(255, 255, 255, 0.35), inset 0 -1px 2px rgba(0, 0, 0, 0.2)`,
        border: '1px solid rgba(255, 255, 255, 0.18)',
      }}
    >
      {/* 3D Top-left Specular Sheen */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 25% 15%, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0) 65%)',
        }}
      />

      {/* 3D Inner Content */}
      <div className="relative z-10 flex items-center justify-center filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
        {bankMeta?.badgeText && pxSize >= 28 ? (
          <span
            className={`font-black uppercase tracking-tight ${textSize}`}
            style={{ color: textCol }}
          >
            {bankMeta.badgeText}
          </span>
        ) : (
          <LucideComp
            size={iconSize}
            color={textCol}
            strokeWidth={2.4}
          />
        )}
      </div>
    </div>
  );
};
