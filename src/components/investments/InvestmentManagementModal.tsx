import { TransactionRow } from '../transactions/TransactionRow';
import { useScrollLock } from '../../hooks/useScrollLock';
import React, { useState, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Investment, InvestmentCategory, InvestmentCatalogItem } from '../../types';
import { formatINR } from '../../lib/currency';
import { ThemeColorPicker } from '../../lib/colorPalettes';
import { Emblem3D, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { History, 
  X,
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  TrendingUp,
  Layers,
 } from 'lucide-react';

interface InvestmentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const INVESTMENT_CATALOGUE: InvestmentCatalogItem[] = [
  // Mutual Funds & Index Funds
  {
    id: 'inv_nifty50',
    name: 'Nifty 50 Index Mutual Fund',
    category: 'MUTUAL_FUNDS',
    tagline: 'Top 50 largest blue-chip Indian companies index tracker',
    icon: 'TrendingUp',
    color: '#10B981',
    gradient: 'from-emerald-600 via-teal-700 to-slate-900',
    expectedReturn: '12-14% p.a.',
    riskLevel: 'Moderate',
    popular: true,
  },
  {
    id: 'inv_flexicap',
    name: 'Flexi Cap Equity Fund',
    category: 'MUTUAL_FUNDS',
    tagline: 'Diversified equity fund investing across large, mid & small caps',
    icon: 'PieChart',
    color: '#059669',
    gradient: 'from-emerald-500 to-teal-800',
    expectedReturn: '13-16% p.a.',
    riskLevel: 'High',
    popular: true,
  },
  {
    id: 'inv_smallcap',
    name: 'Small Cap Growth Fund',
    category: 'MUTUAL_FUNDS',
    tagline: 'High-growth emerging Indian enterprises with high upside potential',
    icon: 'Rocket',
    color: '#10B981',
    gradient: 'from-teal-500 to-emerald-900',
    expectedReturn: '16-20% p.a.',
    riskLevel: 'Very High',
    popular: true,
  },

  // Direct Stocks & Equity
  {
    id: 'inv_bluechip_stocks',
    name: 'Blue Chip Large-Cap Stocks',
    category: 'STOCKS',
    tagline: 'Reliance, TCS, HDFC Bank, Infosys, ICICI direct portfolio',
    icon: 'Landmark',
    color: '#3B82F6',
    gradient: 'from-blue-600 to-indigo-900',
    expectedReturn: '12-15% p.a.',
    riskLevel: 'Moderate',
    popular: true,
  },
  {
    id: 'inv_tech_growth_stocks',
    name: 'Tech & EV Sector Basket',
    category: 'STOCKS',
    tagline: 'Emerging technology, renewable energy & EV suppliers basket',
    icon: 'Zap',
    color: '#6366F1',
    gradient: 'from-indigo-600 to-blue-900',
    expectedReturn: '15-22% p.a.',
    riskLevel: 'High',
    popular: false,
  },

  // Gold & Precious Metals
  {
    id: 'inv_sgb_gold',
    name: 'Sovereign Gold Bonds (SGB)',
    category: 'GOLD',
    tagline: 'RBI issued 2.5% annual interest + tax-free gold price appreciation',
    icon: 'Gem',
    color: '#F59E0B',
    gradient: 'from-amber-500 via-yellow-600 to-amber-900',
    expectedReturn: '10-12% + 2.5%',
    riskLevel: 'Low',
    popular: true,
  },
  {
    id: 'inv_gold_etf',
    name: 'Physical Gold ETF / Digital Gold',
    category: 'GOLD',
    tagline: '99.9% pure 24K bullion tracked digitally on NSE/BSE',
    icon: 'Coins',
    color: '#D97706',
    gradient: 'from-yellow-500 to-amber-800',
    expectedReturn: '9-11% p.a.',
    riskLevel: 'Low',
    popular: true,
  },

  // Fixed Deposits & Govt Schemes
  {
    id: 'inv_bank_fd',
    name: 'Bank Fixed Deposit (FD)',
    category: 'FIXED_DEPOSIT',
    tagline: 'Guaranteed returns up to ₹5 Lakh insured by RBI DICGC',
    icon: 'Shield',
    color: '#8B5CF6',
    gradient: 'from-purple-600 to-slate-900',
    expectedReturn: '7.1-7.8% p.a.',
    riskLevel: 'Low',
    popular: true,
  },
  {
    id: 'inv_ppf_reserve',
    name: 'Public Provident Fund (PPF)',
    category: 'PPF_EPF',
    tagline: '15-year sovereign guaranteed tax-free (EEE) wealth creator',
    icon: 'Award',
    color: '#06B6D4',
    gradient: 'from-cyan-600 to-teal-900',
    expectedReturn: '7.1% p.a. (Tax Free)',
    riskLevel: 'Low',
    popular: true,
  },
  {
    id: 'inv_nps_retirement',
    name: 'National Pension Scheme (NPS)',
    category: 'NPS',
    tagline: 'Market-linked retirement pension with Section 80CCD tax deduction',
    icon: 'Award',
    color: '#0EA5E9',
    gradient: 'from-sky-600 to-blue-900',
    expectedReturn: '9-12% p.a.',
    riskLevel: 'Moderate',
    popular: false,
  },

  // Real Estate & REITs
  {
    id: 'inv_reit_units',
    name: 'Commercial Real Estate REITs',
    category: 'REAL_ESTATE',
    tagline: 'Fractional ownership in Grade-A IT parks & commercial offices',
    icon: 'Building',
    color: '#EC4899',
    gradient: 'from-pink-600 to-rose-900',
    expectedReturn: '8-10% yield',
    riskLevel: 'Moderate',
    popular: false,
  },

  // Crypto & Digital Assets
  {
    id: 'inv_bitcoin_crypto',
    name: 'Bitcoin & Top Crypto Basket',
    category: 'CRYPTO',
    tagline: 'Decentralized digital store of value & layer-1 network tokens',
    icon: 'Coins',
    color: '#F97316',
    gradient: 'from-orange-500 to-red-800',
    expectedReturn: 'Variable High',
    riskLevel: 'Very High',
    popular: false,
  },
];

const INVESTMENT_CATEGORIES_CONFIG: Record<
  InvestmentCategory,
  { label: string; icon: string; color: string; bg: string }
> = {
  MUTUAL_FUNDS: { label: 'Mutual Funds', icon: 'TrendingUp', color: '#10B981', bg: 'bg-emerald-500/10 text-emerald-600' },
  STOCKS: { label: 'Stocks & Equity', icon: 'Landmark', color: '#3B82F6', bg: 'bg-blue-500/10 text-blue-600' },
  FIXED_DEPOSIT: { label: 'Fixed Deposit (FD)', icon: 'Shield', color: '#8B5CF6', bg: 'bg-purple-500/10 text-purple-600' },
  RECURRING_DEPOSIT: { label: 'Recurring Deposit (RD)', icon: 'Repeat', color: '#6366F1', bg: 'bg-indigo-500/10 text-indigo-600' },
  GOLD: { label: 'Gold & SGB', icon: 'Gem', color: '#F59E0B', bg: 'bg-amber-500/10 text-amber-600' },
  PPF: { label: 'Public Provident Fund (PPF)', icon: 'Award', color: '#06B6D4', bg: 'bg-cyan-500/10 text-cyan-600' },
  PPF_EPF: { label: 'PPF & EPF', icon: 'Award', color: '#06B6D4', bg: 'bg-cyan-500/10 text-cyan-600' },
  NPS: { label: 'National Pension (NPS)', icon: 'Award', color: '#0EA5E9', bg: 'bg-sky-500/10 text-sky-600' },
  REAL_ESTATE: { label: 'Real Estate / REIT', icon: 'Building', color: '#EC4899', bg: 'bg-pink-500/10 text-pink-600' },
  CRYPTO: { label: 'Crypto & Web3', icon: 'Coins', color: '#F97316', bg: 'bg-orange-500/10 text-orange-600' },
  BONDS: { label: 'Govt / Corp Bonds', icon: 'ShieldCheck', color: '#64748B', bg: 'bg-slate-500/10 text-slate-600' },
  OTHER: { label: 'Other Assets', icon: 'DollarSign', color: '#94A3B8', bg: 'bg-slate-500/10 text-slate-600' },
};

export const InvestmentManagementModal: React.FC<InvestmentManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  useScrollLock(isOpen);

  const { transactions, investments, accounts, creditCards, paymentApps, addInvestment, updateInvestment, deleteInvestment } = useMoney();

  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'CATALOGUE' | 'CUSTOM'>('PORTFOLIO');
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete confirmation state
  const [deleteConfirmInv, setDeleteConfirmInv] = useState<Investment | null>(null);

  // Quick Adopt State
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<InvestmentCatalogItem | null>(null);
  const [adoptInstitution, setAdoptInstitution] = useState('');
  const [adoptAmount, setAdoptAmount] = useState('50000');
  const [adoptCurrentValue, setAdoptCurrentValue] = useState('50000');
  const [adoptPurchaseDate, setAdoptPurchaseDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [adoptAccountId, setAdoptAccountId] = useState('');
  const [adoptCreditCardId, setAdoptCreditCardId] = useState('');
  const [adoptPaymentAppId, setAdoptPaymentAppId] = useState('');

  // Custom Investment Form State
  const [customName, setCustomName] = useState('');
  const [customInstitution, setCustomInstitution] = useState('');
  const [customCategory, setCustomCategory] = useState<InvestmentCategory>('MUTUAL_FUNDS');
  const [customInvestedAmt, setCustomInvestedAmt] = useState('');
  const [customCurrentVal, setCustomCurrentVal] = useState('');
  const [customFolio, setCustomFolio] = useState('');
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [customAccountId, setCustomAccountId] = useState('');
  const [customCreditCardId, setCustomCreditCardId] = useState('');
  const [customPaymentAppId, setCustomPaymentAppId] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [customColor, setCustomColor] = useState('#10B981');

  // Editing investment state
  const [editingInv, setEditingInv] = useState<Investment | null>(null);
  const [historyInv, setHistoryInv] = useState<Investment | null>(null);

  // Portfolio Totals
  const { totalInvested, totalCurrentVal, totalAbsoluteGain, totalGainPercent } = useMemo(() => {
    let invested = 0;
    let current = 0;
    investments.forEach(inv => {
      invested += inv.investedAmount || 0;
      current += inv.currentValue ?? inv.investedAmount ?? 0;
    });
    const gain = current - invested;
    const gainPct = invested > 0 ? (gain / invested) * 100 : 0;

    return {
      totalInvested: invested,
      totalCurrentVal: current,
      totalAbsoluteGain: gain,
      totalGainPercent: gainPct,
    };
  }, [investments]);

  const filteredInvestments = useMemo(() => {
    return investments.filter(inv => {
      if (inv.isDeleted) return false;
      const matchSearch =
        !searchQuery.trim() ||
        inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = catFilter === 'ALL' || inv.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [investments, searchQuery, catFilter]);

  const filteredCatalogue = useMemo(() => {
    return INVESTMENT_CATALOGUE.filter(item => {
      const matchSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = catFilter === 'ALL' || item.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [searchQuery, catFilter]);

  const accountOptions: SelectOption<string>[] = useMemo(() => {
    const opts: SelectOption<string>[] = [
      { value: '', label: 'Unlinked / Outside Portfolio' },
    ];
    accounts.forEach(a => {
      opts.push({
        value: a.id,
        label: a.name,
        sublabel: `${a.institution} • ${formatINR(a.calculatedBalance)}`,
        isBankAccount: true,
        bankTheme: a.institution,
      });
    });
    return opts;
  }, [accounts]);

  const categoryOptions: SelectOption<InvestmentCategory>[] = Object.entries(
    INVESTMENT_CATEGORIES_CONFIG
  ).map(([key, val]) => ({
    value: key as InvestmentCategory,
    label: val.label,
  }));

  const handleOpenAdopt = (item: InvestmentCatalogItem) => {
    setSelectedCatalogItem(item);
    setAdoptAmount('50000');
    setAdoptCurrentValue('50000');
  };

  const handleConfirmAdopt = () => {
    if (!selectedCatalogItem) return;
    const invAmt = parseFloat(adoptAmount) || 50000;
    const curVal = parseFloat(adoptCurrentValue) || invAmt;

    addInvestment({
      name: selectedCatalogItem.name,
      institution: adoptInstitution || undefined,
      category: selectedCatalogItem.category,
      investedAmount: invAmt,
      currentValue: curVal,
      purchaseDate: adoptPurchaseDate,
      linkedAccountId: adoptAccountId || undefined,
      linkedCreditCardId: adoptCreditCardId || undefined,
      linkedPaymentAppId: adoptPaymentAppId || undefined,
      icon: selectedCatalogItem.icon,
      color: selectedCatalogItem.color,
      notes: selectedCatalogItem.tagline,
    });

    setSelectedCatalogItem(null);
    setActiveTab('PORTFOLIO');
  };

  const handleCreateCustom = () => {
    if (!customName.trim()) {
      alert('Please enter investment asset name');
      return;
    }
    const invAmt = parseFloat(customInvestedAmt);
    if (isNaN(invAmt) || invAmt <= 0) {
      alert('Please enter a valid invested amount');
      return;
    }
    const curVal = customCurrentVal ? parseFloat(customCurrentVal) : invAmt;
    const catCfg = INVESTMENT_CATEGORIES_CONFIG[customCategory];

    addInvestment({
      name: customName.trim(),
      institution: customInstitution || undefined,
      category: customCategory,
      investedAmount: invAmt,
      currentValue: curVal,
      purchaseDate: customDate,
      folioNumber: customFolio.trim() || undefined,
      linkedAccountId: customAccountId || undefined,
      linkedCreditCardId: customCreditCardId || undefined,
      linkedPaymentAppId: customPaymentAppId || undefined,
      icon: catCfg.icon,
      color: customColor || catCfg.color,
      notes: customNotes.trim() || undefined,
    });

    setCustomName('');
    setCustomInstitution('');
    setCustomInvestedAmt('');
    setCustomCurrentVal('');
    setCustomFolio('');
    setCustomNotes('');
    setActiveTab('PORTFOLIO');
  };

  const handleSaveEdit = () => {
    if (!editingInv) return;
    updateInvestment(editingInv.id, {
      name: editingInv.name,
      institution: editingInv.institution,
      category: editingInv.category,
      investedAmount: editingInv.investedAmount,
      currentValue: editingInv.currentValue,
      purchaseDate: editingInv.purchaseDate,
      folioNumber: editingInv.folioNumber,
      linkedAccountId: editingInv.linkedAccountId,
      linkedCreditCardId: editingInv.linkedCreditCardId,
      linkedPaymentAppId: editingInv.linkedPaymentAppId,
      color: editingInv.color,
      notes: editingInv.notes,
    });
    setEditingInv(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[92vh] sm:h-auto sm:max-h-[88vh] my-auto overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Investment Portfolio & Assets
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold tracking-wide uppercase border border-emerald-500/20">
                  Wealth Hub
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Portfolio Top Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 sm:px-5 bg-emerald-500/5 dark:bg-emerald-950/20 border-b border-emerald-500/10 shrink-0 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Total Invested</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
              {formatINR(totalInvested)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Current Portfolio Value</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
              {formatINR(totalCurrentVal)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Total Returns</span>
            <div className="flex items-center space-x-1">
              <span
                className={`font-extrabold text-xs sm:text-sm flex items-center ${
                  totalAbsoluteGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {totalAbsoluteGain >= 0 ? '+' : ''}
                {formatINR(totalAbsoluteGain)}
              </span>
              <span
                className={`text-[10px] font-bold px-1 rounded ${
                  totalAbsoluteGain >= 0
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}
              >
                {totalGainPercent >= 0 ? '+' : ''}
                {totalGainPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 px-4 sm:px-5 pt-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <button
            onClick={() => setActiveTab('PORTFOLIO')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
              activeTab === 'PORTFOLIO'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>My Assets Portfolio ({investments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CATALOGUE')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
              activeTab === 'CATALOGUE'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Investment Presets Catalogue ({INVESTMENT_CATALOGUE.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
              activeTab === 'CUSTOM'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus size={14} />
            <span>Add Custom Asset / SIP</span>
          </button>
        </div>

        {/* Tab 1: PORTFOLIO */}
        {activeTab === 'PORTFOLIO' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search assets, mutual funds, stocks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {['ALL', 'MUTUAL_FUNDS', 'STOCKS', 'GOLD', 'FIXED_INCOME', 'CRYPTO'].map(c => (
                  <button
                    key={c}
                    onClick={() => setCatFilter(c)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                      catFilter === c
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {c === 'ALL' ? 'All' : INVESTMENT_CATEGORIES_CONFIG[c as InvestmentCategory]?.label || c}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setActiveTab('CUSTOM')}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-1.5 shrink-0"
              >
                <Plus size={13} />
                <span>Add Investment</span>
              </button>
            </div>

            {investments.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 dark:bg-slate-850 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <TrendingUp size={36} className="text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No investments recorded in your portfolio
                </p>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Browse our investment presets or add your Mutual Funds, Stocks, Gold, and FDs!
                </p>
                <button
                  onClick={() => setActiveTab('CATALOGUE')}
                  className="px-4 py-2 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-md"
                >
                  Browse Investment Presets
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredInvestments.map((inv, idx) => {
                  const cfg = INVESTMENT_CATEGORIES_CONFIG[inv.category] || INVESTMENT_CATEGORIES_CONFIG.OTHER;
                  const invested = inv.investedAmount || 0;
                  const current = inv.currentValue ?? invested;
                  const gain = current - invested;
                  const gainPct = invested > 0 ? (gain / invested) * 100 : 0;

                  return (
                    <div
                      key={`inv_manage_${inv.id}_${idx}`}
                      className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all flex flex-col justify-between space-y-3 group hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          {inv.institution ? (
                            <Bank3DIcon institution={inv.institution} color={inv.color || cfg.color} size="md" />
                          ) : (
                            <Emblem3D
                              icon={inv.icon || cfg.icon}
                              from={inv.color || cfg.color}
                              to={inv.color || cfg.color}
                              size="md"
                            />
                          )}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                              {cfg.label}
                            </span>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                              {inv.name}
                            </h4>
                            {inv.folioNumber && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Folio: {inv.folioNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          
                          <button
                            onClick={() => setHistoryInv(inv)}
                            className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-slate-400 hover:text-emerald-600"
                            title="View Transactions"
                          >
                            <History size={13} />
                          </button>
                          <button
                            onClick={() => setEditingInv(inv)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmInv(inv)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Numbers Grid */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-750 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Invested</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {formatINR(invested)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Current Val</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formatINR(current)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Profit / Return</span>
                          <span
                            className={`font-extrabold text-[11px] block ${
                              gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                            }`}
                          >
                            {gain >= 0 ? '+' : ''}
                            {gainPct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: PRESETS CATALOGUE */}
        {activeTab === 'CATALOGUE' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredCatalogue.map((item, idx) => (
                <div
                  key={`inv_cat_${item.id}_${idx}`}
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all flex flex-col justify-between space-y-3 group hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <Emblem3D
                        icon={item.icon}
                        from={item.color}
                        to={item.color}
                        size="md"
                        interactive={true}
                      />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          {item.category.replace('_', ' ')}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                          {item.name}
                        </h4>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {item.tagline}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-slate-400 text-[11px]">Expected CAGR:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {item.expectedReturn}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenAdopt(item)}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-1.5 active:scale-98 transition-all"
                  >
                    <Plus size={13} />
                    <span>Adopt to Portfolio</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Tab 3: CUSTOM ASSET */}
        {activeTab === 'CUSTOM' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-w-xl mx-auto w-full">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Add Custom Investment / SIP Asset
              </h4>
              <p className="text-xs text-slate-500">
                Log Mutual funds, direct equity stocks, sovereign gold bonds, FDs, PPF, or real estate
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Asset Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Institution / Broker
                  </label>
                  <CustomSelect
                    value={customInstitution}
                    onChange={val => setCustomInstitution(val)}
                    options={[
                      { value: '', label: 'Select...' },
                      { value: 'Zerodha', label: 'Zerodha' },
                      { value: 'Groww', label: 'Groww' },
                      { value: 'Upstox', label: 'Upstox' },
                      { value: 'Angel One', label: 'Angel One' },
                      { value: 'SBI Mutual Fund', label: 'SBI Mutual Fund' },
                      { value: 'HDFC Mutual Fund', label: 'HDFC Mutual Fund' },
                      { value: 'ICICI Prudential', label: 'ICICI Prudential' },
                      { value: 'Axis Mutual Fund', label: 'Axis Mutual Fund' },
                      { value: 'Nippon India', label: 'Nippon India' },
                      { value: 'Vanguard', label: 'Vanguard' },
                      { value: 'Other', label: 'Other' },
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Asset Class / Category
                  </label>
                  <CustomSelect
                    value={customCategory}
                    onChange={val => setCustomCategory(val as InvestmentCategory)}
                    options={categoryOptions}
                    size="sm"
                  />
                </div>
                <div>
                  <CustomDatePicker
                    label="Purchase / Start Date"
                    value={customDate}
                    onChange={d => setCustomDate(d)}
                    size="sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Invested Principal (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={customInvestedAmt}
                    onChange={e => setCustomInvestedAmt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-extrabold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Current Portfolio Value (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 58000"
                    value={customCurrentVal}
                    onChange={e => setCustomCurrentVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-extrabold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Folio / Demat ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10293847/92"
                    value={customFolio}
                    onChange={e => setCustomFolio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Funding Source Bank
                  </label>
                  <CustomSelect
                    value={customAccountId}
                    onChange={val => setCustomAccountId(val)}
                    options={accountOptions}
                    size="sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Funding Credit Card
                  </label>
                  <CustomSelect
                    value={customCreditCardId}
                    onChange={val => setCustomCreditCardId(val)}
                    options={[
                      { value: '', label: 'No linked credit card' },
                      ...creditCards.map(cc => ({ value: cc.id, label: cc.name, isCreditCard: true, cardTheme: cc.cardTheme, network: cc.network }))
                    ]}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Payment App
                  </label>
                  <CustomSelect
                    value={customPaymentAppId}
                    onChange={val => setCustomPaymentAppId(val)}
                    options={[
                      { value: '', label: 'No linked app' },
                      ...paymentApps.map(pa => ({ value: pa.id, label: pa.name, isPaymentApp: true, paymentAppName: pa.name }))
                    ]}
                    size="sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes / Goal Linking (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Linked to Home Down Payment Goal 2028"
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              <ThemeColorPicker
                value={customColor}
                onChange={setCustomColor}
                label="Theme Accent & Color"
              />

              <button
                onClick={handleCreateCustom}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-98"
              >
                Save Asset to Portfolio
              </button>
            </div>
          </div>
        )}

        {/* Adopt Preset Modal */}
        {selectedCatalogItem && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full space-y-4 border border-emerald-200 dark:border-emerald-900/40 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <Emblem3D
                    icon={selectedCatalogItem.icon}
                    from={selectedCatalogItem.color}
                    to={selectedCatalogItem.color}
                    size="sm"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {selectedCatalogItem.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">{selectedCatalogItem.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCatalogItem(null)}
                  className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Invested Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={adoptAmount}
                    onChange={e => {
                      setAdoptAmount(e.target.value);
                      setAdoptCurrentValue(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Current Value (₹)
                  </label>
                  <input
                    type="number"
                    value={adoptCurrentValue}
                    onChange={e => setAdoptCurrentValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Institution / Broker
                  </label>
                  <CustomSelect
                    value={adoptInstitution}
                    onChange={val => setAdoptInstitution(val)}
                    options={[
                      { value: '', label: 'Select...' },
                      { value: 'Zerodha', label: 'Zerodha' },
                      { value: 'Groww', label: 'Groww' },
                      { value: 'Upstox', label: 'Upstox' },
                      { value: 'Angel One', label: 'Angel One' },
                      { value: 'SBI Mutual Fund', label: 'SBI Mutual Fund' },
                      { value: 'HDFC Mutual Fund', label: 'HDFC Mutual Fund' },
                      { value: 'ICICI Prudential', label: 'ICICI Prudential' },
                      { value: 'Axis Mutual Fund', label: 'Axis Mutual Fund' },
                      { value: 'Nippon India', label: 'Nippon India' },
                      { value: 'Vanguard', label: 'Vanguard' },
                      { value: 'Other', label: 'Other' },
                    ]}
                    size="sm"
                  />
                </div>
                <div>
                  <CustomDatePicker
                    label="Purchase Date"
                    value={adoptPurchaseDate}
                    onChange={d => setAdoptPurchaseDate(d)}
                    size="sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Funded From Account (Optional)
                </label>
                <CustomSelect
                  value={adoptAccountId}
                  onChange={val => setAdoptAccountId(val)}
                  options={[
                    { value: '', label: 'No linked account' },
                    ...accounts.map(acc => ({
                      value: acc.id,
                      label: acc.name,
                      sublabel: `${acc.institution} • ${formatINR(acc.calculatedBalance)}`,
                      isBankAccount: true,
                      bankTheme: acc.institution
                    }))
                  ]}
                  size="sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Funded From Credit Card (Optional)
                </label>
                <CustomSelect
                  value={adoptCreditCardId}
                  onChange={val => setAdoptCreditCardId(val)}
                  options={[
                    { value: '', label: 'No linked credit card' },
                    ...creditCards.map(cc => ({ value: cc.id, label: cc.name, isCreditCard: true, cardTheme: cc.cardTheme, network: cc.network }))
                  ]}
                  size="sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Payment App (Optional)
                </label>
                <CustomSelect
                  value={adoptPaymentAppId}
                  onChange={val => setAdoptPaymentAppId(val)}
                  options={[
                    { value: '', label: 'No linked app' },
                    ...paymentApps.map(pa => ({ value: pa.id, label: pa.name, isPaymentApp: true, paymentAppName: pa.name }))
                  ]}
                  size="sm"
                />
              </div>

              <button
                onClick={handleConfirmAdopt}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-98"
              >
                Confirm & Add to Portfolio
              </button>
            </div>
          </div>
        )}

                {/* Edit Investment Modal */}
        {editingInv && (
          <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full space-y-4 border border-emerald-200 dark:border-emerald-900/40 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Edit Asset: {editingInv.name}
                </h3>
                <button
                  onClick={() => setEditingInv(null)}
                  className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Asset Name
                    </label>
                    <input
                      type="text"
                      value={editingInv.name}
                      onChange={e => setEditingInv({ ...editingInv, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold outline-none"
                    />
                  </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Institution / Broker
                    </label>
                    <CustomSelect
                      value={editingInv.institution || ''}
                      onChange={val => setEditingInv({ ...editingInv, institution: val || undefined })}
                      options={[
                        { value: '', label: 'Select...' },
                        { value: 'Zerodha', label: 'Zerodha' },
                        { value: 'Groww', label: 'Groww' },
                        { value: 'Upstox', label: 'Upstox' },
                        { value: 'Angel One', label: 'Angel One' },
                        { value: 'SBI Mutual Fund', label: 'SBI Mutual Fund' },
                        { value: 'HDFC Mutual Fund', label: 'HDFC Mutual Fund' },
                        { value: 'ICICI Prudential', label: 'ICICI Prudential' },
                        { value: 'Axis Mutual Fund', label: 'Axis Mutual Fund' },
                        { value: 'Nippon India', label: 'Nippon India' },
                        { value: 'Vanguard', label: 'Vanguard' },
                        { value: 'Other', label: 'Other' },
                      ]}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Invested Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={editingInv.investedAmount}
                      onChange={e =>
                        setEditingInv({ ...editingInv, investedAmount: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold outline-none"
                    />
                  </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Current Value (₹)
                    </label>
                    <input
                      type="number"
                      value={editingInv.currentValue}
                      onChange={e =>
                        setEditingInv({ ...editingInv, currentValue: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2"><div><label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Bank</label><CustomSelect value={editingInv.linkedAccountId || ''} onChange={val => setEditingInv({ ...editingInv, linkedAccountId: val || undefined })} options={[{ value: '', label: 'None' }, ...accounts.map(a => ({ value: a.id, label: a.name, isBankAccount: true, bankTheme: a.institution }))]} size="sm" /></div><div><label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Credit Card</label><CustomSelect value={editingInv.linkedCreditCardId || ''} onChange={val => setEditingInv({ ...editingInv, linkedCreditCardId: val || undefined })} options={[{ value: '', label: 'None' }, ...creditCards.map(c => ({ value: c.id, label: c.name }))]} size="sm" /></div><div><label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Payment App</label><CustomSelect value={editingInv.linkedPaymentAppId || ''} onChange={val => setEditingInv({ ...editingInv, linkedPaymentAppId: val || undefined })} options={[{ value: '', label: 'None' }, ...paymentApps.map(pa => ({ value: pa.id, label: pa.name, isPaymentApp: true, paymentAppName: pa.name }))]} size="sm" /></div></div><ThemeColorPicker
                  value={editingInv.color || '#10B981'}
                  onChange={c => setEditingInv({ ...editingInv, color: c })}
                  label="Theme Accent & Color"
                />

                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INVESTMENT TRANSACTIONS HISTORY SUB-MODAL */}
        {historyInv && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Transaction History</h3>
                    <span className="text-[11px] text-slate-500">{historyInv.name}</span>
                  </div>
                </div>
                <button
                  onClick={() => setHistoryInv(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {(() => {
                  const invTxs = transactions.filter(t => !t.isDeleted && t.investmentId === historyInv.id).sort((a, b) => b.timestamp - a.timestamp);
                  if (invTxs.length === 0) {
                    return (
                      <div className="text-center py-8 text-xs text-slate-400">
                        No transactions recorded for this asset yet.
                      </div>
                    );
                  }
                  return invTxs.map((t, idx) => (
                    <TransactionRow
                      key={`inv_tx_${t.id}_${idx}`}
                      t={t}
                      isSelectionMode={false}
                      isSelected={false}
                      onPointerDown={() => {}}
                      onPointerUpOrLeave={() => {}}
                      wasLongPressRef={{ current: false }}
                      onSelectTransaction={() => {}}
                      onToggleSelection={() => {}}
                      setSearchQuery={() => {}}
                      setSelectedAccountId={() => {}}
                      categoriesMap={new Map()}
                      accountsMap={new Map()}
                      creditCardsMap={new Map()}
                      investmentsMap={new Map(investments.map(i => [i.id, i]))}
                      goalsMap={new Map()}
                      debtsMap={new Map()}
                      onSetDeleteTarget={() => {}}
                    />
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={Boolean(deleteConfirmInv)}
          onClose={() => setDeleteConfirmInv(null)}
          onConfirm={() => {
            if (deleteConfirmInv) {
              deleteInvestment(deleteConfirmInv.id);
              setDeleteConfirmInv(null);
            }
          }}
          title="Delete Investment Asset?"
          description="Are you sure you want to delete this investment asset? You can restore it anytime from More → Trash Bin."
          itemDetails={
            deleteConfirmInv
              ? {
                  title: deleteConfirmInv.name,
                  amount: `Current: ${formatINR(deleteConfirmInv.currentValue)}`,
                  subtitle: `Invested: ${formatINR(deleteConfirmInv.investedAmount)} • ${deleteConfirmInv.institution || 'Asset'}`,
                  badge: deleteConfirmInv.type.replace(/_/g, ' '),
                }
              : undefined
          }
          confirmLabel="Delete Investment"
        />

      </div>
    </div>
  );
};
