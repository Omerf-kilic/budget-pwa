import { useState } from 'react';
import HamburgerMenu from './HamburgerMenu';
import Toast from '../ui/Toast';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * AppShell — The main layout frame.
 * Page title in the top bar is driven by the active language.
 */
export default function AppShell({
  activePage,
  onNavigate,
  toast,
  onHideToast,
  children,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  const pageTitle = t.pageTitles?.[activePage] ?? t.shell.appName;

  return (
    <div className="flex flex-col h-full w-full bg-[#0f172a] overflow-hidden">
      {/* ── Top Header Bar ─────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/5"
        style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(8px)' }}
      >
        {/* Hamburger button */}
        <button
          id="hamburger-btn"
          onClick={() => setIsMenuOpen(true)}
          className="w-10 h-10 flex flex-col justify-center gap-1.5 items-center rounded-xl hover:bg-white/5 transition-colors btn-press"
          aria-label="Open navigation menu"
          aria-expanded={isMenuOpen}
          aria-controls="nav-drawer"
        >
          <span className="block w-5 h-0.5 bg-slate-300 rounded-full" />
          <span className="block w-4 h-0.5 bg-slate-300 rounded-full self-start ml-2.5" />
          <span className="block w-5 h-0.5 bg-slate-300 rounded-full" />
        </button>

        {/* Page title */}
        <h1 className="text-sm font-semibold text-white tracking-wide">
          {pageTitle}
        </h1>

        {/* Right spacer (keeps title centered) */}
        <div className="w-10" aria-hidden="true" />
      </header>

      {/* ── Page Content ──────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>

      {/* ── Navigation Drawer ─────────────────────────────────── */}
      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activePage={activePage}
        onNavigate={onNavigate}
      />

      {/* ── Toast Notification ────────────────────────────────── */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={onHideToast}
      />
    </div>
  );
}
