import React, { useState } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { formatINR } from '../../lib/currency';
import { Emblem3D } from '../common/IconHelper';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { X, Plus, Trash2, Coins, AlertCircle } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

interface BudgetManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetManagementModal: React.FC<BudgetManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  useScrollLock(isOpen);

  const { budgets, categories, addBudget, deleteBudget } = useMoney();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('10000');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat_food');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const categoryOptions: SelectOption<string>[] = categories.map(c => ({
    value: c.id,
    label: c.name,
  }));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a budget name (e.g. Dining Out or Groceries)');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid monthly limit amount');
      return;
    }

    addBudget({
      name: name.trim(),
      amount: amt,
      categoryId,
      month: 'ALL',
      rolloverType: 'NO_ROLLOVER',
      color: '#3B82F6',
    });

    setName('');
    setAmount('10000');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50 shrink-0">
          <div className="flex items-center space-x-3">
            <Emblem3D icon="Coins" from="#3b82f6" to="#1e3a8a" finish="metallic" shape="squircle" size="md" glow={true} />
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Monthly Budgets & Category Caps
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form to Add New Budget */}
        <form onSubmit={handleCreate} className="p-5 bg-blue-50/40 dark:bg-slate-800/40 border-b border-blue-100 dark:border-slate-800 space-y-3 shrink-0">
          <span className="text-xs font-bold text-blue-900 dark:text-blue-300 block">
            Create New Budget Limit
          </span>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300 flex items-center space-x-1.5">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Budget Name (e.g. Dining Out)"
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={amount}
              onChange={e => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Monthly Cap (₹)"
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Apply to Category
            </label>
            <CustomSelect
              value={categoryId}
              onChange={val => setCategoryId(val)}
              options={categoryOptions}
              size="sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center space-x-1.5 active:scale-98 transition-all"
          >
            <Plus size={15} />
            <span>Add Monthly Budget</span>
          </button>
        </form>

        {/* List of Active Budgets */}
        <div className="p-5 flex-1 overflow-y-auto space-y-2.5">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Budgets ({budgets.length})
            </h4>
          </div>

          {budgets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Coins size={36} className="mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">No monthly budgets configured yet.</p>
              <p className="text-[11px]">Add limits above to monitor your spending.</p>
            </div>
          ) : (
            budgets.map((b, idx) => (
              <div
                key={`budget_manage_${b.id}_${idx}`}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between group hover:border-blue-300 dark:hover:border-blue-700 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Emblem3D icon="Target" from="#3b82f6" to="#1d4ed8" finish="crystal" shape="squircle" size="sm" />
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                      {b.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Limit: <strong className="text-slate-800 dark:text-slate-200">{formatINR(b.amount)}</strong> / month
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                    Active
                  </span>
                  <button
                    onClick={() => deleteBudget(b.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete Budget"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
