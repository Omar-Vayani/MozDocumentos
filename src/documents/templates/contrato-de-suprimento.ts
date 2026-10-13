// Contrato de suprimento: a member lends money to the company, with repayment
// terms and, optionally, interest and conversion into capital.
import { formatMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, isF, l, lineItems, localField, money } from './_shared';
import {
  companyColumns, isEmpresa, num, numerar, parte, parteFields, parteNome, parteSignature, representadaPor, representantes, REPRESENTANTE_COLUMNS,
  representantesDefault, semPonto, signatureRows, sociedadeFields, sociedadeIdent, sociedadeNome, str, valorTexto,
} from './_sociedades';

type Prest = { data: string; valor: number | null };
const prestacoes = (v: Values): Prest[] =>
  lineItems(v.prestacoes)
    .map((r) => ({ data: str(r.data), valor: money(r.valor) }))
    .filter((p) => p.data || p.valor != null);

export default defineTemplate({
  id: 'contrato-de-suprimento',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'socio', title: l('Sócio que empresta', 'Lending member'), personRole: 'outro' },
    { id: 'sociedade', title: l('Sociedade', 'Company') },
    { id: 'emprestimo', title: l('Montante e entrega', 'Amount and delivery') },
    { id: 'reembolso', title: l('Reembolso e juros', 'Repayment and interest') },
    { id: 'final', title: l('Disposições finais', 'Final provisions') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data de assinatura', 'Signing date')),
    ...parteFields('socio', 'socio'),
    ...sociedadeFields('sociedade'),
    {
      name: 'representantes',
      type: 'lines',
      section: 'sociedade',
      label: l('Quem assina pela sociedade', 'Who signs for the company'),
      help: l('Se o sócio que empresta for o único gerente, é recomendável que outro sócio também assine.', 'If the lending member is the only manager, another member should also sign.'),
      addLabel: l('Adicionar', 'Add'),
      columns: REPRESENTANTE_COLUMNS,
      default: representantesDefault,
    },
    { name: 'valor', type: 'money', section: 'emprestimo', width: 'half', required: true, label: l('Montante emprestado (MT)', 'Amount lent (MT)') },
    {
      name: 'entrega',
      type: 'select',
      section: 'emprestimo',
      width: 'half',
      label: l('Entrega do dinheiro', 'Delivery of the money'),
      options: [
        { value: 'entregue', label: l('Já entregue (nesta data)', 'Already delivered (today)') },
        { value: 'ate', label: l('Será entregue até uma data', 'To be delivered by a date') },
      ],
      default: 'entregue',
    },
    { name: 'dataEntrega', type: 'date', section: 'emprestimo', width: 'half', label: l('Data limite de entrega', 'Delivery deadline'), showIf: (v) => v.entrega === 'ate' },
    { name: 'contaSociedade', type: 'text', section: 'emprestimo', width: 'half', label: l('Conta / NIB da sociedade (opcional)', 'Company account / NIB (optional)'), default: (c) => (c.profile?.kind === 'empresa' ? c.profile.nib ?? '' : '') },
    {
      name: 'finalidade',
      type: 'textarea',
      section: 'emprestimo',
      rows: 2,
      label: l('Finalidade (opcional)', 'Purpose (optional)'),
      placeholder: l('Ex.: aquisição de equipamento de construção e reforço da tesouraria', 'E.g. buying equipment and working capital'),
    },
    {
      name: 'reembolso',
      type: 'select',
      section: 'reembolso',
      width: 'half',
      label: l('Reembolso', 'Repayment'),
      options: [
        { value: 'unico', label: l('De uma só vez, numa data', 'In one payment, on a date') },
        { value: 'prestacoes', label: l('Em prestações', 'In instalments') },
        { value: 'deliberacao', label: l('Quando os sócios deliberarem', 'When the members decide') },
      ],
      default: 'unico',
    },
    { name: 'dataReembolso', type: 'date', section: 'reembolso', width: 'half', label: l('Data de reembolso', 'Repayment date'), showIf: (v) => v.reembolso === 'unico' },
    {
      name: 'prestacoes',
      type: 'lines',
      section: 'reembolso',
      label: l('Prestações', 'Instalments'),
      addLabel: l('Adicionar prestação', 'Add instalment'),
      columns: [
        { name: 'data', type: 'date', label: l('Data', 'Date') },
        { name: 'valor', type: 'money', label: l('Valor (MT)', 'Amount (MT)') },
      ],
      default: [],
      showIf: (v) => v.reembolso === 'prestacoes',
    },
    { name: 'juros', type: 'toggle', section: 'reembolso', label: l('Com juros', 'With interest') },
    { name: 'taxaJuros', type: 'number', section: 'reembolso', width: 'half', min: 0, max: 100, label: l('Taxa de juro anual (%)', 'Annual interest rate (%)'), showIf: (v) => Boolean(v.juros) },
    {
      name: 'pagamentoJuros',
      type: 'select',
      section: 'reembolso',
      width: 'half',
      label: l('Pagamento dos juros', 'Interest payment'),
      options: [
        { value: 'reembolso', label: l('Com o reembolso do capital', 'With the principal') },
        { value: 'mensal', label: l('Mensalmente', 'Monthly') },
        { value: 'trimestral', label: l('Trimestralmente', 'Quarterly') },
        { value: 'anual', label: l('Anualmente', 'Yearly') },
      ],
      default: 'reembolso',
      showIf: (v) => Boolean(v.juros),
    },
    { name: 'conversao', type: 'toggle', section: 'reembolso', label: l('Pode ser convertido em capital', 'May be converted into capital'), help: l('Os sócios podem deliberar transformar o crédito em aumento de capital.', 'Members may decide to turn the loan into a capital increase.') },
    { name: 'dataDeliberacao', type: 'date', section: 'final', width: 'half', label: l('Data da deliberação que autoriza (opcional)', 'Date of authorising resolution (optional)') },
    { name: 'foro', type: 'text', section: 'final', width: 'half', label: l('Tribunal competente', 'Competent court'), default: 'Tribunal Judicial da Cidade de Maputo' },
  ],

  personName: (v) => parteNome(v, 'socio') || undefined,
  documentDate: (v) => v.data,

  warnings: (v) => {
    const w: Warning[] = [];
    const total = money(v.valor);
    if (v.reembolso === 'prestacoes') {
      const soma = prestacoes(v).reduce((a, p) => a + (p.valor ?? 0), 0);
      if (total != null && soma > 0 && Math.abs(soma - total) > 0.5) {
        w.push({ level: 'warning', field: 'prestacoes', message: l(`A soma das prestações (${formatMoney(soma)}) é diferente do montante emprestado.`, `The instalments (${formatMoney(soma)}) do not add up to the amount lent.`) });
      }
    }
    w.push(
      { level: 'info', message: l(`Forma: o contrato de suprimento não exige forma especial (${cite('suprimentoForma')}), mas o documento escrito prova o empréstimo e o seu registo na contabilidade.`, 'Form: no special form is required, but a written contract proves the loan and supports the accounting entry.') },
      { level: 'info', message: l('Verifique se o contrato de sociedade exige deliberação dos sócios para suprimentos.', 'Check whether the articles require a members’ resolution for shareholder loans.') },
      { level: 'info', message: l('Impostos: os juros são rendimento do sócio, sujeito a retenção na fonte, e as operações de crédito podem pagar imposto do selo. Confirme junto da Autoridade Tributária.', 'Tax: interest is the member’s income, subject to withholding, and credit operations may pay stamp duty. Check with the Tax Authority.') },
    );
    return w;
  },

  blocks: (ctx) => {
    const v = ctx.values;
    const f = !isEmpresa(v, 'socio') && isF(v.socioGenero);
    const OS = f ? 'A Sócia' : 'O Sócio';
    const aoS = f ? 'à Sócia' : 'ao Sócio';
    const reps = representantes(v.representantes);
    const ps = prestacoes(v);
    const taxa = num(v.taxaJuros);
    const fin = semPonto(v.finalidade);

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: numerar([
          `${OS} concede à Sociedade, a título de suprimento, a quantia de ${valorTexto(v.valor)}${fin ? `, destinada a ${fin.charAt(0).toLocaleLowerCase('pt')}${fin.slice(1)}` : ''}.`,
          v.entrega === 'ate'
            ? `A quantia é entregue até ${dateLong(v.dataEntrega)}, por transferência para a conta da Sociedade${str(v.contaSociedade) ? ` com o NIB ${str(v.contaSociedade)}` : ''}.`
            : `A quantia foi entregue nesta data, por transferência para a conta da Sociedade${str(v.contaSociedade) ? ` com o NIB ${str(v.contaSociedade)}` : ''}, dando a Sociedade a respectiva quitação.`,
        ]),
        en: `The member lends the company ${money(v.valor) ?? '—'} MT as a shareholder loan${v.entrega === 'ate' ? ', to be transferred by the date stated' : ', transferred today'}.`,
      },
    ];
    let reemb: string;
    if (v.reembolso === 'prestacoes') {
      reemb = ps.length
        ? `A Sociedade reembolsa o suprimento nas seguintes prestações:\n${ps.map((p, i) => `${'abcdefghijklmnopqrstuvwxyz'[i] ?? i + 1}) ${valorTexto(p.valor, false)}, até ${dateLong(p.data)}${i === ps.length - 1 ? '.' : ';'}`).join('\n')}`
        : `A Sociedade reembolsa o suprimento em prestações, nas datas e montantes seguintes: ${BLANK}.`;
    } else if (v.reembolso === 'deliberacao') {
      reemb = 'A Sociedade reembolsa o suprimento quando os sócios o deliberarem, tendo em conta a sua situação financeira, salvo acordo diferente entre as partes.';
    } else {
      reemb = `A Sociedade reembolsa o suprimento de uma só vez, até ${dateLong(v.dataReembolso)}.`;
    }
    clauses.push({
      id: 'reembolso',
      heading: 'Prazo e reembolso',
      text: numerar([reemb, 'A Sociedade pode antecipar o reembolso, no todo ou em parte, sem qualquer penalização.']),
      en: 'The company repays the loan as stated and may repay early without penalty.',
    });
    const periodos: Record<string, string> = { mensal: 'mensalmente', trimestral: 'trimestralmente', anual: 'anualmente', reembolso: 'juntamente com o reembolso do capital' };
    clauses.push({
      id: 'juros',
      heading: 'Juros',
      text: v.juros
        ? `O suprimento vence juros à taxa anual de ${taxa != null ? `${taxa}%` : '____%'}, pagos ${periodos[v.pagamentoJuros] ?? periodos.reembolso}, deduzidos dos impostos que a Sociedade deva reter na fonte.`
        : 'O suprimento não vence juros.',
      en: v.juros ? `Interest at ${taxa ?? '—'}% a year, paid ${v.pagamentoJuros || 'with the principal'}, net of withholding tax.` : 'The loan bears no interest.',
    });
    if (v.conversao) {
      clauses.push({
        id: 'conversao',
        heading: 'Conversão em capital',
        text: `Por deliberação dos sócios, o crédito de suprimento pode ser convertido em capital social, mediante aumento de capital subscrito ${f ? 'pela Sócia' : 'pelo Sócio'}, extinguindo-se o crédito na medida da conversão.`,
        en: 'By members’ resolution the loan may be converted into a capital increase subscribed by the member.',
      });
    }
    clauses.push(
      {
        id: 'contabilidade',
        heading: 'Registo contabilístico',
        text: `A Sociedade regista o suprimento na sua contabilidade como dívida a sócios e entrega ${aoS}, quando lho pedir, extracto do respectivo saldo.`,
        en: 'The company records the loan as owed to members and gives the member a balance statement on request.',
      },
      {
        id: 'lei',
        heading: 'Lei aplicável e foro',
        text: `O presente contrato rege-se pela lei moçambicana. Para dirimir quaisquer litígios dele emergentes, as partes elegem o foro do ${semPonto(v.foro) || 'tribunal competente'}, com expressa renúncia a qualquer outro.`,
        en: 'Mozambican law applies; disputes go to the court named.',
      },
    );

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de Suprimento', subtitle: sociedadeNome(v) },
      { type: 'paragraph', id: 'parteSocio', text: `Entre:\n${parte(v, 'socio', f ? 'Sócia' : 'Sócio')}, na qualidade de ${f ? 'sócia' : 'sócio'} da sociedade abaixo identificada;`, en: 'Between the member, identified above;' },
      {
        type: 'paragraph',
        id: 'parteSociedade',
        text: `e\n${sociedadeIdent(v)}, ${representadaPor(reps)}, adiante designada por **Sociedade**;`,
        en: 'and the company, identified above;',
      },
      {
        type: 'paragraph',
        id: 'celebracao',
        text: `${v.dataDeliberacao ? `Nos termos da deliberação dos sócios de ${dateLong(v.dataDeliberacao)}, é` : 'É'} celebrado o presente contrato de suprimento, que se rege pelas cláusulas seguintes:`,
        en: 'This shareholder loan agreement is entered into on the following terms:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      {
        type: 'paragraph',
        id: 'feito',
        text: `Feito em ${ctx.place}, a ${dateLong(v.data)}, em dois exemplares de igual teor e valor, ficando um em poder de cada uma das partes.`,
        en: 'Made in two copies of equal value, one for each party.',
        keepWithNext: true,
      },
      ...signatureRows([parteSignature(v, 'socio', OS), ...companyColumns(ctx, reps)]),
    ];
    return blocks;
  },
});
