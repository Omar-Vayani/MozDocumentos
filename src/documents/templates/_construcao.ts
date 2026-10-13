// Shared building blocks for the construction, real-estate and condominium
// documents ("construcao"): works identification, the three parties of a
// works record (dono da obra, empreiteiro, fiscalização), the opening and
// closing formulas of an auto, condominium fields and number formatting.

import { formatNumber } from '@/lib/format';
import type { Profile } from '@/lib/storage/types';
import { professionalRegistration, profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import type { Block, DefaultsContext, FieldDef, FieldOption, SignatureColumn, Values } from '../model';
import { BLANK, formatMoney, l } from './_shared';
import { num, semPonto, str } from './_contratos';
import { dataPorExtenso, hora } from './_estado';

export { dataPorExtenso, hora };

// ---------------------------------------------------------------- Numbers

/** "1.250,00" (money without the unit) or '' when empty. */
export const mt = (n: number | null | undefined) => (n == null ? '' : formatMoney(n, false));
/** Quantity with up to two decimals: "12", "3,75". */
export const qt = (n: number | null | undefined) => (n == null ? '' : formatNumber(n, Number.isInteger(n) ? 0 : 2));
/** Rounded to cents. */
export const r2 = (n: number) => Math.round(n * 100) / 100;
/** Number typed by the user, or 0. */
export const n0 = (x: unknown) => num(x) ?? 0;

export const UNIDADES: FieldOption[] = [
  { value: 'm²', label: l('m² (metro quadrado)', 'm² (square metre)') },
  { value: 'm³', label: l('m³ (metro cúbico)', 'm³ (cubic metre)') },
  { value: 'ml', label: l('ml (metro linear)', 'linear metre') },
  { value: 'un', label: l('un (unidade)', 'unit') },
  { value: 'kg', label: l('kg', 'kg') },
  { value: 'vg', label: l('vg (verba global)', 'lump sum') },
  { value: 'cj', label: l('cj (conjunto)', 'set') },
  { value: 'dia', label: l('dia', 'day') },
  { value: 'mês', label: l('mês', 'month') },
];

export const IVA_OPTIONS: FieldOption[] = [
  { value: 'acrescido', label: l('Acresce IVA', 'Plus VAT') },
  { value: 'incluido', label: l('IVA incluído nos preços', 'VAT included in prices') },
  { value: 'isento', label: l('Não sujeito ou isento de IVA', 'Not subject to / exempt from VAT') },
];

// ---------------------------------------------------------------- Profile

const isContractor = (p: Profile | null) => Boolean(p && p.kind === 'empresa' && /empreiteir/i.test(`${p.licenca ?? ''} ${p.alvara ?? ''}`));
const isProfessional = (p: Profile | null) => Boolean(p && !isContractor(p) && (p.ordemNumero || /consultor/i.test(p.licenca ?? '')));

/** Who the issuing profile most likely is in a works record. */
export function emitenteDefault(c: DefaultsContext): 'empreiteiro' | 'fiscalizacao' | 'dono' {
  if (isContractor(c.profile)) return 'empreiteiro';
  if (isProfessional(c.profile)) return 'fiscalizacao';
  return c.profile?.sector === 'construcao' ? 'empreiteiro' : 'dono';
}

/** Licence text of a profile: "Alvará de Empreiteiro n.º 3021, 4.ª Classe". */
export const profileLicenca = (p: Profile | null) => str(p?.licenca) || (p?.alvara ? `Alvará n.º ${p.alvara}` : '');

/** "titular do Alvará de Empreiteiro n.º 3021, 4.ª Classe" from what the user typed. */
export function alvaraFrase(x: unknown): string {
  const t = semPonto(x);
  if (!t) return '';
  return /^(alvar|licen)/i.test(t) ? `titular do ${t.replace(/^./, (s) => s.toUpperCase())}` : `titular do Alvará n.º ${t}`;
}

// ---------------------------------------------------------------- Works fields

export function obraFields(section: string, opts: { contrato?: boolean; licenca?: boolean } = {}): FieldDef[] {
  const f: FieldDef[] = [
    {
      name: 'obraDesignacao',
      type: 'text',
      section,
      required: true,
      label: l('Obra (designação)', 'Works (name)'),
      placeholder: l('Ex.: Construção de moradia unifamiliar do tipo 3', 'E.g. Construction of a three-bedroom house'),
    },
    {
      name: 'obraLocal',
      type: 'text',
      section,
      required: true,
      label: l('Local da obra', 'Site address'),
      placeholder: l('Rua, n.º, bairro, talhão ou parcela, cidade', 'Street, no., neighbourhood, plot, city'),
    },
  ];
  if (opts.contrato !== false) {
    f.push(
      { name: 'contratoRef', type: 'text', section, width: 'half', label: l('Contrato (referência)', 'Contract (reference)'), placeholder: l('Ex.: Contrato de empreitada n.º 12/2026', 'E.g. Construction contract 12/2026') },
      { name: 'contratoData', type: 'date', section, width: 'half', label: l('Data do contrato', 'Contract date') },
    );
  }
  if (opts.licenca) {
    f.push({ name: 'obraLicenca', type: 'text', section, width: 'half', label: l('Licença de construção n.º', 'Building permit no.'), placeholder: l('Ex.: 245/CMM/2026', 'E.g. 245/CMM/2026') });
  }
  return f;
}

/** Owner, contractor and (optional) supervisor of a works record, plus who issues the record. */
export function partesObraFields(section = 'partes'): FieldDef[] {
  const prof = (c: DefaultsContext, k: 'contractor' | 'professional') => (k === 'contractor' ? isContractor(c.profile) : isProfessional(c.profile));
  return [
    {
      name: 'emitente',
      type: 'radio',
      section,
      label: l('Quem emite este documento', 'Who issues this document'),
      help: l('A assinatura e o carimbo do perfil aparecem na coluna de quem emite.', 'The profile’s signature and stamp go in the issuer’s column.'),
      options: [
        { value: 'empreiteiro', label: l('Empreiteiro', 'Contractor') },
        { value: 'fiscalizacao', label: l('Fiscalização', 'Supervisor') },
        { value: 'dono', label: l('Dono da obra', 'Owner') },
      ],
      default: emitenteDefault,
    },
    { name: 'donoNome', type: 'text', section, width: 'half', required: true, label: l('Dono da obra', 'Owner'), default: (c) => (!isContractor(c.profile) && !isProfessional(c.profile) ? profileDisplayName(c.profile) : '') },
    { name: 'donoRepresentante', type: 'text', section, width: 'half', label: l('Representado por (se for empresa)', 'Represented by (if a company)') },
    { name: 'empreiteiroNome', type: 'text', section, width: 'half', required: true, label: l('Empreiteiro', 'Contractor'), default: (c) => (prof(c, 'contractor') ? profileDisplayName(c.profile) : '') },
    {
      name: 'empreiteiroAlvara',
      type: 'text',
      section,
      width: 'half',
      label: l('Alvará do empreiteiro (n.º, classe, categoria)', 'Contractor’s licence (no., class, category)'),
      legal: l('O empreiteiro deve ter alvará válido da classe adequada ao valor da obra.', 'The contractor must hold a valid licence of the right class.'),
      placeholder: l('Ex.: Alvará de Empreiteiro n.º 3021, 4.ª Classe', 'E.g. Contractor licence 3021, class 4'),
      default: (c) => (prof(c, 'contractor') ? profileLicenca(c.profile) : ''),
    },
    { name: 'empreiteiroRepresentante', type: 'text', section, width: 'half', label: l('Representante do empreiteiro', 'Contractor’s representative'), default: (c) => (prof(c, 'contractor') ? c.profile?.representanteNome ?? '' : '') },
    { name: 'empreiteiroCargo', type: 'text', section, width: 'half', label: l('Qualidade (cargo)', 'Capacity (position)'), placeholder: l('Ex.: Director Técnico, Engenheiro residente', 'E.g. Technical Director, site engineer'), default: (c) => (prof(c, 'contractor') ? c.profile?.representanteCargo ?? '' : '') },
    { name: 'temFiscalizacao', type: 'toggle', section, label: l('Há fiscalização (engenheiro ou empresa de fiscalização)', 'There is a supervisor (engineer or consultancy)'), default: (c) => isProfessional(c.profile) },
    {
      name: 'fiscalNome',
      type: 'text',
      section,
      width: 'half',
      label: l('Fiscal (nome do técnico)', 'Supervisor (engineer’s name)'),
      showIf: (v) => Boolean(v.temFiscalizacao),
      default: (c) => (isProfessional(c.profile) ? (c.profile?.kind === 'pessoa' ? c.profile.nome ?? '' : c.profile?.representanteNome ?? '') : ''),
    },
    {
      name: 'fiscalQualificacao',
      type: 'text',
      section,
      width: 'half',
      label: l('Qualificação e inscrição', 'Qualification and registration'),
      placeholder: l('Ex.: Engenheiro Civil, OrdEM n.º 1234', 'E.g. Civil Engineer, OrdEM no. 1234'),
      showIf: (v) => Boolean(v.temFiscalizacao),
      default: (c) => (isProfessional(c.profile) ? [c.profile?.especialidade, professionalRegistration(c.profile)].filter(Boolean).join(', ') : ''),
    },
    {
      name: 'fiscalEntidade',
      type: 'text',
      section,
      label: l('Empresa de fiscalização (se houver)', 'Supervising firm (if any)'),
      showIf: (v) => Boolean(v.temFiscalizacao),
      default: (c) => (isProfessional(c.profile) && c.profile?.kind === 'empresa' ? profileDisplayName(c.profile) : ''),
    },
  ];
}

/** Works name inside a sentence: "construção de moradia…" (keeps acronyms and proper names). */
export function obraTexto(v: Values): string {
  const t = semPonto(v.obraDesignacao);
  if (!t) return BLANK;
  return /^[A-ZÀ-Ý][a-zà-ÿ]/.test(t) && !/^(Edif|Escola|Hospital|Centro|Mercado|Igreja|Bloco)/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}

/** "a) Dono da Obra: …; b) Empreiteiro: …; c) Fiscalização: …" as list items. */
export function presentesItems(v: Values): string[] {
  const items = [
    `**${str(v.donoNome) || BLANK}**, na qualidade de Dono da Obra${str(v.donoRepresentante) ? `, representado por ${semPonto(v.donoRepresentante)}` : ''};`,
    `**${str(v.empreiteiroNome) || BLANK}**${str(v.empreiteiroAlvara) ? `, ${alvaraFrase(v.empreiteiroAlvara)}` : ''}, na qualidade de Empreiteiro${str(v.empreiteiroRepresentante) ? `, representado por ${semPonto(v.empreiteiroRepresentante)}${str(v.empreiteiroCargo) ? `, ${semPonto(v.empreiteiroCargo)}` : ''}` : ''};`,
  ];
  if (v.temFiscalizacao) {
    items.push(
      `${str(v.fiscalNome) || BLANK}${str(v.fiscalQualificacao) ? `, ${semPonto(v.fiscalQualificacao)}` : ''}, em representação da Fiscalização${str(v.fiscalEntidade) ? ` (${semPonto(v.fiscalEntidade)})` : ''}.`,
    );
  } else {
    items[items.length - 1] = items[items.length - 1].replace(/;$/, '.');
  }
  return items;
}

/** Signature columns for the parties of a works record; the issuer gets the profile's signature and stamp. */
export function assinaturasObra(v: Values, roles: { dono?: string; empreiteiro?: string; fiscal?: string } = {}): SignatureColumn[] {
  const img = (k: string) => (v.emitente === k ? ('both' as const) : undefined);
  const cols: SignatureColumn[] = [
    { role: roles.dono ?? 'O Dono da Obra', name: str(v.donoRepresentante) || str(v.donoNome) || undefined, detail: str(v.donoRepresentante) ? str(v.donoNome) : undefined, image: img('dono') },
    { role: roles.empreiteiro ?? 'O Empreiteiro', name: str(v.empreiteiroRepresentante) || undefined, detail: [str(v.empreiteiroCargo), str(v.empreiteiroNome)].filter(Boolean).join(', ') || undefined, image: img('empreiteiro') },
  ];
  if (v.temFiscalizacao) {
    cols.push({ role: roles.fiscal ?? 'A Fiscalização', name: str(v.fiscalNome) || undefined, detail: str(v.fiscalQualificacao) || str(v.fiscalEntidade) || undefined, image: img('fiscalizacao') });
  }
  return cols;
}

/** Keys of the works identification shown at the top of a record. */
export function obraKeyValue(v: Values, extra: { label: string; value: string }[] = []): Block {
  return {
    type: 'keyValue',
    columns: 2,
    items: [
      { label: 'Obra', value: str(v.obraDesignacao) || BLANK },
      { label: 'Local', value: str(v.obraLocal) || BLANK },
      { label: 'Dono da Obra', value: str(v.donoNome) || BLANK },
      { label: 'Empreiteiro', value: str(v.empreiteiroNome) || BLANK },
      ...(str(v.contratoRef) || v.contratoData ? [{ label: 'Contrato', value: [str(v.contratoRef), v.contratoData ? `de ${dateShort(v.contratoData)}` : ''].filter(Boolean).join(' ') }] : []),
      ...(v.temFiscalizacao && str(v.fiscalEntidade || v.fiscalNome) ? [{ label: 'Fiscalização', value: str(v.fiscalEntidade) || str(v.fiscalNome) }] : []),
      ...extra,
    ].filter((i) => i.value),
  };
}

const dateShort = (iso: unknown) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
};
export { dateShort };

