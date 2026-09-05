import React from 'react';
import { Transaction, Category, Account, CreditCard } from '../../types';
import { formatINR, format12HourTime } from '../../lib/currency';
import { Category3DIcon, Bank3DIcon, PaymentApp3DIcon } from '../common/IconHelper';
import { CheckCircle2, Paperclip, Edit2, Trash2 } from 'lucide-react';

interface TransactionRowProps {
  t: Transaction;
  isSelectionMode: boolean;
  isSelected: boolean;
  onPointerDown: (t: Transaction, e: React.PointerEvent) => void;
  onPointerUpOrLeave: (e: React.PointerEvent) => void;
  wasLongPressRef: React.MutableRefObject<boolean>;
  onSelectTransaction: (t: Transaction) => void;
  onToggleSelection: (id: string) => void;
  setSearchQuery: (q: string) => void;
  setSelectedAccountId: (id: string) => void;

  onEditTransaction?: (t: Transaction) => void;
  onSetDeleteTarget: (target: any) => void;

  categoriesMap: Map<string, Category>;
  accountsMap: Map<string, Account>;
  creditCardsMap: Map<string, CreditCard>;
  investmentsMap?: Map<string, any>;
  goalsMap?: Map<string, any>;
  debtsMap?: Map<string, any>;
}

