import React, { useState } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { formatINR } from '../../lib/currency';
import { Emblem3D } from '../common/IconHelper';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { X, Plus, Trash2, Landmark, AlertCircle, CheckCircle2, Calendar, CreditCard } from 'lucide-react';

interface LoanManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoanManagementModal: React.FC<LoanManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { loans, accounts, addLoan, payLoanEMI, deleteLoan } = useMoney();

  const [name, setName] = useState('');
  const [lenderName, setLenderName] = useState('HDFC Bank');
  const [principal, setPrincipal] = useState('500000');
  const [interestRate, setInterestRate] = useState('9.5');
  const [tenureMonths, setTenureMonths] = useState('36');
  const [emiAmount, setEmiAmount] = useState('16000');
  const [error, setError] = useState<string | null>(null);

  // EMI Payment Dialog State
  const [payingLoanId, setPayingLoanId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [payAmount, setPayAmount] = useState('');
  const [payPrincipal, setPayPrincipal] = useState('');
  const [payInterest, setPayInterest] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a loan name (e.g. Home Loan or Car Loan)');
      return;
    }
    const princ = parseFloat(principal);
    if (isNaN(princ) || princ <= 0) {
      setError('Please enter a valid principal amount');
      return;
    }
    const emi = parseFloat(emiAmount) || 10000;

    addLoan({
      name: name.trim(),
      type: 'PERSONAL',
      lenderName: lenderName.trim() || 'Bank',
      principalAmount: princ,
      interestRateAnnual: parseFloat(interestRate) || 10,
      tenureMonths: parseInt(tenureMonths, 10) || 36,
      emiAmount: emi,
      startDate: new Date().toISOString().substring(0, 10),
      nextPaymentDate: new Date().toISOString().substring(0, 10),
    });

    setName('');
    setPrincipal('500000');
    setEmiAmount('16000');
    setError(null);
  };

  const openPayDialog = (loanId: string) => {
    const target = loans.find(l => l.id === loanId);
    if (!target) return;
    setPayingLoanId(loanId);
    setPayAmount(target.emiAmount.toString());
    const approxInterest = Math.round((target.outstandingPrincipal * (target.interestRateAnnual / 100)) / 12);
    const approxPrincipal = Math.max(0, target.emiAmount - approxInterest);
    setPayInterest(approxInterest.toString());
    setPayPrincipal(approxPrincipal.toString());
    if (accounts.length > 0) setSelectedAccountId(accounts[0].id);
  };

  const handleConfirmPay = () => {
    if (!payingLoanId || !selectedAccountId) return;
    const total = parseFloat(payAmount) || 0;
    const princ = parseFloat(payPrincipal) || (total * 0.7);
    const int = parseFloat(payInterest) || (total - princ);

    payLoanEMI(payingLoanId, selectedAccountId, total, princ, int);
    setPayingLoanId(null);
  };

  const accountOptions: SelectOption<string>[] = accounts.filter(a => !a.isDeleted).map(a => ({
    value: a.id,
    label: `${a.name} (${formatINR(a.calculatedBalance)})`,
    sublabel: a.institution,
  }));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50 shrink-0">
          <div className="flex items-center space-x-3">
            <Emblem3D icon="Landmark" from="#f59e0b" to="#78350f" finish="metallic" shape="squircle" size="md" glow={true} />
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Loans & EMI Schedules
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track principal repayments, interest, and monthly installments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form to Add New Loan */}
        <form onSubmit={handleCreate} className="p-5 bg-amber-50/40 dark:bg-slate-800/40 border-b border-amber-100 dark:border-slate-800 space-y-3 shrink-0">
          <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block">
            Add Loan or EMI Facility
          </span>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300 flex items-center space-x-1.5">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Loan Name (e.g. Car Loan)"
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="text"
              value={lenderName}
              onChange={e => setLenderName(e.target.value)}
              placeholder="Lender / Bank"
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Principal Amount (₹)
              </label>
              <input
                type="number"
                value={principal}
                onChange={e => {
                  setPrincipal(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Monthly EMI (₹)
              </label>
              <input
                type="number"
                value={emiAmount}
                onChange={e => setEmiAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center justify-center space-x-1.5 active:scale-98 transition-all"
          >
            <Plus size={15} />
            <span>Track New Loan</span>
          </button>
        </form>

        {/* List of Tracked Loans */}
        <div className="p-5 flex-1 overflow-y-auto space-y-2.5">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Loans ({loans.length})
            </h4>
          </div>

          {loans.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Landmark size={36} className="mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">No loans or EMIs logged.</p>
              <p className="text-[11px]">Add your personal, vehicle, or home loans above.</p>
            </div>
          ) : (
            loans.map(l => (
              <div
                key={l.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 space-y-2 group hover:border-amber-300 dark:hover:border-amber-700 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                      {l.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Lender: {l.lenderName || 'Bank'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                      Outstanding: {formatINR(l.outstandingPrincipal)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      EMI: {formatINR(l.emiAmount)} / mo
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    Next Due: {l.nextPaymentDate || 'Monthly'}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => openPayDialog(l.id)}
                      className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-[10px] transition-colors"
                    >
                      Record EMI Payment
                    </button>
                    {deleteLoan && (
                      <button
                        onClick={() => deleteLoan(l.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Loan"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* EMI Payment Record Modal */}
        {payingLoanId && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full space-y-4 border border-amber-200 dark:border-amber-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Record Loan EMI Payment
                </h3>
                <button onClick={() => setPayingLoanId(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Pay from Account
                  </label>
                  <CustomSelect
                    value={selectedAccountId}
                    onChange={val => setSelectedAccountId(val)}
                    options={accountOptions}
                    size="sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Total EMI Paid (₹)
                  </label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Principal (₹)
                    </label>
                    <input
                      type="number"
                      value={payPrincipal}
                      onChange={e => setPayPrincipal(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Interest (₹)
                    </label>
                    <input
                      type="number"
                      value={payInterest}
                      onChange={e => setPayInterest(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleConfirmPay}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20"
                >
                  Confirm EMI Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
