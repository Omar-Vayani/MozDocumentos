// Pedido de reestruturação de crédito (alargamento do prazo, carência,
// redução da prestação, consolidação) dirigido ao banco ou à microfinança.

import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { BLANK, cite, dateLong, l, money, moneyText } from './_shared';
import {
  anexosField, anexosList, assinaturaCliente, cartaInicio, clienteF, clienteFields, clienteWarnings, deEntidade, documentoFields, endDot, entidadeFields, eu, fechoCarta, juntar,
  linhas, nomeCliente, reciboField, s, semPonto, sujeito,
} from './_financas';

const CREDITO_OPTIONS: FieldOption[] = [
  { value: 'crédito pessoal', label: l('Crédito pessoal / consumo', 'Personal loan') },
  { value: 'crédito à habitação', label: l('Crédito à habitação', 'Mortgage loan') },
  { value: 'crédito automóvel', label: l('Crédito automóvel', 'Car loan') },
  { value: 'crédito ao investimento', label: l('Crédito ao investimento / empresarial', 'Business loan') },
  { value: 'descoberto bancário', label: l('Descoberto ou conta corrente caucionada', 'Overdraft / credit line') },
  { value: 'cartão de crédito', label: l('Cartão de crédito', 'Credit card') },
  { value: 'microcrédito', label: l('Microcrédito', 'Microloan') },
];

const MOTIVO_OPTIONS: FieldOption[] = [
  { value: 'perdaEmprego', label: l('Perda de emprego', 'Job loss') },
  { value: 'reducaoRendimento', label: l('Redução do salário ou do rendimento', 'Lower income') },
  { value: 'doenca', label: l('Doença ou morte na família', 'Illness or death in the family') },
  { value: 'quebraVendas', label: l('Quebra de vendas ou atrasos de clientes (empresa)', 'Lower sales or late customer payments') },
  { value: 'catastrofe', label: l('Cheias, ciclone, seca ou conflito', 'Floods, cyclone, drought or conflict') },
  { value: 'outro', label: l('Outro (descrever)', 'Other (describe)') },
];

const MOTIVO_TEXTO: Record<string, string> = {
  perdaEmprego: 'a perda do emprego',
  reducaoRendimento: 'a redução significativa do rendimento mensal',
  doenca: 'despesas extraordinárias decorrentes de doença ou falecimento na família',
  quebraVendas: 'a quebra das vendas e o atraso nos pagamentos de clientes',
  catastrofe: 'os prejuízos causados por calamidade natural ou situação de conflito',
};

const PROPOSTA_OPTIONS: FieldOption[] = [
  { value: 'prazo', label: l('Alargar o prazo', 'Extend the term') },
  { value: 'carencia', label: l('Período de carência de capital', 'Capital grace period') },
  { value: 'prestacao', label: l('Reduzir a prestação para um valor', 'Reduce the instalment to an amount') },
  { value: 'consolidacao', label: l('Juntar vários créditos num só', 'Consolidate several loans') },
  { value: 'mora', label: l('Perdão dos juros de mora e encargos', 'Waive default interest and charges') },
];

