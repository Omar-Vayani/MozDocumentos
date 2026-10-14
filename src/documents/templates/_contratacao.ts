// Shared pieces for public-procurement documents (Regulamento de Contratação de
// Empreitada de Obras Públicas, Fornecimento de Bens e Prestação de Serviços ao
// Estado): the procedure (modality, number, object), the contracting body, the
// bidder, the company addressed by the contracting body, jury members, item
// tables and the bank-guarantee and public-contract builders shared by several
// templates.

import { formatNumber, roundMoney } from '@/lib/format';
import { isPublicBody } from '@/lib/storage/types';
import type { Block, ClauseItem, DefaultsContext, FieldDef, SignatureColumn, TemplateContext, Values, Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, lineItems, money } from './_shared';
import { assinatura, identificacao, isEmpresa, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str, valorTexto } from './_contratos';

export { str, semPonto, numerar, valorTexto, identificacao };

// ---------------------------------------------------------------- Procedure

export const MODALIDADES: { value: string; nome: string; label: ReturnType<typeof l> }[] = [
  { value: 'publico', nome: 'Concurso Público', label: l('Concurso público', 'Open tender') },
  { value: 'limitado', nome: 'Concurso Limitado', label: l('Concurso limitado', 'Restricted tender') },
  { value: 'pequena', nome: 'Concurso de Pequena Dimensão', label: l('Concurso de pequena dimensão', 'Small-value tender') },
  { value: 'cotacoes', nome: 'Concurso por Cotações', label: l('Concurso por cotações', 'Request for quotations') },
  { value: 'ajuste', nome: 'Ajuste Directo', label: l('Ajuste directo', 'Direct award') },
  { value: 'duas-etapas', nome: 'Concurso em Duas Etapas', label: l('Concurso em duas etapas', 'Two-stage tender') },
  { value: 'previa', nome: 'Concurso com Prévia Qualificação', label: l('Concurso com prévia qualificação', 'Pre-qualified tender') },
  { value: 'lances', nome: 'Concurso por Lances', label: l('Concurso por lances', 'Auction') },
];

export const MODALIDADE_OPTIONS = MODALIDADES.map(({ value, label }) => ({ value, label }));

export const TIPO_CONTRATACAO_OPTIONS = [
  { value: 'bens', label: l('Fornecimento de bens', 'Supply of goods') },
  { value: 'servicos', label: l('Prestação de serviços', 'Services') },
  { value: 'consultoria', label: l('Consultoria', 'Consultancy') },
  { value: 'obras', label: l('Empreitada de obras públicas', 'Public works') },
];

export const modalidadeNome = (v: Values) => MODALIDADES.find((m) => m.value === v.modalidade)?.nome ?? 'Concurso';

/** "Concurso Público n.º 12/UGEA/DPS-NPL/2026" (a blank to fill in when the number is missing). */
export function procedimentoNome(v: Values): string {
  const n = semPonto(v.concursoNumero);
  const nome = modalidadeNome(v);
  return `${nome} n.º ${n || '________'}`;
}

/** Object with a lower-case first letter, to embed in a sentence. */
export function objectoTexto(v: Values): string {
  const o = semPonto(v.objecto);
  if (!o) return BLANK;
  return /^\p{Lu}\p{Ll}/u.test(o) ? o.charAt(0).toLowerCase() + o.slice(1) : o;
}

/** "o fornecimento de …" / "a aquisição de …": the object with its article. */
export function objectoComArtigo(v: Values): string {
  const o = objectoTexto(v);
  if (o === BLANK || /^(o|a|os|as)\s/i.test(o)) return o;
  const first = o.split(/\s+/)[0];
  return `${/(ção|são|dade|gem|ria|ura|ncia|agem)$/i.test(first) || /^(obra|empreitada|reabilitação|construção|aquisição|prestação|manutenção|limpeza|segurança|consultoria|elaboração|assistência|formação|impressão|locação|reparação)$/i.test(first) ? 'a' : 'o'} ${o}`;
}

/** "Concurso Público n.º 12/2026, para o fornecimento de …, Lote 2" */
export function procedimentoCompleto(v: Values): string {
  const lote = semPonto(v.lote);
  return `${procedimentoNome(v)}, para ${objectoComArtigo(v)}${lote ? ` (${/^lote/i.test(lote) ? lote : `Lote ${lote}`})` : ''}`;
}

export function procedimentoFields(section = 'procedimento', opts: { lote?: boolean; defaultModalidade?: string } = {}): FieldDef[] {
  const out: FieldDef[] = [
    {
      name: 'modalidade',
      type: 'select',
      section,
      width: 'half',
      label: l('Modalidade de contratação', 'Procurement method'),
      options: MODALIDADE_OPTIONS,
      default: opts.defaultModalidade ?? 'publico',
    },
    {
      name: 'concursoNumero',
      type: 'text',
      section,
      width: 'half',
      required: true,
      label: l('Número do concurso / procedimento', 'Tender / procedure number'),
      placeholder: l('Ex.: 12/UGEA/DPS-NPL/2026', 'E.g. 12/UGEA/DPS-NPL/2026'),
      help: l('Copie o número exactamente como aparece no anúncio ou no convite.', 'Copy the number exactly as in the notice or invitation.'),
    },
    {
      name: 'objecto',
      type: 'text',
      section,
      required: true,
      label: l('Objecto do concurso', 'Subject of the tender'),
      placeholder: l('Ex.: fornecimento de material de escritório e consumíveis informáticos', 'E.g. supply of office stationery and IT consumables'),
    },
  ];
  if (opts.lote !== false) {
    out.push({ name: 'lote', type: 'text', section, width: 'half', label: l('Lote (opcional)', 'Lot (optional)'), placeholder: l('Ex.: 2', 'E.g. 2') });
  }
  return out;
}

// ---------------------------------------------------------------- Contracting body (bidder side)

