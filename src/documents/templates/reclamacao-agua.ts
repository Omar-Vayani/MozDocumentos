import type { Values } from '../model';
import { BLANK, money, moneyText } from './_shared';
import { opt, serviceComplaint, str } from './_cidadao';

const valor = (v: Values) => (money(v.valorPedido) != null ? moneyText(v.valorPedido) : '');
const factura = (v: Values) => (str(v.numeroFactura) ? `da factura n.º ${str(v.numeroFactura)}` : str(v.periodo) ? `da factura de ${str(v.periodo)}` : 'da factura reclamada');

export default serviceComplaint({
  id: 'reclamacao-agua',
  servico: 'serviço de abastecimento de água',
  fornecedores: [
    opt('adrm', 'Águas da Região de Maputo, S.A. (AdRM)', 'Águas da Região de Maputo (AdRM)'),
    opt('fipag', 'Fundo de Investimento e Património do Abastecimento de Água (FIPAG)', 'FIPAG'),
    opt('outro', 'Outro operador (sistema municipal, privado ou SAAS)', 'Another operator'),
  ],
  fornecedorDefault: 'adrm',
  contaLabel: ['N.º de cliente / contrato', 'Customer / contract no.'],
  contadorLabel: ['N.º do contador', 'Meter no.'],
  regulador: 'Autoridade Reguladora de Águas (AURA, IP)',
  reguladorRef: 'cidAguaReclamacao',
  dica: [
    'Numa factura muito alta, confirme primeiro se há fuga na sua canalização (feche todas as torneiras e veja se o contador continua a girar). A fuga antes do contador é da responsabilidade do operador.',
    'For a very high bill, first check for leaks on your side (close all taps and see if the meter still turns). A leak before the meter is the operator’s responsibility.',
  ],
  motivos: [
    {
      value: 'facturacao',
      pt: 'Factura muito elevada ou leitura estimada',
      en: 'Bill too high or estimated reading',
      assunto: 'Reclamação de facturação',
      pedido: (v) => `a leitura real do contador e a verificação do seu funcionamento, a revisão ${factura(v)} com base no consumo real e a devolução ou o crédito dos valores cobrados a mais, sem que seja feito qualquer corte do fornecimento enquanto a reclamação estiver pendente`,
    },
    {
      value: 'corte',
      pt: 'Corte indevido do fornecimento',
      en: 'Wrongful disconnection',
      assunto: 'Reclamação de corte indevido do fornecimento',
      valor: ['Prejuízos sofridos', 'Losses suffered'],
      pedido: (v) => `a religação imediata do fornecimento, sem custo de religação, e a indemnização dos prejuízos causados pelo corte${valor(v) ? `, no valor de ${valor(v)}` : ''}`,
    },
    {
      value: 'falta',
      pt: 'Falta de água ou pressão muito baixa',
      en: 'No water or very low pressure',
      assunto: 'Reclamação por falta de abastecimento de água',
      pedido: () => 'a reposição do abastecimento regular, a informação sobre a causa da falta e o horário previsto de fornecimento, e que não seja facturado o período sem água',
    },
    {
      value: 'qualidade',
      pt: 'Água turva, com cheiro ou imprópria',
      en: 'Dirty or unsafe water',
      assunto: 'Reclamação sobre a qualidade da água',
      pedido: () => 'a análise urgente da qualidade da água fornecida, a correcção da causa e a informação aos consumidores sobre se a água é própria para consumo',
    },
    {
      value: 'fuga',
      pt: 'Fuga na rede pública, no ramal ou antes do contador',
      en: 'Leak in the public network or before the meter',
      assunto: 'Reclamação — fuga na rede de abastecimento',
      pedido: (v) => `a reparação urgente da fuga, que se situa antes do contador e é da responsabilidade do operador, e a correcção ${factura(v)} e das seguintes que tenham sido afectadas`,
    },
    {
      value: 'ligacao',
      pt: 'Atraso na ligação já paga',
      en: 'Delay in a paid connection',
      assunto: 'Reclamação por atraso na ligação',
      valor: ['Valor pago', 'Amount paid'],
      pedido: (v) => `a execução imediata da ligação já paga${valor(v) ? ` (${valor(v)})` : ''} ou, não sendo possível, a indicação de data certa e a restituição do valor pago se a ligação não for feita nessa data`,
    },
    { value: 'outro', pt: 'Outro motivo', en: 'Other', assunto: 'Reclamação', pedido: () => BLANK },
  ],
});
