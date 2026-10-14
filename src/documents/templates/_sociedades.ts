// Shared helpers for company-law documents (pacto social, deliberações, cessão
// de quotas, beneficiário efectivo, procuração da sociedade…). Not a template.

import { formatPercent, inteiroPorExtenso, MAX_EXTENSO, numeroPorExtenso } from '@/lib/format';
import type { Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type ClauseItem, type DefaultsContext, type DocumentTemplate, type FieldDef, type FieldOption, type SignatureColumn, type TemplateContext, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, DOC_TIPO_OPTIONS, ESTADO_CIVIL_OPTIONS, GENERO_OPTIONS, dateLong, formatMoney, isF, l, lineItems, localField, money, splitLines, workerFields } from './_shared';

// ---------------------------------------------------------------- Text helpers

export const str = (x: unknown) => String(x ?? '').trim();
/** Text without a trailing full stop or comma, to be placed inside a sentence. */
export const semPonto = (x: unknown) => str(x).replace(/[.;,:]+$/, '');
/** "1. …\n2. …" when a clause has several paragraphs. */
export const numerar = (parts: string[]) => {
  const p = parts.filter(Boolean);
  return p.length === 1 ? p[0] : p.map((t, i) => `${i + 1}. ${t}`).join('\n');
};
/** Lines of a textarea as sentence fragments (no trailing punctuation, first letter lower-case). */
export const splitOutros = (x: unknown) => splitLines(x).map((t) => minus(semPonto(t))).filter(Boolean);
/** "a, b e c" */
export const juntar = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

const extenso = (n: number) => (n >= 0 && n <= MAX_EXTENSO ? numeroPorExtenso(n) : '');
/** "**100.000,00 MT** (cem mil meticais)" or a blank to fill in. */
export function valorTexto(v: unknown, bold = true): string {
  const n = money(v);
  if (n == null) return `${BLANK} MT`;
  const fig = bold ? `**${formatMoney(n)}**` : formatMoney(n);
  return extenso(n) ? `${fig} (${extenso(n)})` : fig;
}
/** Share of the capital as "40%" (or a blank). */
export function pct(part: number | null, total: number | null): string {
  if (part == null || total == null || total <= 0) return '____%';
  return formatPercent(Math.round((part / total) * 10000) / 10000);
}
export const upper = (s: string) => s.toLocaleUpperCase('pt');
/** Lower-cases the first letter unless the word looks like an acronym ("Construção civil" → "construção civil"). */
export const minus = (s: string) => (/^\p{Lu}\p{Ll}/u.test(s) ? s.charAt(0).toLocaleLowerCase('pt') + s.slice(1) : s);
/** "15 (quinze) dias" / "um dia" */
export function quantos(n: number | null | undefined, sing: string, plur: string): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return `${BLANK} ${plur}`;
  const k = Math.floor(n);
  return k === 1 ? `um ${sing}` : k <= 999_999_999 ? `${k} (${inteiroPorExtenso(k)}) ${plur}` : `${k} ${plur}`;
}
export const num = (x: unknown): number | null => {
  const n = Number(x);
  return x !== '' && x != null && Number.isFinite(n) ? n : null;
};

// ---------------------------------------------------------------- People

const DOC_NOME: Record<string, string> = { BI: 'Bilhete de Identidade', DIRE: 'DIRE', Passaporte: 'Passaporte' };

export const PESSOA_KEYS = ['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada'] as const;

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
  Morada: (p) => addressLine(p),
};

/** Person fields `<p>Nome`, `<p>Genero`… optionally defaulted from a personal profile. */
export function pessoaFields(p: string, section: string, fromProfile = false, keys: readonly (typeof PESSOA_KEYS)[number][] = PESSOA_KEYS): FieldDef[] {
  const fields = workerFields([...keys], section, p);
  if (!fromProfile) return fields;
  return fields.map((f) => {
    const pick = PROFILE_VALUES[f.name.slice(p.length)];
    if (!pick) return f;
    const fallback = f.default;
    return {
      ...f,
      default: (c: DefaultsContext) => {
        const fromP = c.profile?.kind === 'pessoa' ? pick(c.profile) : '';
        if (fromP) return fromP;
        return typeof fallback === 'function' ? fallback(c) : fallback ?? '';
      },
    };
  });
}

/** Full identification of a person, notarial style. Missing document data prints a blank to fill in. */
export function identificacao(v: Values, p: string): string {
  const get = (k: string) => str(v[`${p}${k}`]);
  const f = isF(get('Genero'));
  const ec = get('EstadoCivil');
  const estado = !ec ? '' : ec === 'união de facto' ? 'em união de facto' : f ? ec.replace(/o$/, 'a') : ec;
  const emissao = [get('DocLocal') ? `em ${get('DocLocal')}` : '', get('DocEmissao') ? `a ${dateLong(get('DocEmissao'))}` : '']
    .filter(Boolean)
    .join(', ');
  const doc = `${f ? 'portadora' : 'portador'} do ${DOC_NOME[get('DocTipo')] ?? 'Bilhete de Identidade'} n.º ${get('DocNumero') || BLANK}${emissao ? `, emitido ${emissao}` : ''}`;
  return [
    `**${get('Nome') || BLANK}**`,
    estado,
    get('Nacionalidade') ? `de nacionalidade ${get('Nacionalidade')}` : '',
    doc,
    get('Nuit') ? `titular do NUIT ${get('Nuit')}` : '',
    `residente em ${semPonto(get('Morada')) || BLANK}`,
  ]
    .filter(Boolean)
    .join(', ');
}

// ---------------------------------------------------------------- Party (individual or company)

export const isEmpresa = (v: Values, p: string) => v[`${p}Tipo`] === 'empresa';

/** Party fields switched by `<p>Tipo` (pessoa / empresa). */
export function parteFields(p: string, section: string): FieldDef[] {
  const showEmp = (v: Values) => isEmpresa(v, p);
  const pessoa = pessoaFields(p, section).map((f) => ({ ...f, showIf: (v: Values) => !isEmpresa(v, p) }));
  return [
    {
      name: `${p}Tipo`,
      type: 'radio',
      section,
      label: l('Tipo', 'Type'),
      options: [
        { value: 'pessoa', label: l('Pessoa singular', 'Individual') },
        { value: 'empresa', label: l('Sociedade / empresa', 'Company') },
      ],
      default: 'pessoa',
    },
    ...pessoa,
    { name: `${p}EmpresaNome`, type: 'text', section, required: true, label: l('Firma (denominação)', 'Company name'), showIf: showEmp },
    { name: `${p}EmpresaSede`, type: 'text', section, label: l('Sede', 'Registered office'), showIf: showEmp },
    { name: `${p}EmpresaNuel`, type: 'text', section, width: 'half', label: l('NUEL', 'Registry number (NUEL)'), showIf: showEmp },
    { name: `${p}EmpresaNuit`, type: 'text', section, width: 'half', label: l('NUIT', 'Tax number (NUIT)'), showIf: showEmp },
    { name: `${p}RepNome`, type: 'text', section, width: 'half', label: l('Representante (quem assina)', 'Representative (signatory)'), showIf: showEmp },
    { name: `${p}RepCargo`, type: 'text', section, width: 'half', label: l('Qualidade do representante', 'Representative’s capacity'), placeholder: l('Ex.: Gerente', 'E.g. Manager'), showIf: showEmp },
  ];
}

/** Identification of a party (individual or company), followed by the designation. */
export function parte(v: Values, p: string, designacao: string): string {
  if (isEmpresa(v, p)) {
    const rep = str(v[`${p}RepNome`]);
    const cargo = str(v[`${p}RepCargo`]);
    return [
      `**${str(v[`${p}EmpresaNome`]) || BLANK}**`,
      `com sede em ${semPonto(v[`${p}EmpresaSede`]) || BLANK}`,
      str(v[`${p}EmpresaNuel`]) ? `matriculada na Conservatória do Registo das Entidades Legais sob o NUEL ${str(v[`${p}EmpresaNuel`])}` : '',
      `titular do NUIT ${str(v[`${p}EmpresaNuit`]) || BLANK}`,
      `neste acto representada por ${rep || BLANK}${cargo ? `, na qualidade de ${cargo}` : ''}, com poderes para o acto`,
    ]
      .filter(Boolean)
      .join(', ') + `, adiante designada por **${designacao}**`;
  }
  const f = isF(v[`${p}Genero`]);
  return `${identificacao(v, p)}, adiante ${f ? 'designada' : 'designado'} por **${designacao}**`;
}

