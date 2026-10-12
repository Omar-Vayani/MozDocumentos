// Visual regression: the first page of key documents, rendered through the
// real app (PDF worker + pdf.js), with a fixed profile and fixed values.
// Update baselines with: npx playwright test e2e/visual.spec.ts --update-snapshots

import { expect, test } from '@playwright/test';

const PROFILE = {
  id: 'visual-profile',
  kind: 'empresa',
  createdAt: 1,
  updatedAt: 1,
  firma: 'Machava & Filhos, Lda',
  nuit: '400123456',
  nuel: '100234567',
  capitalSocial: '150000',
  morada: { rua: 'Avenida Julius Nyerere', numero: '1234', bairro: 'Polana Cimento', cidade: 'Maputo', provincia: 'Maputo Cidade' },
  telefones: '+258 84 000 0000',
  email: 'geral@machava.co.mz',
  representanteNome: 'Ana Maria Machava',
  representanteCargo: 'Directora-Geral',
  localPadrao: 'Maputo',
  branding: {
    layout: 'classico',
    watermarkOpacity: 0.06,
    watermarkFirstPageOnly: false,
    accent: '#1f4e3d',
    font: 'classico',
    footer: { legal: true, address: true, contacts: true },
    margins: 'normal',
    pageNumbers: true,
    textAlign: 'justify',
  },
  numbering: { prefix: 'RH', year: 2026, counter: 13, digits: 3 },
};

const DOCS: { id: string; values: Record<string, unknown> }[] = [
  {
    id: 'recibo-de-salario',
    values: { periodo: '2026-09', data: '2026-09-30', ref: 'RH/2026/014', trabalhadorNome: 'Maria Fernanda Cossa', trabalhadorGenero: 'F', trabalhadorCargo: 'Contabilista', salarioBase: '35000', irps: '1500' },
  },
  {
    id: 'nota-de-culpa',
    values: {
      ref: 'RH/2026/014', data: '2026-10-12', processoNumero: 'PD/2026/003', trabalhadorNome: 'João Alberto Mussa', trabalhadorGenero: 'M', trabalhadorCargo: 'Fiel de armazém',
      dataConhecimento: '2026-10-05', dataInfraccao: '2026-10-03', localFactos: 'Armazém da Machava',
      factos: 'No dia 3 de Outubro de 2026, entre as 13:00 e as 16:30, o trabalhador ausentou-se do armazém sem autorização da chefia, deixando-o aberto e sem vigilância.\nDurante esse período desapareceram do armazém três caixas de material eléctrico.',
    },
  },
  {
    id: 'declaracao-de-trabalho',
    values: { ref: 'RH/2026/014', data: '2026-10-12', trabalhadorNome: 'Maria Fernanda Cossa', trabalhadorGenero: 'F', trabalhadorCargo: 'Contabilista', trabalhadorDataAdmissao: '2021-03-01' },
  },
  {
    id: 'contrato-indeterminado',
    values: { data: '2026-10-12', trabalhadorNome: 'Maria Fernanda Cossa', trabalhadorGenero: 'F', trabalhadorCargo: 'Contabilista', salarioBase: '35000' },
  },
  {
    id: 'certificado-de-trabalho',
    values: { ref: 'RH/2026/014', data: '2026-10-12', trabalhadorNome: 'João Alberto Mussa', trabalhadorGenero: 'M', trabalhadorDataAdmissao: '2019-02-01', dataFimContrato: '2026-09-30' },
  },
];

test.describe('document rendering (visual)', () => {
  for (const d of DOCS) {
    test(d.id, async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop', 'desktop only');
      // Tall enough for a whole A4 page in the preview panel.
      await page.setViewportSize({ width: 1280, height: 1150 });
      // "Today" is fixed so default dates are stable (the worker gets today from the page).
      await page.clock.setFixedTime(new Date('2026-10-12T10:00:00+02:00'));
      await page.goto('/');
      // Seed the profile and a saved document directly into IndexedDB.
      await page.evaluate(
        async ({ profile, doc }) => {
          const open = indexedDB.open('documentos-mz');
          const db: IDBDatabase = await new Promise((res, rej) => {
            open.onsuccess = () => res(open.result);
            open.onerror = () => rej(open.error);
          });
          const tx = db.transaction(['profiles', 'documents'], 'readwrite');
          tx.objectStore('profiles').put(profile);
          tx.objectStore('documents').put(doc);
          await new Promise((res) => (tx.oncomplete = res));
          localStorage.setItem('dmz-prefs', JSON.stringify({ state: { lang: 'pt', theme: 'light', activeProfileId: profile.id, readingAid: false }, version: 1 }));
        },
        {
          profile: PROFILE,
          doc: { id: `visual-${d.id}`, templateId: d.id, profileId: PROFILE.id, status: 'draft', title: d.id, values: d.values, overrides: {}, createdAt: 1, updatedAt: 1 },
        },
      );
      await page.goto(`/documentos/${d.id}?doc=visual-${d.id}`);
      const canvas = page.locator('aside canvas').first();
      await expect(canvas).toBeVisible();
      await expect(page.getByText('A preparar a pré-visualização…')).toHaveCount(0);
      await page.waitForTimeout(400);
      await expect(canvas).toHaveScreenshot(`${d.id}.png`);
    });
  }
});
