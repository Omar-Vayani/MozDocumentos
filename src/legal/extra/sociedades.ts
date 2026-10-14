// Legal values for the "sociedades" (company law) documents. Keys must not clash with other files.
//
// Sources were read through law-firm alerts and excerpts of the official texts:
// Código Comercial (Decreto-Lei n.º 1/2022, de 25 de Maio, in force since
// 22 September 2022) and Regulamento do Registo de Entidades Legais
// (Decreto-Lei n.º 1/2024, de 8 de Março). Anything not read in the official
// text is marked 'confirm' and carries no article number.
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-13';
const CCOM = 'https://www.bancomoc.mz/media/q4kh3wop/decreto-lei-1-2022_25-de-maio_c%C3%B3digo-comercial.pdf';
const RREL = 'https://ts.gov.mz/wp-content/uploads/2024/05/Decreto-Lei-n-o-1-2024-de-08-de-Marco-que-aprova-o-Regulamento-do-regime-de-Entidades-Legais-e-revoga-o-Decreto-n-1-2006.pdf';

export const LAWS_SOCIEDADES = {
  rrel2024: {
    short: 'Regulamento do Registo de Entidades Legais',
    cite: 'do Regulamento do Registo de Entidades Legais',
    title: 'Regulamento do Registo de Entidades Legais, aprovado pelo Decreto-Lei n.º 1/2024, de 8 de Março (revoga o Decreto n.º 1/2006, de 3 de Maio)',
    url: RREL,
  },
  leiBranqueamento2023: {
    short: 'Lei n.º 14/2023',
    cite: 'da Lei n.º 14/2023',
    title: 'Lei n.º 14/2023 — Lei de Prevenção e Combate ao Branqueamento de Capitais e Financiamento do Terrorismo, regulamentada pelo Decreto n.º 53/2023',
  },
  dm28_2024: {
    short: 'Diploma Ministerial n.º 28/2024',
    cite: 'do Diploma Ministerial n.º 28/2024',
    title: 'Diploma Ministerial n.º 28/2024 (contratação pública — declaração do beneficiário efectivo do concorrente vencedor)',
    url: 'https://www.ufsa.gov.mz/query/Baixar_documento.php?nome=BENEFICIARIO+EFECTIVO',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_SOCIEDADES = {
  sociedadeContratoForma: {
    title: { pt: 'Forma do contrato de sociedade', en: 'Form of the articles of association' },
    summary: {
      pt: 'O contrato de sociedade é celebrado por documento escrito assinado por todos os sócios ou pelos seus representantes, com as assinaturas reconhecidas notarialmente. Se o capital for realizado em espécie com a transferência de bens imóveis, é necessária escritura pública.',
      en: 'The articles are made in writing, signed by all members or their representatives, with the signatures certified by a notary. If capital is paid in kind by transferring real estate, a public deed is required.',
    },
    law: 'codigoComercial',
    sourceUrl: 'https://www.mdradvogados.com/xms/files/2022/Aprovacao_do_Novo_Codigo_Comercial_-_Legal_Alert_MDR.pdf',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Lido numa reprodução do art. 74 do Código de 2022 (reconhecimento «por semelhança»); confirme no Boletim da República se basta o reconhecimento por semelhança ou se a Conservatória exige reconhecimento presencial.',
      en: 'Read in a reproduction of art. 74 of the 2022 Code (signature recognition "by likeness"); confirm in the official gazette whether the registry accepts it or requires in-person recognition.',
    },
  },
  sociedadeUnipessoal: {
    title: { pt: 'Sociedade unipessoal por quotas', en: 'Single-member private company' },
    summary: {
      pt: 'A sociedade unipessoal por quotas tem um único sócio, que pode ser pessoa singular ou colectiva; o capital é representado por uma única quota. A firma inclui a expressão «Sociedade Unipessoal, Limitada».',
      en: 'A single-member private company has one member, an individual or a company; its capital is one single quota. The name includes "Sociedade Unipessoal, Limitada".',
    },
    law: 'codigoComercial',
    sourceUrl: 'https://www.mdradvogados.com/xms/files/2024/OA_MZ_AO_EAN_Breves_notas_sobre_o_regime_juridico_das_sociedades_unipessoais_por_quotas_a_luz_do_novo_Codigo_Comercial_Fevereiro_2024.pdf',
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'A admissão de pessoas colectivas como sócio único foi confirmada; a forma exacta da firma segue a prática do Boletim da República.',
      en: 'Companies as sole members is confirmed; the exact form of the name follows gazette practice.',
    },
  },
  beneficiarioEfectivoSociedade: {
    title: { pt: 'Beneficiário efectivo — dever da sociedade', en: 'Beneficial owner — company duty' },
    summary: {
      pt: 'A sociedade mantém informação actualizada sobre os seus beneficiários efectivos. O sócio ou accionista comunica à sociedade qualquer alteração dos elementos de identificação no prazo de 30 dias.',
      en: 'The company keeps up-to-date information on its beneficial owners. A member must report any change in identification details to the company within 30 days.',
    },
    law: 'codigoComercial',
    article: 'art. 99.º',
    value: 30, // dias
    sourceUrl: 'https://www.dlapiperafrica.com/en/mozambique/insights/2022/The-Beneficial-Owner-under-the-New-Commercial-Code-.html',
    lastVerified: V,
    confidence: 'verified',
  },
  beneficiarioEfectivoDeclaracao: {
    title: { pt: 'Declaração do beneficiário efectivo', en: 'Beneficial owner declaration' },
    summary: {
      pt: 'O registo da declaração do beneficiário efectivo é obrigatório. A declaração identifica a entidade e, para cada beneficiário: nome completo, data de nascimento, documento de identificação válido, domicílio habitual, profissional e fiscal, nacionalidade, NUIT, telemóvel, percentagem detida e tipo de controlo. É apresentada à Conservatória pelo portal ou em impresso próprio e actualizada quando houver alterações.',
      en: 'Registering the beneficial owner declaration is mandatory. It identifies the entity and, for each owner: full name, date of birth, valid ID, habitual, professional and tax address, nationality, NUIT, mobile number, percentage held and type of control. It is filed with the registry online or on the official form, and updated on any change.',
    },
    law: 'rrel2024',
    sourceUrl: 'https://www.cga.co.mz/pt/moz/publication/o-beneficiario-efectivo-ao-abrigo-do-regulamento-do-registo-de-entidades-legais-aprovado-pelo-decreto-lei-n.-1-2024-de-8-de-marco',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Conteúdo indicado como art. 15 do Regulamento (fonte: CGA); confirme o número do artigo.',
      en: 'Content reported as art. 15 of the Regulation (source: CGA); confirm the article number.',
    },
  },
  beneficiarioEfectivoLimiar: {
    title: { pt: 'Beneficiário efectivo — limiar', en: 'Beneficial owner — threshold' },
    summary: {
      pt: 'É beneficiário efectivo a pessoa singular que detém, directa ou indirectamente, pelo menos 10% do capital social ou dos direitos de voto, ou que controla a entidade por outro meio.',
      en: 'A beneficial owner is an individual who holds, directly or indirectly, at least 10% of the capital or voting rights, or who controls the entity by other means.',
    },
    law: 'leiBranqueamento2023',
    value: 0.1,
    sourceUrl: 'https://www.rsm.global/mozambique/pt-pt/news/registo-do-beneficiario-efectivo-1',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Limiar indicado por duas sociedades de advogados (RSM e Miranda); confirme a disposição legal que o fixa.',
      en: 'Threshold reported by two law firms (RSM and Miranda); confirm the provision that sets it.',
    },
  },
  beneficiarioEfectivoConcurso: {
    title: { pt: 'Beneficiário efectivo — contratação pública', en: 'Beneficial owner — public procurement' },
    summary: {
      pt: 'O concorrente vencedor entrega à entidade contratante, em papel e em formato digital, a declaração do beneficiário efectivo antes da assinatura do contrato, no prazo de 10 dias úteis.',
      en: 'The winning bidder gives the contracting entity the beneficial owner declaration, on paper and digitally, before the contract is signed, within 10 working days.',
    },
    law: 'dm28_2024',
    value: 10, // dias úteis
    lastVerified: V,
    confidence: 'confirm',
  },
  registoEntidadesPrazo: {
    title: { pt: 'Prazo do registo obrigatório', en: 'Deadline for mandatory registration' },
    summary: {
      pt: 'O registo obrigatório é requerido na Conservatória do Registo das Entidades Legais no prazo de 30 dias a contar da data em que o facto foi titulado; o atraso está sujeito a multa.',
      en: 'Mandatory registration must be applied for at the Legal Entities Registry within 30 days of the act being executed; late filing is fined.',
    },
    law: 'rrel2024',
    value: 30, // dias
    sourceUrl: 'https://www.mdradvogados.com/xms/files/2024/Revisao_do_Regulamento_do_Registo_de_Entidades_Legais_-_Legal_Alert_MDR_-PT-.pdf',
    lastVerified: V,
    confidence: 'verified',
  },
  registoPublicacaoBR: {
    title: { pt: 'Publicação no Boletim da República', en: 'Publication in the official gazette' },
    summary: {
      pt: 'Os actos sujeitos a registo são obrigatoriamente publicados no Boletim da República. Feito o registo, o Conservador promove as publicações, a expensas do interessado; o contrato de sociedade e as suas alterações são publicados por extracto.',
      en: 'Registrable acts must be published in the official gazette. After registration the registrar arranges publication at the applicant’s expense; articles and amendments are published as an extract.',
    },
    law: 'rrel2024',
    sourceUrl: RREL,
    lastVerified: V,
    confidence: 'verified',
  },
  transmissaoQuotas: {
    title: { pt: 'Transmissão de quotas', en: 'Transfer of quotas' },
    summary: {
      pt: 'A transmissão de quotas entre vivos consta de documento escrito. É ineficaz perante a sociedade enquanto não lhe for comunicada por escrito e registada. Salvo disposição em contrário do contrato, a sociedade e, depois dela, os sócios gozam de direito de preferência; a divisão de quotas depende do consentimento da assembleia geral.',
      en: 'A transfer of quotas between living persons is made in writing. It has no effect on the company until notified in writing and registered. Unless the articles say otherwise, the company and then the members have pre-emption rights; dividing a quota needs the general meeting’s consent.',
    },
    law: 'codigoComercial',
    sourceUrl: CCOM,
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Regras confirmadas no Código de 2005 (alterado em 2018); confirme os artigos correspondentes do Código de 2022.',
      en: 'Rules confirmed in the 2005 Code (amended 2018); confirm the corresponding articles of the 2022 Code.',
    },
  },
  deliberacaoPorEscrito: {
    title: { pt: 'Deliberação unânime por escrito', en: 'Unanimous written resolution' },
    summary: {
      pt: 'Os sócios podem deliberar sem reunião de assembleia geral, desde que todos declarem por escrito o sentido do seu voto. A deliberação considera-se tomada na data em que a sociedade recebe o último dos documentos assinados.',
      en: 'Members may resolve without a meeting if all of them state their vote in writing. The resolution is taken on the date the company receives the last signed document.',
    },
    law: 'codigoComercial',
    sourceUrl: CCOM,
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Regra confirmada no Código de 2005 e no projecto de 2020; confirme o artigo do Código de 2022.',
      en: 'Rule confirmed in the 2005 Code and the 2020 draft; confirm the article of the 2022 Code.',
    },
  },
  renunciaGerente: {
    title: { pt: 'Renúncia de gerente ou administrador', en: 'Resignation of a manager or director' },
    summary: {
      pt: 'A renúncia é feita por carta dirigida à sociedade. O registo da cessação de funções é pedido, depois de a renúncia produzir efeitos, com a carta de renúncia, a acta da deliberação e a declaração da administração a solicitar a inscrição. A renúncia sem justa causa antes do fim do mandato pode obrigar a indemnizar a sociedade.',
      en: 'Resignation is made by letter to the company. Registration of the end of office is requested, once effective, with the letter, the minutes and a management request. Resigning without cause before the term ends may make the person liable for damages.',
    },
    law: 'rrel2024',
    sourceUrl: RREL,
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'No Código de 2005 a renúncia do administrador produzia efeitos no fim do mês seguinte ao da comunicação, salvo designação de substituto; confirme a regra do Código de 2022.',
      en: 'Under the 2005 Code a director’s resignation took effect at the end of the month after notice unless a replacement was appointed; confirm under the 2022 Code.',
    },
  },
  suprimentoForma: {
    title: { pt: 'Contrato de suprimento', en: 'Shareholder loan' },
    summary: {
      pt: 'Suprimento é o empréstimo de dinheiro ou de outra coisa fungível feito pelo sócio à sociedade, ou o diferimento de um crédito do sócio, com carácter de permanência. O contrato não está sujeito a forma especial. Não se confunde com as prestações suplementares, que dependem do contrato de sociedade.',
      en: 'A shareholder loan is money or fungible goods lent by a member to the company, or a deferral of a member’s claim, on a lasting basis. No special form is required. It differs from supplementary contributions, which must be provided for in the articles.',
    },
    law: 'codigoComercial',
    sourceUrl: CCOM,
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Forma livre lida numa reprodução do art. 108 do Código de 2022; confirme.',
      en: 'Free form read in a reproduction of art. 108 of the 2022 Code; confirm.',
    },
  },
  acordoParassocial: {
    title: { pt: 'Acordo parassocial', en: 'Shareholders’ agreement' },
    summary: {
      pt: 'Os sócios podem celebrar entre si acordos sobre o exercício dos seus direitos sociais. O acordo vincula apenas as partes e não pode ser invocado contra a sociedade nem contra terceiros.',
      en: 'Members may agree among themselves on how they exercise their rights. The agreement binds only the parties and cannot be invoked against the company or third parties.',
    },
    law: 'codigoComercial',
    sourceUrl: CCOM,
    lastVerified: V,
    confidence: 'confirm',
  },
} satisfies Record<string, LegalEntryDef>;
