import { defineTemplate, type Block, type FieldDef, type SignatureColumn, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateField, formatMoney, isF, l, lawyerFields, lawyerSignature, lineItems, localField, money, placeDate } from './_shared';
import { courtAddressee, courtFields } from './_advocacia';
import { fechoField, sem, str } from './_processo-civil';

const bensField = (name: string, label: string, en: string, placeholder: string): FieldDef => ({
  name,
  type: 'lines',
  section: 'activo',
  label: l(label, en),
  addLabel: l('Adicionar verba', 'Add item'),
  columns: [
    { name: 'descricao', type: 'text', label: l('Descrição', 'Description'), placeholder: l(placeholder, 'Description') },
    { name: 'valor', type: 'money', label: l('Valor', 'Value') },
  ],
  default: [],
});

const GRUPOS = [
  { name: 'dinheiro', titulo: 'Dinheiro, depósitos e créditos' },
  { name: 'moveis', titulo: 'Bens móveis' },
  { name: 'imoveis', titulo: 'Bens imóveis e direitos sobre a terra' },
  { name: 'participacoes', titulo: 'Participações sociais e outros direitos' },
];

export default defineTemplate({
  id: 'relacao-de-bens',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e processo', 'Court and case') },
    { id: 'cabeca', title: l('Cabeça-de-casal', 'Estate administrator'), personRole: 'cliente' },
    { id: 'activo', title: l('Activo (bens)', 'Assets') },
    { id: 'passivo', title: l('Passivo (dívidas)', 'Liabilities') },
    { id: 'advogado', title: l('Advogado (opcional)', 'Lawyer (optional)') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    { name: 'processoNumero', type: 'text', section: 'tribunal', width: 'half', required: true, label: l('Processo n.º', 'Case no.') },
    ...courtFields('tribunal'),
    { name: 'falecidoNome', type: 'text', section: 'tribunal', required: true, label: l('Inventário por óbito de', 'Estate of'), help: l('Na partilha após divórcio, escreva o nome do ex-cônjuge e escolha a opção abaixo.', 'For division after divorce, write the former spouse’s name and pick the option below.') },
    { name: 'divorcio', type: 'toggle', section: 'tribunal', label: l('Inventário para partilha após divórcio', 'Division after divorce') },
    { name: 'cabecaNome', type: 'text', section: 'cabeca', required: true, label: l('Nome do cabeça-de-casal', 'Administrator’s name'), personKey: 'nome' },
    { name: 'cabecaGenero', type: 'radio', section: 'cabeca', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'F', personKey: 'genero' },
    bensField('dinheiro', 'Dinheiro, depósitos e créditos', 'Cash, deposits and receivables', 'Ex.: saldo da conta n.º 0012345 do BCI à data do óbito'),
    bensField('moveis', 'Bens móveis', 'Movable property', 'Ex.: viatura Toyota Hilux, matrícula AFG 123 MC'),
    bensField('imoveis', 'Bens imóveis e direitos sobre a terra', 'Real estate and land rights', 'Ex.: prédio urbano no Bairro da Malhangalene, descrito sob o n.º 12345'),
    bensField('participacoes', 'Participações sociais e outros direitos', 'Shares and other rights', 'Ex.: quota na sociedade X, Lda, no valor nominal de 50.000,00 MT'),
    {
      name: 'passivo',
      type: 'lines',
      section: 'passivo',
      label: l('Dívidas da herança', 'Debts of the estate'),
      addLabel: l('Adicionar dívida', 'Add debt'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Credor e origem', 'Creditor and origin'), placeholder: l('Ex.: Banco X — empréstimo à habitação', 'E.g. Bank X — mortgage') },
        { name: 'valor', type: 'money', label: l('Valor', 'Value') },
      ],
      default: [],
    },
    { name: 'temAdvogado', type: 'toggle', section: 'advogado', default: true, label: l('Assinada também pelo advogado', 'Also signed by the lawyer') },
    ...lawyerFields('advogado').map((f) => ({ ...f, showIf: (v: Record<string, unknown>) => Boolean(v.temAdvogado) })),
    localField('documento'),
    dateField('data', 'documento'),
    fechoField('documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      { level: 'info', message: l(`Relacione todos os bens, com valor, e as dívidas da herança; os interessados podem reclamar contra a relação por falta, excesso ou valor (${cite('pcInventario')}). A sonegação de bens tem consequências legais.`, 'List all assets with values and the debts; interested parties may object. Concealing assets has legal consequences.') },
    ];
    const n = GRUPOS.reduce((s, g) => s + lineItems(v[g.name]).length, 0);
    if (n === 0) w.push({ level: 'warning', field: 'dinheiro', message: l('Relacione pelo menos um bem.', 'List at least one asset.') });
    return w;
  },

  personName: (v) => v.falecidoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.cabecaGenero);
    const falecido = `**${(str(v.falecidoNome) || '____________').toLocaleUpperCase('pt')}**`;
    const rows: string[][] = [];
    let n = 0;
    let activo = 0;
    for (const g of GRUPOS) {
      const items = lineItems(v[g.name]).filter((i) => str(i.descricao));
      if (!items.length) continue;
      rows.push([`§ ${g.titulo}`, '', '']);
      let sub = 0;
      for (const i of items) {
        n++;
        const val = money(i.valor);
        sub += val ?? 0;
        rows.push([`${n}.ª`, sem(i.descricao), formatMoney(val)]);
      }
      activo += sub;
      rows.push(['= ', `Subtotal — ${g.titulo.toLocaleLowerCase('pt')}`, formatMoney(sub)]);
    }
    if (!rows.length) rows.push(['1.ª', '____________________', formatMoney(null)]);
    const dividas = lineItems(v.passivo).filter((i) => str(i.descricao));
    const passivo = dividas.reduce((s, d) => s + (money(d.valor) ?? 0), 0);

    const cols: SignatureColumn[] = [{ role: f ? 'A Cabeça-de-Casal' : 'O Cabeça-de-Casal', name: str(v.cabecaNome) || undefined }];
    if (v.temAdvogado) cols.push(lawyerSignature(v));
    const blocks: Block[] = [
      { type: 'courtHeader', processo: str(v.processoNumero) || '________/______', extra: str(v.seccao) || undefined, addressee: courtAddressee(v) },
      {
        type: 'paragraph',
        id: 'identificacao',
        text: `**${(str(v.cabecaNome) || '____________').toLocaleUpperCase('pt')}**, cabeça-de-casal nos autos de inventário ${v.divorcio ? `para partilha dos bens comuns do casal que formou com ${falecido}` : `por óbito de ${falecido}`}, tendo prestado compromisso de honra, vem apresentar a`,
        en: 'The estate administrator in the inventory proceedings files the',
      },
      { type: 'paragraph', id: 'titulo', align: 'center', text: '**RELAÇÃO DE BENS**', en: 'LIST OF ASSETS' },
      { type: 'paragraph', id: 'activoTitulo', align: 'center', text: '**I — ACTIVO**', en: 'I — Assets', keepWithNext: true },
      {
        type: 'table',
        columns: [
          { label: 'Verba', width: 12, align: 'center' },
          { label: 'Descrição', width: 63 },
          { label: 'Valor', width: 25, align: 'right' },
        ],
        rows,
        totals: [['', 'Total do activo', formatMoney(activo)]],
      },
      { type: 'paragraph', id: 'passivoTitulo', align: 'center', text: '**II — PASSIVO**', en: 'II — Liabilities', keepWithNext: true },
    ];
    if (dividas.length) {
      blocks.push({
        type: 'table',
        columns: [
          { label: 'Verba', width: 12, align: 'center' },
          { label: 'Credor e origem da dívida', width: 63 },
          { label: 'Valor', width: 25, align: 'right' },
        ],
        rows: dividas.map((d, i) => [`${i + 1}.ª`, sem(d.descricao), formatMoney(money(d.valor))]),
        totals: [['', 'Total do passivo', formatMoney(passivo)]],
      });
    } else {
      blocks.push({ type: 'paragraph', id: 'semPassivo', text: 'Não há dívidas da herança a relacionar.', en: 'There are no debts.' });
    }
    blocks.push(
      { type: 'keyValue', items: [{ label: 'Total do activo', value: formatMoney(activo) }, { label: 'Total do passivo', value: formatMoney(passivo) }, { label: 'Valor líquido a partilhar', value: formatMoney(activo - passivo) }] },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `${f ? 'A cabeça-de-casal' : 'O cabeça-de-casal'} declara que não tem conhecimento de outros bens ou dívidas a relacionar, protestando relacionar os que venham ao seu conhecimento.`,
        en: 'The administrator declares that no other assets or debts are known and undertakes to list any that become known.',
      },
      { type: 'paragraph', id: 'fecho', align: 'center', text: `**${str(v.fecho) || 'Pede deferimento.'}**`, en: 'Requests approval.', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: cols },
    );
    return blocks;
  },
});
