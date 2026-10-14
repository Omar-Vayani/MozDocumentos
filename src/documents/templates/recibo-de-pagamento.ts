import { parseISODate } from '@/lib/format';
import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import {
  blank, dateField, dateLong, DOC_TIPO_OPTIONS, employerRep, FORMA_PAGAMENTO_OPTIONS, formatMoney, g, GENERO_OPTIONS, l, localField, money,
  cite, placeDate, refField, splitLines,
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
      return { pt: `através de ${forma}`, en: `via ${forma}` };
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
  family: 'recibo',
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
      name: 'recebedorGenero',
      type: 'radio',
      section: 'recebedor',
      width: 'half',
      label: l('Tratamento', 'Form of address'),
      options: GENERO_OPTIONS,
      default: (c) => (c.profile?.kind === 'pessoa' && c.profile.genero) || 'M',
      showIf: (v) => v.recebedorTipo === 'pessoa',
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
      name: 'natureza',
      type: 'select',
      section: 'pagamento',
      width: 'half',
      label: l('Natureza do pagamento', 'Nature of the payment'),
      options: [
        { value: 'pagamento', label: l('Pagamento', 'Payment') },
        { value: 'sinal', label: l('Sinal (garante um contrato)', 'Deposit (secures a contract)') },
        { value: 'adiantamento', label: l('Adiantamento por conta do preço', 'Advance on account of the price') },
      ],
      default: 'pagamento',
      help: l('O sinal tem efeitos legais: perde-o quem desiste; quem o recebeu e não cumpre devolve-o em dobro.', 'A deposit has legal effects: forfeited by the payer who withdraws; returned double by the recipient who defaults.'),
    },
    {
      name: 'contratoReferencia',
      type: 'text',
      section: 'pagamento',
      width: 'half',
      label: l('Contrato, encomenda ou orçamento', 'Contract, order or quote'),
      placeholder: l('Ex.: contrato-promessa de 3 de Outubro de 2026; orçamento n.º 45', 'E.g. promise of sale of 3 October 2026; quote no. 45'),
      showIf: (v) => v.natureza === 'sinal' || v.natureza === 'adiantamento',
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
    if ((v.natureza === 'sinal' || v.natureza === 'adiantamento') && v.recebedorTipo === 'empresa') {
      w.push({
        level: 'warning',
        field: 'natureza',
        message: l(
          `Se a empresa é sujeito passivo de IVA, o recebimento de um sinal ou adiantamento pode obrigar à emissão de factura (ou factura-recibo) pelo valor recebido, em impresso de tipografia autorizada ou programa certificado (${cite('ivaAdiantamento')}). Este recibo não a substitui. Confirme com o seu contabilista.`,
          'If the company is VAT-registered, receiving a deposit or advance may require an invoice (or invoice-receipt) for the amount, on authorised forms or certified software. This receipt does not replace it. Check with your accountant.',
        ),
      });
    }
    if (v.natureza === 'sinal') {
      w.push({ level: 'info', field: 'natureza', message: l(`O sinal segue o regime do ${cite('contratoPromessaSinal')}: quem o entregou e desiste perde-o; quem o recebeu e não cumpre devolve-o em dobro. Indique o contrato a que respeita.`, 'A deposit is forfeited by the payer who withdraws and returned double by the recipient who defaults. State the contract it relates to.') });
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
      !empresa && v.recebedorDocNumero ? `${g(v.recebedorGenero, 'portador', 'portadora')} do ${v.recebedorDocTipo || 'BI'} n.º ${v.recebedorDocNumero}` : '',
      v.recebedorNuit ? `NUIT ${v.recebedorNuit}` : '',
    ].filter(Boolean).join(', ');
    const pagadorPt = `**${blank(v.pagadorNome)}**${v.pagadorNuit ? `, NUIT ${v.pagadorNuit}` : ''}`;
    const valorPt = valor != null && valor > 0 ? formatMoney(valor) : formatMoney(null);
    const titulo = v.natureza === 'sinal' ? 'a título de sinal' : v.natureza === 'adiantamento' ? 'a título de adiantamento por conta do preço' : '';
    const ref = clean(v.contratoReferencia);
    // "no âmbito do contrato-promessa…", "da encomenda n.º …": the article follows the first word.
    const art = /^(contrato|or[çc]amento|acordo|pedido)\b/i.test(ref) ? 'do' : /^(encomenda|proposta|factura|nota|requisi[çc][ãa]o)\b/i.test(ref) ? 'da' : 'de';
    const contrato = titulo && ref ? `, no âmbito ${art} ${ref}` : '';
    const referente = `${titulo ? `${titulo}${contrato}, ` : ''}${itens.length > 1 ? 'referente ao seguinte:' : `referente a ${itens[0] || blank('')}.`}`;

    const blocks: Block[] = [
      { type: 'title', text: `${v.natureza === 'sinal' ? 'Recibo de sinal' : v.natureza === 'adiantamento' ? 'Recibo de adiantamento' : 'Recibo'}${v.ref ? ` n.º ${v.ref}` : ''}` },
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
        text: v.natureza === 'sinal' || v.natureza === 'adiantamento'
          ? 'Por ser verdade, passa-se o presente recibo da quantia recebida, que será imputada no preço.'
          : 'Por ser verdade, passa-se o presente recibo, que dá plena quitação da quantia recebida.',
        en: v.natureza === 'sinal' || v.natureza === 'adiantamento' ? 'This receipt is issued for the amount received, which will be credited against the price.' : 'This receipt is issued as full discharge for the amount received.',
        keepWithNext: true,
      },
    );

    const rep = employerRep(ctx);
    const sig: SignatureColumn = empresa
      ? { role: 'Pelo Recebedor', name: rep.nome || undefined, detail: rep.cargo || undefined, image: 'both' }
      : { role: g(v.recebedorGenero, 'O Recebedor', 'A Recebedora'), name: v.recebedorNome || undefined, image: 'signature' };
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [sig] });

    if (empresa && v.notaFactura) {
      blocks.push({ type: 'note', text: 'Este recibo não substitui a factura.', en: 'This receipt does not replace the invoice.' });
    }
    return blocks;
  },
});
