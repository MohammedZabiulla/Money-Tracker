import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  Account,
  CreditCard,
  Category,
  Merchant,
  PaymentApp,
  Transaction,
  RecurringTransaction,
  Subscription,
  Budget,
  Loan,
  Investment,
  DebtRecord,
  AccountReconciliation,
  AppSettings,
  TransactionType,
  Goal,
  GoalAllocation,
  ConvertAccountToCardOptions,
  ConvertCardToAccountOptions,
} from '../types';
import {
  loadInitialState,
  saveFullState,
  LocalStorageState,
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

interface MoneyContextType {
  // State
  accounts: Account[];
  creditCards: CreditCard[];
  categories: Category[];
  merchants: Merchant[];
  paymentApps: PaymentApp[];
  transactions: Transaction[];
  recurring: RecurringTransaction[];
  subscriptions: Subscription[];
  budgets: Budget[];
  goals: Goal[];
  loans: Loan[];
  investments: Investment[];
  debts: DebtRecord[];
  reconciliations: AccountReconciliation[];
  settings: AppSettings;
  
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
  restoreTransaction: (id: string) => void;
  permanentlyDeleteTransaction: (id: string) => void;
  emptyTrash: () => void;
  emptyAllTrash: () => void;
  restoreAllTrash: () => void;
  
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'calculatedBalance'>) => string;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string, softDelete?: boolean) => void;
  restoreAccount: (id: string) => void;
  permanentlyDeleteAccount: (id: string) => void;

  addCreditCard: (card: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt' | 'currentOutstanding'>) => string;
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string, softDelete?: boolean) => void;
  restoreCreditCard: (id: string) => void;
  permanentlyDeleteCreditCard: (id: string) => void;
  payCreditCardBill: (cardId: string, fromAccountId: string, amount: number, paymentAppId?: string) => void;
  convertAccountToCreditCard: (options: ConvertAccountToCardOptions) => string;
  convertCreditCardToAccount: (options: ConvertCardToAccountOptions) => string;

  addBudget: (budget: Omit<Budget, 'id'>) => string;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string, softDelete?: boolean) => void;
  restoreBudget: (id: string) => void;
  permanentlyDeleteBudget: (id: string) => void;

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
  allocateToGoal: (goalId: string, amount: number, type: 'DEPOSIT' | 'WITHDRAW', accountId?: string, notes?: string) => void;

  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'outstandingPrincipal'>) => string;
  updateLoan: (id: string, updates: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;
  payLoanEMI: (loanId: string, fromAccountId: string, totalAmount: number, principalPortion: number, interestPortion: number) => void;

  addInvestment: (inv: Omit<Investment, 'id' | 'updatedAt'>) => string;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;

  addDebt: (debt: Omit<DebtRecord, 'id' | 'createdAt' | 'isSettled' | 'remainingAmount'>) => string;
  settleDebt: (debtId: string, settleAccountId?: string, paymentAppId?: string) => void;
  deleteDebt: (id: string) => void;

  reconcileAccount: (accountId: string, statementBalance: number, notes?: string, autoAdjust?: boolean) => void;

  addCategory: (cat: Omit<Category, 'id'>) => string;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addPaymentApp: (app: Omit<PaymentApp, 'id'>) => string;
  updatePaymentApp: (id: string, updates: Partial<PaymentApp>) => void;
  deletePaymentApp: (id: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;

  resetToDemoData: () => void;
  clearAllData: () => void;
  loadBackupState: (state: LocalStorageState) => void;
}

const MoneyContext = createContext<MoneyContextType | undefined>(undefined);

export const MoneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, pushStateToCloud, pullStateFromCloud } = useAuth();
  const [state, setState] = useState<LocalStorageState>(() => loadInitialState());
  const [activeMonth, setActiveMonth] = useState<string>(() => new Date().toISOString().substring(0, 7));
  const [isLocked, setIsLocked] = useState<boolean>(() => !!loadInitialState().settings.isPinEnabled);
  const [undoToast, setUndoToast] = useState<{ message: string; onUndo: () => void } | null>(null);
  const [isCloudLoaded, setIsCloudLoaded] = useState<boolean>(false);

  // Sync to localStorage on mutations
  useEffect(() => {
    saveFullState(state);
  }, [state]);

  // Initial cloud state sync when user authenticates
  useEffect(() => {
    if (user && !isCloudLoaded) {
      pullStateFromCloud().then(cloudData => {
        if (cloudData && cloudData.accounts && cloudData.accounts.length > 0) {
          setState(cloudData);
        } else {
          // Push initial local dataset to new Firebase user cloud store
          pushStateToCloud(state);
        }
        setIsCloudLoaded(true);
      });
    } else if (!user) {
      setIsCloudLoaded(false);
    }
  }, [user, isCloudLoaded, pullStateFromCloud, pushStateToCloud, state]);

  // Debounced auto-sync to Firebase Firestore on state change
  useEffect(() => {
    if (!user || !isCloudLoaded) return;
    const timer = setTimeout(() => {
      pushStateToCloud(state);
    }, 2000);
    return () => clearTimeout(timer);
  }, [state, user, isCloudLoaded, pushStateToCloud]);

  // Recalculate all account & card balances dynamically based on the transaction ledger
  const {
    accounts: computedAccounts,
    cards: computedCards,
    investments: computedInvestments,
    loans: computedLoans,
    debts: computedDebts,
  } = useMemo(() => {
    return recalculateAllBalances(
      state.accounts,
      state.creditCards,
      state.investments,
      state.loans,
      state.debts,
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

  const trashCount = useMemo(() => {
    return (
      deletedTransactions.length +
      deletedAccounts.length +
      deletedCreditCards.length +
      deletedBudgets.length +
      deletedSubscriptions.length +
      deletedRecurring.length +
      deletedGoals.length
    );
  }, [deletedTransactions, deletedAccounts, deletedCreditCards, deletedBudgets, deletedSubscriptions, deletedRecurring, deletedGoals]);

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

      return {
        ...prev,
        merchants: updatedMerchants,
        transactions: [newTx, ...prev.transactions],
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
      return { ...prev, transactions: newTxList };
    });
  }, []);

  const deleteTransaction = useCallback((id: string, softDelete = true) => {
    setState(prev => {
      const target = prev.transactions.find(t => t.id === id);
      if (!target) return prev;

      if (softDelete) {
        const updatedList = prev.transactions.map(t =>
          t.id === id ? { ...t, isDeleted: true, deletedAt: Date.now() } : t
        );
        showUndo('Transaction moved to Trash', () => {
          restoreTransaction(id);
        });
        return { ...prev, transactions: updatedList };
      } else {
        return {
          ...prev,
          transactions: prev.transactions.filter(t => t.id !== id),
        };
      }
    });
  }, [showUndo]);

  const restoreTransaction = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t =>
        t.id === id ? { ...t, isDeleted: false, deletedAt: undefined } : t
      ),
    }));
  }, []);

  const permanentlyDeleteTransaction = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
    }));
  }, []);

  const emptyTrash = useCallback(() => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => !t.isDeleted),
    }));
  }, []);

  const emptyAllTrash = useCallback(() => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => !t.isDeleted),
      accounts: prev.accounts.filter(a => !a.isDeleted),
      creditCards: prev.creditCards.filter(c => !c.isDeleted),
      budgets: prev.budgets.filter(b => !b.isDeleted),
      subscriptions: prev.subscriptions.filter(s => !s.isDeleted),
    }));
  }, []);

  const restoreAllTrash = useCallback(() => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => ({ ...t, isDeleted: false, deletedAt: undefined })),
      accounts: prev.accounts.map(a => ({ ...a, isDeleted: false, deletedAt: undefined })),
      creditCards: prev.creditCards.map(c => ({ ...c, isDeleted: false, deletedAt: undefined })),
      budgets: prev.budgets.map(b => ({ ...b, isDeleted: false, deletedAt: undefined })),
      subscriptions: prev.subscriptions.map(s => ({ ...s, isDeleted: false, deletedAt: undefined })),
    }));
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
    }));
    return id;
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => (a.id === id ? { ...a, ...updates, updatedAt: Date.now() } : a)),
    }));
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
        };
      } else {
        return {
          ...prev,
          accounts: prev.accounts.filter(a => a.id !== id),
        };
      }
    });
  }, [showUndo]);

  const restoreAccount = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.map(a =>
        a.id === id ? { ...a, isDeleted: false, deletedAt: undefined } : a
      ),
    }));
  }, []);

  const permanentlyDeleteAccount = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== id),
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
    }));
    return id;
  }, []);

  const updateCreditCard = useCallback((id: string, updates: Partial<CreditCard>) => {
    setState(prev => ({
      ...prev,
      creditCards: prev.creditCards.map(c => (c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c)),
    }));
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
        };
      } else {
        return {
          ...prev,
          creditCards: prev.creditCards.filter(c => c.id !== id),
        };
      }
    });
  }, [showUndo]);

  const restoreCreditCard = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      creditCards: prev.creditCards.map(c =>
        c.id === id ? { ...c, isDeleted: false, deletedAt: undefined } : c
      ),
    }));
  }, []);

  const permanentlyDeleteCreditCard = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      creditCards: prev.creditCards.filter(c => c.id !== id),
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

          // If source account matches
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

          // If destination account matches (e.g. transfer to this bank account)
          if (t.toAccountId === options.accountId) {
            changed = true;
            // Transfer TO this bank becomes a CARD_PAYMENT to the new credit card
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
              // Payment to card becomes transfer to bank
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
        creditCards: prev.creditCards.filter(c => c.id !== options.cardId),
        accounts: [...prev.accounts, newAcc],
        transactions: updatedTransactions,
        subscriptions: updatedSubscriptions,
        recurring: updatedRecurring,
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
    setState(prev => ({ ...prev, budgets: [...prev.budgets, newBudget] }));
    return id;
  }, []);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.map(b => (b.id === id ? { ...b, ...updates } : b)),
    }));
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
        };
      } else {
        return {
          ...prev,
          budgets: prev.budgets.filter(b => b.id !== id),
        };
      }
    });
  }, [showUndo]);

  const restoreBudget = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.map(b =>
        b.id === id ? { ...b, isDeleted: false, deletedAt: undefined } : b
      ),
    }));
  }, []);

  const permanentlyDeleteBudget = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.filter(b => b.id !== id),
    }));
  }, []);

  // ----------------------------------------------------
  // SUBSCRIPTIONS
  // ----------------------------------------------------
  const addSubscription = useCallback((sub: Omit<Subscription, 'id'>): string => {
    const id = 'sub_' + Date.now();
    const newSub: Subscription = { ...sub, id };
    setState(prev => ({ ...prev, subscriptions: [...prev.subscriptions, newSub] }));
    return id;
  }, []);

  const updateSubscription = useCallback((id: string, updates: Partial<Subscription>) => {
    setState(prev => ({
      ...prev,
      subscriptions: prev.subscriptions.map(s => (s.id === id ? { ...s, ...updates } : s)),
    }));
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
        };
      } else {
        return {
          ...prev,
          subscriptions: prev.subscriptions.filter(s => s.id !== id),
        };
      }
    });
  }, [showUndo]);

  const restoreSubscription = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      subscriptions: prev.subscriptions.map(s =>
        s.id === id ? { ...s, isDeleted: false, deletedAt: undefined } : s
      ),
    }));
  }, []);

  const permanentlyDeleteSubscription = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      subscriptions: prev.subscriptions.filter(s => s.id !== id),
    }));
  }, []);

  // ----------------------------------------------------
  // RECURRING PAYMENTS & BILLS (AUTOMATIC TRANSACTION CREATION)
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
    }));
    return id;
  }, []);

  const updateRecurring = useCallback((id: string, updates: Partial<RecurringTransaction>) => {
    setState(prev => ({
      ...prev,
      recurring: (prev.recurring || []).map(r =>
        r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r
      ),
    }));
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
        };
      } else {
        return {
          ...prev,
          recurring: (prev.recurring || []).filter(r => r.id !== id),
        };
      }
    });
  }, [showUndo]);

  const restoreRecurring = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      recurring: (prev.recurring || []).map(r =>
        r.id === id ? { ...r, isDeleted: false, deletedAt: undefined } : r
      ),
    }));
  }, []);

  const permanentlyDeleteRecurring = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      recurring: (prev.recurring || []).filter(r => r.id !== id),
    }));
  }, []);

  const toggleRecurringActive = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      recurring: (prev.recurring || []).map(r =>
        r.id === id ? { ...r, isActive: !r.isActive, updatedAt: Date.now() } : r
      ),
    }));
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
      }));
    }

    return result;
  }, [state.recurring, state.subscriptions, state.transactions]);

  const triggerManualRecurringExecution = useCallback((recurringId: string): string => {
    const rule = (state.recurring || []).find(r => r.id === recurringId);
    if (!rule) return '';

    const todayStr = new Date().toISOString().substring(0, 10);
    const txId = 'tx_rec_manual_' + rule.id + '_' + Date.now();
    const dateParts = todayStr.split('-');
    const timestamp = new Date(
      Number(dateParts[0]),
      Number(dateParts[1]) - 1,
      Number(dateParts[2]),
      9,
      0
    ).getTime() || Date.now();

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
        r.id === recurringId
          ? { ...r, nextDueDate, lastGeneratedDate: todayStr, updatedAt: Date.now() }
          : r
      ),
    }));

    return txId;
  }, [state.recurring]);

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
          // Undo handler: delete the newly created transactions
          const newTxIds = new Set(result.newTransactions.map(t => t.id));
          setState(prev => ({
            ...prev,
            transactions: prev.transactions.filter(t => !newTxIds.has(t.id)),
          }));
        }
      );
    }
  }, []); // Run once on initial load/mount
  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'allocations'>): string => {
    const id = 'goal_' + Date.now();
    const newGoal: Goal = {
      ...goal,
      id,
      allocations: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setState(prev => ({ ...prev, goals: [...(prev.goals || []), newGoal] }));
    return id;
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setState(prev => ({
      ...prev,
      goals: (prev.goals || []).map(g => (g.id === id ? { ...g, ...updates, updatedAt: Date.now() } : g)),
    }));
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
        };
      } else {
        return {
          ...prev,
          goals: (prev.goals || []).filter(g => g.id !== id),
        };
      }
    });
  }, [showUndo]);

  const restoreGoal = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      goals: (prev.goals || []).map(g =>
        g.id === id ? { ...g, isDeleted: false, deletedAt: undefined } : g
      ),
    }));
  }, []);

  const permanentlyDeleteGoal = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      goals: (prev.goals || []).filter(g => g.id !== id),
    }));
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

    // If connected to a bank account, record the transaction in the ledger
    if (accountId) {
      if (type === 'DEPOSIT') {
        // Money moved from bank to Goal reserve
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
        // Money returned to bank account
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
    setState(prev => ({ ...prev, loans: [...prev.loans, newLoan] }));
    return id;
  }, []);

  const updateLoan = useCallback((id: string, updates: Partial<Loan>) => {
    setState(prev => ({
      ...prev,
      loans: prev.loans.map(l => (l.id === id ? { ...l, ...updates } : l)),
    }));
  }, []);

  const deleteLoan = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      loans: prev.loans.filter(l => l.id !== id),
    }));
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
    setState(prev => ({ ...prev, investments: [...prev.investments, newInv] }));
    return id;
  }, []);

  const updateInvestment = useCallback((id: string, updates: Partial<Investment>) => {
    setState(prev => ({
      ...prev,
      investments: prev.investments.map(i => (i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i)),
    }));
  }, []);

  const deleteInvestment = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      investments: prev.investments.filter(i => i.id !== id),
    }));
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
    setState(prev => ({ ...prev, debts: [...prev.debts, newDebt] }));
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
        // Received money that was lent -> Bank increases
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
        // Repaid money that was borrowed -> Bank decreases
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
    }));
  }, [state.debts, state.accounts, addTransaction]);

  const deleteDebt = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      debts: prev.debts.filter(d => d.id !== id),
    }));
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
    }));
  }, [computedAccounts, addTransaction]);

  // ----------------------------------------------------
  // CATEGORIES & SETTINGS
  // ----------------------------------------------------
  const addCategory = useCallback((cat: Omit<Category, 'id'>): string => {
    const id = 'cat_' + Date.now();
    const newCat: Category = { ...cat, id, isCustom: true, order: state.categories.length + 1 };
    setState(prev => ({ ...prev, categories: [...prev.categories, newCat] }));
    return id;
  }, [state.categories.length]);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
    }));
  }, []);

  const addPaymentApp = useCallback((app: Omit<PaymentApp, 'id'>): string => {
    const id = 'papp_' + Date.now();
    const newApp: PaymentApp = { ...app, id, isCustom: true };
    setState(prev => ({ ...prev, paymentApps: [...prev.paymentApps, newApp] }));
    return id;
  }, []);

  const updatePaymentApp = useCallback((id: string, updates: Partial<PaymentApp>) => {
    setState(prev => ({
      ...prev,
      paymentApps: prev.paymentApps.map(p => (p.id === id ? { ...p, ...updates } : p)),
    }));
  }, []);

  const deletePaymentApp = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      paymentApps: prev.paymentApps.filter(p => p.id !== id),
    }));
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

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
    };
    setState(newState);
  }, []);

  const clearAllData = useCallback(() => {
    const emptyState: LocalStorageState = {
      accounts: [],
      creditCards: [],
      categories: DEFAULT_CATEGORIES,
      merchants: [],
      paymentApps: DEFAULT_PAYMENT_APPS,
      transactions: [],
      recurring: [],
      subscriptions: [],
      budgets: [],
      goals: [],
      loans: [],
      investments: [],
      debts: [],
      reconciliations: [],
      settings: { ...DEFAULT_APP_SETTINGS, userName: 'User' },
    };
    setState(emptyState);
  }, []);

  const loadBackupState = useCallback((restored: LocalStorageState) => {
    setState(restored);
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
        recurring: state.recurring,
        subscriptions: state.subscriptions,
        budgets: state.budgets,
        goals: state.goals || [],
        loans: computedLoans,
        investments: state.investments,
        debts: state.debts,
        reconciliations: state.reconciliations,
        settings: state.settings,
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
        isLocked,
        unlockApp,
        lockApp,
        undoToast,
        dismissUndoToast,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        restoreTransaction,
        permanentlyDeleteTransaction,
        emptyTrash,
        emptyAllTrash,
        restoreAllTrash,
        addAccount,
        updateAccount,
        deleteAccount,
        restoreAccount,
        permanentlyDeleteAccount,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        restoreCreditCard,
        permanentlyDeleteCreditCard,
        payCreditCardBill,
        convertAccountToCreditCard,
        convertCreditCardToAccount,
        addBudget,
        updateBudget,
        deleteBudget,
        restoreBudget,
        permanentlyDeleteBudget,
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
        allocateToGoal,
        addLoan,
        updateLoan,
        deleteLoan,
        payLoanEMI,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addDebt,
        settleDebt,
        deleteDebt,
        reconcileAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        addPaymentApp,
        updatePaymentApp,
        deletePaymentApp,
        updateSettings,
        resetToDemoData,
        clearAllData,
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
