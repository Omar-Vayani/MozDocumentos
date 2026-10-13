// Shared pieces for the lawyer and court documents (advocacia): party fields
// and descriptions, court addressee, numbered articles and closing formulas.

import { MAX_EXTENSO, numeroPorExtenso } from '@/lib/format';
import type { MinimumWage } from '@/legal/mz-legal';
import type { Block, FieldDef, FieldOption, TemplateContext, Values } from '../model';
import { BLANK, DOC_TIPO_OPTIONS, ESTADO_CIVIL_OPTIONS, GENERO_OPTIONS, estadoCivilF, formatMoney, isF, l, money, splitLines } from './_shared';

// ---------------------------------------------------------------- Parties

export const PARTE_TIPO_OPTIONS: FieldOption[] = [
  { value: 'pessoa', label: l('Pessoa singular', 'Individual') },
  { value: 'empresa', label: l('Empresa ou instituição', 'Company or institution') },
];

const DOC_NOME: Record<string, string> = { BI: 'Bilhete de Identidade', DIRE: 'DIRE', Passaporte: 'Passaporte' };

const get = (v: Values, k: string) => String(v[k] ?? '').trim();

export const isEmpresa = (v: Values, p: string) => v[`${p}Tipo`] === 'empresa';

/** Feminine agreement for a party: companies ("a sociedade") and women. */
export const parteF = (v: Values, p: string) => isEmpresa(v, p) || isF(v[`${p}Genero`]);

/** "Autor"/"Autora", "Réu"/"Ré"… */
export function papel(v: Values, p: string, m: string, f: string): string {
  return parteF(v, p) ? f : m;
}

/**
 * Identification fields for a party (person or company): `<p>Tipo`, `<p>Nome`,
 * `<p>Genero`, `<p>EstadoCivil`, `<p>Nacionalidade`, `<p>Profissao`,
 * `<p>DocTipo`, `<p>DocNumero`, `<p>Nuit`, `<p>Morada`, `<p>Nuel`,
 * `<p>Representante`. `light` drops the details a filer rarely knows about the
 * other side (marital status, ID).
 */
