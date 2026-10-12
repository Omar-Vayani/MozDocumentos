import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
page.on('console', (m) => { if (m.type()==='error'||m.type()==='warning') console.log('console', m.text().slice(0, 300)); });
const t0=Date.now();
await page.goto('http://localhost:5173/documentos/recibo-de-salario', { waitUntil: 'networkidle' });
for (let i=0;i<40;i++){ const c = await page.locator('canvas').count(); if (c) { console.log('canvas after ms', Date.now()-t0); break;} await page.waitForTimeout(500); }
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/claude-0/-home-user-MozDocumentos/fc8df599-9b12-593e-b5f6-31f4c3d9913a/scratchpad/shots/editor2.png' });
await browser.close();
