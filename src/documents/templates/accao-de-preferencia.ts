import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { cite, dateField, dateLong, l, lawyerFields, localField, money } from './_shared';
import { artigos, courtAddressee, courtFields, moneyExt, partyDesc, partyFields } from './_advocacia';
import { closing, formaField, formaTexto, g3, lawyerWarnings, prova, provaFields, sem, str } from './_processo-civil';

const FUND_OPTIONS: FieldOption[] = [
  { value: 'comproprietario', label: l('Comproprietário', 'Co-owner') },
  { value: 'arrendatario', label: l('Arrendatário do prédio', 'Tenant of the property') },
  { value: 'confinante', label: l('Proprietário de terreno confinante', 'Owner of adjoining land') },
  { value: 'convencional', label: l('Pacto de preferência com eficácia real', 'Registered pre-emption agreement') },
  { value: 'outro', label: l('Outro fundamento legal (escrever)', 'Other legal ground (write it)') },
];

const FUND_TEXTO: Record<string, string> = {
  comproprietario: 'comproprietário do bem alienado, gozando do direito de preferência na venda de quota a estranhos',
  arrendatario: 'arrendatário do prédio alienado, gozando do direito de preferência que a lei lhe confere',
  confinante: 'proprietário de terreno confinante, gozando do direito de preferência que a lei lhe confere',
  convencional: 'titular de direito de preferência convencional com eficácia real, devidamente registado',
};

