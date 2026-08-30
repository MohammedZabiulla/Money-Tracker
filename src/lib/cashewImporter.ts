import {
  Account,
  CreditCard,
  Category,
  Transaction,
  Budget,
  Goal,
  LocalStorageState,
  TransactionType,
  AccountType,
  CardNetwork,
  CardTheme,
} from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_APPS, CARD_THEMES } from './constants';
import { createActivityEntry } from './activityLogger';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

export interface CashewWalletPreview {
  id: string;
  originalPk: string;
  name: string;
  currency: string;
  color: string;
  icon: string;
  isCreditCard: boolean;
  suggestedOpeningBalance: number;
  suggestedLimit: number;
  transactionCount: number;
  isSelected: boolean;
  mappedAccountId?: string;
  accountType: AccountType;
  institution?: string;
  lastFourDigits?: string;
  statementDate?: number;
  dueDate?: number;
  cardTheme?: CardTheme;
  network?: CardNetwork;
}

export interface CashewCategoryPreview {
  id: string;
  originalPk: string;
  name: string;
  color: string;
  icon: string;
  emoji?: string;
  type: 'EXPENSE' | 'INCOME' | 'BOTH';
  subcategories: string[];
  transactionCount: number;
  isMatchedWithDefault: boolean;
  matchedDefaultCategoryName?: string;
  isSelected?: boolean;
  mappedCategoryId?: string;
}

export interface CashewBudgetPreview {
  id: string;
  name: string;
  amount: number;
  color: string;
  startDate?: string;
  endDate?: string;
  periodLength?: number;
  reoccurrence?: number;
  categoryNames?: string[];
}

export interface CashewGoalPreview {
  id: string;
  name: string;
  amount: number;
  color: string;
  targetDate?: string;
  currentAmount?: number;
}

export interface CashewTransactionPreviewItem {
  id: string;
  date: string;
  time: string;
  title: string;
  amount: number;
  signedAmount: number;
  type: TransactionType;
  categoryName: string;
  subcategoryName?: string;
  accountName: string;
  toAccountName?: string;
  notes?: string;
  isTransfer?: boolean;
  isSelected?: boolean;
}

export interface CashewImportPreview {
  sourceType: 'CASHEW_SQLITE' | 'CASHEW_SQL_TEXT' | 'CASHEW_CSV' | 'CASHEW_JSON' | 'GENERIC_CSV' | 'UNKNOWN';
  sourceFileName: string;
  summary: {
    walletsCount: number;
    categoriesCount: number;
    subcategoriesCount: number;
    transactionsCount: number;
    transfersCount: number;
    budgetsCount: number;
    goalsCount: number;
    dateRange: { start: string; end: string } | null;
    totalExpense: number;
    totalIncome: number;
    netVolume: number;
    currency: string;
  };
  wallets: CashewWalletPreview[];
  categories: CashewCategoryPreview[];
  budgets: CashewBudgetPreview[];
  goals: CashewGoalPreview[];
  sampleTransactions: CashewTransactionPreviewItem[];
  allTransactions: CashewTransactionPreviewItem[];
  rawParsedData: {
    wallets: any[];
    categories: any[];
    transactions: any[];
    budgets: any[];
    objectives: any[];
  };
}

export interface CashewImportOptions {
  mode: 'MERGE' | 'REPLACE';
  includeWallets: boolean;
  includeCategories: boolean;
  includeTransactions: boolean;
  includeBudgets: boolean;
  includeGoals: boolean;
  skipDuplicateTransactions: boolean;
  autoPairTransfers: boolean;
  autoSetOpeningBalances: boolean;
  selectedWalletIds?: string[];
}

let cachedSqlJs: SqlJsStatic | null = null;

async function fetchValidWasmBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    // Check WebAssembly magic header: 0x00, 0x61, 0x73, 0x6d (\0asm)
    if (
      bytes.length >= 4 &&
      bytes[0] === 0x00 &&
      bytes[1] === 0x61 &&
      bytes[2] === 0x73 &&
      bytes[3] === 0x6d
    ) {
      return buf;
    }
    return null;
  } catch (e) {
    console.warn(`Failed fetching WASM binary from ${url}:`, e);
    return null;
  }
}

async function getSqlJsInstance(): Promise<SqlJsStatic> {
  if (cachedSqlJs) return cachedSqlJs;

  // 1. Try fetching from Vite asset URL
  let wasmBuffer = typeof sqlWasmUrl === 'string' ? await fetchValidWasmBuffer(sqlWasmUrl) : null;

  // 2. Try fetching from local public URL
  if (!wasmBuffer) {
    wasmBuffer = await fetchValidWasmBuffer('/sql-wasm.wasm');
  }

  // 3. Try fetching from reliable CDNs
  if (!wasmBuffer) {
    wasmBuffer = await fetchValidWasmBuffer('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.wasm');
  }
  if (!wasmBuffer) {
    wasmBuffer = await fetchValidWasmBuffer('https://cdn.jsdelivr.net/npm/sql.js@1.12.0/dist/sql-wasm.wasm');
  }

  if (wasmBuffer) {
    try {
      cachedSqlJs = await initSqlJs({
        wasmBinary: wasmBuffer,
      });
      return cachedSqlJs;
    } catch (err) {
      console.warn('initSqlJs with wasmBinary failed, attempting locateFile...', err);
    }
  }

  // Fallback if direct wasmBinary instantiation failed
  cachedSqlJs = await initSqlJs({
    locateFile: () =>
      typeof sqlWasmUrl === 'string'
        ? sqlWasmUrl
        : 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.wasm',
  });
  return cachedSqlJs;
}

/**
 * Parses any uploaded Cashew or CSV/SQL/JSON file into a rich preview dataset
 */
export async function parseCashewFile(
  fileData: File | ArrayBuffer | Uint8Array | string,
  fileName: string = 'import_file'
): Promise<CashewImportPreview> {
  const lowerName = fileName.toLowerCase();

  // 1. If it's a binary SQLite file (.sql, .sqlite, .db) or ArrayBuffer that starts with SQLite header
  if (
    lowerName.endsWith('.sqlite') ||
    lowerName.endsWith('.db') ||
    lowerName.endsWith('.sql') ||
    fileData instanceof ArrayBuffer ||
    fileData instanceof Uint8Array
  ) {
    try {
      let buffer: Uint8Array;
      if (fileData instanceof File || fileData instanceof Blob) {
        const arrayBuf = await fileData.arrayBuffer();
        buffer = new Uint8Array(arrayBuf);
      } else if (fileData instanceof ArrayBuffer) {
        buffer = new Uint8Array(fileData);
      } else if (fileData instanceof Uint8Array) {
        buffer = fileData;
      } else {
        // Text string representation - might be a text sql or csv
        return parseCsvOrText(fileData, fileName);
      }

      // Check for SQLite 3 format header ("SQLite format 3\000")
      const headerStr = new TextDecoder().decode(buffer.slice(0, 16));
      if (headerStr.startsWith('SQLite format 3')) {
        return parseCashewSqlite(buffer, fileName);
      } else {
        // Not a binary sqlite header, try reading as text (CSV / SQL text / JSON)
        const textContent = new TextDecoder('utf-8').decode(buffer);
        if (
          textContent.toUpperCase().includes('INSERT INTO') ||
          textContent.toUpperCase().includes('CREATE TABLE')
        ) {
          return parseCashewSqlText(textContent, fileName);
        }
        return parseCsvOrText(textContent, fileName);
      }
    } catch (e) {
      console.error('Error in SQLite binary check, falling back to text parsing', e);
      if (fileData instanceof File || fileData instanceof Blob) {
        const text = await fileData.text();
        if (
          text.toUpperCase().includes('INSERT INTO') ||
          text.toUpperCase().includes('CREATE TABLE')
        ) {
          return parseCashewSqlText(text, fileName);
        }
        return parseCsvOrText(text, fileName);
      }
    }
  }

  // 2. Text based (CSV / JSON / SQL Text)
  let text = '';
  if (typeof fileData === 'string') {
    text = fileData;
  } else if (fileData instanceof File || fileData instanceof Blob) {
    text = await fileData.text();
  } else if (fileData instanceof ArrayBuffer) {
    text = new TextDecoder('utf-8').decode(fileData);
  } else if (fileData instanceof Uint8Array) {
    text = new TextDecoder('utf-8').decode(fileData);
  }

  if (
    text.toUpperCase().includes('INSERT INTO') ||
    text.toUpperCase().includes('CREATE TABLE')
  ) {
    try {
      return await parseCashewSqlText(text, fileName);
    } catch {
      return parseCsvOrText(text, fileName);
    }
  }

  return parseCsvOrText(text, fileName);
}

