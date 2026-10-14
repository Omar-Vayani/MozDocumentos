import type { Values } from '../model';
import { BLANK, dateLong, money, moneyText } from './_shared';
import { opt, serviceComplaint } from './_cidadao';

const valor = (v: Values) => (money(v.valorPedido) != null ? moneyText(v.valorPedido) : '');

export default serviceComplaint({
  id: 'reclamacao-telecomunicacoes',
  servico: 'serviço de telecomunicações',
  fornecedores: [
    opt('vodacom', 'Vodacom Moçambique, S.A.', 'Vodacom'),
    opt('tmcel', 'Moçambique Telecom, S.A. (Tmcel)', 'Tmcel'),
    opt('movitel', 'Movitel, S.A.', 'Movitel'),
    opt('tvcabo', 'TV Cabo Moçambique, S.A.', 'TV Cabo'),
    opt('outro', 'Outro operador (internet, televisão por subscrição)', 'Another operator'),
  ],
  fornecedorDefault: 'vodacom',
  contaLabel: ['N.º de cliente / conta', 'Customer / account no.'],
  contadorLabel: ['N.º de telefone ou de serviço', 'Phone or service no.', 'Serviço n.º'],
  regulador: 'Instituto Nacional das Comunicações de Moçambique (INCM)',
  reguladorRef: 'cidTelecomReclamacao',
  dica: [
    'Reclamações de carteira móvel (M-Pesa, e-Mola, mKesh) são de serviços financeiros: o regulador é o Banco de Moçambique. Para televisão por satélite, confirme o regulador competente.',
    'Mobile wallet complaints are financial services: the regulator is the Bank of Mozambique.',
  ],
  motivos: [
    {
      value: 'cobranca',
      pt: 'Cobrança indevida ou serviços não pedidos',
      en: 'Wrong charges or services not ordered',
      assunto: 'Reclamação de cobrança indevida',
      valor: ['Valor cobrado indevidamente', 'Amount wrongly charged'],
      pedido: (v) => `o cancelamento imediato dos serviços que não foram pedidos nem subscritos e a devolução ou o crédito dos valores cobrados indevidamente${valor(v) ? `, no total de ${valor(v)}` : ''}, com o envio do detalhe das cobranças do período`,
    },
    {
      value: 'falha',
      pt: 'Sem rede, internet lenta ou serviço interrompido',
      en: 'No network, slow internet or service down',
      assunto: 'Reclamação por falha do serviço',
      pedido: () => 'a reposição do serviço com a qualidade contratada e a redução do preço ou o crédito correspondente ao período em que o serviço não foi prestado nas condições contratadas',
    },
    {
      value: 'cancelamento',
      pt: 'Cancelamento ou portabilidade não processados',
      en: 'Cancellation or number porting not processed',
      assunto: 'Reclamação — pedido de cancelamento não processado',
      pedido: (v) => `o processamento imediato do pedido de cancelamento${v.dataOcorrencia ? ` apresentado em ${dateLong(v.dataOcorrencia)}` : ''}, a anulação das facturas emitidas depois dessa data e a confirmação escrita do fim do contrato`,
    },
    {
      value: 'equipamento',
      pt: 'Router, descodificador ou telemóvel avariado',
      en: 'Faulty router, decoder or phone',
      assunto: 'Reclamação — equipamento avariado',
      pedido: () => 'a reparação ou a substituição do equipamento, sem encargos, e a reposição do serviço entretanto interrompido',
    },
    {
      value: 'saldo',
      pt: 'Saldo, recarga ou pacote não creditado',
      en: 'Credit, top-up or bundle not received',
      assunto: 'Reclamação — recarga não creditada',
      valor: ['Valor da recarga', 'Top-up amount'],
      pedido: (v) => `o crédito da recarga ou do pacote pago e não activado${valor(v) ? `, no valor de ${valor(v)}` : ''}`,
    },
    { value: 'outro', pt: 'Outro motivo', en: 'Other', assunto: 'Reclamação', pedido: () => BLANK },
  ],
});
