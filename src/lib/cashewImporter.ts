import {
  Account,
  Category,
  Transaction,
  Budget,
  Goal,
  Subscription,
  DebtRecord,
  RecurringTransaction,
  TransactionType,
} from '../types';
import { LocalStorageState } from './storage';
import { CURRENCY_RATES, convertCurrency } from './currency';
import { DEFAULT_CATEGORIES } from './constants';

export interface CashewImportResult {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  subscriptions: Subscription[];
  debts: DebtRecord[];
  recurring: RecurringTransaction[];
  stats: {
    totalTransactions: number;
    incomeCount: number;
    expenseCount: number;
    transferCount: number;
    totalIncome: number;
    totalExpense: number;
    accountsCount: number;
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
}

/**
 * Convert Cashew/Flutter ARGB integer or hex color to clean #RRGGBB format
 */
export function normalizeCashewColor(rawColor: any): string {
  if (!rawColor) return '#3B82F6';
  const str = String(rawColor).trim();
  
  // If hex string like #FF5722 or #F57
  if (str.startsWith('#')) {
    if (str.length === 9) {
      // #AARRGGBB -> #RRGGBB
      return `#${str.slice(3)}`;
    }
    return str;
  }
  
  // If Flutter hex like 0xFF4CAF50 or 0x4CAF50
  if (str.startsWith('0x') || str.startsWith('0X')) {
    const hex = str.slice(2);
    if (hex.length === 8) {
      return `#${hex.slice(2)}`;
    }
    return `#${hex.padStart(6, '0')}`;
  }
  
  // If 32-bit signed or unsigned integer (e.g. 4283215696)
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

  if (icon.includes('food') || icon.includes('restaurant') || icon.includes('fastfood') || icon.includes('dining') || cat.includes('food') || cat.includes('dining') || cat.includes('grocer')) {
    return 'Utensils';
  }
  if (icon.includes('shopping') || icon.includes('cart') || icon.includes('bag') || cat.includes('shopping')) {
    return 'ShoppingBag';
  }
  if (icon.includes('flight') || icon.includes('plane') || icon.includes('travel') || icon.includes('hotel') || cat.includes('travel') || cat.includes('trip')) {
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
  if (icon.includes('health') || icon.includes('med') || icon.includes('hospital') || icon.includes('fitness') || icon.includes('gym') || cat.includes('health') || cat.includes('fitness')) {
    return 'Activity';
  }
  if (icon.includes('bill') || icon.includes('receipt') || icon.includes('electric') || icon.includes('utility') || cat.includes('utility') || cat.includes('bill')) {
    return 'Zap';
  }
  if (icon.includes('money') || icon.includes('cash') || icon.includes('salary') || icon.includes('income') || cat.includes('salary') || cat.includes('income')) {
    return 'Briefcase';
  }
  if (icon.includes('school') || icon.includes('book') || icon.includes('education') || cat.includes('education') || cat.includes('learning')) {
    return 'GraduationCap';
  }
  if (icon.includes('gift') || cat.includes('gift')) {
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
      // Milliseconds vs seconds vs microsecond timestamp
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
    if (currentRow.some(f => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Checks if a byte buffer is a SQLite 3 database
 */
export function isSqliteBinary(bytes: Uint8Array): boolean {
  if (bytes.length < 16) return false;
  const magic = [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61, 0x74, 0x20, 0x33, 0x00];
  for (let i = 0; i < 16; i++) {
    if (bytes[i] !== magic[i]) return false;
  }
  return true;
}

// --------------------------------------------------------------------------
// PURE TYPESCRIPT DIRECT SQLITE 3 BINARY B-TREE READER
// (Provides 100% reliable, zero-network, synchronous decoding of SQLite databases)
// --------------------------------------------------------------------------

class SqliteBinaryReader {
  private buffer: Uint8Array;
  private view: DataView;
  public pageSize: number;

  constructor(bytes: Uint8Array) {
    this.buffer = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const rawPageSize = this.view.getUint16(16, false);
    this.pageSize = rawPageSize === 1 ? 65536 : rawPageSize;
  }

  private readVarint(offset: number): { value: number; size: number } {
    let result = 0;
    let size = 0;
    for (let i = 0; i < 9; i++) {
      if (offset + i >= this.buffer.length) break;
      const b = this.buffer[offset + i];
      size++;
      if (i === 8) {
        result = (result * 256) + b;
        break;
      } else {
        result = (result * 128) + (b & 0x7F);
        if ((b & 0x80) === 0) break;
      }
    }
    return { value: result, size };
  }

  private parseRecordPayload(payloadBytes: Uint8Array): any[] {
    if (payloadBytes.length === 0) return [];
    const recordView = new DataView(payloadBytes.buffer, payloadBytes.byteOffset, payloadBytes.byteLength);
    const decoder = new TextDecoder('utf-8');

    // 1. Read header length
    let offset = 0;
    const headerVar = this.readVarintFromBuffer(payloadBytes, offset);
    const headerLength = headerVar.value;
    offset += headerVar.size;

    // 2. Read serial types
    const serialTypes: number[] = [];
    while (offset < headerLength && offset < payloadBytes.length) {
      const st = this.readVarintFromBuffer(payloadBytes, offset);
      serialTypes.push(st.value);
      offset += st.size;
    }

    // 3. Read column values
    let bodyOffset = headerLength;
    const values: any[] = [];

    for (const serial of serialTypes) {
      if (serial === 0) {
        values.push(null);
      } else if (serial === 1) {
        values.push(recordView.getInt8(bodyOffset));
        bodyOffset += 1;
      } else if (serial === 2) {
        values.push(recordView.getInt16(bodyOffset, false));
        bodyOffset += 2;
      } else if (serial === 3) {
        // 24-bit int
        const b0 = payloadBytes[bodyOffset];
        const b1 = payloadBytes[bodyOffset + 1];
        const b2 = payloadBytes[bodyOffset + 2];
        let val = (b0 << 16) | (b1 << 8) | b2;
        if (b0 & 0x80) val |= 0xFF000000;
        values.push(val);
        bodyOffset += 3;
      } else if (serial === 4) {
        values.push(recordView.getInt32(bodyOffset, false));
        bodyOffset += 4;
      } else if (serial === 5) {
        // 48-bit int
        const hi = recordView.getInt16(bodyOffset, false);
        const lo = recordView.getUint32(bodyOffset + 2, false);
        values.push(hi * 4294967296 + lo);
        bodyOffset += 6;
      } else if (serial === 6) {
        // 64-bit int
        const hi = recordView.getInt32(bodyOffset, false);
        const lo = recordView.getUint32(bodyOffset + 4, false);
        values.push(hi * 4294967296 + lo);
        bodyOffset += 8;
      } else if (serial === 7) {
        values.push(recordView.getFloat64(bodyOffset, false));
        bodyOffset += 8;
      } else if (serial === 8) {
        values.push(0);
      } else if (serial === 9) {
        values.push(1);
      } else if (serial >= 12 && serial % 2 === 0) {
        const len = (serial - 12) / 2;
        const slice = payloadBytes.subarray(bodyOffset, bodyOffset + len);
        values.push(slice);
        bodyOffset += len;
      } else if (serial >= 13 && serial % 2 === 1) {
        const len = (serial - 13) / 2;
        const slice = payloadBytes.subarray(bodyOffset, bodyOffset + len);
        values.push(decoder.decode(slice));
        bodyOffset += len;
      } else {
        values.push(null);
      }
    }

    return values;
  }

  private readVarintFromBuffer(buf: Uint8Array, offset: number): { value: number; size: number } {
    let result = 0;
    let size = 0;
    for (let i = 0; i < 9; i++) {
      if (offset + i >= buf.length) break;
      const b = buf[offset + i];
      size++;
      if (i === 8) {
        result = (result * 256) + b;
        break;
      } else {
        result = (result * 128) + (b & 0x7F);
        if ((b & 0x80) === 0) break;
      }
    }
    return { value: result, size };
  }

  private collectTableRecordsFromPage(pageNumber: number, records: any[][]): void {
    const pageOffset = (pageNumber - 1) * this.pageSize;
    if (pageOffset >= this.buffer.length) return;

    const isPage1 = pageNumber === 1;
    const headerStart = isPage1 ? 100 : 0;
    const pageType = this.buffer[pageOffset + headerStart];

    if (pageType === 0x0D) {
      // Leaf table B-Tree page
      const cellCount = this.view.getUint16(pageOffset + headerStart + 3, false);
      const pointerArrayStart = pageOffset + headerStart + 8;

      for (let c = 0; c < cellCount; c++) {
        const cellOffsetWithinPage = this.view.getUint16(pointerArrayStart + c * 2, false);
        const cellAbsOffset = pageOffset + cellOffsetWithinPage;
        if (cellAbsOffset >= this.buffer.length) continue;

        let cur = cellAbsOffset;
        const payloadVar = this.readVarint(cur);
        cur += payloadVar.size;
        const rowidVar = this.readVarint(cur);
        cur += rowidVar.size;

        const payloadLength = payloadVar.value;
        const payloadSlice = this.buffer.subarray(cur, cur + payloadLength);
        const record = this.parseRecordPayload(payloadSlice);
        if (record.length > 0) {
          records.push(record);
        }
      }
    } else if (pageType === 0x05) {
      // Interior table B-Tree page
      const cellCount = this.view.getUint16(pageOffset + headerStart + 3, false);
      const rightmostChild = this.view.getUint32(pageOffset + headerStart + 8, false);
      const pointerArrayStart = pageOffset + headerStart + 12;

      for (let c = 0; c < cellCount; c++) {
        const cellOffsetWithinPage = this.view.getUint16(pointerArrayStart + c * 2, false);
        const cellAbsOffset = pageOffset + cellOffsetWithinPage;
        if (cellAbsOffset + 4 > this.buffer.length) continue;
        const childPage = this.view.getUint32(cellAbsOffset, false);
        this.collectTableRecordsFromPage(childPage, records);
      }

      if (rightmostChild > 0) {
        this.collectTableRecordsFromPage(rightmostChild, records);
      }
    }
  }

  public extractAllTables(): Record<string, { columns: string[]; rows: any[][] }> {
    const tables: Record<string, { columns: string[]; rows: any[][] }> = {};

    // Page 1 is sqlite_master
    const masterRecords: any[][] = [];
    this.collectTableRecordsFromPage(1, masterRecords);

    // sqlite_master format: [type (0), name (1), tbl_name (2), rootpage (3), sql (4)]
    masterRecords.forEach(rec => {
      const type = String(rec[0] || '').toLowerCase();
      const name = String(rec[1] || '').toLowerCase();
      const rootPage = typeof rec[3] === 'number' ? rec[3] : parseInt(String(rec[3]), 10);
      const sql = String(rec[4] || '');

      if (type === 'table' && name && !name.startsWith('sqlite_') && rootPage > 0) {
        const canonical = normalizeTableName(name);
        const rows: any[][] = [];
        this.collectTableRecordsFromPage(rootPage, rows);

        // Extract column names from CREATE TABLE SQL
        const columns = extractColumnsFromCreateSql(sql, canonical);
        tables[canonical] = { columns, rows };
      }
    });

    return tables;
  }
}

function extractColumnsFromCreateSql(sql: string, tableName: string): string[] {
  if (!sql) return KNOWN_CASHEW_SCHEMAS[tableName] || [];
  const match = sql.match(/\(([\s\S]*)\)/);
  if (!match) return KNOWN_CASHEW_SCHEMAS[tableName] || [];

  const body = match[1];
  const columns: string[] = [];
  let currentDef = '';
  let parenDepth = 0;

  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '(') parenDepth++;
    else if (c === ')') parenDepth--;
    else if (c === ',' && parenDepth === 0) {
      processColumnDef(currentDef, columns);
      currentDef = '';
      continue;
    }
    currentDef += c;
  }
  if (currentDef.trim()) {
    processColumnDef(currentDef, columns);
  }

  return columns.length > 0 ? columns : (KNOWN_CASHEW_SCHEMAS[tableName] || []);
}

function processColumnDef(rawDef: string, columnsList: string[]) {
  const trimmed = rawDef.trim();
  if (!trimmed) return;
  const upper = trimmed.toUpperCase();
  
  if (
    upper.startsWith('PRIMARY KEY') ||
    upper.startsWith('FOREIGN KEY') ||
    upper.startsWith('CONSTRAINT') ||
    upper.startsWith('UNIQUE') ||
    upper.startsWith('CHECK')
  ) {
    return;
  }

  const match = trimmed.match(/^["`'\[]?([a-zA-Z0-9_]+)["`'\]]?/);
  if (match && match[1]) {
    columnsList.push(match[1].toLowerCase());
  }
}

/**
 * Standard known column definitions across Cashew versions (v1 through v48+)
 */
const KNOWN_CASHEW_SCHEMAS: Record<string, string[]> = {
  transaction: [
    'transaction_pk', 'paired_transaction_fk', 'name', 'amount', 'note',
    'category_fk', 'sub_category_fk', 'wallet_fk', 'to_wallet_fk', 'date_created',
    'income', 'paid', 'skip_paid', 'method_added', 'transaction_owner_email',
    'transaction_original_owner_email', 'shared_key', 'shared_old_key',
    'shared_status', 'shared_date_updated', 'type', 'original_currency',
    'exchange_rate', 'created_another_transaction', 'amount_unpaid'
  ],
  wallet: [
    'wallet_pk', 'name', 'colour', 'date_created', 'date_time_modified',
    'order', 'currency', 'currency_format', 'decimals', 'wallet_owner_email', 'icon_name'
  ],
  category: [
    'category_pk', 'name', 'colour', 'icon_name', 'order',
    'date_created', 'date_time_modified', 'category_owner_email', 'main_category_pk'
  ],
  budget: [
    'budget_pk', 'name', 'amount', 'colour', 'date_created',
    'date_time_modified', 'budget_transaction_filters', 'reoccurs', 'period_length', 'budget_owner_email'
  ],
  objective: [
    'objective_pk', 'name', 'amount', 'current_amount', 'colour',
    'date_created', 'end_date', 'icon_name', 'order', 'objective_owner_email'
  ],
  debt: [
    'debt_pk', 'name', 'amount', 'amount_unpaid', 'note',
    'date_created', 'date_due', 'paid', 'type', 'debt_owner_email'
  ],
  recurring_transaction: [
    'recurring_transaction_pk', 'name', 'amount', 'note', 'category_fk',
    'sub_category_fk', 'wallet_fk', 'to_wallet_fk', 'date_created', 'income',
    'period_length', 'reoccurs'
  ],
};

function normalizeTableName(rawTable: string): string {
  const clean = rawTable.toLowerCase().replace(/["'`\[\]]/g, '').trim();
  if (clean === 'transactions' || clean === 'transaction' || clean === 'tbl_transaction') return 'transaction';
  if (clean === 'wallets' || clean === 'wallet' || clean === 'accounts' || clean === 'account') return 'wallet';
  if (clean === 'categories' || clean === 'category') return 'category';
  if (clean === 'budgets' || clean === 'budget') return 'budget';
  if (clean === 'objectives' || clean === 'objective' || clean === 'goals' || clean === 'goal') return 'objective';
  if (clean === 'debts' || clean === 'debt') return 'debt';
  if (clean.includes('recurring')) return 'recurring_transaction';
  if (clean.includes('title')) return 'associated_title';
  return clean;
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
    createMissingCategories: true,
    createMissingAccounts: true,
  }
): Promise<CashewImportResult> {
  const warnings: string[] = [];

  // Convert input to Uint8Array for binary detection
  let uint8Bytes: Uint8Array | null = null;
  if (input instanceof ArrayBuffer) {
    uint8Bytes = new Uint8Array(input);
  } else if (input instanceof Uint8Array) {
    uint8Bytes = input;
  }

  // 1. Check if SQLite Binary Database (e.g. cashew-db-v48-Pixel7a.sql / .db)
  if (uint8Bytes && isSqliteBinary(uint8Bytes)) {
    return parseSqliteBinaryDatabase(uint8Bytes, existingState, options, warnings);
  }

  // If input is text or needs decoding
  let textContent = '';
  if (typeof input === 'string') {
    textContent = input;
  } else if (uint8Bytes) {
    // Attempt decoding as UTF-8
    try {
      const decoder = new TextDecoder('utf-8');
      textContent = decoder.decode(uint8Bytes);
    } catch (e) {
      textContent = '';
    }
  }

  return parseCashewData(textContent, existingState, options);
}

/**
 * Synchronous entry point for text-based imports (CSV, JSON, SQL text)
 */
export function parseCashewData(
  fileContent: string,
  existingState: LocalStorageState,
  options: CashewImportOptions = {
    mode: 'MERGE',
    defaultCurrency: 'INR',
    autoConvertForeignCurrencies: true,
    createMissingCategories: true,
    createMissingAccounts: true,
  }
): CashewImportResult {
  const warnings: string[] = [];
  if (!fileContent || !fileContent.trim()) {
    return compileImportStats([], [], [], [], [], [], [], [], new Set(), ['Empty file content.']);
  }

  let cleanContent = fileContent;
  if (cleanContent.charCodeAt(0) === 0xFEFF) {
    cleanContent = cleanContent.slice(1);
  }
  const trimmed = cleanContent.trim();

  // 1. Check if JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsedJson = JSON.parse(trimmed);
      return parseCashewJson(parsedJson, existingState, options, warnings);
    } catch (e) {
      // Continue to check if SQL or CSV
    }
  }

  // 2. Check if SQL Text Dump
  const upper = trimmed.toUpperCase();
  if (
    upper.includes('INSERT INTO') ||
    upper.includes('INSERT OR REPLACE INTO') ||
    upper.includes('INSERT OR IGNORE INTO') ||
    upper.includes('CREATE TABLE') ||
    upper.includes('PRAGMA') ||
    upper.includes('BEGIN TRANSACTION') ||
    upper.includes('"TRANSACTION"') ||
    upper.includes('`TRANSACTION`') ||
    upper.includes("'TRANSACTION'") ||
    upper.includes('WALLET_PK') ||
    upper.includes('TRANSACTION_PK')
  ) {
    return parseCashewSqlText(trimmed, existingState, options, warnings);
  }

  // 3. Fallback to CSV Parsing
  return parseCashewCsv(trimmed, existingState, options, warnings);
}

/**
 * Parses a SQLite binary database file directly using the pure-TS B-Tree engine
 */
async function parseSqliteBinaryDatabase(
  bytes: Uint8Array,
  existingState: LocalStorageState,
  options: CashewImportOptions,
  warnings: string[]
): Promise<CashewImportResult> {
  const extractedJson: any = {
    wallets: [],
    categories: [],
    transactions: [],
    budgets: [],
    objectives: [],
    debts: [],
    recurringTransactions: [],
  };

  try {
    const reader = new SqliteBinaryReader(bytes);
    const tables = reader.extractAllTables();

    Object.entries(tables).forEach(([tableKey, data]) => {
      const rowsAsObjects = data.rows.map(row => {
        const obj: Record<string, any> = {};
        data.columns.forEach((col, idx) => {
          obj[col] = row[idx] !== undefined ? row[idx] : null;
        });
        return obj;
      });

      if (tableKey === 'wallet') extractedJson.wallets.push(...rowsAsObjects);
      else if (tableKey === 'category') extractedJson.categories.push(...rowsAsObjects);
      else if (tableKey === 'transaction') extractedJson.transactions.push(...rowsAsObjects);
      else if (tableKey === 'budget') extractedJson.budgets.push(...rowsAsObjects);
      else if (tableKey === 'objective') extractedJson.objectives.push(...rowsAsObjects);
      else if (tableKey === 'debt') extractedJson.debts.push(...rowsAsObjects);
      else if (tableKey === 'recurring_transaction') extractedJson.recurringTransactions.push(...rowsAsObjects);
    });
  } catch (directErr) {
    warnings.push(`Binary SQLite reader notice: ${directErr instanceof Error ? directErr.message : 'Structure parsed with fallback'}`);
  }

  if (extractedJson.transactions.length === 0 && extractedJson.wallets.length === 0) {
    warnings.push('The SQLite backup file contained 0 transactions or wallets.');
  }

  return parseCashewJson(extractedJson, existingState, options, warnings);
}

/**
 * Parse Cashew JSON export or Drift Schema JSON dump
 */
function parseCashewJson(
  data: any,
  existingState: LocalStorageState,
  options: CashewImportOptions,
  warnings: string[]
): CashewImportResult {
  const accounts: Account[] = [];
  const categories: Category[] = [];
  const transactions: Transaction[] = [];
  const budgets: Budget[] = [];
  const goals: Goal[] = [];
  const subscriptions: Subscription[] = [];
  const debts: DebtRecord[] = [];
  const recurring: RecurringTransaction[] = [];
  const currenciesSet = new Set<string>();

  // Foreign Key ID lookups
  const accountPkToIdMap = new Map<string, string>();
  const categoryPkToIdMap = new Map<string, string>();
  const categoryPkToNameMap = new Map<string, string>();
  const subcategoryPkToInfoMap = new Map<string, { parentId: string; parentName: string; subcategoryName: string }>();

  // --- 1. Wallets / Accounts ---
  const rawWallets = Array.isArray(data.wallets) ? data.wallets : (Array.isArray(data.accounts) ? data.accounts : []);
  rawWallets.forEach((w: any, index: number) => {
    const pk = String(w.wallet_pk !== undefined ? w.wallet_pk : (w.walletPk !== undefined ? w.walletPk : (w.id !== undefined ? w.id : `wallet_${index}`)));
    const name = w.name || `Cashew Account ${index + 1}`;
    const color = normalizeCashewColor(w.colour || w.color || '#10B981');
    const currency = (w.currency || options.defaultCurrency || 'INR').toUpperCase().trim();
    currenciesSet.add(currency);

    const existingAcc = existingState.accounts.find(a => a.name.toLowerCase() === name.toLowerCase());
    const accountId = existingAcc ? existingAcc.id : `acc_cashew_${Date.now()}_${index}`;
    accountPkToIdMap.set(pk, accountId);

    if (!existingAcc || options.mode === 'REPLACE') {
      const lower = name.toLowerCase();
      const type = lower.includes('cash') ? 'CASH' : lower.includes('card') ? 'CREDIT_CARD' : 'SAVINGS';
      accounts.push({
        id: accountId,
        name,
        institution: 'Cashew Import',
        type,
        openingBalance: parseFloat(w.initial_balance || w.initialBalance || w.opening_balance || 0),
        calculatedBalance: 0,
        color,
        icon: mapCashewIcon(w.icon_name || w.iconName, name),
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  });

  // --- 2. Categories & Subcategories Hierarchy ---
  const rawCategories = Array.isArray(data.categories) ? data.categories : [];
  
  const rootCategoriesRaw: any[] = [];
  const subCategoriesRaw: any[] = [];

  rawCategories.forEach((c: any) => {
    const mainPk = c.main_category_pk || c.mainCategoryPk;
    if (mainPk && mainPk !== 'null' && mainPk !== 'NULL' && mainPk !== '' && String(mainPk) !== '0') {
      subCategoriesRaw.push(c);
    } else {
      rootCategoriesRaw.push(c);
    }
  });

  // Process root categories first
  rootCategoriesRaw.forEach((c: any, index: number) => {
    const pk = String(c.category_pk !== undefined ? c.category_pk : (c.categoryPk !== undefined ? c.categoryPk : (c.id !== undefined ? c.id : `cat_${index}`)));
    const name = c.name || `Category ${index + 1}`;
    const color = normalizeCashewColor(c.colour || c.color || '#3B82F6');
    const icon = mapCashewIcon(c.icon_name || c.iconName, name);

    const existingCat = existingState.categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
    const categoryId = existingCat ? existingCat.id : `cat_cashew_${Date.now()}_${index}`;
    categoryPkToIdMap.set(pk, categoryId);
    categoryPkToNameMap.set(pk, name);

    const initialSubs = Array.isArray(c.subcategories) ? c.subcategories : [];

    if (!existingCat || options.mode === 'REPLACE') {
      categories.push({
        id: categoryId,
        name,
        type: 'BOTH',
        icon,
        color,
        subcategories: initialSubs,
        isCustom: true,
        order: c.order || 50 + index,
      });
    }
  });

  // Process subcategories and link to parent
  subCategoriesRaw.forEach((sub: any, index: number) => {
    const subPk = String(sub.category_pk !== undefined ? sub.category_pk : (sub.categoryPk !== undefined ? sub.categoryPk : `subcat_${index}`));
    const mainPk = String(sub.main_category_pk || sub.mainCategoryPk);
    const subName = sub.name || `Subcategory ${index + 1}`;

    const parentCatId = categoryPkToIdMap.get(mainPk);
    const parentCatName = categoryPkToNameMap.get(mainPk) || 'Other Expenses';

    if (parentCatId) {
      const catObj = [...categories, ...existingState.categories].find(cat => cat.id === parentCatId);
      if (catObj && !catObj.subcategories.includes(subName)) {
        catObj.subcategories.push(subName);
      }
      subcategoryPkToInfoMap.set(subPk, {
        parentId: parentCatId,
        parentName: parentCatName,
        subcategoryName: subName,
      });
      categoryPkToIdMap.set(subPk, parentCatId);
    } else {
      const standaloneId = `cat_cashew_sub_${Date.now()}_${index}`;
      categoryPkToIdMap.set(subPk, standaloneId);
      categoryPkToNameMap.set(subPk, subName);
      categories.push({
        id: standaloneId,
        name: subName,
        type: 'BOTH',
        icon: mapCashewIcon(sub.icon_name || sub.iconName, subName),
        color: normalizeCashewColor(sub.colour || sub.color || '#8B5CF6'),
        subcategories: [],
        isCustom: true,
        order: 70 + index,
      });
    }
  });

  // --- 3. Transactions ---
  const rawTransactions = Array.isArray(data.transactions) ? data.transactions : [];
  rawTransactions.forEach((t: any, index: number) => {
    const rawAmt = parseFloat(t.amount || 0);
    
    // Cashew income flag check (0 = expense, 1 = income, 2 = transfer)
    const incomeVal = t.income;
    const isExplicitIncome = incomeVal === 1 || incomeVal === true || String(incomeVal) === '1' || String(incomeVal).toLowerCase() === 'true' || t.type === 'income' || t.type === 1;
    const isTransfer = t.type === 'transfer' || t.type === 2 || incomeVal === 2 || String(incomeVal) === '2' || !!t.to_wallet_fk || !!t.toWalletFk;

    let type: TransactionType = isTransfer ? 'TRANSFER' : isExplicitIncome ? 'INCOME' : 'EXPENSE';
    
    if (!isTransfer && !isExplicitIncome && rawAmt > 0 && incomeVal === undefined && t.type === undefined) {
      type = 'INCOME';
    }

    let amount = Math.abs(rawAmt);

    // Multi-currency handling
    const txCurrency = (t.currency || t.original_currency || options.defaultCurrency || 'INR').toUpperCase().trim();
    currenciesSet.add(txCurrency);
    let originalCurrency: string | undefined = undefined;
    let originalAmount: number | undefined = undefined;
    let exchangeRate: number | undefined = undefined;

    if (txCurrency !== 'INR') {
      originalCurrency = txCurrency;
      originalAmount = amount;
      exchangeRate = parseFloat(t.exchange_rate) || CURRENCY_RATES[txCurrency]?.rateToINR || 1;
      if (options.autoConvertForeignCurrencies) {
        amount = convertCurrency(amount, txCurrency, 'INR');
      }
    }

    const { date, time, timestamp } = parseCashewDateTime(t.date_created || t.dateCreated || t.date);
    const walletFk = String(t.wallet_fk !== undefined ? t.wallet_fk : (t.walletFk !== undefined ? t.walletFk : (t.wallet || '')));
    const toWalletFk = String(t.to_wallet_fk !== undefined ? t.to_wallet_fk : (t.toWalletFk !== undefined ? t.toWalletFk : (t.toWallet || '')));
    const categoryFk = String(t.category_fk !== undefined ? t.category_fk : (t.categoryFk !== undefined ? t.categoryFk : (t.category || '')));
    const subcategoryFk = String(t.sub_category_fk !== undefined ? t.sub_category_fk : (t.subCategoryFk !== undefined ? t.subCategoryFk : ''));

    let accountId = accountPkToIdMap.get(walletFk) || options.defaultAccountId || accounts[0]?.id || existingState.accounts[0]?.id;
    let toAccountId = toWalletFk ? accountPkToIdMap.get(toWalletFk) : undefined;

    if (!accountId && options.createMissingAccounts) {
      const fallbackAcc: Account = {
        id: `acc_cashew_auto_${Date.now()}_${accounts.length}`,
        name: 'Cashew Main Wallet',
        institution: 'Cashew Import',
        type: 'SAVINGS',
        openingBalance: 0,
        calculatedBalance: 0,
        color: '#10B981',
        icon: 'Landmark',
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      accounts.push(fallbackAcc);
      accountId = fallbackAcc.id;
    }

    const accountObj = [...accounts, ...existingState.accounts].find(a => a.id === accountId);
    const toAccountObj = toAccountId ? [...accounts, ...existingState.accounts].find(a => a.id === toAccountId) : undefined;

    // Category and subcategory resolution
    let categoryId: string | undefined;
    let categoryName: string | undefined;
    let subcategoryName: string | undefined = t.subcategory || t.sub_category_name;

    if (subcategoryFk && subcategoryPkToInfoMap.has(subcategoryFk)) {
      const info = subcategoryPkToInfoMap.get(subcategoryFk)!;
      categoryId = info.parentId;
      categoryName = info.parentName;
      subcategoryName = info.subcategoryName;
    } else if (categoryFk && subcategoryPkToInfoMap.has(categoryFk)) {
      const info = subcategoryPkToInfoMap.get(categoryFk)!;
      categoryId = info.parentId;
      categoryName = info.parentName;
      subcategoryName = info.subcategoryName;
    } else if (categoryFk) {
      categoryId = categoryPkToIdMap.get(categoryFk);
      categoryName = categoryPkToNameMap.get(categoryFk);
    }

    if (!categoryName) {
      categoryName = t.category_name || t.categoryName || (type === 'INCOME' ? 'Salary & Income' : 'Other Expenses');
    }

    const titleName = (t.name || t.title || '').trim();
    const noteText = (t.note || t.notes || '').trim();
    
    let merchantName: string | undefined = t.merchant || t.payer || t.payee;
    let notes = '';

    if (titleName && noteText) {
      merchantName = merchantName || titleName;
      notes = noteText;
    } else if (titleName && !noteText) {
      merchantName = merchantName || (type === 'EXPENSE' ? titleName : undefined);
      notes = titleName;
    } else if (!titleName && noteText) {
      merchantName = merchantName || (type === 'EXPENSE' ? noteText.slice(0, 30) : undefined);
      notes = noteText;
    } else {
      notes = categoryName || 'Cashew Transaction';
    }

    const tags = Array.isArray(t.tags) 
      ? t.tags 
      : (typeof t.tags === 'string' ? t.tags.split(',').map((s: string) => s.trim()).filter(Boolean) : []);

    transactions.push({
      id: `tx_cashew_${t.transaction_pk || t.transactionPk || t.id || `${Date.now()}_${index}`}`,
      amount,
      type,
      date,
      time,
      timestamp,
      categoryId,
      categoryName,
      subcategory: subcategoryName,
      merchantName,
      accountId,
      accountName: accountObj?.name,
      toAccountId,
      toAccountName: toAccountObj?.name,
      notes,
      tags,
      originalCurrency,
      originalAmount,
      exchangeRate,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  // --- 4. Budgets ---
  const rawBudgets = Array.isArray(data.budgets) ? data.budgets : [];
  rawBudgets.forEach((b: any, index: number) => {
    const catFk = Array.isArray(b.category_fks || b.categoryFks) ? (b.category_fks || b.categoryFks)[0] : b.category_fk;
    const catId = categoryPkToIdMap.get(String(catFk));
    budgets.push({
      id: `bgt_cashew_${Date.now()}_${index}`,
      name: b.name || `Cashew Budget ${index + 1}`,
      amount: parseFloat(b.amount || 0),
      categoryId: catId,
      month: 'ALL',
      rolloverType: b.reoccurs ? 'ROLLOVER_POSITIVE' : 'NO_ROLLOVER',
      color: normalizeCashewColor(b.colour || b.color || '#6366F1'),
    });
  });

  // --- 5. Objectives / Goals ---
  const rawGoals = Array.isArray(data.objectives) ? data.objectives : (Array.isArray(data.goals) ? data.goals : []);
  rawGoals.forEach((g: any, index: number) => {
    const targetDate = g.end_date || g.endDate ? parseCashewDateTime(g.end_date || g.endDate).date : undefined;
    goals.push({
      id: `goal_cashew_${Date.now()}_${index}`,
      name: g.name || `Cashew Goal ${index + 1}`,
      targetAmount: parseFloat(g.amount || g.targetAmount || 0),
      currentAmount: parseFloat(g.current_amount || g.currentAmount || 0),
      targetDate,
      color: normalizeCashewColor(g.colour || g.color || '#F59E0B'),
      icon: mapCashewIcon(g.icon_name || g.iconName, g.name),
      status: 'IN_PROGRESS',
      allocations: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  // --- 6. Debts ---
  const rawDebts = Array.isArray(data.debts) ? data.debts : [];
  rawDebts.forEach((d: any, index: number) => {
    debts.push({
      id: `debt_cashew_${Date.now()}_${index}`,
      personName: d.name || d.person_name || `Contact ${index + 1}`,
      amount: parseFloat(d.amount || 0),
      remainingAmount: parseFloat(d.amount_unpaid || d.amountUnpaid || d.amount || 0),
      type: d.type === 'borrowed' || d.type === 1 ? 'BORROWED' : 'LENT',
      isSettled: d.paid === true || d.paid === 1,
      dueDate: d.date_due ? parseCashewDateTime(d.date_due).date : undefined,
      notes: d.note || d.notes,
      createdAt: Date.now(),
    });
  });

  return compileImportStats(accounts, categories, transactions, budgets, goals, subscriptions, debts, recurring, currenciesSet, warnings);
}

/**
 * Parse SQLite Tuple Tokenizer that extracts arrays of values from VALUES clause
 */
function parseSqlInsertTuples(valuesBlock: string): any[][] {
  const rows: any[][] = [];
  let i = 0;
  const len = valuesBlock.length;

  while (i < len) {
    while (i < len && valuesBlock[i] !== '(') {
      i++;
    }
    if (i >= len) break;
    i++;

    const currentRow: any[] = [];
    let currentVal = '';
    let inString = false;
    let quoteChar = '';

    while (i < len) {
      const char = valuesBlock[i];

      if (inString) {
        if (char === quoteChar) {
          if (i + 1 < len && valuesBlock[i + 1] === quoteChar) {
            currentVal += quoteChar;
            i += 2;
            continue;
          } else {
            inString = false;
          }
        } else if (char === '\\' && i + 1 < len) {
          const nextChar = valuesBlock[i + 1];
          if (nextChar === quoteChar || nextChar === '\\') {
            currentVal += nextChar;
            i += 2;
            continue;
          } else {
            currentVal += char;
          }
        } else {
          currentVal += char;
        }
      } else {
        if (char === "'" || char === '"') {
          inString = true;
          quoteChar = char;
        } else if (char === ',') {
          currentRow.push(cleanSqlValue(currentVal));
          currentVal = '';
        } else if (char === ')') {
          currentRow.push(cleanSqlValue(currentVal));
          currentVal = '';
          rows.push(currentRow);
          i++;
          break;
        } else {
          currentVal += char;
        }
      }
      i++;
    }
  }

  return rows;
}

function cleanSqlValue(val: string): any {
  const trimmed = val.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (upper === 'NULL') return null;
  if (upper === 'TRUE') return true;
  if (upper === 'FALSE') return false;
  
  if (/^X'([0-9a-fA-F]*)'$/i.test(trimmed)) {
    return trimmed;
  }

  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    const num = Number(trimmed);
    return isNaN(num) ? trimmed : num;
  }

  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

/**
 * Parse Cashew SQL text dump (INSERT statements)
 */
function parseCashewSqlText(
  sqlText: string,
  existingState: LocalStorageState,
  options: CashewImportOptions,
  warnings: string[]
): CashewImportResult {
  const extractedJson: any = {
    wallets: [],
    categories: [],
    transactions: [],
    budgets: [],
    objectives: [],
    debts: [],
    recurringTransactions: [],
  };

  const insertRegex = /INSERT\s+(?:OR\s+(?:REPLACE|IGNORE)\s+)?INTO\s+["`'\[]?([a-zA-Z0-9_]+)["`'\]]?(?:\s*\(([^)]+)\))?\s+VALUES\s*([\s\S]*?)(?:;\s*(?:INSERT|CREATE|PRAGMA|BEGIN|COMMIT|ROLLBACK|DROP|ALTER|--|$)|;\s*$)/gi;
  let match: RegExpExecArray | null;

  while ((match = insertRegex.exec(sqlText)) !== null) {
    const rawTable = match[1];
    const canonicalTable = normalizeTableName(rawTable);
    const explicitColsStr = match[2];
    const valuesBody = match[3];

    let columns: string[] = [];
    if (explicitColsStr) {
      columns = explicitColsStr.split(',').map(c => c.trim().replace(/["'`\[\]]/g, '').toLowerCase());
    } else if (KNOWN_CASHEW_SCHEMAS[canonicalTable]) {
      columns = KNOWN_CASHEW_SCHEMAS[canonicalTable];
    }

    const tuples = parseSqlInsertTuples(valuesBody);

    tuples.forEach(tuple => {
      const rowObj: Record<string, any> = {};
      if (columns.length > 0) {
        columns.forEach((col, idx) => {
          rowObj[col] = tuple[idx] !== undefined ? tuple[idx] : null;
        });
      } else {
        tuple.forEach((val, idx) => {
          rowObj[`col_${idx}`] = val;
        });
      }

      if (canonicalTable === 'wallet') extractedJson.wallets.push(rowObj);
      else if (canonicalTable === 'category') extractedJson.categories.push(rowObj);
      else if (canonicalTable === 'transaction') extractedJson.transactions.push(rowObj);
      else if (canonicalTable === 'budget') extractedJson.budgets.push(rowObj);
      else if (canonicalTable === 'objective') extractedJson.objectives.push(rowObj);
      else if (canonicalTable === 'debt') extractedJson.debts.push(rowObj);
      else if (canonicalTable === 'recurring_transaction') extractedJson.recurringTransactions.push(rowObj);
    });
  }

  if (extractedJson.transactions.length === 0 && extractedJson.wallets.length === 0) {
    warnings.push('No transactions or wallets found in SQL statements.');
  }

  return parseCashewJson(extractedJson, existingState, options, warnings);
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
    return compileImportStats([], [], [], [], [], [], [], [], new Set(), warnings);
  }

  const rawHeaders = rows[0].map(h => h.toLowerCase().trim());
  
  const getCol = (...names: string[]) => {
    for (const name of names) {
      const idx = rawHeaders.findIndex(h => h === name.toLowerCase() || h.includes(name.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const colDate = getCol('date', 'date_created', 'time', 'timestamp');
  const colAmount = getCol('amount', 'price', 'total');
  const colType = getCol('type', 'transaction type', 'tx_type');
  const colIncome = getCol('income', 'is_income', 'isincome');
  const colCategory = getCol('category name', 'category', 'category_name', 'main category');
  const colSubcategory = getCol('subcategory name', 'subcategory', 'sub_category_name', 'sub category');
  const colWallet = getCol('wallet name', 'wallet', 'account name', 'account', 'wallet_name', 'source');
  const colToWallet = getCol('transfer to account', 'to account', 'to wallet', 'destination', 'to_wallet');
  const colNote = getCol('note', 'notes', 'title', 'description', 'memo');
  const colColor = getCol('color', 'colour', 'category color');
  const colCurrency = getCol('currency', 'curr');
  const colTags = getCol('tags', 'tag', 'labels');
  const colPayer = getCol('payer', 'payee', 'merchant');

  const accountsMap = new Map<string, Account>();
  const categoriesMap = new Map<string, Category>();
  const transactions: Transaction[] = [];
  const currenciesSet = new Set<string>();

  existingState.accounts.forEach(a => accountsMap.set(a.name.toLowerCase(), a));
  existingState.categories.forEach(c => categoriesMap.set(c.name.toLowerCase(), c));

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    const rawDateStr = colDate !== -1 ? row[colDate] : undefined;
    const { date, time, timestamp } = parseCashewDateTime(rawDateStr);

    const rawAmt = colAmount !== -1 ? parseFloat(row[colAmount].replace(/[^0-9.-]/g, '')) || 0 : 0;
    const rawIncome = colIncome !== -1 ? row[colIncome]?.toLowerCase() : '';
    const rawType = colType !== -1 ? row[colType]?.toLowerCase() : '';
    
    const isIncome = rawIncome === 'true' || rawIncome === '1' || rawType === 'income' || (rawAmt > 0 && rawIncome !== 'false' && colIncome !== -1);
    const isTransfer = rawType === 'transfer' || (colToWallet !== -1 && !!row[colToWallet]);
    
    let type: TransactionType = isTransfer ? 'TRANSFER' : isIncome ? 'INCOME' : 'EXPENSE';
    let amount = Math.abs(rawAmt);

    const walletName = colWallet !== -1 && row[colWallet] ? row[colWallet].trim() : 'Cashew Wallet';
    const toWalletName = colToWallet !== -1 && row[colToWallet] ? row[colToWallet].trim() : undefined;

    let account = accountsMap.get(walletName.toLowerCase());
    if (!account && options.createMissingAccounts) {
      account = {
        id: `acc_cashew_${Date.now()}_${accountsMap.size}`,
        name: walletName,
        institution: 'Cashew Import',
        type: walletName.toLowerCase().includes('cash') ? 'CASH' : walletName.toLowerCase().includes('card') ? 'CREDIT_CARD' : 'SAVINGS',
        openingBalance: 0,
        calculatedBalance: 0,
        color: '#10B981',
        icon: mapCashewIcon(undefined, walletName),
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      accountsMap.set(walletName.toLowerCase(), account);
    }

    let toAccount = toWalletName ? accountsMap.get(toWalletName.toLowerCase()) : undefined;
    if (toWalletName && !toAccount && options.createMissingAccounts) {
      toAccount = {
        id: `acc_cashew_${Date.now()}_${accountsMap.size}`,
        name: toWalletName,
        institution: 'Cashew Import',
        type: 'SAVINGS',
        openingBalance: 0,
        calculatedBalance: 0,
        color: '#6366F1',
        icon: 'Landmark',
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      accountsMap.set(toWalletName.toLowerCase(), toAccount);
    }

    const catName = colCategory !== -1 && row[colCategory] ? row[colCategory].trim() : (type === 'INCOME' ? 'Salary & Income' : 'Other Expenses');
    const subCatName = colSubcategory !== -1 && row[colSubcategory] ? row[colSubcategory].trim() : undefined;
    const catColor = colColor !== -1 && row[colColor] ? normalizeCashewColor(row[colColor]) : '#3B82F6';

    let category = categoriesMap.get(catName.toLowerCase());
    if (!category && options.createMissingCategories) {
      category = {
        id: `cat_cashew_${Date.now()}_${categoriesMap.size}`,
        name: catName,
        type: 'BOTH',
        icon: mapCashewIcon(undefined, catName),
        color: catColor,
        subcategories: subCatName ? [subCatName] : [],
        isCustom: true,
        order: 60 + categoriesMap.size,
      };
      categoriesMap.set(catName.toLowerCase(), category);
    } else if (category && subCatName && !category.subcategories.includes(subCatName)) {
      category.subcategories.push(subCatName);
    }

    const txCurrency = colCurrency !== -1 && row[colCurrency] ? row[colCurrency].toUpperCase().trim() : (options.defaultCurrency || 'INR');
    currenciesSet.add(txCurrency);
    let originalCurrency: string | undefined = undefined;
    let originalAmount: number | undefined = undefined;
    let exchangeRate: number | undefined = undefined;

    if (txCurrency !== 'INR') {
      originalCurrency = txCurrency;
      originalAmount = amount;
      exchangeRate = CURRENCY_RATES[txCurrency]?.rateToINR || 1;
      if (options.autoConvertForeignCurrencies) {
        amount = convertCurrency(amount, txCurrency, 'INR');
      }
    }

    const note = colNote !== -1 ? row[colNote] : '';
    const payerMerchant = colPayer !== -1 ? row[colPayer] : undefined;
    const tags = colTags !== -1 && row[colTags] ? row[colTags].split(',').map(s => s.trim()).filter(Boolean) : [];

    transactions.push({
      id: `tx_cashew_csv_${Date.now()}_${r}`,
      amount,
      type,
      date,
      time,
      timestamp,
      categoryId: category?.id,
      categoryName: category?.name || catName,
      subcategory: subCatName,
      merchantName: payerMerchant || (type === 'EXPENSE' ? note.slice(0, 30) : undefined),
      accountId: account?.id || options.defaultAccountId,
      accountName: account?.name,
      toAccountId: toAccount?.id,
      toAccountName: toAccount?.name,
      notes: note,
      tags,
      originalCurrency,
      originalAmount,
      exchangeRate,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  const newAccounts = Array.from(accountsMap.values()).filter(a => !existingState.accounts.some(ea => ea.id === a.id));
  const newCategories = Array.from(categoriesMap.values()).filter(c => !existingState.categories.some(ec => ec.id === c.id));

  return compileImportStats(newAccounts, newCategories, transactions, [], [], [], [], [], currenciesSet, warnings);
}

function compileImportStats(
  accounts: Account[],
  categories: Category[],
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[],
  subscriptions: Subscription[],
  debts: DebtRecord[],
  recurring: RecurringTransaction[],
  currenciesSet: Set<string>,
  warnings: string[]
): CashewImportResult {
  let incomeCount = 0;
  let expenseCount = 0;
  let transferCount = 0;
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
    }

    if (!minDate || t.date < minDate) minDate = t.date;
    if (!maxDate || t.date > maxDate) maxDate = t.date;
  });

  return {
    accounts,
    categories,
    transactions,
    budgets,
    goals,
    subscriptions,
    debts,
    recurring,
    stats: {
      totalTransactions: transactions.length,
      incomeCount,
      expenseCount,
      transferCount,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      accountsCount: accounts.length,
      categoriesCount: categories.length,
      budgetsCount: budgets.length,
      goalsCount: goals.length,
      debtsCount: debts.length,
      recurringCount: recurring.length,
      currenciesDetected: Array.from(currenciesSet),
      dateRange: minDate && maxDate ? { start: minDate, end: maxDate } : null,
    },
    warnings,
  };
}

/**
 * Merges parsed Cashew data into existing state with intelligent deduplication
 */
export function applyCashewImport(
  existingState: LocalStorageState,
  imported: CashewImportResult,
  mode: 'MERGE' | 'REPLACE'
): LocalStorageState {
  if (mode === 'REPLACE') {
    return {
      ...existingState,
      accounts: imported.accounts.length > 0 ? imported.accounts : existingState.accounts,
      categories: imported.categories.length > 0 ? imported.categories : DEFAULT_CATEGORIES,
      transactions: imported.transactions,
      budgets: imported.budgets,
      goals: imported.goals,
      subscriptions: imported.subscriptions,
      debts: imported.debts,
      recurring: imported.recurring,
    };
  }

  // MERGE MODE: Deduplicate transactions by date, amount, and note/merchant
  const existingTxFingerprints = new Set(
    existingState.transactions.map(t => `${t.date}_${t.amount}_${t.type}_${t.notes || ''}_${t.merchantName || ''}`)
  );

  const mergedTransactions = [...existingState.transactions];
  imported.transactions.forEach(t => {
    const fingerprint = `${t.date}_${t.amount}_${t.type}_${t.notes || ''}_${t.merchantName || ''}`;
    if (!existingTxFingerprints.has(fingerprint)) {
      mergedTransactions.push(t);
      existingTxFingerprints.add(fingerprint);
    }
  });

  const existingAccNames = new Set(existingState.accounts.map(a => a.name.toLowerCase()));
  const mergedAccounts = [...existingState.accounts];
  imported.accounts.forEach(a => {
    if (!existingAccNames.has(a.name.toLowerCase())) {
      mergedAccounts.push(a);
      existingAccNames.add(a.name.toLowerCase());
    }
  });

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
export const SAMPLE_CASHEW_EXPORT_CSV = `date,amount,amount unpaid,type,income,category name,subcategory name,color,wallet name,title,currency,tags
2024-08-15T09:30:00.000,350.00,0,expense,false,Food & Dining,Cafe & Coffee,0xFFEF5350,Cash,Starbucks Latte,INR,coffee
2024-08-14T14:15:00.000,2400.00,0,expense,false,Groceries,Supermarket,0xFF66BB6A,HDFC Savings,Nature's Basket Organic,INR,weekly
2024-08-12T19:00:00.000,85000.00,0,income,true,Salary,Monthly Pay,0xFF42A5F5,HDFC Savings,Tech Corp August Salary,INR,salary
2024-08-10T11:45:00.000,1299.00,0,expense,false,Shopping,Apparel,0xFFAB47BC,Credit Card,Zara Weekend Sale,INR,apparel
2024-08-08T08:00:00.000,450.00,0,expense,false,Transportation,Fuel,0xFFFF7043,Cash,Shell Petrol Pump,INR,fuel
2024-08-05T20:30:00.000,899.00,0,expense,false,Entertainment,Movies,0xFF26A69A,Credit Card,PVR IMAX Oppenheimer,INR,movie
2024-08-01T10:00:00.000,15000.00,0,expense,false,Housing,Rent,0xFF5C6BC0,HDFC Savings,August Flat Rent,INR,rent
2024-07-28T16:20:00.000,5000.00,0,transfer,false,Transfer,,0xFF78909C,HDFC Savings,Transfer to Emergency Fund,INR,transfer,Cash
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
INSERT INTO "wallet" VALUES ('w_2', 'ICICI Credit Card', '0xFFE53935', '2024-01-01T00:00:00.000', 1, 'INR', '₹', 2, 'credit_card');
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
INSERT INTO "category" VALUES ('c_1_1', 'Cafe & Bakery', '0xFFFFA726', 'local_cafe', 0, 'c_1');
INSERT INTO "category" VALUES ('c_2', 'Salary & Income', '0xFF43A047', 'attach_money', 1, NULL);
INSERT INTO "category" VALUES ('c_3', 'Utilities & Bills', '0xFF8E24AA', 'receipt', 2, NULL);
INSERT INTO "category" VALUES ('c_4', 'Shopping & Electronics', '0xFF00ACC1', 'shopping_bag', 3, NULL);

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

INSERT INTO "transaction" VALUES ('t_1', 'Monthly Paycheck', 95000.0, 'August 2024 Tech Salary', 'c_2', NULL, 'w_1', NULL, '2024-08-01T10:00:00.000', 1, 1, 0, 'income', 'INR', 1.0);
INSERT INTO "transaction" VALUES ('t_2', 'Third Wave Coffee', 420.0, 'Hazelnut Cold Brew', 'c_1', 'c_1_1', 'w_3', NULL, '2024-08-03T16:30:00.000', 0, 1, 0, 'expense', 'INR', 1.0);
INSERT INTO "transaction" VALUES ('t_3', 'Electricity Bill', 2450.0, 'BESCOM Bangalore Bill', 'c_3', NULL, 'w_1', NULL, '2024-08-05T11:00:00.000', 0, 1, 0, 'expense', 'INR', 1.0);
INSERT INTO "transaction" VALUES ('t_4', 'Sony Wireless Headphones', 14990.0, 'Amazon Prime Day Sale', 'c_4', NULL, 'w_2', NULL, '2024-08-08T18:45:00.000', 0, 1, 0, 'expense', 'INR', 1.0);
INSERT INTO "transaction" VALUES ('t_5', 'Dinner with Family', 3200.0, 'Barbeque Nation', 'c_1', NULL, 'w_1', NULL, '2024-08-12T20:15:00.000', 0, 1, 0, 'expense', 'INR', 1.0);

COMMIT;
`;
