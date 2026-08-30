import React from 'react';
import { Home, ReceiptText, Wallet, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors ${
                isActive ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activePill"
                  className="absolute -top-1 w-8 h-1 bg-emerald-600 dark:bg-emerald-400 rounded-full"
                />
              )}
              <Icon size={20} />
              <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight truncate max-w-[70px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
