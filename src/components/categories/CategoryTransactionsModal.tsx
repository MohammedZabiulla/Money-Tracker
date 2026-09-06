import React, { useState, useMemo, useRef } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Transaction, TransactionType, Category } from '../../types';
import { formatINR, format12HourTime } from '../../lib/currency';
import { Category3DIcon, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import { CategoryManagementModal } from './CategoryManagementModal';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';
import { EditTransactionModal } from '../transactions/EditTransactionModal';
import {
  X,
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Calendar,
  Filter,
  CheckCircle2,
  Tag,
  Clock,
  Sparkles,
  CreditCard,
  Building,
  Wallet,
  Receipt,
  Trash2,
  Edit2,
  Edit3,
  Paperclip,
  Check,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useScrollLock } from '../../hooks/useScrollLock';

interface CategoryTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: {
    categoryId: string;
    categoryName: string;
    icon?: string;
    color?: string;
    totalAmount?: number;
  } | null;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  initialActiveMonth?: string;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenAddTransaction?: (type?: TransactionType, categoryId?: string) => void;
}

export const CategoryTransactionsModal: React.FC<CategoryTransactionsModalProps> = ({
  isOpen,
  onClose,
  category: propCategory,
  categoryId: propCategoryId,
  categoryName: propCategoryName,
  categoryIcon: propCategoryIcon,
  categoryColor: propCategoryColor,
  initialActiveMonth,
  onSelectTransaction,
  onOpenAddTransaction,
}) => {
  useScrollLock(isOpen);

  const { transactions, activeMonth, deleteTransaction, deleteTransactions, accounts, creditCards, categories } = useMoney();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'THIS_MONTH' | 'LAST_30_DAYS' | 'ALL'>('THIS_MONTH');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');

  // Category Edit Modal State
  const [isCategoryEditOpen, setIsCategoryEditOpen] = useState(false);

  // Active Viewing & Editing Transaction States (to keep Category Ledger open underneath)
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Bulk Selection & Delete State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [deleteConfirmTx, setDeleteConfirmTx] = useState<Transaction | null>(null);

  // Long-press / Hold preview state
  const [previewTx, setPreviewTx] = useState<Transaction | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasLongPressRef = useRef(false);

  // Consolidate Category Prop with Context lookup
  const resolvedCategory = useMemo(() => {
    const passedId = propCategory?.categoryId || propCategoryId || '';
    const passedName = propCategory?.categoryName || propCategoryName || '';

    // Match with real context category
    const foundInContext = categories.find(c => {
      if (passedId && c.id === passedId) return true;
      if (passedName && c.name.toLowerCase().trim() === passedName.toLowerCase().trim()) return true;
      return false;
    });

    if (foundInContext) return foundInContext;

    if (passedId || passedName) {
      return {
        id: passedId || `custom-${Date.now()}`,
        name: passedName || 'Category',
        type: 'EXPENSE' as const,
        icon: propCategory?.icon || propCategoryIcon || 'Tag',
        color: propCategory?.color || propCategoryColor || '#6366f1',
        subcategories: [],
        isCustom: true,
      };
    }
    return null;
  }, [propCategory, propCategoryId, propCategoryName, propCategoryIcon, propCategoryColor, categories]);

  const clearHoldTimer = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  };

  const handlePointerDown = (t: Transaction, e: React.PointerEvent) => {
    if (isSelectionMode) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    clearHoldTimer();
    wasLongPressRef.current = false;

    holdTimeoutRef.current = setTimeout(() => {
      wasLongPressRef.current = true;
      setPreviewTx(t);
    }, 350);
  };

  const handlePointerUpOrLeave = () => {
    clearHoldTimer();
    setPreviewTx(null);
  };

  const handleDeleteSingle = (tx: Transaction, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    deleteTransaction(tx.id);
    setDeleteConfirmTx(null);
  };

  if (!isOpen || !resolvedCategory) return null;

  const currentMonth = initialActiveMonth || activeMonth;

  // Filter transactions for this category with robust matching
  const filteredTransactions = useMemo(() => {
    const targetId = (resolvedCategory.id || '').toLowerCase().trim();
    const targetName = (resolvedCategory.name || '').toLowerCase().trim();
    const targetCleanId = targetId.replace(/[^a-z0-9]/g, '');
    const targetCleanName = targetName.replace(/[^a-z0-9]/g, '');

    return transactions
      .filter(t => {
        if (t.isDeleted) return false;

        const txCatId = (t.categoryId || '').toLowerCase().trim();
        const txCatName = (t.categoryName || '').toLowerCase().trim();
        const txCleanCatId = txCatId.replace(/[^a-z0-9]/g, '');
        const txCleanCatName = txCatName.replace(/[^a-z0-9]/g, '');
        const txSubcat = (t.subcategory || '').toLowerCase().trim();

        // Match category ID or category name or slug match
        const matchesCategory =
          (targetId && txCatId === targetId) ||
          (targetName && txCatName === targetName) ||
          (targetCleanId && txCleanCatId && txCleanCatId === targetCleanId) ||
          (targetCleanName && txCleanCatName && txCleanCatName === targetCleanName) ||
          (targetCleanId && txCleanCatName && (txCleanCatName.includes(targetCleanId) || targetCleanId.includes(txCleanCatName))) ||
          (targetName && txSubcat && (txSubcat.includes(targetName) || targetName.includes(txSubcat)));

        if (!matchesCategory) return false;

        // Type filter
        if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;

        // Time filter
        if (timeFilter === 'THIS_MONTH') {
          if (currentMonth && currentMonth !== 'ALL' && !t.date.startsWith(currentMonth)) return false;
        } else if (timeFilter === 'LAST_30_DAYS') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const txDate = new Date(t.date);
          if (txDate < thirtyDaysAgo) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesMerchant = t.merchantName?.toLowerCase().includes(q);
          const matchesNotes = t.notes?.toLowerCase().includes(q);
          const matchesSubcat = t.subcategory?.toLowerCase().includes(q);
          const matchesTags = t.tags?.some(tag => tag.toLowerCase().includes(q));
          const matchesAmount = t.amount.toString().includes(q);
          const matchesAccount = t.accountName?.toLowerCase().includes(q) || t.creditCardName?.toLowerCase().includes(q);
          if (!matchesMerchant && !matchesNotes && !matchesSubcat && !matchesTags && !matchesAmount && !matchesAccount) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Primary: sort by date descending (newest first)
        const dateCompare = (b.date || '').localeCompare(a.date || '');
        if (dateCompare !== 0) return dateCompare;

        // Secondary: sort by time descending (newest first)
        const timeA = a.time || '00:00:00';
        const timeB = b.time || '00:00:00';
        const timeCompare = timeB.localeCompare(timeA);
        if (timeCompare !== 0) return timeCompare;

        // Tertiary: sort by timestamp / createdAt descending (newest first)
        const tsA = a.timestamp || a.createdAt || 0;
        const tsB = b.timestamp || b.createdAt || 0;
        if (tsB !== tsA) return tsB - tsA;

        return (b.id || '').localeCompare(a.id || '');
      });
  }, [transactions, resolvedCategory, timeFilter, typeFilter, searchQuery, currentMonth]);

  // Aggregate metrics
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 w-full max-w-xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header with Category Color Gradient & Actions */}
          <div
            className="p-5 text-white relative overflow-hidden shrink-0"
            style={{
              background: `linear-gradient(135deg, ${resolvedCategory.color || '#6366f1'}ee, #0f172a)`,
            }}
          >
            {/* Background decorative glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/15 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/25">
                  <Category3DIcon
                    name={resolvedCategory.icon || 'Tag'}
                    categoryName={resolvedCategory.name}
                    color={resolvedCategory.color || '#ffffff'}
                    size="md"
                    glow={true}
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white/90 border border-white/20">
                      Category Ledger
                    </span>
                    {resolvedCategory.subcategories && resolvedCategory.subcategories.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white/80 border border-white/10 hidden sm:inline-block">
                        {resolvedCategory.subcategories.length} subcategories
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight mt-0.5 flex items-center space-x-2">
                    <span>{resolvedCategory.name}</span>
                  </h3>
                </div>
              </div>

              {/* Header Right Actions: Edit Category & Close Modal */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryEditOpen(true)}
                  title="Edit category details (Name, Icon, Color, Subcategories)"
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center space-x-1.5 transition-all border border-white/25 shadow-xs cursor-pointer active:scale-95"
                >
                  <Edit3 size={14} />
                  <span className="hidden sm:inline">Edit Category</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors border border-white/15 cursor-pointer active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/15 relative z-10">
              <div>
                <span className="text-[10px] text-white/80 uppercase font-semibold block">
                  {timeFilter === 'THIS_MONTH'
                    ? currentMonth === 'ALL'
                      ? 'Total Period Spent'
                      : `Spent in ${currentMonth}`
                    : timeFilter === 'LAST_30_DAYS'
                    ? 'Last 30 Days'
                    : 'Total Spent'}
                </span>
                <span className="text-2xl font-black text-white tracking-tight drop-shadow-xs">
                  {formatINR(totalAmount)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/80 uppercase font-semibold block">Transactions</span>
                <span className="text-lg font-extrabold text-white/90">
                  {filteredTransactions.length} {filteredTransactions.length === 1 ? 'record' : 'records'}
                </span>
              </div>
            </div>
          </div>

          {/* Filter & Action Controls Bar */}
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder={`Search in ${resolvedCategory.name} transactions, notes, merchants...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Time Filter Tabs, Multi-Select Toggle & Quick Add */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-1.5">
                {/* Time Filter Pills */}
                <div className="flex bg-slate-200/70 dark:bg-slate-750 p-0.5 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setTimeFilter('THIS_MONTH')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      timeFilter === 'THIS_MONTH'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {currentMonth === 'ALL' ? 'Selected Period' : currentMonth}
                  </button>
                  <button
                    onClick={() => setTimeFilter('LAST_30_DAYS')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      timeFilter === 'LAST_30_DAYS'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    30 Days
                  </button>
                  <button
                    onClick={() => setTimeFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      timeFilter === 'ALL'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    All Time
                  </button>
                </div>

                {/* Bulk Select Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectionMode(prev => !prev);
                    if (isSelectionMode) setSelectedTxIds(new Set());
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1 ${
                    isSelectionMode
                      ? 'bg-purple-100 dark:bg-purple-900/60 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  <span>{isSelectionMode ? 'Cancel' : 'Select'}</span>
                </button>
              </div>

              {/* Quick Add in Category */}
              {onOpenAddTransaction && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAddTransaction('EXPENSE', resolvedCategory.id);
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus size={14} />
                  <span>Add in {resolvedCategory.name}</span>
                </button>
              )}
            </div>

            {/* Selection Action Bar */}
            {isSelectionMode && (
              <div className="bg-purple-50 dark:bg-purple-950/40 rounded-2xl p-2.5 px-3 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between gap-2 animate-in slide-in-from-top-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-100">
                    {selectedTxIds.size} Selected
                  </span>
                  <button
                    onClick={() => {
                      const allVisibleIds = filteredTransactions.map(t => t.id);
                      if (selectedTxIds.size === allVisibleIds.length && allVisibleIds.length > 0) {
                        setSelectedTxIds(new Set());
                      } else {
                        setSelectedTxIds(new Set(allVisibleIds));
                      }
                    }}
                    className="text-[11px] text-purple-700 dark:text-purple-400 font-bold hover:underline"
                  >
                    {selectedTxIds.size === filteredTransactions.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <button
                  disabled={selectedTxIds.size === 0}
                  onClick={() => {
                    deleteTransactions(Array.from(selectedTxIds));
                    setSelectedTxIds(new Set());
                    setIsSelectionMode(false);
                  }}
                  className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete Selected</span>
                </button>
              </div>
            )}
          </div>

          {/* Transactions Feed with Interactive Hold, Edit & Trash Actions */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <Receipt size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No transactions found
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    {searchQuery
                      ? `No entries match "${searchQuery}" in ${resolvedCategory.name}`
                      : `No spending logged for ${resolvedCategory.name} during this time period.`}
                  </p>
                </div>
                {onOpenAddTransaction && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAddTransaction('EXPENSE', resolvedCategory.id);
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <Plus size={14} />
                    <span>Log First Spend in {resolvedCategory.name}</span>
                  </button>
                )}
              </div>
            ) : (
              filteredTransactions.map((tx, idx) => {
                const isIncome = tx.type === 'INCOME' || tx.type === 'MONEY_LENT_REPAYMENT';
                const isTransfer = tx.type === 'TRANSFER' || tx.type === 'CARD_PAYMENT';
                const isCard = !!tx.creditCardId;
                const sourceAccount = accounts.find(a => a.id === tx.accountId);
                const sourceCard = creditCards.find(c => c.id === tx.creditCardId);
                const channelName = tx.creditCardName || tx.accountName || sourceCard?.name || sourceAccount?.name || 'Account';
                const isSelected = selectedTxIds.has(tx.id);

                return (
                  <div
                    key={`cattx_item_${tx.id}_${idx}`}
                    onPointerDown={e => handlePointerDown(tx, e)}
                    onPointerUp={handlePointerUpOrLeave}
                    onPointerLeave={handlePointerUpOrLeave}
                    onPointerCancel={handlePointerUpOrLeave}
                    onContextMenu={e => {
                      if (wasLongPressRef.current || isSelectionMode) {
                        e.preventDefault();
                      }
                    }}
                    onClick={e => {
                      if (wasLongPressRef.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                      if (isSelectionMode) {
                        const newSet = new Set(selectedTxIds);
                        if (newSet.has(tx.id)) newSet.delete(tx.id);
                        else newSet.add(tx.id);
                        setSelectedTxIds(newSet);
                      } else {
                        setViewingTransaction(tx);
                      }
                    }}
                    className={`p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 space-y-2 cursor-pointer transition-colors shadow-2xs group select-none relative ${
                      isSelectionMode && isSelected ? 'bg-purple-50/70 dark:bg-purple-950/30 ring-2 ring-purple-500' : ''
                    }`}
                  >
                    {/* Top Row: Left (Selection Checkbox + Icon + Merchant + Type Badge) & Right (Amount + Time) */}
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {isSelectionMode && (
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-transparent text-transparent'
                            }`}
                          >
                            <Check size={12} className={isSelected ? 'block' : 'hidden'} />
                          </div>
                        )}

                        <div className="relative shrink-0">
                          <Category3DIcon
                            name={resolvedCategory.icon || (isIncome ? 'ArrowDownLeft' : isTransfer ? 'ArrowRightLeft' : 'Receipt')}
                            categoryName={tx.categoryName || resolvedCategory.name}
                            color={resolvedCategory.color || (isIncome ? '#10b981' : '#f43f5e')}
                            size="sm"
                            glow={true}
                            interactive={true}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                            <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {tx.merchantName || tx.notes || resolvedCategory.name}
                            </p>
                            <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              isIncome ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                              isTransfer ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' :
                              tx.type === 'CARD_PAYMENT' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' :
                              'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                            }`}>
                              {tx.type === 'CARD_PAYMENT' ? 'Card Bill' : tx.type === 'MONEY_BORROWED' ? 'Borrowed' : tx.type === 'MONEY_LENT' ? 'Lent' : isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}
                            </span>
                            {tx.receiptUrl && (
                              <Paperclip size={11} className="text-slate-400 shrink-0" title="Has receipt photo" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount & Time */}
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-black block tracking-tight ${
                            isIncome ? 'text-emerald-600 dark:text-emerald-400' : isTransfer ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isIncome ? `+${formatINR(tx.amount)}` : isTransfer ? formatINR(tx.amount) : `-${formatINR(tx.amount)}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {format12HourTime(tx.time, tx.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Detail Badges & Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100/80 dark:border-slate-800 text-[11px]">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0 text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {tx.splits && tx.splits.length > 0 ? `Split (${tx.splits.length})` : (tx.categoryName || tx.type)}
                        </span>

                        {tx.splits && tx.splits.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold">
                            ✂️ Split
                          </span>
                        )}

                        {tx.originalCurrency && tx.originalCurrency !== 'INR' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-semibold">
                            {tx.originalAmount} {tx.originalCurrency}
                          </span>
                        )}

                        {tx.subcategory && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {tx.subcategory}
                          </span>
                        )}

                        {/* Mini 3D Payment Channel Badge */}
                        {tx.paymentApp && (
                          <div className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                            <PaymentApp3DIcon name={tx.paymentApp} size="xs" glow={false} />
                            <span>{tx.paymentApp}</span>
                          </div>
                        )}

                        {/* Mini 3D Bank / Card Badge */}
                        {(tx.accountId || tx.creditCardId || tx.toAccountId || tx.accountName || tx.creditCardName) && (() => {
                          const acc = accounts.find(a => a.id === tx.accountId);
                          const card = creditCards.find(c => c.id === tx.creditCardId);
                          const accentColor = card ? card.color || '#9333ea' : acc ? acc.color || '#10b981' : '#64748b';
                          
                          let channelName = tx.creditCardName || card?.name || tx.accountName || acc?.name || 'Account';
                          if (tx.type === 'TRANSFER' || tx.type === 'CARD_PAYMENT') {
                            let fromName = 'External';
                            let toName = 'External';
                            if (tx.type === 'CARD_PAYMENT') {
                              fromName = tx.accountName || acc?.name || 'External';
                              toName = tx.creditCardName || card?.name || 'External';
                            } else {
                              fromName = tx.accountName || acc?.name || 'External';
                              toName = tx.toAccountName || 'External';
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
                        {(tx.tags || []).slice(0, 2).map((tag, tIdx) => (
                          <span
                            key={`cattx_tag_${tag}_${tIdx}`}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Interactive Action Buttons */}
                      {!isSelectionMode && (
                        <div className="flex items-center space-x-1 shrink-0 ml-auto">
                          <button
                            type="button"
                            title="Edit transaction"
                            onClick={e => {
                              e.stopPropagation();
                              setEditingTransaction(tx);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            type="button"
                            title="Delete transaction"
                            onClick={e => {
                              e.stopPropagation();
                              setDeleteConfirmTx(tx);
                            }}
                            className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Notes inside the transaction card */}
                    {tx.notes && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-amber-900 dark:text-amber-200/90 italic px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 max-w-full overflow-hidden">
                        <span className="text-amber-500 font-bold shrink-0 text-xs">📝</span>
                        <span className="truncate">{tx.notes}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Category Details Management / Edit Modal */}
      {isCategoryEditOpen && (
        <CategoryManagementModal
          isOpen={isCategoryEditOpen}
          onClose={() => setIsCategoryEditOpen(false)}
          initialCategoryToEdit={resolvedCategory}
          initialType={resolvedCategory.type === 'INCOME' ? 'INCOME' : 'EXPENSE'}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmTx && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 max-w-sm w-full rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Transaction?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">{deleteConfirmTx.merchantName || deleteConfirmTx.notes || 'this entry'}</span> ({formatINR(deleteConfirmTx.amount)})?
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTx(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSingle(deleteConfirmTx)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Hold Peek Preview Popover */}
      {previewTx && (() => {
        const isIncome = previewTx.type === 'INCOME' || previewTx.type === 'MONEY_LENT_REPAYMENT';
        const isTransfer = previewTx.type === 'TRANSFER' || previewTx.type === 'CARD_PAYMENT';
        const sourceAccount = accounts.find(a => a.id === previewTx.accountId);
        const sourceCard = creditCards.find(c => c.id === previewTx.creditCardId);
        const toAccount = accounts.find(a => a.id === previewTx.toAccountId);
        const channelName = previewTx.creditCardName || previewTx.accountName || sourceCard?.name || sourceAccount?.name;

        return (
          <div className="fixed inset-0 z-60 pointer-events-none flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-100">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden pointer-events-auto transform scale-100 animate-in zoom-in-95 duration-100">
              
              {/* Peek Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Category3DIcon
                      name={resolvedCategory.icon || 'Tag'}
                      categoryName={previewTx.categoryName || resolvedCategory.name}
                      color={resolvedCategory.color || '#10b981'}
                      size="sm"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white truncate max-w-[180px]">
                      {previewTx.merchantName || previewTx.notes || resolvedCategory.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {previewTx.date} • {previewTx.time ? format12HourTime(previewTx.time) : ''}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-base font-black ${
                      isIncome ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isIncome ? `+${formatINR(previewTx.amount)}` : `-${formatINR(previewTx.amount)}`}
                  </span>
                </div>
              </div>

              {/* Peek Body Details */}
              <div className="p-4 space-y-3 text-xs">
                {/* Account / Card */}
                {channelName && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Account / Card</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{channelName}</span>
                  </div>
                )}

                {/* Subcategory */}
                {previewTx.subcategory && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Subcategory</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{previewTx.subcategory}</span>
                  </div>
                )}

                {/* Notes */}
                {previewTx.notes && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-slate-700 dark:text-slate-300 italic">
                    "{previewTx.notes}"
                  </div>
                )}

                {/* Bill Splits */}
                {previewTx.splits && previewTx.splits.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-950/20 p-2.5 rounded-xl border border-purple-200/50 space-y-1">
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
                      Splits ({previewTx.splits.length})
                    </span>
                    {previewTx.splits.map((s, idx) => (
                      <div key={`${s.notes || 'split'}-${idx}`} className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
                        <span>{s.notes || `Split ${idx + 1}`}</span>
                        <span className="font-bold">{formatINR(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tags */}
                {previewTx.tags && previewTx.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {previewTx.tags.map((tag, tIdx) => (
                      <span
                        key={`${tag}-${tIdx}`}
                        className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Peek Footer */}
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-semibold">{previewTx.type}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                  Release pointer to close
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Transaction Details Modal (Nested so Category Ledger remains open underneath) */}
      {viewingTransaction && (
        <TransactionDetailModal
          transaction={viewingTransaction}
          onClose={() => setViewingTransaction(null)}
          onEdit={tx => {
            setViewingTransaction(null);
            setEditingTransaction(tx);
          }}
        />
      )}

      {/* Edit Transaction Modal (Nested so Category Ledger remains open underneath) */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          isOpen={Boolean(editingTransaction)}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </>
  );
};
