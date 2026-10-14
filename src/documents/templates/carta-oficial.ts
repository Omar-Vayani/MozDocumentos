import { isPublicBody, profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, lineItems, localField, refField } from './_shared';

// ---------------------------------------------------------------- local helpers

/** Splits the letter body into paragraphs: by blank lines if there are any, otherwise by line. */
function paragraphs(text: unknown): string[] {
  if (typeof text !== 'string') return [];
  const t = text.replace(/\r\n/g, '\n').trim();
  if (!t) return [];
  const parts = /\n\s*\n/.test(t) ? t.split(/\n\s*\n+/) : t.split(/\n+/);
  return parts.map((p) => p.trim()).filter(Boolean);
}

const TRATAMENTO_OPTIONS = [
  { value: 'Exmo. Senhor', label: l('Exmo. Senhor', 'Exmo. Senhor (Dear Sir)') },
  { value: 'Exma. Senhora', label: l('Exma. Senhora', 'Exma. Senhora (Dear Madam)') },
  { value: 'Exmos. Senhores', label: l('Exmos. Senhores (a uma entidade)', 'Exmos. Senhores (to an organisation)') },
];

const FECHO_OPTIONS = [
  { value: 'Com os melhores cumprimentos,', label: l('Com os melhores cumprimentos,', 'With best regards (standard)') },
  { value: 'Atenciosamente,', label: l('Atenciosamente,', 'Sincerely') },
  { value: 'Com os nossos cumprimentos,', label: l('Com os nossos cumprimentos,', 'With our regards (on behalf of an organisation)') },
];

