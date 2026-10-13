import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type TemplateContext, type Warning } from '../model';
import { BLANK, GENERO_OPTIONS, cite, dateField, dateLong, exmo, isF, l, lawyerFields, lawyerSignature, localField, refField } from './_shared';
import { PARTE_TIPO_OPTIONS, isEmpresa, moneyExt, papel } from './_advocacia';

const clean = (s: unknown) => String(s ?? '').trim().replace(/[.;,]$/, '');

const ENVIO_OPTIONS = [
  { value: 'registada', label: l('Carta registada com aviso de recepção', 'Registered letter with acknowledgement of receipt') },
  { value: 'protocolo', label: l('Entrega em mão, contra assinatura', 'Hand delivery against signature') },
  { value: 'email', label: l('Email', 'Email') },
];

/** Sender lines for a lawyer writing with a personal profile (no company letterhead). */
function remetente(ctx: TemplateContext): Block[] {
  const p = ctx.profile;
  if (!p || p.kind !== 'pessoa') return [];
  const v = ctx.values;
  const lines = [
    `**${String(v.advogadoNome ?? '').trim() || p.nome || BLANK}**`,
    `${isF(v.advogadoGenero) ? 'Advogada' : 'Advogado'} — Carteira Profissional n.º ${String(v.advogadoCarteira ?? '').trim() || '________'} (OAM)`,
    String(v.advogadoDomicilio ?? '').trim() || addressLine(p),
    String(v.advogadoContacto ?? '').trim(),
  ].filter(Boolean);
  return [{ type: 'paragraph', id: 'remetente', text: lines.join('\n'), align: 'left', size: 'small', en: 'Sender’s name and contact details.' }];
}

