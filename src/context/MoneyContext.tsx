import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Account,
  CreditCard,
  Category,
  Merchant,
  PaymentApp,
  Transaction,
  TransactionTemplate,
  RecurringTransaction,
  Subscription,
  Budget,
  Loan,
  Investment,
  DebtRecord,
  AccountReconciliation,
  AppSettings,
  AccountSortOption,
  CardSortOption,
  TransactionType,
  Goal,
  GoalAllocation,
  ConvertAccountToCardOptions,
  ConvertCardToAccountOptions,
  ActivityLog,
  ActivityDomain,
  ActivityActionType,
  ActivityChangeDetail,
} from '../types';
import {
  loadInitialState,
  saveFullState,
  LocalStorageState,
  exportActivityLogsCsv,
  exportActivityLogsJson,
} from '../lib/storage';
import {
  recalculateAllBalances,
  computeFinancialSummary,
  getCategorySpendingBreakdown,
  CategorySpending,
  FinancialSummary,
} from '../lib/accountingEngine';
import { processAllDueRecurring, ProcessRecurringResult, calculateNextDueDate } from '../lib/recurringEngine';
import { getDemoData } from '../lib/demoData';
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_APPS, DEFAULT_APP_SETTINGS, CARD_THEMES } from '../lib/constants';
import { createActivityEntry, computeFieldDiffs, computeTransactionDiffs } from '../lib/activityLogger';
import { formatINR } from '../lib/currency';

interface MoneyContextType {
  // State
  accounts: Account[];
  creditCards: CreditCard[];
  categories: Category[];
  merchants: Merchant[];
  paymentApps: PaymentApp[];
  transactions: Transaction[];
  templates: TransactionTemplate[];
  recurring: RecurringTransaction[];
  subscriptions: Subscription[];
  budgets: Budget[];
  goals: Goal[];
  loans: Loan[];
  investments: Investment[];
  debts: DebtRecord[];
  reconciliations: AccountReconciliation[];
  settings: AppSettings;
  activityLogs: ActivityLog[];
  
  // Computed
  summary: FinancialSummary;
  categorySpending: CategorySpending[];
  activeMonth: string; // "YYYY-MM"
  setActiveMonth: (month: string) => void;
  trashCount: number;
  deletedTransactions: Transaction[];
  deletedAccounts: Account[];
  deletedCreditCards: CreditCard[];
  deletedBudgets: Budget[];
  deletedSubscriptions: Subscription[];
  deletedRecurring: RecurringTransaction[];
  deletedGoals: Goal[];
  deletedLoans: Loan[];
  deletedInvestments: Investment[];
  deletedDebts: DebtRecord[];
  
  // UI & Security State
  isLocked: boolean;
  unlockApp: () => void;
  lockApp: () => void;
  undoToast: { message: string; onUndo: () => void } | null;
  dismissUndoToast: () => void;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'timestamp'>) => string;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string, softDelete?: boolean) => void;
  deleteTransactions: (ids: string[], softDelete?: boolean) => void;
  restoreTransaction: (id: string) => void;
  restoreTransactions: (ids: string[]) => void;
  permanentlyDeleteTransaction: (id: string) => void;
  emptyTrash: () => void;
  emptyAllTrash: () => void;
  restoreAllTrash: () => void;

  // Transaction Templates Actions
  addTemplate: (template: Omit<TransactionTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => string;
  updateTemplate: (id: string, updates: Partial<TransactionTemplate>) => void;
  deleteTemplate: (id: string) => void;
  toggleFavoriteTemplate: (id: string) => void;
  recordFromTemplate: (templateId: string, customAmount?: number, customDate?: string) => string;
  saveTransactionAsTemplate: (tx: Partial<Transaction>, templateName?: string) => string;
  
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'calculatedBalance'>) => string;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string, softDelete?: boolean) => void;
  restoreAccount: (id: string) => void;
  permanentlyDeleteAccount: (id: string) => void;
  reorderAccounts: (orderedIds: string[]) => void;
  setAccountSortPreference: (sort: AccountSortOption) => void;

  addCreditCard: (card: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt' | 'currentOutstanding'>) => string;
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string, softDelete?: boolean) => void;
  restoreCreditCard: (id: string) => void;
  permanentlyDeleteCreditCard: (id: string) => void;
  reorderCreditCards: (orderedIds: string[]) => void;
  setCardSortPreference: (sort: CardSortOption) => void;
  payCreditCardBill: (cardId: string, fromAccountId: string, amount: number, paymentAppId?: string) => void;
  convertAccountToCreditCard: (options: ConvertAccountToCardOptions) => string;
  convertCreditCardToAccount: (options: ConvertCardToAccountOptions) => string;

  addBudget: (budget: Omit<Budget, 'id'>) => string;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string, softDelete?: boolean) => void;
  restoreBudget: (id: string) => void;
  permanentlyDeleteBudget: (id: string) => void;
  reorderBudgets: (orderedIds: string[]) => void;

  addSubscription: (sub: Omit<Subscription, 'id'>) => string;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string, softDelete?: boolean) => void;
  restoreSubscription: (id: string) => void;
  permanentlyDeleteSubscription: (id: string) => void;

  // Recurring Transactions Actions
  addRecurring: (rec: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateRecurring: (id: string, updates: Partial<RecurringTransaction>) => void;
  deleteRecurring: (id: string, softDelete?: boolean) => void;
  restoreRecurring: (id: string) => void;
  permanentlyDeleteRecurring: (id: string) => void;
  toggleRecurringActive: (id: string) => void;
  processDuePayments: (customDate?: string) => ProcessRecurringResult;
  triggerManualRecurringExecution: (recurringId: string) => string;

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'allocations'>) => string;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string, softDelete?: boolean) => void;
  restoreGoal: (id: string) => void;
  permanentlyDeleteGoal: (id: string) => void;
  reorderGoals: (orderedIds: string[]) => void;
  allocateToGoal: (goalId: string, amount: number, type: 'DEPOSIT' | 'WITHDRAW', accountId?: string, notes?: string) => void;

  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'outstandingPrincipal'>) => string;
  updateLoan: (id: string, updates: Partial<Loan>) => void;
  deleteLoan: (id: string, softDelete?: boolean) => void;
  restoreLoan: (id: string) => void;
  permanentlyDeleteLoan: (id: string) => void;
  payLoanEMI: (loanId: string, fromAccountId: string, totalAmount: number, principalPortion: number, interestPortion: number) => void;

  addInvestment: (inv: Omit<Investment, 'id' | 'updatedAt'>) => string;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;
  deleteInvestment: (id: string, softDelete?: boolean) => void;
  restoreInvestment: (id: string) => void;
  permanentlyDeleteInvestment: (id: string) => void;
  reorderInvestments: (orderedIds: string[]) => void;

  addDebt: (debt: Omit<DebtRecord, 'id' | 'createdAt' | 'isSettled' | 'remainingAmount'>) => string;
  settleDebt: (debtId: string, settleAccountId?: string, paymentAppId?: string) => void;
  deleteDebt: (id: string, softDelete?: boolean) => void;
  restoreDebt: (id: string) => void;
  permanentlyDeleteDebt: (id: string) => void;

  reconcileAccount: (accountId: string, statementBalance: number, notes?: string, autoAdjust?: boolean) => void;

  addCategory: (cat: Omit<Category, 'id'>) => string;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (orderedIds: string[]) => void;

  addPaymentApp: (app: Omit<PaymentApp, 'id'>) => string;
  updatePaymentApp: (id: string, updates: Partial<PaymentApp>) => void;
  deletePaymentApp: (id: string) => void;
  reorderPaymentApps: (orderedIds: string[]) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Activity / Audit Logs Actions
  logActivity: (
    domain: ActivityDomain,
    action: ActivityActionType,
    summary: string,
    options?: {
      entityId?: string;
      entityName?: string;
      details?: ActivityChangeDetail[];
      metadata?: Record<string, any>;
    }
  ) => void;
  clearActivityLogs: () => void;
  exportActivityLogs: (format: 'csv' | 'json') => void;

  resetToDemoData: () => void;
  clearAllData: () => void;
  clearTransactionsData: () => void;
  loadBackupState: (state: LocalStorageState) => void;
}

const MoneyContext = createContext<MoneyContextType | undefined>(undefined);

function appendActivityLog(
  prevLogs: ActivityLog[] = [],
  domain: ActivityDomain,
  action: ActivityActionType,
  summary: string,
  options?: {
    entityId?: string;
    entityName?: string;
    details?: ActivityChangeDetail[];
    metadata?: Record<string, any>;
  }
): ActivityLog[] {
  const newEntry = createActivityEntry(domain, action, summary, options);
  return [newEntry, ...(prevLogs || [])].slice(0, 2000);
}

