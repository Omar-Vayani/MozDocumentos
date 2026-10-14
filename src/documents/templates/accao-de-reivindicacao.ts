import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, l, lawyerFields, localField, money } from './_shared';
import { artigos, courtFields, moneyExt, partyFields } from './_advocacia';
import { closing, formaField, formaTexto, g3, lawyerWarnings, petitionHead, prova, provaFields, sem, str } from './_processo-civil';

export default defineTemplate({
  id: 'accao-de-reivindicacao',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal', 'Court') },
    { id: 'autor', title: l('Autor (proprietário)', 'Claimant (owner)'), personRole: 'cliente' },
    { id: 'reu', title: l('Réu (quem ocupa)', 'Defendant (occupier)'), personRole: 'outro' },
    { id: 'bem', title: l('O bem e o direito', 'The property and the right') },
    { id: 'pedido', title: l('Pedidos e valor', 'Claims and value') },
    { id: 'prova', title: l('Documentos e testemunhas', 'Documents and witnesses') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...courtFields('tribunal').map((f) => (f.name === 'tribunal' ? { ...f, help: l('Para imóveis, o tribunal da área onde se situa o imóvel.', 'For real estate, the court where the property is located.') } : f)),
    ...partyFields('autor', 'autor', { defaultTipo: 'pessoa' }),
    ...partyFields('reu', 'reu', { defaultTipo: 'pessoa', light: true }),
    { name: 'bem', type: 'textarea', section: 'bem', rows: 2, required: true, label: l('Bem reivindicado', 'Property claimed'), placeholder: l('Ex.: o prédio urbano sito na Rua da Beira, n.º 33, Bairro do Alto-Maé, Maputo, descrito na Conservatória do Registo Predial de Maputo sob o n.º 12 345', 'E.g. the building at …, registered under no. …') },
    { name: 'aquisicao', type: 'text', section: 'bem', label: l('Como o adquiriu', 'How it was acquired'), placeholder: l('Ex.: por compra a José Manuel Sitoe, por escritura de 4 de Abril de 2018', 'E.g. by purchase, deed of 4 April 2018') },
    { name: 'registo', type: 'text', section: 'bem', label: l('Registo a favor do autor (opcional)', 'Registration in the claimant’s name (optional)'), placeholder: l('Ex.: inscrição G-2 de 10 de Maio de 2018', 'E.g. entry G-2 of 10 May 2018') },
    { name: 'dataOcupacao', type: 'date', section: 'bem', width: 'half', label: l('O réu ocupa desde', 'Occupied since') },
    {
      name: 'factos',
      type: 'textarea',
      section: 'bem',
      rows: 6,
      label: l('Factos (um artigo por linha)', 'Facts (one article per line)'),
      help: l('Actos de posse do autor, como o réu passou a ocupar, interpelações feitas, recusa em entregar.', 'Claimant’s acts of possession, how the defendant took it, demands made, refusal.'),
    },
    { name: 'indemnizacaoMensal', type: 'money', section: 'pedido', width: 'half', label: l('Indemnização mensal pela ocupação (opcional)', 'Monthly compensation for occupation (optional)'), help: l('Ex.: o valor locativo do imóvel.', 'E.g. the rental value.') },
    { name: 'demolicao', type: 'text', section: 'pedido', label: l('Demolição de obras (opcional)', 'Demolition of works (optional)'), placeholder: l('Ex.: o anexo em alvenaria construído pelo Réu no quintal', 'E.g. the annex built by the defendant') },
    formaField('pedido'),
    { name: 'valorCausa', type: 'money', section: 'pedido', width: 'half', required: true, label: l('Valor da causa (valor do bem)', 'Value of the case (value of the property)') },
    ...provaFields('prova', { docsPlaceholder: 'Certidão do registo predial\nEscritura de compra e venda\nCarta de interpelação' }),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      { level: 'info', message: l(`${cite('pcReivindicacao')}: prove a propriedade (registo, título de aquisição ou usucapião) e a detenção pelo réu. Sobre terra, a Lei de Terras não admite propriedade privada: discute-se o DUAT ou as benfeitorias.`, 'Prove ownership and the defendant’s holding. For land, the claim concerns the land-use right.') },
    ];
    if (money(v.valorCausa) == null) w.push({ level: 'error', field: 'valorCausa', message: l('Indique o valor da causa.', 'Enter the value of the case.') });
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.reuNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const A = g3(v, 'autor');
    const R = g3(v, 'reu');
    const OAutor = `${A.O} ${A.w('Autor', 'Autora')}`;
    const oReu = `${R.o} ${R.w('Réu', 'Ré')}`;
    const OReu = `${R.O} ${R.w('Réu', 'Ré')}`;
    const bem = sem(v.bem).replace(/^(o|a)\s+/i, (m) => m.toLowerCase()) || '____________________';
    const factos = [
      `${OAutor} é ${A.w('dono e legítimo proprietário', 'dona e legítima proprietária')} de ${bem}.`,
      ...(str(v.aquisicao) ? [`${OAutor} adquiriu-o ${sem(v.aquisicao)} (Documento n.º 1).`] : []),
      ...(str(v.registo) ? [`O direito de propriedade está registado a favor ${A.do} ${A.w('Autor', 'Autora')}, pela ${sem(v.registo)}, presumindo-se que o direito existe e lhe pertence.`] : []),
      `${OReu} ocupa o referido bem${v.dataOcupacao ? ` desde ${dateLong(v.dataOcupacao)}` : ''}, sem qualquer título que o legitime, e recusa-se a entregá-lo.`,
      ...artigos(v.factos),
    ];
    const direito = [
      `O proprietário pode exigir judicialmente de qualquer possuidor ou detentor da coisa o reconhecimento do seu direito de propriedade e a consequente restituição do que lhe pertence (${cite('pcReivindicacao')}).`,
      `${OReu} não é titular de qualquer direito que lhe permita recusar a restituição.`,
    ];
    const pedidos = [
      `Ser ${oReu} ${R.w('condenado', 'condenada')} a reconhecer que ${A.o} ${A.w('Autor', 'Autora')} é ${A.w('dono e legítimo proprietário', 'dona e legítima proprietária')} do bem identificado`,
      `Ser ${oReu} ${R.w('condenado', 'condenada')} a restituí-lo ${A.ao} ${A.w('Autor', 'Autora')}, livre de pessoas e bens`,
      ...(str(v.demolicao) ? [`Ser ${oReu} ${R.w('condenado', 'condenada')} a demolir, à sua custa, ${sem(v.demolicao)}`] : []),
      ...(money(v.indemnizacaoMensal) != null ? [`Ser ${oReu} ${R.w('condenado', 'condenada')} a pagar ${A.ao} ${A.w('Autor', 'Autora')} a indemnização de ${moneyExt(v.indemnizacaoMensal)} por cada mês de ocupação, desde ${v.dataOcupacao ? dateLong(v.dataOcupacao) : 'a citação'} até à efectiva restituição`] : []),
      `Ser ${oReu} ${R.w('condenado', 'condenada')} nas custas e procuradoria condigna`,
    ];
    const pv = prova(v);
    const blocks: Block[] = [
      ...petitionHead(v, { accao: `a presente\n**ACÇÃO DE REIVINDICAÇÃO, SOB A FORMA DE PROCESSO ${formaTexto(v)}**,`, accaoEn: 'this action to recover property,' }),
      { type: 'articulado', sections: [{ heading: 'I — Dos factos', items: factos }, { heading: 'II — Do direito', items: direito }] },
      ...closing(ctx, {
        intro: 'Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, deve a presente acção ser julgada procedente, por provada, e, em consequência:',
        introEn: 'On these grounds, the action should be upheld and:',
        pedidos,
        depois: [{ id: 'citacao', text: `Para tanto, requer a V. Ex.ª se digne ordenar a citação ${R.do} ${R.w('Réu', 'Ré')} para, querendo, contestar no prazo e sob a cominação legais, seguindo-se os ulteriores termos até final.`, en: 'Service on the defendant.' }],
        valor: money(v.valorCausa),
        docs: pv.docs,
        procuracao: pv.procuracao,
        testemunhas: pv.testemunhas,
      }),
    ];
    return blocks;
  },
});
