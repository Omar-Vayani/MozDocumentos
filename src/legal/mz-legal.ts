// Every legal value used by the templates lives here — rates, deadlines,
// article references and sources — so it can be corrected without touching
// templates. Never invent article numbers: if a reference is uncertain, leave
// `article` out and set `confidence: 'confirm'`.
//
// Primary source: Lei n.º 13/2023, de 25 de Agosto (Lei do Trabalho), BR I Série
// n.º 165, 2.º Suplemento. Entered into force 180 days after publication
// (21 February 2024) and revoked Lei n.º 23/2007.

import type { Confidence, LawInfo, LegalEntryDef } from './types';
import { LAWS_EXTRA, LEGAL_EXTRA } from './extra';

export type { Confidence, LawInfo };

const CORE_LAWS = {
  lei13_2023: {
    short: 'Lei n.º 13/2023',
    cite: 'da Lei n.º 13/2023',
    title: 'Lei n.º 13/2023, de 25 de Agosto — Lei do Trabalho',
    url: 'https://faolex.fao.org/docs/pdf/moz221728.pdf',
  },
  codigoCivil: {
    short: 'Código Civil',
    cite: 'do Código Civil',
    title: 'Código Civil (aprovado pelo Decreto-Lei n.º 47 344, de 25 de Novembro de 1966, aplicável em Moçambique)',
  },
  cirps: {
    short: 'Código do IRPS',
    cite: 'do Código do IRPS',
    title: 'Código do Imposto sobre o Rendimento das Pessoas Singulares (Lei n.º 20/2013, republicado pela Lei n.º 19/2017)',
    url: 'https://www.at.gov.mz',
  },
  inss: {
    short: 'Segurança Social Obrigatória',
    cite: 'do regime da Segurança Social Obrigatória',
    title: 'Lei n.º 4/2007 e Regulamento da Segurança Social Obrigatória (Decreto n.º 51/2017, alterado pelo Decreto n.º 56/2024)',
    url: 'https://www.inss.gov.mz/taxa-contributiva-tco/',
  },
  rtd2008: {
    short: 'Regulamento do Trabalho Doméstico',
    cite: 'do Regulamento do Trabalho Doméstico',
    title: 'Regulamento do Trabalho Doméstico, aprovado pelo Decreto n.º 40/2008, de 26 de Novembro (BR I Série n.º 48)',
    url: 'https://archive.gazettes.africa/archive/mz/2008/mz-government-gazette-series-i-dated-2008-11-26-no-48.pdf',
  },
  rtd2026: {
    short: 'Decreto n.º 52/2026',
    cite: 'do Decreto n.º 52/2026',
    title: 'Decreto n.º 52/2026, de 3 de Setembro — novo Regulamento do Trabalho Doméstico (revoga o Decreto n.º 40/2008)',
    url: 'https://jornalnoticias.co.mz/destaque/trabalho-domestico-um-novo-regime-para-uma-realidade-antiga/',
  },
  salarioMinimo2026: {
    short: 'Salários mínimos 2026',
    cite: 'dos Diplomas Ministeriais n.º 34/2026 a 41/2026',
    title: 'Diplomas Ministeriais n.º 34/2026 a 41/2026, de 20 de Maio (em vigor desde 1 de Abril de 2026)',
    url: 'https://www.inss.gov.mz/salarios-minimos-em-vigor/',
  },
  codigoComercial: {
    short: 'Código Comercial',
    cite: 'do Código Comercial',
    title: 'Código Comercial, aprovado pelo Decreto-Lei n.º 1/2022, de 25 de Maio (BR I Série n.º 99), que revogou o Código Comercial de 2005',
    url: 'https://www.bancomoc.mz/media/q4kh3wop/decreto-lei-1-2022_25-de-maio_c%C3%B3digo-comercial.pdf',
  },
  cis: {
    short: 'Código do Imposto do Selo',
    cite: 'do Código do Imposto do Selo',
    title: 'Código do Imposto do Selo e Tabela anexa, aprovados pelo Decreto n.º 6/2004, de 1 de Abril (alterado pelo Decreto n.º 38/2005, de 29 de Agosto, e legislação posterior)',
    url: 'https://www.at.gov.mz',
  },
  lei22_2009: {
    short: 'Lei n.º 22/2009',
    cite: 'da Lei n.º 22/2009',
    title: 'Lei n.º 22/2009, de 28 de Setembro — Lei de Defesa do Consumidor (regulamentada pelo Decreto n.º 27/2016, de 18 de Julho)',
    url: 'https://faolex.fao.org/docs/pdf/moz208736.pdf',
  },
  lei14_2011: {
    short: 'Lei n.º 14/2011',
    cite: 'da Lei n.º 14/2011',
    title: 'Lei n.º 14/2011, de 10 de Agosto — formação da vontade da Administração Pública e procedimento administrativo (com as Normas de Funcionamento dos Serviços da Administração Pública, Decreto n.º 30/2001, de 15 de Outubro)',
  },
  codigoNotariado: {
    short: 'Código do Notariado',
    cite: 'do Código do Notariado',
    title: 'Código do Notariado, aprovado pelo Decreto-Lei n.º 4/2006, de 23 de Agosto',
  },
  civa: {
    short: 'Código do IVA',
    cite: 'do Código do IVA',
    title: 'Código do Imposto sobre o Valor Acrescentado (republicado pela Lei n.º 22/2022, de 28 de Dezembro, em vigor desde 1 de Janeiro de 2023)',
    url: 'https://www.at.gov.mz',
  },
} satisfies Record<string, LawInfo>;

/** Every law the app cites: core plus per-category files in ./extra. */
const ALL_LAWS = { ...CORE_LAWS, ...LAWS_EXTRA };
export type LawId = keyof typeof ALL_LAWS;
export const LAWS: Record<LawId, LawInfo> = ALL_LAWS;

export const LAW_IN_FORCE_SINCE = '2024-02-21';

export type LegalEntry = Omit<LegalEntryDef, 'law'> & { law: LawId };

const LEI = LAWS.lei13_2023.url;
const V = '2026-10-12';

