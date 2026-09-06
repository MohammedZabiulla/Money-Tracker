import React, { useState } from 'react';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { Transaction, Account, CreditCard, PaymentApp } from '../../../types';
import { formatINR, formatCompactINR } from '../../../lib/currency';
import { Smartphone, CreditCard as CardIcon, Landmark, Banknote } from 'lucide-react';

interface PaymentChannelChartProps {
  transactions: Transaction[];
  accounts: Account[];
  creditCards: CreditCard[];
  paymentApps: PaymentApp[];
  activeMonth: string;
}

const CHANNEL_COLORS = [
  '#0284c7', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899',
  '#06b6d4', '#f97316', '#64748b', '#6366f1', '#14b8a6',
];

export const PaymentChannelChart: React.FC<PaymentChannelChartProps> = ({
  transactions,
  accounts,
  creditCards,
  paymentApps,
  activeMonth,
}) => {
  const [viewType, setViewType] = useState<'donut' | 'bars'>('donut');

  // Calculate spends by payment mode / app / card
  const channelTotals: { [key: string]: { name: string; amount: number; count: number; type: string; color: string } } = {};

  const monthlyExpenses = transactions.filter(
    t => !t.isDeleted && t.type === 'EXPENSE' && (activeMonth === 'ALL' || t.date.startsWith(activeMonth))
  );

  let totalExpenseAmount = 0;

  monthlyExpenses.forEach(t => {
    totalExpenseAmount += t.amount;

    let key = 'Other';
    let name = 'Other';
    let type = 'Other';
    let color = '#64748b';

    if (t.paymentAppName) {
      key = `app_${t.paymentAppName}`;
      name = t.paymentAppName;
      type = 'Payment App';
      const pApp = paymentApps.find(p => p.name === t.paymentAppName);
      color = pApp?.color || '#8b5cf6';
    } else if (t.creditCardId || t.creditCardName) {
      const card = creditCards.find(c => c.id === t.creditCardId);
      key = `card_${t.creditCardId || t.creditCardName}`;
      name = card?.name || t.creditCardName || 'Credit Card';
      type = 'Credit Card';
      color = card?.color || '#f43f5e';
    } else if (t.accountId || t.accountName) {
      const acc = accounts.find(a => a.id === t.accountId);
      key = `acc_${t.accountId || t.accountName}`;
      name = acc?.name || t.accountName || 'Bank Account';
      type = acc?.type === 'CASH' ? 'Cash' : acc?.type === 'WALLET' ? 'Wallet' : 'Bank Account';
      color = acc?.color || '#0284c7';
    }

    if (!channelTotals[key]) {
      channelTotals[key] = { name, amount: 0, count: 0, type, color };
    }
    channelTotals[key].amount += t.amount;
    channelTotals[key].count += 1;
  });

  const data = Object.values(channelTotals)
    .sort((a, b) => b.amount - a.amount)
    .map((item, idx) => ({
      ...item,
      percentage: totalExpenseAmount > 0 ? (item.amount / totalExpenseAmount) * 100 : 0,
      color: item.color || CHANNEL_COLORS[idx % CHANNEL_COLORS.length],
    }));

  if (data.length === 0 || totalExpenseAmount === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
        <Smartphone className="w-10 h-10 text-slate-400 mb-2" />
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Payment Mode Data</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Spends by UPI apps, Cards & Banks will appear here.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs backdrop-blur-md z-50">
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="font-bold text-slate-100">{item.name}</span>
            <span className="text-[10px] text-slate-400">({item.type})</span>
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="font-extrabold text-sm text-white">{formatINR(item.amount)}</span>
            <span className="text-[10px] font-semibold text-emerald-400">
              {item.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {item.count} transaction{item.count !== 1 ? 's' : ''}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Spend Channels & Methods
        </span>
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewType('donut')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              viewType === 'donut'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Donut
          </button>
          <button
            onClick={() => setViewType('bars')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              viewType === 'bars'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Bar List
          </button>
        </div>
      </div>

      {viewType === 'donut' ? (
        <div className="h-56 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="amount"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <XAxis
                type="number"
                tickFormatter={val => formatCompactINR(val)}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={85}
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Breakdown Items */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {data.slice(0, 6).map((item, idx) => (
          <div
            key={`${item.name || 'channel'}-${idx}`}
            className="p-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <div className="min-w-0">
                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate text-xs">
                  {item.name}
                </span>
                <span className="text-[10px] text-slate-400 block">{item.type}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-extrabold text-slate-900 dark:text-white block">
                {formatINR(item.amount)}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
