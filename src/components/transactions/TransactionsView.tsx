import { TransactionRow } from "./TransactionRow";
import React, { useState, useMemo, useEffect, useRef, useDeferredValue, useCallback } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { useMoneyStore } from '../../store/useMoneyStore';
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
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
} from 'lucide-react';

const shiftDay = (dateStr: string, offsetDays: number): string => {
  if (!dateStr) return new Date().toISOString().substring(0, 10);
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${date}`;
};

const shiftMonth = (monthStr: string, offsetMonths: number): string => {
  if (!monthStr) return new Date().toISOString().substring(0, 7);
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1 + offsetMonths, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const formatMonthTitle = (monthStr: string): string => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

interface TransactionsViewProps {
  onSelectTransaction: (tx: Transaction) => void;
  onOpenAdd: () => void;
  initialAccountId?: string;
  onEditTransaction?: (tx: Transaction) => void;
  autoFocusSearch?: boolean;
  onResetSearchFocus?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = React.memo(({
  onSelectTransaction,
  onOpenAdd,
  initialAccountId,
  onEditTransaction,
  autoFocusSearch,
  onResetSearchFocus,
}) => {
  // Use selective Zustand store subscriptions to isolate re-renders
  const transactions = useMoneyStore(s => s.transactions);
  const categories = useMoneyStore(s => s.categories);
  const accounts = useMoneyStore(s => s.accounts);
  const creditCards = useMoneyStore(s => s.creditCards);
  const investments = useMoneyStore(s => s.investments);
  const activeMonth = useMoneyStore(s => s.activeMonth);
  const deleteTransactions = useMoneyStore(s => s.deleteTransactions);
  const debts = useMoneyStore(s => s.debts);
  const goals = useMoneyStore(s => s.goals);

  // Fast O(1) Lookup Maps for Category, Account, and CreditCard metadata
  const categoriesMap = useMemo(() => {
    const map = new Map<string, typeof categories[0]>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  const accountsMap = useMemo(() => {
    const map = new Map<string, typeof accounts[0]>();
    accounts.forEach(a => map.set(a.id, a));
    return map;
  }, [accounts]);

  const creditCardsMap = useMemo(() => {
    const map = new Map<string, typeof creditCards[0]>();
    creditCards.forEach(c => map.set(c.id, c));
    return map;
  }, [creditCards]);

  const investmentsMap = useMemo(() => {
    const map = new Map<string, typeof investments[0]>();
    investments.forEach(i => map.set(i.id, i));
    return map;
  }, [investments]);
  
  const goalsMap = useMemo(() => {
    const map = new Map<string, typeof goals[0]>();
    goals.forEach(g => map.set(g.id, g));
    return map;
  }, [goals]);
  
  const debtsMap = useMemo(() => {
    const map = new Map<string, typeof debts[0]>();
    debts.forEach(d => map.set(d.id, d));
    return map;
  }, [debts]);

  // Today & Yesterday ISO strings
  const todayStr = useMemo(() => new Date().toISOString().substring(0, 10), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().substring(0, 10);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isSearchActive, setIsSearchActive] = useState<boolean>(Boolean(autoFocusSearch));
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialAccountId || 'ALL');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Feed scope: 'DAY' (default single-day feed) | 'ALL' (loaded full history via button)
  const [feedScope, setFeedScope] = useState<'DAY' | 'ALL'>('DAY');
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [loadingStage, setLoadingStage] = useState<number>(1);
  const [actualTotalCount, setActualTotalCount] = useState<number>(0);
  const [actualTotalDates, setActualTotalDates] = useState<number>(0);
  const [liveCount, setLiveCount] = useState<number>(0);
  const [liveDates, setLiveDates] = useState<number>(0);
  const [liveRenderedCount, setLiveRenderedCount] = useState<number>(0);

  // Selected day for DAY feed navigation: defaults to todayStr
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);

  // Calendar month state for Calendar view (allows browsing previous and future months)
  const [calendarMonth, setCalendarMonth] = useState<string>(activeMonth || todayStr.substring(0, 7));

  // Sync calendarMonth if parent activeMonth changes
  useEffect(() => {
    if (activeMonth) {
      setCalendarMonth(activeMonth);
    }
  }, [activeMonth]);

  // Day filter state: 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'
  const [dayFilter, setDayFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState<string>('');
  
  // View mode: 'feed' (Day-by-Day list) | 'calendar' (Interactive Day Matrix)
  const [viewMode, setViewMode] = useState<'feed' | 'calendar'>('feed');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('');

  const renderTimerRef = useRef<any>(null);
  const renderRaf1Ref = useRef<number | null>(null);
  const renderRaf2Ref = useRef<number | null>(null);
  const tickIntervalRef = useRef<any>(null);
  const tickIntervalDatesRef = useRef<any>(null);
  const tickIntervalRenderRef = useRef<any>(null);

  const handleCancelLoadAll = useCallback(() => {
    if (renderTimerRef.current) {
      clearTimeout(renderTimerRef.current);
      renderTimerRef.current = null;
    }
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
    if (tickIntervalDatesRef.current) {
      clearInterval(tickIntervalDatesRef.current);
      tickIntervalDatesRef.current = null;
    }
    if (tickIntervalRenderRef.current) {
      clearInterval(tickIntervalRenderRef.current);
      tickIntervalRenderRef.current = null;
    }
    if (renderRaf1Ref.current) {
      cancelAnimationFrame(renderRaf1Ref.current);
      renderRaf1Ref.current = null;
    }
    if (renderRaf2Ref.current) {
      cancelAnimationFrame(renderRaf2Ref.current);
      renderRaf2Ref.current = null;
    }
    setIsLoadingAll(false);
    setFeedScope('DAY');
    setDisplayLimit(60);
    setIsFullyLoaded(false);
  }, []);

  const handleLoadAllTransactions = useCallback(() => {
    if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    if (renderRaf1Ref.current) cancelAnimationFrame(renderRaf1Ref.current);
    if (renderRaf2Ref.current) cancelAnimationFrame(renderRaf2Ref.current);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    if (tickIntervalDatesRef.current) clearInterval(tickIntervalDatesRef.current);
    if (tickIntervalRenderRef.current) clearInterval(tickIntervalRenderRef.current);

    // Filter and compute real numbers upfront
    const visibleTxs = transactions.filter(t => !t.isDeleted);
    const dateSet = new Set(visibleTxs.map(t => t.date));
    setActualTotalCount(visibleTxs.length);
    setActualTotalDates(dateSet.size);
    setLiveCount(0);
    setLiveDates(0);
    setLiveRenderedCount(0);

    setIsLoadingAll(true);
    setLoadingStage(1);

    // Run stage pipeline
    // Stage 1 -> Stage 2 after 500ms
    renderTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setLoadingStage(2);

      // Start live counting for transactions
      const targetCount = visibleTxs.length;
      let currentCount = 0;
      const step = Math.max(1, Math.ceil(targetCount / 26));

      tickIntervalRef.current = setInterval(() => {
        currentCount = Math.min(targetCount, currentCount + step);
        setLiveCount(currentCount);
        if (currentCount >= targetCount) {
          if (tickIntervalRef.current) {
            clearInterval(tickIntervalRef.current);
            tickIntervalRef.current = null;
          }
        }
      }, 15);

      // Stage 2 -> Stage 3 after 500ms
      renderTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        setLoadingStage(3);

        // Start live counting for dates
        const targetDates = dateSet.size;
        let currentDates = 0;
        const stepDates = Math.max(1, Math.ceil(targetDates / 26));

        tickIntervalDatesRef.current = setInterval(() => {
          currentDates = Math.min(targetDates, currentDates + stepDates);
          setLiveDates(currentDates);
          if (currentDates >= targetDates) {
            if (tickIntervalDatesRef.current) {
              clearInterval(tickIntervalDatesRef.current);
              tickIntervalDatesRef.current = null;
            }
          }
        }, 15);

        // Stage 3 -> Stage 4 after 500ms
        renderTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          setLoadingStage(4);

          // Start live counting for rendering progress
          const targetRender = visibleTxs.length;
          let currentRender = 0;
          const stepRender = Math.max(1, Math.ceil(targetRender / 20));

          tickIntervalRenderRef.current = setInterval(() => {
            currentRender = Math.min(targetRender, currentRender + stepRender);
            setLiveRenderedCount(currentRender);
            if (currentRender >= targetRender) {
              if (tickIntervalRenderRef.current) {
                clearInterval(tickIntervalRenderRef.current);
                tickIntervalRenderRef.current = null;
              }
            }
          }, 15);

          // Transition to feedScope ALL during Stage 4 to populate background layout
          React.startTransition(() => {
            setFeedScope('ALL');
            setDisplayLimit(Infinity);
            setIsFullyLoaded(true);
          });

          // Stage 4 -> Fully completed and close overlay after 800ms
          renderTimerRef.current = setTimeout(() => {
            if (!isMountedRef.current) return;
            setIsLoadingAll(false);
          }, 800);
        }, 500);
      }, 500);
    }, 500);
  }, [transactions]);

  // Reference to search input for instant auto-focus on tab open
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  // Cancellation and cleanup on unmount (e.g. when user switches tabs)
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
      if (renderRaf1Ref.current) cancelAnimationFrame(renderRaf1Ref.current);
      if (renderRaf2Ref.current) cancelAnimationFrame(renderRaf2Ref.current);
    };
  }, []);


  // Progressive loading states to make initial loading and typing/filtering instantaneous
  const [displayLimit, setDisplayLimit] = useState(60);
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

  const handlePointerDown = React.useCallback((t: Transaction, e: React.PointerEvent) => {
    if (isSelectionMode) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    clearHoldTimer();
    wasLongPressRef.current = false;
    
    holdTimeoutRef.current = setTimeout(() => {
      wasLongPressRef.current = true;
      setPreviewTx(t);
    }, 350); 
  }, [isSelectionMode]);

  const handlePointerUpOrLeave = React.useCallback(() => {
    clearHoldTimer();
    setPreviewTx(null);
  }, []);

  const handleToggleSelection = React.useCallback((id: string) => {
    setSelectedTxIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const handleSetSearchQuery = useCallback((q: string) => {
    setSearchQuery(q);
  }, []);

  const handleSetSelectedAccountId = useCallback((id: string) => {
    setSelectedAccountId(id);
  }, []);

  const handleSetDeleteTarget = useCallback((target: any) => {
    setDeleteTarget(target);
  }, []);

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
            : (typeof a.type === 'string' ? a.type.replace('_', ' ') : 'ACCOUNT');

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

  // Precompute set of deleted debt IDs for instant O(1) membership check
  const deletedDebtIds = useMemo(() => {
    const set = new Set<string>();
    (debts || []).forEach(d => {
      if (d.isDeleted) set.add(d.id);
    });
    return set;
  }, [debts]);

  // Filter transactions with highly optimized precomputations
  const filteredTransactions = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    const hasSearch = q.length > 0;

    // Requirement: When searching, do not show any transactions before user enters anything, and only show matching records
    if (isSearchActive && !hasSearch) {
      return [];
    }

    let targetAccName: string | undefined;
    let targetCardName: string | undefined;
    if (selectedAccountId !== 'ALL') {
      const acc = accountsMap.get(selectedAccountId);
      if (acc) targetAccName = acc.name.toLowerCase();
      const card = creditCardsMap.get(selectedAccountId);
      if (card) targetCardName = card.name.toLowerCase();
    }

    return transactions.filter(t => {
      if (t.isDeleted) return false;
      if (t.debtId && deletedDebtIds.has(t.debtId)) return false;

      // When searching with query: search across all records (bypassing date restrictions)
      if (isSearchActive && hasSearch) {
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
      } else {
        // Date / Feed Mode Filtering
        if (viewMode === 'calendar') {
          // Calendar View: if specific date selected, filter to that date; otherwise show all of calendarMonth
          if (selectedCalendarDate) {
            if (t.date !== selectedCalendarDate) return false;
          } else {
            if (!t.date.startsWith(calendarMonth)) return false;
          }
        } else {
          // Feed View:
          if (feedScope === 'DAY') {
            const targetDate = customDate || selectedDay;
            if (t.date !== targetDate) return false;
          } else {
            // feedScope === 'ALL': user loaded all transactions
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
          }
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

      // Account Filter (optimized with pre-fetched accountsMap/creditCardsMap)
      if (selectedAccountId !== 'ALL') {
        const matchesAccId = t.accountId === selectedAccountId || t.toAccountId === selectedAccountId || t.creditCardId === selectedAccountId || t.toCreditCardId === selectedAccountId;
        if (!matchesAccId) {
          const matchesAccName = targetAccName && (
            (t.accountName && t.accountName.toLowerCase() === targetAccName) ||
            (t.toAccountName && t.toAccountName.toLowerCase() === targetAccName)
          );
          const matchesCardName = targetCardName && (
            t.creditCardName && t.creditCardName.toLowerCase() === targetCardName
          );

          if (!matchesAccName && !matchesCardName) {
            return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      // Primary: sort by date descending (newest first)
      const dateCompare = (b.date || '').localeCompare(a.date || '');
      if (dateCompare !== 0) return dateCompare;

      // Secondary: sort by time descending (newest first, supports HH:mm:ss and HH:mm)
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
  }, [
    transactions,
    deferredSearchQuery,
    isSearchActive,
    feedScope,
    selectedDay,
    viewMode,
    selectedCalendarDate,
    calendarMonth,
    selectedAccountId,
    accountsMap,
    creditCardsMap,
    deletedDebtIds,
    dayFilter,
    customDate,
    todayStr,
    yesterdayStr,
    activeMonth,
    selectedType,
    selectedCategoryId,
    selectedTag,
  ]);

  // Reset displayLimit on search / filter changes to keep interactions fluid, then load the rest in smooth batches
  useEffect(() => {
    // When viewing ALL transactions, load completely into memory - do not stagger in 50ms chunks that stutter
    if (feedScope === 'ALL') {
      setDisplayLimit(Infinity);
      setIsFullyLoaded(true);
      return;
    }

    setDisplayLimit(60);
    setIsFullyLoaded(false);

    let currentLimit = 60;
    let timerId: any = null;

    const loadNextBatch = () => {
      if (!isMountedRef.current) return;

      const totalCount = filteredTransactions.length;
      if (currentLimit >= totalCount) {
        setDisplayLimit(Infinity);
        setIsFullyLoaded(true);
        return;
      }

      // Add a chunk of 80 transactions
      currentLimit = Math.min(currentLimit + 80, totalCount);
      setDisplayLimit(currentLimit);

      if (currentLimit < totalCount) {
        timerId = setTimeout(loadNextBatch, 50); // yields event loop back to browser to process tab switches instantly
      } else {
        setDisplayLimit(Infinity);
        setIsFullyLoaded(true);
      }
    };

    // Start progressive loading after a brief pause
    timerId = setTimeout(loadNextBatch, 120);

    return () => {
      clearTimeout(timerId);
    };
  }, [deferredSearchQuery, selectedType, selectedCategoryId, selectedTag, selectedAccountId, dayFilter, activeMonth, viewMode, selectedCalendarDate, filteredTransactions.length, feedScope]);

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

  // Memoized date keys sorted newest first without date object construction overhead
  const dates = useMemo(() => {
    return Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));
  }, [groupedByDate]);

  // The stage-based pipeline inside handleLoadAllTransactions manages the isLoadingAll lifecycle
  // with safe, highly satisfying stages for the user, rendering all elements progressively.

  // Single-pass aggregate stats for current filter
  const { totalExpense, totalIncome } = useMemo(() => {
    let expense = 0;
    let income = 0;
    for (let i = 0; i < filteredTransactions.length; i++) {
      const t = filteredTransactions[i];
      if (t.type === 'EXPENSE') {
        expense += t.amount;
      } else if (
        t.type === 'INCOME' ||
        t.type === 'MONEY_LENT_REPAYMENT' ||
        t.type === 'INVESTMENT_WITHDRAWAL' ||
        t.type === 'REFUND'
      ) {
        income += t.amount;
      }
    }
    return { totalExpense: expense, totalIncome: income };
  }, [filteredTransactions]);

  // Cached format date helper
  const dateTitleCache = useRef<Map<string, string>>(new Map());
  const formatDayTitle = useCallback((dateStr: string) => {
    if (dateStr === todayStr) return 'Today • ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
    if (dateStr === yesterdayStr) return 'Yesterday • ' + new Date(yesterdayStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
    
    let cached = dateTitleCache.current.get(dateStr);
    if (!cached) {
      const d = new Date(dateStr);
      cached = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' });
      dateTitleCache.current.set(dateStr, cached);
    }
    return cached;
  }, [todayStr, yesterdayStr]);

  // Calendar generation for current calendarMonth (supports any previous/future month)
  const calendarDays = useMemo(() => {
    const [year, month] = calendarMonth.split('-').map(Number);
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month, 0).getDate();

    // Map spends per date in this calendarMonth
    const spendPerDate: { [date: string]: number } = {};
    const countPerDate: { [date: string]: number } = {};
    transactions
      .filter(t => !t.isDeleted && t.date.startsWith(calendarMonth))
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
      const dStr = `${calendarMonth}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr: dStr,
        spent: spendPerDate[dStr] || 0,
        count: countPerDate[dStr] || 0,
      });
    }
    return days;
  }, [calendarMonth, transactions]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Transaction Hub
          </h1>
          <p className="text-xs text-slate-500">
            {isSearchActive && searchQuery.trim() === ''
              ? 'Ready to search'
              : isSearchActive
              ? `${filteredTransactions.length} search results`
              : feedScope === 'ALL'
              ? `${filteredTransactions.length} all-time transactions`
              : viewMode === 'calendar'
              ? selectedCalendarDate
                ? `${filteredTransactions.length} transactions on ${selectedCalendarDate}`
                : `Calendar • ${formatMonthTitle(calendarMonth)}`
              : `${filteredTransactions.length} transactions for ${formatDayTitle(selectedDay)}`}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Prominent Button at top of Transaction Hub to Load & View All Transactions / Switch to Day Feed */}
          {feedScope === 'DAY' ? (
            <button
              type="button"
              onClick={handleLoadAllTransactions}
              className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
              title="Load all historical transactions across all dates"
            >
              <Layers size={14} />
              <span>Load All Transactions</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelLoadAll}
              className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
              title="Switch back to Day Feed"
            >
              <CalendarDays size={14} />
              <span>Switch to Day Feed</span>
            </button>
          )}

          {/* View Mode Toggle: Day Feed vs Daily Calendar */}
          <div className="flex items-center space-x-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => {
                setViewMode('feed');
              }}
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
              onClick={() => {
                setViewMode('calendar');
              }}
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
              onFocus={() => setIsSearchActive(true)}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (!isSearchActive) setIsSearchActive(true);
              }}
              placeholder="Search merchant, notes, tags (#fuel)..."
              className="w-full pl-9 pr-16 py-2 rounded-2xl bg-slate-100 dark:bg-slate-850 border border-transparent focus:border-emerald-500/50 focus:bg-white dark:focus:bg-slate-900 text-xs sm:text-sm outline-none transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Clear
              </button>
            ) : isSearchActive ? (
              <button
                type="button"
                onClick={() => {
                  setIsSearchActive(false);
                  if (searchInputRef.current) searchInputRef.current.blur();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            ) : null}
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
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
              title="Scroll to bottom of transaction feed list"
            >
              <ChevronRight size={13} className="rotate-90 text-emerald-500" />
              <span>Go to Bottom</span>
            </button>
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

      {/* Day Feed Navigator Bar (for Day Feed mode when not searching) */}
      {feedScope === 'DAY' && viewMode === 'feed' && !isSearchActive && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-3 sm:p-3.5 border border-slate-200/70 dark:border-slate-700/70 shadow-xs flex items-center justify-between gap-2">
          {/* Previous Day */}
          <button
            type="button"
            onClick={() => setSelectedDay(prev => shiftDay(prev, -1))}
            className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
            title="Go to Previous Day"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Prev Day</span>
          </button>

          {/* Current Day Label & Quick Today / Picker */}
          <div className="flex items-center space-x-2">
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Day Feed
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                {formatDayTitle(selectedDay)}
              </span>
            </div>

            {selectedDay !== todayStr && (
              <button
                type="button"
                onClick={() => setSelectedDay(todayStr)}
                className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold transition-all cursor-pointer active:scale-95"
                title="Jump to Today"
              >
                Today
              </button>
            )}

            <div className="w-8">
              <CustomDatePicker
                value={selectedDay}
                onChange={d => {
                  if (d) setSelectedDay(d);
                }}
                size="sm"
              />
            </div>
          </div>

          {/* Next Day */}
          <button
            type="button"
            onClick={() => setSelectedDay(prev => shiftDay(prev, 1))}
            className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
            title="Go to Next Day"
          >
            <span className="hidden sm:inline">Next Day</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* All Transactions Active Banner */}
      {feedScope === 'ALL' && viewMode === 'feed' && !isSearchActive && (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-3xl p-3 px-4 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              Loaded All Transactions ({filteredTransactions.length} all-time)
            </span>
          </div>
          <button
            type="button"
            onClick={handleCancelLoadAll}
            className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Return to Day Feed
          </button>
        </div>
      )}

      {/* VIEW MODE 1: Interactive Calendar Matrix */}
      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3 animate-in fade-in-50">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setCalendarMonth(prev => shiftMonth(prev, -1));
                  setSelectedCalendarDate('');
                }}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer active:scale-95"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="text-center min-w-[130px]">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {formatMonthTitle(calendarMonth)}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCalendarMonth(prev => shiftMonth(prev, 1));
                  setSelectedCalendarDate('');
                }}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer active:scale-95"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>

              {calendarMonth !== (activeMonth || todayStr.substring(0, 7)) && (
                <button
                  type="button"
                  onClick={() => {
                    setCalendarMonth(activeMonth || todayStr.substring(0, 7));
                    setSelectedCalendarDate('');
                  }}
                  className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer"
                  title="Jump to Current Month"
                >
                  Current
                </button>
              )}
            </div>

            {selectedCalendarDate ? (
              <button
                type="button"
                onClick={() => setSelectedCalendarDate('')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Clear Day Selection
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Tap day to view
              </span>
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
                  className={`h-14 p-1 rounded-2xl flex flex-col items-center justify-between border transition-all text-center relative cursor-pointer active:scale-95 ${
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

          {/* Sub-label under Calendar Grid */}
          <div className="flex items-center justify-between pt-1 px-1 text-xs text-slate-500 dark:text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-750">
            {selectedCalendarDate ? (
              <span>Showing transactions for {formatDayTitle(selectedCalendarDate)}</span>
            ) : (
              <span>All {formatMonthTitle(calendarMonth)} Transactions ({filteredTransactions.length})</span>
            )}
            {selectedCalendarDate && (
              <button
                type="button"
                onClick={() => setSelectedCalendarDate('')}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
              >
                View all month
              </button>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2 & LIST: Grouped Transaction Feed / Search Prompt / Shimmer Loading */}
      {isSearchActive && searchQuery.trim() === '' ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-10 border border-slate-200/70 dark:border-slate-700/70 shadow-sm text-center space-y-4 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-100 dark:border-emerald-800/50">
            <Search size={28} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Type to Search Transactions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
              No transactions loaded yet. Enter a merchant name, note, tag, category, or amount to find matching records.
            </p>
          </div>

          {/* Quick Filter Tag Suggestions */}
          <div className="pt-3 max-w-md mx-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2.5">
              Instant Search Suggestions
            </span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {['Food & Dining', 'Groceries', 'Salary', 'UPI', 'Transfer', 'Amazon', 'Fuel', 'Shopping', 'Swiggy', 'Zomato'].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSearchQuery(chip)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-750 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-300 transition-all cursor-pointer active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSearchActive(false);
                setSearchQuery('');
                if (searchInputRef.current) searchInputRef.current.blur();
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
            >
              Exit Search & Return to Feed
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Animated Loading Indicator & Skeleton while Loading All Transactions */}
          {isLoadingAll && (
            <div className="space-y-3 py-2 animate-in fade-in duration-200">
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-spin shrink-0">
                    <Loader2 size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>Loading All Transactions</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-normal leading-relaxed font-sans">
                      {loadingStage === 1 && "Stage 1/4: Securing database handshake & parsing storage partitions..."}
                      {loadingStage === 2 && `Stage 2/4: Loading and indexing database files...`}
                      {loadingStage === 3 && `Stage 3/4: Organizing daily balance matrices and grouping active transactions...`}
                      {loadingStage === 4 && `Stage 4/4: Constructing list cards & finalizing high-fidelity styles...`}
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {loadingStage === 1 && "Verifying ledger authentication indices... [Starting]"}
                      {loadingStage === 2 && `Indexed ${liveCount} of ${actualTotalCount} transactions...`}
                      {loadingStage === 3 && `Organized across ${liveDates} of ${actualTotalDates} dates...`}
                      {loadingStage === 4 && (liveRenderedCount >= actualTotalCount ? `Completed! Rendered ${actualTotalCount} list items.` : `Rendering ${liveRenderedCount} of ${actualTotalCount} list items...`)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelLoadAll}
                  className="self-start sm:self-center px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs border border-slate-300 dark:border-slate-600 cursor-pointer active:scale-95 shrink-0"
                  title="Stop loading and return to Day Feed"
                >
                  <X size={15} />
                  <span>Stop Loading</span>
                </button>
              </div>

              {/* Shimmer Skeleton Cards */}
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map(k => (
                  <div
                    key={k}
                    className="p-3.5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs flex items-center justify-between animate-pulse"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                      <div className="space-y-1.5">
                        <div className="w-32 h-3.5 bg-slate-200 dark:bg-slate-700 rounded-md" />
                        <div className="w-20 h-2.5 bg-slate-100 dark:bg-slate-750 rounded-md" />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-right">
                      <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded-md ml-auto" />
                      <div className="w-10 h-2.5 bg-slate-100 dark:bg-slate-750 rounded-md ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions Feed: Held offscreen until all transactions are 100% rendered */}
          <div className={isLoadingAll ? 'opacity-0 pointer-events-none fixed -top-[9999px] -left-[9999px] w-full' : 'space-y-4 animate-in fade-in duration-200'}>
            {dates.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200/70 dark:border-slate-700/70 text-center text-slate-400 shadow-sm space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {isSearchActive && searchQuery.trim() !== ''
              ? `No transactions matching "${searchQuery}"`
              : feedScope === 'DAY'
              ? `No transactions on ${formatDayTitle(selectedDay)}`
              : viewMode === 'calendar' && selectedCalendarDate
              ? `No transactions on ${formatDayTitle(selectedCalendarDate)}`
              : 'No transactions found for the selected filter'}
          </p>
          <p className="text-xs text-slate-500">
            {isSearchActive
              ? 'Try checking spelling or searching for a different keyword'
              : feedScope === 'DAY'
              ? 'Use the Prev / Next Day buttons to navigate, or add a transaction for this day.'
              : 'Try changing the date filter or criteria'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            {feedScope === 'DAY' && selectedDay !== todayStr && (
              <button
                type="button"
                onClick={() => setSelectedDay(todayStr)}
                className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
              >
                Go to Today
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenAdd()}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Add New Transaction
            </button>
          </div>
        </div>
      ) : (
        dates.map((dateStr, dIdx) => {
          const dayItems = [...groupedByDate[dateStr]].sort((a, b) => {
            const timeA = a.time || '00:00:00';
            const timeB = b.time || '00:00:00';
            
            // Primary sort by time of day descending (newest time first)
            const timeCompare = timeB.localeCompare(timeA);
            if (timeCompare !== 0) {
              return timeCompare;
            }

            // Fallback to timestamp / createdAt if times are identical
            const tsA = a.timestamp || a.createdAt || 0;
            const tsB = b.timestamp || b.createdAt || 0;
            if (tsA && tsB && tsA !== tsB) {
              return tsB - tsA;
            }
            
            return (b.id || '').localeCompare(a.id || '');
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
              key={dateStr}
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
                  
                  return (
                    <TransactionRow
                      key={t.id}
                      t={t}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedTxIds.has(t.id)}
                      onPointerDown={handlePointerDown}
                      onPointerUpOrLeave={handlePointerUpOrLeave}
                      wasLongPressRef={wasLongPressRef}
                      onSelectTransaction={onSelectTransaction}
                      onToggleSelection={handleToggleSelection}
                      setSearchQuery={handleSetSearchQuery}
                      setSelectedAccountId={handleSetSelectedAccountId}
                      onEditTransaction={onEditTransaction}
                      onSetDeleteTarget={handleSetDeleteTarget}
                      categoriesMap={categoriesMap}
                      accountsMap={accountsMap}
                      creditCardsMap={creditCardsMap}
                      investmentsMap={investmentsMap}
                      goalsMap={goalsMap}
                      debtsMap={debtsMap}
                    />
                  );

                })}
              </div>
            </div>
          );
        })
      )}
            {/* Go to Top Button at the Bottom of Transactions Feed */}
            {dates.length > 0 && (
              <div className="flex justify-center pt-6 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  <ChevronRight size={13} className="-rotate-90 text-emerald-500 font-extrabold" />
                  <span>Go to Top</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progressive loading feedback indicator and sentinel */}
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
        const previewCat = previewTx.categoryId ? categoriesMap.get(previewTx.categoryId) : undefined;
        const isIncome = previewTx.type === 'INCOME' || previewTx.type === 'MONEY_LENT_REPAYMENT' || previewTx.type === 'INVESTMENT_WITHDRAWAL' || previewTx.type === 'REFUND';
        const isTransfer = previewTx.type === 'TRANSFER' || previewTx.type === 'CARD_PAYMENT' || previewTx.type === 'INVESTMENT_CONTRIBUTION';
        
        // Resolve accounts/cards/payment apps using O(1) maps
        const resolvedAccountName = previewTx.accountName || (previewTx.accountId ? accountsMap.get(previewTx.accountId)?.name : undefined);
        const resolvedCreditCardName = previewTx.creditCardName || (previewTx.creditCardId ? creditCardsMap.get(previewTx.creditCardId)?.name : undefined);
        const resolvedToAccountName = previewTx.toAccountName || (previewTx.toAccountId ? accountsMap.get(previewTx.toAccountId)?.name : undefined);
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
                  previewTx.type === 'INVESTMENT_CONTRIBUTION' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400' :
                  isTransfer ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' :
                  'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                }`}>
                  {previewTx.type === 'CARD_PAYMENT' ? 'Card Bill' : previewTx.type === 'MONEY_BORROWED' ? 'Borrowed' : previewTx.type === 'MONEY_LENT' ? 'Lent' : previewTx.type === 'INVESTMENT_CONTRIBUTION' ? 'Invest' : isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}
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
                    : 'text-rose-600 dark:text-rose-400'
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
});
