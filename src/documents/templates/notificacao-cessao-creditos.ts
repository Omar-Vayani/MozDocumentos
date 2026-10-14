// Notificação ao devedor da cessão de créditos (ou do penhor de créditos):
// a partir da recepção, o devedor só fica liberado pagando ao novo credor.

import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, money, moneyText } from './_shared';
import { entidadeRecipient, s, semPonto } from './_financas';

export default defineTemplate({
  id: 'notificacao-cessao-creditos',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'partes', title: l('Cedente e cessionário', 'Assignor and assignee') },
    { id: 'devedor', title: l('Devedor notificado', 'Debtor notified'), personRole: 'cliente' },
    { id: 'credito', title: l('Crédito e pagamento', 'Receivable and payment') },
  ],
  fields: [
    { name: 'ref', type: 'text', section: 'documento', width: 'half', label: l('Referência (opcional)', 'Reference (optional)'), default: (c) => c.nextRef },
    localField(),
    dateField('data'),
    {
      name: 'tipo',
      type: 'radio',
      section: 'partes',
      label: l('O que se notifica', 'What is notified'),
      options: [
        { value: 'cessao', label: l('Cessão de créditos', 'Assignment of receivables') },
        { value: 'penhor', label: l('Penhor de créditos', 'Pledge of receivables') },
      ],
      default: 'cessao',
    },
    { name: 'cedenteNome', type: 'text', section: 'partes', required: true, label: l('Cedente (credor original)', 'Assignor (original creditor)'), default: (c) => (c.profile?.kind === 'empresa' ? c.profile.firma ?? '' : c.profile?.nome ?? '') },
    { name: 'cedenteRep', type: 'text', section: 'partes', width: 'half', label: l('Quem assina pelo cedente', 'Signatory for the assignor'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'cedenteCargo', type: 'text', section: 'partes', width: 'half', label: l('Cargo', 'Position'), default: (c) => c.profile?.representanteCargo ?? '' },
    { name: 'cessionarioNome', type: 'text', section: 'partes', required: true, label: l('Cessionário (novo credor) / credor pignoratício', 'Assignee (new creditor) / pledgee') },
    { name: 'cessionarioNuit', type: 'text', section: 'partes', width: 'half', label: l('NUIT do cessionário', 'Assignee’s NUIT') },
    { name: 'cessionarioMorada', type: 'text', section: 'partes', width: 'half', label: l('Sede ou morada do cessionário', 'Assignee’s address') },
    { name: 'conjunta', type: 'toggle', section: 'partes', default: true, label: l('O cessionário também assina', 'The assignee also signs') },
    { name: 'cessionarioRep', type: 'text', section: 'partes', width: 'half', label: l('Quem assina pelo cessionário', 'Signatory for the assignee'), showIf: (v) => Boolean(v.conjunta) },
    { name: 'cessionarioCargo', type: 'text', section: 'partes', width: 'half', label: l('Cargo', 'Position'), showIf: (v) => Boolean(v.conjunta) },
    { name: 'devedorNome', type: 'text', section: 'devedor', required: true, label: l('Devedor', 'Debtor'), personKey: 'nome' },
    { name: 'devedorBalcao', type: 'text', section: 'devedor', width: 'half', label: l('À atenção de (opcional)', 'Attention of (optional)'), placeholder: l('Ex.: Direcção Financeira', 'E.g. Finance Department') },
    { name: 'devedorMorada', type: 'text', section: 'devedor', width: 'half', label: l('Morada', 'Address'), personKey: 'morada' },
    { name: 'contratoData', type: 'date', section: 'credito', width: 'half', label: l('Data do contrato de cessão', 'Date of the assignment agreement') },
    { name: 'creditoDescricao', type: 'textarea', section: 'credito', rows: 2, required: true, label: l('Créditos cedidos', 'Assigned receivables'), placeholder: l('Ex.: facturas n.º FT 2026/118, 2026/131 e 2026/140, relativas ao fornecimento de cimento', 'E.g. invoices no. …') },
    { name: 'valor', type: 'money', section: 'credito', width: 'half', label: l('Valor total', 'Total amount') },
    { name: 'nib', type: 'text', section: 'credito', width: 'half', label: l('NIB para pagamento ao novo credor', 'NIB for payment to the new creditor') },
    { name: 'bancoPagamento', type: 'text', section: 'credito', width: 'half', label: l('Banco', 'Bank') },
    { name: 'aceitacao', type: 'toggle', section: 'credito', default: true, label: l('Incluir declaração de tomada de conhecimento do devedor', 'Include the debtor’s acknowledgement') },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!s(v.cessionarioNome)) w.push({ level: 'warning', field: 'cessionarioNome', message: l('Indique o novo credor.', 'Enter the new creditor.') });
    if (!s(v.nib)) w.push({ level: 'warning', field: 'nib', message: l('Indique a conta para onde o devedor deve passar a pagar.', 'Enter the account for future payments.') });
    w.push({
      level: 'info',
      message: l(
        `Entregue a notificação contra recibo ou por carta registada com aviso de recepção: a cessão só produz efeitos em relação ao devedor a partir da notificação (${cite('finCessaoCreditos')}).`,
        'Deliver against receipt or by registered mail: the assignment binds the debtor only from notification.',
      ),
    });
    return w;
  },

  personName: (v) => s(v.devedorNome) || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const penhor = v.tipo === 'penhor';
    const cess = `**${s(v.cessionarioNome) || BLANK}**${s(v.cessionarioNuit) ? `, NUIT ${s(v.cessionarioNuit)}` : ''}${s(v.cessionarioMorada) ? `, com sede em ${semPonto(v.cessionarioMorada)}` : ''}`;
    const conta = `para a conta com o NIB ${s(v.nib) || BLANK}${s(v.bancoPagamento) ? `, no ${semPonto(v.bancoPagamento)}` : ''}, titulada ${penhor ? 'pelo credor pignoratício' : 'pelo cessionário'}`;
    const blocks: Block[] = [
      { type: 'reference', ref: s(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
      entidadeRecipient({ ...v, dvNome: v.devedorNome, dvBalcao: v.devedorBalcao, dvMorada: v.devedorMorada }, 'dv'),
      { type: 'subject', text: penhor ? 'Notificação de penhor de créditos' : 'Notificação de cessão de créditos' },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'notificacao',
        text: `Notificamos V. Ex.as de que, por contrato celebrado${v.contratoData ? ` em ${dateLong(v.contratoData)}` : ''}, **${s(v.cedenteNome) || BLANK}** ${penhor ? `constituiu, a favor de ${cess}, penhor sobre os créditos` : `cedeu a ${cess}, os créditos`} que detém sobre V. Ex.as, a seguir identificados: ${semPonto(v.creditoDescricao) || BLANK}${money(v.valor) != null ? `, no valor total de **${moneyText(v.valor)}**` : ''}.`,
        en: `We notify you that the receivables described have been ${penhor ? 'pledged' : 'assigned'} to the party named.`,
      },
      {
        type: 'paragraph',
        id: 'pagamento',
        text: `Em consequência, a partir da recepção da presente notificação, os pagamentos relativos aos referidos créditos devem ser feitos exclusivamente ${conta}, só sendo liberatórios os pagamentos assim efectuados.${penhor ? '' : ' Mantêm-se as demais condições de pagamento.'}`,
        en: 'From receipt of this notice, payments must be made only to the account stated; other payments do not discharge the debt.',
      },
      {
        type: 'paragraph',
        id: 'confirmacao',
        text: 'Agradecemos que confirmem a recepção desta notificação e o saldo em dívida, assinando e devolvendo a cópia junta.',
        en: 'Please confirm receipt and the balance owed by signing and returning the enclosed copy.',
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
    ];
    const cols: SignatureColumn[] = [{ role: penhor ? 'O Autor do penhor' : 'O Cedente', name: s(v.cedenteRep) || undefined, detail: [s(v.cedenteCargo), s(v.cedenteNome)].filter(Boolean).join(', ') || undefined, image: 'both' }];
    if (v.conjunta) cols.push({ role: penhor ? 'O Credor pignoratício' : 'O Cessionário', name: s(v.cessionarioRep) || undefined, detail: [s(v.cessionarioCargo), s(v.cessionarioNome)].filter(Boolean).join(', ') || undefined });
    blocks.push({ type: 'signatures', columns: cols });
    if (v.aceitacao) {
      blocks.push({
        type: 'box',
        label: 'Tomada de conhecimento do devedor',
        text: `${s(v.devedorNome) || BLANK} declara ter recebido esta notificação em ___/___/______ e reconhece dever, nesta data, a quantia de __________________ MT.\n\nAssinatura e carimbo: ______________________________`,
        dashed: true,
      });
    }
    return blocks;
  },
});
