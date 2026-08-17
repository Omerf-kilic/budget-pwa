import { useState, useRef, useId } from 'react';
import { useApp } from '../context/AppContext';
import {
  formatAmount,
  getCurrencySymbol,
  CURRENCIES,
  normalizeAmount,
  isValidDecimalInput,
} from '../utils/formatters';

/**
 * Dashboard — The main screen.
 * Features:
 * - Balance card with hide/show privacy toggle (hidden by default)
 * - Quick Add Expense form with comma-aware decimal input
 *
 * @param {object} props
 * @param {function} props.showToast - Callback(message, type) to display a toast
 */
export default function Dashboard({ showToast }) {
  const { balances, settings, currencyOrder, addExpense } = useApp();
  const amountInputId = useId();
  const descInputId   = useId();

  // Form state
  const [amount,       setAmount]       = useState('');
  const [currency,     setCurrency]     = useState('RON');
  const [description,  setDescription]  = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Balance privacy toggle — hidden by default for privacy on open
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);

  const amountRef = useRef(null);

  const mainCurrency      = settings.mainDisplayCurrency;
  const mainBalance       = balances[mainCurrency] ?? 0;
  const isNegativeBalance = mainBalance < 0;

  /**
   * Handles amount input changes.
   * Accepts both '.' and ',' as decimal separators (e.g. '10,50').
   */
  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (isValidDecimalInput(value)) {
      setAmount(value);
    }
  };

  /**
   * Handles Save Expense.
   * Normalizes comma decimal separators before parsing.
   */
  const handleSaveExpense = () => {
    const normalized    = normalizeAmount(amount);
    const numericAmount = parseFloat(normalized);

    if (!numericAmount || numericAmount <= 0) {
      showToast('Please enter a valid amount.', 'error');
      amountRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    const success = addExpense(numericAmount, currency, description);

    if (success) {
      showToast(
        `Expense saved! -${getCurrencySymbol(currency)}${numericAmount.toFixed(2)}`,
        'success'
      );
      setAmount('');
      setDescription('');
      setCurrency('RON');
    } else {
      showToast('Failed to save expense.', 'error');
    }

    setTimeout(() => setIsSubmitting(false), 300);
  };

  // Other currencies shown decoratively on the balance card (respects user order)
  const otherCurrencies = currencyOrder.filter((c) => c !== mainCurrency);

  return (
    <div className="scroll-area no-scrollbar h-full flex flex-col px-4 py-4 gap-4 page-enter">

      {/* ══════════════════════════════════════════
          Balance Card — Green Theme
      ══════════════════════════════════════════ */}
      <section aria-label={`${mainCurrency} Balance`}>
        <div className="balance-card rounded-3xl p-6 shadow-card-lg relative">

          {/* Currency label + hide/show toggle */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-green-300/70 tracking-widest uppercase">
              {mainCurrency} Balance
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-green-300/60 bg-green-900/40 px-2.5 py-1 rounded-full">
                Main Currency
              </span>
              {/* Eye toggle button */}
              <button
                id="toggle-balance-visibility"
                onClick={() => setIsBalanceVisible((v) => !v)}
                className="
                  w-8 h-8 rounded-lg flex items-center justify-center
                  text-green-300/60 hover:text-green-200 hover:bg-green-800/40
                  transition-colors btn-press
                "
                aria-label={isBalanceVisible ? 'Hide balance' : 'Show balance'}
                aria-pressed={isBalanceVisible}
              >
                {isBalanceVisible ? (
                  /* Eye-off icon */
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  /* Eye icon */
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Balance amount — hidden or visible */}
          <div
            id="main-balance-display"
            className={`text-4xl font-extrabold tracking-tight leading-none mt-1 transition-all duration-300 ${
              isNegativeBalance && isBalanceVisible ? 'text-red-400' : 'text-white'
            }`}
          >
            {isBalanceVisible ? (
              formatAmount(mainBalance, mainCurrency)
            ) : (
              <span className="tracking-widest text-3xl text-green-200/40 select-none">
                ••••••
              </span>
            )}
          </div>

          {/* Other currencies decorative row */}
          <div className="flex items-center justify-between mt-5">
            <div className="flex gap-3">
              {otherCurrencies.map((c) => (
                <div key={c} className="text-center">
                  <p className="text-[10px] text-green-400/50 uppercase">{c}</p>
                  <p className="text-xs font-semibold text-green-200/60">
                    {isBalanceVisible
                      ? (balances[c] ?? 0).toFixed(0)
                      : '···'}
                  </p>
                </div>
              ))}
            </div>
            {/* Wallet icon */}
            <div className="w-10 h-10 rounded-full bg-green-800/50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          Quick Add Expense — Blue Theme
      ══════════════════════════════════════════ */}
      <section
        aria-label="Quick Add Expense"
        className="quick-add-section rounded-3xl p-5 flex-1 flex flex-col gap-5"
      >
        <p className="text-xs font-semibold text-blue-300/60 tracking-widest uppercase text-center">
          Quick Add Expense
        </p>

        {/* Amount + Currency Row */}
        <div className="flex items-center gap-2">
          {/* Large numeric input — accepts dot and comma */}
          <div className="flex-1 flex flex-col items-center">
            <label htmlFor={amountInputId} className="sr-only">
              Expense amount
            </label>
            <input
              ref={amountRef}
              id={amountInputId}
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={handleAmountChange}
              className="amount-input"
              aria-label="Expense amount"
              autoComplete="off"
            />
          </div>

          {/* Currency selector */}
          <div className="shrink-0">
            <label htmlFor="expense-currency-select" className="sr-only">
              Currency
            </label>
            <select
              id="expense-currency-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="
                currency-select bg-blue-900/60 text-white text-sm font-semibold
                border border-blue-500/30 rounded-xl px-3 py-2.5
                focus:outline-none focus:ring-2 focus:ring-blue-400/40
                transition-colors appearance-none
              "
              aria-label="Select currency for expense"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c} className="bg-slate-800">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-blue-500/15" />

        {/* Description input */}
        <div>
          <label htmlFor={descInputId} className="sr-only">
            Description
          </label>
          <input
            id={descInputId}
            type="text"
            placeholder="Description (e.g. Coffee, Rent…)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={80}
            className="
              w-full bg-blue-900/40 text-white text-base
              border border-blue-500/20 rounded-xl px-4 py-3
              placeholder:text-blue-300/30 focus:outline-none
              focus:ring-2 focus:ring-blue-400/30 transition-all
            "
            aria-label="Expense description"
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveExpense();
            }}
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Save Expense Button */}
        <button
          id="save-expense-btn"
          onClick={handleSaveExpense}
          disabled={isSubmitting}
          className={`
            w-full py-4 rounded-2xl font-bold text-lg text-white
            bg-blue-600 hover:bg-blue-500 active:bg-blue-700
            shadow-glow-blue transition-all duration-150
            btn-press disabled:opacity-60
            flex items-center justify-center gap-2
          `}
          aria-label="Save expense"
        >
          {isSubmitting ? (
            <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
              </svg>
              Save Expense
            </>
          )}
        </button>
      </section>
    </div>
  );
}
