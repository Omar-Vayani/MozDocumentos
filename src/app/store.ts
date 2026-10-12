// Small UI preferences, persisted in localStorage. Larger data lives in IndexedDB.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n, { initialLang, type Lang } from '@/i18n';

export type ThemePref = 'system' | 'light' | 'dark';

type Prefs = {
  lang: Lang;
  theme: ThemePref;
  activeProfileId: string | null;
  readingAid: boolean;
  setLang: (l: Lang) => void;
  setTheme: (t: ThemePref) => void;
  setActiveProfile: (id: string | null) => void;
  setReadingAid: (v: boolean) => void;
};

export function applyTheme(t: ThemePref) {
  const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      lang: initialLang(),
      theme: 'system',
      activeProfileId: null,
      readingAid: false,
      setLang: (lang) => {
        void i18n.changeLanguage(lang);
        document.documentElement.lang = lang === 'pt' ? 'pt-MZ' : 'en';
        set({ lang });
      },
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setActiveProfile: (activeProfileId) => set({ activeProfileId }),
      setReadingAid: (readingAid) => set({ readingAid }),
    }),
    { name: 'dmz-prefs', version: 1 },
  ),
);

/** Pick the PT or EN string of a bilingual label. */
export function useL10n() {
  const lang = usePrefs((s) => s.lang);
  return (v: { pt: string; en: string } | undefined) => (v ? v[lang] ?? v.pt : '');
}