export const TransactionRow = React.memo(({
  t,
  isSelectionMode,
  isSelected,
  onPointerDown,
  onPointerUpOrLeave,
  wasLongPressRef,
  onSelectTransaction,
  onToggleSelection,
  setSearchQuery,
  setSelectedAccountId,
  categoriesMap,
  accountsMap,
  creditCardsMap,
  investmentsMap,
  goalsMap,
  debtsMap,
  onEditTransaction,
  onSetDeleteTarget
}: TransactionRowProps) => {
  const isIncome = t.type === 'INCOME' || t.type === 'MONEY_LENT_REPAYMENT' || t.type === 'INVESTMENT_WITHDRAWAL';
  const isTransfer = (t.type as any) === 'TRANSFER' || (t.type as any) === 'CARD_PAYMENT' || t.type === 'INVESTMENT_CONTRIBUTION';
  const cat = t.categoryId ? categoriesMap.get(t.categoryId) : undefined;
  const acc = t.accountId ? accountsMap.get(t.accountId) : undefined;
  const card = t.creditCardId ? creditCardsMap.get(t.creditCardId) : undefined;
  const toAcc = t.toAccountId ? accountsMap.get(t.toAccountId) : undefined;
  const toCard = t.toCreditCardId ? creditCardsMap.get(t.toCreditCardId) : undefined;
  const investment = t.investmentId && investmentsMap ? investmentsMap.get(t.investmentId) : undefined;

  const accentColor = card ? card.color || '#9333ea' : acc ? acc.color || '#10b981' : '#64748b';

  const iconName = investment?.icon || cat?.icon || (isIncome ? 'ArrowDownLeft' : isTransfer ? 'ArrowRightLeft' : 'Receipt');
  const iconColor = investment?.color || cat?.color || (isIncome ? '#10b981' : '#64748b');
  const titleText = (t.type === 'INVESTMENT_CONTRIBUTION' && investment?.name) ? investment.name : (t.merchantName || investment?.name || t.categoryName || cat?.name || t.notes || 'Transaction');

                  return (
                    <div
                      
                      onPointerDown={(e) => onPointerDown(t, e)}
                      onPointerUp={onPointerUpOrLeave}
                      onPointerLeave={onPointerUpOrLeave}
                      onPointerCancel={onPointerUpOrLeave}
                      onContextMenu={(e) => {
                        // Prevent context menu on long press
                        if (wasLongPressRef.current || isSelectionMode) {
                          e.preventDefault();
                        }
                      }}
                      onClick={(e) => {
                        if (wasLongPressRef.current) {
                          e.preventDefault();
                          e.stopPropagation();
                          return;
                        }
                        if (isSelectionMode) {
                          onToggleSelection(t.id);
                        } else {
                          onSelectTransaction(t);
                        }
                      }}
                      className={`p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750/70 rounded-2xl transition-colors group select-none space-y-2 border border-slate-100 dark:border-slate-800 ${
                        isSelectionMode && isSelected ? 'bg-purple-50/50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-800' : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                      {/* Top Row: Left (Checkbox + Icon + Merchant Name + Type Badge) & Right (Amount + Time) */}
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {isSelectionMode && (
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected 
                                ? 'bg-purple-500 border-purple-500 text-white' 
                                : 'border-slate-300 dark:border-slate-600 bg-transparent text-transparent'
                            }`}>
                              <CheckCircle2 size={12} className={isSelected ? 'block' : 'hidden'} />
                            </div>
                          )}
                          <div className="relative shrink-0">
                            {investment?.institution ? (
                              <Bank3DIcon
                                institution={investment.institution || investment.name}
                                color={iconColor}
                                size="sm"
                                glow={true}
                              />
                            ) : (
                              <Category3DIcon
                                name={iconName}
                                categoryName={t.categoryName || cat?.name}
                                color={iconColor}
                                size="sm"
                                glow={true}
                                interactive={true}
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
                                {titleText}
                              </p>
                              <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                isIncome ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                                t.type === 'INVESTMENT_CONTRIBUTION' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' :
                                isTransfer ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' :
                                (t.type as any) === 'CARD_PAYMENT' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' :
                                'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                              }`}>
                                {(t.type as any) === 'CARD_PAYMENT' ? 'Card Bill' : t.type === 'MONEY_BORROWED' ? 'Borrowed' : t.type === 'MONEY_LENT' ? 'Lent' : t.type === 'INVESTMENT_CONTRIBUTION' ? 'Invest' : isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}
                              </span>
                              {t.receiptUrl && (
                                <Paperclip size={12} className="text-slate-400 shrink-0" title="Has receipt photo" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Time */}
                        <div className="text-right shrink-0">
                          <span
                            className={`text-xs sm:text-sm font-black block ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isTransfer
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isIncome ? `+${formatINR(t.amount)}` : isTransfer ? formatINR(t.amount) : `-${formatINR(t.amount)}`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {format12HourTime(t.time, t.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Row: Detail Badges & Quick Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100/80 dark:border-slate-800 text-[11px]">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0 text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {t.splits && t.splits.length > 0 ? `Split (${t.splits.length})` : (t.categoryName || t.type)}
                          </span>

                          {t.splits && t.splits.length > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold">
                              ✂️ Split
                            </span>
                          )}

                          {t.originalCurrency && t.originalCurrency !== 'INR' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-semibold">
                              {t.originalAmount} {t.originalCurrency}
                            </span>
                          )}

                          {t.subcategory && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {t.subcategory}
                            </span>
                          )}

                          {/* Mini 3D Payment Channel Badge */}
                          {t.paymentAppName && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchQuery(t.paymentAppName || '');
                              }}
                              className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                              title={`Filter by ${t.paymentAppName}`}
                            >
                              <PaymentApp3DIcon name={t.paymentAppName} size="xs" glow={false} />
                              <span>{t.paymentAppName}</span>
                            </button>
                          )}

                          {/* Mini 3D Bank / Card Badge */}
                          {(t.accountId || t.creditCardId || t.toAccountId || t.accountName || t.creditCardName) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const accId = t.accountId || (acc ? acc.id : '');
                                const cardId = t.creditCardId || (card ? card.id : '');
                                setSelectedAccountId(cardId || accId || 'ALL');
                              }}
                              className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold transition-colors cursor-pointer"
                              style={{ color: accentColor }}
                              title={`Filter transactions for ${t.creditCardName || t.accountName}`}
                            >
                              <Bank3DIcon
                                institution={card ? card.issuer : acc?.institution}
                                type={card ? 'CREDIT_CARD' : acc?.type}
                                color={accentColor}
                                size="xs"
                                glow={false}
                              />
                              <span className="truncate max-w-[120px] sm:max-w-none">
                                {(t.type as any) === 'TRANSFER' || (t.type as any) === 'CARD_PAYMENT'
                                  ? (() => {
                                      let fromName = 'External';
                                      let toName = 'External';

                                      if ((t.type as any) === 'CARD_PAYMENT') {
                                        fromName = t.accountName || acc?.name || 'External';
                                        toName = t.creditCardName || card?.name || 'External';
                                      } else {
                                        fromName = t.accountName || acc?.name || ((t.type as any) === 'CARD_PAYMENT' && !acc ? t.creditCardName || card?.name : 'External');
                                        toName = t.toAccountName || toAcc?.name || ((t.type as any) === 'CARD_PAYMENT' ? t.creditCardName || card?.name : 'External');
                                      }
                                      
                                      if (fromName !== 'External' && toName !== 'External') {
                                        return `${fromName} ➔ ${toName}`;
                                      } else if (fromName !== 'External') {
                                        return `${fromName} ➔ External`;
                                      } else if (toName !== 'External') {
                                        return `External ➔ ${toName}`;
                                      }
                                      return t.creditCardName || card?.name || t.accountName || acc?.name || 'Transfer';
                                    })()
                                  : t.creditCardName || card?.name || t.accountName || acc?.name || 'Account'}
                              </span>
                            </button>
                          )}

                          {/* Tags */}
                          {(t.tags || []).slice(0, 2).map((tag, tIdx) => (
                            <span
                              key={`${tag}-${tIdx}`}
                              className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {/* Quick Edit & Delete Action Buttons */}
                        {!isSelectionMode && (
                          <div className="flex items-center space-x-1 shrink-0 ml-auto">
                            {onEditTransaction && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditTransaction(t);
                                }}
                                className="p-1 sm:p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95 shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                                title="Edit transaction"
                              >
                                <Edit2 size={12} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetDeleteTarget({
                                  type: 'single',
                                  transaction: t,
                                  ids: [t.id],
                                  count: 1,
                                  title: `Delete "${titleText}"?`,
                                  amount: isIncome ? `+${formatINR(t.amount)}` : isTransfer ? formatINR(t.amount) : `-${formatINR(t.amount)}`,
                                  subtitle: `${t.date} • ${(typeof t.type === 'string' ? t.type : 'EXPENSE').replace(/_/g, ' ')}`,
                                  badge: t.categoryName || 'General',
                                });
                              }}
                              className="p-1 sm:p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-all cursor-pointer active:scale-95 shadow-2xs border border-rose-200/60 dark:border-rose-800/60"
                              title="Move to Trash"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Notes inside the transaction card */}
                      {t.notes && (
                        <div className="flex items-center space-x-1.5 text-[11px] text-amber-900 dark:text-amber-200/90 italic px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 max-w-full overflow-hidden">
                          <span className="text-amber-500 font-bold shrink-0 text-xs">📝</span>
                          <span className="truncate">{t.notes}</span>
                        </div>
                      )}
                    </div>
                  );
}, (prev, next) => {
  return (
    prev.t === next.t &&
    prev.isSelectionMode === next.isSelectionMode &&
    prev.isSelected === next.isSelected &&
    prev.onPointerDown === next.onPointerDown &&
    prev.onPointerUpOrLeave === next.onPointerUpOrLeave &&
    prev.onSelectTransaction === next.onSelectTransaction &&
    prev.onToggleSelection === next.onToggleSelection &&
    prev.setSearchQuery === next.setSearchQuery &&
    prev.setSelectedAccountId === next.setSelectedAccountId &&
    prev.onEditTransaction === next.onEditTransaction &&
    prev.onSetDeleteTarget === next.onSetDeleteTarget &&
    prev.categoriesMap === next.categoriesMap &&
    prev.accountsMap === next.accountsMap &&
    prev.creditCardsMap === next.creditCardsMap
  );
});
