import React, { useState } from 'react';
import { CreditCard, Account } from '../../types';
import { CardVisual, NetworkLogo } from '../common/CardVisual';
import { BankVisual } from '../common/BankVisual';
import { CARD_THEMES, INDIAN_BANKS } from '../../lib/constants';
import { formatINR } from '../../lib/currency';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  CreditCard as CreditCardIcon,
  Building,
  Wallet,
  Banknote,
  Calendar,
  Sparkles,
  ArrowRight,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ============================================================================
// STACKED CREDIT CARDS DECK
// ============================================================================
interface StackedCardsDeckProps {
  cards: CreditCard[];
  isStacked: boolean;
  onToggleStacked: () => void;
  onViewTransactions: (card: CreditCard) => void;
  onEdit: (card: CreditCard) => void;
  onDelete: (card: CreditCard) => void;
  onConvert: (card: CreditCard) => void;
  onPayBill: (card: CreditCard) => void;
}

export const StackedCardsDeck: React.FC<StackedCardsDeckProps> = ({
  cards,
  isStacked,
  onToggleStacked,
  onViewTransactions,
  onEdit,
  onDelete,
  onConvert,
  onPayBill,
}) => {
  // Set of expanded card IDs
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(cards.length > 0 ? [cards[0].id] : [])
  );

  if (cards.length === 0) return null;

  const allExpanded = cards.every(c => expandedIds.has(c.id));
  const someExpanded = cards.some(c => expandedIds.has(c.id));

  const handleToggleExpandAll = () => {
    if (allExpanded || someExpanded) {
      // Collapse all
      setExpandedIds(new Set());
    } else {
      // Expand all
      setExpandedIds(new Set(cards.map(c => c.id)));
    }
  };

  const handleToggleCard = (cardId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  // If in standard grid view
  if (!isStacked || cards.length <= 1) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {cards.map((card, idx) => (
          <CardVisual
            key={`card_grid_${card.id}_${idx}`}
            card={card}
            onViewTransactions={() => onViewTransactions(card)}
            onEdit={() => onEdit(card)}
            onDelete={() => onDelete(card)}
            onConvert={() => onConvert(card)}
            onPayBill={() => onPayBill(card)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Top Controls: Expand/Collapse All Button */}
      <div className="flex items-center justify-end gap-2 px-1 text-xs">
        {/* Expand All / Collapse All Toggle Button */}
        <button
          onClick={handleToggleExpandAll}
          className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs ml-auto"
        >
          {allExpanded ? (
            <>
              <ChevronUp size={14} />
              <span>Collapse All</span>
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              <span>Expand All ({cards.length})</span>
            </>
          )}
        </button>
      </div>

      {/* Stacked Cards Deck Items */}
      <div className="space-y-2">
        {cards.map((card, index) => {
          const isExpanded = expandedIds.has(card.id);
          const themeKey = card.cardTheme || 'midnight';
          const theme = CARD_THEMES.find(t => t.id === themeKey) || CARD_THEMES[0];
          const bankConfig = INDIAN_BANKS.find(b => b.name === card.issuer);

          return (
            <div
              key={`card_stack_${card.id}_${index}`}
              className="rounded-2xl transition-all duration-200"
            >
              {isExpanded ? (
                // Full Expanded Card Visual
                <div className="space-y-1.5">
                  <div
                    onClick={() => handleToggleCard(card.id)}
                    className="flex items-center justify-end px-2 text-[11px] text-purple-600 dark:text-purple-400 font-semibold cursor-pointer select-none hover:underline"
                  >
                    <span className="flex items-center space-x-0.5">
                      <span>Collapse</span>
                      <ChevronUp size={13} />
                    </span>
                  </div>
                  <CardVisual
                    card={card}
                    showActions={true}
                    onViewTransactions={() => onViewTransactions(card)}
                    onEdit={() => onEdit(card)}
                    onDelete={() => onDelete(card)}
                    onConvert={() => onConvert(card)}
                    onPayBill={() => onPayBill(card)}
                  />
                </div>
              ) : (
                // High-Contrast Collapsed Card Peek Bar
                <div
                  onClick={() => handleToggleCard(card.id)}
                  className={`relative overflow-hidden rounded-2xl p-3 text-white bg-gradient-to-r ${theme.gradient} border ${
                    theme.border || 'border-white/20'
                  } shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer group flex items-center justify-between select-none`}
                  style={{
                    boxShadow: `0 2px 10px -2px ${card.color ? card.color + '30' : 'rgba(0,0,0,0.3)'}`,
                  }}
                >
                  {/* Background overlay for maximum legibility */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs pointer-events-none" />

                  {/* Left: Bank Logo + Card Name + Network */}
                  <div className="relative z-10 flex items-center space-x-2.5 min-w-0 pr-2">
                    <div
                      className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase shadow-xs border border-white/30 text-white shrink-0"
                      style={{ backgroundColor: bankConfig?.color || '#004c8f' }}
                    >
                      {bankConfig?.logoText || card.issuer.substring(0, 4).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-xs sm:text-sm font-extrabold text-white tracking-tight drop-shadow-sm truncate max-w-[150px] sm:max-w-[220px]">
                          {card.name}
                        </h4>
                        {card.network === 'RUPAY' && (
                          <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 shrink-0">
                            UPI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] text-white/80 font-medium font-mono">
                        <span>•••• {card.lastFourDigits || '0000'}</span>
                        <span>•</span>
                        <span className="text-white/70 font-sans truncate">{card.issuer}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Due Date + Outstanding Amount + Expand Icon */}
                  <div className="relative z-10 flex items-center space-x-2 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-white/80 font-medium">
                        {card.dueDate ? (
                          <span className="text-amber-200 font-semibold">Due: {card.dueDate}th</span>
                        ) : (
                          <span className="text-white/60">No Due Date</span>
                        )}
                      </div>
                      <div className="font-extrabold text-xs sm:text-sm text-rose-200 drop-shadow-sm">
                        {formatINR(card.currentOutstanding)}
                      </div>
                    </div>

                    <div className="w-6 h-6 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center text-white/90 transition-colors">
                      <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// STACKED BANK ACCOUNTS DECK
// ============================================================================
interface StackedBanksDeckProps {
  accounts: Account[];
  isStacked: boolean;
  onToggleStacked: () => void;
  onViewTransactions: (acc: Account) => void;
  onEdit: (acc: Account) => void;
  onDelete: (acc: Account) => void;
  onConvert: (acc: Account) => void;
  onReconcile: (acc: Account) => void;
}

export const StackedBanksDeck: React.FC<StackedBanksDeckProps> = ({
  accounts,
  isStacked,
  onToggleStacked,
  onViewTransactions,
  onEdit,
  onDelete,
  onConvert,
  onReconcile,
}) => {
  // Set of expanded bank IDs
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(accounts.length > 0 ? [accounts[0].id] : [])
  );

  if (accounts.length === 0) return null;

  const allExpanded = accounts.every(a => expandedIds.has(a.id));
  const someExpanded = accounts.some(a => expandedIds.has(a.id));

  const handleToggleExpandAll = () => {
    if (allExpanded || someExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(accounts.map(a => a.id)));
    }
  };

  const handleToggleBank = (accId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(accId)) {
        next.delete(accId);
      } else {
        next.add(accId);
      }
      return next;
    });
  };

  if (!isStacked || accounts.length <= 1) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {accounts.map((acc, idx) => (
          <BankVisual
            key={`bank_grid_${acc.id}_${idx}`}
            account={acc}
            onViewTransactions={() => onViewTransactions(acc)}
            onEdit={() => onEdit(acc)}
            onConvert={() => onConvert(acc)}
            onDelete={() => onDelete(acc)}
            onReconcile={() => onReconcile(acc)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Top Controls: Expand/Collapse All Button */}
      <div className="flex items-center justify-end gap-2 px-1 text-xs">
        {/* Expand All / Collapse All Toggle Button */}
        <button
          onClick={handleToggleExpandAll}
          className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs ml-auto"
        >
          {allExpanded ? (
            <>
              <ChevronUp size={14} />
              <span>Collapse All</span>
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              <span>Expand All ({accounts.length})</span>
            </>
          )}
        </button>
      </div>

      {/* Stacked Bank Account Items */}
      <div className="space-y-2">
        {accounts.map((acc, idx) => {
          const isExpanded = expandedIds.has(acc.id);
          const bankConfig = INDIAN_BANKS.find(
            b => b.name === acc.institution || b.name.toLowerCase().includes(acc.institution.toLowerCase())
          );
          const brandColor = acc.color || bankConfig?.color || '#004c8f';

          return (
            <div key={`bank_stack_${acc.id}_${idx}`} className="rounded-2xl transition-all duration-200">
              {isExpanded ? (
                // Full Expanded Bank Card Visual
                <div className="space-y-1.5">
                  <div
                    onClick={() => handleToggleBank(acc.id)}
                    className="flex items-center justify-end px-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer select-none hover:underline"
                  >
                    <span className="flex items-center space-x-0.5">
                      <span>Collapse</span>
                      <ChevronUp size={13} />
                    </span>
                  </div>
                  <BankVisual
                    account={acc}
                    showActions={true}
                    onViewTransactions={() => onViewTransactions(acc)}
                    onEdit={() => onEdit(acc)}
                    onConvert={() => onConvert(acc)}
                    onDelete={() => onDelete(acc)}
                    onReconcile={() => onReconcile(acc)}
                  />
                </div>
              ) : (
                // High-Contrast Collapsed Bank Peek Bar
                <div
                  onClick={() => handleToggleBank(acc.id)}
                  className="relative overflow-hidden rounded-2xl p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all duration-150 cursor-pointer group flex items-center justify-between select-none"
                >
                  {/* Left: Bank Icon + Name + Account Last 4 */}
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Building size={16} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate max-w-[150px] sm:max-w-[220px]">
                          {acc.name}
                        </h4>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                          {typeof acc.type === 'string' ? acc.type.replace('_', ' ') : 'Account'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                        <span>{acc.institution}</span>
                        {acc.accountNumberLast4 && (
                          <>
                            <span>•</span>
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                              •••• {acc.accountNumberLast4}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right: Available Balance + Expand Icon */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                        Available Balance
                      </span>
                      <span className="font-extrabold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                        {formatINR(acc.calculatedBalance)}
                      </span>
                    </div>

                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors">
                      <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// STACKED DIGITAL WALLETS & CASH DECK
// ============================================================================
interface StackedWalletsDeckProps {
  accounts: Account[];
  isStacked: boolean;
  onToggleStacked: () => void;
  onViewTransactions: (acc: Account) => void;
  onEdit: (acc: Account) => void;
  onDelete: (acc: Account) => void;
  onConvert: (acc: Account) => void;
  onReconcile: (acc: Account) => void;
}

export const StackedWalletsDeck: React.FC<StackedWalletsDeckProps> = ({
  accounts,
  isStacked,
  onToggleStacked,
  onViewTransactions,
  onEdit,
  onDelete,
  onConvert,
  onReconcile,
}) => {
  // Set of expanded wallet IDs
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(accounts.length > 0 ? [accounts[0].id] : [])
  );

  if (accounts.length === 0) return null;

  const allExpanded = accounts.every(a => expandedIds.has(a.id));
  const someExpanded = accounts.some(a => expandedIds.has(a.id));

  const handleToggleExpandAll = () => {
    if (allExpanded || someExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(accounts.map(a => a.id)));
    }
  };

  const handleToggleWallet = (accId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(accId)) {
        next.delete(accId);
      } else {
        next.add(accId);
      }
      return next;
    });
  };

  if (!isStacked || accounts.length <= 1) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {accounts.map((acc, idx) => (
          <BankVisual
            key={`wallet_grid_${acc.id}_${idx}`}
            account={acc}
            onViewTransactions={() => onViewTransactions(acc)}
            onEdit={() => onEdit(acc)}
            onConvert={() => onConvert(acc)}
            onDelete={() => onDelete(acc)}
            onReconcile={() => onReconcile(acc)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Top Controls: Expand/Collapse All Button */}
      <div className="flex items-center justify-end gap-2 px-1 text-xs">
        {/* Expand All / Collapse All Toggle Button */}
        <button
          onClick={handleToggleExpandAll}
          className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs ml-auto"
        >
          {allExpanded ? (
            <>
              <ChevronUp size={14} />
              <span>Collapse All</span>
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              <span>Expand All ({accounts.length})</span>
            </>
          )}
        </button>
      </div>

      {/* Stacked Wallet & Cash Items */}
      <div className="space-y-2">
        {accounts.map((acc, idx) => {
          const isExpanded = expandedIds.has(acc.id);
          const isCash = acc.type === 'CASH' || acc.name.toLowerCase().includes('cash');
          const brandColor = acc.color || (isCash ? '#16A34A' : '#F59E0B');

          return (
            <div key={`wallet_stack_${acc.id}_${idx}`} className="rounded-2xl transition-all duration-200">
              {isExpanded ? (
                // Full Expanded Wallet Visual
                <div className="space-y-1.5">
                  <div
                    onClick={() => handleToggleWallet(acc.id)}
                    className="flex items-center justify-end px-2 text-[11px] text-amber-600 dark:text-amber-400 font-semibold cursor-pointer select-none hover:underline"
                  >
                    <span className="flex items-center space-x-0.5">
                      <span>Collapse</span>
                      <ChevronUp size={13} />
                    </span>
                  </div>
                  <BankVisual
                    account={acc}
                    showActions={true}
                    onViewTransactions={() => onViewTransactions(acc)}
                    onEdit={() => onEdit(acc)}
                    onConvert={() => onConvert(acc)}
                    onDelete={() => onDelete(acc)}
                    onReconcile={() => onReconcile(acc)}
                  />
                </div>
              ) : (
                // High-Contrast Collapsed Wallet Peek Bar
                <div
                  onClick={() => handleToggleWallet(acc.id)}
                  className="relative overflow-hidden rounded-2xl p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-500/50 transition-all duration-150 cursor-pointer group flex items-center justify-between select-none"
                >
                  {/* Left: Icon + Name + Category */}
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                      style={{ backgroundColor: brandColor }}
                    >
                      {isCash ? <Banknote size={16} /> : <Wallet size={16} />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate max-w-[150px] sm:max-w-[220px]">
                          {acc.name}
                        </h4>
                        {isCash && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                            Cash Drawer
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {acc.institution || (isCash ? 'Physical Cash' : 'Digital Wallet')}
                      </p>
                    </div>
                  </div>

                  {/* Right: Balance + Expand Icon */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                        Available Balance
                      </span>
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {formatINR(acc.calculatedBalance)}
                      </span>
                    </div>

                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors">
                      <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
