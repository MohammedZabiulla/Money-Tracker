import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMoney } from '../../context/MoneyContext';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  LogIn,
  Database,
  ShieldCheck,
  Download,
  Upload,
  User,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FirebaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseAuthModal: React.FC<FirebaseAuthModalProps> = ({ isOpen, onClose }) => {
  const { user, loading, isFirebaseConnected, syncStatus, lastSynced, signIn, signOut, pushStateToCloud, pullStateFromCloud } = useAuth();
  const context = useMoney();
  const { loadBackupState } = context;
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const loggedUser = await signIn();
      if (loggedUser) {
        setActionMessage('Successfully signed in with Google!');
      } else {
        setActionMessage('Sign-in was cancelled.');
      }
    } catch (err: any) {
      setActionMessage(`Sign in failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      await signOut();
      setActionMessage('Signed out successfully.');
    } catch (err: any) {
      setActionMessage(`Sign out failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncToCloud = async () => {
    if (!user) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const stateToSync = {
        accounts: context.accounts,
        creditCards: context.creditCards,
        categories: context.categories,
        merchants: context.merchants,
        paymentApps: context.paymentApps,
        transactions: context.transactions,
        recurring: context.recurring,
        subscriptions: context.subscriptions,
        budgets: context.budgets,
        goals: context.goals,
        loans: context.loans,
        investments: context.investments,
        debts: context.debts,
        reconciliations: context.reconciliations,
        settings: context.settings,
      };
      await pushStateToCloud(stateToSync);
      setActionMessage('Financial data synced to Firestore successfully!');
    } catch (err: any) {
      setActionMessage(`Sync failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePullFromCloud = async () => {
    if (!user) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const cloudData = await pullStateFromCloud();
      if (cloudData) {
        loadBackupState(cloudData);
        setActionMessage('Data successfully loaded from Firestore cloud!');
      } else {
        setActionMessage('No remote cloud data found for this account.');
      }
    } catch (err: any) {
      setActionMessage(`Cloud restore failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl overflow-hidden relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Cloud size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Firebase Cloud & Sync
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cloud persistence & Google authentication
            </p>
          </div>
        </div>

        {/* Action feedback message */}
        {actionMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Connection & Auth Card */}
        {user ? (
          <div className="space-y-4">
            {/* User Profile Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-11 h-11 rounded-full border-2 border-emerald-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-sm">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <span>{user.displayName || 'Google User'}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                      Connected
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                disabled={isProcessing}
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Cloud Sync Status */}
            <div className={`p-3.5 rounded-2xl border space-y-2 ${
              isFirebaseConnected
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40'
                : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Database size={14} className={isFirebaseConnected ? 'text-emerald-500' : 'text-amber-500'} />
                  <span>Firestore Cloud Status</span>
                </span>
                <span className={`text-[11px] font-bold ${
                  syncStatus === 'syncing'
                    ? 'text-blue-500'
                    : isFirebaseConnected
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {syncStatus === 'syncing'
                    ? 'Syncing...'
                    : isFirebaseConnected
                    ? 'Connected & Synced'
                    : 'Offline Cache Mode'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {isFirebaseConnected
                  ? `Last synced: ${lastSynced ? new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}`
                  : 'Operating locally in offline mode. Changes will automatically sync once connected.'}
              </div>
            </div>

            {/* Sync Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleSyncToCloud}
                disabled={isProcessing}
                className="py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                <Upload size={14} />
                <span>Sync to Cloud</span>
              </button>

              <button
                onClick={handlePullFromCloud}
                disabled={isProcessing}
                className="py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50 border border-slate-200 dark:border-slate-700"
              >
                <Download size={14} />
                <span>Pull from Cloud</span>
              </button>
            </div>

            {/* Explicit Close Button */}
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Backup & Sync with Google
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Connect your Google account to automatically store your transactions, accounts, and budgets in Firestore cloud.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={handleSignIn}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center space-x-2 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md disabled:opacity-50"
                >
                  <LogIn size={15} />
                  <span>Sign in with Google</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs transition-colors"
                >
                  Close & Continue Offline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Database Info Pill */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center space-x-1">
            <Database size={12} />
            <span>asia-southeast1</span>
          </span>
          <span className="font-mono text-[10px]">coherent-planet-gq6d2</span>
        </div>
      </motion.div>
    </div>
  );
};
