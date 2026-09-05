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
  AppBackupData,
  Goal,
  ExportOptions,
} from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_APPS, DEFAULT_APP_SETTINGS, DEFAULT_TEMPLATES } from './constants';
import { getDemoData } from './demoData';
import { exportAppDataToExcel, DEFAULT_EXPORT_OPTIONS } from './appDataHub';
import * as XLSX from 'xlsx';

const STORAGE_KEYS = {
  ACCOUNTS: 'mt_accounts_v1',
  CREDIT_CARDS: 'mt_credit_cards_v1',
  CATEGORIES: 'mt_categories_v1',
  MERCHANTS: 'mt_merchants_v1',
  PAYMENT_APPS: 'mt_payment_apps_v1',
  TRANSACTIONS: 'mt_transactions_v1',
  TEMPLATES: 'mt_templates_v1',
  RECURRING: 'mt_recurring_v1',
  SUBSCRIPTIONS: 'mt_subscriptions_v1',
  BUDGETS: 'mt_budgets_v1',
  GOALS: 'mt_goals_v1',
  LOANS: 'mt_loans_v1',
  INVESTMENTS: 'mt_investments_v1',
  DEBTS: 'mt_debts_v1',
  RECONCILIATIONS: 'mt_reconciliations_v1',
  SETTINGS: 'mt_settings_v1',
  ACTIVITY_LOGS: 'mt_activity_logs_v1',
  INITIALIZED: 'mt_initialized_v1',
};

