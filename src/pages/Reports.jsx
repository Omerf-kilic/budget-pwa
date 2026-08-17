import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import {
  formatAmount,
  getPeriodBounds,
  sumExpensesByCurrency,
  CURRENCIES,
} from '../utils/formatters';

/**
 * Reports — Expense totals grouped by currency for Daily, Weekly, Monthly periods.
 * All labels driven by the active language.
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

  const bounds = getPeriodBounds();
  const { start, end } = bounds[activePeriod];
  const totals = sumExpensesByCurrency(transactions, start, end);

  const activeCurrencies = CURRENCIES.filter((c) => totals[c] > 0);

  const txCountInPeriod = transactions.filter(
    (tx) => tx.type === 'expense' && tx.date >= start && tx.date <= end
  ).length;

  const txCountLabel = `${txCountInPeriod} ${
    txCountInPeriod === 1 ? t.reports.txSingular : t.reports.txPlural
  }`;

  return (
    <div className="scroll-area no-scrollbar h-full px-4 py-4 page-enter">

      {/* Period tabs */}
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

      {/* Summary header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300">{t.reports.sectionTitle}</h2>
        <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">
          {txCountLabel}
        </span>
      </div>

      {/* Empty state */}
      {activeCurrencies.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 mt-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">{t.reports.emptyTitle}</p>
            <p className="text-slate-600 text-xs mt-1">{t.reports.emptySubtitle}</p>
          </div>
        </div>
      )}

      {/* Currency breakdown cards */}
      {activeCurrencies.length > 0 && (
        <div className="space-y-3" role="list">
          {activeCurrencies.map((currency) => {
            const total = totals[currency];
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
                aria-label={`${currency}: ${formatAmount(total, currency)}`}
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

      {/* Multi-currency grid summary */}
      {activeCurrencies.length > 1 && (
        <div className="mt-4 glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-500 font-semibold mb-3 uppercase tracking-wider">
            {t.reports.byCurrency}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CURRENCIES.map((c) => {
              const val = totals[c];
              if (val === 0) return null;
              return (
                <div key={c} className="bg-slate-800/60 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-slate-500 uppercase">{c}</p>
                  <p className="text-sm font-bold text-red-400">-{formatAmount(val, c)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
