import { Font } from '@react-pdf/renderer';
// hyphen ships CommonJS; the default import works in Vite, Vitest and Node.
import hyphenPt from 'hyphen/pt/index.js';
import type { FontPreset } from '@/lib/storage/types';

export const FONT_FAMILIES: Record<FontPreset, { family: string; file: string; label: string }> = {
  classico: { family: 'SourceSerif4', file: 'source-serif-4', label: 'Source Serif 4' },
  institucional: { family: 'Arimo', file: 'arimo', label: 'Arimo' },
  moderno: { family: 'IBMPlexSans', file: 'ibm-plex-sans', label: 'IBM Plex Sans' },
};

let hyphenationRegistered = false;
let generation = 0;

const MAX_UNBROKEN = 22;

function splitLong(word: string): string[] {
  // Long tokens with no hyphenation points (NIB, emails, URLs) are split into
  // chunks so they can never overflow a cell or the page margin. Email
  // addresses and web addresses of ordinary length stay whole (a hyphen inside
  // one would change it); longer ones break only after "@" or ".".
  if (/@|www\.|:\/\//i.test(word)) {
    if (word.length <= 36) return [word];
    return word.split(/(?<=[@.])/);
  }
  if (word.length <= MAX_UNBROKEN) return [word];
  const parts: string[] = [];
  for (let i = 0; i < word.length; i += 12) parts.push(word.slice(i, i + 12));
  return parts;
}

function registerHyphenation() {
  if (hyphenationRegistered) return;
  const hyphenateSync = (hyphenPt as unknown as { hyphenateSync: (w: string, o: { hyphenChar: string }) => string })
    .hyphenateSync;
  Font.registerHyphenationCallback((word: string) => {
    if (word.length < 6 || /[\d_@/.]/.test(word)) return splitLong(word);
    // Names and headings in capitals (court addressees, party names) are never hyphenated.
    if (word === word.toLocaleUpperCase('pt') && /\p{L}/u.test(word)) return splitLong(word);
    try {
      const parts = hyphenateSync(word, { hyphenChar: '\u00AD' }).split('\u00AD');
      return parts.flatMap(splitLong);
    } catch {
      return splitLong(word);
    }
  });
  hyphenationRegistered = true;
}

/** Document fonts by preset, plus a small fallback font for symbols they lack (‰, ☐, ✓, →…). */
export type FontFamilies = Record<FontPreset, string> & { symbols?: string };

/**
 * Registers the document fonts under fresh family names for one render.
 * Reusing parsed font objects across many documents in the same process
 * corrupts glyph subsets (dropped characters, missing page numbers), so each
 * render gets its own font objects. Font files stay in the HTTP cache; only
 * the parse is repeated. Older generations are dropped to bound memory.
 */
export function registerFontGeneration(base: string): FontFamilies {
  registerHyphenation();
  generation += 1;
  const sep = base.endsWith('/') ? '' : '/';
  const out = {} as FontFamilies;
  for (const [preset, { family, file }] of Object.entries(FONT_FAMILIES) as [FontPreset, (typeof FONT_FAMILIES)[FontPreset]][]) {
    const name = `${family}-g${generation}`;
    Font.register({
      family: name,
      fonts: [
        { src: `${base}${sep}${file}-latin-400-normal.woff`, fontWeight: 400 },
        { src: `${base}${sep}${file}-latin-400-italic.woff`, fontWeight: 400, fontStyle: 'italic' },
        { src: `${base}${sep}${file}-latin-700-normal.woff`, fontWeight: 700 },
        { src: `${base}${sep}${file}-latin-700-italic.woff`, fontWeight: 700, fontStyle: 'italic' },
      ],
    });
    out[preset] = name;
  }
  // Symbols subset of DejaVu Sans (free licence), used where the text font has no glyph.
  const symbols = `DmzSymbols-g${generation}`;
  Font.register({
    family: symbols,
    fonts: [
      { src: `${base}${sep}symbols.woff`, fontWeight: 400 },
      { src: `${base}${sep}symbols.woff`, fontWeight: 400, fontStyle: 'italic' },
      { src: `${base}${sep}symbols-bold.woff`, fontWeight: 700 },
      { src: `${base}${sep}symbols-bold.woff`, fontWeight: 700, fontStyle: 'italic' },
    ],
  });
  out.symbols = symbols;
  const registered = Font.getRegisteredFonts() as Record<string, unknown>;
  for (const key of Object.keys(registered)) {
    const m = /-g(\d+)$/.exec(key);
    if (m && Number(m[1]) < generation - 1) delete registered[key];
  }
  return out;
}
