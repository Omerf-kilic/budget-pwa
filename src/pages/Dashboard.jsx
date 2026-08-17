import { useState, useRef, useId } from 'react';
import { useApp } from '../context/AppContext';
import { formatAmount, getCurrencySymbol, CURRENCIES } from '../utils/formatters';

/**
 * Dashboard — The main screen.
 * Shows the balance card for the mainDisplayCurrency and the Quick Add Expense form.
 *
 * @param {object} props
 * @param {function} props.showToast - Callback(message, type) to display a toast
 */
export default function Dashboard({ showToast }) {
  const { balances, settings, addExpense } = useApp();
  const amountInputId  = useId();
  const descInputId    = useId();

  // Form state
  const [amount,      setAmount]      = useState('');
  const [currency,    setCurrency]    = useState('RON');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const amountRef = useRef(null);

  const mainCurrency     = settings.mainDisplayCurrency;
  const mainBalance      = balances[mainCurrency] ?? 0;
  const isNegativeBalance = mainBalance < 0;

  /**
   * Handles the Save Expense button press.
   * Validates input, calls addExpense, shows toast, and resets form.
   */
  const handleSaveExpense = () => {
    const numericAmount = parseFloat(amount);

    if (!numericAmount || numericAmount <= 0) {
      showToast('Please enter a valid amount.', 'error');
      amountRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    const success = addExpense(numericAmount, currency, description);

    if (success) {
      showToast(`Expense saved! -${getCurrencySymbol(currency)}${numericAmount.toFixed(2)}`, 'success');
      // Reset the form
      setAmount('');
      setDescription('');
      setCurrency('RON');
    } else {
      showToast('Failed to save expense.', 'error');
    }

    setTimeout(() => setIsSubmitting(false), 300);
  };

  /**
   * Handles numeric amount input — allows only valid positive numbers.
   */
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow digits and a single decimal point
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <div className="scroll-area no-scrollbar h-full flex flex-col px-4 py-4 gap-4 page-enter">

      {/* ══════════════════════════════════════════
          Balance Card — Green Theme
      ══════════════════════════════════════════ */}
      <section aria-label={`${mainCurrency} Balance`}>
        <div className="balance-card rounded-3xl p-6 shadow-card-lg relative">
          {/* Currency & Label */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-green-300/70 tracking-widest uppercase">
              {mainCurrency} Balance
            </span>
            <span className="text-xs font-medium text-green-300/60 bg-green-900/40 px-2.5 py-1 rounded-full">
              Main Currency
            </span>
          </div>

          {/* Balance amount */}
          <div
            id="main-balance-display"
            className={`text-4xl font-extrabold tracking-tight leading-none mt-1 ${
              isNegativeBalance ? 'text-red-400' : 'text-white'
            }`}
          >
            {formatAmount(mainBalance, mainCurrency)}
          </div>

          {/* Decorative bottom row */}
          <div className="flex items-center justify-between mt-5">
            <div className="flex gap-3">
              {CURRENCIES.filter((c) => c !== mainCurrency).map((c) => (
                <div key={c} className="text-center">
                  <p className="text-[10px] text-green-400/50 uppercase">{c}</p>
                  <p className="text-xs font-semibold text-green-200/60">
                    {(balances[c] ?? 0).toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
            {/* Small wallet icon */}
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
          {/* Large numeric input */}
          <div className="flex-1 flex flex-col items-center">
            <label htmlFor={amountInputId} className="sr-only">
              Expense amount
            </label>
            <input
              ref={amountRef}
              id={amountInputId}
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              placeholder="0.00"
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

        {/* Spacer to push button down */}
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
