import { resolveLegalValue } from '@/legal/mz-legal';
import { addDays, formatNumber, formatPercent, roundMoney } from '@/lib/format';
import { profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { BLANK, dateLong, employerRep, formatMoney, l, lineItems, localField, money, refField, splitLines, workerFields } from './_shared';

// ---------------------------------------------------------------- local helpers

const num = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string' || !v.trim()) return null;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const qtyText = (q: number) => formatNumber(q, Number.isInteger(q) ? 0 : 2);

type Linha = { descricao: string; quantidade: number; unidade: string; preco: number | null; total: number };

export default defineTemplate({
  id: 'orcamento',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Orçamento', 'Quote') },
    { id: 'cliente', title: l('Cliente', 'Customer'), personRole: 'cliente' },
    { id: 'proposta', title: l('Proposta comercial (opcional)', 'Commercial proposal (optional)') },
    { id: 'itens', title: l('Artigos e serviços', 'Items and services') },
    { id: 'valores', title: l('Desconto e IVA', 'Discount and VAT') },
    { id: 'condicoes', title: l('Condições', 'Terms') },
  ],
  fields: [
    { ...refField(), label: l('Número do orçamento', 'Quote number') },
    localField(),
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data do orçamento', 'Quote date'), default: (c) => c.today },
    {
      name: 'validadeDias',
      type: 'number',
      section: 'documento',
      width: 'half',
      min: 1,
      max: 365,
      label: l('Validade (dias)', 'Valid for (days)'),
      help: l('Prazo comercial à sua escolha. A data-limite é calculada automaticamente.', 'Commercial term of your choice. The expiry date is calculated automatically.'),
    },
    ...workerFields(['nome', 'nuit', 'morada', 'telefone'], 'cliente', 'cliente').map((f) =>
      f.name === 'clienteNome' ? { ...f, label: l('Nome ou firma do cliente', 'Customer name or company') } : f,
    ),
    { name: 'clienteEmail', type: 'email', section: 'cliente', width: 'half', label: l('Email', 'Email'), personKey: 'email' },
    { name: 'clienteAtencao', type: 'text', section: 'cliente', width: 'half', label: l('Ao cuidado de (opcional)', 'Attention of (optional)') },
    {
      name: 'proposta',
      type: 'toggle',
      section: 'proposta',
      label: l('Apresentar como proposta comercial', 'Present as a commercial proposal'),
      help: l('Acrescenta uma introdução, o âmbito dos trabalhos e a equipa, antes dos preços.', 'Adds an introduction, scope of work and team before the prices.'),
    },
    { name: 'propostaObjecto', type: 'text', section: 'proposta', label: l('Objecto da proposta', 'Subject of the proposal'), placeholder: l('Ex.: manutenção dos aparelhos de ar condicionado da sede', 'E.g. maintenance of the head office air conditioners'), showIf: (v) => Boolean(v.proposta) },
    { name: 'propostaPedido', type: 'text', section: 'proposta', width: 'half', label: l('Em resposta a (opcional)', 'In reply to (optional)'), placeholder: l('Ex.: V/ pedido de cotação de 2 de Outubro', 'E.g. your request of 2 October'), showIf: (v) => Boolean(v.proposta) },
    { name: 'propostaAmbito', type: 'textarea', section: 'proposta', rows: 4, label: l('Âmbito dos trabalhos', 'Scope of work'), help: l('Uma actividade por linha.', 'One activity per line.'), showIf: (v) => Boolean(v.proposta) },
    { name: 'propostaEquipa', type: 'textarea', section: 'proposta', rows: 2, label: l('Equipa e meios (opcional)', 'Team and resources (optional)'), showIf: (v) => Boolean(v.proposta) },
    {
      name: 'itens',
      type: 'lines',
      section: 'itens',
      required: true,
      label: l('Artigos e serviços', 'Items and services'),
      addLabel: l('Adicionar linha', 'Add line'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'quantidade', type: 'number', label: l('Quantidade', 'Quantity'), min: 0 },
        { name: 'unidade', type: 'text', label: l('Unidade', 'Unit'), placeholder: l('Ex.: un., m², h, dia', 'E.g. pcs, m², h, day') },
        { name: 'precoUnitario', type: 'money', label: l('Preço unitário', 'Unit price') },
      ],
      default: [],
    },
    {
      name: 'descontoTipo',
      type: 'select',
      section: 'valores',
      width: 'half',
      label: l('Desconto', 'Discount'),
      options: [
        { value: 'nenhum', label: l('Sem desconto', 'No discount') },
        { value: 'percentagem', label: l('Percentagem', 'Percentage') },
        { value: 'valor', label: l('Valor fixo', 'Fixed amount') },
      ],
      default: 'nenhum',
    },
    {
      name: 'descontoPercentagem',
      type: 'number',
      section: 'valores',
      width: 'half',
      min: 0,
      max: 100,
      label: l('Desconto (%)', 'Discount (%)'),
      showIf: (v) => v.descontoTipo === 'percentagem',
    },
    {
      name: 'descontoValor',
      type: 'money',
      section: 'valores',
      width: 'half',
      label: l('Valor do desconto', 'Discount amount'),
      showIf: (v) => v.descontoTipo === 'valor',
    },
    {
      name: 'iva',
      type: 'toggle',
      section: 'valores',
      label: l('Acrescentar IVA', 'Add VAT'),
      help: l('Só se a sua empresa estiver registada no regime normal do IVA.', 'Only if your business is registered under the standard VAT regime.'),
    },
    {
      name: 'ivaTaxa',
      type: 'number',
      section: 'valores',
      width: 'half',
      min: 0,
      max: 100,
      label: l('Taxa de IVA (%)', 'VAT rate (%)'),
      help: l('Por defeito, a taxa normal em vigor. Altere-a se o bem ou serviço tiver taxa reduzida.', 'Defaults to the current standard rate. Change it if a reduced rate applies.'),
      default: () => Math.round(Number(resolveLegalValue('ivaTaxaNormal')) * 10000) / 100,
      showIf: (v) => Boolean(v.iva),
    },
    {
      name: 'ivaNota',
      type: 'text',
      section: 'valores',
      label: l('Menção sobre IVA (opcional)', 'VAT statement (optional)'),
      help: l('Se não liquida IVA, pode indicar o motivo (por ex., o regime fiscal em que está enquadrado).', 'If you do not charge VAT, you may state why (e.g. your tax regime).'),
      showIf: (v) => !v.iva,
    },
    {
      name: 'condicoesPagamento',
      type: 'text',
      section: 'condicoes',
      label: l('Condições de pagamento', 'Payment terms'),
      placeholder: l('Ex.: metade na adjudicação e o restante na entrega', 'E.g. half on order, balance on delivery'),
    },
    {
      name: 'prazoEntrega',
      type: 'text',
      section: 'condicoes',
      label: l('Prazo de entrega ou execução', 'Delivery or completion time'),
      placeholder: l('Ex.: duas semanas após a adjudicação', 'E.g. two weeks after order'),
    },
    { name: 'observacoes', type: 'textarea', section: 'condicoes', rows: 3, label: l('Observações (opcional)', 'Notes (optional)') },
    {
      name: 'mostrarBanco',
      type: 'toggle',
      section: 'condicoes',
      default: true,
      label: l('Mostrar dados bancários do perfil', 'Show the profile’s bank details'),
    },
    {
      name: 'aceitacao',
      type: 'toggle',
      section: 'condicoes',
      default: true,
      label: l('Incluir espaço para aceitação do cliente', 'Include customer acceptance line'),
    },
  ],

  computed: (v) => {
    const linhas: Linha[] = lineItems(v.itens)
      .map((r) => {
        const quantidade = num(r.quantidade) ?? (String(r.descricao ?? '').trim() ? 1 : 0);
        const preco = money(r.precoUnitario);
        return {
          descricao: String(r.descricao ?? '').trim(),
          quantidade,
          unidade: String(r.unidade ?? '').trim(),
          preco,
          total: roundMoney(quantidade * (preco ?? 0)),
        };
      })
      .filter((r) => r.descricao || r.preco != null);
    const subtotal = roundMoney(linhas.reduce((t, r) => t + r.total, 0));
    const pct = v.descontoTipo === 'percentagem' ? num(v.descontoPercentagem) : null;
    const descontoPedido =
      v.descontoTipo === 'percentagem' && pct != null
        ? roundMoney((subtotal * pct) / 100)
        : v.descontoTipo === 'valor'
          ? roundMoney(money(v.descontoValor) ?? 0)
          : 0;
    // A discount larger than the subtotal is flagged in warnings and capped here.
    const desconto = Math.min(Math.max(0, descontoPedido), subtotal);
    const base = roundMoney(subtotal - desconto);
    const taxa = v.iva ? num(v.ivaTaxa) : null;
    const iva = v.iva && taxa != null ? roundMoney((base * taxa) / 100) : 0;
    const dias = Math.round(num(v.validadeDias) ?? 0);
    return {
      linhas,
      subtotal,
      descontoPct: pct,
      desconto,
      descontoExcede: descontoPedido > subtotal,
      base,
      taxa,
      iva,
      total: roundMoney(base + iva),
      validadeDias: dias > 0 ? dias : 0,
      validadeData: dias > 0 && v.data ? addDays(v.data, dias) : '',
    };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [];
    if (!v.clienteNome) w.push({ level: 'warning', field: 'clienteNome', message: l('Indique o cliente.', 'Enter the customer.') });
    if (!c.linhas.length) w.push({ level: 'warning', field: 'itens', message: l('Acrescente pelo menos um artigo ou serviço.', 'Add at least one item or service.') });
    if ((c.linhas as Linha[]).some((r) => r.preco == null)) {
      w.push({ level: 'warning', field: 'itens', message: l('Há linhas sem preço unitário.', 'Some lines have no unit price.') });
    }
    if (v.iva && c.taxa == null) {
      w.push({ level: 'error', field: 'ivaTaxa', message: l('Indique a taxa de IVA ou desligue a opção.', 'Enter the VAT rate or turn the option off.') });
    }
    if (c.descontoExcede) {
      w.push({ level: 'error', field: v.descontoTipo === 'valor' ? 'descontoValor' : 'descontoPercentagem', message: l('O desconto é superior ao subtotal.', 'The discount exceeds the subtotal.') });
    }
    if (!c.validadeDias) {
      w.push({ level: 'info', field: 'validadeDias', message: l('Indique por quantos dias o orçamento é válido.', 'State how many days the quote is valid.') });
    }
    if (ctx.profile?.kind === 'empresa' && !ctx.profile.nuit) {
      w.push({ level: 'info', message: l('Acrescente o NUIT da empresa no perfil.', 'Add the company NUIT to the profile.') });
    }
    return w;
  },

  personName: (v) => v.clienteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const p = ctx.profile;
    const linhas = c.linhas as Linha[];
    const fm = (n: number) => formatMoney(n, false);

    const blocks: Block[] = [
      { type: 'title', text: v.proposta ? 'Proposta comercial' : 'Orçamento', subtitle: `N.º ${v.ref || BLANK} · ${ctx.place}, ${dateLong(v.data)}` },
    ];

    // An individual has no letterhead: identify the issuer.
    if (p?.kind === 'pessoa') {
      blocks.push({
        type: 'keyValue',
        title: 'Emitente',
        columns: 2,
        items: [
          { label: 'Nome', value: p.nome || BLANK },
          { label: 'NUIT', value: p.nuit || '' },
          { label: 'Morada', value: addressLine(p) },
          { label: 'Contacto', value: [p.telefones, p.email].filter(Boolean).join(' · ') },
        ].filter((it) => it.value),
      });
    }

    blocks.push({
      type: 'keyValue',
      title: 'Cliente',
      columns: 2,
      items: [
        { label: 'Nome', value: v.clienteNome || BLANK },
        { label: 'NUIT', value: v.clienteNuit || '' },
        { label: 'Morada', value: v.clienteMorada || '' },
        { label: 'Telefone', value: v.clienteTelefone || '' },
        { label: 'Email', value: v.clienteEmail || '' },
        { label: 'Ao cuidado de', value: v.clienteAtencao || '' },
      ].filter((it) => it.value),
    });

    if (v.proposta) {
      const objecto = String(v.propostaObjecto || '').trim().replace(/[.;]+$/, '');
      const pedido = String(v.propostaPedido || '').trim().replace(/[.;]+$/, '');
      blocks.push({
        type: 'paragraph',
        id: 'proposta-intro',
        text: `${pedido ? `Em resposta ao ${pedido.replace(/^(ao|à|a)\s+/i, '')}, apresentamos` : 'Apresentamos'} a nossa proposta${objecto ? ` para ${objecto}` : ''}, nos termos e condições seguintes.`,
        en: 'We submit our proposal on the terms and conditions below.',
      });
      const ambito = splitLines(v.propostaAmbito);
      if (ambito.length) blocks.push({ type: 'heading', text: 'Âmbito dos trabalhos' }, { type: 'list', items: ambito });
      const equipa = splitLines(v.propostaEquipa);
      if (equipa.length) blocks.push({ type: 'heading', text: 'Equipa e meios' }, { type: 'list', items: equipa });
      blocks.push({ type: 'heading', text: 'Preço' });
    }

    const rows = linhas.length
      ? linhas.map((r, i) => [String(i + 1), r.descricao || '—', `${qtyText(r.quantidade)}${r.unidade ? ` ${r.unidade}` : ''}`, r.preco != null ? fm(r.preco) : '', fm(r.total)])
      : [['1', BLANK, '', '', '']];
    const totals: string[][] = [['', 'Subtotal', '', '', fm(c.subtotal)]];
    if (c.desconto) {
      totals.push(['', `Desconto${c.descontoPct != null ? ` (${formatPercent(c.descontoPct / 100)})` : ''}`, '', '', `−${fm(c.desconto)}`]);
    }
    if (v.iva) {
      if (c.desconto) totals.push(['', 'Base tributável', '', '', fm(c.base)]);
      totals.push(['', c.taxa != null ? `IVA (${formatPercent(c.taxa / 100)})` : 'IVA (taxa por indicar)', '', '', c.taxa != null ? fm(c.iva) : '']);
    }
    totals.push(['', 'Total', '', '', fm(c.total)]);
    blocks.push({
      type: 'table',
      columns: [
        { label: 'N.º', width: 0.5, align: 'center' },
        { label: 'Descrição', width: 3.6 },
        { label: 'Quant.', width: 1.4, align: 'right' },
        { label: 'Preço unit. (MT)', width: 1.9, align: 'right' },
        { label: 'Total (MT)', width: 2, align: 'right' },
      ],
      rows,
      totals,
      note: v.iva ? undefined : String(v.ivaNota || '').trim() || 'Os valores indicados não incluem IVA.',
    });
    if (c.total > 0) blocks.push({ type: 'amount', label: `Total ${v.proposta ? 'da proposta' : 'do orçamento'}${v.iva ? ' (com IVA)' : ''}`, value: c.total });

    const condicoes = [
      {
        label: 'Validade',
        value: c.validadeDias ? `${c.validadeDias} ${c.validadeDias === 1 ? 'dia' : 'dias'}${c.validadeData ? `, até ${dateLong(c.validadeData)}` : ''}` : BLANK,
      },
      { label: 'Condições de pagamento', value: v.condicoesPagamento || '' },
      { label: 'Prazo de entrega', value: v.prazoEntrega || '' },
    ];
    if (v.mostrarBanco && p?.banco) condicoes.push({ label: 'Banco', value: p.banco });
    if (v.mostrarBanco && p?.nib) condicoes.push({ label: 'NIB', value: p.nib });
    blocks.push({ type: 'keyValue', title: 'Condições', columns: 1, items: condicoes.filter((it) => it.value) });

    const obs = splitLines(v.observacoes);
    if (obs.length) {
      blocks.push({ type: 'heading', text: 'Observações' });
      obs.forEach((t, i) => blocks.push({ type: 'paragraph', id: `observacao-${i + 1}`, text: t, size: 'small' }));
    }

    const rep = employerRep(ctx);
    const emitente: SignatureColumn =
      p?.kind === 'empresa'
        ? { role: rep.cargo || profileDisplayName(p) || 'Pela empresa', name: rep.nome || undefined, image: 'both' }
        : { role: p?.genero === 'F' ? 'A Emitente' : 'O Emitente', name: p?.nome || undefined, image: 'both' };
    const columns: SignatureColumn[] = [emitente];
    if (v.aceitacao) columns.push({ role: 'Aceito, o Cliente', name: v.clienteNome || undefined, detail: 'Data: ___/___/______' });

    blocks.push(
      {
        type: 'note',
        text: '**Este documento não é uma factura** nem serve de comprovativo de pagamento. A factura é emitida após a adjudicação.',
        en: 'This document is not an invoice or proof of payment. The invoice is issued once the order is placed.',
        keepWithNext: true,
      },
      { type: 'signatures', columns },
    );
    return blocks;
  },
});
