import { defineTemplate, type Block, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateLong, l } from './_shared';
import { FRASE_LUTO_OPTIONS, SIMBOLO_OPTIONS, TRATAMENTO_FALECIDO_OPTIONS, dataComDia, diasEntre, disp, emLocal, hora, plural, str, vidaDatas } from './_eventos';

// Death notice ("participação de falecimento"), A5, black and grey only.
// Mozambican newspaper usage: "FALECEU", the name, the family "comunicam, com
// profunda dor, o falecimento do seu ente querido…", wake and funeral, "Paz à
// sua alma." The cause of death is private: only a general mention, off by default.

const ACTOS = [
  { value: 'Velório', label: l('Velório / câmara ardente', 'Wake') },
  { value: 'Missa de corpo presente', label: l('Missa de corpo presente', 'Funeral mass') },
  { value: 'Culto fúnebre', label: l('Culto fúnebre', 'Funeral service') },
  { value: 'Oração fúnebre (Janazah)', label: l('Oração fúnebre (Janazah)', 'Janazah prayer') },
  { value: 'Cortejo fúnebre', label: l('Cortejo fúnebre', 'Funeral procession') },
  { value: 'Funeral', label: l('Funeral / enterro', 'Burial') },
  { value: 'Cremação', label: l('Cremação', 'Cremation') },
];

