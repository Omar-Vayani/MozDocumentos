// Nota de encomenda (purchase order): the buyer's written order to a supplier.
// It is not a fiscal document: the supplier issues the factura and the guia de
// remessa, which must quote the order number.

import { diffDays, formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { BLANK, cite, dateLong, FORMA_PAGAMENTO_OPTIONS, l, localField, refField } from './_shared';
import { dias, fm, int, issuerBlock, issuerName, issuerSignature, itemLines, IVA_OPTIONS, ivaLabel, ivaTaxaField, num, qtyText, semPonto, str, totais, type ItemLine } from './_comercio';

export default defineTemplate({
  id: 'nota-de-encomenda',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Nota de encomenda', 'Purchase order') },
    { id: 'fornecedor', title: l('Fornecedor', 'Supplier'), personRole: 'outro' },
    { id: 'itens', title: l('Bens e serviços', 'Goods and services') },
    { id: 'condicoes', title: l('Entrega e pagamento', 'Delivery and payment') },
    { id: 'assinaturas', title: l('Assinaturas', 'Signatures') },
  ],
  fields: [
    { ...refField(), label: l('Número da encomenda', 'Order number'), required: true },
    localField(),
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data da encomenda', 'Order date'), default: (c) => c.today },
    {
      name: 'tipo',
      type: 'radio',
      section: 'documento',
      width: 'half',
      label: l('Título', 'Heading'),
      options: [
        { value: 'encomenda', label: l('Nota de encomenda', 'Purchase order') },
        { value: 'requisicao', label: l('Requisição de compra', 'Purchase requisition') },
      ],
      default: 'encomenda',
    },
    { name: 'refCotacao', type: 'text', section: 'documento', width: 'half', label: l('Cotação / proposta do fornecedor n.º (opcional)', 'Supplier quote no. (optional)') },
    { name: 'centroCusto', type: 'text', section: 'documento', width: 'half', label: l('Projecto / centro de custo (opcional)', 'Project / cost centre (optional)') },

    { name: 'fornecedorNome', type: 'text', section: 'fornecedor', required: true, label: l('Nome ou firma do fornecedor', 'Supplier name'), personKey: 'nome' },
    { name: 'fornecedorNuit', type: 'text', section: 'fornecedor', width: 'half', label: l('NUIT', 'Tax number (NUIT)'), personKey: 'nuit' },
    { name: 'fornecedorContacto', type: 'text', section: 'fornecedor', width: 'half', label: l('Telefone / email', 'Phone / email'), personKey: 'telefone' },
    { name: 'fornecedorMorada', type: 'text', section: 'fornecedor', label: l('Morada', 'Address'), personKey: 'morada' },

    {
      name: 'itens',
      type: 'lines',
      section: 'itens',
      required: true,
      label: l('Bens e serviços encomendados', 'Goods and services ordered'),
      addLabel: l('Adicionar linha', 'Add line'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'unidade', type: 'text', label: l('Unidade', 'Unit'), placeholder: l('Ex.: un., cx., kg, saco', 'E.g. pcs, box, kg, bag') },
        { name: 'quantidade', type: 'number', label: l('Quantidade', 'Quantity'), min: 0 },
        { name: 'precoUnitario', type: 'money', label: l('Preço unitário', 'Unit price') },
      ],
      default: [{ descricao: '', unidade: '', quantidade: '', precoUnitario: '' }],
    },
    { name: 'descontoPct', type: 'number', section: 'itens', width: 'half', min: 0, max: 100, label: l('Desconto acordado (%)', 'Agreed discount (%)') },
    { name: 'ivaRegime', type: 'select', section: 'itens', width: 'half', label: l('IVA', 'VAT'), options: IVA_OPTIONS, default: 'acrescido' },
    ivaTaxaField('itens', (v) => v.ivaRegime !== 'naoAplica'),

    { name: 'localEntrega', type: 'text', section: 'condicoes', required: true, label: l('Local de entrega', 'Delivery place'), default: (c) => c.profile?.morada?.cidade ? [c.profile.morada.rua, c.profile.morada.numero ? `n.º ${c.profile.morada.numero}` : '', c.profile.morada.cidade].filter(Boolean).join(', ') : '' },
    { name: 'dataEntrega', type: 'date', section: 'condicoes', width: 'half', required: true, label: l('Data de entrega pretendida', 'Required delivery date') },
    {
      name: 'transporte',
      type: 'radio',
      section: 'condicoes',
      width: 'half',
      label: l('Transporte e descarga a cargo de', 'Transport and unloading paid by'),
      options: [
        { value: 'fornecedor', label: l('Fornecedor', 'Supplier') },
        { value: 'comprador', label: l('Comprador (levantamento)', 'Buyer (collection)') },
      ],
      default: 'fornecedor',
    },
    {
      name: 'pagamento',
      type: 'select',
      section: 'condicoes',
      width: 'half',
      label: l('Condições de pagamento', 'Payment terms'),
      options: [
        { value: 'prazo', label: l('A prazo, após a recepção da factura', 'On credit, after the invoice'), },
        { value: 'entrega', label: l('Na entrega, contra factura', 'On delivery, against invoice') },
        { value: 'adiantamento', label: l('Adiantamento e saldo na entrega', 'Advance and balance on delivery') },
      ],
      default: 'prazo',
    },
    { name: 'prazoPagamentoDias', type: 'number', section: 'condicoes', width: 'half', min: 0, max: 180, default: 30, label: l('Prazo de pagamento (dias)', 'Payment term (days)'), showIf: (v) => v.pagamento === 'prazo' },
    { name: 'adiantamentoPct', type: 'number', section: 'condicoes', width: 'half', min: 1, max: 100, label: l('Adiantamento (%)', 'Advance (%)'), showIf: (v) => v.pagamento === 'adiantamento' },
    { name: 'formaPagamento', type: 'select', section: 'condicoes', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    { name: 'validadeDias', type: 'number', section: 'condicoes', width: 'half', min: 1, max: 365, label: l('Validade da encomenda (dias, opcional)', 'Order valid for (days, optional)'), help: l('Se o fornecedor não confirmar dentro deste prazo, a encomenda caduca.', 'If the supplier does not confirm within this period, the order lapses.') },
    { name: 'observacoes', type: 'textarea', section: 'condicoes', rows: 3, label: l('Observações (opcional)', 'Notes (optional)'), placeholder: l('Ex.: entregar das 8h às 15h; marca e especificação exigidas', 'E.g. deliver 8am–3pm; brand and specification required') },
    { name: 'pedirConfirmacao', type: 'toggle', section: 'condicoes', default: true, label: l('Pedir confirmação do fornecedor no documento', 'Ask the supplier to confirm on the document') },

    { name: 'requisitante', type: 'text', section: 'assinaturas', width: 'half', label: l('Requisitado por', 'Requested by') },
    { name: 'autorizante', type: 'text', section: 'assinaturas', width: 'half', label: l('Autorizado por', 'Authorised by'), default: (c) => c.profile?.representanteNome || (c.profile?.kind === 'pessoa' ? c.profile.nome || '' : '') },
    { name: 'autorizanteCargo', type: 'text', section: 'assinaturas', width: 'half', label: l('Cargo de quem autoriza', 'Authoriser’s position'), default: (c) => c.profile?.representanteCargo || '' },
  ],

  computed: (v) => {
    const linhas = itemLines(v.itens);
    const taxa = num(v.ivaTaxa);
    return { linhas, taxa, ...totais(linhas, num(v.descontoPct), v.ivaRegime, taxa) };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [];
    if (!str(v.fornecedorNome)) w.push({ level: 'warning', field: 'fornecedorNome', message: l('Indique o fornecedor.', 'Enter the supplier.') });
    if (!c.linhas.length) w.push({ level: 'warning', field: 'itens', message: l('Acrescente pelo menos uma linha.', 'Add at least one line.') });
    if ((c.linhas as ItemLine[]).some((r) => r.preco == null)) w.push({ level: 'info', field: 'itens', message: l('Há linhas sem preço. Indique o preço acordado para evitar divergências na factura.', 'Some lines have no price. State the agreed price to avoid disputes on the invoice.') });
    if (v.dataEntrega && v.data && diffDays(v.data, v.dataEntrega) < 0) w.push({ level: 'error', field: 'dataEntrega', message: l('A data de entrega é anterior à data da encomenda.', 'The delivery date is before the order date.') });
    if (v.ivaRegime !== 'naoAplica' && num(v.ivaTaxa) == null) w.push({ level: 'error', field: 'ivaTaxa', message: l('Indique a taxa de IVA.', 'Enter the VAT rate.') });
    w.push({
      level: 'info',
      message: l(
        `Exija ao fornecedor a factura e a guia de remessa emitidas em impresso de tipografia autorizada ou por programa certificado (${cite('facturaTipografia')}). Sem factura válida, não pode deduzir o IVA nem justificar a despesa.`,
        'Require the supplier’s invoice and delivery note on authorised printed forms or certified software. Without a valid invoice you cannot deduct VAT or support the expense.',
      ),
    });
    return w;
  },

  personName: (v) => v.fornecedorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const linhas = c.linhas as ItemLine[];
    const req = v.tipo === 'requisicao';
    const titulo = req ? 'Requisição de compra' : 'Nota de encomenda';
    const pag =
      v.pagamento === 'entrega'
        ? 'na entrega, contra factura'
        : v.pagamento === 'adiantamento'
          ? `${num(v.adiantamentoPct) != null ? `${num(v.adiantamentoPct)}% ` : ''}de adiantamento contra factura; saldo na entrega`
          : `${dias(int(v.prazoPagamentoDias))} após a recepção da factura`;
    const forn = [
      `**${str(v.fornecedorNome) || BLANK}**`,
      str(v.fornecedorNuit) ? `NUIT ${str(v.fornecedorNuit)}` : 'NUIT ____________',
      semPonto(v.fornecedorMorada),
      str(v.fornecedorContacto),
      str(v.refCotacao) ? `V/ cotação n.º ${semPonto(v.refCotacao)}` : '',
    ].filter(Boolean);
    const cond = [
      `**Entrega:** ${v.dataEntrega ? formatDateShort(v.dataEntrega) : '___/___/______'}, ${semPonto(v.localEntrega) || BLANK}`,
      `**Transporte e descarga:** a cargo do ${v.transporte === 'comprador' ? 'comprador' : 'fornecedor'}`,
      `**Pagamento:** ${pag}${str(v.formaPagamento) ? `, por ${str(v.formaPagamento)}` : ''}`,
      int(v.validadeDias) ? `**Validade da encomenda:** ${dias(int(v.validadeDias))}` : '',
      str(v.centroCusto) ? `**Projecto:** ${semPonto(v.centroCusto)}` : '',
    ].filter(Boolean);
    const blocks: Block[] = [
      { type: 'title', text: titulo, subtitle: `N.º ${str(v.ref) || BLANK} · ${ctx.place}, ${dateLong(v.data)}` },
      ...issuerBlock(ctx, 'Comprador'),
      { type: 'box', label: 'Fornecedor', text: forn.join('\n'), width: 'half' },
      { type: 'box', label: 'Entrega e pagamento', text: cond.join('\n'), width: 'half' },
    ];

    const tableRows = linhas.length
      ? linhas.map((r, i) => [String(i + 1), r.descricao || '—', r.unidade, qtyText(r.quantidade), r.preco != null ? fm(r.preco) : '', r.preco != null ? fm(r.total) : ''])
      : [['1', BLANK, '', '', '', ''], ['2', '', '', '', '', ''], ['3', '', '', '', '', '']];
    const totals: string[][] = [['', 'Subtotal', '', '', '', fm(c.subtotal)]];
    if (c.desconto) totals.push(['', `Desconto${num(v.descontoPct) != null ? ` (${num(v.descontoPct)}%)` : ''}`, '', '', '', `−${fm(c.desconto)}`]);
    if (v.ivaRegime === 'acrescido') totals.push(['', ivaLabel(v.ivaRegime, c.taxa), '', '', '', fm(c.iva)]);
    totals.push(['', 'Total', '', '', '', fm(c.total)]);
    blocks.push({
      type: 'table',
      columns: [
        { label: 'N.º', width: 0.5, align: 'center' },
        { label: 'Descrição', width: 4.3 },
        { label: 'Unid.', width: 0.9, align: 'center' },
        { label: 'Quant.', width: 0.8, align: 'right' },
        { label: 'Preço unit.', width: 1.4, align: 'right' },
        { label: 'Total (MT)', width: 1.6, align: 'right' },
      ],
      rows: tableRows,
      totals,
      note: [
        v.ivaRegime === 'incluido' ? `Preços com IVA incluído (${ivaLabel('acrescido', c.taxa)}: ${fm(c.iva)} MT).` : v.ivaRegime === 'naoAplica' ? 'Valores sem IVA.' : '',
        'Este documento não é uma factura nem a substitui.',
      ].filter(Boolean).join(' '),
    });

    const obs = semPonto(v.observacoes);
    blocks.push({
      type: 'paragraph',
      id: 'ne-factura',
      text: `A factura e a guia de remessa devem indicar o número ${req ? 'desta requisição' : 'desta encomenda'} e ser emitidas em nome de ${issuerName(ctx)}${ctx.profile?.nuit ? `, NUIT ${ctx.profile.nuit}` : ''}. Os bens não conformes são devolvidos por conta do fornecedor.${obs ? ` **Observações:** ${obs}.` : ''}`,
      en: 'The invoice and delivery note must quote this order number and be issued to the buyer named above. Receipt is subject to checking; non-conforming goods are returned at the supplier’s cost.',
      size: 'small',
      keepWithNext: true,
    });

    const cols: SignatureColumn[] = [];
    if (str(v.requisitante)) cols.push({ role: 'Requisitado por', name: str(v.requisitante) });
    cols.push({ ...issuerSignature(ctx, 'Autorizado por'), name: str(v.autorizante) || undefined, detail: str(v.autorizanteCargo) || undefined });
    if (v.pedirConfirmacao) cols.push({ role: 'Confirmação do fornecedor', name: str(v.fornecedorNome) || undefined, detail: 'Data: ___/___/______' });
    blocks.push({ type: 'signatures', columns: cols.slice(0, 3) });
    return blocks;
  },
});
