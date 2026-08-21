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
  AppBackupData,
  Goal,
} from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_APPS, DEFAULT_APP_SETTINGS } from './constants';
import { getDemoData } from './demoData';
import * as XLSX from 'xlsx';

const STORAGE_KEYS = {
  ACCOUNTS: 'mt_accounts_v1',
  CREDIT_CARDS: 'mt_credit_cards_v1',
  CATEGORIES: 'mt_categories_v1',
  MERCHANTS: 'mt_merchants_v1',
  PAYMENT_APPS: 'mt_payment_apps_v1',
  TRANSACTIONS: 'mt_transactions_v1',
  RECURRING: 'mt_recurring_v1',
  SUBSCRIPTIONS: 'mt_subscriptions_v1',
  BUDGETS: 'mt_budgets_v1',
  GOALS: 'mt_goals_v1',
  LOANS: 'mt_loans_v1',
  INVESTMENTS: 'mt_investments_v1',
  DEBTS: 'mt_debts_v1',
  RECONCILIATIONS: 'mt_reconciliations_v1',
  SETTINGS: 'mt_settings_v1',
  INITIALIZED: 'mt_initialized_v1',
};

export interface LocalStorageState {
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
}

/**
 * Initialize state from localStorage or load demo/default seed on first run
 */
export function loadInitialState(): LocalStorageState {
  try {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);

    if (!isInit) {
      // First run: load initial demo data for rich immediate experience
      const demo = getDemoData();
      const initialState: LocalStorageState = {
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

      saveFullState(initialState);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      return initialState;
    }

    // Load from local storage
    const accounts = parseJson<Account[]>(localStorage.getItem(STORAGE_KEYS.ACCOUNTS), []);
    const rawCreditCards = parseJson<CreditCard[]>(localStorage.getItem(STORAGE_KEYS.CREDIT_CARDS), []);
    const creditCards = rawCreditCards.map((card, idx) => {
      const nameLower = (card.name || '').toLowerCase();
      let network = card.network;
      if (!network) {
        if (nameLower.includes('rupay')) network = 'RUPAY';
        else if (nameLower.includes('master')) network = 'MASTERCARD';
        else if (nameLower.includes('amex') || (card.issuer || '').toLowerCase().includes('amex')) network = 'AMEX';
        else if (nameLower.includes('diners')) network = 'DINERS';
        else network = 'VISA';
      }

      let cardTheme = card.cardTheme;
      if (!cardTheme) {
        const themeList = ['gold', 'coral', 'sapphire', 'amethyst', 'emerald', 'midnight', 'ruby', 'sunset'];
        cardTheme = themeList[idx % themeList.length];
      }

      return {
        ...card,
        network,
        cardTheme,
      };
    });
    const categories = parseJson<Category[]>(localStorage.getItem(STORAGE_KEYS.CATEGORIES), DEFAULT_CATEGORIES);
    const merchants = parseJson<Merchant[]>(localStorage.getItem(STORAGE_KEYS.MERCHANTS), []);
    const paymentApps = parseJson<PaymentApp[]>(localStorage.getItem(STORAGE_KEYS.PAYMENT_APPS), DEFAULT_PAYMENT_APPS);
    const transactions = parseJson<Transaction[]>(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS), []);
    const recurring = parseJson<RecurringTransaction[]>(localStorage.getItem(STORAGE_KEYS.RECURRING), []);
    const subscriptions = parseJson<Subscription[]>(localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS), []);
    const budgets = parseJson<Budget[]>(localStorage.getItem(STORAGE_KEYS.BUDGETS), []);
    const goals = parseJson<Goal[]>(localStorage.getItem(STORAGE_KEYS.GOALS), getDemoData().goals || []);
    const loans = parseJson<Loan[]>(localStorage.getItem(STORAGE_KEYS.LOANS), []);
    const investments = parseJson<Investment[]>(localStorage.getItem(STORAGE_KEYS.INVESTMENTS), []);
    const debts = parseJson<DebtRecord[]>(localStorage.getItem(STORAGE_KEYS.DEBTS), []);
    const reconciliations = parseJson<AccountReconciliation[]>(localStorage.getItem(STORAGE_KEYS.RECONCILIATIONS), []);
    const settings = parseJson<AppSettings>(localStorage.getItem(STORAGE_KEYS.SETTINGS), DEFAULT_APP_SETTINGS);

    return {
      accounts,
      creditCards,
      categories: categories.length ? categories : DEFAULT_CATEGORIES,
      merchants,
      paymentApps: paymentApps.length ? paymentApps : DEFAULT_PAYMENT_APPS,
      transactions,
      recurring,
      subscriptions,
      budgets,
      goals,
      loans,
      investments,
      debts,
      reconciliations,
      settings,
    };
  } catch (err) {
    console.error('Failed to load state from localStorage', err);
    return {
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
      settings: DEFAULT_APP_SETTINGS,
    };
  }
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function saveFullState(state: LocalStorageState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(state.accounts));
    localStorage.setItem(STORAGE_KEYS.CREDIT_CARDS, JSON.stringify(state.creditCards));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
    localStorage.setItem(STORAGE_KEYS.MERCHANTS, JSON.stringify(state.merchants));
    localStorage.setItem(STORAGE_KEYS.PAYMENT_APPS, JSON.stringify(state.paymentApps));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
    localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(state.recurring));
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(state.subscriptions));
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(state.budgets));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(state.goals));
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(state.loans));
    localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(state.investments));
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(state.debts));
    localStorage.setItem(STORAGE_KEYS.RECONCILIATIONS, JSON.stringify(state.reconciliations));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
  } catch (e) {
    console.error('Error writing to local storage', e);
  }
}

