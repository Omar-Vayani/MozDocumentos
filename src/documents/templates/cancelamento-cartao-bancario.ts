// Comunicação de perda, roubo ou uso indevido de cartão bancário e pedido de
// cancelamento (bloqueio definitivo), com contestação dos movimentos posteriores.

import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { BLANK, cite, dateLong, l } from './_shared';
import {
  anexosField, anexosList, assinaturaCliente, cartaInicio, clienteF, clienteFields, clienteWarnings, contaFields, contaTexto, deEntidade, documentoFields, entidadeFields, eu,
  fechoCarta, movimentos, movimentosField, movimentosTable, nomeCliente, reciboField, s, semPonto, sujeito,
} from './_financas';

const MOTIVO_OPTIONS: FieldOption[] = [
  { value: 'perda', label: l('Perda / extravio', 'Lost') },
  { value: 'roubo', label: l('Roubo ou furto', 'Stolen') },
  { value: 'retido', label: l('Retido numa caixa automática (ATM)', 'Retained by an ATM') },
  { value: 'fraude', label: l('Suspeita de clonagem ou uso indevido', 'Suspected cloning or misuse') },
  { value: 'vontade', label: l('Já não quero o cartão', 'I no longer want the card') },
];

const MOTIVO_TEXTO: Record<string, string> = {
  perda: 'o extravio do cartão',
  roubo: 'o roubo do cartão',
  retido: 'a retenção do cartão numa caixa automática',
  fraude: 'a suspeita de que o cartão ou os seus dados foram copiados ou usados por terceiros',
};

const ASSUNTO: Record<string, string> = { perda: 'extravio', roubo: 'roubo', retido: 'retenção em caixa automática', fraude: 'uso indevido' };

