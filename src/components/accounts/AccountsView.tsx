import React, { useState, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Account, CreditCard, AccountType, CardNetwork, CardTheme, BankCardCatalogItem } from '../../types';
import { formatINR, formatCompactINR } from '../../lib/currency';
import {
  INDIAN_BANKS,
  CARD_NETWORKS,
  CARD_THEMES,
  POPULAR_CREDIT_CARDS_PRESETS,
  BANK_CREDIT_CARDS_CATALOG,
  BANK_ACCOUNT_THEMES,
  DIGITAL_WALLETS_CATALOG,
  WalletCatalogItem,
  BANK_ACCOUNTS_CATALOG,
  BankAccountCatalogItem,
  getCardsForBank,
  getBankTheme,
  ACCOUNT_ICONS,
  ACCOUNT_COLORS,
} from '../../lib/constants';
import { CardVisual, CardChipBadge, NetworkLogo, EMVChip } from '../common/CardVisual';
import { BankVisual } from '../common/BankVisual';
import { StackedCardsDeck, StackedBanksDeck, StackedWalletsDeck } from './StackedAssetDecks';
import { ConvertBankModal } from './ConvertBankModal';
import { ConvertCreditCardModal } from './ConvertCreditCardModal';
import { AccountTransactionsModal } from './AccountTransactionsModal';
import { ArrangeAccountsModal } from './ArrangeAccountsModal';
import { ArrangeCardsModal } from './ArrangeCardsModal';
import { AccountSortSelector, CardSortSelector } from './SortOptionSelector';
import { AccountSortOption, CardSortOption } from '../../types';
import { IconHelper, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import {
  Plus,
  Building,
  CreditCard as CreditCardIcon,
  Banknote,
  Wallet,
  Smartphone,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  X,
  RotateCcw,
  Percent,
  Edit2,
  Trash2,
  Sparkles,
  Search,
  Check,
  Compass,
  Tag,
  Layers,
  LayoutGrid,
  ChevronRight,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { Transaction, TransactionType } from '../../types';

interface AccountsViewProps {
  onSelectAccountTransactions?: (item: { type: 'ACCOUNT' | 'CARD'; id: string; name: string }) => void;
  onSelectTransaction?: (tx: Transaction) => void;
  onOpenAdd?: (type?: TransactionType, accountId?: string) => void;
  onNavigateToFullFeed?: (accountId: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  onSelectAccountTransactions,
  onSelectTransaction,
  onOpenAdd,
  onNavigateToFullFeed,
  onEditTransaction,
}) => {
  const {
    accounts,
    creditCards,
    settings,
    summary,
    addAccount,
    updateAccount,
    deleteAccount,
    reorderAccounts,
    setAccountSortPreference,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    reorderCreditCards,
    setCardSortPreference,
    payCreditCardBill,
    reconcileAccount,
  } = useMoney();

  // Sort preferences from settings
  const accountSortPreference: AccountSortOption = settings.accountSortPreference || 'CUSTOM';
  const cardSortPreference: CardSortOption = settings.cardSortPreference || 'CUSTOM';

  // Modals for manual drag & drop / reordering
  const [showArrangeAccountsModal, setShowArrangeAccountsModal] = useState(false);
  const [showArrangeCardsModal, setShowArrangeCardsModal] = useState(false);

  // Active View Filter Tab
  const [activeTab, setActiveTab] = useState<'ALL' | 'BANKS' | 'CARDS' | 'WALLETS'>('ALL');

  // Deck Stacking Modes (Cards on cards, banks over banks, wallets on wallets)
  const [isCardsStacked, setIsCardsStacked] = useState(true);
  const [isBanksStacked, setIsBanksStacked] = useState(true);
  const [isWalletsStacked, setIsWalletsStacked] = useState(true);

  // Transactions Statement Modal for Account / Card
  const [selectedAccountForTxModal, setSelectedAccountForTxModal] = useState<Account | null>(null);
  const [selectedCardForTxModal, setSelectedCardForTxModal] = useState<CreditCard | null>(null);

  const handleViewAccountTransactions = (acc: Account) => {
    if (onSelectAccountTransactions) {
      onSelectAccountTransactions({ type: 'ACCOUNT', id: acc.id, name: acc.name });
    }
    setSelectedAccountForTxModal(acc);
    setSelectedCardForTxModal(null);
  };

  const handleViewCardTransactions = (card: CreditCard) => {
    if (onSelectAccountTransactions) {
      onSelectAccountTransactions({ type: 'CARD', id: card.id, name: card.name });
    }
    setSelectedCardForTxModal(card);
    setSelectedAccountForTxModal(null);
  };

  // Modals state
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  // Bank Accounts Catalog Modal
  const [showBankCatalogModal, setShowBankCatalogModal] = useState(false);
  const [bankCatalogSearch, setBankCatalogSearch] = useState('');
  const [bankCatalogCategoryFilter, setBankCatalogCategoryFilter] = useState<string>('ALL');

  // Card Catalog Modal
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('ALL');
  const [catalogBankFilter, setCatalogBankFilter] = useState<string>('ALL');

  // Wallet Catalog Modal
  const [showWalletCatalogModal, setShowWalletCatalogModal] = useState(false);
  const [walletCatalogSearch, setWalletCatalogSearch] = useState('');
  const [walletCatalogCategoryFilter, setWalletCatalogCategoryFilter] = useState<string>('ALL');

  // Delete Confirmation
  const [itemToDelete, setItemToDelete] = useState<{ type: 'ACCOUNT' | 'CARD'; id: string; name: string } | null>(null);

  // Convert Bank to Card Modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [accountToConvert, setAccountToConvert] = useState<Account | null>(null);

  // Convert Credit Card to Account Modal
  const [showConvertCardModal, setShowConvertCardModal] = useState(false);
  const [cardToConvert, setCardToConvert] = useState<CreditCard | null>(null);

  // Reconciliation Modal
  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  const [selectedAccForReconciliation, setSelectedAccForReconciliation] = useState<Account | null>(null);
  const [statementBalanceInput, setStatementBalanceInput] = useState<string>('');
  const [reconciliationNotes, setReconciliationNotes] = useState<string>('');

  // Card Bill Payment Modal State
  const [showCardPayModal, setShowCardPayModal] = useState(false);
  const [selectedCardForPay, setSelectedCardForPay] = useState<CreditCard | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>('');
  const [selectedBankForPay, setSelectedBankForPay] = useState<string>('');

  // Add Account Form State
  const [newAccName, setNewAccName] = useState('');
  const [newAccInstitution, setNewAccInstitution] = useState(INDIAN_BANKS[0].name);
  const [newAccType, setNewAccType] = useState<AccountType>('SAVINGS');
  const [newAccOpeningBal, setNewAccOpeningBal] = useState('0');
  const [newAccLast4, setNewAccLast4] = useState('');
  const [newAccIcon, setNewAccIcon] = useState('Landmark');
  const [newAccColor, setNewAccColor] = useState(INDIAN_BANKS[0].color);
  const [newAccTheme, setNewAccTheme] = useState(INDIAN_BANKS[0].themeId || 'bank_hdfc');
  const [newAccNotes, setNewAccNotes] = useState('');

  // Add Card Form State
  const [newCardName, setNewCardName] = useState('');
  const [newCardIssuer, setNewCardIssuer] = useState(INDIAN_BANKS[0].name);
  const [newCardNetwork, setNewCardNetwork] = useState<CardNetwork>('VISA');
  const [newCardTheme, setNewCardTheme] = useState<string>('midnight');
  const [newCardLast4, setNewCardLast4] = useState('1234');
  const [newCardLimit, setNewCardLimit] = useState('150000');
  const [newCardOutstanding, setNewCardOutstanding] = useState('0');
  const [newCardStatementDay, setNewCardStatementDay] = useState('15');
  const [newCardDueDay, setNewCardDueDay] = useState('5');
  const [newCardNotes, setNewCardNotes] = useState('');

  // Edit Account Form State
  const [editAccName, setEditAccName] = useState('');
  const [editAccInstitution, setEditAccInstitution] = useState('');
  const [editAccType, setEditAccType] = useState<AccountType>('SAVINGS');
  const [editAccOpeningBal, setEditAccOpeningBal] = useState('0');
  const [editAccLast4, setEditAccLast4] = useState('');
  const [editAccIcon, setEditAccIcon] = useState('Landmark');
  const [editAccColor, setEditAccColor] = useState('#004c8f');
  const [editAccTheme, setEditAccTheme] = useState('bank_hdfc');
  const [editAccNotes, setEditAccNotes] = useState('');
  const [editAccIsActive, setEditAccIsActive] = useState(true);
  const [editAccExcludeNetWorth, setEditAccExcludeNetWorth] = useState(false);

  // Edit Card Form State
  const [editCardName, setEditCardName] = useState('');
  const [editCardIssuer, setEditCardIssuer] = useState('');
  const [editCardNetwork, setEditCardNetwork] = useState<CardNetwork>('VISA');
  const [editCardTheme, setEditCardTheme] = useState<string>('midnight');
  const [editCardLast4, setEditCardLast4] = useState('');
  const [editCardLimit, setEditCardLimit] = useState('100000');
  const [editCardOpeningBal, setEditCardOpeningBal] = useState('0');
  const [editCardStatementDay, setEditCardStatementDay] = useState('15');
  const [editCardDueDay, setEditCardDueDay] = useState('5');
  const [editCardNotes, setEditCardNotes] = useState('');
  const [editCardIsActive, setEditCardIsActive] = useState(true);

  // Auto update bank details when bank changes in Add Account
  const handleAddBankChange = (instName: string) => {
    setNewAccInstitution(instName);
    const bank = INDIAN_BANKS.find(b => b.name === instName);
    if (bank) {
      setNewAccColor(bank.color);
      if (bank.themeId) {
        setNewAccTheme(bank.themeId);
      }
    }
  };

  // Open Edit Account Modal
  const openEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setEditAccName(acc.name);
    setEditAccInstitution(acc.institution);
    setEditAccType(acc.type);
    setEditAccOpeningBal(acc.openingBalance.toString());
    setEditAccLast4(acc.accountNumberLast4 || '');
    setEditAccIcon(acc.icon || 'Landmark');
    setEditAccColor(acc.color || '#004c8f');
    setEditAccTheme(acc.accountTheme || 'bank_hdfc');
    setEditAccNotes(acc.notes || '');
    setEditAccIsActive(acc.isActive ?? true);
    setEditAccExcludeNetWorth(acc.isExcludedFromNetWorth ?? false);
    setShowEditAccountModal(true);
  };

  // Save Edited Account
  const handleSaveEditAccount = () => {
    if (!editingAccount) return;
    if (!editAccName.trim()) {
      alert('Please enter an account name');
      return;
    }

    updateAccount(editingAccount.id, {
      name: editAccName.trim(),
      institution: editAccInstitution,
      type: editAccType,
      openingBalance: parseFloat(editAccOpeningBal) || 0,
      accountNumberLast4: editAccLast4.trim() || undefined,
      icon: editAccIcon,
      color: editAccColor,
      accountTheme: editAccTheme,
      notes: editAccNotes.trim() || undefined,
      isActive: editAccIsActive,
      isExcludedFromNetWorth: editAccExcludeNetWorth,
    });

    setShowEditAccountModal(false);
    setEditingAccount(null);
  };

  // Open Edit Card Modal
  const openEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setEditCardName(card.name);
    setEditCardIssuer(card.issuer);
    setEditCardNetwork(card.network || 'VISA');
    setEditCardTheme(card.cardTheme || 'midnight');
    setEditCardLast4(card.lastFourDigits);
    setEditCardLimit(card.creditLimit.toString());
    setEditCardOpeningBal(card.openingBalance.toString());
    setEditCardStatementDay((card.statementDate || 15).toString());
    setEditCardDueDay((card.dueDate || 5).toString());
    setEditCardNotes(card.notes || '');
    setEditCardIsActive(card.isActive ?? true);
    setShowEditCardModal(true);
  };

  // Save Edited Card
  const handleSaveEditCard = () => {
    if (!editingCard) return;
    if (!editCardName.trim()) {
      alert('Please enter a card name');
      return;
    }

    const themeConfig = CARD_THEMES.find(t => t.id === editCardTheme);

    updateCreditCard(editingCard.id, {
      name: editCardName.trim(),
      issuer: editCardIssuer,
      network: editCardNetwork,
      cardTheme: editCardTheme,
      lastFourDigits: editCardLast4.trim() || '0000',
      creditLimit: parseFloat(editCardLimit) || 100000,
      openingBalance: parseFloat(editCardOpeningBal) || 0,
      statementDate: parseInt(editCardStatementDay) || 15,
      dueDate: parseInt(editCardDueDay) || 5,
      color: themeConfig?.accentColor || '#38bdf8',
      notes: editCardNotes.trim() || undefined,
      isActive: editCardIsActive,
    });

    setShowEditCardModal(false);
    setEditingCard(null);
  };

  // Create New Account
  const handleCreateAccount = () => {
    if (!newAccName.trim()) {
      alert('Please enter an account name');
      return;
    }
    const bankConfig = INDIAN_BANKS.find(b => b.name === newAccInstitution);
    addAccount({
      name: newAccName.trim(),
      institution: newAccInstitution,
      type: newAccType,
      openingBalance: parseFloat(newAccOpeningBal) || 0,
      accountNumberLast4: newAccLast4.trim() || undefined,
      icon: newAccIcon || 'Landmark',
      color: newAccColor || bankConfig?.color || '#004c8f',
      accountTheme: newAccTheme,
      notes: newAccNotes.trim() || undefined,
      isActive: true,
    });
    setNewAccName('');
    setNewAccOpeningBal('0');
    setNewAccLast4('');
    setNewAccNotes('');
    setShowAddAccountModal(false);
  };

  // Apply Catalog Card or Preset to Add Card Form
  const applyCardCatalogItem = (cardItem: BankCardCatalogItem) => {
    setNewCardName(cardItem.name);
    setNewCardIssuer(cardItem.issuer);
    setNewCardNetwork(cardItem.network);
    setNewCardTheme(cardItem.theme);
    setNewCardLimit((cardItem.limit || 150000).toString());
    setNewCardStatementDay((cardItem.statementDay || 15).toString());
    setNewCardDueDay((cardItem.dueDay || 5).toString());
    setNewCardNotes(cardItem.perks);
  };

  // Apply Catalog Card to Edit Card Form
  const applyCardCatalogItemToEdit = (cardItem: BankCardCatalogItem) => {
    setEditCardName(cardItem.name);
    setEditCardIssuer(cardItem.issuer);
    setEditCardNetwork(cardItem.network);
    setEditCardTheme(cardItem.theme);
    setEditCardLimit((cardItem.limit || 150000).toString());
    setEditCardStatementDay((cardItem.statementDay || 15).toString());
    setEditCardDueDay((cardItem.dueDay || 5).toString());
    setEditCardNotes(cardItem.perks);
  };

  // Create New Credit Card
  const handleCreateCard = () => {
    if (!newCardName.trim()) {
      alert('Please enter a card name');
      return;
    }
    const themeConfig = CARD_THEMES.find(t => t.id === newCardTheme);

    addCreditCard({
      name: newCardName.trim(),
      issuer: newCardIssuer,
      network: newCardNetwork,
      cardTheme: newCardTheme,
      lastFourDigits: newCardLast4 || '1234',
      creditLimit: parseFloat(newCardLimit) || 100000,
      openingBalance: parseFloat(newCardOutstanding) || 0,
      statementDate: parseInt(newCardStatementDay) || 15,
      dueDate: parseInt(newCardDueDay) || 5,
      icon: 'CreditCard',
      color: themeConfig?.accentColor || '#38bdf8',
      notes: newCardNotes.trim() || undefined,
      isActive: true,
    });
    setNewCardName('');
    setNewCardNotes('');
    setShowAddCardModal(false);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'ACCOUNT') {
      deleteAccount(itemToDelete.id);
    } else {
      deleteCreditCard(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  // Reusable Select Options with rich styling & search
  const bankSelectOptions: SelectOption<string>[] = useMemo(() => {
    const popularBankIds = ['hdfc', 'sbi', 'icici', 'axis', 'kotak', 'pnb'];
    return INDIAN_BANKS.map(b => ({
      value: b.name,
      label: b.name,
      sublabel: popularBankIds.includes(b.id) ? 'Top Indian Bank' : 'Scheduled Bank',
      icon: (
        <Bank3DIcon
          name="Landmark"
          institution={b.name}
          color={b.color}
          size="sm"
        />
      ),
    }));
  }, []);

  const accountTypeSelectOptions: SelectOption<AccountType>[] = useMemo(() => [
    { value: 'SAVINGS', label: 'Savings Account', sublabel: 'Daily savings & deposits', icon: <Building size={16} className="text-emerald-500" /> },
    { value: 'SALARY', label: 'Salary Account', sublabel: 'Corporate monthly payroll', icon: <Building size={16} className="text-blue-500" /> },
    { value: 'CURRENT', label: 'Current / Business', sublabel: 'Business transactions', icon: <Building size={16} className="text-purple-500" /> },
    { value: 'CASH', label: 'Cash in Hand', sublabel: 'Physical wallet & notes', icon: <Banknote size={16} className="text-emerald-600" /> },
    { value: 'WALLET', label: 'Digital Wallet', sublabel: 'Amazon Pay, Paytm, PhonePe', icon: <Wallet size={16} className="text-indigo-500" /> },
    { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit (FD)', sublabel: 'Term deposit & interest', icon: <Building size={16} className="text-amber-500" /> },
    { value: 'RECURRING_DEPOSIT', label: 'Recurring Deposit (RD)', sublabel: 'Monthly recurring scheme', icon: <Building size={16} className="text-amber-600" /> },
  ], []);

  const cardNetworkSelectOptions: SelectOption<CardNetwork>[] = useMemo(() => [
    { value: 'VISA', label: 'VISA', sublabel: 'Accepted globally & online', icon: <NetworkLogo network="VISA" className="h-3.5" /> },
    { value: 'MASTERCARD', label: 'Mastercard', sublabel: 'Worldwide debit/credit network', icon: <NetworkLogo network="MASTERCARD" className="h-3.5" /> },
    { value: 'RUPAY', label: 'RuPay', sublabel: 'India National & UPI Enabled', icon: <NetworkLogo network="RUPAY" className="h-3.5" /> },
    { value: 'AMEX', label: 'American Express', sublabel: 'Premium rewards & perks', icon: <NetworkLogo network="AMEX" className="h-3.5" /> },
    { value: 'DINERS', label: 'Diners Club', sublabel: 'Travel & luxury lounge network', icon: <NetworkLogo network="DINERS" className="h-3.5" /> },
  ], []);

  const bankAccountsForPayOptions: SelectOption<string>[] = useMemo(() => {
    return accounts.filter(a => !a.isDeleted).map(a => ({
      value: a.id,
      label: a.name,
      sublabel: `${a.institution} • ${a.type}`,
      icon: (
        <Bank3DIcon
          name={a.icon}
          institution={a.institution}
          color={a.color}
          size="sm"
        />
      ),
      rightText: formatINR(a.calculatedBalance),
      rightTextColor: a.calculatedBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500',
      isBankAccount: true,
      bankTheme: a.institution || a.name || a.type,
    }));
  }, [accounts]);

  const handleReconcileSubmit = (autoAdjust: boolean) => {
    if (!selectedAccForReconciliation) return;
    const stmtVal = parseFloat(statementBalanceInput);
    if (isNaN(stmtVal)) {
      alert('Please enter valid statement balance');
      return;
    }
    reconcileAccount(selectedAccForReconciliation.id, stmtVal, reconciliationNotes, autoAdjust);
    setShowReconciliationModal(false);
    setSelectedAccForReconciliation(null);
  };

  const handleCardPaySubmit = () => {
    if (!selectedCardForPay || !selectedBankForPay) return;
    const amt = parseFloat(payAmountInput);
    if (!amt || amt <= 0) {
      alert('Please enter a valid bill amount');
      return;
    }
    payCreditCardBill(selectedCardForPay.id, selectedBankForPay, amt);
    setShowCardPayModal(false);
    setSelectedCardForPay(null);
  };

  // Catalog filtered items
  const filteredCatalogCards = useMemo(() => {
    return BANK_CREDIT_CARDS_CATALOG.filter(c => {
      const matchSearch =
        catalogSearch.trim() === '' ||
        c.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        c.issuer.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        c.perks.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        c.tier.toLowerCase().includes(catalogSearch.toLowerCase());

      const matchBank = catalogBankFilter === 'ALL' || c.issuer === catalogBankFilter;
      const matchCategory = catalogCategoryFilter === 'ALL' || c.category === catalogCategoryFilter;

      return matchSearch && matchBank && matchCategory;
    });
  }, [catalogSearch, catalogBankFilter, catalogCategoryFilter]);

  // Available cards for current selected bank in Add form
  const availableAddBankCards = useMemo(() => {
    return getCardsForBank(newCardIssuer);
  }, [newCardIssuer]);

  // Available cards for current selected bank in Edit form
  const availableEditBankCards = useMemo(() => {
    return getCardsForBank(editCardIssuer);
  }, [editCardIssuer]);

  // Active non-deleted accounts and cards sorted by user preference
  const sortedAccounts = useMemo(() => {
    const raw = accounts.filter(a => !a.isDeleted);
    const cloned = [...raw];
    switch (accountSortPreference) {
      case 'CUSTOM':
        return cloned.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
      case 'BALANCE_DESC':
        return cloned.sort((a, b) => (b.calculatedBalance || 0) - (a.calculatedBalance || 0));
      case 'BALANCE_ASC':
        return cloned.sort((a, b) => (a.calculatedBalance || 0) - (b.calculatedBalance || 0));
      case 'NAME_ASC':
        return cloned.sort((a, b) => a.name.localeCompare(b.name));
      case 'NAME_DESC':
        return cloned.sort((a, b) => b.name.localeCompare(a.name));
      case 'TYPE':
        return cloned.sort((a, b) => a.type.localeCompare(b.type));
      case 'INSTITUTION':
        return cloned.sort((a, b) => a.institution.localeCompare(b.institution));
      case 'DATE_NEWEST':
        return cloned.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      case 'DATE_OLDEST':
        return cloned.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      default:
        return cloned;
    }
  }, [accounts, accountSortPreference]);

  const sortedCards = useMemo(() => {
    const raw = creditCards.filter(c => !c.isDeleted);
    const cloned = [...raw];
    switch (cardSortPreference) {
      case 'CUSTOM':
        return cloned.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
      case 'OUTSTANDING_DESC':
        return cloned.sort((a, b) => (b.currentOutstanding || 0) - (a.currentOutstanding || 0));
      case 'OUTSTANDING_ASC':
        return cloned.sort((a, b) => (a.currentOutstanding || 0) - (b.currentOutstanding || 0));
      case 'LIMIT_DESC':
        return cloned.sort((a, b) => (b.creditLimit || 0) - (a.creditLimit || 0));
      case 'LIMIT_ASC':
        return cloned.sort((a, b) => (a.creditLimit || 0) - (b.creditLimit || 0));
      case 'NAME_ASC':
        return cloned.sort((a, b) => a.name.localeCompare(b.name));
      case 'ISSUER_ASC':
        return cloned.sort((a, b) => a.issuer.localeCompare(b.issuer));
      case 'DUE_DATE_ASC':
        return cloned.sort((a, b) => (a.dueDate || 31) - (b.dueDate || 31));
      case 'UTILIZATION_DESC': {
        const getUtil = (c: CreditCard) => (c.creditLimit > 0 ? c.currentOutstanding / c.creditLimit : 0);
        return cloned.sort((a, b) => getUtil(b) - getUtil(a));
      }
      default:
        return cloned;
    }
  }, [creditCards, cardSortPreference]);

  const activeAccounts = sortedAccounts;
  const activeCards = sortedCards;

  // Derived Bank vs Wallet accounts
  const bankAccounts = useMemo(() => activeAccounts.filter(a => a.type !== 'WALLET' && a.type !== 'CASH'), [activeAccounts]);
  const walletAccounts = useMemo(() => activeAccounts.filter(a => a.type === 'WALLET' || a.type === 'CASH'), [activeAccounts]);

  // Filtered wallet catalog items
  const filteredWalletCatalog = useMemo(() => {
    return DIGITAL_WALLETS_CATALOG.filter(w => {
      const matchSearch =
        walletCatalogSearch === '' ||
        w.name.toLowerCase().includes(walletCatalogSearch.toLowerCase()) ||
        w.institution.toLowerCase().includes(walletCatalogSearch.toLowerCase()) ||
        w.tagline.toLowerCase().includes(walletCatalogSearch.toLowerCase());
      const matchCat = walletCatalogCategoryFilter === 'ALL' || w.category === walletCatalogCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [walletCatalogSearch, walletCatalogCategoryFilter]);

  // Filtered bank catalog items
  const filteredBankCatalog = useMemo(() => {
    return BANK_ACCOUNTS_CATALOG.filter(b => {
      const matchSearch =
        bankCatalogSearch === '' ||
        b.name.toLowerCase().includes(bankCatalogSearch.toLowerCase()) ||
        b.institution.toLowerCase().includes(bankCatalogSearch.toLowerCase()) ||
        b.tagline.toLowerCase().includes(bankCatalogSearch.toLowerCase()) ||
        (b.perks && b.perks.toLowerCase().includes(bankCatalogSearch.toLowerCase()));
      const matchCat = bankCatalogCategoryFilter === 'ALL' || b.category === bankCatalogCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [bankCatalogSearch, bankCatalogCategoryFilter]);

  const handleQuickAddBankPreset = (preset: BankAccountCatalogItem) => {
    addAccount({
      name: preset.name,
      institution: preset.institution,
      type: preset.type,
      openingBalance: preset.defaultBalance,
      icon: preset.icon,
      color: preset.color,
      accountTheme: preset.accountTheme,
      notes: preset.tagline,
      isActive: true,
    });
    setShowBankCatalogModal(false);
  };

  const handleQuickAddWalletPreset = (preset: WalletCatalogItem) => {
    addAccount({
      name: preset.name,
      institution: preset.institution,
      type: preset.id === 'w_cash_hand' ? 'CASH' : 'WALLET',
      openingBalance: preset.defaultBalance,
      icon: preset.icon,
      color: preset.color,
      accountTheme: preset.accountTheme,
      notes: preset.tagline,
      isActive: true,
    });
    setShowWalletCatalogModal(false);
  };

  const negativeAccounts = useMemo(() => {
    return accounts.filter(a => !a.isDeleted && (a.calculatedBalance || 0) < 0);
  }, [accounts]);

  const handleAutoHealBalances = () => {
    negativeAccounts.forEach(acc => {
      const deficiency = Math.abs(acc.calculatedBalance || 0);
      const currentOpening = acc.openingBalance || 0;
      updateAccount(acc.id, {
        openingBalance: currentOpening + deficiency,
      });
    });
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Account Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 block">Liquid Available</span>
          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">
            {formatINR(summary.availableBalance)}
          </span>
          <span className="text-[10px] text-slate-400">
            {bankAccounts.length} Banks • {walletAccounts.length} Wallets & Cash
          </span>
        </div>
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Credit Outstanding</span>
          <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400 block mt-1">
            {formatINR(summary.creditTotalOutstanding)}
          </span>
          <span className="text-[10px] text-slate-400">
            {summary.creditUtilizationPercent.toFixed(0)}% Limit Utilized across {activeCards.length} cards
          </span>
        </div>
      </div>

      {/* Auto-Heal Banner */}
      {negativeAccounts.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-900/40 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Negative Balances Detected
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Some of your imported accounts are currently in negative balance (e.g., <strong>{negativeAccounts.map(a => a.name).join(', ')}</strong>). 
                This usually occurs when you have logged expenses but haven't set an accurate Opening Balance for the account yet.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-1">
            <button
              onClick={handleAutoHealBalances}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <Sparkles size={12} />
              <span>Auto-Heal to ₹0</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Quick Action Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-1 p-1 pr-2 bg-slate-200/60 dark:bg-slate-800/80 rounded-2xl overflow-x-auto scrollbar-none no-scrollbar max-w-full scroll-smooth">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({activeAccounts.length + activeCards.length})
          </button>
          <button
            onClick={() => setActiveTab('BANKS')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'BANKS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Banks ({bankAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('CARDS')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'CARDS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cards ({activeCards.length})
          </button>
          <button
            onClick={() => setActiveTab('WALLETS')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'WALLETS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Wallets ({walletAccounts.length})
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowAddAccountModal(true)}
            className="px-2.5 py-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition-all active:scale-95"
            title="Add Bank Account"
          >
            <Plus size={13} />
            <span>Bank</span>
          </button>
          <button
            onClick={() => setShowAddCardModal(true)}
            className="px-2.5 py-1.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition-all active:scale-95"
            title="Add Credit Card"
          >
            <Plus size={13} />
            <span>Card</span>
          </button>
          <button
            onClick={() => setShowWalletCatalogModal(true)}
            className="px-2.5 py-1.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition-all active:scale-95"
            title="Add Digital Wallet or Cash"
          >
            <Wallet size={13} />
            <span>Wallet</span>
          </button>
        </div>
      </div>

      {/* Credit Cards Section */}
      {(activeTab === 'ALL' || activeTab === 'CARDS') && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <CreditCardIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Credit Cards</span>
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setIsCardsStacked(!isCardsStacked)}
                className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                  isCardsStacked
                    ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                }`}
                title={isCardsStacked ? 'Switch to Grid View' : 'Switch to Stacked Deck View'}
              >
                {isCardsStacked ? <Layers size={14} /> : <LayoutGrid size={14} />}
                <span className="text-[11px] hidden sm:inline">{isCardsStacked ? 'Stacked' : 'Grid'}</span>
              </button>
              <CardSortSelector
                currentSort={cardSortPreference}
                onSelectSort={setCardSortPreference}
                onOpenArrange={() => setShowArrangeCardsModal(true)}
              />
              <button
                onClick={() => setShowCatalogModal(true)}
                className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center space-x-1 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                title="Browse Indian Bank Credit Cards Catalog"
              >
                <Compass size={13} />
                <span>Cards Catalog</span>
              </button>
              <button
                onClick={() => setShowAddCardModal(true)}
                className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                title="Add Credit Card"
              >
                <Plus size={13} />
                <span>New Card</span>
              </button>
            </div>
          </div>

          {activeCards.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
              <CreditCardIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No credit cards added yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Add your credit cards or explore from 25+ popular bank presets</p>
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setShowCatalogModal(true)}
                  className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Compass size={14} />
                  <span>Browse Bank Catalog</span>
                </button>
                <button
                  onClick={() => setShowAddCardModal(true)}
                  className="px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Add Custom Card
                </button>
              </div>
            </div>
          ) : (
            <StackedCardsDeck
              cards={activeCards}
              isStacked={isCardsStacked}
              onToggleStacked={() => setIsCardsStacked(!isCardsStacked)}
              onViewTransactions={card => handleViewCardTransactions(card)}
              onEdit={card => openEditCard(card)}
              onDelete={card => setItemToDelete({ type: 'CARD', id: card.id, name: card.name })}
              onConvert={card => {
                setCardToConvert(card);
                setShowConvertCardModal(true);
              }}
              onPayBill={card => {
                setSelectedCardForPay(card);
                setPayAmountInput(card.currentOutstanding.toString());
                if (activeAccounts.length > 0) setSelectedBankForPay(activeAccounts[0].id);
                setShowCardPayModal(true);
              }}
            />
          )}
        </div>
      )}

      {/* Bank Accounts Section */}
      {(activeTab === 'ALL' || activeTab === 'BANKS') && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Bank Accounts & Deposits</span>
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setIsBanksStacked(!isBanksStacked)}
                className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                  isBanksStacked
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                }`}
                title={isBanksStacked ? 'Switch to Grid View' : 'Switch to Stacked Deck View'}
              >
                {isBanksStacked ? <Layers size={14} /> : <LayoutGrid size={14} />}
                <span className="text-[11px] hidden sm:inline">{isBanksStacked ? 'Stacked' : 'Grid'}</span>
              </button>
              <AccountSortSelector
                currentSort={accountSortPreference}
                onSelectSort={setAccountSortPreference}
                onOpenArrange={() => setShowArrangeAccountsModal(true)}
              />
              <button
                onClick={() => setShowBankCatalogModal(true)}
                className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-1 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                title="Browse Indian Bank Accounts & FD Catalogue"
              >
                <Compass size={13} />
                <span>Bank Catalog</span>
              </button>
              <button
                onClick={() => setShowAddAccountModal(true)}
                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                title="Add Bank Account"
              >
                <Plus size={13} />
                <span>New Bank</span>
              </button>
            </div>
          </div>

          {bankAccounts.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-4">
              <Building className="w-10 h-10 text-slate-400 mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No bank accounts added yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Choose from 20+ preset Indian bank accounts or add a custom one
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2 pt-1">
                <button
                  onClick={() => setShowBankCatalogModal(true)}
                  className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Compass size={14} />
                  <span>Browse Bank Catalog</span>
                </button>
                <button
                  onClick={() => setShowAddAccountModal(true)}
                  className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
                >
                  Add Custom Account
                </button>
              </div>
            </div>
          ) : (
            <StackedBanksDeck
              accounts={bankAccounts}
              isStacked={isBanksStacked}
              onToggleStacked={() => setIsBanksStacked(!isBanksStacked)}
              onViewTransactions={acc => handleViewAccountTransactions(acc)}
              onEdit={acc => openEditAccount(acc)}
              onConvert={acc => {
                setAccountToConvert(acc);
                setShowConvertModal(true);
              }}
              onDelete={acc => setItemToDelete({ type: 'ACCOUNT', id: acc.id, name: acc.name })}
              onReconcile={acc => {
                setSelectedAccForReconciliation(acc);
                setStatementBalanceInput(acc.calculatedBalance.toString());
                setShowReconciliationModal(true);
              }}
            />
          )}
        </div>
      )}

      {/* Digital Wallets & Cash Section */}
      {(activeTab === 'ALL' || activeTab === 'WALLETS') && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Wallet className="w-4 h-4 text-amber-500" />
                <span>Digital Wallets, Cash & Meal Cards</span>
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setIsWalletsStacked(!isWalletsStacked)}
                className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                  isWalletsStacked
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                }`}
                title={isWalletsStacked ? 'Switch to Grid View' : 'Switch to Stacked Deck View'}
              >
                {isWalletsStacked ? <Layers size={14} /> : <LayoutGrid size={14} />}
                <span className="text-[11px] hidden sm:inline">{isWalletsStacked ? 'Stacked' : 'Grid'}</span>
              </button>
              <button
                onClick={() => setShowArrangeAccountsModal(true)}
                className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center space-x-1 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                title="Arrange Wallets & Cash order"
              >
                <Layers size={13} />
                <span>Arrange</span>
              </button>
              <button
                onClick={() => setShowWalletCatalogModal(true)}
                className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center space-x-1 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                title="Browse Indian Digital Wallets Catalog"
              >
                <Sparkles size={13} />
                <span>Wallet Presets</span>
              </button>
              <button
                onClick={() => {
                  setNewAccName('Pocket Cash');
                  setNewAccInstitution('Cash');
                  setNewAccType('CASH');
                  setNewAccIcon('Banknote');
                  setNewAccColor('#16A34A');
                  setNewAccTheme('bank_cash');
                  setShowAddAccountModal(true);
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                title="Add Custom Wallet or Cash"
              >
                <Plus size={13} />
                <span>Custom</span>
              </button>
            </div>
          </div>

          {walletAccounts.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-amber-300/60 dark:border-amber-800/60">
              <Wallet className="w-10 h-10 text-amber-500/60 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No digital wallets or cash added yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Quickly link Amazon Pay Balance, Paytm, CRED Cash, or Cash in Hand</p>
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setShowWalletCatalogModal(true)}
                  className="px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Browse Wallets Catalog</span>
                </button>
              </div>
            </div>
          ) : (
            <StackedWalletsDeck
              accounts={walletAccounts}
              isStacked={isWalletsStacked}
              onToggleStacked={() => setIsWalletsStacked(!isWalletsStacked)}
              onViewTransactions={acc => handleViewAccountTransactions(acc)}
              onEdit={acc => openEditAccount(acc)}
              onConvert={acc => {
                setAccountToConvert(acc);
                setShowConvertModal(true);
              }}
              onDelete={acc => setItemToDelete({ type: 'ACCOUNT', id: acc.id, name: acc.name })}
              onReconcile={acc => {
                setSelectedAccForReconciliation(acc);
                setStatementBalanceInput(acc.calculatedBalance.toString());
                setShowReconciliationModal(true);
              }}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD ACCOUNT MODAL */}
      {/* ========================================================================= */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Bank or Cash Account</h3>
                <p className="text-[11px] text-slate-500">Track savings, salary, FD, or physical cash</p>
              </div>
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Account Nickname</label>
              <input
                type="text"
                value={newAccName}
                onChange={e => setNewAccName(e.target.value)}
                placeholder="e.g. HDFC Salary, Emergency Fund, Pocket Cash"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <CustomSelect
                  label="Bank / Institution"
                  title="Select Institution"
                  value={newAccInstitution}
                  onChange={val => handleAddBankChange(val)}
                  options={bankSelectOptions}
                  searchable={true}
                  searchPlaceholder="Search Indian banks..."
                  size="sm"
                />
              </div>
              <div>
                <CustomSelect
                  label="Account Type"
                  title="Select Account Type"
                  value={newAccType}
                  onChange={val => setNewAccType(val as AccountType)}
                  options={accountTypeSelectOptions}
                  size="sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  value={newAccOpeningBal}
                  onChange={e => setNewAccOpeningBal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Last 4 Digits (Optional)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={newAccLast4}
                  onChange={e => setNewAccLast4(e.target.value)}
                  placeholder="e.g. 4589"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono outline-none"
                />
              </div>
            </div>

            {/* Bank Signature Themes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>Theme & Card Aesthetic</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {BANK_ACCOUNT_THEMES.find(t => t.id === newAccTheme)?.name || 'Custom'}
                </span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                {BANK_ACCOUNT_THEMES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setNewAccTheme(t.id);
                      setNewAccColor(t.accentColor);
                    }}
                    className={`h-9 px-1 rounded-xl bg-gradient-to-r ${t.gradient} border flex flex-col items-center justify-center text-white text-[9px] font-bold shadow-xs transition-all ${
                      newAccTheme === t.id
                        ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 border-white scale-102'
                        : 'border-white/10 opacity-75 hover:opacity-100'
                    }`}
                    title={t.name}
                  >
                    <span className="truncate max-w-full">{t.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Choose Icon</label>
              <div className="grid grid-cols-6 gap-2">
                {ACCOUNT_ICONS.map(ic => (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => setNewAccIcon(ic.id)}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center border transition-all ${
                      newAccIcon === ic.id
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <IconHelper name={ic.id} className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] truncate max-w-full">{ic.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Accent Color</label>
              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                {ACCOUNT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewAccColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                      newAccColor === c ? 'scale-110 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {newAccColor === c && <Check size={12} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Notes / Purpose (Optional)</label>
              <input
                type="text"
                value={newAccNotes}
                onChange={e => setNewAccNotes(e.target.value)}
                placeholder="e.g. Primary household expenses, rent collection"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none"
              />
            </div>

            <button
              onClick={handleCreateAccount}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-98"
            >
              Create Account
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT ACCOUNT MODAL */}
      {/* ========================================================================= */}
      {showEditAccountModal && editingAccount && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Edit Bank Account</h3>
                <p className="text-[11px] text-slate-500">Update account details, bank theme, icon, and balances</p>
              </div>
              <button
                onClick={() => {
                  setShowEditAccountModal(false);
                  setEditingAccount(null);
                }}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Account Nickname</label>
              <input
                type="text"
                value={editAccName}
                onChange={e => setEditAccName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <CustomSelect
                  label="Bank / Institution"
                  title="Select Institution"
                  value={editAccInstitution}
                  onChange={val => {
                    setEditAccInstitution(val);
                    const b = INDIAN_BANKS.find(x => x.name === val);
                    if (b) {
                      setEditAccColor(b.color);
                      if (b.themeId) setEditAccTheme(b.themeId);
                    }
                  }}
                  options={bankSelectOptions}
                  searchable={true}
                  searchPlaceholder="Search Indian banks..."
                  size="sm"
                />
              </div>
              <div>
                <CustomSelect
                  label="Account Type"
                  title="Select Account Type"
                  value={editAccType}
                  onChange={val => setEditAccType(val as AccountType)}
                  options={accountTypeSelectOptions}
                  size="sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  value={editAccOpeningBal}
                  onChange={e => setEditAccOpeningBal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Last 4 Digits</label>
                <input
                  type="text"
                  maxLength={4}
                  value={editAccLast4}
                  onChange={e => setEditAccLast4(e.target.value)}
                  placeholder="e.g. 4589"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono outline-none"
                />
              </div>
            </div>

            {/* Bank Signature Themes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>Theme & Card Aesthetic</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {BANK_ACCOUNT_THEMES.find(t => t.id === editAccTheme)?.name || 'Custom'}
                </span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                {BANK_ACCOUNT_THEMES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setEditAccTheme(t.id);
                      setEditAccColor(t.accentColor);
                    }}
                    className={`h-9 px-1 rounded-xl bg-gradient-to-r ${t.gradient} border flex flex-col items-center justify-center text-white text-[9px] font-bold shadow-xs transition-all ${
                      editAccTheme === t.id
                        ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 border-white scale-102'
                        : 'border-white/10 opacity-75 hover:opacity-100'
                    }`}
                    title={t.name}
                  >
                    <span className="truncate max-w-full">{t.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Choose Icon</label>
              <div className="grid grid-cols-6 gap-2">
                {ACCOUNT_ICONS.map(ic => (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => setEditAccIcon(ic.id)}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center border transition-all ${
                      editAccIcon === ic.id
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <IconHelper name={ic.id} className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] truncate max-w-full">{ic.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Theme Color</label>
              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                {ACCOUNT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditAccColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                      editAccColor === c ? 'scale-110 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {editAccColor === c && <Check size={12} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Notes / Purpose</label>
              <input
                type="text"
                value={editAccNotes}
                onChange={e => setEditAccNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editAccIsActive}
                  onChange={e => setEditAccIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Account</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editAccExcludeNetWorth}
                  onChange={e => setEditAccExcludeNetWorth(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Exclude from Net Worth</span>
              </label>
            </div>

            <div className="pt-2 flex items-center space-x-2 flex-wrap gap-y-2">
              <button
                type="button"
                onClick={() => {
                  const target = editingAccount;
                  setShowEditAccountModal(false);
                  setAccountToConvert(target);
                  setShowConvertModal(true);
                }}
                className="px-3 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs transition-colors flex items-center space-x-1.5 border border-purple-200 dark:border-purple-800"
                title="Convert this bank account into a credit card with limit & luxury theme"
              >
                <ArrowRightLeft size={13} />
                <span>Convert to Card</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowEditAccountModal(false);
                  setItemToDelete({ type: 'ACCOUNT', id: editingAccount.id, name: editingAccount.name });
                }}
                className="px-3 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors flex items-center space-x-1"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>

              <button
                onClick={handleSaveEditAccount}
                className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-98"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD CREDIT CARD MODAL */}
      {/* ========================================================================= */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Credit Card</h3>
                <p className="text-[11px] text-slate-500">Select bank to see available cards or customize themes</p>
              </div>
              <button
                onClick={() => setShowAddCardModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Available Cards for Currently Selected Bank */}
            {availableAddBankCards.length > 0 && (
              <div className="p-3 bg-purple-500/5 dark:bg-purple-950/30 rounded-2xl border border-purple-500/15 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center space-x-1">
                    <Sparkles size={12} className="text-purple-500" />
                    <span>Cards for {newCardIssuer} (Tap to Autofill)</span>
                  </label>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                    {availableAddBankCards.length} cards
                  </span>
                </div>
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                  {availableAddBankCards.map((cItem, idx) => (
                    <button
                      key={cItem.id || `${cItem.issuer}-${cItem.name}-${idx}`}
                      type="button"
                      onClick={() => applyCardCatalogItem(cItem)}
                      className={`px-3 py-2 rounded-xl text-left border flex-shrink-0 transition-all ${
                        newCardName === cItem.name
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold truncate max-w-[140px]">{cItem.name}</div>
                      <div className="flex items-center space-x-1.5 mt-0.5 text-[9px] opacity-80">
                        <span className="uppercase font-mono">{cItem.network}</span>
                        <span>•</span>
                        <span className="truncate max-w-[70px]">{cItem.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Card Name</label>
              <input
                type="text"
                value={newCardName}
                onChange={e => setNewCardName(e.target.value)}
                placeholder="e.g. HDFC Infinia, Amazon Pay ICICI, SBI Cashback"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <CustomSelect
                  label="Issuer Bank"
                  title="Select Issuer Bank"
                  value={newCardIssuer}
                  onChange={val => setNewCardIssuer(val)}
                  options={bankSelectOptions}
                  searchable={true}
                  searchPlaceholder="Search bank..."
                  size="sm"
                />
              </div>

              <div>
                <CustomSelect
                  label="Card Network"
                  title="Select Card Network"
                  value={newCardNetwork}
                  onChange={val => setNewCardNetwork(val as CardNetwork)}
                  options={cardNetworkSelectOptions}
                  size="sm"
                />
              </div>
            </div>

            {/* Rich Visual Card Themes Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Card Theme & Metallic Textures ({CARD_THEMES.length} Luxury Styles)
                </label>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                  {CARD_THEMES.find(t => t.id === newCardTheme)?.name}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                {CARD_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setNewCardTheme(theme.id)}
                    className={`h-10 rounded-xl bg-gradient-to-br ${theme.gradient} border flex flex-col items-center justify-center shadow-sm relative transition-all ${
                      newCardTheme === theme.id
                        ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900 border-white scale-105'
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                    title={theme.name}
                  >
                    {newCardTheme === theme.id && <Check size={12} className="text-white drop-shadow" />}
                    <span className="text-[8px] text-white/80 font-bold tracking-tighter truncate max-w-full px-0.5">
                      {theme.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Last 4 Digits</label>
                <input
                  type="text"
                  maxLength={4}
                  value={newCardLast4}
                  onChange={e => setNewCardLast4(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  value={newCardLimit}
                  onChange={e => setNewCardLimit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Outstanding (₹)</label>
                <input
                  type="number"
                  value={newCardOutstanding}
                  onChange={e => setNewCardOutstanding(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Statement Day</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={newCardStatementDay}
                  onChange={e => setNewCardStatementDay(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Due Day</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={newCardDueDay}
                  onChange={e => setNewCardDueDay(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Card Rewards / Perks Note</label>
              <input
                type="text"
                value={newCardNotes}
                onChange={e => setNewCardNotes(e.target.value)}
                placeholder="e.g. 5% cashback on Flipkart & Swiggy, 4 lounge visits"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none"
              />
            </div>

            <button
              onClick={handleCreateCard}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md transition-all active:scale-98"
            >
              Add Credit Card
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT CREDIT CARD MODAL */}
      {/* ========================================================================= */}
      {showEditCardModal && editingCard && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Edit Credit Card</h3>
                <p className="text-[11px] text-slate-500">Update card limits, network, billing days & theme</p>
              </div>
              <button
                onClick={() => {
                  setShowEditCardModal(false);
                  setEditingCard(null);
                }}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Available Cards for this Bank Preset Selector */}
            {availableEditBankCards.length > 0 && (
              <div className="p-3 bg-purple-500/5 dark:bg-purple-950/30 rounded-2xl border border-purple-500/15 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center space-x-1">
                    <Sparkles size={12} className="text-purple-500" />
                    <span>Cards for {editCardIssuer} (Tap to Autofill)</span>
                  </label>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                    {availableEditBankCards.length} cards
                  </span>
                </div>
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                  {availableEditBankCards.map((cItem, idx) => (
                    <button
                      key={cItem.id || `${cItem.issuer}-${cItem.name}-${idx}`}
                      type="button"
                      onClick={() => applyCardCatalogItemToEdit(cItem)}
                      className={`px-3 py-2 rounded-xl text-left border flex-shrink-0 transition-all ${
                        editCardName === cItem.name
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold truncate max-w-[140px]">{cItem.name}</div>
                      <div className="flex items-center space-x-1.5 mt-0.5 text-[9px] opacity-80">
                        <span className="uppercase font-mono">{cItem.network}</span>
                        <span>•</span>
                        <span className="truncate max-w-[70px]">{cItem.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Card Name</label>
              <input
                type="text"
                value={editCardName}
                onChange={e => setEditCardName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <CustomSelect
                  label="Issuer Bank"
                  title="Select Issuer Bank"
                  value={editCardIssuer}
                  onChange={val => setEditCardIssuer(val)}
                  options={bankSelectOptions}
                  searchable={true}
                  searchPlaceholder="Search bank..."
                  size="sm"
                />
              </div>

              <div>
                <CustomSelect
                  label="Card Network"
                  title="Select Card Network"
                  value={editCardNetwork}
                  onChange={val => setEditCardNetwork(val as CardNetwork)}
                  options={cardNetworkSelectOptions}
                  size="sm"
                />
              </div>
            </div>

            {/* Rich Visual Card Themes Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Card Theme & Metallic Textures ({CARD_THEMES.length} Luxury Styles)
                </label>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                  {CARD_THEMES.find(t => t.id === editCardTheme)?.name}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-2xl bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-800">
                {CARD_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setEditCardTheme(theme.id)}
                    className={`h-10 rounded-xl bg-gradient-to-br ${theme.gradient} border flex flex-col items-center justify-center shadow-sm relative transition-all ${
                      editCardTheme === theme.id
                        ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900 border-white scale-105'
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                    title={theme.name}
                  >
                    {editCardTheme === theme.id && <Check size={12} className="text-white drop-shadow" />}
                    <span className="text-[8px] text-white/80 font-bold tracking-tighter truncate max-w-full px-0.5">
                      {theme.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Last 4 Digits</label>
                <input
                  type="text"
                  maxLength={4}
                  value={editCardLast4}
                  onChange={e => setEditCardLast4(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  value={editCardLimit}
                  onChange={e => setEditCardLimit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Initial Balance (₹)</label>
                <input
                  type="number"
                  value={editCardOpeningBal}
                  onChange={e => setEditCardOpeningBal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Statement Day</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={editCardStatementDay}
                  onChange={e => setEditCardStatementDay(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Due Day</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={editCardDueDay}
                  onChange={e => setEditCardDueDay(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Card Rewards / Perks Note</label>
              <input
                type="text"
                value={editCardNotes}
                onChange={e => setEditCardNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editCardIsActive}
                  onChange={e => setEditCardIsActive(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Card</span>
              </label>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditCardModal(false);
                  setItemToDelete({ type: 'CARD', id: editingCard.id, name: editingCard.name });
                }}
                className="px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors flex items-center space-x-1"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>

              <button
                onClick={handleSaveEditCard}
                className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md transition-all active:scale-98"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BROWSE ALL BANK CREDIT CARDS CATALOG MODAL */}
      {/* ========================================================================= */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-2xl w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Compass size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Indian Bank Credit Cards Catalog</h3>
                  <p className="text-[11px] text-slate-500">Explore 60+ curated cards across top Indian banks with cashback & lounge perks</p>
                </div>
              </div>
              <button
                onClick={() => setShowCatalogModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by card name, bank, cashback, lounge, UPI..."
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Bank Filter Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  onClick={() => setCatalogBankFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold flex-shrink-0 transition-colors ${
                    catalogBankFilter === 'ALL'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  All Banks
                </button>
                {INDIAN_BANKS.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setCatalogBankFilter(b.name)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex-shrink-0 transition-colors ${
                      catalogBankFilter === b.name
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {['ALL', 'Super Premium', 'Travel & Lounge', 'Cashback', 'RuPay UPI', 'Rewards & Dining', 'Shopping', 'Fuel'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCatalogCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex-shrink-0 transition-colors ${
                      catalogCategoryFilter === cat
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
              {filteredCatalogCards.length === 0 ? (
                <div className="col-span-2 py-10 text-center text-slate-400 text-xs">
                  No cards found matching your search. Try different filters.
                </div>
              ) : (
                filteredCatalogCards.map((cItem, idx) => {
                  const theme = CARD_THEMES.find(t => t.id === cItem.theme) || CARD_THEMES[0];
                  const bank = INDIAN_BANKS.find(b => b.name === cItem.issuer);

                  return (
                    <div
                      key={cItem.id || `${cItem.issuer}-${cItem.name}-${idx}`}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between space-y-2.5"
                    >
                      {/* Mini Preview Header */}
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <span
                              className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase text-white shadow-sm"
                              style={{ backgroundColor: bank?.color || '#004c8f' }}
                            >
                              {bank?.logoText || cItem.issuer.substring(0, 3)}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                              {cItem.tier}
                            </span>
                          </div>
                          <NetworkLogo network={cItem.network} className="h-4" light={false} />
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5 leading-snug">
                          {cItem.name}
                        </h4>
                        <p className="text-[10px] text-slate-500">{cItem.issuer}</p>

                        <div className="mt-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2">
                          ✨ {cItem.perks}
                        </div>
                      </div>

                      {/* Theme visual pill + Action Button */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800">
                        <div className="flex items-center space-x-1.5">
                          <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${theme.gradient} border border-white/20`} />
                          <span className="text-[10px] text-slate-400 font-medium">{theme.name}</span>
                        </div>

                        <button
                          onClick={() => {
                            applyCardCatalogItem(cItem);
                            setShowCatalogModal(false);
                            setShowAddCardModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shadow-sm flex items-center space-x-1 active:scale-95 transition-all"
                        >
                          <span>Autofill Card</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full space-y-4 border border-rose-200 dark:border-rose-900/40 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 rounded-2xl bg-rose-100 dark:bg-rose-950/50">
                <AlertCircle size={22} />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{itemToDelete.name}</strong>?
              Associated historical transactions will remain in your ledger.
            </p>
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Reconciliation Modal */}
      {showReconciliationModal && selectedAccForReconciliation && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Account Reconciliation</h3>
              <button onClick={() => setShowReconciliationModal(false)} className="text-slate-500">
                <X size={18} />
              </button>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Account:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedAccForReconciliation.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">App Calculated Balance:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatINR(selectedAccForReconciliation.calculatedBalance)}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Actual Bank Statement Balance (₹)
              </label>
              <input
                type="number"
                value={statementBalanceInput}
                onChange={e => setStatementBalanceInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>
            {/* Show difference */}
            {(() => {
              const stmtVal = parseFloat(statementBalanceInput) || 0;
              const diff = stmtVal - selectedAccForReconciliation.calculatedBalance;
              return (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-xs flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Discrepancy / Difference:</span>
                  <span className={`font-bold ${diff === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {formatINR(diff)}
                  </span>
                </div>
              );
            })()}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Notes</label>
              <input
                type="text"
                placeholder="e.g. Verified with HDFC NetBanking"
                value={reconciliationNotes}
                onChange={e => setReconciliationNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => handleReconcileSubmit(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Log Only
              </button>
              <button
                onClick={() => handleReconcileSubmit(true)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm"
              >
                Auto-Adjust
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Card Bill Payment Modal */}
      {showCardPayModal && selectedCardForPay && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pay Credit Card Bill</h3>
              <button onClick={() => setShowCardPayModal(false)} className="text-slate-500">
                <X size={18} />
              </button>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Card:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedCardForPay.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Outstanding:</span>
                <span className="font-bold text-rose-500">{formatINR(selectedCardForPay.currentOutstanding)}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Payment Amount (₹)</label>
              <input
                type="number"
                value={payAmountInput}
                onChange={e => setPayAmountInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-base font-bold outline-none text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <CustomSelect
                label="Pay From Bank Account"
                title="Select Bank Account"
                value={selectedBankForPay}
                onChange={val => setSelectedBankForPay(val)}
                options={bankAccountsForPayOptions}
                searchable={true}
                searchPlaceholder="Search accounts..."
              />
            </div>
            <button
              onClick={handleCardPaySubmit}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-98"
            >
              Record Bill Payment
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIGITAL WALLETS & CASH CATALOG MODAL */}
      {/* ========================================================================= */}
      {showWalletCatalogModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-xl w-full space-y-4 border border-amber-200/80 dark:border-amber-900/40 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Indian Digital Wallets & Cash Presets
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    One-click add Amazon Pay, CRED Cash, Paytm, PhonePe, Sodexo & Cash
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWalletCatalogModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative shrink-0">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by wallet name, e-commerce app, or keyword..."
                value={walletCatalogSearch}
                onChange={e => setWalletCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-400"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
              {(['ALL', 'UPI Wallet', 'E-Commerce', 'Credit Line', 'Meal & Prepaid', 'Cash'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setWalletCatalogCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    walletCatalogCategoryFilter === cat
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'ALL' ? 'All Wallets' : cat}
                </button>
              ))}
            </div>

            {/* Grid of Preset Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1">
              {filteredWalletCatalog.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                  No wallets found matching your search.
                </div>
              ) : (
                filteredWalletCatalog.map((wItem, idx) => {
                  const alreadyExists = activeAccounts.some(
                    a =>
                      a.name.toLowerCase() === wItem.name.toLowerCase() ||
                      (a.institution.toLowerCase() === wItem.institution.toLowerCase() && a.type === 'WALLET')
                  );
                  const theme = BANK_ACCOUNT_THEMES.find(t => t.id === wItem.accountTheme) || BANK_ACCOUNT_THEMES[0];

                  return (
                    <div
                      key={`wallet_cat_${wItem.id}_${idx}`}
                      className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-amber-400 dark:hover:border-amber-600 transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                              style={{ backgroundColor: wItem.color }}
                            >
                              <IconHelper name={wItem.icon} className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {wItem.category}
                              </span>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                                {wItem.name}
                              </h4>
                            </div>
                          </div>
                          {alreadyExists && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              Added
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                          {wItem.tagline}
                        </p>
                      </div>

                      {/* Theme visual pill & Add Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center space-x-1.5">
                          <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${theme.gradient} border border-white/20`} />
                          <span className="text-[10px] text-slate-400 font-medium">{theme.name.split(' ')[0]}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setNewAccName(wItem.name);
                              setNewAccInstitution(wItem.institution);
                              setNewAccType(wItem.id === 'w_cash_hand' ? 'CASH' : 'WALLET');
                              setNewAccOpeningBal(wItem.defaultBalance.toString());
                              setNewAccIcon(wItem.icon);
                              setNewAccColor(wItem.color);
                              setNewAccTheme(wItem.accountTheme);
                              setNewAccNotes(wItem.tagline);
                              setShowWalletCatalogModal(false);
                              setShowAddAccountModal(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-[10px] transition-all"
                            title="Customize balance and details before adding"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleQuickAddWalletPreset(wItem)}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] shadow-sm flex items-center space-x-1 active:scale-95 transition-all"
                          >
                            <Plus size={11} />
                            <span>1-Click Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INDIAN BANK ACCOUNTS & FD CATALOGUE MODAL */}
      {/* ========================================================================= */}
      {showBankCatalogModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-2xl w-full space-y-4 border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Building size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Indian Bank Accounts & FD Catalogue
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    One-click add HDFC, SBI, ICICI, Kotak 811, Axis, IDFC FIRST, Neobanks & Fixed Deposits
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBankCatalogModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative shrink-0">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by bank name, account type, perks, or interest rates..."
                value={bankCatalogSearch}
                onChange={e => setBankCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
              {(['ALL', 'Top Private', 'PSU & Govt', 'Salary Accounts', 'Zero Balance & Digital', 'Fixed Deposits'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setBankCatalogCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    bankCatalogCategoryFilter === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'ALL' ? 'All Banks' : cat}
                </button>
              ))}
            </div>

            {/* Grid of Bank Preset Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1">
              {filteredBankCatalog.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                  No bank accounts found matching your search.
                </div>
              ) : (
                filteredBankCatalog.map((bItem, idx) => {
                  const alreadyExists = activeAccounts.some(
                    a =>
                      a.name.toLowerCase() === bItem.name.toLowerCase() ||
                      (a.institution.toLowerCase() === bItem.institution.toLowerCase() && a.type === bItem.type)
                  );
                  const theme = BANK_ACCOUNT_THEMES.find(t => t.id === bItem.accountTheme) || BANK_ACCOUNT_THEMES[0];

                  return (
                    <div
                      key={`bank_cat_${bItem.id}_${idx}`}
                      className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                              style={{ backgroundColor: bItem.color }}
                            >
                              <IconHelper name={bItem.icon} className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                                {bItem.category} • {bItem.type}
                              </span>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight truncate">
                                {bItem.name}
                              </h4>
                            </div>
                          </div>
                          {alreadyExists && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold shrink-0">
                              Added
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                          {bItem.tagline}
                        </p>

                        {/* Rate and MAB Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {bItem.interestRate && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                              {bItem.interestRate}
                            </span>
                          )}
                          {bItem.minBalance && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                              {bItem.minBalance}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Theme visual pill & Add Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center space-x-1.5">
                          <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${theme.gradient} border border-white/20`} />
                          <span className="text-[10px] text-slate-400 font-medium">{bItem.institution}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setNewAccName(bItem.name);
                              setNewAccInstitution(bItem.institution);
                              setNewAccType(bItem.type);
                              setNewAccOpeningBal(bItem.defaultBalance.toString());
                              setNewAccIcon(bItem.icon);
                              setNewAccColor(bItem.color);
                              setNewAccTheme(bItem.accountTheme);
                              setNewAccNotes(bItem.tagline);
                              setShowBankCatalogModal(false);
                              setShowAddAccountModal(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-[10px] transition-all"
                            title="Customize balance and details before adding"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleQuickAddBankPreset(bItem)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-sm flex items-center space-x-1 active:scale-95 transition-all"
                          >
                            <Plus size={11} />
                            <span>1-Click Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ARRANGE / REORDER MODALS */}
      {/* ========================================================================= */}
      <ArrangeAccountsModal
        isOpen={showArrangeAccountsModal}
        onClose={() => setShowArrangeAccountsModal(false)}
        accounts={activeAccounts}
        onSaveOrder={(orderedIds) => {
          reorderAccounts(orderedIds);
          setAccountSortPreference('CUSTOM');
        }}
      />

      <ArrangeCardsModal
        isOpen={showArrangeCardsModal}
        onClose={() => setShowArrangeCardsModal(false)}
        cards={activeCards}
        onSaveOrder={(orderedIds) => {
          reorderCreditCards(orderedIds);
          setCardSortPreference('CUSTOM');
        }}
      />

      {/* ========================================================================= */}
      {/* CONVERT BANK ACCOUNT TO CREDIT CARD MODAL */}
      {/* ========================================================================= */}
      <ConvertBankModal
        isOpen={showConvertModal}
        onClose={() => {
          setShowConvertModal(false);
          setAccountToConvert(null);
        }}
        targetAccount={accountToConvert}
      />

      {/* ========================================================================= */}
      {/* CONVERT CREDIT CARD TO BANK ACCOUNT MODAL */}
      {/* ========================================================================= */}
      <ConvertCreditCardModal
        isOpen={showConvertCardModal}
        onClose={() => {
          setShowConvertCardModal(false);
          setCardToConvert(null);
        }}
        targetCard={cardToConvert}
      />

      {/* ========================================================================= */}
      {/* ACCOUNT / CARD DRILL-DOWN TRANSACTIONS MODAL */}
      {/* ========================================================================= */}
      <AccountTransactionsModal
        isOpen={Boolean(selectedAccountForTxModal || selectedCardForTxModal)}
        onClose={() => {
          setSelectedAccountForTxModal(null);
          setSelectedCardForTxModal(null);
        }}
        account={selectedAccountForTxModal}
        card={selectedCardForTxModal}
        onSelectTransaction={onSelectTransaction}
        onOpenAdd={onOpenAdd}
        onNavigateToFullFeed={onNavigateToFullFeed}
        onEditTransaction={onEditTransaction}
      />
    </div>
  );
};
