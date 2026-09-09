export interface ErrorLogItem {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  type: 'runtime' | 'promise' | 'react' | 'custom';
  url: string;
  userAgent: string;
}

const ERROR_STORAGE_KEY = 'mt_error_logs';
const MAX_LOGS = 50;

export const getStoredErrorLogs = (): ErrorLogItem[] => {
  try {
    const raw = localStorage.getItem(ERROR_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

export const saveErrorLog = (item: Omit<ErrorLogItem, 'id' | 'timestamp' | 'url' | 'userAgent'>) => {
  try {
    const logs = getStoredErrorLogs();
    const newItem: ErrorLogItem = {
      ...item,
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    const updated = [newItem, ...logs].slice(0, MAX_LOGS);
    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(updated));
    console.error('[UniversalErrorCapturer]', newItem);
  } catch (e) {
    console.error('Failed to save error log:', e);
  }
};

export const clearStoredErrorLogs = () => {
  try {
    localStorage.removeItem(ERROR_STORAGE_KEY);
  } catch (e) {}
};

export const initUniversalErrorCapturer = () => {
  if (typeof window === 'undefined') return;

  window.onerror = (message, source, lineno, colno, error) => {
    saveErrorLog({
      message: typeof message === 'string' ? message : error?.message || 'Unknown runtime error',
      stack: error?.stack || (source ? `at ${source}:${lineno}:${colno}` : undefined),
      filename: source || undefined,
      lineno: lineno || undefined,
      colno: colno || undefined,
      type: 'runtime',
    });
  };

  window.onunhandledrejection = (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason) || 'Unhandled Promise Rejection';
    
    // Suppress benign internal Firebase Auth SDK artifacts when popups are cancelled or blocked on mobile
    if (
      msg.includes('INTERNAL ASSERTION FAILED: Pending promise was never set') ||
      msg.includes('auth/popup-closed-by-user') ||
      msg.includes('auth/cancelled-popup-request')
    ) {
      console.warn('[UniversalErrorCapturer] Suppressed benign Firebase Auth popup rejection:', msg);
      return;
    }

    saveErrorLog({
      message: msg,
      stack: reason?.stack || undefined,
      type: 'promise',
    });
  };
};
