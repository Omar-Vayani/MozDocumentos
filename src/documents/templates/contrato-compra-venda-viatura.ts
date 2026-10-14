// Contrato de compra e venda de viatura entre particulares: identification of the
// vehicle and its papers, price (cash or instalments with retention of title),
// delivery, condition and known defects, liability for fines and accidents until
// hand-over, and the transfer of registration at the Motor Vehicle Registry.

import { addMonths, formatDateShort, formatNumber } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, l, money, splitLines } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, conjugeColumn, consentimentoTexto, documentoFields, fecho, foroField, int, numerar, papel, partesBlocks, partyName,
  partyWarnings, quantos, testemunhasField, valorTexto,
} from './_contratos';
import { fechoJunto, itensLista, partyFieldsWhen, semPonto, str } from './_familia';

export default defineTemplate({
  id: 'contrato-compra-venda-viatura',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'vendedor', title: l('Vendedor', 'Seller'), personRole: 'outro' },
    { id: 'comprador', title: l('Comprador', 'Buyer'), personRole: 'cliente' },
    { id: 'viatura', title: l('Viatura', 'Vehicle') },
    { id: 'preco', title: l('Preço e pagamento', 'Price and payment') },
    { id: 'entrega', title: l('Entrega e estado', 'Delivery and condition') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFieldsWhen('vendedor', ['pessoa', 'empresa'], { conjuge: true }),
    ...partyFieldsWhen('comprador', []),
    {
      name: 'tipoVeiculo',
      type: 'select',
      section: 'viatura',
      width: 'half',
      label: l('Tipo', 'Type'),
      options: [
        { value: 'viatura ligeira', label: l('Ligeiro (carro)', 'Car') },
        { value: 'viatura de caixa aberta', label: l('Caixa aberta (pick-up)', 'Pick-up') },
        { value: 'viatura pesada', label: l('Pesado (camião, autocarro)', 'Truck or bus') },
        { value: 'motociclo', label: l('Motociclo', 'Motorcycle') },
      ],
      default: 'viatura ligeira',
    },
    { name: 'marca', type: 'text', section: 'viatura', width: 'half', required: true, label: l('Marca', 'Make'), placeholder: l('Ex.: Toyota', 'E.g. Toyota') },
    { name: 'modelo', type: 'text', section: 'viatura', width: 'half', required: true, label: l('Modelo', 'Model'), placeholder: l('Ex.: Corolla', 'E.g. Corolla') },
    { name: 'matricula', type: 'text', section: 'viatura', width: 'half', required: true, label: l('Matrícula', 'Plate'), placeholder: l('Ex.: AFJ 123 MC', 'E.g. AFJ 123 MC') },
    { name: 'quadro', type: 'text', section: 'viatura', width: 'half', required: true, label: l('N.º de quadro (chassis)', 'Chassis (VIN)') },
    { name: 'motor', type: 'text', section: 'viatura', width: 'half', label: l('N.º de motor', 'Engine no.') },
    { name: 'cor', type: 'text', section: 'viatura', width: 'half', label: l('Cor', 'Colour') },
    { name: 'ano', type: 'text', section: 'viatura', width: 'half', label: l('Ano de fabrico', 'Year') },
    { name: 'quilometros', type: 'number', section: 'viatura', width: 'half', min: 0, label: l('Quilómetros', 'Mileage (km)') },
    { name: 'tituloRegisto', type: 'text', section: 'viatura', width: 'half', label: l('Título de registo de propriedade n.º', 'Registration title no.') },
    { name: 'livrete', type: 'text', section: 'viatura', width: 'half', label: l('Livrete n.º', 'Logbook no.') },
    { name: 'preco', type: 'money', section: 'preco', width: 'half', required: true, label: l('Preço', 'Price') },
    { name: 'formaPagamento', type: 'select', section: 'preco', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    {
      name: 'pagamento',
      type: 'radio',
      section: 'preco',
      label: l('Pagamento', 'Payment'),
      options: [
        { value: 'pronto', label: l('Pago na totalidade na assinatura', 'Paid in full on signing') },
        { value: 'prestacoes', label: l('Entrada e prestações mensais', 'Down payment and monthly instalments') },
      ],
      default: 'pronto',
    },
    { name: 'entrada', type: 'money', section: 'preco', width: 'half', label: l('Entrada paga hoje', 'Down payment today'), showIf: (v) => v.pagamento === 'prestacoes' },
    { name: 'prestacoes', type: 'number', section: 'preco', width: 'half', min: 1, max: 60, default: 6, label: l('N.º de prestações', 'No. of instalments'), showIf: (v) => v.pagamento === 'prestacoes' },
    { name: 'primeiraPrestacao', type: 'date', section: 'preco', width: 'half', label: l('1.ª prestação em', 'First instalment on'), showIf: (v) => v.pagamento === 'prestacoes' },
    {
      name: 'reservaPropriedade',
      type: 'toggle',
      section: 'preco',
      default: true,
      label: l('O vendedor fica com a propriedade até ao último pagamento', 'Seller keeps title until the last payment'),
      help: l('Reserva de propriedade: o registo só passa para o comprador depois de pago todo o preço.', 'Retention of title: registration passes to the buyer only once fully paid.'),
      showIf: (v) => v.pagamento === 'prestacoes',
    },
    { name: 'conta', type: 'text', section: 'preco', label: l('Conta do vendedor', 'Seller’s account') },
    { name: 'dataEntrega', type: 'date', section: 'entrega', width: 'half', label: l('Entrega da viatura', 'Delivery date'), default: (c) => c.today },
    { name: 'acessorios', type: 'text', section: 'entrega', label: l('Entregue com', 'Delivered with'), default: 'duas chaves, pneu sobresselente, macaco e triângulo de sinalização' },
    { name: 'defeitos', type: 'textarea', section: 'entrega', rows: 3, label: l('Defeitos conhecidos (opcional)', 'Known defects (optional)'), help: l('Um por linha. O que aqui constar o comprador aceita; esconder defeitos conhecidos torna o vendedor responsável.', 'One per line. The buyer accepts what is listed; hiding known defects makes the seller liable.') },
    { name: 'examinado', type: 'toggle', section: 'entrega', default: true, label: l('O comprador examinou e experimentou a viatura', 'The buyer inspected and test-drove the vehicle') },
    {
      name: 'registoPor',
      type: 'select',
      section: 'entrega',
      width: 'half',
      label: l('Custos do registo', 'Registration costs'),
      options: [
        { value: 'comprador', label: l('Pagos pelo comprador', 'Paid by the buyer') },
        { value: 'vendedor', label: l('Pagos pelo vendedor', 'Paid by the seller') },
        { value: 'metade', label: l('Divididos em partes iguais', 'Split equally') },
      ],
      default: 'comprador',
    },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const preco = money(v.preco);
    const entrada = v.pagamento === 'prestacoes' ? money(v.entrada) ?? 0 : null;
    const n = v.pagamento === 'prestacoes' ? int(v.prestacoes) ?? 0 : 0;
    const resto = preco != null && entrada != null ? Math.max(0, preco - entrada) : null;
    const prestacao = resto != null && n > 0 ? Math.round((resto / n) * 100) / 100 : null;
    const inicio = str(v.primeiraPrestacao);
    const plano = n > 0 && prestacao != null ? Array.from({ length: n }, (_, i) => ({ n: i + 1, data: inicio ? addMonths(inicio, i) : '', valor: i === n - 1 ? Math.round((resto! - prestacao * (n - 1)) * 100) / 100 : prestacao })) : [];
    return { preco, entrada, n, resto, prestacao, plano, defeitos: splitLines(v.defeitos) };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'vendedor', 'vendedor', 'seller', { conjuge: true }), ...partyWarnings(v, 'comprador', 'comprador', 'buyer')];
    if (c.preco == null) w.push({ level: 'error', field: 'preco', message: l('Indique o preço.', 'Enter the price.') });
    if (!str(v.matricula) || !str(v.quadro)) w.push({ level: 'warning', field: 'quadro', message: l('Confira a matrícula e o número de quadro com o livrete e com a própria viatura.', 'Check the plate and chassis number against the logbook and the vehicle.') });
    w.push({
      level: 'warning',
      message: l(
        `Para registar a viatura em nome do comprador, a Conservatória do Registo Automóvel pede a declaração de venda assinada pelo vendedor com assinatura reconhecida (use também a Declaração de venda). Até ao registo, o vendedor continua a constar como proprietário (${cite('famVendaViatura')}).`,
        'To register the vehicle in the buyer’s name, the Motor Vehicle Registry requires the seller’s signed sale declaration with a certified signature (use the Sale declaration too). Until then the seller remains the registered owner.',
      ),
    });
    w.push({ level: 'info', message: l('Peça ao vendedor uma certidão de registo actualizada (ónus, penhoras, reserva de propriedade) e confirme se há multas pendentes antes de pagar.', 'Ask the seller for an up-to-date registry certificate (charges, liens, retention of title) and check for unpaid fines before paying.') });
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
    const conta = str(v.conta);
    const modo = forma === 'numerário' ? 'em numerário, contra recibo' : `por ${forma}${conta ? ` para ${forma === 'transferência bancária' ? 'a conta' : 'o número'} ${conta}` : ''}`;
    const km = int(v.quilometros);
    const prest = v.pagamento === 'prestacoes';

    const viatura = [
      `${str(v.tipoVeiculo) === 'motociclo' ? 'o motociclo' : `a ${str(v.tipoVeiculo) || 'viatura'}`} de marca **${str(v.marca) || BLANK}**, modelo **${str(v.modelo) || BLANK}**`,
      `com a matrícula **${str(v.matricula) || BLANK}**`,
      `quadro n.º ${str(v.quadro) || BLANK}`,
      str(v.motor) ? `motor n.º ${str(v.motor)}` : '',
      str(v.cor) ? `de cor ${str(v.cor)}` : '',
      str(v.ano) ? `do ano ${str(v.ano)}` : '',
    ].filter(Boolean).join(', ');
    const docs = [str(v.tituloRegisto) ? `título de registo de propriedade n.º ${str(v.tituloRegisto)}` : '', str(v.livrete) ? `livrete n.º ${str(v.livrete)}` : ''].filter(Boolean).join(' e ');
    const custos = v.registoPor === 'vendedor' ? `${V.de}` : v.registoPor === 'metade' ? 'de ambas as partes, em partes iguais' : `${C.de}`;

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: numerar([
          `${V.O} vende ${C.ao}, que compra, ${viatura}${docs ? `, conforme ${docs}` : ''}.`,
          `${V.O} declara que a viatura é sua propriedade, está registada em seu nome e se encontra livre de ónus, encargos, penhoras e reservas, e que não tem conhecimento de multas ou impostos em dívida.`,
        ]),
        en: 'The seller sells and the buyer buys the vehicle identified. The seller declares it is theirs, registered in their name, free of charges, liens and reservations, and that no fines or taxes are known to be owed.',
      },
      {
        id: 'preco',
        heading: 'Preço e pagamento',
        text: prest
          ? numerar([
              `O preço é de ${valorTexto(c.preco)}.`,
              `Nesta data, ${C.o} paga a quantia de ${valorTexto(c.entrada)}, de que ${V.o} dá quitação; o remanescente de ${valorTexto(c.resto)} é pago em ${quantos(c.n, 'prestação', 'prestações', true)} mensais de ${valorTexto(c.prestacao)}, vencendo-se a primeira em ${dateLong(v.primeiraPrestacao)} e as seguintes no mesmo dia dos meses seguintes, ${modo}.`,
              `A falta de pagamento de qualquer prestação importa o vencimento imediato das restantes (${cite('codigoCivilPrestacoes')}).`,
              v.reservaPropriedade ? `${V.O} reserva para si a propriedade da viatura até ao pagamento integral do preço, podendo a reserva ser inscrita no registo automóvel.` : '',
            ])
          : `O preço é de ${valorTexto(c.preco)}, pago nesta data ${modo}, de que ${V.o} dá plena quitação com a assinatura do presente contrato.`,
        en: prest
          ? `Price ${c.preco != null ? formatMoney(c.preco) : '—'}: down payment today, the rest in ${c.n} monthly instalments${v.reservaPropriedade ? '; the seller keeps title until paid in full' : ''}.`
          : `Price ${c.preco != null ? formatMoney(c.preco) : '—'}, paid today in full.`,
      },
      {
        id: 'entrega',
        heading: 'Entrega',
        text: `A viatura é entregue ${C.ao} em ${dateLong(v.dataEntrega)}${km != null ? `, com ${formatNumber(km)} quilómetros registados` : ''}, juntamente com ${semPonto(v.acessorios) || 'as chaves'} e os documentos originais da viatura.`,
        en: `The vehicle is delivered on ${v.dataEntrega || '—'} with keys, accessories and original papers.`,
      },
      {
        id: 'estado',
        heading: 'Estado da viatura',
        text: numerar([
          `A viatura é vendida no estado em que se encontra${v.examinado ? `, que ${C.o} declara conhecer por a ter examinado e experimentado` : ''}.`,
          `${V.O} responde pelos defeitos que conhecia e não declarou.`,
          c.defeitos.length ? `${V.O} informou ${C.o}, que aceita, dos seguintes defeitos:` : `${V.O} declara não ter conhecimento de defeitos ocultos.`,
        ]),
        items: c.defeitos.length ? itensLista(c.defeitos) : undefined,
        en: `Sold as seen${v.examinado ? ', inspected and test-driven by the buyer' : ''}. ${c.defeitos.length ? 'The known defects listed are accepted.' : 'No hidden defects are known.'} The seller answers for known defects not disclosed.`,
      },
      {
        id: 'responsabilidade',
        heading: 'Responsabilidade até à entrega',
        text: `As multas, coimas, impostos e a responsabilidade por acidentes relativos a factos ocorridos até ao dia e hora da entrega são ${V.de}; a partir da entrega, são ${C.de}, que deve contratar de imediato o seguro obrigatório de responsabilidade civil automóvel.`,
        en: 'Fines, taxes and accident liability up to hand-over are the seller’s; afterwards the buyer’s, who must take out compulsory motor insurance at once.',
      },
      {
        id: 'registo',
        heading: 'Registo',
        text: numerar([
          `${prest && v.reservaPropriedade ? `Pago o preço integral, ${V.o}` : `Nesta data, ${V.o}`} assina a declaração de venda e os demais documentos necessários ao registo da propriedade a favor ${C.de}, comparecendo para o reconhecimento da assinatura quando necessário.`,
          `${C.O} requer o registo na Conservatória do Registo Automóvel no prazo legal${prest && v.reservaPropriedade ? ' a contar da entrega desses documentos' : ''}, sendo os custos do registo e da transferência da responsabilidade ${custos}.`,
        ]),
        en: 'The seller signs the sale declaration and registry papers; the buyer registers the vehicle within the legal period. Costs as agreed.',
      },
      ...clausulasFinais(v),
    ];

    const blocks: Block[] = [
      { type: 'title', text: `Contrato de compra e venda de ${str(v.tipoVeiculo) === 'motociclo' ? 'motociclo' : 'viatura'}` },
      ...partesBlocks(v, [
        { p: 'vendedor', role: V, en: 'Seller' },
        { p: 'comprador', role: C, en: 'Buyer' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'é celebrado o presente contrato de compra e venda, que se rege pelas cláusulas seguintes:', en: 'this sale contract is entered into on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fechoJunto(fecho(ctx, [assinatura(ctx, 'vendedor', V, true), assinatura(ctx, 'comprador', C)], {
        extraCols: [conjugeColumn(v, 'vendedor')],
        consentimento: consentimentoTexto(v, 'vendedor', V),
      })),
    ];
    if (c.plano.length) {
      blocks.push(
        { type: 'pageBreakHint' },
        { type: 'title', text: 'Anexo — Plano de pagamento' },
        {
          type: 'table',
          columns: [
            { label: 'N.º', width: 0.6, align: 'right' },
            { label: 'Vencimento', width: 2 },
            { label: 'Valor (MT)', width: 2, align: 'right' },
            { label: 'Pago em / rubrica', width: 2.4 },
          ],
          rows: c.plano.map((p: { n: number; data: string; valor: number }) => [String(p.n), p.data ? formatDateShort(p.data) : BLANK, formatMoney(p.valor, false), '']),
          totals: [['', 'Total', formatMoney(c.resto, false), '']],
          grid: true,
        },
        { type: 'signatures', columns: [assinatura(ctx, 'vendedor', V), assinatura(ctx, 'comprador', C)] },
      );
    }
    return blocks;
  },
});
