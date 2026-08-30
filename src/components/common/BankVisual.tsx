import React from 'react';
import { Account, AccountType } from '../../types';
import { INDIAN_BANKS, getBankTheme } from '../../lib/constants';
import { formatINR } from '../../lib/currency';
import { Bank3DIcon } from './Bank3DIcon';
import {
  Edit2,
  Trash2,
  RotateCcw,
  ShieldCheck,
  Building2,
  Wallet,
  Banknote,
  ArrowRightLeft,
  Lock,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Receipt,
  History,
} from 'lucide-react';

interface BankVisualProps {
  account: Account;
  onEdit?: () => void;
  onDelete?: () => void;
  onReconcile?: () => void;
  onConvert?: () => void;
  onViewTransactions?: () => void;
  showActions?: boolean;
  isStackedPeekOnly?: boolean;
}

export const BankVisual: React.FC<BankVisualProps> = ({
  account,
  onEdit,
  onDelete,
  onReconcile,
  onConvert,
  onViewTransactions,
  showActions = true,
  isStackedPeekOnly = false,
}) => {
  const bankConfig = INDIAN_BANKS.find(
    b =>
      b.name.toLowerCase() === account.institution.toLowerCase() ||
      b.id === account.institution.toLowerCase()
  );
  const theme = getBankTheme(account.accountTheme || bankConfig?.themeId || account.institution);
  const brandColor = account.color || theme?.accentColor || bankConfig?.color || '#004c8f';
  const secondaryColor = bankConfig?.secondaryColor || '#0ea5e9';

  const isDeposit = account.type === 'FIXED_DEPOSIT' || account.type === 'RECURRING_DEPOSIT';
  const isCash = account.type === 'CASH';
  const isWallet = account.type === 'WALLET';
  const isBank = !isCash && !isWallet;

  const getTypeBadge = (type: AccountType) => {
    switch (type) {
      case 'SALARY':
        return {
          label: 'Salary Account',
          sub: 'Direct Payroll Linked',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800',
          indicatorColor: '#3b82f6',
        };
      case 'SAVINGS':
        return {
          label: 'Savings Account',
          sub: 'Liquid Interest Bearing',
          badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          indicatorColor: '#10b981',
        };
      case 'CURRENT':
        return {
          label: 'Current / Business',
          sub: 'Commercial Operations',
          badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800',
          indicatorColor: '#8b5cf6',
        };
      case 'FIXED_DEPOSIT':
        return {
          label: 'Fixed Term Deposit',
          sub: 'Guaranteed Yield Vault',
          badge: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          indicatorColor: '#f59e0b',
        };
      case 'RECURRING_DEPOSIT':
        return {
          label: 'Recurring Deposit (RD)',
          sub: 'Monthly Compounding',
          badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300 dark:border-teal-800',
          indicatorColor: '#14b8a6',
        };
      case 'WALLET':
        return {
          label: 'Digital Prepaid Wallet',
          sub: 'Instant UPI & Merchant Pay',
          badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
          indicatorColor: '#06b6d4',
        };
      case 'CASH':
        return {
          label: 'Physical Cash on Hand',
          sub: 'Liquid Cash Drawer',
          badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          indicatorColor: '#10b981',
        };
      default:
        return {
          label: type,
          sub: 'Banking Facility',
          badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
          indicatorColor: '#64748b',
        };
    }
  };

  const typeInfo = getTypeBadge(account.type);

  // --------------------------------------------------------------------------
  // PEEK-ONLY STACKED VIEW
  // --------------------------------------------------------------------------
  if (isStackedPeekOnly) {
    return (
      <div
        onClick={onViewTransactions}
        className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm p-3 flex items-center justify-between cursor-pointer hover:border-emerald-500/40"
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
            style={{ backgroundColor: brandColor }}
          >
            {isCash ? <Banknote size={16} /> : isWallet ? <Wallet size={16} /> : <Building2 size={16} />}
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate max-w-[170px] sm:max-w-[240px]">
              {account.name}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <span>{account.institution}</span>
              {account.accountNumberLast4 && (
                <>
                  <span>•</span>
                  <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">•••• {account.accountNumberLast4}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Balance</span>
          <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
            {formatINR(account.calculatedBalance)}
          </span>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // DIGITAL WALLET & CASH VIEW
  // --------------------------------------------------------------------------
  if (isWallet || isCash) {
    return (
      <div
        onClick={onViewTransactions}
        className={`relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group ${
          onViewTransactions ? 'cursor-pointer hover:border-emerald-500/40 dark:hover:border-emerald-500/40' : ''
        }`}
      >
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: brandColor }}
        />
        <div className="p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shadow-amber-500/10 transition-transform group-hover:scale-105"
                style={{ backgroundColor: brandColor }}
              >
                {isCash ? <Banknote size={24} /> : <Wallet size={24} />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                    {account.name}
                  </h4>
                  {!account.isActive && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 font-bold uppercase">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {account.institution}
                  </span>
                  <span>•</span>
                  <span>{typeInfo.sub}</span>
                </p>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-2xs ${typeInfo.badge}`}
            >
              {typeInfo.label}
            </span>
          </div>

          <div className="flex items-end justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                {isCash ? 'Liquid Cash in Hand' : 'Prepaid Wallet Balance'}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatINR(account.calculatedBalance)}
              </span>
            </div>

            {account.notes && (
              <span className="text-xs text-slate-500 dark:text-slate-400 italic max-w-xs truncate bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                "{account.notes}"
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        {showActions && (
          <div
            onClick={e => e.stopPropagation()}
            className="px-5 py-3 bg-slate-50/70 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2"
          >
            <div className="flex items-center space-x-2">
              {onViewTransactions && (
                <button
                  onClick={onViewTransactions}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-1.5 border border-emerald-200 dark:border-emerald-800 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  title="View transactions related to this wallet/account"
                >
                  <Receipt size={12} />
                  <span>Transactions</span>
                </button>
              )}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs transition-all active:scale-95"
                >
                  <Edit2 size={12} className="text-slate-500" />
                  <span>Edit</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center space-x-1.5 border border-rose-200/70 dark:border-rose-800/60 shadow-2xs transition-all active:scale-95"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              )}
            </div>

            {onReconcile && (
              <button
                onClick={onReconcile}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center space-x-1.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs transition-all active:scale-95"
              >
                <RotateCcw size={12} />
                <span>Adjust Balance</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // AUTHENTIC BANK ACCOUNT & TERM DEPOSIT PASSBOOK / VAULT VIEW
  // --------------------------------------------------------------------------
  return (
    <div
      onClick={onViewTransactions}
      className={`relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md hover:shadow-lg transition-all duration-200 group ${
        onViewTransactions ? 'cursor-pointer hover:border-emerald-500/50 dark:hover:border-emerald-500/50' : ''
      }`}
    >
      {/* Top Bank Identity Branding Band */}
      <div
        className="px-5 py-3 text-white flex items-center justify-between relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 70%, ${secondaryColor} 100%)`,
        }}
      >
        {/* Subtle Bank Watermark */}
        <div className="absolute right-4 -bottom-4 text-5xl font-black text-white/10 select-none pointer-events-none uppercase tracking-tighter">
          {bankConfig?.logoText || account.institution.substring(0, 10)}
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <Bank3DIcon
            name={account.icon}
            institution={account.institution}
            color={brandColor}
            size="md"
            glow={true}
            interactive={false}
            className="shrink-0 shadow-sm transition-transform group-hover:scale-105"
          />

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                {account.institution}
              </span>
              <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                <ShieldCheck size={11} className="text-emerald-300" />
                <span>{isDeposit ? 'Deposit Vault' : 'Verified Bank'}</span>
              </span>
            </div>
            <span className="text-[11px] text-white/80 font-medium block">
              {account.name}
            </span>
          </div>
        </div>

        <div className="relative z-10 text-right">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/70 block">
            Account Number
          </span>
          <span className="font-mono font-bold text-xs sm:text-sm text-white tracking-wider">
            {account.accountNumberLast4
              ? `A/C •••• ${account.accountNumberLast4}`
              : 'A/C •••• 9204'}
          </span>
        </div>
      </div>

      {/* Passbook / Statement Body */}
      <div className="p-5 space-y-4">
        {/* Account Details & Status Grid */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center space-x-2">
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-2xs ${typeInfo.badge}`}
            >
              {typeInfo.label}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {typeInfo.sub}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
            {isDeposit ? (
              <span className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-semibold">
                <Lock size={12} />
                <span>Term Asset</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 size={12} />
                <span>Liquid Funds</span>
              </span>
            )}
            <span>•</span>
            <span>Opening: {formatINR(account.openingBalance)}</span>
          </div>
        </div>

        {/* Balance Display Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              {isDeposit ? 'Total Term Deposit Value' : 'Available Account Balance'}
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatINR(account.calculatedBalance)}
              </span>
              <span className="text-xs font-bold text-slate-400">INR (₹)</span>
            </div>
          </div>

          {account.notes && (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 max-w-sm truncate">
              "{account.notes}"
            </p>
          )}
        </div>
      </div>

      {/* Action Footer Bar */}
      {showActions && (
        <div
          onClick={e => e.stopPropagation()}
          className="px-5 py-3 bg-slate-50/70 dark:bg-slate-850/70 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2"
        >
          <div className="flex items-center space-x-2">
            {onViewTransactions && (
              <button
                onClick={onViewTransactions}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-1.5 border border-emerald-200 dark:border-emerald-800 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="View passbook transactions related to this bank account"
              >
                <Receipt size={12} />
                <span>Transactions</span>
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs transition-all active:scale-95"
                title="Edit Account Details"
              >
                <Edit2 size={12} className="text-slate-500" />
                <span>Edit</span>
              </button>
            )}
            {onConvert && (
              <button
                onClick={onConvert}
                className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/60 text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-95 shadow-2xs"
                title="Convert this bank account into a credit card with limit & luxury theme"
              >
                <ArrowRightLeft size={12} className="text-purple-600 dark:text-purple-400" />
                <span>Convert to Card</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center space-x-1.5 border border-rose-200/70 dark:border-rose-800/60 shadow-2xs transition-all active:scale-95"
                title="Move Account to Trash"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            )}
          </div>

          {onReconcile && (
            <button
              onClick={onReconcile}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-1.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs transition-all active:scale-95"
            >
              <RotateCcw size={12} className="text-emerald-500" />
              <span>Passbook Reconcile</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
