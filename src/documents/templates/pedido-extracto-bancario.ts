// Pedido de extracto, declaração de saldo ou declaração bancária (para visto,
// concurso, auditoria, crédito) dirigido ao banco.

import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { BLANK, cite, dateLong, l, money, moneyText } from './_shared';
import {
  anexosField, anexosList, assinaturaCliente, cartaInicio, clienteFields, clienteWarnings, contaFields, contaTexto, deEntidade, documentoFields, entidadeFields, eu,
  fechoCarta, nomeCliente, reciboField, s, semPonto, sujeito,
} from './_financas';

const TIPO_OPTIONS: FieldOption[] = [
  { value: 'extracto', label: l('Extracto de movimentos de um período', 'Statement for a period') },
  { value: 'saldo', label: l('Declaração de saldo numa data', 'Balance certificate at a date') },
  { value: 'declaracao', label: l('Declaração bancária (conta, antiguidade, referência)', 'Bank reference letter') },
  { value: 'capacidade', label: l('Declaração de capacidade financeira (concurso)', 'Financial capacity letter (tender)') },
  { value: 'comprovativo', label: l('Comprovativo de uma operação', 'Proof of a transaction') },
];

const FORMATO_OPTIONS: FieldOption[] = [
  { value: 'papel', label: l('Em papel, carimbado e assinado', 'On paper, stamped and signed') },
  { value: 'email', label: l('Por email, em PDF', 'By email, as PDF') },
  { value: 'ambos', label: l('Em papel e por email', 'Paper and email') },
];

