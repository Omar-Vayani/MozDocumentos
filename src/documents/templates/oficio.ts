// Ofício: outgoing official letter of a public body to another body, an
// organisation or a private party (Decreto n.º 30/2001 and the correspondence
// models of Resolução n.º 13/2001).

import { defineTemplate, type Block, type Warning } from '../model';
import { dateField, dateLong, l, localField } from './_shared';
import {
  bodyBlocks, classificacaoFields, codigoField, destinatarioBlock, destinatarioFields, estadoRef, estadoWarnings, numeroField,
  paragraphs, rodapeBlocks, rodapeFields, signatarioColumn, signatarioFields, str, tagsBlocks, vocativo,
} from './_estado';

const FECHO_OPTIONS = [
  { value: 'Melhores cumprimentos.', label: l('Melhores cumprimentos.', 'Best regards.') },
  { value: 'Com os melhores cumprimentos,', label: l('Com os melhores cumprimentos,', 'With best regards,') },
  {
    value: 'Queira aceitar, Excelência, os protestos da minha elevada consideração.',
    label: l('Queira aceitar, Excelência, os protestos da minha elevada consideração. (a uma Excelência)', 'Please accept, Your Excellency, the assurance of my highest consideration.'),
  },
  { value: 'Atenciosamente,', label: l('Atenciosamente,', 'Sincerely,') },
];

export default defineTemplate({
  id: 'oficio',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Número, classificação e data', 'Number, classification and date') },
    { id: 'destinatario', title: l('Destinatário', 'Addressee') },
    { id: 'oficio', title: l('Ofício', 'Letter') },
    { id: 'assinatura', title: l('Assinatura, anexos e cópias', 'Signature, enclosures and copies') },
  ],
  fields: [
    numeroField(),
    codigoField(),
    ...classificacaoFields(),
    localField(),
    dateField('data'),
    ...destinatarioFields(),
    {
      name: 'vossaRef',
      type: 'text',
      section: 'oficio',
      width: 'half',
      label: l('Responde ao ofício n.º (opcional)', 'In reply to letter no. (optional)'),
      placeholder: l('Ex.: 45/GM/MISAU/2026', 'E.g. 45/GM/MISAU/2026'),
    },
    { name: 'vossaData', type: 'date', section: 'oficio', width: 'half', label: l('De (data)', 'Dated') },
    { name: 'assunto', type: 'text', section: 'oficio', required: true, label: l('Assunto', 'Subject'), help: l('Um só assunto, numa frase curta.', 'One subject, in a short phrase.') },
    {
      name: 'corpo',
      type: 'textarea',
      section: 'oficio',
      required: true,
      rows: 10,
      label: l('Texto do ofício', 'Letter text'),
      help: l(
        'Separe os parágrafos com uma linha em branco. Comece pela substância: «Tenho a honra de informar V. Ex.ª de que…», «Em referência ao ofício acima indicado, cumpre-nos informar…», «Junto se remete, para os devidos efeitos, …».',
        'Separate paragraphs with a blank line. Start with the substance: “I have the honour to inform…”, “In reply to the letter above…”, “Please find enclosed…”.',
      ),
    },
    {
      name: 'numerar',
      type: 'toggle',
      section: 'oficio',
      label: l('Numerar os parágrafos (1., 2., 3.)', 'Number the paragraphs (1., 2., 3.)'),
      default: true,
    },
    { name: 'fecho', type: 'select', section: 'oficio', label: l('Fecho', 'Closing'), options: FECHO_OPTIONS, default: 'Melhores cumprimentos.' },
    ...signatarioFields(),
    ...rodapeFields(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = estadoWarnings(v, ctx, { assunto: true });
    if (v.tratamento !== 'entidade' && !str(v.destinatarioCargo)) {
      w.push({ level: 'warning', field: 'destinatarioCargo', message: l('Indique o cargo do destinatário.', 'Enter the addressee’s position.') });
    }
    if (v.tratamento === 'entidade' && !str(v.destinatarioEntidade)) {
      w.push({ level: 'warning', field: 'destinatarioEntidade', message: l('Indique a instituição destinatária.', 'Enter the receiving institution.') });
    }
    if (!paragraphs(v.corpo).length) w.push({ level: 'warning', field: 'corpo', message: l('Escreva o texto do ofício.', 'Write the letter text.') });
    if (str(v.fecho).includes('Excelência') && v.tratamento !== 'excelencia') {
      w.push({ level: 'info', field: 'fecho', message: l('Este fecho é próprio de ofícios dirigidos a uma Excelência.', 'This closing is for letters to an Excellency.') });
    }
    return w;
  },

  personName: (v) => v.destinatarioEntidade || v.destinatarioCargo,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const blocks: Block[] = [
      ...tagsBlocks(v),
      { type: 'reference', ref: estadoRef(ctx, 'Ofício'), place: ctx.place, date: dateLong(v.data) },
      destinatarioBlock(v),
    ];
    if (str(v.vossaRef)) {
      const t = `V/Ref.ª: Ofício n.º ${str(v.vossaRef)}${v.vossaData ? `, de ${dateLong(v.vossaData)}` : ''}`;
      blocks.push({ type: 'paragraph', id: 'vossaRef', text: t, align: 'left', size: 'small', en: 'Reference of the letter being answered.' });
    }
    blocks.push({ type: 'subject', text: str(v.assunto) || '____________________' });
    const voc = vocativo(v);
    if (voc) blocks.push({ type: 'salutation', text: voc });
    blocks.push(...bodyBlocks(v.corpo, 'corpo', v.numerar !== false, 'Body of the official letter.'));
    const fecho = str(v.fecho) || 'Melhores cumprimentos.';
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: fecho, align: 'left', keepWithNext: true, en: 'Closing: best regards.' },
      { type: 'signatures', columns: [signatarioColumn(v)] },
      ...rodapeBlocks(v),
    );
    return blocks;
  },
});
