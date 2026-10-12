import { addDays, diffDays, formatDateShort, roundMoney } from '@/lib/format';
import { profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerRep, exmo, formatMoney, g, l, lineItems, localField, money, refField, workerFields } from './_shared';

// ---------------------------------------------------------------- local helpers

const devedorEmpresa = (v: Values) => v.devedorTipo === 'empresa';
const segunda = (v: Values) => Boolean(v.segundaInterpelacao);
const clean = (s: unknown) => String(s ?? '').trim().replace(/[.;,]$/, '');

type Factura = { numero: string; data: string; vencimento: string; valor: number | null };

function facturas(v: Values): Factura[] {
  return lineItems(v.facturas)
    .map((r) => ({
      numero: String(r.numero ?? '').trim(),
      data: String(r.data ?? '').trim(),
      vencimento: String(r.vencimento ?? '').trim(),
      valor: money(r.valor),
    }))
    .filter((f) => f.numero || f.valor != null);
}

const ORIGEM_OPTIONS = [
  { value: 'factura', label: l('Factura', 'Invoice') },
  { value: 'contrato', label: l('Contrato', 'Contract') },
  { value: 'outra', label: l('Outra (descrever)', 'Other (describe)') },
];

const ENVIO_OPTIONS = [
  { value: 'registada', label: l('Carta registada com aviso de recepção', 'Registered letter with acknowledgement of receipt') },
  { value: 'protocolo', label: l('Entrega em mão, contra assinatura', 'Hand delivery against signature') },
  { value: 'email', label: l('Email', 'Email') },
];

