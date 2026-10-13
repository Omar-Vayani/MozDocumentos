// Legal values for the "contratos" documents (civil and commercial contracts).
// Keys must not clash with other files. Civil Code articles are those of the
// 1966 Code as applied in Mozambique; where the Mozambican text could not be
// read, the entry has `confidence: 'confirm'` and no article (the 1966
// numbering is given in the note only).
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-13';

export const LAWS_CONTRATOS = {
  regimeContratosComerciais: {
    short: 'Regime Jurídico dos Contratos Comerciais',
    cite: 'do Regime Jurídico dos Contratos Comerciais',
    title: 'Regime Jurídico dos Contratos Comerciais, aprovado pelo Decreto-Lei n.º 3/2022, de 25 de Maio',
    url: 'https://www.rsm.global/mozambique/pt-pt/news/regime-juridico-dos-contratos-comerciais',
  },
  leiTerras1997: {
    short: 'Lei de Terras',
    cite: 'da Lei de Terras (Lei n.º 19/97, de 1 de Outubro)',
    title: 'Lei n.º 19/97, de 1 de Outubro — Lei de Terras',
    url: 'https://www.pdul.gov.mz/content/download/486/2635/file/Lei%20de%20Terras.pdf',
  },
  codigoRegistoPredial2018: {
    short: 'Código do Registo Predial',
    cite: 'do Código do Registo Predial',
    title: 'Código do Registo Predial, aprovado pelo Decreto-Lei n.º 2/2018',
    url: 'https://www.acismoz.com/wp-content/uploads/2023/02/Ebook-Codigo-do-Registo-Predial-anotado-e-comentado.pdf',
  },
  regulamentoEmpreiteiro2013: {
    short: 'Decreto n.º 94/2013',
    cite: 'do Decreto n.º 94/2013, de 31 de Dezembro',
    title: 'Decreto n.º 94/2013, de 31 de Dezembro — Regulamento do Exercício da Actividade de Empreiteiro e de Consultor de Construção Civil',
    url: 'https://www.mdradvogados.com/xms/files/v1/Publicacoes/2013/Regime_Juridico_Aplicavel_a_Actividade_de_Empreiteiro_e_de_Consultor_de_Construcao_Civil.pdf',
  },
  codigoTributarioAutarquico: {
    short: 'Código Tributário Autárquico',
    cite: 'do Código Tributário Autárquico',
    title: 'Código Tributário Autárquico, aprovado pelo Decreto n.º 63/2008, de 30 de Dezembro',
    url: 'https://e-stm.co.mz/wp-content/uploads/2021/06/Decreto_63_2008_30Dezembro_Codigo_Tributario_Autarquico1.pdf',
  },
  codigoSucessoesDoacoes: {
    short: 'Código do Imposto sobre Sucessões e Doações',
    cite: 'do Código do Imposto sobre Sucessões e Doações',
    title: 'Código do Imposto sobre Sucessões e Doações, aprovado pela Lei n.º 28/2007, de 4 de Dezembro',
  },
  leiInstituicoesCredito: {
    short: 'Lei das Instituições de Crédito e Sociedades Financeiras',
    cite: 'da Lei das Instituições de Crédito e Sociedades Financeiras',
    title: 'Lei das Instituições de Crédito e Sociedades Financeiras',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_CONTRATOS = {
  // ------------------------------------------------------------------ Forms and notary
  reconhecimentoNotarial: {
    title: { pt: 'Reconhecimento notarial e documento autenticado', en: 'Notarial certification and authenticated documents' },
    summary: {
      pt: 'O notário pode reconhecer as assinaturas de um documento particular (reconhecimento presencial, com o signatário presente) ou autenticá-lo, lavrando o termo no próprio documento ou em folha anexa. Desde 2023, advogados com carteira profissional e outras entidades autorizadas podem praticar certos actos notariais.',
      en: 'A notary can certify the signatures on a private document (in-person certification, with the signatory present) or authenticate it, writing the certificate on the document or an attached sheet. Since 2023, lawyers with a professional card and other authorised bodies may perform certain notarial acts.',
    },
    law: 'codigoNotariado',
    sourceUrl: 'https://www.lexlink.eu/codigo-simples/mocambique/452170/codigo-do-notariado-decreto-lei-no-42006-de-23-de-agosto-alterado-pelo-decreto-lei-no-12023-de-18-de-agosto/20897/por-tema',
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Código do Notariado (Decreto-Lei n.º 4/2006, de 23 de Agosto), alterado pelo Decreto-Lei n.º 1/2023, de 18 de Agosto.',
      en: 'Notarial Code (Decree-Law 4/2006 of 23 August), amended by Decree-Law 1/2023 of 18 August.',
    },
  },
  // consentimentoConjuge (spouse's consent) is defined in ./pessoal-rh.ts and reused here.

  // ------------------------------------------------------------------ Real estate
  vendaImoveisForma: {
    title: { pt: 'Forma da compra e venda de imóveis', en: 'Form of a sale of real estate' },
    summary: {
      pt: 'A compra e venda de imóveis só é válida se for celebrada por escritura pública ou, desde a alteração de 2021, por modelo de contrato aprovado pela autoridade competente com as assinaturas reconhecidas no notário. Sem a forma legal, a venda é nula.',
      en: 'A sale of real estate is valid only by notarial deed or, since the 2021 amendment, on a model contract approved by the competent authority with the signatures certified by a notary. Without the legal form, the sale is void.',
    },
    law: 'codigoCivil',
    article: 'art. 875.º',
    sourceUrl: 'https://www.dlapiperafrica.com/pt/mozambique/insights/2023/Promissory-Agreement-for-the-Sale-and-Purchase-of-Real-Estate-the-Effect-of-Real-Effectiveness-Versus-Real-Estate-Registration.html',
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Redacção do Decreto-Lei n.º 2/2021, de 9 de Agosto, que alterou os arts. 377.º, 714.º, 875.º e 1143.º do Código Civil. A nulidade por falta de forma resulta do art. 220.º.',
      en: 'As amended by Decree-Law 2/2021 of 9 August (Civil Code arts. 377, 714, 875 and 1143). Nullity for lack of form follows from art. 220.',
    },
  },
  contratoPromessaForma: {
    title: { pt: 'Contrato-promessa — forma', en: 'Promissory contract — form' },
    summary: {
      pt: 'A promessa de celebrar um contrato que exige documento (como a compra e venda de imóveis) só é válida se constar de documento assinado pelos promitentes. Aplicam-se à promessa as regras do contrato prometido, excepto as relativas à forma.',
      en: 'A promise to make a contract that requires a document (such as a sale of real estate) is valid only if it is in a document signed by the parties. The rules of the promised contract apply, except those on form.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Corresponde ao art. 410.º do Código Civil de 1966. As exigências acrescentadas em Portugal depois de 1975 (reconhecimento presencial e certificação da licença) não se presumem aplicáveis em Moçambique; confirme o texto em vigor.',
      en: 'Corresponds to art. 410 of the 1966 Civil Code. The requirements added in Portugal after 1975 (in-person certification and licence check) are not presumed to apply in Mozambique; confirm the text in force.',
    },
  },
  contratoPromessaSinal: {
    title: { pt: 'Sinal', en: 'Deposit (sinal)' },
    summary: {
      pt: 'No contrato-promessa de compra e venda, a quantia entregue pelo promitente-comprador presume-se sinal. Se quem o entregou não cumprir, perde-o; se o incumprimento for de quem o recebeu, este deve restituí-lo em dobro.',
      en: 'In a promise to sell, money paid by the buyer is presumed to be a deposit. If the buyer defaults, they lose it; if the seller defaults, they must return double.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 441.º e 442.º do Código Civil de 1966.', en: 'Corresponds to arts. 441 and 442 of the 1966 Civil Code.' },
  },
  execucaoEspecifica: {
    title: { pt: 'Execução específica', en: 'Specific performance' },
    summary: {
      pt: 'Se uma das partes não cumprir a promessa, a outra pode pedir ao tribunal uma sentença que produza os efeitos do contrato prometido. No texto de 1966, a existência de sinal presume-se convenção em contrário; por isso o contrato deve dizer expressamente que as partes a admitem.',
      en: 'If a party fails to perform the promise, the other may ask the court for a judgment with the effects of the promised contract. Under the 1966 text a deposit is presumed to exclude this, so the contract should state expressly that the parties allow it.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde ao art. 830.º do Código Civil de 1966.', en: 'Corresponds to art. 830 of the 1966 Civil Code.' },
  },
  terraPropriedadeEstado: {
    title: { pt: 'A terra é propriedade do Estado', en: 'Land belongs to the State' },
    summary: {
      pt: 'Em Moçambique a terra é propriedade do Estado e não pode ser vendida, hipotecada ou por qualquer forma alienada. Os particulares têm o direito de uso e aproveitamento da terra (DUAT).',
      en: 'In Mozambique land belongs to the State and cannot be sold, mortgaged or otherwise disposed of. Individuals hold a right of use and benefit of land (DUAT).',
    },
    law: 'leiTerras1997',
    sourceUrl: 'https://www.pdul.gov.mz/content/download/486/2635/file/Lei%20de%20Terras.pdf',
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Uma proposta de nova Lei de Terras foi aprovada pelo Conselho de Ministros em 28 de Outubro de 2025 e submetida à Assembleia da República; até Outubro de 2026 não se encontrou publicação da nova lei.',
      en: 'A new Land Law bill was approved by the Council of Ministers on 28 October 2025 and sent to Parliament; no publication of the new law was found as of October 2026.',
    },
  },
  transmissaoBenfeitorias: {
    title: { pt: 'Transmissão de benfeitorias e do DUAT', en: 'Transfer of improvements and of the DUAT' },
    summary: {
      pt: 'O DUAT transmite-se por herança. Entre vivos, o titular pode transmitir as infra-estruturas, construções e benfeitorias, mediante escritura pública precedida de autorização da entidade estatal competente. Nos prédios urbanos, com a transmissão do prédio transmite-se o DUAT, sem autorização prévia.',
      en: 'The DUAT passes by inheritance. Between living persons, the holder may transfer infrastructure, buildings and improvements by notarial deed after authorisation by the competent State body. For urban buildings, the DUAT passes with the building without prior authorisation.',
    },
    law: 'leiTerras1997',
    article: 'art. 16.º',
    sourceUrl: 'https://www.dlapiperafrica.com/export/sites/africa/mozambique/insights/legislation-series/land/downloads/Lei_19_1997.pdf_2063069299.pdf',
    lastVerified: V,
    confidence: 'verified',
  },
  sisaTaxa: {
    title: { pt: 'Imposto de SISA', en: 'Property transfer tax (SISA)' },
    summary: {
      pt: 'A transmissão onerosa de imóveis paga SISA à taxa de 2%, sobre o maior entre o valor declarado e o valor patrimonial. Paga o adquirente, antes da escritura; sem o comprovativo, o registo não avança.',
      en: 'A paid transfer of real estate is subject to SISA at 2% of the higher of the declared and the assessed value. The buyer pays it before the deed; registration does not proceed without proof of payment.',
    },
    law: 'codigoTributarioAutarquico',
    value: 0.02,
    sourceUrl: 'https://cmcpemba.gov.mz/impostos-e-taxas/iasisa',
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Imposto Autárquico da SISA nos municípios. Há também imposto do selo sobre a aquisição de imóveis, cuja taxa deve ser confirmada na Tabela do Imposto do Selo.',
      en: 'Municipal SISA tax. Stamp duty on the acquisition of real estate also applies; its rate must be confirmed in the Stamp Duty Table.',
    },
  },
  registoPredial: {
    title: { pt: 'Registo predial', en: 'Land registry' },
    summary: {
      pt: 'A aquisição de imóveis é registada na Conservatória do Registo Predial, para dar publicidade e tornar o direito oponível a terceiros.',
      en: 'Acquisitions of real estate are registered at the Land Registry, giving public notice and making the right enforceable against third parties.',
    },
    law: 'codigoRegistoPredial2018',
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Sale of goods
  compraVendaComercial: {
    title: { pt: 'Compra e venda comercial', en: 'Commercial sale' },
    summary: {
      pt: 'O Regime Jurídico dos Contratos Comerciais regula a compra e venda e estende as suas regras às vendas independentemente da natureza comercial ou civil das partes. O Código Civil aplica-se subsidiariamente.',
      en: 'The Commercial Contracts Regime governs sales and extends its rules to sales whatever the commercial or civil nature of the parties. The Civil Code applies in the alternative.',
    },
    law: 'regimeContratosComerciais',
    article: 'art. 146.º, n.º 3',
    sourceUrl: 'https://cij.up.pt/en/red/previous-editions/2025-no-2-2/the-scope-of-the-derogatory-power-of-the-legal-regime-of-commercial-contracts-of-mozambique/',
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Parte da doutrina considera esta extensão ilegal por exceder a autorização legislativa.',
      en: 'Some commentators consider this extension unlawful because it exceeds the legislative authorisation.',
    },
  },
  reservaPropriedade: {
    title: { pt: 'Reserva de propriedade', en: 'Retention of title' },
    summary: {
      pt: 'Nos contratos de alienação, o vendedor pode reservar para si a propriedade da coisa até ao pagamento total do preço. Nos bens sujeitos a registo, a reserva só é oponível a terceiros se for registada.',
      en: 'In a sale, the seller may keep ownership until the price is paid in full. For registrable goods, the retention binds third parties only if registered.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde ao art. 409.º do Código Civil de 1966.', en: 'Corresponds to art. 409 of the 1966 Civil Code.' },
  },
  vendaDefeituosa: {
    title: { pt: 'Venda de coisa defeituosa', en: 'Sale of defective goods' },
    summary: {
      pt: 'O comprador deve denunciar o defeito ao vendedor até 30 dias depois de o conhecer e dentro de 6 meses após a entrega, salvo se o vendedor o tiver enganado. Pode exigir a reparação ou substituição, a redução do preço ou a anulação.',
      en: 'The buyer must report the defect within 30 days of discovering it and within 6 months of delivery, unless the seller acted fraudulently. The buyer may claim repair or replacement, a price reduction or annulment.',
    },
    law: 'codigoCivil',
    value: { denunciaDias: 30, entregaMeses: 6 },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 913.º a 922.º (prazos do art. 916.º) do Código Civil de 1966.', en: 'Corresponds to arts. 913–922 (periods in art. 916) of the 1966 Civil Code.' },
  },

  // ------------------------------------------------------------------ Loans
  mutuoForma: {
    title: { pt: 'Forma do contrato de mútuo', en: 'Form of a loan agreement' },
    summary: {
      pt: 'Em Moçambique, o contrato de mútuo é válido se for celebrado por documento assinado pelo mutuário, com a assinatura reconhecida presencialmente no notário. Sem esta forma, o contrato pode ser nulo.',
      en: 'In Mozambique, a loan agreement is valid if made in a document signed by the borrower, with the signature certified in person by a notary. Without this form, the contract may be void.',
    },
    law: 'codigoCivil',
    article: 'art. 1143.º',
    sourceUrl: 'https://www.bancomoc.mz/media/imwbzqsy/decreto_25_2006.pdf',
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Redacção do Decreto-Lei n.º 3/2006, de 23 de Agosto, alterada pelo Decreto-Lei n.º 2/2021, de 9 de Agosto (modelo de contrato aprovado). Não foi possível confirmar se subsiste algum limite de valor.',
      en: 'As amended by Decree-Law 3/2006 of 23 August and Decree-Law 2/2021 of 9 August (approved model contract). Whether any value threshold remains could not be confirmed.',
    },
  },
  mutuoJuros: {
    title: { pt: 'Juros e usura no mútuo', en: 'Interest and usury in loans' },
    summary: {
      pt: 'As partes podem convencionar juros; em caso de dúvida, o mútuo presume-se oneroso. Juros que excedam o limite legal são usurários e reduzem-se ao máximo permitido. Na falta de prazo, o mutuário só tem de restituir depois de interpelado.',
      en: 'The parties may agree interest; in doubt, a loan is presumed to carry interest. Interest above the legal limit is usurious and reduced to the maximum allowed. If no term is set, the borrower must repay only after being asked.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Corresponde aos arts. 1145.º a 1148.º do Código Civil de 1966. Confirme o limite de usura e a taxa de juros legais em vigor antes de fixar a taxa.',
      en: 'Corresponds to arts. 1145–1148 of the 1966 Civil Code. Confirm the usury cap and the legal interest rate in force before setting the rate.',
    },
  },
  creditoLicenca: {
    title: { pt: 'Concessão de crédito como actividade', en: 'Lending as a business' },
    summary: {
      pt: 'Conceder crédito de forma habitual, como actividade, está reservado às instituições autorizadas pelo Banco de Moçambique. Um empréstimo ocasional entre particulares não está abrangido.',
      en: 'Lending money habitually, as a business, is reserved to institutions licensed by the Banco de Moçambique. An occasional loan between private parties is not covered.',
    },
    law: 'leiInstituicoesCredito',
    lastVerified: V,
    confidence: 'confirm',
  },

  // ------------------------------------------------------------------ Free loan and gift
  comodatoRegime: {
    title: { pt: 'Comodato', en: 'Free loan of a thing (comodato)' },
    summary: {
      pt: 'Contrato gratuito pelo qual uma parte entrega à outra uma coisa, móvel ou imóvel, para que se sirva dela, com a obrigação de a restituir. O comodatário deve guardá-la, usá-la só para o fim acordado, não a ceder a terceiros e restituí-la. Não exige forma especial. Se houver pagamento, já não é comodato.',
      en: 'A free contract by which one party hands a movable or immovable thing to the other to use and return. The borrower must look after it, use it only for the agreed purpose, not pass it on, and return it. No special form. If there is payment, it is not a comodato.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 1129.º a 1141.º do Código Civil de 1966.', en: 'Corresponds to arts. 1129–1141 of the 1966 Civil Code.' },
  },
  doacaoForma: {
    title: { pt: 'Forma da doação', en: 'Form of a gift' },
    summary: {
      pt: 'A doação de imóveis exige escritura pública. A doação de coisas móveis não depende de forma especial se for acompanhada da entrega da coisa; sem entrega, tem de ser feita por escrito.',
      en: 'A gift of real estate requires a notarial deed. A gift of movable goods needs no special form if the goods are handed over; otherwise it must be in writing.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde ao art. 947.º do Código Civil de 1966.', en: 'Corresponds to art. 947 of the 1966 Civil Code.' },
  },
  impostoDoacoes: {
    title: { pt: 'Imposto sobre doações', en: 'Gift tax' },
    summary: {
      pt: 'As transmissões gratuitas de bens móveis e imóveis estão sujeitas ao imposto sobre sucessões e doações, salvo isenção. As doações com carácter de caridade, assistência ou beneficência estão excluídas.',
      en: 'Gifts of movable and immovable property are subject to inheritance and gift tax unless exempt. Gifts for charity, assistance or benevolent purposes are excluded.',
    },
    law: 'codigoSucessoesDoacoes',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirme as taxas e o prazo de participação junto da Autoridade Tributária.', en: 'Confirm the rates and the reporting deadline with the Tax Authority.' },
  },

  // ------------------------------------------------------------------ Construction
  empreitadaRegime: {
    title: { pt: 'Contrato de empreitada', en: 'Construction contract' },
    summary: {
      pt: 'O empreiteiro obriga-se a realizar uma obra mediante um preço. O dono da obra pode fiscalizá-la; as alterações ao plano exigem acordo; o dono da obra verifica e aceita a obra; pode desistir, indemnizando o empreiteiro.',
      en: 'The contractor undertakes to carry out works for a price. The owner may inspect; changes need agreement; the owner checks and accepts the works; the owner may withdraw, compensating the contractor.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 1207.º a 1230.º do Código Civil de 1966.', en: 'Corresponds to arts. 1207–1230 of the 1966 Civil Code.' },
  },
  empreitadaDefeitos: {
    title: { pt: 'Defeitos da obra', en: 'Defects in the works' },
    summary: {
      pt: 'O dono da obra deve denunciar os defeitos ao empreiteiro nos 30 dias seguintes ao seu descobrimento, e os direitos caducam se não forem exercidos no prazo de um ano. Nos imóveis destinados a longa duração, o empreiteiro responde durante 5 anos pelos defeitos graves e pela ruína.',
      en: 'The owner must report defects within 30 days of discovering them, and the rights lapse if not exercised within one year. For buildings meant to last, the contractor is liable for 5 years for serious defects and collapse.',
    },
    law: 'codigoCivil',
    value: { denunciaDias: 30, caducidadeAnos: 1, imoveisAnos: 5 },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 1220.º, 1224.º e 1225.º do Código Civil de 1966.', en: 'Corresponds to arts. 1220, 1224 and 1225 of the 1966 Civil Code.' },
  },
  alvaraEmpreiteiro: {
    title: { pt: 'Alvará de empreiteiro', en: 'Contractor’s licence' },
    summary: {
      pt: 'Quem exerce a actividade de empreiteiro de construção civil deve ter alvará válido, da classe correspondente ao valor das obras e da categoria adequada ao tipo de trabalho.',
      en: 'Building contractors must hold a valid licence (alvará) of the class matching the value of the works and the category suited to the type of work.',
    },
    law: 'regulamentoEmpreiteiro2013',
    sourceUrl: 'https://practiceguides.chambers.com/practice-guides/construction-law-2026/mozambique',
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Commercial contracts
  clausulasNaoEscritas: {
    title: { pt: 'Cláusulas não comunicadas', en: 'Terms not communicated' },
    summary: {
      pt: 'Nos contratos comerciais, as cláusulas que não tenham sido devidamente comunicadas ou esclarecidas à outra parte podem considerar-se não escritas. As condições do contrato devem constar do documento assinado.',
      en: 'In commercial contracts, terms not properly communicated or explained to the other party may be treated as not written. The terms must be in the signed document.',
    },
    law: 'regimeContratosComerciais',
    article: 'art. 20.º',
    sourceUrl: 'https://www.grupovidaeconomica.pt/pt-pt/os-negocios-e-as-clausulas-nao-escritas-em-mocambique',
    lastVerified: V,
    confidence: 'verified',
  },
  suspensaoCumprimento: {
    title: { pt: 'Suspensão do cumprimento', en: 'Suspension of performance' },
    summary: {
      pt: 'Nos contratos comerciais, se a outra parte não cumprir a sua obrigação, o credor pode suspender o cumprimento da sua própria prestação até que aquela cumpra.',
      en: 'In commercial contracts, if the other party fails to perform, the creditor may suspend its own performance until the other party performs.',
    },
    law: 'regimeContratosComerciais',
    article: 'art. 116.º, n.º 1, al. c)',
    sourceUrl: 'https://businesslegal.co.mz/a-suspensao-de-cumprimento-como-novo-meio-de-tutela-do-credito-comercial/',
    lastVerified: V,
    confidence: 'verified',
  },
  fornecimentoRegime: {
    title: { pt: 'Contrato de fornecimento', en: 'Supply contract' },
    summary: {
      pt: 'O contrato de fornecimento, simples ou de distribuição, é regulado pelo Regime Jurídico dos Contratos Comerciais. Uma parte obriga-se a entregar bens à outra de forma periódica ou continuada, mediante um preço.',
      en: 'Supply contracts, simple or for distribution, are governed by the Commercial Contracts Regime. One party delivers goods to the other periodically or continuously for a price.',
    },
    law: 'regimeContratosComerciais',
    sourceUrl: 'https://fll.um.edu.mo/wp-content/uploads/2024/09/II-17-Almeida-Machava_p589-633.pdf',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirme os artigos aplicáveis no Decreto-Lei n.º 3/2022.', en: 'Confirm the applicable articles of Decree-Law 3/2022.' },
  },
  agenciaRegime: {
    title: { pt: 'Contrato de agência', en: 'Agency contract' },
    summary: {
      pt: 'Pelo contrato de agência, o agente promove por conta do principal a celebração de contratos, de modo autónomo e estável, mediante retribuição, numa zona ou junto de certos clientes. O agente só celebra contratos ou recebe pagamentos se tiver poderes escritos. A lei pode conferir ao agente uma indemnização de clientela no fim do contrato.',
      en: 'Under an agency contract, the agent promotes contracts for the principal, independently and on a stable basis, for remuneration, in a territory or with certain clients. The agent concludes contracts or collects payments only with written powers. The law may give the agent a goodwill indemnity at the end.',
    },
    law: 'regimeContratosComerciais',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'O contrato de agência passou do Código Comercial para o Decreto-Lei n.º 3/2022. Confirme os artigos, os prazos mínimos de denúncia e o regime da indemnização de clientela.',
      en: 'The agency contract moved from the Commercial Code to Decree-Law 3/2022. Confirm the articles, minimum notice periods and the goodwill indemnity rules.',
    },
  },
  consorcioForma: {
    title: { pt: 'Contrato de consórcio', en: 'Consortium agreement' },
    summary: {
      pt: 'O consórcio é regulado pelo Regime Jurídico dos Contratos Comerciais. O contrato deve ser escrito, com as assinaturas reconhecidas no notário, e registado. O consórcio não tem personalidade jurídica.',
      en: 'Consortia are governed by the Commercial Contracts Regime. The agreement must be in writing, with signatures certified by a notary, and registered. A consortium has no legal personality.',
    },
    law: 'regimeContratosComerciais',
    sourceUrl: 'https://www.abassociados.com/o-consorcio-no-regime-juridico-mocambicano/',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Fonte secundária (sociedade de advogados moçambicana). Confirme os artigos e a conservatória competente.', en: 'Secondary source (Mozambican law firm). Confirm the articles and the competent registry.' },
  },

  // ------------------------------------------------------------------ Business transfer
  trespasseRegime: {
    title: { pt: 'Trespasse do estabelecimento', en: 'Transfer of a business' },
    summary: {
      pt: 'O estabelecimento pode ser trespassado, no todo ou em parte. O trespasse deve ser feito por escrito e só produz efeitos em relação a terceiros depois de registado. O trespasse parcial é nulo se o trespassante não ficar com outros bens suficientes para cumprir as suas obrigações. Se incluir imóveis, exige escritura pública.',
      en: 'A business may be transferred in whole or in part. The transfer must be in writing and binds third parties only after registration. A partial transfer is void unless the transferor keeps enough other assets to meet its obligations. If real estate is included, a notarial deed is required.',
    },
    law: 'codigoComercial',
    sourceUrl: 'https://www.bancomoc.mz/media/q4kh3wop/decreto-lei-1-2022_25-de-maio_c%C3%B3digo-comercial.pdf',
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'A exigência de escritura quando há imóveis consta do Código de 2005; confirme a redacção e os artigos do Código de 2022.',
      en: 'The deed requirement when real estate is included is in the 2005 Code; confirm the wording and articles of the 2022 Code.',
    },
  },
  trespasseNaoConcorrencia: {
    title: { pt: 'Proibição de concorrência do trespassante', en: 'Non-compete of the transferor' },
    summary: {
      pt: 'Quem trespassa o estabelecimento não pode, nos 5 anos seguintes, iniciar actividade concorrente na mesma área de influência, salvo consentimento escrito do adquirente.',
      en: 'For 5 years after the transfer, the transferor may not start a competing business in the same area, unless the buyer consents in writing.',
    },
    law: 'codigoComercial',
    value: 5, // anos
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Prazo do Código Comercial de 2005; confirme se o Código de 2022 o mantém.',
      en: 'Period from the 2005 Commercial Code; confirm whether the 2022 Code keeps it.',
    },
  },
  trespasseArrendamento: {
    title: { pt: 'Trespasse e arrendamento', en: 'Business transfer and the lease' },
    summary: {
      pt: 'No trespasse de estabelecimento comercial ou industrial instalado em local arrendado, a posição de arrendatário transmite-se sem autorização do senhorio, mas o trespasse deve ser-lhe comunicado por escrito.',
      en: 'When a shop or factory in leased premises is transferred, the tenancy passes without the landlord’s consent, but the landlord must be notified in writing.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Corresponde aos arts. 1118.º e 1038.º, al. g), do Código Civil de 1966; confirme o prazo de comunicação e a legislação especial do arrendamento.',
      en: 'Corresponds to arts. 1118 and 1038(g) of the 1966 Civil Code; confirm the notice period and special lease legislation.',
    },
  },

  // ------------------------------------------------------------------ Negotiations
  negociacoesBoaFe: {
    title: { pt: 'Boa-fé nas negociações', en: 'Good faith in negotiations' },
    summary: {
      pt: 'Quem negoceia um contrato deve proceder segundo as regras da boa-fé, tanto nos preliminares como na formação do contrato, sob pena de responder pelos danos causados. Dentro dos limites da lei, as partes fixam livremente o conteúdo dos contratos.',
      en: 'Parties negotiating a contract must act in good faith, both in preliminary talks and in forming the contract, or they are liable for the damage caused. Within the law, parties freely set the content of contracts.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 227.º e 405.º do Código Civil de 1966.', en: 'Corresponds to arts. 227 and 405 of the 1966 Civil Code.' },
  },
} satisfies Record<string, LegalEntryDef>;
