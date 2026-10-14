// Shared helpers for the personal/family documents and the extra HR documents
// (autorização de viagem de menor, união de facto, cedência ocasional…).

import { yearsBetween } from '@/lib/format';
import type { Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import type { Block, DefaultsContext, FieldDef, Values } from '../model';
import { BLANK, dateLong, estadoCivilF, isF, l, workerFields } from './_shared';

// ---------------------------------------------------------------- Personal profile defaults

const PROFILE_VALUES: Record<string, (p: Profile) => string | undefined> = {
  Nome: (p) => p.nome,
  Genero: (p) => p.genero,
  DocTipo: (p) => p.docTipo,
  DocNumero: (p) => p.docNumero,
  DocEmissao: (p) => p.docEmissao,
  DocLocal: (p) => p.docLocal,
  Nuit: (p) => p.nuit,
  EstadoCivil: (p) => p.estadoCivil,
  Nacionalidade: (p) => p.nacionalidade,
  Naturalidade: (p) => p.naturalidade,
  Morada: (p) => addressLine(p),
  Telefone: (p) => p.telefones,
};

/** Defaults the author's fields from a personal profile (kind 'pessoa'). */
export function fromPersonalProfile(fields: FieldDef[], prefix: string): FieldDef[] {
  return fields.map((f) => {
    const pick = PROFILE_VALUES[f.name.slice(prefix.length)];
    if (!pick) return f;
    const fallback = f.default;
    return {
      ...f,
      default: (c: DefaultsContext) => {
        const fromProfile = c.profile?.kind === 'pessoa' ? pick(c.profile) : '';
        if (fromProfile) return fromProfile;
        return typeof fallback === 'function' ? fallback(c) : fallback ?? '';
      },
    };
  });
}

export const PESSOA_KEYS = [
  'nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada',
] as const;

/** Person fields for a role (e.g. 'declarante'), optionally defaulted from the personal profile. */
export function pessoaFields(prefix: string, section: string, opts: { profile?: boolean; keys?: readonly string[]; required?: boolean } = {}): FieldDef[] {
  const keys = (opts.keys ?? PESSOA_KEYS) as Parameters<typeof workerFields>[0];
  let defs = workerFields([...keys], section, prefix);
  if (opts.required === false) defs = defs.map((f) => ({ ...f, required: false }));
  return opts.profile ? fromPersonalProfile(defs, prefix) : defs;
}

// ---------------------------------------------------------------- Identification text

const DOC_NOME: Record<string, string> = { BI: 'Bilhete de Identidade', DIRE: 'DIRE', Passaporte: 'Passaporte' };

export const str = (v: unknown) => (v == null ? '' : String(v).trim());

/**
 * Full identification of a person, notarial style:
 * "**Nome**, casado, de nacionalidade moçambicana, portador do Bilhete de
 * Identidade n.º …, emitido em Maputo, a …, NUIT …, residente em …".
 */
export function identificacao(v: Values, p: string, opts: { morada?: boolean; nuit?: boolean; estadoCivil?: boolean } = {}): string {
  const get = (k: string) => str(v[`${p}${k}`]);
  const f = isF(get('Genero'));
  const ec = get('EstadoCivil');
  const estado = !ec ? '' : ec === 'união de facto' ? 'em união de facto' : f ? estadoCivilF(ec) : ec;
  const emissao = [get('DocLocal') ? `em ${get('DocLocal')}` : '', get('DocEmissao') ? `a ${dateLong(get('DocEmissao'))}` : '']
    .filter(Boolean)
    .join(', ');
  const doc = `${f ? 'portadora' : 'portador'} do ${DOC_NOME[get('DocTipo')] ?? 'Bilhete de Identidade'} n.º ${get('DocNumero') || BLANK}${emissao ? `, emitido ${emissao}` : ''}`;
  return [
    `**${get('Nome') || BLANK}**`,
    opts.estadoCivil === false ? '' : estado,
    get('Nacionalidade') ? `de nacionalidade ${get('Nacionalidade')}` : '',
    doc,
    opts.nuit !== false && get('Nuit') ? `NUIT ${get('Nuit')}` : '',
    opts.morada === false ? '' : `residente em ${get('Morada') || BLANK}`,
  ]
    .filter(Boolean)
    .join(', ');
}

/** "o declarante"/"a declarante" style picker. */
export const gx = (genero: unknown, m: string, f: string) => (isF(genero) ? f : m);

/** Ensures a final full stop. */
export const endDot = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

/** Lower-cases the first letter unless it starts an acronym. */
export function lowerFirst(s: string): string {
  const t = s.trim();
  if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2}/.test(t)) return t;
  return t.charAt(0).toLowerCase() + t.slice(1);
}

