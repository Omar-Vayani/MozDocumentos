import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = ['/', '/documentos', '/assistente', '/assistente?r=empresa/disciplinar/grave', '/processos/despedimento-justa-causa', '/documentos/nota-de-culpa', '/meus-documentos', '/perfis', '/perfis/novo?tipo=empresa', '/perfis/novo?tipo=publica', '/documentos/peticao-inicial', '/documentos/oficio', '/assistente?r=advogado', '/pessoas', '/definicoes', '/sobre', '/termos', '/privacidade', '/ferramentas', '/ferramentas/recibos-em-lote'];

for (const path of PAGES) {
  test(`no WCAG 2.2 AA violations on ${path}`, async ({ page }, info) => {
    test.skip(info.project.name === 'mobile' && path.startsWith('/perfis/novo'), 'same as desktop');
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      // The PDF preview canvas is an image of the document; its text is in the downloadable PDF.
      .exclude('canvas')
      .analyze();
    const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`);
    expect(summary).toEqual([]);
  });
}

test('the PDF engine runs in a web worker', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'desktop only');
  const workers: string[] = [];
  page.on('worker', (w) => workers.push(w.url()));
  const warnings: string[] = [];
  page.on('console', (m) => m.text().includes('main thread') && warnings.push(m.text()));
  await page.goto('/documentos/recibo-de-salario');
  await expect(page.locator('canvas').first()).toBeVisible();
  expect(workers.some((u) => /pdf\.worker/.test(u) && !/pdfjs|pdf\.worker\.min/.test(u))).toBe(true);
  expect(warnings).toEqual([]);
});
