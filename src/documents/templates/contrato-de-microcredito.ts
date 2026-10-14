// Contrato de microcrédito de uma instituição autorizada (operador de
// microcrédito, microbanco, cooperativa de crédito), com ficha de informação
// sobre juros e custo total e plano de reembolso.

import { addDays, addMonths, formatDateShort, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type FieldDef, type FieldOption, type Values, type Warning } from '../model';
import { BLANK, cite, formatMoney, l, money } from './_shared';
import {
  assinatura, clausulasFinais, documentoFields, fecho, foroField, int, num, numerar, papel, partesBlocks, partyFields, partyName, partyWarnings, pct, quantos, semPonto,
  str, testemunhasField, valorTexto,
} from './_contratos';

const PERIODO_OPTIONS: FieldOption[] = [
  { value: 'mensal', label: l('Mensal', 'Monthly') },
  { value: 'quinzenal', label: l('Quinzenal', 'Fortnightly') },
  { value: 'semanal', label: l('Semanal', 'Weekly') },
];
const POR_ANO: Record<string, number> = { mensal: 12, quinzenal: 26, semanal: 52 };
const NOME: Record<string, [string, string]> = { mensal: ['mensal', 'mensais'], quinzenal: ['quinzenal', 'quinzenais'], semanal: ['semanal', 'semanais'] };

type Linha = { n: number; data: string; prestacao: number; juros: number; capital: number; saldo: number };

function plano(valor: number, taxaAnual: number, n: number, periodo: string, inicio: string): Linha[] {
  const r = taxaAnual / 100 / (POR_ANO[periodo] ?? 12);
  const p = r > 0 ? (valor * r) / (1 - Math.pow(1 + r, -n)) : valor / n;
  const out: Linha[] = [];
  let saldo = valor;
  for (let i = 1; i <= n; i++) {
    const juros = roundMoney(saldo * r);
    let capital = roundMoney(p - juros);
    if (i === n) capital = roundMoney(saldo);
    saldo = roundMoney(saldo - capital);
    const data = !inicio ? '' : periodo === 'mensal' ? addMonths(inicio, i - 1) : addDays(inicio, (i - 1) * (periodo === 'semanal' ? 7 : 14));
    out.push({ n: i, data, prestacao: roundMoney(capital + juros), juros, capital, saldo: Math.max(0, saldo) });
  }
  return out;
}

const fiadorOn = (f: FieldDef): FieldDef => ({ ...f, section: 'garantias', showIf: (v: Values) => Boolean(v.fiador) && (f.showIf ? f.showIf(v) : true) });

