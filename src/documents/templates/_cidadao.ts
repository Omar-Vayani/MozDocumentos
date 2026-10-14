// Shared building blocks for the citizen and consumer documents ("cidadao"):
// the author (an individual, or the profile's company), the classic
// identification of a requerente, letter head and close, delivery line,
// receipt slip, annexes and small text helpers.

import { profileDisplayName, type Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import type { LegalRefId } from '@/legal/mz-legal';
import { defineTemplate, type Block, type DefaultsContext, type DocumentTemplate, type FieldDef, type FieldOption, type SignatureColumn, type TemplateContext, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerRep, estadoCivilF, formatMoney, isF, l, lineItems, localField, money, moneyText, splitLines, workerFields } from './_shared';

// ---------------------------------------------------------------- Text helpers

export const str = (x: unknown) => (x == null ? '' : String(x).trim());
export const endDot = (s: string) => (/[.!?:;]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
export const noDot = (s: string) => s.trim().replace(/[.;:]+$/, '');
/** First letter lower-case unless it looks like an acronym or proper noun. */
export function lowerFirst(s: string): string {
  const t = s.trim();
  if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2}/.test(t)) return t;
  return t.charAt(0).toLowerCase() + t.slice(1);
}
/** "a, b e c". */
export function joinE(items: string[]): string {
  const xs = items.filter(Boolean);
  if (xs.length <= 1) return xs[0] ?? '';
  return `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`;
}
export const opt = (value: string, pt: string, en: string): FieldOption => ({ value, label: l(pt, en) });
/** Label of a select option (Portuguese). */
export function optLabel(options: FieldOption[], value: unknown): string {
  return options.find((o) => o.value === value)?.label.pt ?? '';
}

// ---------------------------------------------------------------- Author

export type AutorKey =
  | 'nome' | 'genero' | 'estadoCivil' | 'nacionalidade' | 'naturalidade' | 'profissao'
  | 'docTipo' | 'docNumero' | 'docEmissao' | 'docLocal' | 'nuit' | 'morada' | 'telefone' | 'email';

const FROM_PROFILE: Partial<Record<AutorKey, (p: Profile) => unknown>> = {
  nome: (p) => p.nome,
  genero: (p) => p.genero,
  estadoCivil: (p) => p.estadoCivil,
  nacionalidade: (p) => p.nacionalidade,
  naturalidade: (p) => p.naturalidade,
  profissao: (p) => p.profissao,
  docTipo: (p) => p.docTipo,
  docNumero: (p) => p.docNumero,
  docEmissao: (p) => p.docEmissao,
  docLocal: (p) => p.docLocal,
  nuit: (p) => p.nuit,
  morada: (p) => addressLine(p),
};

/**
 * Fields identifying who writes (prefix `autor` by default), filled from a
 * personal profile. With `empresa`, a radio lets the profile's company write
 * instead (its letterhead and representative are used).
 */
export function autorFields(keys: AutorKey[], opts: { section?: string; empresa?: boolean; prefix?: string; required?: AutorKey[] } = {}): FieldDef[] {
  const section = opts.section ?? 'autor';
  const prefix = opts.prefix ?? 'autor';
  const out: FieldDef[] = [];
  if (opts.empresa) {
    out.push({
      name: `${prefix}Tipo`,
      type: 'radio',
      section,
      label: l('Quem escreve', 'Who is writing'),
      options: [opt('pessoa', 'Uma pessoa', 'An individual'), opt('empresa', 'A empresa do perfil', 'The profile’s company')],
      default: (c) => (c.profile?.kind === 'empresa' && c.profile.tipoEntidade !== 'publica' && c.profile.tipoEntidade !== 'comunitaria' ? 'empresa' : 'pessoa'),
    });
  }
  const pessoal = (v: Values) => !opts.empresa || v[`${prefix}Tipo`] !== 'empresa';
  for (const k of keys) {
    let f: FieldDef;
    if (k === 'profissao') {
      f = { name: `${prefix}Profissao`, type: 'text', section, width: 'half', label: l('Profissão', 'Occupation'), personKey: 'cargo' };
    } else if (k === 'email') {
      f = { name: `${prefix}Email`, type: 'email', section, width: 'half', label: l('Email', 'Email'), personKey: 'email' };
    } else {
      f = workerFields([k], section, prefix)[0];
    }
    const get = FROM_PROFILE[k];
    const fallback = f.default;
    if (k === 'telefone' || k === 'email') {
      f = { ...f, default: (c: DefaultsContext) => (k === 'telefone' ? c.profile?.telefones : c.profile?.email) || '' };
    } else if (get) {
      f = {
        ...f,
        default: (c: DefaultsContext) => {
          if (c.profile?.kind === 'pessoa') {
            const val = get(c.profile);
            if (val) return val;
          }
          return typeof fallback === 'function' ? fallback(c) : fallback ?? '';
        },
      };
    }
    if (opts.required?.includes(k)) f = { ...f, required: true };
    if (k !== 'telefone' && k !== 'email') f = { ...f, showIf: pessoal };
    out.push(f);
  }
  return out;
}

