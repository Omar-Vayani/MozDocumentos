// Circular: the same instructions addressed at once to several services or
// bodies (all directorates, all districts…).

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, l, localField, placeDate } from './_shared';
import {
  bodyBlocks, classificacaoFields, codigoField, estadoRef, estadoWarnings, numeroField, paragraphs, rodapeBlocks, rodapeFields,
  signatarioColumn, signatarioFields, str, tagsBlocks,
} from './_estado';

export default defineTemplate({
  id: 'circular',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Número, classificação e data', 'Number, classification and date') },
    { id: 'circular', title: l('Destinatários e texto', 'Recipients and text') },
    { id: 'assinatura', title: l('Assinatura e distribuição', 'Signature and distribution') },
  ],
  fields: [
    numeroField(),
    codigoField(),
    ...classificacaoFields(),
    localField(),
    dateField('data'),
    {
      name: 'destinatarios',
      type: 'text',
      section: 'circular',
      required: true,
      label: l('Para', 'To'),
      placeholder: l('Ex.: Todos os Serviços Distritais de Saúde, Mulher e Acção Social', 'E.g. All District Health Services'),
    },
    { name: 'assunto', type: 'text', section: 'circular', required: true, label: l('Assunto', 'Subject') },
    {
      name: 'corpo',
      type: 'textarea',
      section: 'circular',
      required: true,
      rows: 10,
      label: l('Texto', 'Text'),
      help: l('Separe os parágrafos com uma linha em branco. Uma instrução por parágrafo.', 'Separate paragraphs with a blank line. One instruction per paragraph.'),
    },
    { name: 'numerar', type: 'toggle', section: 'circular', label: l('Numerar os parágrafos', 'Number the paragraphs'), default: true },
    {
      name: 'fecho',
      type: 'select',
      section: 'circular',
      label: l('Fecho', 'Closing'),
      options: [
        { value: 'Para conhecimento e devido cumprimento.', label: l('Para conhecimento e devido cumprimento.', 'For information and compliance.') },
        { value: 'Para conhecimento e divulgação.', label: l('Para conhecimento e divulgação.', 'For information and circulation.') },
        {
          value: 'Solicita-se a divulgação da presente Circular junto de todos os sectores e o seu rigoroso cumprimento.',
          label: l('Solicita-se a divulgação da presente Circular junto de todos os sectores e o seu rigoroso cumprimento.', 'Please circulate to all units and comply strictly.'),
        },
      ],
      default: 'Para conhecimento e devido cumprimento.',
    },
    ...signatarioFields(),
    ...rodapeFields(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = estadoWarnings(v, ctx, { assunto: true });
    if (!str(v.destinatarios)) w.push({ level: 'warning', field: 'destinatarios', message: l('Indique os destinatários da circular.', 'Enter the recipients.') });
    if (!paragraphs(v.corpo).length) w.push({ level: 'warning', field: 'corpo', message: l('Escreva o texto da circular.', 'Write the text.') });
    return w;
  },

  personName: (v) => v.assunto,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const blocks: Block[] = [
      ...tagsBlocks(v),
      { type: 'title', text: estadoRef(ctx, 'Circular') },
      { type: 'paragraph', id: 'para', text: `**Para:** ${str(v.destinatarios) || BLANK}`, align: 'left', en: 'Recipients of the circular.' },
      { type: 'subject', text: str(v.assunto) || BLANK },
      ...bodyBlocks(v.corpo, 'corpo', v.numerar !== false, 'Instruction of the circular.'),
      { type: 'paragraph', id: 'fecho', text: str(v.fecho) || 'Para conhecimento e devido cumprimento.', align: 'left', keepWithNext: true, en: 'For information and compliance.' },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [signatarioColumn(v)] },
      ...rodapeBlocks(v),
    ];
    return blocks;
  },
});
