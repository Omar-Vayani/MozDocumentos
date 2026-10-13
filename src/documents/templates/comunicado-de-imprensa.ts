// Comunicado de Imprensa: statement of a public body to the media and the
// public, usually signed by the communication office rather than a person.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, localField, placeDate } from './_shared';
import { estadoWarnings, paragraphs, str } from './_estado';

export default defineTemplate({
  id: 'comunicado-de-imprensa',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Tipo e data', 'Type and date') },
    { id: 'texto', title: l('Texto', 'Text') },
    { id: 'assinatura', title: l('Assinatura e contactos', 'Signature and contacts') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'select',
      section: 'documento',
      width: 'half',
      label: l('Título', 'Heading'),
      options: [
        { value: 'Comunicado de Imprensa', label: l('Comunicado de Imprensa', 'Press release') },
        { value: 'Comunicado', label: l('Comunicado', 'Statement') },
        { value: 'Nota de Imprensa', label: l('Nota de Imprensa', 'Press note') },
      ],
      default: 'Comunicado de Imprensa',
    },
    localField(),
    dateField('data'),
    {
      name: 'divulgacao',
      type: 'select',
      section: 'documento',
      width: 'half',
      label: l('Divulgação', 'Release'),
      options: [
        { value: 'imediata', label: l('Para divulgação imediata', 'For immediate release') },
        { value: 'embargo', label: l('Embargo até uma data', 'Embargoed until a date') },
        { value: '', label: l('Não indicar', 'Do not state') },
      ],
      default: 'imediata',
    },
    { name: 'embargoData', type: 'date', section: 'documento', width: 'half', label: l('Embargo até', 'Embargoed until'), showIf: (v) => v.divulgacao === 'embargo' },
    { name: 'titulo', type: 'text', section: 'texto', required: true, label: l('Título da notícia', 'Headline'), placeholder: l('Ex.: Nampula inicia campanha de vacinação contra o sarampo', 'E.g. Nampula starts measles vaccination campaign') },
    {
      name: 'corpo',
      type: 'textarea',
      section: 'texto',
      required: true,
      rows: 10,
      label: l('Texto', 'Text'),
      help: l(
        'O primeiro parágrafo responde a quem, o quê, quando e onde. Separe os parágrafos com uma linha em branco.',
        'The first paragraph says who, what, when and where. Separate paragraphs with a blank line.',
      ),
    },
    {
      name: 'assinaturaInstitucional',
      type: 'text',
      section: 'assinatura',
      label: l('Assinado por (unidade)', 'Signed by (unit)'),
      default: 'O Gabinete de Comunicação e Imagem',
    },
    { name: 'portaVoz', type: 'text', section: 'assinatura', width: 'half', label: l('Porta-voz (opcional)', 'Spokesperson (optional)'), help: l('Se indicar um nome, imprime-se uma linha de assinatura.', 'If you give a name, a signature line is printed.') },
    { name: 'contactos', type: 'text', section: 'assinatura', label: l('Contactos para a imprensa (opcional)', 'Media contacts (optional)'), default: (c) => [c.profile?.telefones, c.profile?.email].filter(Boolean).join(' · ') },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = estadoWarnings(v, ctx);
    if (!str(v.titulo)) w.push({ level: 'warning', field: 'titulo', message: l('Escreva o título.', 'Write the headline.') });
    if (!paragraphs(v.corpo).length) w.push({ level: 'warning', field: 'corpo', message: l('Escreva o texto.', 'Write the text.') });
    return w;
  },

  personName: (v) => v.titulo,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const blocks: Block[] = [];
    if (v.divulgacao === 'imediata') blocks.push({ type: 'tags', items: ['Para divulgação imediata'] });
    if (v.divulgacao === 'embargo') blocks.push({ type: 'tags', items: [`Embargo até ${dateLong(v.embargoData)}`] });
    blocks.push(
      { type: 'title', text: str(v.tipo) || 'Comunicado de Imprensa' },
      { type: 'paragraph', id: 'titulo', text: `**${str(v.titulo) || BLANK}**`, align: 'center', en: 'Headline.' },
    );
    const ps = paragraphs(v.corpo);
    (ps.length ? ps : [BLANK]).forEach((p, i) => blocks.push({ type: 'paragraph', id: `corpo-${i + 1}`, text: p, en: 'Text of the press release.' }));
    if (str(v.contactos)) {
      blocks.push({ type: 'paragraph', id: 'contactos', text: `Para mais informações: ${str(v.contactos)}.`, align: 'left', size: 'small', en: 'Media contacts.' });
    }
    const unidade = str(v.assinaturaInstitucional) || 'O Gabinete de Comunicação e Imagem';
    if (str(v.portaVoz)) {
      const last = blocks[blocks.length - 1];
      last.keepWithNext = true;
      blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [{ role: unidade, name: str(v.portaVoz), detail: 'Porta-voz', image: 'stamp' }] });
    } else {
      blocks.push(
        { type: 'paragraph', id: 'local-data', text: placeDate(ctx, v.data), align: 'left', keepWithNext: true, en: 'Place and date.' },
        { type: 'paragraph', id: 'assinatura', text: `**${unidade}**`, align: 'right', en: 'Issued by the communication office.' },
      );
    }
    return blocks;
  },
});
