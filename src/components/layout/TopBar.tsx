import React, { useState, useRef, useEffect } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Bell, Lock, ChevronLeft, ChevronRight, Calendar, Sparkles, ChevronDown, X, Edit2, Check, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TopBarProps {
  currentTab: string;
}

export const TopBar: React.FC<TopBarProps> = ({ currentTab }) => {
  const { activeMonth, settings, updateSettings, lockApp, subscriptions, loans, budgets, summary } = useMoney();
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Live Current Date & Time
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const shortDate = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  const formattedTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(settings.userName || 'Friend');

  useEffect(() => {
    setTempName(settings.userName || 'Friend');
  }, [settings.userName]);

  const handleSaveName = () => {
    if (tempName.trim()) {
      updateSettings({ userName: tempName.trim() });
    }
    setIsEditingName(false);
  };

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
    <header className="sticky top-0 z-[100] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Left: App Title and Sync Status */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 shrink-0">
            <span className="font-bold text-base sm:text-lg leading-none">₹</span>
          </div>
          <div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Money Tracker
                </h1>
                <span className="hidden md:inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  Mohammed Saqlain's Apps
                </span>
              </div>
              <span className="md:hidden text-[9px] text-slate-400 font-medium">
                by Mohammed Saqlain's Apps
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal flex items-center">
              {currentTab === 'home' && (
                <div className="flex items-center space-x-1">
                  <span>Hi</span>
                  {isEditingName ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={tempName}
                        onChange={e => setTempName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); }}
                        autoFocus
                        className="px-1.5 py-0.5 text-xs font-bold bg-white dark:bg-slate-800 border border-emerald-500 rounded text-slate-900 dark:text-white w-24 sm:w-28 focus:outline-hidden"
                      />
                      <button
                        onClick={handleSaveName}
                        className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold hover:bg-emerald-700"
                        title="Save name"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setTempName(settings.userName || 'Friend');
                        setIsEditingName(true);
                      }}
                      className="font-semibold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center space-x-1 group cursor-pointer"
                      title="Click to edit name"
                    >
                      <span>{settings.userName || 'Friend'} 👋</span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold underline opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                    </button>
                  )}
                </div>
              )}
              {currentTab === 'insights' && 'Financial Analytics'}
              {currentTab === 'accounts' && 'Accounts & Cards'}
              {currentTab === 'more' && 'Settings & Tools'}
            </div>
          </div>
        </div>

        {/* Center: Current Date & Time */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 bg-emerald-50/80 dark:bg-slate-800/80 border border-emerald-200/80 dark:border-slate-700/80 rounded-full text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs shrink-0">
          <Clock size={13} className="text-emerald-500 shrink-0 animate-pulse" />
          <span className="hidden sm:inline tracking-wide text-[11px] sm:text-xs font-bold font-sans">{formattedDate} • {formattedTime}</span>
          <span className="sm:hidden tracking-wide text-[10.5px] font-bold font-sans">{shortDate} • {formattedTime}</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
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
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                        Financial Reminders
                      </span>
                      <span className="text-[10px] text-slate-400">On-Device</span>
                    </div>
                    <button
                      onClick={() => setShowNotificationPanel(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Close notifications"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No upcoming bill alerts</p>
                    ) : (
                      notifications.map((n, idx) => (
                        <div
                          key={`notif_${n.id}_${idx}`}
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
        </div>
      </div>
    </header>
  );
};
