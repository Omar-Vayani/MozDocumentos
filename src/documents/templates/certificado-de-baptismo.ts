import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { BLANK, dateLong, GENERO_OPTIONS, g, l, lineItems, localField, placeDate } from './_shared';
import { entidadeNome, juntar, str } from './_associacoes';

// Certificado de baptismo issued by a church: A5 landscape, framed, centred.
// Religious only: it never replaces the civil birth registration, and the
// page says so (mandatory note).

const NOTA_BAPTISMO =
  'Certificado de natureza exclusivamente religiosa. Não substitui a cédula pessoal, o assento ou a certidão de nascimento emitidos pelo Registo Civil.';

export default defineTemplate({
  id: 'certificado-de-baptismo',
  family: 'declaracao',
  page: 'A5-paisagem',
  verticalAlign: 'center',
  frame: 'double',
  noBrand: true,
  letterhead: false,
  sections: [
    { id: 'baptizado', title: l('Baptizado(a)', 'Person baptised'), personRole: 'outro' },
    { id: 'baptismo', title: l('Baptismo', 'Baptism') },
    { id: 'registo', title: l('Registo e assinaturas', 'Record and signatures') },
  ],
  fields: [
    { name: 'nome', type: 'text', section: 'baptizado', required: true, label: l('Nome completo', 'Full name'), personKey: 'nome' },
    { name: 'genero', type: 'radio', section: 'baptizado', width: 'half', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'dataNascimento', type: 'date', section: 'baptizado', width: 'half', label: l('Data de nascimento', 'Date of birth') },
    { name: 'localNascimento', type: 'text', section: 'baptizado', width: 'half', label: l('Local de nascimento', 'Place of birth') },
    { name: 'pai', type: 'text', section: 'baptizado', width: 'half', label: l('Nome do pai', 'Father’s name') },
    { name: 'mae', type: 'text', section: 'baptizado', width: 'half', label: l('Nome da mãe', 'Mother’s name') },
    { name: 'igreja', type: 'text', section: 'baptismo', label: l('Igreja / paróquia', 'Church / parish'), default: (c) => c.profile?.firma ?? '' },
    { name: 'dataBaptismo', type: 'date', section: 'baptismo', width: 'half', required: true, label: l('Data do baptismo', 'Baptism date'), default: (c) => c.today },
    localField('baptismo'),
    {
      name: 'forma',
      type: 'select',
      section: 'baptismo',
      width: 'half',
      label: l('Forma', 'Form'),
      options: [
        { value: 'imersao', label: l('Por imersão', 'By immersion') },
        { value: 'aspersao', label: l('Por aspersão / infusão', 'By sprinkling / pouring') },
        { value: 'omitir', label: l('Não indicar', 'Do not state') },
      ],
      default: 'omitir',
    },
    { name: 'ministro', type: 'text', section: 'baptismo', width: 'half', required: true, label: l('Ministro que baptizou', 'Officiating minister'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'ministroTitulo', type: 'text', section: 'baptismo', width: 'half', label: l('Título', 'Title'), default: 'Pastor' },
    {
      name: 'padrinhos',
      type: 'lines',
      section: 'baptismo',
      label: l('Padrinhos (opcional)', 'Godparents (optional)'),
      addLabel: l('Adicionar padrinho/madrinha', 'Add godparent'),
      columns: [{ name: 'nome', type: 'text', label: l('Nome', 'Name') }],
      default: [],
    },
    { name: 'versiculo', type: 'text', section: 'baptismo', label: l('Versículo (opcional)', 'Bible verse (optional)'), placeholder: l('Ex.: «Ide, fazei discípulos de todas as nações, baptizando-os…» (Mateus 28:19)', 'E.g. Matthew 28:19') },
    { name: 'livro', type: 'text', section: 'registo', width: 'third', label: l('Livro n.º', 'Book no.') },
    { name: 'folhas', type: 'text', section: 'registo', width: 'third', label: l('Folhas', 'Page') },
    { name: 'assento', type: 'text', section: 'registo', width: 'third', label: l('Assento n.º', 'Entry no.') },
    { name: 'data', type: 'date', section: 'registo', width: 'half', label: l('Data de emissão', 'Issue date'), default: (c) => c.today },
    { name: 'secretarioNome', type: 'text', section: 'registo', width: 'half', label: l('Secretário(a) (opcional)', 'Secretary (optional)') },
  ],

  blocks: (ctx) => {
    const v = ctx.values;
    const igreja = str(v.igreja) || entidadeNome(ctx);
    const pais = [str(v.pai), str(v.mae)].filter(Boolean);
    const filho = g(v.genero, 'filho', 'filha');
    const nasc = str(v.dataNascimento) ? `${g(v.genero, 'nascido', 'nascida')} em ${dateLong(v.dataNascimento)}${str(v.localNascimento) ? `, em ${str(v.localNascimento)}` : ''}` : '';
    const forma = v.forma === 'imersao' ? ' por imersão' : v.forma === 'aspersao' ? ' por aspersão' : '';
    const pad = lineItems(v.padrinhos).map((r) => str(r.nome)).filter(Boolean);
    const corpo = [
      pais.length ? `${filho} de ${juntar(pais)}` : '',
      nasc,
      `foi ${g(v.genero, 'baptizado', 'baptizada')}${forma} em nome do Pai, do Filho e do Espírito Santo, no dia ${dateLong(v.dataBaptismo)}, na ${igreja}${str(v.local) ? `, em ${str(v.local)}` : ''}, pelo ${str(v.ministroTitulo) || 'Pastor'} ${str(v.ministro) || BLANK}`,
      pad.length ? `sendo ${pad.length === 1 ? 'padrinho/madrinha' : 'padrinhos'} ${juntar(pad)}` : '',
    ]
      .filter(Boolean)
      .join(', ');
    const reg = [str(v.livro) ? `Livro n.º ${str(v.livro)}` : '', str(v.folhas) ? `folhas ${str(v.folhas)}` : '', str(v.assento) ? `assento n.º ${str(v.assento)}` : ''].filter(Boolean).join(', ');
    const cols: SignatureColumn[] = [{ role: `O ${str(v.ministroTitulo) || 'Pastor'}`, name: str(v.ministro) || undefined, image: 'both' }];
    cols.push({ role: 'O(A) Secretário(a)', name: str(v.secretarioNome) || undefined });
    const blocks: Block[] = [
      { type: 'logo', size: 'sm' },
      { type: 'display', text: igreja, size: 'xs', uppercase: true, weight: 'bold', tone: 'accent', fit: true, after: 2 },
      { type: 'display', text: 'Certificado de Baptismo', size: 'xl', weight: 'bold', after: 2 },
      { type: 'ornament', style: 'cross' },
      { type: 'display', text: 'Certificamos que', size: 'xs', italic: true, tone: 'muted', after: 2 },
      { type: 'display', text: str(v.nome) || '____________________', size: 'lg', weight: 'bold', fit: true, after: 3 },
      { type: 'display', text: `${corpo}.`, size: 'sm', after: 4 },
    ];
    if (str(v.versiculo)) blocks.push({ type: 'display', text: str(v.versiculo), size: 'xs', italic: true, tone: 'muted', after: 4 });
    blocks.push(
      { type: 'signatures', columns: cols },
      { type: 'display', text: [placeDate(ctx, v.data), reg].filter(Boolean).join('   ·   '), size: 'xs', tone: 'muted', after: 2 },
      { type: 'display', text: NOTA_BAPTISMO, size: 'xs', tone: 'muted', italic: true, after: 0 },
    );
    return blocks;
  },

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.nome)) w.push({ level: 'warning', field: 'nome', message: l('Indique o nome de quem foi baptizado.', 'Enter the name of the person baptised.') });
    w.push({
      level: 'info',
      message: l(
        'O certificado de baptismo tem valor apenas religioso. O nascimento prova-se pelo Registo Civil, e o certificado leva sempre essa nota.',
        'A baptism certificate has religious value only. Birth is proved by the civil registry, and the certificate always says so.',
      ),
    });
    return w;
  },
  personName: (v) => str(v.nome) || undefined,
  documentDate: (v) => str(v.dataBaptismo) || undefined,
});
