// Contrato de mútuo (empréstimo de dinheiro entre particulares ou empresas).
// In Mozambique the borrower's signature must be certified in person by a
// notary (Civil Code art. 1143 as amended), so the document goes to the notary.

import { addMonths, formatDateShort, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type FieldDef, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, int, num, numerar, papel, partesBlocks, partyFields,
  partyName, partyWarnings, pct, quantos, semPonto, str, testemunhasField, valorTexto,
} from './_contratos';

type Linha = { n: number; data: string; prestacao: number; juros: number; capital: number; saldo: number };

/** Equal monthly instalments (capital + interest on the outstanding balance). */
function plano(valor: number, taxaAnual: number, n: number, inicio: string): Linha[] {
  const r = taxaAnual / 100 / 12;
  const p = r > 0 ? (valor * r) / (1 - Math.pow(1 + r, -n)) : valor / n;
  const out: Linha[] = [];
  let saldo = valor;
  for (let i = 1; i <= n; i++) {
    const juros = roundMoney(saldo * r);
    let capital = roundMoney(p - juros);
    if (i === n) capital = roundMoney(saldo);
    saldo = roundMoney(saldo - capital);
    out.push({ n: i, data: inicio ? addMonths(inicio, i - 1) : '', prestacao: roundMoney(capital + juros), juros, capital, saldo: Math.max(0, saldo) });
  }
  return out;
}

const fiadorOn = (f: FieldDef): FieldDef => ({ ...f, showIf: (v: Values) => Boolean(v.fiador) && (f.showIf ? f.showIf(v) : true) });

