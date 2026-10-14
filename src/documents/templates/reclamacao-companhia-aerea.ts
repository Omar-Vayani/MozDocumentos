import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, formatMoney, l, lineItems, localField, money, moneyText, splitLines } from './_shared';
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
  opt,
  prazoField,
  reciboBlock,
  reciboField,
  respostaParagraph,
  senderBlock,
  str,
} from './_cidadao';

const MOTIVOS = [
  opt('atraso', 'Atraso do voo', 'Flight delay'),
  opt('cancelamento', 'Cancelamento do voo', 'Flight cancellation'),
  opt('recusa', 'Recusa de embarque (overbooking)', 'Denied boarding (overbooking)'),
  opt('extraviada', 'Bagagem extraviada (não apareceu)', 'Lost baggage'),
  opt('atrasada', 'Bagagem entregue com atraso', 'Delayed baggage'),
  opt('danificada', 'Bagagem danificada ou com falta de objectos', 'Damaged or pilfered baggage'),
  opt('reembolso', 'Reembolso de bilhete não utilizado', 'Refund of an unused ticket'),
];
const ASSUNTO: Record<string, string> = {
  atraso: 'Reclamação por atraso do voo',
  cancelamento: 'Reclamação por cancelamento do voo',
  recusa: 'Reclamação por recusa de embarque',
  extraviada: 'Reclamação por extravio de bagagem',
  atrasada: 'Reclamação por atraso na entrega de bagagem',
  danificada: 'Reclamação por danos na bagagem',
  reembolso: 'Pedido de reembolso de bilhete',
};
const bagagem = (v: Values) => ['extraviada', 'atrasada', 'danificada'].includes(String(v.motivo));
const voo = (v: Values) => ['atraso', 'cancelamento', 'recusa'].includes(String(v.motivo));

