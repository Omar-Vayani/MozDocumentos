// Legal values for the "comunidade" documents (community authorities, bairro
// structures and local administration). Keys must not clash with other files.
//
// Sources were read through extracts of the Boletim da República (FAOLEX,
// Lexlink, gazettes.africa), academic studies and Mozambican newspapers. The
// full official texts could not be opened, so entries whose article number or
// wording was not read in the gazette are marked `confirm` and carry no article.
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-13';
const FAOLEX_DM158 = 'https://faolex.fao.org/docs/pdf/moz104298.pdf';
const OPAIS_BAIRRO = 'https://opais.co.mz/nao-e-obrigatorio-pagar-ao-chefe-de-quarteirao-nem-a-secretaria-do-bairro-para-ter-declaracao/';

export const LAWS_COMUNIDADE = {
  decreto15_2000: {
    short: 'Decreto n.º 15/2000',
    cite: 'do Decreto n.º 15/2000, de 20 de Junho',
    title: 'Decreto n.º 15/2000, de 20 de Junho — formas de articulação dos órgãos locais do Estado com as autoridades comunitárias (regulamentado pelo Diploma Ministerial n.º 107-A/2000, de 25 de Agosto)',
    url: 'https://www.wlsa.org.mz/wp-content/uploads/2014/11/Genero-e-poder-local.pdf',
  },
  lei12_2023Autarquias: {
    short: 'Lei n.º 12/2023',
    cite: 'da Lei n.º 12/2023, de 25 de Agosto',
    title: 'Lei n.º 12/2023, de 25 de Agosto — Lei de bases da criação, organização e funcionamento das autarquias locais (revoga a Lei n.º 6/2018); regulamentada por decreto publicado no BR I Série n.º 66, de 3 de Abril de 2024',
    url: 'https://cmnampula.gov.mz/wp-content/uploads/2024/11/Lei-12.2023-Nova-lei-de-Criacao-dos-Municipios.pdf',
  },
  lei4_92TribunaisComunitarios: {
    short: 'Lei n.º 4/92',
    cite: 'da Lei n.º 4/92, de 6 de Maio',
    title: 'Lei n.º 4/92, de 6 de Maio — cria os tribunais comunitários (BR I Série n.º 19, Suplemento)',
    url: 'https://archive.gazettes.africa/archive/mz/1992/mz-government-gazette-series-i-supplement-dated-1992-05-06-no-19.pdf',
  },
  regulamentoLeiTerras: {
    short: 'Regulamento da Lei de Terras',
    cite: 'do Regulamento da Lei de Terras (Decreto n.º 66/98, de 8 de Dezembro)',
    title: 'Regulamento da Lei de Terras, aprovado pelo Decreto n.º 66/98, de 8 de Dezembro, alterado pelo Decreto n.º 43/2010',
    url: 'https://faolex.fao.org/docs/pdf/moz112049.pdf',
  },
  dm158_2011ConsultaComunidades: {
    short: 'Diploma Ministerial n.º 158/2011',
    cite: 'do Diploma Ministerial n.º 158/2011, de 15 de Junho',
    title: 'Diploma Ministerial n.º 158/2011, de 15 de Junho — procedimentos para a consulta às comunidades locais no âmbito da titulação do direito de uso e aproveitamento da terra (BR I Série n.º 24)',
    url: FAOLEX_DM158,
  },
  codigoRegistoCivil: {
    short: 'Código do Registo Civil',
    cite: 'do Código do Registo Civil',
    title: 'Código do Registo Civil, aprovado pela Lei n.º 12/2004, de 8 de Dezembro (BR I Série n.º 49, Suplemento)',
    url: 'https://archive.gazettes.africa/archive/mz/2004/mz-government-gazette-series-i-supplement-dated-2004-12-08-no-49.pdf',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_COMUNIDADE = {
  autoridadesComunitarias: {
    title: { pt: 'Autoridades comunitárias', en: 'Community authorities' },
    summary: {
      pt: 'São autoridades comunitárias os chefes tradicionais, os secretários de bairro ou aldeia e outros líderes legitimados como tais pelas respectivas comunidades locais. Colaboram com os órgãos locais do Estado, mas não são órgãos do Estado.',
      en: 'Community authorities are traditional chiefs, neighbourhood or village secretaries and other leaders recognised by their communities. They work with local State bodies but are not State bodies.',
    },
    law: 'decreto15_2000',
    sourceUrl: 'https://www.files.ethz.ch/isn/96053/28.pdf',
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'As três categorias constam de várias fontes académicas; o número do artigo e a lista de tarefas do regulamento (Diploma Ministerial n.º 107-A/2000) estão por confirmar.',
      en: 'The three categories appear in several academic sources; the article number and the list of tasks in the regulation are to be confirmed.',
    },
  },
  estruturaBairroMunicipal: {
    title: { pt: 'Bairros e quarteirões municipais', en: 'Municipal neighbourhoods and blocks' },
    summary: {
      pt: 'O território municipal organiza-se em postos administrativos municipais, bairros e quarteirões (na capital, também distritos municipais). O bairro é dirigido por um chefe nomeado pelo Presidente do Conselho Municipal; o quarteirão é o menor núcleo administrativo do bairro.',
      en: 'Municipal territory is divided into municipal administrative posts, neighbourhoods and blocks (plus municipal districts in the capital). The neighbourhood is led by a chief appointed by the mayor; the block is its smallest unit.',
    },
    law: 'lei12_2023Autarquias',
    sourceUrl: 'https://faolex.fao.org/docs/pdf/moz225319.pdf',
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'O número do decreto regulamentar publicado em 3 de Abril de 2024 e os artigos estão por confirmar.',
      en: 'The number of the implementing decree published on 3 April 2024 and the articles are to be confirmed.',
    },
  },
  declaracaoComunitariaValor: {
    title: { pt: 'Valor das declarações do bairro', en: 'Legal value of neighbourhood declarations' },
    summary: {
      pt: 'A declaração de uma autoridade comunitária é um meio de prova: a entidade que a recebe aprecia-a livremente. Não substitui atestados, certidões, o DUAT, o registo civil nem o registo criminal, que são emitidos pelas entidades públicas competentes.',
      en: 'A community authority declaration is evidence that the receiving body weighs freely. It does not replace certificates, the DUAT, civil registration or the criminal record, which are issued by the competent public bodies.',
    },
    law: 'decreto15_2000',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Prática administrativa; não foi encontrado diploma que regule estas declarações.', en: 'Administrative practice; no instrument regulating these declarations was found.' },
  },
  declaracaoBairroTaxa: {
    title: { pt: 'Cobrança pela declaração do bairro', en: 'Fees for neighbourhood declarations' },
    summary: {
      pt: 'Não há base legal para cobrar a declaração do bairro, salvo taxa fixada por postura municipal. O Ministério da Administração Estatal considera ilegais estas cobranças.',
      en: 'There is no legal basis to charge for a neighbourhood declaration unless a municipal by-law sets a fee. The Ministry of State Administration considers such charges unlawful.',
    },
    law: 'decreto15_2000',
    sourceUrl: OPAIS_BAIRRO,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Fontes jornalísticas (O País, Evidências).', en: 'Newspaper sources (O País, Evidências).' },
  },
  validadeDeclaracaoBairro: {
    title: { pt: 'Validade da declaração do bairro', en: 'Validity of a neighbourhood declaration' },
    summary: {
      pt: 'A lei não fixa a validade. Na prática, bancos e serviços pedem declarações recentes, normalmente emitidas há menos de três meses.',
      en: 'The law sets no validity period. In practice banks and offices ask for recent declarations, usually under three months old.',
    },
    law: 'decreto15_2000',
    value: { dias: 90, opcoes: [30, 60, 90] },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Prática; ajuste ao que a entidade de destino exige.', en: 'Practice; adjust to what the receiving body requires.' },
  },
  residenciaTempoMinimo: {
    title: { pt: 'Tempo mínimo de residência (atestado municipal)', en: 'Minimum residence (municipal certificate)' },
    summary: {
      pt: 'Alguns municípios pedem, para o atestado de residência, declaração do bairro e duas testemunhas que confirmem residência há mais de seis meses, além do comprovativo do Imposto Pessoal Autárquico.',
      en: 'Some municipalities ask, for the residence certificate, for the neighbourhood declaration and two witnesses confirming residence for over six months, plus proof of the municipal personal tax.',
    },
    law: 'lei12_2023Autarquias',
    value: { meses: 6, testemunhas: 2 },
    sourceUrl: 'https://municipiodecuamba.gov.mz/wp-content/uploads/2024/08/PEDIDO-DE-ATESTADO-DE-RESIDENCIA-Cuamba.pdf',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Modelo do Município de Cuamba (2024); os requisitos variam por município.', en: 'Cuamba municipality form (2024); requirements vary by municipality.' },
  },
  tribunaisComunitarios: {
    title: { pt: 'Tribunais comunitários', en: 'Community courts' },
    summary: {
      pt: 'Os tribunais comunitários procuram primeiro a reconciliação das partes; não sendo possível, decidem segundo a equidade, o bom senso e a justiça. Conhecem pequenos conflitos de natureza civil e questões de famílias constituídas segundo os usos e costumes.',
      en: 'Community courts first try to reconcile the parties; failing that, they decide by equity, good sense and justice. They hear small civil disputes and family matters of customary unions.',
    },
    law: 'lei4_92TribunaisComunitarios',
    article: 'arts. 2.º e 3.º',
    sourceUrl: 'https://archive.gazettes.africa/archive/mz/1992/mz-government-gazette-series-i-supplement-dated-1992-05-06-no-19.pdf',
    lastVerified: V,
    confidence: 'verified',
  },
  mediacaoComunitaria: {
    title: { pt: 'Mediação pela estrutura do bairro', en: 'Mediation by neighbourhood structures' },
    summary: {
      pt: 'O secretário do bairro ou o líder comunitário pode mediar, mas não decidir. O acordo vale como transacção entre as partes que o assinam. Crimes públicos, violência doméstica, guarda e alimentos de menores e a titulação de terra não podem ser resolvidos por acordo no bairro.',
      en: 'A neighbourhood secretary or community leader may mediate but not decide. The agreement binds the signing parties as a settlement. Public crimes, domestic violence, child custody and maintenance, and land titling cannot be settled in the neighbourhood.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Prática; ver também a transacção no Código Civil e a Lei n.º 4/92.', en: 'Practice; see also settlement in the Civil Code and Law 4/92.' },
  },
  duatOcupacaoBoaFe: {
    title: { pt: 'DUAT por ocupação de boa-fé', en: 'Land use right by good-faith occupation' },
    summary: {
      pt: 'As pessoas singulares nacionais que, de boa-fé, utilizem a terra há pelo menos dez anos adquirem o direito de uso e aproveitamento da terra, salvo em zonas de protecção ou reservadas. A falta de registo não prejudica este direito.',
      en: 'Mozambican individuals who have used land in good faith for at least ten years acquire the land use right, except in protected or reserved zones. Lack of registration does not affect the right.',
    },
    law: 'regulamentoLeiTerras',
    article: 'art. 10.º',
    value: { anos: 10 },
    sourceUrl: 'https://a-mla.org/en/country/pdf/365',
    lastVerified: V,
    confidence: 'verified',
  },
  duatProvaTestemunhal: {
    title: { pt: 'Prova do DUAT por testemunhas', en: 'Proof of land rights by witnesses' },
    summary: {
      pt: 'O direito de uso e aproveitamento da terra pode ser provado pelo título, por prova testemunhal de membros, homens e mulheres, das comunidades locais, ou por peritagem e outros meios permitidos por lei. A declaração da comunidade não confere o DUAT: a titulação compete às entidades estatais.',
      en: 'The land use right may be proved by the title, by testimony of community members, men and women, or by expert evidence and other lawful means. A community declaration does not grant the right: titling belongs to the State.',
    },
    law: 'leiTerras1997',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Fontes indicam o art. 15 da Lei de Terras; confirme.', en: 'Sources cite art. 15 of the Land Law; confirm.' },
  },
  consultaComunitariaDuat: {
    title: { pt: 'Consulta às comunidades (DUAT)', en: 'Community consultation (land titling)' },
    summary: {
      pt: 'A consulta para a titulação do DUAT tem duas fases: reunião pública de informação e delimitação e, até trinta dias depois, pronúncia da comunidade. A acta é assinada pelos membros dos Conselhos Consultivos de Povoação e de Localidade. A consulta que não siga este procedimento não é válida.',
      en: 'Consultation for land titling has two phases: a public information and boundary meeting and, within thirty days, the community’s opinion. The minutes are signed by members of the village and locality advisory councils. A consultation outside this procedure is invalid.',
    },
    law: 'dm158_2011ConsultaComunidades',
    value: { prazoSegundaFaseDias: 30 },
    sourceUrl: FAOLEX_DM158,
    lastVerified: V,
    confidence: 'verified',
  },
  registoObito: {
    title: { pt: 'Registo de óbito', en: 'Death registration' },
    summary: {
      pt: 'O óbito é registado na Conservatória do Registo Civil, com base no certificado médico ou no meio que a lei admite em sua falta. A declaração do bairro serve apenas de meio de prova complementar.',
      en: 'Deaths are registered at the Civil Registry on the basis of the medical certificate or the substitute the law allows. A neighbourhood declaration is supporting evidence only.',
    },
    law: 'codigoRegistoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Artigos e prazo de declaração do óbito por confirmar.', en: 'Articles and the deadline to declare a death are to be confirmed.' },
  },
  registoCriminalCertificado: {
    title: { pt: 'Certificado de registo criminal', en: 'Criminal record certificate' },
    summary: {
      pt: 'A prova oficial de antecedentes criminais é o certificado de registo criminal, emitido pelos serviços competentes do Estado. Uma declaração de boa conduta do bairro não o substitui.',
      en: 'The official proof of criminal history is the criminal record certificate issued by the State. A neighbourhood good-conduct declaration does not replace it.',
    },
    law: 'decreto15_2000',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Entidade emissora e diploma por confirmar.', en: 'Issuing body and instrument to be confirmed.' },
  },
  carenciaEconomica: {
    title: { pt: 'Declaração de carência económica', en: 'Financial hardship declaration' },
    summary: {
      pt: 'Pedida na prática para isenção de taxas hospitalares e escolares, assistência jurídica (IPAJ), isenção de custas judiciais e apoio da acção social. A entidade de destino define se aceita a declaração do bairro ou exige confirmação do Posto Administrativo, da Localidade ou dos serviços distritais.',
      en: 'Used in practice for exemption from hospital and school fees, legal aid, court-fee exemption and social support. The receiving body decides whether it accepts the neighbourhood declaration or requires confirmation by the local administration.',
    },
    law: 'decreto15_2000',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Não foi encontrado diploma que indique a entidade emissora.', en: 'No instrument naming the issuing body was found.' },
  },
  dadosPessoaisComunidade: {
    title: { pt: 'Dados pessoais nas listas do bairro', en: 'Personal data in neighbourhood lists' },
    summary: {
      pt: 'A Constituição protege a vida privada e os dados pessoais. Recolha só os dados necessários, com o consentimento das pessoas para dados de saúde ou deficiência, e não partilhe as listas fora das estruturas autorizadas.',
      en: 'The Constitution protects privacy and personal data. Collect only what is needed, with consent for health or disability data, and do not share lists outside authorised structures.',
    },
    law: 'constituicaoRepublica',
    lastVerified: V,
    confidence: 'confirm',
  },
} satisfies Record<string, LegalEntryDef>;