export function entidadeFields(section = 'entidade'): FieldDef[] {
  return [
    {
      name: 'entidadeNome',
      type: 'text',
      section,
      required: true,
      label: l('Entidade contratante', 'Contracting body'),
      placeholder: l('Ex.: Direcção Provincial de Saúde de Nampula', 'E.g. Nampula Provincial Health Directorate'),
    },
    {
      name: 'entidadeUnidade',
      type: 'text',
      section,
      label: l('Unidade que recebe (opcional)', 'Receiving unit (optional)'),
      default: 'Unidade Gestora Executora das Aquisições (UGEA)',
      help: l('Normalmente a UGEA. Deixe em branco se o documento de concurso indicar outro destinatário.', 'Usually the procurement unit (UGEA). Leave blank if the tender names another addressee.'),
    },
    { name: 'entidadeLocal', type: 'text', section, width: 'half', label: l('Cidade', 'City'), default: (c: DefaultsContext) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
  ];
}

export function entidadeRecipient(v: Values): Block {
  return {
    type: 'recipient',
    salutation: 'À',
    lines: [str(v.entidadeNome) || BLANK, str(v.entidadeUnidade), str(v.entidadeLocal).toLocaleUpperCase('pt')].filter(Boolean),
  };
}

/** "da" / "do" before an institution's name. */
export function deArt(nome: string): 'da' | 'do' {
  const n = nome.trim();
  if (/^a\s/i.test(n)) return 'da';
  if (/^o\s/i.test(n)) return 'do';
  return /^(Direcç|Secretaria|Administraç|Autoridade|Agência|Universidade|Escola|Empresa|Inspecç|Delegaç|Procuradoria|Unidade|Comissão|Assembleia|Polícia|Presidência|Câmara|Repartição|Faculdade|Academia|Alfândega|Entidade|Instituição|Ordem|Câmara)/i.test(n)
    ? 'da'
    : 'do';
}

/** "A Direcção Provincial…" / "O Instituto…" (sentence start). */
export function aEntidade(nome: string): string {
  const n = nome.trim();
  if (!n) return 'A entidade contratante';
  if (/^(a|o)\s/i.test(n)) return n.charAt(0).toUpperCase() + n.slice(1);
  return `${deArt(n) === 'da' ? 'A' : 'O'} ${n}`;
}

/** "da Direcção Provincial…" / "do Instituto…" */
export function daEntidade(nome: string): string {
  const n = nome.trim();
  if (!n) return 'da entidade contratante';
  if (/^(a|o)\s/i.test(n)) return `d${n.charAt(0).toLowerCase()} ${n.slice(2)}`;
  return `${deArt(n)} ${n}`;
}

// ---------------------------------------------------------------- Bidder

/** Bidder identification fields, defaulted from the issuing company profile. */
export const concorrenteFields = (section = 'concorrente') => partyFields(section === 'concorrente' ? 'concorrente' : section, { fromProfile: true, tipoDefault: 'empresa' });

export const isEmpresaConcorrente = (v: Values) => isEmpresa(v, 'concorrente');
export const concorrenteNome = (v: Values) => partyName(v, 'concorrente');
/** Compact identification of the bidder (a company in one line of data; an individual in full). */
export function concorrenteIdent(v: Values): string {
  if (!isEmpresa(v, 'concorrente')) return identificacao(v, 'concorrente');
  const get = (k: string) => str(v[`concorrente${k}`]);
  const rep = get('RepNome');
  return [
    `**${get('EmpresaNome') || BLANK}**`,
    `NUIT ${get('EmpresaNuit') || BLANK}`,
    get('EmpresaNuel') ? `NUEL ${get('EmpresaNuel')}` : '',
    `com sede em ${semPonto(get('EmpresaSede')) || BLANK}`,
    `representada por ${rep || BLANK}${get('RepCargo') ? `, na qualidade de ${get('RepCargo')}` : ''}`,
  ]
    .filter(Boolean)
    .join(', ');
}

/** Signature of the bidder: representative, capacity and company, with the company's signature and stamp. */
export function concorrenteSignature(ctx: TemplateContext, role = 'O Concorrente'): SignatureColumn {
  const col = assinatura(ctx, 'concorrente', papel(ctx.values, 'concorrente', 'Concorrente', 'Concorrente'), true);
  return { ...col, role };
}

export function concorrenteWarnings(v: Values): Warning[] {
  return partyWarnings(v, 'concorrente', 'concorrente', 'bidder');
}

/** Bidder documents are filed with the contracting body: the official-copy warning. */
export function formularioWarning(): Warning {
  return {
    level: 'info',
    message: l(
      `Se o documento de concurso trouxer um formulário próprio para esta peça, use esse formulário sem alterar o formato (${cite('ctDocumentoConcursoModelo')}). Este modelo serve quando o documento de concurso não traz formulário ou o remete para modelo livre.`,
      'If the tender document contains its own form for this item, use that form without changing its format. This template is for when the tender document has no form or allows a free format.',
    ),
  };
}

// ---------------------------------------------------------------- Company addressed by a public body

export function empresaDestFields(section = 'destinatario'): FieldDef[] {
  return [
    { name: 'destEmpresa', type: 'text', section, required: true, label: l('Empresa ou concorrente', 'Company or bidder'), placeholder: l('Ex.: Papelaria Central, Lda', 'E.g. Papelaria Central, Lda') },
    { name: 'destAtencao', type: 'text', section, width: 'half', label: l('À atenção de (opcional)', 'For the attention of (optional)'), placeholder: l('Ex.: Director-Geral', 'E.g. Managing Director') },
    { name: 'destEndereco', type: 'text', section, width: 'half', label: l('Endereço (opcional)', 'Address (optional)') },
    { name: 'destLocal', type: 'text', section, width: 'half', label: l('Cidade', 'City'), default: (c: DefaultsContext) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
  ];
}

export function empresaDestBlock(v: Values): Block {
  return {
    type: 'recipient',
    salutation: 'Exmos. Senhores',
    lines: [str(v.destEmpresa) || BLANK, str(v.destAtencao) ? `At.: ${str(v.destAtencao)}` : '', str(v.destEndereco), str(v.destLocal).toLocaleUpperCase('pt')].filter(Boolean),
  };
}

/** Warning when a contracting-body document is issued without a public-body profile. */
export function entidadeProfileWarning(ctx: TemplateContext): Warning[] {
  if (isPublicBody(ctx.profile)) return [];
  return [
    {
      level: 'warning',
      message: l(
        'Este documento é emitido pela entidade contratante. Use o perfil da instituição pública (com a sigla e a UGEA), para imprimir o cabeçalho «República de Moçambique» e o emblema.',
        'This document is issued by the contracting body. Use the public institution’s profile so that the national header and emblem are printed.',
      ),
    },
  ];
}

// ---------------------------------------------------------------- Jury

export const JURI_FUNCAO_OPTIONS = [
  { value: 'Presidente', label: l('Presidente', 'Chair') },
  { value: 'Vogal', label: l('Vogal', 'Member') },
  { value: 'Secretário', label: l('Secretário(a)', 'Secretary') },
  { value: 'Relator', label: l('Relator(a)', 'Rapporteur') },
];

export function juriField(section = 'juri'): FieldDef {
  return {
    name: 'juri',
    type: 'lines',
    section,
    label: l('Membros do júri', 'Jury members'),
    addLabel: l('Adicionar membro', 'Add member'),
    columns: [
      { name: 'funcao', type: 'select', label: l('Função', 'Role'), options: JURI_FUNCAO_OPTIONS, default: 'Vogal' },
      { name: 'nome', type: 'text', label: l('Nome', 'Name') },
      { name: 'cargo', type: 'text', label: l('Cargo / categoria (opcional)', 'Position (optional)') },
    ],
    default: [
      { funcao: 'Presidente', nome: '', cargo: '' },
      { funcao: 'Vogal', nome: '', cargo: '' },
      { funcao: 'Vogal', nome: '', cargo: '' },
    ],
    help: l('O júri é composto por um número ímpar de membros, designados por despacho da autoridade competente.', 'The jury has an odd number of members, appointed by order of the competent authority.'),
  };
}

export type Membro = { funcao: string; nome: string; cargo: string };

export function juriMembros(v: Values): Membro[] {
  const rows = lineItems(v.juri)
    .map((r) => ({ funcao: str(r.funcao) || 'Vogal', nome: str(r.nome), cargo: str(r.cargo) }))
    .filter((r) => r.nome || r.cargo);
  return rows.length ? rows : [{ funcao: 'Presidente', nome: '', cargo: '' }, { funcao: 'Vogal', nome: '', cargo: '' }, { funcao: 'Vogal', nome: '', cargo: '' }];
}

/** "Ana Machava (Presidente), João Sitoe (Vogal) e …" */
export function juriTexto(v: Values): string {
  const ms = juriMembros(v).map((m) => `${m.nome || BLANK}${m.cargo ? `, ${m.cargo}` : ''} (${m.funcao})`);
  return ms.length <= 1 ? ms.join('') : `${ms.slice(0, -1).join('; ')} e ${ms[ms.length - 1]}`;
}

/** Signature rows of three for the jury. */
export function juriSignatures(v: Values, keepLast = false): Block[] {
  const cols: SignatureColumn[] = juriMembros(v).map((m) => ({ role: `O ${m.funcao}`, name: m.nome || undefined, detail: m.cargo || undefined }));
  const out: Block[] = [];
  for (let i = 0; i < cols.length; i += 3) {
    out.push({ type: 'signatures', columns: cols.slice(i, i + 3), keepWithNext: keepLast || i + 3 < cols.length });
  }
  return out;
}

// ---------------------------------------------------------------- Items and prices

export type Item = { descricao: string; especificacao: string; unidade: string; quantidade: number | null; preco: number | null; total: number | null };

export function items(v: Values, name = 'itens'): Item[] {
  return lineItems(v[name])
    .map((r) => {
      const q = r.quantidade === '' || r.quantidade == null ? null : Number(String(r.quantidade).replace(',', '.'));
      const p = money(r.preco);
      const quantidade = q != null && Number.isFinite(q) ? q : null;
      return {
        descricao: str(r.descricao),
        especificacao: str(r.especificacao),
        unidade: str(r.unidade),
        quantidade,
        preco: p,
        total: quantidade != null && p != null ? roundMoney(quantidade * p) : null,
      };
    })
    .filter((r) => r.descricao || r.especificacao || r.preco != null);
}

export const qtd = (n: number | null) => (n == null ? '' : formatNumber(n, Number.isInteger(n) ? 0 : 2));
export const mt = (n: number | null) => (n == null ? '' : formatMoney(n, false));

export const IVA_OPTIONS = [
  { value: 'acrescer', label: l('Preços sem IVA (o IVA acresce)', 'Prices before VAT (VAT added)') },
  { value: 'incluido', label: l('Preços com IVA incluído', 'Prices include VAT') },
  { value: 'isento', label: l('Isento / não sujeito a IVA', 'VAT exempt / not liable') },
];

/** Totals of a price list: subtotal, VAT and total, by the VAT option chosen. */
export function totais(list: Item[], ivaModo: unknown, taxa: number /* fraction, e.g. 0.16 */) {
  const subtotal = roundMoney(list.reduce((s, i) => s + (i.total ?? 0), 0));
  const has = list.some((i) => i.total != null);
  if (!has) return { subtotal: null, iva: null, total: null };
  if (ivaModo === 'acrescer') {
    const iva = roundMoney(subtotal * taxa);
    return { subtotal, iva, total: roundMoney(subtotal + iva) };
  }
  return { subtotal, iva: null, total: subtotal };
}

// ---------------------------------------------------------------- Bank guarantees

export type GarantiaKind = 'provisoria' | 'definitiva' | 'adiantamento';

const GARANTIA_TITULO: Record<GarantiaKind, string> = {
  provisoria: 'Garantia Bancária Provisória',
  definitiva: 'Garantia Bancária Definitiva',
  adiantamento: 'Garantia Bancária de Adiantamento',
};

export function garantiaFields(kind: GarantiaKind): FieldDef[] {
  const fields: FieldDef[] = [
    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local de emissão', 'Place of issue'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', label: l('Data de emissão', 'Date of issue'), default: (c) => c.today },
    { name: 'garantiaNumero', type: 'text', section: 'documento', width: 'half', label: l('Garantia n.º (atribuído pelo banco)', 'Guarantee no. (given by the bank)') },

    { name: 'bancoNome', type: 'text', section: 'banco', required: true, label: l('Banco garante', 'Guarantor bank'), placeholder: l('Ex.: Banco Comercial e de Investimentos, S.A.', 'E.g. Banco Comercial e de Investimentos, S.A.') },
    { name: 'bancoSede', type: 'text', section: 'banco', width: 'half', label: l('Sede ou balcão', 'Head office or branch'), placeholder: l('Ex.: Avenida 25 de Setembro, Maputo', 'E.g. Av. 25 de Setembro, Maputo') },
    { name: 'bancoNuit', type: 'text', section: 'banco', width: 'half', label: l('NUIT do banco (opcional)', 'Bank tax number (optional)') },
    { name: 'bancoRepresentantes', type: 'text', section: 'banco', label: l('Representantes do banco (opcional)', 'Bank signatories (optional)'), help: l('O banco preenche normalmente os nomes de quem assina por ele.', 'The bank normally fills in its signatories.') },

    ...partyFields('concorrente', { fromProfile: true, tipoDefault: 'empresa' }),

    {
      name: 'beneficiario',
      type: 'text',
      section: 'beneficiario',
      required: true,
      label: l('Beneficiário (entidade contratante)', 'Beneficiary (contracting body)'),
      placeholder: l('Ex.: Direcção Provincial de Saúde de Nampula', 'E.g. Nampula Provincial Health Directorate'),
    },
    { name: 'beneficiarioNuit', type: 'text', section: 'beneficiario', width: 'half', label: l('NUIT do beneficiário (opcional)', 'Beneficiary NUIT (optional)') },
    { name: 'beneficiarioLocal', type: 'text', section: 'beneficiario', width: 'half', label: l('Cidade', 'City') },
    ...procedimentoFields('beneficiario'),
  ];
  if (kind !== 'provisoria') {
    fields.push(
      { name: 'contratoNumero', type: 'text', section: 'beneficiario', width: 'half', label: l('Contrato n.º (se já existir)', 'Contract no. (if any)') },
      { name: 'contratoValor', type: 'money', section: 'beneficiario', width: 'half', label: l('Valor do contrato', 'Contract value') },
    );
  }
  fields.push(
    { name: 'valor', type: 'money', section: 'garantia', required: true, width: 'half', label: l(kind === 'adiantamento' ? 'Valor garantido (= adiantamento)' : 'Valor garantido', kind === 'adiantamento' ? 'Amount guaranteed (= advance)' : 'Amount guaranteed') },
    {
      name: 'validade',
      type: 'date',
      section: 'garantia',
      width: 'half',
      label: l('Válida até', 'Valid until'),
      help:
        kind === 'provisoria'
          ? l('Cubra todo o prazo de validade da proposta, com a margem exigida no documento de concurso.', 'Cover the whole bid validity period, with the margin required by the tender document.')
          : kind === 'definitiva'
            ? l('Normalmente até à recepção definitiva ou ao fim do prazo de garantia. Deixe em branco para «até à sua libertação pelo beneficiário».', 'Usually until final acceptance or end of warranty. Leave blank for “until released by the beneficiary”.')
            : l('Até ao reembolso integral do adiantamento. Deixe em branco para «até ao reembolso integral».', 'Until the advance is fully recovered. Leave blank for “until full recovery”.'),
    },
    {
      name: 'prazoPagamento',
      type: 'number',
      section: 'garantia',
      width: 'half',
      min: 1,
      max: 60,
      label: l('Prazo de pagamento pelo banco (dias)', 'Bank’s payment period (days)'),
      help: l('Prazo, contado do pedido escrito do beneficiário, em que o banco paga. Use o do documento de concurso.', 'Days from the beneficiary’s written demand within which the bank pays. Use the tender document’s period.'),
    },
    { name: 'foro', type: 'text', section: 'garantia', width: 'half', label: l('Foro', 'Courts'), default: 'Tribunal Judicial da Cidade de Maputo' },
  );
  return fields;
}

export function garantiaWarnings(v: Values, kind: GarantiaKind, ctx: TemplateContext): Warning[] {
  const w: Warning[] = [];
  if (!str(v.bancoNome)) w.push({ level: 'warning', field: 'bancoNome', message: l('Indique o banco garante.', 'Enter the guarantor bank.') });
  if (!str(v.beneficiario)) w.push({ level: 'warning', field: 'beneficiario', message: l('Indique a entidade contratante (beneficiário).', 'Enter the contracting body (beneficiary).') });
  if (money(v.valor) == null) w.push({ level: 'error', field: 'valor', message: l('Indique o valor garantido.', 'Enter the amount guaranteed.') });
  w.push(...partyWarnings(v, 'concorrente', 'ordenante', 'applicant'));
  w.push({
    level: 'info',
    message: l(
      'Este texto é a minuta que o concorrente entrega ao banco. É o banco que a emite e assina, no seu papel timbrado, com a assinatura dos seus representantes. Se o documento de concurso trouxer um modelo de garantia, o banco deve usar esse modelo.',
      'This is the draft the bidder gives the bank. The bank issues and signs it on its own letterhead. If the tender document contains a guarantee model, the bank should use that model.',
    ),
  });
  if (kind === 'provisoria') {
    const max = ctx.legal.value<number>('ctGarantiaProvisoria');
    w.push({
      level: 'info',
      field: 'valor',
      message: l(
        `O valor é o fixado no documento de concurso; não pode exceder ${String(max).replace('.', ',')}% do valor estimado da contratação (${cite('ctGarantiaProvisoria')}). A proposta sem garantia provisória exigida é desclassificada.`,
        `The amount is the one set in the tender document; it may not exceed ${max}% of the estimated value. A bid without the required security is disqualified.`,
      ),
    });
    if (!v.validade) w.push({ level: 'warning', field: 'validade', message: l('Indique a data até à qual a garantia é válida (validade da proposta).', 'Enter the expiry date (bid validity).') });
  }
  if (kind === 'definitiva') {
    w.push({ level: 'info', message: l(`A garantia definitiva é prestada depois da adjudicação e antes da assinatura do contrato, no valor fixado no documento de concurso (${cite('ctGarantiaDefinitiva')}).`, 'The performance security is lodged after award and before signing, for the amount set in the tender document.') });
  }
  if (kind === 'adiantamento') {
    const vc = money(v.contratoValor);
    const vv = money(v.valor);
    if (vc != null && vv != null && vv > vc) w.push({ level: 'warning', field: 'valor', message: l('O valor garantido é superior ao valor do contrato.', 'The amount guaranteed exceeds the contract value.') });
  }
  return w;
}

export function garantiaBlocks(ctx: TemplateContext, kind: GarantiaKind): Block[] {
  const v = ctx.values;
  const valor = money(v.valor);
  const banco = `**${str(v.bancoNome) || BLANK}**`;
  const bancoId = [banco, str(v.bancoSede) ? `com sede em ${semPonto(v.bancoSede)}` : '', str(v.bancoNuit) ? `NUIT ${str(v.bancoNuit)}` : '', `neste acto representado por ${semPonto(v.bancoRepresentantes) || BLANK}`].filter(Boolean).join(', ');
  const ordenante = identificacao(v, 'concorrente');
  const benef = `${str(v.beneficiario) ? deArt(str(v.beneficiario)) : 'de'} **${str(v.beneficiario) || BLANK}**${str(v.beneficiarioNuit) ? `, NUIT ${str(v.beneficiarioNuit)}` : ''}${str(v.beneficiarioLocal) ? `, com sede em ${semPonto(v.beneficiarioLocal)}` : ''}`;
  const proc = procedimentoCompleto(v);
  const contrato = str(v.contratoNumero) ? `do Contrato n.º ${semPonto(v.contratoNumero)}` : 'do contrato celebrado ou a celebrar';
  const contratoValor = money(v.contratoValor);
  const prazo = `no prazo de ${diasTexto(v.prazoPagamento)}`;
  const validade = v.validade
    ? `até ${dateLong(v.validade)}`
    : kind === 'adiantamento'
      ? 'até ao reembolso integral do adiantamento'
      : kind === 'definitiva'
        ? 'até à sua libertação pelo Beneficiário, após o cumprimento das obrigações garantidas'
        : `até ${BLANK}`;

  const finalidade: Record<GarantiaKind, string> = {
    provisoria: `destinada a caucionar a manutenção da proposta apresentada pelo Ordenante ao ${proc}, lançado ${daEntidade(str(v.beneficiario))}, e o cumprimento das obrigações que para ele decorrem da apresentação da proposta`,
    definitiva: `destinada a garantir o exacto e pontual cumprimento de todas as obrigações assumidas pelo Ordenante na execução ${contrato}${contratoValor != null ? `, no valor de ${formatMoney(contratoValor)}` : ''}, adjudicado no âmbito do ${proc}`,
    adiantamento: `destinada a garantir a restituição do adiantamento concedido ao Ordenante por conta ${contrato}${contratoValor != null ? `, no valor de ${formatMoney(contratoValor)}` : ''}, adjudicado no âmbito do ${proc}`,
  };
  const casos: Record<GarantiaKind, string[]> = {
    provisoria: [
      'retirou ou alterou a sua proposta durante o prazo de validade;',
      'sendo adjudicatário, não prestou a garantia definitiva no prazo fixado;',
      'sendo adjudicatário, não assinou o contrato no prazo fixado, por facto que lhe seja imputável;',
      'prestou falsas declarações ou apresentou documentos falsos no procedimento.',
    ],
    definitiva: [],
    adiantamento: [],
  };

  const items: ClauseItem[] = [
    {
      id: 'objecto',
      text: `${bancoId}, adiante designado por **Banco**, declara que, a pedido e por conta de ${ordenante}, adiante designado por **Ordenante**, presta a favor ${benef}, adiante designado por **Beneficiário**, uma garantia bancária autónoma, irrevogável e à primeira solicitação, até ao montante de ${valorTexto(valor)}, ${finalidade[kind]}.`,
      en: `The Bank, at the request of the applicant, issues in favour of the beneficiary an autonomous, irrevocable on-demand guarantee up to the amount stated, ${kind === 'provisoria' ? 'securing the bid' : kind === 'definitiva' ? 'securing performance of the contract' : 'securing repayment of the advance'}.`,
    },
    {
      id: 'pagamento',
      text:
        kind === 'provisoria'
          ? `O Banco obriga-se a pagar ao Beneficiário, ${prazo} a contar da recepção do seu primeiro pedido escrito, qualquer quantia até ao montante garantido, sem que o Beneficiário tenha de provar ou justificar o pedido e sem que o Banco possa invocar em seu benefício quaisquer meios de defesa relacionados com a proposta ou com as relações entre o Ordenante e o Beneficiário, bastando que o Beneficiário declare que o Ordenante:`
          : `O Banco obriga-se a pagar ao Beneficiário, ${prazo} a contar da recepção do seu primeiro pedido escrito, qualquer quantia até ao montante garantido, sem que o Beneficiário tenha de provar ou justificar o pedido e sem que o Banco possa invocar em seu benefício quaisquer meios de defesa relacionados com o contrato ou com as relações entre o Ordenante e o Beneficiário.`,
      items: casos[kind].length ? casos[kind] : undefined,
      en: 'The Bank pays any amount up to the guaranteed sum within the stated time after the first written demand, without proof or justification and without raising defences arising from the underlying relationship.',
    },
  ];
  if (kind === 'adiantamento') {
    items.push({
      id: 'reducao',
      text: 'O montante garantido é reduzido automaticamente à medida que o adiantamento for sendo descontado nos pagamentos feitos ao Ordenante, mediante declaração escrita do Beneficiário que indique o valor já recuperado.',
      en: 'The guaranteed amount reduces as the advance is recovered from payments, on the beneficiary’s written statement of the amount recovered.',
    });
  }
  items.push(
    {
      id: 'validade',
      text: `A presente garantia entra em vigor na data da sua emissão e é válida ${validade}${kind === 'provisoria' ? ', mantendo-se em vigor durante as prorrogações do prazo de validade da proposta aceites pelo Ordenante, desde que comunicadas ao Banco antes daquela data' : ''}. ${v.validade || kind === 'provisoria' ? 'Findo esse prazo, ou com a devolução do original ao Banco, ou com declaração escrita do Beneficiário que a liberte, a garantia caduca.' : 'A garantia caduca com a devolução do original ao Banco ou com declaração escrita do Beneficiário que a liberte.'}`,
      en: 'The guarantee is effective from issue and valid until the stated date; it lapses on expiry, on return of the original or on the beneficiary’s written release.',
    },
    {
      id: 'lei',
      text: `A presente garantia rege-se pela lei moçambicana. Para dirimir qualquer litígio é competente o ${semPonto(v.foro) || 'tribunal judicial competente'}.`,
      en: 'Mozambican law applies; disputes go to the stated court.',
    },
  );

  const ref = str(v.garantiaNumero);
  const corpo: Block[] = [];
  for (const it of items) {
    corpo.push({ type: 'paragraph', id: it.id, text: it.text, en: it.en });
    if (it.items) corpo.push({ type: 'list', style: 'alpha', items: it.items });
  }
  return [
    { type: 'title', text: GARANTIA_TITULO[kind], subtitle: `${ref ? `N.º ${ref} — ` : ''}${procedimentoNome(v)}` },
    ...corpo,
    { type: 'paragraph', id: 'local', text: `${ctx.place}, ${dateLong(v.data)}.`, align: 'left', keepWithNext: true, en: 'Place and date.' },
    {
      type: 'signatures',
      columns: [
        { role: 'Pelo Banco', name: undefined, detail: 'Assinaturas e carimbo' },
        { role: 'Pelo Banco', name: undefined, detail: 'Assinaturas e carimbo' },
      ],
    },
    { type: 'note', text: 'Minuta a emitir pelo banco garante, em papel timbrado do banco.', en: 'Draft to be issued by the guarantor bank on its letterhead.' },
  ];
}

const UNIDADES = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezasseis', 'dezassete', 'dezoito', 'dezanove', 'vinte'];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta'];
function numberWord(n: number): string {
  if (n <= 20) return UNIDADES[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  return u ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d];
}