/**
 * Parses SQL text dumps by initializing an in-memory SQLite database
 */
async function parseCashewSqlText(sqlText: string, fileName: string): Promise<CashewImportPreview> {
  const SQL = await getSqlJsInstance();
  const db = new SQL.Database();
  db.run(sqlText);
  return parseDatabaseInstance(db, fileName, 'CASHEW_SQL_TEXT');
}

/**
 * Parses SQLite Database binary stream from Cashew backup
 */
async function parseCashewSqlite(buffer: Uint8Array, fileName: string): Promise<CashewImportPreview> {
  const SQL = await getSqlJsInstance();
  const db = new SQL.Database(buffer);
  return parseDatabaseInstance(db, fileName, 'CASHEW_SQLITE');
}

function parseDatabaseInstance(
  db: Database,
  fileName: string,
  sourceType: 'CASHEW_SQLITE' | 'CASHEW_SQL_TEXT'
): CashewImportPreview {

  // Get all table names in SQLite database case-insensitively
  const tablesResult = db.exec(`SELECT name FROM sqlite_master WHERE type='table'`);
  const actualTables: string[] = [];
  if (tablesResult && tablesResult.length > 0 && tablesResult[0].values) {
    tablesResult[0].values.forEach(row => {
      if (row[0]) actualTables.push(String(row[0]));
    });
  }

  const queryTableFlexible = (names: string[]): any[] => {
    for (const name of names) {
      const matchedTable = actualTables.find(t => t.toLowerCase() === name.toLowerCase());
      if (matchedTable) {
        try {
          const res = db.exec(`SELECT * FROM "${matchedTable}"`);
          if (res && res.length > 0) {
            const cols = res[0].columns;
            const rows = res[0].values;
            return rows.map(r => {
              const obj: Record<string, any> = {};
              cols.forEach((col, idx) => {
                obj[col] = r[idx];
              });
              return obj;
            });
          }
        } catch (e) {
          console.warn(`Error querying table ${matchedTable}:`, e);
        }
      }
    }
    return [];
  };

  const getVal = (obj: any, keys: string[]): any => {
    if (!obj) return undefined;
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) return obj[key];
      const lower = key.toLowerCase();
      const snake = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      const camel = key.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
      for (const k of Object.keys(obj)) {
        const kl = k.toLowerCase();
        if (kl === lower || kl === snake || kl === snake.replace(/_/g, '') || kl === camel.toLowerCase()) {
          if (obj[k] !== undefined && obj[k] !== null) return obj[k];
        }
      }
    }
    return undefined;
  };

  const rawWallets = queryTableFlexible(['Wallets', 'wallets', 'wallet', 'Accounts', 'accounts', 'account']);
  const rawCategories = queryTableFlexible(['Categories', 'categories', 'category']);
  const rawTransactions = queryTableFlexible(['Transactions', 'transactions', 'transaction']);
  const rawBudgets = queryTableFlexible(['Budgets', 'budgets', 'budget']);
  const rawObjectives = queryTableFlexible(['Objectives', 'objectives', 'goals', 'goal']);

  // Build Maps for fast lookup
  const categoryMap = new Map<string, any>();
  const subcategoryParentMap = new Map<string, string>(); // subCategoryPk -> mainCategoryPk

  const mainCategoriesList: any[] = [];
  const subCategoriesList: any[] = [];

  rawCategories.forEach(c => {
    const pk = String(getVal(c, ['categoryPk', 'id', 'categoryId', 'category_pk']) || '');
    if (pk) categoryMap.set(pk, c);
    const mainPk = String(getVal(c, ['mainCategoryPk', 'parentPk', 'parentCategoryId', 'main_category_pk', 'parent_pk']) || '');
    if (mainPk) {
      subCategoriesList.push(c);
      if (pk) subcategoryParentMap.set(pk, mainPk);
    } else {
      mainCategoriesList.push(c);
    }
  });

  const categoryPreviews: CashewCategoryPreview[] = mainCategoriesList.map(mc => {
    const mcPk = String(getVal(mc, ['categoryPk', 'id', 'category_pk']) || '');
    const subs = subCategoriesList
      .filter(sc => String(getVal(sc, ['mainCategoryPk', 'parentPk', 'parentCategoryId', 'main_category_pk', 'parent_pk']) || '') === mcPk)
      .map(sc => String(getVal(sc, ['name', 'title']) || ''))
      .filter(Boolean);

    const mcName = String(getVal(mc, ['name', 'title']) || 'General');
    const matched = DEFAULT_CATEGORIES.find(
      dc => dc.name.toLowerCase() === mcName.toLowerCase()
    );

    const incomeVal = getVal(mc, ['income', 'isIncome', 'is_income']);

    return {
      id: `cat_cashew_${mcPk || Math.random()}`,
      originalPk: mcPk,
      name: mcName,
      color: getVal(mc, ['colour', 'color']) ? (String(getVal(mc, ['colour', 'color'])).startsWith('#') ? String(getVal(mc, ['colour', 'color'])) : `#${getVal(mc, ['colour', 'color'])}`) : '#3B82F6',
      icon: mapCashewIcon(getVal(mc, ['iconName', 'icon', 'icon_name']), getVal(mc, ['emojiIconName', 'emoji', 'emoji_icon_name'])),
      emoji: getVal(mc, ['emojiIconName', 'emoji', 'emoji_icon_name']) || undefined,
      type: Boolean(incomeVal) ? 'INCOME' : 'EXPENSE',
      subcategories: subs,
      transactionCount: 0,
      isMatchedWithDefault: !!matched,
      matchedDefaultCategoryName: matched?.name,
    };
  });

  // Build wallet previews with robust credit card & wallet detection
  const walletMap = new Map<string, any>();
  rawWallets.forEach(w => {
    const pk = String(getVal(w, ['walletPk', 'id', 'accountId', 'wallet_pk', 'account_id']) || '');
    if (pk) walletMap.set(pk, w);
  });

  const walletPreviews: CashewWalletPreview[] = rawWallets.map(w => {
    const pk = String(getVal(w, ['walletPk', 'id', 'accountId', 'wallet_pk', 'account_id']) || '');
    const nameStr = String(getVal(w, ['name', 'walletName', 'accountName', 'wallet_name', 'account_name']) || '').toLowerCase();
    const typeStr = String(getVal(w, ['type', 'walletType', 'wallet_type']) || '').toLowerCase();
    const iconStr = String(getVal(w, ['iconName', 'icon', 'icon_name']) || '').toLowerCase();

    const isCredit =
      typeStr.includes('credit') ||
      typeStr.includes('card') ||
      typeStr.includes('liability') ||
      typeStr.includes('debt') ||
      nameStr.includes('credit') ||
      nameStr.includes('card') ||
      nameStr.includes('cc') ||
      nameStr.includes('visa') ||
      nameStr.includes('mastercard') ||
      nameStr.includes('amex') ||
      nameStr.includes('discover') ||
      nameStr.includes('rupay') ||
      nameStr.includes('diners') ||
      nameStr.includes('overdraft') ||
      nameStr.includes('loan') ||
      iconStr.includes('card');

    const colVal = getVal(w, ['colour', 'color']);
    const iconVal = getVal(w, ['iconName', 'icon', 'icon_name']);
    const curVal = getVal(w, ['currency']) || 'INR';
    const opBal = Number(getVal(w, ['openingBalance', 'balance', 'opening_balance', 'amount']) || 0);
    const limVal = Number(getVal(w, ['creditLimit', 'credit_limit', 'limit']) || 100000);

    return {
      id: `acc_cashew_${pk || Math.random()}`,
      originalPk: pk,
      name: String(getVal(w, ['name', 'walletName', 'accountName', 'wallet_name', 'account_name']) || 'Cashew Account'),
      currency: String(curVal).toUpperCase(),
      color: colVal ? (String(colVal).startsWith('#') ? String(colVal) : `#${colVal}`) : isCredit ? '#EF4444' : '#0284C7',
      icon: mapCashewIcon(iconVal) || (isCredit ? 'CreditCard' : 'Landmark'),
      isCreditCard: isCredit,
      suggestedOpeningBalance: opBal,
      suggestedLimit: isCredit ? limVal : 0,
      transactionCount: 0,
      isSelected: true,
      accountType: isCredit ? 'CREDIT_CARD' : 'SAVINGS',
    };
  });

  // Parse and process Transactions
  const parsedTxList: CashewTransactionPreviewItem[] = [];
  let totalExpense = 0;
  let totalIncome = 0;
  let minDate = '';
  let maxDate = '';

  const transactionMap = new Map<string, any>();
  const childrenMap = new Map<string, any[]>();

  rawTransactions.forEach(t => {
    const pk = String(getVal(t, ['transactionPk', 'id', 'transaction_pk', 'uuid']) || '');
    if (pk) transactionMap.set(pk, t);
    const pairedFk = getVal(t, ['pairedTransactionFk', 'pairedId', 'paired_transaction_fk', 'paired_id']);
    if (pairedFk) {
      const pKey = String(pairedFk);
      const list = childrenMap.get(pKey) || [];
      list.push(t);
      childrenMap.set(pKey, list);
    }
  });

  const processedTransactionPks = new Set<string>();

  rawTransactions.forEach(t => {
    const pk = String(getVal(t, ['transactionPk', 'id', 'transaction_pk', 'uuid']) || Math.random());
    if (processedTransactionPks.has(pk)) return;

    // Check if paired via pairedTransactionFk
    const pairedFk = getVal(t, ['pairedTransactionFk', 'pairedId', 'paired_transaction_fk', 'paired_id']);
    const parentTx = pairedFk ? transactionMap.get(String(pairedFk)) : null;
    const childrenList = childrenMap.get(pk) || [];
    const pairedTx = parentTx || (childrenList.length > 0 ? childrenList[0] : null);

    if (pairedTx) {
      const pairedPk = String(getVal(pairedTx, ['transactionPk', 'id', 'transaction_pk', 'uuid']) || '');
      processedTransactionPks.add(pk);
      if (pairedPk) processedTransactionPks.add(pairedPk);

      const tAmt = Number(getVal(t, ['amount', 'value']) || 0);
      const tIsNegative = tAmt < 0 || Boolean(getVal(t, ['income', 'isIncome', 'is_income'])) === false;
      const sourceTx = tIsNegative ? t : pairedTx;
      const destTx = tIsNegative ? pairedTx : t;

      const srcWalletFk = String(getVal(sourceTx, ['walletFk', 'walletId', 'wallet_fk', 'accountId']) || '');
      const dstWalletFk = String(getVal(destTx, ['walletFk', 'walletId', 'wallet_fk', 'accountId']) || '');
      const srcWallet = walletMap.get(srcWalletFk) || rawWallets.find(w => String(getVal(w, ['walletPk', 'id', 'wallet_fk'])) === srcWalletFk);
      const dstWallet = walletMap.get(dstWalletFk) || rawWallets.find(w => String(getVal(w, ['walletPk', 'id', 'wallet_fk'])) === dstWalletFk);

      const srcWalletPreview = walletPreviews.find(w => w.originalPk === srcWalletFk || w.name === getVal(srcWallet, ['name', 'wallet_name', 'accountName']));
      const dstWalletPreview = walletPreviews.find(w => w.originalPk === dstWalletFk || w.name === getVal(dstWallet, ['name', 'wallet_name', 'accountName']));

      const rawDate = getVal(sourceTx, ['dateCreated', 'dateTimeCreated', 'date_created', 'date_time_created', 'date', 'timestamp', 'datetime']);
      const dateObj = parseCashewDate(rawDate);
      const rawAmt = Number(getVal(sourceTx, ['amount', 'value']) || getVal(destTx, ['amount', 'value']) || 0);
      const amt = Math.abs(rawAmt);

      if (!minDate || dateObj.date < minDate) minDate = dateObj.date;
      if (!maxDate || dateObj.date > maxDate) maxDate = dateObj.date;

      parsedTxList.push({
        id: `tx_cashew_${pk}`,
        date: dateObj.date,
        time: dateObj.time,
        title: String(getVal(sourceTx, ['name', 'title', 'description']) || getVal(destTx, ['name', 'title', 'description']) || `Transfer to ${getVal(dstWallet, ['name', 'wallet_name', 'accountName']) || dstWalletPreview?.name || 'Account'}`),
        amount: amt,
        signedAmount: -amt,
        type: 'TRANSFER',
        categoryName: 'Transfer',
        accountName: String(getVal(srcWallet, ['name', 'wallet_name', 'accountName']) || srcWalletPreview?.name || 'Main Account'),
        toAccountName: String(getVal(dstWallet, ['name', 'wallet_name', 'accountName']) || dstWalletPreview?.name || 'Destination Account'),
        notes: String(getVal(sourceTx, ['note', 'notes', 'description']) || getVal(destTx, ['note', 'notes']) || 'Cashew Transfer'),
        isTransfer: true,
      });
      return;
    }

    processedTransactionPks.add(pk);

    const walletFk = String(getVal(t, ['walletFk', 'walletId', 'accountId', 'wallet_fk', 'account_id']) || '');
    const wallet = walletMap.get(walletFk) || rawWallets.find(w => String(getVal(w, ['walletPk', 'id', 'wallet_fk'])) === walletFk);
    const walletPreview = walletPreviews.find(w => w.originalPk === walletFk || w.name === getVal(wallet, ['name', 'wallet_name', 'accountName']));

    const catFk = String(getVal(t, ['categoryFk', 'categoryId', 'category_fk', 'category_id']) || '');
    const cat = categoryMap.get(catFk) || rawCategories.find(c => String(getVal(c, ['categoryPk', 'id', 'category_pk'])) === catFk);
    const catPreview = categoryPreviews.find(c => c.originalPk === catFk || c.name === getVal(cat, ['name', 'title']));
    if (catPreview) {
      catPreview.transactionCount++;
    }

    const subCatFkRaw = getVal(t, ['subCategoryFk', 'subCategoryId', 'sub_category_fk', 'sub_category_id']);
    const subCatFk = subCatFkRaw ? String(subCatFkRaw) : undefined;
    const subCat = subCatFk ? categoryMap.get(subCatFk) : undefined;

    const tName = String(getVal(t, ['name', 'title', 'description']) || '');
    const tNote = String(getVal(t, ['note', 'notes', 'description']) || '');
    const isBalanceCorrection = catFk === '0' || tName.toLowerCase().includes('balance correction') || tNote.toLowerCase().includes('initial balance');
    const rawAmt = Number(getVal(t, ['amount', 'value']) || 0);
    const amt = Math.abs(rawAmt);
    const incomeFlag = getVal(t, ['income', 'isIncome', 'is_income']);
    const tType = String(getVal(t, ['type']) || '').toLowerCase();
    const isIncome = Boolean(incomeFlag) || (rawAmt > 0 && tType === 'income');

    const rawDate = getVal(t, ['dateCreated', 'dateTimeCreated', 'date_created', 'date_time_created', 'date', 'timestamp', 'datetime']);
    const dateObj = parseCashewDate(rawDate);
    if (!minDate || dateObj.date < minDate) minDate = dateObj.date;
    if (!maxDate || dateObj.date > maxDate) maxDate = dateObj.date;

    const txType: TransactionType = isBalanceCorrection
      ? 'ADJUSTMENT'
      : isIncome
      ? 'INCOME'
      : 'EXPENSE';

    if (txType === 'INCOME') totalIncome += amt;
    if (txType === 'EXPENSE') totalExpense += amt;

    const signedAmt = isBalanceCorrection ? rawAmt : (isIncome ? amt : -amt);

    const catName = String(getVal(cat, ['name', 'title']) || getVal(t, ['categoryName', 'category_name']) || (isIncome ? 'Other Income' : 'Miscellaneous Expenses'));
    const subCatName = subCat ? String(getVal(subCat, ['name', 'title']) || '') : String(getVal(t, ['subcategoryName', 'subcategory_name']) || '');

    parsedTxList.push({
      id: `tx_cashew_${pk}`,
      date: dateObj.date,
      time: dateObj.time,
      title: tName || catName || (isIncome ? 'Income' : 'Expense'),
      amount: amt,
      signedAmount: signedAmt,
      type: txType,
      categoryName: catName,
      subcategoryName: subCatName || undefined,
      accountName: String(getVal(wallet, ['name', 'wallet_name', 'accountName']) || walletPreview?.name || 'Main Account'),
      notes: tNote || undefined,
      isTransfer: false,
    });
  });

  // Calculate accurate account balances, credit card outstandings, and transaction counts
  walletPreviews.forEach(w => {
    let netSum = 0;
    let txCount = 0;
    parsedTxList.forEach(t => {
      if (t.accountName === w.name) {
        netSum += t.signedAmount;
        txCount++;
      } else if (t.toAccountName === w.name) {
        netSum += Math.abs(t.signedAmount);
        txCount++;
      }
    });

    w.transactionCount = txCount;

    if (w.isCreditCard) {
      w.suggestedOpeningBalance = Math.max(0, -netSum);
    } else {
      w.suggestedOpeningBalance = netSum;
    }
  });

  // Process Budgets
  const budgetPreviews: CashewBudgetPreview[] = rawBudgets.map(b => ({
    id: `bgt_cashew_${getVal(b, ['budgetPk', 'id', 'budget_pk']) || Math.random()}`,
    name: String(getVal(b, ['name', 'title']) || 'Monthly Budget'),
    amount: Number(getVal(b, ['amount', 'value']) || 0),
    color: getVal(b, ['colour', 'color']) ? (String(getVal(b, ['colour', 'color'])).startsWith('#') ? String(getVal(b, ['colour', 'color'])) : `#${getVal(b, ['colour', 'color'])}`) : '#10B981',
    startDate: getVal(b, ['startDate', 'start_date']) ? parseCashewDate(getVal(b, ['startDate', 'start_date'])).date : undefined,
    endDate: getVal(b, ['endDate', 'end_date']) ? parseCashewDate(getVal(b, ['endDate', 'end_date'])).date : undefined,
    periodLength: getVal(b, ['periodLength', 'period_length']),
    reoccurrence: getVal(b, ['reoccurrence']),
  }));

  // Process Objectives (Goals)
  const goalPreviews: CashewGoalPreview[] = rawObjectives.map(o => ({
    id: `goal_cashew_${getVal(o, ['objectivePk', 'id', 'objective_pk', 'goalPk']) || Math.random()}`,
    name: String(getVal(o, ['name', 'title']) || 'Savings Goal'),
    amount: Number(getVal(o, ['amount', 'targetAmount', 'target_amount']) || 0),
    color: getVal(o, ['colour', 'color']) ? (String(getVal(o, ['colour', 'color'])).startsWith('#') ? String(getVal(o, ['colour', 'color'])) : `#${getVal(o, ['colour', 'color'])}`) : '#8B5CF6',
    targetDate: getVal(o, ['endDate', 'targetDate', 'target_date', 'end_date']) ? parseCashewDate(getVal(o, ['endDate', 'targetDate', 'target_date', 'end_date'])).date : undefined,
  }));

  return {
    sourceType,
    sourceFileName: fileName,
    summary: {
      walletsCount: walletPreviews.length,
      categoriesCount: categoryPreviews.length,
      subcategoriesCount: subCategoriesList.length,
      transactionsCount: parsedTxList.length,
      transfersCount: parsedTxList.filter(t => t.type === 'TRANSFER').length,
      budgetsCount: budgetPreviews.length,
      goalsCount: goalPreviews.length,
      dateRange: minDate && maxDate ? { start: minDate, end: maxDate } : null,
      totalExpense,
      totalIncome,
      netVolume: totalIncome - totalExpense,
      currency: walletPreviews[0]?.currency || 'INR',
    },
    wallets: walletPreviews,
    categories: categoryPreviews,
    budgets: budgetPreviews,
    goals: goalPreviews,
    sampleTransactions: parsedTxList.slice(0, 15),
    allTransactions: parsedTxList,
    rawParsedData: {
      wallets: rawWallets,
      categories: rawCategories,
      transactions: rawTransactions,
      budgets: rawBudgets,
      objectives: rawObjectives,
    },
  };
}

