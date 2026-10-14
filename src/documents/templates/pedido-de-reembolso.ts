import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, FORMA_PAGAMENTO_OPTIONS, cite, dateField, dateLong, l, localField, money, moneyText, splitLines } from './_shared';
import {
  anexosBlock,
  anexosField,
  autorFields,
  autorSignature,
  autorWarnings,
  endDot,
  envioBlock,
  envioField,
  eu,
  isEmpresa,
  lowerFirst,
  opt,
  reciboBlock,
  reciboField,
  senderBlock,
  str,
} from './_cidadao';

const MOTIVOS = [
  opt('duplicado', 'Pagamento em duplicado ou a mais', 'Double payment or overpayment'),
  opt('naoPrestado', 'Serviço pago e não prestado / produto não entregue', 'Service paid but not provided / goods not delivered'),
  opt('cancelado', 'Evento, curso ou viagem cancelados', 'Event, course or trip cancelled'),
  opt('caucao', 'Devolução da caução do arrendamento', 'Return of a rent deposit'),
  opt('indevido', 'Valor cobrado ou descontado indevidamente', 'Amount wrongly charged or deducted'),
  opt('outro', 'Outro motivo', 'Other reason'),
];
const RAZAO: Record<string, string> = {
  duplicado: 'o mesmo valor foi pago em duplicado (ou acima do devido), sem que exista qualquer outra dívida a que possa ser imputado',
  naoPrestado: 'o serviço ou o produto pago não foi prestado nem entregue',
  cancelado: 'o evento, curso ou viagem foi cancelado por V. Ex.as',
  caucao: 'o contrato de arrendamento terminou e o locado foi entregue em bom estado, ressalvado o desgaste normal do uso, sem rendas, consumos ou danos em dívida que justifiquem a retenção da caução',
  indevido: 'não existe fundamento contratual ou legal para a cobrança',
  outro: '',
};
const MEIOS = [
  opt('mesmo', 'Pelo mesmo meio do pagamento', 'Same method as the payment'),
  opt('transferencia', 'Transferência bancária', 'Bank transfer'),
  opt('carteira', 'M-Pesa, e-Mola ou mKesh', 'Mobile money'),
  opt('numerario', 'Numerário, contra recibo', 'Cash against receipt'),
];

const razao = (v: Values) => (v.motivo === 'outro' ? lowerFirst(str(v.motivoOutro).replace(/\.$/, '')) || BLANK : RAZAO[String(v.motivo)] ?? RAZAO.duplicado);