/** True when the profile's company is the author. */
export function isEmpresa(ctx: { values: Values; profile: Profile | null }, prefix = 'autor'): boolean {
  return ctx.values[`${prefix}Tipo`] === 'empresa' && ctx.profile?.kind === 'empresa';
}

const getter = (v: Values, prefix: string) => (k: string) => str(v[`${prefix}${k}`]);

/** "portador do BI n.º …, emitido em …, em …" or a blank to fill in. */
export function docText(v: Values, prefix = 'autor'): string {
  const get = getter(v, prefix);
  const f = isF(get('Genero'));
  const who = f ? 'portadora' : 'portador';
  if (!get('DocNumero')) return `${who} do ${get('DocTipo') || 'BI'} n.º ${BLANK}`;
  return `${who} do ${get('DocTipo') || 'BI'} n.º ${get('DocNumero')}${get('DocEmissao') ? `, emitido em ${dateLong(get('DocEmissao'))}` : ''}${get('DocLocal') ? `, em ${get('DocLocal')}` : ''}`;
}

/**
 * Classic identification of an individual: "**NOME**, casado, de nacionalidade
 * moçambicana, portador do BI n.º …, residente em …". `upper` prints the name
 * in capitals (requerimento style).
 */
export function pessoaDesc(v: Values, prefix = 'autor', o: { upper?: boolean; contactos?: boolean } = {}): string {
  const get = getter(v, prefix);
  const f = isF(get('Genero'));
  const ec = get('EstadoCivil');
  const nome = get('Nome') || BLANK;
  const parts = [
    `**${o.upper ? nome.toUpperCase() : nome}**`,
    ec ? (f ? estadoCivilF(ec) : ec) : '',
    get('Nacionalidade') ? `de nacionalidade ${get('Nacionalidade')}` : '',
    get('Naturalidade') ? `natural de ${get('Naturalidade')}` : '',
    get('Profissao') ? `de profissão ${lowerFirst(get('Profissao'))}` : '',
    docText(v, prefix),
    get('Nuit') ? `NUIT ${get('Nuit')}` : '',
    `residente em ${get('Morada') || BLANK}`,
    o.contactos && (get('Telefone') || get('Email')) ? `contacto: ${[get('Telefone'), get('Email')].filter(Boolean).join(' / ')}` : '',
  ].filter(Boolean);
  return parts.join(', ');
}

/** Identification of the profile's company. */
export function empresaDesc(profile: Profile | null, v: Values, prefix = 'autor', contactos = false): string {
  const p = profile;
  const nome = (p?.kind === 'empresa' ? profileDisplayName(p) : '') || BLANK;
  const parts = [
    `**${nome}**`,
    p && addressLine(p) ? `com sede em ${addressLine(p)}` : '',
    p?.nuit ? `NUIT ${p.nuit}` : '',
    p?.representanteNome ? `neste acto representada por ${p.representanteNome}${p.representanteCargo ? `, ${p.representanteCargo}` : ''}` : '',
    contactos && (str(v[`${prefix}Telefone`]) || str(v[`${prefix}Email`])) ? `contacto: ${[str(v[`${prefix}Telefone`]), str(v[`${prefix}Email`])].filter(Boolean).join(' / ')}` : '',
  ].filter(Boolean);
  return parts.join(', ');
}

/** Identification of the author, individual or company. */
export function autorDesc(ctx: TemplateContext, o: { upper?: boolean; contactos?: boolean; prefix?: string } = {}): string {
  const prefix = o.prefix ?? 'autor';
  return isEmpresa(ctx, prefix) ? empresaDesc(ctx.profile, ctx.values, prefix, o.contactos) : pessoaDesc(ctx.values, prefix, o);
}

