// Condições gerais de venda e de prestação de serviços: the supplier's
// standard terms, handed to the customer before the contract (RJCC: terms
// not communicated may be treated as not written). Consumer sales keep the
// rights of the Lei de Defesa do Consumidor.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, l } from './_shared';
import { arbitragemField, foroField } from './_contratos';
import { int, issuerName, semPonto, str } from './_comercio';

const n = (x: unknown) => int(x);

export default defineTemplate({
  id: 'condicoes-gerais-venda',
  family: 'mapa',
  sections: [
    { id: 'ambito', title: l('Âmbito', 'Scope') },
    { id: 'precos', title: l('Preços e pagamento', 'Prices and payment') },
    { id: 'entrega', title: l('Entrega, reclamações e garantia', 'Delivery, complaints and warranty') },
    { id: 'outras', title: l('Outras cláusulas', 'Other terms') },
  ],
  fields: [
    {
      name: 'ambito',
      type: 'radio',
      section: 'ambito',
      label: l('Aplica-se a', 'Applies to'),
      options: [
        { value: 'bens', label: l('Venda de bens', 'Sale of goods') },
        { value: 'servicos', label: l('Prestação de serviços', 'Services') },
        { value: 'ambos', label: l('Bens e serviços', 'Goods and services') },
      ],
      default: 'bens',
    },
    {
      name: 'clientes',
      type: 'radio',
      section: 'ambito',
      label: l('Clientes', 'Customers'),
      help: l('Se vende a consumidores (particulares), a lei de defesa do consumidor aplica-se e as cláusulas são ajustadas.', 'If you sell to consumers, consumer law applies and the terms are adjusted.'),
      options: [
        { value: 'consumidores', label: l('Também consumidores (particulares)', 'Consumers too') },
        { value: 'empresas', label: l('Só empresas e profissionais', 'Businesses only') },
      ],
      default: 'consumidores',
    },
    { name: 'versaoData', type: 'date', section: 'ambito', width: 'half', label: l('Data desta versão', 'Version date'), default: (c) => c.today },
    { name: 'local', type: 'text', section: 'ambito', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'validadeOrcamentoDias', type: 'number', section: 'precos', width: 'half', min: 1, max: 180, default: 15, label: l('Validade dos orçamentos (dias)', 'Quotes valid for (days)') },
    {
      name: 'precosIva',
      type: 'select',
      section: 'precos',
      width: 'half',
      label: l('Os preços', 'Prices'),
      options: [
        { value: 'incluido', label: l('Incluem IVA', 'Include VAT') },
        { value: 'acrescido', label: l('Não incluem IVA (acresce)', 'Exclude VAT') },
        { value: 'naoAplica', label: l('Sem IVA (isento ou não sujeito)', 'No VAT') },
      ],
      default: 'incluido',
    },
    {
      name: 'pagamentoModo',
      type: 'select',
      section: 'precos',
      label: l('Pagamento, salvo acordo escrito', 'Payment, unless agreed otherwise'),
      options: [
        { value: 'encomenda', label: l('No acto da encomenda', 'When ordering') },
        { value: 'entrega', label: l('Na entrega ou conclusão do serviço', 'On delivery or completion') },
        { value: 'adiantamento', label: l('Adiantamento e saldo na entrega', 'Advance and balance on delivery') },
        { value: 'prazo', label: l('A prazo, após a emissão da factura', 'On credit, after the invoice') },
      ],
      default: 'entrega',
    },
    { name: 'adiantamentoPct', type: 'number', section: 'precos', width: 'half', min: 1, max: 100, default: 50, label: l('Adiantamento (%)', 'Advance (%)'), showIf: (v) => v.pagamentoModo === 'adiantamento' },
    { name: 'prazoPagamentoDias', type: 'number', section: 'precos', width: 'half', min: 1, max: 180, default: 30, label: l('Prazo de pagamento (dias)', 'Payment term (days)'), showIf: (v) => v.pagamentoModo === 'prazo' },
    { name: 'jurosTaxa', type: 'text', section: 'precos', width: 'half', label: l('Juros de mora (opcional)', 'Default interest (optional)'), placeholder: l('Ex.: um por cento ao mês. Vazio = taxa legal', 'E.g. one per cent a month. Empty = legal rate') },
    { name: 'reservaPropriedade', type: 'toggle', section: 'precos', default: true, label: l('Reserva de propriedade até ao pagamento total', 'Retention of title until paid in full'), showIf: (v) => v.ambito !== 'servicos' },

    {
      name: 'entregaRisco',
      type: 'radio',
      section: 'entrega',
      label: l('O risco passa para o cliente', 'Risk passes to the customer'),
      options: [
        { value: 'entrega', label: l('Com a entrega ao cliente', 'On delivery to the customer') },
        { value: 'transportador', label: l('Com a entrega ao transportador do cliente', 'On handover to the customer’s carrier') },
      ],
      default: 'entrega',
      showIf: (v) => v.ambito !== 'servicos',
    },
    { name: 'reclamacaoDias', type: 'number', section: 'entrega', width: 'half', min: 1, max: 90, default: 8, label: l('Prazo para reclamar defeitos ocultos (empresas, dias)', 'Days to report hidden defects (businesses)') },
    { name: 'garantiaMeses', type: 'number', section: 'entrega', width: 'half', min: 0, max: 120, default: 12, label: l('Garantia (meses)', 'Warranty (months)'), help: l('Para consumidores, nunca inferior ao mínimo legal.', 'For consumers, never below the legal minimum.') },
    { name: 'vendaDistancia', type: 'toggle', section: 'entrega', label: l('Vende por telefone, internet, WhatsApp ou ao domicílio', 'Sells by phone, online, WhatsApp or door to door'), help: l('Acrescenta o direito do consumidor de desistir da compra.', 'Adds the consumer’s right to withdraw.'), showIf: (v) => v.clientes !== 'empresas' },
    { name: 'aceitacaoDias', type: 'number', section: 'entrega', width: 'half', min: 1, max: 60, default: 5, label: l('Prazo para reclamar do serviço (dias)', 'Days to object to the service'), showIf: (v) => v.ambito !== 'bens' },

    { name: 'limitacaoResponsabilidade', type: 'toggle', section: 'outras', label: l('Limitar a responsabilidade ao valor do fornecimento', 'Limit liability to the value of the supply'), help: l('Só para clientes empresariais.', 'Business customers only.'), showIf: (v) => v.clientes === 'empresas' },
    { name: 'contactoReclamacoes', type: 'text', section: 'outras', label: l('Contacto para reclamações', 'Complaints contact'), default: (c) => [c.profile?.email, c.profile?.telefones].filter(Boolean).join(' · ') },
    foroField('outras'),
    arbitragemField('outras'),
    { name: 'linhaAceitacao', type: 'toggle', section: 'outras', default: true, label: l('Incluir linha "Tomei conhecimento e aceito" para o cliente assinar', 'Include an acceptance line for the customer') },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const minimo = ctx.legal.value<{ movelMeses: number }>('consumidorGarantia').movelMeses;
    const gm = n(v.garantiaMeses);
    if (v.clientes !== 'empresas' && v.ambito !== 'servicos' && (gm == null || gm < minimo)) {
      w.push({
        level: 'error',
        field: 'garantiaMeses',
        message: l(
          `A garantia mínima legal dos bens móveis duradouros vendidos a consumidores é de ${minimo} meses (${cite('consumidorGarantia')}).`,
          `The minimum legal warranty for durable goods sold to consumers is ${minimo} months.`,
        ),
      });
    }
    w.push({
      level: 'info',
      message: l(
        `Entregue estas condições ao cliente antes do contrato (anexe-as ao orçamento ou à ficha de cliente) e guarde prova. Cláusulas não comunicadas podem considerar-se não escritas (${cite('clausulasNaoEscritas')}).`,
        'Give these terms to the customer before the contract (attach them to the quote or customer form) and keep proof. Terms not communicated may be treated as not written.',
      ),
    });
    if (v.clientes !== 'empresas') {
      w.push({ level: 'info', message: l('Tenha disponível o livro de reclamações.', 'Keep the complaints book available.') });
    }
    return w;
  },

  personName: () => 'condicoes-gerais',
  documentDate: (v) => v.versaoData,

  blocks: (ctx) => {
    const v = ctx.values;
    const p = ctx.profile;
    const nome = issuerName(ctx);
    const consumidores = v.clientes !== 'empresas';
    const bens = v.ambito !== 'servicos';
    const servicos = v.ambito !== 'bens';
    const garantia = ctx.legal.value<{ movelMeses: number }>('consumidorGarantia');
    const retract = ctx.legal.value<{ diasUteis: number }>('consumidorRetractacao');
    const gm = n(v.garantiaMeses);
    const objecto = v.ambito === 'bens' ? 'vendas de bens' : v.ambito === 'servicos' ? 'prestações de serviços' : 'vendas de bens e prestações de serviços';
    const fornecedor = [
      `**${nome}**`,
      p?.nuit ? `NUIT ${p.nuit}` : '',
      p?.morada?.cidade ? `com sede em ${[p.morada.rua, p.morada.numero ? `n.º ${p.morada.numero}` : '', p.morada.cidade].filter(Boolean).join(', ')}` : '',
    ].filter(Boolean).join(', ');

    const items: ClauseItem[] = [];
    items.push({
      id: 'cg-ambito',
      heading: 'Âmbito',
      text: `As presentes Condições Gerais aplicam-se a todas as ${objecto} efectuadas por ${fornecedor} (o "Fornecedor"), salvo acordo escrito em contrário. As condições particulares constantes de orçamento, proposta ou nota de encomenda aceite prevalecem sobre estas.`,
      en: 'These general terms apply to all sales and services by the Supplier unless otherwise agreed in writing. Specific terms in an accepted quote or order prevail.',
    });
    const val = n(v.validadeOrcamentoDias);
    items.push({
      id: 'cg-encomendas',
      heading: 'Orçamentos e encomendas',
      text: `Os orçamentos são válidos pelo prazo neles indicado ou, na falta de indicação, por ${val ? `${val} dias` : 'um prazo razoável'}. O contrato considera-se celebrado com a aceitação escrita do orçamento pelo Cliente ou com a confirmação da encomenda pelo Fornecedor.`,
      en: 'Quotes are valid for the period stated. The contract is formed when the customer accepts the quote in writing or the Supplier confirms the order.',
    });
    items.push({
      id: 'cg-precos',
      heading: 'Preços',
      text: `Os preços são indicados em meticais (MT) e ${v.precosIva === 'acrescido' ? 'não incluem o IVA, que acresce à taxa legal em vigor' : v.precosIva === 'naoAplica' ? 'não incluem IVA, por o Fornecedor não o liquidar nos termos da lei' : 'incluem o IVA à taxa legal em vigor'}. O transporte, a instalação e o seguro só estão incluídos quando tal constar expressamente do orçamento ou da encomenda.`,
      en: 'Prices are in meticais; VAT treatment as stated. Transport, installation and insurance are included only when expressly stated.',
    });
    const pz = n(v.prazoPagamentoDias);
    const quando =
      v.pagamentoModo === 'encomenda'
        ? 'no acto da encomenda'
        : v.pagamentoModo === 'adiantamento'
          ? `${n(v.adiantamentoPct) ? `${n(v.adiantamentoPct)}% ` : 'uma parte '}no acto da encomenda, a título de adiantamento, e o saldo na entrega ou conclusão`
          : v.pagamentoModo === 'prazo'
            ? `no prazo de ${pz ? `${pz} dias` : BLANK} a contar da emissão da factura`
            : 'na entrega dos bens ou na conclusão do serviço';
    items.push({
      id: 'cg-pagamento',
      heading: 'Pagamento',
      text: `Salvo acordo escrito, o pagamento é feito ${quando}, por transferência bancária, depósito, cheque visado ou carteira móvel. O Fornecedor emite a factura e o recibo nos termos da lei fiscal.`,
      en: 'Unless agreed in writing, payment is due as stated, by transfer, deposit, certified cheque or mobile wallet. The Supplier issues the invoice and receipt as required by tax law.',
    });
    items.push({
      id: 'cg-mora',
      heading: 'Atraso no pagamento',
      text: `O atraso no pagamento constitui o Cliente em mora e confere ao Fornecedor o direito a juros de mora ${str(v.jurosTaxa) ? `à taxa de ${semPonto(v.jurosTaxa)}` : 'à taxa legal'}, bem como o direito de suspender as entregas e os serviços pendentes até à regularização.`,
      en: 'Late payment puts the customer in default: interest is due and the Supplier may suspend pending deliveries and services until paid.',
    });
    if (bens && v.reservaPropriedade) {
      items.push({
        id: 'cg-reserva',
        heading: 'Reserva de propriedade',
        text: 'Os bens vendidos continuam a ser propriedade do Fornecedor até ao pagamento integral do preço.',
        en: 'Goods remain the Supplier’s property until paid in full.',
      });
    }
    if (bens) {
      items.push({
        id: 'cg-entrega',
        heading: 'Entrega e risco',
        text: `Os prazos de entrega são indicativos, salvo se forem expressamente garantidos por escrito. O risco de perda ou deterioração dos bens passa para o Cliente ${v.entregaRisco === 'transportador' ? 'com a sua entrega ao transportador indicado pelo Cliente' : 'com a entrega'}. Os bens circulam acompanhados da factura ou da guia de remessa.`,
        en: 'Delivery dates are indicative unless guaranteed in writing. Risk passes on delivery (or on handover to the customer’s carrier). Goods travel with the invoice or delivery note.',
      });
      const rd = n(v.reclamacaoDias);
      items.push({
        id: 'cg-reclamacoes',
        heading: 'Recepção e reclamações',
        text: `O Cliente deve conferir os bens no acto da entrega e anotar na guia de remessa as faltas ou danos visíveis.${consumidores ? ' Os consumidores mantêm os prazos e os direitos previstos na lei de defesa do consumidor.' : ` Os defeitos ocultos devem ser comunicados por escrito no prazo de ${rd ? `${rd} dias` : BLANK} após a sua descoberta.`}`,
        en: 'The customer checks goods on delivery and notes visible shortages or damage. Hidden defects must be reported in writing within the stated period (consumers keep their legal rights).',
      });
      items.push({
        id: 'cg-garantia',
        heading: 'Garantia',
        text: consumidores
          ? `Os bens móveis duradouros beneficiam de garantia de bom funcionamento pelo prazo de ${Math.max(gm ?? 0, garantia.movelMeses)} meses a contar da data da aquisição, que se suspende enquanto o bem estiver em reparação. Em caso de defeito, o consumidor pode exigir a reparação ou a substituição do bem, a redução do preço ou a resolução do contrato, nos termos da lei. A garantia não cobre os danos resultantes de mau uso, acidente, intervenção de terceiros não autorizados ou desgaste normal.`
          : `Os bens têm garantia de ${gm ? `${gm} meses` : BLANK} a contar da entrega contra defeitos de fabrico. A garantia não cobre os danos resultantes de mau uso, acidente, intervenção de terceiros não autorizados ou desgaste normal.`,
        en: 'Goods carry a warranty for the period stated from purchase or delivery; for consumers, never below the legal minimum, with repair, replacement, price reduction or termination available. Misuse, accidents, unauthorised repairs and normal wear are excluded.',
      });
    }
    if (consumidores && v.vendaDistancia) {
      items.push({
        id: 'cg-retractacao',
        heading: 'Direito de desistência',
        text: `Nas vendas celebradas fora do estabelecimento comercial, por telefone, por meios electrónicos ou ao domicílio, o consumidor pode desistir do contrato no prazo de ${retract.diasUteis} dias úteis a contar da recepção do bem ou da celebração do contrato, sem pagar indemnização. As quantias pagas são restituídas de imediato.`,
        en: `For sales made away from the shop (phone, online, door to door), the consumer may withdraw within ${retract.diasUteis} working days of receipt or signing, without penalty; payments are refunded immediately.`,
      });
    }
    if (servicos) {
      const ad = n(v.aceitacaoDias);
      items.push({
        id: 'cg-servicos',
        heading: 'Serviços',
        text: `Os serviços são prestados de acordo com o orçamento ou a proposta aceite. O Cliente faculta o acesso, as informações e os meios necessários à sua execução. Considera-se aceite o serviço se o Cliente não apresentar reclamação fundamentada no prazo de ${ad ? `${ad} dias` : BLANK} após a sua conclusão.`,
        en: 'Services are provided as per the accepted quote. The customer provides access and information. A service is deemed accepted if no reasoned complaint is made within the stated period after completion.',
      });
    }
    if (!consumidores && v.limitacaoResponsabilidade) {
      items.push({
        id: 'cg-responsabilidade',
        heading: 'Limitação de responsabilidade',
        text: 'A responsabilidade do Fornecedor por danos emergentes do fornecimento limita-se ao valor do fornecimento em causa, excepto em caso de dolo ou culpa grave.',
        en: 'The Supplier’s liability is limited to the value of the supply, except for wilful misconduct or gross negligence.',
      });
    }
    items.push({
      id: 'cg-dados',
      heading: 'Dados pessoais',
      text: 'Os dados do Cliente são tratados apenas para a execução do contrato, a facturação, a cobrança e o cumprimento de obrigações legais.',
      en: 'Customer data are used only to perform the contract, invoice, collect and comply with the law.',
    });
    items.push({
      id: 'cg-livro',
      heading: 'Reclamações',
      text: `${consumidores ? 'O Fornecedor dispõe de livro de reclamações. ' : ''}As reclamações podem ser dirigidas ao Fornecedor${str(v.contactoReclamacoes) ? ` através de ${semPonto(v.contactoReclamacoes)}` : ' por escrito'}.`,
      en: 'Complaints can be sent to the Supplier through the contact given; consumers may also use the complaints book.',
    });
    const foro = semPonto(v.foro) || 'tribunal judicial competente';
    items.push({
      id: 'cg-foro',
      heading: 'Lei aplicável e foro',
      text: `Estas Condições regem-se pela lei moçambicana. ${v.arbitragem ? 'Os litígios que não sejam resolvidos por acordo são decididos por arbitragem, nos termos da legislação moçambicana sobre arbitragem, conciliação e mediação, com sede em Maputo.' : `Os litígios que não sejam resolvidos por acordo são decididos pelo ${foro}${consumidores ? ', sem prejuízo das regras legais de competência aplicáveis aos consumidores' : ''}.`}`,
      en: 'Mozambican law applies. Disputes not settled by agreement go to the court (or arbitration) stated.',
    });

    const blocks: Block[] = [
      { type: 'title', text: `Condições gerais de ${v.ambito === 'servicos' ? 'prestação de serviços' : v.ambito === 'ambos' ? 'venda e de prestação de serviços' : 'venda'}`, subtitle: `${p?.kind === 'pessoa' ? `${nome} · ` : ''}Versão de ${dateLong(v.versaoData)}` },
      { type: 'numberedClauses', style: 'numeric', items },
    ];
    if (v.linhaAceitacao) {
      blocks.push(
        {
          type: 'paragraph',
          id: 'cg-aceitacao',
          text: 'O Cliente declara ter recebido e lido as presentes Condições Gerais, que aceita.',
          en: 'The customer declares having received and read these general terms and accepts them.',
          keepWithNext: true,
        },
        {
          type: 'signatures',
          placeDate: `${ctx.place}, ___ de ______________ de ______`,
          columns: [{ role: 'O Cliente', detail: 'Nome: ______________________________' }],
        },
      );
    }
    return blocks;
  },
});
