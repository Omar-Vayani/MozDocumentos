// Mapa de férias: the annual leave plan, posted for all employees.
// Leave is counted in calendar days; public holidays inside a leave period do
// not count as leave days (both rules come from src/legal/mz-legal.ts).

import { addDays, diffDays, formatDateShort, parseISODate } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerName, employerSignature, l, lineItems, localField, refField } from './_shared';
import { doCite, qty } from './_contrato-trabalho';

const str = (x: unknown) => String(x ?? '').trim();
const iso = (x: unknown) => (parseISODate(str(x)) ? str(x).slice(0, 10) : '');

type Periodo = {
  trabalhador: string;
  cargo: string;
  inicio: string;
  fim: string;
  dias: number | null;
  feriados: number;
  observacoes: string;
};

/** Leave days between two ISO dates (inclusive), minus public holidays (MM-DD) in the period. */
function contarDias(inicio: string, fim: string, feriados: string[]): { dias: number | null; feriados: number } {
  if (!inicio || !fim) return { dias: null, feriados: 0 };
  const total = diffDays(inicio, fim) + 1;
  if (!Number.isFinite(total) || total <= 0) return { dias: null, feriados: 0 };
  let f = 0;
  for (let i = 0; i < Math.min(total, 400); i++) {
    if (feriados.includes(addDays(inicio, i).slice(5))) f++;
  }
  return { dias: total - f, feriados: f };
}

