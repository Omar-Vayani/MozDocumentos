import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import pt from './pt';

export type Lang = 'pt' | 'en';

export function initialLang(): Lang {
  try {
    const saved = JSON.parse(localStorage.getItem('dmz-prefs') || '{}')?.state?.lang;
    if (saved === 'pt' || saved === 'en') return saved;
  } catch {
    /* ignore */
  }
  return 'pt';
}

void i18n.use(initReactI18next).init({
  resources: { pt: { translation: pt }, en: { translation: en } },
  lng: typeof window === 'undefined' ? 'pt' : initialLang(),
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
