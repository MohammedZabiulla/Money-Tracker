import React, { useRef } from 'react';
import { Home, ReceiptText, Wallet, LayoutGrid, Plus, FileText, PieChart, Repeat, Landmark, TrendingUp, Target, BookOpen, Download, BarChart3, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { useMoney } from '../../context/MoneyContext';
import { MiddleNavActionType } from '../../types';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onTriggerMiddleAction: () => void;
  onConfigureMiddleAction: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, onTriggerMiddleAction, onConfigureMiddleAction }) => {
  const { settings } = useMoney();
  const actionType = settings.middleNavAction || 'add_transaction';

  const getMiddleActionMeta = () => {
    switch (actionType) {
      case 'quick_note':
        return { label: 'Quick Note', icon: FileText, color: 'from-teal-500 to-emerald-600' };
      case 'budgets':
        return { label: 'Budgets', icon: PieChart, color: 'from-blue-500 to-indigo-600' };
      case 'subscriptions':
        return { label: 'Bills', icon: Repeat, color: 'from-indigo-500 to-purple-600' };
      case 'loans':
        return { label: 'Loans', icon: Landmark, color: 'from-amber-500 to-orange-600' };
      case 'investments':
        return { label: 'Investments', icon: TrendingUp, color: 'from-purple-500 to-pink-600' };
      case 'goals':
        return { label: 'Goals', icon: Target, color: 'from-rose-500 to-red-600' };
      case 'guide':
        return { label: 'Guide', icon: BookOpen, color: 'from-teal-600 to-cyan-600' };
      case 'import_export':
        return { label: 'Data Hub', icon: Download, color: 'from-slate-700 to-slate-900' };
      case 'analytics':
        return { label: 'Analytics', icon: BarChart3, color: 'from-cyan-500 to-blue-600' };
      case 'add_transaction':
      default:
        return { label: 'Add Txn', icon: Plus, color: 'from-emerald-500 to-teal-600' };
    }
  };

  const middleMeta = getMiddleActionMeta();
  const MiddleIcon = middleMeta.icon;

  const longPressTimerRef = useRef<any>(null);

  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      onConfigureMiddleAction();
    }, 650);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] pb-safe">
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-all duration-200 cursor-pointer active:scale-95 group select-none ${
            currentTab === 'home' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
          }`}
        >
          {currentTab === 'home' && (
            <motion.div layoutId="activePill" className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
          )}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${currentTab === 'home' ? 'scale-108 bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            <Home size={17} strokeWidth={currentTab === 'home' ? 2.5 : 2.1} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
        </button>

        {/* 2. Transactions */}
        <button
          type="button"
          onClick={() => onTabChange('transactions')}
          className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-all duration-200 cursor-pointer active:scale-95 group select-none ${
            currentTab === 'transactions' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
          }`}
        >
          {currentTab === 'transactions' && (
            <motion.div layoutId="activePill" className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
          )}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${currentTab === 'transactions' ? 'scale-108 bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            <ReceiptText size={17} strokeWidth={currentTab === 'transactions' ? 2.5 : 2.1} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Records</span>
        </button>

        {/* 3. Configurable Middle Button */}
        <div className="flex flex-col items-center justify-center flex-1 py-1 relative select-none">
          <button
            type="button"
            onClick={onTriggerMiddleAction}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onContextMenu={(e) => {
              e.preventDefault();
              onConfigureMiddleAction();
            }}
            className="relative -top-2.5 w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer active:scale-90 transition-all shadow-lg group border border-white/40 dark:border-slate-800/60"
            style={{
              background: `linear-gradient(135deg, ${actionType === 'add_transaction' ? '#10b981, #047857' : actionType === 'quick_note' ? '#0d9488, #0f766e' : '#2563eb, #1d4ed8'})`,
              boxShadow: '0 6px 20px -3px rgba(16, 185, 129, 0.5), inset 0 2px 2px rgba(255,255,255,0.4)',
            }}
            title={`${middleMeta.label} (Tap to run, Long-press or Right-click to configure)`}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
            <MiddleIcon size={22} className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" strokeWidth={2.5} />
            
            {/* Small config gear indicator badge */}
            <span
              onClick={(e) => {
                e.stopPropagation();
                onConfigureMiddleAction();
              }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] shadow border border-white dark:border-slate-800 cursor-pointer hover:scale-110 transition-transform"
              title="Configure action"
            >
              ⚙
            </span>
          </button>
          <span className="text-[9px] font-black tracking-tight text-slate-600 dark:text-slate-300 -mt-1 truncate max-w-[70px]">
            {middleMeta.label}
          </span>
        </div>

        {/* 4. Accounts */}
        <button
          type="button"
          onClick={() => onTabChange('accounts')}
          className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-all duration-200 cursor-pointer active:scale-95 group select-none ${
            currentTab === 'accounts' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
          }`}
        >
          {currentTab === 'accounts' && (
            <motion.div layoutId="activePill" className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
          )}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${currentTab === 'accounts' ? 'scale-108 bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            <Wallet size={17} strokeWidth={currentTab === 'accounts' ? 2.5 : 2.1} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Accounts</span>
        </button>

        {/* 5. More */}
        <button
          type="button"
          onClick={() => onTabChange('more')}
          className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-all duration-200 cursor-pointer active:scale-95 group select-none ${
            currentTab === 'more' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
          }`}
        >
          {currentTab === 'more' && (
            <motion.div layoutId="activePill" className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
          )}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${currentTab === 'more' ? 'scale-108 bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            <LayoutGrid size={17} strokeWidth={currentTab === 'more' ? 2.5 : 2.1} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
};

