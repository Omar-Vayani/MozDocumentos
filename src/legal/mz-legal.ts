// Every legal value used by the templates lives here — rates, deadlines,
// article references and sources — so it can be corrected without touching
// templates. Never invent article numbers: if a reference is uncertain, leave
// `article` out and set `confidence: 'confirm'`.
//
// Primary source: Lei n.º 13/2023, de 25 de Agosto (Lei do Trabalho), BR I Série
// n.º 165, 2.º Suplemento. Entered into force 180 days after publication
// (21 February 2024) and revoked Lei n.º 23/2007.

import type { L10n } from '@/documents/model';

export type Confidence = 'verified' | 'confirm';

export type LawId = 'lei13_2023' | 'codigoCivil' | 'cirps' | 'inss' | 'salarioMinimo2026';

export const LAWS: Record<LawId, { short: string; cite: string; title: string; url?: string }> = {
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
  salarioMinimo2026: {
    short: 'Salários mínimos 2026',
    cite: 'dos Diplomas Ministeriais n.º 34/2026 a 41/2026',
    title: 'Diplomas Ministeriais n.º 34/2026 a 41/2026, de 20 de Maio (em vigor desde 1 de Abril de 2026)',
    url: 'https://www.inss.gov.mz/salarios-minimos-em-vigor/',
  },
};

export const LAW_IN_FORCE_SINCE = '2024-02-21';

export type LegalEntry = {
  title: L10n;
  summary: L10n;
  law: LawId;
  article?: string;
  value?: unknown;
  sourceUrl?: string;
  lastVerified: string;
  confidence: Confidence;
  note?: L10n;
};

const LEI = LAWS.lei13_2023.url;
const V = '2026-10-12';

export const LEGAL = {
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
    value: { maisDe1Ano: 90, de6MesesA1Ano: 30, ate6Meses: 15 }, // dias (3 meses ≈ 90 dias)
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
      pt: 'Dura enquanto se mantiver a necessidade temporária (substituição, obra, projecto). Se ultrapassar 6 anos converte-se em contrato por tempo indeterminado.',
      en: 'Lasts while the temporary need lasts (replacement, project). Beyond 6 years it becomes permanent.',
    },
    law: 'lei13_2023',
    article: 'art. 46.º',
    value: { duracaoMaxAnos: 6 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  caducidadePrazoIncertoAviso: {
    title: { pt: 'Aviso de caducidade — prazo incerto', en: 'Expiry notice — open-ended term' },
    summary: {
      pt: 'O empregador avisa com 15 dias (mais de 6 meses e até 3 anos de trabalho) ou 30 dias (mais de 3 e até 6 anos).',
      en: 'The employer gives 15 days’ notice (over 6 months and up to 3 years of work) or 30 days (over 3 and up to 6 years).',
    },
    law: 'lei13_2023',
    article: 'art. 46.º',
    value: { ate3Anos: 15, mais3Anos: 30 },
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
    article: 'art. 108.º',
    value: { primeiroAno: 12, anosSeguintes: 30, porMesPrazoCurto: 1, blocoMinimo: 6 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'verified',
  },
  deverSigilo: {
    title: { pt: 'Dever de sigilo', en: 'Duty of confidentiality' },
    summary: {
      pt: 'O trabalhador deve guardar sigilo sobre a informação da empresa a que tem acesso. Confirme o artigo aplicável.',
      en: 'Employees must keep company information confidential. Confirm the applicable article.',
    },
    law: 'lei13_2023',
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'confirm',
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
      pt: '7 dias, a partir do dia seguinte ao nascimento, comunicados por escrito ao empregador; 60 dias em caso de morte ou incapacidade da mãe.',
      en: '7 days from the day after the birth, notified to the employer in writing; 60 days if the mother dies or is incapacitated.',
    },
    law: 'lei13_2023',
    article: 'art. 15.º',
    value: { dias: 7, morteMae: 60 },
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
      pt: 'Faltas previsíveis comunicadas com pelo menos 2 dias de antecedência. Faltas imprevisíveis: avisar o empregador logo que possível, pessoalmente ou por terceiro.',
      en: 'Foreseeable absences notified at least 2 days in advance. Unforeseeable absences: notify the employer as soon as possible, in person or through someone else.',
    },
    law: 'lei13_2023',
    value: { antecedenciaDias: 2 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'confirm',
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
    article: 'art. 66.º',
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
    article: 'art. 72.º',
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
    article: 'art. 66.º',
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
    article: 'art. 72.º',
    value: { meses: 6 },
    sourceUrl: LEI,
    lastVerified: V,
    confidence: 'confirm',
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
    confidence: 'confirm',
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
  certificadoTrabalho: {
    title: { pt: 'Certificado de trabalho', en: 'Certificate of employment' },
    summary: {
      pt: 'Em qualquer caso de cessação, o empregador entrega um certificado com o tempo de serviço, o nível de qualificação alcançado e os cargos exercidos. Só inclui outras referências a pedido escrito do trabalhador, que o pode contestar em 30 dias.',
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
      pt: 'Uma parte obriga-se a proporcionar à outra o resultado do seu trabalho, com ou sem retribuição, sem subordinação jurídica. Se houver horário, ordens e salário fixo, pode ser considerado contrato de trabalho.',
      en: 'One party provides the other with the result of its work, without legal subordination. Fixed hours, orders and a fixed salary may make it an employment contract.',
    },
    law: 'codigoCivil',
    article: 'art. 1154.º',
    lastVerified: V,
    confidence: 'confirm',
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
    confidence: 'confirm',
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
    confidence: 'confirm',
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
    confidence: 'confirm',
  },
} satisfies Record<string, LegalEntry>;

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
  const law = LAWS[e.law];
  return e.article ? `${e.article} ${law.cite}` : law.short;
}
