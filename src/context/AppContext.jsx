import { createContext, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_CURRENCY_ORDER, CURRENCY_META } from '../utils/formatters';

// ─── Initial State ───────────────────────────────────────────────────────────

const INITIAL_BALANCES = {
  USD: 0,
  EUR: 0,
  TL:  0,
  RON: 0,
};

const INITIAL_SETTINGS = {
  mainDisplayCurrency: 'RON',
  language: 'en', // 'en' | 'tr'
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
  const [currencyOrder, setCurrencyOrderRaw] = useLocalStorage('budget_currency_order', DEFAULT_CURRENCY_ORDER);
  const [customCurrencies, setCustomCurrencies] = useLocalStorage('budget_custom_currencies', []);

  // Compute merged currencies and meta for the app to consume
  const allCurrencyCodes = [
    ...DEFAULT_CURRENCY_ORDER.filter(c => !customCurrencies.some(cc => cc.code === c)),
    ...customCurrencies.map(c => c.code)
  ];
  
  // Make sure currencyOrder only includes valid ones, and appends any missing customs
  const activeCurrencyOrder = [
    ...currencyOrder.filter(c => allCurrencyCodes.includes(c)),
    ...allCurrencyCodes.filter(c => !currencyOrder.includes(c))
  ];

  // Provide a getSymbol function closed over custom properties
  const getSymbol = useCallback((code) => {
    const custom = customCurrencies.find(c => c.code === code);
    if (custom) return custom.symbol;
    return CURRENCY_META[code]?.symbol ?? code;
  }, [customCurrencies]);

  const addCustomCurrency = useCallback((code, symbol) => {
    const upperCode = code.trim().toUpperCase();
    if (!upperCode || !symbol.trim()) return false;
    
    setCustomCurrencies(prev => {
      if (prev.some(c => c.code === upperCode)) return prev;
      return [...prev, { code: upperCode, symbol: symbol.trim() }];
    });
    return true;
  }, [setCustomCurrencies]);

  /**
   * Saves an expense transaction.
   * Deducts the amount from the specific currency's balance.
   *
   * @param {number} amount
   * @param {string} currency    - USD | EUR | TL | RON
   * @param {string} description
   * @param {string} category    - One of CATEGORIES[].key (defaults to 'other')
   * @returns {boolean} - true on success
   */
  const addExpense = useCallback(
    (amount, currency, description, category = 'other') => {
      const numericAmount = parseFloat(amount);
      if (!numericAmount || numericAmount <= 0) return false;

      // Create the transaction record (category stored for Reports chart)
      const transaction = {
        id:          uuidv4(),
        type:        'expense',
        amount:      numericAmount,
        currency,
        description: description.trim() || 'Expense',
        category:    category || 'other',
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
        if (!tx || tx.isDeleted) return prev;

        // Reverse the balance effect
        setBalances((bals) => ({
          ...bals,
          [tx.currency]:
            tx.type === 'expense'
              ? parseFloat(((bals[tx.currency] ?? 0) + tx.amount).toFixed(2))
              : parseFloat(((bals[tx.currency] ?? 0) - tx.amount).toFixed(2)),
        }));

        // Soft delete: flag as deleted
        return prev.map((t) => (t.id === transactionId ? { ...t, isDeleted: true } : t));
      });
    },
    [setBalances, setTransactions]
  );

  /**
   * Restores a soft-deleted transaction and re-applies its effect on balances.
   */
  const restoreTransaction = useCallback(
    (transactionId) => {
      setTransactions((prev) => {
        const tx = prev.find((t) => t.id === transactionId);
        if (!tx || !tx.isDeleted) return prev;

        // Re-apply the balance effect
        setBalances((bals) => ({
          ...bals,
          [tx.currency]:
            tx.type === 'expense'
              ? parseFloat(((bals[tx.currency] ?? 0) - tx.amount).toFixed(2))
              : parseFloat(((bals[tx.currency] ?? 0) + tx.amount).toFixed(2)),
        }));

        // Remove the isDeleted flag
        return prev.map((t) => {
          if (t.id === transactionId) {
            const { isDeleted, ...rest } = t;
            return rest;
          }
          return t;
        });
      });
    },
    [setBalances, setTransactions]
  );

  /**
   * Permanently removes a single soft-deleted transaction.
   */
  const purgeTransaction = useCallback(
    (transactionId) => {
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    },
    [setTransactions]
  );

  /**
   * Bulk soft-delete transactions.
   */
  const bulkDeleteTransactions = useCallback(
    (ids) => {
      setTransactions((prev) => {
        let updatedBals = { ...balances };
        let anyChanged = false;
        const next = prev.map((t) => {
          if (ids.includes(t.id) && !t.isDeleted) {
            anyChanged = true;
            // Reverse balance
            updatedBals[t.currency] = t.type === 'expense'
              ? parseFloat(((updatedBals[t.currency] ?? 0) + t.amount).toFixed(2))
              : parseFloat(((updatedBals[t.currency] ?? 0) - t.amount).toFixed(2));
            return { ...t, isDeleted: true };
          }
          return t;
        });
        if (anyChanged) setBalances(updatedBals);
        return next;
      });
    },
    [balances, setBalances, setTransactions]
  );

  /**
   * Bulk restore soft-deleted transactions.
   */
  const bulkRestoreTransactions = useCallback(
    (ids) => {
      setTransactions((prev) => {
        let updatedBals = { ...balances };
        let anyChanged = false;
        const next = prev.map((t) => {
          if (ids.includes(t.id) && t.isDeleted) {
            anyChanged = true;
            // Re-apply balance
            updatedBals[t.currency] = t.type === 'expense'
              ? parseFloat(((updatedBals[t.currency] ?? 0) - t.amount).toFixed(2))
              : parseFloat(((updatedBals[t.currency] ?? 0) + t.amount).toFixed(2));
            const { isDeleted, ...rest } = t;
            return rest;
          }
          return t;
        });
        if (anyChanged) setBalances(updatedBals);
        return next;
      });
    },
    [balances, setBalances, setTransactions]
  );

  /**
   * Bulk permanently purge soft-deleted transactions.
   */
  const bulkPurgeTransactions = useCallback(
    (ids) => {
      setTransactions((prev) => prev.filter((t) => !ids.includes(t.id)));
    },
    [setTransactions]
  );

  /**
   * Permanently removes all soft-deleted transactions.
   */
  const emptyTrash = useCallback(() => {
    setTransactions((prev) => prev.filter((t) => !t.isDeleted));
  }, [setTransactions]);


  /**
   * Changes the active UI language.
   *
   * @param {'en'|'tr'} lang
   */
  const setLanguage = useCallback(
    (lang) => {
      setSettings((prev) => ({ ...prev, language: lang }));
    },
    [setSettings]
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
    currencyOrder: activeCurrencyOrder,
    currencies: allCurrencyCodes,
    getSymbol,
    addCustomCurrency,
    addExpense,
    addBalance,
    setMainCurrency,
    setLanguage,
    deleteTransaction,
    restoreTransaction,
    purgeTransaction,
    bulkDeleteTransactions,
    bulkRestoreTransactions,
    bulkPurgeTransactions,
    emptyTrash,
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
