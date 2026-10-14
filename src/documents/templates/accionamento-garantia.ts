import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, money, moneyText, splitLines } from './_shared';
import {
  anexosBlock,
  anexosField,
  autorFields,
  autorSignature,
  autorWarnings,
  daysBetween,
  endDot,
  envioBlock,
  envioField,
  lowerFirst,
  opt,
  prazoField,
  reciboBlock,
  reciboField,
  respostaParagraph,
  senderBlock,
  str,
} from './_cidadao';

const PEDIDOS = [
  opt('reparacao', 'Reparação gratuita', 'Free repair'),
  opt('substituicao', 'Substituição por um novo', 'Replacement'),
  opt('reducao', 'Redução do preço', 'Price reduction'),
  opt('resolucao', 'Devolução do produto e do dinheiro', 'Return and refund'),
];

/** Months between two ISO dates (rounded down), or null. */
function meses(a: unknown, b: unknown): number | null {
  const d = daysBetween(a, b);
  return d == null ? null : Math.floor(d / 30.44);
}

export default defineTemplate({
  id: 'accionamento-garantia',
  sections: [
    { id: 'autor', title: l('Cliente', 'Customer'), personRole: 'outro' },
    { id: 'vendedor', title: l('Loja ou vendedor', 'Shop or seller') },
    { id: 'produto', title: l('Produto', 'Product') },
    { id: 'defeito', title: l('Defeito e pedido', 'Defect and request') },
    { id: 'documento', title: l('Local, data e entrega', 'Place, date and delivery') },
  ],
  fields: [
    ...autorFields(['nome', 'genero', 'docTipo', 'docNumero', 'morada', 'telefone', 'email'], { required: ['nome'] }),
    { name: 'vendedor', type: 'text', section: 'vendedor', required: true, label: l('Loja ou vendedor', 'Shop or seller'), placeholder: l('Ex.: Electro Sol Comercial, Lda', 'E.g. the shop') },
    { name: 'vendedorMorada', type: 'text', section: 'vendedor', label: l('Endereço', 'Address') },
    { name: 'produto', type: 'text', section: 'produto', required: true, label: l('Produto', 'Product'), placeholder: l('Ex.: Frigorífico combinado', 'E.g. Fridge-freezer') },
    { name: 'marcaModelo', type: 'text', section: 'produto', width: 'half', label: l('Marca e modelo', 'Make and model') },
    { name: 'numeroSerie', type: 'text', section: 'produto', width: 'half', label: l('N.º de série', 'Serial no.') },
    { name: 'dataCompra', type: 'date', section: 'produto', width: 'half', required: true, label: l('Data da compra', 'Purchase date') },
    { name: 'factura', type: 'text', section: 'produto', width: 'half', label: l('Factura / recibo n.º', 'Invoice / receipt no.') },
    { name: 'preco', type: 'money', section: 'produto', width: 'half', label: l('Preço pago', 'Price paid') },
    { name: 'garantiaMeses', type: 'number', section: 'produto', width: 'half', min: 1, max: 240, label: l('Garantia do vendedor (meses)', 'Seller’s warranty (months)'), help: l('O que consta do certificado de garantia. Deixe vazio se não houver: aplica-se a garantia legal.', 'As stated on the warranty certificate. Leave empty if none: the legal warranty applies.') },
    { name: 'dataDefeito', type: 'date', section: 'defeito', width: 'half', label: l('Quando detectou o defeito', 'When you found the defect') },
    { name: 'defeito', type: 'textarea', section: 'defeito', required: true, rows: 4, label: l('Defeito', 'Defect'), help: l('O que deixou de funcionar e como. Um ponto por linha.', 'What stopped working and how. One point per line.') },
    { name: 'pedido', type: 'select', section: 'defeito', width: 'half', label: l('O que pede', 'What you ask for'), options: PEDIDOS, default: 'reparacao' },
    { name: 'entrega', type: 'toggle', section: 'defeito', default: false, label: l('Entrego o produto com esta carta', 'I hand over the product with this letter'), help: l('Peça que a loja escreva na sua cópia o estado do produto e a data da recepção.', 'Ask the shop to note the product’s condition and the date on your copy.') },
    prazoField('defeito', 15),
    anexosField('defeito', l('Ex.: Cópia da factura e do certificado de garantia', 'E.g. Copy of the invoice and warranty')),
    localField('documento'),
    dateField('data'),
    envioField('documento'),
    reciboField('documento'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx, { contacto: true });
    const legal = ctx.legal.value<{ movelMeses: number }>('consumidorGarantia').movelMeses;
    const def = ctx.legal.value<{ denunciaMovelDias: number }>('consumidorDefeito').denunciaMovelDias;
    const garantia = Math.max(legal, Number(v.garantiaMeses) > 0 ? Number(v.garantiaMeses) : 0);
    if (!str(v.vendedor)) w.push({ level: 'warning', field: 'vendedor', message: l('Indique a loja ou o vendedor.', 'State the shop or seller.') });
    if (!splitLines(v.defeito).length) w.push({ level: 'warning', field: 'defeito', message: l('Descreva o defeito.', 'Describe the defect.') });
    const m = meses(v.dataCompra, v.data);
    if (m != null && m >= garantia) {
      w.push({ level: 'warning', field: 'dataCompra', message: l(`A compra foi há ${m} meses: o prazo de garantia (${garantia} meses) parece ter terminado. Confirme as datas e o certificado.`, `The purchase was ${m} months ago: the ${garantia}-month warranty seems to have ended.`) });
    }
    if (Number(v.garantiaMeses) > 0 && Number(v.garantiaMeses) < legal) {
      w.push({ level: 'info', field: 'garantiaMeses', message: l(`A garantia legal dos bens móveis duradouros é de pelo menos ${legal} meses (${cite('consumidorGarantia')}); prevalece sobre um prazo menor no certificado.`, `The legal warranty for durable goods is at least ${legal} months and prevails over a shorter one.`) });
    }
    const d = daysBetween(v.dataDefeito, v.data);
    if (d != null && d > def) {
      w.push({ level: 'warning', field: 'dataDefeito', message: l(`O defeito deve ser denunciado ao vendedor no prazo de ${def} dias após ser detectado (${cite('consumidorDefeito')}). Passaram ${d} dias: envie a carta quanto antes.`, `The defect must be reported within ${def} days of discovery; ${d} days have passed.`) });
    }
    return w;
  },

  personName: (v) => v.vendedor,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const defeitos = splitLines(v.defeito);
    const legal = ctx.legal.value<{ movelMeses: number }>('consumidorGarantia').movelMeses;
    const sanar = ctx.legal.value<{ sanarDias: number }>('consumidorDefeito').sanarDias;
    const contrato = Number(v.garantiaMeses) > 0 ? Math.round(Number(v.garantiaMeses)) : 0;
    const prazoG = Math.max(legal, contrato);
    const produto = [
      str(v.produto) ? lowerFirst(str(v.produto)) : BLANK,
      str(v.marcaModelo) ? `, marca e modelo ${str(v.marcaModelo)}` : '',
      str(v.numeroSerie) ? `, n.º de série ${str(v.numeroSerie)}` : '',
    ].join('');

    let pedido: string;
    switch (v.pedido) {
      case 'substituicao':
        pedido = 'a substituição do produto por outro idêntico, novo, sem quaisquer encargos';
        break;
      case 'reducao':
        pedido = 'a redução adequada do preço, atendendo ao defeito';
        break;
      case 'resolucao':
        pedido = `a resolução da compra, com a devolução do produto e a restituição do preço pago${money(v.preco) != null ? ` (${moneyText(v.preco)})` : ''}`;
        break;
      default:
        pedido = 'a reparação do produto, sem quaisquer encargos com peças, mão-de-obra ou transporte';
    }

    const blocks: Block[] = [
      ...senderBlock(ctx),
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      ...envioBlock(v),
      { type: 'recipient', lines: [str(v.vendedor) || BLANK, str(v.vendedorMorada)].filter(Boolean) },
      { type: 'subject', text: `Denúncia de defeito e accionamento da garantia${str(v.factura) ? ` — factura n.º ${str(v.factura)}` : ''}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'compra',
        text: `Em ${dateLong(v.dataCompra)}, adquiri nesse estabelecimento o seguinte produto: ${produto.charAt(0).toUpperCase()}${produto.slice(1)}${money(v.preco) != null ? `, pelo preço de ${moneyText(v.preco)}` : ''}${str(v.factura) ? ` (factura/recibo n.º ${str(v.factura)})` : ''}. O produto está dentro do prazo de garantia${contrato > legal ? ` de ${contrato} meses dada pelo vendedor` : ''}.`,
        en: 'On the date stated I bought the product described from you; it is still under warranty.',
      },
      {
        type: 'paragraph',
        id: 'defeitoIntro',
        text: `${v.dataDefeito ? `Em ${dateLong(v.dataDefeito)}, o` : 'O'} produto apresentou ${defeitos.length > 1 ? 'os seguintes defeitos' : 'o seguinte defeito'}${defeitos.length === 1 ? `: ${endDot(lowerFirst(defeitos[0]))}` : ':'}`,
        en: 'The product showed the following defect(s):',
        keepWithNext: defeitos.length !== 1,
      },
    ];
    if (defeitos.length !== 1) blocks.push({ type: 'list', style: 'numeric', items: defeitos.length ? defeitos.map(endDot) : [BLANK] });
    blocks.push(
      {
        type: 'paragraph',
        id: 'pedido',
        text: `O defeito não resulta de mau uso nem de acidente. Assim, ao abrigo da garantia e da Lei de Defesa do Consumidor (${cite('consumidorGarantia')}), venho denunciar o defeito e solicitar ${pedido}.${v.pedido === 'reparacao' || !v.pedido ? ` Não sendo o defeito sanado no prazo de ${sanar} dias, reservo-me o direito de exigir a substituição do produto, a redução do preço ou a restituição da quantia paga, além da indemnização a que haja lugar.` : ''}`,
        en: `The defect is not due to misuse. Under the warranty and the Consumer Protection Law, I report it and request the remedy stated.`,
      },
      {
        type: 'paragraph',
        id: 'suspensao',
        text: `Recordo que o prazo de garantia${prazoG ? ` de ${prazoG} meses` : ''} se suspende enquanto estiver ${v.autorGenero === 'F' ? 'privada' : 'privado'} do produto por causa da reparação${v.entrega ? ', e entrego o produto com esta carta, pedindo que seja anotado na minha cópia o seu estado e a data de recepção' : ''}.`,
        en: 'The warranty period is suspended while I am without the product for repair.',
      },
      respostaParagraph(ctx),
      ...anexosBlock(v),
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', columns: [autorSignature(ctx, 'O Cliente', 'A Cliente')] },
      ...reciboBlock(v),
    );
    return blocks;
  },
});

