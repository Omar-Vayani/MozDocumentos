// Mapa de horário de trabalho: the working schedule of each department, set
// by the employer after consulting the union body, stamped by the labour
// administration and posted in a visible place. New schedules are also
// reported to the Ministry of Labour (deadline from the legal file).

import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerName, employerSignature, l, lineItems, localField, refField } from './_shared';
import { addressLine } from '../layouts/address';
import { doCite, num } from './_contrato-trabalho';
import { str } from './_pessoal-rh';

type Linha = {
  sector: string;
  dias: string;
  nDias: number | null;
  entrada: string;
  intIni: string;
  intFim: string;
  saida: string;
  descanso: string;
  horasDia: number | null;
  horasSemana: number | null;
  intervalo: number | null;
};

/** "07:30" / "7h30" / "7.30" → minutes after midnight. */
function minutos(s: string): number | null {
  const m = /^(\d{1,2})\s*[:h.]\s*(\d{2})?$/i.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2] ?? 0);
  if (h > 24 || mi > 59) return null;
  return h * 60 + mi;
}

const fmtH = (n: number | null) => (n == null ? '—' : `${String(Math.round(n * 100) / 100).replace('.', ',')}`);

function linhas(v: Values): Linha[] {
  const continuo = v.regime === 'continuo';
  return lineItems(v.horarios)
    .map((r) => {
      const e = minutos(str(r.entrada));
      const s = minutos(str(r.saida));
      const ii = minutos(str(r.intIni));
      const fi = minutos(str(r.intFim));
      const intervalo = ii != null && fi != null && fi > ii ? fi - ii : null;
      let total = e != null && s != null ? (s > e ? s - e : s + 24 * 60 - e) : null;
      if (total != null && intervalo != null && !continuo) total -= intervalo;
      const horasDia = total != null ? total / 60 : null;
      const nDias = num(r.nDias);
      return {
        sector: str(r.sector),
        dias: str(r.dias),
        nDias,
        entrada: str(r.entrada),
        intIni: str(r.intIni),
        intFim: str(r.intFim),
        saida: str(r.saida),
        descanso: str(r.descanso),
        horasDia,
        horasSemana: horasDia != null && nDias != null ? horasDia * nDias : null,
        intervalo,
      };
    })
    .filter((r) => r.sector || r.entrada);
}

const REGIMES: Record<string, string> = {
  normal: 'Horário normal, com intervalo de descanso',
  continuo: 'Horário contínuo',
  unico: 'Horário único',
  turnos: 'Regime de turnos',
};

