// Política de trocas, devoluções e garantia: notice displayed in the shop.
// The legal warranty and the consumer's rights for defective goods cannot be
// excluded; a voluntary exchange policy for non-defective goods is free.

import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type Warning } from '../model';
import { cite, l } from './_shared';
import { int, semPonto, str } from './_comercio';

const EXCLUSOES = [
  { value: 'interior', label: 'roupa interior e fatos de banho' },
  { value: 'higiene', label: 'produtos de higiene e cosmética abertos' },
  { value: 'alimentos', label: 'alimentos e bebidas' },
  { value: 'medida', label: 'produtos feitos ou cortados por medida' },
  { value: 'recargas', label: 'recargas, cartões pré-pagos e vouchers' },
  { value: 'software', label: 'software, jogos e filmes abertos' },
  { value: 'promocao', label: 'artigos em promoção ou saldo' },
];

export default defineTemplate({
  id: 'politica-trocas-devolucoes',
  family: 'declaracao',
  page: (v) => (v.formato === 'A5' ? 'A5' : 'A4'),
  frame: 'simple',
  verticalAlign: 'center',
  noBrand: true,
  letterhead: false,
  sections: [
    { id: 'loja', title: l('Loja', 'Shop') },
    { id: 'garantia', title: l('Garantia', 'Warranty') },
    { id: 'trocas', title: l('Trocas sem defeito (opcional)', 'Exchanges without defect (optional)') },
    { id: 'contacto', title: l('Contacto', 'Contact') },
  ],
  fields: [
    { name: 'lojaNome', type: 'text', section: 'loja', label: l('Nome da loja', 'Shop name'), default: (c) => c.profile?.nomeComercial || profileDisplayName(c.profile) || '' },
    {
      name: 'formato',
      type: 'radio',
      section: 'loja',
      label: l('Tamanho do aviso', 'Notice size'),
      options: [
        { value: 'A4', label: l('A4 (afixar na loja)', 'A4 (shop poster)') },
        { value: 'A5', label: l('A5 (balcão ou junto à caixa)', 'A5 (counter or till)') },
      ],
      default: 'A4',
    },
    { name: 'mostrarLogo', type: 'toggle', section: 'loja', default: true, label: l('Mostrar o logótipo do perfil', 'Show the profile logo') },
    { name: 'garantiaMeses', type: 'number', section: 'garantia', width: 'half', min: 0, max: 120, default: 12, label: l('Garantia dos produtos novos (meses)', 'Warranty on new products (months)'), help: l('Nunca inferior ao mínimo legal para bens duradouros.', 'Never below the legal minimum for durable goods.') },
    { name: 'vendaDistancia', type: 'toggle', section: 'garantia', label: l('Também vende por telefone, internet ou ao domicílio', 'Also sells by phone, online or door to door') },
    { name: 'trocasSemDefeito', type: 'toggle', section: 'trocas', default: true, label: l('Aceita trocas de produtos sem defeito', 'Accepts exchanges of non-defective products') },
    { name: 'prazoTrocaDias', type: 'number', section: 'trocas', width: 'half', min: 1, max: 90, default: 7, label: l('Prazo para trocas (dias)', 'Exchange period (days)'), showIf: (v) => Boolean(v.trocasSemDefeito) },
    {
      name: 'formaTroca',
      type: 'select',
      section: 'trocas',
      width: 'half',
      label: l('Em troca, o cliente recebe', 'The customer receives'),
      options: [
        { value: 'produto', label: l('Outro produto', 'Another product') },
        { value: 'produtoVale', label: l('Outro produto ou vale de compra', 'Another product or store credit') },
        { value: 'todos', label: l('Outro produto, vale ou reembolso', 'Product, store credit or refund') },
      ],
      default: 'produtoVale',
      showIf: (v) => Boolean(v.trocasSemDefeito),
    },
    ...EXCLUSOES.map((e, i) => ({
      name: `excluir_${e.value}`,
      type: 'toggle' as const,
      section: 'trocas',
      width: 'half' as const,
      label: l(`Excluir: ${e.label}`, `Exclude: ${e.label}`),
      default: i < 4,
      showIf: (v: Record<string, unknown>) => Boolean(v.trocasSemDefeito),
    })),
    { name: 'outrasExclusoes', type: 'text', section: 'trocas', label: l('Outras exclusões (opcional)', 'Other exclusions (optional)'), showIf: (v) => Boolean(v.trocasSemDefeito) },
    { name: 'contacto', type: 'text', section: 'contacto', label: l('Contacto para reclamações', 'Complaints contact'), default: (c) => [c.profile?.telefones, c.profile?.email].filter(Boolean).join(' · ') },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const minimo = ctx.legal.value<{ movelMeses: number }>('consumidorGarantia').movelMeses;
    const gm = int(v.garantiaMeses);
    if (gm == null || gm < minimo) {
      w.push({ level: 'error', field: 'garantiaMeses', message: l(`A garantia legal mínima dos bens duradouros é de ${minimo} meses (${cite('consumidorGarantia')}).`, `The legal minimum warranty for durable goods is ${minimo} months.`) });
    }
    w.push({
      level: 'info',
      message: l(
        'Esta política não pode afastar os direitos do consumidor em caso de defeito: a frase "não aceitamos devoluções" não vale para produtos com defeito. Tenha também o livro de reclamações disponível.',
        'This policy cannot remove consumer rights for defective goods: "no returns" does not apply to defective products. Keep the complaints book available.',
      ),
    });
    return w;
  },

  personName: (v) => v.lojaNome,
  documentDate: () => undefined,

  blocks: (ctx) => {
    const v = ctx.values;
    const minimo = ctx.legal.value<{ movelMeses: number }>('consumidorGarantia').movelMeses;
    const retract = ctx.legal.value<{ diasUteis: number }>('consumidorRetractacao').diasUteis;
    const meses = Math.max(int(v.garantiaMeses) ?? 0, minimo);
    const garantiaTexto = meses % 12 === 0 ? `${meses / 12} ${meses === 12 ? 'ano' : 'anos'}` : `${meses} meses`;
    const blocks: Block[] = [];
    // Poster typography: large left-aligned lines readable from the counter.
    const head = (text: string) => blocks.push({ type: 'display', text, size: 'lg', weight: 'bold', tone: 'accent', align: 'left', after: 6 });
    const item = (text: string) => blocks.push({ type: 'display', text: `• ${text}`, size: 'md', align: 'left', after: 5 });
    if (v.mostrarLogo !== false) blocks.push({ type: 'logo', size: 'md' });
    if (str(v.lojaNome)) blocks.push({ type: 'display', text: str(v.lojaNome), size: 'sm', tone: 'muted', uppercase: true, after: 4 });
    blocks.push(
      { type: 'display', text: 'Trocas, devoluções e garantia', size: 'xxl', weight: 'bold', tone: 'accent', after: 6, fit: true },
      { type: 'ornament', style: 'tricolour' },
      { type: 'spacer', size: 'small' },
    );
    head('Produtos com defeito');
    item(`Os produtos novos têm garantia de ${garantiaTexto} a contar da data da compra.`);
    item('Se o produto tiver defeito, pode pedir a reparação, a substituição, a redução do preço ou a devolução do dinheiro, nos termos da Lei de Defesa do Consumidor.');
    item('Comunique o defeito logo que o detecte, dentro do prazo da garantia, e apresente a factura ou o talão de compra.');
    item('A garantia não cobre danos por mau uso, quedas, líquidos, oscilações de corrente ou reparações feitas por terceiros.');
    if (v.trocasSemDefeito) {
      const prazo = int(v.prazoTrocaDias);
      const forma = v.formaTroca === 'produto' ? 'por outro produto' : v.formaTroca === 'todos' ? 'por outro produto, por vale de compra ou com reembolso' : 'por outro produto ou por vale de compra';
      const excl = EXCLUSOES.filter((e) => v[`excluir_${e.value}`]).map((e) => e.label);
      if (str(v.outrasExclusoes)) excl.push(semPonto(v.outrasExclusoes));
      blocks.push({ type: 'spacer', size: 'small' });
      head('Trocas de produtos sem defeito');
      item(`Aceitamos trocas no prazo de ${prazo ? `${prazo} ${prazo === 1 ? 'dia' : 'dias'}` : 'indicado na loja'} após a compra, ${forma}.`);
      item('O produto deve estar sem uso, com etiquetas e na embalagem original, acompanhado da factura ou do talão.');
      if (excl.length) item(`Não se aceitam trocas de: ${excl.join('; ')}.`);
    }
    if (v.vendaDistancia) {
      blocks.push({ type: 'spacer', size: 'small' });
      head('Compras por telefone, internet ou ao domicílio');
      item(`Pode desistir da compra no prazo de ${retract} dias úteis a contar da recepção do produto, sem pagar qualquer indemnização. O valor pago é devolvido de imediato.`);
    }
    blocks.push(
      { type: 'spacer', size: 'medium' },
      { type: 'ornament', style: 'rule', width: 'short' },
      { type: 'display', text: `Dispomos de livro de reclamações.${str(v.contacto) ? `\nContacto: ${semPonto(v.contacto)}` : ''}`, size: 'sm', tone: 'muted', after: 3 },
      { type: 'display', text: 'Esta política não afecta os direitos legais do consumidor.', size: 'xs', tone: 'muted', italic: true, after: 0 },
    );
    return blocks;
  },
});