const CORE_LEGAL = {
  // ------------------------------------------------------------------ General
  leiTrabalho: {
    title: { pt: 'Lei do Trabalho', en: 'Labour Law' },
    summary: {
      pt: 'Lei n.º 13/2023, em vigor desde 21 de Fevereiro de 2024. Factos anteriores a essa data podem ainda seguir a Lei n.º 23/2007.',
      en: 'Law 13/2023, in force since 21 February 2024. Facts before that date may still follow Law 23/2007.',
    },
    law: 'lei13_2023',
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Contracts
  periodoProbatorioIndeterminado: {
    title: { pt: 'Período probatório — contrato sem data de fim', en: 'Probation — permanent contract' },
    summary: {
      pt: 'Até 2 meses em geral; até 3 meses para técnicos médios; até 6 meses para técnicos superiores e cargos de direcção ou chefia. Sem acordo escrito, presume-se excluído.',
      en: 'Up to 2 months in general; 3 months for mid-level technicians; 6 months for senior technicians and management. If not agreed in writing it is presumed excluded.',
    },
    law: 'lei13_2023',
    article: 'art. 48.º',
    value: { geral: 2, tecnicoMedio: 3, tecnicoSuperior: 6 }, // meses
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  periodoProbatorioPrazo: {
    title: { pt: 'Período probatório — contrato a prazo', en: 'Probation — fixed-term contract' },
    summary: {
      pt: 'Até 3 meses se o contrato for superior a 1 ano; 1 mês se superior a 6 meses e inferior a 1 ano; 15 dias se até 6 meses ou a prazo incerto previsto para 90 dias ou mais.',
      en: 'Up to 3 months if the contract exceeds 1 year; 1 month if over 6 months and under 1 year; 15 days if up to 6 months or for an open-ended term expected to last 90 days or more.',
    },
    law: 'lei13_2023',
    article: 'art. 48.º',
    // dias (3 meses ≈ 90 dias); incertoMinDias: prazo incerto só admite período probatório se a duração prevista for ≥ 90 dias (n.º 2, al. d))
    value: { maisDe1Ano: 90, de6MesesA1Ano: 30, ate6Meses: 15, incertoMinDias: 90 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  denunciaPeriodoProbatorio: {
    title: { pt: 'Denúncia durante o período probatório', en: 'Termination during probation' },
    summary: {
      pt: 'Qualquer das partes pode pôr fim ao contrato com aviso prévio escrito de 7 dias (3 dias se o período probatório for de 15 dias).',
      en: 'Either party may end the contract with 7 days’ written notice (3 days if probation is 15 days).',
    },
    law: 'lei13_2023',
    article: 'art. 51.º',
    value: { geral: 7, probatorio15Dias: 3 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  contratoPrazoCerto: {
    title: { pt: 'Contrato a prazo certo', en: 'Fixed-term contract' },
    summary: {
      pt: 'Só para necessidades temporárias. Prazo não superior a 2 anos, renovável duas vezes por acordo. Ultrapassados os limites, converte-se em contrato por tempo indeterminado. Micro, pequenas e médias empresas podem contratar a prazo livremente nos primeiros 8 anos de actividade.',
      en: 'Only for temporary needs. Term of no more than 2 years, renewable twice by agreement. Exceeding the limits converts it into a permanent contract. Micro, small and medium firms may use fixed terms freely in their first 8 years.',
    },
    law: 'lei13_2023',
    article: 'arts. 41.º, 43.º e 44.º',
    value: { duracaoMaxAnos: 2, renovacoesMax: 2, pmeAnosLivre: 8 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'O art. 43.º, n.º 1 pode ler-se como 2 anos por período ou 2 anos no total. Confirme com um jurista.',
      en: 'Art. 43(1) can be read as 2 years per term or 2 years in total. Confirm with a lawyer.',
    },
  },
  contratoPrazoIncerto: {
    title: { pt: 'Contrato a prazo incerto', en: 'Open-ended fixed-term contract' },
    summary: {
      pt: 'Só é admitido quando não seja possível prever com certeza quando cessa a causa que o justifica (art. 45.º). Dura enquanto se mantiver a necessidade temporária (substituição, obra, projecto). Se ultrapassar 6 anos converte-se em contrato por tempo indeterminado (art. 46.º, n.º 4).',
      en: 'Only allowed when it is not possible to foresee when the cause ends (art. 45). Lasts while the temporary need lasts (replacement, project). Beyond 6 years it becomes permanent (art. 46(4)).',
    },
    law: 'lei13_2023',
    article: 'arts. 45.º e 46.º',
    value: { duracaoMaxAnos: 6 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  caducidadePrazoIncertoAviso: {
    title: { pt: 'Aviso de caducidade — prazo incerto', en: 'Expiry notice — open-ended term' },
    summary: {
      pt: 'O empregador avisa com 15 dias (mais de 6 meses e até 3 anos de trabalho) ou 30 dias (mais de 3 e até 6 anos), salvo estipulação em contrário (n.º 3). O trabalhador que queira pôr termo ao contrato observa os mesmos prazos (n.º 6).',
      en: 'The employer gives 15 days’ notice (over 6 months and up to 3 years of work) or 30 days (over 3 and up to 6 years), unless otherwise agreed (no. 3). An employee who wants to end the contract gives the same notice (no. 6).',
    },
    law: 'lei13_2023',
    article: 'art. 46.º',
    // Thresholds in months of work: notice applies after 6 months; 30 days after 3 years.
    value: { ate3Anos: 15, mais3Anos: 30, minimoMeses: 6, limiarMeses: 36 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  periodoNormalTrabalho: {
    title: { pt: 'Período normal de trabalho', en: 'Normal working hours' },
    summary: {
      pt: 'Máximo de 8 horas por dia e 48 horas por semana (até 9 horas por dia com meio dia de descanso adicional por semana).',
      en: 'Maximum 8 hours a day and 48 hours a week (up to 9 hours a day with an extra half-day of rest a week).',
    },
    law: 'lei13_2023',
    article: 'art. 93.º',
    value: { horasDia: 8, horasSemana: 48 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  feriasDireito: {
    title: { pt: 'Direito a férias', en: 'Annual leave' },
    summary: {
      pt: '12 dias no primeiro ano de serviço efectivo e 30 dias em cada ano seguinte. Contratos a prazo de mais de 3 meses e menos de 1 ano: 1 dia por mês.',
      en: '12 days in the first year of effective service and 30 days each following year. Fixed terms of more than 3 months and less than 1 year: 1 day per month.',
    },
    law: 'lei13_2023',
    article: 'arts. 108.º e 109.º', // 108.º (duração); 109.º, n.º 6 (fraccionamento, blocos de 6 dias)
    value: { primeiroAno: 12, anosSeguintes: 30, porMesPrazoCurto: 1, blocoMinimo: 6 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  feriasGozo: {
    title: { pt: 'Marcação e gozo de férias', en: 'Scheduling and taking annual leave' },
    summary: {
      pt: 'O empregador elabora o plano de férias em coordenação com o órgão sindical. As férias são gozadas seguidas; só por acordo podem ser fraccionadas em períodos de pelo menos 6 dias. Os feriados no período de férias não contam como dias de férias; os dias de doença certificada também não, se o empregador for informado em 10 dias.',
      en: 'The employer draws up the leave plan with the union. Leave is taken in one block; it may be split only by agreement, in periods of at least 6 days. Public holidays during leave do not count as leave days; nor do certified sick days, if the employer is told within 10 days.',
    },
    law: 'lei13_2023',
    article: 'arts. 109.º a 111.º',
    value: { doencaAvisoDias: 10 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  feriadosNacionais: {
    title: { pt: 'Feriados obrigatórios', en: 'Public holidays' },
    summary: {
      pt: '1 de Janeiro, 3 de Fevereiro, 7 de Abril, 1 de Maio, 25 de Junho, 7 de Setembro, 25 de Setembro, 4 de Outubro e 25 de Dezembro, sem prejuízo de outros fixados por lei. Se o feriado coincidir com um domingo, a suspensão do trabalho passa para o dia seguinte.',
      en: '1 January, 3 February, 7 April, 1 May, 25 June, 7 September, 25 September, 4 October and 25 December, plus any others set by law. A holiday falling on a Sunday moves to the Monday.',
    },
    law: 'lei13_2023',
    article: 'art. 105.º',
    // MM-DD
    value: ['01-01', '02-03', '04-07', '05-01', '06-25', '09-07', '09-25', '10-04', '12-25'],
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  deverSigilo: {
    title: { pt: 'Dever de sigilo', en: 'Duty of confidentiality' },
    summary: {
      pt: 'O trabalhador deve guardar sigilo profissional, não divulgando informações referentes aos métodos de produção ou de negócio (art. 59.º, al. f)), e ser leal ao empregador, não negociando em concorrência desonesta (al. h)).',
      en: 'Employees must keep professional secrecy and not disclose information on production or business methods (art. 59(f)), and be loyal, not competing unfairly (art. 59(h)).',
    },
    law: 'lei13_2023',
    article: 'art. 59.º',
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  contratoTrabalhoForma: {
    title: { pt: 'Forma e conteúdo do contrato de trabalho', en: 'Form and content of the employment contract' },
    summary: {
      pt: 'Forma escrita (salvo prazo certo até 90 dias para tarefas de execução), datado e assinado, com: identificação das partes; categoria profissional e tarefas; local de trabalho; duração e condições de renovação; montante, forma e periodicidade da remuneração; data de início; prazo e motivo justificativo nos contratos a prazo (com os factos que o integram); data de celebração e, a prazo certo, de cessação. Sem prazo ou motivo, o contrato a prazo converte-se em contrato por tempo indeterminado.',
      en: 'Written form (except fixed terms up to 90 days for routine tasks), dated and signed, stating: the parties; job grade and duties; workplace; duration and renewal terms; amount, method and frequency of pay; start date; for fixed terms the term and the facts justifying it; signing date and, for a fixed term, end date. Without a term or reason, a fixed-term contract becomes permanent.',
    },
    law: 'lei13_2023',
    article: 'art. 39.º',
    value: { semFormaEscritaDias: 90 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  regulamentoInterno: {
    title: { pt: 'Adesão ao regulamento interno', en: 'Adhesion to internal regulations' },
    summary: {
      pt: 'Presume-se que o trabalhador adere ao regulamento interno quando o contrato escrito refere a sua existência. A presunção é afastada se o trabalhador se opuser por escrito em 30 dias.',
      en: 'The employee is presumed to accept the internal regulations when the written contract mentions them, unless they object in writing within 30 days.',
    },
    law: 'lei13_2023',
    article: 'art. 38.º',
    value: { oposicaoDias: 30 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  presuncaoContratoTrabalho: {
    title: { pt: 'Presunção de contrato de trabalho', en: 'Presumption of employment' },
    summary: {
      pt: 'Presume-se relação de trabalho quando alguém presta actividade remunerada com conhecimento e sem oposição do beneficiário, ou depende economicamente dele. Prestações de serviços em subordinação económica são equiparadas a contrato de trabalho, e as celebradas para vagas do quadro de pessoal convertem-se em contratos de trabalho.',
      en: 'An employment relationship is presumed when someone performs paid work with the beneficiary’s knowledge and without objection, or depends on it economically. Service contracts with economic dependence are treated as employment, and those for posts on the staff establishment become employment contracts.',
    },
    law: 'lei13_2023',
    article: 'arts. 22.º e 23.º',
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Pay
  inssTaxaTrabalhador: {
    title: { pt: 'INSS — contribuição do trabalhador', en: 'INSS — employee contribution' },
    summary: { pt: '3% da remuneração, descontado no salário.', en: '3% of pay, deducted from salary.' },
    law: 'inss',
    value: 0.03,
    sourceUrl: 'https://www.inss.gov.mz/taxa-contributiva-tco/',
    lastVerified: V,
    confidence: 'verified',
    note: { pt: 'Taxa contributiva total de 7% (3% + 4%).', en: 'Total contribution rate 7% (3% + 4%).' },
  },
  inssTaxaEmpregador: {
    title: { pt: 'INSS — contribuição da entidade empregadora', en: 'INSS — employer contribution' },
    summary: { pt: '4% da remuneração, pago pela entidade empregadora.', en: '4% of pay, paid by the employer.' },
    law: 'inss',
    value: 0.04,
    sourceUrl: 'https://www.inss.gov.mz/taxa-contributiva-tco/',
    lastVerified: V,
    confidence: 'verified',
  },
  reciboRemuneracao: {
    title: { pt: 'Pagamento e recibo de remuneração', en: 'Payment of wages and payslip' },
    summary: {
      pt: 'A remuneração é paga em períodos certos (semana, quinzena ou mês), directamente ao trabalhador, em moeda com curso legal, cheque ou transferência bancária. No acto do pagamento, o empregador entrega um documento com o nome completo de ambos, a categoria profissional, o período a que respeita, a remuneração base e as prestações adicionais, os descontos e o valor líquido.',
      en: 'Pay is made at fixed intervals (week, fortnight or month), directly to the employee, in legal tender, by cheque or bank transfer. On payment the employer hands over a document with both full names, the job grade, the period, base pay and additional payments, deductions and the net amount.',
    },
    law: 'lei13_2023',
    article: 'art. 123.º',
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  descontosRemuneracao: {
    title: { pt: 'Descontos na remuneração', en: 'Deductions from pay' },
    summary: {
      pt: 'Só são permitidos descontos autorizados por escrito pelo trabalhador, além dos impostos por lei (Estado, Segurança Social), decisão judicial ou arbitral e multa disciplinar. O total dos descontos nunca pode exceder um terço da remuneração mensal; o adiantamento pedido pelo trabalhador não conta como desconto para este limite.',
      en: 'Only deductions authorised in writing by the employee are allowed, besides those required by law (State, social security), court or arbitral decisions and disciplinary fines. Total deductions may never exceed one third of monthly pay; an advance requested by the employee does not count towards this limit.',
    },
    law: 'lei13_2023',
    article: 'art. 124.º',
    value: { fracaoMaxima: 1 / 3 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  irpsRetencao: {
    title: { pt: 'IRPS — retenção na fonte (trabalho dependente)', en: 'IRPS — withholding on employment income' },
    summary: {
      pt: 'Tabela de retenção mensal do anexo ao art. 65-A do Código do IRPS: valor fixo por número de dependentes mais coeficiente sobre o excedente do limite inferior do escalão. Por defeito a tabela está vazia — active-a em Definições depois de confirmar com a AT para o ano corrente.',
      en: 'Monthly withholding table annexed to art. 65-A of the IRPS Code: fixed amount by number of dependants plus a rate on the excess over the band’s lower limit. Empty by default — enable it in Settings after confirming with the Tax Authority for the current year.',
    },
    law: 'cirps',
    article: 'art. 65-A.º e anexo',
    value: [],
    sourceUrl: 'https://www.at.gov.mz',
    lastVerified: V,
    confidence: 'confirm',
  },
  salarioMinimo: {
    title: { pt: 'Salários mínimos por sector', en: 'Sector minimum wages' },
    summary: {
      pt: 'Valores mensais em vigor desde 1 de Abril de 2026. Pode editá-los em Definições.',
      en: 'Monthly amounts in force since 1 April 2026. You can edit them in Settings.',
    },
    law: 'salarioMinimo2026',
    value: [],
    sourceUrl: 'https://www.inss.gov.mz/salarios-minimos-em-vigor/',
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Fontes divergem em alguns sectores (ex.: microfinanças). Confirme o diploma do seu sector.',
      en: 'Sources differ for some sectors (e.g. microfinance). Confirm your sector’s instrument.',
    },
  },

  // ------------------------------------------------------------------ Leave and absences
  licencaMaternidade: {
    title: { pt: 'Licença de maternidade', en: 'Maternity leave' },
    summary: {
      pt: '90 dias consecutivos, que podem começar 20 dias antes da data prevista do parto. A remuneração é paga pelo INSS.',
      en: '90 consecutive days, which may start 20 days before the expected birth. Pay is covered by INSS.',
    },
    law: 'lei13_2023',
    article: 'art. 14.º',
    value: { dias: 90, antesParto: 20 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  licencaPaternidade: {
    title: { pt: 'Licença de paternidade', en: 'Paternity leave' },
    summary: {
      pt: '7 dias, a partir do dia seguinte ao nascimento, comunicados por escrito ao empregador; 60 dias em caso de morte ou incapacidade da mãe, comprovada por entidade sanitária. Não pode ser gozada de novo antes de decorrido 1 ano e 6 meses sobre a anterior.',
      en: '7 days from the day after the birth, notified to the employer in writing; 60 days if the mother dies or is incapacitated, certified by a health authority. Cannot be taken again within 1 year and 6 months of the previous one.',
    },
    law: 'lei13_2023',
    article: 'art. 15.º',
    value: { dias: 7, morteMae: 60, intervaloMeses: 18 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  protecaoMaternidade: {
    title: { pt: 'Protecção da maternidade', en: 'Maternity protection' },
    summary: {
      pt: 'Os direitos da trabalhadora grávida, puérpera ou lactante dependem de informar o empregador, por escrito, do seu estado. Inclui: não prestar trabalho nocturno, excepcional ou extraordinário a partir do terceiro mês de gravidez; pausas para amamentação até um ano após a licença; e proibição de cessação do contrato (salvo caducidade e despedimento) durante a gravidez e até um ano após a licença.',
      en: 'The rights of a pregnant, post-partum or breastfeeding employee depend on informing the employer of her condition in writing. They include no night, exceptional or overtime work from the third month of pregnancy; breastfeeding breaks up to one year after leave; and no termination (except expiry and dismissal) during pregnancy and up to one year after leave.',
    },
    law: 'lei13_2023',
    article: 'arts. 12.º e 13.º',
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  faltasJustificadas: {
    title: { pt: 'Faltas justificadas', en: 'Justified absences' },
    summary: {
      pt: 'Casamento: 5 dias. Falecimento de cônjuge, pais, filhos, irmãos, avós, netos, sogros, genros e noras: 5 dias. Tios, primos, sobrinhos e cunhados: 2 dias. Também doença, acidente, assistência a familiares e outras autorizadas pelo empregador.',
      en: 'Marriage: 5 days. Death of spouse, parents, children, siblings, grandparents, grandchildren, in-laws: 5 days. Uncles, cousins, nephews/nieces, siblings-in-law: 2 days. Also illness, accident, family care and others authorised by the employer.',
    },
    law: 'lei13_2023',
    article: 'art. 112.º',
    value: { casamento: 5, falecimentoProximo: 5, falecimentoOutro: 2 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  faltasComunicacao: {
    title: { pt: 'Comunicação de faltas', en: 'Notice of absences' },
    summary: {
      pt: 'Faltas justificadas previsíveis: comunicadas obrigatoriamente com pelo menos 2 dias de antecedência. Faltas imprevisíveis: avisar o empregador logo que possível. Sem comunicação, o empregador pode tratar a falta como injustificada.',
      en: 'Foreseeable justified absences must be notified at least 2 days in advance. Unforeseeable absences: notify the employer as soon as possible. Without notice, the employer may treat the absence as unjustified.',
    },
    law: 'lei13_2023',
    article: 'arts. 112.º e 115.º', // 112.º, n.º 5; 115.º, n.º 5
    value: { antecedenciaDias: 2 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Discipline
  procedimentoDisciplinar: {
    title: { pt: 'Procedimento disciplinar', en: 'Disciplinary procedure' },
    summary: {
      pt: 'Nota de culpa escrita, entregue ao trabalhador e ao comité sindical; resposta do trabalhador; diligências de prova; parecer sindical; decisão escrita e fundamentada. Nenhuma sanção pode ser aplicada sem ouvir o trabalhador. É obrigatório para todas as sanções excepto admoestação verbal e repreensão registada.',
      en: 'Written charge delivered to the employee and the union committee; employee reply; evidence; union opinion; written, reasoned decision. No sanction without hearing the employee. Required for all sanctions except verbal and recorded warnings.',
    },
    law: 'lei13_2023',
    article: 'arts. 65.º a 72.º',
    value: { diligenciasDias: 5, parecerSindicalDiasUteis: 5 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Se o trabalhador recusar receber a nota de culpa, duas testemunhas (de preferência uma sindicalizada) assinam-na. É proibida a notificação por jornal ou outros meios de comunicação.',
      en: 'If the employee refuses to receive the charge, two witnesses (preferably one union member) sign it. Notice by newspaper or other media is prohibited.',
    },
  },
  notaCulpaPrazoEmissao: {
    title: { pt: 'Prazo para enviar a nota de culpa', en: 'Deadline to issue the charge' },
    summary: {
      pt: '30 dias a contar do conhecimento da infracção pelo empregador (contados após o fim de licença de maternidade, paternidade, férias ou doença).',
      en: '30 days from when the employer learns of the offence (counted after any maternity, paternity, annual or sick leave ends).',
    },
    law: 'lei13_2023',
    article: 'art. 70.º', // n.º 1, al. a)
    value: 30,
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  notaCulpaPrazoResposta: {
    title: { pt: 'Prazo de resposta à nota de culpa', en: 'Deadline to reply to the charge' },
    summary: {
      pt: 'O trabalhador pode responder por escrito no prazo de 15 dias a contar da recepção, juntar documentos, pedir para ser ouvido e requerer diligências de prova.',
      en: 'The employee may reply in writing within 15 days of receipt, attach documents, ask to be heard and request evidence.',
    },
    law: 'lei13_2023',
    article: 'art. 70.º',
    value: 15,
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  decisaoDisciplinarPrazo: {
    title: { pt: 'Prazo da decisão disciplinar', en: 'Deadline for the decision' },
    summary: {
      pt: 'A decisão escrita e fundamentada é comunicada ao trabalhador e ao órgão sindical no prazo de 30 dias após o termo do prazo do parecer sindical. A sanção executa-se em 90 dias; o despedimento produz efeitos com a comunicação.',
      en: 'The written, reasoned decision is sent to the employee and the union within 30 days after the union opinion deadline. Sanctions are carried out within 90 days; dismissal takes effect on notification.',
    },
    law: 'lei13_2023',
    article: 'arts. 66.º e 70.º', // 70.º, n.º 1, al. c) (decisão); 66.º, n.º 5 (execução)
    value: { decisaoDias: 30, execucaoDias: 90 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  prescricaoInfraccao: {
    title: { pt: 'Prescrição da infracção disciplinar', en: 'Limitation period' },
    summary: {
      pt: 'A infracção prescreve 6 meses após a data em que foi cometida. Um inquérito prévio (até 90 dias) suspende a prescrição.',
      en: 'The offence lapses 6 months after it was committed. A prior inquiry (up to 90 days) suspends the period.',
    },
    law: 'lei13_2023',
    article: 'arts. 66.º e 70.º', // 66.º, n.º 2 (prescrição); 70.º, n.º 4 (inquérito)
    value: { meses: 6, inqueritoDias: 90 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  sancoesDisciplinares: {
    title: { pt: 'Sanções disciplinares', en: 'Disciplinary sanctions' },
    summary: {
      pt: 'Admoestação verbal; repreensão registada; suspensão com perda de remuneração (até 10 dias por infracção e 30 por ano); multa (até 20 dias de salário); despromoção para a categoria imediatamente inferior (até 1 ano); despedimento. Uma só sanção por infracção.',
      en: 'Verbal warning; recorded reprimand; unpaid suspension (up to 10 days per offence and 30 a year); fine (up to 20 days’ pay); demotion to the next lower grade (up to 1 year); dismissal. One sanction per offence.',
    },
    law: 'lei13_2023',
    article: 'arts. 64.º e 65.º',
    value: { suspensaoMaxDias: 10, suspensaoMaxAno: 30, multaMaxDias: 20, despromocaoMaxAnos: 1 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  suspensaoPreventiva: {
    title: { pt: 'Suspensão preventiva', en: 'Preventive suspension' },
    summary: {
      pt: 'Com a nota de culpa, o empregador pode suspender preventivamente o trabalhador, sem perda de remuneração, se a sua presença puder prejudicar o processo.',
      en: 'When serving the charge, the employer may suspend the employee without loss of pay if their presence could harm the procedure.',
    },
    law: 'lei13_2023',
    article: 'art. 71.º',
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  impugnacaoSancao: {
    title: { pt: 'Impugnação da sanção', en: 'Challenging a sanction' },
    summary: {
      pt: 'O trabalhador pode impugnar as sanções de suspensão, multa, despromoção e despedimento no prazo de 6 meses.',
      en: 'The employee may challenge suspension, fine, demotion or dismissal within 6 months.',
    },
    law: 'lei13_2023',
    article: 'arts. 65.º e 76.º', // 65.º, n.º 1 (sanções c) a f)); 76.º, n.º 2 (despedimento)
    value: { meses: 6 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Ending employment
  avisoPrevioTrabalhador: {
    title: { pt: 'Aviso prévio do trabalhador', en: 'Employee notice period' },
    summary: {
      pt: 'Contrato sem data de fim: 15 dias (mais de 6 meses e até 3 anos de serviço) ou 30 dias (mais de 3 anos). Contrato a prazo: 30 dias. Salvo acordo diferente; dias seguidos; por escrito. Sem aviso, o trabalhador paga o valor correspondente.',
      en: 'Permanent contract: 15 days (over 6 months and up to 3 years of service) or 30 days (over 3 years). Fixed term: 30 days. Unless otherwise agreed; calendar days; in writing. Without notice, the employee owes the equivalent pay.',
    },
    law: 'lei13_2023',
    article: 'art. 140.º',
    // Thresholds in months of service: notice applies after 6 months; 30 days after 3 years.
    value: { ate3Anos: 15, mais3Anos: 30, prazo: 30, limiarMeses: 36, minimoMeses: 6 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  rescisaoJustaCausaTrabalhador: {
    title: { pt: 'Rescisão com justa causa pelo trabalhador', en: 'Resignation with just cause' },
    summary: {
      pt: 'Aviso escrito de pelo menos 7 dias, com indicação dos factos. Indemnização de 45 dias por ano de serviço (contrato sem data de fim).',
      en: 'Written notice of at least 7 days stating the facts. Compensation of 45 days per year of service (permanent contract).',
    },
    law: 'lei13_2023',
    article: 'art. 139.º',
    value: { avisoDias: 7, indemnizacaoDiasPorAno: 45 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  naoRenovacaoAviso: {
    title: { pt: 'Aviso de não renovação — contrato a prazo certo', en: 'Non-renewal notice — fixed term' },
    summary: {
      pt: 'A parte que não quer renovar avisa com 15 dias (contrato de 3 meses a 1 ano) ou 30 dias (mais de 1 ano). Sem aviso, paga a remuneração do período em falta. A caducidade não dá direito a compensação.',
      en: 'The party not renewing gives 15 days’ notice (contract of 3 months to 1 year) or 30 days (over 1 year). Without notice, it pays the missing period. Expiry gives no right to compensation.',
    },
    law: 'lei13_2023',
    article: 'arts. 43.º e 136.º',
    // Thresholds in months of contract length: notice applies from 3 months; 30 days above 1 year.
    value: { ate1Ano: 15, mais1Ano: 30, limiarMeses: 12, minimoMeses: 3 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  revogacaoAcordo: {
    title: { pt: 'Revogação por acordo', en: 'Termination by agreement' },
    summary: {
      pt: 'Documento escrito assinado por ambas as partes, com as datas de celebração e de produção de efeitos. Não há compensação fixada por lei. O trabalhador pode revogar o acordo em 7 dias, devolvendo a compensação recebida.',
      en: 'Written document signed by both parties, with the signing and effective dates. No statutory compensation. The employee may revoke it within 7 days by returning the compensation.',
    },
    law: 'lei13_2023',
    article: 'art. 137.º',
    value: { revogacaoDias: 7 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'O trabalhador pode enviar cópia do acordo ao órgão sindical e à administração do trabalho para apreciação (n.º 2).',
      en: 'The employee may send a copy to the union and the labour administration for review (para. 2).',
    },
  },
  indemnizacaoMotivosEconomicos: {
    title: { pt: 'Despedimento por motivos estruturais, tecnológicos ou de mercado', en: 'Dismissal for structural, technological or market reasons' },
    summary: {
      pt: 'Aviso escrito de pelo menos 30 dias ao trabalhador, ao órgão sindical e ao ministério. Indemnização por ano de serviço: 30 dias de salário base (até 7 salários mínimos), 15 dias (mais de 7 e até 18) ou 5 dias (mais de 18). O salário base inclui o bónus de antiguidade; o salário mínimo é o do sector.',
      en: 'Written notice of at least 30 days to the employee, the union and the ministry. Compensation per year of service: 30 days of base pay (up to 7 minimum wages), 15 days (over 7 and up to 18) or 5 days (over 18). Base pay includes the seniority bonus; the minimum wage is that of the sector.',
    },
    law: 'lei13_2023',
    article: 'arts. 141.º e 142.º',
    value: { avisoDias: 30, ate7SM: 30, ate18SM: 15, mais18SM: 5, limite1: 7, limite2: 18 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  indemnizacaoDespedimentoIlicito: {
    title: { pt: 'Despedimento ilícito', en: 'Unlawful dismissal' },
    summary: {
      pt: 'Reintegração e salários até 6 meses, ou, em alternativa, indemnização de 45 dias de salário por ano de serviço.',
      en: 'Reinstatement and up to 6 months’ wages, or alternatively 45 days’ pay per year of service.',
    },
    law: 'lei13_2023',
    article: 'arts. 76.º e 139.º',
    value: { diasPorAno: 45 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  prescricaoCreditosLaborais: {
    title: { pt: 'Prescrição dos créditos laborais', en: 'Limitation of employment claims' },
    summary: {
      pt: 'Os direitos resultantes do contrato de trabalho, da sua violação ou cessação prescrevem 6 meses após a cessação do contrato, salvo disposição legal em contrário. O prazo suspende-se com acção judicial, mediação ou arbitragem.',
      en: 'Rights arising from the employment contract, its breach or termination lapse 6 months after the contract ends, unless the law provides otherwise. The period is suspended by court action, mediation or arbitration.',
    },
    law: 'lei13_2023',
    article: 'art. 57.º',
    value: { meses: 6 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  certificadoTrabalho: {
    title: { pt: 'Certificado de trabalho', en: 'Certificate of employment' },
    summary: {
      pt: 'Em qualquer caso de cessação, o empregador emite um certificado com o período de serviço, o nível de capacidade profissional adquirida e o cargo ou cargos desempenhados. Só inclui outras referências a pedido escrito do trabalhador, que o pode contestar junto dos órgãos competentes em 30 dias.',
      en: 'On any termination the employer issues a certificate with length of service, qualification level and roles held. Other details only at the employee’s written request; it may be contested within 30 days.',
    },
    law: 'lei13_2023',
    article: 'art. 147.º',
    value: { contestacaoDias: 30 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Civil law
  codigoCivilPrestacaoServicos: {
    title: { pt: 'Contrato de prestação de serviço', en: 'Service contract' },
    summary: {
      pt: 'Uma parte obriga-se a proporcionar à outra certo resultado do seu trabalho intelectual ou manual, com ou sem retribuição, sem subordinação jurídica. Se houver horário, ordens e salário fixo, ou dependência económica, pode ser considerado contrato de trabalho (arts. 22.º e 23.º da Lei do Trabalho).',
      en: 'One party provides the other with a given result of its intellectual or manual work, without legal subordination. Fixed hours, orders and a fixed salary, or economic dependence, may make it an employment contract (Labour Law arts. 22 and 23).',
    },
    law: 'codigoCivil',
    article: 'art. 1154.º',
    sourceUrl: 'https://informador.pt/legislacao/lexit/codigos/direito-civil/codigo-civil/livro-ii-direito-das-obrigacoes/titulo-ii-dos-contratos-em-especial/capitulo-ix-prestacao-de-servico/artigo-1154-o-nocao/',
    lastVerified: V,
    confidence: 'verified',
  },
  codigoCivilProcuracao: {
    title: { pt: 'Procuração', en: 'Power of attorney' },
    summary: {
      pt: 'Acto pelo qual alguém atribui a outrem poderes representativos. Algumas entidades exigem reconhecimento notarial da assinatura.',
      en: 'Act by which someone gives another person powers of representation. Some bodies require the signature to be notarised.',
    },
    law: 'codigoCivil',
    article: 'art. 262.º',
    lastVerified: V,
    confidence: 'verified',
  },
  codigoCivilArrendamento: {
    title: { pt: 'Arrendamento', en: 'Lease' },
    summary: {
      pt: 'Locação de imóvel. O contrato deve indicar as partes, o imóvel, a renda, o prazo e o fim a que se destina.',
      en: 'Lease of real estate. The contract should state the parties, property, rent, term and permitted use.',
    },
    law: 'codigoCivil',
    article: 'arts. 1022.º e seguintes',
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'O Código Civil aplica-se a par da legislação especial (Lei n.º 8/79, de 3 de Julho; Decreto n.º 43 525, de 7 de Março de 1961, cuja vigência a jurisprudência discute). Desde o Decreto n.º 24/2006, de 30 de Maio, o arrendamento para comércio reduzido a escrito é válido sem escritura pública (Tribunal Supremo, Proc. 103/11). A denúncia pelo senhorio é limitada a casos previstos na lei.',
      en: 'The Civil Code applies alongside special legislation (Law 8/79; Decree 43 525 of 1961, whose force is debated in case law). Since Decree 24/2006 a written commercial lease is valid without a notarial deed (Supreme Court, case 103/11). Landlord termination is limited to cases set by law.',
    },
  },
  trabalhoDomestico: {
    title: { pt: 'Trabalho doméstico', en: 'Domestic work' },
    summary: {
      pt: 'O trabalho doméstico é regido por legislação especial (art. 3.º, n.º 1, al. c)); a Lei do Trabalho aplica-se em tudo o que se mostrar adaptado à sua natureza (n.º 3). Regulamento em vigor: Decreto n.º 40/2008, de 26 de Novembro. O Decreto n.º 52/2026, de 3 de Setembro, aprovou um novo Regulamento do Trabalho Doméstico que o revoga, com entrada em vigor prevista para 2 de Março de 2027.',
      en: 'Domestic work is governed by special legislation (art. 3(1)(c)); the Labour Law applies insofar as it suits its nature (art. 3(3)). Regulation in force: Decree 40/2008 of 26 November. Decree 52/2026 of 3 September approved a new Domestic Work Regulation that repeals it, expected to take effect on 2 March 2027.',
    },
    law: 'lei13_2023',
    article: 'art. 3.º',
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'O art. 3.º foi confirmado no texto da Lei n.º 13/2023. Os dados sobre o Decreto n.º 52/2026 (número, data e entrada em vigor) provêm da imprensa (Jornal Notícias, 28 de Setembro de 2026); confirme no Boletim da República.',
      en: 'Art. 3 was checked against the text of Law 13/2023. The details of Decree 52/2026 (number, date and entry into force) come from the press (Jornal Notícias, 28 September 2026); confirm in the Boletim da República.',
    },
  },
  trabalhoDomesticoRegulamento: {
    title: { pt: 'Regulamento do Trabalho Doméstico (2008)', en: 'Domestic Work Regulation (2008)' },
    summary: {
      pt: 'Regime aplicável até à entrada em vigor do Decreto n.º 52/2026. Segundo fontes secundárias: período normal de trabalho até 9 horas por dia e 54 horas por semana; um dia de descanso semanal, em regra ao domingo; férias de 12 dias no primeiro ano, 24 no segundo e 30 a partir do terceiro. O contrato pode ser verbal ou escrito.',
      en: 'Applies until Decree 52/2026 takes effect. According to secondary sources: normal hours up to 9 a day and 54 a week; one weekly rest day, normally Sunday; leave of 12 days in the first year, 24 in the second and 30 from the third. The contract may be oral or written.',
    },
    law: 'rtd2008',
    value: { horasDia: 9, horasSemana: 54 },
    sourceUrl: 'https://sovendas.co.mz/blog/trabalho-domestico-em-mocambique/',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Não foi possível consultar o texto do Decreto n.º 40/2008; os valores e os artigos devem ser confirmados no Boletim da República (I Série, n.º 48, de 26 de Novembro de 2008).',
      en: 'The text of Decree 40/2008 could not be consulted; values and articles must be confirmed in the Boletim da República (Series I, no. 48, 26 November 2008).',
    },
  },
  trabalhoDomesticoNovoRegime: {
    title: { pt: 'Novo Regulamento do Trabalho Doméstico (2026)', en: 'New Domestic Work Regulation (2026)' },
    summary: {
      pt: 'Aprovado pelo Decreto n.º 52/2026, de 3 de Setembro, com entrada em vigor prevista para 2 de Março de 2027. Torna obrigatório o contrato escrito e a inscrição do trabalhador no sistema de segurança social obrigatória; fixa o período normal de trabalho em 8 horas por dia e 48 horas por semana, com descanso semanal, em regra ao domingo; férias de 12 dias no primeiro ano e 30 dias a partir do segundo. O salário mínimo da categoria será fixado pelo Governo, ouvida a Comissão Consultiva do Trabalho.',
      en: 'Approved by Decree 52/2026 of 3 September, expected to take effect on 2 March 2027. Makes a written contract and social security registration mandatory; sets normal hours at 8 a day and 48 a week, with weekly rest normally on Sunday; leave of 12 days in the first year and 30 days from the second. The Government will set the category’s minimum wage after consulting the Labour Advisory Commission.',
    },
    law: 'rtd2026',
    value: { emVigorDesde: '2027-03-02', horasDia: 8, horasSemana: 48 },
    sourceUrl: 'https://jornalnoticias.co.mz/destaque/trabalho-domestico-um-novo-regime-para-uma-realidade-antiga/',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Informação da imprensa (Jornal Notícias; Rádio Moçambique; Diário Económico, 23 de Junho de 2026). Confirme o texto publicado no Boletim da República e se já foi fixado o salário mínimo do trabalho doméstico.',
      en: 'Press information (Jornal Notícias; Rádio Moçambique; Diário Económico, 23 June 2026). Confirm the text published in the Boletim da República and whether the domestic work minimum wage has been set.',
    },
  },
  descansoSemanal: {
    title: { pt: 'Descanso semanal', en: 'Weekly rest' },
    summary: {
      pt: 'Pelo menos 24 horas consecutivas por semana, em dia que normalmente é o domingo. Pode ser outro dia, designadamente para serviços que não podem ser interrompidos.',
      en: 'At least 24 consecutive hours a week, normally on Sunday. It may be another day, in particular for services that cannot be interrupted.',
    },
    law: 'lei13_2023',
    article: 'art. 104.º',
    value: { horas: 24 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  remuneracaoEspecie: {
    title: { pt: 'Remuneração em espécie', en: 'Payment in kind' },
    summary: {
      pt: 'A remuneração pode ser paga em dinheiro ou em espécie, desde que a parte não pecuniária, calculada a preços correntes, não exceda 25% da remuneração global. As prestações em espécie devem ser adequadas ao uso pessoal do trabalhador ou da sua família e fixadas por acordo.',
      en: 'Pay may be in cash or in kind, provided the non-cash part, at current prices, does not exceed 25% of total pay. Payments in kind must suit the personal use of the employee or their family and be agreed.',
    },
    law: 'lei13_2023',
    article: 'art. 123.º',
    value: { fracaoMaxima: 0.25 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  codigoCivilMora: {
    title: { pt: 'Mora do devedor', en: 'Default of the debtor' },
    summary: {
      pt: 'O devedor fica constituído em mora depois de interpelado para cumprir; a partir daí respondem os juros e os prejuízos causados.',
      en: 'The debtor is in default after being formally asked to pay; from then on interest and damages are owed.',
    },
    law: 'codigoCivil',
    article: 'arts. 804.º e 805.º',
    lastVerified: V,
    confidence: 'verified',
  },
  codigoCivilCompraVenda: {
    title: { pt: 'Compra e venda', en: 'Sale' },
    summary: {
      pt: 'Contrato pelo qual se transmite a propriedade de uma coisa mediante um preço. A venda de viaturas deve ser registada na Conservatória do Registo Automóvel.',
      en: 'Contract transferring ownership of a thing for a price. Vehicle sales must be registered at the Motor Vehicle Registry.',
    },
    law: 'codigoCivil',
    article: 'art. 874.º',
    lastVerified: V,
    confidence: 'verified',
  },
  codigoCivilReconhecimentoDivida: {
    title: { pt: 'Reconhecimento de dívida', en: 'Acknowledgement of debt' },
    summary: {
      pt: 'Quem reconhece uma dívida por declaração unilateral dispensa o credor de provar a relação fundamental, cuja existência se presume até prova em contrário.',
      en: 'A unilateral acknowledgement of a debt relieves the creditor of proving the underlying relationship, which is presumed until proven otherwise.',
    },
    law: 'codigoCivil',
    article: 'art. 458.º',
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Texto original do Código Civil de 1966. Para servir de título executivo, convém reconhecer a assinatura do devedor no notário.',
      en: 'Original 1966 Civil Code text. To be enforceable without a court judgment, have the debtor’s signature certified by a notary.',
    },
  },
  codigoCivilPrestacoes: {
    title: { pt: 'Dívida liquidável em prestações', en: 'Debt payable in instalments' },
    summary: {
      pt: 'Se a obrigação puder ser liquidada em duas ou mais prestações, a falta de realização de uma delas importa o vencimento de todas.',
      en: 'If a debt is payable in two or more instalments, failure to pay one makes all of them due.',
    },
    law: 'codigoCivil',
    article: 'art. 781.º',
    lastVerified: V,
    confidence: 'verified',
  },
  procuracaoForma: {
    title: { pt: 'Forma da procuração', en: 'Form of a power of attorney' },
    summary: {
      pt: 'A procuração reveste a forma exigida para o acto que o procurador vai praticar (art. 262.º, n.º 2, do Código Civil). As que exigem intervenção notarial (ex.: venda de imóveis) são lavradas por instrumento público, por documento assinado pelo representado com reconhecimento presencial da assinatura, ou por documento autenticado.',
      en: 'A power of attorney takes the form required for the act the attorney will perform (Civil Code art. 262(2)). Those requiring a notary (e.g. selling real estate) are made as a public instrument, a document signed with the signature certified in person, or an authenticated document.',
    },
    law: 'codigoNotariado',
    article: 'art. 120.º',
    sourceUrl: 'https://www.ts.gov.mz/wp-content/uploads/2024/08/Ac-Proc-93-2022-C.pdf',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Artigo citado no Acórdão do Tribunal Supremo, Proc. 93/2022; confirme a numeração no texto oficial.',
      en: 'Article as quoted in Supreme Court judgment, case 93/2022; confirm the numbering in the official text.',
    },
  },
  impostoSeloArrendamento: {
    title: { pt: 'Imposto do selo — arrendamento', en: 'Stamp duty — leases' },
    summary: {
      pt: 'O arrendamento e o subarrendamento de imóveis pagam imposto do selo de 2% sobre o maior valor de renda mensal estipulado no contrato. O imposto é liquidado e pago pelo senhorio (locador).',
      en: 'Leases and subleases of real estate pay stamp duty of 2% on the highest monthly rent stated in the contract. The landlord assesses and pays it.',
    },
    law: 'cis',
    article: 'verba 4.1 da Tabela',
    value: 0.02,
    sourceUrl: 'https://www.tta-advogados.com/xms/files/Arquivo/2022-08/Regime_Fiscal_Aplicavel_ao_Sector_Imobiliario_em_Mocambique.pdf',
    lastVerified: V,
    confidence: 'verified',
  },
  ivaTaxaNormal: {
    title: { pt: 'IVA — taxa normal', en: 'VAT — standard rate' },
    summary: {
      pt: 'Taxa normal de 16% desde 1 de Janeiro de 2023 (antes 17%). As facturas e documentos equivalentes são emitidos em impresso de tipografia autorizada ou por programa de facturação autorizado.',
      en: 'Standard rate 16% since 1 January 2023 (previously 17%). Invoices and equivalent documents are issued on authorised printed forms or authorised invoicing software.',
    },
    law: 'civa',
    article: 'art. 17.º, n.º 1',
    value: 0.16,
    sourceUrl: 'https://www.pwc.com/mz/en/publications/tax-alert.html',
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Há taxas reduzidas e isenções para certos bens e serviços (Lei n.º 10/2025 — confirme).',
      en: 'Reduced rates and exemptions exist for certain goods and services (Law 10/2025 — confirm).',
    },
  },
  consumidorDefeito: {
    title: { pt: 'Bem defeituoso — direitos do consumidor', en: 'Defective goods — consumer rights' },
    summary: {
      pt: 'O consumidor pode exigir, sem depender de culpa do fornecedor, a reparação ou a substituição do bem, a redução do preço ou a resolução do contrato. Deve denunciar o defeito em 30 dias (bem móvel) ou 1 ano (imóvel). Se o defeito não for sanado em 30 dias, pode exigir a substituição, a restituição imediata da quantia paga ou a redução do preço, além de indemnização.',
      en: 'Regardless of the supplier’s fault, the consumer may demand repair or replacement, a price reduction or termination. The defect must be reported within 30 days (movable goods) or 1 year (real estate). If not fixed within 30 days, the consumer may demand replacement, an immediate refund or a price reduction, plus damages.',
    },
    law: 'lei22_2009',
    article: 'art. 14.º',
    value: { denunciaMovelDias: 30, denunciaImovelAnos: 1, sanarDias: 30 },
    sourceUrl: 'https://faolex.fao.org/docs/pdf/moz208736.pdf',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Lido de uma cópia digitalizada do BR com partes truncadas; confirme os prazos no texto oficial.',
      en: 'Read from a partly truncated scan of the BR; confirm the periods in the official text.',
    },
  },
  requerimentoConteudo: {
    title: { pt: 'Requerimento à Administração Pública', en: 'Application to a public body' },
    summary: {
      pt: 'Feito por escrito, indica o órgão a que se dirige, a identificação do requerente (nome, estado civil, profissão e residência), a exposição dos factos e, sendo possível, os fundamentos de direito, e o pedido em termos claros e precisos. Sem identificação do requerente é indeferido liminarmente.',
      en: 'In writing, stating the body addressed, the applicant’s identification (name, marital status, occupation and residence), the facts and, where possible, the legal grounds, and a clear and precise request. Without the applicant’s identification it is rejected outright.',
    },
    law: 'lei14_2011',
    article: 'art. 80.º',
    lastVerified: V,
    confidence: 'confirm',
  },
  actaConteudo: {
    title: { pt: 'Actas das reuniões', en: 'Minutes of meetings' },
    summary: {
      pt: 'As deliberações dos sócios, da administração e do órgão de fiscalização constam de acta lavrada em livro ou folhas próprias. A acta indica, pelo menos, a entidade, o lugar, o dia e a hora, a mesa, os presentes (ou a lista de presenças), a ordem de trabalhos, as deliberações e o resultado das votações, e é assinada pela mesa ou, não havendo, pelos presentes.',
      en: 'Resolutions of members, the board and the audit body are recorded in minutes in a dedicated book or sheets. Minutes state at least the entity, place, date and time, the chair, those present (or the attendance list), the agenda, resolutions and votes, and are signed by the chair and secretary or, if none, by those present.',
    },
    law: 'codigoComercial',
    sourceUrl: LAWS.codigoComercial.url,
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Conteúdo confirmado no Código Comercial de 2005; confirme o artigo correspondente no Código de 2022.',
      en: 'Content confirmed in the 2005 Commercial Code; confirm the corresponding article in the 2022 Code.',
    },
  },

  // ------------------------------------------------------------------ General meetings (Código Comercial, DL 1/2022)
  convocatoriaAssembleiaConteudo: {
    title: { pt: 'Aviso convocatório — conteúdo', en: 'Notice of meeting — content' },
    summary: {
      pt: 'Convoca o presidente da Mesa (ou, se não o fizer quando deve, a administração, o conselho fiscal ou os sócios que a requereram). O aviso, assinado por quem convoca, indica a data, a hora e o local, a qualidade de quem convoca, a espécie de assembleia, a ordem de trabalhos e os documentos disponíveis na sede para consulta. Sem data, hora, local, ordem de trabalhos ou assinatura competente, a assembleia não se considera convocada.',
      en: 'Called by the chair of the meeting (or, if they fail to, by the board, the audit body or the members who requested it). The notice, signed by whoever calls it, states date, time and place, the caller’s capacity, the type of meeting, the agenda and the documents available at the head office. Without date, time, place, agenda or a competent signature the meeting is not validly called.',
    },
    law: 'codigoComercial',
    article: 'arts. 121.º e 122.º',
    sourceUrl: LAWS.codigoComercial.url,
    lastVerified: V,
    confidence: 'verified',
  },
  convocatoriaQuotasPrazo: {
    title: { pt: 'Convocatória — sociedade por quotas', en: 'Notice — private limited company' },
    summary: {
      pt: 'Por escrito, para o endereço físico ou electrónico do sócio que conste da sociedade, com antecedência mínima de 15 dias, salvo se a lei ou o contrato de sociedade exigir outra formalidade ou prazo maior.',
      en: 'In writing, to the member’s physical or e-mail address on record, at least 15 days in advance, unless the law or the articles require another formality or a longer period.',
    },
    law: 'codigoComercial',
    article: 'art. 308.º',
    value: 15, // dias
    sourceUrl: LAWS.codigoComercial.url,
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'A forma de comunicação segue o art. 103.º (por escrito; anúncio se a comunicação pessoal não for possível).',
      en: 'Delivery follows art. 103 (in writing; public notice if personal delivery is impossible).',
    },
  },
  convocatoriaAnonimaPrazo: {
    title: { pt: 'Convocatória — sociedade anónima', en: 'Notice — public limited company' },
    summary: {
      pt: 'O aviso convocatório é publicado com antecedência mínima de 30 dias. O contrato de sociedade pode permitir substituir a publicação por aviso escrito para os endereços registados, com a mesma antecedência.',
      en: 'The notice is published at least 30 days in advance. The articles may allow a written notice to registered addresses instead, with the same notice period.',
    },
    law: 'codigoComercial',
    article: 'art. 400.º',
    value: 30, // dias
    sourceUrl: LAWS.codigoComercial.url,
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Prazo de 30 dias confirmado no texto; o número do artigo foi lido de uma cópia digitalizada do BR — confirme.',
      en: 'The 30-day period is confirmed in the text; the article number was read from a scanned copy of the BR — confirm.',
    },
  },
  segundaConvocacao: {
    title: { pt: 'Segunda convocação na mesma convocatória', en: 'Second call in the same notice' },
    summary: {
      pt: 'A convocatória pode fixar logo uma segunda data, para o caso de falta de quórum, desde que entre as duas datas medeiem mais de 15 dias. Em segunda convocação a assembleia delibera seja qual for o capital representado.',
      en: 'The notice may set a second date in case there is no quorum, provided more than 15 days separate the two dates. On second call the meeting may resolve whatever capital is represented.',
    },
    law: 'codigoComercial',
    article: 'art. 123.º',
    value: 15, // dias (têm de mediar MAIS de 15 dias)
    sourceUrl: LAWS.codigoComercial.url,
    lastVerified: V,
    confidence: 'verified',
  },
  representacaoAssembleia: {
    title: { pt: 'Representação na assembleia geral', en: 'Proxy at the general meeting' },
    summary: {
      pt: 'O sócio ou accionista pode fazer-se representar por representante legal ou voluntário; o representante voluntário é constituído por instrumento de representação (carta ou procuração).',
      en: 'A member may be represented by a legal or appointed representative; an appointed representative needs a written instrument (letter or power of attorney).',
    },
    law: 'codigoComercial',
    sourceUrl: LAWS.codigoComercial.url,
    lastVerified: V,
    confidence: 'confirm',
  },
  convocatoriaAssociacao: {
    title: { pt: 'Convocatória — associação', en: 'Notice — association' },
    summary: {
      pt: 'Aviso postal expedido a cada associado com antecedência mínima de 8 dias, com o dia, a hora, o local e a ordem do dia. Os estatutos podem fixar prazo maior.',
      en: 'Postal notice to each member at least 8 days in advance, stating day, time, place and agenda. The statutes may set a longer period.',
    },
    law: 'codigoCivil',
    article: 'art. 174.º',
    value: 8, // dias
    sourceUrl: 'https://clr.africanchildforum.org/Legislation%20Per%20Country/Mozambique/mozambique_civilcode_1966_pr.pdf',
    lastVerified: V,
    confidence: 'verified',
  },
} satisfies Record<string, LegalEntry>;

/** Every legal value: core plus per-category files in ./extra. */
export const LEGAL = { ...CORE_LEGAL, ...LEGAL_EXTRA };

export type LegalRefId = keyof typeof LEGAL;

export function legalEntry(id: LegalRefId): LegalEntry {
  return LEGAL[id] as LegalEntry;
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

/** IRPS monthly withholding band. `fixed[d]` is the fixed amount for d dependants (index 4 = 4 or more); null = no withholding. */
export type IrpsBand = { from: number; fixed: (number | null)[]; rate: number };
export type MinimumWage = { sector: string; value: number; since: string };
export type LegalTable = IrpsBand[] | MinimumWage[];

/**
 * Reference IRPS withholding table — annex to art. 65-A of the IRPS Code
 * (Lei 19/2017). Not active by default: the user enables it in Settings after
 * confirming it is current with the Autoridade Tributária.
 */
export const IRPS_REFERENCE_TABLE: IrpsBand[] = [
  { from: 0, fixed: [null, null, null, null, null], rate: 0 },
  { from: 20250, fixed: [0, null, null, null, null], rate: 0.1 },
  { from: 20750, fixed: [50, 0, null, null, null], rate: 0.1 },
  { from: 21000, fixed: [75, 25, 0, null, null], rate: 0.1 },
  { from: 21250, fixed: [100, 50, 25, 0, null], rate: 0.1 },
  { from: 21750, fixed: [150, 100, 75, 50, 0], rate: 0.1 },
  { from: 22250, fixed: [200, 150, 125, 100, 50], rate: 0.15 },
  { from: 32750, fixed: [1775, 1725, 1700, 1675, 1625], rate: 0.2 },
  { from: 60750, fixed: [7375, 7325, 7300, 7275, 7225], rate: 0.25 },
  { from: 144750, fixed: [28375, 28325, 28300, 28275, 28225], rate: 0.32 },
];

export const IRPS_REFERENCE_SOURCE = {
  title: 'Anexo ao art. 65-A do Código do IRPS (Lei n.º 19/2017)',
  url: 'https://www.at.gov.mz',
  lastVerified: V,
};

/** Monthly minimum wages in force since 1 April 2026 (Diplomas Ministeriais 34–41/2026). */
export const MINIMUM_WAGES_2026: MinimumWage[] = [
  { sector: 'Agricultura, pecuária, caça e silvicultura', value: 7072.0, since: '2026-04-01' },
  { sector: 'Pesca industrial e semi-industrial', value: 7063.22, since: '2026-04-01' },
  { sector: 'Pesca de kapenta', value: 4991.09, since: '2026-04-01' },
  { sector: 'Indústria extractiva — grandes empresas', value: 16239.06, since: '2026-04-01' },
  { sector: 'Indústria extractiva — pedreiras e areeiros', value: 8488.48, since: '2026-04-01' },
  { sector: 'Indústria extractiva — micro e pequenas (salinas)', value: 6824.17, since: '2026-04-01' },
  { sector: 'Indústria transformadora', value: 10622.5, since: '2026-04-01' },
  { sector: 'Indústria de panificação', value: 7500.0, since: '2026-04-01' },
  { sector: 'Indústria do caju', value: 7000.0, since: '2026-04-01' },
  { sector: 'Electricidade, gás e água — grandes empresas', value: 12775.0, since: '2026-04-01' },
  { sector: 'Electricidade, gás e água — pequenas e médias', value: 10366.0, since: '2026-04-01' },
  { sector: 'Construção', value: 8652.0, since: '2026-04-01' },
  { sector: 'Serviços não financeiros', value: 10845.0, since: '2026-04-01' },
  { sector: 'Hotelaria e turismo', value: 10600.0, since: '2026-04-01' },
  { sector: 'Segurança privada', value: 8690.0, since: '2026-04-01' },
  { sector: 'Venda de combustíveis', value: 10079.0, since: '2026-04-01' },
  { sector: 'Bancos e seguradoras', value: 20361.43, since: '2026-04-01' },
  { sector: 'Microfinanças', value: 17924.17, since: '2026-04-01' },
  { sector: 'Função pública', value: 8758.0, since: '2022-01-01' },
];

/** Monthly IRPS withholding from a table; returns null when the table is empty. */
export function irpsWithholding(table: IrpsBand[], gross: number, dependants: number): number | null {
  if (!table.length) return null;
  const bands = [...table].sort((a, b) => a.from - b.from);
  let band: IrpsBand | undefined;
  for (const b of bands) if (gross >= b.from) band = b;
  if (!band) return 0;
  const fixed = band.fixed[Math.min(Math.max(0, Math.floor(dependants)), band.fixed.length - 1)];
  if (fixed == null) return 0;
  return Math.round((fixed + band.rate * (gross - band.from)) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Runtime snapshot with user overrides
// ---------------------------------------------------------------------------

export type LegalOverrides = {
  inssTaxaTrabalhador?: number;
  inssTaxaEmpregador?: number;
  irpsTable?: IrpsBand[];
  minimumWages?: MinimumWage[];
};

export function resolveLegalValue(id: LegalRefId, o: LegalOverrides = {}): unknown {
  if (id === 'inssTaxaTrabalhador' && o.inssTaxaTrabalhador != null) return o.inssTaxaTrabalhador;
  if (id === 'inssTaxaEmpregador' && o.inssTaxaEmpregador != null) return o.inssTaxaEmpregador;
  if (id === 'irpsRetencao') return o.irpsTable ?? [];
  if (id === 'salarioMinimo') return o.minimumWages ?? MINIMUM_WAGES_2026;
  return legalEntry(id).value;
}

export function legalCitation(id: LegalRefId): string {
  const e = legalEntry(id);
  const law = LAWS[e.law] ?? { short: '', cite: '' };
  return e.article ? `${e.article} ${law.cite}` : law.short;
}
