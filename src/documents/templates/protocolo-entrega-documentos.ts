// Protocolo de entrega de documentos (mode A) and comprovativo de recepção de
// mercadoria (mode B). Mode B cites the supplier's factura or guia de remessa,
// which are fiscal documents; it never replaces them.

import { formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateLong, l, localField, refField } from './_shared';
import { num, qtyText, rows, semPonto, str } from './_comercio';

const ESTADOS: Record<string, string> = { conforme: 'Conforme', danificado: 'Danificado', falta: 'Em falta', parcial: 'Parcial' };

export default defineTemplate({
  id: 'protocolo-entrega-documentos',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Protocolo', 'Log') },
    { id: 'partes', title: l('Quem entrega e quem recebe', 'Delivered by and received by') },
    { id: 'itens', title: l('Documentos ou bens', 'Documents or goods') },
  ],
  fields: [
    {
      name: 'modo',
      type: 'radio',
      section: 'documento',
      label: l('O que se entrega', 'What is handed over'),
      options: [
        { value: 'documentos', label: l('Documentos', 'Documents') },
        { value: 'mercadoria', label: l('Mercadoria (recepção)', 'Goods (receipt)') },
      ],
      default: 'documentos',
    },
    refField(),
    localField(),
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data', 'Date'), default: (c) => c.today },
    { name: 'hora', type: 'text', section: 'documento', width: 'half', label: l('Hora (opcional)', 'Time (optional)'), placeholder: l('Ex.: 10h30', 'E.g. 10:30') },
    { name: 'referencia', type: 'text', section: 'documento', label: l('Referente a', 'Regarding'), placeholder: l('Ex.: documentos contabilísticos de Setembro de 2026', 'E.g. accounting documents for September 2026'), showIf: (v) => v.modo !== 'mercadoria' },
    { name: 'docFiscalTipo', type: 'select', section: 'documento', width: 'half', label: l('Documento que acompanha os bens', 'Document with the goods'), options: [{ value: 'guia de remessa', label: l('Guia de remessa', 'Delivery note') }, { value: 'factura', label: l('Factura', 'Invoice') }], default: 'guia de remessa', showIf: (v) => v.modo === 'mercadoria' },
    { name: 'docFiscalNumero', type: 'text', section: 'documento', width: 'half', label: l('N.º do documento', 'Document no.'), showIf: (v) => v.modo === 'mercadoria' },
    { name: 'encomendaNumero', type: 'text', section: 'documento', width: 'half', label: l('Nota de encomenda n.º (opcional)', 'Purchase order no. (optional)'), showIf: (v) => v.modo === 'mercadoria' },

    { name: 'entreguePor', type: 'text', section: 'partes', width: 'half', label: l('Entregue por (nome)', 'Delivered by (name)') },
    { name: 'entreguePorEntidade', type: 'text', section: 'partes', width: 'half', label: l('Entidade de quem entrega', 'Deliverer’s organisation'), default: (c) => c.profile?.firma || c.profile?.nome || '' },
    { name: 'recebidoPor', type: 'text', section: 'partes', width: 'half', label: l('Recebido por (nome)', 'Received by (name)') },
    { name: 'recebidoPorEntidade', type: 'text', section: 'partes', width: 'half', label: l('Entidade de quem recebe', 'Receiver’s organisation') },
    { name: 'veiculo', type: 'text', section: 'partes', width: 'half', label: l('Viatura / transportador (opcional)', 'Vehicle / carrier (optional)'), showIf: (v) => v.modo === 'mercadoria' },

    {
      name: 'documentos',
      type: 'lines',
      section: 'itens',
      label: l('Documentos entregues', 'Documents handed over'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Documento', 'Document') },
        { name: 'periodo', type: 'text', label: l('Período / n.º', 'Period / no.') },
        { name: 'quantidade', type: 'number', label: l('Quantidade (folhas ou un.)', 'Quantity'), min: 0 },
        { name: 'original', type: 'select', label: l('Original ou cópia', 'Original or copy'), options: [{ value: 'original', label: l('Original', 'Original') }, { value: 'copia', label: l('Cópia', 'Copy') }] },
        { name: 'observacoes', type: 'text', label: l('Observações', 'Notes') },
      ],
      default: [],
      showIf: (v) => v.modo !== 'mercadoria',
    },
    {
      name: 'bens',
      type: 'lines',
      section: 'itens',
      label: l('Bens recebidos', 'Goods received'),
      addLabel: l('Adicionar artigo', 'Add item'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'qtdDocumento', type: 'number', label: l('Qtd. no documento', 'Qty on document'), min: 0 },
        { name: 'qtdRecebida', type: 'number', label: l('Qtd. recebida', 'Qty received'), min: 0 },
        { name: 'estado', type: 'select', label: l('Estado', 'Condition'), options: Object.entries(ESTADOS).map(([value, pt]) => ({ value, label: l(pt, pt) })) },
        { name: 'observacoes', type: 'text', label: l('Observações', 'Notes') },
      ],
      default: [],
      showIf: (v) => v.modo === 'mercadoria',
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    const merc = v.modo === 'mercadoria';
    if (merc && !str(v.docFiscalNumero)) {
      w.push({ level: 'error', field: 'docFiscalNumero', message: l('Indique o número da factura ou guia de remessa que acompanhou os bens.', 'Enter the invoice or delivery note number that came with the goods.') });
    }
    if (merc && rows(v.bens).some((b) => b.estado && b.estado !== 'conforme')) {
      w.push({
        level: 'warning',
        field: 'bens',
        message: l(`Há bens danificados ou em falta: anote-o também na guia de remessa e comunique-o por escrito ao fornecedor sem demora (${cite('vendaDefeituosa')}).`, 'Some goods are damaged or missing: note it on the delivery note too and notify the supplier in writing promptly.'),
      });
    }
    const lista = merc ? rows(v.bens) : rows(v.documentos);
    if (!lista.some((r) => str(r.descricao))) w.push({ level: 'warning', field: merc ? 'bens' : 'documentos', message: l('Acrescente pelo menos uma linha.', 'Add at least one line.') });
    return w;
  },

  personName: (v) => v.recebidoPorEntidade || v.recebidoPor,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const merc = v.modo === 'mercadoria';
    const titulo = merc ? 'Comprovativo de recepção de mercadoria' : 'Protocolo de entrega de documentos';
    const quando = `${ctx.place}, ${dateLong(v.data)}${str(v.hora) ? `, às ${str(v.hora)}` : ''}`;
    const quem = (n: unknown, e: unknown) => [str(n), str(e)].filter(Boolean).join(' — ') || BLANK;

    const kv = [
      { label: 'Entregue por', value: quem(v.entreguePor, v.entreguePorEntidade) },
      { label: 'Recebido por', value: quem(v.recebidoPor, v.recebidoPorEntidade) },
    ];
    if (merc) {
      kv.push({ label: str(v.docFiscalTipo) === 'factura' ? 'Factura n.º' : 'Guia de remessa n.º', value: str(v.docFiscalNumero) || BLANK });
      if (str(v.encomendaNumero)) kv.push({ label: 'Nota de encomenda n.º', value: str(v.encomendaNumero) });
      if (str(v.veiculo)) kv.push({ label: 'Viatura / transportador', value: str(v.veiculo) });
    } else if (str(v.referencia)) {
      kv.push({ label: 'Referente a', value: semPonto(v.referencia) });
    }

    const blocks: Block[] = [
      { type: 'title', text: titulo, subtitle: `${str(v.ref) ? `N.º ${str(v.ref)} · ` : ''}${quando}` },
      { type: 'keyValue', columns: 1, items: kv },
    ];

    if (merc) {
      const bens = rows(v.bens).filter((b) => str(b.descricao));
      blocks.push({
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.5, align: 'center' },
          { label: 'Descrição', width: 3.6 },
          { label: 'Qtd. doc.', width: 1, align: 'right' },
          { label: 'Qtd. recebida', width: 1.2, align: 'right' },
          { label: 'Estado', width: 1.2, align: 'center' },
          { label: 'Observações', width: 2.2 },
        ],
        rows: bens.length
          ? bens.map((b, i) => [String(i + 1), str(b.descricao), num(b.qtdDocumento) != null ? qtyText(num(b.qtdDocumento)!) : '', num(b.qtdRecebida) != null ? qtyText(num(b.qtdRecebida)!) : '', ESTADOS[b.estado] ?? '', str(b.observacoes)])
          : [1, 2, 3, 4].map((i) => [String(i), '', '', '', '', '']),
      });
      blocks.push({
        type: 'paragraph',
        id: 'rm-declaracao',
        text: `Declara-se que foram recebidos os bens acima indicados, entregues com a ${str(v.docFiscalTipo) || 'guia de remessa'} n.º ${str(v.docFiscalNumero) || BLANK}, com as observações registadas. A assinatura não implica a aceitação de defeitos ocultos.`,
        en: 'The goods listed were received with the delivery document stated, subject to the notes recorded. Signing does not mean acceptance of hidden defects.',
        keepWithNext: true,
      });
    } else {
      const docs = rows(v.documentos).filter((d) => str(d.descricao));
      blocks.push({
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.5, align: 'center' },
          { label: 'Documento', width: 3.6 },
          { label: 'Período / n.º', width: 1.6 },
          { label: 'Quant.', width: 0.9, align: 'right' },
          { label: 'Original / cópia', width: 1.3, align: 'center' },
          { label: 'Observações', width: 1.9 },
        ],
        rows: docs.length
          ? docs.map((d, i) => [String(i + 1), str(d.descricao), str(d.periodo), num(d.quantidade) != null ? qtyText(num(d.quantidade)!) : '', d.original === 'copia' ? 'Cópia' : d.original === 'original' ? 'Original' : '', str(d.observacoes)])
          : [1, 2, 3, 4, 5].map((i) => [String(i), '', '', '', '', '']),
      });
      blocks.push({
        type: 'paragraph',
        id: 'pe-declaracao',
        text: 'Declara-se que, na data e hora indicadas, foram entregues e recebidos os documentos acima relacionados. A recepção não implica a verificação do seu conteúdo.',
        en: 'The documents listed were handed over and received on the date and time stated. Receipt does not imply checking their content.',
        keepWithNext: true,
      });
    }
    blocks.push({
      type: 'signatures',
      columns: [
        { role: 'Entreguei', name: str(v.entreguePor) || undefined, detail: str(v.entreguePorEntidade) || undefined },
        { role: 'Recebi', name: str(v.recebidoPor) || undefined, detail: [str(v.recebidoPorEntidade), `Data: ${formatDateShort(v.data)}`].filter(Boolean).join('\n') },
      ],
    });
    blocks.push({ type: 'note', text: merc ? 'Este comprovativo não substitui a factura nem a guia de remessa. Feito em dois exemplares, um para cada parte.' : 'Feito em dois exemplares, um para cada parte.', en: 'Made in two copies, one for each party.' });
    return blocks;
  },
});
