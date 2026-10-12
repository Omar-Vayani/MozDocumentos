import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './i18n';
import './app/index.css';
import { router } from './app/router';
import { applyTheme, usePrefs } from './app/store';
import { registerPwa } from './app/pwa';

applyTheme(usePrefs.getState().theme);
document.documentElement.lang = usePrefs.getState().lang === 'en' ? 'en' : 'pt-MZ';
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(usePrefs.getState().theme));

// Scroll to top and move focus to main content on route change (screen readers).
router.subscribe((state) => {
  if (state.navigation.state === 'idle' && !state.location.hash) {
    window.scrollTo(0, 0);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

registerPwa();
