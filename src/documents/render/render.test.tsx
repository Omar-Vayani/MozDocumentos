// Renders every template with stress fixtures across all letterhead layouts and
// checks that no text is placed outside the page margins.
// Set RENDER_OUT=<dir> to keep the generated PDFs for inspection.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { defaultValues } from '../context';
import { AVAILABLE_TEMPLATE_IDS, loadTemplate } from '../registry';
import { companyProfile, fixtureValues, personProfile, type ProfileFixture } from '@/test/fixtures';
import type { LetterheadLayout } from '@/lib/storage/types';
import { renderPdf } from './renderPdf';
import { A4, makeTheme } from './theme';

const FONT_BASE = join(process.cwd(), 'public/fonts');
const OUT = process.env.RENDER_OUT;
const FULL = process.env.RENDER_FULL === '1';

const LAYOUTS: LetterheadLayout[] = ['classico', 'lateral', 'faixa', 'minimo'];

function profilesFor(): ProfileFixture[] {
  const list: ProfileFixture[] = [personProfile()];
  for (const layout of LAYOUTS) {
    list.push(companyProfile(layout, 'full'));
    if (FULL) {
      list.push(companyProfile(layout, 'plain'), companyProfile(layout, 'hugeLogo'), companyProfile(layout, 'longName'));
    }
  }
  if (!FULL) list.push(companyProfile('classico', 'hugeLogo'), companyProfile('lateral', 'longName'));
  return list;
}

async function textBounds(pdf: ArrayBuffer) {
  const doc = await getDocument({ data: new Uint8Array(pdf.slice(0)) }).promise;
  const issues: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const x = item.transform[4];
      const y = item.transform[5];
      if (x < -0.5 || x + item.width > A4.width + 0.5 || y < 0 || y > A4.height) {
        issues.push(`p${p} "${item.str.slice(0, 40)}" x=${x.toFixed(1)} w=${item.width.toFixed(1)} y=${y.toFixed(1)}`);
      }
    }
  }
  return { pages: doc.numPages, issues, doc };
}

describe('templates render without overflow', () => {
  const today = '2026-10-12';
  for (const id of AVAILABLE_TEMPLATE_IDS) {
    it(id, { timeout: 240_000 }, async () => {
      const t = await loadTemplate(id);
      for (const fx of profilesFor()) {
        for (const mode of ['minimal', 'long'] as const) {
          const theme = makeTheme(fx.profile.branding);
          const base = defaultValues(t, { profile: fx.profile, today, nextRef: 'RH/2026/014' });
          const values = fixtureValues(t, base, mode);
          const res = await renderPdf({
            templateId: id,
            values,
            overrides: {},
            profile: fx.profile,
            assets: fx.assets,
            legalOverrides: {},
            bilingual: Boolean(t.bilingual) && mode === 'long',
            today,
            fontBase: FONT_BASE,
          });
          const { pages, issues, doc } = await textBounds(res.pdf);
          // Text must stay inside the content box horizontally (with a small tolerance for the full-bleed band).
          const strict: string[] = [];
          for (let p = 1; p <= doc.numPages; p++) {
            const page = await doc.getPage(p);
            const content = await page.getTextContent();
            for (const item of content.items) {
              if (!('str' in item) || !item.str.trim()) continue;
              const x = item.transform[4];
              // Footer lines are the only 7pt text: they must sit in the bottom margin on every page.
              if (Math.abs(item.transform[0] - 7) < 0.01 && item.transform[5] > 45 * 2.8346) {
                strict.push(`p${p} footer text out of place "${item.str.slice(0, 30)}" y=${item.transform[5].toFixed(1)}`);
              }
              if (x < theme.margin.left - 2 || x + item.width > A4.width - theme.margin.right + 2) {
                strict.push(`p${p} "${item.str.slice(0, 50)}" x=${x.toFixed(1)} right=${(x + item.width).toFixed(1)}`);
              }
            }
          }
          if (id === 'recibo-de-renda' && fx.name === 'pessoa' && mode === 'long') {
            const { writeFileSync: w } = await import('node:fs');
            w('/tmp/claude-0/-home-user-MozDocumentos/fc8df599-9b12-593e-b5f6-31f4c3d9913a/scratchpad/renda-in-suite.pdf', Buffer.from(res.pdf));
          }
          if (OUT) {
            mkdirSync(OUT, { recursive: true });
            writeFileSync(join(OUT, `${id}--${fx.name}--${mode}.pdf`), Buffer.from(res.pdf));
          }
          expect(pages, `${fx.name}/${mode}`).toBeGreaterThan(0);
          // No overlapping lines of text (two items on top of each other).
          for (let p = 1; p <= doc.numPages; p++) {
            const items = (await (await doc.getPage(p)).getTextContent()).items
              .filter((i): i is Extract<typeof i, { str: string }> => 'str' in i && i.str.trim().length > 0)
              .map((i) => ({ s: i.str, x0: i.transform[4], x1: i.transform[4] + i.width, y: i.transform[5], h: i.transform[0] }));
            for (let a = 0; a < items.length; a++) {
              for (let b = a + 1; b < items.length; b++) {
                const A = items[a];
                const B = items[b];
                const dy = Math.abs(A.y - B.y);
                if (dy > 0.6 * Math.min(A.h, B.h) || dy < 0.01) continue;
                const overlapX = Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0);
                if (overlapX > 4) strict.push(`p${p} overlap "${A.s.slice(0, 25)}" / "${B.s.slice(0, 25)}"`);
              }
            }
          }
          // "Página N de M" on every page.
          for (let p = 1; p <= doc.numPages; p++) {
            const text = (await (await doc.getPage(p)).getTextContent()).items.map((i) => ('str' in i ? i.str : '')).join(' ');
            expect(text, `${fx.name}/${mode} page number p${p}`).toContain(`Página ${p} de ${doc.numPages}`);
          }
          // Every font must be embedded (a stray "\n" in a Text pulls in Helvetica).
          expect(Buffer.from(res.pdf).toString('latin1').includes('/BaseFont /Helvetica'), `${fx.name}/${mode} unembedded font`).toBe(false);
          expect(issues, `${fx.name}/${mode} off-page`).toEqual([]);
          expect(strict, `${fx.name}/${mode} outside margins`).toEqual([]);
        }
      }
    });
  }
});
