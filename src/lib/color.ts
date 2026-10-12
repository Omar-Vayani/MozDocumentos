// Colour helpers for the accent colour: contrast checking for print legibility.

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function toHex(rgb: number[]): string {
  return '#' + rgb.map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('');
}

/** Darkens the colour until it reaches the given contrast on white (default 4.5:1). */
export function ensurePrintContrast(hex: string, min = 4.5): string {
  let rgb = hexToRgb(hex);
  if (!rgb) return '#1f4e3d';
  let out = toHex(rgb);
  for (let i = 0; i < 40 && contrastRatio(out, '#ffffff') < min; i++) {
    rgb = rgb.map((c) => c * 0.92) as [number, number, number];
    out = toHex(rgb);
  }
  return out;
}

/** Mixes the colour with white (amount 0–1 of white). */
export function tint(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#f2f2f2';
  return toHex(rgb.map((c) => c + (255 - c) * amount));
}

export const ACCENT_PALETTE = [
  { name: 'Verde', value: '#1f4e3d' },
  { name: 'Azul', value: '#1d3f6e' },
  { name: 'Petróleo', value: '#0f5257' },
  { name: 'Bordô', value: '#6d1f2b' },
  { name: 'Grafite', value: '#33373d' },
  { name: 'Castanho', value: '#5b3a1e' },
];
