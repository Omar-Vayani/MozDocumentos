import { defineTemplate, type Block, type Warning } from '../model';
import { l, lineItems } from './_shared';
import { dataComDia, disp, hora, str, cardScale } from './_eventos';

// Ceremony programme, A5 (two per A4): wedding, funeral (exéquias),
// graduation, opening ceremony or religious service. Each item is a centred
// line "10h00 · Missa de corpo presente" with the person responsible below.
// Funerals use black text only and the cross instead of coloured rules.

const TIPOS: Record<string, { titulo: string; frase: string }> = {
  casamento: { titulo: 'Programa do Casamento', frase: 'Obrigado por celebrarem connosco.' },
  exequias: { titulo: 'Programa das Exéquias', frase: 'Paz à sua alma.' },
  graduacao: { titulo: 'Programa da Cerimónia de Graduação', frase: 'Obrigado pela vossa presença.' },
  institucional: { titulo: 'Programa', frase: 'Obrigado pela vossa presença.' },
  culto: { titulo: 'Programa do Culto', frase: '' },
  outro: { titulo: 'Programa', frase: '' },
};

const EXEMPLOS: Record<string, { hora: string; actividade: string; responsavel: string }[]> = {
  casamento: [
    { hora: '10h30', actividade: 'Chegada dos convidados', responsavel: '' },
    { hora: '11h00', actividade: 'Entrada do noivo', responsavel: '' },
    { hora: '11h10', actividade: 'Entrada da noiva', responsavel: '' },
    { hora: '11h15', actividade: 'Celebração do matrimónio', responsavel: '' },
    { hora: '13h00', actividade: 'Copo-d’água', responsavel: '' },
    { hora: '15h00', actividade: 'Corte do bolo', responsavel: '' },
  ],
};

export default defineTemplate({
  id: 'programa-de-cerimonia',
  family: 'declaracao',
  page: 'A5',
  verticalAlign: 'center',
  noBrand: true,
  letterhead: false,
  style: (v) => ({ font: 'classico', mono: v.tipo === 'exequias' }),
  frame: 'simple',
  sections: [
    { id: 'cerimonia', title: l('Cerimónia', 'Ceremony') },
    { id: 'programa', title: l('Programa', 'Programme') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'select',
      section: 'cerimonia',
      label: l('Tipo', 'Type'),
      options: [
        { value: 'casamento', label: l('Casamento', 'Wedding') },
        { value: 'exequias', label: l('Exéquias (funeral)', 'Funeral') },
        { value: 'graduacao', label: l('Graduação', 'Graduation') },
        { value: 'institucional', label: l('Inauguração ou evento institucional', 'Opening or institutional event') },
        { value: 'culto', label: l('Culto ou missa', 'Religious service') },
        { value: 'outro', label: l('Outro', 'Other') },
      ],
      default: 'casamento',
    },
    { name: 'titulo', type: 'text', section: 'cerimonia', label: l('Título (opcional)', 'Heading (optional)'), help: l('Vazio: "Programa do Casamento", "Programa das Exéquias"…', 'Empty: a heading suited to the type.') },
    {
      name: 'subtitulo',
      type: 'text',
      section: 'cerimonia',
      required: true,
      label: l('Nomes ou evento', 'Names or event'),
      placeholder: l('Ana & Carlos / Fernando Muchanga (1948 – 2026)', 'Names or event'),
    },
    { name: 'dataEvento', type: 'date', section: 'cerimonia', width: 'half', label: l('Data', 'Date') },
    { name: 'localEvento', type: 'text', section: 'cerimonia', width: 'half', label: l('Local', 'Venue') },
    { name: 'mestreCerimonias', type: 'text', section: 'cerimonia', label: l('Mestre de cerimónias (opcional)', 'Master of ceremonies (optional)') },
    {
      name: 'programa',
      type: 'lines',
      section: 'programa',
      required: true,
      label: l('Momentos', 'Items'),
      addLabel: l('Adicionar momento', 'Add item'),
      columns: [
        { name: 'hora', type: 'text', label: l('Hora', 'Time'), width: 'third' },
        { name: 'actividade', type: 'text', label: l('Momento', 'Item') },
        { name: 'responsavel', type: 'text', label: l('Responsável (opcional)', 'Who (optional)') },
      ],
      default: EXEMPLOS.casamento,
    },
    { name: 'mensagemFinal', type: 'text', section: 'programa', label: l('Frase final (opcional)', 'Closing line (optional)'), help: l('Vazio: uma frase adequada ao tipo.', 'Empty: a line suited to the type.') },
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const t = TIPOS[str(v.tipo)] ?? TIPOS.outro;
    const luto = v.tipo === 'exequias';
    const tone = luto ? 'text' : 'accent';
    const rows = lineItems(v.programa).filter((r) => str(r.actividade) || str(r.hora));
    const out: Block[] = [];
    if (luto) out.push({ type: 'ornament', style: 'cross' });
    out.push(disp(str(v.titulo) || t.titulo, 'sm', { uppercase: true, tone: 'muted', fit: true, after: 3 }));
    out.push(disp(str(v.subtitulo) || '____________________', luto ? 'lg' : 'xl', { italic: !luto, weight: luto ? 'bold' : 'normal', tone, fit: true, after: 3 }));
    const quando = [str(v.dataEvento) ? dataComDia(v.dataEvento) : '', str(v.localEvento)].filter(Boolean).join(' · ');
    if (quando) out.push(disp(quando, 'xs', { fit: true, after: 2 }));
    out.push(luto ? { type: 'spacer', size: 'small' } : { type: 'ornament', style: 'rule' });
    for (const [i, r] of rows.slice(0, 22).entries()) {
      const line = [str(r.hora) ? hora(r.hora) : '', str(r.actividade)].filter(Boolean).join('  ·  ');
      out.push(disp(line, 'sm', { fit: line.length > 48, after: str(r.responsavel) ? 0 : i === rows.length - 1 ? 6 : 4 }));
      if (str(r.responsavel)) out.push(disp(str(r.responsavel), 'xs', { italic: true, tone: 'muted', after: 4 }));
    }
    if (!rows.length) out.push(disp('____________________', 'sm', { after: 6 }));
    if (str(v.mestreCerimonias)) out.push(disp(`Mestre de cerimónias: ${str(v.mestreCerimonias)}`, 'xs', { tone: 'muted', after: 4 }));
    const frase = str(v.mensagemFinal) || t.frase;
    if (frase) {
      out.push(luto ? { type: 'spacer', size: 'small' } : { type: 'ornament', style: 'dots' });
      out.push(disp(frase, 'xs', { italic: true, after: 0 }));
    }
    return cardScale(out);
  },
  warnings: (v) => {
    const out: Warning[] = [];
    const rows = lineItems(v.programa).filter((r) => str(r.actividade));
    if (rows.length > 18) out.push({ level: 'warning', field: 'programa', message: l('O programa pode não caber numa página A5: resuma os momentos.', 'The programme may not fit one A5 page: shorten it.') });
    const horas = rows.map((r) => hora(r.hora)).filter((h) => /^\d{2}h\d{2}$/.test(h));
    if (horas.some((h, i) => i > 0 && h < horas[i - 1])) out.push({ level: 'info', field: 'programa', message: l('Os momentos não estão por ordem de hora.', 'Items are not in time order.') });
    if (!rows.length) out.push({ level: 'warning', field: 'programa', message: l('Acrescente pelo menos um momento.', 'Add at least one item.') });
    return out;
  },
  personName: (v) => str(v.subtitulo) || undefined,
  documentDate: (v) => str(v.dataEvento) || undefined,
});
