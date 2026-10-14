// Certificado religioso: confirmation (crisma), presentation of a child, first
// communion or profession of faith, issued by a church or parish from its own
// register. Same design as the baptism certificate: framed, centred, A5 or A4
// landscape. Religious only; the page says so.

import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { BLANK, dateLong, GENERO_OPTIONS, g, l, lineItems, localField, placeDate } from './_shared';
import { entidadeNome, juntar, str } from './_associacoes';

const TIPOS = [
  { value: 'crisma', label: l('Crisma (Confirmação católica)', 'Confirmation (Catholic)'), title: 'Certificado de Crisma' },
  { value: 'confirmacao', label: l('Confirmação / admissão como membro', 'Confirmation / admission as member'), title: 'Certificado de Confirmação' },
  { value: 'apresentacao', label: l('Apresentação de criança', 'Presentation of a child'), title: 'Certificado de Apresentação' },
  { value: 'comunhao', label: l('Primeira Comunhão', 'First Communion'), title: 'Certificado de Primeira Comunhão' },
  { value: 'profissao', label: l('Profissão de fé', 'Profession of faith'), title: 'Certificado de Profissão de Fé' },
];

const NOTA = 'Certificado de natureza exclusivamente religiosa, extraído dos registos da igreja. Não substitui documentos do Registo Civil.';

