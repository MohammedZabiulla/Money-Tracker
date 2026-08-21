import React, { useState, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Category, TransactionType } from '../../types';
import { Category3DIcon } from '../common/Category3DIcon';
import {
  X,
  Plus,
  Search,
  Check,
  Edit2,
  Trash2,
  Tag,
  Palette,
  Sparkles,
  Layers,
  ChevronRight,
  HelpCircle,
  Copy,
  BookOpen,
  CheckCircle2,
  Flame,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (category: Category) => void;
  initialType?: TransactionType;
}

export interface CategoryTemplate {
  name: string;
  type: 'EXPENSE' | 'INCOME' | 'BOTH';
  icon: string;
  color: string;
  subcategories: string[];
  description: string;
  popular?: boolean;
}

export const CATEGORY_CATALOGUE: CategoryTemplate[] = [
  // Expense Templates
  {
    name: 'Food & Dining',
    type: 'EXPENSE',
    icon: 'UtensilsCrossed',
    color: '#f97316',
    subcategories: ['Restaurants', 'Cafes & Tea', 'Street Food', 'Food Delivery', 'Bars & Pubs'],
    description: 'Meals out, tea stalls, dining with friends & delivery',
    popular: true,
  },
  {
    name: 'Groceries & Daily Essentials',
    type: 'EXPENSE',
    icon: 'ShoppingBag',
    color: '#10b981',
    subcategories: ['Supermarket', 'Fruits & Vegetables', 'Milk & Dairy', 'Meat & Fish', 'Cleaning Supplies'],
    description: 'Kirana stores, supermarkets, Zepto, Blinkit & Instamart',
    popular: true,
  },
  {
    name: 'Home & Rent',
    type: 'EXPENSE',
    icon: 'Home',
    color: '#8b5cf6',
    subcategories: ['House Rent', 'Society Maintenance', 'Maid/Cook Salary', 'Repairs & Plumbing', 'Furniture'],
    description: 'Rent, domestic staff wages, society maintenance & repairs',
    popular: true,
  },
  {
    name: 'Bills & Utilities',
    type: 'EXPENSE',
    icon: 'Receipt',
    color: '#0ea5e9',
    subcategories: ['Electricity Bill', 'Mobile Recharge', 'Wi-Fi / Broadband', 'Gas Cylinder', 'Water Bill', 'DTH Recharge'],
    description: 'Monthly utility bills, internet recharges and municipal fees',
    popular: true,
  },
  {
    name: 'Transport & Fuel',
    type: 'EXPENSE',
    icon: 'Car',
    color: '#f59e0b',
    subcategories: ['Petrol / Diesel', 'Uber / Ola / Rapido', 'Metro & Bus Pass', 'Auto Rickshaw', 'Toll & Fastag', 'EV Charging'],
    description: 'Vehicle fueling, cabs, public transport passes & parking',
    popular: true,
  },
  {
    name: 'Shopping & Fashion',
    type: 'EXPENSE',
    icon: 'ShoppingBag',
    color: '#ec4899',
    subcategories: ['Clothing & Apparel', 'Footwear', 'Electronics & Gadgets', 'Accessories', 'Beauty & Makeup'],
    description: 'Apparel, e-commerce orders, footwear and cosmetics',
    popular: true,
  },
  {
    name: 'Entertainment & OTT',
    type: 'EXPENSE',
    icon: 'Film',
    color: '#d946ef',
    subcategories: ['Netflix / Prime / Hotstar', 'Movie Theatres', 'Gaming & In-App', 'Spotify / Music', 'Events & Concerts'],
    description: 'Streaming services, cinema tickets, gaming & concerts',
    popular: true,
  },
  {
    name: 'Health & Medical',
    type: 'EXPENSE',
    icon: 'HeartPulse',
    color: '#ef4444',
    subcategories: ['Doctor Consultation', 'Medicines & Pharmacy', 'Lab Diagnostic Tests', 'Dental Care', 'Health Insurance'],
    description: 'Prescription medicines, clinic visits and lab checkups',
    popular: true,
  },
  {
    name: 'Personal Care & Grooming',
    type: 'EXPENSE',
    icon: 'Sparkles',
    color: '#06b6d4',
    subcategories: ['Salon & Haircut', 'Spa & Massage', 'Skincare & Cosmetics', 'Perfumes & Grooming'],
    description: 'Haircuts, salon treatments, grooming & spa sessions',
  },
  {
    name: 'Fitness & Sports',
    type: 'EXPENSE',
    icon: 'TrendingUp',
    color: '#84cc16',
    subcategories: ['Gym Membership', 'Supplements & Protein', 'Sports Equipment', 'Yoga & Badminton', 'Sportswear'],
    description: 'Gym fees, fitness subscriptions, workout gear & nutrition',
  },
  {
    name: 'Travel & Vacations',
    type: 'EXPENSE',
    icon: 'Plane',
    color: '#3b82f6',
    subcategories: ['Flight Bookings', 'Train & IRCTC', 'Hotel & Airbnb', 'Sightseeing & Tours', 'Travel Shopping'],
    description: 'Flights, vacations, weekend getaways & hotel stays',
    popular: true,
  },
  {
    name: 'Education & Learning',
    type: 'EXPENSE',
    icon: 'GraduationCap',
    color: '#6366f1',
    subcategories: ['Tuition & College Fees', 'Books & Stationery', 'Online Courses (Udemy/Coursera)', 'Certifications'],
    description: 'College fees, coaching, books, online skill courses',
  },
  {
    name: 'Pets & Veterinary',
    type: 'EXPENSE',
    icon: 'Gift',
    color: '#f97316',
    subcategories: ['Pet Food', 'Vet Doctor Visits', 'Pet Grooming', 'Toys & Accessories', 'Vaccinations'],
    description: 'Dog/cat food, vet consultations, grooming & vaccinations',
  },
  {
    name: 'Gifts & Celebrations',
    type: 'EXPENSE',
    icon: 'Gift',
    color: '#a855f7',
    subcategories: ['Birthday Gifts', 'Festival Sweets & Gifts', 'Wedding Presents', 'Anniversary Gifts', 'Charity / Donations'],
    description: 'Presents for family/friends, festivals & weddings',
  },
  {
    name: 'Financial & EMIs',
    type: 'EXPENSE',
    icon: 'Building2',
    color: '#475569',
    subcategories: ['Home Loan EMI', 'Car Loan EMI', 'Personal Loan EMI', 'Credit Card Fees', 'Bank Annual Charges'],
    description: 'Loan EMIs, card annual fees and banking charges',
  },
  {
    name: 'Kids & Family',
    type: 'EXPENSE',
    icon: 'Users',
    color: '#eab308',
    subcategories: ['Baby Diapers & Food', 'Toys & Games', 'School Uniforms', 'Pocket Money', 'Daycare Fees'],
    description: 'Childcare supplies, school uniforms, daycare and pocket money',
  },
  {
    name: 'Subscriptions & Software',
    type: 'EXPENSE',
    icon: 'Laptop',
    color: '#64748b',
    subcategories: ['Cloud Storage (Google One/iCloud)', 'ChatGPT / AI Tools', 'SaaS Tools', 'Domain & Hosting'],
    description: 'Cloud storage, productivity software & AI tools',
  },
  {
    name: 'Vehicle Care & Servicing',
    type: 'EXPENSE',
    icon: 'Fuel',
    color: '#f43f5e',
    subcategories: ['Car/Bike Periodic Servicing', 'Vehicle Washing', 'Insurance Renewal', 'Tyre & Battery', 'Accessories'],
    description: 'Periodic automobile service, repairs, washing & insurance',
  },

  // Income Templates
  {
    name: 'Salary & Employment',
    type: 'INCOME',
    icon: 'Briefcase',
    color: '#10b981',
    subcategories: ['Monthly Base Salary', 'Performance Bonus', 'Overtime Allowance', 'Annual Incentive', 'Reimbursements'],
    description: 'Full-time job salary, quarterly bonus and reimbursements',
    popular: true,
  },
  {
    name: 'Freelance & Consulting',
    type: 'INCOME',
    icon: 'Laptop',
    color: '#06b6d4',
    subcategories: ['Client Projects', 'Hourly Consulting', 'Monthly Retainer', 'UI/UX & Web Dev', 'Content Writing'],
    description: 'Independent client gigs, consulting fees and contracts',
    popular: true,
  },
  {
    name: 'Business & Commercial Sales',
    type: 'INCOME',
    icon: 'Building2',
    color: '#3b82f6',
    subcategories: ['Product Sales', 'Service Invoices', 'E-commerce Revenue', 'B2B Client Contracts'],
    description: 'Company revenues, retail sales and client invoices',
  },
  {
    name: 'Investments & Dividends',
    type: 'INCOME',
    icon: 'TrendingUp',
    color: '#8b5cf6',
    subcategories: ['Stock Dividends', 'Mutual Fund Gains', 'Fixed Deposit Interest', 'Crypto Trading Profits'],
    description: 'Dividends, interest yields, capital gains & returns',
    popular: true,
  },
  {
    name: 'Rental & Real Estate Income',
    type: 'INCOME',
    icon: 'Home',
    color: '#22c55e',
    subcategories: ['Apartment Rent', 'Commercial Property', 'Parking Space Rent', 'Farmland Lease'],
    description: 'Tenant monthly rent and commercial property returns',
  },
  {
    name: 'Side Hustle & Creator Revenue',
    type: 'INCOME',
    icon: 'Sparkles',
    color: '#ec4899',
    subcategories: ['YouTube AdSense', 'Brand Sponsorships', 'Affiliate Commissions', 'Digital Courses / E-books'],
    description: 'Content creator income, digital products & sponsorships',
  },
  {
    name: 'Cashback & Rewards',
    type: 'INCOME',
    icon: 'HandCoins',
    color: '#eab308',
    subcategories: ['UPI Cashback', 'Credit Card Reward Points', 'Store Discounts & Rebates', 'Referral Bonuses'],
    description: 'UPI cashbacks, referral rewards and point redemptions',
  },
  {
    name: 'Gifts & Grants Received',
    type: 'INCOME',
    icon: 'Gift',
    color: '#f43f5e',
    subcategories: ['Birthday Cash Gift', 'Festival Shagun / Eidi', 'Family Support', 'Prize Money / Grants'],
    description: 'Monetary gifts from family, festival money & prize grants',
  },
];

