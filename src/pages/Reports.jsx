import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import {
  formatAmount,
  getCurrencySymbol,
  getPeriodBounds,
  sumExpensesByCurrency,
  categorizeExpenses,
  CURRENCY_META,
  CURRENCIES,
  CATEGORIES,
  CATEGORY_COLORS,
} from '../utils/formatters';
import DonutChart from '../components/ui/DonutChart';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats a currency amount compactly for the donut chart center hole.
 * Avoids locale thousands separators to keep the string short.
 *
 * Examples: formatCenter(380.50, 'EUR') → "€380.50"
 *           formatCenter(3000,   'RON') → "3000 lei"
 *           formatCenter(15000,  'TL')  → "₺15K"
 */
function formatCenter(amount, currency) {
  const { symbol } = CURRENCY_META[currency] ?? { symbol: currency };

  let numStr;
  if (amount >= 10000)     numStr = `${Math.round(amount / 1000)}K`;
  else if (amount >= 1000) numStr = `${Math.round(amount)}`;
  else                     numStr = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);

  // RON symbol ("lei") comes after the number
  return currency === 'RON' ? `${numStr} lei` : `${symbol}${numStr}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Reports — Expense breakdown for Today / This Week / This Month.
 *
 * Carousel:
 *   - One DonutChart per currency that has expense data in the selected period.
 *   - CSS scroll-snap for native-feeling swipe on iOS.
 *   - Pagination dots click/tap to jump to a specific slide.
 *
 * Category list:
 *   - Reacts to the active carousel slide.
 *   - Shows only amounts in the active currency.
 *   - Percentages are within that currency's total (accurate, no mixing).
 *
 * Chart center:
 *   - Shows the total expense amount for that currency (e.g. "€380.50").
 */
export default function Reports() {
  const { transactions } = useApp();
  const { t } = useTranslation();

  const [activePeriod,        setActivePeriod]        = useState('daily');
  const [activeCurrencyIndex, setActiveCurrencyIndex] = useState(0);

  const carouselRef   = useRef(null);
  const isScrollingRef = useRef(false); // prevent echo state updates

  const PERIOD_TABS = [
    { key: 'daily',   label: t.reports.tabToday },
    { key: 'weekly',  label: t.reports.tabWeek  },
    { key: 'monthly', label: t.reports.tabMonth },
  ];

  // ── Data ────────────────────────────────────────────────────────────────────

  const bounds        = getPeriodBounds();
  const { start, end } = bounds[activePeriod];

  const currencyTotals = sumExpensesByCurrency(transactions, start, end);
  const categoryData   = categorizeExpenses(transactions, start, end);

  // Currencies that actually have expenses in this period
  const activeCurrencies = CURRENCIES.filter((c) => (currencyTotals[c] ?? 0) > 0);

  const totalTxCount = CATEGORIES.reduce(
    (sum, { key }) => sum + (categoryData[key]?.count ?? 0),
    0
  );

  const hasData = activeCurrencies.length > 0;

  // ── Reset carousel when period changes ──────────────────────────────────────
  useEffect(() => {
    setActiveCurrencyIndex(0);
    // scrollLeft = 0 is instant and works everywhere (incl. iOS Safari)
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = 0;
    }
  }, [activePeriod]);

  // ── Carousel scroll handler ──────────────────────────────────────────────────
  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const newIndex = Math.round(el.scrollLeft / el.clientWidth);
    if (newIndex !== activeCurrencyIndex) {
      setActiveCurrencyIndex(newIndex);
    }
  }, [activeCurrencyIndex]);

  // Programmatic slide navigation (dot tap)
  const scrollToSlide = useCallback((index) => {
    const el = carouselRef.current;
    if (!el) return;
    isScrollingRef.current = true;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
    setActiveCurrencyIndex(index);
    setTimeout(() => { isScrollingRef.current = false; }, 400);
  }, []);

  // ── Per-currency chart segments ──────────────────────────────────────────────

  const getSegments = useCallback(
    (currency) => {
      const currTotal = currencyTotals[currency] ?? 0;
      return CATEGORIES
        .filter(({ key }) => (categoryData[key]?.amounts?.[currency] ?? 0) > 0)
        .map(({ key, emoji }) => {
          const amt = categoryData[key].amounts[currency];
          return {
            key,
            label:       t.categories[key],
            emoji,
            color:       CATEGORY_COLORS[key],
            count:       categoryData[key].count,
            amountTotal: amt,
            // ✅ Percentage is within this currency's total only — no mixing
            percentage: currTotal > 0 ? (amt / currTotal) * 100 : 0,
          };
        })
        // Sort by amount descending so largest slice appears first in legend
        .sort((a, b) => b.amountTotal - a.amountTotal);
    },
    [currencyTotals, categoryData, t.categories]
  );

  // The category list always reflects the active carousel slide
  const activeCurrency = activeCurrencies[activeCurrencyIndex] ?? null;
  const activeSegments = activeCurrency ? getSegments(activeCurrency) : [];

  const txCountLabel = `${totalTxCount} ${
    totalTxCount === 1 ? t.reports.txSingular : t.reports.txPlural
  }`;

  return (
    <div className="scroll-area no-scrollbar h-full px-4 py-4 page-enter">

      {/* ── Period Tabs ─────────────────────────────────────────────────────── */}
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

      {/* ── Summary header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300">{t.reports.sectionTitle}</h2>
        <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">
          {txCountLabel}
        </span>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
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

      {/* ── Main content ────────────────────────────────────────────────────── */}
      {hasData && (
        <div className="space-y-4">

          {/* ════════════════════════════════════════
              Carousel Card — one slide per currency
          ════════════════════════════════════════ */}
          <div className="glass-card rounded-2xl overflow-hidden">

            {/* Swipeable track — CSS scroll-snap */}
            <div
              ref={carouselRef}
              className="no-scrollbar flex"
              style={{
                overflowX:              'auto',
                scrollSnapType:         'x mandatory',
                WebkitOverflowScrolling: 'touch',    // momentum scrolling on iOS
              }}
              onScroll={handleCarouselScroll}
              role="region"
              aria-label="Currency expense charts"
            >
              {activeCurrencies.map((currency) => {
                const segments   = getSegments(currency);
                const total      = currencyTotals[currency];
                const centerLine1 = formatCenter(total, currency);
                const centerLine2 = t.reports.totalLabel ?? 'Total';

                return (
                  <div
                    key={currency}
                    style={{ scrollSnapAlign: 'start', flex: '0 0 100%' }}
                    className="p-4"
                    aria-label={`${currency} expense breakdown`}
                  >
                    {/* Currency title row */}
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {t.reports.byCategory}
                      </p>
                      <span className="text-[10px] font-bold text-slate-300 bg-slate-700/60 px-2 py-0.5 rounded-full">
                        {currency}
                      </span>
                    </div>

                    {/* Two-column layout: donut (left) + legend (right) */}
                    <div className="flex gap-3 items-center">
                      <div className="w-[115px] shrink-0">
                        <DonutChart
                          segments={segments}
                          centerLine1={centerLine1}
                          centerLine2={centerLine2}
                        />
                      </div>

                      {/* Legend */}
                      <ul className="flex-1 space-y-1.5 min-w-0 overflow-hidden">
                        {segments.slice(0, 7).map((seg) => (
                          <li key={seg.key} className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: seg.color }}
                            />
                            <span className="text-[11px] text-slate-400 truncate flex-1 min-w-0">
                              {seg.emoji} {seg.label}
                            </span>
                            <span className="text-[11px] font-bold text-white shrink-0">
                              {seg.percentage.toFixed(1)}%
                            </span>
                          </li>
                        ))}
                        {segments.length > 7 && (
                          <li className="text-[10px] text-slate-600 pl-3.5">
                            +{segments.length - 7} more…
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination dots ──────────────────────────────────────── */}
            {activeCurrencies.length > 1 && (
              <div
                className="flex justify-center items-center gap-2 pb-3"
                role="tablist"
                aria-label="Currency chart selector"
              >
                {activeCurrencies.map((currency, i) => (
                  <button
                    key={currency}
                    id={`chart-dot-${currency}`}
                    role="tab"
                    aria-selected={i === activeCurrencyIndex}
                    aria-label={`Show ${currency} chart`}
                    onClick={() => scrollToSlide(i)}
                    className="btn-press transition-all duration-300"
                    style={{
                      height: '6px',
                      width:  i === activeCurrencyIndex ? '20px' : '6px',
                      borderRadius: '3px',
                      background: i === activeCurrencyIndex
                        ? 'rgba(255,255,255,0.85)'
                        : 'rgba(255,255,255,0.2)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════
              Category Detail List
              Reacts to active carousel slide
          ════════════════════════════════════════ */}
          {activeSegments.length > 0 && (
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t.reports.byCategory}
                </p>
                {/* Active currency badge — updates instantly on swipe */}
                <span className="text-[10px] font-bold text-slate-300 bg-slate-700/60 px-2 py-0.5 rounded-full">
                  {activeCurrency}
                </span>
              </div>

              <ul className="space-y-3" role="list">
                {activeSegments.map((seg) => {
                  const count = categoryData[seg.key]?.count ?? 0;
                  return (
                    <li key={seg.key} className="flex items-start gap-3">
                      {/* Category emoji icon */}
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base"
                        style={{
                          backgroundColor: `${seg.color}20`,
                          border: `1px solid ${seg.color}40`,
                        }}
                        aria-hidden="true"
                      >
                        {seg.emoji}
                      </div>

                      {/* Name + amount + progress bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs font-semibold text-white">{seg.label}</p>
                          <p className="text-[10px] text-slate-500 shrink-0 ml-2">
                            {count} {count === 1 ? t.reports.txSingular : t.reports.txPlural}
                          </p>
                        </div>
                        <p className="text-xs font-medium text-red-400">
                          -{formatAmount(seg.amountTotal, activeCurrency)}
                        </p>
                        {/* Progress bar width = amount-based percentage within this currency */}
                        <div className="mt-1.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width:           `${Math.min(seg.percentage, 100)}%`,
                              backgroundColor: seg.color,
                            }}
                          />
                        </div>
                      </div>

                      {/* Percentage badge */}
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold text-white">
                          {seg.percentage.toFixed(1)}%
                        </p>
                        <p className="text-[9px] text-slate-600">{t.reports.ofTotal}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* ════════════════════════════════════════
              By-Currency Total Cards (existing)
          ════════════════════════════════════════ */}
          <div className="space-y-3">
            {activeCurrencies.map((currency) => {
              const total = currencyTotals[currency];
              const txCount = transactions.filter(
                (tx) =>
                  !tx.isDeleted &&
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

        </div>
      )}
    </div>
  );
}