/**
 * Parses Text files: Cashew CSV, Generic CSV, or JSON
 */
function parseCsvOrText(text: string, fileName: string): CashewImportPreview {
  const trimmed = text.trim();

  // Try JSON first
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsedJson = JSON.parse(trimmed);
      return parseJsonBackup(parsedJson, fileName);
    } catch {
      // Not JSON, continue to CSV
    }
  }

  // Parse CSV
  return parseCsvContent(trimmed, fileName);
}

/**
 * Handles JSON exports/backups
 */
function parseJsonBackup(json: any, fileName: string): CashewImportPreview {
  // If it's a MoneyTracker AppBackupData or Cashew JSON dump
  const transactions: any[] = json.transactions || (Array.isArray(json) ? json : []);
  const accounts: any[] = json.accounts || json.wallets || [];
  const categories: any[] = json.categories || [];
  const budgets: any[] = json.budgets || [];
  const goals: any[] = json.goals || json.objectives || [];

  const parsedTxList: CashewTransactionPreviewItem[] = transactions.map((t, idx) => {
    const rawAmt = Number(t.amount || 0);
    const amt = Math.abs(rawAmt);
    const isInc = t.type === 'INCOME' || t.income === true || (rawAmt > 0 && t.type !== 'EXPENSE');
    const isTrans = t.type === 'TRANSFER' || !!t.toAccountName || !!t.toAccountId;
    const signedAmt = isTrans ? -amt : (isInc ? amt : -amt);

    return {
      id: t.id || `tx_json_${idx}`,
      date: t.date || parseCashewDate(t.dateCreated || t.timestamp).date,
      time: t.time || '12:00',
      title: t.title || t.name || t.merchantName || 'Transaction',
      amount: amt,
      signedAmount: signedAmt,
      type: isTrans ? 'TRANSFER' : isInc ? 'INCOME' : 'EXPENSE',
      categoryName: t.categoryName || t.category || 'General',
      subcategoryName: t.subcategory || t.subCategoryName,
      accountName: t.accountName || t.walletName || 'Main Account',
      toAccountName: t.toAccountName,
      notes: t.notes || t.note,
      isTransfer: isTrans,
    };
  });

  const walletPreviews: CashewWalletPreview[] = accounts.map((a, idx) => {
    const wName = a.name || 'Account';
    let netSum = 0;
    parsedTxList.forEach(t => {
      if (t.accountName === wName) {
        netSum += t.signedAmount;
      } else if (t.toAccountName === wName) {
        netSum += Math.abs(t.signedAmount);
      }
    });
    const isCard = a.type === 'CREDIT_CARD' || !!a.creditLimit;
    return {
      id: a.id || `acc_json_${idx}`,
      originalPk: String(a.id || idx),
      name: wName,
      currency: a.currency || 'INR',
      color: a.color || '#0284C7',
      icon: a.icon || 'Landmark',
      isCreditCard: isCard,
      suggestedOpeningBalance: isCard ? Math.max(0, -netSum) : netSum,
      suggestedLimit: Number(a.creditLimit || 50000),
      transactionCount: parsedTxList.filter(t => t.accountName === wName || t.toAccountName === wName).length,
      isSelected: true,
      accountType: a.type || (isCard ? 'CREDIT_CARD' : 'SAVINGS'),
    };
  });

  const categoryPreviews: CashewCategoryPreview[] = categories.map((c, idx) => ({
    id: c.id || `cat_json_${idx}`,
    originalPk: String(c.id || idx),
    name: c.name || 'Category',
    color: c.color || '#3B82F6',
    icon: c.icon || 'Tag',
    emoji: c.emoji,
    type: c.type || 'EXPENSE',
    subcategories: c.subcategories || [],
    transactionCount: parsedTxList.filter(t => t.categoryName === c.name).length,
    isMatchedWithDefault: DEFAULT_CATEGORIES.some(dc => dc.name.toLowerCase() === (c.name || '').toLowerCase()),
  }));

  return {
    sourceType: 'CASHEW_JSON',
    sourceFileName: fileName,
    summary: {
      walletsCount: walletPreviews.length,
      categoriesCount: categoryPreviews.length,
      subcategoriesCount: categoryPreviews.reduce((acc, c) => acc + c.subcategories.length, 0),
      transactionsCount: parsedTxList.length,
      transfersCount: parsedTxList.filter(t => t.type === 'TRANSFER').length,
      budgetsCount: budgets.length,
      goalsCount: goals.length,
      dateRange: parsedTxList.length > 0 ? { start: parsedTxList[0].date, end: parsedTxList[parsedTxList.length - 1].date } : null,
      totalExpense: parsedTxList.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0),
      totalIncome: parsedTxList.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0),
      netVolume: 0,
      currency: walletPreviews[0]?.currency || 'INR',
    },
    wallets: walletPreviews,
    categories: categoryPreviews,
    budgets: budgets.map((b, idx) => ({
      id: b.id || `bgt_${idx}`,
      name: b.name || 'Budget',
      amount: Number(b.amount || 0),
      color: b.color || '#10B981',
      startDate: b.startDate,
      endDate: b.endDate,
    })),
    goals: goals.map((g, idx) => ({
      id: g.id || `goal_${idx}`,
      name: g.name || 'Goal',
      amount: Number(g.targetAmount || g.amount || 0),
      color: g.color || '#8B5CF6',
      targetDate: g.targetDate,
      currentAmount: g.currentAmount || 0,
    })),
    sampleTransactions: parsedTxList.slice(0, 15),
    allTransactions: parsedTxList,
    rawParsedData: {
      wallets: accounts,
      categories,
      transactions,
      budgets,
      objectives: goals,
    },
  };
}