export function parteNome(v: Values, p: string): string {
  return isEmpresa(v, p) ? str(v[`${p}EmpresaNome`]) : str(v[`${p}Nome`]);
}

export function parteSignature(v: Values, p: string, role: string): SignatureColumn {
  if (isEmpresa(v, p)) {
    return {
      role,
      name: str(v[`${p}RepNome`]) || undefined,
      detail: [str(v[`${p}RepCargo`]), str(v[`${p}EmpresaNome`])].filter(Boolean).join(', ') || undefined,
    };
  }
  return { role, name: str(v[`${p}Nome`]) || undefined };
}

// ---------------------------------------------------------------- The company concerned

export const TIPO_SOCIEDADE_OPTIONS: FieldOption[] = [
  { value: 'quotas', label: l('Sociedade por quotas (Lda)', 'Private limited company (Lda)') },
  { value: 'unipessoal', label: l('Sociedade unipessoal por quotas', 'Single-member limited company') },
  { value: 'anonima', label: l('Sociedade anónima (SA)', 'Public limited company (SA)') },
  { value: 'sas', label: l('Sociedade por acções simplificada', 'Simplified share company') },
];

const TIPO_TEXTO: Record<string, string> = {
  quotas: 'sociedade comercial por quotas de responsabilidade limitada',
  unipessoal: 'sociedade unipessoal por quotas',
  anonima: 'sociedade anónima',
  sas: 'sociedade por acções simplificada',
};

const fromCompany = (k: keyof Profile) => (c: DefaultsContext) => (c.profile?.kind === 'empresa' ? String(c.profile[k] ?? '') : '');

/** Fields that identify the company concerned (default: the issuing company profile). */
export function sociedadeFields(section = 'sociedade', opts: { capital?: boolean; tipo?: boolean } = {}): FieldDef[] {
  const out: FieldDef[] = [
    {
      name: 'sociedadeFirma',
      type: 'text',
      section,
      required: true,
      label: l('Firma da sociedade', 'Company name'),
      help: l('Tal como consta da certidão de registo. Ex.: «Machava & Filhos — Construção, Lda».', 'Exactly as in the registry certificate.'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.firma || c.profile.nomeComercial || '' : ''),
    },
  ];
  if (opts.tipo !== false) {
    out.push({ name: 'sociedadeTipo', type: 'select', section, width: 'half', label: l('Tipo de sociedade', 'Type of company'), options: TIPO_SOCIEDADE_OPTIONS, default: 'quotas' });
  }
  out.push(
    {
      name: 'sociedadeSede',
      type: 'text',
      section,
      required: true,
      label: l('Sede', 'Registered office'),
      default: (c) => (c.profile?.kind === 'empresa' ? addressLine(c.profile) : ''),
    },
    {
      name: 'sociedadeConservatoria',
      type: 'text',
      section,
      width: 'half',
      label: l('Conservatória (cidade)', 'Registry (city)'),
      help: l('Cidade da Conservatória do Registo das Entidades Legais onde a sociedade está matriculada.', 'City of the Legal Entities Registry where the company is registered.'),
      default: (c) => c.profile?.morada?.cidade || 'Maputo',
    },
    { name: 'sociedadeNuel', type: 'text', section, width: 'half', label: l('NUEL', 'Registry number (NUEL)'), default: fromCompany('nuel') },
    { name: 'sociedadeNuit', type: 'text', section, width: 'half', label: l('NUIT', 'Tax number (NUIT)'), default: fromCompany('nuit') },
  );
  if (opts.capital !== false) {
    out.push({ name: 'sociedadeCapital', type: 'money', section, width: 'half', label: l('Capital social', 'Share capital'), default: fromCompany('capitalSocial') });
  }
  return out;
}

export const sociedadeNome = (v: Values) => str(v.sociedadeFirma) || BLANK;

/** "**FIRMA**, sociedade comercial por quotas…, com sede em …, matriculada … sob o NUEL …, com o capital social de …, titular do NUIT …" */
export function sociedadeIdent(v: Values, opts: { capital?: boolean } = {}): string {
  const cons = str(v.sociedadeConservatoria);
  return [
    `**${sociedadeNome(v)}**`,
    v.sociedadeTipo ? TIPO_TEXTO[v.sociedadeTipo] ?? '' : '',
    `com sede em ${semPonto(v.sociedadeSede) || BLANK}`,
    `matriculada na Conservatória do Registo das Entidades Legais${cons ? ` de ${cons}` : ''} sob o NUEL ${str(v.sociedadeNuel) || BLANK}`,
    opts.capital !== false && money(v.sociedadeCapital) != null ? `com o capital social de ${valorTexto(v.sociedadeCapital, false)}` : '',
    `titular do NUIT ${str(v.sociedadeNuit) || BLANK}`,
  ]
    .filter(Boolean)
    .join(', ');
}

// ---------------------------------------------------------------- Members (lines field)

export const SOCIO_COLUMNS: FieldDef[] = [
  {
    name: 'tipo',
    type: 'select',
    label: l('Pessoa singular ou sociedade', 'Individual or company'),
    options: [
      { value: 'pessoa', label: l('Pessoa singular', 'Individual') },
      { value: 'empresa', label: l('Sociedade / empresa', 'Company') },
    ],
  },
  { name: 'nome', type: 'text', label: l('Nome completo ou firma', 'Full name or company name') },
  { name: 'genero', type: 'select', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS },
  { name: 'estadoCivil', type: 'select', label: l('Estado civil', 'Marital status'), options: ESTADO_CIVIL_OPTIONS },
  { name: 'nacionalidade', type: 'text', label: l('Nacionalidade', 'Nationality'), placeholder: l('Ex.: moçambicana', 'E.g. Mozambican') },
  { name: 'docTipo', type: 'select', label: l('Documento (pessoa singular)', 'ID document (individual)'), options: DOC_TIPO_OPTIONS },
  { name: 'docNumero', type: 'text', label: l('N.º do documento / NUEL', 'Document no. / NUEL') },
  { name: 'nuit', type: 'text', label: l('NUIT', 'Tax number (NUIT)') },
  { name: 'morada', type: 'text', label: l('Residência ou sede', 'Address or registered office') },
  { name: 'representante', type: 'text', label: l('Representante (se sociedade)', 'Representative (if a company)'), placeholder: l('Ex.: João Matsinhe, Administrador', 'E.g. name, position') },
  { name: 'quota', type: 'money', label: l('Valor nominal da quota (MT)', 'Nominal value of the quota (MT)') },
];

export type Socio = { tipo: string; nome: string; genero: string; estadoCivil: string; nacionalidade: string; docTipo: string; docNumero: string; nuit: string; morada: string; representante: string; quota: number | null };

export function socios(v: unknown): Socio[] {
  return lineItems(v)
    .map((r) => ({
      tipo: str(r.tipo) || 'pessoa',
      nome: str(r.nome),
      genero: str(r.genero),
      estadoCivil: str(r.estadoCivil),
      nacionalidade: str(r.nacionalidade),
      docTipo: str(r.docTipo),
      docNumero: str(r.docNumero),
      nuit: str(r.nuit),
      morada: semPonto(r.morada),
      representante: semPonto(r.representante),
      quota: money(r.quota),
    }))
    .filter((s) => s.nome || s.quota != null);
}

/** Identification of a member from a row of the members table. */
export function socioIdent(s: Socio): string {
  if (s.tipo === 'empresa') {
    return [
      `**${s.nome || BLANK}**`,
      `com sede em ${s.morada || BLANK}`,
      s.docNumero ? `matriculada sob o NUEL ${s.docNumero}` : '',
      `titular do NUIT ${s.nuit || BLANK}`,
      `neste acto representada por ${s.representante || BLANK}, com poderes para o acto`,
    ]
      .filter(Boolean)
      .join(', ');
  }
  const v: Values = {
    xNome: s.nome,
    xGenero: s.genero,
    xEstadoCivil: s.estadoCivil,
    xNacionalidade: s.nacionalidade,
    xDocTipo: s.docTipo,
    xDocNumero: s.docNumero,
    xNuit: s.nuit,
    xMorada: s.morada,
  };
  return identificacao(v, 'x');
}

