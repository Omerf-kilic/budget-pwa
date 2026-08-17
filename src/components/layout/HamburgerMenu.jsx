import { useTranslation } from '../../hooks/useTranslation';

/**
 * HamburgerMenu — Slide-in navigation drawer from the left.
 * All labels are driven by the active language via useTranslation.
 */
export default function HamburgerMenu({ isOpen, onClose, activePage, onNavigate }) {
  const { t } = useTranslation();

  const navItems = [
    {
      key:   'dashboard',
      label: t.nav.dashboard,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      key:   'history',
      label: t.nav.history,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    {
      key:   'reports',
      label: t.nav.reports,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      key:   'balance-settings',
      label: t.nav.balanceSettings,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      ),
    },
  ];

  const handleNavigate = (pageKey) => {
    onNavigate(pageKey);
    onClose();
  };

  return (
    <>
      {/* Dark overlay backdrop */}
      <div
        id="menu-overlay"
        className={`overlay fixed inset-0 bg-black/60 z-40 ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <nav
        id="nav-drawer"
        role="navigation"
        aria-label="Main navigation"
        className="menu-drawer fixed top-0 left-0 h-full w-72 z-50 flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 'calc(env(safe-area-inset-top) + 0px)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center shadow-glow">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">{t.shell.appName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t.shell.appSubtitle}</p>
            </div>
          </div>
          <button
            id="menu-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors btn-press"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation items */}
        <ul className="flex-1 px-3 py-4 space-y-1" role="list">
          {navItems.map((item) => {
            const isActive = activePage === item.key;
            return (
              <li key={item.key}>
                <button
                  id={`nav-${item.key}`}
                  onClick={() => handleNavigate(item.key)}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl
                    text-sm font-medium transition-all duration-150 btn-press
                    ${isActive
                      ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={isActive ? 'text-green-400' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/5">
          <p className="text-xs text-slate-600 text-center">{t.shell.footerText}</p>
        </div>
      </nav>
    </>
  );
}