/** Age in complete years on a date (null when unknown). */
export function ageOn(birth: unknown, on: unknown): number | null {
  if (typeof birth !== 'string' || !birth || typeof on !== 'string' || !on) return null;
  return yearsBetween(birth, on);
}

// ---------------------------------------------------------------- Notarial certification box

export const RECONHECIMENTO_FIELD = (section: string): FieldDef => ({
  name: 'espacoReconhecimento',
  type: 'toggle',
  section,
  default: true,
  label: l('Deixar espaço para o reconhecimento da assinatura', 'Leave space for the signature certification'),
  help: l(
    'Caixa em branco onde o notário, a conservatória ou a esquadra da PRM apõe o reconhecimento e o carimbo.',
    'Blank box where the notary, registry or police station adds the certification and stamp.',
  ),
});

/** Dashed box reserved for the notarial certification of the signature(s). */
export function notaryBox(text?: string): Block {
  return { type: 'box', label: 'Reconhecimento notarial', text, lines: 3, dashed: true, width: 'half', align: 'right' };
}

// ---------------------------------------------------------------- Common selects

export const PARENTESCO_OPTIONS = [
  { value: 'pai', label: l('Pai', 'Father') },
  { value: 'mãe', label: l('Mãe', 'Mother') },
  { value: 'tutor', label: l('Tutor(a) / quem exerce o poder parental', 'Guardian') },
];

/** "pai", "mãe", "tutor"/"tutora" for the text. */
export function qualidadeParental(v: unknown, genero: unknown): string {
  if (v === 'pai') return 'pai';
  if (v === 'mãe') return 'mãe';
  return isF(genero) ? 'tutora' : 'tutor';
}

// ---------------------------------------------------------------- Entities

const ENT_F = /^(administra[cç][aã]o|direc[cç][aã]o|conservat[oó]ria|autoridade|embaixada|reparti[cç][aã]o|secretaria|pol[ií]cia|esquadra|delega[cç][aã]o|procuradoria|comiss[aã]o|inspec[cç][aã]o|alf[aâ]ndega|c[aâ]mara|localidade|sec[cç][aã]o|entidade|empresa|associa[cç][aã]o|funda[cç][aã]o|sociedade|universidade|escola|igreja|ag[eê]ncia|organiza[cç][aã]o|rep[uú]blica|prov[ií]ncia|cidade|regi[aã]o)\b/i;
const ENT_M = /^(minist[eé]rio|tribunal|conselho|servi[cç]o|munic[ií]pio|posto|gabinete|consulado|cart[oó]rio|centro|departamento|governo|comando|distrito|banco|instituto|fundo|hospital|programa|projecto)\b/i;

/** "da Administração…", "do Tribunal…", "de Maria Silva"; keeps an article the user already typed. */
export function deEntidade(e: string): string {
  const t = e.trim();
  const m = /^(a|o|as|os)\s+(.*)$/i.exec(t);
  if (m) return `d${m[1].toLowerCase()} ${m[2]}`;
  if (ENT_F.test(t)) return `da ${t}`;
  if (ENT_M.test(t)) return `do ${t}`;
  return `de ${t}`;
}

/** "pela Direcção…", "pelo Instituto…", "por João Silva". */
export function porEntidade(e: string): string {
  return deEntidade(e).replace(/^da /, 'pela ').replace(/^do /, 'pelo ').replace(/^das /, 'pelas ').replace(/^dos /, 'pelos ').replace(/^de /, 'por ');
}
