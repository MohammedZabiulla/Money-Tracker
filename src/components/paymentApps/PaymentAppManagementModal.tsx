import React, { useState, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { PaymentApp } from '../../types';
import { PaymentApp3DIcon } from '../common/PaymentApp3DIcon';
import {
  X,
  Plus,
  Search,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  Smartphone,
  QrCode,
  ShieldCheck,
  Zap,
  Globe,
  Banknote,
  Landmark,
  CreditCard,
  Building,
  Flame,
  Wallet,
  ShoppingBag,
  Receipt,
  Layers,
} from 'lucide-react';

interface PaymentAppManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaymentApp?: (paymentApp: PaymentApp) => void;
}

export interface PaymentAppTemplate {
  name: string;
  category: 'UPI' | 'WALLET' | 'BANKING' | 'CASH' | 'GLOBAL';
  icon: string;
  symbol?: string;
  color: string;
  gradient?: string;
  description: string;
  popular?: boolean;
}

export const PAYMENT_APP_CATALOGUE: PaymentAppTemplate[] = [
  // Popular Indian UPI & Neo-banks
  {
    name: 'Slice UPI',
    category: 'UPI',
    icon: 'Smartphone',
    symbol: 'Slice',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
    description: 'Slice super card and UPI scan & pay channel',
    popular: true,
  },
  {
    name: 'Jupiter Money',
    category: 'UPI',
    icon: 'Zap',
    symbol: 'Jup',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    description: 'Jupiter Neobank 1-app banking & UPI payments',
    popular: true,
  },
  {
    name: 'Fi Money',
    category: 'UPI',
    icon: 'Sparkles',
    symbol: 'Fi',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
    description: 'Fi Money smart banking UPI channel',
    popular: true,
  },
  {
    name: 'Tata Neu UPI',
    category: 'UPI',
    icon: 'Flame',
    symbol: 'Neu',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
    description: 'Tata Neu super-app UPI and rewards channel',
  },
  {
    name: 'Navi UPI',
    category: 'UPI',
    icon: 'TrendingUp',
    symbol: 'Navi',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    description: 'Navi UPI payments and instant cash loans channel',
  },
  {
    name: 'BharatPe Merchant QR',
    category: 'UPI',
    icon: 'QrCode',
    symbol: 'BP',
    color: '#0284c7',
    gradient: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
    description: 'BharatPe QR code merchant channel & settlements',
    popular: true,
  },
  {
    name: 'MobiKwik ZIP & UPI',
    category: 'WALLET',
    icon: 'Wallet',
    symbol: 'Mobi',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    description: 'MobiKwik wallet, ZIP pay later and recharge channel',
  },
  {
    name: 'Freecharge Pay Later',
    category: 'WALLET',
    icon: 'Zap',
    symbol: 'FC',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    description: 'Freecharge wallet, utility payments and UPI',
  },
  {
    name: 'Airtel Payments Bank',
    category: 'WALLET',
    icon: 'Smartphone',
    symbol: 'APB',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    description: 'Airtel digital wallet, FASTag & UPI payments',
  },
  {
    name: 'PayZapp by HDFC',
    category: 'WALLET',
    icon: 'CreditCard',
    symbol: 'PZ',
    color: '#1e3a8a',
    gradient: 'linear-gradient(135deg, #1e40af 0%, #172554 100%)',
    description: 'HDFC PayZapp wallet & linked card checkout',
  },
  // POS & Terminals
  {
    name: 'POS Card Machine (EDC)',
    category: 'BANKING',
    icon: 'CreditCard',
    symbol: 'POS',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
    description: 'Physical card swipe terminal at store counters',
    popular: true,
  },
  {
    name: 'Bank Cheque / DD',
    category: 'BANKING',
    icon: 'Receipt',
    symbol: 'Chq',
    color: '#475569',
    gradient: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
    description: 'Cheques, demand drafts and official banking instruments',
  },
  {
    name: 'ATM Cash Withdrawal',
    category: 'CASH',
    icon: 'Banknote',
    symbol: 'ATM',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    description: 'Direct ATM currency dispensing for daily cash spend',
  },
  {
    name: 'Petty Cash Box',
    category: 'CASH',
    icon: 'Banknote',
    symbol: 'Box',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    description: 'Office or household petty cash drawer for small bills',
  },
  // Global & Modern Channels
  {
    name: 'Apple Pay',
    category: 'GLOBAL',
    icon: 'Smartphone',
    symbol: 'Apple',
    color: '#0f172a',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #020617 100%)',
    description: 'Apple Pay contactless mobile and web checkout',
    popular: true,
  },
  {
    name: 'Samsung Pay / Wallet',
    category: 'GLOBAL',
    icon: 'Smartphone',
    symbol: 'SPay',
    color: '#1d4ed8',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    description: 'Samsung Pay MST & NFC contactless cards',
  },
  {
    name: 'PayPal Global',
    category: 'GLOBAL',
    icon: 'Globe',
    symbol: 'PP',
    color: '#0070ba',
    gradient: 'linear-gradient(135deg, #0070ba 0%, #003087 100%)',
    description: 'Cross-border international payments & subscriptions',
    popular: true,
  },
  {
    name: 'Crypto / Web3 Wallet',
    category: 'GLOBAL',
    icon: 'Sparkles',
    symbol: 'USDT',
    color: '#eab308',
    gradient: 'linear-gradient(135deg, #ca8a04 0%, #854d0e 100%)',
    description: 'USDT, Bitcoin, Metamask or on-chain payments',
  },
];