/** "E nada mais havendo a tratar, lavrou-se o presente auto…" */
export function fechoAuto(n: number): Block {
  const ext = ['', 'um', 'dois', 'três', 'quatro', 'cinco'][Math.max(2, Math.min(5, n))];
  return {
    type: 'paragraph',
    id: 'fecho',
    text: `E nada mais havendo a tratar, lavrou-se o presente auto, que, depois de lido e achado conforme, vai ser assinado por todos os presentes, em ${ext} exemplares de igual valor.`,
    en: 'There being nothing further, this record was drawn up, read, approved and signed by all present, in copies of equal value.',
    keepWithNext: true,
  };
}

/** Signatures in rows of at most three columns, kept with the closing paragraph. */
export function signatureRows(cols: SignatureColumn[]): Block[] {
  const out: Block[] = [];
  const per = cols.length === 4 ? 2 : 3;
  for (let i = 0; i < cols.length; i += per) out.push({ type: 'signatures', columns: cols.slice(i, i + per), keepWithNext: i + per < cols.length });
  return out;
}

// ---------------------------------------------------------------- Condominium

/** Building name without a leading "Condomínio do Edifício". */
const edificioDoPerfil = (p: Profile | null) => (p ? profileDisplayName(p).replace(/^condom[ií]nio\s+(do|da)\s+/i, '') : '');