/**
 * Robust CSV parser that handles quotes, linebreaks, Cashew headers & generic bank exports
 */
function parseCsvContent(csvString: string, fileName: string): CashewImportPreview {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let insideQuotes = false;

  for (let i = 0; i < csvString.length; i++) {
    const char = csvString[i];
    const nextChar = csvString[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal.trim());
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    throw new Error('CSV file is empty or could not be parsed.');
  }

  const rawHeaders = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  // Check if this is Cashew CSV format
  // Cashew CSV headers: account, amount, currency, title, note, date, income, type, category name, subcategory name, color, icon, emoji, budget, objective
  const isCashewCsv =
    rawHeaders.includes('account') &&
    rawHeaders.includes('amount') &&
    (rawHeaders.includes('categoryname') || rawHeaders.includes('category') || rawHeaders.includes('income'));

  const findCol = (terms: string[]): number => {
    for (const term of terms) {
      const idx = rawHeaders.findIndex(h => h.includes(term.toLowerCase().replace(/[^a-z0-9]/g, '')));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const colAccount = findCol(['account', 'wallet', 'source', 'accountname']);
  const colAmount = findCol(['amount', 'amountinr', 'transactionamount', 'spend']);
  const colDebit = findCol(['debit', 'withdrawal', 'expense']);
  const colCredit = findCol(['credit', 'deposit', 'income']);
  const colTitle = findCol(['title', 'payee', 'merchant', 'description', 'narrative', 'details', 'name']);
  const colDate = findCol(['date', 'transactiondate', 'datetime', 'posteddate']);
  const colTime = findCol(['time']);
  const colIncome = findCol(['income', 'isincome', 'type']);
  const colCategory = findCol(['categoryname', 'category', 'maincategory']);
  const colSubcategory = findCol(['subcategoryname', 'subcategory']);
  const colNote = findCol(['note', 'notes', 'memo', 'remarks', 'comment']);
  const colCurrency = findCol(['currency', 'curr']);
  const colBudget = findCol(['budget']);
  const colObjective = findCol(['objective', 'goal']);

  const walletsMap = new Map<string, CashewWalletPreview>();
  const categoriesMap = new Map<string, CashewCategoryPreview>();
  const budgetsMap = new Map<string, CashewBudgetPreview>();
  const goalsMap = new Map<string, CashewGoalPreview>();
  const parsedTxList: CashewTransactionPreviewItem[] = [];

  let totalIncome = 0;
  let totalExpense = 0;
  let minDate = '';
  let maxDate = '';

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || row.every(c => c === '')) continue;

    const accName = (colAccount !== -1 ? row[colAccount] : '') || 'Main Account';
    const rawAmt = colAmount !== -1 ? row[colAmount] : '';
    const debitAmt = colDebit !== -1 ? row[colDebit] : '';
    const creditAmt = colCredit !== -1 ? row[colCredit] : '';

    let amount = 0;
    let isIncome = false;

    if (debitAmt || creditAmt) {
      if (creditAmt && parseFloat(creditAmt.replace(/[^0-9.-]/g, '')) > 0) {
        amount = Math.abs(parseFloat(creditAmt.replace(/[^0-9.-]/g, '')));
        isIncome = true;
      } else if (debitAmt && parseFloat(debitAmt.replace(/[^0-9.-]/g, '')) > 0) {
        amount = Math.abs(parseFloat(debitAmt.replace(/[^0-9.-]/g, '')));
        isIncome = false;
      }
    } else {
      const numVal = parseFloat(rawAmt.replace(/[^0-9.-]/g, '')) || 0;
      amount = Math.abs(numVal);
      if (colIncome !== -1) {
        const incVal = (row[colIncome] || '').toLowerCase();
        isIncome = incVal === 'true' || incVal === 'income' || incVal === 'cr' || incVal === 'credit' || numVal > 0;
      } else {
        isIncome = numVal > 0;
      }
    }

    if (isNaN(amount) || amount === 0) continue;

    const title = (colTitle !== -1 ? row[colTitle] : '') || 'Transaction';
    const catName = (colCategory !== -1 ? row[colCategory] : '') || (isIncome ? 'Other Income' : 'Food & Dining');
    const subCatName = colSubcategory !== -1 ? row[colSubcategory] : undefined;
    const note = colNote !== -1 ? row[colNote] : undefined;
    const rawDate = colDate !== -1 ? row[colDate] : '';
    const rawTime = colTime !== -1 ? row[colTime] : '';
    const currency = (colCurrency !== -1 ? row[colCurrency] : 'INR') || 'INR';
    const budgetName = colBudget !== -1 ? row[colBudget] : undefined;
    const objectiveName = colObjective !== -1 ? row[colObjective] : undefined;

    const dateObj = parseCashewDate(rawDate, rawTime);
    if (!minDate || dateObj.date < minDate) minDate = dateObj.date;
    if (!maxDate || dateObj.date > maxDate) maxDate = dateObj.date;

    // Track Wallet
    if (!walletsMap.has(accName)) {
      const isCard =
        accName.toLowerCase().includes('card') ||
        accName.toLowerCase().includes('credit') ||
        accName.toLowerCase().includes('amex') ||
        accName.toLowerCase().includes('visa') ||
        accName.toLowerCase().includes('mastercard');

      walletsMap.set(accName, {
        id: `acc_csv_${walletsMap.size + 1}`,
        originalPk: accName,
        name: accName,
        currency: currency.toUpperCase(),
        color: '#0284C7',
        icon: isCard ? 'CreditCard' : 'Landmark',
        isCreditCard: isCard,
        suggestedOpeningBalance: 0,
        suggestedLimit: isCard ? 100000 : 0,
        transactionCount: 0,
        isSelected: true,
        accountType: isCard ? 'CREDIT_CARD' : 'SAVINGS',
      });
    }
    const wPreview = walletsMap.get(accName)!;
    wPreview.transactionCount++;

    // Track Category
    if (!categoriesMap.has(catName)) {
      const matched = DEFAULT_CATEGORIES.find(
        dc => dc.name.toLowerCase() === catName.toLowerCase()
      );
      categoriesMap.set(catName, {
        id: `cat_csv_${categoriesMap.size + 1}`,
        originalPk: catName,
        name: catName,
        color: matched?.color || '#3B82F6',
        icon: matched?.icon || (isIncome ? 'PlusCircle' : 'Utensils'),
        type: isIncome ? 'INCOME' : 'EXPENSE',
        subcategories: [],
        transactionCount: 0,
        isMatchedWithDefault: !!matched,
        matchedDefaultCategoryName: matched?.name,
      });
    }
    const cPreview = categoriesMap.get(catName)!;
    cPreview.transactionCount++;
    if (subCatName && !cPreview.subcategories.includes(subCatName)) {
      cPreview.subcategories.push(subCatName);
    }

    // Track Budgets
    if (budgetName && !budgetsMap.has(budgetName)) {
      budgetsMap.set(budgetName, {
        id: `bgt_csv_${budgetsMap.size + 1}`,
        name: budgetName,
        amount: 20000,
        color: '#10B981',
      });
    }

    // Track Goals
    if (objectiveName && !goalsMap.has(objectiveName)) {
      goalsMap.set(objectiveName, {
        id: `goal_csv_${goalsMap.size + 1}`,
        name: objectiveName,
        amount: 50000,
        color: '#8B5CF6',
      });
    }

    // Detect Initial Balance
    const isInitialBalance =
      catName.toLowerCase().includes('balance correction') ||
      catName.toLowerCase().includes('initial balance') ||
      title.toLowerCase().includes('initial balance');

    if (isInitialBalance) {
      if (isIncome) {
        wPreview.suggestedOpeningBalance += amount;
      } else {
        wPreview.suggestedOpeningBalance -= amount;
      }
    }

    const txType: TransactionType = isInitialBalance
      ? 'ADJUSTMENT'
      : isIncome
      ? 'INCOME'
      : 'EXPENSE';

    if (txType === 'INCOME') totalIncome += amount;
    if (txType === 'EXPENSE') totalExpense += amount;

    const rawNumVal = parseFloat(rawAmt.replace(/[^0-9.-]/g, '')) || (creditAmt ? parseFloat(creditAmt.replace(/[^0-9.-]/g, '')) : (debitAmt ? -parseFloat(debitAmt.replace(/[^0-9.-]/g, '')) : 0));
    const signedAmt = isInitialBalance ? rawNumVal : (isIncome ? amount : -amount);

    parsedTxList.push({
      id: `tx_csv_${r}`,
      date: dateObj.date,
      time: dateObj.time,
      title,
      amount,
      signedAmount: signedAmt,
      type: txType,
      categoryName: catName,
      subcategoryName: subCatName,
      accountName: accName,
      notes: note,
      isTransfer: false,
    });
  }

  const wallets = Array.from(walletsMap.values());
  wallets.forEach(w => {
    let netSum = 0;
    parsedTxList.forEach(t => {
      if (t.accountName === w.name) {
        netSum += t.signedAmount;
      } else if (t.toAccountName === w.name) {
        netSum += Math.abs(t.signedAmount);
      }
    });

    if (w.isCreditCard) {
      w.suggestedOpeningBalance = Math.max(0, -netSum);
    } else {
      w.suggestedOpeningBalance = netSum;
    }
  });
  const categories = Array.from(categoriesMap.values());
  const budgets = Array.from(budgetsMap.values());
  const goals = Array.from(goalsMap.values());

  return {
    sourceType: isCashewCsv ? 'CASHEW_CSV' : 'GENERIC_CSV',
    sourceFileName: fileName,
    summary: {
      walletsCount: wallets.length,
      categoriesCount: categories.length,
      subcategoriesCount: categories.reduce((acc, c) => acc + c.subcategories.length, 0),
      transactionsCount: parsedTxList.length,
      transfersCount: 0,
      budgetsCount: budgets.length,
      goalsCount: goals.length,
      dateRange: minDate && maxDate ? { start: minDate, end: maxDate } : null,
      totalExpense,
      totalIncome,
      netVolume: totalIncome - totalExpense,
      currency: wallets[0]?.currency || 'INR',
    },
    wallets,
    categories,
    budgets,
    goals,
    sampleTransactions: parsedTxList.slice(0, 15),
    allTransactions: parsedTxList,
    rawParsedData: {
      wallets,
      categories,
      transactions: parsedTxList,
      budgets,
      objectives: goals,
    },
  };
}

