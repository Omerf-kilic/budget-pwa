import { useState, useId, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import {
  formatAmount,
  getCurrencySymbol,
  CURRENCY_META,
  normalizeAmount,
  isValidDecimalInput,
} from '../utils/formatters';


const LANGUAGES = ['en', 'tr'];

/**
 * BalanceSettings — Three sections:
 *   1. Add Balance: Draggable currency list with per-currency amount inputs.
 *   2. Main Display Currency: Radio selector for the green card on Dashboard.
 *   3. Language / Dil: Switch between English and Turkish.
 *
 * All text labels are driven by the active language (useTranslation).
 */
export default function BalanceSettings({ showToast }) {
  const {
    balances, settings, currencyOrder,
    addBalance, setMainCurrency, setLanguage, setCurrencyOrder,
  } = useApp();
  const { t, lang } = useTranslation();

  // Per-currency form state
  const [amounts,      setAmounts]      = useState({ USD: '', EUR: '', TL: '', RON: '' });
  const [descriptions, setDescriptions] = useState({ USD: '', EUR: '', TL: '', RON: '' });
  const [loadingCurrency, setLoadingCurrency] = useState(null);

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

  // Desktop HTML5 drag
  const handleDragStart = (idx) => { dragRef.current.from = idx; dragRef.current.to = idx; setDraggingIdx(idx); };
  const handleDragOver  = (e, idx) => { e.preventDefault(); if (dragRef.current.to !== idx) { dragRef.current.to = idx; setOverIdx(idx); } };
  const handleDrop      = (e) => { e.preventDefault(); commitReorder(); };
  const handleDragEnd   = () => commitReorder();

  // Mobile touch start
  const handleTouchStart = (e, idx) => { dragRef.current.from = idx; dragRef.current.to = idx; setDraggingIdx(idx); };
  const handleTouchEnd   = () => commitReorder();

  // Non-passive touchmove listener (must be added via useEffect, not React props)
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onTouchMove = (e) => {
      if (dragRef.current.from === null) return;
      e.preventDefault();
      const touch = e.touches[0];
      const cards = el.querySelectorAll('[data-drag-card]');
      for (let i = 0; i < cards.length; i++) {
        const rect = cards[i].getBoundingClientRect();
        if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          if (dragRef.current.to !== i) { dragRef.current.to = i; setOverIdx(i); }
          break;
        }
      }
    };

    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, []);

  // ─── Form Handlers ────────────────────────────────────────────────────────

  const handleAmountChange = (currency, value) => {
    if (isValidDecimalInput(value)) {
      setAmounts((prev) => ({ ...prev, [currency]: value }));
    }
  };

  const handleAddBalance = (currency) => {
    const normalized    = normalizeAmount(amounts[currency]);
    const numericAmount = parseFloat(normalized);

    if (!numericAmount || numericAmount <= 0) {
      showToast(t.settings.toastInvalidAmount(currency), 'error');
      return;
    }

    setLoadingCurrency(currency);
    const description = descriptions[currency].trim() || t.settings.addBalanceTitle;
    const success     = addBalance(numericAmount, currency, description);

    if (success) {
      showToast(
        t.settings.toastBalanceAdded(
          getCurrencySymbol(currency),
          numericAmount.toFixed(2),
          currency
        ),
        'success'
      );
      setAmounts((prev)      => ({ ...prev, [currency]: '' }));
      setDescriptions((prev) => ({ ...prev, [currency]: '' }));
    } else {
      showToast(t.settings.toastFailed, 'error');
    }

    setTimeout(() => setLoadingCurrency(null), 300);
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const currencyColors = {
    USD: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    EUR: { bg: 'bg-blue-500/15',    text: 'text-blue-400'    },
    TL:  { bg: 'bg-orange-500/15',  text: 'text-orange-400'  },
    RON: { bg: 'bg-purple-500/15',  text: 'text-purple-400'  },
  };

  return (
    <div className="scroll-area no-scrollbar h-full px-4 py-4 page-enter space-y-6">

      {/* ══════════════════════════════════════════
          Section 1: Add Balance (Draggable)
      ══════════════════════════════════════════ */}
      <section aria-labelledby="add-balance-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="add-balance-heading" className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {t.settings.addBalanceTitle}
          </h2>
          <span className="text-[10px] text-slate-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            {t.settings.dragHint}
          </span>
        </div>

        <div ref={listRef} className="space-y-2.5" onTouchEnd={handleTouchEnd}>
          {currencyOrder.map((currency, index) => {
            const colors         = currencyColors[currency];
            const currentBalance = balances[currency] ?? 0;
            const isNegative     = currentBalance < 0;
            const isLoading      = loadingCurrency === currency;
            const isDragging     = draggingIdx === index;
            const isOver         = overIdx === index && draggingIdx !== index;

            return (
              <div
                key={currency}
                id={`balance-card-${currency}`}
                data-drag-card
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e)  => handleDragOver(e, index)}
                onDrop={(e)      => handleDrop(e)}
                onDragEnd={handleDragEnd}
                className={`
                  glass-card rounded-2xl p-4 space-y-3 select-none
                  transition-all duration-150
                  ${isDragging ? 'opacity-40 scale-[0.97]' : 'opacity-100 scale-100'}
                  ${isOver ? 'border border-green-400/50 shadow-glow' : ''}
                `}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                {/* Card header: drag handle + currency info + balance */}
                <div className="flex items-center gap-3">
                  {/* Drag handle */}
                  <div
                    className="flex flex-col gap-[3px] px-1 py-2 shrink-0 cursor-grab active:cursor-grabbing touch-none"
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    role="button"
                    tabIndex={-1}
                    aria-label={`Drag to reorder ${currency}`}
                  >
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="block w-4 h-[2.5px] bg-slate-600 rounded-full" />
                    ))}
                  </div>

                  {/* Currency icon */}
                  <div className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                    <span className={`text-xs font-bold ${colors.text}`}>
                      {CURRENCY_META[currency].symbol}
                    </span>
                  </div>

                  {/* Currency name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{currency}</p>
                    <p className="text-[10px] text-slate-500">
                      {t.settings.currencyNames[currency]}
                    </p>
                  </div>

                  {/* Balance */}
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-500">{t.settings.balanceLabel}</p>
                    <p className={`text-sm font-bold ${isNegative ? 'text-red-400' : 'text-white'}`}>
                      {formatAmount(currentBalance, currency)}
                    </p>
                  </div>
                </div>

                {/* Amount + Add button */}
                <div className="flex gap-2">
                  <input
                    id={`${formBaseId}-amount-${currency}`}
                    type="text"
                    inputMode="decimal"
                    placeholder={t.settings.amountPlaceholder}
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
                    className="
                      shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold text-white
                      bg-green-600 hover:bg-green-500 active:bg-green-700
                      transition-all duration-150 btn-press disabled:opacity-60
                    "
                    aria-label={`Add balance to ${currency}`}
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      t.settings.addButton
                    )}
                  </button>
                </div>

                {/* Note input */}
                <input
                  id={`${formBaseId}-desc-${currency}`}
                  type="text"
                  placeholder={t.settings.notePlaceholder}
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
                  aria-label={`Note for ${currency}`}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          Section 2: Main Display Currency
      ══════════════════════════════════════════ */}
      <section aria-labelledby="main-currency-heading">
        <h2 id="main-currency-heading" className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
          {t.settings.mainCurrencyTitle}
        </h2>
        <p className="text-xs text-slate-600 mb-3">{t.settings.mainCurrencySubtitle}</p>

        <div className="glass-card rounded-2xl p-2 space-y-1" role="radiogroup" aria-labelledby="main-currency-heading">
          {currencyOrder.map((currency) => {
            const isSelected = settings.mainDisplayCurrency === currency;
            const colors     = currencyColors[currency];

            return (
              <button
                key={currency}
                id={`main-currency-${currency}`}
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setMainCurrency(currency);
                  showToast(t.settings.toastMainCurrency(currency), 'info');
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
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150
                    ${isSelected ? 'border-green-500 bg-green-500' : 'border-slate-600'}`}
                  aria-hidden="true"
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>

                {/* Icon + label */}
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
                    <p className="text-[10px] text-slate-600">{t.settings.currencyNames[currency]}</p>
                  </div>
                </div>

                {/* Balance preview */}
                <p className="text-xs text-slate-500 font-medium">
                  {formatAmount(balances[currency] ?? 0, currency)}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          Section 3: Language / Dil
          Label stays bilingual in both locales so
          users of either language can find this.
      ══════════════════════════════════════════ */}
      <section aria-labelledby="language-heading">
        <h2 id="language-heading" className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          {t.settings.languageTitle}
        </h2>

        <div className="glass-card rounded-2xl p-2 space-y-1" role="radiogroup" aria-labelledby="language-heading">
          {LANGUAGES.map((code) => {
            const isSelected = lang === code;
            const label = code === 'en'
              ? 'English 🇬🇧'
              : 'Türkçe 🇹🇷';

            return (
              <button
                key={code}
                id={`language-btn-${code}`}
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setLanguage(code);
                  // Toast is always shown in the newly selected language
                  showToast(
                    code === 'tr'
                      ? t.settings.toastLanguageTR
                      : t.settings.toastLanguageEN,
                    'info'
                  );
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
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150
                    ${isSelected ? 'border-green-500 bg-green-500' : 'border-slate-600'}`}
                  aria-hidden="true"
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>

                {/* Language label */}
                <p className={`flex-1 text-left text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                  {label}
                </p>

                {/* Active badge */}
                {isSelected && (
                  <span className="text-[10px] font-semibold text-green-400 bg-green-600/15 px-2 py-0.5 rounded-full">
                    {code === 'en' ? 'Active' : 'Aktif'}
                  </span>
                )}
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
