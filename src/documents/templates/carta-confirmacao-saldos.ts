// Pedido de confirmação de saldo (circularização): the audited company asks a
// customer, supplier or bank to confirm a balance directly to its auditor.
// Audit practice; no statutory form.

import { formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateLong, l, localField, money, moneyText, refField } from './_shared';
import { int, issuerName, issuerSignature, semPonto, str } from './_comercio';

export default defineTemplate({
  id: 'carta-confirmacao-saldos',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Carta', 'Letter') },
    { id: 'destinatario', title: l('Destinatário', 'Recipient') },
    { id: 'saldo', title: l('Saldo', 'Balance') },
    { id: 'auditor', title: l('Auditor', 'Auditor') },
  ],
  fields: [
    refField(),
    localField(),
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data da carta', 'Letter date'), default: (c) => c.today },
    {
      name: 'tipoTerceiro',
      type: 'select',
      section: 'destinatario',
      width: 'half',
      label: l('O destinatário é', 'The recipient is'),
      options: [
        { value: 'cliente', label: l('Cliente', 'Customer') },
        { value: 'fornecedor', label: l('Fornecedor', 'Supplier') },
        { value: 'banco', label: l('Banco ou instituição financeira', 'Bank') },
        { value: 'outro', label: l('Outro (credor, devedor, empresa do grupo)', 'Other') },
      ],
      default: 'cliente',
    },
    { name: 'destinatarioNome', type: 'text', section: 'destinatario', required: true, label: l('Nome ou firma', 'Name or company') },
    { name: 'destinatarioMorada', type: 'text', section: 'destinatario', label: l('Morada', 'Address') },
    { name: 'destinatarioAtencao', type: 'text', section: 'destinatario', width: 'half', label: l('Ao cuidado de (opcional)', 'Attention of (optional)') },
    { name: 'dataReferencia', type: 'date', section: 'saldo', width: 'half', required: true, label: l('Data do saldo', 'Balance date'), help: l('Normalmente o fim do exercício (31 de Dezembro).', 'Usually the year end.') },
    {
      name: 'forma',
      type: 'radio',
      section: 'saldo',
      label: l('Forma do pedido', 'Request type'),
      options: [
        { value: 'positiva', label: l('Indicar o nosso saldo e pedir confirmação', 'State our balance and ask for confirmation') },
        { value: 'branco', label: l('Pedir que indiquem o saldo (em branco)', 'Ask them to state the balance (blank)') },
      ],
      default: 'positiva',
    },
    { name: 'saldo', type: 'money', section: 'saldo', width: 'half', label: l('Saldo nos nossos registos', 'Balance in our records'), showIf: (v) => v.forma !== 'branco' },
    {
      name: 'saldoSentido',
      type: 'radio',
      section: 'saldo',
      width: 'half',
      label: l('O saldo é', 'The balance is'),
      options: [
        { value: 'nosso', label: l('A nosso favor (devem-nos)', 'In our favour (owed to us)') },
        { value: 'vosso', label: l('A favor do destinatário (devemos)', 'In their favour (we owe)') },
      ],
      default: 'nosso',
      showIf: (v) => v.forma !== 'branco',
    },
    { name: 'exercicioFim', type: 'date', section: 'auditor', width: 'half', label: l('Fim do exercício auditado', 'Audited year end') },
    { name: 'auditorNome', type: 'text', section: 'auditor', required: true, label: l('Auditor ou sociedade de auditoria', 'Auditor or audit firm') },
    { name: 'auditorMorada', type: 'text', section: 'auditor', label: l('Morada do auditor', 'Auditor’s address') },
    { name: 'auditorEmail', type: 'email', section: 'auditor', width: 'half', label: l('Email do auditor', 'Auditor’s email') },
    { name: 'prazoRespostaDias', type: 'number', section: 'auditor', width: 'half', min: 1, max: 60, default: 10, label: l('Prazo de resposta (dias)', 'Reply within (days)') },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.auditorNome)) w.push({ level: 'warning', field: 'auditorNome', message: l('Indique o auditor a quem a resposta é enviada.', 'Enter the auditor who receives the reply.') });
    if (v.forma !== 'branco' && money(v.saldo) == null) w.push({ level: 'warning', field: 'saldo', message: l('Indique o saldo ou escolha o pedido em branco.', 'Enter the balance or choose the blank request.') });
    w.push({ level: 'info', message: l('Entregue a carta ao auditor, que a envia e controla a resposta. O destinatário deve responder directamente ao auditor.', 'Give the letter to the auditor, who sends it and controls the reply. The recipient must reply directly to the auditor.') });
    return w;
  },

  personName: (v) => v.destinatarioNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const banco = v.tipoTerceiro === 'banco';
    const empresa = issuerName(ctx);
    const valor = money(v.saldo);
    const dRef = dateLong(v.dataReferencia);
    const prazo = int(v.prazoRespostaDias);
    const auditor = [semPonto(v.auditorMorada), str(v.auditorEmail)].filter(Boolean).join(', ') || BLANK;

    const blocks: Block[] = [
      { type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: 'Exmos. Senhores',
        lines: [str(v.destinatarioNome) || BLANK, semPonto(v.destinatarioMorada), str(v.destinatarioAtencao) ? `A/C ${str(v.destinatarioAtencao)}` : ''].filter(Boolean),
      },
      { type: 'subject', text: `Pedido de confirmação de saldo em ${dRef}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'cs-pedido',
        text: `Os nossos auditores, **${str(v.auditorNome) || BLANK}**, estão a proceder à auditoria das nossas demonstrações financeiras${v.exercicioFim ? ` do exercício findo em ${dateLong(v.exercicioFim)}` : ''}. Para esse efeito, solicitamos que V. Ex.ªs confirmem directamente aos nossos auditores ${banco ? 'os saldos das nossas contas e as demais responsabilidades' : 'o saldo da nossa conta'} nos V/ registos em ${dRef}.`,
        en: 'Our auditors are auditing our financial statements. Please confirm directly to them the balance of our account in your records at the date stated.',
      },
      v.forma === 'branco'
        ? {
            type: 'paragraph',
            id: 'cs-saldo',
            text: 'Agradecemos que indiquem no destacável abaixo o saldo constante dos V/ registos naquela data, com a discriminação dos documentos em aberto.',
            en: 'Please state in the slip below the balance in your records at that date, with the open items.',
          }
        : {
            type: 'paragraph',
            id: 'cs-saldo',
            text: `Segundo os nossos registos, o saldo ${v.saldoSentido === 'vosso' ? 'a V/ favor' : 'a nosso favor'} naquela data é de **${valor != null ? moneyText(valor) : `${BLANK} MT`}**.`,
            en: 'According to our records, the balance at that date is as stated.',
          },
    ];
    if (banco) {
      blocks.push({
        type: 'paragraph',
        id: 'cs-banco',
        text: 'Autorizamos V. Ex.ªs a prestar aos nossos auditores todas as informações sobre as contas, empréstimos, garantias, valores em custódia e outras responsabilidades em nosso nome naquela data.',
        en: 'We authorise you to give our auditors all information on our accounts, loans, guarantees and other liabilities at that date.',
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'cs-resposta',
        text: `Agradecemos que preencham e assinem a confirmação abaixo e a enviem directamente aos auditores (${auditor})${prazo ? `, no prazo de ${prazo} dias` : ''}. Este pedido não constitui um pedido de pagamento.`,
        en: 'Please complete, sign and send the confirmation directly to the auditor. This is not a request for payment.',
      },
      { type: 'paragraph', id: 'cs-fecho', text: 'Com os melhores cumprimentos,', en: 'Kind regards,', keepWithNext: true },
      { type: 'signatures', columns: [issuerSignature(ctx)] },
      {
        type: 'box',
        cut: true,
        label: `Confirmação a enviar ${str(v.auditorNome) ? `a ${str(v.auditorNome)}` : 'ao auditor'}`,
        text: `${str(v.destinatarioNome) || BLANK} declara que, em ${formatDateShort(v.dataReferencia)}, o saldo de ${empresa} nos seus registos é de ____________________ MT, a favor de ______________________.\n☐ Concordamos com o saldo indicado.\n☐ Não concordamos; a diferença explica-se como segue: _________________________\n\nNome e cargo: ______________________________________   Data: ___/___/______\nAssinatura e carimbo: ______________________________________`,
      },
    );
    return blocks;
  },
});
