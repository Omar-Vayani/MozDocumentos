// Contrato de trespasse de estabelecimento comercial (sale of a business as a
// going concern). Writing is required; registration makes it binding on third
// parties; if real estate is included a notarial deed is needed instead.

import { roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, conjugeColumn, consentimentoTexto, documentoFields, fecho, foroField, int, lines, numerar, papel, partesBlocks,
  partyFields, partyName, partyWarnings, quantos, semPonto, str, testemunhasField, valorTexto,
} from './_contratos';

export default defineTemplate({
  id: 'contrato-de-trespasse',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'trespassante', title: l('Trespassante (quem vende o negócio)', 'Transferor (seller)'), personRole: 'outro' },
    { id: 'trespassario', title: l('Trespassário (quem compra)', 'Transferee (buyer)'), personRole: 'cliente' },
    { id: 'estabelecimento', title: l('Estabelecimento', 'Business') },
    { id: 'preco', title: l('Preço e pagamento', 'Price and payment') },
    { id: 'passivo', title: l('Dívidas, trabalhadores e entrega', 'Debts, staff and handover') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('trespassante', { fromProfile: true, conjuge: true }),
    ...partyFields('trespassario'),

    { name: 'estabelecimentoNome', type: 'text', section: 'estabelecimento', width: 'half', required: true, label: l('Nome do estabelecimento', 'Business name'), placeholder: l('Ex.: Mercearia Boa Esperança', 'E.g. Boa Esperança grocery') },
    { name: 'ramo', type: 'text', section: 'estabelecimento', width: 'half', required: true, label: l('Ramo de actividade', 'Line of business'), placeholder: l('Ex.: comércio a retalho de produtos alimentares', 'E.g. food retail') },
    { name: 'morada', type: 'text', section: 'estabelecimento', required: true, label: l('Morada do estabelecimento', 'Business address') },
    { name: 'alvara', type: 'text', section: 'estabelecimento', width: 'half', label: l('Alvará / licença de actividade n.º', 'Business licence no.') },
    { name: 'incluiArrendamento', type: 'toggle', section: 'estabelecimento', default: true, label: l('O local é arrendado e o arrendamento passa para o comprador', 'Premises are leased and the lease passes to the buyer') },
    { name: 'senhorioNome', type: 'text', section: 'estabelecimento', width: 'half', label: l('Nome do senhorio', 'Landlord’s name'), showIf: (v) => Boolean(v.incluiArrendamento) },
    { name: 'arrendamentoData', type: 'date', section: 'estabelecimento', width: 'half', label: l('Data do contrato de arrendamento', 'Lease date'), showIf: (v) => Boolean(v.incluiArrendamento) },
    { name: 'rendaMensal', type: 'money', section: 'estabelecimento', width: 'half', label: l('Renda mensal actual', 'Current monthly rent'), showIf: (v) => Boolean(v.incluiArrendamento) },
    {
      name: 'incluiImovel',
      type: 'toggle',
      section: 'estabelecimento',
      label: l('O trespasse inclui o próprio edifício (imóvel)', 'The transfer includes the building itself'),
      help: l('Se o vendedor é dono do edifício e o vende com o negócio, é preciso escritura pública no notário.', 'If the seller owns the building and sells it with the business, a notarial deed is needed.'),
    },
    {
      name: 'equipamento',
      type: 'lines',
      section: 'estabelecimento',
      label: l('Mobiliário, equipamento e utensílios', 'Furniture, equipment and tools'),
      addLabel: l('Adicionar artigo', 'Add item'),
      columns: [
        { name: 'item', type: 'text', label: l('Artigo', 'Item') },
        { name: 'quantidade', type: 'number', label: l('Quant.', 'Qty'), min: 1 },
        { name: 'estado', type: 'text', label: l('Estado', 'Condition') },
      ],
    },
    { name: 'incluiMercadorias', type: 'toggle', section: 'estabelecimento', default: true, label: l('Inclui as mercadorias em stock (inventário à data da entrega)', 'Includes stock (inventory at handover)') },
    { name: 'exclusoes', type: 'textarea', section: 'estabelecimento', rows: 2, label: l('Ficam de fora do trespasse (opcional)', 'Excluded from the transfer (optional)'), placeholder: l('Ex.: dinheiro em caixa, créditos sobre clientes, viatura', 'E.g. cash, customer receivables, vehicle') },

    { name: 'preco', type: 'money', section: 'preco', required: true, width: 'half', label: l('Preço do trespasse', 'Transfer price') },
    { name: 'precoMercadorias', type: 'money', section: 'preco', width: 'half', label: l('Do qual: mercadorias (opcional)', 'Of which: stock (optional)') },
    {
      name: 'pagamento',
      type: 'radio',
      section: 'preco',
      label: l('Pagamento', 'Payment'),
      options: [
        { value: 'assinatura', label: l('Na assinatura', 'On signing') },
        { value: 'entrega', label: l('Metade na assinatura, metade na entrega', 'Half on signing, half on handover') },
        { value: 'prestacoes', label: l('Em prestações', 'In instalments') },
      ],
      default: 'entrega',
    },
    { name: 'prestacoesNumero', type: 'number', section: 'preco', width: 'half', min: 2, max: 36, default: 6, label: l('Número de prestações mensais', 'Monthly instalments'), showIf: (v) => v.pagamento === 'prestacoes' },
    { name: 'primeiraPrestacao', type: 'date', section: 'preco', width: 'half', label: l('1.ª prestação', 'First instalment'), showIf: (v) => v.pagamento === 'prestacoes' },
    { name: 'nib', type: 'text', section: 'preco', width: 'half', label: l('NIB do trespassante', 'Transferor’s account (NIB)') },

    {
      name: 'dividas',
      type: 'lines',
      section: 'passivo',
      label: l('Dívidas existentes (que o trespassante paga)', 'Existing debts (paid by the transferor)'),
      addLabel: l('Adicionar dívida', 'Add debt'),
      columns: [
        { name: 'credor', type: 'text', label: l('Credor', 'Creditor') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
    },
    {
      name: 'trabalhadores',
      type: 'radio',
      section: 'passivo',
      label: l('Trabalhadores', 'Employees'),
      options: [
        { value: 'nenhum', label: l('Não há trabalhadores', 'No employees') },
        { value: 'transmitem', label: l('Passam para o comprador', 'Transfer to the buyer') },
        { value: 'cessam', label: l('O vendedor termina os contratos antes da entrega', 'Seller ends contracts before handover') },
      ],
      default: 'nenhum',
    },
    { name: 'trabalhadoresLista', type: 'textarea', section: 'passivo', rows: 3, label: l('Trabalhadores (nome e função, um por linha)', 'Employees (name and job, one per line)'), showIf: (v) => v.trabalhadores === 'transmitem' },
    { name: 'dataEntrega', type: 'date', section: 'passivo', width: 'half', required: true, label: l('Data de entrega do estabelecimento', 'Handover date') },
    { name: 'naoConcorrenciaArea', type: 'text', section: 'passivo', width: 'half', label: l('Área da não concorrência', 'Non-compete area'), placeholder: l('Ex.: Cidade da Matola', 'E.g. Matola city') },
    {
      name: 'naoConcorrenciaAnos',
      type: 'number',
      section: 'passivo',
      width: 'half',
      min: 0,
      max: 10,
      label: l('Não concorrência (anos)', 'Non-compete (years)'),
      help: l('Em branco: aplica-se o período previsto na lei. Indique 0 para não incluir a cláusula.', 'Blank: the statutory period applies. Enter 0 to leave the clause out.'),
    },
    {
      name: 'despesasRegisto',
      type: 'radio',
      section: 'clausulas',
      label: l('Despesas de registo e licenças pagas por', 'Registration and licence costs paid by'),
      options: [
        { value: 'trespassario', label: l('Comprador', 'Buyer') },
        { value: 'trespassante', label: l('Vendedor', 'Seller') },
        { value: 'repartidas', label: l('Em partes iguais', 'Shared equally') },
      ],
      default: 'trespassario',
    },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const preco = money(v.preco);
    const n = int(v.prestacoesNumero) ?? 0;
    return {
      preco,
      mercadorias: money(v.precoMercadorias),
      prestacao: preco != null && v.pagamento === 'prestacoes' && n > 0 ? roundMoney(preco / n) : null,
      metade: preco != null ? roundMoney(preco / 2) : null,
      n,
      equipamento: lines(v.equipamento).filter((r) => str(r.item)),
      dividas: lines(v.dividas).filter((r) => str(r.credor)),
    };
  },

  warnings: (v, { computed: c, legal }) => {
    const w: Warning[] = [
      ...partyWarnings(v, 'trespassante', 'trespassante', 'transferor', { conjuge: true }),
      ...partyWarnings(v, 'trespassario', 'trespassário', 'transferee'),
    ];
    if (v.incluiImovel) {
      w.push({
        level: 'error',
        field: 'incluiImovel',
        message: l(
          `Se o trespasse inclui o imóvel, é necessária escritura pública (${cite('trespasseRegime')}). Use o Contrato-promessa de compra e venda e dirija-se ao notário.`,
          'If the transfer includes the building, a notarial deed is required. Use the promissory contract and go to a notary.',
        ),
      });
    }
    if (c.preco == null) w.push({ level: 'error', field: 'preco', message: l('Indique o preço do trespasse.', 'Enter the transfer price.') });
    w.push({
      level: 'warning',
      message: l(
        'O trespasse deve ser feito por escrito e só produz efeitos em relação a terceiros depois de registado. Recomenda-se o reconhecimento presencial das assinaturas no notário.',
        'The transfer must be in writing and binds third parties only once registered. In-person certification of signatures by a notary is recommended.',
      ),
    });
    if (v.incluiArrendamento) {
      w.push({
        level: 'info',
        field: 'senhorioNome',
        message: l(
          `O arrendamento passa para o comprador sem autorização do senhorio, mas o senhorio deve ser avisado por escrito (${cite('trespasseArrendamento')}). Envie a comunicação logo após a assinatura.`,
          'The lease passes to the buyer without the landlord’s consent, but the landlord must be notified in writing. Send the notice right after signing.',
        ),
      });
    }
    if (v.trabalhadores === 'transmitem') {
      w.push({ level: 'info', field: 'trabalhadores', message: l('Os contratos de trabalho transmitem-se com o estabelecimento: o comprador assume a antiguidade e os direitos dos trabalhadores. Informe-os por escrito.', 'Employment contracts pass with the business: the buyer takes on seniority and rights. Inform the staff in writing.') });
    }
    const anos = legal.value<number>('trespasseNaoConcorrencia');
    if (int(v.naoConcorrenciaAnos) != null && int(v.naoConcorrenciaAnos)! > anos) {
      w.push({ level: 'warning', field: 'naoConcorrenciaAnos', message: l(`Uma proibição de concorrência superior a ${anos} anos pode não ser válida.`, `A non-compete longer than ${anos} years may be invalid.`) });
    }
    w.push({ level: 'info', message: l('O ganho com o trespasse é rendimento sujeito a IRPS ou IRPC, e pode haver IVA e imposto do selo: confirme com um contabilista.', 'The gain is taxable (IRPS/IRPC), and VAT and stamp duty may apply: check with an accountant.') });
    return w;
  },

  personName: (v) => partyName(v, 'trespassario') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const T = papel(v, 'trespassante', 'Trespassante', 'Trespassante');
    const R = papel(v, 'trespassario', 'Trespassário', 'Trespassária');
    const nome = semPonto(v.estabelecimentoNome) || BLANK;
    const anosNC = int(v.naoConcorrenciaAnos) ?? ctx.legal.value<number>('trespasseNaoConcorrencia');

    const elementos = [
      v.incluiArrendamento
        ? `a posição de arrendatário no contrato de arrendamento do local, celebrado${str(v.senhorioNome) ? ` com ${semPonto(v.senhorioNome)}` : ''}${v.arrendamentoData ? ` em ${dateLong(v.arrendamentoData)}` : ''}${money(v.rendaMensal) != null ? `, com a renda mensal actual de ${formatMoney(money(v.rendaMensal))}` : ''}`
        : '',
      `o mobiliário, equipamento e utensílios ${c.equipamento.length ? 'constantes do Anexo I' : 'existentes no estabelecimento'}`,
      v.incluiMercadorias ? 'as mercadorias existentes em stock à data da entrega, conforme inventário conferido e assinado pelas partes nessa data' : '',
      'o nome e a insígnia do estabelecimento',
      'a clientela e o aviamento',
      'os contratos de fornecimento de água, energia e telecomunicações, cuja titularidade as partes diligenciam por transferir',
    ].filter(Boolean);

    const clauses: ClauseItem[] = [];
    clauses.push({
      id: 'objecto',
      heading: 'Objecto',
      text: `Pelo presente contrato, ${T.o} trespassa ${R.ao}, que aceita, o estabelecimento comercial de ${semPonto(v.ramo) || BLANK}, denominado ${nome}, instalado em ${semPonto(v.morada) || BLANK}${str(v.alvara) ? `, licenciado pelo alvará n.º ${semPonto(v.alvara)}` : ''}, com todos os elementos que o integram, nomeadamente:`,
      items: elementos.map((e, i) => `${e}${i === elementos.length - 1 ? '.' : ';'}`),
      en: `The Transferor transfers to the Transferee the business "${v.estabelecimentoNome || '—'}" as a going concern, with the lease, equipment, stock, name, customers and utility contracts.`,
    });
    if (str(v.exclusoes)) {
      clauses.push({
        id: 'exclusoes',
        heading: 'Exclusões',
        text: `Não fazem parte do trespasse: ${semPonto(v.exclusoes)}.`,
        en: `Excluded: ${v.exclusoes}.`,
      });
    }
    const modo = `por transferência bancária para a conta com o NIB ${str(v.nib) || BLANK}, titulada ${T.pelo}`;
    clauses.push({
      id: 'preco',
      heading: 'Preço',
      text: numerar([
        `O preço do trespasse é de ${valorTexto(c.preco)}${c.mercadorias != null ? `, do qual ${valorTexto(c.mercadorias)} corresponde às mercadorias, valor a acertar em função do inventário conferido na data da entrega` : ''}.`,
        v.pagamento === 'assinatura'
          ? `O preço é pago na data da assinatura do presente contrato, ${modo}, dando ${T.o} a respectiva quitação.`
          : v.pagamento === 'prestacoes'
            ? `O preço é pago em ${quantos(c.n, 'prestação', 'prestações', true)} mensais de ${valorTexto(c.prestacao)}, vencendo-se a primeira em ${dateLong(v.primeiraPrestacao)}, ${modo}; a falta de pagamento de uma prestação importa o vencimento de todas as restantes.`
            : `O preço é pago em duas partes iguais de ${valorTexto(c.metade)}: a primeira na data da assinatura do presente contrato, de que ${T.o} dá quitação, e a segunda na data da entrega do estabelecimento, ${modo}.`,
      ]),
      en: `The price is ${c.preco != null ? formatMoney(c.preco) : '—'}, paid ${v.pagamento === 'assinatura' ? 'on signing' : v.pagamento === 'prestacoes' ? `in ${c.n} monthly instalments` : 'half on signing and half on handover'}.`,
    });
    clauses.push({
      id: 'dividas',
      heading: 'Dívidas e responsabilidades',
      text: numerar([
        c.dividas.length
          ? `${T.O} declara que o estabelecimento não tem outras dívidas a fornecedores, trabalhadores, senhorio, Estado ou segurança social além das constantes do Anexo II, que se obriga a pagar até à data da entrega.`
          : `${T.O} declara que o estabelecimento não tem dívidas a fornecedores, trabalhadores, senhorio, Estado ou segurança social.`,
        `As obrigações relativas ao estabelecimento constituídas até à data da entrega são da exclusiva responsabilidade ${T.de}, que indemniza ${R.o} por qualquer quantia que este seja obrigado a pagar por elas.`,
        `${T.O} declara ainda que mantém bens suficientes para garantir o cumprimento das suas demais obrigações.`,
      ]),
      en: 'The Transferor declares no debts (other than those in Annex II, which it will pay), remains liable for obligations up to handover, and keeps enough assets for its other obligations.',
    });
    if (v.trabalhadores !== 'nenhum') {
      clauses.push({
        id: 'trabalhadores',
        heading: 'Trabalhadores',
        text:
          v.trabalhadores === 'transmitem'
            ? `Os contratos de trabalho dos trabalhadores ao serviço do estabelecimento${str(v.trabalhadoresLista) ? `, a seguir identificados, ${str(v.trabalhadoresLista).split(/\n+/).map((s) => semPonto(s)).filter(Boolean).join('; ')},` : ''} transmitem-se para ${R.o}, que assume a posição de empregador, sendo da responsabilidade ${T.de} os salários e demais créditos vencidos até à data da entrega.`
            : `${T.O} faz cessar, nos termos da lei e à sua custa, os contratos de trabalho dos trabalhadores ao serviço do estabelecimento antes da data da entrega, entregando-o sem trabalhadores.`,
        en: v.trabalhadores === 'transmitem' ? 'Employment contracts pass to the Transferee; amounts due up to handover are for the Transferor.' : 'The Transferor ends the employment contracts lawfully, at its own cost, before handover.',
      });
    }
    clauses.push({
      id: 'entrega',
      heading: 'Entrega',
      text: `A entrega efectiva do estabelecimento, com as chaves, os documentos e o inventário conferido e assinado por ambas as partes, tem lugar em ${dateLong(v.dataEntrega)}.`,
      en: `Handover with keys, documents and signed inventory on ${v.dataEntrega || '—'}.`,
    });
    if (v.incluiArrendamento) {
      clauses.push({
        id: 'arrendamento',
        heading: 'Comunicação ao senhorio',
        text: `${T.O} obriga-se a comunicar o trespasse ao senhorio, por escrito, logo após a assinatura do presente contrato, entregando ${R.ao} cópia da comunicação, bem como a entregar-lhe os recibos das rendas pagas até à data da entrega.`,
        en: 'The Transferor notifies the landlord in writing right after signing, gives the Transferee a copy, and hands over the rent receipts.',
      });
    }
    if (anosNC && anosNC > 0) {
      clauses.push({
        id: 'naoConcorrencia',
        heading: 'Não concorrência',
        text: `${T.O} não exerce, directa ou indirectamente, actividade concorrente com a do estabelecimento trespassado${str(v.naoConcorrenciaArea) ? ` em ${semPonto(v.naoConcorrenciaArea)}` : ' na sua área de influência'}, durante ${quantos(anosNC, 'ano', 'anos')} a contar da data da entrega.`,
        en: `The Transferor will not compete${v.naoConcorrenciaArea ? ` in ${v.naoConcorrenciaArea}` : ' in the area'} for ${anosNC} years from handover.`,
      });
    }
    const enc = v.despesasRegisto === 'trespassante' ? T.de : v.despesasRegisto === 'repartidas' ? 'de ambas as partes, em partes iguais' : R.de;
    clauses.push({
      id: 'registo',
      heading: 'Licenças e registo',
      text: `${T.O} colabora na transmissão ou no averbamento do alvará e das demais licenças da actividade e no registo do trespasse, cujas despesas são da responsabilidade ${enc}.`,
      en: 'The Transferor cooperates in transferring the licences and registering the transfer; costs as agreed.',
    });
    clauses.push(...clausulasFinais(v, { lei: `sobre o estabelecimento comercial (${cite('trespasseRegime')})` }));

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de trespasse' },
      ...partesBlocks(v, [
        { p: 'trespassante', role: T, en: 'Transferor' },
        { p: 'trespassario', role: R, en: 'Transferee' },
      ]),
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'É celebrado e reciprocamente aceite o presente contrato de trespasse, que se rege pelas cláusulas seguintes e, no que nelas for omisso, pela legislação aplicável:',
        en: 'This business transfer agreement is entered into on the following terms and, where silent, the applicable law:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fecho(ctx, [assinatura(ctx, 'trespassante', T, true), assinatura(ctx, 'trespassario', R)], {
        extraCols: [conjugeColumn(v, 'trespassante')],
          consentimento: consentimentoTexto(v, 'trespassante', T),
        notario: 'Espaço reservado ao notário para o reconhecimento presencial das assinaturas.',
      }),
    ];
    if (c.equipamento.length) {
      blocks.push(
        { type: 'pageBreakHint' },
        { type: 'title', text: 'Anexo I — Mobiliário, equipamento e utensílios' },
        {
          type: 'table',
          columns: [
            { label: 'N.º', width: 0.5, align: 'right' },
            { label: 'Artigo', width: 3.5 },
            { label: 'Quant.', width: 0.8, align: 'right' },
            { label: 'Estado', width: 1.6 },
          ],
          rows: c.equipamento.map((r: Record<string, unknown>, i: number) => [String(i + 1), str(r.item), str(r.quantidade) || '1', str(r.estado)]),
        },
      );
    }
    if (c.dividas.length) {
      blocks.push(
        { type: 'heading', text: 'Anexo II — Dívidas a pagar pelo trespassante', keepWithNext: true },
        {
          type: 'table',
          columns: [
            { label: 'N.º', width: 0.5, align: 'right' },
            { label: 'Credor', width: 4 },
            { label: 'Valor (MT)', width: 1.5, align: 'right' },
          ],
          rows: c.dividas.map((r: Record<string, unknown>, i: number) => [String(i + 1), str(r.credor), formatMoney(money(r.valor), false)]),
        },
      );
    }
    if (c.equipamento.length || c.dividas.length) {
      blocks.push({ type: 'signatures', columns: [assinatura(ctx, 'trespassante', T), assinatura(ctx, 'trespassario', R)] });
    }
    return blocks;
  },
});