/** "15 (quinze) dias" for small numbers typed by the user; a blank when missing. */
export function diasTexto(x: unknown, uteis = false): string {
  const n = Number(x);
  const u = uteis ? ' úteis' : '';
  if (!Number.isFinite(n) || n <= 0 || x === '' || x == null) return `${BLANK} dias${u}`;
  if (n === 1) return `1 (um) dia${uteis ? ' útil' : ''}`;
  return n <= 60 && Number.isInteger(n) ? `${n} (${numberWord(n)}) dias${u}` : `${n} dias${u}`;
}


/** Item columns for goods (lines field). */
export function itensField(section: string, opts: { preco?: boolean; especificacao?: boolean; marca?: boolean; label?: ReturnType<typeof l> } = {}): FieldDef {
  const columns: FieldDef[] = [{ name: 'descricao', type: 'text', label: l('Descrição', 'Description') }];
  if (opts.especificacao) columns.push({ name: 'especificacao', type: 'text', label: l('Especificação técnica', 'Technical specification') });
  if (opts.marca) columns.push({ name: 'especificacao', type: 'text', label: l('Marca / modelo / origem (opcional)', 'Brand / model / origin (optional)') });
  columns.push(
    { name: 'unidade', type: 'text', label: l('Unidade', 'Unit'), placeholder: l('Ex.: resma, caixa, un.', 'E.g. ream, box, unit') },
    { name: 'quantidade', type: 'number', label: l('Quantidade', 'Quantity') },
  );
  if (opts.preco) columns.push({ name: 'preco', type: 'money', label: l('Preço unitário', 'Unit price') });
  return {
    name: 'itens',
    type: 'lines',
    section,
    label: opts.label ?? l('Bens', 'Goods'),
    addLabel: l('Adicionar linha', 'Add line'),
    columns,
    default: [],
  };
}

// ---------------------------------------------------------------- Public contract (goods / services)

export type ContratoKind = 'bens' | 'servicos';

