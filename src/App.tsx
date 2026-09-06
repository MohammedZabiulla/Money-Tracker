import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider } from './context/AuthContext';
import { MoneyProvider, useMoney } from './context/MoneyContext';
import { TopBar } from './components/layout/TopBar';
import { BottomNav } from './components/layout/BottomNav';
import { LockScreen } from './components/layout/LockScreen';
import { HomeDashboard } from './components/dashboard/HomeDashboard';
import { AccountsView } from './components/accounts/AccountsView';
import { InsightsView } from './components/insights/InsightsView';
import { MoreView } from './components/more/MoreView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { AddTransactionModal } from './components/transactions/AddTransactionModal';
import { EditTransactionModal } from './components/transactions/EditTransactionModal';
import { TransactionDetailModal } from './components/transactions/TransactionDetailModal';
import { TrashModal } from './components/common/TrashModal';
import { ConfigureMiddleNavModal } from './components/common/ConfigureMiddleNavModal';
import { NotesManagementModal } from './components/more/NotesManagementModal';
import { BudgetManagementModal } from './components/more/BudgetManagementModal';
import { SubscriptionManagementModal } from './components/subscriptions/SubscriptionManagementModal';
import { LoanManagementModal } from './components/more/LoanManagementModal';
import { InvestmentManagementModal } from './components/investments/InvestmentManagementModal';
import { GoalManagementModal } from './components/goals/GoalManagementModal';
import { AppImportExportModal } from './components/more/AppImportExportModal';
import { Transaction, TransactionType } from './types';
import { RotateCcw, X, Plus, Search, FileText, PieChart, Repeat, Landmark, TrendingUp, Target, BookOpen, Download } from 'lucide-react';
import { motion } from 'motion/react';

