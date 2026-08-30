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
  ActivityLog,
  LocalStorageState,
  TransactionType,
  AccountType,
  CardNetwork,
  CardTheme,
  InvestmentCategory,
  LoanType,
  RecurrenceFrequency,
} from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PAYMENT_APPS,
  DEFAULT_APP_SETTINGS,
  DEFAULT_TEMPLATES,
  CARD_THEMES,
} from './constants';
import { createActivityEntry } from './activityLogger';
import { recalculateAllBalances } from './accountingEngine';
import * as XLSX from 'xlsx';

export interface AppDataExportOptions {
  format: 'xlsx' | 'csv' | 'json';
  scope: 'ALL' | 'CUSTOM';
  dateRange: 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'THIS_QUARTER' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  typeFilter: 'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER';
  includeTransactions: boolean;
  includeAccounts: boolean;
  includeCreditCards: boolean;
  includeCategories: boolean;
  includeBudgets: boolean;
  includeInvestments: boolean;
  includeLoans: boolean;
  includeDebts: boolean;
  includeSubscriptions: boolean;
  includeRecurring: boolean;
  includeGoals: boolean;
  includeTemplates: boolean;
  includeSettings: boolean;
  includeActivityLogs: boolean;
  includeNotes: boolean;
  includeTags: boolean;
  includeDeleted: boolean;
}

export const DEFAULT_EXPORT_OPTIONS: AppDataExportOptions = {
  format: 'xlsx',
  scope: 'ALL',
  dateRange: 'ALL',
  typeFilter: 'ALL',
  includeTransactions: true,
  includeAccounts: true,
  includeCreditCards: true,
  includeCategories: true,
  includeBudgets: true,
  includeInvestments: true,
  includeLoans: true,
  includeDebts: true,
  includeSubscriptions: true,
  includeRecurring: true,
  includeGoals: true,
  includeTemplates: true,
  includeSettings: true,
  includeActivityLogs: false,
  includeNotes: true,
  includeTags: true,
  includeDeleted: false,
};

export interface ParsedAppImportData {
  fileType: 'EXCEL' | 'CSV' | 'JSON' | 'UNKNOWN';
  fileName: string;
  isValid: boolean;
  errorMessage?: string;
  counts: {
    transactions: number;
    accounts: number;
    creditCards: number;
    categories: number;
    budgets: number;
    investments: number;
    loans: number;
    debts: number;
    subscriptions: number;
    recurring: number;
    goals: number;
    templates: number;
  };
  data: Partial<LocalStorageState>;
  rawTransactionsPreview: Transaction[];
}

export interface AppImportExecutionOptions {
  mode: 'MERGE' | 'REPLACE';
  skipDuplicates: boolean;
  autoCalculateBalances: boolean;
  importTransactions: boolean;
  importAccounts: boolean;
  importCategories: boolean;
  importBudgets: boolean;
  importInvestments: boolean;
  importLoans: boolean;
  importDebts: boolean;
  importSubscriptions: boolean;
  importGoals: boolean;
}

export const DEFAULT_IMPORT_OPTIONS: AppImportExecutionOptions = {
  mode: 'MERGE',
  skipDuplicates: true,
  autoCalculateBalances: true,
  importTransactions: true,
  importAccounts: true,
  importCategories: true,
  importBudgets: true,
  importInvestments: true,
  importLoans: true,
  importDebts: true,
  importSubscriptions: true,
  importGoals: true,
};

/**
 * Filter transactions based on date and type options
 */