export function contratoFields(kind: ContratoKind): FieldDef[] {
  const bens = kind === 'bens';
  return [
    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local de assinatura', 'Place of signing'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data de assinatura', 'Signing date'), default: (c) => c.today },
    { name: 'contratoNumero', type: 'text', section: 'documento', width: 'half', label: l('Contrato n.º', 'Contract no.'), placeholder: l('Ex.: 07/UGEA/DPS-NPL/2026', 'E.g. 07/UGEA/DPS-NPL/2026') },

    {
      name: 'entidadeNome',
      type: 'text',
      section: 'entidade',
      required: true,
      label: l('Entidade contratante', 'Contracting body'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.firma || c.profile.nomeComercial || '' : ''),
    },
    { name: 'entidadeNuit', type: 'text', section: 'entidade', width: 'half', label: l('NUIT (opcional)', 'Tax number (optional)'), default: (c) => c.profile?.nuit ?? '' },
    { name: 'entidadeSede', type: 'text', section: 'entidade', width: 'half', label: l('Sede', 'Address'), default: (c) => [c.profile?.morada?.rua, c.profile?.morada?.numero, c.profile?.morada?.cidade].filter(Boolean).join(', ') },
    {
      name: 'signatarioCargo',
      type: 'text',
      section: 'entidade',
      width: 'half',
      required: true,
      label: l('Cargo de quem assina pela entidade', 'Signatory’s position'),
      placeholder: l('Ex.: Director Provincial', 'E.g. Provincial Director'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteCargo ?? '' : ''),
    },
    { name: 'signatarioGenero', type: 'radio', section: 'entidade', width: 'half', label: l('Tratamento', 'Form of address'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }], default: 'M' },
    { name: 'signatarioNome', type: 'text', section: 'entidade', width: 'half', label: l('Nome de quem assina', 'Signatory’s name'), default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteNome ?? '' : '') },
    {
      name: 'signatarioPoderes',
      type: 'text',
      section: 'entidade',
      label: l('Fonte dos poderes (opcional)', 'Source of authority (optional)'),
      placeholder: l('Ex.: no uso das competências delegadas pelo Despacho n.º 4/GG/2026', 'E.g. under powers delegated by Order 4/GG/2026'),
    },

    ...partyFields('contratado', { tipoDefault: 'empresa' }),
    { name: 'contratadoAlvara', type: 'text', section: 'contratado', width: 'half', label: l('Cadastro Único / alvará n.º (opcional)', 'Single register / licence no. (optional)') },

    ...procedimentoFields('procedimento', { lote: true }),
    { name: 'dataAdjudicacao', type: 'date', section: 'procedimento', width: 'half', label: l('Data do despacho de adjudicação', 'Date of the award decision') },
    { name: 'autoridadeAdjudicacao', type: 'text', section: 'procedimento', width: 'half', label: l('Quem adjudicou', 'Awarding authority'), placeholder: l('Ex.: Director Provincial de Saúde', 'E.g. Provincial Director of Health') },

    ...(bens
      ? [itensField('objecto', { preco: true, especificacao: true, label: l('Bens, quantidades e preços (Anexo I)', 'Goods, quantities and prices (Annex I)') })]
      : [
          {
            name: 'servicosDescricao',
            type: 'textarea',
            section: 'objecto',
            rows: 4,
            label: l('Serviços e produtos a entregar', 'Services and deliverables'),
            help: l('Um item por linha. O detalhe fica nos termos de referência, que fazem parte do contrato.', 'One item per line. The detail is in the terms of reference, which form part of the contract.'),
          } satisfies FieldDef,
        ]),
    { name: 'valor', type: 'money', section: 'objecto', width: 'half', label: l('Preço do contrato', 'Contract price'), help: l(bens ? 'Se deixar em branco, usa-se o total do Anexo I.' : 'Valor total adjudicado.', bens ? 'If blank, the Annex I total is used.' : 'Total awarded value.') },
    { name: 'ivaModo', type: 'select', section: 'objecto', width: 'half', label: l('IVA', 'VAT'), options: IVA_OPTIONS, default: 'incluido' },

    { name: 'localExecucao', type: 'text', section: 'prazo', label: l(bens ? 'Local de entrega' : 'Local de prestação', bens ? 'Delivery place' : 'Place of performance'), placeholder: l('Ex.: Armazém Provincial de Medicamentos, Bairro de Namutequeliua, Nampula', 'E.g. Provincial Medical Store, Nampula') },
    {
      name: 'prazoExecucao',
      type: 'text',
      section: 'prazo',
      required: true,
      label: l(bens ? 'Prazo de entrega' : 'Prazo de execução', bens ? 'Delivery period' : 'Performance period'),
      placeholder: l('Ex.: trinta dias contados da assinatura do contrato', 'E.g. thirty days from signing'),
    },
    ...(bens
      ? [
          { name: 'prazoSubstituicao', type: 'number', section: 'prazo', width: 'half', min: 1, max: 90, label: l('Prazo para substituir bens rejeitados (dias)', 'Days to replace rejected goods') } satisfies FieldDef,
          { name: 'garantiaTecnicaMeses', type: 'number', section: 'prazo', width: 'half', min: 0, max: 120, label: l('Garantia técnica dos bens (meses)', 'Goods warranty (months)'), help: l('Zero para bens consumíveis sem garantia.', 'Zero for consumables without warranty.') } satisfies FieldDef,
        ]
      : [{ name: 'gestorContrato', type: 'text', section: 'prazo', width: 'half', label: l('Gestor do contrato (opcional)', 'Contract manager (optional)'), placeholder: l('Ex.: Chefe do Departamento de Planificação', 'E.g. Head of Planning') } satisfies FieldDef]),

    { name: 'prazoPagamentoDias', type: 'number', section: 'pagamento', width: 'half', min: 1, max: 120, label: l('Pagamento: prazo após a factura (dias)', 'Payment: days after invoice') },
    { name: 'nibContratado', type: 'text', section: 'pagamento', width: 'half', label: l('NIB do contratado', 'Contractor’s account (NIB)') },
    {
      name: 'tranches',
      type: 'lines',
      section: 'pagamento',
      label: l('Pagamento em prestações (opcional)', 'Payment in instalments (optional)'),
      addLabel: l('Adicionar prestação', 'Add instalment'),
      columns: [
        { name: 'condicao', type: 'text', label: l('Condição (entrega, produto aprovado…)', 'Condition (delivery, deliverable approved…)') },
        { name: 'percentagem', type: 'number', label: l('Percentagem do preço', 'Share of price (%)') },
      ],
      default: [],
    },
    { name: 'adiantamento', type: 'toggle', section: 'pagamento', label: l('Há adiantamento contra garantia', 'Advance payment against a guarantee') },
    { name: 'adiantamentoPct', type: 'number', section: 'pagamento', width: 'half', min: 1, max: 100, label: l('Adiantamento (% do preço)', 'Advance (% of price)'), showIf: (v) => Boolean(v.adiantamento) },
    { name: 'rubrica', type: 'text', section: 'pagamento', label: l('Dotação orçamental (rubrica e ano)', 'Budget line (code and year)'), placeholder: l('Ex.: rubrica 121000 — Bens, Orçamento do Estado de 2026', 'E.g. line 121000 — Goods, 2026 State Budget') },

    {
      name: 'garantiaDefinitiva',
      type: 'radio',
      section: 'garantias',
      label: l('Garantia definitiva', 'Performance security'),
      options: [
        { value: 'prestada', label: l('Prestada', 'Provided') },
        { value: 'dispensada', label: l('Não exigida no documento de concurso', 'Not required by the tender') },
      ],
      default: 'prestada',
    },
    { name: 'garantiaValor', type: 'money', section: 'garantias', width: 'half', label: l('Valor da garantia definitiva', 'Performance security amount'), showIf: (v) => v.garantiaDefinitiva !== 'dispensada' },
    {
      name: 'garantiaForma',
      type: 'select',
      section: 'garantias',
      width: 'half',
      label: l('Forma', 'Form'),
      options: [
        { value: 'garantia bancária', label: l('Garantia bancária', 'Bank guarantee') },
        { value: 'seguro-caução', label: l('Seguro-caução', 'Surety insurance') },
        { value: 'depósito em dinheiro', label: l('Depósito em dinheiro', 'Cash deposit') },
      ],
      default: 'garantia bancária',
      showIf: (v) => v.garantiaDefinitiva !== 'dispensada',
    },
    { name: 'multaPermilagem', type: 'number', section: 'garantias', width: 'half', min: 0, max: 10, label: l('Multa por dia de atraso (‰ do valor em atraso)', 'Daily delay penalty (‰ of late value)') },
    { name: 'multaMaxPct', type: 'number', section: 'garantias', width: 'half', min: 0, max: 100, label: l('Limite das multas (% do preço)', 'Penalty cap (% of price)') },
    {
      name: 'litigios',
      type: 'radio',
      section: 'garantias',
      label: l('Litígios', 'Disputes'),
      options: [
        { value: 'tribunal', label: l('Tribunal administrativo competente', 'Competent administrative court') },
        { value: 'arbitragem', label: l('Arbitragem', 'Arbitration') },
      ],
      default: 'tribunal',
    },
    {
      name: 'visto',
      type: 'toggle',
      section: 'garantias',
      default: true,
      label: l('Sujeito a visto do Tribunal Administrativo', 'Subject to Administrative Court clearance'),
      help: l('Os contratos de valor igual ou superior ao limite fixado anualmente só produzem efeitos financeiros depois do visto.', 'Contracts at or above the yearly threshold have financial effect only after clearance.'),
    },
    { name: 'testemunhas', type: 'toggle', section: 'garantias', label: l('Incluir assinatura de duas testemunhas', 'Include two witnesses') },
  ];
}

export function contratoComputed(v: Values, ctx: { legal: TemplateContext['legal'] }) {
  const list = items(v);
  const taxa = ctx.legal.value<number>('ivaTaxaNormal');
  const t = totais(list, v.ivaModo, taxa);
  const valor = money(v.valor) ?? t.total;
  return { list, ...t, valor, taxa };
}

