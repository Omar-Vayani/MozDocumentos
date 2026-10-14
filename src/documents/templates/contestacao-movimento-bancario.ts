// Contestação de movimento bancário: débito não autorizado, levantamento no ATM
// sem entrega de dinheiro, transferência não creditada, comissão indevida.

import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { BLANK, cite, l } from './_shared';
import {
  anexosField, anexosList, assinaturaCliente, cartaInicio, clienteFields, clienteWarnings, contaFields, contaTexto, deEntidade, documentoFields, endDot,
  entidadeFields, eu, fechoCarta, linhas, movimentos, movimentosField, movimentosTable, nomeCliente, reciboField, s, sujeito,
} from './_financas';

const TIPO_OPTIONS: FieldOption[] = [
  { value: 'naoAutorizado', label: l('Débito ou compra que não autorizei', 'Debit or purchase I did not authorise') },
  { value: 'atm', label: l('Levantamento no ATM sem entrega do dinheiro', 'ATM withdrawal with no cash dispensed') },
  { value: 'duplicado', label: l('Movimento cobrado em duplicado', 'Duplicate charge') },
  { value: 'transferencia', label: l('Transferência ou depósito não creditado', 'Transfer or deposit not credited') },
  { value: 'comissao', label: l('Comissão ou juros cobrados indevidamente', 'Fee or interest wrongly charged') },
  { value: 'carteira', label: l('Operação em carteira móvel (M-Pesa, e-Mola, mKesh) ligada à conta', 'Mobile wallet transaction linked to the account') },
];

const TIPO_TEXTO: Record<string, string> = {
  naoAutorizado: 'não foram por mim autorizados nem realizados',
  atm: 'correspondem a levantamentos em caixa automática em que o dinheiro não foi entregue, apesar de o valor ter sido debitado na conta',
  duplicado: 'foram debitados em duplicado, correspondendo a uma única operação',
  transferencia: 'não foram creditados na conta, apesar de a operação ter sido efectuada',
  comissao: 'correspondem a comissões ou juros que não são devidos nos termos do contrato e do preçário',
  carteira: 'correspondem a operações de transferência entre a conta e uma carteira móvel que não foram concluídas ou não foram por mim autorizadas',
};

