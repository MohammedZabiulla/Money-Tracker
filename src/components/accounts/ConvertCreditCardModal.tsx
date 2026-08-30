import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CreditCard, AccountType } from '../../types';
import { useMoney } from '../../context/MoneyContext';
import { formatINR } from '../../lib/currency';
import { CardVisual } from '../common/CardVisual';
import { CustomSelect } from '../common/CustomSelect';
import {
  X,
  ArrowRightLeft,
  ShieldCheck,
  History,
  Building,
  Landmark,
  CreditCard as CreditCardIcon,
  Wallet,
  Coins,
} from 'lucide-react';

interface ConvertCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCard?: CreditCard | null;
}

export const ConvertCreditCardModal: React.FC<ConvertCreditCardModalProps> = ({
  isOpen,
  onClose,
  targetCard,
}) => {
  const { creditCards, transactions, convertCreditCardToAccount } = useMoney();

  const activeCards = useMemo(() => {
    return creditCards.filter(c => !c.isDeleted);
  }, [creditCards]);

  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [accountName, setAccountName] = useState('');
  const [institution, setInstitution] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('SAVINGS');
  const [openingBalance, setOpeningBalance] = useState<string>('0');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [notes, setNotes] = useState('');
  const [migrateTransactions, setMigrateTransactions] = useState(true);
  const [deleteOriginalCard, setDeleteOriginalCard] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCard = useMemo(() => {
    if (selectedCardId) {
      const found = activeCards.find(c => c.id === selectedCardId);
      if (found) return found;
    }
    if (targetCard) return targetCard;
    return activeCards[0] || null;
  }, [activeCards, selectedCardId, targetCard]);

  const lastProcessedCardIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const targetId = targetCard?.id || (activeCards.length > 0 ? activeCards[0].id : '');
      setSelectedCardId(targetId);
      lastProcessedCardIdRef.current = null;
    }
  }, [isOpen, targetCard, activeCards]);

  const populateFormForCard = (card: CreditCard) => {
    setAccountName(`${card.name} Bank Account`);
    setInstitution(card.issuer || 'Bank');
    setAccountType('SAVINGS');
    setOpeningBalance(Math.max(0, card.creditLimit - card.currentOutstanding).toString());
    setLastFourDigits(card.lastFourDigits || '1234');
    setNotes(card.notes || `Converted from credit card ${card.name}`);
  };

  useEffect(() => {
    if (activeCard && activeCard.id !== lastProcessedCardIdRef.current) {
      lastProcessedCardIdRef.current = activeCard.id;
      populateFormForCard(activeCard);
    }
  }, [activeCard]);

  const relatedTransactionsCount = useMemo(() => {
    if (!activeCard) return 0;
    return transactions.filter(
      t => !t.isDeleted && t.creditCardId === activeCard.id
    ).length;
  }, [transactions, activeCard]);

  if (!isOpen) return null;

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard) return;
    if (!accountName.trim()) return;

    setIsSubmitting(true);
    try {
      convertCreditCardToAccount({
        cardId: activeCard.id,
        accountName: accountName.trim(),
        institution: institution.trim() || activeCard.issuer,
        type: accountType,
        openingBalance: Number(openingBalance) || 0,
        lastFourDigits: lastFourDigits.trim() || activeCard.lastFourDigits || '1234',
        notes: notes.trim() || undefined,
        migrateTransactions,
        deleteOriginalCard,
      });
      onClose();
    } catch (err) {
      console.error('Failed to convert credit card to account:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardSelectOptions = activeCards.map(c => ({
    value: c.id,
    label: `${c.name} (${c.issuer}) • Limit: ${formatINR(c.creditLimit)}`,
    icon: 'CreditCard',
  }));

  const accountTypeOptions = [
    { value: 'SAVINGS', label: 'Savings Account', icon: 'Landmark' },
    { value: 'CURRENT', label: 'Current Account', icon: 'Building' },
    { value: 'SALARY', label: 'Salary Account', icon: 'Coins' },
    { value: 'WALLET', label: 'Digital Wallet', icon: 'Wallet' },
    { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit (FD)', icon: 'Landmark' },
    { value: 'CASH', label: 'Cash / Physical', icon: 'Wallet' },
    { value: 'OTHER', label: 'Other Account', icon: 'Building' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-blue-800/40 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center space-x-3 z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-blue-300 shadow-inner">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white tracking-tight">Convert Credit Card to Account</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-400/20 border border-blue-300/30 text-blue-200 text-[10px] font-extrabold uppercase tracking-wider">
                  Smart Conversion
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Convert your credit card into a Savings, Wallet, Current, or FD account with full transaction migration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-blue-200 hover:text-white transition-colors z-10"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConvert} className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Target Card Selection */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/70 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                <CreditCardIcon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                  Source Credit Card
                </p>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {activeCard ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">{activeCard.name}</span>
                      <span className="text-slate-500">({activeCard.issuer})</span>
                      {activeCard.lastFourDigits && (
                        <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          •••• {activeCard.lastFourDigits}
                        </span>
                      )}
                      <span className="text-slate-400">•</span>
                      <span className="text-purple-600 dark:text-purple-400 font-bold">
                        Limit: {formatINR(activeCard.creditLimit)}
                      </span>
                    </div>
                  ) : (
                    'No credit card selected'
                  )}
                </div>
              </div>
            </div>

            {activeCards.length > 1 && (
              <div className="sm:w-64">
                <CustomSelect
                  label=""
                  title="Switch Credit Card"
                  value={selectedCardId}
                  onChange={val => setSelectedCardId(val)}
                  options={cardSelectOptions}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Live Preview Card */}
          {activeCard && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Converting Card
              </label>
              <div className="max-w-md mx-auto scale-95">
                <CardVisual card={activeCard} showActions={false} />
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  New Account Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  placeholder="e.g. HDFC Savings, Main Wallet"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 border border-transparent dark:border-slate-700"
                />
              </div>

              <div>
                <CustomSelect
                  label="Account Type"
                  title="Select Account Type"
                  value={accountType}
                  onChange={val => setAccountType(val as AccountType)}
                  options={accountTypeOptions}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Institution / Bank Name
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={e => setInstitution(e.target.value)}
                  placeholder="e.g. HDFC Bank, SBI, Paytm"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 border border-transparent dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Opening Balance (₹)
                </label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={e => setOpeningBalance(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 border border-transparent dark:border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Last 4 Digits / Account Number
              </label>
              <input
                type="text"
                maxLength={8}
                value={lastFourDigits}
                onChange={e => setLastFourDigits(e.target.value.replace(/\D/g, ''))}
                placeholder="4589"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500 border border-transparent dark:border-slate-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Notes & Description
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Converted from credit card"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500 border border-transparent dark:border-slate-700"
              />
            </div>

            {/* Migration options */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={migrateTransactions}
                  onChange={e => setMigrateTransactions(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <History size={13} className="text-blue-600 dark:text-blue-400" />
                    <span>Migrate Transaction History ({relatedTransactionsCount} transactions)</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Automatically reassign past card transactions and bill payments to this new account ledger.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="checkbox"
                  checked={deleteOriginalCard}
                  onChange={e => setDeleteOriginalCard(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <ShieldCheck size={13} className="text-emerald-600" />
                    <span>Remove Original Credit Card Record</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    The credit card will be fully replaced by this new bank/wallet account.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !accountName.trim()}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all active:scale-98 flex items-center space-x-2 disabled:opacity-50"
            >
              <ArrowRightLeft size={16} />
              <span>{isSubmitting ? 'Converting...' : 'Convert to Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
