import React, { useState, useRef, useEffect } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { useAuth } from '../../context/AuthContext';
import { FirebaseAuthModal } from '../common/FirebaseAuthModal';
import { ActivityAuditLogModal } from '../more/ActivityAuditLogModal';
import { Bell, Lock, ChevronLeft, ChevronRight, Calendar, Search, Sparkles, Trash2, CheckCircle2, ChevronDown, Cloud, CloudOff, User, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TopBarProps {
  currentTab: string;
  onOpenSearch: () => void;
  onOpenTrash: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const TopBar: React.FC<TopBarProps> = ({ currentTab, onOpenSearch, onOpenTrash }) => {
  const { activeMonth, setActiveMonth, settings, lockApp, subscriptions, loans, budgets, summary, trashCount } = useMoney();
  const { user, syncStatus, isFirebaseConnected } = useAuth();
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  // Month navigation helpers using pure integer arithmetic (safe from UTC/Timezone offset drift)
  const handlePrevMonth = () => {
    const [year, month] = activeMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setActiveMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = activeMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setActiveMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const formatMonthTitle = (monthStr: string) => {
    if (!monthStr || !monthStr.includes('-')) return monthStr;
    const [year, month] = monthStr.split('-').map(Number);
    const mName = MONTH_NAMES[month - 1] || 'Month';
    return `${mName} ${year}`;
  };

  // Close month picker on click outside
  useEffect(() => {
    if (!showMonthPicker) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setShowMonthPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMonthPicker]);

  const [activeYear, currentActiveMonthNum] = activeMonth.split('-').map(Number);
  const [pickerYear, setPickerYear] = useState<number>(activeYear || new Date().getFullYear());

  useEffect(() => {
    const [y] = activeMonth.split('-').map(Number);
    if (y) setPickerYear(y);
  }, [activeMonth]);

  // Build notifications & smart alerts
  const notifications: { id: string; title: string; desc: string; type: 'info' | 'warning' | 'success' }[] = [];

  // Low balance alert
  if (summary.availableBalance < settings.lowBalanceThreshold) {
    notifications.push({
      id: 'low_bal',
      title: 'Low Available Balance',
      desc: `Available funds are under ₹${settings.lowBalanceThreshold.toLocaleString('en-IN')}`,
      type: 'warning',
    });
  }

  // Subscriptions renewal alert
  subscriptions.filter(s => s.isActive).forEach(s => {
    notifications.push({
      id: s.id,
      title: `Upcoming: ${s.name}`,
      desc: `₹${s.amount.toLocaleString('en-IN')} renewal scheduled on ${s.nextBillingDate}`,
      type: 'info',
    });
  });

  // Loan EMI alerts
  loans.forEach(l => {
    notifications.push({
      id: l.id,
      title: `Loan EMI: ${l.name}`,
      desc: `₹${l.emiAmount.toLocaleString('en-IN')} due on ${l.nextPaymentDate}`,
      type: 'info',
    });
  });

  // Budget alert
  budgets.forEach(b => {
    // Check threshold
    notifications.push({
      id: b.id,
      title: `Active Budget: ${b.name}`,
      desc: `Limit ₹${b.amount.toLocaleString('en-IN')} monitored for ${activeMonth}`,
      type: 'info',
    });
  });

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Left: App Title and Sync Status */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 shrink-0">
            <span className="font-bold text-base sm:text-lg leading-none">₹</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Money Tracker
              </h1>
              <button
                onClick={() => setShowAuthModal(true)}
                className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 cursor-pointer transition-colors ${
                  user
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                }`}
                title="Firebase Cloud Sync Status"
              >
                <Cloud size={10} className={user ? 'text-emerald-500' : 'text-amber-500'} />
                <span>{user ? (syncStatus === 'syncing' ? 'Syncing...' : 'Cloud') : 'Local'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal hidden sm:block">
              {currentTab === 'home' && `Hi ${user?.displayName || settings.userName || 'Friend'} 👋`}
              {currentTab === 'insights' && 'Financial Analytics'}
              {currentTab === 'accounts' && 'Accounts & Cards'}
              {currentTab === 'more' && 'Settings & Tools'}
            </p>
          </div>
        </div>

        {/* Center: Month Switcher */}
        <div ref={monthPickerRef} className="relative shrink-0">
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 rounded-full px-1.5 py-1 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              className="flex items-center space-x-1 px-2 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-full"
            >
              <Calendar size={13} className="text-emerald-500 shrink-0" />
              <span className="min-w-[65px] text-center tracking-tight text-[11px] sm:text-xs">{formatMonthTitle(activeMonth)}</span>
              <ChevronDown size={12} className={`text-slate-400 transition-transform ${showMonthPicker ? 'rotate-180 text-emerald-500' : ''}`} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Month & Year Picker Dropdown Modal */}
          <AnimatePresence>
            {showMonthPicker && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white dark:bg-slate-850 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700/80 p-3.5 z-50 select-none backdrop-blur-xl"
              >
                {/* Year Header Stepper */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-750">
                  <button
                    type="button"
                    onClick={() => setPickerYear(prev => prev - 1)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                    {pickerYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPickerYear(prev => prev + 1)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* 12-Month Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTH_NAMES.map((mName, idx) => {
                    const mNum = idx + 1;
                    const mKey = `${pickerYear}-${String(mNum).padStart(2, '0')}`;
                    const isSelected = activeMonth === mKey;
                    const isCurrentRealMonth =
                      new Date().getFullYear() === pickerYear &&
                      new Date().getMonth() + 1 === mNum;

                    return (
                      <button
                        key={mName}
                        type="button"
                        onClick={() => {
                          setActiveMonth(mKey);
                          setShowMonthPicker(false);
                        }}
                        className={`py-2 px-1 rounded-2xl text-xs font-bold transition-all relative ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400 font-black'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {mName.substring(0, 3)}
                        {isCurrentRealMonth && !isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Jump to Current Month */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                      setPickerYear(now.getFullYear());
                      setActiveMonth(curKey);
                      setShowMonthPicker(false);
                    }}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                  >
                    <Sparkles size={12} />
                    <span>Current Month</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMonthPicker(false)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          {/* Audit & Activity Log History Button */}
          <button
            onClick={() => setShowActivityModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 transition-all shadow-2xs group cursor-pointer"
            title="View Audit & Change Logs"
          >
            <History size={15} className="text-blue-600 dark:text-blue-400 group-hover:rotate-[-20deg] transition-transform" />
            <span className="text-[11px] font-bold tracking-tight hidden md:inline">Change Logs</span>
          </button>

          <button
            onClick={onOpenSearch}
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Search & Filters"
          >
            <Search size={17} />
          </button>

          {trashCount > 0 && (
            <button
              onClick={onOpenTrash}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-colors relative"
              title="Trash Bin"
            >
              <Trash2 size={18} />
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {trashCount}
              </span>
            </button>
          )}

          {/* Notifications button */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative"
              title="Notifications"
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            <AnimatePresence>
              {showNotificationPanel && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      Financial Reminders
                    </span>
                    <span className="text-[10px] text-slate-400">On-Device</span>
                  </div>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No upcoming bill alerts</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600/50 text-left"
                        >
                          <div className="flex items-center space-x-1.5">
                            {n.type === 'warning' ? (
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-teal-500" />
                            )}
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">{n.title}</p>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 pl-3.5 leading-tight">{n.desc}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {settings.isPinEnabled && (
            <button
              onClick={lockApp}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Lock Money Tracker"
            >
              <Lock size={18} />
            </button>
          )}

          {/* Google Account & Cloud Sync Avatar Button */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="p-1 rounded-full hover:ring-2 hover:ring-emerald-500/40 transition-all ml-1 cursor-pointer"
            title={user ? `Signed in as ${user.displayName || user.email}` : 'Sign in with Google / Firebase Sync'}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-7 h-7 rounded-full border border-emerald-500 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : user ? (
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700">
                <Cloud size={14} className="text-amber-500" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Firebase Cloud Sync & Auth Modal */}
      <FirebaseAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Activity & Audit Log Modal */}
      <ActivityAuditLogModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
      />
    </header>
  );
};
