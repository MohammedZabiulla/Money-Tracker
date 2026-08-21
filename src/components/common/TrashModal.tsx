import React, { useState } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { formatINR } from '../../lib/currency';
import { IconHelper } from './IconHelper';
import {
  X,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Building,
  CreditCard,
  PieChart,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowRightLeft,
  Receipt,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TrashTab = 'ALL' | 'TRANSACTIONS' | 'ACCOUNTS' | 'CARDS' | 'BUDGETS' | 'SUBSCRIPTIONS';

export const TrashModal: React.FC<TrashModalProps> = ({ isOpen, onClose }) => {
  const {
    deletedTransactions,
    deletedAccounts,
    deletedCreditCards,
    deletedBudgets,
    deletedSubscriptions,
    trashCount,
    restoreTransaction,
    permanentlyDeleteTransaction,
    restoreAccount,
    permanentlyDeleteAccount,
    restoreCreditCard,
    permanentlyDeleteCreditCard,
    restoreBudget,
    permanentlyDeleteBudget,
    restoreSubscription,
    permanentlyDeleteSubscription,
    emptyAllTrash,
    restoreAllTrash,
  } = useMoney();

  const [activeTab, setActiveTab] = useState<TrashTab>('ALL');
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <Trash2 size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Trash & Recycle Bin
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                  {trashCount} {trashCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Restore accidentally deleted records or permanently erase them
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Top Bar */}
        {trashCount > 0 && (
          <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
            <div className="flex space-x-2">
              <button
                onClick={() => restoreAllTrash()}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-750 hover:bg-slate-50 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <RotateCcw size={13} />
                <span>Restore All</span>
              </button>
            </div>

            {confirmEmpty ? (
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] text-rose-600 font-semibold">Erase all forever?</span>
                <button
                  onClick={() => {
                    emptyAllTrash();
                    setConfirmEmpty(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px]"
                >
                  Yes, Empty
                </button>
                <button
                  onClick={() => setConfirmEmpty(false)}
                  className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-[11px]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmEmpty(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-300 font-semibold flex items-center space-x-1 border border-rose-200 dark:border-rose-900/50"
              >
                <Trash2 size={13} />
                <span>Empty Trash</span>
              </button>
            )}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex space-x-1.5 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Items ({trashCount})
          </button>
          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Transactions ({deletedTransactions.length})
          </button>
          <button
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'ACCOUNTS'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Banks & Wallets ({deletedAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('CARDS')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'CARDS'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Credit Cards ({deletedCreditCards.length})
          </button>
          <button
            onClick={() => setActiveTab('BUDGETS')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'BUDGETS'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Budgets ({deletedBudgets.length})
          </button>
          <button
            onClick={() => setActiveTab('SUBSCRIPTIONS')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'SUBSCRIPTIONS'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Subscriptions ({deletedSubscriptions.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {trashCount === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Recycle Bin is Empty
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Any deleted transactions, accounts, credit cards, or budgets will safely appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Transactions in Trash */}
              {(activeTab === 'ALL' || activeTab === 'TRANSACTIONS') && deletedTransactions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Deleted Transactions ({deletedTransactions.length})
                  </span>
                  <div className="space-y-2">
                    {deletedTransactions.map(tx => (
                      <div
                        key={tx.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                            <Receipt size={18} className="text-slate-600 dark:text-slate-300" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {tx.merchantName || tx.categoryName || 'Transaction'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {formatINR(tx.amount)} • {tx.date} {tx.accountName ? `• ${tx.accountName}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0 ml-3">
                          <button
                            onClick={() => restoreTransaction(tx.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold flex items-center space-x-1"
                            title="Restore Transaction"
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => permanentlyDeleteTransaction(tx.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete Permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accounts in Trash */}
              {(activeTab === 'ALL' || activeTab === 'ACCOUNTS') && deletedAccounts.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Deleted Bank Accounts & Wallets ({deletedAccounts.length})
                  </span>
                  <div className="space-y-2">
                    {deletedAccounts.map(acc => (
                      <div
                        key={acc.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Building size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {acc.name} ({acc.institution})
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Type: {acc.type} • Opening: {formatINR(acc.openingBalance)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0 ml-3">
                          <button
                            onClick={() => restoreAccount(acc.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold flex items-center space-x-1"
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => permanentlyDeleteAccount(acc.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Credit Cards in Trash */}
              {(activeTab === 'ALL' || activeTab === 'CARDS') && deletedCreditCards.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Deleted Credit Cards ({deletedCreditCards.length})
                  </span>
                  <div className="space-y-2">
                    {deletedCreditCards.map(cc => (
                      <div
                        key={cc.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <CreditCard size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {cc.name} ({cc.issuer})
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Limit: {formatINR(cc.creditLimit)} • Bill Day: {cc.statementDate}th
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0 ml-3">
                          <button
                            onClick={() => restoreCreditCard(cc.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold flex items-center space-x-1"
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => permanentlyDeleteCreditCard(cc.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Budgets in Trash */}
              {(activeTab === 'ALL' || activeTab === 'BUDGETS') && deletedBudgets.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Deleted Budgets ({deletedBudgets.length})
                  </span>
                  <div className="space-y-2">
                    {deletedBudgets.map(b => (
                      <div
                        key={b.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <PieChart size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {b.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Limit: {formatINR(b.amount)} • {b.month}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0 ml-3">
                          <button
                            onClick={() => restoreBudget(b.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold flex items-center space-x-1"
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => permanentlyDeleteBudget(b.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subscriptions in Trash */}
              {(activeTab === 'ALL' || activeTab === 'SUBSCRIPTIONS') && deletedSubscriptions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Deleted Subscriptions ({deletedSubscriptions.length})
                  </span>
                  <div className="space-y-2">
                    {deletedSubscriptions.map(s => (
                      <div
                        key={s.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <Calendar size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {s.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {formatINR(s.amount)} / {s.frequency.toLowerCase()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0 ml-3">
                          <button
                            onClick={() => restoreSubscription(s.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold flex items-center space-x-1"
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => permanentlyDeleteSubscription(s.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
