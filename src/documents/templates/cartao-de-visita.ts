import { professionalRegistration, profileDisplayName, titledName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type Warning } from '../model';
import { l } from './_shared';
import { clip } from './_eventos';

// Business card, 85 × 55 mm, printed ten per A4 sheet with cutting marks.
// Short lines only: anything longer than a card line is cut, so warnings ask
// the user to shorten it. Three compositions: classic (left), centred, and
// classic with the small national-colours mark. No NUIT or registration is
// required on a card; they are optional.

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
      help: l('Com o título, se o usar: Dr., Eng.ª, Arq.º…', 'With your title if you use one: Dr., Eng.…'),
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
    {
      name: 'registo',
      type: 'text',
      section: 'pessoa',
      label: l('Registo profissional (opcional)', 'Professional registration (optional)'),
      help: l('Ex.: "Carteira Profissional n.º 1234 — Ordem dos Advogados de Moçambique".', 'E.g. bar or medical council number.'),
      default: (c) => (c.profile ? professionalRegistration(c.profile) || '' : ''),
    },
    { name: 'telefone', type: 'tel', section: 'contactos', label: l('Telefone', 'Phone'), width: 'half', default: (c) => c.profile?.telefones ?? '' },
    { name: 'telefone2', type: 'tel', section: 'contactos', label: l('Outro telefone (opcional)', 'Second phone (optional)'), width: 'half' },
    { name: 'email', type: 'email', section: 'contactos', label: l('Email', 'Email'), width: 'half', default: (c) => c.profile?.email ?? '' },
    { name: 'website', type: 'text', section: 'contactos', label: l('Website', 'Website'), width: 'half', default: (c) => c.profile?.website ?? '' },
    { name: 'morada', type: 'text', section: 'contactos', label: l('Morada', 'Address'), width: 'half', default: (c) => (c.profile ? addressLine(c.profile).replace(/ · C\.P\. .*$/, '') : '') },
    { name: 'caixaPostal', type: 'text', section: 'contactos', label: l('Caixa postal (opcional)', 'P.O. box (optional)'), width: 'half', default: (c) => c.profile?.caixaPostal ?? '' },
    {
      name: 'nuit',
      type: 'text',
      section: 'contactos',
      width: 'half',
      label: l('NUIT (opcional)', 'Tax number (optional)'),
      help: l('Não é obrigatório num cartão de visita. Indique-o só se for útil aos seus clientes.', 'Not required on a business card.'),
    },
    {
      name: 'estilo',
      type: 'radio',
      section: 'estilo',
      label: l('Composição', 'Layout'),
      options: [
        { value: 'esquerda', label: l('Clássico, alinhado à esquerda', 'Classic, left-aligned') },
        { value: 'centro', label: l('Centrado', 'Centred') },
        { value: 'mocambique', label: l('Clássico com detalhe nas cores nacionais', 'Classic with the national-colours mark') },
      ],
      default: 'esquerda',
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
    const align = v.estilo === 'centro' ? 'center' : 'left';
    const phones = [str(v.telefone), str(v.telefone2)].filter(Boolean).join('  ·  ');
    const post = [str(v.morada), str(v.caixaPostal) ? `C.P. ${str(v.caixaPostal).replace(/^C\.?\s*P\.?\s*/i, '')}` : ''].filter(Boolean).join(' · ');
    // A card has room for about eight lines: header first, then up to four contact lines.
    const contacts = [phones, str(v.email), str(v.website), post, str(v.nuit) ? `NUIT ${str(v.nuit)}` : ''].filter(Boolean).slice(0, 4);
    const blocks: Block[] = [];
    if (v.mostrarLogo !== false) blocks.push({ type: 'logo', size: 'sm', align });
    blocks.push({ type: 'display', text: clip(str(v.nome) || 'Nome Apelido', 34), size: 'lg', weight: 'bold', align, fit: true, after: 1 });
    if (str(v.cargo)) blocks.push({ type: 'display', text: clip(str(v.cargo), 50), size: 'sm', tone: 'accent', align, fit: true, after: 1 });
    if (str(v.empresa)) blocks.push({ type: 'display', text: clip(str(v.empresa), 50), size: 'sm', weight: 'bold', align, fit: true, after: 1 });
    if (str(v.registo) && contacts.length < 4) blocks.push({ type: 'display', text: clip(str(v.registo), 58), size: 'xs', tone: 'muted', align, fit: true, after: 1 });
    blocks.push({ type: 'ornament', style: v.estilo === 'mocambique' ? 'tricolour' : v.estilo === 'centro' ? 'dots' : 'rule', align });
    for (const line of contacts) blocks.push({ type: 'display', text: clip(line, 58), size: 'xs', align, fit: true, after: 0.5 });
    return blocks;
  },
  warnings: (v) => {
    const out: Warning[] = [];
    const long = (s: unknown, n: number) => str(s).length > n;
    const lines = [v.telefone || v.telefone2, v.email, v.website, v.morada || v.caixaPostal, v.nuit].filter((x) => str(x)).length;
    if (!str(v.telefone) && !str(v.email)) out.push({ level: 'error', field: 'telefone', message: l('Indique pelo menos um telefone ou email.', 'Give at least a phone or an email.') });
    if (lines > 4) out.push({ level: 'warning', field: 'nuit', message: l('Demasiadas linhas de contacto: o cartão fica ilegível. Retire uma.', 'Too many contact lines: remove one.') });
    if (long(v.nome, 28)) out.push({ level: 'warning', field: 'nome', message: l('Nome longo: a letra fica mais pequena para caber numa linha.', 'Long name: the type gets smaller to fit one line.') });
    if (long(v.morada, 48)) out.push({ level: 'warning', field: 'morada', message: l('Morada longa: encurte-a para caber no cartão.', 'Long address: shorten it to fit the card.') });
    if (long(v.empresa, 40)) out.push({ level: 'warning', field: 'empresa', message: l('Nome da empresa longo: use o nome comercial.', 'Long company name: use the trading name.') });
    if (long(v.email, 32)) out.push({ level: 'info', field: 'email', message: l('Email longo: a letra fica mais pequena.', 'Long email: smaller type.') });
    return out;
  },
  personName: (v) => str(v.nome) || undefined,
});