export function condominioFields(section: string, opts: { administrador?: boolean } = {}): FieldDef[] {
  const f: FieldDef[] = [
    {
      name: 'edificioNome',
      type: 'text',
      section,
      width: 'half',
      required: true,
      label: l('Edifício (nome do condomínio)', 'Building (condominium name)'),
      placeholder: l('Ex.: Edifício Acácias', 'E.g. Acácias Building'),
      default: (c) => edificioDoPerfil(c.profile),
    },
    { name: 'edificioMorada', type: 'text', section, width: 'half', required: true, label: l('Morada do edifício', 'Building address'), default: (c) => (c.profile ? addressLine(c.profile) : '') },
  ];
  if (opts.administrador !== false) {
    f.push(
      { name: 'administradorNome', type: 'text', section, width: 'half', label: l('Administrador do condomínio', 'Condominium administrator'), default: (c) => c.profile?.representanteNome || (c.profile?.kind === 'pessoa' ? c.profile.nome ?? '' : '') },
      { name: 'administradorQualidade', type: 'text', section, width: 'half', label: l('Qualidade (opcional)', 'Capacity (optional)'), placeholder: l('Ex.: Administrador eleito em 15/01/2026', 'E.g. Administrator elected on 15/01/2026') },
    );
  }
  return f;
}

