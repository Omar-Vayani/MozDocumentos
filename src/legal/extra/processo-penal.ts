// Legal values for the "processo-penal" documents (criminal procedure, labour
// and administrative litigation). Keys must be unique across all legal files.
//
// Sources: Lei n.º 13/2023 (Lei do Trabalho) read in the Boletim da República
// text — entries marked 'verified'. The Código de Processo Penal (Lei n.º
// 25/2019), the Código Penal (Lei n.º 24/2019), Lei n.º 7/2014 and the other
// laws below could only be read through quoted extracts (Tribunal Supremo
// rulings, manuals, studies): those entries are 'confirm' and carry no article
// number.
import type { LawInfo, LegalEntryDef } from "../types";

const V = "2026-10-14";
const LEI13 =
  "https://ts.gov.mz/wp-content/uploads/2024/05/Lei-No-13-2023-de-25-de-Agosto-NOVA-LEI-DO-TRABALHO-BR_165_I_SEI_RIE_2Ao__230831_091658.pdf";
const CPP =
  "https://reformar.co.mz/documentos-diversos/lei-25-2019-lei-de-revisao-do-codigo-do-processo-penal.pdf";

export const LAWS_PROCESSO_PENAL = {
  ppLei15_2012: {
    short: "Lei de Protecção de Vítimas, Denunciantes e Testemunhas",
    cite: "da Lei n.º 15/2012, de 14 de Agosto",
    title:
      "Lei n.º 15/2012, de 14 de Agosto — mecanismos de protecção dos direitos e interesses das vítimas, denunciantes, testemunhas, declarantes ou peritos em processo penal; cria o Gabinete Central de Protecção à Vítima",
  },
  ppLei26_2019: {
    short: "Código de Execução das Penas",
    cite: "do Código de Execução das Penas",
    title:
      "Código de Execução das Penas, aprovado pela Lei n.º 26/2019, de 27 de Dezembro",
    url: "https://reformar.co.mz/documentos-diversos/lei-26-2019-aprova-o-codigo-de-execucao-das-penas.pdf",
  },
  ppLei10_2018: {
    short: "Lei dos Tribunais do Trabalho",
    cite: "da Lei n.º 10/2018, de 30 de Agosto",
    title:
      "Lei n.º 10/2018, de 30 de Agosto — organização, competência e funcionamento dos Tribunais do Trabalho, alterada e republicada pela Lei n.º 4/2021, de 5 de Maio",
  },
  ppCodigoProcessoTrabalho: {
    short: "Código de Processo do Trabalho",
    cite: "do Código de Processo do Trabalho",
    title:
      "Código de Processo do Trabalho em vigor em Moçambique (aplicado pelos Tribunais do Trabalho e secções laborais; reforma anunciada pelo Tribunal Supremo em 2023)",
  },
  ppLei7_2014: {
    short: "Lei do Processo Administrativo Contencioso",
    cite: "da Lei n.º 7/2014, de 28 de Fevereiro",
    title:
      "Lei n.º 7/2014, de 28 de Fevereiro — regula os procedimentos atinentes ao processo administrativo contencioso",
    url: "https://archive.gazettes.africa/archive/mz/2014/mz-government-gazette-series-i-dated-2014-02-28-no-18.pdf",
  },
  ppLei7_2006: {
    short: "Lei do Provedor de Justiça",
    cite: "da Lei n.º 7/2006, de 16 de Agosto",
    title: "Lei n.º 7/2006, de 16 de Agosto — Estatuto do Provedor de Justiça",
    url: "https://www.provedor-justica.org.mz/perguntas-frequentes/",
  },
  ppLei6_94: {
    short: "Lei do IPAJ",
    cite: "da Lei n.º 6/94, de 13 de Setembro",
    title:
      "Lei n.º 6/94, de 13 de Setembro — cria o Instituto do Patrocínio e Assistência Jurídica (IPAJ); Estatuto aprovado em 1996",
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_PROCESSO_PENAL = {
  // ---------------------------------------------------------------- Processo penal
  ppDenuncia: {
    title: {
      pt: "Denúncia (participação) de crimes públicos",
      en: "Reporting a public crime",
    },
    summary: {
      pt: "Qualquer pessoa pode denunciar ao Ministério Público, às autoridades policiais ou ao SERNIC os crimes cujo procedimento não dependa de queixa nem de acusação particular. A denúncia é obrigatória para as entidades policiais e para os funcionários quanto aos crimes de que tomem conhecimento no exercício das suas funções. O denunciante pode pedir certificado do registo da denúncia.",
      en: "Anyone may report to the Public Prosecutor, the police or SERNIC crimes whose prosecution does not depend on a complaint or private accusation. Police and public servants must report crimes they learn of in the course of their duties. The person reporting may ask for a certificate that the report was registered.",
    },
    law: "cpp2019",
    sourceUrl: CPP,
    lastVerified: V,
    confidence: "confirm",
    note: {
      pt: "Regime citado por manuais de instrução criminal (2024–2025) que indicam os artigos 284, 285 e 290 do CPP; números não confirmados no texto oficial.",
      en: "Rules quoted by criminal investigation manuals (2024–2025) citing arts. 284, 285 and 290 of the CPP; numbers not confirmed in the official text.",
    },
  },
  ppProtecaoDenunciantes: {
    title: {
      pt: "Protecção de denunciantes e testemunhas",
      en: "Protection of whistleblowers and witnesses",
    },
    summary: {
      pt: "Vítimas, denunciantes, testemunhas, declarantes e peritos em processo penal podem beneficiar de medidas de protecção, incluindo a ocultação da identidade, a decidir pelas autoridades competentes. O Gabinete Central de Protecção à Vítima aplica essas medidas.",
      en: "Victims, whistleblowers, witnesses, declarants and experts in criminal proceedings may receive protection measures, including concealment of identity, decided by the competent authorities.",
    },
    law: "ppLei15_2012",
    lastVerified: V,
    confidence: "confirm",
  },
  ppDenunciaCaluniosa: {
    title: { pt: "Denúncia caluniosa", en: "False accusation" },
    summary: {
      pt: "Quem, perante autoridade, imputar a outra pessoa a prática de crime, sabendo que a imputação é falsa, comete crime de denúncia caluniosa.",
      en: "Anyone who, before an authority, accuses another of a crime knowing the accusation is false commits the offence of false accusation.",
    },
    law: "codigoPenal2019",
    lastVerified: V,
    confidence: "confirm",
  },
  ppAssistente: {
    title: {
      pt: "Constituição de assistente",
      en: "Joining as assistant prosecutor",
    },
    summary: {
      pt: "Podem constituir-se assistentes, entre outros, o ofendido e, nos crimes que dependem de queixa ou acusação particular, as pessoas de cuja queixa ou acusação depende o procedimento. O assistente é representado por advogado. Pode intervir em qualquer altura do processo, aceitando-o no estado em que se encontrar, desde que o requeira ao juiz até 5 dias antes do início da audiência de julgamento.",
      en: "The victim and, for offences requiring a complaint or private accusation, the persons entitled to file it may join as assistant prosecutor, represented by a lawyer. They may join at any stage, taking the case as it stands, if they apply to the judge up to 5 days before the trial starts.",
    },
    law: "cpp2019",
    value: { diasAntesJulgamento: 5 },
    sourceUrl: CPP,
    lastVerified: V,
    confidence: "confirm",
    note: {
      pt: "Texto lido em extracto do Boletim da República (art. 77 numa cópia com OCR imperfeito). Confirme o artigo e a taxa de justiça devida.",
      en: "Text read in an extract of the Gazette (art. 77 in an imperfect OCR copy). Confirm the article and the court fee due.",
    },
  },
  ppIndemnizacaoCivil: {
    title: {
      pt: "Pedido de indemnização civil em processo penal",
      en: "Civil damages claim in criminal proceedings",
    },
    summary: {
      pt: "O pedido de indemnização civil fundado na prática de um crime é deduzido no processo penal respectivo (princípio de adesão), pelo lesado, ainda que não se tenha constituído assistente, e pode ser dirigido contra pessoas com responsabilidade meramente civil. Só pode ser deduzido em separado nos casos previstos na lei, por exemplo quando o processo penal não conduzir à acusação dentro de 8 meses a contar da notícia do crime ou estiver parado durante esse tempo.",
      en: "A civil claim based on a crime is made in the criminal case (adhesion principle) by the injured party, even if not an assistant prosecutor, and may be brought against persons with civil liability only. It may be brought separately only where the law allows, e.g. if no accusation is made within 8 months of the report or the case stalls for that period.",
    },
    law: "cpp2019",
    value: { mesesSemAcusacao: 8 },
    sourceUrl: CPP,
    lastVerified: V,
    confidence: "confirm",
    note: {
      pt: "Arts. 80 a 82 numa cópia com OCR imperfeito; prazo para deduzir o pedido por confirmar.",
      en: "Arts. 80 to 82 in an imperfect OCR copy; time limit to file the claim to be confirmed.",
    },
  },
  ppResponsabilidadeCivil: {
    title: {
      pt: "Responsabilidade civil por factos ilícitos",
      en: "Liability in tort",
    },
    summary: {
      pt: "Quem, com dolo ou mera culpa, violar ilicitamente o direito de outrem fica obrigado a indemnizar o lesado pelos danos resultantes da violação. São indemnizáveis os danos patrimoniais (danos emergentes e lucros cessantes) e os danos não patrimoniais que, pela sua gravidade, mereçam a tutela do direito, fixados equitativamente.",
      en: "Whoever unlawfully and culpably violates another’s rights must compensate the resulting damage, both financial (losses and lost profits) and, where serious enough, non-financial damage, assessed on equitable grounds.",
    },
    law: "codigoCivil",
    lastVerified: V,
    confidence: "confirm",
    note: {
      pt: "Arts. 483.º, 496.º e 562.º e seguintes na numeração do Código Civil de 1966; confirme.",
      en: "Arts. 483, 496 and 562 ff. in the 1966 Civil Code numbering; confirm.",
    },
  },
  ppDesistenciaQueixa: {
    title: { pt: "Desistência da queixa", en: "Withdrawal of a complaint" },
    summary: {
      pt: "Nos crimes que dependem de queixa (semipúblicos) ou de acusação particular, o queixoso pode desistir da queixa enquanto não houver sentença em primeira instância, desde que o arguido não se oponha. A desistência impede que a queixa seja renovada. Nos crimes públicos não há desistência: o processo continua.",
      en: "For offences requiring a complaint or private accusation, the complainant may withdraw before the first-instance judgment, unless the accused objects. A withdrawn complaint cannot be renewed. Public crimes cannot be withdrawn.",
    },
    law: "codigoPenal2019",
    lastVerified: V,
    confidence: "confirm",
    note: {
      pt: "Regra tradicional do direito de matriz portuguesa; não foi lido o artigo do Código Penal de 2019.",
      en: "Traditional rule in Portuguese-derived law; the 2019 Penal Code article was not read.",
    },
  },
  ppAudienciaPreliminar: {
    title: { pt: "Audiência preliminar", en: "Preliminary hearing" },
    summary: {
      pt: "Depois da acusação ou do arquivamento, o arguido ou o assistente podem requerer a audiência preliminar, dirigida pelo juiz de instrução, que decide se o arguido é pronunciado. Assume a qualidade de arguido aquele contra quem for deduzida acusação ou requerida audiência preliminar. Não há audiência preliminar nos processos especiais. A assistência de defensor é obrigatória, salvo em processo que não possa dar lugar a pena de prisão.",
      en: "After the accusation or the closure of the case, the accused or the assistant prosecutor may request a preliminary hearing before the investigating judge, who decides whether to commit the accused for trial. There is no preliminary hearing in special proceedings. Defence counsel is mandatory unless the case cannot lead to imprisonment.",
    },
    law: "cpp2019",
    sourceUrl: CPP,
    lastVerified: V,
    confidence: "confirm",
    note: {
      pt: "Prazo para requerer não confirmado; confirme no texto oficial.",
      en: "Time limit to apply not confirmed.",
    },
  },
  ppHabeasCorpus: {
    title: { pt: "Habeas corpus", en: "Habeas corpus" },
    summary: {
      pt: "Em caso de prisão ou detenção ilegal, o cidadão tem direito a recorrer à providência de habeas corpus, a interpor perante o tribunal, que sobre ela decide no prazo de 8 dias. São fundamentos a prisão efectuada ou ordenada por entidade incompetente, motivada por facto pelo qual a lei a não permite, ou mantida para além dos prazos legais ou judiciais. A detenção ilegal é apreciada pelo juiz de instrução; a prisão ilegal pelo tribunal superior.",
      en: "In case of unlawful arrest or detention, a person may apply for habeas corpus, which the court decides within 8 days. Grounds: imprisonment ordered by an incompetent authority, for a fact for which the law does not allow it, or kept beyond legal or judicial time limits.",
    },
    law: "constituicaoRepublica",
    value: { decisaoDias: 8 },
    lastVerified: V,
    confidence: "confirm",
    note: {
      pt: "Prazo constitucional citado em análise doutrinária; competência segundo acórdãos do Tribunal Supremo (Proc. 15/2023-P e 60/2023-P), que citam os arts. 262 a 265 do CPP. Confirme.",
      en: "Constitutional time limit quoted in commentary; competence per Supreme Court rulings citing arts. 262–265 CPP. Confirm.",
    },
  },
  ppMedidasCoaccao: {
    title: { pt: "Medidas de coacção", en: "Coercive measures" },
    summary: {
      pt: "As medidas de coacção (termo de identidade e residência, caução, apresentação periódica, proibição de ausência e de contactos, suspensão de funções, prisão preventiva) devem ser necessárias, adequadas e proporcionais à gravidade do crime. A prisão preventiva só se aplica quando as outras forem insuficientes. As medidas são revogadas quando deixem de subsistir as circunstâncias que as justificaram e substituídas por outras menos graves quando as exigências cautelares se atenuem. A caução atende à situação económica do arguido.",
      en: "Coercive measures must be necessary, adequate and proportionate. Pre-trial detention applies only when others are insufficient. Measures are revoked when the reasons cease and replaced by lighter ones when the risks diminish. Bail takes the accused’s means into account.",
    },
    law: "cpp2019",
    sourceUrl: CPP,
    lastVerified: V,
    confidence: "confirm",
  },
  ppLiberdadeCondicional: {
    title: { pt: "Liberdade condicional", en: "Parole" },
    summary: {
      pt: "O condenado em pena de prisão pode ser colocado em liberdade condicional depois de cumprida a parte da pena que a lei fixa, se revelar capacidade e vontade de se adaptar à vida em liberdade. O conselho técnico do estabelecimento emite parecer e o juiz decide. Os processos de liberdade condicional correm em férias. Aplica-se o regime penal mais favorável ao condenado.",
      en: "A prisoner may be released on parole after serving the portion of the sentence fixed by law, if able and willing to adapt to life in freedom. The prison’s technical council gives an opinion and the judge decides. The most favourable law applies.",
    },
    law: "ppLei26_2019",
    lastVerified: V,
    confidence: "confirm",
    note: {
      pt: "A fracção da pena (metade, ou três quartos para certos crimes no Código de 2019) foi discutida no Acórdão do TS, Proc. 63/2024-P. Confirme para cada caso.",
      en: "The fraction of the sentence (half, or three quarters for some crimes) was discussed by the Supreme Court (case 63/2024-P). Confirm.",
    },
  },
  ppRecurso: {
    title: { pt: "Recurso em processo penal", en: "Criminal appeal" },
    summary: {
      pt: "O recurso é interposto por requerimento, sempre motivado, terminando a motivação com conclusões em que o recorrente resume as razões do pedido. O prazo conta-se da notificação da decisão ou do depósito da sentença. Em processo especial, o Tribunal Supremo aplicou um prazo de 8 dias.",
      en: "An appeal is filed by an application with grounds, ending with conclusions summarising the reasons. The time limit runs from notification of the decision or deposit of the judgment.",
    },
    law: "cpp2019",
    value: { processoEspecialDias: 8 },
    sourceUrl:
      "https://www.ts.gov.mz/wp-content/uploads/2026/03/Proc.no-20-2022-P-2.pdf",
    lastVerified: V,
    confidence: "confirm",
    note: {
      pt: "Acórdão do TS, Proc. 20/2022-P (art. 466, n.º 1, al. b), do CPP, para processo especial). O prazo do processo comum não foi confirmado.",
      en: "Supreme Court case 20/2022-P (special proceedings). The ordinary-proceedings period was not confirmed.",
    },
  },
  ppProva: {
    title: {
      pt: "Prova em processo penal",
      en: "Evidence in criminal proceedings",
    },
    summary: {
      pt: "São admissíveis as provas que não forem proibidas por lei. Os sujeitos processuais podem oferecer testemunhas, juntar documentos e requerer diligências e perícias; a junção de documentos deve ser feita, em regra, até ao encerramento da audiência.",
      en: "Any evidence not prohibited by law is admissible. Parties may name witnesses, file documents and request investigative steps and expert examinations.",
    },
    law: "cpp2019",
    lastVerified: V,
    confidence: "confirm",
  },
  ppApreensao: {
    title: {
      pt: "Restituição de objectos apreendidos",
      en: "Return of seized property",
    },
    summary: {
      pt: "Logo que se tornar desnecessário mantê-los apreendidos para efeito de prova, os objectos são restituídos a quem de direito, salvo se tiverem sido declarados perdidos a favor do Estado. Os bens retirados à vítima pelo crime são-lhe restituídos.",
      en: "Once no longer needed as evidence, seized items are returned to the rightful owner unless forfeited to the State. Property taken from the victim is returned to the victim.",
    },
    law: "cpp2019",
    lastVerified: V,
    confidence: "confirm",
  },
  ppAcusacaoParticular: {
    title: {
      pt: "Acusação particular e acusação do assistente",
      en: "Private accusation",
    },
    summary: {
      pt: "Nos crimes cujo procedimento depende de acusação particular, o assistente é notificado para deduzir acusação no prazo legal. Nos crimes públicos e semipúblicos, o assistente pode deduzir acusação pelos factos acusados pelo Ministério Público ou por factos que não importem alteração substancial.",
      en: "For offences requiring a private accusation, the assistant prosecutor is notified to file the accusation within the legal time limit. For other offences, the assistant may accuse on the facts charged by the prosecutor.",
    },
    law: "cpp2019",
    lastVerified: V,
    confidence: "confirm",
    note: {
      pt: "Prazo e artigo por confirmar no texto oficial.",
      en: "Time limit and article to be confirmed.",
    },
  },
  ppDefesaArguido: {
    title: { pt: "Contestação do arguido", en: "Defence statement" },
    summary: {
      pt: "Recebida a acusação ou a pronúncia, o arguido é notificado e pode apresentar contestação, acompanhada do rol de testemunhas e da indicação dos demais meios de prova, no prazo legal. O arguido tem direito a defensor; a assistência é obrigatória na audiência de julgamento, salvo em processo que não possa dar lugar a pena de prisão.",
      en: "Once the case is sent for trial, the accused may file a defence statement with a list of witnesses and other evidence within the legal time limit. Defence counsel is mandatory at trial unless the case cannot lead to imprisonment.",
    },
    law: "cpp2019",
    lastVerified: V,
    confidence: "confirm",
    note: {
      pt: "Prazo da contestação não confirmado.",
      en: "Time limit not confirmed.",
    },
  },

  // ---------------------------------------------------------------- Trabalho
  ppSuspensaoDespedimento: {
    title: {
      pt: "Suspensão de despedimento",
      en: "Interim suspension of a dismissal",
    },
    summary: {
      pt: "Na pendência ou como acto preliminar da acção de impugnação de despedimento, pode ser requerida a providência cautelar de suspensão de despedimento, no prazo de 30 dias a contar da data da cessação do contrato.",
      en: "Pending or before the action challenging a dismissal, the worker may apply for an interim order suspending the dismissal within 30 days of the end of the contract.",
    },
    law: "lei13_2023",
    article: "art. 76.º, n.º 4,",
    value: { dias: 30 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: "verified",
  },
  ppDireitoInspeccao: {
    title: {
      pt: "Direito de recorrer à Inspecção-Geral do Trabalho",
      en: "Right to go to the Labour Inspectorate",
    },
    summary: {
      pt: "O trabalhador tem direito a dirigir-se à Inspecção-Geral do Trabalho ou aos órgãos da jurisdição laboral sempre que se vir prejudicado nos seus direitos, ou para denunciar actos ilícitos.",
      en: "Workers may go to the Labour Inspectorate or the labour courts whenever their rights are harmed, or to report unlawful acts.",
    },
    law: "lei13_2023",
    article: "art. 55.º, n.º 5, al. i),",
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: "verified",
  },
  ppSigiloDenunciaIgt: {
    title: {
      pt: "Confidencialidade da denúncia à Inspecção do Trabalho",
      en: "Confidentiality of reports to the Labour Inspectorate",
    },
    summary: {
      pt: "São estritamente confidenciais todas as fontes de denúncia de infracções às disposições legais ou contratuais; os agentes da Inspecção-Geral do Trabalho não podem revelar que a visita de inspecção é consequência de denúncia. A Inspecção fiscaliza o cumprimento da Lei do Trabalho em todo o território e pode lavrar autos de advertência e de notícia.",
      en: "The source of any report of breaches is strictly confidential; inspectors may not reveal that an inspection follows a report. The Inspectorate enforces the Labour Law nationwide and may issue warnings and infringement reports.",
    },
    law: "lei13_2023",
    article: "arts. 260.º a 263.º",
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: "verified",
  },
  ppArbitragemLaboral: {
    title: { pt: "Arbitragem laboral", en: "Labour arbitration" },
    summary: {
      pt: "Não resolvido o conflito na mediação, as partes podem submetê-lo à arbitragem; se só uma o fizer, a outra deve aceitar. O órgão nomeia o árbitro nos 5 dias seguintes ao pedido. A decisão arbitral é proferida por escrito em 30 dias após a última audiência, tem os efeitos de uma sentença, constitui título executivo e admite recurso de anulação para o tribunal do trabalho.",
      en: "If mediation fails, either party may refer the dispute to arbitration and the other must accept. The arbitrator is appointed within 5 days; the written award is given within 30 days of the last hearing, has the effect of a judgment and may be challenged in the labour court.",
    },
    law: "lei13_2023",
    article: "arts. 193.º a 198.º",
    value: { nomeacaoDias: 5, decisaoDias: 30 },
    sourceUrl: LEI13,
    lastVerified: V,
    confidence: "verified",
  },
  ppTribunaisTrabalho: {
    title: { pt: "Tribunais do Trabalho", en: "Labour courts" },
    summary: {
      pt: "Os Tribunais do Trabalho julgam as questões emergentes das relações de trabalho. Onde não estejam instalados, a competência pertence às secções laborais dos tribunais judiciais. A mediação prévia é facultativa.",
      en: "Labour courts hear employment disputes; where none has been set up, the labour sections of the ordinary courts do. Prior mediation is optional.",
    },
    law: "ppLei10_2018",
    lastVerified: V,
    confidence: "confirm",
  },

  // ---------------------------------------------------------------- Contencioso administrativo
  ppRecursoContencioso: {
    title: {
      pt: "Recurso contencioso de anulação — prazo e efeito",
      en: "Judicial review — time limit and effect",
    },
    summary: {
      pt: "O recurso contencioso de actos anuláveis é interposto no prazo de 90 dias, salvo indeferimento tácito; o de actos nulos ou juridicamente inexistentes pode sê-lo a todo o tempo. O recurso não suspende, em regra, a eficácia do acto recorrido.",
      en: "Judicial review of voidable acts must be filed within 90 days (tacit refusals aside); null or non-existent acts may be challenged at any time. The appeal does not, as a rule, suspend the act.",
    },
    law: "ppLei7_2014",
    value: { dias: 90 },
    lastVerified: V,
    confidence: "confirm",
    note: {
      pt: "Arts. 36 e 37 da Lei n.º 7/2014, segundo extractos do Boletim da República lidos em pesquisa; confirme a contagem.",
      en: "Arts. 36 and 37 of Law 7/2014 per Gazette extracts; confirm counting.",
    },
  },
  ppSuspensaoEficacia: {
    title: {
      pt: "Suspensão de eficácia do acto administrativo",
      en: "Suspension of an administrative act",
    },
    summary: {
      pt: "A suspensão de eficácia é concedida quando se verifiquem cumulativamente: a execução do acto causar provavelmente prejuízo de difícil reparação ao requerente; a suspensão não determinar grave lesão do interesse público; e do processo não resultarem fortes indícios da ilegalidade da interposição do recurso. É um processo urgente.",
      en: "Suspension is granted when, cumulatively: enforcing the act would probably cause the applicant hard-to-repair harm; suspension would not seriously harm the public interest; and there are no strong signs that the appeal is unlawful. It is an urgent process.",
    },
    law: "ppLei7_2014",
    lastVerified: V,
    confidence: "confirm",
    note: {
      pt: "Art. 132 da Lei n.º 7/2014, citado pelo Acórdão n.º 3/CC/2020 e por monografia da UEM; redacção completa não lida.",
      en: "Art. 132 of Law 7/2014, cited by Constitutional Council ruling 3/CC/2020; full wording not read.",
    },
  },
  ppIntimacao: {
    title: {
      pt: "Intimação para informação, consulta ou certidão",
      en: "Order to provide information",
    },
    summary: {
      pt: "Quando a Administração não satisfaça, no prazo legal, um pedido de informação, de consulta do processo ou de passagem de certidão, o interessado pode requerer ao tribunal administrativo a intimação do órgão. É um processo urgente, que corre em férias.",
      en: "If the administration fails to answer a request for information, access to a file or a certificate within the legal time, the person may ask the administrative court to order it. It is an urgent process.",
    },
    law: "ppLei7_2014",
    lastVerified: V,
    confidence: "confirm",
  },
  ppProvedorJustica: {
    title: {
      pt: "Queixa ao Provedor de Justiça",
      en: "Complaint to the Ombudsman",
    },
    summary: {
      pt: "Os cidadãos, nacionais ou estrangeiros, e as pessoas colectivas podem apresentar ao Provedor de Justiça petições, queixas ou reclamações por actos ou omissões dos poderes públicos. A queixa é gratuita, não exige advogado e pode ser feita por carta ou pessoalmente; deve ser clara, fundamentada e identificar a entidade visada. O Provedor não aprecia decisões dos tribunais.",
      en: "Citizens, foreigners and organisations may complain to the Ombudsman about acts or omissions of public authorities. It is free, needs no lawyer and may be made by letter or in person; it must be clear, reasoned and name the body concerned. Court decisions are excluded.",
    },
    law: "ppLei7_2006",
    sourceUrl: "https://www.provedor-justica.org.mz/perguntas-frequentes/",
    lastVerified: V,
    confidence: "confirm",
  },
  ppIpaj: {
    title: {
      pt: "Patrocínio e assistência jurídica do IPAJ",
      en: "Legal aid (IPAJ)",
    },
    summary: {
      pt: "O IPAJ garante o direito de defesa, prestando gratuitamente patrocínio judiciário e assistência jurídica ao cidadão economicamente desfavorecido. O instituto pode pedir prova da insuficiência económica (por exemplo, declaração de carência).",
      en: "IPAJ provides free legal representation and advice to people without means. It may ask for proof of insufficient means (e.g. a hardship declaration).",
    },
    law: "ppLei6_94",
    lastVerified: V,
    confidence: "confirm",
  },
} satisfies Record<string, LegalEntryDef>;
