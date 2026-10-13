import { formatMonthYear, MESES, parseISODate } from '@/lib/format';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { FORMA_PAGAMENTO_OPTIONS, dateField, formatMoney, l, localField, money, placeDate, refField } from './_shared';
import { daEntidade, entidadeNome, naturezaField, naturezaOf, semPonto, str } from './_associacoes';

// Recibo de quota, jóia, contribuição ou donativo passado pelo tesoureiro de
// uma associação, clube, igreja ou grupo. A5 (receipt-book size); with
// "duplicado" the same receipt prints twice (original and copy).

const TIPO_OPTIONS = [
  { value: 'quota', label: l('Quota', 'Membership dues') },
  { value: 'joia', label: l('Jóia (entrada)', 'Entry fee') },
  { value: 'contribuicao', label: l('Contribuição extraordinária', 'Special contribution') },
  { value: 'donativo', label: l('Donativo', 'Donation') },
  { value: 'oferta', label: l('Dízimo / oferta', 'Tithe / offering') },
  { value: 'xitique', label: l('Contribuição de xitique', 'Savings group contribution') },
];

/** "de Janeiro a Março de 2026" / "de Dezembro de 2025 a Fevereiro de 2026" / "de Outubro de 2026" */
function periodo(a: unknown, b: unknown): string {
  const ia = str(a);
  const ib = str(b);
  if (!ia) return '____________';
  if (!ib || ib === ia) return `de ${formatMonthYear(`${ia}-01`)}`;
  const da = parseISODate(`${ia}-01`);
  const db = parseISODate(`${ib}-01`);
  if (!da || !db) return `de ${formatMonthYear(`${ia}-01`)}`;
  if (da.getFullYear() === db.getFullYear()) return `de ${MESES[da.getMonth()]} a ${MESES[db.getMonth()]} de ${db.getFullYear()}`;
  return `de ${formatMonthYear(`${ia}-01`)} a ${formatMonthYear(`${ib}-01`)}`;
}

function referente(v: Values): string {
  const fin = semPonto(v.finalidade);
  switch (v.tipo) {
    case 'joia':
      return 'jóia de admissão';
    case 'contribuicao':
      return `contribuição extraordinária${fin ? ` para ${fin}` : ''}`;
    case 'donativo':
      return `donativo${fin ? ` para ${fin}` : ''}, concedido sem contrapartida`;
    case 'oferta':
      return fin ? `dízimo / oferta (${fin})` : 'dízimo / oferta';
    case 'xitique':
      return `contribuição para o grupo de poupança${fin ? ` (${fin})` : ''}, referente ao período ${periodo(v.mesInicio, v.mesFim)}`;
    default:
      return `quota ${periodo(v.mesInicio, v.mesFim).replace(/^de /, v.mesFim && v.mesFim !== v.mesInicio ? 'dos meses de ' : 'do mês de ')}`;
  }
}