export function filterTransactionsByOptions(
  transactions: Transaction[],
  options: Partial<AppDataExportOptions>
): Transaction[] {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const currentYearStr = `${now.getFullYear()}`;

  return transactions.filter(t => {
    if (!options.includeDeleted && t.isDeleted) return false;

    if (options.typeFilter && options.typeFilter !== 'ALL') {
      if (options.typeFilter === 'EXPENSE' && t.type !== 'EXPENSE') return false;
      if (options.typeFilter === 'INCOME' && t.type !== 'INCOME') return false;
      if (options.typeFilter === 'TRANSFER' && t.type !== 'TRANSFER' && t.type !== 'CARD_PAYMENT') return false;
    }

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
 * Export full state or filtered data to Excel (.xlsx)
 */
export function exportAppDataToExcel(
  state: LocalStorageState,
  options: Partial<AppDataExportOptions> = {}
): void {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const wb = XLSX.utils.book_new();
  const dateSuffix = new Date().toISOString().substring(0, 10);

  // 1. Transactions Sheet
  if (opts.includeTransactions && state.transactions.length > 0) {
    const filteredTx = filterTransactionsByOptions(state.transactions, opts);
    const txRows = filteredTx.map(t => ({
      ID: t.id,
      Date: t.date,
      Time: t.time || '12:00',
      Type: t.type,
      Title_Merchant: t.merchantName || t.categoryName || 'Transaction',
      Category: t.categoryName || '',
      Subcategory: t.subcategory || '',
      Amount: t.amount,
      RefundAmount: t.refundAmount || 0,
      Account_Source: t.accountName || '',
      Account_ID: t.accountId || '',
      Destination_Account: t.toAccountName || '',
      Destination_Account_ID: t.toAccountId || '',
      Credit_Card: t.creditCardName || '',
      Credit_Card_ID: t.creditCardId || '',
      Destination_Credit_Card: t.toCreditCardName || '',
      Destination_Credit_Card_ID: t.toCreditCardId || '',
      Payment_Channel: t.paymentAppName || '',
      Notes: opts.includeNotes ? t.notes || '' : '',
      Tags: opts.includeTags && t.tags ? t.tags.join(', ') : '',
      Splits: t.splits && t.splits.length > 0 ? JSON.stringify(t.splits) : '',
      Status: t.isDeleted ? 'Deleted' : 'Active',
    }));
    const wsTx = XLSX.utils.json_to_sheet(txRows);
    XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');
  }

  // 2. Accounts Sheet
  if (opts.includeAccounts && state.accounts.length > 0) {
    const accRows = state.accounts.map(a => ({
      ID: a.id,
      Name: a.name,
      Institution: a.institution,
      Type: a.type,
      OpeningBalance: a.openingBalance || 0,
      CalculatedBalance: a.calculatedBalance,
      Icon: a.icon,
      Color: a.color,
      Active: a.isActive ? 'Yes' : 'No',
      IsExcludedFromNetWorth: a.isExcludedFromNetWorth ? 'Yes' : 'No',
    }));
    const wsAcc = XLSX.utils.json_to_sheet(accRows);
    XLSX.utils.book_append_sheet(wb, wsAcc, 'Accounts');
  }

  // 3. Credit Cards Sheet
  if (opts.includeCreditCards && state.creditCards.length > 0) {
    const cardRows = state.creditCards.map(c => ({
      ID: c.id,
      Name: c.name,
      Issuer: c.issuer,
      Network: c.network || 'VISA',
      Last4Digits: c.lastFourDigits,
      CreditLimit: c.creditLimit,
      OpeningBalance: c.openingBalance || 0,
      CurrentOutstanding: c.currentOutstanding,
      StatementDate: c.statementDate,
      DueDate: c.dueDate,
      CardTheme: c.cardTheme || 'midnight',
      Color: c.color,
      Active: c.isActive ? 'Yes' : 'No',
    }));
    const wsCards = XLSX.utils.json_to_sheet(cardRows);
    XLSX.utils.book_append_sheet(wb, wsCards, 'CreditCards');
  }

  // 4. Categories Sheet
  if (opts.includeCategories && state.categories.length > 0) {
    const catRows = state.categories.map(c => ({
      ID: c.id,
      Name: c.name,
      Type: c.type,
      Color: c.color,
      Icon: c.icon,
      Subcategories: (c.subcategories || []).join('; '),
      IsCustom: c.isCustom ? 'Yes' : 'No',
    }));
    const wsCat = XLSX.utils.json_to_sheet(catRows);
    XLSX.utils.book_append_sheet(wb, wsCat, 'Categories');
  }

  // 5. Budgets Sheet
  if (opts.includeBudgets && state.budgets.length > 0) {
    const bgtRows = state.budgets.map(b => ({
      ID: b.id,
      Name: b.name,
      Amount: b.amount,
      Month: b.month,
      RolloverType: b.rolloverType,
      Color: b.color,
      CategoryID: b.categoryId || '',
    }));
    const wsBgt = XLSX.utils.json_to_sheet(bgtRows);
    XLSX.utils.book_append_sheet(wb, wsBgt, 'Budgets');
  }

  // 6. Investments Sheet
  if (opts.includeInvestments && state.investments.length > 0) {
    const invRows = state.investments.map(i => ({
      ID: i.id,
      Name: i.name,
      Category: i.category,
      InvestedAmount: i.investedAmount,
      CurrentValue: i.currentValue,
      PurchaseDate: i.purchaseDate,
      FolioNumber: i.folioNumber || '',
      Notes: i.notes || '',
    }));
    const wsInv = XLSX.utils.json_to_sheet(invRows);
    XLSX.utils.book_append_sheet(wb, wsInv, 'Investments');
  }

  // 7. Loans Sheet
  if (opts.includeLoans && state.loans.length > 0) {
    const loanRows = state.loans.map(l => ({
      ID: l.id,
      Name: l.name,
      Type: l.type,
      LenderName: l.lenderName,
      PrincipalAmount: l.principalAmount,
      InterestRateAnnual: l.interestRateAnnual,
      TenureMonths: l.tenureMonths,
      EmiAmount: l.emiAmount,
      OutstandingPrincipal: l.outstandingPrincipal,
      StartDate: l.startDate,
      NextPaymentDate: l.nextPaymentDate,
      Notes: l.notes || '',
    }));
    const wsLoans = XLSX.utils.json_to_sheet(loanRows);
    XLSX.utils.book_append_sheet(wb, wsLoans, 'Loans');
  }

  // 8. Debts (Lent / Borrowed) Sheet
  if (opts.includeDebts && state.debts.length > 0) {
    const debtRows = state.debts.map(d => ({
      ID: d.id,
      PersonName: d.personName,
      Type: d.type,
      Amount: d.amount,
      RemainingAmount: d.remainingAmount,
      IsSettled: d.isSettled ? 'Yes' : 'No',
      DueDate: d.dueDate || '',
      Notes: d.notes || '',
    }));
    const wsDebts = XLSX.utils.json_to_sheet(debtRows);
    XLSX.utils.book_append_sheet(wb, wsDebts, 'Debts');
  }

  // 9. Subscriptions Sheet
  if (opts.includeSubscriptions && state.subscriptions.length > 0) {
    const subRows = state.subscriptions.map(s => ({
      ID: s.id,
      Name: s.name,
      Amount: s.amount,
      Frequency: s.frequency,
      CategoryName: s.categoryName || '',
      AccountName: s.accountName || s.creditCardName || '',
      NextBillingDate: s.nextBillingDate,
      IsActive: s.isActive ? 'Yes' : 'No',
      Color: s.color || '',
    }));
    const wsSubs = XLSX.utils.json_to_sheet(subRows);
    XLSX.utils.book_append_sheet(wb, wsSubs, 'Subscriptions');
  }

  // 10. Goals Sheet
  if (opts.includeGoals && (state.goals || []).length > 0) {
    const goalRows = (state.goals || []).map(g => ({
      ID: g.id,
      Name: g.name,
      TargetAmount: g.targetAmount,
      CurrentAmount: g.currentAmount,
      TargetDate: g.targetDate || '',
      Status: g.status,
      Icon: g.icon,
      Color: g.color,
    }));
    const wsGoals = XLSX.utils.json_to_sheet(goalRows);
    XLSX.utils.book_append_sheet(wb, wsGoals, 'Goals');
  }

  // 11. Templates Sheet
  if (opts.includeTemplates && (state.templates || []).length > 0) {
    const tmplRows = (state.templates || []).map(t => ({
      ID: t.id,
      Name: t.name,
      Type: t.type,
      Amount: t.amount || '',
      CategoryName: t.categoryName || '',
      AccountName: t.accountName || '',
      CreditCardName: t.creditCardName || '',
      Notes: t.notes || '',
      UsageCount: t.usageCount || 0,
      IsFavorite: t.isFavorite ? 'Yes' : 'No',
    }));
    const wsTmpl = XLSX.utils.json_to_sheet(tmplRows);
    XLSX.utils.book_append_sheet(wb, wsTmpl, 'Templates');
  }

  // If no sheets were added, add empty transactions sheet
  if (wb.SheetNames.length === 0) {
    const wsEmpty = XLSX.utils.json_to_sheet([{ Notice: 'No records matched the selected export filters' }]);
    XLSX.utils.book_append_sheet(wb, wsEmpty, 'Export');
  }

  const filename = `MoneyTracker_Export_${dateSuffix}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Export data to standard CSV (.csv)
 */
export function exportAppDataToCsv(
  state: LocalStorageState,
  options: Partial<AppDataExportOptions> = {}
): void {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const filteredTx = filterTransactionsByOptions(state.transactions, opts);

  const headers = [
    'Date',
    'Time',
    'Type',
    'Title / Merchant',
    'Category',
    'Subcategory',
    'Amount',
    'Account / Source',
    'Destination Account',
    'Credit Card',
    'Payment Channel',
    'Notes',
    'Tags',
    'Splits',
    'Status',
  ];

  const rows = filteredTx.map(t => {
    let splitsStr = '';
    if (t.splits && t.splits.length > 0) {
      splitsStr = t.splits
        .map(s => `${s.categoryName || 'Split'}: ₹${s.amount}${s.notes ? ` (${s.notes})` : ''}`)
        .join(' | ');
    }

    return [
      `"${t.date}"`,
      `"${t.time || '12:00'}"`,
      `"${t.type}"`,
      `"${(t.merchantName || t.categoryName || 'Transaction').replace(/"/g, '""')}"`,
      `"${(t.categoryName || '').replace(/"/g, '""')}"`,
      `"${(t.subcategory || '').replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      `"${(t.accountName || '').replace(/"/g, '""')}"`,
      `"${(t.toAccountName || '').replace(/"/g, '""')}"`,
      `"${(t.creditCardName || '').replace(/"/g, '""')}"`,
      `"${(t.paymentAppName || '').replace(/"/g, '""')}"`,
      `"${(opts.includeNotes ? t.notes || '' : '').replace(/"/g, '""')}"`,
      `"${(opts.includeTags && t.tags ? t.tags.join(', ') : '').replace(/"/g, '""')}"`,
      `"${splitsStr.replace(/"/g, '""')}"`,
      `"${t.isDeleted ? 'Deleted' : 'Active'}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MoneyTracker_Transactions_${new Date().toISOString().substring(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export full JSON backup
 */
export function exportAppDataToJson(state: LocalStorageState): void {
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
  a.download = `MoneyTracker_FullBackup_${new Date().toISOString().substring(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Helper to parse a standard CSV text line safely handling quoted fields
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse any uploaded Excel (.xlsx, .xls), CSV (.csv), or JSON (.json) file
 */
export async function parseAppImportFile(file: File): Promise<ParsedAppImportData> {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();

  try {
    // 1. JSON FILE PARSING
    if (lowerName.endsWith('.json')) {
      const text = await file.text();
      const raw = JSON.parse(text);

      // Check if it's our backup structure or raw object
      const accounts: Account[] = Array.isArray(raw.accounts) ? raw.accounts : [];
      const creditCards: CreditCard[] = Array.isArray(raw.creditCards) ? raw.creditCards : [];
      const categories: Category[] = Array.isArray(raw.categories) ? raw.categories : [];
      const transactions: Transaction[] = Array.isArray(raw.transactions) ? raw.transactions : [];
      const budgets: Budget[] = Array.isArray(raw.budgets) ? raw.budgets : [];
      const investments: Investment[] = Array.isArray(raw.investments) ? raw.investments : [];
      const loans: Loan[] = Array.isArray(raw.loans) ? raw.loans : [];
      const debts: DebtRecord[] = Array.isArray(raw.debts) ? raw.debts : [];
      const subscriptions: Subscription[] = Array.isArray(raw.subscriptions) ? raw.subscriptions : [];
      const recurring: RecurringTransaction[] = Array.isArray(raw.recurring) ? raw.recurring : [];
      const goals: Goal[] = Array.isArray(raw.goals) ? raw.goals : [];
      const templates: TransactionTemplate[] = Array.isArray(raw.templates) ? raw.templates : [];

      if (
        transactions.length === 0 &&
        accounts.length === 0 &&
        categories.length === 0 &&
        budgets.length === 0
      ) {
        throw new Error('No recognizable financial entities found in this JSON file.');
      }

      return {
        fileType: 'JSON',
        fileName,
        isValid: true,
        counts: {
          transactions: transactions.length,
          accounts: accounts.length,
          creditCards: creditCards.length,
          categories: categories.length,
          budgets: budgets.length,
          investments: investments.length,
          loans: loans.length,
          debts: debts.length,
          subscriptions: subscriptions.length,
          recurring: recurring.length,
          goals: goals.length,
          templates: templates.length,
        },
        data: {
          accounts,
          creditCards,
          categories: categories.length ? categories : undefined,
          transactions,
          budgets,
          investments,
          loans,
          debts,
          subscriptions,
          recurring,
          goals,
          templates,
          settings: raw.settings,
        },
        rawTransactionsPreview: transactions.slice(0, 50),
      };
    }

    // 2. EXCEL FILE PARSING (.xlsx, .xls)
    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });

      const parsedState: Partial<LocalStorageState> = {};
      const now = Date.now();

      // Parse Transactions Sheet
      const txSheetName = wb.SheetNames.find(n => /trans/i.test(n)) || wb.SheetNames[0];
      const txSheet = wb.Sheets[txSheetName];
      let transactions: Transaction[] = [];

      if (txSheet) {
        const rawTxRows = XLSX.utils.sheet_to_json<any>(txSheet);
        transactions = rawTxRows.map((row, idx) => {
          const rawDate = row.Date || row.date || row.DATE || new Date().toISOString().substring(0, 10);
          const rawAmount = Math.abs(Number(row.Amount || row.amount || row.AMOUNT || 0));
          const rawType = String(row.Type || row.type || '').toUpperCase();
          const type: TransactionType =
            rawType === 'INCOME'
              ? 'INCOME'
              : rawType === 'TRANSFER'
              ? 'TRANSFER'
              : rawType === 'CARD_PAYMENT'
              ? 'CARD_PAYMENT'
              : 'EXPENSE';

          return {
            id: row.ID || `tx_xl_${now}_${idx}`,
            date: String(rawDate).substring(0, 10),
            time: String(row.Time || '12:00'),
            timestamp: new Date(`${rawDate}T${row.Time || '12:00'}:00`).getTime() || now,
            type,
            amount: isNaN(rawAmount) ? 0 : rawAmount,
            merchantName: row.Title_Merchant || row.Merchant || row.Title || row.Description || '',
            categoryName: row.Category || row.categoryName || 'General',
            categoryId: row.CategoryId || row.categoryId || 'misc_expense',
            subcategory: row.Subcategory || row.subcategory,
            accountName: row.Account_Source || row.Account || row.accountName || undefined,
            accountId: row.Account_ID || row.AccountId || row.accountId || undefined,
            toAccountName: row.Destination_Account || row.ToAccount || row.toAccountName || undefined,
            toAccountId: row.Destination_Account_ID || row.ToAccountId || row.toAccountId || undefined,
            creditCardName: row.Credit_Card || row.CreditCard || row.creditCardName || undefined,
            creditCardId: row.Credit_Card_ID || row.CreditCardId || row.creditCardId || undefined,
            toCreditCardName: row.Destination_Credit_Card || row.ToCreditCard || row.toCreditCardName || undefined,
            toCreditCardId: row.Destination_Credit_Card_ID || row.ToCreditCardId || row.toCreditCardId || undefined,
            paymentAppName: row.Payment_Channel || row.PaymentApp || row.paymentAppName,
            notes: row.Notes || row.notes || '',
            tags: row.Tags ? String(row.Tags).split(',').map((s: string) => s.trim()) : [],
            createdAt: now,
            updatedAt: now,
          };
        });
      }

      // Parse Accounts Sheet
      const accSheetName = wb.SheetNames.find(n => /account/i.test(n));
      let accounts: Account[] = [];
      if (accSheetName && wb.Sheets[accSheetName]) {
        const rawAccRows = XLSX.utils.sheet_to_json<any>(wb.Sheets[accSheetName]);
        accounts = rawAccRows.map((row, idx) => ({
          id: row.ID || `acc_xl_${now}_${idx}`,
          name: row.Name || row.name || `Account ${idx + 1}`,
          institution: row.Institution || row.institution || 'Bank',
          type: (row.Type as AccountType) || 'SAVINGS',
          openingBalance: Number(row.OpeningBalance ?? row.openingBalance ?? 0),
          calculatedBalance: Number(row.CalculatedBalance ?? row.calculatedBalance ?? row.OpeningBalance ?? 0),
          icon: row.Icon || 'Landmark',
          color: row.Color || '#0284C7',
          isActive: String(row.Active || '').toLowerCase() !== 'no',
          isExcludedFromNetWorth: String(row.IsExcludedFromNetWorth || row.isExcludedFromNetWorth || '').toLowerCase() === 'yes',
          createdAt: now,
          updatedAt: now,
        }));
      }

      // Parse CreditCards Sheet
      const cardSheetName = wb.SheetNames.find(n => /card/i.test(n));
      let creditCards: CreditCard[] = [];
      if (cardSheetName && wb.Sheets[cardSheetName]) {
        const rawCardRows = XLSX.utils.sheet_to_json<any>(wb.Sheets[cardSheetName]);
        creditCards = rawCardRows.map((row, idx) => ({
          id: row.ID || `card_xl_${now}_${idx}`,
          name: row.Name || row.name || `Card ${idx + 1}`,
          issuer: row.Issuer || 'Bank',
          network: (row.Network as CardNetwork) || 'VISA',
          lastFourDigits: String(row.Last4Digits || row.Last4 || '9999').substring(0, 4),
          creditLimit: Number(row.CreditLimit || row.Limit || 100000),
          openingBalance: Number(row.OpeningBalance ?? row.openingBalance ?? 0),
          currentOutstanding: Number(row.CurrentOutstanding ?? row.Outstanding ?? 0),
          statementDate: Number(row.StatementDate || row.StatementDay || 15),
          dueDate: Number(row.DueDate || row.DueDay || 5),
          cardTheme: (row.CardTheme as CardTheme) || 'midnight',
          icon: row.Icon || 'CreditCard',
          color: row.Color || '#3B82F6',
          isActive: String(row.Active || '').toLowerCase() !== 'no',
          createdAt: now,
          updatedAt: now,
        }));
      }

      // Parse Categories Sheet
      const catSheetName = wb.SheetNames.find(n => /categor/i.test(n));
      let categories: Category[] = [];
      if (catSheetName && wb.Sheets[catSheetName]) {
        const rawCatRows = XLSX.utils.sheet_to_json<any>(wb.Sheets[catSheetName]);
        categories = rawCatRows.map((row, idx) => ({
          id: row.ID || `cat_xl_${now}_${idx}`,
          name: row.Name || row.name || `Category ${idx + 1}`,
          type: (row.Type as 'EXPENSE' | 'INCOME' | 'BOTH') || 'EXPENSE',
          color: row.Color || '#3B82F6',
          icon: row.Icon || 'Tag',
          subcategories: row.Subcategories ? String(row.Subcategories).split(';').map((s: string) => s.trim()) : [],
          order: idx + 1,
          isCustom: true,
        }));
      }

      // Parse Budgets
      const bgtSheetName = wb.SheetNames.find(n => /budget/i.test(n));
      let budgets: Budget[] = [];
      if (bgtSheetName && wb.Sheets[bgtSheetName]) {
        const rawBgtRows = XLSX.utils.sheet_to_json<any>(wb.Sheets[bgtSheetName]);
        budgets = rawBgtRows.map((row, idx) => ({
          id: row.ID || `bgt_xl_${now}_${idx}`,
          name: row.Name || `Budget ${idx + 1}`,
          amount: Number(row.Amount || 0),
          month: row.Month || 'ALL',
          rolloverType: row.RolloverType || 'NO_ROLLOVER',
          color: row.Color || '#10B981',
          categoryId: row.CategoryID || undefined,
        }));
      }

      // Parse Investments
      const invSheetName = wb.SheetNames.find(n => /invest/i.test(n));
      let investments: Investment[] = [];
      if (invSheetName && wb.Sheets[invSheetName]) {
        const rawInvRows = XLSX.utils.sheet_to_json<any>(wb.Sheets[invSheetName]);
        investments = rawInvRows.map((row, idx) => ({
          id: row.ID || `inv_xl_${now}_${idx}`,
          name: row.Name || `Investment ${idx + 1}`,
          category: (row.Category as InvestmentCategory) || 'MUTUAL_FUNDS',
          investedAmount: Number(row.InvestedAmount || 0),
          currentValue: Number(row.CurrentValue || row.InvestedAmount || 0),
          purchaseDate: row.PurchaseDate || new Date().toISOString().substring(0, 10),
          folioNumber: row.FolioNumber || '',
          notes: row.Notes || '',
          updatedAt: now,
        }));
      }

      // Parse Loans
      const loanSheetName = wb.SheetNames.find(n => /loan/i.test(n));
      let loans: Loan[] = [];
      if (loanSheetName && wb.Sheets[loanSheetName]) {
        const rawLoanRows = XLSX.utils.sheet_to_json<any>(wb.Sheets[loanSheetName]);
        loans = rawLoanRows.map((row, idx) => ({
          id: row.ID || `loan_xl_${now}_${idx}`,
          name: row.Name || `Loan ${idx + 1}`,
          type: (row.Type as LoanType) || 'PERSONAL',
          lenderName: row.LenderName || row.Lender || 'Bank',
          principalAmount: Number(row.PrincipalAmount || 0),
          interestRateAnnual: Number(row.InterestRateAnnual || row.InterestRate || 10),
          tenureMonths: Number(row.TenureMonths || 36),
          emiAmount: Number(row.EmiAmount || row.MonthlyEMI || 0),
          outstandingPrincipal: Number(row.OutstandingPrincipal || row.PrincipalAmount || 0),
          startDate: row.StartDate || new Date().toISOString().substring(0, 10),
          nextPaymentDate: row.NextPaymentDate || new Date().toISOString().substring(0, 10),
          notes: row.Notes || '',
          createdAt: now,
        }));
      }

      // Parse Debts
      const debtSheetName = wb.SheetNames.find(n => /debt/i.test(n));
      let debts: DebtRecord[] = [];
      if (debtSheetName && wb.Sheets[debtSheetName]) {
        const rawDebtRows = XLSX.utils.sheet_to_json<any>(wb.Sheets[debtSheetName]);
        debts = rawDebtRows.map((row, idx) => ({
          id: row.ID || `debt_xl_${now}_${idx}`,
          personName: row.PersonName || `Person ${idx + 1}`,
          type: (row.Type as 'LENT' | 'BORROWED') || 'LENT',
          amount: Number(row.Amount || 0),
          remainingAmount: Number(row.RemainingAmount || row.Amount || 0),
          isSettled: String(row.IsSettled || '').toLowerCase() === 'yes',
          dueDate: row.DueDate || '',
          notes: row.Notes || '',
          createdAt: now,
        }));
      }

      // Parse Subscriptions
      const subSheetName = wb.SheetNames.find(n => /subscri/i.test(n));
      let subscriptions: Subscription[] = [];
      if (subSheetName && wb.Sheets[subSheetName]) {
        const rawSubRows = XLSX.utils.sheet_to_json<any>(wb.Sheets[subSheetName]);
        subscriptions = rawSubRows.map((row, idx) => ({
          id: row.ID || `sub_xl_${now}_${idx}`,
          name: row.Name || `Subscription ${idx + 1}`,
          amount: Number(row.Amount || 0),
          frequency: (row.Frequency as RecurrenceFrequency) || 'MONTHLY',
          categoryName: row.CategoryName || 'Entertainment',
          nextBillingDate: row.NextBillingDate || new Date().toISOString().substring(0, 10),
          icon: row.Icon || 'Flame',
          color: row.Color || '#8B5CF6',
          isActive: String(row.IsActive || row.Active || '').toLowerCase() !== 'no',
        }));
      }

      // Parse Goals
      const goalSheetName = wb.SheetNames.find(n => /goal/i.test(n));
      let goals: Goal[] = [];
      if (goalSheetName && wb.Sheets[goalSheetName]) {
        const rawGoalRows = XLSX.utils.sheet_to_json<any>(wb.Sheets[goalSheetName]);
        goals = rawGoalRows.map((row, idx) => ({
          id: row.ID || `goal_xl_${now}_${idx}`,
          name: row.Name || `Goal ${idx + 1}`,
          targetAmount: Number(row.TargetAmount || 0),
          currentAmount: Number(row.CurrentAmount || 0),
          targetDate: row.TargetDate || '',
          status: (row.Status as any) || 'IN_PROGRESS',
          icon: row.Icon || 'Target',
          color: row.Color || '#8B5CF6',
          allocations: [],
          createdAt: now,
          updatedAt: now,
        }));
      }

      parsedState.transactions = transactions;
      parsedState.accounts = accounts;
      parsedState.creditCards = creditCards;
      parsedState.categories = categories;
      parsedState.budgets = budgets;
      parsedState.investments = investments;
      parsedState.loans = loans;
      parsedState.debts = debts;
      parsedState.subscriptions = subscriptions;
      parsedState.goals = goals;

      return {
        fileType: 'EXCEL',
        fileName,
        isValid: true,
        counts: {
          transactions: transactions.length,
          accounts: accounts.length,
          creditCards: creditCards.length,
          categories: categories.length,
          budgets: budgets.length,
          investments: investments.length,
          loans: loans.length,
          debts: debts.length,
          subscriptions: subscriptions.length,
          recurring: 0,
          goals: goals.length,
          templates: 0,
        },
        data: parsedState,
        rawTransactionsPreview: transactions.slice(0, 50),
      };
    }

    // 3. CSV FILE PARSING (.csv)
    if (lowerName.endsWith('.csv')) {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        throw new Error('CSV file contains no data rows.');
      }

      const rawHeaders = parseCsvLine(lines[0]);
      const headerMap: { [key: string]: number } = {};
      rawHeaders.forEach((h, idx) => {
        const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        headerMap[clean] = idx;
      });

      const getCol = (row: string[], ...aliases: string[]): string => {
        for (const alias of aliases) {
          const idx = headerMap[alias.toLowerCase().replace(/[^a-z0-9]/g, '')];
          if (idx !== undefined && row[idx] !== undefined) {
            return row[idx].replace(/^"|"$/g, '').trim();
          }
        }
        return '';
      };

      const now = Date.now();
      const transactions: Transaction[] = [];
      const discoveredAccounts = new Set<string>();
      const discoveredCategories = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]);
        if (row.length === 0 || (row.length === 1 && !row[0])) continue;

        const dateStr = getCol(row, 'date', 'txndate', 'time') || new Date().toISOString().substring(0, 10);
        const timeStr = getCol(row, 'time') || '12:00';
        const rawAmount = getCol(row, 'amount', 'amt', 'value', 'transactionamount', 'price');
        const amount = Math.abs(parseFloat(rawAmount.replace(/[^0-9.-]/g, '')) || 0);
        const title = getCol(row, 'title', 'merchant', 'description', 'titlemerchant', 'payee', 'name');
        const category = getCol(row, 'category', 'categoryname') || 'General';
        const subcategory = getCol(row, 'subcategory', 'subcat');
        const rawType = getCol(row, 'type', 'transactiontype', 'income').toUpperCase();
        const account = getCol(row, 'account', 'accountsource', 'wallet', 'fromaccount');
        const toAccount = getCol(row, 'destinationaccount', 'toaccount', 'destination');
        const creditCard = getCol(row, 'creditcard', 'card');
        const paymentApp = getCol(row, 'paymentchannel', 'paymentapp', 'channel');
        const notes = getCol(row, 'notes', 'note', 'memo', 'remark');
        const tags = getCol(row, 'tags', 'tag');

        if (account) discoveredAccounts.add(account);
        if (toAccount) discoveredAccounts.add(toAccount);
        if (category) discoveredCategories.add(category);

        let type: TransactionType = 'EXPENSE';
        if (rawType.includes('INCOME') || rawType === 'TRUE' || rawType === '1') {
          type = 'INCOME';
        } else if (rawType.includes('TRANSFER')) {
          type = 'TRANSFER';
        } else if (rawType.includes('CARD')) {
          type = 'CARD_PAYMENT';
        }

        transactions.push({
          id: `tx_csv_${now}_${i}`,
          date: dateStr.substring(0, 10),
          time: timeStr,
          timestamp: new Date(`${dateStr}T${timeStr}:00`).getTime() || now,
          type,
          amount,
          merchantName: title || category,
          categoryName: category,
          categoryId: 'misc_expense',
          subcategory: subcategory || undefined,
          accountName: account || (creditCard ? undefined : 'Main Account'),
          toAccountName: toAccount || undefined,
          creditCardName: creditCard || undefined,
          paymentAppName: paymentApp || undefined,
          notes: notes || undefined,
          tags: tags ? tags.split(',').map(s => s.trim()) : [],
          createdAt: now,
          updatedAt: now,
        });
      }

      const generatedAccounts: Account[] = Array.from(discoveredAccounts).map((name, idx) => ({
        id: `acc_csv_${now}_${idx}`,
        name,
        institution: name.includes('Bank') ? name : 'Personal',
        type: 'SAVINGS',
        openingBalance: 0,
        calculatedBalance: 0,
        icon: 'Landmark',
        color: '#0284C7',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }));

      const generatedCategories: Category[] = Array.from(discoveredCategories).map((name, idx) => ({
        id: `cat_csv_${now}_${idx}`,
        name,
        type: 'EXPENSE',
        icon: 'Tag',
        color: '#3B82F6',
        subcategories: [],
        order: idx + 1,
        isCustom: true,
      }));

      return {
        fileType: 'CSV',
        fileName,
        isValid: true,
        counts: {
          transactions: transactions.length,
          accounts: generatedAccounts.length,
          creditCards: 0,
          categories: generatedCategories.length,
          budgets: 0,
          investments: 0,
          loans: 0,
          debts: 0,
          subscriptions: 0,
          recurring: 0,
          goals: 0,
          templates: 0,
        },
        data: {
          transactions,
          accounts: generatedAccounts,
          categories: generatedCategories,
        },
        rawTransactionsPreview: transactions.slice(0, 50),
      };
    }

    throw new Error('Unsupported file extension. Please upload an Excel (.xlsx, .xls), CSV (.csv), or JSON (.json) file.');
  } catch (err: any) {
    return {
      fileType: 'UNKNOWN',
      fileName,
      isValid: false,
      errorMessage: err?.message || 'Failed to parse file.',
      counts: {
        transactions: 0,
        accounts: 0,
        creditCards: 0,
        categories: 0,
        budgets: 0,
        investments: 0,
        loans: 0,
        debts: 0,
        subscriptions: 0,
        recurring: 0,
        goals: 0,
        templates: 0,
      },
      data: {},
      rawTransactionsPreview: [],
    };
  }
}

