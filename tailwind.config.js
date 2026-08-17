/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // App brand greens — used for balance card
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // App surface blues — used for quick-add section
        surface: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Dark slate background shades
        slate: {
          850: '#0f172a',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'monospace'],
      },
      screens: {
        xs: '375px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.35)',
        'card-lg': '0 8px 40px rgba(0,0,0,0.45)',
        glow: '0 0 20px rgba(22,163,74,0.35)',
        'glow-blue': '0 0 20px rgba(37,99,235,0.35)',
      },
    },
  },
  plugins: [],
};