export const edificio = (v: Values) => `Edifício ${semPonto(v.edificioNome).replace(/^edif[ií]cio\s+/i, '') || BLANK}`;

export function administradorColumn(v: Values, role = 'O Administrador do Condomínio'): SignatureColumn {
  return { role, name: str(v.administradorNome) || undefined, detail: str(v.administradorQualidade) || undefined, image: 'both' };
}

/** Per-mille shares of the units (fracções) table. */
export function fraccoesFields(section: string, name = 'fraccoes'): FieldDef {
  return {
    name,
    type: 'lines',
    section,
    label: l('Fracções e permilagem', 'Units and per-mille shares'),
    help: l('A permilagem consta do título constitutivo da propriedade horizontal. A soma deve ser 1000.', 'The per-mille share is in the deed of the condominium. The total must be 1000.'),
    addLabel: l('Adicionar fracção', 'Add unit'),
    columns: [
      { name: 'fraccao', type: 'text', label: l('Fracção', 'Unit') },
      { name: 'condomino', type: 'text', label: l('Condómino', 'Owner') },
      { name: 'permilagem', type: 'number', label: l('Permilagem (‰)', 'Share (‰)') },
    ],
  };
}

/** "1,5‰" */
export const permil = (n: number | null) => (n == null ? '' : `${String(r2(n)).replace('.', ',')}‰`);