export default defineTemplate({
  id: 'certificado-religioso',
  family: 'declaracao',
  page: (v) => (v.formato === 'A4' ? 'A4-paisagem' : 'A5-paisagem'),
  verticalAlign: 'center',
  frame: 'double',
  noBrand: true,
  letterhead: false,
  sections: [
    { id: 'tipo', title: l('Celebração', 'Celebration') },
    { id: 'pessoa', title: l('Pessoa', 'Person'), personRole: 'outro' },
    { id: 'celebracao', title: l('Data, local e ministro', 'Date, place and minister') },
    { id: 'registo', title: l('Registo e assinaturas', 'Record and signatures') },
  ],
  fields: [
    { name: 'tipo', type: 'select', section: 'tipo', label: l('Tipo de certificado', 'Kind of certificate'), options: TIPOS.map(({ value, label }) => ({ value, label })), default: 'confirmacao' },
    { name: 'nome', type: 'text', section: 'pessoa', required: true, label: l('Nome completo', 'Full name'), personKey: 'nome' },
    { name: 'genero', type: 'radio', section: 'pessoa', width: 'half', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'dataNascimento', type: 'date', section: 'pessoa', width: 'half', label: l('Data de nascimento', 'Date of birth') },
    { name: 'pai', type: 'text', section: 'pessoa', width: 'half', label: l('Nome do pai', 'Father’s name') },
    { name: 'mae', type: 'text', section: 'pessoa', width: 'half', label: l('Nome da mãe', 'Mother’s name') },
    { name: 'igreja', type: 'text', section: 'celebracao', label: l('Igreja / paróquia', 'Church / parish'), default: (c) => c.profile?.firma ?? '' },
    { name: 'dataCelebracao', type: 'date', section: 'celebracao', width: 'half', required: true, label: l('Data da celebração', 'Date'), default: (c) => c.today },
    localField('celebracao'),
    { name: 'ministroTitulo', type: 'text', section: 'celebracao', width: 'half', label: l('Título do ministro', 'Minister’s title'), placeholder: l('Ex.: Pastor, Padre, D. (Bispo)', 'E.g. Pastor, Father, Bishop'), default: 'Pastor' },
    { name: 'ministro', type: 'text', section: 'celebracao', width: 'half', required: true, label: l('Ministro que celebrou', 'Officiating minister'), default: (c) => c.profile?.representanteNome ?? '' },
    {
      name: 'padrinhos',
      type: 'lines',
      section: 'celebracao',
      label: l('Padrinhos (opcional)', 'Sponsors (optional)'),
      addLabel: l('Adicionar padrinho/madrinha', 'Add sponsor'),
      columns: [{ name: 'nome', type: 'text', label: l('Nome', 'Name') }],
      default: [],
      showIf: (v) => v.tipo !== 'apresentacao',
    },
    { name: 'versiculo', type: 'text', section: 'celebracao', label: l('Versículo (opcional)', 'Bible verse (optional)') },
    { name: 'livro', type: 'text', section: 'registo', width: 'third', label: l('Livro n.º', 'Book no.') },
    { name: 'folhas', type: 'text', section: 'registo', width: 'third', label: l('Folhas', 'Page') },
    { name: 'assento', type: 'text', section: 'registo', width: 'third', label: l('Assento n.º', 'Entry no.') },
    { name: 'data', type: 'date', section: 'registo', width: 'half', label: l('Data de emissão', 'Issue date'), default: (c) => c.today },
    { name: 'secretarioNome', type: 'text', section: 'registo', width: 'half', label: l('Secretário(a) (opcional)', 'Secretary (optional)') },
    {
      name: 'formato',
      type: 'radio',
      section: 'registo',
      label: l('Tamanho do papel', 'Paper size'),
      options: [
        { value: 'A5', label: l('A5 horizontal (meia folha)', 'A5 landscape') },
        { value: 'A4', label: l('A4 horizontal (para emoldurar)', 'A4 landscape (for framing)') },
      ],
      default: 'A5',
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.nome)) w.push({ level: 'warning', field: 'nome', message: l('Indique o nome.', 'Enter the name.') });
    w.push({ level: 'info', message: l('Emita o certificado a partir do assento no livro de registos da igreja e indique o livro, as folhas e o assento.', 'Issue it from the entry in the church register and give book, page and entry.') });
    return w;
  },

  personName: (v) => str(v.nome) || undefined,
  documentDate: (v) => str(v.dataCelebracao) || undefined,

  blocks: (ctx) => {
    const v = ctx.values;
    const t = TIPOS.find((x) => x.value === v.tipo) ?? TIPOS[1];
    const igreja = str(v.igreja) || entidadeNome(ctx);
    const pais = [str(v.pai), str(v.mae)].filter(Boolean);
    const nasc = str(v.dataNascimento) ? `${g(v.genero, 'nascido', 'nascida')} em ${dateLong(v.dataNascimento)}` : '';
    const filiacao = pais.length ? `${g(v.genero, 'filho', 'filha')} de ${juntar(pais)}` : '';
    const ministro = `${str(v.ministroTitulo) || 'Pastor'} ${str(v.ministro) || BLANK}`;
    const onde = `na ${igreja}${str(v.local) ? `, em ${str(v.local)}` : ''}`;
    const quando = `no dia ${dateLong(v.dataCelebracao)}`;
    const pad = lineItems(v.padrinhos).map((r) => str(r.nome)).filter(Boolean);
    const padTxt = pad.length && v.tipo !== 'apresentacao' ? `sendo ${pad.length === 1 ? 'padrinho/madrinha' : 'padrinhos'} ${juntar(pad)}` : '';
    const accao: Record<string, string> = {
      crisma: `recebeu o Sacramento do Crisma ${quando}, ${onde}, conferido por ${ministro}`,
      confirmacao: `confirmou publicamente a sua fé e foi ${g(v.genero, 'recebido', 'recebida')} como membro de pleno direito ${quando}, ${onde}, pelo ${ministro}`,
      apresentacao: `foi ${g(v.genero, 'apresentado', 'apresentada')} ao Senhor ${quando}, ${onde}${pais.length ? ', pelos seus pais' : ''}, sendo celebrante o ${ministro}`,
      comunhao: `recebeu pela primeira vez o Sacramento da Eucaristia ${quando}, ${onde}, em celebração presidida por ${ministro}`,
      profissao: `fez a sua profissão de fé ${quando}, ${onde}, perante o ${ministro}`,
    };
    const corpo = [filiacao, nasc, accao[t.value], padTxt].filter(Boolean).join(', ');
    const reg = [str(v.livro) ? `Livro n.º ${str(v.livro)}` : '', str(v.folhas) ? `folhas ${str(v.folhas)}` : '', str(v.assento) ? `assento n.º ${str(v.assento)}` : ''].filter(Boolean).join(', ');
    const cols: SignatureColumn[] = [{ role: `O ${str(v.ministroTitulo) || 'Pastor'}`.replace(/^O D\./, 'O Bispo'), name: str(v.ministro) || undefined, image: 'both' }, { role: 'O(A) Secretário(a)', name: str(v.secretarioNome) || undefined }];
    const blocks: Block[] = [
      { type: 'logo', size: 'sm' },
      { type: 'display', text: igreja, size: 'xs', uppercase: true, weight: 'bold', tone: 'accent', fit: true, after: 2 },
      { type: 'display', text: t.title, size: 'xl', weight: 'bold', after: 2 },
      { type: 'ornament', style: 'cross' },
      { type: 'display', text: 'Certificamos que', size: 'xs', italic: true, tone: 'muted', after: 2 },
      { type: 'display', text: str(v.nome) || '____________________', size: 'lg', weight: 'bold', fit: true, after: 3 },
      { type: 'display', text: `${corpo}.`, size: 'sm', after: 4 },
    ];
    if (str(v.versiculo)) blocks.push({ type: 'display', text: str(v.versiculo), size: 'xs', italic: true, tone: 'muted', after: 4 });
    blocks.push(
      { type: 'signatures', columns: cols },
      { type: 'display', text: [placeDate(ctx, v.data), reg].filter(Boolean).join('   ·   '), size: 'xs', tone: 'muted', after: 2 },
      { type: 'display', text: NOTA, size: 'xs', tone: 'muted', italic: true, after: 0 },
    );
    return blocks;
  },
});
