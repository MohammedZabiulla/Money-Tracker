import React from 'react';
import { Home, ReceiptText, Plus, Wallet, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, onOpenAdd }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'add_fab', label: 'Add', icon: Plus, isFab: true },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800 pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {tabs.map(tab => {
          if (tab.isFab) {
            return (
              <button
                key={tab.id}
                onClick={onOpenAdd}
                className="relative -top-4 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center transition-transform"
                title="Add Transaction"
              >
                <Plus size={28} strokeWidth={2.5} />
              </button>
            );
          }

          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-16 py-1 relative transition-colors ${
                isActive ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activePill"
                  className="absolute -top-1 w-8 h-1 bg-emerald-600 dark:bg-emerald-400 rounded-full"
                />
              )}
              <Icon size={20} />
              <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight truncate max-w-[60px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
