// Acordo de formação profissional com pacto de permanência: the employer pays
// for a training course and the employee agrees to stay for a period after it
// or to repay part of the costs in proportion to the time left. The Labour Law
// does not regulate the clause (freedom of contract; confirm with a lawyer).
// The employee's right to resign is never excluded.

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, formatMoney, l, lineItems, localField, money, refField } from './_shared';
import { contratoTitle, contratoWorkerFields, doCite, fechoBlocks, moneyExt, partesBlocks, qty, wk } from './_contrato-trabalho';
import { str } from './_rh-politicas';

export default defineTemplate({
  id: 'acordo-formacao-permanencia',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'formacao', title: l('Formação', 'Training') },
    { id: 'custos', title: l('Custos', 'Costs') },
    { id: 'permanencia', title: l('Permanência', 'Retention') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data de assinatura', 'Signing date')),
    ...contratoWorkerFields(),
    { name: 'curso', type: 'text', section: 'formacao', required: true, label: l('Curso / acção de formação', 'Course'), placeholder: l('Ex.: Curso de Operador de Grua Torre, nível II', 'E.g. Tower crane operator course, level II') },
    { name: 'entidadeFormadora', type: 'text', section: 'formacao', required: true, label: l('Entidade formadora', 'Training provider') },
    { name: 'localFormacao', type: 'text', section: 'formacao', width: 'half', label: l('Local', 'Place') },
    { name: 'certificacao', type: 'text', section: 'formacao', width: 'half', label: l('Certificado ou qualificação obtida', 'Certificate obtained') },
    { name: 'dataInicio', type: 'date', section: 'formacao', width: 'half', required: true, label: l('Início', 'Start') },
    { name: 'dataFim', type: 'date', section: 'formacao', width: 'half', required: true, label: l('Fim', 'End') },
    { name: 'horarioFormacao', type: 'select', section: 'formacao', width: 'half', label: l('Tempo da formação', 'Training time'), default: 'servico', options: [
      { value: 'servico', label: l('Conta como tempo de serviço', 'Counts as working time') },
      { value: 'misto', label: l('Parte fora do horário', 'Partly outside working hours') },
    ] },
    {
      name: 'custos',
      type: 'lines',
      section: 'custos',
      label: l('Custos suportados pela empresa', 'Costs paid by the company'),
      addLabel: l('Adicionar custo', 'Add cost'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
      default: [{ descricao: 'Propina do curso', valor: '' }],
    },
    { name: 'permanenciaMeses', type: 'number', section: 'permanencia', width: 'half', min: 1, max: 60, default: 24, required: true, label: l('Período de permanência (meses)', 'Retention period (months)'), help: l('Contado a partir do fim da formação. Deve ser proporcional ao custo e à duração do curso.', 'Counted from the end of training. Should be proportionate to the cost and length of the course.') },
    { name: 'reembolsoProporcional', type: 'toggle', section: 'permanencia', default: true, label: l('Reembolso proporcional ao tempo em falta', 'Repayment proportional to the time left') },
    { name: 'aproveitamento', type: 'toggle', section: 'permanencia', default: true, label: l('Reembolso se faltar ao curso sem justificação ou não tiver aproveitamento por culpa sua', 'Repay if absent without reason or failing through own fault') },
  ],

  computed: (v) => {
    const total = lineItems(v.custos).reduce((s, r) => s + (money(r.valor) ?? 0), 0);
    return { total };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const meses = Number(v.permanenciaMeses);
    w.push({ level: 'info', message: l(`O pacto de permanência não está regulado na Lei do Trabalho; apoia-se na liberdade contratual (${cite('rhpPactoPermanencia')}). O trabalhador mantém sempre o direito de denunciar o contrato; o pacto só fixa o reembolso.`, 'The retention clause is not regulated by the Labour Law; it rests on freedom of contract. The employee can always resign; the clause only sets the repayment.') });
    if (Number.isFinite(meses) && meses > 36) w.push({ level: 'warning', field: 'permanenciaMeses', message: l('Um período longo pode ser considerado excessivo pelo tribunal. Justifique-o com o custo e a duração da formação.', 'A long period may be considered excessive by a court; justify it by the cost and length of training.') });
    if (!ctx.computed.total) w.push({ level: 'warning', field: 'custos', message: l('Indique os custos da formação: o reembolso é calculado a partir deles.', 'Enter the training costs: repayment is based on them.') });
    w.push({ level: 'info', message: l(`Qualquer desconto no salário para reembolso precisa de autorização escrita do trabalhador e respeita os limites legais (${cite('descontosRemuneracao')}).`, 'Any pay deduction for repayment needs written authorisation and must respect the legal limits.') });
    return w;
  },
  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const W = wk(v.trabalhadorGenero);
    const total = ctx.computed.total as number;
    const custos = lineItems(v.custos).filter((r) => str(r.descricao));
    const meses = Number(v.permanenciaMeses);
    const mesesTxt = Number.isFinite(meses) && meses > 0 ? qty(meses, 'mês', 'meses') : `${BLANK} meses`;
    const items: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `A Entidade Empregadora proporciona ${W.ao} a frequência do curso **${str(v.curso) || BLANK}**, ministrado por ${str(v.entidadeFormadora) || BLANK}${str(v.localFormacao) ? `, em ${str(v.localFormacao)}` : ''}, de ${dateLong(v.dataInicio)} a ${dateLong(v.dataFim)}${str(v.certificacao) ? `, conferente de ${str(v.certificacao)}` : ''}, no âmbito da formação profissional dos trabalhadores no activo ${doCite('rhpFormacao').replace(/^d/, 'prevista n')}.`,
        en: 'The employer provides the stated training course as part of on-the-job training.',
      },
      {
        id: 'encargos',
        heading: 'Encargos',
        text: `A Entidade Empregadora suporta os custos da formação, no montante total de **${total ? moneyExt(total) : `${BLANK} MT`}**${custos.length ? ', assim discriminados:' : '.'}`,
        items: custos.length ? custos.map((r, i) => `${str(r.descricao)}: ${formatMoney(money(r.valor))}${i === custos.length - 1 ? '.' : ';'}`) : undefined,
        en: 'The employer pays the training costs, itemised.',
      },
      {
        id: 'tempo',
        heading: 'Tempo de formação e remuneração',
        text: `Durante a formação ${W.o} mantém a sua remuneração e demais regalias${v.horarioFormacao === 'misto' ? '; o tempo de formação que decorra fora do horário de trabalho não é considerado trabalho extraordinário' : ', contando o tempo de formação como tempo de serviço efectivo'}.`,
        en: 'Pay and benefits are kept during training.',
      },
      {
        id: 'deveres',
        heading: `Deveres ${W.do}`,
        text: `${W.O} obriga-se a frequentar a formação com assiduidade e aproveitamento, a cumprir as regras da entidade formadora, a entregar à Entidade Empregadora cópia do certificado obtido e a aplicar e partilhar no seu trabalho os conhecimentos adquiridos.`,
        en: 'The employee must attend with diligence, pass, hand in the certificate and apply the knowledge gained.',
      },
      {
        id: 'permanencia',
        heading: 'Pacto de permanência',
        text: [
          `1. Em contrapartida dos encargos suportados pela Entidade Empregadora, ${W.o} compromete-se a manter-se ao seu serviço durante ${mesesTxt} a contar do fim da formação.`,
          `2. Se, durante esse período, ${W.o} denunciar o contrato sem justa causa, ou este cessar por despedimento com justa causa por facto que lhe seja imputável, ${W.o} reembolsa à Entidade Empregadora ${v.reembolsoProporcional !== false ? 'os custos referidos na cláusula segunda, na proporção do tempo de permanência em falta' : 'os custos referidos na cláusula segunda'}.`,
          v.aproveitamento !== false ? `3. Há igualmente lugar a reembolso se ${W.o} abandonar a formação ou não obtiver aproveitamento por faltas injustificadas ou outro facto que lhe seja imputável.` : '',
          `${v.aproveitamento !== false ? '4' : '3'}. Não há lugar a reembolso se o contrato cessar por rescisão com justa causa por iniciativa ${W.do}, por despedimento por motivos económicos, por caducidade ou por acordo das partes que o dispense.`,
          `${v.aproveitamento !== false ? '5' : '4'}. O presente pacto não limita o direito ${W.do} de denunciar o contrato de trabalho nos termos legais; apenas fixa a compensação devida à Entidade Empregadora.`,
        ].filter(Boolean).join('\n'),
        en: 'Retention: the employee stays for the stated period after training or repays the costs (proportionally) on resignation without cause or dismissal for misconduct; no repayment in other cases; the right to resign is unaffected.',
      },
      {
        id: 'pagamento',
        heading: 'Pagamento do reembolso',
        text: `O reembolso é pago no prazo acordado entre as partes ou, na falta de acordo, na data da cessação do contrato. A compensação com créditos ${W.do} só é feita com a sua autorização escrita e dentro dos limites ${doCite('descontosRemuneracao')}.`,
        en: 'Repayment is due when agreed or on termination; set-off against amounts owed to the employee only with written consent and within legal limits.',
      },
      {
        id: 'contrato',
        heading: 'Relação com o contrato de trabalho',
        text: 'O presente acordo faz parte integrante do contrato de trabalho, que se mantém em vigor em tudo o que não for por ele alterado.',
        en: 'This agreement is part of the employment contract.',
      },
    ];
    return [
      contratoTitle(v, 'Acordo de Formação Profissional com Pacto de Permanência'),
      ...partesBlocks(ctx, 'É celebrado o presente acordo de formação profissional, que se rege pelas cláusulas seguintes:', 'This training agreement is made on the following terms:'),
      { type: 'numberedClauses', style: 'clausula', items },
      ...fechoBlocks(ctx),
    ];
  },
});
