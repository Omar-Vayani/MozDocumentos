import { chromium } from '@playwright/test';
const OUT = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1600 } });
for (const id of ['carta-oficial', 'contrato-indeterminado', 'recibo-de-salario']) {
  await p.goto('http://localhost:5173/documentos/' + id);
  await p.waitForTimeout(2000);
  await p.locator('main form, main').first().screenshot({ path: `${OUT}/form-${id}.png`, clip: undefined }).catch(async () => p.screenshot({ path: `${OUT}/form-${id}.png` }));
}
await b.close();
