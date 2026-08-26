import JSZip from 'jszip';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js/dist/sql-asm.js';
import {
  Account,
  CreditCard,
  Category,
  Transaction,
  Budget,
  Goal,
  Subscription,
  DebtRecord,
  RecurringTransaction,
  TransactionType,
  LocalStorageState,
  CardNetwork,
  CardTheme,
} from '../types';
import { CURRENCY_RATES, convertCurrency } from './currency';
import {
  DEFAULT_CATEGORIES,
  BANK_CREDIT_CARDS_CATALOG,
  INDIAN_BANKS,
  CARD_NETWORKS,
} from './constants';

export type CashewTargetType = 'BANK' | 'CREDIT_CARD' | 'WALLET' | 'EXISTING_ACCOUNT' | 'EXISTING_CARD' | 'IGNORE';

export interface CashewDiscoveredAccount {
  rawName: string;
  transactionCount: number;
  totalSpent: number;
  totalReceived: number;
  firstDate?: string;
  lastDate?: string;
  sampleTransactions: { notes: string; amount: number; date: string }[];
  suggestedTarget: CashewTargetType;
  suggestedIssuer?: string;
  suggestedPresetCardId?: string;
  suggestedCardVariant?: string;
  suggestedNetwork?: CardNetwork;
  suggestedLimit?: number;
  suggestedStatementDay?: number;
  suggestedDueDay?: number;
  suggestedBankInstitution?: string;
  suggestedBankAccountType?: 'SAVINGS' | 'CURRENT' | 'SALARY';
  suggestedTheme?: string;
}

export interface CashewAccountConfig {
  targetType: CashewTargetType;
  
  // Bank Account options
  bankInstitution?: string;
  bankAccountType?: 'SAVINGS' | 'CURRENT' | 'SALARY';
  bankName?: string;
  bankLastFour?: string;
  bankOpeningBalance?: number;
  bankTheme?: string;
  
  // Credit Card options
  cardName?: string;
  cardIssuer?: string;
  cardVariant?: string;
  cardNetwork?: CardNetwork;
  creditLimit?: number;
  statementDate?: number;
  dueDate?: number;
  cardTheme?: string;
  cardLastFour?: string;
  cardOpeningBalance?: number;
  
  // Wallet options
  walletName?: string;
  walletOpeningBalance?: number;
  walletIcon?: string;
  walletColor?: string;
  
  // Existing Map option
  existingId?: string;
}

export interface CashewAccountMappingConfig {
  [rawCashewAccountName: string]: CashewAccountConfig;
}

export interface CashewImportResult {
  accounts: Account[];
  creditCards: CreditCard[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  subscriptions: Subscription[];
  debts: DebtRecord[];
  recurring: RecurringTransaction[];
  discoveredAccounts: CashewDiscoveredAccount[];
  stats: {
    totalTransactions: number;
    incomeCount: number;
    expenseCount: number;
    transferCount: number;
    cardPaymentCount: number;
    totalIncome: number;
    totalExpense: number;
    accountsCount: number;
    creditCardsCount: number;
    categoriesCount: number;
    budgetsCount: number;
    goalsCount: number;
    debtsCount: number;
    recurringCount: number;
    currenciesDetected: string[];
    dateRange: { start: string; end: string } | null;
  };
  warnings: string[];
}

export interface CashewImportOptions {
  mode: 'MERGE' | 'REPLACE';
  defaultAccountId?: string;
  defaultCurrency?: string;
  autoConvertForeignCurrencies?: boolean;
  createMissingCategories?: boolean;
  createMissingAccounts?: boolean;
  accountMappings?: CashewAccountMappingConfig;
  pairTransfersAndCardPayments?: boolean;
  skipDuplicates?: boolean;
}

// Singleton SQLite Engine Promise
let sqlJsPromise: Promise<SqlJsStatic> | null = null;
export async function getSqlJsEngine(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs();
  }
  return sqlJsPromise;
}

/**
 * Intelligent account analysis and preset suggestions for any Cashew account name
 */
export function analyzeCashewAccountName(name: string): Partial<CashewDiscoveredAccount> {
  const lower = name.toLowerCase().trim();
  
  // 1. Check if it is a Credit Card
  const isCard =
    lower.includes('cc') ||
    lower.includes('credit') ||
    lower.includes('card') ||
    lower.includes('visa') ||
    lower.includes('mastercard') ||
    lower.includes('rupay') ||
    lower.includes('amex') ||
    lower.includes('millennia') ||
    lower.includes('neo') ||
    lower.includes('scapia') ||
    lower.includes('coral') ||
    lower.includes('regalia') ||
    lower.includes('infinia') ||
    lower.includes('sapphiro') ||
    lower.includes('rubyx') ||
    lower.includes('flipkart') ||
    lower.includes('amazon pay') ||
    lower.includes('makemytrip') ||
    lower.includes('swiggy hdfc') ||
    lower.includes('tata neu');

  if (isCard) {
    // Try matching with 60+ verified catalog
    const matchedPreset = BANK_CREDIT_CARDS_CATALOG.find(c => {
      const cName = c.name.toLowerCase();
      const cIssuer = c.issuer.toLowerCase();
      return (
        lower.includes(cName) ||
        (lower.includes(cIssuer) && lower.includes(c.name.toLowerCase())) ||
        (lower.includes('amazon') && cName.includes('amazon')) ||
        (lower.includes('flipkart') && cName.includes('flipkart')) ||
        (lower.includes('millennia') && cName.includes('millennia')) ||
        (lower.includes('neo') && cName.includes('neo')) ||
        (lower.includes('scapia') && cName.includes('scapia')) ||
        (lower.includes('coral') && cName.includes('coral')) ||
        (lower.includes('makemytrip') && cName.includes('makemytrip')) ||
        (lower.includes('swiggy') && cName.includes('swiggy')) ||
        (lower.includes('tata neu') && cName.includes('tata neu'))
      );
    });

    let detectedIssuer = 'HDFC Bank';
    if (lower.includes('icici')) detectedIssuer = 'ICICI Bank';
    else if (lower.includes('axis')) detectedIssuer = 'Axis Bank';
    else if (lower.includes('sbi')) detectedIssuer = 'State Bank of India';
    else if (lower.includes('federal')) detectedIssuer = 'Federal Bank';
    else if (lower.includes('kotak')) detectedIssuer = 'Kotak Mahindra Bank';
    else if (lower.includes('indusind')) detectedIssuer = 'IndusInd Bank';
    else if (lower.includes('hdfc')) detectedIssuer = 'HDFC Bank';
    else if (matchedPreset) detectedIssuer = matchedPreset.issuer;

    let detectedNetwork: CardNetwork = 'VISA';
    if (lower.includes('rupay')) detectedNetwork = 'RUPAY';
    else if (lower.includes('mastercard') || lower.includes('master')) detectedNetwork = 'MASTERCARD';
    else if (lower.includes('amex') || lower.includes('american express')) detectedNetwork = 'AMEX';
    else if (lower.includes('diners')) detectedNetwork = 'DINERS';
    else if (matchedPreset) detectedNetwork = matchedPreset.network;

    let theme: CardTheme | string = 'sapphire';
    if (lower.includes('metal') || lower.includes('infinia') || lower.includes('magnus')) theme = 'carbon';
    else if (lower.includes('coral')) theme = 'coral';
    else if (lower.includes('amazon') || lower.includes('flipkart')) theme = 'emerald';
    else if (lower.includes('neo') || lower.includes('axis')) theme = 'ruby';
    else if (lower.includes('scapia') || lower.includes('federal')) theme = 'ocean';
    else if (matchedPreset) theme = matchedPreset.theme;

    const variantName = matchedPreset?.name || name.replace(/cc|credit card|card/gi, '').trim();

    return {
      suggestedTarget: 'CREDIT_CARD',
      suggestedIssuer: detectedIssuer,
      suggestedPresetCardId: matchedPreset?.id,
      suggestedCardVariant: variantName,
      suggestedNetwork: detectedNetwork,
      suggestedLimit: matchedPreset?.limit || 100000,
      suggestedStatementDay: matchedPreset?.statementDay || 15,
      suggestedDueDay: matchedPreset?.dueDay || 5,
      suggestedTheme: theme,
    };
  }

  // 2. Check if it is a Cash / Digital Wallet
  const isWallet =
    lower.includes('cash') ||
    lower.includes('wallet') ||
    lower.includes('paytm') ||
    lower.includes('phonepe') ||
    lower.includes('amazon balance') ||
    lower.includes('gpay');

  if (isWallet) {
    return {
      suggestedTarget: 'WALLET',
      suggestedTheme: lower.includes('cash') ? '#10B981' : '#0D9488',
    };
  }

  // 3. Defaults to Bank Account
  const matchedBank = INDIAN_BANKS.find(b =>
    lower.includes(b.name.toLowerCase()) ||
    lower.includes(b.code.toLowerCase()) ||
    (lower.includes('federal') && b.name.includes('Federal')) ||
    (lower.includes('hdfc') && b.name.includes('HDFC')) ||
    (lower.includes('sbi') && b.name.includes('State Bank')) ||
    (lower.includes('icici') && b.name.includes('ICICI')) ||
    (lower.includes('axis') && b.name.includes('Axis')) ||
    (lower.includes('kotak') && b.name.includes('Kotak')) ||
    (lower.includes('pnb') && b.name.includes('Punjab')) ||
    (lower.includes('canara') && b.name.includes('Canara'))
  );

  const bankInstitution = matchedBank?.name || (name.includes('Bank') ? name : `${name} Bank`);
  const bankAccountType = lower.includes('salary') ? 'SALARY' : lower.includes('current') ? 'CURRENT' : 'SAVINGS';

  let bankTheme = 'hdfc_navy';
  if (bankInstitution.includes('State Bank') || bankInstitution.includes('SBI')) bankTheme = 'sbi_blue';
  else if (bankInstitution.includes('ICICI')) bankTheme = 'icici_orange';
  else if (bankInstitution.includes('Axis')) bankTheme = 'axis_burgundy';
  else if (bankInstitution.includes('Federal')) bankTheme = 'federal_gold';
  else if (bankInstitution.includes('Kotak')) bankTheme = 'kotak_red';
  else if (bankInstitution.includes('Punjab') || bankInstitution.includes('PNB')) bankTheme = 'pnb_maroon';
  else if (bankInstitution.includes('Canara')) bankTheme = 'canara_blue';
  else if (bankInstitution.includes('Bank of Baroda')) bankTheme = 'bob_orange';

  return {
    suggestedTarget: 'BANK',
    suggestedBankInstitution: bankInstitution,
    suggestedBankAccountType: bankAccountType,
    suggestedTheme: bankTheme,
  };
}