export function socioSignature(s: Socio): SignatureColumn {
  if (s.tipo === 'empresa') {
    const [nome, ...cargo] = s.representante.split(',');
    // A long company name in the role would wrap and push its signature line below the others.
    return { role: 'A Sócia', name: str(nome) || undefined, detail: [cargo.join(',').trim(), s.nome].filter(Boolean).join(', ') || undefined };
  }
  return { role: isF(s.genero) ? 'A Sócia' : 'O Sócio', name: s.nome || undefined };
}

/** Splits signature columns into rows of at most three. */
export function signatureRows(cols: SignatureColumn[], placeDate?: string): Block[] {
  const rows: Block[] = [];
  for (let i = 0; i < cols.length; i += 3) {
    rows.push({ type: 'signatures', columns: cols.slice(i, i + 3), ...(i === 0 && placeDate ? { placeDate } : {}) });
  }
  return rows.length ? rows : [{ type: 'signatures', columns: [{ role: 'O Sócio' }], ...(placeDate ? { placeDate } : {}) }];
}

// ---------------------------------------------------------------- Company signatories

export const REPRESENTANTE_COLUMNS: FieldDef[] = [
  { name: 'nome', type: 'text', label: l('Nome', 'Name') },
  { name: 'cargo', type: 'text', label: l('Cargo', 'Position'), placeholder: l('Ex.: Gerente', 'E.g. Manager') },
];

export function representantesDefault(c: DefaultsContext): Record<string, unknown>[] {
  if (c.profile?.kind !== 'empresa') return [{ nome: '', cargo: 'Gerente' }];
  return [{ nome: c.profile.representanteNome || '', cargo: c.profile.representanteCargo || 'Gerente' }];
}

export function representantes(v: unknown): { nome: string; cargo: string }[] {
  return lineItems(v)
    .map((r) => ({ nome: str(r.nome), cargo: semPonto(r.cargo) }))
    .filter((r) => r.nome || r.cargo);
}

/** "por Ana Machava, na qualidade de Gerente, e por …" */
export function representadaPor(reps: { nome: string; cargo: string }[]): string {
  if (!reps.length) return `neste acto representada por ${BLANK}, com poderes para o acto`;
  return `neste acto representada por ${juntar(reps.map((r) => `${r.nome || BLANK}${r.cargo ? `, na qualidade de ${r.cargo}` : ''}`))}, com poderes para o acto`;
}

/**
 * Signature columns for the company's representatives. With `role` (e.g. "A Sociedade", when the
 * company is a designated party beside others), the company name moves to the detail line so the
 * role stays on one line and the signature lines of a row stay aligned.
 */
export function companyColumns(ctx: TemplateContext, reps: { nome: string; cargo: string }[], role?: string): SignatureColumn[] {
  const p = ctx.profile?.kind === 'empresa' ? ctx.profile : null;
  // The profile's signature and stamp belong to its representative only.
  const owner = p ? reps.findIndex((r) => r.nome && r.nome === p.representanteNome) : -1;
  const imageAt = p ? (owner >= 0 ? owner : reps.every((r) => !r.nome) ? 0 : -1) : -1;
  return (reps.length ? reps : [{ nome: '', cargo: '' }]).map((r, i) => ({
    role: role ?? `Pela ${sociedadeNome(ctx.values)}`,
    name: r.nome || undefined,
    detail: (role ? [r.cargo, str(ctx.values.sociedadeFirma)].filter(Boolean).join(', ') : r.cargo) || undefined,
    image: i === imageAt ? 'both' : undefined,
  }));
}

export function companySignatures(ctx: TemplateContext, reps: { nome: string; cargo: string }[], placeDate?: string): Block[] {
  return signatureRows(companyColumns(ctx, reps), placeDate);
}

// ---------------------------------------------------------------- Notarial recognition

/** Dashed box reserved for the notary’s recognition of the signatures. */
export function reconhecimentoBox(label = 'Reconhecimento notarial das assinaturas'): Block {
  return { type: 'box', label, dashed: true, lines: 3 };
}

/** Appends the recognition box, kept on the same page as the signatures above it. */
export function comReconhecimento(blocks: Block[], label?: string): Block[] {
  const last = blocks[blocks.length - 1];
  if (last) blocks[blocks.length - 1] = { ...last, keepWithNext: true };
  blocks.push(reconhecimentoBox(label));
  return blocks;
}

export const RECONHECIMENTO_OPTIONS: FieldOption[] = [
  { value: 'semelhanca', label: l('Reconhecimento por semelhança', 'Signature recognised by likeness') },
  { value: 'presencial', label: l('Reconhecimento presencial', 'Signature recognised in person') },
  { value: 'nenhum', label: l('Sem reconhecimento', 'No recognition') },
];

// ---------------------------------------------------------------- Firma

/** Removes a trailing "Limitada", "Lda" or "Sociedade Unipessoal" so the template can append the right one. */
export function firmaBase(x: unknown): string {
  return str(x)
    .replace(/[,\s]*(sociedade\s+unipessoal[,\s]*)?(limitada|lda\.?)\s*$/i, '')
    .replace(/[,\s]*sociedade\s+unipessoal\s*$/i, '')
    .trim();
}

// ---------------------------------------------------------------- Pacto social (Lda and unipessoal)

type PactoVariant = 'lda' | 'unipessoal';

const MAIORIA: Record<string, { pt: string; en: string }> = {
  tresQuartos: { pt: 'por maioria de três quartos dos votos correspondentes ao capital social', en: 'by three quarters of the votes of the capital' },
  doisTercos: { pt: 'por maioria de dois terços dos votos correspondentes ao capital social', en: 'by two thirds of the votes of the capital' },
  unanimidade: { pt: 'por unanimidade dos votos correspondentes ao capital social', en: 'unanimously' },
};

