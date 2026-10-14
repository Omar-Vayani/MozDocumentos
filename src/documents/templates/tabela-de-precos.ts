// Tabela de preços: price list to display or send to customers, grouped by
// section, with the date it takes effect. Not a fiscal document.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateLong, l, money } from './_shared';
import { fm, issuerBlock, rows, semPonto, str } from './_comercio';

export default defineTemplate({
  id: 'tabela-de-precos',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Tabela', 'Price list') },
    { id: 'precos', title: l('Produtos e serviços', 'Products and services') },
    { id: 'notas', title: l('Notas', 'Notes') },
  ],
  fields: [
    { name: 'titulo', type: 'text', section: 'documento', width: 'half', label: l('Título', 'Title'), default: 'Tabela de preços', placeholder: l('Ex.: Tabela de preços, Preçário, Menu', 'E.g. Price list, Menu') },
    { name: 'dataVigor', type: 'date', section: 'documento', width: 'half', required: true, label: l('Em vigor a partir de', 'Effective from'), default: (c) => c.today },
    {
      name: 'itens',
      type: 'lines',
      section: 'precos',
      required: true,
      label: l('Preços', 'Prices'),
      help: l('Use a coluna "Secção" para agrupar (ex.: Electrodomésticos, Serviços). Linhas com a mesma secção ficam juntas.', 'Use the "Section" column to group (e.g. Appliances, Services).'),
      addLabel: l('Adicionar linha', 'Add line'),
      columns: [
        { name: 'seccao', type: 'text', label: l('Secção', 'Section') },
        { name: 'codigo', type: 'text', label: l('Código (opcional)', 'Code (optional)') },
        { name: 'descricao', type: 'text', label: l('Produto ou serviço', 'Product or service') },
        { name: 'unidade', type: 'text', label: l('Unidade', 'Unit'), placeholder: l('Ex.: un., kg, hora, sessão', 'E.g. pcs, kg, hour, session') },
        { name: 'preco', type: 'money', label: l('Preço (MT)', 'Price (MT)') },
      ],
      default: [{ seccao: '', codigo: '', descricao: '', unidade: '', preco: '' }],
    },
    {
      name: 'ivaTexto',
      type: 'select',
      section: 'notas',
      width: 'half',
      label: l('IVA', 'VAT'),
      options: [
        { value: 'incluido', label: l('Preços com IVA incluído', 'VAT included') },
        { value: 'acrescido', label: l('Aos preços acresce IVA', 'VAT added') },
        { value: 'naoAplica', label: l('Sem IVA (isento ou não sujeito)', 'No VAT') },
      ],
      default: 'incluido',
    },
    { name: 'alteracao', type: 'toggle', section: 'notas', default: true, label: l('Indicar "Preços sujeitos a alteração"', 'State "Prices subject to change"') },
    { name: 'notaExtra', type: 'textarea', section: 'notas', rows: 2, label: l('Nota adicional (opcional)', 'Additional note (optional)'), placeholder: l('Ex.: Entregas em Maputo e Matola: 500,00 MT', 'E.g. Delivery in Maputo and Matola: 500.00 MT') },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    const r = rows(v.itens).filter((x) => str(x.descricao));
    if (!r.length) w.push({ level: 'warning', field: 'itens', message: l('Acrescente os produtos ou serviços.', 'Add the products or services.') });
    if (r.some((x) => money(x.preco) == null)) w.push({ level: 'info', field: 'itens', message: l('Há linhas sem preço.', 'Some lines have no price.') });
    if (v.ivaTexto === 'acrescido') w.push({ level: 'info', field: 'ivaTexto', message: l('Para vendas a consumidores, indique o preço final com IVA incluído.', 'For consumer sales, show the final price including VAT.') });
    return w;
  },

  personName: (v) => v.titulo,
  documentDate: (v) => v.dataVigor,

  blocks: (ctx) => {
    const v = ctx.values;
    const linhas = rows(v.itens).filter((x) => str(x.descricao) || money(x.preco) != null);
    // Group by section, keeping the order in which sections first appear.
    const ordem: string[] = [];
    const grupos = new Map<string, typeof linhas>();
    for (const x of linhas) {
      const s = str(x.seccao);
      if (!grupos.has(s)) (grupos.set(s, []), ordem.push(s));
      grupos.get(s)!.push(x);
    }
    const temCodigo = linhas.some((x) => str(x.codigo));
    const tRows: string[][] = [];
    for (const s of ordem) {
      if (s) tRows.push([`§ ${s}`, '', '', ...(temCodigo ? [''] : [])]);
      for (const x of grupos.get(s)!) {
        const p = money(x.preco);
        tRows.push([...(temCodigo ? [str(x.codigo)] : []), str(x.descricao) || '—', str(x.unidade), p != null ? fm(p) : 'sob consulta']);
      }
    }
    if (!tRows.length) tRows.push([...(temCodigo ? [''] : []), BLANK, '', '']);

    const iva = v.ivaTexto === 'acrescido' ? 'Aos preços acresce IVA à taxa legal em vigor.' : v.ivaTexto === 'naoAplica' ? 'Preços sem IVA.' : 'Preços com IVA incluído.';
    const nota = [`Preços em meticais (MT). ${iva}`, v.alteracao ? 'Preços sujeitos a alteração.' : '', 'Esta tabela não é uma factura.'].filter(Boolean).join(' ');

    const blocks: Block[] = [
      { type: 'title', text: str(v.titulo) || 'Tabela de preços', subtitle: `Em vigor a partir de ${dateLong(v.dataVigor)}` },
      ...issuerBlock(ctx),
      {
        type: 'table',
        columns: [
          ...(temCodigo ? [{ label: 'Código', width: 1 }] : []),
          { label: 'Produto ou serviço', width: 5 },
          { label: 'Unidade', width: 1.2, align: 'center' as const },
          { label: 'Preço (MT)', width: 1.6, align: 'right' as const },
        ],
        rows: tRows,
      },
      { type: 'note', text: nota, en: 'Prices in meticais; VAT as stated. This price list is not an invoice.' },
    ];
    const extra = semPonto(v.notaExtra);
    if (extra) blocks.push({ type: 'paragraph', id: 'tp-nota', text: `${extra}.`, en: 'Additional note as written.', size: 'small' });
    return blocks;
  },
});
