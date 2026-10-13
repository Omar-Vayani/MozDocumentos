import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
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

// Portuguese ships with the app; English is loaded on demand (smaller first load).
void i18n.use(initReactI18next).init({
  resources: { pt: { translation: pt } },
  lng: 'pt',
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Loads a language's strings if needed, then switches to it. */
export async function loadLanguage(lang: Lang): Promise<void> {
  if (lang === 'en' && !i18n.hasResourceBundle('en', 'translation')) {
    const en = (await import('./en')).default;
    i18n.addResourceBundle('en', 'translation', en);
  }
  await i18n.changeLanguage(lang);
}

/** Resolves once the saved language is ready (call before the first render). */
export const languageReady: Promise<void> = typeof window === 'undefined' ? Promise.resolve() : loadLanguage(initialLang()).catch(() => undefined);

export default i18n;
