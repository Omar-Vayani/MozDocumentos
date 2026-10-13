// Legal values for the "pessoal-rh" documents (personal/family documents and
// extra HR documents). Keys must not clash with other files.
//
// Lei n.º 13/2023 (Lei do Trabalho) entries were checked against the full text
// of the Boletim da República (I Série n.º 165, 2.º Suplemento, 25-08-2023).
// Everything else comes from secondary sources and is marked 'confirm' with no
// article number until checked against the Boletim da República.
import type { LawInfo, LegalEntryDef } from '../types';

const LEI13 = 'https://faolex.fao.org/docs/pdf/moz221728.pdf';
const FAMILIA = 'https://faolex.fao.org/docs/pdf/moz208614.pdf';
const V = '2026-10-13';

export const LAWS_PESSOAL_RH = {
  leiFamilia22_2019: {
    short: 'Lei da Família',
    cite: 'da Lei da Família',
    title: 'Lei n.º 22/2019, de 11 de Dezembro — Lei da Família (BR I Série n.º 239)',
    url: FAMILIA,
  },
  leiEstrangeiros23_2022: {
    short: 'Lei n.º 23/2022',
    cite: 'da Lei n.º 23/2022',
    title: 'Lei n.º 23/2022, de 29 de Dezembro — Regime Jurídico do Cidadão Estrangeiro (revoga a Lei n.º 5/93)',
    url: 'https://www.inm.gov.mz/pt-br/content/assembleia-da-rep%C3%BAblica-suplemento-n%C2%BA-2-de-291222-pag-2730-19-40-br-n%C2%BA-251-boletim-da',
  },
  otmLei8_2008: {
    short: 'Organização Tutelar de Menores',
    cite: 'da Organização Tutelar de Menores',
    title: 'Lei n.º 8/2008, de 15 de Julho — Organização Tutelar de Menores',
    url: 'https://reformar.co.mz/lei_8_2008_organizacao_tutelar_de_menores.pdf',
  },
  decEstagios95_2021: {
    short: 'Regulamento de Estágios Pré-profissionais',
    cite: 'do Regulamento de Estágios Pré-profissionais',
    title: 'Decreto n.º 95/2021, de 23 de Dezembro — Regulamento de Estágios Pré-profissionais (revoga o Decreto n.º 35/2013)',
    url: 'https://lexlink.eu/conteudo/mocambique/legislacao/3978309/decreto-no-952021/26838/por-tema',
  },
  decComal30_2016: {
    short: 'Regulamento da COMAL',
    cite: 'do Regulamento da Comissão de Mediação e Arbitragem Laboral',
    title: 'Decreto n.º 30/2016, de 27 de Julho — Regulamento da Comissão de Mediação e Arbitragem Laboral (COMAL)',
    url: 'https://gazettes.africa/akn/mz/officialGazette/government-gazette-series-i/2016-07-27/89/por@2016-07-27/source',
  },
  decEstrangeiros88_2024: {
    short: 'Decreto n.º 88/2024',
    cite: 'do Decreto n.º 88/2024',
    title:
      'Decreto n.º 88/2024, de 17 de Dezembro — Regulamento dos Mecanismos e Procedimentos para a Contratação de Cidadãos de Nacionalidade Estrangeira (revoga os Decretos n.º 37/2016 e n.º 43/2022)',
    url: 'https://www.mtgas.gov.mz/sites/default/files/public/Regulamento%20dos%20Mecanismos%20e%20Procedimentos%20para%20a%20contratacao%20de%20cidadaos%20de%20Nacionalidade%20estrangeira-2024-12-17-no-244.pdf',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_PESSOAL_RH = {
  // ------------------------------------------------------------------ Personal and family
  reconhecimentoAssinaturaPessoal: {
    title: { pt: 'Reconhecimento de assinatura', en: 'Signature certification' },
    summary: {
      pt: 'Documentos apresentados à migração, a notários, conservatórias, bancos e consulados são em regra aceites só com a assinatura reconhecida presencialmente. Desde 2023 o reconhecimento pode ser feito no notário, na conservatória e também em esquadras da PRM e por advogados.',
      en: 'Documents for migration, notaries, registries, banks and consulates are usually accepted only with the signature certified in person. Since 2023 this can be done at a notary or registry, and also at PRM police stations and by lawyers.',
    },
    law: 'codigoNotariado',
    sourceUrl: 'https://aimnews.org/2023/08/09/prm-e-advogados-ja-podem-certificar-actos-notariais/',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirme o diploma de 2023 que alterou o Código do Notariado.', en: 'Confirm the 2023 instrument amending the Notarial Code.' },
  },
  maioridade: {
    title: { pt: 'Maioridade', en: 'Age of majority' },
    summary: { pt: 'A maioridade atinge-se aos 18 anos. Até lá, o menor está sujeito ao poder parental.', en: 'Majority is reached at 18. Until then a minor is under parental authority.' },
    law: 'leiFamilia22_2019',
    value: { anos: 18 },
    sourceUrl: FAMILIA,
    lastVerified: V,
    confidence: 'confirm',
  },
  saidaMenores: {
    title: { pt: 'Entrada e saída de menores', en: 'Minors entering or leaving the country' },
    summary: {
      pt: 'O menor que viaje sem os pais precisa de autorização escrita dos pais ou de quem exerce o poder parental, com assinatura reconhecida. Se viajar só com um dos pais, precisa da autorização do outro. O documento deve estar em português ou traduzido. A regra consta do regime dos cidadãos estrangeiros e é aplicada na prática aos menores nacionais.',
      en: 'A minor travelling without the parents needs written, notarised authorisation from the parents or guardian; if travelling with one parent, the other parent’s authorisation. It must be in Portuguese or translated. The rule is in the foreigners’ law and is applied in practice to national minors.',
    },
    law: 'leiEstrangeiros23_2022',
    sourceUrl: 'https://www.rsm.global/mozambique/pt-pt/news/entrada-e-saida-de-menores-do-territorio-nacional',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Artigo não confirmado. Não foi encontrada norma específica para menores moçambicanos.',
      en: 'Article not confirmed. No specific rule for Mozambican minors was found.',
    },
  },
  vistoCartaConvite: {
    title: { pt: 'Carta-convite e termo de responsabilidade', en: 'Invitation letter and sponsorship' },
    summary: {
      pt: 'Para o visto de visita ou turismo com alojamento em casa particular, os consulados pedem carta-convite ou termo de responsabilidade assinado pelo anfitrião, com assinatura reconhecida, e prova da morada e do estatuto do anfitrião. No visto de negócios, a carta é dirigida ao Director-Geral do SENAMI.',
      en: 'For a visit or tourist visa staying in a private home, consulates ask for an invitation or sponsorship letter signed by the host with a certified signature, plus proof of the host’s address and status. For business visas the letter is addressed to the Director-General of SENAMI.',
    },
    law: 'leiEstrangeiros23_2022',
    sourceUrl: 'https://www.mozambiquehighcommission.org.uk/visa-section.html',
    lastVerified: V,
    confidence: 'confirm',
  },
  uniaoFactoNocao: {
    title: { pt: 'União de facto', en: 'De facto union' },
    summary: {
      pt: 'Ligação singular, estável e duradoura entre um homem e uma mulher legalmente aptos para casar e que não casaram, com comunhão plena de vida há mais de 3 anos sem interrupção. É reconhecida como entidade familiar para efeitos patrimoniais.',
      en: 'A single, stable and lasting union between a man and a woman legally able to marry who have not married, sharing their lives for more than 3 years without interruption. Recognised as a family for property purposes.',
    },
    law: 'leiFamilia22_2019',
    value: { anosMin: 3 },
    sourceUrl: 'https://opais.co.mz/o-novo-regime-da-uniao-de-facto-na-nova-lei-da-familia/',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Fontes secundárias indicam o art. 207. Confirme no Boletim da República.', en: 'Secondary sources cite art. 207. Confirm in the official gazette.' },
  },
  uniaoFactoReconhecimento: {
    title: { pt: 'Reconhecimento da união de facto', en: 'Recognition of a de facto union' },
    summary: {
      pt: 'Reconhecimento administrativo por certificado da autoridade administrativa da área de residência, com base em declaração conjunta dos companheiros, documentos de identificação, certidões de nascimento e atestado de residência com o tempo de convivência. Em alternativa, reconhecimento judicial.',
      en: 'Administrative recognition by a certificate from the local administrative authority, based on the partners’ joint declaration, ID, birth certificates and proof of residence showing how long they have lived together. Judicial recognition is the alternative.',
    },
    law: 'leiFamilia22_2019',
    sourceUrl: 'https://opais.co.mz/o-novo-regime-da-uniao-de-facto-na-nova-lei-da-familia/',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Fontes secundárias indicam os arts. 209 a 211. Confirme.', en: 'Secondary sources cite arts. 209 to 211. Confirm.' },
  },
  consentimentoConjuge: {
    title: { pt: 'Consentimento do cônjuge', en: 'Spouse’s consent' },
    summary: {
      pt: 'Os imóveis, próprios ou comuns, e o estabelecimento comercial só podem ser alienados, ou dados de arrendamento por mais de 6 anos, com o consentimento expresso de ambos os cônjuges, salvo no regime de separação de bens. O consentimento é especial para cada acto, dado no acto ou em documento particular, e pode ser suprido pelo tribunal. Sem ele, o acto é anulável a pedido do cônjuge que não consentiu.',
      en: 'Real estate (own or common) and a business may only be sold, or leased for more than 6 years, with both spouses’ express consent, unless the couple has separate property. Consent is specific to each act, given at the act or in a private document, and may be supplied by a court. Without it the act can be annulled at the request of the spouse who did not consent.',
    },
    law: 'leiFamilia22_2019',
    value: { arrendamentoAnos: 6 },
    sourceUrl: FAMILIA,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Excertos do Boletim indicam os arts. 107, 109 e 111. Confirme a numeração.', en: 'Gazette excerpts cite arts. 107, 109 and 111. Confirm the numbering.' },
  },
  poderParentalAlimentos: {
    title: { pt: 'Poder parental e alimentos', en: 'Parental authority and maintenance' },
    summary: {
      pt: 'Os pais têm o dever de assistência e de prestar alimentos aos filhos. O poder parental cabe a ambos os pais, também em união de facto. O acordo dos pais sobre a guarda, as visitas e os alimentos só produz efeitos depois de homologado pelo tribunal, que ouve o Ministério Público; a decisão é comunicada ao registo civil.',
      en: 'Parents must support and maintain their children. Parental authority belongs to both parents, including in a de facto union. The parents’ agreement on residence, contact and maintenance only takes effect once approved by the court, after hearing the Public Prosecutor; the decision is notified to the civil registry.',
    },
    law: 'leiFamilia22_2019',
    sourceUrl: FAMILIA,
    lastVerified: V,
    confidence: 'confirm',
  },
  regulacaoPoderParental: {
    title: { pt: 'Regulação do exercício do poder parental', en: 'Court regulation of parental authority' },
    summary: {
      pt: 'A regulação, a homologação de acordo e a sua alteração são pedidas ao tribunal de menores por quem exerce o poder parental ou pelo Ministério Público, como curador de menores. A pensão de alimentos fixada por acordo homologado pode ser revista se as circunstâncias mudarem.',
      en: 'Regulation, approval of an agreement and later changes are requested from the juvenile court by a parent or by the Public Prosecutor. Maintenance fixed by an approved agreement can be reviewed if circumstances change.',
    },
    law: 'otmLei8_2008',
    sourceUrl: 'https://www.ts.gov.mz/wp-content/uploads/2024/01/Processo-no-318.pdf',
    lastVerified: V,
    confidence: 'confirm',
  },
  declaracaoResidencia: {
    title: { pt: 'Declaração de residência', en: 'Proof of residence' },
    summary: {
      pt: 'Emitida pelo Secretário do Bairro (ou, conforme o local, pelo Chefe do Quarteirão ou pela Localidade) a pedido do morador, em impresso próprio e com carimbo. O formato e a taxa variam por bairro e município.',
      en: 'Issued by the neighbourhood secretary (or the block chief or locality, depending on the area) at the resident’s request, on its own form and stamped. Format and fee vary by neighbourhood and municipality.',
    },
    law: 'lei14_2011',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Prática administrativa; não foi encontrado diploma específico.', en: 'Administrative practice; no specific instrument was found.' },
  },

  // ------------------------------------------------------------------ Labour: contracts
  classesEmpregador: {
    title: { pt: 'Classificação dos empregadores', en: 'Employer size classes' },
    summary: {
      pt: 'Micro: até 10 trabalhadores; pequeno: 11 a 30; médio: 31 a 100; grande: mais de 100. Conta a média de trabalhadores do ano civil em curso.',
      en: 'Micro: up to 10 employees; small: 11 to 30; medium: 31 to 100; large: over 100. The average for the current calendar year counts.',
    },
    law: 'lei13_2023',
    article: 'art. 25.º',
    value: { micro: 10, pequeno: 30, medio: 100 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  tempoParcial: {
    title: { pt: 'Trabalho a tempo parcial', en: 'Part-time work' },
    summary: {
      pt: 'É tempo parcial o trabalho que não excede 75% do período normal a tempo inteiro. Contrato escrito, com o período normal diário ou semanal comparado com o tempo inteiro. Remuneração proporcional; o trabalhador não pode ter tratamento menos favorável do que um trabalhador comparável a tempo inteiro.',
      en: 'Part-time work is up to 75% of full-time hours. Written contract stating daily or weekly hours compared with full time. Pay is proportional; no less favourable treatment than a comparable full-time employee.',
    },
    law: 'lei13_2023',
    article: 'arts. 102.º, 103.º e 126.º',
    value: { percentagemMax: 75 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  teletrabalho: {
    title: { pt: 'Teletrabalho', en: 'Remote work' },
    summary: {
      pt: 'O teletrabalho é uma modalidade de prestação de trabalho regida por legislação especial (ainda não publicada) e, em tudo o que se adapte, pela Lei do Trabalho. Está sujeito a forma escrita.',
      en: 'Remote work is governed by special legislation (not yet published) and, where suitable, by the Labour Law. It must be agreed in writing.',
    },
    law: 'lei13_2023',
    article: 'arts. 3.º e 39.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  vigilanciaDistancia: {
    title: { pt: 'Meios de vigilância à distância', en: 'Remote monitoring' },
    summary: {
      pt: 'O empregador não pode usar meios de vigilância à distância para controlar o desempenho do trabalhador. São admitidos para protecção e segurança de pessoas e bens ou quando integram o processo produtivo, devendo o trabalhador ser informado por escrito da sua existência e finalidade. As provas obtidas em violação são nulas.',
      en: 'The employer may not use remote monitoring to control performance. It is allowed for safety and security or where it is part of the production process, and the employee must be told in writing. Evidence obtained in breach is void.',
    },
    law: 'lei13_2023',
    article: 'art. 10.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  estagioPosFormacao: {
    title: { pt: 'Remuneração do estágio pós-formação', en: 'Pay during a post-training work placement' },
    summary: {
      pt: 'Os recém-formados, durante o estágio laboral pós-formação profissional, recebem pelo menos 75% da remuneração da categoria. Se já eram trabalhadores, mantêm a remuneração anterior quando esta for superior.',
      en: 'Recent graduates on a post-training work placement receive at least 75% of the pay for the job grade. Existing employees keep their previous pay if higher.',
    },
    law: 'lei13_2023',
    article: 'art. 126.º',
    value: { percentagem: 75 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  estagioPreProfissional: {
    title: { pt: 'Estágio pré-profissional', en: 'Pre-professional internship' },
    summary: {
      pt: 'Para finalistas e recém-graduados dos 15 aos 35 anos. Pode ser remunerado ou não; se remunerado, não inferior a 75% do salário mínimo do sector. Duração até 1 ano. A entidade promotora designa um orientador, garante higiene e segurança e emite o certificado de estágio no modelo da entidade de emprego.',
      en: 'For final-year students and recent graduates aged 15 to 35. May be paid or unpaid; if paid, at least 75% of the sector minimum wage. Up to 1 year. The host appoints a supervisor, ensures health and safety and issues the internship certificate on the employment agency’s model.',
    },
    law: 'decEstagios95_2021',
    value: { idadeMin: 15, idadeMax: 35, duracaoMaxMeses: 12, subsidioMinPercentSM: 75 },
    sourceUrl: 'https://www.lexlink.eu/FileGet.aspx?FileId=3029828',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Valores retirados de excertos do Boletim; confirme a duração máxima e o subsídio mínimo.',
      en: 'Values from gazette excerpts; confirm the maximum length and minimum allowance.',
    },
  },
  cedenciaOcasional: {
    title: { pt: 'Cedência ocasional de trabalhador', en: 'Temporary secondment of an employee' },
    summary: {
      pt: 'Só é lícita se houver contrato de trabalho com o cedente, se visar fazer face a aumento de trabalho ou à mobilidade de trabalhadores, com consentimento escrito do trabalhador, e por até 3 anos (sem ultrapassar o termo de contrato a prazo). O trabalhador mantém o vínculo ao cedente e regressa a ele no fim. Sem estes requisitos, pode optar pela integração no cessionário ou por indemnização.',
      en: 'Lawful only with an employment contract with the lender, to meet extra work or staff mobility, with the employee’s written consent, and for up to 3 years (not beyond a fixed-term contract). The employee stays employed by the lender and returns at the end. Otherwise the employee may choose to join the host or receive compensation.',
    },
    law: 'lei13_2023',
    article: 'art. 85.º',
    value: { duracaoMaxAnos: 3 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Labour: working time
  horarioTrabalho: {
    title: { pt: 'Horário de trabalho', en: 'Working schedule' },
    summary: {
      pt: 'O empregador fixa o horário depois de consultar o órgão sindical. O mapa de horário é visado pelo órgão competente da administração do trabalho e afixado em lugar bem visível. Podem ser isentos de horário os cargos de direcção, chefia, confiança ou fiscalização.',
      en: 'The employer sets the schedule after consulting the union body. The schedule must be stamped by the labour administration and posted visibly. Managers and positions of trust may be exempt.',
    },
    law: 'lei13_2023',
    article: 'art. 95.º',
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  horarioComunicacao: {
    title: { pt: 'Comunicação de novos horários', en: 'Notice of new schedules' },
    summary: {
      pt: 'Os novos horários são comunicados ao Ministério do Trabalho, através da representação mais próxima, até ao dia 15 do mês seguinte ao da adopção.',
      en: 'New schedules are reported to the Ministry of Labour, through its nearest office, by the 15th of the month after adoption.',
    },
    law: 'lei13_2023',
    article: 'art. 93.º, n.º 8',
    value: { diaLimite: 15 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  limitesHorarioEspeciais: {
    title: { pt: 'Alargamento do dia e semana na indústria', en: 'Longer day and industrial week' },
    summary: {
      pt: 'O dia de trabalho pode ir até 9 horas se for dado meio dia de descanso complementar por semana. A indústria (salvo turnos) pode adoptar 45 horas semanais em 5 dias.',
      en: 'The working day may be extended to 9 hours if an extra half day of rest is given each week. Industry (except shifts) may adopt 45 hours a week over 5 days.',
    },
    law: 'lei13_2023',
    article: 'art. 93.º',
    value: { horasDiaAlargado: 9, horasSemanaIndustria: 45, diasIndustria: 5 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  intervaloDescanso: {
    title: { pt: 'Intervalo de descanso', en: 'Rest break' },
    summary: {
      pt: 'O dia de trabalho é interrompido por um intervalo de 30 minutos a 2 horas (salvo turnos). No horário contínuo, o intervalo de pelo menos 30 minutos conta como trabalho efectivo.',
      en: 'The working day must include a break of 30 minutes to 2 hours (except shifts). In a continuous schedule a break of at least 30 minutes counts as working time.',
    },
    law: 'lei13_2023',
    article: 'art. 97.º',
    value: { minMinutos: 30, maxMinutos: 120 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Labour: category and pay
  alteracaoCategoria: {
    title: { pt: 'Categoria profissional e alteração das condições', en: 'Job grade and change of conditions' },
    summary: {
      pt: 'O empregador deve atribuir e manter a categoria correspondente às funções. O trabalhador não pode ser colocado em categoria inferior àquela para que foi contratado ou promovido, salvo fundamento legal ou acordo. A alteração das condições é feita por acordo e nunca pode diminuir a remuneração nem a posição hierárquica.',
      en: 'The employer must assign and keep the job grade matching the duties. The employee may not be moved to a lower grade than the one hired or promoted to, save legal grounds or agreement. Changes are made by agreement and may never reduce pay or rank.',
    },
    law: 'lei13_2023',
    article: 'arts. 60.º, 79.º e 80.º',
    value: { tarefasDiferentesMeses: 6 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  remuneracaoChefia: {
    title: { pt: 'Remuneração em cargo de chefia ou confiança', en: 'Pay in a management or trust position' },
    summary: {
      pt: 'Quem é nomeado para cargo de chefia ou confiança recebe a remuneração do cargo, que deixa de ser paga quando cessa a função. Se a sua remuneração já for igual ou superior à do cargo, recebe um acréscimo de pelo menos 20% enquanto o exercer.',
      en: 'Someone appointed to a management or trust position receives that position’s pay, which stops when the role ends. If their pay is already equal or higher, they get at least 20% extra while in the role.',
    },
    law: 'lei13_2023',
    article: 'art. 127.º',
    value: { acrescimoMin: 20 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  remuneracaoSubstituicao: {
    title: { pt: 'Substituição e acumulação de funções', en: 'Acting and combined roles' },
    summary: {
      pt: 'A substituição por 30 dias ou mais dá direito à remuneração da categoria substituída. A acumulação de funções de chefia por 45 dias ou mais dá direito a um acréscimo de pelo menos 25% da remuneração da função.',
      en: 'Acting in another role for 30 days or more entitles the employee to that grade’s pay. Combining management roles for 45 days or more entitles them to at least 25% extra.',
    },
    law: 'lei13_2023',
    article: 'art. 129.º',
    value: { substituicaoDias: 30, acumulacaoDias: 45, acrescimoAcumulacao: 25 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Labour: termination
  despedimentoColectivo: {
    title: { pt: 'Despedimento colectivo', en: 'Collective dismissal' },
    summary: {
      pt: 'Há despedimento colectivo quando o empregador, em 3 meses, faz cessar por motivos estruturais, tecnológicos ou de mercado mais de 8 contratos (micro e pequenas empresas) ou mais de 10 (médias e grandes). Antes do processo negocial, informa o órgão sindical e os trabalhadores (motivos e número de abrangidos) e comunica ao Ministério; a consulta não pode durar mais de 30 dias. O ónus da prova dos motivos é do empregador.',
      en: 'A collective dismissal is ending, within 3 months and for structural, technological or market reasons, more than 8 contracts (micro and small firms) or more than 10 (medium and large). Before negotiating, the employer informs the union and the employees (reasons and number affected) and notifies the Ministry; consultation lasts at most 30 days. The employer must prove the reasons.',
    },
    law: 'lei13_2023',
    article: 'arts. 143.º a 145.º',
    value: { microPequenas: 8, mediasGrandes: 10, periodoMeses: 3, consultaDias: 30 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  motivosEconomicosFormalidades: {
    title: { pt: 'Rescisão por motivos económicos: formalidades', en: 'Economic dismissal: formalities' },
    summary: {
      pt: 'A rescisão é comunicada por escrito a cada trabalhador abrangido, ao órgão sindical (ou à associação sindical representativa) e ao Ministério do Trabalho, com pelo menos 30 dias de antecedência. Durante o aviso prévio, o empregador presta à Inspecção-Geral do Trabalho os esclarecimentos pedidos. Nos contratos a prazo certo, a indemnização corresponde às remunerações até ao termo. O recebimento da compensação faz presumir a aceitação, salvo impugnação.',
      en: 'The dismissal is notified in writing to each employee, the union (or representative trade union) and the Ministry of Labour at least 30 days in advance. During notice the employer answers the Labour Inspectorate. For fixed-term contracts compensation is the pay up to the end of the term. Accepting compensation is presumed to accept the dismissal, unless challenged.',
    },
    law: 'lei13_2023',
    article: 'art. 142.º',
    value: { avisoDias: 30 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  impugnacaoRescisao: {
    title: { pt: 'Impugnação da rescisão', en: 'Challenging a dismissal' },
    summary: {
      pt: 'A impugnação da justa causa da rescisão deve ser feita no prazo de 6 meses a contar da notificação. Declarada improcedente a rescisão, o trabalhador é reintegrado com as remunerações vencidas (até 6 meses) ou, por opção, indemnizado.',
      en: 'A dismissal must be challenged within 6 months of notification. If the dismissal is held unlawful, the employee is reinstated with back pay (up to 6 months) or, if they choose, compensated.',
    },
    law: 'lei13_2023',
    article: 'art. 146.º',
    value: { meses: 6 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Labour: mediation
  mediacaoLaboralProcesso: {
    title: { pt: 'Mediação laboral', en: 'Labour mediation' },
    summary: {
      pt: 'A mediação é facultativa e pode preceder a arbitragem ou o tribunal. O pedido indica a matéria controvertida e os elementos que ajudem o mediador, com a fundamentação. O mediador é nomeado em 3 dias e a mediação não deve exceder 30 dias, salvo acordo. Se quem pediu faltar sem justificação, o processo é arquivado; havendo impasse, é emitida certidão de impasse.',
      en: 'Mediation is optional and may come before arbitration or court. The request states the disputed matter and the facts that help the mediator, with grounds. A mediator is appointed within 3 days and mediation should not exceed 30 days unless agreed. If the requesting party fails to attend without reason, the case is closed; if there is deadlock, a deadlock certificate is issued.',
    },
    law: 'lei13_2023',
    article: 'arts. 187.º a 192.º',
    value: { nomeacaoDias: 3, duracaoDias: 30 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  mediacaoPedidoComal: {
    title: { pt: 'Pedido ao Centro de Mediação e Arbitragem Laboral', en: 'Request to the labour mediation centre' },
    summary: {
      pt: 'A mediação inicia-se por carta dirigida ao Director do Centro de Mediação e Arbitragem Laboral, com a questão controvertida, o valor e os nomes, endereços e telefones das partes e dos seus representantes. Podem ser devidas custas conforme o valor (Diploma Ministerial n.º 71/2024).',
      en: 'Mediation starts with a letter to the Director of the Labour Mediation and Arbitration Centre stating the dispute, the amount and the names, addresses and phone numbers of the parties and their representatives. Fees may apply depending on the amount.',
    },
    law: 'decComal30_2016',
    sourceUrl: 'https://www.rsm.global/mozambique/pt-pt/news/recem-aprovadas-custas-de-conciliacao-mediacao-e-arbitragem-laboral-em-mocambique',
    lastVerified: V,
    confidence: 'confirm',
  },

  // ------------------------------------------------------------------ Labour: foreign workers
  trabalhadorEstrangeiro: {
    title: { pt: 'Contratação de trabalhador estrangeiro', en: 'Hiring a foreign employee' },
    summary: {
      pt: 'Só se contrata estrangeiro quando não há nacionais qualificados ou são insuficientes. Dentro da quota basta comunicar ao Ministério (5% grandes, 8% médios, 10% pequenos, 15% micro empregadores); fora dela é preciso autorização, pedida por requerimento com a denominação, sede e actividade do empregador, a identificação do estrangeiro, tarefas, remuneração, qualificação comprovada e duração do contrato, que é escrito. Não pode ser contratado quem entrou no país para fins diferentes do trabalho.',
      en: 'A foreigner may only be hired when no qualified nationals are available. Within the quota a notice to the Ministry is enough (5% large, 8% medium, 10% small, 15% micro employers); otherwise authorisation is needed, requested with the employer’s details, the foreigner’s identity, duties, pay, proven qualifications and contract length (in writing). Someone who entered the country for other purposes may not be hired.',
    },
    law: 'lei13_2023',
    article: 'arts. 33.º a 36.º',
    value: { grande: 5, medio: 8, pequeno: 10, micro: 15 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: 'verified',
  },
  contratacaoEstrangeirosRegulamento: {
    title: { pt: 'Regulamento de contratação de estrangeiros', en: 'Foreign hiring regulation' },
    summary: {
      pt: 'Mecanismos e procedimentos de autorização e de comunicação. A comunicação dentro da quota é submetida no prazo de 15 dias a contar da entrada do estrangeiro no país. Já não é exigida a relação nominal do ano anterior.',
      en: 'Procedures for authorisation and notice. A within-quota notice is filed within 15 days of the foreigner’s entry into the country. The previous year’s staff list is no longer required.',
    },
    law: 'decEstrangeiros88_2024',
    value: { comunicacaoDias: 15 },
    sourceUrl: 'https://www.abcc.co.mz/xms/files/Flash_Informativo_Decreto_88_2024_Contratacao_de_Cidadao_de_Nacionalidade_Estrangeira_PT.pdf',
    lastVerified: V,
    confidence: 'confirm',
  },
} satisfies Record<string, LegalEntryDef>;