export default defineTemplate({
  id: 'participacao-de-falecimento',
  family: 'declaracao',
  page: 'A5',
  frame: 'simple',
  verticalAlign: 'center',
  noBrand: true,
  letterhead: false,
  style: { mono: true, font: 'classico' },
  sections: [
    { id: 'falecido', title: l('A pessoa falecida', 'The deceased') },
    { id: 'familia', title: l('Quem comunica', 'Announced by') },
    { id: 'cerimonias', title: l('Cerimónias fúnebres', 'Funeral arrangements') },
    { id: 'estilo', title: l('Apresentação', 'Presentation') },
  ],
  fields: [
    { name: 'falecidoTratamento', type: 'select', section: 'falecido', width: 'third', label: l('Título', 'Title'), options: TRATAMENTO_FALECIDO_OPTIONS, default: '' },
    { name: 'falecidoNome', type: 'text', section: 'falecido', required: true, label: l('Nome completo', 'Full name') },
    { name: 'falecidoGenero', type: 'radio', section: 'falecido', width: 'half', required: true, label: l('Género', 'Gender'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'dataNascimento', type: 'date', section: 'falecido', width: 'half', label: l('Data de nascimento (opcional)', 'Date of birth (optional)') },
    { name: 'dataFalecimento', type: 'date', section: 'falecido', width: 'half', required: true, label: l('Data do falecimento', 'Date of death') },
    { name: 'localFalecimento', type: 'text', section: 'falecido', width: 'half', label: l('Local (cidade)', 'Place (city)'), placeholder: l('Cidade de Maputo', 'Maputo City') },
    {
      name: 'causa',
      type: 'select',
      section: 'falecido',
      label: l('Mencionar a causa', 'Mention the cause'),
      help: l('A causa da morte é informação privada da família. Nunca indique a doença.', 'The cause of death is private. Never name the illness.'),
      options: [
        { value: '', label: l('Não mencionar (recomendado)', 'Do not mention (recommended)') },
        { value: 'vítima de doença', label: l('"vítima de doença"', '"after an illness"') },
        { value: 'vítima de acidente', label: l('"vítima de acidente"', '"in an accident"') },
      ],
      default: '',
    },
    {
      name: 'quemComunica',
      type: 'text',
      section: 'familia',
      required: true,
      label: l('Quem comunica', 'Announced by'),
      default: 'A esposa, filhos, netos, irmãos e demais familiares',
      help: l('Ex.: "A Família Sitoe", "O esposo, filhos e demais familiares".', 'E.g. "The Sitoe family".'),
    },
    { name: 'contactoNome', type: 'text', section: 'familia', width: 'half', label: l('Contacto (nome)', 'Contact (name)') },
    { name: 'contactoTelefone', type: 'tel', section: 'familia', width: 'half', label: l('Contacto (telefone)', 'Contact (phone)') },
    {
      name: 'cerimonias',
      type: 'lines',
      section: 'cerimonias',
      label: l('Programa', 'Programme'),
      addLabel: l('Adicionar acto', 'Add item'),
      columns: [
        { name: 'acto', type: 'select', label: l('Acto', 'Item'), options: ACTOS },
        { name: 'data', type: 'date', label: l('Data', 'Date') },
        { name: 'hora', type: 'text', label: l('Hora', 'Time') },
        { name: 'local', type: 'text', label: l('Local', 'Place') },
      ],
      default: [
        { acto: 'Velório', data: '', hora: '', local: '' },
        { acto: 'Funeral', data: '', hora: '', local: 'Cemitério de Lhanguene' },
      ],
      help: l('Cemitérios frequentes em Maputo: Lhanguene, Michafutene, Texlom.', 'Common Maputo cemeteries: Lhanguene, Michafutene, Texlom.'),
    },
    { name: 'aAnunciar', type: 'toggle', section: 'cerimonias', label: l('Cerimónias em data a anunciar', 'Arrangements to be announced'), default: false },
    { name: 'titulo', type: 'select', section: 'estilo', width: 'half', label: l('Título', 'Heading'), options: [
      { value: 'Faleceu', label: l('FALECEU', 'FALECEU') },
      { value: 'Participação de Falecimento', label: l('PARTICIPAÇÃO DE FALECIMENTO', 'PARTICIPAÇÃO DE FALECIMENTO') },
      { value: 'Partiu para o Senhor', label: l('PARTIU PARA O SENHOR', 'PARTIU PARA O SENHOR') },
    ], default: 'Faleceu' },
    { name: 'simbolo', type: 'select', section: 'estilo', width: 'half', label: l('Símbolo', 'Symbol'), options: SIMBOLO_OPTIONS, default: 'nenhum' },
    { name: 'datasCompletas', type: 'toggle', section: 'estilo', width: 'half', label: l('Datas completas (dia.mês.ano)', 'Full dates (dd.mm.yyyy)'), default: false },
    { name: 'fraseFinal', type: 'select', section: 'estilo', width: 'half', label: l('Fórmula final', 'Closing'), options: FRASE_LUTO_OPTIONS, default: 'Paz à sua alma.' },
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const nome = str(v.falecidoNome) || '____________________';
    const titulado = [str(v.falecidoTratamento), nome].filter(Boolean).join(' ');
    const quem = str(v.quemComunica) || 'A família';
    const datas = vidaDatas(v.dataNascimento, v.dataFalecimento, Boolean(v.datasCompletas));
    const actos = (Array.isArray(v.cerimonias) ? v.cerimonias : []).filter((r: Record<string, unknown>) => str(r.acto) || str(r.local));
    const out: Block[] = [];
    if (v.simbolo === 'cruz') out.push({ type: 'ornament', style: 'cross' });
    out.push(disp(str(v.titulo) || 'Faleceu', 'md', { uppercase: true, after: 8 }));
    out.push(disp(nome, 'xl', { weight: 'bold', fit: true, after: 2 }));
    if (datas) out.push(disp(datas, 'sm', { tone: 'muted', after: 2 }));
    out.push({ type: 'ornament', style: 'rule' });
    const onde = emLocal(v.localFalecimento);
    const causa = str(v.causa) ? `, ${str(v.causa)}` : '';
    out.push(
      disp(
        `${quem} ${plural(quem) ? 'comunicam' : 'comunica'}, com profunda dor, o falecimento do seu ente querido ${titulado}, ocorrido no dia ${dateLong(v.dataFalecimento)}${onde}${causa}.`,
        'sm',
        { after: 6 },
      ),
    );
    if (v.aAnunciar) {
      out.push(disp('As cerimónias fúnebres serão anunciadas oportunamente.', 'sm', { italic: true, after: 6 }));
    } else if (actos.length) {
      for (const [i, r] of actos.entries()) {
        const quando = [str(r.data) ? dataComDia(r.data) : '', str(r.hora) ? hora(r.hora) : ''].filter(Boolean).join(', ');
        out.push(disp(str(r.acto) || 'Cerimónia', 'xs', { uppercase: true, weight: 'bold', after: 0 }));
        out.push(disp([quando, str(r.local)].filter(Boolean).join(' — ') || '____________________', 'sm', { after: i === actos.length - 1 ? 6 : 4 }));
      }
    }
    if (str(v.fraseFinal)) out.push(disp(str(v.fraseFinal), 'sm', { italic: true, after: 6 }));
    const contacto = [str(v.contactoNome), str(v.contactoTelefone)].filter(Boolean).join(' · ');
    if (contacto) out.push(disp(`Contacto: ${contacto}`, 'xs', { tone: 'muted', after: 0 }));
    return out;
  },
  warnings: (v) => {
    const out: Warning[] = [];
    const actos = Array.isArray(v.cerimonias) ? v.cerimonias : [];
    if (actos.some((r: Record<string, unknown>) => str(r.data) && diasEntre(v.dataFalecimento, r.data) < 0))
      out.push({ level: 'error', field: 'cerimonias', message: l('Uma cerimónia tem data anterior ao falecimento.', 'A ceremony is dated before the death.') });
    if (str(v.causa))
      out.push({ level: 'info', field: 'causa', message: l('Evite indicar a causa da morte: é informação privada da família.', 'Avoid stating the cause of death: it is private.') });
    if (!v.aAnunciar && !actos.some((r: Record<string, unknown>) => str(r.local)))
      out.push({ level: 'info', field: 'cerimonias', message: l('Indique o local e a hora do funeral, ou marque "em data a anunciar".', 'Give the funeral place and time, or mark "to be announced".') });
    out.push({
      level: 'info',
      message: l(
        `Este anúncio não substitui o registo do óbito na Conservatória do Registo Civil (${cite('registoObito')}), necessário para a certidão de óbito.`,
        'This notice does not replace registering the death at the Civil Registry.',
      ),
    });
    return out;
  },
  personName: (v) => str(v.falecidoNome) || undefined,
  documentDate: (v) => str(v.dataFalecimento) || undefined,
});
