import { useState, useId, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { formatAmount, normalizeAmount, isValidDecimalInput } from '../utils/formatters';

const LANGUAGES = ['en', 'tr'];

/**
 * BalanceSettings — Four sections:
 *   1. Add Balance: Draggable currency list with per-currency amount inputs.
 *   2. Main Display Currency: Radio selector for the green card on Dashboard.
 *   3. Custom Currency Builder: Add a new currency dynamically.
 *   4. Language / Dil: Switch between English and Turkish.
 */
export default function BalanceSettings({ showToast }) {
  const {
    balances, settings, currencyOrder, currencies, customCurrencies, getSymbol,
    addBalance, setMainCurrency, setLanguage, setCurrencyOrder, addCustomCurrency,
    hasTransactionsForCurrency, deleteCustomCurrency
  } = useApp();
  const { t, lang } = useTranslation();

  // ─── Per-currency form state ──────────────────────────────────────────────
  const [amounts,      setAmounts]      = useState({});
  const [descriptions, setDescriptions] = useState({});
  const [loadingCurrency, setLoadingCurrency] = useState(null);

  // ─── Custom Currency form state ───────────────────────────────────────────
  const [customCode, setCustomCode] = useState('');
  const [customSym, setCustomSym] = useState('');

  const formBaseId = useId();

  // ─── Drag-and-Drop ────────────────────────────────────────────────────────
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [overIdx,     setOverIdx]     = useState(null);
  const dragRef = useRef({ from: null, to: null });
  const listRef = useRef(null);

  const commitReorder = () => {
    const { from, to } = dragRef.current;
    if (from !== null && to !== null && from !== to) {
      const newOrder = [...currencyOrder];
      const [removed] = newOrder.splice(from, 1);
      newOrder.splice(to, 0, removed);
      setCurrencyOrder(newOrder);
    }
    dragRef.current = { from: null, to: null };
    setDraggingIdx(null);
    setOverIdx(null);
  };

  const handleDragStart = (idx) => { dragRef.current.from = idx; dragRef.current.to = idx; setDraggingIdx(idx); };
  const handleDragOver  = (e, idx) => { e.preventDefault(); if (dragRef.current.to !== idx) { dragRef.current.to = idx; setOverIdx(idx); } };
  const handleDrop      = (e) => { e.preventDefault(); commitReorder(); };
  const handleDragEnd   = () => commitReorder();

  // Touch drag
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    
    let activeEl = null;

    const onTouchMove = (e) => {
      if (dragRef.current.from === null) return;
      e.preventDefault(); // stop scrolling
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const li = target?.closest('li[data-idx]');
      if (li) {
        const idx = parseInt(li.getAttribute('data-idx'), 10);
        if (idx !== dragRef.current.to) {
          dragRef.current.to = idx;
          setOverIdx(idx);
        }
      }
    };
    const onTouchEnd = () => commitReorder();

    listEl.addEventListener('touchmove', onTouchMove, { passive: false });
    listEl.addEventListener('touchend', onTouchEnd);
    listEl.addEventListener('touchcancel', onTouchEnd);
    return () => {
      listEl.removeEventListener('touchmove', onTouchMove);
      listEl.removeEventListener('touchend', onTouchEnd);
      listEl.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [currencyOrder]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleAmountChange = (currency, val) => {
    if (isValidDecimalInput(val)) setAmounts(p => ({ ...p, [currency]: val }));
  };
  const handleDescChange = (currency, val) => {
    setDescriptions(p => ({ ...p, [currency]: val }));
  };

  const handleAddBalance = (currency) => {
    const val = amounts[currency] || '';
    const numericAmount = parseFloat(normalizeAmount(val));

    if (!numericAmount || numericAmount <= 0) {
      showToast(t.settings.toastInvalidAmount(currency), 'error');
      return;
    }

    setLoadingCurrency(currency);
    const description = (descriptions[currency] || '').trim() || t.settings.addBalanceTitle;
    const success     = addBalance(numericAmount, currency, description);

    if (success) {
      showToast(
        t.settings.toastBalanceAdded(getSymbol(currency), numericAmount.toFixed(2), currency),
        'success'
      );
      setAmounts(p => ({ ...p, [currency]: '' }));
      setDescriptions(p => ({ ...p, [currency]: '' }));
    } else {
      showToast(t.settings.toastFailed, 'error');
    }

    setTimeout(() => setLoadingCurrency(null), 300);
  };

  const handleAddCustomCurrency = (e) => {
    e.preventDefault();
    if (addCustomCurrency(customCode, customSym)) {
      showToast(t.settings.toastCustomCurrencyAdded, 'success');
      setCustomCode('');
      setCustomSym('');
    }
  };

  const handleDeleteCustomCurrency = (code) => {
    if (hasTransactionsForCurrency(code)) {
      if (!window.confirm(t.settings.currencyDeleteWarning)) return;
    }
    deleteCustomCurrency(code);
    showToast(t.settings.toastCustomCurrencyDeleted, 'success');
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const getCurrencyStyle = (code) => {
    const styles = {
      USD: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
      EUR: { bg: 'bg-blue-500/15',    text: 'text-blue-400'    },
      TL:  { bg: 'bg-orange-500/15',  text: 'text-orange-400'  },
      RON: { bg: 'bg-purple-500/15',  text: 'text-purple-400'  },
    };
    return styles[code] || { bg: 'bg-slate-500/15', text: 'text-slate-400' };
  };

  return (
    <div className="scroll-area no-scrollbar h-full px-4 py-4 page-enter space-y-6">

      {/* ══════════════════════════════════════════
          Section 1: Add Balance (Draggable)
      ══════════════════════════════════════════ */}
      <section aria-labelledby={`${formBaseId}-add-title`}>
        <div className="flex items-center justify-between mb-4">
          <h2 id={`${formBaseId}-add-title`} className="text-lg font-bold text-white">
            {t.settings.addBalanceTitle}
          </h2>
          <span className="text-xs font-medium text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8M8 15h8" />
            </svg>
            {t.settings.dragHint}
          </span>
        </div>

        <ul ref={listRef} className="space-y-3 relative touch-pan-y" role="list">
          {currencyOrder.map((currency, idx) => {
            const isDragging = draggingIdx === idx;
            const isOver     = overIdx === idx && !isDragging;
            const { bg, text } = getCurrencyStyle(currency);
            
            // Reordering visual feedback styles
            let dragClasses = '';
            if (isDragging) dragClasses = 'opacity-0 scale-95';
            else if (isOver && draggingIdx !== null) {
              dragClasses = draggingIdx < idx
                ? 'translate-y-[-8px] shadow-[0_4px_0_rgba(255,255,255,0.05)]'
                : 'translate-y-[8px] shadow-[0_-4px_0_rgba(255,255,255,0.05)]';
            }

            return (
              <li
                key={currency}
                data-idx={idx}
                className={`transition-all duration-200 ${dragClasses}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              >
                <div className="glass-card rounded-2xl p-4 cursor-grab active:cursor-grabbing hover:bg-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 flex justify-center text-slate-600 shrink-0 touch-none"
                      onTouchStart={() => { dragRef.current.from = idx; dragRef.current.to = idx; setDraggingIdx(idx); }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 5a2 2 0 100-4 2 2 0 000 4zm6-2a2 2 0 11-4 0 2 2 0 014 0zM9 13a2 2 0 100-4 2 2 0 000 4zm6-2a2 2 0 11-4 0 2 2 0 014 0zM9 21a2 2 0 100-4 2 2 0 000 4zm6-2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${bg} ${text}`}>
                            {getSymbol(currency)}
                          </span>
                          <span className="font-bold text-white tracking-wide">{currency}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                            {t.settings.balanceLabel}
                          </p>
                          <p className={`text-sm font-bold leading-none ${text}`}>
                            {formatAmount(balances[currency] ?? 0, currency, getSymbol(currency))}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
                        <div className="flex-1 flex flex-col gap-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder={t.settings.amountPlaceholder}
                            value={amounts[currency] || ''}
                            onChange={(e) => handleAmountChange(currency, e.target.value)}
                            className="w-full bg-slate-900/50 text-white text-sm border border-slate-700/50 rounded-xl px-3 py-2.5 placeholder:text-slate-600 focus:outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/40 transition-colors"
                          />
                          <input
                            type="text"
                            placeholder={t.settings.notePlaceholder}
                            value={descriptions[currency] || ''}
                            onChange={(e) => handleDescChange(currency, e.target.value)}
                            maxLength={40}
                            className="w-full bg-slate-900/50 text-white text-xs border border-slate-700/50 rounded-xl px-3 py-2 placeholder:text-slate-600 focus:outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/40 transition-colors"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddBalance(currency); }}
                          />
                        </div>

                        <button
                          onClick={() => handleAddBalance(currency)}
                          disabled={loadingCurrency === currency}
                          className="h-full min-h-[82px] px-4 rounded-xl font-bold text-sm text-green-900 bg-green-400 hover:bg-green-300 active:bg-green-500 transition-colors btn-press disabled:opacity-50 shrink-0"
                        >
                          {loadingCurrency === currency ? (
                            <span className="inline-block w-4 h-4 border-2 border-green-900/30 border-t-green-900 rounded-full animate-spin" />
                          ) : (
                            t.settings.addButton
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ══════════════════════════════════════════
          Section 2: Custom Currency Builder
      ══════════════════════════════════════════ */}
      <section className="glass-card rounded-2xl p-5" aria-labelledby={`${formBaseId}-custom-currency`}>
        <h2 id={`${formBaseId}-custom-currency`} className="text-base font-bold text-white mb-4">
          {t.settings.customCurrencyTitle}
        </h2>
        
        <form onSubmit={handleAddCustomCurrency} className="flex gap-2">
          <input
            type="text"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            placeholder={t.settings.currencyCodePlaceholder}
            className="flex-1 w-0 bg-slate-900/50 text-white text-sm border border-slate-700/50 rounded-xl px-3 py-2.5 uppercase placeholder:normal-case placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40"
            required
            maxLength={5}
          />
          <input
            type="text"
            value={customSym}
            onChange={(e) => setCustomSym(e.target.value)}
            placeholder={t.settings.currencySymbolPlaceholder}
            className="w-20 bg-slate-900/50 text-white text-sm border border-slate-700/50 rounded-xl px-3 py-2.5 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40"
            required
            maxLength={3}
          />
          <button
            type="submit"
            className="px-4 rounded-xl font-bold text-sm text-blue-900 bg-blue-400 hover:bg-blue-300 transition-colors btn-press"
          >
            {t.settings.addButton}
          </button>
        </form>

        {customCurrencies.length > 0 && (
          <div className="mt-4 space-y-2">
            {customCurrencies.map((c) => (
              <div key={c.code} className="flex items-center justify-between bg-slate-900/40 rounded-xl px-3 py-2 border border-slate-700/30">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center text-sm">
                    {c.symbol}
                  </span>
                  <span className="text-sm font-bold text-slate-300">{c.code}</span>
                </div>
                <button
                  onClick={() => handleDeleteCustomCurrency(c.code)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors btn-press"
                  aria-label="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          Section 3: Main Display Currency
      ══════════════════════════════════════════ */}
      <section className="glass-card rounded-2xl p-5" aria-labelledby={`${formBaseId}-main-title`}>
        <h2 id={`${formBaseId}-main-title`} className="text-base font-bold text-white mb-1">
          {t.settings.mainCurrencyTitle}
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          {t.settings.mainCurrencySubtitle}
        </p>

        <div className="grid grid-cols-2 gap-2" role="radiogroup">
          {currencies.map((c) => {
            const isSelected = settings.mainDisplayCurrency === c;
            const name = t.settings.currencyNames[c] || c;

            return (
              <label
                key={c}
                className={`
                  relative flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer border-2 transition-all btn-press
                  ${isSelected
                    ? 'bg-green-500/10 border-green-500 text-green-400'
                    : 'bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-700 hover:text-white'
                  }
                `}
              >
                <input
                  type="radio"
                  name="main-currency"
                  value={c}
                  checked={isSelected}
                  onChange={() => {
                    setMainCurrency(c);
                    showToast(t.settings.toastMainCurrency(c), 'success');
                  }}
                  className="sr-only"
                />
                <span className="text-sm font-bold mb-0.5">{c}</span>
                <span className="text-[10px] text-center opacity-80 leading-tight">
                  {name}
                </span>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" clipRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      />
                    </svg>
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          Section 4: Language
      ══════════════════════════════════════════ */}
      <section className="glass-card rounded-2xl p-5 mb-8" aria-labelledby={`${formBaseId}-lang-title`}>
        <h2 id={`${formBaseId}-lang-title`} className="text-base font-bold text-white mb-4">
          {t.settings.languageTitle}
        </h2>

        <div className="flex gap-2" role="radiogroup">
          {LANGUAGES.map((l) => {
            const isSelected = lang === l;
            return (
              <label
                key={l}
                className={`
                  flex-1 flex items-center justify-center py-2.5 rounded-xl cursor-pointer border-2 transition-all btn-press
                  ${isSelected
                    ? 'bg-blue-500/10 border-blue-500 text-white'
                    : 'bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-700 hover:text-white'
                  }
                `}
              >
                <input
                  type="radio"
                  name="language"
                  value={l}
                  checked={isSelected}
                  onChange={() => {
                    setLanguage(l);
                    showToast(l === 'en' ? t.settings.toastLanguageEN : t.settings.toastLanguageTR, 'success');
                  }}
                  className="sr-only"
                />
                <span className="text-sm font-semibold">{t.languages[l]}</span>
              </label>
            );
          })}
        </div>
      </section>

    </div>
  );
}
