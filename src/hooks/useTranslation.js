import { useApp } from '../context/AppContext';
import { translations } from '../i18n/translations';

/**
 * useTranslation — Returns the translation dictionary for the current language.
 *
 * Usage:
 *   const { t, lang } = useTranslation();
 *   t.dashboard.saveButton        // → 'Save Expense' or 'Harcamayı Kaydet'
 *   t.dashboard.toastSuccess('$', '10.50')  // → 'Expense saved! -$10.50'
 *
 * @returns {{ t: object, lang: string }}
 */
export function useTranslation() {
  const { settings } = useApp();
  const lang = settings?.language ?? 'en';
  // Fallback to English if an unknown language code is stored
  const t = translations[lang] ?? translations.en;
  return { t, lang };
}
