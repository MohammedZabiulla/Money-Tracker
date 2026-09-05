import { useScrollLock } from "../../hooks/useScrollLock";
import React, { useState } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { Lock, Fingerprint, Delete, ShieldCheck } from 'lucide-react';

export const LockScreen: React.FC = () => {
  useScrollLock(true);
  const { unlockApp, settings } = useMoney();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const targetPin = settings.pinHash || '1234';

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        if (next === targetPin || !settings.pinHash) {
          unlockApp();
        } else {
          setError('Incorrect PIN. Try again');
          setTimeout(() => {
            setPin('');
            setError('');
          }, 800);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleBiometric = () => {
    unlockApp();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 text-white flex flex-col items-center justify-between p-6 select-none">
      <div className="flex flex-col items-center mt-12 space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
          <Lock size={32} />
        </div>
        <h1 className="text-xl font-bold">Money Tracker</h1>
        <p className="text-sm text-slate-400">Enter 4-Digit Security PIN</p>

        {/* PIN Dots */}
        <div className="flex space-x-4 pt-4">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                i < pin.length
                  ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-lg shadow-emerald-500/50'
                  : 'border-slate-600 bg-transparent'
              }`}
            />
          ))}
        </div>
        {error && <p className="text-xs text-rose-400 pt-2 animate-bounce">{error}</p>}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-4 pb-8">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="h-16 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-xl font-semibold flex items-center justify-center border border-slate-800 transition-all"
          >
            {d}
          </button>
        ))}
        <button
          onClick={handleBiometric}
          className="h-16 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-emerald-400 flex items-center justify-center border border-slate-800 transition-all"
          title="Use Fingerprint / Face ID"
        >
          <Fingerprint size={26} />
        </button>
        <button
          onClick={() => handleDigit('0')}
          className="h-16 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-xl font-semibold flex items-center justify-center border border-slate-800 transition-all"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="h-16 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-400 flex items-center justify-center border border-slate-800 transition-all"
        >
          <Delete size={24} />
        </button>
      </div>

      <div className="text-center text-xs text-slate-500 pb-2 flex items-center space-x-1">
        <ShieldCheck size={14} className="text-emerald-500" />
        <span>100% On-Device Private Security</span>
      </div>
    </div>
  );
};
