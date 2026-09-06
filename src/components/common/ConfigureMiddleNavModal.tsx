import React from 'react';
import { useMoney } from '../../context/MoneyContext';
import { MiddleNavActionType } from '../../types';
import { X, Plus, FileText, PieChart, Repeat, Landmark, TrendingUp, Target, BookOpen, Download, BarChart3, Check } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

interface ConfigureMiddleNavModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigureMiddleNavModal: React.FC<ConfigureMiddleNavModalProps> = ({ isOpen, onClose }) => {
  useScrollLock(isOpen);
  const { settings, updateSettings } = useMoney();

  if (!isOpen) return null;

  const currentAction = settings.middleNavAction || 'add_transaction';

  const actions: { id: MiddleNavActionType; label: string; description: string; icon: any; color: string }[] = [
    {
      id: 'add_transaction',
      label: 'Add New Transaction',
      description: 'Quickly open the transaction recorder for income, expense or transfer.',
      icon: Plus,
      color: 'bg-emerald-600',
    },
    {
      id: 'quick_note',
      label: 'Mindful Notes & Quick List',
      description: 'Open your saved numbers, grocery lists, and quick mindful notes.',
      icon: FileText,
      color: 'bg-teal-600',
    },
    {
      id: 'budgets',
      label: 'Budget Management',
      description: 'Check active category budgets and spending limits.',
      icon: PieChart,
      color: 'bg-blue-600',
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions & Bills',
      description: 'View active recurring subscriptions and upcoming billing cycles.',
      icon: Repeat,
      color: 'bg-indigo-600',
    },
    {
      id: 'loans',
      label: 'Loan & Debt Manager',
      description: 'Track money lent, borrowed, and repayments.',
      icon: Landmark,
      color: 'bg-amber-600',
    },
    {
      id: 'investments',
      label: 'Investment Portfolio',
      description: 'Monitor stocks, crypto, mutual funds, gold, and real estate.',
      icon: TrendingUp,
      color: 'bg-purple-600',
    },
    {
      id: 'goals',
      label: 'Savings Goals',
      description: 'Track progress toward your financial milestones and targets.',
      icon: Target,
      color: 'bg-rose-600',
    },
    {
      id: 'guide',
      label: 'App Guide & Handbook',
      description: 'Read step-by-step documentation and feature walkthroughs.',
      icon: BookOpen,
      color: 'bg-teal-700',
    },
    {
      id: 'import_export',
      label: 'Data Migration & Import/Export',
      description: 'Backup, restore, and transfer financial data securely.',
      icon: Download,
      color: 'bg-slate-700',
    },
    {
      id: 'analytics',
      label: 'Financial Insights & Analytics',
      description: 'Deep dive into spending trends, cashflow, and net worth reports.',
      icon: BarChart3,
      color: 'bg-cyan-600',
    },
  ];

  const handleSelect = (id: MiddleNavActionType) => {
    updateSettings({ middleNavAction: id });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Configure Middle Navigation Action</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Choose what action or More section card the middle bar button performs.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 cursor-pointer transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
          {actions.map(act => {
            const Icon = act.icon;
            const isSelected = currentAction === act.id;
            return (
              <div
                key={act.id}
                onClick={() => handleSelect(act.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`w-10 h-10 rounded-xl ${act.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                    <Icon size={19} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      {act.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {act.description}
                    </p>
                  </div>
                </div>
                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 ml-2">
                    <Check size={14} strokeWidth={2.8} />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 group-hover:border-emerald-500 shrink-0 ml-2" />
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-400">
            Tip: You can also long-press the middle navigation button anytime to reopen this configuration menu.
          </p>
        </div>
      </div>
    </div>
  );
};
