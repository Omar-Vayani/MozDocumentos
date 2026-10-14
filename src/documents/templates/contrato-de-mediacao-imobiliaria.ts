// Contrato de mediação imobiliária: an owner hires an estate agency to find a
// buyer or tenant. No specific Mozambican statute was found, so exclusivity,
// the commission and when it is due are set out in full in the contract.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, l, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, conjugeColumn, consentimentoTexto, documentoFields, fecho, foroField, int, num, numerar, papel,
  partesBlocks, partyFields, partyName, partyWarnings, pct, quantos, semPonto, str, testemunhasField, valorTexto,
} from './_contratos';
import { profileLicenca } from './_construcao';

const OBJECTOS = [
  { value: 'venda', label: l('Venda', 'Sale'), pt: 'compra', preco: 'preço de venda' },
  { value: 'arrendamento', label: l('Arrendamento', 'Letting'), pt: 'tomada de arrendamento', preco: 'renda mensal' },
  { value: 'trespasse', label: l('Trespasse', 'Business transfer'), pt: 'aquisição por trespasse', preco: 'preço do trespasse' },
];

export default defineTemplate({
  id: 'contrato-de-mediacao-imobiliaria',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'mediadora', title: l('Mediadora (imobiliária)', 'Estate agency') },
    { id: 'cliente', title: l('Cliente (proprietário)', 'Client (owner)'), personRole: 'cliente' },
    { id: 'imovel', title: l('Imóvel e preço', 'Property and price') },
    { id: 'comissao', title: l('Regime e comissão', 'Exclusivity and commission') },
    { id: 'clausulas', title: l('Duração, outras cláusulas e assinaturas', 'Term, other clauses and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('mediadora', { fromProfile: true, tipoDefault: 'empresa' }),
    { name: 'mediadoraLicenca', type: 'text', section: 'mediadora', width: 'half', label: l('Licença de actividade', 'Business licence'), placeholder: l('Ex.: Licença n.º 1123/BAU/2025', 'E.g. Licence 1123/BAU/2025'), default: (c) => profileLicenca(c.profile) },
    { name: 'agenteNome', type: 'text', section: 'mediadora', width: 'half', label: l('Agente responsável (opcional)', 'Agent in charge (optional)') },
    ...partyFields('cliente', { conjuge: true }),
    {
      name: 'clienteQualidade',
      type: 'select',
      section: 'cliente',
      width: 'half',
      label: l('O cliente é', 'The client is'),
      options: [
        { value: 'proprietário', label: l('Proprietário', 'Owner') },
        { value: 'legítimo possuidor', label: l('Legítimo possuidor / titular do DUAT', 'Lawful holder / land-use right holder') },
        { value: 'procurador com poderes bastantes', label: l('Procurador do proprietário', 'Owner’s attorney') },
        { value: 'promitente-comprador com autorização do vendedor', label: l('Promitente-comprador autorizado', 'Authorised promissory buyer') },
      ],
      default: 'proprietário',
    },

    { name: 'objecto', type: 'radio', section: 'imovel', required: true, label: l('O cliente pretende', 'The client wants'), options: OBJECTOS.map(({ value, label }) => ({ value, label })), default: 'venda' },
    { name: 'imovelDescricao', type: 'text', section: 'imovel', required: true, label: l('Imóvel', 'Property'), placeholder: l('Ex.: apartamento do tipo 3, 5.º andar direito, com uma vaga de garagem', 'E.g. 3-bedroom flat, 5th floor, one parking space') },
    { name: 'imovelMorada', type: 'text', section: 'imovel', required: true, label: l('Morada', 'Address') },
    { name: 'imovelRegisto', type: 'text', section: 'imovel', width: 'half', label: l('Registo predial (opcional)', 'Land registry (optional)'), placeholder: l('Ex.: descrito sob o n.º 24 518 na CRP de Maputo', 'E.g. no. 24 518, Maputo registry') },
    { name: 'imovelDuat', type: 'text', section: 'imovel', width: 'half', label: l('DUAT ou talhão (opcional)', 'Land-use title or plot (optional)') },
    { name: 'onus', type: 'text', section: 'imovel', label: l('Ónus ou encargos (hipoteca, arrendamento…)', 'Charges (mortgage, lease…)'), placeholder: l('Deixe vazio se o imóvel estiver livre de ónus', 'Leave empty if free of charges') },
    { name: 'preco', type: 'money', section: 'imovel', required: true, width: 'half', label: l('Preço pedido (ou renda mensal)', 'Asking price (or monthly rent)') },

    {
      name: 'exclusividade',
      type: 'radio',
      section: 'comissao',
      label: l('Regime', 'Arrangement'),
      options: [
        { value: 'exclusivo', label: l('Exclusivo (só esta imobiliária)', 'Exclusive') },
        { value: 'aberto', label: l('Não exclusivo', 'Non-exclusive') },
      ],
      default: 'aberto',
    },
    {
      name: 'comissaoTipo',
      type: 'radio',
      section: 'comissao',
      label: l('Comissão', 'Commission'),
      options: [
        { value: 'percentagem', label: l('Percentagem do preço', 'Percentage of the price') },
        { value: 'fixo', label: l('Valor fixo', 'Fixed amount') },
        { value: 'rendas', label: l('Meses de renda', 'Months of rent') },
      ],
      default: 'percentagem',
    },
    { name: 'comissaoValor', type: 'number', section: 'comissao', width: 'half', required: true, min: 0, label: l('Percentagem ou n.º de meses', 'Percentage or number of months'), showIf: (v) => v.comissaoTipo !== 'fixo' },
    { name: 'comissaoFixa', type: 'money', section: 'comissao', width: 'half', label: l('Valor fixo da comissão', 'Fixed commission'), showIf: (v) => v.comissaoTipo === 'fixo' },
    { name: 'comissaoIva', type: 'toggle', section: 'comissao', default: true, label: l('Acresce IVA à comissão', 'VAT is added to the commission') },
    {
      name: 'momentoComissao',
      type: 'radio',
      section: 'comissao',
      label: l('A comissão é paga', 'Commission is paid'),
      options: [
        { value: 'promessa', label: l('Na assinatura do contrato-promessa', 'On signing the promissory contract') },
        { value: 'definitivo', label: l('Na escritura / contrato definitivo', 'On the deed / final contract') },
        { value: 'dividido', label: l('Metade na promessa, metade na escritura', 'Half on promise, half on deed') },
        { value: 'arrendamento', label: l('Na assinatura do contrato de arrendamento', 'On signing the lease') },
      ],
      default: 'definitivo',
    },
    { name: 'protecaoMeses', type: 'number', section: 'comissao', width: 'half', min: 0, max: 24, default: 6, label: l('Protecção após o fim do contrato (meses)', 'Protection after the end (months)'), help: l('A comissão é devida se o negócio for feito com cliente apresentado pela imobiliária neste período.', 'Commission is due if a client introduced by the agency buys within this period.') },

    { name: 'duracaoMeses', type: 'number', section: 'clausulas', width: 'half', required: true, min: 1, max: 36, default: 6, label: l('Duração (meses)', 'Term (months)') },
    { name: 'renovacao', type: 'toggle', section: 'clausulas', default: true, label: l('Renova-se automaticamente por iguais períodos', 'Renews automatically') },
    { name: 'avisoDias', type: 'number', section: 'clausulas', width: 'half', min: 1, max: 90, default: 15, label: l('Aviso de denúncia (dias)', 'Notice to end (days)'), showIf: (v) => Boolean(v.renovacao) },
    { name: 'chaves', type: 'number', section: 'clausulas', width: 'half', min: 0, max: 10, default: 0, label: l('Chaves entregues à imobiliária', 'Keys handed to the agency') },
    { name: 'placa', type: 'toggle', section: 'clausulas', default: true, label: l('Autoriza placa no imóvel e anúncios com fotografias', 'Allows a sign and adverts with photos') },
    { name: 'publicarPreco', type: 'toggle', section: 'clausulas', default: true, label: l('Autoriza publicar o preço', 'Allows the price to be published') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'mediadora', 'imobiliária', 'agency'), ...partyWarnings(v, 'cliente', 'cliente', 'client', { conjuge: v.objecto === 'venda' })];
    if (v.comissaoTipo === 'fixo' ? money(v.comissaoFixa) == null : num(v.comissaoValor) == null) {
      w.push({ level: 'warning', field: 'comissaoValor', message: l(`Indique a comissão: sem lei específica, ela só é exigível nos termos escritos no contrato (${cite('mediacaoImobiliariaRegime')}).`, 'Enter the commission: with no specific law, it is due only as written in the contract.') });
    }
    if (v.objecto === 'arrendamento' && v.momentoComissao !== 'arrendamento') {
      w.push({ level: 'info', field: 'momentoComissao', message: l('Num arrendamento, a comissão é normalmente paga na assinatura do contrato de arrendamento.', 'For a letting, the commission is usually paid on signing the lease.') });
    }
    w.push({ level: 'info', message: l(`Identifique os clientes e guarde cópia dos documentos: o sector imobiliário está sujeito às regras de prevenção do branqueamento de capitais (${cite('mediacaoBranqueamento')}).`, 'Identify clients and keep copies of their documents: real estate is subject to anti-money-laundering rules.') });
    w.push({ level: 'info', message: l(`A imobiliária precisa de licença de actividade (${cite('licencaActividadeEconomica')}).`, 'The agency needs a business licence.') });
    if (v.objecto === 'arrendamento') w.push({ level: 'info', message: l('Se o imóvel for uma fracção em condomínio, o contrato de arrendamento deve indicar quem paga as quotas do condomínio.', 'If the property is in a condominium, the lease must state who pays the condominium fees.') });
    return w;
  },

  personName: (v) => partyName(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const M = papel(v, 'mediadora', 'Mediadora', 'Mediadora', true);
    const C = papel(v, 'cliente', 'Cliente', 'Cliente');
    const obj = OBJECTOS.find((o) => o.value === v.objecto) ?? OBJECTOS[0];
    const arr = v.objecto === 'arrendamento';
    const preco = money(v.preco);
    const dur = int(v.duracaoMeses);
    const prot = int(v.protecaoMeses);
    const chaves = int(v.chaves) ?? 0;

    const comissao =
      v.comissaoTipo === 'fixo'
        ? `o valor fixo de ${valorTexto(money(v.comissaoFixa))}`
        : v.comissaoTipo === 'rendas'
          ? `o valor correspondente a ${quantos(num(v.comissaoValor), 'mês', 'meses')} de renda`
          : `${pct(v.comissaoValor)} sobre o preço efectivamente acordado`;
    const momento = {
      promessa: 'na data da assinatura do contrato-promessa',
      definitivo: 'na data da celebração da escritura pública ou do contrato definitivo',
      dividido: 'em duas partes iguais, a primeira na assinatura do contrato-promessa e a segunda na celebração da escritura pública ou do contrato definitivo',
      arrendamento: 'na data da assinatura do contrato de arrendamento',
    }[String(v.momentoComissao)] ?? 'na data da celebração do contrato definitivo';

    const clienteDecl = `${C.O} declara ser ${str(v.clienteQualidade) || 'proprietário'} do imóvel, que o mesmo pode ser ${arr ? 'arrendado' : 'transmitido'} e que as informações prestadas são verdadeiras, obrigando-se a entregar ${M.ao} cópia dos documentos necessários, nomeadamente a certidão do registo predial, o título do DUAT ou documento equivalente, a planta do imóvel e, sendo fracção em condomínio, a declaração de inexistência de dívidas ao condomínio.`;

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: numerar([
          `Pelo presente contrato, ${C.o} encarrega ${M.o} de diligenciar no sentido de encontrar interessado na ${obj.pt} do imóvel identificado na cláusula segunda, pelo ${obj.preco} de ${valorTexto(preco)}, ou por outro valor que ${C.o} venha a aceitar por escrito.`,
          `${M.O} obriga-se a promover o imóvel, organizar e acompanhar as visitas, prestar informação aos interessados e apoiar as partes até à celebração do contrato ${arr ? 'de arrendamento' : 'definitivo'}.`,
        ]),
        en: `The Client engages the Agency to find a ${arr ? 'tenant' : 'buyer'} for the property at the stated price.`,
      },
      {
        id: 'imovel',
        heading: 'Imóvel',
        text: `${semPonto(v.imovelDescricao).replace(/^./, (s) => s.toUpperCase()) || BLANK}, sito em ${semPonto(v.imovelMorada) || BLANK}${str(v.imovelRegisto) ? `, ${semPonto(v.imovelRegisto)}` : ''}${str(v.imovelDuat) ? `, ${semPonto(v.imovelDuat)}` : ''}, ${str(v.onus) ? `com os seguintes ónus ou encargos: ${semPonto(v.onus)}` : 'livre de ónus e encargos'}.`,
        en: 'Description of the property.',
      },
      { id: 'declaracoes', heading: 'Declarações do Cliente', text: clienteDecl, en: 'The Client confirms their right to sell or let and will provide the documents.' },
      {
        id: 'regime',
        heading: 'Regime',
        text:
          v.exclusividade === 'exclusivo'
            ? `O presente contrato é celebrado em regime de exclusividade: durante a sua vigência, ${C.o} não pode contratar outra mediadora para o mesmo imóvel nem ${arr ? 'arrendá-lo' : 'vendê-lo'} directamente a interessado apresentado ${M.pelo}.`
            : `O presente contrato é celebrado sem exclusividade, podendo ${C.o} contratar outras mediadoras ou negociar directamente, sem prejuízo do direito ${M.de} à comissão pelos negócios celebrados com interessados por ela apresentados.`,
        en: v.exclusividade === 'exclusivo' ? 'Exclusive arrangement.' : 'Non-exclusive arrangement.',
      },
      {
        id: 'remuneracao',
        heading: 'Remuneração',
        text: numerar([
          `Pelos serviços prestados, ${C.o} paga ${M.ao} uma comissão correspondente a ${comissao}${v.comissaoIva ? ', acrescida de IVA à taxa legal' : ''}.`,
          `A comissão é devida ${momento}, desde que o negócio resulte da actividade ${M.de}.`,
          `Considera-se que o negócio resulta da actividade ${M.de} quando for celebrado com interessado por ela apresentado, nomeadamente o que conste de ficha de visita assinada${prot ? `, ainda que o negócio seja celebrado depois do termo do presente contrato, nos ${quantos(prot, 'mês', 'meses')} seguintes` : ''}.`,
          `Se o negócio não se concretizar por causa imputável ${C.ao}, depois de este ter aceitado por escrito uma proposta de interessado nas condições deste contrato, a comissão é igualmente devida.`,
        ]),
        en: 'Commission, when it is due, and protection period.',
      },
      {
        id: 'promocao',
        heading: 'Promoção e visitas',
        text: numerar([
          `As despesas de promoção do imóvel são suportadas ${M.pelo}.`,
          v.placa ? `${C.O} autoriza a colocação de placa no imóvel e a divulgação de fotografias${v.publicarPreco ? ' e do preço' : ''} em meios físicos e digitais.` : `${C.O} não autoriza a colocação de placa no imóvel; a divulgação é feita de forma reservada.`,
          chaves > 0 ? `${C.O} entrega ${M.ao} ${quantos(chaves, 'chave', 'chaves', true)} do imóvel, que esta guarda e devolve no termo do contrato.` : `As visitas são marcadas com ${C.o} com antecedência razoável.`,
        ]),
        en: 'Advertising, viewings and keys.',
      },
      {
        id: 'branqueamento',
        heading: 'Identificação dos clientes',
        text: `As partes obrigam-se a cumprir a legislação de prevenção e combate ao branqueamento de capitais e ao financiamento do terrorismo, prestando ${M.ao} os documentos de identificação e as informações sobre a origem dos fundos que esta solicitar, e tomam conhecimento de que ${M.o} pode comunicar informação às autoridades competentes nos termos da lei.`,
        en: 'The parties comply with anti-money-laundering law and provide identification and source-of-funds information.',
      },
      {
        id: 'duracao',
        heading: 'Duração',
        text: `O presente contrato vigora por ${quantos(dur, 'mês', 'meses')} a contar da data da sua assinatura${v.renovacao ? `, renovando-se por iguais períodos se nenhuma das partes o denunciar por escrito com a antecedência mínima de ${quantos(int(v.avisoDias), 'dia', 'dias')}` : ''}.`,
        en: 'Term and renewal.',
      },
      {
        id: 'dados',
        heading: 'Dados pessoais',
        text: 'Os dados pessoais das partes e dos interessados são tratados apenas para a execução deste contrato e para o cumprimento de obrigações legais.',
        en: 'Personal data are used only to perform this contract and meet legal duties.',
      },
      ...clausulasFinais(v),
    ];

    const cons = consentimentoTexto(v, 'cliente', C);
    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de mediação imobiliária' },
      ...partesBlocks(v, [
        { p: 'mediadora', role: M, en: 'Agency' },
        { p: 'cliente', role: C, en: 'Client' },
      ]),
    ];
    if (str(v.mediadoraLicenca) || str(v.agenteNome)) {
      blocks.push({
        type: 'paragraph',
        id: 'licenca',
        text: `${M.O}${str(v.mediadoraLicenca) ? ` exerce a actividade ao abrigo da ${semPonto(v.mediadoraLicenca).replace(/^./, (s) => s.toLowerCase())}` : ''}${str(v.agenteNome) ? `${str(v.mediadoraLicenca) ? ', sendo' : ' tem como'} agente responsável por este contrato ${semPonto(v.agenteNome)}` : ''}.`,
        en: 'The agency’s licence and agent in charge.',
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'celebracao', text: 'É celebrado o presente contrato de mediação imobiliária, que se rege pelas cláusulas seguintes:', en: 'This estate agency agreement is made on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fecho(ctx, [assinatura(ctx, 'mediadora', M, true), assinatura(ctx, 'cliente', C)], { extraCols: [conjugeColumn(v, 'cliente')], consentimento: cons }),
    );
    return blocks;
  },
});