/**
 * Creates and downloads a complete JSON backup of all app data
 */
export function exportJsonBackup(state: LocalStorageState): void {
  const backup: AppBackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...state,
  };
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `money_tracker_backup_${new Date().toISOString().substring(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validates and restores a JSON backup file
 */
export function restoreJsonBackup(jsonString: string): LocalStorageState | null {
  try {
    const data = JSON.parse(jsonString) as Partial<AppBackupData>;
    if (!data.version || !Array.isArray(data.transactions) || !Array.isArray(data.accounts)) {
      throw new Error('Invalid backup file schema');
    }

    const restored: LocalStorageState = {
      accounts: data.accounts || [],
      creditCards: data.creditCards || [],
      categories: data.categories || DEFAULT_CATEGORIES,
      merchants: data.merchants || [],
      paymentApps: data.paymentApps || DEFAULT_PAYMENT_APPS,
      transactions: data.transactions || [],
      recurring: data.recurring || [],
      subscriptions: data.subscriptions || [],
      budgets: data.budgets || [],
      goals: data.goals || [],
      loans: data.loans || [],
      investments: data.investments || [],
      debts: data.debts || [],
      reconciliations: data.reconciliations || [],
      settings: data.settings || DEFAULT_APP_SETTINGS,
    };

    saveFullState(restored);
    return restored;
  } catch (err) {
    console.error('Backup restore failed:', err);
    return null;
  }
}

/**
 * Export transactions and summary to Excel or CSV workbook
 */
export function exportToExcel(state: LocalStorageState, format: 'xlsx' | 'csv' = 'xlsx'): void {
  const wb = XLSX.utils.book_new();

  // Transactions Sheet
  const txRows = state.transactions
    .filter(t => !t.isDeleted)
    .map(t => ({
      ID: t.id,
      Date: t.date,
      Time: t.time,
      Type: t.type,
      Category: t.categoryName || '',
      Subcategory: t.subcategory || '',
      Amount: t.amount,
      RefundAmount: t.refundAmount || 0,
      Merchant: t.merchantName || '',
      Account: t.accountName || '',
      CreditCard: t.creditCardName || '',
      PaymentApp: t.paymentAppName || '',
      ToAccount: t.toAccountName || '',
      Notes: t.notes || '',
      Tags: (t.tags || []).join(', '),
    }));
  const wsTx = XLSX.utils.json_to_sheet(txRows);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');

  // Accounts Sheet
  const accRows = state.accounts.map(a => ({
    ID: a.id,
    Name: a.name,
    Institution: a.institution,
    Type: a.type,
    OpeningBalance: a.openingBalance,
    CalculatedBalance: a.calculatedBalance,
    Active: a.isActive ? 'Yes' : 'No',
  }));
  const wsAcc = XLSX.utils.json_to_sheet(accRows);
  XLSX.utils.book_append_sheet(wb, wsAcc, 'Accounts');

  // Cards Sheet
  if (state.creditCards.length > 0) {
    const cardRows = state.creditCards.map(c => ({
      ID: c.id,
      Name: c.name,
      Issuer: c.issuer,
      Last4: c.lastFourDigits,
      Limit: c.creditLimit,
      Outstanding: c.currentOutstanding,
      StatementDay: c.statementDate,
      DueDay: c.dueDate,
    }));
    const wsCards = XLSX.utils.json_to_sheet(cardRows);
    XLSX.utils.book_append_sheet(wb, wsCards, 'CreditCards');
  }

  // Investments Sheet
  if (state.investments.length > 0) {
    const invRows = state.investments.map(i => ({
      Name: i.name,
      Category: i.category,
      InvestedAmount: i.investedAmount,
      CurrentValue: i.currentValue,
      GainLoss: i.currentValue - i.investedAmount,
      PurchaseDate: i.purchaseDate,
    }));
    const wsInv = XLSX.utils.json_to_sheet(invRows);
    XLSX.utils.book_append_sheet(wb, wsInv, 'Investments');
  }

  const filename = `MoneyTracker_Export_${new Date().toISOString().substring(0, 10)}.${format}`;
  XLSX.writeFile(wb, filename);
}
