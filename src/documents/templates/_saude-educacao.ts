// Shared pieces for the second wave of health, veterinary, psychology,
// education and religious documents: a registered professional who is not a
// doctor (psychologist, veterinarian, pharmacist), simple text helpers and the
// encarregado/student identification used by the school letters.

import type { Profile } from '@/lib/storage/types';
import type { Block, FieldDef, SignatureColumn, TemplateContext, Values } from '../model';
import { BLANK, GENERO_OPTIONS, isF, l } from './_shared';

export const str = (x: unknown) => String(x ?? '').trim();
export const semPonto = (x: unknown) => str(x).replace(/[.;,:]+$/, '');
export const rows = (v: unknown): Record<string, any>[] => (Array.isArray(v) ? (v as Record<string, any>[]) : []);
export const or = (x: unknown, fb = BLANK) => str(x) || fb;
export const minus = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
export const lines = (x: unknown) =>
  str(x)
    .split(/\n+/)
    .map((s) => s.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);

/** "a, b e c" */
export const juntar = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

/** A textarea as a paragraph (sentence ending with a full stop) or a blank line. */
export const frase = (x: unknown) => {
  const t = semPonto(x);
  return t ? `${t.charAt(0).toUpperCase()}${t.slice(1)}.` : BLANK;
};

/** Profile helpers. */
export const issuerName = (p: Profile | null | undefined) =>
  !p ? '' : p.kind === 'pessoa' ? str(p.nome) : str(p.nomeComercial) || str(p.firma);

// ---------------------------------------------------------------- Registered professional (non-medical)

/**
 * Fields for a registered professional who is not covered by the doctor
 * helpers: psychologist, veterinarian, pharmacist, nurse. Prefix `prof`.
 * Defaults come from a personal professional profile.
 */
export function profFields(section: string, opts: { profissao: string; profissaoF: string; registoLabel?: [string, string]; ordem?: string }): FieldDef[] {
  const pessoa = (c: { profile: Profile | null }) => (c.profile?.kind === 'pessoa' ? c.profile : null);
  return [
    {
      name: 'profNome',
      type: 'text',
      section,
      width: 'half',
      required: true,
      label: l('Nome do profissional', 'Professional’s name'),
      help: l('Sem o título. Numa clínica, indique quem fez o acto.', 'Without the title. In a practice, enter who did the work.'),
      default: (c) => pessoa(c)?.nome ?? (c.profile?.representanteNome ?? '').replace(/^(Dr\.ª|Dra\.|Dr\.|Prof\.ª|Prof\.|Enf\.ª|Enf\.)\s+/, ''),
    },
    { name: 'profTitulo', type: 'text', section, width: 'half', label: l('Título (opcional)', 'Title (optional)'), placeholder: l('Dr. / Dra.', 'Dr.'), default: (c) => pessoa(c)?.tituloProfissional ?? '' },
    { name: 'profGenero', type: 'radio', section, label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: (c) => (pessoa(c)?.genero === 'F' ? 'F' : 'M') },
    {
      name: 'profProfissao',
      type: 'text',
      section,
      width: 'half',
      label: l('Profissão / especialidade', 'Profession / specialty'),
      placeholder: l(`Ex.: ${opts.profissao}`, `E.g. ${opts.profissao}`),
      default: (c) => pessoa(c)?.especialidade || '',
    },
    {
      name: 'profOrdem',
      type: 'text',
      section,
      width: 'half',
      label: opts.registoLabel ? l(opts.registoLabel[0], opts.registoLabel[1]) : l('Ordem ou entidade de registo', 'Professional body'),
      default: (c) => c.profile?.ordemProfissional?.trim() || opts.ordem || '',
    },
    { name: 'profNumero', type: 'text', section, width: 'half', label: l('N.º de inscrição / carteira profissional', 'Registration number'), default: (c) => pessoa(c)?.ordemNumero ?? '' },
  ];
}

/** "**Ana Sitoe**, psicóloga clínica, inscrita na … sob o n.º 12" */
export function profDesc(v: Values, fallback?: [string, string]): string {
  const f = isF(v.profGenero);
  const ordem = str(v.profOrdem);
  const num = str(v.profNumero);
  const reg = num ? `, ${f ? 'inscrita' : 'inscrito'}${ordem ? ` na ${ordem}` : ''} sob o n.º ${num}` : '';
  const prof = str(v.profProfissao) || (fallback ? fallback[f ? 1 : 0] : '');
  return `**${or(v.profNome)}**${prof ? `, ${minus(prof)}` : ''}${reg}`;
}

/** Signature column of the professional; uses the profile's signature only when the profile is theirs. */
export function profSignature(ctx: TemplateContext, roleM: string, roleF: string): SignatureColumn {
  const v = ctx.values;
  const nome = str(v.profNome);
  const titulo = str(v.profTitulo).length <= 8 ? str(v.profTitulo) : '';
  const num = str(v.profNumero);
  const ordem = str(v.profOrdem);
  const detail = [str(v.profProfissao), num ? `${ordem && ordem.length <= 44 ? `${ordem} — ` : ''}n.º ${num}` : ''].filter(Boolean).join('\n');
  const own = ctx.profile?.kind === 'pessoa' ? str(ctx.profile.nome).toLowerCase() : str(ctx.profile?.representanteNome).toLowerCase();
  const same = !!nome && own.endsWith(nome.toLowerCase());
  return {
    role: isF(v.profGenero) ? roleF : roleM,
    name: nome ? `${titulo ? `${titulo} ` : ''}${nome}` : undefined,
    detail: detail || undefined,
    image: same ? 'both' : 'stamp',
  };
}

// ---------------------------------------------------------------- Small blocks

/** "Para uso dos serviços" style box. */
export const usoServicos = (label = 'Para uso dos serviços', n = 3): Block => ({ type: 'box', label, lines: n });

/** Empty value placeholder used in tables. */
export const cell = (x: unknown) => str(x) || ' ';

// ---------------------------------------------------------------- School bodies

export const ORGAOS = [
  { value: 'turma', label: l('Conselho de Turma', 'Class council'), pt: 'Conselho de Turma' },
  { value: 'pedagogico', label: l('Conselho Pedagógico', 'Pedagogical council'), pt: 'Conselho Pedagógico' },
  { value: 'escola', label: l('Conselho de Escola', 'School council'), pt: 'Conselho de Escola' },
  { value: 'grupo', label: l('Grupo de disciplina / departamento', 'Subject group'), pt: 'Grupo de Disciplina' },
];

export const orgaoNome = (v: Values) => {
  const o = ORGAOS.find((x) => x.value === v.orgao) ?? ORGAOS[0];
  if (o.value === 'turma') return `${o.pt}${str(v.turmaDesc) ? ` da ${str(v.turmaDesc)}` : ''}`;
  if (o.value === 'grupo') return str(v.grupoNome) ? `Grupo de Disciplina de ${str(v.grupoNome)}` : o.pt;
  return o.pt;
};

/** "Directora Pedagógica" → "A Directora Pedagógica". */
export function papelCargo(c: string): string {
  if (/^(O|A|Os|As)\s/.test(c)) return c;
  return /^[A-Za-zÀ-ÿ-]*(ora|ina|essa|a)$/i.test(c.split(/\s+/)[0]) ? `A ${c}` : `O ${c}`;
}

/** "na sala de reuniões" stays; "Biblioteca" → "em Biblioteca"; blank → a line. */
export function emLocal(x: unknown): string {
  const s = semPonto(x);
  if (!s) return `em ${BLANK}`;
  return /^(n[ao]s?|em|junto|à|ao)\s/i.test(s) ? s : `em ${s}`;
}
