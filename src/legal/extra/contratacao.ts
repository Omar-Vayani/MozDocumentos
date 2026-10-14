// Legal values for the "contratacao" documents: public procurement under the
// Regulamento de Contratação de Empreitada de Obras Públicas, Fornecimento de
// Bens e Prestação de Serviços ao Estado (Decreto n.º 79/2022, de 30 de
// Dezembro; law key `contratacaoPublica2022`, defined with the construction
// documents) and a few public-administration documents.
//
// The official text could not be read here: the facts below come from extracts
// of the decree and from standard tender documents published by contracting
// bodies (UFSA, CMAM, INAMI, INS) that quote it. Every procurement entry is
// therefore 'confirm' and carries no article number; the article quoted by the
// tender documents is kept in the note so it can be checked.
// Keys are prefixed `ct` to stay unique across the legal files.
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-14';
const UFSA_DOCS = 'https://www.ufsa.gov.mz/Docs/BR_252_I_SERIE_7o%20SUPLEMENTO_2022.pdf';
const DC_CMAM = 'https://www.cmam.gov.mz/wp-content/uploads/2026/03/Documento-de-Concurso.pdf';
const DC_INS = 'https://ins.gov.mz/wp-content/uploads/2023/07/Documento-do-Concurso-Limitado-Nr.-10-2023.pdf';
const MDR = 'https://www.mdradvogados.com/xms/files/2023/Novidades_na_contratacao_publica_-_Legal_Alert_MDR_-PT-.pdf';

