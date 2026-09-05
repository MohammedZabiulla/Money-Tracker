import { useScrollLock } from '../../hooks/useScrollLock';
import React, { useState, useEffect } from 'react';
import { Account } from '../../types';
import { formatINR } from '../../lib/currency';
import { Bank3DIcon } from '../common/IconHelper';
import {
  X,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  GripVertical,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Building,
  Wallet,
} from 'lucide-react';

interface ArrangeAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSaveOrder: (orderedIds: string[]) => void;
}

export const ArrangeAccountsModal: React.FC<ArrangeAccountsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSaveOrder,
}) => {
  useScrollLock(isOpen);

  const [items, setItems] = useState<Account[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setItems([...accounts]);
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const newItems = [...items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    setItems(newItems);
  };

  const moveToTop = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.unshift(moved);
    setItems(newItems);
  };

  const moveToBottom = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.push(moved);
    setItems(newItems);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    moveItem(draggedIndex, targetIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = () => {
    onSaveOrder(items.map(i => i.id));
    onClose();
  };

  const handleResetAlphabetical = () => {
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
    setItems(sorted);
  };

  const handleResetBalance = () => {
    const sorted = [...items].sort((a, b) => (b.calculatedBalance || 0) - (a.calculatedBalance || 0));
    setItems(sorted);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        id="arrange-accounts-modal"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[92vh] sm:h-auto sm:max-h-[88vh] my-auto"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Arrange Accounts & Wallets
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick presets */}
        <div className="px-5 py-2.5 bg-slate-100/60 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" />
            Quick arrange:
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetBalance}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:border-emerald-500 transition-all text-[11px]"
            >
              Highest Balance
            </button>
            <button
              onClick={handleResetAlphabetical}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:border-emerald-500 transition-all text-[11px]"
            >
              Name (A-Z)
            </button>
          </div>
        </div>

        {/* List of Accounts */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2 flex-1 scrollbar-thin">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No accounts available to arrange.
            </div>
          ) : (
            items.map((acc, index) => {
              const isFirst = index === 0;
              const isLast = index === items.length - 1;
              const isOver = dragOverIndex === index;
              const isDragging = draggedIndex === index;

              return (
                <div
                  key={acc.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border gap-2 transition-all ${
                    isDragging
                      ? 'opacity-40 border-dashed border-emerald-500 bg-emerald-50/20'
                      : isOver
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-[1.01]'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Left: Drag Handle & Rank & Icon & Name */}
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 shrink-0">
                      <GripVertical size={16} />
                    </div>

                    <span className="w-4 text-center text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0">
                      {index + 1}
                    </span>

                    <div className="shrink-0">
                      <Bank3DIcon
                        name={acc.icon}
                        institution={acc.institution}
                        color={acc.color}
                        size="sm"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {acc.name}
                        </h4>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          {acc.type}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                        {acc.institution} {acc.accountNumberLast4 ? `(••${acc.accountNumberLast4})` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right: Balance & Reorder Buttons */}
                  <div className="flex items-center justify-between sm:justify-end space-x-2 pl-7 sm:pl-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 pt-1.5 sm:pt-0">
                    <span
                      className={`text-xs font-extrabold whitespace-nowrap ${
                        acc.calculatedBalance >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-500'
                      }`}
                    >
                      {formatINR(acc.calculatedBalance)}
                    </span>

                    <div className="flex items-center space-x-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => moveItem(index, index - 1)}
                        title="Move up"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 transition-colors"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => moveItem(index, index + 1)}
                        title="Move down"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 transition-colors"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all"
          >
            <Check size={14} />
            <span>Apply Custom Arrangement</span>
          </button>
        </div>
      </div>
    </div>
  );
};
