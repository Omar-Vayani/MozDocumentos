import { defineTemplate, type Block, type Warning } from '../model';
import { GENERO_OPTIONS, dateLong, g, l } from './_shared';
import { SIMBOLO_OPTIONS, diasEntre, disp, linhaData, plural, str, vidaDatas, cardScale, clip } from './_eventos';

// Memorial service notice, A6 (four per A4), black and grey: 7th-day or
// 30th-day mass, first anniversary, memorial service, other religious
// ceremony, or an "eterna saudade" notice without an event.

const TIPOS: Record<string, { titulo: string; acto: string }> = {
  setimo: { titulo: 'Missa de Sétimo Dia', acto: 'a missa de sétimo dia' },
  trigesimo: { titulo: 'Missa de Trigésimo Dia', acto: 'a missa de trigésimo dia' },
  aniversario: { titulo: 'Missa do 1.º Aniversário', acto: 'a missa do primeiro aniversário de falecimento' },
  culto: { titulo: 'Culto em Memória', acto: 'o culto' },
  cerimonia: { titulo: 'Cerimónia Religiosa', acto: 'a cerimónia religiosa' },
};

export default defineTemplate({
  id: 'convite-missa-sufragio',
  family: 'declaracao',
  page: 'A6',
  frame: 'simple',
  verticalAlign: 'center',
  noBrand: true,
  letterhead: false,
  style: { mono: true, font: 'classico' },
  sections: [
    { id: 'tipo', title: l('Tipo', 'Type') },
    { id: 'falecido', title: l('A pessoa falecida', 'The deceased') },
    { id: 'evento', title: l('Data e local', 'Date and place') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'select',
      section: 'tipo',
      label: l('Tipo', 'Type'),
      options: [
        { value: 'setimo', label: l('Missa de sétimo dia', '7th-day mass') },
        { value: 'trigesimo', label: l('Missa de trigésimo dia (um mês)', '30th-day mass') },
        { value: 'aniversario', label: l('Missa do 1.º aniversário', 'First-anniversary mass') },
        { value: 'culto', label: l('Culto em memória', 'Memorial service') },
        { value: 'cerimonia', label: l('Outra cerimónia religiosa', 'Other religious ceremony') },
        { value: 'saudade', label: l('Nota de saudade (sem cerimónia)', 'Remembrance notice (no event)') },
      ],
      default: 'setimo',
    },
    { name: 'simbolo', type: 'select', section: 'tipo', width: 'half', label: l('Símbolo', 'Symbol'), options: SIMBOLO_OPTIONS, default: 'cruz' },
    { name: 'quemConvida', type: 'text', section: 'tipo', width: 'half', label: l('Quem convida', 'From'), default: 'A família' },
    { name: 'falecidoNome', type: 'text', section: 'falecido', required: true, label: l('Nome', 'Name') },
    { name: 'falecidoGenero', type: 'radio', section: 'falecido', width: 'half', label: l('Género', 'Gender'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'dataNascimento', type: 'date', section: 'falecido', width: 'half', label: l('Nascimento (opcional)', 'Birth (optional)') },
    { name: 'dataFalecimento', type: 'date', section: 'falecido', width: 'half', required: true, label: l('Falecimento', 'Death') },
    { name: 'anos', type: 'number', section: 'falecido', width: 'half', min: 1, max: 60, label: l('Anos de saudade', 'Years since'), default: 1, showIf: (v) => v.tipo === 'saudade' },
    {
      name: 'mensagem',
      type: 'textarea',
      section: 'falecido',
      rows: 2,
      label: l('Mensagem', 'Message'),
      default: 'Partiste, mas continuas presente em cada um de nós.',
      showIf: (v) => v.tipo === 'saudade',
    },
    { name: 'dataEvento', type: 'date', section: 'evento', width: 'half', label: l('Data', 'Date'), showIf: (v) => v.tipo !== 'saudade' },
    { name: 'horaEvento', type: 'text', section: 'evento', width: 'half', label: l('Hora', 'Time'), showIf: (v) => v.tipo !== 'saudade' },
    { name: 'localEvento', type: 'text', section: 'evento', label: l('Igreja ou local', 'Church or venue'), placeholder: l('Igreja de São José de Lhanguene', 'Church'), showIf: (v) => v.tipo !== 'saudade' },
    { name: 'cerimoniaNome', type: 'text', section: 'evento', label: l('Nome da cerimónia', 'Ceremony name'), showIf: (v) => v.tipo === 'cerimonia' },
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const nome = str(v.falecidoNome) || '____________________';
    const datas = vidaDatas(v.dataNascimento, v.dataFalecimento);
    const out: Block[] = [];
    if (v.simbolo === 'cruz') out.push({ type: 'ornament', style: 'cross' });
    if (v.tipo === 'saudade') {
      const n = Math.max(1, Math.round(Number(v.anos) || 1));
      out.push(disp(`${n} ${n === 1 ? 'ano' : 'anos'} de eterna saudade`, 'sm', { uppercase: true, after: 6 }));
      out.push(disp(nome, 'lg', { weight: 'bold', fit: true, after: 1 }));
      if (datas) out.push(disp(datas, 'xs', { tone: 'muted', after: 1 }));
      out.push({ type: 'ornament', style: 'rule' });
      out.push(disp(clip(str(v.mensagem).replace(/\s*\n\s*/g, ' '), 240) || 'Partiste, mas continuas presente em cada um de nós.', 'sm', { italic: true, after: 6 }));
      out.push(disp(clip(str(v.quemConvida), 80) || 'A tua família', 'xs', { tone: 'muted', after: 0 }));
      return cardScale(out);
    }
    const t = TIPOS[str(v.tipo)] ?? TIPOS.setimo;
    const titulo = v.tipo === 'cerimonia' && str(v.cerimoniaNome) ? str(v.cerimoniaNome) : t.titulo;
    const acto = v.tipo === 'cerimonia' && str(v.cerimoniaNome) ? `a cerimónia de ${str(v.cerimoniaNome).toLowerCase()}` : t.acto;
    const quem = clip(str(v.quemConvida), 80) || 'A família';
    out.push(disp(titulo, 'sm', { uppercase: true, fit: true, after: 6 }));
    out.push(disp(nome, 'lg', { weight: 'bold', fit: true, after: 1 }));
    if (datas) out.push(disp(datas, 'xs', { tone: 'muted', after: 1 }));
    out.push({ type: 'ornament', style: 'rule' });
    out.push(
      disp(
        `${quem} ${plural(quem) ? 'convidam' : 'convida'} os familiares, amigos e conhecidos para ${acto} em memória de ${nome}, ${g(v.falecidoGenero, 'falecido', 'falecida')} no dia ${dateLong(v.dataFalecimento)}.`,
        'xs',
        { after: 5 },
      ),
    );
    out.push(disp(linhaData(v.dataEvento, v.horaEvento), 'xs', { uppercase: true, weight: 'bold', fit: true, after: 1 }));
    out.push(disp(str(v.localEvento) || '____________________', 'xs', { weight: 'bold', fit: true, after: 5 }));
    out.push(disp(`${quem} ${plural(quem) ? 'agradecem' : 'agradece'} a todos os que se dignarem participar neste acto de fé.`, 'xs', { italic: true, tone: 'muted', after: 0 }));
    return cardScale(out);
  },
  warnings: (v) => {
    const out: Warning[] = [];
    if (v.tipo === 'saudade') {
      if (str(v.mensagem).length > 240) out.push({ level: 'warning', field: 'mensagem', message: l('Mensagem longa: só cabem cerca de 240 caracteres no cartão.', 'Long message: about 240 characters fit.') });
      return out;
    }
    const d = diasEntre(v.dataFalecimento, v.dataEvento);
    if (!Number.isNaN(d) && d < 0) out.push({ level: 'error', field: 'dataEvento', message: l('A cerimónia não pode ser anterior ao falecimento.', 'The service cannot be before the death.') });
    if (v.tipo === 'setimo' && !Number.isNaN(d) && (d < 5 || d > 10))
      out.push({ level: 'info', field: 'dataEvento', message: l('A missa de sétimo dia costuma ser celebrada perto do sétimo dia após o falecimento.', 'The 7th-day mass is usually held around the seventh day after the death.') });
    if (!str(v.localEvento)) out.push({ level: 'warning', field: 'localEvento', message: l('Indique a igreja ou o local.', 'Give the church or venue.') });
    return out;
  },
  personName: (v) => str(v.falecidoNome) || undefined,
  documentDate: (v) => str(v.dataEvento) || str(v.dataFalecimento) || undefined,
});
