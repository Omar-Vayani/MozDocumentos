// Contrato de produção e compra de produtos agrícolas (agricultura por
// contrato / fomento). Not for cotton, tobacco or cashew, which follow
// sectoral concession or campaign regimes. The contract never transfers or
// leases land.

import { formatNumber } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type SignatureColumn, type Warning } from '../model';
import { BLANK, cite, l, money } from './_shared';
import {
  assinatura, clausulasFinais, documentoFields, fecho, foroField, int, lines, numerar, papel, partesBlocks, partyFields, partyWarnings, pct, quantos,
  semPonto, str, testemunhasField, valorTexto,
} from './_contratos';
import { fm, num } from './_comercio';

const CULTURAS = ['milho', 'soja', 'gergelim', 'feijão bóer', 'feijão vulgar', 'amendoim', 'arroz', 'mandioca', 'batata-reno', 'hortícolas', 'frangos', 'mel'];
const PROIBIDAS = /algod[aã]o|tabaco|caju|castanha/i;

export default defineTemplate({
  id: 'contrato-producao-agricola',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'comprador', title: l('Comprador', 'Buyer'), personRole: 'outro' },
    { id: 'produtor', title: l('Produtor', 'Producer'), personRole: 'outro' },
    { id: 'producao', title: l('Produção', 'Crop') },
    { id: 'insumos', title: l('Insumos e assistência', 'Inputs and support') },
    { id: 'preco', title: l('Preço, entrega e pagamento', 'Price, delivery and payment') },
    { id: 'outras', title: l('Incumprimento e litígios', 'Default and disputes') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('comprador', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('produtor', { tipoDefault: 'pessoa' }),
    { name: 'produtorLocalidade', type: 'text', section: 'produtor', label: l('Povoado, localidade, posto administrativo e distrito', 'Village, locality, post and district'), help: l('Muitos produtores não têm morada urbana: identifique o local de residência.', 'Many producers have no street address: identify where they live.') },
    { name: 'produtorContacto', type: 'tel', section: 'produtor', width: 'half', label: l('Telefone / M-Pesa do produtor', 'Producer phone / M-Pesa') },
    { name: 'leituraLingua', type: 'toggle', section: 'produtor', label: l('O contrato é lido ao produtor numa língua local', 'The contract is read to the producer in a local language'), help: l('Para produtores que não lêem português. Inclui intérprete e impressão digital.', 'For producers who do not read Portuguese. Adds an interpreter and thumbprint.') },
    { name: 'linguaLocal', type: 'text', section: 'produtor', width: 'half', label: l('Língua', 'Language'), placeholder: l('Ex.: Emakhuwa', 'E.g. Emakhuwa'), showIf: (v) => Boolean(v.leituraLingua) },
    { name: 'interpreteNome', type: 'text', section: 'produtor', width: 'half', label: l('Nome do intérprete', 'Interpreter’s name'), showIf: (v) => Boolean(v.leituraLingua) },

    { name: 'cultura', type: 'select', section: 'producao', width: 'half', required: true, label: l('Cultura ou produto', 'Crop or product'), options: [...CULTURAS.map((c) => ({ value: c, label: l(c, c) })), { value: 'outra', label: l('Outra', 'Other') }], default: 'milho', help: l('Algodão, tabaco e caju têm regimes próprios e não constam da lista.', 'Cotton, tobacco and cashew follow special regimes and are not listed.') },
    { name: 'culturaOutra', type: 'text', section: 'producao', width: 'half', label: l('Qual?', 'Which?'), showIf: (v) => v.cultura === 'outra' },
    { name: 'variedade', type: 'text', section: 'producao', width: 'half', label: l('Variedade (opcional)', 'Variety (optional)') },
    { name: 'campanha', type: 'text', section: 'producao', width: 'half', required: true, label: l('Campanha agrícola', 'Season'), default: (c) => `${Number(c.today.slice(0, 4))}/${Number(c.today.slice(0, 4)) + 1}` },
    { name: 'localMachamba', type: 'text', section: 'producao', label: l('Localização da machamba', 'Location of the farm plot') },
    { name: 'areaHa', type: 'number', section: 'producao', width: 'half', min: 0, max: 100000, label: l('Área (hectares)', 'Area (hectares)') },
    { name: 'quantidadeKg', type: 'number', section: 'producao', width: 'half', min: 0, max: 100000000, label: l('Quantidade prevista (kg)', 'Expected quantity (kg)') },
    { name: 'exclusividade', type: 'toggle', section: 'producao', default: true, label: l('O produtor vende toda a produção ao comprador', 'The producer sells the whole crop to the buyer') },
    { name: 'qualidade', type: 'textarea', section: 'producao', rows: 2, label: l('Padrões de qualidade', 'Quality standards'), default: 'grão limpo, seco e sem pragas, com humidade máxima e impurezas dentro dos limites da tabela de classificação do Comprador, entregue em sacos limpos' },

    { name: 'insumos', type: 'toggle', section: 'insumos', default: true, label: l('O comprador fornece insumos a crédito', 'The buyer supplies inputs on credit') },
    {
      name: 'insumosLista',
      type: 'lines',
      section: 'insumos',
      label: l('Insumos fornecidos', 'Inputs supplied'),
      addLabel: l('Adicionar insumo', 'Add input'),
      columns: [
        { name: 'item', type: 'text', label: l('Insumo', 'Input') },
        { name: 'quantidade', type: 'text', label: l('Quantidade', 'Quantity') },
        { name: 'valor', type: 'money', label: l('Valor', 'Value') },
      ],
      default: [],
      showIf: (v) => Boolean(v.insumos),
    },
    { name: 'perdaoPct', type: 'number', section: 'insumos', width: 'half', min: 0, max: 100, label: l('Perdão em caso de seca, cheias ou pragas (%)', 'Write-off on drought, flood or pests (%)'), help: l('Vazio: o saldo dos insumos passa para a campanha seguinte.', 'Empty: the input balance carries over to the next season.'), showIf: (v) => Boolean(v.insumos) },
    { name: 'assistencia', type: 'toggle', section: 'insumos', default: true, label: l('Assistência técnica por extensionistas', 'Technical support by extension officers') },

    {
      name: 'precoModo',
      type: 'radio',
      section: 'preco',
      label: l('Preço', 'Price'),
      options: [
        { value: 'fixo', label: l('Preço fixo por kg', 'Fixed price per kg') },
        { value: 'minimo', label: l('O maior entre um preço mínimo e o preço de mercado', 'The higher of a minimum and the market price') },
      ],
      default: 'fixo',
    },
    { name: 'precoKg', type: 'money', section: 'preco', width: 'half', label: l('Preço por kg (MT)', 'Price per kg (MT)'), showIf: (v) => v.precoModo === 'fixo' },
    { name: 'precoMinimoKg', type: 'money', section: 'preco', width: 'half', label: l('Preço mínimo por kg (MT)', 'Minimum price per kg (MT)'), showIf: (v) => v.precoModo === 'minimo' },
    { name: 'postoCompra', type: 'text', section: 'preco', width: 'half', label: l('Posto de compra (local de entrega)', 'Buying point') },
    { name: 'periodoEntrega', type: 'text', section: 'preco', width: 'half', label: l('Período de entrega', 'Delivery period'), placeholder: l('Ex.: Maio a Julho de 2027', 'E.g. May to July 2027') },
    { name: 'prazoPagamentoDias', type: 'number', section: 'preco', width: 'half', min: 0, max: 60, default: 7, label: l('Pagamento até (dias após cada entrega)', 'Payment within (days after delivery)') },
    { name: 'formaPagamento', type: 'text', section: 'preco', width: 'half', label: l('Forma de pagamento', 'Payment method'), default: 'M-Pesa ou e-Mola' },
    { name: 'clausulaPenalPct', type: 'number', section: 'outras', width: 'half', min: 0, max: 100, label: l('Penalização por vender a terceiros (% sobre os insumos)', 'Penalty for side-selling (% of inputs)') },
    { name: 'mediador', type: 'text', section: 'outras', label: l('Mediação antes do tribunal', 'Mediation before court'), default: 'dos líderes comunitários e dos Serviços Distritais de Actividades Económicas' },
    foroField('outras'),
    testemunhasField('outras'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'comprador', 'comprador', 'buyer'), ...partyWarnings(v, 'produtor', 'produtor', 'producer')];
    const cultura = v.cultura === 'outra' ? str(v.culturaOutra) : str(v.cultura);
    if (PROIBIDAS.test(cultura)) {
      w.push({ level: 'error', field: 'culturaOutra', message: l(`Esta cultura está sujeita a regime especial de concessão ou de campanha (${cite('concessaoCulturas')}). Use os contratos e preços aprovados pela entidade competente.`, 'This crop is subject to a special concession or campaign regime. Use the contracts and prices approved by the competent authority.') });
    }
    if (v.precoModo === 'fixo' && money(v.precoKg) == null) w.push({ level: 'warning', field: 'precoKg', message: l('Indique o preço por kg.', 'Enter the price per kg.') });
    if (v.precoModo === 'minimo' && money(v.precoMinimoKg) == null) w.push({ level: 'warning', field: 'precoMinimoKg', message: l('Indique o preço mínimo por kg.', 'Enter the minimum price per kg.') });
    if (v.insumos) w.push({ level: 'info', field: 'insumos', message: l('Os insumos são descontados ao preço da produção. Não cobre juros sobre insumos: emprestar dinheiro com juros é actividade regulada.', 'Inputs are deducted from the crop price. Do not charge interest on inputs: lending money at interest is a regulated activity.') });
    if (!v.leituraLingua) w.push({ level: 'info', field: 'leituraLingua', message: l('Se o produtor não lê português, leia-lhe o contrato na língua que ele compreende, com intérprete e testemunhas.', 'If the producer does not read Portuguese, read the contract to them in a language they understand, with an interpreter and witnesses.') });
    return w;
  },

  personName: (v) => (v.produtorTipo === 'empresa' ? v.produtorEmpresaNome : v.produtorNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const C = papel(v, 'comprador', 'Comprador', 'Compradora');
    const P = papel(v, 'produtor', 'Produtor', 'Produtora');
    const cultura = v.cultura === 'outra' ? str(v.culturaOutra) || BLANK : str(v.cultura);
    const ins = lines(v.insumosLista).filter((x) => str(x.item));
    const totalIns = ins.reduce((t, x) => t + (money(x.valor) ?? 0), 0);
    const area = num(v.areaHa);
    const kg = num(v.quantidadeKg);
    const pag = int(v.prazoPagamentoDias);
    const perdao = num(v.perdaoPct);
    const penal = num(v.clausulaPenalPct);

    const items: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `${P.O} obriga-se a produzir ${cultura}${str(v.variedade) ? ` da variedade ${semPonto(v.variedade)}` : ''} na campanha agrícola ${str(v.campanha) || BLANK}, na sua machamba situada em ${semPonto(v.localMachamba) || BLANK}${area != null ? `, com cerca de ${String(area).replace('.', ',')} hectares` : ''}, e a vender a respectiva produção ${C.ao}, que se obriga a comprá-la nas condições deste contrato. O presente contrato não transmite nem onera qualquer direito sobre a terra.`,
        en: 'The producer grows the crop on their plot for the season and sells it to the buyer, who buys it on these terms. No land rights are transferred.',
      },
      {
        id: 'quantidade',
        heading: 'Quantidade',
        text: `A quantidade prevista é de ${kg != null ? `${formatNumber(kg, Number.isInteger(kg) ? 0 : 2)} kg` : `${BLANK} kg`}.${v.exclusividade ? ` ${P.O} vende ${C.ao} toda a produção comercializável e não a pode vender a terceiros sem autorização escrita ${C.de}.` : ''}`,
        en: 'Expected quantity as stated; with exclusivity, the producer sells the whole marketable crop to the buyer.',
      },
    ];
    if (v.insumos) {
      items.push({
        id: 'insumos',
        heading: 'Insumos e assistência técnica',
        text: numerar([
          `${C.O} fornece ${P.ao}, a crédito, os insumos seguintes${totalIns ? `, no valor total de ${valorTexto(totalIns)}` : ''}: ${ins.length ? ins.map((x) => [str(x.item).replace(/^(\p{Lu})(\p{Ll})/u, (_m, a: string, b: string) => a.toLowerCase() + b), str(x.quantidade), money(x.valor) != null ? `${fm(money(x.valor))} MT` : ''].filter(Boolean).join(', ')).join('; ') : BLANK}.`,
          `O valor dos insumos é descontado no pagamento da produção, sem juros.`,
          `Se a produção for insuficiente por causa não imputável ${P.ao}, designadamente seca, cheias ou pragas declaradas pelas autoridades, ${perdao ? `${pct(perdao)} do saldo em dívida é perdoado e o restante` : 'o saldo em dívida'} transita para a campanha seguinte.`,
          v.assistencia ? `${C.O} presta assistência técnica através dos seus extensionistas, e ${P.o} segue as boas práticas recomendadas.` : '',
        ]),
        en: 'The buyer supplies inputs on credit, deducted from the crop price without interest; on drought, floods or pests the balance is partly written off or carried over; extension support as stated.',
      });
    } else if (v.assistencia) {
      items.push({ id: 'assistencia', heading: 'Assistência técnica', text: `${C.O} presta assistência técnica através dos seus extensionistas, e ${P.o} segue as boas práticas recomendadas.`, en: 'The buyer provides extension support.' });
    }
    items.push(
      {
        id: 'qualidade',
        heading: 'Qualidade',
        text: `A produção é entregue com a seguinte qualidade: ${semPonto(v.qualidade) || BLANK}. O produto que não cumpra estes padrões pode ser recusado e devolvido ${P.ao}, ou comprado a preço inferior por acordo.`,
        en: 'Quality standards as stated; non-conforming produce may be refused or bought at a lower agreed price.',
      },
      {
        id: 'preco',
        heading: 'Preço',
        text:
          v.precoModo === 'minimo'
            ? `O preço é o maior entre o preço mínimo de ${valorTexto(money(v.precoMinimoKg))} por quilograma e o preço praticado no mercado local na data da entrega, para a qualidade acordada.`
            : `O preço é de ${valorTexto(money(v.precoKg))} por quilograma, para a qualidade acordada.`,
        en: 'Price per kg as stated (or the higher of the minimum and the local market price).',
      },
      {
        id: 'entrega',
        heading: 'Entrega e pesagem',
        text: `A produção é entregue no posto de compra de ${semPonto(v.postoCompra) || BLANK}${str(v.periodoEntrega) ? `, entre ${semPonto(v.periodoEntrega).replace(/^entre\s+/i, '')}` : ''}. A pesagem é feita na presença ${P.de}, em balança aferida, e cada entrega é registada numa nota assinada por ambas as partes.`,
        en: 'Delivery at the buying point in the stated period; weighing in the producer’s presence on calibrated scales; each delivery recorded and signed.',
      },
      {
        id: 'pagamento',
        heading: 'Pagamento',
        text: `${C.O} paga ${P.ao} no prazo de ${quantos(pag, 'dia', 'dias')} após cada entrega, por ${semPonto(v.formaPagamento) || 'transferência ou carteira móvel'}${str(v.produtorContacto) ? ` para o número ${str(v.produtorContacto)}` : ''}, deduzido o valor dos insumos, e entrega-lhe uma nota com as quantidades, o preço e os descontos efectuados.`,
        en: 'The buyer pays within the stated period after each delivery, less inputs, and gives the producer a statement of quantities, price and deductions.',
      },
      {
        id: 'forcaMaior',
        heading: 'Força maior',
        text: 'Nenhuma das partes responde pelo incumprimento causado por seca, cheias, ciclones, pragas, conflitos ou outros factos de força maior, desde que o comunique à outra parte logo que possível.',
        en: 'Neither party is liable for failures caused by drought, floods, cyclones, pests, conflict or other force majeure, if notified promptly.',
      },
      {
        id: 'incumprimento',
        heading: 'Incumprimento',
        text: numerar([
          v.exclusividade ? `Se ${P.o} vender a produção a terceiros, deve restituir de imediato o valor dos insumos recebidos${penal ? `, acrescido de ${pct(penal)} a título de cláusula penal` : ''}.` : '',
          `Se ${C.o} não comprar ou não levantar a produção no período de entrega, ${P.o} pode vendê-la a terceiros${v.insumos ? ', mantendo-se a dívida dos insumos' : ''}.`,
        ]),
        en: 'Side-selling: the producer repays the inputs (plus any agreed penalty). If the buyer does not buy or collect, the producer may sell to others.',
      },
    );
    if (v.leituraLingua) {
      items.push({
        id: 'lingua',
        heading: 'Leitura do contrato',
        text: `O presente contrato foi lido e explicado ${P.ao} em ${semPonto(v.linguaLocal) || BLANK} por ${semPonto(v.interpreteNome) || BLANK}, na presença das testemunhas, tendo ${P.o} declarado compreendê-lo e aceitá-lo.`,
        en: 'The contract was read and explained to the producer in the local language by the interpreter, before witnesses; the producer declared understanding and accepting it.',
      });
    }
    // Plain notices suited to a smallholder (no registered mail or e-mail), then the usual final clauses.
    items.push(
      {
        id: 'comunicacoes',
        heading: 'Comunicações',
        text: `As comunicações entre as partes são feitas por escrito, entregues em mão contra assinatura ou impressão digital de quem as recebe, ou por mensagem para os contactos indicados neste contrato.`,
        en: 'Notices are in writing, handed over against signature or thumbprint, or sent by text message to the contacts given.',
      },
      ...clausulasFinais(v)
        .filter((c) => c.id !== 'comunicacoes')
        // Local mediation (community leaders, district services) before going to court.
        .map((c) =>
          c.id === 'leiForo'
            ? {
                ...c,
                text: c.text.replace(
                  'As partes procurarão resolver por acordo qualquer divergência sobre a interpretação ou execução do presente contrato.',
                  `As partes procuram resolver qualquer divergência por acordo, com a mediação ${semPonto(v.mediador) || 'das autoridades locais'}, antes de recorrer ao tribunal.`,
                ),
              }
            : c,
        ),
    );

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de produção e compra de produtos agrícolas' },
      ...partesBlocks({ ...v, produtorMorada: str(v.produtorMorada) || str(v.produtorLocalidade) }, [
        { p: 'comprador', role: C, en: 'buyer' },
        { p: 'produtor', role: P, en: 'producer' },
      ]),
    ];
    if (str(v.produtorLocalidade) && str(v.produtorMorada)) {
      blocks.push({ type: 'paragraph', id: 'residencia', text: `${P.O} reside em ${semPonto(v.produtorLocalidade)}${str(v.produtorContacto) ? `, com o contacto ${str(v.produtorContacto)}` : ''}.`, en: 'Producer’s place of residence and contact.' });
    }
    blocks.push(
      { type: 'paragraph', id: 'celebracao', text: 'é celebrado o presente contrato de produção e compra, que se rege pelas cláusulas seguintes:', en: 'This production and purchase contract is made on the following terms:' },
      // The last clause travels with the closing and the signatures.
      { type: 'numberedClauses', style: 'clausula', items: items.slice(0, -1) },
      { type: 'numberedClauses', style: 'clausula', items: items.slice(-1), start: items.length, keepWithNext: true },
    );
    const prodCol: SignatureColumn = assinatura(ctx, 'produtor', P);
    if (v.leituraLingua) prodCol.detail = [prodCol.detail, 'Assinatura ou impressão digital'].filter(Boolean).join('\n');
    const cols: SignatureColumn[] = [assinatura(ctx, 'comprador', C, true), prodCol];
    const extra: SignatureColumn[] = v.leituraLingua
      ? [
          { role: 'O Intérprete', name: str(v.interpreteNome) || undefined },
          { role: 'Testemunha', detail: `Nome e BI n.º: ${BLANK}` },
          { role: 'Testemunha', detail: `Nome e BI n.º: ${BLANK}` },
        ]
      : [];
    const fim = fecho({ ...ctx, values: { ...v, testemunhas: v.leituraLingua ? false : v.testemunhas } }, cols, { extraCols: extra });
    // The parties' signatures stay on the same page as the interpreter's and the witnesses'.
    fim.forEach((b, i) => {
      if (b.type === 'signatures' && i < fim.length - 1) b.keepWithNext = true;
    });
    blocks.push(...fim);
    return blocks;
  },
});