/**
 * Helper to parse various Cashew / ISO / Date strings to { date: YYYY-MM-DD, time: HH:mm }
 */
function parseCashewDate(dateVal: any, timeVal?: string): { date: string; time: string } {
  const now = new Date();
  const defaultDate = now.toISOString().substring(0, 10);
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (dateVal === undefined || dateVal === null || dateVal === '') {
    return { date: defaultDate, time: defaultTime };
  }

  if (dateVal instanceof Date) {
    if (!isNaN(dateVal.getTime())) {
      return {
        date: dateVal.toISOString().substring(0, 10),
        time: `${String(dateVal.getHours()).padStart(2, '0')}:${String(dateVal.getMinutes()).padStart(2, '0')}`,
      };
    }
  }

  // Handle number or numeric string (epoch milliseconds or seconds)
  const num = Number(dateVal);
  if (!isNaN(num) && num > 0) {
    const d = new Date(num > 1e11 ? num : num * 1000);
    if (!isNaN(d.getTime())) {
      return {
        date: d.toISOString().substring(0, 10),
        time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      };
    }
  }

  const str = String(dateVal).trim();

  // Try standard Date parser first (handles ISO strings and SQLite datetime strings like '2023-05-12 10:30:00')
  const normalizedStr = str.includes(' ') && !str.includes('T') ? str.replace(' ', 'T') : str;
  const parsedDate = new Date(normalizedStr);
  if (!isNaN(parsedDate.getTime())) {
    return {
      date: parsedDate.toISOString().substring(0, 10),
      time: `${String(parsedDate.getHours()).padStart(2, '0')}:${String(parsedDate.getMinutes()).padStart(2, '0')}`,
    };
  }

  // Try standard YYYY-MM-DD or SQLite datetime string
  const isoMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const date = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    let time = defaultTime;
    const timeMatch = str.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      time = `${timeMatch[1]}:${timeMatch[2]}`;
    } else if (timeVal) {
      const tvMatch = timeVal.match(/(\d{2}):(\d{2})/);
      if (tvMatch) time = `${tvMatch[1]}:${tvMatch[2]}`;
    }
    return { date, time };
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const date = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    let time = defaultTime;
    const timeMatch = str.match(/(\d{2}):(\d{2})/);
    if (timeMatch) time = `${timeMatch[1]}:${timeMatch[2]}`;
    return { date, time };
  }

  return { date: defaultDate, time: defaultTime };
}