export function contratoWarnings(v: Values, ctx: TemplateContext, kind: ContratoKind): Warning[] {
  const c = ctx.computed;
  const w: Warning[] = [...entidadeProfileWarning(ctx), ...partyWarnings(v, 'contratado', 'contratado', 'contractor')];
  if (c.valor == null) w.push({ level: 'error', field: 'valor', message: l('Indique o preço do contrato (ou preencha os bens com preços).', 'Enter the contract price (or fill in the goods with prices).') });
  if (kind === 'bens' && money(v.valor) != null && c.total != null && Math.abs(money(v.valor)! - c.total) > 1) {
    w.push({ level: 'warning', field: 'valor', message: l(`O preço indicado difere do total do Anexo I (${formatMoney(c.total)}).`, `The price differs from the Annex I total (${formatMoney(c.total)}).`) });
  }
  if (!str(v.rubrica)) w.push({ level: 'warning', field: 'rubrica', message: l(`Indique a dotação orçamental que suporta a despesa (${cite('ctCabimento')}).`, 'State the budget line covering the expense.') });
  if (v.garantiaDefinitiva !== 'dispensada' && money(v.garantiaValor) == null) {
    w.push({ level: 'warning', field: 'garantiaValor', message: l(`Indique o valor da garantia definitiva prestada antes da assinatura (${cite('ctGarantiaDefinitiva')}).`, 'Enter the performance security lodged before signing.') });
  }
  if (!str(v.nibContratado)) w.push({ level: 'info', field: 'nibContratado', message: l('Indique o NIB do contratado para os pagamentos.', 'Enter the contractor’s bank account for payments.') });
  const soma = lineItems(v.tranches).reduce((s, r) => s + (Number(r.percentagem) || 0), 0);
  if (lineItems(v.tranches).length && Math.abs(soma - 100) > 0.01) {
    w.push({ level: 'warning', field: 'tranches', message: l(`As prestações somam ${formatNumber(soma, 2)}% do preço; devem somar cem por cento.`, `Instalments add up to ${soma}% of the price; they must add up to one hundred per cent.`) });
  }
  if (v.visto) {
    w.push({
      level: 'info',
      field: 'visto',
      message: l(
        `Remeta o contrato ao Tribunal Administrativo para fiscalização prévia antes de qualquer pagamento (${cite('ctVistoTribunal')}). O contrato é feito em três exemplares: um para cada parte e um para o Tribunal.`,
        'Send the contract to the Administrative Court for prior review before any payment. Three originals: one per party and one for the Court.',
      ),
    });
  }
  w.push({
    level: 'info',
    message: l(
      `O contrato tem de respeitar o documento de concurso e a proposta adjudicada (${cite('ctContratoClausulas')}). Se o documento de concurso trouxer minuta de contrato, use essa minuta.`,
      'The contract must follow the tender document and the awarded bid. If the tender document includes a draft contract, use that draft.',
    ),
  });
  return w;
}

const IVA_TEXTO: Record<string, string> = {
  incluido: 'com IVA incluído',
  acrescer: 'acrescido do IVA à taxa legal em vigor',
  isento: 'isento de IVA',
};

export function contratoBlocks(ctx: TemplateContext, kind: ContratoKind): Block[] {
  const v = ctx.values;
  const c = ctx.computed;
  const bens = kind === 'bens';
  const E = { n: 'Entidade Contratante', f: true, o: 'a Entidade Contratante', O: 'A Entidade Contratante', de: 'da Entidade Contratante', ao: 'à Entidade Contratante', pelo: 'pela Entidade Contratante' };
  const C = papel(v, 'contratado', 'Contratado', 'Contratada');
  const entidade = str(v.entidadeNome) || BLANK;
  const sigF = v.signatarioGenero === 'F';
  const rep = `${str(v.signatarioNome) || BLANK}, na qualidade de ${str(v.signatarioCargo) || BLANK}${str(v.signatarioPoderes) ? `, ${semPonto(v.signatarioPoderes)}` : ''}, com poderes para o acto`;
  const parteE = `**${entidade}**${str(v.entidadeNuit) ? `, NUIT ${str(v.entidadeNuit)}` : ''}${str(v.entidadeSede) ? `, com sede em ${semPonto(v.entidadeSede)}` : ''}, neste acto ${sigF ? 'representada' : 'representada'} por ${rep}, adiante designada por **Entidade Contratante**`;
  const parteC = `${identificacao(v, 'contratado')}${str(v.contratadoAlvara) ? `, inscrit${isEmpresa(v, 'contratado') || C.f ? 'a' : 'o'} no Cadastro Único sob o n.º ${semPonto(v.contratadoAlvara)}` : ''}, adiante ${isEmpresa(v, 'contratado') || C.f ? 'designada' : 'designado'} por **${C.n}**`;
  const adj = v.dataAdjudicacao ? `, adjudicado por despacho${str(v.autoridadeAdjudicacao) ? ` ${/^(do|da)\s/i.test(str(v.autoridadeAdjudicacao)) ? '' : 'do '}${semPonto(v.autoridadeAdjudicacao)}` : ''} de ${dateLong(v.dataAdjudicacao)}` : '';
  const servicos = str(v.servicosDescricao)
    .split(/\n+/)
    .map((s) => s.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);

  const clauses: ClauseItem[] = [];
  clauses.push({
    id: 'objecto',
    heading: 'Objecto',
    text: bens
      ? `Pelo presente contrato, ${C.o} obriga-se a fornecer ${E.ao} ${objectoTexto(v)}, nas quantidades, com as especificações e pelos preços constantes do Anexo I, que faz parte integrante do contrato, na sequência do ${procedimentoNome(v)}${adj}.`
      : `Pelo presente contrato, ${C.o} obriga-se a prestar ${E.ao} os serviços de ${objectoTexto(v).replace(/^(a )?prestação de serviços de /i, '')}, nos termos dos termos de referência e da proposta adjudicada, na sequência do ${procedimentoNome(v)}${adj}.`,
    items: !bens && servicos.length ? servicos.map((s) => s.replace(/[.;]$/, '') + ';') : undefined,
    en: `The contractor ${bens ? 'supplies the goods in Annex I' : 'provides the services under the terms of reference'}, following the procurement procedure and award.`,
  });
  clauses.push({
    id: 'documentos',
    heading: 'Documentos contratuais',
    text: 'Fazem parte integrante do presente contrato, prevalecendo pela ordem indicada em caso de divergência:',
    items: [
      'o presente contrato e os seus anexos;',
      'os esclarecimentos e aditamentos ao documento de concurso;',
      bens ? 'o documento de concurso, incluindo o caderno de encargos e as especificações técnicas;' : 'o documento de concurso, incluindo os termos de referência;',
      `a proposta ${C.de}, na parte aceite pela Entidade Contratante.`,
    ],
    en: 'The contract, clarifications, tender document and the contractor’s bid form part of the contract, in that order of precedence.',
  });
  clauses.push({
    id: 'preco',
    heading: 'Preço',
    text: numerar([
      `O preço do contrato é de ${valorTexto(c.valor)}, ${IVA_TEXTO[str(v.ivaModo)] ?? IVA_TEXTO.incluido}.`,
      `O preço inclui todos os encargos ${bens ? 'com o fornecimento, nomeadamente embalagem, transporte, seguro, descarga e montagem, quando aplicável' : 'com a prestação dos serviços, nomeadamente honorários, deslocações e despesas'}, e é fixo, não sendo revisto salvo nos casos previstos na lei e no documento de concurso.`,
    ]),
    en: 'Fixed contract price, including all costs, VAT as stated.',
  });
  clauses.push({
    id: 'dotacao',
    heading: 'Encargo orçamental',
    text: `A despesa emergente do presente contrato é suportada pela dotação inscrita ${str(v.rubrica) ? `na ${semPonto(v.rubrica).replace(/^(na|a)\s+/i, '')}` : `na rubrica ${BLANK}`} do orçamento ${daEntidade(entidade)}.`,
    en: 'The expense is covered by the stated budget line.',
  });
  clauses.push({
    id: 'prazo',
    heading: bens ? 'Prazo e local de entrega' : 'Prazo e local de execução',
    text: bens
      ? `${C.O} entrega os bens em ${semPonto(v.localExecucao) || BLANK}, no prazo de ${semPonto(v.prazoExecucao) || BLANK}, por sua conta e risco até à recepção, devidamente embalados e identificados, acompanhados da guia de remessa e da factura.`
      : `Os serviços são prestados em ${semPonto(v.localExecucao) || BLANK}, no prazo de ${semPonto(v.prazoExecucao) || BLANK}, de acordo com o plano de trabalho constante da proposta.`,
    en: `${bens ? 'Delivery' : 'Performance'} at the stated place within the stated period.`,
  });
  clauses.push({
    id: 'garantia',
    heading: 'Garantia definitiva',
    text:
      v.garantiaDefinitiva === 'dispensada'
        ? 'Nos termos do documento de concurso, não é exigida garantia definitiva.'
        : numerar([
            `Para garantia do exacto e pontual cumprimento das suas obrigações, ${C.o} prestou garantia definitiva no valor de ${valorTexto(money(v.garantiaValor))}, sob a forma de ${str(v.garantiaForma) || 'garantia bancária'}.`,
            `A Entidade Contratante pode executar a garantia em caso de incumprimento ${C.de}, sem necessidade de decisão judicial. A garantia é libertada ${bens ? 'depois da recepção dos bens e do termo do prazo de garantia técnica' : 'depois da aceitação final dos serviços'}, verificado o cumprimento de todas as obrigações.`,
          ]),
    en: v.garantiaDefinitiva === 'dispensada' ? 'No performance security is required.' : 'The contractor provided the performance security, which may be called on breach and is released after completion.',
  });
  const nib = str(v.nibContratado) ? ` para a conta com o NIB ${str(v.nibContratado)}, titulada ${C.pelo}` : ` para a conta bancária indicada ${C.pelo}`;
  const tr = lineItems(v.tranches).filter((r) => str(r.condicao) || r.percentagem);
  clauses.push({
    id: 'pagamento',
    heading: 'Condições de pagamento',
    text: numerar([
      v.adiantamento ? `A Entidade Contratante paga um adiantamento de ${str(v.adiantamentoPct) ? `${String(v.adiantamentoPct).replace('.', ',')}%` : `${BLANK}%`} do preço, contra a apresentação de garantia bancária de adiantamento de igual valor; o adiantamento é descontado proporcionalmente em cada pagamento.` : '',
      tr.length
        ? `O preço é pago nas seguintes prestações: ${tr.map((r, i) => `${String.fromCharCode(97 + i)}) ${r.percentagem ? `${String(r.percentagem).replace('.', ',')}%` : `${BLANK}%`} ${str(r.condicao) ? `— ${semPonto(r.condicao)}` : ''}`).join('; ')}.`
        : bens
          ? 'O preço é pago depois da recepção dos bens, comprovada pelo auto de recepção.'
          : 'O preço é pago depois da aceitação dos serviços ou produtos pela Entidade Contratante.',
      `Os pagamentos são feitos por transferência bancária${nib}, no prazo de ${diasTexto(v.prazoPagamentoDias)} contados da recepção da factura${bens ? ', acompanhada do auto de recepção' : ', acompanhada do relatório ou produto aprovado'}.`,
    ]),
    en: 'Payment by bank transfer within the stated days after the invoice, on acceptance; any advance is secured by a guarantee and recovered from payments.',
  });
  if (bens) {
    clauses.push({
      id: 'recepcao',
      heading: 'Inspecção e recepção',
      text: numerar([
        'Os bens são inspeccionados no acto da entrega por uma comissão de recepção designada pela Entidade Contratante, que verifica a quantidade, a qualidade e a conformidade com as especificações técnicas e lavra o respectivo auto de recepção.',
        `Os bens desconformes ou danificados são rejeitados e substituídos por ${C.o}, à sua custa, no prazo de ${diasTexto(v.prazoSubstituicao)} contados da comunicação da rejeição.`,
      ]),
      en: 'Goods are inspected on delivery by an acceptance committee; rejected goods are replaced at the contractor’s cost.',
    });
    const meses = Number(v.garantiaTecnicaMeses);
    if (Number.isFinite(meses) && meses > 0) {
      clauses.push({
        id: 'garantiaTecnica',
        heading: 'Garantia técnica',
        text: `${C.O} garante os bens contra defeitos de fabrico, de materiais ou de funcionamento durante ${meses} ${meses === 1 ? 'mês' : 'meses'} contados da recepção, obrigando-se a repará-los ou substituí-los, sem custos para a Entidade Contratante, no prazo que esta fixar.`,
        en: `Warranty against defects for ${meses} months from acceptance; repair or replacement at no cost.`,
      });
    }
  } else {
    clauses.push({
      id: 'acompanhamento',
      heading: 'Acompanhamento e aceitação',
      text: numerar([
        `A Entidade Contratante acompanha a execução do contrato através ${str(v.gestorContrato) ? `do ${semPonto(v.gestorContrato).replace(/^(o|do)\s+/i, '')}` : 'de um gestor do contrato que designa'}, a quem ${C.o} reporta e entrega os relatórios e produtos previstos.`,
        'Os produtos são aprovados ou devolvidos com observações por escrito; os produtos devolvidos são corrigidos sem custos adicionais.',
      ]),
      en: 'A contract manager follows performance; deliverables are approved or returned with comments and corrected at no extra cost.',
    });
    clauses.push({
      id: 'pessoal',
      heading: 'Pessoal, confidencialidade e propriedade',
      text: numerar([
        `${C.O} executa os serviços com o pessoal indicado na proposta, que só pode ser substituído por pessoal de qualificação igual ou superior, com o acordo prévio da Entidade Contratante.`,
        `${C.O} guarda sigilo sobre a informação a que tenha acesso e não a utiliza para fins alheios ao contrato.`,
        'Os relatórios, estudos e demais produtos elaborados ao abrigo do contrato são propriedade da Entidade Contratante.',
      ]),
      en: 'Key staff as in the bid, replaced only with consent; confidentiality; deliverables belong to the contracting body.',
    });
  }
  const perm = str(v.multaPermilagem);
  const cap = str(v.multaMaxPct);
  clauses.push({
    id: 'multas',
    heading: 'Multas',
    text: numerar([
      `Pelo atraso no cumprimento dos prazos contratuais, por facto que lhe seja imputável, ${C.o} paga uma multa diária de ${perm ? `${perm.replace('.', ',')}‰` : `${BLANK}‰`} do valor ${bens ? 'dos bens' : 'dos serviços'} em atraso, até ao limite de ${cap ? `${cap.replace('.', ',')}%` : `${BLANK}%`} do preço do contrato.`,
      'As multas são descontadas nos pagamentos devidos ou cobradas pela garantia definitiva. Atingido o limite, a Entidade Contratante pode rescindir o contrato.',
    ]),
    en: 'Daily delay penalty at the stated rate up to the cap; deducted from payments or the security; termination when the cap is reached.',
  });
  clauses.push({
    id: 'forcaMaior',
    heading: 'Força maior',
    text: numerar([
      'Nenhuma das partes responde pelo incumprimento causado por facto de força maior, entendido como acontecimento imprevisível e irresistível, alheio à sua vontade, tal como calamidade natural, guerra, epidemia ou acto de autoridade.',
      'A parte afectada comunica o facto à outra por escrito logo que dele tenha conhecimento, e os prazos afectados são prorrogados pelo período do impedimento.',
    ]),
    en: 'No liability for force majeure; prompt written notice; affected deadlines extended.',
  });
  clauses.push({
    id: 'rescisao',
    heading: 'Rescisão',
    text: 'A Entidade Contratante pode rescindir o contrato, por comunicação escrita fundamentada e com audição prévia do contratado, nomeadamente nos seguintes casos:',
    items: [
      'incumprimento grave ou reiterado das obrigações contratuais;',
      'atingido o limite das multas;',
      `insolvência ou cessação da actividade ${C.de};`,
      'prestação de falsas declarações ou prática de actos de corrupção, fraude ou conluio no procedimento ou na execução do contrato;',
      'cessão da posição contratual ou subcontratação sem autorização.',
    ],
    en: 'The contracting body may terminate, with reasons and after hearing the contractor, for serious breach, penalty cap, insolvency, fraud or corruption, or unauthorised assignment.',
  });
  clauses.push({
    id: 'cessao',
    heading: 'Cessão e subcontratação',
    text: `${C.O} não pode ceder a sua posição contratual nem subcontratar a execução, no todo ou em parte, sem autorização prévia e escrita da Entidade Contratante, mantendo-se, em qualquer caso, responsável pelo cumprimento integral do contrato.`,
    en: 'No assignment or subcontracting without prior written consent; the contractor remains fully liable.',
  });
  clauses.push({
    id: 'integridade',
    heading: 'Integridade',
    text: `As partes obrigam-se a não oferecer, dar, solicitar ou aceitar, directamente ou por interposta pessoa, qualquer pagamento, presente ou vantagem indevida relacionada com o presente contrato. A violação desta obrigação é fundamento de rescisão e é comunicada às autoridades competentes (${cite('ctCorrupcao')}).`,
    en: 'No bribes or undue advantages; breach is grounds for termination and is reported to the authorities.',
  });
  clauses.push({
    id: 'comunicacoes',
    heading: 'Comunicações',
    text: 'As comunicações entre as partes são feitas por escrito, entregues contra recibo ou enviadas por correio electrónico com confirmação de recepção, para os endereços constantes do presente contrato.',
    en: 'Notices in writing, by hand against receipt or e-mail with confirmation.',
  });
  clauses.push({
    id: 'litigios',
    heading: 'Lei aplicável e litígios',
    text: numerar([
      'O presente contrato rege-se pela lei moçambicana, designadamente pelo regulamento de contratação de empreitada de obras públicas, fornecimento de bens e prestação de serviços ao Estado.',
      'As partes procuram resolver por acordo as divergências sobre a interpretação ou a execução do contrato.',
      v.litigios === 'arbitragem'
        ? 'Não sendo possível o acordo, o litígio é resolvido por arbitragem, nos termos da legislação moçambicana sobre arbitragem, com sede em Maputo.'
        : 'Não sendo possível o acordo, o litígio é submetido ao tribunal administrativo competente.',
    ]),
    en: `Mozambican law and the procurement regulation apply; amicable settlement first, then ${v.litigios === 'arbitragem' ? 'arbitration' : 'the competent administrative court'}.`,
  });
  clauses.push({
    id: 'vigencia',
    heading: 'Entrada em vigor',
    text: v.visto
      ? 'O presente contrato entra em vigor na data da sua assinatura, produzindo efeitos financeiros depois da concessão do visto do Tribunal Administrativo.'
      : 'O presente contrato entra em vigor na data da sua assinatura e vigora até ao cumprimento integral das obrigações das partes.',
    en: v.visto ? 'In force on signature; financial effect after Administrative Court clearance.' : 'In force on signature until fully performed.',
  });

  const sigE: SignatureColumn = {
    role: 'Pela Entidade Contratante',
    name: str(v.signatarioNome) || undefined,
    detail: str(v.signatarioCargo) || undefined,
    image: 'both',
  };
  const sigC = { ...assinatura(ctx, 'contratado', C), role: `Pel${C.f || isEmpresa(v, 'contratado') ? 'a' : 'o'} ${C.n}` };
  if (!isEmpresa(v, 'contratado')) sigC.role = `${C.O}`;

  const titulo = bens ? 'Contrato de Fornecimento de Bens' : 'Contrato de Prestação de Serviços';
  const blocks: Block[] = [
    { type: 'title', text: titulo, subtitle: `${str(v.contratoNumero) ? `Contrato n.º ${semPonto(v.contratoNumero)} — ` : ''}${procedimentoNome(v)}` },
    { type: 'paragraph', id: 'parte_entidade', text: `Entre:\n${parteE};`, en: 'Between the contracting body, identified above;' },
    { type: 'paragraph', id: 'parte_contratado', text: `e\n${parteC},`, en: 'and the contractor, identified above,' },
    {
      type: 'paragraph',
      id: 'celebracao',
      text: `é celebrado o presente contrato ${bens ? 'de fornecimento de bens' : 'de prestação de serviços'}, que se rege pelas cláusulas seguintes, pelo documento de concurso e pela legislação aplicável:`,
      en: 'this contract is entered into on the following terms, the tender document and the applicable law:',
    },
    { type: 'numberedClauses', style: 'clausula', items: clauses },
  ];
  const n = v.visto ? 3 : 2;
  const ex = ['', 'um', 'dois', 'três'][n];
  blocks.push(
    {
      type: 'paragraph',
      id: 'feito',
      text: `Feito em ${ctx.place}, aos ${dateLong(v.data)}, em ${ex} exemplares de igual teor e valor, ficando um em poder de cada uma das partes${v.visto ? ' e destinando-se o terceiro ao Tribunal Administrativo' : ''}.`,
      keepWithNext: true,
      en: `Made in ${n} originals${v.visto ? ', one for the Administrative Court' : ''}.`,
    },
    { type: 'signatures', columns: [sigE, sigC], keepWithNext: Boolean(v.testemunhas) },
  );
  if (v.testemunhas) {
    blocks.push({ type: 'signatures', columns: [{ role: 'Testemunha', detail: `Nome e BI n.º: ${BLANK}` }, { role: 'Testemunha', detail: `Nome e BI n.º: ${BLANK}` }] });
  }
  if (bens && c.list.length) {
    blocks.push(
      { type: 'pageBreakHint' },
      { type: 'title', text: 'Anexo I — Bens, quantidades e preços' },
      priceTable(c.list, c, str(v.ivaModo), true),
    );
  }
  return blocks;
}

