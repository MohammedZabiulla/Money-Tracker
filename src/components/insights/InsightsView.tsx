import React, { useState } from 'react';
import { useMoney } from '../../context/MoneyContext';
import { formatINR, formatCompactINR } from '../../lib/currency';
import { IconHelper, Category3DIcon } from '../common/IconHelper';
import {
  TrendingUp,
  PieChart,
  BarChart2,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  Smartphone,
  Activity,
} from 'lucide-react';
import { SpendsPieChart } from './charts/SpendsPieChart';
import { CategoryBarChart } from './charts/CategoryBarChart';
import { DailySpendTrendChart } from './charts/DailySpendTrendChart';
import { CashflowComparisonChart } from './charts/CashflowComparisonChart';
import { PaymentChannelChart } from './charts/PaymentChannelChart';

export const InsightsView: React.FC = () => {
  const { summary, categorySpending, transactions, accounts, creditCards, paymentApps, activeMonth } = useMoney();
  const [viewTab, setViewTab] = useState<'spending' | 'cashflow' | 'networth'>('spending');
  const [chartVisualType, setChartVisualType] = useState<'pie' | 'bar' | 'trend' | 'channel'>('pie');

  // Compute daily average spend for the active month (assume 30 days)
  const dailyAverage = summary.monthlyExpenses / 30;

  // Find top merchant
  const merchantTotals: { [name: string]: number } = {};
  transactions
    .filter(t => !t.isDeleted && t.type === 'EXPENSE' && t.date.startsWith(activeMonth))
    .forEach(t => {
      const name = t.merchantName || t.categoryName || 'Other';
      merchantTotals[name] = (merchantTotals[name] || 0) + t.amount;
    });

  const topMerchants = Object.entries(merchantTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-5 pb-24 max-w-3xl mx-auto">
      {/* Top View Selector */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setViewTab('spending')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            viewTab === 'spending'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PieChart size={14} className={viewTab === 'spending' ? 'text-emerald-500' : ''} />
          <span>Spend Visualizer</span>
        </button>
        <button
          onClick={() => setViewTab('cashflow')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            viewTab === 'cashflow'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart2 size={14} className={viewTab === 'cashflow' ? 'text-cyan-500' : ''} />
          <span>Income vs Expense</span>
        </button>
        <button
          onClick={() => setViewTab('networth')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            viewTab === 'networth'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp size={14} className={viewTab === 'networth' ? 'text-indigo-500' : ''} />
          <span>Net Worth Equation</span>
        </button>
      </div>

      {/* Key Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Total Spent</span>
          <span className="text-base sm:text-lg font-extrabold text-rose-600 dark:text-rose-400 block mt-0.5">
            {formatINR(summary.monthlyExpenses)}
          </span>
          <span className="text-[10px] text-slate-400">{activeMonth}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Daily Average</span>
          <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white block mt-0.5">
            {formatINR(dailyAverage)}
          </span>
          <span className="text-[10px] text-slate-400">Avg spend / day</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Total Earned</span>
          <span className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
            {formatINR(summary.monthlyIncome)}
          </span>
          <span className="text-[10px] text-slate-400">Inflows</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Savings Rate</span>
          <span className="text-base sm:text-lg font-extrabold text-teal-600 dark:text-teal-400 block mt-0.5">
            {summary.savingsRatePercent.toFixed(0)}%
          </span>
          <span className="text-[10px] text-slate-400">{formatINR(summary.monthlySavings)}</span>
        </div>
      </div>

      {/* View 1: Spend Visualizer (Pie, Bar, Trend, Channels) */}
      {viewTab === 'spending' && (
        <div className="space-y-4">
          {/* Main Visual Chart Card with Mode Switcher */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <Activity size={16} className="text-emerald-500" />
                  <span>Spend Visualization Engine</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Interactive graphs & distributions for {activeMonth}
                </p>
              </div>

              {/* Chart Visual Type Switcher */}
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-750 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700 shrink-0 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setChartVisualType('pie')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                    chartVisualType === 'pie'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <PieChart size={13} className={chartVisualType === 'pie' ? 'text-emerald-500' : ''} />
                  <span>Pie / Donut</span>
                </button>

                <button
                  onClick={() => setChartVisualType('bar')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                    chartVisualType === 'bar'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BarChart2 size={13} className={chartVisualType === 'bar' ? 'text-blue-500' : ''} />
                  <span>Bar Graph</span>
                </button>

                <button
                  onClick={() => setChartVisualType('trend')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                    chartVisualType === 'trend'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Calendar size={13} className={chartVisualType === 'trend' ? 'text-amber-500' : ''} />
                  <span>Daily Trend</span>
                </button>

                <button
                  onClick={() => setChartVisualType('channel')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                    chartVisualType === 'channel'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Smartphone size={13} className={chartVisualType === 'channel' ? 'text-purple-500' : ''} />
                  <span>Channels</span>
                </button>
              </div>
            </div>

            {/* Selected Visual Component */}
            <div className="pt-1">
              {chartVisualType === 'pie' && (
                <SpendsPieChart
                  categorySpending={categorySpending}
                  totalExpenses={summary.monthlyExpenses}
                  activeMonth={activeMonth}
                />
              )}

              {chartVisualType === 'bar' && (
                <CategoryBarChart
                  categorySpending={categorySpending}
                  activeMonth={activeMonth}
                />
              )}

              {chartVisualType === 'trend' && (
                <DailySpendTrendChart
                  transactions={transactions}
                  activeMonth={activeMonth}
                  totalExpenses={summary.monthlyExpenses}
                />
              )}

              {chartVisualType === 'channel' && (
                <PaymentChannelChart
                  transactions={transactions}
                  accounts={accounts}
                  creditCards={creditCards}
                  paymentApps={paymentApps}
                  activeMonth={activeMonth}
                />
              )}
            </div>
          </div>

          {/* Visual Category Breakdown List */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Detailed Category Breakdown
              </h3>
              <span className="text-xs text-slate-400">
                {categorySpending.length} categories active
              </span>
            </div>

            {categorySpending.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No expenses logged for {activeMonth}</p>
            ) : (
              <div className="space-y-3">
                {categorySpending.map((cat, idx) => (
                  <div key={`ins_cat_${cat.categoryId || 'cat'}_${idx}`} className="space-y-1.5 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5">
                        <Category3DIcon
                          name={cat.icon}
                          categoryName={cat.categoryName}
                          color={cat.color}
                          size="sm"
                          glow={true}
                        />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                            {cat.categoryName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {cat.transactionCount} transaction{cat.transactionCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-slate-900 dark:text-white block">
                          {formatINR(cat.totalAmount)}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, cat.percentage)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Merchants List */}
          {topMerchants.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <ShoppingBag size={16} className="text-emerald-500" />
                <span>Top Spends by Merchant</span>
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {topMerchants.map(([name, amount], idx) => (
                  <div key={`top_m_${name || 'm'}_${idx}`} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {idx + 1}. {name}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatINR(amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 2: Cashflow (Income vs Expense) */}
      {viewTab === 'cashflow' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <BarChart2 size={16} className="text-cyan-500" />
              <span>Monthly Inflow vs Outflow Comparison</span>
            </h3>

            {/* Visual Bar Comparison Chart */}
            <CashflowComparisonChart summary={summary} activeMonth={activeMonth} />

            {/* Progress Bars Breakdown */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                    <ArrowDownLeft size={14} className="mr-1" /> Total Income (Inflows)
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatINR(summary.monthlyIncome)}</span>
                </div>
                <div className="w-full h-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-600 dark:text-rose-400 flex items-center">
                    <ArrowUpRight size={14} className="mr-1" /> Total Expenses (Outflows)
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">{formatINR(summary.monthlyExpenses)}</span>
                </div>
                <div className="w-full h-3 bg-rose-50 dark:bg-rose-950/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{
                      width: `${summary.monthlyIncome > 0 ? Math.min(100, (summary.monthlyExpenses / summary.monthlyIncome) * 100) : 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-teal-600 dark:text-teal-400 flex items-center">
                    <Sparkles size={14} className="mr-1" /> Net Savings Retained
                  </span>
                  <span className="text-teal-600 dark:text-teal-400 font-bold">
                    {formatINR(summary.monthlySavings)} ({summary.savingsRatePercent.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-teal-50 dark:bg-teal-950/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, summary.savingsRatePercent))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 3: Net Worth Breakdown */}
      {viewTab === 'networth' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <TrendingUp size={16} className="text-indigo-500" />
              <span>Net Worth Equation</span>
            </h3>
            
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700/60 text-center">
              <span className="text-xs text-slate-500 block font-medium">Total Net Worth</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">
                {formatINR(summary.netWorth)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                  Total Assets
                </span>
                <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 block mt-1">
                  {formatINR(summary.totalAssets)}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-1">
                  Banks, Wallets, Cash, FDs, Investments & Lent Money
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">
                  Total Liabilities
                </span>
                <span className="text-xl font-extrabold text-rose-700 dark:text-rose-400 block mt-1">
                  {formatINR(summary.totalLiabilities)}
                </span>
                <span className="text-[11px] text-rose-600 dark:text-rose-400 block mt-1">
                  Credit Card Outstanding, Active Loans & Borrowed Money
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
