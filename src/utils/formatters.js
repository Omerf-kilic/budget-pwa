/**
 * Currency formatting utilities for the Budget Tracker app.
 * Each currency uses its own locale and symbol — no conversion performed.
 */

// Currency metadata: symbol, locale, fraction digits
export const CURRENCY_META = {
  USD: { symbol: '$',   locale: 'en-US',  fractionDigits: 2 },
  EUR: { symbol: '€',   locale: 'de-DE',  fractionDigits: 2 },
  TL:  { symbol: '₺',   locale: 'tr-TR',  fractionDigits: 2 },
  RON: { symbol: 'lei', locale: 'ro-RO',  fractionDigits: 2 },
};

export const CURRENCIES = Object.keys(CURRENCY_META);

/**
 * Formats a numeric amount with the appropriate currency symbol.
 * Example: formatAmount(1234.5, 'RON') → '1.234,50 lei'
 *
 * @param {number} amount
 * @param {string} currency - One of USD | EUR | TL | RON
 * @returns {string}
 */
export function formatAmount(amount, currency) {
  const meta = CURRENCY_META[currency];
  if (!meta) return `${amount} ${currency}`;

  try {
    return new Intl.NumberFormat(meta.locale, {
      minimumFractionDigits: meta.fractionDigits,
      maximumFractionDigits: meta.fractionDigits,
    }).format(amount) + (currency === 'RON' ? ' lei' : '');
  } catch {
    return `${meta.symbol}${amount.toFixed(meta.fractionDigits)}`;
  }
}

/**
 * Formats a currency symbol prefix for display.
 * Used on the balance card.
 *
 * @param {string} currency
 * @returns {string}
 */
export function getCurrencySymbol(currency) {
  return CURRENCY_META[currency]?.symbol ?? currency;
}

/**
 * Formats a Unix timestamp into a human-readable date/time string.
 * Example: 1723913100000 → 'Aug 17, 19:45'
 *
 * @param {number} timestamp - Date.now() value
 * @returns {string}
 */
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day:   'numeric',
    hour:  '2-digit',
    minute:'2-digit',
    hour12: false,
  });
}

/**
 * Returns the start-of-day timestamp (00:00:00.000) for a given date.
 * Useful for filtering daily transactions.
 *
 * @param {Date} date
 * @returns {number}
 */
export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Returns the end-of-day timestamp (23:59:59.999) for a given date.
 *
 * @param {Date} date
 * @returns {number}
 */
export function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/**
 * Returns start/end timestamps for the current day, week, and month.
 * Used in the Reports page to filter transactions by period.
 *
 * @returns {{ daily: {start, end}, weekly: {start, end}, monthly: {start, end} }}
 */
export function getPeriodBounds() {
  const now = new Date();

  // Daily: today 00:00 → 23:59
  const dailyStart = startOfDay(now);
  const dailyEnd   = endOfDay(now);

  // Weekly: last 7 days
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  // Monthly: current month 1st → end of today
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  return {
    daily:   { start: dailyStart,          end: dailyEnd },
    weekly:  { start: weekStart.getTime(), end: dailyEnd },
    monthly: { start: monthStart.getTime(), end: dailyEnd },
  };
}

/**
 * Groups an array of transactions by currency and sums their amounts.
 * Returns only expense transactions.
 *
 * @param {Array} transactions
 * @param {number} startTime - start of period (timestamp)
 * @param {number} endTime   - end of period (timestamp)
 * @returns {Object} { USD: number, EUR: number, TL: number, RON: number }
 */
export function sumExpensesByCurrency(transactions, startTime, endTime) {
  const totals = { USD: 0, EUR: 0, TL: 0, RON: 0 };

  transactions.forEach((tx) => {
    if (
      tx.type === 'expense' &&
      tx.date >= startTime &&
      tx.date <= endTime
    ) {
      totals[tx.currency] = (totals[tx.currency] ?? 0) + tx.amount;
    }
  });

  return totals;
}
