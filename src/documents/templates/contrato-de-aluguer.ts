// Contrato de aluguer de bens móveis entre particulares ou pequenas empresas:
// a vehicle, generator, tent, sound system or tools hired for a period, with
// price, deposit, use rules, insurance, damage and late return.

import { diffDays, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, l, lineItems, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, numerar, papel, partesBlocks, partyName, partyWarnings, quantos, testemunhasField, valorTexto,
} from './_contratos';
import { fechoJunto, partyFieldsWhen, semPonto, str } from './_familia';

const UNIDADES: Record<string, { s: string; p: string; f: boolean }> = {
  dia: { s: 'dia', p: 'dias', f: false },
  semana: { s: 'semana', p: 'semanas', f: true },
  mes: { s: 'mês', p: 'meses', f: false },
};

export default defineTemplate({
  id: 'contrato-de-aluguer',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'locador', title: l('Locador (dono do bem)', 'Owner'), personRole: 'outro' },
    { id: 'locatario', title: l('Locatário (quem aluga)', 'Hirer'), personRole: 'cliente' },
    { id: 'bens', title: l('Bens alugados', 'Items hired') },
    { id: 'periodo', title: l('Período e preço', 'Period and price') },
    { id: 'uso', title: l('Uso, seguro e danos', 'Use, insurance and damage') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFieldsWhen('locador', ['pessoa', 'empresa']),
    ...partyFieldsWhen('locatario', []),
    {
      name: 'bens',
      type: 'lines',
      section: 'bens',
      required: true,
      label: l('Bens', 'Items'),
      addLabel: l('Adicionar bem', 'Add item'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description'), placeholder: l('Ex.: gerador a gasóleo 20 kVA, marca Perkins', 'E.g. 20 kVA diesel generator') },
        { name: 'identificacao', type: 'text', label: l('N.º de série / matrícula', 'Serial no. / plate') },
        { name: 'quantidade', type: 'number', label: l('Quant.', 'Qty'), min: 1 },
        { name: 'valor', type: 'money', label: l('Valor do bem (MT)', 'Value (MT)') },
      ],
      default: [{ descricao: '', identificacao: '', quantidade: 1, valor: '' }],
    },
    { name: 'veiculo', type: 'toggle', section: 'bens', label: l('É uma viatura ou máquina com condutor', 'It is a vehicle or machine to be driven') },
    { name: 'condutores', type: 'text', section: 'bens', label: l('Condutores autorizados', 'Authorised drivers'), placeholder: l('Ex.: o Locatário e Pedro Cossa, carta de condução n.º 123456', 'E.g. the hirer and …, licence no. …'), showIf: (v) => Boolean(v.veiculo) },
    { name: 'finalidade', type: 'text', section: 'bens', label: l('Para que vai ser usado', 'Purpose'), placeholder: l('Ex.: fornecimento de energia na festa de casamento no Salão X', 'E.g. power supply for a wedding party') },
    { name: 'localUso', type: 'text', section: 'bens', width: 'half', label: l('Local de uso', 'Place of use'), placeholder: l('Ex.: Cidade da Matola', 'E.g. Matola') },
    { name: 'dataInicio', type: 'date', section: 'periodo', width: 'half', required: true, label: l('Início', 'Start'), default: (c) => c.today },
    { name: 'dataFim', type: 'date', section: 'periodo', width: 'half', required: true, label: l('Devolução até', 'Return by') },
    {
      name: 'unidade',
      type: 'select',
      section: 'periodo',
      width: 'half',
      label: l('Preço por', 'Price per'),
      options: [
        { value: 'dia', label: l('Dia', 'Day') },
        { value: 'semana', label: l('Semana', 'Week') },
        { value: 'mes', label: l('Mês', 'Month') },
      ],
      default: 'dia',
    },
    { name: 'precoUnitario', type: 'money', section: 'periodo', width: 'half', required: true, label: l('Preço por período', 'Price per period') },
    { name: 'periodos', type: 'number', section: 'periodo', width: 'half', min: 1, label: l('N.º de períodos', 'No. of periods'), help: l('Calculado pelas datas quando o preço é por dia.', 'Worked out from the dates when the price is per day.') },
    { name: 'formaPagamento', type: 'select', section: 'periodo', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'M-Pesa' },
    {
      name: 'pagamentoQuando',
      type: 'select',
      section: 'periodo',
      width: 'half',
      label: l('Pagamento', 'Payment'),
      options: [
        { value: 'adiantado', label: l('Na assinatura', 'On signing') },
        { value: 'devolucao', label: l('Na devolução', 'On return') },
        { value: 'mensal', label: l('Mensalmente, adiantado', 'Monthly in advance') },
      ],
      default: 'adiantado',
    },
    { name: 'caucaoValor', type: 'money', section: 'periodo', width: 'half', label: l('Caução (opcional)', 'Deposit (optional)') },
    { name: 'entregaLocal', type: 'text', section: 'uso', label: l('Local de entrega e devolução', 'Pick-up and return place') },
    { name: 'transporte', type: 'select', section: 'uso', width: 'half', label: l('Transporte e montagem', 'Transport and set-up'), options: [{ value: 'locatario', label: l('Por conta do locatário', 'Hirer') }, { value: 'locador', label: l('Por conta do locador', 'Owner') }], default: 'locatario' },
    { name: 'combustivel', type: 'text', section: 'uso', width: 'half', label: l('Combustível (opcional)', 'Fuel (optional)'), placeholder: l('Ex.: entregue e devolvido com depósito cheio', 'E.g. full to full') },
    { name: 'seguro', type: 'toggle', section: 'uso', label: l('O bem tem seguro do locador', 'The owner’s insurance covers the item') },
    { name: 'franquia', type: 'money', section: 'uso', width: 'half', label: l('Franquia a cargo do locatário', 'Excess paid by the hirer'), showIf: (v) => Boolean(v.seguro) },
    { name: 'multaAtraso', type: 'money', section: 'uso', width: 'half', label: l('Por cada dia de atraso na devolução', 'Per day of late return') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const bens = lineItems(v.bens).filter((r) => str(r.descricao));
    const dias = v.dataInicio && v.dataFim ? diffDays(v.dataInicio, v.dataFim) + 1 : null;
    const auto = v.unidade === 'dia' && dias && dias > 0 ? dias : null;
    const periodos = Number(v.periodos) > 0 ? Math.floor(Number(v.periodos)) : auto;
    const unit = money(v.precoUnitario);
    const total = unit != null && periodos ? roundMoney(unit * periodos) : null;
    return { bens, periodos, unit, total, dias };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'locador', 'locador', 'owner'), ...partyWarnings(v, 'locatario', 'locatário', 'hirer')];
    if (!c.bens.length) w.push({ level: 'error', field: 'bens', message: l('Descreva os bens alugados.', 'Describe the items hired.') });
    if (c.unit == null) w.push({ level: 'error', field: 'precoUnitario', message: l('Indique o preço.', 'Enter the price.') });
    if (c.dias != null && c.dias <= 0) w.push({ level: 'error', field: 'dataFim', message: l('A data de devolução é anterior ao início.', 'The return date is before the start.') });
    if (v.veiculo) w.push({ level: 'info', field: 'condutores', message: l('Confirme que a viatura tem seguro válido e que os condutores têm carta de condução. Para circular, o locatário deve levar este contrato e a declaração de autorização de uso da viatura.', 'Check the vehicle is insured and drivers are licensed. The hirer should carry this contract and the vehicle-use authorisation.') });
    w.push({ level: 'info', message: l(`Aluguer de bens móveis (${cite('famAluguer')}). Quem aluga bens como actividade regular precisa de licença e deve emitir factura.`, 'Hire of movable goods. Hiring out goods as a regular business needs a licence and invoices.') });
    return w;
  },

  personName: (v) => partyName(v, 'locatario') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const L = papel(v, 'locador', 'Locador', 'Locadora');
    const T = papel(v, 'locatario', 'Locatário', 'Locatária');
    const u = UNIDADES[v.unidade] ?? UNIDADES.dia;
    const caucao = money(v.caucaoValor);
    const forma = str(v.formaPagamento) || 'numerário';
    const quando = v.pagamentoQuando === 'devolucao' ? 'na data da devolução dos bens' : v.pagamentoQuando === 'mensal' ? 'mensalmente, até ao início de cada mês' : 'na data da assinatura do presente contrato';
    const multa = money(v.multaAtraso);
    const transporte = v.transporte === 'locador' ? L.de : T.de;

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `${L.O} dá de aluguer ${T.ao}, que aceita, os bens identificados no quadro anexo a este contrato, que dele faz parte integrante${str(v.finalidade) ? `, para ${semPonto(v.finalidade).replace(/^(para|a)\s+/i, '')}` : ''}${str(v.localUso) ? `, em ${semPonto(v.localUso)}` : ''}, não podendo ser usados para outro fim nem deslocados para outro local sem autorização ${L.de}.`,
        en: 'The owner hires out the items listed in the table to the hirer for the stated purpose and place only.',
      },
      {
        id: 'prazo',
        heading: 'Prazo',
        text: `O aluguer tem início em ${dateLong(v.dataInicio)} e os bens são devolvidos até ${dateLong(v.dataFim)}${str(v.entregaLocal) ? `, em ${semPonto(v.entregaLocal)}` : ''}, sendo o transporte${v.veiculo ? '' : ', a montagem e a desmontagem'} por conta ${transporte}.`,
        en: `From ${v.dataInicio || '—'} to ${v.dataFim || '—'}; transport by the ${v.transporte === 'locador' ? 'owner' : 'hirer'}.`,
      },
      {
        id: 'preco',
        heading: 'Preço',
        text: numerar([
          `O preço do aluguer é de ${valorTexto(c.unit)} por ${u.s}${c.periodos ? `, no total de ${valorTexto(c.total)} por ${quantos(c.periodos, u.s, u.p, u.f)}` : ''}, pago ${quando}, por ${forma}.`,
          caucao != null ? `${T.O} entrega nesta data a quantia de ${valorTexto(caucao)} a título de caução, restituída na devolução dos bens em bom estado, deduzida dos montantes devidos.` : '',
        ]),
        en: `Price ${c.unit != null ? formatMoney(c.unit) : '—'} per ${v.unidade || 'day'}${c.total != null ? `, total ${formatMoney(c.total)}` : ''}.${caucao != null ? ` Deposit ${formatMoney(caucao)}.` : ''}`,
      },
      {
        id: 'uso',
        heading: 'Uso e conservação',
        text: numerar([
          `${L.O} entrega os bens em bom estado de funcionamento, o que ${T.o} confirma ao recebê-los.`,
          `${T.O} usa os bens com prudência e de acordo com as instruções ${L.de}, não os podendo subalugar, emprestar ou ceder a terceiros.`,
          v.veiculo ? `Só podem conduzir ou operar os bens ${semPonto(v.condutores) || `${T.o}`}, devidamente ${v.veiculo ? 'habilitados' : 'preparados'}, sendo as multas e coimas durante o aluguer da responsabilidade ${T.de}.` : '',
          str(v.combustivel) ? `Combustível: ${semPonto(v.combustivel)}.` : '',
        ]),
        en: 'Items are delivered in working order. The hirer uses them carefully, per instructions, and may not sublet or lend them.',
      },
      {
        id: 'danos',
        heading: 'Avarias, danos e perda',
        text: numerar([
          `${T.O} comunica de imediato ${L.ao} qualquer avaria, acidente, furto ou perda, não podendo mandar reparar os bens sem autorização.`,
          v.seguro
            ? `Os bens estão cobertos por seguro contratado ${L.pelo}; em caso de sinistro, ${T.o} suporta a franquia de ${valorTexto(money(v.franquia))} e os danos não cobertos pelo seguro, salvo se não lhe forem imputáveis.`
            : `${T.O} responde pelos danos, perda ou furto dos bens durante o aluguer, salvo se resultarem do desgaste normal, de defeito dos próprios bens ou de causa que não lhe seja imputável, servindo de referência o valor indicado no quadro anexo.`,
        ]),
        en: 'Report breakdowns, accidents, theft or loss at once. The hirer answers for damage or loss not due to normal wear or defects.',
      },
      {
        id: 'devolucao',
        heading: 'Devolução',
        text: `${T.O} devolve os bens no fim do prazo, limpos e no estado em que os recebeu, salvo o desgaste normal${multa != null ? `, pagando ${L.ao}, por cada dia de atraso, a quantia de ${valorTexto(multa)}, sem prejuízo de indemnização por danos superiores` : ''}.`,
        en: `Return at the end in the condition received${multa != null ? `; late return costs ${formatMoney(multa)} per day` : ''}.`,
      },
      ...clausulasFinais(v),
    ];

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de aluguer' },
      ...partesBlocks(v, [
        { p: 'locador', role: L, en: 'Owner' },
        { p: 'locatario', role: T, en: 'Hirer' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'é celebrado o presente contrato de aluguer, que se rege pelas cláusulas seguintes:', en: 'this hire contract is entered into on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      { type: 'heading', text: 'Quadro anexo — Bens alugados', keepWithNext: true },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.5, align: 'center' },
          { label: 'Descrição', width: 3.6 },
          { label: 'N.º de série / matrícula', width: 2 },
          { label: 'Quant.', width: 0.8, align: 'center' },
          { label: 'Valor (MT)', width: 1.5, align: 'right' },
        ],
        rows: (c.bens.length ? c.bens : [{ descricao: BLANK }]).map((r: Record<string, unknown>, i: number) => [String(i + 1), str(r.descricao), str(r.identificacao), str(r.quantidade) || '1', formatMoney(money(r.valor), false)]),
        grid: true,
      },
      ...fechoJunto(fecho(ctx, [assinatura(ctx, 'locador', L, true), assinatura(ctx, 'locatario', T)])),
    ];
    return blocks;
  },
});
