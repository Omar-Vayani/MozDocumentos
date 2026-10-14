// Contrato de trabalho a prazo incerto. Shares its clause builders with
// contrato-indeterminado.ts.

import { addDays } from '@/lib/format';
import { defineTemplate, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, l } from './_shared';
import {
  clCessacao, clDeveresEmpregador, clDeveresTrabalhador, clExclusividade, clFerias, clFinais, clHorario, clLegislacao,
  clLitigios, clLocal, clObjecto, clRemuneracao, clSigilo, commonWarnings, CONTRATO_SECTIONS, contratoTitle,
  contratoWorkerFields, doCite, documentoFields, fechoBlocks, funcoesFields, horarioFields, horasComputed, lc, num,
  opcionaisFields, partesBlocks, qty, remuneracaoFields, startDateField, wk,
} from './_contrato-trabalho';

type MotivoTipo = 'substituicao' | 'obra' | 'projecto' | 'sazonal';

const trim = (s: unknown) => String(s ?? '').trim().replace(/\.$/, '');

/** Purpose of the contract, as it reads after "para …". */
function finalidade(v: Values): { pt: string; en: string } {
  const desc = trim(v.obraDescricao);
  switch (v.motivoTipo as MotivoTipo) {
    case 'obra':
      return { pt: `a execução da seguinte obra: **${desc || BLANK}**`, en: `carrying out the following works: ${desc || '—'}` };
    case 'projecto':
      return { pt: `a execução do seguinte projecto: **${desc || BLANK}**`, en: `carrying out the following project: ${desc || '—'}` };
    case 'sazonal':
      return { pt: `o exercício da seguinte actividade sazonal: **${desc || BLANK}**`, en: `the following seasonal activity: ${desc || '—'}` };
    default: {
      const nome = trim(v.substituidoNome);
      const motivo = trim(v.substituidoMotivo);
      return {
        pt: `a substituição de **${nome || BLANK}**, durante o seu impedimento temporário${motivo ? ` por motivo de ${lc(motivo)}` : ''}`,
        en: `replacing ${nome || '—'} during their temporary absence${motivo ? ` (${motivo})` : ''}`,
      };
    }
  }
}

/** Default end event when the user leaves it empty. */
function eventoPadrao(v: Values): string {
  switch (v.motivoTipo as MotivoTipo) {
    case 'obra':
      return 'a conclusão da obra ou da parte da obra a que ficar afecto';
    case 'projecto':
      return 'a conclusão do projecto ou da fase do projecto a que ficar afecto';
    case 'sazonal':
      return 'o termo da actividade sazonal';
    default:
      return 'o regresso ao serviço do trabalhador substituído ou a cessação do respectivo contrato de trabalho';
  }
}

