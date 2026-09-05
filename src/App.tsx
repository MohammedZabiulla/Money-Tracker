import React, { useState, useEffect } from 'react';
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
import { Transaction, TransactionType } from './types';
import { RotateCcw, X, Plus, Search } from 'lucide-react';
import { motion } from 'motion/react';

function MainApp() {
  console.log("MainApp rendered!");
  const { isLocked, undoToast, dismissUndoToast, settings } = useMoney();
  const [currentTab, setCurrentTab] = useState<'home' | 'insights' | 'accounts' | 'more' | 'transactions'>('home');
  const [filterAccountId, setFilterAccountId] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [initialAddType, setInitialAddType] = useState<TransactionType>('EXPENSE');
  const [initialAccountIdForAdd, setInitialAccountIdForAdd] = useState<string | undefined>(undefined);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [autoFocusSearch, setAutoFocusSearch] = useState(false);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentTab]);

  // Apply dark mode class if user preference
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  if (isLocked) {
    return <LockScreen />;
  }

  
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


  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
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
      <div className="fixed bottom-22 sm:bottom-24 right-4 sm:right-6 z-40 flex flex-col items-center gap-2.5 sm:gap-3">
        {/* Search Floating Button (On Top) */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleOpenSearch}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 dark:bg-slate-850/95 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/90 dark:border-slate-700/90 shadow-lg shadow-slate-900/10 hover:shadow-xl transition-all flex items-center justify-center group backdrop-blur-md cursor-pointer"
          title="Search Transactions & Filters"
          aria-label="Search Transactions"
        >
          <Search size={19} className="group-hover:scale-110 transition-transform text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
        </motion.button>

        {/* Add (+) Floating Button (Bottom Right) */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => handleOpenAdd()}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-xl shadow-emerald-600/35 hover:shadow-emerald-600/50 transition-all flex items-center justify-center group cursor-pointer"
          title="Add New Transaction"
          aria-label="Add New Transaction"
        >
          <Plus size={28} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-200" />
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
      />

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
