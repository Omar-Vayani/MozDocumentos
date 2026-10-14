// Contrato de cessão de créditos: o credor (cedente) transmite a outra pessoa
// (cessionário) créditos sobre um terceiro (devedor cedido), com ou sem preço.

import { formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, formatMoney, l, lineItems, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, int, numerar, papel, partesBlocks, partyFields, partyName, partyWarnings, quantos,
  semPonto, str, testemunhasField, valorTexto,
} from './_contratos';

type Credito = { documento: string; data: string; vencimento: string; valor: number | null };
const creditos = (v: Values): Credito[] =>
  lineItems(v.creditos)
    .map((r) => ({ documento: str(r.documento), data: str(r.data), vencimento: str(r.vencimento), valor: money(r.valor) }))
    .filter((c) => c.documento || c.valor != null);

export default defineTemplate({
  id: 'contrato-cessao-creditos',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'cedente', title: l('Cedente (quem transmite o crédito)', 'Assignor'), personRole: 'outro' },
    { id: 'cessionario', title: l('Cessionário (quem recebe o crédito)', 'Assignee'), personRole: 'outro' },
    { id: 'devedor', title: l('Devedor cedido', 'Debtor'), personRole: 'cliente' },
    { id: 'creditos', title: l('Créditos cedidos', 'Assigned receivables') },
    { id: 'preco', title: l('Preço e garantias', 'Price and warranties') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('cedente', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('cessionario', { tipoDefault: 'empresa' }),
    { name: 'devedorNome', type: 'text', section: 'devedor', required: true, label: l('Nome ou denominação', 'Name'), personKey: 'nome' },
    { name: 'devedorNuit', type: 'text', section: 'devedor', width: 'half', label: l('NUIT', 'Tax number (NUIT)'), personKey: 'nuit' },
    { name: 'devedorMorada', type: 'text', section: 'devedor', width: 'half', label: l('Morada ou sede', 'Address'), personKey: 'morada' },
    {
      name: 'origem',
      type: 'text',
      section: 'creditos',
      required: true,
      label: l('Origem dos créditos', 'Origin of the receivables'),
      placeholder: l('Ex.: fornecimento de material de construção ao abrigo do contrato de 3 de Março de 2026', 'E.g. supply of building materials under the contract of 3 March 2026'),
    },
    {
      name: 'creditos',
      type: 'lines',
      section: 'creditos',
      label: l('Facturas ou documentos', 'Invoices or documents'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [
        { name: 'documento', type: 'text', label: l('Factura / documento n.º', 'Invoice / document no.') },
        { name: 'data', type: 'date', label: l('Data', 'Date') },
        { name: 'vencimento', type: 'date', label: l('Vencimento', 'Due date') },
        { name: 'valor', type: 'money', label: l('Valor em dívida', 'Amount owed') },
      ],
      default: [],
    },
    { name: 'parcial', type: 'toggle', section: 'creditos', label: l('Cessão parcial (só parte do valor)', 'Partial assignment') },
    { name: 'valorCedido', type: 'money', section: 'creditos', width: 'half', label: l('Valor cedido', 'Amount assigned'), showIf: (v) => Boolean(v.parcial) },
    {
      name: 'onerosa',
      type: 'radio',
      section: 'preco',
      label: l('A cessão é', 'The assignment is'),
      options: [
        { value: 'preco', label: l('Com preço', 'For a price') },
        { value: 'pagamento', label: l('Em pagamento de uma dívida do cedente ao cessionário', 'In payment of a debt owed to the assignee') },
        { value: 'gratuita', label: l('Gratuita', 'Free of charge') },
      ],
      default: 'preco',
    },
    { name: 'preco', type: 'money', section: 'preco', width: 'half', label: l('Preço da cessão', 'Price'), showIf: (v) => v.onerosa === 'preco' },
    { name: 'precoPago', type: 'radio', section: 'preco', width: 'half', label: l('Pagamento do preço', 'Payment'), options: [{ value: 'assinatura', label: l('Na assinatura', 'On signing') }, { value: 'prazo', label: l('Em prazo', 'Later') }], default: 'assinatura', showIf: (v) => v.onerosa === 'preco' },
    { name: 'precoPrazo', type: 'number', section: 'preco', width: 'half', min: 1, max: 365, default: 30, label: l('Pago em (dias)', 'Paid within (days)'), showIf: (v) => v.onerosa === 'preco' && v.precoPago === 'prazo' },
    { name: 'dividaExtinta', type: 'text', section: 'preco', label: l('Dívida do cedente que fica paga', 'Assignor’s debt settled'), showIf: (v) => v.onerosa === 'pagamento' },
    {
      name: 'solvencia',
      type: 'toggle',
      section: 'preco',
      label: l('O cedente garante também que o devedor vai pagar', 'The assignor also guarantees the debtor will pay'),
      help: l('Por regra, o cedente só garante que o crédito existe; com esta opção responde também se o devedor não pagar.', 'By default the assignor only warrants the debt exists; with this option it also answers if the debtor does not pay.'),
    },
    { name: 'notificacaoPor', type: 'radio', section: 'clausulas', label: l('Quem notifica o devedor', 'Who notifies the debtor'), options: [{ value: 'cedente', label: l('O cedente', 'The assignor') }, { value: 'cessionario', label: l('O cessionário', 'The assignee') }, { value: 'ambos', label: l('Ambos, em carta conjunta', 'Both, jointly') }], default: 'ambos' },
    { name: 'notificacaoPrazo', type: 'number', section: 'clausulas', width: 'half', min: 1, max: 60, default: 5, label: l('Prazo para notificar (dias)', 'Days to notify') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const cs = creditos(v);
    const total = cs.reduce((a, c) => a + (c.valor ?? 0), 0);
    return { total: cs.length ? total : null, cedido: v.parcial ? money(v.valorCedido) : cs.length ? total : null };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'cedente', 'cedente', 'assignor'), ...partyWarnings(v, 'cessionario', 'cessionário', 'assignee')];
    if (!str(v.devedorNome)) w.push({ level: 'error', field: 'devedorNome', message: l('Indique o devedor cedido.', 'Enter the debtor.') });
    if (c.cedido == null) w.push({ level: 'warning', field: 'creditos', message: l('Indique os créditos cedidos e o seu valor.', 'List the assigned receivables and amounts.') });
    w.push({
      level: 'warning',
      message: l(
        `A cessão só produz efeitos em relação ao devedor depois de lhe ser notificada ou de ele a aceitar; até lá, o devedor que paga ao cedente fica liberado (${cite('finCessaoCreditos')}). Use a notificação de cessão de créditos. Confirme também se o contrato de origem proíbe a cessão.`,
        'The assignment binds the debtor only once notified or accepted; until then, payment to the assignor discharges the debtor. Use the assignment notice. Check whether the original contract forbids assignment.',
      ),
    });
    return w;
  },

  personName: (v) => partyName(v, 'cessionario') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const E = papel(v, 'cedente', 'Cedente', 'Cedente');
    const S = papel(v, 'cessionario', 'Cessionário', 'Cessionária');
    const cs = creditos(v);
    const devedor = `**${str(v.devedorNome) || BLANK}**${str(v.devedorNuit) ? `, NUIT ${str(v.devedorNuit)}` : ''}${str(v.devedorMorada) ? `, com domicílio em ${semPonto(v.devedorMorada)}` : ''}`;
    const quem = v.notificacaoPor === 'cedente' ? E.o : v.notificacaoPor === 'cessionario' ? S.o : `${E.o} e ${S.o}, em carta conjunta,`;
    let contrapartida: string;
    switch (v.onerosa) {
      case 'gratuita':
        contrapartida = 'A cessão é feita a título gratuito.';
        break;
      case 'pagamento':
        contrapartida = `A cessão é feita em pagamento ${semPonto(v.dividaExtinta) ? `de ${semPonto(v.dividaExtinta).replace(/^(de|da|do)\s+/i, '')}` : `de dívida ${E.de} ${S.ao}`}, que se considera extinta na medida do valor efectivamente cobrado.`;
        break;
      default:
        contrapartida =
          v.precoPago === 'prazo'
            ? `O preço da cessão é de ${valorTexto(money(v.preco))}, a pagar ${S.pelo} no prazo de ${quantos(int(v.precoPrazo), 'dia', 'dias')} a contar desta data.`
            : `O preço da cessão é de ${valorTexto(money(v.preco))}, que ${E.o} declara ter recebido nesta data, dando quitação.`;
    }
    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: numerar([
          `Pelo presente contrato, ${E.o} cede ${S.ao} ${v.parcial ? `parte, no valor de ${valorTexto(money(v.valorCedido))}, d` : ''}os créditos de que é titular sobre ${devedor}, adiante designado por **Devedor**, provenientes de ${semPonto(v.origem) || BLANK}, identificados no quadro seguinte${c.total != null ? `, no valor total de ${valorTexto(c.total)}` : ''}.`,
          'A cessão abrange as garantias e outros acessórios dos créditos que não sejam inseparáveis da pessoa do cedente, bem como os juros vincendos.',
        ]),
        en: 'The assignor assigns to the assignee the receivables against the debtor listed below, with their security and accessories.',
      },
      { id: 'contrapartida', heading: 'Contrapartida', text: contrapartida, en: v.onerosa === 'gratuita' ? 'Free of charge.' : v.onerosa === 'pagamento' ? 'In payment of a debt owed to the assignee.' : 'Price of the assignment.' },
      {
        id: 'garantias',
        heading: 'Garantias do cedente',
        text: numerar([
          `${E.O} garante a existência e a exigibilidade dos créditos cedidos, que não foram pagos, cedidos, empenhados ou compensados, e que não existe convenção que proíba a sua cessão.`,
          v.solvencia
            ? `${E.O} garante ainda a solvência do Devedor, obrigando-se a pagar ${S.ao} o valor que este não pague no vencimento.`
            : `${E.O} não garante a solvência do Devedor.`,
        ]),
        en: `The assignor warrants that the receivables exist and are due${v.solvencia ? ' and guarantees the debtor will pay' : ', but not that the debtor will pay'}.`,
      },
      {
        id: 'notificacao',
        heading: 'Notificação do Devedor e cobrança',
        text: numerar([
          `A cessão é notificada ao Devedor por ${quem} no prazo de ${quantos(int(v.notificacaoPrazo), 'dia', 'dias')} a contar desta data.`,
          `${E.O} entrega ${S.ao} os documentos que comprovam os créditos e presta a colaboração necessária à sua cobrança.`,
          `Qualquer quantia que ${E.o} receba do Devedor por conta dos créditos cedidos é entregue ${S.ao} no prazo de ${quantos(int(v.notificacaoPrazo), 'dia', 'dias')}.`,
        ]),
        en: 'The debtor is notified within the period stated; the assignor hands over the documents and passes on any payment received.',
      },
      ...clausulasFinais(v, { lei: 'do Código Civil' }),
    ];
    const cols = [assinatura(ctx, 'cedente', E, true), assinatura(ctx, 'cessionario', S)];
    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de cessão de créditos' },
      ...partesBlocks(v, [
        { p: 'cedente', role: E, en: 'Assignor' },
        { p: 'cessionario', role: S, en: 'Assignee' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'É celebrado o presente contrato de cessão de créditos, que se rege pelas cláusulas seguintes:', en: 'This assignment agreement is entered into on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses.slice(0, 1) },
      {
        type: 'table',
        columns: [
          { label: 'Documento', width: 2 },
          { label: 'Data', width: 1.1 },
          { label: 'Vencimento', width: 1.1 },
          { label: 'Valor (MT)', width: 1.4, align: 'right' },
        ],
        rows: (cs.length ? cs : [{ documento: '', data: '', vencimento: '', valor: null }]).map((x) => [
          x.documento || BLANK,
          x.data ? formatDateShort(x.data) : '—',
          x.vencimento ? formatDateShort(x.vencimento) : '—',
          x.valor != null ? formatMoney(x.valor, false) : BLANK,
        ]),
        totals: cs.length > 1 ? [['Total', '', '', formatMoney(c.total, false)]] : undefined,
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses.slice(1), start: 2 },
      ...fecho(ctx, cols),
    ];
    return blocks;
  },
});
