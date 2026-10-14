// Legal values for the "financas" documents (banking, guarantees, insurance and tax).
// Keys must be unique across all legal files; new keys start with `fin`.
// The primary texts (Boletim da República, Banco de Moçambique notices, Autoridade
// Tributária) could not be read in full when these entries were written, so every
// entry is `confirm` and prints no article number. Deadlines are kept out of the
// documents until they are confirmed.
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-14';

export const LAWS_FINANCAS = {
  finLgt: {
    short: 'Lei Geral Tributária',
    cite: 'da Lei Geral Tributária (Lei n.º 2/2006, de 22 de Março)',
    title: 'Lei n.º 2/2006, de 22 de Março — Lei Geral Tributária (estabelece os princípios e normas gerais do ordenamento jurídico tributário moçambicano e o procedimento tributário)',
  },
  finLeiBasesTributario: {
    short: 'Lei de Bases do Sistema Tributário',
    cite: 'da Lei de Bases do Sistema Tributário (Lei n.º 15/2002, de 26 de Junho)',
    title: 'Lei n.º 15/2002, de 26 de Junho — Lei de Bases do Sistema Tributário',
  },
  finTribunaisFiscais: {
    short: 'Lei dos Tribunais Fiscais',
    cite: 'da Lei dos Tribunais Fiscais (Lei n.º 2/2004, de 21 de Janeiro)',
    title: 'Lei n.º 2/2004, de 21 de Janeiro — Lei dos Tribunais Fiscais (com o Diploma Legislativo n.º 783 — contencioso das contribuições e impostos — e o Código das Execuções Fiscais, aplicáveis por remissão)',
  },
  finDm85_2023: {
    short: 'Diploma Ministerial n.º 85/2023',
    cite: 'do Diploma Ministerial n.º 85/2023',
    title: 'Diploma Ministerial n.º 85/2023 — validade e uso da certidão de quitação emitida pela Administração Tributária',
    url: 'https://www.rsm.global/mozambique/pt-pt/news/validade-da-certidao-de-quitacao-emitida-pela-administracao-fiscal',
  },
  finLicsf: {
    short: 'Lei n.º 20/2020',
    cite: 'da Lei das Instituições de Crédito e Sociedades Financeiras (Lei n.º 20/2020, de 31 de Dezembro)',
    title: 'Lei n.º 20/2020, de 31 de Dezembro — Lei das Instituições de Crédito e Sociedades Financeiras, regulamentada pelo Decreto n.º 50/2024, de 11 de Julho',
    url: 'https://www.bancomoc.mz/media/jcdnvi0r/decreto-50-2024-11-de-julho-regulamento-da-lei-das-institui%C3%A7%C3%B5es-de-cr%C3%A9dito-e-sociedades-financeiras.pdf',
  },
  finAviso9_2020: {
    short: 'Aviso n.º 9/GBM/2020',
    cite: 'do Regulamento de Tratamento de Reclamações (Aviso n.º 9/GBM/2020)',
    title: 'Aviso n.º 9/GBM/2020 do Banco de Moçambique — Regulamento de Tratamento de Reclamações dos clientes das instituições de crédito e sociedades financeiras (revoga o Aviso n.º 4/GBM/2009)',
    url: 'https://amomif.org.mz/wp-content/uploads/2025/01/Avisos-8-9-e-10-2020.pdf',
  },
  finAviso8_2021: {
    short: 'Aviso n.º 8/GBM/2021',
    cite: 'do Código de Conduta das Instituições de Crédito e Sociedades Financeiras e de Protecção do Consumidor Financeiro (Aviso n.º 8/GBM/2021)',
    title: 'Aviso n.º 8/GBM/2021, de 22 de Dezembro — Código de Conduta das Instituições de Crédito e Sociedades Financeiras e de Protecção do Consumidor Financeiro',
    url: 'https://www.mozabanco.co.mz/media/5430/aviso-n%C2%BA-8-gbm-2021-de-22-de-dezembro-c%C3%B3digo-de-conduta-das-icsf-e-de-protec%C3%A7%C3%A3o-do-consumidor-financeiro.pdf',
  },
  finMicrofinancas: {
    short: 'Regulamento das Operações de Microfinanças',
    cite: 'do Regulamento das Operações de Microfinanças',
    title: 'Decreto n.º 57/2004, de 10 de Dezembro — Regulamento das Operações de Microfinanças (a ler com a Lei n.º 20/2020 e o Decreto n.º 50/2024)',
  },
  finPrimeRate: {
    short: 'Prime Rate do Sistema Financeiro Moçambicano',
    cite: 'das regras do Banco de Moçambique sobre a Prime Rate do Sistema Financeiro Moçambicano',
    title: 'Prime Rate do Sistema Financeiro Moçambicano — taxa de referência única publicada mensalmente pela Associação Moçambicana de Bancos e pelo Banco de Moçambique',
    url: 'https://www.bancomoc.mz',
  },
  finGarantiasMobiliarias: {
    short: 'Lei das Garantias Mobiliárias',
    cite: 'da Lei das Garantias Mobiliárias (Lei n.º 19/2018, de 28 de Dezembro)',
    title: 'Lei n.º 19/2018, de 28 de Dezembro — regime jurídico das garantias mobiliárias e Central de Registo de Garantias Mobiliárias, regulamentada pelo Decreto n.º 7/2020',
    url: 'https://www.dlapiperafrica.com/pt/mozambique/insights/2020/a-lei-das-garantias-mobiliarias.html',
  },
  finRegimeSeguros: {
    short: 'Regime Jurídico dos Seguros',
    cite: 'do Regime Jurídico dos Seguros',
    title: 'Regime Jurídico dos Seguros — Decreto-Lei n.º 1/2010, de 31 de Dezembro, e Regulamento (Decreto n.º 30/2011), substituídos pelo novo regime aprovado pelo Conselho de Ministros em 2026',
    url: 'https://www.bsa.issm.gov.mz/cps/Faq',
  },
  finLeiUniformeCheque: {
    short: 'Lei Uniforme relativa ao Cheque',
    cite: 'da Lei Uniforme relativa ao Cheque',
    title: 'Lei Uniforme relativa ao Cheque (Convenção de Genebra de 1931, aplicável em Moçambique)',
  },
} satisfies Record<string, LawInfo>;