/**
 * Convert Cashew/Flutter ARGB integer or hex color to clean #RRGGBB format
 */
export function normalizeCashewColor(rawColor: any): string {
  if (!rawColor) return '#3B82F6';
  const str = String(rawColor).trim();
  
  if (str.startsWith('#')) {
    if (str.length === 9) {
      return `#${str.slice(3)}`;
    }
    return str;
  }
  
  if (str.startsWith('0x') || str.startsWith('0X')) {
    const hex = str.slice(2);
    if (hex.length === 8) {
      return `#${hex.slice(2)}`;
    }
    return `#${hex.padStart(6, '0')}`;
  }
  
  const num = parseInt(str, 10);
  if (!isNaN(num)) {
    const unsigned = (num >>> 0).toString(16).padStart(8, '0');
    return `#${unsigned.slice(2)}`;
  }
  
  return '#3B82F6';
}

/**
 * Maps Cashew Material icon names to application icon strings
 */
export function mapCashewIcon(iconName?: string, categoryName?: string): string {
  if (!iconName && !categoryName) return 'Layers';
  const icon = (iconName || '').toLowerCase();
  const cat = (categoryName || '').toLowerCase();

  if (icon.includes('food') || icon.includes('restaurant') || icon.includes('fastfood') || icon.includes('dining') || cat.includes('food') || cat.includes('dining') || cat.includes('grocer') || icon.includes('cutlery') || icon.includes('popcorn')) {
    return 'Utensils';
  }
  if (icon.includes('shopping') || icon.includes('cart') || icon.includes('bag') || cat.includes('shopping')) {
    return 'ShoppingBag';
  }
  if (icon.includes('flight') || icon.includes('plane') || icon.includes('travel') || icon.includes('hotel') || cat.includes('travel') || cat.includes('trip') || cat.includes('transit')) {
    return 'Plane';
  }
  if (icon.includes('car') || icon.includes('fuel') || icon.includes('gas') || icon.includes('commute') || icon.includes('taxi') || cat.includes('transport') || cat.includes('fuel')) {
    return 'Car';
  }
  if (icon.includes('home') || icon.includes('house') || icon.includes('rent') || cat.includes('housing') || cat.includes('rent')) {
    return 'Home';
  }
  if (icon.includes('movie') || icon.includes('entertainment') || icon.includes('game') || icon.includes('music') || cat.includes('entertainment') || cat.includes('ott')) {
    return 'Film';
  }
  if (icon.includes('health') || icon.includes('med') || icon.includes('hospital') || icon.includes('fitness') || icon.includes('gym') || cat.includes('health') || cat.includes('fitness') || cat.includes('insurance')) {
    return 'Activity';
  }
  if (icon.includes('bill') || icon.includes('receipt') || icon.includes('electric') || icon.includes('utility') || cat.includes('utility') || cat.includes('bill') || cat.includes('fee')) {
    return 'Zap';
  }
  if (icon.includes('money') || icon.includes('cash') || icon.includes('salary') || icon.includes('income') || cat.includes('salary') || cat.includes('income') || cat.includes('invest') || icon.includes('piggy')) {
    return 'Briefcase';
  }
  if (icon.includes('school') || icon.includes('book') || icon.includes('education') || cat.includes('education') || cat.includes('learning')) {
    return 'GraduationCap';
  }
  if (icon.includes('gift') || cat.includes('gift') || cat.includes('donate')) {
    return 'Gift';
  }
  if (icon.includes('coffee') || icon.includes('cafe')) {
    return 'Coffee';
  }
  if (icon.includes('phone') || icon.includes('mobile') || icon.includes('wifi')) {
    return 'Smartphone';
  }
  if (icon.includes('bank') || icon.includes('account') || icon.includes('wallet')) {
    return 'Landmark';
  }

  return 'Tag';
}

/**
 * Robust date and time parsing from any string, ISO, or timestamp format
 */
export function parseCashewDateTime(rawDate: any): { date: string; time: string; timestamp: number } {
  const now = new Date();
  if (!rawDate && rawDate !== 0) {
    const date = now.toISOString().substring(0, 10);
    const time = now.toTimeString().substring(0, 5);
    return { date, time, timestamp: now.getTime() };
  }

  const str = String(rawDate).trim();
  let parsed = new Date(str);

  if (isNaN(parsed.getTime()) && str.includes(' ')) {
    parsed = new Date(str.replace(' ', 'T'));
  }

  if (isNaN(parsed.getTime())) {
    const num = Number(str);
    if (!isNaN(num) && num > 100000) {
      if (num > 10000000000000) {
        parsed = new Date(Math.floor(num / 1000));
      } else if (num > 100000000000) {
        parsed = new Date(num);
      } else {
        parsed = new Date(num * 1000);
      }
    } else {
      const parts = str.split(/[\/\-\sT:]/);
      if (parts.length >= 3) {
        if (parts[0].length === 4) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          const hh = parts[3] ? parseInt(parts[3], 10) : 12;
          const mm = parts[4] ? parseInt(parts[4], 10) : 0;
          parsed = new Date(y, m, d, hh, mm);
        } else if (parts[2].length === 4) {
          const p1 = parseInt(parts[0], 10);
          const p2 = parseInt(parts[1], 10);
          const y = parseInt(parts[2], 10);
          const d = p1 > 12 ? p1 : (p2 > 12 ? p2 : p1);
          const m = p1 > 12 ? p2 - 1 : (p2 > 12 ? p1 - 1 : p2 - 1);
          parsed = new Date(y, m, d, 12, 0);
        }
      }
    }
  }

  if (isNaN(parsed.getTime())) {
    parsed = now;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const date = `${year}-${month}-${day}`;

  const hours = String(parsed.getHours()).padStart(2, '0');
  const mins = String(parsed.getMinutes()).padStart(2, '0');
  const time = `${hours}:${mins}`;

  return { date, time, timestamp: parsed.getTime() };
}

/**
 * Parses CSV lines handling quoted fields, commas, escaped quotes and CRLF
 */
