import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { FinancialSummary } from '../../../lib/accountingEngine';
import { formatINR, formatCompactINR } from '../../../lib/currency';
import { ArrowDownLeft, ArrowUpRight, Sparkles } from 'lucide-react';

interface CashflowComparisonChartProps {
  summary: FinancialSummary;
  activeMonth: string;
}

export const CashflowComparisonChart: React.FC<CashflowComparisonChartProps> = ({
  summary,
  activeMonth,
}) => {
  const chartData = [
    {
      name: 'Income',
      amount: summary.monthlyIncome,
      color: '#10b981', // emerald
      description: 'Total Inflows',
    },
    {
      name: 'Expenses',
      amount: summary.monthlyExpenses,
      color: '#ef4444', // rose
      description: 'Total Outflows',
    },
    {
      name: 'Net Savings',
      amount: Math.max(0, summary.monthlySavings),
      color: '#06b6d4', // cyan
      description: `Retained (${summary.savingsRatePercent.toFixed(0)}%)`,
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs backdrop-blur-md z-50">
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="font-bold text-slate-100">{item.name}</span>
          </div>
          <div className="font-extrabold text-sm text-white mt-1">
            {formatINR(item.amount)}
          </div>
          <div className="text-[10px] text-slate-300 mt-0.5">{item.description}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50 text-center">
          <div className="flex items-center justify-center space-x-1 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
            <ArrowDownLeft size={12} />
            <span>Income</span>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-emerald-800 dark:text-emerald-200 block mt-1">
            {formatINR(summary.monthlyIncome)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 text-center">
          <div className="flex items-center justify-center space-x-1 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
            <ArrowUpRight size={12} />
            <span>Expenses</span>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-rose-800 dark:text-rose-200 block mt-1">
            {formatINR(summary.monthlyExpenses)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200/60 dark:border-cyan-900/50 text-center">
          <div className="flex items-center justify-center space-x-1 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold">
            <Sparkles size={12} />
            <span>Savings</span>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-cyan-800 dark:text-cyan-200 block mt-1">
            {formatINR(summary.monthlySavings)}
          </span>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="h-56 w-full">
        {summary.monthlyIncome === 0 && summary.monthlyExpenses === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Cashflow Recorded</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Income and expense transactions in {activeMonth === 'ALL' ? 'all time' : activeMonth} will appear here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={val => formatCompactINR(val)}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
