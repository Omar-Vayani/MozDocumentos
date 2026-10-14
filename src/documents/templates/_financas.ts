// Shared pieces for the banking, insurance and tax documents ("financas"):
// the customer / taxpayer who writes (an individual or a company), the bank or
// insurer addressed, account fields, the sender block and the letter closing.

import { profileDisplayName, type Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import type { Block, DefaultsContext, FieldDef, FieldOption, SignatureColumn, TemplateContext, Values, Warning } from '../model';
import { formatDateShort } from '@/lib/format';
import { BLANK, DOC_TIPO_OPTIONS, GENERO_OPTIONS, dateField, dateLong, formatMoney, isF, l, lineItems, localField, money } from './_shared';

// ---------------------------------------------------------------- Text helpers

export const s = (x: unknown) => String(x ?? '').trim();
/** Without a trailing full stop, to embed in a sentence. */
export const semPonto = (x: unknown) => s(x).replace(/[.;,:]+$/, '');
export const endDot = (x: string) => (/[.!?:;]$/.test(x.trim()) ? x.trim() : `${x.trim()}.`);
export const lowerFirst = (x: string) => {
  const t = x.trim();
  return /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
};
/** Lines of a textarea, bullets and numbering removed. */
export const linhas = (x: unknown): string[] =>
  typeof x === 'string'
    ? x
        .split(/\n+/)
        .map((t) => t.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim())
        .filter(Boolean)
    : [];

// ---------------------------------------------------------------- The writer (individual or company)

export const isEmp = (v: Values, p: string) => v[`${p}Tipo`] === 'empresa';
const pessoaProfile = (c: DefaultsContext) => (c.profile?.kind === 'pessoa' ? c.profile : null);
const empresaProfile = (c: DefaultsContext) => (c.profile?.kind === 'empresa' ? c.profile : null);

/**
 * Identification of the customer or taxpayer who writes: `<p>Tipo` (pessoa /
 * empresa), person fields (`<p>Nome`, `Genero`, `DocTipo`, `DocNumero`, `Nuit`,
 * `Morada`) or company fields (`<p>EmpresaNome`, `EmpresaNuit`, `EmpresaSede`,
 * `RepNome`, `RepCargo`), and contacts. Defaults come from the active profile.
 */
export function clienteFields(p: string, section: string, opts: { doc?: boolean; contactos?: boolean; nuitLabel?: string } = {}): FieldDef[] {
  const { doc = true, contactos = true } = opts;
  const pessoa = (v: Values) => !isEmp(v, p);
  const empresa = (v: Values) => isEmp(v, p);
  const fields: FieldDef[] = [
    {
      name: `${p}Tipo`,
      type: 'radio',
      section,
      label: l('Quem escreve', 'Who is writing'),
      options: [
        { value: 'pessoa', label: l('Uma pessoa', 'An individual') },
        { value: 'empresa', label: l('Uma empresa ou organização', 'A company or organisation') },
      ],
      default: (c) => (c.profile?.kind === 'empresa' ? 'empresa' : 'pessoa'),
    },
    { name: `${p}Nome`, type: 'text', section, required: true, label: l('Nome completo', 'Full name'), personKey: 'nome', default: (c) => pessoaProfile(c)?.nome ?? '', showIf: pessoa },
    { name: `${p}Genero`, type: 'radio', section, width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, personKey: 'genero', default: (c) => pessoaProfile(c)?.genero ?? 'M', showIf: pessoa },
  ];
  if (doc) {
    fields.push(
      { name: `${p}DocTipo`, type: 'select', section, width: 'half', label: l('Documento de identificação', 'ID document'), options: DOC_TIPO_OPTIONS, personKey: 'docTipo', default: (c) => pessoaProfile(c)?.docTipo ?? 'BI', showIf: pessoa },
      { name: `${p}DocNumero`, type: 'text', section, width: 'half', label: l('Número do documento', 'Document number'), personKey: 'docNumero', default: (c) => pessoaProfile(c)?.docNumero ?? '', showIf: pessoa },
    );
  }
  fields.push(
    { name: `${p}Nuit`, type: 'text', section, width: 'half', label: l(opts.nuitLabel ?? 'NUIT', 'Tax number (NUIT)'), personKey: 'nuit', default: (c) => pessoaProfile(c)?.nuit ?? '', showIf: pessoa },
    { name: `${p}Morada`, type: 'text', section, label: l('Morada', 'Address'), personKey: 'morada', default: (c) => (pessoaProfile(c) ? addressLine(pessoaProfile(c)!) : ''), showIf: pessoa },
    { name: `${p}EmpresaNome`, type: 'text', section, required: true, label: l('Denominação', 'Company name'), default: (c) => empresaProfile(c)?.firma || empresaProfile(c)?.nomeComercial || '', showIf: empresa },
    { name: `${p}EmpresaNuit`, type: 'text', section, width: 'half', label: l('NUIT', 'Tax number (NUIT)'), default: (c) => empresaProfile(c)?.nuit ?? '', showIf: empresa },
    { name: `${p}EmpresaSede`, type: 'text', section, label: l('Sede', 'Registered office'), default: (c) => (empresaProfile(c) ? addressLine(empresaProfile(c)!) : ''), showIf: empresa },
    { name: `${p}RepNome`, type: 'text', section, width: 'half', label: l('Quem assina pela empresa', 'Signatory for the company'), default: (c) => empresaProfile(c)?.representanteNome ?? '', showIf: empresa },
    { name: `${p}RepCargo`, type: 'text', section, width: 'half', label: l('Cargo de quem assina', 'Signatory’s position'), placeholder: l('Ex.: Director-Geral, sócio-gerente', 'E.g. Managing Director'), default: (c) => empresaProfile(c)?.representanteCargo ?? '', showIf: empresa },
  );
  if (contactos) {
    fields.push(
      { name: `${p}Telefone`, type: 'tel', section, width: 'half', label: l('Telefone', 'Phone'), personKey: 'telefone', default: (c) => c.profile?.telefones ?? '' },
      { name: `${p}Email`, type: 'email', section, width: 'half', label: l('Email (opcional)', 'Email (optional)'), personKey: 'email', default: (c) => c.profile?.email ?? '' },
    );
  }
  return fields;
}

export const nomeCliente = (v: Values, p: string) => (isEmp(v, p) ? s(v[`${p}EmpresaNome`]) : s(v[`${p}Nome`]));

/** Feminine agreement: a woman, or a company ("a sociedade"). */
export const clienteF = (v: Values, p: string) => isEmp(v, p) || isF(v[`${p}Genero`]);

/**
 * Verb or pronoun agreeing with the writer: first person singular for an
 * individual ("solicito"), third person for a company ("solicita").
 */
export const eu = (v: Values, p: string, sg: string, emp: string) => (isEmp(v, p) ? emp : sg);

/**
 * Opening subject of a letter: "Eu, **Name**, portador…" or "A **Company**,
 * NUIT…". The address is left out by default: the sender block or the
 * letterhead already shows it.
 */
export const sujeito = (v: Values, p: string, opts: { nuit?: boolean; morada?: boolean } = {}) =>
  `${isEmp(v, p) ? 'A' : 'Eu,'} ${clienteIdent(v, p, { morada: false, ...opts })}`;

/** "**Name**, portador do BI n.º …, NUIT …, residente em …" or the company equivalent. */
export function clienteIdent(v: Values, p: string, opts: { nuit?: boolean; morada?: boolean } = {}): string {
  const { nuit = true, morada = true } = opts;
  const g = (k: string) => s(v[`${p}${k}`]);
  if (isEmp(v, p)) {
    const rep = g('RepNome');
    return [
      `**${g('EmpresaNome') || BLANK}**`,
      nuit ? `NUIT ${g('EmpresaNuit') || BLANK}` : '',
      morada ? `com sede em ${semPonto(g('EmpresaSede')) || BLANK}` : '',
      rep ? `representada por ${rep}${g('RepCargo') ? `, ${g('RepCargo')}` : ''}` : '',
    ]
      .filter(Boolean)
      .join(', ');
  }
  const f = isF(g('Genero'));
  const docNome = g('DocTipo') === 'Passaporte' ? 'Passaporte' : g('DocTipo') === 'DIRE' ? 'DIRE' : 'BI';
  return [
    `**${g('Nome') || BLANK}**`,
    g('DocNumero') || v[`${p}DocTipo`] !== undefined ? `${f ? 'portadora' : 'portador'} do ${docNome} n.º ${g('DocNumero') || BLANK}` : '',
    nuit ? `NUIT ${g('Nuit') || BLANK}` : '',
    morada ? `residente em ${semPonto(g('Morada')) || BLANK}` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * Sender block at the top of a letter. A company writing with its own company
 * profile has the letterhead instead; everyone else identifies here.
 */
export function remetenteBlock(ctx: TemplateContext, p: string): Block[] {
  const v = ctx.values;
  if (isEmp(v, p) && ctx.profile?.kind === 'empresa' && profileDisplayName(ctx.profile) === nomeCliente(v, p)) return [];
  const morada = isEmp(v, p) ? s(v[`${p}EmpresaSede`]) : s(v[`${p}Morada`]);
  const contactos = [s(v[`${p}Telefone`]) ? `Tel.: ${s(v[`${p}Telefone`])}` : '', s(v[`${p}Email`]) ? `Email: ${s(v[`${p}Email`])}` : ''].filter(Boolean).join(' · ');
  const nuit = isEmp(v, p) ? s(v[`${p}EmpresaNuit`]) : s(v[`${p}Nuit`]);
  const lines = [`**${nomeCliente(v, p) || BLANK}**`, morada, [nuit ? `NUIT ${nuit}` : '', contactos].filter(Boolean).join(' · ')].filter(Boolean);
  return [{ type: 'paragraph', id: 'remetente', text: lines.join('\n'), align: 'left', size: 'small', en: 'Sender’s name and contact details.' }];
}

/** Signature of the customer: the company's signatory (with stamp) or the individual. */
export function assinaturaCliente(ctx: TemplateContext, p: string, role?: { m: string; f: string; empresa?: string }): SignatureColumn {
  const v = ctx.values;
  if (isEmp(v, p)) {
    const own = ctx.profile?.kind === 'empresa' && profileDisplayName(ctx.profile) === nomeCliente(v, p);
    return {
      role: role?.empresa ?? (nomeCliente(v, p) || 'Pela empresa'),
      name: s(v[`${p}RepNome`]) || undefined,
      detail: s(v[`${p}RepCargo`]) || undefined,
      image: own ? 'both' : undefined,
    };
  }
  const f = isF(v[`${p}Genero`]);
  return {
    role: role ? (f ? role.f : role.m) : f ? 'A Cliente' : 'O Cliente',
    name: s(v[`${p}Nome`]) || undefined,
    image: ctx.profile?.kind === 'pessoa' && ctx.profile.nome === s(v[`${p}Nome`]) ? 'signature' : undefined,
  };
}

export function clienteWarnings(v: Values, p: string): Warning[] {
  const w: Warning[] = [];
  if (isEmp(v, p)) {
    if (!s(v[`${p}EmpresaNome`])) w.push({ level: 'error', field: `${p}EmpresaNome`, message: l('Indique a denominação da empresa.', 'Enter the company name.') });
    if (!s(v[`${p}RepNome`])) w.push({ level: 'warning', field: `${p}RepNome`, message: l('Indique quem assina pela empresa: deve ter poderes para o acto (assinatura autorizada).', 'State who signs for the company: they must have authority.') });
  } else {
    if (!s(v[`${p}Nome`])) w.push({ level: 'error', field: `${p}Nome`, message: l('Indique o nome completo.', 'Enter the full name.') });
    if (v[`${p}DocNumero`] !== undefined && !s(v[`${p}DocNumero`])) {
      w.push({ level: 'warning', field: `${p}DocNumero`, message: l('Falta o número do documento de identificação.', 'The ID number is missing.') });
    }
  }
  return w;
}

// ---------------------------------------------------------------- Bank / insurer addressed

/** `<p>Nome`, `<p>Balcao`, `<p>Morada` for the institution addressed. */
export function entidadeFields(p: string, section: string, kind: 'banco' | 'seguradora' | 'outra' = 'banco'): FieldDef[] {
  const ex = {
    banco: l('Ex.: Banco Comercial e de Investimentos, S.A.', 'E.g. the bank’s full name'),
    seguradora: l('Ex.: Hollard Moçambique Companhia de Seguros, S.A.', 'E.g. the insurer’s full name'),
    outra: l('Nome da instituição', 'Name of the institution'),
  }[kind];
  return [
    {
      name: `${p}Nome`,
      type: 'text',
      section,
      required: true,
      label: kind === 'banco' ? l('Banco', 'Bank') : kind === 'seguradora' ? l('Seguradora', 'Insurer') : l('Instituição', 'Institution'),
      placeholder: ex,
    },
    {
      name: `${p}Balcao`,
      type: 'text',
      section,
      width: 'half',
      label: kind === 'banco' ? l('Balcão / agência (opcional)', 'Branch (optional)') : l('Departamento (opcional)', 'Department (optional)'),
      placeholder: kind === 'banco' ? l('Ex.: Balcão da Avenida 24 de Julho', 'E.g. the branch name') : l('Ex.: Departamento de Sinistros', 'E.g. Claims Department'),
    },
    { name: `${p}Morada`, type: 'text', section, width: 'half', label: l('Morada (opcional)', 'Address (optional)') },
  ];
}

/** Recipient block: "Ao / À …", branch and address. */
export function entidadeRecipient(v: Values, p: string, depLabel = 'A/C'): Block {
  const nome = s(v[`${p}Nome`]);
  const balcao = s(v[`${p}Balcao`]);
  return {
    type: 'recipient',
    lines: [nome || BLANK, balcao ? (/^(balc|ag[eê]ncia|dep|direc|gabinete|servi)/i.test(balcao) ? balcao : `${depLabel}: ${balcao}`) : '', s(v[`${p}Morada`])].filter(Boolean),
  };
}

/** "do Banco X" / "da Hollard…" — article from the first word. */
export function deEntidade(nome: string, fallback = 'da instituição'): string {
  const n = nome.trim();
  if (!n) return fallback;
  if (/^(banco|millennium|standard|absa|moza|fnb|ecobank|nedbank|bci|bni|first|instituto|gabinete|fundo)\b/i.test(n)) return `do ${n}`;
  return `da ${n}`;
}

// ---------------------------------------------------------------- Account

export function contaFields(section: string, opts: { required?: boolean } = {}): FieldDef[] {
  return [
    { name: 'contaNumero', type: 'text', section, width: 'half', required: opts.required, label: l('Número da conta', 'Account number') },
    { name: 'contaNib', type: 'text', section, width: 'half', label: l('NIB (opcional)', 'Bank identification number (optional)'), help: l('Número de Identificação Bancária, com 21 dígitos, que consta do extracto.', 'The 21-digit bank identification number shown on statements.') },
  ];
}

/** "conta n.º 123 (NIB …)" */
export function contaTexto(v: Values): string {
  const n = s(v.contaNumero);
  const nib = s(v.contaNib);
  return `conta n.º ${n || BLANK}${nib ? ` (NIB ${nib})` : ''}`;
}

// ---------------------------------------------------------------- Closing

export function anexosField(section: string, placeholder = l('Ex.: Cópia do Bilhete de Identidade', 'E.g. Copy of ID card')): FieldDef {
  return {
    name: 'anexos',
    type: 'lines',
    section,
    label: l('Documentos que junta', 'Enclosed documents'),
    addLabel: l('Adicionar documento', 'Add document'),
    columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document'), placeholder }],
    default: [],
  };
}

export const anexosList = (v: Values) => lineItems(v.anexos).map((r) => s(r.descricao)).filter(Boolean);

export function reciboField(section: string, def = true): FieldDef {
  return {
    name: 'recibo',
    type: 'toggle',
    section,
    default: def,
    label: l('Incluir espaço para confirmar a recepção', 'Include a receipt confirmation line'),
    help: l('Entregue em duplicado e peça carimbo e assinatura na sua cópia: é a prova da data de entrega.', 'Deliver two copies and ask for a stamp and signature on yours: it proves the delivery date.'),
  };
}

/** "Com os melhores cumprimentos," + signature + enclosures + receipt line. */
export function fechoCarta(cols: SignatureColumn[], opts: { anexos?: string[]; recibo?: boolean; fecho?: string } = {}): Block[] {
  const blocks: Block[] = [
    { type: 'paragraph', id: 'fecho', text: opts.fecho ?? 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
    { type: 'signatures', columns: cols },
  ];
  if (opts.anexos?.length) blocks.push({ type: 'annexList', items: opts.anexos });
  if (opts.recibo) blocks.push({ type: 'acknowledgement', text: 'Recebido em ___/___/______, às ____:____.', signer: 'Carimbo e assinatura de quem recebe' });
  return blocks;
}

/** Profile name for warnings about the active profile. */
export const profileNome = (p: Profile | null) => profileDisplayName(p);

/** Sender block, reference line, addressee, subject and salutation. */
export function cartaInicio(ctx: TemplateContext, p: string | null, entidade: string, assunto: string, salutation = 'Exmos. Senhores,'): Block[] {
  const v = ctx.values;
  return [
    ...(p ? remetenteBlock(ctx, p) : []),
    { type: 'reference', ref: s(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
    entidadeRecipient(v, entidade),
    { type: 'subject', text: assunto },
    { type: 'salutation', text: salutation },
  ];
}

/** Reference (optional for individuals), place and date. */
export function documentoFields(section = 'documento'): FieldDef[] {
  return [
    { name: 'ref', type: 'text', section, width: 'half', label: l('Referência (opcional)', 'Reference (optional)'), default: (c) => (c.profile?.kind === 'empresa' ? c.nextRef : '') },
    localField(section),
    dateField('data', section),
  ];
}

/** "a, b e c" */
export const juntar = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

// ---------------------------------------------------------------- Disputed transactions

export function movimentosField(section: string, label = l('Movimentos que não reconhece', 'Transactions you do not recognise')): FieldDef {
  return {
    name: 'movimentos',
    type: 'lines',
    section,
    label,
    addLabel: l('Adicionar movimento', 'Add transaction'),
    columns: [
      { name: 'data', type: 'date', label: l('Data', 'Date') },
      { name: 'descricao', type: 'text', label: l('Descrição no extracto', 'Description on the statement'), placeholder: l('Ex.: Compra POS Loja X; Levantamento ATM', 'E.g. POS purchase; ATM withdrawal') },
      { name: 'valor', type: 'money', label: l('Valor (MT)', 'Amount (MZN)') },
    ],
    default: [],
  };
}

export type Movimento = { data: string; descricao: string; valor: number | null };

export function movimentos(v: Values): Movimento[] {
  return lineItems(v.movimentos)
    .map((r) => ({ data: s(r.data), descricao: s(r.descricao), valor: money(r.valor) }))
    .filter((m) => m.data || m.descricao || m.valor != null);
}

/** Table of disputed transactions with the total. */
export function movimentosTable(ms: Movimento[]): Block {
  const total = ms.reduce((a, m) => a + (m.valor ?? 0), 0);
  return {
    type: 'table',
    columns: [
      { label: 'Data', width: 1.1 },
      { label: 'Descrição', width: 3.4 },
      { label: 'Valor (MT)', width: 1.3, align: 'right' },
    ],
    rows: ms.map((m) => [m.data ? formatDateShort(m.data) : BLANK, m.descricao || BLANK, m.valor != null ? formatMoney(m.valor, false) : BLANK]),
    totals: ms.length > 1 ? [['', 'Total', formatMoney(total, false)]] : undefined,
  };
}

/** "de" / "a" / "em" contracted with a leading article: contrair('de', 'o contrato') → "do contrato". */
export function contrair(prep: 'de' | 'a' | 'em' | 'por', x: string): string {
  const m = x.match(/^(o|a|os|as)\s+(.*)$/i);
  if (!m) return `${prep} ${x}`;
  const art = m[1].toLowerCase();
  const map: Record<string, Record<string, string>> = {
    de: { o: 'do', a: 'da', os: 'dos', as: 'das' },
    a: { o: 'ao', a: 'à', os: 'aos', as: 'às' },
    em: { o: 'no', a: 'na', os: 'nos', as: 'nas' },
    por: { o: 'pelo', a: 'pela', os: 'pelos', as: 'pelas' },
  };
  return `${map[prep][art]} ${m[2]}`;
}

// ---------------------------------------------------------------- Tax requests (Autoridade Tributária)

export const IMPOSTO_OPTIONS: FieldOption[] = [
  { value: 'IRPS', label: l('IRPS', 'Personal income tax (IRPS)') },
  { value: 'IRPC', label: l('IRPC', 'Corporate income tax (IRPC)') },
  { value: 'IVA', label: l('IVA', 'VAT (IVA)') },
  { value: 'ISPC', label: l('ISPC (imposto simplificado)', 'Simplified tax (ISPC)') },
  { value: 'Imposto do Selo', label: l('Imposto do Selo', 'Stamp duty') },
  { value: 'ICE', label: l('Imposto sobre Consumos Específicos', 'Excise duty') },
  { value: 'IPRA', label: l('IPRA / imposto predial autárquico', 'Municipal property tax') },
  { value: 'outro', label: l('Outro', 'Other') },
];

export const ACTO_OPTIONS: FieldOption[] = [
  { value: 'liquidacao', label: l('Liquidação adicional / nota de liquidação', 'Additional assessment') },
  { value: 'cobranca', label: l('Nota de cobrança / aviso de pagamento', 'Payment notice') },
  { value: 'coima', label: l('Multa ou coima', 'Fine') },
  { value: 'correccao', label: l('Correcção da matéria tributável (inspecção)', 'Adjustment after audit') },
  { value: 'reembolso', label: l('Indeferimento de reembolso (ex.: IVA)', 'Refund refused (e.g. VAT)') },
  { value: 'retencao', label: l('Retenção na fonte', 'Withholding') },
  { value: 'outro', label: l('Outro acto', 'Other act') },
];

const ACTO_TEXTO: Record<string, string> = {
  liquidacao: 'liquidação',
  cobranca: 'nota de cobrança',
  coima: 'decisão de aplicação de multa',
  correccao: 'correcção da matéria tributável',
  reembolso: 'decisão de indeferimento do reembolso',
  retencao: 'retenção na fonte',
  outro: 'acto tributário',
};

/** Fields describing the tax act concerned: tax, kind, number, dates, period, amount. */
export function actoFields(section: string): FieldDef[] {
  return [
    { name: 'imposto', type: 'select', section, width: 'half', label: l('Imposto', 'Tax'), options: IMPOSTO_OPTIONS, default: 'IVA' },
    { name: 'impostoOutro', type: 'text', section, width: 'half', label: l('Qual imposto ou taxa', 'Which tax or levy'), showIf: (v) => v.imposto === 'outro' },
    { name: 'actoTipo', type: 'select', section, width: 'half', label: l('Acto', 'Act'), options: ACTO_OPTIONS, default: 'liquidacao' },
    { name: 'actoNumero', type: 'text', section, width: 'half', label: l('N.º do documento / processo', 'Document / case no.') },
    { name: 'actoData', type: 'date', section, width: 'half', label: l('Data do acto', 'Date of the act') },
    { name: 'notificacaoData', type: 'date', section, width: 'half', required: true, label: l('Data em que foi notificado', 'Date you were notified'), help: l('O prazo conta-se a partir da notificação. Guarde o envelope ou o comprovativo.', 'The deadline runs from notification. Keep proof of it.') },
    { name: 'periodo', type: 'text', section, width: 'half', label: l('Período de tributação', 'Tax period'), placeholder: l('Ex.: exercício de 2025; Março de 2026', 'E.g. 2025 tax year') },
    { name: 'actoValor', type: 'money', section, width: 'half', label: l('Valor exigido', 'Amount demanded') },
  ];
}

/** "a liquidação adicional de IVA n.º 123, de 2 de Março de 2026, relativa ao exercício de 2025, no valor de 1.000,00 MT" */
export function actoTexto(v: Values): string {
  const imposto = v.imposto === 'outro' ? s(v.impostoOutro) || BLANK : s(v.imposto) || BLANK;
  const tipo = ACTO_TEXTO[v.actoTipo] ?? 'acto tributário';
  const fem = /^(liquidação|nota|decisão|correcção|retenção)/.test(tipo);
  const valor = money(v.actoValor);
  return [
    `${fem ? 'a' : 'o'} ${tipo} de ${imposto}${s(v.actoNumero) ? ` n.º ${s(v.actoNumero)}` : ''}`,
    v.actoData ? `de ${dateLong(v.actoData)}` : '',
    s(v.periodo) ? `${fem ? 'relativa' : 'relativo'} ${contrair('a', /^(o|a)\s/i.test(s(v.periodo)) ? s(v.periodo) : `o ${s(v.periodo)}`)}` : '',
    valor != null ? `no valor de **${formatMoney(valor)}**` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

/** Addressee fields for a request to a tax body. */
export function destinatarioFiscalFields(section: string, entidade = ''): FieldDef[] {
  return [
    {
      name: 'tratamento',
      type: 'select',
      section,
      width: 'half',
      label: l('Forma de tratamento', 'Form of address'),
      options: [
        { value: 'Exmo. Senhor', label: l('Exmo. Senhor', 'Exmo. Senhor') },
        { value: 'Exma. Senhora', label: l('Exma. Senhora', 'Exma. Senhora') },
      ],
      default: 'Exmo. Senhor',
    },
    {
      name: 'entidade',
      type: 'text',
      section,
      required: true,
      label: l('Cargo e serviço do destinatário', 'Addressee’s position and office'),
      default: entidade,
      placeholder: l('Ex.: Director da Área Fiscal do 1.º Bairro Fiscal de Maputo', 'E.g. the head of the local tax office'),
      help: l(
        'Normalmente a Direcção da Área Fiscal onde o contribuinte está registado (ex.: «Director da Área Fiscal do 1.º Bairro Fiscal de Maputo») ou a Unidade de Grandes Contribuintes.',
        'Usually the tax office where the taxpayer is registered, or the Large Taxpayers Unit.',
      ),
    },
    { name: 'destinatarioLocal', type: 'text', section, width: 'half', label: l('Cidade', 'City'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
  ];
}

/** Representative (lawyer, accountant or attorney) who signs for the taxpayer. */
export function mandatarioFields(section: string): FieldDef[] {
  return [
    { name: 'mandatario', type: 'toggle', section, label: l('Assinado por mandatário (advogado, técnico de contas, procurador)', 'Signed by a representative') },
    { name: 'mandatarioNome', type: 'text', section, width: 'half', label: l('Nome do mandatário', 'Representative’s name'), showIf: (v) => Boolean(v.mandatario) },
    { name: 'mandatarioQualidade', type: 'text', section, width: 'half', label: l('Qualidade', 'Capacity'), placeholder: l('Ex.: advogado, carteira n.º 1234 da OAM', 'E.g. lawyer, bar no. …'), showIf: (v) => Boolean(v.mandatario) },
  ];
}

/** Despacho box, addressee and subject of a request to a public tax body. */
export function requerimentoInicio(v: Values, assunto: string): Block[] {
  const blocks: Block[] = [
    { type: 'box', label: 'Despacho', lines: 3, width: 'half', align: 'left' },
    { type: 'recipient', salutation: s(v.tratamento) || 'Exmo. Senhor', lines: [s(v.entidade) || BLANK, s(v.destinatarioLocal).toUpperCase()].filter(Boolean) },
    { type: 'subject', text: assunto },
  ];
  return blocks;
}

/** "**NAME**, NUIT …, residente em … / com sede em …" upper-case, requerimento style. */
export function requerenteTexto(v: Values, p: string): string {
  const id = clienteIdent(v, p);
  return id.replace(/^\*\*(.+?)\*\*/, (_m, n: string) => `**${n.toLocaleUpperCase('pt')}**`);
}

/** Signature of the taxpayer or of the representative, with place and date. */
export function assinaturaFiscal(ctx: TemplateContext, p: string, roleM: string, roleF: string): SignatureColumn {
  const v = ctx.values;
  if (v.mandatario) {
    return { role: 'O Mandatário', name: s(v.mandatarioNome) || undefined, detail: s(v.mandatarioQualidade) || undefined };
  }
  return assinaturaCliente(ctx, p, { m: roleM, f: roleF, empresa: roleF });
}
