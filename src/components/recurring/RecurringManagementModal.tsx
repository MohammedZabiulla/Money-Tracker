import React, { useState, useMemo, useEffect } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { RecurringTransaction, RecurrenceFrequency, TransactionType } from '../../types';
import { formatINR } from '../../lib/currency';
import { Emblem3D, Category3DIcon, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import {
  calculateMonthlyCommitment,
  formatDueBadge,
} from '../../lib/recurringEngine';
import {
  X,
  Plus,
  Repeat,
  Calendar,
  Clock,
  Play,
  Pause,
  Trash2,
  Edit2,
  CheckCircle2,
  Sparkles,
  Zap,
  Check,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Search,
  Layers,
  LayoutGrid,
  List,
  Home,
  Shield,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useScrollLock } from '../../hooks/useScrollLock';

interface RecurringManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCreate?: boolean;
}

const RECURRING_CATALOGUE_PRESETS = [
  {
    id: 'preset_house_rent',
    name: 'House Rent',
    tagline: 'Monthly apartment & home rental',
    defaultAmount: 25000,
    type: 'EXPENSE' as TransactionType,
    frequency: 'MONTHLY' as RecurrenceFrequency,
    categoryId: 'housing_rent',
    categoryName: 'Home & Rent',
    icon: 'Home',
    emblemIcon: 'Home',
    emblemFrom: '#4f46e5',
    emblemTo: '#3730a3',
    finish: 'gloss' as const,
    popular: true,
  },
  {
    id: 'preset_salary',
    name: 'Monthly Salary',
    tagline: 'Direct monthly payroll credit',
    defaultAmount: 95000,
    type: 'INCOME' as TransactionType,
    frequency: 'MONTHLY' as RecurrenceFrequency,
    categoryId: 'salary_income',
    categoryName: 'Salary & Income',
    icon: 'Briefcase',
    emblemIcon: 'Briefcase',
    emblemFrom: '#10b981',
    emblemTo: '#047857',
    finish: 'crystal' as const,
    popular: true,
  },
  {
    id: 'preset_mutual_fund_sip',
    name: 'Mutual Fund SIP',
    tagline: 'Systematic Equity & Index SIP',
    defaultAmount: 10000,
    type: 'INVESTMENT_CONTRIBUTION' as TransactionType,
    frequency: 'MONTHLY' as RecurrenceFrequency,
    categoryId: 'investments_stocks',
    categoryName: 'Investments & SIPs',
    icon: 'TrendingUp',
    emblemIcon: 'TrendingUp',
    emblemFrom: '#059669',
    emblemTo: '#064e3b',
    finish: 'metallic' as const,
    popular: true,
  },
  {
    id: 'preset_jio_broadband',
    name: 'JioFiber / Airtel WiFi',
    tagline: 'High-speed home fiber internet',
    defaultAmount: 1179,
    type: 'EXPENSE' as TransactionType,
    frequency: 'MONTHLY' as RecurrenceFrequency,
    categoryId: 'bills_utilities',
    categoryName: 'Bills & Utilities',
    icon: 'Wifi',
    emblemIcon: 'Wifi',
    emblemFrom: '#0284c7',
    emblemTo: '#0369a1',
    finish: 'gloss' as const,
    popular: true,
  },
  {
    id: 'preset_electricity_bill',
    name: 'Electricity / Power',
    tagline: 'Monthly power utility bill',
    defaultAmount: 2400,
    type: 'EXPENSE' as TransactionType,
    frequency: 'MONTHLY' as RecurrenceFrequency,
    categoryId: 'bills_utilities',
    categoryName: 'Bills & Utilities',
    icon: 'Zap',
    emblemIcon: 'Zap',
    emblemFrom: '#eab308',
    emblemTo: '#ca8a04',
    finish: 'gloss' as const,
    popular: false,
  },
  {
    id: 'preset_netflix_sub',
    name: 'Netflix 4K Ultra HD',
    tagline: 'Streaming entertainment plan',
    defaultAmount: 649,
    type: 'EXPENSE' as TransactionType,
    frequency: 'MONTHLY' as RecurrenceFrequency,
    categoryId: 'subscriptions_ott',
    categoryName: 'Subscriptions & OTT',
    icon: 'Tv',
    emblemIcon: 'Tv',
    emblemFrom: '#e50914',
    emblemTo: '#991b1b',
    finish: 'crystal' as const,
    popular: true,
  },
  {
    id: 'preset_gym_membership',
    name: 'Cult.fit / Gym Fee',
    tagline: 'Fitness & personal training pass',
    defaultAmount: 2500,
    type: 'EXPENSE' as TransactionType,
    frequency: 'MONTHLY' as RecurrenceFrequency,
    categoryId: 'fitness_sports',
    categoryName: 'Fitness & Sports',
    icon: 'Dumbbell',
    emblemIcon: 'Activity',
    emblemFrom: '#f97316',
    emblemTo: '#c2410c',
    finish: 'gloss' as const,
    popular: false,
  },
  {
    id: 'preset_maid_salary',
    name: 'House Help / Cook',
    tagline: 'Domestic staff monthly wage',
    defaultAmount: 4500,
    type: 'EXPENSE' as TransactionType,
    frequency: 'MONTHLY' as RecurrenceFrequency,
    categoryId: 'home_maintenance',
    categoryName: 'Home & Maintenance',
    icon: 'UserCheck',
    emblemIcon: 'Heart',
    emblemFrom: '#ec4899',
    emblemTo: '#be185d',
    finish: 'bubble' as const,
    popular: false,
  },
];