export interface LocalStorageState {
  accounts: Account[];
  creditCards: CreditCard[];
  categories: Category[];
  merchants: Merchant[];
  paymentApps: PaymentApp[];
  transactions: Transaction[];
  templates?: TransactionTemplate[];
  recurring: RecurringTransaction[];
  subscriptions: Subscription[];
  budgets: Budget[];
  goals?: Goal[];
  loans: Loan[];
  investments: Investment[];
  debts: DebtRecord[];
  reconciliations: AccountReconciliation[];
  settings: AppSettings;
  activityLogs?: import('../types').ActivityLog[];
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
        templates: DEFAULT_TEMPLATES,
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
    const rawTransactions = parseJson<Transaction[]>(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS), []);
    const rawDebts = parseJson<DebtRecord[]>(localStorage.getItem(STORAGE_KEYS.DEBTS), []);
    const debts = [...rawDebts];

    // Sanitize & heal transactions + auto-link debts
    const transactions = rawTransactions.map(t => {
      let updated = { ...t };
      if (typeof updated.type !== 'string' || !updated.type) {
        updated.type = 'EXPENSE';
      }
      if (t.type === 'MONEY_LENT' || t.type === 'MONEY_BORROWED') {
        // Fix category if accidentally assigned Food & Dining or cat_food
        if (!updated.categoryName || updated.categoryName === 'Food & Dining' || updated.categoryId === 'cat_food') {
          updated.categoryId = 'cat_transfer';
          updated.categoryName = t.type === 'MONEY_LENT' ? 'Money Lent' : 'Money Borrowed';
        }
        if (!updated.debtPersonName && updated.merchantName) {
          updated.debtPersonName = updated.merchantName;
        }
        const targetDebtId = updated.debtId || ('debt_' + updated.id);
        updated.debtId = targetDebtId;

        // Ensure this transaction is present in debts list
        const existsInDebts = debts.some(d => d.id === targetDebtId);
        if (!existsInDebts && !updated.isDeleted) {
          debts.push({
            id: targetDebtId,
            type: updated.type === 'MONEY_LENT' ? 'LENT' : 'BORROWED',
            personName: updated.debtPersonName || updated.merchantName || 'Person',
            amount: updated.amount,
            remainingAmount: updated.isDebtSettled ? 0 : updated.amount,
            dueDate: updated.debtDueDate,
            notes: updated.notes,
            isSettled: !!updated.isDebtSettled,
            createdAt: updated.timestamp || Date.now(),
          });
        }
      }
      return updated;
    });
    const templates = parseJson<TransactionTemplate[]>(localStorage.getItem(STORAGE_KEYS.TEMPLATES), DEFAULT_TEMPLATES);
    const demo = getDemoData();
    const rawRecurring = localStorage.getItem(STORAGE_KEYS.RECURRING) !== null ? parseJson<RecurringTransaction[]>(localStorage.getItem(STORAGE_KEYS.RECURRING), []) : demo.recurring;
    const recurring = rawRecurring;
    const rawSubscriptions = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS) !== null ? parseJson<Subscription[]>(localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS), []) : demo.subscriptions;
    const subscriptions = rawSubscriptions;
    const budgets = parseJson<Budget[]>(localStorage.getItem(STORAGE_KEYS.BUDGETS), []);
    const goals = localStorage.getItem(STORAGE_KEYS.GOALS) !== null ? parseJson<Goal[]>(localStorage.getItem(STORAGE_KEYS.GOALS), []) : (getDemoData().goals || []);
    const loans = parseJson<Loan[]>(localStorage.getItem(STORAGE_KEYS.LOANS), []);
    const investments = parseJson<Investment[]>(localStorage.getItem(STORAGE_KEYS.INVESTMENTS), []);
    const reconciliations = parseJson<AccountReconciliation[]>(localStorage.getItem(STORAGE_KEYS.RECONCILIATIONS), []);
    const settings = parseJson<AppSettings>(localStorage.getItem(STORAGE_KEYS.SETTINGS), DEFAULT_APP_SETTINGS);
    const activityLogs = parseJson<import('../types').ActivityLog[]>(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS), []);

    return {
      accounts,
      creditCards,
      categories: categories.length ? categories : DEFAULT_CATEGORIES,
      merchants,
      paymentApps: paymentApps.length ? paymentApps : DEFAULT_PAYMENT_APPS,
      transactions,
      templates: templates && templates.length > 0 ? templates : DEFAULT_TEMPLATES,
      recurring,
      subscriptions,
      budgets,
      goals,
      loans,
      investments,
      debts,
      reconciliations,
      settings,
      activityLogs,
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
      templates: DEFAULT_TEMPLATES,
      recurring: [],
      subscriptions: [],
      budgets: [],
      goals: [],
      loans: [],
      investments: [],
      debts: [],
      reconciliations: [],
      settings: DEFAULT_APP_SETTINGS,
      activityLogs: [],
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

function safeJsonStringify(data: any): string {
  const seen = new WeakSet();
  return JSON.stringify(data, (key, value) => {
    if (value && typeof value === 'object') {
      // Exclude DOM nodes, elements, React Fiber nodes, and circular structures
      if (typeof Element !== 'undefined' && value instanceof Element) return undefined;
      if (typeof Event !== 'undefined' && value instanceof Event) return undefined;
      if (
        value.constructor &&
        (value.constructor.name === 'HTMLButtonElement' ||
          value.constructor.name.includes('Element') ||
          value.constructor.name.includes('Node') ||
          value.constructor.name.includes('Fiber'))
      ) {
        return undefined;
      }
      if (seen.has(value)) {
        return undefined;
      }
      seen.add(value);
    }
    return value;
  });
}

export function saveFullState(state: LocalStorageState): void {
  try {
    const sanitizedTransactions = (state.transactions || []).map(t => {
      if (typeof t.type !== 'string' || !t.type) {
        return { ...t, type: 'EXPENSE' as const };
      }
      return t;
    });

    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, safeJsonStringify(state.accounts));
    localStorage.setItem(STORAGE_KEYS.CREDIT_CARDS, safeJsonStringify(state.creditCards));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, safeJsonStringify(state.categories));
    localStorage.setItem(STORAGE_KEYS.MERCHANTS, safeJsonStringify(state.merchants));
    localStorage.setItem(STORAGE_KEYS.PAYMENT_APPS, safeJsonStringify(state.paymentApps));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, safeJsonStringify(sanitizedTransactions));
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, safeJsonStringify(state.templates || []));
    localStorage.setItem(STORAGE_KEYS.RECURRING, safeJsonStringify(state.recurring));
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, safeJsonStringify(state.subscriptions));
    localStorage.setItem(STORAGE_KEYS.BUDGETS, safeJsonStringify(state.budgets));
    localStorage.setItem(STORAGE_KEYS.GOALS, safeJsonStringify(state.goals));
    localStorage.setItem(STORAGE_KEYS.LOANS, safeJsonStringify(state.loans));
    localStorage.setItem(STORAGE_KEYS.INVESTMENTS, safeJsonStringify(state.investments));
    localStorage.setItem(STORAGE_KEYS.DEBTS, safeJsonStringify(state.debts));
    localStorage.setItem(STORAGE_KEYS.RECONCILIATIONS, safeJsonStringify(state.reconciliations));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, safeJsonStringify(state.settings));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, safeJsonStringify(state.activityLogs || []));
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

