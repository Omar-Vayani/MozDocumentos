// Reclamação a um banco ou outra instituição financeira (microbanco,
// microfinança, carteira móvel), nos termos do regulamento de reclamações.

import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { BLANK, cite, dateLong, l, money, moneyText } from './_shared';
import {
  anexosField, anexosList, assinaturaCliente, cartaInicio, clienteFields, clienteWarnings, contaFields, deEntidade, documentoFields, endDot, entidadeFields, eu, fechoCarta,
  linhas, lowerFirst, nomeCliente, reciboField, s, semPonto, sujeito,
} from './_financas';

const ASSUNTO_OPTIONS: FieldOption[] = [
  { value: 'comissoes', label: l('Comissões ou juros cobrados', 'Fees or interest charged') },
  { value: 'cartao', label: l('Cartão, ATM ou POS', 'Card, ATM or POS') },
  { value: 'transferencia', label: l('Transferência ou pagamento', 'Transfer or payment') },
  { value: 'credito', label: l('Crédito (contrato, prestação, cobrança)', 'Loan (contract, instalment, collection)') },
  { value: 'conta', label: l('Abertura, bloqueio ou encerramento de conta', 'Opening, freezing or closing an account') },
  { value: 'informacao', label: l('Falta de informação ou de documentos', 'Lack of information or documents') },
  { value: 'atendimento', label: l('Atendimento', 'Customer service') },
  { value: 'carteira', label: l('Carteira móvel / moeda electrónica', 'Mobile wallet / e-money') },
  { value: 'outro', label: l('Outro', 'Other') },
];

const ASSUNTO_TEXTO: Record<string, string> = {
  comissoes: 'comissões e juros cobrados',
  cartao: 'operações com cartão',
  transferencia: 'transferência ou pagamento',
  credito: 'contrato de crédito',
  conta: 'conta bancária',
  informacao: 'falta de informação ou de documentos',
  atendimento: 'atendimento',
  carteira: 'carteira móvel',
};

