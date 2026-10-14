import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, lineItems, localField } from './_shared';
import { autorFields, autorSignature, autorWarnings, envioBlock, envioField, eu, isEmpresa, senderBlock, str } from './_cidadao';

const entidades = (v: Record<string, unknown>) => lineItems(v.entidades).filter((r) => str(r.nome));

export default defineTemplate({
  id: 'comunicacao-mudanca-morada',
  // One letter per entity listed.
  repeat: (v) => {
    const es = entidades(v);
    if (es.length < 2) return undefined;
    return es.map((r) => ({ entidadeNome: str(r.nome), entidadeAc: str(r.ac), entidadeRef: str(r.ref) }));
  },
  sections: [
    { id: 'autor', title: l('Quem muda', 'Who is moving'), personRole: 'outro' },
    { id: 'morada', title: l('Moradas', 'Addresses') },
    { id: 'entidades', title: l('A quem comunica', 'Who to tell') },
    { id: 'documento', title: l('Local, data e entrega', 'Place, date and delivery') },
  ],
  fields: [
    ...autorFields(['nome', 'genero', 'docTipo', 'docNumero', 'nuit', 'telefone', 'email'], { empresa: true, required: ['nome'] }),
    { name: 'moradaAntiga', type: 'text', section: 'morada', label: l('Morada antiga', 'Old address') },
    { name: 'moradaNova', type: 'text', section: 'morada', required: true, label: l('Nova morada', 'New address'), placeholder: l('Ex.: Avenida Kim Il Sung, n.º 961, 3.º andar, flat 7, Sommerschield, Maputo', 'E.g. new street address') },
    { name: 'caixaPostal', type: 'text', section: 'morada', width: 'half', label: l('Caixa postal (opcional)', 'PO box (optional)') },
    { name: 'dataMudanca', type: 'date', section: 'morada', width: 'half', label: l('A partir de', 'From') },
    { name: 'novosContactos', type: 'toggle', section: 'morada', default: false, label: l('Também mudei de telefone ou email', 'My phone or email also changed'), help: l('Os contactos indicados acima entram na carta como novos.', 'The contacts above go into the letter as new ones.') },
    {
      name: 'entidades',
      type: 'lines',
      section: 'entidades',
      label: l('Entidades', 'Organisations'),
      help: l('Sai uma carta para cada linha: banco, seguradora, escola, empregador, operadora, água, energia, condomínio.', 'One letter per line: bank, insurer, school, employer, operator, utilities.'),
      addLabel: l('Adicionar entidade', 'Add organisation'),
      columns: [
        { name: 'nome', type: 'text', label: l('Entidade', 'Organisation'), placeholder: l('Ex.: Millennium bim — Balcão da Polana', 'E.g. bank branch') },
        { name: 'ac', type: 'text', label: l('À atenção de (opcional)', 'Attention of (optional)') },
        { name: 'ref', type: 'text', label: l('N.º de cliente, conta ou apólice', 'Customer, account or policy no.') },
      ],
      default: [],
    },
    { name: 'entidadeNome', type: 'text', section: 'entidades', label: l('Entidade (se for só uma)', 'Organisation (if only one)'), showIf: (v) => entidades(v).length === 0 },
    { name: 'entidadeAc', type: 'text', section: 'entidades', label: l('À atenção de (opcional)', 'Attention of (optional)'), showIf: (v) => entidades(v).length === 0 },
    { name: 'entidadeRef', type: 'text', section: 'entidades', width: 'half', label: l('N.º de cliente, conta ou apólice', 'Customer, account or policy no.'), showIf: (v) => entidades(v).length === 0 },
    localField('documento'),
    dateField('data'),
    envioField('documento', 'nenhum'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx);
    if (!str(v.moradaNova)) w.push({ level: 'warning', field: 'moradaNova', message: l('Indique a nova morada.', 'Give the new address.') });
    w.push({
      level: 'info',
      field: 'entidades',
      message: l(
        `Alguns serviços pedem impresso próprio: a Autoridade Tributária (dados do NUIT), o INSS e o recenseamento eleitoral. O estrangeiro residente comunica a mudança aos serviços de migração (${cite('cidMoradaEstrangeiro')}).`,
        'Some offices need their own form: the tax authority, social security and the voters’ roll. Resident foreigners must notify the migration services.',
      ),
    });
    return w;
  },

  personName: (v) => v.autorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const es = entidades(v);
    const one = es.length === 1 ? es[0] : null;
    const nome = str(v.entidadeNome) || (one ? str(one.nome) : '');
    const ac = str(v.entidadeAc) || (one ? str(one.ac) : '');
    const ref = str(v.entidadeRef) || (one ? str(one.ref) : '');
    const empresa = isEmpresa(ctx);
    const quem = empresa ? `a **${profileDisplayName(ctx.profile)}** transfere a sua sede` : `passo a residir`;
    const contactos = v.novosContactos ? [str(v.autorTelefone) ? `telefone ${str(v.autorTelefone)}` : '', str(v.autorEmail) ? `email ${str(v.autorEmail)}` : ''].filter(Boolean).join(' e ') : '';

    const blocks: Block[] = [
      ...senderBlock({ ...ctx, values: { ...v, autorMorada: '' } }, { extra: [str(v.moradaNova)] }),
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      ...envioBlock(v),
      { type: 'recipient', lines: [nome || BLANK, ac ? `A/C: ${ac}` : ''].filter(Boolean) },
      { type: 'subject', text: `Comunicação de mudança de ${empresa ? 'sede' : 'morada'}${ref ? ` — ${ref}` : ''}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'comunicacao',
        text: `${eu(ctx, 'Comunico', 'Comunicamos')} que, a partir de ${v.dataMudanca ? dateLong(v.dataMudanca) : 'esta data'}, ${quem} em:`,
        en: 'I inform you that from the date stated my address is:',
        keepWithNext: true,
      },
      { type: 'paragraph', id: 'novaMorada', text: `**${str(v.moradaNova) || BLANK}**${str(v.caixaPostal) ? `\nCaixa Postal ${str(v.caixaPostal)}` : ''}`, align: 'center', en: 'New address.' },
    ];
    if (str(v.moradaAntiga)) blocks.push({ type: 'paragraph', id: 'antiga', text: `A morada anterior era: ${str(v.moradaAntiga)}.`, en: 'The previous address is stated.' });
    blocks.push(
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${eu(ctx, 'Solicito', 'Solicitamos')} que actualizem os vossos registos${ref ? ` (${ref})` : ''} e passem a enviar para a nova morada toda a correspondência, facturas e notificações.${contactos ? ` ${eu(ctx, 'Os meus', 'Os nossos')} contactos passam a ser: ${contactos}.` : ''}`,
        en: 'Please update your records and send all correspondence, bills and notices to the new address.',
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', columns: [autorSignature(ctx, 'O Remetente', 'A Remetente', { roleEmpresa: 'A Gerência' })] },
    );
    return blocks;
  },
});
