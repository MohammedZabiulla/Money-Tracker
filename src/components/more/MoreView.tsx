import React, { useState } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useMoney } from '../../context/MoneyContext';
import { useAuth } from '../../context/AuthContext';
import { runAccountingSuite, TestResult } from '../../lib/accountingTests';
import { exportToExcel, exportJsonBackup, restoreJsonBackup } from '../../lib/storage';
import { Emblem3D } from '../common/IconHelper';
import { CategoryManagementModal } from '../categories/CategoryManagementModal';
import { SubscriptionManagementModal } from '../subscriptions/SubscriptionManagementModal';
import { RecurringManagementModal } from '../recurring/RecurringManagementModal';
import { InvestmentManagementModal } from '../investments/InvestmentManagementModal';
import { LentBorrowedManagementModal } from '../debts/LentBorrowedManagementModal';
import { Emblem3DStudioModal } from '../common/Emblem3DStudioModal';
import { GoalManagementModal } from '../goals/GoalManagementModal';
import { PaymentAppManagementModal } from '../paymentApps/PaymentAppManagementModal';
import { TemplateManagementModal } from '../templates/TemplateManagementModal';
import { BudgetManagementModal } from './BudgetManagementModal';
import { LoanManagementModal } from './LoanManagementModal';
import { ActivityAuditLogModal } from './ActivityAuditLogModal';
import { CashewImportModal } from './CashewImportModal';
import { AppImportExportModal } from './AppImportExportModal';
import { TrashModal } from '../common/TrashModal';
import { FAQGuideSection } from './FAQGuideSection';
import { NotesManagementModal } from './NotesManagementModal';
import { ErrorLogsModal } from '../common/ErrorLogsModal';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  Shield,
  Lock,
  X,
  Sparkles,
  FileDown,
  History,
  AlertTriangle,
  Flame,
  RefreshCw,
  Database,
  ArrowRight,
  Trash2,
  FileX2,
  BookOpen,
  FileText,
  KeyRound,
  Cloud,
  Bug,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
} from 'lucide-react';