/** Name of the author (company or individual). */
export function autorNome(ctx: TemplateContext, prefix = 'autor'): string {
  return isEmpresa(ctx, prefix) ? profileDisplayName(ctx.profile) : str(ctx.values[`${prefix}Nome`]);
}

/** First person: "solicito" / "solicitamos". */
export function eu(ctx: TemplateContext, sg: string, pl: string, prefix = 'autor'): string {
  return isEmpresa(ctx, prefix) ? pl : sg;
}

/** Gendered word for an individual author ("o requerente" / "a requerente"). */
export function ga(v: Values, m: string, f: string, prefix = 'autor'): string {
  return isF(v[`${prefix}Genero`]) ? f : m;
}

/** Signature column of the author. */
export function autorSignature(ctx: TemplateContext, roleM: string, roleF: string, o: { prefix?: string; roleEmpresa?: string } = {}): SignatureColumn {
  const prefix = o.prefix ?? 'autor';
  if (isEmpresa(ctx, prefix)) {
    const rep = employerRep(ctx);
    return { role: o.roleEmpresa ?? (rep.cargo || profileDisplayName(ctx.profile) || 'A Empresa'), name: rep.nome || undefined, detail: o.roleEmpresa && rep.cargo ? rep.cargo : undefined, image: 'both' };
  }
  const v = ctx.values;
  const doc = str(v[`${prefix}DocNumero`]);
  return {
    role: isF(v[`${prefix}Genero`]) ? roleF : roleM,
    name: str(v[`${prefix}Nome`]) || undefined,
    detail: doc ? `${str(v[`${prefix}DocTipo`]) || 'BI'} n.º ${doc}` : undefined,
  };
}

/**
 * Sender block for a letter written by an individual (a company prints its
 * letterhead instead): name, address and contacts, small, at the top left.
 */
export function senderBlock(ctx: TemplateContext, o: { prefix?: string; extra?: string[] } = {}): Block[] {
  const prefix = o.prefix ?? 'autor';
  if (isEmpresa(ctx, prefix)) return [];
  const v = ctx.values;
  const get = getter(v, prefix);
  const lines = [
    `**${get('Nome') || BLANK}**`,
    get('Morada'),
    ...(o.extra ?? []),
    [get('Telefone') ? `Tel.: ${get('Telefone')}` : '', get('Email') ? `Email: ${get('Email')}` : ''].filter(Boolean).join(' · '),
  ].filter(Boolean);
  return [{ type: 'paragraph', id: 'remetente', text: lines.join('\n'), align: 'left', size: 'small', en: 'Sender’s name and contact details.' }];
}

// ---------------------------------------------------------------- Addressee

export const TRATAMENTO_OPTIONS: FieldOption[] = [
  opt('Exmo. Senhor', 'Exmo. Senhor', 'Exmo. Senhor (Dear Sir)'),
  opt('Exma. Senhora', 'Exma. Senhora', 'Exma. Senhora (Dear Madam)'),
  opt('Excelentíssimo Senhor', 'Excelentíssimo Senhor (mais solene)', 'Excelentíssimo Senhor (more formal)'),
  opt('Excelentíssima Senhora', 'Excelentíssima Senhora (mais solene)', 'Excelentíssima Senhora (more formal)'),
  opt('Sua Excelência o Senhor', 'Sua Excelência o Senhor (Ministro, Governador…)', 'His Excellency (Minister, Governor…)'),
  opt('Sua Excelência a Senhora', 'Sua Excelência a Senhora (Ministra, Governadora…)', 'Her Excellency (Minister, Governor…)'),
  opt('Exmos. Senhores', 'Exmos. Senhores (uma empresa ou serviço)', 'Exmos. Senhores (a company or office)'),
];

/** Removes a leading "Senhor"/"Senhora" already given by the form of address. */
export function cleanEntidade(entidade: string, tratamento: string): string {
  const e = entidade.trim();
  if (/Senhora?$/.test(tratamento)) return e.replace(/^(Exm[oa]\.?\s+)?Senhora?\s+/i, '');
  return e;
}

/** Salutation line from the form of address: "Exmo. Senhor," → "Senhor Presidente,". */
export function saudacao(tratamento: string, cargo?: string): string {
  if (/Senhores/.test(tratamento)) return 'Exmos. Senhores,';
  const f = /Senhora/.test(tratamento);
  const c = str(cargo).split(/\s+(do|da|dos|das|de)\s+/)[0];
  if (c && c.length < 40) return `${f ? 'Senhora' : 'Senhor'} ${c},`;
  return `${tratamento},`;
}

