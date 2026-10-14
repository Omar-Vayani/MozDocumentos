// Requisição interna (pedido de aquisição): a unit of a public body asks the
// procurement unit (UGEA) to buy goods or services, with the justification,
// the estimated cost and the budget line, for budget confirmation and approval.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, formatMoney, l, lineItems, money } from './_shared';
import { estadoRef, numeroField } from './_estado';
import { entidadeProfileWarning, mt, qtd, semPonto, str, TIPO_CONTRATACAO_OPTIONS } from './_contratacao';
import { roundMoney } from '@/lib/format';

export default defineTemplate({
  id: 'requisicao-interna',
  family: 'mapa',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Número e data', 'Number and date') },
    { id: 'requisitante', title: l('Sector requisitante', 'Requesting unit') },
    { id: 'itens', title: l('Bens ou serviços', 'Goods or services') },
    { id: 'orcamento', title: l('Orçamento', 'Budget') },
  ],
  fields: [
    numeroField(),
    dateField('data'),
    {
      name: 'urgencia',
      type: 'select',
      section: 'documento',
      width: 'half',
      label: l('Prioridade', 'Priority'),
      options: [
        { value: '', label: l('Normal', 'Normal') },
        { value: 'URGENTE', label: l('Urgente', 'Urgent') },
      ],
      default: '',
    },
    { name: 'sector', type: 'text', section: 'requisitante', required: true, label: l('Sector requisitante', 'Requesting unit'), placeholder: l('Ex.: Departamento de Saúde Pública', 'E.g. Public Health Department') },
    { name: 'requisitanteNome', type: 'text', section: 'requisitante', width: 'half', label: l('Requisitante (nome)', 'Requested by (name)') },
    { name: 'requisitanteCargo', type: 'text', section: 'requisitante', width: 'half', label: l('Cargo do requisitante', 'Position') },
    { name: 'chefeCargo', type: 'text', section: 'requisitante', width: 'half', label: l('Visto do chefe do sector (cargo)', 'Head of unit (position)'), placeholder: l('Ex.: Chefe do Departamento', 'E.g. Head of Department') },
    { name: 'tipo', type: 'select', section: 'requisitante', width: 'half', label: l('Tipo', 'Type'), options: TIPO_CONTRATACAO_OPTIONS, default: 'bens' },
    { name: 'finalidade', type: 'textarea', section: 'requisitante', rows: 3, required: true, label: l('Justificação da necessidade', 'Justification'), placeholder: l('Ex.: reposição do stock de material de escritório para o segundo semestre, esgotado em Setembro', 'E.g. restocking office supplies for the second half-year') },
    { name: 'prazoNecessidade', type: 'date', section: 'requisitante', width: 'half', label: l('Necessário até', 'Needed by') },
    { name: 'localEntrega', type: 'text', section: 'requisitante', width: 'half', label: l('Local de entrega', 'Delivery place') },
    {
      name: 'itens',
      type: 'lines',
      section: 'itens',
      label: l('Itens', 'Items'),
      addLabel: l('Adicionar item', 'Add item'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'especificacao', type: 'text', label: l('Especificação (opcional)', 'Specification (optional)') },
        { name: 'unidade', type: 'text', label: l('Unidade', 'Unit') },
        { name: 'quantidade', type: 'number', label: l('Quantidade', 'Quantity') },
        { name: 'preco', type: 'money', label: l('Custo unitário estimado', 'Estimated unit cost') },
      ],
      default: [],
    },
    { name: 'rubrica', type: 'text', section: 'orcamento', width: 'half', label: l('Rubrica orçamental', 'Budget line'), placeholder: l('Ex.: 121000 — Bens', 'E.g. 121000 — Goods') },
    { name: 'fonte', type: 'text', section: 'orcamento', width: 'half', label: l('Fonte de recursos', 'Source of funds'), placeholder: l('Ex.: Orçamento do Estado / Fundo comum', 'E.g. State Budget') },
  ],

  computed: (v) => {
    const its = lineItems(v.itens)
      .filter((r) => str(r.descricao))
      .map((r) => {
        const q = r.quantidade === '' || r.quantidade == null ? null : Number(r.quantidade);
        const p = money(r.preco);
        return { descricao: str(r.descricao), especificacao: str(r.especificacao), unidade: str(r.unidade), quantidade: q != null && Number.isFinite(q) ? q : null, preco: p, total: q != null && p != null ? roundMoney(q * p) : null };
      });
    const total = its.some((i) => i.total != null) ? roundMoney(its.reduce((s, i) => s + (i.total ?? 0), 0)) : null;
    return { its, total };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [...entidadeProfileWarning(ctx)];
    if (!ctx.computed.its.length) w.push({ level: 'warning', field: 'itens', message: l('Acrescente os itens a adquirir.', 'Add the items to procure.') });
    if (!str(v.rubrica)) w.push({ level: 'info', field: 'rubrica', message: l(`A UGEA só inicia a contratação depois de confirmado o cabimento orçamental (${cite('ctCabimento')}).`, 'Procurement starts only after budget availability is confirmed.') });
    w.push({ level: 'info', message: l('Não fraccione a despesa: necessidades do mesmo tipo devem ser agrupadas para escolher a modalidade de contratação correcta.', 'Do not split the purchase: group similar needs so the right procurement method is used.') });
    return w;
  },

  personName: (v) => v.sector,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const blocks: Block[] = [];
    if (str(v.urgencia)) blocks.push({ type: 'tags', items: [str(v.urgencia)] });
    blocks.push(
      { type: 'reference', ref: estadoRef(ctx, 'Requisição'), date: dateLong(v.data) },
      { type: 'title', text: 'Requisição interna', subtitle: `Pedido de aquisição de ${str(v.tipo) === 'servicos' || str(v.tipo) === 'consultoria' ? 'serviços' : str(v.tipo) === 'obras' ? 'obras' : 'bens'}` },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Sector requisitante', value: str(v.sector) || '—' },
          { label: 'Necessário até', value: v.prazoNecessidade ? dateLong(v.prazoNecessidade) : '—' },
          { label: 'Local de entrega', value: semPonto(v.localEntrega) || '—' },
          { label: 'Destinatário', value: 'Unidade Gestora Executora das Aquisições' },
        ],
      },
      { type: 'paragraph', id: 'justificacao', text: `**Justificação:** ${semPonto(v.finalidade) || '____________________'}.`, en: 'Justification of the need.' },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.4, align: 'right' },
          { label: 'Descrição e especificação', width: 3.4 },
          { label: 'Un.', width: 0.6, align: 'center' },
          { label: 'Qtd.', width: 0.7, align: 'right' },
          { label: 'Custo unit. est.', width: 1.2, align: 'right' },
          { label: 'Total est.', width: 1.3, align: 'right' },
        ],
        rows: (c.its.length ? c.its : [{}, {}, {}, {}]).map((i: Record<string, any>, n: number) => [String(n + 1), i.descricao ? `${i.descricao}${i.especificacao ? ` — ${i.especificacao}` : ''}` : '', i.unidade ?? '', qtd(i.quantidade ?? null), mt(i.preco ?? null), mt(i.total ?? null)]),
        totals: [['', 'Total estimado, em MT', '', '', '', c.total != null ? formatMoney(c.total, false) : '']],
        grid: !c.its.length,
      },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Rubrica orçamental', value: semPonto(v.rubrica) || '—' },
          { label: 'Fonte de recursos', value: semPonto(v.fonte) || '—' },
        ],
      },
      {
        type: 'signatures',
        columns: [
          { role: 'O Requisitante', name: str(v.requisitanteNome) || undefined, detail: str(v.requisitanteCargo) || undefined },
          { role: `Visto — ${str(v.chefeCargo) || 'O Chefe do Sector'}`, name: undefined },
        ],
      },
      { type: 'box', label: 'Cabimento orçamental (Finanças)', text: 'Há cabimento na rubrica indicada: ☐ Sim  ☐ Não\nSaldo disponível: ______________ MT', lines: 2, width: 'half' },
      { type: 'box', label: 'Autorização', text: '☐ Autorizo  ☐ Não autorizo\nModalidade: ______________________', lines: 2, width: 'half' },
    );
    return blocks;
  },
});