/** Price table: N.º, description (with specification), unit, quantity, unit price, total; subtotal, VAT and total rows. */
export function priceTable(list: Item[], t: { subtotal?: number | null; iva?: number | null; total?: number | null; taxa?: number }, ivaModo: string, spec = true): Block {
  const totals: string[][] = [];
  if (ivaModo === 'acrescer') {
    totals.push(['', 'Subtotal', '', '', '', mt(t.subtotal ?? null)]);
    totals.push(['', `IVA (${t.taxa != null ? formatNumber(t.taxa * 100, 0) : '__'}%)`, '', '', '', mt(t.iva ?? null)]);
  }
  totals.push(['', ivaModo === 'incluido' ? 'Total (IVA incluído), em MT' : ivaModo === 'isento' ? 'Total (isento de IVA), em MT' : 'Total, em MT', '', '', '', mt(t.total ?? null)]);
  return {
    type: 'table',
    columns: [
      { label: 'N.º', width: 0.4, align: 'right' },
      { label: 'Descrição', width: 4.4 },
      { label: 'Un.', width: 0.6, align: 'center' },
      { label: 'Qtd.', width: 0.65, align: 'right' },
      { label: 'Preço unit.', width: 1.15, align: 'right' },
      { label: 'Total', width: 1.3, align: 'right' },
    ],
    rows: list.map((i, n) => [String(n + 1), spec && i.especificacao ? `${i.descricao || BLANK} — ${i.especificacao}` : i.descricao || BLANK, i.unidade, qtd(i.quantidade), mt(i.preco), mt(i.total)]),
    totals,
  };
}

// ---------------------------------------------------------------- Bidder declarations

/** Fields shared by the bidder's declarations: place/date, contracting body, procedure, bidder. */
export function declaracaoBaseFields(): FieldDef[] {
  return [
    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', label: l('Data', 'Date'), default: (c) => c.today },
    { name: 'entidadeNome', type: 'text', section: 'procedimento', required: true, label: l('Entidade contratante', 'Contracting body'), placeholder: l('Ex.: Direcção Provincial de Saúde de Nampula', 'E.g. Nampula Provincial Health Directorate') },
    ...procedimentoFields(),
    ...concorrenteFields(),
  ];
}

export const DECLARACAO_SECTIONS = [
  { id: 'documento', title: l('Local e data', 'Place and date') },
  { id: 'procedimento', title: l('Concurso', 'Tender') },
  { id: 'concorrente', title: l('Concorrente (declarante)', 'Bidder (declarant)'), personRole: 'outro' as const },
];

