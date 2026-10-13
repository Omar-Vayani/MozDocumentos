// Extracto de acta: certified copy of one or more resolutions recorded in the
// minutes book, for banks, notaries and the registry.
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, g, GENERO_OPTIONS, l, lineItems, localField } from './_shared';
import { num, comReconhecimento, semPonto, sociedadeFields, sociedadeIdent, sociedadeNome, str } from './_sociedades';

const ORGAOS: Record<string, { de: string; en: string }> = {
  assembleiaGeral: { de: 'da reunião da assembleia geral', en: 'general meeting' },
  conselhoAdministracao: { de: 'da reunião do conselho de administração', en: 'board of directors' },
  gerencia: { de: 'da reunião da gerência', en: 'management' },
  socioUnico: { de: 'das decisões do sócio único', en: 'sole member’s decisions' },
};

type Delib = { texto: string; votacao: string };
const delibs = (v: Values): Delib[] =>
  lineItems(v.deliberacoes)
    .map((r) => ({ texto: semPonto(r.texto).replace(/^[«"]|[»"]$/g, ''), votacao: str(r.votacao) }))
    .filter((d) => d.texto);

const VOTACAO: Record<string, string> = {
  unanimidade: 'aprovada por unanimidade',
  maioria: 'aprovada por maioria',
  omitir: '',
};