export default defineTemplate({
  id: 'cancelamento-cartao-bancario',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'cliente', title: l('Titular do cartão', 'Cardholder'), personRole: 'outro' },
    { id: 'banco', title: l('Banco', 'Bank') },
    { id: 'cartao', title: l('Cartão e ocorrência', 'Card and incident') },
    { id: 'movimentos', title: l('Movimentos a contestar', 'Transactions to dispute') },
  ],
  fields: [
    ...documentoFields(),
    ...clienteFields('cliente', 'cliente'),
    ...entidadeFields('banco', 'banco', 'banco'),
    { name: 'cartaoTipo', type: 'radio', section: 'cartao', width: 'half', label: l('Tipo de cartão', 'Card type'), options: [{ value: 'débito', label: l('Débito', 'Debit') }, { value: 'crédito', label: l('Crédito', 'Credit') }, { value: 'pré-pago', label: l('Pré-pago', 'Prepaid') }], default: 'débito' },
    { name: 'cartaoDigitos', type: 'text', section: 'cartao', width: 'half', label: l('Últimos 4 dígitos do cartão', 'Last 4 digits of the card'), help: l('Nunca escreva o número completo, o PIN ou o código de segurança.', 'Never write the full number, the PIN or the security code.') },
    ...contaFields('cartao'),
    { name: 'motivo', type: 'select', section: 'cartao', required: true, label: l('Motivo', 'Reason'), options: MOTIVO_OPTIONS, default: 'perda' },
    { name: 'dataOcorrencia', type: 'date', section: 'cartao', width: 'half', label: l('Data em que deu pela falta / ocorrência', 'Date you noticed / incident'), showIf: (v) => v.motivo !== 'vontade' },
    { name: 'localOcorrencia', type: 'text', section: 'cartao', width: 'half', label: l('Local (opcional)', 'Place (optional)'), placeholder: l('Ex.: ATM do Shoprite da Matola', 'E.g. the ATM at …'), showIf: (v) => v.motivo !== 'vontade' },
    { name: 'bloqueioTelefone', type: 'toggle', section: 'cartao', default: true, label: l('Já pedi o bloqueio por telefone ou na aplicação', 'I already blocked it by phone or app'), showIf: (v) => v.motivo !== 'vontade' },
    { name: 'bloqueioData', type: 'text', section: 'cartao', width: 'half', label: l('Quando (data e hora)', 'When (date and time)'), placeholder: l('Ex.: 3 de Outubro de 2026, às 21h15', 'E.g. 3 October 2026, 21:15'), showIf: (v) => v.motivo !== 'vontade' && Boolean(v.bloqueioTelefone) },
    { name: 'bloqueioRef', type: 'text', section: 'cartao', width: 'half', label: l('N.º da ocorrência (opcional)', 'Incident no. (optional)'), showIf: (v) => v.motivo !== 'vontade' && Boolean(v.bloqueioTelefone) },
    { name: 'participacaoPolicial', type: 'text', section: 'cartao', label: l('Participação à polícia (esquadra e número, opcional)', 'Police report (station and number, optional)'), showIf: (v) => v.motivo === 'roubo' || v.motivo === 'fraude' },
    { name: 'novoCartao', type: 'toggle', section: 'cartao', default: true, label: l('Pedir a emissão de um novo cartão', 'Ask for a new card'), showIf: (v) => v.motivo !== 'vontade' },
    movimentosField('movimentos'),
    { name: 'reembolso', type: 'toggle', section: 'movimentos', default: true, label: l('Pedir o reembolso dos movimentos não autorizados', 'Ask for a refund of unauthorised transactions') },
    anexosField('movimentos'),
    reciboField('movimentos'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'cliente')];
    if (!s(v.bancoNome)) w.push({ level: 'warning', field: 'bancoNome', message: l('Indique o banco.', 'Enter the bank.') });
    if (v.motivo !== 'vontade') {
      w.push({
        level: 'warning',
        message: l(
          `Peça o bloqueio imediatamente pela linha de apoio do banco ou pela aplicação, a qualquer hora, e só depois entregue esta carta: até à comunicação, as operações podem ser da sua responsabilidade (${cite('finInstrumentosPagamento')}).`,
          'Block the card immediately through the bank’s helpline or app, at any time, and then deliver this letter: until you report it, transactions may be your responsibility.',
        ),
      });
    }
    if (/\d{12,}/.test(String(v.cartaoDigitos ?? '').replace(/\s/g, ''))) {
      w.push({ level: 'error', field: 'cartaoDigitos', message: l('Escreva apenas os últimos 4 dígitos do cartão.', 'Write only the last 4 digits.') });
    }
    if (v.motivo === 'roubo' && !s(v.participacaoPolicial)) {
      w.push({ level: 'info', field: 'participacaoPolicial', message: l('Em caso de roubo, participe à polícia e junte a cópia: o banco pede-a para analisar o reembolso.', 'For theft, report to the police and attach a copy: the bank asks for it.') });
    }
    return w;
  },

  personName: (v) => nomeCliente(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'cliente';
    const cartao = `cartão de ${s(v.cartaoTipo) || 'débito'}${s(v.cartaoDigitos) ? ` terminado em ${s(v.cartaoDigitos)}` : ''}`;
    const conta = s(v.contaNumero) ? `, associado à ${contaTexto(v)}` : '';
    const ms = movimentos(v);
    const vontade = v.motivo === 'vontade';
    const blocks: Block[] = [
      ...cartaInicio(ctx, P, 'banco', `${cartao.charAt(0).toUpperCase()}${cartao.slice(1)} — ${vontade ? 'pedido de cancelamento' : `comunicação de ${ASSUNTO[v.motivo] ?? 'ocorrência'} e pedido de cancelamento`}`),
    ];
    if (vontade) {
      blocks.push({
        type: 'paragraph',
        id: 'pedido',
        text: `${sujeito(v, P)}, titular do ${cartao}${conta} ${deEntidade(s(v.bancoNome), 'desse banco')}, ${eu(v, P, 'solicito', 'solicita')} o cancelamento do referido cartão, que ${eu(v, P, 'devolvo', 'devolve')} inutilizado com esta carta, e a cessação da cobrança de quaisquer anuidades ou comissões a ele associadas.`,
        en: 'The cardholder asks the bank to cancel the card, returned cut, and stop any related fees.',
      });
    } else {
      blocks.push({
        type: 'paragraph',
        id: 'comunicacao',
        text: `${sujeito(v, P)}, titular do ${cartao}${conta} ${deEntidade(s(v.bancoNome), 'desse banco')}, ${eu(v, P, 'comunico', 'comunica')} ${MOTIVO_TEXTO[v.motivo] ?? 'a ocorrência'}${v.dataOcorrencia ? `, verificado em ${dateLong(v.dataOcorrencia)}` : ''}${s(v.localOcorrencia) ? `, em ${semPonto(v.localOcorrencia)}` : ''}.`,
        en: 'The cardholder reports the loss, theft, retention or misuse of the card.',
      });
      const bloqueio = v.bloqueioTelefone
        ? `O bloqueio foi pedido através da linha de apoio ao cliente${s(v.bloqueioData) ? ` em ${semPonto(v.bloqueioData)}` : ''}${s(v.bloqueioRef) ? `, com a ocorrência n.º ${s(v.bloqueioRef)}` : ''}, o que ${eu(v, P, 'confirmo', 'confirma')} por escrito. `
        : '';
      const policia = s(v.participacaoPolicial) ? `O facto foi participado às autoridades policiais (${semPonto(v.participacaoPolicial)}), cuja cópia se junta. ` : '';
      blocks.push({
        type: 'paragraph',
        id: 'pedido',
        text: `${bloqueio}${policia}${eu(v, P, 'Solicito', 'Solicita')} o cancelamento definitivo do cartão${v.novoCartao ? ' e a emissão de um novo cartão, com novo código pessoal' : ''}.`,
        en: `Confirmation of the block${s(v.participacaoPolicial) ? ' and police report' : ''}; request to cancel the card${v.novoCartao ? ' and issue a new one' : ''}.`,
      });
    }
    if (ms.length) {
      blocks.push(
        {
          type: 'paragraph',
          id: 'movimentos',
          text: `${eu(v, P, 'Não reconheço nem autorizei', 'A titular não reconhece nem autorizou')} os seguintes movimentos, que ${eu(v, P, 'contesto', 'contesta')}:`,
          en: 'The cardholder did not authorise and disputes the following transactions:',
          keepWithNext: true,
        },
        movimentosTable(ms),
      );
    }
    const contacto = `podendo ser ${clienteF(v, P) ? 'contactada' : 'contactado'} através do telefone ${s(v.clienteTelefone) || BLANK}${s(v.clienteEmail) ? ` ou do email ${s(v.clienteEmail)}` : ''}`;
    blocks.push({
      type: 'paragraph',
      id: 'reembolso',
      text:
        ms.length && v.reembolso
          ? `${eu(v, P, 'Solicito', 'Solicita')} a análise destes movimentos e o crédito na conta dos valores debitados, com as comissões e encargos associados, e cópia dos comprovativos das operações, ${eu(v, P, 'ficando', 'ficando a titular')} a aguardar resposta escrita, ${contacto}.`
          : `${eu(v, P, 'Fico', 'A titular fica')} a aguardar a confirmação escrita do cancelamento, ${contacto}.`,
      en: ms.length && v.reembolso ? 'Request to investigate and refund the amounts with related fees and provide the records; contact details.' : 'Awaiting written confirmation; contact details.',
    });
    blocks.push(...fechoCarta([assinaturaCliente(ctx, P, { m: 'O Titular', f: 'A Titular', empresa: s(v.clienteEmpresaNome) || 'A Titular' })], { anexos: anexosList(v), recibo: Boolean(v.recibo) }));
    return blocks;
  },
});