export default defineTemplate({
  id: 'reclamacao-companhia-aerea',
  sections: [
    { id: 'autor', title: l('Passageiro', 'Passenger'), personRole: 'outro' },
    { id: 'companhia', title: l('Companhia aérea', 'Airline') },
    { id: 'voo', title: l('Voo e bilhete', 'Flight and ticket') },
    { id: 'reclamacao', title: l('Reclamação', 'Complaint') },
    { id: 'documento', title: l('Local, data e entrega', 'Place, date and delivery') },
  ],
  fields: [
    ...autorFields(['nome', 'genero', 'docTipo', 'docNumero', 'morada', 'telefone', 'email'], { required: ['nome'] }),
    { name: 'companhia', type: 'text', section: 'companhia', required: true, label: l('Companhia aérea', 'Airline'), placeholder: l('Ex.: LAM — Linhas Aéreas de Moçambique, S.A.', 'E.g. LAM Mozambique Airlines') },
    { name: 'companhiaDepartamento', type: 'text', section: 'companhia', label: l('Departamento (opcional)', 'Department (optional)'), default: 'Serviço de Apoio ao Cliente' },
    { name: 'companhiaMorada', type: 'text', section: 'companhia', label: l('Endereço ou email', 'Address or email') },
    { name: 'numeroVoo', type: 'text', section: 'voo', width: 'half', label: l('Voo n.º', 'Flight no.'), placeholder: l('Ex.: TM 112', 'E.g. TM 112') },
    { name: 'dataVoo', type: 'date', section: 'voo', width: 'half', label: l('Data do voo', 'Flight date') },
    { name: 'origem', type: 'text', section: 'voo', width: 'half', label: l('Origem', 'From') },
    { name: 'destino', type: 'text', section: 'voo', width: 'half', label: l('Destino', 'To') },
    { name: 'reserva', type: 'text', section: 'voo', width: 'half', label: l('Código da reserva', 'Booking reference') },
    { name: 'bilhete', type: 'text', section: 'voo', width: 'half', label: l('Bilhete n.º', 'Ticket no.') },
    { name: 'precoBilhete', type: 'money', section: 'voo', width: 'half', label: l('Preço do bilhete', 'Ticket price'), showIf: (v) => ['cancelamento', 'reembolso', 'recusa'].includes(String(v.motivo)) },
    { name: 'motivo', type: 'select', section: 'reclamacao', required: true, label: l('Motivo', 'Reason'), options: MOTIVOS, default: 'atraso' },
    { name: 'horasAtraso', type: 'number', section: 'reclamacao', width: 'half', min: 0, label: l('Horas de atraso à chegada', 'Hours late on arrival'), showIf: (v) => v.motivo === 'atraso' || v.motivo === 'cancelamento' },
    { name: 'pir', type: 'text', section: 'reclamacao', width: 'half', label: l('N.º do registo de bagagem (PIR)', 'Baggage report no. (PIR)'), showIf: bagagem },
    { name: 'dataEntrega', type: 'date', section: 'reclamacao', width: 'half', label: l('Data em que recebeu a bagagem', 'Date you received the bag'), showIf: (v) => v.motivo === 'atrasada' || v.motivo === 'danificada' },
    { name: 'factos', type: 'textarea', section: 'reclamacao', required: true, rows: 5, label: l('O que aconteceu', 'What happened'), help: l('Um facto por linha: horários, informações dadas no aeroporto, assistência (ou falta dela).', 'One fact per line: times, information given, assistance or lack of it.') },
    {
      name: 'despesas',
      type: 'lines',
      section: 'reclamacao',
      label: l('Despesas e danos', 'Expenses and losses'),
      addLabel: l('Adicionar despesa', 'Add expense'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description'), placeholder: l('Ex.: Hotel em Joanesburgo (1 noite)', 'E.g. Hotel (1 night)') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
      default: [],
    },
    { name: 'pedidoOutro', type: 'textarea', section: 'reclamacao', rows: 2, label: l('Outros pedidos (opcional)', 'Other requests (optional)') },
    prazoField('reclamacao', 30),
    anexosField('reclamacao', l('Ex.: Cartão de embarque e talão de bagagem', 'E.g. Boarding pass and bag tag')),
    localField('documento'),
    dateField('data'),
    envioField('documento', 'email'),
    reciboField('documento', false),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx, { contacto: true });
    if (!str(v.companhia)) w.push({ level: 'warning', field: 'companhia', message: l('Indique a companhia aérea.', 'State the airline.') });
    if (!str(v.numeroVoo) && !str(v.reserva)) w.push({ level: 'warning', field: 'numeroVoo', message: l('Indique o voo ou o código da reserva.', 'Give the flight or booking reference.') });
    const p = ctx.legal.value<{ danoDias: number; atrasoDias: number; accaoAnos: number }>('cidAviacaoReclamacao');
    if (bagagem(v) && !str(v.pir)) w.push({ level: 'warning', field: 'pir', message: l('Peça no aeroporto o registo de irregularidade de bagagem (PIR) antes de sair da sala de recolha e indique o número.', 'Get the Property Irregularity Report (PIR) at the airport and give its number.') });
    if (v.motivo === 'danificada' || v.motivo === 'atrasada') {
      const limite = v.motivo === 'danificada' ? p.danoDias : p.atrasoDias;
      const dias = daysBetween(v.dataEntrega, v.data);
      if (dias != null && dias > limite) {
        w.push({ level: 'warning', field: 'dataEntrega', message: l(`Nos voos internacionais, a reclamação escrita deve ser feita até ${limite} dias após a entrega da bagagem (${cite('cidAviacaoReclamacao')}). Já passaram ${dias} dias.`, `On international flights the written complaint is due within ${limite} days of delivery; ${dias} days have passed.`) });
      } else {
        w.push({ level: 'info', field: 'dataEntrega', message: l(`Nos voos internacionais: bagagem danificada, reclamação escrita até ${p.danoDias} dias após a recepção; bagagem atrasada, até ${p.atrasoDias} dias após a data em que devia ser entregue (${cite('cidAviacaoReclamacao')}).`, `International flights: damaged baggage within ${p.danoDias} days; delayed baggage within ${p.atrasoDias} days.`) });
      }
    }
    w.push({ level: 'info', field: 'despesas', message: l(`Guarde os recibos de todas as despesas. A acção em tribunal contra a transportadora caduca ao fim de ${p.accaoAnos} anos.`, `Keep all receipts. Court action against the carrier lapses after ${p.accaoAnos} years.`) });
    return w;
  },

  personName: (v) => v.companhia,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const factos = splitLines(v.factos);
    const extra = splitLines(v.pedidoOutro);
    const despesas = lineItems(v.despesas).filter((r) => str(r.descricao));
    const total = despesas.reduce((a, r) => a + (money(r.valor) ?? 0), 0);
    const totalTxt = total > 0 ? formatMoney(total) : '';
    const bilhete = money(v.precoBilhete) != null ? ` (${moneyText(v.precoBilhete)})` : '';
    const horas = Number(v.horasAtraso) > 0 ? Math.round(Number(v.horasAtraso)) : 0;

    const dados = [
      { label: 'Voo', value: [str(v.numeroVoo), v.dataVoo ? dateLong(v.dataVoo) : ''].filter(Boolean).join(', ') },
      { label: 'Percurso', value: [str(v.origem), str(v.destino)].filter(Boolean).join(' — ') },
      { label: 'Reserva', value: str(v.reserva) },
      { label: 'Bilhete n.º', value: str(v.bilhete) },
      { label: 'PIR n.º', value: bagagem(v) ? str(v.pir) : '' },
    ].filter((d) => d.value);

    let pedido: string;
    switch (v.motivo) {
      case 'cancelamento':
        pedido = `o reembolso integral do bilhete não utilizado${bilhete}${totalTxt ? ` e das despesas suportadas em consequência do cancelamento, no valor de ${totalTxt}` : ''}, bem como a compensação pelos prejuízos sofridos`;
        break;
      case 'recusa':
        pedido = `a compensação devida pela recusa de embarque${totalTxt ? ` e o reembolso das despesas suportadas, no valor de ${totalTxt}` : ''}`;
        break;
      case 'extraviada':
        pedido = `a localização e a entrega imediata da bagagem ou, não sendo encontrada, a indemnização pelo seu valor e conteúdo${totalTxt ? `, que estimo em ${totalTxt}` : ''}`;
        break;
      case 'atrasada':
        pedido = `o reembolso das despesas com artigos de primeira necessidade adquiridos durante o atraso da bagagem${totalTxt ? `, no valor de ${totalTxt}` : ''}`;
        break;
      case 'danificada':
        pedido = `a reparação da bagagem ou a indemnização dos danos e dos objectos em falta${totalTxt ? `, no valor de ${totalTxt}` : ''}`;
        break;
      case 'reembolso':
        pedido = `o reembolso do bilhete${str(v.bilhete) ? ` n.º ${str(v.bilhete)}` : ''} não utilizado${bilhete}, nos termos da tarifa aplicável`;
        break;
      default:
        pedido = `o reembolso das despesas suportadas em consequência do atraso${totalTxt ? `, no valor de ${totalTxt}` : ''} e a compensação pelos prejuízos sofridos`;
    }
    const pedidos = [pedido, ...extra];

    const blocks: Block[] = [
      ...senderBlock(ctx),
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      ...envioBlock(v),
      { type: 'recipient', lines: [str(v.companhia) || BLANK, str(v.companhiaDepartamento) ? `A/C: ${str(v.companhiaDepartamento)}` : '', str(v.companhiaMorada)].filter(Boolean) },
      { type: 'subject', text: `${ASSUNTO[String(v.motivo)] ?? ASSUNTO.atraso}${str(v.numeroVoo) ? ` — voo ${str(v.numeroVoo)}` : ''}${v.dataVoo ? ` de ${dateLong(v.dataVoo)}` : ''}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      { type: 'paragraph', id: 'abertura', text: `Na qualidade de passageir${v.autorGenero === 'F' ? 'a' : 'o'} de V. Ex.as, apresento a seguinte reclamação, relativa à viagem abaixo identificada.`, en: 'As your passenger, I submit the following complaint about the journey identified below.' },
    ];
    if (dados.length) blocks.push({ type: 'keyValue', columns: 2, items: dados });
    blocks.push(
      { type: 'paragraph', id: 'factosIntro', text: voo(v) && horas ? `O voo chegou ao destino com ${horas} ${horas === 1 ? 'hora' : 'horas'} de atraso. Os factos são os seguintes:` : 'Os factos são os seguintes:', en: 'The facts are as follows:', keepWithNext: true },
      { type: 'list', style: 'numeric', items: factos.length ? factos.map(endDot) : [BLANK, BLANK] },
    );
    if (despesas.length) {
      blocks.push(
        { type: 'paragraph', id: 'despesasIntro', text: `Em consequência, suportei as seguintes despesas e danos${total > 0 ? `, no total de **${formatMoney(total)}**` : ''}:`, en: 'As a result I incurred the following expenses and losses:', keepWithNext: true },
        { type: 'list', style: 'bullet', items: despesas.map((r) => `${str(r.descricao)}${money(r.valor) != null ? ` — ${formatMoney(money(r.valor)!)}` : ''}`) },
      );
    }
    blocks.push({
      type: 'paragraph',
      id: 'pedido',
      text:
        pedidos.length > 1
          ? `Face ao exposto, e ao abrigo das regras do transporte aéreo de passageiros, incluindo, nos voos internacionais, a ${cite('cidAviacaoReclamacao')}, solicito:`
          : `Face ao exposto, e ao abrigo das regras do transporte aéreo de passageiros, incluindo, nos voos internacionais, a ${cite('cidAviacaoReclamacao')}, solicito ${endDot(pedidos[0])}`,
      en: 'Therefore, under the rules on air passenger transport, including the Montreal Convention for international flights, I request what is stated.',
      keepWithNext: pedidos.length > 1,
    });
    if (pedidos.length > 1) blocks.push({ type: 'list', style: 'alpha', items: pedidos.map((p) => endDot(p.charAt(0).toUpperCase() + p.slice(1))) });
    blocks.push(
      respostaParagraph(ctx),
      ...anexosBlock(v),
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', columns: [autorSignature(ctx, 'O Passageiro', 'A Passageira')] },
      ...reciboBlock(v),
    );
    return blocks;
  },
});