export default defineTemplate({
  id: 'accao-de-preferencia',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal', 'Court') },
    { id: 'autor', title: l('Autor (preferente)', 'Claimant (pre-emption holder)'), personRole: 'cliente' },
    { id: 'reus', title: l('Réus (comprador e vendedor)', 'Defendants (buyer and seller)') },
    { id: 'venda', title: l('A venda e a preferência', 'The sale and the pre-emption right') },
    { id: 'pedido', title: l('Pedido e valor', 'Claim and value') },
    { id: 'prova', title: l('Documentos e testemunhas', 'Documents and witnesses') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...courtFields('tribunal'),
    ...partyFields('autor', 'autor', { defaultTipo: 'pessoa' }),
    ...partyFields('comprador', 'reus', { defaultTipo: 'pessoa', light: true }),
    ...partyFields('vendedor', 'reus', { defaultTipo: 'pessoa', light: true }).map((f) => (f.name === 'vendedorNome' ? { ...f, label: l('Vendedor — nome completo ou firma', 'Seller — full name or company name') } : f)),
    { name: 'fundamento', type: 'select', section: 'venda', required: true, label: l('O autor é', 'The claimant is'), options: FUND_OPTIONS, default: 'arrendatario' },
    { name: 'fundamentoOutro', type: 'text', section: 'venda', label: l('Fundamento (escrever)', 'Ground (write it)'), showIf: (v) => v.fundamento === 'outro' },
    { name: 'bem', type: 'textarea', section: 'venda', rows: 2, required: true, label: l('Bem vendido', 'Property sold'), placeholder: l('Ex.: o prédio urbano sito na Avenida Karl Marx, n.º 820, Maputo, descrito sob o n.º 4567', 'E.g. the building at …') },
    { name: 'dataVenda', type: 'date', section: 'venda', width: 'half', label: l('Data da venda', 'Date of the sale') },
    { name: 'preco', type: 'money', section: 'venda', width: 'half', required: true, label: l('Preço declarado', 'Declared price') },
    { name: 'escritura', type: 'text', section: 'venda', label: l('Escritura ou documento da venda', 'Deed or sale document'), placeholder: l('Ex.: escritura lavrada em 2 de Junho de 2026 no 3.º Cartório Notarial de Maputo', 'E.g. deed of 2 June 2026') },
    { name: 'dataConhecimento', type: 'date', section: 'venda', width: 'half', required: true, label: l('Soube dos elementos da venda em', 'Learned the terms of the sale on') },
    { name: 'factos', type: 'textarea', section: 'venda', rows: 4, label: l('Factos adicionais (um artigo por linha)', 'Additional facts (one article per line)'), help: l('Ex.: o autor não foi notificado para preferir; como soube da venda.', 'E.g. the claimant was not notified; how they learned of the sale.') },
    { name: 'deposito', type: 'radio', section: 'pedido', label: l('Depósito do preço', 'Deposit of the price'), default: 'depositara', options: [
      { value: 'depositado', label: l('Já depositado (junta comprovativo)', 'Already deposited (proof attached)') },
      { value: 'depositara', label: l('Será depositado no prazo legal', 'Will be deposited within the legal time') },
    ] },
    formaField('pedido'),
    { name: 'valorCausa', type: 'money', section: 'pedido', width: 'half', label: l('Valor da causa', 'Value of the case'), help: l('Se vazio, usa o preço.', 'If empty, the price is used.') },
    ...provaFields('prova', { docsPlaceholder: 'Certidão do registo predial\nCópia da escritura de compra e venda\nContrato de arrendamento' }),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v, ctx) => {
    const p = ctx.legal.value<{ meses: number }>('pcPreferencia');
    const w: Warning[] = [
      { level: 'warning', field: 'dataConhecimento', message: l(`A acção de preferência tem de ser proposta no prazo de ${p.meses} meses a contar do conhecimento dos elementos essenciais da venda${v.dataConhecimento ? ` (${dateLong(v.dataConhecimento)})` : ''}, e o preço tem de ser depositado logo após a propositura (${cite('pcPreferencia')}; prazos a confirmar).`, `The action must be filed within ${p.meses} months from learning the essential terms of the sale, and the price deposited right after filing (to be confirmed).`) },
    ];
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.compradorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const A = g3(v, 'autor');
    const C = g3(v, 'comprador');
    const V = g3(v, 'vendedor');
    const OAutor = `${A.O} ${A.w('Autor', 'Autora')}`;
    const bem = sem(v.bem).replace(/^(O|A)\s/, (m) => m.toLowerCase()) || '____________________';
    const fund = v.fundamento === 'outro' ? sem(v.fundamentoOutro) || '____________________' : (FUND_TEXTO[v.fundamento as string] ?? FUND_TEXTO.arrendatario).replace('comproprietário', A.w('comproprietário', 'comproprietária')).replace('arrendatário', A.w('arrendatário', 'arrendatária')).replace('proprietário de', A.w('proprietário de', 'proprietária de'));
    const comprador = `**${(str(v.compradorNome) || '____________').toLocaleUpperCase('pt')}**`;
    const vendedor = `**${(str(v.vendedorNome) || '____________').toLocaleUpperCase('pt')}**`;
    const factos = [
      `${OAutor} é ${fund}, relativamente a ${bem}.`,
      `Por ${sem(v.escritura) || 'escritura'}${v.dataVenda ? `, de ${dateLong(v.dataVenda)}` : ''}, ${vendedor} vendeu o referido bem a ${comprador}, pelo preço declarado de ${moneyExt(v.preco)}.`,
      `${OAutor} não foi ${A.w('notificado', 'notificada')} do projecto de venda nem das respectivas cláusulas, para poder exercer o seu direito.`,
      `${OAutor} só teve conhecimento dos elementos essenciais da venda em ${dateLong(v.dataConhecimento)}.`,
      ...artigos(v.factos),
      v.deposito === 'depositado'
        ? `${OAutor} depositou o preço devido, como comprova o documento junto.`
        : `${OAutor} depositará o preço devido no prazo legal após a propositura da acção.`,
    ];
    const direito = [
      `O titular do direito de preferência a quem não se dê conhecimento da venda tem o direito de haver para si a coisa alienada, desde que o requeira no prazo legal e deposite o preço devido (${cite('pcPreferencia')}).`,
    ];
    const pedidos = [
      `Ser reconhecido o direito de preferência ${A.do} ${A.w('Autor', 'Autora')} na venda do bem identificado`,
      `Ser ${A.o} ${A.w('Autor', 'Autora')} ${A.w('declarado', 'declarada')} com direito a haver para si o referido bem, pelo preço de ${moneyExt(v.preco)}, substituindo-se ${C.ao} ${C.w('comprador', 'compradora')} na posição de adquirente`,
      `Ser ordenado o cancelamento de quaisquer registos feitos a favor ${C.do} ${C.w('comprador', 'compradora')} com base na venda, e o registo a favor ${A.do} ${A.w('Autor', 'Autora')}`,
      'Serem os Réus condenados nas custas e procuradoria condigna',
    ];
    const pv = prova(v);
    const blocks: Block[] = [
      { type: 'courtHeader', addressee: courtAddressee(v) },
      { type: 'paragraph', id: 'autor', text: `${partyDesc(v, 'autor')}, adiante ${A.w('designado', 'designada')} por **${A.w('Autor', 'Autora')}**,`, en: 'Identification of the claimant.' },
      { type: 'paragraph', id: 'propoe', text: 'vem, por intermédio do seu mandatário judicial, propor contra', en: 'through its lawyer, brings against' },
      { type: 'paragraph', id: 'reu1', text: `1.º ${partyDesc(v, 'comprador')}, ${C.w('comprador', 'compradora')};`, en: 'First defendant: the buyer.' },
      { type: 'paragraph', id: 'reu2', text: `2.º ${partyDesc(v, 'vendedor')}, ${V.w('vendedor', 'vendedora')},`, en: 'Second defendant: the seller.' },
      { type: 'paragraph', id: 'reus', text: 'adiante designados por **Réus**,', en: 'hereinafter the defendants,' },
      { type: 'paragraph', id: 'accao', align: 'center', text: `a presente\n**ACÇÃO DE PREFERÊNCIA, SOB A FORMA DE PROCESSO ${formaTexto(v)}**,`, en: 'this pre-emption action,' },
      { type: 'paragraph', id: 'fundamentos', text: 'o que faz nos termos e com os fundamentos seguintes:', en: 'on the following terms and grounds:' },
      { type: 'articulado', sections: [{ heading: 'I — Dos factos', items: factos }, { heading: 'II — Do direito', items: direito }] },
      ...closing(ctx, {
        intro: 'Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, deve a presente acção ser julgada procedente, por provada, e, em consequência:',
        introEn: 'On these grounds, the action should be upheld and:',
        pedidos,
        depois: [{ id: 'citacao', text: 'Para tanto, requer a V. Ex.ª se digne ordenar a citação dos Réus para, querendo, contestar no prazo e sob a cominação legais, seguindo-se os ulteriores termos até final.', en: 'Service on the defendants.' }],
        valor: money(v.valorCausa) ?? money(v.preco),
        docs: pv.docs,
        procuracao: pv.procuracao,
        testemunhas: pv.testemunhas,
      }),
    ];
    return blocks;
  },
});
