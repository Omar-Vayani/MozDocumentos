// Aviso de férias colectivas (encerramento para férias): all employees take
// their leave at the same time, decided after consulting the union body.
// Public holidays in the period are not counted as leave days.

import { diffDays, parseISODate } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerName, employerSignature, l, lineItems, localField, refField } from './_shared';
import { linhas, nosTermos, ponto, refCite, str } from './_rh-politicas';

/** Public holidays (MM-DD) that fall within [ini, fim]. */
function feriadosNoPeriodo(ini: string, fim: string, mmdd: string[]): string[] {
  const a = parseISODate(ini);
  const b = parseISODate(fim);
  if (!a || !b || b < a) return [];
  const out: string[] = [];
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    const k = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (mmdd.includes(k)) out.push(`${d.getFullYear()}-${k}`);
  }
  return out;
}

export default defineTemplate({
  id: 'aviso-ferias-colectivas',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'encerramento', title: l('Encerramento', 'Shutdown') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    { name: 'abrangidos', type: 'text', section: 'encerramento', label: l('Abrangidos', 'Covered'), default: 'todos os trabalhadores da Empresa', help: l('Ex.: todos os trabalhadores da fábrica da Machava.', 'E.g. all employees of the factory.') },
    { name: 'dataInicio', type: 'date', section: 'encerramento', width: 'half', required: true, label: l('Primeiro dia de férias', 'First day of leave') },
    { name: 'dataFim', type: 'date', section: 'encerramento', width: 'half', required: true, label: l('Último dia de férias', 'Last day of leave') },
    { name: 'dataRegresso', type: 'date', section: 'encerramento', width: 'half', label: l('Regresso ao trabalho', 'Back to work on') },
    { name: 'dataConsulta', type: 'date', section: 'encerramento', width: 'half', label: l('Data da consulta ao órgão sindical', 'Date the union was consulted'), legal: l('A consulta prévia ao órgão sindical é obrigatória.', 'Prior union consultation is mandatory.') },
    { name: 'motivo', type: 'text', section: 'encerramento', label: l('Motivo (opcional)', 'Reason (optional)'), placeholder: l('Ex.: manutenção anual dos equipamentos e redução das encomendas no fim do ano', 'E.g. annual maintenance and fewer orders at year end') },
    {
      name: 'piquete',
      type: 'lines',
      section: 'encerramento',
      label: l('Trabalhadores de serviço durante o encerramento (opcional)', 'Staff on duty during the shutdown (optional)'),
      addLabel: l('Adicionar', 'Add'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'funcao', type: 'text', label: l('Função', 'Job') },
      ],
      default: [],
    },
    { name: 'contacto', type: 'text', section: 'encerramento', label: l('Contacto de urgência', 'Emergency contact') },
  ],

  computed: (v, { legal }) => {
    const ok = v.dataInicio && v.dataFim && diffDays(v.dataInicio, v.dataFim) >= 0;
    const fer = ok ? feriadosNoPeriodo(v.dataInicio, v.dataFim, legal.value<string[]>('feriadosNacionais')) : [];
    const dias = ok ? diffDays(v.dataInicio, v.dataFim) + 1 : null;
    return { feriados: fer, dias, diasFerias: dias != null ? dias - fer.length : null };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!v.dataConsulta) w.push({ level: 'warning', field: 'dataConsulta', message: l(`As férias colectivas exigem consulta prévia ao órgão sindical (${cite('rhpFeriasColectivas')}).`, 'Collective leave requires prior consultation of the union body.') });
    if (ctx.computed.dias != null && ctx.computed.dias < 1) w.push({ level: 'error', field: 'dataFim', message: l('O último dia é anterior ao primeiro.', 'The last day is before the first.') });
    w.push({ level: 'info', message: l('Os trabalhadores com menos dias de férias vencidas do que os do encerramento devem ser informados individualmente da sua situação. Afixe o aviso nos locais de trabalho com antecedência.', 'Employees with fewer leave days than the shutdown should be told individually. Post the notice in advance.') });
    return w;
  },
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed as { feriados: string[]; dias: number | null; diasFerias: number | null };
    const empresa = employerName(ctx);
    const piquete = lineItems(v.piquete).filter((r) => str(r.nome));
    const motivo = linhas(v.motivo).join('; ');
    const blocks: Block[] = [
      { type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'title', text: 'Aviso', subtitle: 'Férias colectivas' },
      {
        type: 'paragraph',
        id: 'aviso',
        text: `${nosTermos('rhpFeriasColectivas').replace(/^n/, 'N')}, e ouvido o órgão sindical${v.dataConsulta ? ` em ${dateLong(v.dataConsulta)}` : ''}, a Direcção ${empresa === BLANK ? 'da Empresa' : `de ${empresa}`} informa que ${str(v.abrangidos) || 'todos os trabalhadores'} gozam férias simultaneamente no período de **${dateLong(v.dataInicio)}** a **${dateLong(v.dataFim)}**${motivo ? `, em virtude de ${ponto(motivo.charAt(0).toLowerCase() + motivo.slice(1)).replace(/\.$/, '')}` : ''}.`,
        en: `All employees take leave at the same time from ${v.dataInicio || '—'} to ${v.dataFim || '—'}.`,
      },
    ];
    const contagem: string[] = [];
    if (c.diasFerias != null && c.diasFerias > 0) contagem.push(`O encerramento corresponde a ${c.diasFerias} ${c.diasFerias === 1 ? 'dia' : 'dias'} de férias, descontados no período de férias de cada trabalhador`);
    if (c.feriados.length) contagem.push(`${c.feriados.length === 1 ? 'o feriado' : 'os feriados'} de ${c.feriados.map((d) => dateLong(d).replace(/ de \d{4}$/, '')).join(' e ')} não ${c.feriados.length === 1 ? 'é contado' : 'são contados'} como ${c.feriados.length === 1 ? 'dia' : 'dias'} de férias ${refCite('feriasGozo')}`);
    if (contagem.length) blocks.push({ type: 'paragraph', id: 'contagem', text: ponto(contagem.join('; ').replace(/^./, (x) => x.toUpperCase())), en: 'Number of leave days; public holidays are not counted.' });
    blocks.push({
      type: 'paragraph',
      id: 'regresso',
      text: `Os trabalhadores retomam o trabalho em **${dateLong(v.dataRegresso)}**, no horário habitual. Os trabalhadores que ainda não tenham direito a todos os dias do encerramento são informados individualmente da sua situação pelos Recursos Humanos.`,
      en: 'Work resumes on the stated date; employees without enough leave days are informed individually.',
    });
    if (piquete.length) {
      blocks.push(
        { type: 'paragraph', id: 'piquete', text: 'Mantêm-se de serviço durante o encerramento, gozando as suas férias noutra data a acordar, os seguintes trabalhadores:', en: 'Staff on duty during the shutdown (leave at another date):', keepWithNext: true },
        { type: 'list', items: piquete.map((r) => `${str(r.nome)}${str(r.funcao) ? ` — ${str(r.funcao)}` : ''}`) },
      );
    }
    if (str(v.contacto)) blocks.push({ type: 'paragraph', id: 'contacto', text: `Contacto em caso de urgência: ${str(v.contacto)}.`, en: 'Emergency contact.' });
    blocks.push({ type: 'signatures', placeDate: undefined, columns: [employerSignature(ctx, 'A Direcção')] });
    return blocks;
  },
});
