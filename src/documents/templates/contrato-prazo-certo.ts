// Contrato de trabalho a prazo certo. Shares its clause builders with
// contrato-indeterminado.ts.

import { legalEntry } from '@/legal/mz-legal';
import { addDays, addMonths, diffDays } from '@/lib/format';
import { defineTemplate, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, l, splitLines } from './_shared';
import {
  clCessacao, clDeveresEmpregador, clDeveresTrabalhador, clExclusividade, clFerias, clFinais, clHorario, clLegislacao,
  clLitigios, clLocal, clObjecto, clRemuneracao, clSigilo, commonWarnings, CONTRATO_SECTIONS, contratoTitle,
  contratoWorkerFields, doCite, noCite, documentoFields, enumerate, fechoBlocks, funcoesFields, horarioFields, horasComputed, lc,
  num, opcionaisFields, partesBlocks, qty, remuneracaoFields, startDateField, wk,
} from './_contrato-trabalho';

type PrazoCerto = { duracaoMaxAnos: number; renovacoesMax: number; pmeAnosLivre: number };
type ProbPrazo = { maisDe1Ano: number; de6MesesA1Ano: number; ate6Meses: number };

/** Used in a field label only; documents read the value through ctx.legal. */
const PME_ANOS = (legalEntry('contratoPrazoCerto').value as PrazoCerto).pmeAnosLivre;

/** True when the contract (start → end, or months) lasts at least `months`. */
function atLeast(v: Values, inicio: string | undefined, fim: string | null, months: number): boolean {
  if (inicio && fim) return diffDays(addDays(addMonths(inicio, months), -1), fim) >= 0;
  const m = num(v.duracaoMeses);
  return m != null && m >= months;
}

/** True when the contract (start → end, or months) lasts longer than `months`. */
function longerThan(v: Values, inicio: string | undefined, fim: string | null, months: number): boolean {
  if (inicio && fim) return diffDays(addDays(addMonths(inicio, months), -1), fim) > 0;
  const m = num(v.duracaoMeses);
  return m != null && m > months;
}