export function parseCSVToRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  const text = csvText.charCodeAt(0) === 0xFEFF ? csvText.slice(1) : csvText;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === ';' || char === '\t') && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.length > 0 && currentRow.some(f => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.length > 0 && currentRow.some(f => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Universal Cashew Import Parser: Accepts ArrayBuffer, Uint8Array, or string
 */
export async function parseCashewDataAsync(
  input: string | ArrayBuffer | Uint8Array,
  existingState: LocalStorageState,
  options: CashewImportOptions = {
    mode: 'MERGE',
    defaultCurrency: 'INR',
    autoConvertForeignCurrencies: true,
    createMissingAccounts: true,
    createMissingCategories: true,
    pairTransfersAndCardPayments: true,
  }
): Promise<CashewImportResult> {
  const warnings: string[] = [];

  // Check if input is binary
  if (typeof input !== 'string') {
    const uint8 = input instanceof Uint8Array ? input : new Uint8Array(input);

    // 1. Check if it is a ZIP archive (starts with PK\x03\x04)
    if (uint8.length >= 4 && uint8[0] === 0x50 && uint8[1] === 0x4B && uint8[2] === 0x03 && uint8[3] === 0x04) {
      return parseCashewZipBinary(uint8, existingState, options);
    }

    // 2. Check if it's an SQLite binary database
    const headerPrefix = String.fromCharCode(...uint8.slice(0, 15));
    if (headerPrefix.startsWith('SQLite format 3')) {
      return parseCashewSqliteBinary(uint8, existingState, options);
    }

    // Otherwise decode as UTF-8 text
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const textContent = decoder.decode(uint8);
    return parseCashewTextContent(textContent, existingState, options);
  }

  return parseCashewTextContent(input, existingState, options);
}

/**
 * Parse ZIP compressed Cashew backup
 */
async function parseCashewZipBinary(
  uint8: Uint8Array,
  existingState: LocalStorageState,
  options: CashewImportOptions
): Promise<CashewImportResult> {
  try {
    const zip = await JSZip.loadAsync(uint8);
    const files = Object.keys(zip.files).filter(name => !name.startsWith('__MACOSX') && !name.startsWith('.'));

    // Find the best database or export file inside the archive
    let bestFile = files.find(f => f.endsWith('.sqlite') || f.endsWith('.sqlite3') || f.endsWith('.db') || f.endsWith('.cashew'));
    if (!bestFile) bestFile = files.find(f => f.endsWith('.sql'));
    if (!bestFile) bestFile = files.find(f => f.endsWith('.json'));
    if (!bestFile) bestFile = files.find(f => f.endsWith('.csv'));
    if (!bestFile && files.length > 0) bestFile = files[0];

    if (bestFile) {
      const fileData = await zip.files[bestFile].async('uint8array');
      const res = await parseCashewDataAsync(fileData, existingState, options);
      res.warnings.unshift(`Extracted "${bestFile}" from ZIP archive.`);
      return res;
    }
  } catch (err: any) {
    // Fallback if ZIP parsing fails
  }

  // If zip extraction failed, try decoding binary
  const decoder = new TextDecoder('utf-8', { fatal: false });
  return parseCashewTextContent(decoder.decode(uint8), existingState, options);
}

/**
 * Parse text content (JSON, SQL, CSV)
 */
export function parseCashewData(
  content: string,
  existingState: LocalStorageState,
  options: CashewImportOptions = {
    mode: 'MERGE',
    defaultCurrency: 'INR',
    autoConvertForeignCurrencies: true,
    createMissingAccounts: true,
    createMissingCategories: true,
    pairTransfersAndCardPayments: true,
  }
): CashewImportResult {
  return parseCashewTextContent(content, existingState, options);
}

function parseCashewTextContent(
  content: string,
  existingState: LocalStorageState,
  options: CashewImportOptions
): CashewImportResult {
  const warnings: string[] = [];
  const trimmed = content.trim();

  // Try parsing as JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsedJson = JSON.parse(trimmed);
      return parseCashewJson(parsedJson, existingState, options, warnings);
    } catch {
      // Fallback to other parsers
    }
  }

  // Try parsing as SQL dump (e.g. Google Drive .sql backup)
  if (
    trimmed.includes('CREATE TABLE') ||
    trimmed.includes('INSERT INTO') ||
    trimmed.includes('BEGIN TRANSACTION') ||
    trimmed.includes('PRAGMA foreign_keys')
  ) {
    return parseCashewSqlText(trimmed, existingState, options, warnings);
  }

  // Standard CSV parse
  return parseCashewCsv(trimmed, existingState, options, warnings);
}

/**
 * Extract structured tables from an active SQLite Database instance
 */
function extractCashewDataFromSqliteDb(db: Database): {
  wallets: any[];
  categories: any[];
  transactions: any[];
  budgets: any[];
  goals: any[];
  subscriptions: any[];
} {
  const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  const rawTableNames = (tablesRes[0]?.values || []).map(v => String(v[0]));
  const tableNamesLower = rawTableNames.map(t => t.toLowerCase());

  const getTableRows = (tableNameCandidates: string[]): any[] => {
    // 1. Check exact match
    for (const cand of tableNameCandidates) {
      const idx = tableNamesLower.findIndex(t => t === cand.toLowerCase());
      if (idx !== -1) {
        const actualName = rawTableNames[idx];
        try {
          const res = db.exec(`SELECT * FROM "${actualName}"`);
          if (res.length > 0) {
            const cols = res[0].columns;
            return res[0].values.map(row => {
              const obj: any = {};
              cols.forEach((col, cIdx) => {
                obj[col] = row[cIdx];
              });
              return obj;
            });
          }
        } catch {
          // ignore error
        }
      }
    }

    // 2. Check substring match (e.g. tbl_wallet, app_wallets, user_accounts)
    for (const cand of tableNameCandidates) {
      const idx = tableNamesLower.findIndex(t => t.includes(cand.toLowerCase()));
      if (idx !== -1) {
        const actualName = rawTableNames[idx];
        try {
          const res = db.exec(`SELECT * FROM "${actualName}"`);
          if (res.length > 0) {
            const cols = res[0].columns;
            return res[0].values.map(row => {
              const obj: any = {};
              cols.forEach((col, cIdx) => {
                obj[col] = row[cIdx];
              });
              return obj;
            });
          }
        } catch {
          // ignore error
        }
      }
    }
    return [];
  };

  const rawWallets = getTableRows(['wallet', 'wallets', 'account', 'accounts', 'wallet_model', 'account_model', 'user_wallets']);
  const rawCategories = getTableRows(['category', 'categories', 'category_model', 'user_categories']);
  const rawTransactions = getTableRows(['transaction', 'transactions', 'transaction_model', 'user_transactions']);
  const rawBudgets = getTableRows(['budget', 'budgets']);
  const rawGoals = getTableRows(['objective', 'objectives', 'goal', 'goals']);
  const rawSubscriptions = getTableRows(['recurring_transaction', 'recurring', 'subscription', 'subscriptions', 'recurring_transactions']);

  // Normalize column names
  const wallets = rawWallets.map((w, idx) => ({
    wallet_pk: w.wallet_pk !== undefined ? w.wallet_pk : (w.id !== undefined ? w.id : (w.pk !== undefined ? w.pk : (w.wallet_id !== undefined ? w.wallet_id : `w_${idx}`))),
    name: (w.name || w.title || w.wallet_name || w.account_name || w.label || w.wallet_title || w.nickname || `Account ${idx + 1}`).trim(),
    colour: w.colour || w.color,
    icon_name: w.icon_name || w.iconName || w.icon,
    currency: w.currency,
    date_created: w.date_created || w.dateCreated || w.created_at,
  }));

  const categories = rawCategories.map((c, idx) => ({
    category_pk: c.category_pk !== undefined ? c.category_pk : (c.id !== undefined ? c.id : (c.pk !== undefined ? c.pk : (c.category_id !== undefined ? c.category_id : `c_${idx}`))),
    name: (c.name || c.title || c.category_name || c.label || 'General').trim(),
    colour: c.colour || c.color,
    icon_name: c.icon_name || c.iconName || c.icon,
    main_category_pk: c.main_category_pk || c.mainCategoryPk || c.parent_category_fk,
  }));

  // Build lookups
  const walletMap = new Map<string, string>();
  wallets.forEach(w => {
    if (w.wallet_pk !== undefined && w.wallet_pk !== null) {
      walletMap.set(String(w.wallet_pk).trim(), w.name);
    }
  });

  const categoryMap = new Map<string, string>();
  categories.forEach(c => {
    if (c.category_pk !== undefined && c.category_pk !== null) {
      categoryMap.set(String(c.category_pk).trim(), c.name);
    }
  });

  // Enrich transactions with resolved wallet & category names
  const transactions = rawTransactions.map(t => {
    const wFk = t.wallet_fk !== undefined && t.wallet_fk !== null ? String(t.wallet_fk).trim() : (t.account_fk !== undefined && t.account_fk !== null ? String(t.account_fk).trim() : '');
    const toWFk = t.to_wallet_fk !== undefined && t.to_wallet_fk !== null ? String(t.to_wallet_fk).trim() : (t.to_account_fk !== undefined && t.to_account_fk !== null ? String(t.to_account_fk).trim() : '');
    const cFk = t.category_fk !== undefined && t.category_fk !== null ? String(t.category_fk).trim() : '';
    const subCFk = t.sub_category_fk !== undefined && t.sub_category_fk !== null ? String(t.sub_category_fk).trim() : '';

    const resolvedWalletName = walletMap.get(wFk) || t.wallet_name || t.walletName || t.account || t.account_name || (wallets[0]?.name) || 'Cashew Account';
    const resolvedToWalletName = walletMap.get(toWFk) || t.to_wallet_name || t.toWalletName || t.to_account || undefined;
    const resolvedCategoryName = categoryMap.get(cFk) || t.category_name || t.categoryName || t.category || undefined;
    const resolvedSubcategoryName = categoryMap.get(subCFk) || t.subcategory_name || t.subCategoryName || t.subcategory || undefined;

    return {
      transaction_pk: t.transaction_pk || t.id || t.pk,
      name: t.name || t.title || '',
      amount: t.amount,
      note: t.note || t.notes || '',
      category_fk: t.category_fk,
      sub_category_fk: t.sub_category_fk,
      wallet_fk: t.wallet_fk,
      to_wallet_fk: t.to_wallet_fk,
      wallet_name: resolvedWalletName,
      to_wallet_name: resolvedToWalletName,
      category_name: resolvedCategoryName,
      subcategory_name: resolvedSubcategoryName,
      date_created: t.date_created || t.dateCreated || t.date,
      income: t.income,
      paid: t.paid,
      type: t.type,
      original_currency: t.original_currency || t.currency,
      exchange_rate: t.exchange_rate,
    };
  });

  return {
    wallets,
    categories,
    transactions,
    budgets: rawBudgets,
    goals: rawGoals,
    subscriptions: rawSubscriptions,
  };
}

