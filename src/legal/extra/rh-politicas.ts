// Legal values for the "rh-politicas" documents (company policies, workplace
// records and collective labour relations). Keys must be unique across all
// legal files: every key here starts with "rhp".
//
// Lei n.º 13/2023 (Lei do Trabalho) entries were read in the full text of the
// Boletim da República (I Série n.º 165, 2.º Suplemento, 25-08-2023). Lei n.º
// 19/2014 (HIV and AIDS at work) and the insurance practice for work accidents
// come from secondary sources: 'confirm', no article number.
import type { LawInfo, LegalEntryDef } from '../types';

const LEI13 = 'https://faolex.fao.org/docs/pdf/moz221728.pdf';
const V = '2026-10-14';

export const LAWS_RH_POLITICAS = {} satisfies Record<string, LawInfo>;

export const LEGAL_RH_POLITICAS = {
  // ------------------------------------------------------------------ Regulations, codes and policies
  rhpPoderRegulamentar: {
    title: { pt: 'Regulamento interno de trabalho', en: 'Internal work regulations' },
    summary: {
      pt: 'O empregador pode elaborar regulamentos internos (organização e disciplina do trabalho, apoio social, uso de instalações e equipamentos, actividades culturais e desportivas); são obrigatórios para médios e grandes empregadores. Os que tratam da organização e disciplina do trabalho entram em vigor só depois de consultado o comité sindical (ou, na falta, o órgão sindical competente) e são comunicados ao órgão competente da administração do trabalho. Para os trabalhadores já admitidos, novas condições valem como proposta de adesão. O regulamento é divulgado no local de trabalho.',
      en: 'Employers may adopt internal regulations (work organisation and discipline, welfare, use of premises and equipment, cultural and sports activities); they are mandatory for medium and large employers. Rules on organisation and discipline take effect only after consulting the union committee (or the competent union body) and are notified to the labour administration. For existing staff, new conditions are an offer to accept. The regulations must be publicised at the workplace.',
    },
    law: 'lei13_2023',
    article: 'art. 62.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpCodigosConduta: {
    title: { pt: 'Códigos de conduta', en: 'Codes of conduct' },
    summary: {
      pt: 'Os sujeitos da relação de trabalho podem estabelecer códigos de conduta, que constituem fonte de Direito. O empregador pode também manifestar a sua vontade contratual através do código de conduta, a que o trabalhador adere expressa ou tacitamente.',
      en: 'Employers and employees may adopt codes of conduct, which are a source of law. The employer may also express its contractual terms through a code of conduct, which the employee accepts expressly or tacitly.',
    },
    law: 'lei13_2023',
    article: 'arts. 17.º e 38.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpDeveresTrabalhador: {
    title: { pt: 'Deveres do trabalhador', en: 'Duties of the employee' },
    summary: {
      pt: 'Pontualidade e assiduidade; zelo e diligência; respeito e lealdade; obediência a ordens legais; conservar os bens confiados; sigilo profissional; não usar meios da empresa para fins pessoais sem autorização; não fazer concorrência desonesta; colaborar na segurança e higiene; proteger os bens; contribuir para a produtividade e o bom ambiente; denunciar actos lesivos.',
      en: 'Punctuality and attendance; care and diligence; respect and loyalty; obeying lawful orders; looking after equipment; professional secrecy; no personal use of company resources without permission; no unfair competition; cooperating on health and safety; protecting assets; productivity and a good working environment; reporting harmful acts.',
    },
    law: 'lei13_2023',
    article: 'art. 59.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpDeveresEmpregador: {
    title: { pt: 'Deveres do empregador', en: 'Duties of the employer' },
    summary: {
      pt: 'Respeitar os direitos e garantias; cumprir as normas de higiene e segurança e investigar os acidentes; tratar com correcção; proporcionar boas condições físicas e morais; pagar remuneração justa; atribuir e manter a categoria; garantir local e horário; permitir a actividade sindical; não obrigar a comprar bens ao empregador; promover a saúde e a nutrição. Médios e grandes empregadores promovem actividades culturais e desportivas.',
      en: 'Respect rights; comply with health and safety rules and investigate accidents; treat employees properly; provide good physical and moral conditions; pay fairly; assign and keep the job grade; guarantee place and hours; allow union activity; not force purchases; promote health and nutrition. Medium and large employers must promote cultural and sports activities.',
    },
    law: 'lei13_2023',
    article: 'art. 60.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpPrivacidade: {
    title: { pt: 'Direitos de personalidade e privacidade', en: 'Personality rights and privacy' },
    summary: {
      pt: 'O empregador respeita a vida, a integridade física e moral, a honra, o bom nome, a privacidade e a imagem do trabalhador. Não pode exigir informação sobre a vida privada (família, vida sexual, saúde, convicções), salvo exigência legal fundamentada por escrito. Os dados pessoais obtidos sob reserva não são cedidos a terceiros sem consentimento expresso.',
      en: 'The employer respects the employee’s life, physical and moral integrity, honour, reputation, privacy and image. It may not require information about private life (family, sex life, health, beliefs) unless the law requires it and the reason is given in writing. Personal data obtained in confidence is not passed to third parties without express consent.',
    },
    law: 'lei13_2023',
    article: 'arts. 7.º e 8.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpCorrespondencia: {
    title: { pt: 'Correspondência e uso das tecnologias de informação', en: 'Correspondence and use of IT' },
    summary: {
      pt: 'A correspondência pessoal do trabalhador, por qualquer meio (cartas, mensagens electrónicas), é inviolável. O empregador pode fixar no regulamento interno regras e limites de utilização das tecnologias de informação.',
      en: 'The employee’s personal correspondence, by any means (letters, electronic messages), is inviolable. The employer may set rules and limits on the use of IT in the internal regulations.',
    },
    law: 'lei13_2023',
    article: 'art. 11.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpAssedio: {
    title: { pt: 'Assédio no local de trabalho', en: 'Harassment at work' },
    summary: {
      pt: 'Assédio é o conjunto de comportamentos e práticas inaceitáveis (ou a ameaça deles), pontuais ou recorrentes, que causem ou possam causar dano físico, psicológico, sexual ou económico, incluindo a violência e o assédio com base no género. O assédio sexual é o comportamento indesejado de carácter sexual, verbal, não verbal ou físico. O assédio, no local de trabalho ou fora dele, é infracção disciplinar. Praticado pelo empregador, superior hierárquico ou mandatário, é contra-ordenação muito grave e dá ao trabalhador direito a indemnização de 20 vezes o salário mínimo do sector, além da indemnização por danos nos termos gerais.',
      en: 'Harassment is unacceptable behaviour or practices (or threats of them), one-off or repeated, that cause or may cause physical, psychological, sexual or economic harm, including gender-based violence and harassment. Sexual harassment is unwanted conduct of a sexual nature, verbal, non-verbal or physical. Harassment, at work or outside it, is a disciplinary offence. If committed by the employer, a superior or an agent it is a very serious offence and the employee is entitled to 20 times the sector minimum wage, plus damages under general law.',
    },
    law: 'lei13_2023',
    article: 'arts. 67.º e 68.º',
    value: { indemnizacaoSalariosMinimos: 20 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpHivTrabalho: {
    title: { pt: 'HIV e SIDA no local de trabalho (Lei do Trabalho)', en: 'HIV and AIDS at work (Labour Law)' },
    summary: {
      pt: 'É proibido realizar testes ou exames ao candidato a emprego ou ao trabalhador para apurar o seu estado sobre o HIV/SIDA. As empresas podem estabelecer políticas de prevenção e combate ao HIV/SIDA e a outras doenças endémicas, respeitando o consentimento do trabalhador para testes de seroprevalência.',
      en: 'Testing job applicants or employees to find out their HIV status is prohibited. Companies may adopt HIV/AIDS and endemic-disease prevention policies, respecting the employee’s consent to any prevalence testing.',
    },
    law: 'lei13_2023',
    article: 'arts. 9.º e 220.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpHivLei19_2014: {
    title: { pt: 'Lei de protecção do trabalhador vivendo com HIV e SIDA', en: 'Law protecting employees living with HIV and AIDS' },
    summary: {
      pt: 'Aplica-se a trabalhadores e candidatos a emprego dos sectores público e privado, incluindo o trabalho doméstico. Proíbe a discriminação e a estigmatização em razão do estado serológico (admissão, promoção, formação, despedimento), garante a confidencialidade e o consentimento para o teste e prevê programas de informação e prevenção no local de trabalho.',
      en: 'Applies to employees and job applicants in the public and private sectors, including domestic work. Prohibits discrimination and stigma based on HIV status (hiring, promotion, training, dismissal), guarantees confidentiality and consent to testing and provides for workplace information and prevention programmes.',
    },
    law: 'lei19_2014',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Texto integral não consultado. Confirme os artigos no Boletim da República antes de os citar.',
      en: 'Full text not consulted. Confirm the articles in the official gazette before citing them.',
    },
  },

  // ------------------------------------------------------------------ Health and safety, accidents
  rhpHigieneSeguranca: {
    title: { pt: 'Higiene, saúde e segurança no trabalho', en: 'Occupational health and safety' },
    summary: {
      pt: 'O empregador garante condições de higiene, saúde e segurança, informa os trabalhadores dos riscos do posto, instrui sobre as regras e fornece equipamentos de protecção e roupas de trabalho apropriados. O trabalhador vela pela sua segurança e pela dos outros e colabora; a violação culposa das regras é infracção disciplinar, graduada segundo o risco criado. Podem ser criadas comissões de segurança no trabalho, com representantes dos trabalhadores e do empregador; são obrigatórias em actividades de risco excepcional (construção civil, indústria extractiva, metalurgia, escavações, petróleo e gás, explosivos, electricidade, produtos tóxicos, pedreiras).',
      en: 'The employer ensures safe and healthy conditions, informs employees of job risks, trains them on the rules and provides suitable protective equipment and work clothing. Employees look after their own and others’ safety and cooperate; culpable breach of the rules is a disciplinary offence, graded by the risk created. Safety committees with employee and employer representatives may be set up; they are mandatory in high-risk activities (construction, mining, metalworking, excavation, oil and gas, explosives, electricity, toxic products, quarries).',
    },
    law: 'lei13_2023',
    article: 'arts. 220.º e 221.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpAcidenteTrabalho: {
    title: { pt: 'Acidente de trabalho', en: 'Work accident' },
    summary: {
      pt: 'É acidente de trabalho o sinistro no local e durante o tempo de trabalho que cause lesão, perturbação funcional ou doença de que resulte morte ou redução da capacidade de trabalho ou de ganho. Inclui o acidente no trajecto em transporte do empregador ou de percurso perigoso, antes ou depois do trabalho, em serviço fora do local e em actividades organizadas pelo empregador. Não é indemnizável o acidente provocado intencionalmente, por negligência indesculpável, por privação do uso da razão ou por força maior que não seja risco normal da profissão.',
      en: 'A work accident is an event at the place and time of work causing injury, functional disorder or illness resulting in death or reduced capacity to work or earn. It includes commuting in employer transport or on a dangerous route, before or after work, on duty away from the workplace and in employer-organised activities. Accidents caused intentionally, by inexcusable negligence, by loss of reason or by force majeure that is not a normal job risk are not compensated.',
    },
    law: 'lei13_2023',
    article: 'arts. 226.º e 227.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpAcidenteParticipacao: {
    title: { pt: 'Participação e assistência no acidente de trabalho', en: 'Reporting and assistance after a work accident' },
    summary: {
      pt: 'O acidente e as suas consequências são participados ao empregador pelo trabalhador ou por interposta pessoa. O empregador presta os primeiros socorros e o transporte ao centro de saúde, investiga as causas com a comissão de segurança e, depois do inquérito e do registo, informa o órgão competente da administração do trabalho sobre a natureza, as causas e as consequências do acidente. O sinistrado tem direito a assistência médica e medicamentosa por conta do empregador ou da seguradora e pode pedir um adiantamento de um mês de indemnização ou pensão. O empregador suporta o funeral.',
      en: 'The accident and its consequences are reported to the employer by the employee or someone on their behalf. The employer gives first aid and transport to a health facility, investigates the causes with the safety committee and, after the inquiry and record, informs the labour administration of the nature, causes and consequences. The injured employee is entitled to medical care paid by the employer or insurer and may ask for an advance of one month’s compensation or pension. The employer pays funeral costs.',
    },
    law: 'lei13_2023',
    article: 'arts. 230.º a 232.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpSeguroAcidentes: {
    title: { pt: 'Seguro de acidentes de trabalho', en: 'Work accident insurance' },
    summary: {
      pt: 'O empregador deve ter um seguro colectivo que cubra os acidentes de trabalho e as doenças profissionais dos seus trabalhadores. Estes riscos não são cobertos pelo INSS.',
      en: 'The employer must hold collective insurance covering its employees’ work accidents and occupational diseases. These risks are not covered by INSS.',
    },
    law: 'lei13_2023',
    article: 'art. 235.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpSeguradoraParticipacao: {
    title: { pt: 'Participação do sinistro à seguradora', en: 'Claim notice to the insurer' },
    summary: {
      pt: 'A participação à seguradora faz-se no impresso próprio de cada seguradora e no prazo fixado na apólice, acompanhada do relatório do acidente, do boletim de alta ou atestado médico e das despesas. O prazo não está fixado na Lei do Trabalho.',
      en: 'The claim is made on each insurer’s own form within the period set in the policy, with the accident report, the medical certificate and expenses. The Labour Law does not set the period.',
    },
    law: 'lei13_2023',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirme o prazo na apólice e se existe regulamento sectorial aplicável.', en: 'Check the policy period and any sector regulation.' },
  },
  rhpAcidentePrescricao: {
    title: { pt: 'Prescrição do direito à indemnização por acidente', en: 'Time limit for accident compensation' },
    summary: {
      pt: 'O direito à indemnização prescreve se não for exigido no prazo de 1 ano a contar da alta clínica formalmente comunicada ou da data do acidente que cause morte ou incapacidade permanente. O prazo não corre enquanto o empregador sem seguro mantiver o sinistrado ao serviço.',
      en: 'The right to compensation lapses if not claimed within 1 year of the formally notified medical discharge, or of the accident if it causes death or permanent incapacity. It does not run while an uninsured employer keeps the injured employee at work.',
    },
    law: 'lei13_2023',
    article: 'art. 239.º',
    value: { anos: 1 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpJuntaSaude: {
    title: { pt: 'Apresentação à Junta de Saúde', en: 'Referral to the medical board' },
    summary: {
      pt: 'Com faltas por doença por mais de 15 dias seguidos, o empregador pode submeter o trabalhador à Junta de Saúde ou a outra entidade licenciada para avaliar a capacidade laboral. Pode também fazê-lo, por iniciativa própria ou a pedido do trabalhador, quando a saúde afecte o rendimento ou houver mais de 5 dias de faltas por doença num trimestre. A recusa injustificada é infracção disciplinar.',
      en: 'After more than 15 consecutive days of sick leave the employer may refer the employee to the medical board or another licensed body to assess fitness for work. It may also do so, on its own initiative or at the employee’s request, when health affects performance or there are more than 5 sick days in a quarter. Unjustified refusal is a disciplinary offence.',
    },
    law: 'lei13_2023',
    article: 'art. 113.º',
    value: { diasSeguidos: 15, faltasTrimestre: 5 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Working time
  rhpTrabalhoExtraordinario: {
    title: { pt: 'Trabalho extraordinário', en: 'Overtime' },
    summary: {
      pt: 'É extraordinário o trabalho fora do horário normal, admitido só para acréscimos de trabalho que não justifiquem nova admissão ou por motivos ponderosos. Limites por trabalhador: 96 horas por trimestre, 8 horas por semana e 200 horas por ano. Não conta o trabalho de quem está isento de horário nem o que compensa ausências do próprio trabalhador. O empregador tem sempre um sistema de registo.',
      en: 'Overtime is work outside normal hours, allowed only for extra work that does not justify hiring or for compelling reasons. Limits per employee: 96 hours a quarter, 8 hours a week and 200 hours a year. Work by exempt staff or to make up the employee’s own absences does not count. The employer must keep a register.',
    },
    law: 'lei13_2023',
    article: 'art. 99.º',
    value: { trimestre: 96, semana: 8, ano: 200 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpTrabalhoExcepcional: {
    title: { pt: 'Trabalho excepcional (descanso e feriados)', en: 'Work on rest days and holidays' },
    summary: {
      pt: 'É excepcional o trabalho em dia de descanso semanal, complementar, feriado ou tolerância de ponto. O empregador mantém um registo, com anotações antes e depois da prestação e o fundamento, visado pelo trabalhador. Dá direito a um dia completo de descanso compensatório num dos 3 dias seguintes, ou meio dia se o trabalho não ultrapassar 5 horas.',
      en: 'Exceptional work is work on a weekly or complementary rest day, public holiday or official day off. The employer keeps a register, filled in before and after, with the reason, countersigned by the employee. It gives a full compensatory rest day within the next 3 days, or half a day if the work does not exceed 5 hours.',
    },
    law: 'lei13_2023',
    article: 'art. 98.º',
    value: { compensatorioDias: 3, meioDiaHoras: 5 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpRemuneracaoExtra: {
    title: { pt: 'Remuneração do trabalho extraordinário, excepcional e nocturno', en: 'Pay for overtime, rest-day and night work' },
    summary: {
      pt: 'Trabalho extraordinário: remuneração normal acrescida de 50% e, no período nocturno até ao início do período normal do dia seguinte, de 100%. Trabalho excepcional: acréscimo de 100%. Trabalho nocturno (a partir das 20 horas): acréscimo de 25%.',
      en: 'Overtime: normal pay plus 50% and, at night until the next normal start, plus 100%. Rest-day or holiday work: plus 100%. Night work (from 8 p.m.): plus 25%.',
    },
    law: 'lei13_2023',
    article: 'arts. 100.º e 125.º',
    value: { extraordinario: 50, extraordinarioNocturno: 100, excepcional: 100, nocturno: 25 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'O art. 125.º, n.º 1 refere 50% "se prestado até às 24 horas" e 100% "para além das 20 horas". Confirme com um jurista a hora a partir da qual se aplica a taxa de 100%.',
      en: 'Art. 125(1) says 50% "if performed until midnight" and 100% "after 8 p.m.". Confirm with a lawyer from what time the 100% rate applies.',
    },
  },
  rhpLicencaSemRemuneracao: {
    title: { pt: 'Licença sem remuneração', en: 'Unpaid leave' },
    summary: {
      pt: 'O empregador pode conceder, a pedido justificado do trabalhador, licença sem remuneração pelo tempo acordado. Durante a licença o contrato fica suspenso: cessam os direitos e deveres ligados à prestação efectiva de trabalho, mantendo-se a lealdade e o respeito; o trabalhador conserva o posto de trabalho. Um contrato a prazo pode caducar durante a licença, mediante comunicação escrita.',
      en: 'The employer may grant unpaid leave, at the employee’s justified request, for the agreed time. The contract is suspended: rights and duties tied to actual work cease, loyalty and respect remain, and the employee keeps the job. A fixed-term contract may expire during the leave, by written notice.',
    },
    law: 'lei13_2023',
    article: 'arts. 116.º e 132.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpFeriasColectivas: {
    title: { pt: 'Férias colectivas', en: 'Collective leave (shutdown)' },
    summary: {
      pt: 'Quando a natureza e a organização do trabalho o exigirem ou permitirem, o empregador, mediante consulta prévia ao órgão sindical, pode estabelecer que todos os trabalhadores gozem as férias ao mesmo tempo. O plano de férias é elaborado em coordenação com o órgão sindical; o trabalhador tem direito ao gozo seguido das férias.',
      en: 'Where the nature and organisation of work require or allow it, the employer may, after consulting the union body, have all employees take leave at the same time. The leave plan is drawn up with the union body; employees are entitled to uninterrupted leave.',
    },
    law: 'lei13_2023',
    article: 'art. 109.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Changes to the employment relationship
  rhpModificacaoContrato: {
    title: { pt: 'Modificação do contrato de trabalho', en: 'Changes to the employment contract' },
    summary: {
      pt: 'O contrato pode ser modificado por acordo ou por decisão unilateral do empregador nos casos e limites da lei. A decisão unilateral exige consulta prévia do órgão sindical e comunicação ao órgão da administração do trabalho. Fundamentos: requalificação, reorganização, alteração das circunstâncias, mobilidade geográfica, conclusão de formação, força maior; se o trabalhador discordar, o empregador prova o fundamento. Por acordo, a alteração das condições nunca pode diminuir a remuneração nem a posição hierárquica com fundamento na alteração das circunstâncias.',
      en: 'The contract may be changed by agreement or by the employer alone where the law allows. A unilateral change requires prior consultation of the union body and notice to the labour administration. Grounds: retraining, reorganisation, changed circumstances, relocation, completed training, force majeure; if the employee disagrees, the employer must prove them. By agreement, changes based on altered circumstances may never reduce pay or rank.',
    },
    law: 'lei13_2023',
    article: 'arts. 77.º a 80.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpTransferencia: {
    title: { pt: 'Transferência do trabalhador', en: 'Transfer of an employee' },
    summary: {
      pt: 'Transferência temporária: por circunstâncias excepcionais de organização, comunicada ao órgão da administração do trabalho, até 6 meses (até 1 ano por exigências imperiosas). Definitiva: só em caso de mudança total ou parcial do estabelecimento, salvo estipulação em contrário; fora do domicílio habitual, com prejuízo sério que separe o trabalhador da família, exige acordo, podendo o trabalhador rescindir com indemnização. O empregador paga as despesas impostas pela transferência, incluindo a mudança do agregado. Não é transferência a deslocação até 30 km nem a missão de serviço. A transferência consta de documento escrito, fundamentado, com pelo menos 30 dias de antecedência.',
      en: 'Temporary transfer: for exceptional organisational reasons, notified to the labour administration, up to 6 months (1 year if imperative). Permanent: only when all or part of the establishment moves, unless agreed otherwise; away from home with serious harm separating the employee from family it needs agreement, and the employee may resign with compensation. The employer pays costs caused by the transfer, including moving the household. A move within 30 km or a business trip is not a transfer. The transfer must be in writing, with reasons, at least 30 days in advance.',
    },
    law: 'lei13_2023',
    article: 'art. 82.º',
    value: { temporariaMeses: 6, temporariaMaxMeses: 12, distanciaKm: 30, avisoDias: 30 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpProtecaoSindical: {
    title: { pt: 'Protecção dos representantes sindicais', en: 'Protection of union representatives' },
    summary: {
      pt: 'Os membros dos órgãos das associações sindicais, dos comités sindicais e os delegados sindicais não podem ser transferidos sem consulta prévia àquelas estruturas, nem prejudicados pelo exercício das funções sindicais.',
      en: 'Members of trade-union bodies, union committees and union delegates may not be transferred without prior consultation of those bodies, nor be prejudiced for their union work.',
    },
    law: 'lei13_2023',
    article: 'art. 167.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpSuspensaoEconomica: {
    title: { pt: 'Suspensão do contrato por motivos económicos', en: 'Suspension of contracts for economic reasons' },
    summary: {
      pt: 'O empregador pode suspender contratos por razões de mercado, tecnológicas ou outras que afectem a actividade. Comunica por escrito a cada trabalhador os fundamentos, a data de início e a duração, com cópia simultânea ao Ministério do Trabalho e ao órgão sindical (ou associação sindical representativa). O trabalhador recebe 75%, 50% e 25% da remuneração no 1.º, 2.º e 3.º mês, nunca abaixo do salário mínimo do sector (micro, pequenas e médias: não menos de 50% do salário mínimo). Depois de 3 meses, suspende-se o pagamento e as partes podem acordar modificação ou cessação. Não é permitido contratar substitutos. A Inspecção pode pôr termo à suspensão.',
      en: 'The employer may suspend contracts for market, technological or other reasons affecting the business. It notifies each employee in writing of the reasons, start date and duration, copying the Ministry of Labour and the union body at the same time. Employees receive 75%, 50% and 25% of pay in months 1, 2 and 3, never below the sector minimum wage (micro, small and medium employers: at least 50% of it). After 3 months pay stops and the parties may agree changes or termination. Replacements may not be hired. The Inspectorate may end the suspension.',
    },
    law: 'lei13_2023',
    article: 'art. 133.º',
    value: { mes1: 75, mes2: 50, mes3: 25, pmeMinimoPercent: 50, meses: 3 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpSuspensaoForcaMaior: {
    title: { pt: 'Suspensão do contrato por força maior ou caso fortuito', en: 'Suspension for force majeure' },
    summary: {
      pt: 'A relação de trabalho pode ser suspensa por força maior (catástrofes, cheias, ciclones, epidemias, incêndios…), caso fortuito ou agressão, guerra ou insurreição que afectem a actividade, salvo se forem risco normal da actividade. O empregador comunica por escrito a cada trabalhador os fundamentos, o início e, se possível, a duração, com cópia ao Ministério do Trabalho e ao órgão sindical. Não pode contratar substitutos (salvo técnicos especializados para readaptação). No fim da suspensão retoma o pagamento da remuneração normal.',
      en: 'Employment may be suspended for force majeure (disasters, floods, cyclones, epidemics, fires…), unforeseeable events or aggression, war or insurrection affecting the business, unless a normal business risk. The employer notifies each employee in writing of the reasons, start and, if possible, duration, copying the Ministry of Labour and the union body. Replacements may not be hired (except specialists for readaptation). Normal pay resumes when the suspension ends.',
    },
    law: 'lei13_2023',
    article: 'art. 134.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpRegressoSuspensao: {
    title: { pt: 'Regresso após a suspensão', en: 'Return after suspension' },
    summary: {
      pt: 'O trabalhador conserva o posto de trabalho e apresenta-se logo que o impedimento cesse ou, em caso justificado, no prazo de 3 dias úteis. A não reintegração corresponde a despedimento sem justa causa.',
      en: 'The employee keeps the job and reports back as soon as the impediment ends or, if justified, within 3 working days. Failing to reinstate is dismissal without cause.',
    },
    law: 'lei13_2023',
    article: 'art. 132.º',
    value: { diasUteis: 3 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpTransmissaoEmpresa: {
    title: { pt: 'Transmissão da empresa ou estabelecimento', en: 'Transfer of a business' },
    summary: {
      pt: 'Com a transmissão, os direitos e obrigações dos contratos de trabalho, incluindo a antiguidade, passam para o adquirente, solidariamente responsável pelas obrigações vencidas no último ano. Transmitente e adquirente informam e consultam previamente os órgãos sindicais (ou a comissão de trabalhadores) sobre a data, os motivos e as consequências, e podem afixar aviso dando aos trabalhadores 60 dias para reclamarem os seus créditos, sob pena de caducidade.',
      en: 'On a transfer, employment rights and obligations, including seniority, pass to the acquirer, jointly liable for obligations due in the last year. Both parties must inform and consult the union bodies (or workers’ committee) on the date, reasons and consequences, and may post a notice giving employees 60 days to claim what they are owed, or lose the claim.',
    },
    law: 'lei13_2023',
    article: 'arts. 83.º e 84.º',
    value: { reclamarCreditosDias: 60 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Training, appraisal, complaints
  rhpFormacao: {
    title: { pt: 'Formação profissional dos trabalhadores', en: 'Employee training' },
    summary: {
      pt: 'Os trabalhadores têm direito à formação profissional; a formação dos trabalhadores no activo é assegurada pelos empregadores, que organizam planos anuais de formação, podendo conferir certificado.',
      en: 'Employees are entitled to training; employers provide training for their staff and organise annual training plans, which may lead to a certificate.',
    },
    law: 'lei13_2023',
    article: 'arts. 245.º e 248.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpPactoPermanencia: {
    title: { pt: 'Pacto de permanência (formação paga pelo empregador)', en: 'Retention clause for paid training' },
    summary: {
      pt: 'A Lei do Trabalho não regula o pacto de permanência. É usado ao abrigo da liberdade contratual: o trabalhador cuja formação foi paga pelo empregador compromete-se a não denunciar o contrato durante certo período ou a reembolsar parte das despesas, proporcionalmente ao tempo em falta. O direito do trabalhador de denunciar o contrato mantém-se; o pacto só fixa a compensação. Despesas excessivas ou períodos longos podem ser reduzidos pelo tribunal.',
      en: 'The Labour Law does not regulate retention clauses. They rest on freedom of contract: an employee whose training was paid by the employer agrees not to resign for a period or to repay part of the costs, in proportion to the time left. The employee’s right to resign remains; the clause only sets the compensation. Excessive costs or long periods may be reduced by a court.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Sem norma expressa na Lei n.º 13/2023. Confirme com um jurista a duração máxima razoável.',
      en: 'No express rule in Law 13/2023. Confirm a reasonable maximum length with a lawyer.',
    },
  },
  rhpAvaliacao: {
    title: { pt: 'Avaliação profissional e promoção', en: 'Performance appraisal and promotion' },
    summary: {
      pt: 'A avaliação garante a ocupação dos postos por quem reúne as condições e contribui para o ordenamento salarial. Tem lugar para preencher vagas, averiguar baixo rendimento, a pedido do trabalhador, por decisão do tribunal ou da direcção, ou sob proposta sindical; podem existir comissões de avaliação. Na promoção contam as qualificações, a atitude, o esforço de valorização, a conduta disciplinar, a experiência e a antiguidade; a promoção é registada no processo individual e aditada ao contrato.',
      en: 'Appraisal ensures posts are held by qualified people and supports pay structures. It takes place to fill vacancies, investigate low performance, at the employee’s request, by court or management decision, or on a union proposal; appraisal committees may exist. Promotion considers qualifications, attitude, self-development, disciplinary record, experience and seniority; it is recorded in the personnel file and added to the contract.',
    },
    law: 'lei13_2023',
    article: 'arts. 251.º e 252.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpReclamacaoInterna: {
    title: { pt: 'Reclamação e recurso interno', en: 'Internal complaint and appeal' },
    summary: {
      pt: 'Sem prejuízo dos meios judiciais ou extrajudiciais, o trabalhador pode reclamar junto de quem tomou a decisão disciplinar ou recorrer para o superior hierárquico. A reclamação ou recurso hierárquico escrito suspende o prazo de prescrição por 15 dias.',
      en: 'Without prejudice to court or out-of-court remedies, the employee may complain to whoever took the disciplinary decision or appeal to a superior. A written complaint or internal appeal suspends the limitation period for 15 days.',
    },
    law: 'lei13_2023',
    article: 'arts. 57.º e 66.º',
    value: { suspensaoDias: 15 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Collective relations
  rhpEstruturasSindicais: {
    title: { pt: 'Comité sindical e representação dos trabalhadores', en: 'Union committee and employee representation' },
    summary: {
      pt: 'Os trabalhadores organizam-se em delegado sindical (pequenas empresas), comité sindical ou de empresa, sindicato e confederação. Sem órgão sindical, os direitos sindicais cabem ao órgão sindical superior ou a uma comissão de trabalhadores eleita em assembleia convocada por pelo menos 20% dos trabalhadores. O sindicato comunica ao empregador a identificação dos membros do comité sindical eleito no prazo máximo de 15 dias após a constituição.',
      en: 'Employees organise as a union delegate (small firms), a union or works committee, a union and a confederation. Where there is no union body, union rights belong to the higher union body or to a workers’ committee elected at a meeting called by at least 20% of employees. The union notifies the employer of the elected committee members within 15 days.',
    },
    law: 'lei13_2023',
    article: 'arts. 161.º e 163.º',
    value: { comissaoPercent: 20, comunicacaoDias: 15 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpReunioesSindicais: {
    title: { pt: 'Reuniões sindicais e assembleia de trabalhadores', en: 'Union and staff meetings' },
    summary: {
      pt: 'Delegados, comités sindicais e sindicatos reúnem nos locais de trabalho, em princípio fora do horário normal. A assembleia de trabalhadores é convocada pelo sindicato ou por pelo menos um terço dos trabalhadores. Reuniões dentro do horário exigem acordo prévio com o empregador. As reuniões são comunicadas ao empregador e aos trabalhadores com pelo menos 24 horas de antecedência.',
      en: 'Union delegates, committees and unions may meet at the workplace, in principle outside working hours. A staff meeting is called by the union or by at least one third of employees. Meetings during working hours need the employer’s prior agreement. Meetings are notified to the employer and employees at least 24 hours in advance.',
    },
    law: 'lei13_2023',
    article: 'art. 165.º',
    value: { avisoHoras: 24 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpGreveDecisao: {
    title: { pt: 'Decisão de recorrer à greve', en: 'Decision to strike' },
    summary: {
      pt: 'A greve é decidida pelos organismos sindicais, após consulta aos trabalhadores. Sem organismo sindical, decide a assembleia geral de trabalhadores convocada por pelo menos 20% dos trabalhadores, que só delibera com dois terços presentes, por maioria absoluta dos presentes. Antes da greve devem tentar-se os meios alternativos de resolução de conflitos.',
      en: 'A strike is decided by the union bodies after consulting employees. Without a union body, a general staff meeting called by at least 20% of employees decides, with two thirds present, by absolute majority of those present. Alternative dispute resolution must be tried first.',
    },
    law: 'lei13_2023',
    article: 'arts. 201.º e 202.º',
    value: { convocacaoPercent: 20 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpGrevePreAviso: {
    title: { pt: 'Pré-aviso de greve', en: 'Strike notice' },
    summary: {
      pt: 'O organismo sindical comunica a greve por escrito, dentro das horas normais de expediente, ao empregador e ao Ministério do Trabalho, com pelo menos 5 dias úteis de antecedência (7 dias nos serviços essenciais). O pré-aviso é acompanhado do caderno reivindicativo e indica os sectores abrangidos, o dia e a hora do início e a duração prevista.',
      en: 'The union gives written notice, during office hours, to the employer and the Ministry of Labour at least 5 working days ahead (7 days in essential services). The notice comes with the list of demands and states the sectors covered, start day and time and expected duration.',
    },
    law: 'lei13_2023',
    article: 'art. 211.º',
    value: { diasUteis: 5, diasEssenciais: 7 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpServicosMinimos: {
    title: { pt: 'Serviços mínimos durante a greve', en: 'Minimum services during a strike' },
    summary: {
      pt: 'Os grevistas asseguram os serviços mínimos indispensáveis à segurança e manutenção dos equipamentos e instalações. Durante o pré-aviso, o órgão sindical e o empregador acordam os serviços mínimos e os trabalhadores que os prestam; sem acordo, decidem os órgãos de mediação e arbitragem. Os dirigentes sindicais não podem ser indicados. Nos serviços essenciais, sem instrumento colectivo, fixam-nos os órgãos locais do Ministério do Trabalho e do sector. O empregador não pode substituir grevistas por pessoas que não trabalhavam na empresa à data do pré-aviso.',
      en: 'Strikers must provide the minimum services needed for the safety and upkeep of equipment and premises. During the notice period the union and employer agree the services and the employees who provide them; failing agreement, mediation bodies decide. Union leaders may not be designated. In essential services, absent a collective agreement, local labour and sector authorities set them. Strikers may not be replaced by people not employed when notice was given.',
    },
    law: 'lei13_2023',
    article: 'arts. 206.º e 209.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpGreveEfeitos: {
    title: { pt: 'Efeitos da greve', en: 'Effects of a strike' },
    summary: {
      pt: 'A greve suspende, para os aderentes, a remuneração e os deveres de subordinação e assiduidade, mas não a antiguidade, a segurança social, as prestações por acidente ou o dever de lealdade. É proibido prejudicar quem adere a greve lícita e proibido o lock-out. Na greve ilícita aplica-se o regime de faltas injustificadas.',
      en: 'A strike suspends pay and the duties of subordination and attendance for strikers, but not seniority, social security, accident benefits or loyalty. Prejudicing those who join a lawful strike and lock-outs are prohibited. In an unlawful strike absences are unjustified.',
    },
    law: 'lei13_2023',
    article: 'arts. 204.º, 207.º, 214.º e 215.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpMedidasExcepcionaisGreve: {
    title: { pt: 'Medidas excepcionais do empregador durante a greve', en: 'Employer’s exceptional measures during a strike' },
    summary: {
      pt: 'O empregador pode suspender total ou parcialmente a actividade enquanto durar a greve, se for imperioso para manter instalações e equipamentos ou garantir a segurança, comunicando-o ao Ministério do Trabalho nas 48 horas seguintes.',
      en: 'The employer may suspend all or part of the business during a strike where essential to maintain premises and equipment or ensure safety, notifying the Ministry of Labour within 48 hours.',
    },
    law: 'lei13_2023',
    article: 'art. 208.º',
    value: { horas: 48 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  // ------------------------------------------------------------------ Apprenticeship and minors
  rhpAprendizagem: {
    title: { pt: 'Contrato de aprendizagem', en: 'Apprenticeship contract' },
    summary: {
      pt: 'A empresa pode admitir aprendizes na especialidade a que a aprendizagem se refere, assegurando, em colaboração com outras instituições, a sua formação profissional. O contrato é escrito e indica obrigatoriamente as partes, o conteúdo e a duração da aprendizagem, o horário e o local, o montante da bolsa de formação e as condições de rescisão. Não confere a qualidade de trabalhador. Pode ser acompanhado de contrato-promessa de trabalho. É proibida a aprendizagem de menores de 12 anos.',
      en: 'A company may take apprentices in the trade concerned and provide their training, with other institutions. The contract is written and must state the parties, content and length of the apprenticeship, hours and place, the training allowance and termination terms. It does not make the apprentice an employee. A promise of employment may be added. Children under 12 may not be apprentices.',
    },
    law: 'lei13_2023',
    article: 'arts. 249.º e 250.º',
    value: { idadeMinima: 12 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  rhpTrabalhoMenores: {
    title: { pt: 'Trabalho de menores', en: 'Work by minors' },
    summary: {
      pt: 'A idade mínima de admissão ao trabalho é 18 anos; excepcionalmente, a partir dos 15 anos com autorização do representante legal. O menor não é ocupado em tarefas insalubres, perigosas ou de grande esforço físico, e o seu período normal de trabalho não excede 25 horas por semana e 5 horas por dia.',
      en: 'The minimum working age is 18; exceptionally from 15 with the legal representative’s authorisation. Minors may not do unhealthy, dangerous or heavy work, and work at most 25 hours a week and 5 a day.',
    },
    law: 'lei13_2023',
    article: 'art. 29.º',
    value: { idadeAdmissao: 18, idadeExcepcional: 15, horasSemana: 25, horasDia: 5 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
} satisfies Record<string, LegalEntryDef>;
