import { addDays, formatPercent, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, formatMoney, l, lineItems, localField, money, placeDate, refField } from './_shared';
import { clinicianFields, clinicianSignature, clinicianWarnings, patientFields } from './_saude';

const PAGAMENTO_OPTIONS = [
  { value: 'fase', label: l('No fim de cada fase', 'At the end of each phase'), pt: 'O pagamento é feito no fim de cada fase do tratamento, pelo valor dos actos realizados.' },
  { value: 'sinal', label: l('Sinal no início e o restante no fim', 'Deposit at the start, balance at the end'), pt: 'O doente paga um sinal no início do tratamento e o restante na última consulta.' },
  { value: 'integral', label: l('Pagamento integral antes do início', 'Full payment before starting'), pt: 'O valor total é pago antes do início do tratamento.' },
  { value: 'consulta', label: l('Em cada consulta', 'At each appointment'), pt: 'Cada acto é pago na consulta em que é realizado.' },
];

/** FDI two-digit tooth numbers: permanent 11–48, deciduous 51–85. */
function dentesInvalidos(s: string): string[] {
  return (s.match(/\b\d{2}\b/g) ?? []).filter((t) => {
    const q = Number(t[0]);
    const d = Number(t[1]);
    if (q >= 1 && q <= 4) return d < 1 || d > 8;
    if (q >= 5 && q <= 8) return d < 1 || d > 5;
    return true;
  });
}

type Item = { fase: string; dente: string; procedimento: string; qtd: number; preco: number | null; total: number };

function itens(v: Values): Item[] {
  return lineItems(v.itens)
    .filter((r) => String(r.procedimento ?? '').trim())
    .map((r) => {
      const qtd = r.quantidade === '' || r.quantidade == null ? 1 : Number(r.quantidade) || 0;
      const preco = money(r.preco);
      return { fase: String(r.fase ?? '').trim(), dente: String(r.dente ?? '').trim(), procedimento: String(r.procedimento).trim(), qtd, preco, total: roundMoney(qtd * (preco ?? 0)) };
    });
}

