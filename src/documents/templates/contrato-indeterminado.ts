// Contrato de trabalho por tempo indeterminado.
//
// The clause builders and field groups live in _contrato-trabalho.ts and are
// shared with the fixed-term contracts, so wording stays identical.

import { addDays, addMonths } from '@/lib/format';
import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { cite, dateLong, l } from './_shared';
import { num, qty, doCite, wk, CONTRATO_SECTIONS, documentoFields, contratoWorkerFields, funcoesFields, startDateField, horarioFields, remuneracaoFields, opcionaisFields, horasComputed, clObjecto, clLocal, clHorario, clRemuneracao, clFerias, clDeveresEmpregador, clDeveresTrabalhador, clSigilo, clExclusividade, clCessacao, clLegislacao, clLitigios, clFinais, contratoTitle, partesBlocks, fechoBlocks, commonWarnings } from './_contrato-trabalho';

type ProbatorioCat = 'geral' | 'tecnicoMedio' | 'tecnicoSuperior';

export default defineTemplate({
  id: 'contrato-indeterminado',
  sections: [
    CONTRATO_SECTIONS.documento,
    CONTRATO_SECTIONS.trabalhador,
    CONTRATO_SECTIONS.funcoes,
    { id: 'inicio', title: l('Início e período probatório', 'Start and probation') },
    CONTRATO_SECTIONS.horario,
    CONTRATO_SECTIONS.remuneracao,
    CONTRATO_SECTIONS.clausulas,
  ],
  fields: [
    ...documentoFields(),
    ...contratoWorkerFields(),
    ...funcoesFields(),
    startDateField('inicio'),
    {
      name: 'periodoProbatorio',
      type: 'toggle',
      section: 'inicio',
      default: true,
      label: l('Incluir período probatório', 'Include a probation period'),
      help: l(
        'Período inicial em que qualquer das partes pode terminar o contrato com aviso curto. Só existe se constar do contrato escrito.',
        'Initial period in which either party may end the contract with short notice. It only applies if written into the contract.',
      ),
    },
    {
      name: 'probatorioCategoria',
      type: 'select',
      section: 'inicio',
      width: 'half',
      default: 'geral',
      showIf: (v) => Boolean(v.periodoProbatorio),
      label: l('Tipo de cargo', 'Type of position'),
      help: l('Define a duração máxima permitida por lei.', 'Sets the maximum length allowed by law.'),
      options: [
        { value: 'geral', label: l('Trabalhadores em geral', 'Employees in general') },
        { value: 'tecnicoMedio', label: l('Técnicos médios', 'Mid-level technicians') },
        { value: 'tecnicoSuperior', label: l('Técnicos superiores, direcção e chefia', 'Senior technicians and managers') },
      ],
    },
    {
      name: 'probatorioMeses',
      type: 'number',
      section: 'inicio',
      width: 'half',
      min: 1,
      max: 12,
      computedKey: 'probatorioMax',
      showIf: (v) => Boolean(v.periodoProbatorio),
      label: l('Duração do período probatório (meses)', 'Probation length (months)'),
      help: l('Por defeito, o máximo legal para o tipo de cargo.', 'Defaults to the legal maximum for the position.'),
    },
    ...horarioFields(),
    ...remuneracaoFields(),
    ...opcionaisFields(),
  ],

  computed: (v, ctx) => {
    const pp = ctx.legal.value<Record<ProbatorioCat, number>>('periodoProbatorioIndeterminado');
    const cat: ProbatorioCat = v.probatorioCategoria in pp ? v.probatorioCategoria : 'geral';
    const probatorioMax = pp[cat];
    const probatorioMeses = num(v.probatorioMeses) ?? probatorioMax;
    const inicio = v.trabalhadorDataAdmissao as string | undefined;
    return {
      ...horasComputed(v, ctx),
      probatorioCat: cat,
      probatorioMax,
      probatorioAbsMax: Math.max(...Object.values(pp)),
      probatorioMeses,
      probatorioFim: inicio && probatorioMeses > 0 ? addDays(addMonths(inicio, probatorioMeses), -1) : null,
    };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [];
    if (v.periodoProbatorio && c.probatorioMeses > c.probatorioMax) {
      w.push({
        level: 'error',
        field: 'probatorioMeses',
        message: l(
          `O período probatório excede o máximo legal de ${c.probatorioMax} ${c.probatorioMax === 1 ? 'mês' : 'meses'} para este tipo de cargo (${cite('periodoProbatorioIndeterminado')}).`,
          `Probation exceeds the legal maximum of ${c.probatorioMax} month(s) for this type of position.`,
        ),
      });
    }
    if (v.periodoProbatorio && c.probatorioCat !== 'geral') {
      w.push({
        level: 'info',
        field: 'probatorioCategoria',
        message: l(
          'O período probatório alargado só se aplica se o cargo for efectivamente de técnico médio, técnico superior, direcção ou chefia.',
          'The longer probation only applies if the position really is mid-level technical, senior technical or managerial.',
        ),
      });
    }
    return [...w, ...commonWarnings(v, ctx)];
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const w = wk(v.trabalhadorGenero);
    const pd = ctx.legal.value<{ geral: number }>('denunciaPeriodoProbatorio');

    const inicio: ClauseItem = {
      id: 'inicio',
      heading: 'Início e duração',
      text: `O presente contrato é celebrado por tempo indeterminado e produz efeitos a partir de **${dateLong(v.trabalhadorDataAdmissao)}**.${
        v.periodoProbatorio ? '' : ' As partes acordam em não sujeitar o contrato a período probatório.'
      }`,
      en: `This contract is for an indefinite period and takes effect on ${v.trabalhadorDataAdmissao || '—'}.${v.periodoProbatorio ? '' : ' No probation period applies.'}`,
    };

    const clauses: ClauseItem[] = [clObjecto(v, 'indeterminado'), clLocal(v), inicio];
    if (v.periodoProbatorio) {
      clauses.push({
        id: 'probatorio',
        heading: 'Período probatório',
        text: [
          `1. O presente contrato fica sujeito a um período probatório de ${qty(c.probatorioMeses, 'mês', 'meses')}, contado a partir do início da prestação de trabalho${
            c.probatorioFim ? ` e com termo em ${dateLong(c.probatorioFim)}` : ''
          }, nos termos ${doCite('periodoProbatorioIndeterminado')}.`,
          `2. Durante o período probatório, qualquer das partes pode denunciar o contrato mediante aviso prévio escrito de ${qty(pd.geral, 'dia', 'dias')}, sem necessidade de invocação de justa causa e sem direito a indemnização, nos termos ${doCite('denunciaPeriodoProbatorio')}.`,
          `3. O período probatório conta para efeitos de antiguidade ${w.do}.`,
        ].join('\n'),
        en: `1. Probation of ${c.probatorioMeses} month(s) from the start of work${c.probatorioFim ? `, ending on ${c.probatorioFim}` : ''}. 2. During probation either party may end the contract with ${pd.geral} days’ written notice, without stating just cause and without compensation. 3. Probation counts towards seniority.`,
      });
    }
    clauses.push(clHorario(v, c), clRemuneracao(v), clFerias(v, ctx), clDeveresEmpregador(v), clDeveresTrabalhador(v));
    if (v.sigilo) clauses.push(clSigilo(v));
    if (v.exclusividade) clauses.push(clExclusividade(v));
    clauses.push(clCessacao(v, ctx, 'indeterminado'), clLegislacao(v), clLitigios(), clFinais());

    return [
      contratoTitle(v, 'Contrato de trabalho por tempo indeterminado'),
      ...partesBlocks(
        ctx,
        'É celebrado, de boa-fé, o presente contrato de trabalho por tempo indeterminado, que se rege pelas cláusulas seguintes:',
        'This permanent employment contract is entered into in good faith and is governed by the following clauses:',
      ),
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fechoBlocks(ctx),
    ];
  },
});
