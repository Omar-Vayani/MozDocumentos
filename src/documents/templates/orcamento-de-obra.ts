// Orçamento de obra — mapa de quantidades e preços (bill of quantities):
// articles grouped by chapter, with unit, quantity, unit price, chapter
// subtotals, VAT and the usual execution and payment terms.

import { addDays, formatPercent } from '@/lib/format';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type ClauseItem, type SignatureColumn, type Warning } from '../model';
import { BLANK, dateField, dateLong, employerRep, l, localField, money, refField, splitLines } from './_shared';
import { int, lines, num, semPonto, str } from './_contratos';
import { IVA_OPTIONS, mt, obraFields, profileLicenca, qt, r2, UNIDADES } from './_construcao';

type Item = { capitulo: string; descricao: string; unidade: string; quantidade: number | null; preco: number | null; total: number };
type Capitulo = { nome: string; itens: Item[]; total: number };

const NAO_INCLUIDO = [
  'Licenças, taxas e emolumentos municipais.',
  'Ligações às redes públicas de água, energia e esgotos.',
  'Projectos de arquitectura e de especialidades.',
  'Trabalhos não descritos no presente mapa.',
].join('\n');

export default defineTemplate({
  id: 'orcamento-de-obra',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Orçamento', 'Quote') },
    { id: 'cliente', title: l('Cliente (dono da obra)', 'Client (owner)'), personRole: 'cliente' },
    { id: 'obra', title: l('Obra', 'Works') },
    { id: 'mapa', title: l('Mapa de quantidades e preços', 'Bill of quantities') },
    { id: 'condicoes', title: l('Condições', 'Terms') },
  ],
  fields: [
    refField(),
    localField(),
    dateField(),
    { name: 'validadeDias', type: 'number', section: 'documento', width: 'half', min: 1, max: 365, default: 30, label: l('Validade da proposta (dias)', 'Quote valid for (days)') },

    { name: 'clienteNome', type: 'text', section: 'cliente', required: true, label: l('Nome do cliente', 'Client name'), personKey: 'nome' },
    { name: 'clienteNuit', type: 'text', section: 'cliente', width: 'half', label: l('NUIT', 'Tax number (NUIT)'), personKey: 'nuit' },
    { name: 'clienteContacto', type: 'text', section: 'cliente', width: 'half', label: l('Contacto', 'Contact'), personKey: 'telefone' },
    { name: 'clienteMorada', type: 'text', section: 'cliente', label: l('Morada', 'Address'), personKey: 'morada' },

    ...obraFields('obra', { contrato: false }),
    {
      name: 'projectoReferencia',
      type: 'text',
      section: 'obra',
      label: l('Base do orçamento', 'Basis of the quote'),
      placeholder: l('Ex.: projecto aprovado; levantamento no local em 2 de Outubro de 2026', 'E.g. approved design; site survey on 2 October 2026'),
    },

    {
      name: 'itens',
      type: 'lines',
      section: 'mapa',
      label: l('Artigos', 'Items'),
      help: l(
        'Escreva o capítulo em cada linha (ex.: "Alvenarias"); as linhas com o mesmo capítulo seguido ficam agrupadas, com subtotal. Uma linha sem quantidade nem preço é impressa como nota.',
        'Type the chapter on each line (e.g. "Masonry"); consecutive lines with the same chapter are grouped with a subtotal. A line without quantity or price prints as a note.',
      ),
      addLabel: l('Adicionar artigo', 'Add item'),
      columns: [
        { name: 'capitulo', type: 'text', label: l('Capítulo', 'Chapter') },
        { name: 'descricao', type: 'text', label: l('Descrição do trabalho', 'Description of work') },
        { name: 'unidade', type: 'select', label: l('Unidade', 'Unit'), options: UNIDADES },
        { name: 'quantidade', type: 'number', label: l('Quantidade', 'Quantity') },
        { name: 'precoUnitario', type: 'money', label: l('Preço unitário', 'Unit price') },
      ],
      default: [
        { capitulo: 'Estaleiro e trabalhos preparatórios', descricao: 'Montagem do estaleiro, limpeza do terreno e implantação da obra', unidade: 'vg', quantidade: 1, precoUnitario: '' },
        { capitulo: 'Movimento de terras', descricao: 'Escavação para fundações, incluindo remoção de terras sobrantes', unidade: 'm³', quantidade: '', precoUnitario: '' },
        { capitulo: 'Betão e betão armado', descricao: 'Sapatas e vigas de fundação em betão armado', unidade: 'm³', quantidade: '', precoUnitario: '' },
        { capitulo: 'Alvenarias', descricao: 'Paredes em blocos de cimento de 15 cm, assentes com argamassa', unidade: 'm²', quantidade: '', precoUnitario: '' },
      ],
    },
    {
      name: 'ivaRegime',
      type: 'radio',
      section: 'mapa',
      label: l('IVA', 'VAT'),
      options: IVA_OPTIONS,
      default: 'acrescido',
    },
    { name: 'desconto', type: 'money', section: 'mapa', width: 'half', label: l('Desconto (valor, opcional)', 'Discount (amount, optional)') },
    { name: 'resumoCapitulos', type: 'toggle', section: 'mapa', default: false, label: l('Incluir resumo por capítulos', 'Include summary by chapter') },

    { name: 'prazoDias', type: 'number', section: 'condicoes', width: 'half', min: 1, max: 1500, label: l('Prazo de execução (dias)', 'Completion time (days)') },
    {
      name: 'prazoTipo',
      type: 'radio',
      section: 'condicoes',
      width: 'half',
      label: l('Contagem do prazo', 'Days counted as'),
      options: [
        { value: 'calendario', label: l('Dias de calendário', 'Calendar days') },
        { value: 'uteis', label: l('Dias úteis', 'Working days') },
      ],
      default: 'calendario',
    },
    { name: 'adiantamentoPct', type: 'number', section: 'condicoes', width: 'half', min: 0, max: 100, label: l('Adiantamento na adjudicação (%)', 'Advance on award (%)') },
    {
      name: 'pagamentoModo',
      type: 'radio',
      section: 'condicoes',
      label: l('Pagamento do restante', 'Payment of the balance'),
      options: [
        { value: 'autos', label: l('Autos de medição mensais', 'Monthly measurements') },
        { value: 'fases', label: l('Por fases concluídas', 'By completed stages') },
        { value: 'fim', label: l('Na conclusão da obra', 'On completion') },
      ],
      default: 'fases',
    },
    { name: 'pagamentoDias', type: 'number', section: 'condicoes', width: 'half', min: 0, max: 90, label: l('Prazo de pagamento (dias após aprovação)', 'Payment term (days after approval)') },
    { name: 'naoIncluido', type: 'textarea', section: 'condicoes', rows: 4, default: NAO_INCLUIDO, label: l('Não incluído no orçamento (uma linha por item)', 'Not included (one line each)') },
    { name: 'revisaoPrecos', type: 'toggle', section: 'condicoes', label: l('Prever revisão de preços se a obra começar mais tarde', 'Allow price review if works start later') },
    { name: 'mesesRevisao', type: 'number', section: 'condicoes', width: 'half', min: 1, max: 24, default: 3, label: l('Revisão se o início ocorrer depois de (meses)', 'Review if start is after (months)'), showIf: (v) => Boolean(v.revisaoPrecos) },
    { name: 'observacoes', type: 'textarea', section: 'condicoes', rows: 3, label: l('Observações (opcional)', 'Notes (optional)') },
    { name: 'aceitacao', type: 'toggle', section: 'condicoes', default: true, label: l('Incluir espaço para aceitação do cliente', 'Include space for the client’s acceptance') },
  ],

  computed: (v, { legal, today }) => {
    const itens: Item[] = lines(v.itens)
      .filter((r) => str(r.descricao) || str(r.capitulo))
      .map((r) => {
        const quantidade = num(r.quantidade);
        const preco = money(r.precoUnitario);
        return { capitulo: str(r.capitulo), descricao: str(r.descricao), unidade: str(r.unidade), quantidade, preco, total: quantidade != null && preco != null ? r2(quantidade * preco) : 0 };
      });
    const capitulos: Capitulo[] = [];
    for (const it of itens) {
      const last = capitulos[capitulos.length - 1];
      if (last && last.nome === it.capitulo) last.itens.push(it);
      else capitulos.push({ nome: it.capitulo, itens: [it], total: 0 });
    }
    for (const c of capitulos) c.total = r2(c.itens.reduce((s, i) => s + i.total, 0));
    const subtotal = r2(capitulos.reduce((s, c) => s + c.total, 0));
    const desconto = Math.min(money(v.desconto) ?? 0, subtotal);
    const base = r2(subtotal - desconto);
    const taxa = legal.value<number>('ivaTaxaNormal');
    const iva = v.ivaRegime === 'acrescido' ? r2(base * taxa) : 0;
    const total = r2(base + iva);
    const ivaIncluido = v.ivaRegime === 'incluido' ? r2(base - base / (1 + taxa)) : 0;
    const validade = int(v.validadeDias);
    const validadeData = validade && (v.data || today) ? addDays(String(v.data || today), validade) : '';
    return { itens, capitulos, subtotal, desconto, base, taxa, iva, total, ivaIncluido, validade, validadeData };
  },

  warnings: (v, { computed: c, profile }) => {
    const w: Warning[] = [];
    if (!str(v.clienteNome)) w.push({ level: 'error', field: 'clienteNome', message: l('Indique o cliente.', 'Enter the client.') });
    if (!c.itens.length) w.push({ level: 'warning', field: 'itens', message: l('Acrescente os artigos do mapa de quantidades.', 'Add the bill of quantities items.') });
    if ((c.itens as Item[]).some((i) => (i.quantidade == null) !== (i.preco == null))) {
      w.push({ level: 'warning', field: 'itens', message: l('Há artigos com quantidade sem preço unitário, ou com preço sem quantidade.', 'Some items have a quantity but no unit price, or a price but no quantity.') });
    }
    if (profileLicenca(profile)) {
      w.push({ level: 'info', message: l('Confirme que a classe do seu alvará cobre o valor desta obra.', 'Check that your licence class covers the value of these works.') });
    } else if (profile?.kind === 'empresa') {
      w.push({ level: 'info', message: l('Acrescente ao perfil o número e a classe do alvará de empreiteiro: os clientes e o município pedem-no.', 'Add the contractor’s licence number and class to the profile: clients and the municipality ask for it.') });
    }
    if ((num(v.adiantamentoPct) ?? 0) > 30) {
      w.push({ level: 'info', field: 'adiantamentoPct', message: l('Adiantamentos elevados costumam ser cobertos por garantia bancária do empreiteiro.', 'Large advances are usually covered by a bank guarantee from the contractor.') });
    }
    w.push({ level: 'info', message: l('Um orçamento não é factura. Emita a factura no seu sistema de facturação quando receber o pagamento.', 'A quote is not an invoice. Issue the invoice in your billing system when you are paid.') });
    return w;
  },

  personName: (v) => v.clienteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const p = ctx.profile;
    const capitulos = c.capitulos as Capitulo[];

    const blocks: Block[] = [{ type: 'title', text: 'Orçamento de Obra', subtitle: `Mapa de Quantidades e Preços · N.º ${v.ref || BLANK} · ${ctx.place}, ${dateLong(v.data)}` }];

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
        ].filter((i) => i.value),
      });
    }
    blocks.push({
      type: 'keyValue',
      columns: 2,
      items: [
        { label: 'Cliente', value: v.clienteNome || BLANK },
        { label: 'NUIT', value: str(v.clienteNuit) },
        { label: 'Morada', value: str(v.clienteMorada) },
        { label: 'Contacto', value: str(v.clienteContacto) },
        { label: 'Obra', value: str(v.obraDesignacao) || BLANK },
        { label: 'Local', value: str(v.obraLocal) || BLANK },
        { label: 'Base do orçamento', value: str(v.projectoReferencia) },
        { label: 'Alvará', value: profileLicenca(p) },
      ].filter((i) => i.value),
    });

    const rows: string[][] = [];
    capitulos.forEach((cap, ci) => {
      const n = ci + 1;
      rows.push([`§ ${n}. ${(cap.nome || 'Trabalhos').toUpperCase()}`]);
      cap.itens.forEach((it, ii) => {
        const note = it.quantidade == null && it.preco == null;
        rows.push([`${n}.${ii + 1}`, it.descricao || BLANK, note ? '' : it.unidade, note ? '' : qt(it.quantidade), note ? '' : mt(it.preco), note ? '' : mt(it.total)]);
      });
      if (capitulos.length > 1) rows.push(['= ', `Subtotal do capítulo ${n}`, '', '', '', mt(cap.total)]);
    });
    if (!rows.length) rows.push(['1.1', BLANK, '', '', '', '']);

    const totals: string[][] = [];
    const taxaTxt = formatPercent(c.taxa);
    if (c.desconto > 0) {
      totals.push(['', 'Soma', '', '', '', mt(c.subtotal)], ['', 'Desconto', '', '', '', `−${mt(c.desconto)}`]);
    }
    if (v.ivaRegime === 'acrescido') {
      totals.push(['', 'Total sem IVA', '', '', '', mt(c.base)], ['', `IVA (${taxaTxt})`, '', '', '', mt(c.iva)]);
    }
    totals.push(['', v.ivaRegime === 'acrescido' ? 'Total com IVA' : 'Total', '', '', '', mt(c.total)]);

    blocks.push({
      type: 'table',
      columns: [
        { label: 'Art.º', width: 0.6, align: 'center' },
        { label: 'Descrição dos trabalhos', width: 4.2 },
        { label: 'Un.', width: 0.6, align: 'center' },
        { label: 'Quant.', width: 0.9, align: 'right' },
        { label: 'P. unit. (MT)', width: 1.4, align: 'right' },
        { label: 'Total (MT)', width: 1.6, align: 'right' },
      ],
      rows,
      totals,
      note:
        v.ivaRegime === 'incluido'
          ? `Preços com IVA incluído à taxa de ${taxaTxt}.`
          : v.ivaRegime === 'isento'
            ? 'Valores não sujeitos a IVA ou isentos.'
            : undefined,
    });

    if (v.resumoCapitulos && capitulos.length > 1 && c.subtotal > 0) {
      blocks.push({
        type: 'table',
        caption: 'Resumo por capítulos',
        columns: [
          { label: 'Cap.', width: 0.6, align: 'center' },
          { label: 'Designação', width: 5.6 },
          { label: 'Valor (MT)', width: 1.6, align: 'right' },
          { label: 'Peso', width: 1, align: 'right' },
        ],
        rows: capitulos.map((cap, i) => [String(i + 1), cap.nome || 'Trabalhos', mt(cap.total), formatPercent(cap.total / c.subtotal)]),
      });
    }
    if (c.total > 0) blocks.push({ type: 'amount', label: v.ivaRegime === 'acrescido' ? 'Valor total do orçamento (com IVA)' : 'Valor total do orçamento', value: c.total });

    const prazo = int(v.prazoDias);
    const adiant = num(v.adiantamentoPct);
    const pagDias = int(v.pagamentoDias);
    const naoIncl = splitLines(v.naoIncluido);
    const pagRestante =
      v.pagamentoModo === 'autos'
        ? 'contra autos de medição mensais dos trabalhos executados'
        : v.pagamentoModo === 'fim'
          ? 'na conclusão da obra, após a vistoria conjunta'
          : 'por fases, após a conclusão de cada fase verificada pelo cliente';
    const cond: ClauseItem[] = [
      {
        id: 'validade',
        heading: 'Validade',
        text: `A presente proposta é válida por ${c.validade ? `${c.validade} ${c.validade === 1 ? 'dia' : 'dias'}` : BLANK}${c.validadeData ? `, até ${dateLong(c.validadeData)}` : ''}.`,
        en: 'Validity of the quote.',
      },
      {
        id: 'prazo',
        heading: 'Prazo de execução',
        text: `${prazo ? `${prazo} ${v.prazoTipo === 'uteis' ? 'dias úteis' : 'dias de calendário'}` : `${BLANK} dias`}, contados a partir da consignação da obra${adiant ? ' e do pagamento do adiantamento' : ''}.`,
        en: 'Completion time, counted from the site handover.',
      },
      {
        id: 'pagamento',
        heading: 'Pagamento',
        text: `${adiant ? `${String(adiant).replace('.', ',')}% do valor na adjudicação, a título de adiantamento; o restante ` : 'O valor é pago '}${pagRestante}${pagDias != null ? `, no prazo de ${pagDias} ${pagDias === 1 ? 'dia' : 'dias'} após a respectiva aprovação e a apresentação da factura` : ''}.`.replace(/^./, (s) => s.toUpperCase()),
        en: 'Payment terms.',
      },
      {
        id: 'precos',
        heading: 'Preços',
        text: `Os preços unitários incluem materiais, mão-de-obra, equipamento e transporte.${v.revisaoPrecos ? ` Os preços podem ser revistos se o início da obra ocorrer mais de ${int(v.mesesRevisao) ?? BLANK} ${int(v.mesesRevisao) === 1 ? 'mês' : 'meses'} depois da data desta proposta.` : ''}`,
        en: 'Unit prices include materials, labour, equipment and transport.',
      },
      {
        id: 'trabalhosMais',
        heading: 'Trabalhos a mais',
        text: 'Os trabalhos não previstos neste mapa são orçamentados à parte e só são executados depois de aprovados por escrito pelo cliente.',
        en: 'Extra works are quoted separately and done only after written approval.',
      },
    ];
    if (naoIncl.length) {
      cond.push({ id: 'naoIncluido', heading: 'Não incluído', text: 'O presente orçamento não inclui:', items: naoIncl.map(semPonto), en: 'Not included in this quote.' });
    }
    const obs = splitLines(v.observacoes);
    if (obs.length) cond.push({ id: 'observacoes', heading: 'Observações', text: obs.join('\n'), en: 'Notes.' });
    blocks.push({ type: 'heading', text: 'Condições' });
    cond.forEach((cl, i) => {
      const extra = cl.items?.length ? ` ${cl.items.map((t) => t.replace(/^./, (x) => x.toLowerCase())).join('; ')}.` : '';
      blocks.push({ type: 'paragraph', id: cl.id, text: `**${i + 1}. ${cl.heading}.** ${cl.text}${extra}`, en: cl.en, size: 'small', keepWithNext: i === cond.length - 1 });
    });

    const rep = employerRep(ctx);
    const emitente: SignatureColumn =
      p?.kind === 'empresa'
        ? { role: 'Pelo Empreiteiro', name: rep.nome || undefined, detail: rep.cargo || undefined, image: 'both' }
        : { role: p?.genero === 'F' ? 'A Emitente' : 'O Emitente', name: p?.nome || undefined, image: 'both' };
    const columns: SignatureColumn[] = [emitente];
    if (v.aceitacao) columns.push({ role: 'Aceito — O Cliente', name: str(v.clienteNome) || undefined, detail: 'Data: ___/___/______' });
    blocks.push(
      {
        type: 'note',
        text: '**Este documento não é uma factura.** A factura é emitida com cada pagamento.',
        en: 'This document is not an invoice. An invoice is issued with each payment.',
        keepWithNext: true,
      },
      { type: 'signatures', columns },
    );
    return blocks;
  },
});
