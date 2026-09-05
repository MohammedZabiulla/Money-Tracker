import { useScrollLock } from "../../hooks/useScrollLock";
import React, { useState, useRef, ChangeEvent, DragEvent, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import {
  parseCashewFile,
  executeCashewImport,
  CashewImportPreview,
  CashewImportOptions,
  CashewWalletPreview,
  CashewTransactionPreviewItem,
  CashewCategoryPreview,
} from '../../lib/cashewImporter';
import { formatINR } from '../../lib/currency';
import { Emblem3D } from '../common/IconHelper';
import {
  AccountType,
  CardNetwork,
  CardTheme,
  TransactionType,
} from '../../types';
import { CARD_THEMES } from '../../lib/constants';
import {
  X,
  Upload,
  FileSpreadsheet,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Landmark,
  CreditCard,
  Target,
  Coins,
  Repeat,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Tag,
  Search,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  Filter,
  Check,
  RefreshCw,
  Plus,
  Sliders,
  DollarSign,
  Calendar,
  Layers3,
} from 'lucide-react';

interface CashewImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashewImportModal: React.FC<CashewImportModalProps> = ({ isOpen, onClose }) => {
  useScrollLock(isOpen);

  const context = useMoney();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [step, setStep] = useState<'UPLOAD' | 'PREVIEW' | 'SUCCESS'>('UPLOAD');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<CashewImportPreview | null>(null);

  // UI Tabs inside preview
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'ACCOUNTS' | 'CATEGORIES' | 'TRANSACTIONS'>('SUMMARY');

  // Transactions Search & Filters
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER'>('ALL');
  const [txWalletFilter, setTxWalletFilter] = useState<string>('ALL');
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('ALL');
  const [txSelectionFilter, setTxSelectionFilter] = useState<'ALL' | 'SELECTED' | 'EXCLUDED'>('ALL');

  // Help Accordion
  const [showHowToExport, setShowHowToExport] = useState(false);

  // Editing Modals / Drawers
  const [editingWallet, setEditingWallet] = useState<CashewWalletPreview | null>(null);
  const [editingTx, setEditingTx] = useState<CashewTransactionPreviewItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<CashewCategoryPreview | null>(null);

  // Batch Transaction Action Modal
  const [batchActionModal, setBatchActionModal] = useState<'ACCOUNT' | 'CATEGORY' | null>(null);
  const [batchTargetAccount, setBatchTargetAccount] = useState<string>('');
  const [batchTargetCategory, setBatchTargetCategory] = useState<string>('');

  // Import Execution Options
  const [options, setOptions] = useState<CashewImportOptions>({
    mode: 'MERGE',
    includeWallets: true,
    includeCategories: true,
    includeTransactions: true,
    includeBudgets: true,
    includeGoals: true,
    skipDuplicateTransactions: true,
    autoPairTransfers: true,
    autoSetOpeningBalances: true,
  });

  const [importResultSummary, setImportResultSummary] = useState<{
    txCount: number;
    accountsCount: number;
    categoriesCount: number;
    mode: 'MERGE' | 'REPLACE';
  } | null>(null);

  // Filtered Transactions for Tab
  const filteredTransactions = useMemo(() => {
    if (!previewData) return [];
    return previewData.allTransactions.filter(tx => {
      // Type filter
      if (txTypeFilter !== 'ALL' && tx.type !== txTypeFilter) return false;

      // Wallet filter
      if (txWalletFilter !== 'ALL' && tx.accountName !== txWalletFilter) return false;

      // Category filter
      if (txCategoryFilter !== 'ALL' && tx.categoryName !== txCategoryFilter) return false;

      // Selection filter
      if (txSelectionFilter === 'SELECTED' && tx.isSelected === false) return false;
      if (txSelectionFilter === 'EXCLUDED' && tx.isSelected !== false) return false;

      // Search Query
      if (txSearchQuery) {
        const query = txSearchQuery.toLowerCase();
        const matchTitle = (tx.title || '').toLowerCase().includes(query);
        const matchCategory = (tx.categoryName || '').toLowerCase().includes(query);
        const matchAccount = (tx.accountName || '').toLowerCase().includes(query);
        const matchNotes = (tx.notes || '').toLowerCase().includes(query);
        const matchAmount = tx.amount.toString().includes(query);
        if (!matchTitle && !matchCategory && !matchAccount && !matchNotes && !matchAmount) {
          return false;
        }
      }

      return true;
    });
  }, [
    previewData,
    txTypeFilter,
    txWalletFilter,
    txCategoryFilter,
    txSelectionFilter,
    txSearchQuery,
  ]);

  // Live Summary Calculation based on selected transactions and wallets
  const liveSummary = useMemo(() => {
    if (!previewData) return { totalSelectedTx: 0, selectedExpense: 0, selectedIncome: 0, selectedWallets: 0, selectedCategories: 0 };
    const selectedTx = previewData.allTransactions.filter(t => t.isSelected !== false);
    const selectedExpense = selectedTx
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    const selectedIncome = selectedTx
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const selectedWallets = previewData.wallets.filter(w => w.isSelected).length;
    const selectedCategories = previewData.categories.filter(c => c.isSelected !== false).length;

    return {
      totalSelectedTx: selectedTx.length,
      selectedExpense,
      selectedIncome,
      selectedWallets,
      selectedCategories,
    };
  }, [previewData]);

  // Early return if modal is closed
  if (!isOpen) return null;

  // File handling
  const handleFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const parsed = await parseCashewFile(file, file.name);
      if (!parsed.summary.transactionsCount && !parsed.summary.walletsCount && !parsed.summary.categoriesCount) {
        throw new Error('No valid financial records or wallets found in this file. Please verify it is an export from Cashew or a supported CSV/JSON file.');
      }
      
      // Initialize isSelected = true on all transactions
      parsed.allTransactions = parsed.allTransactions.map(tx => ({
        ...tx,
        isSelected: true,
      }));

      // Initialize isSelected = true on all categories
      parsed.categories = parsed.categories.map(c => ({
        ...c,
        isSelected: true,
      }));

      setPreviewData(parsed);
      setStep('PREVIEW');
    } catch (err: any) {
      console.error('Import parse error:', err);
      setErrorMessage(err?.message || 'Failed to parse the file. Ensure it is a valid SQLite (.sql/.db/.sqlite), CSV, or JSON export.');
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
      handleFile(files[0]);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  // Demo sample loader for testing
  const loadDemoCashewData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const demoCsv = `account,amount,currency,title,note,date,income,type,category name,subcategory name,color,icon,emoji,budget,objective
HDFC Bank,125000,INR,Monthly Salary,Tech Corp,2025-01-01,true,income,Monthly Salary,Base Salary,#10B981,salary,,Monthly Living,Emergency Fund
HDFC Bank,3450,INR,Supermarket Groceries,Weekly restock,2025-01-02,false,expense,Groceries & Daily Needs,Supermarket,#10B981,groceries,,Monthly Living,
ICICI Credit Card,2499,INR,Swiggy Gourmet,Dinner with friends,2025-01-03,false,expense,Food & Dining,Swiggy & Zomato,#EF4444,food,,Monthly Living,
HDFC Bank,45000,INR,House Rent,Apartment lease,2025-01-05,false,expense,Home & Rent,House Rent,#8B5CF6,home,,Monthly Living,
ICICI Credit Card,1499,INR,Uber Commute,Airport cab,2025-01-06,false,expense,Commute & Travel,Uber/Ola/Rapido,#F59E0B,transport,,Monthly Living,
Cash Wallet,500,INR,Street Chai & Snacks,Evening tea,2025-01-07,false,expense,Food & Dining,Street Food & Snacks,#EF4444,food,,Monthly Living,
HDFC Bank,15000,INR,SIP Investment,Nifty 50 Index,2025-01-10,false,expense,Investments & Savings,SIP / Mutual Funds,#10B981,investment,,,New Car Goal
HDFC Bank,10000,INR,Transfer to Cash Wallet,ATM Cash withdrawal,2025-01-11,false,expense,Transfer,,#3B82F6,wallet,,,
Cash Wallet,10000,INR,ATM Cash Inflow,Cash withdrawal,2025-01-11,true,income,Transfer,,#3B82F6,wallet,,,
ICICI Credit Card,8999,INR,Zara Fashion,Winter clothes,2025-01-12,false,expense,Shopping & Apparel,Clothing & Fashion,#EC4899,shopping,,Monthly Living,
HDFC Bank,3200,INR,Electricity Bill,Tata Power,2025-01-15,false,expense,Bills & Utilities,Electricity Bill,#3B82F6,bills,,Monthly Living,
HDFC Bank,25000,INR,Freelance UI Design,Client project,2025-01-18,true,income,Freelance & Business,Client Invoices,#3B82F6,work,,,New Car Goal`;

      const parsed = await parseCashewFile(demoCsv, 'cashew_sample_export.csv');
      parsed.allTransactions = parsed.allTransactions.map(tx => ({
        ...tx,
        isSelected: true,
      }));
      parsed.categories = parsed.categories.map(c => ({
        ...c,
        isSelected: true,
      }));

      setPreviewData(parsed);
      setStep('PREVIEW');
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // WALLET MODIFIERS & HANDLERS
  // =========================================================================
  const toggleWalletSelection = (walletId: string) => {
    if (!previewData) return;
    const updated = previewData.wallets.map(w => {
      if (w.id === walletId) {
        return { ...w, isSelected: !w.isSelected };
      }
      return w;
    });
    setPreviewData({ ...previewData, wallets: updated });
  };

  const selectAllWallets = (select: boolean) => {
    if (!previewData) return;
    const updated = previewData.wallets.map(w => ({ ...w, isSelected: select }));
    setPreviewData({ ...previewData, wallets: updated });
  };

  const saveEditedWallet = (updatedWallet: CashewWalletPreview) => {
    if (!previewData) return;
    const updatedWallets = previewData.wallets.map(w =>
      w.id === updatedWallet.id ? updatedWallet : w
    );

    // If wallet name changed, update corresponding transactions
    let updatedTx = previewData.allTransactions;
    if (editingWallet && editingWallet.name !== updatedWallet.name) {
      updatedTx = updatedTx.map(t => ({
        ...t,
        accountName: t.accountName === editingWallet.name ? updatedWallet.name : t.accountName,
        toAccountName: t.toAccountName === editingWallet.name ? updatedWallet.name : t.toAccountName,
      }));
    }

    setPreviewData({
      ...previewData,
      wallets: updatedWallets,
      allTransactions: updatedTx,
    });
    setEditingWallet(null);
  };

  // =========================================================================
  // TRANSACTION MODIFIERS & HANDLERS
  // =========================================================================
  const toggleTxSelection = (txId: string) => {
    if (!previewData) return;
    const updated = previewData.allTransactions.map(tx => {
      if (tx.id === txId) {
        return { ...tx, isSelected: tx.isSelected === false ? true : false };
      }
      return tx;
    });
    setPreviewData({ ...previewData, allTransactions: updated });
  };

  const selectAllTransactions = (select: boolean) => {
    if (!previewData) return;
    const updated = previewData.allTransactions.map(tx => ({ ...tx, isSelected: select }));
    setPreviewData({ ...previewData, allTransactions: updated });
  };

  const selectFilteredTransactions = (select: boolean) => {
    if (!previewData) return;
    const filteredIds = new Set(filteredTransactions.map(t => t.id));
    const updated = previewData.allTransactions.map(tx => {
      if (filteredIds.has(tx.id)) {
        return { ...tx, isSelected: select };
      }
      return tx;
    });
    setPreviewData({ ...previewData, allTransactions: updated });
  };

  const saveEditedTx = (updatedTx: CashewTransactionPreviewItem) => {
    if (!previewData) return;
    const updatedList = previewData.allTransactions.map(t =>
      t.id === updatedTx.id ? updatedTx : t
    );
    setPreviewData({ ...previewData, allTransactions: updatedList });
    setEditingTx(null);
  };

  const deleteTxFromPreview = (txId: string) => {
    if (!previewData) return;
    const updatedList = previewData.allTransactions.filter(t => t.id !== txId);
    setPreviewData({ ...previewData, allTransactions: updatedList });
  };

  // Batch Assign Actions
  const applyBatchAccountAssign = () => {
    if (!previewData || !batchTargetAccount) return;
    const updatedList = previewData.allTransactions.map(t => {
      if (t.isSelected !== false) {
        return { ...t, accountName: batchTargetAccount };
      }
      return t;
    });
    setPreviewData({ ...previewData, allTransactions: updatedList });
    setBatchActionModal(null);
    setBatchTargetAccount('');
  };

  const applyBatchCategoryAssign = () => {
    if (!previewData || !batchTargetCategory) return;
    const updatedList = previewData.allTransactions.map(t => {
      if (t.isSelected !== false) {
        return { ...t, categoryName: batchTargetCategory };
      }
      return t;
    });
    setPreviewData({ ...previewData, allTransactions: updatedList });
    setBatchActionModal(null);
    setBatchTargetCategory('');
  };

  // =========================================================================
  // CATEGORY MODIFIERS & HANDLERS
  // =========================================================================
  const toggleCategorySelection = (catId: string) => {
    if (!previewData) return;
    const updated = previewData.categories.map(c => {
      if (c.id === catId) {
        return { ...c, isSelected: c.isSelected === false ? true : false };
      }
      return c;
    });
    setPreviewData({ ...previewData, categories: updated });
  };

  const selectAllCategories = (select: boolean) => {
    if (!previewData) return;
    const updated = previewData.categories.map(c => ({ ...c, isSelected: select }));
    setPreviewData({ ...previewData, categories: updated });
  };

  const saveEditedCategory = (updatedCategory: CashewCategoryPreview) => {
    if (!previewData) return;
    const updatedCats = previewData.categories.map(c =>
      c.id === updatedCategory.id ? updatedCategory : c
    );

    // If category name changed, update corresponding transactions
    let updatedTx = previewData.allTransactions;
    if (editingCategory && editingCategory.name !== updatedCategory.name) {
      updatedTx = updatedTx.map(t => ({
        ...t,
        categoryName: t.categoryName === editingCategory.name ? updatedCategory.name : t.categoryName,
      }));
    }

    setPreviewData({
      ...previewData,
      categories: updatedCats,
      allTransactions: updatedTx,
    });
    setEditingCategory(null);
  };

  // Execute Import
  const handleExecuteImport = () => {
    if (!previewData) return;
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

      const updatedState = executeCashewImport(previewData, options, currentState);
      context.loadBackupState(updatedState);

      setImportResultSummary({
        txCount: liveSummary.totalSelectedTx,
        accountsCount: liveSummary.selectedWallets,
        categoriesCount: liveSummary.selectedCategories,
        mode: options.mode,
      });

      setStep('SUCCESS');
    } catch (err: any) {
      console.error('Import execution error:', err);
      setErrorMessage(err?.message || 'Failed to complete the import.');
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
              icon="Database"
              from="#10b981"
              to="#059669"
              finish="crystal"
              shape="squircle"
              size="md"
              glow={true}
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Cashew Smart Importer & Editor
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                  Interactive Post-Parsing Controls
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modify, edit, exclude or map accounts, cards, wallets & transactions before importing
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-2.5">
                <AlertCircle size={16} className="text-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: UPLOAD                                                            */}
          {/* ========================================================================= */}
          {step === 'UPLOAD' && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 scale-[0.99]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".sqlite,.db,.sql,.csv,.json"
                  onChange={onFileInputChange}
                  className="hidden"
                />

                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                    <Upload size={28} className="animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Drop your Cashew Export File here
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Supports full SQLite database backup (<code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px]">.sqlite</code> / <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px]">.db</code>), SQL text dumps (<code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px]">.sql</code>), CSV exports (<code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px]">.csv</code>) and JSON backups (<code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px]">.json</code>).
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={isLoading}
                      className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center space-x-2"
                    >
                      <span>Choose File from Device</span>
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        loadDemoCashewData();
                      }}
                      className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all inline-flex items-center space-x-1.5"
                    >
                      <Sparkles size={14} className="text-amber-500" />
                      <span>Test with Sample Data</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions Accordion */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
                <button
                  type="button"
                  onClick={() => setShowHowToExport(!showHowToExport)}
                  className="w-full px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <HelpCircle size={15} className="text-emerald-500" />
                    <span>How to export your data from the Cashew App?</span>
                  </div>
                  {showHowToExport ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showHowToExport && (
                  <div className="px-5 pb-4 text-xs text-slate-600 dark:text-slate-400 space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Option 1: Complete SQLite Database Backup (Best & Most Accurate)
                    </p>
                    <ol className="list-decimal list-inside pl-1 space-y-1">
                      <li>Open Cashew &gt; Settings &gt; Data Backup &gt; Export Backup.</li>
                      <li>Save the generated file (e.g. <code className="text-emerald-600 dark:text-emerald-400">cashew_backup.sql</code> or <code className="text-emerald-600 dark:text-emerald-400">.sqlite</code>).</li>
                      <li>Drop that file directly into this importer!</li>
                    </ol>

                    <p className="font-semibold text-slate-800 dark:text-slate-200 pt-2">
                      Option 2: CSV Spreadsheet Export
                    </p>
                    <ol className="list-decimal list-inside pl-1 space-y-1">
                      <li>Open Cashew &gt; Settings &gt; Export &gt; Export to CSV.</li>
                      <li>Select All Wallets and date range, then drop the CSV here.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: PREVIEW & INTERACTIVE EDITING                                     */}
          {/* ========================================================================= */}
          {step === 'PREVIEW' && previewData && (
            <div className="space-y-6">
              {/* Top Source Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md">
                    <Database size={20} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        {previewData.sourceType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                        Parsed Successfully
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{previewData.sourceFileName}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStep('UPLOAD');
                    setPreviewData(null);
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  Upload Another File
                </button>
              </div>

              {/* Sub-Tabs: Summary, Accounts/Wallets, Categories, Transactions */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-6 overflow-x-auto pb-0.5">
                {[
                  { id: 'SUMMARY', label: 'Summary & Settings', icon: Layers },
                  {
                    id: 'ACCOUNTS',
                    label: `Accounts & Wallets (${previewData.wallets.length})`,
                    icon: Landmark,
                    badge: `${liveSummary.selectedWallets} Active`,
                  },
                  {
                    id: 'CATEGORIES',
                    label: `Categories (${previewData.categories.length})`,
                    icon: Tag,
                    badge: `${liveSummary.selectedCategories} Active`,
                  },
                  {
                    id: 'TRANSACTIONS',
                    label: `Transactions (${previewData.allTransactions.length})`,
                    icon: FileSpreadsheet,
                    badge: `${liveSummary.totalSelectedTx} Selected`,
                  },
                ].map(t => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`pb-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 whitespace-nowrap transition-all ${
                        isActive
                          ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                          : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{t.label}</span>
                      {t.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {t.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* TAB 1: SUMMARY & IMPORT STRATEGY                                  */}
              {/* ----------------------------------------------------------------- */}
              {activeTab === 'SUMMARY' && (
                <div className="space-y-6">
                  {/* Live Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Selected Transactions
                      </span>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {liveSummary.totalSelectedTx} / {previewData.allTransactions.length}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Active Accounts / Cards
                      </span>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {liveSummary.selectedWallets} / {previewData.wallets.length}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Selected Expenses
                      </span>
                      <div className="text-base font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                        {formatINR(liveSummary.selectedExpense)}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Selected Income
                      </span>
                      <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatINR(liveSummary.selectedIncome)}
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
                        onClick={() => setOptions({ ...options, mode: 'MERGE' })}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          options.mode === 'MERGE'
                            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            Merge with Existing App State
                          </h5>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                            Recommended
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                          Keeps all your current accounts, cards, transactions, and categories in the app and safely merges newly detected records.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOptions({ ...options, mode: 'REPLACE' })}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          options.mode === 'REPLACE'
                            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            Clean Replace
                          </h5>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                          Wipes current records and initializes fresh app state exclusively from this Cashew backup.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Checkbox Controls */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h6 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Import Controls
                    </h6>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={options.skipDuplicateTransactions}
                          onChange={e =>
                            setOptions({ ...options, skipDuplicateTransactions: e.target.checked })
                          }
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Skip duplicate transactions
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={options.autoSetOpeningBalances}
                          onChange={e =>
                            setOptions({ ...options, autoSetOpeningBalances: e.target.checked })
                          }
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Auto-calculate opening balances from history
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={options.autoPairTransfers}
                          onChange={e =>
                            setOptions({ ...options, autoPairTransfers: e.target.checked })
                          }
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Auto-pair internal transfer transactions
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* TAB 2: ACCOUNTS & WALLETS (MODIFIABLE & SELECTABLE)               */}
              {/* ----------------------------------------------------------------- */}
              {activeTab === 'ACCOUNTS' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        Parsed Wallets & Accounts
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Choose which wallets to import, modify account types, limits, or map to existing app accounts.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => selectAllWallets(true)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => selectAllWallets(false)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewData.wallets.map((w, idx) => (
                      <div
                        key={`import_w_${w.id}_${idx}`}
                        className={`p-4 rounded-2xl border transition-all ${
                          w.isSelected
                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 shadow-xs'
                            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => toggleWalletSelection(w.id)}
                              className="text-emerald-600 dark:text-emerald-400"
                            >
                              {w.isSelected ? (
                                <CheckSquare size={20} className="fill-emerald-600 text-white dark:fill-emerald-400 dark:text-slate-900" />
                              ) : (
                                <Square size={20} className="text-slate-400" />
                              )}
                            </button>

                            <div>
                              <div className="flex items-center space-x-2">
                                <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                  {w.name}
                                </h5>
                                {w.isCreditCard ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                                    Credit Card
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                                    {w.accountType || 'Bank Account'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {w.transactionCount} transactions detected
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setEditingWallet(w)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center space-x-1 text-xs font-bold"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                        </div>

                        {/* Mapping notice if mapped */}
                        {w.mappedAccountId && (
                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                            <Check size={12} />
                            <span>
                              Mapped to existing: &quot;
                              {context.accounts.find(a => a.id === w.mappedAccountId)?.name ||
                                context.creditCards.find(c => c.id === w.mappedAccountId)?.name ||
                                'Existing Account'}
                              &quot;
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* TAB 3: CATEGORIES (MODIFIABLE & SELECTABLE)                       */}
              {/* ----------------------------------------------------------------- */}
              {activeTab === 'CATEGORIES' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        Parsed Categories
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Select categories to import or map them to existing categories in your app.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => selectAllCategories(true)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => selectAllCategories(false)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {previewData.categories.map((c, idx) => (
                      <div
                        key={`import_c_${c.id}_${idx}`}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          c.isSelected !== false
                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 shadow-xs'
                            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5">
                            <button
                              type="button"
                              onClick={() => toggleCategorySelection(c.id)}
                              className="text-emerald-600 dark:text-emerald-400"
                            >
                              {c.isSelected !== false ? (
                                <CheckSquare size={18} className="fill-emerald-600 text-white dark:fill-emerald-400 dark:text-slate-900" />
                              ) : (
                                <Square size={18} className="text-slate-400" />
                              )}
                            </button>

                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: c.color || '#10b981' }}
                            />

                            <div className="truncate">
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {c.name}
                              </h5>
                              <span className="text-[10px] text-slate-400">
                                {c.transactionCount} transactions
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setEditingCategory(c)}
                            className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* TAB 4: TRANSACTIONS (FULL POST-PARSING EDITING & SELECTION)        */}
              {/* ----------------------------------------------------------------- */}
              {activeTab === 'TRANSACTIONS' && (
                <div className="space-y-4">
                  {/* Toolbar & Filters */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search merchant, category, notes, amount..."
                          value={txSearchQuery}
                          onChange={e => setTxSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Bulk Select / Deselect Buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => selectFilteredTransactions(true)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        >
                          Select Filtered ({filteredTransactions.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => selectFilteredTransactions(false)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          Exclude Filtered
                        </button>
                      </div>
                    </div>

                    {/* Filter Dropdowns Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {/* Type Filter */}
                      <select
                        value={txTypeFilter}
                        onChange={e => setTxTypeFilter(e.target.value as any)}
                        className="py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="ALL">All Types</option>
                        <option value="EXPENSE">Expenses</option>
                        <option value="INCOME">Income</option>
                        <option value="TRANSFER">Transfers</option>
                      </select>

                      {/* Wallet Filter */}
                      <select
                        value={txWalletFilter}
                        onChange={e => setTxWalletFilter(e.target.value)}
                        className="py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="ALL">All Wallets</option>
                        {previewData.wallets.map(w => (
                          <option key={w.id} value={w.name}>
                            {w.name}
                          </option>
                        ))}
                      </select>

                      {/* Category Filter */}
                      <select
                        value={txCategoryFilter}
                        onChange={e => setTxCategoryFilter(e.target.value)}
                        className="py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="ALL">All Categories</option>
                        {previewData.categories.map(c => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>

                      {/* Selection Filter */}
                      <select
                        value={txSelectionFilter}
                        onChange={e => setTxSelectionFilter(e.target.value as any)}
                        className="py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="ALL">All Status</option>
                        <option value="SELECTED">Selected Only</option>
                        <option value="EXCLUDED">Excluded Only</option>
                      </select>
                    </div>

                    {/* Batch Actions Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                      <span>
                        Showing {filteredTransactions.length} of {previewData.allTransactions.length} items (
                        {filteredTransactions.filter(t => t.isSelected !== false).length} selected)
                      </span>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setBatchActionModal('ACCOUNT')}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Reassign Account...
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setBatchActionModal('CATEGORY')}
                          className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Reassign Category...
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Transactions Table / List */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {filteredTransactions.length === 0 ? (
                      <div className="py-10 text-center text-xs text-slate-400">
                        No transactions match your search or filter criteria.
                      </div>
                    ) : (
                      filteredTransactions.map((tx, idx) => (
                        <div
                          key={`import_tx_${tx.id}_${idx}`}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            tx.isSelected !== false
                              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-xs'
                              : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-50'
                          }`}
                        >
                          {/* Left: Checkbox + Date + Title */}
                          <div className="flex items-center space-x-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleTxSelection(tx.id)}
                              className="text-emerald-600 dark:text-emerald-400 shrink-0"
                            >
                              {tx.isSelected !== false ? (
                                <CheckSquare size={18} className="fill-emerald-600 text-white dark:fill-emerald-400 dark:text-slate-900" />
                              ) : (
                                <Square size={18} className="text-slate-400" />
                              )}
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {tx.title || 'Untitled Transaction'}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase ${
                                    tx.type === 'INCOME'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : tx.type === 'TRANSFER'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}
                                >
                                  {tx.type}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>{tx.date}</span>
                                <span>•</span>
                                <span className="truncate">{tx.categoryName}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-600 dark:text-slate-300 truncate">
                                  {tx.accountName}
                                  {tx.toAccountName ? ` → ${tx.toAccountName}` : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Amount + Edit/Delete Actions */}
                          <div className="flex items-center space-x-3 shrink-0">
                            <span
                              className={`text-xs font-extrabold ${
                                tx.type === 'INCOME'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {tx.type === 'INCOME' ? '+' : ''}
                              {formatINR(tx.amount)}
                            </span>

                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => setEditingTx(tx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTxFromPreview(tx.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Action Execution Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isLoading || liveSummary.totalSelectedTx === 0}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 size={16} />
                  <span>
                    Execute Import ({liveSummary.totalSelectedTx} Transactions, {liveSummary.selectedWallets} Accounts)
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: SUCCESS                                                           */}
          {/* ========================================================================= */}
          {step === 'SUCCESS' && importResultSummary && (
            <div className="text-center py-8 space-y-5 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Cashew Data Successfully Imported!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Your customized accounts, cards, categories and transactions are now fully loaded and synced into your accounting engine.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Transactions</span>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">
                    {importResultSummary.txCount}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Accounts</span>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">
                    {importResultSummary.accountsCount}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Categories</span>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">
                    {importResultSummary.categoriesCount}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all"
                >
                  Start Using App
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EDIT WALLET / ACCOUNT                                              */}
      {/* ========================================================================= */}
      {editingWallet && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Edit Wallet / Account
              </h4>
              <button
                onClick={() => setEditingWallet(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Account Name</label>
                <input
                  type="text"
                  value={editingWallet.name}
                  onChange={e => setEditingWallet({ ...editingWallet, name: e.target.value })}
                  className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Account Type</label>
                <select
                  value={editingWallet.isCreditCard ? 'CREDIT_CARD' : editingWallet.accountType || 'SAVINGS'}
                  onChange={e => {
                    const isCard = e.target.value === 'CREDIT_CARD';
                    setEditingWallet({
                      ...editingWallet,
                      isCreditCard: isCard,
                      accountType: e.target.value as AccountType,
                    });
                  }}
                  className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CURRENT">Current Account</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="CASH">Cash Wallet</option>
                  <option value="DIGITAL_WALLET">Digital Wallet / UPI</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {editingWallet.isCreditCard ? 'Credit Limit (₹)' : 'Opening Balance (₹)'}
                </label>
                <input
                  type="number"
                  value={
                    editingWallet.isCreditCard
                      ? editingWallet.suggestedLimit || 100000
                      : editingWallet.suggestedOpeningBalance || 0
                  }
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    if (editingWallet.isCreditCard) {
                      setEditingWallet({ ...editingWallet, suggestedLimit: val });
                    } else {
                      setEditingWallet({ ...editingWallet, suggestedOpeningBalance: val });
                    }
                  }}
                  className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Map to existing account in app */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Map to Existing App Account (Optional)
                </label>
                <select
                  value={editingWallet.mappedAccountId || ''}
                  onChange={e =>
                    setEditingWallet({
                      ...editingWallet,
                      mappedAccountId: e.target.value || undefined,
                    })
                  }
                  className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">-- Create as New Account --</option>
                  <optgroup label="Your Existing Accounts">
                    {context.accounts.map((a, idx) => (
                      <option key={`app_acc_${a.id}_${idx}`} value={a.id}>
                        {a.name} ({a.type})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Your Existing Credit Cards">
                    {context.creditCards.map((c, idx) => (
                      <option key={`app_card_${c.id}_${idx}`} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  If selected, imported transactions will link directly to this existing account.
                </p>
              </div>
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => setEditingWallet(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveEditedWallet(editingWallet)}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT TRANSACTION                                                   */}
      {/* ========================================================================= */}
      {editingTx && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Edit Transaction
              </h4>
              <button
                onClick={() => setEditingTx(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Title / Merchant</label>
                <input
                  type="text"
                  value={editingTx.title}
                  onChange={e => setEditingTx({ ...editingTx, title: e.target.value })}
                  className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Amount (₹)</label>
                  <input
                    type="number"
                    value={editingTx.amount}
                    onChange={e =>
                      setEditingTx({ ...editingTx, amount: Math.abs(parseFloat(e.target.value) || 0) })
                    }
                    className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Type</label>
                  <select
                    value={editingTx.type}
                    onChange={e => setEditingTx({ ...editingTx, type: e.target.value as any })}
                    className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Date</label>
                  <input
                    type="date"
                    value={editingTx.date}
                    onChange={e => setEditingTx({ ...editingTx, date: e.target.value })}
                    className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Category</label>
                  <input
                    type="text"
                    value={editingTx.categoryName}
                    onChange={e => setEditingTx({ ...editingTx, categoryName: e.target.value })}
                    className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Source Account / Wallet</label>
                <select
                  value={editingTx.accountName}
                  onChange={e => setEditingTx({ ...editingTx, accountName: e.target.value })}
                  className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {previewData?.wallets.map((w, idx) => (
                    <option key={`edit_prev_w_${w.id}_${idx}`} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                  {context.accounts.map((a, idx) => (
                    <option key={`edit_app_a_${a.id}_${idx}`} value={a.name}>
                      {a.name} (App Account)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Notes</label>
                <input
                  type="text"
                  value={editingTx.notes || ''}
                  onChange={e => setEditingTx({ ...editingTx, notes: e.target.value })}
                  className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  placeholder="Optional memo or notes"
                />
              </div>
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveEditedTx(editingTx)}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT CATEGORY                                                      */}
      {/* ========================================================================= */}
      {editingCategory && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Edit Category
              </h4>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Category Name</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Type</label>
                <select
                  value={editingCategory.type}
                  onChange={e => setEditingCategory({ ...editingCategory, type: e.target.value as any })}
                  className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="EXPENSE">Expense Category</option>
                  <option value="INCOME">Income Category</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Map to Existing Category in App (Optional)
                </label>
                <select
                  value={editingCategory.mappedCategoryId || ''}
                  onChange={e =>
                    setEditingCategory({
                      ...editingCategory,
                      mappedCategoryId: e.target.value || undefined,
                    })
                  }
                  className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">-- Create as New Category --</option>
                  {context.categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveEditedCategory(editingCategory)}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BATCH ACCOUNT REASSIGN                                             */}
      {/* ========================================================================= */}
      {batchActionModal === 'ACCOUNT' && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Assign Selected Transactions to Account
            </h4>
            <p className="text-xs text-slate-500">
              All currently selected transactions will be reassigned to the chosen account.
            </p>

            <select
              value={batchTargetAccount}
              onChange={e => setBatchTargetAccount(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            >
              <option value="">-- Choose Account --</option>
              {previewData?.wallets.map((w, idx) => (
                <option key={`prev_w_${w.id}_${idx}`} value={w.name}>
                  {w.name}
                </option>
              ))}
              {context.accounts.map((a, idx) => (
                <option key={`app_a_${a.id}_${idx}`} value={a.name}>
                  {a.name} (App Account)
                </option>
              ))}
            </select>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setBatchActionModal(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!batchTargetAccount}
                onClick={applyBatchAccountAssign}
                className="flex-1 py-2 rounded-xl bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BATCH CATEGORY REASSIGN                                            */}
      {/* ========================================================================= */}
      {batchActionModal === 'CATEGORY' && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Assign Selected Transactions to Category
            </h4>
            <p className="text-xs text-slate-500">
              All currently selected transactions will be assigned to this category.
            </p>

            <select
              value={batchTargetCategory}
              onChange={e => setBatchTargetCategory(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            >
              <option value="">-- Choose Category --</option>
              {previewData?.categories.map((c, idx) => (
                <option key={`batch_prev_c_${c.id}_${idx}`} value={c.name}>
                  {c.name}
                </option>
              ))}
              {context.categories.map((c, idx) => (
                <option key={`batch_app_c_${c.id}_${idx}`} value={c.name}>
                  {c.name} (App Category)
                </option>
              ))}
            </select>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setBatchActionModal(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!batchTargetCategory}
                onClick={applyBatchCategoryAssign}
                className="flex-1 py-2 rounded-xl bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
