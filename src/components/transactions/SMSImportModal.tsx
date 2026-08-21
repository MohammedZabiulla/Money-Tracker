import React, { useState } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { parseBankSMS, ParsedSMSResult } from '../../lib/smsParser';
import { formatINR } from '../../lib/currency';
import {
  MessageSquareCode,
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SMSImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SMSImportModal: React.FC<SMSImportModalProps> = ({ isOpen, onClose }) => {
  const { accounts, creditCards, categories, paymentApps, addTransaction } = useMoney();

  const [rawSmsBatch, setRawSmsBatch] = useState<string>('');
  const [parsedList, setParsedList] = useState<ParsedSMSResult[]>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const sampleSMSList = [
    'Sent Rs. 650.00 from HDFC Bank A/C XX4920 to SWIGGY on 16-Aug Ref 994827',
    'INR 2,499.00 spent on ICICI Bank Credit Card XX1029 at BLINKIT GROCERIES on 16-Aug-2026 Ref 882910',
    'Dear SBI User, A/C 9812 Credited with Rs 75,000.00 by SALARY AUGUST on 01-Aug-2026',
    'Paid Rs. 149.00 on ZOMATO using Google Pay UPI linked to HDFC Bank XX4920 on 15-Aug',
  ];

  const handleParseBatch = () => {
    const lines = rawSmsBatch
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 10);

    const parsed: ParsedSMSResult[] = [];
    lines.forEach(line => {
      const res = parseBankSMS(line);
      if (res && res.amount && res.amount > 0) {
        parsed.push(res);
      }
    });

    setParsedList(parsed);
    setImportedCount(null);
  };

  const handleImportAll = () => {
    if (parsedList.length === 0) return;

    let count = 0;
    parsedList.forEach(item => {
      // Resolve accounts / cards
      let accountId: string | undefined;
      let cardId: string | undefined;

      if (item.accountLast4) {
        const matchCard = creditCards.find(c => c.lastFourDigits === item.accountLast4);
        if (matchCard) {
          cardId = matchCard.id;
        } else {
          const matchAcc = accounts.find(
            a => a.accountNumberLast4 === item.accountLast4 || (item.bankName && a.institution.toLowerCase().includes(item.bankName.toLowerCase()))
          );
          if (matchAcc) accountId = matchAcc.id;
        }
      } else if (item.bankName) {
        const matchAcc = accounts.find(a => a.institution.toLowerCase().includes(item.bankName!.toLowerCase()));
        if (matchAcc) accountId = matchAcc.id;
      }

      if (!accountId && !cardId) {
        const defaultAcc = accounts.find(a => a.isActive && a.type === 'SAVINGS') || accounts[0];
        if (defaultAcc) accountId = defaultAcc.id;
      }

      const paymentApp = item.paymentApp ? paymentApps.find(p => p.name.toLowerCase().includes(item.paymentApp!.toLowerCase())) : undefined;
      const cat = categories.find(c => c.id === item.suggestedCategoryId) || categories[0];

      addTransaction({
        amount: item.amount || 0,
        type: item.type || 'EXPENSE',
        date: item.date || new Date().toISOString().substring(0, 10),
        time: '12:00',
        categoryId: cat?.id || 'food_dining',
        categoryName: cat?.name,
        merchantName: item.merchant,
        accountId: cardId ? undefined : accountId,
        accountName: accountId ? accounts.find(a => a.id === accountId)?.name : undefined,
        creditCardId: cardId,
        creditCardName: cardId ? creditCards.find(c => c.id === cardId)?.name : undefined,
        paymentAppId: paymentApp?.id,
        paymentAppName: paymentApp?.name,
        notes: item.referenceNumber ? `Ref: ${item.referenceNumber}` : undefined,
        tags: ['SMS-Imported'],
      });

      count++;
    });

    setImportedCount(count);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    setTimeout(() => {
      onClose();
    }, 1400);
  };

  const handleRemoveParsedItem = (index: number) => {
    setParsedList(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquareCode size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Bank & UPI SMS Parser
              </h2>
              <p className="text-[11px] text-slate-500">
                Auto-extract amounts, merchants, banks, and dates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {importedCount !== null ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {importedCount} Transactions Imported!
              </h3>
              <p className="text-xs text-slate-500">
                Your balances, graphs, and expense reports have updated instantly.
              </p>
            </div>
          ) : (
            <>
              {/* Text Area */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Paste Bank SMS Alert(s) (One per line)
                </label>
                <textarea
                  rows={4}
                  value={rawSmsBatch}
                  onChange={e => setRawSmsBatch(e.target.value)}
                  placeholder="Paste one or multiple Indian bank SMS alerts here..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Sample Bank SMS Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Click to try sample bank alerts:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {sampleSMSList.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setRawSmsBatch(prev => (prev ? prev + '\n' + sample : sample));
                      }}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-left text-[11px] text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition-all truncate"
                    >
                      + {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parse Button */}
              <button
                type="button"
                onClick={handleParseBatch}
                className="w-full py-2.5 rounded-2xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm"
              >
                <Sparkles size={14} />
                <span>Parse SMS Text</span>
              </button>

              {/* Parsed Previews */}
              {parsedList.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Detected Transactions ({parsedList.length})
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      Ready to import
                    </span>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {parsedList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                item.type === 'INCOME' ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white'
                              }`}
                            >
                              {item.type}
                            </span>
                            <span>{formatINR(item.amount || 0)}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                            {item.merchant || 'Unknown Merchant'} • {item.bankName || 'Bank'} {item.accountLast4 ? `(••${item.accountLast4})` : ''}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveParsedItem(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-100/50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleImportAll}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <span>Import All {parsedList.length} Transactions</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