// ---------------------------------------------------------------- Delivery and receipt

export const ENVIO_OPTIONS: FieldOption[] = [
  opt('mao', 'Entregue em mão (com cópia para carimbar)', 'Delivered by hand (copy stamped)'),
  opt('registada', 'Carta registada com aviso de recepção', 'Registered letter with proof of delivery'),
  opt('email', 'Por email', 'By email'),
  opt('nenhum', 'Não indicar', 'Do not state'),
];

export function envioField(section: string, def = 'mao'): FieldDef {
  return {
    name: 'envio',
    type: 'select',
    section,
    width: 'half',
    label: l('Como vai entregar', 'How it is delivered'),
    help: l(
      'Guarde prova da entrega: cópia carimbada, aviso de recepção dos correios ou o email enviado. Os prazos de resposta contam-se a partir da recepção.',
      'Keep proof of delivery: a stamped copy, the postal receipt or the sent email. Reply deadlines run from receipt.',
    ),
    options: ENVIO_OPTIONS,
    default: def,
  };
}

/** Small line above the addressee ("Por carta registada com aviso de recepção"). */
export function envioBlock(v: Values): Block[] {
  const t: Record<string, string> = {
    registada: 'Por carta registada com aviso de recepção',
    email: 'Por email',
  };
  const text = t[str(v.envio)];
  return text ? [{ type: 'paragraph', id: 'envio', text, align: 'left', size: 'small', en: 'Delivery method.' }] : [];
}

export function reciboField(section: string, def = true): FieldDef {
  return {
    name: 'recibo',
    type: 'toggle',
    section,
    default: def,
    label: l('Espaço para carimbo de recepção', 'Space for a receipt stamp'),
    help: l('Leve duas cópias: peça carimbo, data e assinatura na sua.', 'Bring two copies: ask for a stamp, date and signature on yours.'),
  };
}

export function reciboBlock(v: Values): Block[] {
  return v.recibo === false ? [] : [{ type: 'acknowledgement', text: 'Recebido em ___/___/______, às ____:____.', signer: 'Quem recebe (carimbo)' }];
}

// ---------------------------------------------------------------- Annexes, facts, deadlines

export function anexosField(section: string, placeholder = l('Ex.: Cópia do Bilhete de Identidade', 'E.g. Copy of ID card'), label = l('Documentos que junta', 'Enclosed documents')): FieldDef {
  return {
    name: 'anexos',
    type: 'lines',
    section,
    label,
    addLabel: l('Adicionar documento', 'Add document'),
    columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document'), placeholder }],
    default: [],
  };
}

export function anexosList(v: Values, name = 'anexos'): string[] {
  return lineItems(v[name]).map((r) => str(r.descricao)).filter(Boolean);
}

export function anexosBlock(v: Values, title?: string): Block[] {
  const items = anexosList(v);
  return items.length ? [{ type: 'annexList', title, items }] : [];
}

/** Numbered facts, or one line to fill in by hand. */
export function factosBlocks(text: unknown, intro = 'Os factos são os seguintes:', id = 'factosIntro'): Block[] {
  const items = splitLines(text);
  return [
    { type: 'paragraph', id, text: intro, en: 'The facts are as follows:', keepWithNext: true },
    { type: 'list', style: 'numeric', items: items.length ? items.map(endDot) : [BLANK, BLANK] },
  ];
}

export function prazoField(section: string, def?: number): FieldDef {
  return {
    name: 'prazoResposta',
    type: 'number',
    section,
    width: 'half',
    min: 1,
    max: 90,
    label: l('Prazo que concede para resposta (dias)', 'Reply deadline you give (days)'),
    help: l('Deixe vazio para pedir resposta «com a maior brevidade».', 'Leave empty to ask for a reply “as soon as possible”.'),
    default: def,
  };
}

