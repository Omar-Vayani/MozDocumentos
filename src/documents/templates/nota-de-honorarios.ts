import { formatDateShort, formatNumber, formatPercent, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, formatMoney, l, lawyerFields, lawyerSignature, lineItems, localField, money, refField } from './_shared';

const trim = (s: unknown) => String(s ?? '').trim();

type Linha = { data: string; descricao: string; horas: number | null; valor: number | null; documento?: string };

function servicos(v: unknown): Linha[] {
  return lineItems(v)
    .map((r) => ({ data: trim(r.data), descricao: trim(r.descricao), horas: Number(r.horas) > 0 ? Number(r.horas) : null, valor: money(r.valor) }))
    .filter((r) => r.descricao || r.valor != null);
}

function despesas(v: unknown): Linha[] {
  return lineItems(v)
    .map((r) => ({ data: trim(r.data), descricao: trim(r.descricao), documento: trim(r.documento), horas: null, valor: money(r.valor) }))
    .filter((r) => r.descricao || r.valor != null);
}

const sum = (xs: Linha[]) => roundMoney(xs.reduce((s, x) => s + (x.valor ?? 0), 0));

export default defineTemplate({
  id: 'nota-de-honorarios',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Número, local e data', 'Number, place and date') },
    { id: 'cliente', title: l('Cliente', 'Client'), personRole: 'cliente' },
    { id: 'servicos', title: l('Serviços prestados', 'Services rendered') },
    { id: 'despesas', title: l('Despesas', 'Expenses') },
    { id: 'totais', title: l('Impostos, provisões e pagamento', 'Taxes, advances and payment') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
  ],
  fields: [
    { ...refField(), label: l('Nota n.º', 'Fee note no.') },
    localField(),
    dateField('data'),
    { name: 'clienteNome', type: 'text', section: 'cliente', required: true, label: l('Nome ou firma', 'Name or company name'), personKey: 'nome' },
    { name: 'clienteNuit', type: 'text', section: 'cliente', width: 'half', label: l('NUIT (opcional)', 'Tax number (optional)'), personKey: 'nuit' },
    { name: 'clienteMorada', type: 'text', section: 'cliente', width: 'half', label: l('Morada', 'Address'), personKey: 'morada' },
    {
      name: 'assunto',
      type: 'text',
      section: 'servicos',
      required: true,
      label: l('Assunto / processo', 'Matter / case'),
      placeholder: l('Ex.: Acção de cobrança contra Sol Nascente Imobiliária, Lda — Proc. n.º 245/2026', 'E.g. Debt claim — case no. 245/2026'),
    },
    { name: 'periodo', type: 'text', section: 'servicos', width: 'half', label: l('Período (opcional)', 'Period (optional)'), placeholder: l('Ex.: Julho a Setembro de 2026', 'E.g. July to September 2026') },
    {
      name: 'servicos',
      type: 'lines',
      section: 'servicos',
      label: l('Serviços', 'Services'),
      addLabel: l('Adicionar serviço', 'Add service'),
      columns: [
        { name: 'data', type: 'date', label: l('Data', 'Date') },
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'horas', type: 'number', label: l('Horas (opcional)', 'Hours (optional)') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
      default: [],
    },
    {
      name: 'despesas',
      type: 'lines',
      section: 'despesas',
      label: l('Despesas e encargos', 'Expenses and disbursements'),
      help: l('Custas, preparos, certidões, registos, deslocações. Indique o documento comprovativo.', 'Court fees, certificates, registrations, travel. Give the supporting document.'),
      addLabel: l('Adicionar despesa', 'Add expense'),
      columns: [
        { name: 'data', type: 'date', label: l('Data', 'Date') },
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'documento', type: 'text', label: l('Comprovativo', 'Receipt') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
      default: [],
    },
    { name: 'iva', type: 'toggle', section: 'totais', default: true, label: l('Acrescer IVA aos honorários', 'Add VAT to fees') },
    { name: 'retencao', type: 'toggle', section: 'totais', label: l('Indicar retenção na fonte (IRPS) pelo cliente', 'Show withholding tax deducted by the client') },
    { name: 'retencaoTaxa', type: 'number', section: 'totais', width: 'half', min: 0, max: 50, label: l('Taxa de retenção (%)', 'Withholding rate (%)'), help: l('Confirme a taxa aplicável com a Autoridade Tributária.', 'Confirm the applicable rate with the Tax Authority.'), showIf: (v) => Boolean(v.retencao) },
    { name: 'provisoes', type: 'money', section: 'totais', width: 'half', label: l('Provisões já recebidas', 'Advances already received') },
    { name: 'prazoDias', type: 'number', section: 'totais', width: 'half', min: 0, max: 90, default: 15, label: l('Prazo de pagamento (dias)', 'Payment term (days)') },
    { name: 'banco', type: 'text', section: 'totais', width: 'half', label: l('Banco', 'Bank'), default: (c) => c.profile?.banco ?? '' },
    { name: 'nib', type: 'text', section: 'totais', width: 'half', label: l('NIB', 'Account (NIB)'), default: (c) => c.profile?.nib ?? '' },
    ...lawyerFields('advogado'),
  ],

  computed: (v, ctx) => {
    const s = servicos(v.servicos);
    const d = despesas(v.despesas);
    const honorarios = sum(s);
    const taxaIva = ctx.legal.value<number>('ivaTaxaNormal');
    const iva = v.iva ? roundMoney(honorarios * taxaIva) : 0;
    const retTaxa = v.retencao && Number(v.retencaoTaxa) > 0 ? Number(v.retencaoTaxa) / 100 : 0;
    const retencao = roundMoney(honorarios * retTaxa);
    const totalDespesas = sum(d);
    const total = roundMoney(honorarios + iva + totalDespesas);
    const provisoes = money(v.provisoes) ?? 0;
    const saldo = roundMoney(total - retencao - provisoes);
    const horas = s.reduce((h, x) => h + (x.horas ?? 0), 0);
    return { s, d, honorarios, taxaIva, iva, retTaxa, retencao, totalDespesas, total, provisoes, saldo, horas };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [];
    if (c.s.length === 0) w.push({ level: 'warning', field: 'servicos', message: l('Indique pelo menos um serviço prestado.', 'Enter at least one service.') });
    if (v.iva) {
      w.push({
        level: 'info',
        field: 'iva',
        message: l(
          'A nota de honorários não substitui a factura: emita a factura em impresso ou programa de facturação autorizado.',
          'A fee note does not replace the invoice: issue the invoice on authorised forms or software.',
        ),
      });
    }
    const anos = ctx.legal.value<number>('advPrescricaoHonorarios');
    w.push({
      level: 'info',
      message: l(
        `Os créditos de honorários presumem-se pagos ao fim de ${anos} anos (${cite('advPrescricaoHonorarios')}). Não deixe a cobrança para tarde.`,
        `Fee claims are presumed paid after ${anos} years. Do not delay collection.`,
      ),
    });
    if (c.saldo < 0) w.push({ level: 'warning', field: 'provisoes', message: l('As provisões excedem o total: o saldo é a favor do cliente e deve ser devolvido.', 'Advances exceed the total: the balance is due to the client.') });
    return w;
  },

  personName: (v) => v.clienteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const dias = Number(v.prazoDias) > 0 ? Number(v.prazoDias) : null;
    const comHoras = c.s.some((x: Linha) => x.horas != null);
    const blocks: Block[] = [
      { type: 'title', text: 'Nota de honorários e despesas', subtitle: `N.º ${trim(v.ref) || '____'} — ${dateLong(v.data)}` },
      {
        type: 'keyValue',
        columns: 1,
        items: [
          { label: 'Cliente', value: [trim(v.clienteNome) || BLANK, trim(v.clienteNuit) ? `NUIT ${trim(v.clienteNuit)}` : '', trim(v.clienteMorada)].filter(Boolean).join(' — ') },
          { label: 'Assunto', value: trim(v.assunto) || BLANK },
          ...(trim(v.periodo) ? [{ label: 'Período', value: trim(v.periodo) }] : []),
        ],
      },
      {
        type: 'table',
        columns: [
          { label: 'Data', width: 14 },
          { label: 'Honorários — serviços', width: comHoras ? 56 : 66 },
          ...(comHoras ? [{ label: 'Horas', width: 10, align: 'right' as const }] : []),
          { label: 'Valor', width: 20, align: 'right' },
        ],
        rows: (c.s.length ? c.s : [{ data: '', descricao: BLANK, horas: null, valor: null }]).map((x: Linha) => [
          x.data ? formatDateShort(x.data) : '',
          x.descricao || '',
          ...(comHoras ? [x.horas != null ? formatNumber(x.horas, 1) : ''] : []),
          x.valor != null ? formatMoney(x.valor) : '',
        ]),
        totals: [['', 'Total de honorários', ...(comHoras ? [c.horas ? formatNumber(c.horas, 1) : ''] : []), formatMoney(c.honorarios)]],
      },
    ];
    if (c.d.length) {
      blocks.push(
        {
          type: 'table',
          columns: [
            { label: 'Data', width: 14 },
            { label: 'Despesas e encargos', width: 46 },
            { label: 'Comprovativo', width: 20 },
            { label: 'Valor', width: 20, align: 'right' },
          ],
          rows: c.d.map((x: Linha) => [x.data ? formatDateShort(x.data) : '', x.descricao || '', x.documento || '', x.valor != null ? formatMoney(x.valor) : '']),
          totals: [['', 'Total de despesas', '', formatMoney(c.totalDespesas)]],
        },
      );
    }
    // Honorários and despesas totals are already in the tables above.
    const resumo: string[][] = [];
    if (v.iva) resumo.push([`IVA sobre honorários (${formatPercent(c.taxaIva)})`, formatMoney(c.iva)]);
    resumo.push([c.d.length ? 'Total (honorários, IVA e despesas)' : 'Total', formatMoney(c.total)]);
    if (c.retencao) resumo.push([`Retenção na fonte — IRPS (${formatPercent(c.retTaxa)})`, `− ${formatMoney(c.retencao)}`]);
    if (c.provisoes) resumo.push(['Provisões recebidas', `− ${formatMoney(c.provisoes)}`]);
    blocks.push(
      {
        type: 'table',
        columns: [{ label: 'Resumo', width: 70 }, { label: 'Valor', width: 30, align: 'right' }],
        rows: resumo,
        totals: [['Saldo a pagar', formatMoney(c.saldo)]],
        note: 'Este documento não substitui a factura, que é emitida nos termos do Código do IVA.',
      },
      {
        type: 'paragraph',
        id: 'pagamento',
        text: `Nos termos acordados, agradecemos o pagamento do saldo de ${formatMoney(c.saldo)} no prazo de ${dias ? `${dias} ${dias === 1 ? 'dia' : 'dias'}` : '____ dias'} a contar da recepção desta nota${trim(v.nib) ? `, por transferência para a conta ${trim(v.banco) ? `no ${trim(v.banco)}, ` : ''}NIB ${trim(v.nib)}` : ''}.`,
        en: 'Please pay the balance within the period stated, by bank transfer to the account given.',
        keepWithNext: true,
      },
      { type: 'signatures', columns: [lawyerSignature(v)] },
    );
    return blocks;
  },
});
