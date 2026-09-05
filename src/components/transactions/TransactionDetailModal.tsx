import { useScrollLock } from "../../hooks/useScrollLock";
import React, { useState, useEffect } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Transaction } from '../../types';
import { formatINR, format12HourTime } from '../../lib/currency';
import { Category3DIcon, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import {
  X,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Building,
  RotateCcw,
  ArrowRightLeft,
  Smartphone,
  FileText,
  Repeat,
  Copy,
  Check,
  Plus,
  StickyNote,
} from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onEdit?: (tx: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onEdit,
}) => {
  const { deleteTransaction, addTransaction, updateTransaction, categories, accounts, creditCards, goals, investments } = useMoney();
  useScrollLock(!!transaction);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>('');

  // Inline Note Editor state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [copiedNote, setCopiedNote] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (transaction) {
      setNoteText(transaction.notes || '');
      setIsEditingNote(false);
      setShowDeleteConfirm(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const isIncome = transaction.type === 'INCOME' || transaction.type === 'MONEY_LENT_REPAYMENT' || transaction.type === 'INVESTMENT_WITHDRAWAL' || transaction.type === 'REFUND';
  const isTransfer = transaction.type === 'TRANSFER' || transaction.type === 'CARD_PAYMENT' || transaction.type === 'INVESTMENT_CONTRIBUTION';
  const cat = categories.find(c => c.id === transaction.categoryId);
  
  // Resolve accounts/cards if they are missing their names (e.g., from old imports)
  const resolvedAccountName = transaction.accountName || accounts.find(a => a.id === transaction.accountId)?.name;
  const resolvedCreditCardName = transaction.creditCardName || creditCards.find(c => c.id === transaction.creditCardId)?.name;
  const resolvedToAccountName = transaction.toAccountName || accounts.find(a => a.id === transaction.toAccountId)?.name;

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleSaveNote = () => {
    updateTransaction(transaction.id, { notes: noteText.trim() });
    setIsEditingNote(false);
  };

  const handleCopyNote = () => {
    if (transaction.notes) {
      navigator.clipboard.writeText(transaction.notes);
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
    }
  };

  const handleRecordRefund = () => {
    const refundVal = parseFloat(refundAmount);
    if (!refundVal || refundVal <= 0 || refundVal > transaction.amount) {
      alert('Please enter a valid refund amount up to the original transaction value');
      return;
    }

    const now = new Date();
    addTransaction({
      amount: refundVal,
      type: 'REFUND',
      date: now.toISOString().substring(0, 10),
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      categoryId: transaction.categoryId,
      categoryName: transaction.categoryName,
      accountId: transaction.accountId,
      accountName: transaction.accountName,
      creditCardId: transaction.creditCardId,
      creditCardName: transaction.creditCardName,
      merchantName: transaction.merchantName,
      relatedTransactionId: transaction.id,
      notes: `Refund for: ${transaction.merchantName || transaction.categoryName}`,
    });

    setShowRefundForm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Transaction Details
          </span>
          <div className="flex items-center space-x-2">
            <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
              isIncome ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
              transaction.type === 'INVESTMENT_CONTRIBUTION' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400' :
              isTransfer ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' :
              'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
            }`}>
              {transaction.type === 'CARD_PAYMENT' ? 'Card Bill' : transaction.type === 'MONEY_BORROWED' ? 'Borrowed' : transaction.type === 'MONEY_LENT' ? 'Lent' : transaction.type === 'INVESTMENT_CONTRIBUTION' ? 'Invest' : isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}
            </span>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Hero Amount & Merchant */}
        <div className="p-6 text-center bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-center mb-3">
            <Category3DIcon
              name={cat?.icon || (isIncome ? 'ArrowDownLeft' : isTransfer ? 'ArrowRightLeft' : 'Receipt')}
              categoryName={transaction.categoryName || cat?.name}
              color={cat?.color || (isIncome ? '#10b981' : isTransfer ? '#3b82f6' : '#64748b')}
              size="xl"
              glow={true}
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {transaction.merchantName || transaction.categoryName || 'Transaction'}
          </h2>
          {/* Multi-Currency Support */}
          {transaction.originalCurrency && transaction.originalCurrency !== 'INR' ? (
            <div className="space-y-1 mt-2 animate-in fade-in duration-150">
              <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400">
                {transaction.originalCurrency} {transaction.originalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">
                Exchange rate: 1 {transaction.originalCurrency} = ₹{transaction.exchangeRate}
              </p>
              <div className={`text-3xl font-extrabold ${
                isIncome
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isTransfer
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {isIncome ? `+${formatINR(transaction.amount)}` : isTransfer ? formatINR(transaction.amount) : `-${formatINR(transaction.amount)}`}
              </div>
            </div>
          ) : (
            <div
              className={`text-3xl font-extrabold mt-1 ${
                isIncome
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isTransfer
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isIncome ? `+${formatINR(transaction.amount)}` : isTransfer ? formatINR(transaction.amount) : `-${formatINR(transaction.amount)}`}
            </div>
          )}
          {transaction.refundAmount && transaction.refundAmount > 0 && (
            <p className="text-xs text-emerald-600 mt-1">
              (Refunded: {formatINR(transaction.refundAmount)} • Net: {formatINR(transaction.amount - transaction.refundAmount)})
            </p>
          )}
        </div>

        {/* Key Info Rows */}
        <div className="p-5 space-y-3.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs flex items-center">
              <Calendar size={14} className="mr-1.5" /> Date & Time
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {transaction.date} at {format12HourTime(transaction.time, transaction.timestamp)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs flex items-center">
              <FileText size={14} className="mr-1.5" /> Category
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {transaction.categoryName || 'General'} {transaction.subcategory && `(${transaction.subcategory})`}
            </span>
          </div>

          {/* If CARD_PAYMENT */}
          {transaction.type === 'CARD_PAYMENT' ? (
            <>
              {resolvedAccountName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs flex items-center">
                    <Building size={14} className="mr-1.5" /> Paid From
                  </span>
                  <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    <Bank3DIcon
                      name="Building2"
                      institution={resolvedAccountName}
                      color="#059669"
                      size="xs"
                    />
                    <span>{resolvedAccountName}</span>
                  </div>
                </div>
              )}
              {resolvedCreditCardName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs flex items-center">
                    <CreditCard size={14} className="mr-1.5" /> Paid To Card
                  </span>
                  <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    <Bank3DIcon
                      name="CreditCard"
                      institution={resolvedCreditCardName}
                      color="#9333ea"
                      size="xs"
                    />
                    <span>{resolvedCreditCardName}</span>
                  </div>
                </div>
              )}
            </>
          ) : transaction.type === 'TRANSFER' ? (
            <>
              {(resolvedAccountName || resolvedCreditCardName) && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs flex items-center">
                    <Building size={14} className="mr-1.5" /> Transferred From
                  </span>
                  <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    <Bank3DIcon
                      name={transaction.creditCardId && !transaction.accountId ? 'CreditCard' : 'Building2'}
                      institution={resolvedAccountName || resolvedCreditCardName}
                      color={transaction.creditCardId && !transaction.accountId ? '#9333ea' : '#059669'}
                      size="xs"
                    />
                    <span>{resolvedAccountName || resolvedCreditCardName}</span>
                  </div>
                </div>
              )}
              {resolvedToAccountName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs flex items-center">
                    <ArrowRightLeft size={14} className="mr-1.5" /> Transferred To
                  </span>
                  <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    <Bank3DIcon
                      name="Building2"
                      institution={resolvedToAccountName}
                      color="#2563eb"
                      size="xs"
                    />
                    <span>{resolvedToAccountName}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {(resolvedAccountName || resolvedCreditCardName) && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs flex items-center">
                    <Building size={14} className="mr-1.5" /> Account / Card
                  </span>
                  <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    <Bank3DIcon
                      name={transaction.creditCardId ? 'CreditCard' : 'Building2'}
                      institution={resolvedCreditCardName || resolvedAccountName}
                      color={transaction.creditCardId ? '#9333ea' : '#059669'}
                      size="xs"
                    />
                    <span>{resolvedCreditCardName || resolvedAccountName}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {transaction.paymentAppName && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs flex items-center">
                <Smartphone size={14} className="mr-1.5" /> Channel
              </span>
              <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <PaymentApp3DIcon
                  name="Smartphone"
                  appName={transaction.paymentAppName}
                  size="xs"
                />
                <span>{transaction.paymentAppName}</span>
              </div>
            </div>
          )}

          {(transaction.recurringId || transaction.recurringName) && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-850/60">
              <span className="text-indigo-700 dark:text-indigo-300 text-xs flex items-center font-bold">
                <Repeat size={14} className="mr-1.5" /> Recurring Schedule
              </span>
              <span className="font-extrabold text-xs text-indigo-900 dark:text-indigo-200">
                {transaction.recurringName || 'Auto-Recorded Entry'}
              </span>
            </div>
          )}

          {/* Debt Engagement Details (Consistent with Hold-to-Preview) */}
          {transaction.debtPersonName && (
            <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 dark:border-rose-500/20 rounded-2xl p-3 text-xs space-y-1.5 animate-in fade-in duration-150">
              <div className="flex justify-between items-center border-b border-rose-500/10 pb-1">
                <span className="font-bold text-rose-600 dark:text-rose-400 uppercase text-[9px] tracking-wider">Debt Engagement</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                  transaction.isDebtSettled 
                    ? 'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' 
                    : 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-700'
                }`}>
                  {transaction.isDebtSettled ? 'Settled' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                <span>Counterparty:</span>
                <span className="font-black text-slate-800 dark:text-slate-100">{transaction.debtPersonName}</span>
              </div>
              {transaction.debtDueDate && (
                <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                  <span>Expected Due:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{transaction.debtDueDate}</span>
                </div>
              )}
            </div>
          )}

          {/* Goal Linkage details (Just like Debt Engagement details) */}
          {transaction.goalId && (() => {
            const linkedGoal = goals.find(g => g.id === transaction.goalId);
            if (!linkedGoal) return null;
            const percent = Math.min(100, Math.max(0, (linkedGoal.currentAmount / linkedGoal.targetAmount) * 100));
            return (
              <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 rounded-2xl p-3 text-xs space-y-1.5 animate-in fade-in duration-150">
                <div className="flex justify-between items-center border-b border-emerald-500/10 pb-1">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[9px] tracking-wider">Goal Engagement</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                    linkedGoal.status === 'COMPLETED'
                      ? 'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                      : linkedGoal.status === 'CLOSED'
                      ? 'bg-slate-100/80 dark:bg-slate-950/50 text-slate-700 dark:text-slate-400'
                      : 'bg-indigo-100/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400'
                  }`}>
                    {linkedGoal.status === 'CLOSED' ? 'Closed' : linkedGoal.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                  <span>Goal Name:</span>
                  <span className="font-black text-slate-800 dark:text-slate-100">{linkedGoal.name}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                  <span>Progress:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {formatINR(linkedGoal.currentAmount)} of {formatINR(linkedGoal.targetAmount)} ({percent.toFixed(0)}%)
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {transaction.investmentId && (() => {
            const linkedInvestment = investments.find(i => i.id === transaction.investmentId);
            if (!linkedInvestment) return null;
            return (
              <div className="bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/10 dark:border-teal-500/20 rounded-2xl p-3 text-xs space-y-1.5 animate-in fade-in duration-150">
                <div className="flex justify-between items-center border-b border-teal-500/10 pb-1">
                  <span className="font-bold text-teal-600 dark:text-teal-400 uppercase text-[9px] tracking-wider">Investment Asset</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{linkedInvestment.name}</span>
                  <span className="font-black text-slate-900 dark:text-white">{formatINR(linkedInvestment.currentValue)}</span>
                </div>
              </div>
            );
          })()}

          {/* Splits Breakdown (Consistent with Hold-to-Preview) */}
          {transaction.splits && transaction.splits.length > 0 && (
            <div className="bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/10 dark:border-purple-500/20 rounded-2xl p-3 text-xs space-y-2 animate-in fade-in duration-150">
              <span className="font-extrabold text-purple-600 dark:text-purple-400 uppercase text-[9px] tracking-wider block">
                Bill Splits ({transaction.splits.length})
              </span>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                {transaction.splits.map((s, idx) => (
                  <div key={`${s.notes || 'split'}-${idx}`} className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span className="truncate max-w-[200px] font-medium">{s.notes || `Person ${idx + 1}`}</span>
                    <span className="font-black text-slate-800 dark:text-slate-200">{formatINR(s.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Notes Section */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center">
                <StickyNote size={13} className="mr-1.5 text-amber-500" />
                Notes
              </span>
              {!isEditingNote && (
                <div className="flex items-center space-x-1">
                  {transaction.notes && (
                    <button
                      type="button"
                      onClick={handleCopyNote}
                      className="px-2 py-0.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center space-x-1 transition-colors"
                      title="Copy notes"
                    >
                      {copiedNote ? (
                        <>
                          <Check size={11} className="text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setNoteText(transaction.notes || '');
                      setIsEditingNote(true);
                    }}
                    className="px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg flex items-center space-x-1 transition-colors"
                  >
                    {transaction.notes ? (
                      <>
                        <Edit2 size={11} />
                        <span>Edit</span>
                      </>
                    ) : (
                      <>
                        <Plus size={11} />
                        <span>Add Note</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {isEditingNote ? (
              <div className="space-y-2 animate-in fade-in duration-150">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Write a note about this transaction..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-500/50 dark:border-emerald-500/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none font-medium"
                  autoFocus
                />
                <div className="flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingNote(false);
                      setNoteText(transaction.notes || '');
                    }}
                    className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            ) : transaction.notes ? (
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-slate-800 dark:text-slate-200 italic leading-relaxed whitespace-pre-wrap">
                "{transaction.notes}"
              </div>
            ) : (
              <div
                onClick={() => {
                  setNoteText('');
                  setIsEditingNote(true);
                }}
                className="py-2.5 px-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs flex items-center justify-center space-x-1.5 cursor-pointer hover:border-emerald-500/50 hover:text-emerald-600 transition-colors"
              >
                <Plus size={12} />
                <span>No notes attached. Click to add a note.</span>
              </div>
            )}
          </div>

          {transaction.tags && transaction.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {transaction.tags.map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {transaction.receiptUrl && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">Receipt:</span>
              <img
                src={transaction.receiptUrl}
                alt="Receipt"
                className="w-full max-h-48 object-cover rounded-2xl border border-slate-200 dark:border-slate-700"
              />
            </div>
          )}
        </div>

        {/* Refund Prompt */}
        {showRefundForm ? (
          <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Enter Refund Amount (Max {formatINR(transaction.amount)})
            </span>
            <div className="flex space-x-2">
              <input
                type="number"
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                placeholder="₹ Amount"
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
              <button
                onClick={handleRecordRefund}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        ) : null}

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
          {onEdit && (
            <button
              onClick={() => {
                onEdit(transaction);
              }}
              className="px-3 py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>
          )}
          {transaction.type === 'EXPENSE' && !showRefundForm && (
            <button
              onClick={() => setShowRefundForm(true)}
              className="px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1"
            >
              <RotateCcw size={13} />
              <span>Refund</span>
            </button>
          )}
          <button
            onClick={handleDelete}
            className={`${!onEdit && transaction.type !== 'EXPENSE' ? 'col-span-3' : !onEdit || (transaction.type === 'EXPENSE' && showRefundForm) ? 'col-span-2' : 'col-span-1'} px-3 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center justify-center space-x-1 transition-all`}
          >
            <Trash2 size={13} />
            <span>Trash</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          deleteTransaction(transaction.id, true);
          setShowDeleteConfirm(false);
          onClose();
        }}
        title="Delete Transaction?"
        description="Are you sure you want to move this transaction to the Trash Bin? You can restore it anytime from More → Trash Bin."
        itemDetails={{
          title: transaction.merchantName || transaction.categoryName || transaction.notes || 'Transaction',
          amount: isIncome ? `+${formatINR(transaction.amount)}` : isTransfer ? formatINR(transaction.amount) : `-${formatINR(transaction.amount)}`,
          subtitle: `${transaction.date} • ${(typeof transaction.type === 'string' ? transaction.type : 'EXPENSE').replace(/_/g, ' ')}`,
          badge: transaction.categoryName || 'General',
        }}
        confirmLabel="Move to Trash"
      />
    </div>
  );
};
