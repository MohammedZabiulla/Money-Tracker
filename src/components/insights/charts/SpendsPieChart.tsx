import React, { useState } from 'react';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import { CategorySpending } from '../../../lib/accountingEngine';
import { formatINR } from '../../../lib/currency';
import { Category3DIcon } from '../../common/IconHelper';

interface SpendsPieChartProps {
  categorySpending: CategorySpending[];
  totalExpenses: number;
  activeMonth: string;
}

const DEFAULT_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6',
  '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#e11d48',
  '#84cc16', '#a855f7', '#0ea5e9', '#d97706', '#64748b',
];

export const SpendsPieChart: React.FC<SpendsPieChartProps> = ({
  categorySpending,
  totalExpenses,
  activeMonth,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Prepare chart data
  const data = categorySpending
    .filter(c => c.totalAmount > 0)
    .map((c, index) => ({
      name: c.categoryName,
      value: c.totalAmount,
      percentage: c.percentage,
      count: c.transactionCount,
      color: c.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      icon: c.icon,
      categoryId: c.categoryId,
    }));

  if (data.length === 0 || totalExpenses === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
          📊
        </div>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Spends Recorded</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Add expense transactions in {activeMonth} to view the pie breakdown.</p>
      </div>
    );
  }

  const selectedItem = activeIndex !== null && data[activeIndex] ? data[activeIndex] : null;

  // Custom active shape for pie hover
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' }}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 8}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    );
  };

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
            <span className="font-extrabold text-sm text-white">{formatINR(item.value)}</span>
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
      {/* Chart container */}
      <div className="relative h-64 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPie>
            <Pie
              activeIndex={activeIndex !== null ? activeIndex : undefined}
              activeShape={renderActiveShape}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={96}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={(_, index) => setActiveIndex(activeIndex === index ? null : index)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={1.5}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </RechartsPie>
        </ResponsiveContainer>

        {/* Center Summary inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {selectedItem ? (
            <div className="animate-in fade-in zoom-in-90 duration-150">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block truncate max-w-[120px]">
                {selectedItem.name}
              </span>
              <span className="text-base font-black text-slate-900 dark:text-white block mt-0.5">
                {formatINR(selectedItem.value)}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                {selectedItem.percentage.toFixed(1)}% ({selectedItem.count} txns)
              </span>
            </div>
          ) : (
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Total Expenses
              </span>
              <span className="text-base font-black text-rose-600 dark:text-rose-400 block mt-0.5">
                {formatINR(totalExpenses)}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {data.length} Categories
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Legend Pill Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        {data.map((item, index) => {
          const isSelected = activeIndex === index;
          return (
            <button
              key={item.categoryId || index}
              onClick={() => setActiveIndex(isSelected ? null : index)}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`p-2.5 rounded-2xl text-left border transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-slate-100 dark:bg-slate-700/80 border-slate-300 dark:border-slate-500 shadow-sm scale-[1.02]'
                  : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100/80 dark:hover:bg-slate-750'
              }`}
            >
              <div className="flex items-center space-x-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white shrink-0 ml-1">
                {formatINR(item.value)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
