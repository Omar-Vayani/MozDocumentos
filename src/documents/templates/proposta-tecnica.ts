// Proposta técnica: the structured technical bid for services or consultancy
// (bidder profile, understanding of the terms of reference, methodology, work
// plan, team and similar experience).

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateLong, l, lineItems } from './_shared';
import { paragraphs } from './_estado';
import { concorrenteFields, concorrenteNome, concorrenteSignature, concorrenteWarnings, formularioWarning, procedimentoFields, procedimentoNome, semPonto, str } from './_contratacao';

const SECOES = [
  { name: 'apresentacao', titulo: 'Apresentação do concorrente', label: l('Apresentação do concorrente', 'Bidder profile'), help: l('Quem é a empresa: constituição, actividade, alvará ou inscrição no Cadastro Único, meios humanos e técnicos.', 'Who the company is: incorporation, business, licence or registration, staff and equipment.') },
  { name: 'compreensao', titulo: 'Compreensão dos termos de referência', label: l('Compreensão dos termos de referência', 'Understanding of the terms of reference'), help: l('Mostre que entendeu o contexto, os objectivos e os resultados pretendidos. Comentários e sugestões aos termos de referência.', 'Show you understand the context, objectives and results. Comments and suggestions on the terms of reference.') },
  { name: 'metodologia', titulo: 'Metodologia e abordagem', label: l('Metodologia e abordagem', 'Methodology and approach'), help: l('Como vai executar o trabalho: fases, actividades, instrumentos, controlo de qualidade, gestão de riscos.', 'How you will do the work: phases, activities, tools, quality control, risk management.') },
] as const;

