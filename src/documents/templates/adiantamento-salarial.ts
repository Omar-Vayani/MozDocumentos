import { addMonths, formatMonthYear, MAX_EXTENSO, numeroPorExtenso, parseISODate, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type SignatureColumn, type TemplateContext, type Warning } from '../model';
import {
  blank, dateField, employerSignature, formatMoney, g, isF, l, localField, money, placeDate, refField,
  splitLines, workerFields, workerSignature,
} from './_shared';

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthEn = (ym: unknown) => {
  const d = parseISODate(typeof ym === 'string' ? ym : '');
  return d ? `${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}` : '____________';
};
const extenso = (n: number | null | undefined) => (n != null && n > 0 && n <= MAX_EXTENSO ? ` (${numeroPorExtenso(n)})` : '');
/** Joins textarea lines into one clause without a trailing full stop. */
const inline = (t: unknown) => splitLines(t).map((s) => s.replace(/[.;]+$/, '')).join('; ');

/** Employer signature; an individual employer signs in their own name. */
function signer(ctx: TemplateContext): SignatureColumn {
  const s = employerSignature(ctx);
  return ctx.profile?.kind === 'pessoa' && !s.name ? { ...s, name: ctx.profile.nome || undefined } : s;
}

export default defineTemplate({
  id: 'adiantamento-salarial',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'pedido', title: l('Pedido do trabalhador', "Employee's request") },
    { id: 'autorizacao', title: l('Autorização da empresa', "Company's decision") },
  ],
  fields: [
    refField(),
    localField(),
    ...workerFields(['nome', 'genero', 'cargo', 'departamento', 'salario']),
    {
      name: 'valorPedido',
      type: 'money',
      section: 'pedido',
      width: 'half',
      required: true,
      label: l('Valor pedido', 'Amount requested'),
    },
    dateField('dataPedido', 'pedido', l('Data do pedido', 'Date of request')),
    {
      name: 'motivo',
      type: 'textarea',
      section: 'pedido',
      rows: 3,
      label: l('Motivo (opcional)', 'Reason (optional)'),
      placeholder: l('Ex.: despesas médicas de um familiar', 'E.g. medical expenses of a family member'),
    },
    {
      name: 'autorizado',
      type: 'toggle',
      section: 'autorizacao',
      default: true,
      label: l('Adiantamento autorizado', 'Advance approved'),
      help: l('Desligue para registar que o pedido não foi autorizado.', 'Turn off to record that the request was refused.'),
    },
    {
      name: 'valorAutorizado',
      type: 'money',
      section: 'autorizacao',
      width: 'half',
      computedKey: 'valorAutorizado',
      label: l('Valor autorizado', 'Amount approved'),
      help: l('Por defeito, o valor pedido. Escreva outro valor para autorizar só uma parte.', 'Defaults to the amount requested. Type another amount to approve only part of it.'),
      showIf: (v) => Boolean(v.autorizado),
    },
    {
      name: 'formaDesconto',
      type: 'radio',
      section: 'autorizacao',
      label: l('Forma de desconto', 'How it is deducted'),
      options: [
        { value: 'unica', label: l('De uma só vez', 'In one deduction') },
        { value: 'prestacoes', label: l('Em prestações mensais', 'In monthly instalments') },
      ],
      default: 'unica',
      showIf: (v) => Boolean(v.autorizado),
    },
    {
      name: 'mesDesconto',
      type: 'month',
      section: 'autorizacao',
      width: 'half',
      required: true,
      label: l('Descontar a partir do salário de', 'Deduct from the salary of'),
      default: (c) => c.today.slice(0, 7),
      showIf: (v) => Boolean(v.autorizado),
    },
    {
      name: 'numeroPrestacoes',
      type: 'number',
      section: 'autorizacao',
      width: 'half',
      min: 2,
      max: 24,
      default: 2,
      label: l('Número de prestações', 'Number of instalments'),
      showIf: (v) => Boolean(v.autorizado) && v.formaDesconto === 'prestacoes',
    },
    {
      name: 'motivoRecusa',
      type: 'text',
      section: 'autorizacao',
      label: l('Motivo da recusa (opcional)', 'Reason for refusal (optional)'),
      showIf: (v) => !v.autorizado,
    },
    dateField('data', 'autorizacao', l('Data da decisão', 'Date of decision')),
  ],

  computed: (v) => {
    const valorPedido = money(v.valorPedido);
    const valorAut = money(v.valorAutorizado) ?? valorPedido;
    const prest = v.formaDesconto === 'prestacoes';
    const n = prest ? Math.min(60, Math.max(1, Math.floor(Number(v.numeroPrestacoes) || 1))) : 1;
    const mes = typeof v.mesDesconto === 'string' && v.mesDesconto ? `${v.mesDesconto.slice(0, 7)}-01` : '';
    const parcelas: { mes: string; valor: number | null }[] = [];
    if (valorAut != null && valorAut > 0) {
      const each = Math.floor((valorAut / n) * 100) / 100;
      for (let i = 0; i < n; i++) {
        parcelas.push({
          mes: mes ? addMonths(mes, i) : '',
          valor: i === n - 1 ? roundMoney(valorAut - each * (n - 1)) : each,
        });
      }
    }
    return {
      valorPedido,
      valorAutorizado: valorPedido,
      valorAut,
      n,
      prest,
      parcelas,
      prestacaoMax: parcelas.reduce((m, p) => Math.max(m, p.valor ?? 0), 0),
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    const salario = money(v.trabalhadorSalario);
    if (c.valorPedido == null) {
      w.push({ level: 'warning', field: 'valorPedido', message: l('Indique o valor pedido.', 'Enter the amount requested.') });
    }
    if (salario != null && c.valorPedido != null && c.valorPedido > salario) {
      w.push({
        level: 'warning',
        field: 'valorPedido',
        message: l('O valor pedido é superior ao salário base mensal.', 'The amount requested exceeds the monthly base salary.'),
      });
    }
    if (v.autorizado && c.valorAut != null && c.valorPedido != null && c.valorAut > c.valorPedido) {
      w.push({
        level: 'warning',
        field: 'valorAutorizado',
        message: l('O valor autorizado é superior ao valor pedido.', 'The amount approved exceeds the amount requested.'),
      });
    }
    if (v.autorizado && salario != null && c.prestacaoMax > salario) {
      w.push({
        level: 'error',
        field: c.prest ? 'numeroPrestacoes' : 'formaDesconto',
        message: l(
          'O desconto mensal é superior ao salário base. Aumente o número de prestações.',
          'The monthly deduction exceeds the base salary. Increase the number of instalments.',
        ),
      });
    }
    if (v.autorizado && v.mesDesconto && v.data && String(v.mesDesconto) < String(v.data).slice(0, 7)) {
      w.push({
        level: 'warning',
        field: 'mesDesconto',
        message: l('O mês do primeiro desconto é anterior à data da decisão.', 'The first deduction month is before the decision date.'),
      });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const { values: v, computed: c } = ctx;
    const ge = v.trabalhadorGenero;
    const f = isF(ge);
    const motivo = inline(v.motivo);
    const salario = money(v.trabalhadorSalario);

    const blocks: Block[] = [
      { type: 'title', text: 'Adiantamento salarial', subtitle: 'Pedido e autorização' },
    ];
    if (v.ref) blocks.push({ type: 'reference', ref: v.ref });
    blocks.push(
      {
        type: 'keyValue',
        title: f ? 'Dados da trabalhadora' : 'Dados do trabalhador',
        columns: 2,
        items: [
          { label: 'Nome', value: v.trabalhadorNome || '' },
          { label: 'Cargo', value: v.trabalhadorCargo || '' },
          { label: 'Departamento', value: v.trabalhadorDepartamento || '' },
          { label: 'Salário base', value: salario != null ? formatMoney(salario) : '' },
        ],
      },
      { type: 'heading', text: `I. Pedido ${g(ge, 'do trabalhador', 'da trabalhadora')}` },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Eu, **${blank(v.trabalhadorNome)}**, venho requerer a concessão de um adiantamento sobre a minha remuneração no valor de **${formatMoney(c.valorPedido)}**${extenso(c.valorPedido)}${motivo ? `, pelo seguinte motivo: ${motivo}` : ''}.`,
        en: `I, ${blank(v.trabalhadorNome)}, request an advance on my pay of ${formatMoney(c.valorPedido)}${motivo ? `, for the following reason: ${motivo}` : ''}.`,
      },
      {
        type: 'paragraph',
        id: 'consentimento',
        text: 'Autorizo a entidade empregadora a descontar o valor adiantado na minha remuneração, nos termos fixados na autorização abaixo, e, em caso de cessação do contrato de trabalho antes do reembolso integral, a descontar o saldo em dívida nas quantias que me forem devidas.',
        en: 'I authorise the employer to deduct the advance from my pay as set out in the approval below and, if the employment contract ends before full repayment, to deduct the outstanding balance from any amounts owed to me.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.dataPedido), columns: [workerSignature(v)] },
      { type: 'heading', text: 'II. Decisão da entidade empregadora', keepWithNext: true },
    );

    if (v.autorizado) {
      const mes = c.parcelas[0]?.mes || v.mesDesconto;
      blocks.push(
        {
          type: 'paragraph',
          id: 'autorizacao',
          text: `Autoriza-se o adiantamento salarial a ${g(ge, 'favor do trabalhador acima identificado', 'favor da trabalhadora acima identificada')}, no valor de **${formatMoney(c.valorAut)}**${extenso(c.valorAut)}.`,
          en: `A salary advance of ${formatMoney(c.valorAut)} is approved for the employee identified above.`,
          keepWithNext: true,
        },
      );
      if (c.prest) {
        blocks.push(
          {
            type: 'paragraph',
            id: 'desconto',
            text: `O valor será descontado em **${c.n} prestações mensais** e sucessivas, a partir da remuneração do mês de **${formatMonthYear(mes)}**, conforme o quadro seguinte:`,
            en: `The amount will be deducted in ${c.n} consecutive monthly instalments, starting with the pay for ${monthEn(mes)}, as shown below:`,
          },
          {
            type: 'table',
            columns: [
              { label: 'Prestação', width: 1, align: 'center' },
              { label: 'Salário do mês de', width: 2.4 },
              { label: 'Valor a descontar (MT)', width: 1.8, align: 'right' },
            ],
            rows: c.parcelas.map((p: { mes: string; valor: number | null }, i: number) => [
              `${i + 1}.ª`,
              formatMonthYear(p.mes),
              formatMoney(p.valor, false),
            ]),
            totals: [['Total', '', formatMoney(c.valorAut, false)]],
          },
        );
      } else {
        blocks.push({
          type: 'paragraph',
          id: 'desconto',
          text: `O valor será descontado, de uma só vez, na remuneração do mês de **${formatMonthYear(mes)}**.`,
          en: `The amount will be deducted in full from the pay for ${monthEn(mes)}.`,
          keepWithNext: true,
        });
      }
    } else {
      const recusa = inline(v.motivoRecusa);
      blocks.push({
        type: 'paragraph',
        id: 'recusa',
        text: `Não é autorizado o adiantamento requerido${recusa ? `, pelo seguinte motivo: ${recusa}` : ''}.`,
        en: `The advance requested is not approved${recusa ? `, for the following reason: ${recusa}` : ''}.`,
        keepWithNext: true,
      });
    }

    blocks.push(
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [signer(ctx)] },
      {
        type: 'acknowledgement',
        text: v.autorizado
          ? `Tomei conhecimento da decisão e recebi o valor de ${formatMoney(c.valorAut)} em ___/___/______.`
          : `Tomei conhecimento da decisão em ___/___/______.`,
        signer: g(ge, 'O Trabalhador', 'A Trabalhadora'),
      },
    );
    return blocks;
  },
});

