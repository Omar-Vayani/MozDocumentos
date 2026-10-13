// Legal values for the "associacoes" documents (associations, NGOs, churches,
// volunteering and savings groups). Keys must not clash with other files.
//
// Sources were read through excerpts of the Boletim da República quoted by
// search results, recognition despachos published in the BR (III Série) and
// law-firm alerts. Anything not read in the official text is marked 'confirm'
// and carries no article number.
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-13';
const BR_LEI_8_91 = 'https://archive.gazettes.africa/archive/mz/1991/mz-government-gazette-series-i-supplement-dated-1991-07-18-no-29.pdf';
const DEC_21_91 = 'https://www.dlapiperafrica.com/export/sites/africa/mozambique/insights/legislation-series/associations-and-ngos/downloads/decreto_21_91.pdf_2063069299.pdf';
const DL_3_2006 = 'https://www.dlapiperafrica.com/export/sites/africa/mozambique/insights/legislation-series/associations-and-ngos/downloads/decreto_3_2006.pdf_2063069299.pdf';
const DESPACHO = 'https://archive.gazettes.africa/archive/mz/2025/mz-government-gazette-series-iii-dated-2025-08-01-no-146.pdf';
const CC_MZ = 'https://clr.africanchildforum.org/Legislation%20Per%20Country/Mozambique/mozambique_civilcode_1966_pr.pdf';

