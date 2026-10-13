// Auto de medição de trabalhos: quantities executed in the period, cumulative
// progress per article, and the net amount payable after advance recovery,
// retention and penalties. Landscape: the measurement table is wide.

import { formatPercent } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateLong, l, money, splitLines } from './_shared';
import { int, lines, num, semPonto, str } from './_contratos';
import { assinaturasObra, IVA_OPTIONS, mt, n0, obraFields, obraKeyValue, partesObraFields, qt, r2, signatureRows, UNIDADES } from './_construcao';

type Linha = { artigo: string; descricao: string; unidade: string; contratada: number | null; preco: number | null; anterior: number; deste: number; acumulado: number; pct: number | null; valor: number };
type Extra = { artigo: string; descricao: string; unidade: string; deste: number; preco: number | null; valor: number; aprovacao: string };

export default defineTemplate({
  id: 'auto-de-medicao',
  family: 'mapa',
  page: 'A4-paisagem',
  sections: [
    { id: 'auto', title: l('Auto', 'Certificate') },
    { id: 'partes', title: l('Partes', 'Parties') },
    { id: 'obra', title: l('Obra e contrato', 'Works and contract') },
    { id: 'trabalhos', title: l('Trabalhos medidos', 'Measured works') },
    { id: 'financeiro', title: l('Valores a pagar', 'Amounts payable') },
  ],
  fields: [
    { name: 'numero', type: 'number', section: 'auto', width: 'half', required: true, min: 1, max: 999, default: 1, label: l('Auto de medição n.º', 'Certificate no.') },
    { name: 'data', type: 'date', section: 'auto', width: 'half', required: true, label: l('Data da medição', 'Measurement date'), default: (c) => c.today },
    { name: 'periodoInicio', type: 'date', section: 'auto', width: 'half', required: true, label: l('Período: de', 'Period: from') },
    { name: 'periodoFim', type: 'date', section: 'auto', width: 'half', required: true, label: l('Período: até', 'Period: to'), default: (c) => c.today },
    { name: 'local', type: 'text', section: 'auto', width: 'half', label: l('Cidade', 'City'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },

    ...partesObraFields('partes'),

    ...obraFields('obra'),
    { name: 'valorContrato', type: 'money', section: 'obra', width: 'half', label: l('Valor do contrato (sem IVA)', 'Contract value (excl. VAT)') },

    {
      name: 'itens',
      type: 'lines',
      section: 'trabalhos',
      label: l('Artigos do contrato', 'Contract items'),
      help: l('Copie os artigos do mapa de quantidades. "Acumulado anterior" é a quantidade medida nos autos anteriores.', 'Copy the items from the bill of quantities. "Previous" is the quantity measured in earlier certificates.'),
      addLabel: l('Adicionar artigo', 'Add item'),
      columns: [
        { name: 'artigo', type: 'text', label: l('Art.º', 'Item') },
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'unidade', type: 'select', label: l('Unidade', 'Unit'), options: UNIDADES },
        { name: 'quantContratada', type: 'number', label: l('Quant. contratada', 'Contract qty') },
        { name: 'precoUnitario', type: 'money', label: l('Preço unitário', 'Unit price') },
        { name: 'acumuladoAnterior', type: 'number', label: l('Acumulado anterior', 'Previous') },
        { name: 'desteAuto', type: 'number', label: l('Deste auto', 'This period') },
      ],
    },
    {
      name: 'trabalhosMais',
      type: 'lines',
      section: 'trabalhos',
      label: l('Trabalhos a mais aprovados (opcional)', 'Approved extra works (optional)'),
      addLabel: l('Adicionar trabalho a mais', 'Add extra work'),
      columns: [
        { name: 'artigo', type: 'text', label: l('Art.º', 'Item') },
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'unidade', type: 'select', label: l('Unidade', 'Unit'), options: UNIDADES },
        { name: 'desteAuto', type: 'number', label: l('Quantidade deste auto', 'Quantity this period') },
        { name: 'precoUnitario', type: 'money', label: l('Preço unitário', 'Unit price') },
        { name: 'aprovacaoRef', type: 'text', label: l('Aprovação (ordem n.º / data)', 'Approval (order no. / date)') },
      ],
    },

    { name: 'amortizacaoPct', type: 'number', section: 'financeiro', width: 'half', min: 0, max: 100, label: l('Amortização do adiantamento (% deste auto)', 'Advance recovery (% of this certificate)') },
    { name: 'retencaoPct', type: 'number', section: 'financeiro', width: 'half', min: 0, max: 20, label: l('Retenção de garantia (%)', 'Retention (%)'), help: l('Conforme o contrato. É prática corrente, não uma exigência legal.', 'As per the contract. Common practice, not a legal requirement.') },
    { name: 'multas', type: 'money', section: 'financeiro', width: 'half', label: l('Multas por atraso a deduzir', 'Delay penalties to deduct') },
    { name: 'ivaRegime', type: 'radio', section: 'financeiro', label: l('IVA', 'VAT'), options: IVA_OPTIONS, default: 'acrescido' },
    { name: 'pagamentoDias', type: 'number', section: 'financeiro', width: 'half', min: 0, max: 90, label: l('Prazo de pagamento após aprovação (dias)', 'Payment term after approval (days)') },
    { name: 'executadoAnterior', type: 'money', section: 'financeiro', width: 'half', label: l('Valor executado nos autos anteriores (sem IVA)', 'Value certified in earlier certificates (excl. VAT)') },
    { name: 'observacoes', type: 'textarea', section: 'financeiro', rows: 3, label: l('Observações (opcional)', 'Notes (optional)') },
  ],

  computed: (v, { legal }) => {
    const linhas: Linha[] = lines(v.itens)
      .filter((r) => str(r.descricao) || str(r.artigo))
      .map((r) => {
        const contratada = num(r.quantContratada);
        const preco = money(r.precoUnitario);
        const anterior = n0(r.acumuladoAnterior);
        const deste = n0(r.desteAuto);
        const acumulado = r2(anterior + deste);
        return { artigo: str(r.artigo), descricao: str(r.descricao), unidade: str(r.unidade), contratada, preco, anterior, deste, acumulado, pct: contratada ? acumulado / contratada : null, valor: preco != null ? r2(deste * preco) : 0 };
      });
    const extras: Extra[] = lines(v.trabalhosMais)
      .filter((r) => str(r.descricao))
      .map((r) => {
        const preco = money(r.precoUnitario);
        const deste = n0(r.desteAuto);
        return { artigo: str(r.artigo), descricao: str(r.descricao), unidade: str(r.unidade), deste, preco, valor: preco != null ? r2(deste * preco) : 0, aprovacao: str(r.aprovacaoRef) };
      });
    const contratual = r2(linhas.reduce((s, x) => s + x.valor, 0));
    const mais = r2(extras.reduce((s, x) => s + x.valor, 0));
    const bruto = r2(contratual + mais);
    const amortPct = num(v.amortizacaoPct) ?? 0;
    const retPct = num(v.retencaoPct) ?? 0;
    const amortizacao = r2((bruto * amortPct) / 100);
    const retencao = r2((bruto * retPct) / 100);
    const multas = money(v.multas) ?? 0;
    const liquido = r2(bruto - amortizacao - retencao - multas);
    const taxa = legal.value<number>('ivaTaxaNormal');
    const iva = v.ivaRegime === 'acrescido' ? r2(bruto * taxa) : 0;
    const total = r2(liquido + iva);
    const contrato = money(v.valorContrato);
    const anterior = money(v.executadoAnterior) ?? 0;
    const acumulado = r2(anterior + bruto);
    return { linhas, extras, contratual, mais, bruto, amortPct, retPct, amortizacao, retencao, multas, liquido, taxa, iva, total, contrato, anterior, acumulado };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (!c.linhas.length && !c.extras.length) w.push({ level: 'warning', field: 'itens', message: l('Acrescente os artigos medidos.', 'Add the measured items.') });
    const excede = (c.linhas as Linha[]).filter((x) => x.contratada != null && x.acumulado > x.contratada);
    if (excede.length) {
      w.push({
        level: 'error',
        field: 'itens',
        message: l(
          `O acumulado ultrapassa a quantidade contratada no(s) artigo(s) ${excede.map((x) => x.artigo || x.descricao).join(', ')}. Passe o excesso para "Trabalhos a mais", com aprovação escrita.`,
          'The cumulative quantity exceeds the contract quantity for some items. Move the excess to "Extra works", with written approval.',
        ),
      });
    }
    if ((c.extras as Extra[]).some((x) => !x.aprovacao)) {
      w.push({
        level: 'warning',
        field: 'trabalhosMais',
        message: l(`Há trabalhos a mais sem referência à aprovação escrita do dono da obra; sem ela podem não ser pagos (${cite('empreitadaAlteracoes')}).`, 'Some extra works have no reference to the owner’s written approval; without it they may not be paid.'),
      });
    }
    if (v.periodoInicio && v.periodoFim && String(v.periodoInicio) > String(v.periodoFim)) {
      w.push({ level: 'error', field: 'periodoFim', message: l('O fim do período é anterior ao início.', 'The period ends before it starts.') });
    }
    if (c.contrato != null && c.acumulado > c.contrato) {
      w.push({ level: 'warning', field: 'valorContrato', message: l('O valor acumulado já ultrapassa o valor do contrato.', 'The cumulative value already exceeds the contract value.') });
    }
    w.push({ level: 'info', message: l('A retenção e a amortização do adiantamento seguem o contrato; o documento não impõe valores.', 'Retention and advance recovery follow the contract; the document imposes no values.') });
    return w;
  },

  personName: (v) => (v.numero ? `auto-${v.numero}` : undefined),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const pctTxt = (x: number | null) => (x == null ? '' : formatPercent(x));
    const rows: string[][] = (c.linhas as Linha[]).map((x) => [x.artigo, x.descricao || BLANK, x.unidade, qt(x.contratada), mt(x.preco), qt(x.anterior), qt(x.deste), qt(x.acumulado), pctTxt(x.pct), mt(x.valor)]);
    if (c.extras.length) {
      rows.push(['§ TRABALHOS A MAIS APROVADOS']);
      for (const x of c.extras as Extra[]) rows.push([x.artigo, `${x.descricao}${x.aprovacao ? ` (${x.aprovacao})` : ''}`, x.unidade, '', mt(x.preco), '', qt(x.deste), '', '', mt(x.valor)]);
    }
    if (!rows.length) rows.push(['', BLANK, '', '', '', '', '', '', '', '']);

    const resumo: string[][] = [['Valor dos trabalhos contratuais deste auto', mt(c.contratual)]];
    if (c.mais) resumo.push(['Valor dos trabalhos a mais deste auto', mt(c.mais)]);
    if (c.mais) resumo.push(['= ', mt(c.bruto)]);
    if (c.amortizacao) resumo.push([`(−) Amortização do adiantamento (${String(c.amortPct).replace('.', ',')}%)`, `−${mt(c.amortizacao)}`]);
    if (c.retencao) resumo.push([`(−) Retenção para garantia (${String(c.retPct).replace('.', ',')}%)`, `−${mt(c.retencao)}`]);
    if (c.multas) resumo.push(['(−) Multas por atraso', `−${mt(c.multas)}`]);
    resumo.push([v.ivaRegime === 'acrescido' ? 'Valor líquido, sem IVA' : 'Valor líquido', mt(c.liquido)]);
    if (v.ivaRegime === 'acrescido') resumo.push([`IVA (${formatPercent(c.taxa)}) sobre o valor dos trabalhos`, mt(c.iva)]);

    const situacao: string[][] = [];
    if (c.contrato != null) situacao.push(['Valor do contrato', mt(c.contrato)]);
    situacao.push(['Executado até ao auto anterior', mt(c.anterior)], ['Executado com o presente auto', mt(c.acumulado)]);
    if (c.contrato) situacao.push(['Execução financeira', formatPercent(c.acumulado / c.contrato)], ['Saldo do contrato', mt(r2(c.contrato - c.acumulado))]);

    const pagDias = int(v.pagamentoDias);
    const obs = splitLines(v.observacoes);
    const blocks: Block[] = [
      { type: 'title', text: `Auto de Medição n.º ${v.numero || BLANK}`, subtitle: `Trabalhos executados de ${dateLong(v.periodoInicio)} a ${dateLong(v.periodoFim)}` },
      obraKeyValue(v, c.contrato != null ? [{ label: 'Valor do contrato', value: `${mt(c.contrato)} MT` }] : []),
      {
        type: 'paragraph',
        id: 'abertura',
        text: `Em ${dateLong(v.data)}, na obra acima identificada, procedeu-se, na presença dos abaixo assinados, à medição dos trabalhos executados pelo Empreiteiro no período indicado, com os resultados seguintes:`,
        en: 'On the date stated, the work done by the Contractor in the period was measured jointly, with the following results:',
        keepWithNext: true,
      },
      {
        type: 'table',
        columns: [
          { label: 'Art.º', width: 0.6, align: 'center' },
          { label: 'Descrição', width: 3.6 },
          { label: 'Un.', width: 0.5, align: 'center' },
          { label: 'Qt. contrato', width: 0.95, align: 'right' },
          { label: 'P. unit. (MT)', width: 1.15, align: 'right' },
          { label: 'Acum. anterior', width: 0.95, align: 'right' },
          { label: 'Deste auto', width: 0.85, align: 'right' },
          { label: 'Acumulado', width: 0.95, align: 'right' },
          { label: '% exec.', width: 0.75, align: 'right' },
          { label: 'Valor deste auto (MT)', width: 1.4, align: 'right' },
        ],
        rows,
        totals: [['', 'Valor dos trabalhos deste auto', '', '', '', '', '', '', '', mt(c.bruto)]],
      },
      {
        type: 'table',
        caption: 'Resumo financeiro',
        columns: [
          { label: 'Descrição', width: 5 },
          { label: 'Valor (MT)', width: 1.6, align: 'right' },
        ],
        rows: resumo.map((r) => (r[0] === '= ' ? ['= Soma', r[1]] : r)),
        totals: [['Total a pagar', mt(c.total)]],
      },
      { type: 'keyValue', title: 'Situação do contrato', columns: 2, items: situacao.map((r) => ({ label: r[0], value: /Execução/.test(r[0]) ? r[1] : `${r[1]} MT` })) },
      { type: 'amount', label: 'Total a pagar por este auto', value: c.total > 0 ? c.total : null },
      ...[
        { id: 'aceitacao', text: 'As quantidades constantes do presente auto foram medidas em conjunto e são aceites pelas partes para efeitos de pagamento.', en: 'The quantities were measured jointly and are accepted for payment.' },
        {
          id: 'qualidade',
          text: 'A assinatura do presente auto não constitui aceitação da qualidade dos trabalhos nem afasta a responsabilidade do Empreiteiro por defeitos, nos termos do contrato e da lei.',
          en: 'Signing this certificate does not accept the quality of the work or waive the Contractor’s liability for defects.',
        },
        {
          id: 'pagamento',
          text: `O valor apurado é pago${pagDias != null ? ` no prazo de ${pagDias} ${pagDias === 1 ? 'dia' : 'dias'}` : ' no prazo previsto no contrato'}, após a aprovação do presente auto pelo Dono da Obra e a apresentação da respectiva factura.`,
          en: 'The amount is paid after approval of this certificate and presentation of the invoice.',
        },
        ...(obs.length ? [{ id: 'observacoes', text: `Observações: ${obs.map(semPonto).join('; ')}.`, en: 'Notes.' }] : []),
      ].map((p, i, all): Block => ({ type: 'paragraph', id: p.id, text: `${i + 1}. ${p.text}`, en: p.en, size: 'small', keepWithNext: i === all.length - 1 })),
      ...signatureRows(assinaturasObra(v, { dono: 'Aprovado — O Dono da Obra' })),
    ];
    return blocks;
  },
});
