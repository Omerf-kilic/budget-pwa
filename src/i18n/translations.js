/**
 * translations.js — Full UI translation dictionary for EN and TR.
 *
 * Strings that require dynamic values use arrow functions.
 * Example: t.dashboard.toastSuccess('$', '10.50') → 'Expense saved! -$10.50'
 *
 * The 'language / Dil' label is intentionally kept bilingual in both locales
 * so speakers of either language can always find the setting.
 */

export const translations = {
  // ─── English ──────────────────────────────────────────────────────────────
  en: {
    // App shell
    shell: {
      appName:     'Budget',
      appSubtitle: 'Tracker',
      footerText:  'Budget Tracker v1.0 · All data stored locally',
    },

    // Navigation drawer items
    nav: {
      dashboard:       'Dashboard',
      history:         'Transaction History',
      reports:         'Reports',
      balanceSettings: 'Balance & Settings',
    },

    // Page header titles (shown in the top bar)
    pageTitles: {
      dashboard:        'Dashboard',
      history:          'History',
      reports:          'Reports',
      'balance-settings': 'Balance & Settings',
    },

    // Dashboard screen
    dashboard: {
      balanceSuffix:       'Balance',
      mainCurrencyBadge:   'Main Currency',
      showBalance:         'Show balance',
      hideBalance:         'Hide balance',
      quickAddLabel:       'Quick Add Expense',
      amountPlaceholder:   '0,00',
      descPlaceholder:     'Description (e.g. Coffee, Rent…)',
      saveButton:          'Save Expense',
      toastSuccess:        (symbol, amount) => `Expense saved! -${symbol}${amount}`,
      toastInvalidAmount:  'Please enter a valid amount.',
      toastFailed:         'Failed to save expense.',
    },

    // Transaction History screen
    history: {
      title:          'All Transactions',
      totalSuffix:    'total',
      emptyTitle:     'No transactions yet',
      emptySubtitle:  'Add an expense from the Dashboard to get started.',
      deleteConfirm:  'Tap again to confirm',
      deleteLabel:    (desc) => `Delete transaction: ${desc}`,
    },

    // Reports screen
    reports: {
      periodAriaLabel: 'Select reporting period',
      tabToday:        'Today',
      tabWeek:         'This Week',
      tabMonth:        'This Month',
      sectionTitle:    'Expenses',
      txSingular:      'transaction',
      txPlural:        'transactions',
      totalSpent:      'Total Spent',
      avgPerTx:        'Avg / tx',
      byCurrency:      'By Currency',
      emptyTitle:      'No expenses for this period',
      emptySubtitle:   'Go to Dashboard to start tracking.',
    },

    // Balance & Settings screen
    settings: {
      addBalanceTitle:   'Add Balance',
      dragHint:          'Drag to reorder',
      balanceLabel:      'Balance',
      amountPlaceholder: 'Amount (e.g. 10,50)',
      notePlaceholder:   'Note (optional)',
      addButton:         '+ Add',
      mainCurrencyTitle:    'Main Display Currency',
      mainCurrencySubtitle: "This currency's balance is shown on the Dashboard card.",
      languageTitle:     'Language / Dil',
      currencyNames: {
        USD: 'US Dollar',
        EUR: 'Euro',
        TL:  'Turkish Lira',
        RON: 'Romanian Leu',
      },
      toastBalanceAdded:   (symbol, amount, currency) => `+${symbol}${amount} added to ${currency}`,
      toastInvalidAmount:  (currency) => `Enter a valid amount for ${currency}.`,
      toastFailed:         'Failed to add balance.',
      toastMainCurrency:   (currency) => `Main currency set to ${currency}`,
      toastLanguageEN:     'Language set to English 🇬🇧',
      toastLanguageTR:     'Dil Türkçe olarak ayarlandı 🇹🇷',
    },

    // Language names (for the selector)
    languages: {
      en: 'English 🇬🇧',
      tr: 'Türkçe 🇹🇷',
    },
  },

  // ─── Turkish (Türkçe) ─────────────────────────────────────────────────────
  tr: {
    // App shell
    shell: {
      appName:     'Bütçe',
      appSubtitle: 'Takip',
      footerText:  'Bütçe Takip v1.0 · Tüm veriler yerel olarak saklanır',
    },

    // Navigation drawer items
    nav: {
      dashboard:       'Ana Sayfa',
      history:         'İşlem Geçmişi',
      reports:         'Raporlar',
      balanceSettings: 'Bakiye & Ayarlar',
    },

    // Page header titles
    pageTitles: {
      dashboard:        'Ana Sayfa',
      history:          'Geçmiş',
      reports:          'Raporlar',
      'balance-settings': 'Bakiye & Ayarlar',
    },

    // Dashboard screen
    dashboard: {
      balanceSuffix:       'Bakiyesi',
      mainCurrencyBadge:   'Ana Para Birimi',
      showBalance:         'Bakiyeyi göster',
      hideBalance:         'Bakiyeyi gizle',
      quickAddLabel:       'Hızlı Harcama Ekle',
      amountPlaceholder:   '0,00',
      descPlaceholder:     'Açıklama (ör. Kahve, Kira…)',
      saveButton:          'Harcamayı Kaydet',
      toastSuccess:        (symbol, amount) => `Harcama kaydedildi! -${symbol}${amount}`,
      toastInvalidAmount:  'Lütfen geçerli bir miktar girin.',
      toastFailed:         'Harcama kaydedilemedi.',
    },

    // Transaction History screen
    history: {
      title:          'Tüm İşlemler',
      totalSuffix:    'toplam',
      emptyTitle:     'Henüz işlem yok',
      emptySubtitle:  "Başlamak için Ana Sayfa'dan bir harcama ekleyin.",
      deleteConfirm:  'Onaylamak için tekrar dokunun',
      deleteLabel:    (desc) => `İşlemi sil: ${desc}`,
    },

    // Reports screen
    reports: {
      periodAriaLabel: 'Raporlama dönemi seçin',
      tabToday:        'Bugün',
      tabWeek:         'Bu Hafta',
      tabMonth:        'Bu Ay',
      sectionTitle:    'Harcamalar',
      txSingular:      'işlem',
      txPlural:        'işlem',
      totalSpent:      'Toplam Harcama',
      avgPerTx:        'İşlem Başı Ort.',
      byCurrency:      'Para Birimine Göre',
      emptyTitle:      'Bu dönemde harcama yok',
      emptySubtitle:   "Takibe başlamak için Ana Sayfa'ya gidin.",
    },

    // Balance & Settings screen
    settings: {
      addBalanceTitle:   'Bakiye Ekle',
      dragHint:          'Sıralamak için sürükle',
      balanceLabel:      'Bakiye',
      amountPlaceholder: 'Miktar (ör. 10,50)',
      notePlaceholder:   'Not (isteğe bağlı)',
      addButton:         '+ Ekle',
      mainCurrencyTitle:    'Ana Görüntüleme Para Birimi',
      mainCurrencySubtitle: 'Bu para biriminin bakiyesi Ana Sayfa kartında gösterilir.',
      languageTitle:     'Language / Dil',
      currencyNames: {
        USD: 'Amerikan Doları',
        EUR: 'Euro',
        TL:  'Türk Lirası',
        RON: 'Rumen Leyi',
      },
      toastBalanceAdded:   (symbol, amount, currency) => `${currency} hesabına +${symbol}${amount} eklendi`,
      toastInvalidAmount:  (currency) => `${currency} için geçerli bir miktar girin.`,
      toastFailed:         'Bakiye eklenemedi.',
      toastMainCurrency:   (currency) => `Ana para birimi ${currency} olarak ayarlandı`,
      toastLanguageEN:     'Language set to English 🇬🇧',
      toastLanguageTR:     'Dil Türkçe olarak ayarlandı 🇹🇷',
    },

    // Language names
    languages: {
      en: 'English 🇬🇧',
      tr: 'Türkçe 🇹🇷',
    },
  },
};

/** All supported language codes */
export const SUPPORTED_LANGUAGES = ['en', 'tr'];
