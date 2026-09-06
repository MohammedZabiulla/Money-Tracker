import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../../hooks/useScrollLock';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Sparkles,
  Clock,
  RotateCcw,
} from 'lucide-react';

export interface CustomDatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
  align?: 'left' | 'right' | 'center';
  helperText?: string;
  iconOnly?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  className = '',
  minDate,
  maxDate,
  disabled = false,
  clearable = false,
  size = 'md',
  id,
  align = 'left',
  helperText,
  iconOnly = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  useScrollLock(isOpen);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 330 });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateCoords = () => {
    if (containerRef.current && typeof window !== 'undefined') {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverWidth = Math.min(330, window.innerWidth - 24);
      
      let left = rect.left;
      if (align === 'right') {
        left = rect.right - popoverWidth;
      } else if (align === 'center') {
        left = rect.left + rect.width / 2 - popoverWidth / 2;
      }

      // Constrain right boundary
      if (left + popoverWidth > window.innerWidth - 12) {
        left = window.innerWidth - popoverWidth - 12;
      }
      // Constrain left boundary
      if (left < 12) {
        left = 12;
      }

      // Check vertical boundary
      let top = rect.bottom + 6;
      if (top + 390 > window.innerHeight && rect.top > 390) {
        top = Math.max(12, rect.top - 6 - 380);
      }

      setCoords({ top, left, width: popoverWidth });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
    }
  }, [isOpen, align]);

  // Parse initial date or default to today
  const todayStr = useMemo(() => {
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${day}`;
  }, []);

  const effectiveValue = value || '';

  // Internal view state for month and year navigation
  const [viewYear, setViewYear] = useState<number>(() => {
    if (value && value.includes('-')) {
      return parseInt(value.split('-')[0], 10) || new Date().getFullYear();
    }
    return new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (value && value.includes('-')) {
      return (parseInt(value.split('-')[1], 10) - 1) || new Date().getMonth();
    }
    return new Date().getMonth();
  });

  // Selector mode: 'calendar' | 'year' | 'month'
  const [selectorMode, setSelectorMode] = useState<'calendar' | 'month' | 'year'>('calendar');

  // Sync view when value changes or dialog opens
  useEffect(() => {
    if (value && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setViewYear(y);
          setViewMonth(m);
        }
      }
    }
  }, [value, isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSelectorMode('calendar');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Format display string
  const formattedDisplay = useMemo(() => {
    if (!value) return '';
    try {
      const parts = value.split('-');
      if (parts.length !== 3) return value;
      const yr = parseInt(parts[0], 10);
      const mo = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(yr, mo, day);
      if (isNaN(dateObj.getTime())) return value;

      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = MONTH_SHORT[mo] || '';
      
      // Check if Today, Tomorrow, Yesterday
      if (value === todayStr) {
        return `Today, ${day} ${monthName}`;
      }
      return `${dayName}, ${day} ${monthName} ${yr}`;
    } catch {
      return value;
    }
  }, [value, todayStr]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Quick preset dates
  const handleSetQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const result = `${yr}-${mo}-${day}`;
    onChange(result);
    setViewYear(yr);
    setViewMonth(d.getMonth());
    setIsOpen(false);
  };

  const handleSetFirstOfNextMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onChange(`${yr}-${mo}-${day}`);
    setIsOpen(false);
  };

  // Calculate calendar grid days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: {
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
      isWeekend: boolean;
    }[] = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayOfWeek = (firstDayIndex - 1 - i) % 7;
      days.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === effectiveValue,
        isDisabled: Boolean((minDate && dateStr < minDate) || (maxDate && dateStr > maxDate)),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dateObj = new Date(viewYear, viewMonth, dayNum);
      const dayOfWeek = dateObj.getDay();
      days.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === effectiveValue,
        isDisabled: Boolean((minDate && dateStr < minDate) || (maxDate && dateStr > maxDate)),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    // Next month padding days to complete 6-row or 5-row grid
    const totalCells = days.length <= 35 ? 35 : 42;
    const remainingCells = totalCells - days.length;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayOfWeek = (days.length) % 7;
      days.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === effectiveValue,
        isDisabled: Boolean((minDate && dateStr < minDate) || (maxDate && dateStr > maxDate)),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    return days;
  }, [viewYear, viewMonth, todayStr, effectiveValue, minDate, maxDate]);

  // Available years list
  const yearRange = useMemo(() => {
    const currentYr = new Date().getFullYear();
    const start = currentYr - 15;
    const end = currentYr + 15;
    const years: number[] = [];
    for (let y = start; y <= end; y++) {
      years.push(y);
    }
    return years;
  }, []);

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-xl',
    md: 'px-3 py-2 text-xs font-semibold rounded-2xl',
    lg: 'px-4 py-2.5 text-sm font-semibold rounded-2xl',
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} id={id}>
      {label && !iconOnly && (
        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5 flex items-center justify-between">
          <span>{label}</span>
          {value && clearable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="text-[10px] text-indigo-500 hover:text-indigo-600 hover:underline"
            >
              Clear
            </button>
          )}
        </label>
      )}

      {/* Trigger Button */}
      {iconOnly ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border cursor-pointer active:scale-95 ${
            isOpen
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
              : value
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
              : 'bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
          }`}
          title={formattedDisplay || placeholder}
          aria-label={placeholder}
        >
          <CalendarIcon size={15} />
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between transition-all border text-left group select-none ${
            sizeClasses[size]
          } ${
            isOpen
              ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : 'cursor-pointer'}`}
        >
        <div className="flex items-center space-x-2 min-w-0 truncate">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              value
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600'
            }`}
          >
            <CalendarIcon size={13} />
          </div>

          <span
            className={`truncate ${
              value
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-400 dark:text-slate-500 font-normal'
            }`}
          >
            {formattedDisplay || placeholder}
          </span>
        </div>

        <div className="flex items-center space-x-1 shrink-0 ml-1">
          {value && clearable && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </div>
      </button>
      )}

      {helperText && !iconOnly && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{helperText}</p>
      )}

      {/* Popover / Calendar Modal rendered via Portal to guarantee it never extends outside display area */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div
              className={`fixed inset-0 z-[100] ${
                isMobile
                  ? 'flex items-center justify-center p-3.5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150'
                  : 'pointer-events-none'
              }`}
            >
              <div
                className={`absolute inset-0 ${isMobile ? '' : 'pointer-events-auto'}`}
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                ref={popoverRef}
                initial={isMobile ? { opacity: 0, scale: 0.95, y: 8 } : { opacity: 0, y: 4, scale: 0.98 }}
                animate={isMobile ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
                exit={isMobile ? { opacity: 0, scale: 0.95, y: 8 } : { opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                style={
                  isMobile
                    ? undefined
                    : {
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                      }
                }
                className={`relative z-10 pointer-events-auto rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-700 shadow-2xl overflow-hidden p-3.5 ${
                  isMobile ? 'w-full max-w-[340px] max-h-[90vh] overflow-y-auto' : ''
                }`}
              >
            {/* Cute Header with Month/Year Toggles */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setSelectorMode(selectorMode === 'month' ? 'calendar' : 'month')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                    selectorMode === 'month'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-750 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                  }`}
                >
                  <span>{MONTH_NAMES[viewMonth]}</span>
                  <ChevronDown size={11} className={selectorMode === 'month' ? 'rotate-180' : ''} />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectorMode(selectorMode === 'year' ? 'calendar' : 'year')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                    selectorMode === 'year'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-750 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                  }`}
                >
                  <span>{viewYear}</span>
                  <ChevronDown size={11} className={selectorMode === 'year' ? 'rotate-180' : ''} />
                </button>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Quick Pills Carousel */}
            <div className="flex items-center space-x-1 pb-2.5 mb-2.5 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleSetQuickDate(0)}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all ${
                  value === todayStr
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                }`}
              >
                ✨ Today
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate(-1)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate(1)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate(7)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-all"
              >
                +1 Week
              </button>
              <button
                type="button"
                onClick={handleSetFirstOfNextMonth}
                className="px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-all"
              >
                1st Next Mo
              </button>
            </div>

            {/* View Mode: Month Picker */}
            {selectorMode === 'month' && (
              <div className="grid grid-cols-3 gap-2 py-2">
                {MONTH_NAMES.map((name, idx) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setViewMonth(idx);
                      setSelectorMode('calendar');
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                      viewMonth === idx
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            {/* View Mode: Year Picker */}
            {selectorMode === 'year' && (
              <div className="grid grid-cols-3 gap-2 py-2 max-h-56 overflow-y-auto pr-1">
                {yearRange.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => {
                      setViewYear(yr);
                      setSelectorMode('calendar');
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                      viewYear === yr
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            )}

            {/* View Mode: Regular Calendar */}
            {selectorMode === 'calendar' && (
              <div>
                {/* Day of week headers */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {DAYS_SHORT.map((d, i) => (
                    <span
                      key={d}
                      className={`text-[10px] font-bold uppercase tracking-wider py-1 ${
                        i === 0 || i === 6
                          ? 'text-rose-500/80 dark:text-rose-400/80'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((item, idx) => {
                    const isSelected = item.isSelected;
                    const isToday = item.isToday;

                    return (
                      <button
                        key={`${item.dateStr}-${idx}`}
                        type="button"
                        disabled={item.isDisabled}
                        onClick={() => {
                          onChange(item.dateStr);
                          setIsOpen(false);
                        }}
                        className={`h-8 rounded-xl text-xs font-bold relative flex items-center justify-center transition-all ${
                          item.isDisabled
                            ? 'opacity-25 cursor-not-allowed text-slate-400'
                            : isSelected
                            ? 'bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-md font-extrabold scale-105 z-10'
                            : !item.isCurrentMonth
                            ? 'text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                            : item.isWeekend
                            ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/30'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-indigo-50/80 dark:hover:bg-slate-750'
                        }`}
                      >
                        <span>{item.dayNumber}</span>
                        {isToday && !isSelected && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Bottom Bar */}
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onChange(todayStr);
                  setIsOpen(false);
                }}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <Clock size={12} />
                <span>Jump to Today</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )}
</div>
);
};
