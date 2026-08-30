import React, { useState } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { formatINR } from '../../lib/currency';
import { IconHelper, Category3DIcon, PaymentApp3DIcon, Bank3DIcon } from './IconHelper';
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
  Paperclip,
  Landmark,
  TrendingUp,
  HandCoins,
} from 'lucide-react';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TrashTab = 'ALL' | 'TRANSACTIONS' | 'ACCOUNTS' | 'CARDS' | 'BUDGETS' | 'SUBSCRIPTIONS' | 'RECURRING' | 'GOALS' | 'LOANS' | 'INVESTMENTS' | 'DEBTS';

export const TrashModal: React.FC<TrashModalProps> = ({ isOpen, onClose }) => {
  const {
    deletedTransactions,
    deletedAccounts,
    deletedCreditCards,
    deletedBudgets,
    deletedSubscriptions,
    deletedRecurring,
    deletedGoals,
    deletedLoans,
    deletedInvestments,
    deletedDebts,
    categories,
    accounts,
    creditCards,
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
    restoreRecurring,
    permanentlyDeleteRecurring,
    restoreGoal,
    permanentlyDeleteGoal,
    restoreLoan,
    permanentlyDeleteLoan,
    restoreInvestment,
    permanentlyDeleteInvestment,
    restoreDebt,
    permanentlyDeleteDebt,
    emptyAllTrash,
    restoreAllTrash,
  } = useMoney();

  const [activeTab, setActiveTab] = useState<TrashTab>('ALL');
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
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
          <button
            onClick={() => setActiveTab('RECURRING')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'RECURRING'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Recurring ({deletedRecurring.length})
          </button>
          <button
            onClick={() => setActiveTab('GOALS')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'GOALS'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Goals ({deletedGoals.length})
          </button>
          <button
            onClick={() => setActiveTab('LOANS')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'LOANS'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Loans ({deletedLoans.length})
          </button>
          <button
            onClick={() => setActiveTab('INVESTMENTS')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'INVESTMENTS'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Investments ({deletedInvestments.length})
          </button>
          <button
            onClick={() => setActiveTab('DEBTS')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'DEBTS'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Lent/Borrowed ({deletedDebts.length})
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
                    {deletedTransactions.map((tx, idx) => {
                      const isIncome = tx.type === 'INCOME' || tx.type === 'MONEY_LENT_REPAYMENT' || tx.type === 'INVESTMENT_WITHDRAWAL';
                      const isTransfer = tx.type === 'TRANSFER' || tx.type === 'CARD_PAYMENT' || tx.type === 'INVESTMENT_CONTRIBUTION';
                      const cat = categories?.find(c => c.id === tx.categoryId);
                      const acc = accounts?.find(a => a.id === tx.accountId);
                      const card = creditCards?.find(c => c.id === tx.creditCardId);
                      
                      return (
                      <div
                        key={`del_tx_${tx.id}_${idx}`}
                        className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="relative shrink-0">
                            <Category3DIcon
                              name={cat?.icon || (isIncome ? 'ArrowDownLeft' : isTransfer ? 'ArrowRightLeft' : 'Receipt')}
                              categoryName={tx.categoryName || cat?.name}
                              color={cat?.color || (isIncome ? '#10b981' : '#64748b')}
                              size="md"
                              glow={false}
                              interactive={false}
                            />
                          </div>
                          
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate opacity-75">
                                {tx.merchantName || tx.categoryName || tx.notes || 'Transaction'}
                              </p>
                              {tx.receiptUrl && (
                                <Paperclip size={12} className="text-slate-400 shrink-0" title="Has receipt photo" />
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              {/* Type Badge */}
                              <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                                isIncome ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                                isTransfer ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' :
                                tx.type === 'CARD_PAYMENT' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' :
                                'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                              }`}>
                                {tx.type === 'CARD_PAYMENT' ? 'Card Bill' : tx.type === 'MONEY_BORROWED' ? 'Borrowed' : tx.type === 'MONEY_LENT' ? 'Lent' : isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}
                              </span>

                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {tx.splits && tx.splits.length > 0 ? `Split (${tx.splits.length} items)` : (tx.categoryName || tx.type)}
                              </span>

                              {tx.paymentAppName && (
                                <div className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-lg bg-slate-200/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-700/50 text-[10px] font-semibold text-slate-700 dark:text-slate-200 opacity-80">
                                  <PaymentApp3DIcon name={tx.paymentAppName} size="xs" glow={false} />
                                  <span>{tx.paymentAppName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0 ml-3">
                          <div className="text-right mr-2">
                            <p className={`text-sm font-extrabold ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isTransfer
                                ? 'text-slate-600 dark:text-slate-300'
                                : 'text-slate-900 dark:text-white'
                            } opacity-75`}>
                              {isIncome ? '+' : isTransfer ? '' : '-'}{formatINR(tx.amount)}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {tx.date}
                            </p>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => restoreTransaction(tx.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold flex items-center space-x-1"
                              title="Restore Transaction"
                            >
                              <RotateCcw size={12} />
                              <span className="hidden sm:inline">Restore</span>
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
                      </div>
                    )})}
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
                    {deletedAccounts.map((acc, idx) => (
                      <div
                        key={`del_acc_${acc.id}_${idx}`}
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
                    {deletedCreditCards.map((cc, idx) => (
                      <div
                        key={`del_cc_${cc.id}_${idx}`}
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
                    {deletedBudgets.map((b, idx) => (
                      <div
                        key={`del_b_${b.id}_${idx}`}
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
                    {deletedSubscriptions.map((s, idx) => (
                      <div
                        key={`del_sub_${s.id}_${idx}`}
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

              {/* Recurring in Trash */}
              {(activeTab === 'ALL' || activeTab === 'RECURRING') && deletedRecurring.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Deleted Recurring Payments ({deletedRecurring.length})
                  </span>
                  <div className="space-y-2">
                    {deletedRecurring.map((r, idx) => (
                      <div
                        key={`del_rec_${r.id}_${idx}`}
                        className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                            <Calendar size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {r.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {formatINR(r.amount)} • {r.frequency} • Next: {r.nextDueDate}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0 ml-3">
                          <button
                            onClick={() => restoreRecurring(r.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold flex items-center space-x-1"
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => permanentlyDeleteRecurring(r.id)}
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

              {/* Goals in Trash */}
              {(activeTab === 'ALL' || activeTab === 'GOALS') && deletedGoals.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Deleted Financial Goals ({deletedGoals.length})
                  </span>
                  <div className="space-y-2">
                    {deletedGoals.map((g, idx) => (
                      <div
                        key={`del_goal_${g.id}_${idx}`}
                        className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                            <Sparkles size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {g.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Target: {formatINR(g.targetAmount)} • Saved: {formatINR(g.currentAmount)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0 ml-3">
                          <button
                            onClick={() => restoreGoal(g.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold flex items-center space-x-1"
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => permanentlyDeleteGoal(g.id)}
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

              {/* Loans in Trash */}
              {(activeTab === 'ALL' || activeTab === 'LOANS') && deletedLoans.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Deleted Loans ({deletedLoans.length})
                  </span>
                  <div className="space-y-2">
                    {deletedLoans.map((l, idx) => (
                      <div
                        key={`del_loan_${l.id}_${idx}`}
                        className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Landmark size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {l.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Outstanding: {formatINR(l.outstandingPrincipal)} • EMI: {formatINR(l.emiAmount)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0 ml-3">
                          <button
                            onClick={() => restoreLoan(l.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold flex items-center space-x-1"
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => permanentlyDeleteLoan(l.id)}
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

              {/* Investments in Trash */}
              {(activeTab === 'ALL' || activeTab === 'INVESTMENTS') && deletedInvestments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Deleted Investments ({deletedInvestments.length})
                  </span>
                  <div className="space-y-2">
                    {deletedInvestments.map((inv, idx) => (
                      <div
                        key={`del_inv_${inv.id}_${idx}`}
                        className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <TrendingUp size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {inv.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Value: {formatINR(inv.currentValue)} • Category: {inv.category}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0 ml-3">
                          <button
                            onClick={() => restoreInvestment(inv.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold flex items-center space-x-1"
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => permanentlyDeleteInvestment(inv.id)}
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

              {/* Debts in Trash */}
              {(activeTab === 'ALL' || activeTab === 'DEBTS') && deletedDebts.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Deleted Lent / Borrowed Records ({deletedDebts.length})
                  </span>
                  <div className="space-y-2">
                    {deletedDebts.map((d, idx) => (
                      <div
                        key={`del_debt_${d.id}_${idx}`}
                        className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                            <HandCoins size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {d.personName} ({d.type})
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Amount: {formatINR(d.remainingAmount)} / {formatINR(d.amount)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0 ml-3">
                          <button
                            onClick={() => restoreDebt(d.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold flex items-center space-x-1"
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => permanentlyDeleteDebt(d.id)}
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
