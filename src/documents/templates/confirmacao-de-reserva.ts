// Confirmação de reserva / voucher de alojamento: sent by a hotel, lodge or
// guest house to the guest: stay, rooms and board, price, deposit and balance,
// check-in and check-out times and the cancellation terms. Not an invoice.

import { diffDays, formatDateShort, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, dateLong, formatMoney, l, money } from './_shared';
import { lines, semPonto, str } from './_contratos';
import { issuer, linhas } from './_digital';

const REGIMES: Record<string, string> = {
  so: 'Só alojamento',
  pa: 'Alojamento e pequeno-almoço',
  mp: 'Meia pensão',
  pc: 'Pensão completa',
  ti: 'Tudo incluído',
};

type Quarto = { tipo: string; quantidade: number; regime: string; preco: number | null };

function quartos(v: Values): Quarto[] {
  return lines(v.quartos)
    .map((r) => ({ tipo: str(r.tipo), quantidade: Math.max(0, Number(r.quantidade) || 0), regime: str(r.regime), preco: money(r.preco) }))
    .filter((r) => r.tipo || r.preco != null);
}

export default defineTemplate({
  id: 'confirmacao-de-reserva',
  family: 'carta',
  sections: [
    { id: 'reserva', title: l('Reserva', 'Booking') },
    { id: 'hospede', title: l('Hóspede', 'Guest'), personRole: 'cliente' },
    { id: 'estadia', title: l('Estadia e quartos', 'Stay and rooms') },
    { id: 'pagamento', title: l('Pagamento', 'Payment') },
    { id: 'condicoes', title: l('Condições', 'Terms') },
  ],
  fields: [
    { name: 'ref', type: 'text', section: 'reserva', width: 'half', label: l('N.º da reserva', 'Booking number'), default: (c) => c.nextRef },
    { name: 'data', type: 'date', section: 'reserva', width: 'half', label: l('Data da confirmação', 'Confirmation date'), default: (c) => c.today },
    { name: 'canal', type: 'text', section: 'reserva', width: 'half', label: l('Canal da reserva (opcional)', 'Booking channel (optional)'), placeholder: l('Ex.: e-mail; telefone; agência X', 'E.g. e-mail; phone; agency') },

    { name: 'hospedeNome', type: 'text', section: 'hospede', required: true, label: l('Nome do hóspede (titular da reserva)', 'Lead guest name'), personKey: 'nome' },
    { name: 'hospedeGenero', type: 'radio', section: 'hospede', width: 'half', label: l('Tratamento', 'Form of address'), options: [{ value: 'M', label: l('Senhor', 'Mr') }, { value: 'F', label: l('Senhora', 'Ms') }], default: 'M', personKey: 'genero' },
    { name: 'hospedeContacto', type: 'text', section: 'hospede', width: 'half', label: l('Telefone ou e-mail', 'Phone or e-mail') },
    { name: 'hospedeEmpresa', type: 'text', section: 'hospede', label: l('Empresa ou agência (opcional)', 'Company or agency (optional)') },

    { name: 'checkin', type: 'date', section: 'estadia', width: 'half', required: true, label: l('Entrada (check-in)', 'Check-in') },
    { name: 'checkout', type: 'date', section: 'estadia', width: 'half', required: true, label: l('Saída (check-out)', 'Check-out') },
    { name: 'adultos', type: 'number', section: 'estadia', width: 'half', min: 1, max: 500, default: 2, label: l('Adultos', 'Adults') },
    { name: 'criancas', type: 'number', section: 'estadia', width: 'half', min: 0, max: 200, default: 0, label: l('Crianças', 'Children') },
    {
      name: 'quartos',
      type: 'lines',
      section: 'estadia',
      label: l('Quartos', 'Rooms'),
      addLabel: l('Adicionar quarto', 'Add room'),
      columns: [
        { name: 'tipo', type: 'text', label: l('Tipo de quarto', 'Room type') },
        { name: 'quantidade', type: 'number', label: l('Quantidade', 'Quantity') },
        { name: 'regime', type: 'select', label: l('Regime', 'Board'), options: Object.entries(REGIMES).map(([value, t]) => ({ value, label: l(t, value) })) },
        { name: 'preco', type: 'money', label: l('Preço por noite', 'Price per night') },
      ],
      default: [{ tipo: 'Quarto duplo vista mar', quantidade: 1, regime: 'pa', preco: '' }],
    },
    { name: 'extras', type: 'textarea', section: 'estadia', rows: 2, label: l('Extras e pedidos especiais (opcional)', 'Extras and special requests (optional)'), placeholder: l('Ex.: transfer do aeroporto à chegada; cama de bebé', 'E.g. airport transfer on arrival; baby cot') },
    { name: 'valorExtras', type: 'money', section: 'estadia', width: 'half', label: l('Valor dos extras', 'Extras amount') },

    { name: 'ivaIncluido', type: 'toggle', section: 'pagamento', default: true, label: l('Os preços incluem IVA e taxas', 'Prices include VAT and taxes') },
    { name: 'pago', type: 'money', section: 'pagamento', width: 'half', label: l('Valor já pago (depósito)', 'Amount paid (deposit)') },
    { name: 'saldoQuando', type: 'select', section: 'pagamento', width: 'half', label: l('Saldo a pagar', 'Balance due'), options: [{ value: 'checkin', label: l('No check-in', 'At check-in') }, { value: 'checkout', label: l('No check-out', 'At check-out') }, { value: 'antes', label: l('Antes da chegada', 'Before arrival') }], default: 'checkin' },
    { name: 'dadosPagamento', type: 'text', section: 'pagamento', label: l('Como pagar', 'How to pay'), default: (c) => [c.profile?.banco ? `${c.profile.banco}` : '', c.profile?.nib ? `NIB ${c.profile.nib}` : ''].filter(Boolean).join(', ') },

    { name: 'horaCheckin', type: 'text', section: 'condicoes', width: 'half', label: l('Check-in a partir de', 'Check-in from'), default: '14h00' },
    { name: 'horaCheckout', type: 'text', section: 'condicoes', width: 'half', label: l('Check-out até', 'Check-out by'), default: '10h00' },
    { name: 'cancelamento', type: 'textarea', section: 'condicoes', rows: 3, label: l('Política de cancelamento', 'Cancellation policy'), default: 'Cancelamento sem custos até duas semanas antes da chegada\nEntre duas semanas e uma semana antes: retido o valor de uma noite\nMenos de uma semana antes, ou não comparência: retido o valor do depósito' },
    { name: 'notas', type: 'textarea', section: 'condicoes', rows: 2, label: l('Notas (opcional)', 'Notes (optional)'), placeholder: l('Ex.: o acesso ao lodge exige viatura 4x4 nos últimos 3 km', 'E.g. 4x4 needed for the last stretch') },
  ],

  computed: (v) => {
    const noites = v.checkin && v.checkout ? Math.max(0, diffDays(String(v.checkin), String(v.checkout)) || 0) : 0;
    const qs = quartos(v);
    const linhasT = qs.map((q) => ({ ...q, total: q.preco != null ? roundMoney(q.preco * (q.quantidade || 1) * noites) : null }));
    const alojamento = roundMoney(linhasT.reduce((s, q) => s + (q.total ?? 0), 0));
    const extras = money(v.valorExtras) ?? 0;
    const total = roundMoney(alojamento + extras);
    const pago = money(v.pago) ?? 0;
    return { noites, linhas: linhasT, alojamento, total, pago, saldo: roundMoney(total - pago) };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (v.checkin && v.checkout && c.noites <= 0) w.push({ level: 'error', field: 'checkout', message: l('A data de saída deve ser posterior à de entrada.', 'Check-out must be after check-in.') });
    if (!c.linhas.length) w.push({ level: 'warning', field: 'quartos', message: l('Indique pelo menos um quarto.', 'Add at least one room.') });
    w.push({ level: 'info', message: l('Esta confirmação não é factura. Emita a factura ou o recibo no seu programa de facturação certificado quando receber pagamentos.', 'This confirmation is not an invoice. Issue the invoice or receipt from your certified invoicing software when paid.') });
    return w;
  },

  personName: (v) => str(v.hospedeNome) || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const nome = str(v.hospedeNome) || BLANK;
    const sal = v.hospedeGenero === 'F' ? 'Exma. Senhora' : 'Exmo. Senhor';
    const est = issuer(ctx);
    const pessoas = `${Number(v.adultos) || BLANK} ${Number(v.adultos) === 1 ? 'adulto' : 'adultos'}${Number(v.criancas) > 0 ? ` e ${Number(v.criancas)} ${Number(v.criancas) === 1 ? 'criança' : 'crianças'}` : ''}`;
    const canc = linhas(v.cancelamento).map(semPonto);
    const extras = linhas(v.extras).map(semPonto);
    const quando = v.saldoQuando === 'checkout' ? 'no check-out' : v.saldoQuando === 'antes' ? 'antes da chegada' : 'no check-in';

    const blocks: Block[] = [
      { type: 'reference', ref: `Reserva n.º ${str(v.ref) || BLANK}`, place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', salutation: sal, lines: [nome, str(v.hospedeEmpresa), str(v.hospedeContacto)].filter(Boolean) },
      { type: 'title', text: 'Confirmação de reserva', subtitle: `Reserva n.º ${str(v.ref) || BLANK}` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `Confirmamos a sua reserva no **${est}**, nas condições abaixo indicadas. Apresente esta confirmação e um documento de identificação válido no check-in.`,
        en: `We confirm your booking at ${est} on the terms below. Please show this confirmation and valid ID at check-in.`,
      },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Hóspede', value: nome },
          { label: 'Pessoas', value: pessoas },
          { label: 'Entrada', value: v.checkin ? `${formatDateShort(String(v.checkin))}, a partir das ${semPonto(v.horaCheckin) || BLANK}` : BLANK },
          { label: 'Saída', value: v.checkout ? `${formatDateShort(String(v.checkout))}, até às ${semPonto(v.horaCheckout) || BLANK}` : BLANK },
          { label: 'Noites', value: c.noites > 0 ? String(c.noites) : BLANK },
          ...(str(v.canal) ? [{ label: 'Canal', value: str(v.canal) }] : []),
        ],
      },
      {
        type: 'table',
        columns: [
          { label: 'Quarto', width: 2.4 },
          { label: 'Qtd.', width: 0.6, align: 'right' },
          { label: 'Regime', width: 2 },
          { label: 'Preço/noite', width: 1.3, align: 'right' },
          { label: 'Total (MT)', width: 1.4, align: 'right' },
        ],
        rows: c.linhas.length
          ? c.linhas.map((q: Quarto & { total: number | null }) => [q.tipo || BLANK, String(q.quantidade || 1), REGIMES[q.regime] ?? BLANK, q.preco != null ? formatMoney(q.preco, false) : BLANK, q.total != null ? formatMoney(q.total, false) : BLANK])
          : [[BLANK, '', '', '', '']],
        totals: [
          ...(money(v.valorExtras) != null ? [['Extras', '', '', '', formatMoney(money(v.valorExtras), false)]] : []),
          ['Total da estadia', '', '', '', formatMoney(c.total, false)],
          ...(c.pago > 0 ? [['Depósito recebido', '', '', '', formatMoney(c.pago, false)], ['Saldo a pagar', '', '', '', formatMoney(c.saldo, false)]] : []),
        ],
        note: v.ivaIncluido ? 'Preços em meticais, com IVA e taxas incluídos.' : 'Preços em meticais, sem IVA, que acresce à taxa legal.',
      },
    ];
    if (extras.length) blocks.push({ type: 'paragraph', id: 'extras', text: `**Extras e pedidos especiais:** ${extras.join('; ')}.`, en: 'Extras and special requests as listed.' });
    blocks.push({
      type: 'paragraph',
      id: 'pagamento',
      text: `${c.saldo > 0 ? `O saldo de **${formatMoney(c.saldo)}** é pago ${quando}` : 'A estadia encontra-se integralmente paga'}${str(v.dadosPagamento) && c.saldo > 0 ? `, por transferência para ${semPonto(v.dadosPagamento)}, ou no local por cartão, M-Pesa ou numerário` : ''}. A factura é emitida em nome do hóspede ou da empresa que este indicar.`,
      en: c.saldo > 0 ? 'The balance is payable as stated. The invoice is issued to the guest or the company named.' : 'The stay is fully paid.',
    });
    if (canc.length) {
      blocks.push({ type: 'heading', text: 'Cancelamento e alterações' }, { type: 'list', style: 'bullet', items: canc.map((s) => s + '.') });
    }
    if (str(v.notas)) blocks.push({ type: 'note', text: semPonto(v.notas) + '.', en: 'Notes.' });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Aguardamos a sua visita. Para qualquer alteração, contacte-nos indicando o número da reserva.', en: 'We look forward to welcoming you. For any change, contact us quoting the booking number.', keepWithNext: true },
      { type: 'signatures', columns: [{ role: 'Pelo estabelecimento', name: ctx.profile?.representanteNome || undefined, detail: ctx.profile?.representanteCargo || 'Reservas', image: 'both' }] },
    );
    return blocks;
  },
});
