// Termos de referência: the specification of a services or consultancy
// contract (background, objectives, scope, deliverables, duration, profile,
// reporting, payment and evaluation criteria), prepared by the requesting unit
// and approved before the procedure starts.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, entityName, l, lineItems, localField } from './_shared';
import { paragraphs, signatarioColumn, signatarioFields, stripNumber } from './_estado';
import { entidadeProfileWarning, semPonto, str } from './_contratacao';

const TEXTOS = [
  { name: 'contexto', titulo: 'Contexto e justificação', label: l('Contexto e justificação', 'Background and rationale'), help: l('Porque é preciso o serviço: situação actual, problema, programa ou projecto em que se insere.', 'Why the service is needed: current situation, problem, programme.') },
  { name: 'objectivos', titulo: 'Objectivos', label: l('Objectivos', 'Objectives'), help: l('Primeira linha: objectivo geral. Linhas seguintes: objectivos específicos.', 'First line: general objective. Next lines: specific objectives.') },
  { name: 'ambito', titulo: 'Âmbito e actividades', label: l('Âmbito e actividades', 'Scope and tasks'), help: l('Uma actividade por linha: o que o prestador deve fazer.', 'One task per line: what the provider must do.') },
] as const;

const TEXTOS2 = [
  { name: 'perfil', titulo: 'Perfil do prestador e da equipa', label: l('Perfil do prestador e da equipa', 'Provider and team profile'), help: l('Uma exigência por linha: formação, anos de experiência, trabalhos similares, línguas, licenças.', 'One requirement per line: qualifications, years of experience, similar work, languages, licences.') },
  { name: 'relatorios', titulo: 'Coordenação, relatórios e aprovação', label: l('Coordenação, relatórios e aprovação', 'Coordination, reporting and approval'), help: l('A quem o prestador reporta, reuniões, prazo para comentar e aprovar os produtos.', 'Who the provider reports to, meetings, time to comment and approve deliverables.') },
  { name: 'obrigacoes', titulo: 'Obrigações da entidade contratante', label: l('Obrigações da entidade contratante', 'Contracting body’s obligations'), help: l('Documentos, espaço, transporte ou apoio que a entidade fornece.', 'Documents, office space, transport or support the body provides.') },
] as const;