export default defineTemplate({
  id: 'pedido-de-reembolso',
  sections: [
    { id: 'autor', title: l('Quem pede', 'Who is asking'), personRole: 'outro' },
    { id: 'destinatario', title: l('A quem pede', 'Who must refund') },
    { id: 'pagamento', title: l('Pagamento', 'Payment') },
    { id: 'pedido', title: l('Reembolso', 'Refund') },
    { id: 'documento', title: l('Local, data e entrega', 'Place, date and delivery') },
  ],
  fields: [
    ...autorFields(['nome', 'genero', 'docTipo', 'docNumero', 'morada', 'telefone', 'email'], { empresa: true, required: ['nome'] }),
    { name: 'destinatario', type: 'text', section: 'destinatario', required: true, label: l('Empresa ou pessoa', 'Company or person'), placeholder: l('Ex.: Academia Fitness Polana, Lda', 'E.g. the gym') },
    { name: 'destinatarioAc', type: 'text', section: 'destinatario', label: l('À atenção de (opcional)', 'Attention of (optional)') },
    { name: 'destinatarioMorada', type: 'text', section: 'destinatario', label: l('Endereço', 'Address') },
    { name: 'motivo', type: 'select', section: 'pagamento', required: true, label: l('Motivo', 'Reason'), options: MOTIVOS, default: 'duplicado' },
    { name: 'motivoOutro', type: 'text', section: 'pagamento', label: l('Porque não é devido', 'Why it is not owed'), showIf: (v) => v.motivo === 'outro', help: l('Continua «… porque …». Ex.: «a inscrição foi recusada pela escola».', 'Continues “…because…”.') },
    { name: 'referente', type: 'text', section: 'pagamento', required: true, label: l('O que pagou', 'What you paid for'), placeholder: l('Ex.: mensalidade de Setembro de 2026 do ginásio', 'E.g. the September gym fee') },
    { name: 'valor', type: 'money', section: 'pagamento', required: true, width: 'half', label: l('Valor a devolver', 'Amount to refund') },
    { name: 'dataPagamento', type: 'date', section: 'pagamento', width: 'half', label: l('Data do pagamento', 'Payment date') },
    { name: 'formaPagamento', type: 'select', section: 'pagamento', width: 'half', label: l('Como pagou', 'How you paid'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    { name: 'referencia', type: 'text', section: 'pagamento', width: 'half', label: l('Recibo ou transacção n.º', 'Receipt or transaction no.') },
    { name: 'factos', type: 'textarea', section: 'pagamento', rows: 4, label: l('Factos (opcional)', 'Facts (optional)'), help: l('O que aconteceu, um facto por linha, com datas e contactos já feitos.', 'What happened, one fact per line.') },
    { name: 'prazo', type: 'number', section: 'pedido', width: 'half', min: 1, max: 60, default: 8, label: l('Prazo para devolver (dias)', 'Days to refund') },
    { name: 'meio', type: 'select', section: 'pedido', width: 'half', label: l('Como quer receber', 'How you want the refund'), options: MEIOS, default: 'transferencia' },
    { name: 'conta', type: 'text', section: 'pedido', label: l('Conta, NIB ou número', 'Account, NIB or number'), placeholder: l('Ex.: NIB 0001 0000 0045678901257 — Millennium bim', 'E.g. bank account'), showIf: (v) => v.meio === 'transferencia' || v.meio === 'carteira' },
    anexosField('pedido', l('Ex.: Comprovativo de pagamento', 'E.g. Proof of payment')),
    localField('documento'),
    dateField('data'),
    envioField('documento'),
    reciboField('documento'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx, { contacto: true });
    if (!str(v.destinatario)) w.push({ level: 'warning', field: 'destinatario', message: l('Indique quem deve devolver o dinheiro.', 'State who must refund.') });
    if (money(v.valor) == null) w.push({ level: 'warning', field: 'valor', message: l('Indique o valor a devolver.', 'State the amount.') });
    if ((v.meio === 'transferencia' || v.meio === 'carteira') && !str(v.conta)) w.push({ level: 'warning', field: 'conta', message: l('Indique a conta ou o número para o reembolso.', 'Give the account or number for the refund.') });
    w.push({
      level: 'info',
      field: 'prazo',
      message: l(
        `Quem recebe um pagamento que não era devido deve restituí-lo (${cite('cidPagamentoIndevido')}). Esta carta interpela o devedor: passado o prazo, fica em mora e passam a contar juros (${cite('codigoCivilMora')}). Se o valor não for devolvido, pode recorrer a um advogado, ao tribunal ou, sendo consumidor, às entidades de defesa do consumidor.`,
        'Whoever receives an undue payment must return it. This letter puts the debtor on notice: after the deadline, interest runs.',
      ),
    });
    if (v.motivo === 'cancelado') w.push({ level: 'info', field: 'motivo', message: l('Se o organizador propuser outra data, pode aceitar ou manter o pedido de reembolso.', 'If the organiser offers another date, you may accept or insist on the refund.') });
    return w;
  },

  personName: (v) => v.destinatario,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const empresa = isEmpresa(ctx);
    const factos = splitLines(v.factos);
    const prazo = Number(v.prazo) > 0 ? Math.round(Number(v.prazo)) : 8;
    const valor = money(v.valor) != null ? `**${moneyText(v.valor)}**` : `${BLANK} MT`;
    const pago = [
      v.dataPagamento ? `Em ${dateLong(v.dataPagamento)}, ` : '',
      `${empresa ? `a **${profileDisplayName(ctx.profile)}** pagou` : v.dataPagamento ? 'paguei' : 'Paguei'} a V. Ex.as o valor de ${valor}`,
      str(v.formaPagamento) ? `, por ${str(v.formaPagamento)}` : '',
      str(v.referencia) ? ` (recibo/transacção n.º ${str(v.referencia)})` : '',
      `, referente a ${lowerFirst(str(v.referente).replace(/\.$/, '')) || BLANK}.`,
    ]
      .join('')
      .replace(/^./, (c) => c.toUpperCase());
    const via =
      v.meio === 'transferencia'
        ? `por transferência bancária${str(v.conta) ? ` para ${str(v.conta)}` : ` para a conta que ${eu(ctx, 'indicarei', 'indicaremos')}`}`
        : v.meio === 'carteira'
          ? `por carteira móvel${str(v.conta) ? ` para o número ${str(v.conta)}` : ''}`
          : v.meio === 'numerario'
            ? 'em numerário, contra recibo'
            : 'pelo mesmo meio utilizado no pagamento';

    const blocks: Block[] = [
      ...senderBlock(ctx),
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      ...envioBlock(v),
      { type: 'recipient', lines: [str(v.destinatario) || BLANK, str(v.destinatarioAc) ? `A/C: ${str(v.destinatarioAc)}` : '', str(v.destinatarioMorada)].filter(Boolean) },
      { type: 'subject', text: v.motivo === 'caucao' ? 'Pedido de devolução da caução' : 'Pedido de reembolso' },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      { type: 'paragraph', id: 'pagamento', text: pago, en: 'On the date stated, the amount stated was paid to you.' },
    ];
    if (factos.length) blocks.push({ type: 'list', style: 'numeric', items: factos.map(endDot) });
    blocks.push(
      {
        type: 'paragraph',
        id: 'fundamento',
        text: `Esse valor deve ser restituído, porque ${razao(v)}. Assim, ${eu(ctx, 'solicito', 'solicitamos')} a ${v.motivo === 'caucao' ? 'devolução da caução' : 'restituição integral do valor'} de ${valor}, no prazo de ${prazo} ${prazo === 1 ? 'dia' : 'dias'} a contar da recepção desta carta, ${via}.`,
        en: `The amount is not owed for the reason stated; its full refund within ${prazo} day(s) is requested.`,
      },
      {
        type: 'paragraph',
        id: 'mora',
        text: `Decorrido esse prazo sem a devolução, V. Ex.as ficarão constituídos em mora, com os juros legais devidos, e ${eu(ctx, 'recorrerei', 'recorreremos')} aos meios legais ao ${eu(ctx, 'meu', 'nosso')} dispor, sem mais aviso.`,
        en: 'After the deadline you will be in default, with legal interest, and legal action may follow without further notice.',
      },
      ...anexosBlock(v),
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', columns: [autorSignature(ctx, 'O Requerente', 'A Requerente')] },
      ...reciboBlock(v),
    );
    return blocks;
  },
});