function MainApp() {
  console.log("MainApp rendered!");
  const { isLocked, undoToast, dismissUndoToast, settings } = useMoney();
  const [currentTab, setCurrentTab] = useState<'home' | 'insights' | 'accounts' | 'more' | 'transactions'>('home');
  const [filterAccountId, setFilterAccountId] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showConfigureMiddleModal, setShowConfigureMiddleModal] = useState(false);
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);

  // Shortcut modals triggered via middle action
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showBudgetsModal, setShowBudgetsModal] = useState(false);
  const [showSubscriptionsModal, setShowSubscriptionsModal] = useState(false);
  const [showLoansModal, setShowLoansModal] = useState(false);
  const [showInvestmentsModal, setShowInvestmentsModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);

  const [initialAddType, setInitialAddType] = useState<TransactionType>('EXPENSE');
  const [initialAccountIdForAdd, setInitialAccountIdForAdd] = useState<string | undefined>(undefined);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [autoFocusSearch, setAutoFocusSearch] = useState(false);

  const floatingLongPressRef = useRef<any>(null);

  const handleFloatingTouchStart = () => {
    floatingLongPressRef.current = setTimeout(() => {
      setShowQuickAddMenu(true);
    }, 600);
  };

  const handleFloatingTouchEnd = () => {
    if (floatingLongPressRef.current) {
      clearTimeout(floatingLongPressRef.current);
      floatingLongPressRef.current = null;
    }
  };

  const handleTriggerMiddleAction = () => {
    const action = settings.middleNavAction || 'add_transaction';
    switch (action) {
      case 'quick_note':
        setShowNotesModal(true);
        break;
      case 'budgets':
        setShowBudgetsModal(true);
        break;
      case 'subscriptions':
        setShowSubscriptionsModal(true);
        break;
      case 'loans':
        setShowLoansModal(true);
        break;
      case 'investments':
        setShowInvestmentsModal(true);
        break;
      case 'goals':
        setShowGoalsModal(true);
        break;
      case 'guide':
        setCurrentTab('more');
        break;
      case 'import_export':
        setShowImportExportModal(true);
        break;
      case 'analytics':
        setCurrentTab('insights' as any);
        break;
      case 'add_transaction':
      default:
        handleOpenAdd('EXPENSE');
        break;
    }
  };

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentTab]);

  const handleOpenAdd = React.useCallback((type: any = 'EXPENSE', accountId?: any) => {
    const validTypes = new Set([
      'EXPENSE', 'INCOME', 'TRANSFER', 'CARD_PAYMENT',
      'INVESTMENT_CONTRIBUTION', 'INVESTMENT_WITHDRAWAL',
      'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT',
      'MONEY_LENT', 'MONEY_BORROWED', 'MONEY_LENT_REPAYMENT', 'MONEY_BORROWED_REPAYMENT',
      'REFUND', 'ADJUSTMENT'
    ]);
    const safeType: TransactionType = typeof type === 'string' && validTypes.has(type)
      ? (type as TransactionType)
      : 'EXPENSE';
    const safeAccountId = typeof accountId === 'string' ? accountId : undefined;
    setInitialAddType(safeType);
    setInitialAccountIdForAdd(safeAccountId);
    setShowAddModal(true);
  }, []);

  const handleNavigateToAccountTransactions = React.useCallback((accountId: string) => {
    setFilterAccountId(accountId);
    setCurrentTab('transactions');
  }, []);

  const handleOpenSearch = React.useCallback(() => {
    setFilterAccountId('ALL');
    setAutoFocusSearch(true);
    setCurrentTab('transactions');
  }, []);

  const handleViewAllTransactions = React.useCallback(() => {
    setFilterAccountId('ALL');
    setCurrentTab('transactions');
  }, []);

  const handleNavigateTab = React.useCallback((tab: any) => setCurrentTab(tab), []);

  const handleResetSearchFocus = React.useCallback(() => setAutoFocusSearch(false), []);

  // Apply dark mode class if user preference
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors relative">
      {isLocked && <LockScreen />}
      <TopBar
        currentTab={currentTab}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-4 pb-36 sm:pb-44">
        {currentTab === 'home' && (
          <HomeDashboard
            onOpenAdd={handleOpenAdd}
            onSelectTransaction={setSelectedTransaction}
            onViewAllTransactions={handleViewAllTransactions}
            onNavigateToAccountTransactions={handleNavigateToAccountTransactions}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {currentTab === 'insights' && (
          <HomeDashboard
            initialSubtab="insights"
            onOpenAdd={handleOpenAdd}
            onSelectTransaction={setSelectedTransaction}
            onViewAllTransactions={handleViewAllTransactions}
            onNavigateToAccountTransactions={handleNavigateToAccountTransactions}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsView
            key={filterAccountId}
            initialAccountId={filterAccountId}
            onSelectTransaction={setSelectedTransaction}
            onOpenAdd={handleOpenAdd}
            onEditTransaction={setEditingTransaction}
            autoFocusSearch={autoFocusSearch}
            onResetSearchFocus={handleResetSearchFocus}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsView
            onSelectTransaction={setSelectedTransaction}
            onOpenAdd={handleOpenAdd}
            onNavigateToFullFeed={handleNavigateToAccountTransactions}
            onEditTransaction={setEditingTransaction}
          />
        )}

        {currentTab === 'more' && <MoreView />}
      </main>

      {/* Floating Action Buttons: Search (Top) and Add Transaction (Bottom) */}
      <div className="fixed bottom-22 sm:bottom-24 right-4 sm:right-6 z-40 flex flex-col items-center gap-3">
        {/* Search Floating Button (On Top) - 3D Tactile Orb */}
        <motion.button
          whileHover={{ scale: 1.1, translateY: -2 }}
          whileTap={{ scale: 0.92, translateY: 1 }}
          onClick={handleOpenSearch}
          className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center group cursor-pointer select-none border border-black/10 dark:border-white/15"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 55%, #cbd5e1 100%)',
            boxShadow:
              '0 6px 16px -2px rgba(15, 23, 42, 0.2), 0 2px 5px -1px rgba(15, 23, 42, 0.1), inset 0 2px 2px 0 rgba(255, 255, 255, 0.9), inset 0 -2px 3px 0 rgba(0, 0, 0, 0.25)',
          }}
          title="Search Transactions & Filters"
          aria-label="Search Transactions"
        >
          {/* 3D Specular Arc */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.1) 40%, transparent 65%)',
            }}
          />
          {/* Subtle Inner Highlight */}
          <div
            className="absolute top-1 left-2 w-3 h-2 rounded-full opacity-70 pointer-events-none blur-[0.5px]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, transparent 70%)',
            }}
          />
          {/* Embossed Search Icon */}
          <div
            className="relative z-10 flex items-center justify-center text-slate-700 dark:text-slate-800 group-hover:text-emerald-600 transition-colors"
            style={{
              filter: 'drop-shadow(0 1.5px 2px rgba(0, 0, 0, 0.2))',
            }}
          >
            <Search size={20} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          </div>
        </motion.button>

        {/* Add (+) Floating Button (Bottom Right) - 3D Glossy Emerald Sphere */}
        <motion.button
          whileHover={{ scale: 1.1, translateY: -2 }}
          whileTap={{ scale: 0.92, translateY: 1 }}
          onClick={() => handleOpenAdd()}
          onMouseDown={handleFloatingTouchStart}
          onMouseUp={handleFloatingTouchEnd}
          onTouchStart={handleFloatingTouchStart}
          onTouchEnd={handleFloatingTouchEnd}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowQuickAddMenu(true);
          }}
          className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center group cursor-pointer select-none border border-emerald-400/30"
          style={{
            background: 'linear-gradient(135deg, #34d399 0%, #10b981 40%, #059669 80%, #047857 100%)',
            boxShadow:
              '0 8px 24px -2px rgba(16, 185, 129, 0.6), 0 3px 8px -1px rgba(16, 185, 129, 0.35), inset 0 2.5px 3px 0 rgba(255, 255, 255, 0.8), inset 0 -3px 5px 0 rgba(0, 0, 0, 0.4)',
          }}
          title="Add New Transaction (Long-press or Right-click for Quick Options)"
          aria-label="Add New Transaction"
        >
          {/* 3D Gloss Sheen Arc */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.15) 45%, transparent 70%)',
            }}
          />
          {/* 3D Top-Left Spherical Glow Bubble */}
          <div
            className="absolute top-1.5 left-2 w-4 h-2.5 rounded-full opacity-80 pointer-events-none blur-[0.5px]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, transparent 75%)',
            }}
          />
          {/* Embossed Plus with 3D Depth */}
          <div
            className="relative z-10 flex items-center justify-center text-white"
            style={{
              filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.45))',
            }}
          >
            <Plus size={28} strokeWidth={2.8} className="group-hover:rotate-90 transition-transform duration-200" />
          </div>
        </motion.button>
      </div>

      <BottomNav
        currentTab={currentTab === 'insights' ? 'home' : currentTab}
        onTabChange={tab => {
          if (tab === 'transactions') {
            setFilterAccountId('ALL');
          } else {
            setAutoFocusSearch(false);
          }
          setCurrentTab(tab as any);
        }}
        onTriggerMiddleAction={handleTriggerMiddleAction}
        onConfigureMiddleAction={() => setShowConfigureMiddleModal(true)}
      />

      {/* Quick Add Menu (Long press on floating +) */}
      {showQuickAddMenu && (
        <div className="fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Quick Actions</h3>
              <button onClick={() => setShowQuickAddMenu(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => { setShowQuickAddMenu(false); handleOpenAdd('EXPENSE'); }}
                className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-left hover:scale-102 transition-all cursor-pointer"
              >
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">💸 Expense</span>
                <span className="text-[10px] text-slate-500">Record spend</span>
              </button>
              <button
                onClick={() => { setShowQuickAddMenu(false); handleOpenAdd('INCOME'); }}
                className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-left hover:scale-102 transition-all cursor-pointer"
              >
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block">💰 Income</span>
                <span className="text-[10px] text-slate-500">Add revenue</span>
              </button>
              <button
                onClick={() => { setShowQuickAddMenu(false); handleOpenAdd('TRANSFER'); }}
                className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-left hover:scale-102 transition-all cursor-pointer"
              >
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 block">🔄 Transfer</span>
                <span className="text-[10px] text-slate-500">Between accounts</span>
              </button>
              <button
                onClick={() => { setShowQuickAddMenu(false); handleOpenAdd('CARD_PAYMENT'); }}
                className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-left hover:scale-102 transition-all cursor-pointer"
              >
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 block">💳 Card Bill</span>
                <span className="text-[10px] text-slate-500">Pay credit bill</span>
              </button>
              <button
                onClick={() => { setShowQuickAddMenu(false); handleOpenAdd('INVESTMENT_CONTRIBUTION'); }}
                className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900 text-left hover:scale-102 transition-all cursor-pointer"
              >
                <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 block">📈 Invest</span>
                <span className="text-[10px] text-slate-500">Asset deposit</span>
              </button>
              <button
                onClick={() => { setShowQuickAddMenu(false); handleOpenAdd('MONEY_LENT'); }}
                className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-left hover:scale-102 transition-all cursor-pointer"
              >
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block">🤝 Lend / Borrow</span>
                <span className="text-[10px] text-slate-500">Debt tracking</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Middle Nav Modal */}
      {showConfigureMiddleModal && (
        <ConfigureMiddleNavModal isOpen={showConfigureMiddleModal} onClose={() => setShowConfigureMiddleModal(false)} />
      )}

      {/* Shortcut Modals */}
      {showNotesModal && <NotesManagementModal isOpen={showNotesModal} onClose={() => setShowNotesModal(false)} />}
      {showBudgetsModal && <BudgetManagementModal isOpen={showBudgetsModal} onClose={() => setShowBudgetsModal(false)} />}
      {showSubscriptionsModal && <SubscriptionManagementModal isOpen={showSubscriptionsModal} onClose={() => setShowSubscriptionsModal(false)} />}
      {showLoansModal && <LoanManagementModal isOpen={showLoansModal} onClose={() => setShowLoansModal(false)} />}
      {showInvestmentsModal && <InvestmentManagementModal isOpen={showInvestmentsModal} onClose={() => setShowInvestmentsModal(false)} />}
      {showGoalsModal && <GoalManagementModal isOpen={showGoalsModal} onClose={() => setShowGoalsModal(false)} />}
      {showImportExportModal && <AppImportExportModal isOpen={showImportExportModal} onClose={() => setShowImportExportModal(false)} />}

      {/* Add Transaction Modal */}
      {showAddModal && (
        <AddTransactionModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setInitialAccountIdForAdd(undefined);
          }}
          initialType={initialAddType}
          initialAccountId={initialAccountIdForAdd}
        />
      )}

      {/* Edit Transaction Modal */}
      {!!editingTransaction && (
        <EditTransactionModal
          isOpen={!!editingTransaction}
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}

      {/* Transaction Detail Modal */}
      {!!selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onEdit={tx => {
            setSelectedTransaction(null);
            setEditingTransaction(tx);
          }}
        />
      )}

      {/* Trash / Recycle Bin Modal */}
      {showTrashModal && (
        <TrashModal
          isOpen={showTrashModal}
          onClose={() => setShowTrashModal(false)}
        />
      )}

      {/* Undo Toast Banner */}
      {undoToast && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-5">
          <span className="text-xs font-medium">{undoToast.message}</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                undoToast.onUndo();
                dismissUndoToast();
              }}
              className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center space-x-1"
            >
              <RotateCcw size={12} />
              <span>Undo</span>
            </button>
            <button onClick={dismissUndoToast} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MoneyProvider>
        <MainApp />
      </MoneyProvider>
    </AuthProvider>
  );
}