/**
 * Maps Cashew icon and emoji names to Lucide icons
 */
function mapCashewIcon(iconName?: string, emojiName?: string): string {
  if (emojiName) return emojiName;
  if (!iconName) return 'Landmark';

  const name = iconName.toLowerCase().replace('.png', '').replace('.svg', '').trim();

  const iconMap: Record<string, string> = {
    cutlery: 'Utensils',
    food: 'Utensils',
    dining: 'Utensils',
    restaurant: 'Utensils',
    groceries: 'ShoppingCart',
    shopping: 'ShoppingBag',
    cart: 'ShoppingCart',
    tram: 'Train',
    car: 'Car',
    transit: 'Car',
    transport: 'Car',
    plane: 'Plane',
    flight: 'Plane',
    popcorn: 'Tv',
    entertainment: 'Gamepad2',
    movie: 'Film',
    game: 'Gamepad2',
    medical: 'HeartPulse',
    health: 'HeartPulse',
    hospital: 'Hospital',
    pharmacy: 'Pill',
    fuel: 'Fuel',
    gas: 'Fuel',
    petrol: 'Fuel',
    home: 'Home',
    rent: 'Home',
    house: 'Home',
    bill: 'Receipt',
    bills: 'Receipt',
    salary: 'Briefcase',
    work: 'Briefcase',
    gift: 'Gift',
    education: 'GraduationCap',
    school: 'GraduationCap',
    fitness: 'Dumbbell',
    gym: 'Dumbbell',
    pet: 'Dog',
    dog: 'Dog',
    cat: 'Cat',
    charts: 'BarChart3',
    investment: 'TrendingUp',
    money: 'Banknote',
    wallet: 'Wallet',
    card: 'CreditCard',
    bank: 'Landmark',
  };

  return iconMap[name] || 'Tag';
}