export default defineTemplate({
  id: 'contrato-prazo-certo',
  family: 'contrato',
  sections: [
    CONTRATO_SECTIONS.documento,
    CONTRATO_SECTIONS.trabalhador,
    CONTRATO_SECTIONS.funcoes,
    { id: 'prazo', title: l('Motivo e duração', 'Reason and term') },
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
      name: 'motivoJustificativo',
      type: 'textarea',
      section: 'prazo',
      rows: 3,
      required: true,
      label: l('Motivo justificativo (necessidade temporária)', 'Reason (temporary need)'),
      legal: l(
        `Só se admite o contrato a prazo certo para necessidades temporárias. Indique os factos concretos que justificam o prazo e a sua relação com a duração escolhida (${cite('contratoTrabalhoForma')}); sem motivo, o contrato considera-se por tempo indeterminado.`,
        'Fixed-term contracts are only allowed for temporary needs. State the specific facts that justify the term and how they relate to the length chosen; without a reason the contract is treated as permanent.',
      ),
      help: l(
        'Exemplos de necessidades temporárias: substituição de trabalhador ausente; aumento excepcional da produção; actividade sazonal; obra ou projecto determinado; actividades não permanentes.',
        'Examples of temporary needs: replacing an absent employee; an exceptional increase in output; seasonal work; a specific works or project; non-permanent activities.',
      ),
      placeholder: l(
        'Ex.: acréscimo temporário de actividade resultante do contrato de fornecimento celebrado com o cliente X, com execução prevista até Junho de 2027',
        'E.g. temporary increase in work due to the supply contract with client X, due to run until June 2027',
      ),
    },
    {
      name: 'pmeIsencao',
      type: 'toggle',
      section: 'prazo',
      default: false,
      label: l(
        `Micro, pequena ou média empresa nos primeiros ${PME_ANOS} anos de actividade`,
        `Micro, small or medium company in its first ${PME_ANOS} years of activity`,
      ),
      help: l(
        'Estas empresas podem celebrar contratos a prazo certo sem invocar uma necessidade temporária.',
        'These companies may use fixed-term contracts without stating a temporary need.',
      ),
    },
    startDateField('prazo'),
    {
      name: 'duracaoMeses',
      type: 'number',
      section: 'prazo',
      width: 'half',
      min: 1,
      max: 120,
      required: true,
      label: l('Duração (meses)', 'Term (months)'),
    },
    {
      name: 'dataFimContrato',
      type: 'date',
      section: 'prazo',
      width: 'half',
      label: l('Data de termo (opcional)', 'End date (optional)'),
      help: l('Se ficar vazia, é calculada a partir da data de início e da duração.', 'If left empty, it is computed from the start date and the term.'),
    },
    {
      name: 'renovacao',
      type: 'toggle',
      section: 'prazo',
      default: true,
      label: l('O contrato pode ser renovado', 'The contract may be renewed'),
      help: l('Se desligar, o contrato termina na data de termo.', 'If off, the contract ends on the end date.'),
    },
    {
      name: 'periodoProbatorio',
      type: 'toggle',
      section: 'probatorio',
      default: true,
      label: l('Incluir período probatório', 'Include a probation period'),
      help: l(
        'A duração máxima depende da duração do contrato. Só existe se constar do contrato escrito.',
        'The maximum depends on the contract term. It only applies if written into the contract.',
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
      help: l('Por defeito, o máximo legal para a duração do contrato.', 'Defaults to the legal maximum for the contract term.'),
    },
    ...horarioFields(),
    ...remuneracaoFields(),
    ...opcionaisFields(),
  ],

  computed: (v, ctx) => {
    const inicio = (v.trabalhadorDataAdmissao as string) || undefined;
    const meses = num(v.duracaoMeses);
    const fimCalc = inicio && meses && meses > 0 ? addDays(addMonths(inicio, meses), -1) : null;
    const fim: string | null = (v.dataFimContrato as string) || fimCalc;
    const prazo = ctx.legal.value<PrazoCerto>('contratoPrazoCerto');
    const pp = ctx.legal.value<ProbPrazo>('periodoProbatorioPrazo');
    const pd = ctx.legal.value<{ geral: number; probatorio15Dias: number }>('denunciaPeriodoProbatorio');
    const nr = ctx.legal.value<{ ate1Ano: number; mais1Ano: number; minimoMeses: number }>('naoRenovacaoAviso');
    const mais1Ano = longerThan(v, inicio, fim, 12);
    const mais6Meses = longerThan(v, inicio, fim, 6);
    const probatorioMax = mais1Ano ? pp.maisDe1Ano : mais6Meses ? pp.de6MesesA1Ano : pp.ate6Meses;
    const probatorioDias = num(v.probatorioDias) ?? probatorioMax;
    return {
      ...horasComputed(v, ctx),
      inicio,
      meses,
      fimCalc,
      fim,
      conhecida: Boolean(fim || meses),
      mais1Ano,
      // Leave of 1 day per month: fixed-term contracts shorter than one year
      menos1Ano: Boolean(fim || meses) && !atLeast(v, inicio, fim, 12),
      prazo,
      excedeMax: longerThan(v, inicio, fim, prazo.duracaoMaxAnos * 12),
      probatorioMax,
      probatorioDias,
      probatorioFim: inicio && probatorioDias > 0 ? addDays(inicio, probatorioDias - 1) : null,
      denunciaProbatorio: probatorioMax === pp.ate6Meses ? pd.probatorio15Dias : pd.geral,
      avisoNaoRenovacao: mais1Ano ? nr.mais1Ano : nr.ate1Ano,
      // Notice of non-renewal only applies to contracts of 3 months or more (or of unknown length).
      avisoAplica: !(fim || meses) || atLeast(v, inicio, fim, nr.minimoMeses),
    };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [];
    const motivo = String(v.motivoJustificativo ?? '').trim();
    if (!motivo && !v.pmeIsencao) {
      w.push({
        level: 'error',
        field: 'motivoJustificativo',
        message: l(
          `O contrato a prazo certo só é admitido para necessidades temporárias (${cite('contratoPrazoCerto')}). Indique o motivo justificativo; sem ele, o contrato pode ser considerado por tempo indeterminado.`,
          'Fixed-term contracts are only allowed for temporary needs. State the reason; without it the contract may be treated as permanent.',
        ),
      });
    } else if (motivo && motivo.length < 40) {
      w.push({
        level: 'warning',
        field: 'motivoJustificativo',
        message: l(
          'O motivo parece genérico. Descreva a necessidade temporária concreta (que trabalho, porquê e até quando).',
          'The reason looks vague. Describe the specific temporary need (what work, why and until when).',
        ),
      });
    }
    if (v.pmeIsencao) {
      w.push({
        level: 'info',
        field: 'pmeIsencao',
        message: l(
          `Confirme que a empresa é micro, pequena ou média e que não ultrapassou os primeiros ${c.prazo.pmeAnosLivre} anos de actividade.`,
          `Confirm the company is a micro, small or medium firm within its first ${c.prazo.pmeAnosLivre} years.`,
        ),
      });
    }
    if (!c.conhecida) {
      w.push({ level: 'warning', field: 'duracaoMeses', message: l('Indique a duração do contrato ou a data de termo.', 'Enter the contract term or the end date.') });
    }
    if (c.inicio && v.dataFimContrato && diffDays(c.inicio, v.dataFimContrato) < 0) {
      w.push({ level: 'error', field: 'dataFimContrato', message: l('A data de termo é anterior à data de início.', 'The end date is before the start date.') });
    } else if (v.dataFimContrato && c.fimCalc && v.dataFimContrato !== c.fimCalc) {
      w.push({
        level: 'info',
        field: 'dataFimContrato',
        message: l(
          `A data de termo indicada não coincide com a duração (${dateLong(c.fimCalc)}). O contrato indicará apenas as datas de início e de termo.`,
          `The end date does not match the term (${c.fimCalc}). The contract will state only the start and end dates.`,
        ),
      });
    }
    if (c.excedeMax) {
      w.push({
        level: 'warning',
        field: 'duracaoMeses',
        message: l(
          `A duração excede ${c.prazo.duracaoMaxAnos} anos, o limite do contrato a prazo certo (${cite('contratoPrazoCerto')}). Ultrapassado o limite, o contrato converte-se em contrato por tempo indeterminado. A lei pode ler-se como limite por período ou no total: confirme com um jurista.`,
          `The term exceeds ${c.prazo.duracaoMaxAnos} years, the fixed-term limit; beyond it the contract becomes permanent. The limit may be per term or in total: confirm with a lawyer.`,
        ),
      });
    } else if (v.renovacao && c.meses && c.meses * (1 + c.prazo.renovacoesMax) > c.prazo.duracaoMaxAnos * 12) {
      w.push({
        level: 'info',
        field: 'renovacao',
        message: l(
          `Com ${c.prazo.renovacoesMax} renovações por igual período, a duração total excederia ${c.prazo.duracaoMaxAnos} anos. Confirme com um jurista se o limite se aplica a cada período ou ao total antes de renovar.`,
          `With ${c.prazo.renovacoesMax} renewals of the same length the total would exceed ${c.prazo.duracaoMaxAnos} years. Confirm with a lawyer whether the limit is per term or in total before renewing.`,
        ),
      });
    }
    if (v.periodoProbatorio && c.probatorioDias > c.probatorioMax) {
      w.push({
        level: 'error',
        field: 'probatorioDias',
        message: l(
          `O período probatório excede o máximo legal de ${c.probatorioMax} dias para um contrato com esta duração (${cite('periodoProbatorioPrazo')}).`,
          `Probation exceeds the legal maximum of ${c.probatorioMax} days for a contract of this length.`,
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

    // Motivo justificativo
    const motivos = splitLines(v.motivoJustificativo);
    const base = `O presente contrato é celebrado a prazo certo, nos termos ${doCite('contratoPrazoCerto')}`;
    let motivoText: string;
    let motivoItems: string[] | undefined;
    if (motivos.length === 1) {
      motivoText = `${base}, para satisfação da seguinte necessidade temporária da Entidade Empregadora: ${lc(motivos[0].replace(/\.$/, ''))}.`;
    } else if (motivos.length > 1) {
      motivoText = `${base}, pelo período previsível de duração da seguinte necessidade temporária da Entidade Empregadora:`;
      motivoItems = enumerate(motivos);
    } else if (v.pmeIsencao) {
      motivoText = `${base}, ao abrigo do regime aplicável às micro, pequenas e médias empresas nos primeiros ${c.prazo.pmeAnosLivre} anos de actividade.`;
    } else {
      motivoText = `${base}, para satisfação da seguinte necessidade temporária da Entidade Empregadora: ${BLANK}.`;
    }
    if (motivos.length && !motivoItems) {
      motivoText += '\nO prazo estipulado corresponde ao período previsível de duração dessa necessidade temporária.';
    }
    if (motivos.length && v.pmeIsencao && !motivoItems) {
      motivoText += `\nA Entidade Empregadora declara, ainda, ser micro, pequena ou média empresa nos primeiros ${c.prazo.pmeAnosLivre} anos de actividade.`;
    }
    const motivo: ClauseItem = {
      id: 'motivo',
      heading: 'Motivo justificativo',
      text: motivoText,
      items: motivoItems,
      en: motivos.length
        ? `This fixed-term contract meets the Employer’s temporary need, namely: ${motivos.join('; ')}. The term matches the expected length of that need.`
        : v.pmeIsencao
          ? `This fixed-term contract is made under the regime for micro, small and medium companies in their first ${c.prazo.pmeAnosLivre} years.`
          : 'This fixed-term contract meets a temporary need of the Employer (to be stated).',
    };

    // Duração
    const showMeses = c.meses && (!v.dataFimContrato || v.dataFimContrato === c.fimCalc);
    const duracaoText = showMeses
      ? `O presente contrato tem a duração de ${qty(c.meses, 'mês', 'meses')}, com início em **${dateLong(c.inicio)}** e termo em **${dateLong(c.fim)}**.`
      : v.dataFimContrato
        ? `O presente contrato vigora pelo período compreendido entre **${dateLong(c.inicio)}** e **${dateLong(c.fim)}**.`
        : `O presente contrato tem a duração de ________ meses, com início em **${dateLong(c.inicio)}** e termo em ${dateLong(c.fim)}.`;
    const duracao: ClauseItem = {
      id: 'duracao',
      heading: 'Duração',
      text: duracaoText,
      en: `The contract runs from ${c.inicio || '—'} to ${c.fim || '—'}${showMeses ? ` (${c.meses} months)` : ''}.`,
    };

    // Renovação e caducidade (arts. 43 and 44: renews for an equal period unless notice is given)
    const avisoTxt = c.avisoAplica
      ? `com a antecedência mínima de ${qty(c.avisoNaoRenovacao, 'dia', 'dias')} relativamente ao seu termo, nos termos ${doCite('naoRenovacaoAviso')}`
      : 'antes do seu termo';
    const renov = v.renovacao
      ? `1. O presente contrato renova-se no seu termo por período igual ao inicial, até ao limite de ${qty(c.prazo.renovacoesMax, 'renovação', 'renovações', true)}, salvo se qualquer das partes comunicar à outra a vontade de o não renovar, nos termos do número seguinte.`
      : '1. As partes acordam que o presente contrato não é renovado, caducando no termo do prazo estipulado.';
    const aviso = v.renovacao
      ? `2. A parte que não pretenda renovar o contrato deve comunicá-lo à outra, por escrito, ${avisoTxt}.${c.avisoAplica ? ' A falta de comunicação obriga a parte faltosa a pagar à outra uma indemnização correspondente à remuneração do período de aviso prévio em falta.' : ''}`
      : `2. A Entidade Empregadora confirma ${w.ao}, por escrito, a cessação do contrato ${avisoTxt}.${c.avisoAplica ? ' A falta de comunicação obriga ao pagamento de uma indemnização correspondente à remuneração do período de aviso prévio em falta.' : ''}`;
    const renovacao: ClauseItem = {
      id: 'renovacao',
      heading: v.renovacao ? 'Renovação e caducidade' : 'Caducidade',
      text: [
        renov,
        aviso,
        '3. A caducidade do contrato no seu termo não confere a qualquer das partes direito a compensação.',
        v.renovacao
          ? `4. O contrato converte-se em contrato de trabalho por tempo indeterminado se forem excedidos os limites de duração ou de renovação previstos ${noCite('contratoPrazoCerto')}.`
          : `4. Se ${w.o} continuar ao serviço após o termo do contrato, este converte-se em contrato de trabalho por tempo indeterminado, nos termos ${doCite('contratoPrazoCerto')}.`,
      ].join('\n'),
      en: `1. ${
        v.renovacao
          ? `The contract renews at the end of the term for an equal period, up to ${c.prazo.renovacoesMax} times, unless either party gives notice of non-renewal.`
          : 'The contract will not be renewed and expires at the end of the term.'
      } 2. ${c.avisoAplica ? `${c.avisoNaoRenovacao} days’ written notice is required before the end date; without notice, compensation equal to the pay for the missing notice period is due.` : 'Written notice is given before the end date.'} 3. Expiry gives no right to compensation. 4. ${
        v.renovacao ? 'Exceeding the legal limits on length or renewals converts the contract into a permanent one.' : 'If the Employee keeps working after the end date, the contract becomes permanent.'
      }`,
    };

    const clauses: ClauseItem[] = [clObjecto(v, 'certo'), motivo, clLocal(v), duracao, renovacao];
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
        en: `1. Probation of ${c.probatorioDias} days from the start of work${c.probatorioFim ? `, ending on ${c.probatorioFim}` : ''}. 2. During probation either party may end the contract with ${c.denunciaProbatorio} days’ written notice, without stating just cause and without compensation. 3. Probation counts towards seniority.`,
      });
    }
    clauses.push(
      clHorario(v, c),
      clRemuneracao(v),
      clFerias(v, ctx, c.menos1Ano),
      clDeveresEmpregador(v),
      clDeveresTrabalhador(v),
    );
    if (v.sigilo) clauses.push(clSigilo(v));
    if (v.exclusividade) clauses.push(clExclusividade(v));
    clauses.push(clCessacao(v, ctx, 'certo'), clLegislacao(v), clLitigios(), clFinais());

    return [
      contratoTitle(v, 'Contrato de trabalho a prazo certo'),
      ...partesBlocks(
        ctx,
        'É celebrado, de boa-fé, o presente contrato de trabalho a prazo certo, que se rege pelas cláusulas seguintes:',
        'This fixed-term employment contract is entered into in good faith and is governed by the following clauses:',
      ),
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fechoBlocks(ctx),
    ];
  },
});

