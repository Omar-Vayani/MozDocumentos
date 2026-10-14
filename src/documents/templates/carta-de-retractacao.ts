import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, money, moneyText } from './_shared';
import {
  anexosBlock,
  anexosField,
  autorFields,
  autorSignature,
  autorWarnings,
  envioBlock,
  envioField,
  lowerFirst,
  opt,
  reciboBlock,
  reciboField,
  senderBlock,
  str,
} from './_cidadao';

const MODOS = [
  opt('distancia', 'À distância (internet, telefone, redes sociais, catálogo)', 'At a distance (internet, phone, social media, catalogue)'),
  opt('domicilio', 'Fora da loja (em casa, no trabalho, na rua, numa feira ou reunião)', 'Away from the shop (home, work, street, fair, meeting)'),
];

/** Working days (Mon–Fri) after `from` up to and including `to`; holidays are not counted out. */
function diasUteis(from: unknown, to: unknown): number | null {
  const a = Date.parse(String(from ?? ''));
  const b = Date.parse(String(to ?? ''));
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  let n = 0;
  for (let t = a + 86_400_000; t <= b; t += 86_400_000) {
    const d = new Date(t).getUTCDay();
    if (d !== 0 && d !== 6) n++;
  }
  return n;
}

export default defineTemplate({
  id: 'carta-de-retractacao',
  sections: [
    { id: 'autor', title: l('Consumidor', 'Consumer'), personRole: 'outro' },
    { id: 'vendedor', title: l('Vendedor', 'Seller') },
    { id: 'contrato', title: l('Compra ou contrato', 'Purchase or contract') },
    { id: 'documento', title: l('Local, data e entrega', 'Place, date and delivery') },
  ],
  fields: [
    ...autorFields(['nome', 'genero', 'docTipo', 'docNumero', 'morada', 'telefone', 'email'], { required: ['nome'] }),
    { name: 'vendedor', type: 'text', section: 'vendedor', required: true, label: l('Vendedor ou prestador', 'Seller or provider') },
    { name: 'vendedorMorada', type: 'text', section: 'vendedor', label: l('Endereço ou email', 'Address or email') },
    { name: 'objecto', type: 'text', section: 'contrato', required: true, label: l('O que comprou ou contratou', 'What you bought or signed up for'), placeholder: l('Ex.: um conjunto de panelas, encomenda n.º 4471', 'E.g. a cookware set, order no. 4471') },
    { name: 'modo', type: 'select', section: 'contrato', label: l('Como foi celebrado', 'How it was made'), options: MODOS, default: 'distancia' },
    { name: 'dataContrato', type: 'date', section: 'contrato', width: 'half', label: l('Data da compra ou do contrato', 'Date of purchase or contract') },
    { name: 'dataRecepcao', type: 'date', section: 'contrato', width: 'half', label: l('Data em que recebeu o bem', 'Date the goods arrived'), help: l('Para serviços, deixe vazio: conta a data do contrato.', 'For services leave empty: the contract date counts.') },
    { name: 'valor', type: 'money', section: 'contrato', width: 'half', label: l('Valor pago', 'Amount paid') },
    { name: 'conta', type: 'text', section: 'contrato', label: l('Conta ou número para o reembolso', 'Account or number for the refund') },
    { name: 'devolucao', type: 'text', section: 'contrato', label: l('Como devolve o bem (opcional)', 'How you return the goods (optional)'), placeholder: l('Ex.: fica à disposição para recolha na minha morada', 'E.g. available for collection at my address') },
    anexosField('contrato', l('Ex.: Cópia da encomenda e do comprovativo de pagamento', 'E.g. Copy of the order and payment')),
    localField('documento'),
    dateField('data'),
    envioField('documento', 'registada'),
    reciboField('documento', false),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx, { contacto: true });
    const prazo = ctx.legal.value<{ diasUteis: number }>('consumidorRetractacao').diasUteis;
    if (!str(v.vendedor)) w.push({ level: 'warning', field: 'vendedor', message: l('Indique o vendedor.', 'State the seller.') });
    const inicio = v.dataRecepcao || v.dataContrato;
    const n = diasUteis(inicio, v.data);
    if (n != null && n > prazo) {
      w.push({ level: 'warning', field: 'dataRecepcao', message: l(`Passaram ${n} dias úteis desde ${v.dataRecepcao ? 'a recepção do bem' : 'o contrato'}: o prazo de retractação é de ${prazo} dias úteis (${cite('consumidorRetractacao')}). Fora do prazo, use a reclamação ou a garantia.`, `${n} working days have passed; the withdrawal period is ${prazo} working days.`) });
    } else {
      w.push({ level: 'info', field: 'data', message: l(`Pode desistir sem indicar motivo no prazo de ${prazo} dias úteis a contar da recepção do bem ou da celebração do contrato (${cite('consumidorRetractacao')}). Envie por carta registada ou email e guarde a prova. Feriados não são dias úteis.`, `You may withdraw without giving reasons within ${prazo} working days. Send it by registered post or email and keep proof.`) });
    }
    return w;
  },

  personName: (v) => v.vendedor,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const prazo = ctx.legal.value<{ diasUteis: number }>('consumidorRetractacao').diasUteis;
    const modo = v.modo === 'domicilio' ? 'fora do estabelecimento comercial' : 'à distância';
    const recebido = v.dataRecepcao ? `, recebido em ${dateLong(v.dataRecepcao)}` : '';
    const blocks: Block[] = [
      ...senderBlock(ctx),
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      ...envioBlock(v),
      { type: 'recipient', lines: [str(v.vendedor) || BLANK, str(v.vendedorMorada)].filter(Boolean) },
      { type: 'subject', text: 'Exercício do direito de retractação (livre resolução do contrato)' },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'retractacao',
        text: `Nos termos da Lei de Defesa do Consumidor (${cite('consumidorRetractacao')}), comunico que desisto do contrato celebrado ${modo}${v.dataContrato ? ` em ${dateLong(v.dataContrato)}` : ''}, relativo a ${lowerFirst(str(v.objecto).replace(/\.$/, '')) || BLANK}${recebido}, dentro do prazo de ${prazo} dias úteis previsto na lei.`,
        en: `Under the Consumer Protection Law, I withdraw from the contract made away from the shop or at a distance, within the ${prazo}-working-day period.`,
      },
      {
        type: 'paragraph',
        id: 'reembolso',
        text: `Solicito a restituição imediata das quantias pagas${money(v.valor) != null ? ` (**${moneyText(v.valor)}**)` : ''}${str(v.conta) ? `, para ${str(v.conta)}` : ', pelo mesmo meio utilizado no pagamento'}.${str(v.devolucao) ? ` O bem ${lowerFirst(str(v.devolucao).replace(/\.$/, ''))}.` : ' O bem será devolvido nas condições em que foi recebido, em local e data a combinar.'}`,
        en: 'I ask for an immediate refund; the goods will be returned as received.',
      },
      ...anexosBlock(v),
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', columns: [autorSignature(ctx, 'O Consumidor', 'A Consumidora')] },
      ...reciboBlock(v),
    ];
    return blocks;
  },
});
