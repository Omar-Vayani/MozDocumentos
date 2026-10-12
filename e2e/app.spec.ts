import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function noHorizontalScroll(page: Page) {
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw, 'horizontal scroll').toBeLessThanOrEqual(cw);
}

test.describe('layout at 320 px', () => {
  test.use({ viewport: { width: 320, height: 640 } });
  for (const path of ['/', '/documentos', '/assistente', '/meus-documentos', '/perfis', '/pessoas', '/definicoes', '/sobre', '/processos/despedimento-justa-causa', '/documentos/recibo-de-salario', '/perfis/novo?tipo=empresa']) {
    test(`no horizontal scroll on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await noHorizontalScroll(page);
      await expect(page.getByText('Este serviço não é oficial e não substitui aconselhamento jurídico.').first()).toBeAttached();
    });
  }
});

test('search finds documents in Portuguese, without accents and in English', async ({ page }) => {
  await page.goto('/documentos');
  const search = page.getByLabel('Pesquisar documentos');
  for (const [q, title] of [
    ['despedir', 'Acusar formalmente de uma falta'],
    ['rescisao', 'Sair do emprego — para o trabalhador'],
    ['payslip', 'Recibo de salário'],
  ]) {
    await search.fill(q);
    const results = page.locator('#catalog-results li h3');
    const top3 = (await results.allTextContents()).slice(0, 3);
    expect(top3, q).toContain(title);
  }
});

test('assistant reaches the nota de culpa in 3 taps and shows the process', async ({ page }) => {
  await page.goto('/assistente');
  await page.getByRole('button', { name: /A minha empresa/ }).click();
  await page.getByRole('button', { name: /Disciplinar um trabalhador/ }).click();
  await page.getByRole('button', { name: /Uma falta grave/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Acusar formalmente de uma falta');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Qual é a situação?');
  await page.goForward();
  await page.getByRole('link', { name: 'Ver os passos e prazos' }).click();
  await expect(page.getByText('Prazo de resposta do trabalhador')).toBeVisible();
});

test('editor: fill, preview and download a payslip', async ({ page }, info) => {
  await page.goto('/documentos/recibo-de-salario');
  await page.getByLabel('Nome completo').fill('Maria Fernanda Cossa');
  await page.getByLabel('Salário base').fill('25.000,00');
  if (info.project.name === 'mobile') await page.getByRole('tab', { name: 'Pré-visualizar' }).click();
  await expect(page.locator('canvas').first()).toBeVisible();
  if (info.project.name === 'mobile') await page.getByRole('tab', { name: 'Preencher' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /PDF/ }).first().click()]);
  expect(download.suggestedFilename()).toMatch(/^recibo-de-vencimento-maria-fernanda-cossa-\d{4}-\d{2}-\d{2}\.pdf$/);
  const pdf = readFileSync((await download.path())!);
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  await page.goto('/meus-documentos?tab=finals');
  await expect(page.getByText('Recibo de salário').first()).toBeVisible();
});

test('editor: required fields show an error summary', async ({ page }) => {
  await page.goto('/documentos/nota-de-culpa');
  await page.getByRole('button', { name: /PDF/ }).first().click();
  const summary = page.getByRole('alert').filter({ hasText: 'problema' });
  await expect(summary).toBeVisible();
  await expect(summary.getByRole('link').first()).toBeVisible();
});

test('profile with logo and stamp survives reload, export and import', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'desktop only');
  await page.goto('/perfis/novo?tipo=empresa');
  await page.getByLabel('Firma (nome legal)').fill('Teste Backup Lda');
  await page.getByRole('tab', { name: 'Marca e papel timbrado' }).click();
  await page.locator('#img-logo').setInputFiles('e2e/fixtures/logo.png');
  await page.locator('#img-stamp').setInputFiles('e2e/fixtures/stamp.png');
  await expect(page.getByText('600 × 200 px')).toBeVisible();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page).toHaveURL(/\/perfis\/[0-9a-f-]+$/);

  await page.reload();
  await page.getByRole('tab', { name: 'Marca e papel timbrado' }).click();
  await expect(page.getByText('600 × 200 px')).toBeVisible();
  await expect(page.getByText('300 × 300 px')).toBeVisible();

  await page.goto('/definicoes');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar cópia de segurança' }).click()]);
  const file = (await download.path())!;
  const backup = JSON.parse(readFileSync(file, 'utf8'));
  expect(backup.profiles.some((p: { firma?: string }) => p.firma === 'Teste Backup Lda')).toBe(true);
  expect(backup.assets.length).toBeGreaterThanOrEqual(2);

  await page.getByLabel('Escreva APAGAR para confirmar').fill('APAGAR');
  await page.getByRole('button', { name: 'Apagar todos os dados' }).click();
  await expect(page.getByText('Todos os dados foram apagados.')).toBeVisible();
  await page.goto('/perfis');
  await expect(page.getByText('Teste Backup Lda')).toHaveCount(0);

  await page.goto('/definicoes');
  await page.getByLabel('Substituir todos os dados actuais').check();
  await page.locator('input[type=file][accept*=json]').setInputFiles(file);
  await expect(page.getByText(/Importação concluída/)).toBeVisible();
  await page.goto('/perfis');
  await page.getByRole('link', { name: 'Teste Backup Lda' }).click();
  await page.getByRole('tab', { name: 'Marca e papel timbrado' }).click();
  await expect(page.getByText('600 × 200 px')).toBeVisible();
  await expect(page.getByText('300 × 300 px')).toBeVisible();
});

test('language switch translates the interface', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'desktop header');
  await page.goto('/');
  await page.getByRole('button', { name: 'Mudar para inglês' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create professional documents in minutes');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create professional documents in minutes');
});

test('process: data flows from the nota de culpa to the next documents', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'desktop only');
  await page.goto('/processos/despedimento-justa-causa');
  await page.getByLabel(/Data de entrega da nota de culpa/).fill('2026-10-12');
  await page.getByRole('button', { name: 'Iniciar este processo' }).click();
  await expect(page).toHaveURL(/processo=/);
  // reply deadline computed from mz-legal (15 days)
  await expect(page.getByText('até 27 de Outubro de 2026')).toBeVisible();

  await page.getByRole('link', { name: /Criar documento: Nota de culpa/ }).click();
  await page.getByLabel('Nome completo').fill('Carlos Manuel Sitoe');
  await page.getByLabel('N.º do processo disciplinar').fill('PD/2026/007');
  await expect(page.getByText('Guardado neste dispositivo')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('link', { name: 'Passos' }).click();
  await expect(page.getByRole('link', { name: /Continuar: Nota de culpa/ })).toBeVisible();
  await page.getByRole('link', { name: /Criar documento: Convocatória para audição/ }).click();
  await expect(page.getByLabel('Nome completo')).toHaveValue('Carlos Manuel Sitoe');
  await expect(page.getByLabel('N.º do processo disciplinar')).toHaveValue('PD/2026/007');
});
