import React, { useState, useMemo } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { DebtRecord } from '../../types';
import { formatINR } from '../../lib/currency';
import { Emblem3D, Category3DIcon } from '../common/IconHelper';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { CustomDatePicker } from '../common/CustomDatePicker';
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
}

export const LentBorrowedManagementModal: React.FC<LentBorrowedManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { debts, accounts, addDebt, settleDebt, deleteDebt } = useMoney();

  const [activeTab, setActiveTab] = useState<'ALL' | 'LENT' | 'BORROWED' | 'SETTLED' | 'ADD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Record Form State
  const [personName, setPersonName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [debtType, setDebtType] = useState<'LENT' | 'BORROWED'>('LENT');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Settlement Dialog State
  const [settlingDebt, setSettlingDebt] = useState<DebtRecord | null>(null);
  const [settlementAccountId, setSettlementAccountId] = useState(accounts[0]?.id || '');

  // Summary Metrics
  const { totalLent, totalBorrowed, netBalance, activeCount, settledCount } = useMemo(() => {
    let lent = 0;
    let borrowed = 0;
    let active = 0;
    let settled = 0;

    debts.forEach(d => {
      if (d.isSettled) {
        settled += 1;
        return;
      }
      active += 1;
      const rem = d.remainingAmount ?? d.amount;
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

    addDebt({
      personName: personName.trim(),
      type: debtType,
      amount: val,
      dueDate: dueDate || undefined,
      contactNumber: contactNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setPersonName('');
    setContactNumber('');
    setAmount('');
    setDueDate('');
    setNotes('');
    setActiveTab('ALL');
  };

  const handleConfirmSettle = () => {
    if (!settlingDebt) return;
    settleDebt(settlingDebt.id, settlementAccountId || undefined);
    setSettlingDebt(null);
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
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track money lent to friends, family receivables, split dues & personal payables
              </p>
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
                {filteredDebts.map(debt => {
                  const isLent = debt.type === 'LENT';
                  const initials = debt.personName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                  const style = getAvatarGradient(debt.personName, debt.type);

                  return (
                    <div
                      key={debt.id}
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
                            className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${style.bg} flex items-center justify-center font-extrabold text-white text-xs shadow-md shrink-0`}
                            style={{
                              boxShadow: `0 4px 12px -2px ${style.accent}50`,
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
                            {formatINR(debt.amount)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {isLent ? 'Receivable' : 'Payable'}
                          </span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      {!debt.isSettled && (
                        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                          <button
                            onClick={() => setSettlingDebt(debt)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition-all ${
                              isLent
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                            }`}
                          >
                            <CheckCircle2 size={13} />
                            <span>{isLent ? 'Mark Received' : 'Mark Paid Back'}</span>
                          </button>

                          <button
                            onClick={() => deleteDebt(debt.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500"
                            title="Delete Record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
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

              <button
                onClick={handleCreateRecord}
                className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all active:scale-98"
              >
                Save to Lent & Borrowed Ledger
              </button>
            </div>
          </div>
        )}

        {/* Settlement Account Modal */}
        {settlingDebt && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full space-y-4 border border-teal-200 dark:border-teal-900/40 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Settle {settlingDebt.type === 'LENT' ? 'Receivable' : 'Payable'}
                  </h3>
                  <p className="text-xs text-slate-500">{settlingDebt.personName} • {formatINR(settlingDebt.amount)}</p>
                </div>
                <button
                  onClick={() => setSettlingDebt(null)}
                  className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {settlingDebt.type === 'LENT' ? 'Deposit Money Into Account' : 'Pay Money Out Of Account'}
                </label>
                <CustomSelect
                  value={settlementAccountId}
                  onChange={val => setSettlementAccountId(val)}
                  options={accountOptions}
                  size="sm"
                />
              </div>

              <button
                onClick={handleConfirmSettle}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-98"
              >
                Confirm Full Settlement
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
