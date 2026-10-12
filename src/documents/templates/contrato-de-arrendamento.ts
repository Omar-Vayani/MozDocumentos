import { addDays, addMonths, diffDays, formatMonthYear, inteiroPorExtenso, MAX_EXTENSO, numeroPorExtenso, roundMoney } from '@/lib/format';
import type { Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import {
  defineTemplate, type Block, type ClauseItem, type DefaultsContext, type FieldDef, type SignatureColumn, type Values, type Warning,
} from '../model';
import {
  BLANK, cite, dateField, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, isF, l, lineItems, localField, money, splitLines, workerFields,
} from './_shared';

// ---------------------------------------------------------------- Local helpers

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
};

/** Defaults the author's fields from a personal profile (kind 'pessoa'). */
function fromPersonalProfile(fields: FieldDef[], prefix: string): FieldDef[] {
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

const DOC_NOME: Record<string, string> = { BI: 'Bilhete de Identidade', DIRE: 'DIRE', Passaporte: 'Passaporte' };

/** Full identification of a person, notarial style. Missing document data prints a blank line to fill in. */
function identificacao(v: Values, p: string): string {
  const get = (k: string) => String(v[`${p}${k}`] ?? '').trim();
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
    `residente em ${get('Morada') || BLANK}`,
  ]
    .filter(Boolean)
    .join(', ');
}

const PESSOA_KEYS = ['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada'] as const;

const isEmpresa = (v: Values, p: string) => v[`${p}Tipo`] === 'empresa';
const str = (x: unknown) => String(x ?? '').trim();
const semPonto = (x: unknown) => str(x).replace(/[.;,:]+$/, '');

/** Party fields: individual (pessoa singular) or company (empresa), switched by `<p>Tipo`. */
function partyFields(p: string, fromProfile: boolean): FieldDef[] {
  const pessoa = workerFields([...PESSOA_KEYS], p, p).map((f) => ({ ...f, showIf: (v: Values) => !isEmpresa(v, p) }));
  const emp = (k: keyof Profile) => (c: DefaultsContext) =>
    fromProfile && c.profile?.kind === 'empresa' ? String(c.profile[k] ?? '') : '';
  const showEmp = (v: Values) => isEmpresa(v, p);
  return [
    {
      name: `${p}Tipo`,
      type: 'radio',
      section: p,
      label: l('Tipo', 'Type'),
      options: [
        { value: 'pessoa', label: l('Pessoa singular', 'Individual') },
        { value: 'empresa', label: l('Empresa', 'Company') },
      ],
      default: fromProfile ? (c) => (c.profile?.kind === 'empresa' ? 'empresa' : 'pessoa') : 'pessoa',
    },
    ...(fromProfile ? fromPersonalProfile(pessoa, p) : pessoa),
    {
      name: `${p}EmpresaNome`,
      type: 'text',
      section: p,
      required: true,
      label: l('Denominação da empresa', 'Company name'),
      default: (c) => (fromProfile && c.profile?.kind === 'empresa' ? c.profile.firma || c.profile.nomeComercial || '' : ''),
      showIf: showEmp,
    },
    { name: `${p}EmpresaNuit`, type: 'text', section: p, width: 'half', label: l('NUIT', 'Tax number (NUIT)'), default: emp('nuit'), showIf: showEmp },
    { name: `${p}EmpresaNuel`, type: 'text', section: p, width: 'half', label: l('NUEL (opcional)', 'NUEL (optional)'), default: emp('nuel'), showIf: showEmp },
    {
      name: `${p}EmpresaSede`,
      type: 'text',
      section: p,
      label: l('Sede', 'Registered office'),
      default: (c) => (fromProfile && c.profile?.kind === 'empresa' ? addressLine(c.profile) : ''),
      showIf: showEmp,
    },
    { name: `${p}RepNome`, type: 'text', section: p, width: 'half', label: l('Representante (quem assina)', 'Representative (signatory)'), default: emp('representanteNome'), showIf: showEmp },
    { name: `${p}RepCargo`, type: 'text', section: p, width: 'half', label: l('Cargo do representante', 'Representative’s position'), default: emp('representanteCargo'), showIf: showEmp },
  ];
}

type Papel = { n: string; o: string; O: string; de: string; ao: string; f: boolean };

/** Role noun with articles, agreeing with the party's gender (companies take the masculine role noun). */
function papel(v: Values, p: string, m: string, f: string): Papel {
  const fem = !isEmpresa(v, p) && isF(v[`${p}Genero`]);
  const n = fem ? f : m;
  return fem
    ? { n, f: true, o: `a ${n}`, O: `A ${n}`, de: `da ${n}`, ao: `à ${n}` }
    : { n, f: false, o: `o ${n}`, O: `O ${n}`, de: `do ${n}`, ao: `ao ${n}` };
}

function parte(v: Values, p: string, role: Papel): string {
  if (isEmpresa(v, p)) {
    const rep = str(v[`${p}RepNome`]);
    const cargo = str(v[`${p}RepCargo`]);
    return [
      `**${str(v[`${p}EmpresaNome`]) || BLANK}**`,
      `com sede em ${str(v[`${p}EmpresaSede`]) || BLANK}`,
      `titular do NUIT ${str(v[`${p}EmpresaNuit`]) || BLANK}`,
      str(v[`${p}EmpresaNuel`]) ? `registada sob o NUEL ${str(v[`${p}EmpresaNuel`])}` : '',
      `neste acto representada por ${rep || BLANK}${cargo ? `, na qualidade de ${cargo}` : ''}`,
    ]
      .filter(Boolean)
      .join(', ') + `, adiante designada por **${role.n}**`;
  }
  return `${identificacao(v, p)}, adiante ${role.f ? 'designada' : 'designado'} por **${role.n}**`;
}

