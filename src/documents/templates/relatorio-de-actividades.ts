// Relatório de actividades (anual, semestral, trimestral ou mensal) de um órgão
// ou serviço público: what was planned and achieved, budget execution,
// constraints and the outlook for the next period.

import { defineTemplate, type Block, type Warning } from '../model';
import { formatNumber } from '@/lib/format';
import { BLANK, dateField, dateLong, entityName, formatMoney, l, lineItems, localField, money } from './_shared';
import { estadoRef, numeroField, paragraphs, signatarioColumn, signatarioFields, stripNumber } from './_estado';
import { entidadeProfileWarning, semPonto, str } from './_contratacao';

const PERIODOS = [
  { value: 'anual', label: l('Anual', 'Annual') },
  { value: 'semestral', label: l('Semestral', 'Half-yearly') },
  { value: 'trimestral', label: l('Trimestral', 'Quarterly') },
  { value: 'mensal', label: l('Mensal', 'Monthly') },
];

const n = (x: unknown) => (x === '' || x == null || !Number.isFinite(Number(String(x).replace(',', '.'))) ? null : Number(String(x).replace(',', '.')));

export default defineTemplate({
  id: 'relatorio-de-actividades',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Identificação', 'Identification') },
    { id: 'texto', title: l('Introdução', 'Introduction') },
    { id: 'actividades', title: l('Actividades realizadas', 'Activities carried out') },
    { id: 'orcamento', title: l('Execução orçamental (opcional)', 'Budget execution (optional)') },
    { id: 'analise', title: l('Constrangimentos e perspectivas', 'Constraints and outlook') },
    { id: 'assinatura', title: l('Elaboração e aprovação', 'Prepared and approved') },
  ],
  fields: [
    numeroField(),
    localField(),
    dateField('data'),
    { name: 'tipo', type: 'select', section: 'documento', width: 'half', label: l('Periodicidade', 'Period type'), options: PERIODOS, default: 'trimestral' },
    { name: 'periodo', type: 'text', section: 'documento', width: 'half', required: true, label: l('Período', 'Period'), placeholder: l('Ex.: III Trimestre de 2026', 'E.g. Q3 2026') },
    { name: 'unidade', type: 'text', section: 'documento', label: l('Unidade orgânica (opcional)', 'Organisational unit (optional)'), help: l('Vazio: usa o nome da instituição do perfil.', 'Empty: uses the institution’s name.') },
    { name: 'introducao', type: 'textarea', section: 'texto', rows: 4, label: l('Introdução', 'Introduction'), help: l('Enquadramento: missão do serviço, plano de referência e principais resultados do período.', 'Context: the unit’s mission, the reference plan and the main results of the period.') },
    {
      name: 'actividades',
      type: 'lines',
      section: 'actividades',
      label: l('Actividades', 'Activities'),
      addLabel: l('Adicionar actividade', 'Add activity'),
      columns: [
        { name: 'actividade', type: 'text', label: l('Actividade', 'Activity') },
        { name: 'meta', type: 'text', label: l('Meta planificada', 'Planned target') },
        { name: 'realizado', type: 'text', label: l('Realizado', 'Achieved') },
        { name: 'observacoes', type: 'text', label: l('Observações', 'Notes') },
      ],
      default: [],
      help: l('Quando a meta e o realizado são números, o grau de realização é calculado.', 'When target and achievement are numbers, the completion rate is computed.'),
    },
    {
      name: 'orcamento',
      type: 'lines',
      section: 'orcamento',
      label: l('Execução orçamental', 'Budget execution'),
      addLabel: l('Adicionar rubrica', 'Add line'),
      columns: [
        { name: 'rubrica', type: 'text', label: l('Rubrica', 'Budget line') },
        { name: 'dotacao', type: 'money', label: l('Dotação', 'Allocation') },
        { name: 'executado', type: 'money', label: l('Executado', 'Spent') },
      ],
      default: [],
    },
    { name: 'constrangimentos', type: 'textarea', section: 'analise', rows: 3, label: l('Constrangimentos', 'Constraints'), help: l('Um por linha.', 'One per line.') },
    { name: 'perspectivas', type: 'textarea', section: 'analise', rows: 3, label: l('Perspectivas para o período seguinte', 'Outlook for the next period'), help: l('Um por linha.', 'One per line.') },
    { name: 'conclusao', type: 'textarea', section: 'analise', rows: 2, label: l('Conclusão (opcional)', 'Conclusion (optional)') },
    { name: 'elaboradoNome', type: 'text', section: 'assinatura', width: 'half', label: l('Elaborado por (nome)', 'Prepared by (name)') },
    { name: 'elaboradoCargo', type: 'text', section: 'assinatura', width: 'half', label: l('Cargo de quem elaborou', 'Position') },
    ...signatarioFields('assinatura', l('Cargo de quem aprova', 'Approver’s position')),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...entidadeProfileWarning(ctx)];
    if (!lineItems(v.actividades).some((r) => str(r.actividade))) w.push({ level: 'warning', field: 'actividades', message: l('Registe as actividades do período.', 'Record the period’s activities.') });
    if (!str(v.periodo)) w.push({ level: 'warning', field: 'periodo', message: l('Indique o período do relatório.', 'Enter the reporting period.') });
    return w;
  },

  personName: (v) => v.periodo,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const unidade = str(v.unidade) || entityName(ctx);
    const acts = lineItems(v.actividades).filter((r) => str(r.actividade));
    const orc = lineItems(v.orcamento).filter((r) => str(r.rubrica));
    const tipo = PERIODOS.find((p) => p.value === v.tipo)?.label.pt ?? '';
    let k = 0;
    const blocks: Block[] = [
      { type: 'reference', ref: estadoRef(ctx, 'Relatório'), place: ctx.place, date: dateLong(v.data) },
      { type: 'title', text: `Relatório ${tipo ? `${tipo.toLowerCase()} ` : ''}de actividades`, subtitle: `${semPonto(v.periodo) || BLANK} — ${unidade}` },
    ];
    const sec = (titulo: string, name: string, lista = false) => {
      const ps = paragraphs(v[name]).map(stripNumber);
      if (!ps.length) return;
      k++;
      blocks.push({ type: 'heading', text: `${k}. ${titulo}` });
      if (lista && ps.length > 1) blocks.push({ type: 'list', style: 'bullet', items: ps });
      else ps.forEach((p, i) => blocks.push({ type: 'paragraph', id: `${name}-${i + 1}`, text: p, en: titulo }));
    };
    sec('Introdução', 'introducao');
    k++;
    blocks.push({ type: 'heading', text: `${k}. Actividades realizadas` });
    const grau = (r: Record<string, unknown>) => {
      const m = n(r.meta);
      const re = n(r.realizado);
      return m && re != null ? `${formatNumber((re / m) * 100, 0)}%` : '';
    };
    blocks.push({
      type: 'table',
      columns: [
        { label: 'N.º', width: 0.4, align: 'right' },
        { label: 'Actividade', width: 2.8 },
        { label: 'Meta', width: 0.9, align: 'right' },
        { label: 'Realizado', width: 0.9, align: 'right' },
        { label: 'Grau', width: 0.7, align: 'right' },
        { label: 'Observações', width: 2 },
      ],
      rows: (acts.length ? acts : [{}, {}, {}]).map((r, i) => [String(i + 1), str(r.actividade), str(r.meta), str(r.realizado), grau(r), str(r.observacoes)]),
      grid: !acts.length,
    });
    if (orc.length) {
      k++;
      const td = orc.reduce((s, r) => s + (money(r.dotacao) ?? 0), 0);
      const te = orc.reduce((s, r) => s + (money(r.executado) ?? 0), 0);
      const pc = (d: number | null, e: number | null) => (d && e != null ? `${formatNumber((e / d) * 100, 1)}%` : '');
      blocks.push(
        { type: 'heading', text: `${k}. Execução orçamental` },
        {
          type: 'table',
          columns: [
            { label: 'Rubrica', width: 3 },
            { label: 'Dotação (MT)', width: 1.4, align: 'right' },
            { label: 'Executado (MT)', width: 1.4, align: 'right' },
            { label: 'Execução', width: 0.9, align: 'right' },
          ],
          rows: orc.map((r) => [str(r.rubrica), money(r.dotacao) != null ? formatMoney(money(r.dotacao), false) : '', money(r.executado) != null ? formatMoney(money(r.executado), false) : '', pc(money(r.dotacao), money(r.executado))]),
          totals: [['Total', formatMoney(td, false), formatMoney(te, false), pc(td, te)]],
        },
      );
    }
    sec('Constrangimentos', 'constrangimentos', true);
    sec('Perspectivas para o período seguinte', 'perspectivas', true);
    sec('Conclusão', 'conclusao');
    blocks.push(
      { type: 'paragraph', id: 'local', text: `${ctx.place}, ${dateLong(v.data)}.`, align: 'left', keepWithNext: true, en: 'Place and date.' },
      {
        type: 'signatures',
        columns: [
          { role: 'Elaborado por', name: str(v.elaboradoNome) || undefined, detail: str(v.elaboradoCargo) || undefined },
          { ...signatarioColumn(v), role: `Aprovado — ${signatarioColumn(v).role}` },
        ],
      },
    );
    return blocks;
  },
});