export default defineTemplate({
  id: 'contrato-de-mutuo',
  family: 'contrato',
  official: 'notario',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'mutuante', title: l('Mutuante (quem empresta)', 'Lender'), personRole: 'outro' },
    { id: 'mutuario', title: l('Mutuário (quem recebe o empréstimo)', 'Borrower'), personRole: 'cliente' },
    { id: 'emprestimo', title: l('Empréstimo e juros', 'Loan and interest') },
    { id: 'reembolso', title: l('Reembolso', 'Repayment') },
    { id: 'fiador', title: l('Fiador (opcional)', 'Guarantor (optional)'), personRole: 'outro' },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('mutuante', { fromProfile: true }),
    ...partyFields('mutuario'),

    { name: 'valor', type: 'money', section: 'emprestimo', required: true, width: 'half', label: l('Valor emprestado', 'Amount lent') },
    {
      name: 'entregaForma',
      type: 'radio',
      section: 'emprestimo',
      width: 'half',
      label: l('Entrega do dinheiro', 'Handover of the money'),
      options: [
        { value: 'recebido', label: l('Recebido na assinatura', 'Received on signing') },
        { value: 'transferencia', label: l('Transferência posterior', 'Later transfer') },
      ],
      default: 'recebido',
    },
    { name: 'dataTransferencia', type: 'date', section: 'emprestimo', width: 'half', label: l('Transferência até', 'Transfer by'), showIf: (v) => v.entregaForma === 'transferencia' },
    { name: 'nibMutuario', type: 'text', section: 'emprestimo', width: 'half', label: l('NIB do mutuário', 'Borrower’s account (NIB)'), showIf: (v) => v.entregaForma === 'transferencia' },
    { name: 'finalidade', type: 'text', section: 'emprestimo', label: l('Finalidade (opcional)', 'Purpose (optional)'), placeholder: l('Ex.: obras de ampliação da residência', 'E.g. home extension works') },
    {
      name: 'juros',
      type: 'radio',
      section: 'emprestimo',
      required: true,
      label: l('Juros', 'Interest'),
      options: [
        { value: 'gratuito', label: l('Sem juros (gratuito)', 'Interest-free') },
        { value: 'oneroso', label: l('Com juros', 'With interest') },
      ],
      default: 'gratuito',
      help: l('Na dúvida, a lei presume que o empréstimo tem juros. Diga-o expressamente.', 'In case of doubt the law presumes interest is due. State it expressly.'),
    },
    {
      name: 'taxaJuroAnual',
      type: 'number',
      section: 'emprestimo',
      width: 'half',
      min: 0,
      max: 100,
      label: l('Taxa de juro anual (%)', 'Annual interest rate (%)'),
      help: l('Juros acima do limite legal (usura) são reduzidos ao máximo permitido.', 'Interest above the legal limit (usury) is reduced to the maximum allowed.'),
      showIf: (v) => v.juros === 'oneroso',
    },

    {
      name: 'reembolso',
      type: 'radio',
      section: 'reembolso',
      required: true,
      label: l('Forma de reembolso', 'Repayment'),
      options: [
        { value: 'unico', label: l('De uma só vez', 'In one payment') },
        { value: 'prestacoes', label: l('Em prestações mensais', 'Monthly instalments') },
      ],
      default: 'prestacoes',
    },
    { name: 'dataReembolso', type: 'date', section: 'reembolso', width: 'half', label: l('Data de reembolso', 'Repayment date'), showIf: (v) => v.reembolso === 'unico' },
    { name: 'prestacoesNumero', type: 'number', section: 'reembolso', width: 'half', min: 2, max: 120, default: 12, label: l('Número de prestações', 'Number of instalments'), showIf: (v) => v.reembolso === 'prestacoes' },
    { name: 'primeiraPrestacao', type: 'date', section: 'reembolso', width: 'half', label: l('Vencimento da 1.ª prestação', 'First instalment due'), showIf: (v) => v.reembolso === 'prestacoes' },
    { name: 'formaPagamento', type: 'select', section: 'reembolso', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    { name: 'nibMutuante', type: 'text', section: 'reembolso', width: 'half', label: l('NIB / conta do mutuante', 'Lender’s account (NIB)') },
    { name: 'antecipacao', type: 'toggle', section: 'reembolso', default: true, label: l('O mutuário pode pagar antecipadamente, sem penalização', 'Early repayment allowed without penalty') },
    {
      name: 'jurosMora',
      type: 'radio',
      section: 'reembolso',
      label: l('Juros de mora (atraso)', 'Default interest'),
      options: [
        { value: 'legal', label: l('À taxa legal', 'At the legal rate') },
        { value: 'convencional', label: l('Taxa acordada', 'Agreed rate') },
      ],
      default: 'legal',
    },
    { name: 'taxaMora', type: 'number', section: 'reembolso', width: 'half', min: 0, max: 100, label: l('Taxa de mora anual (%)', 'Annual default rate (%)'), showIf: (v) => v.jurosMora === 'convencional' },

    {
      name: 'fiador',
      type: 'toggle',
      section: 'fiador',
      label: l('Há um fiador', 'There is a guarantor'),
      help: l('O fiador responde pela dívida se o mutuário não pagar. Assina também o contrato.', 'The guarantor answers for the debt if the borrower does not pay, and also signs.'),
    },
    ...partyFields('fiador').map(fiadorOn),

    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const valor = money(v.valor);
    const taxa = v.juros === 'oneroso' ? num(v.taxaJuroAnual) ?? 0 : 0;
    const n = v.reembolso === 'prestacoes' ? Math.max(0, int(v.prestacoesNumero) ?? 0) : 0;
    const linhas = valor != null && valor > 0 && n > 0 ? plano(valor, taxa, n, typeof v.primeiraPrestacao === 'string' ? v.primeiraPrestacao : '') : [];
    const totalJuros = roundMoney(linhas.reduce((s, x) => s + x.juros, 0));
    return { valor, taxa, n, linhas, totalJuros, totalPagar: valor != null ? roundMoney(valor + totalJuros) : null, prestacao: linhas[0]?.prestacao ?? null };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [
      ...partyWarnings(v, 'mutuante', 'mutuante', 'lender'),
      ...partyWarnings(v, 'mutuario', 'mutuário', 'borrower'),
    ];
    if (v.fiador) w.push(...partyWarnings(v, 'fiador', 'fiador', 'guarantor'));
    w.push({
      level: 'warning',
      message: l(
        `A assinatura do mutuário deve ser reconhecida presencialmente no notário (${cite('mutuoForma')}). Sem isso o contrato pode ser nulo por falta de forma. Levem o documento por assinar ao notário.`,
        'The borrower’s signature must be certified in person by a notary. Without it the contract may be void for lack of form. Take the unsigned document to the notary.',
      ),
    });
    if (c.valor == null || c.valor <= 0) w.push({ level: 'error', field: 'valor', message: l('Indique o valor emprestado.', 'Enter the amount lent.') });
    if (v.juros === 'oneroso' && !(num(v.taxaJuroAnual) && num(v.taxaJuroAnual)! > 0)) {
      w.push({ level: 'warning', field: 'taxaJuroAnual', message: l('Indique a taxa de juro anual.', 'Enter the annual interest rate.') });
    }
    if (v.juros === 'oneroso') {
      w.push({
        level: 'info',
        field: 'taxaJuroAnual',
        message: l('A lei limita os juros (usura). Confirme o limite e a taxa de juros legais em vigor antes de fixar a taxa.', 'The law caps interest (usury). Check the cap and the legal interest rate before setting the rate.'),
      });
    }
    if (v.reembolso === 'prestacoes' && !v.primeiraPrestacao) w.push({ level: 'warning', field: 'primeiraPrestacao', message: l('Indique a data da primeira prestação.', 'Enter the first instalment date.') });
    if (v.reembolso === 'unico' && !v.dataReembolso) w.push({ level: 'warning', field: 'dataReembolso', message: l('Indique a data de reembolso.', 'Enter the repayment date.') });
    w.push({
      level: 'info',
      message: l(
        `Emprestar dinheiro como actividade habitual exige licença do Banco de Moçambique (${cite('creditoLicenca')}). Este contrato destina-se a empréstimos ocasionais. Pode haver imposto do selo sobre a operação: confirme na Direcção de Área Fiscal.`,
        'Lending money as a regular business requires a Banco de Moçambique licence. This contract is for occasional loans. Stamp duty may apply: check with the tax office.',
      ),
    });
    return w;
  },

  personName: (v) => partyName(v, 'mutuario') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const M = papel(v, 'mutuante', 'Mutuante', 'Mutuante');
    const R = papel(v, 'mutuario', 'Mutuário', 'Mutuária');
    const F = papel(v, 'fiador', 'Fiador', 'Fiadora');
    const forma = str(v.formaPagamento) || 'transferência bancária';
    const modo =
      forma === 'transferência bancária'
        ? `por transferência bancária para a conta com o NIB ${str(v.nibMutuante) || BLANK}, titulada ${M.pelo}`
        : forma === 'numerário'
          ? `em numerário, contra recibo assinado ${M.pelo}`
          : forma === 'cheque'
            ? `por cheque emitido à ordem ${M.de}`
            : `através de ${forma}${str(v.nibMutuante) ? `, para o número ${str(v.nibMutuante)}` : ''}`;

    const clauses: ClauseItem[] = [];
    clauses.push({
      id: 'objecto',
      heading: 'Objecto',
      text:
        v.entregaForma === 'transferencia'
          ? `Pelo presente contrato, ${M.o} empresta ${R.ao} a quantia de ${valorTexto(c.valor)}, que será transferida até ${dateLong(v.dataTransferencia)} para a conta com o NIB ${str(v.nibMutuario) || BLANK}, titulada ${R.pelo}, valendo o comprovativo da transferência como quitação.`
          : `Pelo presente contrato, ${M.o} empresta ${R.ao} a quantia de ${valorTexto(c.valor)}, que ${R.o} declara ter recebido nesta data, dando a respectiva quitação.`,
      en: `The Lender lends the Borrower ${c.valor != null ? formatMoney(c.valor) : '—'}, ${v.entregaForma === 'transferencia' ? 'to be transferred by the date stated' : 'received today (receipt acknowledged)'}.`,
    });
    if (str(v.finalidade)) {
      clauses.push({
        id: 'finalidade',
        heading: 'Finalidade',
        text: `A quantia mutuada destina-se a ${semPonto(v.finalidade).replace(/^(a|para)\s+/i, '')}.`,
        en: `The loan is for: ${v.finalidade}.`,
      });
    }
    clauses.push({
      id: 'juros',
      heading: 'Juros',
      text:
        v.juros === 'oneroso'
          ? numerar([
              `Sobre o capital em dívida vencem-se juros remuneratórios à taxa de ${pct(v.taxaJuroAnual)} ao ano, calculados sobre o capital em dívida em cada momento.`,
              v.reembolso === 'prestacoes'
                ? `Os juros são pagos mensalmente, juntamente com cada prestação, conforme o plano de reembolso constante do Anexo I, sendo o total de juros previsto de ${valorTexto(c.totalJuros)}.`
                : 'Os juros são pagos juntamente com o capital, na data do reembolso.',
            ])
          : 'O presente mútuo é gratuito, não vencendo juros remuneratórios.',
      en: v.juros === 'oneroso' ? `Interest at ${v.taxaJuroAnual ?? '—'}% a year on the outstanding balance.` : 'The loan is interest-free.',
    });

    const antecipa = v.antecipacao ? `${R.O} pode antecipar o reembolso, total ou parcial, sem qualquer penalização${v.juros === 'oneroso' ? ', deixando de vencer juros sobre o capital reembolsado' : ''}.` : '';
    clauses.push({
      id: 'reembolso',
      heading: 'Reembolso',
      text: numerar(
        v.reembolso === 'prestacoes'
          ? [
              `${R.O} obriga-se a restituir a quantia mutuada${v.juros === 'oneroso' ? ', acrescida dos juros,' : ''} em ${quantos(c.n, 'prestação', 'prestações', true)} mensais e sucessivas de ${valorTexto(c.prestacao)}, vencendo-se a primeira em ${dateLong(v.primeiraPrestacao)} e as restantes no mesmo dia dos meses seguintes, conforme o plano constante do Anexo I.`,
              `O pagamento é feito ${modo}.`,
              antecipa,
            ]
          : [
              `${R.O} obriga-se a restituir a quantia mutuada${v.juros === 'oneroso' ? ', acrescida dos juros vencidos,' : ''} de uma só vez, até ${dateLong(v.dataReembolso)}.`,
              `O pagamento é feito ${modo}.`,
              antecipa,
            ],
      ),
      en: v.reembolso === 'prestacoes' ? `Repayment in ${c.n} monthly instalments per Annex I, by ${forma}.` : `Repayment in one payment by ${v.dataReembolso || '—'}, by ${forma}.`,
    });
    clauses.push({
      id: 'incumprimento',
      heading: 'Mora e incumprimento',
      text: numerar([
        v.reembolso === 'prestacoes' ? `A falta de pagamento de qualquer prestação na data do seu vencimento importa o vencimento imediato de todas as restantes (${cite('codigoCivilPrestacoes')}).` : '',
        `Em caso de atraso, são devidos juros de mora ${v.jurosMora === 'convencional' ? `à taxa de ${pct(v.taxaMora)} ao ano` : 'à taxa legal'}, desde a data do vencimento até ao efectivo pagamento, sem prejuízo da cobrança judicial da dívida.`,
      ]),
      en: `${v.reembolso === 'prestacoes' ? 'Missing one instalment makes the whole balance due. ' : ''}Late payment bears default interest ${v.jurosMora === 'convencional' ? `at ${v.taxaMora ?? '—'}% a year` : 'at the legal rate'}.`,
    });
    if (v.fiador) {
      clauses.push({
        id: 'fianca',
        heading: 'Fiança',
        text: `${F.O}, ${partyName(v, 'fiador') || BLANK}, acima ${F.f ? 'identificada' : 'identificado'}, intervém no presente contrato e constitui-se ${F.f ? 'fiadora' : 'fiador'} e principal ${F.f ? 'pagadora' : 'pagador'} de todas as obrigações ${R.de} dele emergentes, respondendo solidariamente com ${R.f ? 'esta' : 'este'} e renunciando ao benefício da excussão prévia.`,
        en: 'The Guarantor guarantees all the Borrower’s obligations jointly and severally and waives the right to require the Lender to pursue the Borrower first.',
      });
    }
    clauses.push(...clausulasFinais(v));

    const parties = [
      { p: 'mutuante', role: M, en: 'Lender' },
      { p: 'mutuario', role: R, en: 'Borrower' },
      ...(v.fiador ? [{ p: 'fiador', role: F, en: 'Guarantor' }] : []),
    ];
    const cols = [assinatura(ctx, 'mutuante', M, true), assinatura(ctx, 'mutuario', R)];
    if (v.fiador) cols.push(assinatura(ctx, 'fiador', F));

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de mútuo' },
      ...partesBlocks(v, parties),
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'É celebrado e reciprocamente aceite o presente contrato de mútuo, que se rege pelas cláusulas seguintes e, no que nelas for omisso, pela legislação aplicável:',
        en: 'This loan agreement is entered into on the following terms and, where silent, the applicable law:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fecho(ctx, cols, {
        notario: `Reconhecimento presencial da assinatura ${R.de}${v.fiador ? ` e ${F.de}` : ''}, exigido por lei para a validade do contrato.`,
      }),
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
          rows: c.linhas.map((x: Linha) => [
            String(x.n),
            x.data ? formatDateShort(x.data) : BLANK,
            formatMoney(x.prestacao, false),
            formatMoney(x.juros, false),
            formatMoney(x.capital, false),
            formatMoney(x.saldo, false),
          ]),
          totals: [['', 'Total, em MT', formatMoney(c.totalPagar, false), formatMoney(c.totalJuros, false), formatMoney(c.valor, false), '']],
        },
        { type: 'signatures', columns: [assinatura(ctx, 'mutuante', M), assinatura(ctx, 'mutuario', R)] },
      );
    }
    return blocks;
  },
});