function partyName(v: Values, p: string): string {
  return isEmpresa(v, p) ? str(v[`${p}EmpresaNome`]) : str(v[`${p}Nome`]);
}

/** "1. …\n2. …" when a clause has several paragraphs. */
const numerar = (parts: string[]) => (parts.length === 1 ? parts[0] : parts.map((t, i) => `${i + 1}. ${t}`).join('\n'));

/** "a, b e c" */
const juntar = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

const extenso = (n: number | null) => (n != null && n >= 0 && n <= MAX_EXTENSO ? numeroPorExtenso(n) : '');
const valorTexto = (n: number | null) => (n == null ? `${BLANK} MT` : `**${formatMoney(n)}**${extenso(n) ? ` (${extenso(n)})` : ''}`);
/** "12 (doze) meses" / "um mês" */
const quantos = (n: number, sing: string, plur: string) => (n === 1 ? `um ${sing}` : `${n} (${inteiroPorExtenso(n)}) ${plur}`);

const num = (x: unknown) => {
  const n = Number(x);
  return Number.isFinite(n) && x !== '' && x != null ? Math.floor(n) : null;
};

const TIPOS: Record<string, { pt: string; f: boolean; en: string }> = {
  T1: { pt: 'um apartamento de tipologia T1', f: false, en: 'a one-bedroom flat' },
  T2: { pt: 'um apartamento de tipologia T2', f: false, en: 'a two-bedroom flat' },
  T3: { pt: 'um apartamento de tipologia T3', f: false, en: 'a three-bedroom flat' },
  T4: { pt: 'um apartamento de tipologia T4', f: false, en: 'a four-bedroom flat' },
  moradia: { pt: 'uma moradia', f: true, en: 'a house' },
  loja: { pt: 'uma loja', f: true, en: 'a shop' },
  escritorio: { pt: 'um espaço para escritório', f: false, en: 'office space' },
  armazem: { pt: 'um armazém', f: false, en: 'a warehouse' },
  outro: { pt: 'o imóvel', f: false, en: 'the property' },
};

const DESPESAS: { name: string; pt: string; en: string; label: [string, string]; def: string }[] = [
  { name: 'despesaAgua', pt: 'consumo de água', en: 'water', label: ['Água', 'Water'], def: 'inquilino' },
  { name: 'despesaEnergia', pt: 'consumo de energia eléctrica', en: 'electricity', label: ['Energia eléctrica', 'Electricity'], def: 'inquilino' },
  { name: 'despesaCondominio', pt: 'quotas de condomínio e despesas das partes comuns', en: 'condominium fees', label: ['Condomínio', 'Condominium fees'], def: 'senhorio' },
  { name: 'despesaSeguranca', pt: 'serviços de segurança do imóvel', en: 'security services', label: ['Segurança (guarda)', 'Security (guard)'], def: 'nao' },
];

const QUEM_PAGA = [
  { value: 'inquilino', label: l('Inquilino', 'Tenant') },
  { value: 'senhorio', label: l('Senhorio', 'Landlord') },
  { value: 'nao', label: l('Não se aplica', 'Not applicable') },
];

// ---------------------------------------------------------------- Template