export const RecurringManagementModal: React.FC<RecurringManagementModalProps> = ({
  isOpen,
  onClose,
  initialCreate = false,
}) => {
  useScrollLock(isOpen);

  const {
    recurring,
    subscriptions,
    accounts,
    creditCards,
    categories,
    paymentApps,
    goals,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    toggleRecurringActive,
    triggerManualRecurringExecution,
    processDuePayments,
  } = useMoney();

  const [filterTab, setFilterTab] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'INVESTMENT' | 'PAUSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<RecurringTransaction | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formType, setFormType] = useState<TransactionType>('EXPENSE');
  const [formFrequency, setFormFrequency] = useState<RecurrenceFrequency>('MONTHLY');
  const [formInterval, setFormInterval] = useState<number>(1);
  const [formStartDate, setFormStartDate] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [formNextDueDate, setFormNextDueDate] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [formHasEndDate, setFormHasEndDate] = useState<boolean>(false);
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formCategoryId, setFormCategoryId] = useState<string>('housing_rent');
  const [formSubcategory, setFormSubcategory] = useState<string>('');
  const [formAccountId, setFormAccountId] = useState<string>('');
  const [formCardId, setFormCardId] = useState<string>('');
  const [formPaymentAppId, setFormPaymentAppId] = useState<string>('');
  const [formGoalId, setFormGoalId] = useState<string>('');
  const [formAutoRecord, setFormAutoRecord] = useState<boolean>(true);
  const [formNotes, setFormNotes] = useState<string>('');

  // Goal Options for CustomSelect
  const goalSelectOptions: SelectOption<string>[] = useMemo(() => {
    const opts: SelectOption<string>[] = [
      {
        value: '',
        label: 'None / Do Not Link to Goal',
        sublabel: 'Regular expense/income transaction',
      },
    ];

    (goals || [])
      .filter(g => !g.isDeleted && g.status === 'IN_PROGRESS')
      .forEach(g => {
        opts.push({
          value: g.id,
          label: g.name,
          sublabel: `Target: ${formatINR(g.targetAmount)} (Saved: ${formatINR(g.currentAmount)})`,
          rightText: `${Math.round((g.currentAmount / (g.targetAmount || 1)) * 100)}%`,
          iconColor: g.color,
          iconName: g.icon || 'Target',
        });
      });

    return opts;
  }, [goals]);

  const activeRecurring = useMemo(() => {
    return (recurring || []).filter(r => !r.isDeleted);
  }, [recurring]);

  const monthlyCommitment = useMemo(() => {
    return calculateMonthlyCommitment(activeRecurring, subscriptions || []);
  }, [activeRecurring, subscriptions]);

  const activeRulesCount = useMemo(() => {
    return activeRecurring.filter(r => r.isActive).length;
  }, [activeRecurring]);

  // Filtered List
  const filteredList = useMemo(() => {
    return activeRecurring.filter(r => {
      if (filterTab === 'PAUSED' && r.isActive) return false;
      if (filterTab === 'EXPENSE' && (r.type !== 'EXPENSE' || !r.isActive)) return false;
      if (filterTab === 'INCOME' && (r.type !== 'INCOME' || !r.isActive)) return false;
      if (filterTab === 'INVESTMENT' && (r.type !== 'INVESTMENT_CONTRIBUTION' || !r.isActive)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchCat = (r.categoryName || '').toLowerCase().includes(q);
        const matchNotes = (r.notes || '').toLowerCase().includes(q);
        return matchName || matchCat || matchNotes;
      }

      return true;
    });
  }, [activeRecurring, filterTab, searchQuery]);

  // Frequency Options for CustomSelect
  const frequencySelectOptions: SelectOption<RecurrenceFrequency>[] = useMemo(() => {
    return [
      {
        value: 'MONTHLY',
        label: 'Monthly',
        sublabel: 'Rent, Subscriptions, SIPs, Utilities',
        icon: <Repeat size={14} className="text-indigo-500" />,
        badge: 'Popular',
      },
      {
        value: 'WEEKLY',
        label: 'Weekly',
        sublabel: 'Groceries, Fuel, Pocket Money',
        icon: <Clock size={14} className="text-purple-500" />,
      },
      {
        value: 'DAILY',
        label: 'Daily',
        sublabel: 'Milk, Newspaper, Daily Transport',
        icon: <Calendar size={14} className="text-emerald-500" />,
      },
      {
        value: 'QUARTERLY',
        label: 'Quarterly',
        sublabel: 'Every 3 months (School Fees, Advance Tax)',
        icon: <Layers size={14} className="text-teal-500" />,
      },
      {
        value: 'HALF_YEARLY',
        label: 'Half-Yearly',
        sublabel: 'Every 6 months (Maintenance, Insurance)',
        icon: <Shield size={14} className="text-cyan-500" />,
      },
      {
        value: 'YEARLY',
        label: 'Yearly (Annual)',
        sublabel: 'Car Insurance, Domain renewal, Annual fees',
        icon: <Sparkles size={14} className="text-amber-500" />,
      },
    ];
  }, []);

  // Category Options for CustomSelect
  const categorySelectOptions: SelectOption<string>[] = useMemo(() => {
    return categories.map(cat => ({
      value: cat.id,
      label: cat.name,
      sublabel: `${cat.subcategories?.length || 0} subcategories`,
      iconName: cat.icon,
      iconColor: cat.color,
      categoryName: cat.name,
      group: cat.type === 'EXPENSE' ? 'Expense Categories' : 'Income & Investment',
    }));
  }, [categories]);

  // Account Options for CustomSelect
  const accountSelectOptions: SelectOption<string>[] = useMemo(() => {
    const opts: SelectOption<string>[] = [
      {
        value: '',
        label: 'None / Auto Account',
        sublabel: 'Do not tie to a specific bank account',
      },
    ];

    accounts
      .filter(a => !a.isDeleted)
      .forEach(a => {
        opts.push({
          value: a.id,
          label: a.name,
          sublabel: `${a.institution || a.type} •••• ${a.accountNumberLast4 || 'XXXX'}`,
          rightText: formatINR(a.calculatedBalance),
          rightTextColor: a.calculatedBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600',
          icon: <Bank3DIcon name={a.institution || a.name} color={a.color || '#0284c7'} size="xs" />,
          isBankAccount: true,
          bankTheme: a.institution || a.name || a.type,
        });
      });

    return opts;
  }, [accounts]);

  // Credit Card Options for CustomSelect
  const cardSelectOptions: SelectOption<string>[] = useMemo(() => {
    const opts: SelectOption<string>[] = [
      {
        value: '',
        label: 'None / No Credit Card',
        sublabel: 'Payment will be made directly from bank / cash',
      },
    ];

    creditCards
      .filter(c => !c.isDeleted)
      .forEach(c => {
        opts.push({
          value: c.id,
          label: c.name,
          sublabel: `Due: ${formatINR(c.currentOutstanding)} • Avail: ${formatINR(Math.max(0, c.creditLimit - c.currentOutstanding))}`,
          rightText: `Due: ${formatINR(c.currentOutstanding)}`,
          isCreditCard: true,
          cardTheme: c.cardTheme,
          network: c.network,
        });
      });

    return opts;
  }, [creditCards]);

  // Payment App Options for CustomSelect
  const paymentAppSelectOptions: SelectOption<string>[] = useMemo(() => {
    const opts: SelectOption<string>[] = [
      {
        value: '',
        label: 'Direct / Default Mode',
        sublabel: 'Standard Netbanking / NEFT / Cash',
      },
    ];

    paymentApps.forEach(p => {
      opts.push({
        value: p.id,
        label: p.name,
        icon: <PaymentApp3DIcon name={p.name} color={p.color} size="xs" />,
      });
    });

    return opts;
  }, [paymentApps]);

  const handleOpenAddForm = (preset?: typeof RECURRING_CATALOGUE_PRESETS[0]) => {
    setEditingRuleId(null);
    if (preset) {
      setFormName(preset.name);
      setFormAmount(preset.defaultAmount ? String(preset.defaultAmount) : '');
      setFormType(preset.type);
      setFormFrequency(preset.frequency);
      setFormInterval(1);
      setFormCategoryId(preset.categoryId);
      setFormSubcategory('');
      setFormNotes(preset.tagline || '');
    } else {
      setFormName('');
      setFormAmount('');
      setFormType('EXPENSE');
      setFormFrequency('MONTHLY');
      setFormInterval(1);
      setFormCategoryId(categories[0]?.id || 'housing_rent');
      setFormSubcategory('');
      setFormNotes('');
    }

    const todayStr = new Date().toISOString().substring(0, 10);
    setFormStartDate(todayStr);
    setFormNextDueDate(todayStr);
    setFormHasEndDate(false);
    setFormEndDate('');
    setFormAutoRecord(true);

    const defaultAcc = accounts.find(a => a.isActive && (a.type === 'SALARY' || a.type === 'SAVINGS')) || accounts[0];
    if (defaultAcc) setFormAccountId(defaultAcc.id);
    if (creditCards.length > 0) setFormCardId('');
    if (paymentApps.length > 0) setFormPaymentAppId(paymentApps[0].id);
    setFormGoalId('');

    setIsAddingNew(true);
  };

  useEffect(() => {
    if (isOpen && initialCreate) {
      handleOpenAddForm();
    }
  }, [isOpen, initialCreate]);

  const handleOpenEdit = (rule: RecurringTransaction) => {
    setEditingRuleId(rule.id);
    setFormName(rule.name);
    setFormAmount(String(rule.amount));
    setFormType(rule.type);
    setFormFrequency(rule.frequency);
    setFormInterval(rule.interval || 1);
    setFormStartDate(rule.startDate);
    setFormNextDueDate(rule.nextDueDate);
    setFormHasEndDate(!!rule.endDate);
    setFormEndDate(rule.endDate || '');
    setFormCategoryId(rule.categoryId || categories[0]?.id || '');
    setFormSubcategory(rule.subcategory || '');
    setFormAccountId(rule.accountId || '');
    setFormCardId(rule.creditCardId || '');
    setFormPaymentAppId(rule.paymentAppId || '');
    setFormGoalId(rule.goalId || '');
    setFormAutoRecord(rule.autoRecord !== false);
    setFormNotes(rule.notes || '');
    setIsAddingNew(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(formAmount);
    if (!formName.trim() || !parsedAmt || parsedAmt <= 0) {
      alert('Please enter a valid title and amount');
      return;
    }

    const catObj = categories.find(c => c.id === formCategoryId);
    const accObj = accounts.find(a => a.id === formAccountId);
    const cardObj = creditCards.find(c => c.id === formCardId);
    const pappObj = paymentApps.find(p => p.id === formPaymentAppId);

    if (editingRuleId) {
      updateRecurring(editingRuleId, {
        name: formName.trim(),
        amount: parsedAmt,
        type: formType,
        frequency: formFrequency,
        interval: formInterval,
        startDate: formStartDate,
        nextDueDate: formNextDueDate,
        endDate: formHasEndDate && formEndDate ? formEndDate : undefined,
        categoryId: formCategoryId,
        categoryName: catObj?.name,
        subcategory: formSubcategory || undefined,
        accountId: formAccountId || undefined,
        accountName: accObj?.name,
        creditCardId: formCardId || undefined,
        creditCardName: cardObj?.name,
        paymentAppId: formPaymentAppId || undefined,
        paymentAppName: pappObj?.name,
        goalId: formGoalId || undefined,
        autoRecord: formAutoRecord,
        notes: formNotes.trim() || undefined,
      });
    } else {
      addRecurring({
        name: formName.trim(),
        amount: parsedAmt,
        type: formType,
        frequency: formFrequency,
        interval: formInterval,
        startDate: formStartDate,
        nextDueDate: formNextDueDate,
        endDate: formHasEndDate && formEndDate ? formEndDate : undefined,
        categoryId: formCategoryId,
        categoryName: catObj?.name,
        subcategory: formSubcategory || undefined,
        accountId: formAccountId || undefined,
        accountName: accObj?.name,
        creditCardId: formCardId || undefined,
        creditCardName: cardObj?.name,
        paymentAppId: formPaymentAppId || undefined,
        paymentAppName: pappObj?.name,
        goalId: formGoalId || undefined,
        autoRecord: formAutoRecord,
        isActive: true,
        notes: formNotes.trim() || undefined,
      });
    }

    setIsAddingNew(false);
    setEditingRuleId(null);
  };

  const handleRunSyncNow = () => {
    const res = processDuePayments();
    if (res.newTransactions.length > 0) {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
      setSyncFeedback(`Successfully auto-recorded ${res.newTransactions.length} pending payments!`);
    } else {
      setSyncFeedback('All recurring payments are currently up to date.');
    }
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleExecuteSingleNow = (rule: RecurringTransaction) => {
    const txId = triggerManualRecurringExecution(rule.id);
    if (txId) {
      confetti({ particleCount: 25, spread: 40 });
      setSyncFeedback(`Recorded 1 occurrence of "${rule.name}" (₹${rule.amount})!`);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 h-[92vh] sm:h-auto sm:max-h-[88vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="hover:scale-105 transition-transform inline-block">
              <Emblem3D icon="Repeat" from="#6366f1" to="#4338ca" finish="gloss" shape="squircle" size="md" glow={true} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <span>Recurring Payments & Auto-Billing</span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sync Toast */}
        {syncFeedback && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 size={15} />
              <span>{syncFeedback}</span>
            </div>
            <button onClick={() => setSyncFeedback(null)} className="opacity-80 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Overview Stats Bento */}
        <div className="p-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-slate-100/50 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/70 dark:border-slate-750 shadow-xs flex items-center space-x-3">
              <div className="shrink-0">
                <Emblem3D icon="Calendar" from="#6366f1" to="#4f46e5" finish="gloss" shape="squircle" size="sm" glow={false} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  Monthly Commitment
                </span>
                <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                  {formatINR(monthlyCommitment)}
                </div>
                <span className="text-[10px] text-slate-400">Total recurring budget</span>
              </div>
            </div>

            <div className="p-3.5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/70 dark:border-slate-750 shadow-xs flex items-center space-x-3">
              <div className="shrink-0">
                <Emblem3D icon="Check" from="#10b981" to="#059669" finish="crystal" shape="squircle" size="sm" glow={false} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Active Rules
                </span>
                <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {activeRulesCount} Active
                </div>
                <span className="text-[10px] text-slate-400">{activeRecurring.length} total configured</span>
              </div>
            </div>

            <div className="p-3.5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/70 dark:border-slate-750 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                  Auto-Scheduler
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center mt-0.5">
                  <ShieldCheck size={13} className="mr-1" /> Active on Launch
                </span>
              </div>
              <button
                onClick={handleRunSyncNow}
                className="px-3 py-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95 shrink-0"
              >
                <Zap size={12} />
                <span>Run Due</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Add Presets Bar with 3D Emblems */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <Sparkles size={14} className="text-indigo-500 animate-pulse" />
                <span>Popular Auto-Payment Templates</span>
              </span>
              <button
                onClick={() => handleOpenAddForm()}
                className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold flex items-center space-x-1 transition-all"
              >
                <Plus size={13} />
                <span>Custom Rule</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {RECURRING_CATALOGUE_PRESETS.slice(0, 4).map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleOpenAddForm(preset)}
                  className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-200/70 dark:border-slate-750 text-left hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition-all group flex flex-col justify-between shadow-2xs"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="group-hover:scale-105 transition-transform">
                      <Emblem3D
                        icon={preset.emblemIcon}
                        from={preset.emblemFrom}
                        to={preset.emblemTo}
                        finish={preset.finish}
                        shape="squircle"
                        size="xs"
                      />
                    </div>
                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded-md">
                      + Add
                    </span>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {preset.name}
                    </h5>
                    <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">
                      {formatINR(preset.defaultAmount)}/mo
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Search, Filters, and Layout Toggle */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search recurring rules (Rent, SIP, Salary, Netflix)..."
                  className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 text-xs outline-none"
                />
              </div>

              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setViewLayout('grid')}
                  className={`p-1.5 rounded-xl transition-all ${
                    viewLayout === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewLayout('list')}
                  className={`p-1.5 rounded-xl transition-all ${
                    viewLayout === 'list'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="List View"
                >
                  <List size={14} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1.5 overflow-x-auto no-scrollbar pb-1">
              {(['ALL', 'EXPENSE', 'INCOME', 'INVESTMENT', 'PAUSED'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                    filterTab === tab
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab === 'ALL' && 'All Rules'}
                  {tab === 'EXPENSE' && '💸 Expenses (Rent, Bills)'}
                  {tab === 'INCOME' && '💰 Income (Salary)'}
                  {tab === 'INVESTMENT' && '📈 SIPs & Investments'}
                  {tab === 'PAUSED' && '⏸️ Paused'}
                </button>
              ))}
            </div>
          </div>

          {/* List of Recurring Rules */}
          {filteredList.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-850/50 rounded-3xl border border-dashed border-indigo-200 dark:border-indigo-800/60">
              <div className="mb-3 inline-block">
                <Emblem3D icon="Repeat" from="#6366f1" to="#4338ca" finish="gloss" shape="squircle" size="md" glow={true} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No recurring payment rules found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Schedule your monthly house rent, electricity bills, mutual fund SIPs, and salary to record them automatically on due dates.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => handleOpenAddForm()}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center space-x-2 shadow-md shadow-indigo-600/25 transition-all cursor-pointer active:scale-95"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>Add Recurring Payment</span>
                </button>
              </div>
            </div>
          ) : viewLayout === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredList.map((rule, idx) => {
                const cat = categories.find(c => c.id === rule.categoryId);
                const isIncome = rule.type === 'INCOME';
                const isInvest = rule.type === 'INVESTMENT_CONTRIBUTION';
                const dueInfo = formatDueBadge(rule.nextDueDate);
                const linkedGoal = goals?.find(g => g.id === rule.goalId);

                return (
                  <div
                    key={`rec_grid_${rule.id}_${idx}`}
                    className={`p-4 rounded-3xl border transition-all flex flex-col justify-between ${
                      rule.isActive
                        ? 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-750 shadow-xs hover:border-indigo-400'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200/40 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <Category3DIcon
                            name={cat?.icon || (isIncome ? 'ArrowDownLeft' : isInvest ? 'TrendingUp' : 'Repeat')}
                            categoryName={rule.categoryName || cat?.name || rule.name}
                            color={cat?.color || (isIncome ? '#10b981' : isInvest ? '#059669' : '#6366f1')}
                            size="md"
                            glow={rule.isActive}
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {rule.name}
                            </h4>
                            <div className="flex items-center flex-wrap gap-1 mt-0.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold capitalize">
                                {rule.frequency.toLowerCase()}
                                {rule.interval && rule.interval > 1 ? ` (${rule.interval}x)` : ''}
                              </span>
                              <span className="text-[10px] text-slate-400">•</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md">
                                {rule.categoryName || cat?.name || 'General'}
                              </span>
                              {rule.subcategory && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                                  {rule.subcategory}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-base font-extrabold ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isInvest
                                ? 'text-teal-600 dark:text-teal-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {isIncome ? `+${formatINR(rule.amount)}` : formatINR(rule.amount)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${dueInfo.color}`}>
                          {rule.nextDueDate} ({dueInfo.label})
                        </span>

                        <span className="text-[10px] font-bold text-slate-500">
                          {rule.accountName || rule.creditCardName || rule.categoryName || 'Auto'}
                        </span>
                      </div>

                      {linkedGoal && (
                        <div className="mt-2 flex items-center space-x-1.5 px-2 py-0.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/40 dark:border-teal-900/30">
                          <span className="text-[10px] font-bold">🎯 Goal:</span>
                          <span className="text-[10px] font-extrabold truncate">{linkedGoal.name}</span>
                        </div>
                      )}

                      {rule.notes && (
                        <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl italic line-clamp-1">
                          "{rule.notes}"
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => handleExecuteSingleNow(rule)}
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center space-x-1 transition-all"
                        title="Record 1 transaction now"
                      >
                        <Zap size={12} />
                        <span>Record Now</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => toggleRecurringActive(rule.id)}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                          title={rule.isActive ? 'Pause' : 'Resume'}
                        >
                          {rule.isActive ? <Pause size={13} /> : <Play size={13} />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(rule)}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmRule(rule)}
                          className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredList.map((rule, idx) => {
                const cat = categories.find(c => c.id === rule.categoryId);
                const isIncome = rule.type === 'INCOME';
                const isInvest = rule.type === 'INVESTMENT_CONTRIBUTION';
                const dueInfo = formatDueBadge(rule.nextDueDate);
                const linkedGoal = goals?.find(g => g.id === rule.goalId);

                return (
                  <div
                    key={`rec_list_${rule.id}_${idx}`}
                    className={`p-3.5 rounded-3xl border transition-all flex items-center justify-between ${
                      rule.isActive
                        ? 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-750 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200/40 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <Category3DIcon
                        name={cat?.icon || (isIncome ? 'ArrowDownLeft' : isInvest ? 'TrendingUp' : 'Repeat')}
                        categoryName={rule.categoryName || cat?.name || rule.name}
                        color={cat?.color || (isIncome ? '#10b981' : isInvest ? '#059669' : '#6366f1')}
                        size="sm"
                        glow={rule.isActive}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {rule.name}
                          </h4>
                          {!rule.isActive && (
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600">
                              Paused
                            </span>
                          )}
                        </div>
                        <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span className="capitalize font-bold">{rule.frequency.toLowerCase()}</span>
                          <span>•</span>
                          <span>{rule.accountName || rule.creditCardName || rule.categoryName}</span>
                          {rule.subcategory && (
                            <>
                              <span>•</span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded">
                                {rule.subcategory}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span className={`font-bold ${dueInfo.color.split(' ')[0]}`}>{dueInfo.label}</span>
                          {linkedGoal && (
                            <>
                              <span>•</span>
                              <span className="px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 font-bold text-[9px] flex items-center gap-0.5">
                                🎯 {linkedGoal.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span
                        className={`text-sm font-extrabold ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isInvest
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {isIncome ? `+${formatINR(rule.amount)}` : formatINR(rule.amount)}
                      </span>

                      <button
                        onClick={() => handleExecuteSingleNow(rule)}
                        className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                        title="Record Now"
                      >
                        <Zap size={13} />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(rule)}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmRule(rule)}
                        className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add / Edit Form Modal Sub-view */}
        {isAddingNew && (
          <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                    <Repeat size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingRuleId ? 'Edit Recurring Rule' : 'New Recurring Payment Rule'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* Type Selector with Cute Tabs */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                    Transaction Type
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['EXPENSE', 'INCOME', 'INVESTMENT_CONTRIBUTION', 'LOAN_REPAYMENT'] as TransactionType[]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormType(t)}
                        className={`py-2 px-1 rounded-2xl font-bold text-center text-[11px] transition-all ${
                          formType === t
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {t === 'EXPENSE' && '💸 Expense'}
                        {t === 'INCOME' && '💰 Income'}
                        {t === 'INVESTMENT_CONTRIBUTION' && '📈 SIP / Invest'}
                        {t === 'LOAN_REPAYMENT' && '💳 Loan EMI'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title & Amount */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Title / Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="e.g. House Rent, Netflix..."
                      className="w-full px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 focus:border-indigo-500 font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={formAmount}
                      onChange={e => setFormAmount(e.target.value)}
                      placeholder="₹ Amount"
                      className="w-full px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 focus:border-indigo-500 font-extrabold outline-none text-right"
                    />
                  </div>
                </div>

                {/* Frequency CustomSelect */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Frequency Cycle
                  </label>
                  <CustomSelect
                    value={formFrequency}
                    onChange={val => setFormFrequency(val as RecurrenceFrequency)}
                    options={frequencySelectOptions}
                    size="md"
                    placeholder="Select frequency..."
                  />
                </div>

                {/* Start Date & Next Due Date using CustomDatePicker */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <CustomDatePicker
                      label="Start Date"
                      value={formStartDate}
                      onChange={d => setFormStartDate(d)}
                      size="md"
                    />
                  </div>

                  <div>
                    <CustomDatePicker
                      label="Next Due Date"
                      value={formNextDueDate}
                      onChange={d => setFormNextDueDate(d)}
                      size="md"
                    />
                  </div>
                </div>

                {/* Category CustomSelect with 3D Icons */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <CustomSelect
                    value={formCategoryId}
                    onChange={val => {
                      setFormCategoryId(val);
                      setFormSubcategory('');
                    }}
                    options={categorySelectOptions}
                    size="md"
                    searchable={true}
                    placeholder="Select category..."
                  />

                  {/* Subcategories Selector */}
                  {(() => {
                    const selectedCategoryObj = categories.find(c => c.id === formCategoryId);
                    if (selectedCategoryObj && selectedCategoryObj.subcategories && selectedCategoryObj.subcategories.length > 0) {
                      return (
                        <div className="mt-2">
                          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">
                            Select Subcategory
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCategoryObj.subcategories.map((sub, idx) => {
                              const isSelected = formSubcategory === sub;
                              return (
                                <button
                                  key={`sub_${sub}_${idx}`}
                                  type="button"
                                  onClick={() => setFormSubcategory(isSelected ? '' : sub)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                    isSelected
                                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/20'
                                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  {sub}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Bank Account & Credit Card CustomSelects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Pay From Bank Account
                    </label>
                    <CustomSelect
                      value={formAccountId}
                      onChange={val => {
                        setFormAccountId(val);
                        if (val) setFormCardId('');
                      }}
                      options={accountSelectOptions}
                      size="md"
                      placeholder="Select Account..."
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Or Credit Card
                    </label>
                    <CustomSelect
                      value={formCardId}
                      onChange={val => {
                        setFormCardId(val);
                        if (val) setFormAccountId('');
                      }}
                      options={cardSelectOptions}
                      size="md"
                      placeholder="Select Credit Card..."
                    />
                  </div>
                </div>

                {/* Payment App */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Payment Method / App
                  </label>
                  <CustomSelect
                    value={formPaymentAppId}
                    onChange={val => setFormPaymentAppId(val)}
                    options={paymentAppSelectOptions}
                    size="md"
                    placeholder="Select Payment App..."
                  />
                </div>

                {/* Linked Savings Goal (Optional) */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Link to Savings Goal (Optional)
                  </label>
                  <CustomSelect
                    value={formGoalId}
                    onChange={val => setFormGoalId(val)}
                    options={goalSelectOptions}
                    size="md"
                    placeholder="Choose a goal to auto-contribute on payment..."
                  />
                </div>

                {/* Auto Record Toggle */}
                <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center space-x-2.5">
                  <input
                    type="checkbox"
                    id="modal_auto_record"
                    checked={formAutoRecord}
                    onChange={e => setFormAutoRecord(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <label htmlFor="modal_auto_record" className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    ⚡ Automatically record ledger entry on due date without manual prompts
                  </label>
                </div>

                {/* Optional End Date using CustomDatePicker */}
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="modal_end_date_toggle"
                      checked={formHasEndDate}
                      onChange={e => setFormHasEndDate(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <label htmlFor="modal_end_date_toggle" className="font-bold text-slate-700 dark:text-slate-300">
                      Set expiry / contract end date
                    </label>
                  </div>
                  {formHasEndDate && (
                    <CustomDatePicker
                      value={formEndDate}
                      onChange={d => setFormEndDate(d)}
                      placeholder="Select end date..."
                      size="md"
                      clearable={true}
                    />
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Notes & Details
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    placeholder="e.g. Account number, landlord contact..."
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Form Buttons */}
                <div className="pt-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Check size={16} />
                    <span>{editingRuleId ? 'Update Rule' : 'Save Recurring Rule'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={Boolean(deleteConfirmRule)}
          onClose={() => setDeleteConfirmRule(null)}
          onConfirm={() => {
            if (deleteConfirmRule) {
              deleteRecurring(deleteConfirmRule.id, true);
              setDeleteConfirmRule(null);
            }
          }}
          title="Delete Recurring Payment Rule?"
          description="Are you sure you want to delete this recurring payment rule? Future occurrences will no longer be generated. You can restore it from More → Trash Bin."
          itemDetails={
            deleteConfirmRule
              ? {
                  title: deleteConfirmRule.name,
                  amount: formatINR(deleteConfirmRule.amount),
                  subtitle: `${deleteConfirmRule.frequency} • Next: ${deleteConfirmRule.nextDueDate}`,
                  badge: deleteConfirmRule.type.replace(/_/g, ' '),
                }
              : undefined
          }
          confirmLabel="Delete Rule"
        />
      </div>
    </div>
  );
};
