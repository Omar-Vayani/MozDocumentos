import { defineTemplate, type Block, type FieldDef, type Warning } from '../model';
import { cite, l } from './_shared';
import { TRAJE_OPTIONS, TRATAMENTO_OPTIONS, diasEntre, disp, footer, hora, linhaData, rsvpFields, rsvpLine, str, cardScale } from './_eventos';

// Wedding invitation, A5 portrait (two per A4), framed, serif.
// Classic Portuguese formula: "Os pais … têm a honra de convidar V. Ex.ª para a
// cerimónia de casamento de seus filhos", names large, date line, venue, copo-d'água.

const parent = (name: string, label: [string, string]): FieldDef[] => [
  { name, type: 'text', section: 'pais', width: 'half', label: l(label[0], label[1]), showIf: (v) => v.quemConvida !== 'noivos' },
  {
    name: `${name}Falecido`,
    type: 'toggle',
    section: 'pais',
    width: 'half',
    label: l('Falecido(a) — imprimir "(in memoriam)"', 'Deceased — print "(in memoriam)"'),
    default: false,
    showIf: (v) => v.quemConvida !== 'noivos' && Boolean(str(v[name])),
  },
];

function casal(a: unknown, aMorto: unknown, b: unknown, bMorto: unknown): string {
  const n = (x: unknown, m: unknown) => (str(x) ? `${str(x)}${m ? ' (in memoriam)' : ''}` : '');
  return [n(a, aMorto), n(b, bMorto)].filter(Boolean).join(' e ');
}