export default defineTemplate({
  id: 'contrato-de-microcredito',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'mutuante', title: l('Instituição que concede o crédito', 'Lending institution'), personRole: 'outro' },
    { id: 'mutuario', title: l('Cliente (mutuário)', 'Borrower'), personRole: 'cliente' },
    { id: 'credito', title: l('Crédito, juros e encargos', 'Loan, interest and charges') },
    { id: 'reembolso', title: l('Reembolso', 'Repayment') },
    { id: 'garantias', title: l('Garantias', 'Security'), personRole: 'outro' },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('mutuante', { fromProfile: true, tipoDefault: 'empresa' }),
    {
      name: 'licenca',
      type: 'text',
      section: 'mutuante',
      required: true,
      label: l('Autorização ou registo no Banco de Moçambique', 'Banco de Moçambique licence or registration'),
      placeholder: l('Ex.: operador de microcrédito registado no Banco de Moçambique sob o n.º …', 'E.g. microcredit operator registered under no. …'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.licenca ?? '' : ''),
    },
    ...partyFields('mutuario'),
    { name: 'mutuarioActividade', type: 'text', section: 'mutuario', label: l('Actividade ou profissão (opcional)', 'Business or occupation (optional)'), placeholder: l('Ex.: venda de produtos alimentares no Mercado do Xipamanine', 'E.g. food stall at a market') },
    { name: 'valor', type: 'money', section: 'credito', width: 'half', required: true, label: l('Montante do crédito', 'Loan amount') },
    { name: 'finalidade', type: 'text', section: 'credito', width: 'half', label: l('Finalidade', 'Purpose'), placeholder: l('Ex.: compra de stock para a banca', 'E.g. buying stock') },
    { name: 'primeRate', type: 'number', section: 'credito', width: 'half', min: 0, max: 100, label: l('Prime Rate em vigor (%)', 'Prime Rate in force (%)'), help: l('A Prime Rate do Sistema Financeiro Moçambicano do mês da assinatura, publicada pelo Banco de Moçambique.', 'The Mozambican Financial System Prime Rate for the month, published by the central bank.') },
    { name: 'spread', type: 'number', section: 'credito', width: 'half', min: 0, max: 100, label: l('Margem / spread (%)', 'Spread (%)') },
    { name: 'comissaoAbertura', type: 'money', section: 'credito', width: 'half', label: l('Comissão de abertura / análise', 'Arrangement fee') },
    { name: 'outrosEncargos', type: 'money', section: 'credito', width: 'half', label: l('Outros encargos (seguro, imposto do selo)', 'Other charges (insurance, stamp duty)') },
    { name: 'taeg', type: 'number', section: 'credito', width: 'half', min: 0, max: 1000, label: l('TAEG calculada pela instituição (%)', 'APR computed by the lender (%)'), help: l('Taxa anual de encargos efectiva global, calculada pelo sistema da instituição. Deixe vazio se não a calcular.', 'Annual percentage rate from the lender’s system. Leave empty if not computed.') },
    { name: 'periodicidade', type: 'select', section: 'reembolso', width: 'half', label: l('Prestações', 'Instalments'), options: PERIODO_OPTIONS, default: 'mensal' },
    { name: 'prestacoesNumero', type: 'number', section: 'reembolso', width: 'half', min: 1, max: 260, default: 12, label: l('Número de prestações', 'Number of instalments') },
    { name: 'primeiraPrestacao', type: 'date', section: 'reembolso', width: 'half', label: l('Vencimento da 1.ª prestação', 'First instalment due') },
    { name: 'formaPagamento', type: 'text', section: 'reembolso', width: 'half', default: 'depósito ou transferência para a conta da instituição', label: l('Forma de pagamento', 'Payment method'), placeholder: l('Ex.: M-Pesa para o número 84 …', 'E.g. M-Pesa to number …') },
    { name: 'desembolso', type: 'text', section: 'reembolso', label: l('Desembolso (como o cliente recebe)', 'Disbursement (how the borrower receives it)'), default: 'por transferência para a conta do cliente', placeholder: l('Ex.: por M-Pesa para o número 84 …', 'E.g. by M-Pesa') },
    { name: 'taxaMora', type: 'number', section: 'reembolso', width: 'half', min: 0, max: 100, label: l('Sobretaxa de mora anual (%)', 'Default surcharge (% a year)'), help: l('Acresce à taxa do contrato durante o atraso. Vazio = juros de mora à taxa legal.', 'Added to the contract rate while overdue. Empty = legal rate.') },
    { name: 'prestacoesVencimento', type: 'number', section: 'reembolso', width: 'half', min: 1, max: 12, default: 2, label: l('Prestações em falta para vencer toda a dívida', 'Missed instalments before the whole debt is due') },
    { name: 'garantiaBens', type: 'text', section: 'garantias', label: l('Bens dados em penhor (opcional)', 'Pledged goods (optional)'), placeholder: l('Ex.: arca congeladora Hisense, n.º de série …', 'E.g. a freezer, serial no. …') },
    { name: 'poupanca', type: 'money', section: 'garantias', width: 'half', label: l('Poupança cativa / caução (opcional)', 'Cash collateral (optional)') },
    { name: 'fiador', type: 'toggle', section: 'garantias', label: l('Há um fiador', 'There is a guarantor') },
    ...partyFields('fiador').map(fiadorOn),
    foroField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const valor = money(v.valor);
    const taxa = (num(v.primeRate) ?? 0) + (num(v.spread) ?? 0);
    const n = Math.max(0, int(v.prestacoesNumero) ?? 0);
    const periodo = str(v.periodicidade) || 'mensal';
    const linhas = valor != null && valor > 0 && n > 0 ? plano(valor, taxa, n, periodo, str(v.primeiraPrestacao)) : [];
    const totalJuros = roundMoney(linhas.reduce((a, x) => a + x.juros, 0));
    const encargos = roundMoney((money(v.comissaoAbertura) ?? 0) + (money(v.outrosEncargos) ?? 0));
    const totalReembolsar = valor != null ? roundMoney(valor + totalJuros) : null;
    return { valor, taxa, n, periodo, linhas, totalJuros, encargos, totalReembolsar, custoTotal: roundMoney(totalJuros + encargos), prestacao: linhas[0]?.prestacao ?? null };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'mutuante', 'instituição', 'lender'), ...partyWarnings(v, 'mutuario', 'mutuário', 'borrower')];
    if (v.fiador) w.push(...partyWarnings(v, 'fiador', 'fiador', 'guarantor'));
    if (c.valor == null) w.push({ level: 'error', field: 'valor', message: l('Indique o montante do crédito.', 'Enter the loan amount.') });
    if (num(v.primeRate) == null || num(v.spread) == null) {
      w.push({ level: 'warning', field: 'primeRate', message: l('Indique a Prime Rate em vigor no mês e a margem (spread) aplicada: a taxa do contrato é a soma das duas.', 'Enter the Prime Rate for the month and the spread: the contract rate is their sum.') });
    }
    w.push({
      level: 'warning',
      message: l(
        `Só instituições autorizadas ou registadas no Banco de Moçambique podem conceder crédito como actividade (${cite('creditoLicenca')}). Confirme a Prime Rate do mês e os limites fixados pelo Banco de Moçambique ao crédito ao consumo de microfinanças (taxa de esforço e prazo máximo) antes de assinar (${cite('finMicrocredito')}).`,
        'Only institutions licensed or registered with the Banco de Moçambique may lend as a business. Check the month’s Prime Rate and the central bank’s limits on microfinance consumer credit before signing.',
      ),
    });
    w.push({
      level: 'info',
      message: l(
        'Entregue ao cliente a ficha de informação e uma cópia assinada do contrato, e explique-lhe o custo total. Confirme com o seu jurista os requisitos de forma do contrato (reconhecimento de assinaturas) e o imposto do selo aplicável.',
        'Give the borrower the information sheet and a signed copy, and explain the total cost. Check the form requirements and stamp duty with your legal adviser.',
      ),
    });
    return w;
  },

  personName: (v) => partyName(v, 'mutuario') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const M = papel(v, 'mutuante', 'Instituição', 'Instituição', true);
    const R = papel(v, 'mutuario', 'Cliente', 'Cliente');
    const F = papel(v, 'fiador', 'Fiador', 'Fiadora');
    const [sing, plur] = NOME[c.periodo] ?? NOME.mensal;
    const taxaTxt = num(v.primeRate) != null && num(v.spread) != null ? `${pct(c.taxa)} ao ano` : `${BLANK}% ao ano`;

    const ficha: Block = {
      type: 'keyValue',
      title: 'Ficha de informação do crédito',
      columns: 2,
      items: [
        { label: 'Montante do crédito', value: c.valor != null ? formatMoney(c.valor) : `${BLANK} MT` },
        { label: 'Prazo', value: `${quantos(c.n, 'prestação', 'prestações', true)} ${c.n === 1 ? sing : plur}` },
        { label: 'Taxa de juro nominal', value: taxaTxt },
        { label: 'Indexante e margem', value: `Prime Rate ${pct(v.primeRate)} + spread ${pct(v.spread)}` },
        { label: 'Valor da prestação', value: c.prestacao != null ? formatMoney(c.prestacao) : `${BLANK} MT` },
        { label: 'Total de juros', value: formatMoney(c.totalJuros) },
        { label: 'Comissões e encargos', value: formatMoney(c.encargos) },
        { label: 'Custo total do crédito', value: formatMoney(c.custoTotal) },
        { label: 'Montante total a reembolsar', value: c.totalReembolsar != null ? formatMoney(c.totalReembolsar) : `${BLANK} MT` },
        { label: 'TAEG', value: num(v.taeg) != null ? `${pct(v.taeg)}` : 'a indicar pela instituição' },
      ],
    };

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto e finalidade',
        text: numerar([
          `Pelo presente contrato, ${M.o} concede ${R.ao} um crédito no montante de ${valorTexto(c.valor)}${str(v.finalidade) ? `, destinado a ${semPonto(v.finalidade).replace(/^(a|para)\s+/i, '')}` : ''}.`,
          `O crédito é desembolsado ${semPonto(v.desembolso) || 'por transferência para a conta do cliente'}, valendo o comprovativo como quitação ${R.de}.`,
        ]),
        en: 'The institution grants the borrower a loan of the amount stated, disbursed as indicated.',
      },
      {
        id: 'juros',
        heading: 'Juros',
        text: numerar([
          `Sobre o capital em dívida vencem-se juros à taxa nominal de ${taxaTxt}, correspondente à Prime Rate do Sistema Financeiro Moçambicano em vigor nesta data (${pct(v.primeRate)}) acrescida de uma margem de ${pct(v.spread)}.`,
          'A taxa de juro acompanha as variações da Prime Rate publicadas pelo Banco de Moçambique, mantendo-se a margem; qualquer alteração da prestação daí resultante é comunicada por escrito ao Cliente antes de produzir efeitos.',
        ]),
        en: 'Interest is the Prime Rate plus the spread; it follows changes in the Prime Rate, and any change in the instalment is notified in writing first.',
      },
      {
        id: 'encargos',
        heading: 'Comissões e encargos',
        text: `Além dos juros, ${R.o} paga apenas os encargos constantes da ficha de informação: comissão de abertura de ${valorTexto(money(v.comissaoAbertura) ?? 0)} e outros encargos de ${valorTexto(money(v.outrosEncargos) ?? 0)}. Nenhum outro encargo pode ser cobrado sem estar previsto no contrato e no preçário da instituição.`,
        en: 'Only the fees in the information sheet may be charged.',
      },
      {
        id: 'reembolso',
        heading: 'Reembolso',
        text: numerar([
          `${R.O} reembolsa o crédito e os juros em ${quantos(c.n, 'prestação', 'prestações', true)} ${c.n === 1 ? sing : plur} e sucessivas de ${valorTexto(c.prestacao)}, vencendo-se a primeira em ${formatDateShort(str(v.primeiraPrestacao)) || BLANK}, conforme o plano do Anexo I.`,
          `Os pagamentos são feitos por ${semPonto(v.formaPagamento) || BLANK}, e ${M.o} entrega recibo ou comprovativo de cada pagamento.`,
          `${R.O} pode reembolsar antecipadamente, no todo ou em parte, deixando de pagar os juros correspondentes ao período não decorrido.`,
        ]),
        en: 'Repayment in instalments per Annex I; receipts are given; early repayment is allowed without further interest.',
      },
      {
        id: 'mora',
        heading: 'Atraso e incumprimento',
        text: numerar([
          `Em caso de atraso, são devidos juros de mora ${num(v.taxaMora) != null ? `à taxa do contrato acrescida de ${pct(v.taxaMora)} ao ano` : 'à taxa legal'}, sobre a prestação em atraso, desde o vencimento até ao pagamento.`,
          `A falta de pagamento de ${quantos(int(v.prestacoesVencimento) ?? 2, 'prestação', 'prestações', true)}${(int(v.prestacoesVencimento) ?? 2) > 1 ? ' consecutivas' : ''}, depois de ${R.o} ser ${R.f ? 'interpelada' : 'interpelado'} por escrito para pagar, permite ${M.ao} exigir de imediato todo o capital em dívida (${cite('codigoCivilPrestacoes')}).`,
          `A cobrança é feita com respeito pela dignidade ${R.de}, sem ameaças, exposição pública ou contactos a terceiros que não sejam garantes.`,
        ]),
        en: 'Late payment bears default interest; after missed instalments and written notice the whole balance may be called; collection must respect the borrower’s dignity.',
      },
    ];
    const garantias: string[] = [];
    if (str(v.garantiaBens)) garantias.push(`penhor sobre ${semPonto(v.garantiaBens)}, que ${R.o} declara ser de sua propriedade e conserva em seu poder como ${R.f ? 'fiel depositária' : 'fiel depositário'}`);
    if (money(v.poupanca) != null) garantias.push(`poupança cativa de ${valorTexto(money(v.poupanca))}, que só pode ser usada para pagar prestações vencidas e não pagas e é restituída no fim do contrato`);
    if (v.fiador) garantias.push(`fiança prestada por ${partyName(v, 'fiador') || BLANK}, que se obriga como ${F.f ? 'fiadora e principal pagadora' : 'fiador e principal pagador'}`);
    if (garantias.length) clauses.push({ id: 'garantias', heading: 'Garantias', text: `Em garantia do cumprimento, são prestadas: ${garantias.join('; ')}.`, en: 'Security given for the loan.' });
    clauses.push(
      {
        id: 'informacao',
        heading: 'Informação, reclamações e dados',
        text: numerar([
          `${R.O} declara ter recebido, antes da assinatura, a ficha de informação e o plano de reembolso, e que lhe foram explicados os juros, os encargos e o custo total do crédito. Tem direito a receber, a pedido, o extracto do crédito e uma cópia do contrato.`,
          `${R.O} pode reclamar junto ${M.de} e, não sendo atendido, junto do Banco de Moçambique (${cite('finTratamentoReclamacoes')}).`,
          `${R.O} autoriza o tratamento dos seus dados para gestão do crédito e a sua comunicação à central de informação de crédito do Banco de Moçambique, nos termos legais.`,
        ]),
        en: 'The borrower received the information sheet and plan; may complain to the institution and the central bank; data is reported to the credit register as required.',
      },
      ...clausulasFinais(v),
    );

    const parties = [
      { p: 'mutuante', role: M, en: 'Lender' },
      { p: 'mutuario', role: R, en: 'Borrower' },
      ...(v.fiador ? [{ p: 'fiador', role: F, en: 'Guarantor' }] : []),
    ];
    const cols = [assinatura(ctx, 'mutuante', M, true), assinatura(ctx, 'mutuario', R)];
    if (v.fiador) cols.push(assinatura(ctx, 'fiador', F));

    const partes = partesBlocks(v, parties);
    const primeira = partes[0];
    if (primeira?.type === 'paragraph' && str(v.licenca)) primeira.text = primeira.text.replace(/, adiante designada por/, `, ${semPonto(v.licenca)}, adiante designada por`);

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de microcrédito' },
      ...partes,
      { type: 'paragraph', id: 'celebracao', text: 'É celebrado o presente contrato de crédito, que se rege pelas cláusulas seguintes e pela legislação aplicável:', en: 'This loan agreement is entered into on the following terms:' },
      ficha,
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fecho(ctx, cols),
    ];
    if (c.linhas.length) {
      blocks.push(
        { type: 'pageBreakHint' },
        { type: 'title', text: 'Anexo I — Plano de reembolso' },
        {
          type: 'table',
          columns: [
            { label: 'N.º', width: 0.5, align: 'right' },
            { label: 'Vencimento', width: 1.3 },
            { label: 'Prestação', width: 1.3, align: 'right' },
            { label: 'Juros', width: 1.1, align: 'right' },
            { label: 'Capital', width: 1.3, align: 'right' },
            { label: 'Capital em dívida', width: 1.5, align: 'right' },
          ],
          rows: c.linhas.map((x: Linha) => [String(x.n), x.data ? formatDateShort(x.data) : BLANK, formatMoney(x.prestacao, false), formatMoney(x.juros, false), formatMoney(x.capital, false), formatMoney(x.saldo, false)]),
          totals: [['', 'Total, em MT', formatMoney(c.totalReembolsar, false), formatMoney(c.totalJuros, false), formatMoney(c.valor, false), '']],
          note: 'Plano calculado com a taxa em vigor na data do contrato; é actualizado se a Prime Rate variar.',
        },
        { type: 'signatures', columns: [assinatura(ctx, 'mutuante', M), assinatura(ctx, 'mutuario', R)] },
      );
    }
    return blocks;
  },
});
