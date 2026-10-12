import { parseISODate } from '@/lib/format';
import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import {
  blank, dateField, dateLong, DOC_TIPO_OPTIONS, employerRep, FORMA_PAGAMENTO_OPTIONS, formatMoney, l, localField, money,
  placeDate, refField, splitLines,
} from './_shared';

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dateEn = (iso: unknown) => {
  const d = parseISODate(typeof iso === 'string' ? iso : '');
  return d ? `${d.getDate()} ${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}` : '____________';
};

/** "por transferência bancária", "em numerário", "via M-Pesa"… */
function formaTexto(forma: unknown): { pt: string; en: string } {
  switch (forma) {
    case 'numerário':
      return { pt: 'em numerário', en: 'in cash' };
    case 'cheque':
      return { pt: 'por cheque', en: 'by cheque' };
    case 'M-Pesa':
    case 'e-Mola':
    case 'mKesh':
      return { pt: `via ${forma}`, en: `via ${forma}` };
    case 'transferência bancária':
      return { pt: 'por transferência bancária', en: 'by bank transfer' };
    default:
      return forma ? { pt: `por ${forma}`, en: `by ${forma}` } : { pt: 'em numerário', en: 'in cash' };
  }
}

const isElectronic = (forma: unknown): boolean => Boolean(forma) && forma !== 'numerário';
const clean = (s: unknown) => String(s ?? '').trim().replace(/[.;]+$/, '');