export const MoneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LocalStorageState>(() => loadInitialState());
  const [activeMonth, setActiveMonth] = useState<string>(() => new Date().toISOString().substring(0, 7));
  const [isLocked, setIsLocked] = useState<boolean>(() => !!loadInitialState().settings.isPinEnabled);
  const [undoToast, setUndoToast] = useState<{ message: string; onUndo: () => void } | null>(null);

  // One-time migration to fix imported transfers that were missing account linking
  useEffect(() => {
    let needsMigration = false;
    const migratedTransactions = state.transactions.map(t => {
      if ((t.type === 'TRANSFER' || t.type === 'CARD_PAYMENT') && t.notes) {
        if (t.notes.includes('Transferred Balance') && (t.notes.includes('→') || t.notes.includes('->'))) {
          // If it's missing the other end
          if (!t.accountName || (!t.toAccountName && !t.creditCardName)) {
            let parts: string[] = [];
            if (t.notes.includes('→')) parts = t.notes.replace(/Transferred Balance(\\n|\n)?/gi, '').split('→');
            else if (t.notes.includes('->')) parts = t.notes.replace(/Transferred Balance(\\n|\n)?/gi, '').split('->');
            
            if (parts.length === 2) {
              const parsedSrcName = parts[0].trim();
              const parsedDstName = parts[1].trim();

              const newT = { ...t };
              
              if (!newT.accountName && !newT.accountId) {
                const effectiveSrc = state.accounts.find(a => a.name.toLowerCase() === parsedSrcName.toLowerCase());
                const effectiveSrcCard = state.creditCards.find(c => c.name.toLowerCase() === parsedSrcName.toLowerCase());
                if (effectiveSrcCard) {
                   newT.creditCardId = effectiveSrcCard.id;
                   newT.creditCardName = effectiveSrcCard.name;
                } else if (effectiveSrc) {
                   newT.accountId = effectiveSrc.id;
                   newT.accountName = effectiveSrc.name;
                } else {
                   newT.accountName = parsedSrcName;
                }
              }

              if (newT.type === 'TRANSFER' && !newT.toAccountName && !newT.toAccountId) {
                const effectiveDst = state.accounts.find(a => a.name.toLowerCase() === parsedDstName.toLowerCase());
                const effectiveDstCard = state.creditCards.find(c => c.name.toLowerCase() === parsedDstName.toLowerCase());
                if (effectiveDst) {
                   newT.toAccountId = effectiveDst.id;
                   newT.toAccountName = effectiveDst.name;
                } else if (effectiveDstCard) {
                   newT.type = 'CARD_PAYMENT';
                   newT.creditCardId = effectiveDstCard.id;
                   newT.creditCardName = effectiveDstCard.name;
                } else {
                   newT.toAccountName = parsedDstName;
                }
              } else if (newT.type === 'CARD_PAYMENT' && !newT.creditCardName && !newT.creditCardId) {
                const effectiveDstCard = state.creditCards.find(c => c.name.toLowerCase() === parsedDstName.toLowerCase());
                if (effectiveDstCard) {
                   newT.creditCardId = effectiveDstCard.id;
                   newT.creditCardName = effectiveDstCard.name;
                } else {
                   newT.creditCardName = parsedDstName;
                }
              }

              if (newT.accountName !== t.accountName || newT.toAccountName !== t.toAccountName || newT.creditCardName !== t.creditCardName || newT.type !== t.type) {
                needsMigration = true;
                return newT;
              }
            }
          }
        }
      }

      // Fix half-transfers that were mistakenly saved as TRANSFER from credit cards
      if (t.type === 'TRANSFER' && t.creditCardId && !t.accountId && !t.toAccountId && !t.toAccountName) {
        const newT = { ...t, type: 'EXPENSE' as TransactionType };
        
        // If the transaction has notes but no merchant name, use notes as the merchant
        if (t.notes && !t.merchantName) {
          newT.merchantName = t.notes;
        }

        needsMigration = true;
        return newT;
      }

      return t;
    });

    if (needsMigration) {
      setState(s => ({ ...s, transactions: migratedTransactions }));
    }
  }, [state.transactions, state.accounts, state.creditCards]);

  
  

  // Sync to localStorage on mutations
  useEffect(() => {
    saveFullState(state);
  }, [state]);

  // Recalculate all account & card balances dynamically based on the transaction ledger
  const {
    accounts: computedAccounts,
    cards: computedCards,
    investments: computedInvestments,
    loans: computedLoans,
    debts: computedDebts,
  } = useMemo(() => {
    return recalculateAllBalances(
      (state.accounts || []).filter(a => !a.isDeleted),
      (state.creditCards || []).filter(c => !c.isDeleted),
      (state.investments || []).filter(i => !i.isDeleted),
      (state.loans || []).filter(l => !l.isDeleted),
      (state.debts || []).filter(d => !d.isDeleted),
      state.transactions
    );
  }, [state.accounts, state.creditCards, state.investments, state.loans, state.debts, state.transactions]);


  // Compute financial high level summary
  const summary = useMemo(() => {
    return computeFinancialSummary(
      computedAccounts,
      computedCards,
      computedInvestments,
      computedLoans,
      computedDebts,
      state.transactions,
      activeMonth
    );
  }, [computedAccounts, computedCards, computedInvestments, computedLoans, computedDebts, state.transactions, activeMonth]);

  // Compute category spending breakdown for the current active month
  const categorySpending = useMemo(() => {
    return getCategorySpendingBreakdown(state.transactions, state.categories, activeMonth);
  }, [state.transactions, state.categories, activeMonth]);

  const deletedTransactions = useMemo(() => {
    return state.transactions.filter(t => t.isDeleted);
  }, [state.transactions]);

  const deletedAccounts = useMemo(() => {
    return state.accounts.filter(a => a.isDeleted);
  }, [state.accounts]);

  const deletedCreditCards = useMemo(() => {
    return state.creditCards.filter(c => c.isDeleted);
  }, [state.creditCards]);

  const deletedBudgets = useMemo(() => {
    return state.budgets.filter(b => b.isDeleted);
  }, [state.budgets]);

  const deletedSubscriptions = useMemo(() => {
    return state.subscriptions.filter(s => s.isDeleted);
  }, [state.subscriptions]);

  const deletedRecurring = useMemo(() => {
    return (state.recurring || []).filter(r => r.isDeleted);
  }, [state.recurring]);

  const deletedGoals = useMemo(() => {
    return (state.goals || []).filter(g => g.isDeleted);
  }, [state.goals]);

  const deletedLoans = useMemo(() => {
    return (state.loans || []).filter(l => l.isDeleted);
  }, [state.loans]);

  const deletedInvestments = useMemo(() => {
    return (state.investments || []).filter(i => i.isDeleted);
  }, [state.investments]);

  const deletedDebts = useMemo(() => {
    return (state.debts || []).filter(d => d.isDeleted);
  }, [state.debts]);

  const trashCount = useMemo(() => {
    return (
      deletedTransactions.length +
      deletedAccounts.length +
      deletedCreditCards.length +
      deletedBudgets.length +
      deletedSubscriptions.length +
      deletedRecurring.length +
      deletedGoals.length +
      deletedLoans.length +
      deletedInvestments.length +
      deletedDebts.length
    );
  }, [deletedTransactions, deletedAccounts, deletedCreditCards, deletedBudgets, deletedSubscriptions, deletedRecurring, deletedGoals, deletedLoans, deletedInvestments, deletedDebts]);

  const showUndo = useCallback((message: string, onUndo: () => void) => {
    setUndoToast({ message, onUndo });
    setTimeout(() => {
      setUndoToast(prev => (prev?.message === message ? null : prev));
    }, 6000);
  }, []);

  const dismissUndoToast = useCallback(() => {
    setUndoToast(null);
  }, []);

  const unlockApp = useCallback(() => {
    setIsLocked(false);
  }, []);

  const lockApp = useCallback(() => {
    setIsLocked(true);
  }, []);

  // ----------------------------------------------------
  // TRANSACTIONS
  // ----------------------------------------------------
  const addTransaction = useCallback((txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'timestamp'>): string => {
    const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const dateParts = (txData.date || new Date().toISOString().substring(0, 10)).split('-');
    const timeParts = (txData.time || '12:00').split(':');
    const timestamp = new Date(
      Number(dateParts[0]),
      Number(dateParts[1]) - 1,
      Number(dateParts[2]),
      Number(timeParts[0]),
      Number(timeParts[1])
    ).getTime() || Date.now();

    const newTx: Transaction = {
      ...txData,
      id,
      timestamp,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const typeLabel = txData.type === 'EXPENSE' ? 'Expense' : txData.type === 'INCOME' ? 'Income' : txData.type === 'TRANSFER' ? 'Transfer' : 'Payment';
    const entityTitle = txData.notes || txData.categoryName || txData.merchantName || `${typeLabel} Transaction`;
    const summaryText = `Added ${typeLabel.toLowerCase()} of ${formatINR(txData.amount)} (${txData.categoryName || 'General'}${txData.merchantName ? ` · ${txData.merchantName}` : ''})`;

    setState(prev => {
      // Update merchant learning record if merchant provided
      let updatedMerchants = [...prev.merchants];
      if (newTx.merchantName?.trim()) {
        const cleanMerchant = newTx.merchantName.trim();
        const existingIdx = updatedMerchants.findIndex(m => m.name.toLowerCase() === cleanMerchant.toLowerCase());
        if (existingIdx >= 0) {
          updatedMerchants[existingIdx] = {
            ...updatedMerchants[existingIdx],
            defaultCategoryId: newTx.categoryId || updatedMerchants[existingIdx].defaultCategoryId,
            defaultAccountId: newTx.accountId || updatedMerchants[existingIdx].defaultAccountId,
            defaultPaymentAppId: newTx.paymentAppId || updatedMerchants[existingIdx].defaultPaymentAppId,
            transactionCount: (updatedMerchants[existingIdx].transactionCount || 1) + 1,
            lastUsedAt: Date.now(),
          };
        } else {
          updatedMerchants.push({
            id: 'm_' + Date.now(),
            name: cleanMerchant,
            defaultCategoryId: newTx.categoryId,
            defaultAccountId: newTx.accountId,
            defaultPaymentAppId: newTx.paymentAppId,
            transactionCount: 1,
            lastUsedAt: Date.now(),
          });
        }
      }

      const diffDetails: ActivityChangeDetail[] = [
        { field: 'amount', label: 'Amount', newValue: formatINR(txData.amount) },
        { field: 'type', label: 'Type', newValue: txData.type },
        { field: 'date', label: 'Date', newValue: `${txData.date} ${txData.time || ''}`.trim() },
        { field: 'categoryName', label: 'Category', newValue: txData.categoryName || 'None' },
        { field: 'accountName', label: 'Account / Source', newValue: txData.creditCardName || txData.accountName || 'None' },
      ];
      if (txData.merchantName) diffDetails.push({ field: 'merchantName', label: 'Payee / Merchant', newValue: txData.merchantName });
      if (txData.notes) diffDetails.push({ field: 'notes', label: 'Notes', newValue: txData.notes });

      return {
        ...prev,
        merchants: updatedMerchants,
        transactions: [newTx, ...prev.transactions],
        activityLogs: appendActivityLog(prev.activityLogs, 'TRANSACTION', 'CREATE', summaryText, {
          entityId: id,
          entityName: entityTitle,
          details: diffDetails,
        }),
      };
    });

    return id;
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setState(prev => {
      const idx = prev.transactions.findIndex(t => t.id === id);
      if (idx === -1) return prev;
      const old = prev.transactions[idx];
      
      // If date or time was updated, recalculate timestamp
      let newTimestamp = old.timestamp;
      if (updates.date || updates.time) {
        const dateParts = ((updates.date || old.date || new Date().toISOString().substring(0, 10))).split('-');
        const timeParts = ((updates.time || old.time || '12:00')).split(':');
        newTimestamp = new Date(
          Number(dateParts[0]),
          Number(dateParts[1]) - 1,
          Number(dateParts[2]),
          Number(timeParts[0]),
          Number(timeParts[1])
        ).getTime() || old.timestamp;
      }

      const updated = { ...old, ...updates, timestamp: newTimestamp, updatedAt: Date.now() };
      const newTxList = [...prev.transactions];
      newTxList[idx] = updated;

      const diffs = computeTransactionDiffs(old, updates);
      const entityTitle = updated.notes || updated.categoryName || updated.merchantName || 'Transaction';
      const summaryText = diffs.length > 0
        ? `Modified transaction (${diffs.map(d => d.label).join(', ')})`
        : `Updated transaction record`;

      return {
        ...prev,
        transactions: newTxList,
        activityLogs: appendActivityLog(prev.activityLogs, 'TRANSACTION', 'UPDATE', summaryText, {
          entityId: id,
          entityName: entityTitle,
          details: diffs,
        }),
      };
    });
  }, []);

  const restoreTransactions = useCallback((ids: string[]) => {
    setState(prev => {
      const targets = prev.transactions.filter(t => ids.includes(t.id));
      if (targets.length === 0) return prev;
      return {
        ...prev,
        transactions: prev.transactions.map(t =>
          ids.includes(t.id) ? { ...t, isDeleted: false, deletedAt: undefined } : t
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'TRANSACTION', 'RESTORE', `Restored ${targets.length} transactions from Trash`),
      };
    });
  }, []);

  const deleteTransactions = useCallback((ids: string[], softDelete = true) => {
    setState(prev => {
      const targets = prev.transactions.filter(t => ids.includes(t.id));
      if (targets.length === 0) return prev;

      if (softDelete) {
        const updatedList = prev.transactions.map(t =>
          ids.includes(t.id) ? { ...t, isDeleted: true, deletedAt: Date.now() } : t
        );
        showUndo(`${targets.length} transactions moved to Trash`, () => {
          restoreTransactions(ids);
        });
        return {
          ...prev,
          transactions: updatedList,
          activityLogs: appendActivityLog(prev.activityLogs, 'TRANSACTION', 'DELETE', `Moved ${targets.length} transactions to Trash`),
        };
      } else {
        return {
          ...prev,
          transactions: prev.transactions.filter(t => !ids.includes(t.id)),
          activityLogs: appendActivityLog(prev.activityLogs, 'TRANSACTION', 'PURGE', `Permanently deleted ${targets.length} transactions`),
        };
      }
    });
  }, [showUndo, restoreTransactions]);

  const deleteTransaction = useCallback((id: string, softDelete = true) => {
    setState(prev => {
      const target = prev.transactions.find(t => t.id === id);
      if (!target) return prev;

      const entityTitle = target.notes || target.categoryName || target.merchantName || 'Transaction';

      if (softDelete) {
        const updatedList = prev.transactions.map(t =>
          t.id === id ? { ...t, isDeleted: true, deletedAt: Date.now() } : t
        );
        showUndo('Transaction moved to Trash', () => {
          restoreTransaction(id);
        });
        return {
          ...prev,
          transactions: updatedList,
          activityLogs: appendActivityLog(prev.activityLogs, 'TRANSACTION', 'DELETE', `Moved transaction (${formatINR(target.amount)}) to Trash`, {
            entityId: id,
            entityName: entityTitle,
          }),
        };
      } else {
        return {
          ...prev,
          transactions: prev.transactions.filter(t => t.id !== id),
          activityLogs: appendActivityLog(prev.activityLogs, 'TRANSACTION', 'PURGE', `Permanently deleted transaction (${formatINR(target.amount)})`, {
            entityId: id,
            entityName: entityTitle,
          }),
        };
      }
    });
  }, [showUndo]);

  const restoreTransaction = useCallback((id: string) => {
    setState(prev => {
      const target = prev.transactions.find(t => t.id === id);
      return {
        ...prev,
        transactions: prev.transactions.map(t =>
          t.id === id ? { ...t, isDeleted: false, deletedAt: undefined } : t
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'TRANSACTION', 'RESTORE', `Restored transaction from Trash`, {
          entityId: id,
          entityName: target?.categoryName || 'Transaction',
        }),
      };
    });
  }, []);

  const permanentlyDeleteTransaction = useCallback((id: string) => {
    setState(prev => {
      const target = prev.transactions.find(t => t.id === id);
      return {
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id),
        activityLogs: appendActivityLog(prev.activityLogs, 'TRANSACTION', 'PURGE', `Permanently removed transaction`, {
          entityId: id,
          entityName: target?.categoryName || 'Transaction',
        }),
      };
    });
  }, []);

  const emptyTrash = useCallback(() => {
    setState(prev => {
      const purgedCount = prev.transactions.filter(t => t.isDeleted).length;
      return {
        ...prev,
        transactions: prev.transactions.filter(t => !t.isDeleted),
        activityLogs: appendActivityLog(prev.activityLogs, 'SYSTEM', 'PURGE', `Emptied transaction trash (${purgedCount} items removed)`),
      };
    });
  }, []);

  const emptyAllTrash = useCallback(() => {
    setState(prev => {
      const totalPurged =
        prev.transactions.filter(t => t.isDeleted).length +
        prev.accounts.filter(a => a.isDeleted).length +
        prev.creditCards.filter(c => c.isDeleted).length +
        prev.budgets.filter(b => b.isDeleted).length +
        prev.subscriptions.filter(s => s.isDeleted).length +
        (prev.recurring || []).filter(r => r.isDeleted).length +
        (prev.goals || []).filter(g => g.isDeleted).length +
        (prev.loans || []).filter(l => l.isDeleted).length +
        (prev.investments || []).filter(i => i.isDeleted).length +
        (prev.debts || []).filter(d => d.isDeleted).length;

      return {
        ...prev,
        transactions: prev.transactions.filter(t => !t.isDeleted),
        accounts: prev.accounts.filter(a => !a.isDeleted),
        creditCards: prev.creditCards.filter(c => !c.isDeleted),
        budgets: prev.budgets.filter(b => !b.isDeleted),
        subscriptions: prev.subscriptions.filter(s => !s.isDeleted),
        recurring: (prev.recurring || []).filter(r => !r.isDeleted),
        goals: (prev.goals || []).filter(g => !g.isDeleted),
        loans: (prev.loans || []).filter(l => !l.isDeleted),
        investments: (prev.investments || []).filter(i => !i.isDeleted),
        debts: (prev.debts || []).filter(d => !d.isDeleted),
        activityLogs: appendActivityLog(prev.activityLogs, 'SYSTEM', 'PURGE', `Emptied all Trash bins (${totalPurged} items purged)`),
      };
    });
  }, []);

  const restoreAllTrash = useCallback(() => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => ({ ...t, isDeleted: false, deletedAt: undefined })),
      accounts: prev.accounts.map(a => ({ ...a, isDeleted: false, deletedAt: undefined })),
      creditCards: prev.creditCards.map(c => ({ ...c, isDeleted: false, deletedAt: undefined })),
      budgets: prev.budgets.map(b => ({ ...b, isDeleted: false, deletedAt: undefined })),
      subscriptions: prev.subscriptions.map(s => ({ ...s, isDeleted: false, deletedAt: undefined })),
      recurring: (prev.recurring || []).map(r => ({ ...r, isDeleted: false, deletedAt: undefined })),
      goals: (prev.goals || []).map(g => ({ ...g, isDeleted: false, deletedAt: undefined })),
      loans: (prev.loans || []).map(l => ({ ...l, isDeleted: false, deletedAt: undefined })),
      investments: (prev.investments || []).map(i => ({ ...i, isDeleted: false, deletedAt: undefined })),
      debts: (prev.debts || []).map(d => ({ ...d, isDeleted: false, deletedAt: undefined })),
      activityLogs: appendActivityLog(prev.activityLogs, 'SYSTEM', 'RESTORE', `Restored all items from Trash bin`),
    }));
  }, []);

  // ----------------------------------------------------
  // TRANSACTION TEMPLATES
  // ----------------------------------------------------
  const addTemplate = useCallback((template: Omit<TransactionTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): string => {
    const id = `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTemplate: TransactionTemplate = {
      ...template,
      id,
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      templates: [newTemplate, ...(prev.templates || [])],
      activityLogs: appendActivityLog(prev.activityLogs, 'TEMPLATE', 'CREATE', `Created transaction template "${newTemplate.name}"`, {
        entityId: id,
        entityName: newTemplate.name,
      }),
    }));
    return id;
  }, []);

  const updateTemplate = useCallback((id: string, updates: Partial<TransactionTemplate>) => {
    setState(prev => {
      const old = (prev.templates || []).find(t => t.id === id);
      const diffs = old ? computeFieldDiffs(old, updates) : [];
      return {
        ...prev,
        templates: (prev.templates || []).map(t =>
          t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'TEMPLATE', 'UPDATE', `Updated template "${updates.name || old?.name || 'Template'}"`, {
          entityId: id,
          entityName: updates.name || old?.name,
          details: diffs,
        }),
      };
    });
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setState(prev => {
      const target = (prev.templates || []).find(t => t.id === id);
      return {
        ...prev,
        templates: (prev.templates || []).filter(t => t.id !== id),
        activityLogs: appendActivityLog(prev.activityLogs, 'TEMPLATE', 'DELETE', `Deleted template "${target?.name || 'Template'}"`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const toggleFavoriteTemplate = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      templates: (prev.templates || []).map(t =>
        t.id === id ? { ...t, isFavorite: !t.isFavorite, updatedAt: Date.now() } : t
      ),
    }));
  }, []);

  const recordFromTemplate = useCallback((templateId: string, customAmount?: number, customDate?: string): string => {
    let createdTxId = '';
    setState(prev => {
      const tmpl = (prev.templates || []).find(t => t.id === templateId);
      if (!tmpl) return prev;

      const txAmount = customAmount !== undefined && customAmount > 0 ? customAmount : (tmpl.amount || 0);
      const dateStr = customDate || new Date().toISOString().substring(0, 10);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newTxId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      createdTxId = newTxId;

      const newTx: Transaction = {
        id: newTxId,
        amount: txAmount,
        type: tmpl.type,
        date: dateStr,
        time: timeStr,
        timestamp: Date.now(),
        categoryId: tmpl.categoryId,
        categoryName: tmpl.categoryName,
        subcategory: tmpl.subcategory,
        merchantName: tmpl.merchantName,
        accountId: tmpl.accountId,
        accountName: tmpl.accountName,
        creditCardId: tmpl.creditCardId,
        creditCardName: tmpl.creditCardName,
        toAccountId: tmpl.toAccountId,
        toAccountName: tmpl.toAccountName,
        paymentAppId: tmpl.paymentAppId,
        paymentAppName: tmpl.paymentAppName,
        notes: tmpl.notes,
        tags: tmpl.tags,
        splits: tmpl.splits,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedTemplates = (prev.templates || []).map(t =>
        t.id === templateId
          ? { ...t, usageCount: (t.usageCount || 0) + 1, lastUsedAt: Date.now(), updatedAt: Date.now() }
          : t
      );

      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        templates: updatedTemplates,
        activityLogs: appendActivityLog(prev.activityLogs, 'TRANSACTION', 'CREATE', `Quick logged ${formatINR(txAmount)} from template "${tmpl.name}"`, {
          entityId: newTxId,
          entityName: tmpl.name,
        }),
      };
    });

    return createdTxId;
  }, []);

  const saveTransactionAsTemplate = useCallback((tx: Partial<Transaction>, templateName?: string): string => {
    const id = `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let resolvedName = templateName;
    if (!resolvedName) {
      resolvedName = tx.merchantName || tx.categoryName || 'Quick Template';
    }

    const newTemplate: TransactionTemplate = {
      id,
      name: resolvedName,
      icon: 'Zap',
      color: '#059669',
      type: tx.type || 'EXPENSE',
      amount: tx.amount,
      categoryId: tx.categoryId,
      categoryName: tx.categoryName,
      subcategory: tx.subcategory,
      merchantName: tx.merchantName,
      accountId: tx.accountId,
      accountName: tx.accountName,
      creditCardId: tx.creditCardId,
      creditCardName: tx.creditCardName,
      toAccountId: tx.toAccountId,
      toAccountName: tx.toAccountName,
      paymentAppId: tx.paymentAppId,
      paymentAppName: tx.paymentAppName,
      notes: tx.notes,
      tags: tx.tags,
      splits: tx.splits,
      isFavorite: true,
      usageCount: 1,
      lastUsedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setState(prev => ({
      ...prev,
      templates: [newTemplate, ...(prev.templates || [])],
      activityLogs: appendActivityLog(prev.activityLogs, 'TEMPLATE', 'CREATE', `Saved transaction as template "${resolvedName}"`, {
        entityId: id,
        entityName: resolvedName,
      }),
    }));

    return id;
  }, []);

  // ----------------------------------------------------
  // ACCOUNTS
  // ----------------------------------------------------
  const addAccount = useCallback((account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'calculatedBalance'>): string => {
    const id = 'acc_' + Date.now();
    const newAcc: Account = {
      ...account,
      id,
      calculatedBalance: account.openingBalance,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      accounts: [...prev.accounts, newAcc],
      activityLogs: appendActivityLog(prev.activityLogs, 'ACCOUNT', 'CREATE', `Added bank account "${newAcc.name}" (${newAcc.institution || 'Bank'})`, {
        entityId: id,
        entityName: newAcc.name,
        details: [
          { field: 'name', label: 'Account Name', newValue: newAcc.name },
          { field: 'institution', label: 'Bank / Institution', newValue: newAcc.institution },
          { field: 'type', label: 'Type', newValue: newAcc.type },
          { field: 'openingBalance', label: 'Opening Balance', newValue: formatINR(newAcc.openingBalance) },
        ],
      }),
    }));
    return id;
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    setState(prev => {
      const old = prev.accounts.find(a => a.id === id);
      const diffs = old ? computeFieldDiffs(old, updates, {
        name: 'Account Name',
        institution: 'Bank / Institution',
        type: 'Type',
        openingBalance: 'Opening Balance',
        accountNumberLast4: 'Last 4 Digits',
        color: 'Color Theme',
        notes: 'Notes',
      }) : [];

      return {
        ...prev,
        accounts: prev.accounts.map(a => (a.id === id ? { ...a, ...updates, updatedAt: Date.now() } : a)),
        activityLogs: appendActivityLog(prev.activityLogs, 'ACCOUNT', 'UPDATE', `Updated bank account "${updates.name || old?.name || 'Account'}"`, {
          entityId: id,
          entityName: updates.name || old?.name,
          details: diffs,
        }),
      };
    });
  }, []);

  const deleteAccount = useCallback((id: string, softDelete = true) => {
    setState(prev => {
      const target = prev.accounts.find(a => a.id === id);
      if (!target) return prev;

      if (softDelete) {
        showUndo(`Account "${target.name}" moved to Trash`, () => {
          restoreAccount(id);
        });
        return {
          ...prev,
          accounts: prev.accounts.map(a =>
            a.id === id ? { ...a, isDeleted: true, deletedAt: Date.now() } : a
          ),
          activityLogs: appendActivityLog(prev.activityLogs, 'ACCOUNT', 'DELETE', `Moved account "${target.name}" to Trash`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      } else {
        return {
          ...prev,
          accounts: prev.accounts.filter(a => a.id !== id),
          activityLogs: appendActivityLog(prev.activityLogs, 'ACCOUNT', 'PURGE', `Permanently deleted account "${target.name}"`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      }
    });
  }, [showUndo]);

  const restoreAccount = useCallback((id: string) => {
    setState(prev => {
      const target = prev.accounts.find(a => a.id === id);
      return {
        ...prev,
        accounts: prev.accounts.map(a =>
          a.id === id ? { ...a, isDeleted: false, deletedAt: undefined } : a
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'ACCOUNT', 'RESTORE', `Restored account "${target?.name || 'Account'}" from Trash`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const permanentlyDeleteAccount = useCallback((id: string) => {
    setState(prev => {
      const target = prev.accounts.find(a => a.id === id);
      return {
        ...prev,
        accounts: prev.accounts.filter(a => a.id !== id),
        activityLogs: appendActivityLog(prev.activityLogs, 'ACCOUNT', 'PURGE', `Permanently deleted account "${target?.name || 'Account'}"`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const reorderAccounts = useCallback((orderedIds: string[]) => {
    setState(prev => {
      const orderMap = new Map<string, number>();
      orderedIds.forEach((id, idx) => orderMap.set(id, idx));

      const sorted = [...prev.accounts].sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
        return orderA - orderB;
      }).map((acc, index) => ({
        ...acc,
        order: index,
        updatedAt: Date.now(),
      }));

      return {
        ...prev,
        accounts: sorted,
        settings: {
          ...prev.settings,
          accountSortPreference: 'CUSTOM',
        },
        activityLogs: appendActivityLog(prev.activityLogs, 'ACCOUNT', 'UPDATE', `Rearranged ${sorted.length} accounts layout order`),
      };
    });
  }, []);

  const setAccountSortPreference = useCallback((sort: AccountSortOption) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        accountSortPreference: sort,
      },
    }));
  }, []);

  // ----------------------------------------------------
  // CREDIT CARDS
  // ----------------------------------------------------
  const addCreditCard = useCallback((card: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt' | 'currentOutstanding'>): string => {
    const id = 'cc_' + Date.now();
    const newCard: CreditCard = {
      ...card,
      id,
      currentOutstanding: card.openingBalance,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      creditCards: [...prev.creditCards, newCard],
      activityLogs: appendActivityLog(prev.activityLogs, 'CREDIT_CARD', 'CREATE', `Added credit card "${newCard.name}" (Limit: ${formatINR(newCard.creditLimit)})`, {
        entityId: id,
        entityName: newCard.name,
        details: [
          { field: 'name', label: 'Card Name', newValue: newCard.name },
          { field: 'issuer', label: 'Bank / Issuer', newValue: newCard.issuer },
          { field: 'creditLimit', label: 'Credit Limit', newValue: formatINR(newCard.creditLimit) },
          { field: 'statementDate', label: 'Statement Day', newValue: `${newCard.statementDate}th of month` },
          { field: 'dueDate', label: 'Due Day', newValue: `${newCard.dueDate}th of month` },
        ],
      }),
    }));
    return id;
  }, []);

  const updateCreditCard = useCallback((id: string, updates: Partial<CreditCard>) => {
    setState(prev => {
      const old = prev.creditCards.find(c => c.id === id);
      const diffs = old ? computeFieldDiffs(old, updates, {
        name: 'Card Name',
        issuer: 'Bank / Issuer',
        creditLimit: 'Credit Limit',
        statementDate: 'Statement Day',
        dueDate: 'Due Day',
        lastFourDigits: 'Last 4 Digits',
        cardTheme: 'Theme Design',
      }) : [];

      return {
        ...prev,
        creditCards: prev.creditCards.map(c => (c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c)),
        activityLogs: appendActivityLog(prev.activityLogs, 'CREDIT_CARD', 'UPDATE', `Updated credit card "${updates.name || old?.name || 'Credit Card'}"`, {
          entityId: id,
          entityName: updates.name || old?.name,
          details: diffs,
        }),
      };
    });
  }, []);

  const deleteCreditCard = useCallback((id: string, softDelete = true) => {
    setState(prev => {
      const target = prev.creditCards.find(c => c.id === id);
      if (!target) return prev;

      if (softDelete) {
        showUndo(`Credit Card "${target.name}" moved to Trash`, () => {
          restoreCreditCard(id);
        });
        return {
          ...prev,
          creditCards: prev.creditCards.map(c =>
            c.id === id ? { ...c, isDeleted: true, deletedAt: Date.now() } : c
          ),
          activityLogs: appendActivityLog(prev.activityLogs, 'CREDIT_CARD', 'DELETE', `Moved credit card "${target.name}" to Trash`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      } else {
        return {
          ...prev,
          creditCards: prev.creditCards.filter(c => c.id !== id),
          activityLogs: appendActivityLog(prev.activityLogs, 'CREDIT_CARD', 'PURGE', `Permanently deleted credit card "${target.name}"`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      }
    });
  }, [showUndo]);

  const restoreCreditCard = useCallback((id: string) => {
    setState(prev => {
      const target = prev.creditCards.find(c => c.id === id);
      return {
        ...prev,
        creditCards: prev.creditCards.map(c =>
          c.id === id ? { ...c, isDeleted: false, deletedAt: undefined } : c
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'CREDIT_CARD', 'RESTORE', `Restored credit card "${target?.name || 'Card'}" from Trash`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const permanentlyDeleteCreditCard = useCallback((id: string) => {
    setState(prev => {
      const target = prev.creditCards.find(c => c.id === id);
      return {
        ...prev,
        creditCards: prev.creditCards.filter(c => c.id !== id),
        activityLogs: appendActivityLog(prev.activityLogs, 'CREDIT_CARD', 'PURGE', `Permanently deleted credit card "${target?.name || 'Card'}"`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const reorderCreditCards = useCallback((orderedIds: string[]) => {
    setState(prev => {
      const orderMap = new Map<string, number>();
      orderedIds.forEach((id, idx) => orderMap.set(id, idx));

      const sorted = [...prev.creditCards].sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
        return orderA - orderB;
      }).map((card, index) => ({
        ...card,
        order: index,
        updatedAt: Date.now(),
      }));

      return {
        ...prev,
        creditCards: sorted,
        settings: {
          ...prev.settings,
          cardSortPreference: 'CUSTOM',
        },
        activityLogs: appendActivityLog(prev.activityLogs, 'CREDIT_CARD', 'UPDATE', `Rearranged ${sorted.length} credit cards layout order`),
      };
    });
  }, []);

  const setCardSortPreference = useCallback((sort: CardSortOption) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        cardSortPreference: sort,
      },
    }));
  }, []);

  const payCreditCardBill = useCallback((cardId: string, fromAccountId: string, amount: number, paymentAppId?: string) => {
    const card = state.creditCards.find(c => c.id === cardId);
    const bank = state.accounts.find(a => a.id === fromAccountId);
    const now = new Date();
    const date = now.toISOString().substring(0, 10);
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    addTransaction({
      amount,
      type: 'CARD_PAYMENT',
      date,
      time,
      accountId: fromAccountId,
      accountName: bank?.name || 'Bank',
      creditCardId: cardId,
      creditCardName: card?.name || 'Credit Card',
      paymentAppId,
      notes: `Bill payment for ${card?.name || 'Credit Card'}`,
    });
  }, [state.creditCards, state.accounts, addTransaction]);

  // ----------------------------------------------------
  // CONVERT ACCOUNT TO CREDIT CARD
  // ----------------------------------------------------
  const convertAccountToCreditCard = useCallback((options: ConvertAccountToCardOptions): string => {
    const targetAcc = state.accounts.find(a => a.id === options.accountId);
    if (!targetAcc) throw new Error('Bank account not found');

    const cardId = 'cc_' + Date.now();
    const themeConfig = CARD_THEMES.find(t => t.id === options.cardTheme);

    const newCard: CreditCard = {
      id: cardId,
      name: options.cardName.trim() || `${targetAcc.name} Card`,
      issuer: options.issuer || targetAcc.institution,
      network: options.network || 'VISA',
      cardTheme: options.cardTheme || 'midnight',
      cardVariant: options.cardVariant,
      lastFourDigits: options.lastFourDigits.trim() || targetAcc.accountNumberLast4 || '1234',
      creditLimit: Number(options.creditLimit) || 100000,
      openingBalance: options.openingBalance !== undefined ? Number(options.openingBalance) : 0,
      currentOutstanding: options.openingBalance !== undefined ? Number(options.openingBalance) : 0,
      statementDate: Number(options.statementDate) || 15,
      dueDate: Number(options.dueDate) || 5,
      icon: 'CreditCard',
      color: themeConfig?.accentColor || targetAcc.color || '#38bdf8',
      notes: options.notes !== undefined ? options.notes : targetAcc.notes,
      isActive: targetAcc.isActive ?? true,
      createdAt: targetAcc.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    setState(prev => {
      // 1. Migrate transactions if requested
      let updatedTransactions = prev.transactions;
      if (options.migrateTransactions !== false) {
        updatedTransactions = prev.transactions.map(t => {
          let updated = { ...t };
          let changed = false;

          if (t.accountId === options.accountId) {
            changed = true;
            if (t.type === 'EXPENSE') {
              updated.accountId = undefined;
              updated.accountName = undefined;
              updated.creditCardId = cardId;
              updated.creditCardName = newCard.name;
            } else if (t.type === 'CARD_PAYMENT') {
              updated.accountId = undefined;
              updated.accountName = undefined;
            } else if (t.type === 'TRANSFER') {
              updated.accountId = undefined;
              updated.accountName = undefined;
              updated.creditCardId = cardId;
              updated.creditCardName = newCard.name;
            } else {
              updated.accountId = undefined;
              updated.accountName = undefined;
              updated.creditCardId = cardId;
              updated.creditCardName = newCard.name;
            }
          }

          if (t.toAccountId === options.accountId) {
            changed = true;
            updated.type = 'CARD_PAYMENT';
            updated.toAccountId = undefined;
            updated.toAccountName = undefined;
            updated.creditCardId = cardId;
            updated.creditCardName = newCard.name;
          }

          if (changed) {
            updated.updatedAt = Date.now();
            return updated;
          }
          return t;
        });
      }

      // 2. Migrate subscriptions & recurring
      const updatedSubscriptions = prev.subscriptions.map(s => {
        if (s.accountId === options.accountId) {
          return { ...s, accountId: undefined, creditCardId: cardId, creditCardName: newCard.name };
        }
        return s;
      });

      const updatedRecurring = prev.recurring.map(r => {
        if (r.accountId === options.accountId) {
          return { ...r, accountId: undefined, creditCardId: cardId, creditCardName: newCard.name };
        }
        return r;
      });

      // 3. Remove old account from active list
      const shouldDelete = options.deleteOriginalAccount !== false;
      const updatedAccounts = shouldDelete
        ? prev.accounts.filter(a => a.id !== options.accountId)
        : prev.accounts.map(a =>
            a.id === options.accountId
              ? { ...a, isActive: false, notes: `${a.notes || ''} (Converted to ${newCard.name})`.trim() }
              : a
          );

      return {
        ...prev,
        accounts: updatedAccounts,
        creditCards: [...prev.creditCards, newCard],
        transactions: updatedTransactions,
        subscriptions: updatedSubscriptions,
        recurring: updatedRecurring,
        activityLogs: appendActivityLog(prev.activityLogs, 'ACCOUNT', 'CONVERT', `Converted Bank Account "${targetAcc.name}" to Credit Card "${newCard.name}"`, {
          entityId: cardId,
          entityName: newCard.name,
        }),
      };
    });

    showUndo(`Converted "${targetAcc.name}" to Credit Card "${newCard.name}"`, () => {
      setState(prevUndo => ({
        ...prevUndo,
        accounts: prevUndo.accounts.some(a => a.id === targetAcc.id) ? prevUndo.accounts : [...prevUndo.accounts, targetAcc],
        creditCards: prevUndo.creditCards.filter(c => c.id !== cardId),
      }));
    });

    return cardId;
  }, [state.accounts, showUndo]);

  // ----------------------------------------------------
  // CONVERT CREDIT CARD TO BANK ACCOUNT
  // ----------------------------------------------------
  const convertCreditCardToAccount = useCallback((options: ConvertCardToAccountOptions): string => {
    const targetCard = state.creditCards.find(c => c.id === options.cardId);
    if (!targetCard) throw new Error('Credit card not found');

    const accId = 'acc_' + Date.now();
    const newAcc: Account = {
      id: accId,
      name: options.accountName.trim() || `${targetCard.name} Account`,
      institution: options.institution || targetCard.issuer,
      type: options.type || 'SAVINGS',
      openingBalance: options.openingBalance !== undefined ? Number(options.openingBalance) : 0,
      calculatedBalance: options.openingBalance !== undefined ? Number(options.openingBalance) : 0,
      accountNumberLast4: options.lastFourDigits || targetCard.lastFourDigits,
      icon: options.icon || 'Landmark',
      color: options.color || targetCard.color || '#004c8f',
      accountTheme: options.accountTheme || 'bank_hdfc',
      notes: options.notes !== undefined ? options.notes : targetCard.notes,
      isActive: targetCard.isActive ?? true,
      createdAt: targetCard.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    setState(prev => {
      let updatedTransactions = prev.transactions;
      if (options.migrateTransactions !== false) {
        updatedTransactions = prev.transactions.map(t => {
          if (t.creditCardId === options.cardId) {
            if (t.type === 'CARD_PAYMENT') {
              return {
                ...t,
                type: 'TRANSFER' as TransactionType,
                creditCardId: undefined,
                creditCardName: undefined,
                toAccountId: accId,
                toAccountName: newAcc.name,
                updatedAt: Date.now(),
              };
            } else {
              return {
                ...t,
                creditCardId: undefined,
                creditCardName: undefined,
                accountId: accId,
                accountName: newAcc.name,
                updatedAt: Date.now(),
              };
            }
          }
          return t;
        });
      }

      const updatedSubscriptions = prev.subscriptions.map(s => {
        if (s.creditCardId === options.cardId) {
          return { ...s, creditCardId: undefined, accountId: accId, accountName: newAcc.name };
        }
        return s;
      });

      const updatedRecurring = prev.recurring.map(r => {
        if (r.creditCardId === options.cardId) {
          return { ...r, creditCardId: undefined, accountId: accId, accountName: newAcc.name };
        }
        return r;
      });

      return {
        ...prev,
        creditCards: options.deleteOriginalCard !== false ? prev.creditCards.filter(c => c.id !== options.cardId) : prev.creditCards.map(c => c.id === options.cardId ? { ...c, isActive: false } : c),
        accounts: [...prev.accounts, newAcc],
        transactions: updatedTransactions,
        subscriptions: updatedSubscriptions,
        recurring: updatedRecurring,
        activityLogs: appendActivityLog(prev.activityLogs, 'CREDIT_CARD', 'CONVERT', `Converted Credit Card "${targetCard.name}" to Bank Account "${newAcc.name}"`, {
          entityId: accId,
          entityName: newAcc.name,
        }),
      };
    });

    showUndo(`Converted "${targetCard.name}" to Bank Account "${newAcc.name}"`, () => {
      setState(prevUndo => ({
        ...prevUndo,
        creditCards: prevUndo.creditCards.some(c => c.id === targetCard.id) ? prevUndo.creditCards : [...prevUndo.creditCards, targetCard],
        accounts: prevUndo.accounts.filter(a => a.id !== accId),
      }));
    });

    return accId;
  }, [state.creditCards, showUndo]);

  // ----------------------------------------------------
  // BUDGETS
  // ----------------------------------------------------
  const addBudget = useCallback((budget: Omit<Budget, 'id'>): string => {
    const id = 'b_' + Date.now();
    const newBudget: Budget = { ...budget, id };
    setState(prev => ({
      ...prev,
      budgets: [...prev.budgets, newBudget],
      activityLogs: appendActivityLog(prev.activityLogs, 'BUDGET', 'CREATE', `Created budget "${newBudget.name}" (${formatINR(newBudget.amount)}${newBudget.month ? ` for ${newBudget.month}` : ''})`, {
        entityId: id,
        entityName: newBudget.name,
      }),
    }));
    return id;
  }, []);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setState(prev => {
      const old = prev.budgets.find(b => b.id === id);
      const diffs = old ? computeFieldDiffs(old, updates, {
        name: 'Budget Name',
        amount: 'Limit Amount',
        period: 'Period',
      }) : [];

      return {
        ...prev,
        budgets: prev.budgets.map(b => (b.id === id ? { ...b, ...updates } : b)),
        activityLogs: appendActivityLog(prev.activityLogs, 'BUDGET', 'UPDATE', `Updated budget "${updates.name || old?.name || 'Budget'}"`, {
          entityId: id,
          entityName: updates.name || old?.name,
          details: diffs,
        }),
      };
    });
  }, []);

  const deleteBudget = useCallback((id: string, softDelete = true) => {
    setState(prev => {
      const target = prev.budgets.find(b => b.id === id);
      if (!target) return prev;

      if (softDelete) {
        showUndo(`Budget "${target.name}" moved to Trash`, () => {
          restoreBudget(id);
        });
        return {
          ...prev,
          budgets: prev.budgets.map(b =>
            b.id === id ? { ...b, isDeleted: true, deletedAt: Date.now() } : b
          ),
          activityLogs: appendActivityLog(prev.activityLogs, 'BUDGET', 'DELETE', `Moved budget "${target.name}" to Trash`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      } else {
        return {
          ...prev,
          budgets: prev.budgets.filter(b => b.id !== id),
          activityLogs: appendActivityLog(prev.activityLogs, 'BUDGET', 'PURGE', `Permanently deleted budget "${target.name}"`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      }
    });
  }, [showUndo]);

  const restoreBudget = useCallback((id: string) => {
    setState(prev => {
      const target = prev.budgets.find(b => b.id === id);
      return {
        ...prev,
        budgets: prev.budgets.map(b =>
          b.id === id ? { ...b, isDeleted: false, deletedAt: undefined } : b
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'BUDGET', 'RESTORE', `Restored budget "${target?.name || 'Budget'}" from Trash`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const permanentlyDeleteBudget = useCallback((id: string) => {
    setState(prev => {
      const target = prev.budgets.find(b => b.id === id);
      return {
        ...prev,
        budgets: prev.budgets.filter(b => b.id !== id),
        activityLogs: appendActivityLog(prev.activityLogs, 'BUDGET', 'PURGE', `Permanently deleted budget "${target?.name || 'Budget'}"`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const reorderBudgets = useCallback((orderedIds: string[]) => {
    setState(prev => {
      const orderMap = new Map<string, number>();
      orderedIds.forEach((id, idx) => orderMap.set(id, idx));

      const sorted = [...prev.budgets].sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
        return orderA - orderB;
      }).map((budget, index) => ({
        ...budget,
        order: index + 1,
      }));

      return {
        ...prev,
        budgets: sorted,
        activityLogs: appendActivityLog(prev.activityLogs, 'BUDGET', 'UPDATE', `Rearranged ${sorted.length} monthly budgets order`),
      };
    });
  }, []);

  // ----------------------------------------------------
  // SUBSCRIPTIONS
  // ----------------------------------------------------
  const addSubscription = useCallback((sub: Omit<Subscription, 'id'>): string => {
    const id = 'sub_' + Date.now();
    const newSub: Subscription = { ...sub, id };
    setState(prev => ({
      ...prev,
      subscriptions: [...prev.subscriptions, newSub],
      activityLogs: appendActivityLog(prev.activityLogs, 'SUBSCRIPTION', 'CREATE', `Added subscription "${newSub.name}" (${formatINR(newSub.amount)} / ${(newSub.frequency || 'monthly').toLowerCase()})`, {
        entityId: id,
        entityName: newSub.name,
      }),
    }));
    return id;
  }, []);

  const updateSubscription = useCallback((id: string, updates: Partial<Subscription>) => {
    setState(prev => {
      const old = prev.subscriptions.find(s => s.id === id);
      const diffs = old ? computeFieldDiffs(old, updates) : [];
      return {
        ...prev,
        subscriptions: prev.subscriptions.map(s => (s.id === id ? { ...s, ...updates } : s)),
        activityLogs: appendActivityLog(prev.activityLogs, 'SUBSCRIPTION', 'UPDATE', `Updated subscription "${updates.name || old?.name || 'Subscription'}"`, {
          entityId: id,
          entityName: updates.name || old?.name,
          details: diffs,
        }),
      };
    });
  }, []);

  const deleteSubscription = useCallback((id: string, softDelete = true) => {
    setState(prev => {
      const target = prev.subscriptions.find(s => s.id === id);
      if (!target) return prev;

      if (softDelete) {
        showUndo(`Subscription "${target.name}" moved to Trash`, () => {
          restoreSubscription(id);
        });
        return {
          ...prev,
          subscriptions: prev.subscriptions.map(s =>
            s.id === id ? { ...s, isDeleted: true, deletedAt: Date.now() } : s
          ),
          activityLogs: appendActivityLog(prev.activityLogs, 'SUBSCRIPTION', 'DELETE', `Moved subscription "${target.name}" to Trash`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      } else {
        return {
          ...prev,
          subscriptions: prev.subscriptions.filter(s => s.id !== id),
          activityLogs: appendActivityLog(prev.activityLogs, 'SUBSCRIPTION', 'PURGE', `Permanently deleted subscription "${target.name}"`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      }
    });
  }, [showUndo]);

  const restoreSubscription = useCallback((id: string) => {
    setState(prev => {
      const target = prev.subscriptions.find(s => s.id === id);
      return {
        ...prev,
        subscriptions: prev.subscriptions.map(s =>
          s.id === id ? { ...s, isDeleted: false, deletedAt: undefined } : s
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'SUBSCRIPTION', 'RESTORE', `Restored subscription "${target?.name || 'Subscription'}" from Trash`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const permanentlyDeleteSubscription = useCallback((id: string) => {
    setState(prev => {
      const target = prev.subscriptions.find(s => s.id === id);
      return {
        ...prev,
        subscriptions: prev.subscriptions.filter(s => s.id !== id),
        activityLogs: appendActivityLog(prev.activityLogs, 'SUBSCRIPTION', 'PURGE', `Permanently removed subscription "${target?.name || 'Subscription'}"`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  // ----------------------------------------------------
  // RECURRING PAYMENTS & BILLS
  // ----------------------------------------------------
  const addRecurring = useCallback((rec: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const id = 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newRec: RecurringTransaction = {
      ...rec,
      id,
      interval: rec.interval || 1,
      autoRecord: rec.autoRecord !== false,
      isActive: rec.isActive !== false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      recurring: [...(prev.recurring || []), newRec],
      activityLogs: appendActivityLog(prev.activityLogs, 'RECURRING', 'CREATE', `Added recurring bill "${newRec.name}" (${formatINR(newRec.amount)} / ${newRec.frequency.toLowerCase()})`, {
        entityId: id,
        entityName: newRec.name,
      }),
    }));
    return id;
  }, []);

  const updateRecurring = useCallback((id: string, updates: Partial<RecurringTransaction>) => {
    setState(prev => {
      const old = (prev.recurring || []).find(r => r.id === id);
      const diffs = old ? computeFieldDiffs(old, updates) : [];
      return {
        ...prev,
        recurring: (prev.recurring || []).map(r =>
          r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'RECURRING', 'UPDATE', `Updated recurring rule "${updates.name || old?.name || 'Recurring'}"`, {
          entityId: id,
          entityName: updates.name || old?.name,
          details: diffs,
        }),
      };
    });
  }, []);

  const deleteRecurring = useCallback((id: string, softDelete = true) => {
    setState(prev => {
      const target = (prev.recurring || []).find(r => r.id === id);
      if (!target) return prev;

      if (softDelete) {
        showUndo(`Recurring rule "${target.name}" moved to Trash`, () => {
          setState(p => ({
            ...p,
            recurring: (p.recurring || []).map(r =>
              r.id === id ? { ...r, isDeleted: false, deletedAt: undefined } : r
            ),
          }));
        });
        return {
          ...prev,
          recurring: (prev.recurring || []).map(r =>
            r.id === id ? { ...r, isDeleted: true, deletedAt: Date.now() } : r
          ),
          activityLogs: appendActivityLog(prev.activityLogs, 'RECURRING', 'DELETE', `Moved recurring rule "${target.name}" to Trash`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      } else {
        return {
          ...prev,
          recurring: (prev.recurring || []).filter(r => r.id !== id),
          activityLogs: appendActivityLog(prev.activityLogs, 'RECURRING', 'PURGE', `Permanently deleted recurring rule "${target.name}"`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      }
    });
  }, [showUndo]);

  const restoreRecurring = useCallback((id: string) => {
    setState(prev => {
      const target = (prev.recurring || []).find(r => r.id === id);
      return {
        ...prev,
        recurring: (prev.recurring || []).map(r =>
          r.id === id ? { ...r, isDeleted: false, deletedAt: undefined } : r
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'RECURRING', 'RESTORE', `Restored recurring rule "${target?.name || 'Rule'}" from Trash`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const permanentlyDeleteRecurring = useCallback((id: string) => {
    setState(prev => {
      const target = (prev.recurring || []).find(r => r.id === id);
      return {
        ...prev,
        recurring: (prev.recurring || []).filter(r => r.id !== id),
        activityLogs: appendActivityLog(prev.activityLogs, 'RECURRING', 'PURGE', `Permanently deleted recurring rule "${target?.name || 'Rule'}"`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const toggleRecurringActive = useCallback((id: string) => {
    setState(prev => {
      const target = (prev.recurring || []).find(r => r.id === id);
      const nextActive = !target?.isActive;
      return {
        ...prev,
        recurring: (prev.recurring || []).map(r =>
          r.id === id ? { ...r, isActive: nextActive, updatedAt: Date.now() } : r
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'RECURRING', 'UPDATE', `${nextActive ? 'Enabled' : 'Paused'} recurring rule "${target?.name || 'Rule'}"`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const processDuePayments = useCallback((customDate?: string): ProcessRecurringResult => {
    const targetDate = customDate || new Date().toISOString().substring(0, 10);
    const result = processAllDueRecurring(
      state.recurring || [],
      state.subscriptions || [],
      state.transactions || [],
      targetDate
    );

    if (result.newTransactions.length > 0) {
      setState(prev => ({
        ...prev,
        recurring: result.updatedRecurring,
        subscriptions: result.updatedSubscriptions,
        transactions: [...result.newTransactions, ...prev.transactions],
        activityLogs: appendActivityLog(prev.activityLogs, 'SYSTEM', 'CREATE', `Auto-processed ${result.newTransactions.length} due recurring transaction(s)`),
      }));
    }

    return result;
  }, [state.recurring, state.subscriptions, state.transactions]);

  const triggerManualRecurringExecution = useCallback((recurringOrSubId: string): string => {
    const rule = (state.recurring || []).find(r => r.id === recurringOrSubId);
    const sub = (state.subscriptions || []).find(s => s.id === recurringOrSubId);
    
    if (!rule && !sub) return '';

    const todayStr = new Date().toISOString().substring(0, 10);
    const dateParts = todayStr.split('-');
    const timestamp = new Date(
      Number(dateParts[0]),
      Number(dateParts[1]) - 1,
      Number(dateParts[2]),
      9,
      0
    ).getTime() || Date.now();

    if (rule) {
      const txId = 'tx_rec_manual_' + rule.id + '_' + Date.now();
      const newTx: Transaction = {
        id: txId,
        amount: rule.amount,
        type: rule.type,
        date: todayStr,
        time: '09:00',
        timestamp,
        categoryId: rule.categoryId,
        categoryName: rule.categoryName,
        subcategory: rule.subcategory,
        merchantName: rule.merchantName || rule.name,
        accountId: rule.accountId,
        accountName: rule.accountName,
        creditCardId: rule.creditCardId,
        creditCardName: rule.creditCardName,
        toAccountId: rule.toAccountId,
        toAccountName: rule.toAccountName,
        paymentAppId: rule.paymentAppId,
        paymentAppName: rule.paymentAppName,
        recurringId: rule.id,
        recurringName: rule.name,
        isAutoRecorded: true,
        notes: rule.notes ? `${rule.notes} (Recurring: ${rule.name})` : `Recorded recurring payment: ${rule.name}`,
        tags: Array.from(new Set([...(rule.tags || []), '#recurring'])),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const nextDueDate = calculateNextDueDate(rule.nextDueDate || todayStr, rule.frequency, rule.interval || 1);

      setState(prev => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
        recurring: (prev.recurring || []).map(r =>
          r.id === recurringOrSubId
            ? { ...r, nextDueDate, lastGeneratedDate: todayStr, updatedAt: Date.now() }
            : r
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'RECURRING', 'CREATE', `Manually executed recurring payment for "${rule.name}" (${formatINR(rule.amount)})`, {
          entityId: txId,
          entityName: rule.name,
        }),
      }));

      return txId;
    }

    if (sub) {
      const txId = 'tx_sub_manual_' + sub.id + '_' + Date.now();
      const newTx: Transaction = {
        id: txId,
        amount: sub.amount,
        type: 'EXPENSE',
        date: todayStr,
        time: '09:00',
        timestamp,
        categoryId: sub.categoryId || 'subscriptions',
        categoryName: sub.categoryName || 'Subscriptions',
        merchantName: sub.name,
        accountId: sub.accountId,
        accountName: sub.accountName,
        creditCardId: sub.creditCardId,
        creditCardName: sub.creditCardName,
        paymentAppId: sub.paymentAppId,
        paymentAppName: sub.paymentAppName,
        isAutoRecorded: true,
        notes: sub.notes ? `${sub.notes} (Subscription: ${sub.name})` : `Recorded subscription payment: ${sub.name}`,
        tags: ['#subscription', '#recurring'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const nextBillingDate = calculateNextDueDate(sub.nextBillingDate || todayStr, sub.frequency, 1);

      setState(prev => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
        subscriptions: (prev.subscriptions || []).map(s =>
          s.id === recurringOrSubId
            ? { ...s, nextBillingDate, lastGeneratedDate: todayStr }
            : s
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'SUBSCRIPTION', 'CREATE', `Manually executed subscription payment for "${sub.name}" (${formatINR(sub.amount)})`, {
          entityId: txId,
          entityName: sub.name,
        }),
      }));

      return txId;
    }

    return '';
  }, [state.recurring, state.subscriptions]);

  // Automatic recurring payments processor on startup / mount
  useEffect(() => {
    if (!state.recurring && !state.subscriptions) return;

    const todayStr = new Date().toISOString().substring(0, 10);
    const result = processAllDueRecurring(
      state.recurring || [],
      state.subscriptions || [],
      state.transactions || [],
      todayStr
    );

    if (result.newTransactions.length > 0) {
      setState(prev => ({
        ...prev,
        recurring: result.updatedRecurring,
        subscriptions: result.updatedSubscriptions,
        transactions: [...result.newTransactions, ...prev.transactions],
      }));

      const summaryText = result.generatedSummary
        .slice(0, 2)
        .map(s => `${s.name} (₹${s.amount.toLocaleString('en-IN')})`)
        .join(', ');
      const extraCount = result.generatedSummary.length - 2;
      const extraText = extraCount > 0 ? ` +${extraCount} more` : '';

      showUndo(
        `Auto-recorded ${result.newTransactions.length} recurring payment${result.newTransactions.length > 1 ? 's' : ''}: ${summaryText}${extraText}`,
        () => {
          const newTxIds = new Set(result.newTransactions.map(t => t.id));
          setState(prev => ({
            ...prev,
            transactions: prev.transactions.filter(t => !newTxIds.has(t.id)),
          }));
        }
      );
    }
  }, []); // Run once on initial load/mount

  // ----------------------------------------------------
  // GOALS & SAVINGS TARGETS
  // ----------------------------------------------------
  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'allocations'>): string => {
    const id = 'goal_' + Date.now();
    const newGoal: Goal = {
      ...goal,
      id,
      allocations: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      goals: [...(prev.goals || []), newGoal],
      activityLogs: appendActivityLog(prev.activityLogs, 'GOAL', 'CREATE', `Created savings goal "${newGoal.name}" (Target: ${formatINR(newGoal.targetAmount)})`, {
        entityId: id,
        entityName: newGoal.name,
      }),
    }));
    return id;
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setState(prev => {
      const old = (prev.goals || []).find(g => g.id === id);
      const diffs = old ? computeFieldDiffs(old, updates) : [];
      return {
        ...prev,
        goals: (prev.goals || []).map(g => (g.id === id ? { ...g, ...updates, updatedAt: Date.now() } : g)),
        activityLogs: appendActivityLog(prev.activityLogs, 'GOAL', 'UPDATE', `Updated goal "${updates.name || old?.name || 'Goal'}"`, {
          entityId: id,
          entityName: updates.name || old?.name,
          details: diffs,
        }),
      };
    });
  }, []);

  const deleteGoal = useCallback((id: string, softDelete = true) => {
    setState(prev => {
      const target = (prev.goals || []).find(g => g.id === id);
      if (!target) return prev;

      if (softDelete) {
        showUndo(`Goal "${target.name}" moved to Trash`, () => {
          restoreGoal(id);
        });
        return {
          ...prev,
          goals: (prev.goals || []).map(g =>
            g.id === id ? { ...g, isDeleted: true, deletedAt: Date.now() } : g
          ),
          activityLogs: appendActivityLog(prev.activityLogs, 'GOAL', 'DELETE', `Moved goal "${target.name}" to Trash`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      } else {
        return {
          ...prev,
          goals: (prev.goals || []).filter(g => g.id !== id),
          activityLogs: appendActivityLog(prev.activityLogs, 'GOAL', 'PURGE', `Permanently deleted goal "${target.name}"`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      }
    });
  }, [showUndo]);

  const restoreGoal = useCallback((id: string) => {
    setState(prev => {
      const target = (prev.goals || []).find(g => g.id === id);
      return {
        ...prev,
        goals: (prev.goals || []).map(g =>
          g.id === id ? { ...g, isDeleted: false, deletedAt: undefined } : g
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'GOAL', 'RESTORE', `Restored goal "${target?.name || 'Goal'}" from Trash`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const permanentlyDeleteGoal = useCallback((id: string) => {
    setState(prev => {
      const target = (prev.goals || []).find(g => g.id === id);
      return {
        ...prev,
        goals: (prev.goals || []).filter(g => g.id !== id),
        activityLogs: appendActivityLog(prev.activityLogs, 'GOAL', 'PURGE', `Permanently deleted goal "${target?.name || 'Goal'}"`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const reorderGoals = useCallback((orderedIds: string[]) => {
    setState(prev => {
      const orderMap = new Map<string, number>();
      orderedIds.forEach((id, idx) => orderMap.set(id, idx));

      const sorted = [...(prev.goals || [])].sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
        return orderA - orderB;
      }).map((goal, index) => ({
        ...goal,
        order: index + 1,
        updatedAt: Date.now(),
      }));

      return {
        ...prev,
        goals: sorted,
        activityLogs: appendActivityLog(prev.activityLogs, 'GOAL', 'UPDATE', `Rearranged ${sorted.length} savings goals order`),
      };
    });
  }, []);

  const allocateToGoal = useCallback((goalId: string, amount: number, type: 'DEPOSIT' | 'WITHDRAW', accountId?: string, notes?: string) => {
    const goal = (state.goals || []).find(g => g.id === goalId);
    if (!goal || amount <= 0) return;

    const acc = state.accounts.find(a => a.id === accountId);
    const now = new Date();
    const date = now.toISOString().substring(0, 10);
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newAllocation: GoalAllocation = {
      id: 'alloc_' + Date.now(),
      amount,
      date,
      type,
      notes: notes || (type === 'DEPOSIT' ? `Deposit to goal: ${goal.name}` : `Withdrawal from goal: ${goal.name}`),
      accountId,
      accountName: acc?.name,
      timestamp: Date.now(),
    };

    if (accountId) {
      if (type === 'DEPOSIT') {
        addTransaction({
          amount,
          type: 'EXPENSE',
          date,
          time,
          accountId,
          accountName: acc?.name || 'Bank',
          categoryId: 'savings_investment',
          categoryName: 'Savings & Investments',
          goalId,
          notes: `Goal Deposit: ${goal.name}${notes ? ` (${notes})` : ''}`,
        });
      } else {
        addTransaction({
          amount,
          type: 'INCOME',
          date,
          time,
          accountId,
          accountName: acc?.name || 'Bank',
          categoryId: 'other_income',
          categoryName: 'Goal Withdrawal',
          goalId,
          notes: `Goal Fund Withdrawn: ${goal.name}${notes ? ` (${notes})` : ''}`,
        });
      }
    }

    setState(prev => {
      const target = (prev.goals || []).find(g => g.id === goalId);
      if (!target) return prev;
      const newCurrent = type === 'DEPOSIT' ? target.currentAmount + amount : Math.max(0, target.currentAmount - amount);
      const isCompleted = newCurrent >= target.targetAmount;

      return {
        ...prev,
        goals: (prev.goals || []).map(g =>
          g.id === goalId
            ? {
                ...g,
                currentAmount: newCurrent,
                status: isCompleted ? 'COMPLETED' : g.status === 'COMPLETED' ? 'IN_PROGRESS' : g.status,
                allocations: [newAllocation, ...(g.allocations || [])],
                updatedAt: Date.now(),
              }
            : g
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'GOAL', 'ALLOCATE', `${type === 'DEPOSIT' ? 'Added' : 'Withdrew'} ${formatINR(amount)} ${type === 'DEPOSIT' ? 'to' : 'from'} goal "${goal.name}"`, {
          entityId: goalId,
          entityName: goal.name,
        }),
      };
    });
  }, [state.goals, state.accounts, addTransaction]);

  // ----------------------------------------------------
  // LOANS & EMI
  // ----------------------------------------------------
  const addLoan = useCallback((loan: Omit<Loan, 'id' | 'createdAt' | 'outstandingPrincipal'>): string => {
    const id = 'loan_' + Date.now();
    const newLoan: Loan = {
      ...loan,
      id,
      outstandingPrincipal: loan.principalAmount,
      createdAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      loans: [...prev.loans, newLoan],
      activityLogs: appendActivityLog(prev.activityLogs, 'LOAN', 'CREATE', `Added loan account "${newLoan.name}" (${formatINR(newLoan.principalAmount)})`, {
        entityId: id,
        entityName: newLoan.name,
      }),
    }));
    return id;
  }, []);

  const updateLoan = useCallback((id: string, updates: Partial<Loan>) => {
    setState(prev => {
      const old = prev.loans.find(l => l.id === id);
      const diffs = old ? computeFieldDiffs(old, updates) : [];
      return {
        ...prev,
        loans: prev.loans.map(l => (l.id === id ? { ...l, ...updates } : l)),
        activityLogs: appendActivityLog(prev.activityLogs, 'LOAN', 'UPDATE', `Updated loan "${updates.name || old?.name || 'Loan'}"`, {
          entityId: id,
          entityName: updates.name || old?.name,
          details: diffs,
        }),
      };
    });
  }, []);

  const deleteLoan = useCallback((id: string, softDelete = true) => {
    setState(prev => {
      const target = (prev.loans || []).find(l => l.id === id);
      if (!target) return prev;

      if (softDelete) {
        showUndo(`Loan "${target.name}" moved to Trash`, () => {
          restoreLoan(id);
        });
        return {
          ...prev,
          loans: (prev.loans || []).map(l =>
            l.id === id ? { ...l, isDeleted: true, deletedAt: Date.now() } : l
          ),
          activityLogs: appendActivityLog(prev.activityLogs, 'LOAN', 'DELETE', `Moved loan "${target.name}" to Trash`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      } else {
        return {
          ...prev,
          loans: (prev.loans || []).filter(l => l.id !== id),
          activityLogs: appendActivityLog(prev.activityLogs, 'LOAN', 'PURGE', `Permanently deleted loan "${target.name}"`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      }
    });
  }, [showUndo]);

  const restoreLoan = useCallback((id: string) => {
    setState(prev => {
      const target = (prev.loans || []).find(l => l.id === id);
      return {
        ...prev,
        loans: (prev.loans || []).map(l =>
          l.id === id ? { ...l, isDeleted: false, deletedAt: undefined } : l
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'LOAN', 'RESTORE', `Restored loan "${target?.name || 'Loan'}" from Trash`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const permanentlyDeleteLoan = useCallback((id: string) => {
    setState(prev => {
      const target = (prev.loans || []).find(l => l.id === id);
      return {
        ...prev,
        loans: (prev.loans || []).filter(l => l.id !== id),
        activityLogs: appendActivityLog(prev.activityLogs, 'LOAN', 'PURGE', `Permanently deleted loan "${target?.name || 'Loan'}"`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const payLoanEMI = useCallback((loanId: string, fromAccountId: string, totalAmount: number, principalPortion: number, interestPortion: number) => {
    const loan = state.loans.find(l => l.id === loanId);
    const bank = state.accounts.find(a => a.id === fromAccountId);
    const now = new Date();
    const date = now.toISOString().substring(0, 10);
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    addTransaction({
      amount: totalAmount,
      type: 'LOAN_REPAYMENT',
      date,
      time,
      accountId: fromAccountId,
      accountName: bank?.name || 'Bank',
      loanId,
      loanPrincipalPortion: principalPortion,
      loanInterestPortion: interestPortion,
      categoryId: 'loans_emi',
      categoryName: 'Loans & EMI',
      notes: `EMI Repayment for ${loan?.name || 'Loan'} (Principal: ₹${principalPortion}, Interest: ₹${interestPortion})`,
    });
  }, [state.loans, state.accounts, addTransaction]);

  // ----------------------------------------------------
  // INVESTMENTS
  // ----------------------------------------------------
  const addInvestment = useCallback((inv: Omit<Investment, 'id' | 'updatedAt'>): string => {
    const id = 'inv_' + Date.now();
    const newInv: Investment = { ...inv, id, updatedAt: Date.now() };
    setState(prev => ({
      ...prev,
      investments: [...prev.investments, newInv],
      activityLogs: appendActivityLog(prev.activityLogs, 'INVESTMENT', 'CREATE', `Added investment "${newInv.name}" (Value: ${formatINR(newInv.currentValue)})`, {
        entityId: id,
        entityName: newInv.name,
      }),
    }));
    return id;
  }, []);

  const updateInvestment = useCallback((id: string, updates: Partial<Investment>) => {
    setState(prev => {
      const old = prev.investments.find(i => i.id === id);
      const diffs = old ? computeFieldDiffs(old, updates) : [];
      return {
        ...prev,
        investments: prev.investments.map(i => (i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i)),
        activityLogs: appendActivityLog(prev.activityLogs, 'INVESTMENT', 'UPDATE', `Updated investment "${updates.name || old?.name || 'Investment'}"`, {
          entityId: id,
          entityName: updates.name || old?.name,
          details: diffs,
        }),
      };
    });
  }, []);

  const deleteInvestment = useCallback((id: string, softDelete = true) => {
    setState(prev => {
      const target = (prev.investments || []).find(i => i.id === id);
      if (!target) return prev;

      if (softDelete) {
        showUndo(`Investment "${target.name}" moved to Trash`, () => {
          restoreInvestment(id);
        });
        return {
          ...prev,
          investments: (prev.investments || []).map(i =>
            i.id === id ? { ...i, isDeleted: true, deletedAt: Date.now() } : i
          ),
          activityLogs: appendActivityLog(prev.activityLogs, 'INVESTMENT', 'DELETE', `Moved investment "${target.name}" to Trash`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      } else {
        return {
          ...prev,
          investments: (prev.investments || []).filter(i => i.id !== id),
          activityLogs: appendActivityLog(prev.activityLogs, 'INVESTMENT', 'PURGE', `Permanently deleted investment "${target.name}"`, {
            entityId: id,
            entityName: target.name,
          }),
        };
      }
    });
  }, [showUndo]);

  const restoreInvestment = useCallback((id: string) => {
    setState(prev => {
      const target = (prev.investments || []).find(i => i.id === id);
      return {
        ...prev,
        investments: (prev.investments || []).map(i =>
          i.id === id ? { ...i, isDeleted: false, deletedAt: undefined } : i
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'INVESTMENT', 'RESTORE', `Restored investment "${target?.name || 'Investment'}" from Trash`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const permanentlyDeleteInvestment = useCallback((id: string) => {
    setState(prev => {
      const target = (prev.investments || []).find(i => i.id === id);
      return {
        ...prev,
        investments: (prev.investments || []).filter(i => i.id !== id),
        activityLogs: appendActivityLog(prev.activityLogs, 'INVESTMENT', 'PURGE', `Permanently deleted investment "${target?.name || 'Investment'}"`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const reorderInvestments = useCallback((orderedIds: string[]) => {
    setState(prev => {
      const orderMap = new Map<string, number>();
      orderedIds.forEach((id, idx) => orderMap.set(id, idx));

      const sorted = [...prev.investments].sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
        return orderA - orderB;
      }).map((inv, index) => ({
        ...inv,
        order: index + 1,
        updatedAt: Date.now(),
      }));

      return {
        ...prev,
        investments: sorted,
        activityLogs: appendActivityLog(prev.activityLogs, 'INVESTMENT', 'UPDATE', `Rearranged ${sorted.length} investments portfolio order`),
      };
    });
  }, []);

  // ----------------------------------------------------
  // DEBTS (LENT & BORROWED)
  // ----------------------------------------------------
  const addDebt = useCallback((debt: Omit<DebtRecord, 'id' | 'createdAt' | 'isSettled' | 'remainingAmount'>): string => {
    const id = 'debt_' + Date.now();
    const newDebt: DebtRecord = {
      ...debt,
      id,
      remainingAmount: debt.amount,
      isSettled: false,
      createdAt: Date.now(),
    };
    const actionDesc = newDebt.type === 'LENT' ? `Lent money to ${newDebt.personName}` : `Borrowed money from ${newDebt.personName}`;
    setState(prev => ({
      ...prev,
      debts: [...prev.debts, newDebt],
      activityLogs: appendActivityLog(prev.activityLogs, 'DEBT', 'CREATE', `${actionDesc} (${formatINR(newDebt.amount)})`, {
        entityId: id,
        entityName: newDebt.personName,
      }),
    }));
    return id;
  }, []);

  const settleDebt = useCallback((debtId: string, settleAccountId?: string, paymentAppId?: string) => {
    const debt = state.debts.find(d => d.id === debtId);
    if (!debt) return;

    const acc = state.accounts.find(a => a.id === settleAccountId);
    const now = new Date();
    const date = now.toISOString().substring(0, 10);
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (settleAccountId) {
      if (debt.type === 'LENT') {
        addTransaction({
          amount: debt.remainingAmount,
          type: 'MONEY_LENT_REPAYMENT',
          date,
          time,
          accountId: settleAccountId,
          accountName: acc?.name || 'Account',
          paymentAppId,
          debtPersonName: debt.personName,
          notes: `Settled lent money from ${debt.personName}`,
        });
      } else {
        addTransaction({
          amount: debt.remainingAmount,
          type: 'MONEY_BORROWED_REPAYMENT',
          date,
          time,
          accountId: settleAccountId,
          accountName: acc?.name || 'Account',
          paymentAppId,
          debtPersonName: debt.personName,
          notes: `Repaid borrowed money to ${debt.personName}`,
        });
      }
    }

    setState(prev => ({
      ...prev,
      debts: prev.debts.map(d =>
        d.id === debtId ? { ...d, remainingAmount: 0, isSettled: true } : d
      ),
      activityLogs: appendActivityLog(prev.activityLogs, 'DEBT', 'SETTLE', `Settled debt with ${debt.personName} (${formatINR(debt.remainingAmount)})`, {
        entityId: debtId,
        entityName: debt.personName,
      }),
    }));
  }, [state.debts, state.accounts, addTransaction]);

  const deleteDebt = useCallback((id: string, softDelete = true) => {
    setState(prev => {
      const target = (prev.debts || []).find(d => d.id === id);
      if (!target) return prev;

      if (softDelete) {
        showUndo(`Debt record for "${target.personName}" moved to Trash`, () => {
          restoreDebt(id);
        });
        return {
          ...prev,
          debts: (prev.debts || []).map(d =>
            d.id === id ? { ...d, isDeleted: true, deletedAt: Date.now() } : d
          ),
          activityLogs: appendActivityLog(prev.activityLogs, 'DEBT', 'DELETE', `Moved debt record for "${target.personName}" to Trash`, {
            entityId: id,
            entityName: target.personName,
          }),
        };
      } else {
        return {
          ...prev,
          debts: (prev.debts || []).filter(d => d.id !== id),
          activityLogs: appendActivityLog(prev.activityLogs, 'DEBT', 'PURGE', `Permanently deleted debt record for "${target.personName}"`, {
            entityId: id,
            entityName: target.personName,
          }),
        };
      }
    });
  }, [showUndo]);

  const restoreDebt = useCallback((id: string) => {
    setState(prev => {
      const target = (prev.debts || []).find(d => d.id === id);
      return {
        ...prev,
        debts: (prev.debts || []).map(d =>
          d.id === id ? { ...d, isDeleted: false, deletedAt: undefined } : d
        ),
        activityLogs: appendActivityLog(prev.activityLogs, 'DEBT', 'RESTORE', `Restored debt record for "${target?.personName || 'Person'}" from Trash`, {
          entityId: id,
          entityName: target?.personName,
        }),
      };
    });
  }, []);

  const permanentlyDeleteDebt = useCallback((id: string) => {
    setState(prev => {
      const target = (prev.debts || []).find(d => d.id === id);
      return {
        ...prev,
        debts: (prev.debts || []).filter(d => d.id !== id),
        activityLogs: appendActivityLog(prev.activityLogs, 'DEBT', 'PURGE', `Permanently deleted debt record for "${target?.personName || 'Person'}"`, {
          entityId: id,
          entityName: target?.personName,
        }),
      };
    });
  }, []);

  // ----------------------------------------------------
  // ACCOUNT RECONCILIATION
  // ----------------------------------------------------
  const reconcileAccount = useCallback((accountId: string, statementBalance: number, notes?: string, autoAdjust = false) => {
    const acc = computedAccounts.find(a => a.id === accountId);
    if (!acc) return;

    const diff = statementBalance - acc.calculatedBalance;
    const recId = 'rec_' + Date.now();

    let adjustmentTxId: string | undefined;

    if (autoAdjust && Math.abs(diff) > 0.01) {
      const now = new Date();
      const date = now.toISOString().substring(0, 10);
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      adjustmentTxId = addTransaction({
        amount: Math.abs(diff),
        type: diff > 0 ? 'ADJUSTMENT' : 'EXPENSE',
        date,
        time,
        accountId,
        accountName: acc.name,
        categoryId: 'misc_expense',
        categoryName: 'Reconciliation Adjustment',
        notes: `Balance adjustment of ₹${diff.toLocaleString('en-IN')}: ${notes || 'Reconciliation discrepancy'}`,
      });
    }

    const newRec: AccountReconciliation = {
      id: recId,
      accountId,
      accountName: acc.name,
      reconciliationDate: new Date().toISOString().substring(0, 10),
      statementBalance,
      calculatedBalance: acc.calculatedBalance,
      difference: diff,
      status: Math.abs(diff) < 0.01 ? 'BALANCED' : autoAdjust ? 'ADJUSTED' : 'DISCREPANCY',
      adjustmentTransactionId: adjustmentTxId,
      notes,
      createdAt: Date.now(),
    };

    setState(prev => ({
      ...prev,
      reconciliations: [newRec, ...prev.reconciliations],
      activityLogs: appendActivityLog(prev.activityLogs, 'RECONCILIATION', 'RECONCILE', `Reconciled "${acc.name}" (Statement: ${formatINR(statementBalance)}, Diff: ${formatINR(diff)})`, {
        entityId: recId,
        entityName: acc.name,
      }),
    }));
  }, [computedAccounts, addTransaction]);

  // ----------------------------------------------------
  // CATEGORIES & PAYMENT APPS
  // ----------------------------------------------------
  const addCategory = useCallback((cat: Omit<Category, 'id'>): string => {
    const id = 'cat_' + Date.now();
    const newCat: Category = { ...cat, id, isCustom: true, order: state.categories.length + 1 };
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, newCat],
      activityLogs: appendActivityLog(prev.activityLogs, 'CATEGORY', 'CREATE', `Created category "${newCat.name}"`, {
        entityId: id,
        entityName: newCat.name,
      }),
    }));
    return id;
  }, [state.categories.length]);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setState(prev => {
      const old = prev.categories.find(c => c.id === id);
      const diffs = old ? computeFieldDiffs(old, updates) : [];
      return {
        ...prev,
        categories: prev.categories.map(c => (c.id === id ? { ...c, ...updates } : c)),
        activityLogs: appendActivityLog(prev.activityLogs, 'CATEGORY', 'UPDATE', `Updated category "${updates.name || old?.name || 'Category'}"`, {
          entityId: id,
          entityName: updates.name || old?.name,
          details: diffs,
        }),
      };
    });
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState(prev => {
      const target = prev.categories.find(c => c.id === id);
      return {
        ...prev,
        categories: prev.categories.filter(c => c.id !== id),
        activityLogs: appendActivityLog(prev.activityLogs, 'CATEGORY', 'DELETE', `Deleted category "${target?.name || 'Category'}"`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const reorderCategories = useCallback((orderedIds: string[]) => {
    setState(prev => {
      const orderMap = new Map<string, number>();
      orderedIds.forEach((id, idx) => orderMap.set(id, idx));

      const sorted = [...prev.categories].sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
        return orderA - orderB;
      }).map((cat, index) => ({
        ...cat,
        order: index + 1,
      }));

      return {
        ...prev,
        categories: sorted,
        activityLogs: appendActivityLog(prev.activityLogs, 'CATEGORY', 'UPDATE', `Rearranged ${sorted.length} categories order`),
      };
    });
  }, []);

  const addPaymentApp = useCallback((app: Omit<PaymentApp, 'id'>): string => {
    const id = 'papp_' + Date.now();
    const newApp: PaymentApp = { ...app, id, isCustom: true };
    setState(prev => ({
      ...prev,
      paymentApps: [...prev.paymentApps, newApp],
      activityLogs: appendActivityLog(prev.activityLogs, 'PAYMENT_APP', 'CREATE', `Added payment app "${newApp.name}"`, {
        entityId: id,
        entityName: newApp.name,
      }),
    }));
    return id;
  }, []);

  const updatePaymentApp = useCallback((id: string, updates: Partial<PaymentApp>) => {
    setState(prev => {
      const old = prev.paymentApps.find(p => p.id === id);
      const diffs = old ? computeFieldDiffs(old, updates) : [];
      return {
        ...prev,
        paymentApps: prev.paymentApps.map(p => (p.id === id ? { ...p, ...updates } : p)),
        activityLogs: appendActivityLog(prev.activityLogs, 'PAYMENT_APP', 'UPDATE', `Updated payment app "${updates.name || old?.name || 'App'}"`, {
          entityId: id,
          entityName: updates.name || old?.name,
          details: diffs,
        }),
      };
    });
  }, []);

  const deletePaymentApp = useCallback((id: string) => {
    setState(prev => {
      const target = prev.paymentApps.find(p => p.id === id);
      return {
        ...prev,
        paymentApps: prev.paymentApps.filter(p => p.id !== id),
        activityLogs: appendActivityLog(prev.activityLogs, 'PAYMENT_APP', 'DELETE', `Removed payment app "${target?.name || 'App'}"`, {
          entityId: id,
          entityName: target?.name,
        }),
      };
    });
  }, []);

  const reorderPaymentApps = useCallback((orderedIds: string[]) => {
    setState(prev => {
      const orderMap = new Map<string, number>();
      orderedIds.forEach((id, idx) => orderMap.set(id, idx));

      const sorted = [...prev.paymentApps].sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
        return orderA - orderB;
      }).map((app, index) => ({
        ...app,
        order: index + 1,
      }));

      return {
        ...prev,
        paymentApps: sorted,
        activityLogs: appendActivityLog(prev.activityLogs, 'PAYMENT_APP', 'UPDATE', `Rearranged ${sorted.length} payment apps order`),
      };
    });
  }, []);

  // ----------------------------------------------------
  // SETTINGS & LOGGING HOOKS
  // ----------------------------------------------------
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setState(prev => {
      const diffs = computeFieldDiffs(prev.settings, updates, {
        currency: 'Base Currency',
        theme: 'App Appearance Theme',
        isPinEnabled: 'Security PIN Lock',
        isBiometricsEnabled: 'Biometrics / Face Unlock',
        notificationHour: 'Daily Notification Hour',
        privacyMode: 'Privacy / Obscure Balances Mode',
        userName: 'Profile Name',
        defaultAccount: 'Default Payment Account',
        monthlyBudgetLimit: 'Global Monthly Limit',
      });

      const changedLabels = diffs.map(d => d.label).join(', ');
      const summaryText = diffs.length > 0 ? `Updated settings (${changedLabels})` : 'Updated application preferences';

      return {
        ...prev,
        settings: { ...prev.settings, ...updates },
        activityLogs: appendActivityLog(prev.activityLogs, 'SETTINGS', 'UPDATE', summaryText, {
          entityName: 'AppSettings',
          details: diffs,
        }),
      };
    });
  }, []);

  const logActivity = useCallback((
    domain: ActivityDomain,
    action: ActivityActionType,
    summaryText: string,
    options?: {
      entityId?: string;
      entityName?: string;
      details?: ActivityChangeDetail[];
      metadata?: Record<string, any>;
    }
  ) => {
    setState(prev => ({
      ...prev,
      activityLogs: appendActivityLog(prev.activityLogs, domain, action, summaryText, options),
    }));
  }, []);

  const clearActivityLogs = useCallback(() => {
    setState(prev => ({
      ...prev,
      activityLogs: [],
    }));
  }, []);

  const exportActivityLogs = useCallback((format: 'csv' | 'json') => {
    if (format === 'csv') {
      exportActivityLogsCsv(state.activityLogs || []);
    } else {
      exportActivityLogsJson(state.activityLogs || []);
    }
  }, [state.activityLogs]);

  const resetToDemoData = useCallback(() => {
    const demo = getDemoData();
    const newState: LocalStorageState = {
      accounts: demo.accounts,
      creditCards: demo.creditCards,
      categories: DEFAULT_CATEGORIES,
      merchants: demo.merchants,
      paymentApps: DEFAULT_PAYMENT_APPS,
      transactions: demo.transactions,
      recurring: demo.recurring,
      subscriptions: demo.subscriptions,
      budgets: demo.budgets,
      goals: demo.goals || [],
      loans: demo.loans,
      investments: demo.investments,
      debts: demo.debts,
      reconciliations: [],
      settings: DEFAULT_APP_SETTINGS,
      activityLogs: [
        createActivityEntry('SYSTEM', 'RESET', 'Restored complete initial demo datasets'),
      ],
    };
    setState(newState);
  }, []);

  const clearAllData = useCallback(() => {
    setState(prev => {
      const trashedTransactions = prev.transactions.map(t => 
        t.isDeleted ? t : { ...t, isDeleted: true, deletedAt: Date.now() }
      );
      return {
        accounts: [],
        creditCards: [],
        categories: DEFAULT_CATEGORIES,
        merchants: [],
        paymentApps: DEFAULT_PAYMENT_APPS,
        transactions: trashedTransactions,
        recurring: [],
        subscriptions: [],
        budgets: [],
        goals: [],
        loans: [],
        investments: [],
        debts: [],
        reconciliations: [],
        settings: { ...DEFAULT_APP_SETTINGS, userName: prev.settings.userName || 'User' },
        activityLogs: appendActivityLog(prev.activityLogs, 'SYSTEM', 'RESET', `Purged all user records and moved ${prev.transactions.length} transactions to Trash`),
      };
    });
  }, []);

  const clearTransactionsData = useCallback(() => {
    setState(prev => {
      const trashedTransactions = prev.transactions.map(t => 
        t.isDeleted ? t : { ...t, isDeleted: true, deletedAt: Date.now() }
      );
      return {
        ...prev,
        transactions: trashedTransactions,
        recurring: [],
        reconciliations: [],
        activityLogs: appendActivityLog(prev.activityLogs, 'TRANSACTION', 'DELETE', `Moved all transactions to Trash`),
      };
    });
  }, []);

  const loadBackupState = useCallback((restored: LocalStorageState) => {
    const newLogs = appendActivityLog(restored.activityLogs, 'SYSTEM', 'IMPORT', `Imported backup dataset (${restored.transactions?.length || 0} transactions)`);
    setState({ ...restored, activityLogs: newLogs });
  }, []);

  return (
    <MoneyContext.Provider
      value={{
        accounts: computedAccounts,
        creditCards: computedCards,
        categories: state.categories,
        merchants: state.merchants,
        paymentApps: state.paymentApps,
        transactions: state.transactions,
        templates: state.templates || [],
        recurring: (state.recurring || []).filter(r => !r.isDeleted),
        subscriptions: (state.subscriptions || []).filter(s => !s.isDeleted),
        budgets: (state.budgets || []).filter(b => !b.isDeleted),
        goals: (state.goals || []).filter(g => !g.isDeleted),
        loans: computedLoans,
        investments: computedInvestments,
        debts: computedDebts,
        reconciliations: state.reconciliations,
        settings: state.settings,
        activityLogs: state.activityLogs || [],
        summary,
        categorySpending,
        activeMonth,
        setActiveMonth,
        trashCount,
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
        isLocked,
        unlockApp,
        lockApp,
        undoToast,
        dismissUndoToast,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteTransactions,
        restoreTransaction,
        restoreTransactions,
        permanentlyDeleteTransaction,
        emptyTrash,
        emptyAllTrash,
        restoreAllTrash,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        toggleFavoriteTemplate,
        recordFromTemplate,
        saveTransactionAsTemplate,
        addAccount,
        updateAccount,
        deleteAccount,
        restoreAccount,
        permanentlyDeleteAccount,
        reorderAccounts,
        setAccountSortPreference,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        restoreCreditCard,
        permanentlyDeleteCreditCard,
        reorderCreditCards,
        setCardSortPreference,
        payCreditCardBill,
        convertAccountToCreditCard,
        convertCreditCardToAccount,
        addBudget,
        updateBudget,
        deleteBudget,
        restoreBudget,
        permanentlyDeleteBudget,
        reorderBudgets,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        restoreSubscription,
        permanentlyDeleteSubscription,
        addRecurring,
        updateRecurring,
        deleteRecurring,
        restoreRecurring,
        permanentlyDeleteRecurring,
        toggleRecurringActive,
        processDuePayments,
        triggerManualRecurringExecution,
        addGoal,
        updateGoal,
        deleteGoal,
        restoreGoal,
        permanentlyDeleteGoal,
        reorderGoals,
        allocateToGoal,
        addLoan,
        updateLoan,
        deleteLoan,
        restoreLoan,
        permanentlyDeleteLoan,
        payLoanEMI,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        restoreInvestment,
        permanentlyDeleteInvestment,
        reorderInvestments,
        addDebt,
        settleDebt,
        deleteDebt,
        restoreDebt,
        permanentlyDeleteDebt,
        reconcileAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        addPaymentApp,
        updatePaymentApp,
        deletePaymentApp,
        reorderPaymentApps,
        updateSettings,
        logActivity,
        clearActivityLogs,
        exportActivityLogs,
        resetToDemoData,
        clearAllData,
        clearTransactionsData,
        loadBackupState,
      }}
    >
      {children}
    </MoneyContext.Provider>
  );
};

export function useMoney(): MoneyContextType {
  const ctx = useContext(MoneyContext);
  if (!ctx) {
    throw new Error('useMoney must be used within a MoneyProvider');
  }
  return ctx;
}
