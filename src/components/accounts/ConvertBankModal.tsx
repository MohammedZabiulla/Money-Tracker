import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { Bank3DIcon } from '../common/Bank3DIcon';
import {
  X,
  ArrowRightLeft,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  History,
  Search,
  Check,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
  Sliders,
  Calendar,
  CreditCard as CreditCardIcon,
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

  // Active non-deleted bank accounts
  const bankAccounts = useMemo(() => {
    return accounts.filter(a => !a.isDeleted);
  }, [accounts]);

  // Selected account ID state
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

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
  const [catalogSearchModalOpen, setCatalogSearchModalOpen] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');

  // Track the current active account strictly based on selectedAccountId
  const activeAccount = useMemo(() => {
    if (selectedAccountId) {
      const found = bankAccounts.find(a => a.id === selectedAccountId);
      if (found) return found;
    }
    if (targetAccount) return targetAccount;
    return bankAccounts[0] || null;
  }, [bankAccounts, selectedAccountId, targetAccount]);

  // Keep track of the last processed account ID to prevent redundant resets
  const lastProcessedAccIdRef = useRef<string | null>(null);

  // Synchronize selectedAccountId when modal opens or targetAccount changes
  useEffect(() => {
    if (isOpen) {
      const targetId = targetAccount?.id || (bankAccounts.length > 0 ? bankAccounts[0].id : '');
      setSelectedAccountId(targetId);
      lastProcessedAccIdRef.current = null; // Force re-initialization of form for this account
    }
  }, [isOpen, targetAccount, bankAccounts]);

  // Smart detect preset function for a given account
  const populateFormForAccount = (acc: Account) => {
    const bankName = acc.institution || 'HDFC Bank';
    const accName = acc.name || '';
    setIssuer(bankName);
    setLastFourDigits(acc.accountNumberLast4 || '4589');

    // Check if the account name itself matches a known card in catalog (e.g. "Amazon Pay", "Scapia", "Coral", "Millennia")
    const lowerName = accName.toLowerCase();
    const exactCardMatch = BANK_CREDIT_CARDS_CATALOG.find(c => {
      const cLower = c.name.toLowerCase();
      return (
        lowerName.includes(cLower) ||
        cLower.includes(lowerName.replace(/bank|a\/c|account|cc|card/gi, '').trim())
      );
    });

    if (exactCardMatch) {
      setCardName(exactCardMatch.name);
      setIssuer(exactCardMatch.issuer);
      setNetwork(exactCardMatch.network || 'VISA');
      setCardTheme(exactCardMatch.theme || 'midnight');
      setCardVariant(exactCardMatch.tier || exactCardMatch.category || 'Premium');
      setCreditLimit(exactCardMatch.limit.toString());
      setStatementDate(exactCardMatch.statementDay?.toString() || '15');
      setDueDate(exactCardMatch.dueDay?.toString() || '5');
      setNotes(exactCardMatch.perks || `Converted from ${acc.name}`);
      return;
    }

    // Look up bank card presets by institution/bank
    const matchingCards = getCardsForBank(bankName);
    if (matchingCards.length > 0) {
      const defaultCard = matchingCards[0];
      setCardName(defaultCard.name);
      setIssuer(defaultCard.issuer);
      setNetwork(defaultCard.network || 'VISA');
      setCardTheme(defaultCard.theme || 'midnight');
      setCardVariant(defaultCard.tier || defaultCard.category || 'Premium');
      setCreditLimit(defaultCard.limit.toString());
      setStatementDate(defaultCard.statementDay?.toString() || '15');
      setDueDate(defaultCard.dueDay?.toString() || '5');
      setNotes(defaultCard.perks || `Converted from ${acc.name}`);
    } else {
      setCardName(`${acc.name} Credit Card`);
      setIssuer(bankName);
      setNetwork('VISA');
      setCardTheme('midnight');
      setCardVariant('Platinum Rewards');
      setCreditLimit('150000');
      setStatementDate('15');
      setDueDate('5');
      setNotes(`Converted from ${acc.name} (${acc.institution})`);
    }
  };

  // Re-populate form whenever activeAccount actually changes
  useEffect(() => {
    if (activeAccount && activeAccount.id !== lastProcessedAccIdRef.current) {
      lastProcessedAccIdRef.current = activeAccount.id;
      populateFormForAccount(activeAccount);
    }
  }, [activeAccount]);

  // Related transactions count for the active account
  const relatedTransactionsCount = useMemo(() => {
    if (!activeAccount) return 0;
    return transactions.filter(
      t => !t.isDeleted && (t.accountId === activeAccount.id || t.toAccountId === activeAccount.id)
    ).length;
  }, [transactions, activeAccount]);

  // Available card suggestions for the currently selected bank/issuer
  const bankCardSuggestions = useMemo(() => {
    const currentBank = issuer || activeAccount?.institution || '';
    if (!currentBank) return BANK_CREDIT_CARDS_CATALOG.slice(0, 4);
    const cards = getCardsForBank(currentBank);
    return cards.slice(0, 4);
  }, [issuer, activeAccount]);

  const applyPreset = (preset: BankCardCatalogItem) => {
    setCardName(preset.name);
    setIssuer(preset.issuer);
    setNetwork(preset.network);
    setCardTheme(preset.theme);
    setCardVariant(preset.tier || preset.category || 'Premium');
    setCreditLimit(preset.limit.toString());
    if (preset.statementDay) setStatementDate(preset.statementDay.toString());
    if (preset.dueDay) setDueDate(preset.dueDay.toString());
    if (preset.perks) {
      setNotes(preset.perks);
    }
  };

  // Validation & Detection Analysis Engine
  const detectionValidation = useMemo(() => {
    const trimmedCardName = cardName.trim().toLowerCase();
    const sourceInstitution = (activeAccount?.institution || '').toLowerCase();
    const selectedIssuer = (issuer || '').toLowerCase();

    // Find if cardName matches any catalog card
    const catalogMatch = BANK_CREDIT_CARDS_CATALOG.find(c => {
      const cName = c.name.toLowerCase();
      return (
        cName === trimmedCardName ||
        trimmedCardName.includes(cName) ||
        cName.includes(trimmedCardName)
      );
    });

    const isIssuerAligned =
      !sourceInstitution ||
      !selectedIssuer ||
      sourceInstitution.includes(selectedIssuer) ||
      selectedIssuer.includes(sourceInstitution);

    // Mismatch scenarios
    let status: 'MATCH_CONFIRMED' | 'CROSS_ISSUER_WARNING' | 'CUSTOM_CONFIG' | 'INVALID_PARAMS' =
      'CUSTOM_CONFIG';
    let message = '';
    let description = '';

    const numLimit = Number(creditLimit) || 0;
    const numOutstanding = Number(openingBalance) || 0;
    const numStmtDay = Number(statementDate) || 0;
    const numDueDay = Number(dueDate) || 0;

    if (numLimit <= 0 || numStmtDay < 1 || numStmtDay > 31 || numDueDay < 1 || numDueDay > 31) {
      status = 'INVALID_PARAMS';
      message = 'Incomplete or Invalid Card Parameters';
      description =
        'Please ensure a valid Credit Limit (> ₹0) and Statement/Due days (1–31) are specified.';
    } else if (catalogMatch) {
      const matchIssuerLower = catalogMatch.issuer.toLowerCase();
      const isMatchIssuerSameAsSelected =
        matchIssuerLower.includes(selectedIssuer) || selectedIssuer.includes(matchIssuerLower);

      if (!isMatchIssuerSameAsSelected) {
        status = 'CROSS_ISSUER_WARNING';
        message = `Card Variant Belongs to ${catalogMatch.issuer}`;
        description = `"${catalogMatch.name}" is officially issued by ${catalogMatch.issuer}, but your selected issuer is "${issuer}". You can easily sync issuer or keep custom.`;
      } else {
        status = 'MATCH_CONFIRMED';
        message = `Confirmed ${catalogMatch.issuer} Preset`;
        description = `Identified as ${catalogMatch.name} (${catalogMatch.tier || catalogMatch.category || 'Premium Tier'}) with verified perks and parameters.`;
      }
    } else {
      status = 'CUSTOM_CONFIG';
      message = 'Custom Card Configuration';
      description = `"${cardName}" is configured with custom tier "${cardVariant || 'Standard'}" for ${issuer}.`;
    }

    const overlimit = numOutstanding > numLimit && numLimit > 0;

    return {
      status,
      message,
      description,
      catalogMatch,
      isIssuerAligned,
      overlimit,
      numLimit,
      numOutstanding,
    };
  }, [
    cardName,
    issuer,
    activeAccount,
    creditLimit,
    openingBalance,
    statementDate,
    dueDate,
    cardVariant,
  ]);

  // Live preview card object
  const previewCard: CreditCard = useMemo(() => {
    const numLimit = Number(creditLimit) || 100000;
    const numOutstanding = Number(openingBalance) || 0;
    return {
      id: 'preview_card',
      name: cardName.trim() || 'Credit Card Name',
      issuer: issuer.trim() || activeAccount?.institution || 'Bank Issuer',
      network: network || 'VISA',
      cardTheme: cardTheme || 'midnight',
      cardVariant: cardVariant || 'Super Premium',
      lastFourDigits: lastFourDigits || activeAccount?.accountNumberLast4 || '4589',
      creditLimit: numLimit,
      openingBalance: numOutstanding,
      currentOutstanding: numOutstanding,
      statementDate: Math.min(31, Math.max(1, Number(statementDate) || 15)),
      dueDate: Math.min(31, Math.max(1, Number(dueDate) || 5)),
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
    activeAccount,
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

  const accountSelectOptions = bankAccounts.map(a => ({
    value: a.id,
    label: `${a.name} (${a.institution}) • ${formatINR(a.calculatedBalance)}`,
    icon: 'Landmark',
  }));

  // Dynamic Issuer Options including all Indian banks, catalog issuers, and active account institution
  const issuerOptions = (() => {
    const bankSet = new Set<string>();
    INDIAN_BANKS.forEach(b => bankSet.add(b.name));
    BANK_CREDIT_CARDS_CATALOG.forEach(c => bankSet.add(c.issuer));
    if (activeAccount?.institution) bankSet.add(activeAccount.institution);
    if (issuer) bankSet.add(issuer);

    return Array.from(bankSet)
      .sort((a, b) => a.localeCompare(b))
      .map(name => ({
        value: name,
        label: name,
        icon: 'Building',
      }));
  })();

  const networkOptions = CARD_NETWORKS.map(n => ({
    value: n.id,
    label: `${n.name} (${n.label})`,
    icon: 'CreditCard',
  }));

  // Filtered catalog cards for in-modal search
  const filteredCatalogCards = BANK_CREDIT_CARDS_CATALOG.filter(c => {
    if (!catalogSearchTerm.trim()) return true;
    const term = catalogSearchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.issuer.toLowerCase().includes(term) ||
      c.perks.toLowerCase().includes(term) ||
      c.category?.toLowerCase().includes(term) ||
      c.tier?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-purple-800/40 relative overflow-hidden">
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
                Convert your bank account into an active credit card with luxury visual themes & transaction migration
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
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/90 to-indigo-50/70 dark:from-purple-950/30 dark:to-indigo-950/20 border border-purple-200/70 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <Bank3DIcon
                institution={activeAccount?.institution || 'Bank'}
                type="SAVINGS"
                size="md"
              />
              <div>
                <p className="text-[10px] font-extrabold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
                  Source Bank Account
                </p>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {activeAccount ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">{activeAccount.name}</span>
                      <span className="text-slate-500">({activeAccount.institution})</span>
                      {activeAccount.accountNumberLast4 && (
                        <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          •••• {activeAccount.accountNumberLast4}
                        </span>
                      )}
                      <span className="text-slate-400">•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatINR(activeAccount.calculatedBalance)}
                      </span>
                    </div>
                  ) : (
                    'No bank account selected'
                  )}
                </div>
              </div>
            </div>

            {bankAccounts.length > 1 && (
              <div className="sm:w-64">
                <CustomSelect
                  label=""
                  title="Switch Bank Account"
                  value={selectedAccountId}
                  onChange={val => {
                    setSelectedAccountId(val);
                  }}
                  options={accountSelectOptions}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* VISUAL VALIDATION & DETECTED VARIANT CONFIRMATION PANEL */}
          {/* ========================================================================= */}
          <div
            id="card-variant-validation-panel"
            className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
              detectionValidation.status === 'MATCH_CONFIRMED'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100'
                : detectionValidation.status === 'CROSS_ISSUER_WARNING'
                ? 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-100'
                : detectionValidation.status === 'INVALID_PARAMS'
                ? 'bg-rose-50/80 dark:bg-rose-950/25 border-rose-300 dark:border-rose-800/60 text-rose-950 dark:text-rose-100'
                : 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/50 text-indigo-950 dark:text-indigo-100'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    detectionValidation.status === 'MATCH_CONFIRMED'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : detectionValidation.status === 'CROSS_ISSUER_WARNING'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : detectionValidation.status === 'INVALID_PARAMS'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  }`}
                >
                  {detectionValidation.status === 'MATCH_CONFIRMED' ? (
                    <CheckCircle2 size={20} />
                  ) : detectionValidation.status === 'CROSS_ISSUER_WARNING' ? (
                    <AlertTriangle size={20} />
                  ) : detectionValidation.status === 'INVALID_PARAMS' ? (
                    <Info size={20} />
                  ) : (
                    <Sparkles size={20} />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        detectionValidation.status === 'MATCH_CONFIRMED'
                          ? 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                          : detectionValidation.status === 'CROSS_ISSUER_WARNING'
                          ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                          : detectionValidation.status === 'INVALID_PARAMS'
                          ? 'bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200'
                          : 'bg-indigo-200 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200'
                      }`}
                    >
                      {detectionValidation.status === 'MATCH_CONFIRMED'
                        ? 'Auto-Detected Variant Verified'
                        : detectionValidation.status === 'CROSS_ISSUER_WARNING'
                        ? 'Issuer Variant Notice'
                        : detectionValidation.status === 'INVALID_PARAMS'
                        ? 'Validation Required'
                        : 'Custom Card Setup'}
                    </span>
                    <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                      {cardName || 'Unnamed Card'}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {detectionValidation.description}
                  </p>

                  {/* Quick Spec Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1">
                      <CreditCardIcon size={11} className="text-purple-600 dark:text-purple-400" />
                      <span>{network}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1">
                      <Sliders size={11} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Limit: {formatINR(Number(creditLimit) || 0)}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1">
                      <Calendar size={11} className="text-amber-600 dark:text-amber-400" />
                      <span>Statement: {statementDate}th | Due: {dueDate}th</span>
                    </span>
                    {cardVariant && (
                      <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 font-bold text-purple-700 dark:text-purple-300">
                        {cardVariant}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Early Correction Actions */}
              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                {detectionValidation.catalogMatch && detectionValidation.status === 'CROSS_ISSUER_WARNING' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (detectionValidation.catalogMatch) {
                        setIssuer(detectionValidation.catalogMatch.issuer);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1"
                  >
                    <RefreshCw size={12} />
                    <span>Sync to {detectionValidation.catalogMatch.issuer}</span>
                  </button>
                )}

                {activeAccount && activeAccount.institution !== issuer && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeAccount) {
                        populateFormForAccount(activeAccount);
                      }
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold shadow-xs transition-colors flex items-center space-x-1"
                  >
                    <RefreshCw size={11} className="text-purple-600 dark:text-purple-400" />
                    <span>Reset to {activeAccount.institution} Preset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Overlimit Warning alert */}
            {detectionValidation.overlimit && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center space-x-2">
                <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                <span>
                  Initial outstanding ({formatINR(Number(openingBalance))}) exceeds credit limit ({formatINR(Number(creditLimit))}). Please adjust the limit or initial balance.
                </span>
              </div>
            )}
          </div>

          {/* Quick Bank Presets Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Sparkles size={13} className="text-amber-500" />
                <span>Popular {issuer || activeAccount?.institution} Cards</span>
              </span>
              <button
                type="button"
                onClick={() => setCatalogSearchModalOpen(true)}
                className="text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center space-x-1"
              >
                <Search size={11} />
                <span>Browse All 60+ Cards Catalog</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {bankCardSuggestions.map(preset => {
                const isSelected = cardName.trim().toLowerCase() === preset.name.toLowerCase();
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative group overflow-hidden ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20 ring-2 ring-purple-500/30'
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
                    {isSelected && (
                      <div className="absolute bottom-1 right-1">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Card Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Zap size={13} className="text-purple-600 dark:text-purple-400" />
                <span>Live Card Preview</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                Theme:{' '}
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {CARD_THEMES.find(t => t.id === cardTheme)?.name || 'Custom'}
                </span>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Card Name / Variant <span className="text-rose-500">*</span>
                  </label>
                  {detectionValidation.catalogMatch && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                      <Check size={10} />
                      <span>Verified Preset</span>
                    </span>
                  )}
                </div>
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
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
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
              disabled={isSubmitting || !cardName.trim() || detectionValidation.status === 'INVALID_PARAMS'}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all active:scale-98 flex items-center space-x-2 disabled:opacity-50"
            >
              <ArrowRightLeft size={16} />
              <span>{isSubmitting ? 'Converting...' : 'Convert to Credit Card'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Catalog Search Modal */}
      {catalogSearchModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-xl w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Choose from 60+ Indian Credit Cards</h4>
                  <p className="text-[11px] text-slate-500">Pick any card preset to populate limit, perks, and statement days</p>
                </div>
              </div>
              <button
                onClick={() => setCatalogSearchModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by card name, bank, cashback, airport lounge, UPI..."
                value={catalogSearchTerm}
                onChange={e => setCatalogSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto space-y-2 max-h-[50vh] pr-1">
              {filteredCatalogCards.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No cards found matching &quot;{catalogSearchTerm}&quot;
                </div>
              ) : (
                filteredCatalogCards.map(preset => (
                  <div
                    key={preset.name}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 hover:border-purple-500 dark:hover:border-purple-500 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{preset.name}</span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          {preset.network}
                        </span>
                        <span className="text-[10px] text-slate-500">({preset.issuer})</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                        {preset.perks}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        applyPreset(preset);
                        setCatalogSearchModalOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 shadow-sm transition-all"
                    >
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
