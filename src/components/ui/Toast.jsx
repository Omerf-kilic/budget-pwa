import { useEffect, useRef, useState } from 'react';

/**
 * Toast notification component.
 * Shows a brief message that auto-dismisses after a given duration.
 *
 * @param {object} props
 * @param {string}  props.message  - Text to display
 * @param {'success'|'error'|'info'} props.type - Visual variant
 * @param {boolean} props.visible  - Whether the toast should be shown
 * @param {function} props.onHide  - Callback when toast finishes hiding
 */
export default function Toast({ message, type = 'success', visible, onHide }) {
  const [animClass, setAnimClass] = useState('');
  const hideTimer = useRef(null);

  useEffect(() => {
    if (visible) {
      setAnimClass('toast-visible');

      // Start hiding after 2 seconds
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        setAnimClass('toast-hiding');
        // Wait for hide animation to finish, then notify parent
        setTimeout(() => {
          setAnimClass('');
          onHide?.();
        }, 220);
      }, 2000);
    }

    return () => clearTimeout(hideTimer.current);
  }, [visible, onHide]);

  // Color map for toast types
  const colorMap = {
    success: 'bg-green-600 border-green-500 text-white',
    error:   'bg-red-600   border-red-500   text-white',
    info:    'bg-blue-600  border-blue-500  text-white',
  };

  const iconMap = {
    success: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`toast ${animClass}`}
    >
      <div
        className={`
          flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg
          border text-sm font-medium
          ${colorMap[type] ?? colorMap.info}
        `}
      >
        {iconMap[type]}
        <span>{message}</span>
      </div>
    </div>
  );
}
