import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, g, l, localField, refField, splitLines, workerFields } from './_shared';

const trim = (s: unknown) => String(s ?? '').trim();
const sentence = (s: string) => (/[.!?:]$/.test(s) ? s : `${s}.`);

export default defineTemplate({
  id: 'descricao-de-funcoes',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'cargo', title: l('Identificação do cargo', 'Position') },
    { id: 'conteudo', title: l('Objectivo e responsabilidades', 'Purpose and responsibilities') },
    { id: 'requisitos', title: l('Requisitos', 'Requirements') },
    { id: 'condicoes', title: l('Condições de trabalho', 'Working conditions') },
    { id: 'assinaturas', title: l('Elaboração e aprovação', 'Prepared and approved by') },
    { id: 'trabalhador', title: l('Titular do cargo (opcional)', 'Job holder (optional)'), personRole: 'trabalhador' },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data', 'Date')),
    {
      name: 'versao',
      type: 'text',
      section: 'documento',
      width: 'half',
      label: l('Versão (opcional)', 'Version (optional)'),
      placeholder: l('Ex.: 1.0', 'E.g. 1.0'),
    },
    ...workerFields(['cargo', 'categoria', 'departamento'], 'cargo').map((f) =>
      f.name === 'trabalhadorCargo' ? { ...f, required: true, label: l('Designação do cargo', 'Job title') } : f,
    ),
    { name: 'reportaA', type: 'text', section: 'cargo', width: 'half', label: l('Reporta a', 'Reports to'), placeholder: l('Ex.: Director Financeiro', 'E.g. Finance Director') },
    { name: 'supervisiona', type: 'text', section: 'cargo', width: 'half', label: l('Supervisiona (opcional)', 'Supervises (optional)'), placeholder: l('Ex.: Assistentes de contabilidade', 'E.g. Accounting assistants') },
    { name: 'localTrabalho', type: 'text', section: 'cargo', width: 'half', label: l('Local de trabalho', 'Workplace') },
    {
      name: 'objectivo',
      type: 'textarea',
      section: 'conteudo',
      rows: 3,
      required: true,
      label: l('Objectivo do cargo', 'Purpose of the position'),
      help: l('Uma ou duas frases: para que existe o cargo.', 'One or two sentences: why the position exists.'),
      placeholder: l(
        'Ex.: Assegurar o registo contabilístico rigoroso e atempado das operações da empresa e o cumprimento das obrigações fiscais.',
        'E.g. Ensure accurate and timely bookkeeping and compliance with tax obligations.',
      ),
    },
    {
      name: 'responsabilidades',
      type: 'textarea',
      section: 'conteudo',
      rows: 8,
      required: true,
      label: l('Responsabilidades e tarefas', 'Responsibilities and tasks'),
      help: l('Uma por linha, começando por um verbo (Elaborar, Controlar, Garantir…).', 'One per line, starting with a verb (Prepare, Monitor, Ensure…).'),
    },
    { name: 'formacao', type: 'text', section: 'requisitos', label: l('Formação académica', 'Education'), placeholder: l('Ex.: Licenciatura em Contabilidade e Auditoria', 'E.g. Degree in Accounting and Auditing') },
    { name: 'experiencia', type: 'text', section: 'requisitos', label: l('Experiência profissional', 'Experience'), placeholder: l('Ex.: Mínimo de três anos em funções equivalentes', 'E.g. At least three years in a similar role') },
    {
      name: 'competencias',
      type: 'textarea',
      section: 'requisitos',
      rows: 4,
      label: l('Competências', 'Skills'),
      help: l('Uma por linha.', 'One per line.'),
      placeholder: l('Ex.: Domínio do Primavera ERP\nBoa capacidade de organização', 'E.g. Primavera ERP\nGood organisational skills'),
    },
    {
      name: 'outrosRequisitos',
      type: 'textarea',
      section: 'requisitos',
      rows: 2,
      label: l('Outros requisitos (opcional)', 'Other requirements (optional)'),
      help: l('Uma por linha. Ex.: carta de condução, línguas.', 'One per line. E.g. driving licence, languages.'),
    },
    {
      name: 'condicoesTrabalho',
      type: 'textarea',
      section: 'condicoes',
      rows: 3,
      label: l('Condições de trabalho', 'Working conditions'),
      help: l('Uma por linha: horário, deslocações, equipamento de protecção, trabalho por turnos…', 'One per line: hours, travel, protective equipment, shift work…'),
    },
    { name: 'elaboradoNome', type: 'text', section: 'assinaturas', width: 'half', label: l('Elaborado por (nome)', 'Prepared by (name)') },
    { name: 'elaboradoCargo', type: 'text', section: 'assinaturas', width: 'half', label: l('Cargo', 'Position'), placeholder: l('Ex.: Técnico de Recursos Humanos', 'E.g. HR Officer') },
    {
      name: 'aprovadoNome',
      type: 'text',
      section: 'assinaturas',
      width: 'half',
      label: l('Aprovado por (nome)', 'Approved by (name)'),
      default: (c) => c.profile?.representanteNome ?? '',
    },
    {
      name: 'aprovadoCargo',
      type: 'text',
      section: 'assinaturas',
      width: 'half',
      label: l('Cargo', 'Position'),
      default: (c) => c.profile?.representanteCargo ?? '',
    },
    ...workerFields(['nome', 'genero'], 'trabalhador').map((f) =>
      f.name === 'trabalhadorNome' ? { ...f, required: false, label: l('Nome do titular do cargo', 'Job holder’s name') } : f,
    ),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    const resp = splitLines(v.responsabilidades);
    if (resp.length > 0 && resp.length < 3) {
      w.push({
        level: 'info',
        field: 'responsabilidades',
        message: l('Indique pelo menos as principais responsabilidades do cargo (normalmente entre cinco e dez).', 'List at least the main responsibilities (usually five to ten).'),
      });
    }
    if (!trim(v.reportaA)) {
      w.push({ level: 'info', field: 'reportaA', message: l('Indique a quem o cargo reporta.', 'State who the position reports to.') });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome || v.trabalhadorCargo,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ge = v.trabalhadorGenero;
    const cargo = trim(v.trabalhadorCargo);
    const resp = splitLines(v.responsabilidades);
    const comp = splitLines(v.competencias);
    const outros = splitLines(v.outrosRequisitos);
    const condicoes = splitLines(v.condicoesTrabalho);

    const ident: { label: string; value: string }[] = [{ label: 'Cargo', value: cargo || BLANK }];
    if (trim(v.trabalhadorCategoria)) ident.push({ label: 'Categoria profissional', value: trim(v.trabalhadorCategoria) });
    ident.push(
      { label: 'Departamento', value: trim(v.trabalhadorDepartamento) || BLANK },
      { label: 'Reporta a', value: trim(v.reportaA) || BLANK },
    );
    if (trim(v.supervisiona)) ident.push({ label: 'Supervisiona', value: trim(v.supervisiona) });
    if (trim(v.localTrabalho)) ident.push({ label: 'Local de trabalho', value: trim(v.localTrabalho) });
    if (trim(v.trabalhadorNome)) ident.push({ label: 'Titular do cargo', value: trim(v.trabalhadorNome) });
    if (trim(v.versao)) ident.push({ label: 'Versão', value: trim(v.versao) });

    const blocks: Block[] = [
      { type: 'title', text: 'Descrição de funções', subtitle: cargo || undefined },
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'keyValue', title: 'Identificação do cargo', columns: 2, items: ident },
      { type: 'heading', text: '1. Objectivo do cargo' },
      {
        type: 'paragraph',
        id: 'objectivo',
        text: trim(v.objectivo) ? sentence(trim(v.objectivo)) : BLANK,
        en: trim(v.objectivo) || '—',
      },
      { type: 'heading', text: '2. Responsabilidades e tarefas' },
      { type: 'list', style: 'numeric', items: resp.length ? resp.map(sentence) : [BLANK, BLANK, BLANK] },
      { type: 'heading', text: '3. Requisitos do cargo' },
      {
        type: 'keyValue',
        columns: 1,
        items: [
          { label: 'Formação académica', value: trim(v.formacao) || BLANK },
          { label: 'Experiência profissional', value: trim(v.experiencia) || BLANK },
        ],
      },
    ];
    if (comp.length) {
      blocks.push(
        { type: 'paragraph', id: 'competenciasIntro', text: '**Competências:**', align: 'left', editable: false, keepWithNext: true },
        { type: 'list', style: 'bullet', items: comp },
      );
    }
    if (outros.length) {
      blocks.push(
        { type: 'paragraph', id: 'outrosIntro', text: '**Outros requisitos:**', align: 'left', editable: false, keepWithNext: true },
        { type: 'list', style: 'bullet', items: outros },
      );
    }
    if (condicoes.length) {
      blocks.push({ type: 'heading', text: '4. Condições de trabalho' }, { type: 'list', style: 'bullet', items: condicoes.map(sentence) });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'naoExaustiva',
        text: 'A presente descrição não é exaustiva. O titular do cargo pode ser chamado a desempenhar outras tarefas compatíveis com a sua categoria profissional e qualificação, nos termos da Lei do Trabalho e do respectivo contrato de trabalho.',
        en: 'This description is not exhaustive. The job holder may be asked to perform other tasks compatible with their job grade and qualifications, under the Labour Law and their employment contract.',
        size: 'small',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.data)}`,
        columns: [
          { role: 'Elaborado por', name: trim(v.elaboradoNome) || undefined, detail: trim(v.elaboradoCargo) || undefined },
          { role: 'Aprovado por', name: trim(v.aprovadoNome) || undefined, detail: trim(v.aprovadoCargo) || undefined, image: 'both' },
          { role: 'Tomei conhecimento', name: trim(v.trabalhadorNome) || undefined, detail: g(ge, 'O Trabalhador', 'A Trabalhadora') },
        ],
      },
    );
    return blocks;
  },
});
