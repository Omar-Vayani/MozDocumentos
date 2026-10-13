import { profileDisplayName, titledName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type Warning } from '../model';
import { l } from './_shared';

// Business card, 85 × 55 mm, printed ten per A4 sheet with cutting marks.
// Short lines only: anything longer than a card line is cut, so warnings ask
// the user to shorten it.

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export default defineTemplate({
  id: 'cartao-de-visita',
  family: 'carta',
  page: 'cartao',
  verticalAlign: 'center',
  noBrand: true,
  letterhead: false,
  sections: [
    { id: 'pessoa', title: l('Pessoa', 'Person') },
    { id: 'contactos', title: l('Contactos', 'Contacts') },
    { id: 'estilo', title: l('Estilo', 'Style') },
  ],
  fields: [
    {
      name: 'nome',
      type: 'text',
      section: 'pessoa',
      label: l('Nome', 'Name'),
      required: true,
      width: 'half',
      default: (c) => (c.profile?.kind === 'pessoa' ? titledName(c.profile) : c.profile?.representanteNome ?? ''),
    },
    {
      name: 'cargo',
      type: 'text',
      section: 'pessoa',
      label: l('Cargo ou profissão', 'Position or occupation'),
      width: 'half',
      default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.especialidade || c.profile.profissao || '' : c.profile?.representanteCargo ?? ''),
    },
    {
      name: 'empresa',
      type: 'text',
      section: 'pessoa',
      label: l('Empresa ou instituição', 'Company or institution'),
      default: (c) => (c.profile?.kind === 'empresa' ? profileDisplayName(c.profile) : ''),
    },
    { name: 'telefone', type: 'tel', section: 'contactos', label: l('Telefone', 'Phone'), width: 'half', default: (c) => c.profile?.telefones ?? '' },
    { name: 'email', type: 'email', section: 'contactos', label: l('Email', 'Email'), width: 'half', default: (c) => c.profile?.email ?? '' },
    { name: 'website', type: 'text', section: 'contactos', label: l('Website', 'Website'), width: 'half', default: (c) => c.profile?.website ?? '' },
    { name: 'morada', type: 'text', section: 'contactos', label: l('Morada', 'Address'), width: 'half', default: (c) => (c.profile ? addressLine(c.profile) : '') },
    {
      name: 'estilo',
      type: 'radio',
      section: 'estilo',
      label: l('Composição', 'Layout'),
      options: [
        { value: 'centro', label: l('Centrado', 'Centred') },
        { value: 'esquerda', label: l('Alinhado à esquerda', 'Left-aligned') },
      ],
      default: 'centro',
    },
    {
      name: 'mostrarLogo',
      type: 'toggle',
      section: 'estilo',
      label: l('Mostrar o logótipo do perfil', 'Show the profile logo'),
      default: true,
    },
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const align = v.estilo === 'esquerda' ? 'left' : 'center';
    const contacts = [str(v.telefone), str(v.email), str(v.website), str(v.morada)].filter(Boolean);
    const blocks: Block[] = [];
    if (v.mostrarLogo !== false) blocks.push({ type: 'logo', size: 'sm', align });
    blocks.push({ type: 'display', text: str(v.nome) || 'Nome Apelido', size: 'lg', weight: 'bold', align, after: 1 });
    if (str(v.cargo)) blocks.push({ type: 'display', text: str(v.cargo), size: 'sm', tone: 'muted', align, after: 1 });
    if (str(v.empresa)) blocks.push({ type: 'display', text: str(v.empresa), size: 'sm', tone: 'accent', weight: 'bold', align, after: 2 });
    blocks.push({ type: 'ornament', style: 'tricolour', align });
    if (contacts.length) blocks.push({ type: 'display', text: contacts.join('\n'), size: 'xs', align, after: 0 });
    return blocks;
  },
  warnings: (v) => {
    const out: Warning[] = [];
    const long = (s: unknown, n: number) => str(s).length > n;
    if (long(v.nome, 28)) out.push({ level: 'warning', field: 'nome', message: l('Nome longo: pode não caber numa linha do cartão.', 'Long name: it may not fit on one line.') });
    if (long(v.morada, 48)) out.push({ level: 'warning', field: 'morada', message: l('Morada longa: encurte-a para caber no cartão.', 'Long address: shorten it to fit the card.') });
    if (long(v.empresa, 40)) out.push({ level: 'warning', field: 'empresa', message: l('Nome da empresa longo: use o nome comercial.', 'Long company name: use the trading name.') });
    return out;
  },
  personName: (v) => str(v.nome) || undefined,
});
