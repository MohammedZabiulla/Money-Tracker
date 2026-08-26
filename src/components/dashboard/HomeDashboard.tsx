import React, { useState, useEffect } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { formatINR, formatCompactINR, format12HourTime } from '../../lib/currency';
import { IconHelper, Category3DIcon, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import { Transaction, TransactionType, Account, CreditCard } from '../../types';
import { calculateMonthlyCommitment, formatDueBadge } from '../../lib/recurringEngine';
import { RecurringManagementModal } from '../recurring/RecurringManagementModal';
import { AccountTransactionsModal } from '../accounts/AccountTransactionsModal';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  CreditCard as CreditCardIcon,
  TrendingUp,
  HandCoins,
  ChevronRight,
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

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
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
    transactions,
    activeMonth,
    accounts,
    categories,
    creditCards,
    paymentApps,
    triggerManualRecurringExecution,
  } = useMoney();
  const [activeView, setActiveView] = useState<'overview' | 'insights'>(initialSubtab);
  const [insightsSection, setInsightsSection] = useState<'spending' | 'cashflow' | 'networth'>('spending');
  const [chartVisualType, setChartVisualType] = useState<'pie' | 'bar' | 'trend' | 'channel'>('pie');
  const [showBalance, setShowBalance] = useState(true);
  const [balanceMode, setBalanceMode] = useState<'available' | 'netWorth'>('available');
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [statementAccount, setStatementAccount] = useState<Account | null>(null);
  const [statementCard, setStatementCard] = useState<CreditCard | null>(null);

  useEffect(() => {
    if (initialSubtab) {
      setActiveView(initialSubtab);
    }
  }, [initialSubtab]);

  const activeRecurringRules = (recurring || []).filter(r => !r.isDeleted && r.isActive);
  const upcomingRecurringList = [...activeRecurringRules]
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
    .slice(0, 4);

  const monthlyCommitment = calculateMonthlyCommitment(
    (recurring || []).filter(r => !r.isDeleted),
    subscriptions || []
  );

  const recentTransactions = transactions
    .filter(t => !t.isDeleted)
    .slice(0, 7);

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
    { label: 'Lend / Khata', type: 'MONEY_LENT' as TransactionType, icon: 'HandCoins', categoryKey: 'khata_lent', color: '#f59e0b' },
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

      {activeView === 'overview' ? (
        <>
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
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center space-x-0.5 shrink-0"
            >
              <span>Insights</span>
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Hero Balance Card & Bank Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-5 shadow-xl border border-indigo-900/50 group">
            {/* Luminous Top Accent Stripe */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500" />

            {/* Ambient Color Glow Background */}
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center space-x-1.5 bg-black/30 p-1 rounded-full border border-white/10 backdrop-blur-md">
                <button
                  onClick={() => setBalanceMode('available')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    balanceMode === 'available'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Available Balance
                </button>
                <button
                  onClick={() => setBalanceMode('netWorth')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    balanceMode === 'netWorth'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Net Worth
                </button>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1.5 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
                title="Toggle Visibility"
              >
                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>

            {/* Main Amount */}
            <div className="relative z-10 mt-4">
              <span className="text-[11px] font-medium text-slate-300 tracking-wide uppercase">
                {balanceMode === 'available' ? 'Liquid Cash in Banks & Wallets' : 'Total Net Worth (Assets - Liabilities)'}
              </span>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1 drop-shadow-sm">
                {showBalance
                  ? formatINR(balanceMode === 'available' ? summary.availableBalance : summary.netWorth)
                  : '₹••••••••'}
              </div>
            </div>

            {/* Inflow vs Outflow Mini Stats */}
            <div className="relative z-10 grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/10">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <ArrowDownLeft size={16} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-300 block font-medium">Earned this month</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-300">
                    {showBalance ? `+${formatINR(summary.monthlyIncome)}` : '••••'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <ArrowUpRight size={16} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-300 block font-medium">Spent this month</span>
                  <span className="text-xs sm:text-sm font-bold text-rose-300">
                    {showBalance ? `-${formatINR(summary.monthlyExpenses)}` : '••••'}
                  </span>
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

          {/* Accounts & Credit Cards Quick Carousel / Tap to View Transactions */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Landmark size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    My Accounts & Cards
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tap any card or bank to view its transactions & statement
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('accounts')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <span>Manage ({accounts.filter(a => !a.isDeleted).length + creditCards.filter(c => !c.isDeleted).length})</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Horizontal Scrollable Account Cards */}
            <div className="flex space-x-3 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1">
              {/* Bank Accounts & Wallets */}
              {accounts
                .filter(a => !a.isDeleted)
                .map(acc => {
                  const isPositive = acc.calculatedBalance >= 0;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => {
                        setStatementAccount(acc);
                        setStatementCard(null);
                      }}
                      className="shrink-0 w-52 p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/90 dark:from-slate-850 dark:to-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-98 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs">
                            <Bank3DIcon
                              institution={acc.institution}
                              type={acc.type}
                              color={acc.color || '#004c8f'}
                              size="md"
                              glow={true}
                            />
                          </div>
                          <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {acc.type === 'CASH' ? 'CASH' : acc.type === 'WALLET' ? 'WALLET' : acc.type === 'FIXED_DEPOSIT' ? 'FD' : 'BANK'}
                          </span>
                        </div>

                        <div className="mt-2.5 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {acc.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">
                            {acc.institution} {acc.accountNumberLast4 ? `••${acc.accountNumberLast4}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-750 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-semibold text-slate-400 block uppercase">Balance</span>
                          <span className={`text-xs sm:text-sm font-extrabold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {formatINR(acc.calculatedBalance)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg">
                          <Receipt size={11} />
                          <span>Txns</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Credit Cards */}
              {creditCards
                .filter(c => !c.isDeleted)
                .map(card => {
                  return (
                    <div
                      key={card.id}
                      onClick={() => {
                        setStatementCard(card);
                        setStatementAccount(null);
                      }}
                      className="shrink-0 w-52 p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/60 hover:border-indigo-500 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-98 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center">
                            <Bank3DIcon
                              institution={card.issuer}
                              type="CREDIT_CARD"
                              color={card.color || '#9333ea'}
                              size="md"
                              glow={true}
                            />
                          </div>
                          <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-white/15 text-white border border-white/20">
                            {card.network || 'CARD'}
                          </span>
                        </div>

                        <div className="mt-2.5 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                            {card.name}
                          </h4>
                          <p className="text-[10px] text-slate-300 truncate">
                            {card.issuer} ••{card.lastFourDigits}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-semibold text-slate-300 block uppercase">Due</span>
                          <span className="text-xs sm:text-sm font-extrabold text-amber-300">
                            {formatINR(card.currentOutstanding)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 text-[10px] font-bold text-purple-200 bg-white/20 px-2 py-1 rounded-lg">
                          <Receipt size={11} />
                          <span>Txns</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Upcoming Recurring & Auto-Billing Section */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Repeat size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Upcoming Recurring & Subscriptions
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {activeRecurringRules.length} active rules • {formatINR(monthlyCommitment)}/mo
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRecurringModal(true)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <span>Manage</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {upcomingRecurringList.length === 0 ? (
              <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-dashed border-indigo-200/70 dark:border-indigo-800/50 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  No upcoming recurring bills or rent scheduled.
                </p>
                <button
                  onClick={() => setShowRecurringModal(true)}
                  className="mt-2 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center space-x-1"
                >
                  <Repeat size={12} />
                  <span>Setup Rent, SIP or Subscriptions</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingRecurringList.map(item => {
                  const cat = categories.find(c => c.id === item.categoryId);
                  const isIncome = item.type === 'INCOME';
                  const isInvest = item.type === 'INVESTMENT_CONTRIBUTION';
                  const dueInfo = formatDueBadge(item.nextDueDate);

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-200/60 dark:border-slate-750 flex items-center justify-between hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Category3DIcon
                          name={cat?.icon || (isIncome ? 'ArrowDownLeft' : isInvest ? 'TrendingUp' : 'Repeat')}
                          categoryName={item.categoryName || cat?.name || item.name}
                          color={cat?.color || (isIncome ? '#10b981' : isInvest ? '#059669' : '#6366f1')}
                          size="sm"
                          glow={false}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mt-0.5">
                            <span className="capitalize">{item.frequency.toLowerCase()}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {item.accountName || item.creditCardName || item.categoryName || 'General'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <span
                            className={`text-xs font-extrabold block ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isInvest
                                ? 'text-teal-600 dark:text-teal-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {isIncome ? `+${formatINR(item.amount)}` : formatINR(item.amount)}
                          </span>
                          <span
                            className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${dueInfo.color}`}
                          >
                            {dueInfo.label}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            const txId = triggerManualRecurringExecution(item.id);
                            if (txId) {
                              confetti({ particleCount: 20, spread: 40 });
                            }
                          }}
                          title="Record this occurrence now"
                          className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-all"
                        >
                          <Zap size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Spending Preview */}
          {categorySpending.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Top Spending Categories
                  </h3>
                  <p className="text-[11px] text-slate-500">Breakdown for {activeMonth}</p>
                </div>
                <button
                  onClick={() => setActiveView('insights')}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                >
                  <span>Full Insights</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-2.5">
                {categorySpending.slice(0, 4).map(cat => (
                  <div key={cat.categoryId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Category3DIcon
                          name={cat.icon}
                          categoryName={cat.categoryName}
                          color={cat.color}
                          size="sm"
                          glow={false}
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {cat.categoryName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatINR(cat.totalAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-medium">
                          ({cat.percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, cat.percentage)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget Health Progress */}
          {budgets.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Monthly Budgets
                </h3>
                <span className="text-[11px] text-slate-400">{budgets.length} active</span>
              </div>

              <div className="space-y-3">
                {budgets.slice(0, 3).map(b => {
                  const cat = categories.find(c => c.id === b.categoryId);
                  const catSpend = categorySpending.find(cs => cs.categoryId === b.categoryId);
                  const spent = catSpend ? catSpend.totalAmount : 0;
                  const budgetTitle = b.name || cat?.name || 'General Budget';
                  const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
                  const isOver = spent > b.amount;
                  const remaining = Math.max(0, b.amount - spent);

                  return (
                    <div key={b.id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {budgetTitle}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatINR(spent)} / {formatINR(b.amount)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver ? 'bg-rose-500' : percent > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 flex justify-between">
                        <span>{percent.toFixed(0)}% used</span>
                        <span>{isOver ? `Exceeded by ${formatINR(spent - b.amount)}` : `${formatINR(remaining)} left`}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Transactions List with 3D Icons & Rich Details */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/70 dark:border-slate-700/70 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Transactions
              </h3>
              <button
                onClick={onViewAllTransactions}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center hover:underline"
              >
                <span>View Full Day Feed</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">No transactions logged yet</p>
                <button
                  onClick={() => onOpenAdd('EXPENSE')}
                  className="mt-3 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  Add First Transaction
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {recentTransactions.map(t => {
                  const isIncome = t.type === 'INCOME' || t.type === 'MONEY_LENT_REPAYMENT' || t.type === 'INVESTMENT_WITHDRAWAL';
                  const isTransfer = t.type === 'TRANSFER' || t.type === 'CARD_PAYMENT' || t.type === 'INVESTMENT_CONTRIBUTION';
                  const cat = categories.find(c => c.id === t.categoryId);
                  const acc = accounts.find(a => a.id === t.accountId);
                  const card = creditCards.find(c => c.id === t.creditCardId);
                  const app = paymentApps.find(p => p.id === t.paymentAppId || p.name.toLowerCase() === (t.paymentAppName || '').toLowerCase());
                  const accentColor = card ? card.color || '#9333ea' : acc ? acc.color || '#10b981' : '#64748b';

                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectTransaction(t)}
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 px-2 rounded-2xl transition-colors group"
                    >
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
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {t.merchantName || t.categoryName || t.notes || 'Transaction'}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {t.categoryName || t.type}
                            </span>
                            {t.subcategory && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                                {t.subcategory}
                              </span>
                            )}
                            {/* Mini 3D Payment App Badge */}
                            {t.paymentAppName && (
                              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                                <PaymentApp3DIcon name={t.paymentAppName} size="xs" glow={false} />
                                <span>{t.paymentAppName}</span>
                              </span>
                            )}
                            {/* Mini 3D Bank or Card Badge - Clickable to open statement */}
                            {(t.accountName || t.creditCardName) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (card) {
                                    setStatementCard(card);
                                    setStatementAccount(null);
                                  } else if (acc) {
                                    setStatementAccount(acc);
                                    setStatementCard(null);
                                  } else if (t.creditCardId) {
                                    const found = creditCards.find(c => c.id === t.creditCardId);
                                    if (found) {
                                      setStatementCard(found);
                                      setStatementAccount(null);
                                    }
                                  } else if (t.accountId) {
                                    const found = accounts.find(a => a.id === t.accountId);
                                    if (found) {
                                      setStatementAccount(found);
                                      setStatementCard(null);
                                    }
                                  }
                                }}
                                className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold transition-colors cursor-pointer"
                                style={{ color: accentColor }}
                                title={`View transactions for ${t.creditCardName || t.accountName}`}
                              >
                                <Bank3DIcon
                                  institution={card ? card.issuer : acc?.institution}
                                  type={card ? 'CREDIT_CARD' : acc?.type}
                                  color={accentColor}
                                  size="xs"
                                  glow={false}
                                />
                                <span>{t.creditCardName ? t.creditCardName : t.accountName}</span>
                              </button>
                            )}
                          </div>

                          {/* Notes inside the transaction card */}
                          {t.notes && (
                            <div className="flex items-center space-x-1.5 text-[11px] text-amber-900 dark:text-amber-200/90 italic mt-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 max-w-[200px] sm:max-w-xs w-fit">
                              <span className="text-amber-500 font-bold shrink-0 text-xs">📝</span>
                              <span className="truncate">{t.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3">
                        <span
                          className={`text-sm font-extrabold block ${
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
                          {format12HourTime(t.time, t.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Merged Insights & Analytics View */
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          {/* Insights Subtab Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setInsightsSection('spending')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                insightsSection === 'spending'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Categories & Spends
            </button>
            <button
              onClick={() => setInsightsSection('cashflow')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                insightsSection === 'cashflow'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Income vs Expense
            </button>
            <button
              onClick={() => setInsightsSection('networth')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                insightsSection === 'networth'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Net Worth Equation
            </button>
          </div>

          {/* Key Stat Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Total Spent</span>
              <span className="text-base sm:text-lg font-extrabold text-rose-600 dark:text-rose-400 block mt-0.5">
                {formatINR(summary.monthlyExpenses)}
              </span>
              <span className="text-[10px] text-slate-400">{activeMonth}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Daily Average</span>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white block mt-0.5">
                {formatINR(dailyAverage)}
              </span>
              <span className="text-[10px] text-slate-400">Avg spend / day</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Total Earned</span>
              <span className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {formatINR(summary.monthlyIncome)}
              </span>
              <span className="text-[10px] text-slate-400">Inflows</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Savings Rate</span>
              <span className="text-base sm:text-lg font-extrabold text-teal-600 dark:text-teal-400 block mt-0.5">
                {summary.savingsRatePercent.toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-400">{formatINR(summary.monthlySavings)}</span>
            </div>
          </div>

          {/* Section 1: Categories & Top Spends */}
          {insightsSection === 'spending' && (
            <div className="space-y-4">
              {/* Main Visual Chart Engine Card */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <Activity size={16} className="text-emerald-500" />
                      <span>Spend Visualizer</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Interactive bar graphs, pie charts & trends
                    </p>
                  </div>

                  {/* Chart Visual Type Switcher */}
                  <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-750 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700 shrink-0 overflow-x-auto scrollbar-none">
                    <button
                      onClick={() => setChartVisualType('pie')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                        chartVisualType === 'pie'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <PieChart size={13} className={chartVisualType === 'pie' ? 'text-emerald-500' : ''} />
                      <span>Pie / Donut</span>
                    </button>

                    <button
                      onClick={() => setChartVisualType('bar')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                        chartVisualType === 'bar'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <BarChart2 size={13} className={chartVisualType === 'bar' ? 'text-blue-500' : ''} />
                      <span>Bar Graph</span>
                    </button>

                    <button
                      onClick={() => setChartVisualType('trend')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                        chartVisualType === 'trend'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Calendar size={13} className={chartVisualType === 'trend' ? 'text-amber-500' : ''} />
                      <span>Daily Trend</span>
                    </button>

                    <button
                      onClick={() => setChartVisualType('channel')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                        chartVisualType === 'channel'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Smartphone size={13} className={chartVisualType === 'channel' ? 'text-purple-500' : ''} />
                      <span>Channels</span>
                    </button>
                  </div>
                </div>

                {/* Selected Visual Chart */}
                <div className="pt-1">
                  {chartVisualType === 'pie' && (
                    <SpendsPieChart
                      categorySpending={categorySpending}
                      totalExpenses={summary.monthlyExpenses}
                      activeMonth={activeMonth}
                    />
                  )}

                  {chartVisualType === 'bar' && (
                    <CategoryBarChart
                      categorySpending={categorySpending}
                      activeMonth={activeMonth}
                    />
                  )}

                  {chartVisualType === 'trend' && (
                    <DailySpendTrendChart
                      transactions={transactions}
                      activeMonth={activeMonth}
                      totalExpenses={summary.monthlyExpenses}
                    />
                  )}

                  {chartVisualType === 'channel' && (
                    <PaymentChannelChart
                      transactions={transactions}
                      accounts={accounts}
                      creditCards={creditCards}
                      paymentApps={paymentApps}
                      activeMonth={activeMonth}
                    />
                  )}
                </div>
              </div>

              {/* Detailed Visual Category Distribution */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Category Distribution
                  </h3>
                  <span className="text-xs text-slate-400">
                    {categorySpending.length} categories logged
                  </span>
                </div>

                {categorySpending.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No expenses logged for {activeMonth}</p>
                ) : (
                  <div className="space-y-3">
                    {categorySpending.map(cat => (
                      <div key={cat.categoryId} className="space-y-1.5 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2.5">
                            <Category3DIcon
                              name={cat.icon}
                              categoryName={cat.categoryName}
                              color={cat.color}
                              size="sm"
                              glow={true}
                            />
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                                {cat.categoryName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {cat.transactionCount} transactions
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-extrabold text-slate-900 dark:text-white block">
                              {formatINR(cat.totalAmount)}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              {cat.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, cat.percentage)}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Merchants Breakdown */}
              {topMerchants.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <ShoppingBag size={16} className="text-emerald-500" />
                    <span>Top Spends by Merchant</span>
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {topMerchants.map(([name, amount], idx) => (
                      <div key={name} className="py-2.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {idx + 1}. {name}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatINR(amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Cashflow & Savings */}
          {insightsSection === 'cashflow' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <BarChart2 size={16} className="text-cyan-500" />
                <span>Monthly Inflow vs Outflow Equation</span>
              </h3>

              {/* Visual Grouped Bar Chart */}
              <CashflowComparisonChart summary={summary} activeMonth={activeMonth} />
              
              <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ArrowDownLeft size={14} className="mr-1" /> Total Income (Inflow)
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatINR(summary.monthlyIncome)}</span>
                  </div>
                  <div className="w-full h-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-rose-600 dark:text-rose-400 flex items-center">
                      <ArrowUpRight size={14} className="mr-1" /> Total Expenses (Outflow)
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">{formatINR(summary.monthlyExpenses)}</span>
                  </div>
                  <div className="w-full h-4 bg-rose-50 dark:bg-rose-950/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all"
                      style={{
                        width: `${summary.monthlyIncome > 0 ? Math.min(100, (summary.monthlyExpenses / summary.monthlyIncome) * 100) : 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-teal-600 dark:text-teal-400 flex items-center">
                      <Sparkles size={14} className="mr-1" /> Net Savings Retained
                    </span>
                    <span className="text-teal-600 dark:text-teal-400 font-bold">
                      {formatINR(summary.monthlySavings)} ({summary.savingsRatePercent.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-4 bg-teal-50 dark:bg-teal-950/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{
                        width: `${Math.max(0, Math.min(100, summary.savingsRatePercent))}%`,
                      }}
                    />
                  </div>
                </div>
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
      <RecurringManagementModal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
      />

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
    </div>
  );
};