/**
 * Parse SQLite Binary
 */
async function parseCashewSqliteBinary(
  uint8: Uint8Array,
  existingState: LocalStorageState,
  options: CashewImportOptions
): Promise<CashewImportResult> {
  const warnings: string[] = [];

  try {
    const SQL = await getSqlJsEngine();
    const db = new SQL.Database(uint8);
    const extractedData = extractCashewDataFromSqliteDb(db);

    // Build raw account names from:
    // 1. Wallets table (ALL wallets in the SQLite DB)
    // 2. Transactions wallet_name and to_wallet_name
    const rawAccountNames = new Set<string>();
    extractedData.wallets.forEach(w => {
      if (w.name) rawAccountNames.add(w.name.trim());
    });
    extractedData.transactions.forEach(t => {
      if (t.wallet_name) rawAccountNames.add(t.wallet_name.trim());
      if (t.to_wallet_name) rawAccountNames.add(t.to_wallet_name.trim());
    });

    if (rawAccountNames.size === 0) {
      rawAccountNames.add('Cashew Main Wallet');
    }

    const discoveredAccounts = buildDiscoveredAccounts(Array.from(rawAccountNames), extractedData.transactions);
    db.close();

    return buildImportResultFromData(
      extractedData,
      discoveredAccounts,
      existingState,
      options,
      warnings
    );
  } catch (err: any) {
    warnings.push(`SQLite binary engine error: ${err.message || String(err)}. Attempting string parsing fallback.`);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return parseCashewSqlText(decoder.decode(uint8), existingState, options, warnings);
  }
}

/**
 * Parse Cashew SQL text dump (e.g. SQLite database text export or Google Drive backup)
 */
function parseCashewSqlText(
  sqlContent: string,
  existingState: LocalStorageState,
  options: CashewImportOptions,
  warnings: string[]
): CashewImportResult {
  // First, try running in in-memory SQLite engine
  try {
    // Note: initSqlJs is sync loaded via asm or async engine
    // We try to execute synchronous SQL parse with fallback
    const extractedData = parseSqlTextWithFallback(sqlContent);

    const rawAccountNames = new Set<string>();
    extractedData.wallets.forEach(w => {
      if (w.name) rawAccountNames.add(w.name.trim());
    });
    extractedData.transactions.forEach(t => {
      if (t.wallet_name) rawAccountNames.add(t.wallet_name.trim());
      if (t.to_wallet_name) rawAccountNames.add(t.to_wallet_name.trim());
    });

    if (rawAccountNames.size === 0) {
      rawAccountNames.add('Cashew Main Wallet');
    }

    const discoveredAccounts = buildDiscoveredAccounts(Array.from(rawAccountNames), extractedData.transactions);

    return buildImportResultFromData(
      extractedData,
      discoveredAccounts,
      existingState,
      options,
      warnings
    );
  } catch (err: any) {
    warnings.push(`SQL text parse encountered: ${err.message || String(err)}`);
    return parseCashewCsv(sqlContent, existingState, options, warnings);
  }
}

/**
 * Robust SQL text parser extracting INSERT INTO statements
 */
function parseSqlTextWithFallback(sqlContent: string): {
  wallets: any[];
  categories: any[];
  transactions: any[];
  budgets: any[];
  goals: any[];
} {
  const rawWallets: any[] = [];
  const rawCategories: any[] = [];
  const rawTransactions: any[] = [];
  const rawBudgets: any[] = [];
  const rawGoals: any[] = [];

  // Match table inserts with or without column lists
  const insertRegex = /INSERT\s+INTO\s+["`']?([a-zA-Z0-9_]+)["`']?\s*(?:\(([^)]+)\))?\s*VALUES\s*(.+?);(?=\s*(?:INSERT|CREATE|PRAGMA|BEGIN|COMMIT|--|$))/gis;
  let match: RegExpExecArray | null;

  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const tableName = match[1].toLowerCase();
    const columnsStr = match[2];
    const valuesBlock = match[3];

    const columns = columnsStr ? columnsStr.split(',').map(c => c.replace(/["`']/g, '').trim().toLowerCase()) : null;
    const rows = splitSqlValuesTuples(valuesBlock);

    rows.forEach(vals => {
      if (tableName === 'wallet' || tableName === 'wallets' || tableName === 'account' || tableName === 'accounts') {
        const obj: any = {};
        if (columns) {
          columns.forEach((col, idx) => { obj[col] = vals[idx]; });
        } else {
          obj.wallet_pk = vals[0];
          obj.name = vals[1];
          obj.colour = vals[2];
          obj.date_created = vals[3];
          obj.order = vals[4];
          obj.currency = vals[5];
          obj.icon_name = vals[8] || vals[7];
        }
        obj.name = (obj.name || obj.title || `Wallet ${rawWallets.length + 1}`).trim();
        rawWallets.push(obj);
      } else if (tableName === 'category' || tableName === 'categories') {
        const obj: any = {};
        if (columns) {
          columns.forEach((col, idx) => { obj[col] = vals[idx]; });
        } else {
          obj.category_pk = vals[0];
          obj.name = vals[1];
          obj.colour = vals[2];
          obj.icon_name = vals[3];
          obj.order = vals[4];
          obj.main_category_pk = vals[5];
        }
        obj.name = (obj.name || obj.title || 'Category').trim();
        rawCategories.push(obj);
      } else if (tableName === 'transaction' || tableName === 'transactions') {
        const obj: any = {};
        if (columns) {
          columns.forEach((col, idx) => { obj[col] = vals[idx]; });
        } else {
          obj.transaction_pk = vals[0];
          obj.name = vals[1];
          obj.amount = vals[2];
          obj.note = vals[3];
          obj.category_fk = vals[4];
          obj.sub_category_fk = vals[5];
          obj.wallet_fk = vals[6];
          obj.to_wallet_fk = vals[7];
          obj.date_created = vals[8];
          obj.income = vals[9];
          obj.paid = vals[10];
          obj.skip_paid = vals[11];
          obj.type = vals[12];
          obj.original_currency = vals[13];
          obj.exchange_rate = vals[14];
        }
        rawTransactions.push(obj);
      }
    });
  }

  // Create dictionary maps
  const walletMap = new Map<string, string>();
  rawWallets.forEach(w => {
    const pk = w.wallet_pk || w.id || w.pk;
    if (pk) walletMap.set(String(pk), w.name);
  });

  const categoryMap = new Map<string, string>();
  rawCategories.forEach(c => {
    const pk = c.category_pk || c.id || c.pk;
    if (pk) categoryMap.set(String(pk), c.name);
  });

  // Enrich transactions
  const transactions = rawTransactions.map(t => {
    const wFk = t.wallet_fk !== undefined && t.wallet_fk !== null ? String(t.wallet_fk) : '';
    const toWFk = t.to_wallet_fk !== undefined && t.to_wallet_fk !== null ? String(t.to_wallet_fk) : '';
    const cFk = t.category_fk !== undefined && t.category_fk !== null ? String(t.category_fk) : '';
    const subCFk = t.sub_category_fk !== undefined && t.sub_category_fk !== null ? String(t.sub_category_fk) : '';

    return {
      ...t,
      wallet_name: walletMap.get(wFk) || t.wallet_name || t.walletName || (rawWallets[0]?.name) || 'Cashew Account',
      to_wallet_name: walletMap.get(toWFk) || t.to_wallet_name || t.toWalletName || undefined,
      category_name: categoryMap.get(cFk) || t.category_name || t.categoryName || undefined,
      subcategory_name: categoryMap.get(subCFk) || t.subcategory_name || undefined,
    };
  });

  return {
    wallets: rawWallets,
    categories: rawCategories,
    transactions,
    budgets: rawBudgets,
    goals: rawGoals,
  };
}

