// Plano de actividades de um órgão ou serviço público: objectives, activities,
// indicators, targets, quarters, responsible units and budget, on a landscape
// page.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, entityName, formatMoney, l, lineItems, localField, money } from './_shared';
import { paragraphs, signatarioColumn, signatarioFields } from './_estado';
import { entidadeProfileWarning, semPonto, str } from './_contratacao';

/** "1, 3" / "I e II" / "todos" → the quarters marked. */
function trimestres(x: unknown): boolean[] {
  const s = str(x).toUpperCase();
  if (!s) return [false, false, false, false];
  if (/TODOS|ANUAL|CONT/.test(s)) return [true, true, true, true];
  const marks = [false, false, false, false];
  const tokens = s.replace(/\bE\b/g, ',').split(/[^IV0-9]+/).filter(Boolean);
  for (const t of tokens) {
    const i = ['I', 'II', 'III', 'IV'].indexOf(t);
    const j = Number(t);
    if (i >= 0) marks[i] = true;
    else if (j >= 1 && j <= 4) marks[j - 1] = true;
  }
  return marks;
}

export default defineTemplate({
  id: 'plano-de-actividades',
  family: 'mapa',
  official: 'estado',
  page: 'A4-paisagem',
  sections: [
    { id: 'documento', title: l('Identificação', 'Identification') },
    { id: 'actividades', title: l('Actividades', 'Activities') },
    { id: 'assinatura', title: l('Elaboração e aprovação', 'Prepared and approved') },
  ],
  fields: [
    localField(),
    dateField('data'),
    { name: 'periodo', type: 'text', section: 'documento', width: 'half', required: true, label: l('Período', 'Period'), placeholder: l('Ex.: 2027', 'E.g. 2027') },
    { name: 'unidade', type: 'text', section: 'documento', width: 'half', label: l('Unidade orgânica (opcional)', 'Organisational unit (optional)') },
    { name: 'objectivoGeral', type: 'textarea', section: 'documento', rows: 2, label: l('Objectivo geral (opcional)', 'General objective (optional)') },
    {
      name: 'actividades',
      type: 'lines',
      section: 'actividades',
      label: l('Actividades', 'Activities'),
      addLabel: l('Adicionar actividade', 'Add activity'),
      columns: [
        { name: 'objectivo', type: 'text', label: l('Objectivo específico', 'Specific objective') },
        { name: 'actividade', type: 'text', label: l('Actividade', 'Activity') },
        { name: 'indicador', type: 'text', label: l('Indicador', 'Indicator') },
        { name: 'meta', type: 'text', label: l('Meta', 'Target') },
        { name: 'trimestres', type: 'text', label: l('Trimestres (ex.: I, II ou todos)', 'Quarters (e.g. I, II or all)') },
        { name: 'responsavel', type: 'text', label: l('Responsável', 'Responsible') },
        { name: 'orcamento', type: 'money', label: l('Orçamento', 'Budget') },
      ],
      default: [],
    },
    ...signatarioFields('assinatura', l('Cargo de quem aprova', 'Approver’s position')),
    { name: 'elaboradoNome', type: 'text', section: 'assinatura', width: 'half', label: l('Elaborado por (nome)', 'Prepared by (name)') },
    { name: 'elaboradoCargo', type: 'text', section: 'assinatura', width: 'half', label: l('Cargo de quem elaborou', 'Position') },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...entidadeProfileWarning(ctx)];
    if (!lineItems(v.actividades).some((r) => str(r.actividade))) w.push({ level: 'warning', field: 'actividades', message: l('Acrescente as actividades.', 'Add the activities.') });
    w.push({ level: 'info', message: l('O plano deve estar alinhado com o Plano Económico e Social e o orçamento aprovado; cada actividade com orçamento deve ter a rubrica correspondente.', 'The plan should match the economic and social plan and the approved budget.') });
    return w;
  },

  personName: (v) => v.periodo,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const acts = lineItems(v.actividades).filter((r) => str(r.actividade));
    const total = acts.reduce((s, r) => s + (money(r.orcamento) ?? 0), 0);
    const hasOrc = acts.some((r) => money(r.orcamento) != null);
    const unidade = str(v.unidade) || entityName(ctx);
    const blocks: Block[] = [{ type: 'title', text: `Plano de actividades ${semPonto(v.periodo) || BLANK}`, subtitle: unidade }];
    const og = paragraphs(v.objectivoGeral);
    if (og.length) blocks.push({ type: 'paragraph', id: 'objectivoGeral', text: `**Objectivo geral:** ${og.join(' ')}`, en: 'General objective.' });
    blocks.push({
      type: 'table',
      columns: [
        { label: 'N.º', width: 0.35, align: 'right' },
        { label: 'Objectivo específico', width: 2.2 },
        { label: 'Actividade', width: 2.7 },
        { label: 'Indicador', width: 1.6 },
        { label: 'Meta', width: 0.75, align: 'center' },
        { label: 'I', width: 0.3, align: 'center' },
        { label: 'II', width: 0.3, align: 'center' },
        { label: 'III', width: 0.35, align: 'center' },
        { label: 'IV', width: 0.35, align: 'center' },
        { label: 'Responsável', width: 1.5 },
        { label: 'Orçamento (MT)', width: 1.2, align: 'right' },
      ],
      rows: (acts.length ? acts : [{}, {}, {}, {}, {}]).map((r, i) => {
        const t = trimestres(r.trimestres);
        return [String(i + 1), str(r.objectivo), str(r.actividade), str(r.indicador), str(r.meta), ...t.map((x) => (x ? 'X' : '')), str(r.responsavel), money(r.orcamento) != null ? formatMoney(money(r.orcamento), false) : ''];
      }),
      totals: hasOrc ? [['', 'Total', '', '', '', '', '', '', '', '', formatMoney(total, false)]] : undefined,
      grid: true,
    });
    blocks.push(
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.data)}`,
        columns: [
          { role: 'Elaborado por', name: str(v.elaboradoNome) || undefined, detail: str(v.elaboradoCargo) || undefined },
          { ...signatarioColumn(v), role: `Aprovado — ${signatarioColumn(v).role}` },
        ],
      },
    );
    return blocks;
  },
});