export default defineTemplate({
  id: 'carta-oficial',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'destinatario', title: l('Destinatário', 'Addressee') },
    { id: 'carta', title: l('Carta', 'Letter') },
    { id: 'assinatura', title: l('Assinatura e anexos', 'Signature and enclosures') },
  ],
  fields: [
    refField(),
    {
      name: 'vossaRef',
      type: 'text',
      section: 'documento',
      width: 'half',
      label: l('V/Ref.ª (opcional)', 'Your ref. (optional)'),
      help: l('A referência da carta a que responde, se houver.', 'The reference of the letter you are replying to, if any.'),
    },
    localField(),
    dateField('data'),
    { name: 'tratamento', type: 'select', section: 'destinatario', width: 'half', label: l('Tratamento', 'Form of address'), options: TRATAMENTO_OPTIONS, default: 'Exmo. Senhor' },
    { name: 'destinatarioNome', type: 'text', section: 'destinatario', width: 'half', label: l('Nome (opcional)', 'Name (optional)') },
    {
      name: 'destinatarioCargo',
      type: 'text',
      section: 'destinatario',
      label: l('Cargo', 'Position'),
      placeholder: l('Ex.: Director Nacional de Recursos Humanos', 'E.g. National Director of Human Resources'),
    },
    { name: 'destinatarioEntidade', type: 'text', section: 'destinatario', required: true, label: l('Entidade', 'Organisation') },
    { name: 'destinatarioMorada', type: 'text', section: 'destinatario', label: l('Morada', 'Address'), placeholder: l('Ex.: Av. 25 de Setembro, n.º 1218, Maputo', 'E.g. street, number, city') },
    { name: 'assunto', type: 'text', section: 'carta', required: true, label: l('Assunto', 'Subject') },
    {
      name: 'corpo',
      type: 'textarea',
      section: 'carta',
      required: true,
      rows: 12,
      label: l('Texto da carta', 'Letter text'),
      help: l(
        'Separe os parágrafos com uma linha em branco. Comece pelo assunto: «Comunicamos que…», «Em resposta ao ofício…», «Solicitamos…».',
        'Separate paragraphs with a blank line. Start with the point: “We inform you that…”, “In reply to…”, “We request…”.',
      ),
    },
    { name: 'fecho', type: 'select', section: 'carta', width: 'half', label: l('Fecho', 'Closing'), options: FECHO_OPTIONS, default: 'Com os melhores cumprimentos,' },
    {
      name: 'signatarioNome',
      type: 'text',
      section: 'assinatura',
      width: 'half',
      label: l('Quem assina', 'Signatory'),
      default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.nome ?? '' : c.profile?.representanteNome ?? ''),
    },
    {
      name: 'signatarioCargo',
      type: 'text',
      section: 'assinatura',
      width: 'half',
      label: l('Cargo de quem assina', 'Signatory’s position'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteCargo ?? '' : ''),
    },
    {
      name: 'anexos',
      type: 'lines',
      section: 'assinatura',
      label: l('Anexos', 'Enclosures'),
      addLabel: l('Adicionar anexo', 'Add enclosure'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: [],
    },
    {
      name: 'cc',
      type: 'text',
      section: 'assinatura',
      label: l('Com conhecimento a (opcional)', 'Copy to (optional)'),
      placeholder: l('Ex.: Direcção de Finanças; Arquivo', 'E.g. Finance Department; File'),
    },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!v.destinatarioEntidade && !v.destinatarioNome) {
      w.push({ level: 'warning', field: 'destinatarioEntidade', message: l('Indique o destinatário.', 'Enter the addressee.') });
    }
    if (!v.assunto) w.push({ level: 'warning', field: 'assunto', message: l('Indique o assunto.', 'Enter the subject.') });
    if (!paragraphs(v.corpo).length) w.push({ level: 'warning', field: 'corpo', message: l('Escreva o texto da carta.', 'Write the letter text.') });
    if (!v.signatarioNome) w.push({ level: 'info', field: 'signatarioNome', message: l('Indique quem assina a carta.', 'Enter who signs the letter.') });
    if (v.tratamento === 'Exmos. Senhores' && v.destinatarioNome) {
      w.push({ level: 'info', field: 'tratamento', message: l('Indicou o nome de uma pessoa: use «Exmo. Senhor» ou «Exma. Senhora».', 'You named a person: use “Exmo. Senhor” or “Exma. Senhora”.') });
    }
    if (ctx.profile?.kind === 'pessoa' && v.fecho === 'Com os nossos cumprimentos,') {
      w.push({ level: 'info', field: 'fecho', message: l('Numa carta pessoal, prefira «Com os melhores cumprimentos,».', 'In a personal letter, prefer “Com os melhores cumprimentos,”.') });
    }
    return w;
  },

  personName: (v) => v.destinatarioEntidade || v.destinatarioNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const p = ctx.profile;
    const tratamento = v.tratamento || 'Exmo. Senhor';
    const corpo = paragraphs(v.corpo);
    const anexos = lineItems(v.anexos).map((r) => String(r.descricao ?? '').trim()).filter(Boolean);
    const blocks: Block[] = [];

    // An individual has no letterhead: identify the sender at the top.
    if (p?.kind === 'pessoa') {
      const lines = [
        `**${p.nome || BLANK}**`,
        addressLine(p),
        [p.telefones ? `Tel.: ${p.telefones}` : '', p.email ? `Email: ${p.email}` : ''].filter(Boolean).join(' · '),
      ].filter(Boolean);
      blocks.push({ type: 'paragraph', id: 'remetente', text: lines.join('\n'), align: 'left', size: 'small', en: 'Sender’s name and contact details.' });
    }

    blocks.push(
      // A public body numbers its letters as ofícios ("Ofício n.º 14/DPS/2026").
      { type: 'reference', ref: v.ref ? (isPublicBody(p) && !/n\.º/.test(String(v.ref)) ? `Ofício n.º ${v.ref}` : v.ref) : undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: tratamento,
        lines: [v.destinatarioNome || '', v.destinatarioCargo || '', v.destinatarioEntidade || '', v.destinatarioMorada || ''].filter(Boolean).length
          ? [v.destinatarioNome || '', v.destinatarioCargo || '', v.destinatarioEntidade || '', v.destinatarioMorada || ''].filter(Boolean)
          : [BLANK],
      },
    );
    if (v.vossaRef) blocks.push({ type: 'paragraph', id: 'vossaRef', text: `V/Ref.ª: ${v.vossaRef}`, align: 'left', size: 'small', en: `Your ref.: ${v.vossaRef}` });
    blocks.push(
      { type: 'subject', text: v.assunto || BLANK },
      { type: 'salutation', text: `${tratamento},` },
    );
    if (corpo.length) {
      corpo.forEach((text, i) => blocks.push({ type: 'paragraph', id: `corpo-${i + 1}`, text }));
    } else {
      blocks.push({ type: 'paragraph', id: 'corpo-1', text: BLANK });
    }

    const fecho = v.fecho || 'Com os melhores cumprimentos,';
    const isEmpresa = p?.kind === 'empresa';
    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: fecho,
        align: 'left',
        keepWithNext: true,
        en: fecho === 'Atenciosamente,' ? 'Sincerely,' : 'Yours faithfully,',
      },
      {
        type: 'signatures',
        columns: [
          {
            role: v.signatarioCargo || (isEmpresa ? profileDisplayName(p) || ' ' : ' '),
            name: v.signatarioNome || undefined,
            image: 'both',
          },
        ],
      },
    );
    if (anexos.length) blocks.push({ type: 'annexList', items: anexos });
    if (v.cc) blocks.push({ type: 'paragraph', id: 'cc', text: `C/c: ${String(v.cc).trim()}`, align: 'left', size: 'small', en: `Copy to: ${v.cc}` });
    return blocks;
  },
});