const C = 'confirm' as const;

export const LEGAL_FINANCAS = {
  // ------------------------------------------------------------------ Tax procedure
  finReclamacaoGraciosa: {
    title: { pt: 'Reclamação graciosa', en: 'Administrative tax objection' },
    summary: {
      pt: 'O contribuinte pode pedir à Administração Tributária a revisão de um acto tributário (liquidação, coima, correcção), por escrito, dirigida ao órgão que o praticou. A reclamação não impede o recurso hierárquico nem o recurso contencioso. A Administração deve decidir no prazo legal; sem decisão, presume-se o indeferimento para efeitos de recurso.',
      en: 'A taxpayer may ask the Tax Authority to review a tax act (assessment, fine, adjustment) in writing, addressed to the office that issued it. It does not prevent an administrative appeal or a court challenge. The Authority must decide within the legal period; without a decision, rejection is presumed for appeal purposes.',
    },
    law: 'finLgt',
    value: { decisaoDias: 60 },
    sourceUrl: 'https://www.asg.co.mz/as-implicacoes-do-indeferimento-tacito-no-procedimento-tributario-mocambicano/',
    lastVerified: V,
    confidence: C,
    note: {
      pt: 'Fontes secundárias situam o regime nos artigos 126 a 133 da Lei n.º 2/2006 e o prazo de decisão de 60 dias no artigo 132, n.º 3. O prazo para apresentar a reclamação não foi confirmado: confirme-o na nota de liquidação ou na Direcção de Área Fiscal.',
      en: 'Secondary sources place the regime in arts. 126 to 133 of Law 2/2006 and the 60-day decision period in art. 132(3). The deadline to file was not confirmed: check it on the assessment notice or with the tax office.',
    },
  },
  finRecursoHierarquico: {
    title: { pt: 'Recurso hierárquico em matéria tributária', en: 'Hierarchical appeal in tax matters' },
    summary: {
      pt: 'Da decisão da reclamação graciosa, ou de outro acto tributário, cabe recurso hierárquico para o superior do órgão que decidiu (Director-Geral de Impostos ou Presidente da Autoridade Tributária, conforme a competência). A decisão do recurso hierárquico pode ser impugnada judicialmente.',
      en: 'A decision on an objection, or another tax act, may be appealed to the superior of the deciding body. The appeal decision may be challenged in court.',
    },
    law: 'finLgt',
    value: { decisaoDias: 60 },
    sourceUrl: 'https://www.asg.co.mz/as-implicacoes-do-indeferimento-tacito-no-procedimento-tributario-mocambicano/',
    lastVerified: V,
    confidence: C,
    note: {
      pt: 'Prazo de decisão de 60 dias indicado por fonte secundária (art. 140, n.º 3, da Lei n.º 2/2006). Confirme o prazo de interposição e a entidade competente.',
      en: 'Decision period of 60 days per a secondary source (art. 140(3) of Law 2/2006). Confirm the filing deadline and the competent authority.',
    },
  },
  finIndeferimentoTacito: {
    title: { pt: 'Indeferimento tácito', en: 'Deemed rejection' },
    summary: {
      pt: 'Se a Administração Tributária não decidir no prazo legal, o pedido presume-se indeferido, para que o contribuinte possa reclamar, recorrer hierarquicamente ou recorrer aos tribunais.',
      en: 'If the Tax Authority does not decide within the legal period, the request is deemed rejected so the taxpayer can object, appeal or go to court.',
    },
    law: 'finLgt',
    lastVerified: V,
    confidence: C,
  },
  finImpugnacaoJudicial: {
    title: { pt: 'Impugnação judicial de actos tributários', en: 'Court challenge of tax acts' },
    summary: {
      pt: 'Os actos tributários lesivos podem ser impugnados no tribunal fiscal competente, através de petição subscrita por advogado. O processo segue a Lei dos Tribunais Fiscais e, por remissão, o regime do contencioso das contribuições e impostos. A impugnação não suspende a cobrança, salvo se for prestada garantia ou a lei o determinar.',
      en: 'Tax acts may be challenged in the competent tax court by a petition signed by a lawyer. The procedure follows the Tax Courts Law and, by reference, the tax litigation rules. Filing does not stop collection unless security is given or the law so provides.',
    },
    law: 'finTribunaisFiscais',
    sourceUrl: 'https://archive.gazettes.africa/archive/mz/2017/mz-government-gazette-series-i-dated-2017-07-21-no-114.pdf',
    lastVerified: V,
    confidence: C,
    note: {
      pt: 'Confirme o prazo de impugnação, o tribunal competente (tribunal fiscal da área do serviço que liquidou) e a garantia exigida para suspender a execução.',
      en: 'Confirm the filing deadline, the competent court and the security required to suspend enforcement.',
    },
  },
  finPrestacoesTributarias: {
    title: { pt: 'Pagamento de dívidas tributárias em prestações', en: 'Paying tax debts in instalments' },
    summary: {
      pt: 'O devedor que não possa pagar de uma só vez a dívida tributária pode requerer o seu pagamento em prestações, nos termos e limites fixados na lei. O pedido é fundamentado e indica o número de prestações pretendido; pode ser exigida garantia, e a falta de pagamento de uma prestação faz vencer as restantes.',
      en: 'A debtor who cannot pay a tax debt at once may apply to pay it in instalments, within the limits set by law. The application gives reasons and the number of instalments sought; security may be required, and missing one instalment makes the rest due.',
    },
    law: 'finLeiBasesTributario',
    lastVerified: V,
    confidence: C,
    note: {
      pt: 'Confirme o número máximo de prestações, a entidade competente para autorizar e a garantia exigida no Código das Execuções Fiscais e nas instruções da Autoridade Tributária.',
      en: 'Confirm the maximum number of instalments, the competent authority and the security required.',
    },
  },
  finCertidaoQuitacao: {
    title: { pt: 'Certidão de quitação fiscal', en: 'Tax clearance certificate' },
    summary: {
      pt: 'A certidão de quitação comprova que o contribuinte tem a situação tributária regularizada. É exigida, entre outros, em concursos públicos e contratos com o Estado. É válida por doze meses e pode servir para vários concursos, com cópias autenticadas. Desde Agosto de 2026 pode também ser pedida por via electrónica.',
      en: 'The clearance certificate proves the taxpayer’s tax position is in order. It is required for public tenders and contracts with the State. It is valid for twelve months and may serve several tenders with certified copies. Since August 2026 it can also be requested online.',
    },
    law: 'finDm85_2023',
    value: { validadeMeses: 12 },
    sourceUrl: 'https://www.rsm.global/mozambique/pt-pt/news/validade-da-certidao-de-quitacao-emitida-pela-administracao-fiscal',
    lastVerified: V,
    confidence: C,
  },
  finRepresentanteFiscal: {
    title: { pt: 'Representante fiscal de não residentes', en: 'Tax representative of non-residents' },
    summary: {
      pt: 'As pessoas singulares e colectivas não residentes, sem estabelecimento estável, que obtenham rendimentos ou pratiquem operações tributáveis em Moçambique devem designar um representante com residência em território moçambicano, que as representa perante a Administração Tributária e cumpre as suas obrigações declarativas. A designação é comunicada à Direcção de Área Fiscal e o representante deve aceitá-la.',
      en: 'Non-resident individuals and companies without a permanent establishment that earn income or carry out taxable operations in Mozambique must appoint a representative resident in Mozambique, who represents them before the Tax Authority and files their returns. The appointment is notified to the tax office and must be accepted.',
    },
    law: 'finLgt',
    lastVerified: V,
    confidence: C,
    note: {
      pt: 'Regra prevista também nos Códigos do IRPC, do IRPS e do IVA; confirme o diploma aplicável ao caso e se a AT exige formulário próprio.',
      en: 'The rule also appears in the corporate tax, personal income tax and VAT codes; confirm the applicable statute and whether the Tax Authority requires its own form.',
    },
  },

  // ------------------------------------------------------------------ Banking
  finTratamentoReclamacoes: {
    title: { pt: 'Reclamações contra bancos e instituições financeiras', en: 'Complaints against banks and financial institutions' },
    summary: {
      pt: 'O cliente apresenta primeiro a reclamação à instituição, que a deve tratar no prazo regulamentar. Se discordar da resposta, ou se não a receber dentro do prazo, pode reclamar ao Banco de Moçambique, juntando cópia da reclamação apresentada e da decisão da instituição. O Banco de Moçambique não aprecia reclamações repetidas, já decididas ou infundadas.',
      en: 'The customer first complains to the institution, which must handle it within the regulatory period. If the customer disagrees with the reply, or gets none in time, they may complain to the Banco de Moçambique, attaching the original complaint and the institution’s decision. Duplicate, already decided or unfounded complaints are not examined.',
    },
    law: 'finAviso9_2020',
    sourceUrl: 'https://amomif.org.mz/wp-content/uploads/2025/01/Avisos-8-9-e-10-2020.pdf',
    lastVerified: V,
    confidence: C,
    note: {
      pt: 'Os bancos indicam um prazo de resposta de 30 dias de calendário; confirme o prazo do Regulamento.',
      en: 'Banks state a 30-calendar-day reply period; confirm the period in the Regulation.',
    },
  },
  finConsumidorFinanceiro: {
    title: { pt: 'Deveres das instituições financeiras para com o cliente', en: 'Duties of financial institutions to customers' },
    summary: {
      pt: 'As instituições de crédito devem informar o cliente, antes e durante o contrato, de forma clara, sobre taxas de juro, comissões, encargos e custo total do crédito, entregar cópia do contrato, prestar extractos e responder aos pedidos e reclamações dos clientes com diligência e lealdade.',
      en: 'Credit institutions must clearly inform customers, before and during the contract, of interest rates, fees, charges and the total cost of credit, give a copy of the contract, provide statements and handle requests and complaints diligently and fairly.',
    },
    law: 'finAviso8_2021',
    sourceUrl: 'https://www.mozabanco.co.mz/media/5430/aviso-n%C2%BA-8-gbm-2021-de-22-de-dezembro-c%C3%B3digo-de-conduta-das-icsf-e-de-protec%C3%A7%C3%A3o-do-consumidor-financeiro.pdf',
    lastVerified: V,
    confidence: C,
  },
  finInstrumentosPagamento: {
    title: { pt: 'Perda ou roubo de cartão e operações não autorizadas', en: 'Lost or stolen card and unauthorised transactions' },
    summary: {
      pt: 'O titular deve comunicar ao banco, logo que tenha conhecimento, a perda, o roubo ou o uso indevido do cartão ou dos códigos, e pedir o bloqueio. Depois da comunicação, as operações não autorizadas deixam, em regra, de ser da responsabilidade do titular. O cliente pode contestar movimentos que não autorizou.',
      en: 'The holder must tell the bank as soon as they learn of the loss, theft or misuse of the card or codes and ask for it to be blocked. After notice, unauthorised operations are, as a rule, no longer the holder’s responsibility. The customer may dispute transactions they did not authorise.',
    },
    law: 'finAviso8_2021',
    lastVerified: V,
    confidence: C,
    note: {
      pt: 'Confirme no contrato do cartão o limite de responsabilidade do titular antes da comunicação e o prazo para contestar movimentos.',
      en: 'Check the card agreement for the holder’s liability before notice and the period to dispute transactions.',
    },
  },
  finChequeRevogacao: {
    title: { pt: 'Revogação e oposição ao pagamento de cheque', en: 'Stopping payment of a cheque' },
    summary: {
      pt: 'O sacador pode pedir ao banco que não pague um cheque extraviado, roubado ou obtido de forma fraudulenta. A revogação de um cheque só produz efeitos depois de findo o prazo de apresentação a pagamento; o banco pode exigir a justificação do motivo.',
      en: 'The drawer may ask the bank not to pay a lost, stolen or fraudulently obtained cheque. A revocation only takes effect after the presentation period; the bank may ask for the reason to be shown.',
    },
    law: 'finLeiUniformeCheque',
    lastVerified: V,
    confidence: C,
    note: {
      pt: 'Emitir cheque sem provisão ou revogá-lo para não pagar uma dívida pode constituir crime; confirme com o banco.',
      en: 'Issuing a bad cheque or stopping it to avoid paying a debt may be a crime; check with the bank.',
    },
  },
  finMicrocredito: {
    title: { pt: 'Microcrédito e informação sobre juros', en: 'Microcredit and interest disclosure' },
    summary: {
      pt: 'Só podem conceder crédito como actividade as instituições autorizadas ou registadas no Banco de Moçambique (bancos, microbancos, cooperativas de crédito, operadores de microcrédito, organizações de poupança e empréstimo). A taxa de juro é indexada à Prime Rate do Sistema Financeiro Moçambicano, acrescida de uma margem (spread), e o contrato deve indicar a taxa nominal, as comissões e o custo total do crédito, com o plano de reembolso.',
      en: 'Only institutions licensed or registered with the Banco de Moçambique may lend as a business. The interest rate is indexed to the Mozambican Financial System Prime Rate plus a spread, and the contract must state the nominal rate, fees and the total cost of credit, with the repayment plan.',
    },
    law: 'finMicrofinancas',
    sourceUrl: 'https://bancomoc.mz/media/uu1n14kq/2024-04-29-prime-rate-e-spread-de-risco-maio-de-2024-bancos-comerciais-microfinancas.pdf',
    lastVerified: V,
    confidence: C,
    note: {
      pt: 'O Banco de Moçambique fixou limites ao crédito ao consumo das microfinanças (taxa de esforço sobre o rendimento líquido e prazo máximo). Confirme os limites e a Prime Rate em vigor no mês da contratação; nunca use valores de memória.',
      en: 'The Banco de Moçambique has set limits on microfinance consumer credit (debt-to-income ratio and maximum term). Confirm the limits and the Prime Rate for the month of the contract.',
    },
  },
  finGarantiaBancaria: {
    title: { pt: 'Garantias em contratos públicos', en: 'Guarantees in public contracts' },
    summary: {
      pt: 'Nos concursos e contratos públicos podem ser exigidas garantia provisória (com a proposta), garantia definitiva (com o contrato) e garantia de adiantamento, prestadas por depósito, garantia bancária ou seguro-caução, conforme o caderno de encargos e o modelo do documento do concurso.',
      en: 'Public tenders and contracts may require a bid bond, a performance bond and an advance payment guarantee, given by deposit, bank guarantee or surety insurance, as set in the tender documents and their model.',
    },
    law: 'contratacaoPublica2022',
    lastVerified: V,
    confidence: C,
    note: {
      pt: 'O valor e o prazo da garantia constam do documento do concurso; o texto da garantia segue normalmente o modelo anexo a esse documento.',
      en: 'The guarantee amount and term are in the tender documents; the wording usually follows the model attached to them.',
    },
  },
  finDistrateHipoteca: {
    title: { pt: 'Cancelamento do registo da hipoteca', en: 'Cancelling a mortgage registration' },
    summary: {
      pt: 'Pago o empréstimo, a hipoteca extingue-se, mas o registo só é cancelado na Conservatória do Registo Predial com base em documento do credor que autorize o cancelamento (distrate ou declaração de consentimento), normalmente com assinatura reconhecida.',
      en: 'Once the loan is repaid the mortgage ends, but the registration is only cancelled at the Land Registry on a document from the lender authorising it, usually with a certified signature.',
    },
    law: 'codigoRegistoPredial2018',
    lastVerified: V,
    confidence: C,
  },

  // ------------------------------------------------------------------ Guarantees and credit transfers
  finPenhor: {
    title: { pt: 'Penhor', en: 'Pledge (penhor)' },
    summary: {
      pt: 'O penhor dá ao credor o direito de ser pago, com preferência sobre os outros credores, pelo valor de uma coisa móvel, de um crédito ou de outro direito do devedor ou de terceiro. No regime do Código Civil, o penhor de coisas exige a entrega da coisa (ou de documento que dela permita dispor); é nulo o pacto pelo qual o credor fica com a coisa em caso de falta de pagamento, salvo acordo de venda pelo valor de avaliação. O penhor de créditos é notificado ao devedor.',
      en: 'A pledge gives the creditor a preferential right to be paid from the value of a movable thing, a receivable or another right of the debtor or a third party. Under the Civil Code, a pledge of goods requires delivery of the thing (or a document of title); an agreement that the creditor keeps the thing on default is void. A pledge of receivables is notified to the debtor.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: C,
    note: { pt: 'Corresponde aos arts. 666.º a 685.º do Código Civil de 1966.', en: 'Corresponds to arts. 666–685 of the 1966 Civil Code.' },
  },
  finGarantiasMobiliariasRegisto: {
    title: { pt: 'Registo de garantias mobiliárias', en: 'Registration of security over movables' },
    summary: {
      pt: 'A Lei das Garantias Mobiliárias permite constituir penhor sem entrega dos bens e criou a Central de Registo de Garantias Mobiliárias, em funcionamento desde 29 de Dezembro de 2021. O registo não é condição de validade, mas dá publicidade à garantia e define a prioridade entre credores.',
      en: 'The Movable Collateral Law allows a pledge without delivery of the goods and created the Movable Collateral Registry, operating since 29 December 2021. Registration is not a condition of validity but makes the security public and sets priority between creditors.',
    },
    law: 'finGarantiasMobiliarias',
    sourceUrl: 'https://www.dlapiperafrica.com/pt/mozambique/insights/2022/entry-into-operation-of-the-movable-property-collateral-registry.html',
    lastVerified: V,
    confidence: C,
  },
  finCessaoCreditos: {
    title: { pt: 'Cessão de créditos', en: 'Assignment of receivables' },
    summary: {
      pt: 'O credor pode ceder a terceiro, no todo ou em parte, o seu crédito, sem consentimento do devedor, salvo se a cessão for proibida por lei ou por convenção ou o crédito estiver ligado à pessoa do credor. A cessão só produz efeitos em relação ao devedor depois de lhe ser notificada ou de ele a aceitar. O cedente garante a existência do crédito, mas não a solvência do devedor, salvo se o declarar.',
      en: 'A creditor may assign all or part of a receivable without the debtor’s consent, unless prohibited by law or agreement or tied to the creditor personally. It takes effect against the debtor only once notified to or accepted by them. The assignor warrants that the debt exists but not that the debtor will pay, unless stated.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: C,
    note: { pt: 'Corresponde aos arts. 577.º a 588.º do Código Civil de 1966.', en: 'Corresponds to arts. 577–588 of the 1966 Civil Code.' },
  },
  finQuitacao: {
    title: { pt: 'Quitação', en: 'Receipt and discharge' },
    summary: {
      pt: 'Quem cumpre pode exigir quitação, isto é, declaração escrita do credor de que recebeu o pagamento; a quitação de toda a dívida extingue a obrigação e, se for geral, impede o credor de exigir outros valores relativos à mesma relação.',
      en: 'A paying debtor may demand a written receipt (quitação); a receipt for the whole debt extinguishes the obligation and, if general, bars further claims from the same relationship.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: C,
    note: { pt: 'Corresponde ao art. 787.º do Código Civil de 1966.', en: 'Corresponds to art. 787 of the 1966 Civil Code.' },
  },

  // ------------------------------------------------------------------ Insurance
  finSinistro: {
    title: { pt: 'Participação do sinistro', en: 'Notifying an insurance claim' },
    summary: {
      pt: 'O tomador do seguro ou o segurado deve participar o sinistro à seguradora no prazo fixado na apólice, descrevendo as circunstâncias, as causas e as consequências, e tomar as medidas ao seu alcance para limitar os danos. Concluída a regularização e apurado o valor, a seguradora paga a indemnização no prazo legal.',
      en: 'The policyholder or insured must notify the insurer of the loss within the period set in the policy, describing circumstances, causes and consequences, and take reasonable steps to limit the damage. Once the claim is settled and the amount assessed, the insurer pays within the legal period.',
    },
    law: 'finRegimeSeguros',
    value: { pagamentoDias: 30 },
    sourceUrl: 'https://www.bsa.issm.gov.mz/cps/Faq',
    lastVerified: V,
    confidence: C,
    note: {
      pt: 'Prazo de pagamento de 30 dias indicado nas perguntas frequentes do ISSM. O novo Regime Jurídico dos Seguros (2026) substitui o Decreto-Lei n.º 1/2010: confirme os prazos de participação na apólice e no novo regime.',
      en: 'The 30-day payment period is stated in the supervisor’s FAQ. The new 2026 insurance regime replaces Decree-Law 1/2010: check the notice period in the policy and the new regime.',
    },
  },
  finSeguroReclamacoes: {
    title: { pt: 'Reclamações contra seguradoras', en: 'Complaints against insurers' },
    summary: {
      pt: 'O tomador, o segurado ou o lesado reclama primeiro por escrito à seguradora. Sem resposta satisfatória, pode recorrer à autoridade de supervisão de seguros (Instituto de Supervisão de Seguros de Moçambique, a substituir pela nova Autoridade de Supervisão de Seguros e de Fundos de Pensões), à arbitragem ou aos tribunais.',
      en: 'The policyholder, insured or injured party first complains in writing to the insurer. If unsatisfied, they may go to the insurance supervisor, to arbitration or to the courts.',
    },
    law: 'finRegimeSeguros',
    sourceUrl: 'https://www.diarioeconomico.co.mz/2026/08/12/economia/seguros/sector-dos-seguros-com-novas-regras-de-proteccao-dos-consumidores/',
    lastVerified: V,
    confidence: C,
  },
  finSeguroCessacao: {
    title: { pt: 'Cessação do contrato de seguro', en: 'Ending an insurance contract' },
    summary: {
      pt: 'O contrato de seguro pode cessar por acordo, por caducidade no fim do prazo, por denúncia (não renovação) com a antecedência fixada na apólice, ou por resolução nos casos previstos na lei e na apólice. O prémio correspondente ao período não decorrido é, em regra, devolvido; a cessação não afecta sinistros já ocorridos.',
      en: 'An insurance contract ends by agreement, on expiry, by notice of non-renewal given within the period set in the policy, or by termination where the law and policy allow. The premium for the unexpired period is usually refunded; claims already incurred are not affected.',
    },
    law: 'finRegimeSeguros',
    lastVerified: V,
    confidence: C,
    note: {
      pt: 'O seguro de responsabilidade civil automóvel é obrigatório para circular: não anule a apólice de uma viatura em circulação sem outro seguro.',
      en: 'Third-party motor insurance is compulsory to drive: do not cancel the policy of a car in use without other cover.',
    },
  },

  // ------------------------------------------------------------------ Anti-money laundering
  finBranqueamentoDeveres: {
    title: { pt: 'Deveres das entidades obrigadas', en: 'Duties of obliged entities' },
    summary: {
      pt: 'As instituições financeiras e as entidades não financeiras designadas (imobiliárias, comerciantes de bens de alto valor, casinos, advogados, notários, contabilistas e auditores, prestadores de serviços a sociedades) devem identificar e verificar os clientes e beneficiários efectivos, avaliar o risco, aplicar diligência reforçada a clientes de risco elevado e pessoas politicamente expostas, conservar os documentos, abster-se de executar operações suspeitas e comunicá-las ao Gabinete de Informação Financeira de Moçambique (GIFiM), designar um responsável pela conformidade e formar o pessoal.',
      en: 'Financial institutions and designated non-financial businesses must identify and verify customers and beneficial owners, assess risk, apply enhanced due diligence to high-risk customers and politically exposed persons, keep records, refrain from suspicious operations and report them to the Financial Intelligence Office (GIFiM), appoint a compliance officer and train staff.',
    },
    law: 'leiBranqueamento2023',
    sourceUrl: 'https://www.bancomoc.mz/media/znldo2ce/decreto-n-%C2%BA-53-e-54-regulamentos-da-lei-terrorismo-branqueamento-e-financiamento-002.pdf',
    lastVerified: V,
    confidence: C,
    note: {
      pt: 'Confirme os prazos de conservação de documentos e os limiares de operações em numerário no Decreto n.º 53/2023 e nas directivas do supervisor do sector.',
      en: 'Confirm record-keeping periods and cash thresholds in Decree 53/2023 and the sector supervisor’s guidance.',
    },
  },
  finOrigemFundos: {
    title: { pt: 'Origem dos fundos', en: 'Source of funds' },
    summary: {
      pt: 'No âmbito do dever de diligência, os bancos e outras entidades obrigadas podem pedir ao cliente que declare e comprove a origem dos fundos de uma operação. Prestar declarações falsas pode constituir crime, e a recusa de informação pode levar a entidade a não executar a operação.',
      en: 'As part of due diligence, banks and other obliged entities may ask customers to declare and prove the source of funds. False statements may be a crime, and refusing information may lead the entity not to carry out the operation.',
    },
    law: 'leiBranqueamento2023',
    lastVerified: V,
    confidence: C,
  },
} satisfies Record<string, LegalEntryDef>;