/** "X, …, concorrente ao Concurso … lançado pela …, declara, sob compromisso de honra," */
export function declaranteAbertura(v: Values, verbo = 'declara, sob compromisso de honra,'): string {
  return `${concorrenteIdent(v)}, concorrente ao ${procedimentoCompleto(v)}, lançado ${daEntidade(str(v.entidadeNome))}, ${verbo}`;
}

/** Title + subtitle for a bidder's declaration. */
export function declaracaoTitulo(titulo: string, v: Values): Block {
  return { type: 'title', text: titulo, subtitle: procedimentoNome(v) };
}

export function declaracaoFecho(ctx: TemplateContext): Block[] {
  return [{ type: 'signatures', placeDate: `${ctx.place}, ${dateLong(ctx.values.data)}`, columns: [concorrenteSignature(ctx, 'O Declarante')] }];
}

// ---------------------------------------------------------------- Complaints and appeals

/** Adds working days (Monday to Friday) to an ISO date; public holidays are not counted out. */
export function addDiasUteis(iso: string, n: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m || !Number.isFinite(n)) return '';
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d.toISOString().slice(0, 10);
}

export type ImpugnacaoKind = 'reclamacao' | 'recurso';

const ACTO_OPTIONS = [
  { value: 'adjudicacao', label: l('Decisão de adjudicação', 'Award decision') },
  { value: 'desclassificacao', label: l('Desclassificação / exclusão da proposta', 'Disqualification of the bid') },
  { value: 'qualificacao', label: l('Decisão de qualificação', 'Qualification decision') },
  { value: 'documento', label: l('Documento de concurso (cláusula ilegal ou discriminatória)', 'Tender document (unlawful or discriminatory clause)') },
  { value: 'outro', label: l('Outro acto', 'Other act') },
];

const ACTO_TEXTO: Record<string, string> = {
  adjudicacao: 'da decisão de adjudicação',
  desclassificacao: 'da decisão de desclassificação da sua proposta',
  qualificacao: 'da decisão de qualificação dos concorrentes',
  documento: 'do documento de concurso',
  outro: 'do acto',
};

export function impugnacaoFields(kind: ImpugnacaoKind, destinatario: FieldDef[]): FieldDef[] {
  const rec = kind === 'recurso';
  return [
    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', label: l('Data', 'Date'), default: (c) => c.today },
    ...destinatario,
    { name: 'entidadeNome', type: 'text', section: 'procedimento', required: true, label: l('Entidade contratante', 'Contracting body') },
    ...procedimentoFields(),
    ...concorrenteFields(),
    { name: 'actoTipo', type: 'select', section: 'acto', label: l('Acto impugnado', 'Act challenged'), options: ACTO_OPTIONS, default: 'adjudicacao' },
    {
      name: 'actoDescricao',
      type: 'text',
      section: 'acto',
      label: l('Descrição do acto (opcional)', 'Description of the act (optional)'),
      placeholder: l('Ex.: que adjudicou o concurso à empresa Construtora Alfa, Lda, pelo valor de 2.900.000,00 MT', 'E.g. awarding the tender to Construtora Alfa, Lda'),
    },
    { name: 'actoData', type: 'date', section: 'acto', width: 'half', label: l('Data do acto', 'Date of the act') },
    {
      name: 'notificacaoData',
      type: 'date',
      section: 'acto',
      width: 'half',
      required: true,
      label: l(rec ? 'Notificação da decisão da reclamação' : 'Data em que foi notificado', rec ? 'Notified of the complaint decision on' : 'Date notified'),
      help: l('O prazo conta-se em dias úteis a partir desta data.', 'The time limit runs in working days from this date.'),
    },
    ...(rec
      ? ([
          { name: 'reclamacaoData', type: 'date', section: 'acto', width: 'half', label: l('Data da reclamação apresentada', 'Date of the complaint lodged') },
          { name: 'decisaoReclamacao', type: 'text', section: 'acto', label: l('Decisão sobre a reclamação', 'Decision on the complaint'), placeholder: l('Ex.: indeferiu a reclamação, mantendo a adjudicação', 'E.g. rejected the complaint, upholding the award') },
          { name: 'caucaoValor', type: 'money', section: 'acto', width: 'half', label: l('Caução prestada', 'Deposit paid') },
          { name: 'caucaoComprovativo', type: 'text', section: 'acto', width: 'half', label: l('Comprovativo da caução (n.º / data)', 'Deposit receipt (no. / date)') },
        ] satisfies FieldDef[])
      : []),
    {
      name: 'factos',
      type: 'textarea',
      section: 'fundamentos',
      rows: 6,
      required: true,
      label: l('Factos', 'Facts'),
      help: l('Um facto por linha, por ordem: o que aconteceu no procedimento, o que diz a proposta, o que a decisão afirma.', 'One fact per line, in order: what happened, what the bid says, what the decision states.'),
    },
    {
      name: 'direito',
      type: 'textarea',
      section: 'fundamentos',
      rows: 4,
      label: l('Fundamentos de direito', 'Legal grounds'),
      help: l('Uma razão por linha: a regra do regulamento ou do documento de concurso que foi violada e porquê (critério não previsto, erro na avaliação, falta de fundamentação…).', 'One ground per line: the rule breached and why (criterion not in the tender, evaluation error, no reasons given…).'),
    },
    { name: 'pedidoAnulacao', type: 'toggle', section: 'pedido', default: true, label: l('Pedir a anulação ou revogação do acto', 'Ask for the act to be annulled or revoked') },
    { name: 'pedidoReavaliacao', type: 'toggle', section: 'pedido', default: true, label: l('Pedir a readmissão / reavaliação da proposta', 'Ask for the bid to be readmitted / re-evaluated') },
    { name: 'pedidoAdjudicacao', type: 'toggle', section: 'pedido', label: l('Pedir a adjudicação ao reclamante', 'Ask for the award to the complainant') },
    { name: 'pedidoOutro', type: 'text', section: 'pedido', label: l('Outro pedido (opcional)', 'Other request (optional)') },
    {
      name: 'anexos',
      type: 'lines',
      section: 'pedido',
      label: l('Documentos juntos', 'Documents enclosed'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: rec
        ? [{ descricao: 'Cópia da reclamação apresentada' }, { descricao: 'Cópia da decisão sobre a reclamação' }, { descricao: 'Comprovativo da prestação da caução' }]
        : [{ descricao: 'Cópia da notificação recebida' }],
    },
  ];
}

export function impugnacaoWarnings(v: Values, ctx: TemplateContext, kind: ImpugnacaoKind): Warning[] {
  const rec = kind === 'recurso';
  const key = rec ? 'ctRecursoPrazo' : 'ctReclamacaoPrazo';
  const dias = ctx.legal.value<number>(key);
  const w: Warning[] = [...concorrenteWarnings(v)];
  if (!str(v.factos)) w.push({ level: 'error', field: 'factos', message: l('Descreva os factos.', 'Describe the facts.') });
  if (typeof v.notificacaoData === 'string' && v.notificacaoData) {
    const limite = addDiasUteis(v.notificacaoData, dias);
    const late = typeof v.data === 'string' && v.data > limite;
    w.push({
      level: late ? 'error' : 'warning',
      field: 'notificacaoData',
      message: l(
        `${rec ? 'O recurso hierárquico' : 'A reclamação'} deve ser entregue no prazo de ${dias} dias úteis contados da notificação, isto é, até ${dateLong(limite)} (sem contar feriados, que prolongam o prazo) (${cite(key)}).${late ? ' A data do documento já ultrapassa esse prazo.' : ''}`,
        `The ${rec ? 'appeal' : 'complaint'} must be lodged within ${dias} working days of notification, i.e. by ${limite} (public holidays extend it).${late ? ' The document date is already past that deadline.' : ''}`,
      ),
    });
  } else {
    w.push({ level: 'warning', field: 'notificacaoData', message: l(`Indique a data da notificação: o prazo é de ${dias} dias úteis (${cite(key)}).`, `Enter the notification date: the time limit is ${dias} working days.`) });
  }
  if (rec && money(v.caucaoValor) == null) {
    w.push({ level: 'warning', field: 'caucaoValor', message: l(`O recurso hierárquico exige a prestação da caução fixada no documento de concurso; junte o comprovativo (${cite('ctRecursoPrazo')}).`, 'The appeal requires the deposit set in the tender document; attach the receipt.') });
  }
  if (!rec) w.push({ level: 'info', message: l('A reclamação é dirigida à entidade contratante (autoridade competente que praticou o acto) e não paga taxa.', 'The complaint goes to the contracting body (the authority that issued the act) and is free.') });
  else w.push({ level: 'info', message: l('O recurso é dirigido ao superior hierárquico da autoridade competente (por exemplo, o Ministro ou o Governador) e entregue com cópia da reclamação e da decisão.', 'The appeal goes to the superior of the competent authority (e.g. the Minister or Governor), with copies of the complaint and decision.') });
  return w;
}

export function impugnacaoBlocks(ctx: TemplateContext, kind: ImpugnacaoKind, head: { recipient: Block; vocativo: string }): Block[] {
  const v = ctx.values;
  const rec = kind === 'recurso';
  const acto = ACTO_TEXTO[str(v.actoTipo)] ?? ACTO_TEXTO.outro;
  const desc = semPonto(v.actoDescricao);
  const actoTxt = `${acto}${desc ? `, ${desc.replace(/^(que|o qual|a qual)\s+/i, 'que ')}` : ''}${v.actoData ? `, de ${dateLong(v.actoData)}` : ''}`;
  const f = isEmpresa(v, 'concorrente') || v.concorrenteGenero === 'F';
  const notif = v.notificacaoData ? `, de que foi ${f ? 'notificada' : 'notificado'} em ${dateLong(v.notificacaoData)}` : '';
  const contra = actoTxt.replace(/^da\s/, 'contra a ').replace(/^do\s/, 'contra o ');
  const decisao = semPonto(v.decisaoReclamacao).replace(/^que\s+/i, '') || 'indeferiu a reclamação';
  const abertura = rec
    ? `${concorrenteIdent(v)}, concorrente ao ${procedimentoCompleto(v)}, lançado ${daEntidade(str(v.entidadeNome))}, vem interpor **RECURSO HIERÁRQUICO** da decisão que ${decisao}${v.reclamacaoData ? `, sobre a reclamação apresentada em ${dateLong(v.reclamacaoData)}` : ''} ${contra}${notif}, nos termos do regulamento de contratação pública do Estado, com os fundamentos seguintes:`
    : `${concorrenteIdent(v)}, concorrente ao ${procedimentoCompleto(v)}, lançado ${daEntidade(str(v.entidadeNome))}, vem apresentar **RECLAMAÇÃO** ${actoTxt}${notif}, nos termos do regulamento de contratação pública do Estado, com os fundamentos seguintes:`;
  const factos = paragraphsOf(v.factos);
  const direito = paragraphsOf(v.direito);
  const pedidos = [
    v.pedidoAnulacao ? `${rec ? 'a revogação da decisão recorrida e ' : ''}${v.actoTipo === 'documento' ? 'a rectificação do documento de concurso, com a reabertura do prazo de entrega das propostas' : `a anulação ${acto}`};` : '',
    v.pedidoReavaliacao ? 'a readmissão da proposta do concorrente e a sua reavaliação de acordo com os critérios do documento de concurso;' : '',
    v.pedidoAdjudicacao ? 'a adjudicação do contrato ao concorrente, por ter apresentado a proposta mais vantajosa segundo os critérios do documento de concurso;' : '',
    str(v.pedidoOutro) ? `${semPonto(v.pedidoOutro)};` : '',
    rec ? 'a suspensão do procedimento até à decisão do presente recurso.' : 'a suspensão do procedimento até à decisão da presente reclamação.',
  ].filter(Boolean);
  const anexos = lineItems(v.anexos).map((r) => str(r.descricao)).filter(Boolean);
  const blocks: Block[] = [
    head.recipient,
    { type: 'subject', text: `${rec ? 'Recurso hierárquico' : 'Reclamação'} — ${procedimentoNome(v)}` },
  ];
  if (head.vocativo) blocks.push({ type: 'salutation', text: head.vocativo });
  blocks.push(
    { type: 'paragraph', id: 'abertura', text: abertura, en: rec ? 'The bidder lodges a hierarchical appeal against the decision on its complaint, on the following grounds:' : 'The bidder lodges a complaint against the act, on the following grounds:' },
    {
      type: 'articulado',
      sections: [
        { heading: 'I — DOS FACTOS', items: factos.length ? factos : [BLANK] },
        ...(direito.length ? [{ heading: 'II — DO DIREITO', items: direito }] : []),
      ],
    },
    { type: 'paragraph', id: 'pedido', text: `Nestes termos, requer a V. Ex.ª:`, keepWithNext: true, en: 'The bidder therefore requests:' },
    { type: 'list', style: 'alpha', items: pedidos.map((p, i) => (i === pedidos.length - 1 ? p.replace(/;$/, '.') : p)) },
  );
  if (rec && (money(v.caucaoValor) != null || str(v.caucaoComprovativo))) {
    blocks.push({
      type: 'paragraph',
      id: 'caucao',
      text: `Para os efeitos legais, ${f ? 'a recorrente' : 'o recorrente'} prestou a caução de ${valorTexto(money(v.caucaoValor))}${str(v.caucaoComprovativo) ? `, conforme o comprovativo ${semPonto(v.caucaoComprovativo)}` : ''}.`,
      en: 'The deposit required for the appeal was paid.',
    });
  }
  if (anexos.length) blocks.push({ type: 'annexList', title: 'Junta:', items: anexos });
  blocks.push(
    { type: 'paragraph', id: 'deferimento', text: 'Pede deferimento.', align: 'left', keepWithNext: true, en: 'Respectfully requested.' },
    { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [concorrenteSignature(ctx, rec ? (f ? 'A Recorrente' : 'O Recorrente') : f ? 'A Reclamante' : 'O Reclamante')] },
  );
  return blocks;
}

function paragraphsOf(text: unknown): string[] {
  if (typeof text !== 'string') return [];
  return text
    .split(/\n+/)
    .map((s) => s.replace(/^\s*(?:\d+\s*[.ºo)]+|[-•*])\s*/, '').trim())
    .filter(Boolean)
    .map((s) => (/[.!?:;]$/.test(s) ? s : `${s}.`));
}

