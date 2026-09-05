import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { TransactionType, SplitItem, RecurrenceFrequency, TransactionTemplate } from '../../types';
import { formatINR, CURRENCY_RATES } from '../../lib/currency';
import { Category3DIcon, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import { CategoryManagementModal } from '../categories/CategoryManagementModal';
import { InvestmentManagementModal } from '../investments/InvestmentManagementModal';
import { TemplateManagementModal } from '../templates/TemplateManagementModal';
import { learnMerchantSuggestion, detectDuplicateTransaction, generateDebtTransactionNarration } from '../../lib/accountingEngine';
import { calculateNextDueDate } from '../../lib/recurringEngine';
import { POPULAR_TAGS, CARD_THEMES } from '../../lib/constants';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { CustomTimePicker } from '../common/CustomTimePicker';
import { CustomSelect } from '../common/CustomSelect';
import { PaymentAppManagementModal } from '../paymentApps/PaymentAppManagementModal';
import { AddAccountOrCardModal } from '../accounts/AddAccountOrCardModal';
import {
  X,
  Check,
  Delete,
  Camera,
  ChevronDown,
  AlertTriangle,
  Sparkles,
  Plus,
  Settings2,
  Split,
  Globe,
  Trash2,
  Target,
  ArrowRight,
  Repeat,
  Zap,
  Star,
  BookmarkPlus,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useScrollLock } from '../../hooks/useScrollLock';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  initialAccountId?: string;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'EXPENSE',
  initialAccountId,
}) => {
  useScrollLock(isOpen);

  const {
    accounts,
    creditCards,
    investments,
    categories,
    paymentApps,
    merchants,
    transactions,
    debts,
    goals,
    templates,
    saveTransactionAsTemplate,
    addTransaction,
    addRecurring,
  } = useMoney();

  const getSafeInitialType = (t: any): TransactionType => {
    return (typeof t === 'string' && t) ? (t as TransactionType) : 'EXPENSE';
  };

  const [type, setType] = useState<TransactionType>(() => getSafeInitialType(initialType));
  const [calcInput, setCalcInput] = useState<string>('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [merchantName, setMerchantName] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [selectedToAccountId, setSelectedToAccountId] = useState<string>('');
  const [selectedToCardId, setSelectedToCardId] = useState<string>('');
  const [selectedPaymentAppId, setSelectedPaymentAppId] = useState<string>('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string>('');
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState<boolean>(false);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [templateSavedNotice, setTemplateSavedNotice] = useState<string | null>(null);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  // Feature: Multi-Currency
  const [selectedCurrency, setSelectedCurrency] = useState<string>('INR');
  const [foreignAmount, setForeignAmount] = useState<string>('');
  const [customExchangeRate, setCustomExchangeRate] = useState<number>(1);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState<boolean>(false);

  // Feature: Transaction Splits
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [splits, setSplits] = useState<SplitItem[]>([]);

  // Recurring Payments Feature
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurrenceFrequency>('MONTHLY');
  const [recurringInterval, setRecurringInterval] = useState<number>(1);
  const [recurringAutoRecord, setRecurringAutoRecord] = useState<boolean>(true);
  const [recurringHasEndDate, setRecurringHasEndDate] = useState<boolean>(false);
  const [recurringEndDate, setRecurringEndDate] = useState<string>('');

  // Progressive Disclosure
  const [showMoreDetails, setShowMoreDetails] = useState<boolean>(false);
  const [showPaymentAppModal, setShowPaymentAppModal] = useState<boolean>(false);
  const [showAccountCardModal, setShowAccountCardModal] = useState<boolean>(false);
  const [accountCardDefaultTab, setAccountCardDefaultTab] = useState<'BANK' | 'CARD' | 'WALLET'>('BANK');
  const getLocalTodayDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const getLocalCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  };

  const [date, setDate] = useState<string>(getLocalTodayDate);
  const [time, setTime] = useState<string>(getLocalCurrentTime);
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [debtDueDate, setDebtDueDate] = useState<string>('');
  const [selectedDebtId, setSelectedDebtId] = useState<string>('');

  const activeAccounts = useMemo(() => accounts.filter(a => !a.isDeleted), [accounts]);
  const activeCreditCards = useMemo(() => creditCards.filter(c => !c.isDeleted), [creditCards]);

  const parsedAmount = Math.max(0, parseFloat(calcInput) || 0);

  const isLentOrBorrowed = type === 'MONEY_LENT' || type === 'MONEY_BORROWED';
  const isRepayment = type === 'MONEY_LENT_REPAYMENT' || type === 'MONEY_BORROWED_REPAYMENT';
  const isLentOrDebtRelated = isLentOrBorrowed || isRepayment;

  const currentMatchedDebt = useMemo(() => {
    if (!isLentOrDebtRelated) return undefined;
    return debts.find(d =>
      !d.isSettled &&
      (selectedDebtId ? d.id === selectedDebtId : (merchantName && d.personName.toLowerCase().trim() === merchantName.toLowerCase().trim())) &&
      (type === 'MONEY_LENT' || type === 'MONEY_LENT_REPAYMENT' ? d.type === 'LENT' : d.type === 'BORROWED')
    );
  }, [debts, isLentOrDebtRelated, selectedDebtId, merchantName, type]);

  const currentDebtRem = currentMatchedDebt
    ? (currentMatchedDebt.remainingAmount !== undefined ? currentMatchedDebt.remainingAmount : currentMatchedDebt.amount)
    : undefined;

  const priorInstallmentCount = useMemo(() => {
    if (!isLentOrDebtRelated || !merchantName.trim()) return 0;
    const person = merchantName.trim();
    const targetType = type === 'MONEY_LENT_REPAYMENT' ? 'MONEY_LENT_REPAYMENT' : 'MONEY_BORROWED_REPAYMENT';
    
    let count = 0;
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (
        !t.isDeleted &&
        t.type === targetType &&
        (t.debtId === (selectedDebtId || currentMatchedDebt?.id) ||
          (t.debtPersonName && t.debtPersonName.toLowerCase().trim() === person.toLowerCase().trim()))
      ) {
        count++;
      }
    }
    return count;
  }, [isLentOrDebtRelated, merchantName, type, transactions, selectedDebtId, currentMatchedDebt?.id]);

  const suggestedDebtNarration = useMemo(() => {
    if (!isLentOrDebtRelated || !merchantName.trim()) return '';
    return generateDebtTransactionNarration({
      type,
      personName: merchantName.trim(),
      amount: parsedAmount || 0,
      remainingBeforePayment: currentDebtRem,
      totalDebtAmount: currentMatchedDebt?.amount,
      installmentCount: priorInstallmentCount,
    });
  }, [isLentOrDebtRelated, type, merchantName, parsedAmount, currentDebtRem, currentMatchedDebt, priorInstallmentCount]);

  // Set defaults when opened
  useEffect(() => {
    if (isOpen) {
      setType(getSafeInitialType(initialType));
      setCalcInput('0');
      setMerchantName('');
      setDate(getLocalTodayDate());
      setTime(getLocalCurrentTime());
      setDebtDueDate('');
      setSelectedDebtId('');
      setNotes('');
      setTags([]);
      setReceiptUrl('');
      setShowMoreDetails(false);
      setDuplicateWarning(null);
      setSelectedCurrency('INR');
      setForeignAmount('');
      setCustomExchangeRate(1);
      setIsSplitMode(false);
      setSplits([]);
      setSelectedGoalId('');
      setIsRecurring(false);
      setRecurringFrequency('MONTHLY');
      setRecurringInterval(1);
      setRecurringAutoRecord(true);
      setRecurringHasEndDate(false);
      setRecurringEndDate('');
      setSelectedToCardId('');

      // Default account or credit card based on initialAccountId if provided
      if (initialAccountId) {
        const matchingAcc = activeAccounts.find(a => a.id === initialAccountId);
        const matchingCard = activeCreditCards.find(c => c.id === initialAccountId);
        if (matchingAcc) {
          setSelectedAccountId(matchingAcc.id);
          setSelectedCardId('');
        } else if (matchingCard) {
          setSelectedCardId(matchingCard.id);
          setSelectedAccountId('');
        }
      } else {
        const defaultAcc = activeAccounts.find(a => a.isActive && (a.type === 'SALARY' || a.type === 'SAVINGS')) || activeAccounts[0];
        if (defaultAcc) {
          setSelectedAccountId(defaultAcc.id);
          setSelectedCardId('');
        } else if (activeCreditCards.length > 0) {
          setSelectedCardId(activeCreditCards[0].id);
          setSelectedAccountId('');
        } else {
          setSelectedAccountId('');
          setSelectedCardId('');
        }
      }
      if (paymentApps.length > 0) setSelectedPaymentAppId(paymentApps[0].id);

      // Default category based on initial type
      let defaultCatId = 'food_dining';
      if (initialType === 'INVESTMENT_CONTRIBUTION') defaultCatId = 'investments_expense';
      else if (initialType === 'INCOME') defaultCatId = 'salary_income';
      
      const defaultCat = categories.find(c => c.id === defaultCatId) || categories.find(c => c.id === 'food_dining') || categories[0];
      if (defaultCat) setSelectedCategoryId(defaultCat.id);
    }
  }, [isOpen, initialType, initialAccountId, activeAccounts, activeCreditCards, categories, paymentApps]);

  const prevGoalIdRef = useRef<string>('');
  const prevTypeRef = useRef<string>('');
  useEffect(() => {
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
            setSelectedCategoryId('other_income');
          } else {
            setNotes(expectedDepositNote);
            setSelectedCategoryId('investments_expense');
          }
        }
      }
    } else if (prevGoalIdRef.current) {
      const prevGoal = goals.find(g => g.id === prevGoalIdRef.current);
      if (prevGoal) {
        const possibleNotes = [
          `Goal: withdrawal from ${prevGoal.name}`,
          ...Array.from({ length: 100 }, (_, i) => `Goal: deposit towards ${prevGoal.name} - ${i + 1}`)
        ];
        if (possibleNotes.includes(notes)) {
          setNotes('');
        }
      }
    }
    prevGoalIdRef.current = selectedGoalId;
    prevTypeRef.current = type;
  }, [selectedGoalId, type, goals, notes]);

  const prevInvestmentIdRef = useRef<string>('');
  useEffect(() => {
    if (selectedInvestmentId && type === 'INVESTMENT_CONTRIBUTION') {
      const inv = investments.find(i => i.id === selectedInvestmentId);
      if (inv) {
        if (selectedInvestmentId !== prevInvestmentIdRef.current) {
          if (!notes.trim()) {
            setNotes(`Investment contribution to ${inv.name}`);
          }
          
          if (inv.linkedAccountId && accounts.some(a => a.id === inv.linkedAccountId)) {
            setSelectedAccountId(inv.linkedAccountId);
            setSelectedCardId('');
          } else if (inv.linkedCreditCardId && creditCards.some(c => c.id === inv.linkedCreditCardId)) {
            setSelectedCardId(inv.linkedCreditCardId);
            setSelectedAccountId('');
          }
          
          if (inv.linkedPaymentAppId && paymentApps.some(p => p.id === inv.linkedPaymentAppId)) {
            setSelectedPaymentAppId(inv.linkedPaymentAppId);
          }
        }
      }
    }
    prevInvestmentIdRef.current = selectedInvestmentId;
  }, [selectedInvestmentId, type, investments, accounts, creditCards, paymentApps, notes]);

  const lastTypeRef = useRef<TransactionType>(initialType || 'EXPENSE');
  useEffect(() => {
    if (isOpen && type !== lastTypeRef.current) {
      if (type === 'INVESTMENT_CONTRIBUTION') {
        setSelectedCategoryId('investments_expense');
      } else if (type === 'INCOME' && (selectedCategoryId === 'food_dining' || selectedCategoryId === 'investments_expense')) {
        setSelectedCategoryId('salary_income');
      } else if (type === 'EXPENSE' && (selectedCategoryId === 'salary_income' || selectedCategoryId === 'investments_expense')) {
        setSelectedCategoryId('food_dining');
      }
      lastTypeRef.current = type;
    }
  }, [type, isOpen, selectedCategoryId]);

  if (!isOpen) return null;

  // Filter categories by type
  const availableCategories = categories.filter(c => {
    if (type === 'INCOME') return c.type === 'INCOME' || c.type === 'BOTH';
    return c.type === 'EXPENSE' || c.type === 'BOTH';
  });

  const selectedCategoryObj = categories.find(c => c.id === selectedCategoryId);

  // Calculator Keypad Logic
  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setCalcInput('0');
      if (selectedCurrency !== 'INR') setForeignAmount('0');
      return;
    }
    if (val === 'DEL') {
      setCalcInput(prev => {
        const next = prev.length <= 1 ? '0' : prev.slice(0, -1);
        if (selectedCurrency !== 'INR') {
          const inINR = parseFloat(next) || 0;
          setForeignAmount(customExchangeRate > 0 ? (inINR / customExchangeRate).toFixed(2) : '0');
        }
        return next;
      });
      return;
    }
    if (val === '.') {
      if (!calcInput.includes('.')) {
        setCalcInput(prev => prev + '.');
      }
      return;
    }

    setCalcInput(prev => {
      let next = prev === '0' ? val : prev + val;
      if (prev.length >= 8) return prev;
      if (selectedCurrency !== 'INR') {
        const inINR = parseFloat(next) || 0;
        setForeignAmount(customExchangeRate > 0 ? (inINR / customExchangeRate).toFixed(2) : '0');
      }
      return next;
    });
  };

  // Multi-Currency handlers
  const handleCurrencySelect = (code: string) => {
    setSelectedCurrency(code);
    const rate = CURRENCY_RATES[code]?.rateToINR || 1;
    setCustomExchangeRate(rate);
    if (code !== 'INR') {
      const pAmt = parseFloat(calcInput) || 0;
      const fAmt = pAmt > 0 ? (pAmt / rate) : 0;
      setForeignAmount(fAmt > 0 ? fAmt.toFixed(2) : '');
    } else {
      setForeignAmount('');
    }
    setShowCurrencyPicker(false);
  };

  const handleForeignAmountChange = (val: string) => {
    setForeignAmount(val);
    const num = parseFloat(val) || 0;
    const inINR = Math.round(num * customExchangeRate * 100) / 100;
    setCalcInput(inINR > 0 ? inINR.toString() : '0');
  };

  // Split management
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

  // Merchant Autocomplete / Learning Trigger
  const handleMerchantChange = (name: string) => {
    setMerchantName(name);
    if (name.length >= 3) {
      const suggestion = learnMerchantSuggestion(name, transactions, merchants);
      if (suggestion.categoryId) setSelectedCategoryId(suggestion.categoryId);
      if (suggestion.accountId) setSelectedAccountId(suggestion.accountId);
      if (suggestion.creditCardId) setSelectedCardId(suggestion.creditCardId);
      if (suggestion.paymentAppId) setSelectedPaymentAppId(suggestion.paymentAppId);
    }
  };

  // Handle Receipt Upload
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply a template to the current transaction form
  const handleApplyTemplate = (tmpl: TransactionTemplate) => {
    if (tmpl.type) setType(tmpl.type);
    if (tmpl.amount !== undefined && tmpl.amount > 0) {
      setCalcInput(String(tmpl.amount));
    }
    if (tmpl.categoryId) setSelectedCategoryId(tmpl.categoryId);
    if (tmpl.subcategory) setSelectedSubcategory(tmpl.subcategory);
    if (tmpl.merchantName) setMerchantName(tmpl.merchantName);
    
    if (tmpl.accountId) {
      setSelectedAccountId(tmpl.accountId);
      setSelectedCardId('');
    } else if (tmpl.creditCardId) {
      setSelectedCardId(tmpl.creditCardId);
      setSelectedAccountId('');
    }

    if (tmpl.toAccountId) setSelectedToAccountId(tmpl.toAccountId);
    if (tmpl.paymentAppId) setSelectedPaymentAppId(tmpl.paymentAppId);
    if (tmpl.notes) setNotes(tmpl.notes);
    if (tmpl.tags && tmpl.tags.length > 0) setTags(tmpl.tags);
    if (tmpl.splits && tmpl.splits.length > 0) {
      setIsSplitMode(true);
      setSplits(tmpl.splits);
    }

    setAppliedTemplateId(tmpl.id);
    setTemplateSavedNotice(`Applied template "${tmpl.name}"!`);
    setTimeout(() => {
      setTemplateSavedNotice(null);
      setAppliedTemplateId(null);
    }, 2500);
  };

  // Save current input configuration as a reusable template
  const handleSaveAsTemplate = () => {
    const pAmt = parseFloat(calcInput) || 0;
    const cat = categories.find(c => c.id === selectedCategoryId);
    const acc = accounts.find(a => a.id === selectedAccountId);
    const card = creditCards.find(c => c.id === selectedCardId);
    const toAcc = accounts.find(a => a.id === selectedToAccountId);
    const papp = paymentApps.find(p => p.id === selectedPaymentAppId);

    const tmplTitle = merchantName.trim() || cat?.name || 'Quick Template';

    saveTransactionAsTemplate({
      amount: pAmt > 0 ? pAmt : undefined,
      type,
      categoryId: selectedCategoryId,
      categoryName: cat?.name,
      subcategory: selectedSubcategory || undefined,
      merchantName: merchantName.trim() || undefined,
      accountId: selectedAccountId || undefined,
      accountName: acc?.name,
      creditCardId: selectedCardId || undefined,
      creditCardName: card?.name,
      toAccountId: selectedToAccountId || undefined,
      toAccountName: toAcc?.name,
      paymentAppId: selectedPaymentAppId || undefined,
      paymentAppName: papp?.name,
      notes: notes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      splits: isSplitMode && splits.length > 0 ? splits : undefined,
    }, tmplTitle);

    setTemplateSavedNotice(`Saved "${tmplTitle}" as template!`);
    setTimeout(() => setTemplateSavedNotice(null), 3000);
  };

  // Save Transaction
  const handleSave = () => {
    if (parsedAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (type === 'INVESTMENT_CONTRIBUTION' && !selectedInvestmentId) {
      alert('Please select an investment asset to link this contribution to.');
      return;
    }

    if (isSplitMode && splits.length > 0 && Math.abs(totalSplitAmount - parsedAmount) > 0.01) {
      if (!confirm(`Split sum (₹${totalSplitAmount.toFixed(2)}) does not equal total transaction (₹${parsedAmount.toFixed(2)}). Do you want to continue anyway?`)) {
        return;
      }
    }

    const acc = accounts.find(a => a.id === selectedAccountId);
    const card = creditCards.find(c => c.id === selectedCardId);
    const toAcc = accounts.find(a => a.id === selectedToAccountId);
    const toCard = creditCards.find(c => c.id === selectedToCardId);
    const papp = paymentApps.find(p => p.id === selectedPaymentAppId);
    const cat = categories.find(c => c.id === selectedCategoryId);

    // Duplicate check
    const dup = detectDuplicateTransaction(
      {
        amount: parsedAmount,
        date,
        accountId: selectedAccountId,
        creditCardId: selectedCardId,
        merchantName,
        categoryId: selectedCategoryId,
      },
      transactions
    );

    if (dup.isDuplicate && !duplicateWarning) {
      setDuplicateWarning(dup.reason || 'Suspected duplicate transaction');
      return; // Give user a chance to review
    }

    let recurringRuleId: string | undefined = undefined;
    if (isRecurring) {
      const todayStr = new Date().toISOString().substring(0, 10);
      const isPastOrToday = date <= todayStr;
      const nextDueDate = isPastOrToday
        ? calculateNextDueDate(date, recurringFrequency, recurringInterval)
        : date;

      recurringRuleId = addRecurring({
        name: merchantName.trim() || cat?.name || 'Recurring Payment',
        amount: parsedAmount,
        type,
        frequency: recurringFrequency,
        interval: recurringInterval,
        startDate: date,
        nextDueDate,
        lastGeneratedDate: isPastOrToday ? date : undefined,
        endDate: recurringHasEndDate && recurringEndDate ? recurringEndDate : undefined,
        categoryId: (type === 'TRANSFER' || type === 'CARD_PAYMENT' || type.includes('REPAYMENT')) ? 'cat_transfer' : (isSplitMode && splits.length > 0 ? splits[0].categoryId : selectedCategoryId),
        categoryName: type === 'CARD_PAYMENT' ? 'Credit Card Payment' : (type === 'TRANSFER' || type.includes('REPAYMENT') ? 'Transfer' : (isSplitMode && splits.length > 0 ? categories.find(c => c.id === splits[0].categoryId)?.name : cat?.name)),
        subcategory: selectedSubcategory || undefined,
        accountId: selectedAccountId || undefined,
        accountName: acc?.name,
        creditCardId: selectedCardId || undefined,
        creditCardName: card?.name,
        toAccountId: selectedToAccountId || undefined,
        toAccountName: toAcc?.name,
        toCreditCardId: selectedToCardId || undefined,
        toCreditCardName: toCard?.name,
        paymentAppId: selectedPaymentAppId || undefined,
        paymentAppName: papp?.name,
        merchantName: merchantName.trim() || undefined,
        autoRecord: recurringAutoRecord,
        isActive: true,
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
    }

    const finalNotes = notes.trim() || (isLentOrDebtRelated ? suggestedDebtNarration : undefined);

    addTransaction({
      amount: parsedAmount,
      type,
      date,
      time,
      categoryId: (type === 'TRANSFER' || type === 'CARD_PAYMENT' || isLentOrDebtRelated || type === 'INVESTMENT_CONTRIBUTION')
        ? 'cat_transfer'
        : (isSplitMode && splits.length > 0 ? splits[0].categoryId : selectedCategoryId),
      categoryName: type === 'CARD_PAYMENT'
        ? 'Credit Card Payment'
        : type === 'TRANSFER'
        ? 'Transfer'
        : type === 'INVESTMENT_CONTRIBUTION'
        ? 'Investment Contribution'
        : type === 'MONEY_LENT'
        ? 'Money Lent'
        : type === 'MONEY_BORROWED'
        ? 'Money Borrowed'
        : type === 'MONEY_LENT_REPAYMENT'
        ? 'Lent Repayment'
        : type === 'MONEY_BORROWED_REPAYMENT'
        ? 'Borrowed Repayment'
        : (isSplitMode && splits.length > 0 ? categories.find(c => c.id === splits[0].categoryId)?.name : cat?.name),
      subcategory: selectedSubcategory,
      merchantName: isLentOrDebtRelated ? undefined : (merchantName.trim() || undefined),
      accountId: selectedAccountId || undefined,
      accountName: acc?.name,
      creditCardId: selectedCardId || undefined,
      creditCardName: card?.name,
      toAccountId: selectedToAccountId || undefined,
      toAccountName: toAcc?.name,
      toCreditCardId: selectedToCardId || undefined,
      toCreditCardName: toCard?.name,
      paymentAppId: selectedPaymentAppId || undefined,
      paymentAppName: papp?.name,
      debtId: selectedDebtId || undefined,
      debtPersonName: isLentOrDebtRelated ? (merchantName.trim() || undefined) : undefined,
      debtDueDate: (isLentOrBorrowed && debtDueDate) ? debtDueDate : undefined,
      goalId: selectedGoalId || undefined,
      investmentId: selectedInvestmentId || undefined,
      recurringId: recurringRuleId,
      recurringName: isRecurring ? (merchantName.trim() || cat?.name) : undefined,
      notes: finalNotes || undefined,
      tags: tags.length > 0 ? tags : undefined,
      receiptUrl: receiptUrl || undefined,
      splits: isSplitMode && splits.length > 0 ? splits : undefined,
      originalCurrency: selectedCurrency !== 'INR' ? selectedCurrency : undefined,
      originalAmount: selectedCurrency !== 'INR' && foreignAmount ? parseFloat(foreignAmount) : undefined,
      exchangeRate: selectedCurrency !== 'INR' ? customExchangeRate : undefined,
    });

    if (type === 'INCOME' && parsedAmount >= 10000) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {/* Type Selector Pills */}
          <div className="flex space-x-1.5 overflow-x-auto no-scrollbar py-1">
            {(['EXPENSE', 'INCOME', 'TRANSFER', 'CARD_PAYMENT', 'INVESTMENT_CONTRIBUTION', 'MONEY_LENT'] as TransactionType[]).map(t => {
              const isLendBorrowSelected = t === 'MONEY_LENT' && (
                type === 'MONEY_LENT' ||
                type === 'MONEY_BORROWED' ||
                type === 'MONEY_LENT_REPAYMENT' ||
                type === 'MONEY_BORROWED_REPAYMENT'
              );
              const isSelected = isLendBorrowSelected || type === t;
              return (
                <button
                  key={t}
                  onClick={() => {
                    if (t === 'MONEY_LENT') {
                      if (type !== 'MONEY_LENT' && type !== 'MONEY_BORROWED' && type !== 'MONEY_LENT_REPAYMENT' && type !== 'MONEY_BORROWED_REPAYMENT') {
                        setType('MONEY_LENT');
                      }
                    } else {
                      setType(t);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t === 'EXPENSE' && 'Expense'}
                  {t === 'INCOME' && 'Income'}
                  {t === 'TRANSFER' && 'Transfer'}
                  {t === 'CARD_PAYMENT' && 'Card Bill'}
                  {t === 'INVESTMENT_CONTRIBUTION' && 'Invest'}
                  {t === 'MONEY_LENT' && 'Lend / Borrow'}
                </button>
              );
            })}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Templates Bar */}
        <div className="px-4 py-2 bg-slate-100/60 dark:bg-slate-900/90 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 whitespace-nowrap shrink-0 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Templates</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20">{(templates || []).length}</span>
          </button>

          {(templates || []).slice(0, 6).map((tmpl, idx) => {
            const isSelected = appliedTemplateId === tmpl.id;
            return (
              <button
                key={`tmpl_${tmpl.id}_${idx}`}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border whitespace-nowrap shrink-0 font-medium transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-500'
                }`}
              >
                {tmpl.isFavorite && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
                <span className="truncate max-w-[110px]">{tmpl.name}</span>
                {tmpl.amount !== undefined && tmpl.amount > 0 && (
                  <span className="text-[10px] opacity-75 font-semibold">₹{tmpl.amount}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Template Notification Toast */}
        {templateSavedNotice && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-1.5 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-300 animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{templateSavedNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setTemplateSavedNotice(null)}
              className="text-emerald-500 hover:text-emerald-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Amount Display & Quick Utilities */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 space-y-2">
          {/* Quick Utility Chips (Advanced signatures: Currency, SMS Paste, Split, Save Template) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              {/* Currency Button */}
              <button
                type="button"
                onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1 hover:border-emerald-500 shadow-xs transition-all"
              >
                <span>{CURRENCY_RATES[selectedCurrency]?.flag || '🌐'}</span>
                <span>{selectedCurrency}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {/* Split Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !isSplitMode;
                  setIsSplitMode(next);
                  if (next && splits.length === 0) {
                    handleAddSplit();
                  }
                }}
                className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center space-x-1 transition-all ${
                  isSplitMode
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-purple-500'
                }`}
              >
                <Split size={12} />
                <span>Split {isSplitMode ? 'On' : ''}</span>
              </button>

              {/* Save As Template Button */}
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                title="Save current transaction details as a quick template"
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1 hover:border-amber-500 hover:text-amber-500 shadow-xs transition-all"
              >
                <BookmarkPlus size={12} className="text-amber-500" />
                <span className="hidden sm:inline">Save Template</span>
              </button>
            </div>
          </div>

          {/* Currency Dropdown Selector */}
          {showCurrencyPicker && (
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg space-y-2 animate-in fade-in zoom-in-95 duration-100">
              <span className="text-[11px] font-bold text-slate-500 block">Select Original Currency</span>
              <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {Object.values(CURRENCY_RATES).map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCurrencySelect(c.code)}
                    className={`px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                      selectedCurrency === c.code
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200/60 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    <span>{c.flag} {c.code}</span>
                    <span className="text-[9px] opacity-75">{c.symbol}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Foreign Currency Calculation Row */}
          {selectedCurrency !== 'INR' && (
            <div className="p-2.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Globe size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Foreign Amount ({CURRENCY_RATES[selectedCurrency]?.symbol})
                  </span>
                  <p className="text-[10px] text-slate-500">Rate: 1 {selectedCurrency} = ₹{customExchangeRate}</p>
                </div>
              </div>
              <input
                type="number"
                value={foreignAmount}
                onChange={e => handleForeignAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-28 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 text-right font-bold text-slate-900 dark:text-white outline-none"
              />
            </div>
          )}

          {/* Amount In INR Display */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-medium text-slate-400 block">
                {selectedCurrency !== 'INR' ? `Equivalent Total in INR` : `Amount (INR)`}
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white flex items-center">
                <span className="text-emerald-600 dark:text-emerald-400 mr-1 text-2xl">₹</span>
                {calcInput}
              </div>
            </div>
            {duplicateWarning && (
              <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl p-2 max-w-[200px] text-right">
                <div className="flex items-center justify-end text-amber-700 dark:text-amber-400 text-xs font-bold space-x-1">
                  <AlertTriangle size={14} />
                  <span>Duplicate?</span>
                </div>
                <p className="text-[10px] text-amber-600 dark:text-amber-300 mt-0.5 leading-tight">
                  {duplicateWarning}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Sub-Switch for Lend vs Borrow vs Repayments */}
          {(type === 'MONEY_LENT' || type === 'MONEY_BORROWED' || type === 'MONEY_LENT_REPAYMENT' || type === 'MONEY_BORROWED_REPAYMENT') && (
            <div className="space-y-2">
              <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setType('MONEY_LENT');
                    setSelectedDebtId('');
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    type === 'MONEY_LENT'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>💸 Lent (Given)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('MONEY_LENT_REPAYMENT');
                    setSelectedDebtId('');
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    type === 'MONEY_LENT_REPAYMENT'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>↩️ Lent Return</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('MONEY_BORROWED');
                    setSelectedDebtId('');
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    type === 'MONEY_BORROWED'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>🤝 Borrowed (Taken)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('MONEY_BORROWED_REPAYMENT');
                    setSelectedDebtId('');
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    type === 'MONEY_BORROWED_REPAYMENT'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>🔄 Repaid Borrowed</span>
                </button>
              </div>
            </div>
          )}

          {/* Merchant / Description / Person Input */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>
                {type === 'MONEY_LENT'
                  ? 'Lent To (Person Name)'
                  : type === 'MONEY_LENT_REPAYMENT'
                  ? 'Return Received From (Person Name)'
                  : type === 'MONEY_BORROWED'
                  ? 'Borrowed From (Person Name)'
                  : type === 'MONEY_BORROWED_REPAYMENT'
                  ? 'Repaying Back To (Person Name)'
                  : type === 'INCOME'
                  ? 'Source / Payer'
                  : type === 'TRANSFER'
                  ? 'Transfer Narration'
                  : 'Merchant / Narration'}
              </span>
              {type !== 'MONEY_LENT' && type !== 'MONEY_BORROWED' && type !== 'MONEY_LENT_REPAYMENT' && type !== 'MONEY_BORROWED_REPAYMENT' && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center">
                  <Sparkles size={10} className="mr-0.5" /> Auto-suggests
                </span>
              )}
            </label>
            <input
              type="text"
              value={merchantName}
              onChange={e => {
                handleMerchantChange(e.target.value);
                setSelectedDebtId('');
              }}
              placeholder={
                type === 'MONEY_LENT' || type === 'MONEY_LENT_REPAYMENT' || type === 'MONEY_BORROWED' || type === 'MONEY_BORROWED_REPAYMENT'
                  ? 'e.g. Rahul, John Doe, Priya...'
                  : type === 'INCOME'
                  ? 'e.g. Salary, Client, Cashback...'
                  : 'e.g. Swiggy, Blinkit, Uber, Electricity...'
              }
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 text-sm outline-none transition-all"
            />

            {/* Quick Link to Pending Debt for Repayments */}
            {(type === 'MONEY_LENT_REPAYMENT' || type === 'MONEY_BORROWED_REPAYMENT') && debts && debts.some(d => !d.isSettled) && (
              <div className="pt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {type === 'MONEY_LENT_REPAYMENT' ? 'Select Active Borrower:' : 'Select Active Lender:'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {debts
                    .filter(d => !d.isSettled && (type === 'MONEY_LENT_REPAYMENT' ? d.type === 'LENT' : d.type === 'BORROWED'))
                    .map(d => {
                      const rem = d.remainingAmount !== undefined ? d.remainingAmount : d.amount;
                      const isSelected = selectedDebtId === d.id || (merchantName && d.personName.toLowerCase().trim() === merchantName.toLowerCase().trim());
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setSelectedDebtId(d.id);
                            setMerchantName(d.personName);
                            if (calcInput === '0' || !calcInput) {
                              setCalcInput(String(rem));
                            }
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700 hover:border-emerald-400'
                          }`}
                        >
                          <span>{d.personName}</span>
                          <span className="ml-1 opacity-80 font-normal">({formatINR(rem)} due)</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* If in MONEY_LENT or MONEY_BORROWED, show active contacts and offer repayment shortcut */}
            {(type === 'MONEY_LENT' || type === 'MONEY_BORROWED') && debts && debts.some(d => !d.isSettled) && (
              <div className="pt-2 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">Existing open debts:</span>
                  {debts
                    .filter(d => !d.isSettled && (type === 'MONEY_LENT' ? d.type === 'LENT' : d.type === 'BORROWED'))
                    .map(d => {
                      const rem = d.remainingAmount !== undefined ? d.remainingAmount : d.amount;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setSelectedDebtId(d.id);
                            setMerchantName(d.personName);
                          }}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-100 dark:hover:bg-teal-950 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                        >
                          {d.personName} ({formatINR(rem)} balance)
                        </button>
                      );
                    })}
                </div>
                {merchantName && debts.some(d => !d.isSettled && d.personName.toLowerCase().trim() === merchantName.toLowerCase().trim() && (type === 'MONEY_LENT' ? d.type === 'LENT' : d.type === 'BORROWED')) && (
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                    <span>Is <strong>{merchantName}</strong> returning money to you?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setType(type === 'MONEY_LENT' ? 'MONEY_LENT_REPAYMENT' : 'MONEY_BORROWED_REPAYMENT');
                        const targetDebt = debts.find(d => !d.isSettled && d.personName.toLowerCase().trim() === merchantName.toLowerCase().trim());
                        if (targetDebt) {
                          setSelectedDebtId(targetDebt.id);
                          if (calcInput === '0' || !calcInput) {
                            setCalcInput(String(targetDebt.remainingAmount !== undefined ? targetDebt.remainingAmount : targetDebt.amount));
                          }
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 text-[10px]"
                    >
                      Switch to Repayment
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Repayment Breakdown & Part-Payment Status Box */}
            {(type === 'MONEY_LENT_REPAYMENT' || type === 'MONEY_BORROWED_REPAYMENT') && (() => {
              const matchedDebt = debts.find(d =>
                !d.isSettled &&
                (selectedDebtId ? d.id === selectedDebtId : (merchantName && d.personName.toLowerCase().trim() === merchantName.toLowerCase().trim())) &&
                (type === 'MONEY_LENT_REPAYMENT' ? d.type === 'LENT' : d.type === 'BORROWED')
              );
              if (!matchedDebt) return null;
              const currentRem = matchedDebt.remainingAmount !== undefined ? matchedDebt.remainingAmount : matchedDebt.amount;
              const newRemaining = Math.max(0, currentRem - parsedAmount);
              const willSettle = parsedAmount >= currentRem;

              return (
                <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                      <span>Debt: {matchedDebt.personName}</span>
                      <span className="text-[10px] text-slate-500 font-normal">(Total: {formatINR(matchedDebt.amount)})</span>
                    </span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                      Due: {formatINR(currentRem)}
                    </span>
                  </div>

                  {/* Quick percentage fill buttons */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-500 font-medium">Quick fill:</span>
                    <button
                      type="button"
                      onClick={() => setCalcInput(String(Math.round(currentRem * 0.25)))}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                    >
                      25% ({formatINR(Math.round(currentRem * 0.25))})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcInput(String(Math.round(currentRem * 0.5)))}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                    >
                      50% ({formatINR(Math.round(currentRem * 0.5))})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcInput(String(currentRem))}
                      className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700"
                    >
                      Full ({formatINR(currentRem)})
                    </button>
                  </div>

                  {parsedAmount > 0 && (
                    <div className="pt-1 border-t border-emerald-200/50 dark:border-emerald-800/50 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-300">
                        Remaining after this payment: <strong>{formatINR(newRemaining)}</strong>
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        willSettle ? 'bg-emerald-600 text-white' : 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200'
                      }`}>
                        {willSettle ? '✓ Settles in Full' : 'Part Payment / Installment'}
                      </span>
                    </div>
                  )}

                  {suggestedDebtNarration && (
                    <div className="pt-1.5 border-t border-emerald-200/50 dark:border-emerald-800/50 flex flex-wrap items-center justify-between gap-1 text-[11px] text-emerald-900 dark:text-emerald-200">
                      <span className="flex items-center gap-1 font-medium">
                        <FileText size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Auto-Narration:</span>
                      </span>
                      <span className="font-bold bg-white/90 dark:bg-slate-900/90 px-2 py-0.5 rounded-lg border border-emerald-200/80 dark:border-emerald-800/80 text-[11px] shadow-xs">
                        "{suggestedDebtNarration}"
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Expected Due Date for Lent / Borrowed */}
          {(type === 'MONEY_LENT' || type === 'MONEY_BORROWED') && (
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                Expected Repayment Date (Optional)
              </label>
              <CustomDatePicker
                value={debtDueDate}
                onChange={setDebtDueDate}
                placeholder="Select expected return date"
              />
            </div>
          )}

          {/* Feature: Split Transactions UI */}
          {isSplitMode && (
            <div className="p-4 rounded-3xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xs">
                    <Split size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-purple-950 dark:text-purple-200">
                      Transaction Splits ({splits.length})
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Total Allocated: {formatINR(totalSplitAmount)} / {formatINR(parsedAmount)}
                    </p>
                  </div>
                </div>

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

              {/* Split Rows */}
              <div className="space-y-2">
                {splits.map((split, idx) => {
                  return (
                    <div
                      key={`split_${split.id || 'split'}_${idx}`}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-purple-200/60 dark:border-slate-700 space-y-2 shadow-xs"
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
                            className="w-full pl-6 pr-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-bold text-right outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSplit(split.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={split.notes || ''}
                          onChange={e => handleUpdateSplit(split.id, { notes: e.target.value })}
                          placeholder="Note for this split (e.g. Snacks, Groceries)..."
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
                            className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-200 shrink-0"
                          >
                            + Fill Remainder
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAddSplit}
                className="w-full py-2 rounded-2xl border border-dashed border-purple-300 dark:border-purple-700 hover:border-purple-500 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all bg-purple-50/50 dark:bg-purple-900/20"
              >
                <Plus size={14} />
                <span>Add Another Split Category</span>
              </button>
            </div>
          )}

          {/* Category Picker (For Expense, Income when NOT in split mode) */}
          {!isSplitMode && (type === 'EXPENSE' || type === 'INCOME') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center space-x-1 hover:underline"
                >
                  <Settings2 size={12} className="mr-0.5" />
                  <span>Manage / Add Categories</span>
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                {availableCategories.slice(0, 7).map(cat => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setSelectedSubcategory('');
                      }}
                      className={`flex flex-col items-center p-2 rounded-2xl border transition-all text-center group ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm scale-102'
                          : 'border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="mb-1 transition-transform group-hover:scale-105">
                        <Category3DIcon
                          name={cat.icon}
                          categoryName={cat.name}
                          color={cat.color}
                          size="sm"
                          glow={isSelected}
                        />
                      </div>
                      <span className="text-[10px] leading-tight truncate w-full font-medium">{cat.name}</span>
                    </button>
                  );
                })}

                {/* More / Custom Categories Button */}
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="flex flex-col items-center justify-center p-2 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/70 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group text-center"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center mb-1 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                    <Plus size={16} />
                  </div>
                  <span className="text-[10px] font-semibold leading-tight">+ More / Custom</span>
                </button>
              </div>

              {/* Subcategories */}
              {selectedCategoryObj && selectedCategoryObj.subcategories.length > 0 && (
                <div className="flex space-x-1.5 overflow-x-auto no-scrollbar pt-2">
                  {selectedCategoryObj.subcategories.map((sub, idx) => (
                    <button
                      key={`sub_${sub}_${idx}`}
                      type="button"
                      onClick={() => setSelectedSubcategory(sub === selectedSubcategory ? '' : sub)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                        selectedSubcategory === sub
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Investment Selector */}
          {!isSplitMode && type === 'INVESTMENT_CONTRIBUTION' && (
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
                value={selectedInvestmentId}
                onChange={setSelectedInvestmentId}
                options={[
                  { value: '', label: 'Select an investment to log contribution...' },
                  ...investments.filter(i => !i.isDeleted).map(inv => ({
                    value: inv.id,
                    label: `${inv.name} (${formatINR(inv.currentValue)})`
                  }))
                ]}
              />
            </div>
          )}

          {/* Account / Channel Selector with 3D Icons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {type === 'TRANSFER'
                  ? 'From Account'
                  : type === 'CARD_PAYMENT'
                  ? 'Pay From Bank'
                  : type === 'MONEY_LENT'
                  ? 'Paid From Account (Lending Money Out)'
                  : type === 'MONEY_LENT_REPAYMENT'
                  ? 'Deposit Return Into Account (Received Repayment)'
                  : type === 'MONEY_BORROWED'
                  ? 'Deposit Into Account (Borrowed Money Received)'
                  : type === 'MONEY_BORROWED_REPAYMENT'
                  ? 'Pay Back From Account (Returning Borrowed Money)'
                  : type === 'INCOME'
                  ? 'Deposit Into Account'
                  : 'Paid From Account / Card'}
              </label>
              <button
                type="button"
                onClick={() => {
                  setAccountCardDefaultTab(type === 'EXPENSE' ? 'CARD' : 'BANK');
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
                const isSelected = selectedAccountId === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setSelectedCardId('');
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

              {activeCreditCards.map(card => {
                  const isSelected = selectedCardId === card.id && !selectedAccountId;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => {
                        setSelectedCardId(card.id);
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
                          Due: {formatINR(card.currentOutstanding)} • Avail: {formatINR(Math.max(0, card.creditLimit - card.currentOutstanding))}
                        </span>
                      </div>
                    </button>
                  );
                })}

              {/* Add Bank/Card Quick Pill */}
              <button
                type="button"
                onClick={() => {
                  setAccountCardDefaultTab(type === 'EXPENSE' ? 'CARD' : 'BANK');
                  setShowAccountCardModal(true);
                }}
                className="px-3.5 py-2 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all shrink-0"
              >
                <Plus size={14} className="text-emerald-500" />
                <span>+ Add Bank / Card</span>
              </button>
            </div>
          </div>

          {/* Transfer Destination or Card Payment Destination */}
          {type === 'TRANSFER' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">
                To Destination Account / Credit Card
              </label>
              <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
                {activeAccounts.filter(a => a.id !== selectedAccountId).map(acc => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSelectedToAccountId(acc.id);
                      setSelectedToCardId('');
                    }}
                    className={`px-3 py-2 rounded-2xl border text-xs font-medium whitespace-nowrap flex items-center space-x-2.5 transition-all shrink-0 ${
                      selectedToAccountId === acc.id
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-bold shadow-md ring-2 ring-emerald-500/30'
                        : 'border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Bank3DIcon
                      institution={acc.institution}
                      type={acc.type}
                      color={acc.color}
                      size="sm"
                      glow={selectedToAccountId === acc.id}
                    />
                    <div className="text-left">
                      <span className="block leading-tight">{acc.name}</span>
                      <span className={`text-[10px] font-semibold ${selectedToAccountId === acc.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500'}`}>
                        Bal: {formatINR(acc.calculatedBalance)}
                      </span>
                    </div>
                  </button>
                ))}

                {activeCreditCards.filter(c => c.id !== selectedCardId).map(card => {
                  const isSelected = selectedToCardId === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => {
                        setSelectedToCardId(card.id);
                        setSelectedToAccountId('');
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
                          Due: {formatINR(card.currentOutstanding || (card as any).calculatedOutstanding)} • Avail: {formatINR(Math.max(0, card.creditLimit - (card.currentOutstanding || (card as any).calculatedOutstanding)))}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {type === 'CARD_PAYMENT' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">
                Select Credit Card to Pay
              </label>
              <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
                {activeCreditCards.map(card => {
                  const isSelected = selectedToCardId === card.id;
                  return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedToCardId(card.id)}
                    className={`px-3 py-2 rounded-2xl border text-xs font-medium whitespace-nowrap flex items-center space-x-2.5 transition-all shrink-0 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 font-bold shadow-md ring-2 ring-purple-500/30'
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
                        Due: {formatINR(card.currentOutstanding)} • Avail: {formatINR(Math.max(0, card.creditLimit - card.currentOutstanding))}
                      </span>
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment App / Channel Metadata with 3D Icons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Payment App / Channel
              </label>
              <button
                type="button"
                onClick={() => setShowPaymentAppModal(true)}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <Plus size={12} />
                <span>Add / Manage Channels</span>
              </button>
            </div>
            <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
              {paymentApps.map(papp => {
                const isSelected = selectedPaymentAppId === papp.id;
                return (
                  <button
                    key={papp.id}
                    type="button"
                    onClick={() => setSelectedPaymentAppId(isSelected ? '' : papp.id)}
                    className={`px-3 py-2 rounded-2xl border text-xs font-medium whitespace-nowrap flex items-center space-x-2 transition-all shrink-0 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-bold shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <PaymentApp3DIcon
                      name={papp.name}
                      symbol={papp.symbol}
                      icon={papp.icon}
                      color={papp.color}
                      gradient={papp.gradient}
                      size="sm"
                      glow={isSelected}
                    />
                    <span>{papp.name}</span>
                  </button>
                );
              })}

              {/* Add Custom Payment App Button */}
              <button
                type="button"
                onClick={() => setShowPaymentAppModal(true)}
                className="px-3.5 py-2 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all shrink-0"
              >
                <Plus size={14} className="text-emerald-500" />
                <span>+ Add Channel</span>
              </button>
            </div>
          </div>

          {/* Recurring Payment / Subscription Option */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs">
                  <Repeat size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    Repeat this transaction
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Auto-creates entries on due dates (Rent, Subscriptions, Salary, SIP)
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={e => setIsRecurring(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-750 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {isRecurring && (
              <div className="pt-2 border-t border-indigo-200/50 dark:border-indigo-800/50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Frequency
                    </label>
                    <CustomSelect
                      value={recurringFrequency}
                      onChange={val => setRecurringFrequency(val as RecurrenceFrequency)}
                      options={[
                        { value: 'MONTHLY', label: 'Monthly', sublabel: 'Rent, Subscriptions, SIP' },
                        { value: 'WEEKLY', label: 'Weekly', sublabel: 'Groceries, Allowance' },
                        { value: 'DAILY', label: 'Daily', sublabel: 'Milk, Newspaper' },
                        { value: 'QUARTERLY', label: 'Quarterly', sublabel: 'School Fees, Taxes' },
                        { value: 'HALF_YEARLY', label: 'Half Yearly', sublabel: 'Maintenance' },
                        { value: 'YEARLY', label: 'Yearly', sublabel: 'Insurance, Annual Plan' },
                      ]}
                      size="sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Repeat Every
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={recurringInterval}
                        onChange={e => setRecurringInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-16 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 text-xs font-bold text-center outline-none"
                      />
                      <span className="text-xs text-slate-500">
                        {recurringFrequency === 'DAILY'
                          ? 'day(s)'
                          : recurringFrequency === 'WEEKLY'
                          ? 'week(s)'
                          : recurringFrequency === 'MONTHLY'
                          ? 'month(s)'
                          : recurringFrequency === 'QUARTERLY'
                          ? 'quarter(s)'
                          : recurringFrequency === 'YEARLY'
                          ? 'year(s)'
                          : 'period(s)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Auto Record Checkbox */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="rec_auto_record"
                    checked={recurringAutoRecord}
                    onChange={e => setRecurringAutoRecord(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <label htmlFor="rec_auto_record" className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    Automatically create transaction on due date without manual approval
                  </label>
                </div>

                {/* Optional End Date */}
                <div className="pt-1">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <input
                      type="checkbox"
                      id="rec_end_date_toggle"
                      checked={recurringHasEndDate}
                      onChange={e => setRecurringHasEndDate(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <label htmlFor="rec_end_date_toggle" className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                      Set end date / tenure limit
                    </label>
                  </div>
                  {recurringHasEndDate && (
                    <CustomDatePicker
                      value={recurringEndDate}
                      onChange={d => setRecurringEndDate(d)}
                      placeholder="Select end date..."
                      size="sm"
                      clearable={true}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Progressive Disclosure: Add More Details */}
          <div>
            <button
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 py-1"
            >
              <span>{showMoreDetails ? '− Less details' : '+ Add more details (Tags, Receipt, Notes, Date)'}</span>
            </button>

            {showMoreDetails && (
              <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-3">
                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <CustomDatePicker
                      label="Date"
                      value={date}
                      onChange={d => setDate(d)}
                      size="sm"
                    />
                  </div>
                  <div>
                    <CustomTimePicker
                      label="Time"
                      value={time}
                      onChange={t => setTime(t)}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-500">Notes / Remarks</label>
                    {isLentOrDebtRelated && suggestedDebtNarration && !notes.trim() && (
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                        Auto: "{suggestedDebtNarration}"
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={suggestedDebtNarration ? `Auto: ${suggestedDebtNarration}` : "Add brief note..."}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                {/* Goal Linkage */}
                {goals.length > 0 && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1 flex items-center space-x-1">
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
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1 flex items-center space-x-1">
                      <span className="text-teal-600 dark:text-teal-400 font-black">📈</span>
                      <span>Link to Investment</span>
                    </label>
                    <CustomSelect
                      value={selectedInvestmentId}
                      onChange={setSelectedInvestmentId}
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

                {/* Tags */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_TAGS.map((tag, idx) => {
                      const hasTag = tags.includes(tag);
                      return (
                        <button
                          key={`tag_${tag}_${idx}`}
                          type="button"
                          onClick={() => {
                            setTags(prev =>
                              hasTag ? prev.filter(t => t !== tag) : [...prev, tag]
                            );
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                            hasTag
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Receipt Upload */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Receipt Attachment</label>
                  <div className="flex items-center space-x-3">
                    <label className="cursor-pointer px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300 flex items-center space-x-1.5 hover:border-emerald-500">
                      <Camera size={14} />
                      <span>{receiptUrl ? 'Change Receipt' : 'Attach Bill Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                    </label>
                    {receiptUrl && (
                      <div className="relative">
                        <img src={receiptUrl} alt="Receipt" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                        <button
                          onClick={() => setReceiptUrl('')}
                          className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Calculator Keypad */}
          <div className="pt-2">
            <div className="grid grid-cols-4 gap-2">
              {['7', '8', '9', 'DEL', '4', '5', '6', 'C', '1', '2', '3', '.', '0', '00'].map(k => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadPress(k)}
                  className={`h-11 rounded-2xl text-sm font-bold active:scale-95 transition-all flex items-center justify-center ${
                    k === 'DEL' || k === 'C'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-100 dark:border-rose-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-200'
                  }`}
                >
                  {k === 'DEL' ? <Delete size={18} /> : k}
                </button>
              ))}
              <button
                type="button"
                onClick={handleSave}
                className="col-span-2 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-bold flex items-center justify-center space-x-1 shadow-md shadow-emerald-600/30 transition-all"
              >
                <Check size={18} />
                <span>Save Transaction</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Management Modal */}
      <InvestmentManagementModal 
        isOpen={showInvestmentModal} 
        onClose={() => setShowInvestmentModal(false)} 
      />

      {/* Category Management Modal */}
      {showCategoryModal && (
        <CategoryManagementModal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onSelectCategory={(cat) => {
            setSelectedCategoryId(cat.id);
            setSelectedSubcategory('');
            setShowCategoryModal(false);
          }}
        />
      )}

      {/* Template Management Modal */}
      {showTemplateModal && (
        <TemplateManagementModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onSelectTemplate={handleApplyTemplate}
        />
      )}

      {/* Payment App / Channel Management Modal */}
      {showPaymentAppModal && (
        <PaymentAppManagementModal
          isOpen={showPaymentAppModal}
          onClose={() => setShowPaymentAppModal(false)}
          onSelectPaymentApp={app => {
            setSelectedPaymentAppId(app.id);
          }}
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
            setSelectedCardId('');
          }}
          onCreatedCard={card => {
            setSelectedCardId(card.id);
            setSelectedAccountId('');
          }}
        />
      )}
    </div>
  );
};