export const LAWS_CONTRATACAO = {
  leiProbidade2012: {
    short: 'Lei de Probidade Pública',
    cite: 'da Lei de Probidade Pública',
    title: 'Lei n.º 16/2012, de 14 de Agosto — Lei de Probidade Pública (deveres, conflitos de interesses e declaração de património dos servidores públicos)',
  },
  leiTribunalAdministrativoContas: {
    short: 'Lei da Secção de Contas Públicas do Tribunal Administrativo',
    cite: 'da legislação sobre a fiscalização prévia do Tribunal Administrativo',
    title: 'Lei n.º 14/2014, de 14 de Agosto (alterada pela Lei n.º 8/2015, de 6 de Outubro) — organização, funcionamento e processo da Secção de Contas Públicas do Tribunal Administrativo (fiscalização prévia: visto)',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_CONTRATACAO = {
  // ------------------------------------------------------------------ Regime
  ctRegulamento: {
    title: { pt: 'Regulamento de contratação pública', en: 'Public procurement regulation' },
    summary: {
      pt: 'A contratação de empreitadas de obras públicas, fornecimento de bens e prestação de serviços ao Estado rege-se pelo Regulamento aprovado em Dezembro de 2022, em vigor desde 2023, que revogou o regulamento de 2016. Introduz a contratação electrónica e o registo obrigatório dos fornecedores no Cadastro Único.',
      en: 'Public works, supply of goods and services to the State are governed by the Regulation approved in December 2022, in force since 2023, which replaced the 2016 regulation. It introduced e-procurement and mandatory registration of suppliers in the Single Register.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: MDR,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Data de entrada em vigor indicada como 30 de Março ou 1 de Abril de 2023, conforme a fonte.', en: 'Entry into force reported as 30 March or 1 April 2023 depending on the source.' },
  },
  ctModalidades: {
    title: { pt: 'Modalidades de contratação', en: 'Procurement methods' },
    summary: {
      pt: 'O regime geral é o concurso público. No regime excepcional, o regulamento prevê o concurso com prévia qualificação, o concurso em duas etapas, o concurso limitado, o concurso por lances, o concurso de pequena dimensão, o concurso por cotações e o ajuste directo, regidos subsidiariamente pelas normas do concurso público. Os limites de valor de cada modalidade são fixados por lei e actualizados periodicamente.',
      en: 'The general rule is the open tender. Under the exceptional regime the regulation provides for pre-qualified tenders, two-stage tenders, restricted tenders, auctions, small-value tenders, requests for quotations and direct award, with the open-tender rules applying in the alternative. Value thresholds are set by law and updated periodically.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: UFSA_DOCS,
    lastVerified: V,
    confidence: 'confirm',
  },
  ctDocumentoConcursoModelo: {
    title: { pt: 'Modelos de documento de concurso', en: 'Standard tender documents' },
    summary: {
      pt: 'A entidade contratante usa os modelos de documento de concurso aprovados, que trazem os formulários da proposta (carta de proposta, declarações, lista de preços, modelos de garantia). Quando o documento de concurso traz um formulário, o concorrente preenche-o sem alterar o formato.',
      en: 'The contracting body uses the approved standard tender documents, which contain the bid forms (bid letter, declarations, price schedule, guarantee models). When the tender document contains a form, the bidder fills it in without changing its format.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: DC_CMAM,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Os documentos de concurso citam o n.º 4 do artigo 49 do Regulamento.', en: 'Tender documents cite article 49(4) of the Regulation.' },
  },
  ctCadastroUnico: {
    title: { pt: 'Cadastro Único de fornecedores', en: 'Single register of suppliers' },
    summary: {
      pt: 'Para contratar com o Estado, empreiteiros, fornecedores de bens e prestadores de serviços inscrevem-se no Cadastro Único gerido pela Unidade Funcional de Supervisão das Aquisições (UFSA) e mantêm a inscrição actualizada.',
      en: 'To contract with the State, contractors, suppliers and service providers register in the Single Register kept by the procurement supervision unit (UFSA) and keep it up to date.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: MDR,
    lastVerified: V,
    confidence: 'confirm',
  },
  ctImpedimentos: {
    title: { pt: 'Impedimentos dos concorrentes', en: 'Grounds for exclusion of bidders' },
    summary: {
      pt: 'Não podem concorrer nem ser contratadas as pessoas que se encontrem em situação de impedimento prevista no regulamento e no documento de concurso, nomeadamente as que estejam suspensas ou inibidas de contratar com o Estado. O concorrente declara por escrito que não se encontra em nenhuma dessas situações.',
      en: 'Persons in a situation of exclusion under the regulation and the tender document, namely those suspended or barred from contracting with the State, may not bid or be awarded a contract. The bidder states in writing that none of those situations applies.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: DC_CMAM,
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Um documento de concurso cita o artigo 22 do Regulamento para os impedimentos; outra fonte atribui ao artigo 22 a definição de concorrente nacional. Confirme no Boletim da República a lista exacta.',
      en: 'One tender document cites article 22 for exclusions; another source says article 22 defines national bidders. Check the exact list in the official gazette.',
    },
  },
  ctCotacoesMinimo: {
    title: { pt: 'Número mínimo de cotações', en: 'Minimum number of quotations' },
    summary: {
      pt: 'No concurso por cotações a entidade contratante convida fornecedores e avalia, pelo critério do menor preço avaliado, um número mínimo de cotações.',
      en: 'In a request for quotations the contracting body invites suppliers and evaluates, on the lowest evaluated price, a minimum number of quotations.',
    },
    law: 'contratacaoPublica2022',
    value: 3,
    sourceUrl: DC_CMAM,
    lastVerified: V,
    confidence: 'confirm',
  },
  ctProbidade: {
    title: { pt: 'Probidade e conflito de interesses', en: 'Integrity and conflicts of interest' },
    summary: {
      pt: 'Os servidores públicos que intervêm no procedimento, incluindo os membros do júri, estão sujeitos aos deveres de probidade e não podem intervir quando tenham interesse, por si ou por familiares, no contrato. Oferecer ou prometer vantagens a servidores públicos é crime de corrupção.',
      en: 'Public servants involved in the procedure, including jury members, are bound by integrity duties and must not take part where they or their relatives have an interest in the contract. Offering or promising advantages to public servants is the crime of corruption.',
    },
    law: 'leiProbidade2012',
    lastVerified: V,
    confidence: 'confirm',
  },
  ctCorrupcao: {
    title: { pt: 'Corrupção activa', en: 'Active bribery' },
    summary: {
      pt: 'Dar ou prometer a funcionário, directamente ou por interposta pessoa, vantagem patrimonial ou não patrimonial que lhe não seja devida, para a prática de acto ou omissão, é crime de corrupção activa.',
      en: 'Giving or promising an official, directly or through another person, an undue advantage for an act or omission is the crime of active bribery.',
    },
    law: 'codigoPenal2019',
    lastVerified: V,
    confidence: 'confirm',
  },

  // ------------------------------------------------------------------ Proposals and guarantees
  ctValidadeProposta: {
    title: { pt: 'Validade da proposta', en: 'Bid validity' },
    summary: {
      pt: 'O concorrente fica obrigado à sua proposta durante o prazo de validade fixado no documento de concurso, contado da data-limite de apresentação das propostas. O prazo pode ser prorrogado a pedido da entidade contratante, com a aceitação do concorrente.',
      en: 'The bidder is bound by its bid for the validity period set in the tender document, counted from the bid deadline. It may be extended at the contracting body’s request if the bidder agrees.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: DC_INS,
    lastVerified: V,
    confidence: 'confirm',
  },
  ctEsclarecimentos: {
    title: { pt: 'Esclarecimentos sobre o documento de concurso', en: 'Clarifications on the tender document' },
    summary: {
      pt: 'Os interessados podem pedir por escrito esclarecimentos sobre o documento de concurso, dentro do prazo nele fixado. A entidade contratante responde por escrito e comunica a resposta a todos os interessados que levantaram o documento, sem identificar quem perguntou.',
      en: 'Interested parties may ask in writing for clarifications on the tender document within the time it sets. The contracting body answers in writing and sends the answer to everyone who obtained the document, without naming who asked.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: DC_CMAM,
    lastVerified: V,
    confidence: 'confirm',
  },
  ctGarantiaProvisoria: {
    title: { pt: 'Garantia provisória', en: 'Bid security' },
    summary: {
      pt: 'Acima dos limites de valor fixados, o concorrente presta garantia provisória no acto de apresentação da proposta, por depósito, garantia bancária ou seguro-caução, no valor fixado no documento de concurso, que não pode exceder a percentagem máxima indicada do valor estimado da contratação. A proposta sem a garantia exigida é desclassificada.',
      en: 'Above the set value thresholds, the bidder lodges a bid security with the bid, by deposit, bank guarantee or surety insurance, for the amount set in the tender document, which may not exceed the stated maximum percentage of the estimated value. A bid without the required security is disqualified.',
    },
    law: 'contratacaoPublica2022',
    value: 1.5, // % máxima do valor estimado
    sourceUrl: DC_CMAM,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Documentos de concurso citam o artigo 105 do Regulamento.', en: 'Tender documents cite article 105 of the Regulation.' },
  },
  ctGarantiaDefinitiva: {
    title: { pt: 'Garantia definitiva', en: 'Performance security' },
    summary: {
      pt: 'O adjudicatário presta a garantia definitiva depois da adjudicação e antes da assinatura do contrato, no valor e na forma fixados no documento de concurso. A garantia assegura o cumprimento do contrato e é libertada depois da recepção definitiva ou do fim do prazo de garantia.',
      en: 'The successful bidder lodges the performance security after the award and before signing, for the amount and in the form set in the tender document. It secures performance and is released after final acceptance or the end of the warranty period.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: DC_CMAM,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'O valor varia entre documentos de concurso (exemplos lidos: 5 % e 10 % do valor do contrato).', en: 'The amount varies between tender documents (examples read: 5 % and 10 % of the contract value).' },
  },
  ctGarantiaAdiantamento: {
    title: { pt: 'Garantia de adiantamento', en: 'Advance payment guarantee' },
    summary: {
      pt: 'Quando o contrato prevê pagamento adiantado, o contratado presta garantia de valor igual ao adiantamento, que é reduzida à medida que o adiantamento é descontado nos pagamentos.',
      en: 'When the contract provides for an advance payment, the contractor provides a guarantee equal to the advance, reduced as the advance is recovered from payments.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: DC_CMAM,
    lastVerified: V,
    confidence: 'confirm',
  },
  ctConsorcio: {
    title: { pt: 'Concorrentes em consórcio', en: 'Bidders in consortium' },
    summary: {
      pt: 'Podem concorrer agrupamentos de empresas em consórcio. Com a proposta é normalmente exigido o compromisso de constituição do consórcio e a indicação do líder; se o consórcio for adjudicatário, constitui-se formalmente antes da assinatura do contrato e os membros respondem solidariamente.',
      en: 'Groups of companies may bid as a consortium. A commitment to form the consortium and the name of the leader are normally required with the bid; if awarded, the consortium is formally constituted before signing and the members are jointly and severally liable.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: DC_CMAM,
    lastVerified: V,
    confidence: 'confirm',
  },

  // ------------------------------------------------------------------ Opening, evaluation, award
  ctAberturaPublica: {
    title: { pt: 'Abertura pública das propostas', en: 'Public opening of bids' },
    summary: {
      pt: 'As propostas são abertas em acto público, no local, data e hora indicados, na presença dos concorrentes que queiram assistir. O júri lê em voz alta o nome dos concorrentes, os preços e a existência de garantia, e lavra acta assinada pelos membros do júri e pelos concorrentes presentes que o desejem.',
      en: 'Bids are opened in public at the stated place, date and time, with bidders free to attend. The jury reads out bidders’ names, prices and whether a security was lodged, and draws up minutes signed by the jury and any bidders present who wish to sign.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: DC_INS,
    lastVerified: V,
    confidence: 'confirm',
  },
  ctJuri: {
    title: { pt: 'Júri do concurso', en: 'Tender jury' },
    summary: {
      pt: 'O júri, designado pela autoridade competente, conduz o procedimento, analisa a qualificação e avalia as propostas segundo os critérios do documento de concurso, e elabora o relatório de avaliação com a proposta de adjudicação. Os membros com interesse no contrato estão impedidos.',
      en: 'The jury appointed by the competent authority runs the procedure, checks qualification and evaluates bids under the tender criteria, and writes the evaluation report proposing the award. Members with an interest in the contract may not take part.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: DC_INS,
    lastVerified: V,
    confidence: 'confirm',
  },
  ctAdjudicacao: {
    title: { pt: 'Adjudicação e notificação', en: 'Award and notification' },
    summary: {
      pt: 'A autoridade competente decide a adjudicação com base no relatório do júri. A decisão é notificada ao adjudicatário e a todos os concorrentes, com a indicação dos fundamentos e do prazo para reclamar. Antes da assinatura do contrato o adjudicatário apresenta a garantia definitiva e os documentos de habilitação exigidos (quitação fiscal, segurança social, beneficiário efectivo).',
      en: 'The competent authority decides the award based on the jury report. The decision is notified to the winner and all bidders, with reasons and the time to complain. Before signing, the winner provides the performance security and the required documents (tax and social security clearance, beneficial owner).',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: DC_CMAM,
    lastVerified: V,
    confidence: 'confirm',
  },

  // ------------------------------------------------------------------ Complaints
  ctReclamacaoPrazo: {
    title: { pt: 'Reclamação em procedimento de contratação', en: 'Complaint in a procurement procedure' },
    summary: {
      pt: 'O concorrente pode reclamar, por escrito e sem pagamento de taxa, para a entidade contratante, dos actos praticados no procedimento, no prazo indicado em dias úteis contado da notificação (por exemplo, da notificação da adjudicação). A reclamação suspende o procedimento até à decisão.',
      en: 'A bidder may complain in writing, free of charge, to the contracting body about acts in the procedure, within the stated number of working days from notification (for example, of the award). The complaint suspends the procedure until decided.',
    },
    law: 'contratacaoPublica2022',
    value: 5, // dias úteis
    sourceUrl: DC_CMAM,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Documentos de concurso citam o n.º 2 do artigo 278 do Regulamento. O efeito suspensivo deve ser confirmado.', en: 'Tender documents cite article 278(2). The suspensive effect must be confirmed.' },
  },
  ctRecursoPrazo: {
    title: { pt: 'Recurso hierárquico em procedimento de contratação', en: 'Hierarchical appeal in a procurement procedure' },
    summary: {
      pt: 'Da decisão sobre a reclamação cabe recurso hierárquico para o superior da autoridade competente, no prazo indicado em dias úteis contado da notificação dessa decisão, mediante a prestação da caução fixada no documento de concurso.',
      en: 'The decision on the complaint may be appealed to the superior of the competent authority within the stated number of working days from its notification, against the deposit set in the tender document.',
    },
    law: 'contratacaoPublica2022',
    value: 3, // dias úteis
    sourceUrl: DC_CMAM,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Documentos de concurso citam o artigo 280 do Regulamento para a caução; o valor da caução varia entre documentos de concurso.', en: 'Tender documents cite article 280 for the deposit; the amount varies between tender documents.' },
  },

  // ------------------------------------------------------------------ Contract
  ctContratoClausulas: {
    title: { pt: 'Conteúdo do contrato público', en: 'Content of a public contract' },
    summary: {
      pt: 'O contrato é escrito e contém, pelo menos: a identificação das partes e dos seus representantes, o objecto, o preço e a forma de pagamento, o prazo de execução, as garantias, as penalidades por atraso, as condições de recepção, a rescisão, a resolução de litígios e a dotação orçamental que suporta a despesa. Integram o contrato o documento de concurso, a proposta adjudicada e os esclarecimentos.',
      en: 'The contract is written and states at least: the parties and their representatives, the subject, price and payment terms, time for performance, guarantees, delay penalties, acceptance, termination, dispute resolution and the budget line covering the expense. The tender document, the awarded bid and the clarifications form part of it.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: DC_CMAM,
    lastVerified: V,
    confidence: 'confirm',
  },
  ctMultas: {
    title: { pt: 'Multas por atraso', en: 'Delay penalties' },
    summary: {
      pt: 'O atraso na execução dá lugar a multa diária, calculada sobre o valor do contrato ou da parte em atraso, até ao limite fixado no contrato; atingido o limite, a entidade contratante pode rescindir o contrato e executar a garantia definitiva.',
      en: 'Delay gives rise to a daily penalty on the contract value or the late part, up to the cap in the contract; when the cap is reached the contracting body may terminate and call the performance security.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: DC_CMAM,
    lastVerified: V,
    confidence: 'confirm',
  },
  ctVistoTribunal: {
    title: { pt: 'Visto do Tribunal Administrativo', en: 'Administrative Court clearance (visto)' },
    summary: {
      pt: 'Os contratos de valor igual ou superior ao fixado anualmente estão sujeitos a fiscalização prévia do Tribunal Administrativo e só produzem efeitos financeiros depois do visto. A entidade contratante remete o processo ao Tribunal.',
      en: 'Contracts at or above the yearly threshold are subject to prior review by the Administrative Court and have financial effect only after its clearance (visto). The contracting body sends the file to the Court.',
    },
    law: 'leiTribunalAdministrativoContas',
    lastVerified: V,
    confidence: 'confirm',
  },
  ctRecepcaoBens: {
    title: { pt: 'Recepção dos bens', en: 'Acceptance of goods' },
    summary: {
      pt: 'Os bens entregues são inspeccionados por uma comissão de recepção, que verifica a quantidade, a qualidade e a conformidade com as especificações e lavra auto de recepção. As desconformidades são registadas no auto e o fornecedor substitui ou corrige os bens no prazo fixado.',
      en: 'Delivered goods are inspected by an acceptance committee, which checks quantity, quality and conformity with the specifications and draws up an acceptance record. Non-conformities are recorded and the supplier replaces or corrects the goods within the set time.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: DC_CMAM,
    lastVerified: V,
    confidence: 'confirm',
  },
  ctCabimento: {
    title: { pt: 'Cabimento orçamental', en: 'Budget commitment' },
    summary: {
      pt: 'Nenhuma contratação se inicia sem a necessidade identificada pelo sector requisitante e sem a confirmação de que existe dotação orçamental (cabimento) na rubrica correspondente, registada no e-SISTAFE.',
      en: 'No procurement starts without the need identified by the requesting unit and confirmation that a budget allocation exists (cabimento) under the relevant line, recorded in e-SISTAFE.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: MDR,
    lastVerified: V,
    confidence: 'confirm',
  },

  // ------------------------------------------------------------------ Public administration
  ctLouvor: {
    title: { pt: 'Louvor (recompensa)', en: 'Commendation (award)' },
    summary: {
      pt: 'O louvor é uma das recompensas previstas no Estatuto Geral dos Funcionários e Agentes do Estado para distinguir o funcionário ou agente pelo seu desempenho, zelo ou acto relevante. É concedido por despacho do dirigente competente, publicado em ordem de serviço e averbado no processo individual.',
      en: 'A commendation is one of the rewards under the General Statute of State Employees, recognising performance, diligence or an outstanding act. It is granted by order of the competent manager, published in a service order and noted in the personal file.',
    },
    law: 'egfae',
    lastVerified: V,
    confidence: 'confirm',
  },
  ctCertidao: {
    title: { pt: 'Passagem de certidões', en: 'Issuing certificates from records' },
    summary: {
      pt: 'Os interessados têm direito a obter certidão dos documentos e registos que lhes digam respeito, mediante requerimento. A certidão reproduz fielmente o que consta dos arquivos do serviço e é autenticada com a assinatura do responsável e o selo branco ou carimbo.',
      en: 'Interested persons may obtain, on request, certificates of the documents and records concerning them. The certificate faithfully reproduces the service’s records and is authenticated by the responsible officer’s signature and the seal or stamp.',
    },
    law: 'lei14_2011',
    lastVerified: V,
    confidence: 'confirm',
  },
  ctTermoDeclaracoes: {
    title: { pt: 'Auto de declarações', en: 'Record of statements' },
    summary: {
      pt: 'Nos procedimentos de inquérito, sindicância e disciplinares, as declarações das pessoas ouvidas são reduzidas a escrito em auto, lido ao declarante, que o pode corrigir e o assina com o instrutor e o secretário.',
      en: 'In inquiries and disciplinary proceedings, statements are written down in a record which is read back to the person, who may correct it and signs it with the investigator and the clerk.',
    },
    law: 'egfae',
    lastVerified: V,
    confidence: 'confirm',
  },
} satisfies Record<string, LegalEntryDef>;
