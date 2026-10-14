// Declaração do supervisor de trabalho de fim de curso: the supervisor
// accepts to supervise a student's final project, or states that the work is
// finished and ready for submission and public defence.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, GENERO_OPTIONS, isF, l, localField, placeDate } from './_shared';
import { or, semPonto, str } from './_saude-educacao';

const TIPO_OPTIONS = [
  { value: 'aceitacao', label: l('Aceitação da supervisão', 'Agreement to supervise'), title: 'Declaração de Aceitação de Supervisão' },
  { value: 'defesa', label: l('Trabalho pronto para entrega e defesa', 'Work ready for submission and defence'), title: 'Declaração do Supervisor' },
];

const TRABALHO_OPTIONS = [
  { value: 'monografia científica', label: l('Monografia', 'Dissertation (BA)') },
  { value: 'dissertação de mestrado', label: l('Dissertação de mestrado', 'Master’s thesis') },
  { value: 'projecto de fim de curso', label: l('Projecto', 'Project') },
  { value: 'relatório de estágio', label: l('Relatório de estágio', 'Internship report') },
  { value: 'tese de doutoramento', label: l('Tese de doutoramento', 'PhD thesis') },
];

export default defineTemplate({
  id: 'declaracao-orientacao-tfc',
  family: 'declaracao',
  sections: [
    { id: 'documento', title: l('Declaração', 'Declaration') },
    { id: 'estudante', title: l('Estudante e trabalho', 'Student and work'), personRole: 'outro' },
    { id: 'supervisor', title: l('Supervisor', 'Supervisor') },
  ],
  fields: [
    { name: 'tipo', type: 'select', section: 'documento', label: l('Tipo', 'Kind'), options: TIPO_OPTIONS.map(({ value, label }) => ({ value, label })), default: 'defesa' },
    { name: 'instituicao', type: 'text', section: 'documento', label: l('Instituição', 'Institution'), default: (c) => (c.profile?.kind === 'empresa' ? c.profile.nomeComercial || c.profile.firma || '' : '') },
    { name: 'faculdade', type: 'text', section: 'documento', width: 'half', label: l('Faculdade / escola (opcional)', 'Faculty (optional)') },
    { name: 'curso', type: 'text', section: 'documento', width: 'half', required: true, label: l('Curso', 'Programme'), placeholder: l('Ex.: Licenciatura em Gestão', 'E.g. BA in Management') },
    localField(),
    dateField(),
    { name: 'estudanteNome', type: 'text', section: 'estudante', required: true, label: l('Nome do estudante', 'Student’s name'), personKey: 'nome' },
    { name: 'estudanteGenero', type: 'radio', section: 'estudante', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'estudanteNumero', type: 'text', section: 'estudante', width: 'half', label: l('N.º de estudante', 'Student no.') },
    { name: 'trabalhoTipo', type: 'select', section: 'estudante', width: 'half', label: l('Tipo de trabalho', 'Kind of work'), options: TRABALHO_OPTIONS, default: 'monografia científica' },
    { name: 'tema', type: 'text', section: 'estudante', required: true, label: l('Tema / título', 'Title') },
    { name: 'supervisorNome', type: 'text', section: 'supervisor', width: 'half', required: true, label: l('Nome do supervisor', 'Supervisor’s name'), default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.nome : '') },
    { name: 'supervisorGenero', type: 'radio', section: 'supervisor', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'supervisorTitulo', type: 'text', section: 'supervisor', width: 'half', label: l('Grau / título', 'Degree / title'), placeholder: l('Ex.: Prof. Doutor · Mestre', 'E.g. Prof. Dr · MSc') },
    { name: 'supervisorCategoria', type: 'text', section: 'supervisor', width: 'half', label: l('Categoria ou afiliação', 'Position or affiliation'), placeholder: l('Ex.: docente auxiliar da Faculdade de Economia', 'E.g. lecturer, Faculty of Economics') },
    { name: 'coSupervisor', type: 'text', section: 'supervisor', width: 'half', label: l('Co-supervisor (opcional)', 'Co-supervisor (optional)') },
    { name: 'parecer', type: 'textarea', section: 'supervisor', rows: 3, label: l('Breve apreciação (opcional)', 'Short assessment (optional)'), showIf: (v) => v.tipo === 'defesa' },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.tema)) w.push({ level: 'error', field: 'tema', message: l('Indique o tema do trabalho.', 'Enter the title.') });
    if (v.tipo === 'defesa') w.push({ level: 'info', message: l(`Confirme a originalidade do trabalho antes de dar parecer favorável (${cite('sePlagio')}). O prazo e a forma de entrega constam do regulamento da instituição.`, 'Check originality before approving; deadlines follow the institution’s rules.') });
    return w;
  },

  personName: (v) => v.estudanteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const t = TIPO_OPTIONS.find((x) => x.value === v.tipo) ?? TIPO_OPTIONS[1];
    const fs = isF(v.supervisorGenero);
    const fe = isF(v.estudanteGenero);
    const sup = `**${or(v.supervisorNome)}**${str(v.supervisorTitulo) ? ` (${str(v.supervisorTitulo)})` : ''}${str(v.supervisorCategoria) ? `, ${semPonto(v.supervisorCategoria)}` : ''}`;
    const est = `${fe ? 'da estudante' : 'do estudante'} **${or(v.estudanteNome)}**${str(v.estudanteNumero) ? `, n.º ${str(v.estudanteNumero)}` : ''}, do curso de ${or(v.curso)}${str(v.faculdade) ? `, da ${str(v.faculdade)}` : ''}${str(v.instituicao) ? `, ${str(v.instituicao)}` : ''}`;
    const tt = str(v.trabalhoTipo) || 'monografia científica';
    const m = /^(projecto|relatório)/.test(tt);
    const a = m ? 'o' : 'a';
    const trabalho = `${tt} ${m ? 'intitulado' : 'intitulada'} «${semPonto(v.tema) || '____________________'}»`;
    const co = str(v.coSupervisor) ? `, com a co-supervisão de ${str(v.coSupervisor)}` : '';
    const blocks: Block[] = [{ type: 'title', text: t.title }];
    if (v.tipo === 'aceitacao') {
      blocks.push({
        type: 'paragraph',
        id: 'aceita',
        text: `Eu, ${sup}, declaro que aceito supervisionar ${a} ${trabalho}, ${est}${co}, comprometendo-me a acompanhar a sua elaboração nos termos do regulamento de culminação de estudos da instituição.`,
        en: `I agree to supervise the work titled "${v.tema || '___'}" by ${v.estudanteNome || '___'}${v.coSupervisor ? `, co-supervised by ${v.coSupervisor}` : ''}, under the institution’s rules.`,
      });
    } else {
      blocks.push({
        type: 'paragraph',
        id: 'defesa',
        text: `Eu, ${sup}, na qualidade de ${fs ? 'supervisora' : 'supervisor'}, declaro que ${a} ${trabalho}, ${m ? 'elaborado' : 'elaborada'} ${est}${co}, se encontra ${m ? 'concluído' : 'concluída'} e reúne as condições para ser ${m ? 'submetido' : 'submetida'} a avaliação e defesa pública, pelo que dou parecer favorável à sua entrega.`,
        en: `As supervisor, I declare that the work titled "${v.tema || '___'}" by ${v.estudanteNome || '___'} is complete and ready for assessment and public defence, and approve its submission.`,
      });
      if (str(v.parecer)) blocks.push({ type: 'paragraph', id: 'parecer', text: semPonto(v.parecer) + '.', en: 'Supervisor’s assessment.' });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Por ser verdade, assino a presente declaração.', en: 'Signed as true.', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [{ role: fs ? 'A Supervisora' : 'O Supervisor', name: str(v.supervisorNome) || undefined, detail: str(v.supervisorTitulo) || undefined, image: ctx.profile?.kind === 'pessoa' ? 'signature' : undefined }] },
    );
    return blocks;
  },
});
