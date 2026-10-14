// Contrato de compra e venda (fornecimento) de pescado: a fisher, fishing
// association or vessel owner supplies fish or seafood to a buyer (processor,
// restaurant, trader) over a season — species and sizes, prices per kg,
// weighing, quality and cold chain, licences and closed seasons, advances for
// fuel and ice, payment.

import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, lines, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import { clForcaMaior, contratoBlocks, formaPagamentoFields, modoPagamento, prazo } from './_digital';

type Esp = { especie: string; apresentacao: string; calibre: string; preco: number | null; quantidade: string };
const especies = (v: Values): Esp[] =>
  lines(v.especies)
    .map((r) => ({ especie: str(r.especie), apresentacao: str(r.apresentacao), calibre: str(r.calibre), preco: money(r.preco), quantidade: str(r.quantidade) }))
    .filter((r) => r.especie);

export default defineTemplate({
  id: 'contrato-compra-pescado',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'comprador', title: l('Comprador', 'Buyer'), personRole: 'cliente' },
    { id: 'vendedor', title: l('Vendedor (pescador, associação ou armador)', 'Seller (fisher, association or vessel owner)'), personRole: 'outro' },
    { id: 'produto', title: l('Pescado e preços', 'Fish and prices') },
    { id: 'entrega', title: l('Entrega, qualidade e pagamento', 'Delivery, quality and payment') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('comprador', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('vendedor', { osfl: true }),
    { name: 'licencaPesca', type: 'text', section: 'vendedor', label: l('Licença de pesca n.º e embarcação', 'Fishing licence and vessel'), placeholder: l('Ex.: Licença de pesca artesanal n.º 0456/2026, embarcação "Esperança"', 'E.g. artisanal licence no., vessel name') },

    {
      name: 'especies',
      type: 'lines',
      section: 'produto',
      label: l('Espécies e preços', 'Species and prices'),
      addLabel: l('Adicionar espécie', 'Add species'),
      columns: [
        { name: 'especie', type: 'text', label: l('Espécie', 'Species') },
        { name: 'apresentacao', type: 'text', label: l('Apresentação', 'Presentation') },
        { name: 'calibre', type: 'text', label: l('Tamanho / calibre', 'Size') },
        { name: 'preco', type: 'money', label: l('Preço por kg', 'Price per kg') },
        { name: 'quantidade', type: 'text', label: l('Quantidade estimada', 'Estimated quantity') },
      ],
      default: [{ especie: 'Camarão', apresentacao: 'fresco, inteiro, em gelo', calibre: '', preco: '', quantidade: '' }],
    },
    { name: 'dataInicio', type: 'date', section: 'produto', width: 'half', label: l('Início', 'Start') },
    { name: 'dataFim', type: 'date', section: 'produto', width: 'half', label: l('Fim', 'End') },
    { name: 'exclusividade', type: 'select', section: 'produto', width: 'half', label: l('Compromisso de venda', 'Sales commitment'), options: [{ value: 'preferencia', label: l('Preferência ao comprador', 'Right of first refusal') }, { value: 'exclusivo', label: l('Exclusividade', 'Exclusive') }, { value: 'livre', label: l('Livre', 'None') }], default: 'preferencia' },
    { name: 'revisaoPreco', type: 'toggle', section: 'produto', default: true, label: l('Preços revistos por acordo no início de cada mês', 'Prices reviewed monthly by agreement') },

    { name: 'localEntrega', type: 'text', section: 'entrega', required: true, label: l('Local de entrega', 'Delivery point'), placeholder: l('Ex.: centro de pesca de Angoche; cais da praia de Inhassoro', 'E.g. fishing centre or landing site') },
    { name: 'frequencia', type: 'text', section: 'entrega', width: 'half', label: l('Frequência', 'Frequency'), default: 'diária, no regresso das embarcações' },
    { name: 'gelo', type: 'select', section: 'entrega', width: 'half', label: l('Gelo e caixas', 'Ice and boxes'), options: [{ value: 'comprador', label: l('Fornecidos pelo comprador', 'Supplied by buyer') }, { value: 'vendedor', label: l('Fornecidos pelo vendedor', 'Supplied by seller') }], default: 'comprador' },
    { name: 'adiantamentos', type: 'toggle', section: 'entrega', default: false, label: l('O comprador adianta combustível ou dinheiro, descontado nas entregas', 'Buyer advances fuel or cash, deducted from deliveries') },
    { name: 'adiantamentoMax', type: 'money', section: 'entrega', width: 'half', label: l('Adiantamento máximo', 'Maximum advance'), showIf: (v) => Boolean(v.adiantamentos) },
    { name: 'pagamentoPrazo', type: 'select', section: 'entrega', width: 'half', label: l('Pagamento', 'Payment'), options: [{ value: 'entrega', label: l('Na entrega', 'On delivery') }, { value: 'semanal', label: l('Semanal', 'Weekly') }, { value: 'quinzenal', label: l('Quinzenal', 'Fortnightly') }], default: 'semanal' },
    ...formaPagamentoFields('entrega'),
    { name: 'reclamacaoHoras', type: 'number', section: 'entrega', width: 'half', min: 0, max: 72, default: 2, label: l('Prazo para rejeitar pescado (horas após a entrega)', 'Hours to reject fish after delivery') },

    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'comprador', 'comprador', 'buyer'), ...partyWarnings(v, 'vendedor', 'vendedor', 'seller')];
    if (!str(v.licencaPesca)) w.push({ level: 'warning', field: 'licencaPesca', message: l('Indique a licença de pesca do vendedor: comprar pescado capturado sem licença é ilegal.', 'State the seller’s fishing licence: buying fish caught without a licence is unlawful.') });
    if (!especies(v).length) w.push({ level: 'error', field: 'especies', message: l('Indique as espécies e os preços.', 'Enter species and prices.') });
    w.push({ level: 'info', message: l(`Respeite os períodos de defeso e os tamanhos mínimos: durante o defeso não se pode comprar nem transportar a espécie protegida (${cite('turPescaLicenca')}). O transporte do pescado deve ser acompanhado da factura ou da guia e cumprir as regras sanitárias.`, 'Respect closed seasons and minimum sizes; protected species may not be bought or carried during the closed season. Fish in transit must carry the invoice or delivery note and meet sanitary rules.') });
    return w;
  },

  personName: (v) => partyName(v, 'vendedor') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const C = papel(v, 'comprador', 'Comprador', 'Compradora', true);
    const V = papel(v, 'vendedor', 'Vendedor', 'Vendedora');
    const es = especies(v);
    const quando = v.pagamentoPrazo === 'entrega' ? 'no acto de cada entrega' : v.pagamentoPrazo === 'quinzenal' ? 'quinzenalmente, pelas entregas da quinzena' : 'semanalmente, pelas entregas da semana, até à segunda-feira seguinte';

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        `Pelo presente contrato, ${V.o}${str(v.licencaPesca) ? `, titular da ${semPonto(v.licencaPesca).charAt(0).toLowerCase() + semPonto(v.licencaPesca).slice(1)},` : ''} obriga-se a vender ${C.ao} o pescado indicado no quadro seguinte, de ${dateLong(v.dataInicio)} a ${dateLong(v.dataFim)}, e ${C.o} obriga-se a comprá-lo aos preços acordados, desde que cumpra as condições de qualidade deste contrato.`,
        v.exclusividade === 'exclusivo'
          ? `${V.O} vende ${C.ao} toda a sua captura das espécies indicadas, em exclusivo.`
          : v.exclusividade === 'preferencia'
            ? `${V.O} dá preferência ${C.ao} na venda da sua captura das espécies indicadas, só podendo vender a terceiros o que ${C.o} não queira comprar.`
            : '',
        'As quantidades indicadas são estimativas, dependentes das capturas, e não obrigam as partes.',
      ]),
      en: 'The seller sells, and the buyer buys, the fish listed during the period, at the agreed prices, subject to quality. Exclusivity or first refusal as stated. Quantities are estimates.',
    });
    const quadro: Block = {
      type: 'table',
      columns: [
        { label: 'Espécie', width: 1.6 },
        { label: 'Apresentação', width: 2 },
        { label: 'Tamanho', width: 1.2 },
        { label: 'Preço/kg (MT)', width: 1.2, align: 'right' },
        { label: 'Qtd. estimada', width: 1.2 },
      ],
      rows: es.length ? es.map((e) => [e.especie, e.apresentacao || BLANK, e.calibre || '—', e.preco != null ? formatMoney(e.preco, false) : BLANK, e.quantidade || '—']) : [[BLANK, '', '', '', '']],
    };
    const cl2: ClauseItem[] = [];
    if (v.revisaoPreco) {
      cl2.push({
        id: 'precos',
        heading: 'Revisão dos preços',
        text: 'Os preços podem ser revistos por acordo escrito no início de cada mês, de acordo com as condições do mercado; na falta de acordo, mantêm-se os preços em vigor.',
        en: 'Prices may be revised monthly by written agreement; otherwise they stay the same.',
      });
    }
    cl2.push({
      id: 'entrega',
      heading: 'Entrega e pesagem',
      text: numerar([
        `O pescado é entregue em ${semPonto(v.localEntrega) || BLANK}, com frequência ${semPonto(v.frequencia) || BLANK}, ${v.gelo === 'vendedor' ? `em caixas e gelo fornecidos ${V.pelo}` : `em caixas e gelo fornecidos ${C.pelo}`}.`,
        'Cada entrega é pesada em balança aferida, na presença das duas partes ou dos seus representantes, e registada numa guia de entrega com a data, a espécie, o peso e o preço, assinada por ambas.',
      ]),
      en: 'Delivery at the stated place and frequency, with ice and boxes as stated. Each delivery is weighed on calibrated scales in both parties’ presence and recorded on a signed delivery note.',
    });
    cl2.push({
      id: 'qualidade',
      heading: 'Qualidade',
      text: numerar([
        `${V.O} entrega pescado fresco, limpo, conservado em gelo desde a captura, sem sinais de deterioração, e das espécies e tamanhos permitidos por lei.`,
        `${C.O} pode rejeitar, no acto da entrega ou no prazo de ${prazo(v.reclamacaoHoras, 'hora')}, o pescado que não cumpra estas condições, registando o motivo na guia de entrega.`,
        `${V.O} declara que pesca com licença válida e que respeita os períodos de defeso, os tamanhos mínimos e as artes de pesca permitidas, não vendendo ${C.ao} espécies protegidas ou capturadas em período de defeso.`,
      ]),
      en: 'Fresh, iced, clean fish of lawful species and sizes; the buyer may reject non-conforming fish on delivery or within the stated hours; the seller fishes with a valid licence and respects closed seasons, sizes and gear rules.',
    });
    if (v.adiantamentos) {
      cl2.push({
        id: 'adiantamentos',
        heading: 'Adiantamentos',
        text: `${C.O} pode adiantar ${V.ao} combustível, gelo ou dinheiro para as saídas de pesca, até ao máximo de ${valorTexto(money(v.adiantamentoMax))} em dívida em cada momento. Os adiantamentos são registados por escrito, não vencem juros e são descontados nos pagamentos das entregas seguintes; no fim do contrato, o saldo em dívida é pago em dinheiro.`,
        en: 'The buyer may advance fuel, ice or cash up to the stated cap, recorded in writing, interest-free, deducted from later payments; any balance is repaid at the end.',
      });
    }
    cl2.push({
      id: 'pagamento',
      heading: 'Pagamento',
      text: `${C.O} paga o pescado aceite ${quando}, segundo as guias de entrega, ${modoPagamento(v, V)}, contra recibo ou factura${v.vendedorTipo === 'empresa' ? '' : ' ou documento equivalente'}.`,
      en: 'The buyer pays for accepted fish as stated, per the delivery notes, against receipt or invoice.',
    });
    cl2.push({
      id: 'cessacao',
      heading: 'Cessação',
      text: 'Qualquer das partes pode resolver o contrato se a outra faltar repetidamente às entregas ou aos pagamentos, ou se o vendedor perder a licença de pesca, por comunicação escrita, sem prejuízo do acerto das contas pendentes.',
      en: 'Either party may terminate for repeated failure to deliver or pay, or loss of the fishing licence, settling outstanding accounts.',
    });
    cl2.push(clForcaMaior());

    const blocks = contratoBlocks(ctx, {
      title: 'Contrato de compra e venda de pescado',
      parties: [
        { p: 'vendedor', role: V, en: 'Seller' },
        { p: 'comprador', role: C, en: 'Buyer' },
      ],
      clauses: [...cl, ...cl2],
      signatures: [assinatura(ctx, 'vendedor', V), assinatura(ctx, 'comprador', C, true)],
    });
    const at = blocks.findIndex((b) => b.type === 'numberedClauses');
    const nc = blocks[at] as Extract<Block, { type: 'numberedClauses' }>;
    return [...blocks.slice(0, at), { ...nc, items: nc.items.slice(0, 1) }, quadro, { ...nc, items: nc.items.slice(1), start: 2 }, ...blocks.slice(at + 1)];
  },
});