export default defineTemplate({
  id: 'contrato-de-arrendamento',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    {
      id: 'senhorio',
      title: l('Senhorio (quem dá de arrendamento)', 'Landlord'),
      description: l('Os dados vêm do seu perfil. Pode ser uma pessoa ou uma empresa.', 'Details come from your profile. It may be a person or a company.'),
      personRole: 'senhorio',
    },
    { id: 'inquilino', title: l('Inquilino', 'Tenant'), personRole: 'inquilino' },
    { id: 'imovel', title: l('Imóvel', 'Property') },
    { id: 'prazo', title: l('Fim e duração', 'Use and term') },
    { id: 'renda', title: l('Renda e pagamento', 'Rent and payment') },
    { id: 'caucao', title: l('Caução e rendas antecipadas', 'Deposit and advance rent') },
    { id: 'despesas', title: l('Despesas', 'Running costs') },
    { id: 'regras', title: l('Regras e fim do contrato', 'Rules and termination') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data de assinatura', 'Signing date')),
    ...partyFields('senhorio', true),
    ...partyFields('inquilino', false),

    // Imóvel
    {
      name: 'imovelTipo',
      type: 'select',
      section: 'imovel',
      width: 'half',
      required: true,
      label: l('Tipo de imóvel', 'Type of property'),
      default: 'T2',
      options: [
        { value: 'T1', label: l('Apartamento (flat) T1', 'Flat, 1 bedroom') },
        { value: 'T2', label: l('Apartamento (flat) T2', 'Flat, 2 bedrooms') },
        { value: 'T3', label: l('Apartamento (flat) T3', 'Flat, 3 bedrooms') },
        { value: 'T4', label: l('Apartamento (flat) T4 ou maior', 'Flat, 4+ bedrooms') },
        { value: 'moradia', label: l('Moradia (casa)', 'House') },
        { value: 'loja', label: l('Loja', 'Shop') },
        { value: 'escritorio', label: l('Escritório', 'Office') },
        { value: 'armazem', label: l('Armazém', 'Warehouse') },
        { value: 'outro', label: l('Outro', 'Other') },
      ],
    },
    {
      name: 'imovelDivisoes',
      type: 'number',
      section: 'imovel',
      width: 'half',
      min: 1,
      max: 50,
      label: l('Número de divisões (opcional)', 'Number of rooms (optional)'),
    },
    {
      name: 'imovelTipoOutro',
      type: 'text',
      section: 'imovel',
      label: l('Descreva o imóvel', 'Describe the property'),
      placeholder: l('Ex.: um quarto independente com casa de banho privativa', 'E.g. a self-contained room with private bathroom'),
      showIf: (v) => v.imovelTipo === 'outro',
    },
    {
      name: 'imovelMorada',
      type: 'text',
      section: 'imovel',
      required: true,
      label: l('Morada do imóvel', 'Property address'),
      placeholder: l('Ex.: Avenida Kenneth Kaunda, n.º 123, 4.º andar, flat 8, Bairro da Polana Cimento, Cidade de Maputo', 'E.g. street, number, floor, flat, neighbourhood, city'),
    },
    {
      name: 'imovelDescricao',
      type: 'text',
      section: 'imovel',
      label: l('Outras características (opcional)', 'Other features (optional)'),
      placeholder: l('Ex.: com garagem para uma viatura e quintal murado', 'E.g. with a garage and a walled yard'),
    },
    {
      name: 'imovelRegisto',
      type: 'text',
      section: 'imovel',
      label: l('Registo predial (opcional)', 'Land registry details (optional)'),
      placeholder: l('Ex.: descrito na Conservatória do Registo Predial de Maputo sob o n.º 12 345', 'E.g. registered at the Maputo Land Registry under no. 12 345'),
    },
    {
      name: 'mobilado',
      type: 'toggle',
      section: 'imovel',
      label: l('Arrendado com mobília e equipamento', 'Let furnished and equipped'),
      help: l('Junta um inventário como anexo do contrato.', 'Adds an inventory as an annex to the contract.'),
    },
    {
      name: 'inventario',
      type: 'lines',
      section: 'imovel',
      label: l('Inventário (opcional)', 'Inventory (optional)'),
      addLabel: l('Adicionar artigo', 'Add item'),
      columns: [
        { name: 'item', type: 'text', label: l('Artigo', 'Item'), placeholder: l('Ex.: Frigorífico Samsung', 'E.g. Samsung fridge') },
        { name: 'quantidade', type: 'number', label: l('Quantidade', 'Quantity'), min: 1 },
        { name: 'estado', type: 'text', label: l('Estado', 'Condition'), placeholder: l('Ex.: bom', 'E.g. good') },
      ],
      default: [],
      showIf: (v) => Boolean(v.mobilado),
    },

    // Fim e prazo
    {
      name: 'fim',
      type: 'select',
      section: 'prazo',
      width: 'half',
      required: true,
      label: l('Para que vai ser usado', 'Permitted use'),
      default: 'habitacao',
      options: [
        { value: 'habitacao', label: l('Habitação', 'Housing') },
        { value: 'comercio', label: l('Comércio', 'Commerce') },
        { value: 'escritorio', label: l('Escritório', 'Office') },
        { value: 'outro', label: l('Outro fim', 'Other use') },
      ],
    },
    {
      name: 'actividade',
      type: 'text',
      section: 'prazo',
      width: 'half',
      label: l('Actividade (opcional)', 'Business activity (optional)'),
      placeholder: l('Ex.: venda de material de escritório', 'E.g. sale of office supplies'),
      showIf: (v) => v.fim === 'comercio' || v.fim === 'escritorio',
    },
    {
      name: 'fimOutro',
      type: 'text',
      section: 'prazo',
      width: 'half',
      label: l('Qual?', 'Which?'),
      placeholder: l('Ex.: armazenamento de mercadorias', 'E.g. storage of goods'),
      showIf: (v) => v.fim === 'outro',
    },
    { name: 'dataInicio', type: 'date', section: 'prazo', width: 'half', required: true, label: l('Início do arrendamento', 'Start date'), default: (c) => c.today },
    {
      name: 'duracaoMeses',
      type: 'number',
      section: 'prazo',
      width: 'half',
      required: true,
      min: 1,
      max: 120,
      default: 12,
      label: l('Duração (meses)', 'Term (months)'),
    },
    {
      name: 'renovacao',
      type: 'toggle',
      section: 'prazo',
      default: true,
      label: l('Renovação automática no fim do prazo', 'Automatic renewal at the end of the term'),
      help: l('Renova-se por períodos iguais, salvo se uma das partes se opuser por escrito.', 'Renews for equal periods unless one party objects in writing.'),
    },

    // Renda
    {
      name: 'rendaMensal',
      type: 'money',
      section: 'renda',
      width: 'half',
      required: true,
      label: l('Renda mensal', 'Monthly rent'),
      legal: l('O contrato deve indicar o valor da renda.', 'The contract must state the rent.'),
    },
    {
      name: 'diaPagamento',
      type: 'number',
      section: 'renda',
      width: 'half',
      min: 1,
      max: 31,
      default: 5,
      label: l('Pagar até ao dia (do mês)', 'Pay by day (of the month)'),
    },
    {
      name: 'vencimento',
      type: 'radio',
      section: 'renda',
      label: l('A renda de cada mês paga-se', 'Each month’s rent is paid'),
      default: 'corrente',
      options: [
        { value: 'corrente', label: l('No próprio mês', 'In that month') },
        { value: 'anterior', label: l('No mês anterior (adiantada)', 'In the previous month (in advance)') },
      ],
    },
    { name: 'formaPagamento', type: 'select', section: 'renda', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    {
      name: 'pagamentoBanco',
      type: 'text',
      section: 'renda',
      width: 'half',
      label: l('Banco', 'Bank'),
      placeholder: l('Ex.: BCI', 'E.g. BCI'),
      showIf: (v) => v.formaPagamento === 'transferência bancária',
    },
    {
      name: 'pagamentoNib',
      type: 'text',
      section: 'renda',
      width: 'half',
      label: l('NIB da conta do senhorio', 'Landlord’s account NIB'),
      showIf: (v) => v.formaPagamento === 'transferência bancária',
    },
    {
      name: 'pagamentoConta',
      type: 'tel',
      section: 'renda',
      width: 'half',
      label: l('Número da carteira móvel do senhorio', 'Landlord’s mobile wallet number'),
      showIf: (v) => ['M-Pesa', 'e-Mola', 'mKesh'].includes(v.formaPagamento),
    },

    // Caução e antecipadas
    {
      name: 'caucaoMeses',
      type: 'number',
      section: 'caucao',
      width: 'half',
      min: 0,
      max: 12,
      default: 1,
      label: l('Caução (n.º de rendas)', 'Deposit (number of months’ rent)'),
      help: l('Valor entregue como garantia e devolvido no fim. 0 = sem caução.', 'Amount held as security and returned at the end. 0 = no deposit.'),
    },
    {
      name: 'caucaoValor',
      type: 'money',
      section: 'caucao',
      width: 'half',
      computedKey: 'caucaoCalc',
      label: l('Valor da caução', 'Deposit amount'),
      help: l('Calculado automaticamente. Escreva um valor para substituir.', 'Computed automatically. Type a value to override.'),
    },
    {
      name: 'caucaoDevolucaoDias',
      type: 'number',
      section: 'caucao',
      width: 'half',
      min: 1,
      max: 180,
      default: 30,
      label: l('Devolução da caução (dias após a entrega)', 'Deposit returned within (days after hand-over)'),
      showIf: (v) => (num(v.caucaoMeses) ?? 0) > 0 || money(v.caucaoValor) != null,
    },
    {
      name: 'rendasAdiantadas',
      type: 'number',
      section: 'caucao',
      width: 'half',
      min: 0,
      max: 24,
      default: 0,
      label: l('Rendas pagas adiantadas na assinatura (meses)', 'Months of rent paid in advance at signing'),
      help: l('Ex.: 3 se o inquilino paga já os três primeiros meses.', 'E.g. 3 if the tenant pays the first three months up front.'),
    },

    // Despesas
    ...DESPESAS.map(
      (d): FieldDef => ({
        name: d.name,
        type: 'select',
        section: 'despesas',
        width: 'half',
        label: l(d.label[0], d.label[1]),
        options: QUEM_PAGA,
        default: d.def,
      }),
    ),
    {
      name: 'despesasOutras',
      type: 'textarea',
      section: 'despesas',
      rows: 2,
      label: l('Outras regras sobre despesas (opcional)', 'Other rules on costs (optional)'),
      placeholder: l('Ex.: A taxa de recolha de lixo é paga pelo Inquilino.', 'E.g. The refuse collection fee is paid by the Tenant.'),
      help: l('Uma regra por linha.', 'One rule per line.'),
    },

    // Regras
    {
      name: 'obrasNotas',
      type: 'textarea',
      section: 'regras',
      rows: 2,
      label: l('Obras e conservação — regras adicionais (opcional)', 'Works and upkeep — additional rules (optional)'),
      placeholder: l('Ex.: O Senhorio procede à pintura interior do imóvel antes da entrega.', 'E.g. The Landlord repaints the interior before hand-over.'),
      help: l('Uma regra por linha. As regras habituais já constam do contrato.', 'One rule per line. The usual rules are already in the contract.'),
    },
    {
      name: 'sublocacaoProibida',
      type: 'toggle',
      section: 'regras',
      default: true,
      label: l('Proibir subarrendar ou ceder o imóvel', 'Prohibit subletting or assigning the property'),
    },
    {
      name: 'avisoPrevioDias',
      type: 'number',
      section: 'regras',
      width: 'half',
      min: 1,
      max: 365,
      default: 60,
      label: l('Aviso prévio para terminar (dias)', 'Notice to terminate (days)'),
      help: l('Prazo acordado entre as partes para comunicar que não querem continuar.', 'Notice period agreed by the parties to say they will not continue.'),
    },
    {
      name: 'denunciaAntecipada',
      type: 'toggle',
      section: 'regras',
      default: true,
      label: l('O inquilino pode sair antes do fim do prazo, com o mesmo aviso prévio', 'The tenant may leave before the end of the term with the same notice'),
    },
    {
      name: 'foro',
      type: 'text',
      section: 'regras',
      label: l('Tribunal competente (foro)', 'Competent court'),
      default: (c) => {
        const cidade = c.profile?.morada?.cidade?.trim();
        return !cidade || /^maputo$/i.test(cidade) ? 'Tribunal Judicial da Cidade de Maputo' : 'tribunal competente da área de situação do imóvel';
      },
    },
    {
      name: 'testemunhas',
      type: 'toggle',
      section: 'regras',
      label: l('Incluir assinatura de duas testemunhas', 'Include signatures of two witnesses'),
    },
  ],

  computed: (v) => {
    const renda = money(v.rendaMensal);
    const meses = num(v.duracaoMeses) ?? 0;
    const caucaoMeses = num(v.caucaoMeses) ?? 0;
    const adiantadas = num(v.rendasAdiantadas) ?? 0;
    const caucaoCalc = renda != null && caucaoMeses > 0 ? roundMoney(renda * caucaoMeses) : null;
    const caucao = money(v.caucaoValor) ?? caucaoCalc;
    const adiantado = renda != null && adiantadas > 0 ? roundMoney(renda * adiantadas) : null;
    const inicio = typeof v.dataInicio === 'string' && v.dataInicio ? v.dataInicio : '';
    return {
      renda,
      meses,
      caucaoMeses,
      caucaoCalc,
      caucao,
      caucaoEquivale: caucao != null && caucaoCalc != null && caucao === caucaoCalc,
      adiantadas,
      adiantado,
      adiantadoDe: inicio && adiantadas > 0 ? formatMonthYear(inicio) : '',
      adiantadoAte: inicio && adiantadas > 1 ? formatMonthYear(addMonths(inicio, adiantadas - 1)) : '',
      dataFim: inicio && meses > 0 ? addDays(addMonths(inicio, meses), -1) : '',
      totalAssinatura: roundMoney((caucao ?? 0) + (adiantado ?? 0)),
      inventario: lineItems(v.inventario).filter((r) => str(r.item)),
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    for (const [p, pt, en] of [['senhorio', 'senhorio', 'landlord'], ['inquilino', 'inquilino', 'tenant']] as const) {
      if (isEmpresa(v, p)) {
        if (!str(v[`${p}EmpresaNuit`])) w.push({ level: 'warning', field: `${p}EmpresaNuit`, message: l(`Falta o NUIT da empresa (${pt}).`, `The company’s NUIT is missing (${en}).`) });
        if (!str(v[`${p}RepNome`])) w.push({ level: 'warning', field: `${p}RepNome`, message: l(`Indique quem assina pela empresa (${pt}).`, `State who signs for the company (${en}).`) });
      } else {
        if (!str(v[`${p}DocNumero`])) w.push({ level: 'warning', field: `${p}DocNumero`, message: l(`Falta o número do documento de identificação do ${pt}.`, `The ${en}’s ID number is missing.`) });
        if (!str(v[`${p}Morada`])) w.push({ level: 'info', field: `${p}Morada`, message: l(`Falta a morada do ${pt}.`, `The ${en}’s address is missing.`) });
      }
    }
    if (!isEmpresa(v, 'senhorio') && !str(v.senhorioNuit)) {
      w.push({ level: 'info', field: 'senhorioNuit', message: l('Falta o NUIT do senhorio. É necessário para declarar as rendas.', 'The landlord’s NUIT is missing. It is needed to declare the rent.') });
    }
    if (!str(v.imovelMorada)) w.push({ level: 'error', field: 'imovelMorada', message: l('Indique a morada do imóvel.', 'Enter the property address.') });
    if (c.renda == null) w.push({ level: 'error', field: 'rendaMensal', message: l('Indique o valor da renda mensal.', 'Enter the monthly rent.') });
    if (c.meses < 1) w.push({ level: 'error', field: 'duracaoMeses', message: l('Indique a duração do contrato em meses.', 'Enter the term in months.') });
    const dia = num(v.diaPagamento);
    if (dia != null && (dia < 1 || dia > 31)) {
      w.push({ level: 'error', field: 'diaPagamento', message: l('O dia de pagamento deve estar entre 1 e 31.', 'The payment day must be between 1 and 31.') });
    }
    if (v.dataInicio && v.data && diffDays(v.data, v.dataInicio) < 0) {
      w.push({ level: 'warning', field: 'dataInicio', message: l('O arrendamento começa antes da data de assinatura do contrato.', 'The lease starts before the contract is signed.') });
    }
    if (v.formaPagamento === 'transferência bancária' && !str(v.pagamentoNib)) {
      w.push({ level: 'info', field: 'pagamentoNib', message: l('Indique o NIB para onde a renda é transferida.', 'Enter the NIB the rent is paid into.') });
    }
    if (v.mobilado && c.inventario.length === 0) {
      w.push({ level: 'info', field: 'inventario', message: l('Recomenda-se listar a mobília e o equipamento no inventário.', 'It is advisable to list the furniture and equipment in the inventory.') });
    }
    if (v.fim === 'habitacao' && v.renovacao) {
      w.push({
        level: 'info',
        field: 'renovacao',
        message: l(
          'No arrendamento para habitação, a lei pode limitar a oposição do senhorio à renovação. Em caso de dúvida, consulte um jurista.',
          'In residential leases, the law may limit the landlord’s right to refuse renewal. If in doubt, consult a lawyer.',
        ),
      });
    }
    if (c.totalAssinatura > 0) {
      w.push({
        level: 'info',
        message: l(
          `Na assinatura, o inquilino entrega ${formatMoney(c.totalAssinatura)} (caução e rendas antecipadas).`,
          `At signing, the tenant pays ${formatMoney(c.totalAssinatura)} (deposit and advance rent).`,
        ),
      });
    }
    w.push({
      level: 'info',
      message: l(
        'As rendas são rendimentos sujeitos a imposto (IRPS ou IRPC). Confirme as obrigações fiscais junto da Autoridade Tributária.',
        'Rent is taxable income (IRPS or IRPC). Check the tax obligations with the Tax Authority.',
      ),
    });
    return w;
  },

  personName: (v) => partyName(v, 'inquilino') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const S = papel(v, 'senhorio', 'Senhorio', 'Senhoria');
    const I = papel(v, 'inquilino', 'Inquilino', 'Inquilina');

    // Property description
    const tipo = TIPOS[v.imovelTipo] ?? TIPOS.outro;
    const tipoPt = v.imovelTipo === 'outro' && str(v.imovelTipoOutro) ? semPonto(v.imovelTipoOutro) : tipo.pt;
    const fImovel = v.imovelTipo === 'outro' ? false : tipo.f;
    const divisoes = num(v.imovelDivisoes);
    const descricao = [
      tipoPt,
      divisoes && divisoes > 0 ? `com ${divisoes === 1 ? 'uma divisão' : `${divisoes} divisões`}` : '',
      semPonto(v.imovelDescricao),
    ]
      .filter(Boolean)
      .join(', ');
    const morada = semPonto(v.imovelMorada) || BLANK;
    const registo = semPonto(v.imovelRegisto);
    const oImovel = fImovel ? 'a' : 'o';

    // Use
    const actividade = semPonto(v.actividade);
    const fimTexto =
      v.fim === 'comercio'
        ? `ao exercício de actividade comercial${actividade ? `, designadamente ${actividade}` : ''}`
        : v.fim === 'escritorio'
          ? `à instalação de escritório${actividade ? ` para ${actividade}` : ''}`
          : v.fim === 'outro'
            ? `a ${semPonto(v.fimOutro).replace(/^(a|para)\s+/i, '') || BLANK}`
            : isEmpresa(v, 'inquilino')
              ? `à habitação de trabalhadores ${I.de}, por este indicados`
              : `à habitação ${I.de} e do seu agregado familiar`;
    const titulo =
      v.fim === 'habitacao' ? 'Contrato de arrendamento para habitação' : v.fim === 'comercio' ? 'Contrato de arrendamento para comércio' : 'Contrato de arrendamento';

    // Payment
    const dia = num(v.diaPagamento);
    const diaTxt = dia && dia >= 1 && dia <= 31 ? String(dia) : '____';
    const forma = str(v.formaPagamento) || 'transferência bancária';
    const banco = semPonto(v.pagamentoBanco);
    let modo: string;
    if (forma === 'numerário') modo = `em numerário, contra recibo`;
    else if (forma === 'cheque') modo = `por cheque emitido à ordem ${S.de}`;
    else if (forma === 'transferência bancária')
      modo = `por transferência bancária para a conta com o NIB ${str(v.pagamentoNib) || BLANK}${banco ? ` (${banco})` : ''}, de que ${S.o} é titular`;
    else modo = `através de ${forma}, para o número ${str(v.pagamentoConta) || BLANK}, de que ${S.o} é titular`;

    const n = c.meses as number;
    const aviso = num(v.avisoPrevioDias) ?? 0;
    const avisoTxt = aviso > 0 ? quantos(aviso, 'dia', 'dias') : `${BLANK} dias`;
    const devol = num(v.caucaoDevolucaoDias) ?? 0;

    const clauses: ClauseItem[] = [];

    // Objecto
    {
      const parts = [
        `${S.O} é ${S.f ? 'proprietária' : 'proprietário'} de ${descricao}, ${fImovel ? 'sita' : 'sito'} em ${morada}${registo ? `, ${registo}` : ''}, que, pelo presente contrato, dá de arrendamento ${I.ao}, que ${oImovel} aceita.`,
        v.mobilado
          ? `O imóvel é arrendado mobilado e equipado, conforme o inventário ${c.inventario.length ? 'anexo, que faz parte integrante do presente contrato' : 'assinado por ambas as partes na data da entrega das chaves, que faz parte integrante do presente contrato'}.`
          : '',
        `O imóvel é entregue ${I.ao} na data de início do arrendamento, em bom estado de conservação e com as instalações de água, electricidade e esgotos em funcionamento.`,
      ].filter(Boolean);
      clauses.push({
        id: 'objecto',
        heading: 'Objecto',
        text: numerar(parts),
        en: `The Landlord owns ${tipo.en} at ${morada} and lets it to the Tenant, who accepts it.${v.mobilado ? ' It is let furnished, as per the inventory.' : ''} It is handed over in good condition on the start date.`,
      });
    }
    clauses.push({
      id: 'fim',
      heading: 'Fim',
      text: `O imóvel destina-se exclusivamente ${fimTexto}, não podendo ser-lhe dado outro uso sem autorização prévia e escrita ${S.de}.`,
      en: 'The property may only be used for the stated purpose, unless the Landlord agrees otherwise in writing.',
    });
    clauses.push({
      id: 'prazo',
      heading: 'Prazo',
      text: numerar([
        `O presente contrato é celebrado pelo prazo de ${n > 0 ? quantos(n, 'mês', 'meses') : `${BLANK} meses`}, com início em ${dateLong(v.dataInicio)} e termo em ${dateLong(c.dataFim)}.`,
        v.renovacao
          ? 'Findo o prazo inicial, o contrato renova-se automaticamente por períodos iguais e sucessivos, salvo oposição de qualquer das partes nos termos do presente contrato.'
          : 'O contrato caduca no termo do prazo, salvo se as partes acordarem por escrito na sua renovação.',
      ]),
      en: `The lease runs for ${n || '—'} months, from ${v.dataInicio || '—'} to ${c.dataFim || '—'}. ${v.renovacao ? 'It then renews automatically for equal periods unless either party objects.' : 'It ends at the end of the term unless renewed in writing.'}`,
    });
    {
      const parts = [
        `A renda mensal é de ${valorTexto(c.renda)}.`,
        `A renda é paga até ao dia ${diaTxt} do mês ${v.vencimento === 'anterior' ? 'anterior àquele a que disser respeito' : 'a que disser respeito'}${dia && dia > 28 ? ' ou, nos meses com menos dias, até ao último dia do mês' : ''}, ${modo}.`,
        `${S.O} emite recibo de cada renda recebida.`,
        `A falta de pagamento pontual da renda constitui ${I.o} em mora, com as consequências previstas na lei.`,
        v.renovacao ? 'Em caso de renovação, a renda pode ser actualizada por acordo escrito das partes.' : '',
      ].filter(Boolean);
      clauses.push({
        id: 'renda',
        heading: 'Renda',
        text: numerar(parts),
        en: `The monthly rent is ${c.renda != null ? formatMoney(c.renda) : '—'}, payable by day ${diaTxt} of the ${v.vencimento === 'anterior' ? 'previous' : 'same'} month by ${forma}. The Landlord issues a receipt for each payment. Late payment has the consequences provided by law.`,
      });
    }
    if (c.adiantadas > 0) {
      const um = c.adiantadas === 1;
      clauses.push({
        id: 'rendasAntecipadas',
        heading: 'Rendas antecipadas',
        text: `Na data da assinatura do presente contrato, ${I.o} paga antecipadamente ${um ? 'a renda de um mês' : `${quantos(c.adiantadas, 'mês', 'meses')} de renda`}, no montante ${um ? '' : 'total '}de ${valorTexto(c.adiantado)}, ${um ? `correspondente ao mês de ${c.adiantadoDe || BLANK}` : `correspondentes ao período de ${c.adiantadoDe || BLANK} a ${c.adiantadoAte || BLANK}`}, de que ${S.o} dá quitação com a assinatura do presente contrato.`,
        en: `On signing, the Tenant pays ${c.adiantadas} month(s) of rent in advance (${c.adiantado != null ? formatMoney(c.adiantado) : '—'}), and the Landlord acknowledges receipt by signing.`,
      });
    }
    if (c.caucao != null || c.caucaoMeses > 0) {
      clauses.push({
        id: 'caucao',
        heading: 'Caução',
        text: numerar([
          `Para garantia do cumprimento das obrigações emergentes do presente contrato, ${I.o} entrega ${S.ao}, na data da sua assinatura, a quantia de ${valorTexto(c.caucao)}${c.caucaoEquivale ? `, equivalente a ${c.caucaoMeses === 1 ? 'uma renda mensal' : `${quantos(c.caucaoMeses, 'renda', 'rendas')} mensais`}` : ''}, a título de caução.`,
          `${I.O} não pode imputar a caução no pagamento de rendas.`,
          `A caução não vence juros e é restituída ${I.ao} no prazo de ${devol > 0 ? quantos(devol, 'dia', 'dias') : `${BLANK} dias`} após a restituição do imóvel e das respectivas chaves, deduzida dos montantes comprovadamente devidos por rendas, consumos ou reparação de danos causados ao imóvel.`,
        ]),
        en: `The Tenant pays a deposit of ${c.caucao != null ? formatMoney(c.caucao) : '—'}. It cannot be used to pay rent, bears no interest and is returned after the property is handed back, less any amounts proven to be owed.`,
      });
    }
    {
      const doI = DESPESAS.filter((d) => v[d.name] === 'inquilino');
      const doS = DESPESAS.filter((d) => v[d.name] === 'senhorio');
      const parts = [
        doI.length ? `São da responsabilidade ${I.de} as despesas de ${juntar(doI.map((d) => d.pt))} relativas ao imóvel durante a vigência do contrato.` : '',
        doS.length ? `São da responsabilidade ${S.de} as despesas de ${juntar(doS.map((d) => d.pt))}.` : '',
        `O imposto predial autárquico e os demais encargos fiscais relativos ao imóvel são da responsabilidade ${S.de}.`,
        ...splitLines(v.despesasOutras).map((s) => `${semPonto(s)}.`),
      ].filter(Boolean);
      clauses.push({
        id: 'despesas',
        heading: 'Despesas e encargos',
        text: numerar(parts),
        en: `Tenant pays: ${doI.map((d) => d.en).join(', ') || '—'}. Landlord pays: ${doS.map((d) => d.en).join(', ') || '—'}, and property taxes.`,
      });
    }
    clauses.push({
      id: 'conservacao',
      heading: 'Conservação e obras',
      text: numerar([
        `${I.O} obriga-se a usar o imóvel com prudência, a mantê-lo no estado de conservação em que o recebe e a suportar as pequenas reparações decorrentes do seu uso normal, comunicando de imediato ${S.ao} quaisquer defeitos ou avarias cuja reparação caiba a ${S.f ? 'esta' : 'este'}.`,
        `As obras de conservação extraordinária e as reparações estruturais, nomeadamente da cobertura, das paredes mestras e das canalizações embutidas, são da responsabilidade ${S.de}, salvo se resultarem de uso indevido.`,
        `${I.O} não pode fazer obras ou benfeitorias no imóvel sem autorização prévia e escrita ${S.de}. As benfeitorias realizadas ficam a fazer parte do imóvel, sem direito a indemnização ou retenção, salvo acordo escrito em contrário.`,
        `${I.O} faculta o acesso ${S.de} ao imóvel, mediante aviso prévio e em horário razoável, para verificar o seu estado ou realizar obras.`,
        ...splitLines(v.obrasNotas).map((s) => `${semPonto(s)}.`),
      ]),
      en: 'The Tenant keeps the property in good condition and pays for minor repairs; structural and major repairs are for the Landlord. No works without written consent. The Tenant allows access for inspection with prior notice.',
    });
    clauses.push(
      v.sublocacaoProibida
        ? {
            id: 'sublocacao',
            heading: 'Sublocação e cessão',
            text: `É vedado ${I.ao} sublocar, ceder ou emprestar, no todo ou em parte, o imóvel, bem como ceder a sua posição contratual, sem autorização prévia e escrita ${S.de}.`,
            en: 'The Tenant may not sublet, lend or assign the property or the contract without the Landlord’s prior written consent.',
          }
        : {
            id: 'sublocacao',
            heading: 'Sublocação',
            text: `${I.O} pode sublocar, no todo ou em parte, o imóvel, devendo comunicar previamente ${S.ao}, por escrito, a identidade do sublocatário, e mantém-se responsável perante ${S.f ? 'esta' : 'este'} pelo cumprimento do presente contrato.`,
            en: 'The Tenant may sublet the property after notifying the Landlord in writing and remains liable under this contract.',
          },
    );
    clauses.push({
      id: 'denuncia',
      heading: 'Denúncia e resolução',
      text: numerar(
        [
          v.renovacao
            ? `Qualquer das partes pode opor-se à renovação do contrato, nos termos e com os limites previstos na lei, mediante comunicação escrita enviada à outra parte com a antecedência mínima de ${avisoTxt} relativamente ao termo do prazo inicial ou da renovação em curso.`
            : '',
          v.denunciaAntecipada
            ? `${I.O} pode denunciar o contrato antes do termo do prazo, mediante comunicação escrita enviada ${S.ao} com a antecedência mínima de ${avisoTxt}, ficando ${I.f ? 'obrigada' : 'obrigado'} ao pagamento das rendas que se vencerem até ao fim desse prazo de aviso.`
            : '',
          'O incumprimento das obrigações emergentes do presente contrato, nomeadamente a falta de pagamento da renda, confere à outra parte o direito de o resolver, nos termos da lei.',
        ].filter(Boolean),
      ),
      en: `${v.renovacao ? `Either party may object to renewal with ${aviso || '—'} days’ written notice. ` : ''}${v.denunciaAntecipada ? `The Tenant may terminate early with ${aviso || '—'} days’ written notice, paying rent until the notice ends. ` : ''}Breach, in particular non-payment of rent, entitles the other party to terminate under the law.`,
    });
    clauses.push({
      id: 'restituicao',
      heading: 'Restituição do imóvel',
      text: numerar([
        `Findo o contrato, por qualquer causa, ${I.o} restitui o imóvel ${S.ao}, livre de pessoas e bens que não lhe pertençam, no estado de conservação em que o recebeu, ressalvadas as deteriorações inerentes a uma utilização normal e prudente, e entrega todas as chaves.`,
        `No acto da restituição, as partes procedem a uma vistoria conjunta do imóvel${v.mobilado ? ' e à conferência do inventário' : ''}, de que se lavra auto assinado por ambas, e ${I.o} entrega os comprovativos de pagamento dos consumos a seu cargo até essa data.`,
      ]),
      en: 'At the end, the Tenant returns the property empty, in the condition received (normal wear excepted), with all keys. Both parties inspect it and sign a record; the Tenant shows proof that utilities are paid.',
    });
    clauses.push({
      id: 'comunicacoes',
      heading: 'Comunicações',
      text: `As comunicações entre as partes relativas ao presente contrato são feitas por escrito, por carta entregue em mão contra recibo, por carta registada ou por correio electrónico com confirmação de recepção, para as moradas indicadas no presente contrato ou, quanto ${I.ao}, para o imóvel arrendado, salvo comunicação escrita de alteração.`,
      en: 'Notices are given in writing (hand delivery against receipt, registered letter or e-mail with confirmation) to the addresses in this contract or, for the Tenant, to the leased property.',
    });
    clauses.push({
      id: 'lei',
      heading: 'Lei aplicável e foro',
      text: numerar([
        `Em tudo o que não estiver expressamente previsto no presente contrato, aplica-se a legislação moçambicana sobre arrendamento (${cite('codigoCivilArrendamento')}).`,
        `Para dirimir quaisquer litígios emergentes do presente contrato que não sejam resolvidos por acordo, as partes elegem o foro do ${semPonto(v.foro) || 'tribunal competente da área de situação do imóvel'}, com expressa renúncia a qualquer outro.`,
      ]),
      en: 'Matters not covered are governed by Mozambican lease law (Civil Code). Disputes not settled amicably go to the court named.',
      // keep the last clause with the closing
    });

    // Signatures
    const signCol = (p: string, role: Papel): SignatureColumn =>
      isEmpresa(v, p)
        ? {
            role: role.O,
            name: str(v[`${p}RepNome`]) || undefined,
            detail: [str(v[`${p}RepCargo`]), str(v[`${p}EmpresaNome`])].filter(Boolean).join(', ') || undefined,
            image: p === 'senhorio' && ctx.profile?.kind === 'empresa' ? 'both' : undefined,
          }
        : { role: role.O, name: str(v[`${p}Nome`]) || undefined };

    const blocks: Block[] = [
      { type: 'title', text: titulo },
      {
        type: 'paragraph',
        id: 'parteSenhorio',
        text: `Entre:\n${parte(v, 'senhorio', S)};`,
        en: 'Between the Landlord, identified above;',
      },
      {
        type: 'paragraph',
        id: 'parteInquilino',
        text: `e\n${parte(v, 'inquilino', I)};`,
        en: 'and the Tenant, identified above;',
      },
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'é celebrado, de boa-fé e de livre vontade, o presente contrato de arrendamento, que se rege pelas cláusulas seguintes:',
        en: 'this lease is entered into in good faith and freely, on the following terms:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      {
        type: 'paragraph',
        id: 'feito',
        text: `Feito em ${ctx.place}, a ${dateLong(v.data)}, em dois exemplares de igual teor e valor, ficando um em poder de cada uma das partes, que o vão assinar.`,
        en: 'Made in two copies of equal content and value, one for each party, who sign below.',
        keepWithNext: true,
      },
      { type: 'signatures', columns: [signCol('senhorio', S), signCol('inquilino', I)] },
    ];
    if (v.testemunhas) {
      blocks.push({
        type: 'signatures',
        columns: [
          { role: 'Testemunha', detail: `Nome e BI n.º: ${BLANK}` },
          { role: 'Testemunha', detail: `Nome e BI n.º: ${BLANK}` },
        ],
      });
    }
    if (v.mobilado && c.inventario.length) {
      blocks.push(
        { type: 'pageBreakHint' },
        { type: 'title', text: 'Anexo — Inventário', subtitle: 'Mobília e equipamento' },
        {
          type: 'paragraph',
          id: 'inventarioIntro',
          text: `Inventário da mobília e do equipamento que integram o arrendamento ${fImovel ? 'da' : 'do'} ${descricao.replace(/^(um|uma|o)\s+/, '')} ${fImovel ? 'sita' : 'sito'} em ${morada}, nos termos do contrato de arrendamento celebrado em ${dateLong(v.data)} entre ${partyName(v, 'senhorio') || BLANK} e ${partyName(v, 'inquilino') || BLANK}.`,
          en: 'Inventory of the furniture and equipment let with the property under the lease above.',
        },
        {
          type: 'table',
          columns: [
            { label: 'N.º', width: 0.5, align: 'right' },
            { label: 'Artigo', width: 3.5 },
            { label: 'Quant.', width: 0.8, align: 'right' },
            { label: 'Estado', width: 1.6 },
          ],
          rows: c.inventario.map((r: Record<string, unknown>, i: number) => [String(i + 1), str(r.item), str(r.quantidade) || '1', str(r.estado)]),
        },
        { type: 'signatures', columns: [signCol('senhorio', S), signCol('inquilino', I)] },
      );
    }
    return blocks;
  },
});
