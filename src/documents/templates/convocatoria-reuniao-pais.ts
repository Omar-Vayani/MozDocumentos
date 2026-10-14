// Convocatória para reunião de pais e encarregados de educação: general,
// class or individual meeting called by the school management, the class
// director or the school council. Optional tear-off slip to confirm attendance.

import { diffDays, formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, exmo, GENERO_OPTIONS, isF, l, localField, splitLines } from './_shared';
import { semPonto, str } from './_educacao';

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
function diaSemana(iso: unknown): string {
  const s = str(iso);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
  const d = new Date(`${s}T12:00:00`);
  return WEEKDAYS[d.getDay()] ?? '';
}

export default defineTemplate({
  id: 'convocatoria-reuniao-pais',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Convocatória', 'Notice') },
    { id: 'reuniao', title: l('Reunião', 'Meeting') },
    { id: 'individual', title: l('Encarregado convocado (reunião individual)', 'Parent called (individual meeting)') },
    { id: 'destacavel', title: l('Talão de resposta', 'Reply slip') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    { name: 'numero', type: 'text', section: 'documento', width: 'half', label: l('Convocatória n.º', 'Notice no.'), default: (c) => c.nextRef },
    localField(),
    dateField(),
    {
      name: 'tipo',
      type: 'radio',
      section: 'documento',
      label: l('Tipo de reunião', 'Type of meeting'),
      options: [
        { value: 'geral', label: l('Geral (todos os encarregados)', 'General (all parents)') },
        { value: 'turma', label: l('De turma', 'Class meeting') },
        { value: 'individual', label: l('Individual (um encarregado)', 'Individual (one parent)') },
      ],
      default: 'turma',
    },
    { name: 'turmas', type: 'text', section: 'reuniao', label: l('Classe / turma', 'Grade / class'), placeholder: l('Ex.: 8.ª classe, turma A', 'E.g. Grade 8, class A'), showIf: (v) => v.tipo !== 'geral' && v.tipo !== 'individual' },
    { name: 'dataReuniao', type: 'date', section: 'reuniao', width: 'half', required: true, label: l('Data da reunião', 'Meeting date') },
    { name: 'hora', type: 'text', section: 'reuniao', width: 'half', required: true, label: l('Hora', 'Time'), placeholder: l('Ex.: 15h00', 'E.g. 15:00') },
    { name: 'localReuniao', type: 'text', section: 'reuniao', required: true, label: l('Local', 'Place'), default: 'salão da Escola' },
    { name: 'agenda', type: 'textarea', section: 'reuniao', rows: 5, label: l('Ordem de trabalhos (um ponto por linha)', 'Agenda (one item per line)'), default: 'Apresentação do aproveitamento do 1.º trimestre\nAssiduidade e comportamento dos alunos\nPreparação das avaliações\nDiversos', showIf: (v) => v.tipo !== 'individual' },
    { name: 'representacao', type: 'toggle', section: 'reuniao', label: l('Admitir representação por outro familiar adulto', 'Allow another adult relative to attend instead'), default: true },
    { name: 'encarregadoNome', type: 'text', section: 'individual', label: l('Nome do encarregado', "Parent's name"), showIf: (v) => v.tipo === 'individual' },
    { name: 'encarregadoGenero', type: 'radio', section: 'individual', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', showIf: (v) => v.tipo === 'individual' },
    { name: 'alunoNome', type: 'text', section: 'individual', width: 'half', label: l('Nome do aluno', "Pupil's name"), showIf: (v) => v.tipo === 'individual' },
    { name: 'alunoGenero', type: 'radio', section: 'individual', width: 'half', label: l('Sexo do aluno', "Pupil's sex"), options: GENERO_OPTIONS, default: 'M', showIf: (v) => v.tipo === 'individual' },
    { name: 'alunoClasse', type: 'text', section: 'individual', width: 'half', label: l('Classe / turma', 'Grade / class'), showIf: (v) => v.tipo === 'individual' },
    {
      name: 'assuntoIndividual',
      type: 'select',
      section: 'individual',
      width: 'half',
      label: l('Assunto', 'Subject'),
      options: [
        { value: 'o aproveitamento', label: l('Aproveitamento', 'Results') },
        { value: 'o comportamento', label: l('Comportamento', 'Behaviour') },
        { value: 'a assiduidade', label: l('Assiduidade', 'Attendance') },
        { value: 'a situação escolar', label: l('Situação escolar em geral', 'General') },
      ],
      default: 'o aproveitamento',
      showIf: (v) => v.tipo === 'individual',
    },
    { name: 'destacavel', type: 'toggle', section: 'destacavel', label: l('Incluir talão de resposta', 'Include a reply slip'), default: true },
    { name: 'dataDevolucao', type: 'date', section: 'destacavel', width: 'half', label: l('Devolver até', 'Return by'), showIf: (v) => Boolean(v.destacavel) },
    { name: 'assinante', type: 'text', section: 'assinatura', width: 'half', label: l('Assina', 'Signed by'), default: (c) => (/a$/i.test((c.profile?.representanteCargo ?? '').split(' ')[0] ?? '') ? 'A Directora' : 'O Director') },
    { name: 'assinanteNome', type: 'text', section: 'assinatura', width: 'half', label: l('Nome', 'Name'), default: (c) => c.profile?.representanteNome ?? '' },
  ],
  warnings: (v) => {
    const w: Warning[] = [];
    if (v.dataReuniao && v.data) {
      const d = diffDays(v.data, v.dataReuniao);
      if (d <= 0) w.push({ level: 'error', field: 'dataReuniao', message: l('A reunião deve ser depois da data da convocatória.', 'The meeting must be after the notice date.') });
      else if (d < 7) w.push({ level: 'info', field: 'dataReuniao', message: l('Convém enviar a convocatória com pelo menos uma semana de antecedência, para os encarregados se organizarem.', 'Send the notice at least a week ahead so parents can arrange to attend.') });
    }
    if (v.tipo !== 'individual' && !splitLines(v.agenda).length) w.push({ level: 'warning', field: 'agenda', message: l('Indique a ordem de trabalhos.', 'Enter the agenda.') });
    return w;
  },
  personName: (v) => str(v.encarregadoNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
  blocks: (ctx) => {
    const v = ctx.values;
    const ind = v.tipo === 'individual';
    const quando = `no dia **${diaSemana(v.dataReuniao) ? `${diaSemana(v.dataReuniao)}, ` : ''}${dateLong(v.dataReuniao)}**, pelas **${str(v.hora) || BLANK}**, no ${semPonto(v.localReuniao).replace(/^(no|na|em) /i, '') || BLANK}`;
    const blocks: Block[] = [{ type: 'reference', ref: `Convocatória n.º ${str(v.numero) || '____'}`, place: ctx.place, date: dateLong(v.data) }];
    if (ind) {
      const fa = isF(v.alunoGenero);
      blocks.push(
        { type: 'recipient', salutation: exmo(v.encarregadoGenero), lines: [str(v.encarregadoNome) || BLANK, `Encarregad${isF(v.encarregadoGenero) ? 'a' : 'o'} de Educação ${fa ? 'da aluna' : 'do aluno'} ${str(v.alunoNome) || BLANK}`] },
        { type: 'subject', text: 'Convocatória' },
        { type: 'salutation', text: `${exmo(v.encarregadoGenero)},` },
        {
          type: 'paragraph',
          id: 'individual',
          text: `Solicitamos a comparência de V. Ex.ª nesta Escola ${quando}, para tratar de assuntos relacionados com ${str(v.assuntoIndividual) || 'a situação escolar'} ${fa ? 'da sua educanda' : 'do seu educando'} **${str(v.alunoNome) || BLANK}**${str(v.alunoClasse) ? `, da ${semPonto(v.alunoClasse)}` : ''}.`,
          en: 'You are asked to come to the school on the stated date and time to discuss your child.',
        },
      );
    } else {
      blocks.push(
        { type: 'title', text: 'Convocatória' },
        {
          type: 'paragraph',
          id: 'corpo',
          text: `Convocam-se os Pais e Encarregados de Educação ${v.tipo === 'geral' ? 'de todos os alunos desta Escola' : `dos alunos da ${semPonto(v.turmas) || BLANK}`} para uma reunião ${v.tipo === 'geral' ? 'geral' : 'de turma'}, a realizar-se ${quando}, com a seguinte ordem de trabalhos:`,
          en: 'Parents are called to a meeting on the stated date, time and place, with the following agenda:',
          keepWithNext: true,
        },
        { type: 'list', style: 'numeric', items: splitLines(v.agenda).length ? splitLines(v.agenda) : [BLANK] },
        { type: 'paragraph', id: 'presenca', text: 'Dada a importância dos assuntos, solicita-se a presença de todos.', en: 'Given the importance of the agenda, everyone is asked to attend.' },
      );
    }
    if (v.representacao !== false)
      blocks.push({ type: 'paragraph', id: 'representacao', text: `Em caso de impedimento, ${ind ? 'V. Ex.ª pode' : 'o Encarregado de Educação pode'} fazer-se representar por outro familiar adulto, portador da presente convocatória.`, en: 'If unable to attend, another adult relative may attend with this notice.' });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Kind regards,', keepWithNext: true },
      { type: 'signatures', columns: [{ role: str(v.assinante) || 'O Director', name: str(v.assinanteNome) || undefined, image: 'both' }] },
    );
    if (v.destacavel)
      blocks.push({
        type: 'box',
        cut: true,
        label: `Talão a devolver à Escola${v.dataDevolucao ? ` até ${formatDateShort(v.dataDevolucao)}` : ''}`,
        text: `Eu, ______________________________________, Encarregado(a) de Educação do(a) aluno(a) ${ind && str(v.alunoNome) ? str(v.alunoNome) : '______________________________'}, tomei conhecimento da Convocatória n.º ${str(v.numero) || '____'} e   [   ] estarei presente   [   ] não poderei estar presente.\n\nAssinatura: ______________________________     Data: ___/___/______`,
      });
    return blocks;
  },
});
