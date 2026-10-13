import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type Warning } from '../model';
import { dateLong, l } from './_shared';
import { TRAJE_OPTIONS, TRATAMENTO_OPTIONS, diasEntre, disp, footer, hora, linhaData, str } from './_eventos';

// Corporate or institutional invitation, A5 landscape: logo, host, event name,
// presiding guest, date line, venue, R.S.V.P. Mozambican protocol: "Sua
// Excelência" only for State office-holders and ambassadors.

export default defineTemplate({
  id: 'convite-institucional',
  family: 'declaracao',
  page: 'A5-paisagem',
  frame: 'simple',
  verticalAlign: 'center',
  noBrand: true,
  letterhead: false,
  style: { font: 'classico' },
  sections: [
    { id: 'anfitriao', title: l('Quem convida', 'Host') },
    { id: 'evento', title: l('Evento', 'Event') },
    { id: 'local', title: l('Data e local', 'Date and place') },
    { id: 'notas', title: l('R.S.V.P. e notas', 'RSVP and notes') },
  ],
  fields: [
    {
      name: 'quemConvida',
      type: 'text',
      section: 'anfitriao',
      required: true,
      label: l('Quem convida', 'Host'),
      default: (c) => (c.profile?.kind === 'empresa' ? `A Administração da ${profileDisplayName(c.profile)}` : c.profile?.nome ?? ''),
      help: l('Ex.: "O Conselho de Administração da …", "A Direcção da …", "O Reitor da …".', 'E.g. "The Board of …".'),
    },
    { name: 'mostrarLogo', type: 'toggle', section: 'anfitriao', width: 'half', label: l('Mostrar o logótipo', 'Show the logo'), default: true },
    { name: 'tricolour', type: 'toggle', section: 'anfitriao', width: 'half', label: l('Detalhe nas cores nacionais', 'National colours detail'), help: l('Um pequeno traço verde, amarelo e vermelho, por exemplo para eventos de datas nacionais.', 'A small green-yellow-red mark, e.g. for national days.'), default: false },
    { name: 'tratamento', type: 'select', section: 'anfitriao', width: 'half', label: l('Convidado', 'Guest'), options: TRATAMENTO_OPTIONS, default: 'V. Ex.ª' },
    { name: 'nomeConvidado', type: 'text', section: 'anfitriao', width: 'half', label: l('Nome do convidado (opcional)', 'Guest name (optional)'), help: l('Vazio: imprime uma linha para escrever à mão.', 'Empty: prints a line to write by hand.') },
    {
      name: 'tipoEvento',
      type: 'select',
      section: 'evento',
      width: 'half',
      label: l('Tipo de evento', 'Event type'),
      options: [
        { value: 'para a cerimónia de', label: l('Cerimónia', 'Ceremony') },
        { value: 'para o lançamento de', label: l('Lançamento', 'Launch') },
        { value: 'para a', label: l('Gala, conferência, jantar…', 'Gala, conference, dinner…') },
      ],
      default: 'para a cerimónia de',
    },
    { name: 'evento', type: 'text', section: 'evento', required: true, label: l('Nome do evento', 'Event name'), placeholder: l('Inauguração das Novas Instalações', 'Opening of the new offices') },
    { name: 'descricao', type: 'text', section: 'evento', label: l('Subtítulo (opcional)', 'Subtitle (optional)') },
    {
      name: 'presididoTipo',
      type: 'select',
      section: 'evento',
      width: 'half',
      label: l('Convidado de honra', 'Guest of honour'),
      options: [
        { value: '', label: l('Não indicar', 'None') },
        { value: 'que será presidida por', label: l('Presidida por', 'Presided over by') },
        { value: 'com a presença de', label: l('Com a presença de', 'In the presence of') },
      ],
      default: '',
    },
    {
      name: 'presididoPor',
      type: 'text',
      section: 'evento',
      width: 'half',
      label: l('Nome e cargo', 'Name and office'),
      placeholder: l('S. Ex.ª o Ministro da Indústria e Comércio', 'H.E. the Minister of …'),
      help: l('"S. Ex.ª" reserva-se a titulares de cargos do Estado e embaixadores; para outros use "o Senhor / a Senhora".', '"H.E." only for State office-holders and ambassadors.'),
      showIf: (v) => Boolean(v.presididoTipo),
    },
    { name: 'dataEvento', type: 'date', section: 'local', width: 'half', required: true, label: l('Data', 'Date') },
    { name: 'horaEvento', type: 'text', section: 'local', width: 'half', required: true, label: l('Hora', 'Time'), placeholder: l('17h30', '17h30') },
    { name: 'localEvento', type: 'text', section: 'local', required: true, label: l('Local', 'Venue') },
    { name: 'enderecoEvento', type: 'text', section: 'local', label: l('Endereço', 'Address') },
    {
      name: 'programa',
      type: 'lines',
      section: 'local',
      label: l('Programa resumido (opcional)', 'Short programme (optional)'),
      addLabel: l('Adicionar momento', 'Add item'),
      columns: [
        { name: 'hora', type: 'text', label: l('Hora', 'Time'), width: 'third' },
        { name: 'actividade', type: 'text', label: l('Momento', 'Item') },
      ],
      default: [],
    },
    { name: 'rsvpData', type: 'date', section: 'notas', width: 'third', label: l('R.S.V.P. até', 'RSVP by') },
    { name: 'rsvpEmail', type: 'email', section: 'notas', width: 'third', label: l('Email', 'Email'), default: (c) => c.profile?.email ?? '' },
    { name: 'rsvpTelefone', type: 'tel', section: 'notas', width: 'third', label: l('Telefone', 'Phone'), default: (c) => c.profile?.telefones ?? '' },
    { name: 'traje', type: 'select', section: 'notas', width: 'half', label: l('Traje', 'Dress code'), options: TRAJE_OPTIONS, default: 'Executivo' },
    { name: 'intransmissivel', type: 'toggle', section: 'notas', width: 'half', label: l('Convite pessoal e intransmissível', 'Personal, non-transferable'), default: true },
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const trat = str(v.tratamento) || 'V. Ex.ª';
    const prog = (Array.isArray(v.programa) ? v.programa : [])
      .filter((r: Record<string, unknown>) => str(r.actividade))
      .slice(0, 6)
      .map((r: Record<string, unknown>) => `${str(r.hora) ? `${hora(r.hora)}  ` : ''}${str(r.actividade)}`);
    const out: Block[] = [];
    if (v.mostrarLogo !== false) out.push({ type: 'logo', size: 'sm' });
    out.push(disp(str(v.nomeConvidado) ? `Exmo(a). Sr(a). ${str(v.nomeConvidado)}` : 'Exmo(a). Sr(a). ______________________________', 'xs', { tone: 'muted', fit: true, after: 4 }));
    out.push(disp(str(v.quemConvida) || '____________________', 'sm', { fit: true, after: 1 }));
    out.push(disp(`tem a honra de convidar ${trat} ${str(v.tipoEvento) || 'para a cerimónia de'}`, 'xs', { italic: true, tone: 'muted', after: 3 }));
    out.push(disp(str(v.evento) || 'Nome do Evento', 'xl', { tone: 'accent', fit: true, after: str(v.descricao) ? 1 : 3 }));
    if (str(v.descricao)) out.push(disp(str(v.descricao), 'sm', { italic: true, fit: true, after: 3 }));
    if (str(v.presididoTipo) && str(v.presididoPor)) out.push(disp(`${str(v.presididoTipo)} ${str(v.presididoPor)}`, 'xs', { italic: true, fit: true, after: 2 }));
    out.push({ type: 'ornament', style: v.tricolour ? 'tricolour' : 'rule' });
    out.push(disp(linhaData(v.dataEvento, v.horaEvento), 'sm', { uppercase: true, fit: true, after: 2 }));
    out.push(disp([str(v.localEvento) || '____________________', str(v.enderecoEvento)].filter(Boolean).join(' · '), 'xs', { weight: 'bold', fit: true, after: 4 }));
    if (prog.length) out.push(disp(prog.join('   ·   '), 'xs', { tone: 'muted', after: 4 }));
    const rsvp = [str(v.rsvpData) ? `R.S.V.P. até ${dateLong(v.rsvpData)}` : 'R.S.V.P.', str(v.rsvpEmail), str(v.rsvpTelefone)];
    const notas = [
      str(v.rsvpData) || str(v.rsvpEmail) || str(v.rsvpTelefone) ? rsvp.filter(Boolean).join(' · ') : '',
      [str(v.traje) ? `Traje: ${str(v.traje)}` : '', v.intransmissivel ? 'Este convite é pessoal e intransmissível e deverá ser apresentado à entrada.' : ''].filter(Boolean).join(' · '),
    ];
    out.push(...footer(notas));
    return out;
  },
  warnings: (v, ctx) => {
    const out: Warning[] = [];
    if (!ctx.profile?.branding?.logoAssetId && v.mostrarLogo !== false)
      out.push({ level: 'info', field: 'mostrarLogo', message: l('Adicione o logótipo no perfil para um convite mais profissional.', 'Add a logo to the profile for a more professional invitation.') });
    if (str(v.rsvpData) && str(v.dataEvento) && diasEntre(v.rsvpData, v.dataEvento) <= 0)
      out.push({ level: 'error', field: 'rsvpData', message: l('A data de confirmação tem de ser anterior ao evento.', 'The RSVP date must be before the event.') });
    if (str(v.dataEvento) && diasEntre(ctx.today, v.dataEvento) < 0)
      out.push({ level: 'warning', field: 'dataEvento', message: l('A data do evento já passou.', 'The event date is in the past.') });
    if (/s\.\s*ex\.?ª|sua excel/i.test(str(v.presididoPor)))
      out.push({ level: 'info', field: 'presididoPor', message: l('Confirme que a pessoa é titular de cargo do Estado ou embaixador: só a estes se dá o tratamento de "Sua Excelência".', 'Check the person holds State office or is an ambassador.') });
    return out;
  },
  personName: (v) => str(v.evento) || undefined,
  documentDate: (v) => str(v.dataEvento) || undefined,
});