export default defineTemplate({
  id: 'reclamacao-ao-banco',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'cliente', title: l('Quem reclama', 'Complainant'), personRole: 'outro' },
    { id: 'banco', title: l('Instituição reclamada', 'Institution') },
    { id: 'reclamacao', title: l('Reclamação', 'Complaint') },
  ],
  fields: [
    ...documentoFields(),
    ...clienteFields('cliente', 'cliente'),
    ...entidadeFields('banco', 'banco', 'banco').map((f) => (f.name === 'bancoBalcao' ? { ...f, label: l('Balcão ou departamento (opcional)', 'Branch or department (optional)'), placeholder: l('Ex.: Gabinete de Gestão de Reclamações', 'E.g. Complaints Office') } : f)),
    ...contaFields('reclamacao'),
    { name: 'outraReferencia', type: 'text', section: 'reclamacao', width: 'half', label: l('N.º de contrato, cartão ou ocorrência (opcional)', 'Contract, card or ticket no. (optional)') },
    { name: 'assunto', type: 'select', section: 'reclamacao', width: 'half', label: l('Assunto', 'Subject'), options: ASSUNTO_OPTIONS, default: 'comissoes' },
    { name: 'dataFacto', type: 'date', section: 'reclamacao', width: 'half', label: l('Data dos factos', 'Date of the facts') },
    { name: 'valor', type: 'money', section: 'reclamacao', width: 'half', label: l('Valor em causa (opcional)', 'Amount involved (optional)') },
    {
      name: 'factos',
      type: 'textarea',
      section: 'reclamacao',
      required: true,
      rows: 6,
      label: l('O que aconteceu (um facto por linha)', 'What happened (one fact per line)'),
      help: l('Por ordem: o que contratou ou pediu, o que o banco fez, contactos já feitos e respostas recebidas.', 'In order: what you agreed or asked, what the bank did, previous contacts and replies.'),
    },
    {
      name: 'pedido',
      type: 'textarea',
      section: 'reclamacao',
      required: true,
      rows: 2,
      label: l('O que pede', 'What you ask for'),
      help: l('Continua «Solicito…». Ex.: «a devolução das comissões de manutenção cobradas desde Março de 2026».', 'Continues “I request…”.'),
    },
    anexosField('reclamacao', l('Ex.: Extracto de Setembro de 2026', 'E.g. September 2026 statement')),
    reciboField('reclamacao'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'cliente')];
    if (!s(v.bancoNome)) w.push({ level: 'warning', field: 'bancoNome', message: l('Indique a instituição reclamada.', 'Enter the institution.') });
    if (!linhas(v.factos).length) w.push({ level: 'warning', field: 'factos', message: l('Descreva o que aconteceu.', 'Describe what happened.') });
    if (!s(v.pedido)) w.push({ level: 'warning', field: 'pedido', message: l('Diga o que pede.', 'Say what you ask for.') });
    w.push({
      level: 'info',
      message: l(
        `Guarde a cópia carimbada. Se o banco não responder no prazo regulamentar, ou se discordar da resposta, pode reclamar ao Banco de Moçambique, juntando esta reclamação e a resposta recebida (${cite('finTratamentoReclamacoes')}).`,
        'Keep the stamped copy. If the bank does not reply in time, or you disagree, you can complain to the Banco de Moçambique, attaching this complaint and the reply.',
      ),
    });
    return w;
  },

  personName: (v) => nomeCliente(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'cliente';
    const factos = linhas(v.factos);
    const refs = [s(v.contaNumero) ? `conta n.º ${s(v.contaNumero)}` : '', s(v.outraReferencia)].filter(Boolean).join(' · ');
    const blocks: Block[] = [
      ...cartaInicio(ctx, P, 'banco', `Reclamação — ${ASSUNTO_TEXTO[v.assunto] ?? 'serviços financeiros'}${refs ? ` — ${refs}` : ''}`),
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${sujeito(v, P)}, cliente ${deEntidade(s(v.bancoNome), 'dessa instituição')}${s(v.contaNumero) ? `, titular da conta n.º ${s(v.contaNumero)}` : ''}, ${eu(v, P, 'apresento', 'apresenta')} reclamação, ao abrigo do Regulamento de Tratamento de Reclamações (${cite('finTratamentoReclamacoes')}), com os seguintes fundamentos:`,
        en: 'The customer submits a complaint under the Banco de Moçambique complaints regulation, on the following grounds:',
        keepWithNext: true,
      },
      { type: 'list', style: 'numeric', items: factos.length ? factos.map(endDot) : [BLANK] },
    ];
    if (v.dataFacto || money(v.valor) != null) {
      blocks.push({
        type: 'paragraph',
        id: 'dados',
        text: [v.dataFacto ? `Data dos factos: ${dateLong(v.dataFacto)}.` : '', money(v.valor) != null ? `Valor em causa: **${moneyText(v.valor)}**.` : ''].filter(Boolean).join(' '),
        en: 'Date and amount involved.',
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Face ao exposto, ${eu(v, P, 'solicito', 'solicita')} ${s(v.pedido) ? endDot(lowerFirst(semPonto(s(v.pedido)).replace(/^(solicito|solicita)\s+/i, ''))) : `${BLANK}.`}`,
        en: 'Request.',
      },
      {
        type: 'paragraph',
        id: 'resposta',
        text: `${eu(v, P, 'Agradeço', 'Agradece-se')} resposta fundamentada, por escrito, no prazo regulamentar, para ${s(v.clienteEmail) ? `o email ${s(v.clienteEmail)} ou ` : ''}a morada acima indicada. Não sendo a reclamação resolvida, ${eu(v, P, 'reservo-me', 'a reclamante reserva-se')} o direito de a submeter ao Banco de Moçambique.`,
        en: 'Please reply in writing within the regulatory period. If unresolved, the complaint may be taken to the Banco de Moçambique.',
      },
    );
    blocks.push(...fechoCarta([assinaturaCliente(ctx, P, { m: 'O Reclamante', f: 'A Reclamante', empresa: s(v.clienteEmpresaNome) || 'A Reclamante' })], { anexos: anexosList(v), recibo: Boolean(v.recibo) }));
    return blocks;
  },
});
