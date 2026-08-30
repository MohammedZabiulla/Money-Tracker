import React, { useState, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Account, CreditCard, Transaction, TransactionType } from '../../types';
import { formatINR, format12HourTime } from '../../lib/currency';
import { IconHelper, Category3DIcon, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import { CardChipBadge, NetworkLogo } from '../common/CardVisual';
import { INDIAN_BANKS } from '../../lib/constants';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import {
  X,
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Calendar,
  Building,
  CreditCard as CreditCardIcon,
  Wallet,
  ExternalLink,
  Filter,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Receipt,
  FileText,
  Tag,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Paperclip,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';


function isTransactionInflow(t: Transaction, targetId: string) {
  // Transfer to this account
  if (t.toAccountId === targetId) return true;
  // Card payment to this card
  if (t.type === 'CARD_PAYMENT' && t.creditCardId === targetId) return true;
  
  // If it's sourced from this account/card, it's an inflow only if it's an income type (like a refund)
  if (t.accountId === targetId || t.creditCardId === targetId) {
    if (t.type === 'INCOME' || t.type === 'INVESTMENT_WITHDRAWAL' || t.type === 'MONEY_LENT_REPAYMENT' || t.type === 'MONEY_BORROWED' || t.type === 'REFUND') {
      return true;
    }
  }
  return false;
}


interface AccountTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account | null;
  card?: CreditCard | null;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenAddTransaction?: (type?: TransactionType, accountId?: string) => void;
  onNavigateToFullFeed?: (accountId: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
}

export const AccountTransactionsModal: React.FC<AccountTransactionsModalProps> = ({
  isOpen,
  onClose,
  account,
  card,
  onSelectTransaction,
  onOpenAddTransaction,
  onNavigateToFullFeed,
  onEditTransaction,
}) => {
  const { transactions, categories, activeMonth, deleteTransaction, accounts, creditCards } = useMoney();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER'>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30_DAYS'>('THIS_MONTH');
  const [deleteConfirmTx, setDeleteConfirmTx] = useState<Transaction | null>(null);

  const targetId = account ? account.id : card ? card.id : '';
  const isCard = !!card;
  const isWalletOrCash = account?.type === 'WALLET' || account?.type === 'CASH';

  // Bank or Card metadata
  const bankConfig = useMemo(() => {
    if (account) {
      return INDIAN_BANKS.find(
        b => b.name.toLowerCase() === account.institution.toLowerCase() || b.id === account.institution.toLowerCase()
      );
    }
    if (card) {
      return INDIAN_BANKS.find(b => b.name === card.issuer);
    }
    return null;
  }, [account, card]);

  const brandColor = account?.color || card?.color || bankConfig?.color || (isCard ? '#9333ea' : '#004c8f');

  // Filter transactions for this specific account / card
  const accountTransactions = useMemo(() => {
    if (!targetId) return [];

    return transactions.filter(t => {
      if (t.isDeleted) return false;

      // Must be related to this account or card
      const matchesId =
        t.accountId === targetId ||
        t.toAccountId === targetId ||
        t.creditCardId === targetId ||
        t.toCreditCardId === targetId;

      const matchesName =
        (account && (
          t.accountName?.toLowerCase() === account.name.toLowerCase() ||
          t.toAccountName?.toLowerCase() === account.name.toLowerCase()
        )) ||
        (card && (
          t.creditCardName?.toLowerCase() === card.name.toLowerCase()
        ));

      const matchesAccount = matchesId || Boolean(matchesName);

      if (!matchesAccount) return false;

      // Time Range Filter
      if (timeFilter === 'THIS_MONTH') {
        if (!t.date.startsWith(activeMonth)) return false;
      } else if (timeFilter === 'LAST_30_DAYS') {
        const txDate = new Date(t.date).getTime();
        const thirtyDaysAgo = Date.now() - 30 * 86400000;
        if (txDate < thirtyDaysAgo) return false;
      }

      // Type Filter
      if (typeFilter === 'EXPENSE') {
        if (t.type !== 'EXPENSE' && t.type !== 'INVESTMENT_CONTRIBUTION' && t.type !== 'LOAN_REPAYMENT' && t.type !== 'MONEY_LENT') {
          return false;
        }
      } else if (typeFilter === 'INCOME') {
        if (t.type !== 'INCOME' && t.type !== 'INVESTMENT_WITHDRAWAL' && t.type !== 'MONEY_LENT_REPAYMENT' && t.type !== 'MONEY_BORROWED') {
          return false;
        }
      } else if (typeFilter === 'TRANSFER') {
        if (t.type !== 'TRANSFER' && t.type !== 'CARD_PAYMENT') {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMerchant = t.merchantName?.toLowerCase().includes(q);
        const matchesCategory = t.categoryName?.toLowerCase().includes(q);
        const matchesSubcategory = t.subcategory?.toLowerCase().includes(q);
        const matchesNotes = t.notes?.toLowerCase().includes(q);
        const matchesAmount = t.amount.toString().includes(q);
        const matchesTag = (t.tags || []).some(tag => tag.toLowerCase().includes(q));

        if (!matchesMerchant && !matchesCategory && !matchesSubcategory && !matchesNotes && !matchesAmount && !matchesTag) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Primary: sort by date descending (newest first)
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;

      // Secondary: sort by time descending (newest first)
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      const timeCompare = timeB.localeCompare(timeA);
      if (timeCompare !== 0) return timeCompare;

      // Tertiary: sort by timestamp descending (newest first)
      const tsA = a.timestamp || 0;
      const tsB = b.timestamp || 0;
      return tsB - tsA;
    });
  }, [transactions, targetId, timeFilter, typeFilter, searchQuery, activeMonth]);

  // Aggregate statistics for this account's transactions
  const stats = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;
    let totalTransfers = 0;

    accountTransactions.forEach(t => {
      if (t.type === 'TRANSFER' || t.type === 'CARD_PAYMENT') {
        totalTransfers += t.amount;
      }
      
      if (isTransactionInflow(t, targetId)) {
        totalInflow += t.amount;
      } else {
        totalOutflow += t.amount;
      }
    });

    return {
      count: accountTransactions.length,
      totalInflow,
      totalOutflow,
      totalTransfers,
      netFlow: totalInflow - totalOutflow,
    };
  }, [accountTransactions, targetId]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    accountTransactions.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return groups;
  }, [accountTransactions]);

  const dates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (!isOpen || (!account && !card)) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl h-[92vh] sm:h-auto sm:max-h-[88vh] my-auto flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Header Banner with Account Branding */}
          <div
            className="p-5 text-white relative overflow-hidden shrink-0"
            style={{
              background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 60%, #0f172a 100%)`,
            }}
          >
            {/* Background Watermark */}
            <div className="absolute right-3 -bottom-4 text-6xl font-black text-white/10 select-none pointer-events-none uppercase tracking-tighter">
              {bankConfig?.logoText || (isCard ? card?.network : account?.institution?.substring(0, 8))}
            </div>

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center space-x-3">
                {account && (
                  <Bank3DIcon
                    institution={account.institution}
                    type={account.type}
                    color={brandColor}
                    size="md"
                    glow={true}
                    interactive={false}
                  />
                )}
                {card && (
                  <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-md">
                    <CreditCardIcon size={22} />
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-base sm:text-lg text-white leading-tight">
                      {account ? account.name : card?.name}
                    </h3>
                    {isCard && card?.network && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                        {card.network}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/80 mt-0.5 flex items-center space-x-1.5 font-medium">
                    <span>{account ? account.institution : card?.issuer}</span>
                    <span>•</span>
                    <span>
                      {account
                        ? account.accountNumberLast4
                          ? `A/C ••${account.accountNumberLast4}`
                          : account.type.replace('_', ' ')
                        : `Card ••${card?.lastFourDigits}`}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Balance / Outstanding Highlight */}
            <div className="mt-4 pt-3 border-t border-white/15 relative z-10 flex items-end justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">
                  {isCard
                    ? 'Current Outstanding Due'
                    : isWalletOrCash
                    ? 'Available Cash / Balance'
                    : 'Available Account Balance'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {formatINR(account ? account.calculatedBalance : card?.currentOutstanding || 0)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-white/70 block font-medium">
                  {stats.count} {stats.count === 1 ? 'Transaction' : 'Transactions'}
                </span>
                {onNavigateToFullFeed && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToFullFeed(targetId);
                    }}
                    className="text-xs font-bold text-white hover:underline flex items-center space-x-1 mt-0.5 bg-white/20 px-2.5 py-1 rounded-xl backdrop-blur-xs transition-all active:scale-95"
                  >
                    <span>Full Feed</span>
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar: Total Inflow vs Outflow */}
          <div className="bg-slate-50 dark:bg-slate-850/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2 shrink-0">
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowDownLeft size={15} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Total Inflow</span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 truncate block">
                  +{formatINR(stats.totalInflow)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ArrowUpRight size={15} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Total Outflow</span>
                <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 truncate block">
                  -{formatINR(stats.totalOutflow)}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Receipt size={15} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Transactions</span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate block">
                  {stats.count} records
                </span>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={15} />
              <input
                type="text"
                placeholder="Search transactions by merchant, category, notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              <div className="flex items-center space-x-1 shrink-0">
                {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setTypeFilter(tab)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      typeFilter === tab
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab === 'ALL' ? 'All Types' : tab === 'EXPENSE' ? 'Debits' : tab === 'INCOME' ? 'Credits' : 'Transfers'}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                {(['ALL', 'THIS_MONTH', 'LAST_30_DAYS'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeFilter(t)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                      timeFilter === t
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    {t === 'ALL' ? 'All Time' : t === 'THIS_MONTH' ? 'This Month' : '30 Days'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transactions List Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[220px]">
            {accountTransactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <Receipt className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No transactions found for this {isCard ? 'card' : 'account'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery || typeFilter !== 'ALL' || timeFilter !== 'ALL'
                      ? 'Try clearing your search or filter options'
                      : 'Start logging spends and deposits using this account'}
                  </p>
                </div>
                {onOpenAddTransaction && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAddTransaction('EXPENSE', targetId);
                    }}
                    className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md inline-flex items-center space-x-1.5 transition-all"
                  >
                    <Plus size={14} />
                    <span>Log First Transaction</span>
                  </button>
                )}
              </div>
            ) : (
              dates.map((dateStr, dIdx) => {
                const dayTxs = [...(groupedByDate[dateStr] || [])].sort((a, b) => {
                  const dateA = a.date || '';
                  const dateB = b.date || '';
                  const dateCompare = dateA.localeCompare(dateB);
                  if (dateCompare !== 0) return dateCompare;

                  const timeA = a.time || '00:00';
                  const timeB = b.time || '00:00';
                  const timeCompare = timeB.localeCompare(timeA);
                  if (timeCompare !== 0) return timeCompare;

                  const tsA = a.timestamp || 0;
                  const tsB = b.timestamp || 0;
                  if (tsA && tsB && tsA !== tsB) return tsB - tsA;

                  return 0;
                });
                const dayTotal = dayTxs.reduce((sum, tx) => {
                  if (isTransactionInflow(tx, targetId)) {
                    return sum + tx.amount;
                  }
                  return sum - tx.amount;
                }, 0);

                return (
                  <div key={`acctx_date_${dateStr}_${dIdx}`} className="space-y-1.5">
                    {/* Date Section Header */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
                      <span>{dateStr}</span>
                      <span className={dayTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>
                        {dayTotal >= 0 ? `+${formatINR(dayTotal)}` : formatINR(dayTotal)}
                      </span>
                    </div>

                    {/* Day Transaction Cards */}
                    <div className="space-y-1.5">
                      {dayTxs.map((t, idx) => {
                        const isIncome = isTransactionInflow(t, targetId);

                        const isTransfer = t.type === 'TRANSFER' || t.type === 'CARD_PAYMENT';
                        const cat = categories.find(c => c.id === t.categoryId);

                        return (
                          <div
                            key={`acctx_item_${t.id}_${idx}`}
                            onClick={() => {
                              onSelectTransaction(t);
                            }}
                            className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 space-y-2 cursor-pointer transition-colors shadow-2xs group"
                          >
                            {/* Top Row: Left (Icon + Merchant + Type Badge) & Right (Amount + Time) */}
                            <div className="flex items-center justify-between gap-2 min-w-0">
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className="relative shrink-0">
                                  <Category3DIcon
                                    name={cat?.icon || (isIncome ? 'ArrowDownLeft' : isTransfer ? 'ArrowRightLeft' : 'Receipt')}
                                    categoryName={t.categoryName || cat?.name || 'General'}
                                    color={cat?.color || (isIncome ? '#10b981' : isTransfer ? '#3b82f6' : '#f43f5e')}
                                    size="sm"
                                    glow={true}
                                    interactive={true}
                                  />
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                      {t.merchantName || t.notes || t.categoryName || 'Transaction'}
                                    </p>
                                    <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                      isIncome ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                                      isTransfer ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' :
                                      t.type === 'CARD_PAYMENT' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' :
                                      'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                                    }`}>
                                      {t.type === 'CARD_PAYMENT' ? 'Card Bill' : t.type === 'MONEY_BORROWED' ? 'Borrowed' : t.type === 'MONEY_LENT' ? 'Lent' : isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}
                                    </span>
                                    {t.receiptUrl && (
                                      <Paperclip size={11} className="text-slate-400 shrink-0" title="Has receipt photo" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Amount & Time */}
                              <div className="text-right shrink-0">
                                <span
                                  className={`text-xs sm:text-sm font-black block tracking-tight ${
                                    isIncome ? 'text-emerald-600 dark:text-emerald-400' : isTransfer ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'
                                  }`}
                                >
                                  {isIncome ? `+${formatINR(t.amount)}` : isTransfer ? formatINR(t.amount) : `-${formatINR(t.amount)}`}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium block">
                                  {format12HourTime(t.time, t.timestamp)}
                                </span>
                              </div>
                            </div>

                            {/* Bottom Row: Detail Badges & Action Buttons */}
                            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100/80 dark:border-slate-800 text-[11px]">
                              <div className="flex flex-wrap items-center gap-1.5 min-w-0 text-slate-500 dark:text-slate-400">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {t.splits && t.splits.length > 0 ? `Split (${t.splits.length})` : (t.categoryName || t.type)}
                                </span>

                                {t.splits && t.splits.length > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold">
                                    ✂️ Split
                                  </span>
                                )}

                                {t.originalCurrency && t.originalCurrency !== 'INR' && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-semibold">
                                    {t.originalAmount} {t.originalCurrency}
                                  </span>
                                )}

                                {t.subcategory && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                    {t.subcategory}
                                  </span>
                                )}

                                {/* Mini 3D Payment Channel Badge */}
                                {t.paymentAppName && (
                                  <div className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                                    <PaymentApp3DIcon name={t.paymentAppName} size="xs" glow={false} />
                                    <span>{t.paymentAppName}</span>
                                  </div>
                                )}

                                {/* Mini 3D Bank / Card Badge */}
                                {(t.accountId || t.creditCardId || t.toAccountId || t.accountName || t.creditCardName) && (() => {
                                  const acc = accounts.find(a => a.id === t.accountId);
                                  const card = creditCards.find(c => c.id === t.creditCardId);
                                  const accentColor = card ? card.color || '#9333ea' : acc ? acc.color || '#10b981' : '#64748b';
                                  
                                  let channelName = t.creditCardName || card?.name || t.accountName || acc?.name || 'Account';
                                  if (t.type === 'TRANSFER' || t.type === 'CARD_PAYMENT') {
                                    let fromName = 'External';
                                    let toName = 'External';
                                    if (t.type === 'CARD_PAYMENT') {
                                      fromName = t.accountName || acc?.name || 'External';
                                      toName = t.creditCardName || card?.name || 'External';
                                    } else {
                                      fromName = t.accountName || acc?.name || 'External';
                                      toName = t.toAccountName || 'External';
                                    }
                                    if (fromName !== 'External' && toName !== 'External') {
                                      channelName = `${fromName} ➔ ${toName}`;
                                    } else if (fromName !== 'External') {
                                      channelName = `${fromName} ➔ External`;
                                    } else if (toName !== 'External') {
                                      channelName = `External ➔ ${toName}`;
                                    }
                                  }

                                  return (
                                    <div
                                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold"
                                      style={{ color: accentColor }}
                                    >
                                      <Bank3DIcon
                                        institution={card ? card.issuer : acc?.institution}
                                        type={card ? 'CREDIT_CARD' : acc?.type}
                                        color={accentColor}
                                        size="xs"
                                        glow={false}
                                      />
                                      <span>{channelName}</span>
                                    </div>
                                  );
                                })()}

                                {/* Tags */}
                                {(t.tags || []).slice(0, 2).map((tag, tIdx) => (
                                  <span
                                    key={`acctx_tag_${tag}_${tIdx}`}
                                    className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>

                              {/* Edit & Delete Action Buttons */}
                              <div className="flex items-center space-x-1 shrink-0 ml-auto">
                                {onEditTransaction && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClose();
                                      onEditTransaction(t);
                                    }}
                                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                    title="Edit transaction"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmTx(t);
                                  }}
                                  className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Move to Trash"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* In-Card Notes */}
                            {t.notes && (
                              <div className="flex items-center space-x-1.5 text-[11px] text-amber-900 dark:text-amber-200/90 italic px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 max-w-full overflow-hidden">
                                <span className="text-amber-500 font-bold shrink-0 text-xs">📝</span>
                                <span className="truncate">{t.notes}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-all"
            >
              Close
            </button>

            {onOpenAddTransaction && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAddTransaction('EXPENSE', targetId);
                }}
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={14} />
                <span>{isWalletOrCash ? '+ Add Cash' : '+ Add Transaction'}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteConfirmTx)}
        onClose={() => setDeleteConfirmTx(null)}
        onConfirm={() => {
          if (deleteConfirmTx) {
            deleteTransaction(deleteConfirmTx.id, true);
            setDeleteConfirmTx(null);
          }
        }}
        title="Delete Transaction?"
        description="Are you sure you want to move this transaction to the Trash Bin? You can restore it anytime from More → Trash Bin."
        itemDetails={
          deleteConfirmTx
            ? {
                title: deleteConfirmTx.merchantName || deleteConfirmTx.categoryName || deleteConfirmTx.notes || 'Transaction',
                amount: `${isTransactionInflow(deleteConfirmTx, targetId) ? '+' : '-'}${formatINR(deleteConfirmTx.amount)}`,
                subtitle: `${deleteConfirmTx.date} • ${deleteConfirmTx.type.replace(/_/g, ' ')}`,
                badge: deleteConfirmTx.categoryName || 'General',
              }
            : undefined
        }
        confirmLabel="Move to Trash"
      />
    </AnimatePresence>
  );
};
