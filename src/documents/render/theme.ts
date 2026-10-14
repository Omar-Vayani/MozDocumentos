import { ensurePrintContrast, tint } from '@/lib/color';
import { DEFAULT_BRANDING, type Branding, type Presentation } from '@/lib/storage/types';
import type { DocumentFamily, PageFormat } from '../model';
import { FONT_FAMILIES, type FontFamilies } from './fonts';

export const MM = 2.8346457; // points per millimetre
export const A4 = { width: 210 * MM, height: 297 * MM };

/**
 * Paper formats (mm). `sheet` = how many fit on an A4 sheet when printed
 * "several per sheet" (imposed with cutting marks); `scale` sets type sizes.
 */
export const FORMATS: Record<PageFormat, { w: number; h: number; margin: number; scale: number; sheet?: { cols: number; rows: number; landscape?: boolean } }> = {
  A4: { w: 210, h: 297, margin: 0, scale: 1 },
  'A4-paisagem': { w: 297, h: 210, margin: 16, scale: 1.05 },
  A5: { w: 148, h: 210, margin: 13, scale: 0.9, sheet: { cols: 2, rows: 1, landscape: true } },
  'A5-paisagem': { w: 210, h: 148, margin: 12, scale: 0.9, sheet: { cols: 1, rows: 2 } },
  A6: { w: 105, h: 148, margin: 9, scale: 0.72, sheet: { cols: 2, rows: 2 } },
  DL: { w: 220, h: 110, margin: 12, scale: 0.85 },
  cartao: { w: 85, h: 55, margin: 5, scale: 0.7, sheet: { cols: 2, rows: 5 } },
};

export const isSmallFormat = (f: PageFormat) => f === 'A6' || f === 'DL' || f === 'cartao';

export type Theme = {
  font: string;
  /** The text font followed by the symbols fallback (for page-level styles). */
  fontStack: string | string[];
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
  format: PageFormat;
  /** Page size in points. */
  page: { width: number; height: number };
  /** Type scale for the format (A4 = 1). */
  scale: number;
};

export type ThemeOptions = { family?: DocumentFamily; plain?: boolean; format?: PageFormat };

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
  // Fit-to-one-page levels (set by the renderer) tighten spacing and margins a little.
  const fit = Math.max(0, Math.min(2, presentation.fit ?? 0));
  const format = opts.format ?? 'A4';
  const fmt = FORMATS[format];
  const compact = family === 'recibo' || family === 'mapa' || format === 'A5' || format === 'A5-paisagem';
  const size = presentation.textSize ?? b.textSize ?? 'normal';
  const spacing = presentation.lineSpacing ?? b.lineSpacing ?? 'normal';
  const accent = ensurePrintContrast(b.accent || DEFAULT_BRANDING.accent);
  // Court filings keep the traditional wider left (binding) margin.
  const margin =
    format !== 'A4'
      ? { top: fmt.margin * MM, right: fmt.margin * MM, bottom: fmt.margin * MM, left: fmt.margin * MM }
      : b.margins === 'estreito' && !peca
        ? { top: 18 * MM, right: 15 * MM, bottom: 18 * MM, left: 18 * MM }
        : { top: (25 - fit * 3) * MM, right: 20 * MM, bottom: (25 - fit * 3) * MM, left: peca ? 30 * MM : 25 * MM };
  const page = { width: fmt.w * MM, height: fmt.h * MM };
  const lineHeight = (spacing === 'compacto' ? 1.3 : spacing === 'amplo' ? 1.55 : 1.42) - fit * 0.05;
  const serif = b.font === 'classico';
  const font = families?.[b.font] ?? families?.classico ?? FONT_FAMILIES[b.font]?.family ?? FONT_FAMILIES.classico.family;
  return {
    font,
    fontStack: families?.symbols ? [font, families.symbols] : font,
    accent,
    accentTint: tint(accent, 0.9),
    rule: '#9aa0a6',
    text: '#111111',
    muted: '#4a4f55',
    // Sans faces look larger at the same size; keep visual size consistent.
    // Body size follows the format: A5 a point smaller, cards much smaller.
    bodySize: Math.max(6.5, ((serif ? 11 : 10.5) + (size === 'pequeno' ? -1 : size === 'grande' ? 1 : 0)) * Math.min(1, 0.55 + fmt.scale * 0.45)),
    smallSize: Math.max(5.5, 8 * Math.min(1, 0.6 + fmt.scale * 0.4)),
    lineHeight: peca ? Math.max(1.5, lineHeight) : lineHeight,
    align: b.textAlign === 'left' && !peca ? 'left' : 'justify',
    margin,
    contentWidth: page.width - margin.left - margin.right,
    gap: (spacing === 'compacto' || compact ? 5 : spacing === 'amplo' ? 9 : 7) - fit * 1.5,
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
    format,
    page,
    scale: fmt.scale,
  };
}
