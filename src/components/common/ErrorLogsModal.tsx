import React, { useState, useEffect } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { getStoredErrorLogs, clearStoredErrorLogs, ErrorLogItem } from '../../utils/errorLogger';
import { X, Bug, Trash2, Copy, Download, Check, ShieldAlert } from 'lucide-react';

interface ErrorLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ErrorLogsModal: React.FC<ErrorLogsModalProps> = ({ isOpen, onClose }) => {
  useScrollLock(isOpen);
  const [logs, setLogs] = useState<ErrorLogItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLogs(getStoredErrorLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    clearStoredErrorLogs();
    setLogs([]);
  };

  const handleCopyOne = (item: ErrorLogItem) => {
    navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `error_logs_${new Date().toISOString()}.json`);
    dlAnchorElem.click();
    dlAnchorElem.remove();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shrink-0">
              <Bug size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Universal Error Logs
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                  {logs.length} {logs.length === 1 ? 'error' : 'errors'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Captured app errors, stack traces, and line numbers for developer debugging
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Top Bar */}
        {logs.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs shrink-0">
            <div className="flex space-x-2">
              <button
                onClick={handleCopyAll}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-750 hover:bg-slate-50 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700"
              >
                {copiedAll ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copiedAll ? 'Copied All!' : 'Copy All Logs'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-750 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700"
              >
                <Download size={13} />
                <span>Export JSON</span>
              </button>
            </div>

            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-300 font-semibold flex items-center space-x-1 border border-rose-200 dark:border-rose-900/50"
            >
              <Trash2 size={13} />
              <span>Clear Logs</span>
            </button>
          </div>
        )}

        {/* Content list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {logs.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Check size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Errors Captured</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                The application is running smoothly! Any runtime, promise, or component render errors will automatically appear here.
              </p>
            </div>
          ) : (
            logs.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.type === 'react' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' :
                      item.type === 'promise' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                      'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyOne(item)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center space-x-1 border border-slate-200 dark:border-slate-600"
                    title="Copy Error Details"
                  >
                    {copiedId === item.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <p className="font-bold text-slate-900 dark:text-white break-all">
                  {item.message}
                </p>

                {(item.filename || item.lineno) && (
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                    File: {item.filename || 'unknown'} {item.lineno ? `(Line: ${item.lineno}${item.colno ? `, Col: ${item.colno}` : ''})` : ''}
                  </p>
                )}

                {item.stack && (
                  <div className="bg-slate-900/80 text-slate-300 p-2.5 rounded-xl font-mono text-[10px] max-h-32 overflow-auto whitespace-pre-wrap border border-slate-800">
                    {item.stack}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
