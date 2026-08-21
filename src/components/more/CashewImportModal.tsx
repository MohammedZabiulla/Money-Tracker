import React, { useState, useEffect } from 'react';
import { useMoney } from '../../context/MoneyContext';
import {
  parseCashewDataAsync,
  applyCashewImport,
  CashewImportResult,
  SAMPLE_CASHEW_EXPORT_CSV,
  SAMPLE_CASHEW_EXPORT_SQL,
} from '../../lib/cashewImporter';
import { formatINR, formatForeignCurrency } from '../../lib/currency';
import { Emblem3D } from '../common/IconHelper';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
  X,
  Wallet,
  Tag,
  Target,
  RefreshCw,
  HelpCircle,
  Info,
  Calendar,
  Globe,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface CashewImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashewImportModal: React.FC<CashewImportModalProps> = ({ isOpen, onClose }) => {
  const context = useMoney();
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'sample'>('upload');
  const [rawInput, setRawInput] = useState<string | ArrayBuffer | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [importMode, setImportMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [autoConvertCurrencies, setAutoConvertCurrencies] = useState(true);
  const [createMissingAccounts, setCreateMissingAccounts] = useState(true);
  const [createMissingCategories, setCreateMissingCategories] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<CashewImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importedSummary, setImportedSummary] = useState<CashewImportResult['stats'] | null>(null);

  // Trigger async parsing whenever rawInput or options change
  useEffect(() => {
    let isMounted = true;
    if (!rawInput) {
      setParseResult(null);
      setParseError(null);
      return;
    }

    setIsParsing(true);
    setParseError(null);

    const currentState = {
      accounts: context.accounts,
      creditCards: context.creditCards,
      categories: context.categories,
      merchants: context.merchants,
      paymentApps: context.paymentApps,
      transactions: context.transactions,
      recurring: context.recurring,
      subscriptions: context.subscriptions,
      budgets: context.budgets,
      goals: context.goals,
      loans: context.loans,
      investments: context.investments,
      debts: context.debts,
      reconciliations: context.reconciliations,
      settings: context.settings,
    };

    parseCashewDataAsync(rawInput, currentState, {
      mode: importMode,
      autoConvertForeignCurrencies: autoConvertCurrencies,
      createMissingAccounts,
      createMissingCategories,
      defaultAccountId: context.accounts[0]?.id,
      defaultCurrency: 'INR',
    })
      .then((res) => {
        if (isMounted) {
          setParseResult(res);
          setIsParsing(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error parsing Cashew database:', err);
          setParseError(err instanceof Error ? err.message : 'Failed to parse database file');
          setIsParsing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    rawInput,
    context.accounts,
    context.creditCards,
    context.categories,
    context.merchants,
    context.paymentApps,
    context.transactions,
    context.recurring,
    context.subscriptions,
    context.budgets,
    context.goals,
    context.loans,
    context.investments,
    context.debts,
    context.reconciliations,
    context.settings,
    importMode,
    autoConvertCurrencies,
    createMissingAccounts,
    createMissingCategories,
  ]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setIsSuccess(false);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      setRawInput(buffer);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadCsvSample = () => {
    setFileName('cashew_outbox_sample.csv');
    setRawInput(SAMPLE_CASHEW_EXPORT_CSV);
    setPastedText(SAMPLE_CASHEW_EXPORT_CSV);
    setIsSuccess(false);
  };

  const handleLoadSqlSample = () => {
    setFileName('cashew_googledrive_backup.sql');
    setRawInput(SAMPLE_CASHEW_EXPORT_SQL);
    setPastedText(SAMPLE_CASHEW_EXPORT_SQL);
    setIsSuccess(false);
  };

  const handleExecuteImport = () => {
    if (!parseResult) return;

    const currentState = {
      accounts: context.accounts,
      creditCards: context.creditCards,
      categories: context.categories,
      merchants: context.merchants,
      paymentApps: context.paymentApps,
      transactions: context.transactions,
      recurring: context.recurring,
      subscriptions: context.subscriptions,
      budgets: context.budgets,
      goals: context.goals || [],
      loans: context.loans,
      investments: context.investments,
      debts: context.debts,
      reconciliations: context.reconciliations,
      settings: context.settings,
    };

    const newState = applyCashewImport(currentState, parseResult, importMode);
    context.loadBackupState(newState);

    setImportedSummary(parseResult.stats);
    setIsSuccess(true);
  };

  const handleClear = () => {
    setRawInput(null);
    setPastedText('');
    setFileName('');
    setParseResult(null);
    setParseError(null);
    setIsSuccess(false);
  };

  const filteredPreviewTransactions = (parseResult?.transactions || []).filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.notes || '').toLowerCase().includes(q) ||
      (t.categoryName || '').toLowerCase().includes(q) ||
      (t.merchantName || '').toLowerCase().includes(q) ||
      (t.accountName || '').toLowerCase().includes(q) ||
      t.amount.toString().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header with Cashew signature brand accent */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 dark:from-amber-950/40 dark:via-emerald-950/40 dark:to-teal-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Emblem3D
              icon={Database}
              from="#F59E0B"
              via="#10B981"
              to="#0D9488"
              finish="glossy"
              shape="rounded"
              size="md"
              glow
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Cashew App Importer
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700 uppercase tracking-wider">
                  Open Source
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Import CSV Outbox, Google Drive SQLite SQL dumps, or JSON backups with zero data loss
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isSuccess && importedSummary ? (
            <div className="text-center py-10 px-4 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex justify-center">
                <Emblem3D
                  icon={ShieldCheck}
                  from="#10B981"
                  via="#059669"
                  to="#047857"
                  finish="metallic"
                  shape="shield"
                  size="xl"
                  glow
                />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Cashew Data Successfully Imported!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                  All transactions, wallets, and categories have been securely populated and balances recalculated.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-400">Transactions</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {importedSummary.totalTransactions}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Total Income</div>
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {formatINR(importedSummary.totalIncome)}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400">Total Expense</div>
                  <div className="text-lg font-black text-rose-700 dark:text-rose-300 mt-0.5">
                    {formatINR(importedSummary.totalExpense)}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400">Wallets / Accounts</div>
                  <div className="text-xl font-black text-blue-700 dark:text-blue-300 mt-0.5">
                    {importedSummary.accountsCount}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/30 transition-all"
                >
                  Go to Dashboard & Transactions
                </button>
                <button
                  onClick={() => {
                    handleClear();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-all"
                >
                  Import Another File
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Input Method Selector */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                      activeTab === 'upload'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Upload size={14} />
                    <span>Upload File</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('paste')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                      activeTab === 'paste'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <FileText size={14} />
                    <span>Paste Text / SQL / CSV</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={handleLoadCsvSample}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center space-x-1 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all shadow-xs"
                    title="Load sample Cashew CSV data"
                  >
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Sample CSV</span>
                  </button>
                  <button
                    onClick={handleLoadSqlSample}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all shadow-xs"
                    title="Load sample Cashew Google Drive .sql backup dump"
                  >
                    <Database size={13} className="text-emerald-500" />
                    <span>Sample SQL (.sql)</span>
                  </button>
                  {fileName && (
                    <button
                      onClick={handleClear}
                      className="px-2 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors"
                      title="Clear selection"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Dropzone */}
              {activeTab === 'upload' && (
                <div className="space-y-3">
                  <label
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      fileName
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".sql,.db,.sqlite,.sqlite3,.csv,.json,.txt,*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex justify-center mb-3">
                      <Emblem3D
                        icon={Upload}
                        from="#10B981"
                        via="#059669"
                        to="#047857"
                        finish="glossy"
                        shape="rounded"
                        size="lg"
                        glow
                      />
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white">
                      {fileName ? fileName : 'Choose Cashew Export File (.sql / .csv / .json) or Drag & Drop'}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Supports direct Cashew Google Drive Backups (.sql SQLite binary), Outbox CSV exports, and JSON schemas
                    </div>
                  </label>
                </div>
              )}

              {/* Paste Raw Text */}
              {activeTab === 'paste' && (
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPastedText(val);
                      setRawInput(val);
                      setFileName('Pasted Cashew Data');
                    }}
                    placeholder="Paste Cashew CSV text (e.g. date,amount,category name,wallet name,income...) or SQL text statements..."
                    className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Parsing State */}
              {isParsing && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center space-x-3 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <Loader2 size={18} className="animate-spin text-emerald-600" />
                  <span>Decoding and verifying Cashew database tables...</span>
                </div>
              )}

              {/* Error State */}
              {parseError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start space-x-3 text-rose-800 dark:text-rose-300 text-xs">
                  <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-900 dark:text-rose-200">Unable to parse file</div>
                    <div className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">{parseError}</div>
                  </div>
                </div>
              )}

              {/* Configuration Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Import Mode
                  </label>
                  <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value as 'MERGE' | 'REPLACE')}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="MERGE">Merge & Deduplicate (Recommended)</option>
                    <option value="REPLACE">Clean Slate (Replace all data)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center space-x-2 cursor-pointer mt-3">
                    <input
                      type="checkbox"
                      checked={autoConvertCurrencies}
                      onChange={(e) => setAutoConvertCurrencies(e.target.checked)}
                      className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Convert foreign FX to INR (₹)
                    </span>
                  </label>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center space-x-2 cursor-pointer mt-3">
                    <input
                      type="checkbox"
                      checked={createMissingAccounts}
                      onChange={(e) => setCreateMissingAccounts(e.target.checked)}
                      className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Auto-create missing wallets
                    </span>
                  </label>
                </div>
              </div>

              {/* Live Preview Stats */}
              {parseResult && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span>Data Verification & Preview</span>
                    </h3>
                    {parseResult.stats.dateRange && (
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                        <Calendar size={13} />
                        <span>
                          {parseResult.stats.dateRange.start} to {parseResult.stats.dateRange.end}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Warnings Banner if any */}
                  {parseResult.warnings.length > 0 && (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                      <div className="font-bold flex items-center space-x-1.5 text-amber-900 dark:text-amber-200">
                        <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                        <span>Parser Information</span>
                      </div>
                      {parseResult.warnings.map((w, idx) => (
                        <div key={idx} className="pl-5 text-[11px] text-amber-700 dark:text-amber-400">
                          • {w}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                      <div className="text-[11px] font-bold text-slate-500">Transactions</div>
                      <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                        {parseResult.stats.totalTransactions}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Total Income ({parseResult.stats.incomeCount})
                      </div>
                      <div className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {formatINR(parseResult.stats.totalIncome)}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                      <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                        Total Expense ({parseResult.stats.expenseCount})
                      </div>
                      <div className="text-base font-black text-rose-700 dark:text-rose-300 mt-0.5">
                        {formatINR(parseResult.stats.totalExpense)}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
                      <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                        Wallets & Categories
                      </div>
                      <div className="text-base font-black text-purple-700 dark:text-purple-300 mt-0.5">
                        {parseResult.accounts.length} Wallets • {parseResult.categories.length} Cats
                      </div>
                    </div>
                  </div>

                  {/* Multi Currency Detected Banner */}
                  {parseResult.stats.currenciesDetected.length > 0 && (
                    <div className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
                      <div className="flex items-center space-x-2">
                        <Globe size={15} />
                        <span>
                          <strong>Currencies Detected:</strong> {parseResult.stats.currenciesDetected.join(', ')}
                        </span>
                      </div>
                      <span className="font-bold">
                        {autoConvertCurrencies ? 'FX Auto-converted to INR' : 'Original FX stored'}
                      </span>
                    </div>
                  )}

                  {/* Searchable Transaction Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Previewing {filteredPreviewTransactions.length} of {parseResult.transactions.length} items
                      </span>
                      <input
                        type="text"
                        placeholder="Search preview..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-44"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredPreviewTransactions.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No transactions matching search.
                        </div>
                      ) : (
                        filteredPreviewTransactions.map((tx, idx) => (
                          <div key={tx.id || idx} className="p-3 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                                tx.type === 'INCOME' 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                                  : tx.type === 'TRANSFER'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              }`}>
                                {tx.type === 'INCOME' ? <ArrowDownLeft size={15} /> : tx.type === 'TRANSFER' ? <Repeat size={15} /> : <ArrowUpRight size={15} />}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                  {tx.notes || tx.merchantName || tx.categoryName || 'Transaction'}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                                  <span>{tx.date}</span>
                                  <span>•</span>
                                  <span>{tx.categoryName}</span>
                                  {tx.accountName && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-500 dark:text-slate-400 font-medium">{tx.accountName}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className={`text-xs font-black ${
                                tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                              }`}>
                                {tx.type === 'INCOME' ? '+' : ''}{formatINR(tx.amount)}
                              </div>
                              {tx.originalCurrency && tx.originalCurrency !== 'INR' && (
                                <div className="text-[10px] text-slate-400 font-medium">
                                  ({formatForeignCurrency(tx.originalAmount || 0, tx.originalCurrency)})
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isSuccess && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={!parseResult || parseResult.transactions.length === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all ${
                parseResult && parseResult.transactions.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 size={16} />
              <span>
                {parseResult ? `Import ${parseResult.transactions.length} Records from Cashew` : 'Select File to Import'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
