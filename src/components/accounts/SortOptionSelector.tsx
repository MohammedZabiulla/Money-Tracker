import React, { useState, useRef, useEffect } from 'react';
import { AccountSortOption, CardSortOption } from '../../types';
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Sparkles,
  Layers,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ArrowDownAZ,
  ArrowUpAZ,
  Building,
  Calendar,
  Percent,
} from 'lucide-react';

interface AccountSortSelectorProps {
  currentSort: AccountSortOption;
  onSelectSort: (sort: AccountSortOption) => void;
  onOpenArrange: () => void;
}

export const AccountSortSelector: React.FC<AccountSortSelectorProps> = ({
  currentSort,
  onSelectSort,
  onOpenArrange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortLabels: Record<AccountSortOption, { label: string; icon: React.ReactNode }> = {
    CUSTOM: { label: 'Custom Arranged', icon: <Layers size={13} className="text-emerald-500" /> },
    BALANCE_DESC: { label: 'Balance (High to Low)', icon: <ArrowDownNarrowWide size={13} className="text-emerald-600" /> },
    BALANCE_ASC: { label: 'Balance (Low to High)', icon: <ArrowUpNarrowWide size={13} className="text-amber-500" /> },
    NAME_ASC: { label: 'Name (A to Z)', icon: <ArrowDownAZ size={13} className="text-blue-500" /> },
    NAME_DESC: { label: 'Name (Z to A)', icon: <ArrowUpAZ size={13} className="text-blue-500" /> },
    TYPE: { label: 'Account Type', icon: <Building size={13} className="text-purple-500" /> },
    INSTITUTION: { label: 'Bank Institution', icon: <Building size={13} className="text-indigo-500" /> },
    DATE_NEWEST: { label: 'Recently Added', icon: <Calendar size={13} className="text-slate-500" /> },
    DATE_OLDEST: { label: 'Oldest Added', icon: <Calendar size={13} className="text-slate-500" /> },
    RECENT: { label: 'Most Recently Used', icon: <Calendar size={13} className="text-slate-500" /> },
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
          title="Sort accounts"
        >
          {sortLabels[currentSort]?.icon || <ArrowUpDown size={13} />}
          <span className="max-w-[130px] truncate">{sortLabels[currentSort]?.label || 'Sort'}</span>
          <ChevronDown size={12} className="text-slate-400" />
        </button>

        <button
          type="button"
          onClick={onOpenArrange}
          className="px-2 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-1 border border-emerald-200 dark:border-emerald-800 transition-colors"
          title="Arrange Accounts & Reorder manually"
        >
          <Layers size={13} />
          <span>Arrange</span>
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-40 space-y-0.5 animate-in fade-in-50 zoom-in-95">
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Sort Accounts By
          </div>

          {(Object.keys(sortLabels) as AccountSortOption[]).map((optionKey) => {
            const isSelected = currentSort === optionKey;
            const opt = sortLabels[optionKey];

            return (
              <button
                key={optionKey}
                type="button"
                onClick={() => {
                  onSelectSort(optionKey);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  {opt.icon}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
              </button>
            );
          })}

          <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenArrange();
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold"
            >
              <Layers size={14} />
              <span>Custom Manual Drag & Drop...</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface CardSortSelectorProps {
  currentSort: CardSortOption;
  onSelectSort: (sort: CardSortOption) => void;
  onOpenArrange: () => void;
}

export const CardSortSelector: React.FC<CardSortSelectorProps> = ({
  currentSort,
  onSelectSort,
  onOpenArrange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cardSortLabels: Record<CardSortOption, { label: string; icon: React.ReactNode }> = {
    CUSTOM: { label: 'Custom Arranged', icon: <Layers size={13} className="text-purple-500" /> },
    OUTSTANDING_DESC: { label: 'Due Bill (High to Low)', icon: <ArrowDownNarrowWide size={13} className="text-rose-500" /> },
    OUTSTANDING_ASC: { label: 'Due Bill (Low to High)', icon: <ArrowUpNarrowWide size={13} className="text-emerald-500" /> },
    LIMIT_DESC: { label: 'Credit Limit (Highest)', icon: <ArrowDownNarrowWide size={13} className="text-purple-500" /> },
    LIMIT_ASC: { label: 'Credit Limit (Lowest)', icon: <ArrowUpNarrowWide size={13} className="text-purple-500" /> },
    NAME_ASC: { label: 'Card Name (A to Z)', icon: <ArrowDownAZ size={13} className="text-blue-500" /> },
    NAME_DESC: { label: 'Card Name (Z to A)', icon: <ArrowUpAZ size={13} className="text-blue-500" /> },
    ISSUER_ASC: { label: 'Bank / Issuer (A to Z)', icon: <Building size={13} className="text-indigo-500" /> },
    DUE_DATE: { label: 'Payment Due Day', icon: <Calendar size={13} className="text-amber-500" /> },
    DUE_DATE_ASC: { label: 'Payment Due Day (Earliest)', icon: <Calendar size={13} className="text-amber-500" /> },
    UTILIZATION_DESC: { label: 'Utilization % (Highest)', icon: <Percent size={13} className="text-rose-500" /> },
    RECENT: { label: 'Most Recently Used', icon: <Calendar size={13} className="text-slate-500" /> },
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
          title="Sort credit cards"
        >
          {cardSortLabels[currentSort]?.icon || <ArrowUpDown size={13} />}
          <span className="max-w-[130px] truncate">{cardSortLabels[currentSort]?.label || 'Sort'}</span>
          <ChevronDown size={12} className="text-slate-400" />
        </button>

        <button
          type="button"
          onClick={onOpenArrange}
          className="px-2 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center space-x-1 border border-purple-200 dark:border-purple-800 transition-colors"
          title="Arrange Cards & Reorder manually"
        >
          <Layers size={13} />
          <span>Arrange</span>
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-40 space-y-0.5 animate-in fade-in-50 zoom-in-95">
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Sort Credit Cards By
          </div>

          {(Object.keys(cardSortLabels) as CardSortOption[]).map((optionKey) => {
            const isSelected = currentSort === optionKey;
            const opt = cardSortLabels[optionKey];

            return (
              <button
                key={optionKey}
                type="button"
                onClick={() => {
                  onSelectSort(optionKey);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  {opt.icon}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check size={14} className="text-purple-600 dark:text-purple-400 shrink-0" />}
              </button>
            );
          })}

          <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenArrange();
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center space-x-2 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-bold"
            >
              <Layers size={14} />
              <span>Custom Manual Drag & Drop...</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
