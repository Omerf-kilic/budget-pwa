# 💰 Budget Tracker PWA

A personal, mobile-first budget tracking Progressive Web App (PWA) built with **React + Vite + Tailwind CSS**. Designed to be installed on your iPhone via Safari's "Add to Home Screen" for a fully native app experience — no Safari UI, no App Store needed.

---

## ✨ Features

- **4 Currencies**: USD, EUR, TL, RON — balances kept completely separate, no conversion
- **Quick Add Expense**: Large tap-friendly input on the Dashboard
- **Transaction History**: Full log with delete (tap-to-confirm safety)
- **Reports**: Daily / Weekly / Monthly expense totals, broken down per currency
- **Balance & Settings**: Add funds to any currency; choose main display currency
- **100% Local**: All data lives in `localStorage` — no backend, no sign-up, no tracking
- **iOS PWA**: Fullscreen, no Safari chrome, safe area aware, no pinch-zoom
- **Offline Ready**: Workbox service worker caches all assets for offline use

---

## 🚀 Getting Started

### Prerequisites

Install [Node.js](https://nodejs.org/) (v18 or newer recommended).

### Installation

```bash
# Navigate to the project directory
cd budget-pwa

# Install all dependencies
npm install

# Start the development server
npm run dev
```

Then open `http://localhost:5173` in your browser (or on your phone via your local network IP).

### Build for Production

```bash
npm run build

# Preview the production build locally
npm run preview
```

---

## 📱 Installing on iPhone (iOS PWA)

1. Open Safari on your iPhone and go to the app URL (either local network or a deployed URL)
2. Tap the **Share** button (rectangle with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Confirm by tapping **"Add"** in the top-right corner
5. The app now appears on your home screen — tap it to launch in fullscreen mode

> **Note**: The service worker and PWA features only activate on the **production build** (`npm run build`). The dev server simulates this with `devOptions: { enabled: true }` in `vite.config.js`.

---

## 🏗️ Project Structure

```
budget-pwa/
├── public/
│   └── icons/               # PWA icons (192, 512, apple-touch-icon)
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx       # Top header + page wrapper
│   │   │   └── HamburgerMenu.jsx  # Slide-in navigation drawer
│   │   └── ui/
│   │       └── Toast.jsx          # Toast notification
│   ├── pages/
│   │   ├── Dashboard.jsx          # Main screen
│   │   ├── History.jsx            # Transaction log
│   │   ├── Reports.jsx            # Expense summaries
│   │   └── BalanceSettings.jsx    # Add balance + settings
│   ├── context/
│   │   └── AppContext.jsx         # Global state + localStorage
│   ├── hooks/
│   │   └── useLocalStorage.js     # localStorage sync hook
│   ├── utils/
│   │   └── formatters.js          # Currency & date utilities
│   ├── App.jsx                    # Root component + routing
│   ├── main.jsx                   # Entry point + SW registration
│   └── index.css                  # Global styles + Tailwind
├── index.html                     # iOS PWA meta tags
├── vite.config.js                 # Vite + PWA plugin config
├── tailwind.config.js
└── postcss.config.js
```

---

## 💾 Data Structure

All data is stored in `localStorage` under three keys:

```js
// budget_balances
{ USD: 0, EUR: 0, TL: 0, RON: 0 }

// budget_transactions
[{
  id: "uuid",
  type: "expense" | "income",
  amount: Number,
  currency: "USD" | "EUR" | "TL" | "RON",
  description: String,
  date: Number  // Date.now() timestamp
}]

// budget_settings
{ mainDisplayCurrency: "RON" }
```

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Build tool |
| Tailwind CSS | 3 | Utility-first styling |
| vite-plugin-pwa | 0.21 | PWA manifest + Workbox SW |
| uuid | 10 | Unique transaction IDs |

---

## 🔧 Customization

- **Add a new currency**: Edit `CURRENCIES` and `CURRENCY_META` in [`src/utils/formatters.js`](./src/utils/formatters.js)
- **Change app theme color**: Update `theme_color` in `vite.config.js` and `--color-green-card` in `index.css`
- **Adjust toast duration**: Change the `2000` ms timeout in `src/components/ui/Toast.jsx`
