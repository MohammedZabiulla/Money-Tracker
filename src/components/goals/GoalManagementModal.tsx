import React, { useState, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Goal, GoalAllocation } from '../../types';
import { formatINR } from '../../lib/currency';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { CustomDatePicker } from '../common/CustomDatePicker';
import {
  X,
  Plus,
  Target,
  Trophy,
  Calendar,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Edit2,
  History,
  Plane,
  Shield,
  Car,
  Home,
  Laptop,
  GraduationCap,
  Heart,
  Smartphone,
  Wallet,
  Clock,
  PiggyBank,
  Check,
} from 'lucide-react';

interface GoalManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_GOALS = [
  {
    name: 'Emergency Fund (6 Months)',
    targetAmount: 300000,
    color: '#10B981',
    icon: 'Shield',
    category: 'Safety',
  },
  {
    name: 'Vacation to Japan / Europe',
    targetAmount: 200000,
    color: '#3B82F6',
    icon: 'Plane',
    category: 'Travel',
  },
  {
    name: 'New Car Down Payment',
    targetAmount: 500000,
    color: '#F59E0B',
    icon: 'Car',
    category: 'Vehicle',
  },
  {
    name: 'Dream Laptop / Gadgets',
    targetAmount: 150000,
    color: '#8B5CF6',
    icon: 'Laptop',
    category: 'Electronics',
  },
  {
    name: 'Home Renovation & Decor',
    targetAmount: 250000,
    color: '#EC4899',
    icon: 'Home',
    category: 'Housing',
  },
  {
    name: 'Higher Studies & Certifications',
    targetAmount: 100000,
    color: '#06B6D4',
    icon: 'GraduationCap',
    category: 'Education',
  },
];

const COLOR_OPTIONS = [
  { label: 'Emerald Green', value: '#10B981', bg: 'bg-emerald-500' },
  { label: 'Royal Blue', value: '#3B82F6', bg: 'bg-blue-500' },
  { label: 'Violet Purple', value: '#8B5CF6', bg: 'bg-purple-500' },
  { label: 'Amber Orange', value: '#F59E0B', bg: 'bg-amber-500' },
  { label: 'Rose Pink', value: '#EC4899', bg: 'bg-pink-500' },
  { label: 'Teal Cyan', value: '#06B6D4', bg: 'bg-cyan-500' },
  { label: 'Indigo Navy', value: '#6366F1', bg: 'bg-indigo-500' },
  { label: 'Crimson Red', value: '#EF4444', bg: 'bg-red-500' },
];

