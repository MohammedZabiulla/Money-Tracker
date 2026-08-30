import React from 'react';
import { CreditCard, CardNetwork } from '../../types';
import { CARD_NETWORKS, CARD_THEMES, INDIAN_BANKS } from '../../lib/constants';
import { formatINR, formatCompactINR } from '../../lib/currency';
import { Radio, Wifi, Edit2, Trash2, ArrowRight, CheckCircle2, Receipt, ArrowRightLeft } from 'lucide-react';

// Authentic SVG Network Badges
export const NetworkLogo: React.FC<{ network?: string; className?: string; light?: boolean }> = ({
  network = 'VISA',
  className = 'h-4',
  light = true,
}) => {
  const norm = (network || '').toUpperCase();

  if (norm.includes('MASTER')) {
    return (
      <div className={`flex items-center space-x-[-6px] ${className}`} title="Mastercard">
        <div className="w-4 h-4 rounded-full bg-red-600 shadow-sm opacity-90" />
        <div className="w-4 h-4 rounded-full bg-amber-500 shadow-sm opacity-90 mix-blend-screen" />
      </div>
    );
  }

  if (norm.includes('RUPAY')) {
    return (
      <div className="flex items-center font-black italic tracking-tighter text-[11px]" title="RuPay">
        <span className="text-orange-500 font-extrabold">Ru</span>
        <span className="text-emerald-400 font-extrabold">Pay</span>
        <span className="ml-1 px-1 py-0.1 text-[7px] bg-emerald-500/20 text-emerald-300 rounded font-sans uppercase">
          IN
        </span>
      </div>
    );
  }

  if (norm.includes('AMEX') || norm.includes('AMERICAN')) {
    return (
      <div
        className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-extrabold text-[9px] tracking-tight uppercase shadow-sm border border-blue-400/40"
        title="American Express"
      >
        AMEX
      </div>
    );
  }

  if (norm.includes('DINER')) {
    return (
      <div className="flex items-center space-x-1" title="Diners Club">
        <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 flex items-center justify-center text-[8px] font-bold text-blue-300">
          DC
        </div>
        <span className="text-[9px] font-bold tracking-tight text-slate-200">Diners</span>
      </div>
    );
  }

  if (norm.includes('DISCOVER')) {
    return (
      <div className="px-1.5 py-0.5 rounded bg-orange-600 text-white font-black text-[9px] uppercase shadow-sm">
        DISCOVER
      </div>
    );
  }

  // Default VISA
  return (
    <div
      className={`font-black italic tracking-widest text-xs select-none ${
        light ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]' : 'text-blue-900'
      }`}
      title="Visa"
    >
      VISA
    </div>
  );
};

