// Dev-only: @vitejs/plugin-react injects React Refresh code that expects
// `window`. Workers have no window, so alias it before any TSX module loads.
const g = self as unknown as Record<string, unknown>;
if (import.meta.env.DEV && typeof g.window === 'undefined') {
  g.window = self;
  g.__vite_plugin_react_preamble_installed__ = true;
  g.$RefreshReg$ = () => {};
  g.$RefreshSig$ = () => (type: unknown) => type;
}
export {};
