// Shared building blocks for templates: common fields, party descriptions and
// gendered forms. Templates import from here to stay consistent.

import { legalCitation, type LegalRefId } from '@/legal/mz-legal';
import { formatDateLong, formatMoney, orBlank, parseMoney, BLANK } from '@/lib/format';
import type { Profile } from '@/lib/storage/types';
import { profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import type { FieldDef, FieldOption, L10n, SignatureColumn, TemplateContext, Values } from '../model';

export const l = (pt: string, en: string): L10n => ({ pt, en });

// ---------------------------------------------------------------- Options

export const GENERO_OPTIONS: FieldOption[] = [
  { value: 'M', label: l('Masculino', 'Male') },
  { value: 'F', label: l('Feminino', 'Female') },
];

export const DOC_TIPO_OPTIONS: FieldOption[] = [
  { value: 'BI', label: l('Bilhete de Identidade (BI)', 'Identity card (BI)') },
  { value: 'DIRE', label: l('DIRE (estrangeiros residentes)', 'DIRE (resident foreigners)') },
  { value: 'Passaporte', label: l('Passaporte', 'Passport') },
];

export const FORMA_PAGAMENTO_OPTIONS: FieldOption[] = [
  { value: 'transferência bancária', label: l('Transferência bancária', 'Bank transfer') },
  { value: 'numerário', label: l('Numerário (dinheiro)', 'Cash') },
  { value: 'M-Pesa', label: l('M-Pesa', 'M-Pesa') },
  { value: 'e-Mola', label: l('e-Mola', 'e-Mola') },
  { value: 'mKesh', label: l('mKesh', 'mKesh') },
  { value: 'cheque', label: l('Cheque', 'Cheque') },
];

export const ESTADO_CIVIL_OPTIONS: FieldOption[] = [
  { value: 'solteiro', label: l('Solteiro(a)', 'Single') },
  { value: 'casado', label: l('Casado(a)', 'Married') },
  { value: 'união de facto', label: l('União de facto', 'Civil union') },
  { value: 'divorciado', label: l('Divorciado(a)', 'Divorced') },
  { value: 'viúvo', label: l('Viúvo(a)', 'Widowed') },
];

// ---------------------------------------------------------------- Common fields

export function refField(section = 'documento'): FieldDef {
  return {
    name: 'ref',
    type: 'text',
    section,
    width: 'half',
    label: l('Número de referência', 'Reference number'),
    help: l('Gerado a partir da numeração do perfil. Pode alterar.', 'Generated from the profile numbering. You can change it.'),
    default: (c) => c.nextRef,
  };
}

export function localField(section = 'documento'): FieldDef {
  return {
    name: 'local',
    type: 'text',
    section,
    width: 'half',
    label: l('Local', 'Place'),
    default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo',
  };
}

export function dateField(name = 'data', section = 'documento', label = l('Data do documento', 'Document date')): FieldDef {
  return { name, type: 'date', section, width: 'half', label, required: true, default: (c) => c.today };
}

type WorkerKey =
  | 'nome' | 'genero' | 'cargo' | 'categoria' | 'departamento' | 'dataAdmissao' | 'salario'
  | 'docTipo' | 'docNumero' | 'docEmissao' | 'docLocal' | 'nuit' | 'inss' | 'morada' | 'nacionalidade'
  | 'estadoCivil' | 'naturalidade' | 'telefone';

/**
 * Worker fields with the `trabalhador` prefix, e.g. trabalhadorNome. Pass the
 * keys needed, in order. All are auto-filled from a saved person.
 */
export function workerFields(keys: WorkerKey[], section = 'trabalhador', prefix = 'trabalhador'): FieldDef[] {
  const defs: Record<WorkerKey, Omit<FieldDef, 'name' | 'section'>> = {
    nome: { type: 'text', label: l('Nome completo', 'Full name'), required: true, personKey: 'nome' },
    genero: {
      type: 'radio',
      label: l('Tratamento', 'Form of address'),
      help: l('Define "Exmo. Senhor" ou "Exma. Senhora" e a concordância do texto.', 'Sets "Exmo. Senhor" or "Exma. Senhora" and grammatical agreement.'),
      options: GENERO_OPTIONS,
      default: 'M',
      personKey: 'genero',
      width: 'half',
    },
    cargo: { type: 'text', label: l('Cargo / função', 'Position'), personKey: 'cargo', width: 'half' },
    categoria: { type: 'text', label: l('Categoria profissional', 'Job grade'), personKey: 'categoria', width: 'half' },
    departamento: { type: 'text', label: l('Departamento', 'Department'), personKey: 'departamento', width: 'half' },
    dataAdmissao: { type: 'date', label: l('Data de admissão', 'Start date'), personKey: 'dataAdmissao', width: 'half' },
    salario: { type: 'money', label: l('Salário base mensal', 'Monthly base salary'), personKey: 'salarioBase', width: 'half' },
    docTipo: { type: 'select', label: l('Documento de identificação', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', personKey: 'docTipo', width: 'half' },
    docNumero: { type: 'text', label: l('Número do documento', 'Document number'), personKey: 'docNumero', width: 'half' },
    docEmissao: { type: 'date', label: l('Data de emissão', 'Issue date'), personKey: 'docEmissao', width: 'half' },
    docLocal: { type: 'text', label: l('Local de emissão', 'Place of issue'), personKey: 'docLocal', width: 'half' },
    nuit: { type: 'text', label: l('NUIT', 'Tax number (NUIT)'), personKey: 'nuit', width: 'half' },
    inss: { type: 'text', label: l('N.º de beneficiário do INSS', 'INSS number'), personKey: 'inss', width: 'half' },
    morada: { type: 'text', label: l('Morada', 'Address'), personKey: 'morada' },
    nacionalidade: { type: 'text', label: l('Nacionalidade', 'Nationality'), personKey: 'nacionalidade', default: 'moçambicana', width: 'half' },
    estadoCivil: { type: 'select', label: l('Estado civil', 'Marital status'), options: ESTADO_CIVIL_OPTIONS, personKey: 'estadoCivil', width: 'half' },
    naturalidade: { type: 'text', label: l('Naturalidade', 'Place of birth'), personKey: 'naturalidade', width: 'half' },
    telefone: { type: 'tel', label: l('Telefone', 'Phone'), personKey: 'telefone', width: 'half' },
  };
  const cap = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);
  return keys.map((k) => ({ ...defs[k], name: `${prefix}${cap(k)}`, section }));
}

// ---------------------------------------------------------------- Gender helpers

export const isF = (g: unknown) => g === 'F';

/** Feminine form of a marital status ("casado" → "casada"); "união de facto" is unchanged. */
export function estadoCivilF(ec: string): string {
  return ec.replace(/^(solteir|casad|divorciad|viúv|separad)o\b/i, '$1a');
}
/** g(v.trabalhadorGenero, 'o trabalhador', 'a trabalhadora') */
export const g = (genero: unknown, m: string, f: string) => (isF(genero) ? f : m);
export const exmo = (genero: unknown) => (isF(genero) ? 'Exma. Senhora' : 'Exmo. Senhor');

// ---------------------------------------------------------------- Text helpers

export const dateLong = (iso: unknown) => formatDateLong(typeof iso === 'string' ? iso : '');
export const money = (v: unknown) => parseMoney(v);
export const moneyText = (v: unknown) => formatMoney(parseMoney(v));
export const blank = (v: unknown) => orBlank(v);
export { BLANK, formatMoney, orBlank };

/** "art. 70.º da Lei n.º 13/2023" */
export const cite = (id: LegalRefId) => legalCitation(id);

/** "Maputo, 12 de Outubro de 2026" */
export function placeDate(ctx: TemplateContext, iso?: unknown): string {
  return `${ctx.place}, ${dateLong(iso ?? ctx.values.data ?? ctx.today)}`;
}

export function splitLines(text: unknown): string[] {
  if (typeof text !== 'string') return [];
  return text
    .split(/\n+/)
    .map((s) => s.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}

export function lineItems(v: unknown): Record<string, any>[] {
  return Array.isArray(v) ? (v as Record<string, any>[]) : [];
}

// ---------------------------------------------------------------- Employer

export function employerName(ctx: TemplateContext): string {
  return profileDisplayName(ctx.profile) || BLANK;
}

export function employerRep(ctx: TemplateContext): { nome: string; cargo: string } {
  return {
    nome: ctx.profile?.representanteNome || '',
    cargo: ctx.profile?.representanteCargo || '',
  };
}

/** Contract party description for a company. */
export function employerParty(ctx: TemplateContext, designation = 'Empregador'): string {
  const p = ctx.profile;
  if (!p) return `${BLANK}, adiante designada por ${designation}`;
  if (p.kind === 'pessoa') return personProfileParty(p, designation);
  const parts = [
    `**${profileDisplayName(p) || BLANK}**`,
    addressLine(p) ? `com sede em ${addressLine(p)}` : '',
    p.nuit ? `com o NUIT ${p.nuit}` : '',
    p.nuel ? `registada sob o NUEL ${p.nuel}` : '',
    p.representanteNome
      ? `neste acto representada por ${p.representanteNome}${p.representanteCargo ? `, na qualidade de ${p.representanteCargo}` : ''}`
      : '',
  ].filter(Boolean);
  return `${parts.join(', ')}, adiante designada por **${designation}**`;
}

export function personProfileParty(p: Profile, designation: string): string {
  const parts = [
    `**${p.nome || BLANK}**`,
    p.estadoCivil ? p.estadoCivil : '',
    p.nacionalidade ? `de nacionalidade ${p.nacionalidade}` : '',
    p.docNumero ? `portador(a) do ${p.docTipo ?? 'BI'} n.º ${p.docNumero}${p.docEmissao ? `, emitido em ${dateLong(p.docEmissao)}` : ''}${p.docLocal ? `, em ${p.docLocal}` : ''}` : '',
    p.nuit ? `NUIT ${p.nuit}` : '',
    addressLine(p) ? `residente em ${addressLine(p)}` : '',
  ].filter(Boolean);
  return `${parts.join(', ')}, adiante designado(a) por **${designation}**`;
}

/** Contract party description for a worker, from `trabalhador*` fields. */
export function workerParty(v: Values, designation?: string, prefix = 'trabalhador'): string {
  const get = (k: string) => (v[`${prefix}${k}`] as string | undefined)?.toString().trim();
  const f = isF(get('Genero'));
  const des = designation ?? (f ? 'Trabalhadora' : 'Trabalhador');
  const doc = get('DocNumero')
    ? `${f ? 'portadora' : 'portador'} do ${get('DocTipo') || 'BI'} n.º ${get('DocNumero')}${get('DocEmissao') ? `, emitido em ${dateLong(get('DocEmissao'))}` : ''}${get('DocLocal') ? `, em ${get('DocLocal')}` : ''}`
    : '';
  const parts = [
    `**${get('Nome') || BLANK}**`,
    get('EstadoCivil') ? (f ? estadoCivilF(get('EstadoCivil')!) : get('EstadoCivil')) : '',
    get('Nacionalidade') ? `de nacionalidade ${get('Nacionalidade')}` : '',
    doc,
    get('Nuit') ? `NUIT ${get('Nuit')}` : '',
    get('Morada') ? `residente em ${get('Morada')}` : '',
  ].filter(Boolean);
  return `${parts.join(', ')}, adiante ${f ? 'designada' : 'designado'} por **${des}**`;
}

// ---------------------------------------------------------------- Signatures

export function employerSignature(ctx: TemplateContext, role = 'A Entidade Empregadora'): SignatureColumn {
  const rep = employerRep(ctx);
  // An individual employer signs in their own name.
  const name = rep.nome || (ctx.profile?.kind === 'pessoa' ? ctx.profile.nome : '') || undefined;
  return { role, name, detail: rep.cargo || undefined, image: 'both' };
}

export function workerSignature(v: Values, role?: string, prefix = 'trabalhador'): SignatureColumn {
  const f = isF(v[`${prefix}Genero`]);
  return { role: role ?? (f ? 'A Trabalhadora' : 'O Trabalhador'), name: (v[`${prefix}Nome`] as string) || undefined };
}
