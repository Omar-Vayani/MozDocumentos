// Ordem de execução de trabalhos a mais: written agreement between owner and
// contractor on extra works, their price and any extension of time, before
// they are carried out.

import { addDays, formatPercent } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateLong, l, money } from './_shared';
import { int, lines, num, semPonto, str, valorTexto } from './_contratos';
import { assinaturasObra, IVA_OPTIONS, mt, obraFields, obraKeyValue, partesObraFields, qt, r2, signatureRows, UNIDADES } from './_construcao';

const MOTIVOS = [
  { value: 'dono', label: l('Pedido do dono da obra', 'Owner’s request'), pt: 'pedido do Dono da Obra' },
  { value: 'imprevisto', label: l('Imprevisto técnico', 'Unforeseen site condition'), pt: 'circunstância técnica imprevista' },
  { value: 'projecto', label: l('Erro ou omissão do projecto', 'Design error or omission'), pt: 'erro ou omissão do projecto' },
  { value: 'outro', label: l('Outro', 'Other'), pt: '' },
];

type Item = { artigo: string; descricao: string; unidade: string; quantidade: number | null; preco: number | null; total: number };

export default defineTemplate({
  id: 'ordem-de-trabalhos-a-mais',
  family: 'acta',
  sections: [
    { id: 'documento', title: l('Ordem', 'Order') },
    { id: 'partes', title: l('Partes', 'Parties') },
    { id: 'obra', title: l('Obra e contrato', 'Works and contract') },
    { id: 'trabalhos', title: l('Trabalhos a mais', 'Extra works') },
  ],
  fields: [
    { name: 'numero', type: 'number', section: 'documento', width: 'half', required: true, min: 1, max: 999, default: 1, label: l('Ordem n.º', 'Order no.') },
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data', 'Date'), default: (c) => c.today },
    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    ...partesObraFields('partes'),
    ...obraFields('obra'),
    { name: 'valorContrato', type: 'money', section: 'obra', width: 'half', label: l('Valor actual do contrato (sem IVA)', 'Current contract value (excl. VAT)') },
    { name: 'prazoFimActual', type: 'date', section: 'obra', width: 'half', label: l('Fim do prazo actual', 'Current completion date') },

    { name: 'motivo', type: 'select', section: 'trabalhos', width: 'half', label: l('Motivo', 'Reason'), options: MOTIVOS.map(({ value, label }) => ({ value, label })), default: 'dono' },
    { name: 'motivoDescricao', type: 'textarea', section: 'trabalhos', rows: 2, label: l('Justificação', 'Justification'), placeholder: l('Ex.: o dono da obra pediu a construção de um muro de vedação lateral não previsto no projecto', 'E.g. the owner asked for a side boundary wall not in the design') },
    {
      name: 'itens',
      type: 'lines',
      section: 'trabalhos',
      label: l('Trabalhos', 'Works'),
      addLabel: l('Adicionar trabalho', 'Add item'),
      columns: [
        { name: 'artigo', type: 'text', label: l('Art.º', 'Item') },
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'unidade', type: 'select', label: l('Unidade', 'Unit'), options: UNIDADES },
        { name: 'quantidade', type: 'number', label: l('Quantidade', 'Quantity') },
        { name: 'precoUnitario', type: 'money', label: l('Preço unitário', 'Unit price') },
      ],
    },
    { name: 'ivaRegime', type: 'radio', section: 'trabalhos', label: l('IVA', 'VAT'), options: IVA_OPTIONS, default: 'acrescido' },
    { name: 'prorrogacaoDias', type: 'number', section: 'trabalhos', width: 'half', min: 0, max: 720, default: 0, label: l('Prorrogação do prazo (dias)', 'Extension of time (days)') },
    {
      name: 'pagamento',
      type: 'radio',
      section: 'trabalhos',
      label: l('Pagamento', 'Payment'),
      options: [
        { value: 'autos', label: l('Nos autos de medição seguintes', 'In the next measurement certificates') },
        { value: 'conclusao', label: l('Na conclusão destes trabalhos', 'On completion of these works') },
      ],
      default: 'autos',
    },
  ],

  computed: (v, { legal }) => {
    const itens: Item[] = lines(v.itens)
      .filter((r) => str(r.descricao))
      .map((r) => {
        const quantidade = num(r.quantidade);
        const preco = money(r.precoUnitario);
        return { artigo: str(r.artigo), descricao: str(r.descricao), unidade: str(r.unidade), quantidade, preco, total: quantidade != null && preco != null ? r2(quantidade * preco) : 0 };
      });
    const valor = r2(itens.reduce((s, i) => s + i.total, 0));
    const taxa = legal.value<number>('ivaTaxaNormal');
    const iva = v.ivaRegime === 'acrescido' ? r2(valor * taxa) : 0;
    const contrato = money(v.valorContrato);
    const prorr = int(v.prorrogacaoDias) ?? 0;
    return { itens, valor, taxa, iva, total: r2(valor + iva), contrato, novoContrato: contrato != null ? r2(contrato + valor) : null, prorr, novoFim: v.prazoFimActual && prorr ? addDays(String(v.prazoFimActual), prorr) : '' };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (!c.itens.length) w.push({ level: 'warning', field: 'itens', message: l('Descreva os trabalhos a mais.', 'Describe the extra works.') });
    if ((c.itens as Item[]).some((i) => i.preco == null)) w.push({ level: 'warning', field: 'itens', message: l('Indique o preço de cada trabalho antes de o executar.', 'Set the price of each item before doing it.') });
    w.push({
      level: 'info',
      message: l(`Sem autorização escrita do dono da obra e acordo sobre o preço, o empreiteiro pode não ter direito a ser pago pelas alterações (${cite('empreitadaAlteracoes')}).`, 'Without the owner’s written authorisation and an agreed price, the contractor may not be paid for changes.'),
    });
    if (c.contrato != null && c.contrato > 0 && c.valor / c.contrato > 0.25) {
      w.push({ level: 'info', message: l('Os trabalhos a mais são grandes face ao contrato: considere uma adenda ao contrato de empreitada.', 'The extra works are large compared to the contract: consider an amendment to the contract.') });
    }
    return w;
  },

  personName: (v) => (v.numero ? `ordem-${v.numero}` : undefined),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const motivo = MOTIVOS.find((m) => m.value === v.motivo);
    const rows = (c.itens as Item[]).map((i) => [i.artigo, i.descricao, i.unidade, qt(i.quantidade), mt(i.preco), mt(i.total)]);
    const totals: string[][] = [['', v.ivaRegime === 'acrescido' ? 'Valor sem IVA' : 'Valor total', '', '', '', mt(c.valor)]];
    if (v.ivaRegime === 'acrescido') totals.push(['', `IVA (${formatPercent(c.taxa)})`, '', '', '', mt(c.iva)], ['', 'Total com IVA', '', '', '', mt(c.total)]);
    const blocks: Block[] = [
      { type: 'title', text: `Ordem de Execução de Trabalhos a Mais n.º ${v.numero || BLANK}`, subtitle: `${ctx.place}, ${dateLong(v.data)}` },
      obraKeyValue(v),
      {
        type: 'paragraph',
        id: 'motivo',
        text: `Por ${motivo?.pt || 'motivo justificado'}${str(v.motivoDescricao) ? ` (${semPonto(v.motivoDescricao)})` : ''}, torna-se necessário executar os seguintes trabalhos, não previstos no contrato:`,
        en: 'The following works, not provided for in the contract, are needed:',
        keepWithNext: true,
      },
      {
        type: 'table',
        columns: [
          { label: 'Art.º', width: 0.7, align: 'center' },
          { label: 'Descrição', width: 4 },
          { label: 'Un.', width: 0.6, align: 'center' },
          { label: 'Quant.', width: 0.9, align: 'right' },
          { label: 'P. unit. (MT)', width: 1.4, align: 'right' },
          { label: 'Total (MT)', width: 1.5, align: 'right' },
        ],
        rows: rows.length ? rows : [['', BLANK, '', '', '', '']],
        totals,
      },
      {
        type: 'paragraph',
        id: 'autorizacao',
        text: `O Dono da Obra autoriza a execução dos trabalhos acima descritos, pelo preço de ${valorTexto(c.valor)}${v.ivaRegime === 'acrescido' ? ', acrescido de IVA à taxa legal' : v.ivaRegime === 'incluido' ? ', com IVA incluído' : ''}, que acresce ao valor do contrato${c.novoContrato != null ? `, passando este para ${valorTexto(c.novoContrato)}` : ''}.`,
        en: 'The Owner authorises the works above at the price stated, which is added to the contract value.',
      },
      {
        type: 'paragraph',
        id: 'prazo',
        text: c.prorr
          ? `O prazo de execução é prorrogado por ${c.prorr} ${c.prorr === 1 ? 'dia' : 'dias'}${c.novoFim ? `, passando a obra a terminar em ${dateLong(c.novoFim)}` : ''}.`
          : 'Os trabalhos a mais são executados dentro do prazo contratual em curso, sem prorrogação.',
        en: c.prorr ? 'The completion period is extended.' : 'No extension of time.',
      },
      {
        type: 'paragraph',
        id: 'pagamento',
        text: `Os trabalhos são pagos ${v.pagamento === 'conclusao' ? 'após a sua conclusão, verificada pelo Dono da Obra' : 'nos autos de medição seguintes, como trabalhos a mais aprovados'}, mantendo-se inalteradas as demais condições do contrato.`,
        en: 'Payment terms; all other contract terms stay the same.',
        keepWithNext: true,
      },
      ...signatureRows(assinaturasObra(v, { dono: 'Autorizo — O Dono da Obra', empreiteiro: 'Aceito — O Empreiteiro', fiscal: 'Visto — A Fiscalização' })),
    ];
    return blocks;
  },
});