export default defineTemplate({
  id: 'contestacao-movimento-bancario',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'cliente', title: l('Titular da conta', 'Account holder'), personRole: 'outro' },
    { id: 'banco', title: l('Banco', 'Bank') },
    { id: 'movimentos', title: l('Movimentos contestados', 'Disputed transactions') },
  ],
  fields: [
    ...documentoFields(),
    ...clienteFields('cliente', 'cliente'),
    ...entidadeFields('banco', 'banco', 'banco'),
    ...contaFields('movimentos', { required: true }),
    { name: 'cartaoDigitos', type: 'text', section: 'movimentos', width: 'half', label: l('Cartão usado — últimos 4 dígitos (opcional)', 'Card used — last 4 digits (optional)') },
    { name: 'tipo', type: 'select', section: 'movimentos', required: true, label: l('O que aconteceu', 'What happened'), options: TIPO_OPTIONS, default: 'naoAutorizado' },
    movimentosField('movimentos', l('Movimentos contestados', 'Disputed transactions')),
    {
      name: 'factos',
      type: 'textarea',
      section: 'movimentos',
      rows: 4,
      label: l('Circunstâncias (opcional, uma por linha)', 'Circumstances (optional, one per line)'),
      help: l('Ex.: onde estava o cartão, o ATM usado, a hora, contactos já feitos com o banco e números de ocorrência.', 'E.g. where the card was, the ATM, the time, previous contacts and ticket numbers.'),
    },
    { name: 'ocorrencia', type: 'text', section: 'movimentos', width: 'half', label: l('N.º de ocorrência já aberta (opcional)', 'Ticket already opened (optional)') },
    { name: 'pedirImagens', type: 'toggle', section: 'movimentos', default: true, label: l('Pedir registos da operação (comprovativos, diário do ATM, imagens)', 'Ask for transaction records (journal, footage)') },
    anexosField('movimentos', l('Ex.: Extracto com os movimentos assinalados', 'E.g. Statement with the transactions marked')),
    reciboField('movimentos'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'cliente')];
    if (!s(v.bancoNome)) w.push({ level: 'warning', field: 'bancoNome', message: l('Indique o banco.', 'Enter the bank.') });
    if (!movimentos(v).length) w.push({ level: 'warning', field: 'movimentos', message: l('Indique os movimentos contestados (data, descrição e valor).', 'List the disputed transactions.') });
    w.push({
      level: 'info',
      message: l(
        `Conteste logo que veja o movimento no extracto ou na aplicação: o contrato do cartão ou da conta pode fixar um prazo. Se o banco não responder no prazo regulamentar ou se discordar da resposta, pode reclamar ao Banco de Moçambique (${cite('finTratamentoReclamacoes')}).`,
        'Dispute as soon as you see the transaction: the card or account agreement may set a deadline. If the bank does not reply in time or you disagree, you can complain to the Banco de Moçambique.',
      ),
    });
    return w;
  },

  personName: (v) => nomeCliente(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'cliente';
    const ms = movimentos(v);
    const factos = linhas(v.factos);
    const tipoTexto = (TIPO_TEXTO[v.tipo] ?? TIPO_TEXTO.naoAutorizado).replace('por mim', eu(v, P, 'por mim', 'pela titular'));
    const blocks: Block[] = [
      ...cartaInicio(ctx, P, 'banco', `Contestação de movimentos — conta n.º ${s(v.contaNumero) || BLANK}${s(v.ocorrencia) ? ` — ocorrência n.º ${s(v.ocorrencia)}` : ''}`),
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${sujeito(v, P)}, titular da ${contaTexto(v)} ${deEntidade(s(v.bancoNome), 'desse banco')}${s(v.cartaoDigitos) ? ` e do cartão terminado em ${s(v.cartaoDigitos)}` : ''}, ${eu(v, P, 'contesto', 'contesta')} os movimentos abaixo indicados, que ${tipoTexto}:`,
        en: 'The account holder disputes the transactions below.',
        keepWithNext: true,
      },
      ms.length ? movimentosTable(ms) : movimentosTable([{ data: '', descricao: '', valor: null }]),
    ];
    if (factos.length) {
      blocks.push(
        { type: 'paragraph', id: 'factosIntro', text: 'Circunstâncias:', en: 'Circumstances:', keepWithNext: true },
        { type: 'list', style: 'numeric', items: factos.map(endDot) },
      );
    }
    blocks.push({
      type: 'paragraph',
      id: 'pedido',
      text: `${eu(v, P, 'Solicito', 'Solicita')} a análise da situação e a regularização da conta, com o crédito dos valores indevidamente debitados${v.tipo === 'transferencia' ? ' ou não creditados' : ''}, acrescidos das comissões e encargos associados${v.pedirImagens ? ', bem como cópia dos registos das operações (comprovativos, registo diário da caixa automática ou do terminal e demais elementos que permitam verificar a sua realização)' : ''}.`,
      en: `Request to investigate, credit the amounts with related fees${v.pedirImagens ? ' and provide the transaction records' : ''}.`,
    });
    blocks.push({
      type: 'paragraph',
      id: 'resposta',
      text: `${eu(v, P, 'Agradeço', 'Agradece-se')} resposta escrita no prazo regulamentar (${cite('finTratamentoReclamacoes')}), para o telefone ${s(v.clienteTelefone) || BLANK}${s(v.clienteEmail) ? ` ou o email ${s(v.clienteEmail)}` : ''}.`,
      en: 'Please reply in writing within the regulatory period.',
    });
    blocks.push(
      ...fechoCarta([assinaturaCliente(ctx, P, { m: 'O Titular', f: 'A Titular', empresa: s(v.clienteEmpresaNome) || 'A Titular' })], {
        anexos: anexosList(v),
        recibo: Boolean(v.recibo),
      }),
    );
    return blocks;
  },
});