export const MoreView: React.FC = React.memo(() => {
  const context = useMoney();
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
    transactions,
  } = context;

  // Modals state
  const [showGoalModal, setShowGoalModal] = useState(false);
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
  const [showActivityLogModal, setShowActivityLogModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showCashewImportModal, setShowCashewImportModal] = useState(false);
  const [showAppImportExportModal, setShowAppImportExportModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const auth = useAuth();
  const [cloudMessage, setCloudMessage] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const handleCopyDomain = () => {
    const domain = window.location.hostname;
    navigator.clipboard.writeText(domain);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const handleMobileRedirectSync = async () => {
    try {
      setCloudMessage('Redirecting to Google sign-in (mobile safe)...');
      await auth.signInWithGoogleRedirect();
    } catch (err: any) {
      setCloudMessage(err?.message || 'Redirect failed');
    }
  };

  const handleCloudSync = async () => {
    try {
      if (!auth.user) {
        await auth.signIn(auth.cloudProvider === 'none' ? 'firestore' : auth.cloudProvider);
      }
      const currentState = {
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
        templates: context.templates,
        settings: context.settings,
        activityLogs: context.activityLogs,
      };
      await auth.pushStateToCloud(currentState);
      const provName = auth.cloudProvider === 'gdrive' ? 'Google Drive' : 'Cloud Firestore';
      setCloudMessage(`Data securely synced to ${provName}! Includes accounts, transactions, trash bin & audit logs.`);
      setTimeout(() => setCloudMessage(null), 6000);
    } catch (err: any) {
      setCloudMessage(err?.message || 'Cloud sync failed.');
    }
  };

  const handleCloudRestore = async () => {
    try {
      if (!auth.user) {
        await auth.signIn(auth.cloudProvider === 'none' ? 'firestore' : auth.cloudProvider);
      }
      const cloudState = await auth.pullStateFromCloud();
      if (cloudState) {
        context.loadBackupState(cloudState);
        setCloudMessage('Data successfully restored from cloud backup (accounts, transactions, trash & audit logs)!');
        setTimeout(() => setCloudMessage(null), 6000);
      } else {
        setCloudMessage('No cloud backup found for this account.');
      }
    } catch (err: any) {
      setCloudMessage(err?.message || 'Cloud restore failed.');
    }
  };
  const [showPinModal, setShowPinModal] = useState(false);
  const [showErrorLogsModal, setShowErrorLogsModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const isAnyModalOpen = showGoalModal || showCategoryModal || showSubscriptionModal || showRecurringModal || showInvestmentModal || showLentBorrowedModal || showEmblemStudioModal || showPaymentAppModal || showBudgetModal || showLoanModal || showTemplateModal || showActivityLogModal || showTrashModal || showCashewImportModal || showAppImportExportModal || showGuideModal || showNotesModal || showPinModal || showErrorLogsModal;
  useScrollLock(isAnyModalOpen);

  const [importExportInitialTab, setImportExportInitialTab] = useState<'EXPORT' | 'IMPORT'>('EXPORT');

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

  // Perform Wipe / Reset Actions safely
  const executeWipeAction = () => {
    if (wipeModalType === 'ALL') {
      clearAllData();
      setWipeModalType(null);
    } else if (wipeModalType === 'TRANSACTIONS_ONLY') {
      context.clearTransactionsData();
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
      {/* 1. FINANCIAL SUITE & PLANNING TOOLS */}
      {/* --------------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Financial Suite & Planning
            </h3>
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
                  {(debts || []).filter(d => !d.isDeleted && !d.isSettled).length}
                </span>
              </div>
            </div>
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
                  {(goals || []).filter(g => !g.isDeleted && g.status !== 'CLOSED').length}
                </span>
              </div>
            </div>
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
          </button>

          {/* Audit & Change Logs */}
          <button
            onClick={() => setShowActivityLogModal(true)}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/60 hover:border-blue-500 text-left transition-all group shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="mb-2.5 group-hover:scale-105 transition-transform inline-block">
                <Emblem3D icon="History" from="#3b82f6" to="#1d4ed8" finish="crystal" shape="squircle" size="md" glow={true} />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Audit Logs
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold">
                  {(context.activityLogs || []).length}
                </span>
              </div>
            </div>
          </button>

          {/* Trash Bin */}
          <button
            onClick={() => setShowTrashModal(true)}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/60 hover:border-rose-500 text-left transition-all group shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="mb-2.5 group-hover:scale-105 transition-transform inline-block">
                <Emblem3D icon="Trash2" from="#f43f5e" to="#be123c" finish="crystal" shape="squircle" size="md" glow={true} />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Trash Bin
                </h4>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  context.trashCount > 0
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 ring-1 ring-rose-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {context.trashCount}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. MINDFUL NOTES & QUICK LIST */}
      {/* --------------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="p-5 bg-gradient-to-br from-teal-500/10 via-cyan-500/10 to-slate-500/10 dark:from-teal-950/40 dark:via-cyan-950/40 dark:to-slate-900/40 rounded-3xl border border-teal-500/30 dark:border-teal-500/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                Mindful Notes & Quick List
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Take down numbers, grocery lists, or mindful thoughts and save them for anytime use.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowNotesModal(true)}
            className="py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer transition-all shrink-0"
          >
            <span>Open Notes Manager</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. DATA MIGRATION, IMPORT & EXPORT HUB */}
      {/* --------------------------------------------------------------------- */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider px-1">
          Data Migration, Import & Export Hub
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. App Unified Import & Export Hub */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all">
            <div className="flex items-start space-x-3.5">
              <Emblem3D icon="FileSpreadsheet" from="#10b981" to="#059669" finish="crystal" shape="squircle" size="md" glow={true} />
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">App Import & Export Hub</h4>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold">
                    All Formats
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-1 flex space-x-2">
              <button
                onClick={() => {
                  setImportExportInitialTab('EXPORT');
                  setShowAppImportExportModal(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Download size={13} />
                <span>Export Data</span>
              </button>
              <button
                onClick={() => {
                  setImportExportInitialTab('IMPORT');
                  setShowAppImportExportModal(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Upload size={13} />
                <span>Import Data</span>
              </button>
            </div>
          </div>

          {/* 2. Cashew Smart Importer */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-purple-500/10 border-2 border-indigo-500/30 dark:border-indigo-500/40 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-500 transition-all">
            <div className="flex items-start space-x-3.5">
              <Emblem3D icon="Database" from="#6366f1" to="#3b82f6" finish="crystal" shape="squircle" size="md" glow={true} />
              <div>
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Cashew Smart Importer</h4>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold">ENHANCED</span>
                </div>
              </div>
            </div>
            <div className="pt-1 flex space-x-2">
              <button
                onClick={() => setShowCashewImportModal(true)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Database size={13} />
                <span>Open Cashew Importer</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Cloud Multi-Device Sync & Backup (Firestore or Google Drive) */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-indigo-500/10 border-2 border-blue-500/30 dark:border-blue-500/40 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md">
                <Cloud size={20} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Cloud Multi-Device Live Sync & Backup</h4>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold">
                    {auth.user ? (auth.user.isAnonymous ? 'Cloud Session' : auth.user.email || 'Connected') : 'Offline'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Choose your cloud provider and sync mode. Automatically backs up accounts, transactions, <b>trash bin</b> & <b>audit logs</b>.
                </p>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              {auth.syncStatus === 'syncing' ? 'Syncing...' : auth.syncStatus === 'error' ? 'Sync Error' : auth.lastSynced ? `Synced: ${new Date(auth.lastSynced).toLocaleTimeString()}` : 'Not synced yet'}
            </div>
          </div>

          {/* Cloud Configuration Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/60 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-blue-500/20">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Cloud Backup</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => auth.setCloudProvider('gdrive')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    auth.cloudProvider === 'gdrive'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Google Drive (Free)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Sync & Backup Mode</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => auth.setSyncMode('auto')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    auth.syncMode === 'auto'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Automatic (Live)
                </button>
                <button
                  type="button"
                  onClick={() => auth.setSyncMode('manual')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    auth.syncMode === 'manual'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Manual Only
                </button>
              </div>
            </div>
          </div>

          {auth.cloudProvider === 'gdrive' && !auth.user && (
            <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-blue-500/20 text-xs space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">App Domain:</span>
                  <code className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-bold border border-blue-200 dark:border-blue-900">
                    {typeof window !== 'undefined' ? window.location.hostname : 'logexpense786.ai.studio'}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer"
                >
                  {copiedDomain ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copiedDomain ? 'Copied' : 'Copy Domain'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                To enable Google sign-in on mobile or custom domains, ensure your domain is added in{' '}
                <a
                  href="https://console.firebase.google.com/project/gen-lang-client-0862665518/authentication/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-bold underline inline-flex items-center space-x-0.5"
                >
                  <span>Firebase Authorized Domains</span>
                  <ExternalLink size={10} />
                </a>.
              </p>
            </div>
          )}

          {cloudMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold space-y-1.5 ${
              cloudMessage.includes('Domain') || cloudMessage.includes('not authorized')
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200'
                : 'bg-blue-500/15 border border-blue-500/30 text-blue-800 dark:text-blue-200'
            }`}>
              <div>{cloudMessage}</div>
              {(cloudMessage.includes('Domain') || cloudMessage.includes('not authorized') || cloudMessage.includes('Firebase Console')) && (
                <div className="pt-1 flex items-center space-x-2">
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0862665518/authentication/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors"
                  >
                    <span>Open Firebase Settings</span>
                    <ExternalLink size={11} />
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyDomain}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center space-x-1"
                  >
                    {copiedDomain ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    <span>{copiedDomain ? 'Copied' : 'Copy Domain'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="pt-1 flex flex-wrap gap-2">
            <button
              onClick={handleCloudSync}
              className="flex-1 min-w-[140px] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Cloud size={14} />
              <span>{auth.user ? `Sync / Backup Now (${auth.cloudProvider === 'gdrive' ? 'Google Drive' : 'Firestore'})` : 'Sign in & Sync Now'}</span>
            </button>
            {auth.cloudProvider === 'gdrive' && !auth.user && (
              <button
                type="button"
                onClick={handleMobileRedirectSync}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5 cursor-pointer"
                title="Use if popup is blocked on mobile Chrome"
              >
                <Smartphone size={14} />
                <span>Mobile Sign-in</span>
              </button>
            )}
            <button
              onClick={handleCloudRestore}
              className="flex-1 min-w-[140px] py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Restore from Cloud</span>
            </button>
            {auth.user && !auth.user.isAnonymous && (
              <button
                onClick={() => setShowSignOutConfirm(true)}
                className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold transition-all cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <KeyRound size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Sign Out Confirmation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to sign out? Your cloud sync sessions will be disconnected.
              </p>
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  auth.signOut();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 4. APP PIN & BIOMETRIC / INTERACTIVE APP GUIDE & HANDBOOK */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Interactive App Guide Handbook Card */}
        <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-slate-500/10 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-slate-900/40 rounded-3xl border border-emerald-500/30 dark:border-emerald-500/20 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <BookOpen size={20} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                Interactive App Guide & Handbook
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Step-by-step documentation with visual UI actions for every feature and budget.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer transition-all"
          >
            <span>Open Guide Handbook</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* App Security PIN Lock Card */}
        <div className="p-5 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-slate-500/10 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-slate-900/40 rounded-3xl border border-purple-500/30 dark:border-purple-500/20 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Shield size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  App Security PIN
                </h4>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                  settings.isPinEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {settings.isPinEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Secure your financial records with a 4-digit security PIN lock.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                if (!settings.isPinEnabled) {
                  if (!settings.pinHash) {
                    setShowPinModal(true);
                  } else {
                    updateSettings({ isPinEnabled: true });
                  }
                } else {
                  updateSettings({ isPinEnabled: false });
                }
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                settings.isPinEnabled
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20'
              }`}
            >
              <Lock size={13} />
              <span>{settings.isPinEnabled ? 'Disable PIN Lock' : 'Enable PIN Lock'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPinModal(true)}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
              title="Change 4-Digit PIN"
            >
              <KeyRound size={13} />
              <span>Set PIN</span>
            </button>

            {settings.isPinEnabled && (
              <button
                type="button"
                onClick={() => context.lockApp()}
                className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                title="Lock App Now"
              >
                <span>Lock Now</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Developer Universal Error Logs Card */}
      <div className="p-5 bg-gradient-to-br from-rose-500/10 via-orange-500/10 to-slate-500/10 dark:from-rose-950/40 dark:via-orange-950/40 dark:to-slate-900/40 rounded-3xl border border-rose-500/30 dark:border-rose-500/20 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Bug size={20} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              Developer Universal Error Logs
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Inspect caught runtime, promise, and React rendering error logs with line numbers and stack traces.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowErrorLogsModal(true)}
          className="w-full sm:w-auto py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer transition-all shrink-0"
        >
          <span>View Error Logs</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 5. DANGER ZONE */}
      {/* --------------------------------------------------------------------- */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-extrabold text-rose-600 dark:text-rose-500 uppercase tracking-wider">
            Danger Zone
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Option 1: Clear Only Transactions */}
          <button
            onClick={() => setWipeModalType('TRANSACTIONS_ONLY')}
            className="p-4 rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400 dark:hover:border-amber-600 text-left transition-all group shadow-xs cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-2xl text-amber-700 dark:text-amber-300 group-hover:scale-105 transition-transform">
                <FileX2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">Clear Transactions</h4>
              </div>
            </div>
          </button>

          {/* Option 2: Wipe All Data */}
          <button
            onClick={() => setWipeModalType('ALL')}
            className="p-4 rounded-3xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 hover:border-rose-400 dark:hover:border-rose-600 text-left transition-all group shadow-xs cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-900/50 rounded-2xl text-rose-600 dark:text-rose-300 group-hover:scale-105 transition-transform">
                <Flame size={20} />
              </div>
              <div>
                <h4 className="font-bold text-rose-900 dark:text-rose-200 text-sm">Wipe All Data</h4>
              </div>
            </div>
          </button>

          {/* Option 3: Load Demo Data */}
          <button
            onClick={() => setWipeModalType('DEMO_RESET')}
            className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-left transition-all group shadow-xs cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-slate-200 dark:bg-slate-700 rounded-2xl text-slate-700 dark:text-slate-200 group-hover:rotate-180 transition-transform duration-500">
                <RefreshCw size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Load Demo Data</h4>
              </div>
            </div>
          </button>
        </div>
      </div>



      {/* Modals */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900/70">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Interactive App Guide & Handbook
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Step-by-step user manual and feature documentation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-9 h-9 rounded-full bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <FAQGuideSection isOpen={true} onClose={() => setShowGuideModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Notes Management Modal */}
      <NotesManagementModal isOpen={showNotesModal} onClose={() => setShowNotesModal(false)} />
      {showPinModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950/80 dark:text-purple-400">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Set 4-Digit Security PIN
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enter a secure numeric passcode</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">New 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="e.g. 1234"
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setPinError('');
                  }}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-lg font-mono tracking-widest text-slate-900 dark:text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Confirm PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="e.g. 1234"
                  value={confirmPinInput}
                  onChange={e => {
                    setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setPinError('');
                  }}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-lg font-mono tracking-widest text-slate-900 dark:text-white outline-none focus:border-purple-500"
                />
              </div>

              {pinError && <p className="text-xs text-rose-500 font-bold text-center">{pinError}</p>}
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput('');
                  setConfirmPinInput('');
                  setPinError('');
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pinInput.length !== 4) {
                    setPinError('PIN must be exactly 4 digits');
                    return;
                  }
                  if (pinInput !== confirmPinInput) {
                    setPinError('PINs do not match');
                    return;
                  }
                  updateSettings({ isPinEnabled: true, pinHash: pinInput });
                  setShowPinModal(false);
                  setPinInput('');
                  setConfirmPinInput('');
                  setPinError('');
                }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-purple-600/20"
              >
                Save & Enable PIN
              </button>
            </div>
          </div>
        </div>
      )}
      <SubscriptionManagementModal isOpen={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} />
      <RecurringManagementModal isOpen={showRecurringModal} onClose={() => setShowRecurringModal(false)} />
      <InvestmentManagementModal isOpen={showInvestmentModal} onClose={() => setShowInvestmentModal(false)} />
      <LentBorrowedManagementModal isOpen={showLentBorrowedModal} onClose={() => setShowLentBorrowedModal(false)} />
      <Emblem3DStudioModal isOpen={showEmblemStudioModal} onClose={() => setShowEmblemStudioModal(false)} />
      <GoalManagementModal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} />
      <PaymentAppManagementModal isOpen={showPaymentAppModal} onClose={() => setShowPaymentAppModal(false)} />
      <TemplateManagementModal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} />
      <BudgetManagementModal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} />
      <LoanManagementModal isOpen={showLoanModal} onClose={() => setShowLoanModal(false)} />
      <ActivityAuditLogModal isOpen={showActivityLogModal} onClose={() => setShowActivityLogModal(false)} />
      <TrashModal isOpen={showTrashModal} onClose={() => setShowTrashModal(false)} />
      <CashewImportModal isOpen={showCashewImportModal} onClose={() => setShowCashewImportModal(false)} />
      <AppImportExportModal
        isOpen={showAppImportExportModal}
        onClose={() => setShowAppImportExportModal(false)}
        initialTab={importExportInitialTab}
      />

      {/* Wipe / Danger Confirmation Modal */}
      {wipeModalType && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-2xl ${
                wipeModalType === 'ALL'
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400'
                  : wipeModalType === 'TRANSACTIONS_ONLY'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400'
              }`}>
                {wipeModalType === 'ALL' ? (
                  <Flame size={24} />
                ) : wipeModalType === 'TRANSACTIONS_ONLY' ? (
                  <AlertTriangle size={24} />
                ) : (
                  <RefreshCw size={24} />
                )}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {wipeModalType === 'ALL' && 'Wipe Entire Application Data?'}
                  {wipeModalType === 'TRANSACTIONS_ONLY' && 'Clear All Transactions?'}
                  {wipeModalType === 'DEMO_RESET' && 'Reset to Demo Data?'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Confirmation required</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {wipeModalType === 'ALL' && (
                <>
                  <p className="font-semibold text-rose-600 dark:text-rose-400 mb-1">⚠️ Irreversible Full Wipe</p>
                  This will permanently delete all your accounts, credit cards, transactions, custom categories, budgets, subscriptions, loans, and settings.
                </>
              )}
              {wipeModalType === 'TRANSACTIONS_ONLY' && (
                <>
                  <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">⚠️ Clear {transactions.filter(t => !t.isDeleted).length} Transactions</p>
                  This will clear all transaction history. Your Bank Accounts, Credit Cards, Categories, Budgets, and Custom Emblems will stay safe and untouched.
                </>
              )}
              {wipeModalType === 'DEMO_RESET' && (
                <>
                  <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">ℹ️ Demo Showcase Replacement</p>
                  This will replace current data with the complete rich sample demo dataset (sample accounts, transactions, investments, and subscriptions).
                </>
              )}
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setWipeModalType(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs sm:text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeWipeAction}
                className={`flex-1 py-3 font-bold rounded-2xl text-xs sm:text-sm text-white transition-all shadow-md ${
                  wipeModalType === 'ALL'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                    : wipeModalType === 'TRANSACTIONS_ONLY'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
                }`}
              >
                {wipeModalType === 'ALL' && 'Wipe Everything'}
                {wipeModalType === 'TRANSACTIONS_ONLY' && 'Clear Transactions'}
                {wipeModalType === 'DEMO_RESET' && 'Load Demo'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ErrorLogsModal isOpen={showErrorLogsModal} onClose={() => setShowErrorLogsModal(false)} />
    </div>
  );
});