export const exportFullBackupJson = exportJsonBackup;

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
      templates: data.templates && data.templates.length > 0 ? data.templates : DEFAULT_TEMPLATES,
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
 * Filter transactions based on ExportOptions
 */
export function filterTransactionsForExport(
  transactions: Transaction[],
  options: ExportOptions
): Transaction[] {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  
  const currentYearStr = `${now.getFullYear()}`;

  return transactions.filter(t => {
    // Deleted filter
    if (!options.includeDeleted && t.isDeleted) return false;

    // Type filter
    if (options.type && options.type !== 'ALL') {
      if (options.type === 'EXPENSE' && t.type !== 'EXPENSE') return false;
      if (options.type === 'INCOME' && t.type !== 'INCOME') return false;
      if (options.type === 'TRANSFER' && t.type !== 'TRANSFER' && t.type !== 'CARD_PAYMENT') return false;
    }

    // Account / Card filter
    if (options.accountId && options.accountId !== 'ALL') {
      const matchesAccount = t.accountId === options.accountId || t.toAccountId === options.accountId || t.creditCardId === options.accountId;
      if (!matchesAccount) return false;
    }

    // Category filter
    if (options.categoryId && options.categoryId !== 'ALL') {
      if (t.categoryId !== options.categoryId) return false;
    }

    // Date range filter
    if (options.dateRange === 'THIS_MONTH') {
      if (!t.date.startsWith(currentMonthStr)) return false;
    } else if (options.dateRange === 'LAST_MONTH') {
      if (!t.date.startsWith(lastMonthStr)) return false;
    } else if (options.dateRange === 'THIS_YEAR') {
      if (!t.date.startsWith(currentYearStr)) return false;
    } else if (options.dateRange === 'THIS_QUARTER') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const txDate = new Date(t.date);
      const txQuarter = Math.floor(txDate.getMonth() / 3);
      if (txDate.getFullYear() !== now.getFullYear() || txQuarter !== currentQuarter) return false;
    } else if (options.dateRange === 'CUSTOM') {
      if (options.startDate && t.date < options.startDate) return false;
      if (options.endDate && t.date > options.endDate) return false;
    }

    return true;
  });
}

/**
 * Export transactions in standard standard CSV format
 */