export default defineTemplate({
  id: 'contrato-prazo-incerto',
  family: 'contrato',
  sections: [
    CONTRATO_SECTIONS.documento,
    CONTRATO_SECTIONS.trabalhador,
    CONTRATO_SECTIONS.funcoes,
    { id: 'motivo', title: l('Motivo e duração', 'Reason and term') },
    { id: 'probatorio', title: l('Período probatório', 'Probation') },
    CONTRATO_SECTIONS.horario,
    CONTRATO_SECTIONS.remuneracao,
    CONTRATO_SECTIONS.clausulas,
  ],
  fields: [
    ...documentoFields(),
    ...contratoWorkerFields(),
    ...funcoesFields(),
    {
      name: 'motivoTipo',
      type: 'select',
      section: 'motivo',
      required: true,
      default: 'substituicao',
      label: l('Motivo do contrato', 'Reason for the contract'),
      legal: l(
        'O contrato a prazo incerto só é admitido enquanto durar uma necessidade temporária (substituição, obra, projecto ou actividade sazonal).',
        'An uncertain-term contract is only allowed while a temporary need lasts (replacement, works, project or seasonal activity).',
      ),
      options: [
        { value: 'substituicao', label: l('Substituição de trabalhador ausente', 'Replacing an absent employee') },
        { value: 'obra', label: l('Obra', 'Construction works') },
        { value: 'projecto', label: l('Projecto', 'Project') },
        { value: 'sazonal', label: l('Actividade sazonal', 'Seasonal activity') },
      ],
    },
    {
      name: 'substituidoNome',
      type: 'text',
      section: 'motivo',
      width: 'half',
      showIf: (v) => !v.motivoTipo || v.motivoTipo === 'substituicao',
      label: l('Nome do trabalhador substituído', 'Name of the employee replaced'),
    },
    {
      name: 'substituidoMotivo',
      type: 'text',
      section: 'motivo',
      width: 'half',
      showIf: (v) => !v.motivoTipo || v.motivoTipo === 'substituicao',
      label: l('Motivo da ausência', 'Reason for the absence'),
      placeholder: l('Ex.: licença de maternidade', 'E.g. maternity leave'),
    },
    {
      name: 'obraDescricao',
      type: 'text',
      section: 'motivo',
      showIf: (v) => Boolean(v.motivoTipo) && v.motivoTipo !== 'substituicao',
      label: l('Identificação da obra, projecto ou actividade', 'Works, project or activity'),
      placeholder: l('Ex.: construção do armazém da Machava, adjudicada pelo cliente X', 'E.g. construction of the Machava warehouse for client X'),
    },
    {
      name: 'eventoTermo',
      type: 'text',
      section: 'motivo',
      label: l('Facto que põe fim ao contrato', 'Event that ends the contract'),
      help: l('Se ficar vazio, usa-se o texto habitual para o motivo escolhido.', 'If left empty, the usual wording for the chosen reason is used.'),
      placeholder: l('Ex.: a conclusão da obra', 'E.g. completion of the works'),
    },
    startDateField('motivo'),
    {
      name: 'duracaoPrevistaMeses',
      type: 'number',
      section: 'motivo',
      width: 'half',
      min: 1,
      max: 240,
      label: l('Duração prevista (meses, opcional)', 'Expected length (months, optional)'),
      help: l('Indicativa: não fixa uma data de fim.', 'For guidance only: it does not set an end date.'),
    },
    {
      name: 'periodoProbatorio',
      type: 'toggle',
      section: 'probatorio',
      default: false,
      label: l('Incluir período probatório', 'Include a probation period'),
      help: l(
        'Nos contratos a prazo incerto, só é admitido se a duração prevista atingir o mínimo legal. Confirme antes de incluir.',
        'In uncertain-term contracts it is only allowed if the expected length reaches the legal minimum. Confirm before including.',
      ),
    },
    {
      name: 'probatorioDias',
      type: 'number',
      section: 'probatorio',
      width: 'half',
      min: 1,
      max: 365,
      computedKey: 'probatorioMax',
      showIf: (v) => Boolean(v.periodoProbatorio),
      label: l('Duração do período probatório (dias)', 'Probation length (days)'),
      help: l('Por defeito, o máximo legal.', 'Defaults to the legal maximum.'),
    },
    ...horarioFields(),
    ...remuneracaoFields(),
    ...opcionaisFields(),
  ],

  computed: (v, ctx) => {
    const inicio = (v.trabalhadorDataAdmissao as string) || undefined;
    const pp = ctx.legal.value<{ ate6Meses: number; incertoMinDias: number }>('periodoProbatorioPrazo');
    const pd = ctx.legal.value<{ probatorio15Dias: number }>('denunciaPeriodoProbatorio');
    const probatorioMax = pp.ate6Meses;
    const probatorioDias = num(v.probatorioDias) ?? probatorioMax;
    return {
      ...horasComputed(v, ctx),
      inicio,
      prevista: num(v.duracaoPrevistaMeses),
      maxAnos: ctx.legal.value<{ duracaoMaxAnos: number }>('contratoPrazoIncerto').duracaoMaxAnos,
      aviso: ctx.legal.value<{ ate3Anos: number; mais3Anos: number; minimoMeses: number; limiarMeses: number }>('caducidadePrazoIncertoAviso'),
      incertoMinDias: pp.incertoMinDias,
      probatorioMax,
      probatorioDias,
      probatorioFim: inicio && probatorioDias > 0 ? addDays(inicio, probatorioDias - 1) : null,
      denunciaProbatorio: pd.probatorio15Dias,
    };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [];
    const tipo = (v.motivoTipo || 'substituicao') as MotivoTipo;
    if (tipo === 'substituicao' && !trim(v.substituidoNome)) {
      w.push({
        level: 'warning',
        field: 'substituidoNome',
        message: l('Indique o trabalhador substituído: é o fundamento do contrato.', 'Name the employee being replaced: it is the legal basis of the contract.'),
      });
    }
    if (tipo !== 'substituicao' && !trim(v.obraDescricao)) {
      w.push({
        level: 'warning',
        field: 'obraDescricao',
        message: l('Identifique a obra, o projecto ou a actividade: é o fundamento do contrato.', 'Identify the works, project or activity: it is the legal basis of the contract.'),
      });
    }
    if (c.prevista != null && c.prevista > c.maxAnos * 12) {
      w.push({
        level: 'error',
        field: 'duracaoPrevistaMeses',
        message: l(
          `A duração prevista excede ${c.maxAnos} anos. Ultrapassado esse limite, o contrato converte-se em contrato por tempo indeterminado (${cite('contratoPrazoIncerto')}).`,
          `The expected length exceeds ${c.maxAnos} years; beyond that the contract becomes permanent.`,
        ),
      });
    }
    if (v.periodoProbatorio) {
      // Probation needs an expected length of at least incertoMinDias (about 30 days per month).
      const curta = c.prevista != null && c.prevista * 30 < c.incertoMinDias;
      w.push({
        level: curta ? 'error' : 'warning',
        field: curta ? 'periodoProbatorio' : 'duracaoPrevistaMeses',
        message: curta
          ? l(
              `Com a duração prevista indicada não é admitido período probatório: exige-se uma duração prevista de pelo menos ${c.incertoMinDias} dias (${cite('periodoProbatorioPrazo')}).`,
              `Probation is not allowed with this expected length: it must be at least ${c.incertoMinDias} days.`,
            )
          : l(
              `No contrato a prazo incerto, o período probatório só é admitido se se previr uma duração igual ou superior a ${c.incertoMinDias} dias (${cite('periodoProbatorioPrazo')}).${c.prevista == null ? ' Indique a duração prevista.' : ''}`,
              `In an uncertain-term contract, probation is only allowed if the expected length is ${c.incertoMinDias} days or more.${c.prevista == null ? ' Enter the expected length.' : ''}`,
            ),
      });
      if (c.probatorioDias > c.probatorioMax) {
        w.push({
          level: 'error',
          field: 'probatorioDias',
          message: l(
            `O período probatório excede o máximo legal de ${c.probatorioMax} dias (${cite('periodoProbatorioPrazo')}).`,
            `Probation exceeds the legal maximum of ${c.probatorioMax} days.`,
          ),
        });
      }
    }
    return [...w, ...commonWarnings(v, ctx)];
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const w = wk(v.trabalhadorGenero);
    const fin = finalidade(v);
    const evento = trim(v.eventoTermo) ? lc(trim(v.eventoTermo)) : eventoPadrao(v);

    const motivo: ClauseItem = {
      id: 'motivo',
      heading: 'Motivo justificativo',
      text: `O presente contrato é celebrado a prazo incerto, nos termos ${doCite('contratoPrazoIncerto')}, para ${fin.pt}, necessidade temporária da Entidade Empregadora cuja duração não é possível prever com certeza e que fundamenta a sua celebração.`,
      en: `This contract is for an uncertain term, for ${fin.en}, a temporary need of the Employer whose duration cannot be foreseen with certainty.`,
    };

    const duracaoLines = [
      `1. O presente contrato produz efeitos a partir de **${dateLong(v.trabalhadorDataAdmissao)}** e vigora enquanto se mantiver a necessidade temporária que o justifica, cessando com a verificação do seguinte facto: ${evento}.`,
    ];
    if (c.prevista) {
      duracaoLines.push(`2. As partes estimam que o contrato tenha a duração de ${qty(c.prevista, 'mês', 'meses')}, estimativa que não constitui termo certo.`);
    }
    duracaoLines.push(
      `${duracaoLines.length + 1}. Se o contrato ultrapassar ${qty(c.maxAnos, 'ano', 'anos')} de duração, converte-se em contrato de trabalho por tempo indeterminado, nos termos ${doCite('contratoPrazoIncerto')}.`,
    );
    const duracao: ClauseItem = {
      id: 'duracao',
      heading: 'Início e duração',
      text: duracaoLines.join('\n'),
      en: `The contract takes effect on ${v.trabalhadorDataAdmissao || '—'} and lasts while the temporary need lasts, ending upon: ${evento}.${
        c.prevista ? ` Expected length: ${c.prevista} months (not a fixed term).` : ''
      } Beyond ${c.maxAnos} years it becomes a permanent contract.`,
    };

    const caducidade: ClauseItem = {
      id: 'caducidade',
      heading: 'Caducidade',
      text: [
        `1. Verificado o facto que determina o termo do contrato, este caduca mediante comunicação escrita da Entidade Empregadora ${w.ao}, com a antecedência mínima de ${qty(c.aviso.ate3Anos, 'dia', 'dias')}, se o tempo de trabalho for superior a ${qty(c.aviso.minimoMeses, 'mês', 'meses')} e não exceder ${qty(Math.round(c.aviso.limiarMeses / 12), 'ano', 'anos')}, ou de ${qty(c.aviso.mais3Anos, 'dia', 'dias')}, se for superior a ${qty(Math.round(c.aviso.limiarMeses / 12), 'ano', 'anos')}, nos termos ${doCite('caducidadePrazoIncertoAviso')}. A falta de aviso prévio obriga a Entidade Empregadora a pagar ${w.ao} a remuneração correspondente ao período de aviso em falta.`,
        '2. A comunicação indica o facto que determina a caducidade e a data em que o contrato cessa.',
        `3. Se ${w.o} permanecer ao serviço depois de produzidos os efeitos da caducidade, o contrato considera-se celebrado por tempo indeterminado.`,
      ].join('\n'),
      en: `1. When the ending event occurs, the contract expires by written notice from the Employer: if the time worked exceeds ${c.aviso.minimoMeses} months, ${c.aviso.ate3Anos} days in advance, or ${c.aviso.mais3Anos} days if it exceeds ${Math.round(c.aviso.limiarMeses / 12)} years. Without notice, the Employer pays the missing notice period. 2. The notice states the event and the end date. 3. If the Employee keeps working after expiry, the contract becomes permanent.`,
    };

    const clauses: ClauseItem[] = [clObjecto(v, 'incerto'), motivo, clLocal(v), duracao];
    if (v.periodoProbatorio) {
      clauses.push({
        id: 'probatorio',
        heading: 'Período probatório',
        text: [
          `1. O presente contrato fica sujeito a um período probatório de ${qty(c.probatorioDias, 'dia', 'dias')}, contado a partir do início da prestação de trabalho${
            c.probatorioFim ? ` e com termo em ${dateLong(c.probatorioFim)}` : ''
          }, nos termos ${doCite('periodoProbatorioPrazo')}.`,
          `2. Durante o período probatório, qualquer das partes pode denunciar o contrato mediante aviso prévio escrito de ${qty(c.denunciaProbatorio, 'dia', 'dias')}, sem necessidade de invocação de justa causa e sem direito a indemnização, nos termos ${doCite('denunciaPeriodoProbatorio')}.`,
          `3. O período probatório conta para efeitos de antiguidade ${w.do}.`,
        ].join('\n'),
        en: `1. Probation of ${c.probatorioDias} days from the start of work. 2. During probation either party may end the contract with ${c.denunciaProbatorio} days’ written notice, without stating just cause and without compensation. 3. Probation counts towards seniority.`,
      });
    }
    clauses.push(
      clHorario(v, c),
      clRemuneracao(v),
      // The per-month leave rule is for fixed-term contracts only; uncertain terms follow the general rule.
      clFerias(v, ctx),
      clDeveresEmpregador(v),
      clDeveresTrabalhador(v),
    );
    if (v.sigilo) clauses.push(clSigilo(v));
    if (v.exclusividade) clauses.push(clExclusividade(v));
    clauses.push(caducidade, clCessacao(v, ctx, 'incerto'), clLegislacao(v), clLitigios(), clFinais());

    return [
      contratoTitle(v, 'Contrato de trabalho a prazo incerto'),
      ...partesBlocks(
        ctx,
        'É celebrado, de boa-fé, o presente contrato de trabalho a prazo incerto, que se rege pelas cláusulas seguintes:',
        'This uncertain-term employment contract is entered into in good faith and is governed by the following clauses:',
      ),
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fechoBlocks(ctx),
    ];
  },
});
