import { Font } from '@react-pdf/renderer';
// hyphen ships CommonJS; the default import works in Vite, Vitest and Node.
import hyphenPt from 'hyphen/pt/index.js';
import type { FontPreset } from '@/lib/storage/types';

export const FONT_FAMILIES: Record<FontPreset, { family: string; file: string; label: string }> = {
  classico: { family: 'SourceSerif4', file: 'source-serif-4', label: 'Source Serif 4' },
  institucional: { family: 'Arimo', file: 'arimo', label: 'Arimo' },
  moderno: { family: 'IBMPlexSans', file: 'ibm-plex-sans', label: 'IBM Plex Sans' },
};

let registeredBase: string | null = null;

const MAX_UNBROKEN = 22;

function splitLong(word: string): string[] {
  // Long tokens with no hyphenation points (NIB, emails, URLs) are split into
  // chunks so they can never overflow a cell or the page margin.
  if (word.length <= MAX_UNBROKEN) return [word];
  const parts: string[] = [];
  for (let i = 0; i < word.length; i += 12) parts.push(word.slice(i, i + 12));
  return parts;
}

export function registerFonts(base: string): void {
  if (registeredBase === base) return;
  const sep = base.endsWith('/') ? '' : '/';
  for (const { family, file } of Object.values(FONT_FAMILIES)) {
    Font.register({
      family,
      fonts: [
        { src: `${base}${sep}${file}-latin-400-normal.woff`, fontWeight: 400 },
        { src: `${base}${sep}${file}-latin-400-italic.woff`, fontWeight: 400, fontStyle: 'italic' },
        { src: `${base}${sep}${file}-latin-700-normal.woff`, fontWeight: 700 },
        { src: `${base}${sep}${file}-latin-700-italic.woff`, fontWeight: 700, fontStyle: 'italic' },
      ],
    });
  }

  const hyphenateSync = (hyphenPt as unknown as { hyphenateSync: (w: string, o: { hyphenChar: string }) => string })
    .hyphenateSync;
  Font.registerHyphenationCallback((word: string) => {
    if (word.length < 6 || /[\d_@/.]/.test(word)) return splitLong(word);
    try {
      const parts = hyphenateSync(word, { hyphenChar: '­' }).split('­');
      return parts.flatMap(splitLong);
    } catch {
      return splitLong(word);
    }
  });
  registeredBase = base;
}
