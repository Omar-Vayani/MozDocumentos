// Contrato de viagem organizada (pacote turístico): a licensed travel agency
// or tour operator sells a package (transport, accommodation, activities) to
// a traveller: programme, inclusions, price and deposit, travel documents,
// changes, cancellation by either side and the agency's responsibility.

import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, lines, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import { contratoBlocks, formaPagamentoFields, linhas, modoPagamento } from './_digital';

type Dia = { dia: string; programa: string };
const programa = (v: Values): Dia[] =>
  lines(v.programa)
    .map((r) => ({ dia: str(r.dia), programa: str(r.programa) }))
    .filter((r) => r.dia || r.programa);
type Esc = { quando: string; custo: string };
const escaloes = (v: Values): Esc[] =>
  lines(v.cancelamento)
    .map((r) => ({ quando: str(r.quando), custo: str(r.custo) }))
    .filter((r) => r.quando || r.custo);

export default defineTemplate({
  id: 'contrato-viagem-organizada',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'agencia', title: l('Agência ou operador', 'Agency or operator'), personRole: 'outro' },
    { id: 'viajante', title: l('Cliente (viajante)', 'Traveller'), personRole: 'cliente' },
    { id: 'viagem', title: l('Viagem e programa', 'Trip and programme') },
    { id: 'preco', title: l('Preço', 'Price') },
    { id: 'cancelamento', title: l('Cancelamento', 'Cancellation') },
    { id: 'clausulas', title: l('Assinaturas', 'Signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('agencia', { fromProfile: true, tipoDefault: 'empresa' }),
    { name: 'alvara', type: 'text', section: 'agencia', label: l('Licença ou alvará de agência de viagens', 'Travel agency licence'), default: (c) => c.profile?.licenca || '' },
    ...partyFields('viajante'),
    { name: 'participantes', type: 'textarea', section: 'viajante', rows: 3, label: l('Outros participantes (nome e passaporte/BI)', 'Other travellers (name and ID)'), help: l('Um por linha.', 'One per line.') },

    { name: 'designacao', type: 'text', section: 'viagem', required: true, label: l('Designação da viagem', 'Trip name'), placeholder: l('Ex.: Safari de quatro dias no Parque Nacional da Gorongosa', 'E.g. Gorongosa safari') },
    { name: 'dataPartida', type: 'date', section: 'viagem', width: 'half', required: true, label: l('Partida', 'Departure') },
    { name: 'dataRegresso', type: 'date', section: 'viagem', width: 'half', required: true, label: l('Regresso', 'Return') },
    {
      name: 'programa',
      type: 'lines',
      section: 'viagem',
      label: l('Programa', 'Programme'),
      addLabel: l('Adicionar dia', 'Add day'),
      columns: [
        { name: 'dia', type: 'text', label: l('Dia', 'Day') },
        { name: 'programa', type: 'text', label: l('Programa', 'Programme') },
      ],
    },
    { name: 'inclui', type: 'textarea', section: 'viagem', rows: 4, required: true, label: l('O preço inclui', 'Included'), placeholder: l('Ex.: transporte em viatura 4x4 com motorista-guia\nalojamento em lodge, em quarto duplo, com pensão completa\nentradas no parque e dois safaris diários', 'E.g. 4x4 transport\nlodge accommodation\npark fees') },
    { name: 'naoInclui', type: 'textarea', section: 'viagem', rows: 3, label: l('O preço não inclui', 'Not included'), default: 'bebidas e despesas pessoais\ngorjetas\nseguro de viagem\nvistos e vacinas' },
    { name: 'minimoParticipantes', type: 'number', section: 'viagem', width: 'half', min: 0, max: 500, label: l('Mínimo de participantes (opcional)', 'Minimum group size (optional)') },

    { name: 'precoPessoa', type: 'money', section: 'preco', width: 'half', label: l('Preço por pessoa', 'Price per person') },
    { name: 'pessoas', type: 'number', section: 'preco', width: 'half', min: 1, max: 500, default: 2, label: l('Número de pessoas', 'Number of people') },
    { name: 'sinal', type: 'money', section: 'preco', width: 'half', label: l('Sinal pago na reserva', 'Deposit on booking') },
    { name: 'dataSaldo', type: 'date', section: 'preco', width: 'half', label: l('Saldo pago até', 'Balance due by') },
    ...formaPagamentoFields('preco'),

    {
      name: 'cancelamento',
      type: 'lines',
      section: 'cancelamento',
      label: l('Custos de cancelamento pelo cliente', 'Cancellation charges'),
      addLabel: l('Adicionar escalão', 'Add tier'),
      columns: [
        { name: 'quando', type: 'text', label: l('Quando cancela', 'When') },
        { name: 'custo', type: 'text', label: l('Custo', 'Charge') },
      ],
      default: [
        { quando: 'Até um mês antes da partida', custo: 'despesas de reserva já pagas a terceiros' },
        { quando: 'Entre um mês e uma semana antes', custo: 'metade do preço' },
        { quando: 'Na última semana ou não comparência', custo: 'o preço total' },
      ],
    },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const pp = money(v.precoPessoa);
    const n = Number(v.pessoas) || 0;
    const total = pp != null && n > 0 ? Math.round(pp * n * 100) / 100 : null;
    const sinal = money(v.sinal);
    return { total, saldo: total != null ? Math.round((total - (sinal ?? 0)) * 100) / 100 : null };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'agencia', 'agência', 'agency'), ...partyWarnings(v, 'viajante', 'viajante', 'traveller')];
    if (c.total == null) w.push({ level: 'error', field: 'precoPessoa', message: l('Indique o preço por pessoa.', 'Enter the price per person.') });
    if (!str(v.alvara)) w.push({ level: 'warning', field: 'alvara', message: l(`Só agências e operadores licenciados podem vender viagens organizadas (${cite('turAgenciaViagens')}).`, 'Only licensed agencies and operators may sell package tours.') });
    w.push({ level: 'info', message: l('Entregue ao cliente o programa e estas condições antes de receber o sinal. O sinal recebido por quem está registado em IVA exige factura.', 'Give the client the programme and terms before taking the deposit; VAT-registered agencies must invoice deposits.') });
    return w;
  },

  personName: (v) => partyName(v, 'viajante') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const A = papel(v, 'agencia', 'Agência', 'Agência', true);
    const V = papel(v, 'viajante', 'Cliente', 'Cliente');
    const prog = programa(v);
    const inc = linhas(v.inclui).map(semPonto);
    const ninc = linhas(v.naoInclui).map(semPonto);
    const part = linhas(v.participantes).map(semPonto);
    const esc = escaloes(v);
    const lista = (xs: string[]) => xs.map((s, i) => `${s}${i === xs.length - 1 ? '.' : ';'}`);
    const min = Number(v.minimoParticipantes);

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        `Pelo presente contrato, ${A.o}${str(v.alvara) ? `, titular da ${semPonto(v.alvara).charAt(0).toLowerCase() + semPonto(v.alvara).slice(1)},` : ''} vende ${V.ao} a viagem organizada **"${semPonto(v.designacao) || BLANK}"**, com partida em ${dateLong(v.dataPartida)} e regresso em ${dateLong(v.dataRegresso)}, segundo o programa do Anexo, para ${Number(v.pessoas) > 0 ? Number(v.pessoas) : BLANK} ${Number(v.pessoas) === 1 ? 'pessoa' : 'pessoas'}.`,
        part.length ? `Para além ${V.de}, participam na viagem: ${part.join('; ')}.` : '',
      ]),
      en: `Sale of the package "${v.designacao || '—'}", departing and returning on the stated dates, per the programme in the Annex.`,
    });
    cl.push({ id: 'inclui', heading: 'Serviços incluídos', text: 'O preço inclui:', items: inc.length ? lista(inc) : [`${BLANK}.`], en: 'Included services as listed.' });
    if (ninc.length) cl.push({ id: 'naoInclui', heading: 'Serviços não incluídos', text: 'O preço não inclui:', items: lista(ninc), en: 'Not included as listed.' });
    cl.push({
      id: 'preco',
      heading: 'Preço e pagamento',
      text: numerar([
        `O preço é de ${valorTexto(money(v.precoPessoa))} por pessoa, no total de ${valorTexto(c.total)}.`,
        money(v.sinal) != null ? `Na reserva, ${V.o} paga um sinal de ${valorTexto(money(v.sinal))}; o saldo de ${valorTexto(c.saldo)} é pago até ${dateLong(v.dataSaldo)}, ${modoPagamento(v, A)}.` : `O preço é pago até ${dateLong(v.dataSaldo)}, ${modoPagamento(v, A)}.`,
        `O preço só pode ser alterado antes da partida em consequência de variação comprovada de taxas, impostos ou custos de transporte alheios ${A.ao}, comunicada por escrito; se o aumento for significativo, ${V.o} pode desistir sem custos.`,
      ]),
      en: `Price per person and total ${c.total != null ? formatMoney(c.total) : '—'}; deposit and balance as stated. Price may change before departure only for proven changes in taxes or transport costs; if significant, the client may withdraw free of charge.`,
    });
    cl.push({
      id: 'documentos',
      heading: 'Documentos de viagem e saúde',
      text: `${V.O} é responsável por ter passaporte ou bilhete de identidade válidos, os vistos e as vacinas exigidos e, para menores que viajem sem os pais, a autorização de viagem. ${A.O} informa ${V.o}, antes da reserva, sobre esses requisitos. Recomenda-se a contratação de seguro de viagem que cubra despesas médicas e cancelamento.`,
      en: 'The client must hold valid passport or ID, visas, vaccinations and, for unaccompanied minors, travel authorisation; the agency informs of requirements. Travel insurance is recommended.',
    });
    cl.push({
      id: 'alteracoesAgencia',
      heading: 'Alterações e cancelamento pela agência',
      text: numerar([
        `${A.O} só pode alterar elementos essenciais da viagem por motivo que não lhe seja imputável, devendo avisar ${V.o} de imediato; ${V.o} pode aceitar a alteração ou desistir, com reembolso integral.`,
        Number.isFinite(min) && min > 0 ? `Se não se inscreverem pelo menos ${min} participantes, ${A.o} pode cancelar a viagem até uma semana antes da partida, devolvendo integralmente as quantias pagas.` : '',
        `Se ${A.o} cancelar a viagem por facto que lhe seja imputável, devolve as quantias pagas e indemniza ${V.o} pelos prejuízos sofridos.`,
      ]),
      en: 'Essential changes only for reasons beyond the agency’s control, with notice; the client may accept or withdraw with a full refund. Minimum group cancellation as stated. Cancellation attributable to the agency: refund plus damages.',
    });
    cl.push({
      id: 'cancelamentoCliente',
      heading: 'Cancelamento pelo cliente',
      text: `${V.O} pode desistir da viagem a todo o tempo, por escrito, pagando os seguintes custos:`,
      items: esc.length ? esc.map((e, i) => `${semPonto(e.quando) || BLANK}: ${semPonto(e.custo) || BLANK}${i === esc.length - 1 ? '.' : ';'}`) : [`${BLANK}.`],
      en: 'The client may cancel in writing at any time, paying the charges listed.',
    });
    cl.push({
      id: 'responsabilidade',
      heading: 'Responsabilidade da agência',
      text: `${A.O} responde perante ${V.o} pela boa execução dos serviços incluídos, mesmo quando prestados por terceiros (transportadores, hotéis, guias), sem prejuízo do seu direito de regresso contra estes. Não responde por factos imputáveis ao próprio viajante, a terceiros estranhos aos serviços ou a força maior, devendo ainda assim prestar a assistência necessária.`,
      en: 'The agency is liable for proper performance of included services, even when provided by third parties, except for acts of the traveller, unrelated third parties or force majeure, while still giving assistance.',
    });
    cl.push({
      id: 'reclamacoes',
      heading: 'Reclamações',
      text: `As falhas verificadas durante a viagem são comunicadas de imediato ao guia ou ${A.ao}, para que possam ser corrigidas no local, e confirmadas por escrito no prazo máximo de uma semana após o regresso. ${A.O} dispõe de livro de reclamações.`,
      en: 'Report problems on the spot and confirm in writing within a week of return; a complaints book is available.',
    });

    const annex: Block[] = [
      { type: 'spacer', size: 'medium' },
      { type: 'heading', text: 'Anexo — Programa', align: 'center' },
      prog.length
        ? { type: 'table', columns: [{ label: 'Dia', width: 1.2 }, { label: 'Programa', width: 5.4 }], rows: prog.map((d) => [d.dia || BLANK, d.programa || BLANK]) }
        : { type: 'box', label: 'Programa dia a dia', lines: 6 },
    ];

    return contratoBlocks(ctx, {
      title: 'Contrato de viagem organizada',
      subtitle: str(v.designacao) || undefined,
      parties: [
        { p: 'agencia', role: A, en: 'Agency' },
        { p: 'viajante', role: V, en: 'Traveller' },
      ],
      clauses: cl,
      signatures: [assinatura(ctx, 'agencia', A, true), assinatura(ctx, 'viajante', V)],
      annex,
    });
  },
});
