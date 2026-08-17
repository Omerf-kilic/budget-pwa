import { useState, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Reports from './pages/Reports';
import BalanceSettings from './pages/BalanceSettings';

/**
 * App — Root component.
 * Manages page routing (simple state-based, no React Router) and toast state.
 * Wraps everything in the AppProvider for global state.
 */
export default function App() {
  // Active page key — drives which page component is rendered
  const [activePage, setActivePage] = useState('dashboard');

  // Toast notification state
  const [toast, setToast] = useState({
    visible:  false,
    message:  '',
    type:     'success', // 'success' | 'error' | 'info'
  });

  /**
   * Shows a toast notification. Called by page components.
   *
   * @param {string} message
   * @param {'success'|'error'|'info'} type
   */
  const showToast = useCallback((message, type = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  /**
   * Hides the toast notification (called by Toast component after animation).
   */
  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  /**
   * Renders the currently active page component.
   * Each page receives showToast if it needs to display notifications.
   */
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard showToast={showToast} />;
      case 'history':
        return <History />;
      case 'reports':
        return <Reports />;
      case 'balance-settings':
        return <BalanceSettings showToast={showToast} />;
      default:
        return <Dashboard showToast={showToast} />;
    }
  };

  return (
    <AppProvider>
      <AppShell
        activePage={activePage}
        onNavigate={setActivePage}
        toast={toast}
        onHideToast={hideToast}
      >
        {renderPage()}
      </AppShell>
    </AppProvider>
  );
}
