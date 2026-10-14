// Declaração de originalidade (declaração de honra / compromisso anti-plágio):
// the student states on their honour that the final work is their own, that
// every source is cited and that it was not submitted elsewhere; optionally
// authorises deposit in the institution's repository.

import { defineTemplate, type Block } from '../model';
import { cite, dateField, GENERO_OPTIONS, isF, l, localField, placeDate } from './_shared';
import { or, semPonto, str } from './_saude-educacao';

const TRABALHO_OPTIONS = [
  { value: 'monografia científica', label: l('Monografia', 'Dissertation (BA)') },
  { value: 'dissertação de mestrado', label: l('Dissertação de mestrado', 'Master’s thesis') },
  { value: 'projecto de fim de curso', label: l('Projecto', 'Project') },
  { value: 'relatório de estágio', label: l('Relatório de estágio', 'Internship report') },
  { value: 'tese de doutoramento', label: l('Tese de doutoramento', 'PhD thesis') },
  { value: 'trabalho de investigação', label: l('Trabalho de investigação', 'Research paper') },
];

export default defineTemplate({
  id: 'declaracao-de-originalidade',
  family: 'declaracao',
  letterhead: false,
  sections: [
    { id: 'estudante', title: l('Estudante', 'Student'), personRole: 'outro' },
    { id: 'trabalho', title: l('Trabalho', 'Work') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'estudanteNome', type: 'text', section: 'estudante', required: true, label: l('Nome completo', 'Full name'), personKey: 'nome', default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.nome : '') },
    { name: 'estudanteGenero', type: 'radio', section: 'estudante', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: (c) => (c.profile?.kind === 'pessoa' && c.profile.genero === 'F' ? 'F' : 'M'), personKey: 'genero' },
    { name: 'estudanteNumero', type: 'text', section: 'estudante', width: 'half', label: l('N.º de estudante', 'Student no.') },
    { name: 'estudanteDoc', type: 'text', section: 'estudante', width: 'half', label: l('BI n.º (opcional)', 'ID no. (optional)'), personKey: 'docNumero' },
    { name: 'curso', type: 'text', section: 'estudante', required: true, label: l('Curso', 'Programme') },
    { name: 'instituicao', type: 'text', section: 'estudante', required: true, label: l('Instituição', 'Institution') },
    { name: 'trabalhoTipo', type: 'select', section: 'trabalho', width: 'half', label: l('Tipo de trabalho', 'Kind of work'), options: TRABALHO_OPTIONS, default: 'monografia científica' },
    { name: 'tema', type: 'text', section: 'trabalho', required: true, label: l('Título', 'Title') },
    { name: 'supervisor', type: 'text', section: 'trabalho', width: 'half', label: l('Supervisor (opcional)', 'Supervisor (optional)') },
    { name: 'grau', type: 'text', section: 'trabalho', width: 'half', label: l('Grau a obter (opcional)', 'Degree sought (optional)'), placeholder: l('Ex.: licenciatura em Direito', 'E.g. LLB') },
    { name: 'repositorio', type: 'toggle', section: 'trabalho', label: l('Autorizo a disponibilização no repositório da instituição', 'I authorise deposit in the institutional repository') },
    localField(),
    dateField(),
  ],

  warnings: (v) => [
    ...(!str(v.tema) ? [{ level: 'error' as const, field: 'tema', message: l('Indique o título do trabalho.', 'Enter the title.') }] : []),
    { level: 'info' as const, message: l(`Use a declaração exigida pela sua instituição, se houver modelo próprio. O plágio pode levar à anulação do trabalho ou do grau (${cite('sePlagio')}).`, 'Use your institution’s own form if it has one. Plagiarism may annul the work or degree.') },
  ],

  personName: (v) => v.estudanteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.estudanteGenero);
    const tt = str(v.trabalhoTipo) || 'monografia científica';
    const m = /^(projecto|relatório|trabalho)/.test(tt);
    const o = m ? 'o' : 'a';
    const ident = [`**${or(v.estudanteNome)}**`, str(v.estudanteNumero) ? `estudante n.º ${str(v.estudanteNumero)}` : 'estudante', `do curso de ${or(v.curso)} (${or(v.instituicao)})`, str(v.estudanteDoc) ? `${f ? 'portadora' : 'portador'} do BI n.º ${str(v.estudanteDoc)}` : ''].filter(Boolean).join(', ');
    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Originalidade', subtitle: 'Declaração de honra' },
      {
        type: 'paragraph',
        id: 'declara',
        text: `Eu, ${ident}, declaro por minha honra que ${o} ${tt} ${m ? 'intitulado' : 'intitulada'} «${semPonto(v.tema) || '____________________'}»${str(v.grau) ? `, apresentad${o} para a obtenção do grau de ${semPonto(v.grau)}` : ''}${str(v.supervisor) ? `, sob a supervisão de ${str(v.supervisor)}` : ''}, é o resultado do meu trabalho pessoal e independente.`,
        en: `I declare on my honour that the work titled "${v.tema || '___'}" is the result of my own independent work.`,
      },
      { type: 'paragraph', id: 'fontes', text: 'Declaro que o seu conteúdo é original, que todas as fontes consultadas, incluindo textos, dados, imagens e programas, estão devidamente citadas no texto e indicadas na bibliografia, e que as partes que reproduzem obras de outros autores estão assinaladas como citações.', en: 'Its content is original; all sources, including texts, data, images and software, are cited in the text and listed in the bibliography, and quotations are marked.' },
      { type: 'paragraph', id: 'inedito', text: `Declaro ainda que o trabalho não foi apresentado, no todo ou em parte, em qualquer outra instituição ou para a obtenção de outro grau académico.`, en: 'It has not been submitted, in whole or in part, to any other institution or for any other degree.' },
      { type: 'paragraph', id: 'consequencias', text: 'Tenho conhecimento de que o plágio e a fraude académica são punidos nos termos do regulamento da instituição e da lei, podendo implicar a anulação do trabalho e do grau obtido.', en: 'I understand that plagiarism and academic fraud are punished under the institution’s rules and the law, and may annul the work and the degree.' },
    ];
    if (v.repositorio) blocks.push({ type: 'paragraph', id: 'repositorio', text: `Autorizo a instituição a disponibilizar ${o} ${tt} no seu repositório institucional, para consulta pública, com a indicação da autoria, mantendo os meus direitos de autor.`, en: 'I authorise deposit in the institutional repository for public consultation, with attribution; I keep my copyright.' });
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [{ role: f ? 'A Estudante' : 'O Estudante', name: str(v.estudanteNome) || undefined, image: ctx.profile?.kind === 'pessoa' ? 'signature' : undefined }] });
    return blocks;
  },
});
