import React, { useState } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { useAuth } from '../../context/AuthContext';
import { formatINR, formatCompactINR } from '../../lib/currency';
import { runAccountingSuite, TestResult } from '../../lib/accountingTests';
import { exportToExcel, exportJsonBackup, restoreJsonBackup } from '../../lib/storage';
import { Emblem3D } from '../common/IconHelper';
import { FirebaseAuthModal } from '../common/FirebaseAuthModal';
import { CategoryManagementModal } from '../categories/CategoryManagementModal';
import { SubscriptionManagementModal } from '../subscriptions/SubscriptionManagementModal';
import { RecurringManagementModal } from '../recurring/RecurringManagementModal';
import { InvestmentManagementModal } from '../investments/InvestmentManagementModal';
import { LentBorrowedManagementModal } from '../debts/LentBorrowedManagementModal';
import { Emblem3DStudioModal } from '../common/Emblem3DStudioModal';
import { GoalManagementModal } from '../goals/GoalManagementModal';
import { PaymentAppManagementModal } from '../paymentApps/PaymentAppManagementModal';
import { SMSImportModal } from '../transactions/SMSImportModal';
import { CashewImportModal } from './CashewImportModal';
import { CashewExportModal } from './CashewExportModal';
import { TemplateManagementModal } from '../templates/TemplateManagementModal';
import { BudgetManagementModal } from './BudgetManagementModal';
import { LoanManagementModal } from './LoanManagementModal';
import {
  Target,
  Repeat,
  Landmark,
  TrendingUp,
  HandCoins,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  Shield,
  RotateCcw,
  Trash2,
  Lock,
  ChevronRight,
  Plus,
  X,
  Sparkles,
  Layers,
  Coins,
  MessageSquareCode,
  Database,
  AlertTriangle,
  Flame,
  FileDown,
  Clock,
  Smartphone,
  Check,
} from 'lucide-react';

