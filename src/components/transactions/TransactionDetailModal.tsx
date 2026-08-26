import React, { useState, useEffect } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Transaction } from '../../types';
import { formatINR, format12HourTime } from '../../lib/currency';
import { IconHelper, Category3DIcon, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import {
  X,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Tag,
  CreditCard,
  Building,
  RotateCcw,
  ArrowRightLeft,
  Smartphone,
  FileText,
  AlertCircle,
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
  const { deleteTransaction, addTransaction, updateTransaction, categories } = useMoney();
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>('');

  // Inline Note Editor state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [copiedNote, setCopiedNote] = useState(false);

  useEffect(() => {
    if (transaction) {
      setNoteText(transaction.notes || '');
      setIsEditingNote(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const isIncome = transaction.type === 'INCOME';
  const isTransfer = transaction.type === 'TRANSFER';
  const cat = categories.find(c => c.id === transaction.categoryId);

  const handleDelete = () => {
    deleteTransaction(transaction.id, true);
    onClose();
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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Transaction Details
          </span>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
          >
            <X size={20} />
          </button>
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
          <div
            className={`text-3xl font-extrabold mt-1 ${
              isIncome
                ? 'text-emerald-600 dark:text-emerald-400'
                : isTransfer
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {isIncome ? `+${formatINR(transaction.amount)}` : `-${formatINR(transaction.amount)}`}
          </div>
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

          {(transaction.accountName || transaction.creditCardName) && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs flex items-center">
                <Building size={14} className="mr-1.5" /> Account / Card
              </span>
              <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Bank3DIcon
                  name={transaction.creditCardId ? 'CreditCard' : 'Building2'}
                  institution={transaction.creditCardName || transaction.accountName}
                  color={transaction.creditCardId ? '#9333ea' : '#059669'}
                  size="xs"
                />
                <span>{transaction.creditCardName || transaction.accountName}</span>
              </div>
            </div>
          )}

          {transaction.toAccountName && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs flex items-center">
                <ArrowRightLeft size={14} className="mr-1.5" /> Transferred To
              </span>
              <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Bank3DIcon
                  name="Building2"
                  institution={transaction.toAccountName}
                  color="#2563eb"
                  size="xs"
                />
                <span>{transaction.toAccountName}</span>
              </div>
            </div>
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
    </div>
  );
};
