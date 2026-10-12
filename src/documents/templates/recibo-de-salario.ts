import { irpsWithholding, MINIMUM_WAGES_2026, type IrpsBand, type MinimumWage } from '@/legal/mz-legal';
import { formatMonthYear, formatPercent, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import {
  cite, dateLong, employerSignature, FORMA_PAGAMENTO_OPTIONS, formatMoney, l, lineItems, money, refField,
  localField, workerFields, workerSignature, isF,
} from './_shared';

/** "por transferência bancária", "em numerário", "através de M-Pesa"… */
function formaPt(forma: unknown): string {
  switch (forma) {
    case 'numerário':
      return 'em numerário';
    case 'cheque':
      return 'por cheque';
    case 'M-Pesa':
    case 'e-Mola':
    case 'mKesh':
      return `através de ${forma}`;
    default:
      return 'por transferência bancária';
  }
}

const sum = (rows: Record<string, any>[]) => rows.reduce((t, r) => t + (money(r.valor) ?? 0), 0);

export default defineTemplate({
  id: 'recibo-de-salario',
  sections: [
    { id: 'documento', title: l('Período e pagamento', 'Period and payment') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'remuneracao', title: l('Remunerações', 'Earnings') },
    { id: 'descontos', title: l('Descontos', 'Deductions') },
  ],
  fields: [
    {
      name: 'periodo',
      type: 'month',
      section: 'documento',
      width: 'half',
      required: true,
      label: l('Mês a que se refere', 'Pay month'),
      default: (c) => c.today.slice(0, 7),
    },
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data de pagamento', 'Payment date'), default: (c) => c.today },
    { name: 'formaPagamento', type: 'select', section: 'documento', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    refField(),
    localField(),
    ...workerFields(['nome', 'genero', 'cargo', 'categoria', 'nuit', 'inss', 'dataAdmissao']),
    {
      name: 'dependentes',
      type: 'number',
      section: 'trabalhador',
      width: 'half',
      min: 0,
      max: 20,
      default: 0,
      label: l('Número de dependentes (IRPS)', 'Number of dependants (IRPS)'),
      help: l('Usado apenas para calcular a retenção de IRPS, se a tabela estiver activa.', 'Only used to compute IRPS withholding if the table is enabled.'),
    },
    {
      name: 'salarioBase',
      type: 'money',
      section: 'remuneracao',
      required: true,
      width: 'half',
      personKey: 'salarioBase',
      label: l('Salário base', 'Base salary'),
      legal: l(
        `No acto do pagamento, o empregador entrega um recibo com o nome de ambos, a categoria profissional, o período, a remuneração base e as prestações adicionais, os descontos e o valor líquido (${cite('reciboRemuneracao')}).`,
        'On payment the employer must hand over a payslip with both names, the job grade, the period, base pay and additional payments, deductions and net pay.',
      ),
    },
    {
      name: 'sector',
      type: 'select',
      section: 'remuneracao',
      width: 'half',
      label: l('Sector (salário mínimo)', 'Sector (minimum wage)'),
      help: l('Para verificar se o salário base respeita o salário mínimo do sector.', 'Checks the base salary against the sector minimum wage.'),
      options: [{ value: '', label: l('Não verificar', 'Do not check') }, ...MINIMUM_WAGES_2026.map((w) => ({ value: w.sector, label: l(w.sector, w.sector) }))],
      default: '',
    },
    {
      name: 'subsidios',
      type: 'lines',
      section: 'remuneracao',
      label: l('Subsídios e outras remunerações', 'Allowances and other earnings'),
      addLabel: l('Adicionar subsídio', 'Add allowance'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description'), placeholder: l('Ex.: Subsídio de transporte', 'E.g. Transport allowance') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
      default: [],
    },
    { name: 'horasExtra', type: 'money', section: 'remuneracao', width: 'half', label: l('Trabalho extraordinário', 'Overtime') },
    {
      name: 'inssTrabalhador',
      type: 'money',
      section: 'descontos',
      width: 'half',
      computedKey: 'inssTrabalhador',
      label: l('INSS do trabalhador', 'Employee INSS'),
      help: l('Calculado automaticamente. Escreva um valor para substituir.', 'Computed automatically. Type a value to override.'),
    },
    {
      name: 'irps',
      type: 'money',
      section: 'descontos',
      width: 'half',
      computedKey: 'irps',
      label: l('IRPS retido', 'IRPS withheld'),
      help: l('Calculado pela tabela de retenção em Definições, se estiver activa. Caso contrário, indique o valor.', 'Computed from the withholding table in Settings if enabled. Otherwise enter the amount.'),
    },
    {
      name: 'outrosDescontos',
      type: 'lines',
      section: 'descontos',
      label: l('Outros descontos', 'Other deductions'),
      addLabel: l('Adicionar desconto', 'Add deduction'),
      help: l(
        'Além do INSS e do IRPS, só pode descontar valores autorizados por escrito pelo trabalhador, ordenados por tribunal ou multas disciplinares.',
        'Besides INSS and IRPS, you may only deduct amounts authorised in writing by the employee, ordered by a court, or disciplinary fines.',
      ),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description'), placeholder: l('Ex.: Adiantamento', 'E.g. Advance') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
      default: [],
    },
    {
      name: 'mostrarEncargos',
      type: 'toggle',
      section: 'descontos',
      default: true,
      label: l('Mostrar INSS da entidade empregadora (para informação)', 'Show employer INSS (for information)'),
    },
  ],

  computed: (v, { legal }) => {
    const base = money(v.salarioBase) ?? 0;
    const subs = lineItems(v.subsidios).filter((r) => money(r.valor));
    const extra = money(v.horasExtra) ?? 0;
    const bruto = roundMoney(base + sum(subs) + extra);
    const taxaT = legal.value<number>('inssTaxaTrabalhador');
    const taxaE = legal.value<number>('inssTaxaEmpregador');
    const inssCalc = roundMoney(bruto * taxaT);
    const inss = money(v.inssTrabalhador) ?? inssCalc;
    const irpsCalc = irpsWithholding(legal.table('irpsRetencao') as IrpsBand[], bruto, Number(v.dependentes) || 0);
    const irps = money(v.irps) ?? irpsCalc ?? 0;
    const outros = lineItems(v.outrosDescontos).filter((r) => money(r.valor));
    // Salary advances requested by the employee do not count towards the deduction limit.
    const outrosSemAdiantamentos = sum(outros.filter((r) => !/adiantamento/i.test(String(r.descricao ?? ''))));
    const totalDescontos = roundMoney(inss + irps + sum(outros));
    return {
      bruto,
      subs,
      outros,
      taxaT,
      taxaE,
      inssTrabalhador: inssCalc,
      inssUsed: inss,
      irps: irpsCalc,
      irpsUsed: irps,
      irpsTableActive: irpsCalc != null,
      inssEmpregador: roundMoney(bruto * taxaE),
      totalDescontos,
      outrosSemAdiantamentos,
      liquido: roundMoney(bruto - totalDescontos),
    };
  },

  warnings: (v, { computed: c, legal }) => {
    const w: Warning[] = [];
    if (!c.irpsTableActive && money(v.irps) == null && c.bruto > 0) {
      w.push({
        level: 'info',
        field: 'irps',
        message: l(
          'A tabela de IRPS não está activa. Indique o IRPS retido ou active a tabela em Definições.',
          'The IRPS table is not enabled. Enter the IRPS withheld or enable the table in Settings.',
        ),
      });
    }
    if (v.sector) {
      const wage = (legal.table('salarioMinimo') as MinimumWage[]).find((m) => m.sector === v.sector);
      const base = money(v.salarioBase);
      if (wage && base != null && base < wage.value) {
        w.push({
          level: 'warning',
          field: 'salarioBase',
          message: l(
            `O salário base é inferior ao salário mínimo do sector (${formatMoney(wage.value)}).`,
            `Base salary is below the sector minimum wage (${formatMoney(wage.value)}).`,
          ),
        });
      }
    }
    if (c.liquido < 0) {
      w.push({ level: 'error', message: l('Os descontos são superiores às remunerações.', 'Deductions exceed earnings.') });
    }
    const lim = legal.value<{ fracaoMaxima: number }>('descontosRemuneracao').fracaoMaxima;
    if (c.bruto > 0 && c.outrosSemAdiantamentos > c.bruto * lim) {
      w.push({
        level: 'warning',
        field: 'outrosDescontos',
        message: l(
          `Os outros descontos excedem ${lim === 1 / 3 ? 'um terço' : formatPercent(lim)} da remuneração mensal, o limite legal (${cite('descontosRemuneracao')}). Os adiantamentos pedidos pelo trabalhador não contam para este limite.`,
          `Other deductions exceed ${lim === 1 / 3 ? 'one third' : formatPercent(lim)} of monthly pay, the legal limit. Advances requested by the employee do not count towards it.`,
        ),
      });
    }
    if (!String(v.trabalhadorCategoria ?? '').trim()) {
      w.push({
        level: 'info',
        field: 'trabalhadorCategoria',
        message: l('O recibo deve indicar a categoria profissional.', 'The payslip must state the job grade.'),
      });
    }
    if (!v.trabalhadorInss) {
      w.push({ level: 'info', field: 'trabalhadorInss', message: l('Falta o número de beneficiário do INSS.', 'The INSS number is missing.') });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const { values: v, computed: c } = ctx;
    const row = (d: string, rem: number | null, desc: number | null) => [
      d,
      rem != null ? formatMoney(rem, false) : '',
      desc != null ? formatMoney(desc, false) : '',
    ];
    const rows: string[][] = [row('Salário base', money(v.salarioBase) ?? 0, null)];
    for (const s of c.subs) rows.push(row(s.descricao || 'Subsídio', money(s.valor), null));
    if (money(v.horasExtra)) rows.push(row('Trabalho extraordinário', money(v.horasExtra), null));
    rows.push(row(`INSS — trabalhador (${formatPercent(c.taxaT)})`, null, c.inssUsed));
    rows.push(row('IRPS — retenção na fonte', null, c.irpsUsed));
    for (const o of c.outros) rows.push(row(o.descricao || 'Desconto', null, money(o.valor)));

    const f = isF(v.trabalhadorGenero);
    const blocks: Block[] = [
      { type: 'title', text: 'Recibo de vencimento', subtitle: `Referente a ${formatMonthYear(v.periodo)}` },
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'keyValue',
        title: f ? 'Dados da trabalhadora' : 'Dados do trabalhador',
        columns: 2,
        items: [
          { label: 'Nome', value: v.trabalhadorNome || '' },
          { label: 'Cargo', value: v.trabalhadorCargo || '' },
          { label: 'Categoria profissional', value: v.trabalhadorCategoria || '' },
          { label: 'Data de admissão', value: v.trabalhadorDataAdmissao ? dateLong(v.trabalhadorDataAdmissao) : '' },
          { label: 'NUIT', value: v.trabalhadorNuit || '' },
          { label: 'N.º INSS', value: v.trabalhadorInss || '' },
        ],
      },
      {
        type: 'table',
        columns: [
          { label: 'Descrição', width: 3 },
          { label: 'Remunerações (MT)', width: 1.4, align: 'right' },
          { label: 'Descontos (MT)', width: 1.4, align: 'right' },
        ],
        rows,
        totals: [
          ['Totais', formatMoney(c.bruto, false), formatMoney(c.totalDescontos, false)],
          ['Líquido a receber', '', formatMoney(c.liquido, false)],
        ],
      },
      { type: 'amount', label: 'Valor líquido a receber', value: c.liquido },
      {
        type: 'paragraph',
        id: 'pagamento',
        text: `Pago ${formaPt(v.formaPagamento)} em ${dateLong(v.data)}.`,
        en: `Paid by ${v.formaPagamento || 'bank transfer'} on ${v.data || '—'}.`,
        size: 'small',
      },
    ];
    if (v.mostrarEncargos) {
      blocks.push({
        type: 'note',
        text: `Para informação: contribuição da entidade empregadora para o INSS (${formatPercent(c.taxaE)}): ${formatMoney(c.inssEmpregador)}. Este valor não é descontado ${f ? 'à trabalhadora' : 'ao trabalhador'}.`,
        en: `For information: employer INSS contribution (${formatPercent(c.taxaE)}): ${formatMoney(c.inssEmpregador)}. Not deducted from the employee.`,
      });
    }
    blocks.push({
      type: 'signatures',
      columns: [employerSignature(ctx), { ...workerSignature(v), role: f ? 'Recebi, a Trabalhadora' : 'Recebi, o Trabalhador' }],
    });
    return blocks;
  },
});
