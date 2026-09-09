import { useScrollLock } from "../../hooks/useScrollLock";
import React, { useState, useEffect, useRef, ChangeEvent, DragEvent } from 'react';
import { useMoney } from '../../context/MoneyContext';
import {
  AppDataExportOptions,
  DEFAULT_EXPORT_OPTIONS,
  ParsedAppImportData,
  AppImportExecutionOptions,
  DEFAULT_IMPORT_OPTIONS,
  exportAppDataToExcel,
  exportAppDataToCsv,
  exportAppDataToJson,
  parseAppImportFile,
  executeAppImport,
  filterTransactionsByOptions,
} from '../../lib/appDataHub';
import { formatINR } from '../../lib/currency';
import { Emblem3D } from '../common/IconHelper';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  Database,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Layers,
  Landmark,
  CreditCard,
  Target,
  Coins,
  TrendingUp,
  Clock,
  History,
  Tag,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  Cloud,
  HardDrive,
} from 'lucide-react';
import {
  requestGoogleDriveToken,
  uploadBackupToGoogleDrive,
  listGoogleDriveBackups,
  downloadGoogleDriveBackup,
} from '../../lib/googleDriveService';

interface AppImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'EXPORT' | 'IMPORT';
}

export const AppImportExportModal: React.FC<AppImportExportModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'EXPORT',
}) => {
  useScrollLock(isOpen);

  const context = useMoney();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'EXPORT' | 'IMPORT'>(initialTab);

  // Export State
  const [exportOptions, setExportOptions] = useState<AppDataExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Google Drive State
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveMessage, setDriveMessage] = useState<string | null>(null);
  const [isDriveRestoreModalOpen, setIsDriveRestoreModalOpen] = useState(false);
  const [driveBackupsList, setDriveBackupsList] = useState<Array<{ id: string; name: string; modifiedTime: string }>>([]);
  const [googleClientIdInput, setGoogleClientIdInput] = useState(localStorage.getItem('money_tracker_google_client_id') || '');
  const [isClientIdModalOpen, setIsClientIdModalOpen] = useState(false);

  const getClientId = () => {
    return localStorage.getItem('money_tracker_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  };

  const handleGoogleDriveBackup = async () => {
    setIsDriveLoading(true);
    setDriveMessage(null);
    try {
      const token = await requestGoogleDriveToken(getClientId());
      const state = {
        accounts: context.accounts,
        creditCards: context.creditCards,
        categories: context.categories,
        merchants: context.merchants,
        paymentApps: context.paymentApps,
        transactions: context.transactions,
        recurring: context.recurring,
        subscriptions: context.subscriptions,
        budgets: context.budgets,
        loans: context.loans,
        investments: context.investments,
        debts: context.debts,
        reconciliations: context.reconciliations,
        goals: context.goals,
        templates: context.templates,
        settings: context.settings,
        activityLogs: context.activityLogs,
      };
      const result = await uploadBackupToGoogleDrive(token, state);
      setDriveMessage(`Successfully backed up to Google Drive (${result.fileName})!`);
      setTimeout(() => setDriveMessage(null), 6000);
    } catch (err: any) {
      if (err?.message === 'GOOGLE_CLIENT_ID_REQUIRED') {
        setIsClientIdModalOpen(true);
      } else {
        setDriveMessage(err?.message || 'Google Drive backup failed.');
      }
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleOpenGoogleDriveRestore = async () => {
    setIsDriveLoading(true);
    setDriveMessage(null);
    try {
      const token = await requestGoogleDriveToken(getClientId());
      const files = await listGoogleDriveBackups(token);
      setDriveBackupsList(files);
      setIsDriveRestoreModalOpen(true);
    } catch (err: any) {
      if (err?.message === 'GOOGLE_CLIENT_ID_REQUIRED') {
        setIsClientIdModalOpen(true);
      } else {
        setDriveMessage(err?.message || 'Failed to list Google Drive backups.');
      }
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleSelectDriveBackupToRestore = async (fileId: string) => {
    setIsDriveLoading(true);
    setDriveMessage(null);
    try {
      const token = await requestGoogleDriveToken(getClientId());
      const rawData = await downloadGoogleDriveBackup(token, fileId);
      const parsed = await parseAppImportFile(new File([JSON.stringify(rawData)], 'gdrive_backup.json', { type: 'application/json' }));
      if (!parsed.isValid) {
        throw new Error('Downloaded Google Drive file is not a valid Money Tracker backup.');
      }
      setParsedData(parsed);
      setIsDriveRestoreModalOpen(false);
      setActiveTab('IMPORT');
    } catch (err: any) {
      setDriveMessage(err?.message || 'Failed to restore Google Drive backup.');
    } finally {
      setIsDriveLoading(false);
    }
  };

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importErrorMessage, setImportErrorMessage] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedAppImportData | null>(null);
  const [importOptions, setImportOptions] = useState<AppImportExecutionOptions>(DEFAULT_IMPORT_OPTIONS);
  const [importSuccessResult, setImportSuccessResult] = useState<{
    txCount: number;
    accountsCount: number;
    mode: string;
  } | null>(null);

  // Search & Filter in Import Preview
  const [importTxSearch, setImportTxSearch] = useState('');
  const [importTxTypeFilter, setImportTxTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER'>('ALL');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setExportSuccessMessage(null);
      setImportErrorMessage(null);
      setImportSuccessResult(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Calculate live export item counts
  const filteredExportTransactions = filterTransactionsByOptions(context.transactions, exportOptions);

  // Handle Export Execution
  const handleExecuteExport = () => {
    try {
      const state = {
        accounts: context.accounts,
        creditCards: context.creditCards,
        categories: context.categories,
        merchants: context.merchants,
        paymentApps: context.paymentApps,
        transactions: context.transactions,
        recurring: context.recurring,
        subscriptions: context.subscriptions,
        budgets: context.budgets,
        loans: context.loans,
        investments: context.investments,
        debts: context.debts,
        reconciliations: context.reconciliations,
        goals: context.goals,
        templates: context.templates,
        settings: context.settings,
        activityLogs: context.activityLogs,
      };

      if (exportOptions.format === 'xlsx') {
        exportAppDataToExcel(state, exportOptions);
      } else if (exportOptions.format === 'csv') {
        exportAppDataToCsv(state, exportOptions);
      } else {
        exportAppDataToJson(state);
      }

      setExportSuccessMessage(`Export generated successfully in ${exportOptions.format.toUpperCase()} format!`);
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (e: any) {
      console.error('Export error:', e);
    }
  };

  // 1-Click Quick Exports
  const handleQuickExport = (format: 'xlsx' | 'csv' | 'json') => {
    const state = {
      accounts: context.accounts,
      creditCards: context.creditCards,
      categories: context.categories,
      merchants: context.merchants,
      paymentApps: context.paymentApps,
      transactions: context.transactions,
      recurring: context.recurring,
      subscriptions: context.subscriptions,
      budgets: context.budgets,
      loans: context.loans,
      investments: context.investments,
      debts: context.debts,
      reconciliations: context.reconciliations,
      goals: context.goals,
      templates: context.templates,
      settings: context.settings,
      activityLogs: context.activityLogs,
    };

    if (format === 'xlsx') {
      exportAppDataToExcel(state, DEFAULT_EXPORT_OPTIONS);
    } else if (format === 'csv') {
      exportAppDataToCsv(state, DEFAULT_EXPORT_OPTIONS);
    } else {
      exportAppDataToJson(state);
    }

    setExportSuccessMessage(`Quick ${format.toUpperCase()} download completed!`);
    setTimeout(() => setExportSuccessMessage(null), 4000);
  };

  // Handle Import File
  const handleProcessImportFile = async (file: File) => {
    setIsLoading(true);
    setImportErrorMessage(null);
    setImportFile(file);
    try {
      const parsed = await parseAppImportFile(file);
      if (!parsed.isValid) {
        throw new Error(parsed.errorMessage || 'Invalid data in file.');
      }
      setParsedData(parsed);
    } catch (err: any) {
      setImportErrorMessage(err?.message || 'Failed to parse file. Ensure it is a valid Excel (.xlsx), CSV (.csv), or JSON (.json) file.');
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessImportFile(files[0]);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessImportFile(files[0]);
    }
  };

  // Execute Import
  const handleExecuteImport = () => {
    if (!parsedData) return;
    setIsLoading(true);
    try {
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
        loans: context.loans,
        investments: context.investments,
        debts: context.debts,
        reconciliations: context.reconciliations,
        goals: context.goals,
        templates: context.templates,
        settings: context.settings,
        activityLogs: context.activityLogs,
      };

      const finalState = executeAppImport(parsedData, importOptions, currentState);
      context.loadBackupState(finalState);

      setImportSuccessResult({
        txCount: parsedData.counts.transactions,
        accountsCount: parsedData.counts.accounts + parsedData.counts.creditCards,
        mode: importOptions.mode,
      });
    } catch (err: any) {
      setImportErrorMessage(err?.message || 'Failed to apply import.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center space-x-3.5">
            <Emblem3D
              icon="FileSpreadsheet"
              from="#3b82f6"
              to="#1d4ed8"
              finish="crystal"
              shape="squircle"
              size="md"
              glow={true}
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  App Import & Export Hub
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                  Excel • CSV • JSON
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1-Click Universal data migration, backups & cross-device transfers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Tab Bar: EXPORT vs IMPORT */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 flex space-x-4 bg-slate-50/40 dark:bg-slate-900/40">
          <button
            onClick={() => {
              setActiveTab('EXPORT');
              setImportSuccessResult(null);
            }}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'EXPORT'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Download size={16} />
            <span>Export from App</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('IMPORT');
              setExportSuccessMessage(null);
            }}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'IMPORT'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload size={16} />
            <span>Import to App</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ============================================================= */}
          {/* TAB 1: EXPORT                                                 */}
          {/* ============================================================= */}
          {activeTab === 'EXPORT' && (
            <div className="space-y-6">
              {/* Instant JSON Full Backup Card */}
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-sm">
                    <Database size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">Instant JSON Full Backup</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Download a 100% lossless snapshot of all accounts, budgets & transactions.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickExport('json')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all shrink-0 cursor-pointer flex items-center space-x-1.5"
                >
                  <Download size={14} />
                  <span>Download Backup</span>
                </button>
              </div>

              {/* Success Toast */}
              {exportSuccessMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-2 shadow-sm animate-in fade-in">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>{exportSuccessMessage}</span>
                </div>
              )}

              {/* 1-Click Quick Exports */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    1-Click Instant Exports
                  </h4>
                  <span className="text-[11px] text-slate-400">Standard presets</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Excel Quick */}
                  <button
                    onClick={() => handleQuickExport('xlsx')}
                    className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 dark:border-emerald-500/40 hover:border-emerald-500 text-left transition-all group shadow-xs hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-xl bg-emerald-600 text-white group-hover:scale-105 transition-transform">
                          <FileSpreadsheet size={18} />
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold">
                          .XLSX
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">Excel Full Workbook</h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Multi-sheet workbook with transactions, accounts, budgets & investments.
                      </p>
                    </div>
                    <div className="mt-3 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <span>Download Excel</span>
                      <ArrowRight size={12} />
                    </div>
                  </button>

                  {/* CSV Quick */}
                  <button
                    onClick={() => handleQuickExport('csv')}
                    className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30 dark:border-blue-500/40 hover:border-blue-500 text-left transition-all group shadow-xs hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-xl bg-blue-600 text-white group-hover:scale-105 transition-transform">
                          <FileText size={18} />
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-extrabold">
                          .CSV
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">Transactions CSV</h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Standard comma-separated format compatible with Sheets, Calc & finance tools.
                      </p>
                    </div>
                    <div className="mt-3 text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1">
                      <span>Download CSV</span>
                      <ArrowRight size={12} />
                    </div>
                  </button>

                  {/* JSON Quick */}
                  <button
                    onClick={() => handleQuickExport('json')}
                    className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 dark:border-purple-500/40 hover:border-purple-500 text-left transition-all group shadow-xs hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-xl bg-purple-600 text-white group-hover:scale-105 transition-transform">
                          <Database size={18} />
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-extrabold">
                          .JSON
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">Full State Backup</h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Lossless 100% snapshot of your app state for backups and device restores.
                      </p>
                    </div>
                    <div className="mt-3 text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center space-x-1">
                      <span>Download JSON</span>
                      <ArrowRight size={12} />
                    </div>
                  </button>
                </div>
              </div>

              {/* Custom Export Builder */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sliders size={16} className="text-blue-500" />
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Custom Export Builder
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {filteredExportTransactions.length} Transactions Selected
                  </span>
                </div>

                {/* Format Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">File Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['xlsx', 'csv', 'json'] as const).map(fmt => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setExportOptions({ ...exportOptions, format: fmt })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                          exportOptions.format === fmt
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-400'
                        }`}
                      >
                        <span>{fmt === 'xlsx' ? 'Excel (.xlsx)' : fmt === 'csv' ? 'CSV (.csv)' : 'JSON (.json)'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Date Range */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Date Range</label>
                    <select
                      value={exportOptions.dateRange}
                      onChange={e => setExportOptions({ ...exportOptions, dateRange: e.target.value as any })}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">All Time History</option>
                      <option value="THIS_MONTH">This Month</option>
                      <option value="LAST_MONTH">Last Month</option>
                      <option value="THIS_QUARTER">This Quarter</option>
                      <option value="THIS_YEAR">This Year</option>
                      <option value="CUSTOM">Custom Date Range</option>
                    </select>
                  </div>

                  {/* Transaction Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Transaction Type</label>
                    <select
                      value={exportOptions.typeFilter}
                      onChange={e => setExportOptions({ ...exportOptions, typeFilter: e.target.value as any })}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">All Types (Expenses, Income & Transfers)</option>
                      <option value="EXPENSE">Expenses Only</option>
                      <option value="INCOME">Income Only</option>
                      <option value="TRANSFER">Transfers & Card Payments</option>
                    </select>
                  </div>
                </div>

                {/* Custom Dates if selected */}
                {exportOptions.dateRange === 'CUSTOM' && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] text-slate-500">From Date</label>
                      <input
                        type="date"
                        value={exportOptions.startDate || ''}
                        onChange={e => setExportOptions({ ...exportOptions, startDate: e.target.value })}
                        className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500">To Date</label>
                      <input
                        type="date"
                        value={exportOptions.endDate || ''}
                        onChange={e => setExportOptions({ ...exportOptions, endDate: e.target.value })}
                        className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Entities Checkboxes */}
                {exportOptions.format !== 'csv' && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Included Sheets / Datasets</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { key: 'includeTransactions', label: `Transactions (${context.transactions.length})` },
                        { key: 'includeAccounts', label: `Accounts (${context.accounts.length})` },
                        { key: 'includeCreditCards', label: `Credit Cards (${context.creditCards.length})` },
                        { key: 'includeCategories', label: `Categories (${context.categories.length})` },
                        { key: 'includeBudgets', label: `Budgets (${context.budgets.length})` },
                        { key: 'includeInvestments', label: `Investments (${context.investments.length})` },
                        { key: 'includeLoans', label: `Loans (${context.loans.length})` },
                        { key: 'includeDebts', label: `Debts (${context.debts.length})` },
                      ].map(item => (
                        <label key={item.key} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(exportOptions as any)[item.key]}
                            onChange={e =>
                              setExportOptions({ ...exportOptions, [item.key]: e.target.checked })
                            }
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-slate-700 dark:text-slate-300 truncate">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-2">
                  <button
                    onClick={handleExecuteExport}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
                  >
                    <Download size={15} />
                    <span>Download Custom Export ({exportOptions.format.toUpperCase()})</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 2: IMPORT                                                 */}
          {/* ============================================================= */}
          {activeTab === 'IMPORT' && (
            <div className="space-y-6">
              {/* Error Banner */}
              {importErrorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-2.5">
                    <AlertCircle size={16} className="text-rose-500 shrink-0" />
                    <span>{importErrorMessage}</span>
                  </div>
                  <button onClick={() => setImportErrorMessage(null)}>
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Success Result */}
              {importSuccessResult ? (
                <div className="text-center py-8 space-y-5 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 size={36} />
                  </div>

                  <div>
                    <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      Data Successfully Imported!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Your financial dataset has been merged into the application and all balances recalculated.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 grid grid-cols-2 gap-3 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Transactions</span>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white">
                        {importSuccessResult.txCount}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Accounts</span>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white">
                        {importSuccessResult.accountsCount}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setParsedData(null);
                        setImportFile(null);
                        setImportSuccessResult(null);
                      }}
                      className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
                    >
                      Import Another File
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all"
                    >
                      Done & Close
                    </button>
                  </div>
                </div>
              ) : !parsedData ? (
                /* Step 1: Upload Dropzone */
                <div className="space-y-4">
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 scale-[0.99]'
                        : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/40 dark:bg-slate-800/30'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,.json"
                      onChange={onFileInputChange}
                      className="hidden"
                    />

                    <div className="max-w-md mx-auto space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-inner">
                        <Upload size={28} className="animate-bounce" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          Select or Drop your Excel, CSV or JSON file
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Supports Excel workbooks (<code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px]">.xlsx</code>, <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px]">.xls</code>), Transactions CSV (<code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px]">.csv</code>), or Full App JSON backup (<code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px]">.json</code>).
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          disabled={isLoading}
                          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all inline-flex items-center space-x-2"
                        >
                          <span>Browse Local Files</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Step 2: Parsed File Preview & Configure */
                <div className="space-y-6">
                  {/* File Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
                        {parsedData.fileType === 'EXCEL' ? (
                          <FileSpreadsheet size={20} />
                        ) : parsedData.fileType === 'CSV' ? (
                          <FileText size={20} />
                        ) : (
                          <Database size={20} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            {parsedData.fileType} Document Parsed
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                            Valid Format
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{parsedData.fileName}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setParsedData(null);
                        setImportFile(null);
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      Change File
                    </button>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Transactions
                      </span>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {parsedData.counts.transactions}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Accounts & Cards
                      </span>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {parsedData.counts.accounts + parsedData.counts.creditCards}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Categories
                      </span>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {parsedData.counts.categories}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Budgets & Others
                      </span>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {parsedData.counts.budgets + parsedData.counts.investments + parsedData.counts.goals}
                      </div>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Import Strategy
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setImportOptions({ ...importOptions, mode: 'MERGE' })}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          importOptions.mode === 'MERGE'
                            ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            Merge & Append
                          </h5>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                            Safe
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                          Retains all your existing accounts, cards and transactions, adding only new records from the file.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportOptions({ ...importOptions, mode: 'REPLACE' })}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          importOptions.mode === 'REPLACE'
                            ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            Clean Replace / Restore
                          </h5>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                          Clears current records and sets state strictly from this import file (ideal for complete backup restores).
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Options Checkboxes */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h6 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Import Controls
                    </h6>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={importOptions.skipDuplicates}
                          onChange={e => setImportOptions({ ...importOptions, skipDuplicates: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Skip duplicate transactions
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={importOptions.autoCalculateBalances}
                          onChange={e =>
                            setImportOptions({ ...importOptions, autoCalculateBalances: e.target.checked })
                          }
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Recalculate account balances
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Action Confirmation Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleExecuteImport}
                      disabled={isLoading}
                      className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 size={16} />
                      <span>
                        Confirm & Import {parsedData.counts.transactions} Records ({importOptions.mode === 'MERGE' ? 'Merge' : 'Clean Replace'})
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Google Drive Backups Modal */}
      {isDriveRestoreModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                  <Cloud size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Google Drive Backups
                  </h3>
                  <p className="text-xs text-slate-500">Select a backup file to restore</p>
                </div>
              </div>
              <button
                onClick={() => setIsDriveRestoreModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2.5">
              {driveBackupsList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No backup files found in your Google Drive.
                </div>
              ) : (
                driveBackupsList.map(file => (
                  <div
                    key={file.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between hover:border-blue-500 transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{file.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Modified: {new Date(file.modifiedTime).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isDriveLoading}
                      onClick={() => handleSelectDriveBackupToRestore(file.id)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      {isDriveLoading ? 'Restoring...' : 'Restore'}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDriveRestoreModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Google Client ID Configuration Modal */}
      {isClientIdModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                  <Cloud size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Google OAuth Client ID
                  </h3>
                  <p className="text-xs text-slate-500">Required for Google Drive Cloud access</p>
                </div>
              </div>
              <button
                onClick={() => setIsClientIdModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                To backup and restore directly with Google Drive, please enter your Google Cloud OAuth 2.0 Client ID (or the app's project client ID). This is stored securely in your browser's local storage.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Client ID (.apps.googleusercontent.com)
                </label>
                <input
                  type="text"
                  value={googleClientIdInput}
                  onChange={(e) => setGoogleClientIdInput(e.target.value)}
                  placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClientIdModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (googleClientIdInput.trim()) {
                    localStorage.setItem('money_tracker_google_client_id', googleClientIdInput.trim());
                    setIsClientIdModalOpen(false);
                    setDriveMessage('Google Client ID saved successfully! You can now use Google Drive backup/restore.');
                    setTimeout(() => setDriveMessage(null), 5000);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