export default defineTemplate({
  id: 'interpelacao-extrajudicial',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Referência, data e envio', 'Reference, date and delivery') },
    { id: 'destinatario', title: l('Destinatário (devedor)', 'Recipient (debtor)'), personRole: 'outro' },
    { id: 'cliente', title: l('Cliente (credor)', 'Client (creditor)'), personRole: 'cliente' },
    { id: 'obrigacao', title: l('Obrigação em falta', 'Unperformed obligation') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    { name: 'envio', type: 'select', section: 'documento', width: 'half', label: l('Forma de envio', 'Delivery'), options: ENVIO_OPTIONS, default: 'registada' },
    { name: 'destTipo', type: 'radio', section: 'destinatario', label: l('É', 'Is'), options: PARTE_TIPO_OPTIONS, default: 'empresa' },
    { name: 'destNome', type: 'text', section: 'destinatario', required: true, label: l('Nome ou firma', 'Name or company name'), personKey: 'nome' },
    { name: 'destGenero', type: 'radio', section: 'destinatario', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', showIf: (v) => v.destTipo !== 'empresa' },
    { name: 'destAtencao', type: 'text', section: 'destinatario', width: 'half', label: l('À atenção de (opcional)', 'For the attention of (optional)'), showIf: (v) => v.destTipo === 'empresa' },
    { name: 'destMorada', type: 'text', section: 'destinatario', required: true, label: l('Morada', 'Address'), personKey: 'morada' },
    { name: 'clienteNome', type: 'text', section: 'cliente', required: true, label: l('Nome ou firma do cliente', 'Client’s name or company name'), personKey: 'nome' },
    { name: 'clienteTipo', type: 'radio', section: 'cliente', width: 'half', label: l('É', 'Is'), options: PARTE_TIPO_OPTIONS, default: 'empresa' },
    { name: 'clienteGenero', type: 'radio', section: 'cliente', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', showIf: (v) => v.clienteTipo !== 'empresa' },
    {
      name: 'tipoObrigacao',
      type: 'radio',
      section: 'obrigacao',
      label: l('O que se exige', 'What is demanded'),
      default: 'pagamento',
      options: [
        { value: 'pagamento', label: l('Pagamento de uma quantia', 'Payment of a sum') },
        { value: 'outra', label: l('Outra obrigação (entregar, fazer, desocupar…)', 'Other obligation (deliver, do, vacate…)') },
      ],
    },
    {
      name: 'origem',
      type: 'textarea',
      section: 'obrigacao',
      rows: 3,
      required: true,
      label: l('Origem da obrigação', 'Origin of the obligation'),
      placeholder: l(
        'Ex.: Por contrato de empreitada celebrado em 3 de Março de 2026, V. Ex.ª obrigou-se a pagar ao nosso constituinte o preço da obra, titulado pelas facturas n.º 112/2026 e n.º 118/2026, vencidas em 30 de Junho de 2026.',
        'E.g. Under a contract signed on …, you undertook to pay …',
      ),
    },
    { name: 'valor', type: 'money', section: 'obrigacao', width: 'half', label: l('Valor em dívida', 'Amount owed'), showIf: (v) => v.tipoObrigacao !== 'outra' },
    { name: 'jurosDesde', type: 'date', section: 'obrigacao', width: 'half', label: l('Juros de mora desde (opcional)', 'Default interest since (optional)'), showIf: (v) => v.tipoObrigacao !== 'outra' },
    {
      name: 'prestacao',
      type: 'text',
      section: 'obrigacao',
      label: l('Obrigação a cumprir', 'Obligation to perform'),
      placeholder: l('Ex.: desocupar e entregar o imóvel sito na Rua …, livre de pessoas e bens', 'E.g. vacate and hand over the property'),
      showIf: (v) => v.tipoObrigacao === 'outra',
    },
    { name: 'prazoDias', type: 'number', section: 'obrigacao', width: 'half', min: 1, max: 90, default: 8, label: l('Prazo para cumprir (dias)', 'Time to comply (days)') },
    {
      name: 'formaPagamento',
      type: 'text',
      section: 'obrigacao',
      label: l('Como pagar (opcional)', 'How to pay (optional)'),
      placeholder: l('Ex.: transferência para a conta do nosso constituinte no BCI, NIB 0008 0000 1234 5678 101 23', 'E.g. bank transfer to account …'),
      showIf: (v) => v.tipoObrigacao !== 'outra',
    },
    { name: 'admitePlano', type: 'toggle', section: 'obrigacao', label: l('Admitir proposta de pagamento em prestações', 'Accept a proposal to pay in instalments'), showIf: (v) => v.tipoObrigacao !== 'outra' },
    ...lawyerFields('advogado'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `Guarde o aviso de recepção ou o duplicado assinado: prova a data da interpelação, a partir da qual o devedor fica em mora (${cite('codigoCivilMora')}).`,
          'Keep the acknowledgement of receipt or the signed copy: it proves the date of the demand, from which the debtor is in default.',
        ),
      },
      { level: 'info', message: l('Não ameace com queixa-crime para cobrar uma dívida civil: pode ser considerado coacção.', 'Do not threaten criminal charges to collect a civil debt: it may be treated as coercion.') },
    ];
    if (v.envio === 'email') {
      w.push({ level: 'warning', field: 'envio', message: l('O email pode ser difícil de provar. Prefira carta registada com aviso de recepção ou entrega contra assinatura.', 'Email may be hard to prove. Prefer registered mail or hand delivery.') });
    }
    if (!v.advogadoCarteira) w.push({ level: 'warning', field: 'advogadoCarteira', message: l('Indique o número da carteira profissional do advogado.', 'Enter the lawyer’s bar card number.') });
    return w;
  },

  personName: (v) => v.destNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const empresa = isEmpresa(v, 'dest');
    const tratamento = empresa ? 'Exmos. Senhores' : exmo(v.destGenero);
    const vExa = empresa ? 'V. Ex.ªs' : 'V. Ex.ª';
    const cliente = `**${clean(v.clienteNome) || BLANK}**`;
    const nossoConst = papel(v, 'cliente', 'o nosso constituinte', 'a nossa constituinte');
    const doConst = papel(v, 'cliente', 'do nosso constituinte', 'da nossa constituinte');
    const interpelado = empresa ? 'interpelados' : isF(v.destGenero) ? 'interpelada' : 'interpelado';
    const dias = Number(v.prazoDias) > 0 ? Number(v.prazoDias) : null;
    const prazo = dias ? `${dias} ${dias === 1 ? 'dia' : 'dias'}` : '____ dias';
    const pagamento = v.tipoObrigacao !== 'outra';

    const blocks: Block[] = [
      ...remetente(ctx),
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
    ];
    if (v.envio === 'registada') {
      blocks.push({ type: 'paragraph', id: 'envio', text: '**Carta registada com aviso de recepção**', align: 'left', size: 'small', editable: false, en: 'Registered letter with acknowledgement of receipt.' });
    } else if (v.envio === 'protocolo') {
      blocks.push({ type: 'paragraph', id: 'envio', text: '**Entregue por protocolo**', align: 'left', size: 'small', editable: false, en: 'Delivered by hand against signature.' });
    }
    blocks.push(
      {
        type: 'recipient',
        salutation: tratamento,
        lines: [clean(v.destNome) || BLANK, empresa && v.destAtencao ? `A/C: ${clean(v.destAtencao)}` : '', clean(v.destMorada)].filter(Boolean),
      },
      { type: 'subject', text: pagamento ? 'Interpelação para pagamento' : 'Interpelação para cumprimento' },
      { type: 'salutation', text: `${tratamento},` },
      {
        type: 'paragraph',
        id: 'mandato',
        text: `Na qualidade de mandatários de ${cliente}, e em seu nome e representação, comunicamos a ${vExa} o seguinte:`,
        en: 'As lawyers for the client named, and on its behalf, we inform you as follows:',
      },
      { type: 'paragraph', id: 'origem', text: `${clean(v.origem) || BLANK}.`, en: 'Origin of the obligation.' },
    );
    if (pagamento) {
      blocks.push({
        type: 'paragraph',
        id: 'incumprimento',
        text: `Até à presente data, e não obstante as insistências ${doConst}, ${vExa} não ${empresa ? 'procederam' : 'procedeu'} ao pagamento, encontrando-se em dívida a quantia de ${moneyExt(v.valor)}${v.jurosDesde ? `, acrescida de juros de mora desde ${dateLong(v.jurosDesde)}` : ', acrescida dos juros de mora legais'}.`,
        en: 'To date, despite our client’s requests, you have not paid the amount owed plus default interest.',
      });
      blocks.push({
        type: 'paragraph',
        id: 'interpelacao',
        text: `Assim, ${empresa ? 'ficam' : 'fica'} ${vExa}, pela presente, **${interpelado} para, no prazo de ${prazo} a contar da recepção desta carta, proceder${empresa ? 'em' : ''} ao pagamento da quantia de ${moneyExt(v.valor)}**${clean(v.formaPagamento) ? `, por ${clean(v.formaPagamento).replace(/^por\s+/i, '')}` : ''}.`,
        en: `You are hereby formally required to pay the amount within ${prazo} of receiving this letter.`,
      });
      if (v.admitePlano) {
        blocks.push({
          type: 'paragraph',
          id: 'plano',
          text: `${nossoConst.charAt(0).toUpperCase()}${nossoConst.slice(1)} está disponível para analisar, no mesmo prazo, uma proposta séria de pagamento em prestações, que deverá ser apresentada por escrito a este escritório.`,
          en: 'Our client will consider, within the same period, a serious written proposal to pay in instalments.',
        });
      }
    } else {
      blocks.push({
        type: 'paragraph',
        id: 'interpelacao',
        text: `Assim, ${empresa ? 'ficam' : 'fica'} ${vExa}, pela presente, **${interpelado} para, no prazo de ${prazo} a contar da recepção desta carta, ${clean(v.prestacao) || BLANK}**, sob pena de se considerar a obrigação definitivamente incumprida, para todos os efeitos legais.`,
        en: `You are hereby formally required to perform the obligation within ${prazo}, failing which it will be treated as definitively breached.`,
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'consequencia',
        text: `Decorrido o referido prazo sem que se mostre cumprida a obrigação, temos instruções para, sem mais aviso, instaurar o competente procedimento judicial contra ${vExa}, ${pagamento ? 'com vista à cobrança coerciva da dívida, acrescida de juros de mora, custas judiciais e demais encargos' : 'para exigir o cumprimento e a indemnização dos prejuízos causados, acrescida de custas judiciais e demais encargos'}.`,
        en: 'If the deadline passes without performance, we are instructed to start court proceedings without further notice.',
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', keepWithNext: true },
      { type: 'signatures', columns: [lawyerSignature(v)] },
    );
    return blocks;
  },
});
