import { profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Warning } from '../model';
import { GENERO_OPTIONS, l, splitLines } from './_shared';

// DL envelope (220 × 110 mm): sender at the top left, addressee in the lower
// right, optional mention (CONFIDENCIAL, EM MÃO…). For formal letters and
// invitations delivered by hand or courier.

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export default defineTemplate({
  id: 'envelope-dl',
  family: 'carta',
  page: 'DL',
  noBrand: true,
  letterhead: false,
  sections: [
    { id: 'destinatario', title: l('Destinatário', 'Addressee') },
    { id: 'remetente', title: l('Remetente', 'Sender') },
  ],
  fields: [
    {
      name: 'destinatarioTratamento',
      type: 'select',
      section: 'destinatario',
      width: 'half',
      label: l('Tratamento', 'Form of address'),
      options: [
        { value: 'exmo', label: l('Exmo. Senhor / Exma. Senhora', 'Mr / Ms (formal)') },
        { value: 'excelencia', label: l('Sua Excelência', 'His/Her Excellency') },
        { value: 'entidade', label: l('À / Ao (entidade)', 'To (organisation)') },
        { value: 'nenhum', label: l('Sem tratamento', 'None') },
      ],
      default: 'exmo',
    },
    { name: 'destinatarioGenero', type: 'radio', section: 'destinatario', width: 'half', label: l('Género', 'Gender'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'destinatarioNome', type: 'text', section: 'destinatario', label: l('Nome (com título: Dr., Eng.º…)', 'Name (with title)') },
    { name: 'destinatarioCargo', type: 'text', section: 'destinatario', width: 'half', label: l('Cargo', 'Position') },
    { name: 'destinatarioEntidade', type: 'text', section: 'destinatario', width: 'half', label: l('Entidade', 'Organisation') },
    { name: 'destinatarioMorada', type: 'textarea', section: 'destinatario', rows: 2, label: l('Endereço (até 2 linhas)', 'Address (up to 2 lines)'), placeholder: l('Av. Julius Nyerere, n.º 1234, 2.º andar', 'Street and number') },
    { name: 'destinatarioCidade', type: 'text', section: 'destinatario', width: 'half', required: true, label: l('Cidade', 'City'), default: 'Maputo' },
    {
      name: 'mencao',
      type: 'select',
      section: 'destinatario',
      width: 'half',
      label: l('Menção', 'Marking'),
      options: [
        { value: '', label: l('Nenhuma', 'None') },
        { value: 'Confidencial', label: l('Confidencial', 'Confidential') },
        { value: 'Em mão', label: l('Em mão', 'By hand') },
        { value: 'Pessoal', label: l('Pessoal', 'Personal') },
        { value: 'Urgente', label: l('Urgente', 'Urgent') },
      ],
      default: '',
    },
    { name: 'referencia', type: 'text', section: 'destinatario', label: l('Referência (opcional)', 'Reference (optional)'), placeholder: l('Concurso n.º 12/2026', 'Tender no.') },
    { name: 'remetenteMostrar', type: 'toggle', section: 'remetente', label: l('Imprimir o remetente', 'Print the sender'), default: true },
    { name: 'remetenteNome', type: 'text', section: 'remetente', label: l('Remetente', 'Sender'), default: (c) => profileDisplayName(c.profile), showIf: (v) => v.remetenteMostrar !== false },
    {
      name: 'remetenteMorada',
      type: 'textarea',
      section: 'remetente',
      rows: 2,
      label: l('Endereço do remetente', "Sender's address"),
      default: (c) => (c.profile ? addressLine(c.profile).replace(' · ', '\n') : ''),
      showIf: (v) => v.remetenteMostrar !== false,
    },
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const f = v.destinatarioGenero === 'F';
    const trat =
      v.destinatarioTratamento === 'excelencia'
        ? 'Sua Excelência'
        : v.destinatarioTratamento === 'entidade'
          ? ''
          : v.destinatarioTratamento === 'nenhum'
            ? ''
            : f
              ? 'Exma. Senhora'
              : 'Exmo. Senhor';
    const entidade = str(v.destinatarioEntidade);
    const entidadeLinha = v.destinatarioTratamento === 'entidade' && entidade && !str(v.destinatarioNome) ? `À ${entidade}` : entidade;
    const nome = str(v.destinatarioNome);
    const recipient = [
      nome ? [trat, nome].filter(Boolean).join(' ') : trat,
      str(v.destinatarioCargo),
      entidadeLinha,
      ...splitLines(v.destinatarioMorada).slice(0, 2),
      str(v.destinatarioCidade),
    ].filter(Boolean);
    const sender = v.remetenteMostrar === false ? [] : [str(v.remetenteNome), ...splitLines(v.remetenteMorada).slice(0, 3)].filter(Boolean);
    if (str(v.referencia)) sender.push('', `Ref.ª: ${str(v.referencia)}`);
    return [
      { type: 'envelope', sender, recipient: recipient.length ? recipient : ['____________________'], note: str(v.mencao) || undefined },
      { type: 'spacer', size: 'small' },
      { type: 'spacer', size: 'small' },
    ];
  },
  warnings: (v) => {
    const out: Warning[] = [];
    if (!str(v.destinatarioNome) && !str(v.destinatarioEntidade))
      out.push({ level: 'error', field: 'destinatarioNome', message: l('Indique o nome ou a entidade destinatária.', 'Give the addressee or organisation.') });
    if (splitLines(v.destinatarioMorada).length > 2)
      out.push({ level: 'warning', field: 'destinatarioMorada', message: l('Só as duas primeiras linhas do endereço cabem no envelope.', 'Only two address lines fit.') });
    out.push({
      level: 'info',
      message: l('Imprima o envelope pela bandeja manual da impressora, com a aba virada conforme o desenho da impressora.', "Feed the envelope through the printer's manual tray."),
    });
    return out;
  },
  personName: (v) => str(v.destinatarioNome) || str(v.destinatarioEntidade) || undefined,
});
