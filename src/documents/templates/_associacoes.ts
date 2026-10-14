// Shared helpers for association, NGO, church and savings-group documents
// (estatutos, acta constituinte, fichas, recibos de quotas, certificados…).
// Not a template.

import { addDays, addMonths, inteiroPorExtenso } from '@/lib/format';
import { profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import type { FieldDef, FieldOption, TemplateContext, Values } from '../model';
import { BLANK, DOC_TIPO_OPTIONS, GENERO_OPTIONS, dateLong, isF, l, lineItems } from './_shared';
import { minus, semPonto, str } from './_sociedades';

export { juntar, minus, num, quantos, reconhecimentoBox, semPonto, str, valorTexto } from './_sociedades';

// ---------------------------------------------------------------- Entity

export type Natureza = 'associacao' | 'igreja' | 'ong' | 'clube' | 'grupo';

export const NATUREZA_OPTIONS: FieldOption[] = [
  { value: 'associacao', label: l('Associação', 'Association') },
  { value: 'ong', label: l('ONG / organização da sociedade civil', 'NGO / civil society organisation') },
  { value: 'clube', label: l('Clube desportivo ou recreativo', 'Sports or social club') },
  { value: 'igreja', label: l('Igreja / confissão religiosa', 'Church / religious body') },
  { value: 'grupo', label: l('Grupo informal (xitique, comissão)', 'Informal group (savings group, committee)') },
];

export const naturezaOf = (v: Values): Natureza =>
  (['associacao', 'igreja', 'ong', 'clube', 'grupo'] as const).includes(v.natureza) ? v.natureza : 'associacao';

/** "a Associação" / "a Igreja" / "o Clube" / "a Organização" / "o Grupo" */
export function aEntidade(n: Natureza): string {
  return { associacao: 'a Associação', igreja: 'a Igreja', ong: 'a Organização', clube: 'o Clube', grupo: 'o Grupo' }[n];
}
/** "da Associação" / "da Igreja" / "do Clube" … */
export function daEntidade(n: Natureza): string {
  return aEntidade(n).replace(/^a /, 'da ').replace(/^o /, 'do ');
}

/** Field with the issuing entity's nature, defaulted from the profile name. */
export function naturezaField(section: string): FieldDef {
  return {
    name: 'natureza',
    type: 'select',
    section,
    width: 'half',
    label: l('Tipo de entidade', 'Type of entity'),
    options: NATUREZA_OPTIONS,
    default: (c) => {
      const n = profileDisplayName(c.profile).toLowerCase();
      if (/igreja|par[oó]quia|congrega|minist[eé]rio evang|assembleia de deus|mesquita|comunidade isl/.test(n)) return 'igreja';
      if (/clube|desportiv/.test(n)) return 'clube';
      if (/xitique|grupo/.test(n)) return 'grupo';
      return 'associacao';
    },
  };
}

/** Name of the issuing entity (profile) or a blank. */
export function entidadeNome(ctx: TemplateContext, override?: unknown): string {
  return str(override) || profileDisplayName(ctx.profile) || BLANK;
}

/**
 * Identification of the issuing association: "**Nome**, associação sem fins
 * lucrativos, com sede em …, reconhecida por …, NUEL …, NUIT …, neste acto
 * representada por …". Only the details present in the profile are printed.
 */
export function entidadeParty(ctx: TemplateContext, designation?: string, natureza: Natureza = 'associacao'): string {
  const p = ctx.profile;
  const nome = entidadeNome(ctx);
  const tipo = {
    associacao: 'associação sem fins lucrativos',
    ong: 'organização sem fins lucrativos',
    clube: 'associação desportiva e recreativa sem fins lucrativos',
    igreja: 'confissão religiosa',
    grupo: '',
  }[natureza];
  const parts = [
    `**${nome}**`,
    tipo,
    p && addressLine(p) ? `com sede em ${addressLine(p)}` : '',
    p?.licenca ? minus(semPonto(p.licenca)) : '',
    p?.nuel ? `registada sob o NUEL ${p.nuel}` : '',
    p?.nuit ? `titular do NUIT ${p.nuit}` : '',
    p?.representanteNome
      ? `neste acto representada por ${p.representanteNome}${p.representanteCargo ? `, na qualidade de ${p.representanteCargo}` : ''}`
      : '',
  ].filter(Boolean);
  return `${parts.join(', ')}${designation ? `, adiante designada por **${designation}**` : ''}`;
}

// ---------------------------------------------------------------- People

/**
 * Identification of a natural person from prefixed fields: "**Nome**,
 * casado, de nacionalidade moçambicana, portador do BI n.º …, residente em …".
 */
export function pessoaIdent(v: Values, prefix: string): string {
  const get = (k: string) => str(v[`${prefix}${k}`]);
  const f = isF(get('Genero'));
  const doc = get('DocNumero')
    ? `${f ? 'portadora' : 'portador'} do ${get('DocTipo') || 'BI'} n.º ${get('DocNumero')}${get('DocEmissao') ? `, emitido em ${dateLong(get('DocEmissao'))}` : ''}${get('DocLocal') ? `, em ${get('DocLocal')}` : ''}`
    : '';
  const ec = get('EstadoCivil');
  return [
    `**${get('Nome') || BLANK}**`,
    ec ? (f ? ec.replace(/^(solteir|casad|divorciad|viúv)o\b/i, '$1a') : ec) : '',
    get('Nacionalidade') ? `de nacionalidade ${get('Nacionalidade')}` : '',
    doc,
    get('Nuit') ? `NUIT ${get('Nuit')}` : '',
    get('Morada') ? `residente em ${get('Morada')}` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

/** Person fields with a prefix (nome, genero, documento, nacionalidade, morada…). */
export function pessoaFields(prefix: string, section: string, keys: ('nome' | 'genero' | 'estadoCivil' | 'nacionalidade' | 'doc' | 'nuit' | 'morada' | 'telefone')[]): FieldDef[] {
  const out: FieldDef[] = [];
  for (const k of keys) {
    if (k === 'nome') out.push({ name: `${prefix}Nome`, type: 'text', section, label: l('Nome completo', 'Full name'), required: true, personKey: 'nome' });
    if (k === 'genero') out.push({ name: `${prefix}Genero`, type: 'radio', section, width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' });
    if (k === 'estadoCivil')
      out.push({
        name: `${prefix}EstadoCivil`,
        type: 'select',
        section,
        width: 'half',
        label: l('Estado civil', 'Marital status'),
        options: [
          { value: 'solteiro', label: l('Solteiro(a)', 'Single') },
          { value: 'casado', label: l('Casado(a)', 'Married') },
          { value: 'união de facto', label: l('União de facto', 'Civil union') },
          { value: 'divorciado', label: l('Divorciado(a)', 'Divorced') },
          { value: 'viúvo', label: l('Viúvo(a)', 'Widowed') },
        ],
        personKey: 'estadoCivil',
      });
    if (k === 'nacionalidade') out.push({ name: `${prefix}Nacionalidade`, type: 'text', section, width: 'half', label: l('Nacionalidade', 'Nationality'), default: 'moçambicana', personKey: 'nacionalidade' });
    if (k === 'doc')
      out.push(
        { name: `${prefix}DocTipo`, type: 'select', section, width: 'half', label: l('Documento de identificação', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', personKey: 'docTipo' },
        { name: `${prefix}DocNumero`, type: 'text', section, width: 'half', label: l('Número do documento', 'Document number'), personKey: 'docNumero' },
      );
    if (k === 'nuit') out.push({ name: `${prefix}Nuit`, type: 'text', section, width: 'half', label: l('NUIT (opcional)', 'Tax number (optional)'), personKey: 'nuit' });
    if (k === 'morada') out.push({ name: `${prefix}Morada`, type: 'text', section, label: l('Residência', 'Address'), personKey: 'morada' });
    if (k === 'telefone') out.push({ name: `${prefix}Telefone`, type: 'tel', section, width: 'half', label: l('Telefone', 'Phone'), personKey: 'telefone' });
  }
  return out;
}

/** Signatory of the entity (name, position), defaulted from the profile representative. */
export function signatarioFields(section: string, cargoDefault = 'Presidente da Direcção'): FieldDef[] {
  return [
    { name: 'signatarioNome', type: 'text', section, width: 'half', label: l('Quem assina', 'Signatory'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'signatarioCargo', type: 'text', section, width: 'half', label: l('Cargo', 'Position'), default: (c) => c.profile?.representanteCargo || cargoDefault },
  ];
}

// ---------------------------------------------------------------- Numbers

/** 0.5 → "metade", 0.75 → "três quartos", 0.2 → "um quinto"… */
export function fracao(x: number | null | undefined): string {
  if (x == null || !Number.isFinite(x)) return BLANK;
  const known: [number, string][] = [
    [0.5, 'metade'],
    [0.75, 'três quartos'],
    [2 / 3, 'dois terços'],
    [1 / 3, 'um terço'],
    [0.25, 'um quarto'],
    [0.2, 'um quinto'],
    [0.1, 'um décimo'],
  ];
  const hit = known.find(([k]) => Math.abs(k - x) < 0.001);
  return hit ? hit[1] : `${Math.round(x * 100)} por cento`;
}

/** "10 (dez)" */
export function nExt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n < 0) return BLANK;
  return `${Math.floor(n)} (${inteiroPorExtenso(Math.floor(n))})`;
}

/** 5 → "cinco" (masculine cardinal, for "cinco membros"). */
export function ext(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n < 0) return BLANK;
  return inteiroPorExtenso(Math.floor(n));
}

/** 1 → "uma vez", 2 → "duas vezes", 3 → "três vezes". */
export function vezes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n < 1) return BLANK;
  const k = Math.floor(n);
  if (k === 1) return 'uma vez';
  if (k === 2) return 'duas vezes';
  return `${inteiroPorExtenso(k)} vezes`;
}

// ---------------------------------------------------------------- Savings groups

export const PERIODO_OPTIONS = [
  { value: 'semana', label: l('Semanal', 'Weekly') },
  { value: 'quinzena', label: l('Quinzenal', 'Fortnightly') },
  { value: 'mes', label: l('Mensal', 'Monthly') },
];
export const PERIODO_TXT: Record<string, string> = { semana: 'semana', quinzena: 'quinzena', mes: 'mês' };

export type MembroPoupanca = { nome: string; doc: string; telefone: string; data: string };

/** Members in receiving order, with the date each one receives the pot (rotating mode). */
export function membrosPoupanca(v: Values): MembroPoupanca[] {
  const rows = lineItems(v.membros).filter((r) => str(r.nome));
  const ini = str(v.dataInicio);
  return rows.map((r, i) => {
    let data = '';
    if (ini) data = v.periodicidade === 'semana' ? addDays(ini, 7 * i) : v.periodicidade === 'quinzena' ? addDays(ini, 14 * i) : addMonths(ini, i);
    return { nome: str(r.nome), doc: str(r.doc), telefone: str(r.telefone), data };
  });
}

/**
 * "da **Associação X**" when the name already starts with the noun, otherwise
 * "da Associação **X**" (avoids "da Associação Associação X").
 */
export function deNome(n: Natureza, nome: string): string {
  const m = /^(associa[cç][aã]o|igreja|organiza[cç][aã]o|clube|grupo|congrega[cç][aã]o|par[oó]quia|funda[cç][aã]o|xitique)\b/i.exec(nome.trim());
  if (!m) return `${daEntidade(n)} **${nome}**`;
  const masc = /^(clube|grupo|xitique)$/i.test(m[1]);
  return `${masc ? 'do' : 'da'} **${nome}**`;
}