/**
 * Splits multiple SQL VALUES tuples e.g. VALUES (1, 'a'), (2, 'b')
 */
function splitSqlValuesTuples(valuesBlock: string): any[][] {
  const rows: any[][] = [];
  let inQuotes = false;
  let quoteChar = '';
  let inTuple = false;
  let currentTupleStr = '';

  for (let i = 0; i < valuesBlock.length; i++) {
    const char = valuesBlock[i];
    const prevChar = i > 0 ? valuesBlock[i - 1] : '';

    if ((char === "'" || char === '"') && prevChar !== '\\') {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
      }
    }

    if (!inQuotes) {
      if (char === '(' && !inTuple) {
        inTuple = true;
        currentTupleStr = '';
        continue;
      } else if (char === ')' && inTuple) {
        inTuple = false;
        rows.push(parseSqlValuesList(currentTupleStr));
        currentTupleStr = '';
        continue;
      }
    }

    if (inTuple) {
      currentTupleStr += char;
    }
  }

  return rows;
}

/**
 * Parses a single SQL comma-separated values tuple string
 */
function parseSqlValuesList(str: string): any[] {
  const result: any[] = [];
  let cur = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const prevCh = i > 0 ? str[i - 1] : '';

    if ((ch === "'" || ch === '"') && prevCh !== '\\') {
      if (!inQuote) {
        inQuote = true;
        quoteChar = ch;
      } else if (ch === quoteChar) {
        inQuote = false;
      }
      cur += ch;
    } else if (ch === ',' && !inQuote) {
      result.push(cleanSqlVal(cur));
      cur = '';
    } else {
      cur += ch;
    }
  }

  if (cur.length > 0 || result.length > 0) {
    result.push(cleanSqlVal(cur));
  }

  return result;
}

function cleanSqlVal(val: string): any {
  const trimmed = val.trim();
  if (!trimmed || trimmed.toUpperCase() === 'NULL') return null;
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'").replace(/\\'/g, "'");
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') return num;
  return trimmed;
}

/**
 * Parse Cashew JSON export
 */
function parseCashewJson(
  data: any,
  existingState: LocalStorageState,
  options: CashewImportOptions,
  warnings: string[]
): CashewImportResult {
  const rawWallets = Array.isArray(data.wallets) ? data.wallets : (Array.isArray(data.accounts) ? data.accounts : (Array.isArray(data.data?.wallets) ? data.data.wallets : []));
  const rawCategories = Array.isArray(data.categories) ? data.categories : (Array.isArray(data.data?.categories) ? data.data.categories : []);
  const rawTransactions = Array.isArray(data.transactions) ? data.transactions : (Array.isArray(data.data?.transactions) ? data.data.transactions : []);

  // Build wallet and category maps
  const walletMap = new Map<string, string>();
  rawWallets.forEach((w: any) => {
    const pk = w.wallet_pk || w.id || w.pk || w.walletId;
    const name = (w.name || w.title || w.walletName || 'Cashew Account').trim();
    if (pk) walletMap.set(String(pk), name);
    if (name) walletMap.set(name, name);
  });

  const categoryMap = new Map<string, string>();
  rawCategories.forEach((c: any) => {
    const pk = c.category_pk || c.id || c.pk || c.categoryId;
    const name = (c.name || c.title || c.categoryName || 'General').trim();
    if (pk) categoryMap.set(String(pk), name);
  });

  const rawAccountNames = new Set<string>();
  rawWallets.forEach((w: any) => {
    if (w.name) rawAccountNames.add(w.name.trim());
  });

  const enrichedTransactions = rawTransactions.map((t: any) => {
    const wFk = t.wallet_fk !== undefined && t.wallet_fk !== null ? String(t.wallet_fk) : '';
    const toWFk = t.to_wallet_fk !== undefined && t.to_wallet_fk !== null ? String(t.to_wallet_fk) : '';
    const cFk = t.category_fk !== undefined && t.category_fk !== null ? String(t.category_fk) : '';
    const subCFk = t.sub_category_fk !== undefined && t.sub_category_fk !== null ? String(t.sub_category_fk) : '';

    const resolvedWalletName = walletMap.get(wFk) || t.wallet_name || t.walletName || t.account || (rawWallets[0]?.name) || 'Cashew Account';
    const resolvedToWalletName = walletMap.get(toWFk) || t.to_wallet_name || t.toWalletName || undefined;
    const resolvedCategoryName = categoryMap.get(cFk) || t.category_name || t.categoryName || t.category || undefined;
    const resolvedSubcategoryName = categoryMap.get(subCFk) || t.subcategory_name || t.subCategoryName || t.subcategory || undefined;

    if (resolvedWalletName) rawAccountNames.add(resolvedWalletName);
    if (resolvedToWalletName) rawAccountNames.add(resolvedToWalletName);

    return {
      ...t,
      wallet_name: resolvedWalletName,
      to_wallet_name: resolvedToWalletName,
      category_name: resolvedCategoryName,
      subcategory_name: resolvedSubcategoryName,
    };
  });

  if (rawAccountNames.size === 0) {
    rawAccountNames.add('Cashew Main Wallet');
  }

  const discoveredAccounts = buildDiscoveredAccounts(Array.from(rawAccountNames), enrichedTransactions);

  return buildImportResultFromData(
    {
      wallets: rawWallets,
      categories: rawCategories,
      transactions: enrichedTransactions,
      budgets: data.budgets || data.data?.budgets || [],
      goals: data.goals || data.objectives || data.data?.goals || [],
      subscriptions: data.subscriptions || data.recurring || [],
    },
    discoveredAccounts,
    existingState,
    options,
    warnings
  );
}

/**
 * Parse Cashew CSV
 */
