// Interpelação por rendas em atraso: the landlord demands payment of overdue
// rent by a date, optionally with the legal compensation for late payment, and
// warns that otherwise an eviction action will be filed. Termination for
// non-payment is decided by the court, never by the landlord alone.

import { formatMonthYear, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, l, lineItems, localField, money } from './_shared';
import { partyName, partyWarnings, valorTexto } from './_contratos';
import {
  arrendamentoFields, assinaturaCarta, contratoTexto, destinatarioLinhas, papeisArrendamento, partyFieldsWhen, remetenteBlock, saudacaoParte, str,
} from './_familia';

export default defineTemplate({
  id: 'interpelacao-rendas-atraso',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Carta', 'Letter') },
    { id: 'senhorio', title: l('Senhorio (quem escreve)', 'Landlord (sender)'), personRole: 'senhorio' },
    { id: 'inquilino', title: l('Inquilino', 'Tenant'), personRole: 'inquilino' },
    { id: 'contrato', title: l('Contrato e imóvel', 'Lease and property') },
    { id: 'divida', title: l('Rendas em atraso', 'Overdue rent') },
    { id: 'pagamento', title: l('Prazo e pagamento', 'Deadline and payment') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data da carta', 'Date of the letter')),
    { name: 'telefone', type: 'tel', section: 'documento', width: 'half', label: l('Telefone do senhorio', 'Landlord’s phone'), default: (c) => c.profile?.telefones || '' },
    {
      name: 'envio',
      type: 'select',
      section: 'documento',
      width: 'half',
      label: l('Forma de envio', 'Delivery'),
      options: [
        { value: 'mao', label: l('Entregue em mão', 'By hand') },
        { value: 'registada', label: l('Carta registada com aviso de recepção', 'Registered mail with proof of delivery') },
      ],
      default: 'mao',
    },
    ...partyFieldsWhen('senhorio', ['pessoa', 'empresa']),
    ...partyFieldsWhen('inquilino', []),
    ...arrendamentoFields('contrato', { renda: true }),
    {
      name: 'rendas',
      type: 'lines',
      section: 'divida',
      required: true,
      label: l('Rendas em atraso', 'Overdue rents'),
      addLabel: l('Adicionar mês', 'Add month'),
      columns: [
        { name: 'mes', type: 'month', label: l('Mês', 'Month') },
        { name: 'valor', type: 'money', label: l('Valor em dívida (MT)', 'Amount due (MT)') },
      ],
      default: [{ mes: '', valor: '' }],
    },
    {
      name: 'indemnizacao',
      type: 'toggle',
      section: 'divida',
      label: l('Exigir também a indemnização legal por mora', 'Also claim the legal late-payment compensation'),
      help: l('A lei permite exigir uma indemnização sobre as rendas em atraso, salvo se pedir o despejo por falta de pagamento. Deixa de ser devida se o inquilino pagar nos primeiros dias da mora.', 'The law allows a compensation on overdue rent, unless you seek eviction for non-payment. It is not due if the tenant pays within the first days.'),
    },
    { name: 'prazoPagamento', type: 'date', section: 'pagamento', width: 'half', required: true, label: l('Pagar até', 'Pay by') },
    { name: 'formaPagamento', type: 'select', section: 'pagamento', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    { name: 'conta', type: 'text', section: 'pagamento', label: l('Conta ou número para pagamento', 'Account or number for payment'), placeholder: l('Ex.: NIB 0003 0000 1234 5678 9012 3 (BCI)', 'E.g. bank account or mobile wallet') },
    {
      name: 'despejo',
      type: 'toggle',
      section: 'pagamento',
      default: true,
      label: l('Avisar que, sem pagamento, recorrerá ao tribunal (acção de despejo)', 'Warn that, without payment, a court eviction action will follow'),
    },
  ],

  computed: (v, ctx) => {
    const rendas = lineItems(v.rendas).filter((r) => str(r.mes) || money(r.valor) != null);
    const total = roundMoney(rendas.reduce((s, r) => s + (money(r.valor) ?? 0), 0));
    const taxa = ctx.legal.value<{ indemnizacao: number }>('famMoraRenda').indemnizacao;
    const indemn = v.indemnizacao ? roundMoney(total * taxa) : 0;
    return { rendas, total, indemn, totalGeral: roundMoney(total + indemn) };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'senhorio', 'senhorio', 'landlord'), ...partyWarnings(v, 'inquilino', 'inquilino', 'tenant')];
    if (!c.total) w.push({ level: 'error', field: 'rendas', message: l('Indique as rendas em atraso e os valores.', 'Enter the overdue rents and amounts.') });
    if (!v.prazoPagamento) w.push({ level: 'warning', field: 'prazoPagamento', message: l('Indique a data-limite de pagamento.', 'Enter the payment deadline.') });
    w.push({
      level: 'warning',
      message: l(
        `O contrato só pode ser resolvido por falta de pagamento através de acção de despejo no tribunal (${cite('famDespejoJudicial')}). Não mude fechaduras, não retire bens do inquilino nem corte a água ou a energia: pode cometer um crime e ter de indemnizar.`,
        'The lease can only be ended for non-payment through a court eviction action. Do not change locks, remove the tenant’s belongings or cut utilities: it may be a crime and lead to damages.',
      ),
    });
    if (v.indemnizacao) {
      w.push({ level: 'info', field: 'indemnizacao', message: l(`Indemnização por mora (${cite('famMoraRenda')}; valor a confirmar). Se depois pedir o despejo por falta de pagamento, a indemnização deixa de ser devida.`, 'Late-payment compensation (to be confirmed). If you later seek eviction for non-payment, the compensation is no longer due.') });
    }
    return w;
  },

  personName: (v) => partyName(v, 'inquilino') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const { S, I } = papeisArrendamento(v);
    const forma = str(v.formaPagamento) || 'transferência bancária';
    const conta = str(v.conta);
    const modo = forma === 'numerário' ? 'em numerário, contra recibo' : `por ${forma}${conta ? ` para ${forma === 'transferência bancária' ? 'a conta' : 'o número'} ${conta}` : ''}`;
    const metade = ctx.legal.value<{ indemnizacao: number }>('famMoraRenda').indemnizacao;

    const blocks: Block[] = [
      ...remetenteBlock(ctx, 'senhorio', v.telefone),
      { type: 'tags', items: [v.envio === 'registada' ? 'CARTA REGISTADA COM AVISO DE RECEPÇÃO' : 'ENTREGUE EM MÃO'] },
      { type: 'reference', ref: undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', salutation: saudacaoParte(v, 'inquilino'), lines: destinatarioLinhas(v, 'inquilino') },
      { type: 'subject', text: 'Interpelação para pagamento de rendas em atraso' },
      { type: 'salutation', text: `${saudacaoParte(v, 'inquilino')},` },
      {
        type: 'paragraph',
        id: 'facto',
        text: `Na qualidade de ${S.n.toLowerCase()} e no âmbito ${contratoTexto(v, 'do')}${money(v.rendaMensal) != null ? `, com a renda mensal de ${valorTexto(money(v.rendaMensal))}` : ''}, verifico que V. Ex.ª não pagou, nas datas do seu vencimento, as seguintes rendas:`,
        en: 'As landlord under the lease above, I note that the following rents were not paid when due:',
      },
      {
        type: 'table',
        columns: [
          { label: 'Renda do mês', width: 4 },
          { label: 'Valor em dívida (MT)', width: 2, align: 'right' },
        ],
        rows: (c.rendas.length ? c.rendas : [{ mes: '', valor: '' }]).map((r: Record<string, unknown>) => [str(r.mes) ? formatMonthYear(`${str(r.mes)}-01`) : '', formatMoney(money(r.valor), false)]),
        totals: [
          ...(v.indemnizacao ? [['Indemnização por mora', formatMoney(c.indemn, false)]] : []),
          ['Total', formatMoney(c.totalGeral, false)],
        ],
      },
      {
        type: 'paragraph',
        id: 'interpelacao',
        text: `Assim, interpelo V. Ex.ª para pagar a quantia de ${valorTexto(c.totalGeral)}${v.indemnizacao ? `, que inclui a indemnização legal pela mora, correspondente a ${metade === 0.5 ? 'metade' : `${Math.round(metade * 100)} por cento`} das rendas em atraso (${cite('famMoraRenda')})` : ''}, até ${dateLong(v.prazoPagamento)}, ${modo}.`,
        en: `I therefore call on you to pay ${formatMoney(c.totalGeral)}${v.indemnizacao ? ', including the legal late-payment compensation' : ''} by ${v.prazoPagamento || '—'}, by ${forma}.`,
      },
    ];
    if (v.despejo) {
      blocks.push({
        type: 'paragraph',
        id: 'despejo',
        text: 'Na falta de pagamento no prazo indicado, recorrerei aos meios judiciais ao meu dispor, designadamente à acção de despejo com fundamento na falta de pagamento das rendas e à cobrança judicial das quantias em dívida e dos respectivos juros, com os inerentes encargos para V. Ex.ª.',
        en: 'If payment is not made by then, I will go to court, in particular with an eviction action for non-payment and a claim for the sums owed with interest, at your cost.',
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'contacto',
        text: `Estou disponível para analisar um plano de pagamento, desde que proposto por escrito antes da data indicada${str(v.telefone) ? `, podendo contactar-me pelo telefone ${str(v.telefone)}` : ''}.`,
        en: 'I am open to a written payment plan proposed before the deadline.',
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, editable: false },
      { type: 'signatures', columns: [assinaturaCarta(ctx, 'senhorio', S)] },
    );
    if (v.envio !== 'registada') blocks.push({ type: 'acknowledgement', text: 'Recebi o original desta carta em ___/___/______', signer: I.O });
    return blocks;
  },
});
