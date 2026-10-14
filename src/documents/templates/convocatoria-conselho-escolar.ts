// Convocatória de órgão escolar: the chair calls a meeting of the class
// council, the pedagogical council, the school council or a subject group,
// with date, time, place and agenda.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, l, localField, refField } from './_shared';
import { horaText } from './_saude';
import { emLocal, lines, ORGAOS, orgaoNome, papelCargo, semPonto, str } from './_saude-educacao';

export default defineTemplate({
  id: 'convocatoria-conselho-escolar',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Convocatória', 'Notice') },
    { id: 'reuniao', title: l('Reunião', 'Meeting') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    refField(),
    localField(),
    dateField(),
    { name: 'orgao', type: 'select', section: 'documento', width: 'half', label: l('Órgão', 'Body'), options: ORGAOS.map(({ value, label }) => ({ value, label })), default: 'turma' },
    { name: 'turmaDesc', type: 'text', section: 'documento', width: 'half', label: l('Classe e turma', 'Grade and class'), placeholder: l('Ex.: 10.ª classe, turma B', 'E.g. 10th grade, class B'), showIf: (v) => v.orgao === 'turma' },
    { name: 'grupoNome', type: 'text', section: 'documento', width: 'half', label: l('Disciplina / departamento', 'Subject / department'), showIf: (v) => v.orgao === 'grupo' },
    {
      name: 'tipoReuniao',
      type: 'radio',
      section: 'documento',
      label: l('Reunião', 'Meeting'),
      options: [
        { value: 'ordinária', label: l('Ordinária', 'Ordinary') },
        { value: 'extraordinária', label: l('Extraordinária', 'Extraordinary') },
      ],
      default: 'ordinária',
    },
    { name: 'dataReuniao', type: 'date', section: 'reuniao', width: 'half', required: true, label: l('Data', 'Date') },
    { name: 'horaReuniao', type: 'text', section: 'reuniao', width: 'half', required: true, label: l('Hora', 'Time'), placeholder: l('14:30', '14:30') },
    { name: 'localReuniao', type: 'text', section: 'reuniao', label: l('Local', 'Place'), default: 'na sala de reuniões da Escola' },
    {
      name: 'ordem',
      type: 'textarea',
      section: 'reuniao',
      rows: 4,
      required: true,
      label: l('Ordem de trabalhos', 'Agenda'),
      help: l('Um ponto por linha.', 'One item per line.'),
      default: 'Análise do aproveitamento e da assiduidade dos alunos\nCasos disciplinares\nPlano de recuperação dos alunos com negativas\nDiversos',
    },
    { name: 'destinatarios', type: 'text', section: 'reuniao', label: l('Convocados', 'Members called'), placeholder: l('Ex.: todos os professores da turma e o representante dos encarregados', 'E.g. all the class teachers and the parents’ representative') },
    { name: 'presidenteNome', type: 'text', section: 'assinatura', width: 'half', label: l('Quem convoca', 'Called by'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'presidenteCargo', type: 'text', section: 'assinatura', width: 'half', label: l('Cargo', 'Position'), default: 'Director de Turma' },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!lines(v.ordem).length) w.push({ level: 'error', field: 'ordem', message: l('Indique a ordem de trabalhos.', 'Enter the agenda.') });
    if (v.orgao === 'escola') w.push({ level: 'info', message: l(`O Conselho de Escola integra representantes da direcção, professores, pessoal, encarregados e comunidade (${cite('seRegulamentoInternoEscola')}). Convoque todos os membros.`, 'Call all members of the School Council.') });
    return w;
  },

  personName: (v) => orgaoNome(v),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const nome = orgaoNome(v);
    const ordem = lines(v.ordem);
    const blocks: Block[] = [
      { type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'title', text: 'Convocatória', subtitle: nome },
      {
        type: 'paragraph',
        id: 'convoca',
        text: `Nos termos do regulamento interno, convocam-se ${str(v.destinatarios) ? semPonto(v.destinatarios) : `os membros do ${nome}`} para a reunião ${str(v.tipoReuniao) || 'ordinária'} a realizar no dia **${dateLong(v.dataReuniao)}**, às **${horaText(v.horaReuniao)}**, ${emLocal(v.localReuniao)}, com a seguinte ordem de trabalhos:`,
        en: `Members of the ${nome} are called to a ${v.tipoReuniao === 'extraordinária' ? 'special' : 'regular'} meeting on ${v.dataReuniao || '___'} at ${v.horaReuniao || '___'}, ${v.localReuniao || '___'}, with this agenda:`,
        keepWithNext: true,
      },
      { type: 'list', style: 'numeric', items: ordem.length ? ordem.map((p, k) => `${p.replace(/[.;]+$/, '')}${k === ordem.length - 1 ? '.' : ';'}`) : ['____________________'] },
      { type: 'paragraph', id: 'presenca', text: 'A presença é obrigatória. A falta deve ser justificada por escrito.', en: 'Attendance is required; absence must be justified in writing.', keepWithNext: true },
      { type: 'signatures', columns: [{ role: papelCargo(str(v.presidenteCargo) || 'Director de Turma'), name: str(v.presidenteNome) || undefined, image: 'signature' }] },
      { type: 'table', grid: true, caption: 'Tomaram conhecimento', columns: [{ label: 'Nome', width: 60 }, { label: 'Assinatura', width: 40 }], rows: Array.from({ length: 6 }, () => [' ', ' ']) },
    ];
    return blocks;
  },
});