export default defineTemplate({
  id: 'orcamento-tratamento-dentario',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Orçamento', 'Quote') },
    { id: 'doente', title: l('Doente', 'Patient'), personRole: 'cliente' },
    { id: 'plano', title: l('Plano de tratamento', 'Treatment plan') },
    { id: 'condicoes', title: l('Valores e condições', 'Amounts and terms') },
    { id: 'clinico', title: l('Médico dentista', 'Dentist') },
  ],
  fields: [
    { ...refField(), label: l('Orçamento n.º', 'Quote no.') },
    localField(),
    dateField(),
    { name: 'validadeDias', type: 'number', section: 'documento', width: 'half', min: 1, max: 365, default: 30, label: l('Validade (dias)', 'Valid for (days)') },
    ...patientFields(['nome', 'genero', 'telefone', 'processo'], 'doente'),
    { name: 'diagnostico', type: 'textarea', section: 'plano', rows: 2, label: l('Diagnóstico resumido (opcional)', 'Brief diagnosis (optional)'), placeholder: l('Ex.: cárie extensa no 36; gengivite generalizada', 'E.g. deep caries on 36; generalised gingivitis') },
    {
      name: 'itens',
      type: 'lines',
      section: 'plano',
      required: true,
      label: l('Actos previstos', 'Planned procedures'),
      help: l('Dentes em numeração FDI (11 a 48; dentes de leite 51 a 85).', 'Teeth in FDI notation (11–48; baby teeth 51–85).'),
      addLabel: l('Adicionar acto', 'Add procedure'),
      columns: [
        { name: 'fase', type: 'text', label: l('Fase', 'Phase'), placeholder: l('1', '1') },
        { name: 'dente', type: 'text', label: l('Dente(s)', 'Tooth/teeth'), placeholder: l('36', '36') },
        { name: 'procedimento', type: 'text', label: l('Procedimento', 'Procedure'), placeholder: l('Ex.: restauração em compósito', 'E.g. composite filling') },
        { name: 'quantidade', type: 'number', label: l('Qtd.', 'Qty'), min: 1 },
        { name: 'preco', type: 'money', label: l('Preço unitário', 'Unit price') },
      ],
    },
    { name: 'desconto', type: 'money', section: 'condicoes', width: 'half', label: l('Desconto (MT, opcional)', 'Discount (MT, optional)') },
    {
      name: 'isentoIva',
      type: 'toggle',
      section: 'condicoes',
      default: true,
      label: l('Serviços isentos de IVA', 'VAT-exempt services'),
      help: l('Os serviços médicos e dentários estão, em regra, isentos de IVA. Desligue se o seu caso não estiver isento.', 'Medical and dental services are generally VAT-exempt. Turn off if yours is not.'),
    },
    { name: 'pagamento', type: 'select', section: 'condicoes', width: 'half', label: l('Forma de pagamento', 'Payment terms'), options: PAGAMENTO_OPTIONS.map(({ value, label }) => ({ value, label })), default: 'fase' },
    { name: 'sinal', type: 'money', section: 'condicoes', width: 'half', label: l('Valor do sinal', 'Deposit'), showIf: (v) => v.pagamento === 'sinal' },
    { name: 'faltas', type: 'toggle', section: 'condicoes', label: l('Cobrar faltas a consultas sem aviso prévio', 'Charge for missed appointments without notice') },
    { name: 'faltasHoras', type: 'number', section: 'condicoes', width: 'half', min: 1, max: 72, default: 24, label: l('Aviso mínimo (horas)', 'Minimum notice (hours)'), showIf: (v) => Boolean(v.faltas) },
    ...clinicianFields('clinico').map((f) => (f.name === 'clinicoCategoria' ? { ...f, default: 'dentista' } : f)),
  ],

  computed: (v, ctx) => {
    const list = itens(v);
    const subtotal = roundMoney(list.reduce((s, i) => s + i.total, 0));
    const desconto = Math.min(money(v.desconto) ?? 0, subtotal);
    const base = roundMoney(subtotal - desconto);
    const taxa = v.isentoIva ? 0 : ctx.legal.value<number>('ivaTaxaNormal');
    const iva = roundMoney(base * taxa);
    return { subtotal, desconto, base, taxa, iva, total: roundMoney(base + iva) };
  },

  warnings: (v) => {
    const w: Warning[] = [...clinicianWarnings(v)];
    const list = itens(v);
    if (!list.length) w.push({ level: 'error', field: 'itens', message: l('Indique pelo menos um acto.', 'Enter at least one procedure.') });
    const bad = list.flatMap((i) => dentesInvalidos(i.dente));
    if (bad.length) w.push({ level: 'warning', field: 'itens', message: l(`Numeração de dente inválida: ${bad.join(', ')} (use FDI 11 a 48 ou 51 a 85).`, `Invalid tooth number: ${bad.join(', ')} (use FDI 11–48 or 51–85).`) });
    if (list.some((i) => i.preco == null)) w.push({ level: 'warning', field: 'itens', message: l('Há actos sem preço.', 'Some procedures have no price.') });
    if (v.isentoIva) {
      w.push({ level: 'info', field: 'isentoIva', message: l(`Confirme a isenção de IVA aplicável aos seus serviços (${cite('servicosSaudeIva')}).`, `Confirm the VAT exemption that applies (${cite('servicosSaudeIva')}).`) });
    }
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const list = itens(v);
    const fases = new Set(list.map((i) => i.fase).filter(Boolean));
    const rows: string[][] = [];
    let last = '';
    for (const i of list) {
      if (fases.size > 1 && i.fase && i.fase !== last) {
        rows.push([`§ Fase ${i.fase}`, '', '', '', '']);
        last = i.fase;
      }
      rows.push([i.dente, i.procedimento, String(i.qtd), i.preco != null ? formatMoney(i.preco, false) : '—', formatMoney(i.total, false)]);
    }
    const totals: string[][] = [['', 'Subtotal', '', '', formatMoney(c.subtotal, false)]];
    if (c.desconto > 0) totals.push(['', 'Desconto', '', '', `− ${formatMoney(c.desconto, false)}`]);
    if (!v.isentoIva) totals.push(['', `IVA (${formatPercent(c.taxa)})`, '', '', formatMoney(c.iva, false)]);

    const dias = Number(v.validadeDias) || 0;
    const ate = dias > 0 && v.data ? addDays(v.data, dias) : '';
    const pg = PAGAMENTO_OPTIONS.find((p) => p.value === v.pagamento) ?? PAGAMENTO_OPTIONS[0];
    const cond: string[] = [];
    cond.push(
      v.isentoIva ? 'Serviços de saúde isentos de IVA.' : `Valores com IVA à taxa de ${formatPercent(c.taxa)}.`,
      v.pagamento === 'sinal' && money(v.sinal) ? `${pg.pt} Sinal: ${formatMoney(money(v.sinal))}.` : pg.pt,
      'O plano pode ser alterado se, durante o tratamento, surgirem situações clínicas que não eram detectáveis no diagnóstico inicial; qualquer alteração de preço é comunicada previamente ao doente.',
    );
    if (v.faltas) cond.push(`As faltas a consultas marcadas sem aviso com pelo menos ${Number(v.faltasHoras) || '____'} horas de antecedência podem ser cobradas.`);
    if (ate) cond.push(`Este orçamento é válido até ${dateLong(ate)}.`);

    const blocks: Block[] = [
      { type: 'title', text: 'Orçamento de Tratamento Dentário', subtitle: v.ref ? `N.º ${v.ref}` : undefined },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Doente', value: v.doenteNome || '____________________' },
          ...(v.doenteProcesso ? [{ label: 'Processo n.º', value: String(v.doenteProcesso) }] : []),
          ...(v.doenteTelefone ? [{ label: 'Contacto', value: String(v.doenteTelefone) }] : []),
        ],
      },
    ];
    if (v.diagnostico) blocks.push({ type: 'paragraph', id: 'diagnostico', text: `**Diagnóstico:** ${v.diagnostico}`, en: `Diagnosis: ${v.diagnostico}` });
    blocks.push(
      {
        type: 'table',
        columns: [
          { label: 'Dente', width: 9 },
          { label: 'Procedimento', width: 49 },
          { label: 'Qtd.', width: 8, align: 'right' },
          { label: 'Preço unit.', width: 16, align: 'right' },
          { label: 'Total', width: 18, align: 'right' },
        ],
        rows: rows.length ? rows : [['—', '____________________', '', '', '']],
        totals,
      },
      { type: 'amount', label: 'Total do orçamento', value: list.length ? c.total : null },
      { type: 'heading', text: 'Condições' },
      { type: 'list', style: 'bullet', items: cond },
      {
        type: 'paragraph',
        id: 'aceitacao',
        text: 'Tomei conhecimento do plano de tratamento e do orçamento acima, que aceito.',
        en: 'I have read and accept the treatment plan and quote above.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [clinicianSignature(ctx), { role: v.doenteGenero === 'F' ? 'A Doente' : 'O Doente', name: v.doenteNome || undefined }],
      },
    );
    return blocks;
  },
});
