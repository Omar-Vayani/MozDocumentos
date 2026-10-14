// Legal values for the "saude-educacao" documents (second wave of health,
// veterinary, pharmacy, psychology, education and religious documents).
// Keys are prefixed `se` so they never clash with other files.
//
// The Labour Law and Civil Code values these documents need already exist in
// mz-legal.ts (licencaMaternidade, protecaoMaternidade, codigoCivilPrestacaoServicos,
// presuncaoContratoTrabalho) and are reused. The sector rules below could only be
// identified through secondary sources (WIPO Lex, WOAH/DNSV reports, press notes
// on the private-education decree), so they are `confirm` and carry no article.
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-14';

export const LAWS_SAUDE_EDUCACAO = {
  seLei9_2022: {
    short: 'Lei dos Direitos de Autor e Direitos Conexos',
    cite: 'da Lei dos Direitos de Autor e Direitos Conexos',
    title: 'Lei n.º 9/2022, de 29 de Junho — Lei dos Direitos de Autor e Direitos Conexos (revoga a Lei n.º 4/2001); regulamentada pelo Decreto n.º 46/2024',
    url: 'https://www.wipo.int/wipolex/en/legislation/details/21426',
  },
  seDec26_2009: {
    short: 'Regulamento de Sanidade Animal',
    cite: 'do Regulamento de Sanidade Animal',
    title: 'Decreto n.º 26/2009, de 17 de Agosto — aprova o Regulamento de Sanidade Animal (BR I Série n.º 32, 3.º Suplemento)',
    url: 'https://ampeid.org/documents/mozambique/decree-no-26-2009-approving-the-regulation-on-animal-health/',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_SAUDE_EDUCACAO = {
  // ------------------------------------------------------------- Health
  seAcessoProcessoClinico: {
    title: { pt: 'Acesso do doente ao seu processo clínico', en: 'Patient access to their clinical file' },
    summary: {
      pt: 'O utente tem direito a ser informado sobre o seu estado de saúde e a aceder à informação do seu processo clínico, podendo pedir relatório ou cópia. O processo pertence à unidade sanitária, que o guarda sob sigilo; terceiros só têm acesso com autorização escrita do doente ou por imposição legal.',
      en: 'Patients are entitled to information about their health and to access their clinical file, and may ask for a report or a copy. The facility keeps the file in confidence; third parties have access only with the patient’s written authorisation or where the law requires it.',
    },
    law: 'cartaUtentesSaude',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Prazo de resposta e eventual custo da cópia não confirmados.', en: 'Response time and any copying fee not confirmed.' },
  },
  seTeleconsulta: {
    title: { pt: 'Teleconsulta', en: 'Teleconsultation' },
    summary: {
      pt: 'Não foi encontrada regra moçambicana específica sobre telemedicina. Aplicam-se as regras gerais: consentimento informado e confidencialidade (Carta dos Direitos e Deveres dos Utentes), inscrição do médico na Ordem e as regras sobre comunicações e dados electrónicos da Lei das Transacções Electrónicas. A teleconsulta não substitui o exame presencial quando este for necessário.',
      en: 'No specific Mozambican telemedicine rule was found. General rules apply: informed consent and confidentiality (Patients’ Charter), the doctor’s registration with the Medical Council and the Electronic Transactions Law on electronic communications and data. A teleconsultation does not replace an in-person examination when one is needed.',
    },
    law: 'leiTransaccoesElectronicas3_2017',
    lastVerified: V,
    confidence: 'confirm',
  },
  seAquisicaoMedicamentos: {
    title: { pt: 'Aquisição de medicamentos por farmácias e unidades sanitárias', en: 'Purchase of medicines by pharmacies and facilities' },
    summary: {
      pt: 'As farmácias e unidades sanitárias só adquirem medicamentos registados na ANARME a importadores e distribuidores licenciados, sob a responsabilidade do director técnico. Estupefacientes e psicotrópicos seguem impressos e registos próprios.',
      en: 'Pharmacies and facilities buy only medicines registered with ANARME from licensed importers and distributors, under the technical director’s responsibility. Narcotics and psychotropics follow their own forms and registers.',
    },
    law: 'lei12_2017',
    lastVerified: V,
    confidence: 'confirm',
  },
  seSanidadeAnimal: {
    title: { pt: 'Sanidade animal e certificados veterinários', en: 'Animal health and veterinary certificates' },
    summary: {
      pt: 'A sanidade animal é regulada pelo Regulamento de Sanidade Animal, sob a autoridade dos Serviços Veterinários. Os certificados sanitários para trânsito, importação e exportação de animais são emitidos pelos serviços veterinários oficiais; o atestado de um médico veterinário privado serve para fins particulares (alojamento, viagem interna, arrendamento, seguro) e para instruir o pedido oficial.',
      en: 'Animal health is governed by the Animal Health Regulation, under the Veterinary Services. Health certificates for moving, importing and exporting animals are issued by the official veterinary services; a private vet’s certificate serves private purposes (boarding, domestic travel, tenancy, insurance) and supports the official application.',
    },
    law: 'seDec26_2009',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirmar as normas sobre vacinação anti-rábica e o registo na Ordem dos Médicos Veterinários de Moçambique.', en: 'Confirm the rules on rabies vaccination and registration with the veterinary order.' },
  },

  // ------------------------------------------------------------- Education
  seRegulamentoInternoEscola: {
    title: { pt: 'Regulamento interno da escola', en: 'School internal rules' },
    summary: {
      pt: 'Cada escola tem um regulamento interno que define a organização, os direitos e deveres dos alunos, professores e encarregados, e o regime disciplinar. Nas escolas do ensino básico o Conselho de Escola, com representantes da direcção, professores, pais e comunidade, aprova e acompanha as regras da escola. As medidas disciplinares são graduadas e precedidas da audição do aluno e do encarregado; os castigos corporais são proibidos.',
      en: 'Each school has internal rules setting its organisation, the rights and duties of pupils, teachers and parents, and the disciplinary regime. In basic education the School Council, with management, teachers, parents and community, approves and follows the rules. Disciplinary measures are graduated and preceded by hearing the pupil and parent; corporal punishment is prohibited.',
    },
    law: 'eduRegeb46_2008',
    lastVerified: V,
    confidence: 'confirm',
  },
  seDireitosCrianca: {
    title: { pt: 'Direitos da criança na escola', en: 'Children’s rights at school' },
    summary: {
      pt: 'Em todas as decisões sobre a criança prevalece o seu superior interesse. A criança tem direito à educação, à protecção contra toda a forma de violência, abuso e humilhação e a ser ouvida nos assuntos que lhe dizem respeito.',
      en: 'The best interests of the child prevail in every decision about a child. Children are entitled to education, to protection from all violence, abuse and humiliation, and to be heard on matters that concern them.',
    },
    law: 'eduCrianca7_2008',
    lastVerified: V,
    confidence: 'confirm',
  },
  seVistoEstudo: {
    title: { pt: 'Visto de estudo e carta de admissão', en: 'Study visa and admission letter' },
    summary: {
      pt: 'O estrangeiro que vem estudar em Moçambique pede visto de estudo, instruído com documento da instituição de ensino que comprove a admissão ou matrícula e os meios de subsistência. Os consulados pedem a carta de admissão em papel timbrado, assinada e carimbada.',
      en: 'A foreigner coming to study in Mozambique applies for a study visa, supported by a document from the institution proving admission or enrolment and means of support. Consulates ask for the admission letter on letterhead, signed and stamped.',
    },
    law: 'leiEstrangeiros23_2022',
    lastVerified: V,
    confidence: 'confirm',
  },
  sePlagio: {
    title: { pt: 'Autoria e plágio', en: 'Authorship and plagiarism' },
    summary: {
      pt: 'O direito de autor pertence ao criador intelectual da obra, independentemente de registo. Apresentar como próprio o trabalho de outrem, sem citação, viola o direito moral de autor e as normas académicas; as instituições de ensino punem o plágio nos seus regulamentos, podendo anular o trabalho ou o grau.',
      en: 'Copyright belongs to the creator of the work, without registration. Presenting someone else’s work as one’s own, without citation, breaches the author’s moral right and academic rules; institutions punish plagiarism in their regulations and may annul the work or the degree.',
    },
    law: 'seLei9_2022',
    lastVerified: V,
    confidence: 'confirm',
  },
  seFormacaoProfissional: {
    title: { pt: 'Contrato de formação profissional', en: 'Vocational training contract' },
    summary: {
      pt: 'Os centros de formação profissional são registados e, para os cursos que conferem qualificação do sistema nacional, acreditados pela ANEP. O contrato de formação com um formando não é contrato de trabalho: o formando não presta trabalho subordinado nem recebe salário. Os cursos não acreditados dão apenas certificado de frequência ou de conclusão do centro.',
      en: 'Vocational training centres are registered and, for courses leading to national qualifications, accredited by ANEP. A training contract with a trainee is not an employment contract: the trainee does no subordinate work and earns no wage. Non-accredited courses give only the centre’s attendance or completion certificate.',
    },
    law: 'eduProfissional26_2022',
    lastVerified: V,
    confidence: 'confirm',
  },

  // ------------------------------------------------------------- Religious
  seMinistroCulto: {
    title: { pt: 'Ministros de culto e missionários estrangeiros', en: 'Foreign ministers of religion and missionaries' },
    summary: {
      pt: 'O estrangeiro que vem exercer actividade religiosa em Moçambique precisa do visto e da autorização de residência adequados, pedidos ao Serviço Nacional de Migração com declaração da confissão religiosa registada que o acolhe e assume a responsabilidade pela sua estadia. A declaração tem, em regra, a assinatura reconhecida.',
      en: 'A foreigner coming to carry out religious work in Mozambique needs the appropriate visa and residence permit, applied for at the National Migration Service with a declaration from the registered religious body that hosts them and takes responsibility for their stay. The declaration normally has a certified signature.',
    },
    law: 'leiEstrangeiros23_2022',
    lastVerified: V,
    confidence: 'confirm',
  },
} satisfies Record<string, LegalEntryDef>;
