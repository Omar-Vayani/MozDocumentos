// Design preview: renders a few documents with realistic content for visual
// review. Skipped unless PREVIEW_OUT is set:
//   PREVIEW_OUT=/tmp/preview [PREVIEW_ONLY=id1,id2] npx vitest run src/documents/render/preview.test.tsx
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import { defaultValues } from '../context';
import { loadTemplate } from '../registry';
import type { Sample } from './samples/_profiles';
import { renderPdf } from './renderPdf';

const OUT = process.env.PREVIEW_OUT;
const today = '2026-10-12';

// Each file in ./samples exports SAMPLES; add yours in samples/<category>.ts.
const SAMPLES: Sample[] = Object.values(import.meta.glob<{ SAMPLES: Sample[] }>('./samples/*.ts', { eager: true }))
  .flatMap((m) => m.SAMPLES ?? []);

describe.skipIf(!OUT)('design preview', () => {
  it('renders samples', { timeout: 240_000 }, async () => {
    mkdirSync(OUT!, { recursive: true });
    const only = process.env.PREVIEW_ONLY?.split(',');
    for (const s of SAMPLES) {
      if (only && !only.includes(s.name ?? s.id)) continue;
      const t = await loadTemplate(s.id);
      const who = s.who();
      const base = defaultValues(t, { profile: who.profile, today, nextRef: 'RH/2026/014' });
      const res = await renderPdf({
        templateId: s.id,
        values: { ...base, ...s.values },
        overrides: {},
        profile: who.profile,
        assets: who.assets,
        legalOverrides: {},
        bilingual: false,
        today,
        fontBase: join(process.cwd(), 'public/fonts'),
      });
      writeFileSync(join(OUT!, `${s.name ?? s.id}.pdf`), Buffer.from(res.pdf));
    }
  });
});
