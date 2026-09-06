import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Line,
  ComposedChart,
} from 'recharts';
import { Transaction } from '../../../types';
import { formatINR, formatCompactINR } from '../../../lib/currency';
import { Flame, Calendar, TrendingUp } from 'lucide-react';

interface DailySpendTrendChartProps {
  transactions: Transaction[];
  activeMonth: string; // "YYYY-MM"
  totalExpenses: number;
}

export const DailySpendTrendChart: React.FC<DailySpendTrendChartProps> = ({
  transactions,
  activeMonth,
  totalExpenses,
}) => {
  const [chartMode, setChartMode] = useState<'daily' | 'cumulative'>('daily');

  // Compute daily numbers for the month
  const { chartData, peakDay, dailyAverage, totalDaysInMonth } = useMemo(() => {
    let year = new Date().getFullYear();
    let month = new Date().getMonth() + 1;
    let daysInMonth = 30;

    if (activeMonth && activeMonth !== 'ALL' && activeMonth.includes('-')) {
      const [yearStr, monthStr] = activeMonth.split('-');
      year = parseInt(yearStr, 10) || year;
      month = parseInt(monthStr, 10) || month;
      daysInMonth = new Date(year, month, 0).getDate();
    }

    const dayTotals: { [day: number]: { amount: number; count: number; transactions: Transaction[] } } = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dayTotals[d] = { amount: 0, count: 0, transactions: [] };
    }

    transactions
      .filter(t => !t.isDeleted && t.type === 'EXPENSE' && (activeMonth === 'ALL' || t.date.startsWith(activeMonth)))
      .forEach(t => {
        const parts = t.date.split('-');
        const d = parts.length > 2 ? parseInt(parts[2], 10) : 1;
        if (dayTotals[d]) {
          dayTotals[d].amount += t.amount;
          dayTotals[d].count += 1;
          dayTotals[d].transactions.push(t);
        }
      });

    let runningCumulative = 0;
    let maxSpend = 0;
    let peakDayNum = 1;

    const data = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
      const amount = dayTotals[d].amount;
      runningCumulative += amount;

      if (amount > maxSpend) {
        maxSpend = amount;
        peakDayNum = d;
      }

      data.push({
        day: d,
        label: `${d}`,
        dayName,
        isWeekend,
        amount,
        count: dayTotals[d].count,
        cumulative: runningCumulative,
        dateFormatted: `${d} ${dateObj.toLocaleDateString('en-US', { month: 'short' })}`,
      });
    }

    const avg = daysInMonth > 0 ? totalExpenses / daysInMonth : 0;

    return {
      chartData: data,
      peakDay: { day: peakDayNum, amount: maxSpend },
      dailyAverage: avg,
      totalDaysInMonth: daysInMonth,
    };
  }, [transactions, activeMonth, totalExpenses]);

  if (totalExpenses === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
        <Calendar className="w-10 h-10 text-slate-400 mb-2" />
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Daily Spend Data</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Daily spending bar graph will appear as expenses are logged.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs backdrop-blur-md z-50">
          <div className="flex items-center justify-between space-x-3 mb-1">
            <span className="font-bold text-slate-100">{item.dateFormatted} ({item.dayName})</span>
            {item.isWeekend && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                Weekend
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="font-extrabold text-sm text-white">
              {formatINR(chartMode === 'daily' ? item.amount : item.cumulative)}
            </span>
            {chartMode === 'daily' && item.amount > dailyAverage && (
              <span className="text-[10px] text-amber-400 font-semibold">Above avg</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {item.count} transaction{item.count !== 1 ? 's' : ''} on this day
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3">
      {/* Header Insights & Switcher */}
      <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          {peakDay.amount > 0 && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 text-[11px] font-semibold">
              <Flame size={13} className="text-amber-500" />
              <span>
                Peak: Day {peakDay.day} ({formatINR(peakDay.amount)})
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setChartMode('daily')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              chartMode === 'daily'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Daily Spend
          </button>
          <button
            onClick={() => setChartMode('cumulative')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              chartMode === 'cumulative'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Cumulative In-Month
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'daily' ? (
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tickFormatter={val => formatCompactINR(val)}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <ReferenceLine
                y={dailyAverage}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{
                  value: `Avg: ${formatCompactINR(dailyAverage)}`,
                  fill: '#d97706',
                  fontSize: 9,
                  position: 'right',
                }}
              />
              <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, index) => {
                  let fillColor = '#10b981'; // normal
                  if (entry.amount === peakDay.amount && entry.amount > 0) {
                    fillColor = '#ef4444'; // peak day red
                  } else if (entry.amount > dailyAverage) {
                    fillColor = '#f59e0b'; // above avg amber
                  } else if (entry.isWeekend) {
                    fillColor = '#6366f1'; // weekend purple
                  }
                  return <Cell key={`cell-${index}`} fill={fillColor} />;
                })}
              </Bar>
            </ComposedChart>
          ) : (
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tickFormatter={val => formatCompactINR(val)}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#059669' }}
                activeDot={{ r: 5, fill: '#10b981' }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend hints */}
      <div className="flex items-center justify-center space-x-3 text-[10px] text-slate-500 pt-1">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Normal</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>Weekend</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Above Avg</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Peak Day</span>
        </div>
      </div>
    </div>
  );
};