function parseCashewCsv(
  csvContent: string,
  existingState: LocalStorageState,
  options: CashewImportOptions,
  warnings: string[]
): CashewImportResult {
  const rows = parseCSVToRows(csvContent);
  if (rows.length < 2) {
    warnings.push('CSV contains no data rows.');
    return compileImportStats([], [], [], [], [], [], [], [], [], new Set(), warnings);
  }

  // Find the header row (skips potential export description preamble)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const rowStr = rows[i].join(' ').toLowerCase();
    if (rowStr.includes('account') || rowStr.includes('wallet') || rowStr.includes('amount') || rowStr.includes('date')) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders = rows[headerRowIndex].map(h => h.toLowerCase().trim());
  
  const getCol = (...names: string[]) => {
    for (const name of names) {
      const idx = rawHeaders.findIndex(h => h === name.toLowerCase() || h.includes(name.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const colDate = getCol('date', 'date_created', 'time', 'timestamp', 'txn date', 'datetime');
  const colAmount = getCol('amount', 'price', 'total', 'amount unpaid');
  const colAmountAlt = getCol('amount unpaid', 'amount_unpaid');
  const colType = getCol('type', 'transaction type', 'tx_type');
  const colIncome = getCol('income', 'is_income', 'isincome');
  const colCategory = getCol('category name', 'category', 'category_name', 'main category');
  const colSubcategory = getCol('subcategory name', 'subcategory', 'sub_category_name', 'sub category');
  const colWallet = getCol('account', 'wallet name', 'wallet', 'account name', 'wallet_name', 'source', 'from account');
  const colToWallet = getCol('transfer to account', 'to account', 'to wallet', 'destination', 'to_wallet', 'to account name');
  const colNote = getCol('note', 'notes', 'memo', 'description', 'narration');
  const colTitle = getCol('title', 'name');
  const colColor = getCol('color', 'colour', 'category color');
  const colCurrency = getCol('currency', 'curr');
  const colTags = getCol('tags', 'tag', 'labels');

  const rawAccountNames = new Set<string>();
  const rawTxList: any[] = [];

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    const walletName = colWallet !== -1 && row[colWallet] ? row[colWallet].trim() : 'Cashew Account';
    const toWalletName = colToWallet !== -1 && row[colToWallet] ? row[colToWallet].trim() : undefined;

    if (walletName) rawAccountNames.add(walletName);
    if (toWalletName) rawAccountNames.add(toWalletName);

    let rawAmtStr = colAmount !== -1 ? row[colAmount] : '';
    if (!rawAmtStr && colAmountAlt !== -1) rawAmtStr = row[colAmountAlt];
    const rawAmt = parseFloat((rawAmtStr || '0').replace(/[^0-9.-]/g, '')) || 0;

    const rawNote = colNote !== -1 ? row[colNote] : '';
    const rawTitle = colTitle !== -1 ? row[colTitle] : '';
    const combinedNotes = [rawTitle, rawNote].filter(Boolean).join(' - ');

    // Scan note for transfer notes like "Transferred Balance\nFederal Bank → Coral Rupay ICICI CC"
    if (rawNote.includes('→')) {
      const cleanNote = rawNote.replace(/Transferred Balance(\\n|\n)?/gi, '').trim();
      const parts = cleanNote.split('→').map(p => p.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        rawAccountNames.add(parts[0]);
        rawAccountNames.add(parts[1]);
      }
    }

    rawTxList.push({
      rowIndex: r,
      date: colDate !== -1 ? row[colDate] : undefined,
      amount: rawAmt,
      income: colIncome !== -1 ? row[colIncome] : undefined,
      type: colType !== -1 ? row[colType] : undefined,
      category: colCategory !== -1 ? row[colCategory] : undefined,
      subcategory: colSubcategory !== -1 ? row[colSubcategory] : undefined,
      wallet_name: walletName,
      to_wallet_name: toWalletName,
      notes: combinedNotes,
      note: rawNote,
      name: rawTitle,
      color: colColor !== -1 ? row[colColor] : undefined,
      currency: colCurrency !== -1 ? row[colCurrency] : undefined,
      tags: colTags !== -1 ? row[colTags] : undefined,
    });
  }

  if (rawAccountNames.size === 0) {
    rawAccountNames.add('Cashew Main Wallet');
  }

  // Discovered accounts analysis
  const discoveredAccounts = buildDiscoveredAccounts(Array.from(rawAccountNames), rawTxList);

  return buildImportResultFromData(
    { transactions: rawTxList },
    discoveredAccounts,
    existingState,
    options,
    warnings
  );
}

/**
 * Builds rich discovered accounts metadata with transaction statistics & auto-presets
 */
function buildDiscoveredAccounts(
  accountNames: string[],
  transactions: any[]
): CashewDiscoveredAccount[] {
  return accountNames.map(accName => {
    const matchingTxs = transactions.filter(t => {
      const src = (t.wallet_name || t.walletName || t.wallet_fk || t.account || '').trim();
      const dst = (t.to_wallet_name || t.toWalletName || t.to_wallet_fk || '').trim();
      return src.toLowerCase() === accName.toLowerCase() || dst.toLowerCase() === accName.toLowerCase();
    });

    let totalSpent = 0;
    let totalReceived = 0;
    let firstDate = '';
    let lastDate = '';

    matchingTxs.forEach(t => {
      const amt = Math.abs(parseFloat(t.amount || 0));
      const isInc = t.income === true || t.income === 1 || String(t.income).toLowerCase() === 'true' || t.type === 'income';
      if (isInc) totalReceived += amt;
      else totalSpent += amt;

      const d = t.date_created || t.date || t.dateCreated;
      if (d) {
        const parsed = String(d).substring(0, 10);
        if (!firstDate || parsed < firstDate) firstDate = parsed;
        if (!lastDate || parsed > lastDate) lastDate = parsed;
      }
    });

    const samples = matchingTxs.slice(0, 3).map(t => ({
      notes: t.note || t.notes || t.name || t.title || 'Transaction',
      amount: Math.abs(parseFloat(t.amount || 0)),
      date: String(t.date_created || t.date || '').substring(0, 10),
    }));

    const analysis = analyzeCashewAccountName(accName);

    return {
      rawName: accName,
      transactionCount: matchingTxs.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalReceived: Math.round(totalReceived * 100) / 100,
      firstDate: firstDate || undefined,
      lastDate: lastDate || undefined,
      sampleTransactions: samples,
      suggestedTarget: analysis.suggestedTarget || 'BANK',
      suggestedIssuer: analysis.suggestedIssuer,
      suggestedPresetCardId: analysis.suggestedPresetCardId,
      suggestedCardVariant: analysis.suggestedCardVariant,
      suggestedNetwork: analysis.suggestedNetwork,
      suggestedLimit: analysis.suggestedLimit,
      suggestedStatementDay: analysis.suggestedStatementDay,
      suggestedDueDay: analysis.suggestedDueDay,
      suggestedBankInstitution: analysis.suggestedBankInstitution,
      suggestedBankAccountType: analysis.suggestedBankAccountType,
      suggestedTheme: analysis.suggestedTheme,
    };
  });
}

/**
 * Main construction pipeline: creates actual Accounts, CreditCards, Categories, and Transactions
 */
function buildImportResultFromData(
  data: any,
  discoveredAccounts: CashewDiscoveredAccount[],
  existingState: LocalStorageState,
  options: CashewImportOptions,
  warnings: string[]
): CashewImportResult {
  const accountsToCreate: Account[] = [];
  const creditCardsToCreate: CreditCard[] = [];
  const categoriesMap = new Map<string, Category>();
  const currenciesSet = new Set<string>();

  existingState.categories.forEach(c => categoriesMap.set(c.name.toLowerCase(), c));

  type TargetDestination = {
    kind: 'ACCOUNT' | 'CARD';
    id: string;
    name: string;
    isExisting?: boolean;
  };

  const accountDestinations = new Map<string, TargetDestination>();

  // Process discovered accounts using options.accountMappings or suggestions
  discoveredAccounts.forEach((disc, idx) => {
    const rawName = disc.rawName;
    const config = options.accountMappings?.[rawName];
    const targetType = config?.targetType || disc.suggestedTarget;

    if (targetType === 'IGNORE') {
      return;
    }

    if (targetType === 'EXISTING_CARD') {
      const existingCard = existingState.creditCards.find(c => c.id === config?.existingId);
      if (existingCard) {
        accountDestinations.set(rawName.toLowerCase(), {
          kind: 'CARD',
          id: existingCard.id,
          name: existingCard.name,
          isExisting: true,
        });
        return;
      }
    }

    if (targetType === 'EXISTING_ACCOUNT') {
      const existingAcc = existingState.accounts.find(a => a.id === config?.existingId);
      if (existingAcc) {
        accountDestinations.set(rawName.toLowerCase(), {
          kind: 'ACCOUNT',
          id: existingAcc.id,
          name: existingAcc.name,
          isExisting: true,
        });
        return;
      }
    }

    if (targetType === 'CREDIT_CARD') {
      const cardId = `cc_cashew_${Date.now()}_${idx}`;
      const cardName = config?.cardName?.trim() || disc.suggestedCardVariant || rawName;
      const issuer = config?.cardIssuer?.trim() || disc.suggestedIssuer || 'HDFC Bank';
      const variant = config?.cardVariant?.trim() || disc.suggestedCardVariant || rawName;
      const network = config?.cardNetwork || disc.suggestedNetwork || 'VISA';
      const limit = config?.creditLimit !== undefined ? config.creditLimit : (disc.suggestedLimit || 100000);
      const statementDate = config?.statementDate || disc.suggestedStatementDay || 15;
      const dueDate = config?.dueDate || disc.suggestedDueDay || 5;
      const theme = config?.cardTheme || disc.suggestedTheme || 'sapphire';
      const lastFour = config?.cardLastFour || '1234';

      const newCard: CreditCard = {
        id: cardId,
        name: cardName,
        issuer,
        cardVariant: variant,
        network,
        creditLimit: limit,
        statementDate,
        dueDate,
        cardTheme: theme,
        lastFourDigits: lastFour,
        currentOutstanding: 0,
        openingBalance: config?.cardOpeningBalance || 0,
        icon: 'CreditCard',
        color: '#6366F1',
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      creditCardsToCreate.push(newCard);
      accountDestinations.set(rawName.toLowerCase(), {
        kind: 'CARD',
        id: cardId,
        name: cardName,
      });
      return;
    }

    if (targetType === 'WALLET') {
      const accId = `acc_cashew_wallet_${Date.now()}_${idx}`;
      const walletName = config?.walletName?.trim() || rawName;
      const newAcc: Account = {
        id: accId,
        name: walletName,
        institution: 'Cash / Wallet',
        type: 'CASH',
        openingBalance: config?.walletOpeningBalance || 0,
        calculatedBalance: 0,
        color: config?.walletColor || '#10B981',
        icon: config?.walletIcon || 'Banknote',
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      accountsToCreate.push(newAcc);
      accountDestinations.set(rawName.toLowerCase(), {
        kind: 'ACCOUNT',
        id: accId,
        name: walletName,
      });
      return;
    }

    // Default BANK Account
    const accId = `acc_cashew_bank_${Date.now()}_${idx}`;
    const bankName = config?.bankName?.trim() || rawName;
    const institution = config?.bankInstitution?.trim() || disc.suggestedBankInstitution || 'Bank';
    const accType = config?.bankAccountType || disc.suggestedBankAccountType || 'SAVINGS';

    const newAcc: Account = {
      id: accId,
      name: bankName,
      institution,
      type: accType,
      accountNumberLast4: config?.bankLastFour,
      openingBalance: config?.bankOpeningBalance || 0,
      calculatedBalance: 0,
      color: '#2563EB',
      icon: 'Landmark',
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    accountsToCreate.push(newAcc);
    accountDestinations.set(rawName.toLowerCase(), {
      kind: 'ACCOUNT',
      id: accId,
      name: bankName,
    });
  });

  // Process Transactions & Deduplicate / Pair Transfers
  const rawTxs: any[] = data.transactions || [];
  const processedTransactions: Transaction[] = [];
  const pairedTxProcessed = new Set<number>();

  for (let i = 0; i < rawTxs.length; i++) {
    if (pairedTxProcessed.has(i)) continue;
    const t = rawTxs[i];

    const rawSrcName = (t.wallet_name || t.walletName || t.account || 'Cashew Account').trim();
    const rawDstName = (t.to_wallet_name || t.toWalletName || '').trim();
    const srcDest = accountDestinations.get(rawSrcName.toLowerCase());
    const dstDest = rawDstName ? accountDestinations.get(rawDstName.toLowerCase()) : undefined;

    const rawAmt = parseFloat(t.amount || 0);
    const rawIncome = t.income;
    const isExplicitIncome = rawIncome === true || rawIncome === 1 || String(rawIncome).toLowerCase() === 'true' || t.type === 'income';
    const isExplicitTransfer = t.type === 'transfer' || t.type === 2 || rawIncome === 2 || String(rawIncome) === '2' || !!rawDstName;

    const { date, time, timestamp } = parseCashewDateTime(t.date_created || t.date || t.dateCreated);
    const note = (t.note || t.notes || t.title || t.name || '').trim();

    // Check if this transaction is a paired transfer or CC bill payment in Cashew
    if (options.pairTransfersAndCardPayments !== false && !isExplicitTransfer && i + 1 < rawTxs.length) {
      const nextT = rawTxs[i + 1];
      const nextAmt = parseFloat(nextT.amount || 0);
      const nextNote = (nextT.note || nextT.notes || nextT.title || nextT.name || '').trim();
      const nextSrcName = (nextT.wallet_name || nextT.walletName || nextT.account || '').trim();

      const isSameTime = Math.abs(
        parseCashewDateTime(t.date_created || t.date).timestamp -
        parseCashewDateTime(nextT.date_created || nextT.date).timestamp
      ) <= 3000;

      const isMatchingAmount = Math.abs(Math.abs(rawAmt) - Math.abs(nextAmt)) < 0.01;
      const isTransferNote = note.includes('Transferred Balance') || nextNote.includes('Transferred Balance') || note.includes('→') || nextNote.includes('→');

      if (isSameTime && isMatchingAmount && isTransferNote) {
        pairedTxProcessed.add(i + 1);

        const currentIsOutflow = rawAmt < 0 || !isExplicitIncome;
        const srcAccName = currentIsOutflow ? rawSrcName : nextSrcName;
        const dstAccName = currentIsOutflow ? nextSrcName : rawSrcName;

        const effectiveSrc = accountDestinations.get(srcAccName.toLowerCase());
        const effectiveDst = accountDestinations.get(dstAccName.toLowerCase());

        let txType: TransactionType = 'TRANSFER';
        let creditCardId: string | undefined = undefined;
        let creditCardName: string | undefined = undefined;
        let accountId: string | undefined = effectiveSrc?.kind === 'ACCOUNT' ? effectiveSrc.id : undefined;
        let toAccountId: string | undefined = effectiveDst?.kind === 'ACCOUNT' ? effectiveDst.id : undefined;

        // If destination is a Credit Card, it's a CARD PAYMENT
        if (effectiveDst?.kind === 'CARD') {
          txType = 'CARD_PAYMENT';
          creditCardId = effectiveDst.id;
          creditCardName = effectiveDst.name;
          toAccountId = undefined;
        } else if (effectiveSrc?.kind === 'CARD' && effectiveDst?.kind === 'ACCOUNT') {
          // Cash advance / refund to account
          txType = 'TRANSFER';
          creditCardId = effectiveSrc.id;
          creditCardName = effectiveSrc.name;
        }

        const absAmount = Math.abs(rawAmt);
        const finalCurrency = t.original_currency || t.currency || options.defaultCurrency || 'INR';
        currenciesSet.add(finalCurrency);

        processedTransactions.push({
          id: `tx_cashew_${Date.now()}_${i}`,
          amount: absAmount,
          originalCurrency: finalCurrency,
          date,
          time,
          timestamp,
          type: txType,
          categoryId: 'cat_transfer',
          categoryName: txType === 'CARD_PAYMENT' ? 'Credit Card Payment' : 'Transfer',
          accountId,
          toAccountId,
          creditCardId,
          creditCardName,
          notes: note || nextNote || `${srcAccName} → ${dstAccName}`,
          tags: ['Cashew Transfer'],
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        continue;
      }
    }

    // Standard single transaction processing
    const absAmount = Math.abs(rawAmt);
    let txType: TransactionType = 'EXPENSE';

    if (isExplicitTransfer) {
      if (dstDest?.kind === 'CARD') {
        txType = 'CARD_PAYMENT';
      } else {
        txType = 'TRANSFER';
      }
    } else if (isExplicitIncome || rawAmt > 0) {
      txType = 'INCOME';
    } else {
      txType = 'EXPENSE';
    }

    // Category mapping
    const rawCatName = (t.category_name || t.category || t.categoryName || 'General').trim();
    let cat = categoriesMap.get(rawCatName.toLowerCase());

    if (!cat && options.createMissingCategories !== false) {
      const newCat: Category = {
        id: `cat_cashew_${Date.now()}_${categoriesMap.size}`,
        name: rawCatName,
        type: txType === 'INCOME' ? 'INCOME' : 'EXPENSE',
        color: normalizeCashewColor(t.color),
        icon: mapCashewIcon(t.icon, rawCatName),
        subcategories: [],
        order: categoriesMap.size,
      };
      categoriesMap.set(rawCatName.toLowerCase(), newCat);
      cat = newCat;
    }

    const categoryId = cat?.id || (txType === 'INCOME' ? 'cat_income_other' : 'cat_general');
    const categoryName = cat?.name || rawCatName;

    // Determine account vs credit card assignment
    let accountId: string | undefined = undefined;
    let creditCardId: string | undefined = undefined;
    let creditCardName: string | undefined = undefined;
    let toAccountId: string | undefined = undefined;

    if (srcDest?.kind === 'CARD') {
      creditCardId = srcDest.id;
      creditCardName = srcDest.name;
    } else if (srcDest?.kind === 'ACCOUNT') {
      accountId = srcDest.id;
    } else {
      // Fallback
      if (accountsToCreate.length > 0) {
        accountId = accountsToCreate[0].id;
      } else if (existingState.accounts.length > 0) {
        accountId = existingState.accounts[0].id;
      }
    }

    if (txType === 'TRANSFER' && dstDest?.kind === 'ACCOUNT') {
      toAccountId = dstDest.id;
    } else if (txType === 'CARD_PAYMENT' && dstDest?.kind === 'CARD') {
      creditCardId = dstDest.id;
      creditCardName = dstDest.name;
    }

    const finalCurrency = t.original_currency || t.currency || options.defaultCurrency || 'INR';
    currenciesSet.add(finalCurrency);

    processedTransactions.push({
      id: `tx_cashew_${Date.now()}_${i}`,
      amount: absAmount,
      originalCurrency: finalCurrency,
      date,
      time,
      timestamp,
      type: txType,
      categoryId,
      categoryName,
      accountId,
      toAccountId,
      creditCardId,
      creditCardName,
      notes: note || (t.title ? `${t.title}` : undefined),
      tags: t.tags ? String(t.tags).split(',').map(s => s.trim()) : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  // Process Budgets
  const budgetsToCreate: Budget[] = [];
  (data.budgets || []).forEach((b: any, idx: number) => {
    const rawName = b.name || b.title || `Budget ${idx + 1}`;
    const limit = parseFloat(b.amount || b.limit || 0);
    if (limit > 0) {
      budgetsToCreate.push({
        id: `bgt_cashew_${Date.now()}_${idx}`,
        name: rawName,
        amount: limit,
        month: 'ALL',
        rolloverType: 'NO_ROLLOVER',
        color: '#10B981',
      });
    }
  });

  // Process Goals / Objectives
  const goalsToCreate: Goal[] = [];
  (data.goals || []).forEach((g: any, idx: number) => {
    const rawName = g.name || g.title || `Goal ${idx + 1}`;
    const targetAmt = parseFloat(g.amount || g.target_amount || 0);
    const currAmt = parseFloat(g.current_amount || 0);
    if (targetAmt > 0) {
      goalsToCreate.push({
        id: `goal_cashew_${Date.now()}_${idx}`,
        name: rawName,
        targetAmount: targetAmt,
        currentAmount: currAmt,
        category: 'Savings',
        color: normalizeCashewColor(g.colour),
        icon: 'Target',
        status: currAmt >= targetAmt ? 'COMPLETED' : 'IN_PROGRESS',
        allocations: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  });

  // Collect unique newly created categories
  const newCategories = Array.from(categoriesMap.values()).filter(
    c => !existingState.categories.some(ec => ec.id === c.id)
  );

  return compileImportStats(
    accountsToCreate,
    creditCardsToCreate,
    newCategories,
    processedTransactions,
    budgetsToCreate,
    goalsToCreate,
    [],
    [],
    discoveredAccounts,
    currenciesSet,
    warnings
  );
}

/**
 * Compile final summary statistics for the import
 */
function compileImportStats(
  accounts: Account[],
  creditCards: CreditCard[],
  categories: Category[],
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[],
  subscriptions: Subscription[],
  debts: DebtRecord[],
  discoveredAccounts: CashewDiscoveredAccount[],
  currenciesSet: Set<string>,
  warnings: string[]
): CashewImportResult {
  let incomeCount = 0;
  let expenseCount = 0;
  let transferCount = 0;
  let cardPaymentCount = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let minDate = '';
  let maxDate = '';

  transactions.forEach(t => {
    if (t.type === 'INCOME') {
      incomeCount++;
      totalIncome += t.amount;
    } else if (t.type === 'EXPENSE') {
      expenseCount++;
      totalExpense += t.amount;
    } else if (t.type === 'TRANSFER') {
      transferCount++;
    } else if (t.type === 'CARD_PAYMENT') {
      cardPaymentCount++;
    }

    if (t.date) {
      if (!minDate || t.date < minDate) minDate = t.date;
      if (!maxDate || t.date > maxDate) maxDate = t.date;
    }
  });

  return {
    accounts,
    creditCards,
    categories,
    transactions,
    budgets,
    goals,
    subscriptions,
    debts,
    recurring: [],
    discoveredAccounts,
    stats: {
      totalTransactions: transactions.length,
      incomeCount,
      expenseCount,
      transferCount,
      cardPaymentCount,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      accountsCount: accounts.length,
      creditCardsCount: creditCards.length,
      categoriesCount: categories.length,
      budgetsCount: budgets.length,
      goalsCount: goals.length,
      debtsCount: debts.length,
      recurringCount: 0,
      currenciesDetected: Array.from(currenciesSet),
      dateRange: minDate && maxDate ? { start: minDate, end: maxDate } : null,
    },
    warnings,
  };
}

/**
 * Apply the import result to existing application state
 */
export function applyCashewImport(
  existingState: LocalStorageState,
  imported: CashewImportResult,
  mode: 'MERGE' | 'REPLACE' = 'MERGE'
): LocalStorageState {
  if (mode === 'REPLACE') {
    return {
      ...existingState,
      accounts: imported.accounts,
      creditCards: imported.creditCards,
      categories: [...DEFAULT_CATEGORIES, ...imported.categories],
      transactions: imported.transactions,
      budgets: imported.budgets,
      goals: imported.goals,
      subscriptions: imported.subscriptions,
      debts: imported.debts,
    };
  }

  // MERGE Mode
  const mergedAccounts = [...existingState.accounts, ...imported.accounts];
  const mergedCards = [...existingState.creditCards, ...imported.creditCards];
  const mergedTransactions = [...existingState.transactions, ...imported.transactions];

  const existingCatNames = new Set(existingState.categories.map(c => c.name.toLowerCase()));
  const mergedCategories = [...existingState.categories];
  imported.categories.forEach(c => {
    if (!existingCatNames.has(c.name.toLowerCase())) {
      mergedCategories.push(c);
      existingCatNames.add(c.name.toLowerCase());
    }
  });

  const existingGoalNames = new Set((existingState.goals || []).map(g => g.name.toLowerCase()));
  const mergedGoals = [...(existingState.goals || [])];
  imported.goals.forEach(g => {
    if (!existingGoalNames.has(g.name.toLowerCase())) {
      mergedGoals.push(g);
      existingGoalNames.add(g.name.toLowerCase());
    }
  });

  const existingBudgetNames = new Set(existingState.budgets.map(b => b.name.toLowerCase()));
  const mergedBudgets = [...existingState.budgets];
  imported.budgets.forEach(b => {
    if (!existingBudgetNames.has(b.name.toLowerCase())) {
      mergedBudgets.push(b);
      existingBudgetNames.add(b.name.toLowerCase());
    }
  });

  const mergedDebts = [...existingState.debts, ...imported.debts];
  const mergedSubs = [...existingState.subscriptions, ...imported.subscriptions];

  return {
    ...existingState,
    accounts: mergedAccounts,
    creditCards: mergedCards,
    categories: mergedCategories,
    transactions: mergedTransactions,
    budgets: mergedBudgets,
    goals: mergedGoals,
    debts: mergedDebts,
    subscriptions: mergedSubs,
  };
}

/**
 * Sample Cashew CSV
 */
export const SAMPLE_CASHEW_EXPORT_CSV = `account,amount,amount unpaid,currency,title,note,date,income,type,category name,subcategory name,color,icon,emoji,budget,objective,extra
HDFC Bank,,-299,INR,YouTube Premium 🎥,,2026-09-21 20:49:12.000,false,subscription,Entertainment,,0XFF2196F3,popcorn,,,,repeat every 1 month
Federal Bank,-5284.5,,INR,Train,"BLR - HYD : Aisha, Jafar & Myself ",2026-08-23 00:45:48.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Amazon Pay ICICI CC,-12028,,INR,Flight ✈️ Ticket,"HYD - BLR : Aisha, Jafar & Myself ",2026-08-23 00:40:46.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Cash,-500,,INR,City Meredian,"3 Ghee Rice & ½ Alfaham & Soft drink ",2026-08-19 23:30:51.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Coral Rupay ICICI CC,10631.11,,INR,Credit Card Bill 💳,"Transferred Balance\\nFederal Bank → Coral Rupay ICICI CC",2026-08-09 23:23:31.000,true,default,Balance Correction,,0XFF607D8B,,💲,,,repeat every 1 month
Federal Bank,-10631.11,,INR,Credit Card Bill 💳,"Transferred Balance\\nFederal Bank → Coral Rupay ICICI CC",2026-08-09 23:23:30.000,false,default,Balance Correction,,0XFF607D8B,,💲,,,repeat every 1 month
`;

/**
 * Sample Cashew SQL Dump
 */
export const SAMPLE_CASHEW_EXPORT_SQL = `-- Cashew SQLite Database Export Dump
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS "wallet" (
  "wallet_pk" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "colour" TEXT,
  "date_created" TEXT,
  "order" INTEGER,
  "currency" TEXT,
  "currency_format" TEXT,
  "decimals" INTEGER,
  "icon_name" TEXT
);

INSERT INTO "wallet" VALUES ('w_1', 'HDFC Salary Account', '0xFF1E88E5', '2024-01-01T00:00:00.000', 0, 'INR', '₹', 2, 'account_balance');
INSERT INTO "wallet" VALUES ('w_2', 'ICICI Amazon Pay Credit Card', '0xFFE53935', '2024-01-01T00:00:00.000', 1, 'INR', '₹', 2, 'credit_card');
INSERT INTO "wallet" VALUES ('w_3', 'Cash In Hand', '0xFF43A047', '2024-01-01T00:00:00.000', 2, 'INR', '₹', 2, 'payments');

CREATE TABLE IF NOT EXISTS "category" (
  "category_pk" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "colour" TEXT,
  "icon_name" TEXT,
  "order" INTEGER,
  "main_category_pk" TEXT
);

INSERT INTO "category" VALUES ('c_1', 'Food & Dining', '0xFFFB8C00', 'restaurant', 0, NULL);
INSERT INTO "category" VALUES ('c_2', 'Salary & Income', '0xFF43A047', 'attach_money', 1, NULL);

CREATE TABLE IF NOT EXISTS "transaction" (
  "transaction_pk" TEXT PRIMARY KEY,
  "name" TEXT,
  "amount" REAL NOT NULL,
  "note" TEXT,
  "category_fk" TEXT,
  "sub_category_fk" TEXT,
  "wallet_fk" TEXT,
  "to_wallet_fk" TEXT,
  "date_created" TEXT,
  "income" INTEGER,
  "paid" INTEGER,
  "skip_paid" INTEGER,
  "type" TEXT,
  "original_currency" TEXT,
  "exchange_rate" REAL
);

INSERT INTO "transaction" VALUES ('t_1', 'Tech Corp Monthly Paycheck', 95000.0, 'Monthly Salary', 'c_2', NULL, 'w_1', NULL, '2024-08-01T10:00:00.000', 1, 1, 0, 'income', 'INR', 1.0);
INSERT INTO "transaction" VALUES ('t_2', 'Starbucks Coffee', 350.0, 'Caramel Frappuccino', 'c_1', NULL, 'w_3', NULL, '2024-08-03T16:30:00.000', 0, 1, 0, 'expense', 'INR', 1.0);

COMMIT;
`;
