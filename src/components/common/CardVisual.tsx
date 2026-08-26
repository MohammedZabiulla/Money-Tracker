import React from 'react';
import { CreditCard, CardNetwork } from '../../types';
import { CARD_NETWORKS, CARD_THEMES, INDIAN_BANKS } from '../../lib/constants';
import { formatINR, formatCompactINR } from '../../lib/currency';
import { Radio, Wifi, Edit2, Trash2, ArrowRight, CheckCircle2, Receipt } from 'lucide-react';

// Authentic SVG Network Badges
export const NetworkLogo: React.FC<{ network?: string; className?: string; light?: boolean }> = ({
  network = 'VISA',
  className = 'h-5',
  light = true,
}) => {
  const norm = (network || '').toUpperCase();

  if (norm.includes('MASTER')) {
    return (
      <div className={`flex items-center space-x-[-7px] ${className}`} title="Mastercard">
        <div className="w-5 h-5 rounded-full bg-red-600 shadow-sm opacity-90" />
        <div className="w-5 h-5 rounded-full bg-amber-500 shadow-sm opacity-90 mix-blend-screen" />
      </div>
    );
  }

  if (norm.includes('RUPAY')) {
    return (
      <div className="flex items-center font-black italic tracking-tighter text-xs" title="RuPay">
        <span className="text-orange-500 font-extrabold">Ru</span>
        <span className="text-emerald-400 font-extrabold">Pay</span>
        <span className="ml-1 px-1 py-0.2 text-[8px] bg-emerald-500/20 text-emerald-300 rounded font-sans uppercase">
          IN
        </span>
      </div>
    );
  }

  if (norm.includes('AMEX') || norm.includes('AMERICAN')) {
    return (
      <div
        className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-extrabold text-[10px] tracking-tight uppercase shadow-sm border border-blue-400/40"
        title="American Express"
      >
        AMEX
      </div>
    );
  }

  if (norm.includes('DINER')) {
    return (
      <div className="flex items-center space-x-1" title="Diners Club">
        <div className="w-4 h-4 rounded-full border-2 border-blue-400 flex items-center justify-center text-[9px] font-bold text-blue-300">
          DC
        </div>
        <span className="text-[10px] font-bold tracking-tight text-slate-200">Diners</span>
      </div>
    );
  }

  if (norm.includes('DISCOVER')) {
    return (
      <div className="px-1.5 py-0.5 rounded bg-orange-600 text-white font-black text-[10px] uppercase shadow-sm">
        DISCOVER
      </div>
    );
  }

  // Default VISA
  return (
    <div
      className={`font-black italic tracking-widest text-sm select-none ${
        light ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]' : 'text-blue-900'
      }`}
      title="Visa"
    >
      VISA
    </div>
  );
};