/**
 * Executes the state integration from parsed file data into the application
 */
export function executeAppImport(
  parsed: ParsedAppImportData,
  options: AppImportExecutionOptions,
  currentState: LocalStorageState
): LocalStorageState {
  const isReplace = options.mode === 'REPLACE';
  const now = Date.now();

  let finalAccounts = isReplace ? [] : [...currentState.accounts];
  let finalCreditCards = isReplace ? [] : [...currentState.creditCards];
  let finalCategories = isReplace ? [...DEFAULT_CATEGORIES] : [...currentState.categories];
  let finalTransactions = isReplace ? [] : [...currentState.transactions];
  let finalBudgets = isReplace ? [] : [...currentState.budgets];
  let finalInvestments = isReplace ? [] : [...currentState.investments];
  let finalLoans = isReplace ? [] : [...currentState.loans];
  let finalDebts = isReplace ? [] : [...currentState.debts];
  let finalSubscriptions = isReplace ? [] : [...currentState.subscriptions];
  let finalGoals = isReplace ? [] : [...(currentState.goals || [])];
  let finalTemplates = isReplace ? [...DEFAULT_TEMPLATES] : [...(currentState.templates || DEFAULT_TEMPLATES)];

  const importedData = parsed.data;

  // 1. Process Accounts & Credit Cards
  if (options.importAccounts) {
    if (importedData.accounts && importedData.accounts.length > 0) {
      importedData.accounts.forEach(impAcc => {
        const existingIdx = finalAccounts.findIndex(
          a => a.id === impAcc.id || a.name.toLowerCase() === impAcc.name.toLowerCase()
        );
        if (existingIdx >= 0 && !isReplace) {
          finalAccounts[existingIdx] = { ...finalAccounts[existingIdx], ...impAcc };
        } else {
          finalAccounts.push(impAcc);
        }
      });
    }

    if (importedData.creditCards && importedData.creditCards.length > 0) {
      importedData.creditCards.forEach(impCard => {
        const existingIdx = finalCreditCards.findIndex(
          c => c.id === impCard.id || c.name.toLowerCase() === impCard.name.toLowerCase()
        );
        if (existingIdx >= 0 && !isReplace) {
          finalCreditCards[existingIdx] = { ...finalCreditCards[existingIdx], ...impCard };
        } else {
          finalCreditCards.push(impCard);
        }
      });
    }
  }

  // Ensure at least one account exists
  if (finalAccounts.length === 0 && finalCreditCards.length === 0) {
    finalAccounts.push({
      id: `acc_default_${now}`,
      name: 'Main Account',
      institution: 'Personal',
      type: 'SAVINGS',
      openingBalance: 0,
      calculatedBalance: 0,
      icon: 'Landmark',
      color: '#0284C7',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 2. Process Categories
  if (options.importCategories && importedData.categories && importedData.categories.length > 0) {
    importedData.categories.forEach(impCat => {
      const existingIdx = finalCategories.findIndex(
        c => c.id === impCat.id || c.name.toLowerCase() === impCat.name.toLowerCase()
      );
      if (existingIdx >= 0) {
        const mergedSubs = Array.from(
          new Set([...(finalCategories[existingIdx].subcategories || []), ...(impCat.subcategories || [])])
        );
        finalCategories[existingIdx] = {
          ...finalCategories[existingIdx],
          subcategories: mergedSubs,
        };
      } else {
        finalCategories.push({
          ...impCat,
          id: impCat.id || `cat_imp_${now}_${Math.random().toString(36).substring(2, 6)}`,
          order: finalCategories.length + 1,
        });
      }
    });
  }

  // 3. Process Transactions
  if (options.importTransactions && importedData.transactions && importedData.transactions.length > 0) {
    const existingFingerprints = new Set(
      finalTransactions.map(t => `${t.date}_${t.amount.toFixed(2)}_${t.type}_${t.merchantName || ''}_${t.notes || ''}`)
    );

    const primaryAcc = finalAccounts[0] || finalCreditCards[0];

    const findAccount = (id?: string, name?: string) => {
      if (id) {
        const byId = finalAccounts.find(a => a.id === id);
        if (byId) return byId;
      }
      if (name) {
        const cleanName = name.toLowerCase().trim();
        const byName = finalAccounts.find(a => a.name.toLowerCase().trim() === cleanName);
        if (byName) return byName;
      }
      return undefined;
    };

    const findCard = (id?: string, name?: string) => {
      if (id) {
        const byId = finalCreditCards.find(c => c.id === id);
        if (byId) return byId;
      }
      if (name) {
        const cleanName = name.toLowerCase().trim();
        const byName = finalCreditCards.find(c => c.name.toLowerCase().trim() === cleanName);
        if (byName) return byName;
      }
      return undefined;
    };

    importedData.transactions.forEach((t, idx) => {
      const fingerprint = `${t.date}_${t.amount.toFixed(2)}_${t.type}_${t.merchantName || ''}_${t.notes || ''}`;
      if (options.skipDuplicates && existingFingerprints.has(fingerprint)) {
        return;
      }

      // 1. Source Account / Card Resolution
      let matchedAccId: string | undefined = undefined;
      let matchedAccName: string | undefined = t.accountName;
      let matchedCardId: string | undefined = undefined;
      let matchedCardName: string | undefined = t.creditCardName;

      const srcCard = findCard(t.creditCardId, t.creditCardName) || findCard(t.accountId, t.accountName);
      if (srcCard) {
        matchedCardId = srcCard.id;
        matchedCardName = srcCard.name;
      } else {
        const srcAcc = findAccount(t.accountId, t.accountName) || findAccount(t.creditCardId, t.creditCardName);
        if (srcAcc) {
          matchedAccId = srcAcc.id;
          matchedAccName = srcAcc.name;
        }
      }

      if (!matchedAccId && !matchedCardId && primaryAcc) {
        if ('creditLimit' in primaryAcc) {
          matchedCardId = primaryAcc.id;
          matchedCardName = primaryAcc.name;
        } else {
          matchedAccId = primaryAcc.id;
          matchedAccName = primaryAcc.name;
        }
      }

      // 2. Destination Account / Card Resolution
      let matchedToAccId: string | undefined = undefined;
      let matchedToAccName: string | undefined = t.toAccountName;
      let matchedToCardId: string | undefined = undefined;
      let matchedToCardName: string | undefined = t.toCreditCardName;

      const destCard = findCard(t.toCreditCardId, t.toCreditCardName) || findCard(t.toAccountId, t.toAccountName);
      if (destCard) {
        matchedToCardId = destCard.id;
        matchedToCardName = destCard.name;
      } else {
        const destAcc = findAccount(t.toAccountId, t.toAccountName) || findAccount(t.toCreditCardId, t.toCreditCardName);
        if (destAcc) {
          matchedToAccId = destAcc.id;
          matchedToAccName = destAcc.name;
        }
      }

      // 3. Category Resolution
      let matchedCatId = t.categoryId;
      let matchedCatName = t.categoryName;
      const foundCat = finalCategories.find(
        c => c.id === t.categoryId || c.name.toLowerCase().trim() === (t.categoryName || '').toLowerCase().trim()
      );
      if (foundCat) {
        matchedCatId = foundCat.id;
        matchedCatName = foundCat.name;
      }

      finalTransactions.push({
        ...t,
        id: t.id || `tx_imp_${now}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        accountId: matchedAccId,
        accountName: matchedAccName,
        creditCardId: matchedCardId,
        creditCardName: matchedCardName,
        toAccountId: matchedToAccId,
        toAccountName: matchedToAccName,
        toCreditCardId: matchedToCardId,
        toCreditCardName: matchedToCardName,
        categoryId: matchedCatId || 'misc_expense',
        categoryName: matchedCatName || 'General',
      });
    });
  }

  // 4. Process Budgets
  if (options.importBudgets && importedData.budgets && importedData.budgets.length > 0) {
    importedData.budgets.forEach(b => {
      if (!finalBudgets.some(fb => fb.name.toLowerCase() === b.name.toLowerCase())) {
        finalBudgets.push(b);
      }
    });
  }

  // 5. Process Investments
  if (options.importInvestments && importedData.investments && importedData.investments.length > 0) {
    importedData.investments.forEach(i => {
      if (!finalInvestments.some(fi => fi.name.toLowerCase() === i.name.toLowerCase())) {
        finalInvestments.push(i);
      }
    });
  }

  // 6. Process Loans
  if (options.importLoans && importedData.loans && importedData.loans.length > 0) {
    importedData.loans.forEach(l => {
      if (!finalLoans.some(fl => fl.name.toLowerCase() === l.name.toLowerCase())) {
        finalLoans.push(l);
      }
    });
  }

  // 7. Process Debts
  if (options.importDebts && importedData.debts && importedData.debts.length > 0) {
    importedData.debts.forEach(d => {
      finalDebts.push(d);
    });
  }

  // 8. Process Subscriptions
  if (options.importSubscriptions && importedData.subscriptions && importedData.subscriptions.length > 0) {
    importedData.subscriptions.forEach(s => {
      if (!finalSubscriptions.some(fs => fs.name.toLowerCase() === s.name.toLowerCase())) {
        finalSubscriptions.push(s);
      }
    });
  }

  // 9. Process Goals
  if (options.importGoals && importedData.goals && importedData.goals.length > 0) {
    importedData.goals.forEach(g => {
      if (!finalGoals.some(fg => fg.name.toLowerCase() === g.name.toLowerCase())) {
        finalGoals.push(g);
      }
    });
  }

  // Recalculate balances and outstanding liabilities across all imported/merged entities
  const computed = recalculateAllBalances(
    finalAccounts,
    finalCreditCards,
    finalInvestments,
    finalLoans,
    finalDebts,
    finalTransactions
  );

  // Generate audit activity log
  const newActivityLog = createActivityEntry(
    'SYSTEM',
    'IMPORT',
    `Imported ${parsed.counts.transactions} transactions, ${parsed.counts.accounts} accounts, and financial entities from ${parsed.fileType} (${parsed.fileName})`
  );

  const finalState: LocalStorageState = {
    ...currentState,
    accounts: computed.accounts,
    creditCards: computed.cards,
    categories: finalCategories,
    transactions: finalTransactions,
    budgets: finalBudgets,
    investments: computed.investments,
    loans: computed.loans,
    debts: computed.debts,
    subscriptions: finalSubscriptions,
    goals: finalGoals,
    templates: finalTemplates,
    settings: importedData.settings ? { ...currentState.settings, ...importedData.settings } : currentState.settings,
    activityLogs: [newActivityLog, ...(currentState.activityLogs || [])].slice(0, 2000),
  };

  return finalState;
}
