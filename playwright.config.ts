import { defineConfig, devices } from '@playwright/test';

// PW_DEV=1 runs against an already running `npm run dev` (port 5173) instead of a production build.
const DEV = process.env.PW_DEV === '1';

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 30_000, toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: DEV ? 'http://localhost:5173' : 'http://localhost:4173',
    locale: 'pt-PT',
    timezoneId: 'Africa/Maputo',
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: DEV
    ? undefined
    : {
        command: 'npm run build && npx vite preview --port 4173 --strictPort',
        port: 4173,
        timeout: 240_000,
        reuseExistingServer: true,
      },
});