export function partyFields(p: string, section: string, opts: { light?: boolean; defaultTipo?: 'pessoa' | 'empresa' } = {}): FieldDef[] {
  const pessoa = (v: Values) => !isEmpresa(v, p);
  const empresa = (v: Values) => isEmpresa(v, p);
  const fields: FieldDef[] = [
    { name: `${p}Tipo`, type: 'radio', section, label: l('É', 'Is'), options: PARTE_TIPO_OPTIONS, default: opts.defaultTipo ?? 'pessoa' },
    { name: `${p}Nome`, type: 'text', section, required: true, label: l('Nome completo ou firma', 'Full name or company name'), personKey: 'nome' },
    { name: `${p}Genero`, type: 'radio', section, width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero', showIf: pessoa },
    { name: `${p}EstadoCivil`, type: 'select', section, width: 'half', label: l('Estado civil', 'Marital status'), options: ESTADO_CIVIL_OPTIONS, personKey: 'estadoCivil', showIf: pessoa },
    { name: `${p}Nacionalidade`, type: 'text', section, width: 'half', label: l('Nacionalidade', 'Nationality'), default: 'moçambicana', personKey: 'nacionalidade', showIf: pessoa },
    { name: `${p}Profissao`, type: 'text', section, width: 'half', label: l('Profissão (opcional)', 'Occupation (optional)'), showIf: pessoa },
    { name: `${p}DocTipo`, type: 'select', section, width: 'half', label: l('Documento de identificação', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', personKey: 'docTipo', showIf: pessoa },
    { name: `${p}DocNumero`, type: 'text', section, width: 'half', label: l('Número do documento', 'Document number'), personKey: 'docNumero', showIf: pessoa },
    { name: `${p}Nuel`, type: 'text', section, width: 'half', label: l('NUEL / matrícula (opcional)', 'Company registration no. (optional)'), showIf: empresa },
    { name: `${p}Nuit`, type: 'text', section, width: 'half', label: l('NUIT (opcional)', 'Tax number (optional)'), personKey: 'nuit' },
    { name: `${p}Morada`, type: 'text', section, required: true, label: l('Residência ou sede', 'Residence or registered office'), personKey: 'morada' },
    {
      name: `${p}Representante`,
      type: 'text',
      section,
      label: l('Representada por (opcional)', 'Represented by (optional)'),
      placeholder: l('Ex.: Ana Machava, Directora-Geral', 'E.g. Ana Machava, Managing Director'),
      showIf: empresa,
    },
  ];
  if (!opts.light) return fields;
  return fields.filter((f) => !/(EstadoCivil|DocTipo|DocNumero)$/.test(f.name));
}

/** Full identification of a party, court style. Missing data is left out, except the residence. */
export function partyDesc(v: Values, p: string): string {
  const nome = `**${(get(v, `${p}Nome`) || BLANK).toLocaleUpperCase('pt')}**`;
  if (isEmpresa(v, p)) {
    const rep = get(v, `${p}Representante`);
    return [
      nome,
      `com sede em ${get(v, `${p}Morada`) || BLANK}`,
      get(v, `${p}Nuel`) ? `registada sob o NUEL ${get(v, `${p}Nuel`)}` : '',
      get(v, `${p}Nuit`) ? `com o NUIT ${get(v, `${p}Nuit`)}` : '',
      rep ? `neste acto representada por ${rep}` : '',
    ]
      .filter(Boolean)
      .join(', ');
  }
  const f = isF(v[`${p}Genero`]);
  const ec = get(v, `${p}EstadoCivil`);
  const estado = !ec ? '' : ec === 'união de facto' ? 'em união de facto' : f ? estadoCivilF(ec) : ec;
  const docN = get(v, `${p}DocNumero`);
  return [
    nome,
    estado,
    get(v, `${p}Nacionalidade`) ? `de nacionalidade ${get(v, `${p}Nacionalidade`)}` : '',
    get(v, `${p}Profissao`),
    docN ? `${f ? 'portadora' : 'portador'} do ${DOC_NOME[get(v, `${p}DocTipo`)] ?? 'Bilhete de Identidade'} n.º ${docN}` : '',
    get(v, `${p}Nuit`) ? `NUIT ${get(v, `${p}Nuit`)}` : '',
    `residente em ${get(v, `${p}Morada`) || BLANK}`,
  ]
    .filter(Boolean)
    .join(', ');
}

/** Bold upper-case name for later mentions. */
export const nomeParte = (v: Values, p: string) => `**${(get(v, `${p}Nome`) || BLANK).toLocaleUpperCase('pt')}**`;

// ---------------------------------------------------------------- Court

export const JUIZ_OPTIONS: FieldOption[] = [
  { value: 'M', label: l('Exmo. Senhor Juiz de Direito', 'Judge (male)') },
  { value: 'F', label: l('Exma. Senhora Juíza de Direito', 'Judge (female)') },
];

/** Court fields: `tribunal`, `seccao`, `juiz`. */
export function courtFields(section = 'tribunal'): FieldDef[] {
  return [
    {
      name: 'tribunal',
      type: 'text',
      section,
      required: true,
      label: l('Tribunal', 'Court'),
      default: 'Tribunal Judicial da Cidade de Maputo',
      placeholder: l('Ex.: Tribunal Judicial da Província de Sofala', 'E.g. Provincial Court of Sofala'),
      help: l(
        'Escreva o nome completo: «Tribunal Judicial da Cidade de Maputo», «Tribunal Judicial da Província de …», «Tribunal Judicial do Distrito de …».',
        'Write the full name: “Tribunal Judicial da Cidade de Maputo”, “… da Província de …”, “… do Distrito de …”.',
      ),
    },
    {
      name: 'seccao',
      type: 'text',
      section,
      width: 'half',
      label: l('Secção (opcional)', 'Section (optional)'),
      placeholder: l('Ex.: 3.ª Secção Cível', 'E.g. 3rd Civil Section'),
      help: l('Em acções novas, a secção só é conhecida depois da distribuição. Deixe vazio.', 'For new cases the section is only known after allocation. Leave empty.'),
    },
    { name: 'juiz', type: 'radio', section, width: 'half', label: l('Tratamento do juiz', 'Form of address of the judge'), options: JUIZ_OPTIONS, default: 'M' },
  ];
}

/** "do Tribunal…", "da 3.ª Secção…" */
export function deArtigo(s: string): string {
  if (/^(sec[cç][aã]o|\d+\.?ª)/i.test(s)) return `da ${s}`;
  return `do ${s}`;
}

/** "EXMO. SENHOR JUIZ DE DIREITO DA 3.ª SECÇÃO CÍVEL DO TRIBUNAL JUDICIAL DA CIDADE DE MAPUTO" */
export function courtAddressee(v: Values): string {
  const tratamento = isF(v.juiz) ? 'Exma. Senhora Juíza de Direito' : 'Exmo. Senhor Juiz de Direito';
  const tribunal = get(v, 'tribunal') || `Tribunal Judicial ${BLANK}`;
  const seccao = get(v, 'seccao');
  return `${tratamento}${seccao ? ` ${deArtigo(seccao)}` : ''} ${deArtigo(tribunal)}`.toLocaleUpperCase('pt');
}

export const vExa = 'V. Ex.ª';

// ---------------------------------------------------------------- Articles and lists

/** One article per line of a textarea, with a full stop at the end. */
export function artigos(text: unknown): string[] {
  return splitLines(text).map((s) => (/[.:;!?]$/.test(s) ? s : `${s}.`));
}

/** "Documento n.º 1 — Factura n.º 45/2026" lines from a textarea. */
export function documentosList(text: unknown): string[] {
  return splitLines(text).map((s, i) => `Documento n.º ${i + 1} — ${s.replace(/[.;]$/, '')}`);
}

export function plural(n: number, um: string, varios: string): string {
  return `${n === 1 ? um : varios}`;
}

/** "procuração forense, 3 documentos e duplicados legais" */
export function juntaText(parts: { procuracao?: boolean; documentos: number; outros?: string[]; duplicados?: boolean }): string {
  const items: string[] = [];
  if (parts.procuracao) items.push('procuração forense');
  if (parts.documentos > 0) items.push(`${parts.documentos} ${plural(parts.documentos, 'documento', 'documentos')}`);
  for (const o of parts.outros ?? []) if (o.trim()) items.push(o.trim());
  if (parts.duplicados !== false) items.push('duplicados legais');
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

/** Witness list block items. */
export function testemunhasList(text: unknown): string[] {
  return splitLines(text);
}

// ---------------------------------------------------------------- Money

/** "15.000,00 MT (quinze mil meticais)" or a blank. */
export function moneyExt(v: unknown): string {
  const n = money(v);
  if (n == null) return formatMoney(null);
  const ext = n >= 0 && n <= MAX_EXTENSO ? ` (${numeroPorExtenso(n)})` : '';
  return `${formatMoney(n)}${ext}`;
}

// ---------------------------------------------------------------- Alçadas

/** Public-service minimum wage from the minimum wage table (user-editable in Settings). */
export function salarioMinimoFuncaoPublica(ctx: Pick<TemplateContext, 'legal'>): number | null {
  const sector = ctx.legal.value<{ sectorSalario: string }>('advAlcadas').sectorSalario;
  const table = ctx.legal.value<MinimumWage[]>('salarioMinimo');
  const row = Array.isArray(table) ? table.find((w) => w.sector.toLowerCase() === sector.toLowerCase()) : undefined;
  return row ? row.value : null;
}

/** Civil jurisdictional limits (alçadas) in meticais, or null if the wage is unknown. */
export function alcadas(ctx: Pick<TemplateContext, 'legal'>): { provincia: number; distrito: number } | null {
  const sm = salarioMinimoFuncaoPublica(ctx);
  if (sm == null) return null;
  const m = ctx.legal.value<{ provincia: number; distrito: number }>('advAlcadas');
  return { provincia: sm * m.provincia, distrito: sm * m.distrito };
}

// ---------------------------------------------------------------- Closing

export const FECHO_OPTIONS: FieldOption[] = [
  { value: 'Pede deferimento.', label: l('Pede deferimento.', 'Requests approval.') },
  { value: 'Espera deferimento.', label: l('Espera deferimento.', 'Awaits approval.') },
  { value: 'E.R.M.', label: l('E.R.M. (Espera Receber Mercê)', 'E.R.M. (traditional formula)') },
];

/** A small "Junta:" / "Valor:" line. */
export function linePara(id: string, label: string, text: string, en: string, keepWithNext = false): Block {
  return { type: 'paragraph', id, text: `**${label}:** ${text}`, en, keepWithNext };
}
