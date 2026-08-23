import React, { useState, useEffect, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { TransactionType, Category, Account, CreditCard, PaymentApp, SplitItem, RecurrenceFrequency, TransactionTemplate } from '../../types';
import { formatINR, CURRENCY_RATES, convertCurrency, formatForeignCurrency } from '../../lib/currency';
import { parseBankSMS } from '../../lib/smsParser';
import { IconHelper, Category3DIcon, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import { CategoryManagementModal } from '../categories/CategoryManagementModal';
import { TemplateManagementModal } from '../templates/TemplateManagementModal';
import { NetworkLogo } from '../common/CardVisual';
import { learnMerchantSuggestion, detectDuplicateTransaction } from '../../lib/accountingEngine';
import { calculateNextDueDate } from '../../lib/recurringEngine';
import { POPULAR_TAGS, CARD_THEMES, INDIAN_BANKS } from '../../lib/constants';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { CustomTimePicker } from '../common/CustomTimePicker';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { PaymentAppManagementModal } from '../paymentApps/PaymentAppManagementModal';
import { AddAccountOrCardModal } from '../accounts/AddAccountOrCardModal';
import {
  X,
  Check,
  Delete,
  Camera,
  Calendar,
  Tag,
  FileText,
  ChevronDown,
  AlertTriangle,
  Sparkles,
  Plus,
  Layers,
  Settings2,
  Split,
  Globe,
  MessageSquareCode,
  Coins,
  Trash2,
  Target,
  ArrowRight,
  RefreshCw,
  Repeat,
  Zap,
  Star,
  BookmarkPlus,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'EXPENSE',
}) => {
  const {
    accounts,
    creditCards,
    categories,
    paymentApps,
    merchants,
    transactions,
    goals,
    templates,
    saveTransactionAsTemplate,
    addTransaction,
    addRecurring,
  } = useMoney();

  const [type, setType] = useState<TransactionType>(initialType);
  const [calcInput, setCalcInput] = useState<string>('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [merchantName, setMerchantName] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [selectedToAccountId, setSelectedToAccountId] = useState<string>('');
  const [selectedPaymentAppId, setSelectedPaymentAppId] = useState<string>('');
  const [debtPersonName, setDebtPersonName] = useState<string>('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [templateSavedNotice, setTemplateSavedNotice] = useState<string | null>(null);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  // Cashew Feature: Multi-Currency
  const [selectedCurrency, setSelectedCurrency] = useState<string>('INR');
  const [foreignAmount, setForeignAmount] = useState<string>('');
  const [customExchangeRate, setCustomExchangeRate] = useState<number>(1);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState<boolean>(false);

  // Cashew Feature: Transaction Splits
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [splits, setSplits] = useState<SplitItem[]>([]);

  // Recurring Payments Feature
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurrenceFrequency>('MONTHLY');
  const [recurringInterval, setRecurringInterval] = useState<number>(1);
  const [recurringAutoRecord, setRecurringAutoRecord] = useState<boolean>(true);
  const [recurringHasEndDate, setRecurringHasEndDate] = useState<boolean>(false);
  const [recurringEndDate, setRecurringEndDate] = useState<string>('');

  // Cashew Feature: SMS Parser Quick-Fill
  const [showSmsDrawer, setShowSmsDrawer] = useState<boolean>(false);
  const [smsRawText, setSmsRawText] = useState<string>('');
  const [smsParseMessage, setSmsParseMessage] = useState<string | null>(null);

  // Progressive Disclosure
  const [showMoreDetails, setShowMoreDetails] = useState<boolean>(false);
  const [showPaymentAppModal, setShowPaymentAppModal] = useState<boolean>(false);
  const [showAccountCardModal, setShowAccountCardModal] = useState<boolean>(false);
  const [accountCardDefaultTab, setAccountCardDefaultTab] = useState<'BANK' | 'CARD' | 'WALLET'>('BANK');
  const [date, setDate] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [time, setTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const activeAccounts = useMemo(() => accounts.filter(a => !a.isDeleted), [accounts]);
  const activeCreditCards = useMemo(() => creditCards.filter(c => !c.isDeleted), [creditCards]);

  // Set defaults when opened
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setCalcInput('0');
      setMerchantName('');
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
      setShowSmsDrawer(false);
      setSmsRawText('');
      setSmsParseMessage(null);
      setSelectedGoalId('');
      setIsRecurring(false);
      setRecurringFrequency('MONTHLY');
      setRecurringInterval(1);
      setRecurringAutoRecord(true);
      setRecurringHasEndDate(false);
      setRecurringEndDate('');

      // Default account: first active non-deleted salary or savings account
      const defaultAcc = activeAccounts.find(a => a.isActive && (a.type === 'SALARY' || a.type === 'SAVINGS')) || activeAccounts[0];
      if (defaultAcc) setSelectedAccountId(defaultAcc.id);
      else setSelectedAccountId('');

      if (activeCreditCards.length > 0) setSelectedCardId(activeCreditCards[0].id);
      else setSelectedCardId('');
      if (paymentApps.length > 0) setSelectedPaymentAppId(paymentApps[0].id);

      // Default category for expense
      const defaultCat = categories.find(c => c.id === 'food_dining') || categories[0];
      if (defaultCat) setSelectedCategoryId(defaultCat.id);
    }
  }, [isOpen, initialType, activeAccounts, activeCreditCards, categories, paymentApps]);

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

  // SMS Parser Handler
  const handleParseSMS = (text: string) => {
    const result = parseBankSMS(text);
    if (result) {
      if (result.amount) setCalcInput(result.amount.toString());
      if (result.type) setType(result.type);
      if (result.merchant) setMerchantName(result.merchant);
      if (result.suggestedCategoryId) setSelectedCategoryId(result.suggestedCategoryId);
      if (result.date) setDate(result.date);

      if (result.accountLast4) {
        const matchCard = creditCards.find(c => c.lastFourDigits === result.accountLast4);
        if (matchCard) {
          setSelectedCardId(matchCard.id);
          setSelectedAccountId('');
        } else {
          const matchAcc = accounts.find(
            a => a.accountNumberLast4 === result.accountLast4 || (result.bankName && a.institution.toLowerCase().includes(result.bankName.toLowerCase()))
          );
          if (matchAcc) setSelectedAccountId(matchAcc.id);
        }
      } else if (result.bankName) {
        const matchAcc = accounts.find(a => a.institution.toLowerCase().includes(result.bankName!.toLowerCase()));
        if (matchAcc) setSelectedAccountId(matchAcc.id);
      }

      if (result.paymentApp) {
        const matchApp = paymentApps.find(p => p.name.toLowerCase().includes(result.paymentApp!.toLowerCase()));
        if (matchApp) setSelectedPaymentAppId(matchApp.id);
      }

      if (result.referenceNumber) {
        setNotes(`Ref: ${result.referenceNumber}`);
      }

      setSmsParseMessage(`✓ Extracted ${result.type} of ₹${result.amount || 0} ${result.merchant ? 'at ' + result.merchant : ''}`);
      setTimeout(() => {
        setShowSmsDrawer(false);
        setSmsParseMessage(null);
      }, 1000);
    } else {
      setSmsParseMessage('Could not parse SMS format. Try pasting full bank alert.');
    }
  };

  // Split management
  const totalSplitAmount = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const parsedAmount = Math.max(0, parseFloat(calcInput) || 0);
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

    if (isSplitMode && splits.length > 0 && Math.abs(totalSplitAmount - parsedAmount) > 0.01) {
      if (!confirm(`Split sum (₹${totalSplitAmount.toFixed(2)}) does not equal total transaction (₹${parsedAmount.toFixed(2)}). Do you want to continue anyway?`)) {
        return;
      }
    }

    const acc = accounts.find(a => a.id === selectedAccountId);
    const card = creditCards.find(c => c.id === selectedCardId);
    const toAcc = accounts.find(a => a.id === selectedToAccountId);
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
        categoryId: isSplitMode && splits.length > 0 ? splits[0].categoryId : selectedCategoryId,
        categoryName: isSplitMode && splits.length > 0 ? categories.find(c => c.id === splits[0].categoryId)?.name : cat?.name,
        subcategory: selectedSubcategory || undefined,
        accountId: (type === 'EXPENSE' && selectedCardId && !selectedAccountId) ? undefined : selectedAccountId,
        accountName: acc?.name,
        creditCardId: (type === 'CARD_PAYMENT' || (type === 'EXPENSE' && selectedCardId)) ? selectedCardId : undefined,
        creditCardName: card?.name,
        toAccountId: selectedToAccountId || undefined,
        toAccountName: toAcc?.name,
        paymentAppId: selectedPaymentAppId || undefined,
        paymentAppName: papp?.name,
        merchantName: merchantName.trim() || undefined,
        autoRecord: recurringAutoRecord,
        isActive: true,
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
    }

    addTransaction({
      amount: parsedAmount,
      type,
      date,
      time,
      categoryId: isSplitMode && splits.length > 0 ? splits[0].categoryId : selectedCategoryId,
      categoryName: isSplitMode && splits.length > 0 ? categories.find(c => c.id === splits[0].categoryId)?.name : cat?.name,
      subcategory: selectedSubcategory,
      merchantName: merchantName.trim() || undefined,
      accountId: (type === 'EXPENSE' && selectedCardId && !selectedAccountId) ? undefined : selectedAccountId,
      accountName: acc?.name,
      creditCardId: (type === 'CARD_PAYMENT' || (type === 'EXPENSE' && selectedCardId)) ? selectedCardId : undefined,
      creditCardName: card?.name,
      toAccountId: selectedToAccountId || undefined,
      toAccountName: toAcc?.name,
      paymentAppId: selectedPaymentAppId || undefined,
      paymentAppName: papp?.name,
      debtPersonName: debtPersonName.trim() || undefined,
      goalId: selectedGoalId || undefined,
      recurringId: recurringRuleId,
      recurringName: isRecurring ? (merchantName.trim() || cat?.name) : undefined,
      notes: notes.trim() || undefined,
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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {/* Type Selector Pills */}
          <div className="flex space-x-1.5 overflow-x-auto no-scrollbar py-1">
            {(['EXPENSE', 'INCOME', 'TRANSFER', 'CARD_PAYMENT', 'MONEY_LENT'] as TransactionType[]).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  type === t
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {t === 'EXPENSE' && 'Expense'}
                {t === 'INCOME' && 'Income'}
                {t === 'TRANSFER' && 'Transfer'}
                {t === 'CARD_PAYMENT' && 'Card Bill'}
                {t === 'MONEY_LENT' && 'Lend / Borrow'}
              </button>
            ))}
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

          {(templates || []).slice(0, 6).map(tmpl => {
            const isSelected = appliedTemplateId === tmpl.id;
            return (
              <button
                key={tmpl.id}
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
          {/* Quick Utility Chips (Cashew signatures: Currency, SMS Paste, Split, Save Template) */}
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

            {/* SMS Parser Button */}
            <button
              type="button"
              onClick={() => setShowSmsDrawer(!showSmsDrawer)}
              className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all shadow-xs"
            >
              <Sparkles size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>Paste Bank SMS</span>
            </button>
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

          {/* SMS Paste Quick Drawer */}
          {showSmsDrawer && (
            <div className="p-3 bg-emerald-50/90 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2 animate-in fade-in duration-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center space-x-1">
                  <MessageSquareCode size={14} />
                  <span>Paste Bank or UPI SMS / Alert</span>
                </span>
                <button
                  onClick={() => setShowSmsDrawer(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <textarea
                value={smsRawText}
                onChange={e => setSmsRawText(e.target.value)}
                placeholder="e.g. Sent Rs.450.00 from HDFC Bank A/C XX4920 to STARBUCKS via UPI on 16-Aug Ref 429182301"
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-700 text-xs text-slate-800 dark:text-slate-100 outline-none resize-none"
              />

              {/* Sample Bank SMS Chips for quick testing */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 block">Or test with samples:</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const txt = 'Sent Rs. 650.00 from HDFC Bank A/C XX4920 to SWIGGY on 16-Aug Ref 994827';
                      setSmsRawText(txt);
                      handleParseSMS(txt);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 text-[10px] font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-100"
                  >
                    HDFC Swiggy (₹650)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const txt = 'INR 2,499.00 spent on ICICI Bank Credit Card XX1029 at BLINKIT GROCERIES on 16-Aug';
                      setSmsRawText(txt);
                      handleParseSMS(txt);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 text-[10px] font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-100"
                  >
                    ICICI Blinkit (₹2,499)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const txt = 'Dear SBI User, A/C 9812 Credited with Rs 75,000.00 by SALARY AUGUST on 16-Aug';
                      setSmsRawText(txt);
                      handleParseSMS(txt);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 text-[10px] font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-100"
                  >
                    SBI Salary (₹75k)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {smsParseMessage ? (
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    {smsParseMessage}
                  </span>
                ) : <span />}
                <button
                  type="button"
                  onClick={() => handleParseSMS(smsRawText)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all flex items-center space-x-1"
                >
                  <span>Auto-Fill Form</span>
                  <ArrowRight size={12} />
                </button>
              </div>
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
          {/* Merchant / Description Input with Auto-learn */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Merchant / Narration</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center">
                <Sparkles size={10} className="mr-0.5" /> Auto-suggests
              </span>
            </label>
            <input
              type="text"
              value={merchantName}
              onChange={e => handleMerchantChange(e.target.value)}
              placeholder="e.g. Swiggy, Blinkit, Uber, Electricity..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 text-sm outline-none transition-all"
            />
          </div>

          {/* Cashew Feature: Split Transactions UI */}
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
                {splits.map((split, index) => {
                  const splitCat = categories.find(c => c.id === split.categoryId);
                  return (
                    <div
                      key={split.id}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-purple-200/60 dark:border-slate-700 space-y-2 shadow-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <select
                          value={split.categoryId}
                          onChange={e => handleUpdateSplit(split.id, { categoryId: e.target.value })}
                          className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
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

          {/* Category Picker (For Expense & Income when NOT in split mode) */}
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
                  {selectedCategoryObj.subcategories.map(sub => (
                    <button
                      key={sub}
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

          {/* Account / Channel Selector with 3D Icons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {type === 'TRANSFER' ? 'From Account' : type === 'CARD_PAYMENT' ? 'Pay From Bank' : 'Paid From Account / Card'}
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
                      <span className="text-[10px] text-slate-400 font-normal">
                        {acc.institution}
                      </span>
                    </div>
                  </button>
                );
              })}

              {type === 'EXPENSE' &&
                activeCreditCards.map(card => {
                  const isSelected = selectedCardId === card.id && !selectedAccountId;
                  const theme = CARD_THEMES.find(t => t.id === card.cardTheme) || CARD_THEMES[0];
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
                          ? `border-purple-500 bg-gradient-to-r ${theme.gradient} text-white font-bold shadow-lg ring-2 ring-purple-500/40`
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
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                          ••{card.lastFourDigits} • {card.network}
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
                To Destination Account
              </label>
              <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
                {activeAccounts.filter(a => a.id !== selectedAccountId).map(acc => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedToAccountId(acc.id)}
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
                      <span className="text-[10px] text-slate-400 font-normal">
                        {acc.institution}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'CARD_PAYMENT' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">
                Select Credit Card to Pay
              </label>
              <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
                {activeCreditCards.map(card => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedCardId(card.id)}
                    className={`px-3 py-2 rounded-2xl border text-xs font-medium whitespace-nowrap flex items-center space-x-2.5 transition-all shrink-0 ${
                      selectedCardId === card.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 font-bold shadow-md ring-2 ring-purple-500/30'
                        : 'border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Bank3DIcon
                      institution={card.issuer}
                      type="CREDIT_CARD"
                      color={card.color || '#9333ea'}
                      size="sm"
                      glow={selectedCardId === card.id}
                    />
                    <div className="text-left">
                      <span className="block leading-tight">{card.name}</span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-300 font-semibold">
                        Due: {formatINR(card.currentOutstanding)}
                      </span>
                    </div>
                  </button>
                ))}
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
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add brief note..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>

                {/* Goal Linkage */}
                {goals.length > 0 && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1 flex items-center space-x-1">
                      <Target size={12} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Link to Savings Goal</span>
                    </label>
                    <select
                      value={selectedGoalId}
                      onChange={e => setSelectedGoalId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
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

                {/* Tags */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_TAGS.map(tag => {
                      const hasTag = tags.includes(tag);
                      return (
                        <button
                          key={tag}
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

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />

      {/* Template Management Modal */}
      <TemplateManagementModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={handleApplyTemplate}
      />

      {/* Payment App / Channel Management Modal */}
      <PaymentAppManagementModal
        isOpen={showPaymentAppModal}
        onClose={() => setShowPaymentAppModal(false)}
        onSelectPaymentApp={app => {
          setSelectedPaymentAppId(app.id);
        }}
      />

      {/* Add Account / Card Modal */}
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
    </div>
  );
};