// ---------------------------------------------------------------- Invitation and tender notice (contracting body)

export const CRITERIO_OPTIONS = [
  { value: 'preco', label: l('Menor preço avaliado', 'Lowest evaluated price') },
  { value: 'combinacao', label: l('Combinação de qualidade técnica e preço', 'Quality and price') },
  { value: 'qualidade', label: l('Qualidade técnica (consultoria)', 'Technical quality (consultancy)') },
];

const CRITERIO_TEXTO: Record<string, string> = {
  preco: 'menor preço avaliado, entre as propostas que cumpram os requisitos do documento de concurso',
  combinacao: 'combinação da qualidade técnica e do preço, segundo os factores e as ponderações do documento de concurso',
  qualidade: 'qualidade técnica da proposta, segundo os factores e as ponderações dos termos de referência',
};

export const DOCUMENTOS_CONCORRENTE_DEFAULT = [
  { descricao: 'Proposta assinada, com a lista de preços' },
  { descricao: 'Certidão de inscrição no Cadastro Único de fornecedores' },
  { descricao: 'Certidão de quitação da Autoridade Tributária, válida' },
  { descricao: 'Declaração de situação contributiva regularizada no INSS' },
  { descricao: 'Declaração de não impedimento' },
  { descricao: 'Alvará ou licença da actividade' },
];

export function condicoesFields(section = 'condicoes', opts: { abertura?: boolean; documentos?: boolean } = {}): FieldDef[] {
  const out: FieldDef[] = [
    { name: 'entregaData', type: 'date', section, width: 'half', required: true, label: l('Entrega das propostas até (data)', 'Bid deadline (date)') },
    { name: 'entregaHora', type: 'text', section, width: 'half', label: l('Hora-limite', 'Deadline time'), placeholder: l('Ex.: 10:00', 'E.g. 10:00') },
    {
      name: 'entregaLocal',
      type: 'text',
      section,
      label: l('Local de entrega das propostas', 'Where bids are delivered'),
      placeholder: l('Ex.: Secretaria da UGEA, 1.º andar, Avenida Eduardo Mondlane, n.º 45, Nampula', 'E.g. UGEA office, 1st floor…'),
      default: (c) => (c.profile ? `Secretaria da UGEA — ${[c.profile.morada?.rua, c.profile.morada?.numero].filter(Boolean).join(', ')}${c.profile.morada?.cidade ? `, ${c.profile.morada.cidade}` : ''}` : ''),
    },
  ];
  if (opts.abertura !== false) {
    out.push(
      { name: 'aberturaData', type: 'date', section, width: 'half', label: l('Abertura pública (data)', 'Public opening (date)') },
      { name: 'aberturaHora', type: 'text', section, width: 'half', label: l('Hora da abertura', 'Opening time'), placeholder: l('Ex.: 10:30', 'E.g. 10:30') },
    );
  }
  out.push(
    { name: 'validadeDias', type: 'number', section, width: 'half', min: 1, max: 365, label: l('Validade das propostas (dias)', 'Bid validity (days)') },
    { name: 'criterio', type: 'select', section, width: 'half', label: l('Critério de avaliação', 'Evaluation criterion'), options: CRITERIO_OPTIONS, default: 'preco' },
    { name: 'prazoExecucao', type: 'text', section, width: 'half', label: l('Prazo de entrega / execução', 'Delivery / performance period'), placeholder: l('Ex.: quinze dias após a assinatura do contrato', 'E.g. fifteen days after signing') },
    { name: 'localExecucao', type: 'text', section, width: 'half', label: l('Local de entrega / execução', 'Place of delivery / performance') },
    { name: 'garantiaProvisoria', type: 'money', section, width: 'half', label: l('Garantia provisória (vazio = não exigida)', 'Bid security (empty = none)') },
    { name: 'pagamento', type: 'text', section, width: 'half', label: l('Condições de pagamento', 'Payment terms'), default: 'Por transferência bancária, após a recepção e contra factura' },
    { name: 'esclarecimentosAte', type: 'date', section, width: 'half', label: l('Pedidos de esclarecimento até', 'Clarifications until') },
    { name: 'contacto', type: 'text', section, width: 'half', label: l('Contacto para esclarecimentos', 'Contact for clarifications'), default: (c) => [c.profile?.email, c.profile?.telefones].filter(Boolean).join(' · ') },
  );
  if (opts.documentos === false) return out;
  out.push(
    {
      name: 'documentos',
      type: 'lines',
      section,
      label: l('Documentos a apresentar', 'Documents to submit'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: DOCUMENTOS_CONCORRENTE_DEFAULT,
    },
  );
  return out;
}

/** "às 10 horas do dia 3 de Novembro de 2026" */
export function horaDia(hora: unknown, dia: unknown): string {
  return `${horaTxt(hora, 'às')} do dia ${dateLong(dia)}`;
}

function horaTxt(s: unknown, prep: 'às' | 'pelas'): string {
  const t = str(s);
  if (!t) return `${prep} ____ horas`;
  const m = /^(\d{1,2})(?:\s*[:hH.]\s*(\d{2}))?\s*(?:h|horas)?$/.exec(t);
  if (!m) return `${prep} ${t}`;
  const h = Number(m[1]);
  const min = m[2] && m[2] !== '00' ? Number(m[2]) : 0;
  const p = h === 1 ? (prep === 'às' ? 'à' : 'pela') : prep;
  return `${p} ${h} ${h === 1 ? 'hora' : 'horas'}${min ? ` e ${min} minutos` : ''}`;
}

/** Numbered conditions of an invitation or tender notice. */
export function condicoesItems(v: Values, opts: { cotacao?: boolean } = {}): string[] {
  const docs = lineItems(v.documentos).map((r) => str(r.descricao)).filter(Boolean);
  const gp = money(v.garantiaProvisoria);
  const nome = opts.cotacao ? 'cotações' : 'propostas';
  const out = [
    `**Entrega das ${nome}:** em envelope fechado, identificado com a referência do procedimento, até ${horaDia(v.entregaHora, v.entregaData)}, em ${semPonto(v.entregaLocal) || BLANK}. Não são aceites ${nome} entregues fora do prazo.`,
    v.aberturaData ? `**Abertura:** em acto público, ${horaDia(v.aberturaHora, v.aberturaData)}, no mesmo local, podendo assistir os representantes dos concorrentes devidamente credenciados.` : '',
    docs.length ? `**Documentos a apresentar:** ${docs.map((d, i) => `${String.fromCharCode(97 + i)}) ${semPonto(d)}`).join('; ')}.` : '',
    v.validadeDias ? `**Validade:** as ${nome} são válidas por ${diasTexto(v.validadeDias)}, contados da data-limite de entrega.` : '',
    str(v.prazoExecucao) || str(v.localExecucao) ? `**Prazo e local de entrega:** ${[semPonto(v.prazoExecucao), str(v.localExecucao) ? `em ${semPonto(v.localExecucao)}` : ''].filter(Boolean).join(', ')}.` : '',
    `**Critério de avaliação:** ${CRITERIO_TEXTO[str(v.criterio)] ?? CRITERIO_TEXTO.preco}.`,
    gp != null ? `**Garantia provisória:** ${valorTexto(gp).replace(/\*\*/g, '')}, prestada por depósito, garantia bancária ou seguro-caução, entregue com a proposta.` : '**Garantia provisória:** não é exigida.',
    str(v.pagamento) ? `**Pagamento:** ${semPonto(v.pagamento)}.` : '',
    v.esclarecimentosAte || str(v.contacto) ? `**Esclarecimentos:** pedidos por escrito${v.esclarecimentosAte ? ` até ${dateLong(v.esclarecimentosAte)}` : ''}${str(v.contacto) ? `, para ${semPonto(v.contacto)}` : ''}.` : '',
  ];
  return out.filter(Boolean);
}

export function condicoesWarnings(v: Values): Warning[] {
  const w: Warning[] = [];
  if (!v.entregaData) w.push({ level: 'warning', field: 'entregaData', message: l('Indique a data-limite de entrega das propostas.', 'Enter the bid deadline.') });
  if (v.aberturaData && v.entregaData && v.aberturaData < v.entregaData) w.push({ level: 'error', field: 'aberturaData', message: l('A abertura não pode ser antes da data-limite de entrega.', 'The opening cannot be before the bid deadline.') });
  if (!v.validadeDias) w.push({ level: 'info', field: 'validadeDias', message: l(`Indique a validade das propostas (${cite('ctValidadeProposta')}).`, 'Enter the bid validity.') });
  return w;
}
