import { useScrollLock } from '../../hooks/useScrollLock';
import React, { useState, useEffect } from 'react';
import { CreditCard } from '../../types';
import { formatINR } from '../../lib/currency';
import { CardChipBadge, NetworkLogo } from '../common/CardVisual';
import {
  X,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  GripVertical,
  Check,
  CreditCard as CreditCardIcon,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ArrangeCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CreditCard[];
  onSaveOrder: (orderedIds: string[]) => void;
}

export const ArrangeCardsModal: React.FC<ArrangeCardsModalProps> = ({
  isOpen,
  onClose,
  cards,
  onSaveOrder,
}) => {
  useScrollLock(isOpen);

  const [items, setItems] = useState<CreditCard[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setItems([...cards]);
    }
  }, [isOpen, cards]);

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

  const handleResetOutstanding = () => {
    const sorted = [...items].sort((a, b) => (b.currentOutstanding || 0) - (a.currentOutstanding || 0));
    setItems(sorted);
  };

  const handleResetLimit = () => {
    const sorted = [...items].sort((a, b) => (b.creditLimit || 0) - (a.creditLimit || 0));
    setItems(sorted);
  };

  const handleResetAlphabetical = () => {
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
    setItems(sorted);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        id="arrange-cards-modal"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[92vh] sm:h-auto sm:max-h-[88vh] my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Arrange Credit Cards
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
        <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Sparkles size={13} className="text-purple-500" />
            Quick arrange:
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetOutstanding}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:border-purple-500 transition-all text-[11px]"
            >
              Highest Due
            </button>
            <button
              onClick={handleResetLimit}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:border-purple-500 transition-all text-[11px]"
            >
              Highest Limit
            </button>
            <button
              onClick={handleResetAlphabetical}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:border-purple-500 transition-all text-[11px]"
            >
              Name (A-Z)
            </button>
          </div>
        </div>

        {/* List of Cards */}
        <div className="p-6 overflow-y-auto space-y-2 flex-1 scrollbar-thin">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No credit cards available to arrange.
            </div>
          ) : (
            items.map((card, index) => {
              const isFirst = index === 0;
              const isLast = index === items.length - 1;
              const isOver = dragOverIndex === index;
              const isDragging = draggedIndex === index;

              return (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isDragging
                      ? 'opacity-40 border-dashed border-purple-500 bg-purple-50/20'
                      : isOver
                      ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 scale-[1.01]'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Left: Drag Handle & Rank & Card Info */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                      <GripVertical size={16} />
                    </div>

                    <span className="w-5 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
                      {index + 1}
                    </span>

                    <div className="w-9 h-6 rounded-md bg-gradient-to-tr from-slate-900 to-slate-700 dark:from-slate-800 dark:to-slate-600 p-1 flex items-center justify-between shadow-xs border border-white/10 shrink-0">
                      <div className="w-2 h-1.5 rounded-xs bg-amber-400/80" />
                      {card.network && <NetworkLogo network={card.network} className="h-2 opacity-90 invert dark:invert-0" />}
                    </div>

                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {card.name}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 shrink-0">
                          ••{card.lastFourDigits}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {card.issuer} • Limit: {formatINR(card.creditLimit)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Outstanding Due & Reorder Buttons */}
                  <div className="flex items-center space-x-2">
                    <div className="text-right mr-1">
                      <span className="text-xs font-bold text-rose-500 block">
                        {formatINR(card.currentOutstanding)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Due: {card.dueDate}th
                      </span>
                    </div>

                    <div className="flex items-center space-x-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-0.5">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => moveToTop(index)}
                        title="Move to top"
                        className="p-1 rounded-lg text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-30 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 transition-colors"
                      >
                        <ChevronsUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => moveItem(index, index - 1)}
                        title="Move up"
                        className="p-1 rounded-lg text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-30 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 transition-colors"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => moveItem(index, index + 1)}
                        title="Move down"
                        className="p-1 rounded-lg text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-30 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 transition-colors"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => moveToBottom(index)}
                        title="Move to bottom"
                        className="p-1 rounded-lg text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-30 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 transition-colors"
                      >
                        <ChevronsDown size={14} />
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
            className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md shadow-purple-600/20 flex items-center space-x-1.5 transition-all"
          >
            <Check size={14} />
            <span>Apply Custom Card Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};
