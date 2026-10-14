// Contrato de transporte de passageiros / aluguer de viatura com motorista:
// occasional transport for an excursion, event, transfer or staff shuttle.
// Licensed carrier, inspected vehicles, passenger insurance, seating limits,
// itinerary, waiting time, breakdown replacement and cancellation.

import { formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, lines, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import { clForcaMaior, contratoBlocks, formaPagamentoFields, ivaField, ivaTexto, modoPagamento, prazo } from './_digital';

type Viagem = { data: string; hora: string; origem: string; destino: string };
const viagens = (v: Values): Viagem[] =>
  lines(v.itinerario)
    .map((r) => ({ data: str(r.data), hora: str(r.hora), origem: str(r.origem), destino: str(r.destino) }))
    .filter((r) => r.origem || r.destino);

const TIPOS: Record<string, string> = {
  excursao: 'uma excursão',
  evento: 'o transporte de participantes num evento',
  transfer: 'transferes entre o aeroporto, os hotéis e os locais indicados',
  pessoal: 'o transporte regular de trabalhadores',
  outro: 'um serviço de transporte de passageiros',
};

export default defineTemplate({
  id: 'contrato-transporte-passageiros',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'transportador', title: l('Transportador', 'Carrier'), personRole: 'outro' },
    { id: 'cliente', title: l('Cliente', 'Client'), personRole: 'cliente' },
    { id: 'servico', title: l('Serviço e viaturas', 'Service and vehicles') },
    { id: 'preco', title: l('Preço', 'Price') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('transportador', { fromProfile: true, tipoDefault: 'empresa' }),
    { name: 'licenca', type: 'text', section: 'transportador', label: l('Licença de transportador', 'Carrier licence'), default: (c) => c.profile?.licenca || '' },
    ...partyFields('cliente', { tipoDefault: 'empresa', osfl: true }),

    { name: 'tipo', type: 'select', section: 'servico', width: 'half', label: l('Tipo de serviço', 'Kind of service'), options: [{ value: 'excursao', label: l('Excursão ou visita de estudo', 'Excursion or school trip') }, { value: 'evento', label: l('Evento (casamento, conferência, funeral)', 'Event') }, { value: 'transfer', label: l('Transferes (aeroporto, hotel)', 'Transfers') }, { value: 'pessoal', label: l('Transporte de trabalhadores', 'Staff transport') }, { value: 'outro', label: l('Outro', 'Other') }], default: 'excursao' },
    { name: 'passageiros', type: 'number', section: 'servico', width: 'half', min: 1, max: 5000, required: true, label: l('Número de passageiros', 'Number of passengers') },
    { name: 'viaturas', type: 'text', section: 'servico', required: true, label: l('Viatura(s) e lotação', 'Vehicle(s) and seats'), placeholder: l('Ex.: 1 autocarro de 60 lugares, matrícula AFD 123 MC', 'E.g. one 60-seat bus, plate AFD 123 MC') },
    {
      name: 'itinerario',
      type: 'lines',
      section: 'servico',
      label: l('Itinerário', 'Itinerary'),
      addLabel: l('Adicionar viagem', 'Add trip'),
      columns: [
        { name: 'data', type: 'date', label: l('Data', 'Date') },
        { name: 'hora', type: 'text', label: l('Hora de partida', 'Departure time') },
        { name: 'origem', type: 'text', label: l('Partida', 'From') },
        { name: 'destino', type: 'text', label: l('Destino', 'To') },
      ],
    },
    { name: 'paragens', type: 'text', section: 'servico', label: l('Paragens intermédias (opcional)', 'Stops (optional)') },
    { name: 'esperaHoras', type: 'number', section: 'servico', width: 'half', min: 0, max: 48, default: 2, label: l('Tempo de espera incluído (horas)', 'Waiting time included (hours)') },
    { name: 'motoristaAlojamento', type: 'toggle', section: 'servico', default: false, label: l('O cliente assegura alojamento e alimentação do motorista', 'Client provides driver’s lodging and meals') },

    { name: 'precoModo', type: 'select', section: 'preco', width: 'half', label: l('Preço', 'Pricing'), options: [{ value: 'global', label: l('Valor global', 'Lump sum') }, { value: 'dia', label: l('Por dia', 'Per day') }, { value: 'viagem', label: l('Por viagem', 'Per trip') }, { value: 'mes', label: l('Por mês', 'Per month') }], default: 'global' },
    { name: 'preco', type: 'money', section: 'preco', width: 'half', required: true, label: l('Valor', 'Amount') },
    ivaField('preco'),
    { name: 'inclui', type: 'text', section: 'preco', label: l('O preço inclui', 'Price includes'), default: 'combustível, motorista, portagens e seguro de passageiros' },
    { name: 'horaExtra', type: 'money', section: 'preco', width: 'half', label: l('Hora de espera adicional', 'Extra waiting hour') },
    { name: 'adiantamentoPct', type: 'number', section: 'preco', width: 'half', min: 0, max: 100, default: 50, label: l('Pago na reserva (%)', 'Paid on booking (%)') },
    ...formaPagamentoFields('preco'),
    { name: 'cancelamentoDias', type: 'number', section: 'clausulas', width: 'half', min: 0, max: 60, default: 3, label: l('Cancelamento sem custos até (dias antes)', 'Free cancellation until (days before)') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'transportador', 'transportador', 'carrier'), ...partyWarnings(v, 'cliente', 'cliente', 'client')];
    if (!str(v.licenca)) w.push({ level: 'warning', field: 'licenca', message: l('Indique a licença de transportador: o transporte de passageiros por conta de outrem exige licença.', 'State the carrier licence: carrying passengers for hire requires one.') });
    if (money(v.preco) == null) w.push({ level: 'error', field: 'preco', message: l('Indique o preço.', 'Enter the price.') });
    w.push({ level: 'info', message: l(`Viaturas inspeccionadas, seguro de passageiros e motoristas com carta da categoria adequada são obrigatórios; a lotação não pode ser excedida (${cite('turTransportePassageiros')}). Numa visita de estudo, junte as autorizações dos encarregados.`, 'Inspected vehicles, passenger insurance and properly licensed drivers are mandatory; do not exceed capacity. For school trips, attach the parents’ authorisations.') });
    return w;
  },

  personName: (v) => partyName(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const T = papel(v, 'transportador', 'Transportador', 'Transportadora', true);
    const C = papel(v, 'cliente', 'Cliente', 'Cliente');
    const vs = viagens(v);
    const preco = money(v.preco);
    const pct = Number(v.adiantamentoPct);
    const modo = v.precoModo === 'dia' ? 'por dia de serviço' : v.precoModo === 'viagem' ? 'por viagem' : v.precoModo === 'mes' ? 'por mês' : 'pelo serviço completo';
    const n = Number(v.passageiros);

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        `Pelo presente contrato, ${T.o}${str(v.licenca) ? `, titular da ${semPonto(v.licenca).charAt(0).toLowerCase() + semPonto(v.licenca).slice(1)},` : ''} obriga-se a realizar, com viatura e motorista próprios, ${TIPOS[str(v.tipo)] ?? TIPOS.outro}, para ${Number.isFinite(n) && n > 0 ? n : BLANK} passageiros indicados ${C.pelo}, segundo o itinerário do Anexo.`,
        `O serviço é feito com: ${semPonto(v.viaturas) || BLANK}.${str(v.paragens) ? ` Paragens intermédias: ${semPonto(v.paragens)}.` : ''}`,
      ]),
      en: 'The carrier provides the transport described, with its own vehicle and driver, for the stated number of passengers, per the itinerary in the Annex.',
    });
    cl.push({
      id: 'obrigacoesTransportador',
      heading: `Obrigações ${T.de}`,
      text: `${T.O} obriga-se a:`,
      items: [
        'apresentar a viatura limpa, em bom estado, com a inspecção, o seguro de passageiros e os documentos em dia, no local e à hora indicados;',
        'garantir motoristas experientes, com carta da categoria adequada, que respeitam o Código da Estrada, os limites de velocidade e os tempos de descanso;',
        'não transportar mais passageiros do que a lotação da viatura, nem pessoas estranhas ao serviço;',
        `substituir a viatura, em caso de avaria, no mais curto prazo possível, sem custos para ${C.o};`,
        'não permitir o consumo de álcool pelo motorista, antes ou durante o serviço.',
      ],
      en: 'Clean, roadworthy vehicle with inspection, passenger insurance and papers, on time; experienced, properly licensed drivers obeying traffic rules and rest times; no overloading or outsiders; replacement on breakdown; no alcohol for the driver.',
    });
    cl.push({
      id: 'obrigacoesCliente',
      heading: `Obrigações ${C.de}`,
      text: numerar([
        `${C.O} entrega ${T.ao}, antes da partida, a lista dos passageiros e indica um responsável pelo grupo, que coordena com o motorista os horários e as paragens.`,
        `${C.O} responde pelos danos causados na viatura pelos passageiros, para além do desgaste normal, e garante que estes cumprem as instruções do motorista e não transportam objectos perigosos ou proibidos.`,
        v.motoristaAlojamento ? `Nos serviços com pernoita, ${C.o} assegura o alojamento e a alimentação do motorista.` : '',
      ]),
      en: 'The client provides the passenger list and a group leader, is liable for passenger damage and ensures passengers follow the driver’s instructions.',
    });
    cl.push({
      id: 'horarios',
      heading: 'Horários e esperas',
      text: `O preço inclui um tempo de espera de até ${prazo(v.esperaHoras, 'hora')} por viagem${money(v.horaExtra) != null ? `; cada hora adicional de espera, ou de prolongamento do serviço pedido ${C.pelo}, é paga a ${valorTexto(money(v.horaExtra))}` : ''}. Os atrasos imputáveis aos passageiros não responsabilizam ${T.o}.`,
      en: 'Waiting time included as stated; extra hours charged; delays caused by passengers are not the carrier’s responsibility.',
    });
    cl.push({
      id: 'preco',
      heading: 'Preço e pagamento',
      text: numerar([
        `O preço é de ${valorTexto(preco)} ${modo}${ivaTexto(v.iva)}, incluindo ${semPonto(v.inclui) || BLANK}.`,
        Number.isFinite(pct) && pct > 0 && pct < 100 ? `${pct}% do preço é pago na assinatura, para confirmar a reserva, e o restante até ao fim do serviço${v.precoModo === 'mes' ? ', ou até ao dia cinco do mês seguinte' : ''}.` : `O preço é pago ${v.precoModo === 'mes' ? 'até ao dia cinco do mês seguinte ao serviço' : 'até ao fim do serviço'}.`,
        `Os pagamentos são feitos ${modoPagamento(v, T)}, contra factura.`,
      ]),
      en: `Price ${preco != null ? formatMoney(preco) : '—'} ${v.precoModo}; deposit on signing and balance as stated, against invoice.`,
    });
    cl.push({
      id: 'cancelamento',
      heading: 'Cancelamento',
      text: `${C.O} pode cancelar o serviço sem custos até ${prazo(v.cancelamentoDias)} antes da data marcada, sendo-lhe devolvido o que tiver pago; depois disso, ${T.o} retém o adiantamento a título de indemnização. Se ${T.o} não realizar o serviço por facto que lhe seja imputável, devolve em dobro o adiantamento recebido.`,
      en: 'Free cancellation up to the stated days; later, the deposit is kept. If the carrier fails to perform, it returns double the deposit.',
    });
    cl.push({
      id: 'responsabilidade',
      heading: 'Responsabilidade',
      text: `${T.O} responde pelos danos causados aos passageiros durante o transporte, nos termos da lei e do seguro, e pelas bagagens entregues ao motorista. Não responde pelos objectos de valor que os passageiros mantenham consigo.`,
      en: 'The carrier is liable for harm to passengers during carriage (law and insurance) and for luggage handed to the driver, not for valuables kept by passengers.',
    });
    cl.push(clForcaMaior());

    const annex: Block[] = [
      { type: 'spacer', size: 'medium' },
      { type: 'heading', text: 'Anexo — Itinerário', align: 'center' },
      vs.length
        ? {
            type: 'table',
            columns: [
              { label: 'Data', width: 1.1 },
              { label: 'Hora', width: 0.8 },
              { label: 'Partida', width: 2.4 },
              { label: 'Destino', width: 2.4 },
            ],
            rows: vs.map((x) => [x.data ? formatDateShort(x.data) : BLANK, x.hora || BLANK, x.origem || BLANK, x.destino || BLANK]),
          }
        : { type: 'box', label: 'Data, hora, partida e destino de cada viagem', lines: 5 },
    ];

    return contratoBlocks(ctx, {
      title: 'Contrato de transporte de passageiros',
      subtitle: 'Aluguer de viatura com motorista',
      parties: [
        { p: 'cliente', role: C, en: 'Client' },
        { p: 'transportador', role: T, en: 'Carrier' },
      ],
      clauses: cl,
      signatures: [assinatura(ctx, 'cliente', C), assinatura(ctx, 'transportador', T, true)],
      annex,
    });
  },
});