const AVAILABLE_ICONS = [
  'UtensilsCrossed', 'ShoppingBag', 'Car', 'Film', 'Receipt',
  'Home', 'HeartPulse', 'GraduationCap', 'Plane', 'TrendingUp',
  'ShieldCheck', 'Users', 'Gift', 'Briefcase', 'Laptop',
  'Building2', 'PiggyBank', 'Sparkles', 'HelpCircle', 'Smartphone',
  'Coffee', 'Fuel', 'CreditCard', 'HandCoins', 'ArrowRightLeft',
];

const PRESET_COLORS = [
  '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6',
  '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6',
  '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b',
  '#f97316', '#78716c', '#64748b',
];

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  initialType = 'EXPENSE',
}) => {
  const { categories, addCategory, updateCategory, deleteCategory } = useMoney();

  // Navigation mode: 'my_categories' | 'catalogue' | 'form'
  const [activeTab, setActiveTab] = useState<'my_categories' | 'catalogue'>('my_categories');
  const [selectedTypeTab, setSelectedTypeTab] = useState<string>(
    initialType === 'INCOME' ? 'INCOME' : initialType === 'TRANSFER' ? 'TRANSFER' : 'EXPENSE'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'BOTH'>('EXPENSE');
  const [icon, setIcon] = useState('ShoppingBag');
  const [color, setColor] = useState('#f43f5e');
  const [subcategoriesInput, setSubcategoriesInput] = useState('');
  const [newSubInput, setNewSubInput] = useState('');

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Filter Active Categories
  const filteredCategories = categories.filter(cat => {
    if (selectedTypeTab !== 'ALL' && cat.type !== selectedTypeTab && cat.type !== 'BOTH') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = cat.name.toLowerCase().includes(q);
      const matchSub = (cat.subcategories || []).some(s => s.toLowerCase().includes(q));
      if (!matchName && !matchSub) return false;
    }
    return true;
  });

  // Filter Catalogue
  const filteredCatalogue = CATEGORY_CATALOGUE.filter(tpl => {
    if (selectedTypeTab !== 'ALL' && tpl.type !== selectedTypeTab && tpl.type !== 'BOTH') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tpl.name.toLowerCase().includes(q);
      const matchDesc = tpl.description.toLowerCase().includes(q);
      const matchSub = tpl.subcategories.some(s => s.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchSub) return false;
    }
    return true;
  });

  const handleOpenBlankAdd = () => {
    setEditingCategory(null);
    setName('');
    setType(selectedTypeTab === 'INCOME' ? 'INCOME' : 'EXPENSE');
    setIcon('ShoppingBag');
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setSubcategoriesInput('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setIcon(cat.icon);
    setColor(cat.color);
    setSubcategoriesInput((cat.subcategories || []).join(', '));
    setIsFormOpen(true);
  };

  // Clone from existing category or catalogue template to customize
  const handleCloneCategory = (cat: Category | CategoryTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(null);
    setName(`${cat.name} (Custom)`);
    setType(cat.type);
    setIcon(cat.icon);
    setColor(cat.color);
    setSubcategoriesInput((cat.subcategories || []).join(', '));
    setIsFormOpen(true);
  };

  // 1-Click Adopt from Catalogue
  const handleAdoptCatalogueTemplate = (tpl: CategoryTemplate, e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if category with same name already exists
    const existing = categories.find(c => c.name.toLowerCase() === tpl.name.toLowerCase());
    const finalName = existing ? `${tpl.name} ${categories.filter(c => c.name.startsWith(tpl.name)).length + 1}` : tpl.name;

    addCategory({
      name: finalName,
      type: tpl.type,
      icon: tpl.icon,
      color: tpl.color,
      isCustom: true,
      subcategories: [...tpl.subcategories],
      order: categories.length + 1,
    });

    showToast(`Added "${finalName}" to your categories!`);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please provide a category name');
      return;
    }

    const subList = subcategoriesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: name.trim(),
        type,
        icon,
        color,
        subcategories: subList,
      });
      showToast(`Updated "${name.trim()}"`);
    } else {
      addCategory({
        name: name.trim(),
        type,
        icon,
        color,
        isCustom: true,
        subcategories: subList,
        order: categories.length + 1,
      });
      showToast(`Created category "${name.trim()}"`);
    }

    setIsFormOpen(false);
  };

  const handleDelete = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this category?')) {
      deleteCategory(catId);
      showToast('Category removed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in-50">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden relative">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-2xl text-xs font-bold shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={15} className="text-emerald-400 dark:text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Category Manager & Catalogue
              </h2>
              <p className="text-[11px] text-slate-500">
                Browse catalogue presets, create custom categories, or duplicate variants
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form View OR Navigation View */}
        {isFormOpen ? (
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Sparkles size={14} className="text-emerald-500" />
                <span>{editingCategory ? 'Edit Category' : 'Create Custom Category'}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white hover:underline"
              >
                Back to catalogue
              </button>
            </div>

            {/* 3D Preview Box */}
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-850 flex items-center space-x-4 border border-slate-200/70 dark:border-slate-700/70 shadow-xs">
              <Category3DIcon
                name={icon}
                categoryName={name || 'Category'}
                color={color}
                size="lg"
                glow={true}
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {name || 'Category Name'}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {type} • 3D Skeuomorphic Emblem
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {subcategoriesInput.split(',').filter(Boolean).slice(0, 3).map((sub, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                      {sub.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Pet Care, OTT Streaming, Freelance..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            {/* Type Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Transaction Nature
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'EXPENSE', label: 'Expense' },
                  { id: 'INCOME', label: 'Income' },
                  { id: 'BOTH', label: 'Both / Shared' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id as any)}
                    className={`py-2 rounded-2xl text-xs font-bold border transition-all ${
                      type === t.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Icon Emblem Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Select 3D Icon Emblem
              </label>
              <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                {AVAILABLE_ICONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`p-2 rounded-2xl flex items-center justify-center transition-all ${
                      icon === ic
                        ? 'bg-emerald-500/20 ring-2 ring-emerald-500'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Category3DIcon name={ic} size="sm" color={color} glow={false} />
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Theme Color Accent
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      color === c ? 'scale-115 ring-2 ring-offset-2 ring-slate-900 dark:ring-white shadow-md' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Subcategories Editor */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Subcategories (Comma separated or add below)
              </label>
              <input
                type="text"
                value={subcategoriesInput}
                onChange={e => setSubcategoriesInput(e.target.value)}
                placeholder="e.g. Dog Food, Vet Visits, Toys, Grooming"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-1.5"
              >
                <Check size={16} />
                <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            
            {/* Top Navigation Tabs: Catalogue (+) vs My Active Categories */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('catalogue')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                  activeTab === 'catalogue'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen size={14} />
                <span>Preset Catalogue ({CATEGORY_CATALOGUE.length})</span>
                <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold px-1.5 py-0.2 rounded-full">
                  + Add
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('my_categories')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                  activeTab === 'my_categories'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers size={14} />
                <span>My Active Categories ({categories.length})</span>
              </button>
            </div>

            {/* Search Bar + Create From Scratch Button */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'catalogue'
                      ? 'Search catalogue (e.g. Pet, Subscriptions, Salary)...'
                      : 'Search my categories...'
                  }
                  className="w-full pl-9 pr-8 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleOpenBlankAdd}
                className="px-3.5 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center space-x-1.5 hover:bg-emerald-700 shadow-sm shrink-0 transition-colors"
                title="Create custom category from scratch"
              >
                <Plus size={15} />
                <span>Custom</span>
              </button>
            </div>

            {/* Nature Filter Pills */}
            <div className="flex space-x-1.5 p-1 bg-slate-100/80 dark:bg-slate-850 rounded-2xl">
              {['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTypeTab(t)}
                  className={`flex-1 py-1 rounded-xl text-xs font-bold transition-all ${
                    selectedTypeTab === t
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* TAB 1: PRESET CATALOGUE (+ TO ADD) */}
            {activeTab === 'catalogue' && (
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-200">
                    <Sparkles size={16} className="text-emerald-600 shrink-0" />
                    <span>
                      Tap <strong className="font-bold">+ Add</strong> to adopt any category instantly, or <strong className="font-bold">Customize</strong> to tweak it.
                    </span>
                  </div>
                </div>

                {filteredCatalogue.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-sm font-semibold">No catalogue presets found</p>
                    <p className="text-xs mt-1">Try another search or create a custom one with the "+ Custom" button.</p>
                  </div>
                ) : (
                  filteredCatalogue.map(tpl => {
                    const alreadyAdded = categories.some(
                      c => c.name.toLowerCase() === tpl.name.toLowerCase()
                    );

                    return (
                      <div
                        key={tpl.name}
                        className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-start justify-between space-x-3 group shadow-2xs"
                      >
                        {/* 3D Icon + Info */}
                        <div className="flex items-start space-x-3 min-w-0 flex-1">
                          <Category3DIcon
                            name={tpl.icon}
                            categoryName={tpl.name}
                            color={tpl.color}
                            size="md"
                            glow={true}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {tpl.name}
                              </span>
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {tpl.type}
                              </span>
                              {alreadyAdded && (
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-0.5">
                                  <Check size={10} strokeWidth={3} />
                                  <span>In list</span>
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {tpl.description}
                            </p>

                            {/* Subcategory Pills */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {tpl.subcategories.slice(0, 4).map(sub => (
                                <span
                                  key={sub}
                                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300"
                                >
                                  {sub}
                                </span>
                              ))}
                              {tpl.subcategories.length > 4 && (
                                <span className="text-[9px] text-slate-400">
                                  +{tpl.subcategories.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: + 1-Click Add & Customize */}
                        <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={e => handleCloneCategory(tpl, e)}
                            className="px-2 py-1 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                            title="Customize and tweak before creating"
                          >
                            Customize
                          </button>

                          <button
                            type="button"
                            onClick={e => handleAdoptCatalogueTemplate(tpl, e)}
                            className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center space-x-1 shadow-xs transition-colors"
                            title="Add directly to your active categories list"
                          >
                            <Plus size={13} />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: MY ACTIVE CATEGORIES */}
            {activeTab === 'my_categories' && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[50vh] overflow-y-auto pr-1">
                {filteredCategories.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-sm font-semibold">No active categories matching query</p>
                    <p className="text-xs mt-1">Tap the "Preset Catalogue" tab above to add categories with 1 click!</p>
                  </div>
                ) : (
                  filteredCategories.map(cat => (
                    <div
                      key={cat.id}
                      onClick={() => {
                        if (onSelectCategory) {
                          onSelectCategory(cat);
                          onClose();
                        }
                      }}
                      className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 px-2.5 rounded-2xl transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <Category3DIcon
                          name={cat.icon}
                          categoryName={cat.name}
                          color={cat.color}
                          size="sm"
                          glow={true}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {cat.name}
                            </span>
                            {cat.isCustom && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                                Custom
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                            {(cat.subcategories || []).length > 0
                              ? (cat.subcategories || []).slice(0, 3).join(', ') + ((cat.subcategories || []).length > 3 ? '...' : '')
                              : `${cat.type.toLowerCase()} category`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        {/* Duplicate / Create Variant Button */}
                        <button
                          type="button"
                          onClick={e => handleCloneCategory(cat, e)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          title="Create a customized variant (+)"
                        >
                          <Copy size={13} />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={e => handleOpenEdit(cat, e)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Delete Button (for custom categories) */}
                        {cat.isCustom && (
                          <button
                            type="button"
                            onClick={e => handleDelete(cat.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}

                        {onSelectCategory && (
                          <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform ml-1" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
