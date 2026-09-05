import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  Check,
  Search,
  X,
} from 'lucide-react';
import { Category3DIcon } from './Category3DIcon';
import { Bank3DIcon } from './Bank3DIcon';
import { PaymentApp3DIcon } from './PaymentApp3DIcon';
import { CARD_THEMES } from '../../lib/constants';
import { EMVChip, NetworkLogo } from './CardVisual';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  sublabel?: string;
  group?: string;
  icon?: React.ReactNode;
  iconName?: string;
  iconColor?: string;
  categoryName?: string;
  rightText?: string;
  rightTextColor?: string;
  badge?: string;
  disabled?: boolean;
  isCreditCard?: boolean;
  cardTheme?: string;
  network?: string;
  isBankAccount?: boolean;
  bankTheme?: string;
  isPaymentApp?: boolean;
  paymentAppName?: string;
}

export interface CustomSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  label?: string;
  title?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'pill' | 'minimal';
  id?: string;
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  label,
  title,
  className = '',
  triggerClassName = '',
  disabled = false,
  searchable,
  searchPlaceholder = 'Search...',
  size = 'md',
  variant = 'default',
  id,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  useScrollLock(isOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(() => {
    return options.find(o => o.value === value);
  }, [options, value]);

  // Determine if search should be enabled (auto-enable if >= 6 options)
  const isSearchEnabled = searchable !== undefined ? searchable : options.length >= 6;

  // Filter options
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter(opt => {
      const matchLabel = opt.label.toLowerCase().includes(query);
      const matchSub = opt.sublabel?.toLowerCase().includes(query);
      const matchGroup = opt.group?.toLowerCase().includes(query);
      const matchRight = opt.rightText?.toLowerCase().includes(query);
      return matchLabel || matchSub || matchGroup || matchRight;
    });
  }, [options, searchQuery]);

  // Group options if groups exist
  const groupedOptions = useMemo(() => {
    const hasGroups = filteredOptions.some(o => o.group);
    if (!hasGroups) return null;

    const groups: { [key: string]: SelectOption<T>[] } = {};
    filteredOptions.forEach(opt => {
      const groupName = opt.group || 'Other';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(opt);
    });
    return groups;
  }, [filteredOptions]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && isSearchEnabled) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, isSearchEnabled]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  // Helper to render option icon
  const renderOptionIcon = (opt: SelectOption<T>) => {
    if (opt.icon) {
      return <div className="shrink-0">{opt.icon}</div>;
    }
    if (opt.iconName) {
      return (
        <div className="shrink-0">
          <Category3DIcon
            name={opt.iconName}
            categoryName={opt.categoryName || opt.label}
            color={opt.iconColor || '#10b981'}
            size={size === 'sm' ? 'xs' : 'sm'}
            glow={false}
          />
        </div>
      );
    }
    if (opt.iconColor) {
      return (
        <div
          className="w-4 h-4 rounded-full shrink-0 shadow-xs"
          style={{ backgroundColor: opt.iconColor }}
        />
      );
    }
    return null;
  };

  // Size styling for trigger
  const triggerSizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-full min-h-[34px]',
    md: 'px-3.5 py-2.5 text-xs sm:text-sm rounded-2xl min-h-[44px]',
    lg: 'px-4 py-3 text-sm sm:text-base rounded-2xl min-h-[50px]',
  }[size];

  // Variant styling
  const triggerVariantClasses = {
    default:
      'bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white shadow-xs hover:border-emerald-500/50 dark:hover:border-emerald-500/50',
    pill:
      'bg-slate-100 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200/60 dark:hover:bg-slate-800',
    minimal:
      'bg-transparent border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-none px-1 py-2',
  }[variant];

  return (
    <div className={`relative ${className}`} id={id}>
      {label && (
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-left transition-all outline-none focus:ring-2 focus:ring-emerald-500/40 ${triggerSizeClasses} ${triggerVariantClasses} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${triggerClassName}`}
      >
        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
          {selectedOption && renderOptionIcon(selectedOption)}
          <div className="min-w-0 truncate">
            {selectedOption ? (
              <div className="flex items-center space-x-1.5 truncate">
                <span className="font-semibold text-slate-900 dark:text-white truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.sublabel && size !== 'sm' && (
                  <span className="text-[11px] text-slate-400 font-normal truncate hidden xs:inline">
                    • {selectedOption.sublabel}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 font-medium truncate">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {selectedOption?.rightText && (
            <span
              className={`text-xs font-bold ${
                selectedOption.rightTextColor || 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {selectedOption.rightText}
            </span>
          )}
          <ChevronDown
            size={size === 'sm' ? 14 : 16}
            className={`text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-emerald-500' : ''
            }`}
          />
        </div>
      </button>

      {/* Modal / Bottom Sheet Popover */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            />

            {/* Content Drawer / Card */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[85vh] sm:max-h-[75vh] overflow-hidden"
            >
              {/* Top Handle for mobile drag vibe */}
              <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" />

              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {title || label || placeholder || 'Select Option'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {options.length} {options.length === 1 ? 'option' : 'options'} available
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Bar (if enabled) */}
              {isSearchEnabled && (
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Options List */}
              <div className="p-3 sm:p-4 overflow-y-auto space-y-1.5 flex-1 divide-y divide-slate-100/50 dark:divide-slate-800/50">
                {filteredOptions.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-sm font-medium">No matches found</p>
                    <p className="text-xs text-slate-500 mt-1">Try another search query</p>
                  </div>
                ) : groupedOptions ? (
                  (Object.entries(groupedOptions) as [string, SelectOption<T>[]][]).map(([groupName, groupOpts], gIdx) => (
                    <div key={`grp_${groupName}_${gIdx}`} className="pt-2 first:pt-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 mb-1">
                        {groupName}
                      </div>
                      <div className="space-y-1">
                        {groupOpts.map((opt, idx) => (
                          <OptionItem<T>
                            key={`grp_opt_${String(opt.value)}_${opt.label}_${idx}`}
                            option={opt}
                            isSelected={opt.value === value}
                            onSelect={() => handleSelect(opt.value)}
                            renderIcon={() => renderOptionIcon(opt)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  filteredOptions.map((opt, idx) => (
                    <OptionItem<T>
                      key={`opt_${String(opt.value)}_${opt.label}_${idx}`}
                      option={opt}
                      isSelected={opt.value === value}
                      onSelect={() => handleSelect(opt.value)}
                      renderIcon={() => renderOptionIcon(opt)}
                    />
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface OptionItemProps<T> {
  key?: React.Key;
  option: SelectOption<T>;
  isSelected: boolean;
  onSelect: () => void;
  renderIcon: () => React.ReactNode;
}

function OptionItem<T>({ option, isSelected, onSelect, renderIcon }: OptionItemProps<T>) {
  if (option.isBankAccount) {
    return (
      <button
        type="button"
        disabled={option.disabled}
        onClick={onSelect}
        className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all group bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-teal-950/60 text-white shadow-md border ${
          isSelected ? 'border-emerald-400 ring-2 ring-emerald-400/50 scale-[1.01]' : 'border-emerald-500/30'
        } ${option.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-500/60 hover:shadow-lg'}`}
      >
        <div className="flex items-center space-x-3 min-w-0 pr-3">
          <Bank3DIcon institution={option.bankTheme || 'OTHER'} size="md" />
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-bold text-white truncate drop-shadow-xs">
                {option.label}
              </span>
              {option.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shrink-0">
                  {option.badge}
                </span>
              )}
            </div>
            {option.sublabel && (
              <p className="text-[11px] text-emerald-200/80 truncate mt-0.5 font-medium">
                {option.sublabel}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {option.rightText && (
            <div className="text-right">
              <span className="text-xs sm:text-sm font-black text-emerald-300 block drop-shadow-xs">
                {option.rightText}
              </span>
            </div>
          )}
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-emerald-500 text-white shadow-xs scale-105 ring-2 ring-white/40'
                : 'border border-emerald-500/40 bg-black/20 opacity-60 group-hover:opacity-100'
            }`}
          >
            {isSelected && <Check size={12} strokeWidth={3} />}
          </div>
        </div>
      </button>
    );
  }


  if (option.isPaymentApp) {
    return (
      <button
        type="button"
        disabled={option.disabled}
        onClick={onSelect}
        className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all group bg-white dark:bg-slate-800 shadow-sm border ${
          isSelected ? 'border-emerald-400 ring-2 ring-emerald-400/50 scale-[1.01]' : 'border-slate-200 dark:border-slate-700'
        } ${option.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500/60 hover:shadow-md'}`}
      >
        <div className="flex items-center space-x-3 min-w-0 pr-3">
          <PaymentApp3DIcon appName={option.paymentAppName || option.label} size="md" glow={isSelected} />
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className={`text-xs sm:text-sm truncate ${isSelected ? 'font-bold text-emerald-900 dark:text-emerald-200' : 'font-bold text-slate-800 dark:text-slate-100'}`}>
                {option.label}
              </span>
              {option.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                  {option.badge}
                </span>
              )}
            </div>
            {option.sublabel && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                {option.sublabel}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          {option.rightText && (
            <div className="text-right">
              <span className={`text-xs sm:text-sm font-bold block ${isSelected ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                {option.rightText}
              </span>
            </div>
          )}
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-emerald-500 text-white shadow-xs scale-105 ring-2 ring-emerald-400/50'
                : 'border border-slate-300 dark:border-slate-600 opacity-40 group-hover:opacity-100'
            }`}
          >
            {isSelected && <Check size={12} strokeWidth={3} />}
          </div>
        </div>
      </button>
    );
  }

  if (option.isCreditCard || option.cardTheme) {
    const theme = CARD_THEMES.find(t => t.id === option.cardTheme) || CARD_THEMES[0];
    return (
      <button
        type="button"
        disabled={option.disabled}
        onClick={onSelect}
        className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all group bg-gradient-to-br ${theme.gradient} text-white shadow-md border ${
          isSelected ? 'border-emerald-400 ring-2 ring-emerald-400/50 scale-[1.01]' : (theme.border || 'border-white/20')
        } ${option.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
      >
        <div className="flex items-center space-x-3 min-w-0 pr-3">
          <EMVChip size="sm" />
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-bold text-white truncate drop-shadow-xs">
                {option.label}
              </span>
              {option.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white shrink-0">
                  {option.badge}
                </span>
              )}
            </div>
            {option.sublabel && (
              <p className="text-[11px] text-slate-200 truncate mt-0.5 font-medium">
                {option.sublabel}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <NetworkLogo network={option.network || 'VISA'} className="h-4" />
          {option.rightText && (
            <div className="text-right hidden xs:block">
              <span className="text-xs font-bold text-emerald-300 block">
                {option.rightText}
              </span>
            </div>
          )}
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-emerald-500 text-white shadow-xs scale-105 ring-2 ring-white/40'
                : 'border border-white/40 bg-black/20 opacity-60 group-hover:opacity-100'
            }`}
          >
            {isSelected && <Check size={12} strokeWidth={3} />}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={option.disabled}
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all group ${
        isSelected
          ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-950 dark:text-emerald-200 shadow-xs'
          : 'hover:bg-slate-100/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-transparent'
      } ${option.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center space-x-3 min-w-0 pr-3">
        {renderIcon()}

        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs sm:text-sm truncate ${
                isSelected
                  ? 'font-bold text-emerald-900 dark:text-emerald-200'
                  : 'font-semibold text-slate-800 dark:text-slate-100'
              }`}
            >
              {option.label}
            </span>
            {option.badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                {option.badge}
              </span>
            )}
          </div>
          {option.sublabel && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
              {option.sublabel}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 shrink-0">
        {option.rightText && (
          <div className="text-right">
            <span
              className={`text-xs sm:text-sm font-bold block ${
                option.rightTextColor ||
                (isSelected
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-900 dark:text-white')
              }`}
            >
              {option.rightText}
            </span>
          </div>
        )}

        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-emerald-500 text-white shadow-xs scale-105'
              : 'border border-slate-300 dark:border-slate-600 opacity-40 group-hover:opacity-80'
          }`}
        >
          {isSelected && <Check size={12} strokeWidth={3} />}
        </div>
      </div>
    </button>
  );
}