export default defineTemplate({
  id: 'recibo-de-quota',
  family: 'recibo',
  page: 'A5',
  repeat: (v) => (v.duplicado ? [{ __via: 'ORIGINAL' }, { __via: 'DUPLICADO' }] : undefined),
  sections: [
    { id: 'recibo', title: l('Recibo', 'Receipt') },
    { id: 'pagador', title: l('Quem pagou', 'Paid by'), personRole: 'outro' },
    { id: 'pagamento', title: l('Pagamento', 'Payment') },
    { id: 'documento', title: l('Assinatura e cópias', 'Signature and copies') },
  ],
  fields: [
    naturezaField('recibo'),
    refField('recibo'),
    { name: 'tipo', type: 'select', section: 'recibo', width: 'half', required: true, label: l('Referente a', 'For'), options: TIPO_OPTIONS, default: 'quota' },
    { name: 'mesInicio', type: 'month', section: 'recibo', width: 'half', label: l('Desde o mês', 'From month'), showIf: (v) => v.tipo === 'quota' || v.tipo === 'xitique', default: (c) => c.today.slice(0, 7) },
    { name: 'mesFim', type: 'month', section: 'recibo', width: 'half', label: l('Até ao mês (opcional)', 'To month (optional)'), showIf: (v) => v.tipo === 'quota' || v.tipo === 'xitique' },
    { name: 'finalidade', type: 'text', section: 'recibo', label: l('Finalidade (opcional)', 'Purpose (optional)'), placeholder: l('Ex.: construção do salão comunitário', 'E.g. building the community hall'), showIf: (v) => v.tipo !== 'quota' && v.tipo !== 'joia' },
    { name: 'anonimo', type: 'toggle', section: 'pagador', label: l('Doador anónimo', 'Anonymous donor'), default: false, showIf: (v) => v.tipo === 'donativo' || v.tipo === 'oferta' },
    { name: 'pagadorNome', type: 'text', section: 'pagador', label: l('Nome', 'Name'), personKey: 'nome', showIf: (v) => !v.anonimo },
    { name: 'numeroMembro', type: 'text', section: 'pagador', width: 'half', label: l('Membro n.º (opcional)', 'Member no. (optional)'), showIf: (v) => !v.anonimo },
    { name: 'pagadorNuit', type: 'text', section: 'pagador', width: 'half', label: l('NUIT (opcional)', 'Tax number (optional)'), personKey: 'nuit', showIf: (v) => !v.anonimo },
    { name: 'valor', type: 'money', section: 'pagamento', width: 'half', required: true, label: l('Valor recebido', 'Amount received') },
    { name: 'formaPagamento', type: 'select', section: 'pagamento', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'numerário' },
    { name: 'referenciaPagamento', type: 'text', section: 'pagamento', width: 'half', label: l('Referência da transacção (opcional)', 'Transaction reference (optional)'), showIf: (v) => v.formaPagamento !== 'numerário' },
    localField(),
    dateField(),
    { name: 'tesoureiroNome', type: 'text', section: 'documento', width: 'half', label: l('Quem recebe (tesoureiro)', 'Received by (treasurer)') },
    { name: 'tesoureiroCargo', type: 'text', section: 'documento', width: 'half', label: l('Cargo', 'Position'), default: 'O Tesoureiro' },
    { name: 'duplicado', type: 'toggle', section: 'documento', label: l('Imprimir original e duplicado', 'Print original and copy'), help: l('Duas folhas A5: uma para quem paga, outra para o arquivo.', 'Two A5 pages: one for the payer, one for the file.'), default: false },
    { name: 'notaFactura', type: 'toggle', section: 'documento', label: l('Incluir nota «não substitui a factura»', 'Add “does not replace an invoice” note'), help: l('Use quando a entidade também vende bens ou serviços.', 'Use when the entity also sells goods or services.'), default: false },
  ],

  blocks: (ctx) => {
    const v = ctx.values;
    const n = naturezaOf(v);
    const nome = entidadeNome(ctx);
    const valor = money(v.valor);
    const anon = Boolean(v.anonimo) && (v.tipo === 'donativo' || v.tipo === 'oferta');
    const pagador = anon ? 'doador anónimo' : `**${str(v.pagadorNome) || '____________________'}**${str(v.numeroMembro) ? `, membro n.º ${str(v.numeroMembro)}` : ''}${str(v.pagadorNuit) ? `, NUIT ${str(v.pagadorNuit)}` : ''}`;
    const forma = str(v.formaPagamento) || 'numerário';
    const meio = forma === 'numerário' ? 'em numerário' : forma === 'cheque' ? 'por cheque' : forma === 'transferência bancária' ? 'por transferência bancária' : `por ${forma}`;
    const via = str(v.__via);
    const blocks: Block[] = [];
    if (via) blocks.push({ type: 'tags', items: [via] });
    blocks.push({ type: 'title', text: str(v.ref) ? `Recibo n.º ${str(v.ref)}` : 'Recibo' });
    blocks.push({ type: 'amount', label: 'Valor recebido', value: valor != null && valor > 0 ? valor : null });
    blocks.push(
      {
        type: 'paragraph',
        id: 'recebimento',
        text: `**${nome}** declara ter recebido de ${pagador} a quantia de **${valor != null && valor > 0 ? formatMoney(valor) : '____________ MT'}**, referente a ${referente(v)}, paga ${meio}${str(v.referenciaPagamento) && forma !== 'numerário' ? ` (referência ${str(v.referenciaPagamento)})` : ''}.`,
        en: `${nome} acknowledges receipt of the amount stated, paid ${forma}.`,
      },
      {
        type: 'paragraph',
        id: 'quitacao',
        text: `Por ser verdade, passa-se o presente recibo, que dá quitação da quantia recebida e fica registado na contabilidade ${daEntidade(n)}.`,
        en: 'This receipt is issued as discharge for the amount received.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [{ role: str(v.tesoureiroCargo) || 'O Tesoureiro', name: str(v.tesoureiroNome) || undefined, image: 'stamp' }],
      },
    );
    if (v.notaFactura) blocks.push({ type: 'note', text: 'Este recibo não substitui a factura exigida nas vendas de bens e prestações de serviços.', en: 'This receipt does not replace an invoice for sales of goods or services.' });
    return blocks;
  },

  warnings: (v) => {
    const w: Warning[] = [];
    const valor = money(v.valor);
    if (valor == null || valor <= 0) w.push({ level: 'warning', field: 'valor', message: l('Indique o valor recebido.', 'Enter the amount received.') });
    if (!v.anonimo && !str(v.pagadorNome)) w.push({ level: 'warning', field: 'pagadorNome', message: l('Indique quem pagou.', 'Enter who paid.') });
    if (v.anonimo)
      w.push({
        level: 'info',
        field: 'anonimo',
        message: l(
          'As organizações sem fins lucrativos devem conhecer a origem dos fundos que recebem. Em donativos de valor elevado, identifique o doador.',
          'Non-profits must know the origin of the funds they receive. For large donations, identify the donor.',
        ),
      });
    return w;
  },
  personName: (v) => str(v.pagadorNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
});