/** "Agradeço resposta por escrito no prazo de N dias…" */
export function respostaParagraph(ctx: TemplateContext, o: { id?: string; extra?: string } = {}): Block {
  const v = ctx.values;
  const prazo = Number(v.prazoResposta) > 0 ? Math.round(Number(v.prazoResposta)) : 0;
  const email = str(v.autorEmail);
  const via = email ? `, de preferência para o email ${email}` : '';
  const pre = eu(ctx, 'Agradeço', 'Agradecemos');
  return {
    type: 'paragraph',
    id: o.id ?? 'resposta',
    text: prazo
      ? `${pre} resposta por escrito no prazo de ${prazo} ${prazo === 1 ? 'dia' : 'dias'} a contar da recepção desta carta${via}.${o.extra ? ` ${o.extra}` : ''}`
      : `${pre} resposta por escrito com a maior brevidade${via}.${o.extra ? ` ${o.extra}` : ''}`,
    en: prazo ? `Please reply in writing within ${prazo} day(s) of receipt.` : 'Please reply in writing as soon as possible.',
  };
}

/** Box for the decision (despacho) at the top of a requerimento. */
export function despachoField(section: string): FieldDef {
  return {
    name: 'espacoDespacho',
    type: 'toggle',
    section,
    label: l('Quadro para o despacho no topo da página', 'Box for the decision at the top of the page'),
    help: l('Espaço onde a entidade escreve a decisão (despacho), como no modelo tradicional.', 'Space where the authority writes its decision, as on the traditional form.'),
    default: true,
  };
}

export function despachoBlock(v: Values): Block {
  return v.espacoDespacho === false ? { type: 'spacer', size: 'large' } : { type: 'box', label: 'Despacho', lines: 3, width: 'half', align: 'left' };
}

// ---------------------------------------------------------------- Common warnings

export function autorWarnings(ctx: TemplateContext, o: { doc?: boolean; morada?: boolean; contacto?: boolean; prefix?: string } = {}): Warning[] {
  const prefix = o.prefix ?? 'autor';
  const v = ctx.values;
  const w: Warning[] = [];
  if (v[`${prefix}Tipo`] === 'empresa' && ctx.profile?.kind !== 'empresa') {
    w.push({ level: 'warning', field: `${prefix}Tipo`, message: l('O perfil activo não é de uma empresa. Escolha «Uma pessoa».', 'The active profile is not a company. Choose “An individual”.') });
  }
  if (isEmpresa(ctx, prefix)) {
    if (!ctx.profile?.representanteNome) w.push({ level: 'info', message: l('Indique o representante da empresa no perfil.', 'Set the company representative in the profile.') });
    return w;
  }
  if (!str(v[`${prefix}Nome`])) w.push({ level: 'warning', field: `${prefix}Nome`, message: l('Falta o seu nome completo.', 'Your full name is missing.') });
  if (o.doc && !str(v[`${prefix}DocNumero`])) w.push({ level: 'warning', field: `${prefix}DocNumero`, message: l('Falta o número do documento de identificação.', 'The ID number is missing.') });
  if (o.morada && !str(v[`${prefix}Morada`])) w.push({ level: 'warning', field: `${prefix}Morada`, message: l('Falta a sua morada.', 'Your address is missing.') });
  if (o.contacto && !str(v[`${prefix}Telefone`]) && !str(v[`${prefix}Email`])) {
    w.push({ level: 'info', field: `${prefix}Telefone`, message: l('Indique um telefone ou email para a resposta.', 'Give a phone or email for the reply.') });
  }
  return w;
}

/** Days between two ISO dates (b − a), or null. */
export function daysBetween(a: unknown, b: unknown): number | null {
  const ta = Date.parse(str(a));
  const tb = Date.parse(str(b));
  if (Number.isNaN(ta) || Number.isNaN(tb)) return null;
  return Math.round((tb - ta) / 86_400_000);
}

// ---------------------------------------------------------------- Complaint to a utility or operator

export type Motivo = {
  value: string;
  pt: string;
  en: string;
  /** Subject line ("Reclamação — facturação excessiva"). */
  assunto: string;
  /** What is asked, continuing "solicito …" (no final full stop). */
  pedido: (v: Values) => string;
  /** Shows the list of damaged items with values. */
  danos?: boolean;
  /** Shows the amount field with this label. */
  valor?: [string, string];
};

export type ServiceSpec = {
  id: string;
  /** "fornecimento de energia eléctrica" — the service in the opening sentence. */
  servico: string;
  fornecedores: FieldOption[];
  fornecedorDefault: string;
  /** Labels of the two account fields. */
  /** Form label (PT, EN) and the short label printed in the document. */
  contaLabel: [string, string, string?];
  contadorLabel: [string, string, string?];
  motivos: Motivo[];
  regulador: string;
  reguladorRef: LegalRefId;
  /** Extra warning text (PT, EN). */
  dica?: [string, string];
};

