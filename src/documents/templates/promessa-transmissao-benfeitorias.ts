// Contrato-promessa de transmissão de benfeitorias em terreno: the land belongs
// to the State and cannot be sold. The holder of the right of use (DUAT) may
// transfer the buildings, infrastructure and improvements on it, by notarial
// deed after authorisation of the competent State body. This promise fixes the
// price and obliges the parties to obtain the authorisation and sign the deed.

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, lineItems, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, conjugeColumn, consentimentoTexto, documentoFields, fecho, foroField, numerar, papel, partesBlocks, partyName, partyWarnings,
  testemunhasField, valorTexto,
} from './_contratos';
import { deEntidade } from './_pessoal-rh';
import { fechoJunto, itensLista, partyFieldsWhen, semPonto, str } from './_familia';

export default defineTemplate({
  id: 'promessa-transmissao-benfeitorias',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'transmitente', title: l('Titular do terreno (quem transmite)', 'Holder (transferor)'), personRole: 'outro' },
    { id: 'adquirente', title: l('Quem adquire', 'Acquirer'), personRole: 'cliente' },
    { id: 'terreno', title: l('Terreno e benfeitorias', 'Land and improvements') },
    { id: 'preco', title: l('Preço, sinal e prazos', 'Price, deposit and deadlines') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFieldsWhen('transmitente', ['pessoa', 'empresa'], { conjuge: true }),
    ...partyFieldsWhen('adquirente', []),
    { name: 'terrenoLocal', type: 'text', section: 'terreno', required: true, label: l('Localização do terreno', 'Location of the land'), placeholder: l('Ex.: Bairro de Mumemo, Posto Administrativo de Marracuene-Sede, Distrito de Marracuene', 'E.g. neighbourhood, administrative post, district') },
    { name: 'terrenoArea', type: 'text', section: 'terreno', width: 'half', label: l('Área', 'Area'), placeholder: l('Ex.: 30 × 40 m (1.200 m²)', 'E.g. 1,200 m²') },
    { name: 'terrenoUso', type: 'text', section: 'terreno', width: 'half', label: l('Uso', 'Use'), placeholder: l('Ex.: habitação; agricultura', 'E.g. housing; farming'), default: 'habitação' },
    {
      name: 'titulo',
      type: 'select',
      section: 'terreno',
      label: l('Como o titular tem o direito sobre a terra', 'How the holder holds the land'),
      options: [
        { value: 'titulo', label: l('Título de DUAT', 'DUAT title') },
        { value: 'autorizacao', label: l('Autorização provisória', 'Provisional authorisation') },
        { value: 'ocupacao', label: l('Ocupação de boa-fé ou segundo as normas costumeiras', 'Good-faith or customary occupation') },
      ],
      default: 'titulo',
    },
    { name: 'tituloNumero', type: 'text', section: 'terreno', width: 'half', label: l('N.º do título ou processo', 'Title or file no.'), showIf: (v) => v.titulo !== 'ocupacao' },
    { name: 'tituloEntidade', type: 'text', section: 'terreno', width: 'half', label: l('Emitido por', 'Issued by'), placeholder: l('Ex.: Conselho Municipal da Vila de Marracuene', 'E.g. municipal council'), showIf: (v) => v.titulo !== 'ocupacao' },
    { name: 'ocupacaoDesde', type: 'text', section: 'terreno', width: 'half', label: l('Ocupa desde (ano)', 'Occupied since (year)'), showIf: (v) => v.titulo === 'ocupacao' },
    {
      name: 'benfeitorias',
      type: 'lines',
      section: 'terreno',
      required: true,
      label: l('Benfeitorias e infra-estruturas', 'Improvements and structures'),
      addLabel: l('Adicionar benfeitoria', 'Add improvement'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description'), placeholder: l('Ex.: casa de alvenaria tipo 2, coberta de chapa; muro de vedação; poço; 12 cajueiros', 'E.g. brick house; boundary wall; well; cashew trees') },
        { name: 'valor', type: 'money', label: l('Valor (MT)', 'Value (MT)') },
      ],
      default: [{ descricao: '', valor: '' }],
    },
    { name: 'preco', type: 'money', section: 'preco', width: 'half', required: true, label: l('Preço das benfeitorias', 'Price of the improvements') },
    { name: 'sinal', type: 'money', section: 'preco', width: 'half', label: l('Sinal pago hoje', 'Deposit paid today') },
    { name: 'dataEscritura', type: 'date', section: 'preco', width: 'half', label: l('Escritura até', 'Deed by') },
    { name: 'entidadeAutorizacao', type: 'text', section: 'preco', label: l('Entidade que autoriza a transmissão', 'Body that authorises the transfer'), placeholder: l('Ex.: Serviços Provinciais de Geografia e Cadastro de Maputo; Conselho Municipal', 'E.g. provincial cadastre services; municipal council') },
    { name: 'posse', type: 'toggle', section: 'preco', label: l('O adquirente entra já na posse das benfeitorias', 'The acquirer takes possession now') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => ({ bens: lineItems(v.benfeitorias).filter((r) => str(r.descricao)) }),

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'transmitente', 'transmitente', 'transferor', { conjuge: true }), ...partyWarnings(v, 'adquirente', 'adquirente', 'acquirer')];
    if (!c.bens.length) w.push({ level: 'error', field: 'benfeitorias', message: l('Descreva as benfeitorias.', 'Describe the improvements.') });
    if (money(v.preco) == null) w.push({ level: 'error', field: 'preco', message: l('Indique o preço.', 'Enter the price.') });
    w.push({
      level: 'warning',
      message: l(
        `A terra é propriedade do Estado e não pode ser vendida (${cite('terraPropriedadeEstado')}). Só se transmitem as construções, infra-estruturas e benfeitorias, por escritura pública precedida de autorização da entidade estatal competente (${cite('transmissaoBenfeitorias')}). Num prédio urbano registado, a venda faz-se como venda do prédio (use o Contrato-promessa de compra e venda).`,
        'Land belongs to the State and cannot be sold. Only buildings, structures and improvements are transferred, by notarial deed after authorisation by the competent State body. For a registered urban building use the promise to sell.',
      ),
    });
    if (v.titulo === 'ocupacao') w.push({ level: 'warning', field: 'titulo', message: l('Sem título, confirme a ocupação junto da autoridade comunitária e dos vizinhos e peça a regularização do DUAT antes da escritura.', 'Without a title, confirm the occupation with the community authority and neighbours and regularise the DUAT before the deed.') });
    return w;
  },

  personName: (v) => partyName(v, 'adquirente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const T = papel(v, 'transmitente', 'Promitente-transmitente', 'Promitente-transmitente');
    const A = papel(v, 'adquirente', 'Promitente-adquirente', 'Promitente-adquirente');
    const preco = money(v.preco);
    const sinal = money(v.sinal);
    const direito =
      v.titulo === 'titulo'
        ? `titular do direito de uso e aproveitamento da terra conforme o título n.º ${str(v.tituloNumero) || BLANK}${str(v.tituloEntidade) ? `, emitido por ${semPonto(v.tituloEntidade)}` : ''}`
        : v.titulo === 'autorizacao'
          ? `titular de autorização provisória do direito de uso e aproveitamento da terra${str(v.tituloNumero) ? ` (processo n.º ${str(v.tituloNumero)})` : ''}${str(v.tituloEntidade) ? `, concedida por ${semPonto(v.tituloEntidade)}` : ''}`
          : `ocupante de boa-fé, segundo as normas e práticas costumeiras${str(v.ocupacaoDesde) ? `, desde ${semPonto(v.ocupacaoDesde)}` : ''}, com direito de uso e aproveitamento da terra`;

    const clauses: ClauseItem[] = [
      {
        id: 'terreno',
        heading: 'Terreno',
        text: `${T.O} é ${direito}, relativamente ao terreno sito em ${semPonto(v.terrenoLocal) || BLANK}${str(v.terrenoArea) ? `, com a área de ${semPonto(v.terrenoArea)}` : ''}, destinado a ${semPonto(v.terrenoUso) || 'habitação'}. As partes reconhecem que a terra é propriedade do Estado e não é objecto de venda.`,
        en: 'The transferor holds the right of use of the land described. The parties acknowledge that land belongs to the State and is not being sold.',
      },
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `${T.O} promete transmitir ${A.ao}, que promete adquirir, as seguintes benfeitorias e infra-estruturas existentes no terreno, com o consequente direito de uso e aproveitamento da terra nos termos da lei:`,
        items: itensLista((c.bens.length ? c.bens : [{ descricao: BLANK }]).map((r: Record<string, unknown>) => `${str(r.descricao)}${money(r.valor) != null ? `, no valor de ${formatMoney(money(r.valor))}` : ''}`)),
        en: 'The transferor promises to transfer, and the acquirer to acquire, the listed improvements, with the related right of use as the law allows.',
      },
      {
        id: 'preco',
        heading: 'Preço e sinal',
        text: numerar([
          `O preço é de ${valorTexto(preco)}.`,
          sinal != null
            ? `Nesta data, ${A.o} entrega ${T.ao}, a título de sinal e princípio de pagamento, a quantia de ${valorTexto(sinal)}, de que ${T.o} dá quitação; o remanescente de ${valorTexto(preco != null ? Math.max(0, preco - sinal) : null)} é pago no acto da escritura.`
            : 'O preço é pago integralmente no acto da escritura.',
        ]),
        en: `Price ${preco != null ? formatMoney(preco) : '—'}${sinal != null ? `, deposit ${formatMoney(sinal)} paid today, balance at the deed` : ', paid at the deed'}.`,
      },
      {
        id: 'autorizacao',
        heading: 'Autorização e escritura',
        text: numerar([
          `${T.O} obriga-se a requerer${str(v.entidadeAutorizacao) ? ` junto ${deEntidade(semPonto(v.entidadeAutorizacao))}` : ' junto da entidade estatal competente'}, no prazo de trinta dias, a autorização para a transmissão, entregando os documentos necessários, com a colaboração ${A.de}.`,
          `A escritura pública é celebrada ${str(v.dataEscritura) ? `até ${dateLong(v.dataEscritura)}` : 'no prazo de trinta dias após a autorização'}, em cartório notarial a indicar ${A.pelo}, que suporta os custos da escritura, dos registos e dos impostos devidos pela aquisição.`,
          `Se a autorização for recusada por motivo não imputável a qualquer das partes, o presente contrato fica sem efeito e ${T.o} restitui ${A.ao} as quantias recebidas, em singelo, no prazo de quinze dias.`,
        ]),
        en: 'The transferor applies for the State authorisation; the deed follows; if authorisation is refused through no fault of either party, the contract lapses and the money is returned.',
      },
      {
        id: 'incumprimento',
        heading: 'Incumprimento',
        text: `Fora do caso previsto na cláusula anterior, se ${A.o} não cumprir, perde o sinal entregue; se o incumprimento for ${T.de}, ${T.f ? 'esta' : 'este'} restitui o sinal em dobro (${cite('contratoPromessaSinal')}).`,
        en: 'Otherwise, an acquirer in default loses the deposit; a transferor in default returns double.',
      },
    ];
    if (v.posse) {
      clauses.push({ id: 'posse', heading: 'Posse', text: `${A.O} entra na posse das benfeitorias nesta data, suportando a partir dela os encargos com a sua conservação, sem prejuízo do disposto quanto ao incumprimento.`, en: 'The acquirer takes possession now and bears upkeep costs.' });
    }
    clauses.push(...clausulasFinais(v));

    return [
      { type: 'title', text: 'Contrato-promessa de transmissão de benfeitorias' },
      ...partesBlocks(v, [
        { p: 'transmitente', role: T, en: 'Transferor' },
        { p: 'adquirente', role: A, en: 'Acquirer' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'é celebrado o presente contrato-promessa, que se rege pelas cláusulas seguintes e pela Lei de Terras:', en: 'this promissory contract is entered into on the following terms and the Land Law:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fechoJunto(
        fecho(ctx, [assinatura(ctx, 'transmitente', T, true), assinatura(ctx, 'adquirente', A)], {
          extraCols: [conjugeColumn(v, 'transmitente')],
          consentimento: consentimentoTexto(v, 'transmitente', T),
          notario: 'Reconhecimento presencial das assinaturas.',
        }),
      ),
    ];
  },
});
