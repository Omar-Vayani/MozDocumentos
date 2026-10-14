// Vale de oferta / vale de compra: numbered voucher with a value or a service
// and an expiry date, A6 (four per A4 sheet with cutting marks). It is not a
// fiscal document: the sale is invoiced when the voucher is used.

import { formatDateShort } from '@/lib/format';
import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { formatMoney, l, money } from './_shared';
import { int, semPonto, str } from './_comercio';

/** "VO-0041" + 2 → "VO-0043" (keeps the zero padding). */
function nextNumber(base: string, add: number): string {
  const m = /^(.*?)(\d+)(\D*)$/.exec(base);
  if (!m) return add ? `${base}-${add + 1}` : base;
  const n = String(Number(m[2]) + add).padStart(m[2].length, '0');
  return `${m[1]}${n}${m[3]}`;
}

export default defineTemplate({
  id: 'vale-oferta',
  family: 'declaracao',
  page: 'A6',
  verticalAlign: 'center',
  frame: 'double',
  noBrand: true,
  letterhead: false,
  repeat: (v) => {
    const q = Math.max(1, Math.min(40, int(v.quantidade) ?? 1));
    const base = str(v.numeroInicial);
    if (q === 1) return undefined;
    return Array.from({ length: q }, (_, i) => ({ numeroImpresso: base ? nextNumber(base, i) : '' }));
  },
  sections: [
    { id: 'vale', title: l('Vale', 'Voucher') },
    { id: 'numeracao', title: l('Numeração e validade', 'Numbering and validity') },
    { id: 'condicoes', title: l('Condições', 'Conditions') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'radio',
      section: 'vale',
      label: l('Tipo', 'Type'),
      options: [
        { value: 'oferta', label: l('Vale de oferta (presente)', 'Gift voucher') },
        { value: 'compra', label: l('Vale de compra (crédito por troca)', 'Store credit (exchange)') },
      ],
      default: 'oferta',
    },
    { name: 'valor', type: 'money', section: 'vale', width: 'half', label: l('Valor', 'Value'), help: l('Ou descreva um serviço no campo seguinte.', 'Or describe a service in the next field.') },
    { name: 'servico', type: 'text', section: 'vale', width: 'half', label: l('Ou serviço oferecido', 'Or service offered'), placeholder: l('Ex.: 1 massagem relaxante de 60 minutos', 'E.g. one 60-minute massage') },
    { name: 'beneficiario', type: 'text', section: 'vale', width: 'half', label: l('Para (opcional)', 'To (optional)') },
    { name: 'oferecidoPor', type: 'text', section: 'vale', width: 'half', label: l('Oferecido por (opcional)', 'From (optional)'), showIf: (v) => v.tipo !== 'compra' },
    { name: 'numeroInicial', type: 'text', section: 'numeracao', width: 'half', label: l('Número (do primeiro vale)', 'Number (first voucher)'), default: 'VO-0001', help: l('Os vales seguintes são numerados a partir deste.', 'Following vouchers are numbered from this one.') },
    { name: 'quantidade', type: 'number', section: 'numeracao', width: 'half', min: 1, max: 40, default: 4, label: l('Quantidade de vales', 'Number of vouchers'), help: l('Quatro cabem numa folha A4.', 'Four fit on an A4 sheet.') },
    { name: 'dataEmissao', type: 'date', section: 'numeracao', width: 'half', label: l('Data de emissão', 'Issue date'), default: (c) => c.today },
    { name: 'validade', type: 'date', section: 'numeracao', width: 'half', required: true, label: l('Válido até', 'Valid until') },
    { name: 'locais', type: 'text', section: 'condicoes', label: l('Válido em', 'Valid at'), default: (c) => c.profile?.nomeComercial || profileDisplayName(c.profile) || '' },
    {
      name: 'utilizacao',
      type: 'radio',
      section: 'condicoes',
      label: l('Utilização', 'Use'),
      options: [
        { value: 'unica', label: l('Numa só compra', 'In one purchase') },
        { value: 'parcial', label: l('Em várias compras até esgotar o valor', 'Over several purchases') },
      ],
      default: 'unica',
    },
    { name: 'condicoesExtra', type: 'text', section: 'condicoes', label: l('Outras condições (opcional)', 'Other conditions (optional)') },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!v.validade) w.push({ level: 'warning', field: 'validade', message: l('Indique a validade. Vales sem validade ficam em aberto.', 'Set an expiry date. Vouchers without one stay open.') });
    if (money(v.valor) == null && !str(v.servico)) w.push({ level: 'warning', field: 'valor', message: l('Indique o valor ou o serviço oferecido.', 'Enter the value or the service.') });
    w.push({
      level: 'info',
      message: l(
        'O vale não é uma factura. Quando for usado, emita a factura da venda no seu programa certificado ou livro de facturas. Registe os números emitidos para evitar falsificações.',
        'The voucher is not an invoice. When it is used, issue the sale invoice from your certified software or invoice book. Keep a record of the numbers issued.',
      ),
    });
    return w;
  },

  personName: (v) => v.beneficiario || v.numeroInicial,
  documentDate: (v) => v.dataEmissao,

  blocks: (ctx) => {
    const v: Values = ctx.values;
    const p = ctx.profile;
    const valor = money(v.valor);
    const numero = str(v.numeroImpresso) || str(v.numeroInicial);
    const compra = v.tipo === 'compra';
    const condicoes = [
      str(v.locais) ? `Válido em ${semPonto(v.locais)}.` : '',
      'Não convertível em dinheiro.',
      v.utilizacao === 'parcial' ? 'Pode ser usado em várias compras até esgotar o valor.' : 'Utilização numa só compra.',
      'Não é substituído em caso de perda.',
      str(v.condicoesExtra) ? `${semPonto(v.condicoesExtra)}.` : '',
    ].filter(Boolean).join(' ');
    const linhas = [
      `Para: ${str(v.beneficiario) || '______________________'}`,
      !compra && str(v.oferecidoPor) ? `Oferecido por: ${str(v.oferecidoPor)}` : '',
    ].filter(Boolean);

    const blocks: Block[] = [
      { type: 'logo', size: 'md' },
      { type: 'display', text: profileDisplayName(p) || ' ', size: 'xs', tone: 'muted', uppercase: true, after: 10 },
      { type: 'display', text: compra ? 'Vale de compra' : 'Vale de oferta', size: 'xl', weight: 'bold', tone: 'accent', uppercase: true, after: 4 },
      { type: 'ornament', style: 'tricolour' },
      { type: 'spacer', size: 'small' },
      valor != null
        ? { type: 'display', text: formatMoney(valor), size: 'xxl', weight: 'bold', after: 4, fit: true }
        : { type: 'display', text: str(v.servico) || '______________________', size: 'md', weight: 'bold', after: 4 },
    ];
    if (valor != null && str(v.servico)) blocks.push({ type: 'display', text: str(v.servico), size: 'sm', after: 3 });
    if (linhas.length) blocks.push({ type: 'display', text: linhas.join('\n'), size: 'sm', italic: true, after: 10 });
    blocks.push(
      { type: 'display', text: `Válido até ${v.validade ? formatDateShort(v.validade) : '___/___/______'}   ·   N.º ${numero || '________'}`, size: 'sm', weight: 'bold', after: 6 },
      { type: 'display', text: condicoes, size: 'xs', tone: 'muted', after: 4 },
      { type: 'display', text: `Emitido em ${formatDateShort(v.dataEmissao)}   ·   Carimbo: ______________`, size: 'xs', tone: 'muted', after: 0 },
    );
    return blocks;
  },
});