export default defineTemplate({
  id: 'convite-de-casamento',
  family: 'declaracao',
  page: 'A5',
  frame: 'double',
  verticalAlign: 'center',
  noBrand: true,
  letterhead: false,
  style: { font: 'classico' },
  sections: [
    { id: 'noivos', title: l('Os noivos', 'The couple') },
    { id: 'pais', title: l('Quem convida', 'Hosts') },
    { id: 'cerimonia', title: l('Cerimónia', 'Ceremony') },
    { id: 'recepcao', title: l('Copo-d’água', 'Reception') },
    { id: 'notas', title: l('Confirmação e notas', 'RSVP and notes') },
  ],
  fields: [
    { name: 'noiva', type: 'text', section: 'noivos', width: 'half', required: true, label: l('Noiva', 'Bride'), help: l('Como quer que apareça: por exemplo "Ana Cristina".', 'As it should appear, e.g. "Ana Cristina".') },
    { name: 'noivo', type: 'text', section: 'noivos', width: 'half', required: true, label: l('Noivo', 'Groom') },
    {
      name: 'citacao',
      type: 'textarea',
      section: 'noivos',
      rows: 2,
      label: l('Citação (opcional)', 'Quote (optional)'),
      help: l(
        'Uma frase curta no topo. Ex.: «O amor é paciente, o amor é bondoso.» — 1 Coríntios 13:4',
        'A short line at the top, e.g. a Bible or Qur’an verse.',
      ),
    },
    {
      name: 'quemConvida',
      type: 'radio',
      section: 'pais',
      label: l('Quem convida', 'Who invites'),
      options: [
        { value: 'pais', label: l('Os pais dos noivos (clássico)', 'The parents (classic)') },
        { value: 'noivosPais', label: l('Os noivos, com os nomes dos pais', 'The couple, with the parents’ names') },
        { value: 'noivos', label: l('Os noivos', 'The couple') },
      ],
      default: 'pais',
    },
    ...parent('paiNoiva', ['Pai da noiva', "Bride's father"]),
    ...parent('maeNoiva', ['Mãe da noiva', "Bride's mother"]),
    ...parent('paiNoivo', ['Pai do noivo', "Groom's father"]),
    ...parent('maeNoivo', ['Mãe do noivo', "Groom's mother"]),
    { name: 'tratamento', type: 'select', section: 'pais', label: l('Convidado', 'Guest'), options: TRATAMENTO_OPTIONS, default: 'V. Ex.ª' },
    {
      name: 'tipoCerimonia',
      type: 'select',
      section: 'cerimonia',
      label: l('Cerimónia', 'Ceremony'),
      options: [
        { value: 'religiosa', label: l('Religiosa', 'Religious') },
        { value: 'civil', label: l('Civil (conservatória)', 'Civil (registry)') },
        { value: 'ambas', label: l('Civil e religiosa', 'Civil and religious') },
      ],
      default: 'religiosa',
    },
    { name: 'dataEvento', type: 'date', section: 'cerimonia', width: 'half', required: true, label: l('Data', 'Date') },
    { name: 'horaEvento', type: 'text', section: 'cerimonia', width: 'half', required: true, label: l('Hora', 'Time'), placeholder: l('11h00', '11h00') },
    { name: 'localCerimonia', type: 'text', section: 'cerimonia', required: true, label: l('Local da cerimónia', 'Ceremony venue'), placeholder: l('Igreja Paroquial de Santo António da Polana', 'Church, mosque or registry office') },
    { name: 'enderecoCerimonia', type: 'text', section: 'cerimonia', label: l('Endereço', 'Address') },
    { name: 'localCivil', type: 'text', section: 'cerimonia', width: 'half', label: l('Conservatória (cerimónia civil)', 'Registry office'), default: 'Conservatória do Registo Civil de Maputo', showIf: (v) => v.tipoCerimonia === 'ambas' },
    { name: 'horaCivil', type: 'text', section: 'cerimonia', width: 'half', label: l('Hora da cerimónia civil', 'Civil ceremony time'), showIf: (v) => v.tipoCerimonia === 'ambas' },
    {
      name: 'recepcaoTermo',
      type: 'select',
      section: 'recepcao',
      label: l('Designação', 'Name'),
      options: [
        { value: 'copo-d’água', label: l('Copo-d’água', 'Reception (copo-d’água)') },
        { value: 'recepção', label: l('Recepção', 'Reception') },
        { value: 'jantar', label: l('Jantar', 'Dinner') },
        { value: '', label: l('Sem recepção', 'No reception') },
      ],
      default: 'copo-d’água',
    },
    { name: 'localRecepcao', type: 'text', section: 'recepcao', label: l('Local', 'Venue'), showIf: (v) => Boolean(v.recepcaoTermo) },
    { name: 'enderecoRecepcao', type: 'text', section: 'recepcao', label: l('Endereço', 'Address'), showIf: (v) => Boolean(v.recepcaoTermo) },
    ...rsvpFields('notas'),
    { name: 'traje', type: 'select', section: 'notas', width: 'half', label: l('Traje', 'Dress code'), options: TRAJE_OPTIONS, default: '' },
    { name: 'pessoas', type: 'number', section: 'notas', width: 'half', min: 0, max: 20, label: l('Convite válido para (pessoas)', 'Valid for (people)'), help: l('Deixe vazio para não indicar.', 'Leave empty to omit.') },
    { name: 'listaPresentes', type: 'text', section: 'notas', label: l('Lista de presentes (opcional)', 'Gift registry (optional)') },
    { name: 'semCriancas', type: 'toggle', section: 'notas', label: l('Celebração reservada a adultos', 'Adults only'), default: false },
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const noiva = str(v.noiva) || 'Nome da Noiva';
    const noivo = str(v.noivo) || 'Nome do Noivo';
    const trat = str(v.tratamento) || 'V. Ex.ª';
    const pNoiva = casal(v.paiNoiva, v.paiNoivaFalecido, v.maeNoiva, v.maeNoivaFalecido);
    const pNoivo = casal(v.paiNoivo, v.paiNoivoFalecido, v.maeNoivo, v.maeNoivoFalecido);
    const civil = v.tipoCerimonia === 'civil';
    const out: Block[] = [];

    if (str(v.citacao)) out.push(disp(str(v.citacao), 'xs', { italic: true, tone: 'muted', after: 12 }));

    const names: Block[] = [
      disp(noiva, 'xxl', { italic: true, tone: 'accent', fit: true, after: 0 }),
      disp('&', 'xl', { italic: true, tone: 'accent', after: 0 }),
      disp(noivo, 'xxl', { italic: true, tone: 'accent', fit: true, after: 4 }),
    ];

    if (v.quemConvida === 'noivos' || v.quemConvida === 'noivosPais' || (!pNoiva && !pNoivo)) {
      if (v.quemConvida === 'noivosPais' && (pNoiva || pNoivo)) {
        out.push(disp([pNoiva, pNoivo].filter(Boolean).join('\n'), 'xs', { tone: 'muted', after: 2 }));
        out.push(disp('com a bênção de seus pais', 'xs', { italic: true, tone: 'muted', after: 12 }));
      }
      out.push(...names);
      out.push(
        disp(`têm a alegria de convidar ${trat} para a celebração do seu casamento`, 'sm', { italic: true, tone: 'muted', after: 2 }),
      );
    } else {
      out.push(disp([pNoiva, pNoivo].filter(Boolean).join('\ne\n'), 'sm', { after: 6 }));
      out.push(disp(`têm a honra de convidar ${trat}\npara a cerimónia de casamento de seus filhos`, 'sm', { italic: true, tone: 'muted', after: 10 }));
      out.push(...names);
    }

    out.push({ type: 'ornament', style: 'rule' });
    out.push(disp(linhaData(v.dataEvento, v.horaEvento), 'sm', { uppercase: true, fit: true, after: 4 }));
    const local = str(v.localCerimonia) || (civil ? 'Conservatória do Registo Civil' : '____________________');
    out.push(disp(local, 'sm', { weight: 'bold', fit: true, after: str(v.enderecoCerimonia) ? 0 : 4 }));
    if (str(v.enderecoCerimonia)) out.push(disp(str(v.enderecoCerimonia), 'xs', { tone: 'muted', after: 4 }));
    if (v.tipoCerimonia === 'ambas' && (str(v.localCivil) || str(v.horaCivil)))
      out.push(disp(`Cerimónia civil${str(v.horaCivil) ? ` às ${hora(v.horaCivil)}` : ''}, na ${str(v.localCivil) || 'Conservatória do Registo Civil'}.`, 'xs', { italic: true, tone: 'muted', after: 4 }));

    if (str(v.recepcaoTermo)) {
      const onde = [str(v.localRecepcao), str(v.enderecoRecepcao)].filter(Boolean).join(', ');
      out.push(
        disp(`Após a cerimónia, os noivos receberão os convidados para o ${str(v.recepcaoTermo)}${onde ? `, no ${onde}` : ''}.`, 'xs', {
          italic: true,
          after: 6,
        }),
      );
    }

    const notas = [
      rsvpLine(v),
      str(v.traje) ? `Traje: ${str(v.traje)}` : '',
      Number(v.pessoas) > 0 ? `Convite válido para ${Number(v.pessoas)} ${Number(v.pessoas) === 1 ? 'pessoa' : 'pessoas'} · pessoal e intransmissível` : '',
      str(v.listaPresentes) ? `Lista de presentes: ${str(v.listaPresentes)}` : '',
      v.semCriancas ? 'Esta celebração é reservada a adultos.' : '',
    ];
    if (notas.some(Boolean)) {
      out.push({ type: 'ornament', style: 'dots' });
      out.push(...footer(notas));
    }
    return cardScale(out);
  },
  warnings: (v, ctx) => {
    const out: Warning[] = [];
    if (str(v.rsvpData) && str(v.dataEvento) && diasEntre(v.rsvpData, v.dataEvento) <= 0)
      out.push({ level: 'error', field: 'rsvpData', message: l('A data de confirmação tem de ser anterior ao casamento.', 'The RSVP date must be before the wedding.') });
    if (str(v.dataEvento) && diasEntre(ctx.today, v.dataEvento) < 0)
      out.push({ level: 'warning', field: 'dataEvento', message: l('A data do casamento já passou.', 'The wedding date is in the past.') });
    if (!rsvpLine(v))
      out.push({ level: 'info', field: 'rsvpTelefone', message: l('Sem pedido de confirmação é difícil prever o número de convidados.', 'Without an RSVP it is hard to plan numbers.') });
    if (v.tipoCerimonia !== 'civil')
      out.push({
        level: 'info',
        message: l(
          `O casamento religioso só produz efeitos civis depois de transcrito no registo civil (${cite('casamentoTranscricao')}).`,
          'A religious wedding has civil effects only once registered with the civil registry.',
        ),
      });
    return out;
  },
  personName: (v) => [str(v.noiva), str(v.noivo)].filter(Boolean).join(' e ') || undefined,
  documentDate: (v) => str(v.dataEvento) || undefined,
});