/** Complaint letter to an energy, water or telecommunications provider. */
export function serviceComplaint(spec: ServiceSpec): DocumentTemplate {
  const motivoOf = (v: Values) => spec.motivos.find((m) => m.value === v.motivo) ?? spec.motivos[0];
  return defineTemplate({
    id: spec.id,
    sections: [
      { id: 'autor', title: l('Cliente', 'Customer'), personRole: 'outro' },
      { id: 'destinatario', title: l('Empresa', 'Company') },
      { id: 'conta', title: l('Contrato e factura', 'Account and bill') },
      { id: 'reclamacao', title: l('Reclamação', 'Complaint') },
      { id: 'documento', title: l('Local, data e entrega', 'Place, date and delivery') },
    ],
    fields: [
      ...autorFields(['nome', 'genero', 'docTipo', 'docNumero', 'nuit', 'morada', 'telefone', 'email'], { empresa: true, required: ['nome'] }),
      { name: 'fornecedor', type: 'select', section: 'destinatario', label: l('Empresa', 'Company'), options: spec.fornecedores, default: spec.fornecedorDefault },
      { name: 'fornecedorOutro', type: 'text', section: 'destinatario', label: l('Nome da empresa', 'Company name'), showIf: (v) => v.fornecedor === 'outro' },
      { name: 'fornecedorDepartamento', type: 'text', section: 'destinatario', label: l('Departamento ou loja (opcional)', 'Department or shop (optional)'), placeholder: l('Ex.: Área de Serviço ao Cliente da Matola', 'E.g. Customer service area') },
      { name: 'fornecedorMorada', type: 'text', section: 'destinatario', label: l('Endereço', 'Address') },
      { name: 'numeroCliente', type: 'text', section: 'conta', width: 'half', label: l(spec.contaLabel[0], spec.contaLabel[1]) },
      { name: 'numeroContador', type: 'text', section: 'conta', width: 'half', label: l(spec.contadorLabel[0], spec.contadorLabel[1]) },
      { name: 'localConsumo', type: 'text', section: 'conta', label: l('Local da instalação (se diferente da sua morada)', 'Service address (if different)') },
      { name: 'numeroFactura', type: 'text', section: 'conta', width: 'half', label: l('Factura n.º (opcional)', 'Bill no. (optional)') },
      { name: 'periodo', type: 'text', section: 'conta', width: 'half', label: l('Período / mês', 'Period / month'), placeholder: l('Ex.: Agosto de 2026', 'E.g. August 2026') },
      { name: 'valorFacturado', type: 'money', section: 'conta', width: 'half', label: l('Valor facturado', 'Amount billed') },
      { name: 'valorHabitual', type: 'money', section: 'conta', width: 'half', label: l('Valor habitual (média dos últimos meses)', 'Usual amount (recent average)') },
      { name: 'ocorrencia', type: 'text', section: 'conta', width: 'half', label: l('N.º de reclamação ou ocorrência anterior', 'Earlier ticket no.') },
      { name: 'motivo', type: 'select', section: 'reclamacao', required: true, label: l('Motivo', 'Reason'), options: spec.motivos.map((m) => opt(m.value, m.pt, m.en)), default: spec.motivos[0].value },
      { name: 'dataOcorrencia', type: 'date', section: 'reclamacao', width: 'half', label: l('Desde quando / data do facto', 'Since when / date') },
      {
        name: 'valorPedido',
        type: 'money',
        section: 'reclamacao',
        width: 'half',
        label: l('Valor reclamado', 'Amount claimed'),
        showIf: (v) => Boolean(motivoOf(v).valor),
      },
      {
        name: 'danos',
        type: 'lines',
        section: 'reclamacao',
        label: l('Aparelhos danificados', 'Damaged appliances'),
        addLabel: l('Adicionar aparelho', 'Add appliance'),
        columns: [
          { name: 'item', type: 'text', label: l('Aparelho (marca, modelo)', 'Appliance (make, model)') },
          { name: 'valor', type: 'money', label: l('Valor do dano / reparação', 'Damage / repair cost') },
        ],
        default: [],
        showIf: (v) => Boolean(motivoOf(v).danos),
      },
      { name: 'factos', type: 'textarea', section: 'reclamacao', required: true, rows: 5, label: l('O que aconteceu', 'What happened'), help: l('Um facto por linha, por ordem, com datas, contactos feitos e respostas recebidas.', 'One fact per line, in order, with dates, contacts and replies.') },
      { name: 'pedidoOutro', type: 'textarea', section: 'reclamacao', rows: 2, label: l('Outros pedidos (opcional)', 'Other requests (optional)'), help: l('Acrescenta-se ao pedido do motivo escolhido. Um por linha.', 'Added to the request for the chosen reason. One per line.') },
      { name: 'regulador', type: 'toggle', section: 'reclamacao', default: true, label: l(`Avisar que recorre a ${spec.regulador.replace(/^.*\(([^)]+)\).*$/, '$1')} se não houver resposta`, 'Say you will escalate to the regulator') },
      prazoField('reclamacao'),
      anexosField('reclamacao', l('Ex.: Cópia da factura de Agosto de 2026', 'E.g. Copy of the bill')),
      localField('documento'),
      dateField('data'),
      envioField('documento'),
      reciboField('documento'),
    ],

    warnings: (v, ctx) => {
      const w: Warning[] = autorWarnings(ctx, { contacto: true });
      const m = motivoOf(v);
      if (v.fornecedor === 'outro' && !str(v.fornecedorOutro)) w.push({ level: 'warning', field: 'fornecedorOutro', message: l('Indique o nome da empresa.', 'State the company name.') });
      if (!str(v.numeroCliente) && !str(v.numeroContador)) w.push({ level: 'warning', field: 'numeroCliente', message: l('Indique o número de cliente ou de contador, para a empresa encontrar a conta.', 'Give the account or meter number so the company can find the account.') });
      if (!splitLines(v.factos).length) w.push({ level: 'warning', field: 'factos', message: l('Descreva o que aconteceu.', 'Describe what happened.') });
      if (m.value === 'outro' && !splitLines(v.pedidoOutro).length) w.push({ level: 'warning', field: 'pedidoOutro', message: l('Escreva o que pede.', 'Write what you ask for.') });
      if (m.danos && !lineItems(v.danos).length) w.push({ level: 'info', field: 'danos', message: l('Liste os aparelhos danificados e o valor de cada dano; guarde-os para a vistoria e junte orçamentos ou facturas de reparação.', 'List the damaged appliances and costs; keep them for inspection and attach repair quotes.') });
      w.push({
        level: 'info',
        field: 'regulador',
        message: l(
          `Reclame primeiro à empresa e guarde o número da reclamação. Sem resposta ou sem solução, pode reclamar ao regulador: ${spec.regulador} (${cite(spec.reguladorRef)}).`,
          'Complain to the company first and keep the ticket number. With no reply or solution, complain to the regulator.',
        ),
      });
      if (spec.dica) w.push({ level: 'info', field: 'motivo', message: l(spec.dica[0], spec.dica[1]) });
      return w;
    },

    personName: (v) => (v.fornecedor === 'outro' ? v.fornecedorOutro : optLabel(spec.fornecedores, v.fornecedor).replace(/\s*\(.*\)$/, '')),
    documentDate: (v) => v.data,

    blocks: (ctx) => {
      const v = ctx.values;
      const m = motivoOf(v);
      const empresa = optFullName(spec.fornecedores, v);
      const extra = splitLines(v.pedidoOutro);
      const danos = lineItems(v.danos).filter((r) => str(r.item));
      const totalDanos = danos.reduce((a, r) => a + (money(r.valor) ?? 0), 0);

      const dados = [
        { label: spec.contaLabel[2] ?? 'Cliente n.º', value: str(v.numeroCliente) },
        { label: spec.contadorLabel[2] ?? 'Contador n.º', value: str(v.numeroContador) },
        { label: 'Instalação', value: str(v.localConsumo) },
        { label: 'Factura n.º', value: str(v.numeroFactura) },
        { label: 'Período', value: str(v.periodo) },
        { label: 'Facturado', value: money(v.valorFacturado) != null ? moneyText(v.valorFacturado) : '' },
        { label: 'Habitual', value: money(v.valorHabitual) != null ? moneyText(v.valorHabitual) : '' },
        { label: 'Ocorrência n.º', value: str(v.ocorrencia) },
      ].filter((d) => d.value);
      // Up to three account details read better inside the opening sentence.
      const frases = [
        str(v.numeroCliente) ? `cliente n.º ${str(v.numeroCliente)}` : '',
        str(v.numeroContador) ? `${(spec.contadorLabel[2] ?? 'Contador n.º').replace(/ n\.º$/, '').toLowerCase()} n.º ${str(v.numeroContador)}` : '',
        str(v.ocorrencia) ? `reclamação anterior n.º ${str(v.ocorrencia)}` : '',
      ].filter(Boolean);
      const onlyIds = dados.every((d) => ['numeroCliente', 'numeroContador', 'ocorrencia'].some((k) => str(v[k]) === d.value));
      const inline = dados.length && onlyIds ? frases.join(', ') : '';

      const blocks: Block[] = [
        ...senderBlock(ctx),
        { type: 'reference', place: ctx.place, date: dateLong(v.data) },
        ...envioBlock(v),
        { type: 'recipient', lines: [empresa || BLANK, str(v.fornecedorDepartamento) ? `A/C: ${str(v.fornecedorDepartamento)}` : '', str(v.fornecedorMorada)].filter(Boolean) },
        { type: 'subject', text: m.assunto },
        { type: 'salutation', text: 'Exmos. Senhores,' },
        {
          type: 'paragraph',
          id: 'abertura',
          text: `Na qualidade de cliente do ${spec.servico}${inline ? ` (${inline})` : ''}, ${isEmpresa(ctx) ? `a **${profileDisplayName(ctx.profile)}** apresenta` : 'apresento'} a seguinte reclamação${!inline && dados.length ? ', relativa ao contrato abaixo identificado' : ''}.`,
          en: 'As your customer, I submit the following complaint.',
        },
      ];
      if (dados.length && !inline) blocks.push({ type: 'keyValue', columns: 2, items: dados });
      blocks.push(...factosBlocks(v.factos, v.dataOcorrencia ? `Os factos são os seguintes (desde ${dateLong(v.dataOcorrencia)}):` : 'Os factos são os seguintes:'));
      if (danos.length) {
        blocks.push(
          { type: 'paragraph', id: 'danosIntro', text: `Ficaram danificados os seguintes aparelhos${totalDanos > 0 ? `, com prejuízo total de **${formatMoney(totalDanos)}**` : ''}:`, en: 'The following appliances were damaged:', keepWithNext: true },
          { type: 'list', style: 'bullet', items: danos.map((r) => `${str(r.item)}${money(r.valor) != null ? ` — ${formatMoney(money(r.valor)!)}` : ''}`) },
        );
      }
      const pedidos = m.value === 'outro' ? extra : [m.pedido(v), ...extra];
      const lei = cite('cidInaeQueixa');
      blocks.push({
        type: 'paragraph',
        id: 'pedido',
        text:
          pedidos.length > 1
            ? `Face ao exposto, e ao abrigo da Lei de Defesa do Consumidor (${lei}), ${eu(ctx, 'solicito', 'solicitamos')}:`
            : `Face ao exposto, e ao abrigo da Lei de Defesa do Consumidor (${lei}), ${eu(ctx, 'solicito', 'solicitamos')} ${pedidos.length ? endDot(lowerFirst(pedidos[0])) : `${BLANK}.`}`,
        en: 'Therefore, under the Consumer Protection Law, I request the following.',
        keepWithNext: pedidos.length > 1,
      });
      if (pedidos.length > 1) blocks.push({ type: 'list', style: 'alpha', items: pedidos.map((p) => endDot(p.charAt(0).toUpperCase() + p.slice(1))) });
      blocks.push(
        respostaParagraph(ctx, {
          extra: v.regulador === false ? undefined : `Na falta de resposta ou de solução, ${eu(ctx, 'apresentarei', 'apresentaremos')} reclamação à ${spec.regulador} e às demais entidades competentes.`,
        }),
      );
      blocks.push(...anexosBlock(v));
      blocks.push(
        { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
        { type: 'signatures', columns: [autorSignature(ctx, 'O Cliente', 'A Cliente')] },
        ...reciboBlock(v),
      );
      return blocks;
    },
  });
}

/** Full name of the chosen provider (text in brackets is the label hint, not the name). */
function optFullName(options: FieldOption[], v: Values): string {
  if (v.fornecedor === 'outro') return str(v.fornecedorOutro);
  return optLabel(options, v.fornecedor).replace(/\s*\((?!E\.P\.|S\.A\.)[^)]*\)$/, '');
}
