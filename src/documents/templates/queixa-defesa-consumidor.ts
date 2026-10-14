import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, money, moneyText, placeDate, splitLines } from './_shared';
import {
  anexosBlock,
  anexosField,
  autorFields,
  autorSignature,
  autorWarnings,
  endDot,
  envioBlock,
  envioField,
  lowerFirst,
  opt,
  pessoaDesc,
  reciboBlock,
  reciboField,
  str,
} from './_cidadao';

const MOTIVOS = [
  opt('preco', 'Preço diferente do afixado ou sem preço afixado', 'Price differs from the label or no price shown'),
  opt('validade', 'Produto fora do prazo de validade ou impróprio', 'Expired or unfit product'),
  opt('medida', 'Peso ou medida a menos', 'Short weight or measure'),
  opt('livro', 'Recusa do livro de reclamações', 'Refusal of the complaints book'),
  opt('factura', 'Recusa de passar factura ou recibo', 'Refusal to issue an invoice or receipt'),
  opt('garantia', 'Recusa de troca, reparação ou garantia', 'Refusal of exchange, repair or warranty'),
  opt('publicidade', 'Publicidade enganosa', 'Misleading advertising'),
  opt('outro', 'Outra prática', 'Other practice'),
];
const TEXTO: Record<string, string> = {
  preco: 'a cobrança de preço superior ao afixado (ou a falta de afixação de preços)',
  validade: 'a venda de produto fora do prazo de validade ou impróprio para consumo',
  medida: 'a venda com peso ou medida inferior ao indicado',
  livro: 'a recusa de facultar o livro de reclamações',
  factura: 'a recusa de emitir factura ou recibo',
  garantia: 'a recusa de cumprir a garantia, a troca ou a reparação de produto com defeito',
  publicidade: 'publicidade enganosa',
  outro: 'prática lesiva dos direitos do consumidor',
};
const motivo = (v: Values) => TEXTO[String(v.motivo)] ?? TEXTO.outro;

