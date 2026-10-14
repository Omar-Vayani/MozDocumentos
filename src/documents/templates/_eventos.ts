// Shared helpers for invitations, notices, certificates and cards ("eventos").
// Typography-led design: display + ornament blocks, no clip-art.

import { parseISODate } from '@/lib/format';
import type { Block, FieldDef, FieldOption, Values } from '../model';
import { dateLong, l } from './_shared';

export const str = (v: unknown) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');

const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

/** "Sábado, 24 de Outubro de 2026" (blank line when no date). */
export function dataComDia(iso: unknown): string {
  const d = parseISODate(typeof iso === 'string' ? iso : '');
  if (!d) return dateLong('');
  return `${DIAS[d.getDay()]}, ${dateLong(iso)}`;
}

/** "11h00" from "11:00", "11h", "11.00" or "11". Blank to fill by hand when empty. */
export function hora(v: unknown): string {
  const s = str(v).toLowerCase().replace(/\s+/g, '');
  if (!s) return '___h___';
  const m = /^(\d{1,2})(?:[:h.](\d{2}))?h?(?:min)?$/.exec(s);
  if (!m) return str(v);
  return `${m[1].padStart(2, '0')}h${m[2] ?? '00'}`;
}

/** "Sábado · 24 de Outubro de 2026 · 11h00" — the date line of an invitation. */
export function linhaData(iso: unknown, h?: unknown): string {
  const d = dataComDia(iso).replace(', ', ' · ');
  return str(h) ? `${d} · ${hora(h)}` : d;
}

/** "de 12 a 14 de Outubro de 2026", "de 28 de Setembro a 2 de Outubro de 2026", "no dia 14 de Outubro de 2026". */
export function periodo(inicio: unknown, fim: unknown): string {
  const a = parseISODate(str(inicio));
  const b = parseISODate(str(fim));
  if (!a) return `no dia ${dateLong('')}`;
  if (!b || b.getTime() <= a.getTime()) return `no dia ${dateLong(inicio)}`;
  const full = dateLong(fim);
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) return `de ${a.getDate()} a ${full}`;
  if (a.getFullYear() === b.getFullYear()) return `de ${dateLong(inicio).replace(/ de \d{4}$/, '')} a ${full}`;
  return `de ${dateLong(inicio)} a ${full}`;
}

export const ano = (iso: unknown) => parseISODate(str(iso))?.getFullYear();

/** Whole days from a to b (b − a). NaN when a date is missing. */
export function diasEntre(a: unknown, b: unknown): number {
  const x = parseISODate(str(a));
  const y = parseISODate(str(b));
  if (!x || !y) return Number.NaN;
  return Math.round((y.getTime() - x.getTime()) / 86_400_000);
}

/** Age in whole years on a date. */
export function idadeEm(nascimento: unknown, em: unknown): number | undefined {
  const n = parseISODate(str(nascimento));
  const d = parseISODate(str(em));
  if (!n || !d) return undefined;
  let a = d.getFullYear() - n.getFullYear();
  if (d.getMonth() < n.getMonth() || (d.getMonth() === n.getMonth() && d.getDate() < n.getDate())) a--;
  return a;
}

// ---------------------------------------------------------------- Guests and RSVP

export const TRATAMENTO_OPTIONS: FieldOption[] = [
  { value: 'V. Ex.ª', label: l('V. Ex.ª', 'You (formal)') },
  { value: 'V. Ex.ª e Família', label: l('V. Ex.ª e Família', 'You and your family') },
  { value: 'V. Ex.ª e Esposa', label: l('V. Ex.ª e Esposa', 'You and your wife') },
  { value: 'V. Ex.ª e Esposo', label: l('V. Ex.ª e Esposo', 'You and your husband') },
  { value: 'V. Ex.ª e Acompanhante', label: l('V. Ex.ª e Acompanhante', 'You and a guest') },
];

export const TRAJE_OPTIONS: FieldOption[] = [
  { value: '', label: l('Não indicar', 'Do not state') },
  { value: 'Social', label: l('Social', 'Formal') },
  { value: 'Passeio completo', label: l('Passeio completo', 'Lounge suit') },
  { value: 'Formal (gala)', label: l('Formal (gala)', 'Black tie') },
  { value: 'Executivo', label: l('Executivo', 'Business') },
  { value: 'Tradicional (capulana)', label: l('Tradicional (capulana)', 'Traditional (capulana)') },
  { value: 'Livre', label: l('Livre', 'Casual') },
];

export function rsvpFields(section: string, label = l('Confirmação de presença', 'RSVP')): FieldDef[] {
  return [
    { name: 'rsvpNome', type: 'text', section, width: 'third', label: l('Confirmar com (nome)', 'RSVP to (name)'), help: label },
    { name: 'rsvpTelefone', type: 'tel', section, width: 'third', label: l('Telefone para confirmar', 'RSVP phone') },
    { name: 'rsvpData', type: 'date', section, width: 'third', label: l('Confirmar até', 'RSVP by') },
  ];
}

