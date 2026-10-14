// Pedido de encerramento de conta bancária (individual or company holder).

import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField } from './_shared';
import {
  anexosField, anexosList, assinaturaCliente, clienteFields, clienteWarnings, contaFields, contaTexto, deEntidade, entidadeFields,
  entidadeRecipient, eu, fechoCarta, isEmp, linhas, nomeCliente, reciboField, remetenteBlock, s, semPonto, sujeito,
} from './_financas';

export default defineTemplate({
  id: 'pedido-encerramento-conta',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'cliente', title: l('Titular da conta', 'Account holder'), personRole: 'outro' },
    { id: 'banco', title: l('Banco', 'Bank') },
    { id: 'pedido', title: l('Conta e saldo', 'Account and balance') },
  ],
  fields: [
    { name: 'ref', type: 'text', section: 'documento', width: 'half', label: l('Referência (opcional)', 'Reference (optional)'), default: (c) => (c.profile?.kind === 'empresa' ? c.nextRef : '') },
    localField(),
    dateField('data'),
    ...clienteFields('cliente', 'cliente'),
    ...entidadeFields('banco', 'banco', 'banco'),
    ...contaFields('pedido', { required: true }),
    {
      name: 'saldoDestino',
      type: 'radio',
      section: 'pedido',
      label: l('O que fazer ao saldo', 'What to do with the balance'),
      options: [
        { value: 'transferencia', label: l('Transferir para outra conta', 'Transfer to another account') },
        { value: 'numerario', label: l('Levantar no balcão', 'Withdraw at the branch') },
        { value: 'zero', label: l('A conta não tem saldo', 'The account has no balance') },
      ],
      default: 'transferencia',
    },
    { name: 'destinoBanco', type: 'text', section: 'pedido', width: 'half', label: l('Banco de destino', 'Destination bank'), showIf: (v) => v.saldoDestino === 'transferencia' },
    { name: 'destinoNib', type: 'text', section: 'pedido', width: 'half', label: l('NIB de destino', 'Destination NIB'), showIf: (v) => v.saldoDestino === 'transferencia' },
    { name: 'cancelarOrdens', type: 'toggle', section: 'pedido', default: true, label: l('Cancelar ordens permanentes e débitos directos', 'Cancel standing orders and direct debits') },
    { name: 'devolveCartoes', type: 'toggle', section: 'pedido', default: true, label: l('Devolvo os cartões associados à conta', 'I return the cards linked to the account') },
    { name: 'chequesNaoUsados', type: 'text', section: 'pedido', label: l('Cheques não utilizados que devolve (opcional)', 'Unused cheques returned (optional)'), placeholder: l('Ex.: n.º 0045012 a 0045025', 'E.g. no. 0045012 to 0045025') },
    { name: 'declaracaoEncerramento', type: 'toggle', section: 'pedido', default: true, label: l('Pedir declaração de encerramento e de inexistência de dívidas', 'Ask for a closure and no-debt statement') },
    { name: 'motivo', type: 'text', section: 'pedido', label: l('Motivo (opcional)', 'Reason (optional)'), help: l('Não é obrigatório indicar o motivo.', 'You do not have to give a reason.') },
    {
      name: 'cotitulares',
      type: 'textarea',
      section: 'pedido',
      rows: 2,
      label: l('Outros titulares que assinam (um por linha)', 'Other holders who sign (one per line)'),
      help: l('Numa conta conjunta, o encerramento é normalmente assinado por todos os titulares.', 'For a joint account, closure is usually signed by all holders.'),
    },
    anexosField('pedido'),
    reciboField('pedido'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'cliente')];
    if (!s(v.bancoNome)) w.push({ level: 'warning', field: 'bancoNome', message: l('Indique o banco.', 'Enter the bank.') });
    if (!s(v.contaNumero)) w.push({ level: 'warning', field: 'contaNumero', message: l('Indique o número da conta a encerrar.', 'Enter the account number.') });
    if (v.saldoDestino === 'transferencia' && !s(v.destinoNib)) w.push({ level: 'warning', field: 'destinoNib', message: l('Indique o NIB da conta para onde vai o saldo.', 'Enter the NIB for the balance.') });
    w.push({
      level: 'info',
      message: l(
        `O banco só encerra a conta depois de liquidados os créditos, descobertos e comissões associados, e pode pedir que assine no balcão com o documento de identificação. Peça a declaração de encerramento: prova que a conta deixou de gerar comissões (${cite('finConsumidorFinanceiro')}).`,
        'The bank closes the account only after any loans, overdrafts and fees are settled, and may ask you to sign at the branch with your ID. Ask for the closure statement: it proves the account no longer accrues fees.',
      ),
    });
    if (isEmp(v, 'cliente')) {
      w.push({ level: 'info', message: l('Numa empresa, a carta é assinada pelas pessoas com poderes para movimentar a conta (assinaturas autorizadas no banco).', 'For a company, the letter is signed by the authorised signatories of the account.') });
    }
    return w;
  },

  personName: (v) => nomeCliente(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'cliente';
    const banco = s(v.bancoNome);
    const conta = contaTexto(v);
    const blocks: Block[] = [
      ...remetenteBlock(ctx, P),
      { type: 'reference', ref: s(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
      entidadeRecipient(v, 'banco'),
      { type: 'subject', text: `Pedido de encerramento da conta n.º ${s(v.contaNumero) || BLANK}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${sujeito(v, P)}, titular da ${conta} ${deEntidade(banco, 'deste banco')}, ${eu(v, P, 'solicito', 'solicita')} o encerramento da referida conta${s(v.motivo) ? `, por ${lowerMotivo(v.motivo)}` : ''}.`,
        en: 'The account holder identified above asks the bank to close the account.',
      },
    ];
    const saldo =
      v.saldoDestino === 'numerario'
        ? `O saldo existente na data do encerramento será levantado em numerário no balcão, ${eu(v, P, 'contra a minha assinatura', 'contra a assinatura dos representantes da titular')}.`
        : v.saldoDestino === 'zero'
          ? 'A conta não tem saldo a transferir.'
          : `O saldo existente na data do encerramento, deduzido apenas dos encargos devidos, deve ser transferido para a conta com o NIB ${s(v.destinoNib) || BLANK}${s(v.destinoBanco) ? `, junto ${deEntidade(s(v.destinoBanco))}` : ''}, de que ${eu(v, P, 'sou titular', 'é titular')}.`;
    blocks.push({ type: 'paragraph', id: 'saldo', text: saldo, en: 'Instructions for the remaining balance.' });

    const extras: string[] = [];
    if (v.cancelarOrdens) extras.push('o cancelamento de todas as ordens permanentes, transferências programadas e débitos directos associados à conta');
    if (v.devolveCartoes) extras.push(`a desactivação dos cartões associados à conta, que ${eu(v, P, 'devolvo', 'devolve')} com esta carta`);
    if (s(v.chequesNaoUsados)) extras.push(`a anulação dos cheques não utilizados ${semPonto(v.chequesNaoUsados)}, que ${eu(v, P, 'devolvo', 'devolve')} inutilizados`);
    if (v.declaracaoEncerramento) extras.push(`a emissão de declaração que confirme o encerramento da conta e a inexistência de quaisquer responsabilidades ${eu(v, P, 'minhas', 'da titular')} perante o banco`);
    if (extras.length) {
      blocks.push({
        type: 'paragraph',
        id: 'extras',
        text: `${eu(v, P, 'Solicito', 'Solicita')} ainda ${extras.length > 1 ? `${extras.slice(0, -1).join('; ')}; e ${extras[extras.length - 1]}` : extras[0]}.`,
        en: 'Further requests: cancel standing orders, deactivate cards, cancel unused cheques and issue a closure statement.',
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'contacto',
      text: `Para qualquer esclarecimento, ${eu(v, P, 'estou', 'a titular está')} disponível através do telefone ${s(v.clienteTelefone) || BLANK}${s(v.clienteEmail) ? ` ou do email ${s(v.clienteEmail)}` : ''}.`,
      en: 'Contact details for any clarification.',
    });

    const cols: SignatureColumn[] = [assinaturaCliente(ctx, P, { m: 'O Titular', f: 'A Titular', empresa: s(v.clienteEmpresaNome) || 'A Titular' })];
    for (const nome of linhas(v.cotitulares).slice(0, 2)) cols.push({ role: 'Co-titular', name: nome });
    blocks.push(...fechoCarta(cols, { anexos: anexosList(v), recibo: Boolean(v.recibo) }));
    return blocks;
  },
});

function lowerMotivo(x: unknown): string {
  const t = semPonto(x).replace(/^(por|porque)\s+/i, '');
  return /^[A-ZÁÉÍÓÚ]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
}
