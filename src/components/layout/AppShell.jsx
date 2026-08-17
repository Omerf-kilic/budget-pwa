import { useState } from 'react';
import HamburgerMenu from './HamburgerMenu';
import Toast from '../ui/Toast';

// Page title mapping
const PAGE_TITLES = {
  'dashboard':        'Dashboard',
  'history':          'History',
  'reports':          'Reports',
  'balance-settings': 'Balance & Settings',
};

/**
 * AppShell — The main layout frame.
 * Manages the hamburger menu state and page-level navigation.
 * Renders the top header bar, slide-in drawer, and the active page content.
 *
 * @param {object} props
 * @param {string}   props.activePage   - Current page key
 * @param {function} props.onNavigate   - Callback(pageKey) to change pages
 * @param {object}   props.toast        - { visible, message, type }
 * @param {function} props.onHideToast  - Callback to clear toast
 * @param {React.ReactNode} props.children - The active page component
 */
export default function AppShell({
  activePage,
  onNavigate,
  toast,
  onHideToast,
  children,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          {PAGE_TITLES[activePage] ?? 'Budget'}
        </h1>

        {/* Right side spacer (keeps title centered) */}
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
