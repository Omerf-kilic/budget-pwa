import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import {
  formatAmount,
  getPeriodBounds,
  sumExpensesByCurrency,
  categorizeExpenses,
  CURRENCIES,
  CATEGORIES,
  CATEGORY_COLORS,
} from '../utils/formatters';
import DonutChart from '../components/ui/DonutChart';

/**
 * Reports — Expense breakdown for Today / This Week / This Month.
 *
 * Layout:
 *   1. Period tabs
 *   2. Donut chart (category share by transaction count — currency-agnostic)
 *   3. Category list (per-category amounts per currency + percentage of transactions)
 *   4. By-currency totals (existing per-currency sum cards)
 */
export default function Reports() {
  const { transactions } = useApp();
  const { t } = useTranslation();

  const [activePeriod, setActivePeriod] = useState('daily');

  const PERIOD_TABS = [
    { key: 'daily',   label: t.reports.tabToday },
    { key: 'weekly',  label: t.reports.tabWeek  },
    { key: 'monthly', label: t.reports.tabMonth },
  ];

  // ── Data ──────────────────────────────────────────────────────────────────

  const bounds = getPeriodBounds();
  const { start, end } = bounds[activePeriod];

  // Currency totals (for the existing By Currency cards)
  const currencyTotals = sumExpensesByCurrency(transactions, start, end);

  // Category data (for donut chart + category list)
  const categoryData = categorizeExpenses(transactions, start, end);

  // Total transaction count in the period (for percentage calculation)
  const totalTxCount = CATEGORIES.reduce(
    (sum, { key }) => sum + (categoryData[key]?.count ?? 0),
    0
  );

  // Total expense amount across all currencies (for "x% of total" label)
  const totalExpenseAllCurrencies = CURRENCIES.reduce(
    (sum, c) => sum + (currencyTotals[c] ?? 0),
    0
  );

  // Build the segment array for the donut chart (only active categories)
  const chartSegments = CATEGORIES
    .filter(({ key }) => (categoryData[key]?.count ?? 0) > 0)
    .map(({ key, emoji }) => ({
      key,
      label:      t.categories[key],
      emoji,
      color:      CATEGORY_COLORS[key],
      count:      categoryData[key].count,
      percentage: totalTxCount > 0
        ? (categoryData[key].count / totalTxCount) * 100
        : 0,
    }));

  // Active currencies with non-zero totals (for By Currency section)
  const activeCurrencies = CURRENCIES.filter((c) => currencyTotals[c] > 0);

  const txCountLabel = `${totalTxCount} ${
    totalTxCount === 1 ? t.reports.txSingular : t.reports.txPlural
  }`;

  const hasData = totalTxCount > 0;

  return (
    <div className="scroll-area no-scrollbar h-full px-4 py-4 page-enter">

      {/* ── Period Tabs ───────────────────────────────────────────────────── */}
      <div
        className="flex gap-1.5 p-1 rounded-2xl mb-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        role="tablist"
        aria-label={t.reports.periodAriaLabel}
      >
        {PERIOD_TABS.map((tab) => (
          <button
            key={tab.key}
            id={`report-tab-${tab.key}`}
            role="tab"
            aria-selected={activePeriod === tab.key}
            onClick={() => setActivePeriod(tab.key)}
            className={`
              flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 btn-press
              ${activePeriod === tab.key ? 'tab-active' : 'tab-inactive'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Summary row ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300">{t.reports.sectionTitle}</h2>
        <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">
          {txCountLabel}
        </span>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!hasData && (
        <div className="flex flex-col items-center justify-center gap-4 mt-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">{t.reports.noDataTitle}</p>
            <p className="text-slate-600 text-xs mt-1">{t.reports.noDataSubtitle}</p>
          </div>
        </div>
      )}

      {/* ── Donut Chart + Category breakdown ─────────────────────────────── */}
      {hasData && (
        <div className="space-y-4">

          {/* Donut chart section */}
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t.reports.byCategory}
              </p>
              <p className="text-[10px] text-slate-600">{t.reports.chartNote}</p>
            </div>

            {/* Two-column layout: chart left, legend right */}
            <div className="flex gap-4 items-center">
              {/* SVG donut */}
              <div className="w-[120px] shrink-0">
                <DonutChart
                  segments={chartSegments}
                  total={totalTxCount}
                  label={t.reports.txPlural}
                />
              </div>

              {/* Legend list */}
              <ul className="flex-1 space-y-1.5 min-w-0">
                {chartSegments.map((seg) => (
                  <li key={seg.key} className="flex items-center gap-2 min-w-0">
                    {/* Color dot */}
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    {/* Emoji + label */}
                    <span className="text-xs text-slate-400 truncate flex-1 min-w-0">
                      {seg.emoji} {seg.label}
                    </span>
                    {/* Percentage */}
                    <span className="text-xs font-semibold text-white shrink-0">
                      {seg.percentage.toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Category detail list (amounts per currency) ─────────────── */}
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {t.reports.byCategory}
            </p>

            <ul className="space-y-3" role="list">
              {chartSegments.map((seg) => {
                const catAmounts = categoryData[seg.key]?.amounts ?? {};
                // Only show currencies that have a non-zero amount
                const activeCatCurrencies = CURRENCIES.filter(
                  (c) => (catAmounts[c] ?? 0) > 0
                );
                const pct = seg.percentage.toFixed(1);

                return (
                  <li key={seg.key} className="flex items-start gap-3">
                    {/* Color bar + emoji */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base"
                      style={{ backgroundColor: `${seg.color}20`, border: `1px solid ${seg.color}40` }}
                    >
                      {seg.emoji}
                    </div>

                    {/* Label + amounts */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-white">{seg.label}</p>
                        <p className="text-[10px] text-slate-500">
                          {seg.count} {seg.count === 1 ? t.reports.txSingular : t.reports.txPlural}
                        </p>
                      </div>

                      {/* Per-currency amounts */}
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {activeCatCurrencies.map((c) => (
                          <span
                            key={c}
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-400"
                          >
                            -{formatAmount(catAmounts[c], c)}
                          </span>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-1.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(seg.percentage, 100)}%`,
                            backgroundColor: seg.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Percentage badge */}
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold text-white">{pct}%</p>
                      <p className="text-[9px] text-slate-600">{t.reports.ofTotal}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── By Currency cards (existing) ────────────────────────────── */}
          {activeCurrencies.length > 0 && (
            <div className="space-y-3">
              {activeCurrencies.map((currency) => {
                const total = currencyTotals[currency];
                const txCount = transactions.filter(
                  (tx) =>
                    tx.type === 'expense' &&
                    tx.currency === currency &&
                    tx.date >= start &&
                    tx.date <= end
                ).length;

                return (
                  <div
                    key={currency}
                    id={`report-card-${currency}`}
                    className="glass-card rounded-2xl px-5 py-4 flex items-center gap-4"
                    role="listitem"
                  >
                    <div className="w-11 h-11 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-red-400">{currency}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-medium">{t.reports.totalSpent}</p>
                      <p className="text-lg font-bold text-red-400 leading-tight mt-0.5">
                        -{formatAmount(total, currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-600 font-medium">{t.reports.avgPerTx}</p>
                      <p className="text-sm font-semibold text-slate-400">
                        {formatAmount(total / Math.max(txCount, 1), currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
