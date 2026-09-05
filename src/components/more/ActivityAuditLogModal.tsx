import { useScrollLock } from '../../hooks/useScrollLock';
import React, { useState, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { ActivityDomain, ActivityActionType } from '../../types';
import { formatActivityTimestamp } from '../../lib/activityLogger';
import { Emblem3D } from '../common/IconHelper';
import { CustomSelect } from '../common/CustomSelect';
import {
  History,
  Search,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';

interface ActivityAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOMAIN_CONFIG: Record<
  ActivityDomain,
  { label: string; icon: string; from: string; to: string; bg: string; text: string }
> = {
  TRANSACTION: { label: 'Transactions', icon: 'Coins', from: '#3b82f6', to: '#1d4ed8', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400' },
  SETTINGS: { label: 'Settings & Security', icon: 'Shield', from: '#8b5cf6', to: '#6d28d9', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400' },
  ACCOUNT: { label: 'Bank Accounts', icon: 'Landmark', from: '#0284c7', to: '#0369a1', bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-600 dark:text-sky-400' },
  CREDIT_CARD: { label: 'Credit Cards', icon: 'CreditCard', from: '#f43f5e', to: '#be123c', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400' },
  BUDGET: { label: 'Budgets', icon: 'Coins', from: '#f59e0b', to: '#b45309', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400' },
  SUBSCRIPTION: { label: 'Subscriptions', icon: 'Clock', from: '#ec4899', to: '#be185d', bg: 'bg-pink-50 dark:bg-pink-950/40', text: 'text-pink-600 dark:text-pink-400' },
  RECURRING: { label: 'Recurring Rules', icon: 'Repeat', from: '#6366f1', to: '#4338ca', bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400' },
  GOAL: { label: 'Savings Goals', icon: 'Target', from: '#10b981', to: '#047857', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' },
  LOAN: { label: 'Loans & EMI', icon: 'Landmark', from: '#d97706', to: '#92400e', bg: 'bg-yellow-50 dark:bg-yellow-950/40', text: 'text-yellow-700 dark:text-yellow-400' },
  INVESTMENT: { label: 'Investments', icon: 'TrendingUp', from: '#059669', to: '#064e3b', bg: 'bg-green-50 dark:bg-green-950/40', text: 'text-green-600 dark:text-green-400' },
  DEBT: { label: 'Lent / Borrowed', icon: 'HandCoins', from: '#0d9488', to: '#115e59', bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-600 dark:text-teal-400' },
  RECONCILIATION: { label: 'Reconciliation', icon: 'CheckCircle2', from: '#0284c7', to: '#1e40af', bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-600 dark:text-cyan-400' },
  CATEGORY: { label: 'Categories', icon: 'Layers', from: '#a855f7', to: '#7e22ce', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
  PAYMENT_APP: { label: 'Payment Apps', icon: 'Smartphone', from: '#3b82f6', to: '#2563eb', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400' },
  TEMPLATE: { label: 'Templates', icon: 'Zap', from: '#10b981', to: '#059669', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' },
  SYSTEM: { label: 'System & Ledger', icon: 'Sliders', from: '#64748b', to: '#334155', bg: 'bg-slate-50 dark:bg-slate-800/40', text: 'text-slate-600 dark:text-slate-400' },
};

const ACTION_BADGES: Record<ActivityActionType, { label: string; bg: string; text: string }> = {
  CREATE: { label: 'Created', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300' },
  UPDATE: { label: 'Modified', bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300' },
  DELETE: { label: 'Moved to Trash', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300' },
  RESTORE: { label: 'Restored', bg: 'bg-indigo-100 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300' },
  PURGE: { label: 'Permanently Deleted', bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300' },
  CONVERT: { label: 'Converted Type', bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300' },
  ALLOCATE: { label: 'Allocated Funds', bg: 'bg-teal-100 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-300' },
  SETTLE: { label: 'Settled', bg: 'bg-green-100 dark:bg-green-950/60', text: 'text-green-700 dark:text-green-300' },
  RECONCILE: { label: 'Reconciled', bg: 'bg-sky-100 dark:bg-sky-950/60', text: 'text-sky-700 dark:text-sky-300' },
  IMPORT: { label: 'Imported', bg: 'bg-cyan-100 dark:bg-cyan-950/60', text: 'text-cyan-700 dark:text-cyan-300' },
  EXPORT: { label: 'Exported', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300' },
  RESET: { label: 'Reset System', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
};

export const ActivityAuditLogModal: React.FC<ActivityAuditLogModalProps> = ({ isOpen, onClose }) => {
  useScrollLock(isOpen);

  const { activityLogs, clearActivityLogs, exportActivityLogs } = useMoney();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter logs
  const filteredLogs = useMemo(() => {
    const logs = activityLogs || [];
    return logs.filter(log => {
      // Domain filter
      if (selectedDomain !== 'ALL' && log.domain !== selectedDomain) return false;

      // Action filter
      if (selectedAction !== 'ALL' && log.action !== selectedAction) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSummary = log.summary.toLowerCase().includes(q);
        const matchesEntity = log.entityName?.toLowerCase().includes(q);
        const matchesDetails = log.details?.some(
          d =>
            d.label.toLowerCase().includes(q) ||
            String(d.oldValue || '').toLowerCase().includes(q) ||
            String(d.newValue || '').toLowerCase().includes(q)
        );
        return matchesSummary || matchesEntity || matchesDetails;
      }

      return true;
    });
  }, [activityLogs, selectedDomain, selectedAction, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const logs = activityLogs || [];
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const todayLogs = logs.filter(l => l.timestamp >= oneDayAgo);
    const txCount = logs.filter(l => l.domain === 'TRANSACTION').length;
    const settingsCount = logs.filter(l => l.domain === 'SETTINGS').length;

    return {
      total: logs.length,
      today: todayLogs.length,
      transactions: txCount,
      settings: settingsCount,
    };
  }, [activityLogs]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedLogIds(new Set(filteredLogs.map(l => l.id)));
  };

  const collapseAll = () => {
    setExpandedLogIds(new Set());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <Emblem3D icon="History" from="#3b82f6" to="#1e40af" finish="crystal" shape="squircle" size="md" glow={true} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Audit & Activity Log
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {stats.total} Changes Logged
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Complete forensic history of every change in transactions, accounts, settings, & ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Export options */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => exportActivityLogs('csv')}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                title="Export audit logs to CSV spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                CSV
              </button>
              <button
                onClick={() => exportActivityLogs('json')}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                title="Export audit logs to JSON"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-600" />
                JSON
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overview Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:px-5 sm:py-3 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 shrink-0 text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Entries</span>
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">{stats.total}</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Last 24 Hours</span>
            <p className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">{stats.today}</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Transactions</span>
            <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.transactions}</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Settings & Security</span>
            <p className="text-sm sm:text-base font-black text-purple-600 dark:text-purple-400 mt-0.5">{stats.settings}</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 space-y-2.5 shrink-0 bg-slate-50/40 dark:bg-slate-900/30">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search changes by title, notes, or field values..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Domain filter */}
            <div className="w-[180px]">
              <CustomSelect
                value={selectedDomain}
                onChange={setSelectedDomain}
                options={[
                  { value: 'ALL', label: 'All Categories / Domains' },
                  { value: 'TRANSACTION', label: 'Transactions' },
                  { value: 'SETTINGS', label: 'Settings & Security' },
                  { value: 'ACCOUNT', label: 'Bank Accounts' },
                  { value: 'CREDIT_CARD', label: 'Credit Cards' },
                  { value: 'BUDGET', label: 'Budgets' },
                  { value: 'SUBSCRIPTION', label: 'Subscriptions' },
                  { value: 'RECURRING', label: 'Recurring Bills' },
                  { value: 'GOAL', label: 'Savings Goals' },
                  { value: 'LOAN', label: 'Loans & EMI' },
                  { value: 'INVESTMENT', label: 'Investments' },
                  { value: 'DEBT', label: 'Lent & Borrowed' },
                  { value: 'RECONCILIATION', label: 'Reconciliations' },
                  { value: 'TEMPLATE', label: 'Templates' },
                  { value: 'SYSTEM', label: 'System & Reset' },
                ]}
              />
            </div>

            {/* Action filter */}
            <div className="w-[180px]">
              <CustomSelect
                value={selectedAction}
                onChange={setSelectedAction}
                options={[
                  { value: 'ALL', label: 'All Actions' },
                  { value: 'CREATE', label: 'Created (New)' },
                  { value: 'UPDATE', label: 'Modified / Edited' },
                  { value: 'DELETE', label: 'Moved to Trash' },
                  { value: 'RESTORE', label: 'Restored' },
                  { value: 'PURGE', label: 'Permanently Deleted' },
                  { value: 'CONVERT', label: 'Converted Type' },
                  { value: 'ALLOCATE', label: 'Allocated Funds' },
                  { value: 'SETTLE', label: 'Settled Dues' },
                  { value: 'RECONCILE', label: 'Reconciled' },
                  { value: 'RESET', label: 'Reset / Ledger Purge' },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{filteredLogs.length}</strong> of{' '}
              {activityLogs?.length || 0} events
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={expandAll}
                className="hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                Expand all diffs
              </button>
              <span>·</span>
              <button
                onClick={collapseAll}
                className="hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                Collapse all
              </button>
            </div>
          </div>
        </div>

        {/* Main Log List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <History className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Activity Logs Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                {searchQuery || selectedDomain !== 'ALL' || selectedAction !== 'ALL'
                  ? 'No logged events match your filter criteria. Try clearing search filters.'
                  : 'Changes to transactions, accounts, settings, budgets, and cards will automatically appear here.'}
              </p>
            </div>
          ) : (
            filteredLogs.map((log, idx) => {
              const domainMeta = DOMAIN_CONFIG[log.domain] || DOMAIN_CONFIG.SYSTEM;
              const actionMeta = ACTION_BADGES[log.action] || {
                label: log.action,
                bg: 'bg-slate-100 dark:bg-slate-800',
                text: 'text-slate-700 dark:text-slate-300',
              };
              const isExpanded = expandedLogIds.has(log.id);
              const hasDiffs = (log.details && log.details.length > 0) || false;

              return (
                <div
                  key={`log_${log.id}_${idx}`}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  {/* Item Header */}
                  <div
                    onClick={() => hasDiffs && toggleExpand(log.id)}
                    className={`p-3 sm:p-3.5 flex items-start justify-between gap-3 ${
                      hasDiffs ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40' : ''
                    } transition-colors`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        <Emblem3D
                          icon={domainMeta.icon}
                          from={domainMeta.from}
                          to={domainMeta.to}
                          finish="crystal"
                          shape="squircle"
                          size="sm"
                          glow={false}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${domainMeta.bg} ${domainMeta.text}`}
                          >
                            {domainMeta.label}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${actionMeta.bg} ${actionMeta.text}`}
                          >
                            {actionMeta.label}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            {formatActivityTimestamp(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {log.summary}
                        </p>
                        {log.entityName && log.entityName !== log.summary && (
                          <span className="inline-block mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-md">
                            Subject: <span className="font-semibold text-slate-700 dark:text-slate-300">{log.entityName}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {hasDiffs && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                          <span>{log.details!.length} field{log.details!.length > 1 ? 's' : ''}</span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-blue-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Field Diffs Table */}
                  {isExpanded && log.details && log.details.length > 0 && (
                    <div className="px-3 pb-3 sm:px-4 sm:pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 text-xs">
                        <div className="grid grid-cols-12 bg-slate-100/70 dark:bg-slate-800/80 px-3 py-1.5 font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                          <div className="col-span-4">Attribute</div>
                          <div className="col-span-4">Previous Value</div>
                          <div className="col-span-4">New Value</div>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {log.details.map((diff, dIdx) => (
                            <div key={`${diff.field || 'diff'}-${dIdx}`} className="grid grid-cols-12 px-3 py-2 items-center gap-2 text-[11px] sm:text-xs">
                              <div className="col-span-4 font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {diff.label}
                              </div>
                              <div className="col-span-4 text-slate-500 dark:text-slate-400 font-mono truncate">
                                {diff.oldValue !== undefined && diff.oldValue !== null && diff.oldValue !== '' ? (
                                  <span className="line-through text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                                    {String(diff.oldValue)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">None</span>
                                )}
                              </div>
                              <div className="col-span-4 text-emerald-600 dark:text-emerald-400 font-mono font-medium truncate">
                                {diff.newValue !== undefined && diff.newValue !== null && diff.newValue !== '' ? (
                                  <span className="bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                                    {String(diff.newValue)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">None</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2">
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={(activityLogs || []).length === 0}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold flex items-center gap-1.5 disabled:opacity-40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Logs
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Purge all logs?</span>
                <button
                  onClick={() => {
                    clearActivityLogs();
                    setShowClearConfirm(false);
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors"
                >
                  Yes, Purge
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportActivityLogs('csv')}
              className="sm:hidden px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200"
            >
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
