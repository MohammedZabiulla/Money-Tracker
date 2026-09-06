import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Transaction, TransactionType, SplitItem } from '../../types';
import { Category3DIcon, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import { CategoryManagementModal } from '../categories/CategoryManagementModal';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { CustomTimePicker } from '../common/CustomTimePicker';
import { PaymentAppManagementModal } from '../paymentApps/PaymentAppManagementModal';
import { InvestmentManagementModal } from '../investments/InvestmentManagementModal';
import { AddAccountOrCardModal } from '../accounts/AddAccountOrCardModal';
import { formatINR, CURRENCY_RATES } from '../../lib/currency';
import {
  X,
  Check,
  Settings2,
  Plus,
  Split,
  Target,
  Trash2,
} from 'lucide-react';
import { POPULAR_TAGS, CARD_THEMES } from '../../lib/constants';
import { useScrollLock } from '../../hooks/useScrollLock';

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
  useScrollLock(isOpen);

  const {
    updateTransaction,
    categories,
    accounts,
    creditCards,
    investments,
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
  const [investmentId, setInvestmentId] = useState<string>('');
  const [selectedSourceType, setSelectedSourceType] = useState<'ACCOUNT' | 'CARD'>('ACCOUNT');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedCreditCardId, setSelectedCreditCardId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [selectedToCardId, setSelectedToCardId] = useState<string>('');
  const [paymentAppId, setPaymentAppId] = useState<string>('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showPaymentAppModal, setShowPaymentAppModal] = useState<boolean>(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState<boolean>(false);
  const [showAccountCardModal, setShowAccountCardModal] = useState<boolean>(false);
  const [accountCardDefaultTab, setAccountCardDefaultTab] = useState<'BANK' | 'CARD' | 'WALLET'>('BANK');

  // Advanced features
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [splits, setSplits] = useState<SplitItem[]>([]);

  useEffect(() => {
    if (transaction && isOpen) {
      setType(typeof transaction.type === 'string' && transaction.type ? transaction.type : 'EXPENSE');
      setAmount(transaction.amount.toString());
      setDate(transaction.date);
      let initialTime = transaction.time || '';
      if (!initialTime && transaction.timestamp) {
        const d = new Date(transaction.timestamp);
        initialTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      } else if (initialTime && initialTime.split(':').length === 2 && transaction.timestamp) {
        const s = new Date(transaction.timestamp).getSeconds();
        initialTime = `${initialTime}:${String(s).padStart(2, '0')}`;
      }
      setTime(initialTime || '12:00:00');
      setMerchantName(transaction.merchantName || '');
      setCategoryId(transaction.categoryId || '');
      setSubcategory(transaction.subcategory || '');
      setInvestmentId(transaction.investmentId || '');
      if (transaction.type === 'CARD_PAYMENT') {
        setSelectedAccountId(transaction.accountId || '');
        setSelectedCreditCardId(transaction.creditCardId || ''); // Assuming legacy mapped source to accountId or creditCardId!
        setSelectedToCardId(transaction.toCreditCardId || transaction.creditCardId || '');
        // For legacy CARD_PAYMENT, creditCardId was actually the DESTINATION.
        // If they both exist, it's new.
        if (!transaction.toCreditCardId && transaction.creditCardId) {
           setSelectedCreditCardId(''); // clear it from source since it was destination
        }
      } else if (transaction.creditCardId) {
        setSelectedSourceType('CARD');
        setSelectedCreditCardId(transaction.creditCardId);
        setSelectedAccountId('');
      } else {
        setSelectedSourceType('ACCOUNT');
        setSelectedAccountId(transaction.accountId || '');
        setSelectedCreditCardId('');
      }
      setToAccountId(transaction.toAccountId || '');
      setSelectedToCardId(transaction.toCreditCardId || '');
      setPaymentAppId(transaction.paymentAppId || '');
      setSelectedGoalId(transaction.goalId || '');
      setNotes(transaction.notes || '');
      setTags(transaction.tags || []);
      setMerchantName(transaction.merchantName || transaction.debtPersonName || '');
      setIsSplitMode(!!(transaction.splits && transaction.splits.length > 0));
      setSplits(transaction.splits || []);
    }
  }, [transaction, isOpen]);

  const prevGoalIdRef = useRef<string>('');
  const prevTypeRef = useRef<string>('');
  useEffect(() => {
    if (transaction && isOpen) {
      if (selectedGoalId !== (transaction.goalId || '') || type !== transaction.type) {
        if (selectedGoalId) {
          const goal = goals.find(g => g.id === selectedGoalId);
          if (goal) {
            const isIncome = type === 'INCOME';
            const depositCount = (goal.allocations || []).filter(a => a.type === 'DEPOSIT').length;
            const expectedDepositNote = `Goal: deposit towards ${goal.name} - ${depositCount + 1}`;
            const expectedWithdrawalNote = `Goal: withdrawal from ${goal.name}`;

            if (selectedGoalId !== prevGoalIdRef.current || type !== prevTypeRef.current) {
              if (isIncome) {
                setNotes(expectedWithdrawalNote);
                setCategoryId('other_income');
              } else {
                setNotes(expectedDepositNote);
                setCategoryId('investments_expense');
              }
            }
          }
        } else if (prevGoalIdRef.current && prevGoalIdRef.current !== (transaction.goalId || '')) {
          const prevGoal = goals.find(g => g.id === prevGoalIdRef.current);
          if (prevGoal) {
            const possibleNotes = [
              `Goal: withdrawal from ${prevGoal.name}`,
              ...Array.from({ length: 100 }, (_, i) => `Goal: deposit towards ${prevGoal.name} - ${i + 1}`)
            ];
            if (possibleNotes.includes(notes)) {
              setNotes(transaction.notes || '');
            }
          }
        }
      }
      prevGoalIdRef.current = selectedGoalId;
      prevTypeRef.current = type;
    }
  }, [selectedGoalId, type, goals, transaction, isOpen, notes]);

  const prevInvestmentIdRef = useRef<string>(transaction?.investmentId || '');
  useEffect(() => {
    if (isOpen && transaction && investmentId && type === 'INVESTMENT_CONTRIBUTION') {
      const inv = investments.find(i => i.id === investmentId);
      if (inv) {
        if (investmentId !== prevInvestmentIdRef.current) {
          if (!notes.trim() || notes === transaction.notes) {
            setNotes(`Investment contribution to ${inv.name}`);
          }
          
          if (inv.linkedAccountId && accounts.some(a => a.id === inv.linkedAccountId)) {
            setSelectedSourceType('ACCOUNT');
            setSelectedAccountId(inv.linkedAccountId);
          } else if (inv.linkedCreditCardId && creditCards.some(c => c.id === inv.linkedCreditCardId)) {
            setSelectedSourceType('CARD');
            setSelectedCreditCardId(inv.linkedCreditCardId);
          }
          
          if (inv.linkedPaymentAppId && paymentApps.some(p => p.id === inv.linkedPaymentAppId)) {
            setPaymentAppId(inv.linkedPaymentAppId);
          }
        }
      }
    }
    prevInvestmentIdRef.current = investmentId;
  }, [investmentId, type, investments, accounts, creditCards, paymentApps, notes, isOpen, transaction]);

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
        isBankAccount: true,
        bankTheme: a.institution || a.name || a.type,
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

    if (type === 'INVESTMENT_CONTRIBUTION' && !investmentId) {
      alert('Please select an investment asset to link this contribution to.');
      return;
    }

    const selectedAcc = activeAccounts.find(a => a.id === selectedAccountId);
    const selectedCc = activeCards.find(c => c.id === selectedCreditCardId);
    const selectedToAcc = activeAccounts.find(a => a.id === toAccountId);
    const selectedToCard = activeCards.find(c => c.id === selectedToCardId);
    const selectedApp = paymentApps.find(p => p.id === paymentAppId);

    const updates: Partial<Transaction> = {
      type,
      amount: numAmount,
      date,
      time,
      merchantName: type === 'MONEY_LENT' || type === 'MONEY_BORROWED' ? undefined : (merchantName.trim() || undefined),
      debtPersonName: type === 'MONEY_LENT' || type === 'MONEY_BORROWED' ? (merchantName.trim() || undefined) : undefined,
      categoryId: (type === 'TRANSFER' || type === 'CARD_PAYMENT' || type === 'MONEY_LENT' || type === 'MONEY_BORROWED' || type === 'INVESTMENT_CONTRIBUTION') ? 'cat_transfer' : (isSplitMode && splits.length > 0 ? splits[0].categoryId : (categoryId || undefined)),
      categoryName: type === 'CARD_PAYMENT' ? 'Credit Card Payment' : type === 'TRANSFER' ? 'Transfer' : type === 'INVESTMENT_CONTRIBUTION' ? 'Investment Contribution' : type === 'MONEY_LENT' ? 'Money Lent' : type === 'MONEY_BORROWED' ? 'Money Borrowed' : (isSplitMode && splits.length > 0 ? categories.find(c => c.id === splits[0].categoryId)?.name : (currentCategory?.name || undefined)),
      subcategory: subcategory || undefined,
      accountId: selectedAccountId || undefined,
      accountName: selectedAcc?.name,
      creditCardId: selectedCreditCardId || undefined,
      creditCardName: selectedCc?.name,
      toAccountId: toAccountId || undefined,
      toAccountName: selectedToAcc?.name,
      toCreditCardId: selectedToCardId || undefined,
      toCreditCardName: selectedToCard?.name,
      paymentAppId: paymentAppId || undefined,
      paymentAppName: selectedApp?.name || undefined,
      goalId: selectedGoalId || undefined,
      investmentId: investmentId || undefined,
      notes: notes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      splits: isSplitMode && splits.length > 0 ? splits : undefined,
    };

    if (isSplitMode && splits.length > 0 && Math.abs(totalSplitAmount - numAmount) > 0.01) {
      if (!confirm(`Split sum (₹${totalSplitAmount.toFixed(2)}) does not equal total transaction (₹${numAmount.toFixed(2)}). Do you want to save anyway?`)) {
        return;
      }
    }

    updateTransaction(transaction.id, updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
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
          <div className="flex items-center space-x-2">
            <button
              type="submit"
              form="edit-transaction-form"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1"
            >
              <Check size={14} />
              <span>Save</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form id="edit-transaction-form" onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Transaction Type Segmented Switch */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex-1 min-w-[58px] py-2 text-[11px] font-bold rounded-xl transition-all text-center whitespace-nowrap ${
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
              className={`flex-1 min-w-[58px] py-2 text-[11px] font-bold rounded-xl transition-all text-center whitespace-nowrap ${
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
              className={`flex-1 min-w-[58px] py-2 text-[11px] font-bold rounded-xl transition-all text-center whitespace-nowrap ${
                type === 'TRANSFER'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Transfer
            </button>
            <button
              type="button"
              onClick={() => setType('CARD_PAYMENT')}
              className={`flex-1 min-w-[62px] py-2 text-[11px] font-bold rounded-xl transition-all text-center whitespace-nowrap ${
                type === 'CARD_PAYMENT'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Card Bill
            </button>
            <button
              type="button"
              onClick={() => setType('INVESTMENT_CONTRIBUTION')}
              className={`flex-1 min-w-[58px] py-2 text-[11px] font-bold rounded-xl transition-all text-center whitespace-nowrap ${
                type === 'INVESTMENT_CONTRIBUTION'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Invest
            </button>
            <button
              type="button"
              onClick={() => setType('MONEY_LENT')}
              className={`flex-1 min-w-[52px] py-2 text-[11px] font-bold rounded-xl transition-all text-center whitespace-nowrap ${
                type === 'MONEY_LENT' || type === 'MONEY_LENT_REPAYMENT'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Lend
            </button>
            <button
              type="button"
              onClick={() => setType('MONEY_BORROWED')}
              className={`flex-1 min-w-[52px] py-2 text-[11px] font-bold rounded-xl transition-all text-center whitespace-nowrap ${
                type === 'MONEY_BORROWED' || type === 'MONEY_BORROWED_REPAYMENT'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Borrow
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
                {splits.map((split, idx) => (
                  <div
                    key={`edit_split_${split.id || 's'}_${idx}`}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200/60 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <CustomSelect
                          value={split.categoryId}
                          onChange={(val) => handleUpdateSplit(split.id, { categoryId: val })}
                          options={categories.map(c => ({ value: c.id, label: c.name }))}
                        />
                      </div>

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
              {type === 'INCOME' ? 'Source / Payer' : type === 'TRANSFER' ? 'Transfer Description' : type === 'MONEY_LENT' ? 'Lent To (Person Name)' : type === 'MONEY_BORROWED' ? 'Borrowed From (Person Name)' : type === 'CARD_PAYMENT' ? 'Card Bill Note / Description' : 'Merchant / Payee'}
            </label>
            <input
              type="text"
              value={merchantName}
              onChange={e => setMerchantName(e.target.value)}
              placeholder={type === 'MONEY_LENT' || type === 'MONEY_BORROWED' ? 'e.g. John Doe, Rahul' : type === 'INCOME' ? 'e.g. Company Name, Client' : 'e.g. Swiggy, Amazon, Uber, Shell'}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category & Subcategory (for Expense / Income only) */}
          {(type === 'EXPENSE' || type === 'INCOME') && (
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
                    {currentCategory.subcategories.map((sub, idx) => (
                      <button
                        key={`edit_sub_${sub}_${idx}`}
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

          {/* Investment Selector */}
          {type === 'INVESTMENT_CONTRIBUTION' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Select Investment Asset
                </label>
                <button
                  type="button"
                  onClick={() => setShowInvestmentModal(true)}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center space-x-1 hover:underline"
                >
                  <Plus size={12} className="mr-0.5" />
                  <span>Add New Asset</span>
                </button>
              </div>
              <CustomSelect
                value={investmentId}
                onChange={setInvestmentId}
                options={[
                  { value: '', label: 'Select an investment...' },
                  ...investments.filter(i => !i.isDeleted).map(inv => ({
                    value: inv.id,
                    label: `${inv.name} (${formatINR(inv.currentValue)})`
                  }))
                ]}
              />
            </div>
          )}

          {/* Account / Card Selection */}
          {type === 'TRANSFER' ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    From Account / Credit Card
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountCardDefaultTab('BANK');
                      setShowAccountCardModal(true);
                    }}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                  >
                    <Plus size={12} />
                    <span>Add Bank / Card</span>
                  </button>
                </div>
                <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
                  {activeAccounts.map(acc => {
                    const isSelected = selectedAccountId === acc.id && !selectedCreditCardId;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          setSelectedAccountId(acc.id);
                          setSelectedCreditCardId('');
                        }}
                        className={`px-3 py-2 rounded-2xl border text-xs font-medium whitespace-nowrap flex items-center space-x-2.5 transition-all shrink-0 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-bold shadow-md ring-2 ring-emerald-500/30'
                            : 'border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <Bank3DIcon
                          institution={acc.institution}
                          type={acc.type}
                          color={acc.color}
                          size="sm"
                          glow={isSelected}
                        />
                        <div className="text-left">
                          <span className="block leading-tight">{acc.name}</span>
                          <span className={`text-[10px] font-semibold ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500'}`}>
                            Bal: {formatINR(acc.calculatedBalance)}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {activeCards.map(card => {
                    const isSelected = selectedCreditCardId === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          setSelectedCreditCardId(card.id);
                          setSelectedAccountId('');
                        }}
                        className={`px-3 py-2 rounded-2xl border text-xs font-medium whitespace-nowrap flex items-center space-x-2.5 transition-all shrink-0 ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/50 text-purple-800 dark:text-purple-200 font-bold shadow-md ring-2 ring-purple-500/30'
                            : 'border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <Bank3DIcon
                          institution={card.issuer}
                          type="CREDIT_CARD"
                          color={card.color || '#9333ea'}
                          size="sm"
                          glow={isSelected}
                        />
                        <div className="text-left">
                          <span className="block leading-tight">{card.name}</span>
                          <span className={`text-[10px] font-semibold ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-slate-500'}`}>
                            ••{card.lastFourDigits} • Due: {formatINR(card.currentOutstanding)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">
                  To Destination Account / Credit Card
                </label>
                <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
                  {activeAccounts.filter(a => a.id !== selectedAccountId).map(acc => {
                    const isSelected = toAccountId === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          setToAccountId(acc.id);
                          setSelectedToCardId('');
                        }}
                        className={`px-3 py-2 rounded-2xl border text-xs font-medium whitespace-nowrap flex items-center space-x-2.5 transition-all shrink-0 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-bold shadow-md ring-2 ring-emerald-500/30'
                            : 'border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <Bank3DIcon
                          institution={acc.institution}
                          type={acc.type}
                          color={acc.color}
                          size="sm"
                          glow={isSelected}
                        />
                        <div className="text-left">
                          <span className="block leading-tight">{acc.name}</span>
                          <span className={`text-[10px] font-semibold ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500'}`}>
                            Bal: {formatINR(acc.calculatedBalance)}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {activeCards.filter(c => c.id !== selectedCreditCardId).map(card => {
                    const isSelected = selectedToCardId === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          setSelectedToCardId(card.id);
                          setToAccountId('');
                        }}
                        className={`px-3 py-2 rounded-2xl border text-xs font-medium whitespace-nowrap flex items-center space-x-2.5 transition-all shrink-0 ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/50 text-purple-800 dark:text-purple-200 font-bold shadow-md ring-2 ring-purple-500/30'
                            : 'border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <Bank3DIcon
                          institution={card.issuer}
                          type="CREDIT_CARD"
                          color={card.color || '#9333ea'}
                          size="sm"
                          glow={isSelected}
                        />
                        <div className="text-left">
                          <span className="block leading-tight">{card.name}</span>
                          <span className={`text-[10px] font-semibold ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-slate-500'}`}>
                            ••{card.lastFourDigits} • Due: {formatINR(card.currentOutstanding)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : type === 'CARD_PAYMENT' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <CustomSelect
                  label="Pay From Account / Credit Card"
                  title="Select Source"
                  value={selectedAccountId || selectedCreditCardId}
                  onChange={val => {
                    const isCard = creditCardOptions.some(c => c.value === val);
                    if (isCard) {
                      setSelectedCreditCardId(val);
                      setSelectedAccountId('');
                    } else {
                      setSelectedAccountId(val);
                      setSelectedCreditCardId('');
                    }
                  }}
                  options={[...accountOptions, ...creditCardOptions]}
                  placeholder="Select Source"
                  searchable={true}
                />
              </div>
              <div>
                <CustomSelect
                  label="Pay To Credit Card"
                  title="Select Credit Card"
                  value={selectedToCardId}
                  onChange={val => setSelectedToCardId(val)}
                  options={creditCardOptions}
                  placeholder="Select Credit Card"
                  searchable={true}
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
              <CustomSelect
                value={selectedGoalId}
                onChange={setSelectedGoalId}
                options={[
                  { value: '', label: 'No goal linked' },
                  ...goals.map(g => ({
                    value: g.id,
                    label: `${g.name} (${formatINR(g.currentAmount)} / ${formatINR(g.targetAmount)})`
                  }))
                ]}
              />
            </div>
          )}

          {/* Investment Linkage */}
          {type !== 'INVESTMENT_CONTRIBUTION' && investments.filter(i => !i.isDeleted).length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center space-x-1">
                <span className="text-teal-600 dark:text-teal-400 font-black">📈</span>
                <span>Link to Investment</span>
              </label>
              <CustomSelect
                value={investmentId}
                onChange={setInvestmentId}
                options={[
                  { value: '', label: 'No investment linked' },
                  ...investments.filter(i => !i.isDeleted).map(inv => ({
                    value: inv.id,
                    label: `${inv.name} (${formatINR(inv.currentValue)})`
                  }))
                ]}
              />
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
              {POPULAR_TAGS.map((tag, idx) => {
                const isSelected = tags.includes(tag);
                return (
                  <button
                    key={`edit_tag_${tag}_${idx}`}
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
        </form>
      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <CategoryManagementModal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onSelectCategory={(cat) => {
            setCategoryId(cat.id);
            setSubcategory('');
            setShowCategoryModal(false);
          }}
        />
      )}

      {/* Payment App Management Modal */}
      {showPaymentAppModal && (
        <PaymentAppManagementModal
          isOpen={showPaymentAppModal}
          onClose={() => setShowPaymentAppModal(false)}
          onSelectPaymentApp={app => {
            setPaymentAppId(app.id);
          }}
        />
      )}

      {/* Investment Management Modal */}
      {showInvestmentModal && (
        <InvestmentManagementModal
          isOpen={showInvestmentModal}
          onClose={() => setShowInvestmentModal(false)}
        />
      )}

      {/* Add Account / Card Modal */}
      {showAccountCardModal && (
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
      )}
    </div>
  );
};
