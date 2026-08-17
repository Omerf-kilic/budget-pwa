import { useState, useId } from 'react';
import { useApp } from '../context/AppContext';
import { formatAmount, getCurrencySymbol, CURRENCIES, CURRENCY_META } from '../utils/formatters';

/**
 * BalanceSettings — Two sections:
 *   1. Add Balance: For each currency, show current balance and an input to add funds.
 *   2. Main Currency: Radio button selector for mainDisplayCurrency.
 *
 * @param {object} props
 * @param {function} props.showToast - Callback(message, type) to display a toast
 */
export default function BalanceSettings({ showToast }) {
  const { balances, settings, addBalance, setMainCurrency } = useApp();

  // Separate amount state per currency
  const [amounts, setAmounts] = useState({ USD: '', EUR: '', TL: '', RON: '' });
  const [descriptions, setDescriptions] = useState({ USD: '', EUR: '', TL: '', RON: '' });
  const [loadingCurrency, setLoadingCurrency] = useState(null);

  const formBaseId = useId();

  /**
   * Handles the "Add" button for a specific currency.
   */
  const handleAddBalance = (currency) => {
    const numericAmount = parseFloat(amounts[currency]);
    if (!numericAmount || numericAmount <= 0) {
      showToast(`Enter a valid amount for ${currency}.`, 'error');
      return;
    }

    setLoadingCurrency(currency);
    const description = descriptions[currency].trim() || 'Balance Added';
    const success = addBalance(numericAmount, currency, description);

    if (success) {
      showToast(`+${getCurrencySymbol(currency)}${numericAmount.toFixed(2)} added to ${currency}`, 'success');
      setAmounts((prev) => ({ ...prev, [currency]: '' }));
      setDescriptions((prev) => ({ ...prev, [currency]: '' }));
    } else {
      showToast('Failed to add balance.', 'error');
    }

    setTimeout(() => setLoadingCurrency(null), 300);
  };

  /**
   * Handles amount input change for a given currency.
   */
  const handleAmountChange = (currency, value) => {
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setAmounts((prev) => ({ ...prev, [currency]: value }));
    }
  };

  // Currency display colors for visual distinction
  const currencyColors = {
    USD: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    EUR: { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/20'    },
    TL:  { bg: 'bg-orange-500/15',  text: 'text-orange-400',  border: 'border-orange-500/20'  },
    RON: { bg: 'bg-purple-500/15',  text: 'text-purple-400',  border: 'border-purple-500/20'  },
  };

  return (
    <div className="scroll-area no-scrollbar h-full px-4 py-4 page-enter space-y-6">

      {/* ══════════════════════════════════════════
          Section 1: Add Balance per Currency
      ══════════════════════════════════════════ */}
      <section aria-labelledby="add-balance-heading">
        <h2 id="add-balance-heading" className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Add Balance
        </h2>

        <div className="space-y-3">
          {CURRENCIES.map((currency) => {
            const colors = currencyColors[currency];
            const currentBalance = balances[currency] ?? 0;
            const isNegative = currentBalance < 0;
            const isLoading = loadingCurrency === currency;

            return (
              <div
                key={currency}
                id={`balance-card-${currency}`}
                className="glass-card rounded-2xl p-4 space-y-3"
              >
                {/* Currency header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <span className={`text-xs font-bold ${colors.text}`}>
                        {CURRENCY_META[currency].symbol}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{currency}</p>
                      <p className="text-[10px] text-slate-500">
                        {currency === 'USD' && 'US Dollar'}
                        {currency === 'EUR' && 'Euro'}
                        {currency === 'TL'  && 'Turkish Lira'}
                        {currency === 'RON' && 'Romanian Leu'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500">Current</p>
                    <p className={`text-sm font-bold ${isNegative ? 'text-red-400' : 'text-white'}`}>
                      {formatAmount(currentBalance, currency)}
                    </p>
                  </div>
                </div>

                {/* Input row */}
                <div className="flex gap-2">
                  <input
                    id={`${formBaseId}-amount-${currency}`}
                    type="number"
                    inputMode="decimal"
                    placeholder="Amount to add"
                    value={amounts[currency]}
                    onChange={(e) => handleAmountChange(currency, e.target.value)}
                    className="
                      flex-1 bg-slate-800/70 text-white text-sm
                      border border-white/8 rounded-xl px-3 py-2.5
                      placeholder:text-slate-600 focus:outline-none
                      focus:ring-2 focus:ring-green-500/30
                    "
                    aria-label={`Amount to add to ${currency}`}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddBalance(currency); }}
                  />
                  <button
                    id={`add-balance-btn-${currency}`}
                    onClick={() => handleAddBalance(currency)}
                    disabled={isLoading}
                    className={`
                      shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold text-white
                      bg-green-600 hover:bg-green-500 active:bg-green-700
                      transition-all duration-150 btn-press disabled:opacity-60
                    `}
                    aria-label={`Add balance to ${currency}`}
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      '+ Add'
                    )}
                  </button>
                </div>

                {/* Optional description */}
                <input
                  id={`${formBaseId}-desc-${currency}`}
                  type="text"
                  placeholder="Note (optional)"
                  value={descriptions[currency]}
                  onChange={(e) =>
                    setDescriptions((prev) => ({ ...prev, [currency]: e.target.value }))
                  }
                  maxLength={60}
                  className="
                    w-full bg-slate-800/40 text-white text-sm
                    border border-white/5 rounded-xl px-3 py-2
                    placeholder:text-slate-700 focus:outline-none
                    focus:ring-1 focus:ring-green-500/20
                  "
                  aria-label={`Note for ${currency} balance addition`}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          Section 2: Main Display Currency Setting
      ══════════════════════════════════════════ */}
      <section aria-labelledby="main-currency-heading">
        <h2 id="main-currency-heading" className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Main Display Currency
        </h2>
        <p className="text-xs text-slate-600 mb-3">
          This currency's balance is shown on the Dashboard card.
        </p>

        <div
          className="glass-card rounded-2xl p-2 space-y-1"
          role="radiogroup"
          aria-labelledby="main-currency-heading"
        >
          {CURRENCIES.map((currency) => {
            const isSelected = settings.mainDisplayCurrency === currency;
            const colors = currencyColors[currency];

            return (
              <button
                key={currency}
                id={`main-currency-${currency}`}
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setMainCurrency(currency);
                  showToast(`Main currency set to ${currency}`, 'info');
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                  transition-all duration-150 btn-press
                  ${isSelected
                    ? 'bg-green-600/15 border border-green-600/25'
                    : 'border border-transparent hover:bg-white/3'
                  }
                `}
              >
                {/* Radio indicator */}
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    transition-all duration-150
                    ${isSelected ? 'border-green-500 bg-green-500' : 'border-slate-600'}
                  `}
                  aria-hidden="true"
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>

                {/* Currency label */}
                <div className="flex items-center gap-2.5 flex-1">
                  <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center`}>
                    <span className={`text-[10px] font-bold ${colors.text}`}>
                      {CURRENCY_META[currency].symbol}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                      {currency}
                    </p>
                  </div>
                </div>

                {/* Current balance preview */}
                <p className="text-xs text-slate-500 font-medium">
                  {formatAmount(balances[currency] ?? 0, currency)}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Bottom padding for safe area */}
      <div className="h-4" />
    </div>
  );
}
