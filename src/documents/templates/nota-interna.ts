// Nota (or Memorando): internal written message between units of the same
// public body, in the "Para / De / Data / Assunto" form.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, localField } from './_shared';
import {
  bodyBlocks, classificacaoFields, codigoField, comArtigo, estadoRef, estadoWarnings, numeroField, paragraphs, rodapeBlocks,
  rodapeFields, signatarioColumn, signatarioFields, str, tagsBlocks,
} from './_estado';

const TIPOS: Record<string, string> = { nota: 'Nota', memorando: 'Memorando' };

export default defineTemplate({
  id: 'nota-interna',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Tipo, número e data', 'Type, number and date') },
    { id: 'nota', title: l('Para, de e assunto', 'To, from and subject') },
    { id: 'texto', title: l('Texto', 'Text') },
    { id: 'assinatura', title: l('Assinatura e cópias', 'Signature and copies') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'radio',
      section: 'documento',
      label: l('Tipo', 'Type'),
      options: [
        { value: 'nota', label: l('Nota', 'Note') },
        { value: 'memorando', label: l('Memorando', 'Memo') },
      ],
      default: 'nota',
    },
    numeroField(),
    codigoField(),
    ...classificacaoFields(),
    localField(),
    dateField('data'),
    {
      name: 'para',
      type: 'text',
      section: 'nota',
      required: true,
      label: l('Para', 'To'),
      placeholder: l('Ex.: Chefe do Departamento de Recursos Humanos', 'E.g. Head of the Human Resources Department'),
      help: l('O cargo ou a unidade a que se dirige.', 'The position or unit addressed.'),
    },
    {
      name: 'de',
      type: 'text',
      section: 'nota',
      label: l('De', 'From'),
      placeholder: l('Ex.: Director Provincial', 'E.g. Provincial Director'),
      help: l('Se ficar vazio, usa-se o cargo de quem assina.', 'If left empty, the signatory’s position is used.'),
    },
    { name: 'referencia', type: 'text', section: 'nota', width: 'half', label: l('Referência (opcional)', 'Reference (optional)'), placeholder: l('Ex.: Nota n.º 12/DRH/2026', 'E.g. Note no. 12/DRH/2026') },
    { name: 'assunto', type: 'text', section: 'nota', required: true, label: l('Assunto', 'Subject') },
    {
      name: 'corpo',
      type: 'textarea',
      section: 'texto',
      required: true,
      rows: 8,
      label: l('Texto', 'Text'),
      help: l('Separe os parágrafos com uma linha em branco. Escreva de forma directa: «Solicita-se…», «Informa-se que…».', 'Separate paragraphs with a blank line. Be direct: “Please…”, “Note that…”.'),
    },
    { name: 'numerar', type: 'toggle', section: 'texto', label: l('Numerar os parágrafos', 'Number the paragraphs'), default: true },
    {
      name: 'fecho',
      type: 'select',
      section: 'texto',
      width: 'half',
      label: l('Fecho', 'Closing'),
      options: [
        { value: '', label: l('Sem fecho (comunicação interna)', 'No closing (internal)') },
        { value: 'Melhores cumprimentos.', label: l('Melhores cumprimentos.', 'Best regards.') },
      ],
      default: '',
    },
    ...signatarioFields(),
    ...rodapeFields(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = estadoWarnings(v, ctx, { assunto: true });
    if (!str(v.para)) w.push({ level: 'warning', field: 'para', message: l('Indique a quem se dirige a nota.', 'Enter who the note is for.') });
    if (!paragraphs(v.corpo).length) w.push({ level: 'warning', field: 'corpo', message: l('Escreva o texto.', 'Write the text.') });
    return w;
  },

  personName: (v) => v.para,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const tipo = TIPOS[v.tipo as string] ?? 'Nota';
    const de = str(v.de) || comArtigo(str(v.signatarioCargo), v.signatarioGenero).replace(/^(O|A) /, '') || BLANK;
    const items = [
      { label: 'Para', value: str(v.para) || BLANK },
      { label: 'De', value: de },
      { label: 'Data', value: dateLong(v.data) },
      ...(str(v.referencia) ? [{ label: 'Ref.ª', value: str(v.referencia) }] : []),
      { label: 'Assunto', value: `**${str(v.assunto) || BLANK}**` },
    ];
    const cabecalho = items.map((it) => `**${it.label}:** ${it.value.replace(/\*\*/g, '')}`).join('\n');
    const blocks: Block[] = [
      ...tagsBlocks(v),
      { type: 'title', text: estadoRef(ctx, tipo) },
      { type: 'paragraph', id: 'cabecalho', text: cabecalho, align: 'left', en: 'To, from, date and subject of the note.' },
      ...bodyBlocks(v.corpo, 'corpo', v.numerar !== false, 'Body of the internal note.'),
    ];
    const fecho = str(v.fecho);
    if (fecho) blocks.push({ type: 'paragraph', id: 'fecho', text: fecho, align: 'left', keepWithNext: true, en: 'Best regards.' });
    else {
      const last = blocks[blocks.length - 1];
      if (last) last.keepWithNext = true;
    }
    blocks.push({ type: 'signatures', columns: [signatarioColumn(v)] }, ...rodapeBlocks(v));
    return blocks;
  },
});
