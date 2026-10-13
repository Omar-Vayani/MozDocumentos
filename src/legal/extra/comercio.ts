// Legal values for the "comercio" documents (day-to-day business operations).
// Keys must not clash with other files. Values read only from secondary
// sources, or whose article could not be read, carry `confidence: 'confirm'`
// and no article number.
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-13';

export const LAWS_COMERCIO = {
  estatutoOcam: {
    short: 'Estatuto da OCAM',
    cite: 'do Estatuto da Ordem dos Contabilistas e Auditores de Moçambique',
    title: 'Lei n.º 8/2012, de 8 de Fevereiro — Estatuto da Ordem dos Contabilistas e Auditores de Moçambique (OCAM)',
    url: 'https://ocam.org.mz/wp-content/uploads/2024/06/Esatatutos-OCAM-Portugues.pdf',
  },
  mcp2026: {
    short: 'Decreto n.º 40/2026',
    cite: 'do Decreto n.º 40/2026',
    title: 'Decreto n.º 40/2026, de 27 de Julho — Regulamento sobre Mera Comunicação Prévia para o Exercício de Actividades Económicas',
    url: 'https://www.jlaadvogados.com/post/aprova%C3%A7%C3%A3o-do-regulamento-sobre-mera-comunica%C3%A7%C3%A3o-pr%C3%A9via-para-o-exerc%C3%ADcio-de-actividades-econ%C3%B3micas-em',
  },
  licSimplificado2026: {
    short: 'Decreto n.º 41/2026',
    cite: 'do Decreto n.º 41/2026',
    title: 'Decreto n.º 41/2026 — Regulamento do Licenciamento Simplificado para o Exercício de Actividades Económicas (em vigor a 25 de Outubro de 2026)',
    url: 'https://www.jlaadvogados.com/post/aprova%C3%A7%C3%A3o-do-regulamento-sobre-o-licenciamento-simplificado-para-o-exerc%C3%ADcio-de-actividades-econ%C3%B3mic',
  },
  regimesAgricolas: {
    short: 'regimes sectoriais de comercialização agrícola',
    cite: 'dos regimes sectoriais de produção e comercialização agrícola',
    title: 'Regimes sectoriais de produção e comercialização do algodão, do tabaco e da castanha de caju (diplomas a confirmar)',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_COMERCIO = {
  // ------------------------------------------------------------------ Invoices
  facturaTipografia: {
    title: { pt: 'Facturas e guias: impressos autorizados', en: 'Invoices and delivery notes: authorised forms' },
    summary: {
      pt: 'As facturas, os documentos equivalentes (factura-recibo, venda a dinheiro) e as guias ou notas de devolução são emitidos em impresso de tipografia autorizada pelo Ministro que superintende a área das finanças, ou por programa de facturação certificado. Não podem ser feitos em modelos particulares.',
      en: 'Invoices, equivalent documents (invoice-receipt, cash sale) and delivery or return notes are issued on forms printed by an authorised printer, or by certified invoicing software. Private templates cannot be used.',
    },
    law: 'civa',
    article: 'art. 27.º, n.º 7',
    sourceUrl: 'https://www.at.gov.mz/eng/Tax-Procedures/Value-Added-Tax',
    lastVerified: V,
    confidence: 'verified',
  },
  facturaSubmissaoAT: {
    title: { pt: 'Envio das facturas à Autoridade Tributária', en: 'Submission of invoices to the Tax Authority' },
    summary: {
      pt: 'Desde Maio de 2025, os sujeitos passivos de IVA enviam todos os meses à Autoridade Tributária as facturas emitidas no mês anterior, através do e-Declaração, a partir de programa de facturação certificado. A Lei n.º 10/2025 reforçou esta obrigação a partir de 1 de Janeiro de 2026.',
      en: 'Since May 2025, VAT-registered businesses send the Tax Authority the previous month’s invoices every month through e-Declaração, from certified invoicing software. Law 10/2025 strengthened this from 1 January 2026.',
    },
    law: 'civa',
    sourceUrl: 'https://www.dlapiperafrica.com/pt/mozambique/insights/2025/Notice-from-the-Tax-Authority-Regarding-the-Obligation-to-Submit-Invoices-',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Aviso n.º 40/AT/DGI/2025; regulamentação da Lei n.º 10/2025 por confirmar.', en: 'Notice 40/AT/DGI/2025; regulations under Law 10/2025 to be confirmed.' },
  },
  civaPrazoFactura: {
    title: { pt: 'Prazo de emissão da factura', en: 'Deadline to issue the invoice' },
    summary: {
      pt: 'A factura é emitida até ao quinto dia útil seguinte ao momento em que o IVA se torna devido.',
      en: 'The invoice is issued by the fifth working day after VAT becomes due.',
    },
    law: 'civa',
    value: { diasUteis: 5 },
    sourceUrl: 'https://www.at.gov.mz/eng/Tax-Procedures/Value-Added-Tax',
    lastVerified: V,
    confidence: 'confirm',
  },
  ivaAdiantamento: {
    title: { pt: 'Adiantamentos e IVA', en: 'Advance payments and VAT' },
    summary: {
      pt: 'Quando um sujeito passivo de IVA recebe um pagamento antes de entregar os bens ou prestar o serviço (sinal ou adiantamento), o imposto pode tornar-se devido nesse momento e exigir a emissão de factura pelo valor recebido. Um recibo particular não substitui a factura.',
      en: 'When a VAT-registered business is paid before delivering (deposit or advance), VAT may become due at that moment and an invoice for the amount received may be required. A private receipt does not replace it.',
    },
    law: 'civa',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Regra do Código do IVA sobre pagamentos antecipados por confirmar no texto consolidado.', en: 'VAT Code rule on advance payments to be confirmed in the consolidated text.' },
  },

  // ------------------------------------------------------------------ Consumers
  consumidorGarantia: {
    title: { pt: 'Garantia legal dos bens', en: 'Legal warranty of goods' },
    summary: {
      pt: 'O fornecedor garante o bom estado e funcionamento dos bens móveis não consumíveis por período não inferior a um ano, e dos imóveis por cinco anos, contados da aquisição. As partes podem acordar prazo mais longo. A garantia não cobre o mau uso e suspende-se enquanto o consumidor estiver privado do bem por reparação.',
      en: 'The supplier warrants durable movable goods for at least one year and real estate for five years from purchase. A longer period may be agreed. Misuse is excluded and the period is suspended while the goods are being repaired.',
    },
    law: 'lei22_2009',
    value: { movelMeses: 12, imovelAnos: 5 },
    sourceUrl: 'https://www.tta-advogados.com/xms/files/Arquivo/2022-08/2017/fevereiro/Regulamento_da_Lei_de_Defesa_do_Consumidor.pdf',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Prazos lidos em resumos e na cópia do BR; o número do artigo diverge entre fontes.', en: 'Periods read from summaries and the gazette scan; sources disagree on the article number.' },
  },
  consumidorRetractacao: {
    title: { pt: 'Direito de retractação', en: 'Right of withdrawal' },
    summary: {
      pt: 'Nos contratos celebrados fora do estabelecimento comercial, por correspondência ou meios equivalentes, o consumidor pode desistir no prazo de sete dias úteis a contar da recepção do bem ou da celebração do contrato. As quantias pagas são restituídas de imediato.',
      en: 'For contracts made away from business premises, by correspondence or similar means, the consumer may withdraw within seven working days of receiving the goods or signing. Payments are refunded immediately.',
    },
    law: 'lei22_2009',
    value: { diasUteis: 7 },
    sourceUrl: 'https://faolex.fao.org/docs/pdf/moz208736.pdf',
    lastVerified: V,
    confidence: 'confirm',
  },
  livroReclamacoes: {
    title: { pt: 'Livro de reclamações', en: 'Complaints book' },
    summary: {
      pt: 'Os fornecedores de bens e prestadores de serviços ao consumidor devem ter um livro de reclamações à disposição dos clientes.',
      en: 'Suppliers of goods and services to consumers must keep a complaints book available to customers.',
    },
    law: 'lei22_2009',
    sourceUrl: 'https://www.tta-advogados.com/xms/files/Arquivo/2022-08/2017/fevereiro/Regulamento_da_Lei_de_Defesa_do_Consumidor.pdf',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Previsto no Regulamento (Decreto n.º 27/2016); modelo e fornecimento do livro por confirmar.', en: 'Set out in the Regulation (Decree 27/2016); the model and supply of the book are to be confirmed.' },
  },

  // ------------------------------------------------------------------ Professions and licensing
  ocamTitulos: {
    title: { pt: 'Contabilista e Auditor Certificado', en: 'Certified Accountant and Auditor' },
    summary: {
      pt: 'Os títulos de Contabilista Certificado e de Auditor Certificado são reservados aos membros inscritos na Ordem dos Contabilistas e Auditores de Moçambique. A auditoria de contas é reservada aos Auditores Certificados e às sociedades de auditoria.',
      en: 'The titles Certified Accountant and Certified Auditor are reserved to members registered with the Mozambican Order of Accountants and Auditors. Statutory audit is reserved to certified auditors and audit firms.',
    },
    law: 'estatutoOcam',
    sourceUrl: 'https://ocam.org.mz/wp-content/uploads/2024/06/Esatatutos-OCAM-Portugues.pdf',
    lastVerified: V,
    confidence: 'verified',
    note: { pt: 'A Assembleia da República aprovou em 2026 uma alteração ao Estatuto; texto final por confirmar.', en: 'Parliament approved an amendment to the Statute in 2026; final text to be confirmed.' },
  },
  tituloActividade: {
    title: { pt: 'Licença ou certidão de actividade', en: 'Business licence or certificate' },
    summary: {
      pt: 'As actividades económicas de baixo risco iniciam-se com a mera comunicação prévia; a certidão emitida tem o valor de licença ou alvará. As restantes seguem o licenciamento simplificado ou o licenciamento comercial. O regime do comércio vai ser revisto ao abrigo de autorização legislativa de 2026.',
      en: 'Low-risk business activities start with a prior notice; the certificate issued has the value of a licence. Others follow simplified or commercial licensing. The trade regime is being revised under a 2026 legislative authorisation.',
    },
    law: 'mcp2026',
    value: { certidaoHoras: 2 },
    sourceUrl: 'https://www.rtp.pt/noticias/economia/atividades-economicas-de-baixo-risco-em-mocambique-com-certidao-em-duas-horas-e-assinatura-digital_n1757370',
    lastVerified: V,
    confidence: 'confirm',
  },

  // ------------------------------------------------------------------ Contracts
  transporteRegime: {
    title: { pt: 'Contrato de transporte', en: 'Contract of carriage' },
    summary: {
      pt: 'O contrato de transporte é um contrato comercial regido pelas normas especiais do meio de transporte utilizado. O transportador de mercadorias por conta de outrem deve estar licenciado. As mercadorias circulam acompanhadas da factura ou da guia de remessa do vendedor.',
      en: 'Carriage is a commercial contract governed by the special rules for the mode of transport. A carrier for hire must be licensed. Goods travel with the seller’s invoice or delivery note.',
    },
    law: 'regimeContratosComerciais',
    sourceUrl: 'https://fll.um.edu.mo/wp-content/uploads/2024/09/II-17-Almeida-Machava_p589-633.pdf',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirme os artigos do Decreto-Lei n.º 3/2022 e o regulamento do transporte rodoviário de mercadorias.', en: 'Confirm the articles of Decree-Law 3/2022 and the road freight regulation.' },
  },
  concessaoCulturas: {
    title: { pt: 'Culturas com regime especial', en: 'Crops under special regimes' },
    summary: {
      pt: 'O algodão e o tabaco são produzidos em áreas de concessão, em que a empresa concessionária compra a produção a preços aprovados; a comercialização da castanha de caju segue regras de campanha com preços de referência. Estas culturas não devem ser contratadas com modelos particulares.',
      en: 'Cotton and tobacco are grown in concession areas where the concessionaire buys at approved prices; raw cashew marketing follows campaign rules with reference prices. These crops should not be contracted with private templates.',
    },
    law: 'regimesAgricolas',
    lastVerified: V,
    confidence: 'confirm',
  },
} satisfies Record<string, LegalEntryDef>;
