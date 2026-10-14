import { defineTemplate, type Block, type Warning } from '../model';
import { cite, l } from './_shared';
import { TRAJE_OPTIONS, TRATAMENTO_OPTIONS, diasEntre, disp, footer, linhaData, str, cardScale } from './_eventos';

// Invitation to a lobolo, traditional wedding or family introduction, A6
// (four per A4). In the south the lobolo is held at the bride's family home;
// the neutral title also serves other regions' ceremonies.

const TIPOS: Record<string, string> = {
  lobolo: 'Cerimónia de Lobolo',
  tradicional: 'Casamento Tradicional',
  apresentacao: 'Apresentação das Famílias',
};

export default defineTemplate({
  id: 'convite-cerimonia-tradicional',
  family: 'declaracao',
  page: 'A6',
  frame: 'simple',
  verticalAlign: 'center',
  noBrand: true,
  letterhead: false,
  style: { font: 'classico' },
  sections: [
    { id: 'cerimonia', title: l('Cerimónia', 'Ceremony') },
    { id: 'noivos', title: l('Noivos e famílias', 'Couple and families') },
    { id: 'local', title: l('Data e local', 'Date and place') },
    { id: 'notas', title: l('Notas', 'Notes') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'select',
      section: 'cerimonia',
      label: l('Cerimónia', 'Ceremony'),
      options: [
        { value: 'lobolo', label: l('Cerimónia de lobolo', 'Lobolo ceremony') },
        { value: 'tradicional', label: l('Casamento tradicional', 'Traditional wedding') },
        { value: 'apresentacao', label: l('Apresentação das famílias', 'Family introduction') },
        { value: 'outra', label: l('Outra (escrever)', 'Other (type it)') },
      ],
      default: 'lobolo',
    },
    { name: 'tipoOutro', type: 'text', section: 'cerimonia', label: l('Nome da cerimónia', 'Ceremony name'), showIf: (v) => v.tipo === 'outra' },
    {
      name: 'quemConvida',
      type: 'radio',
      section: 'cerimonia',
      label: l('Quem convida', 'Who invites'),
      options: [
        { value: 'noiva', label: l('A família da noiva', "The bride's family") },
        { value: 'ambas', label: l('As duas famílias', 'Both families') },
      ],
      default: 'noiva',
    },
    { name: 'tratamento', type: 'select', section: 'cerimonia', label: l('Convidado', 'Guest'), options: TRATAMENTO_OPTIONS, default: 'V. Ex.ª e Família' },
    { name: 'familiaNoiva', type: 'text', section: 'noivos', width: 'half', required: true, label: l('Família da noiva (apelido)', "Bride's family (surname)"), placeholder: l('Mondlane', 'Mondlane') },
    { name: 'familiaNoivo', type: 'text', section: 'noivos', width: 'half', label: l('Família do noivo (apelido)', "Groom's family (surname)"), placeholder: l('Cossa', 'Cossa') },
    { name: 'noiva', type: 'text', section: 'noivos', width: 'half', required: true, label: l('Noiva', 'Bride') },
    { name: 'noivo', type: 'text', section: 'noivos', width: 'half', required: true, label: l('Noivo', 'Groom') },
    {
      name: 'maiores',
      type: 'toggle',
      section: 'noivos',
      required: true,
      label: l('Confirmo que os noivos são maiores de idade', 'I confirm both are adults'),
      help: l('A lei proíbe uniões com menores de idade. Esta confirmação não é impressa.', 'The law forbids unions with minors. Not printed.'),
      default: false,
    },
    { name: 'dataEvento', type: 'date', section: 'local', width: 'half', required: true, label: l('Data', 'Date') },
    { name: 'horaEvento', type: 'text', section: 'local', width: 'half', required: true, label: l('Hora', 'Time'), placeholder: l('10h00', '10h00') },
    {
      name: 'localTipo',
      type: 'radio',
      section: 'local',
      label: l('Onde', 'Where'),
      options: [
        { value: 'residencia', label: l('Na residência da família', 'At the family home') },
        { value: 'outro', label: l('Noutro local', 'Elsewhere') },
      ],
      default: 'residencia',
    },
    { name: 'localNome', type: 'text', section: 'local', label: l('Nome do local', 'Venue name'), showIf: (v) => v.localTipo === 'outro' },
    { name: 'bairro', type: 'text', section: 'local', width: 'third', label: l('Bairro', 'Neighbourhood') },
    { name: 'quarteirao', type: 'text', section: 'local', width: 'third', label: l('Quarteirão n.º', 'Block no.') },
    { name: 'casa', type: 'text', section: 'local', width: 'third', label: l('Casa n.º', 'House no.') },
    { name: 'cidade', type: 'text', section: 'local', width: 'half', required: true, label: l('Cidade ou distrito', 'City or district'), default: (c) => c.profile?.morada?.cidade ?? '' },
    { name: 'referencia', type: 'text', section: 'local', width: 'half', label: l('Ponto de referência', 'Landmark'), placeholder: l('perto da Escola Primária de Laulane', 'near the primary school') },
    {
      name: 'fraseFinal',
      type: 'select',
      section: 'notas',
      label: l('Frase final', 'Closing line'),
      options: [
        { value: 'A vossa presença honrará as nossas famílias.', label: l('A vossa presença honrará as nossas famílias.', 'Your presence will honour our families.') },
        { value: 'Contamos com a vossa presença neste momento de união das nossas famílias.', label: l('Contamos com a vossa presença…', 'We count on your presence…') },
        { value: '', label: l('Nenhuma', 'None') },
      ],
      default: 'A vossa presença honrará as nossas famílias.',
    },
    { name: 'festa', type: 'toggle', section: 'notas', label: l('Seguir-se-á almoço ou festa', 'Followed by lunch or party'), default: true },
    { name: 'traje', type: 'select', section: 'notas', width: 'half', label: l('Traje', 'Dress code'), options: TRAJE_OPTIONS, default: 'Tradicional (capulana)' },
    { name: 'rsvpNome', type: 'text', section: 'notas', width: 'half', label: l('Contacto (nome)', 'Contact (name)') },
    { name: 'rsvpTelefone', type: 'tel', section: 'notas', width: 'half', label: l('Telefone', 'Phone') },
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const cerimonia = v.tipo === 'outra' ? str(v.tipoOutro) || 'Cerimónia Tradicional' : TIPOS[str(v.tipo)] ?? TIPOS.lobolo;
    const fN = str(v.familiaNoiva) || '__________';
    const fM = str(v.familiaNoivo);
    const trat = str(v.tratamento) || 'V. Ex.ª';
    const ambas = v.quemConvida === 'ambas' && fM;
    const lugar =
      v.localTipo === 'outro'
        ? [str(v.localNome), str(v.cidade)].filter(Boolean).join(', ')
        : [
            'Na residência da família',
            [str(v.bairro) && `Bairro ${str(v.bairro)}`, str(v.quarteirao) && `Quarteirão n.º ${str(v.quarteirao)}`, str(v.casa) && `Casa n.º ${str(v.casa)}`].filter(Boolean).join(', '),
            str(v.cidade),
          ]
            .filter(Boolean)
            .join('\n');
    const out: Block[] = [
      disp(ambas ? `As Famílias ${fN} e ${fM}` : `A Família ${fN}`, 'md', { uppercase: true, tone: 'accent', fit: true, after: 3 }),
      disp(`${ambas ? 'têm' : 'tem'} a honra de convidar ${trat}\npara a`, 'sm', { italic: true, tone: 'muted', after: 3 }),
      disp(cerimonia, 'lg', { uppercase: true, fit: true, after: 2 }),
      { type: 'ornament', style: 'dots' },
      disp(ambas ? 'de seus filhos' : 'da sua filha', 'xs', { italic: true, tone: 'muted', after: 1 }),
      disp(str(v.noiva) || 'Nome da Noiva', 'xxl', { italic: true, tone: 'accent', fit: true, after: 0 }),
      disp('com', 'xs', { italic: true, tone: 'muted', after: 0 }),
      disp(str(v.noivo) || 'Nome do Noivo', 'xxl', { italic: true, tone: 'accent', fit: true, after: fM && !ambas ? 0 : 5 }),
    ];
    if (fM && !ambas) out.push(disp(`filho da Família ${fM}`, 'xs', { tone: 'muted', after: 5 }));
    out.push(disp(linhaData(v.dataEvento, v.horaEvento), 'sm', { uppercase: true, weight: 'bold', fit: true, after: 2 }));
    out.push(disp(lugar || '____________________', 'sm', { after: str(v.referencia) ? 0 : 4 }));
    if (str(v.referencia)) out.push(disp(`(${str(v.referencia)})`, 'xs', { tone: 'muted', after: 4 }));
    if (str(v.fraseFinal)) out.push(disp(str(v.fraseFinal), 'xs', { italic: true, after: 4 }));
    out.push(
      ...footer([
        v.festa ? 'Seguir-se-á almoço no local.' : '',
        str(v.traje) ? `Traje: ${str(v.traje)}` : '',
        [str(v.rsvpNome), str(v.rsvpTelefone)].some(Boolean) ? `Contacto: ${[str(v.rsvpNome), str(v.rsvpTelefone)].filter(Boolean).join(' · ')}` : '',
      ]),
    );
    return cardScale(out);
  },
  warnings: (v, ctx) => {
    const out: Warning[] = [];
    if (!v.maiores)
      out.push({
        level: 'error',
        field: 'maiores',
        message: l(
          `Confirme que os noivos têm pelo menos ${ctx.legal.value<{ anos: number }>('maioridade').anos} anos. A lei proíbe uniões com menores.`,
          'Confirm both are adults. The law forbids unions with minors.',
        ),
      });
    if (str(v.dataEvento) && diasEntre(ctx.today, v.dataEvento) < 0)
      out.push({ level: 'warning', field: 'dataEvento', message: l('A data já passou.', 'The date is in the past.') });
    if (v.localTipo !== 'outro' && !str(v.referencia))
      out.push({ level: 'info', field: 'referencia', message: l('Um ponto de referência ajuda os convidados a encontrar a casa.', 'A landmark helps guests find the house.') });
    out.push({
      level: 'info',
      message: l(
        `O casamento tradicional só produz efeitos civis depois de transcrito no registo civil (${cite('casamentoTranscricao')}).`,
        'A traditional marriage has civil effects only once registered with the civil registry.',
      ),
    });
    return out;
  },
  personName: (v) => [str(v.noiva), str(v.noivo)].filter(Boolean).join(' e ') || undefined,
  documentDate: (v) => str(v.dataEvento) || undefined,
});