// EMV Chip Representation
export const EMVChip: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => {
  const isSm = size === 'sm';
  return (
    <div
      className={`relative rounded-md bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border border-yellow-200/50 shadow-inner overflow-hidden flex items-center justify-center ${
        isSm ? 'w-5 h-4' : 'w-7 h-5'
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
  onConvert?: () => void;
  showActions?: boolean;
  isStackedView?: boolean;
  isStackedPeekOnly?: boolean;
}

export const CardVisual: React.FC<CardVisualProps> = ({
  card,
  onEdit,
  onDelete,
  onPayBill,
  onViewTransactions,
  onConvert,
  showActions = true,
  isStackedView = false,
  isStackedPeekOnly = false,
}) => {
  const themeKey = card.cardTheme || 'midnight';
  const theme = CARD_THEMES.find(t => t.id === themeKey) || CARD_THEMES[0];
  const bankConfig = INDIAN_BANKS.find(b => b.name === card.issuer);

  const util = card.creditLimit > 0 ? (card.currentOutstanding / card.creditLimit) * 100 : 0;
  const available = Math.max(0, card.creditLimit - card.currentOutstanding);

  return (
    <div
      onClick={onViewTransactions}
      className={`relative overflow-hidden rounded-2xl p-3 sm:p-3.5 text-white bg-gradient-to-br ${theme.gradient} border ${theme.border || 'border-white/20'} shadow-md transition-all duration-200 hover:shadow-xl group select-none ${
        onViewTransactions ? 'cursor-pointer' : ''
      }`}
      style={{
        boxShadow: `0 4px 16px -3px ${card.color ? card.color + '40' : 'rgba(0,0,0,0.4)'}`,
      }}
    >
      {/* Background Texture & Holographic Sheen */}
      {theme.texture && theme.texture !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none opacity-35 mix-blend-overlay"
          style={{ background: theme.texture }}
        />
      )}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-black/30 blur-xl pointer-events-none" />
      <div className="absolute right-0 bottom-0 opacity-5 text-6xl font-black select-none pointer-events-none tracking-tighter mr-2 mb-[-6px]">
        {card.network || 'CARD'}
      </div>

      {/* Top Header: Issuer + Card Name & Network */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className="px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase shadow-xs border border-white/30 drop-shadow-sm text-white"
            style={{ backgroundColor: bankConfig?.color || '#004c8f' }}
          >
            {bankConfig?.logoText || card.issuer.substring(0, 4).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="text-xs sm:text-[13px] font-extrabold tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] leading-tight text-white truncate max-w-[170px] sm:max-w-[240px]">
                {card.name}
              </h4>
              {card.network === 'RUPAY' && (
                <span className="text-[8px] font-bold px-1 py-0.1 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 drop-shadow-sm">
                  UPI
                </span>
              )}
            </div>
            <p className="text-[9px] text-white/80 font-medium truncate max-w-[150px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{card.issuer}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <Wifi className="w-3.5 h-3.5 text-white/80 rotate-90 drop-shadow-sm" />
          <NetworkLogo network={card.network} className="h-3.5" />
        </div>
      </div>

      {/* If only showing header peek in collapsed stack view */}
      {isStackedPeekOnly ? (
        <div className="relative z-10 mt-1.5 flex items-center justify-between text-[11px] pt-1 border-t border-white/20">
          <div className="flex items-center space-x-1.5 font-mono text-white/90 text-[11px] drop-shadow-sm">
            <span>••••</span>
            <span className="font-bold text-white tracking-wider">{card.lastFourDigits || '0000'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-white/80 font-medium drop-shadow-sm">
              {card.dueDate ? `Due: ${card.dueDate}th` : 'No Due Date'}
            </span>
            <span className="font-bold text-rose-200 text-xs px-1.5 py-0.5 rounded-md bg-black/40 border border-rose-400/30 shadow-xs">
              {formatINR(card.currentOutstanding)}
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Chip + Card Number Row */}
          <div className="relative z-10 my-1.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <EMVChip size="sm" />
              <div className="flex items-center space-x-1 font-mono text-xs tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] font-semibold">
                <span>••••</span>
                <span>••••</span>
                <span>••••</span>
                <span className="font-bold text-white text-xs sm:text-sm">{card.lastFourDigits || '0000'}</span>
              </div>
            </div>

            {card.dueDate && (
              <div className="text-right">
                <span className="text-[8px] uppercase tracking-wider text-white/70 block font-medium drop-shadow-sm">Due Date</span>
                <span className="text-[11px] font-bold text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{card.dueDate}th of month</span>
              </div>
            )}
          </div>

          {/* Balances & Limit Matrix (Compact Frosted Strip) */}
          <div className="relative z-10 grid grid-cols-3 gap-1 py-1 px-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/20 text-xs shadow-inner">
            <div>
              <span className="text-[8px] text-white/70 block font-semibold uppercase tracking-wider">Outstanding</span>
              <span className="font-extrabold text-rose-300 text-xs sm:text-[13px] block truncate drop-shadow-xs">
                {formatINR(card.currentOutstanding)}
              </span>
            </div>
            <div>
              <span className="text-[8px] text-white/70 block font-semibold uppercase tracking-wider">Available</span>
              <span className="font-extrabold text-emerald-300 text-xs sm:text-[13px] block truncate drop-shadow-xs">
                {formatINR(available)}
              </span>
            </div>
            <div>
              <span className="text-[8px] text-white/70 block font-semibold uppercase tracking-wider">Total Limit</span>
              <span className="font-bold text-white text-xs sm:text-[13px] block truncate drop-shadow-xs">
                {formatCompactINR(card.creditLimit)}
              </span>
            </div>
          </div>

          {/* Utilization Bar */}
          <div className="relative z-10 mt-1.5 space-y-0.5">
            <div className="flex items-center justify-between text-[9px] text-white/90 font-medium drop-shadow-sm">
              <span className="flex items-center space-x-1">
                <span>Util:</span>
                <span
                  className={`font-bold px-1 py-0.1 rounded ${
                    util > 50 ? 'bg-rose-500/30 text-rose-200' : util > 30 ? 'bg-amber-500/30 text-amber-200' : 'bg-emerald-500/30 text-emerald-200'
                  }`}
                >
                  {util.toFixed(0)}%
                </span>
              </span>
              <span>Statement on {card.statementDate || 15}th</span>
            </div>
            <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  util > 50
                    ? 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.7)]'
                    : util > 30
                    ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]'
                    : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]'
                }`}
                style={{ width: `${Math.min(100, Math.max(2, util))}%` }}
              />
            </div>
          </div>

          {/* Perks Note if present */}
          {card.notes && (
            <div className="relative z-10 mt-1.5 px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-xs border border-white/15 text-[9px] text-white/95 font-medium truncate drop-shadow-sm">
              ✨ {card.notes}
            </div>
          )}

          {/* Card Action Buttons */}
          {showActions && (
            <div
              onClick={e => e.stopPropagation()}
              className="relative z-10 mt-2 pt-1.5 border-t border-white/15 flex items-center justify-between flex-wrap gap-1.5"
            >
              <div className="flex items-center space-x-1 sm:space-x-1.5 flex-wrap gap-y-1">
                {onViewTransactions && (
                  <button
                    onClick={onViewTransactions}
                    className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all border border-white/25 active:scale-95 cursor-pointer shadow-xs drop-shadow-sm"
                    title="View transactions made on this card"
                  >
                    <Receipt size={11} />
                    <span>Transactions</span>
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold flex items-center space-x-1 transition-colors border border-white/15 cursor-pointer"
                    title="Edit Card Details"
                  >
                    <Edit2 size={11} />
                    <span>Edit</span>
                  </button>
                )}
                {onConvert && (
                  <button
                    onClick={onConvert}
                    className="px-2 py-0.5 rounded-lg bg-blue-500/25 hover:bg-blue-500/35 text-blue-100 text-[11px] font-semibold flex items-center space-x-1 transition-colors border border-blue-400/40 cursor-pointer"
                    title="Convert Credit Card into Bank Account or Wallet"
                  >
                    <ArrowRightLeft size={11} />
                    <span>Convert</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="px-1.5 py-0.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 text-rose-100 text-[11px] font-semibold flex items-center space-x-1 transition-colors border border-rose-400/40 cursor-pointer"
                    title="Delete Card"
                  >
                    <Trash2 size={11} />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              {onPayBill && (
                card.currentOutstanding > 0 ? (
                  <button
                    onClick={onPayBill}
                    className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-xs transition-all flex items-center space-x-1 active:scale-95 cursor-pointer"
                    title={`Pay current outstanding balance of ₹${card.currentOutstanding.toLocaleString('en-IN')}`}
                  >
                    <span>Pay Bill</span>
                    <ArrowRight size={12} />
                  </button>
                ) : (
                  <div
                    className="px-2 py-0.5 rounded-lg bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 text-[10px] font-bold flex items-center space-x-1 backdrop-blur-xs shadow-2xs"
                    title="All dues are cleared! No outstanding balance on this credit card."
                  >
                    <CheckCircle2 size={11} className="text-emerald-300" />
                    <span>No Dues</span>
                  </div>
                )
              )}
            </div>
          )}
        </>
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
