// Contrato de compra e venda de bens móveis (equipamento, mercadoria, mobiliário,
// gado). Vehicles and boats subject to registration use the declaração de venda.

import { roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, int, isEmpresa, lines, numerar, papel, partesBlocks,
  partyFields, partyName, partyWarnings, quantos, semPonto, str, testemunhasField, valorTexto,
} from './_contratos';

const IVA_OPTIONS = [
  { value: 'incluido', label: l('IVA incluído no preço', 'VAT included') },
  { value: 'acrescido', label: l('Acresce IVA à taxa legal', 'Plus VAT at the legal rate') },
  { value: 'naoAplica', label: l('Sem IVA (vendedor não registado ou isento)', 'No VAT (seller not registered or exempt)') },
];

export default defineTemplate({
  id: 'contrato-compra-venda-bens',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'vendedor', title: l('Vendedor', 'Seller'), personRole: 'outro' },
    { id: 'comprador', title: l('Comprador', 'Buyer'), personRole: 'cliente' },
    { id: 'bens', title: l('Bens vendidos', 'Goods sold') },
    { id: 'pagamento', title: l('Preço e pagamento', 'Price and payment') },
    { id: 'entrega', title: l('Entrega e garantia', 'Delivery and warranty') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('vendedor', { fromProfile: true, conjuge: true }),
    ...partyFields('comprador'),

    {
      name: 'bens',
      type: 'lines',
      section: 'bens',
      required: true,
      label: l('Bens', 'Goods'),
      help: l('Identifique cada bem com marca, modelo e número de série, quando existam.', 'Identify each item with make, model and serial number where available.'),
      addLabel: l('Adicionar bem', 'Add item'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'serie', type: 'text', label: l('Marca, modelo, n.º de série', 'Make, model, serial no.') },
        { name: 'quantidade', type: 'number', label: l('Quant.', 'Qty'), min: 1 },
        { name: 'precoUnitario', type: 'money', label: l('Preço unitário', 'Unit price') },
      ],
      default: [{ descricao: '', serie: '', quantidade: 1, precoUnitario: '' }],
    },
    {
      name: 'estadoBens',
      type: 'radio',
      section: 'bens',
      label: l('Estado dos bens', 'Condition'),
      options: [
        { value: 'novo', label: l('Novos', 'New') },
        { value: 'usado', label: l('Usados', 'Used') },
      ],
      default: 'novo',
    },

    { name: 'ivaRegime', type: 'select', section: 'pagamento', width: 'half', label: l('IVA', 'VAT'), options: IVA_OPTIONS, default: 'incluido' },
    {
      name: 'pagamento',
      type: 'radio',
      section: 'pagamento',
      width: 'half',
      label: l('Pagamento', 'Payment'),
      options: [
        { value: 'pronto', label: l('De uma só vez', 'In full') },
        { value: 'prestacoes', label: l('Em prestações', 'In instalments') },
      ],
      default: 'pronto',
    },
    { name: 'dataPagamento', type: 'date', section: 'pagamento', width: 'half', label: l('Data de pagamento', 'Payment date'), showIf: (v) => v.pagamento !== 'prestacoes', default: (c) => c.today },
    { name: 'entradaValor', type: 'money', section: 'pagamento', width: 'half', label: l('Entrada (na assinatura)', 'Down payment (on signing)'), showIf: (v) => v.pagamento === 'prestacoes' },
    { name: 'prestacoesNumero', type: 'number', section: 'pagamento', width: 'half', min: 2, max: 60, default: 3, label: l('Número de prestações', 'Number of instalments'), showIf: (v) => v.pagamento === 'prestacoes' },
    { name: 'primeiraPrestacao', type: 'date', section: 'pagamento', width: 'half', label: l('Vencimento da 1.ª prestação', 'First instalment due'), showIf: (v) => v.pagamento === 'prestacoes' },
    { name: 'formaPagamento', type: 'select', section: 'pagamento', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    { name: 'nib', type: 'text', section: 'pagamento', width: 'half', label: l('NIB / conta do vendedor', 'Seller’s account (NIB)') },
    {
      name: 'reservaPropriedade',
      type: 'toggle',
      section: 'pagamento',
      label: l('Reserva de propriedade até ao pagamento total', 'Seller keeps ownership until paid in full'),
      help: l('O vendedor continua dono dos bens até receber todo o preço. Recomendado nas vendas a prestações.', 'The seller stays owner until the full price is paid. Recommended for instalment sales.'),
      showIf: (v) => v.pagamento === 'prestacoes',
      default: true,
    },

    { name: 'entregaLocal', type: 'text', section: 'entrega', width: 'half', label: l('Local de entrega', 'Delivery place'), placeholder: l('Ex.: no armazém do Comprador, na Matola', 'E.g. at the Buyer’s warehouse in Matola') },
    { name: 'entregaData', type: 'date', section: 'entrega', width: 'half', label: l('Data de entrega', 'Delivery date') },
    {
      name: 'transporte',
      type: 'radio',
      section: 'entrega',
      label: l('Transporte por conta de', 'Transport paid by'),
      options: [
        { value: 'vendedor', label: l('Vendedor', 'Seller') },
        { value: 'comprador', label: l('Comprador', 'Buyer') },
      ],
      default: 'vendedor',
    },
    { name: 'garantiaMeses', type: 'number', section: 'entrega', width: 'half', min: 0, max: 60, label: l('Garantia de bom funcionamento (meses)', 'Working-order warranty (months)'), help: l('Deixe 0 se não houver garantia convencional.', 'Leave 0 if there is no contractual warranty.') },
    { name: 'reclamacaoDias', type: 'number', section: 'entrega', width: 'half', min: 1, max: 60, default: 8, label: l('Prazo para reclamar defeitos aparentes (dias)', 'Time to report visible defects (days)') },

    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v, { legal }) => {
    const bens = lines(v.bens)
      .filter((r) => str(r.descricao))
      .map((r) => {
        const q = Number(r.quantidade) > 0 ? Number(r.quantidade) : 1;
        const pu = money(r.precoUnitario);
        return { descricao: str(r.descricao), serie: str(r.serie), q, pu, total: pu != null ? roundMoney(pu * q) : null };
      });
    const subtotal = roundMoney(bens.reduce((s, b) => s + (b.total ?? 0), 0));
    const taxaIva = legal.value<number>('ivaTaxaNormal');
    const iva = v.ivaRegime === 'acrescido' ? roundMoney(subtotal * taxaIva) : 0;
    const total = roundMoney(subtotal + iva);
    const entrada = v.pagamento === 'prestacoes' ? money(v.entradaValor) ?? 0 : 0;
    const n = int(v.prestacoesNumero) ?? 0;
    const prestacao = v.pagamento === 'prestacoes' && n > 0 ? roundMoney((total - entrada) / n) : null;
    return { bens, subtotal, iva, total, entrada, n, prestacao, taxaIva };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [
      ...partyWarnings(v, 'vendedor', 'vendedor', 'seller', { conjuge: true }),
      ...partyWarnings(v, 'comprador', 'comprador', 'buyer'),
    ];
    if (!c.bens.length) w.push({ level: 'error', field: 'bens', message: l('Indique pelo menos um bem.', 'Enter at least one item.') });
    else if (c.total <= 0) w.push({ level: 'error', field: 'bens', message: l('Indique o preço dos bens.', 'Enter the price of the goods.') });
    if (c.bens.some((b: { descricao: string }) => /viatura|carro|autom[oó]vel|mota|motociclo|cami[aã]o|barco|embarca/i.test(b.descricao))) {
      w.push({
        level: 'warning',
        field: 'bens',
        message: l('Para veículos e embarcações sujeitos a registo use a Declaração de venda, aceite pela Conservatória do Registo Automóvel.', 'For registrable vehicles and boats use the Declaration of sale, accepted by the Motor Vehicle Registry.'),
      });
    }
    if (isEmpresa(v, 'vendedor') && !isEmpresa(v, 'comprador')) {
      w.push({
        level: 'info',
        message: l(`Venda de empresa a consumidor: aplicam-se os direitos do consumidor em caso de defeito (${cite('consumidorDefeito')}).`, 'Business-to-consumer sale: consumer rights apply to defects.'),
      });
    }
    if (v.ivaRegime !== 'naoAplica') {
      w.push({ level: 'info', message: l('O contrato não substitui a factura: o vendedor registado em IVA deve emitir factura.', 'The contract does not replace the invoice: a VAT-registered seller must issue one.') });
    }
    if (v.pagamento === 'prestacoes' && !v.reservaPropriedade) {
      w.push({ level: 'info', field: 'reservaPropriedade', message: l('Nas vendas a prestações, a reserva de propriedade protege o vendedor se o comprador não pagar.', 'In instalment sales, retention of title protects the seller if the buyer does not pay.') });
    }
    if (v.pagamento === 'prestacoes' && c.entrada > c.total) {
      w.push({ level: 'error', field: 'entradaValor', message: l('A entrada é superior ao preço total.', 'The down payment exceeds the total price.') });
    }
    return w;
  },

  personName: (v) => partyName(v, 'comprador') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const V = papel(v, 'vendedor', 'Vendedor', 'Vendedora');
    const C = papel(v, 'comprador', 'Comprador', 'Compradora');
    const forma = str(v.formaPagamento) || 'transferência bancária';
    const modo =
      forma === 'transferência bancária'
        ? `por transferência bancária para a conta com o NIB ${str(v.nib) || BLANK}, titulada ${V.pelo}`
        : forma === 'numerário'
          ? 'em numerário, contra recibo'
          : forma === 'cheque'
            ? `por cheque emitido à ordem ${V.de}`
            : `através de ${forma}${str(v.nib) ? `, para o número ${str(v.nib)}` : ''}`;
    const usados = v.estadoBens === 'usado';
    const ivaTxt =
      v.ivaRegime === 'acrescido'
        ? `, acrescido de IVA à taxa legal, no valor de ${valorTexto(c.iva)}, perfazendo o total de ${valorTexto(c.total)}`
        : v.ivaRegime === 'incluido'
          ? ', com IVA incluído à taxa legal'
          : '';

    const clauses: ClauseItem[] = [];
    clauses.push({
      id: 'objecto',
      heading: 'Objecto',
      text: `Pelo presente contrato, ${V.o} vende ${C.ao}, que compra, os bens ${usados ? 'usados ' : 'novos '}descritos no Anexo I, que faz parte integrante do presente contrato${usados ? `, no estado de conservação e funcionamento em que se encontram, que ${C.o} declara conhecer e aceitar` : ''}.`,
      en: `The Seller sells and the Buyer buys the ${usados ? 'used' : 'new'} goods listed in Annex I${usados ? ', in their current condition, known to and accepted by the Buyer' : ''}.`,
    });

    let pagamento: string[];
    if (v.pagamento === 'prestacoes') {
      const n = c.n as number;
      pagamento = [
        `O preço global é de ${valorTexto(c.subtotal)}${ivaTxt}.`,
        `O preço é pago ${c.entrada > 0 ? `com uma entrada de ${valorTexto(c.entrada)} na data da assinatura do presente contrato, de que ${V.o} dá quitação, e o restante ` : ''}em ${quantos(n, 'prestação', 'prestações', true)} mensais e sucessivas de ${valorTexto(c.prestacao)}, vencendo-se a primeira em ${dateLong(v.primeiraPrestacao)} e as restantes no mesmo dia dos meses seguintes, ${modo}.`,
        `A falta de pagamento de uma prestação na data do seu vencimento importa o vencimento imediato de todas as restantes (${cite('codigoCivilPrestacoes')}).`,
      ];
    } else {
      pagamento = [
        `O preço global é de ${valorTexto(c.subtotal)}${ivaTxt}.`,
        `O preço é pago integralmente até ${dateLong(v.dataPagamento)}, ${modo}, valendo o respectivo comprovativo como quitação.`,
      ];
    }
    clauses.push({
      id: 'preco',
      heading: 'Preço e pagamento',
      text: numerar(pagamento),
      en: `The price is ${formatMoney(c.total)}${v.ivaRegime === 'acrescido' ? ' including VAT' : ''}, paid ${v.pagamento === 'prestacoes' ? `in ${c.n} monthly instalments; missing one makes all due` : 'in full'} by ${forma}.`,
    });

    if (v.pagamento === 'prestacoes' && v.reservaPropriedade) {
      clauses.push({
        id: 'reserva',
        heading: 'Reserva de propriedade',
        text: numerar([
          `${V.O} reserva para si a propriedade dos bens até ao pagamento integral do preço.`,
          `Até lá, ${C.o} não pode vender, onerar, ceder ou retirar os bens do local de entrega sem autorização escrita ${V.de}, e responde pela sua perda ou deterioração.`,
          `Se ${C.o} não pagar e o contrato for resolvido, ${V.o} pode reaver os bens, sem prejuízo da indemnização pelos danos sofridos.`,
        ]),
        en: 'The Seller keeps ownership until full payment. Until then the Buyer may not sell, charge or move the goods and bears the risk. On termination for non-payment the Seller may take the goods back and claim damages.',
      });
    }

    const reclamar = int(v.reclamacaoDias);
    clauses.push({
      id: 'entrega',
      heading: 'Entrega e risco',
      text: numerar([
        `Os bens são entregues ${/^(n[oa]s?|em|à|ao)\s/i.test(semPonto(v.entregaLocal)) ? '' : 'em '}${semPonto(v.entregaLocal) || BLANK}, até ${dateLong(v.entregaData)}, sendo o transporte por conta ${v.transporte === 'comprador' ? C.de : V.de}.`,
        `No acto da entrega, as partes assinam uma guia ou termo de entrega, e ${C.o} verifica a quantidade e o estado aparente dos bens, devendo reclamar por escrito quaisquer faltas ou defeitos aparentes no prazo de ${quantos(reclamar, 'dia', 'dias')}.`,
        `O risco de perda ou deterioração dos bens transfere-se para ${C.o} com a entrega.`,
      ]),
      en: `Delivery at ${v.entregaLocal || '—'} by ${v.entregaData || '—'}; transport paid by the ${v.transporte === 'comprador' ? 'Buyer' : 'Seller'}. The Buyer checks the goods and reports visible defects within ${reclamar ?? '—'} days. Risk passes on delivery.`,
    });

    const garantia = int(v.garantiaMeses);
    clauses.push({
      id: 'garantia',
      heading: 'Garantia',
      text: numerar([
        `${V.O} garante que os bens são sua propriedade e estão livres de ónus, encargos ou direitos de terceiros.`,
        garantia && garantia > 0
          ? `${V.O} garante o bom funcionamento dos bens pelo prazo de ${quantos(garantia, 'mês', 'meses')} a contar da entrega, obrigando-se a repará-los ou substituí-los, à sua custa, se apresentarem avaria não resultante de uso indevido.`
          : '',
        `${C.O} deve denunciar ${V.ao}, por escrito, qualquer defeito oculto dentro do prazo legal após o seu conhecimento, nos termos da lei civil sobre a venda de coisas defeituosas.`,
      ]),
      en: `The Seller warrants ownership free of charges${garantia ? ` and working order for ${garantia} months` : ''}. Hidden defects must be reported in writing within the legal period.`,
    });

    clauses.push(...clausulasFinais(v));

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de compra e venda' },
      ...partesBlocks(v, [
        { p: 'vendedor', role: V, en: 'Seller' },
        { p: 'comprador', role: C, en: 'Buyer' },
      ]),
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'É celebrado e reciprocamente aceite o presente contrato de compra e venda, que se rege pelas cláusulas seguintes e, no que nelas for omisso, pela legislação aplicável:',
        en: 'This sale contract is entered into on the following terms and, where silent, the applicable law:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fecho(ctx, [assinatura(ctx, 'vendedor', V, true), assinatura(ctx, 'comprador', C)]),
      { type: 'pageBreakHint' },
      { type: 'title', text: 'Anexo I — Bens vendidos' },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.5, align: 'right' },
          { label: 'Descrição', width: 2.6 },
          { label: 'Marca, modelo, n.º de série', width: 2.2 },
          { label: 'Quant.', width: 0.7, align: 'right' },
          { label: 'Preço unit.', width: 1.3, align: 'right' },
          { label: 'Total', width: 1.4, align: 'right' },
        ],
        rows: c.bens.length
          ? c.bens.map((b: { descricao: string; serie: string; q: number; pu: number | null; total: number | null }, i: number) => [
              String(i + 1),
              b.descricao,
              b.serie,
              String(b.q),
              formatMoney(b.pu, false),
              formatMoney(b.total, false),
            ])
          : [['1', BLANK, '', '', '', '']],
        totals: [
          ...(v.ivaRegime === 'acrescido'
            ? [
                ['', 'Subtotal', '', '', '', formatMoney(c.subtotal, false)],
                ['', 'IVA', '', '', '', formatMoney(c.iva, false)],
              ]
            : []),
          ['', v.ivaRegime === 'incluido' ? 'Total (IVA incluído), em MT' : 'Total, em MT', '', '', '', formatMoney(c.total, false)],
        ],
      },
      { type: 'signatures', columns: [assinatura(ctx, 'vendedor', V), assinatura(ctx, 'comprador', C)] },
    ];
    return blocks;
  },
});
