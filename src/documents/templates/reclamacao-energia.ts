import type { Values } from '../model';
import { BLANK, formatMoney, lineItems, money, moneyText } from './_shared';
import { opt, serviceComplaint, str } from './_cidadao';

const valor = (v: Values) => (money(v.valorPedido) != null ? moneyText(v.valorPedido) : '');
const factura = (v: Values) => (str(v.numeroFactura) ? `da factura n.º ${str(v.numeroFactura)}` : str(v.periodo) ? `da factura de ${str(v.periodo)}` : 'da factura reclamada');

export default serviceComplaint({
  id: 'reclamacao-energia',
  servico: 'serviço de fornecimento de energia eléctrica',
  fornecedores: [
    opt('edm', 'Electricidade de Moçambique, E.P. (EDM)', 'Electricidade de Moçambique (EDM)'),
    opt('outro', 'Outro distribuidor ou concessionária', 'Another distributor'),
  ],
  fornecedorDefault: 'edm',
  contaLabel: ['N.º de cliente / contrato', 'Customer / contract no.'],
  contadorLabel: ['N.º do contador (Credelec)', 'Meter no. (prepaid)', 'Contador n.º'],
  regulador: 'Autoridade Reguladora de Energia (ARENE)',
  reguladorRef: 'cidEnergiaReclamacao',
  dica: [
    'Nos danos por oscilação de tensão, comunique a avaria logo que acontecer, guarde os aparelhos para vistoria e peça o número da ocorrência. Nas recargas Credelec não creditadas, junte o talão ou a mensagem com o código.',
    'For damage from voltage surges, report at once, keep the appliances for inspection and get a ticket number. For prepaid tokens not credited, attach the receipt or message.',
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
      value: 'interrupcao',
      pt: 'Falta de energia prolongada ou repetida',
      en: 'Long or repeated outages',
      assunto: 'Reclamação por interrupções do fornecimento',
      pedido: () => 'a reposição urgente do fornecimento com a qualidade devida, a informação sobre a causa das interrupções e as medidas tomadas para as evitar, e o crédito correspondente ao período sem fornecimento',
    },
    {
      value: 'danos',
      pt: 'Aparelhos danificados por oscilação de tensão',
      en: 'Appliances damaged by voltage surges',
      assunto: 'Reclamação e pedido de indemnização por danos em aparelhos eléctricos',
      danos: true,
      pedido: (v) => {
        const total = lineItems(v.danos).reduce((a, r) => a + (money(r.valor) ?? 0), 0);
        return `a realização de vistoria aos aparelhos danificados e a indemnização dos danos sofridos${total > 0 ? `, no valor total de ${formatMoney(total)}` : ''}, ou a sua reparação a cargo da empresa`;
      },
    },
    {
      value: 'credelec',
      pt: 'Recarga Credelec não creditada ou contador avariado',
      en: 'Prepaid token not credited or faulty meter',
      assunto: 'Reclamação — recarga não creditada / contador avariado',
      valor: ['Valor da recarga', 'Token amount'],
      pedido: (v) => `a verificação e, sendo caso disso, a substituição do contador, e o crédito da energia paga e não carregada${valor(v) ? `, no valor de ${valor(v)}` : ''}`,
    },
    {
      value: 'ligacao',
      pt: 'Atraso na ligação ou na mudança de contador já pagas',
      en: 'Delay in a paid connection or meter change',
      assunto: 'Reclamação por atraso na ligação',
      valor: ['Valor pago', 'Amount paid'],
      pedido: (v) => `a execução imediata da ligação já paga${valor(v) ? ` (${valor(v)})` : ''} ou, não sendo possível, a indicação de data certa e a restituição do valor pago se a ligação não for feita nessa data`,
    },
    { value: 'outro', pt: 'Outro motivo', en: 'Other', assunto: 'Reclamação', pedido: () => BLANK },
  ],
});
