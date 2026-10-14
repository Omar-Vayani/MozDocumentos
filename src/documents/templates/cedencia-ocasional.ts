// Acordo de cedência ocasional de trabalhador: the employer (cedente) places an
// employee temporarily with another company (cessionário), with the employee's
// written consent; the employee keeps the employment with the cedente.

import { addDays, addMonths, diffDays } from '@/lib/format';
import { defineTemplate, type ClauseItem, type SignatureColumn, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerParty, l, localField, money, refField, workerFields, workerParty } from './_shared';
import { doCite, employerSig, lc, moneyExt, wk } from './_contrato-trabalho';
import { str } from './_pessoal-rh';

export default defineTemplate({
  id: 'cedencia-ocasional',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'cessionario', title: l('Empresa que recebe o trabalhador (Cessionária)', 'Host company (Cessionário)') },
    { id: 'trabalhador', title: l('Trabalhador cedido', 'Seconded employee'), personRole: 'trabalhador' },
    { id: 'cedencia', title: l('Fundamento e duração', 'Reason and term') },
    { id: 'condicoes', title: l('Condições no cessionário', 'Conditions at the host') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data de assinatura', 'Signing date')),
    { name: 'cessionarioNome', type: 'text', section: 'cessionario', required: true, label: l('Denominação', 'Company name') },
    { name: 'cessionarioNuit', type: 'text', section: 'cessionario', width: 'half', label: l('NUIT', 'Tax number (NUIT)') },
    { name: 'cessionarioSede', type: 'text', section: 'cessionario', width: 'half', label: l('Sede', 'Registered office') },
    { name: 'cessionarioRepresentante', type: 'text', section: 'cessionario', width: 'half', label: l('Representante', 'Representative') },
    { name: 'cessionarioCargo', type: 'text', section: 'cessionario', width: 'half', label: l('Cargo do representante', 'Representative’s position') },
    ...workerFields(['nome', 'genero', 'cargo', 'categoria', 'dataAdmissao', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada']),
    {
      name: 'tipoContrato',
      type: 'radio',
      section: 'trabalhador',
      label: l('Contrato do trabalhador com o cedente', 'Employee’s contract with the lender'),
      default: 'indeterminado',
      options: [
        { value: 'indeterminado', label: l('Por tempo indeterminado', 'Permanent') },
        { value: 'certo', label: l('A prazo certo', 'Fixed term') },
      ],
    },
    { name: 'dataFimContrato', type: 'date', section: 'trabalhador', width: 'half', label: l('Termo do contrato a prazo', 'End of the fixed-term contract'), showIf: (v) => v.tipoContrato === 'certo' },
    {
      name: 'fundamento',
      type: 'radio',
      section: 'cedencia',
      label: l('Fundamento', 'Reason'),
      default: 'aumento',
      options: [
        { value: 'aumento', label: l('Aumento de trabalho no cessionário', 'Increased workload at the host') },
        { value: 'mobilidade', label: l('Mobilidade de trabalhadores (ex.: empresas do mesmo grupo)', 'Staff mobility (e.g. group companies)') },
      ],
      legal: l('A cedência só é permitida para fazer face a aumento de trabalho ou à mobilidade de trabalhadores.', 'Secondment is only allowed for increased workload or staff mobility.'),
    },
    { name: 'fundamentoDescricao', type: 'textarea', section: 'cedencia', rows: 2, required: true, label: l('Descreva o fundamento', 'Describe the reason'), placeholder: l('Ex.: arranque da obra de reabilitação do Mercado Central, com pico de trabalho até Junho de 2027', 'E.g. start of a project with a workload peak until June 2027') },
    { name: 'dataInicio', type: 'date', section: 'cedencia', width: 'half', required: true, label: l('Início da cedência', 'Start'), default: (c) => c.today },
    { name: 'dataFim', type: 'date', section: 'cedencia', width: 'half', required: true, label: l('Fim da cedência', 'End') },
    { name: 'funcoes', type: 'text', section: 'condicoes', required: true, label: l('Funções no cessionário', 'Duties at the host'), placeholder: l('Ex.: Técnica de contabilidade no departamento financeiro', 'E.g. accounting technician') },
    { name: 'localTrabalho', type: 'text', section: 'condicoes', width: 'half', label: l('Local de trabalho', 'Workplace') },
    { name: 'horario', type: 'text', section: 'condicoes', width: 'half', label: l('Horário', 'Schedule'), placeholder: l('Ex.: de segunda a sexta-feira, das 7h30 às 16h30', 'E.g. Mon–Fri, 7:30–16:30') },
    {
      name: 'regimeRemuneracao',
      type: 'select',
      section: 'condicoes',
      label: l('Quem paga o trabalhador', 'Who pays the employee'),
      default: 'cedenteReembolso',
      options: [
        { value: 'cedenteReembolso', label: l('O cedente paga e o cessionário reembolsa', 'Lender pays and host reimburses') },
        { value: 'cedente', label: l('O cedente paga, sem reembolso', 'Lender pays, no reimbursement') },
        { value: 'cessionario', label: l('O cessionário paga directamente', 'Host pays directly') },
      ],
    },
    { name: 'valorReembolso', type: 'money', section: 'condicoes', width: 'half', label: l('Valor mensal a reembolsar', 'Monthly reimbursement'), showIf: (v) => v.regimeRemuneracao === 'cedenteReembolso' },
    { name: 'estrangeiro', type: 'toggle', section: 'condicoes', default: false, label: l('O trabalhador é estrangeiro', 'The employee is a foreign national') },
  ],

  computed: (v, ctx) => {
    const max = ctx.legal.value<{ duracaoMaxAnos: number }>('cedenciaOcasional').duracaoMaxAnos;
    const limite = v.dataInicio ? addDays(addMonths(v.dataInicio, max * 12), -1) : null;
    return { max, limite };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `A cedência exige contrato de trabalho com o cedente, fundamento legal, consentimento escrito do trabalhador e duração limitada (${cite('cedenciaOcasional')}). Sem estes requisitos, o trabalhador pode optar por ficar no cessionário ou receber indemnização paga por ambas as empresas.`,
          'Secondment requires an employment contract with the lender, a lawful reason, the employee’s written consent and a limited term. Otherwise the employee may join the host or claim compensation from both companies.',
        ),
      },
    ];
    if (v.dataInicio && v.dataFim) {
      if (diffDays(v.dataInicio, v.dataFim) < 0) w.push({ level: 'error', field: 'dataFim', message: l('O fim é anterior ao início.', 'The end is before the start.') });
      else if (c.limite && diffDays(c.limite, v.dataFim) > 0) {
        w.push({ level: 'error', field: 'dataFim', message: l(`A cedência não pode exceder ${c.max} anos.`, `Secondment may not exceed ${c.max} years.`) });
      }
    }
    if (v.tipoContrato === 'certo' && v.dataFimContrato && v.dataFim && diffDays(v.dataFimContrato, v.dataFim) > 0) {
      w.push({ level: 'error', field: 'dataFim', message: l('Num contrato a prazo certo, a cedência não pode ir além do termo do contrato.', 'With a fixed-term contract, secondment cannot go beyond the contract’s end.') });
    }
    if (v.estrangeiro) {
      w.push({
        level: 'warning',
        field: 'estrangeiro',
        message: l(`A cedência de trabalhador estrangeiro depende de despacho do Ministro do Trabalho ou de quota disponível no cessionário (${cite('trabalhadorEstrangeiro')}).`, 'Seconding a foreign employee needs a Ministerial order or available quota at the host.'),
      });
    }
    if (!str(v.cessionarioNome)) w.push({ level: 'warning', field: 'cessionarioNome', message: l('Indique a empresa cessionária.', 'Enter the host company.') });
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const w = wk(v.trabalhadorGenero);
    const cess = [
      `**${str(v.cessionarioNome) || BLANK}**`,
      str(v.cessionarioSede) ? `com sede em ${str(v.cessionarioSede)}` : '',
      str(v.cessionarioNuit) ? `com o NUIT ${str(v.cessionarioNuit)}` : '',
      str(v.cessionarioRepresentante) ? `neste acto representada por ${str(v.cessionarioRepresentante)}${str(v.cessionarioCargo) ? `, na qualidade de ${str(v.cessionarioCargo)}` : ''}` : '',
    ]
      .filter(Boolean)
      .join(', ');
    const contrato = v.tipoContrato === 'certo' ? `a prazo certo, com termo em ${dateLong(v.dataFimContrato)}` : 'por tempo indeterminado';
    const fundamento =
      v.fundamento === 'mobilidade' ? 'à mobilidade de trabalhadores entre as partes' : 'ao aumento de trabalho da Cessionária';
    const rem =
      v.regimeRemuneracao === 'cessionario'
        ? `Durante a cedência, a remuneração ${w.do} é paga directamente pela Cessionária, nas condições que ${w.o} tinha no Cedente, mantendo-se a cargo deste a inscrição na segurança social.`
        : v.regimeRemuneracao === 'cedente'
          ? `${w.O} continua a ser ${w.a('remunerado', 'remunerada')} pelo Cedente, nas condições do seu contrato de trabalho, sem qualquer encargo para a Cessionária.`
          : `${w.O} continua a ser ${w.a('remunerado', 'remunerada')} pelo Cedente, nas condições do seu contrato de trabalho, reembolsando a Cessionária ao Cedente o montante mensal de ${money(v.valorReembolso) != null ? moneyExt(v.valorReembolso) : BLANK}, contra factura, até ao dia dez do mês seguinte.`;

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `O Cedente cede ocasionalmente à Cessionária ${w.o} ${str(v.trabalhadorNome) ? `**${str(v.trabalhadorNome)}**` : BLANK}, ${w.a('seu trabalhador', 'sua trabalhadora')} desde ${dateLong(v.trabalhadorDataAdmissao)}, com a categoria de ${str(v.trabalhadorCategoria) || str(v.trabalhadorCargo) || BLANK}, ao abrigo de contrato de trabalho ${contrato}, nos termos ${doCite('cedenciaOcasional')}.`,
        en: 'The Lender temporarily places the named employee, its employee under the stated contract, with the Host.',
      },
      {
        id: 'fundamento',
        heading: 'Fundamento',
        text: `A cedência destina-se a fazer face ${fundamento}, nomeadamente: ${lc(str(v.fundamentoDescricao).replace(/\.$/, '')) || BLANK}.`,
        en: `The secondment meets ${v.fundamento === 'mobilidade' ? 'staff mobility between the parties' : 'the Host’s increased workload'}, as described.`,
      },
      {
        id: 'duracao',
        heading: 'Duração',
        text: `A cedência tem início em **${dateLong(v.dataInicio)}** e termo em **${dateLong(v.dataFim)}**, podendo cessar antes por acordo das três partes ou com a cessação da actividade da Cessionária.`,
        en: `From ${v.dataInicio || '—'} to ${v.dataFim || '—'}; it may end earlier by agreement of all three parties or if the Host’s activity ends.`,
      },
      {
        id: 'condicoes',
        heading: 'Funções, local e horário',
        text: `${w.O} exerce na Cessionária as funções de ${str(v.funcoes).replace(/\.$/, '') || BLANK}${str(v.localTrabalho) ? `, em ${str(v.localTrabalho)}` : ''}${str(v.horario) ? `, ${lc(str(v.horario).replace(/\.$/, ''))}` : ''}, ficando sujeito ao poder de direcção da Cessionária durante a cedência.`.replace('ficando sujeito', `ficando ${w.a('sujeito', 'sujeita')}`),
        en: 'The employee performs the stated duties at the Host, under the Host’s direction during the secondment.',
      },
      {
        id: 'remuneracao',
        heading: 'Remuneração e encargos',
        text: rem,
        en: v.regimeRemuneracao === 'cessionario' ? 'The Host pays the employee directly on the same terms.' : 'The Lender keeps paying the employee' + (v.regimeRemuneracao === 'cedenteReembolso' ? ', and the Host reimburses the stated monthly amount.' : '.'),
      },
      {
        id: 'disciplina',
        heading: 'Vínculo e poder disciplinar',
        text: `1. ${w.O} mantém o vínculo contratual com o Cedente, contando o tempo de cedência para todos os efeitos como antiguidade ao seu serviço.\n2. O poder disciplinar continua a pertencer ao Cedente, a quem a Cessionária comunica, por escrito, qualquer facto que possa constituir infracção disciplinar.\n3. A Cessionária assegura ${w.ao} as condições de higiene e segurança no trabalho no seu local de trabalho.`,
        en: '1. The employee stays employed by the Lender; seniority continues. 2. Disciplinary power stays with the Lender; the Host reports any possible offence in writing. 3. The Host ensures health and safety at its premises.',
      },
      {
        id: 'regresso',
        heading: 'Regresso',
        text: `Findo o presente acordo ou cessando a actividade da Cessionária, ${w.o} regressa ao Cedente, na categoria e com a remuneração que tinha, acrescidas das actualizações entretanto ocorridas.`,
        en: 'When the agreement ends or the Host ceases activity, the employee returns to the Lender in the same grade and pay, plus any updates.',
      },
      {
        id: 'concordancia',
        heading: `Concordância ${w.do}`,
        text: `${w.O} declara que foi ${w.a('informado', 'informada')} dos termos do presente acordo e que **concorda** com a sua cedência à Cessionária, nas condições nele estabelecidas, assinando-o para esse efeito.`,
        en: 'The employee confirms having been informed of this agreement and consents to the secondment on its terms, signing it for that purpose.',
      },
    ];

    const cols: SignatureColumn[] = [
      employerSig(ctx, 'O Cedente'),
      { role: 'A Cessionária', name: str(v.cessionarioRepresentante) || undefined, detail: str(v.cessionarioCargo) || undefined },
      { role: w.O, name: str(v.trabalhadorNome) || undefined },
    ];

    return [
      { type: 'title', text: 'Acordo de Cedência Ocasional de Trabalhador', subtitle: v.ref ? `N.º ${v.ref}` : undefined },
      { type: 'paragraph', id: 'entre', text: '**Entre:**', align: 'left', editable: false },
      { type: 'paragraph', id: 'parteCedente', text: `${employerParty(ctx, 'Cedente')};`, en: 'The lending employer (the “Lender”);' },
      { type: 'paragraph', id: 'e', text: '**e**', align: 'left', editable: false },
      { type: 'paragraph', id: 'parteCessionaria', text: `${cess}, adiante designada por **Cessionária**;`, en: 'The host company (the “Host”);' },
      { type: 'paragraph', id: 'com', text: '**com a concordância de**', align: 'left', editable: false },
      { type: 'paragraph', id: 'parteTrabalhador', text: `${workerParty(v)};`, en: 'The employee (the “Employee”);' },
      { type: 'paragraph', id: 'celebracao', text: 'É celebrado o presente acordo de cedência ocasional, que se rege pelas cláusulas seguintes:', en: 'This secondment agreement is governed by the following clauses:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      { type: 'paragraph', id: 'exemplares', text: `Feito em ${ctx.place}, aos ${dateLong(v.data)}, em três exemplares de igual valor, ficando um em poder de cada uma das partes.`, en: 'Made in three counterparts of equal value, one for each party.', keepWithNext: true },
      { type: 'signatures', columns: cols },
    ];
  },
});