export default defineTemplate({
  id: 'recibo-de-pagamento',
  sections: [
    { id: 'documento', title: l('Recibo', 'Receipt') },
    { id: 'recebedor', title: l('Quem recebe', 'Received by') },
    { id: 'pagador', title: l('Quem paga', 'Paid by') },
    { id: 'pagamento', title: l('Pagamento', 'Payment') },
  ],
  fields: [
    { ...refField(), label: l('Número do recibo', 'Receipt number') },
    localField(),
    dateField('data', 'documento', l('Data do recibo', 'Receipt date')),
    {
      name: 'recebedorTipo',
      type: 'radio',
      section: 'recebedor',
      label: l('Quem recebe é', 'Recipient is'),
      options: [
        { value: 'pessoa', label: l('Particular', 'Individual') },
        { value: 'empresa', label: l('Empresa', 'Company') },
      ],
      default: (c) => (c.profile?.kind === 'pessoa' ? 'pessoa' : 'empresa'),
    },
    {
      name: 'recebedorNome',
      type: 'text',
      section: 'recebedor',
      required: true,
      label: l('Nome / firma de quem recebe', 'Name of recipient'),
      default: (c) => profileDisplayName(c.profile),
    },
    {
      name: 'recebedorNuit',
      type: 'text',
      section: 'recebedor',
      width: 'half',
      label: l('NUIT de quem recebe', 'Recipient NUIT'),
      default: (c) => c.profile?.nuit || '',
    },
    {
      name: 'recebedorDocTipo',
      type: 'select',
      section: 'recebedor',
      width: 'half',
      label: l('Documento de identificação', 'ID document'),
      options: DOC_TIPO_OPTIONS,
      default: (c) => (c.profile?.kind === 'pessoa' && c.profile.docTipo) || 'BI',
      showIf: (v) => v.recebedorTipo === 'pessoa',
    },
    {
      name: 'recebedorDocNumero',
      type: 'text',
      section: 'recebedor',
      width: 'half',
      label: l('Número do documento', 'Document number'),
      default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.docNumero || '' : ''),
      showIf: (v) => v.recebedorTipo === 'pessoa',
    },
    {
      name: 'pagadorNome',
      type: 'text',
      section: 'pagador',
      required: true,
      label: l('Nome / firma de quem paga', 'Name of payer'),
    },
    { name: 'pagadorNuit', type: 'text', section: 'pagador', width: 'half', label: l('NUIT de quem paga (opcional)', 'Payer NUIT (optional)') },
    {
      name: 'valor',
      type: 'money',
      section: 'pagamento',
      width: 'half',
      required: true,
      label: l('Valor recebido', 'Amount received'),
    },
    {
      name: 'descricao',
      type: 'textarea',
      section: 'pagamento',
      required: true,
      rows: 3,
      label: l('Referente a', 'In respect of'),
      placeholder: l('Ex.: renda do mês de Outubro de 2026 da casa sita no Bairro da Malhangalene', 'E.g. October 2026 rent for the house in Malhangalene'),
      help: l('Para vários itens, escreva um por linha.', 'For several items, write one per line.'),
    },
    {
      name: 'formaPagamento',
      type: 'select',
      section: 'pagamento',
      width: 'half',
      label: l('Forma de pagamento', 'Payment method'),
      options: FORMA_PAGAMENTO_OPTIONS,
      default: 'numerário',
    },
    {
      name: 'referenciaPagamento',
      type: 'text',
      section: 'pagamento',
      width: 'half',
      label: l('Referência / ID da transacção', 'Reference / transaction ID'),
      placeholder: l('Ex.: ID M-Pesa, n.º do cheque ou da transferência', 'E.g. M-Pesa ID, cheque or transfer number'),
      showIf: (v) => isElectronic(v.formaPagamento),
    },
    {
      name: 'dataPagamento',
      type: 'date',
      section: 'pagamento',
      width: 'half',
      label: l('Data do pagamento (se diferente)', 'Payment date (if different)'),
    },
    {
      name: 'notaFactura',
      type: 'toggle',
      section: 'pagamento',
      default: true,
      label: l('Indicar "Este recibo não substitui a factura"', 'State "This receipt does not replace the invoice"'),
      help: l('Recomendado para empresas que também emitem factura.', 'Recommended for companies that also issue an invoice.'),
      showIf: (v) => v.recebedorTipo === 'empresa',
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    const valor = money(v.valor);
    if (valor == null || valor <= 0) {
      w.push({ level: 'warning', field: 'valor', message: l('Indique o valor recebido.', 'Enter the amount received.') });
    }
    if (!clean(v.descricao)) {
      w.push({ level: 'warning', field: 'descricao', message: l('Indique a que se refere o pagamento.', 'State what the payment is for.') });
    }
    if (!v.pagadorNome) {
      w.push({ level: 'warning', field: 'pagadorNome', message: l('Indique quem fez o pagamento.', 'Enter who made the payment.') });
    }
    if (isElectronic(v.formaPagamento) && !v.referenciaPagamento) {
      w.push({
        level: 'info',
        field: 'referenciaPagamento',
        message: l('Indique a referência ou o ID da transacção para facilitar a conferência.', 'Enter the reference or transaction ID to make reconciliation easier.'),
      });
    }
    if (v.recebedorTipo === 'empresa' && !v.recebedorNuit) {
      w.push({ level: 'warning', field: 'recebedorNuit', message: l('Falta o NUIT da empresa.', 'The company NUIT is missing.') });
    }
    return w;
  },

  personName: (v) => v.pagadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v: Values = ctx.values;
    const empresa = v.recebedorTipo === 'empresa';
    const valor = money(v.valor);
    const forma = formaTexto(v.formaPagamento);
    const itens = splitLines(v.descricao).map((s) => s.replace(/[.;]+$/, ''));
    const refPag = isElectronic(v.formaPagamento) ? clean(v.referenciaPagamento) : '';

    const recebedorPt = [
      `**${blank(v.recebedorNome)}**`,
      !empresa && v.recebedorDocNumero ? `portador(a) do ${v.recebedorDocTipo || 'BI'} n.º ${v.recebedorDocNumero}` : '',
      v.recebedorNuit ? `NUIT ${v.recebedorNuit}` : '',
    ].filter(Boolean).join(', ');
    const pagadorPt = `**${blank(v.pagadorNome)}**${v.pagadorNuit ? `, NUIT ${v.pagadorNuit}` : ''}`;
    const valorPt = valor != null && valor > 0 ? formatMoney(valor) : formatMoney(null);
    const referente = itens.length > 1 ? 'referente ao seguinte:' : `referente a ${itens[0] || blank('')}.`;

    const blocks: Block[] = [
      { type: 'title', text: v.ref ? `Recibo n.º ${v.ref}` : 'Recibo' },
    ];
    if (valor != null && valor > 0) blocks.push({ type: 'amount', label: 'Valor recebido', value: valor });
    blocks.push({
      type: 'paragraph',
      id: 'recebimento',
      text: empresa
        ? `${recebedorPt}, declara ter recebido de ${pagadorPt}${v.pagadorNuit ? ',' : ''} a quantia de **${valorPt}**, ${referente}`
        : `Eu, ${recebedorPt}, declaro ter recebido de ${pagadorPt}${v.pagadorNuit ? ',' : ''} a quantia de **${valorPt}**, ${referente}`,
      en: `${blank(v.recebedorNome)} acknowledges receipt from ${blank(v.pagadorNome)} of ${valorPt}, in respect of ${itens.length > 1 ? 'the items listed below' : itens[0] || '____'}.`,
    });
    if (itens.length > 1) blocks.push({ type: 'list', style: 'numeric', items: itens });

    const dataPag = v.dataPagamento && v.dataPagamento !== v.data ? v.dataPagamento : '';
    blocks.push(
      {
        type: 'paragraph',
        id: 'pagamento',
        text: `Pagamento efectuado ${forma.pt}${refPag ? `, com a referência ${refPag}` : ''}${dataPag ? `, em ${dateLong(dataPag)}` : ''}.`,
        en: `Paid ${forma.en}${refPag ? `, reference ${refPag}` : ''}${dataPag ? `, on ${dateEn(dataPag)}` : ''}.`,
      },
      {
        type: 'paragraph',
        id: 'quitacao',
        text: 'Por ser verdade, passa-se o presente recibo, que dá plena quitação da quantia recebida.',
        en: 'This receipt is issued as full discharge for the amount received.',
        keepWithNext: true,
      },
    );

    const rep = employerRep(ctx);
    const sig: SignatureColumn = empresa
      ? { role: 'Pelo Recebedor', name: rep.nome || undefined, detail: rep.cargo || undefined, image: 'both' }
      : { role: 'O Recebedor', name: v.recebedorNome || undefined, image: 'signature' };
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [sig] });

    if (empresa && v.notaFactura) {
      blocks.push({ type: 'note', text: 'Este recibo não substitui a factura.', en: 'This receipt does not replace the invoice.' });
    }
    return blocks;
  },
});