const ACCENT_COLOR_PALETTE = [
  '#10b981', // Emerald
  '#059669', // Deep Emerald
  '#3b82f6', // Blue
  '#2563eb', // Royal Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#a855f7', // Violet
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#64748b', // Slate
  '#0f172a', // Midnight
  '#78350f', // Warm Bronze
];

const GRADIENT_THEMES = [
  { id: 'emerald', name: 'Emerald Neon', gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
  { id: 'violet', name: 'Cyber Violet', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)' },
  { id: 'midnight', name: 'Midnight Obsidian', gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
  { id: 'sapphire', name: 'Sapphire Royal', gradient: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' },
  { id: 'sunset', name: 'Sunset Crimson', gradient: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)' },
  { id: 'gold', name: 'Royal Gold', gradient: 'linear-gradient(135deg, #eab308 0%, #a16207 100%)' },
  { id: 'cyan', name: 'Cyan Frost', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)' },
  { id: 'ruby', name: 'Rose Ruby', gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' },
];

const ICON_OPTIONS = [
  { name: 'Smartphone', icon: Smartphone, label: 'Phone / App' },
  { name: 'QrCode', icon: QrCode, label: 'QR Scan' },
  { name: 'ShieldCheck', icon: ShieldCheck, label: 'Secure / CRED' },
  { name: 'Zap', icon: Zap, label: 'Instant Pay' },
  { name: 'Globe', icon: Globe, label: 'Web / Global' },
  { name: 'Banknote', icon: Banknote, label: 'Cash / Bill' },
  { name: 'Landmark', icon: Landmark, label: 'Net Banking' },
  { name: 'CreditCard', icon: CreditCard, label: 'Card / POS' },
  { name: 'Wallet', icon: Wallet, label: 'Digital Wallet' },
  { name: 'ShoppingBag', icon: ShoppingBag, label: 'Store Pay' },
  { name: 'Receipt', icon: Receipt, label: 'Cheque / DD' },
  { name: 'Building', icon: Building, label: 'Corporate' },
  { name: 'Flame', icon: Flame, label: 'Super App' },
  { name: 'Sparkles', icon: Sparkles, label: 'Rewards' },
];

export const PaymentAppManagementModal: React.FC<PaymentAppManagementModalProps> = ({
  isOpen,
  onClose,
  onSelectPaymentApp,
}) => {
  const { paymentApps, addPaymentApp, updatePaymentApp, deletePaymentApp } = useMoney();

  // Active view tab: 'LIST' | 'CATALOGUE' | 'CUSTOM_STUDIO'
  const [activeTab, setActiveTab] = useState<'LIST' | 'CATALOGUE' | 'CUSTOM_STUDIO'>('LIST');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'UPI' | 'WALLET' | 'BANKING' | 'CASH' | 'GLOBAL'>('ALL');

  // Custom Studio / Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [appName, setAppName] = useState('');
  const [appSymbol, setAppSymbol] = useState('');
  const [appIcon, setAppIcon] = useState('Smartphone');
  const [appColor, setAppColor] = useState('#10b981');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_THEMES[0].gradient);
  const [appDescription, setAppDescription] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered User Payment Apps
  const filteredApps = useMemo(() => {
    return paymentApps.filter(app => {
      const matchSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.symbol || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [paymentApps, searchQuery]);

  // Filtered Catalogue
  const filteredCatalogue = useMemo(() => {
    return PAYMENT_APP_CATALOGUE.filter(item => {
      const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.symbol || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [filterCategory, searchQuery]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenNewStudio = () => {
    setEditingId(null);
    setAppName('');
    setAppSymbol('');
    setAppIcon('Smartphone');
    setAppColor('#10b981');
    setSelectedGradient(GRADIENT_THEMES[0].gradient);
    setAppDescription('');
    setActiveTab('CUSTOM_STUDIO');
  };

  const handleEditApp = (app: PaymentApp) => {
    setEditingId(app.id);
    setAppName(app.name);
    setAppSymbol(app.symbol || '');
    setAppIcon(app.icon || 'Smartphone');
    setAppColor(app.color || '#10b981');
    setSelectedGradient(app.gradient || GRADIENT_THEMES[0].gradient);
    setAppDescription(app.description || '');
    setActiveTab('CUSTOM_STUDIO');
  };

  const handleSaveApp = () => {
    if (!appName.trim()) {
      showToast('Please enter a channel name');
      return;
    }

    if (editingId) {
      updatePaymentApp(editingId, {
        name: appName.trim(),
        symbol: appSymbol.trim() || undefined,
        icon: appIcon,
        color: appColor,
        gradient: selectedGradient,
        description: appDescription.trim() || undefined,
      });
      showToast(`Updated "${appName.trim()}"`);
    } else {
      const newId = addPaymentApp({
        name: appName.trim(),
        symbol: appSymbol.trim() || undefined,
        icon: appIcon,
        color: appColor,
        gradient: selectedGradient,
        description: appDescription.trim() || undefined,
        isCustom: true,
      });
      showToast(`Created channel "${appName.trim()}"`);

      if (onSelectPaymentApp) {
        onSelectPaymentApp({
          id: newId,
          name: appName.trim(),
          symbol: appSymbol.trim() || undefined,
          icon: appIcon,
          color: appColor,
          gradient: selectedGradient,
          description: appDescription.trim() || undefined,
          isCustom: true,
        });
        onClose();
        return;
      }
    }

    setActiveTab('LIST');
  };

  const handleAdoptFromCatalogue = (template: PaymentAppTemplate) => {
    const existing = paymentApps.find(
      p => p.name.toLowerCase() === template.name.toLowerCase()
    );
    if (existing) {
      showToast(`"${template.name}" is already in your channels`);
      return;
    }

    const newId = addPaymentApp({
      name: template.name,
      symbol: template.symbol,
      icon: template.icon,
      color: template.color,
      gradient: template.gradient,
      description: template.description,
      isCustom: true,
    });

    showToast(`Added "${template.name}" to channels`);

    if (onSelectPaymentApp) {
      onSelectPaymentApp({
        id: newId,
        name: template.name,
        symbol: template.symbol,
        icon: template.icon,
        color: template.color,
        gradient: template.gradient,
        description: template.description,
        isCustom: true,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Payment Channels & Apps</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {paymentApps.length} Active
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-x-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('LIST')}
            className={`pb-2.5 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'LIST'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers size={14} />
            <span>My Channels ({paymentApps.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CATALOGUE')}
            className={`pb-2.5 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'CATALOGUE'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles size={14} />
            <span>Browse Catalog ({PAYMENT_APP_CATALOGUE.length})</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewStudio}
            className={`pb-2.5 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'CUSTOM_STUDIO'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Plus size={14} />
            <span>{editingId ? 'Edit Channel Studio' : 'Create Custom Channel'}</span>
          </button>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs font-semibold py-1.5 px-4 text-center animate-in fade-in">
            {toastMessage}
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: MY ACTIVE CHANNELS LIST */}
          {activeTab === 'LIST' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search payment channels, UPI apps..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  onClick={handleOpenNewStudio}
                  className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 shrink-0 transition-all active:scale-95"
                >
                  <Plus size={14} />
                  <span>New Channel</span>
                </button>
              </div>

              {/* Grid of Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredApps.map((app, idx) => {
                  return (
                    <div
                      key={`pay_app_${app.id}_${idx}`}
                      className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
                    >
                      <div
                        className="flex items-center space-x-3 cursor-pointer flex-1"
                        onClick={() => {
                          if (onSelectPaymentApp) {
                            onSelectPaymentApp(app);
                            onClose();
                          }
                        }}
                      >
                        <PaymentApp3DIcon
                          name={app.name}
                          symbol={app.symbol}
                          icon={app.icon}
                          color={app.color}
                          gradient={app.gradient}
                          size="md"
                        />
                        <div className="text-left truncate pr-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                            <span className="truncate">{app.name}</span>
                            {app.isCustom && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-normal">
                                Custom
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">
                            {app.description || 'Quick pay channel'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1">
                        {onSelectPaymentApp && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPaymentApp(app);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-100 transition-colors"
                          >
                            Select
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleEditApp(app)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Edit Channel"
                        >
                          <Edit2 size={13} />
                        </button>

                        {app.isCustom && (
                          <button
                            type="button"
                            onClick={() => {
                              deletePaymentApp(app.id);
                              showToast(`Deleted "${app.name}"`);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title="Delete Channel"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredApps.length === 0 && (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <Smartphone size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs">No payment channels matched "{searchQuery}"</p>
                  <button
                    onClick={handleOpenNewStudio}
                    className="text-xs text-emerald-600 font-bold underline"
                  >
                    Create a new channel now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: READY-MADE CATALOGUE */}
          {activeTab === 'CATALOGUE' && (
            <div className="space-y-4">
              {/* Category Pills */}
              <div className="flex space-x-1.5 overflow-x-auto no-scrollbar pb-1">
                {(['ALL', 'UPI', 'WALLET', 'BANKING', 'CASH', 'GLOBAL'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      filterCategory === cat
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Channels' : cat}
                  </button>
                ))}
              </div>

              {/* Catalogue Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredCatalogue.map((template, idx) => {
                  const isAlreadyAdded = paymentApps.some(
                    p => p.name.toLowerCase() === template.name.toLowerCase()
                  );

                  return (
                    <div
                      key={`pay_template_${template.name}_${idx}`}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-between hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center space-x-3 flex-1 pr-2">
                        <PaymentApp3DIcon
                          name={template.name}
                          symbol={template.symbol}
                          icon={template.icon}
                          color={template.color}
                          gradient={template.gradient}
                          size="md"
                        />
                        <div className="text-left">
                          <div className="flex items-center space-x-1.5">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {template.name}
                            </h4>
                            {template.popular && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">
                            {template.description}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isAlreadyAdded}
                        onClick={() => handleAdoptFromCatalogue(template)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                          isAlreadyAdded
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-default'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white'
                        }`}
                      >
                        {isAlreadyAdded ? 'Added' : '+ Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM STUDIO CREATION & EDITING */}
          {activeTab === 'CUSTOM_STUDIO' && (
            <div className="space-y-4">
              
              {/* LIVE 3D PREVIEW CARD */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white shadow-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <PaymentApp3DIcon
                    name={appName || 'Custom Channel'}
                    symbol={appSymbol}
                    icon={appIcon}
                    color={appColor}
                    gradient={selectedGradient}
                    size="lg"
                    glow={true}
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                      Live 3D Preview
                    </span>
                    <h3 className="text-base font-black tracking-tight">
                      {appName.trim() || 'Your App / Channel Name'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {appSymbol ? `Emblem: "${appSymbol}"` : `Icon: ${appIcon}`} • {appColor}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block text-right">
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-slate-200 font-semibold border border-white/10">
                    High Fidelity
                  </span>
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Channel Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                    Channel / App Name *
                  </label>
                  <input
                    type="text"
                    value={appName}
                    onChange={e => setAppName(e.target.value)}
                    placeholder="e.g. Jupiter UPI, Slice, POS Terminal"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Short Emblem Symbol (Optional text on badge) */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                    Short Emblem Text (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={appSymbol}
                    onChange={e => setAppSymbol(e.target.value)}
                    placeholder="e.g. Jup, Fi, Sl, ₹, POS"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 3D Theme Gradient Presets */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">
                  3D Finish & Theme Gradient
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GRADIENT_THEMES.map(theme => {
                    const isSelected = selectedGradient === theme.gradient;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedGradient(theme.gradient)}
                        className={`p-2 rounded-2xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
                          isSelected
                            ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                          style={{ background: theme.gradient }}
                        />
                        <span className="truncate text-[11px]">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color Palette */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Accent Color
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="color"
                      value={appColor}
                      onChange={e => setAppColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-400">{appColor}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ACCENT_COLOR_PALETTE.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAppColor(color)}
                      className={`w-7 h-7 rounded-xl transition-all flex items-center justify-center ${
                        appColor === color ? 'scale-110 ring-2 ring-emerald-500 shadow-md' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {appColor === color && <Check size={12} className="text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Selector (Fallback when no text symbol is provided) */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">
                  Emblem Icon (When no custom text is set)
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {ICON_OPTIONS.map(opt => {
                    const IconComp = opt.icon;
                    const isSelected = appIcon === opt.name;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setAppIcon(opt.name)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <IconComp size={16} />
                        <span className="text-[9px] truncate w-full text-center">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                  Description / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={appDescription}
                  onChange={e => setAppDescription(e.target.value)}
                  placeholder="e.g. Primary UPI channel for food & bills"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Save / Cancel Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('LIST')}
                  className="px-4 py-2 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveApp}
                  className="px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 transition-all"
                >
                  <Check size={14} />
                  <span>{editingId ? 'Save Changes' : 'Create Channel'}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