export default defineTemplate({
  id: 'mapa-de-ferias',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'ferias', title: l('Períodos de férias', 'Leave periods') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    {
      name: 'ano',
      type: 'number',
      section: 'documento',
      width: 'half',
      required: true,
      min: 2000,
      max: 2100,
      label: l('Ano', 'Year'),
      default: (c) => Number(c.today.slice(0, 4)),
    },
    refField(),
    localField(),
    dateField('data'),
    {
      name: 'ferias',
      type: 'lines',
      section: 'ferias',
      required: true,
      label: l('Férias marcadas', 'Scheduled leave'),
      help: l(
        'Uma linha por período. Se as férias de um trabalhador forem fraccionadas, use uma linha para cada período.',
        'One row per period. If an employee’s leave is split, use one row for each period.',
      ),
      addLabel: l('Adicionar período', 'Add period'),
      columns: [
        { name: 'trabalhador', type: 'text', label: l('Trabalhador', 'Employee') },
        { name: 'cargo', type: 'text', label: l('Cargo', 'Position') },
        { name: 'inicio', type: 'date', label: l('Início', 'Start') },
        { name: 'fim', type: 'date', label: l('Fim', 'End') },
        { name: 'observacoes', type: 'text', label: l('Observações', 'Notes'), placeholder: l('Ex.: 2.º período', 'E.g. 2nd period') },
      ],
      default: [],
    },
    {
      name: 'orgaoSindical',
      type: 'toggle',
      section: 'opcoes',
      default: false,
      label: l('Elaborado em coordenação com o órgão sindical', 'Prepared together with the trade union body'),
      legal: l(
        'A lei prevê que o empregador elabore o plano de férias em coordenação com o órgão sindical, quando exista.',
        'The law requires the employer to prepare the leave plan together with the union body, where there is one.',
      ),
    },
  ],

  computed: (v, { legal }) => {
    const feriados = legal.value<string[]>('feriadosNacionais');
    const periodos: Periodo[] = lineItems(v.ferias)
      .filter((r) => str(r.trabalhador) || str(r.inicio) || str(r.fim))
      .map((r) => {
        const inicio = iso(r.inicio);
        const fim = iso(r.fim);
        return { trabalhador: str(r.trabalhador), cargo: str(r.cargo), inicio, fim, ...contarDias(inicio, fim, feriados), observacoes: str(r.observacoes) };
      });
    const porTrabalhador = new Map<string, number>();
    for (const p of periodos) if (p.trabalhador && p.dias) porTrabalhador.set(p.trabalhador, (porTrabalhador.get(p.trabalhador) ?? 0) + p.dias);
    return {
      periodos,
      totalDias: periodos.reduce((t, p) => t + (p.dias ?? 0), 0),
      trabalhadores: new Set(periodos.map((p) => p.trabalhador).filter(Boolean)).size,
      porTrabalhador: [...porTrabalhador.entries()],
    };
  },

  warnings: (v, { computed: c, legal }) => {
    const w: Warning[] = [];
    const fer = legal.value<{ anosSeguintes: number; blocoMinimo: number }>('feriasDireito');
    const periodos = c.periodos as Periodo[];
    const ano = Number(v.ano);
    if (!periodos.length) {
      w.push({ level: 'warning', field: 'ferias', message: l('Adicione pelo menos um período de férias.', 'Add at least one leave period.') });
    }
    for (const p of periodos) {
      const quem = p.trabalhador || '—';
      if (!p.inicio || !p.fim) {
        w.push({ level: 'warning', field: 'ferias', message: l(`Indique as datas de início e de fim das férias de ${quem}.`, `Enter the start and end dates of ${quem}’s leave.`) });
      } else if (diffDays(p.inicio, p.fim) < 0) {
        w.push({ level: 'error', field: 'ferias', message: l(`A data de fim é anterior à de início (${quem}).`, `The end date is before the start date (${quem}).`) });
      } else {
        if (Number.isFinite(ano) && ano > 0 && Number(p.inicio.slice(0, 4)) !== ano) {
          w.push({ level: 'warning', field: 'ferias', message: l(`As férias de ${quem} não começam no ano ${ano}.`, `${quem}’s leave does not start in ${ano}.`) });
        }
        if (p.dias != null && p.dias < fer.blocoMinimo) {
          w.push({
            level: 'info',
            field: 'ferias',
            message: l(
              `O período de ${quem} tem menos de ${fer.blocoMinimo} dias. As férias só podem ser fraccionadas por acordo e em períodos não inferiores a ${fer.blocoMinimo} dias (${cite('feriasDireito')}).`,
              `${quem}’s period is shorter than ${fer.blocoMinimo} days. Leave may only be split by agreement, in periods of at least ${fer.blocoMinimo} days.`,
            ),
          });
        }
      }
    }
    for (const [nome, dias] of c.porTrabalhador as [string, number][]) {
      if (dias > fer.anosSeguintes) {
        w.push({
          level: 'warning',
          field: 'ferias',
          message: l(
            `${nome} tem ${dias} dias de férias marcados, mais do que os ${fer.anosSeguintes} dias anuais. Só é possível com acumulação acordada por escrito.`,
            `${nome} has ${dias} leave days scheduled, more than the annual ${fer.anosSeguintes}. Only possible with accumulation agreed in writing.`,
          ),
        });
      }
    }
    if (!v.orgaoSindical) {
      w.push({
        level: 'info',
        field: 'orgaoSindical',
        message: l(
          `Se existir órgão sindical na empresa, o plano de férias deve ser elaborado em coordenação com ele (${cite('feriasGozo')}).`,
          'If there is a union body in the company, the leave plan must be prepared together with it.',
        ),
      });
    }
    return w;
  },

  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const { values: v, computed: c } = ctx;
    const fer = ctx.legal.value<{ primeiroAno: number; anosSeguintes: number; blocoMinimo: number }>('feriasDireito');
    const periodos = c.periodos as Periodo[];
    const ano = Number(v.ano) > 0 ? String(v.ano) : BLANK;
    const data = (d: string) => (d ? formatDateShort(d) : '—');

    const rows = periodos.map((p, i) => [
      String(i + 1),
      p.trabalhador || BLANK,
      p.cargo || '—',
      data(p.inicio),
      data(p.fim),
      p.dias != null ? String(p.dias) : '—',
      p.observacoes,
    ]);

    const blocks: Block[] = [
      { type: 'title', text: 'Mapa de férias', subtitle: `Ano de ${ano}` },
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'paragraph',
        id: 'introducao',
        text: `Nos termos ${doCite('feriasGozo')}, ${employerName(ctx) === BLANK ? 'a entidade empregadora' : `**${employerName(ctx)}**`} publica o mapa de férias dos seus trabalhadores para o ano de ${ano}${
          v.orgaoSindical ? ', elaborado em coordenação com o órgão sindical' : ''
        }.`,
        en: `The employer publishes its employees’ leave plan for ${ano}${v.orgaoSindical ? ', prepared together with the union body' : ''}.`,
      },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.45, align: 'center' },
          { label: 'Trabalhador', width: 2.3 },
          { label: 'Cargo', width: 1.5 },
          { label: 'Início', width: 1.3, align: 'center' },
          { label: 'Fim', width: 1.3, align: 'center' },
          { label: 'Dias', width: 0.65, align: 'center' },
          { label: 'Observações', width: 1.6 },
        ],
        rows: rows.length ? rows : Array.from({ length: 3 }, () => ['', BLANK, '', '', '', '', '']),
        totals: [['', 'Total de dias de férias', '', '', '', periodos.length ? String(c.totalDias) : '', '']],
        note: 'Dias de férias contados em dias de calendário, excluídos os feriados obrigatórios que coincidam com o período.',
      },
      {
        type: 'paragraph',
        id: 'regras',
        size: 'small',
        text: `Nos termos ${doCite('feriasDireito')}, o trabalhador tem direito a ${qty(fer.primeiroAno, 'dia', 'dias')} de férias remuneradas no primeiro ano de serviço efectivo e a ${qty(fer.anosSeguintes, 'dia', 'dias')} em cada um dos anos seguintes. As férias são gozadas de forma seguida e só podem ser fraccionadas por acordo, em períodos não inferiores a ${qty(fer.blocoMinimo, 'dia', 'dias')}.`,
        en: `Employees are entitled to ${fer.primeiroAno} days of paid leave in the first year of effective service and ${fer.anosSeguintes} days in each following year. Leave is taken in one block and may only be split by agreement, in periods of at least ${fer.blocoMinimo} days.`,
      },
      {
        type: 'paragraph',
        id: 'alteracoes',
        text: 'Qualquer alteração aos períodos marcados é feita por acordo com o trabalhador abrangido ou, por razões imperiosas de serviço, nos termos da lei, e é comunicada por escrito ao interessado.',
        en: 'Any change to the scheduled periods is made by agreement with the employee concerned or, for compelling business reasons, as provided by law, and is notified to the employee in writing.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        columns: [employerSignature(ctx, 'A Entidade Empregadora')],
      },
      {
        type: 'paragraph',
        id: 'afixacao',
        align: 'left',
        editable: false,
        text: 'Afixado em ___/___/______.',
      },
    ];
    return blocks;
  },
});
