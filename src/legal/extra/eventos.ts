// Legal values for the "eventos" documents (CV, invitations, notices,
// certificates, cards). Keys must not clash with other files.
// Reused from other files: maioridade (pessoal-rh), registoObito (comunidade),
// eduHabilitacoesProfissionais and eduEducacaoProfissional (educacao).
import type { LawInfo, LegalEntryDef } from '../types';

const LEI13 = 'https://faolex.fao.org/docs/pdf/moz221728.pdf';
const FAMILIA = 'https://faolex.fao.org/docs/pdf/moz208614.pdf';
const V = '2026-10-13';

export const LAWS_EVENTOS = {
  leiTransaccoesElectronicas3_2017: {
    short: 'Lei das Transacções Electrónicas',
    cite: 'da Lei das Transacções Electrónicas',
    title: 'Lei n.º 3/2017, de 9 de Janeiro — Lei das Transacções Electrónicas (inclui regras de protecção de dados pessoais)',
    url: 'https://www.vda.pt/xms/files/v1/Noticias/2017/Artigo_Guilherme_Danie_l_-_Opiniao_juridica_1o_artigo_-_Exame_Mocambique.pdf',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_EVENTOS = {
  cvPrivacidadeCandidato: {
    title: { pt: 'Vida privada do candidato a emprego', en: "Job applicant's privacy" },
    summary: {
      pt: 'O empregador não pode exigir ao candidato informação sobre a sua vida privada — vida familiar, afectiva e sexual, estado de saúde, convicções políticas e religiosas — salvo quando a natureza da actividade o exija por lei ou pelos usos da profissão e a fundamentação seja dada previamente por escrito.',
      en: 'An employer may not require an applicant to disclose private-life information — family, affective or sexual life, health, political or religious beliefs — unless the nature of the job requires it by law or professional practice and written reasons are given first.',
    },
    law: 'lei13_2023',
    article: 'arts. 7.º e 8.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  cvNaoDiscriminacao: {
    title: { pt: 'Não discriminação no acesso ao emprego', en: 'Non-discrimination in access to employment' },
    summary: {
      pt: 'O acesso ao trabalho faz-se com igualdade de oportunidades, sem discriminação em razão da cor, raça, sexo, origem étnica, lugar de nascimento, religião, posição social e opção política.',
      en: 'Access to work is on equal terms, without discrimination by colour, race, sex, ethnic origin, place of birth, religion, social position or political opinion.',
    },
    law: 'lei13_2023',
    article: 'arts. 5.º e 6.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  cvTesteHiv: {
    title: { pt: 'Proibição de testes de HIV a candidatos', en: 'Ban on HIV tests for applicants' },
    summary: {
      pt: 'É proibido realizar testes ou exames médicos ao candidato a emprego para apurar o seu estado sobre o HIV/SIDA.',
      en: 'Medical tests to find out a job applicant’s HIV status are prohibited.',
    },
    law: 'lei13_2023',
    article: 'art. 9.º, n.º 3',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  contratoTrabalhoInvalidadePrazo: {
    title: { pt: 'Prazo para invocar a invalidade do contrato de trabalho', en: 'Time limit to invoke invalidity of an employment contract' },
    summary: {
      pt: 'A invalidade do contrato de trabalho (por exemplo, por ter sido obtido com informações falsas) pode ser invocada no prazo de seis meses a contar da celebração; se o objecto for ilícito, a todo o tempo.',
      en: 'Invalidity of an employment contract (for example, obtained with false information) may be invoked within six months of signing; at any time if its object is unlawful.',
    },
    law: 'lei13_2023',
    article: 'art. 53.º, n.º 1',
    value: { meses: 6 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  protecaoDadosRegime: {
    title: { pt: 'Protecção de dados pessoais', en: 'Personal data protection' },
    summary: {
      pt: 'Moçambique ainda não tem uma lei geral de protecção de dados pessoais (a proposta estava na Assembleia da República em 2026). O tratamento electrónico de dados segue a Lei das Transacções Electrónicas e a Constituição protege a vida privada. Partilhe dados pessoais apenas com quem deles precisa.',
      en: 'Mozambique has no general data-protection law yet (a bill was before Parliament in 2026). Electronic processing follows the Electronic Transactions Law, and the Constitution protects privacy. Share personal data only with those who need it.',
    },
    law: 'leiTransaccoesElectronicas3_2017',
    sourceUrl: 'https://aimnews.org/2026/08/25/intic-alerta-para-desafios-na-proteccao-de-dados-pessoais-em-mocambique/',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirmar artigos da Lei n.º 3/2017 e o estado da proposta de lei.', en: 'Confirm the articles of Law 3/2017 and the status of the bill.' },
  },
  casamentoModalidades: {
    title: { pt: 'Modalidades de casamento', en: 'Forms of marriage' },
    summary: {
      pt: 'O casamento pode ser civil, religioso ou tradicional. O religioso e o tradicional monogâmicos têm o valor do civil quando cumprem os requisitos que a lei exige para este.',
      en: 'Marriage may be civil, religious or traditional. Monogamous religious and traditional marriages have the value of a civil marriage when they meet its legal requirements.',
    },
    law: 'leiFamilia22_2019',
    sourceUrl: FAMILIA,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Fontes indicam o art. 17; confirmar no Boletim da República.', en: 'Sources cite art. 17; confirm in the official gazette.' },
  },
  casamentoTranscricao: {
    title: { pt: 'Transcrição do casamento religioso ou tradicional', en: 'Registration of religious or traditional marriages' },
    summary: {
      pt: 'O casamento religioso e o tradicional (incluindo o lobolo) só produzem efeitos civis depois de transcritos no registo civil.',
      en: 'Religious and traditional marriages (including lobolo) have civil effects only once registered with the civil registry.',
    },
    law: 'leiFamilia22_2019',
    sourceUrl: FAMILIA,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Fontes indicam o art. 18; confirmar no Boletim da República.', en: 'Sources cite art. 18; confirm in the official gazette.' },
  },
} satisfies Record<string, LegalEntryDef>;
