// Contrato de trabalho a tempo parcial. Reuses the employment-contract clause
// builders; adds the part-time clause (hours compared with full time) and the
// proportional pay and equal-treatment rules.

import { diffDays } from '@/lib/format';
import type { MinimumWage } from '@/legal/mz-legal';
import { defineTemplate, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, lineItems, money, workerSignature } from './_shared';
import {
  CONTRATO_SECTIONS, clCessacao, clDeveresEmpregador, clDeveresTrabalhador, clExclusividade, clFerias, clFinais, clLegislacao, clLitigios,
  clLocal, clObjecto, clRemuneracao, clSigilo, commonWarnings, contratoTitle, contratoWorkerFields, documentoFields, doCite, employerSig,
  funcoesFields, moneyExt, nExt, num, opcionaisFields, partesBlocks, qty, remuneracaoFields, startDateField, wk,
} from './_contrato-trabalho';
import { str } from './_pessoal-rh';

type Linha = { dias: string; inicio: string; fim: string };

function linhas(v: Values): Linha[] {
  return lineItems(v.distribuicao)
    .map((r) => ({ dias: str(r.dias), inicio: str(r.inicio), fim: str(r.fim) }))
    .filter((r) => r.dias || r.inicio);
}

export default defineTemplate({
  id: 'contrato-tempo-parcial',
  family: 'contrato',
  sections: [
    CONTRATO_SECTIONS.documento,
    CONTRATO_SECTIONS.trabalhador,
    CONTRATO_SECTIONS.funcoes,
    { id: 'duracao', title: l('Modalidade e duração', 'Type and term') },
    { id: 'tempo', title: l('Tempo de trabalho', 'Working time') },
    CONTRATO_SECTIONS.remuneracao,
    CONTRATO_SECTIONS.clausulas,
  ],
  fields: [
    ...documentoFields(),
    ...contratoWorkerFields(),
    ...funcoesFields(),
    {
      name: 'modalidade',
      type: 'radio',
      section: 'duracao',
      label: l('Modalidade', 'Type'),
      default: 'indeterminado',
      options: [
        { value: 'indeterminado', label: l('Por tempo indeterminado', 'Permanent') },
        { value: 'certo', label: l('A prazo certo', 'Fixed term') },
      ],
    },
    startDateField('duracao'),
    { name: 'dataFimContrato', type: 'date', section: 'duracao', width: 'half', label: l('Data de termo', 'End date'), showIf: (v) => v.modalidade === 'certo' },
    {
      name: 'motivoJustificativo',
      type: 'textarea',
      section: 'duracao',
      rows: 2,
      label: l('Motivo do prazo', 'Reason for the term'),
      showIf: (v) => v.modalidade === 'certo',
      legal: l('Nos contratos a prazo é obrigatório indicar o motivo, com os factos que o justificam.', 'Fixed-term contracts must state the reason and the facts behind it.'),
    },
    {
      name: 'horasSemanaTI',
      type: 'number',
      section: 'tempo',
      width: 'half',
      min: 1,
      max: 60,
      computedKey: 'horasSemanaTIDefault',
      label: l('Horas semanais a tempo inteiro na empresa', 'Full-time weekly hours in the company'),
      help: l('Período normal praticado pelos trabalhadores a tempo inteiro da mesma categoria. Por defeito, o máximo legal.', 'Normal hours of full-time staff in the same grade. Defaults to the legal maximum.'),
    },
    {
      name: 'horasSemanaParcial',
      type: 'number',
      section: 'tempo',
      width: 'half',
      min: 1,
      max: 60,
      required: true,
      label: l('Horas semanais a tempo parcial', 'Part-time weekly hours'),
      legal: l('O contrato tem de indicar o período normal de trabalho comparado com o tempo inteiro.', 'The contract must state the hours compared with full time.'),
    },
    {
      name: 'distribuicao',
      type: 'lines',
      section: 'tempo',
      label: l('Distribuição do horário', 'Schedule'),
      addLabel: l('Adicionar linha', 'Add row'),
      help: l('Dias e horas em que o trabalho é prestado. Ex.: «Segunda a quarta-feira», 08:00, 12:00.', 'Days and hours worked. E.g. "Monday to Wednesday", 08:00, 12:00.'),
      columns: [
        { name: 'dias', type: 'text', label: l('Dias', 'Days') },
        { name: 'inicio', type: 'text', label: l('Entrada', 'Start') },
        { name: 'fim', type: 'text', label: l('Saída', 'End') },
      ],
      default: [{ dias: 'Segunda-feira a sexta-feira', inicio: '08:00', fim: '12:00' }],
    },
    ...remuneracaoFields(),
    {
      name: 'salarioTI',
      type: 'money',
      section: 'remuneracao',
      width: 'half',
      label: l('Salário da categoria a tempo inteiro (opcional)', 'Full-time salary for the grade (optional)'),
      help: l('Para mostrar no contrato que o salário é proporcional.', 'To show in the contract that pay is proportional.'),
    },
    ...opcionaisFields(),
  ],

  computed: (v, ctx) => {
    const pnt = ctx.legal.value<{ horasDia: number; horasSemana: number }>('periodoNormalTrabalho');
    const ti = num(v.horasSemanaTI) ?? pnt.horasSemana;
    const parcial = num(v.horasSemanaParcial);
    const pct = parcial != null && ti > 0 ? Math.round((parcial / ti) * 1000) / 10 : null;
    return {
      horasSemanaTIDefault: pnt.horasSemana,
      horasTI: ti,
      horasParcial: parcial,
      pct,
      pctMax: ctx.legal.value<{ percentagemMax: number }>('tempoParcial').percentagemMax,
      linhas: linhas(v),
    };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [];
    if (c.pct != null && c.pct > c.pctMax) {
      w.push({
        level: 'error',
        field: 'horasSemanaParcial',
        message: l(
          `${c.horasParcial} horas correspondem a ${String(c.pct).replace('.', ',')} por cento do tempo inteiro. Acima de ${c.pctMax} por cento não é tempo parcial (${cite('tempoParcial')}), salvo outro limite fixado por instrumento de regulamentação colectiva.`,
          `${c.horasParcial} hours is ${c.pct}% of full time. Above ${c.pctMax}% it is not part-time, unless a collective agreement sets another limit.`,
        ),
      });
    }
    if (c.horasParcial == null) w.push({ level: 'warning', field: 'horasSemanaParcial', message: l('Indique as horas semanais.', 'Enter the weekly hours.') });
    if (!c.linhas.length) w.push({ level: 'info', field: 'distribuicao', message: l('Indique os dias e as horas de trabalho: devem ser fixados por acordo escrito.', 'Enter the working days and hours: they must be agreed in writing.') });
    if (v.modalidade === 'certo') {
      if (!str(v.motivoJustificativo)) {
        w.push({ level: 'warning', field: 'motivoJustificativo', message: l(`Indique o motivo do prazo (${cite('contratoTrabalhoForma')}). Sem motivo, o contrato considera-se por tempo indeterminado.`, 'State the reason for the term. Without it the contract is treated as permanent.') });
      }
      if (!v.dataFimContrato) w.push({ level: 'warning', field: 'dataFimContrato', message: l('Indique a data de termo.', 'Enter the end date.') });
      else if (v.trabalhadorDataAdmissao && diffDays(v.trabalhadorDataAdmissao, v.dataFimContrato) <= 0) {
        w.push({ level: 'error', field: 'dataFimContrato', message: l('A data de termo é anterior à data de início.', 'The end date is before the start date.') });
      }
      w.push({ level: 'info', field: 'modalidade', message: l(`Os limites de duração e renovação dos contratos a prazo certo aplicam-se (${cite('contratoPrazoCerto')}).`, 'Fixed-term duration and renewal limits apply.') });
    }
    // Minimum wage check, proportional to the hours worked.
    const base = commonWarnings(v, ctx).filter((x) => !(x.field === 'trabalhadorSalario' && x.level === 'error') && x.field !== 'horasDia' && x.field !== 'horasSemana');
    const salario = money(v.trabalhadorSalario);
    if (salario != null && v.sector && c.horasParcial != null && c.horasTI > 0) {
      const wage = (ctx.legal.table('salarioMinimo') as MinimumWage[]).find((m) => m.sector === v.sector);
      const minimo = wage ? Math.round(((wage.value * c.horasParcial) / c.horasTI) * 100) / 100 : null;
      if (minimo != null && salario < minimo) {
        w.push({
          level: 'error',
          field: 'trabalhadorSalario',
          message: l(
            `O salário é inferior ao salário mínimo do sector proporcional às horas contratadas (${formatMoney(minimo)}).`,
            `The salary is below the sector minimum wage pro rata to the hours (${formatMoney(minimo)}).`,
          ),
        });
      }
    }
    return [...w, ...base];
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const w = wk(v.trabalhadorGenero);
    const certo = v.modalidade === 'certo';
    const modalidade = certo ? 'certo' : 'indeterminado';

    const duracao: ClauseItem | null = certo
      ? {
          id: 'duracao',
          heading: 'Duração',
          text: [
            `1. O presente contrato é celebrado a prazo certo, com início em **${dateLong(v.trabalhadorDataAdmissao)}** e termo em **${dateLong(v.dataFimContrato)}**.`,
            `2. O prazo justifica-se pelo seguinte motivo: ${str(v.motivoJustificativo).replace(/\.$/, '') || BLANK}.`,
            `3. A renovação e a caducidade do contrato regem-se ${doCite('contratoPrazoCerto')}.`,
          ].join('\n'),
          en: `Fixed-term contract from ${v.trabalhadorDataAdmissao || '—'} to ${v.dataFimContrato || '—'}, for the reason stated. Renewal and expiry follow the Labour Law.`,
        }
      : null;

    const pctTxt = c.pct != null ? `${nExt(Math.round(c.pct))} por cento` : `${BLANK} por cento`;
    const horario = (c.linhas as Linha[]).map((r) => `${r.dias || BLANK}: das ${r.inicio || '__:__'} às ${r.fim || '__:__'}`);
    const tempo: ClauseItem = {
      id: 'tempoParcial',
      heading: 'Tempo parcial',
      text: [
        `1. ${w.O} obriga-se a prestar trabalho a tempo parcial, com um período normal de trabalho de ${c.horasParcial != null ? qty(c.horasParcial, 'hora', 'horas', true) : `${BLANK} horas`} semanais, correspondente a ${pctTxt} do período normal de trabalho praticado a tempo inteiro na Entidade Empregadora, que é de ${qty(c.horasTI, 'hora', 'horas', true)} semanais, nos termos ${doCite('tempoParcial')}.`,
        `2. O trabalho é prestado nos dias e horas seguintes${horario.length ? ':' : ` ${BLANK}.`}`,
      ].join('\n'),
      items: horario.length ? horario.map((h, i) => `${h}${i === horario.length - 1 ? '.' : ';'}`) : undefined,
      en: `The Employee works part time: ${c.horasParcial ?? '—'} hours a week, ${c.pct ?? '—'}% of the full-time ${c.horasTI} hours, on the days and times listed.`,
    };
    const extra: ClauseItem = {
      id: 'tempoParcialAlteracao',
      heading: 'Alteração do tempo de trabalho',
      text: `1. A alteração do número de horas ou da sua distribuição depende de acordo escrito entre as partes.\n2. ${w.O} não pode ter tratamento menos favorável do que um trabalhador a tempo inteiro em situação comparável, gozando dos mesmos direitos e regalias, na proporção do tempo de trabalho quando a natureza do direito o exija.`,
      en: '1. Changes to the hours or schedule require written agreement. 2. The Employee may not be treated less favourably than a comparable full-time employee and has the same rights, pro rata where appropriate.',
    };
    const rem = clRemuneracao(v);
    if (money(v.salarioTI) != null) {
      const prop = ` Esta remuneração é proporcional ao tempo de trabalho contratado, tendo por referência a remuneração de ${moneyExt(v.salarioTI)} da mesma categoria a tempo inteiro.`;
      rem.text = rem.text.replace(/^(1\. [^\n]*)/, (m) => `${m}${prop}`);
    }
    const clauses: ClauseItem[] = [clObjecto(v, modalidade), clLocal(v), ...(duracao ? [duracao] : []), tempo, extra, rem, clFerias(v, ctx), clDeveresEmpregador(v), clDeveresTrabalhador(v)];
    if (v.sigilo) clauses.push(clSigilo(v));
    if (v.exclusividade) clauses.push(clExclusividade(v));
    clauses.push(clCessacao(v, ctx, modalidade), clLegislacao(v), clLitigios(), clFinais());

    return [
      contratoTitle(v, 'Contrato de trabalho a tempo parcial'),
      ...partesBlocks(
        ctx,
        `É celebrado, de boa-fé, o presente contrato de trabalho a tempo parcial${certo ? ', a prazo certo' : `, por tempo indeterminado, com início em **${dateLong(v.trabalhadorDataAdmissao)}**`}, que se rege pelas cláusulas seguintes:`,
        'This part-time employment contract is entered into in good faith and is governed by the following clauses:',
      ),
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      {
        type: 'paragraph',
        id: 'exemplares',
        text: `Feito em ${ctx.place}, aos ${dateLong(v.data)}, em dois exemplares de igual valor, ficando um em poder de cada uma das partes.`,
        en: 'Made in two counterparts of equal value, one for each party.',
        keepWithNext: true,
      },
      { type: 'signatures', columns: [employerSig(ctx), workerSignature(v)] },
    ];
  },
});

