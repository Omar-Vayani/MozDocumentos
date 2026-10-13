// Contrato de fornecimento: recurring supply of goods between businesses
// (Regime Jurídico dos Contratos Comerciais).

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, int, lines, numerar, papel, partesBlocks, partyFields,
  partyName, partyWarnings, quantos, semPonto, str, testemunhasField,
} from './_contratos';

export default defineTemplate({
  id: 'contrato-de-fornecimento',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'fornecedor', title: l('Fornecedor', 'Supplier'), personRole: 'outro' },
    { id: 'cliente', title: l('Cliente', 'Customer'), personRole: 'cliente' },
    { id: 'produtos', title: l('Produtos e preços', 'Products and prices') },
    { id: 'encomendas', title: l('Encomendas e entregas', 'Orders and deliveries') },
    { id: 'pagamento', title: l('Facturação e pagamento', 'Invoicing and payment') },
    { id: 'vigencia', title: l('Vigência e outras cláusulas', 'Term and other terms') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('fornecedor', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('cliente', { tipoDefault: 'empresa' }),

    {
      name: 'produtos',
      type: 'lines',
      section: 'produtos',
      required: true,
      label: l('Produtos', 'Products'),
      addLabel: l('Adicionar produto', 'Add product'),
      columns: [
        { name: 'produto', type: 'text', label: l('Produto', 'Product') },
        { name: 'especificacao', type: 'text', label: l('Especificação / embalagem', 'Specification / pack') },
        { name: 'unidade', type: 'text', label: l('Unidade', 'Unit') },
        { name: 'preco', type: 'money', label: l('Preço unitário', 'Unit price') },
      ],
      default: [{ produto: '', especificacao: '', unidade: '', preco: '' }],
    },
    {
      name: 'ivaRegime',
      type: 'select',
      section: 'produtos',
      width: 'half',
      label: l('IVA', 'VAT'),
      options: [
        { value: 'acrescido', label: l('Preços sem IVA (acresce IVA)', 'Prices exclude VAT') },
        { value: 'incluido', label: l('Preços com IVA incluído', 'Prices include VAT') },
        { value: 'naoAplica', label: l('Sem IVA', 'No VAT') },
      ],
      default: 'acrescido',
    },
    {
      name: 'revisaoPrecos',
      type: 'radio',
      section: 'produtos',
      label: l('Revisão de preços', 'Price review'),
      options: [
        { value: 'aviso', label: l('Com aviso prévio escrito', 'With prior written notice') },
        { value: 'anual', label: l('Uma vez por ano, por acordo', 'Once a year, by agreement') },
        { value: 'fixos', label: l('Preços fixos durante o contrato', 'Fixed for the term') },
      ],
      default: 'aviso',
    },
    { name: 'revisaoAvisoDias', type: 'number', section: 'produtos', width: 'half', min: 1, max: 120, default: 30, label: l('Aviso de alteração de preços (dias)', 'Price change notice (days)'), showIf: (v) => v.revisaoPrecos === 'aviso' },

    { name: 'antecedenciaEncomendaDias', type: 'number', section: 'encomendas', width: 'half', min: 0, max: 60, default: 3, label: l('Antecedência das encomendas (dias)', 'Order lead time (days)') },
    { name: 'confirmacaoHoras', type: 'number', section: 'encomendas', width: 'half', min: 1, max: 120, default: 24, label: l('Prazo para confirmar a encomenda (horas)', 'Order confirmation time (hours)') },
    { name: 'quantidadeMinima', type: 'text', section: 'encomendas', label: l('Quantidade mínima mensal (opcional)', 'Minimum monthly quantity (optional)') },
    { name: 'entregaLocal', type: 'text', section: 'encomendas', label: l('Local de entrega', 'Delivery place') },
    {
      name: 'transporte',
      type: 'radio',
      section: 'encomendas',
      width: 'half',
      label: l('Transporte por conta de', 'Transport paid by'),
      options: [
        { value: 'fornecedor', label: l('Fornecedor', 'Supplier') },
        { value: 'cliente', label: l('Cliente', 'Customer') },
      ],
      default: 'fornecedor',
    },
    { name: 'validadeMinima', type: 'text', section: 'encomendas', width: 'half', label: l('Validade mínima na entrega (perecíveis)', 'Minimum shelf life on delivery') },
    { name: 'reclamacaoDias', type: 'number', section: 'encomendas', width: 'half', min: 1, max: 30, default: 3, label: l('Prazo para reclamar (dias úteis)', 'Time to complain (working days)') },
    { name: 'substituicaoDias', type: 'number', section: 'encomendas', width: 'half', min: 1, max: 30, default: 5, label: l('Prazo para substituir (dias)', 'Time to replace (days)') },

    {
      name: 'facturacao',
      type: 'radio',
      section: 'pagamento',
      width: 'half',
      label: l('Facturação', 'Invoicing'),
      options: [
        { value: 'entrega', label: l('Por entrega', 'Per delivery') },
        { value: 'mensal', label: l('Mensal', 'Monthly') },
      ],
      default: 'entrega',
    },
    { name: 'prazoPagamentoDias', type: 'number', section: 'pagamento', width: 'half', required: true, min: 0, max: 120, default: 30, label: l('Prazo de pagamento (dias após factura)', 'Payment term (days after invoice)') },
    { name: 'nib', type: 'text', section: 'pagamento', label: l('NIB do fornecedor', 'Supplier’s account (NIB)') },
    { name: 'limiteCredito', type: 'money', section: 'pagamento', width: 'half', label: l('Limite de crédito (opcional)', 'Credit limit (optional)') },

    { name: 'duracaoMeses', type: 'number', section: 'vigencia', width: 'half', required: true, min: 1, max: 120, default: 12, label: l('Duração (meses)', 'Term (months)') },
    { name: 'dataInicio', type: 'date', section: 'vigencia', width: 'half', label: l('Início', 'Start'), default: (c) => c.today },
    { name: 'renovacao', type: 'toggle', section: 'vigencia', default: true, label: l('Renovação automática por iguais períodos', 'Automatic renewal for equal periods') },
    { name: 'avisoDenunciaDias', type: 'number', section: 'vigencia', width: 'half', min: 1, max: 180, default: 60, label: l('Aviso para terminar (dias)', 'Notice to terminate (days)') },
    { name: 'resolucaoDias', type: 'number', section: 'vigencia', width: 'half', min: 1, max: 60, default: 15, label: l('Prazo para sanar incumprimento (dias)', 'Time to remedy a breach (days)') },
    {
      name: 'exclusividade',
      type: 'toggle',
      section: 'vigencia',
      label: l('Exclusividade', 'Exclusivity'),
      help: l('O cliente compra estes produtos só a este fornecedor (ou o fornecedor não vende a concorrentes na zona). Descreva abaixo.', 'The customer buys these products only from this supplier (or the supplier does not sell to competitors in the area).'),
    },
    { name: 'exclusividadeTexto', type: 'textarea', section: 'vigencia', rows: 2, label: l('Âmbito da exclusividade', 'Scope of exclusivity'), showIf: (v) => Boolean(v.exclusividade) },
    { name: 'confidencialidade', type: 'toggle', section: 'vigencia', default: true, label: l('Cláusula de confidencialidade', 'Confidentiality clause') },
    foroField('vigencia'),
    arbitragemField('vigencia'),
    testemunhasField('vigencia'),
  ],

  computed: (v) => ({
    produtos: lines(v.produtos)
      .filter((r) => str(r.produto))
      .map((r) => ({ produto: str(r.produto), especificacao: str(r.especificacao), unidade: str(r.unidade), preco: money(r.preco) })),
  }),

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'fornecedor', 'fornecedor', 'supplier'), ...partyWarnings(v, 'cliente', 'cliente', 'customer')];
    if (!c.produtos.length) w.push({ level: 'error', field: 'produtos', message: l('Indique pelo menos um produto.', 'Enter at least one product.') });
    w.push({
      level: 'info',
      message: l(
        `Todas as condições devem constar deste documento assinado: cláusulas não comunicadas à outra parte podem considerar-se não escritas (${cite('clausulasNaoEscritas')}).`,
        'All terms must be in this signed document: terms not communicated to the other party may be treated as not written.',
      ),
    });
    if (v.ivaRegime !== 'naoAplica') w.push({ level: 'info', message: l('Cada entrega deve ser acompanhada de guia de remessa e facturada com IVA.', 'Each delivery needs a delivery note and a VAT invoice.') });
    return w;
  },

  personName: (v) => partyName(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const F = papel(v, 'fornecedor', 'Fornecedor', 'Fornecedora');
    const C = papel(v, 'cliente', 'Cliente', 'Cliente');
    const ante = int(v.antecedenciaEncomendaDias);
    const conf = int(v.confirmacaoHoras);
    const recl = int(v.reclamacaoDias);
    const subst = int(v.substituicaoDias);
    const pag = int(v.prazoPagamentoDias);
    const dur = int(v.duracaoMeses);
    const aviso = int(v.avisoDenunciaDias);
    const resol = int(v.resolucaoDias);
    const limite = money(v.limiteCredito);

    const clauses: ClauseItem[] = [];
    clauses.push({
      id: 'objecto',
      heading: 'Objecto',
      text: `${F.O} obriga-se a fornecer ${C.ao}, de forma continuada, os produtos constantes do Anexo I, nas quantidades e com a periodicidade definidas nas notas de encomenda emitidas ${C.pelo}, nos termos do presente contrato.`,
      en: 'The Supplier will supply the products in Annex I on a continuing basis, in the quantities and frequency set by the Customer’s purchase orders.',
    });
    clauses.push({
      id: 'encomendas',
      heading: 'Encomendas',
      text: numerar([
        `As encomendas são feitas por escrito, incluindo por correio electrónico, com a antecedência mínima de ${quantos(ante, 'dia', 'dias')} relativamente à data de entrega pretendida.`,
        `${F.O} confirma ou recusa cada encomenda no prazo de ${quantos(conf, 'hora', 'horas', true)}; na falta de resposta, a encomenda considera-se aceite.`,
        str(v.quantidadeMinima) ? `${C.O} obriga-se a adquirir a quantidade mínima mensal de ${semPonto(v.quantidadeMinima)}.` : '',
      ]),
      en: `Written orders (e-mail allowed) with ${ante ?? '—'} days’ notice; the Supplier confirms within ${conf ?? '—'} hours or the order is deemed accepted.`,
    });
    const iva = v.ivaRegime === 'acrescido' ? ', aos quais acresce IVA à taxa legal' : v.ivaRegime === 'incluido' ? ', com IVA incluído' : '';
    clauses.push({
      id: 'precos',
      heading: 'Preços',
      text: numerar([
        `Os preços dos produtos são os constantes do Anexo I${iva}.`,
        v.revisaoPrecos === 'fixos'
          ? 'Os preços mantêm-se inalterados durante o período inicial de vigência do contrato.'
          : v.revisaoPrecos === 'anual'
            ? 'Os preços podem ser revistos uma vez por ano, por acordo escrito das partes.'
            : `${F.O} pode rever os preços mediante comunicação escrita com a antecedência mínima de ${quantos(int(v.revisaoAvisoDias), 'dia', 'dias')}, não se aplicando a revisão às encomendas já confirmadas; ${C.o} pode, nesse caso, denunciar o contrato sem aguardar o prazo de aviso.`,
      ]),
      en: `Prices as in Annex I${v.ivaRegime === 'acrescido' ? ' plus VAT' : ''}; ${v.revisaoPrecos === 'fixos' ? 'fixed for the initial term' : v.revisaoPrecos === 'anual' ? 'reviewed yearly by agreement' : 'may be revised with written notice, not affecting confirmed orders'}.`,
    });
    clauses.push({
      id: 'entrega',
      heading: 'Entrega e risco',
      text: numerar([
        `Os produtos são entregues em ${semPonto(v.entregaLocal) || BLANK}, por conta ${v.transporte === 'cliente' ? C.de : F.de}, acompanhados de guia de remessa.`,
        `O risco de perda ou deterioração dos produtos transfere-se para ${C.o} com a entrega.`,
      ]),
      en: `Delivery at ${v.entregaLocal || '—'}, transport paid by the ${v.transporte === 'cliente' ? 'Customer' : 'Supplier'}, with a delivery note. Risk passes on delivery.`,
    });
    clauses.push({
      id: 'qualidade',
      heading: 'Qualidade e reclamações',
      text: numerar([
        `Os produtos devem obedecer às especificações do Anexo I e às normas legais aplicáveis${str(v.validadeMinima) ? `, devendo ter, à data da entrega, uma validade mínima de ${semPonto(v.validadeMinima)}` : ''}.`,
        `${C.O} verifica os produtos no acto da entrega e comunica por escrito quaisquer faltas ou defeitos aparentes no prazo de ${quantos(recl, 'dia útil', 'dias úteis')}; os defeitos ocultos são comunicados logo que conhecidos.`,
        `${F.O} substitui os produtos em falta ou defeituosos no prazo de ${quantos(subst, 'dia', 'dias')}, sem custos para ${C.o}.`,
      ]),
      en: `Products must meet the specifications. The Customer reports visible defects within ${recl ?? '—'} working days; the Supplier replaces them within ${subst ?? '—'} days at no cost.`,
    });
    clauses.push({
      id: 'pagamento',
      heading: 'Facturação e pagamento',
      text: numerar([
        `${F.O} emite factura ${v.facturacao === 'mensal' ? 'mensalmente, relativa às entregas do mês anterior' : 'por cada entrega'}.`,
        `${C.O} paga cada factura no prazo de ${quantos(pag, 'dia', 'dias')} a contar da sua recepção, por transferência bancária para a conta com o NIB ${str(v.nib) || BLANK}, titulada ${F.pelo}.`,
        limite != null && limite > 0 ? `O valor das facturas vencidas e por pagar não pode exceder ${formatMoney(limite)}; atingido esse limite, ${F.o} pode condicionar novas entregas ao pagamento.` : '',
        `Em caso de atraso no pagamento são devidos juros de mora à taxa legal e ${F.o} pode suspender novos fornecimentos até à regularização, nos termos do ${cite('suspensaoCumprimento')}.`,
      ]),
      en: `Invoices ${v.facturacao === 'mensal' ? 'monthly' : 'per delivery'}, paid within ${pag ?? '—'} days by bank transfer. Late payment bears legal interest and the Supplier may suspend deliveries.`,
    });
    if (v.exclusividade) {
      clauses.push({
        id: 'exclusividade',
        heading: 'Exclusividade',
        text: `Durante a vigência do contrato, as partes obrigam-se ao seguinte regime de exclusividade: ${semPonto(v.exclusividadeTexto) || BLANK}.`,
        en: `Exclusivity: ${v.exclusividadeTexto || '—'}.`,
      });
    }
    if (v.confidencialidade) {
      clauses.push({
        id: 'confidencialidade',
        heading: 'Confidencialidade',
        text: 'As partes obrigam-se a manter confidenciais os preços, as condições comerciais e as demais informações a que tenham acesso por força do presente contrato, durante a sua vigência e após a sua cessação, salvo obrigação legal de divulgação.',
        en: 'Prices, commercial terms and other information are confidential during and after the contract, unless disclosure is required by law.',
      });
    }
    clauses.push({
      id: 'forcaMaior',
      heading: 'Força maior',
      text: 'Nenhuma das partes responde pelo incumprimento devido a caso de força maior, designadamente calamidades naturais, epidemias, guerra, actos de autoridade ou greves gerais, desde que o comunique à outra parte logo que possível e tome as medidas razoáveis para limitar os seus efeitos.',
      en: 'Neither party is liable for failure caused by force majeure (natural disasters, epidemics, war, government acts, general strikes), if promptly notified.',
    });
    clauses.push({
      id: 'vigencia',
      heading: 'Vigência e cessação',
      text: numerar([
        `O presente contrato vigora pelo prazo de ${quantos(dur, 'mês', 'meses')} a contar de ${dateLong(v.dataInicio)}${v.renovacao ? ', renovando-se automaticamente por iguais períodos' : ''}.`,
        `Qualquer das partes pode denunciar o contrato${v.renovacao ? ' ou opor-se à sua renovação' : ''} mediante comunicação escrita com a antecedência mínima de ${quantos(aviso, 'dia', 'dias')}.`,
        `Qualquer das partes pode resolver o contrato em caso de incumprimento grave da outra que não seja sanado no prazo de ${quantos(resol, 'dia', 'dias')} após interpelação escrita.`,
        'A cessação do contrato não prejudica a entrega e o pagamento das encomendas já confirmadas.',
      ]),
      en: `Term of ${dur ?? '—'} months${v.renovacao ? ', renewing automatically' : ''}; ${aviso ?? '—'} days’ written notice to terminate; termination for unremedied serious breach; confirmed orders are still delivered and paid.`,
    });
    clauses.push(...clausulasFinais(v));

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de fornecimento' },
      ...partesBlocks(v, [
        { p: 'fornecedor', role: F, en: 'Supplier' },
        { p: 'cliente', role: C, en: 'Customer' },
      ]),
      {
        type: 'paragraph',
        id: 'celebracao',
        text: `É celebrado e reciprocamente aceite o presente contrato de fornecimento, que se rege pelas cláusulas seguintes e, no que nelas for omisso, pelo ${LEI}:`,
        en: 'This supply agreement is entered into on the following terms and, where silent, the Commercial Contracts Regime:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fecho(ctx, [assinatura(ctx, 'fornecedor', F, true), assinatura(ctx, 'cliente', C)]),
      { type: 'pageBreakHint' },
      { type: 'title', text: 'Anexo I — Produtos, especificações e preços' },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.5, align: 'right' },
          { label: 'Produto', width: 2.4 },
          { label: 'Especificação', width: 2.4 },
          { label: 'Unidade', width: 1 },
          { label: v.ivaRegime === 'incluido' ? 'Preço (IVA incl.)' : 'Preço unitário', width: 1.4, align: 'right' },
        ],
        rows: c.produtos.length
          ? c.produtos.map((p: { produto: string; especificacao: string; unidade: string; preco: number | null }, i: number) => [
              String(i + 1),
              p.produto,
              p.especificacao,
              p.unidade,
              formatMoney(p.preco, false),
            ])
          : [['1', BLANK, '', '', '']],
        note: v.ivaRegime === 'acrescido' ? 'Preços em meticais, sem IVA.' : 'Preços em meticais.',
      },
      { type: 'signatures', columns: [assinatura(ctx, 'fornecedor', F), assinatura(ctx, 'cliente', C)] },
    ];
    return blocks;
  },
});

const LEI = 'Regime Jurídico dos Contratos Comerciais e demais legislação aplicável';
