// Contrato de depósito: one person leaves goods (furniture, a vehicle, stock,
// documents, valuables) in another's keeping, free or for a fee, to be returned
// on demand.

import { roundMoney } from '@/lib/format';
import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, l, lineItems, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, numerar, papel, partesBlocks, partyName, partyWarnings, testemunhasField, valorTexto,
} from './_contratos';
import { fechoJunto, partyFieldsWhen, semPonto, str } from './_familia';

export default defineTemplate({
  id: 'contrato-de-deposito',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'depositante', title: l('Depositante (dono dos bens)', 'Depositor (owner)'), personRole: 'outro' },
    { id: 'depositario', title: l('Depositário (quem guarda)', 'Keeper'), personRole: 'outro' },
    { id: 'bens', title: l('Bens depositados', 'Goods deposited') },
    { id: 'condicoes', title: l('Prazo e remuneração', 'Term and fee') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFieldsWhen('depositante', ['pessoa']),
    ...partyFieldsWhen('depositario', ['empresa']),
    {
      name: 'bens',
      type: 'lines',
      section: 'bens',
      required: true,
      label: l('Bens', 'Goods'),
      addLabel: l('Adicionar bem', 'Add item'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description'), placeholder: l('Ex.: viatura Toyota Hilux, matrícula AFJ 123 MC', 'E.g. Toyota Hilux, plate …') },
        { name: 'quantidade', type: 'number', label: l('Quant.', 'Qty'), min: 1 },
        { name: 'estado', type: 'text', label: l('Estado', 'Condition') },
        { name: 'valor', type: 'money', label: l('Valor declarado (MT)', 'Declared value (MT)') },
      ],
      default: [{ descricao: '', quantidade: 1, estado: 'bom', valor: '' }],
    },
    { name: 'localGuarda', type: 'text', section: 'bens', label: l('Local onde ficam guardados', 'Where they are kept'), placeholder: l('Ex.: armazém sito na Av. de Moçambique, km 9, Maputo', 'E.g. warehouse at …') },
    { name: 'dataEntrega', type: 'date', section: 'condicoes', width: 'half', label: l('Data de entrega dos bens', 'Date goods handed over'), default: (c) => c.today },
    { name: 'dataFim', type: 'date', section: 'condicoes', width: 'half', label: l('Até (opcional)', 'Until (optional)'), help: l('Vazio = sem prazo; o dono pode pedir os bens a qualquer momento.', 'Empty = no term; the owner may ask for them at any time.') },
    {
      name: 'remunerado',
      type: 'radio',
      section: 'condicoes',
      label: l('Remuneração', 'Fee'),
      options: [
        { value: 'gratuito', label: l('Gratuito', 'Free') },
        { value: 'oneroso', label: l('Com pagamento', 'Paid') },
      ],
      default: 'oneroso',
    },
    { name: 'valorMensal', type: 'money', section: 'condicoes', width: 'half', label: l('Valor mensal', 'Monthly fee'), showIf: (v) => v.remunerado === 'oneroso' },
    { name: 'formaPagamento', type: 'select', section: 'condicoes', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária', showIf: (v) => v.remunerado === 'oneroso' },
    { name: 'avisoRestituicao', type: 'number', section: 'condicoes', width: 'half', min: 0, max: 60, label: l('Aviso para levantar os bens (dias)', 'Notice to collect (days)'), help: l('Tempo para o depositário preparar a entrega. 0 = no próprio dia.', 'Time for the keeper to prepare the return. 0 = same day.') },
    { name: 'seguro', type: 'toggle', section: 'condicoes', label: l('O depositário faz seguro dos bens', 'The keeper insures the goods') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const bens = lineItems(v.bens).filter((r) => str(r.descricao));
    return { bens, totalValor: roundMoney(bens.reduce((s, r) => s + (money(r.valor) ?? 0), 0)) };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'depositante', 'depositante', 'depositor'), ...partyWarnings(v, 'depositario', 'depositário', 'keeper')];
    if (!c.bens.length) w.push({ level: 'error', field: 'bens', message: l('Descreva os bens depositados.', 'Describe the goods.') });
    if (v.remunerado === 'oneroso' && money(v.valorMensal) == null) w.push({ level: 'warning', field: 'valorMensal', message: l('Indique o valor do depósito.', 'Enter the fee.') });
    w.push({ level: 'info', message: l(`Depósito (${cite('famDeposito')}). Fotografe os bens na entrega e assinem o quadro. Quem guarda bens como actividade (parques, armazéns) deve ter licença e emitir factura.`, 'Photograph the goods on hand-over and sign the list. Businesses storing goods need a licence and must invoice.') });
    return w;
  },

  personName: (v) => partyName(v, 'depositante') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const D = papel(v, 'depositante', 'Depositante', 'Depositante');
    const G = papel(v, 'depositario', 'Depositário', 'Depositária');
    const aviso = Number(v.avisoRestituicao) || 0;
    const oneroso = v.remunerado === 'oneroso';

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `${D.O} entrega ${G.ao}, que os recebe em ${dateLong(v.dataEntrega)} para guardar e restituir, os bens identificados no quadro anexo${str(v.localGuarda) ? `, que ficam guardados em ${semPonto(v.localGuarda)}` : ''}${c.totalValor > 0 ? `, com o valor total declarado de ${valorTexto(c.totalValor)}` : ''}.`,
        en: 'The depositor hands the goods in the table to the keeper to keep and return.',
      },
      {
        id: 'prazo',
        heading: 'Prazo e restituição',
        text: numerar([
          str(v.dataFim) ? `O depósito dura até ${dateLong(v.dataFim)}.` : 'O depósito é feito sem prazo.',
          `${D.O} pode exigir a restituição dos bens a todo o tempo${aviso > 0 ? `, com aviso prévio de ${aviso === 1 ? 'um dia' : `${aviso} dias`}` : ''}, no local onde estão guardados, ainda que tenha sido fixado prazo a seu favor.`,
          `${G.O} restitui os bens no estado em que os recebeu, com os seus frutos, a ${D.o} ou a quem ${D.f ? 'esta' : 'este'} indicar por escrito.`,
        ]),
        en: `${v.dataFim ? `Until ${v.dataFim}. ` : 'No fixed term. '}The depositor may reclaim the goods at any time${aviso ? ` with ${aviso} days’ notice` : ''}; the keeper returns them as received.`,
      },
      {
        id: 'guarda',
        heading: 'Obrigações do depositário',
        text: numerar([
          `${G.O} guarda os bens com o cuidado de um bom pai de família, não os podendo usar, emprestar ou entregar em depósito a terceiro sem autorização escrita ${D.de}.`,
          `${G.O} avisa de imediato ${D.o} de qualquer perigo para os bens, ou se alguém reivindicar algum direito sobre eles.`,
          v.seguro ? `${G.O} mantém os bens seguros contra incêndio e furto pelo valor declarado.` : '',
          `${G.O} responde pela perda ou deterioração dos bens que resulte de culpa sua.`,
        ]),
        en: 'The keeper looks after the goods, does not use or pass them on, warns of any danger or claim, and answers for loss caused by their fault.',
      },
      {
        id: 'remuneracao',
        heading: 'Remuneração e despesas',
        text: oneroso
          ? `${D.O} paga ${G.ao} a quantia mensal de ${valorTexto(money(v.valorMensal))}, por ${str(v.formaPagamento) || 'transferência bancária'}, até ao dia cinco de cada mês, podendo ${G.o} reter os bens até ao pagamento do que lhe for devido.`
          : `O depósito é gratuito; ${D.o} reembolsa ${G.ao} as despesas necessárias que fizer com a guarda dos bens, mediante comprovativo.`,
        en: oneroso ? `Monthly fee ${formatMoney(money(v.valorMensal))}; the keeper may hold the goods until paid.` : 'Free deposit; necessary costs are reimbursed against receipts.',
      },
      ...clausulasFinais(v),
    ];

    return [
      { type: 'title', text: 'Contrato de depósito' },
      ...partesBlocks(v, [
        { p: 'depositante', role: D, en: 'Depositor' },
        { p: 'depositario', role: G, en: 'Keeper' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'é celebrado o presente contrato de depósito, que se rege pelas cláusulas seguintes:', en: 'this deposit contract is entered into on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      { type: 'heading', text: 'Quadro anexo — Bens depositados', keepWithNext: true },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.5, align: 'center' },
          { label: 'Descrição', width: 3.8 },
          { label: 'Quant.', width: 0.8, align: 'center' },
          { label: 'Estado', width: 1.2 },
          { label: 'Valor (MT)', width: 1.5, align: 'right' },
        ],
        rows: (c.bens.length ? c.bens : [{ descricao: BLANK }]).map((r: Record<string, unknown>, i: number) => [String(i + 1), str(r.descricao), str(r.quantidade) || '1', str(r.estado), money(r.valor) != null ? formatMoney(money(r.valor), false) : '']),
        grid: true,
      },
      ...fechoJunto(fecho(ctx, [assinatura(ctx, 'depositante', D, ctx.profile?.kind === 'pessoa'), assinatura(ctx, 'depositario', G, ctx.profile?.kind === 'empresa')])),
    ];
  },
});
