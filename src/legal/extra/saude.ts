// Legal values for the "saude" documents (clinical certificates, prescriptions,
// consent forms, occupational health). Keys must not clash with other files.
//
// The Labour Law entries were checked against the full Boletim da República
// text of Lei n.º 13/2023. The health-sector laws were identified through the
// WHO health-legislation database, gazette extracts and MISAU publications;
// their article numbers could not be read in the official text, so those
// entries are marked `confirm` and carry no article number.
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-13';
const LEI_TRABALHO = 'https://faolex.fao.org/docs/pdf/moz221728.pdf';
const WHO_MOZ = 'https://extranet.who.int/cpcd/health-legislation/countries/MOZ/legislation-repository';

export const LAWS_SAUDE = {
  lei3_2006: {
    short: 'Estatuto da Ordem dos Médicos',
    cite: 'do Estatuto da Ordem dos Médicos de Moçambique',
    title: 'Lei n.º 3/2006, de 3 de Maio — cria a Ordem dos Médicos de Moçambique e aprova o seu Estatuto (BR I Série n.º 18)',
    url: 'https://archive.gazettes.africa/archive/mz/2006/mz-government-gazette-series-i-dated-2006-05-03-no-18.pdf',
  },
  lei2_2016: {
    short: 'Estatuto da Ordem dos Enfermeiros',
    cite: 'do Estatuto da Ordem dos Enfermeiros de Moçambique',
    title: 'Lei n.º 2/2016 — cria a Ordem dos Enfermeiros de Moçambique e aprova o respectivo Estatuto',
    url: 'https://extranet.who.int/cpcd/health-legislation/lei-no-22016-cria-ordem-dos-enfermeiros-de-mocambique-e-aprova-o-respectivo',
  },
  lei12_2017: {
    short: 'Lei do Medicamento',
    cite: 'da Lei do Medicamento',
    title: 'Lei n.º 12/2017, de 8 de Setembro — Lei do Medicamento, Vacinas e outros Produtos Biológicos para Uso Humano (cria a ANARME); Regulamento do Exercício da Actividade Farmacêutica aprovado pelo Decreto n.º 16/2023',
    url: 'https://extranet.who.int/cpcd/health-legislation/lei-no-122017-lei-de-medicamento-vacinas-e-outros-produtos-biologicos-para-o-uso',
  },
  lei3_1997: {
    short: 'Lei n.º 3/97',
    cite: 'da Lei n.º 3/97',
    title: 'Lei n.º 3/97 — regime jurídico do tráfico e consumo de estupefacientes, substâncias psicotrópicas, precursores e preparados',
  },
  lei19_2014: {
    short: 'Lei n.º 19/2014',
    cite: 'da Lei n.º 19/2014',
    title: 'Lei n.º 19/2014 — Lei de Protecção da Pessoa, do Trabalhador e do Candidato a Emprego vivendo com HIV e SIDA',
    url: 'https://policyvault.africa/policy/lei-n-o-19-2014-lei-de-proteccao-da-pessoa-do-trabalhador-e-do-candidato-a-emprego-vivendo-com-hiv-e-sida-in-portuguese',
  },
  decreto9_1992: {
    short: 'Decreto n.º 9/92',
    cite: 'do Decreto n.º 9/92',
    title: 'Decreto n.º 9/92, de 26 de Maio — regula a prestação de cuidados de saúde por entidades privadas',
    url: WHO_MOZ,
  },
  cartaUtentesSaude: {
    short: 'Carta dos Direitos e Deveres dos Utentes',
    cite: 'da Carta dos Direitos e Deveres dos Utentes dos Serviços de Saúde',
    title: 'Carta dos Direitos e Deveres dos Utentes dos Serviços de Saúde (Ministério da Saúde)',
    url: 'https://namati.org/wp-content/uploads/2023/09/brochura-Carta-dos-Direitos-e-Deveres-dos-Utentes_Namati-MISAU_Julho-2020_digital-VF.pdf',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_SAUDE = {
  // ------------------------------------------------------------- Labour Law (verified)
  examesMedicosTrabalho: {
    title: { pt: 'Testes e exames médicos do trabalhador', en: 'Medical tests and examinations of workers' },
    summary: {
      pt: 'O empregador pode exigir ao candidato ou ao trabalhador exame médico que comprove a sua condição física ou psíquica (n.º 1). O médico só pode comunicar ao empregador a capacidade ou falta de capacidade para o trabalho (n.º 2). É proibido realizar testes para apurar o estado de HIV/SIDA do candidato ou do trabalhador (n.º 3).',
      en: 'The employer may require a candidate or worker to undergo a medical examination proving physical or mental condition (no. 1). The doctor may tell the employer only whether the person is fit or unfit for work (no. 2). Testing candidates or workers for HIV/AIDS is prohibited (no. 3).',
    },
    law: 'lei13_2023',
    article: 'art. 9.º',
    sourceUrl: LEI_TRABALHO,
    lastVerified: V,
    confidence: 'verified',
  },
  dadosPessoaisTrabalhador: {
    title: { pt: 'Protecção de dados pessoais do trabalhador', en: 'Protection of workers’ personal data' },
    summary: {
      pt: 'Os dados pessoais do trabalhador obtidos pelo empregador sob reserva de confidencialidade não podem ser fornecidos a terceiros sem o seu consentimento expresso, salvo se razões legais o determinarem.',
      en: 'Personal data obtained by the employer in confidence may not be given to third parties without the worker’s express consent, unless the law requires it.',
    },
    law: 'lei13_2023',
    article: 'art. 8.º',
    sourceUrl: LEI_TRABALHO,
    lastVerified: V,
    confidence: 'verified',
  },
  dispensaGravidezPrescricao: {
    title: { pt: 'Dispensa da trabalhadora grávida por prescrição médica', en: 'Pregnancy leave on medical prescription' },
    summary: {
      pt: 'Por prescrição médica, pelo tempo necessário para prevenir risco clínico, a trabalhadora grávida tem direito a dispensa, sem prejuízo da licença por maternidade.',
      en: 'On medical prescription, for as long as needed to prevent clinical risk, a pregnant worker is entitled to time off, in addition to maternity leave.',
    },
    law: 'lei13_2023',
    article: 'art. 14.º, n.º 4',
    sourceUrl: LEI_TRABALHO,
    lastVerified: V,
    confidence: 'verified',
  },
  doencaNasFerias: {
    title: { pt: 'Doença durante as férias', en: 'Illness during annual leave' },
    summary: {
      pt: 'Os dias de doença não contam como férias quando a doença, certificada por entidade competente, se declarou durante as férias e o empregador foi informado no prazo de 10 dias de calendário. Após a alta, o trabalhador retoma o gozo das férias em falta.',
      en: 'Sick days do not count as leave if the illness, certified by a competent entity, began during leave and the employer was told within 10 calendar days. After recovery the worker resumes the remaining leave.',
    },
    law: 'lei13_2023',
    article: 'art. 111.º',
    value: { avisoDias: 10 },
    sourceUrl: LEI_TRABALHO,
    lastVerified: V,
    confidence: 'verified',
  },
  faltasPorDoenca: {
    title: { pt: 'Faltas por doença, acidente e assistência à família', en: 'Absence for illness, accident and family care' },
    summary: {
      pt: 'São justificadas as faltas por doença ou acidente do trabalhador, as dos pais que acompanham filhos ou menores a seu cargo internados em hospital, e as dadas para assistir cônjuge, companheiro, filhos, pais, enteados, irmãos, avós, padrasto, madrasta, sogros, genros e noras em caso de doença ou acidente.',
      en: 'Absences are justified for the worker’s own illness or accident, for parents accompanying children or minors in their care admitted to hospital, and for assisting a spouse, partner, children, parents, stepchildren, siblings, grandparents, step-parents or in-laws who are ill or injured.',
    },
    law: 'lei13_2023',
    article: 'art. 112.º, n.º 3',
    sourceUrl: LEI_TRABALHO,
    lastVerified: V,
    confidence: 'verified',
  },
  juntaDeSaude: {
    title: { pt: 'Apresentação à Junta de Saúde', en: 'Referral to the Medical Board' },
    summary: {
      pt: 'Com faltas por doença por mais de 15 dias seguidos, ou mais de 5 dias de faltas por doença num trimestre, o empregador pode submeter o trabalhador à Junta de Saúde ou a outra entidade licenciada, que se pronuncia sobre a capacidade para o trabalho. A recusa injustificada é infracção disciplinar.',
      en: 'After more than 15 consecutive days of sick absence, or more than 5 days of sick absence in a quarter, the employer may refer the worker to the Medical Board or another licensed entity to assess fitness for work. An unjustified refusal is a disciplinary offence.',
    },
    law: 'lei13_2023',
    article: 'art. 113.º',
    value: { diasSeguidos: 15, diasPorTrimestre: 5 },
    sourceUrl: LEI_TRABALHO,
    lastVerified: V,
    confidence: 'verified',
  },
  faltasDoencaRemuneracao: {
    title: { pt: 'Remuneração das faltas por doença', en: 'Pay during sick absence' },
    summary: {
      pt: 'O empregador pode não remunerar as faltas por doença ou acidente e as de acompanhamento de filho internado, sem prejuízo das garantias da segurança social. As faltas de acompanhamento de filho internado não são descontadas nas férias.',
      en: 'The employer may choose not to pay absences for illness or accident or for accompanying a hospitalised child, without prejudice to social security benefits. Absences to accompany a hospitalised child are not deducted from leave.',
    },
    law: 'lei13_2023',
    article: 'art. 114.º',
    sourceUrl: LEI_TRABALHO,
    lastVerified: V,
    confidence: 'verified',
  },
  motivoFaltaFalso: {
    title: { pt: 'Justificação falsa de faltas', en: 'False justification of absence' },
    summary: {
      pt: 'A alegação de um motivo justificativo comprovadamente falso pode ser objecto de procedimento disciplinar.',
      en: 'Giving a justification that is proven false may lead to disciplinary proceedings.',
    },
    law: 'lei13_2023',
    article: 'art. 115.º, n.º 2',
    sourceUrl: LEI_TRABALHO,
    lastVerified: V,
    confidence: 'verified',
  },
  saudeNoTrabalho: {
    title: { pt: 'Assistência médica e exames no local de trabalho', en: 'Workplace medical care and examinations' },
    summary: {
      pt: 'Os grandes empregadores, e os que têm actividades de risco excepcional, asseguram, directamente ou por terceiro contratado, um serviço de primeiros socorros (art. 223.º). Vários empregadores podem manter em conjunto uma unidade sanitária privativa (art. 224.º). Os médicos dessas unidades fazem exames regulares para verificar a robustez para o serviço, doenças infectocontagiosas que ponham em perigo os colegas e doença mental que desaconselhe o serviço; as regras e registos dos exames são definidos por diploma dos Ministros do Trabalho e da Saúde (art. 225.º).',
      en: 'Large employers, and those with exceptionally risky activities, provide a first-aid service directly or through a contractor (art. 223). Several employers may jointly run a private health unit (art. 224). Its doctors carry out regular examinations to check fitness for the work, infectious diseases that endanger co-workers and mental illness that makes the work inadvisable; the rules and records are set by a joint diploma of the Labour and Health Ministers (art. 225).',
    },
    law: 'lei13_2023',
    article: 'arts. 223.º a 225.º',
    sourceUrl: LEI_TRABALHO,
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------- Health-sector rules (confirm)
  inscricaoOrdemMedicos: {
    title: { pt: 'Inscrição obrigatória na Ordem dos Médicos', en: 'Mandatory registration with the Medical Council' },
    summary: {
      pt: 'A inscrição e o reconhecimento pela Ordem dos Médicos de Moçambique são condições obrigatórias para o exercício da actividade médica em Moçambique. A Ordem representa os licenciados em Medicina e em Medicina Dentária. Os médicos formados no estrangeiro inscrevem-se após reconhecimento do grau, segundo critérios de reciprocidade e necessidade.',
      en: 'Registration with and recognition by the Medical Council of Mozambique are mandatory to practise medicine. The Council represents graduates in medicine and dentistry. Doctors trained abroad register after recognition of their degree, on grounds of reciprocity and need.',
    },
    law: 'lei3_2006',
    sourceUrl: 'https://archive.gazettes.africa/archive/mz/2006/mz-government-gazette-series-i-dated-2006-05-03-no-18.pdf',
    lastVerified: V,
    confidence: 'confirm',
  },
  inscricaoOrdemEnfermeiros: {
    title: { pt: 'Inscrição obrigatória na Ordem dos Enfermeiros', en: 'Mandatory registration with the Nursing Council' },
    summary: {
      pt: 'A inscrição e o reconhecimento pela Ordem dos Enfermeiros de Moçambique são condições obrigatórias para o exercício da enfermagem; o enfermeiro deve ter carteira profissional.',
      en: 'Registration with and recognition by the Nursing Council of Mozambique are mandatory to practise nursing; nurses must hold a professional card.',
    },
    law: 'lei2_2016',
    lastVerified: V,
    confidence: 'confirm',
  },
  consentimentoInformadoUtente: {
    title: { pt: 'Consentimento informado', en: 'Informed consent' },
    summary: {
      pt: 'O utente tem direito a dar ou recusar o seu consentimento explícito antes de qualquer acto médico invasivo ou de participação em investigação ou ensaio clínico. As unidades sanitárias devem possuir formulários para registo do consentimento informado. O utente tem direito a ser informado, em linguagem compreensível, do diagnóstico, prognóstico, tratamento e riscos.',
      en: 'Patients may give or refuse explicit consent before any invasive medical act or participation in research or a clinical trial. Health facilities must have forms to record informed consent. Patients have the right to be told, in plain language, the diagnosis, prognosis, treatment and risks.',
    },
    law: 'cartaUtentesSaude',
    lastVerified: V,
    confidence: 'confirm',
  },
  sigiloMedico: {
    title: { pt: 'Sigilo médico e confidencialidade', en: 'Medical confidentiality' },
    summary: {
      pt: 'Toda a informação clínica do utente é confidencial e o utente tem direito à privacidade na prestação de cuidados. A informação só é revelada a terceiros com o consentimento do utente ou quando a lei o impuser.',
      en: 'All clinical information is confidential and patients are entitled to privacy. It is disclosed to third parties only with the patient’s consent or when the law requires it.',
    },
    law: 'cartaUtentesSaude',
    lastVerified: V,
    confidence: 'confirm',
  },
  hivConfidencialidade: {
    title: { pt: 'Confidencialidade do estado serológico (HIV)', en: 'Confidentiality of HIV status' },
    summary: {
      pt: 'O estado serológico de HIV é confidencial; o teste depende de aconselhamento e consentimento, e o resultado é entregue individualmente. Os profissionais de saúde estão sujeitos a sigilo profissional. Nunca indique o estado de HIV em documentos destinados a terceiros.',
      en: 'HIV status is confidential; testing requires counselling and consent, and results are given individually. Health workers are bound by professional secrecy. Never state HIV status on documents for third parties.',
    },
    law: 'lei19_2014',
    lastVerified: V,
    confidence: 'confirm',
  },
  receitaMedicaRegime: {
    title: { pt: 'Receita médica', en: 'Medical prescription' },
    summary: {
      pt: 'A prescrição e a dispensa de medicamentos são reguladas pela Lei do Medicamento e pelo Regulamento do Exercício da Actividade Farmacêutica, sob a supervisão da ANARME. A prática do Serviço Nacional de Saúde é prescrever pela denominação comum internacional (DCI) e, no SNS, seguir a Lista Nacional de Medicamentos Essenciais. O conteúdo obrigatório e o prazo de validade da receita não foram confirmados.',
      en: 'Prescribing and dispensing are governed by the Medicines Law and the Pharmaceutical Activity Regulation, supervised by ANARME. Public-sector practice is to prescribe by international non-proprietary name (INN) and, in the public service, to follow the National Essential Medicines List. The mandatory content and validity of a prescription were not confirmed.',
    },
    law: 'lei12_2017',
    lastVerified: V,
    confidence: 'confirm',
  },
  estupefacientesPrescricao: {
    title: { pt: 'Estupefacientes e psicotrópicos', en: 'Narcotics and psychotropics' },
    summary: {
      pt: 'A prescrição de medicamentos estupefacientes e psicotrópicos segue o regime próprio de controlo e impressos oficiais; não pode ser feita em receita comum.',
      en: 'Prescribing narcotic and psychotropic medicines follows a separate control regime with official forms; it may not be done on an ordinary prescription.',
    },
    law: 'lei3_1997',
    lastVerified: V,
    confidence: 'confirm',
  },
  unidadesSanitariasPrivadas: {
    title: { pt: 'Licenciamento de unidades sanitárias privadas', en: 'Licensing of private health facilities' },
    summary: {
      pt: 'A prestação de cuidados de saúde por entidades privadas (clínicas, consultórios, laboratórios) depende de licença do Ministério da Saúde. Indique o número da licença no papel timbrado.',
      en: 'Private health care (clinics, practices, laboratories) requires a licence from the Ministry of Health. Show the licence number on the letterhead.',
    },
    law: 'decreto9_1992',
    lastVerified: V,
    confidence: 'confirm',
  },
  servicosSaudeIva: {
    title: { pt: 'IVA nos serviços de saúde', en: 'VAT on health services' },
    summary: {
      pt: 'As prestações de serviços médicos e sanitários estão, em regra, isentas de IVA. Confirme a isenção aplicável ao seu caso antes de emitir o orçamento sem IVA.',
      en: 'Medical and health services are generally exempt from VAT. Confirm the exemption that applies before issuing a quote without VAT.',
    },
    law: 'civa',
    lastVerified: V,
    confidence: 'confirm',
  },
  atestadoFalso: {
    title: { pt: 'Atestado falso', en: 'False medical certificate' },
    summary: {
      pt: 'A emissão de atestado médico falso ou de complacência e a violação do segredo profissional são puníveis pela lei penal e disciplinar.',
      en: 'Issuing a false or courtesy medical certificate and breaching professional secrecy are punishable under criminal and disciplinary law.',
    },
    law: 'codigoPenal2019',
    lastVerified: V,
    confidence: 'confirm',
  },
} satisfies Record<string, LegalEntryDef>;