/**
 * Executes the actual import, integrating parsed data into the app state
 */
export function executeCashewImport(
  preview: CashewImportPreview,
  options: CashewImportOptions,
  currentState: LocalStorageState
): LocalStorageState {
  const now = Date.now();
  const isReplace = options.mode === 'REPLACE';

  // Base state
  let finalAccounts: Account[] = isReplace ? [] : [...currentState.accounts];
  let finalCreditCards: CreditCard[] = isReplace ? [] : [...currentState.creditCards];
  let finalCategories: Category[] = isReplace ? [...DEFAULT_CATEGORIES] : [...currentState.categories];
  let finalTransactions: Transaction[] = isReplace ? [] : [...currentState.transactions];
  let finalBudgets: Budget[] = isReplace ? [] : [...currentState.budgets];
  let finalGoals: Goal[] = isReplace ? [] : [...(currentState.goals || [])];

  // Map to resolve wallet/account references
  // walletName / originalPk -> new Account or CreditCard ID
  const accountLookup = new Map<string, { id: string; name: string; isCreditCard: boolean }>();

  // 1. Process Wallets & Accounts
  if (options.includeWallets) {
    preview.wallets.forEach(w => {
      if (!w.isSelected) return;

      // If mapped to existing account
      if (w.mappedAccountId) {
        const existingAcc = finalAccounts.find(a => a.id === w.mappedAccountId);
        const existingCard = finalCreditCards.find(c => c.id === w.mappedAccountId);
        if (existingAcc) {
          accountLookup.set(w.name, { id: existingAcc.id, name: existingAcc.name, isCreditCard: false });
          accountLookup.set(w.originalPk, { id: existingAcc.id, name: existingAcc.name, isCreditCard: false });
          return;
        }
        if (existingCard) {
          accountLookup.set(w.name, { id: existingCard.id, name: existingCard.name, isCreditCard: true });
          accountLookup.set(w.originalPk, { id: existingCard.id, name: existingCard.name, isCreditCard: true });
          return;
        }
      }

      // Check if account already exists with same name
      const existingAcc = !isReplace && finalAccounts.find(a => a.name.toLowerCase() === w.name.toLowerCase());
      const existingCard = !isReplace && finalCreditCards.find(c => c.name.toLowerCase() === w.name.toLowerCase());

      if (existingAcc) {
        accountLookup.set(w.name, { id: existingAcc.id, name: existingAcc.name, isCreditCard: false });
        accountLookup.set(w.originalPk, { id: existingAcc.id, name: existingAcc.name, isCreditCard: false });
        return;
      }
      if (existingCard) {
        accountLookup.set(w.name, { id: existingCard.id, name: existingCard.name, isCreditCard: true });
        accountLookup.set(w.originalPk, { id: existingCard.id, name: existingCard.name, isCreditCard: true });
        return;
      }

      // Create new Account or Credit Card
      if (w.isCreditCard || w.accountType === 'CREDIT_CARD') {
        const newCardId = `card_imp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const cardTheme: CardTheme = w.cardTheme || (CARD_THEMES[finalCreditCards.length % CARD_THEMES.length]?.id as CardTheme) || 'midnight';
        
        let network: CardNetwork = w.network || 'VISA';
        if (!w.network) {
          const lowerName = w.name.toLowerCase();
          if (lowerName.includes('master')) network = 'MASTERCARD';
          else if (lowerName.includes('rupay')) network = 'RUPAY';
          else if (lowerName.includes('amex')) network = 'AMEX';
          else if (lowerName.includes('diners')) network = 'DINERS';
        }

        const newCard: CreditCard = {
          id: newCardId,
          name: w.name,
          issuer: w.institution || 'Imported Card',
          network,
          cardTheme,
          lastFourDigits: w.lastFourDigits || '9999',
          creditLimit: w.suggestedLimit || 100000,
          openingBalance: options.autoSetOpeningBalances ? Math.max(0, w.suggestedOpeningBalance) : 0,
          currentOutstanding: options.autoSetOpeningBalances ? Math.max(0, w.suggestedOpeningBalance) : 0,
          statementDate: w.statementDate || 15,
          dueDate: w.dueDate || 5,
          icon: w.icon || 'CreditCard',
          color: w.color || '#3B82F6',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };
        finalCreditCards.push(newCard);
        accountLookup.set(w.name, { id: newCardId, name: w.name, isCreditCard: true });
        accountLookup.set(w.originalPk, { id: newCardId, name: w.name, isCreditCard: true });
      } else {
        const newAccId = `acc_imp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newAccount: Account = {
          id: newAccId,
          name: w.name,
          institution: w.institution || (w.name.includes('Bank') ? w.name : 'Imported Account'),
          type: w.accountType || 'SAVINGS',
          openingBalance: options.autoSetOpeningBalances ? w.suggestedOpeningBalance : 0,
          calculatedBalance: options.autoSetOpeningBalances ? w.suggestedOpeningBalance : 0,
          icon: w.icon || 'Landmark',
          color: w.color || '#0284C7',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };
        finalAccounts.push(newAccount);
        accountLookup.set(w.name, { id: newAccId, name: w.name, isCreditCard: false });
        accountLookup.set(w.originalPk, { id: newAccId, name: w.name, isCreditCard: false });
      }
    });
  }

  // Ensure there's at least one default account
  if (finalAccounts.length === 0 && finalCreditCards.length === 0) {
    const fallbackAcc: Account = {
      id: `acc_imp_default_${now}`,
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
    };
    finalAccounts.push(fallbackAcc);
    accountLookup.set('default', { id: fallbackAcc.id, name: fallbackAcc.name, isCreditCard: false });
  }

  // 2. Process Categories
  const categoryLookup = new Map<string, { id: string; name: string }>();

  if (options.includeCategories) {
    preview.categories.forEach(c => {
      if (c.isSelected === false) return;

      if (c.mappedCategoryId) {
        const mapped = finalCategories.find(fc => fc.id === c.mappedCategoryId);
        if (mapped) {
          categoryLookup.set(c.name, { id: mapped.id, name: mapped.name });
          categoryLookup.set(c.originalPk, { id: mapped.id, name: mapped.name });
          return;
        }
      }

      // Find existing category match
      const existing = finalCategories.find(
        fc => fc.name.toLowerCase() === c.name.toLowerCase()
      );

      if (existing) {
        categoryLookup.set(c.name, { id: existing.id, name: existing.name });
        categoryLookup.set(c.originalPk, { id: existing.id, name: existing.name });
        // Merge subcategories
        c.subcategories.forEach(sub => {
          if (!existing.subcategories.includes(sub)) {
            existing.subcategories.push(sub);
          }
        });
      } else {
        const newCatId = `cat_imp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newCat: Category = {
          id: newCatId,
          name: c.name,
          type: c.type,
          icon: c.icon || 'Tag',
          color: c.color || '#3B82F6',
          subcategories: [...c.subcategories],
          order: finalCategories.length + 1,
          isCustom: true,
        };
        finalCategories.push(newCat);
        categoryLookup.set(c.name, { id: newCatId, name: c.name });
        categoryLookup.set(c.originalPk, { id: newCatId, name: c.name });
      }
    });
  }

  // 3. Process Transactions
  if (options.includeTransactions) {
    const existingTxFingerprints = new Set(
      finalTransactions.map(t => `${t.date}_${t.amount.toFixed(2)}_${t.type}_${t.notes || ''}`)
    );

    const fallbackPrimaryAcc = finalAccounts[0] || finalCreditCards[0];

    preview.allTransactions.forEach((tx, idx) => {
      // Check if user excluded this transaction
      if (tx.isSelected === false) return;

      // Skip duplicate check
      if (options.skipDuplicateTransactions) {
        const fingerprint = `${tx.date}_${tx.amount.toFixed(2)}_${tx.type}_${tx.notes || ''}`;
        if (existingTxFingerprints.has(fingerprint)) return;
      }

      // Resolve Account
      const accInfo =
        accountLookup.get(tx.accountName) ||
        (fallbackPrimaryAcc ? { id: fallbackPrimaryAcc.id, name: fallbackPrimaryAcc.name, isCreditCard: 'creditLimit' in fallbackPrimaryAcc } : undefined);

      const toAccInfo = tx.toAccountName ? accountLookup.get(tx.toAccountName) : undefined;

      // Resolve Category
      const catInfo = categoryLookup.get(tx.categoryName) || { id: 'misc_expense', name: tx.categoryName || 'General' };

      const txId = `tx_imp_${now}_${idx}_${Math.random().toString(36).substring(2, 6)}`;

      const newTx: Transaction = {
        id: txId,
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
        time: tx.time || '12:00',
        timestamp: new Date(`${tx.date}T${tx.time || '12:00'}:00`).getTime() || now,
        categoryId: catInfo.id,
        categoryName: catInfo.name,
        subcategory: tx.subcategoryName,
        merchantName: tx.title,
        notes: tx.notes,
        accountId: accInfo && !accInfo.isCreditCard ? accInfo.id : undefined,
        accountName: accInfo && !accInfo.isCreditCard ? accInfo.name : undefined,
        creditCardId: accInfo && accInfo.isCreditCard ? accInfo.id : undefined,
        creditCardName: accInfo && accInfo.isCreditCard ? accInfo.name : undefined,
        toAccountId: toAccInfo && !toAccInfo.isCreditCard ? toAccInfo.id : undefined,
        toAccountName: toAccInfo && !toAccInfo.isCreditCard ? toAccInfo.name : undefined,
        createdAt: now,
        updatedAt: now,
      };

      finalTransactions.push(newTx);
    });
  }

  // 4. Process Budgets
  if (options.includeBudgets && preview.budgets.length > 0) {
    preview.budgets.forEach((b, idx) => {
      const newBudget: Budget = {
        id: `bgt_imp_${now}_${idx}`,
        name: b.name,
        amount: b.amount,
        month: 'ALL',
        rolloverType: 'NO_ROLLOVER',
        color: b.color || '#10B981',
      };
      finalBudgets.push(newBudget);
    });
  }

  // 5. Process Goals
  if (options.includeGoals && preview.goals.length > 0) {
    preview.goals.forEach((g, idx) => {
      const newGoal: Goal = {
        id: `goal_imp_${now}_${idx}`,
        name: g.name,
        targetAmount: g.amount,
        currentAmount: g.currentAmount || 0,
        targetDate: g.targetDate,
        color: g.color || '#8B5CF6',
        icon: 'Target',
        status: 'IN_PROGRESS',
        allocations: [],
        createdAt: now,
        updatedAt: now,
      };
      finalGoals.push(newGoal);
    });
  }

  // Generate audit activity log
  const newActivityLog = createActivityEntry(
    'SYSTEM',
    'IMPORT',
    `Imported ${preview.allTransactions.length} transactions, ${preview.wallets.length} accounts & ${preview.categories.length} categories from ${preview.sourceType} (${preview.sourceFileName})`
  );

  const updatedState: LocalStorageState = {
    ...currentState,
    accounts: finalAccounts,
    creditCards: finalCreditCards,
    categories: finalCategories,
    transactions: finalTransactions,
    budgets: finalBudgets,
    goals: finalGoals,
    activityLogs: [newActivityLog, ...(currentState.activityLogs || [])].slice(0, 2000),
  };

  return updatedState;
}
