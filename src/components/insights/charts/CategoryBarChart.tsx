import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CategorySpending } from '../../../lib/accountingEngine';
import { formatINR, formatCompactINR } from '../../../lib/currency';
import { ArrowDownUp, Layers } from 'lucide-react';

interface CategoryBarChartProps {
  categorySpending: CategorySpending[];
  activeMonth: string;
}

const DEFAULT_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6',
  '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#e11d48',
  '#84cc16', '#a855f7', '#0ea5e9', '#d97706', '#64748b',
];

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({
  categorySpending,
  activeMonth,
}) => {
  const [sortBy, setSortBy] = useState<'amount' | 'name' | 'count'>('amount');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // Filter and sort data
  let data = categorySpending
    .filter(c => c.totalAmount > 0)
    .map((c, index) => ({
      name: c.categoryName,
      amount: c.totalAmount,
      percentage: c.percentage,
      count: c.transactionCount,
      color: c.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      categoryId: c.categoryId,
    }));

  if (sortBy === 'amount') {
    data.sort((a, b) => (orientation === 'horizontal' ? a.amount - b.amount : b.amount - a.amount));
  } else if (sortBy === 'name') {
    data.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'count') {
    data.sort((a, b) => (orientation === 'horizontal' ? a.count - b.count : b.count - a.count));
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Expenses Recorded</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Bar chart will display once transactions are logged.</p>
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

  const chartHeight = orientation === 'horizontal' ? Math.max(220, data.length * 36) : 260;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setOrientation('horizontal')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              orientation === 'horizontal'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Horizontal Bars
          </button>
          <button
            onClick={() => setOrientation('vertical')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              orientation === 'vertical'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Vertical Columns
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <span className="text-[10px] font-semibold text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1 outline-none border border-slate-200 dark:border-slate-700"
          >
            <option value="amount">Amount</option>
            <option value="name">Name</option>
            <option value="count">Transactions</option>
          </select>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ height: `${chartHeight}px` }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          {orientation === 'horizontal' ? (
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
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
                width={90}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                tickFormatter={val => formatCompactINR(val)}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
