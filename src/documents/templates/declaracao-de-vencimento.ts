import { irpsWithholding, type IrpsBand } from '@/legal/mz-legal';
import { diffDays, parseISODate, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type SignatureColumn, type TemplateContext, type Values, type Warning } from '../model';
import {
  blank, dateField, dateLong, employerName, employerSignature, formatMoney, g, isF, l, lineItems, localField,
  money, placeDate, refField, workerFields,
} from './_shared';

// ---------------------------------------------------------------- Local helpers

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dateEn = (iso: unknown) => {
  const d = parseISODate(typeof iso === 'string' ? iso : '');
  return d ? `${d.getDate()} ${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}` : '____________';
};
const sum = (rows: Record<string, any>[]) => rows.reduce((t, r) => t + (money(r.valor) ?? 0), 0);

/** "**Nome**, portador do BI n.º X, NUIT Y" */
function workerIdent(v: Values): { pt: string; en: string } {
  const f = isF(v.trabalhadorGenero);
  const pt = [`**${blank(v.trabalhadorNome)}**`];
  const en = [blank(v.trabalhadorNome)];
  if (v.trabalhadorDocNumero) {
    pt.push(`${f ? 'portadora' : 'portador'} do ${v.trabalhadorDocTipo || 'BI'} n.º ${v.trabalhadorDocNumero}`);
    en.push(`holder of ${v.trabalhadorDocTipo || 'BI'} no. ${v.trabalhadorDocNumero}`);
  }
  if (v.trabalhadorNuit) {
    pt.push(`NUIT ${v.trabalhadorNuit}`);
    en.push(`NUIT ${v.trabalhadorNuit}`);
  }
  // Commas around the identification only when it follows the name ("que **X**, portador…, é").
  return { pt: pt.length > 1 ? `${pt.join(', ')},` : pt[0], en: en.length > 1 ? `${en.join(', ')},` : en[0] };
}

function employerRef(ctx: TemplateContext): { pt: string; en: string } {
  const name = employerName(ctx);
  if (ctx.profile?.kind === 'pessoa') return { pt: `ao serviço de **${name}**`, en: `employed by ${name}` };
  return { pt: `da **${name}**`, en: `of ${name}` };
}

function finalidade(v: Values): { pt: string; en: string } {
  const f = String(v.finalidade ?? '').trim().replace(/[.;,:]+$/, '');
  if (!f) return { pt: 'para os devidos efeitos', en: 'for all due purposes' };
  if (/^para\b/i.test(f)) return { pt: `p${f.slice(1)}`, en: `for the stated purpose (${f})` };
  if (/^(a fim|com vista|no âmbito|junto)/i.test(f)) return { pt: f, en: `for the stated purpose (${f})` };
  return { pt: `para efeitos de ${f}`, en: `for the purpose of: ${f}` };
}

/** Employer signature; an individual employer signs in their own name. */
function signer(ctx: TemplateContext): SignatureColumn {
  const s = employerSignature(ctx);
  return ctx.profile?.kind === 'pessoa' && !s.name ? { ...s, name: ctx.profile.nome || undefined } : s;
}

const CONTRATO_OPTIONS = [
  { value: 'indeterminado', label: l('Por tempo indeterminado (sem data de fim)', 'Permanent (no end date)') },
  { value: 'prazo incerto', label: l('A prazo incerto', 'Open-ended fixed term') },
  { value: 'prazo certo', label: l('A prazo certo (com data de fim)', 'Fixed term (with end date)') },
];

function contrato(v: Values): { pt: string; en: string } {
  if (v.tipoContrato === 'prazo certo') {
    return {
      pt: `a prazo certo, com termo em ${dateLong(v.dataFimContrato)}`,
      en: `a fixed-term contract ending on ${dateEn(v.dataFimContrato)}`,
    };
  }
  if (v.tipoContrato === 'prazo incerto') return { pt: 'a prazo incerto', en: 'an open-ended fixed-term contract' };
  return { pt: 'por tempo indeterminado', en: 'a permanent contract' };
}

