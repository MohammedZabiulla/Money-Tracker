import React, { useState, useEffect, useMemo } from 'react';
import { Account, CreditCard, CardNetwork, BankCardCatalogItem } from '../../types';
import { useMoney } from '../../context/MoneyContext';
import {
  CARD_NETWORKS,
  CARD_THEMES,
  INDIAN_BANKS,
  BANK_CREDIT_CARDS_CATALOG,
  getCardsForBank,
} from '../../lib/constants';
import { formatINR } from '../../lib/currency';
import { CardVisual } from '../common/CardVisual';
import { CustomSelect } from '../common/CustomSelect';
import {
  X,
  ArrowRightLeft,
  CreditCard as CreditCardIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Landmark,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  History,
} from 'lucide-react';

interface ConvertBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAccount?: Account | null;
}

export const ConvertBankModal: React.FC<ConvertBankModalProps> = ({
  isOpen,
  onClose,
  targetAccount,
}) => {
  const { accounts, transactions, convertAccountToCreditCard } = useMoney();

  // If no account passed, select first available bank account
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    targetAccount?.id || (accounts.length > 0 ? accounts[0].id : '')
  );

  const activeAccount = useMemo(() => {
    return accounts.find(a => a.id === selectedAccountId) || targetAccount || null;
  }, [accounts, selectedAccountId, targetAccount]);

  // Form State
  const [cardName, setCardName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [network, setNetwork] = useState<CardNetwork>('VISA');
  const [cardTheme, setCardTheme] = useState('midnight');
  const [cardVariant, setCardVariant] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [creditLimit, setCreditLimit] = useState<string>('150000');
  const [openingBalance, setOpeningBalance] = useState<string>('0');
  const [statementDate, setStatementDate] = useState<string>('15');
  const [dueDate, setDueDate] = useState<string>('5');
  const [notes, setNotes] = useState('');
  const [migrateTransactions, setMigrateTransactions] = useState(true);
  const [deleteOriginalAccount, setDeleteOriginalAccount] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or re-populate form when activeAccount changes
  useEffect(() => {
    if (activeAccount) {
      setSelectedAccountId(activeAccount.id);
      const bankName = activeAccount.institution || 'HDFC Bank';
      setIssuer(bankName);
      setLastFourDigits(activeAccount.accountNumberLast4 || '4589');
      
      // Look up bank card presets
      const matchingCards = getCardsForBank(bankName);
      if (matchingCards.length > 0) {
        const defaultCard = matchingCards[0];
        setCardName(defaultCard.name);
        setNetwork(defaultCard.network || 'VISA');
        setCardTheme(defaultCard.theme || 'midnight');
        setCardVariant(defaultCard.category || 'Premium');
        setCreditLimit(defaultCard.limit.toString());
        setStatementDate(defaultCard.statementDay.toString());
        setDueDate(defaultCard.dueDay.toString());
        setNotes(defaultCard.perks || `Converted from ${activeAccount.name}`);
      } else {
        setCardName(`${activeAccount.name} Credit Card`);
        setCardVariant('Platinum Rewards');
        setNotes(`Converted from ${activeAccount.name} (${activeAccount.institution})`);
      }
    }
  }, [activeAccount]);

  // Related transactions count
  const relatedTransactionsCount = useMemo(() => {
    if (!activeAccount) return 0;
    return transactions.filter(
      t => !t.isDeleted && (t.accountId === activeAccount.id || t.toAccountId === activeAccount.id)
    ).length;
  }, [transactions, activeAccount]);

  // Available cards for current bank
  const bankCardSuggestions = useMemo(() => {
    if (!activeAccount) return [];
    return getCardsForBank(issuer || activeAccount.institution).slice(0, 4);
  }, [activeAccount, issuer]);

  const applyPreset = (preset: BankCardCatalogItem) => {
    setCardName(preset.name);
    setIssuer(preset.issuer);
    setNetwork(preset.network);
    setCardTheme(preset.theme);
    setCardVariant(preset.category || preset.tier);
    setCreditLimit(preset.limit.toString());
    setStatementDate(preset.statementDay.toString());
    setDueDate(preset.dueDay.toString());
    if (preset.perks) {
      setNotes(preset.perks);
    }
  };

  // Live preview card object
  const previewCard: CreditCard = useMemo(() => {
    const numLimit = Number(creditLimit) || 100000;
    const numOutstanding = Number(openingBalance) || 0;
    return {
      id: 'preview_card',
      name: cardName.trim() || 'Credit Card Name',
      issuer: issuer.trim() || 'Bank Issuer',
      network: network || 'VISA',
      cardTheme: cardTheme || 'midnight',
      cardVariant: cardVariant || 'Super Premium',
      lastFourDigits: lastFourDigits || '4589',
      creditLimit: numLimit,
      openingBalance: numOutstanding,
      currentOutstanding: numOutstanding,
      statementDate: Number(statementDate) || 15,
      dueDate: Number(dueDate) || 5,
      icon: 'CreditCard',
      color: CARD_THEMES.find(t => t.id === cardTheme)?.accentColor || '#38bdf8',
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, [
    cardName,
    issuer,
    network,
    cardTheme,
    cardVariant,
    lastFourDigits,
    creditLimit,
    openingBalance,
    statementDate,
    dueDate,
  ]);

  if (!isOpen) return null;

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;
    if (!cardName.trim()) return;

    setIsSubmitting(true);
    try {
      convertAccountToCreditCard({
        accountId: activeAccount.id,
        cardName: cardName.trim(),
        issuer: issuer.trim() || activeAccount.institution,
        network,
        cardTheme,
        cardVariant: cardVariant.trim() || undefined,
        lastFourDigits: lastFourDigits.trim() || activeAccount.accountNumberLast4 || '1234',
        creditLimit: Number(creditLimit) || 100000,
        openingBalance: Number(openingBalance) || 0,
        statementDate: Math.min(31, Math.max(1, Number(statementDate) || 15)),
        dueDate: Math.min(31, Math.max(1, Number(dueDate) || 5)),
        notes: notes.trim() || undefined,
        migrateTransactions,
        deleteOriginalAccount,
      });

      onClose();
    } catch (err) {
      console.error('Failed to convert account:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountSelectOptions = accounts
    .filter(a => !a.isDeleted)
    .map(a => ({
      value: a.id,
      label: `${a.name} (${a.institution}) • ${formatINR(a.calculatedBalance)}`,
      icon: 'Landmark',
    }));

  const issuerOptions = INDIAN_BANKS.map(b => ({
    value: b.name,
    label: b.name,
    icon: 'Building',
  }));

  const networkOptions = CARD_NETWORKS.map(n => ({
    value: n.id,
    label: `${n.name} (${n.label})`,
    icon: 'CreditCard',
  }));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-purple-800/40 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center space-x-3 z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-purple-300 shadow-inner">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white tracking-tight">Convert Bank to Credit Card</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-400/20 border border-purple-300/30 text-purple-200 text-[10px] font-extrabold uppercase tracking-wider">
                  Smart Transition
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Transform your bank account into an active credit card with luxury visual themes & transaction migration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-purple-200 hover:text-white transition-colors z-10"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConvert} className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Target Bank Account Selection */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Landmark size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wide">
                  Source Bank Account
                </p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {activeAccount ? (
                    <>
                      <span className="font-bold">{activeAccount.name}</span> ({activeAccount.institution}) • Balance:{' '}
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatINR(activeAccount.calculatedBalance)}
                      </span>
                    </>
                  ) : (
                    'No bank account selected'
                  )}
                </p>
              </div>
            </div>

            {accounts.length > 1 && (
              <div className="sm:w-64">
                <CustomSelect
                  label=""
                  title="Switch Bank Account"
                  value={selectedAccountId}
                  onChange={val => setSelectedAccountId(val)}
                  options={accountSelectOptions}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Quick Bank Presets Bar */}
          {bankCardSuggestions.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Popular {issuer || activeAccount?.institution} Cards</span>
                </span>
                <span className="text-[11px] text-slate-400">1-click autofill card parameters</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {bankCardSuggestions.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative group overflow-hidden ${
                      cardName === preset.name
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-tight opacity-75">
                        {preset.network}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
                        {formatINR(preset.limit)}
                      </span>
                    </div>
                    <p className="text-xs font-bold truncate mt-1">{preset.name}</p>
                    <p className="text-[10px] opacity-75 truncate">{preset.tier || preset.category}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Card Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Zap size={13} className="text-purple-600 dark:text-purple-400" />
                <span>Live Card Preview</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                Theme: <span className="font-bold text-purple-600 dark:text-purple-400">{CARD_THEMES.find(t => t.id === cardTheme)?.name || 'Custom'}</span>
              </span>
            </label>
            <div className="max-w-md mx-auto">
              <CardVisual card={previewCard} showActions={false} />
            </div>
          </div>

          {/* Card Details Form Grid */}
          <div className="space-y-4 pt-1">
            {/* Card Name & Issuer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Card Name / Variant <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  placeholder="e.g. Regalia Gold, Amazon Pay, Millennia"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500 border border-transparent dark:border-slate-700"
                />
              </div>

              <div>
                <CustomSelect
                  label="Card Issuer / Bank"
                  title="Select Card Issuer"
                  value={issuer}
                  onChange={val => setIssuer(val)}
                  options={issuerOptions}
                  searchable={true}
                  searchPlaceholder="Search bank..."
                />
              </div>
            </div>

            {/* Network & Last 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <CustomSelect
                  label="Payment Network"
                  title="Select Network"
                  value={network}
                  onChange={val => setNetwork(val as CardNetwork)}
                  options={networkOptions}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Last 4 Digits
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={lastFourDigits}
                  onChange={e => setLastFourDigits(e.target.value.replace(/\D/g, ''))}
                  placeholder="4589"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-purple-500 border border-transparent dark:border-slate-700"
                />
              </div>
            </div>

            {/* Credit Limit & Initial Outstanding */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Credit Limit (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    {[50000, 100000, 200000, 500000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCreditLimit(amt.toString())}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
                      >
                        {formatINR(amt)}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={e => setCreditLimit(e.target.value)}
                  placeholder="150000"
                  min="1000"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 border border-transparent dark:border-slate-700"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Initial Outstanding (₹)
                  </label>
                  {activeAccount && activeAccount.calculatedBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setOpeningBalance('0')}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold"
                    >
                      Start at ₹0
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={e => setOpeningBalance(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 border border-transparent dark:border-slate-700"
                />
              </div>
            </div>

            {/* Statement Date & Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Statement Generation Day (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={statementDate}
                  onChange={e => setStatementDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500 border border-transparent dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Payment Due Day (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500 border border-transparent dark:border-slate-700"
                />
              </div>
            </div>

            {/* Card Luxury Theme Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Layers size={13} className="text-purple-600" />
                  <span>Luxury Visual Theme</span>
                </span>
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                  {CARD_THEMES.find(t => t.id === cardTheme)?.name}
                </span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                {CARD_THEMES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCardTheme(t.id)}
                    className={`h-11 rounded-xl bg-gradient-to-br ${t.gradient} border text-white flex flex-col items-center justify-center p-1 text-[10px] font-bold transition-all relative shadow-xs ${
                      cardTheme === t.id
                        ? 'ring-2 ring-purple-600 ring-offset-2 dark:ring-offset-slate-900 border-white scale-102 shadow-md'
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                    title={t.name}
                  >
                    <span className="truncate max-w-full">{t.name.split(' ')[0]}</span>
                    {cardTheme === t.id && (
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white shadow-xs" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes & Perks */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Rewards & Perks / Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. 5% cashback on Amazon & Swiggy, 4 domestic lounge visits"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-500 border border-transparent dark:border-slate-700"
              />
            </div>

            {/* Migration & Account Lifecycle Options */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={migrateTransactions}
                  onChange={e => setMigrateTransactions(e.target.checked)}
                  className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <History size={13} className="text-purple-600 dark:text-purple-400" />
                    <span>Migrate Transaction History ({relatedTransactionsCount} transactions)</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Seamlessly reassign all past expenses, refunds, and payments from this bank account to your new credit card ledger so historical charts and merchant tags remain 100% accurate.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="checkbox"
                  checked={deleteOriginalAccount}
                  onChange={e => setDeleteOriginalAccount(e.target.checked)}
                  className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <ShieldCheck size={13} className="text-emerald-600" />
                    <span>Replace Bank Account (Remove original bank record)</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {deleteOriginalAccount
                      ? 'The bank account will be fully replaced with this credit card.'
                      : 'The bank account will remain archived as inactive with a reference note.'}
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
              disabled={isSubmitting || !cardName.trim()}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all active:scale-98 flex items-center space-x-2 disabled:opacity-50"
            >
              <ArrowRightLeft size={16} />
              <span>{isSubmitting ? 'Converting...' : 'Convert to Credit Card'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