export const LAWS_ASSOCIACOES = {
  assocLei8_91: {
    short: 'Lei n.º 8/91',
    cite: 'da Lei n.º 8/91, de 18 de Julho',
    title: 'Lei n.º 8/91, de 18 de Julho — regula o direito à livre associação (BR I Série n.º 29, suplemento)',
    url: BR_LEI_8_91,
  },
  assocDec21_91: {
    short: 'Decreto n.º 21/91',
    cite: 'do Decreto n.º 21/91, de 3 de Outubro',
    title: 'Decreto n.º 21/91, de 3 de Outubro — competência para o reconhecimento das associações (BR I Série n.º 40)',
    url: DEC_21_91,
  },
  assocDec55_98: {
    short: 'Decreto n.º 55/98',
    cite: 'do Decreto n.º 55/98',
    title: 'Decreto n.º 55/98 — critérios de autorização e actuação das organizações não-governamentais estrangeiras',
    url: 'https://www.dlapiperafrica.com/export/sites/africa/mozambique/insights/legislation-series/associations-and-ngos/downloads/decreto_55_98.pdf_2063068952.pdf',
  },
  assocLei4_71: {
    short: 'Lei n.º 4/71',
    cite: 'da Lei n.º 4/71, de 21 de Agosto',
    title: 'Lei n.º 4/71, de 21 de Agosto — liberdade religiosa (em revisão: proposta de Lei da Liberdade Religiosa e de Culto em discussão em 2026)',
    url: 'https://aimnews.org/2026/02/23/governo-e-igrejas-divergem-sobre-numero-minimo-de-crentes-para-funcionamento/',
  },
  assocLei7_2011: {
    short: 'Lei n.º 7/2011',
    cite: 'da Lei n.º 7/2011, de 11 de Janeiro',
    title: 'Lei n.º 7/2011, de 11 de Janeiro — Regime Jurídico do Voluntariado (regulamentada pelo Decreto n.º 52/2017, de 11 de Outubro; novo regulamento aprovado em 2026, a confirmar)',
    url: 'https://disasterlaw.ifrc.org/sites/default/files/media/disaster_law/2021-06/lei%20do%20voluntariado.pdf',
  },
  assocRegistoCivil: {
    short: 'Código do Registo Civil',
    cite: 'do Código do Registo Civil',
    title: 'Código do Registo Civil (registo obrigatório dos nascimentos e dos casamentos)',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_ASSOCIACOES = {
  assocRequisitos: {
    title: { pt: 'Requisitos do reconhecimento de uma associação', en: 'Requirements for recognising an association' },
    summary: {
      pt: 'A associação adquire personalidade jurídica pelo reconhecimento, se reunir cumulativamente: um mínimo de dez fundadores, estatutos conformes à lei e a prova dos meios necessários ao seu funcionamento.',
      en: 'An association acquires legal personality by recognition if it has at least ten founders, statutes that comply with the law and proof of the means to operate.',
    },
    law: 'assocLei8_91',
    value: 10, // fundadores
    sourceUrl: BR_LEI_8_91,
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Texto citado do Boletim da República; o número do artigo não foi confirmado.',
      en: 'Text quoted from the official gazette; the article number was not confirmed.',
    },
  },
  assocReconhecimento: {
    title: { pt: 'Quem reconhece a associação', en: 'Who recognises the association' },
    summary: {
      pt: 'O reconhecimento é feito pelo Governo (Ministro da Justiça, Assuntos Constitucionais e Religiosos) ou pelo seu representante na província, quando a actividade da associação se confine ao território desta.',
      en: 'Recognition is granted by the Government (Minister of Justice) or by its representative in the province when the association works in one province only.',
    },
    law: 'assocLei8_91',
    article: 'n.º 1 do art. 5',
    sourceUrl: DESPACHO,
    lastVerified: V,
    confidence: 'verified',
  },
  assocReconhecimentoDecreto: {
    title: { pt: 'Competência delegada para o reconhecimento', en: 'Delegated power to recognise' },
    summary: {
      pt: 'O Ministro da Justiça reconhece as associações sem fins lucrativos; quando a actividade se circunscreva a uma província, é competente o órgão de representação do Estado na província.',
      en: 'The Minister of Justice recognises non-profit associations; when the activity is limited to one province, the provincial state representative does.',
    },
    law: 'assocDec21_91',
    article: 'art. 1',
    sourceUrl: DEC_21_91,
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'O decreto refere o Governador da província. Após a descentralização, confirme se o despacho provincial é hoje do Secretário de Estado na Província.',
      en: 'The decree names the provincial governor. After decentralisation, confirm whether the Secretary of State in the Province now signs.',
    },
  },
  assocReconhecimentoPrazo: {
    title: { pt: 'Prazo do despacho de reconhecimento', en: 'Deadline for the recognition decision' },
    summary: {
      pt: 'O despacho de reconhecimento é proferido no prazo de 45 dias e publicado no Boletim da República, com os estatutos. A recusa é fundamentada e admite recurso para o Tribunal Administrativo no prazo de 15 dias a contar da notificação.',
      en: 'The recognition decision is issued within 45 days and published in the official gazette with the statutes. A refusal must give reasons and may be appealed to the Administrative Court within 15 days of notice.',
    },
    law: 'assocLei8_91',
    value: { despacho: 45, recurso: 15 }, // dias
    sourceUrl: BR_LEI_8_91,
    lastVerified: V,
    confidence: 'verified',
  },
  assocRegisto: {
    title: { pt: 'Registo da associação', en: 'Registration of the association' },
    summary: {
      pt: 'Após a publicação do despacho de reconhecimento, o órgão directivo regista a associação na Conservatória competente (hoje, a Conservatória do Registo das Entidades Legais).',
      en: 'After the recognition decision is published, the board registers the association with the registry (now the Legal Entities Registry).',
    },
    law: 'assocLei8_91',
    article: 'art. 6',
    sourceUrl: BR_LEI_8_91,
    lastVerified: V,
    confidence: 'verified',
  },
  assocForma: {
    title: { pt: 'Forma do acto de constituição e dos estatutos', en: 'Form of the founding act and statutes' },
    summary: {
      pt: 'O acto de constituição, os estatutos e as suas alterações só exigem escritura pública quando envolvam bens imóveis; produzem efeitos em relação a terceiros depois de publicados no Boletim da República.',
      en: 'The founding act, the statutes and their amendments need a notarial deed only when real property is involved; they bind third parties after publication in the official gazette.',
    },
    law: 'codigoCivil',
    article: 'art. 168.º',
    sourceUrl: DL_3_2006,
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Redacção dada pelo Decreto-Lei n.º 3/2006, de 23 de Agosto.',
      en: 'As amended by Decree-Law 3/2006 of 23 August.',
    },
  },
  assocAGAnual: {
    title: { pt: 'Assembleia geral anual da associação', en: 'Annual general meeting of an association' },
    summary: {
      pt: 'A administração convoca a assembleia geral pelo menos uma vez por ano, para aprovação do balanço, e sempre que o requeira um quinto dos associados, salvo se os estatutos fixarem outro número.',
      en: 'The board calls the general meeting at least once a year to approve the accounts, and whenever one fifth of the members ask, unless the statutes set another number.',
    },
    law: 'codigoCivil',
    value: { requerimento: 0.2 },
    sourceUrl: CC_MZ,
    lastVerified: V,
    confidence: 'confirm',
  },
  assocQuorum: {
    title: { pt: 'Quórum e maiorias na associação', en: 'Quorum and majorities in an association' },
    summary: {
      pt: 'Em primeira convocação, a assembleia geral só delibera com a presença de, pelo menos, metade dos associados; as deliberações são tomadas por maioria absoluta dos presentes. A alteração dos estatutos exige três quartos dos associados presentes e a dissolução três quartos de todos os associados.',
      en: 'On first call the meeting needs at least half of the members; resolutions pass by absolute majority of those present. Amending the statutes needs three quarters of those present; dissolution needs three quarters of all members.',
    },
    law: 'codigoCivil',
    value: { primeira: 0.5, estatutos: 0.75, dissolucao: 0.75 },
    sourceUrl: CC_MZ,
    lastVerified: V,
    confidence: 'confirm',
  },
  assocOrgaos: {
    title: { pt: 'Órgãos da associação', en: 'Bodies of an association' },
    summary: {
      pt: 'A associação tem um órgão de administração e um conselho fiscal, ambos colegiais e compostos por número ímpar de titulares, e uma assembleia geral.',
      en: 'An association has a board and an audit council, both with an odd number of members, and a general meeting.',
    },
    law: 'codigoCivil',
    sourceUrl: CC_MZ,
    lastVerified: V,
    confidence: 'confirm',
  },
  assocBeneficiarioOSFL: {
    title: { pt: 'Beneficiários efectivos das organizações sem fins lucrativos', en: 'Beneficial owners of non-profit organisations' },
    summary: {
      pt: 'As associações, confissões religiosas, fundações e ONG estrangeiras declaram os seus beneficiários efectivos e os titulares dos órgãos na Conservatória do Registo das Entidades Legais. O incumprimento sujeita a multa.',
      en: 'Associations, religious bodies, foundations and foreign NGOs must declare their beneficial owners and officers to the Legal Entities Registry. Failure is fined.',
    },
    law: 'leiBranqueamento2023',
    sourceUrl: 'https://www.dlapiperafrica.com/en/mozambique/insights/2025/Beneficial-Owner-Declaration-by-Non-Profit-Organizations-2025-',
    lastVerified: V,
    confidence: 'verified',
  },
  assocOngEstrangeira: {
    title: { pt: 'ONG estrangeiras', en: 'Foreign NGOs' },
    summary: {
      pt: 'As ONG estrangeiras actuam mediante autorização do Ministério dos Negócios Estrangeiros e Cooperação, estão proibidas de realizar ou promover acções de natureza política e devem criar capacidade nos parceiros nacionais.',
      en: 'Foreign NGOs operate under authorisation of the Ministry of Foreign Affairs, may not carry out political activity and must build capacity in national partners.',
    },
    law: 'assocDec55_98',
    sourceUrl: 'https://www.dlapiperafrica.com/export/sites/africa/mozambique/insights/legislation-series/associations-and-ngos/downloads/decreto_55_98.pdf_2063068952.pdf',
    lastVerified: V,
    confidence: 'verified',
  },
  assocConfissaoRegisto: {
    title: { pt: 'Registo de confissões religiosas', en: 'Registration of religious bodies' },
    summary: {
      pt: 'As confissões religiosas registam-se no Ministério da Justiça, Assuntos Constitucionais e Religiosos, ao abrigo da lei da liberdade religiosa e não da lei das associações. A prática actual exige um número mínimo de fiéis; a nova lei, em discussão, aumenta esse número.',
      en: 'Religious bodies register with the Ministry of Justice under the religious freedom law, not the associations law. Current practice requires a minimum number of followers; the new law under discussion raises it.',
    },
    law: 'assocLei4_71',
    value: 500, // fiéis (prática actual, segundo o Ministério)
    sourceUrl: 'https://aimnews.org/2026/02/23/governo-e-igrejas-divergem-sobre-numero-minimo-de-crentes-para-funcionamento/',
    lastVerified: V,
    confidence: 'confirm',
  },
  assocCasamentoReligioso: {
    title: { pt: 'Efeitos civis do casamento religioso', en: 'Civil effects of a religious marriage' },
    summary: {
      pt: 'O casamento religioso tem o valor do casamento civil quando observados os requisitos deste, com processo preliminar na Conservatória do Registo Civil, e produz efeitos civis depois de transcrito pelos serviços do registo civil.',
      en: 'A religious marriage has the value of a civil marriage when the civil requirements are met, with the preliminary process at the civil registry, and has civil effect once transcribed by the registry.',
    },
    law: 'leiFamilia22_2019',
    sourceUrl: 'https://reformar.co.mz/documentos-diversos/lei-22-2019-lei-da-familia.pdf',
    lastVerified: V,
    confidence: 'verified',
  },
  assocRegistoNascimento: {
    title: { pt: 'Prova do nascimento', en: 'Proof of birth' },
    summary: {
      pt: 'O nascimento prova-se pelo registo civil (cédula pessoal, assento ou certidão). Os certificados religiosos não têm efeitos civis.',
      en: 'Birth is proved by the civil registry (personal record, entry or certificate). Religious certificates have no civil effect.',
    },
    law: 'assocRegistoCivil',
    lastVerified: V,
    confidence: 'confirm',
  },
  assocVoluntariado: {
    title: { pt: 'Natureza do voluntariado', en: 'Nature of volunteering' },
    summary: {
      pt: 'O voluntariado é uma actividade livre e gratuita de interesse social e comunitário, promovida por entidades sem fins lucrativos; não gera vínculo laboral ou afim, podendo o voluntário ser ressarcido das despesas que comprovadamente realize.',
      en: 'Volunteering is free, unpaid activity of social interest run by non-profit entities; it creates no employment relationship, and the volunteer may be reimbursed documented expenses.',
    },
    law: 'assocLei7_2011',
    sourceUrl: 'https://disasterlaw.ifrc.org/sites/default/files/media/disaster_law/2021-06/lei%20do%20voluntariado.pdf',
    lastVerified: V,
    confidence: 'verified',
  },
  assocVoluntariadoRegulamento: {
    title: { pt: 'Regulamento da Lei do Voluntariado', en: 'Volunteering regulation' },
    summary: {
      pt: 'O Regulamento da Lei do Voluntariado (Decreto n.º 52/2017) foi substituído em 2026 por um novo regulamento que prevê a acreditação do trabalho voluntário e o controlo das entidades promotoras.',
      en: 'The volunteering regulation (Decree 52/2017) was replaced in 2026 by a new one providing for accreditation of volunteer work and oversight of promoting entities.',
    },
    law: 'assocLei7_2011',
    sourceUrl: 'https://opais.co.mz/conselho-de-ministros-aprova-novos-regulamentos-fiscais-e-do-voluntariado/',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Confirme o número do novo decreto e as obrigações de acreditação no Boletim da República.',
      en: 'Confirm the new decree number and accreditation duties in the official gazette.',
    },
  },
  assocPoupanca: {
    title: { pt: 'Grupos de poupança (xitique)', en: 'Savings groups (xitique)' },
    summary: {
      pt: 'O xitique e os grupos de poupança são acordos privados entre os membros, regidos pela liberdade contratual. O grupo não é uma instituição de crédito: não pode receber depósitos do público nem conceder crédito a terceiros como actividade.',
      en: 'Xitique and savings groups are private agreements among members under freedom of contract. A group is not a credit institution: it may not take deposits from the public or lend to outsiders as a business.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
  },
} satisfies Record<string, LegalEntryDef>;