export default defineTemplate({
  id: 'pedido-extracto-bancario',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'cliente', title: l('Titular da conta', 'Account holder'), personRole: 'outro' },
    { id: 'banco', title: l('Banco', 'Bank') },
    { id: 'pedido', title: l('O que pede', 'What you request') },
  ],
  fields: [
    ...documentoFields(),
    ...clienteFields('cliente', 'cliente'),
    ...entidadeFields('banco', 'banco', 'banco'),
    ...contaFields('pedido', { required: true }),
    { name: 'tipo', type: 'select', section: 'pedido', required: true, label: l('Documento pedido', 'Document requested'), options: TIPO_OPTIONS, default: 'extracto' },
    { name: 'periodoInicio', type: 'date', section: 'pedido', width: 'half', label: l('Período: de', 'Period: from'), showIf: (v) => v.tipo === 'extracto' },
    { name: 'periodoFim', type: 'date', section: 'pedido', width: 'half', label: l('Período: até', 'Period: to'), showIf: (v) => v.tipo === 'extracto' },
    { name: 'dataSaldo', type: 'date', section: 'pedido', width: 'half', label: l('Saldo na data de', 'Balance at'), showIf: (v) => v.tipo === 'saldo' },
    { name: 'operacao', type: 'text', section: 'pedido', label: l('Operação (data, valor, beneficiário)', 'Transaction (date, amount, payee)'), placeholder: l('Ex.: transferência de 45.000,00 MT para a Lusaka Lda, em 3 de Outubro de 2026', 'E.g. a transfer on 3 October 2026'), showIf: (v) => v.tipo === 'comprovativo' },
    { name: 'concurso', type: 'text', section: 'pedido', label: l('Concurso ou entidade', 'Tender or entity'), placeholder: l('Ex.: Concurso Público n.º 12/UGEA/2026, da Direcção Provincial de Obras Públicas', 'E.g. Public Tender no. 12/2026'), showIf: (v) => v.tipo === 'capacidade' },
    { name: 'valorReferencia', type: 'money', section: 'pedido', width: 'half', label: l('Valor de referência (opcional)', 'Reference amount (optional)'), showIf: (v) => v.tipo === 'capacidade' },
    {
      name: 'finalidade',
      type: 'text',
      section: 'pedido',
      label: l('Para que fim (opcional)', 'Purpose (optional)'),
      placeholder: l('Ex.: pedido de visto na Embaixada de Portugal; auditoria às contas de 2026', 'E.g. a visa application; the 2026 audit'),
    },
    { name: 'idioma', type: 'radio', section: 'pedido', width: 'half', label: l('Língua', 'Language'), options: [{ value: 'pt', label: l('Português', 'Portuguese') }, { value: 'en', label: l('Português e inglês', 'Portuguese and English') }], default: 'pt' },
    { name: 'formato', type: 'select', section: 'pedido', width: 'half', label: l('Como receber', 'How to receive it'), options: FORMATO_OPTIONS, default: 'papel' },
    { name: 'debitoComissoes', type: 'toggle', section: 'pedido', default: true, label: l('Autorizo o débito das comissões na conta', 'I authorise fees to be debited to the account') },
    anexosField('pedido'),
    reciboField('pedido', false),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'cliente')];
    if (!s(v.bancoNome)) w.push({ level: 'warning', field: 'bancoNome', message: l('Indique o banco.', 'Enter the bank.') });
    if (v.tipo === 'extracto' && (!v.periodoInicio || !v.periodoFim)) w.push({ level: 'warning', field: 'periodoInicio', message: l('Indique o período do extracto.', 'Enter the statement period.') });
    if (v.tipo === 'extracto' && v.periodoInicio && v.periodoFim && v.periodoFim < v.periodoInicio) w.push({ level: 'error', field: 'periodoFim', message: l('A data final é anterior à inicial.', 'The end date is before the start date.') });
    w.push({
      level: 'info',
      message: l(
        `Os bancos cobram comissões pela emissão de declarações e segundas vias de extractos, conforme o preçário afixado no balcão (${cite('finConsumidorFinanceiro')}). Embaixadas e concursos pedem normalmente o documento com carimbo e assinatura do banco e data recente.`,
        'Banks charge fees for statements and letters per their published price list. Embassies and tenders usually want a recent, stamped and signed document.',
      ),
    });
    return w;
  },

  personName: (v) => nomeCliente(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'cliente';
    const conta = contaTexto(v);
    const banco = deEntidade(s(v.bancoNome), 'desse banco');
    let objecto: string;
    let assunto: string;
    switch (v.tipo) {
      case 'saldo':
        assunto = 'Pedido de declaração de saldo';
        objecto = `a emissão de declaração do saldo da referida conta em ${dateLong(v.dataSaldo)}`;
        break;
      case 'declaracao':
        assunto = 'Pedido de declaração bancária';
        objecto = `a emissão de declaração bancária que confirme a titularidade da referida conta, a data da sua abertura, o seu regular funcionamento e a inexistência de incidentes`;
        break;
      case 'capacidade':
        assunto = 'Pedido de declaração de capacidade financeira';
        objecto = `a emissão de declaração de capacidade financeira, com referência à referida conta${s(v.concurso) ? `, destinada a instruir a proposta ao ${semPonto(v.concurso).replace(/^(o|ao)\s+/i, '')}` : ''}${money(v.valorReferencia) != null ? `, para o valor de referência de **${moneyText(v.valorReferencia)}**` : ''}`;
        break;
      case 'comprovativo':
        assunto = 'Pedido de comprovativo de operação bancária';
        objecto = `a emissão de comprovativo, carimbado e assinado, da seguinte operação efectuada a partir da referida conta: ${semPonto(v.operacao) || BLANK}`;
        break;
      default:
        assunto = 'Pedido de extracto de conta';
        objecto = `a emissão do extracto de movimentos da referida conta, relativo ao período de ${dateLong(v.periodoInicio)} a ${dateLong(v.periodoFim)}`;
    }
    const formato =
      v.formato === 'email'
        ? `em formato PDF, para o email ${s(v.clienteEmail) || BLANK}`
        : v.formato === 'ambos'
          ? `em papel, carimbado e assinado, e também em PDF para o email ${s(v.clienteEmail) || BLANK}`
          : 'em papel, carimbado e assinado';
    const blocks: Block[] = [
      ...cartaInicio(ctx, P, 'banco', `${assunto} — conta n.º ${s(v.contaNumero) || BLANK}`),
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${sujeito(v, P)}, titular da ${conta} ${banco}, ${eu(v, P, 'solicito', 'solicita')} ${objecto}${s(v.finalidade) ? `, destinado a ${semPonto(v.finalidade).replace(/^(a|para)\s+/i, '')}` : ''}.`,
        en: 'The account holder asks the bank to issue the document described.',
      },
      {
        type: 'paragraph',
        id: 'formato',
        text: `O documento deve ser emitido ${v.idioma === 'en' ? 'em português e em inglês' : 'em português'}, ${formato}${v.debitoComissoes ? `, ${eu(v, P, 'autorizando', 'autorizando-se')} o débito das respectivas comissões na referida conta` : ''}.`,
        en: `Language and delivery format${v.debitoComissoes ? '; fees may be debited to the account' : ''}.`,
      },
      {
        type: 'paragraph',
        id: 'contacto',
        text: `Para o levantamento ou qualquer esclarecimento, ${eu(v, P, 'estou', 'a titular está')} disponível através do telefone ${s(v.clienteTelefone) || BLANK}.`,
        en: 'Contact details.',
      },
    ];
    blocks.push(...fechoCarta([assinaturaCliente(ctx, P, { m: 'O Titular', f: 'A Titular', empresa: s(v.clienteEmpresaNome) || 'A Titular' })], { anexos: anexosList(v), recibo: Boolean(v.recibo) }));
    return blocks;
  },
});
