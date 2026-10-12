// Static checks on every template: structure, references, wording and the rule
// that legal values come from src/legal/mz-legal.ts and are never hard-coded.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATALOG, getMeta } from '@/features/catalog/catalog';
import { LEGAL } from '@/legal/mz-legal';
import { companyProfile, fixtureValues, personProfile } from '@/test/fixtures';
import { buildBlocks, buildContext, defaultValues, editableTexts } from '../context';
import { AVAILABLE_TEMPLATE_IDS, loadTemplate } from '../registry';

const DIR = join(process.cwd(), 'src/documents/templates');
const sourceFiles = readdirSync(DIR).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));

/** Filler and AI-sounding phrases that must never appear in a document. */
export const BANNED_PHRASES = [
  'espero que esta carta o encontre bem',
  'espero que esta o encontre bem',
  'espero que se encontre bem',
  'é com grande prazer',
  'e com grande prazer',
  'não hesite em contactar',
  'nao hesite em contactar',
  'não hesite em contactar-nos',
  'fico a aguardar ansiosamente',
  'sem mais assunto de momento',
  'venho por este meio',
  'gostaríamos de aproveitar esta oportunidade',
];

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Removes ${...} interpolations (which may contain legal lookups) from template literals. */
function stripInterpolations(src: string): string {
  let out = '';
  let depth = 0;
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '$' && src[i + 1] === '{') {
      depth++;
      i++;
      continue;
    }
    if (depth > 0) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') depth--;
      continue;
    }
    out += src[i];
  }
  return out;
}

describe('template sources', () => {
  for (const file of sourceFiles) {
    const src = readFileSync(join(DIR, file), 'utf8');

    it(`${file}: no banned phrases`, () => {
      const n = normalize(src);
      for (const p of BANNED_PHRASES) expect(n.includes(normalize(p)), `"${p}"`).toBe(false);
    });

    it(`${file}: no hard-coded legal values`, () => {
      const s = stripInterpolations(src)
        // allow comments
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      const deadline = /\b\d+\s*(dias|dia|meses|mês|anos|horas)\b(?! (de|do|da) (Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro))/gi;
      const percent = /\b\d+(?:[.,]\d+)?\s*%/g;
      const article = /\bart(?:igo|\.)\s*\d+/gi;
      const law = /Lei\s+n\.?\s*º?\s*\d+\/\d{4}/gi;
      const hits = [...(s.match(deadline) ?? []), ...(s.match(percent) ?? []), ...(s.match(article) ?? []), ...(s.match(law) ?? [])];
      expect(hits, 'use values from src/legal/mz-legal.ts').toEqual([]);
    });
  }
});

describe('catalogue', () => {
  it('has unique ids and valid references', () => {
    const ids = new Set<string>();
    for (const m of CATALOG) {
      expect(ids.has(m.id), m.id).toBe(false);
      ids.add(m.id);
      for (const r of m.legalRefs) expect(r in LEGAL, `${m.id} → ${r}`).toBe(true);
      for (const r of m.related ?? []) expect(getMeta(r), `${m.id} related ${r}`).toBeTruthy();
      expect(m.tags.length, `${m.id} tags`).toBeGreaterThan(3);
    }
  });
});

describe('templates', () => {
  const today = '2026-10-12';
  for (const id of AVAILABLE_TEMPLATE_IDS) {
    it(`${id}: structure and blocks`, async () => {
      expect(getMeta(id), 'catalogue entry').toBeTruthy();
      const t = await loadTemplate(id);
      const names = new Set<string>();
      const sections = new Set(t.sections.map((s) => s.id));
      for (const f of t.fields) {
        expect(names.has(f.name), `duplicate field ${f.name}`).toBe(false);
        names.add(f.name);
        expect(f.section && sections.has(f.section), `${f.name} section "${f.section}"`).toBe(true);
        if (f.type === 'select' || f.type === 'radio') expect(f.options?.length, `${f.name} options`).toBeGreaterThan(0);
        if (f.type === 'lines') expect(f.columns?.length, `${f.name} columns`).toBeGreaterThan(0);
      }
      for (const fx of [personProfile(), companyProfile('classico', 'plain')]) {
        for (const mode of ['minimal', 'long'] as const) {
          const base = defaultValues(t, { profile: fx.profile, today, nextRef: 'RH/2026/001' });
          const values = fixtureValues(t, base, mode);
          const ctx = buildContext(t, values, fx.profile, {}, today);
          const blocks = buildBlocks(t, ctx);
          expect(blocks.length).toBeGreaterThan(2);
          t.warnings?.(values, ctx);
          // Editable paragraph ids must be unique.
          const ids = editableTexts(blocks).map((e) => e.id);
          expect(new Set(ids).size, `duplicate paragraph ids in ${id}`).toBe(ids.length);
          // No "undefined" / "null" / "NaN" leaking into the text.
          const text = JSON.stringify(blocks);
          expect(text, `${id} ${mode}`).not.toMatch(/\bundefined\b|\bnull\b(?!")|NaN|\[object Object\]/);
          // Document text: no banned phrases after rendering either.
          const n = normalize(text);
          for (const p of BANNED_PHRASES) expect(n.includes(normalize(p)), p).toBe(false);
        }
      }
    });
  }
});