export const GoalManagementModal: React.FC<GoalManagementModalProps> = ({ isOpen, onClose }) => {
  const {
    goals,
    accounts,
    addGoal,
    updateGoal,
    deleteGoal,
    allocateToGoal,
  } = useMoney();

  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Allocation modal state
  const [allocatingGoal, setAllocatingGoal] = useState<Goal | null>(null);
  const [allocationType, setAllocationType] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [allocationAmount, setAllocationAmount] = useState('');
  const [allocationAccountId, setAllocationAccountId] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');

  // History modal state
  const [historyGoal, setHistoryGoal] = useState<Goal | null>(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: '',
    color: '#10B981',
    icon: 'Target',
    notes: '',
    accountId: '',
  });

  const activeGoals = useMemo(() => {
    return (goals || []).filter(g => !g.isDeleted);
  }, [goals]);

  const filteredGoals = useMemo(() => {
    if (activeTab === 'in_progress') {
      return activeGoals.filter(g => g.status !== 'COMPLETED');
    }
    if (activeTab === 'completed') {
      return activeGoals.filter(g => g.status === 'COMPLETED');
    }
    return activeGoals;
  }, [activeGoals, activeTab]);

  const totalTarget = useMemo(() => {
    return activeGoals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  }, [activeGoals]);

  const totalSaved = useMemo(() => {
    return activeGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  }, [activeGoals]);

  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const handleOpenCreate = (preset?: typeof PRESET_GOALS[0]) => {
    if (preset) {
      setFormData({
        name: preset.name,
        targetAmount: preset.targetAmount.toString(),
        currentAmount: '0',
        targetDate: new Date(Date.now() + 180 * 86400000).toISOString().substring(0, 10),
        color: preset.color,
        icon: preset.icon,
        notes: `Target for ${preset.category}`,
        accountId: accounts[0]?.id || '',
      });
    } else {
      setFormData({
        name: '',
        targetAmount: '',
        currentAmount: '0',
        targetDate: '',
        color: '#10B981',
        icon: 'Target',
        notes: '',
        accountId: accounts[0]?.id || '',
      });
    }
    setEditingGoal(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: goal.targetDate || '',
      color: goal.color || '#10B981',
      icon: goal.icon || 'Target',
      notes: goal.notes || '',
      accountId: goal.accountId || accounts[0]?.id || '',
    });
    setIsCreateOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.targetAmount || Number(formData.targetAmount) <= 0) {
      return;
    }

    const targetAmount = parseFloat(formData.targetAmount);
    const currentAmount = parseFloat(formData.currentAmount) || 0;
    const isCompleted = currentAmount >= targetAmount;

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        name: formData.name.trim(),
        targetAmount,
        currentAmount,
        targetDate: formData.targetDate || undefined,
        color: formData.color,
        icon: formData.icon,
        notes: formData.notes.trim() || undefined,
        accountId: formData.accountId || undefined,
        status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      });
    } else {
      addGoal({
        name: formData.name.trim(),
        targetAmount,
        currentAmount,
        targetDate: formData.targetDate || undefined,
        color: formData.color,
        icon: formData.icon,
        notes: formData.notes.trim() || undefined,
        accountId: formData.accountId || undefined,
        status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      });
    }

    setIsCreateOpen(false);
    setEditingGoal(null);
  };

  const handleOpenAllocate = (goal: Goal, type: 'DEPOSIT' | 'WITHDRAW') => {
    setAllocatingGoal(goal);
    setAllocationType(type);
    setAllocationAmount('');
    setAllocationAccountId(goal.accountId || accounts[0]?.id || '');
    setAllocationNotes('');
  };

  const handleExecuteAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingGoal || !allocationAmount || Number(allocationAmount) <= 0) return;

    allocateToGoal(
      allocatingGoal.id,
      parseFloat(allocationAmount),
      allocationType,
      allocationAccountId || undefined,
      allocationNotes.trim() || undefined
    );

    setAllocatingGoal(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl h-[92vh] sm:h-auto sm:max-h-[88vh] my-auto flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
              <Target className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Savings Goals</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {activeGoals.length} Goals
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Goal</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top High-level Stats Banner */}
        <div className="p-2.5 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 shrink-0">
          <div className="bg-white dark:bg-slate-800 p-2.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5 truncate">Total Target Pool</span>
            <div className="text-xs sm:text-xl font-bold text-slate-900 dark:text-white truncate">{formatINR(totalTarget)}</div>
            <span className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5 block truncate">{activeGoals.length} targets</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-2.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 block mb-0.5 truncate">Total Saved</span>
            <div className="text-xs sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate">{formatINR(totalSaved)}</div>
            <span className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5 block truncate">{formatINR(Math.max(0, totalTarget - totalSaved))} left</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-2.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Completion</span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">{overallProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-1">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <span className="text-[9px] sm:text-[11px] text-slate-400 mt-1 block truncate">
              {activeGoals.filter(g => g.status === 'COMPLETED').length} done
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({activeGoals.length})
              </button>
              <button
                onClick={() => setActiveTab('in_progress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'in_progress'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                In Progress ({activeGoals.filter(g => g.status !== 'COMPLETED').length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'completed'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Completed ({activeGoals.filter(g => g.status === 'COMPLETED').length})
              </button>
            </div>

            <button
              onClick={() => handleOpenCreate()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Create New Goal
            </button>
          </div>

          {/* Quick Preset Starters (if fewer than 2 goals) */}
          {activeGoals.length < 3 && (
            <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Quick Start Templates 
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PRESET_GOALS.slice(0, 3).map((preset, idx) => (
                  <button
                    key={`preset_${preset.name}_${idx}`}
                    onClick={() => handleOpenCreate(preset)}
                    className="p-3 bg-white dark:bg-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all group flex items-start justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {preset.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Target: {formatINR(preset.targetAmount)}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Goals List Grid */}
          {filteredGoals.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <PiggyBank className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Goals Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {activeTab === 'completed'
                  ? 'Keep saving! Once you reach 100% of a target, it will appear here.'
                  : 'Start by creating a target for an emergency fund, holiday trip, or new gadget.'}
              </p>
              <button
                onClick={() => handleOpenCreate()}
                className="mt-4 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-medium hover:opacity-90"
              >
                Add Your First Goal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGoals.map((goal, idx) => {
                const percent = Math.min(100, Math.round(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100));
                const isComplete = goal.status === 'COMPLETED' || percent >= 100;
                
                // Calculate days remaining if target date exists
                let daysRemainingText = '';
                if (goal.targetDate) {
                  const targetTime = new Date(goal.targetDate).getTime();
                  const nowTime = new Date().setHours(0, 0, 0, 0);
                  const diffDays = Math.ceil((targetTime - nowTime) / 86400000);
                  if (diffDays < 0) {
                    daysRemainingText = 'Target date passed';
                  } else if (diffDays === 0) {
                    daysRemainingText = 'Due today!';
                  } else if (diffDays <= 30) {
                    daysRemainingText = `${diffDays} days left`;
                  } else {
                    const months = Math.round(diffDays / 30);
                    daysRemainingText = `~${months} month${months > 1 ? 's' : ''} left`;
                  }
                }

                return (
                  <div
                    key={`goal_manage_${goal.id}_${idx}`}
                    className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
                  >
                    {/* Top Color Accent Line */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: goal.color || '#10B981' }}
                    />

                    <div>
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                            style={{ backgroundColor: goal.color || '#10B981' }}
                          >
                            <Target className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                              {goal.name}
                            </h4>
                            {goal.notes && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {goal.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {percent}%
                          </span>
                        )}
                      </div>

                      {/* Numbers */}
                      <div className="flex items-baseline justify-between mb-2">
                        <div>
                          <span className="text-xs text-slate-400 block font-medium">Saved</span>
                          <span className="text-lg font-bold text-slate-900 dark:text-white">
                            {formatINR(goal.currentAmount)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block font-medium">Target</span>
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {formatINR(goal.targetAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: goal.color || '#10B981',
                          }}
                        />
                      </div>

                      {/* Date & Account metadata */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{daysRemainingText || (goal.targetDate ? goal.targetDate : 'No deadline')}</span>
                        </div>
                        {goal.allocations && goal.allocations.length > 0 && (
                          <button
                            onClick={() => setHistoryGoal(goal)}
                            className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <History className="w-3 h-3" />
                            {goal.allocations.length} transaction{goal.allocations.length > 1 ? 's' : ''}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="flex items-center justify-between mt-3 pt-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenAllocate(goal, 'DEPOSIT')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold transition-colors"
                          title="Allocate money to this goal"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Deposit
                        </button>
                        <button
                          onClick={() => handleOpenAllocate(goal, 'WITHDRAW')}
                          disabled={goal.currentAmount <= 0}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Withdraw from goal"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          Withdraw
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(goal)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="Edit Goal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between text-xs text-slate-500 shrink-0 gap-2">
          <span className="text-[10px] sm:text-xs truncate">Goals synced across your financial balance ledger.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-colors shrink-0"
          >
            Close
          </button>
        </div>
      </div>

      {/* CREATE / EDIT GOAL SUB-MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Fund, New Bike, Maldives Trip"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="100000"
                    value={formData.targetAmount}
                    onChange={e => setFormData({ ...formData, targetAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Initial Saved (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={formData.currentAmount}
                    onChange={e => setFormData({ ...formData, currentAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <CustomDatePicker
                    label="Target Date (Optional)"
                    value={formData.targetDate}
                    onChange={d => setFormData({ ...formData, targetDate: d })}
                    placeholder="Select target date..."
                    size="sm"
                    clearable={true}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Color Accent
                  </label>
                  <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c.value })}
                        className={`w-6 h-6 rounded-full ${c.bg} flex items-center justify-center transition-transform ${
                          formData.color === c.value ? 'scale-125 ring-2 ring-slate-900 dark:ring-white ring-offset-2' : ''
                        }`}
                      >
                        {formData.color === c.value && <Check className="w-3 h-3 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes / Motivation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Save 10% from monthly salary into liquid fund"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95"
                >
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALLOCATE / WITHDRAW SUB-MODAL */}
      {allocatingGoal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                    allocationType === 'DEPOSIT' ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}
                >
                  {allocationType === 'DEPOSIT' ? <Plus className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {allocationType === 'DEPOSIT' ? 'Deposit Funds to Goal' : 'Withdraw Funds from Goal'}
                  </h3>
                  <span className="text-[11px] text-slate-500">{allocatingGoal.name}</span>
                </div>
              </div>
              <button
                onClick={() => setAllocatingGoal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteAllocation} className="space-y-4">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAllocationType('DEPOSIT')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    allocationType === 'DEPOSIT'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  + Add Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setAllocationType('WITHDRAW')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    allocationType === 'WITHDRAW'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  - Withdraw
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  max={allocationType === 'WITHDRAW' ? allocatingGoal.currentAmount : undefined}
                  placeholder="5000"
                  value={allocationAmount}
                  onChange={e => setAllocationAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {allocationType === 'WITHDRAW' && (
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Available in goal: {formatINR(allocatingGoal.currentAmount)}
                  </span>
                )}
              </div>

              {accounts.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {allocationType === 'DEPOSIT' ? 'Deduct from Bank Account' : 'Deposit into Bank Account'}
                  </label>
                  <CustomSelect
                    value={allocationAccountId}
                    onChange={setAllocationAccountId}
                    placeholder="Select Account"
                    options={[
                      { value: '', label: 'None (Manual Record Only)' },
                      ...accounts.filter(acc => !acc.isDeleted).map(acc => ({
                        value: acc.id,
                        label: `${acc.name} (₹${acc.calculatedBalance.toLocaleString('en-IN')})`,
                      })),
                    ]}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Selecting an account will automatically update its balance and record a ledger entry.
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly salary savings portion"
                  value={allocationNotes}
                  onChange={e => setAllocationNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAllocatingGoal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95 ${
                    allocationType === 'DEPOSIT' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  {allocationType === 'DEPOSIT' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALLOCATION HISTORY SUB-MODAL */}
      {historyGoal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Allocation History</h3>
                  <span className="text-[11px] text-slate-500">{historyGoal.name}</span>
                </div>
              </div>
              <button
                onClick={() => setHistoryGoal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {(!historyGoal.allocations || historyGoal.allocations.length === 0) ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No allocation transactions recorded yet.
                </div>
              ) : (
                historyGoal.allocations.map((alloc, idx) => (
                  <div
                    key={`alloc_${alloc.id || 'a'}_${idx}`}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          alloc.type === 'DEPOSIT'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {alloc.type === 'DEPOSIT' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {alloc.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{alloc.date}</span>
                          {alloc.accountName && <span>• {alloc.accountName}</span>}
                          {alloc.notes && <span>• {alloc.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-xs font-bold ${
                        alloc.type === 'DEPOSIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {alloc.type === 'DEPOSIT' ? '+' : '-'}{formatINR(alloc.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setHistoryGoal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