// EMV Chip Representation
export const EMVChip: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => {
  const isSm = size === 'sm';
  return (
    <div
      className={`relative rounded-md bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border border-yellow-200/50 shadow-inner overflow-hidden flex items-center justify-center ${
        isSm ? 'w-6 h-5' : 'w-9 h-7'
      }`}
    >
      {/* Chip micro-lines */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-yellow-900/30" />
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-yellow-900/30" />
      <div className="w-1/2 h-1/2 rounded-[2px] border border-yellow-900/30" />
    </div>
  );
};

interface CardVisualProps {
  card: CreditCard;
  onEdit?: () => void;
  onDelete?: () => void;
  onPayBill?: () => void;
  onViewTransactions?: () => void;
  showActions?: boolean;
}

export const CardVisual: React.FC<CardVisualProps> = ({
  card,
  onEdit,
  onDelete,
  onPayBill,
  onViewTransactions,
  showActions = true,
}) => {
  const themeKey = card.cardTheme || 'midnight';
  const theme = CARD_THEMES.find(t => t.id === themeKey) || CARD_THEMES[0];
  const bankConfig = INDIAN_BANKS.find(b => b.name === card.issuer);

  const util = card.creditLimit > 0 ? (card.currentOutstanding / card.creditLimit) * 100 : 0;
  const available = Math.max(0, card.creditLimit - card.currentOutstanding);

  return (
    <div
      onClick={onViewTransactions}
      className={`relative overflow-hidden rounded-3xl p-5 text-white bg-gradient-to-br ${theme.gradient} border ${theme.border || 'border-white/15'} shadow-xl transition-all duration-200 hover:shadow-2xl group ${
        onViewTransactions ? 'cursor-pointer hover:scale-[1.01]' : ''
      }`}
      style={{
        boxShadow: `0 10px 25px -5px ${card.color ? card.color + '40' : 'rgba(0,0,0,0.4)'}`,
      }}
    >
      {/* Background Texture & Holographic Sheen */}
      {theme.texture && theme.texture !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
          style={{ background: theme.texture }}
        />
      )}
      <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-black/20 blur-2xl pointer-events-none" />
      <div className="absolute right-0 bottom-0 opacity-5 text-8xl font-black select-none pointer-events-none tracking-tighter mr-2 mb-[-10px]">
        {card.network || 'CARD'}
      </div>

      {/* Top Header: Issuer + Card Name & Network */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center space-x-2.5">
          <div
            className="px-2 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase shadow-inner border border-white/20"
            style={{ backgroundColor: bankConfig?.color || '#004c8f' }}
          >
            {bankConfig?.logoText || card.issuer.substring(0, 4).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="text-sm font-bold tracking-tight drop-shadow-sm leading-tight text-white">
                {card.name}
              </h4>
              {card.network === 'RUPAY' && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  UPI
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/70">{card.issuer}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Wifi className="w-4 h-4 text-white/60 rotate-90" />
          <NetworkLogo network={card.network} className="h-5" />
        </div>
      </div>

      {/* Chip + Card Number Row */}
      <div className="relative z-10 my-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <EMVChip />
          <div className="flex items-center space-x-1.5 font-mono text-sm tracking-widest text-white/90 drop-shadow">
            <span>••••</span>
            <span>••••</span>
            <span>••••</span>
            <span className="font-bold text-white text-base">{card.lastFourDigits || '0000'}</span>
          </div>
        </div>

        {card.dueDate && (
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider text-white/60 block">Due Day</span>
            <span className="text-xs font-bold text-amber-300">{card.dueDate}th of month</span>
          </div>
        )}
      </div>

      {/* Balances & Limit Matrix */}
      <div className="relative z-10 grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-black/25 backdrop-blur-md border border-white/10 text-xs">
        <div>
          <span className="text-[10px] text-white/60 block">Outstanding</span>
          <span className="font-bold text-rose-300 text-sm">{formatINR(card.currentOutstanding)}</span>
        </div>
        <div>
          <span className="text-[10px] text-white/60 block">Available</span>
          <span className="font-bold text-emerald-300 text-sm">{formatINR(available)}</span>
        </div>
        <div>
          <span className="text-[10px] text-white/60 block">Total Limit</span>
          <span className="font-bold text-white/90 text-sm">{formatCompactINR(card.creditLimit)}</span>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="relative z-10 mt-3 space-y-1">
        <div className="flex items-center justify-between text-[10px] text-white/70">
          <span className="flex items-center space-x-1">
            <span>Utilization:</span>
            <span
              className={`font-bold ${
                util > 50 ? 'text-rose-300' : util > 30 ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {util.toFixed(0)}%
            </span>
          </span>
          <span>Statement on {card.statementDate || 15}th</span>
        </div>
        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              util > 50
                ? 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                : util > 30
                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
            }`}
            style={{ width: `${Math.min(100, Math.max(2, util))}%` }}
          />
        </div>
      </div>

      {/* Perks Note if present */}
      {card.notes && (
        <div className="relative z-10 mt-2.5 px-2.5 py-1 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] text-white/90 truncate">
          ✨ {card.notes}
        </div>
      )}

      {/* Card Action Buttons */}
      {showActions && (
        <div
          onClick={e => e.stopPropagation()}
          className="relative z-10 mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2"
        >
          <div className="flex items-center space-x-2">
            {onViewTransactions && (
              <button
                onClick={onViewTransactions}
                className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center space-x-1 transition-all border border-white/20 active:scale-95 cursor-pointer"
                title="View transactions made on this card"
              >
                <Receipt size={12} />
                <span>Transactions</span>
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center space-x-1 transition-colors border border-white/10"
                title="Edit Card Details"
              >
                <Edit2 size={12} />
                <span>Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold flex items-center space-x-1 transition-colors border border-rose-500/30"
                title="Delete Card"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            )}
          </div>

          {onPayBill && (
            card.currentOutstanding > 0 ? (
              <button
                onClick={onPayBill}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                title={`Pay current outstanding balance of ₹${card.currentOutstanding.toLocaleString('en-IN')}`}
              >
                <span>Pay Bill</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <div
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold flex items-center space-x-1.5 backdrop-blur-sm shadow-xs"
                title="All dues are cleared! No outstanding balance on this credit card."
              >
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>No Dues • Bill Paid</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

// Compact Chip Badge for Selection lists, Transaction rows, and Filter pills
interface CardChipBadgeProps {
  card: CreditCard;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CardChipBadge: React.FC<CardChipBadgeProps> = ({
  card,
  className = '',
  size = 'md',
}) => {
  const themeKey = card.cardTheme || 'midnight';
  const theme = CARD_THEMES.find(t => t.id === themeKey) || CARD_THEMES[0];
  const bank = INDIAN_BANKS.find(b => b.name === card.issuer);

  if (size === 'sm') {
    return (
      <div
        className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-slate-900 text-white border border-slate-700 text-[11px] font-medium shadow-sm ${className}`}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: bank?.color || card.color || '#004c8f' }}
        />
        <span className="truncate max-w-[90px]">{card.name}</span>
        <span className="text-[9px] text-slate-400 font-mono">••{card.lastFourDigits}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-r ${theme.gradient} text-white border border-white/15 shadow-sm text-xs ${className}`}
    >
      <div className="w-4 h-3 rounded-sm bg-amber-400/80 border border-yellow-200/50 flex-shrink-0" />
      <span className="font-semibold truncate max-w-[120px]">{card.name}</span>
      <span className="font-mono text-[10px] text-white/80">••{card.lastFourDigits}</span>
      <NetworkLogo network={card.network} className="h-3 ml-1" />
    </div>
  );
};
