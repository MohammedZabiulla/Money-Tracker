import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemDetails?: {
    title: string;
    amount?: string;
    subtitle?: string;
    badge?: string;
  };
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Transaction?',
  description = 'This transaction will be moved to the Trash Bin. You can restore it anytime from More → Trash Bin.',
  itemDetails,
  confirmLabel = 'Move to Trash',
  cancelLabel = 'Cancel',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[210] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Icon + Title */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Confirm your deletion action
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Item Details Preview Box if provided */}
        {itemDetails && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-750/70 flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {itemDetails.title}
              </p>
              {itemDetails.subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {itemDetails.subtitle}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              {itemDetails.amount && (
                <span className="text-sm font-extrabold text-slate-900 dark:text-white block font-mono">
                  {itemDetails.amount}
                </span>
              )}
              {itemDetails.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-750 text-slate-700 dark:text-slate-300">
                  {itemDetails.badge}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Description / Notice */}
        <div className="flex items-start space-x-2 text-xs text-slate-600 dark:text-slate-400 bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200/50 dark:border-amber-900/40">
          <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{description}</span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/25 transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-1.5"
          >
            <Trash2 size={15} />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
