import React, { useState, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { TransactionTemplate, TransactionType } from '../../types';
import { formatINR } from '../../lib/currency';
import { exportTemplatesCsv, exportTemplatesJson } from '../../lib/storage';
import { CustomSelect } from '../common/CustomSelect';
import {
  X,
  Plus,
  Search,
  Star,
  Zap,
  Edit2,
  Trash2,
  Copy,
  Download,
  Upload,
  ArrowRight,
  CheckCircle2,
  Check,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TemplateManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (template: TransactionTemplate) => void;
}

export const TemplateManagementModal: React.FC<TemplateManagementModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const {
    templates,
    categories,
    accounts,
    creditCards,
    paymentApps,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    toggleFavoriteTemplate,
    recordFromTemplate,
  } = useMoney();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'FAVORITES' | 'EXPENSE' | 'INCOME' | 'TRANSFER'>('ALL');
  
  // Editor State
  const [editingTemplate, setEditingTemplate] = useState<TransactionTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Form fields for create/edit
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<TransactionType>('EXPENSE');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formSubcategory, setFormSubcategory] = useState<string>('');
  const [formAccountId, setFormAccountId] = useState<string>('');
  const [formCardId, setFormCardId] = useState<string>('');
  const [formToAccountId, setFormToAccountId] = useState<string>('');
  const [formPaymentAppId, setFormPaymentAppId] = useState<string>('');
  const [formMerchantName, setFormMerchantName] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formTags, setFormTags] = useState<string>('');
  const [formIsFavorite, setFormIsFavorite] = useState<boolean>(true);
  const [formColor, setFormColor] = useState<string>('#059669');

  const filteredTemplates = useMemo(() => {
    return (templates || []).filter(t => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesMerchant = (t.merchantName || '').toLowerCase().includes(q);
        const matchesCat = (t.categoryName || '').toLowerCase().includes(q);
        const matchesSubcat = (t.subcategory || '').toLowerCase().includes(q);
        if (!matchesName && !matchesMerchant && !matchesCat && !matchesSubcat) return false;
      }

      // Tab filter
      if (activeTab === 'FAVORITES') return !!t.isFavorite;
      if (activeTab === 'EXPENSE') return t.type === 'EXPENSE';
      if (activeTab === 'INCOME') return t.type === 'INCOME';
      if (activeTab === 'TRANSFER') return t.type === 'TRANSFER' || t.type === 'CARD_PAYMENT';

      return true;
    });
  }, [templates, searchQuery, activeTab]);

  const openCreateForm = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormType('EXPENSE');
    setFormAmount('');
    setFormCategoryId(categories[0]?.id || '');
    setFormSubcategory(categories[0]?.subcategories[0] || '');
    setFormAccountId(accounts[0]?.id || '');
    setFormCardId('');
    setFormToAccountId('');
    setFormPaymentAppId(paymentApps[0]?.id || '');
    setFormMerchantName('');
    setFormNotes('');
    setFormTags('');
    setFormIsFavorite(true);
    setFormColor('#059669');
    setIsCreating(true);
  };

  const openEditForm = (tmpl: TransactionTemplate) => {
    setEditingTemplate(tmpl);
    setFormName(tmpl.name);
    setFormType(tmpl.type);
    setFormAmount(tmpl.amount !== undefined && tmpl.amount > 0 ? String(tmpl.amount) : '');
    setFormCategoryId(tmpl.categoryId || categories[0]?.id || '');
    setFormSubcategory(tmpl.subcategory || '');
    setFormAccountId(tmpl.accountId || '');
    setFormCardId(tmpl.creditCardId || '');
    setFormToAccountId(tmpl.toAccountId || '');
    setFormPaymentAppId(tmpl.paymentAppId || '');
    setFormMerchantName(tmpl.merchantName || '');
    setFormNotes(tmpl.notes || '');
    setFormTags((tmpl.tags || []).join(', '));
    setFormIsFavorite(!!tmpl.isFavorite);
    setFormColor(tmpl.color || '#059669');
    setIsCreating(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const selectedCat = categories.find(c => c.id === formCategoryId);
    const selectedAcc = accounts.find(a => a.id === formAccountId);
    const selectedCard = creditCards.find(c => c.id === formCardId);
    const selectedToAcc = accounts.find(a => a.id === formToAccountId);
    const selectedPayApp = paymentApps.find(p => p.id === formPaymentAppId);

    const parsedAmount = formAmount.trim() ? parseFloat(formAmount) : undefined;
    const parsedTags = formTags.trim()
      ? formTags.split(',').map(t => t.trim()).filter(Boolean)
      : undefined;

    const templateData = {
      name: formName.trim(),
      type: formType,
      amount: parsedAmount && !isNaN(parsedAmount) ? parsedAmount : undefined,
      icon: selectedCat?.icon || 'Zap',
      color: formColor || selectedCat?.color || '#059669',
      categoryId: selectedCat?.id,
      categoryName: selectedCat?.name,
      subcategory: formSubcategory || undefined,
      merchantName: formMerchantName.trim() || undefined,
      accountId: selectedAcc?.id,
      accountName: selectedAcc?.name,
      creditCardId: selectedCard?.id,
      creditCardName: selectedCard?.name,
      toAccountId: selectedToAcc?.id,
      toAccountName: selectedToAcc?.name,
      paymentAppId: selectedPayApp?.id,
      paymentAppName: selectedPayApp?.name,
      notes: formNotes.trim() || undefined,
      tags: parsedTags,
      isFavorite: formIsFavorite,
    };

    if (editingTemplate) {
      updateTemplate(editingTemplate.id, templateData);
      setFeedbackMessage(`Template "${formName}" updated!`);
    } else {
      addTemplate(templateData);
      setFeedbackMessage(`Template "${formName}" created!`);
    }

    setTimeout(() => setFeedbackMessage(null), 3000);
    setIsCreating(false);
    setEditingTemplate(null);
  };

  const handleDuplicate = (tmpl: TransactionTemplate) => {
    addTemplate({
      ...tmpl,
      name: `${tmpl.name} (Copy)`,
      isFavorite: false,
    });
    setFeedbackMessage(`Duplicated template "${tmpl.name}"!`);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleDirectRecord = (tmpl: TransactionTemplate) => {
    const txId = recordFromTemplate(tmpl.id);
    if (txId) {
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10B981', '#34D399', '#6EE7B7'],
        });
      } catch (_) {}

      setFeedbackMessage(`Logged ₹${tmpl.amount || 0} via "${tmpl.name}"!`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  const handleApplyToForm = (tmpl: TransactionTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(tmpl);
      onClose();
    }
  };

  const handleImportTemplates = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const tmpls = Array.isArray(parsed) ? parsed : parsed.templates;
          if (Array.isArray(tmpls)) {
            tmpls.forEach(t => {
              if (t.name) {
                addTemplate({
                  name: t.name,
                  type: t.type || 'EXPENSE',
                  amount: t.amount,
                  icon: t.icon || 'Zap',
                  color: t.color || '#059669',
                  categoryId: t.categoryId,
                  categoryName: t.categoryName,
                  subcategory: t.subcategory,
                  merchantName: t.merchantName,
                  accountId: t.accountId,
                  accountName: t.accountName,
                  creditCardId: t.creditCardId,
                  creditCardName: t.creditCardName,
                  toAccountId: t.toAccountId,
                  toAccountName: t.toAccountName,
                  paymentAppId: t.paymentAppId,
                  paymentAppName: t.paymentAppName,
                  notes: t.notes,
                  tags: t.tags,
                  isFavorite: !!t.isFavorite,
                });
              }
            });
            setFeedbackMessage(`Imported ${tmpls.length} templates!`);
            setTimeout(() => setFeedbackMessage(null), 3500);
          }
        } else {
          setFeedbackMessage('Please select a valid .json template export file.');
          setTimeout(() => setFeedbackMessage(null), 3500);
        }
      } catch (err) {
        setFeedbackMessage('Failed to parse templates file.');
        setTimeout(() => setFeedbackMessage(null), 3500);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">Transaction Templates</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30">
                  Standard Style
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                type="button"
                onClick={openCreateForm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Template</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2 flex items-center gap-2 text-xs font-medium text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* CREATE / EDIT FORM */}
          {isCreating ? (
            <form onSubmit={handleSaveTemplate} className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>{editingTemplate ? 'Edit Template' : 'Create New Template'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>

              {/* Template Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Template Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily Morning Coffee / Chai"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type</label>
                  <CustomSelect
                    value={formType}
                    onChange={(val) => setFormType(val as TransactionType)}
                    options={[
                      { value: 'EXPENSE', label: 'Expense (-)' },
                      { value: 'INCOME', label: 'Income (+)' },
                      { value: 'TRANSFER', label: 'Transfer (⇆)' },
                      { value: 'INVESTMENT_CONTRIBUTION', label: 'Investment (SIP)' },
                    ]}
                  />
                </div>
              </div>

              {/* Preset Amount & Merchant */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Preset Amount (₹) <span className="text-slate-400 dark:text-slate-500 font-normal">(Leave blank to prompt)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 50"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Merchant / Payee Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Starbucks / Swiggy / Metro"
                    value={formMerchantName}
                    onChange={(e) => setFormMerchantName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
                  <CustomSelect
                    value={formCategoryId}
                    onChange={(val) => {
                      setFormCategoryId(val);
                      const cat = categories.find(c => c.id === val);
                      setFormSubcategory(cat?.subcategories[0] || '');
                      if (cat?.color) setFormColor(cat.color);
                    }}
                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Subcategory</label>
                  {(() => {
                    const activeCat = categories.find(c => c.id === formCategoryId);
                    const subList = activeCat?.subcategories || [];
                    return (
                      <CustomSelect
                        value={formSubcategory}
                        onChange={setFormSubcategory}
                        options={[
                          { value: '', label: 'General' },
                          ...subList.map(sub => ({ value: sub, label: sub }))
                        ]}
                      />
                    );
                  })()}
                </div>
              </div>

              {/* Account / Payment App */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Source Account</label>
                  <CustomSelect
                    value={formAccountId}
                    onChange={(val) => {
                      setFormAccountId(val);
                      if (val) setFormCardId('');
                    }}
                    options={[
                      { value: '', label: 'None / Any' },
                      ...accounts.filter(a => !a.isDeleted).map(a => ({
                        value: a.id,
                        label: `${a.name} (${a.institution})`,
                        sublabel: `${a.type} • Bal: ${formatINR(a.calculatedBalance)}`,
                        rightText: formatINR(a.calculatedBalance),
                        isBankAccount: true,
                        bankTheme: a.institution || a.name || a.type,
                      }))
                    ]}
                  />
                </div>

                {creditCards.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Or Credit Card</label>
                    <CustomSelect
                      value={formCardId}
                      onChange={(val) => {
                        setFormCardId(val);
                        if (val) setFormAccountId('');
                      }}
                      options={[
                        { value: '', label: 'None' },
                        ...creditCards.filter(c => !c.isDeleted).map(c => ({
                          value: c.id,
                          label: `${c.name} (••${c.lastFourDigits})`,
                          sublabel: `Due: ${formatINR(c.currentOutstanding)} • Avail: ${formatINR(Math.max(0, c.creditLimit - c.currentOutstanding))}`,
                          rightText: `Due: ${formatINR(c.currentOutstanding)}`,
                          isCreditCard: true,
                          cardTheme: c.cardTheme,
                          network: c.network,
                        }))
                      ]}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Payment App / Channel</label>
                  <CustomSelect
                    value={formPaymentAppId}
                    onChange={setFormPaymentAppId}
                    options={[
                      { value: '', label: 'Default / UPI' },
                      ...paymentApps.map(p => ({ value: p.id, label: p.name }))
                    ]}
                  />
                </div>
              </div>

              {/* Notes & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Default Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Breakfast on the way to office"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Daily, Food, Routine"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Favorite Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsFavorite}
                    onChange={(e) => setFormIsFavorite(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-white dark:bg-slate-950"
                  />
                  <Star className={`w-4 h-4 ${formIsFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                  <span>Mark as Favorite (Shows in quick shortcuts)</span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTemplate ? 'Update Template' : 'Save Template'}</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Tabs */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded-xl overflow-x-auto text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ALL')}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      activeTab === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    All ({templates.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('FAVORITES')}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeTab === 'FAVORITES' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Favorites</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('EXPENSE')}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      activeTab === 'EXPENSE' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Expenses
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('INCOME')}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      activeTab === 'INCOME' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Income
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Template Cards Grid */}
              {filteredTemplates.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-500 dark:text-slate-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-300">No templates found</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    {searchQuery ? 'No templates match your search query.' : 'Create quick templates for your recurring daily routines (Chai, Metro, Groceries, Rent)!'}
                  </p>
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-lg hover:bg-emerald-500 transition-colors mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Template</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTemplates.map((tmpl) => {
                    const isExpense = tmpl.type === 'EXPENSE';
                    const isIncome = tmpl.type === 'INCOME';

                    return (
                      <div
                        key={tmpl.id}
                        className="bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all hover:shadow-md group"
                      >
                        {/* Top Row: Icon, Title, Favorite & Actions */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md font-bold text-sm"
                              style={{ backgroundColor: tmpl.color || '#059669' }}
                            >
                              <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{tmpl.name}</h3>
                                {tmpl.isFavorite && (
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                <span>{tmpl.categoryName || 'General'}</span>
                                {tmpl.subcategory && (
                                  <>
                                    <span className="text-slate-400 dark:text-slate-600">•</span>
                                    <span className="text-slate-500">{tmpl.subcategory}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => toggleFavoriteTemplate(tmpl.id)}
                              title={tmpl.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                              className="p-1.5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Star className={`w-4 h-4 ${tmpl.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditForm(tmpl)}
                              title="Edit template"
                              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicate(tmpl)}
                              title="Duplicate"
                              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(tmpl.id)}
                              title="Delete template"
                              className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Mid Row: Amount badge & metadata */}
                        <div className="bg-slate-50 dark:bg-slate-900/90 rounded-xl p-2.5 flex items-center justify-between border border-slate-200 dark:border-slate-800/60">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                              Preset Amount
                            </span>
                            <span className={`text-base font-extrabold ${
                              isExpense ? 'text-rose-600 dark:text-rose-400' : isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                            }`}>
                              {tmpl.amount !== undefined && tmpl.amount > 0 ? (
                                `${isExpense ? '-' : isIncome ? '+' : ''}${formatINR(tmpl.amount)}`
                              ) : (
                                <span className="text-slate-400 text-xs font-normal">Prompt at entry</span>
                              )}
                            </span>
                          </div>

                          <div className="text-right text-xs">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Used</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{tmpl.usageCount || 0} times</span>
                          </div>
                        </div>

                        {/* Details Pills */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 flex-wrap">
                          {tmpl.merchantName && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                              🏪 {tmpl.merchantName}
                            </span>
                          )}
                          {tmpl.accountName && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                              🏦 {tmpl.accountName}
                            </span>
                          )}
                          {tmpl.creditCardName && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                              💳 {tmpl.creditCardName}
                            </span>
                          )}
                          {tmpl.paymentAppName && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                              ⚡ {tmpl.paymentAppName}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-900">
                          <button
                            type="button"
                            onClick={() => handleApplyToForm(tmpl)}
                            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <span>Fill Form</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDirectRecord(tmpl)}
                            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/20 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>1-Tap Record</span>
                          </button>
                        </div>

                        {/* Delete Confirmation Overlay */}
                        {deleteConfirmId === tmpl.id && (
                          <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                            <span className="text-rose-700 dark:text-rose-200 font-medium">Delete this template?</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  deleteTemplate(tmpl.id);
                                  setDeleteConfirmId(null);
                                  setFeedbackMessage(`Template deleted.`);
                                  setTimeout(() => setFeedbackMessage(null), 3000);
                                }}
                                className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold hover:bg-rose-500"
                              >
                                Confirm
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Template Import/Export Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Backup & Export:</span>
                  <button
                    type="button"
                    onClick={() => exportTemplatesCsv(templates)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 font-medium transition-colors border border-slate-200 dark:border-transparent"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportTemplatesJson(templates)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 font-medium transition-colors border border-slate-200 dark:border-transparent"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                </div>

                <div>
                  <label className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-medium cursor-pointer transition-colors border border-slate-200 dark:border-transparent">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Templates (.json)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportTemplates}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