export default defineTemplate({
  id: 'extracto-de-acta',
  family: 'acta',
  official: 'registo',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'sociedade', title: l('Sociedade', 'Company') },
    { id: 'acta', title: l('Acta', 'Minutes') },
    { id: 'deliberacoes', title: l('Deliberações transcritas', 'Resolutions transcribed') },
    { id: 'certificante', title: l('Quem certifica', 'Certifying officer') },
  ],
  fields: [
    localField(),
    dateField(),
    ...sociedadeFields('sociedade'),
    {
      name: 'numeroActa',
      type: 'text',
      section: 'acta',
      width: 'half',
      required: true,
      label: l('Acta n.º', 'Minutes no.'),
      placeholder: l('Ex.: 7/2026', 'E.g. 7/2026'),
    },
    {
      name: 'orgao',
      type: 'select',
      section: 'acta',
      width: 'half',
      label: l('Órgão', 'Body'),
      options: [
        { value: 'assembleiaGeral', label: l('Assembleia geral', 'General meeting') },
        { value: 'conselhoAdministracao', label: l('Conselho de administração', 'Board of directors') },
        { value: 'gerencia', label: l('Gerência', 'Management') },
        { value: 'socioUnico', label: l('Decisão do sócio único', 'Sole member’s decision') },
      ],
      default: 'assembleiaGeral',
    },
    { name: 'dataReuniao', type: 'date', section: 'acta', width: 'half', required: true, label: l('Data da reunião ou decisão', 'Date of the meeting or decision') },
    { name: 'folhas', type: 'text', section: 'acta', width: 'half', label: l('Folhas do livro de actas (opcional)', 'Pages of the minutes book (optional)'), placeholder: l('Ex.: 12 a 14', 'E.g. 12 to 14') },
    {
      name: 'presencas',
      type: 'select',
      section: 'acta',
      width: 'half',
      label: l('Presenças', 'Attendance'),
      options: [
        { value: 'totalidade', label: l('Todo o capital presente ou representado', 'All capital present or represented') },
        { value: 'percentagem', label: l('Parte do capital', 'Part of the capital') },
        { value: 'omitir', label: l('Não mencionar', 'Do not mention') },
      ],
      default: 'totalidade',
      showIf: (v) => v.orgao !== 'socioUnico',
    },
    {
      name: 'presencasPct',
      type: 'number',
      section: 'acta',
      width: 'half',
      min: 1,
      max: 100,
      label: l('Percentagem do capital presente', 'Percentage of capital present'),
      showIf: (v) => v.orgao !== 'socioUnico' && v.presencas === 'percentagem',
    },
    {
      name: 'deliberacoes',
      type: 'lines',
      section: 'deliberacoes',
      required: true,
      label: l('Deliberações', 'Resolutions'),
      help: l('Copie o texto exactamente como está no livro de actas.', 'Copy the text exactly as it appears in the minutes book.'),
      addLabel: l('Adicionar deliberação', 'Add resolution'),
      columns: [
        { name: 'texto', type: 'textarea', label: l('Texto da deliberação', 'Resolution text'), rows: 3 },
        {
          name: 'votacao',
          type: 'select',
          label: l('Votação', 'Vote'),
          options: [
            { value: 'unanimidade', label: l('Unanimidade', 'Unanimous') },
            { value: 'maioria', label: l('Maioria', 'Majority') },
            { value: 'omitir', label: l('Não mencionar', 'Do not mention') },
          ],
        },
      ],
      default: [{ texto: '', votacao: 'unanimidade' }],
    },
    {
      name: 'certNome',
      type: 'text',
      section: 'certificante',
      required: true,
      label: l('Nome', 'Name'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteNome ?? '' : ''),
    },
    { name: 'certGenero', type: 'radio', section: 'certificante', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    {
      name: 'certCargo',
      type: 'select',
      section: 'certificante',
      width: 'half',
      label: l('Qualidade', 'Capacity'),
      options: [
        { value: 'presidenteMesa', label: l('Presidente da Mesa da Assembleia Geral', 'Chair of the general meeting') },
        { value: 'secretario', label: l('Secretário da Sociedade', 'Company Secretary') },
        { value: 'gerente', label: l('Gerente', 'Manager') },
        { value: 'administrador', label: l('Administrador', 'Director') },
        { value: 'pca', label: l('Presidente do Conselho de Administração', 'Chair of the board') },
      ],
      default: 'gerente',
    },
    {
      name: 'reconhecimento',
      type: 'toggle',
      section: 'certificante',
      label: l('Espaço para reconhecimento notarial', 'Space for notarial recognition'),
      help: l('Alguns bancos e a Conservatória pedem a assinatura reconhecida.', 'Some banks and the registry ask for a certified signature.'),
    },
  ],

  personName: (v) => str(v.sociedadeFirma) || undefined,
  documentDate: (v) => v.data,

  warnings: (v) => {
    const w: Warning[] = [];
    if (!delibs(v).length) w.push({ level: 'warning', field: 'deliberacoes', message: l('Transcreva pelo menos uma deliberação.', 'Transcribe at least one resolution.') });
    w.push({
      level: 'info',
      message: l(
        `Transcreva as deliberações palavra por palavra. O extracto não substitui a acta, que tem de constar do livro de actas (${cite('actaConteudo')}). Alterar o conteúdo constitui falsificação.`,
        'Transcribe the resolutions word for word. The extract does not replace the minutes, which must be in the minutes book. Altering the text is forgery.',
      ),
    });
    return w;
  },

  blocks: (ctx) => {
    const v = ctx.values;
    const ds = delibs(v);
    const orgao = ORGAOS[v.orgao] ?? ORGAOS.assembleiaGeral;
    const cargos: Record<string, [string, string]> = {
      presidenteMesa: ['Presidente da Mesa da Assembleia Geral', 'Presidente da Mesa da Assembleia Geral'],
      secretario: ['Secretário da Sociedade', 'Secretária da Sociedade'],
      gerente: ['Gerente', 'Gerente'],
      administrador: ['Administrador', 'Administradora'],
      pca: ['Presidente do Conselho de Administração', 'Presidente do Conselho de Administração'],
    };
    const cargo = g(v.certGenero, ...(cargos[v.certCargo] ?? cargos.gerente));
    const pctPres = num(v.presencasPct);
    const presencas =
      v.orgao === 'socioUnico' || v.presencas === 'omitir'
        ? ''
        : v.presencas === 'percentagem'
          ? `, na qual estiveram presentes ou representados sócios titulares de ${pctPres != null ? `${pctPres}%` : '____%'} do capital social`
          : ', na qual esteve presente ou representada a totalidade do capital social';
    const folhas = str(v.folhas) ? `, lavrada a folhas ${semPonto(v.folhas)} do respectivo livro de actas` : '';
    const varias = ds.length > 1;

    const blocks: Block[] = [
      { type: 'title', text: `Extracto da Acta n.º ${str(v.numeroActa) || '____'}`, subtitle: sociedadeNome(v) },
      {
        type: 'paragraph',
        id: 'certifica',
        text: `${g(v.certGenero, 'O abaixo assinado', 'A abaixo assinada')}, **${str(v.certNome) || BLANK}**, na qualidade de ${cargo} da sociedade ${sociedadeIdent(v)}, certifica que da acta n.º ${str(v.numeroActa) || '____'} ${orgao.de} da referida sociedade, ${v.orgao === 'socioUnico' ? 'datada de' : 'realizada em'} ${dateLong(v.dataReuniao)}${folhas}${presencas}, ${varias ? 'constam, entre outras, as seguintes deliberações' : 'consta, entre outras, a seguinte deliberação'}:`,
        en: `The undersigned, as ${v.certCargo || 'officer'} of the company, certifies that minutes no. ${v.numeroActa || '—'} of the ${orgao.en} held on ${v.dataReuniao || '—'} contain, among others, the following resolution(s):`,
      },
    ];
    (ds.length ? ds : [{ texto: '', votacao: 'omitir' }]).forEach((d, i) => {
      const vot = VOTACAO[d.votacao] ?? '';
      blocks.push({
        type: 'paragraph',
        id: `deliberacao-${i + 1}`,
        text: `${varias ? `**${i + 1}.** ` : ''}«${d.texto || BLANK}.»${vot && v.orgao !== 'socioUnico' ? ` (Deliberação ${vot}.)` : ''}`,
        en: 'Resolution transcribed from the minutes.',
        indent: true,
      });
    });
    blocks.push(
      {
        type: 'paragraph',
        id: 'conforme',
        text: 'Está conforme o original, que se encontra arquivado na sede da sociedade.',
        en: 'True copy of the original, kept at the registered office.',
      },
      {
        type: 'paragraph',
        id: 'fecho',
        text: 'Por ser verdade, passa-se o presente extracto, que vai assinado e autenticado com o carimbo da sociedade.',
        en: 'In witness whereof this extract is signed and stamped.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.data)}`,
        columns: [{ role: `${g(v.certGenero, 'O', 'A')} ${cargo}`, name: str(v.certNome) || undefined, image: ctx.profile?.kind === 'empresa' ? 'both' : undefined }],
      },
    );
    if (v.reconhecimento) comReconhecimento(blocks, 'Reconhecimento notarial da assinatura');
    return blocks;
  },
});
