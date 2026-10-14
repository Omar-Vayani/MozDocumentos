import { defineTemplate, type Block, type Warning } from '../model';
import { l } from './_shared';
import { TRAJE_OPTIONS, TRATAMENTO_OPTIONS, diasEntre, disp, footer, linhaData, rsvpFields, rsvpLine, str, cardScale } from './_eventos';

// Party invitation, A6 (four per A4): birthday (adult or child), wedding
// anniversary, graduation or baptism. A large typographic numeral (the age or
// the years of marriage) is the visual anchor; no clip-art.

const BODAS: [number, string][] = [
  [1, 'Papel'], [5, 'Madeira'], [10, 'Estanho'], [15, 'Cristal'], [20, 'Porcelana'], [25, 'Prata'],
  [30, 'Pérola'], [35, 'Coral'], [40, 'Rubi'], [45, 'Safira'], [50, 'Ouro'], [55, 'Esmeralda'], [60, 'Diamante'],
];

export default defineTemplate({
  id: 'convite-de-festa',
  family: 'declaracao',
  page: 'A6',
  frame: 'simple',
  verticalAlign: 'center',
  noBrand: true,
  letterhead: false,
  style: { font: 'classico' },
  sections: [
    { id: 'festa', title: l('Celebração', 'Celebration') },
    { id: 'local', title: l('Data e local', 'Date and place') },
    { id: 'notas', title: l('Confirmação e notas', 'RSVP and notes') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'select',
      section: 'festa',
      label: l('Tipo', 'Type'),
      options: [
        { value: 'aniversario', label: l('Aniversário', 'Birthday') },
        { value: 'crianca', label: l('Aniversário de criança', "Child's birthday") },
        { value: 'bodas', label: l('Bodas (aniversário de casamento)', 'Wedding anniversary') },
        { value: 'graduacao', label: l('Graduação', 'Graduation') },
        { value: 'baptizado', label: l('Baptizado ou apresentação', 'Baptism or dedication') },
        { value: 'outro', label: l('Outra celebração', 'Other celebration') },
      ],
      default: 'aniversario',
    },
    { name: 'celebrante', type: 'text', section: 'festa', width: 'half', required: true, label: l('Nome de quem celebra', 'Name of the person celebrating') },
    { name: 'celebrante2', type: 'text', section: 'festa', width: 'half', label: l('Cônjuge', 'Spouse'), showIf: (v) => v.tipo === 'bodas' },
    {
      name: 'pais',
      type: 'text',
      section: 'festa',
      width: 'half',
      label: l('Pais (quem convida)', 'Parents (hosts)'),
      showIf: (v) => v.tipo === 'baptizado' || v.tipo === 'crianca',
    },
    {
      name: 'numero',
      type: 'number',
      section: 'festa',
      width: 'half',
      min: 0,
      max: 120,
      label: l('Anos que celebra', 'Years being celebrated'),
      help: l('A idade ou os anos de casamento (o número grande do convite).', 'The age or the years of marriage (the large number).'),
      showIf: (v) => ['aniversario', 'crianca', 'bodas'].includes(v.tipo),
    },
    { name: 'curso', type: 'text', section: 'festa', label: l('Curso e instituição', 'Degree and institution'), placeholder: l('Licenciatura em Direito, Universidade Eduardo Mondlane', 'Degree, university'), showIf: (v) => v.tipo === 'graduacao' },
    { name: 'titulo', type: 'text', section: 'festa', label: l('Título da celebração', 'Celebration title'), showIf: (v) => v.tipo === 'outro' },
    { name: 'tratamento', type: 'select', section: 'festa', width: 'half', label: l('Convidado', 'Guest'), options: TRATAMENTO_OPTIONS, default: 'V. Ex.ª', showIf: (v) => v.tipo !== 'crianca' },
    { name: 'dataEvento', type: 'date', section: 'local', width: 'half', required: true, label: l('Data', 'Date') },
    { name: 'horaEvento', type: 'text', section: 'local', width: 'half', required: true, label: l('Hora', 'Time') },
    { name: 'localEvento', type: 'text', section: 'local', required: true, label: l('Local', 'Venue') },
    { name: 'enderecoEvento', type: 'text', section: 'local', label: l('Endereço', 'Address') },
    { name: 'programaExtra', type: 'text', section: 'local', label: l('Nota de programa (opcional)', 'Programme note (optional)'), placeholder: l('Missa de acção de graças às 10h00, na Sé Catedral', 'Thanksgiving service first') },
    ...rsvpFields('notas'),
    { name: 'traje', type: 'select', section: 'notas', width: 'half', label: l('Traje', 'Dress code'), options: TRAJE_OPTIONS, default: '' },
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const nome = str(v.celebrante) || 'Nome';
    const n = Number(v.numero) > 0 ? Math.round(Number(v.numero)) : undefined;
    const trat = str(v.tratamento) || 'V. Ex.ª';
    const out: Block[] = [];
    switch (v.tipo) {
      case 'crianca':
        if (str(v.pais)) out.push(disp(str(v.pais), 'xs', { tone: 'muted', after: 2 }));
        out.push(disp(`${nome} vai fazer`, 'md', { italic: true, tone: 'accent', fit: true, after: 0 }));
        if (n) out.push(disp(String(n), 'xxxl', { tone: 'accent', after: 0 }));
        out.push(disp(n === 1 ? 'aninho!' : 'anos!', 'md', { italic: true, tone: 'accent', after: 4 }));
        out.push(disp('Vem festejar connosco', 'sm', { uppercase: true, after: 2 }));
        break;
      case 'bodas': {
        const casal = [nome, str(v.celebrante2)].filter(Boolean).join(' & ');
        const b = n ? BODAS.find(([y]) => y === n)?.[1] : undefined;
        out.push(disp(casal, 'xxl', { italic: true, tone: 'accent', fit: true, after: 2 }));
        out.push(disp(`têm a alegria de convidar ${trat}\npara celebrar as suas`, 'sm', { italic: true, tone: 'muted', after: 2 }));
        out.push(disp(b ? `Bodas de ${b}` : 'Bodas de Casamento', 'md', { uppercase: true, after: 0 }));
        if (n) out.push(disp(String(n), 'xxxl', { tone: 'accent', after: 0 }));
        if (n) out.push(disp(n === 1 ? 'ano de casamento' : 'anos de casamento', 'sm', { uppercase: true, tone: 'muted', after: 2 }));
        break;
      }
      case 'graduacao':
        out.push(disp(nome, 'xxl', { italic: true, tone: 'accent', fit: true, after: 3 }));
        out.push(disp(`tem a honra de convidar ${trat}\npara a festa da sua`, 'sm', { italic: true, tone: 'muted', after: 2 }));
        out.push(disp('Graduação', 'xl', { uppercase: true, after: 1 }));
        if (str(v.curso)) out.push(disp(str(v.curso), 'xs', { italic: true, after: 2 }));
        break;
      case 'baptizado':
        out.push(disp(str(v.pais) || 'Os pais', 'sm', { fit: true, after: 2 }));
        out.push(disp(`têm a alegria de convidar ${trat}\npara o baptizado de`, 'sm', { italic: true, tone: 'muted', after: 2 }));
        out.push(disp(nome, 'xxl', { italic: true, tone: 'accent', fit: true, after: 2 }));
        break;
      case 'outro':
        out.push(disp(nome, 'xxl', { italic: true, tone: 'accent', fit: true, after: 3 }));
        out.push(disp(`tem o prazer de convidar ${trat} para`, 'sm', { italic: true, tone: 'muted', after: 2 }));
        out.push(disp(str(v.titulo) || 'a sua celebração', 'md', { uppercase: true, fit: true, after: 2 }));
        break;
      default:
        out.push(disp(nome, 'xxl', { italic: true, tone: 'accent', fit: true, after: 3 }));
        out.push(disp(`tem o prazer de convidar ${trat}\npara celebrar o seu aniversário`, 'sm', { italic: true, tone: 'muted', after: 2 }));
        if (n) out.push(disp(String(n), 'xxxl', { tone: 'accent', after: 0 }));
        if (n) out.push(disp('anos', 'sm', { uppercase: true, tone: 'muted', after: 2 }));
    }
    out.push({ type: 'ornament', style: 'rule' });
    if (str(v.programaExtra)) out.push(disp(str(v.programaExtra), 'xs', { italic: true, after: 3 }));
    out.push(disp(linhaData(v.dataEvento, v.horaEvento), 'md', { uppercase: true, weight: 'bold', fit: true, after: 2 }));
    out.push(disp(str(v.localEvento) || '____________________', 'md', { weight: 'bold', fit: true, after: 0 }));
    if (str(v.enderecoEvento)) out.push(disp(str(v.enderecoEvento), 'sm', { tone: 'muted', after: 0 }));
    out.push({ type: 'spacer', size: 'small' });
    out.push(...footer([rsvpLine(v, v.tipo === 'crianca' ? 'Confirmação' : 'Agradecemos a confirmação'), str(v.traje) ? `Traje: ${str(v.traje)}` : '']));
    return cardScale(out);
  },
  warnings: (v, ctx) => {
    const out: Warning[] = [];
    if (str(v.rsvpData) && str(v.dataEvento) && diasEntre(v.rsvpData, v.dataEvento) <= 0)
      out.push({ level: 'error', field: 'rsvpData', message: l('A data de confirmação tem de ser anterior à festa.', 'The RSVP date must be before the party.') });
    if (str(v.dataEvento) && diasEntre(ctx.today, v.dataEvento) < 0)
      out.push({ level: 'warning', field: 'dataEvento', message: l('A data já passou.', 'The date is in the past.') });
    if (v.tipo === 'bodas' && Number(v.numero) > 0 && !BODAS.some(([y]) => y === Number(v.numero)))
      out.push({ level: 'info', field: 'numero', message: l('Estes anos de casamento não têm um nome tradicional de bodas; o convite diz "Bodas de Casamento".', 'No traditional name for these years; it prints "Bodas de Casamento".') });
    return out;
  },
  personName: (v) => str(v.celebrante) || undefined,
  documentDate: (v) => str(v.dataEvento) || undefined,
});
