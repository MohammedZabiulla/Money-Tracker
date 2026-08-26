import React, { useState, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { CashewExportOptions } from '../../types';
import { formatINR } from '../../lib/currency';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import {
  exportCashewTransactionsCsv,
  filterTransactionsForExport,
  exportToExcel,
  exportFullBackupJson,
  exportTemplatesCsv,
  exportTemplatesJson,
} from '../../lib/storage';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Database,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  CreditCard,
  Building2,
  Tag,
  Eye,
  Copy,
  Check,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CashewExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashewExportModal: React.FC<CashewExportModalProps> = ({ isOpen, onClose }) => {
  const {
    transactions,
    accounts,
    creditCards,
    categories,
    templates,
    investments,
    loans,
    debts,
    recurring,
    subscriptions,
    budgets,
    goals,
    paymentApps,
    settings,
  } = useMoney();

  // Export options state
  const [selectedFormat, setSelectedFormat] = useState<'CASHEW_CSV' | 'EXCEL_XLSX' | 'JSON_BACKUP' | 'PRINT_HTML' | 'TEMPLATES_CSV'>('CASHEW_CSV');
  const [dateRangeMode, setDateRangeMode] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [includeSplits, setIncludeSplits] = useState(true);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const exportAccountOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [{ value: 'ALL', label: 'All Accounts & Cards' }];
    if (accounts.length > 0) {
      accounts.forEach((a) => {
        opts.push({
          value: a.id,
          label: a.name,
          sublabel: a.institution,
          group: 'Bank Accounts',
        });
      });
    }
    if (creditCards.length > 0) {
      creditCards.forEach((c) => {
        opts.push({
          value: c.id,
          label: c.name,
          sublabel: c.issuer,
          group: 'Credit Cards',
        });
      });
    }
    return opts;
  }, [accounts, creditCards]);

  const exportCategoryOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [{ value: 'ALL', label: 'All Categories' }];
    categories.forEach((c) => {
      opts.push({
        value: c.id,
        label: c.name,
      });
    });
    return opts;
  }, [categories]);

  const exportTypeOptions: SelectOption[] = useMemo(() => [
    { value: 'ALL', label: 'All Transaction Types' },
    { value: 'EXPENSE', label: 'Expenses Only (-)' },
    { value: 'INCOME', label: 'Income Only (+)' },
    { value: 'TRANSFER', label: 'Transfers Only (⇆)' },
    { value: 'CARD_PAYMENT', label: 'Card Payments' },
    { value: 'INVESTMENT_CONTRIBUTION', label: 'Investments' },
  ], []);

  // Compute date ranges based on dateRangeMode
  const computedDateRange = useMemo(() => {
    const now = new Date();
    if (dateRangeMode === 'THIS_MONTH') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      return {
        startDate: `${year}-${month}-01`,
        endDate: `${year}-${month}-${new Date(year, now.getMonth() + 1, 0).getDate()}`,
      };
    } else if (dateRangeMode === 'LAST_MONTH') {
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = prevMonthDate.getFullYear();
      const month = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
      return {
        startDate: `${year}-${month}-01`,
        endDate: `${year}-${month}-${new Date(year, prevMonthDate.getMonth() + 1, 0).getDate()}`,
      };
    } else if (dateRangeMode === 'THIS_YEAR') {
      const year = now.getFullYear();
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      };
    } else if (dateRangeMode === 'CUSTOM') {
      return {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
    }
    return { startDate: undefined, endDate: undefined };
  }, [dateRangeMode, startDate, endDate]);

  const exportOptions: CashewExportOptions = useMemo(() => {
    return {
      startDate: computedDateRange.startDate,
      endDate: computedDateRange.endDate,
      accountId: selectedAccountId !== 'ALL' ? selectedAccountId : undefined,
      categoryId: selectedCategoryId !== 'ALL' ? selectedCategoryId : undefined,
      type: selectedType !== 'ALL' ? (selectedType as any) : undefined,
      includeNotes,
      includeTags,
      includeSplits,
      includeDeleted,
    };
  }, [
    computedDateRange,
    selectedAccountId,
    selectedCategoryId,
    selectedType,
    includeNotes,
    includeTags,
    includeSplits,
    includeDeleted,
  ]);

  const filteredData = useMemo(() => {
    return filterTransactionsForExport(transactions, exportOptions);
  }, [transactions, exportOptions]);

  const totalExpense = useMemo(() => {
    return filteredData
      .filter(t => t.type === 'EXPENSE' || t.type === 'SUBSCRIPTION_PAYMENT' || t.type === 'BILL_PAYMENT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [filteredData]);

  const totalIncome = useMemo(() => {
    return filteredData
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [filteredData]);

  const handleExport = () => {
    if (selectedFormat === 'CASHEW_CSV') {
      exportCashewTransactionsCsv(transactions, exportOptions);
      setExportSuccessMessage(`Exported ${filteredData.length} transactions to Cashew CSV!`);
    } else if (selectedFormat === 'EXCEL_XLSX') {
      exportToExcel({
        accounts,
        creditCards,
        categories,
        merchants: [],
        paymentApps,
        transactions: filteredData,
        templates,
        recurring,
        subscriptions,
        budgets,
        goals,
        loans,
        investments,
        debts,
        reconciliations: [],
        settings,
      }, 'xlsx');
      setExportSuccessMessage(`Generated comprehensive Excel workbook with ${filteredData.length} transactions and templates!`);
    } else if (selectedFormat === 'JSON_BACKUP') {
      exportFullBackupJson({
        accounts,
        creditCards,
        categories,
        merchants: [],
        paymentApps,
        transactions,
        templates,
        recurring,
        subscriptions,
        budgets,
        goals,
        loans,
        investments,
        debts,
        reconciliations: [],
        settings,
      });
      setExportSuccessMessage(`Full JSON data backup created successfully!`);
    } else if (selectedFormat === 'TEMPLATES_CSV') {
      exportTemplatesCsv(templates);
      setExportSuccessMessage(`Exported ${templates.length} transaction templates to CSV!`);
    } else if (selectedFormat === 'PRINT_HTML') {
      generatePrintableStatement();
      setExportSuccessMessage(`Opening print preview statement...`);
    }

    setTimeout(() => setExportSuccessMessage(null), 4000);
  };

  const handleCopyCsvToClipboard = () => {
    const headers = [
      'Date',
      'Time',
      'Type',
      'Title / Merchant',
      'Category',
      'Subcategory',
      'Amount (INR)',
      'Account / Source',
      'Destination Account',
      'Credit Card',
      'Payment Channel',
      'Notes',
      'Tags',
    ];

    const rows = filteredData.map(t => [
      t.date,
      t.time || '',
      t.type,
      t.merchantName || '',
      t.categoryName || '',
      t.subcategory || '',
      t.amount,
      t.accountName || '',
      t.toAccountName || '',
      t.creditCardName || '',
      t.paymentAppName || '',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      `"${(t.tags || []).join(', ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    navigator.clipboard.writeText(csvContent).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    });
  };

  const generatePrintableStatement = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Financial Statement - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; }
          .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
          .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
          .card-title { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; }
          .card-val { font-size: 20px; font-weight: 700; margin-top: 4px; }
          .val-income { color: #059669; }
          .val-expense { color: #e11d48; }
          .val-net { color: #2563eb; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px; }
          th { text-align: left; background: #f1f5f9; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; font-weight: 600; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
          .badge-exp { background: #ffe4e6; color: #be123c; }
          .badge-inc { background: #d1fae5; color: #047857; }
          .badge-tra { background: #dbeafe; color: #1d4ed8; }
          @media print {
            body { margin: 20px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">MoneyTracker Financial Statement</h1>
            <div class="subtitle">Generated on ${new Date().toLocaleString()} | Cashew Compatible Export</div>
          </div>
          <button onclick="window.print()" style="padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Print Report</button>
        </div>

        <div class="summary-cards">
          <div class="card">
            <div class="card-title">Total Income</div>
            <div class="card-val val-income">+₹${totalIncome.toLocaleString('en-IN')}</div>
          </div>
          <div class="card">
            <div class="card-title">Total Expenses</div>
            <div class="card-val val-expense">-₹${totalExpense.toLocaleString('en-IN')}</div>
          </div>
          <div class="card">
            <div class="card-title">Net Cash Flow</div>
            <div class="card-val val-net">₹${(totalIncome - totalExpense).toLocaleString('en-IN')}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Merchant / Title</th>
              <th>Category</th>
              <th>Account / Mode</th>
              <th>Notes</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map(t => {
              const isExp = t.type === 'EXPENSE' || t.type === 'SUBSCRIPTION_PAYMENT' || t.type === 'BILL_PAYMENT';
              const isInc = t.type === 'INCOME';
              const badgeClass = isExp ? 'badge-exp' : isInc ? 'badge-inc' : 'badge-tra';
              const sign = isExp ? '-' : isInc ? '+' : '';
              return `
                <tr>
                  <td>${t.date}</td>
                  <td><span class="badge ${badgeClass}">${t.type}</span></td>
                  <td><strong>${t.merchantName || t.categoryName || 'Transaction'}</strong></td>
                  <td>${t.categoryName || '—'}${t.subcategory ? ` / ${t.subcategory}` : ''}</td>
                  <td>${t.accountName || t.creditCardName || t.paymentAppName || '—'}</td>
                  <td>${t.notes || ''}</td>
                  <td style="text-align: right; font-weight: bold; ${isExp ? 'color:#e11d48;' : isInc ? 'color:#059669;' : ''}">
                    ${sign}₹${t.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Export & Statements</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  Cashew Format
                </span>
              </div>
              <p className="text-xs text-slate-400">Export filtered transactions, full financial workbooks, or template backups</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success message banner */}
        {exportSuccessMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2 flex items-center gap-2 text-xs font-medium text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{exportSuccessMessage}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Format Selector Cards */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Export Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Option 1: Cashew CSV */}
              <button
                type="button"
                onClick={() => setSelectedFormat('CASHEW_CSV')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  selectedFormat === 'CASHEW_CSV'
                    ? 'bg-blue-600/10 border-blue-500/60 ring-1 ring-blue-500/50 shadow-md'
                    : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedFormat === 'CASHEW_CSV' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>Cashew CSV</span>
                    {selectedFormat === 'CASHEW_CSV' && <Check className="w-3 h-3 text-blue-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Standard Cashew CSV with subcategories & payment channels
                  </p>
                </div>
              </button>

              {/* Option 2: Multi-sheet Excel */}
              <button
                type="button"
                onClick={() => setSelectedFormat('EXCEL_XLSX')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  selectedFormat === 'EXCEL_XLSX'
                    ? 'bg-emerald-600/10 border-emerald-500/60 ring-1 ring-emerald-500/50 shadow-md'
                    : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedFormat === 'EXCEL_XLSX' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>Excel (.xlsx)</span>
                    {selectedFormat === 'EXCEL_XLSX' && <Check className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Multi-sheet workbook (Transactions, Cards, Categories, Templates)
                  </p>
                </div>
              </button>

              {/* Option 3: Full JSON */}
              <button
                type="button"
                onClick={() => setSelectedFormat('JSON_BACKUP')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  selectedFormat === 'JSON_BACKUP'
                    ? 'bg-purple-600/10 border-purple-500/60 ring-1 ring-purple-500/50 shadow-md'
                    : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedFormat === 'JSON_BACKUP' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>Full JSON Backup</span>
                    {selectedFormat === 'JSON_BACKUP' && <Check className="w-3 h-3 text-purple-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Complete raw backup of all app data and settings
                  </p>
                </div>
              </button>

              {/* Option 4: Printable Statement */}
              <button
                type="button"
                onClick={() => setSelectedFormat('PRINT_HTML')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  selectedFormat === 'PRINT_HTML'
                    ? 'bg-amber-600/10 border-amber-500/60 ring-1 ring-amber-500/50 shadow-md'
                    : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedFormat === 'PRINT_HTML' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>Print Statement</span>
                    {selectedFormat === 'PRINT_HTML' && <Check className="w-3 h-3 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Clean printable tabular statement & PDF print layout
                  </p>
                </div>
              </button>

              {/* Option 5: Templates Only */}
              <button
                type="button"
                onClick={() => setSelectedFormat('TEMPLATES_CSV')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  selectedFormat === 'TEMPLATES_CSV'
                    ? 'bg-teal-600/10 border-teal-500/60 ring-1 ring-teal-500/50 shadow-md'
                    : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedFormat === 'TEMPLATES_CSV' ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>Templates CSV</span>
                    {selectedFormat === 'TEMPLATES_CSV' && <Check className="w-3 h-3 text-teal-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Export just your {templates.length} saved transaction templates
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Filters & Options (Shown for non-template formats) */}
          {selectedFormat !== 'TEMPLATES_CSV' && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Filter className="w-3.5 h-3.5 text-blue-400" />
                <span>Export Filter Parameters</span>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-400">Date Range</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'ALL', label: 'All Time' },
                    { id: 'THIS_MONTH', label: 'This Month' },
                    { id: 'LAST_MONTH', label: 'Last Month' },
                    { id: 'THIS_YEAR', label: 'This Year' },
                    { id: 'CUSTOM', label: 'Custom Range' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDateRangeMode(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        dateRangeMode === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {dateRangeMode === 'CUSTOM' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 animate-in fade-in">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">From Date</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">To Date</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Account, Category & Type Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Account / Card</label>
                  <CustomSelect
                    value={selectedAccountId}
                    onChange={(val) => setSelectedAccountId(val)}
                    options={exportAccountOptions}
                    placeholder="All Accounts & Cards"
                    searchPlaceholder="Search account or card..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <CustomSelect
                    value={selectedCategoryId}
                    onChange={(val) => setSelectedCategoryId(val)}
                    options={exportCategoryOptions}
                    placeholder="All Categories"
                    searchPlaceholder="Search categories..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Transaction Type</label>
                  <CustomSelect
                    value={selectedType}
                    onChange={(val) => setSelectedType(val)}
                    options={exportTypeOptions}
                    placeholder="All Transaction Types"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Checkbox Inclusions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeNotes}
                    onChange={(e) => setIncludeNotes(e.target.checked)}
                    className="rounded border-slate-700 text-blue-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                  />
                  <span>Include Notes</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTags}
                    onChange={(e) => setIncludeTags(e.target.checked)}
                    className="rounded border-slate-700 text-blue-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                  />
                  <span>Include Tags</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSplits}
                    onChange={(e) => setIncludeSplits(e.target.checked)}
                    className="rounded border-slate-700 text-blue-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                  />
                  <span>Include Splits</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDeleted}
                    onChange={(e) => setIncludeDeleted(e.target.checked)}
                    className="rounded border-slate-700 text-blue-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                  />
                  <span>Include Trash</span>
                </label>
              </div>
            </div>
          )}

          {/* Export Overview Bar */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Matched Rows</span>
                <span className="text-base font-extrabold text-white">
                  {selectedFormat === 'TEMPLATES_CSV' ? templates.length : filteredData.length} records
                </span>
              </div>
              {selectedFormat !== 'TEMPLATES_CSV' && (
                <>
                  <div className="w-px h-8 bg-slate-800 hidden sm:block" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Expenses</span>
                    <span className="text-sm font-bold text-rose-400">-{formatINR(totalExpense)}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-800 hidden sm:block" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Income</span>
                    <span className="text-sm font-bold text-emerald-400">+{formatINR(totalIncome)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedFormat === 'CASHEW_CSV' && (
                <button
                  type="button"
                  onClick={handleCopyCsvToClipboard}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy CSV</span>
                    </>
                  )}
                </button>
              )}

              {selectedFormat !== 'TEMPLATES_CSV' && filteredData.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showPreview ? 'Hide Preview' : 'Preview Table'}</span>
                  {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Preview Table Accordion */}
          {showPreview && filteredData.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Export Preview (First 15 items)</span>
                <span className="text-slate-500 font-normal">Showing {Math.min(15, filteredData.length)} of {filteredData.length}</span>
              </div>
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/60 text-[11px] text-slate-400 uppercase border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Title / Merchant</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Account / Card</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredData.slice(0, 15).map((t) => (
                      <tr key={t.id} className="hover:bg-slate-900/40">
                        <td className="p-2.5 text-slate-400 whitespace-nowrap">{t.date}</td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            t.type === 'EXPENSE' ? 'bg-rose-500/20 text-rose-300' :
                            t.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="p-2.5 font-medium text-white line-clamp-1">{t.merchantName || t.categoryName}</td>
                        <td className="p-2.5 text-slate-400">{t.categoryName}</td>
                        <td className="p-2.5 text-slate-400">{t.accountName || t.creditCardName || '—'}</td>
                        <td className="p-2.5 text-right font-bold text-white whitespace-nowrap">
                          {formatINR(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/40 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>
              {selectedFormat === 'PRINT_HTML' ? 'Open Print Statement' : 'Download Export File'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