export default defineTemplate({
  id: 'queixa-defesa-consumidor',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'destinatario', title: l('Para onde envia', 'Where to send it') },
    { id: 'autor', title: l('Consumidor', 'Consumer'), personRole: 'outro' },
    { id: 'estabelecimento', title: l('Estabelecimento ou empresa', 'Shop or company') },
    { id: 'queixa', title: l('Queixa', 'Complaint') },
    { id: 'documento', title: l('Local, data e entrega', 'Place, date and delivery') },
  ],
  fields: [
    {
      name: 'entidade',
      type: 'text',
      section: 'destinatario',
      required: true,
      label: l('Destinatário', 'Addressee'),
      default: 'Inspector-Geral da Inspecção Nacional das Actividades Económicas (INAE)',
      help: l('Também pode enviar à Delegação Provincial da INAE ou pedir apoio a uma associação de defesa do consumidor.', 'You may also send it to the provincial INAE office or ask a consumer association for help.'),
    },
    { name: 'entidadeLocal', type: 'text', section: 'destinatario', width: 'half', label: l('Cidade', 'City'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    ...autorFields(['nome', 'genero', 'docTipo', 'docNumero', 'morada', 'telefone', 'email'], { required: ['nome'] }),
    { name: 'estabelecimento', type: 'text', section: 'estabelecimento', required: true, label: l('Nome do estabelecimento ou empresa', 'Name of the shop or company') },
    { name: 'estabelecimentoMorada', type: 'text', section: 'estabelecimento', label: l('Endereço', 'Address') },
    { name: 'estabelecimentoNuit', type: 'text', section: 'estabelecimento', width: 'half', label: l('NUIT (se constar do recibo)', 'Tax no. (if on the receipt)') },
    { name: 'motivo', type: 'select', section: 'queixa', required: true, label: l('Prática denunciada', 'Practice reported'), options: MOTIVOS, default: 'preco' },
    { name: 'dataFactos', type: 'date', section: 'queixa', width: 'half', label: l('Data', 'Date') },
    { name: 'valor', type: 'money', section: 'queixa', width: 'half', label: l('Valor pago (opcional)', 'Amount paid (optional)') },
    { name: 'factos', type: 'textarea', section: 'queixa', required: true, rows: 5, label: l('O que aconteceu', 'What happened'), help: l('Um facto por linha: o que comprou, o preço, o que lhe disseram, quem atendeu.', 'One fact per line: what you bought, the price, what you were told, who served you.') },
    { name: 'reclamouLivro', type: 'toggle', section: 'queixa', default: false, label: l('Já escrevi no livro de reclamações', 'I already wrote in the complaints book') },
    { name: 'pedidoOutro', type: 'textarea', section: 'queixa', rows: 2, label: l('Pedido adicional (opcional)', 'Additional request (optional)'), help: l('Ex.: «a restituição dos 850,00 MT cobrados a mais».', 'E.g. the refund of the overcharge.') },
    anexosField('queixa', l('Ex.: Talão de compra', 'E.g. Till receipt')),
    localField('documento'),
    dateField('data'),
    envioField('documento'),
    reciboField('documento'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx, { contacto: true, morada: true });
    if (!str(v.estabelecimento)) w.push({ level: 'warning', field: 'estabelecimento', message: l('Indique o estabelecimento.', 'State the shop or company.') });
    if (!splitLines(v.factos).length) w.push({ level: 'warning', field: 'factos', message: l('Descreva o que aconteceu.', 'Describe what happened.') });
    w.push({
      level: 'info',
      field: 'reclamouLivro',
      message: l(
        `Os fornecedores devem ter livro de reclamações (${cite('livroReclamacoes')}). Guarde o talão, fotografe o preço afixado ou o produto. A INAE fiscaliza e pode aplicar multas, mas a devolução do dinheiro pode exigir reclamação directa ou o tribunal (${cite('cidInaeQueixa')}).`,
        'Shops must keep a complaints book. Keep the receipt and photograph the label or product. The inspectorate can fine, but a refund may need a direct claim or court.',
      ),
    });
    return w;
  },

  personName: (v) => v.estabelecimento,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const factos = splitLines(v.factos);
    const extra = splitLines(v.pedidoOutro);
    const est = [str(v.estabelecimento) ? `**${str(v.estabelecimento)}**` : BLANK, str(v.estabelecimentoMorada) ? `sito em ${str(v.estabelecimentoMorada)}` : '', str(v.estabelecimentoNuit) ? `NUIT ${str(v.estabelecimentoNuit)}` : ''].filter(Boolean).join(', ');

    const blocks: Block[] = [
      ...envioBlock(v),
      { type: 'recipient', salutation: 'Exmo. Senhor', lines: [str(v.entidade) || BLANK, str(v.entidadeLocal).toUpperCase()].filter(Boolean) },
      { type: 'subject', text: `Queixa — ${str(v.estabelecimento) || BLANK}` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${pessoaDesc(v, 'autor', { contactos: true })}, na qualidade de consumidor${v.autorGenero === 'F' ? 'a' : ''}, vem apresentar a V. Ex.ª **queixa** contra o estabelecimento ${est}, por ${motivo(v)}${v.dataFactos ? `, em ${dateLong(v.dataFactos)}` : ''}, nos termos seguintes:`,
        en: 'The consumer files a complaint against the shop identified for the practice stated, as follows:',
        keepWithNext: true,
      },
      { type: 'list', style: 'numeric', items: [...(factos.length ? factos.map(endDot) : [BLANK, BLANK]), ...(v.reclamouLivro ? ['O consumidor registou reclamação no livro de reclamações do estabelecimento.'] : [])] },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Os factos violam os direitos do consumidor previstos na Lei de Defesa do Consumidor (${cite('cidInaeQueixa')}). Solicita-se a V. Ex.ª a fiscalização do estabelecimento, a aplicação das medidas e sanções previstas na lei${extra.length ? ` e ${extra.map((x) => lowerFirst(x.replace(/\.$/, ''))).join('; ')}` : ''}${money(v.valor) != null && !extra.length ? ` (valor pago: **${moneyText(v.valor)}**)` : ''}.`,
        en: 'The facts breach consumer rights; an inspection of the shop and the legal measures are requested.',
      },
      {
        type: 'paragraph',
        id: 'disponibilidade',
        text: `${v.autorGenero === 'F' ? 'A queixosa' : 'O queixoso'} declara que os factos são verdadeiros e está disponível para prestar declarações.`,
        en: 'The complainant declares the facts true and is available to give evidence.',
      },
      ...anexosBlock(v, 'Junta:'),
      { type: 'paragraph', id: 'fecho', text: 'Pede deferimento.', align: 'center', en: 'Requests approval.', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [autorSignature(ctx, 'O Queixoso', 'A Queixosa')] },
      ...reciboBlock(v),
    ];
    return blocks;
  },
});
