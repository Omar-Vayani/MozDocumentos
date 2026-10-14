// Contrato de aluguer de viatura sem condutor (rent-a-car, or a private car
// lent for a fee): a lease of a movable thing (Civil Code). Vehicle, period,
// price, kilometres, fuel, insurance excess and deposit, permitted use, fines,
// accidents and late return, with a check-out / check-in inspection sheet.

import { diffDays, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, lines, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import { contratoBlocks, formaPagamentoFields, ivaField, ivaTexto, modoPagamento } from './_digital';

type Condutor = { nome: string; carta: string };
const condutores = (v: Values): Condutor[] =>
  lines(v.condutores)
    .map((r) => ({ nome: str(r.nome), carta: str(r.carta) }))
    .filter((r) => r.nome);

const ITENS_VISTORIA = [
  'Nível de combustível',
  'Quilometragem',
  'Pneus e pneu sobressalente',
  'Macaco e chave de rodas',
  'Triângulos e colete reflector',
  'Extintor',
  'Documentos (livrete, seguro, inspecção)',
  'Rádio, ar condicionado e luzes',
  'Limpeza interior',
];

export default defineTemplate({
  id: 'contrato-aluguer-viatura',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'locador', title: l('Locador (quem aluga a viatura)', 'Lessor'), personRole: 'outro' },
    { id: 'locatario', title: l('Locatário (cliente)', 'Hirer'), personRole: 'cliente' },
    { id: 'viatura', title: l('Viatura', 'Vehicle') },
    { id: 'periodo', title: l('Período e preço', 'Period and price') },
    { id: 'condicoes', title: l('Condições de uso', 'Conditions of use') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('locador', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('locatario'),
    { name: 'locatarioCarta', type: 'text', section: 'locatario', width: 'half', required: true, label: l('Carta de condução n.º', 'Driving licence no.') },
    { name: 'locatarioCartaValidade', type: 'date', section: 'locatario', width: 'half', label: l('Válida até', 'Valid until') },
    { name: 'locatarioTelefone', type: 'tel', section: 'locatario', width: 'half', label: l('Telefone', 'Phone') },
    {
      name: 'condutores',
      type: 'lines',
      section: 'locatario',
      label: l('Condutores adicionais (opcional)', 'Additional drivers (optional)'),
      addLabel: l('Adicionar condutor', 'Add driver'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'carta', type: 'text', label: l('Carta de condução n.º', 'Licence no.') },
      ],
    },

    { name: 'marca', type: 'text', section: 'viatura', width: 'half', required: true, label: l('Marca e modelo', 'Make and model'), placeholder: l('Ex.: Toyota Hilux 2.4 D-4D', 'E.g. Toyota Hilux') },
    { name: 'matricula', type: 'text', section: 'viatura', width: 'half', required: true, label: l('Matrícula', 'Plate') },
    { name: 'cor', type: 'text', section: 'viatura', width: 'half', label: l('Cor', 'Colour') },
    { name: 'combustivel', type: 'select', section: 'viatura', width: 'half', label: l('Combustível', 'Fuel'), options: [{ value: 'gasóleo', label: l('Gasóleo', 'Diesel') }, { value: 'gasolina', label: l('Gasolina', 'Petrol') }, { value: 'eléctrica', label: l('Eléctrica', 'Electric') }], default: 'gasóleo' },
    { name: 'kmSaida', type: 'number', section: 'viatura', width: 'half', min: 0, max: 2000000, label: l('Quilómetros à saída', 'Odometer at pick-up') },

    { name: 'entrega', type: 'date', section: 'periodo', width: 'half', required: true, label: l('Data de entrega', 'Pick-up date') },
    { name: 'horaEntrega', type: 'text', section: 'periodo', width: 'half', label: l('Hora', 'Time'), default: '09h00' },
    { name: 'devolucao', type: 'date', section: 'periodo', width: 'half', required: true, label: l('Data de devolução', 'Return date') },
    { name: 'horaDevolucao', type: 'text', section: 'periodo', width: 'half', label: l('Hora', 'Time'), default: '09h00' },
    { name: 'localEntrega', type: 'text', section: 'periodo', width: 'half', label: l('Local de entrega', 'Pick-up place') },
    { name: 'localDevolucao', type: 'text', section: 'periodo', width: 'half', label: l('Local de devolução', 'Return place') },
    { name: 'precoDia', type: 'money', section: 'periodo', width: 'half', required: true, label: l('Preço por dia', 'Price per day') },
    ivaField('periodo'),
    { name: 'kmIncluidos', type: 'number', section: 'periodo', width: 'half', min: 0, max: 10000, label: l('Km incluídos por dia (vazio = ilimitados)', 'Km included per day (empty = unlimited)') },
    { name: 'precoKm', type: 'money', section: 'periodo', width: 'half', label: l('Preço por km adicional', 'Price per extra km'), showIf: (v) => Number(v.kmIncluidos) > 0 },
    { name: 'caucao', type: 'money', section: 'periodo', width: 'half', label: l('Caução', 'Security deposit') },
    { name: 'franquia', type: 'money', section: 'periodo', width: 'half', label: l('Franquia do seguro a cargo do cliente', 'Insurance excess borne by hirer') },
    ...formaPagamentoFields('periodo'),

    { name: 'ambito', type: 'select', section: 'condicoes', width: 'half', label: l('Pode circular', 'May be driven'), options: [{ value: 'cidade', label: l('Só na província', 'Within the province') }, { value: 'pais', label: l('Em todo o país', 'Anywhere in Mozambique') }, { value: 'estrangeiro', label: l('Também no estrangeiro', 'Also abroad') }], default: 'pais' },
    { name: 'paises', type: 'text', section: 'condicoes', width: 'half', label: l('Países autorizados', 'Countries allowed'), placeholder: l('Ex.: África do Sul e Essuatíni', 'E.g. South Africa and Eswatini'), showIf: (v) => v.ambito === 'estrangeiro' },
    { name: 'foraEstrada', type: 'toggle', section: 'condicoes', default: false, label: l('Permite circular fora de estrada (picadas, areia)', 'Off-road driving allowed') },
    { name: 'politicaCombustivel', type: 'select', section: 'condicoes', width: 'half', label: l('Combustível', 'Fuel policy'), options: [{ value: 'igual', label: l('Devolver com o mesmo nível', 'Return at the same level') }, { value: 'cheio', label: l('Entregue cheio, devolver cheio', 'Full to full') }], default: 'igual' },
    { name: 'atrasoTolerancia', type: 'number', section: 'condicoes', width: 'half', min: 0, max: 24, default: 1, label: l('Tolerância no atraso da devolução (horas)', 'Late-return tolerance (hours)') },

    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const dias = v.entrega && v.devolucao ? Math.max(1, diffDays(String(v.entrega), String(v.devolucao)) || 0) : 0;
    const pd = money(v.precoDia);
    return { dias, total: pd != null && dias > 0 ? roundMoney(pd * dias) : null };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'locador', 'locador', 'lessor'), ...partyWarnings(v, 'locatario', 'locatário', 'hirer')];
    if (!str(v.locatarioCarta)) w.push({ level: 'error', field: 'locatarioCarta', message: l('Indique a carta de condução do locatário e confira-a com o original.', 'Enter the hirer’s driving licence and check the original.') });
    if (v.entrega && v.devolucao && diffDays(String(v.entrega), String(v.devolucao)) < 0) w.push({ level: 'error', field: 'devolucao', message: l('A devolução deve ser posterior à entrega.', 'Return must be after pick-up.') });
    if (c.total == null) w.push({ level: 'warning', field: 'precoDia', message: l('Indique o preço por dia e as datas.', 'Enter the daily price and dates.') });
    w.push({ level: 'info', message: l(`A viatura deve ter seguro obrigatório de responsabilidade civil e circular com o livrete, o seguro e a inspecção. Quem aluga viaturas como actividade comercial precisa de licença (${cite('turAluguerViatura')}).`, 'The car must have compulsory third-party insurance and carry its papers. Car hire as a business requires a licence.') });
    if (v.ambito === 'estrangeiro') w.push({ level: 'info', field: 'paises', message: l('Para sair do país, o locatário precisa de autorização escrita do proprietário, da carta verde ou seguro do país de destino e dos documentos alfandegários da viatura.', 'To leave the country the hirer needs the owner’s written authorisation, cross-border insurance and customs papers.') });
    return w;
  },

  personName: (v) => partyName(v, 'locatario') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const L = papel(v, 'locador', 'Locador', 'Locadora', true);
    const T = papel(v, 'locatario', 'Locatário', 'Locatária');
    const conds = condutores(v);
    const km = Number(v.kmIncluidos);
    const viatura = `${str(v.marca) || BLANK}, matrícula **${str(v.matricula) || BLANK}**${str(v.cor) ? `, de cor ${str(v.cor)}` : ''}, a ${str(v.combustivel) || 'gasóleo'}`;
    const ambito = v.ambito === 'cidade' ? 'apenas dentro da província onde foi entregue' : v.ambito === 'estrangeiro' ? `em território nacional e em ${semPonto(v.paises) || BLANK}` : 'em todo o território nacional';

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        `Pelo presente contrato, ${L.o} dá de aluguer ${T.ao}, sem condutor, a viatura ${viatura}, em bom estado de funcionamento, com os documentos e o equipamento descritos no auto de entrega anexo${Number(v.kmSaida) > 0 ? `, com ${Number(v.kmSaida)} km no conta-quilómetros` : ''}.`,
        `A viatura só pode ser conduzida ${T.pelo}${conds.length ? ` e pelos seguintes condutores adicionais: ${conds.map((x) => `${x.nome}${x.carta ? ` (carta n.º ${x.carta})` : ''}`).join('; ')}` : ''}, todos com carta de condução válida.`,
      ]),
      en: `Self-drive hire of ${v.marca || '—'} (${v.matricula || '—'}), in good order with the papers and equipment listed in the annex; only the hirer${conds.length ? ' and the named additional drivers' : ''} may drive.`,
    });
    cl.push({
      id: 'periodo',
      heading: 'Período',
      text: numerar([
        `O aluguer tem início em ${dateLong(v.entrega)}, às ${semPonto(v.horaEntrega) || BLANK}${str(v.localEntrega) ? `, em ${semPonto(v.localEntrega)}` : ''}, e termina em ${dateLong(v.devolucao)}, às ${semPonto(v.horaDevolucao) || BLANK}, data em que a viatura é devolvida${str(v.localDevolucao) ? ` em ${semPonto(v.localDevolucao)}` : ' no mesmo local'}.`,
        `O prolongamento depende de acordo prévio ${L.de}. A devolução com atraso superior a ${Number(v.atrasoTolerancia) > 0 ? `${Number(v.atrasoTolerancia)} ${Number(v.atrasoTolerancia) === 1 ? 'hora' : 'horas'}` : 'uma hora'} implica o pagamento de um dia adicional por cada período de vinte e quatro horas ou fracção.`,
      ]),
      en: 'Hire period, times and places as stated. Extensions need prior agreement; late return beyond the tolerance is charged an extra day per 24 hours or part.',
    });
    cl.push({
      id: 'preco',
      heading: 'Preço, caução e pagamento',
      text: numerar([
        `O preço é de ${valorTexto(money(v.precoDia))} por dia${ivaTexto(v.iva)}${c.total != null ? `, no total de ${valorTexto(c.total)} para ${c.dias} ${c.dias === 1 ? 'dia' : 'dias'}` : ''}, pago na entrega da viatura, ${modoPagamento(v, L)}.`,
        Number.isFinite(km) && km > 0 ? `O preço inclui ${km} km por dia; cada quilómetro adicional é pago a ${valorTexto(money(v.precoKm))}.` : 'O preço inclui quilometragem ilimitada.',
        money(v.caucao) != null ? `${T.O} entrega uma caução de ${valorTexto(money(v.caucao))}, que é devolvida após a vistoria de devolução, deduzida dos valores em dívida (combustível, danos, multas, dias adicionais).` : '',
      ]),
      en: `Price per day${c.total != null ? `, total ${formatMoney(c.total)}` : ''}, paid at pick-up. Mileage as stated. Deposit refunded after the return inspection, less amounts due.`,
    });
    cl.push({
      id: 'uso',
      heading: 'Utilização da viatura',
      text: `${T.O} obriga-se a usar a viatura com prudência, ${ambito}, cumprindo o Código da Estrada, e a não a utilizar:`,
      items: [
        'sob a influência de álcool, estupefacientes ou medicamentos que afectem a condução;',
        'no transporte remunerado de passageiros ou de mercadorias, em corridas, reboques ou aulas de condução;',
        'com excesso de lotação ou de carga;',
        v.foraEstrada ? 'em vias que ponham em risco a viatura, para além da circulação normal em picadas;' : 'fora de estradas e picadas transitáveis, nomeadamente em praias, dunas ou leitos de rios;',
        'para fins ilícitos, ou cedendo-a a terceiros.',
      ],
      en: 'Prudent use in the stated area, obeying traffic law; no drink or drug driving, paid transport, racing, towing, overloading, unsuitable terrain, unlawful use or subletting.',
    });
    cl.push({
      id: 'combustivel',
      heading: 'Combustível e conservação',
      text: `${v.politicaCombustivel === 'cheio' ? `A viatura é entregue com o depósito cheio e deve ser devolvida cheia` : 'A viatura deve ser devolvida com o mesmo nível de combustível que tinha à saída'}; a falta é cobrada ao preço de mercado, acrescido do serviço de abastecimento. ${T.O} verifica os níveis de óleo e de água e avisa de imediato ${L.o} de qualquer avaria ou luz de aviso.`,
      en: `${v.politicaCombustivel === 'cheio' ? 'Full to full' : 'Same fuel level'}; missing fuel is charged. The hirer checks oil and water and reports any fault or warning light at once.`,
    });
    cl.push({
      id: 'seguro',
      heading: 'Seguro, acidentes e danos',
      text: numerar([
        `A viatura tem seguro de responsabilidade civil obrigatório, a cargo ${L.de}.`,
        `Em caso de acidente, furto ou roubo, ${T.o} avisa de imediato ${L.o} e a polícia, não assume responsabilidades perante terceiros, preenche a declaração amigável ou obtém o auto policial e recolhe a identificação dos intervenientes e das testemunhas.`,
        `${T.O} responde pelos danos causados na viatura durante o aluguer${money(v.franquia) != null ? ` até ao valor da franquia de ${valorTexto(money(v.franquia))}` : ''}, excepto se resultarem de defeito da viatura. Responde pela totalidade dos danos causados por condução sob efeito de álcool ou estupefacientes, por condutor não autorizado ou por uso proibido.`,
      ]),
      en: 'Compulsory third-party insurance is the lessor’s. Report accidents, theft or robbery at once to the lessor and police and gather details. The hirer is liable for damage up to the excess, and in full for drink or drug driving, unauthorised drivers or prohibited use.',
    });
    cl.push({
      id: 'multas',
      heading: 'Multas e portagens',
      text: `As multas, as portagens e as taxas de estacionamento relativas ao período do aluguer são da responsabilidade ${T.de}, que autoriza ${L.o} a identificá-lo perante as autoridades como condutor e a descontar esses valores na caução.`,
      en: 'Fines, tolls and parking during the hire are the hirer’s, who may be identified to the authorities as driver; amounts may be taken from the deposit.',
    });
    cl.push({
      id: 'avarias',
      heading: 'Avarias',
      text: `${L.O} suporta as reparações resultantes do desgaste normal e de defeitos da viatura. ${T.O} não manda reparar a viatura sem autorização ${L.de}, salvo pequenas reparações urgentes, até ao valor autorizado por telefone, reembolsadas contra factura. Se a avaria impedir o uso da viatura por facto não imputável ${T.ao}, ${L.o} substitui-a logo que possível ou devolve o preço dos dias não utilizados.`,
      en: 'The lessor bears repairs from normal wear and defects. No repairs without authorisation except small urgent ones, refunded against invoice. If the car cannot be used through no fault of the hirer, it is replaced or unused days refunded.',
    });
    cl.push({
      id: 'devolucao',
      heading: 'Vistoria e devolução',
      text: `Na entrega e na devolução, as partes fazem uma vistoria conjunta da viatura e registam o seu estado no auto anexo, que ambas assinam. Os danos não registados à saída e verificados na devolução presumem-se ocorridos durante o aluguer. Se ${T.o} não devolver a viatura no prazo e não responder aos contactos, ${L.o} pode recuperá-la e participar o facto às autoridades.`,
      en: 'Joint inspection at pick-up and return, recorded in the annex and signed. Damage not recorded at pick-up but found at return is presumed to have occurred during the hire. If the car is not returned, the lessor may recover it and report to the authorities.',
    });

    const annex: Block[] = [
      { type: 'pageBreakHint' },
      { type: 'title', text: 'Anexo — Auto de entrega e de devolução da viatura', subtitle: `${str(v.marca) || BLANK} · ${str(v.matricula) || BLANK}` },
      {
        type: 'table',
        grid: true,
        columns: [
          { label: 'Verificação', width: 2.6 },
          { label: 'Na entrega', width: 1.6 },
          { label: 'Na devolução', width: 1.6 },
        ],
        rows: ITENS_VISTORIA.map((i) => [i, i === 'Quilometragem' && Number(v.kmSaida) > 0 ? `${Number(v.kmSaida)} km` : ' ', ' ']),
      },
      { type: 'box', label: 'Danos existentes à saída (riscos, amolgadelas, vidros) — assinale no esquema ou descreva', space: 45 },
      { type: 'box', label: 'Danos verificados na devolução', lines: 3 },
      {
        type: 'table',
        grid: true,
        columns: [
          { label: '', width: 1.4 },
          { label: 'Data e hora', width: 1.6 },
          { label: 'Pelo Locador', width: 2 },
          { label: 'Pelo Locatário', width: 2 },
        ],
        rows: [
          ['Entrega', ' ', ' ', ' '],
          ['Devolução', ' ', ' ', ' '],
        ],
      },
    ];

    return contratoBlocks(ctx, {
      title: 'Contrato de aluguer de viatura',
      subtitle: 'sem condutor',
      parties: [
        { p: 'locador', role: L, en: 'Lessor' },
        { p: 'locatario', role: T, en: 'Hirer' },
      ],
      clauses: cl,
      signatures: [assinatura(ctx, 'locador', L, true), assinatura(ctx, 'locatario', T)],
      annex,
      beforeClauses: [],
    }).map((blk) =>
      blk.type === 'paragraph' && blk.id === 'parte_locatario'
        ? { ...blk, text: blk.text.replace(/, adiante (designad[oa]) por/, `, titular da carta de condução n.º ${str(v.locatarioCarta) || BLANK}${v.locatarioCartaValidade ? `, válida até ${dateLong(v.locatarioCartaValidade)}` : ''}${str(v.locatarioTelefone) ? `, telefone ${str(v.locatarioTelefone)}` : ''}, adiante $1 por`) }
        : blk,
    );
  },
});