export default defineTemplate({
  id: 'mapa-horario-trabalho',
  family: 'mapa',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'estabelecimento', title: l('Estabelecimento', 'Workplace') },
    { id: 'horarios', title: l('Horários', 'Schedules') },
    { id: 'isentos', title: l('Isenção de horário', 'Exempt staff') },
    { id: 'consulta', title: l('Consulta e vigência', 'Consultation and start') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    { name: 'estabelecimento', type: 'text', section: 'estabelecimento', label: l('Estabelecimento / local de trabalho', 'Workplace'), default: (c) => (c.profile ? addressLine(c.profile) : '') },
    { name: 'actividade', type: 'text', section: 'estabelecimento', width: 'half', label: l('Actividade', 'Business activity'), placeholder: l('Ex.: construção civil', 'E.g. construction') },
    { name: 'numeroTrabalhadores', type: 'number', section: 'estabelecimento', width: 'half', min: 1, label: l('N.º de trabalhadores', 'Number of employees') },
    {
      name: 'regime',
      type: 'select',
      section: 'horarios',
      width: 'half',
      label: l('Regime', 'Regime'),
      default: 'normal',
      options: [
        { value: 'normal', label: l('Normal, com intervalo', 'Normal, with a break') },
        { value: 'continuo', label: l('Contínuo (intervalo conta como trabalho)', 'Continuous (break counts as work)') },
        { value: 'unico', label: l('Horário único', 'Single shift') },
        { value: 'turnos', label: l('Turnos', 'Shifts') },
      ],
    },
    {
      name: 'industria',
      type: 'toggle',
      section: 'horarios',
      default: false,
      label: l('Estabelecimento industrial com semana de cinco dias', 'Industrial site with a five-day week'),
      help: l('A indústria (salvo turnos) pode adoptar um limite semanal mais baixo em cinco dias.', 'Industry (except shifts) may adopt a lower weekly limit over five days.'),
    },
    {
      name: 'horarios',
      type: 'lines',
      section: 'horarios',
      required: true,
      label: l('Horário por sector', 'Schedule per department'),
      addLabel: l('Adicionar sector', 'Add department'),
      help: l('Horas no formato 07:30. «N.º de dias» é o número de dias de trabalho por semana.', 'Times as 07:30. "No. of days" is working days per week.'),
      columns: [
        { name: 'sector', type: 'text', label: l('Sector / categoria', 'Department / grade') },
        { name: 'dias', type: 'text', label: l('Dias', 'Days'), placeholder: l('Segunda a sexta-feira', 'Monday to Friday') },
        { name: 'nDias', type: 'number', label: l('N.º de dias', 'No. of days') },
        { name: 'entrada', type: 'text', label: l('Entrada', 'Start') },
        { name: 'intIni', type: 'text', label: l('Intervalo — início', 'Break — start') },
        { name: 'intFim', type: 'text', label: l('Intervalo — fim', 'Break — end') },
        { name: 'saida', type: 'text', label: l('Saída', 'End') },
        { name: 'descanso', type: 'text', label: l('Descanso semanal', 'Weekly rest day') },
      ],
      default: [{ sector: 'Administração', dias: 'Segunda a sexta-feira', nDias: 5, entrada: '07:30', intIni: '12:00', intFim: '13:00', saida: '16:30', descanso: 'Sábado e domingo' }],
    },
    {
      name: 'isentos',
      type: 'lines',
      section: 'isentos',
      label: l('Trabalhadores isentos de horário', 'Staff exempt from fixed hours'),
      addLabel: l('Adicionar', 'Add'),
      help: l('Só cargos de direcção, chefia, confiança ou fiscalização, ou funções que o justifiquem.', 'Only management, trust or inspection roles, or roles that justify it.'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'cargo', type: 'text', label: l('Cargo', 'Position') },
      ],
      default: [],
    },
    {
      name: 'consultaSindical',
      type: 'radio',
      section: 'consulta',
      label: l('Órgão sindical', 'Union body'),
      default: 'consultado',
      options: [
        { value: 'consultado', label: l('Foi consultado', 'Was consulted') },
        { value: 'naoExiste', label: l('Não existe na empresa', 'There is none') },
      ],
      legal: l('O horário é fixado depois de consultar o órgão sindical.', 'The schedule is set after consulting the union body.'),
    },
    { name: 'consultaData', type: 'date', section: 'consulta', width: 'half', label: l('Data da consulta', 'Date of consultation'), showIf: (v) => v.consultaSindical === 'consultado' },
    { name: 'inicioVigencia', type: 'date', section: 'consulta', width: 'half', required: true, label: l('Em vigor a partir de', 'In force from'), default: (c) => c.today },
  ],

  computed: (v, ctx) => {
    const pnt = ctx.legal.value<{ horasDia: number; horasSemana: number }>('periodoNormalTrabalho');
    const esp = ctx.legal.value<{ horasDiaAlargado: number; horasSemanaIndustria: number }>('limitesHorarioEspeciais');
    const intv = ctx.legal.value<{ minMinutos: number; maxMinutos: number }>('intervaloDescanso');
    return { lista: linhas(v), pnt, esp, intv, comunicacaoDia: ctx.legal.value<{ diaLimite: number }>('horarioComunicacao').diaLimite };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `Depois de fixado, o mapa é visado pela administração do trabalho e afixado em lugar bem visível (${cite('horarioTrabalho')}). Os novos horários são comunicados ao Ministério do Trabalho até ao dia ${c.comunicacaoDia} do mês seguinte ao da adopção (${cite('horarioComunicacao')}).`,
          `Once set, the schedule is stamped by the labour administration and posted visibly. New schedules are reported to the Ministry of Labour by day ${c.comunicacaoDia} of the following month.`,
        ),
      },
    ];
    const semMax = v.industria && v.regime !== 'turnos' ? c.esp.horasSemanaIndustria : c.pnt.horasSemana;
    for (const r of c.lista as Linha[]) {
      const nome = r.sector || 'Um sector';
      if (r.horasDia == null) {
        w.push({ level: 'warning', field: 'horarios', message: l(`${nome}: indique a entrada e a saída no formato 07:30.`, `${nome}: enter start and end as 07:30.`) });
        continue;
      }
      if (r.horasDia > c.esp.horasDiaAlargado) {
        w.push({ level: 'error', field: 'horarios', message: l(`${nome}: ${fmtH(r.horasDia)} horas por dia excede o máximo legal (${cite('periodoNormalTrabalho')}).`, `${nome}: ${fmtH(r.horasDia)} hours a day exceeds the legal maximum.`) });
      } else if (r.horasDia > c.pnt.horasDia) {
        w.push({
          level: 'warning',
          field: 'horarios',
          message: l(`${nome}: mais de ${c.pnt.horasDia} horas por dia só é permitido (até ${c.esp.horasDiaAlargado}) com meio dia de descanso complementar por semana (${cite('limitesHorarioEspeciais')}).`, `${nome}: more than ${c.pnt.horasDia} hours a day is only allowed (up to ${c.esp.horasDiaAlargado}) with an extra half day off each week.`),
        });
      }
      if (r.horasSemana != null && r.horasSemana > semMax) {
        w.push({ level: 'error', field: 'horarios', message: l(`${nome}: ${fmtH(r.horasSemana)} horas por semana excede o máximo de ${semMax}.`, `${nome}: ${fmtH(r.horasSemana)} hours a week exceeds ${semMax}.`) });
      }
      if (v.regime !== 'turnos') {
        if (r.intervalo == null) {
          w.push({ level: 'warning', field: 'horarios', message: l(`${nome}: indique o intervalo de descanso (${cite('intervaloDescanso')}).`, `${nome}: enter the rest break.`) });
        } else if (r.intervalo < c.intv.minMinutos || (v.regime !== 'continuo' && r.intervalo > c.intv.maxMinutos)) {
          w.push({ level: 'warning', field: 'horarios', message: l(`${nome}: o intervalo deve ter entre ${c.intv.minMinutos} e ${c.intv.maxMinutos} minutos (${cite('intervaloDescanso')}).`, `${nome}: the break must be ${c.intv.minMinutos} to ${c.intv.maxMinutos} minutes.`) });
        }
      }
      if (!r.descanso) w.push({ level: 'error', field: 'horarios', message: l(`${nome}: indique o dia de descanso semanal (${cite('descansoSemanal')}).`, `${nome}: enter the weekly rest day.`) });
    }
    if (!c.lista.length) w.push({ level: 'error', field: 'horarios', message: l('Indique pelo menos um horário.', 'Enter at least one schedule.') });
    return w;
  },

  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const lista = c.lista as Linha[];
    const isentos = lineItems(v.isentos).filter((r) => str(r.nome));
    const intervalo = (r: Linha) => (r.intIni && r.intFim ? `${r.intIni}–${r.intFim}` : '—');

    const blocks: Block[] = [
      { type: 'title', text: 'Mapa de Horário de Trabalho', subtitle: v.ref ? `N.º ${v.ref}` : undefined },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          // The letterhead already shows the employer and NUIT.
          ...(ctx.profile ? [] : [{ label: 'Entidade empregadora', value: employerName(ctx) }, { label: 'NUIT', value: BLANK }]),
          { label: 'Estabelecimento', value: str(v.estabelecimento) || BLANK },
          { label: 'Actividade', value: str(v.actividade) || BLANK },
          { label: 'N.º de trabalhadores', value: num(v.numeroTrabalhadores) != null ? String(num(v.numeroTrabalhadores)) : BLANK },
          { label: 'Em vigor a partir de', value: dateLong(v.inicioVigencia) },
        ],
      },
      {
        type: 'table',
        caption: REGIMES[v.regime] ?? REGIMES.normal,
        columns: [
          { label: 'Sector / categoria', width: 0.19 },
          { label: 'Dias', width: 0.17 },
          { label: 'Entrada', width: 0.1, align: 'center' },
          { label: 'Intervalo', width: 0.14, align: 'center' },
          { label: 'Saída', width: 0.09, align: 'center' },
          { label: 'H/dia', width: 0.07, align: 'center' },
          { label: 'H/sem.', width: 0.08, align: 'center' },
          { label: 'Descanso', width: 0.16 },
        ],
        rows: lista.length
          ? lista.map((r) => [r.sector || '—', r.dias || '—', r.entrada || '—', intervalo(r), r.saida || '—', fmtH(r.horasDia), fmtH(r.horasSemana), r.descanso || '—'])
          : [[BLANK, '', '', '', '', '', '', '']],
        note: v.regime === 'continuo' ? 'No horário contínuo, o intervalo de descanso conta como tempo de trabalho efectivo.' : undefined,
      },
    ];
    if (isentos.length) {
      blocks.push({
        type: 'paragraph',
        id: 'isentos',
        text: `**Isentos de horário:** ${isentos.map((r) => `${str(r.nome)}${str(r.cargo) ? ` (${str(r.cargo)})` : ''}`).join('; ')}.`,
        en: 'Staff exempt from fixed hours as listed.',
        size: 'small',
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'consulta',
      text:
        v.consultaSindical === 'naoExiste'
          ? `O presente horário foi fixado nos termos ${doCite('horarioTrabalho')}. Não existe órgão sindical na empresa.`
          : `O presente horário foi fixado nos termos ${doCite('horarioTrabalho')}, ouvido o órgão sindical${v.consultaData ? ` em ${dateLong(v.consultaData)}` : ''}.`,
      en: v.consultaSindical === 'naoExiste' ? 'This schedule was set under the Labour Law. There is no union body in the company.' : 'This schedule was set under the Labour Law after consulting the union body.',
      size: 'small',
      keepWithNext: true,
    });
    blocks.push(
      { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [employerSignature(ctx, 'A Direcção')] },
      { type: 'box', label: 'Visto da Administração do Trabalho', lines: 1, width: 'half', align: 'right' },
    );
    return blocks;
  },
});