export default defineTemplate({
  id: 'proposta-tecnica',
  family: 'carta',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'procedimento', title: l('Concurso', 'Tender') },
    { id: 'concorrente', title: l('Concorrente', 'Bidder'), personRole: 'outro' },
    { id: 'texto', title: l('Apresentação, compreensão e metodologia', 'Profile, understanding and methodology') },
    { id: 'plano', title: l('Plano de trabalho', 'Work plan') },
    { id: 'equipa', title: l('Equipa e experiência', 'Team and experience') },
  ],
  fields: [
    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', label: l('Data', 'Date'), default: (c) => c.today },
    { name: 'entidadeNome', type: 'text', section: 'procedimento', required: true, label: l('Entidade contratante', 'Contracting body') },
    ...procedimentoFields(),
    ...concorrenteFields(),
    ...SECOES.map((s) => ({ name: s.name, type: 'textarea' as const, section: 'texto', rows: 5, label: s.label, help: s.help })),
    {
      name: 'actividades',
      type: 'lines',
      section: 'plano',
      label: l('Actividades e calendário', 'Activities and schedule'),
      addLabel: l('Adicionar actividade', 'Add activity'),
      columns: [
        { name: 'actividade', type: 'text', label: l('Actividade', 'Activity') },
        { name: 'periodo', type: 'text', label: l('Período / semanas', 'Period / weeks'), placeholder: l('Ex.: semanas 1–2', 'E.g. weeks 1–2') },
        { name: 'produto', type: 'text', label: l('Produto / resultado', 'Deliverable') },
      ],
      default: [],
    },
    {
      name: 'equipa',
      type: 'lines',
      section: 'equipa',
      label: l('Equipa proposta', 'Proposed team'),
      addLabel: l('Adicionar membro', 'Add member'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'funcao', type: 'text', label: l('Função no trabalho', 'Role') },
        { name: 'formacao', type: 'text', label: l('Formação', 'Qualification') },
        { name: 'experiencia', type: 'text', label: l('Experiência (anos)', 'Experience (years)') },
      ],
      default: [],
      help: l('Junte os currículos assinados de cada membro, se o documento de concurso os exigir.', 'Attach signed CVs of each member if the tender requires them.'),
    },
    {
      name: 'experiencia',
      type: 'lines',
      section: 'equipa',
      label: l('Trabalhos similares realizados', 'Similar assignments'),
      addLabel: l('Adicionar trabalho', 'Add assignment'),
      columns: [
        { name: 'cliente', type: 'text', label: l('Cliente', 'Client') },
        { name: 'objecto', type: 'text', label: l('Objecto', 'Subject') },
        { name: 'ano', type: 'text', label: l('Ano', 'Year') },
        { name: 'valor', type: 'text', label: l('Valor (opcional)', 'Value (optional)') },
      ],
      default: [],
      help: l('Junte declarações de boa execução dos clientes, quando exigidas.', 'Attach clients’ completion certificates when required.'),
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [...concorrenteWarnings(v), formularioWarning()];
    for (const s of SECOES) if (!paragraphs(v[s.name]).length) w.push({ level: 'warning', field: s.name, message: l(`Escreva a secção «${s.titulo}».`, `Write the section “${s.label.en}”.`) });
    w.push({ level: 'info', message: l('A proposta técnica não deve conter preços quando o documento de concurso exigir envelopes separados para a proposta técnica e a financeira.', 'Do not include prices in the technical bid when the tender requires separate technical and financial envelopes.') });
    return w;
  },

  personName: (v) => v.entidadeNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const blocks: Block[] = [
      { type: 'title', text: 'Proposta técnica', subtitle: procedimentoNome(v) },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Entidade contratante', value: str(v.entidadeNome) || '—' },
          { label: 'Objecto', value: semPonto(v.objecto) || '—' },
          { label: 'Concorrente', value: concorrenteNome(v) || '—' },
          { label: 'Data', value: dateLong(v.data) },
        ],
      },
    ];
    let n = 0;
    for (const s of SECOES) {
      n++;
      blocks.push({ type: 'heading', text: `${n}. ${s.titulo}` });
      const ps = paragraphs(v[s.name]);
      if (!ps.length) blocks.push({ type: 'paragraph', id: s.name, text: `${BLANK}${BLANK}${BLANK}`, en: s.label.en });
      ps.forEach((p, i) => blocks.push({ type: 'paragraph', id: `${s.name}-${i + 1}`, text: p, en: s.label.en }));
    }
    const act = lineItems(v.actividades).filter((r) => str(r.actividade));
    n++;
    blocks.push({ type: 'heading', text: `${n}. Plano de trabalho e calendário` });
    blocks.push({
      type: 'table',
      columns: [
        { label: 'N.º', width: 0.4, align: 'right' },
        { label: 'Actividade', width: 3 },
        { label: 'Período', width: 1.2 },
        { label: 'Produto / resultado', width: 2.2 },
      ],
      rows: (act.length ? act : [{}, {}, {}]).map((r, i) => [String(i + 1), str(r.actividade), str(r.periodo), str(r.produto)]),
      grid: !act.length,
    });
    const eq = lineItems(v.equipa).filter((r) => str(r.nome) || str(r.funcao));
    n++;
    blocks.push({ type: 'heading', text: `${n}. Equipa proposta` });
    blocks.push({
      type: 'table',
      columns: [
        { label: 'Nome', width: 2 },
        { label: 'Função', width: 1.6 },
        { label: 'Formação', width: 2 },
        { label: 'Experiência', width: 1, align: 'center' },
      ],
      rows: (eq.length ? eq : [{}, {}, {}]).map((r) => [str(r.nome), str(r.funcao), str(r.formacao), str(r.experiencia) ? `${semPonto(r.experiencia).replace(/\s*anos?$/i, '')} anos` : '']),
      grid: !eq.length,
    });
    const ex = lineItems(v.experiencia).filter((r) => str(r.cliente) || str(r.objecto));
    n++;
    blocks.push({ type: 'heading', text: `${n}. Experiência em trabalhos similares` });
    blocks.push({
      type: 'table',
      columns: [
        { label: 'Cliente', width: 1.8 },
        { label: 'Objecto', width: 3 },
        { label: 'Ano', width: 0.6, align: 'center' },
        { label: 'Valor', width: 1.2, align: 'right' },
      ],
      rows: (ex.length ? ex : [{}, {}, {}]).map((r) => [str(r.cliente), str(r.objecto), str(r.ano), str(r.valor)]),
      grid: !ex.length,
    });
    blocks.push(
      {
        type: 'paragraph',
        id: 'declaracao',
        text: 'O concorrente declara que as informações constantes da presente proposta técnica são verdadeiras e que mantém disponíveis, durante a execução do contrato, os meios e a equipa nela indicados.',
        keepWithNext: true,
        en: 'The bidder declares the information is true and that the stated team and resources will remain available.',
      },
      { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [concorrenteSignature(ctx)] },
    );
    return blocks;
  },
});
