// Folha de remunerações: monthly payroll register for all employees, with
// INSS (worker and employer), IRPS withholding and totals to pay.

import { irpsWithholding, type IrpsBand } from '@/legal/mz-legal';
import { formatMonthYear, formatNumber, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateLong, employerName, formatMoney, l, lineItems, localField, money, refField } from './_shared';

const str = (x: unknown) => String(x ?? '').trim();
const fm = (n: number) => formatMoney(n, false);
/** "3%", "7%", "3,5%" — rounds away floating-point noise (0.03 + 0.04). */
const formatPercent = (rate: number) => {
  const v = Math.round(rate * 10000) / 100;
  return `${formatNumber(v, Number.isInteger(v) ? 0 : 2)}%`;
};

type Linha = {
  nome: string;
  cargo: string;
  nuit: string;
  inss: string;
  dependentes: number;
  base: number;
  subsidios: number;
  extra: number;
  bruto: number;
  inssT: number;
  irps: number;
  irpsManual: boolean;
  outros: number;
  descontos: number;
  liquido: number;
};

const sumOf = (rows: Linha[], k: keyof Linha) => roundMoney(rows.reduce((t, r) => t + (r[k] as number), 0));

export default defineTemplate({
  id: 'folha-de-salarios',
  family: 'mapa',
  // Landscape: one row per employee with every amount, as payroll registers are kept.
  page: 'A4-paisagem',
  sections: [
    { id: 'documento', title: l('Período e pagamento', 'Period and payment') },
    { id: 'trabalhadores', title: l('Trabalhadores', 'Employees') },
    { id: 'opcoes', title: l('Opções', 'Options') },
    { id: 'assinaturas', title: l('Assinaturas', 'Signatures') },
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
    refField(),
    localField(),
    {
      name: 'trabalhadores',
      type: 'lines',
      section: 'trabalhadores',
      required: true,
      label: l('Trabalhadores', 'Employees'),
      help: l(
        'Uma linha por trabalhador. O INSS e o IRPS são calculados automaticamente; preencha o IRPS só para substituir o valor calculado.',
        'One row per employee. INSS and IRPS are computed automatically; fill in IRPS only to override the computed amount.',
      ),
      addLabel: l('Adicionar trabalhador', 'Add employee'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'cargo', type: 'text', label: l('Cargo', 'Position') },
        { name: 'nuit', type: 'text', label: l('NUIT', 'NUIT') },
        { name: 'inss', type: 'text', label: l('N.º INSS', 'INSS no.') },
        { name: 'salarioBase', type: 'money', label: l('Salário base', 'Base salary') },
        { name: 'subsidios', type: 'money', label: l('Subsídios', 'Allowances') },
        { name: 'horasExtra', type: 'money', label: l('Horas extra', 'Overtime') },
        { name: 'dependentes', type: 'number', min: 0, max: 20, label: l('Dependentes (IRPS)', 'Dependants (IRPS)') },
        { name: 'outrosDescontos', type: 'money', label: l('Outros descontos', 'Other deductions') },
        { name: 'irps', type: 'money', label: l('IRPS (substituir)', 'IRPS (override)') },
      ],
      default: [],
    },
    {
      name: 'colunaDependentes',
      type: 'toggle',
      section: 'opcoes',
      default: false,
      label: l('Mostrar a coluna de dependentes', 'Show the dependants column'),
    },
    {
      name: 'elaboradoPor',
      type: 'text',
      section: 'assinaturas',
      width: 'half',
      label: l('Elaborado por', 'Prepared by'),
    },
    {
      name: 'elaboradoCargo',
      type: 'text',
      section: 'assinaturas',
      width: 'half',
      label: l('Cargo de quem elabora', 'Preparer’s position'),
      placeholder: l('Ex.: Técnico de Recursos Humanos', 'E.g. HR Officer'),
    },
    {
      name: 'aprovadoPor',
      type: 'text',
      section: 'assinaturas',
      width: 'half',
      label: l('Aprovado por', 'Approved by'),
      default: (c) => c.profile?.representanteNome || (c.profile?.kind === 'pessoa' ? c.profile.nome : '') || '',
    },
    {
      name: 'aprovadoCargo',
      type: 'text',
      section: 'assinaturas',
      width: 'half',
      label: l('Cargo de quem aprova', 'Approver’s position'),
      default: (c) => c.profile?.representanteCargo || '',
    },
  ],

  computed: (v, { legal }) => {
    const taxaT = legal.value<number>('inssTaxaTrabalhador');
    const taxaE = legal.value<number>('inssTaxaEmpregador');
    const table = legal.table('irpsRetencao') as IrpsBand[];
    const linhas: Linha[] = lineItems(v.trabalhadores)
      .filter((r) => str(r.nome) || money(r.salarioBase) != null)
      .map((r) => {
        const base = money(r.salarioBase) ?? 0;
        const subsidios = money(r.subsidios) ?? 0;
        const extra = money(r.horasExtra) ?? 0;
        const bruto = roundMoney(base + subsidios + extra);
        const dependentes = Math.max(0, Math.floor(Number(r.dependentes) || 0));
        const inssT = roundMoney(bruto * taxaT);
        const irpsOverride = money(r.irps);
        const irps = irpsOverride ?? irpsWithholding(table, bruto, dependentes) ?? 0;
        const outros = money(r.outrosDescontos) ?? 0;
        const descontos = roundMoney(inssT + irps + outros);
        return {
          nome: str(r.nome),
          cargo: str(r.cargo),
          nuit: str(r.nuit),
          inss: str(r.inss),
          dependentes,
          base,
          subsidios,
          extra,
          bruto,
          inssT,
          irps,
          irpsManual: irpsOverride != null,
          outros,
          descontos,
          liquido: roundMoney(bruto - descontos),
        };
      });
    const totalBruto = sumOf(linhas, 'bruto');
    const inssTrabalhadores = sumOf(linhas, 'inssT');
    const inssEmpregador = roundMoney(linhas.reduce((t, r) => t + roundMoney(r.bruto * taxaE), 0));
    return {
      taxaT,
      taxaE,
      linhas,
      irpsTableActive: table.length > 0,
      totalBase: sumOf(linhas, 'base'),
      totalSubsidios: sumOf(linhas, 'subsidios'),
      totalExtra: sumOf(linhas, 'extra'),
      totalBruto,
      inssTrabalhadores,
      inssEmpregador,
      inssTotal: roundMoney(inssTrabalhadores + inssEmpregador),
      totalIrps: sumOf(linhas, 'irps'),
      totalOutros: sumOf(linhas, 'outros'),
      totalDescontos: sumOf(linhas, 'descontos'),
      totalLiquido: sumOf(linhas, 'liquido'),
      encargoTotal: roundMoney(totalBruto + inssEmpregador),
    };
  },

  warnings: (v, { computed: c, profile }) => {
    const w: Warning[] = [];
    const linhas = c.linhas as Linha[];
    if (!linhas.length) {
      w.push({ level: 'warning', field: 'trabalhadores', message: l('Adicione pelo menos um trabalhador.', 'Add at least one employee.') });
    }
    if (linhas.some((r) => !r.nome)) {
      w.push({ level: 'warning', field: 'trabalhadores', message: l('Há linhas sem o nome do trabalhador.', 'Some rows have no employee name.') });
    }
    const negativos = linhas.filter((r) => r.liquido < 0).map((r) => r.nome || '—');
    if (negativos.length) {
      w.push({
        level: 'error',
        field: 'trabalhadores',
        message: l(`Os descontos excedem as remunerações: ${negativos.join(', ')}.`, `Deductions exceed earnings: ${negativos.join(', ')}.`),
      });
    }
    if (!c.irpsTableActive && linhas.some((r) => !r.irpsManual && r.bruto > 0)) {
      w.push({
        level: 'info',
        field: 'trabalhadores',
        message: l(
          'A tabela de IRPS não está activa: o IRPS aparece a zero. Indique o IRPS de cada trabalhador ou active a tabela em Definições.',
          'The IRPS table is not enabled, so IRPS shows as zero. Enter each employee’s IRPS or enable the table in Settings.',
        ),
      });
    }
    const semIds = linhas.filter((r) => r.nome && (!r.nuit || !r.inss)).map((r) => r.nome);
    if (semIds.length) {
      w.push({
        level: 'info',
        field: 'trabalhadores',
        message: l(
          `Falta o NUIT ou o número de INSS de: ${semIds.slice(0, 5).join(', ')}${semIds.length > 5 ? '…' : ''}.`,
          `Missing NUIT or INSS number for: ${semIds.slice(0, 5).join(', ')}${semIds.length > 5 ? '…' : ''}.`,
        ),
      });
    }
    if (profile?.kind === 'empresa' && !profile.inss) {
      w.push({
        level: 'info',
        message: l('O perfil da empresa não indica o número de contribuinte do INSS. Complete-o em Perfis.', 'The company profile has no INSS employer number. Complete it in Profiles.'),
      });
    }
    if (!str(v.elaboradoPor)) {
      w.push({ level: 'info', field: 'elaboradoPor', message: l('Indique quem elaborou a folha.', 'Enter who prepared the sheet.') });
    }
    return w;
  },

  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const { values: v, computed: c } = ctx;
    const linhas = c.linhas as Linha[];
    const p = ctx.profile;
    const dep = Boolean(v.colunaDependentes);
    const nome = (r: Linha) => r.nome || BLANK;
    const rows = linhas.map((r, i) => [
      String(i + 1),
      nome(r),
      r.nuit || '—',
      r.inss || '—',
      ...(dep ? [String(r.dependentes)] : []),
      fm(r.base),
      fm(r.subsidios),
      fm(r.extra),
      fm(r.bruto),
      fm(r.inssT),
      fm(r.irps),
      fm(r.outros),
      fm(r.liquido),
    ]);
    const empty = (n: number) => [Array.from({ length: n }, (_, i) => (i === 1 ? BLANK : ''))];

    const blocks: Block[] = [
      { type: 'title', text: 'Folha de remunerações', subtitle: `Referente a ${formatMonthYear(v.periodo)}` },
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Entidade empregadora', value: employerName(ctx) },
          { label: 'NUIT', value: p?.nuit || BLANK },
          { label: 'N.º de contribuinte do INSS', value: p?.inss || BLANK },
          { label: 'Número de trabalhadores', value: String(linhas.length) },
        ],
      },
      {
        type: 'table',
        caption: 'Remunerações, descontos e valor líquido (MT)',
        columns: [
          { label: 'N.º', width: 0.35, align: 'center' },
          { label: 'Nome', width: 2.5 },
          { label: 'NUIT', width: 0.95 },
          { label: 'N.º INSS', width: 0.95 },
          ...(dep ? [{ label: 'Dep.', width: 0.45, align: 'center' as const }] : []),
          { label: 'Salário base', width: 1.1, align: 'right' },
          { label: 'Subsídios', width: 1.0, align: 'right' },
          { label: 'H. extra', width: 1.0, align: 'right' },
          { label: 'Ilíquido', width: 1.1, align: 'right' },
          { label: `INSS (${formatPercent(c.taxaT)})`, width: 1.0, align: 'right' },
          { label: 'IRPS', width: 0.95, align: 'right' },
          { label: 'Outros', width: 0.95, align: 'right' },
          { label: 'Líquido', width: 1.1, align: 'right' },
        ],
        rows: rows.length ? rows : empty(dep ? 13 : 12),
        totals: [
          [
            '',
            'Totais',
            '',
            '',
            ...(dep ? [''] : []),
            fm(c.totalBase),
            fm(c.totalSubsidios),
            fm(c.totalExtra),
            fm(c.totalBruto),
            fm(c.inssTrabalhadores),
            fm(c.totalIrps),
            fm(c.totalOutros),
            fm(c.totalLiquido),
          ],
        ],
        note: c.irpsTableActive
          ? 'IRPS calculado pela tabela de retenção na fonte em vigor, salvo nos casos em que o valor foi indicado manualmente.'
          : 'IRPS indicado manualmente (a tabela de retenção na fonte não está configurada).',
      },
      {
        type: 'keyValue',
        title: 'Resumo do mês',
        columns: 2,
        items: [
          { label: 'Total ilíquido', value: formatMoney(c.totalBruto) },
          { label: `INSS — trabalhadores (${formatPercent(c.taxaT)})`, value: formatMoney(c.inssTrabalhadores) },
          { label: `INSS — entidade empregadora (${formatPercent(c.taxaE)})`, value: formatMoney(c.inssEmpregador) },
          { label: `Total a entregar ao INSS (${formatPercent(c.taxaT + c.taxaE)})`, value: formatMoney(c.inssTotal) },
          { label: 'IRPS retido a entregar', value: formatMoney(c.totalIrps) },
          { label: 'Outros descontos', value: formatMoney(c.totalOutros) },
          { label: 'Total líquido a pagar', value: formatMoney(c.totalLiquido) },
          { label: 'Encargo total do mês', value: formatMoney(c.encargoTotal) },
        ],
      },
      {
        type: 'note',
        text: `A contribuição da entidade empregadora para o INSS (${formatPercent(c.taxaE)}) não é descontada aos trabalhadores. O encargo total corresponde às remunerações ilíquidas acrescidas dessa contribuição.`,
        en: `The employer’s INSS contribution (${formatPercent(c.taxaE)}) is not deducted from employees. Total cost is gross pay plus that contribution.`,
        keepWithNext: true,
      },
      {
        type: 'signatures',
        columns: [
          { role: 'Elaborado por', name: str(v.elaboradoPor) || undefined, detail: str(v.elaboradoCargo) || undefined },
          { role: 'Aprovado por', name: str(v.aprovadoPor) || undefined, detail: str(v.aprovadoCargo) || undefined, image: 'both' },
        ],
      },
    ];
    return blocks;
  },
});

