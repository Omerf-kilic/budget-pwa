import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { formatAmount, formatDate, CATEGORY_EMOJI } from '../utils/formatters';

/**
 * History — Displays all transactions in reverse-chronological order.
 * Now includes a Trash Bin view for soft-deleted transactions and Bulk Actions.
 */
export default function History({ showToast }) {
  const { 
    transactions, getSymbol,
    deleteTransaction, restoreTransaction, purgeTransaction, emptyTrash,
    bulkDeleteTransactions, bulkRestoreTransactions, bulkPurgeTransactions
  } = useApp();
  const { t } = useTranslation();
  
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmPurgeId, setConfirmPurgeId]   = useState(null);
  const [showTrash, setShowTrash]             = useState(false);

  // Bulk actions state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds]         = useState(new Set());

  const activeTransactions  = transactions.filter((tx) => !tx.isDeleted);
  const deletedTransactions = transactions.filter((tx) => tx.isDeleted);
  
  const displayTransactions = showTrash ? deletedTransactions : activeTransactions;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
    setConfirmDeleteId(null);
    setConfirmPurgeId(null);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayTransactions.map(tx => tx.id)));
    }
  };

  const toggleSelectRow = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleRowClick = (id) => {
    if (isSelectionMode) toggleSelectRow(id);
  };

  const handleDeletePress = (id) => {
    if (confirmDeleteId === id) {
      deleteTransaction(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handlePurgePress = (id) => {
    if (confirmPurgeId === id) {
      purgeTransaction(id);
      setConfirmPurgeId(null);
      if (showToast) showToast(t.history.toastPurged, 'success');
    } else {
      setConfirmPurgeId(id);
      setTimeout(() => setConfirmPurgeId(null), 3000);
    }
  };

  const handleRestore = (id) => {
    restoreTransaction(id);
    if (showToast) showToast(t.history.toastRestored, 'success');
  };

  const handleEmptyTrash = () => {
    if (deletedTransactions.length === 0) return;
    const confirmed = window.confirm(t.history.emptyTrash + '?');
    if (confirmed) {
      emptyTrash();
      if (showToast) showToast(t.history.toastEmptied, 'success');
      setIsSelectionMode(false);
    }
  };

  // Bulk Handlers
  const handleBulkDelete = () => {
    bulkDeleteTransactions(Array.from(selectedIds));
    if (showToast) showToast(t.history.toastBulkDeleted, 'success');
    toggleSelectionMode();
  };

  const handleBulkRestore = () => {
    bulkRestoreTransactions(Array.from(selectedIds));
    if (showToast) showToast(t.history.toastBulkRestored, 'success');
    toggleSelectionMode();
  };

  const handleBulkPurge = () => {
    const confirmed = window.confirm(t.history.purgeSelected + '?');
    if (confirmed) {
      bulkPurgeTransactions(Array.from(selectedIds));
      if (showToast) showToast(t.history.toastBulkPurged, 'success');
      toggleSelectionMode();
    }
  };

  // ── Renders ───────────────────────────────────────────────────────────────

  const renderTransactionRow = (tx, isTrashView) => {
    const isExpense    = tx.type === 'expense';
    const isConfirming = isTrashView ? confirmPurgeId === tx.id : confirmDeleteId === tx.id;
    const isSelected   = selectedIds.has(tx.id);

    // Show category emoji for expenses (backward compat: fallback to 'other' emoji)
    const catEmoji = isExpense
      ? (CATEGORY_EMOJI[tx.category] ?? CATEGORY_EMOJI['other'])
      : null;

    return (
      <li
        key={tx.id}
        className={`glass-card rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-colors ${
          isSelectionMode ? 'cursor-pointer hover:bg-slate-800/80 active:bg-slate-800' : ''
        } ${isSelected ? 'border border-blue-500/50 bg-blue-500/10' : 'border border-transparent'}`}
        role="listitem"
        onClick={() => handleRowClick(tx.id)}
      >
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <div className="shrink-0 mr-1 flex items-center justify-center">
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
              isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-500'
            }`}>
              {isSelected && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Type / category icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isExpense ? 'bg-red-500/15' : 'bg-green-500/15'
          }`}
          aria-hidden="true"
        >
          {isExpense ? (
            <span className="text-lg leading-none">{catEmoji}</span>
          ) : (
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
        </div>

        {/* Description + date */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {tx.description}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatDate(tx.date)}
          </p>
        </div>

        {/* Amount + currency badge */}
        <div className="text-right shrink-0">
          <p className={`text-sm font-bold ${isExpense ? 'text-red-400' : 'text-green-400'}`}>
            {isExpense ? '-' : '+'}{formatAmount(tx.amount, tx.currency, getSymbol(tx.currency))}
          </p>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
            isExpense ? 'badge-expense' : 'badge-income'
          }`}>
            {tx.currency}
          </span>
        </div>

        {/* Actions (Hidden in Selection Mode) */}
        {!isSelectionMode && (
          isTrashView ? (
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {/* Restore button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleRestore(tx.id); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-green-400 hover:bg-green-500/10 transition-all btn-press"
                aria-label={t.history.restore}
                title={t.history.restore}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              {/* Purge button (tap-to-confirm) */}
              <button
                onClick={(e) => { e.stopPropagation(); handlePurgePress(tx.id); }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all btn-press ${
                  isConfirming ? 'bg-red-500/80 text-white' : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                }`}
                aria-label={t.history.deletePermanent}
                title={t.history.deletePermanent}
              >
                {isConfirming ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          ) : (
            <div className="shrink-0 ml-1">
              {/* Soft Delete button (tap-to-confirm) */}
              <button
                id={`delete-tx-${tx.id}`}
                onClick={(e) => { e.stopPropagation(); handleDeletePress(tx.id); }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 btn-press ${
                  isConfirming ? 'bg-red-500/80 text-white' : 'text-slate-600 hover:text-red-400 hover:bg-red-500/10'
                }`}
                aria-label={isConfirming ? t.history.deleteConfirm : t.history.deleteLabel(tx.description)}
                title={isConfirming ? t.history.deleteConfirm : t.history.deleteLabel(tx.description)}
              >
                {isConfirming ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          )
        )}
      </li>
    );
  };

  const displayTitle        = showTrash ? t.history.trashTitle : t.history.title;
  const emptyStateTitle     = showTrash ? t.history.trashEmptyTitle : t.history.emptyTitle;
  const emptyStateSubtitle  = showTrash ? t.history.trashEmptySubtitle : t.history.emptySubtitle;

  return (
    <div className="h-full page-enter flex flex-col relative">
      <div className="scroll-area no-scrollbar flex-1 px-4 py-4 flex flex-col pb-[120px]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {showTrash && (
              <button
                onClick={() => { setShowTrash(false); setIsSelectionMode(false); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors btn-press"
                aria-label="Back"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-sm font-semibold text-slate-300">{displayTitle}</h2>
            <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">
              {displayTransactions.length} {t.history.totalSuffix}
            </span>
          </div>

          <div className="flex gap-2">
            {/* Select Toggle Button */}
            {displayTransactions.length > 0 && (
              <button
                onClick={toggleSelectionMode}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors btn-press ${
                  isSelectionMode ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {isSelectionMode ? t.history.cancel : t.history.select}
              </button>
            )}

            {/* Trash toggle button */}
            {!showTrash && (
              <button
                onClick={() => { setShowTrash(true); setIsSelectionMode(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors btn-press"
                aria-label={t.history.trashTitle}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-xs font-semibold">{t.history.trashTitle}</span>
                {deletedTransactions.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300">
                    {deletedTransactions.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Selection Tools (Select All) */}
        {isSelectionMode && displayTransactions.length > 0 && (
          <div className="flex items-center justify-between mb-4 bg-slate-800/40 p-2 px-3 rounded-xl border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400">
              {selectedIds.size} selected
            </span>
            <button
              onClick={toggleSelectAll}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 btn-press"
            >
              {selectedIds.size === displayTransactions.length ? t.history.cancel : t.history.selectAll}
            </button>
          </div>
        )}

        {/* Empty Trash Button (Top-level if in trash view, but hidden during selection) */}
        {showTrash && deletedTransactions.length > 0 && !isSelectionMode && (
          <button
            onClick={handleEmptyTrash}
            className="mb-4 w-full py-3 rounded-xl font-bold text-sm text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors btn-press flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t.history.emptyTrash}
          </button>
        )}

        {/* Empty state */}
        {displayTransactions.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 mt-16 text-center flex-1">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
              {showTrash ? (
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">{emptyStateTitle}</p>
              <p className="text-slate-600 text-xs mt-1">{emptyStateSubtitle}</p>
            </div>
          </div>
        )}

        {/* Transaction list */}
        {displayTransactions.length > 0 && (
          <ul className="space-y-2.5" role="list" aria-label={displayTitle}>
            {displayTransactions.map((tx) => renderTransactionRow(tx, showTrash))}
          </ul>
        )}
      </div>

      {/* ── Fixed Bottom Action Bar (Selection Mode) ── */}
      {isSelectionMode && (
        <div className="absolute bottom-[80px] left-0 right-0 px-4 z-20 animate-slide-up">
          <div className="glass-card rounded-2xl p-2 flex items-center justify-between shadow-2xl border border-slate-700/50 bg-slate-900/95 backdrop-blur-xl">
            {showTrash ? (
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleBulkRestore}
                  disabled={selectedIds.size === 0}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-green-900 bg-green-400 hover:bg-green-300 disabled:opacity-40 transition-colors btn-press"
                >
                  {t.history.restoreSelected}
                </button>
                <button
                  onClick={handleBulkPurge}
                  disabled={selectedIds.size === 0}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-red-100 bg-red-600 hover:bg-red-500 disabled:opacity-40 transition-colors btn-press"
                >
                  {t.history.purgeSelected}
                </button>
              </div>
            ) : (
              <button
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0}
                className="w-full py-3 rounded-xl font-bold text-sm text-red-100 bg-red-500/80 hover:bg-red-500 disabled:opacity-40 transition-colors btn-press"
              >
                {t.history.deleteSelected}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
