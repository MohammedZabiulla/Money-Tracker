import React, { ErrorInfo, ReactNode } from 'react';
import { saveErrorLog } from '../../utils/errorLogger';
import { RotateCcw, Bug, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class UniversalErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    (this as any).setState({ errorInfo });
    saveErrorLog({
      message: error.message,
      stack: error.stack || errorInfo.componentStack,
      type: 'react',
    });
  }

  private handleCopyReport = () => {
    const currentState = (this as any).state as State;
    const report = {
      message: currentState.error?.message,
      stack: currentState.error?.stack,
      componentStack: currentState.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    (this as any).setState({ copied: true });
    setTimeout(() => (this as any).setState({ copied: false }), 2000);
  };

  public render() {
    const currentState = (this as any).state as State;
    if (currentState.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 text-white shadow-2xl space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Bug size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold">Application Error Encountered</h1>
                <p className="text-xs text-slate-400">Captured by Universal Error Log Capturer</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-xs font-mono overflow-auto max-h-48 text-rose-300 space-y-2">
              <p className="font-bold">{currentState.error?.message || 'Unknown render error'}</p>
              {currentState.error?.stack && (
                <pre className="text-[10px] text-slate-400 whitespace-pre-wrap">{currentState.error.stack}</pre>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors"
              >
                <RotateCcw size={15} />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleCopyReport}
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-2 transition-colors border border-slate-700"
              >
                {currentState.copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                <span>{currentState.copied ? 'Copied Report!' : 'Copy Dev Report'}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
