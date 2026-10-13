// Convocatória: calls a meeting of a public body's management board, advisory
// or technical council or working group, with date, time, place and agenda.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, localField, placeDate, splitLines } from './_shared';
import { daOuDo, endDot, estadoRef, estadoWarnings, hora, numeroField, rodapeBlocks, rodapeFields, signatarioColumn, signatarioFields, str, stripNumber } from './_estado';

export default defineTemplate({
  id: 'convocatoria-reuniao-servico',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Número e data', 'Number and date') },
    { id: 'reuniao', title: l('Reunião', 'Meeting') },
    { id: 'agenda', title: l('Agenda', 'Agenda') },
    { id: 'assinatura', title: l('Quem convoca', 'Convened by') },
  ],
  fields: [
    numeroField(),
    localField(),
    dateField('data'),
    {
      name: 'destinatarios',
      type: 'text',
      section: 'reuniao',
      required: true,
      label: l('Convocados', 'Invited'),
      placeholder: l('Ex.: Membros do Colectivo de Direcção', 'E.g. Members of the Management Board'),
    },
    {
      name: 'orgao',
      type: 'text',
      section: 'reuniao',
      required: true,
      label: l('Órgão que reúne', 'Body meeting'),
      placeholder: l('Ex.: Colectivo de Direcção da Direcção Provincial de Saúde', 'E.g. Management Board of the Provincial Health Directorate'),
    },
    {
      name: 'natureza',
      type: 'radio',
      section: 'reuniao',
      width: 'half',
      label: l('Reunião', 'Meeting'),
      options: [
        { value: 'ordinária', label: l('Ordinária', 'Ordinary') },
        { value: 'extraordinária', label: l('Extraordinária', 'Extraordinary') },
      ],
      default: 'ordinária',
    },
    { name: 'dataReuniao', type: 'date', section: 'reuniao', width: 'half', required: true, label: l('Data da reunião', 'Meeting date') },
    { name: 'horaReuniao', type: 'text', section: 'reuniao', width: 'half', required: true, label: l('Hora', 'Time'), placeholder: l('Ex.: 09:00', 'E.g. 09:00') },
    {
      name: 'localReuniao',
      type: 'text',
      section: 'reuniao',
      width: 'half',
      required: true,
      label: l('Local', 'Venue'),
      placeholder: l('Ex.: Sala de Reuniões da Direcção', 'E.g. the Directorate’s meeting room'),
      help: l('Para reunião virtual escreva, por exemplo, «por videoconferência (ligação enviada por email)».', 'For an online meeting write e.g. “by video conference (link sent by email)”.'),
    },
    {
      name: 'agenda',
      type: 'textarea',
      section: 'agenda',
      required: true,
      rows: 5,
      label: l('Agenda', 'Agenda'),
      help: l('Um ponto por linha, sem numeração. O último costuma ser «Diversos».', 'One item per line, without numbers. The last is usually “Any other business”.'),
      default: 'Leitura e aprovação da acta da reunião anterior\nDiversos',
    },
    { name: 'confirmarAte', type: 'date', section: 'agenda', width: 'half', label: l('Confirmar presença até (opcional)', 'Confirm attendance by (optional)') },
    { name: 'pontualidade', type: 'toggle', section: 'agenda', label: l('Pedir pontualidade', 'Ask for punctuality'), default: true },
    ...signatarioFields('assinatura', l('Cargo de quem convoca', 'Position of the person calling the meeting')),
    ...rodapeFields('assinatura', { cc: false, iniciais: false }),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = estadoWarnings(v, ctx);
    if (!v.dataReuniao) w.push({ level: 'warning', field: 'dataReuniao', message: l('Indique a data da reunião.', 'Enter the meeting date.') });
    if (!splitLines(v.agenda).length) w.push({ level: 'warning', field: 'agenda', message: l('Indique a agenda.', 'Enter the agenda.') });
    return w;
  },

  personName: (v) => v.orgao,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const agenda = splitLines(v.agenda).map((p) => endDot(stripNumber(p)).replace(/\.$/, ''));
    const orgao = str(v.orgao) || BLANK;
    const localR = str(v.localReuniao).replace(/[.;,]+$/, '');
    const onde = !localR ? `na ${BLANK}` : /^(na|no|em|por|via)\s/i.test(localR) ? localR : `na ${localR}`;
    const blocks: Block[] = [
      { type: 'title', text: 'Convocatória', subtitle: estadoRef(ctx, 'Nota') },
      { type: 'paragraph', id: 'para', text: `**Para:** ${str(v.destinatarios) || BLANK}`, align: 'left', en: 'Those invited.' },
      {
        type: 'paragraph',
        id: 'convocacao',
        text: `Convoco V. Ex.ªs para a reunião ${str(v.natureza) || 'ordinária'} ${daOuDo(orgao)}, a realizar-se no dia ${dateLong(v.dataReuniao)}, ${hora(v.horaReuniao, 'pelas')}, ${onde}, com a seguinte agenda:`,
        keepWithNext: true,
        en: 'You are invited to the meeting on the date, time and place stated, with the following agenda:',
      },
      { type: 'list', style: 'numeric', items: (agenda.length ? agenda : [BLANK]).map((a, i, arr) => `${a}${i === arr.length - 1 ? '.' : ';'}`) },
    ];
    const extra: string[] = [];
    if (v.confirmarAte) extra.push(`Solicita-se a confirmação da presença até ao dia ${dateLong(v.confirmarAte)}.`);
    if (v.pontualidade !== false) extra.push('Dada a importância dos assuntos, solicita-se a presença de todos e a máxima pontualidade.');
    extra.forEach((t, i) => blocks.push({ type: 'paragraph', id: `nota-${i + 1}`, text: t, en: 'Practical note about attendance.' }));
    const last = blocks[blocks.length - 1];
    last.keepWithNext = true;
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [signatarioColumn(v)] }, ...rodapeBlocks(v));
    return blocks;
  },
});