export function pactoTemplate(variant: PactoVariant): DocumentTemplate {
  const uni = variant === 'unipessoal';
  const lista = (v: Values) => socios(v.socios);
  const sufixo = uni ? ', Sociedade Unipessoal, Limitada' : ', Limitada';
  const firma = (v: Values) => (firmaBase(v.firma) ? `${firmaBase(v.firma)}${sufixo}` : BLANK);

  const fields: FieldDef[] = [
    localField(),
    dateField('data', 'documento', l('Data de assinatura', 'Signing date')),
  ];
  if (uni) {
    fields.push(...parteFields('socio', 'socios'));
  } else {
    fields.push({
      name: 'socios',
      type: 'lines',
      section: 'socios',
      required: true,
      label: l('Sócios e quotas', 'Members and quotas'),
      help: l(
        'Um por linha. A soma das quotas é o capital social. Um sócio pode ser uma pessoa ou uma sociedade (neste caso indique o NUEL e o representante).',
        'One per row. The quotas add up to the share capital. A member may be an individual or a company (give its NUEL and representative).',
      ),
      addLabel: l('Adicionar sócio', 'Add member'),
      columns: SOCIO_COLUMNS,
      default: [
        { tipo: 'pessoa', nome: '', genero: 'M', estadoCivil: '', nacionalidade: 'moçambicana', docTipo: 'BI', docNumero: '', nuit: '', morada: '', representante: '', quota: '' },
        { tipo: 'pessoa', nome: '', genero: 'M', estadoCivil: '', nacionalidade: 'moçambicana', docTipo: 'BI', docNumero: '', nuit: '', morada: '', representante: '', quota: '' },
      ],
    });
  }
  fields.push(
    {
      name: 'firma',
      type: 'text',
      section: 'denominacao',
      required: true,
      label: l('Firma (denominação)', 'Company name'),
      help: l(
        `Use o nome reservado na Conservatória. «${uni ? 'Sociedade Unipessoal, Limitada' : 'Limitada'}» é acrescentado automaticamente.`,
        `Use the name reserved at the registry. "${uni ? 'Sociedade Unipessoal, Limitada' : 'Limitada'}" is added automatically.`,
      ),
      placeholder: l('Ex.: Machava & Filhos — Construção', 'E.g. Machava & Sons — Construction'),
      legal: l('A firma, a sede, o objecto, o capital e as quotas são menções obrigatórias do contrato.', 'Name, office, object, capital and quotas must appear in the articles.'),
    },
    {
      name: 'sede',
      type: 'text',
      section: 'denominacao',
      required: true,
      label: l('Sede (morada completa)', 'Registered office (full address)'),
      placeholder: l('Ex.: Avenida Julius Nyerere, n.º 1234, Bairro da Polana Cimento, Cidade de Maputo', 'E.g. street, number, neighbourhood, city'),
    },
    {
      name: 'inicio',
      type: 'radio',
      section: 'denominacao',
      label: l('A sociedade começa a existir', 'The company starts'),
      options: [
        { value: 'celebracao', label: l('Na data deste contrato', 'On the date of this contract') },
        { value: 'registo', label: l('Na data do registo', 'On the date of registration') },
      ],
      default: 'celebracao',
    },
    {
      name: 'objecto',
      type: 'textarea',
      section: 'denominacao',
      required: true,
      rows: 4,
      label: l('Objecto (actividades)', 'Object (business activities)'),
      help: l(
        'Descreva as actividades com precisão: as licenças dependem do objecto. Uma actividade por linha gera uma lista a), b), c)…',
        'Describe the activities precisely: licences depend on them. One activity per line produces a list a), b), c)…',
      ),
      placeholder: l('Ex.: construção civil e obras públicas\nfiscalização de obras\ncomércio de materiais de construção, com importação e exportação', 'E.g. building and public works\nsite supervision\ntrade in building materials'),
    },
  );
  if (uni) {
    fields.push({
      name: 'capital',
      type: 'money',
      section: 'capital',
      width: 'half',
      required: true,
      label: l('Capital social (MT)', 'Share capital (MT)'),
      help: l('Representado por uma única quota do sócio único.', 'Represented by one single quota held by the sole member.'),
    });
  }
  fields.push(
    {
      name: 'realizacao',
      type: 'select',
      section: 'capital',
      width: 'half',
      label: l('Realização do capital', 'Payment of capital'),
      options: [
        { value: 'dinheiro', label: l('Integralmente em dinheiro', 'Fully paid in cash') },
        { value: 'diferida', label: l('Parte agora, o resto depois', 'Part now, rest later') },
        { value: 'especie', label: l('Dinheiro e bens (espécie)', 'Cash and assets (in kind)') },
      ],
      default: 'dinheiro',
    },
    {
      name: 'valorRealizado',
      type: 'money',
      section: 'capital',
      width: 'half',
      label: l('Capital já realizado (MT)', 'Capital already paid (MT)'),
      showIf: (v) => v.realizacao === 'diferida',
    },
    {
      name: 'dataRealizacao',
      type: 'date',
      section: 'capital',
      width: 'half',
      label: l('Data limite para realizar o restante', 'Deadline to pay the rest'),
      showIf: (v) => v.realizacao === 'diferida',
    },
    {
      name: 'especieDescricao',
      type: 'textarea',
      section: 'capital',
      rows: 3,
      label: l('Bens entregues em espécie e valor atribuído', 'Assets contributed in kind and their value'),
      placeholder: l('Ex.: uma viatura Toyota Hilux, matrícula AFG 123 MC, entregue pelo sócio João Matsinhe, no valor de 850.000,00 MT', 'E.g. a vehicle, plate…, contributed by…, valued at…'),
      showIf: (v) => v.realizacao === 'especie',
    },
    {
      name: 'especieImoveis',
      type: 'toggle',
      section: 'capital',
      label: l('Entre os bens há imóveis (casa, terreno, edifício)', 'The assets include real estate'),
      help: l('Com imóveis o contrato tem de ser celebrado por escritura pública no notário.', 'With real estate the contract must be made by public deed before a notary.'),
      showIf: (v) => v.realizacao === 'especie',
    },
    {
      name: 'prestacoes',
      type: 'toggle',
      section: 'capital',
      label: l('Permitir prestações suplementares de capital', 'Allow supplementary capital contributions'),
      help: l('Entradas adicionais que a assembleia pode exigir aos sócios, sem juros, até ao montante fixado.', 'Extra contributions the members may be asked to make, interest-free, up to the amount set.'),
    },
    {
      name: 'prestacoesMontante',
      type: 'money',
      section: 'capital',
      width: 'half',
      label: l('Montante máximo global (MT)', 'Maximum total (MT)'),
      showIf: (v) => Boolean(v.prestacoes),
    },
  );
  if (!uni) {
    fields.push({
      name: 'prazoPreferencia',
      type: 'number',
      section: 'capital',
      width: 'half',
      min: 1,
      max: 180,
      default: 30,
      label: l('Prazo para exercer a preferência (dias)', 'Pre-emption period (days)'),
      help: l('Prazo, contado da comunicação do sócio que quer vender, para a sociedade e os sócios decidirem se compram a quota.', 'Days, from the selling member’s notice, for the company and members to decide whether to buy.'),
    });
  }
  fields.push(
    ...(uni
      ? [
          {
            name: 'gerenciaSocio',
            type: 'radio',
            section: 'gerencia',
            label: l('Quem gere a sociedade', 'Who manages the company'),
            options: [
              { value: 'socio', label: l('O próprio sócio único', 'The sole member') },
              { value: 'terceiros', label: l('Gerente(s) nomeado(s)', 'Appointed manager(s)') },
            ],
            default: 'socio',
          } as FieldDef,
        ]
      : []),
    {
      name: 'gerentes',
      type: 'lines',
      section: 'gerencia',
      label: l('Gerentes nomeados no contrato', 'Managers appointed in the articles'),
      help: l('Podem ser sócios ou não sócios.', 'They may or may not be members.'),
      addLabel: l('Adicionar gerente', 'Add manager'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome completo', 'Full name') },
        { name: 'genero', type: 'select', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS },
      ],
      default: [{ nome: '', genero: 'M' }],
      showIf: uni ? (v) => v.gerenciaSocio === 'terceiros' : undefined,
    },
    {
      name: 'mandato',
      type: 'select',
      section: 'gerencia',
      width: 'half',
      label: l('Duração do mandato', 'Term of office'),
      options: [
        { value: 'indeterminado', label: l('Tempo indeterminado', 'Indefinite') },
        { value: 'anos', label: l('Mandato de alguns anos, renovável', 'Fixed term, renewable') },
      ],
      default: 'indeterminado',
    },
    {
      name: 'mandatoAnos',
      type: 'number',
      section: 'gerencia',
      width: 'half',
      min: 1,
      max: 10,
      default: 4,
      label: l('Anos de cada mandato', 'Years per term'),
      showIf: (v) => v.mandato === 'anos',
    },
    {
      name: 'remuneracao',
      type: 'select',
      section: 'gerencia',
      width: 'half',
      label: l('Remuneração da gerência', 'Managers’ pay'),
      options: [
        { value: 'assembleia', label: l(uni ? 'Fixada pelo sócio único' : 'Fixada pela assembleia geral', uni ? 'Set by the sole member' : 'Set by the general meeting') },
        { value: 'nao', label: l('Sem remuneração', 'Unpaid') },
      ],
      default: 'assembleia',
    },
    {
      name: 'formaObrigar',
      type: 'select',
      section: 'gerencia',
      width: 'half',
      label: l('A sociedade obriga-se com a assinatura de', 'The company is bound by the signature of'),
      options: [
        { value: 'um', label: l('Um gerente', 'One manager') },
        { value: 'dois', label: l('Dois gerentes em conjunto', 'Two managers jointly') },
      ],
      default: 'um',
    },
  );
  if (!uni) {
    fields.push(
      {
        name: 'maioria',
        type: 'select',
        section: 'assembleia',
        width: 'half',
        label: l('Maioria para alterar o contrato, aumentar capital, dissolver…', 'Majority to amend the articles, raise capital, dissolve…'),
        options: [
          { value: 'tresQuartos', label: l('Três quartos do capital', 'Three quarters of the capital') },
          { value: 'doisTercos', label: l('Dois terços do capital', 'Two thirds of the capital') },
          { value: 'unanimidade', label: l('Unanimidade', 'Unanimity') },
        ],
        default: 'tresQuartos',
      },
      {
        name: 'telematica',
        type: 'toggle',
        section: 'assembleia',
        default: true,
        label: l('Permitir assembleias por videoconferência', 'Allow meetings by video conference'),
      },
    );
  }
  fields.push(
    {
      name: 'fiscalizacao',
      type: 'toggle',
      section: 'final',
      label: l('Prever fiscal único ou auditor', 'Provide for a statutory auditor'),
      help: l('Obrigatório só em certos casos previstos na lei; pode ficar previsto para quando for necessário.', 'Required only in some cases; it can be provided for when needed.'),
    },
    {
      name: 'exemplares',
      type: 'number',
      section: 'final',
      width: 'half',
      min: 1,
      max: 20,
      label: l('Número de exemplares', 'Number of copies'),
      help: l('Em branco: um por sócio e um para a Conservatória.', 'Blank: one per member and one for the registry.'),
    },
    {
      name: 'reconhecimento',
      type: 'toggle',
      section: 'final',
      default: true,
      label: l('Espaço para o reconhecimento notarial', 'Space for notarial recognition'),
      legal: l('As assinaturas dos sócios no contrato de sociedade são reconhecidas pelo notário.', 'Members’ signatures on the articles are certified by a notary.'),
    },
  );

  return defineTemplate({
    id: uni ? 'pacto-social-unipessoal' : 'pacto-social-lda',
    family: 'contrato',
    official: 'registo',
    letterhead: false,
    sections: [
      { id: 'documento', title: l('Local e data', 'Place and date') },
      uni
        ? { id: 'socios', title: l('Sócio único', 'Sole member'), personRole: 'outro' }
        : { id: 'socios', title: l('Sócios', 'Members') },
      { id: 'denominacao', title: l('Firma, sede e objecto', 'Name, office and object') },
      { id: 'capital', title: l(uni ? 'Capital social' : 'Capital social e quotas', uni ? 'Share capital' : 'Capital and quotas') },
      { id: 'gerencia', title: l('Gerência e forma de obrigar', 'Management and signing powers') },
      ...(uni ? [] : [{ id: 'assembleia', title: l('Assembleia geral', 'General meeting') }]),
      { id: 'final', title: l('Disposições finais', 'Final provisions') },
    ],
    fields,

    computed: (v) => {
      const ss = uni ? [] : lista(v);
      const capital = uni ? money(v.capital) : ss.some((s) => s.quota != null) ? ss.reduce((a, s) => a + (s.quota ?? 0), 0) : null;
      return { socios: ss, capital };
    },

    personName: (v) => firmaBase(v.firma) || undefined,
    documentDate: (v) => v.data,

    warnings: (v, ctx) => {
      const w: Warning[] = [];
      const ss = ctx.computed.socios as Socio[];
      const capital = ctx.computed.capital as number | null;
      if (!uni && ss.length < 2) {
        w.push({ level: 'error', field: 'socios', message: l('A sociedade por quotas precisa de pelo menos dois sócios. Com um só sócio, use o pacto da sociedade unipessoal.', 'A private limited company needs at least two members. With one member, use the single-member articles.') });
      }
      if (!uni && ss.some((s) => s.quota == null || s.quota <= 0)) {
        w.push({ level: 'warning', field: 'socios', message: l('Indique o valor nominal da quota de cada sócio: a soma das quotas é o capital social.', 'Give each member’s quota: the quotas add up to the share capital.') });
      }
      if (capital == null || capital <= 0) {
        w.push({ level: 'warning', field: uni ? 'capital' : 'socios', message: l('Indique o capital social. A lei não fixa um mínimo, mas bancos e licenças podem exigir um capital adequado à actividade.', 'Give the share capital. The law sets no minimum, but banks and licences may expect one suited to the business.') });
      }
      if (v.realizacao === 'especie' && v.especieImoveis) {
        w.push({ level: 'error', field: 'especieImoveis', message: l(`Com entrada de imóveis, o contrato de sociedade é celebrado por escritura pública (${cite('sociedadeContratoForma')}). Use este texto como minuta para o notário.`, `With real estate contributed, the articles must be made by public deed. Use this text as a draft for the notary.`) });
      }
      if (v.realizacao === 'diferida') {
        w.push({ level: 'info', field: 'realizacao', message: l('Confirme os limites legais ao diferimento das entradas em dinheiro no Código Comercial antes de assinar.', 'Check the legal limits on deferring cash contributions in the Commercial Code before signing.') });
      }
      if (!uni && v.maioria === 'doisTercos') {
        w.push({ level: 'warning', field: 'maioria', message: l('Confirme que a lei admite uma maioria inferior a três quartos para alterar o contrato; na dúvida, mantenha três quartos.', 'Check the law allows less than three quarters to amend the articles; if unsure keep three quarters.') });
      }
      const casados = uni ? (v.socioEstadoCivil === 'casado' ? 1 : 0) : ss.filter((s) => s.estadoCivil === 'casado').length;
      if (casados) {
        w.push({ level: 'info', message: l('Sócio casado: se entrar com bens comuns do casal, pode ser necessário o consentimento do cônjuge.', 'Married member: contributing joint marital property may need the spouse’s consent.') });
      }
      w.push(
        {
          level: 'info',
          message: l(
            `Assinatura: todos os sócios assinam e rubricam cada página, com as assinaturas reconhecidas pelo notário (${cite('sociedadeContratoForma')}). Leve a certidão de reserva do nome, os documentos de identificação e NUIT dos sócios e o comprovativo do depósito do capital.`,
            'Signing: all members sign and initial every page, with signatures certified by a notary. Bring the name reservation certificate, members’ ID and NUIT, and proof of the capital deposit.',
          ),
        },
        {
          level: 'info',
          message: l(
            `Registo: requeira o registo na Conservatória do Registo das Entidades Legais no prazo de ${quantos(ctx.legal.value<number>('registoEntidadesPrazo'), 'dia', 'dias')} após a assinatura; a Conservatória promove a publicação no Boletim da República, a expensas da sociedade.`,
            `Registration: apply at the Legal Entities Registry within ${ctx.legal.value<number>('registoEntidadesPrazo')} days of signing; the registry arranges publication in the official gazette at the company’s expense.`,
          ),
        },
        {
          level: 'info',
          message: l(
            'Beneficiário efectivo: na constituição apresente também a declaração do beneficiário efectivo (modelo «Declaração de beneficiário efectivo»).',
            'Beneficial owner: file the beneficial owner declaration at incorporation as well.',
          ),
        },
      );
      return w;
    },

    blocks: (ctx) => {
      const v = ctx.values;
      const ss = ctx.computed.socios as Socio[];
      const capital = ctx.computed.capital as number | null;
      const F = firma(v);
      const socioUnicoNome = parteNome(v, 'socio');
      const socioF = !isEmpresa(v, 'socio') && isF(v.socioGenero);
      const oSocio = uni ? (socioF ? 'a sócia única' : 'o sócio único') : '';
      const OSocio = uni ? (socioF ? 'A sócia única' : 'O sócio único') : '';
      const pelaAssembleia = uni ? (socioF ? 'pela sócia única' : 'pelo sócio único') : 'por deliberação da assembleia geral';

      const gerentes = lineItems(v.gerentes).map((r) => ({ nome: str(r.nome), f: isF(r.genero) })).filter((r) => r.nome);
      const gerenciaSocio = uni && v.gerenciaSocio !== 'terceiros';
      const nGer = gerenciaSocio ? 1 : Math.max(1, gerentes.length);

      const clauses: ClauseItem[] = [];

      clauses.push({
        id: 'denominacao',
        heading: 'Denominação e natureza',
        text: `A sociedade adopta a denominação de **${F}** e constitui-se sob a forma de ${uni ? 'sociedade unipessoal por quotas de responsabilidade limitada' : 'sociedade comercial por quotas de responsabilidade limitada'}, regendo-se pelo presente contrato e pela legislação aplicável.`,
        en: `The company is named ${F} and is a ${uni ? 'single-member' : 'private'} limited liability company governed by these articles and the applicable law.`,
      });
      clauses.push({
        id: 'sede',
        heading: 'Sede',
        text: numerar([
          `A sociedade tem a sua sede em ${semPonto(v.sede) || BLANK}.`,
          `${uni ? `Por decisão ${socioF ? 'da sócia única' : 'do sócio único'}` : 'Por deliberação da assembleia geral'}, a sede pode ser transferida para qualquer outro local do território nacional e podem ser abertas ou encerradas sucursais, filiais, agências, delegações ou outras formas de representação, no país ou no estrangeiro.`,
        ]),
        en: 'The registered office is at the address stated. It may be moved within Mozambique, and branches or offices opened or closed in Mozambique or abroad, by decision of the members.',
      });
      clauses.push({
        id: 'duracao',
        heading: 'Duração',
        text: `A sociedade é constituída por tempo indeterminado, contando-se o seu início a partir da data ${v.inicio === 'registo' ? 'do seu registo' : 'da celebração do presente contrato'}.`,
        en: `The company is formed for an indefinite period, starting from the date ${v.inicio === 'registo' ? 'of registration' : 'of this contract'}.`,
      });
      {
        const acts = splitLines(v.objecto).map((s) => minus(semPonto(s)));
        const listaAct = acts.map((a, i) => `${'abcdefghijklmnopqrstuvwxyz'[i] ?? i + 1}) ${a}${i === acts.length - 1 ? '.' : ';'}`).join('\n');
        clauses.push({
          id: 'objecto',
          heading: 'Objecto',
          text: numerar([
            acts.length <= 1 ? `A sociedade tem por objecto ${acts[0] || BLANK}.` : `A sociedade tem por objecto o exercício das seguintes actividades:\n${listaAct}`,
            'A sociedade pode exercer actividades conexas, complementares ou subsidiárias do seu objecto principal, desde que obtidas as licenças e autorizações exigidas.',
            `${uni ? `Por decisão ${socioF ? 'da sócia única' : 'do sócio único'}` : 'Mediante deliberação da assembleia geral'}, a sociedade pode adquirir participações noutras sociedades, ainda que com objecto diferente, e associar-se a outras entidades sob qualquer forma legalmente permitida.`,
          ]),
          en: 'The company carries on the activities listed, related or ancillary activities once licensed, and may hold shares in other companies.',
        });
      }

      // Capital
      {
        const capTxt = valorTexto(capital, true);
        let first: string;
        let quotas: string[] = [];
        const realizado = v.realizacao === 'diferida' ? 'subscrito' : v.realizacao === 'especie' ? 'integralmente subscrito e realizado em dinheiro e em espécie' : 'integralmente subscrito e realizado em dinheiro';
        if (uni) {
          first = `O capital social, ${realizado}, é de ${capTxt}, representado por uma única quota de igual valor nominal, pertencente ${isEmpresa(v, 'socio') ? 'à sociedade' : socioF ? 'à sócia única' : 'ao sócio único'} ${socioUnicoNome || BLANK}.`;
        } else {
          const n = ss.length;
          first = `O capital social, ${realizado}, é de ${capTxt}, correspondente à soma de ${n === 1 ? 'uma quota' : n > 1 ? `${inteiroPorExtenso(n)} quotas` : `${BLANK} quotas`}, assim distribuídas:`;
          quotas = (ss.length ? ss : [null, null]).map((s, i, arr) => {
            const end = i === arr.length - 1 ? '.' : ';';
            if (!s) return `${'abcdefghij'[i]}) uma quota com o valor nominal de ${BLANK} MT, correspondente a ____% do capital social, pertencente ao sócio ${BLANK}${end}`;
            const titular = s.tipo === 'empresa' ? `à sociedade ${s.nome || BLANK}` : `${isF(s.genero) ? 'à sócia' : 'ao sócio'} ${s.nome || BLANK}`;
            return `${'abcdefghijklmnopqrstuvwxyz'[i] ?? i + 1}) uma quota com o valor nominal de ${valorTexto(s.quota, false)}, correspondente a ${pct(s.quota, capital)} do capital social, pertencente ${titular}${end}`;
          });
        }
        const parts = [quotas.length ? `${first}\n${quotas.join('\n')}` : first];
        if (v.realizacao === 'diferida') {
          parts.push(`À data da celebração do presente contrato encontra-se realizado o montante de ${valorTexto(v.valorRealizado, false)}, devendo o remanescente ser realizado em dinheiro até ${dateLong(v.dataRealizacao)}.`);
        }
        if (v.realizacao === 'especie') {
          parts.push(`As entradas em espécie são as seguintes: ${semPonto(v.especieDescricao) || BLANK}.`);
        }
        clauses.push({
          id: 'capital',
          heading: 'Capital social',
          text: numerar(parts),
          en: uni
            ? 'The share capital is the amount stated, represented by one quota held by the sole member.'
            : 'The share capital is the amount stated, divided into the quotas listed, each held by the member named.',
        });
      }
      clauses.push({
        id: 'aumentoCapital',
        heading: 'Aumento do capital',
        text: uni
          ? `O capital social pode ser aumentado, uma ou mais vezes, por decisão ${socioF ? 'da sócia única' : 'do sócio único'}, mediante novas entradas, incorporação de reservas ou outra modalidade legalmente admitida.`
          : 'O capital social pode ser aumentado, uma ou mais vezes, por deliberação da assembleia geral, mediante novas entradas, incorporação de reservas ou outra modalidade legalmente admitida, gozando os sócios do direito de preferência na subscrição, na proporção das respectivas quotas.',
        en: 'The capital may be increased by new contributions, capitalised reserves or other lawful means; members have a pre-emption right in proportion to their quotas.',
      });
      clauses.push({
        id: 'prestacoes',
        heading: 'Prestações suplementares e suprimentos',
        text: numerar([
          v.prestacoes
            ? `${uni ? `${OSocio} pode` : 'A assembleia geral pode'} exigir prestações suplementares de capital até ao montante global de ${valorTexto(v.prestacoesMontante, false)}, as quais não vencem juros.`
            : 'Não são exigíveis prestações suplementares de capital.',
          uni
            ? `${OSocio} pode fazer à sociedade os suprimentos de que ela carecer, nas condições fixadas por acordo escrito com a sociedade.`
            : 'Os sócios podem fazer à sociedade os suprimentos de que ela carecer, nas condições fixadas por deliberação da assembleia geral ou por acordo escrito com a sociedade.',
        ]),
        en: v.prestacoes ? 'Supplementary contributions may be required up to the stated amount, without interest. Members may lend money to the company on agreed terms.' : 'No supplementary contributions may be required. Members may lend money to the company on agreed terms.',
      });

      if (uni) {
        clauses.push({
          id: 'cessao',
          heading: 'Cessão e divisão da quota',
          text: `${OSocio} pode livremente ceder, no todo ou em parte, a sua quota, bem como dividi-la. Se, em consequência da cessão ou divisão, a sociedade passar a ter mais de um sócio, o presente contrato é alterado em conformidade.`,
          en: 'The sole member may freely transfer or divide the quota. If the company then has more than one member, these articles are amended accordingly.',
        });
      } else {
        const prazo = num(v.prazoPreferencia);
        clauses.push({
          id: 'cessao',
          heading: 'Divisão e cessão de quotas',
          text: numerar([
            'A cessão de quotas, total ou parcial, entre sócios é livre.',
            'A cessão de quotas a terceiros, bem como a divisão de quotas, depende do consentimento prévio da sociedade, prestado por deliberação da assembleia geral.',
            'Nas cessões a terceiros, a sociedade, em primeiro lugar, e os sócios, em segundo lugar, na proporção das respectivas quotas, gozam do direito de preferência.',
            `O sócio que pretenda ceder a sua quota comunica-o por escrito à sociedade e aos demais sócios, indicando o cessionário, o preço e as demais condições da cessão. O direito de preferência é exercido no prazo de ${quantos(prazo, 'dia', 'dias')} a contar da recepção da comunicação.`,
            'Se nem a sociedade nem os sócios exercerem o direito de preferência, o sócio pode ceder a quota ao terceiro indicado, nas condições comunicadas.',
          ]),
          en: `Transfers between members are free. Transfers to third parties and divisions need the general meeting’s consent; the company, then the members, have a pre-emption right, to be exercised within ${prazo ?? '—'} days of the written notice. If nobody exercises it, the member may sell to the third party on the terms notified.`,
        });
        clauses.push({
          id: 'amortizacao',
          heading: 'Exclusão de sócio e amortização de quotas',
          text: numerar([
            'Além dos casos previstos na lei, a sociedade pode excluir o sócio e amortizar a respectiva quota quando:\na) a quota for objecto de penhora, arresto ou qualquer outra forma de apreensão judicial;\nb) o sócio ceder a quota com violação do disposto no artigo anterior;\nc) o sócio for declarado insolvente.',
            'A exclusão e a amortização dependem de deliberação da assembleia geral, e o valor da quota amortizada é o que resultar do último balanço aprovado, salvo acordo diferente.',
          ]),
          en: 'Besides the legal cases, a member may be excluded and the quota redeemed if it is seized, transferred in breach of the previous article, or the member becomes insolvent. The value is that of the last approved balance sheet unless otherwise agreed.',
        });
      }
      clauses.push({
        id: 'morte',
        heading: uni ? 'Morte ou interdição do sócio único' : 'Morte ou interdição de sócio',
        text: uni
          ? `Por morte ou interdição ${socioF ? 'da sócia única' : 'do sócio único'}, a sociedade continua com os herdeiros ou com o representante legal, os quais nomeiam de entre si um que a todos represente enquanto a quota se mantiver indivisa.`
          : 'Por morte ou interdição de um sócio, a sociedade continua com os herdeiros ou com o representante legal do sócio falecido ou interdito, os quais nomeiam de entre si um que a todos represente na sociedade enquanto a quota se mantiver indivisa.',
        en: 'On death or legal incapacity of a member, the company continues with the heirs or legal representative, who appoint one person to represent them while the quota remains undivided.',
      });

      if (uni) {
        clauses.push({
          id: 'decisoes',
          heading: socioF ? 'Decisões da sócia única' : 'Decisões do sócio único',
          text: numerar([
            `${OSocio} exerce as competências que a lei e o presente contrato atribuem à assembleia geral.`,
            `As decisões ${socioF ? 'da sócia única' : 'do sócio único'} sobre matérias da competência da assembleia geral são tomadas por escrito, datadas e assinadas e lançadas no livro de actas da sociedade.`,
          ]),
          en: 'The sole member exercises the powers of the general meeting. Decisions are made in writing, dated, signed and entered in the minutes book.',
        });
        clauses.push({
          id: 'negocios',
          heading: socioF ? 'Negócios entre a sócia única e a sociedade' : 'Negócios entre o sócio único e a sociedade',
          text: `Os negócios jurídicos celebrados entre ${oSocio} e a sociedade constam de documento escrito e devem ser necessários ou úteis à prossecução do objecto social.`,
          en: 'Transactions between the sole member and the company are made in writing and must serve the company’s business.',
        });
      } else {
        const prazoConv = ctx.legal.value<number>('convocatoriaQuotasPrazo');
        clauses.push({
          id: 'assembleia',
          heading: 'Assembleia geral',
          text: numerar([
            'A assembleia geral reúne ordinariamente uma vez por ano, nos três meses seguintes ao termo de cada exercício, para apreciar e aprovar o relatório de gestão e as contas do exercício, deliberar sobre a aplicação de resultados e proceder às designações que lhe competirem, e extraordinariamente sempre que for convocada.',
            `A assembleia geral é convocada pela gerência, por carta ou por correio electrónico dirigidos aos endereços dos sócios que constem da sociedade, com a antecedência mínima de ${quantos(prazoConv, 'dia', 'dias')}, indicando o dia, a hora, o local e a ordem de trabalhos.`,
            'Os sócios podem reunir-se em assembleia geral sem observância de formalidades prévias, desde que todos estejam presentes ou representados e todos manifestem a vontade de deliberar sobre determinado assunto.',
            'Os sócios podem deliberar sem reunião, por escrito, desde que todos declarem por escrito o sentido do seu voto.',
            v.telematica ? 'As reuniões podem realizar-se por meios telemáticos que assegurem a identificação dos participantes e a sua intervenção em tempo real.' : '',
            'O sócio pode fazer-se representar na assembleia geral por outro sócio, pelo cônjuge ou por pessoa a quem confira poderes, mediante carta dirigida à gerência.',
          ]),
          en: `The general meeting meets once a year within three months of the year end to approve the accounts, and whenever called. Notice is given by letter or e-mail at least ${prazoConv} days ahead. All members may meet without formalities, or resolve in writing without a meeting${v.telematica ? ', and meetings may be held by video conference' : ''}. Members may be represented by another member, a spouse or a proxy appointed by letter.`,
        });
        const M = MAIORIA[v.maioria] ?? MAIORIA.tresQuartos;
        clauses.push({
          id: 'votos',
          heading: 'Votos e deliberações',
          text: numerar([
            'A cada metical do valor nominal da quota corresponde um voto.',
            'As deliberações são tomadas por maioria dos votos emitidos, salvo disposição legal ou contratual em contrário.',
            `As deliberações sobre alteração do contrato de sociedade, aumento ou redução do capital social, fusão, cisão, transformação e dissolução da sociedade são tomadas ${M.pt}.`,
          ]),
          en: `One vote per metical of quota. Resolutions pass by majority of votes cast; amendments, capital changes, merger, demerger, conversion and dissolution need ${M.en}.`,
        });
      }

      // Gerência
      {
        const nomes = gerentes.map((r) => r.nome);
        const mandato = v.mandato === 'anos' ? `por mandatos de ${quantos(num(v.mandatoAnos), 'ano', 'anos')}, renováveis` : 'por tempo indeterminado';
        const remun = v.remuneracao === 'nao' ? 'sem remuneração' : `com a remuneração que for fixada ${pelaAssembleia}`;
        const parts: string[] = [];
        if (gerenciaSocio) {
          parts.push(`A administração e a representação da sociedade, em juízo e fora dele, activa e passivamente, competem ${socioF ? 'à sócia única' : 'ao sócio único'}${isEmpresa(v, 'socio') ? ', através de pessoa singular que designar por escrito' : ''}, que fica desde já ${socioF ? 'nomeada gerente' : 'nomeado gerente'}, com dispensa de caução e ${remun}.`);
        } else {
          parts.push(`A administração e a representação da sociedade, em juízo e fora dele, activa e passivamente, competem a ${nGer === 1 ? 'um gerente' : 'um ou mais gerentes'}, sócios ou não, ${uni ? `nomeados ${pelaAssembleia}` : 'nomeados pela assembleia geral'}, com dispensa de caução e ${remun}.`);
          parts.push(
            nomes.length === 1
              ? `Fica desde já ${gerentes[0].f ? 'nomeada gerente' : 'nomeado gerente'} ${nomes[0]}.`
              : nomes.length > 1
                ? `Ficam desde já nomeados gerentes ${juntar(nomes)}.`
                : `Fica desde já nomeado gerente ${BLANK}.`,
          );
        }
        parts.push(`Os gerentes exercem funções ${mandato}.`);
        parts.push('A gerência pode constituir mandatários ou procuradores da sociedade para a prática de determinados actos ou categorias de actos.');
        clauses.push({
          id: 'gerencia',
          heading: 'Gerência',
          text: numerar(parts),
          en: `The company is managed and represented by ${gerenciaSocio ? 'the sole member' : 'the manager(s) named'}, without security, ${v.remuneracao === 'nao' ? 'unpaid' : 'with pay set by the members'}, ${v.mandato === 'anos' ? `for renewable ${v.mandatoAnos || '—'}-year terms` : 'for an indefinite term'}. Management may appoint attorneys for specific acts.`,
        });
      }
      {
        const dois = v.formaObrigar === 'dois' && nGer > 1;
        clauses.push({
          id: 'formaObrigar',
          heading: 'Forma de obrigar',
          text: numerar([
            `A sociedade obriga-se:\na) pela assinatura ${nGer === 1 ? 'do gerente' : dois ? 'de dois gerentes em conjunto' : 'de qualquer um dos gerentes'};\nb) pela assinatura de procurador, nos termos e nos limites do respectivo mandato.`,
            'Os actos de mero expediente podem ser assinados por qualquer gerente ou por trabalhador para tanto autorizado.',
            'É vedado aos gerentes obrigar a sociedade em actos e contratos estranhos ao objecto social, designadamente em letras de favor, fianças, avales e abonações.',
          ]),
          en: `The company is bound by the signature of ${nGer === 1 ? 'the manager' : dois ? 'two managers jointly' : 'any one manager'}, or of an attorney within their powers. Routine matters may be signed by any manager or an authorised employee. Managers may not bind the company in acts outside its object, such as accommodation bills, guarantees or sureties.`,
        });
      }
      if (v.fiscalizacao) {
        clauses.push({
          id: 'fiscalizacao',
          heading: 'Fiscalização',
          text: `A fiscalização da sociedade é exercida por um fiscal único ou por uma sociedade de auditores de contas, sempre que ${uni ? `${oSocio} o decida` : 'a assembleia geral o delibere'} ou a lei o exija.`,
          en: 'A statutory auditor or audit firm oversees the company when the members so decide or the law requires.',
        });
      }
      clauses.push({
        id: 'exercicio',
        heading: 'Exercício social',
        text: `O exercício social coincide com o ano civil. O balanço e as contas fecham-se com referência a 31 de Dezembro de cada ano e são submetidos à aprovação ${uni ? (socioF ? 'da sócia única' : 'do sócio único') : 'da assembleia geral'}.`,
        en: 'The financial year is the calendar year; accounts close on 31 December and are submitted for approval.',
      });
      clauses.push({
        id: 'resultados',
        heading: 'Aplicação de resultados',
        text: `Dos lucros apurados em cada exercício deduz-se, em primeiro lugar, a percentagem legalmente fixada para a constituição ou reintegração da reserva legal, tendo o remanescente a aplicação que ${uni ? `${oSocio} decidir` : 'a assembleia geral deliberar'}.`,
        en: 'Profits first fund the legal reserve at the legal rate; the rest is applied as the members decide.',
      });
      {
        const prazoBE = ctx.legal.value<number>('beneficiarioEfectivoSociedade');
        clauses.push({
          id: 'beneficiarios',
          heading: 'Beneficiários efectivos',
          text: `${uni ? `${OSocio} obriga-se` : 'Os sócios obrigam-se'} a fornecer à sociedade os elementos de identificação dos respectivos beneficiários efectivos e a comunicar-lhe qualquer alteração no prazo de ${quantos(prazoBE, 'dia', 'dias')}, nos termos do ${cite('beneficiarioEfectivoSociedade')}.`,
          en: `Members give the company the identification of their beneficial owners and report any change within ${prazoBE} days.`,
        });
      }
      clauses.push({
        id: 'dissolucao',
        heading: 'Dissolução e liquidação',
        text: numerar([
          `A sociedade dissolve-se nos casos e nos termos previstos na lei ou por ${uni ? `decisão ${socioF ? 'da sócia única' : 'do sócio único'}` : 'deliberação dos sócios'}.`,
          'Dissolvida a sociedade, são liquidatários os gerentes em exercício, salvo deliberação em contrário.',
        ]),
        en: 'The company is dissolved as provided by law or by decision of the members; the managers then act as liquidators unless otherwise decided.',
      });
      clauses.push({
        id: 'omissos',
        heading: 'Casos omissos',
        text: 'Os casos omissos regulam-se pelo Código Comercial em vigor e pela demais legislação aplicável na República de Moçambique.',
        en: 'Matters not covered are governed by the Commercial Code in force and other applicable Mozambican law.',
      });

      // Parties and closing
      const blocks: Block[] = [{ type: 'title', text: 'Contrato de Sociedade', subtitle: upper(F) }];
      if (uni) {
        blocks.push({
          type: 'paragraph',
          id: 'constituicao',
          text: `${parte(v, 'socio', socioF ? 'Sócia Única' : 'Sócio Único').replace(/, adiante designad[ao] por \*\*.*\*\*$/, '')}, constitui, por si só, uma sociedade unipessoal por quotas de responsabilidade limitada, que se rege pelos artigos seguintes e pela legislação aplicável:`,
          en: 'The person identified above forms, alone, a single-member limited liability company, governed by the following articles and the applicable law:',
        });
      } else {
        const ordem = ['Primeiro', 'Segundo', 'Terceiro', 'Quarto', 'Quinto', 'Sexto', 'Sétimo', 'Oitavo', 'Nono', 'Décimo', 'Décimo primeiro', 'Décimo segundo', 'Décimo terceiro', 'Décimo quarto', 'Décimo quinto'];
        const rows = ss.length ? ss : [];
        blocks.push({ type: 'paragraph', id: 'entre', text: 'Entre:', en: 'Between:', keepWithNext: true, align: 'left' });
        (rows.length ? rows : [null, null]).forEach((s, i, arr) => {
          blocks.push({
            type: 'paragraph',
            id: `socio-${i + 1}`,
            text: `**${ordem[i] ?? `${i + 1}.º`}:** ${s ? socioIdent(s) : BLANK}${i === arr.length - 1 ? '.' : ';'}`,
            en: `Member ${i + 1}, identified above.`,
          });
        });
        blocks.push({
          type: 'paragraph',
          id: 'celebracao',
          text: 'É celebrado o presente contrato de sociedade por quotas de responsabilidade limitada, que se rege pelos artigos seguintes e pela legislação aplicável:',
          en: 'This contract forming a private limited liability company is entered into, governed by the following articles and the applicable law:',
        });
      }
      // Chapters, as in the pactos published in the Boletim da República; numbering runs on.
      const CAPITULOS: { titulo: string; ids: string[] }[] = [
        { titulo: 'Capítulo I — Da denominação, sede, duração e objecto', ids: ['denominacao', 'sede', 'duracao', 'objecto'] },
        { titulo: 'Capítulo II — Do capital social', ids: ['capital', 'aumentoCapital', 'prestacoes', 'cessao', 'amortizacao', 'morte'] },
        { titulo: 'Capítulo III — Dos órgãos sociais', ids: ['decisoes', 'negocios', 'assembleia', 'votos', 'gerencia', 'formaObrigar', 'fiscalizacao'] },
        { titulo: 'Capítulo IV — Do exercício e dos resultados', ids: ['exercicio', 'resultados'] },
        { titulo: 'Capítulo V — Disposições finais', ids: ['beneficiarios', 'dissolucao', 'omissos'] },
      ];
      let start = 1;
      for (const cap of CAPITULOS) {
        const items = clauses.filter((c) => cap.ids.includes(c.id));
        if (!items.length) continue;
        blocks.push({ type: 'heading', text: cap.titulo, align: 'center' }, { type: 'numberedClauses', style: 'artigo', items, start });
        start += items.length;
      }

      const nEx = num(v.exemplares) ?? (uni ? 2 : ss.length + 1);
      const assinam = uni ? `${socioF ? 'pela sócia única' : 'pelo sócio único'}` : 'pelos sócios';
      blocks.push({
        type: 'paragraph',
        id: 'feito',
        text: `Feito em ${ctx.place}, a ${dateLong(v.data)}, em ${nEx === 1 ? 'um exemplar' : `${inteiroPorExtenso(Math.max(1, Math.floor(nEx)))} exemplares de igual teor e valor`}, que vão ser assinados e rubricados ${assinam}.`,
        en: `Made in ${nEx} copies of equal content and value, signed and initialled by the member(s).`,
        keepWithNext: true,
      });
      if (uni) {
        blocks.push({ type: 'signatures', columns: [parteSignature(v, 'socio', socioF ? 'A Sócia Única' : 'O Sócio Único')] });
      } else {
        blocks.push(...signatureRows((ss.length ? ss : []).map(socioSignature)));
      }
      if (v.reconhecimento) comReconhecimento(blocks);
      return blocks;
    },
  });
}