export default defineTemplate({
  id: 'termos-de-referencia',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Identificação', 'Identification') },
    { id: 'texto', title: l('Contexto, objectivos e actividades', 'Background, objectives and tasks') },
    { id: 'produtos', title: l('Produtos, prazo e local', 'Deliverables, time and place') },
    { id: 'perfil', title: l('Perfil, relatórios e obrigações', 'Profile, reporting and obligations') },
    { id: 'pagamento', title: l('Pagamento e avaliação', 'Payment and evaluation') },
    { id: 'assinatura', title: l('Elaboração e aprovação', 'Prepared and approved') },
  ],
  fields: [
    {
      name: 'objecto',
      type: 'text',
      section: 'documento',
      required: true,
      label: l('Serviço a contratar', 'Service to procure'),
      placeholder: l('Ex.: Contratação de serviços de fiscalização da reabilitação de cinco centros de saúde', 'E.g. Supervision services for the rehabilitation of five health centres'),
    },
    { name: 'concursoNumero', type: 'text', section: 'documento', width: 'half', label: l('Procedimento n.º (opcional)', 'Procedure no. (optional)') },
    localField(),
    dateField('data'),
    ...TEXTOS.map((s) => ({ name: s.name, type: 'textarea' as const, section: 'texto', rows: 4, label: s.label, help: s.help })),
    {
      name: 'produtos',
      type: 'lines',
      section: 'produtos',
      label: l('Produtos esperados', 'Deliverables'),
      addLabel: l('Adicionar produto', 'Add deliverable'),
      columns: [
        { name: 'produto', type: 'text', label: l('Produto', 'Deliverable') },
        { name: 'prazo', type: 'text', label: l('Prazo de entrega', 'Due') },
      ],
      default: [],
    },
    { name: 'duracao', type: 'text', section: 'produtos', width: 'half', label: l('Duração do contrato', 'Contract duration'), placeholder: l('Ex.: oito meses', 'E.g. eight months') },
    { name: 'localExecucao', type: 'text', section: 'produtos', width: 'half', label: l('Local de execução', 'Place of performance') },
    ...TEXTOS2.map((s) => ({ name: s.name, type: 'textarea' as const, section: 'perfil', rows: 3, label: s.label, help: s.help })),
    {
      name: 'pagamentos',
      type: 'lines',
      section: 'pagamento',
      label: l('Plano de pagamentos', 'Payment schedule'),
      addLabel: l('Adicionar prestação', 'Add instalment'),
      columns: [
        { name: 'condicao', type: 'text', label: l('Contra a aprovação de', 'On approval of') },
        { name: 'percentagem', type: 'number', label: l('Percentagem', 'Percentage') },
      ],
      default: [],
    },
    {
      name: 'criterios',
      type: 'lines',
      section: 'pagamento',
      label: l('Critérios de avaliação das propostas técnicas', 'Technical evaluation criteria'),
      addLabel: l('Adicionar critério', 'Add criterion'),
      columns: [
        { name: 'criterio', type: 'text', label: l('Critério', 'Criterion') },
        { name: 'pontos', type: 'number', label: l('Pontos', 'Points') },
      ],
      default: [],
      help: l('Deixe vazio quando o critério for só o preço.', 'Leave empty when price is the only criterion.'),
    },
    { name: 'elaboradoNome', type: 'text', section: 'assinatura', width: 'half', label: l('Elaborado por (nome)', 'Prepared by (name)') },
    { name: 'elaboradoCargo', type: 'text', section: 'assinatura', width: 'half', label: l('Cargo de quem elaborou', 'Position'), placeholder: l('Ex.: Chefe do Departamento de Infra-estruturas', 'E.g. Head of Infrastructure') },
    ...signatarioFields('assinatura', l('Cargo de quem aprova', 'Approver’s position')),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...entidadeProfileWarning(ctx)];
    for (const s of TEXTOS) if (!paragraphs(v[s.name]).length) w.push({ level: 'warning', field: s.name, message: l(`Preencha «${s.titulo}».`, `Fill in “${s.label.en}”.`) });
    const pag = lineItems(v.pagamentos);
    const soma = pag.reduce((t, r) => t + (Number(r.percentagem) || 0), 0);
    if (pag.length && Math.abs(soma - 100) > 0.01) w.push({ level: 'warning', field: 'pagamentos', message: l(`Os pagamentos somam ${soma}%; devem somar cem por cento.`, `Payments add up to ${soma}%; they must add up to one hundred per cent.`) });
    const crit = lineItems(v.criterios);
    const pts = crit.reduce((t, r) => t + (Number(r.pontos) || 0), 0);
    if (crit.length && pts !== 100) w.push({ level: 'info', field: 'criterios', message: l(`Os critérios somam ${pts} pontos; é habitual somarem 100.`, `Criteria add up to ${pts} points; they usually add up to 100.`) });
    w.push({ level: 'info', message: l('Os termos de referência integram o documento de concurso e o contrato: descreva resultados verificáveis e evite exigências que excluam concorrentes sem justificação.', 'The terms of reference form part of the tender and the contract: describe verifiable results and avoid requirements that exclude bidders without reason.') });
    return w;
  },

  personName: (v) => v.objecto,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const blocks: Block[] = [{ type: 'title', text: 'Termos de referência', subtitle: semPonto(v.objecto) || undefined }];
    if (str(v.concursoNumero)) blocks.push({ type: 'paragraph', id: 'procedimento', text: `Procedimento n.º ${semPonto(v.concursoNumero)} — ${entityName(ctx)}`, align: 'center', size: 'small', en: 'Procedure number.' });
    let n = 0;
    const secao = (titulo: string, name: string, lista = false) => {
      n++;
      blocks.push({ type: 'heading', text: `${n}. ${titulo}` });
      const ps = paragraphs(v[name]).map(stripNumber);
      if (!ps.length) {
        blocks.push({ type: 'paragraph', id: name, text: `${BLANK}${BLANK}${BLANK}`, en: titulo });
        return;
      }
      if (name === 'objectivos' && ps.length > 1) {
        blocks.push({ type: 'paragraph', id: 'objectivo-geral', text: `**Objectivo geral:** ${ps[0]}`, en: 'General objective.' });
        blocks.push({ type: 'paragraph', id: 'objectivos-especificos', text: '**Objectivos específicos:**', keepWithNext: true, en: 'Specific objectives:' });
        blocks.push({ type: 'list', style: 'alpha', items: ps.slice(1) });
        return;
      }
      if (lista && ps.length > 1) blocks.push({ type: 'list', style: 'alpha', items: ps });
      else ps.forEach((p, i) => blocks.push({ type: 'paragraph', id: `${name}-${i + 1}`, text: p, en: titulo }));
    };
    secao('Contexto e justificação', 'contexto');
    secao('Objectivos', 'objectivos');
    secao('Âmbito e actividades', 'ambito', true);

    const prods = lineItems(v.produtos).filter((r) => str(r.produto));
    n++;
    blocks.push({ type: 'heading', text: `${n}. Produtos esperados` });
    blocks.push({
      type: 'table',
      columns: [
        { label: 'N.º', width: 0.4, align: 'right' },
        { label: 'Produto', width: 4.2 },
        { label: 'Prazo de entrega', width: 2 },
      ],
      rows: (prods.length ? prods : [{}, {}]).map((r, i) => [String(i + 1), str(r.produto), str(r.prazo)]),
      grid: !prods.length,
    });
    n++;
    blocks.push(
      { type: 'heading', text: `${n}. Duração e local de execução` },
      {
        type: 'paragraph',
        id: 'duracao',
        text: `O contrato tem a duração de ${semPonto(v.duracao) || BLANK}, contada da data da sua assinatura${str(v.localExecucao) ? `, e os serviços são prestados em ${semPonto(v.localExecucao)}` : ''}.`,
        en: 'Duration and place of performance.',
      },
    );
    secao('Perfil do prestador e da equipa', 'perfil', true);
    secao('Coordenação, relatórios e aprovação', 'relatorios');
    secao('Obrigações da entidade contratante', 'obrigacoes', true);

    const pag = lineItems(v.pagamentos).filter((r) => str(r.condicao));
    if (pag.length) {
      n++;
      blocks.push(
        { type: 'heading', text: `${n}. Forma de pagamento` },
        {
          type: 'table',
          columns: [
            { label: 'Prestação', width: 0.9, align: 'center' },
            { label: 'Contra a aprovação de', width: 4.4 },
            { label: '% do preço', width: 1.2, align: 'right' },
          ],
          rows: pag.map((r, i) => [`${i + 1}.ª`, str(r.condicao), r.percentagem ? `${String(r.percentagem).replace('.', ',')}%` : '']),
        },
      );
    }
    const crit = lineItems(v.criterios).filter((r) => str(r.criterio));
    if (crit.length) {
      n++;
      const total = crit.reduce((t, r) => t + (Number(r.pontos) || 0), 0);
      blocks.push(
        { type: 'heading', text: `${n}. Critérios de avaliação` },
        {
          type: 'table',
          columns: [
            { label: 'Critério', width: 5.2 },
            { label: 'Pontos', width: 1.2, align: 'right' },
          ],
          rows: crit.map((r) => [str(r.criterio), str(r.pontos)]),
          totals: [['Total', String(total)]],
        },
      );
    }
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
