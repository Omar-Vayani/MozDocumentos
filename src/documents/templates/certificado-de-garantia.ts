// Certificado de garantia: warranty card handed to the customer with the
// product, linked to the invoice. Consumer goods carry at least the legal
// minimum warranty (Lei de Defesa do Consumidor).

import { addMonths, formatDateShort } from '@/lib/format';
import { profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, l, refField } from './_shared';
import { int, semPonto, str } from './_comercio';

export default defineTemplate({
  id: 'certificado-de-garantia',
  family: 'declaracao',
  page: 'A5-paisagem',
  frame: 'simple',
  noBrand: true,
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Certificado', 'Certificate') },
    { id: 'produto', title: l('Produto', 'Product') },
    { id: 'cliente', title: l('Cliente', 'Customer'), personRole: 'cliente' },
    { id: 'garantia', title: l('Garantia', 'Warranty') },
  ],
  fields: [
    { ...refField(), label: l('Número do certificado', 'Certificate number') },
    {
      name: 'estadoProduto',
      type: 'radio',
      section: 'documento',
      label: l('Garantia de', 'Warranty for'),
      options: [
        { value: 'novo', label: l('Produto novo', 'New product') },
        { value: 'usado', label: l('Produto usado', 'Used product') },
        { value: 'reparacao', label: l('Reparação efectuada', 'Repair carried out') },
      ],
      default: 'novo',
    },
    { name: 'produto', type: 'text', section: 'produto', required: true, label: l('Produto', 'Product'), placeholder: l('Ex.: Frigorífico combinado 300 L', 'E.g. 300 L fridge-freezer') },
    { name: 'marcaModelo', type: 'text', section: 'produto', width: 'half', label: l('Marca e modelo', 'Make and model') },
    { name: 'numeroSerie', type: 'text', section: 'produto', width: 'half', required: true, label: l('N.º de série / IMEI / chassi', 'Serial no. / IMEI / chassis') },
    { name: 'dataCompra', type: 'date', section: 'produto', width: 'half', required: true, label: l('Data da compra ou da reparação', 'Purchase or repair date'), default: (c) => c.today },
    { name: 'facturaNumero', type: 'text', section: 'produto', width: 'half', required: true, label: l('Factura n.º', 'Invoice no.'), legal: l('Liga a garantia ao documento fiscal da venda.', 'Links the warranty to the sale’s tax invoice.') },
    { name: 'clienteNome', type: 'text', section: 'cliente', width: 'half', label: l('Nome do cliente', 'Customer name'), personKey: 'nome' },
    { name: 'clienteContacto', type: 'tel', section: 'cliente', width: 'half', label: l('Contacto', 'Phone'), personKey: 'telefone' },
    { name: 'garantiaMeses', type: 'number', section: 'garantia', width: 'half', min: 1, max: 120, default: 12, label: l('Prazo de garantia (meses)', 'Warranty period (months)') },
    { name: 'localAssistencia', type: 'text', section: 'garantia', width: 'half', label: l('Onde accionar a garantia', 'Where to claim'), default: (c) => [c.profile ? addressLine(c.profile) : '', c.profile?.telefones].filter(Boolean).join(' · ') },
    {
      name: 'exclusoes',
      type: 'textarea',
      section: 'garantia',
      rows: 2,
      label: l('Exclusões', 'Exclusions'),
      default: 'mau uso, quedas, humidade, oscilações de corrente, instalação incorrecta, intervenção de pessoas não autorizadas e desgaste normal de consumíveis (baterias, lâmpadas, filtros)',
    },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const minimo = ctx.legal.value<{ movelMeses: number }>('consumidorGarantia').movelMeses;
    const gm = int(v.garantiaMeses);
    if (v.estadoProduto === 'novo' && (gm == null || gm < minimo)) {
      w.push({ level: 'error', field: 'garantiaMeses', message: l(`A garantia legal mínima dos bens duradouros novos é de ${minimo} meses (${cite('consumidorGarantia')}).`, `The legal minimum warranty for new durable goods is ${minimo} months.`) });
    } else if (v.estadoProduto !== 'novo' && gm != null && gm < minimo) {
      w.push({ level: 'warning', field: 'garantiaMeses', message: l('Confirme se pode dar um prazo inferior a um ano a um consumidor: a lei não o prevê expressamente para bens usados ou reparações.', 'Check whether you may give a consumer less than one year: the law does not expressly provide for it for used goods or repairs.') });
    }
    if (!str(v.facturaNumero)) w.push({ level: 'warning', field: 'facturaNumero', message: l('Indique o número da factura da venda.', 'Enter the sale invoice number.') });
    return w;
  },

  personName: (v) => v.clienteNome || v.produto,
  documentDate: (v) => v.dataCompra,

  blocks: (ctx) => {
    const v = ctx.values;
    const p = ctx.profile;
    const nome = profileDisplayName(p) || BLANK;
    const gm = int(v.garantiaMeses);
    const ate = gm && v.dataCompra ? formatDateShort(addMonths(v.dataCompra, gm)) : '';
    const reparacao = v.estadoProduto === 'reparacao';
    const objecto = reparacao ? 'a reparação efectuada no produto acima identificado' : 'o bom funcionamento do produto acima identificado';
    const emissor = [nome, p?.nuit ? `NUIT ${p.nuit}` : '', [p?.telefones, p?.email].filter(Boolean).join(' · ')].filter(Boolean).join('  ·  ');

    const blocks: Block[] = [
      { type: 'logo', size: 'sm' },
      { type: 'display', text: emissor, size: 'xs', tone: 'muted', after: 4 },
      { type: 'display', text: 'Certificado de garantia', size: 'xl', weight: 'bold', tone: 'accent', uppercase: true, after: 1, fit: true },
      { type: 'display', text: `N.º ${str(v.ref) || '__________'}`, size: 'xs', tone: 'muted', after: 6 },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Produto', value: str(v.produto) || BLANK },
          { label: 'Marca / modelo', value: str(v.marcaModelo) || BLANK },
          { label: 'N.º série / IMEI', value: str(v.numeroSerie) || BLANK },
          { label: 'Factura n.º', value: str(v.facturaNumero) || BLANK },
          { label: reparacao ? 'Data da reparação' : 'Data da compra', value: formatDateShort(v.dataCompra) },
          { label: 'Garantia', value: gm ? `${gm} ${gm === 1 ? 'mês' : 'meses'}${ate ? `, até ${ate}` : ''}` : BLANK },
          { label: 'Cliente', value: str(v.clienteNome) || BLANK },
          { label: 'Contacto', value: str(v.clienteContacto) || BLANK },
        ],
      },
      {
        type: 'paragraph',
        id: 'ga-cobertura',
        size: 'small',
        text: `**${nome}** garante ${objecto} pelo prazo indicado, a contar da data ${reparacao ? 'da reparação' : 'da compra'}, nos termos da Lei de Defesa do Consumidor. Durante a garantia, os defeitos são reparados gratuitamente ou, não sendo possível, o produto é substituído, o preço reduzido ou o valor restituído. O prazo suspende-se enquanto o produto estiver em reparação.`,
        en: 'The seller warrants the product (or repair) for the stated period. Defects are repaired free of charge or, failing that, the product is replaced, the price reduced or refunded. The period is suspended during repairs.',
      },
      {
        type: 'paragraph',
        id: 'ga-exclusoes',
        size: 'small',
        text: `A garantia não cobre: ${semPonto(v.exclusoes) || BLANK}. Para a accionar, apresente este certificado e a factura${str(v.localAssistencia) ? ` em ${semPonto(v.localAssistencia)}` : ''}.`,
        en: 'Exclusions as listed. To claim, present this certificate and the invoice.',
        keepWithNext: true,
      },
      { type: 'signatures', columns: [{ role: 'O Vendedor (assinatura e carimbo)', name: p?.representanteNome || (p?.kind === 'pessoa' ? p.nome : undefined) || undefined, image: 'both' }] },
    ];
    return blocks;
  },
});