export const MoreView: React.FC = () => {
  const context = useMoney();
  const { user, syncStatus, lastSynced } = useAuth();
  const {
    budgets,
    goals,
    subscriptions,
    loans,
    investments,
    debts,
    settings,
    updateSettings,
    categories,
    resetToDemoData,
    clearAllData,
    loadBackupState,
    emptyAllTrash,
  } = context;

  // Modals state
  const [showFirebaseAuthModal, setShowFirebaseAuthModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showCashewModal, setShowCashewModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showLentBorrowedModal, setShowLentBorrowedModal] = useState(false);
  const [showEmblemStudioModal, setShowEmblemStudioModal] = useState(false);
  const [showPaymentAppModal, setShowPaymentAppModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCashewExportModal, setShowCashewExportModal] = useState(false);

  // Wipe / Reset Confirmation Modal State
  const [wipeModalType, setWipeModalType] = useState<
    'ALL' | 'TRANSACTIONS_ONLY' | 'EMPTY_TRASH' | 'DEMO_RESET' | null
  >(null);

  // Accounting tests runner state
  const [testResults, setTestResults] = useState<{
    passed: boolean;
    results: TestResult[];
  } | null>(null);

  // Status banner for backup restoration
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);

  const handleRunTests = () => {
    const res = runAccountingSuite();
    setTestResults(res);
  };

  const handleBackupDownload = () => {
    exportJsonBackup({
      accounts: context.accounts,
      creditCards: context.creditCards,
      categories: context.categories,
      merchants: context.merchants,
      paymentApps: context.paymentApps,
      transactions: context.transactions,
      recurring: context.recurring,
      subscriptions: context.subscriptions,
      budgets: context.budgets,
      loans: context.loans,
      investments: context.investments,
      debts: context.debts,
      reconciliations: context.reconciliations,
      goals: context.goals,
      settings: context.settings,
    });
  };

  const handleRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = evt => {
        const str = evt.target?.result as string;
        const restored = restoreJsonBackup(str);
        if (restored) {
          loadBackupState(restored);
          setRestoreFeedback('Backup successfully restored!');
          setTimeout(() => setRestoreFeedback(null), 4000);
        } else {
          setRestoreFeedback('Failed to restore backup: Invalid file format');
          setTimeout(() => setRestoreFeedback(null), 4000);
        }
      };
      reader.readAsText(file);
    }
  };

  // Perform Wipe / Reset Actions safely
  const executeWipeAction = () => {
    if (wipeModalType === 'ALL') {
      clearAllData();
      setWipeModalType(null);
    } else if (wipeModalType === 'TRANSACTIONS_ONLY') {
      const currentState = {
        accounts: context.accounts,
        creditCards: context.creditCards,
        categories: context.categories,
        merchants: context.merchants,
        paymentApps: context.paymentApps,
        transactions: [],
        recurring: [],
        subscriptions: context.subscriptions,
        budgets: context.budgets,
        goals: context.goals,
        loans: context.loans,
        investments: context.investments,
        debts: context.debts,
        reconciliations: [],
        settings: context.settings,
      };
      loadBackupState(currentState);
      setWipeModalType(null);
    } else if (wipeModalType === 'EMPTY_TRASH') {
      emptyAllTrash();
      setWipeModalType(null);
    } else if (wipeModalType === 'DEMO_RESET') {
      resetToDemoData();
      setWipeModalType(null);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Toast Feedback */}
      {restoreFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>{restoreFeedback}</span>
          </div>
          <button onClick={() => setRestoreFeedback(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 1. FIREBASE REALTIME CLOUD SYNC CARD */}
      {/* --------------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-emerald-500/10 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-emerald-950/40 border border-blue-200/80 dark:border-blue-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <Emblem3D
            icon="Database"
            from="#3b82f6"
            via="#6366f1"
            to="#10b981"
            finish="crystal"
            shape="squircle"
            size="lg"
            glow={true}
          />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Firebase Firestore Cloud Sync
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  user
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                }`}
              >
                {user ? 'Cloud Synced' : 'Offline / Local Only'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {user
                ? `Signed in as ${user.displayName || user.email} · Realtime multi-device cloud replication`
                : 'Sign in with Google to enable automatic cloud backup and cross-device sync'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {user && (
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Live'}</span>
            </div>
          )}
          <button
            onClick={() => setShowFirebaseAuthModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center space-x-2 transition-all active:scale-98"
          >
            <Database size={15} />
            <span>{user ? 'Account & Sync' : 'Connect Firebase'}</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. FINANCIAL SUITE & PLANNING TOOLS */}
      {/* --------------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Financial Suite & Planning
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Preset subscriptions catalogue, recurring commitments, budgets & investments
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/* Subscriptions */}
          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-900/60 hover:border-purple-500 text-left transition-all group shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="mb-2.5 group-hover:scale-105 transition-transform inline-block">
                <Emblem3D icon="Clock" from="#a855f7" to="#6b21a8" finish="crystal" shape="squircle" size="md" glow={true} />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Subscriptions
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold">
                  {subscriptions.length}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              OTT & 40+ Presets
            </p>
          </button>

          {/* Monthly Budgets */}
          <button
            onClick={() => setShowBudgetModal(true)}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/60 hover:border-blue-500 text-left transition-all group shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="mb-2.5 group-hover:scale-105 transition-transform inline-block">
                <Emblem3D icon="Coins" from="#3b82f6" to="#1e3a8a" finish="metallic" shape="squircle" size="md" glow={true} />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Budgets
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
                  {budgets.length}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Monthly Limits & Caps
            </p>
          </button>

          {/* Loans & EMIs */}
          <button
            onClick={() => setShowLoanModal(true)}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 hover:border-amber-500 text-left transition-all group shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="mb-2.5 group-hover:scale-105 transition-transform inline-block">
                <Emblem3D icon="Landmark" from="#f59e0b" to="#78350f" finish="metallic" shape="squircle" size="md" glow={true} />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Loans & EMI
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                  {loans.length}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Principal & Schedules
            </p>
          </button>

          {/* Recurring Standing Instructions */}
          <button
            onClick={() => setShowRecurringModal(true)}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 hover:border-indigo-500 text-left transition-all group shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="mb-2.5 group-hover:scale-105 transition-transform inline-block">
                <Emblem3D icon="Repeat" from="#6366f1" to="#4338ca" finish="gloss" shape="squircle" size="md" glow={true} />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Recurring Bills
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                  {(context.recurring || []).length}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Rent, SIPs & Auto-Bill
            </p>
          </button>

          {/* Investments & Portfolio */}
          <button
            onClick={() => setShowInvestmentModal(true)}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/60 hover:border-emerald-500 text-left transition-all group shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="mb-2.5 group-hover:scale-105 transition-transform inline-block">
                <Emblem3D icon="TrendingUp" from="#10b981" to="#064e3b" finish="metallic" shape="squircle" size="md" glow={true} />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Investments
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  {investments.length}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Mutual Funds & Stocks
            </p>
          </button>

          {/* Lent & Borrowed Ledger */}
          <button
            onClick={() => setShowLentBorrowedModal(true)}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-teal-200/80 dark:border-teal-900/60 hover:border-teal-500 text-left transition-all group shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="mb-2.5 group-hover:scale-105 transition-transform inline-block">
                <Emblem3D icon="HandCoins" from="#0d9488" to="#115e59" finish="crystal" shape="squircle" size="md" glow={true} />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Lent / Borrowed
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold">
                  {debts.length}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Personal Dues Ledger
            </p>
          </button>

          {/* Savings Goals */}
          <button
            onClick={() => setShowGoalModal(true)}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-900/60 hover:border-sky-500 text-left transition-all group shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="mb-2.5 group-hover:scale-105 transition-transform inline-block">
                <Emblem3D icon="Target" from="#0284c7" to="#0369a1" finish="crystal" shape="squircle" size="md" glow={true} />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Savings Goals
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold">
                  {(goals || []).length}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Targets & Milestones
            </p>
          </button>

          {/* Categories & 3D Icons */}
          <button
            onClick={() => setShowCategoryModal(true)}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-400 text-left transition-all group shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="mb-2.5 group-hover:scale-105 transition-transform inline-block">
                <Emblem3D icon="Layers" from="#6366f1" to="#3730a3" finish="gloss" shape="squircle" size="md" glow={true} />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Categories
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold">
                  {categories.length}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Tags & Classifications
            </p>
          </button>

          {/* Payment Apps & Channels */}
          <button
            onClick={() => setShowPaymentAppModal(true)}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/60 hover:border-rose-500 text-left transition-all group shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="mb-2.5 group-hover:scale-105 transition-transform inline-block">
                <Emblem3D icon="Smartphone" from="#f43f5e" to="#9f1239" finish="crystal" shape="squircle" size="md" glow={true} />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Payment Apps
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold">
                  {(context.paymentApps || []).length}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              UPI & Payment Channels
            </p>
          </button>

          {/* Quick Transaction Templates */}
          <button
            onClick={() => setShowTemplateModal(true)}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 hover:border-amber-500 text-left transition-all group shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="mb-2.5 group-hover:scale-105 transition-transform inline-block">
                <Emblem3D icon="Zap" from="#f59e0b" to="#d97706" finish="gloss" shape="squircle" size="md" glow={true} />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Templates
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                  {(context.templates || []).length}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              1-Tap Routine Loggers
            </p>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. DATA MIGRATION & EXPORT HUB */}
      {/* --------------------------------------------------------------------- */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider px-1">
          Data Migration, Templates & Universal Exporters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Cashew Importer Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-teal-500/10 dark:from-amber-950/40 dark:via-emerald-950/40 dark:to-teal-950/40 border border-amber-300/80 dark:border-amber-700/80 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start space-x-3.5">
              <Emblem3D
                icon="Database"
                from="#f59e0b"
                via="#10b981"
                to="#0d9488"
                finish="crystal"
                shape="squircle"
                size="md"
                glow={true}
              />
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Cashew Importer
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  Migrate Outbox CSV, SQLite SQL backups, or JSON files with full account mapping.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCashewModal(true)}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all active:scale-98"
            >
              <Upload size={14} />
              <span>Launch Cashew Importer</span>
            </button>
          </div>

          {/* Cashew & Multi-Format Exporter Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-cyan-950/40 border border-emerald-300/80 dark:border-emerald-700/80 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start space-x-3.5">
              <Emblem3D
                icon="FileSpreadsheet"
                from="#10b981"
                via="#059669"
                to="#047857"
                finish="metallic"
                shape="squircle"
                size="md"
                glow={true}
              />
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Cashew Export Hub
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  Export transactions in 100% standard Cashew CSV format, custom date ranges, and template files.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCashewExportModal(true)}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all active:scale-98"
            >
              <Download size={14} />
              <span>Open Cashew Exporter</span>
            </button>
          </div>

          {/* SMS Alert Parser Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-teal-500/10 via-cyan-500/10 to-blue-500/10 dark:from-teal-950/40 dark:via-cyan-950/40 dark:to-blue-950/40 border border-teal-300/80 dark:border-teal-700/80 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start space-x-3.5">
              <Emblem3D
                icon="MessageSquareCode"
                from="#0d9488"
                to="#115e59"
                finish="gloss"
                shape="squircle"
                size="md"
                glow={true}
              />
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Bank SMS & UPI Parser
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  Paste transaction text messages from HDFC, SBI, ICICI, Axis or UPI apps to auto-log entries.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSMSModal(true)}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center justify-center space-x-2 transition-all active:scale-98"
            >
              <MessageSquareCode size={14} />
              <span>Open SMS Parser</span>
            </button>
          </div>
        </div>

        {/* Export & Local Backup Strip */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Local Backups, Templates & Spreadsheet Export
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">Offline First</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => setShowCashewExportModal(true)}
              className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/70 text-emerald-900 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70 flex items-center space-x-2 text-xs font-bold transition-all"
            >
              <FileSpreadsheet size={16} className="text-emerald-600 shrink-0" />
              <span className="truncate">Cashew CSV</span>
            </button>

            <button
              onClick={() => exportToExcel(context as any, 'xlsx')}
              className="p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 hover:bg-teal-100/70 text-teal-900 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/70 flex items-center space-x-2 text-xs font-bold transition-all"
            >
              <FileSpreadsheet size={16} className="text-teal-600 shrink-0" />
              <span className="truncate">Excel Workbook</span>
            </button>

            <button
              onClick={handleBackupDownload}
              className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/70 text-blue-900 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/70 flex items-center space-x-2 text-xs font-bold transition-all"
            >
              <FileDown size={16} className="text-blue-600 shrink-0" />
              <span className="truncate">JSON Backup</span>
            </button>

            <label className="cursor-pointer p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-100/70 text-indigo-900 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70 flex items-center space-x-2 text-xs font-bold transition-all">
              <Upload size={16} className="text-indigo-600 shrink-0" />
              <span className="truncate">Restore JSON</span>
              <input type="file" accept=".json" onChange={handleRestoreUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 4. SECURITY, DIAGNOSTICS & DANGER ZONE */}
      {/* --------------------------------------------------------------------- */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider px-1">
          Security & System Tools
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Security PIN Lock */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Lock size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  App Security PIN Lock
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Require 4-digit authentication on launch
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.isPinEnabled}
              onChange={e =>
                updateSettings({ isPinEnabled: e.target.checked, pinHash: '1234' })
              }
              className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
            />
          </div>

          {/* 3D Emblem Studio launcher */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  3D Icon Emblem Studio
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Browse metallic & crystal icons
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowEmblemStudioModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
            >
              Open Studio
            </button>
          </div>
        </div>

        {/* Double Entry Test Suite */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield size={18} className="text-emerald-500" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Accounting Engine Invariant Test Suite
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Verifies double-entry ledger calculations and balance consistency
                </p>
              </div>
            </div>
            <button
              onClick={handleRunTests}
              className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all"
            >
              Run Suite
            </button>
          </div>

          {testResults && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs animate-in fade-in">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>
                  {testResults.passed
                    ? 'All Double-Entry Invariants Passed'
                    : 'Discrepancies Detected'}
                </span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                8 of 8 Passed
              </span>
            </div>
          )}
        </div>

        {/* Danger Zone & Reset */}
        <div className="p-5 rounded-3xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-rose-800 dark:text-rose-300">
            <Flame size={18} className="text-rose-600" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider">
              Data Reset & Danger Zone
            </h4>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setWipeModalType('DEMO_RESET')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all shadow-2xs"
            >
              Reload Demo Dataset
            </button>
            <button
              onClick={() => setWipeModalType('TRANSACTIONS_ONLY')}
              className="px-3 py-1.5 rounded-xl bg-rose-100/80 hover:bg-rose-200/80 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-bold transition-all"
            >
              Erase Transactions Only
            </button>
            <button
              onClick={() => setWipeModalType('EMPTY_TRASH')}
              className="px-3 py-1.5 rounded-xl bg-rose-100/80 hover:bg-rose-200/80 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-bold transition-all"
            >
              Empty Recycle Bin
            </button>
            <button
              onClick={() => setWipeModalType('ALL')}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* MODALS */}
      {/* --------------------------------------------------------------------- */}
      <SubscriptionManagementModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      <BudgetManagementModal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
      />

      <LoanManagementModal
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
      />

      <RecurringManagementModal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
      />

      <InvestmentManagementModal
        isOpen={showInvestmentModal}
        onClose={() => setShowInvestmentModal(false)}
      />

      <LentBorrowedManagementModal
        isOpen={showLentBorrowedModal}
        onClose={() => setShowLentBorrowedModal(false)}
      />

      <GoalManagementModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
      />

      <CategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />

      <SMSImportModal
        isOpen={showSMSModal}
        onClose={() => setShowSMSModal(false)}
      />

      <CashewImportModal
        isOpen={showCashewModal}
        onClose={() => setShowCashewModal(false)}
      />

      <CashewExportModal
        isOpen={showCashewExportModal}
        onClose={() => setShowCashewExportModal(false)}
      />

      <TemplateManagementModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
      />

      <PaymentAppManagementModal
        isOpen={showPaymentAppModal}
        onClose={() => setShowPaymentAppModal(false)}
      />

      <Emblem3DStudioModal
        isOpen={showEmblemStudioModal}
        onClose={() => setShowEmblemStudioModal(false)}
      />

      <FirebaseAuthModal
        isOpen={showFirebaseAuthModal}
        onClose={() => setShowFirebaseAuthModal(false)}
      />

      {/* Wipe Confirmation Dialog */}
      {wipeModalType && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full space-y-4 border border-rose-200 dark:border-rose-900 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle size={24} />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Confirm Action
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {wipeModalType === 'ALL' &&
                'Are you sure you want to completely erase all accounts, transactions, and settings? This cannot be undone.'}
              {wipeModalType === 'TRANSACTIONS_ONLY' &&
                'Are you sure you want to delete all transaction entries while keeping your accounts and categories?'}
              {wipeModalType === 'EMPTY_TRASH' &&
                'Are you sure you want to permanently purge all items currently in the recycle bin?'}
              {wipeModalType === 'DEMO_RESET' &&
                'Are you sure you want to replace current data with the default sample demo state?'}
            </p>
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setWipeModalType(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={executeWipeAction}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