export function exportTransactionsCsv(
  transactions: Transaction[],
  options?: Partial<ExportOptions>
): void {
  const opts: ExportOptions = {
    format: 'standard_csv',
    dateRange: 'ALL',
    includeNotes: true,
    includeTags: true,
    includeSplits: true,
    includeDeleted: false,
    ...options,
  };

  const filtered = filterTransactionsForExport(transactions, opts);

  // Standard CSV Headers
  const headers = [
    'Date',
    'Time',
    'Type',
    'Title / Merchant',
    'Category',
    'Subcategory',
    'Amount (INR)',
    'Original Amount',
    'Original Currency',
    'Account / Source',
    'Destination Account',
    'Credit Card',
    'Payment Channel',
    'Notes',
    'Tags',
    'Splits Breakdown',
    'Status'
  ];

  const rows = filtered.map(t => {
    let splitsStr = '';
    if (t.splits && t.splits.length > 0) {
      splitsStr = t.splits.map(s => `${s.categoryName || 'Split'}: ₹${s.amount}${s.notes ? ` (${s.notes})` : ''}`).join(' | ');
    }

    return [
      `"${t.date}"`,
      `"${t.time || '12:00'}"`,
      `"${t.type}"`,
      `"${(t.merchantName || t.categoryName || 'Transaction').replace(/"/g, '""')}"`,
      `"${(t.categoryName || '').replace(/"/g, '""')}"`,
      `"${(t.subcategory || '').replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.originalAmount ? t.originalAmount.toFixed(2) : t.amount.toFixed(2),
      `"${t.originalCurrency || 'INR'}"`,
      `"${(t.accountName || 'Cash').replace(/"/g, '""')}"`,
      `"${(t.toAccountName || '').replace(/"/g, '""')}"`,
      `"${(t.creditCardName || '').replace(/"/g, '""')}"`,
      `"${(t.paymentAppName || '').replace(/"/g, '""')}"`,
      `"${(opts.includeNotes ? t.notes || '' : '').replace(/"/g, '""')}"`,
      `"${(opts.includeTags && t.tags ? t.tags.join(', ') : '').replace(/"/g, '""')}"`,
      `"${splitsStr.replace(/"/g, '""')}"`,
      `"${t.isDeleted ? 'Deleted / Trash' : 'Active'}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Transactions_${new Date().toISOString().substring(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export templates in CSV format
 */
export function exportTemplatesCsv(templates: TransactionTemplate[]): void {
  const headers = [
    'Template Name',
    'Type',
    'Preset Amount',
    'Category',
    'Subcategory',
    'Merchant / Payee',
    'Account / Source',
    'Credit Card',
    'Destination Account',
    'Payment App',
    'Notes',
    'Tags',
    'Usage Count',
    'Is Favorite'
  ];

  const rows = templates.map(tmpl => [
    `"${tmpl.name.replace(/"/g, '""')}"`,
    `"${tmpl.type}"`,
    tmpl.amount !== undefined ? tmpl.amount.toFixed(2) : '',
    `"${(tmpl.categoryName || '').replace(/"/g, '""')}"`,
    `"${(tmpl.subcategory || '').replace(/"/g, '""')}"`,
    `"${(tmpl.merchantName || '').replace(/"/g, '""')}"`,
    `"${(tmpl.accountName || '').replace(/"/g, '""')}"`,
    `"${(tmpl.creditCardName || '').replace(/"/g, '""')}"`,
    `"${(tmpl.toAccountName || '').replace(/"/g, '""')}"`,
    `"${(tmpl.paymentAppName || '').replace(/"/g, '""')}"`,
    `"${(tmpl.notes || '').replace(/"/g, '""')}"`,
    `"${(tmpl.tags ? tmpl.tags.join(', ') : '').replace(/"/g, '""')}"`,
    tmpl.usageCount || 0,
    tmpl.isFavorite ? 'Yes' : 'No',
  ].join(','));

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Transaction_Templates_${new Date().toISOString().substring(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export templates in JSON format
 */
export function exportTemplatesJson(templates: TransactionTemplate[]): void {
  const data = {
    version: 1,
    type: 'transaction_templates',
    exportedAt: new Date().toISOString(),
    templates,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Transaction_Templates_${new Date().toISOString().substring(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export transactions and summary to Excel or CSV workbook
 */
export function exportToExcel(state: LocalStorageState, format: 'xlsx' | 'csv' = 'xlsx'): void {
  exportAppDataToExcel(state, {
    ...DEFAULT_EXPORT_OPTIONS,
    format,
  });
}

/**
 * Export audit activity change logs in standard CSV format
 */
export function exportActivityLogsCsv(logs: import('../types').ActivityLog[]): void {
  const headers = [
    'Log ID',
    'Date',
    'Time',
    'Domain',
    'Action Type',
    'Entity ID',
    'Entity Name',
    'Summary',
    'Field Changes'
  ];

  const rows = logs.map(log => {
    const diffsSummary = (log.details || [])
      .map(d => `${d.label || d.field}: [${d.oldValue !== undefined ? JSON.stringify(d.oldValue) : 'none'}] ➔ [${d.newValue !== undefined ? JSON.stringify(d.newValue) : 'none'}]`)
      .join('; ');

    return [
      `"${log.id}"`,
      `"${log.date}"`,
      `"${log.time}"`,
      `"${log.domain}"`,
      `"${log.action}"`,
      `"${(log.entityId || '').replace(/"/g, '""')}"`,
      `"${(log.entityName || '').replace(/"/g, '""')}"`,
      `"${(log.summary || '').replace(/"/g, '""')}"`,
      `"${diffsSummary.replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Activity_Audit_Log_${new Date().toISOString().substring(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export audit activity change logs in JSON format
 */
export function exportActivityLogsJson(logs: import('../types').ActivityLog[]): void {
  const data = {
    version: 1,
    type: 'activity_audit_logs',
    totalEntries: logs.length,
    exportedAt: new Date().toISOString(),
    logs,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Activity_Audit_Log_${new Date().toISOString().substring(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


