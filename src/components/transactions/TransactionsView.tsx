import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Transaction } from '../../types';
import { formatINR, format12HourTime } from '../../lib/currency';
import { Category3DIcon, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import {
  Search,
  Calendar as CalendarIcon,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  CalendarDays,
  List,
  Sparkles,
  Paperclip,
  CheckCircle2,
  Trash2,
  X,
  CreditCard,
  Building,
  Database,
  Edit2,
  SlidersHorizontal,
} from 'lucide-react';

interface TransactionsViewProps {
  onSelectTransaction: (tx: Transaction) => void;
  onOpenAdd: () => void;
  initialAccountId?: string;
  onEditTransaction?: (tx: Transaction) => void;
  autoFocusSearch?: boolean;
  onResetSearchFocus?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onSelectTransaction,
  onOpenAdd,
  initialAccountId,
  onEditTransaction,
  autoFocusSearch,
  onResetSearchFocus,
}) => {
  const { transactions, categories, accounts, creditCards, activeMonth, deleteTransactions } = useMoney();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialAccountId || 'ALL');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Day filter state: 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'
  const [dayFilter, setDayFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState<string>('');
  
  // View mode: 'feed' (Day-by-Day list) | 'calendar' (Interactive Day Matrix)
  const [viewMode, setViewMode] = useState<'feed' | 'calendar'>('feed');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('');

  // Reference to search input for instant auto-focus on tab open
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Progressive loading states to make initial loading and typing/filtering instantaneous
  const [displayLimit, setDisplayLimit] = useState(15);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);

  // Auto-focus search input with a slight delay for reliable keyboard rendering on mobile device taps
  useEffect(() => {
    if (autoFocusSearch) {
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
        if (onResetSearchFocus) {
          onResetSearchFocus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [autoFocusSearch, onResetSearchFocus]);

  useEffect(() => {
    if (initialAccountId) {
      setSelectedAccountId(initialAccountId);
    }
  }, [initialAccountId]);
  
  // Selection mode for bulk delete
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());

  // Delete confirmation target state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'single' | 'bulk';
    transaction?: Transaction;
    ids: string[];
    count: number;
    title: string;
    amount?: string;
    subtitle?: string;
    badge?: string;
  } | null>(null);

  // Hold to preview state
  const [previewTx, setPreviewTx] = useState<Transaction | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasLongPressRef = useRef(false);

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

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => (t.tags || []).forEach(tag => set.add(tag)));
    return Array.from(set);
  }, [transactions]);

  // Options for filter selects
  const typeFilterOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: 'ALL', label: 'All Types', iconName: 'Receipt' },
      { value: 'EXPENSE', label: 'Expense', iconName: 'ArrowUpRight', iconColor: '#f43f5e' },
      { value: 'INCOME', label: 'Income', iconName: 'ArrowDownLeft', iconColor: '#10b981' },
      { value: 'TRANSFER', label: 'Transfer', iconName: 'ArrowRightLeft', iconColor: '#3b82f6' },
      { value: 'CARD_PAYMENT', label: 'Card Bill', iconName: 'CreditCard', iconColor: '#8b5cf6' },
      { value: 'INVESTMENT_CONTRIBUTION', label: 'Investments', iconName: 'TrendingUp', iconColor: '#0ea5e9' },
      { value: 'LOAN_REPAYMENT', label: 'Loan EMI', iconName: 'Building', iconColor: '#f59e0b' },
      { value: 'MONEY_LENT', label: 'Money Lent', iconName: 'Users', iconColor: '#ec4899' },
    ],
    []
  );

  const categoryFilterOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: 'ALL', label: 'All Categories' },
      ...categories.map(c => ({
        value: c.id,
        label: c.name,
        iconName: c.icon,
        iconColor: c.color,
        categoryName: c.name,
      })),
    ],
    [categories]
  );

  const tagFilterOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: 'ALL', label: 'All Tags' },
      ...allTags.map(t => ({
        value: t,
        label: `#${t}`,
      })),
    ],
    [allTags]
  );

  const accountFilterOptions: SelectOption<string>[] = useMemo(() => {
    const opts: SelectOption<string>[] = [
      {
        value: 'ALL',
        label: 'All Accounts & Cards',
        sublabel: 'View transactions across all bank accounts and cards',
        icon: (
          <div className="w-8 h-8 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Building size={16} />
          </div>
        ),
      },
    ];

    accounts
      .filter(a => !a.isDeleted)
      .forEach(a => {
        const typeBadge =
          a.type === 'SAVINGS'
            ? 'SAVINGS'
            : a.type === 'SALARY'
            ? 'SALARY'
            : a.type === 'CASH'
            ? 'CASH'
            : a.type === 'WALLET'
            ? 'WALLET'
            : a.type === 'FIXED_DEPOSIT'
            ? 'FD'
            : a.type.replace('_', ' ');

        opts.push({
          value: a.id,
          label: a.name,
          sublabel: a.institution,
          group: 'Bank Accounts & Wallets',
          badge: typeBadge,
          rightText: formatINR(a.calculatedBalance),
          rightTextColor:
            a.calculatedBalance >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400',
          icon: (
            <Bank3DIcon
              institution={a.institution}
              type={a.type}
              color={a.color}
              size="sm"
              glow={true}
            />
          ),
        });
      });

    creditCards
      .filter(c => !c.isDeleted)
      .forEach(c => {
        opts.push({
          value: c.id,
          label: c.name,
          sublabel: `${c.issuer} • ••${c.lastFourDigits}`,
          group: 'Credit Cards',
          badge: 'CARD',
          rightText: `Due: ${formatINR(c.currentOutstanding)}`,
          rightTextColor: 'text-purple-600 dark:text-purple-400',
          icon: (
            <Bank3DIcon
              institution={c.issuer}
              type="CREDIT_CARD"
              color={c.color || '#9333ea'}
              size="sm"
              glow={true}
            />
          ),
        });
      });

    return opts;
  }, [accounts, creditCards]);

  // Today & Yesterday ISO strings
  const todayStr = useMemo(() => new Date().toISOString().substring(0, 10), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().substring(0, 10);
  }, []);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (t.isDeleted) return false;

      // Day / Date Filter
      if (dayFilter === 'TODAY' && t.date !== todayStr) return false;
      if (dayFilter === 'YESTERDAY' && t.date !== yesterdayStr) return false;
      if (dayFilter === 'CUSTOM' && customDate && t.date !== customDate) return false;
      if (dayFilter === 'THIS_MONTH' && !t.date.startsWith(activeMonth)) return false;
      if (dayFilter === 'THIS_WEEK') {
        const txDate = new Date(t.date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays < 0 || diffDays > 7) return false;
      }

      // Calendar view specific selection
      if (viewMode === 'calendar' && selectedCalendarDate && t.date !== selectedCalendarDate) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMerchant = t.merchantName?.toLowerCase().includes(q);
        const matchesCategory = t.categoryName?.toLowerCase().includes(q);
        const matchesSubcategory = t.subcategory?.toLowerCase().includes(q);
        const matchesNotes = t.notes?.toLowerCase().includes(q);
        const matchesAmount = t.amount.toString().includes(q);
        const matchesAccount = t.accountName?.toLowerCase().includes(q) || t.creditCardName?.toLowerCase().includes(q);
        const matchesApp = t.paymentAppName?.toLowerCase().includes(q);
        const matchesTag = (t.tags || []).some(tag => tag.toLowerCase().includes(q));

        if (!matchesMerchant && !matchesCategory && !matchesSubcategory && !matchesNotes && !matchesAmount && !matchesAccount && !matchesApp && !matchesTag) {
          return false;
        }
      }

      // Type Filter
      if (selectedType !== 'ALL' && t.type !== selectedType) {
        return false;
      }

      // Category Filter
      if (selectedCategoryId !== 'ALL' && t.categoryId !== selectedCategoryId) {
        return false;
      }

      // Tag Filter
      if (selectedTag !== 'ALL' && !(t.tags || []).includes(selectedTag)) {
        return false;
      }

      // Account Filter
      if (selectedAccountId !== 'ALL') {
        const targetAcc = accounts.find(a => a.id === selectedAccountId);
        const targetCard = creditCards.find(c => c.id === selectedAccountId);

        const matchesAccId = t.accountId === selectedAccountId || t.toAccountId === selectedAccountId || t.creditCardId === selectedAccountId || t.toCreditCardId === selectedAccountId;
        const matchesAccName = targetAcc && (
          t.accountName?.toLowerCase() === targetAcc.name.toLowerCase() ||
          t.toAccountName?.toLowerCase() === targetAcc.name.toLowerCase()
        );
        const matchesCardName = targetCard && (
          t.creditCardName?.toLowerCase() === targetCard.name.toLowerCase()
        );

        if (!matchesAccId && !matchesAccName && !matchesCardName) {
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
  }, [transactions, searchQuery, selectedType, selectedCategoryId, selectedTag, selectedAccountId, dayFilter, customDate, activeMonth, viewMode, selectedCalendarDate, todayStr, yesterdayStr]);

  // Reset displayLimit on search / filter changes to keep interactions fluid, then load the rest in small, non-blocking batches
  useEffect(() => {
    setDisplayLimit(15);
    setIsFullyLoaded(false);

    let currentLimit = 15;
    let timerId: any = null;

    const loadNextBatch = () => {
      if (!isMountedRef.current) return;

      const totalCount = filteredTransactions.length;
      if (currentLimit >= totalCount) {
        setDisplayLimit(Infinity);
        setIsFullyLoaded(true);
        return;
      }

      // Add a chunk of 40 transactions
      currentLimit = Math.min(currentLimit + 40, totalCount);
      setDisplayLimit(currentLimit);

      if (currentLimit < totalCount) {
        timerId = setTimeout(loadNextBatch, 80); // yields event loop back to browser to process tab switches instantly
      } else {
        setDisplayLimit(Infinity);
        setIsFullyLoaded(true);
      }
    };

    // Start progressive loading after a small delay
    timerId = setTimeout(loadNextBatch, 250);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchQuery, selectedType, selectedCategoryId, selectedTag, selectedAccountId, dayFilter, activeMonth, viewMode, selectedCalendarDate, filteredTransactions.length]);

  // Group transactions by date, progressively sliced up to displayLimit
  const groupedByDate = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    const visibleTransactions = filteredTransactions.slice(0, displayLimit);
    visibleTransactions.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return groups;
  }, [filteredTransactions, displayLimit]);

  const dates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Aggregate stats for current filter
  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'INCOME' || t.type === 'MONEY_LENT_REPAYMENT' || t.type === 'INVESTMENT_WITHDRAWAL')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  // Format date helper (e.g. "Today, 16 Aug" or "14 Aug 2026, Friday")
  const formatDayTitle = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today • ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
    if (dateStr === yesterdayStr) return 'Yesterday • ' + new Date(yesterdayStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
    
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' });
  };

  // Calendar generation for current activeMonth
  const calendarDays = useMemo(() => {
    const [year, month] = activeMonth.split('-').map(Number);
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month, 0).getDate();

    // Map spends per date in this activeMonth
    const spendPerDate: { [date: string]: number } = {};
    const countPerDate: { [date: string]: number } = {};
    transactions
      .filter(t => !t.isDeleted && t.date.startsWith(activeMonth))
      .forEach(t => {
        if (t.type === 'EXPENSE') {
          spendPerDate[t.date] = (spendPerDate[t.date] || 0) + t.amount;
        }
        countPerDate[t.date] = (countPerDate[t.date] || 0) + 1;
      });

    const days = [];
    // Pad previous month days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: 0, dateStr: '', spent: 0, count: 0 });
    }
    // Month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${activeMonth}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr: dStr,
        spent: spendPerDate[dStr] || 0,
        count: countPerDate[dStr] || 0,
      });
    }
    return days;
  }, [activeMonth, transactions]);

  const activeFilterCount = useMemo(() => {
    return (dayFilter !== 'ALL' ? 1 : 0) +
      (selectedType !== 'ALL' ? 1 : 0) +
      (selectedCategoryId !== 'ALL' ? 1 : 0) +
      (selectedAccountId !== 'ALL' ? 1 : 0) +
      (selectedTag !== 'ALL' ? 1 : 0);
  }, [dayFilter, selectedType, selectedCategoryId, selectedAccountId, selectedTag]);

  return (
    <div className="space-y-4 pb-24 max-w-2xl mx-auto">
      {/* Top Header & View Mode Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Transaction Hub
          </h1>
          <p className="text-xs text-slate-500">
            {filteredTransactions.length} transactions found
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle: Day Feed vs Daily Calendar */}
          <div className="flex items-center space-x-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setViewMode('feed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                viewMode === 'feed'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List size={14} />
              <span>Day Feed</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays size={14} />
              <span>Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Day Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-3 sm:p-3.5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3">
        {/* Main Search & Filters Toggle Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search merchant, notes, tags (#fuel)..."
              className="w-full pl-9 pr-12 py-2 rounded-2xl bg-slate-100 dark:bg-slate-850 border border-transparent focus:border-emerald-500/50 focus:bg-white dark:focus:bg-slate-900 text-xs sm:text-sm outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className={`p-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer h-[38px] px-3.5 ${
              isFiltersExpanded || activeFilterCount > 0
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
            }`}
            title="Toggle Advanced Filters"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${isFiltersExpanded || activeFilterCount > 0 ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'}`}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters Section (Collapsible) */}
        {(isFiltersExpanded || activeFilterCount > 0) && (
          <div className="pt-2.5 space-y-3 border-t border-slate-100 dark:border-slate-750 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Calendar Date Filter Range */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Filter by Date
                </span>
                {(customDate || dayFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setDayFilter('ALL');
                      setCustomDate('');
                      setSelectedCalendarDate('');
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all flex items-center space-x-1 shadow-xs cursor-pointer active:scale-95"
                  >
                    <X size={10} />
                    <span>Clear Date</span>
                  </button>
                )}
              </div>

              {/* Custom Date Picker Input */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-56">
                  <CustomDatePicker
                    value={customDate}
                    onChange={d => {
                      setCustomDate(d);
                      if (d) {
                        setDayFilter('CUSTOM');
                      } else {
                        setDayFilter('ALL');
                      }
                    }}
                    placeholder="Pick specific date..."
                    size="sm"
                  />
                </div>
                {customDate && (
                  <span className="text-xs text-slate-500 font-medium">
                    Showing transactions for {formatDayTitle(customDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Filter Pills / Select Dropdowns */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Filter by Category, Type & Account
              </span>
              <div className="flex space-x-1.5 overflow-x-auto no-scrollbar pb-1 text-xs items-center">
                {/* Type Filter */}
                <CustomSelect
                  value={selectedType}
                  onChange={val => setSelectedType(val)}
                  options={typeFilterOptions}
                  placeholder="All Types"
                  title="Filter by Type"
                  size="sm"
                  variant="pill"
                  className="shrink-0"
                />

                {/* Category Filter */}
                <CustomSelect
                  value={selectedCategoryId}
                  onChange={val => setSelectedCategoryId(val)}
                  options={categoryFilterOptions}
                  placeholder="All Categories"
                  title="Filter by Category"
                  size="sm"
                  variant="pill"
                  searchable={true}
                  searchPlaceholder="Search categories..."
                  className="shrink-0"
                />

                {/* Account / Card Filter */}
                <CustomSelect
                  value={selectedAccountId}
                  onChange={val => setSelectedAccountId(val)}
                  options={accountFilterOptions}
                  placeholder="All Accounts"
                  title="Filter by Account/Card"
                  size="sm"
                  variant="pill"
                  searchable={true}
                  className="shrink-0"
                />

                {/* Tag Filter */}
                {allTags.length > 0 && (
                  <CustomSelect
                    value={selectedTag}
                    onChange={val => setSelectedTag(val)}
                    options={tagFilterOptions}
                    placeholder="All Tags"
                    title="Filter by Tag"
                    size="sm"
                    variant="pill"
                    className="shrink-0"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Account Filter Banner */}
      {selectedAccountId !== 'ALL' && (() => {
        const activeAcc = accounts.find(a => a.id === selectedAccountId);
        const activeCard = creditCards.find(c => c.id === selectedAccountId);
        const title = activeAcc ? activeAcc.name : activeCard ? activeCard.name : 'Account';
        const sub = activeAcc ? activeAcc.institution : activeCard ? activeCard.issuer : '';

        return (
          <div className="p-2.5 px-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between shadow-2xs animate-in fade-in">
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                <Building size={13} />
              </div>
              <div className="text-xs">
                <span className="text-slate-500 dark:text-slate-400">Filtering transactions for </span>
                <span className="font-bold text-emerald-950 dark:text-emerald-200">{title}</span>
                {sub && <span className="text-emerald-700 dark:text-emerald-400 text-[11px] ml-1">({sub})</span>}
              </div>
            </div>
            <button
              onClick={() => setSelectedAccountId('ALL')}
              className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center space-x-1"
            >
              <X size={12} />
              <span>Show All</span>
            </button>
          </div>
        );
      })()}

      {/* Summary KPI Strip for Current Filtered Day/Period */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase block">Outflow (Spent)</span>
            <span className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400">
              {formatINR(totalExpense)}
            </span>
          </div>
          <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center font-bold">
            <ArrowUpRight size={15} />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase block">Inflow (Earned)</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatINR(totalIncome)}
            </span>
          </div>
          <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center font-bold">
            <ArrowDownLeft size={15} />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase block">Net Balance</span>
            <span className={`text-sm sm:text-base font-extrabold ${totalIncome >= totalExpense ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
              {formatINR(totalIncome - totalExpense)}
            </span>
          </div>
          <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center font-bold">
            <Sparkles size={15} />
          </div>
        </div>
      </div>

      {/* Multi-Selection Control Bar directly below Net Balance */}
      {!isSelectionMode ? (
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsSelectionMode(true);
              setSelectedTxIds(new Set());
            }}
            className="px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
            title="Enable multi-select to delete multiple transactions"
          >
            <CheckCircle2 size={14} className="text-purple-600 dark:text-purple-400" />
            <span>Select</span>
          </button>
        </div>
      ) : (
        /* Bulk Selection Action Bar */
        <div className="bg-purple-50 dark:bg-purple-950/40 rounded-3xl p-3 px-4 border border-purple-200 dark:border-purple-800/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                {selectedTxIds.size} Selected
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                const allVisibleIds = filteredTransactions.map(t => t.id);
                if (selectedTxIds.size === allVisibleIds.length && allVisibleIds.length > 0) {
                  setSelectedTxIds(new Set());
                } else {
                  setSelectedTxIds(new Set(allVisibleIds));
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-xs font-bold flex-1 sm:flex-none text-center cursor-pointer"
            >
              {selectedTxIds.size === filteredTransactions.length && filteredTransactions.length > 0 ? 'Deselect All' : 'Select All Visible'}
            </button>
            <button
              type="button"
              disabled={selectedTxIds.size === 0}
              onClick={() => {
                if (selectedTxIds.size > 0) {
                  setDeleteTarget({
                    type: 'bulk',
                    ids: Array.from(selectedTxIds),
                    count: selectedTxIds.size,
                    title: `Delete ${selectedTxIds.size} Transactions?`,
                    subtitle: `All ${selectedTxIds.size} selected transactions will be moved to the Trash Bin.`,
                  });
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center space-x-1.5 flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Delete ({selectedTxIds.size})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedTxIds(new Set());
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: Interactive Calendar Matrix */}
      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3 animate-in fade-in-50">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Daily Calendar Spend Map
              </h3>
            </div>
            {selectedCalendarDate && (
              <button
                onClick={() => setSelectedCalendarDate('')}
                className="text-xs text-emerald-600 font-bold hover:underline"
              >
                Clear Day Selection
              </button>
            )}
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              if (cell.day === 0) {
                return <div key={`empty-${idx}`} className="h-14 rounded-2xl bg-slate-50/50 dark:bg-slate-850/30" />;
              }

              const isSelected = selectedCalendarDate === cell.dateStr;
              const isToday = cell.dateStr === todayStr;
              const hasSpend = cell.spent > 0;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => setSelectedCalendarDate(isSelected ? '' : cell.dateStr)}
                  className={`h-14 p-1 rounded-2xl flex flex-col items-center justify-between border transition-all text-center relative ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500/30 font-bold'
                      : isToday
                      ? 'border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-800'
                      : hasSpend
                      ? 'border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                      : 'border-transparent bg-slate-50 dark:bg-slate-850 text-slate-400'
                  }`}
                >
                  <span className={`text-[11px] font-bold ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {cell.day}
                  </span>

                  {hasSpend ? (
                    <span className="text-[9px] font-extrabold text-rose-600 dark:text-rose-400 leading-tight">
                      ₹{cell.spent >= 1000 ? `${(cell.spent / 1000).toFixed(0)}k` : cell.spent}
                    </span>
                  ) : cell.count > 0 ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ) : null}

                  {cell.count > 0 && (
                    <span className="text-[8px] text-slate-400">
                      {cell.count} tx
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2 & LIST: Grouped Transaction Feed */}
      {dates.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200/70 dark:border-slate-700/70 text-center text-slate-400 shadow-sm">
          <p className="text-sm font-semibold">No transactions found for the selected filter</p>
          <p className="text-xs text-slate-500 mt-1">Try changing the date filter or search criteria</p>
          <button
            onClick={onOpenAdd}
            className="mt-4 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors"
          >
            Add New Transaction
          </button>
        </div>
      ) : (
        dates.map((dateStr, dIdx) => {
          const dayItems = [...groupedByDate[dateStr]].sort((a, b) => {
            const timeA = a.time || '00:00';
            const timeB = b.time || '00:00';
            
            // Primary sort by time of day descending (newest time first)
            const timeCompare = timeB.localeCompare(timeA);
            if (timeCompare !== 0) {
              return timeCompare;
            }

            // Fallback to timestamp if times are identical
            const tsA = a.timestamp || 0;
            const tsB = b.timestamp || 0;
            if (tsA && tsB && tsA !== tsB) {
              return tsB - tsA;
            }
            
            return 0;
          });
          const dayExpense = dayItems.reduce((sum, item) => {
            if (item.type === 'EXPENSE') return sum + item.amount;
            return sum;
          }, 0);
          const dayIncome = dayItems.reduce((sum, item) => {
            if (item.type === 'INCOME' || item.type === 'MONEY_LENT_REPAYMENT') return sum + item.amount;
            return sum;
          }, 0);

          return (
            <div
              key={`tx_date_${dateStr}_${dIdx}`}
              className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-2"
            >
              {/* Day Header with Date & Net Day Totals */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-700 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <CalendarIcon size={13} />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatDayTitle(dateStr)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({dayItems.length} transactions)
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-right">
                  {dayExpense > 0 && (
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg">
                      Spent: {formatINR(dayExpense)}
                    </span>
                  )}
                  {dayIncome > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg">
                      +{formatINR(dayIncome)}
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions in This Day with 3D Icons and Full Details */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {dayItems.map((t, idx) => {
                  const isIncome = t.type === 'INCOME' || t.type === 'MONEY_LENT_REPAYMENT' || t.type === 'INVESTMENT_WITHDRAWAL';
                  const isTransfer = t.type === 'TRANSFER' || t.type === 'CARD_PAYMENT' || t.type === 'INVESTMENT_CONTRIBUTION';
                  const cat = categories.find(c => c.id === t.categoryId);
                  const acc = accounts.find(a => a.id === t.accountId);
                  const card = creditCards.find(c => c.id === t.creditCardId);
                  const toAcc = accounts.find(a => a.id === t.toAccountId);
                  const toCard = creditCards.find(c => c.id === t.toCreditCardId);
                  const accentColor = card ? card.color || '#9333ea' : acc ? acc.color || '#10b981' : '#64748b';

                  return (
                    <div
                      key={`tx_${t.id}_${idx}`}
                      onPointerDown={(e) => handlePointerDown(t, e)}
                      onPointerUp={handlePointerUpOrLeave}
                      onPointerLeave={handlePointerUpOrLeave}
                      onPointerCancel={handlePointerUpOrLeave}
                      onContextMenu={(e) => {
                        // Prevent context menu on long press
                        if (wasLongPressRef.current || isSelectionMode) {
                          e.preventDefault();
                        }
                      }}
                      onClick={(e) => {
                        if (wasLongPressRef.current) {
                          e.preventDefault();
                          e.stopPropagation();
                          return;
                        }
                        if (isSelectionMode) {
                          const newSet = new Set(selectedTxIds);
                          if (newSet.has(t.id)) newSet.delete(t.id);
                          else newSet.add(t.id);
                          setSelectedTxIds(newSet);
                        } else {
                          onSelectTransaction(t);
                        }
                      }}
                      className={`p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750/70 rounded-2xl transition-colors group select-none space-y-2 border border-slate-100 dark:border-slate-800 ${
                        isSelectionMode && selectedTxIds.has(t.id) ? 'bg-purple-50/50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-800' : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                      {/* Top Row: Left (Checkbox + Icon + Merchant Name + Type Badge) & Right (Amount + Time) */}
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {isSelectionMode && (
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              selectedTxIds.has(t.id) 
                                ? 'bg-purple-500 border-purple-500 text-white' 
                                : 'border-slate-300 dark:border-slate-600 bg-transparent text-transparent'
                            }`}>
                              <CheckCircle2 size={12} className={selectedTxIds.has(t.id) ? 'block' : 'hidden'} />
                            </div>
                          )}
                          <div className="relative shrink-0">
                            <Category3DIcon
                              name={cat?.icon || (isIncome ? 'ArrowDownLeft' : isTransfer ? 'ArrowRightLeft' : 'Receipt')}
                              categoryName={t.categoryName || cat?.name}
                              color={cat?.color || (isIncome ? '#10b981' : '#64748b')}
                              size="sm"
                              glow={true}
                              interactive={true}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
                                {t.merchantName || t.categoryName || t.notes || 'Transaction'}
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
                                <Paperclip size={12} className="text-slate-400 shrink-0" title="Has receipt photo" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Time */}
                        <div className="text-right shrink-0">
                          <span
                            className={`text-xs sm:text-sm font-black block ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isTransfer
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {isIncome ? `+${formatINR(t.amount)}` : isTransfer ? formatINR(t.amount) : `-${formatINR(t.amount)}`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {format12HourTime(t.time, t.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Row: Detail Badges & Quick Action Buttons */}
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
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchQuery(t.paymentAppName || '');
                              }}
                              className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                              title={`Filter by ${t.paymentAppName}`}
                            >
                              <PaymentApp3DIcon name={t.paymentAppName} size="xs" glow={false} />
                              <span>{t.paymentAppName}</span>
                            </button>
                          )}

                          {/* Mini 3D Bank / Card Badge */}
                          {(t.accountId || t.creditCardId || t.toAccountId || t.accountName || t.creditCardName) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const accId = t.accountId || (acc ? acc.id : '');
                                const cardId = t.creditCardId || (card ? card.id : '');
                                setSelectedAccountId(cardId || accId || 'ALL');
                              }}
                              className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold transition-colors cursor-pointer"
                              style={{ color: accentColor }}
                              title={`Filter transactions for ${t.creditCardName || t.accountName}`}
                            >
                              <Bank3DIcon
                                institution={card ? card.issuer : acc?.institution}
                                type={card ? 'CREDIT_CARD' : acc?.type}
                                color={accentColor}
                                size="xs"
                                glow={false}
                              />
                              <span className="truncate max-w-[120px] sm:max-w-none">
                                {t.type === 'TRANSFER' || t.type === 'CARD_PAYMENT'
                                  ? (() => {
                                      let fromName = 'External';
                                      let toName = 'External';

                                      if (t.type === 'CARD_PAYMENT') {
                                        fromName = t.accountName || acc?.name || 'External';
                                        toName = t.creditCardName || card?.name || 'External';
                                      } else {
                                        fromName = t.accountName || acc?.name || (t.type === 'CARD_PAYMENT' && !acc ? t.creditCardName || card?.name : 'External');
                                        toName = t.toAccountName || toAcc?.name || (t.type === 'CARD_PAYMENT' ? t.creditCardName || card?.name : 'External');
                                      }
                                      
                                      if (fromName !== 'External' && toName !== 'External') {
                                        return `${fromName} ➔ ${toName}`;
                                      } else if (fromName !== 'External') {
                                        return `${fromName} ➔ External`;
                                      } else if (toName !== 'External') {
                                        return `External ➔ ${toName}`;
                                      }
                                      return t.creditCardName || card?.name || t.accountName || acc?.name || 'Transfer';
                                    })()
                                  : t.creditCardName || card?.name || t.accountName || acc?.name || 'Account'}
                              </span>
                            </button>
                          )}

                          {/* Tags */}
                          {(t.tags || []).slice(0, 2).map((tag, tIdx) => (
                            <span
                              key={`${tag}-${tIdx}`}
                              className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {/* Quick Edit & Delete Action Buttons */}
                        {!isSelectionMode && (
                          <div className="flex items-center space-x-1 shrink-0 ml-auto">
                            {onEditTransaction && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditTransaction(t);
                                }}
                                className="p-1 sm:p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95 shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                                title="Edit transaction"
                              >
                                <Edit2 size={12} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget({
                                  type: 'single',
                                  transaction: t,
                                  ids: [t.id],
                                  count: 1,
                                  title: `Delete "${t.merchantName || t.categoryName || t.notes || 'Transaction'}"?`,
                                  amount: isIncome ? `+${formatINR(t.amount)}` : isTransfer ? formatINR(t.amount) : `-${formatINR(t.amount)}`,
                                  subtitle: `${t.date} • ${t.type.replace(/_/g, ' ')}`,
                                  badge: t.categoryName || 'General',
                                });
                              }}
                              className="p-1 sm:p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-all cursor-pointer active:scale-95 shadow-2xs border border-rose-200/60 dark:border-rose-800/60"
                              title="Move to Trash"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Notes inside the transaction card */}
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

      {/* Progressive loading feedback indicator */}
      {!isFullyLoaded && filteredTransactions.length > displayLimit && (
        <div className="flex flex-col items-center justify-center space-y-1.5 py-6 text-xs text-slate-400 dark:text-slate-500 animate-pulse">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-semibold text-slate-600 dark:text-slate-400">Loading remaining transactions...</span>
          </div>
          <p className="text-[10px] text-slate-400/80">Showing the first {displayLimit} of {filteredTransactions.length} records instantly</p>
        </div>
      )}


      {/* Hold-to-Preview Overlay */}
      {previewTx && (() => {
        const previewCat = categories.find(c => c.id === previewTx.categoryId);
        const isIncome = previewTx.type === 'INCOME' || previewTx.type === 'MONEY_LENT_REPAYMENT' || previewTx.type === 'INVESTMENT_WITHDRAWAL' || previewTx.type === 'REFUND';
        const isTransfer = previewTx.type === 'TRANSFER' || previewTx.type === 'CARD_PAYMENT' || previewTx.type === 'INVESTMENT_CONTRIBUTION';
        
        // Resolve accounts/cards/payment apps to guarantee 100% identical data mapping fallback as the Detail Modal
        const resolvedAccountName = previewTx.accountName || (previewTx.accountId ? accounts.find(a => a.id === previewTx.accountId)?.name : undefined);
        const resolvedCreditCardName = previewTx.creditCardName || (previewTx.creditCardId ? creditCards.find(c => c.id === previewTx.creditCardId)?.name : undefined);
        const resolvedToAccountName = previewTx.toAccountName || (previewTx.toAccountId ? accounts.find(a => a.id === previewTx.toAccountId)?.name : undefined);
        const resolvedPaymentAppName = previewTx.paymentAppName;

        const iconColor = previewCat?.color || (isIncome ? '#10b981' : isTransfer ? '#3b82f6' : '#64748b');
        const iconName = previewCat?.icon || (isIncome ? 'ArrowDownLeft' : isTransfer ? 'ArrowRightLeft' : 'Receipt');
        
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border border-slate-100 dark:border-slate-800/80 overflow-hidden relative flex flex-col">
              {/* Top ambient status border */}
              <div className="h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 opacity-90 w-full" />
              
              {/* Header Label */}
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Transaction Preview
                </span>
                <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                  isIncome ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                  isTransfer ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' :
                  'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                }`}>
                  {previewTx.type === 'CARD_PAYMENT' ? 'Card Bill' : previewTx.type === 'MONEY_BORROWED' ? 'Borrowed' : previewTx.type === 'MONEY_LENT' ? 'Lent' : isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}
                </span>
              </div>

              {/* Centered Hero Amount & Merchant Name (Matches TransactionDetailModal style) */}
              <div className="px-6 py-5 text-center bg-slate-50/50 dark:bg-slate-850/40 border-b border-slate-100 dark:border-slate-800/60 flex flex-col items-center">
                <div className="mb-2.5">
                  <Category3DIcon
                    name={iconName}
                    categoryName={previewTx.categoryName || previewCat?.name}
                    color={iconColor}
                    size="xl"
                    glow={true}
                  />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white max-w-[320px] truncate">
                  {previewTx.merchantName || previewTx.categoryName || 'Transaction'}
                </h2>
                <div className={`text-2xl font-black mt-1 ${
                  isIncome
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isTransfer
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {isIncome ? `+${formatINR(previewTx.amount)}` : isTransfer ? formatINR(previewTx.amount) : `-${formatINR(previewTx.amount)}`}
                </div>
              </div>

              {/* Symmetric Info Fields (100% Consistent with TransactionDetailModal) */}
              <div className="p-5 space-y-3.5 text-xs">
                {/* Date & Time */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center font-semibold text-[11px]">
                    <CalendarIcon size={13} className="mr-1.5 text-slate-400" /> Date & Time
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {previewTx.date} at {format12HourTime(previewTx.time, previewTx.timestamp)}
                  </span>
                </div>

                {/* Category */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center font-semibold text-[11px]">
                    <List size={13} className="mr-1.5 text-slate-400" /> Category
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {previewTx.categoryName || 'General'} {previewTx.subcategory && `(${previewTx.subcategory})`}
                  </span>
                </div>

                {/* Conditional Account Fields */}
                {previewTx.type === 'CARD_PAYMENT' ? (
                  <>
                    {resolvedAccountName && (
                      <div className="flex items-center justify-between animate-in fade-in duration-150">
                        <span className="text-slate-500 flex items-center font-semibold text-[11px]">
                          <Building size={13} className="mr-1.5 text-slate-400" /> Paid From
                        </span>
                        <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <Bank3DIcon
                            name="Building2"
                            institution={resolvedAccountName}
                            color="#059669"
                            size="xs"
                          />
                          <span>{resolvedAccountName}</span>
                        </div>
                      </div>
                    )}
                    {resolvedCreditCardName && (
                      <div className="flex items-center justify-between animate-in fade-in duration-150">
                        <span className="text-slate-500 flex items-center font-semibold text-[11px]">
                          <CreditCard size={13} className="mr-1.5 text-slate-400" /> Paid To Card
                        </span>
                        <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <Bank3DIcon
                            name="CreditCard"
                            institution={resolvedCreditCardName}
                            color="#9333ea"
                            size="xs"
                          />
                          <span>{resolvedCreditCardName}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : previewTx.type === 'TRANSFER' ? (
                  <>
                    {(resolvedAccountName || resolvedCreditCardName) && (
                      <div className="flex items-center justify-between animate-in fade-in duration-150">
                        <span className="text-slate-500 flex items-center font-semibold text-[11px]">
                          <Building size={13} className="mr-1.5 text-slate-400" /> Transferred From
                        </span>
                        <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <Bank3DIcon
                            name={previewTx.creditCardId && !previewTx.accountId ? 'CreditCard' : 'Building2'}
                            institution={resolvedAccountName || resolvedCreditCardName}
                            color={previewTx.creditCardId && !previewTx.accountId ? '#9333ea' : '#059669'}
                            size="xs"
                          />
                          <span>{resolvedAccountName || resolvedCreditCardName}</span>
                        </div>
                      </div>
                    )}
                    {resolvedToAccountName && (
                      <div className="flex items-center justify-between animate-in fade-in duration-150">
                        <span className="text-slate-500 flex items-center font-semibold text-[11px]">
                          <ArrowRightLeft size={13} className="mr-1.5 text-slate-400" /> Transferred To
                        </span>
                        <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <Bank3DIcon
                            name="Building2"
                            institution={resolvedToAccountName}
                            color="#2563eb"
                            size="xs"
                          />
                          <span>{resolvedToAccountName}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {(resolvedAccountName || resolvedCreditCardName) && (
                      <div className="flex items-center justify-between animate-in fade-in duration-150">
                        <span className="text-slate-500 flex items-center font-semibold text-[11px]">
                          <Building size={13} className="mr-1.5 text-slate-400" /> Account / Card
                        </span>
                        <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <Bank3DIcon
                            name={previewTx.creditCardId ? 'CreditCard' : 'Building2'}
                            institution={resolvedCreditCardName || resolvedAccountName}
                            color={previewTx.creditCardId ? '#9333ea' : '#059669'}
                            size="xs"
                          />
                          <span>{resolvedCreditCardName || resolvedAccountName}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Channel / Payment App */}
                {resolvedPaymentAppName && (
                  <div className="flex items-center justify-between animate-in fade-in duration-150">
                    <span className="text-slate-500 flex items-center font-semibold text-[11px]">
                      <Sparkles size={13} className="mr-1.5 text-slate-400" /> Channel
                    </span>
                    <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <PaymentApp3DIcon
                        name="Smartphone"
                        appName={resolvedPaymentAppName}
                        size="xs"
                      />
                      <span>{resolvedPaymentAppName}</span>
                    </div>
                  </div>
                )}

                {/* Debt Details */}
                {previewTx.debtPersonName && (
                  <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 dark:border-rose-500/20 rounded-2xl p-3 text-xs space-y-1.5">
                    <div className="flex justify-between items-center border-b border-rose-500/10 pb-1">
                      <span className="font-bold text-rose-600 dark:text-rose-400 uppercase text-[9px] tracking-wider">Debt Engagement</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        previewTx.isDebtSettled 
                          ? 'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-700'
                      }`}>
                        {previewTx.isDebtSettled ? 'Settled' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                      <span>Counterparty:</span>
                      <span className="font-black text-slate-800 dark:text-slate-100">{previewTx.debtPersonName}</span>
                    </div>
                    {previewTx.debtDueDate && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                        <span>Expected Due:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{previewTx.debtDueDate}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Splits breakdown */}
                {previewTx.splits && previewTx.splits.length > 0 && (
                  <div className="bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/10 dark:border-purple-500/20 rounded-2xl p-3 text-xs space-y-2">
                    <span className="font-extrabold text-purple-600 dark:text-purple-400 uppercase text-[9px] tracking-wider block">
                      Bill Splits ({previewTx.splits.length})
                    </span>
                    <div className="space-y-1.5 max-h-[85px] overflow-y-auto custom-scrollbar">
                      {previewTx.splits.map((s, idx) => (
                        <div key={`${s.notes || 'split'}-${idx}`} className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                          <span className="truncate max-w-[200px] font-medium">{s.notes || `Person ${idx + 1}`}</span>
                          <span className="font-black text-slate-800 dark:text-slate-200">{formatINR(s.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes Block */}
                {previewTx.notes && (
                  <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-slate-800 dark:text-slate-200 italic leading-relaxed whitespace-pre-wrap">
                    "{previewTx.notes}"
                  </div>
                )}

                {/* Tags block */}
                {previewTx.tags && previewTx.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {previewTx.tags.map((t, idx) => (
                      <span
                        key={`tag_${t}_${idx}`}
                        className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer row with status badging */}
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  {previewTx.isAutoRecorded && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                      SMS Auto
                    </span>
                  )}
                  {previewTx.recurringId && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                      Recurring
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-bold animate-pulse">
                  Release pointer to close
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteTransactions(deleteTarget.ids);
            if (deleteTarget.type === 'bulk') {
              setSelectedTxIds(new Set());
              setIsSelectionMode(false);
            }
            setDeleteTarget(null);
          }
        }}
        title={
          deleteTarget?.type === 'bulk'
            ? `Delete ${deleteTarget.count} Transactions?`
            : 'Delete Transaction?'
        }
        description={
          deleteTarget?.type === 'bulk'
            ? `Are you sure you want to move all ${deleteTarget.count} selected transactions to the Trash Bin? You can restore them anytime from More → Trash Bin.`
            : 'Are you sure you want to move this transaction to the Trash Bin? You can restore it anytime from More → Trash Bin.'
        }
        itemDetails={
          deleteTarget
            ? {
                title: deleteTarget.title,
                amount: deleteTarget.amount,
                subtitle: deleteTarget.subtitle,
                badge: deleteTarget.badge,
              }
            : undefined
        }
        confirmLabel={
          deleteTarget?.type === 'bulk'
            ? `Delete ${deleteTarget.count} Items`
            : 'Move to Trash'
        }
      />
    </div>
  );
};
