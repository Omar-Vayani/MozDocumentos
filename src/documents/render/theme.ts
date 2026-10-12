import { ensurePrintContrast, tint } from '@/lib/color';
import { DEFAULT_BRANDING, type Branding } from '@/lib/storage/types';
import { FONT_FAMILIES } from './fonts';

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
};

export function makeTheme(branding: Branding | undefined): Theme {
  const b = branding ?? DEFAULT_BRANDING;
  const accent = ensurePrintContrast(b.accent || DEFAULT_BRANDING.accent);
  const margin =
    b.margins === 'estreito'
      ? { top: 18 * MM, right: 15 * MM, bottom: 18 * MM, left: 18 * MM }
      : { top: 25 * MM, right: 20 * MM, bottom: 25 * MM, left: 25 * MM };
  const serif = b.font === 'classico';
  return {
    font: FONT_FAMILIES[b.font]?.family ?? FONT_FAMILIES.classico.family,
    accent,
    accentTint: tint(accent, 0.9),
    rule: '#9aa0a6',
    text: '#111111',
    muted: '#4a4f55',
    // Sans faces look larger at the same size; keep visual size consistent.
    bodySize: serif ? 11 : 10.5,
    smallSize: 8,
    lineHeight: 1.4,
    align: b.textAlign === 'left' ? 'left' : 'justify',
    margin,
    contentWidth: A4.width - margin.left - margin.right,
    gap: 7,
  };
}
