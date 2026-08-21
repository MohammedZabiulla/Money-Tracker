import React, { useState, useEffect, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Transaction, TransactionType, SplitItem } from '../../types';
import { IconHelper, Category3DIcon, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import { CategoryManagementModal } from '../categories/CategoryManagementModal';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { CustomTimePicker } from '../common/CustomTimePicker';
import { PaymentAppManagementModal } from '../paymentApps/PaymentAppManagementModal';
import { AddAccountOrCardModal } from '../accounts/AddAccountOrCardModal';
import { formatINR, CURRENCY_RATES } from '../../lib/currency';
import {
  X,
  Check,
  Calendar,
  Clock,
  Tag,
  CreditCard,
  Building,
  ArrowRightLeft,
  Smartphone,
  FileText,
  DollarSign,
  Layers,
  Sparkles,
  Settings2,
  Plus,
  Split,
  Target,
  Trash2,
  Globe,
} from 'lucide-react';
import { POPULAR_TAGS } from '../../lib/constants';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const {
    updateTransaction,
    categories,
    accounts,
    creditCards,
    paymentApps,
    goals,
  } = useMoney();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [merchantName, setMerchantName] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [selectedSourceType, setSelectedSourceType] = useState<'ACCOUNT' | 'CARD'>('ACCOUNT');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedCreditCardId, setSelectedCreditCardId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [paymentAppId, setPaymentAppId] = useState<string>('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showPaymentAppModal, setShowPaymentAppModal] = useState<boolean>(false);
  const [showAccountCardModal, setShowAccountCardModal] = useState<boolean>(false);
  const [accountCardDefaultTab, setAccountCardDefaultTab] = useState<'BANK' | 'CARD' | 'WALLET'>('BANK');

  // Cashew features
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [splits, setSplits] = useState<SplitItem[]>([]);

  useEffect(() => {
    if (transaction && isOpen) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setDate(transaction.date);
      setTime(transaction.time || '12:00');
      setMerchantName(transaction.merchantName || '');
      setCategoryId(transaction.categoryId || '');
      setSubcategory(transaction.subcategory || '');
      if (transaction.creditCardId) {
        setSelectedSourceType('CARD');
        setSelectedCreditCardId(transaction.creditCardId);
      } else {
        setSelectedSourceType('ACCOUNT');
        setSelectedAccountId(transaction.accountId || '');
      }
      setToAccountId(transaction.toAccountId || '');
      setPaymentAppId(transaction.paymentAppId || '');
      setSelectedGoalId(transaction.goalId || '');
      setNotes(transaction.notes || '');
      setTags(transaction.tags || []);
      setIsSplitMode(!!(transaction.splits && transaction.splits.length > 0));
      setSplits(transaction.splits || []);
    }
  }, [transaction, isOpen]);

  const parsedAmount = Math.max(0, parseFloat(amount) || 0);
  const totalSplitAmount = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const remainingSplitAmount = Math.max(0, parsedAmount - totalSplitAmount);

  const handleAddSplit = () => {
    const defaultCat = categories.find(c => !splits.some(s => s.categoryId === c.id)) || categories[0];
    const newSplit: SplitItem = {
      id: 'split_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      categoryId: defaultCat?.id || 'food_dining',
      categoryName: defaultCat?.name,
      amount: remainingSplitAmount > 0 ? remainingSplitAmount : 0,
      notes: '',
    };
    setSplits([...splits, newSplit]);
  };

  const handleUpdateSplit = (id: string, updates: Partial<SplitItem>) => {
    setSplits(splits.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates };
        if (updates.categoryId) {
          const c = categories.find(cat => cat.id === updates.categoryId);
          if (c) updated.categoryName = c.name;
        }
        return updated;
      }
      return s;
    }));
  };

  const handleRemoveSplit = (id: string) => {
    setSplits(splits.filter(s => s.id !== id));
  };

  const currentCategory = categories.find(c => c.id === categoryId);
  const filteredCategories = categories.filter(c => {
    if (type === 'INCOME') return c.type === 'INCOME' || c.type === 'BOTH';
    return c.type === 'EXPENSE' || c.type === 'BOTH';
  });

  const activeAccounts = accounts.filter(a => !a.isDeleted);
  const activeCards = creditCards.filter(c => !c.isDeleted);

  const accountOptions: SelectOption<string>[] = useMemo(() => {
    return activeAccounts.map(a => {
      const typeLabel =
        a.type === 'WALLET'
          ? 'Digital Wallet'
          : a.type === 'CASH'
          ? 'Cash in Hand'
          : a.type === 'SAVINGS'
          ? 'Savings Account'
          : a.type === 'SALARY'
          ? 'Salary Account'
          : a.type === 'CURRENT'
          ? 'Current Account'
          : a.type === 'FIXED_DEPOSIT'
          ? 'Fixed Deposit'
          : 'Bank Account';

      const groupName =
        a.type === 'WALLET'
          ? 'Digital Wallets'
          : a.type === 'CASH'
          ? 'Cash in Hand'
          : a.type === 'FIXED_DEPOSIT' || a.type === 'RECURRING_DEPOSIT'
          ? 'Deposits & Savings'
          : 'Bank Accounts';

      return {
        value: a.id,
        label: a.name,
        sublabel: `${a.institution} • ${typeLabel}`,
        group: groupName,
        icon: (
          <Bank3DIcon
            institution={a.institution}
            type={a.type}
            color={a.color || '#059669'}
            size="sm"
            glow={false}
          />
        ),
        rightText: formatINR(a.calculatedBalance),
        rightTextColor:
          a.calculatedBalance >= 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-rose-500',
      };
    });
  }, [activeAccounts]);

  const creditCardOptions: SelectOption<string>[] = useMemo(() => {
    return activeCards.map(c => ({
      value: c.id,
      label: c.name,
      sublabel: `${c.issuer} • ••${c.lastFourDigits} • Due: ${c.dueDate ? `Day ${c.dueDate}` : 'N/A'}`,
      group: 'Credit Cards',
      icon: (
        <Bank3DIcon
          institution={c.issuer}
          type="CREDIT_CARD"
          color={c.color || '#9333ea'}
          size="sm"
          glow={false}
        />
      ),
      rightText: `Due: ${formatINR(c.currentOutstanding)}`,
      rightTextColor:
        c.currentOutstanding > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400',
    }));
  }, [activeCards]);

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTagInput.trim() && !tags.includes(customTagInput.trim())) {
      setTags([...tags, customTagInput.trim()]);
      setCustomTagInput('');
    }
  };

  if (!isOpen || !transaction) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    const selectedAcc = activeAccounts.find(a => a.id === selectedAccountId);
    const selectedCc = activeCards.find(c => c.id === selectedCreditCardId);
    const selectedToAcc = activeAccounts.find(a => a.id === toAccountId);
    const selectedApp = paymentApps.find(p => p.id === paymentAppId);

    const updates: Partial<Transaction> = {
      type,
      amount: numAmount,
      date,
      time,
      merchantName: merchantName.trim() || undefined,
      categoryId: isSplitMode && splits.length > 0 ? splits[0].categoryId : (categoryId || undefined),
      categoryName: isSplitMode && splits.length > 0 ? categories.find(c => c.id === splits[0].categoryId)?.name : (currentCategory?.name || undefined),
      subcategory: subcategory || undefined,
      paymentAppId: paymentAppId || undefined,
      paymentAppName: selectedApp?.name || undefined,
      goalId: selectedGoalId || undefined,
      notes: notes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      splits: isSplitMode && splits.length > 0 ? splits : undefined,
    };

    if (isSplitMode && splits.length > 0 && Math.abs(totalSplitAmount - numAmount) > 0.01) {
      if (!confirm(`Split sum (₹${totalSplitAmount.toFixed(2)}) does not equal total transaction (₹${numAmount.toFixed(2)}). Do you want to save anyway?`)) {
        return;
      }
    }

    if (type === 'TRANSFER') {
      updates.accountId = selectedAccountId;
      updates.accountName = selectedAcc?.name;
      updates.toAccountId = toAccountId;
      updates.toAccountName = selectedToAcc?.name;
      updates.creditCardId = undefined;
      updates.creditCardName = undefined;
    } else if (selectedSourceType === 'CARD') {
      updates.creditCardId = selectedCreditCardId;
      updates.creditCardName = selectedCc?.name;
      updates.accountId = undefined;
      updates.accountName = undefined;
      updates.toAccountId = undefined;
      updates.toAccountName = undefined;
    } else {
      updates.accountId = selectedAccountId;
      updates.accountName = selectedAcc?.name;
      updates.creditCardId = undefined;
      updates.creditCardName = undefined;
      updates.toAccountId = undefined;
      updates.toAccountName = undefined;
    }

    updateTransaction(transaction.id, updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              ✏️
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Transaction
              </h2>
              <p className="text-[11px] text-slate-500">Update amount, category, date or account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Transaction Type Segmented Switch */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('TRANSFER')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'TRANSFER'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Amount Field & Split Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Amount (₹)
              </label>
              <div className="flex items-center space-x-2">
                {transaction?.originalCurrency && transaction.originalCurrency !== 'INR' && (
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                    {CURRENCY_RATES[transaction.originalCurrency]?.flag} {transaction.originalAmount} {transaction.originalCurrency}
                  </span>
                )}
                {type !== 'TRANSFER' && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isSplitMode;
                      setIsSplitMode(next);
                      if (next && splits.length === 0) {
                        handleAddSplit();
                      }
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                      isSplitMode
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Split size={12} />
                    <span>Split {isSplitMode ? 'On' : ''}</span>
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Splits Editor (when Split Mode is Active) */}
          {isSplitMode && type !== 'TRANSFER' && (
            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center space-x-1.5">
                  <Split size={14} className="text-purple-600" />
                  <span>Category Splits ({splits.length})</span>
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    Math.abs(totalSplitAmount - parsedAmount) < 0.01
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {Math.abs(totalSplitAmount - parsedAmount) < 0.01
                    ? '✓ Balanced'
                    : `Remaining: ${formatINR(remainingSplitAmount)}`}
                </span>
              </div>

              <div className="space-y-2">
                {splits.map(split => (
                  <div
                    key={split.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200/60 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <select
                        value={split.categoryId}
                        onChange={e => handleUpdateSplit(split.id, { categoryId: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>

                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          value={split.amount || ''}
                          onChange={e =>
                            handleUpdateSplit(split.id, { amount: parseFloat(e.target.value) || 0 })
                          }
                          placeholder="Amount"
                          className="w-full pl-6 pr-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-bold text-right"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSplit(split.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={split.notes || ''}
                        onChange={e => handleUpdateSplit(split.id, { notes: e.target.value })}
                        placeholder="Note for this split..."
                        className="flex-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-750 text-[11px] border border-slate-200/50 dark:border-slate-700 outline-none"
                      />
                      {remainingSplitAmount > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateSplit(split.id, {
                              amount: (split.amount || 0) + remainingSplitAmount,
                            })
                          }
                          className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-200"
                        >
                          + Remainder
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddSplit}
                className="w-full py-1.5 rounded-xl border border-dashed border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center space-x-1"
              >
                <Plus size={12} />
                <span>Add Another Split Category</span>
              </button>
            </div>
          )}

          {/* Merchant / Payee */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {type === 'INCOME' ? 'Source / Payer' : type === 'TRANSFER' ? 'Transfer Description' : 'Merchant / Payee'}
            </label>
            <input
              type="text"
              value={merchantName}
              onChange={e => setMerchantName(e.target.value)}
              placeholder={type === 'INCOME' ? 'e.g. Company Name, Client' : 'e.g. Swiggy, Amazon, Uber, Shell'}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category & Subcategory (for Expense / Income) */}
          {type !== 'TRANSFER' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center space-x-1 hover:underline"
                >
                  <Settings2 size={12} className="mr-0.5" />
                  <span>Manage Categories</span>
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700">
                {filteredCategories.map(c => {
                  const isSelected = categoryId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCategoryId(c.id);
                        setSubcategory('');
                      }}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center text-center transition-all group ${
                        isSelected
                          ? 'border-2 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-sm scale-102 font-bold'
                          : 'bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="mb-1 transition-transform group-hover:scale-105">
                        <Category3DIcon
                          name={c.icon}
                          categoryName={c.name}
                          color={c.color}
                          size="sm"
                          glow={isSelected}
                        />
                      </div>
                      <span className="text-[10px] font-semibold leading-tight line-clamp-1">
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Subcategories */}
              {currentCategory && currentCategory.subcategories && currentCategory.subcategories.length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                    Subcategory:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCategory.subcategories.map(sub => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSubcategory(sub === subcategory ? '' : sub)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                          subcategory === sub
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account / Card Selection */}
          {type === 'TRANSFER' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <CustomSelect
                  label="From Account"
                  title="Select Source Account"
                  value={selectedAccountId}
                  onChange={val => setSelectedAccountId(val)}
                  options={accountOptions}
                  placeholder="Select Source Account"
                  searchable={true}
                  searchPlaceholder="Search bank or wallet..."
                />
              </div>

              <div>
                <CustomSelect
                  label="To Account"
                  title="Select Destination Account"
                  value={toAccountId}
                  onChange={val => setToAccountId(val)}
                  options={accountOptions.filter(a => a.value !== selectedAccountId)}
                  placeholder="Select Destination Account"
                  searchable={true}
                  searchPlaceholder="Search destination..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Payment Source
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountCardDefaultTab(selectedSourceType === 'CARD' ? 'CARD' : 'BANK');
                      setShowAccountCardModal(true);
                    }}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-0.5"
                  >
                    <Plus size={11} />
                    <span>Add Bank / Card</span>
                  </button>

                  {type === 'EXPENSE' && (
                    <div className="flex space-x-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedSourceType('ACCOUNT')}
                        className={`px-2 py-0.5 rounded font-medium ${
                          selectedSourceType === 'ACCOUNT'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500'
                        }`}
                      >
                        Bank/Wallet
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSourceType('CARD')}
                        className={`px-2 py-0.5 rounded font-medium ${
                          selectedSourceType === 'CARD'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500'
                        }`}
                      >
                        Credit Card
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {selectedSourceType === 'CARD' && type === 'EXPENSE' ? (
                <CustomSelect
                  title="Select Credit Card"
                  value={selectedCreditCardId}
                  onChange={val => setSelectedCreditCardId(val)}
                  options={creditCardOptions}
                  placeholder="Choose Credit Card"
                  searchable={true}
                  searchPlaceholder="Search card by name or issuer..."
                />
              ) : (
                <CustomSelect
                  title="Select Bank / Wallet / Cash"
                  value={selectedAccountId}
                  onChange={val => setSelectedAccountId(val)}
                  options={accountOptions}
                  placeholder="Choose Bank / Wallet / Cash"
                  searchable={true}
                  searchPlaceholder="Search accounts, wallets..."
                />
              )}
            </div>
          )}

          {/* Payment Channel App (GPay, PhonePe, Paytm, CRED, etc.) with 3D Icons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Payment Channel / App
              </label>
              <button
                type="button"
                onClick={() => setShowPaymentAppModal(true)}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-0.5"
              >
                <Plus size={11} />
                <span>Add Channel</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {paymentApps.map(app => {
                const isSelected = paymentAppId === app.id;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setPaymentAppId(isSelected ? '' : app.id)}
                    className={`px-3 py-2 rounded-2xl text-xs font-semibold flex items-center space-x-2 border transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <PaymentApp3DIcon
                      name={app.name}
                      symbol={app.symbol}
                      icon={app.icon}
                      color={app.color}
                      gradient={app.gradient}
                      size="sm"
                      glow={isSelected}
                    />
                    <span>{app.name}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowPaymentAppModal(true)}
                className="px-3 py-2 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 text-xs font-bold flex items-center space-x-1 transition-all"
              >
                <Plus size={13} className="text-emerald-500" />
                <span>+ Channel</span>
              </button>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <CustomDatePicker
                label="Date"
                value={date}
                onChange={d => setDate(d)}
                size="md"
              />
            </div>
            <div>
              <CustomTimePicker
                label="Time"
                value={time}
                onChange={t => setTime(t)}
                size="md"
              />
            </div>
          </div>

          {/* Savings Goal Linkage */}
          {goals.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center space-x-1">
                <Target size={12} className="text-emerald-600 dark:text-emerald-400" />
                <span>Link to Savings Goal</span>
              </label>
              <select
                value={selectedGoalId}
                onChange={e => setSelectedGoalId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              >
                <option value="">No goal linked</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({formatINR(g.currentAmount)} / {formatINR(g.targetAmount)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add optional notes or purpose..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {POPULAR_TAGS.map(tag => {
                const isSelected = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={customTagInput}
                onChange={e => setCustomTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="Add custom tag (e.g. GoaTrip)..."
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Check size={18} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />

      {/* Payment App Management Modal */}
      <PaymentAppManagementModal
        isOpen={showPaymentAppModal}
        onClose={() => setShowPaymentAppModal(false)}
        onSelectPaymentApp={app => {
          setPaymentAppId(app.id);
        }}
      />

      {/* Add Account / Card Modal */}
      <AddAccountOrCardModal
        isOpen={showAccountCardModal}
        onClose={() => setShowAccountCardModal(false)}
        defaultTab={accountCardDefaultTab}
        onCreatedAccount={acc => {
          setSelectedAccountId(acc.id);
          setSelectedSourceType('ACCOUNT');
        }}
        onCreatedCard={card => {
          setSelectedCreditCardId(card.id);
          setSelectedSourceType('CARD');
        }}
      />
    </div>
  );
};
