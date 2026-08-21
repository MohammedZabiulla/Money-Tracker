import React, { useState, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Account, CreditCard, AccountType, CardNetwork, CardTheme } from '../../types';
import {
  INDIAN_BANKS,
  CARD_NETWORKS,
  CARD_THEMES,
  POPULAR_CREDIT_CARDS_PRESETS,
  BANK_ACCOUNT_THEMES,
  ACCOUNT_ICONS,
  ACCOUNT_COLORS,
} from '../../lib/constants';
import { CardVisual } from '../common/CardVisual';
import { BankVisual } from '../common/BankVisual';
import { Bank3DIcon } from '../common/IconHelper';
import {
  X,
  Plus,
  Building,
  CreditCard as CreditCardIcon,
  Wallet,
  Check,
  Sparkles,
  ShieldCheck,
  Search,
  RotateCcw,
} from 'lucide-react';

interface AddAccountOrCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'BANK' | 'CARD' | 'WALLET';
  onCreatedAccount?: (account: Account) => void;
  onCreatedCard?: (card: CreditCard) => void;
}

export const AddAccountOrCardModal: React.FC<AddAccountOrCardModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'BANK',
  onCreatedAccount,
  onCreatedCard,
}) => {
  const { addAccount, addCreditCard, accounts, creditCards } = useMoney();

  const [activeTab, setActiveTab] = useState<'BANK' | 'CARD' | 'WALLET'>(defaultTab);

  // ----------------------------------------------------
  // BANK ACCOUNT STATE
  // ----------------------------------------------------
  const [bankPreset, setBankPreset] = useState<string>(INDIAN_BANKS[0].name);
  const [accName, setAccName] = useState('');
  const [accInstitution, setAccInstitution] = useState(INDIAN_BANKS[0].name);
  const [accType, setAccType] = useState<AccountType>('SAVINGS');
  const [accOpeningBal, setAccOpeningBal] = useState('');
  const [accLast4, setAccLast4] = useState('');
  const [accColor, setAccColor] = useState(INDIAN_BANKS[0].color);
  const [accTheme, setAccTheme] = useState(INDIAN_BANKS[0].themeId || 'bank_hdfc');
  const [accNotes, setAccNotes] = useState('');

  // ----------------------------------------------------
  // CREDIT CARD STATE
  // ----------------------------------------------------
  const [cardName, setCardName] = useState('');
  const [cardIssuer, setCardIssuer] = useState(INDIAN_BANKS[0].name);
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>('VISA');
  const [cardTheme, setCardTheme] = useState<CardTheme>('midnight');
  const [cardLimit, setCardLimit] = useState('100000');
  const [cardOutstanding, setCardOutstanding] = useState('0');
  const [cardLast4, setCardLast4] = useState('1234');
  const [cardStatementDate, setCardStatementDate] = useState('15');
  const [cardDueDate, setCardDueDate] = useState('5');
  const [cardNotes, setCardNotes] = useState('');

  // Preset selection for cards
  const [cardPresetSearch, setCardPresetSearch] = useState('');

  // Handle bank preset selection
  const handleSelectBankPreset = (bank: typeof INDIAN_BANKS[0]) => {
    setBankPreset(bank.name);
    setAccInstitution(bank.name);
    setAccColor(bank.color);
    setAccTheme(bank.themeId || 'bank_hdfc');
    if (!accName || INDIAN_BANKS.some(b => b.name === accName)) {
      setAccName(`${bank.name} ${accType === 'SAVINGS' ? 'Savings' : 'Account'}`);
    }
  };

  // Handle card preset selection
  const handleSelectCardPreset = (preset: typeof POPULAR_CREDIT_CARDS_PRESETS[0]) => {
    const p = preset as any;
    setCardName(preset.name);
    setCardIssuer(preset.issuer);
    setCardNetwork(preset.network as CardNetwork);
    setCardTheme((p.cardTheme || p.theme || 'midnight') as CardTheme);
    setCardLimit(String(p.creditLimit || p.limit || 100000));
    setCardStatementDate(String(p.statementDate || p.statementDay || 15));
    setCardDueDate(String(p.dueDate || p.dueDay || 5));
  };

  // Preview dummy objects
  const previewBank = useMemo<Account>(() => ({
    id: 'preview_acc',
    name: accName.trim() || `${accInstitution} ${accType}`,
    institution: accInstitution,
    type: accType,
    openingBalance: parseFloat(accOpeningBal) || 0,
    calculatedBalance: parseFloat(accOpeningBal) || 0,
    accountNumberLast4: accLast4.trim() || '••••',
    color: accColor,
    icon: 'Landmark',
    accountTheme: accTheme,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }), [accName, accInstitution, accType, accOpeningBal, accLast4, accColor, accTheme]);

  const previewCard = useMemo<CreditCard>(() => ({
    id: 'preview_card',
    name: cardName.trim() || `${cardIssuer} Card`,
    issuer: cardIssuer,
    network: cardNetwork,
    cardTheme: cardTheme,
    creditLimit: parseFloat(cardLimit) || 100000,
    currentOutstanding: parseFloat(cardOutstanding) || 0,
    openingBalance: parseFloat(cardOutstanding) || 0,
    statementDate: parseInt(cardStatementDate, 10) || 15,
    dueDate: parseInt(cardDueDate, 10) || 5,
    lastFourDigits: cardLast4.trim() || '1234',
    icon: 'CreditCard',
    color: CARD_THEMES.find(t => t.id === cardTheme)?.accentColor || '#8b5cf6',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }), [cardName, cardIssuer, cardNetwork, cardTheme, cardLimit, cardOutstanding, cardLast4, cardStatementDate, cardDueDate]);

  if (!isOpen) return null;

  const handleSaveBank = () => {
    const finalName = accName.trim() || `${accInstitution} ${accType === 'SAVINGS' ? 'Savings' : 'Account'}`;
    const openingBal = parseFloat(accOpeningBal) || 0;

    const newId = addAccount({
      name: finalName,
      institution: accInstitution,
      type: accType,
      openingBalance: openingBal,
      accountNumberLast4: accLast4.trim() || undefined,
      color: accColor,
      icon: 'Landmark',
      accountTheme: accTheme,
      notes: accNotes.trim() || undefined,
      isActive: true,
    });

    if (onCreatedAccount) {
      onCreatedAccount({
        id: newId,
        name: finalName,
        institution: accInstitution,
        type: accType,
        openingBalance: openingBal,
        calculatedBalance: openingBal,
        accountNumberLast4: accLast4.trim() || undefined,
        color: accColor,
        icon: 'Landmark',
        accountTheme: accTheme,
        notes: accNotes.trim() || undefined,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    onClose();
  };

  const handleSaveCard = () => {
    const finalName = cardName.trim() || `${cardIssuer} Card`;
    const limit = parseFloat(cardLimit) || 100000;
    const outstanding = parseFloat(cardOutstanding) || 0;
    const statement = parseInt(cardStatementDate, 10) || 15;
    const due = parseInt(cardDueDate, 10) || 5;
    const themeObj = CARD_THEMES.find(t => t.id === cardTheme);

    const newId = addCreditCard({
      name: finalName,
      issuer: cardIssuer,
      network: cardNetwork,
      cardTheme: cardTheme,
      creditLimit: limit,
      openingBalance: outstanding,
      lastFourDigits: cardLast4.trim() || '1234',
      statementDate: statement,
      dueDate: due,
      icon: 'CreditCard',
      color: themeObj?.accentColor || '#8b5cf6',
      notes: cardNotes.trim() || undefined,
      isActive: true,
    });

    if (onCreatedCard) {
      onCreatedCard({
        id: newId,
        name: finalName,
        issuer: cardIssuer,
        network: cardNetwork,
        cardTheme: cardTheme,
        creditLimit: limit,
        currentOutstanding: outstanding,
        openingBalance: outstanding,
        lastFourDigits: cardLast4.trim() || '1234',
        statementDate: statement,
        dueDate: due,
        icon: 'CreditCard',
        color: themeObj?.accentColor || '#8b5cf6',
        notes: cardNotes.trim() || undefined,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              {activeTab === 'CARD' ? <CreditCardIcon size={20} /> : <Building size={20} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {activeTab === 'CARD' ? 'Add Credit Card' : activeTab === 'WALLET' ? 'Add Wallet / Cash' : 'Add Bank Account'}
              </h2>
              <p className="text-xs text-slate-500">
                Choose signature bank presets, card themes, and emblems
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center px-4 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('BANK')}
            className={`pb-2.5 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'BANK'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building size={14} />
            <span>Bank Account</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CARD')}
            className={`pb-2.5 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'CARD'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CreditCardIcon size={14} />
            <span>Credit Card</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('WALLET');
              setAccType('WALLET');
              setAccInstitution('Digital Wallet');
              setAccName('Cash in Hand / Wallet');
            }}
            className={`pb-2.5 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'WALLET'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Wallet size={14} />
            <span>Wallet / Cash</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: BANK ACCOUNT OR WALLET */}
          {(activeTab === 'BANK' || activeTab === 'WALLET') && (
            <div className="space-y-4">
              
              {/* Bank Visual Preview */}
              <div className="max-w-sm mx-auto">
                <BankVisual
                  account={previewBank}
                  variant="classic"
                  showBalance={true}
                  className="shadow-xl"
                />
              </div>

              {/* Bank Preset Selection (Quick Badges) */}
              {activeTab === 'BANK' && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">
                    Choose Bank Institution Preset
                  </label>
                  <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
                    {INDIAN_BANKS.map(bank => {
                      const isSelected = accInstitution === bank.name;
                      return (
                        <button
                          key={bank.name}
                          type="button"
                          onClick={() => handleSelectBankPreset(bank)}
                          className={`px-3 py-2 rounded-2xl border text-xs font-semibold flex items-center space-x-2 transition-all shrink-0 ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <Bank3DIcon
                            institution={bank.name}
                            type="SAVINGS"
                            color={bank.color}
                            size="sm"
                          />
                          <span>{bank.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Account Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                    Account Display Name *
                  </label>
                  <input
                    type="text"
                    value={accName}
                    onChange={e => setAccName(e.target.value)}
                    placeholder="e.g. HDFC Salary Account"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Account Type */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                    Account Type
                  </label>
                  <select
                    value={accType}
                    onChange={e => setAccType(e.target.value as AccountType)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="SAVINGS">Savings Account</option>
                    <option value="SALARY">Salary Account</option>
                    <option value="CURRENT">Current Account</option>
                    <option value="WALLET">Digital Wallet</option>
                    <option value="CASH">Physical Cash</option>
                    <option value="INVESTMENT">Demag / Investment Account</option>
                  </select>
                </div>

                {/* Opening Balance */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                    Opening Balance (₹)
                  </label>
                  <input
                    type="number"
                    value={accOpeningBal}
                    onChange={e => setAccOpeningBal(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Account Number Last 4 */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                    Last 4 Digits (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={accLast4}
                    onChange={e => setAccLast4(e.target.value)}
                    placeholder="e.g. 5678"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Theme & Color Palette */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">
                  Card Theme & Accent Color
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ACCOUNT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAccColor(color)}
                      className={`w-7 h-7 rounded-xl transition-all flex items-center justify-center ${
                        accColor === color ? 'scale-110 ring-2 ring-emerald-500 shadow-md' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {accColor === color && <Check size={12} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBank}
                  className="px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center space-x-1.5"
                >
                  <Check size={14} />
                  <span>Save Account</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CREDIT CARD */}
          {activeTab === 'CARD' && (
            <div className="space-y-4">
              
              {/* Credit Card Visual Preview */}
              <div className="max-w-sm mx-auto">
                <CardVisual
                  card={previewCard}
                  variant="classic"
                  showBalance={true}
                  className="shadow-xl"
                />
              </div>

              {/* Quick Popular Card Presets */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">
                  Quick Indian Credit Card Presets
                </label>
                <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
                  {POPULAR_CREDIT_CARDS_PRESETS.slice(0, 10).map(preset => {
                    const isSelected = cardName === preset.name;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleSelectCardPreset(preset)}
                        className={`px-3 py-2 rounded-2xl border text-xs font-semibold flex items-center space-x-2 transition-all shrink-0 ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 ring-2 ring-purple-500/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <Bank3DIcon
                          institution={preset.issuer}
                          type="CREDIT_CARD"
                          color="#9333ea"
                          size="sm"
                        />
                        <span>{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Card Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                    Card Name *
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    placeholder="e.g. HDFC Millennia RuPay"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Issuer Bank */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                    Issuer Institution
                  </label>
                  <select
                    value={cardIssuer}
                    onChange={e => setCardIssuer(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {INDIAN_BANKS.map(b => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                    <option value="OneCard">OneCard / Federal</option>
                    <option value="Scapia">Scapia / Federal</option>
                    <option value="American Express">American Express</option>
                  </select>
                </div>

                {/* Card Network */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                    Card Network
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {CARD_NETWORKS.map(net => (
                      <button
                        key={net.id}
                        type="button"
                        onClick={() => setCardNetwork(net.id as CardNetwork)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          cardNetwork === net.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        {net.label || net.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Last 4 Digits */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                    Last 4 Digits
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLast4}
                    onChange={e => setCardLast4(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Credit Limit */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                    Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    value={cardLimit}
                    onChange={e => setCardLimit(e.target.value)}
                    placeholder="100000"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Current Outstanding */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                    Current Outstanding Due (₹)
                  </label>
                  <input
                    type="number"
                    value={cardOutstanding}
                    onChange={e => setCardOutstanding(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* 3D Card Themes */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">
                  3D Card Theme & Finish
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CARD_THEMES.map(t => {
                    const isSelected = cardTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setCardTheme(t.id as CardTheme)}
                        className={`p-2 rounded-2xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
                          isSelected
                            ? 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: t.accentColor }}
                        />
                        <span className="truncate text-[11px]">{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCard}
                  className="px-5 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center space-x-1.5"
                >
                  <Check size={14} />
                  <span>Save Credit Card</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