export default defineTemplate({
  id: 'pedido-reestruturacao-credito',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'cliente', title: l('Cliente (mutuário)', 'Customer (borrower)'), personRole: 'outro' },
    { id: 'banco', title: l('Banco ou instituição de crédito', 'Bank or lender') },
    { id: 'credito', title: l('Crédito actual', 'Current loan') },
    { id: 'proposta', title: l('Motivo e proposta', 'Reason and proposal') },
  ],
  fields: [
    ...documentoFields(),
    ...clienteFields('cliente', 'cliente'),
    ...entidadeFields('banco', 'banco', 'banco'),
    { name: 'creditoTipo', type: 'select', section: 'credito', width: 'half', label: l('Tipo de crédito', 'Type of loan'), options: CREDITO_OPTIONS, default: 'crédito pessoal' },
    { name: 'contratoNumero', type: 'text', section: 'credito', width: 'half', label: l('N.º do contrato / processo', 'Contract no.') },
    { name: 'contratoData', type: 'date', section: 'credito', width: 'half', label: l('Data do contrato (opcional)', 'Contract date (optional)') },
    { name: 'saldoDivida', type: 'money', section: 'credito', width: 'half', label: l('Capital em dívida (aprox.)', 'Outstanding balance (approx.)') },
    { name: 'prestacaoActual', type: 'money', section: 'credito', width: 'half', label: l('Prestação mensal actual', 'Current monthly instalment') },
    { name: 'prestacoesAtraso', type: 'number', section: 'credito', width: 'half', min: 0, max: 120, label: l('Prestações em atraso (0 se em dia)', 'Instalments overdue (0 if up to date)') },
    { name: 'motivo', type: 'select', section: 'proposta', required: true, label: l('Motivo da dificuldade', 'Reason for the difficulty'), options: MOTIVO_OPTIONS, default: 'reducaoRendimento' },
    { name: 'motivoDescricao', type: 'textarea', section: 'proposta', rows: 3, label: l('Explique a situação (uma ideia por linha)', 'Explain the situation (one point per line)'), help: l('Datas, valores e o que mudou. Seja concreto: o banco decide com base em factos e documentos.', 'Dates, amounts and what changed. Be specific: the bank decides on facts and documents.') },
    { name: 'rendimentoActual', type: 'money', section: 'proposta', width: 'half', label: l('Rendimento mensal líquido actual', 'Current net monthly income') },
    { name: 'prestacaoPossivel', type: 'money', section: 'proposta', width: 'half', label: l('Prestação que consegue pagar', 'Instalment you can afford') },
    {
      name: 'propostas',
      type: 'select',
      section: 'proposta',
      label: l('Proposta principal', 'Main proposal'),
      options: PROPOSTA_OPTIONS,
      default: 'prazo',
    },
    { name: 'mesesExtra', type: 'number', section: 'proposta', width: 'half', min: 1, max: 360, label: l('Meses a acrescentar ao prazo', 'Months to add to the term'), showIf: (v) => v.propostas === 'prazo' },
    { name: 'mesesCarencia', type: 'number', section: 'proposta', width: 'half', min: 1, max: 24, label: l('Meses de carência (só juros)', 'Grace months (interest only)'), showIf: (v) => v.propostas === 'carencia' },
    { name: 'perdaoMora', type: 'toggle', section: 'proposta', default: true, label: l('Pedir também o perdão dos juros de mora e encargos de atraso', 'Also ask to waive default interest and late charges'), showIf: (v) => v.propostas !== 'mora' },
    { name: 'outrasMedidas', type: 'text', section: 'proposta', label: l('Outras propostas (opcional)', 'Other proposals (optional)'), placeholder: l('Ex.: amortização parcial de 50.000,00 MT com a venda de uma viatura', 'E.g. a partial repayment from the sale of a car') },
    {
      ...anexosField('proposta', l('Ex.: Carta de despedimento; declaração de rendimentos', 'E.g. Dismissal letter; proof of income')),
    },
    reciboField('proposta'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'cliente')];
    if (!s(v.bancoNome)) w.push({ level: 'warning', field: 'bancoNome', message: l('Indique o banco.', 'Enter the bank.') });
    if (!s(v.contratoNumero)) w.push({ level: 'info', field: 'contratoNumero', message: l('Indique o número do contrato de crédito, se o tiver.', 'Give the loan contract number if you have it.') });
    w.push({
      level: 'info',
      message: l(
        `Peça a reestruturação antes de entrar em incumprimento ou logo que ele aconteça. O banco não é obrigado a aceitar, mas deve analisar o pedido e responder, e informar por escrito as novas condições, a taxa de juro e o custo total antes de assinar o aditamento (${cite('finConsumidorFinanceiro')}). Continue a pagar o que puder enquanto aguarda a resposta.`,
        'Ask before you default or as soon as you do. The bank need not agree, but must consider the request, reply, and give you the new terms, interest rate and total cost in writing before you sign. Keep paying what you can while waiting.',
      ),
    });
    return w;
  },

  personName: (v) => nomeCliente(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'cliente';
    const atraso = Number(v.prestacoesAtraso) || 0;
    const motivo = v.motivo === 'outro' ? '' : MOTIVO_TEXTO[v.motivo] ?? '';
    const det = linhas(v.motivoDescricao);
    const blocks: Block[] = [
      ...cartaInicio(ctx, P, 'banco', `Pedido de reestruturação de ${s(v.creditoTipo) || 'crédito'}${s(v.contratoNumero) ? ` — contrato n.º ${s(v.contratoNumero)}` : ''}`),
      {
        type: 'paragraph',
        id: 'credito',
        text: `${sujeito(v, P)}, ${eu(v, P, 'sou', 'é')} cliente ${deEntidade(s(v.bancoNome), 'desse banco')} e ${clienteF(v, P) ? 'beneficiária' : 'beneficiário'} do ${s(v.creditoTipo) || 'crédito'}${s(v.contratoNumero) ? ` titulado pelo contrato n.º ${s(v.contratoNumero)}` : ''}${v.contratoData ? `, de ${dateLong(v.contratoData)}` : ''}${money(v.saldoDivida) != null ? `, com capital em dívida de cerca de **${moneyText(v.saldoDivida)}**` : ''}${money(v.prestacaoActual) != null ? ` e prestação mensal de **${moneyText(v.prestacaoActual)}**` : ''}.`,
        en: 'The customer identifies the loan concerned.',
      },
      {
        type: 'paragraph',
        id: 'situacao',
        text: `${atraso > 0 ? `Encontram-se em atraso ${atraso === 1 ? 'uma prestação' : `${atraso} prestações`}. ` : `Até à presente data, ${eu(v, P, 'tenho cumprido', 'a cliente tem cumprido')} pontualmente as ${eu(v, P, 'minhas', 'suas')} obrigações. `}${motivo ? `Contudo, em consequência de ${motivo}, ` : 'Contudo, '}${eu(v, P, 'a minha', 'a sua')} capacidade de pagamento diminuiu, não ${eu(v, P, 'me', 'lhe')} sendo possível continuar a pagar a prestação nas condições actuais${money(v.rendimentoActual) != null ? `: o rendimento mensal líquido é agora de **${moneyText(v.rendimentoActual)}**` : ''}.`,
        en: 'Explanation of the change in the ability to pay.',
      },
    ];
    if (det.length) blocks.push({ type: 'list', style: 'bullet', items: det.map(endDot) });

    const prop: string[] = [];
    switch (v.propostas) {
      case 'carencia':
        prop.push(`a concessão de um período de carência de capital de ${Number(v.mesesCarencia) > 0 ? `${Number(v.mesesCarencia)} ${Number(v.mesesCarencia) === 1 ? 'mês' : 'meses'}` : `${BLANK} meses`}, durante o qual ${eu(v, P, 'pagarei', 'pagará')} apenas os juros`);
        break;
      case 'prestacao':
        prop.push(`a redução da prestação mensal para **${money(v.prestacaoPossivel) != null ? moneyText(v.prestacaoPossivel) : `${BLANK} MT`}**, com o correspondente ajustamento do prazo`);
        break;
      case 'consolidacao':
        prop.push(`a consolidação dos créditos que ${eu(v, P, 'detenho', 'detém')} nesse banco num único contrato, com prazo e prestação ajustados à ${eu(v, P, 'minha', 'sua')} capacidade de pagamento`);
        break;
      case 'mora':
        prop.push('o perdão dos juros de mora, comissões e encargos de atraso, com a regularização do capital e juros remuneratórios em dívida');
        break;
      default:
        prop.push(`o alargamento do prazo de reembolso${Number(v.mesesExtra) > 0 ? ` em ${Number(v.mesesExtra)} ${Number(v.mesesExtra) === 1 ? 'mês' : 'meses'}` : ''}, de forma a reduzir a prestação mensal${money(v.prestacaoPossivel) != null ? ` para um valor próximo de **${moneyText(v.prestacaoPossivel)}**` : ''}`);
    }
    if (v.perdaoMora && v.propostas !== 'mora' && atraso > 0) prop.push('o perdão dos juros de mora e encargos de atraso já vencidos');
    if (s(v.outrasMedidas)) prop.push(semPonto(v.outrasMedidas).replace(/^./, (c) => c.toLowerCase()));
    blocks.push({
      type: 'paragraph',
      id: 'proposta',
      text: `Com o objectivo de continuar a cumprir, ${eu(v, P, 'solicito', 'solicita')} a reestruturação do crédito, propondo ${juntar(prop)}.`,
      en: 'The customer asks for the loan to be restructured and sets out the proposal.',
    });
    blocks.push({
      type: 'paragraph',
      id: 'disponibilidade',
      text: `${eu(v, P, 'Estou', 'A cliente está')} disponível para apresentar os documentos que o banco considere necessários e para uma reunião, e ${eu(v, P, 'solicito', 'solicita')} que, enquanto o pedido estiver em análise, não sejam iniciadas diligências de cobrança coerciva. ${eu(v, P, 'Agradeço', 'Agradece-se')} que as novas condições propostas, incluindo a taxa de juro, as comissões e o custo total do crédito, sejam comunicadas por escrito.`,
      en: 'Offer to provide documents and meet; request that collection steps wait for the decision and that new terms be given in writing.',
    });
    blocks.push({
      type: 'paragraph',
      id: 'contacto',
      text: `Contacto: ${s(v.clienteTelefone) || BLANK}${s(v.clienteEmail) ? ` · ${s(v.clienteEmail)}` : ''}.`,
      en: 'Contact.',
      align: 'left',
    });
    blocks.push(...fechoCarta([assinaturaCliente(ctx, P, { m: 'O Cliente', f: 'A Cliente', empresa: s(v.clienteEmpresaNome) || 'A Cliente' })], { anexos: anexosList(v), recibo: Boolean(v.recibo) }));
    return blocks;
  },
});