export default defineTemplate({
  id: 'declaracao-de-vencimento',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'contrato', title: l('Contrato', 'Contract') },
    { id: 'remuneracao', title: l('Remuneração', 'Pay') },
    { id: 'opcoes', title: l('Declarações adicionais', 'Additional statements') },
  ],
  fields: [
    refField(),
    localField(),
    dateField(),
    {
      name: 'destinatario',
      type: 'text',
      section: 'documento',
      label: l('Entidade destinatária (opcional)', 'Addressee (optional)'),
      placeholder: l('Ex.: Banco Comercial e de Investimentos, S.A.', 'E.g. Banco Comercial e de Investimentos, S.A.'),
      help: l('Deixe em branco para emitir "A quem possa interessar".', 'Leave blank to address it "To whom it may concern".'),
    },
    {
      name: 'destinatarioEndereco',
      type: 'text',
      section: 'documento',
      label: l('Endereço da entidade (opcional)', 'Addressee address (optional)'),
      placeholder: l('Ex.: Av. 25 de Setembro, Maputo', 'E.g. Av. 25 de Setembro, Maputo'),
      showIf: (v) => Boolean(v.destinatario),
    },
    {
      name: 'finalidade',
      type: 'text',
      section: 'documento',
      label: l('Finalidade (opcional)', 'Purpose (optional)'),
      placeholder: l('Ex.: para efeitos de crédito bancário', 'E.g. para efeitos de crédito bancário (bank loan)'),
      help: l('Sem finalidade, o texto diz "para os devidos efeitos".', 'Without a purpose the text says "for all due purposes".'),
    },
    ...workerFields(['nome', 'genero', 'cargo', 'dataAdmissao', 'docTipo', 'docNumero', 'nuit']).map((f) =>
      f.name === 'trabalhadorDataAdmissao' || f.name === 'trabalhadorCargo' ? { ...f, required: true } : f,
    ),
    {
      name: 'tipoContrato',
      type: 'select',
      section: 'contrato',
      width: 'half',
      label: l('Tipo de contrato', 'Contract type'),
      options: CONTRATO_OPTIONS,
      default: 'indeterminado',
    },
    {
      name: 'dataFimContrato',
      type: 'date',
      section: 'contrato',
      width: 'half',
      required: true,
      label: l('Data de fim do contrato', 'Contract end date'),
      showIf: (v) => v.tipoContrato === 'prazo certo',
    },
    ...workerFields(['salario'], 'remuneracao').map((f) => ({ ...f, required: true })),
    {
      name: 'subsidios',
      type: 'lines',
      section: 'remuneracao',
      label: l('Subsídios mensais', 'Monthly allowances'),
      addLabel: l('Adicionar subsídio', 'Add allowance'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description'), placeholder: l('Ex.: Subsídio de transporte', 'E.g. Transport allowance') },
        { name: 'valor', type: 'money', label: l('Valor mensal', 'Monthly amount') },
      ],
      default: [],
    },
    {
      name: 'salarioBruto',
      type: 'money',
      section: 'remuneracao',
      width: 'half',
      computedKey: 'bruto',
      label: l('Remuneração mensal ilíquida (bruta)', 'Gross monthly pay'),
      help: l('Salário base + subsídios. Escreva um valor para substituir.', 'Base salary + allowances. Type a value to override.'),
    },
    {
      name: 'incluirLiquido',
      type: 'toggle',
      section: 'remuneracao',
      default: true,
      label: l('Indicar a remuneração líquida', 'State the net pay'),
      help: l('Os bancos pedem normalmente o valor líquido.', 'Banks usually ask for the net amount.'),
    },
    {
      name: 'salarioLiquido',
      type: 'money',
      section: 'remuneracao',
      width: 'half',
      computedKey: 'liquido',
      label: l('Remuneração mensal líquida', 'Net monthly pay'),
      help: l(
        'Calculada com o INSS e a tabela de IRPS (se estiver activa em Definições). Escreva um valor para substituir.',
        'Computed with INSS and the IRPS table (if enabled in Settings). Type a value to override.',
      ),
      showIf: (v) => Boolean(v.incluirLiquido),
    },
    {
      name: 'semPenhoras',
      type: 'toggle',
      section: 'opcoes',
      label: l('Declarar que não há penhoras conhecidas sobre o salário', 'State that no known garnishment affects the salary'),
      help: l('Só active se a empresa não tiver recebido nenhuma ordem de penhora ou cessão do salário.', 'Only enable if the company has received no garnishment or assignment order.'),
    },
    {
      name: 'semCessacao',
      type: 'toggle',
      section: 'opcoes',
      label: l('Declarar que o contrato não está em cessação', 'State that the contract is not being terminated'),
      help: l(
        'Afirma que o trabalhador não está em período probatório nem em processo disciplinar ou de cessação do contrato.',
        'States the employee is not on probation nor subject to disciplinary or termination proceedings.',
      ),
    },
  ],

  computed: (v, { legal }) => {
    const base = money(v.trabalhadorSalario);
    const subs = lineItems(v.subsidios).filter((r) => money(r.valor));
    const brutoCalc = roundMoney((base ?? 0) + sum(subs));
    const brutoUsed = money(v.salarioBruto) ?? brutoCalc;
    const taxaT = legal.value<number>('inssTaxaTrabalhador');
    const inss = roundMoney(brutoUsed * taxaT);
    const irps = irpsWithholding(legal.table('irpsRetencao') as IrpsBand[], brutoUsed, 0);
    const liquidoCalc = irps != null && brutoUsed > 0 ? roundMoney(brutoUsed - inss - irps) : null;
    const liquidoUsed = money(v.salarioLiquido) ?? liquidoCalc;
    return {
      base,
      subs,
      bruto: brutoCalc,
      brutoUsed,
      liquido: liquidoCalc,
      liquidoUsed,
      irpsTableActive: irps != null,
    };
  },

  warnings: (v, { computed: c, today }) => {
    const w: Warning[] = [];
    if (!v.trabalhadorDataAdmissao) {
      w.push({ level: 'warning', field: 'trabalhadorDataAdmissao', message: l('Indique a data de admissão.', 'Enter the start date.') });
    }
    if (!v.trabalhadorDocNumero) {
      w.push({
        level: 'info',
        field: 'trabalhadorDocNumero',
        message: l('Os bancos exigem normalmente o número do documento de identificação.', 'Banks usually require the ID document number.'),
      });
    }
    if (!c.base) {
      w.push({ level: 'warning', field: 'trabalhadorSalario', message: l('Indique o salário base.', 'Enter the base salary.') });
    }
    if (v.tipoContrato === 'prazo certo') {
      if (!v.dataFimContrato) {
        w.push({ level: 'warning', field: 'dataFimContrato', message: l('Indique a data de fim do contrato.', 'Enter the contract end date.') });
      } else if (diffDays(v.data || today, v.dataFimContrato) < 0) {
        w.push({
          level: 'warning',
          field: 'dataFimContrato',
          message: l('A data de fim do contrato é anterior à data da declaração.', 'The contract end date is before the date of this letter.'),
        });
      }
    }
    if (money(v.salarioBruto) != null && c.subs.length + (c.base ? 1 : 0) > 0 && Math.abs(c.brutoUsed - c.bruto) > 0.005) {
      w.push({
        level: 'info',
        field: 'salarioBruto',
        message: l(
          `A remuneração ilíquida indicada difere da soma do salário base com os subsídios (${formatMoney(c.bruto)}).`,
          `The gross pay entered differs from base salary plus allowances (${formatMoney(c.bruto)}).`,
        ),
      });
    }
    if (v.incluirLiquido && c.liquidoUsed == null) {
      w.push({
        level: 'warning',
        field: 'salarioLiquido',
        message: l(
          'Indique a remuneração líquida. Não é calculada porque a tabela de IRPS não está activa em Definições.',
          'Enter the net pay. It is not computed because the IRPS table is not enabled in Settings.',
        ),
      });
    }
    if (c.liquidoUsed != null && c.liquidoUsed > c.brutoUsed) {
      w.push({ level: 'error', field: 'salarioLiquido', message: l('A remuneração líquida é superior à ilíquida.', 'Net pay exceeds gross pay.') });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const { values: v, computed: c } = ctx;
    const ge = v.trabalhadorGenero;
    const f = isF(ge);
    const empresa = ctx.profile?.kind !== 'pessoa';
    const who = workerIdent(v);
    const emp = employerRef(ctx);
    const fin = finalidade(v);
    const ct = contrato(v);
    const trab = g(ge, 'trabalhador', 'trabalhadora');
    const showLiq = Boolean(v.incluirLiquido) && c.liquidoUsed != null && c.brutoUsed > 0;
    const subs: Record<string, any>[] = c.subs;
    const hasExtra = subs.length > 0 || Math.abs(c.brutoUsed - (c.base ?? 0)) > 0.005;

    const blocks: Block[] = [];
    if (v.ref) blocks.push({ type: 'reference', ref: v.ref });
    if (v.destinatario) {
      blocks.push({ type: 'recipient', salutation: 'Exmos. Senhores', lines: [v.destinatario, v.destinatarioEndereco || ''] });
    }
    blocks.push(
      { type: 'title', text: 'Declaração', subtitle: v.destinatario ? undefined : 'A quem possa interessar' },
      {
        type: 'paragraph',
        id: 'identificacao',
        text: `${fin.pt.charAt(0).toUpperCase()}${fin.pt.slice(1)}, declara-se que ${who.pt} é ${trab} ${emp.pt} desde ${dateLong(v.trabalhadorDataAdmissao)}, exercendo actualmente as funções de **${blank(v.trabalhadorCargo)}**, com contrato de trabalho ${ct.pt}.`,
        en: `This is to certify, ${fin.en}, that ${who.en} has been an employee ${emp.en} since ${dateEn(v.trabalhadorDataAdmissao)}, currently holding the position of ${blank(v.trabalhadorCargo)}, under ${ct.en}.`,
      },
    );

    const ref = g(ge, 'O referido trabalhador', 'A referida trabalhadora');
    const liqPt = showLiq ? `, a que corresponde a remuneração mensal líquida de **${formatMoney(c.liquidoUsed)}**, após os descontos legais` : '';
    const liqEn = showLiq ? `, corresponding to a net monthly pay of ${formatMoney(c.liquidoUsed)} after statutory deductions` : '';
    blocks.push({
      type: 'paragraph',
      id: 'remuneracao',
      text: hasExtra
        ? `${ref} aufere o salário base mensal ilíquido de **${formatMoney(c.base)}**${subs.length ? `, acrescido dos subsídios discriminados no quadro seguinte` : ''}, perfazendo a remuneração mensal ilíquida de **${formatMoney(c.brutoUsed)}**${liqPt}.`
        : `${ref} aufere o salário base mensal ilíquido de **${formatMoney(c.base)}**${liqPt}.`,
      en: hasExtra
        ? `${f ? 'She' : 'He'} earns a gross monthly base salary of ${formatMoney(c.base)}${subs.length ? ', plus the allowances listed in the table below' : ''}, making a gross monthly pay of ${formatMoney(c.brutoUsed)}${liqEn}.`
        : `${f ? 'She' : 'He'} earns a gross monthly base salary of ${formatMoney(c.base)}${liqEn}.`,
    });

    if (c.brutoUsed > 0 && (subs.length > 0 || showLiq)) {
      const totals: string[][] = [['Remuneração mensal ilíquida', formatMoney(c.brutoUsed, false)]];
      if (showLiq) {
        const descontos = roundMoney(c.brutoUsed - c.liquidoUsed);
        if (descontos > 0) totals.push(['Descontos legais (INSS e IRPS)', formatMoney(descontos, false)]);
        totals.push(['Remuneração mensal líquida', formatMoney(c.liquidoUsed, false)]);
      }
      blocks.push({
        type: 'table',
        columns: [
          { label: 'Descrição', width: 3 },
          { label: 'Valor mensal (MT)', width: 1.4, align: 'right' },
        ],
        rows: [
          ['Salário base', formatMoney(c.base, false)],
          ...subs.map((s) => [s.descricao || 'Subsídio', formatMoney(money(s.valor), false)]),
        ],
        totals,
      });
    }
    const destaque = showLiq ? c.liquidoUsed : c.brutoUsed;
    if (destaque > 0) {
      blocks.push({
        type: 'amount',
        label: showLiq ? 'Remuneração mensal líquida' : 'Remuneração mensal ilíquida',
        value: destaque,
      });
    }

    if (v.semPenhoras) {
      blocks.push({
        type: 'paragraph',
        id: 'penhoras',
        text: `Mais se declara que, até à presente data, não é do conhecimento ${empresa ? 'desta empresa' : 'da entidade empregadora'} a existência de qualquer penhora, cessão ou outro ónus sobre a remuneração ${g(ge, 'do referido trabalhador', 'da referida trabalhadora')}.`,
        en: `It is further stated that, to date, the employer is not aware of any garnishment, assignment or other charge on ${f ? 'her' : 'his'} pay.`,
      });
    }
    if (v.semCessacao) {
      blocks.push({
        type: 'paragraph',
        id: 'cessacao',
        text: `Declara-se ainda que ${g(ge, 'o trabalhador', 'a trabalhadora')} não se encontra em período probatório e que não está em curso qualquer processo disciplinar ou de cessação do respectivo contrato de trabalho.`,
        en: `It is also stated that the employee is not on probation and that no disciplinary or termination proceedings are pending against ${f ? 'her' : 'him'}.`,
      });
    }

    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: empresa
          ? 'Por ser verdade e me ter sido solicitada, passa-se a presente declaração, que vai por mim assinada e autenticada com o carimbo em uso nesta empresa.'
          : 'Por ser verdade e me ter sido solicitada, passa-se a presente declaração, que vai por mim assinada.',
        en: empresa
          ? 'This declaration is issued at the request of the person concerned, signed and authenticated with the company stamp.'
          : 'This declaration is issued at the request of the person concerned and signed by me.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [signer(ctx)] },
    );
    return blocks;
  },
});
