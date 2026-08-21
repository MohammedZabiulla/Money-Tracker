import React, { useState, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Transaction, TransactionType } from '../../types';
import { formatINR } from '../../lib/currency';
import { IconHelper, Category3DIcon, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { CustomDatePicker } from '../common/CustomDatePicker';
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  Tag,
  ChevronDown,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  CalendarDays,
  List,
  Sparkles,
  Paperclip,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  MessageSquareCode,
  Database,
} from 'lucide-react';
import { motion } from 'motion/react';
import { SMSImportModal } from './SMSImportModal';
import { CashewImportModal } from '../more/CashewImportModal';

interface TransactionsViewProps {
  onSelectTransaction: (tx: Transaction) => void;
  onOpenAdd: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onSelectTransaction,
  onOpenAdd,
}) => {
  const { transactions, categories, accounts, creditCards, paymentApps, activeMonth, setActiveMonth } = useMoney();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [showSMSModal, setShowSMSModal] = useState<boolean>(false);
  const [showCashewModal, setShowCashewModal] = useState<boolean>(false);
  
  // Day filter state: 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'
  const [dayFilter, setDayFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState<string>('');
  
  // View mode: 'feed' (Day-by-Day list) | 'calendar' (Interactive Day Matrix)
  const [viewMode, setViewMode] = useState<'feed' | 'calendar'>('feed');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('');

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
        if (t.accountId !== selectedAccountId && t.creditCardId !== selectedAccountId && t.toAccountId !== selectedAccountId) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, searchQuery, selectedType, selectedCategoryId, selectedTag, selectedAccountId, dayFilter, customDate, activeMonth, viewMode, selectedCalendarDate, todayStr, yesterdayStr]);

  // Group transactions by date
  const groupedByDate = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    filteredTransactions.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return groups;
  }, [filteredTransactions]);

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
          {/* Cashew Importer Button */}
          <button
            onClick={() => setShowCashewModal(true)}
            className="px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all shadow-xs"
            title="Import from Cashew App (CSV, SQLite, JSON)"
          >
            <Database size={14} className="text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Cashew Import</span>
          </button>

          {/* Bank SMS Quick Parser Button */}
          <button
            onClick={() => setShowSMSModal(true)}
            className="px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all shadow-xs"
            title="Import Indian Bank SMS Alerts"
          >
            <MessageSquareCode size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">SMS Parser</span>
          </button>

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

      {/* Day Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-3.5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Filter by Day & Period
          </span>
          {dayFilter !== 'ALL' && (
            <button
              onClick={() => {
                setDayFilter('ALL');
                setCustomDate('');
                setSelectedCalendarDate('');
              }}
              className="text-[11px] font-bold text-rose-500 hover:underline flex items-center space-x-0.5"
            >
              <X size={12} />
              <span>Reset Date Filter</span>
            </button>
          )}
        </div>

        {/* Quick Day Selector Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'ALL', label: 'All Days' },
            { id: 'TODAY', label: 'Today' },
            { id: 'YESTERDAY', label: 'Yesterday' },
            { id: 'THIS_WEEK', label: 'This Week' },
            { id: 'THIS_MONTH', label: 'This Month' },
            { id: 'CUSTOM', label: 'Pick Day 📅' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setDayFilter(btn.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                dayFilter === btn.id
                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                  : 'bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Custom Day Picker Input */}
        {dayFilter === 'CUSTOM' && (
          <div className="pt-1 flex flex-wrap items-center gap-2 animate-in fade-in-50">
            <div className="w-56">
              <CustomDatePicker
                value={customDate}
                onChange={d => setCustomDate(d)}
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
        )}

        {/* Search Input and Secondary Filters */}
        <div className="pt-1 space-y-2 border-t border-slate-100 dark:border-slate-700/60">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search merchant, notes, tags (#fuel), bank..."
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-850 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 text-xs sm:text-sm outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1 text-xs items-center">
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

      {/* VIEW MODE 1: Interactive Calendar Matrix */}
      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3 animate-in fade-in-50">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Daily Calendar Spend Map
              </h3>
              <p className="text-[11px] text-slate-500">
                Tap on any date to inspect transactions for that day
              </p>
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
        dates.map(dateStr => {
          const dayItems = groupedByDate[dateStr];
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
                {dayItems.map(t => {
                  const isIncome = t.type === 'INCOME' || t.type === 'MONEY_LENT_REPAYMENT' || t.type === 'INVESTMENT_WITHDRAWAL';
                  const isTransfer = t.type === 'TRANSFER' || t.type === 'CARD_PAYMENT' || t.type === 'INVESTMENT_CONTRIBUTION';
                  const cat = categories.find(c => c.id === t.categoryId);
                  const acc = accounts.find(a => a.id === t.accountId);
                  const card = creditCards.find(c => c.id === t.creditCardId);
                  const toAcc = accounts.find(a => a.id === t.toAccountId);
                  const accentColor = card ? card.color || '#9333ea' : acc ? acc.color || '#10b981' : '#64748b';

                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectTransaction(t)}
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 px-2 rounded-2xl transition-colors group"
                    >
                      {/* Left: 3D Category Icon + Merchant & Badges */}
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="relative shrink-0">
                          <Category3DIcon
                            name={cat?.icon || (isIncome ? 'ArrowDownLeft' : isTransfer ? 'ArrowRightLeft' : 'Receipt')}
                            categoryName={t.categoryName || cat?.name}
                            color={cat?.color || (isIncome ? '#10b981' : '#64748b')}
                            size="md"
                            glow={true}
                            interactive={true}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {t.merchantName || t.categoryName || t.notes || 'Transaction'}
                            </p>
                            {t.receiptUrl && (
                              <Paperclip size={12} className="text-slate-400 shrink-0" title="Has receipt photo" />
                            )}
                          </div>

                          {/* Detail Badges: Category, Subcategory, Splits, 3D Payment App, 3D Bank/Card */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {t.splits && t.splits.length > 0 ? `Split (${t.splits.length} items)` : (t.categoryName || t.type)}
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
                              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                                <PaymentApp3DIcon name={t.paymentAppName} size="xs" glow={false} />
                                <span>{t.paymentAppName}</span>
                              </span>
                            )}

                            {/* Mini 3D Bank / Card Badge */}
                            {(t.accountName || t.creditCardName) && (
                              <span
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
                                <span>
                                  {t.type === 'TRANSFER' && t.toAccountName
                                    ? `${t.accountName} ➔ ${t.toAccountName}`
                                    : t.creditCardName || t.accountName}
                                </span>
                              </span>
                            )}

                            {/* Tags */}
                            {(t.tags || []).slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Time */}
                      <div className="text-right shrink-0 pl-3">
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
                        <span className="text-[10px] text-slate-400 font-medium">
                          {t.time || '12:00'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* SMS Import Modal */}
      <SMSImportModal
        isOpen={showSMSModal}
        onClose={() => setShowSMSModal(false)}
      />

      {/* Cashew Import Modal */}
      <CashewImportModal
        isOpen={showCashewModal}
        onClose={() => setShowCashewModal(false)}
      />
    </div>
  );
};
