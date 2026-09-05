import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  ChevronUp,
  ChevronDown,
  Check,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
  Sunset,
  Sunrise,
} from 'lucide-react';

export interface CustomTimePickerProps {
  value: string; // 'HH:mm' (24-hour format, e.g. '13:05' or '09:30')
  onChange: (timeStr: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
  align?: 'left' | 'right' | 'center';
}

const QUICK_PRESETS = [
  { label: 'Now', getVal: () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  }, icon: Sparkles },
  { label: '9:00 AM', value: '09:00:00', icon: Sunrise },
  { label: '1:00 PM', value: '13:00:00', icon: Sun },
  { label: '4:30 PM', value: '16:30:00', icon: Sunset },
  { label: '8:00 PM', value: '20:00:00', icon: Moon },
  { label: '10:30 PM', value: '22:30:00', icon: Moon },
];

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select time',
  className = '',
  disabled = false,
  size = 'md',
  id,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  useScrollLock(isOpen);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse 24-hr time into 12-hr parts (including seconds)
  const parsedTime = useMemo(() => {
    const defaultTime = '12:00:00';
    const effective = value && value.includes(':') ? value : defaultTime;
    const [hStr, mStr, sStr] = effective.split(':');
    const h24 = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    const s = sStr !== undefined && !isNaN(parseInt(sStr, 10)) ? parseInt(sStr, 10) : undefined;

    const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;

    const formatted24 = s !== undefined
      ? `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const formatted12 = s !== undefined
      ? `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${period}`
      : `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;

    return {
      h24,
      h12,
      m,
      s,
      period,
      formatted24,
      formatted12,
    };
  }, [value]);

  const [selectedHour, setSelectedHour] = useState<number>(parsedTime.h12);
  const [selectedMinute, setSelectedMinute] = useState<number>(parsedTime.m);
  const [selectedSecond, setSelectedSecond] = useState<number>(parsedTime.s ?? 0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(parsedTime.period);
  const [activeTab, setActiveTab] = useState<'HOURS' | 'MINUTES'>('HOURS');

  // Keep internal state in sync with external value
  useEffect(() => {
    setSelectedHour(parsedTime.h12);
    setSelectedMinute(parsedTime.m);
    setSelectedSecond(parsedTime.s ?? 0);
    setSelectedPeriod(parsedTime.period);
  }, [parsedTime, isOpen]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Convert 12-hr parts to 24-hr string and fire onChange
  const commitTime = (h12: number, min: number, sec: number, period: 'AM' | 'PM') => {
    let h24 = h12 % 12;
    if (period === 'PM') h24 += 12;
    const timeStr = `${String(h24).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    onChange(timeStr);
  };

  const handleHourSelect = (h: number) => {
    setSelectedHour(h);
    commitTime(h, selectedMinute, selectedSecond, selectedPeriod);
    setActiveTab('MINUTES');
  };

  const handleMinuteSelect = (m: number) => {
    setSelectedMinute(m);
    commitTime(selectedHour, m, selectedSecond, selectedPeriod);
  };

  const handlePeriodToggle = (p: 'AM' | 'PM') => {
    setSelectedPeriod(p);
    commitTime(selectedHour, selectedMinute, selectedSecond, p);
  };

  const handlePresetSelect = (val: string) => {
    onChange(val);
    const [hStr, mStr, sStr] = val.split(':');
    const h24 = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    const s = sStr !== undefined ? parseInt(sStr, 10) : 0;
    const p: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    setSelectedHour(h12);
    setSelectedMinute(m);
    setSelectedSecond(s);
    setSelectedPeriod(p);
    setIsOpen(false);
  };

  const stepMinute = (delta: number) => {
    let newM = selectedMinute + delta;
    let newH = selectedHour;
    let newP = selectedPeriod;

    if (newM >= 60) {
      newM = newM % 60;
      newH += 1;
      if (newH > 12) {
        newH = 1;
        newP = newP === 'AM' ? 'PM' : 'AM';
      }
    } else if (newM < 0) {
      newM = 60 + newM;
      newH -= 1;
      if (newH < 1) {
        newH = 12;
        newP = newP === 'AM' ? 'PM' : 'AM';
      }
    }

    setSelectedMinute(newM);
    setSelectedHour(newH);
    setSelectedPeriod(newP);
    commitTime(newH, newM, selectedSecond, newP);
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-xl',
    md: 'px-3 py-2 text-xs rounded-2xl',
    lg: 'px-4 py-2.5 text-sm rounded-2xl',
  };

  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {label && (
        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
          {label}
        </label>
      )}

      {/* Input Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border transition-all ${sizeClasses[size]} ${
          disabled
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
            : isOpen
            ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 dark:text-white shadow-sm'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex items-center space-x-2 truncate">
          <Clock size={size === 'sm' ? 13 : 15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold tracking-wide">
            {value ? parsedTime.formatted12 : placeholder}
          </span>
        </div>

        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {parsedTime.period}
        </span>
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`absolute z-50 mt-1.5 ${alignmentClasses[align]} w-72 sm:w-80 bg-white dark:bg-slate-850 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-700/80 p-3.5 select-none overflow-hidden backdrop-blur-xl`}
          >
            {/* Header: Big Digital Time Display & AM/PM Switcher */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/90 rounded-2xl p-2.5 border border-slate-100 dark:border-slate-750">
              <div className="flex items-center space-x-1.5">
                {/* Hours Box */}
                <button
                  type="button"
                  onClick={() => setActiveTab('HOURS')}
                  className={`px-2.5 py-1.5 rounded-xl font-mono text-xl font-black transition-all ${
                    activeTab === 'HOURS'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-100'
                  }`}
                >
                  {String(selectedHour).padStart(2, '0')}
                </button>

                <span className="text-xl font-black text-slate-400 dark:text-slate-500">:</span>

                {/* Minutes Box */}
                <button
                  type="button"
                  onClick={() => setActiveTab('MINUTES')}
                  className={`px-2.5 py-1.5 rounded-xl font-mono text-xl font-black transition-all ${
                    activeTab === 'MINUTES'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-100'
                  }`}
                >
                  {String(selectedMinute).padStart(2, '0')}
                </button>

                {parsedTime.s !== undefined && (
                  <>
                    <span className="text-xl font-black text-slate-400 dark:text-slate-500">:</span>
                    <div
                      className="px-2 py-1.5 rounded-xl font-mono text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center"
                      title="Seconds (captured live)"
                    >
                      {String(selectedSecond).padStart(2, '0')}s
                    </div>
                  </>
                )}
              </div>

              {/* AM / PM Segmented Control */}
              <div className="flex bg-slate-200/80 dark:bg-slate-700/80 p-1 rounded-xl">
                {(['AM', 'PM'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePeriodToggle(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                      selectedPeriod === p
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector Tabs (Hour vs Minute) */}
            <div className="flex items-center justify-between mt-3 mb-2 px-1">
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('HOURS')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    activeTab === 'HOURS'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Select Hour
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('MINUTES')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    activeTab === 'MINUTES'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Select Minute
                </button>
              </div>

              {/* Fine stepper for minutes */}
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => stepMinute(-5)}
                  className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  title="5 minutes earlier"
                >
                  -5m
                </button>
                <button
                  type="button"
                  onClick={() => stepMinute(5)}
                  className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  title="5 minutes later"
                >
                  +5m
                </button>
              </div>
            </div>

            {/* Grid of Hours or Minutes */}
            {activeTab === 'HOURS' ? (
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => {
                  const isSelected = selectedHour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleHourSelect(h)}
                      className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-750'
                      }`}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => {
                  const isSelected = selectedMinute === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMinuteSelect(m)}
                      className={`h-9 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-750'
                      }`}
                    >
                      :{String(m).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick Presets */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 px-1">
                Quick Presets
              </span>
              <div className="flex flex-wrap gap-1">
                {QUICK_PRESETS.map(preset => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        const val = preset.getVal ? preset.getVal() : preset.value || '12:00';
                        handlePresetSelect(val);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center space-x-1 transition-colors"
                    >
                      <Icon size={11} className="text-slate-400" />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Footer */}
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {parsedTime.formatted12}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1"
              >
                <Check size={13} />
                <span>Done</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
