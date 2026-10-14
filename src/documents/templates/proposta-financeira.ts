// Proposta financeira (lista de preços / mapa de preços): the bidder's priced
// list of goods or services with VAT and the total in words.

import { numeroPorExtenso, MAX_EXTENSO } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateLong, formatMoney, l } from './_shared';
import {
  concorrenteFields, concorrenteNome, concorrenteSignature, concorrenteWarnings, diasTexto, formularioWarning, isEmpresaConcorrente, items, IVA_OPTIONS, priceTable,
  procedimentoFields, procedimentoNome, semPonto, str, totais,
} from './_contratacao';

export default defineTemplate({
  id: 'proposta-financeira',
  family: 'mapa',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'procedimento', title: l('Concurso', 'Tender') },
    { id: 'concorrente', title: l('Concorrente', 'Bidder'), personRole: 'outro' },
    { id: 'precos', title: l('Lista de preços', 'Price schedule') },
    { id: 'condicoes', title: l('Condições', 'Terms') },
  ],
  fields: [
    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', label: l('Data', 'Date'), default: (c) => c.today },
    { name: 'entidadeNome', type: 'text', section: 'procedimento', required: true, label: l('Entidade contratante', 'Contracting body') },
    ...procedimentoFields(),
    ...concorrenteFields(),
    {
      name: 'itens',
      type: 'lines',
      section: 'precos',
      label: l('Bens ou serviços', 'Goods or services'),
      addLabel: l('Adicionar linha', 'Add line'),
      help: l('Siga a ordem e as quantidades da lista do documento de concurso. Não altere as quantidades pedidas.', 'Follow the order and quantities of the tender list. Do not change the quantities requested.'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'especificacao', type: 'text', label: l('Marca / modelo / origem (opcional)', 'Brand / model / origin (optional)') },
        { name: 'unidade', type: 'text', label: l('Unidade', 'Unit') },
        { name: 'quantidade', type: 'number', label: l('Quantidade', 'Quantity') },
        { name: 'preco', type: 'money', label: l('Preço unitário', 'Unit price') },
      ],
      default: [],
    },
    { name: 'ivaModo', type: 'select', section: 'precos', width: 'half', label: l('IVA', 'VAT'), options: IVA_OPTIONS, default: 'acrescer' },
    { name: 'validadeDias', type: 'number', section: 'condicoes', width: 'half', min: 1, max: 365, label: l('Validade da proposta (dias)', 'Bid validity (days)') },
    { name: 'prazoExecucao', type: 'text', section: 'condicoes', width: 'half', label: l('Prazo de entrega / execução', 'Delivery / performance period'), placeholder: l('Ex.: vinte e um dias após a assinatura do contrato', 'E.g. twenty-one days after signing') },
    { name: 'localEntrega', type: 'text', section: 'condicoes', label: l('Local de entrega (opcional)', 'Delivery place (optional)') },
    { name: 'pagamento', type: 'text', section: 'condicoes', label: l('Condições de pagamento', 'Payment terms'), default: 'Conforme o documento de concurso' },
    { name: 'observacoes', type: 'textarea', section: 'condicoes', rows: 2, label: l('Observações (opcional)', 'Notes (optional)') },
  ],

  computed: (v, ctx) => {
    const list = items(v);
    const taxa = ctx.legal.value<number>('ivaTaxaNormal');
    return { list, taxa, ...totais(list, v.ivaModo, taxa) };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...concorrenteWarnings(v), formularioWarning()];
    if (!c.list.length) w.push({ level: 'error', field: 'itens', message: l('Acrescente os bens ou serviços com os preços.', 'Add the goods or services with prices.') });
    if (c.list.some((i: { preco: number | null }) => i.preco == null)) w.push({ level: 'warning', field: 'itens', message: l('Há linhas sem preço unitário.', 'Some lines have no unit price.') });
    if (!v.validadeDias) w.push({ level: 'warning', field: 'validadeDias', message: l(`Indique a validade da proposta (${cite('ctValidadeProposta')}).`, 'Enter the bid validity.') });
    w.push({ level: 'info', message: l('O preço total deve coincidir com o indicado na carta de apresentação da proposta. Em caso de divergência, prevalece normalmente o preço unitário, conforme o documento de concurso.', 'The total must match the bid letter. In case of discrepancy, the unit price usually prevails, per the tender document.') });
    return w;
  },

  personName: (v) => v.entidadeNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const nuit = isEmpresaConcorrente(v) ? str(v.concorrenteEmpresaNuit) : str(v.concorrenteNuit);
    const total = c.total as number | null;
    const onLetterhead = ctx.profile?.kind === 'empresa' && isEmpresaConcorrente(v) && str(ctx.profile.firma) === concorrenteNome(v);
    const ext = total != null && total >= 0 && total <= MAX_EXTENSO ? numeroPorExtenso(total) : '';
    const blocks: Block[] = [
      { type: 'title', text: 'Proposta financeira — Lista de preços', subtitle: `${procedimentoNome(v)}${str(v.entidadeNome) ? ` · ${str(v.entidadeNome)}` : ''}` },
      {
        type: 'keyValue',
        columns: 1,
        items: [
          { label: 'Objecto', value: semPonto(v.objecto) || '—' },
          ...(onLetterhead ? [] : [{ label: 'Concorrente', value: `${concorrenteNome(v) || '—'}${nuit ? ` (NUIT ${nuit})` : ''}` }]),
        ],
      },
      priceTable(c.list.length ? c.list : [{ descricao: '', especificacao: '', unidade: '', quantidade: null, preco: null, total: null }], c, str(v.ivaModo) || 'acrescer'),
      {
        type: 'paragraph',
        id: 'total',
        text: `O preço total da proposta é de **${formatMoney(total)}**${ext ? ` (${ext})` : ''}, ${v.ivaModo === 'isento' ? 'isento de IVA' : 'com IVA incluído'}.`,
        en: 'Total bid price in figures and words.',
      },
    ];
    const cond = [
      v.validadeDias ? `**Validade da proposta:** ${diasTexto(v.validadeDias)}, contados da data-limite de entrega das propostas.` : '',
      str(v.prazoExecucao) ? `**Prazo de entrega:** ${semPonto(v.prazoExecucao)}.` : '',
      str(v.localEntrega) ? `**Local de entrega:** ${semPonto(v.localEntrega)}.` : '',
      str(v.pagamento) ? `**Pagamento:** ${semPonto(v.pagamento)}.` : '',
    ].filter(Boolean);
    if (cond.length) blocks.push({ type: 'paragraph', id: 'condicoes', text: cond.join('\n'), align: 'left', en: 'Validity, delivery and payment terms.' });
    if (str(v.observacoes)) blocks.push({ type: 'paragraph', id: 'observacoes', text: `Observações: ${str(v.observacoes)}`, size: 'small', en: 'Notes.' });
    blocks.push({ type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [concorrenteSignature(ctx)] });
    return blocks;
  },
});
