// Contrato de prestação de serviços de mecanização agrícola (tractor):
// ploughing, harrowing, ridging, planting, threshing or transport, priced per
// hectare or per hour, with area measurement, field preparation, weather
// delays, advance payment and damage.

import { roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, dateLong, formatMoney, l, money } from './_shared';
import {
  assinatura, documentoFields, foroField, lines, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str, testemunhasField,
  valorTexto,
} from './_contratos';
import { contratoBlocks, formaPagamentoFields, modoPagamento } from './_digital';

/** A short blank for narrow table cells. */
const CELL = '______';

type Op = { operacao: string; quantidade: number | null; unidade: string; preco: number | null };
const ops = (v: Values): Op[] =>
  lines(v.operacoes)
    .map((r) => ({ operacao: str(r.operacao), quantidade: Number(r.quantidade) || null, unidade: str(r.unidade) || 'ha', preco: money(r.preco) }))
    .filter((r) => r.operacao);

export default defineTemplate({
  id: 'contrato-servicos-mecanizacao',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'prestador', title: l('Prestador (dono do tractor)', 'Contractor (tractor owner)'), personRole: 'outro' },
    { id: 'agricultor', title: l('Agricultor', 'Farmer'), personRole: 'cliente' },
    { id: 'servico', title: l('Serviços', 'Services') },
    { id: 'pagamento', title: l('Pagamento', 'Payment') },
    { id: 'clausulas', title: l('Assinaturas', 'Signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('prestador', { fromProfile: true }),
    ...partyFields('agricultor'),

    { name: 'machamba', type: 'text', section: 'servico', required: true, label: l('Localização da machamba', 'Field location') },
    { name: 'equipamento', type: 'text', section: 'servico', label: l('Equipamento', 'Equipment'), placeholder: l('Ex.: tractor de 75 cv com charrua de discos e grade', 'E.g. 75 hp tractor with disc plough and harrow') },
    {
      name: 'operacoes',
      type: 'lines',
      section: 'servico',
      label: l('Operações', 'Operations'),
      addLabel: l('Adicionar operação', 'Add operation'),
      columns: [
        { name: 'operacao', type: 'text', label: l('Operação', 'Operation') },
        { name: 'quantidade', type: 'number', label: l('Quantidade', 'Quantity') },
        { name: 'unidade', type: 'select', label: l('Unidade', 'Unit'), options: [{ value: 'ha', label: l('hectare', 'hectare') }, { value: 'hora', label: l('hora', 'hour') }, { value: 'viagem', label: l('viagem', 'trip') }, { value: 'saco', label: l('saco', 'bag') }] },
        { name: 'preco', type: 'money', label: l('Preço unitário', 'Unit price') },
      ],
      default: [
        { operacao: 'Lavoura', quantidade: '', unidade: 'ha', preco: '' },
        { operacao: 'Gradagem', quantidade: '', unidade: 'ha', preco: '' },
      ],
    },
    { name: 'dataPrevista', type: 'date', section: 'servico', width: 'half', label: l('Data prevista', 'Planned date') },
    { name: 'combustivel', type: 'select', section: 'servico', width: 'half', label: l('Combustível', 'Fuel'), options: [{ value: 'prestador', label: l('Incluído no preço', 'Included') }, { value: 'agricultor', label: l('Fornecido pelo agricultor', 'Supplied by farmer') }], default: 'prestador' },
    { name: 'medicao', type: 'select', section: 'servico', width: 'half', label: l('Medição da área', 'Area measurement'), options: [{ value: 'gps', label: l('Com GPS, na presença de ambos', 'By GPS, both present') }, { value: 'acordo', label: l('Por acordo no local', 'By agreement on site') }], default: 'gps' },

    { name: 'adiantamentoPct', type: 'number', section: 'pagamento', width: 'half', min: 0, max: 100, default: 50, label: l('Adiantamento (%)', 'Advance (%)') },
    { name: 'saldoQuando', type: 'select', section: 'pagamento', width: 'half', label: l('Saldo', 'Balance'), options: [{ value: 'conclusao', label: l('Na conclusão do trabalho', 'On completion') }, { value: 'colheita', label: l('Após a colheita', 'After harvest') }], default: 'conclusao' },
    { name: 'dataColheita', type: 'date', section: 'pagamento', width: 'half', label: l('Saldo pago até', 'Balance due by'), showIf: (v) => v.saldoQuando === 'colheita' },
    ...formaPagamentoFields('pagamento'),

    foroField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const os = ops(v).map((o) => ({ ...o, total: o.quantidade != null && o.preco != null ? roundMoney(o.quantidade * o.preco) : null }));
    const total = os.some((o) => o.total != null) ? roundMoney(os.reduce((s, o) => s + (o.total ?? 0), 0)) : null;
    const pct = Number(v.adiantamentoPct);
    const adiantamento = total != null && Number.isFinite(pct) && pct > 0 ? roundMoney((total * Math.min(pct, 100)) / 100) : null;
    return { ops: os, total, adiantamento };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'prestador', 'prestador', 'contractor'), ...partyWarnings(v, 'agricultor', 'agricultor', 'farmer')];
    if (c.total == null) w.push({ level: 'warning', field: 'operacoes', message: l('Indique as quantidades e os preços das operações.', 'Enter quantities and prices.') });
    w.push({ level: 'info', message: l('O operador do tractor deve ter carta de condução adequada e o tractor deve ter seguro de responsabilidade civil para circular na via pública.', 'The operator needs a suitable driving licence and the tractor third-party insurance to use public roads.') });
    return w;
  },

  personName: (v) => partyName(v, 'agricultor') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const P = papel(v, 'prestador', 'Prestador', 'Prestadora', true);
    const A = papel(v, 'agricultor', 'Agricultor', 'Agricultora');
    const U: Record<string, string> = { ha: 'ha', hora: 'hora', viagem: 'viagem', saco: 'saco' };

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: `Pelo presente contrato, ${P.o} presta ${A.ao}, com equipamento e operador próprios${str(v.equipamento) ? ` (${semPonto(v.equipamento)})` : ''}, os serviços de mecanização indicados no quadro seguinte, na machamba situada em ${semPonto(v.machamba) || BLANK}, com início previsto em ${dateLong(v.dataPrevista)}.`,
      en: 'The contractor provides the mechanisation services in the table, with its own equipment and operator, on the field stated.',
    });
    const quadro: Block = {
      type: 'table',
      columns: [
        { label: 'Operação', width: 2.6 },
        { label: 'Quantidade', width: 1.1, align: 'right' },
        { label: 'Unidade', width: 0.9 },
        { label: 'Preço (MT)', width: 1.3, align: 'right' },
        { label: 'Total (MT)', width: 1.4, align: 'right' },
      ],
      rows: c.ops.length ? c.ops.map((o: Op & { total: number | null }) => [o.operacao, o.quantidade != null ? String(o.quantidade).replace('.', ',') : CELL, U[o.unidade] ?? o.unidade, o.preco != null ? formatMoney(o.preco, false) : CELL, o.total != null ? formatMoney(o.total, false) : CELL]) : [[CELL, '', '', '', '']],
      totals: [['Total estimado', '', '', '', c.total != null ? formatMoney(c.total, false) : CELL]],
    };
    const cl2: ClauseItem[] = [];
    cl2.push({
      id: 'medicao',
      heading: 'Medição e preço final',
      text: `As áreas indicadas são estimativas. A área efectivamente trabalhada é medida ${v.medicao === 'gps' ? 'com aparelho GPS, na presença das duas partes' : 'por acordo das partes, no local'}, no fim de cada operação, e o preço final resulta dessa medição e dos preços unitários do quadro.`,
      en: 'Areas are estimates; the worked area is measured at the end of each operation as stated, and the final price follows.',
    });
    cl2.push({
      id: 'preparacao',
      heading: `Obrigações ${A.de}`,
      text: `${A.O} indica os limites da machamba, retira previamente os troncos, as pedras e outros obstáculos, garante o acesso do tractor e informa ${P.o} de valas, poços, tubagens ou outros perigos existentes no terreno${v.combustivel === 'agricultor' ? `, e fornece o combustível necessário` : ''}.`,
      en: 'The farmer marks the boundaries, clears stumps and stones, ensures access and warns of hidden hazards.',
    });
    cl2.push({
      id: 'execucao',
      heading: 'Execução',
      text: numerar([
        `${P.O} executa os trabalhos com diligência e segundo as boas práticas, ${v.combustivel === 'prestador' ? 'suportando o combustível, o operador e a manutenção do equipamento' : 'suportando o operador e a manutenção do equipamento'}.`,
        `Se a chuva, o encharcamento do solo ou uma avaria impedirem o trabalho, as partes acordam nova data, sem penalização; se a avaria se prolongar, ${A.o} pode contratar outro prestador para a parte não executada, pagando apenas o trabalho feito.`,
        `${P.O} responde pelos danos causados por negligência do operador em culturas, cercas ou bens ${A.de} ou de vizinhos, mas não pelos danos causados por obstáculos ocultos de que não tenha sido avisado.`,
      ]),
      en: 'Diligent work with fuel and operator as stated; rain or breakdown leads to rescheduling without penalty, and prolonged breakdown lets the farmer hire another contractor; liability for negligent damage, not for undisclosed hidden obstacles.',
    });
    cl2.push({
      id: 'pagamento',
      heading: 'Pagamento',
      text: numerar([
        c.adiantamento != null ? `${A.O} paga ${valorTexto(c.adiantamento)} na assinatura do contrato, a título de adiantamento.` : '',
        v.saldoQuando === 'colheita' ? `O saldo, calculado segundo a medição final, é pago após a colheita, até ${dateLong(v.dataColheita)}.` : 'O saldo, calculado segundo a medição final, é pago na conclusão do trabalho.',
        `Os pagamentos são feitos ${modoPagamento(v, P)}, contra recibo.`,
      ]),
      en: `Advance${c.adiantamento != null ? ` of ${formatMoney(c.adiantamento)}` : ''} on signing; balance per final measurement ${v.saldoQuando === 'colheita' ? 'after harvest' : 'on completion'}, against receipt.`,
    });

    const blocks = contratoBlocks(ctx, {
      title: 'Contrato de prestação de serviços de mecanização agrícola',
      parties: [
        { p: 'prestador', role: P, en: 'Contractor' },
        { p: 'agricultor', role: A, en: 'Farmer' },
      ],
      clauses: [...cl, ...cl2],
      signatures: [assinatura(ctx, 'prestador', P, true), assinatura(ctx, 'agricultor', A)],
    });
    // Put the table right after the first clause.
    const at = blocks.findIndex((b) => b.type === 'numberedClauses');
    const nc = blocks[at] as Extract<Block, { type: 'numberedClauses' }>;
    return [...blocks.slice(0, at), { ...nc, items: nc.items.slice(0, 1) }, quadro, { ...nc, items: nc.items.slice(1), start: 2 }, ...blocks.slice(at + 1)];
  },
});
