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
import { RotateCcw, X } from 'lucide-react';

function MainApp() {
  const { isLocked, undoToast, dismissUndoToast, settings } = useMoney();
  const [currentTab, setCurrentTab] = useState<'home' | 'insights' | 'accounts' | 'more' | 'transactions'>('home');
  const [filterAccountId, setFilterAccountId] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [initialAddType, setInitialAddType] = useState<TransactionType>('EXPENSE');
  const [initialAccountIdForAdd, setInitialAccountIdForAdd] = useState<string | undefined>(undefined);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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

  const handleOpenAdd = (type: TransactionType = 'EXPENSE', accountId?: string) => {
    setInitialAddType(type);
    setInitialAccountIdForAdd(accountId);
    setShowAddModal(true);
  };

  const handleNavigateToAccountTransactions = (accountId: string) => {
    setFilterAccountId(accountId);
    setCurrentTab('transactions');
  };

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <TopBar
        currentTab={currentTab}
        onOpenSearch={() => {
          setFilterAccountId('ALL');
          setCurrentTab('transactions');
        }}
        onOpenTrash={() => setShowTrashModal(true)}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-4">
        {currentTab === 'home' && (
          <HomeDashboard
            onOpenAdd={handleOpenAdd}
            onSelectTransaction={setSelectedTransaction}
            onViewAllTransactions={() => {
              setFilterAccountId('ALL');
              setCurrentTab('transactions');
            }}
            onNavigateToAccountTransactions={handleNavigateToAccountTransactions}
            onNavigateTab={tab => setCurrentTab(tab as any)}
          />
        )}

        {currentTab === 'insights' && (
          <HomeDashboard
            initialSubtab="insights"
            onOpenAdd={handleOpenAdd}
            onSelectTransaction={setSelectedTransaction}
            onViewAllTransactions={() => {
              setFilterAccountId('ALL');
              setCurrentTab('transactions');
            }}
            onNavigateToAccountTransactions={handleNavigateToAccountTransactions}
            onNavigateTab={tab => setCurrentTab(tab as any)}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsView
            key={filterAccountId}
            initialAccountId={filterAccountId}
            onSelectTransaction={setSelectedTransaction}
            onOpenAdd={() => handleOpenAdd()}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsView
            onSelectTransaction={setSelectedTransaction}
            onOpenAdd={handleOpenAdd}
            onNavigateToFullFeed={handleNavigateToAccountTransactions}
          />
        )}

        {currentTab === 'more' && <MoreView />}
      </main>

      <BottomNav
        currentTab={currentTab === 'insights' ? 'home' : currentTab}
        onTabChange={tab => {
          if (tab === 'transactions') {
            setFilterAccountId('ALL');
          }
          setCurrentTab(tab as any);
        }}
        onOpenAdd={() => handleOpenAdd()}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setInitialAccountIdForAdd(undefined);
        }}
        initialType={initialAddType}
        initialAccountId={initialAccountIdForAdd}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={!!editingTransaction}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onEdit={tx => {
          setSelectedTransaction(null);
          setEditingTransaction(tx);
        }}
      />

      {/* Trash / Recycle Bin Modal */}
      <TrashModal
        isOpen={showTrashModal}
        onClose={() => setShowTrashModal(false)}
      />

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
