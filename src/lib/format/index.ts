export { numeroPorExtenso, inteiroPorExtenso, MAX_EXTENSO } from './extenso';

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Parses an ISO date (YYYY-MM-DD) as a local calendar date. */
export function parseISODate(iso: string | undefined | null): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3] ?? 1));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** "12 de Outubro de 2026" — meses com maiúscula, como no Boletim da República. */
export function formatDateLong(iso: string | undefined | null, fallback = '___ de __________ de ______'): string {
  const d = parseISODate(iso);
  if (!d) return fallback;
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** "12/10/2026" */
export function formatDateShort(iso: string | undefined | null, fallback = '___/___/______'): string {
  const d = parseISODate(iso);
  if (!d) return fallback;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** "Outubro de 2026" */
export function formatMonthYear(iso: string | undefined | null, fallback = '__________ de ______'): string {
  const d = parseISODate(iso);
  if (!d) return fallback;
  return `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Adds working days (Monday–Friday). Public holidays are not considered. */
export function addWorkingDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  if (!d) return iso;
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return toISODate(d);
}

export function addMonths(iso: string, months: number): string {
  const d = parseISODate(iso);
  if (!d) return iso;
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toISODate(d);
}

/** Whole days between two ISO dates (b − a). */
export function diffDays(a: string, b: string): number {
  const da = parseISODate(a);
  const db = parseISODate(b);
  if (!da || !db) return Number.NaN;
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

/** Complete years of service between two dates. */
export function yearsBetween(a: string, b: string): number {
  const da = parseISODate(a);
  const db = parseISODate(b);
  if (!da || !db) return 0;
  let y = db.getFullYear() - da.getFullYear();
  if (db.getMonth() < da.getMonth() || (db.getMonth() === da.getMonth() && db.getDate() < da.getDate())) y--;
  return Math.max(0, y);
}

/** Parses user money input: "15.000,50", "15000.5", "15 000" → 15000.5 */
export function parseMoney(input: unknown): number | null {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  if (typeof input !== 'string') return null;
  let s = input.replace(/\s|MT|MZN/gi, '').trim();
  if (!s) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > -1 && lastComma > lastDot) {
    // vírgula decimal: 15.000,50
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > -1 && lastComma > -1) {
    // ponto decimal com vírgulas de milhar: 15,000.50
    s = s.replace(/,/g, '');
  } else if (lastDot > -1) {
    // só pontos: "15.000" (milhar) vs "15.5" (decimal)
    const parts = s.split('.');
    const decimalLike = parts.length === 2 && parts[1].length !== 3;
    s = decimalLike ? s : s.replace(/\./g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** "15.000,00 MT" */
export function formatMoney(value: number | null | undefined, withUnit = true): string {
  if (value == null || !Number.isFinite(value)) return withUnit ? '________ MT' : '________';
  const neg = value < 0;
  const fixed = Math.abs(value).toFixed(2);
  const [int, dec] = fixed.split('.');
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${neg ? '−' : ''}${withDots},${dec}${withUnit ? ' MT' : ''}`;
}

export function formatNumber(value: number, decimals = 0): string {
  const fixed = value.toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec ? `${withDots},${dec}` : withDots;
}

export function formatPercent(rate: number): string {
  return `${formatNumber(rate * 100, Number.isInteger(rate * 100) ? 0 : 2)}%`;
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Converts a string into a file-name-safe slug, keeping it readable. */
export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Lower-case and strip diacritics — used for search and comparisons. */
export function normalizeText(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Blank line used in documents when a value is missing. */
export const BLANK = '____________________';

export function orBlank(v: unknown, blank = BLANK): string {
  if (v == null) return blank;
  const s = String(v).trim();
  return s ? s : blank;
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