export default defineTemplate({
  id: 'carta-de-cobranca',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'devedor', title: l('Devedor (quem deve)', 'Debtor (who owes)'), personRole: 'cliente' },
    { id: 'divida', title: l('Dívida', 'Debt') },
    { id: 'prazo', title: l('Prazo e pagamento', 'Deadline and payment') },
    { id: 'assinatura', title: l('Assinatura e envio', 'Signature and delivery') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    {
      name: 'segundaInterpelacao',
      type: 'toggle',
      section: 'documento',
      label: l('É a 2.ª interpelação', 'This is the 2nd demand'),
      help: l('Use quando já enviou uma primeira carta sem resposta. O tom é mais firme.', 'Use when a first letter went unanswered. The tone is firmer.'),
    },
    {
      name: 'dataPrimeira',
      type: 'date',
      section: 'documento',
      width: 'half',
      label: l('Data da 1.ª interpelação', 'Date of the 1st demand'),
      showIf: segunda,
    },
    {
      name: 'devedorTipo',
      type: 'radio',
      section: 'devedor',
      label: l('O devedor é', 'The debtor is'),
      options: [
        { value: 'pessoa', label: l('Uma pessoa', 'An individual') },
        { value: 'empresa', label: l('Uma empresa ou instituição', 'A company or institution') },
      ],
      default: 'empresa',
    },
    ...workerFields(['nome', 'genero'], 'devedor', 'devedor').map((f) =>
      f.name === 'devedorGenero'
        ? { ...f, showIf: (v: Values) => !devedorEmpresa(v) }
        : { ...f, label: l('Nome ou firma do devedor', 'Debtor’s name or company name') },
    ),
    {
      name: 'devedorAtencao',
      type: 'text',
      section: 'devedor',
      width: 'half',
      label: l('À atenção de (opcional)', 'For the attention of (optional)'),
      placeholder: l('Ex.: Director Financeiro', 'E.g. Finance Director'),
      showIf: devedorEmpresa,
    },
    { name: 'devedorNuit', type: 'text', section: 'devedor', width: 'half', label: l('NUIT (opcional)', 'Tax number (optional)'), personKey: 'nuit' },
    { name: 'devedorMorada', type: 'text', section: 'devedor', label: l('Morada', 'Address'), personKey: 'morada' },
    { name: 'origemTipo', type: 'select', section: 'divida', width: 'half', label: l('Origem da dívida', 'Origin of the debt'), options: ORIGEM_OPTIONS, default: 'factura' },
    {
      name: 'origemNumero',
      type: 'text',
      section: 'divida',
      width: 'half',
      label: l('Número da factura ou contrato', 'Invoice or contract number'),
      showIf: (v) => v.origemTipo !== 'outra',
    },
    { name: 'origemData', type: 'date', section: 'divida', width: 'half', label: l('Data da factura ou contrato', 'Invoice or contract date') },
    {
      name: 'origemVencimento',
      type: 'date',
      section: 'divida',
      width: 'half',
      label: l('Data de vencimento (opcional)', 'Due date (optional)'),
      showIf: (v) => v.origemTipo !== 'outra',
    },
    {
      name: 'origemDescricao',
      type: 'text',
      section: 'divida',
      label: l('Descrição (opcional)', 'Description (optional)'),
      placeholder: l('Ex.: fornecimento de material de construção', 'E.g. supply of building materials'),
      help: l('Continua a frase «…relativa a …» ou, se escolheu «Outra», «Em resultado de …».', 'Continues “…relating to …”, or with “Other”, “As a result of …”.'),
    },
    {
      name: 'facturas',
      type: 'lines',
      section: 'divida',
      label: l('Facturas em aberto (opcional)', 'Unpaid invoices (optional)'),
      help: l('Use quando a dívida corresponde a várias facturas.', 'Use when the debt covers several invoices.'),
      addLabel: l('Adicionar factura', 'Add invoice'),
      columns: [
        { name: 'numero', type: 'text', label: l('Factura n.º', 'Invoice no.') },
        { name: 'data', type: 'date', label: l('Data', 'Date') },
        { name: 'vencimento', type: 'date', label: l('Vencimento', 'Due date') },
        { name: 'valor', type: 'money', label: l('Valor em dívida', 'Amount due') },
      ],
      default: [],
    },
    {
      name: 'valor',
      type: 'money',
      section: 'divida',
      width: 'half',
      required: true,
      label: l('Valor total em dívida', 'Total amount owed'),
      help: l('Se deixar vazio e indicar facturas, usa a soma das facturas.', 'If empty and invoices are listed, their total is used.'),
      computedKey: 'totalFacturas',
    },
    {
      name: 'prazoModo',
      type: 'radio',
      section: 'prazo',
      label: l('Prazo para pagar', 'Deadline to pay'),
      options: [
        { value: 'dias', label: l('Número de dias após a carta', 'Number of days after the letter') },
        { value: 'data', label: l('Uma data concreta', 'A specific date') },
      ],
      default: 'dias',
    },
    {
      name: 'prazoDias',
      type: 'number',
      section: 'prazo',
      width: 'half',
      min: 1,
      max: 90,
      default: 8,
      label: l('Dias para pagar', 'Days to pay'),
      showIf: (v) => v.prazoModo !== 'data',
    },
    { name: 'prazoData', type: 'date', section: 'prazo', width: 'half', label: l('Pagar até', 'Pay by'), showIf: (v) => v.prazoModo === 'data' },
    { name: 'banco', type: 'text', section: 'prazo', width: 'half', label: l('Banco', 'Bank'), default: (c) => c.profile?.banco ?? '' },
    { name: 'nib', type: 'text', section: 'prazo', width: 'half', label: l('NIB', 'Bank account (NIB)'), default: (c) => c.profile?.nib ?? '' },
    {
      name: 'titularConta',
      type: 'text',
      section: 'prazo',
      width: 'half',
      label: l('Titular da conta (opcional)', 'Account holder (optional)'),
      default: (c) => profileDisplayName(c.profile),
    },
    { name: 'mpesa', type: 'tel', section: 'prazo', width: 'half', label: l('M-Pesa / e-Mola (opcional)', 'M-Pesa / e-Mola (optional)') },
    {
      name: 'referenciaPagamento',
      type: 'text',
      section: 'prazo',
      label: l('Indicar no pagamento (opcional)', 'Payment reference (optional)'),
      placeholder: l('Ex.: o número da factura', 'E.g. the invoice number'),
    },
    {
      name: 'juros',
      type: 'toggle',
      section: 'prazo',
      default: true,
      label: l('Mencionar juros de mora', 'Mention late-payment interest'),
      help: l('Depois do prazo, o devedor passa a dever também juros de mora à taxa legal.', 'After the deadline the debtor also owes default interest at the legal rate.'),
    },
    {
      name: 'acordo',
      type: 'toggle',
      section: 'prazo',
      default: true,
      label: l('Admitir um acordo de pagamento', 'Offer to agree a payment plan'),
    },
    {
      name: 'contacto',
      type: 'text',
      section: 'assinatura',
      label: l('Contacto para esclarecimentos', 'Contact for queries'),
      default: (c) => [c.profile?.telefones, c.profile?.email].filter(Boolean).join(' / '),
    },
    { name: 'envio', type: 'select', section: 'assinatura', width: 'half', label: l('Forma de envio', 'Delivery'), options: ENVIO_OPTIONS, default: 'registada' },
    {
      name: 'signatarioNome',
      type: 'text',
      section: 'assinatura',
      width: 'half',
      label: l('Quem assina', 'Signatory'),
      default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.nome ?? '' : c.profile?.representanteNome ?? ''),
    },
    {
      name: 'signatarioCargo',
      type: 'text',
      section: 'assinatura',
      width: 'half',
      label: l('Cargo de quem assina', 'Signatory’s position'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteCargo ?? '' : ''),
    },
  ],

  computed: (v) => {
    const fs = facturas(v);
    const soma = fs.reduce((s, f) => s + (f.valor ?? 0), 0);
    const totalFacturas = fs.some((f) => f.valor != null) ? roundMoney(soma) : null;
    const valor = money(v.valor) ?? totalFacturas;
    const dias = Math.max(1, Math.floor(Number(v.prazoDias) || 0));
    const prazo = v.prazoModo === 'data' ? (v.prazoData || null) : v.data ? addDays(v.data, dias) : null;
    return { totalFacturas, valor, dias, prazo };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const c = ctx.computed;
    if (!v.devedorNome) w.push({ level: 'warning', field: 'devedorNome', message: l('Indique o devedor.', 'Enter the debtor.') });
    if (!v.devedorMorada) w.push({ level: 'info', field: 'devedorMorada', message: l('Indique a morada do devedor para envio da carta.', 'Enter the debtor’s address for delivery.') });
    if (c.valor == null) w.push({ level: 'warning', field: 'valor', message: l('Indique o valor em dívida.', 'Enter the amount owed.') });
    const m = money(v.valor);
    if (m != null && c.totalFacturas != null && Math.abs(m - c.totalFacturas) >= 0.01) {
      w.push({
        level: 'warning',
        field: 'valor',
        message: l(
          `O valor total (${formatMoney(m)}) é diferente da soma das facturas (${formatMoney(c.totalFacturas)}).`,
          `The total (${formatMoney(m)}) differs from the sum of the invoices (${formatMoney(c.totalFacturas)}).`,
        ),
      });
    }
    if (v.origemTipo !== 'outra' && !v.origemNumero && !facturas(v).length) {
      w.push({ level: 'info', field: 'origemNumero', message: l('Indique o número da factura ou do contrato.', 'Enter the invoice or contract number.') });
    }
    if (v.origemTipo === 'outra' && !v.origemDescricao) {
      w.push({ level: 'warning', field: 'origemDescricao', message: l('Descreva a origem da dívida.', 'Describe where the debt comes from.') });
    }
    if (v.prazoModo === 'data') {
      if (!v.prazoData) w.push({ level: 'warning', field: 'prazoData', message: l('Indique a data limite de pagamento.', 'Enter the payment deadline.') });
      else if (v.data && diffDays(v.data, v.prazoData) <= 0) {
        w.push({ level: 'error', field: 'prazoData', message: l('A data limite tem de ser posterior à data da carta.', 'The deadline must be after the date of the letter.') });
      }
    }
    if (c.prazo && v.data && v.envio === 'registada' && diffDays(v.data, c.prazo) < 5) {
      w.push({
        level: 'info',
        field: v.prazoModo === 'data' ? 'prazoData' : 'prazoDias',
        message: l('O prazo é curto para uma carta registada: o devedor pode recebê-la depois de o prazo começar.', 'The deadline is short for a registered letter: the debtor may receive it late.'),
      });
    }
    if (!v.nib && !v.mpesa) {
      w.push({ level: 'info', field: 'nib', message: l('Indique como pagar (NIB ou M-Pesa) para facilitar o pagamento.', 'Add payment details (NIB or M-Pesa) to make paying easier.') });
    }
    if (segunda(v) && !v.dataPrimeira) {
      w.push({ level: 'info', field: 'dataPrimeira', message: l('Indique a data da primeira carta.', 'Enter the date of the first letter.') });
    }
    if (!v.signatarioNome) w.push({ level: 'info', field: 'signatarioNome', message: l('Indique quem assina a carta.', 'Enter who signs the letter.') });
    return w;
  },

  personName: (v) => v.devedorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const p = ctx.profile;
    const pessoa = p?.kind === 'pessoa';
    const credor = profileDisplayName(p) || BLANK;
    const empresa = devedorEmpresa(v);
    const ge = v.devedorGenero;
    const vEx = empresa ? 'V. Ex.ªs' : 'V. Ex.ª';
    const tratamento = empresa ? 'Exmos. Senhores' : exmo(ge);
    const fs = facturas(v);
    const nos = (plural: string, singular: string) => (pessoa ? singular : plural);
    const reserva = pessoa ? 'reservo-me' : `a **${credor}** reserva-se`;
    const aoCredor = pessoa ? `para comigo` : `para com a **${credor}**`;
    const blocks: Block[] = [];

    if (pessoa && p) {
      const lines = [
        `**${p.nome || BLANK}**`,
        addressLine(p),
        [p.telefones ? `Tel.: ${p.telefones}` : '', p.email ? `Email: ${p.email}` : ''].filter(Boolean).join(' · '),
      ].filter(Boolean);
      blocks.push({ type: 'paragraph', id: 'remetente', text: lines.join('\n'), align: 'left', size: 'small', en: 'Sender’s name and contact details.' });
    }

    blocks.push({ type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) });
    if (v.envio === 'registada') {
      blocks.push({ type: 'paragraph', id: 'envio', text: '**Carta registada com aviso de recepção**', align: 'left', size: 'small', editable: false, en: 'Registered letter with acknowledgement of receipt.' });
    }
    blocks.push({
      type: 'recipient',
      salutation: tratamento,
      lines: [
        v.devedorNome || BLANK,
        empresa && v.devedorAtencao ? `A/C: ${clean(v.devedorAtencao)}` : '',
        v.devedorNuit ? `NUIT ${clean(v.devedorNuit)}` : '',
        clean(v.devedorMorada),
      ].filter(Boolean),
    });

    const origemNum = clean(v.origemNumero);
    const origemRef =
      v.origemTipo === 'contrato'
        ? `Contrato n.º ${origemNum || BLANK}`
        : v.origemTipo === 'factura'
          ? fs.length > 1
            ? 'Facturas em aberto'
            : `Factura n.º ${origemNum || fs[0]?.numero || BLANK}`
          : '';
    blocks.push(
      { type: 'subject', text: `${segunda(v) ? '2.ª interpelação para pagamento' : 'Interpelação para pagamento'}${origemRef ? ` — ${origemRef}` : ''}` },
      { type: 'salutation', text: `${tratamento},` },
    );

    // Origin of the debt
    const desc = clean(v.origemDescricao);
    const data = v.origemData ? `, de ${dateLong(v.origemData)}` : '';
    const venc = v.origemVencimento ? `, vencida em ${dateLong(v.origemVencimento)}` : '';
    let origem: string;
    if (v.origemTipo === 'contrato') {
      origem = `Ao abrigo do contrato n.º ${origemNum || BLANK}${v.origemData ? `, celebrado em ${dateLong(v.origemData)}` : ''}${desc ? `, relativo a ${desc}` : ''}`;
    } else if (v.origemTipo === 'outra') {
      origem = `Em resultado de ${desc || BLANK}${v.origemData ? `, em ${dateLong(v.origemData)}` : ''}`;
    } else if (fs.length > 1 && !origemNum) {
      origem = `Em resultado das facturas abaixo discriminadas${desc ? `, relativas a ${desc}` : ''}`;
    } else {
      origem = `Nos termos da factura n.º ${origemNum || fs[0]?.numero || BLANK}${data}${desc ? `, relativa a ${desc}` : ''}${venc}`;
    }
    blocks.push({
      type: 'paragraph',
      id: 'origem',
      text: `${origem}, encontra-se em dívida ${aoCredor} o montante abaixo indicado, cujo prazo de pagamento se encontra ultrapassado.`,
      en: `Under the ${v.origemTipo === 'contrato' ? 'contract' : v.origemTipo === 'factura' ? 'invoice' : 'transaction'} stated, the amount below is owed to ${credor} and is overdue.`,
      keepWithNext: true,
    });
    blocks.push({ type: 'amount', label: 'Valor em dívida', value: c.valor ?? null });

    if (fs.length) {
      blocks.push({
        type: 'table',
        columns: [
          { label: 'Factura n.º', width: 2 },
          { label: 'Data', width: 1.4, align: 'center' },
          { label: 'Vencimento', width: 1.4, align: 'center' },
          { label: 'Valor em dívida', width: 2, align: 'right' },
        ],
        rows: fs.map((f) => [f.numero || BLANK, formatDateShort(f.data, '—'), formatDateShort(f.vencimento, '—'), f.valor != null ? formatMoney(f.valor) : '—']),
        totals: c.totalFacturas != null ? [['Total', '', '', formatMoney(c.totalFacturas)]] : undefined,
      });
    }

    // History
    blocks.push({
      type: 'paragraph',
      id: 'historico',
      text: segunda(v)
        ? `Por carta${v.dataPrimeira ? ` de ${dateLong(v.dataPrimeira)}` : ' anterior'}, ${nos('interpelámos', 'interpelei')} ${vEx} para proceder ao pagamento deste montante. Até à presente data, o pagamento não foi efectuado nem ${nos('recebemos', 'recebi')} qualquer justificação.`
        : `Até à presente data, e apesar de vencido, o referido montante não foi pago.`,
      en: segunda(v)
        ? 'A previous letter asked you to pay this amount. To date it has not been paid and no explanation has been received.'
        : 'To date, although due, the amount has not been paid.',
    });

    // The demand
    const prazoTxt = `**${dateLong(c.prazo)}**`;
    const prazoDias = v.prazoModo === 'data' ? '' : ` (${c.dias} ${c.dias === 1 ? 'dia' : 'dias'} a contar da data desta carta)`;
    blocks.push({
      type: 'paragraph',
      id: 'interpelacao',
      text: segunda(v)
        ? `Assim, ${nos('interpelamos', 'interpelo')} ${vEx}, pela segunda vez, para pagar a totalidade do valor em dívida até ${prazoTxt}${prazoDias}.`
        : `Assim, ${nos('solicitamos', 'solicito')} a ${vEx} que proceda ao pagamento da totalidade do valor em dívida até ${prazoTxt}${prazoDias}.`,
      en: `${segunda(v) ? 'For the second time, you are formally required' : 'You are asked'} to pay the full amount by ${c.prazo ?? 'the date stated'}.`,
    });

    // Payment details
    const pagamento = [
      v.banco ? { label: 'Banco', value: clean(v.banco) } : null,
      v.nib ? { label: 'NIB', value: clean(v.nib) } : null,
      v.nib && v.titularConta ? { label: 'Titular', value: clean(v.titularConta) } : null,
      v.mpesa ? { label: 'M-Pesa / e-Mola', value: clean(v.mpesa) } : null,
      v.referenciaPagamento ? { label: 'Indicar no pagamento', value: clean(v.referenciaPagamento) } : null,
    ].filter((x): x is { label: string; value: string } => x != null);
    if (pagamento.length) blocks.push({ type: 'keyValue', title: 'Dados para pagamento', columns: 1, items: pagamento });

    // Default and legal action
    const constituido = empresa ? 'ficam constituídos' : g(ge, 'fica constituído', 'fica constituída');
    const mora = `Findo este prazo sem que o pagamento se mostre efectuado, ${vEx} ${constituido} em mora, nos termos dos ${cite('codigoCivilMora')}${v.juros ? ', respondendo pelos juros de mora à taxa legal até integral pagamento e pelos demais prejuízos causados' : ''}.`;
    blocks.push({
      type: 'paragraph',
      id: 'mora',
      text: mora,
      en: `After the deadline you will be in default under the Civil Code${v.juros ? ', owing default interest at the legal rate until full payment and any other damage caused' : ''}.`,
    });
    blocks.push({
      type: 'paragraph',
      id: 'accaoJudicial',
      text: segunda(v)
        ? `Na falta de pagamento no prazo indicado, ${reserva} o direito de recorrer, sem outro aviso, às vias judiciais para cobrança do valor em dívida, acrescido dos juros e das despesas a que houver lugar.`
        : `Na falta de pagamento, ${reserva} o direito de recorrer às vias judiciais para cobrança do valor em dívida, acrescido dos juros e das despesas a que houver lugar.`,
      en: `If payment is not made, ${credor} reserves the right to take legal action${segunda(v) ? ' without further notice' : ''} to recover the debt, plus interest and costs.`,
    });

    const contacto = clean(v.contacto);
    const vb = (sg: string, pl: string) => (empresa ? pl : sg);
    const acordo = v.acordo
      ? `Caso ${vb('pretenda', 'pretendam')} propor um plano de pagamento, ou se o pagamento já tiver sido efectuado, ${nos('solicitamos', 'solicito')} que ${nos('nos', 'me')} ${vb('contacte', 'contactem')} antes do termo do prazo${contacto ? `, através de ${contacto}` : ''}, enviando o respectivo comprovativo quando for o caso.`
      : `Se o pagamento já tiver sido efectuado, ${nos('solicitamos', 'solicito')} que ${nos('nos', 'me')} ${vb('envie', 'enviem')} o respectivo comprovativo${contacto ? ` através de ${contacto}` : ''} e ${vb('considere', 'considerem')} sem efeito a presente carta.`;
    blocks.push({
      type: 'paragraph',
      id: 'contacto',
      text: acordo,
      en: v.acordo
        ? 'If you wish to propose a payment plan, or if payment has already been made, please get in touch before the deadline and send proof of payment where applicable.'
        : 'If payment has already been made, please send proof of payment and disregard this letter.',
    });

    const rep = employerRep(ctx);
    const signer: SignatureColumn = pessoa
      ? { role: ' ', name: v.signatarioNome || p?.nome || undefined }
      : { role: v.signatarioCargo || rep.cargo || ' ', name: v.signatarioNome || rep.nome || undefined, image: 'both' };
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', columns: [signer] },
    );
    if (v.envio === 'protocolo') {
      blocks.push({
        type: 'acknowledgement',
        text: 'Recebi o original desta carta em ___/___/______.',
        signer: empresa ? 'Pelo Devedor' : g(ge, 'O Devedor', 'A Devedora'),
      });
    }
    return blocks;
  },
});
