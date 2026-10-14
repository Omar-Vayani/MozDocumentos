// Registo de trabalho extraordinário e excepcional: the register the Labour
// Law requires — overtime and work on rest days or holidays, entered before
// and after, with the reason, and countersigned by the employee. Checks the
// weekly overtime limit per employee.

import { parseISODate } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, l, lineItems, localField, refField } from './_shared';
import { qty } from './_contrato-trabalho';
import { str } from './_rh-politicas';

const TIPO: Record<string, string> = { extra: 'Extraordinário', descanso: 'Dia de descanso', feriado: 'Feriado', nocturno: 'Extra. nocturno' };
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const fmt = (iso: unknown) => (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-').reverse().join('/') : '');

/** Hours between two "HH:MM" times (overnight allowed). */
function horas(ini: unknown, fim: unknown): number | null {
  const p = (x: unknown) => {
    const m = /^(\d{1,2})[:h.](\d{2})$/.exec(String(x ?? '').trim());
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const a = p(ini);
  const b = p(fim);
  if (a == null || b == null) return null;
  const d = b >= a ? b - a : b + 24 * 60 - a;
  return Math.round((d / 60) * 100) / 100;
}

/** Monday of the ISO week (yyyy-mm-dd), for grouping. */
function semana(iso: string): string {
  const d = parseISODate(iso);
  if (!d) return '';
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const numTxt = (n: number) => String(n).replace('.', ',');

export default defineTemplate({
  id: 'registo-trabalho-extraordinario',
  family: 'mapa',
  page: 'A4-paisagem',
  sections: [
    { id: 'documento', title: l('Registo', 'Register') },
    { id: 'registos', title: l('Registos', 'Entries') },
  ],
  fields: [
    refField(),
    localField(),
    { name: 'mes', type: 'month', section: 'documento', width: 'half', required: true, label: l('Mês', 'Month'), default: (c) => c.today.slice(0, 7) },
    { name: 'departamento', type: 'text', section: 'documento', width: 'half', label: l('Departamento / obra', 'Department / site') },
    {
      name: 'registos',
      type: 'lines',
      section: 'registos',
      label: l('Trabalho prestado', 'Work performed'),
      addLabel: l('Adicionar registo', 'Add entry'),
      columns: [
        { name: 'data', type: 'date', label: l('Data', 'Date') },
        { name: 'nome', type: 'text', label: l('Trabalhador', 'Employee') },
        { name: 'inicio', type: 'text', label: l('Início (hh:mm)', 'Start (hh:mm)'), placeholder: l('16:30', '16:30') },
        { name: 'fim', type: 'text', label: l('Fim (hh:mm)', 'End (hh:mm)'), placeholder: l('19:30', '19:30') },
        { name: 'tipo', type: 'select', label: l('Tipo', 'Type'), default: 'extra', options: [
          { value: 'extra', label: l('Extraordinário', 'Overtime') },
          { value: 'nocturno', label: l('Extraordinário nocturno', 'Night overtime') },
          { value: 'descanso', label: l('Dia de descanso', 'Rest day') },
          { value: 'feriado', label: l('Feriado', 'Public holiday') },
        ] },
        { name: 'fundamento', type: 'text', label: l('Fundamento', 'Reason'), placeholder: l('Ex.: betonagem da laje', 'E.g. slab concreting') },
        { name: 'autorizou', type: 'text', label: l('Autorizado por', 'Authorised by') },
      ],
      default: [],
    },
    { name: 'linhasBranco', type: 'number', section: 'registos', width: 'half', min: 0, max: 25, default: 4, label: l('Linhas em branco', 'Blank rows') },
  ],

  computed: (v) => {
    const regs = lineItems(v.registos).filter((r) => str(r.nome));
    const porSemana = new Map<string, number>();
    const porTrab = new Map<string, number>();
    for (const r of regs) {
      const h = horas(r.inicio, r.fim) ?? 0;
      const nome = str(r.nome);
      porTrab.set(nome, (porTrab.get(nome) ?? 0) + h);
      if ((r.tipo === 'extra' || r.tipo === 'nocturno' || !r.tipo) && r.data) {
        const k = `${nome}|${semana(String(r.data))}`;
        porSemana.set(k, (porSemana.get(k) ?? 0) + h);
      }
    }
    return { regs, porSemana: [...porSemana.entries()], porTrab: [...porTrab.entries()] };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const lim = ctx.legal.value<{ trimestre: number; semana: number; ano: number }>('rhpTrabalhoExtraordinario');
    for (const [k, h] of ctx.computed.porSemana as [string, number][]) {
      if (h > lim.semana) {
        w.push({ level: 'error', field: 'registos', message: l(`${k.split('|')[0]}: ${numTxt(h)} horas extraordinárias numa semana; o limite é ${lim.semana} (${cite('rhpTrabalhoExtraordinario')}).`, `${k.split('|')[0]}: ${h} overtime hours in one week; the limit is ${lim.semana}.`) });
      }
    }
    w.push({ level: 'info', message: l(`Limites por trabalhador: ${lim.semana} horas por semana, ${lim.trimestre} por trimestre e ${lim.ano} por ano. O trabalho em dia de descanso ou feriado dá direito a descanso compensatório (${cite('rhpTrabalhoExcepcional')}).`, `Limits per employee: ${lim.semana} h/week, ${lim.trimestre} h/quarter, ${lim.ano} h/year. Rest-day work gives compensatory rest.`) });
    if (!v.registos?.length) w.push({ level: 'info', field: 'registos', message: l('Pode imprimir a folha em branco e preenchê-la à mão: cada registo é feito antes do início e depois do termo do trabalho.', 'You can print a blank sheet and fill it in by hand.') });
    return w;
  },
  documentDate: (v) => (v.mes ? `${v.mes}-01` : undefined),

  blocks: (ctx) => {
    const v = ctx.values;
    const lim = ctx.legal.value<{ trimestre: number; semana: number; ano: number }>('rhpTrabalhoExtraordinario');
    const exc = ctx.legal.value<{ compensatorioDias: number; meioDiaHoras: number }>('rhpTrabalhoExcepcional');
    const regs = ctx.computed.regs as Record<string, any>[];
    const branco = Math.max(0, Math.min(25, Number(v.linhasBranco ?? 4) || 0));
    const [ano, mes] = String(v.mes ?? '').split('-');
    const mesTxt = ano && mes ? `${MESES[Number(mes) - 1] ?? ''} de ${ano}` : BLANK;
    const rows = [
      ...regs.map((r) => {
        const h = horas(r.inicio, r.fim);
        return [fmt(r.data) || '', str(r.nome), str(r.inicio), str(r.fim), h != null ? numTxt(h) : '', TIPO[r.tipo as string] ?? TIPO.extra, str(r.fundamento), str(r.autorizou), ''];
      }),
      ...Array.from({ length: branco }, () => ['___/___', '', ':', ':', '', '', '', '', '']),
    ];
    const total = (ctx.computed.porTrab as [string, number][]).map(([n, h]) => `${n}: ${numTxt(Math.round(h * 100) / 100)} h`);
    const blocks: Block[] = [
      { type: 'title', text: 'Registo de Trabalho Extraordinário e Excepcional', subtitle: `${mesTxt}${str(v.departamento) ? ` — ${str(v.departamento)}` : ''}` },
      {
        type: 'table',
        grid: true,
        columns: [
          { label: 'Data', width: 0.08, align: 'center' },
          { label: 'Trabalhador', width: 0.18 },
          { label: 'Início', width: 0.06, align: 'center' },
          { label: 'Fim', width: 0.06, align: 'center' },
          { label: 'Horas', width: 0.06, align: 'center' },
          { label: 'Tipo', width: 0.1 },
          { label: 'Fundamento', width: 0.2 },
          { label: 'Autorizado por', width: 0.12 },
          { label: 'Visto do trabalhador', width: 0.14 },
        ],
        rows,
      },
    ];
    blocks.push({
      type: 'note',
      text: `${total.length ? `Total no mês — ${total.join('; ')}. ` : ''}Limites por trabalhador: ${qty(lim.semana, 'hora', 'horas', true)} por semana, ${qty(lim.trimestre, 'hora', 'horas', true)} por trimestre e ${qty(lim.ano, 'hora', 'horas', true)} por ano (${cite('rhpTrabalhoExtraordinario')}). Trabalho em dia de descanso ou feriado: descanso compensatório num dos ${qty(exc.compensatorioDias, 'dia', 'dias')} seguintes (${cite('rhpTrabalhoExcepcional')}). Registo feito antes e depois do trabalho e visado pelo trabalhador.`,
    });
    blocks.push({ type: 'paragraph', id: 'visto', text: 'Visto da Direcção: ________________________________________     Data: ___/___/______', en: 'Management approval and date.', align: 'right' });
    return blocks;
  },
});
