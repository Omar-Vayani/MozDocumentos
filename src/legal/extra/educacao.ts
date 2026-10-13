// Legal values for the "educacao" documents (schools, colleges, universities,
// training centres, tutors, driving schools). Keys must not clash with other files.
//
// Lei n.º 13/2023 (Lei do Trabalho) entries were read in the full text of the
// Boletim da República (I Série n.º 165, 25-08-2023). The education laws were
// identified from Boletim da República listings, official notices and press
// reports only: they are marked 'confirm' and carry no article number until
// checked against the Boletim da República.
import type { LawInfo, LegalEntryDef } from '../types';

const LEI13 = 'https://faolex.fao.org/docs/pdf/moz221728.pdf';
const V = '2026-10-13';

export const LAWS_EDUCACAO = {
  eduSne18_2018: {
    short: 'Lei do Sistema Nacional de Educação',
    cite: 'da Lei do Sistema Nacional de Educação',
    title: 'Lei n.º 18/2018, de 28 de Dezembro — Regime Jurídico do Sistema Nacional de Educação (revoga a Lei n.º 6/92)',
    url: 'https://cipmoz.org/wp-content/uploads/2020/04/Cobrança-de-Mensalidades-.pdf',
  },
  eduEnsinoPrivado54_2026: {
    short: 'regime do ensino privado',
    cite: 'do regime jurídico do ensino privado',
    title: 'Decreto n.º 54/2026 — regime jurídico do exercício da actividade de ensino por entidades privadas (revoga o Decreto n.º 11/90)',
    url: 'https://observador.pt/2026/10/09/mocambique-exige-historia-nacional-as-escolas-estrangeiras-e-ensino-privado-presencial/',
  },
  eduRegeb46_2008: {
    short: 'Regulamento Geral do Ensino Básico',
    cite: 'do Regulamento Geral do Ensino Básico',
    title: 'Regulamento Geral do Ensino Básico, aprovado pelo Diploma Ministerial n.º 46/2008 (BR I Série n.º 20, de 14 de Maio de 2008)',
    url: 'https://archive.gazettes.africa/archive/mz/2008/mz-government-gazette-series-i-dated-2008-05-14-no-20.pdf',
  },
  eduAvaliacao7_2019: {
    short: 'Regulamento Geral de Avaliação',
    cite: 'do Regulamento Geral de Avaliação',
    title: 'Regulamento Geral de Avaliação do Ensino Primário, Alfabetização e Educação de Jovens e Adultos e Ensino Secundário Geral, aprovado pelo Diploma Ministerial n.º 7/2019 (BR I Série n.º 7, de 10 de Janeiro de 2019)',
    url: 'https://archive.gazettes.africa/archive/mz/2019/mz-government-gazette-series-i-dated-2019-01-10-no-7.pdf',
  },
  eduSuperior1_2023: {
    short: 'Lei do Ensino Superior',
    cite: 'da Lei do Ensino Superior',
    title: 'Lei n.º 1/2023, de 17 de Março — Regime Jurídico do Subsistema do Ensino Superior (revoga a Lei n.º 27/2009)',
    url: 'https://www.ispg.ac.mz/images/ispg/regulamentos/Lei-n01-2023---Lei-que-estabelece-o-regime-juridico-do-Ensino-Superior-e-revoga-a-Lei-n027-2009-de-29-de-Setembro.pdf',
  },
  eduLicenciamentoIes43_2023: {
    short: 'Regulamento de Licenciamento das Instituições do Ensino Superior',
    cite: 'do Regulamento de Licenciamento e Funcionamento das Instituições do Ensino Superior',
    title: 'Decreto n.º 43/2023, de 2 de Agosto — Regulamento de Licenciamento e Funcionamento das Instituições do Ensino Superior (revoga o Decreto n.º 46/2018)',
    url: 'https://ispg.ac.mz/images/regulamentos/academica/decreto-43_2023-licenciamento-e-funcionamento-ies.pdf',
  },
  eduProfissional26_2022: {
    short: 'Lei de Educação Profissional',
    cite: 'da Lei de Educação Profissional',
    title: 'Lei n.º 26/2022, de 29 de Dezembro — Lei de Educação Profissional (revoga as Leis n.º 23/2014 e n.º 6/2016)',
    url: 'https://regalert.today/document/644cf8e8-9db5-4c1b-a04b-27f3d39ecd97',
  },
  eduConducao86_2019: {
    short: 'Regulamento do Ensino de Condução',
    cite: 'do Regulamento de Licenciamento da Actividade de Ensino de Condução',
    title: 'Decreto n.º 86/2019, de 28 de Outubro (BR I Série n.º 207) — Regulamento de Licenciamento da Actividade de Ensino de Condução (revoga o Decreto n.º 1/2004)',
    url: 'https://www.inm.gov.mz/pt-br/content/conselho-de-ministros-br-n%C2%BA-207-de-281019-boletim-da-rep%C3%BAblica-i-serie-p%C3%A1g-5117',
  },
  eduCrianca7_2008: {
    short: 'Lei de Promoção e Protecção dos Direitos da Criança',
    cite: 'da Lei de Promoção e Protecção dos Direitos da Criança',
    title: 'Lei n.º 7/2008, de 9 de Julho — Lei de Promoção e Protecção dos Direitos da Criança',
  },
  eduIva10_2025: {
    short: 'alteração do Código do IVA (2025)',
    cite: 'da alteração ao Código do IVA',
    title: 'Lei n.º 10/2025, de 29 de Dezembro — altera o Código do Imposto sobre o Valor Acrescentado (em vigor desde 1 de Janeiro de 2026)',
    url: 'https://www.pwc.pt/pt/pwcinforfisco/flash/mocambique/mocambique-iva-alteracao-civa.html',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_EDUCACAO = {
  eduConsumidorEnsino: {
    title: { pt: 'Serviços de ensino e defesa do consumidor', en: 'Education services and consumer protection' },
    summary: {
      pt: 'O encarregado de educação que contrata uma escola privada é consumidor: tem direito a informação clara sobre preços e condições, à protecção contra cláusulas abusivas e a reclamar junto das entidades de defesa do consumidor.',
      en: 'A parent who contracts a private school is a consumer: entitled to clear information on prices and terms, protection from abusive clauses and to complain to consumer bodies.',
    },
    law: 'lei22_2009',
    lastVerified: V,
    confidence: 'confirm',
  },
  eduTrabalhadorEstudante: {
    title: { pt: 'Trabalhador-estudante', en: 'Worker-student' },
    summary: {
      pt: 'O estatuto de trabalhador-estudante mantém-se com aproveitamento escolar positivo. O trabalhador pode faltar para provas e exames sem perda de remuneração, avisando o empregador com pelo menos 7 dias de antecedência.',
      en: 'Worker-student status depends on positive academic results. The worker may be absent for tests and exams without loss of pay, giving the employer at least 7 days’ notice.',
    },
    law: 'lei13_2023',
    article: 'art. 31.º',
    value: { avisoExamesDias: 7 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  eduHabilitacoesProfissionais: {
    title: { pt: 'Habilitações profissionais', en: 'Professional qualifications' },
    summary: {
      pt: 'As habilitações profissionais conferidas pelos cursos de formação profissional são estabelecidas pelo órgão competente e atribuídas pelas respectivas instituições de formação. Um certificado de curso livre não confere, por si, qualificação profissional reconhecida.',
      en: 'Professional qualifications from vocational courses are set by the competent body and awarded by the training institutions. A certificate for a non-accredited course does not by itself confer a recognised qualification.',
    },
    law: 'lei13_2023',
    article: 'art. 254.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  eduFormacaoTrabalhadores: {
    title: { pt: 'Formação dos trabalhadores', en: 'Training of employees' },
    summary: {
      pt: 'A formação profissional dos trabalhadores no activo é assegurada pelos empregadores, que organizam planos anuais de formação, podendo a formação dar direito a certificado.',
      en: 'Employers provide training for their employees through annual training plans; training may lead to a certificate.',
    },
    law: 'lei13_2023',
    article: 'arts. 245.º e 248.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  eduJustificacaoFaltaAluno: {
    title: { pt: 'Justificação de faltas do aluno', en: 'Justifying a pupil’s absence' },
    summary: {
      pt: 'A justificação é feita por escrito e assinada pelo encarregado de educação e entregue ao Director de Turma (ou ao professor da turma no 1.º grau) no prazo de 48 horas; depois disso a falta é considerada injustificada. O regulamento interno da escola pode fixar regras próprias.',
      en: 'The justification is written, signed by the parent or guardian and handed to the class director (or class teacher) within 48 hours; afterwards the absence counts as unjustified. The school’s rules may differ.',
    },
    law: 'eduRegeb46_2008',
    value: { prazoHoras: 48 },
    sourceUrl: 'https://pdfcoffee.com/reg-geral-do-ensino-basico-1-pdf-free.html',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Texto de 2008 (art. 89), lido numa cópia não oficial; pode ter sido alterado depois da reforma do sistema de educação de 2018.',
      en: '2008 text (art. 89), read in an unofficial copy; it may have changed after the 2018 education reform.',
    },
  },
  eduTransferenciaEscolar: {
    title: { pt: 'Transferência de escola', en: 'School transfer' },
    summary: {
      pt: 'As transferências de alunos entre escolas são admitidas em caso de necessidade. O aluno só se desvincula da escola depois de despacho favorável; de outro modo é considerado desistente. A guia de transferência é emitida pela escola, no modelo oficial.',
      en: 'Transfers between schools are allowed when needed. The pupil leaves the school only after a favourable decision, otherwise counts as having dropped out. The school issues the official transfer form.',
    },
    law: 'eduRegeb46_2008',
    sourceUrl: 'https://pdfcoffee.com/reg-geral-do-ensino-basico-1-pdf-free.html',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Art. 41 do texto de 2008; confirmar a versão em vigor.', en: 'Art. 41 of the 2008 text; confirm the current version.' },
  },
  eduCertificadoHabilitacoes: {
    title: { pt: 'Certificado de habilitações', en: 'Official school-leaving certificate' },
    summary: {
      pt: 'A conclusão de um nível de ensino prova-se com o certificado de habilitações no modelo oficial único do Ministério da Educação, homologado pelo INECE quando exigido (bolsas, ingresso no ensino superior). Declarações da escola não o substituem. No ensino superior, os diplomas e certificados seguem o regulamento de cada instituição.',
      en: 'Completing a level is proven by the official single-model certificate of the Ministry of Education, homologated by INECE when required. School declarations do not replace it. Higher-education diplomas follow each institution’s regulations.',
    },
    law: 'eduAvaliacao7_2019',
    sourceUrl: 'https://ibe.gov.mz/wp-content/uploads/2024/06/Edital_RegimeEspecial2024_2025.pdf',
    lastVerified: V,
    confidence: 'confirm',
  },
  eduEscalaClassificacao: {
    title: { pt: 'Escala de classificação', en: 'Grading scale' },
    summary: {
      pt: 'No Ensino Secundário Geral as classificações são expressas na escala de 0 a 20 valores, sendo positiva a classificação igual ou superior a 10.',
      en: 'In general secondary education grades are on a 0–20 scale; 10 or more is a pass.',
    },
    law: 'eduAvaliacao7_2019',
    value: { maximo: 20, positiva: 10 },
    lastVerified: V,
    confidence: 'confirm',
  },
  eduPropinasEnsinoPrivado: {
    title: { pt: 'Propinas no ensino privado', en: 'Private school fees' },
    summary: {
      pt: 'As instituições privadas podem cobrar matrícula, propinas e outros encargos. Devem fixar os valores anualmente e comunicá-los às autoridades que tutelam o sector; qualquer alteração deve ser fundamentada nos serviços efectivamente prestados. Alterar valores sem comunicação prévia é infracção.',
      en: 'Private institutions may charge enrolment, tuition and other fees. They must set the amounts each year and report them to the supervising authority; changes must be justified by the services actually provided. Changing fees without prior notice is an offence.',
    },
    law: 'eduEnsinoPrivado54_2026',
    sourceUrl: 'https://www.rtp.pt/noticias/mundo/mocambique-exige-historia-nacional-as-escolas-estrangeiras-e-ensino-privado-presencial_n1770557',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Conteúdo segundo a imprensa (Outubro de 2026); confirmar no Boletim da República.', en: 'Content from press reports (October 2026); confirm in the Boletim da República.' },
  },
  eduEnsinoPrivadoLicenca: {
    title: { pt: 'Licenciamento do ensino privado', en: 'Licensing of private education' },
    summary: {
      pt: 'O exercício do ensino por entidades privadas, incluindo a abertura de novas unidades, depende de licenciamento pelas entidades competentes. O ensino privado é presencial; o ensino à distância por instituições privadas é proibido. As instituições em funcionamento têm 18 meses para se adaptarem.',
      en: 'Private teaching, including new branches, requires a licence. Private teaching must be in person; distance teaching by private institutions is prohibited. Existing institutions have 18 months to adapt.',
    },
    law: 'eduEnsinoPrivado54_2026',
    value: { adaptacaoMeses: 18 },
    sourceUrl: 'https://observador.pt/2026/10/09/mocambique-exige-historia-nacional-as-escolas-estrangeiras-e-ensino-privado-presencial/',
    lastVerified: V,
    confidence: 'confirm',
  },
  eduIvaPropinas: {
    title: { pt: 'IVA sobre propinas', en: 'VAT on tuition fees' },
    summary: {
      pt: 'Desde 1 de Janeiro de 2026 as propinas e serviços de ensino deixaram de estar isentos de IVA, aplicando-se a taxa reduzida de 5%, segundo as instituições de ensino. Confirme com a Autoridade Tributária.',
      en: 'Since 1 January 2026 tuition fees are no longer VAT-exempt and the 5% reduced rate applies, according to the institutions. Confirm with the Tax Authority.',
    },
    law: 'eduIva10_2025',
    value: { taxa: 5 },
    sourceUrl: 'https://mznews.co.mz/universidades-e-escolas-privadas-passam-a-cobrar-iva-sobre-propinas-a-partir-de-2026/',
    lastVerified: V,
    confidence: 'confirm',
  },
  eduEscolaridadeObrigatoria: {
    title: { pt: 'Escolaridade obrigatória e gratuita', en: 'Compulsory and free schooling' },
    summary: {
      pt: 'A escolaridade da 1.ª à 9.ª classe é obrigatória. A frequência do ensino primário nas escolas públicas é gratuita; as cobranças ilícitas nas escolas públicas já deram origem a processos-crime.',
      en: 'Schooling from grade 1 to 9 is compulsory. Primary school is free in public schools; illegal charges in public schools have led to criminal cases.',
    },
    law: 'eduSne18_2018',
    lastVerified: V,
    confidence: 'confirm',
  },
  eduDireitoEducacaoDividas: {
    title: { pt: 'Dívidas e direito à educação', en: 'Debts and the right to education' },
    summary: {
      pt: 'As dívidas de propinas são do encarregado de educação. As Direcções de Educação têm determinado que nenhum aluno seja impedido de fazer testes ou exames por falta de pagamento. Reter documentos do aluno ou expô-lo por causa da dívida pode ser considerado prática abusiva.',
      en: 'Fee debts are owed by the parent. Education directorates have ruled that no pupil may be barred from tests or exams for non-payment. Withholding a pupil’s documents or exposing the child over a debt may be an abusive practice.',
    },
    law: 'eduCrianca7_2008',
    sourceUrl: 'https://aimnews.org/2023/08/04/nampula-direccao-provincial-de-educacao-distancia-se-de-cobrancas-em-escolas/',
    lastVerified: V,
    confidence: 'confirm',
  },
  eduEducacaoProfissional: {
    title: { pt: 'Educação profissional acreditada', en: 'Accredited vocational education' },
    summary: {
      pt: 'A educação profissional é regulada pela ANEP, que regista e acredita os provedores; as qualificações do sistema nacional seguem o Quadro Nacional de Qualificações Profissionais. Só um curso acreditado pode ser apresentado como conferindo qualificação profissional.',
      en: 'ANEP regulates vocational education and registers and accredits providers; national qualifications follow the national framework. Only an accredited course may be presented as conferring a professional qualification.',
    },
    law: 'eduProfissional26_2022',
    lastVerified: V,
    confidence: 'confirm',
  },
  eduEnsinoSuperior: {
    title: { pt: 'Ensino superior', en: 'Higher education' },
    summary: {
      pt: 'As instituições de ensino superior privadas são criadas por decreto do Conselho de Ministros e licenciadas nos termos do regulamento próprio. Os graus são licenciatura, mestrado e doutoramento; as condições de atribuição de certificados e diplomas constam do regulamento de cada instituição.',
      en: 'Private higher-education institutions are created by Council of Ministers decree and licensed under their regulation. Degrees are bachelor, master and doctorate; certificates and diplomas follow each institution’s rules.',
    },
    law: 'eduSuperior1_2023',
    lastVerified: V,
    confidence: 'confirm',
  },
  eduEnsinoConducao: {
    title: { pt: 'Escolas de condução', en: 'Driving schools' },
    summary: {
      pt: 'A actividade de ensino de condução depende de licença do INATRO, que também regula os instrutores, os exames e a emissão das cartas de condução.',
      en: 'Driving instruction requires an INATRO licence; INATRO also regulates instructors, exams and licences.',
    },
    law: 'eduConducao86_2019',
    sourceUrl: 'https://www.inatro.gov.mz/?page_id=974',
    lastVerified: V,
    confidence: 'confirm',
  },
} satisfies Record<string, LegalEntryDef>;
