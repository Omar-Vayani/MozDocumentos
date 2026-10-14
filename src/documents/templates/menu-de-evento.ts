import { defineTemplate, type Block, type Warning } from '../model';
import { l, lineItems } from './_shared';
import { dataComDia, disp, str } from './_eventos';

// Event menu, A5 (two per A4): wedding, gala or dinner. Same typography as
// the wedding invitation so the set matches.

export default defineTemplate({
  id: 'menu-de-evento',
  family: 'declaracao',
  page: 'A5',
  frame: 'double',
  verticalAlign: 'center',
  noBrand: true,
  letterhead: false,
  style: { font: 'classico' },
  sections: [
    { id: 'evento', title: l('Evento', 'Event') },
    { id: 'menu', title: l('Menu', 'Menu') },
  ],
  fields: [
    { name: 'evento', type: 'text', section: 'evento', label: l('Evento', 'Event'), placeholder: l('Casamento de Ana & Carlos', 'Ana & Carlos’s wedding') },
    { name: 'titulo', type: 'text', section: 'evento', width: 'half', label: l('Título', 'Heading'), default: 'Menu' },
    { name: 'dataEvento', type: 'date', section: 'evento', width: 'half', label: l('Data', 'Date') },
    { name: 'localEvento', type: 'text', section: 'evento', label: l('Local', 'Venue') },
    {
      name: 'pratos',
      type: 'lines',
      section: 'menu',
      required: true,
      label: l('Pratos', 'Dishes'),
      addLabel: l('Adicionar prato', 'Add dish'),
      help: l('Repita a secção (Entradas, Prato principal, Sobremesa, Bebidas) em cada prato: os pratos são agrupados por secção.', 'Repeat the section on each dish; dishes are grouped by section.'),
      columns: [
        { name: 'seccao', type: 'text', label: l('Secção', 'Course'), width: 'third' },
        { name: 'prato', type: 'text', label: l('Prato', 'Dish') },
        { name: 'descricao', type: 'text', label: l('Descrição (opcional)', 'Description (optional)') },
      ],
      default: [
        { seccao: 'Entradas', prato: 'Rissóis de camarão e chamussas', descricao: '' },
        { seccao: 'Prato principal', prato: 'Caril de camarão', descricao: 'com arroz de coco' },
        { seccao: 'Prato principal', prato: 'Frango à zambeziana', descricao: 'com xima e matapa' },
        { seccao: 'Sobremesa', prato: 'Bolo dos noivos', descricao: 'com salada de frutas tropicais' },
      ],
    },
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const out: Block[] = [];
    if (str(v.evento)) out.push(disp(str(v.evento), 'xs', { uppercase: true, tone: 'muted', fit: true, after: 2 }));
    out.push(disp(str(v.titulo) || 'Menu', 'xxl', { italic: true, tone: 'accent', fit: true, after: 0 }));
    out.push({ type: 'ornament', style: 'rule' });
    const grupos: { seccao: string; itens: Record<string, unknown>[] }[] = [];
    for (const r of lineItems(v.pratos).filter((x) => str(x.prato))) {
      const s = str(r.seccao);
      const last = grupos[grupos.length - 1];
      if (last && last.seccao === s) last.itens.push(r);
      else grupos.push({ seccao: s, itens: [r] });
    }
    for (const gr of grupos.slice(0, 8)) {
      if (gr.seccao) out.push(disp(gr.seccao, 'xs', { uppercase: true, tone: 'accent', after: 2 }));
      for (const it of gr.itens.slice(0, 6)) {
        out.push(disp(str(it.prato), 'sm', { fit: str(it.prato).length > 40, after: str(it.descricao) ? 0 : 2 }));
        if (str(it.descricao)) out.push(disp(str(it.descricao), 'xs', { italic: true, tone: 'muted', after: 2 }));
      }
      out.push({ type: 'spacer', size: 'small' });
    }
    if (!grupos.length) out.push(disp('____________________', 'sm'));
    const rodape = [str(v.dataEvento) ? dataComDia(v.dataEvento) : '', str(v.localEvento)].filter(Boolean).join(' · ');
    if (rodape) {
      out.push({ type: 'ornament', style: 'dots' });
      out.push(disp(rodape, 'xs', { tone: 'muted', fit: true, after: 0 }));
    }
    return out;
  },
  warnings: (v) => {
    const out: Warning[] = [];
    const n = lineItems(v.pratos).filter((x) => str(x.prato)).length;
    if (!n) out.push({ level: 'warning', field: 'pratos', message: l('Acrescente os pratos.', 'Add the dishes.') });
    if (n > 14) out.push({ level: 'warning', field: 'pratos', message: l('Muitos pratos para uma página A5: resuma.', 'Too many dishes for one A5 page.') });
    return out;
  },
  personName: (v) => str(v.evento) || undefined,
  documentDate: (v) => str(v.dataEvento) || undefined,
});
