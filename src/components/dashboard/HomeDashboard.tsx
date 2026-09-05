import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { formatINR, formatCompactINR, format12HourTime } from '../../lib/currency';
import { IconHelper, Category3DIcon, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import { Transaction, TransactionType, Account, CreditCard, DebtRecord } from '../../types';
import { calculateMonthlyCommitment, formatDueBadge } from '../../lib/recurringEngine';
import { RecurringManagementModal } from '../recurring/RecurringManagementModal';
import { SubscriptionManagementModal } from '../subscriptions/SubscriptionManagementModal';
import { GoalManagementModal } from '../goals/GoalManagementModal';
import { InvestmentManagementModal } from '../investments/InvestmentManagementModal';
import { LentBorrowedManagementModal } from '../debts/LentBorrowedManagementModal';
import { LoanManagementModal } from '../more/LoanManagementModal';
import { AccountTransactionsModal } from '../accounts/AccountTransactionsModal';
import { CategoryTransactionsModal } from '../categories/CategoryTransactionsModal';
import { ArrangeAccountsModal } from '../accounts/ArrangeAccountsModal';
import { ArrangeCardsModal } from '../accounts/ArrangeCardsModal';
import { CARD_THEMES, INDIAN_BANKS, getBankTheme, BANK_ACCOUNT_THEMES } from '../../lib/constants';
import { getThemedCardStyle } from '../../lib/colorPalettes';
import { NetworkLogo } from '../common/CardVisual';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  CreditCard as CreditCardIcon,
  TrendingUp,
  HandCoins,
  ChevronRight,
  ChevronDown,
  Check,
  Sparkles,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Eye,
  EyeOff,
  PieChart,
  BarChart3,
  BarChart2,
  Layers,
  ShoppingBag,
  Clock,
  ArrowRight,
  Repeat,
  Zap,
  Activity,
  Smartphone,
  Landmark,
  Wallet,
  Receipt,
  Plus,
  ArrowUpDown,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { SpendsPieChart } from '../insights/charts/SpendsPieChart';
import { CategoryBarChart } from '../insights/charts/CategoryBarChart';
import { DailySpendTrendChart } from '../insights/charts/DailySpendTrendChart';
import { CashflowComparisonChart } from '../insights/charts/CashflowComparisonChart';
import { PaymentChannelChart } from '../insights/charts/PaymentChannelChart';

interface HomeDashboardProps {
  initialSubtab?: 'overview' | 'insights';
  onOpenAdd: (initialType?: TransactionType, accountId?: string) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onViewAllTransactions: () => void;
  onNavigateToAccountTransactions?: (accountId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = React.memo(({
  initialSubtab = 'overview',
  onOpenAdd,
  onSelectTransaction,
  onViewAllTransactions,
  onNavigateToAccountTransactions,
  onNavigateTab,
}) => {
  const {
    summary,
    categorySpending,
    budgets,
    subscriptions,
    recurring,
    goals,
    investments,
    debts,
    loans,
    transactions,
    activeMonth,
    accounts,
    categories,
    creditCards,
    paymentApps,
    triggerManualRecurringExecution,
    reorderAccounts,
    reorderCreditCards,
  } = useMoney();
  const [activeView, setActiveView] = useState<'overview' | 'insights'>(initialSubtab);
  const [insightsSection, setInsightsSection] = useState<'spending' | 'cashflow' | 'networth'>('spending');
  const [chartVisualType, setChartVisualType] = useState<'pie' | 'bar' | 'trend' | 'channel'>('pie');
  const [showBalance, setShowBalance] = useState(true);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showLentBorrowedModal, setShowLentBorrowedModal] = useState(false);
  const [lentBorrowedModalInitialTab, setLentBorrowedModalInitialTab] = useState<'ALL' | 'LENT' | 'BORROWED' | 'SETTLED' | 'ADD'>('ALL');
  const [lentBorrowedSettlingDebt, setLentBorrowedSettlingDebt] = useState<DebtRecord | null>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [financialTab, setFinancialTab] = useState<'GOALS' | 'INVESTMENTS' | 'DEBTS' | 'LOANS'>('GOALS');
  const [commitmentTab, setCommitmentTab] = useState<'RECURRING' | 'SUBSCRIPTIONS'>('RECURRING');
  const [recurringModalInitialCreate, setRecurringModalInitialCreate] = useState(false);
  const [statementAccount, setStatementAccount] = useState<Account | null>(null);
  const [statementCard, setStatementCard] = useState<CreditCard | null>(null);
  const [selectedCategoryForLedger, setSelectedCategoryForLedger] = useState<{
    categoryId: string;
    categoryName: string;
    icon?: string;
    color?: string;
    totalAmount?: number;
  } | null>(null);

  // Non-deleted financial suite items
  const nonDeletedGoals = useMemo(() => (goals || []).filter(g => !g.isDeleted && g.status !== 'CLOSED'), [goals]);
  const nonDeletedInvestments = useMemo(() => (investments || []).filter(i => !i.isDeleted), [investments]);
  const activeDebts = useMemo(() => (debts || []).filter(d => !d.isDeleted && !d.isSettled && (d.remainingAmount === undefined || d.remainingAmount > 0)), [debts]);
  const settledDebtsCount = useMemo(() => (debts || []).filter(d => !d.isDeleted && (d.isSettled || (d.remainingAmount !== undefined && d.remainingAmount <= 0))).length, [debts]);
  const nonDeletedLoans = useMemo(() => (loans || []).filter(l => !l.isDeleted), [loans]);

  // Filter & Sort State for My Accounts & Cards Widget
  const [accountFilter, setAccountFilter] = useState<'ALL' | 'CARD' | 'BANK' | 'WALLET'>('ALL');
  const [accountSort, setAccountSort] = useState<'CUSTOM' | 'BALANCE_DESC' | 'BALANCE_ASC' | 'NAME_ASC'>('CUSTOM');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [showArrangeModal, setShowArrangeModal] = useState<'ACCOUNTS' | 'CARDS' | null>(null);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    if (isSortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortDropdownOpen]);

  useEffect(() => {
    if (initialSubtab) {
      setActiveView(initialSubtab);
    }
  }, [initialSubtab]);

  // Combined Active Recurring & Subscriptions
  const activeRecurringRules = useMemo(() => (recurring || []).filter(r => !r.isDeleted && r.isActive), [recurring]);
  const activeSubscriptions = useMemo(() => (subscriptions || []).filter(s => !s.isDeleted && s.isActive), [subscriptions]);

  const unifiedUpcomingList = useMemo(() => {
    const recItems = activeRecurringRules.map(r => ({
      id: r.id,
      name: r.name,
      amount: r.amount,
      type: r.type,
      frequency: r.frequency,
      nextDueDate: r.nextDueDate || r.startDate || new Date().toISOString().substring(0, 10),
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      accountName: r.accountName,
      creditCardName: r.creditCardName,
      isSubscription: false,
      icon: undefined as string | undefined,
      color: undefined as string | undefined,
    }));

    const subItems = activeSubscriptions.map(s => ({
      id: s.id,
      name: s.name,
      amount: s.amount,
      type: 'EXPENSE' as TransactionType,
      frequency: s.frequency,
      nextDueDate: s.nextBillingDate || new Date().toISOString().substring(0, 10),
      categoryId: s.categoryId,
      categoryName: s.categoryName || 'Subscriptions',
      accountName: s.accountName,
      creditCardName: s.creditCardName,
      isSubscription: true,
      icon: s.icon,
      color: s.color,
    }));

    return [...recItems, ...subItems]
      .sort((a, b) => (a.nextDueDate || '').localeCompare(b.nextDueDate || ''))
      .slice(0, 5);
  }, [activeRecurringRules, activeSubscriptions]);

  const monthlyCommitment = calculateMonthlyCommitment(
    (recurring || []).filter(r => !r.isDeleted),
    subscriptions || []
  );

  // Compute daily average spend for the active month (assume 30 days)
  const dailyAverage = summary.monthlyExpenses / 30;

  // Find top merchants
  const merchantTotals: { [name: string]: number } = {};
  transactions
    .filter(t => !t.isDeleted && t.type === 'EXPENSE' && t.date.startsWith(activeMonth))
    .forEach(t => {
      const name = t.merchantName || t.categoryName || 'Other';
      merchantTotals[name] = (merchantTotals[name] || 0) + t.amount;
    });

  const topMerchants = Object.entries(merchantTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Filtered & Sorted Accounts and Credit Cards List
  const nonDeletedAccounts = useMemo(() => accounts.filter(a => !a.isDeleted), [accounts]);
  const nonDeletedCards = useMemo(() => creditCards.filter(c => !c.isDeleted), [creditCards]);

  const bankAccounts = useMemo(() => nonDeletedAccounts.filter(a => a.type !== 'WALLET' && a.type !== 'CASH'), [nonDeletedAccounts]);
  const walletAccounts = useMemo(() => nonDeletedAccounts.filter(a => a.type === 'WALLET' || a.type === 'CASH'), [nonDeletedAccounts]);

  const totalBankBalance = useMemo(() => bankAccounts.reduce((sum, a) => sum + a.calculatedBalance, 0), [bankAccounts]);
  const totalWalletBalance = useMemo(() => walletAccounts.reduce((sum, a) => sum + a.calculatedBalance, 0), [walletAccounts]);
  const totalCardOutstanding = useMemo(() => nonDeletedCards.reduce((sum, c) => sum + c.currentOutstanding, 0), [nonDeletedCards]);

  // Transaction Count per Account / Card
  const txCountPerAccount = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.isDeleted) return;
      if (t.accountId) {
        counts[t.accountId] = (counts[t.accountId] || 0) + 1;
      }
      if (t.toAccountId && t.toAccountId !== t.accountId) {
        counts[t.toAccountId] = (counts[t.toAccountId] || 0) + 1;
      }
      if (t.creditCardId) {
        counts[t.creditCardId] = (counts[t.creditCardId] || 0) + 1;
      }
    });
    return counts;
  }, [transactions]);

  interface DisplayItem {
    id: string;
    kind: 'BANK' | 'CARD' | 'WALLET' | 'CASH' | 'FD';
    name: string;
    institution: string;
    lastDigits?: string;
    balanceOrOutstanding: number;
    color?: string;
    typeBadge: string;
    isCard: boolean;
    network?: string;
    account?: Account;
    card?: CreditCard;
  }

  const displayedAccountAndCardItems = useMemo(() => {
    let items: DisplayItem[] = [];

    if (accountFilter === 'ALL' || accountFilter === 'BANK') {
      bankAccounts.forEach(acc => {
        items.push({
          id: acc.id,
          kind: acc.type === 'FIXED_DEPOSIT' ? 'FD' : 'BANK',
          name: acc.name,
          institution: acc.institution,
          lastDigits: acc.accountNumberLast4,
          balanceOrOutstanding: acc.calculatedBalance,
          color: acc.color,
          typeBadge: acc.type === 'FIXED_DEPOSIT' ? 'FD' : acc.type === 'SALARY' ? 'SALARY' : acc.type === 'CURRENT' ? 'CURRENT' : 'SAVINGS',
          isCard: false,
          account: acc,
        });
      });
    }

    if (accountFilter === 'ALL' || accountFilter === 'WALLET') {
      walletAccounts.forEach(acc => {
        items.push({
          id: acc.id,
          kind: acc.type === 'CASH' ? 'CASH' : 'WALLET',
          name: acc.name,
          institution: acc.institution,
          lastDigits: acc.accountNumberLast4,
          balanceOrOutstanding: acc.calculatedBalance,
          color: acc.color,
          typeBadge: acc.type === 'CASH' ? 'CASH' : 'WALLET',
          isCard: false,
          account: acc,
        });
      });
    }

    if (accountFilter === 'ALL' || accountFilter === 'CARD') {
      nonDeletedCards.forEach(card => {
        items.push({
          id: card.id,
          kind: 'CARD',
          name: card.name,
          institution: card.issuer,
          lastDigits: card.lastFourDigits,
          balanceOrOutstanding: card.currentOutstanding,
          color: card.color,
          typeBadge: card.network || 'CARD',
          network: card.network,
          isCard: true,
          card: card,
        });
      });
    }

    // Sorting
    if (accountSort === 'BALANCE_DESC') {
      items.sort((a, b) => b.balanceOrOutstanding - a.balanceOrOutstanding);
    } else if (accountSort === 'BALANCE_ASC') {
      items.sort((a, b) => a.balanceOrOutstanding - b.balanceOrOutstanding);
    } else if (accountSort === 'NAME_ASC') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  }, [accountFilter, accountSort, bankAccounts, walletAccounts, nonDeletedCards]);

  // Friendly encouragement microcopy
  const getEncouragement = () => {
    if (summary.monthlySavings > 0 && summary.savingsRatePercent >= 20) {
      return 'Awesome! You saved over 20% of your earnings this month 🌱';
    }
    if (summary.monthlyIncome > summary.monthlyExpenses) {
      return 'Great job staying within your cashflow this month ✨';
    }
    if (summary.monthlyExpenses > 0) {
      return 'Tracking every rupee brings mindful clarity 🌿';
    }
    return 'Ready to log your day’s transactions 🚀';
  };

  const quickActions = [
    { label: 'Expense', type: 'EXPENSE' as TransactionType, icon: 'ArrowUpRight', categoryKey: 'shopping', color: '#f43f5e' },
    { label: 'Income', type: 'INCOME' as TransactionType, icon: 'ArrowDownLeft', categoryKey: 'salary_income', color: '#10b981' },
    { label: 'Transfer', type: 'TRANSFER' as TransactionType, icon: 'ArrowRightLeft', categoryKey: 'transfer', color: '#3b82f6' },
    { label: 'Card Bill', type: 'CARD_PAYMENT' as TransactionType, icon: 'CreditCard', categoryKey: 'card_payment', color: '#9333ea' },
    { label: 'Invest', type: 'INVESTMENT_CONTRIBUTION' as TransactionType, icon: 'TrendingUp', categoryKey: 'investments_stocks', color: '#059669' },
    { label: 'Lend / Borrow', type: 'MONEY_LENT' as TransactionType, icon: 'HandCoins', categoryKey: 'khata_lent', color: '#f59e0b' },
  ];

  return (
    <div className="space-y-5 pb-24 max-w-2xl mx-auto">
      {/* Top View Selector: Overview vs Insights */}
      <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-2xl backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
        <button
          onClick={() => setActiveView('overview')}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition-all ${
            activeView === 'overview'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers size={15} className="text-emerald-500" />
          <span>Dashboard Overview</span>
        </button>
        <button
          onClick={() => setActiveView('insights')}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition-all ${
            activeView === 'insights'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PieChart size={15} className="text-teal-500" />
          <span>Insights & Analytics</span>
        </button>
      </div>

      {activeView === 'overview' && (
        <div className="space-y-4">
          {/* Friendly Motivation Banner */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-500/20 dark:border-emerald-900/50 rounded-2xl p-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                {getEncouragement()}
              </p>
            </div>
            <button
              onClick={() => setActiveView('insights')}
              className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center space-x-1 shrink-0 shadow-xs cursor-pointer active:scale-95"
            >
              <span>Insights</span>
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Hero Balance Card (Combined Net Worth & Available Balance) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-3.5 sm:p-4 shadow-xl border border-indigo-900/50 group">
            {/* Luminous Top Accent Stripe */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500" />

            {/* Ambient Color Glow Background */}
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <div className="w-5.5 h-5.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-2xs">
                  <Sparkles size={12} />
                </div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Financial Overview
                </span>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="flex items-center space-x-1.5 px-2.5 py-0.5 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all text-xs font-medium text-slate-300 cursor-pointer border border-white/10"
                title="Toggle Visibility"
              >
                {showBalance ? <Eye size={13} /> : <EyeOff size={13} />}
                <span className="text-[11px] font-semibold">{showBalance ? 'Hide' : 'Show'}</span>
              </button>
            </div>

            {/* Dual Metrics: Net Worth & Available Balance in One Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 relative z-10">
              {/* Total Net Worth */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:bg-white/10 transition-colors">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-indigo-300 tracking-wide uppercase">
                      Total Net Worth
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                      Assets − Liab
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1 drop-shadow-sm">
                    {showBalance ? formatINR(summary.netWorth) : '₹••••••••'}
                  </div>
                </div>
                <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300 font-medium">
                  <span>Assets <strong className="text-emerald-400 font-bold">{showBalance ? formatINR(summary.totalAssets) : '••••'}</strong></span>
                  <span className="text-slate-500">•</span>
                  <span>Liab <strong className="text-rose-400 font-bold">{showBalance ? formatINR(summary.totalLiabilities) : '••••'}</strong></span>
                </div>
              </div>

              {/* Available Balance (Liquid Cash) */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-teal-950/30 border border-emerald-500/25 backdrop-blur-md flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-emerald-300 tracking-wide uppercase">
                      Available Balance
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Liquid Cash
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black tracking-tight text-emerald-400 mt-1 drop-shadow-sm">
                    {showBalance ? formatINR(summary.availableBalance) : '₹••••••••'}
                  </div>
                </div>
                <div className="mt-2 pt-1.5 border-t border-emerald-500/20 flex items-center justify-between text-[10px] text-emerald-200/90 font-medium">
                  <span>Banks <strong className="text-white font-bold">{showBalance ? formatINR(totalBankBalance) : '••••'}</strong></span>
                  <span className="text-emerald-600/60">•</span>
                  <span>Wallets <strong className="text-white font-bold">{showBalance ? formatINR(totalWalletBalance) : '••••'}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Transaction Action Buttons with 3D Icons & Vibrant Gradients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Quick Actions
              </span>
              <span className="text-[11px] text-slate-400">Tap to log</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {quickActions.map(action => (
                <button
                  key={action.type}
                  onClick={() => onOpenAdd(action.type)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all active:scale-95 group"
                >
                  <div className="mb-1.5 transition-transform group-hover:scale-110">
                    <Category3DIcon
                      name={action.icon}
                      categoryName={action.label}
                      color={action.color}
                      size="sm"
                      glow={true}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Accounts & Credit Cards Interactive Widget */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3.5">
            {/* Header with Manage Link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs">
                  <Landmark size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    My Accounts & Cards
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setShowArrangeModal(accountFilter === 'CARD' ? 'CARDS' : 'ACCOUNTS')}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center space-x-1"
                  title="Arrange display order"
                >
                  <SlidersHorizontal size={12} />
                  <span>Arrange</span>
                </button>

                <button
                  onClick={() => onNavigateTab('accounts')}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all flex items-center space-x-1 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs cursor-pointer active:scale-95 ml-1"
                  title="Manage all accounts, cards & wallets"
                >
                  <span>Manage</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Quick Filter Buttons & Sort Custom Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
              {/* Category Filter Pills */}
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-750 p-1 pr-2 rounded-2xl border border-slate-200/60 dark:border-slate-700 overflow-x-auto scrollbar-none no-scrollbar max-w-full w-full sm:w-auto shrink-0 flex-nowrap scroll-smooth">
                <button
                  onClick={() => setAccountFilter('ALL')}
                  className={`px-2 sm:px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                    accountFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({nonDeletedAccounts.length + nonDeletedCards.length})
                </button>
                <button
                  onClick={() => setAccountFilter('BANK')}
                  className={`px-2 sm:px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                    accountFilter === 'BANK'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Banks ({bankAccounts.length})
                </button>
                <button
                  onClick={() => setAccountFilter('CARD')}
                  className={`px-2 sm:px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                    accountFilter === 'CARD'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Cards ({nonDeletedCards.length})
                </button>
                <button
                  onClick={() => setAccountFilter('WALLET')}
                  className={`px-2 sm:px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                    accountFilter === 'WALLET'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Wallets ({walletAccounts.length})
                </button>
              </div>

              {/* Themed Custom Sort Dropdown */}
              <div className="relative flex items-center justify-end shrink-0 self-end sm:self-auto" ref={sortDropdownRef}>
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Sort:</span>
                  <button
                    type="button"
                    onClick={() => setIsSortDropdownOpen(prev => !prev)}
                    className="bg-slate-100 dark:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs py-1 px-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all flex items-center space-x-1.5 focus:outline-hidden"
                  >
                    <span>
                      {accountSort === 'CUSTOM'
                        ? 'Default / Arranged'
                        : accountSort === 'BALANCE_DESC'
                        ? 'Highest Balance / Due'
                        : accountSort === 'BALANCE_ASC'
                        ? 'Lowest Balance'
                        : 'Name (A to Z)'}
                    </span>
                    <ChevronDown
                      size={13}
                      className={`text-slate-500 transition-transform duration-200 ${
                        isSortDropdownOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isSortDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-850 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-40 overflow-hidden"
                    >
                      {[
                        { id: 'CUSTOM', label: 'Default / Arranged' },
                        { id: 'BALANCE_DESC', label: 'Highest Balance / Due' },
                        { id: 'BALANCE_ASC', label: 'Lowest Balance' },
                        { id: 'NAME_ASC', label: 'Name (A to Z)' },
                      ].map(opt => {
                        const isSelected = accountSort === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setAccountSort(opt.id as any);
                              setIsSortDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check size={14} className="text-emerald-600 dark:text-emerald-400" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Quick Balances Summary Pills */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Liquid Cash:</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300">{formatINR(totalBankBalance + totalWalletBalance)}</span>
              </div>

              {totalCardOutstanding > 0 && (
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">Total Card Due:</span>
                  <span className="font-extrabold text-amber-700 dark:text-amber-300">{formatINR(totalCardOutstanding)}</span>
                </div>
              )}
            </div>

            {/* Compact Sized Themed Account & Card Carousel Items */}
            {displayedAccountAndCardItems.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-slate-500">No accounts match the selected filter.</p>
              </div>
            ) : (
              <div className="flex space-x-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1">
                {displayedAccountAndCardItems.map((item, idx) => {
                  const isCard = item.isCard;
                  const isPositive = item.balanceOrOutstanding >= 0;

                  if (isCard) {
                    // Credit Card Theme styling
                    const themeKey = item.card?.cardTheme || 'midnight';
                    const theme = CARD_THEMES.find(t => t.id === themeKey) || CARD_THEMES[0];
                    const bankConfig = INDIAN_BANKS.find(b => b.name === item.card?.issuer);

                    return (
                      <div
                        key={`acc_card_item_${item.id}_${idx}`}
                        onClick={() => {
                          if (item.card) {
                            setStatementCard(item.card);
                            setStatementAccount(null);
                          }
                        }}
                        className={`shrink-0 w-46 sm:w-48 p-3 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-98 group flex flex-col justify-between min-h-[142px] relative overflow-hidden bg-gradient-to-br ${theme.gradient} text-white ${theme.border || 'border-white/20'} shadow-md hover:shadow-xl`}
                      >
                        {/* Background holographic sheen & ambient glow */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />

                        <div className="relative z-10">
                          {/* Header: Issuer Logo & Network Badge */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <span
                                className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-xs"
                                style={{ backgroundColor: bankConfig?.color || '#004c8f' }}
                              >
                                {bankConfig?.logoText || item.institution.substring(0, 5)}
                              </span>
                            </div>
                            <NetworkLogo network={item.card?.network || item.network} className="h-3.5" />
                          </div>

                          {/* Card Name & Details */}
                          <div className="mt-2 min-w-0">
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors leading-tight">
                              {item.name}
                            </h4>
                            <p className="text-[10px] text-white/70 truncate mt-0.5 font-medium">
                              {item.institution} {item.lastDigits ? `••${item.lastDigits}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Footer: Due Amount & Txns Pill */}
                        <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between relative z-10">
                          <div className="min-w-0 pr-1">
                            <span className="text-[8.5px] font-semibold text-white/70 block uppercase tracking-wider">
                              Current Due
                            </span>
                            <span className="text-xs sm:text-[13px] font-black text-amber-300 truncate block">
                              {formatINR(item.balanceOrOutstanding)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1 text-[10px] font-bold text-amber-200 bg-white/20 px-2 py-0.5 rounded-lg border border-white/20 shrink-0 group-hover:bg-white/30 transition-colors">
                            <Receipt size={10} />
                            <span>{(txCountPerAccount[item.id] || 0)} {(txCountPerAccount[item.id] || 0) === 1 ? 'Txn' : 'Txns'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Bank Account or Digital Wallet or Cash
                  const isCash = item.kind === 'CASH' || item.account?.type === 'CASH';
                  const isWallet = item.kind === 'WALLET' || item.account?.type === 'WALLET';
                  const bankConfig = INDIAN_BANKS.find(
                    b =>
                      b.name.toLowerCase() === item.institution.toLowerCase() ||
                      b.id === item.institution.toLowerCase()
                  );
                  const bankTheme = getBankTheme(item.account?.accountTheme || bankConfig?.themeId || item.institution);

                  // Gradient selection
                  let containerGradient = bankTheme?.gradient || 'from-[#004c8f] via-[#00386b] to-[#002244]';
                  let brandBadgeBg = bankConfig?.color || bankTheme?.accentColor || '#004c8f';

                  if (isCash) {
                    containerGradient = 'from-[#15803d] via-[#166534] to-[#052e16]';
                    brandBadgeBg = '#16a34a';
                  } else if (isWallet) {
                    const instLower = item.institution.toLowerCase();
                    if (instLower.includes('amazon')) {
                      containerGradient = 'from-[#131921] via-[#232f3e] to-[#0f1111]';
                      brandBadgeBg = '#ff9900';
                    } else if (instLower.includes('paytm')) {
                      containerGradient = 'from-[#002970] via-[#004c8f] to-[#00b9f1]';
                      brandBadgeBg = '#00b9f1';
                    } else if (instLower.includes('phonepe')) {
                      containerGradient = 'from-[#2e0854] via-[#5f259f] to-[#802bb1]';
                      brandBadgeBg = '#5f259f';
                    } else {
                      containerGradient = 'from-[#7c3aed] via-[#5b21b6] to-[#2e1065]';
                      brandBadgeBg = '#8b5cf6';
                    }
                  }

                  return (
                    <div
                      key={`acc_item_${item.id}_${idx}`}
                      onClick={() => {
                        if (item.account) {
                          setStatementAccount(item.account);
                          setStatementCard(null);
                        }
                      }}
                      className={`shrink-0 w-46 sm:w-48 p-3 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-98 group flex flex-col justify-between min-h-[142px] relative overflow-hidden bg-gradient-to-br ${containerGradient} text-white border-white/20 shadow-md hover:shadow-xl`}
                    >
                      {/* Ambient background glow */}
                      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />

                      <div className="relative z-10">
                        {/* Header: Bank Brand Logo & Type Badge */}
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-xs"
                            style={{ backgroundColor: brandBadgeBg }}
                          >
                            {isCash ? 'CASH' : isWallet ? (bankConfig?.logoText || item.institution.substring(0, 6)) : (bankConfig?.logoText || item.institution.substring(0, 5))}
                          </span>
                          <span className="text-[8.5px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-white/20 text-white border border-white/20 tracking-wider">
                            {item.typeBadge}
                          </span>
                        </div>

                        {/* Account Name & Details */}
                        <div className="mt-2 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors leading-tight">
                            {item.name}
                          </h4>
                          <p className="text-[10px] text-white/70 truncate mt-0.5 font-medium">
                            {item.institution} {item.lastDigits ? `••${item.lastDigits}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Footer: Balance Amount & Txns Pill */}
                      <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between relative z-10">
                        <div className="min-w-0 pr-1">
                          <span className="text-[8.5px] font-semibold text-white/70 block uppercase tracking-wider">
                            Balance
                          </span>
                          <span className="text-xs sm:text-[13px] font-black text-white truncate block drop-shadow-xs">
                            {formatINR(item.balanceOrOutstanding)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-200 bg-white/20 px-2 py-0.5 rounded-lg border border-white/20 shrink-0 group-hover:bg-white/30 transition-colors">
                          <Receipt size={10} />
                          <span>{(txCountPerAccount[item.id] || 0)} {(txCountPerAccount[item.id] || 0) === 1 ? 'Txn' : 'Txns'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Goals, Investments, Lent/Borrowed, Loans & EMI Interactive Widget */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold shadow-2xs">
                  {financialTab === 'GOALS' && <Trophy size={16} />}
                  {financialTab === 'INVESTMENTS' && <TrendingUp size={16} />}
                  {financialTab === 'DEBTS' && <HandCoins size={16} />}
                  {financialTab === 'LOANS' && <Landmark size={16} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Goals, Investments & Debt Suite
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => {
                    if (financialTab === 'GOALS') setShowGoalModal(true);
                    else if (financialTab === 'INVESTMENTS') setShowInvestmentModal(true);
                    else if (financialTab === 'DEBTS') setShowLentBorrowedModal(true);
                    else if (financialTab === 'LOANS') setShowLoanModal(true);
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/60 transition-all flex items-center space-x-1 border border-violet-200/60 dark:border-violet-800/60 shadow-2xs cursor-pointer active:scale-95"
                >
                  <span>Manage {financialTab === 'GOALS' ? 'Goals' : financialTab === 'INVESTMENTS' ? 'Investments' : financialTab === 'DEBTS' ? 'Ledger' : 'Loans'}</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Category Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-750 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <button
                onClick={() => setFinancialTab('GOALS')}
                className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  financialTab === 'GOALS'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Trophy size={13} className="text-amber-500" />
                <span>Savings Goal ({nonDeletedGoals.length})</span>
              </button>
              <button
                onClick={() => setFinancialTab('INVESTMENTS')}
                className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  financialTab === 'INVESTMENTS'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp size={13} className="text-emerald-500" />
                <span>Investment ({nonDeletedInvestments.length})</span>
              </button>
              <button
                onClick={() => setFinancialTab('DEBTS')}
                className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  financialTab === 'DEBTS'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <HandCoins size={13} className="text-teal-500" />
                <span>Lent/Borrowed ({activeDebts.length})</span>
              </button>
              <button
                onClick={() => setFinancialTab('LOANS')}
                className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  financialTab === 'LOANS'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Landmark size={13} className="text-amber-600" />
                <span>Loan & EMI ({nonDeletedLoans.length})</span>
              </button>
            </div>

            {/* Cards for Selected Tab */}
            {financialTab === 'GOALS' && (
              nonDeletedGoals.length === 0 ? (<div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <p className="text-xs text-slate-500">No savings goals created yet.</p>
                  <div className="flex justify-center">
                    <button onClick={() => setShowGoalModal(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-all inline-flex items-center space-x-1.5 shadow-xs cursor-pointer active:scale-95">
                      <Plus size={13} />
                      <span>Record Savings Goal</span>
                    </button>
                  </div>
                </div>) : (
                <div className="flex space-x-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1">
                  {nonDeletedGoals.map((g, idx) => {
                    const progress = Math.min(100, Math.round((g.currentAmount / Math.max(1, g.targetAmount)) * 100));
                    const cardStyle = getThemedCardStyle(g.color, '#10B981');
                    return (
                      <div
                        key={`dash_goal_${g.id}_${idx}`}
                        onClick={() => setShowGoalModal(true)}
                        style={cardStyle}
                        className="shrink-0 w-52 p-3.5 rounded-2xl text-white border shadow-md cursor-pointer hover:shadow-xl transition-all flex flex-col justify-between min-h-[130px] relative overflow-hidden"
                      >
                        <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-white/10 blur-lg pointer-events-none" />
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-black/30 text-white/90">
                            {g.category || 'GOAL'}
                          </span>
                          <span className="text-[10px] font-bold text-white/90">{progress}%</span>
                        </div>
                        <div className="mt-2 relative z-10">
                          <h4 className="text-xs font-bold text-white truncate">{g.name}</h4>
                          <p className="text-[10px] text-white/80 mt-0.5">Target: {formatINR(g.targetAmount)}</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/20 relative z-10 flex items-center justify-between">
                          <div>
                            <span className="text-[8.5px] uppercase font-semibold text-white/70">Saved</span>
                            <span className="text-xs font-extrabold text-white">{formatINR(g.currentAmount)}</span>
                          </div>
                          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-lg font-bold">{g.status}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div onClick={() => setShowGoalModal(true)} className="shrink-0 w-32 p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-750 transition-all flex flex-col items-center justify-center min-h-[130px]"><Plus size={24} className="mb-2 text-slate-400" /><span className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center">Record Goal</span></div>
                </div>
              )
            )}

            {financialTab === 'INVESTMENTS' && (
              nonDeletedInvestments.length === 0 ? (<div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <p className="text-xs text-slate-500">No investments added yet.</p>
                  <div className="flex justify-center">
                    <button onClick={() => setShowInvestmentModal(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all inline-flex items-center space-x-1.5 shadow-xs cursor-pointer active:scale-95">
                      <Plus size={13} />
                      <span>Record Investment</span>
                    </button>
                  </div>
                </div>) : (
                <div className="flex space-x-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1">
                  {nonDeletedInvestments.map((inv, idx) => {
                    const gain = inv.currentValue - inv.investedAmount;
                    const gainPct = inv.investedAmount > 0 ? ((gain / inv.investedAmount) * 100).toFixed(1) : '0';
                    const isProfit = gain >= 0;
                    const cardStyle = getThemedCardStyle(inv.color, '#059669');
                    return (
                      <div
                        key={`dash_inv_${inv.id}_${idx}`}
                        onClick={() => setShowInvestmentModal(true)}
                        style={cardStyle}
                        className="shrink-0 w-52 p-3.5 rounded-2xl text-white border shadow-md cursor-pointer hover:shadow-xl transition-all flex flex-col justify-between min-h-[130px] relative overflow-hidden"
                      >
                        <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-white/10 blur-lg pointer-events-none" />
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-black/30 text-white/90">
                            {inv.category}
                          </span>
                          <span className={`text-[10px] font-bold ${isProfit ? 'text-emerald-300' : 'text-rose-300'}`}>
                            {isProfit ? '+' : ''}{gainPct}%
                          </span>
                        </div>
                        <div className="mt-2 relative z-10">
                          <h4 className="text-xs font-bold text-white truncate">{inv.name}</h4>
                          <p className="text-[10px] text-white/80 mt-0.5">Invested: {formatINR(inv.investedAmount)}</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/20 relative z-10 flex items-center justify-between">
                          <div>
                            <span className="text-[8.5px] uppercase font-semibold text-white/70">Current Value</span>
                            <span className="text-xs font-extrabold text-white">{formatINR(inv.currentValue)}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${isProfit ? 'bg-emerald-500/30 text-emerald-200' : 'bg-rose-500/30 text-rose-200'}`}>
                            {isProfit ? 'Profitable' : 'Loss'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div onClick={() => setShowInvestmentModal(true)} className="shrink-0 w-32 p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-750 transition-all flex flex-col items-center justify-center min-h-[130px]"><Plus size={24} className="mb-2 text-slate-400" /><span className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center">Record Investment</span></div>
                </div>
              )
            )}

            {financialTab === 'DEBTS' && (
              activeDebts.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    {settledDebtsCount > 0
                      ? 'All lent & borrowed records are currently settled!'
                      : 'No active lent or borrowed records found.'}
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLentBorrowedModalInitialTab('ADD');
                        setLentBorrowedSettlingDebt(null);
                        setShowLentBorrowedModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition-all inline-flex items-center space-x-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      <Plus size={13} />
                      <span>Record Lent / Borrow</span>
                    </button>
                    {settledDebtsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setLentBorrowedModalInitialTab('SETTLED');
                          setLentBorrowedSettlingDebt(null);
                          setShowLentBorrowedModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all inline-flex items-center space-x-1.5 cursor-pointer active:scale-95"
                      >
                        <span>Settled History ({settledDebtsCount})</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex space-x-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1 items-stretch">
                  {activeDebts.map((d, idx) => {
                    const isLent = d.type === 'LENT';
                    const defaultDebtColor = isLent ? '#0D9488' : '#4F46E5';
                    const cardStyle = getThemedCardStyle(d.color, defaultDebtColor);
                    return (
                      <div
                        key={`dash_debt_${d.id}_${idx}`}
                        onClick={() => {
                          setLentBorrowedModalInitialTab(isLent ? 'LENT' : 'BORROWED');
                          setLentBorrowedSettlingDebt(null);
                          setShowLentBorrowedModal(true);
                        }}
                        style={cardStyle}
                        className="shrink-0 w-56 sm:w-60 p-3.5 rounded-2xl text-white border shadow-md cursor-pointer hover:shadow-xl transition-all flex flex-col justify-between min-h-[142px] relative overflow-hidden group"
                      >
                        <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-white/10 blur-lg pointer-events-none" />
                        
                        {/* Header Tag & Status */}
                        <div className="relative z-10 flex items-center justify-between">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-black/30 backdrop-blur-xs ${isLent ? 'text-teal-300' : 'text-indigo-300'}`}>
                            {isLent ? '💸 Lent' : '🤝 Borrowed'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/20 text-slate-100">
                            {d.status || 'Active'}
                          </span>
                        </div>

                        {/* Person Name & Total */}
                        <div className="mt-2 relative z-10">
                          <h4 className="text-xs font-bold text-white truncate">{d.personName}</h4>
                          <div className="flex items-center justify-between mt-0.5 text-[10px] text-slate-300">
                            <span>Total: {formatINR(d.amount)}</span>
                            {d.dueDate && (
                              <span className="text-[9.5px] text-slate-300/90">
                                Due: {new Date(d.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Footer with Balance & Interactive Action Button */}
                        <div className="mt-2.5 pt-2 border-t border-white/20 relative z-10 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[8.5px] uppercase font-semibold text-slate-300 block leading-tight">
                              Pending
                            </span>
                            <span className="text-xs font-extrabold text-white">
                              {formatINR(d.remainingAmount ?? d.amount)}
                            </span>
                          </div>

                          {/* Button on the Lent Card */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLentBorrowedModalInitialTab(isLent ? 'LENT' : 'BORROWED');
                              setLentBorrowedSettlingDebt(d);
                              setShowLentBorrowedModal(true);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all flex items-center space-x-1 shrink-0 shadow-xs cursor-pointer active:scale-95 ${
                              isLent
                                ? 'bg-teal-300 hover:bg-teal-200 text-slate-950 font-black shadow-md'
                                : 'bg-indigo-300 hover:bg-indigo-200 text-slate-950 font-black shadow-md'
                            }`}
                          >
                            <span>{isLent ? 'Settle / Return' : 'Settle / Pay'}</span>
                            <ArrowRight size={11} className="stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add New Quick Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setLentBorrowedModalInitialTab('ADD');
                      setLentBorrowedSettlingDebt(null);
                      setShowLentBorrowedModal(true);
                    }}
                    className="shrink-0 w-28 sm:w-32 p-3.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 bg-slate-50/60 dark:bg-slate-850/60 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform flex items-center justify-center">
                      <Plus size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-center leading-tight">Add Entry</span>
                  </button>
                </div>
              )
            )}

            {financialTab === 'LOANS' && (
              nonDeletedLoans.length === 0 ? (<div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <p className="text-xs text-slate-500">No loans or EMIs added yet.</p>
                  <div className="flex justify-center">
                    <button onClick={() => setShowLoanModal(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-600 text-white transition-all inline-flex items-center space-x-1.5 shadow-xs cursor-pointer active:scale-95">
                      <Plus size={13} />
                      <span>Record Loan & EMI</span>
                    </button>
                  </div>
                </div>) : (
                <div className="flex space-x-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1">
                  {nonDeletedLoans.map((l, idx) => {
                    const cardStyle = getThemedCardStyle(l.color, '#B45309');
                    return (
                      <div
                        key={`dash_loan_${l.id}_${idx}`}
                        onClick={() => setShowLoanModal(true)}
                        style={cardStyle}
                        className="shrink-0 w-52 p-3.5 rounded-2xl text-white border shadow-md cursor-pointer hover:shadow-xl transition-all flex flex-col justify-between min-h-[130px] relative overflow-hidden"
                      >
                        <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-white/10 blur-lg pointer-events-none" />
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-black/30 text-white/90">
                            {l.lenderName || 'LOAN'}
                          </span>
                          <span className="text-[10px] font-bold text-white/90">{l.interestRate}% p.a.</span>
                        </div>
                        <div className="mt-2 relative z-10">
                          <h4 className="text-xs font-bold text-white truncate">{l.name}</h4>
                          <p className="text-[10px] text-white/80 mt-0.5">EMI: {formatINR(l.emiAmount)}/mo</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/20 relative z-10 flex items-center justify-between">
                          <div>
                            <span className="text-[8.5px] uppercase font-semibold text-white/70">Outstanding</span>
                            <span className="text-xs font-extrabold text-white">{formatINR(l.outstandingPrincipal)}</span>
                          </div>
                          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-lg font-bold">Active</span>
                        </div>
                      </div>
                    );
                  })}
                  <div onClick={() => setShowLoanModal(true)} className="shrink-0 w-32 p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-750 transition-all flex flex-col items-center justify-center min-h-[130px]"><Plus size={24} className="mb-2 text-slate-400" /><span className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center">Record Loan</span></div>
                </div>
              )
            )}
          </div>

          {/* Upcoming Recurring & Subscription Bills Section */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-2xs">
                  {commitmentTab === 'RECURRING' ? <Repeat size={16} /> : <Layers size={16} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Upcoming Recurring & Subscriptions
                  </h3>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => {
                    if (commitmentTab === 'RECURRING') {
                      setRecurringModalInitialCreate(false);
                      setShowRecurringModal(true);
                    } else if (commitmentTab === 'SUBSCRIPTIONS') {
                      setShowSubscriptionModal(true);
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all flex items-center space-x-1 border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs cursor-pointer active:scale-95"
                >
                  <span className="hidden sm:inline">Manage {commitmentTab === 'RECURRING' ? 'Recurring' : 'Subscriptions'}</span>
                  <span className="sm:hidden">Manage</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Category Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-750 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <button
                onClick={() => setCommitmentTab('RECURRING')}
                className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  commitmentTab === 'RECURRING'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Repeat size={13} className="text-indigo-500" />
                <span>Recurring ({activeRecurringRules.length})</span>
              </button>
              <button
                onClick={() => setCommitmentTab('SUBSCRIPTIONS')}
                className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  commitmentTab === 'SUBSCRIPTIONS'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers size={13} className="text-violet-500" />
                <span>Subscriptions ({activeSubscriptions.length})</span>
              </button>
            </div>

            {commitmentTab === 'RECURRING' && (
              unifiedUpcomingList.filter(i => !i.isSubscription).length === 0 ? (
                <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-dashed border-indigo-200/70 dark:border-indigo-800/50 text-center space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    No upcoming recurring bills scheduled.
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => {
                        setRecurringModalInitialCreate(true);
                        setShowRecurringModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center space-x-1.5 cursor-pointer active:scale-95"
                    >
                      <Plus size={13} />
                      <span>Record Recurring</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1 items-stretch">
                  {unifiedUpcomingList.filter(i => !i.isSubscription).map((item, idx) => {
                    const cat = categories.find(c => c.id === item.categoryId);
                    const isIncome = item.type === 'INCOME';
                    const isInvest = item.type === 'INVESTMENT_CONTRIBUTION';
                    const dueInfo = formatDueBadge(item.nextDueDate);
                    const cardStyle = getThemedCardStyle(item.color, '#6366F1');
                    return (
                      <div
                        key={`dash_rec_${item.id}_${idx}`}
                        onClick={() => {
                          setRecurringModalInitialCreate(false);
                          setShowRecurringModal(true);
                        }}
                        style={cardStyle}
                        className="shrink-0 w-56 sm:w-60 p-3.5 rounded-2xl text-white border shadow-md cursor-pointer hover:shadow-xl transition-all flex flex-col justify-between min-h-[142px] relative overflow-hidden group"
                      >
                        <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-white/10 blur-lg pointer-events-none" />
                        
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-black/30 backdrop-blur-xs text-indigo-300">
                            {item.frequency}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/20 ${dueInfo.color === 'border-rose-300 text-rose-700 dark:border-rose-500/50 dark:text-rose-400' ? 'text-rose-300' : 'text-slate-100'}`}>
                            {dueInfo.label}
                          </span>
                        </div>

                        <div className="mt-2 relative z-10">
                          <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                          <div className="flex items-center justify-between mt-0.5 text-[10px] text-indigo-200">
                            <span>{item.accountName || cat?.name || 'General'}</span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-white/20 relative z-10 flex items-center justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="text-[8.5px] uppercase font-semibold text-indigo-300">Amount</span>
                            <span className="text-sm font-extrabold text-white">
                              {isIncome ? `+${formatINR(item.amount)}` : formatINR(item.amount)}
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const txId = triggerManualRecurringExecution(item.id);
                              if (txId) {
                                confetti({ particleCount: 20, spread: 40 });
                              }
                            }}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
                            title="Execute Now"
                          >
                            <Zap size={13} className="text-white" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div onClick={() => { setRecurringModalInitialCreate(true); setShowRecurringModal(true); }} className="shrink-0 w-32 p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-750 transition-all flex flex-col items-center justify-center min-h-[142px]">
                    <Plus size={24} className="mb-2 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center">Record Recurring</span>
                  </div>
                </div>
              )
            )}

            {commitmentTab === 'SUBSCRIPTIONS' && (
              unifiedUpcomingList.filter(i => i.isSubscription).length === 0 ? (
                <div className="p-4 rounded-2xl bg-violet-50/40 dark:bg-violet-950/20 border border-dashed border-violet-200/70 dark:border-violet-800/50 text-center space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    No active subscriptions tracked.
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => setShowSubscriptionModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center space-x-1.5 cursor-pointer active:scale-95"
                    >
                      <Plus size={13} />
                      <span>Record Subscription</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1 items-stretch">
                  {unifiedUpcomingList.filter(i => i.isSubscription).map((item, idx) => {
                    const dueInfo = formatDueBadge(item.nextDueDate);
                    const cardStyle = getThemedCardStyle(item.color, '#8B5CF6');
                    return (
                      <div
                        key={`dash_sub_${item.id}_${idx}`}
                        onClick={() => setShowSubscriptionModal(true)}
                        style={cardStyle}
                        className="shrink-0 w-56 sm:w-60 p-3.5 rounded-2xl text-white border shadow-md cursor-pointer hover:shadow-xl transition-all flex flex-col justify-between min-h-[142px] relative overflow-hidden group"
                      >
                        <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-white/10 blur-lg pointer-events-none" />
                        
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-black/30 backdrop-blur-xs text-violet-300">
                            {item.frequency}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/20 ${dueInfo.color === 'border-rose-300 text-rose-700 dark:border-rose-500/50 dark:text-rose-400' ? 'text-rose-300' : 'text-slate-100'}`}>
                            {dueInfo.label}
                          </span>
                        </div>

                        <div className="mt-2 relative z-10">
                          <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                          <div className="flex items-center justify-between mt-0.5 text-[10px] text-violet-200">
                            <span>{item.accountName || 'General'}</span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-white/20 relative z-10 flex items-center justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="text-[8.5px] uppercase font-semibold text-violet-300">Cost</span>
                            <span className="text-sm font-extrabold text-white">
                              {formatINR(item.amount)}
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const txId = triggerManualRecurringExecution(item.id);
                              if (txId) {
                                confetti({ particleCount: 20, spread: 40 });
                              }
                            }}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
                            title="Execute Now"
                          >
                            <Zap size={13} className="text-white" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div onClick={() => setShowSubscriptionModal(true)} className="shrink-0 w-32 p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-750 transition-all flex flex-col items-center justify-center min-h-[142px]">
                    <Plus size={24} className="mb-2 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center">Record Subscription</span>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Top Spending Categories - Interactive Click to View Ledger */}
          {categorySpending.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Top Spending Categories
                  </h3>
                </div>
                <button
                  onClick={() => setActiveView('insights')}
                  className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center space-x-1 shadow-xs cursor-pointer active:scale-95"
                >
                  <span>Full Insights</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              <div className="space-y-2">
                {categorySpending.slice(0, 5).map((cat, idx) => (
                  <button
                    key={`dash_cat_${cat.categoryId}_${idx}`}
                    onClick={() => setActiveView('insights')}
                    className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Category3DIcon
                        name={cat.icon}
                        categoryName={cat.categoryName}
                        color={cat.color}
                        size="sm"
                        glow={false}
                      />
                      <div className="text-left">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {cat.categoryName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {cat.transactionCount} transaction{cat.transactionCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                        {formatINR(cat.totalAmount)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Net Worth Breakdown */}
          {insightsSection === 'networth' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Net Worth Equation</h3>
              
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-xs text-slate-500 block font-medium">Total Net Worth</span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white block mt-1">
                  {formatINR(summary.netWorth)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                    Total Assets
                  </span>
                  <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 block mt-1">
                    {formatINR(summary.totalAssets)}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    Banks, Cash, FDs, Investments, Lent
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">
                    Total Liabilities
                  </span>
                  <span className="text-lg font-extrabold text-rose-700 dark:text-rose-400 block mt-1">
                    {formatINR(summary.totalLiabilities)}
                  </span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-0.5">
                    Credit Cards, Loans, Borrowed
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recurring Payments & Auto-Billing Modal */}
      {showRecurringModal && (
        <RecurringManagementModal
          isOpen={showRecurringModal}
          onClose={() => {
            setShowRecurringModal(false);
            setRecurringModalInitialCreate(false);
          }}
          initialCreate={recurringModalInitialCreate}
        />
      )}

      {/* Subscription Management Modal */}
      {showSubscriptionModal && (
        <SubscriptionManagementModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
        />
      )}

      {/* Account / Credit Card Statement Modal */}
      <AccountTransactionsModal
        isOpen={Boolean(statementAccount || statementCard)}
        onClose={() => {
          setStatementAccount(null);
          setStatementCard(null);
        }}
        account={statementAccount || undefined}
        card={statementCard || undefined}
        onSelectTransaction={onSelectTransaction}
        onOpenAddTransaction={(accountId) => {
          onOpenAdd('EXPENSE', accountId);
        }}
        onNavigateToFullFeed={(accountId) => {
          if (onNavigateToAccountTransactions) {
            onNavigateToAccountTransactions(accountId);
          } else {
            onViewAllTransactions();
          }
        }}
      />

      {/* Category Transactions Ledger Modal */}
      {selectedCategoryForLedger && (
        <CategoryTransactionsModal
          isOpen={Boolean(selectedCategoryForLedger)}
          onClose={() => setSelectedCategoryForLedger(null)}
          category={selectedCategoryForLedger}
          categoryId={selectedCategoryForLedger.categoryId}
          categoryName={selectedCategoryForLedger.categoryName}
          categoryIcon={selectedCategoryForLedger.icon}
          categoryColor={selectedCategoryForLedger.color}
          initialActiveMonth={activeMonth}
          onSelectTransaction={onSelectTransaction}
          onOpenAddTransaction={() => {
            onOpenAdd('EXPENSE');
          }}
        />
      )}

      {/* Arrange Accounts Modal */}
      {showArrangeModal === 'ACCOUNTS' && (
        <ArrangeAccountsModal
          isOpen={showArrangeModal === 'ACCOUNTS'}
          onClose={() => setShowArrangeModal(null)}
          accounts={nonDeletedAccounts}
          onSaveOrder={(reordered) => {
            reorderAccounts(reordered.map(a => a.id));
            setShowArrangeModal(null);
          }}
        />
      )}

      {/* Arrange Cards Modal */}
      {showArrangeModal === 'CARDS' && (
        <ArrangeCardsModal
          isOpen={showArrangeModal === 'CARDS'}
          onClose={() => setShowArrangeModal(null)}
          cards={nonDeletedCards}
          onSaveOrder={(reordered) => {
            reorderCreditCards(reordered.map(c => c.id));
            setShowArrangeModal(null);
          }}
        />
      )}

      {/* Financial Suite Modals */}
      <GoalManagementModal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} />
      <InvestmentManagementModal isOpen={showInvestmentModal} onClose={() => setShowInvestmentModal(false)} />
      <LentBorrowedManagementModal
        isOpen={showLentBorrowedModal}
        onClose={() => {
          setShowLentBorrowedModal(false);
          setLentBorrowedSettlingDebt(null);
        }}
        initialTab={lentBorrowedModalInitialTab}
        initialSettlingDebt={lentBorrowedSettlingDebt}
      />
      <LoanManagementModal isOpen={showLoanModal} onClose={() => setShowLoanModal(false)} />
    </div>
  );
});
