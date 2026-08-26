import React, { useState, useEffect, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import {
  parseCashewDataAsync,
  applyCashewImport,
  CashewImportResult,
  CashewDiscoveredAccount,
  CashewAccountConfig,
  CashewAccountMappingConfig,
  CashewTargetType,
  SAMPLE_CASHEW_EXPORT_CSV,
  SAMPLE_CASHEW_EXPORT_SQL,
} from '../../lib/cashewImporter';
import { formatINR, formatForeignCurrency } from '../../lib/currency';
import { Emblem3D } from '../common/IconHelper';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import {
  BANK_CREDIT_CARDS_CATALOG,
  INDIAN_BANKS,
  CARD_NETWORKS,
  CARD_THEMES,
} from '../../lib/constants';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
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
  CreditCard as CreditCardIcon,
  Landmark,
  Banknote,
  Link,
  Check,
  ChevronRight,
  Settings2,
  Sliders,
  Eye,
  Building2,
  Percent,
} from 'lucide-react';

interface CashewImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 'UPLOAD' | 'CLASSIFY_ACCOUNTS' | 'CATEGORIES_RULES' | 'REVIEW';

export const CashewImportModal: React.FC<CashewImportModalProps> = ({ isOpen, onClose }) => {
  const context = useMoney();
  const [currentStep, setCurrentStep] = useState<WizardStep>('UPLOAD');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [rawInput, setRawInput] = useState<string | ArrayBuffer | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');

  // Account Classification State Map: [rawCashewName -> CashewAccountConfig]
  const [accountMappings, setAccountMappings] = useState<CashewAccountMappingConfig>({});

  // Options
  const [importMode, setImportMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [autoConvertCurrencies, setAutoConvertCurrencies] = useState(true);
  const [createMissingAccounts, setCreateMissingAccounts] = useState(true);
  const [createMissingCategories, setCreateMissingCategories] = useState(true);
  const [pairTransfers, setPairTransfers] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<CashewImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importedSummary, setImportedSummary] = useState<CashewImportResult['stats'] | null>(null);

  // Selected account in classification step for fine-tuning
  const [selectedAccName, setSelectedAccName] = useState<string | null>(null);

  // CustomSelect Options Definition
  const catalogCardOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '-- Keep Custom / Manual Setup --', sublabel: 'Do not link to card preset' },
    ...BANK_CREDIT_CARDS_CATALOG.map((c) => ({
      value: c.name,
      label: c.name,
      sublabel: `${c.issuer} • ${c.network}`,
      group: c.issuer,
      badge: c.network,
    }))
  ], []);

  const cardNetworkOptions: SelectOption[] = useMemo(() =>
    CARD_NETWORKS.map((net) => ({
      value: net.name,
      label: net.name,
    })), []);

  const indianBankOptions: SelectOption[] = useMemo(() =>
    INDIAN_BANKS.map((b) => ({
      value: b.name,
      label: b.name,
      sublabel: b.code,
    })), []);

  const bankAccountTypeOptions: SelectOption[] = useMemo(() => [
    { value: 'SAVINGS', label: 'Savings Account', sublabel: 'Standard personal account' },
    { value: 'SALARY', label: 'Salary Account', sublabel: 'Monthly payroll deposits' },
    { value: 'CURRENT', label: 'Current Account', sublabel: 'Business / High-volume' },
  ], []);

  const existingTargetOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [
      { value: '', label: '-- Choose Existing Account / Card --' },
    ];
    context.creditCards.forEach((c) => {
      opts.push({
        value: c.id,
        label: `💳 ${c.name}`,
        sublabel: `${c.issuer} • Limit ${formatINR(c.creditLimit || 0)}`,
        group: 'Credit Cards in App',
        badge: 'Card',
      });
    });
    context.accounts.forEach((a) => {
      opts.push({
        value: a.id,
        label: `🏦 ${a.name}`,
        sublabel: `${a.institution} • Balance ${formatINR(a.calculatedBalance ?? a.openingBalance ?? 0)}`,
        group: 'Bank Accounts in App',
        badge: 'Bank',
      });
    });
    return opts;
  }, [context.creditCards, context.accounts]);

  const importModeOptions: SelectOption[] = useMemo(() => [
    { value: 'MERGE', label: 'Merge & Deduplicate with Existing Data (Safe)', sublabel: 'Keeps existing records and imports new entries' },
    { value: 'REPLACE', label: 'Clean Slate (Replace all current accounts and records)', sublabel: 'Deletes all existing data before importing' },
  ], []);

  // Initial parse on file change to discover accounts
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
      pairTransfersAndCardPayments: pairTransfers,
      accountMappings,
      defaultAccountId: context.accounts[0]?.id,
      defaultCurrency: 'INR',
    })
      .then((res) => {
        if (isMounted) {
          setParseResult(res);
          setIsParsing(false);

          // Initialize accountMappings from discovered accounts if empty
          setAccountMappings((prev) => {
            const next = { ...prev };
            let hasChanges = false;
            res.discoveredAccounts.forEach((disc) => {
              if (!next[disc.rawName]) {
                hasChanges = true;
                next[disc.rawName] = {
                  targetType: disc.suggestedTarget,
                  bankInstitution: disc.suggestedBankInstitution,
                  bankAccountType: disc.suggestedBankAccountType || 'SAVINGS',
                  bankName: disc.rawName,
                  bankTheme: disc.suggestedTheme,
                  cardIssuer: disc.suggestedIssuer || 'HDFC Bank',
                  cardName: disc.suggestedCardVariant || disc.rawName,
                  cardVariant: disc.suggestedCardVariant || disc.rawName,
                  cardNetwork: disc.suggestedNetwork || 'VISA',
                  creditLimit: disc.suggestedLimit || 100000,
                  statementDate: disc.suggestedStatementDay || 15,
                  dueDate: disc.suggestedDueDay || 5,
                  cardTheme: disc.suggestedTheme || 'sapphire_blue',
                  walletName: disc.rawName,
                  walletIcon: disc.rawName.toLowerCase().includes('cash') ? 'Banknote' : 'Wallet',
                };
              }
            });
            return hasChanges ? next : prev;
          });

          if (!selectedAccName && res.discoveredAccounts.length > 0) {
            setSelectedAccName(res.discoveredAccounts[0].rawName);
          }
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
    importMode,
    autoConvertCurrencies,
    createMissingAccounts,
    createMissingCategories,
    pairTransfers,
    accountMappings,
    context.accounts,
    context.creditCards,
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

  const handleClear = () => {
    setRawInput(null);
    setPastedText('');
    setFileName('');
    setParseResult(null);
    setParseError(null);
    setAccountMappings({});
    setSelectedAccName(null);
    setCurrentStep('UPLOAD');
    setIsSuccess(false);
  };

  const handleUpdateAccountConfig = (accName: string, updates: Partial<CashewAccountConfig>) => {
    setAccountMappings((prev) => ({
      ...prev,
      [accName]: {
        ...(prev[accName] || { targetType: 'BANK' }),
        ...updates,
      },
    }));
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

  const filteredPreviewTransactions = (parseResult?.transactions || []).filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.notes || '').toLowerCase().includes(q) ||
      (t.categoryName || '').toLowerCase().includes(q) ||
      (t.merchantName || '').toLowerCase().includes(q) ||
      (t.accountName || '').toLowerCase().includes(q) ||
      (t.creditCardName || '').toLowerCase().includes(q) ||
      t.amount.toString().includes(q)
    );
  });

  const discoveredAccounts = parseResult?.discoveredAccounts || [];
  const currentSelectedAccount = discoveredAccounts.find((d) => d.rawName === selectedAccName) || discoveredAccounts[0];
  const currentConfig: CashewAccountConfig = currentSelectedAccount
    ? accountMappings[currentSelectedAccount.rawName] || {
        targetType: currentSelectedAccount.suggestedTarget,
        bankInstitution: currentSelectedAccount.suggestedBankInstitution,
        bankName: currentSelectedAccount.rawName,
        cardName: currentSelectedAccount.suggestedCardVariant || currentSelectedAccount.rawName,
        cardIssuer: currentSelectedAccount.suggestedIssuer,
        creditLimit: currentSelectedAccount.suggestedLimit || 100000,
      }
    : { targetType: 'BANK' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[94vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 dark:from-amber-950/40 dark:via-emerald-950/40 dark:to-teal-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
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
                  Cashew Importer & Account Classifier
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 uppercase tracking-wider">
                  Smart Mapping
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Categorize raw Cashew accounts into Bank Accounts, Credit Cards, or Wallets with verified limits & cycles
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

        {/* Step Indicator Bar */}
        {!isSuccess && (
          <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-x-auto text-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentStep('UPLOAD')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all ${
                  currentStep === 'UPLOAD'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <span>1. File & Data</span>
                {parseResult && <Check size={13} className="text-emerald-200" />}
              </button>

              <ChevronRight size={14} className="text-slate-400 shrink-0" />

              <button
                onClick={() => {
                  if (parseResult) setCurrentStep('CLASSIFY_ACCOUNTS');
                }}
                disabled={!parseResult}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all ${
                  currentStep === 'CLASSIFY_ACCOUNTS'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : parseResult
                    ? 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                    : 'text-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                <span>2. Classify Accounts & Cards</span>
                {discoveredAccounts.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold">
                    {discoveredAccounts.length}
                  </span>
                )}
              </button>

              <ChevronRight size={14} className="text-slate-400 shrink-0" />

              <button
                onClick={() => {
                  if (parseResult) setCurrentStep('CATEGORIES_RULES');
                }}
                disabled={!parseResult}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all ${
                  currentStep === 'CATEGORIES_RULES'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : parseResult
                    ? 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                    : 'text-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                <span>3. Categories & Rules</span>
              </button>

              <ChevronRight size={14} className="text-slate-400 shrink-0" />

              <button
                onClick={() => {
                  if (parseResult) setCurrentStep('REVIEW');
                }}
                disabled={!parseResult}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all ${
                  currentStep === 'REVIEW'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : parseResult
                    ? 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                    : 'text-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                <span>4. Review & Sync</span>
              </button>
            </div>

            {parseResult && (
              <div className="hidden sm:flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span>{parseResult.stats.totalTransactions} transactions</span>
                <span>•</span>
                <span>{discoveredAccounts.length} accounts found</span>
              </div>
            )}
          </div>
        )}

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
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-1 leading-relaxed">
                  All transactions, bank accounts, credit cards, and categories have been mapped and balances recalculated.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-400">Transactions</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {importedSummary.totalTransactions}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Income</div>
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {formatINR(importedSummary.totalIncome)}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400">Expenses</div>
                  <div className="text-lg font-black text-rose-700 dark:text-rose-300 mt-0.5">
                    {formatINR(importedSummary.totalExpense)}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                  <div className="text-xs font-bold text-purple-600 dark:text-purple-400">Cards & Banks</div>
                  <div className="text-base font-black text-purple-700 dark:text-purple-300 mt-0.5">
                    {importedSummary.creditCardsCount} Cards • {importedSummary.accountsCount} Banks
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/30 transition-all"
                >
                  View Accounts & Dashboard
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-all"
                >
                  Import Another File
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: FILE & DATA INPUT */}
              {currentStep === 'UPLOAD' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Top Bar with Tab switcher and sample buttons */}
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
                        <span>Paste Text / CSV / SQL</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={handleLoadCsvSample}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center space-x-1 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all shadow-xs"
                      >
                        <FileText size={13} className="text-amber-500" />
                        <span>Sample CSV</span>
                      </button>
                      <button
                        onClick={handleLoadSqlSample}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all shadow-xs"
                      >
                        <Database size={13} className="text-emerald-500" />
                        <span>Sample SQL</span>
                      </button>
                      {fileName && (
                        <button
                          onClick={handleClear}
                          className="px-2 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors"
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
                        className={`block border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
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
                        <div className="text-base font-bold text-slate-800 dark:text-white">
                          {fileName ? fileName : 'Choose Cashew Export File (.csv / .sql / .json / .db) or Drag & Drop'}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                          Works with Cashew Google Drive SQLite .sql backup files, Outbox CSV sheets, and JSON schemas
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Paste Raw Text */}
                  {activeTab === 'paste' && (
                    <div className="space-y-2">
                      <textarea
                        rows={7}
                        value={pastedText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPastedText(val);
                          setRawInput(val);
                          setFileName('Pasted Cashew Data');
                        }}
                        placeholder="Paste Cashew CSV text (e.g. account,amount,title,date,income...) or SQL statements..."
                        className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {/* Parsing State */}
                  {isParsing && (
                    <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center space-x-3 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      <Loader2 size={18} className="animate-spin text-emerald-600" />
                      <span>Analyzing Cashew tables, accounts, and transactions...</span>
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

                  {/* Analysis Result Preview */}
                  {parseResult && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          <span>File Verified ({parseResult.stats.totalTransactions} transactions detected)</span>
                        </div>
                        {parseResult.stats.dateRange && (
                          <span className="text-xs text-slate-500 flex items-center space-x-1">
                            <Calendar size={13} />
                            <span>{parseResult.stats.dateRange.start} to {parseResult.stats.dateRange.end}</span>
                          </span>
                        )}
                      </div>

                      {/* Discovered Accounts Pill Grid */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>Detected Accounts & Wallets ({discoveredAccounts.length}):</span>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            Auto-detected suggestions ready
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {discoveredAccounts.map((disc) => {
                            const config = accountMappings[disc.rawName];
                            const target = config?.targetType || disc.suggestedTarget;
                            return (
                              <div
                                key={disc.rawName}
                                className={`px-3 py-1.5 rounded-xl border text-xs flex items-center space-x-2 ${
                                  target === 'CREDIT_CARD'
                                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-300'
                                    : target === 'BANK'
                                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300'
                                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                                }`}
                              >
                                {target === 'CREDIT_CARD' ? (
                                  <CreditCardIcon size={13} className="text-purple-600" />
                                ) : target === 'BANK' ? (
                                  <Landmark size={13} className="text-blue-600" />
                                ) : (
                                  <Banknote size={13} className="text-emerald-600" />
                                )}
                                <span className="font-bold">{disc.rawName}</span>
                                <span className="text-[10px] opacity-75 font-mono">({disc.transactionCount} txns)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => setCurrentStep('CLASSIFY_ACCOUNTS')}
                          className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition-all active:scale-98"
                        >
                          <span>Proceed to Account Classification</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: ACCOUNT & CREDIT CARD CLASSIFIER (CORE FEATURE) */}
              {currentStep === 'CLASSIFY_ACCOUNTS' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 flex items-start space-x-3 text-xs">
                    <Info size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-900 dark:text-amber-200">
                        Cashew Account Classifier
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                        Cashew exports don't distinguish credit cards from savings banks. Select whether each account is a <strong>Bank Account</strong>, <strong>Credit Card</strong>, or <strong>Cash Wallet</strong>. For credit cards, verify credit limits and bill cycles so interest & statement tracking work seamlessly!
                      </div>
                    </div>
                  </div>

                  {/* Left-Right Split: Account Selector & Account Editor */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* Left: Discovered Accounts List */}
                    <div className="md:col-span-4 space-y-2 max-h-[440px] overflow-y-auto pr-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                        Detected Accounts ({discoveredAccounts.length})
                      </div>

                      {discoveredAccounts.map((disc) => {
                        const isSelected = disc.rawName === currentSelectedAccount?.rawName;
                        const config = accountMappings[disc.rawName];
                        const target = config?.targetType || disc.suggestedTarget;

                        return (
                          <div
                            key={disc.rawName}
                            onClick={() => setSelectedAccName(disc.rawName)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                                : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {target === 'CREDIT_CARD' ? (
                                  <CreditCardIcon size={14} className={isSelected ? 'text-purple-300 dark:text-purple-600' : 'text-purple-500'} />
                                ) : target === 'BANK' ? (
                                  <Landmark size={14} className={isSelected ? 'text-blue-300 dark:text-blue-600' : 'text-blue-500'} />
                                ) : target === 'WALLET' ? (
                                  <Banknote size={14} className={isSelected ? 'text-emerald-300 dark:text-emerald-600' : 'text-emerald-500'} />
                                ) : (
                                  <Link size={14} className={isSelected ? 'text-amber-300 dark:text-amber-600' : 'text-amber-500'} />
                                )}
                                <div className="font-bold text-xs truncate max-w-[150px]">{disc.rawName}</div>
                              </div>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black uppercase ${
                                target === 'CREDIT_CARD'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                                  : target === 'BANK'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                              }`}>
                                {target === 'CREDIT_CARD' ? 'Card' : target === 'BANK' ? 'Bank' : target === 'WALLET' ? 'Wallet' : 'Map'}
                              </span>
                            </div>

                            <div className={`text-[11px] mt-1.5 flex items-center justify-between ${
                              isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'
                            }`}>
                              <span>{disc.transactionCount} transactions</span>
                              <span>₹{disc.totalSpent.toLocaleString()} volume</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right: Detailed Configuration Panel */}
                    {currentSelectedAccount && (
                      <div className="md:col-span-8 p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                          <div>
                            <div className="text-xs text-slate-400 font-bold">Configuring detected account:</div>
                            <div className="text-base font-black text-slate-900 dark:text-white">
                              {currentSelectedAccount.rawName}
                            </div>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {currentSelectedAccount.transactionCount} txns found
                          </span>
                        </div>

                        {/* Classification Target Buttons */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Classify As
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateAccountConfig(currentSelectedAccount.rawName, { targetType: 'CREDIT_CARD' })}
                              className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${
                                currentConfig.targetType === 'CREDIT_CARD'
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/30'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                              }`}
                            >
                              <CreditCardIcon size={18} />
                              <span>Credit Card</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateAccountConfig(currentSelectedAccount.rawName, { targetType: 'BANK' })}
                              className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${
                                currentConfig.targetType === 'BANK'
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                              }`}
                            >
                              <Landmark size={18} />
                              <span>Bank Account</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateAccountConfig(currentSelectedAccount.rawName, { targetType: 'WALLET' })}
                              className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${
                                currentConfig.targetType === 'WALLET'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                              }`}
                            >
                              <Banknote size={18} />
                              <span>Cash / Wallet</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateAccountConfig(currentSelectedAccount.rawName, { targetType: 'EXISTING_CARD' })}
                              className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${
                                currentConfig.targetType === 'EXISTING_CARD' || currentConfig.targetType === 'EXISTING_ACCOUNT'
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/30'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                              }`}
                            >
                              <Link size={18} />
                              <span>Map to Existing</span>
                            </button>
                          </div>
                        </div>

                        {/* Target Option 1: CREDIT CARD DETAILS */}
                        {currentConfig.targetType === 'CREDIT_CARD' && (
                          <div className="p-4 rounded-2xl bg-purple-500/10 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-4 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center space-x-1.5">
                                <CreditCardIcon size={14} className="text-purple-600" />
                                <span>Credit Card Specs & Catalog Match</span>
                              </span>
                              {currentSelectedAccount.suggestedPresetCardId && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                                  Auto-matched catalog card
                                </span>
                              )}
                            </div>

                            {/* Card Catalog Quick Select */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                Match from Verified Indian Card Catalog
                              </label>
                              <CustomSelect
                                value={currentConfig.cardVariant || ''}
                                onChange={(val) => {
                                  const preset = BANK_CREDIT_CARDS_CATALOG.find((c) => c.name === val);
                                  if (preset) {
                                    handleUpdateAccountConfig(currentSelectedAccount.rawName, {
                                      cardName: preset.name,
                                      cardIssuer: preset.issuer,
                                      cardVariant: preset.name,
                                      cardNetwork: preset.network as any,
                                      creditLimit: preset.limit || 100000,
                                      statementDate: preset.statementDay || 15,
                                      dueDate: preset.dueDay || 5,
                                      cardTheme: preset.theme || 'sapphire',
                                    });
                                  } else {
                                    handleUpdateAccountConfig(currentSelectedAccount.rawName, { cardVariant: val });
                                  }
                                }}
                                options={catalogCardOptions}
                                placeholder="-- Choose or keep custom --"
                                searchPlaceholder="Search credit card catalog..."
                                className="w-full"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                  Card Display Name
                                </label>
                                <input
                                  type="text"
                                  value={currentConfig.cardName || currentSelectedAccount.rawName}
                                  onChange={(e) => handleUpdateAccountConfig(currentSelectedAccount.rawName, { cardName: e.target.value })}
                                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                  Issuing Bank
                                </label>
                                <input
                                  type="text"
                                  value={currentConfig.cardIssuer || 'HDFC Bank'}
                                  onChange={(e) => handleUpdateAccountConfig(currentSelectedAccount.rawName, { cardIssuer: e.target.value })}
                                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                  Credit Limit (₹)
                                </label>
                                <input
                                  type="number"
                                  value={currentConfig.creditLimit || 100000}
                                  onChange={(e) => handleUpdateAccountConfig(currentSelectedAccount.rawName, { creditLimit: Number(e.target.value) })}
                                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                  Network
                                </label>
                                <CustomSelect
                                  value={currentConfig.cardNetwork || 'VISA'}
                                  onChange={(val) => handleUpdateAccountConfig(currentSelectedAccount.rawName, { cardNetwork: val as any })}
                                  options={cardNetworkOptions}
                                  placeholder="Select Network"
                                  className="w-full"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                  Statement Day (1-31)
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={31}
                                  value={currentConfig.statementDate || 15}
                                  onChange={(e) => handleUpdateAccountConfig(currentSelectedAccount.rawName, { statementDate: Number(e.target.value) })}
                                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                  Due Day (1-31)
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={31}
                                  value={currentConfig.dueDate || 5}
                                  onChange={(e) => handleUpdateAccountConfig(currentSelectedAccount.rawName, { dueDate: Number(e.target.value) })}
                                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Target Option 2: BANK ACCOUNT DETAILS */}
                        {currentConfig.targetType === 'BANK' && (
                          <div className="p-4 rounded-2xl bg-blue-500/10 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-4 animate-in fade-in duration-150">
                            <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center space-x-1.5">
                              <Landmark size={14} className="text-blue-600" />
                              <span>Bank Account Specifications</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                  Bank Institution
                                </label>
                                <CustomSelect
                                  value={currentConfig.bankInstitution || 'Federal Bank'}
                                  onChange={(val) => handleUpdateAccountConfig(currentSelectedAccount.rawName, { bankInstitution: val })}
                                  options={indianBankOptions}
                                  placeholder="Select Bank"
                                  searchPlaceholder="Search bank institution..."
                                  className="w-full"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                  Account Type
                                </label>
                                <CustomSelect
                                  value={currentConfig.bankAccountType || 'SAVINGS'}
                                  onChange={(val) => handleUpdateAccountConfig(currentSelectedAccount.rawName, { bankAccountType: val as any })}
                                  options={bankAccountTypeOptions}
                                  placeholder="Select Account Type"
                                  className="w-full"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                  Display Name in App
                                </label>
                                <input
                                  type="text"
                                  value={currentConfig.bankName || currentSelectedAccount.rawName}
                                  onChange={(e) => handleUpdateAccountConfig(currentSelectedAccount.rawName, { bankName: e.target.value })}
                                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                  Opening / Initial Balance (₹)
                                </label>
                                <input
                                  type="number"
                                  value={currentConfig.bankOpeningBalance || 0}
                                  onChange={(e) => handleUpdateAccountConfig(currentSelectedAccount.rawName, { bankOpeningBalance: Number(e.target.value) })}
                                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Target Option 3: WALLET DETAILS */}
                        {currentConfig.targetType === 'WALLET' && (
                          <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-4 animate-in fade-in duration-150">
                            <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center space-x-1.5">
                              <Banknote size={14} className="text-emerald-600" />
                              <span>Cash & Digital Wallet Settings</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                  Wallet Name
                                </label>
                                <input
                                  type="text"
                                  value={currentConfig.walletName || currentSelectedAccount.rawName}
                                  onChange={(e) => handleUpdateAccountConfig(currentSelectedAccount.rawName, { walletName: e.target.value })}
                                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                  Opening Balance (₹)
                                </label>
                                <input
                                  type="number"
                                  value={currentConfig.walletOpeningBalance || 0}
                                  onChange={(e) => handleUpdateAccountConfig(currentSelectedAccount.rawName, { walletOpeningBalance: Number(e.target.value) })}
                                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Target Option 4: MAP TO EXISTING */}
                        {(currentConfig.targetType === 'EXISTING_CARD' || currentConfig.targetType === 'EXISTING_ACCOUNT') && (
                          <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-4 animate-in fade-in duration-150">
                            <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                              <Link size={14} className="text-amber-600" />
                              <span>Link Cashew transactions to an already existing Account/Card</span>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                Select Existing Target
                              </label>
                              <CustomSelect
                                value={currentConfig.existingId || ''}
                                onChange={(val) => {
                                  const cardMatch = context.creditCards.find((c) => c.id === val);
                                  handleUpdateAccountConfig(currentSelectedAccount.rawName, {
                                    targetType: cardMatch ? 'EXISTING_CARD' : 'EXISTING_ACCOUNT',
                                    existingId: val,
                                  });
                                }}
                                options={existingTargetOptions}
                                placeholder="-- Choose Existing Account / Card --"
                                searchPlaceholder="Search existing accounts or cards..."
                                className="w-full"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setCurrentStep('UPLOAD')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1"
                    >
                      <ArrowLeft size={14} />
                      <span>Back to File</span>
                    </button>

                    <button
                      onClick={() => setCurrentStep('CATEGORIES_RULES')}
                      className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition-all active:scale-98"
                    >
                      <span>Proceed to Categories & Rules</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CATEGORIES & TRANSFER RULES */}
              {currentStep === 'CATEGORIES_RULES' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Configuration Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <Repeat size={16} className="text-emerald-500" />
                        <span>Transfer & Card Bill Pairing</span>
                      </div>
                      <label className="flex items-start space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pairTransfers}
                          onChange={(e) => setPairTransfers(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded-sm text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                        />
                        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          <strong>Smart Transfer Pairing:</strong> Detect paired Cashew transfer transactions (e.g. Federal Bank → Coral Rupay ICICI CC) and merge them into a single credit card payment or transfer transaction with zero double counting.
                        </div>
                      </label>
                    </div>

                    <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <Globe size={16} className="text-blue-500" />
                        <span>Foreign Currencies & Conversion</span>
                      </div>
                      <label className="flex items-start space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoConvertCurrencies}
                          onChange={(e) => setAutoConvertCurrencies(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded-sm text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                        />
                        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          <strong>Live INR Currency Conversion:</strong> Automatically convert USD, EUR, GBP, AED, SAR transactions to INR (₹) while storing original amounts in metadata.
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <Sliders size={16} className="text-purple-500" />
                        <span>Import Mode</span>
                      </div>
                      <CustomSelect
                        value={importMode}
                        onChange={(val) => setImportMode(val as 'MERGE' | 'REPLACE')}
                        options={importModeOptions}
                        placeholder="Select Import Mode"
                        className="w-full"
                      />
                    </div>

                    <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <Tag size={16} className="text-amber-500" />
                        <span>Category Preservation</span>
                      </div>
                      <label className="flex items-start space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createMissingCategories}
                          onChange={(e) => setCreateMissingCategories(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded-sm text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                        />
                        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          <strong>Create Missing Categories:</strong> Automatically add any custom categories and subcategories found in Cashew with matching icons & colors.
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setCurrentStep('CLASSIFY_ACCOUNTS')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1"
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Accounts</span>
                    </button>

                    <button
                      onClick={() => setCurrentStep('REVIEW')}
                      className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition-all active:scale-98"
                    >
                      <span>Proceed to Final Review</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & SYNC */}
              {currentStep === 'REVIEW' && parseResult && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                      <div className="text-[11px] font-bold text-slate-500">Transactions</div>
                      <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                        {parseResult.stats.totalTransactions}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Income ({parseResult.stats.incomeCount})
                      </div>
                      <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {formatINR(parseResult.stats.totalIncome)}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                      <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                        Expenses ({parseResult.stats.expenseCount})
                      </div>
                      <div className="text-lg font-black text-rose-700 dark:text-rose-300 mt-0.5">
                        {formatINR(parseResult.stats.totalExpense)}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
                      <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                        Accounts & Cards
                      </div>
                      <div className="text-base font-black text-purple-700 dark:text-purple-300 mt-0.5">
                        {parseResult.creditCards.length} Cards • {parseResult.accounts.length} Banks
                      </div>
                    </div>
                  </div>

                  {/* Summary Breakdown of what is being created */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-2">
                      <div className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center space-x-2">
                        <CreditCardIcon size={15} />
                        <span>Credit Cards to Configure ({parseResult.creditCards.length}):</span>
                      </div>
                      <div className="space-y-1.5">
                        {parseResult.creditCards.length === 0 ? (
                          <div className="text-[11px] text-slate-400">No new credit cards configured.</div>
                        ) : (
                          parseResult.creditCards.map((c) => (
                            <div key={c.id} className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                              <span>💳 {c.name} ({c.issuer})</span>
                              <span className="text-purple-600 font-mono">Limit: ₹{c.creditLimit?.toLocaleString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
                      <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center space-x-2">
                        <Landmark size={15} />
                        <span>Bank & Cash Accounts ({parseResult.accounts.length}):</span>
                      </div>
                      <div className="space-y-1.5">
                        {parseResult.accounts.length === 0 ? (
                          <div className="text-[11px] text-slate-400">No new bank accounts configured.</div>
                        ) : (
                          parseResult.accounts.map((a) => (
                            <div key={a.id} className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                              <span>🏦 {a.name} ({a.institution})</span>
                              <span className="text-blue-600 font-mono">{a.type}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Searchable Transaction Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Previewing {filteredPreviewTransactions.length} of {parseResult.transactions.length} items
                      </span>
                      <input
                        type="text"
                        placeholder="Search preview..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-52"
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
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
                                  : tx.type === 'TRANSFER' || tx.type === 'CREDIT_CARD_PAYMENT'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              }`}>
                                {tx.type === 'INCOME' ? (
                                  <ArrowDownLeft size={15} />
                                ) : tx.type === 'TRANSFER' || tx.type === 'CREDIT_CARD_PAYMENT' ? (
                                  <Repeat size={15} />
                                ) : (
                                  <ArrowUpRight size={15} />
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                  {tx.notes || tx.merchantName || tx.categoryName || 'Transaction'}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                                  <span>{tx.date}</span>
                                  <span>•</span>
                                  <span>{tx.categoryName}</span>
                                  {(tx.accountName || tx.creditCardName) && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                                        {tx.creditCardName ? `💳 ${tx.creditCardName}` : `🏦 ${tx.accountName}`}
                                      </span>
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

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setCurrentStep('CATEGORIES_RULES')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1"
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Rules</span>
                    </button>

                    <button
                      onClick={handleExecuteImport}
                      className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all active:scale-98"
                    >
                      <CheckCircle2 size={16} />
                      <span>Import & Complete Migration</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
