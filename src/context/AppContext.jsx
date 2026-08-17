import { createContext, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_CURRENCY_ORDER } from '../utils/formatters';

// ─── Initial State ───────────────────────────────────────────────────────────

const INITIAL_BALANCES = {
  USD: 0,
  EUR: 0,
  TL:  0,
  RON: 0,
};

const INITIAL_SETTINGS = {
  mainDisplayCurrency: 'RON',
};

// ─── Context Definition ───────────────────────────────────────────────────────

const AppContext = createContext(null);

/**
 * AppProvider wraps the entire application.
 * All budget state is stored in localStorage under a single key.
 */
export function AppProvider({ children }) {
  const [balances, setBalances]         = useLocalStorage('budget_balances', INITIAL_BALANCES);
  const [transactions, setTransactions] = useLocalStorage('budget_transactions', []);
  const [settings, setSettings]         = useLocalStorage('budget_settings', INITIAL_SETTINGS);
  // User's preferred currency display order for the drag-and-drop list
  const [currencyOrder, setCurrencyOrderRaw] = useLocalStorage('budget_currency_order', DEFAULT_CURRENCY_ORDER);

  /**
   * Saves an expense transaction.
   * Deducts the amount from the specific currency's balance.
   *
   * @param {number} amount
   * @param {string} currency - USD | EUR | TL | RON
   * @param {string} description
   * @returns {boolean} - true on success, false if insufficient balance
   */
  const addExpense = useCallback(
    (amount, currency, description) => {
      const numericAmount = parseFloat(amount);
      if (!numericAmount || numericAmount <= 0) return false;

      // Create the transaction record
      const transaction = {
        id:          uuidv4(),
        type:        'expense',
        amount:      numericAmount,
        currency,
        description: description.trim() || 'Expense',
        date:        Date.now(),
      };

      // Deduct from the matching currency balance (can go negative)
      setBalances((prev) => ({
        ...prev,
        [currency]: parseFloat(((prev[currency] ?? 0) - numericAmount).toFixed(2)),
      }));

      // Prepend to transactions (newest first)
      setTransactions((prev) => [transaction, ...prev]);

      return true;
    },
    [setBalances, setTransactions]
  );

  /**
   * Adds income to a specific currency balance.
   * This is used only from the Balance & Settings page.
   *
   * @param {number} amount
   * @param {string} currency - USD | EUR | TL | RON
   * @param {string} description
   */
  const addBalance = useCallback(
    (amount, currency, description = 'Balance Added') => {
      const numericAmount = parseFloat(amount);
      if (!numericAmount || numericAmount <= 0) return false;

      const transaction = {
        id:          uuidv4(),
        type:        'income',
        amount:      numericAmount,
        currency,
        description: description.trim() || 'Balance Added',
        date:        Date.now(),
      };

      setBalances((prev) => ({
        ...prev,
        [currency]: parseFloat(((prev[currency] ?? 0) + numericAmount).toFixed(2)),
      }));

      setTransactions((prev) => [transaction, ...prev]);

      return true;
    },
    [setBalances, setTransactions]
  );

  /**
   * Changes the main display currency shown on the balance card.
   *
   * @param {string} currency - USD | EUR | TL | RON
   */
  const setMainCurrency = useCallback(
    (currency) => {
      setSettings((prev) => ({ ...prev, mainDisplayCurrency: currency }));
    },
    [setSettings]
  );

  /**
   * Deletes a transaction by ID and reverses its effect on balances.
   *
   * @param {string} transactionId
   */
  const deleteTransaction = useCallback(
    (transactionId) => {
      setTransactions((prev) => {
        const tx = prev.find((t) => t.id === transactionId);
        if (!tx) return prev;

        // Reverse the balance effect
        setBalances((bals) => ({
          ...bals,
          [tx.currency]:
            tx.type === 'expense'
              ? parseFloat(((bals[tx.currency] ?? 0) + tx.amount).toFixed(2))
              : parseFloat(((bals[tx.currency] ?? 0) - tx.amount).toFixed(2)),
        }));

        return prev.filter((t) => t.id !== transactionId);
      });
    },
    [setBalances, setTransactions]
  );

  /**
   * Updates the display order of currencies (from drag-and-drop).
   *
   * @param {string[]} newOrder - Reordered array of currency codes
   */
  const setCurrencyOrder = useCallback(
    (newOrder) => {
      setCurrencyOrderRaw(newOrder);
    },
    [setCurrencyOrderRaw]
  );

  const value = {
    balances,
    transactions,
    settings,
    currencyOrder,
    addExpense,
    addBalance,
    setMainCurrency,
    deleteTransaction,
    setCurrencyOrder,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook to consume the AppContext.
 * Must be used inside AppProvider.
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
