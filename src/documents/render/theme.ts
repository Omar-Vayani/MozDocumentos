import { ensurePrintContrast, tint } from '@/lib/color';
import { DEFAULT_BRANDING, type Branding, type Presentation } from '@/lib/storage/types';
import type { DocumentFamily } from '../model';
import { FONT_FAMILIES, type FontFamilies } from './fonts';

export const MM = 2.8346457; // points per millimetre
export const A4 = { width: 210 * MM, height: 297 * MM };

export type Theme = {
  font: string;
  accent: string;
  accentTint: string;
  rule: string;
  text: string;
  muted: string;
  bodySize: number;
  smallSize: number;
  lineHeight: number;
  align: 'justify' | 'left';
  margin: { top: number; right: number; bottom: number; left: number };
  contentWidth: number;
  gap: number; // vertical space between blocks
  /** Colour for titles, clause headings and section labels. */
  heading: string;
  /** Faint tint for table stripes and boxes. */
  wash: string;
  signatureScale: number;
  stampScale: number;
  logoScale: number;
  family: DocumentFamily;
  /** First-line indent of body paragraphs (court filings). */
  indent: number;
  /** No decoration: official documents (courts, registries, public bodies). */
  plain: boolean;
  /** Tighter spacing and a smaller letterhead so receipts and tables fit one page. */
  compact: boolean;
};

export type ThemeOptions = { family?: DocumentFamily; plain?: boolean };

const clamp = (n: unknown, lo: number, hi: number, d: number) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;

export function makeTheme(
  branding: Branding | undefined,
  families?: FontFamilies,
  presentation: Presentation = {},
  opts: ThemeOptions = {},
): Theme {
  const b = branding ?? DEFAULT_BRANDING;
  const family = opts.family ?? 'carta';
  const peca = family === 'peca';
  const plain = Boolean(opts.plain);
  const compact = family === 'recibo' || family === 'mapa';
  const size = presentation.textSize ?? b.textSize ?? 'normal';
  const spacing = presentation.lineSpacing ?? b.lineSpacing ?? 'normal';
  const accent = ensurePrintContrast(b.accent || DEFAULT_BRANDING.accent);
  // Court filings keep the traditional wider left (binding) margin.
  const margin =
    b.margins === 'estreito' && !peca
      ? { top: 18 * MM, right: 15 * MM, bottom: 18 * MM, left: 18 * MM }
      : { top: 25 * MM, right: 20 * MM, bottom: 25 * MM, left: peca ? 30 * MM : 25 * MM };
  const lineHeight = spacing === 'compacto' ? 1.3 : spacing === 'amplo' ? 1.55 : 1.42;
  const serif = b.font === 'classico';
  return {
    font: families?.[b.font] ?? families?.classico ?? FONT_FAMILIES[b.font]?.family ?? FONT_FAMILIES.classico.family,
    accent,
    accentTint: tint(accent, 0.9),
    rule: '#9aa0a6',
    text: '#111111',
    muted: '#4a4f55',
    // Sans faces look larger at the same size; keep visual size consistent.
    bodySize: (serif ? 11 : 10.5) + (size === 'pequeno' ? -1 : size === 'grande' ? 1 : 0),
    smallSize: 8,
    lineHeight: peca ? Math.max(1.5, lineHeight) : lineHeight,
    align: b.textAlign === 'left' && !peca ? 'left' : 'justify',
    margin,
    contentWidth: A4.width - margin.left - margin.right,
    gap: spacing === 'compacto' || compact ? 5 : spacing === 'amplo' ? 9 : 7,
    // Official documents and court filings are printed in black.
    heading: b.accentHeadings === false || plain || peca || family === 'oficio' ? '#111111' : accent,
    wash: tint(accent, 0.955),
    logoScale: clamp(b.logoScale, 0.4, 2.5, 1),
    signatureScale: clamp(presentation.signatureScale ?? b.signatureScale, 0.4, 3, 1),
    stampScale: clamp(presentation.stampScale ?? b.stampScale, 0.4, 3, 1),
    family,
    indent: peca ? 12 * MM : 0,
    plain,
    compact,
  };
}