/** "Agradecemos a confirmação até 15 de Setembro de 2026 — Rosa · +258 84 …" or ''. */
export function rsvpLine(v: Values, lead = 'Agradecemos a confirmação'): string {
  const quem = [str(v.rsvpNome), str(v.rsvpTelefone)].filter(Boolean).join(' · ');
  if (!quem && !str(v.rsvpData)) return '';
  const ate = str(v.rsvpData) ? ` até ${dateLong(v.rsvpData)}` : '';
  return `${lead}${ate}${quem ? `\n${quem}` : ''}`;
}

// ---------------------------------------------------------------- Mourning

export const FRASE_LUTO_OPTIONS: FieldOption[] = [
  { value: 'Paz à sua alma.', label: l('Paz à sua alma.', 'Rest in peace (soul).') },
  { value: 'Descanse em paz.', label: l('Descanse em paz.', 'Rest in peace.') },
  { value: 'Que a terra lhe seja leve.', label: l('Que a terra lhe seja leve.', 'May the earth rest lightly on them.') },
  {
    value: "Inna lillahi wa inna ilayhi raji'un — De Deus viemos e a Ele retornaremos.",
    label: l('Fórmula islâmica (Inna lillahi…)', 'Islamic formula (Inna lillahi…)'),
  },
  { value: '', label: l('Nenhuma', 'None') },
];

export const TRATAMENTO_FALECIDO_OPTIONS: FieldOption[] = [
  { value: '', label: l('Sem título', 'No title') },
  { value: 'Sr.', label: l('Sr.', 'Mr') },
  { value: 'Sra.', label: l('Sra.', 'Mrs/Ms') },
  { value: 'Dr.', label: l('Dr.', 'Dr (m)') },
  { value: 'Dra.', label: l('Dra.', 'Dr (f)') },
  { value: 'Eng.º', label: l('Eng.º', 'Eng. (m)') },
  { value: 'Eng.ª', label: l('Eng.ª', 'Eng. (f)') },
  { value: 'Prof.', label: l('Prof.', 'Prof. (m)') },
  { value: 'Prof.ª', label: l('Prof.ª', 'Prof. (f)') },
  { value: 'Pastor', label: l('Pastor', 'Pastor') },
  { value: 'Padre', label: l('Padre', 'Priest') },
  { value: 'Irmã', label: l('Irmã', 'Sister') },
  { value: 'Xehe', label: l('Xehe', 'Sheikh') },
];

export const SIMBOLO_OPTIONS: FieldOption[] = [
  { value: 'nenhum', label: l('Nenhum símbolo', 'No symbol') },
  { value: 'cruz', label: l('Cruz', 'Cross') },
];

/** "1948 – 2026" or "12.03.1948 – 08.10.2026". */
export function vidaDatas(nascimento: unknown, falecimento: unknown, completas = false): string {
  const short = (iso: unknown) => {
    const d = parseISODate(str(iso));
    if (!d) return '';
    return completas ? `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}` : String(d.getFullYear());
  };
  const a = short(nascimento);
  const b = short(falecimento);
  if (a && b) return `${a} – ${b}`;
  return b ? `† ${b}` : '';
}

// ---------------------------------------------------------------- Blocks

/** A centred display line (most common shape). */
export const disp = (text: string, size: Extract<Block, { type: 'display' }>['size'], extra: Partial<Extract<Block, { type: 'display' }>> = {}): Block => ({
  type: 'display',
  text,
  size,
  ...extra,
});

/** Small muted footer lines (RSVP, dress code…), skipping empty ones. */
export function footer(lines: string[]): Block[] {
  const ls = lines.map((s) => s.trim()).filter(Boolean);
  if (!ls.length) return [];
  return ls.map((t, i) => disp(t, 'xs', { tone: 'muted', fit: t.length > 60, after: i === ls.length - 1 ? 0 : 1.5 }));
}

/** Verb agreement ("comunica/comunicam"): plural when the subject lists people or starts with "os/as". */
export function plural(subject: string): boolean {
  const s = ` ${subject.toLowerCase()} `;
  return /,|\se\s/.test(s) || /^\s(os|as)\s/.test(s);
}

/** ", na Cidade de Maputo" / ", em Maputo" — place phrase for "ocorrido no dia …". */
export function emLocal(local: unknown): string {
  const s = str(local).replace(/^(na|no|em)\s+/i, '');
  if (!s) return '';
  if (/^(cidade|província|provincia|vila|localidade|aldeia|beira|matola|maxixe|ilha)\b/i.test(s)) return `, na ${s}`;
  if (/^(chimoio|distrito|posto)\b/i.test(s)) return `, no ${s}`;
  return `, em ${s}`;
}

/** Shortens a line that must stay on one line of a small format (card, envelope). */
export function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

const STEP_UP = { xs: 'sm', sm: 'md', md: 'lg', lg: 'xl', xl: 'xxl', xxl: 'xxl', xxxl: 'xxxl' } as const;

/**
 * Small cards (A6) print at a reduced type scale: this sets every display line
 * one size up and opens the spacing, so the card is filled and legible.
 */
export function cardScale(blocks: Block[]): Block[] {
  return blocks.map((b) =>
    b.type === 'display' ? { ...b, size: STEP_UP[b.size ?? 'md'], after: b.after === undefined ? undefined : Math.round(b.after * 1.6 * 10) / 10 } : b,
  );
}
