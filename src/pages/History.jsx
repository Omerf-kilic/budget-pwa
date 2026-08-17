import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { formatAmount, formatDate } from '../utils/formatters';

/**
 * History — Displays all transactions in reverse-chronological order.
 * All text labels are driven by the active language.
 */
export default function History() {
  const { transactions, deleteTransaction } = useApp();
  const { t } = useTranslation();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDeletePress = (id) => {
    if (confirmDeleteId === id) {
      deleteTransaction(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  return (
    <div className="scroll-area no-scrollbar h-full px-4 py-4 page-enter">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300">
          {t.history.title}
        </h2>
        <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">
          {transactions.length} {t.history.totalSuffix}
        </span>
      </div>

      {/* Empty state */}
      {transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 mt-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">{t.history.emptyTitle}</p>
            <p className="text-slate-600 text-xs mt-1">{t.history.emptySubtitle}</p>
          </div>
        </div>
      )}

      {/* Transaction list */}
      {transactions.length > 0 && (
        <ul className="space-y-2.5" role="list" aria-label={t.history.title}>
          {transactions.map((tx) => {
            const isExpense    = tx.type === 'expense';
            const isConfirming = confirmDeleteId === tx.id;

            return (
              <li
                key={tx.id}
                className="glass-card rounded-2xl px-4 py-3.5 flex items-center gap-3"
                role="listitem"
              >
                {/* Type icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isExpense ? 'bg-red-500/15' : 'bg-green-500/15'
                  }`}
                  aria-hidden="true"
                >
                  {isExpense ? (
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                </div>

                {/* Description + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{tx.description}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatDate(tx.date)}</p>
                </div>

                {/* Amount + currency badge */}
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${isExpense ? 'text-red-400' : 'text-green-400'}`}>
                    {isExpense ? '-' : '+'}{formatAmount(tx.amount, tx.currency)}
                  </p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                    isExpense ? 'badge-expense' : 'badge-income'
                  }`}>
                    {tx.currency}
                  </span>
                </div>

                {/* Delete button (tap-to-confirm) */}
                <button
                  id={`delete-tx-${tx.id}`}
                  onClick={() => handleDeletePress(tx.id)}
                  className={`
                    shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                    transition-all duration-150 btn-press
                    ${isConfirming
                      ? 'bg-red-500/80 text-white'
                      : 'text-slate-600 hover:text-red-400 hover:bg-red-500/10'
                    }
                  `}
                  aria-label={isConfirming ? t.history.deleteConfirm : t.history.deleteLabel(tx.description)}
                  title={isConfirming ? t.history.deleteConfirm : t.history.deleteLabel(tx.description)}
                >
                  {isConfirming ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
