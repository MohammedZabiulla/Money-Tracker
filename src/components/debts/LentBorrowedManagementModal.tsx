import { useScrollLock } from '../../hooks/useScrollLock';
import React, { useState, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { DebtRecord } from '../../types';
import { formatINR, format12HourTime } from '../../lib/currency';
import { generateDebtTransactionNarration } from '../../lib/accountingEngine';
import { ThemeColorPicker } from '../../lib/colorPalettes';
import { Emblem3D, Category3DIcon } from '../common/IconHelper';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import {
  X,
  Plus,
  Search,
  Check,
  Edit2,
  Trash2,
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Phone,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';

interface LentBorrowedManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'ALL' | 'LENT' | 'BORROWED' | 'SETTLED' | 'ADD';
  initialSettlingDebt?: DebtRecord | null;
}

export const LentBorrowedManagementModal: React.FC<LentBorrowedManagementModalProps> = ({
  isOpen,
  onClose,
  initialTab,
  initialSettlingDebt,
}) => {
  useScrollLock(isOpen);

  const { debts, accounts, transactions, addDebt, updateDebt, unsettleDebt, addTransaction, settleDebt, deleteDebt, deleteTransaction } = useMoney();

  const [activeTab, setActiveTab] = useState<'ALL' | 'LENT' | 'BORROWED' | 'SETTLED' | 'ADD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Record Form State
  const [personName, setPersonName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [debtType, setDebtType] = useState<'LENT' | 'BORROWED'>('LENT');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#0D9488');
  const [linkBankAccount, setLinkBankAccount] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');

  // Settlement Dialog State (Full or Part Repayments)
  const [settlingDebt, setSettlingDebt] = useState<DebtRecord | null>(null);
  const [settleMode, setSettleMode] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settlementAccountId, setSettlementAccountId] = useState(accounts[0]?.id || '');
  const [settleDate, setSettleDate] = useState<string>('');
  const [settleTime, setSettleTime] = useState<string>('');
  const [settleNotes, setSettleNotes] = useState<string>('');
  const [expandedHistoryDebtId, setExpandedHistoryDebtId] = useState<string | null>(null);

  // Edit Dialog State
  const [editingDebt, setEditingDebt] = useState<DebtRecord | null>(null);

  // Delete confirmation state
  const [deleteConfirmDebt, setDeleteConfirmDebt] = useState<DebtRecord | null>(null);
  const [deleteConfirmInst, setDeleteConfirmInst] = useState<{ id: string; amount: number; date: string; notes?: string } | null>(null);
  const [editPersonName, setEditPersonName] = useState('');
  const [editContactNumber, setEditContactNumber] = useState('');
  const [editDebtType, setEditDebtType] = useState<'LENT' | 'BORROWED'>('LENT');
  const [editAmount, setEditAmount] = useState('');
  const [editRemainingAmount, setEditRemainingAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editColor, setEditColor] = useState('#0D9488');
  const [editIsSettled, setEditIsSettled] = useState(false);

  // Selective Reopening State
  const [reopenTargetDebt, setReopenTargetDebt] = useState<DebtRecord | null>(null);
  const [reopenSelectedTxIds, setReopenSelectedTxIds] = useState<string[]>([]);

  const handleInitiateReopen = (targetDebt: DebtRecord) => {
    const targetRepayType = targetDebt.type === 'LENT' ? 'MONEY_LENT_REPAYMENT' : 'MONEY_BORROWED_REPAYMENT';
    const linkedRepays = transactions.filter(
      t =>
        !t.isDeleted &&
        t.type === targetRepayType &&
        (t.debtId === targetDebt.id || (t.debtPersonName && t.debtPersonName.toLowerCase().trim() === targetDebt.personName.toLowerCase().trim()))
    );

    if (linkedRepays.length === 0) {
      unsettleDebt(targetDebt.id);
    } else {
      setReopenTargetDebt(targetDebt);
      setReopenSelectedTxIds(linkedRepays.map(t => t.id));
    }
  };

  const handleOpenSettle = (debt: DebtRecord) => {
    const rem = debt.remainingAmount !== undefined ? debt.remainingAmount : (debt.isSettled ? 0 : debt.amount);
    setSettlingDebt(debt);
    setSettleMode('FULL');
    setSettleAmount(String(rem));
    setSettlementAccountId(accounts[0]?.id || '');
    const now = new Date();
    setSettleDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    setSettleTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
    setSettleNotes('');
  };

  React.useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (initialSettlingDebt) {
        handleOpenSettle(initialSettlingDebt);
      }
    }
  }, [isOpen, initialTab, initialSettlingDebt]);

  // Summary Metrics
  const { totalLent, totalBorrowed, netBalance, activeCount, settledCount } = useMemo(() => {
    let lent = 0;
    let borrowed = 0;
    let active = 0;
    let settled = 0;

    (debts || []).forEach(d => {
      if (d.isDeleted) return;
      const rem = d.remainingAmount !== undefined ? d.remainingAmount : (d.isSettled ? 0 : d.amount);
      if (d.isSettled || rem <= 0) {
        settled += 1;
        return;
      }
      active += 1;
      if (d.type === 'LENT') lent += rem;
      else borrowed += rem;
    });

    return {
      totalLent: lent,
      totalBorrowed: borrowed,
      netBalance: lent - borrowed,
      activeCount: active,
      settledCount: settled,
    };
  }, [debts]);

  const filteredDebts = useMemo(() => {
    return debts.filter(d => {
      if (d.isDeleted) return false;
      const matchSearch =
        !searchQuery.trim() ||
        d.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.notes && d.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (activeTab === 'LENT') return d.type === 'LENT' && !d.isSettled;
      if (activeTab === 'BORROWED') return d.type === 'BORROWED' && !d.isSettled;
      if (activeTab === 'SETTLED') return d.isSettled;
      return true; // 'ALL'
    });
  }, [debts, searchQuery, activeTab]);

  const accountOptions: SelectOption<string>[] = useMemo(() => {
    return accounts.filter(a => !a.isDeleted).map(a => ({
      value: a.id,
      label: a.name,
      sublabel: `${a.institution} • ${formatINR(a.calculatedBalance)}`,
    }));
  }, [accounts]);

  const handleCreateRecord = () => {
    if (!personName.trim()) {
      alert('Please enter person name');
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const debtId = addDebt({
      personName: personName.trim(),
      type: debtType,
      amount: val,
      dueDate: dueDate || undefined,
      contactNumber: contactNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      color: color || (debtType === 'LENT' ? '#0D9488' : '#4F46E5'),
    });

    if (linkBankAccount && selectedAccountId) {
      const acc = accounts.find(a => a.id === selectedAccountId);
      const now = new Date();
      const txDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const txTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      addTransaction({
        amount: val,
        type: debtType === 'LENT' ? 'MONEY_LENT' : 'MONEY_BORROWED',
        date: txDate,
        time: txTime,
        accountId: selectedAccountId,
        accountName: acc?.name,
        debtId,
        debtPersonName: personName.trim(),
        debtDueDate: dueDate || undefined,
        categoryId: 'cat_transfer',
        categoryName: debtType === 'LENT' ? 'Money Lent' : 'Money Borrowed',
        notes: notes.trim() || undefined,
      });
    }

    setPersonName('');
    setContactNumber('');
    setAmount('');
    setDueDate('');
    setNotes('');
    setActiveTab('ALL');
  };

  const handleOpenEdit = (debt: DebtRecord) => {
    setEditingDebt(debt);
    setEditPersonName(debt.personName || '');
    setEditContactNumber(debt.contactNumber || '');
    setEditDebtType(debt.type);
    setEditAmount(String(debt.amount));
    setEditRemainingAmount(String(debt.remainingAmount !== undefined ? debt.remainingAmount : (debt.isSettled ? 0 : debt.amount)));
    setEditDueDate(debt.dueDate || '');
    setEditNotes(debt.notes || '');
    setEditColor(debt.color || (debt.type === 'LENT' ? '#0D9488' : '#4F46E5'));
    setEditIsSettled(Boolean(debt.isSettled));
  };

  const handleSaveEdit = () => {
    if (!editingDebt) return;
    if (!editPersonName.trim()) {
      alert('Please enter person name');
      return;
    }
    const valAmount = parseFloat(editAmount);
    if (isNaN(valAmount) || valAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    const valRem = parseFloat(editRemainingAmount);
    const validRemaining = !isNaN(valRem) ? Math.max(0, valRem) : (editIsSettled ? 0 : valAmount);

    updateDebt(editingDebt.id, {
      personName: editPersonName.trim(),
      type: editDebtType,
      amount: valAmount,
      remainingAmount: editIsSettled ? 0 : validRemaining,
      dueDate: editDueDate || undefined,
      contactNumber: editContactNumber.trim() || undefined,
      notes: editNotes.trim() || undefined,
      color: editColor || (editDebtType === 'LENT' ? '#0D9488' : '#4F46E5'),
      isSettled: editIsSettled || validRemaining === 0,
    });

    setEditingDebt(null);
  };

  const handleConfirmSettle = () => {
    if (!settlingDebt) return;
    const currentRem = settlingDebt.remainingAmount !== undefined ? settlingDebt.remainingAmount : (settlingDebt.isSettled ? 0 : settlingDebt.amount);
    const parsedAmount = settleMode === 'FULL' ? currentRem : parseFloat(settleAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid repayment amount');
      return;
    }

    const suggestedNote = generateDebtTransactionNarration({
      type: settlingDebt.type === 'LENT' ? 'MONEY_LENT_REPAYMENT' : 'MONEY_BORROWED_REPAYMENT',
      personName: settlingDebt.personName,
      amount: parsedAmount,
      remainingBeforePayment: currentRem,
      totalDebtAmount: settlingDebt.amount,
      existingTransactions: transactions,
      debtId: settlingDebt.id,
      isSettledDirectly: parsedAmount >= currentRem,
    });

    settleDebt(
      settlingDebt.id,
      settlementAccountId || undefined,
      undefined,
      parsedAmount,
      settleDate || undefined,
      settleTime || undefined,
      settleNotes.trim() || suggestedNote
    );
    setSettlingDebt(null);
  };

  const getDebtInstallments = (debtId: string, personName: string, debtType: 'LENT' | 'BORROWED') => {
    const targetType = debtType === 'LENT' ? 'MONEY_LENT_REPAYMENT' : 'MONEY_BORROWED_REPAYMENT';
    return (transactions || [])
      .filter(t =>
        !t.isDeleted &&
        t.type === targetType &&
        (t.debtId ? t.debtId === debtId : (t.debtPersonName && t.debtPersonName.toLowerCase().trim() === personName.toLowerCase().trim()))
      )
      .sort((a, b) => (b.timestamp || b.createdAt) - (a.timestamp || a.createdAt));
  };

  // Generate deterministic pastel gradient for person avatar
  const getAvatarGradient = (name: string, type: 'LENT' | 'BORROWED') => {
    if (type === 'LENT') {
      return {
        bg: 'from-emerald-500 via-teal-600 to-emerald-800',
        text: 'text-emerald-300',
        accent: '#10B981',
      };
    }
    return {
      bg: 'from-rose-500 via-orange-600 to-amber-700',
      text: 'text-rose-300',
      accent: '#F43F5E',
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/25">
              <HandCoins size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Lent & Borrowed (Personal Ledger)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-extrabold tracking-wide uppercase border border-teal-500/20">
                  Peer Ledger
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

        {/* Summary Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 sm:px-5 bg-teal-500/5 dark:bg-teal-950/20 border-b border-teal-500/10 shrink-0 text-xs">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight size={16} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">You Lent (To Collect)</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                {formatINR(totalLent)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowDownLeft size={16} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">You Borrowed (To Pay)</span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400 text-xs sm:text-sm">
                {formatINR(totalBorrowed)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <HandCoins size={16} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Net Balance</span>
              <span
                className={`font-extrabold text-xs sm:text-sm ${
                  netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {netBalance >= 0 ? '+' : ''}
                {formatINR(netBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 px-4 sm:px-5 pt-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          {[
            { id: 'ALL', label: `All (${debts.length})` },
            { id: 'LENT', label: 'Lent (Receivables)' },
            { id: 'BORROWED', label: 'Borrowed (Payables)' },
            { id: 'SETTLED', label: `Settled (${settledCount})` },
            { id: 'ADD', label: '+ Record New Transaction' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List View */}
        {activeTab !== 'ADD' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search person or notes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                onClick={() => setActiveTab('ADD')}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-1.5"
              >
                <Plus size={13} />
                <span>Add Record</span>
              </button>
            </div>

            {filteredDebts.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 dark:bg-slate-850 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <HandCoins size={36} className="text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No records matching this filter
                </p>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Keep your peer loans, friend splits, and informal borrow balances organized with zero friction!
                </p>
                <button
                  onClick={() => setActiveTab('ADD')}
                  className="px-4 py-2 rounded-2xl bg-teal-600 text-white font-bold text-xs shadow-md"
                >
                  Add First Record
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredDebts.map((debt, idx) => {
                  const isLent = debt.type === 'LENT';
                  const initials = debt.personName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                  const style = getAvatarGradient(debt.personName, debt.type);
                  const installments = getDebtInstallments(debt.id, debt.personName, debt.type);
                  const totalRepaidFromInstallments = installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
                  const remaining = debt.isSettled ? 0 : (debt.remainingAmount !== undefined ? debt.remainingAmount : Math.max(0, debt.amount - totalRepaidFromInstallments));
                  const totalRepaid = debt.isSettled ? debt.amount : Math.max(0, debt.amount - remaining);
                  const repaidPercent = debt.amount > 0 ? Math.min(100, Math.round((totalRepaid / debt.amount) * 100)) : 100;
                  const isHistoryExpanded = expandedHistoryDebtId === debt.id;

                  return (
                    <div
                      key={`debt_${debt.id}_${idx}`}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 group ${
                        debt.isSettled
                          ? 'bg-slate-50 dark:bg-slate-850/50 border-slate-200/50 dark:border-slate-800 opacity-60'
                          : isLent
                          ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-900/50 hover:border-teal-400'
                          : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/50 hover:border-rose-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {/* 3D Initial Emblem Avatar */}
                          <div
                            className={`w-10 h-10 rounded-2xl ${debt.color ? '' : `bg-gradient-to-br ${style.bg}`} flex items-center justify-center font-extrabold text-white text-xs shadow-md shrink-0`}
                            style={{
                              background: debt.color ? `linear-gradient(135deg, ${debt.color}, #0f172a)` : undefined,
                              boxShadow: `0 4px 12px -2px ${debt.color || style.accent}50`,
                            }}
                          >
                            <span>{initials}</span>
                          </div>

                          <div>
                            <div className="flex items-center space-x-1.5">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                                {debt.personName}
                              </h4>
                              {debt.isSettled ? (
                                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                                  Settled
                                </span>
                              ) : (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    isLent
                                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                  }`}
                                >
                                  {isLent ? 'Lent' : 'Borrowed'}
                                </span>
                              )}
                            </div>

                            {debt.notes && (
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                {debt.notes}
                              </p>
                            )}

                            {debt.dueDate && (
                              <span className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                                <Clock size={10} />
                                <span>Due: {debt.dueDate}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-extrabold text-sm block ${
                              debt.isSettled
                                ? 'text-slate-400 line-through'
                                : isLent
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {formatINR(remaining)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {debt.isSettled ? 'Settled in Full' : (totalRepaid > 0 ? `Pending (Total: ${formatINR(debt.amount)})` : (isLent ? 'Receivable' : 'Payable'))}
                          </span>
                        </div>
                      </div>

                      {/* Multi-Part Repayment Progress Bar */}
                      {!debt.isSettled && totalRepaid > 0 && (
                        <div className="space-y-1 bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatINR(totalRepaid)} returned ({repaidPercent}%)
                            </span>
                            <span className="text-slate-500 font-medium">
                              {formatINR(remaining)} remaining
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${repaidPercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Installment History Dropdown */}
                      {installments.length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setExpandedHistoryDebtId(isHistoryExpanded ? null : debt.id)}
                            className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center space-x-1"
                          >
                            <Layers size={12} />
                            <span>
                              {installments.length} {installments.length === 1 ? 'Part Payment' : 'Part Payments'} recorded ({formatINR(totalRepaid)})
                            </span>
                            <span className="text-[9px] opacity-75">{isHistoryExpanded ? '▲ hide' : '▼ view'}</span>
                          </button>

                          {isHistoryExpanded && (
                            <div className="mt-2 space-y-1.5 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Payment Breakdown
                              </span>
                              {installments.map((inst, instIdx) => (
                                <div
                                  key={inst.id || `inst_${instIdx}`}
                                  className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-none gap-2"
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                                      {inst.date} {inst.time ? `• ${format12HourTime(inst.time, inst.timestamp)}` : ''} • {inst.accountName || 'Cash/Default'}
                                    </span>
                                    {inst.notes && (
                                      <span className="text-[10px] text-slate-400 block truncate">{inst.notes}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 shrink-0">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                      + {formatINR(inst.amount)}
                                    </span>
                                    {inst.id && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteConfirmInst({ id: inst.id, amount: inst.amount, date: inst.date, notes: inst.notes });
                                        }}
                                        className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                        title="Delete this installment"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between gap-2">
                        {debt.isSettled ? (
                          <button
                            onClick={() => handleInitiateReopen(debt)}
                            className="px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                            title="Reopen Debt"
                          >
                            <RotateCcw size={12} />
                            <span>Reopen</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenSettle(debt)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition-all ${
                              isLent
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                            }`}
                          >
                            <CheckCircle2 size={13} />
                            <span>{isLent ? 'Record Return / Settle' : 'Record Repayment'}</span>
                          </button>
                        )}

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleOpenEdit(debt)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-teal-600 transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmDebt(debt)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Record Form Tab */}
        {activeTab === 'ADD' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-w-xl mx-auto w-full">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Record Lent or Borrowed Money
              </h4>
              <p className="text-xs text-slate-500">
                Keep a clean, private ledger of personal dues and receivables
              </p>
            </div>

            {/* Direction Selector Pills */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDebtType('LENT')}
                className={`p-3 rounded-2xl border flex items-center space-x-2.5 transition-all text-left ${
                  debtType === 'LENT'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <ArrowUpRight size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold block">You Lent Money</span>
                  <span className="text-[10px] text-slate-400 font-normal">They owe you money (Receivable)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDebtType('BORROWED')}
                className={`p-3 rounded-2xl border flex items-center space-x-2.5 transition-all text-left ${
                  debtType === 'BORROWED'
                    ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                  <ArrowDownLeft size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold block">You Borrowed</span>
                  <span className="text-[10px] text-slate-400 font-normal">You owe them money (Payable)</span>
                </div>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Person / Contact Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma, Amit Uncle, Priya"
                  value={personName}
                  onChange={e => setPersonName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-extrabold outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <CustomDatePicker
                    label="Expected Due Date (Optional)"
                    value={dueDate}
                    onChange={d => setDueDate(d)}
                    placeholder="Select due date..."
                    size="sm"
                    clearable={true}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={contactNumber}
                  onChange={e => setContactNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason / Split Purpose (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Goa trip hotel bill split, Dinner party share"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              <ThemeColorPicker
                value={color}
                onChange={setColor}
                label="Theme Accent & Color"
              />

              {/* Reflect in Bank Account Toggle */}
              {accounts.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Record Bank Transaction
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {debtType === 'LENT' ? 'Deduct money from bank balance' : 'Add money to bank balance'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={linkBankAccount}
                      onChange={e => setLinkBankAccount(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 accent-teal-600"
                    />
                  </div>

                  {linkBankAccount && (
                    <div className="pt-1">
                      <CustomSelect
                        value={selectedAccountId}
                        onChange={val => setSelectedAccountId(val)}
                        options={accountOptions}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleCreateRecord}
                className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all active:scale-98"
              >
                Save to Lent & Borrowed Ledger
              </button>
            </div>
          </div>
        )}

        {/* Settlement / Partial Repayment Modal */}
        {settlingDebt && (() => {
          const currentRemaining = settlingDebt.remainingAmount !== undefined ? settlingDebt.remainingAmount : (settlingDebt.isSettled ? 0 : settlingDebt.amount);
          const currentRepaid = Math.max(0, settlingDebt.amount - currentRemaining);
          const enteredAmount = settleMode === 'FULL' ? currentRemaining : (parseFloat(settleAmount) || 0);
          const afterRepayRemaining = Math.max(0, currentRemaining - enteredAmount);
          const isLent = settlingDebt.type === 'LENT';

          return (
            <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full space-y-4 border border-teal-200 dark:border-teal-900/40 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isLent ? 'Record Money Received' : 'Record Repayment'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {settlingDebt.personName} • Total: {formatINR(settlingDebt.amount)} (Due: {formatINR(currentRemaining)})
                    </p>
                  </div>
                  <button
                    onClick={() => setSettlingDebt(null)}
                    className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Mode Selector: Part Payment vs Full */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setSettleMode('PARTIAL');
                      if (!settleAmount || parseFloat(settleAmount) <= 0) {
                        setSettleAmount(String(Math.round(currentRemaining / 2)));
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      settleMode === 'PARTIAL'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Part Payment (Installment)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettleMode('FULL');
                      setSettleAmount(String(currentRemaining));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      settleMode === 'FULL'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Full Settlement ({formatINR(currentRemaining)})
                  </button>
                </div>

                {/* Amount Input and Quick Chips */}
                {settleMode === 'PARTIAL' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      {isLent ? 'Amount Received Today (₹)' : 'Amount Paid Today (₹)'}
                    </label>
                    <input
                      type="number"
                      max={currentRemaining}
                      placeholder="e.g. 2000"
                      value={settleAmount}
                      onChange={e => setSettleAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-base font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                    />

                    {/* Quick Percentage Chips */}
                    <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                      {[
                        { label: '25%', val: Math.round(currentRemaining * 0.25) },
                        { label: '50%', val: Math.round(currentRemaining * 0.5) },
                        { label: '75%', val: Math.round(currentRemaining * 0.75) },
                        { label: 'Full Balance', val: currentRemaining },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSettleAmount(String(preset.val))}
                          className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-100 dark:hover:bg-teal-950/60 hover:text-teal-700 dark:hover:text-teal-300 transition-colors shrink-0"
                        >
                          {preset.label} ({formatINR(preset.val)})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamic Balance Impact Box */}
                <div className="p-3 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Current Pending Balance:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatINR(currentRemaining)}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>{isLent ? 'Receiving Now:' : 'Paying Now:'}</span>
                    <span>- {formatINR(enteredAmount)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-teal-200/50 dark:border-teal-800/50 flex items-center justify-between font-bold">
                    <span className="text-slate-800 dark:text-slate-200">New Remaining Balance:</span>
                    <span className={afterRepayRemaining === 0 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-teal-700 dark:text-teal-300'}>
                      {afterRepayRemaining === 0 ? '🎉 ₹0 (Fully Settled)' : formatINR(afterRepayRemaining)}
                    </span>
                  </div>
                </div>

                {/* Account Selection */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isLent ? 'Deposit Money Into Account' : 'Pay Money Out Of Account'}
                  </label>
                  <CustomSelect
                    value={settlementAccountId}
                    onChange={val => setSettlementAccountId(val)}
                    options={accountOptions}
                    size="sm"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-2">
                  <CustomDatePicker
                    label="Transaction Date"
                    value={settleDate}
                    onChange={d => setSettleDate(d)}
                    size="sm"
                  />
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={settleTime}
                      onChange={e => setSettleTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                {/* Note / Narration */}
                {(() => {
                  const suggestedSettleNote = generateDebtTransactionNarration({
                    type: isLent ? 'MONEY_LENT_REPAYMENT' : 'MONEY_BORROWED_REPAYMENT',
                    personName: settlingDebt.personName,
                    amount: enteredAmount,
                    remainingBeforePayment: currentRemaining,
                    totalDebtAmount: settlingDebt.amount,
                    existingTransactions: transactions,
                    debtId: settlingDebt.id,
                    isSettledDirectly: afterRepayRemaining === 0,
                  });

                  return (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Note / Remarks (Optional)
                        </label>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                          Auto: "{suggestedSettleNote}"
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder={`e.g. ${suggestedSettleNote}`}
                        value={settleNotes}
                        onChange={e => setSettleNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  );
                })()}

                <button
                  onClick={handleConfirmSettle}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center space-x-1.5"
                >
                  <Check size={15} />
                  <span>
                    {afterRepayRemaining === 0
                      ? `Confirm Full Settlement (${formatINR(enteredAmount)})`
                      : `Record Part Payment of ${formatINR(enteredAmount)}`}
                  </span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Edit Record Modal */}
        {editingDebt && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full space-y-4 border border-teal-200 dark:border-teal-900/40 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Edit Lent / Borrowed Record
                  </h3>
                  <p className="text-xs text-slate-500">Update person, amount, balance, or settlement status</p>
                </div>
                <button
                  onClick={() => setEditingDebt(null)}
                  className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditDebtType('LENT')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    editDebtType === 'LENT'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  You Lent (Receivable)
                </button>
                <button
                  type="button"
                  onClick={() => setEditDebtType('BORROWED')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    editDebtType === 'BORROWED'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  You Borrowed (Payable)
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Person Name
                  </label>
                  <input
                    type="text"
                    value={editPersonName}
                    onChange={e => setEditPersonName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Total Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={e => setEditAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Remaining Due (₹)
                    </label>
                    <input
                      type="number"
                      value={editRemainingAmount}
                      onChange={e => setEditRemainingAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <CustomDatePicker
                      label="Due Date (Optional)"
                      value={editDueDate}
                      onChange={d => setEditDueDate(d)}
                      size="sm"
                      clearable={true}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editContactNumber}
                      onChange={e => setEditContactNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Reason / Notes
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none"
                  />
                </div>

                <ThemeColorPicker
                  value={editColor}
                  onChange={setEditColor}
                  label="Theme Accent & Color"
                />

                {/* Mark as Settled toggle */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Mark as Settled
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Settled debts have zero pending balance
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editIsSettled}
                    onChange={e => {
                      setEditIsSettled(e.target.checked);
                      if (e.target.checked) setEditRemainingAmount('0');
                    }}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 accent-teal-600"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDebt(null)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all active:scale-98"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reopen Debt Modal with Selection of Repayments */}
        {reopenTargetDebt && (() => {
          const targetRepayType = reopenTargetDebt.type === 'LENT' ? 'MONEY_LENT_REPAYMENT' : 'MONEY_BORROWED_REPAYMENT';
          const linkedRepays = transactions.filter(
            t =>
              !t.isDeleted &&
              t.type === targetRepayType &&
              (t.debtId ? t.debtId === reopenTargetDebt.id : (t.debtPersonName && t.debtPersonName.toLowerCase().trim() === reopenTargetDebt.personName.toLowerCase().trim()))
          );
          const totalKeptAmount = linkedRepays
            .filter(t => reopenSelectedTxIds.includes(t.id))
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
          const calculatedRemaining = Math.max(0, reopenTargetDebt.amount - totalKeptAmount);
          const toDeleteCount = linkedRepays.length - reopenSelectedTxIds.length;

          const toggleSelectTx = (id: string) => {
            setReopenSelectedTxIds(prev =>
              prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            );
          };

          const handleConfirmReopen = () => {
            const txIdsToDelete = linkedRepays
              .filter(t => !reopenSelectedTxIds.includes(t.id))
              .map(t => t.id);
            unsettleDebt(reopenTargetDebt.id, txIdsToDelete);
            setReopenTargetDebt(null);
          };

          return (
            <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <RotateCcw size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        Reopen Settled Record
                      </h3>
                      <p className="text-xs text-slate-500">
                        {reopenTargetDebt.personName} • Original Amount: {formatINR(reopenTargetDebt.amount)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setReopenTargetDebt(null)}
                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-bold">Choose recorded repayments to keep or delete:</p>
                    <p className="text-[11px] opacity-90">
                      Checked repayments will be retained in your account ledger. Unchecked records will be removed, restoring their amounts back to the pending balance.
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Recorded Repayments ({linkedRepays.length})
                    </span>
                    <div className="space-x-2">
                      <button
                        type="button"
                        onClick={() => setReopenSelectedTxIds(linkedRepays.map(t => t.id))}
                        className="text-teal-600 dark:text-teal-400 font-semibold hover:underline text-[11px]"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <button
                        type="button"
                        onClick={() => setReopenSelectedTxIds([])}
                        className="text-rose-500 font-semibold hover:underline text-[11px]"
                      >
                        Deselect All (Clear)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {linkedRepays.map(inst => {
                      const isChecked = reopenSelectedTxIds.includes(inst.id);
                      return (
                        <div
                          key={inst.id}
                          onClick={() => toggleSelectTx(inst.id)}
                          className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-500/40 text-slate-900 dark:text-white'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 pointer-events-none"
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-xs truncate">
                                {inst.date} {inst.time ? `at ${format12HourTime(inst.time, inst.timestamp)}` : ''}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {inst.accountName || 'Account / Wallet'} {inst.notes ? `• ${inst.notes}` : ''}
                              </div>
                            </div>
                          </div>
                          <span className={`font-bold text-xs shrink-0 ${isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                            {formatINR(inst.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Live Outcome Summary */}
                  <div className="bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-3.5 space-y-2 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>Total Original Debt:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatINR(reopenTargetDebt.amount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>Retained Payments ({reopenSelectedTxIds.length}):</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">- {formatINR(totalKeptAmount)}</span>
                    </div>
                    {toDeleteCount > 0 && (
                      <div className="flex justify-between text-xs text-rose-500">
                        <span>Payments to Remove ({toDeleteCount}):</span>
                        <span className="font-bold">Will be removed from ledger</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-xs sm:text-sm font-black">
                      <span className="text-slate-900 dark:text-white">Reopened Pending Balance:</span>
                      <span className="text-teal-600 dark:text-teal-400">{formatINR(calculatedRemaining)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2 bg-slate-50/50 dark:bg-slate-850/50">
                  <button
                    type="button"
                    onClick={() => setReopenTargetDebt(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReopen}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <RotateCcw size={13} />
                    <span>Reopen Record ({formatINR(calculatedRemaining)} due)</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
        {/* Delete Confirmation Modal for Debt */}
        <ConfirmDeleteModal
          isOpen={Boolean(deleteConfirmDebt)}
          onClose={() => setDeleteConfirmDebt(null)}
          onConfirm={() => {
            if (deleteConfirmDebt) {
              deleteDebt(deleteConfirmDebt.id);
              setDeleteConfirmDebt(null);
            }
          }}
          title={`Delete ${deleteConfirmDebt?.type === 'LENT' ? 'Money Lent' : 'Money Borrowed'} Record?`}
          description="Are you sure you want to delete this lent/borrowed record? You can restore it anytime from More → Trash Bin."
          itemDetails={
            deleteConfirmDebt
              ? {
                  title: `${deleteConfirmDebt.type === 'LENT' ? 'Lent to' : 'Borrowed from'} ${deleteConfirmDebt.personName}`,
                  amount: formatINR(deleteConfirmDebt.amount),
                  subtitle: deleteConfirmDebt.dueDate ? `Due Date: ${new Date(deleteConfirmDebt.dueDate).toLocaleDateString()}` : (deleteConfirmDebt.notes || undefined),
                  badge: deleteConfirmDebt.isSettled ? 'Settled' : 'Pending',
                }
              : undefined
          }
          confirmLabel="Delete Record"
        />

        {/* Delete Confirmation Modal for Installment */}
        <ConfirmDeleteModal
          isOpen={Boolean(deleteConfirmInst)}
          onClose={() => setDeleteConfirmInst(null)}
          onConfirm={() => {
            if (deleteConfirmInst) {
              deleteTransaction(deleteConfirmInst.id, true);
              setDeleteConfirmInst(null);
            }
          }}
          title="Delete Installment Payment?"
          description="Are you sure you want to delete this recorded payment? It will be moved to the Trash Bin and your debt balance will update accordingly."
          itemDetails={
            deleteConfirmInst
              ? {
                  title: deleteConfirmInst.notes || 'Installment Payment',
                  amount: formatINR(deleteConfirmInst.amount),
                  subtitle: `Date: ${deleteConfirmInst.date}`,
                  badge: 'Installment',
                }
              : undefined
          }
          confirmLabel="Delete Installment"
        />
      </div>
    </div>
  );
};
