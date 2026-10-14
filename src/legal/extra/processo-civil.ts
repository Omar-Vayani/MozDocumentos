// Legal values for the "processo-civil" documents. Keys must be unique across all legal files.
//
// The Mozambican Código de Processo Civil is the 1961 Code (Decreto-Lei n.º 44 129)
// revised by Decreto-Lei n.º 1/2005 and Decreto-Lei n.º 1/2009; it keeps the 1961
// structure and numbering. The consolidated text could not be opened while these
// entries were written (only extracts and court judgments), so every entry is
// 'confirm' and prints no article number. Terminology follows recent judgments of
// the Tribunal Supremo and the Tribunais Superiores de Recurso.
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-14';
const TS = 'https://www.ts.gov.mz/wp-content/uploads';

export const LAWS_PROCESSO_CIVIL = {
  pcLeiFamilia: {
    short: 'Lei da Família',
    cite: 'da Lei da Família',
    title: 'Lei n.º 22/2019, de 11 de Dezembro — Lei da Família (revoga a Lei n.º 10/2004)',
    url: 'https://reformar.co.mz/documentos-diversos/lei-22-2019-lei-da-familia.pdf',
  },
  pcLeiSucessoes: {
    short: 'Lei das Sucessões',
    cite: 'da Lei das Sucessões',
    title: 'Lei n.º 23/2019, de 23 de Dezembro — Lei das Sucessões (revoga o Livro V do Código Civil)',
    url: 'https://reformar.co.mz/documentos-diversos/lei-23-2019-lei-das-sucessoes.pdf',
  },
  pcOtm: {
    short: 'Lei da Organização Tutelar de Menores',
    cite: 'da Lei da Organização Tutelar de Menores',
    title: 'Lei n.º 8/2008, de 15 de Julho — Organização Tutelar de Menores',
    url: 'https://reformar.co.mz/lei_8_2008_organizacao_tutelar_de_menores.pdf',
  },
  pcLeiArbitragem: {
    short: 'Lei de Arbitragem',
    cite: 'da Lei de Arbitragem, Conciliação e Mediação',
    title: 'Lei n.º 11/99, de 8 de Julho — Lei de Arbitragem, Conciliação e Mediação',
    url: 'https://www.dlapiperafrica.com/export/sites/africa/mozambique/insights/legislation-series/justice/downloads/Lei_11_1999.pdf_2063069299.pdf',
  },
} satisfies Record<string, LawInfo>;

const CPC_NOTE = {
  pt: 'Regra do Código de 1961, mantida na revisão de 2005/2009 segundo a jurisprudência consultada; confirme o artigo e a redacção no texto consolidado.',
  en: 'Rule of the 1961 Code, kept in the 2005/2009 revision according to the case law consulted; confirm the article and wording in the consolidated text.',
};

export const LEGAL_PROCESSO_CIVIL = {
  // ---------------------------------------------------------------- Articulados e instrução
  pcReplica: {
    title: { pt: 'Réplica e tréplica', en: 'Reply and rejoinder' },
    summary: {
      pt: 'No processo ordinário, o autor pode replicar quando o réu deduza alguma excepção ou reconvenção: responde à matéria da excepção e da reconvenção e pode alterar o pedido ou a causa de pedir nos termos da lei. O réu pode treplicar se houver modificação do pedido ou da causa de pedir, ou resposta à reconvenção. Os factos não impugnados podem ser dados como admitidos.',
      en: 'In ordinary process the claimant may reply when the defendant raises an objection or counterclaim. The defendant may file a rejoinder if the claim was modified or the counterclaim was answered. Facts not denied may be taken as admitted.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 502.º e 503.º na numeração de 1961. O prazo não foi confirmado: verifique-o no Código e na notificação.', en: 'Arts. 502 and 503 in the 1961 numbering. The time limit was not confirmed.' },
  },
  pcProva: {
    title: { pt: 'Rol de testemunhas e requerimento de prova', en: 'Witness list and evidence application' },
    summary: {
      pt: 'As testemunhas são indicadas pelo nome, profissão e residência. O rol e os restantes meios de prova são apresentados no momento e prazo fixados pela lei ou pelo juiz, e o rol pode ser alterado ou aditado dentro dos limites legais. A lei limita o número de testemunhas por parte e por facto.',
      en: 'Witnesses are listed by name, occupation and residence. The list and other evidence are filed at the time set by law or by the judge, and the list may be changed within legal limits. The law limits the number of witnesses per party and per fact.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: CPC_NOTE,
  },
  pcAdiamento: {
    title: { pt: 'Adiamento da audiência', en: 'Adjournment of a hearing' },
    summary: {
      pt: 'A audiência pode ser adiada nos casos previstos na lei, entre eles o impedimento do tribunal, a falta justificada de advogado que comunique o impedimento ou o acordo das partes, uma só vez. O pedido deve ser apresentado logo que o impedimento seja conhecido e documentado.',
      en: 'A hearing may be adjourned in the cases set by law, including a justified absence of a lawyer who reports it, or once by agreement of the parties. Ask as soon as the impediment is known, with proof.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: CPC_NOTE,
  },
  pcAlegacoesDireito: {
    title: { pt: 'Alegações de direito', en: 'Written legal submissions' },
    summary: {
      pt: 'Encerrada a discussão da matéria de facto, os advogados podem alegar sobre a interpretação e aplicação da lei aos factos que tenham ficado assentes, oralmente ou por escrito, conforme a forma do processo e o despacho do juiz.',
      en: 'Once the facts are settled, the lawyers may argue on the law, orally or in writing, depending on the form of process and the judge’s order.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: CPC_NOTE,
  },
  pcDesistencia: {
    title: { pt: 'Desistência, confissão e transacção', en: 'Withdrawal, admission and settlement' },
    summary: {
      pt: 'A desistência do pedido extingue o direito que se pretendia fazer valer; a desistência da instância apenas faz cessar o processo e, depois da contestação, depende da aceitação do réu. A confissão, a desistência e a transacção fazem-se por documento ou por termo no processo e são homologadas por sentença. O mandatário precisa de poderes especiais.',
      en: 'Withdrawing the claim extinguishes the right; withdrawing the proceedings only ends the case and, after the defence, needs the defendant’s consent. Withdrawal, admission and settlement are made by document or record and approved by judgment. The lawyer needs special powers.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 293.º a 300.º na numeração de 1961; confirme.', en: 'Arts. 293 to 300 in the 1961 numbering; confirm.' },
  },
  pcRenunciaMandato: {
    title: { pt: 'Renúncia ao mandato judicial', en: 'Withdrawal of the lawyer' },
    summary: {
      pt: 'O advogado pode renunciar ao mandato. A renúncia é requerida no processo e notificada ao mandante; produz efeitos a partir da notificação, ficando o advogado obrigado a praticar os actos urgentes até que o mandante constitua novo mandatário, nos termos e prazo legais. Nos processos em que é obrigatória a constituição de advogado, a falta de novo mandatário tem consequências para a parte.',
      en: 'A lawyer may withdraw. The withdrawal is filed in the case and served on the client; it takes effect from service, and the lawyer handles urgent steps until a new lawyer is appointed within the legal time limit.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Art. 39.º na numeração de 1961, a par do Estatuto da Ordem dos Advogados; confirme o prazo para constituir novo mandatário.', en: 'Art. 39 in the 1961 numbering, with the Bar Statute; confirm the period to appoint a new lawyer.' },
  },
  pcHabilitacao: {
    title: { pt: 'Habilitação de herdeiros (incidente)', en: 'Substitution of a deceased party' },
    summary: {
      pt: 'Falecendo uma das partes, a instância suspende-se logo que o falecimento seja comprovado no processo, e só prossegue depois de habilitados os sucessores. A habilitação pode ser promovida por qualquer das partes sobrevivas ou pelos sucessores, que juntam os documentos que provam o óbito e a qualidade de herdeiro.',
      en: 'When a party dies, the case is suspended once the death is proved and resumes after the successors are admitted. Any surviving party or the successors may apply, with proof of death and of heirship.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 276.º, 284.º e 371.º e seguintes na numeração de 1961; confirme.', en: 'Arts. 276, 284 and 371 ff. in the 1961 numbering; confirm.' },
  },
  pcNotificacaoAvulsa: {
    title: { pt: 'Notificação judicial avulsa', en: 'Stand-alone judicial notice' },
    summary: {
      pt: 'A notificação judicial avulsa é requerida ao tribunal do domicílio do notificando e serve para levar ao conhecimento de outrem uma declaração de vontade (interpelação, denúncia, resolução, oferta de preferência). Não admite oposição: os direitos do notificado só podem ser exercidos nas acções próprias. Feita a notificação, o requerente recebe o original ou certidão.',
      en: 'A stand-alone judicial notice is requested from the court of the recipient’s domicile to communicate a statement (demand, termination, offer). It admits no opposition; the recipient’s rights are exercised in separate actions.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 261.º e 262.º na numeração de 1961; confirme.', en: 'Arts. 261 and 262 in the 1961 numbering; confirm.' },
  },

  // ---------------------------------------------------------------- Execução
  pcTitulosExecutivos: {
    title: { pt: 'Títulos executivos', en: 'Enforceable titles' },
    summary: {
      pt: 'Toda a execução tem por base um título. São títulos executivos as sentenças condenatórias, os documentos exarados ou autenticados por notário que importem constituição ou reconhecimento de obrigações, os documentos particulares assinados pelo devedor nos termos da lei (letras, livranças, cheques e outros) e os documentos a que disposição especial atribua força executiva.',
      en: 'Every enforcement is based on a title: judgments ordering payment, notarial documents creating or acknowledging obligations, private documents signed by the debtor as the law allows (bills, promissory notes, cheques) and documents given enforceability by special law.',
    },
    law: 'cpcMz',
    sourceUrl: `${TS}/2024/07/Ac.-Proc-04-2021.pdf`,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 45.º e 46.º na numeração de 1961 (o TSR de Nampula, Proc. 04/2021, cita o art. 46.º, n.º 1, al. a)). Confirme os requisitos dos documentos particulares.', en: 'Arts. 45 and 46 in the 1961 numbering (cited by the Nampula Court of Appeal, case 04/2021).' },
  },
  pcExecucao: {
    title: { pt: 'Processo de execução', en: 'Enforcement proceedings' },
    summary: {
      pt: 'A execução pode ter por fim o pagamento de quantia certa, a entrega de coisa certa ou a prestação de um facto, positivo ou negativo. O requerimento inicial identifica as partes, o título e a obrigação, que deve ser certa, líquida e exigível; na execução para pagamento, o exequente pode nomear bens à penhora nos casos previstos na lei. A execução de sentença corre por apenso ou nos próprios autos.',
      en: 'Enforcement may seek payment of a sum, delivery of a specific thing or performance of an act. The application identifies the parties, the title and the obligation, which must be certain, liquid and due; the creditor may name assets to attach where the law allows.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: CPC_NOTE,
  },
  pcEmbargosExecutado: {
    title: { pt: 'Embargos de executado', en: 'Debtor’s opposition to enforcement' },
    summary: {
      pt: 'O executado pode opor-se à execução por embargos, no prazo legal a contar da citação. Se a execução se basear em sentença, os fundamentos são limitados (inexistência ou inexequibilidade do título, falsidade do processo, ilegitimidade, incerteza ou inexigibilidade da obrigação, caso julgado, facto extintivo posterior provado por documento, entre outros); com base noutro título, podem alegar-se também os fundamentos de defesa admissíveis no processo de declaração. O excesso de execução pode ser discutido em embargos.',
      en: 'The debtor may oppose enforcement by embargos within the legal period after service. Against a judgment the grounds are limited; against other titles, any defence admissible in a declaratory action may be raised. Excess enforcement may be challenged.',
    },
    law: 'cpcMz',
    sourceUrl: `${TS}/2026/05/Ac-proc-95-2025-C-1.pdf`,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 812.º a 820.º na numeração de 1961 (o TSR de Nampula, Proc. 04/2021, cita os arts. 813.º e 817.º; o TS, Proc. 95/2025-C, admite o excesso de execução em embargos). Confirme o prazo.', en: 'Arts. 812 to 820 in the 1961 numbering (cited in recent judgments). Confirm the time limit.' },
  },
  pcEmbargosTerceiro: {
    title: { pt: 'Embargos de terceiro', en: 'Third-party opposition' },
    summary: {
      pt: 'Quem não é parte no processo e tem a sua posse, ou outro direito incompatível, ofendida por penhora, arresto, arrolamento, entrega judicial de bens ou outra diligência ordenada judicialmente pode defendê-la por embargos de terceiro, no prazo legal a contar da diligência ou do seu conhecimento. Os embargos podem ser preventivos, antes de realizada a diligência.',
      en: 'A non-party whose possession or other incompatible right is harmed by an attachment, seizure or other court-ordered step may defend it by third-party embargos within the legal period from the step or from learning of it.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 1037.º e seguintes na numeração de 1961; confirme o prazo e a redacção.', en: 'Arts. 1037 ff. in the 1961 numbering; confirm.' },
  },

  // ---------------------------------------------------------------- Providências cautelares
  pcProvidencias: {
    title: { pt: 'Providências cautelares', en: 'Interim measures' },
    summary: {
      pt: 'Quem mostre fundado receio de que outrem cause lesão grave e dificilmente reparável ao seu direito pode requerer a providência adequada a assegurar a efectividade do direito ameaçado (providência cautelar não especificada), quando ao caso não caiba nenhuma das providências especificadas. Basta a prova sumária do direito e do receio. A providência caduca se a acção principal não for proposta no prazo legal ou se o processo parar por negligência do requerente.',
      en: 'Whoever shows a well-founded fear of serious and hard-to-repair harm to a right may ask for the appropriate measure (unspecified interim measure) when no specific measure fits. Summary proof is enough. The measure lapses if the main action is not filed in time.',
    },
    law: 'cpcMz',
    sourceUrl: `${TS}/2024/01/Processo-no-187.-11.pdf`,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 381.º e seguintes e 399.º e seguintes na numeração de 1961 (designação «providência cautelar não especificada» usada pelo TS, Proc. 187/11). Confirme o prazo de caducidade.', en: 'Arts. 381 ff. and 399 ff. in the 1961 numbering. Confirm the lapse period.' },
  },
  pcArresto: {
    title: { pt: 'Arresto', en: 'Pre-judgment attachment' },
    summary: {
      pt: 'O credor que tenha justificado receio de perder a garantia patrimonial do seu crédito pode requerer o arresto de bens do devedor. Deve alegar factos que tornem provável a existência do crédito e justifiquem o receio. O arresto é decretado sem audiência do requerido.',
      en: 'A creditor with a justified fear of losing the debtor’s assets as security may ask for their attachment, showing facts that make the debt likely and justify the fear. It is ordered without hearing the debtor.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 402.º e seguintes do CPC (1961) e art. 619.º do Código Civil; confirme.', en: 'CPC arts. 402 ff. (1961) and Civil Code art. 619; confirm.' },
  },
  pcEmbargoObraNova: {
    title: { pt: 'Embargo de obra nova', en: 'Injunction against new works' },
    summary: {
      pt: 'Quem se julgue ofendido no seu direito de propriedade, noutro direito real ou na sua posse, em consequência de obra, trabalho ou serviço novo que lhe cause ou ameace causar prejuízo, pode requerer, no prazo legal a contar do conhecimento, que a obra seja suspensa imediatamente. O embargo pode também ser feito extrajudicialmente, por notificação verbal perante testemunhas, devendo ser ratificado judicialmente no prazo legal.',
      en: 'Whoever is harmed in their ownership, other real right or possession by new works may ask, within the legal period from learning of them, for the works to be stopped. An out-of-court embargo before witnesses must be ratified by the court within the legal period.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 412.º e seguintes na numeração de 1961; confirme os prazos.', en: 'Arts. 412 ff. in the 1961 numbering; confirm the periods.' },
  },
  pcRestituicaoPosse: {
    title: { pt: 'Restituição provisória de posse', en: 'Provisional restoration of possession' },
    summary: {
      pt: 'O possuidor que seja esbulhado com violência tem direito a ser restituído provisoriamente à sua posse, sem audiência do esbulhador, alegando os factos que constituem a posse, o esbulho e a violência.',
      en: 'A possessor violently dispossessed is entitled to provisional restoration, without hearing the other side, by alleging possession, dispossession and violence.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 393.º e seguintes do CPC (1961) e art. 1279.º do Código Civil; confirme.', en: 'CPC arts. 393 ff. (1961) and Civil Code art. 1279; confirm.' },
  },
  pcArrolamento: {
    title: { pt: 'Arrolamento', en: 'Inventory seizure' },
    summary: {
      pt: 'Havendo justo receio de extravio, ocultação ou dissipação de bens, móveis ou imóveis, ou de documentos, pode requerer-se o seu arrolamento. É dependência da acção à qual interessa a especificação dos bens (por exemplo, divórcio, inventário). Como preliminar ou incidente da acção de divórcio ou separação, o arrolamento dos bens comuns não depende da prova do receio.',
      en: 'Where there is a fair fear that assets or documents will be lost, hidden or dissipated, their listing and custody may be ordered. In divorce or separation, the listing of common property does not require proof of the fear.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 421.º e seguintes na numeração de 1961; confirme.', en: 'Arts. 421 ff. in the 1961 numbering; confirm.' },
  },
  pcAlimentosProvisorios: {
    title: { pt: 'Alimentos provisórios', en: 'Interim maintenance' },
    summary: {
      pt: 'Como dependência da acção em que se peçam alimentos, o interessado pode requerer a fixação da quantia mensal que deva receber, a título de alimentos provisórios, enquanto não houver pagamento da primeira prestação definitiva.',
      en: 'In connection with a maintenance action, the claimant may ask for a monthly interim amount until the first final payment.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 388.º e seguintes na numeração de 1961; confirme.', en: 'Arts. 388 ff. in the 1961 numbering; confirm.' },
  },
  pcSuspensaoDeliberacoes: {
    title: { pt: 'Suspensão de deliberações sociais', en: 'Suspension of company resolutions' },
    summary: {
      pt: 'O sócio pode requerer a suspensão da execução de deliberação da sociedade contrária à lei, ao contrato social ou aos estatutos, mostrando que essa execução pode causar dano apreciável, no prazo legal a contar da data da deliberação ou do seu conhecimento.',
      en: 'A member may ask for a company resolution that breaches the law or the articles to be suspended, showing appreciable harm, within the legal period from the resolution.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 396.º e seguintes na numeração de 1961, a par do Código Comercial; confirme o prazo.', en: 'Arts. 396 ff. in the 1961 numbering, with the Commercial Code; confirm the period.' },
  },

  // ---------------------------------------------------------------- Recursos
  pcRecursos: {
    title: { pt: 'Recursos ordinários', en: 'Ordinary appeals' },
    summary: {
      pt: 'Os recursos ordinários são a apelação, a revista e o agravo. Cabe apelação da sentença final e do despacho saneador que conheçam do mérito da causa; cabe agravo das restantes decisões susceptíveis de recurso. O recurso é interposto por requerimento dirigido ao tribunal que proferiu a decisão, no prazo legal a contar da notificação, indicando a espécie de recurso; só é admissível nas causas de valor superior à alçada do tribunal de que se recorre, salvo os casos em que a lei o admite sempre.',
      en: 'Ordinary appeals are apelação (against final judgments on the merits), revista and agravo (against other appealable decisions). The appeal is filed by application to the court that decided, within the legal period from notice, stating the type of appeal; it requires a case value above that court’s limit, save where the law always allows it.',
    },
    law: 'cpcMz',
    sourceUrl: `${TS}/2026/03/Ac-proc.-2022-43.pdf`,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 676.º e seguintes na numeração de 1961; a jurisprudência recente continua a distinguir apelação e agravo. Confirme o prazo de interposição e o regime de subida e efeitos.', en: 'Arts. 676 ff. in the 1961 numbering; recent case law still distinguishes apelação and agravo. Confirm the filing period, mode and effect.' },
  },
  pcAlegacoes: {
    title: { pt: 'Alegações de recurso', en: 'Appeal submissions' },
    summary: {
      pt: 'Admitido o recurso, o recorrente apresenta as suas alegações no prazo legal contado da notificação do despacho que o admita, e o recorrido pode responder (contra-alegações) em prazo igual. As alegações terminam com conclusões, em que o recorrente indica de forma sintética os fundamentos por que pede a alteração ou anulação da decisão; o âmbito do recurso é delimitado pelas conclusões. A falta de alegações determina a deserção do recurso.',
      en: 'Once the appeal is admitted, the appellant files submissions within the legal period from notice of the admission, and the respondent may answer within the same period. Submissions end with conclusions, which define the scope of the appeal. Without submissions the appeal lapses.',
    },
    law: 'cpcMz',
    value: { dias: 20 },
    sourceUrl: `${TS}/2026/03/Ac-proc.-2022-43.pdf`,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Prazo de vinte dias lido num extracto do art. 698.º na redacção do Decreto-Lei n.º 1/2009 (apelação); confirme o prazo do agravo. Conclusões delimitam o recurso: TS, Proc. 43/2022-C.', en: 'Twenty days read in an extract of art. 698 as amended by Decree-Law 1/2009 (apelação); confirm the agravo period. Conclusions define the scope: Supreme Court, case 43/2022-C.' },
  },
  pcReclamacao: {
    title: { pt: 'Reclamações e nulidades', en: 'Complaints and nullities' },
    summary: {
      pt: 'Do despacho que não admita o recurso ou o retenha pode reclamar-se para o presidente do tribunal que seria competente para conhecer do recurso. As nulidades processuais são arguidas perante o tribunal onde foram cometidas, no prazo legal a contar do conhecimento. A conta de custas pode ser objecto de reclamação nos termos do Código das Custas Judiciais.',
      en: 'A refusal to admit an appeal may be challenged before the president of the court that would hear it. Procedural nullities are raised before the court where they occurred, within the legal period. The costs account may be challenged under the Court Fees Code.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 201.º e seguintes, 205.º e 688.º na numeração de 1961; confirme os prazos.', en: 'Arts. 201 ff., 205 and 688 in the 1961 numbering; confirm the periods.' },
  },

  // ---------------------------------------------------------------- Acções especiais
  pcDespejo: {
    title: { pt: 'Acção de despejo', en: 'Eviction action' },
    summary: {
      pt: 'A acção de despejo é o meio para o senhorio fazer cessar o arrendamento quando a lei impõe a resolução judicial, designadamente por falta de pagamento da renda, uso do prédio para fim diverso, obras não autorizadas ou subarrendamento ilícito. Pode cumular-se o pedido de pagamento das rendas em dívida e de indemnização. O arrendatário pode fazer caducar o direito à resolução por falta de pagamento depositando as rendas em atraso com a indemnização legal até à contestação.',
      en: 'The eviction action ends a lease where the law requires a court decision, e.g. for unpaid rent, different use, unauthorised works or illegal sub-letting. Unpaid rent and damages may be claimed together. The tenant may stop termination for unpaid rent by paying the arrears with the legal indemnity up to the defence.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'CPC (processo especial de despejo, arts. 964.º e seguintes na numeração de 1961) e Código Civil (arts. 1047.º, 1048.º e 1093.º). Confirme a legislação especial do arrendamento urbano aplicável.', en: 'CPC (special eviction process) and Civil Code. Confirm the applicable special lease legislation.' },
  },
  pcReivindicacao: {
    title: { pt: 'Acção de reivindicação', en: 'Action to recover property' },
    summary: {
      pt: 'O proprietário pode exigir judicialmente de qualquer possuidor ou detentor da coisa o reconhecimento do seu direito de propriedade e a consequente restituição do que lhe pertence. Havendo registo, presume-se que o direito existe e pertence ao titular inscrito. A restituição só pode ser recusada nos casos previstos na lei.',
      en: 'The owner may sue any possessor or holder for recognition of ownership and return of the thing. Registration creates a presumption of ownership.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Art. 1311.º do Código Civil de 1966; confirme. Sobre terra, atenda à Lei de Terras (o DUAT não confere propriedade).', en: 'Civil Code art. 1311; confirm. For land, the Land Law applies (DUAT is a use right, not ownership).' },
  },
  pcPreferencia: {
    title: { pt: 'Acção de preferência', en: 'Pre-emption action' },
    summary: {
      pt: 'O titular de um direito legal de preferência a quem não se dê conhecimento da venda, ou dos seus elementos essenciais, tem o direito de haver para si a coisa alienada, desde que o requeira no prazo legal a contar da data em que teve conhecimento dos elementos essenciais da alienação e deposite o preço devido no prazo legal após a propositura da acção.',
      en: 'A holder of a legal pre-emption right not informed of the sale may claim the thing sold, if the action is brought within the legal period from learning the essential terms and the price is deposited within the legal period after filing.',
    },
    law: 'codigoCivil',
    value: { meses: 6 },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Art. 1410.º do Código Civil de 1966 (redacção original: seis meses; depósito do preço nos dias seguintes à propositura). Confirme o prazo do depósito na redacção em vigor em Moçambique.', en: 'Civil Code art. 1410 (original wording: six months; price deposit shortly after filing). Confirm the deposit period in force.' },
  },
  pcPrestacaoContas: {
    title: { pt: 'Acção de prestação de contas', en: 'Action for an account' },
    summary: {
      pt: 'A acção de prestação de contas pode ser proposta por quem tenha o direito de exigi-las (contra o administrador de bens alheios, o mandatário, o cabeça-de-casal, o gerente) ou por quem tenha o dever de prestá-las, e tem por objecto o apuramento e aprovação das receitas obtidas e das despesas realizadas, com a condenação no pagamento do saldo que venha a apurar-se.',
      en: 'An action for an account may be brought by whoever is entitled to demand it (from a manager of another’s assets, an agent, an estate administrator) or obliged to render it; it settles income and expenses and orders payment of the balance.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 1014.º e seguintes na numeração de 1961; confirme.', en: 'Arts. 1014 ff. in the 1961 numbering; confirm.' },
  },

  // ---------------------------------------------------------------- Família e sucessões
  pcDivorcioLitigioso: {
    title: { pt: 'Divórcio litigioso', en: 'Contested divorce' },
    summary: {
      pt: 'O divórcio litigioso é requerido no tribunal por um dos cônjuges contra o outro, com fundamento nos factos previstos na Lei da Família (entre eles a violação culposa dos deveres conjugais que comprometa a vida em comum, a violência doméstica, a separação de facto pelo período legal, a ausência sem notícias e a alteração das faculdades mentais nos termos legais), ou por conversão da separação judicial de pessoas e bens. Há tentativa de conciliação.',
      en: 'A contested divorce is filed in court by one spouse against the other on the grounds in the Family Law (including culpable breach of marital duties, domestic violence, de facto separation for the legal period, absence without news), or by conversion of a judicial separation. The court attempts conciliation.',
    },
    law: 'pcLeiFamilia',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Lido em sínteses da Lei n.º 22/2019; confirme os fundamentos, o período de separação de facto e o artigo no texto do Boletim da República.', en: 'Read in summaries of Law 22/2019; confirm the grounds, the separation period and the article in the Gazette.' },
  },
  pcDivorcioNaoLitigioso: {
    title: { pt: 'Divórcio e separação por mútuo consentimento', en: 'Divorce and separation by consent' },
    summary: {
      pt: 'O divórcio não litigioso é requerido por ambos os cônjuges, de comum acordo, sem necessidade de revelar a causa, e é instruído com a relação dos bens comuns e os acordos sobre o exercício do poder parental e alimentos dos filhos menores, alimentos entre os cônjuges e o destino da casa de morada de família. A Lei da Família atribui a sua tramitação à Conservatória do Registo Civil, com os requisitos de duração do casamento previstos na lei.',
      en: 'A non-contested divorce is requested by both spouses, without stating a cause, with a list of common property and agreements on the children, maintenance and the family home. The Family Law sends it to the Civil Registry, subject to the minimum length of marriage set by law.',
    },
    law: 'pcLeiFamilia',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Lido em sínteses da Lei n.º 22/2019; confirme no Boletim da República a entidade competente (conservatória ou tribunal), o tempo mínimo de casamento e o regime da separação provisória.', en: 'Read in summaries of Law 22/2019; confirm the competent body, minimum length of marriage and provisional separation rules.' },
  },
  pcAlimentos: {
    title: { pt: 'Obrigação de alimentos', en: 'Maintenance obligation' },
    summary: {
      pt: 'Alimentos são tudo o que é indispensável ao sustento, habitação, vestuário, saúde e, sendo o alimentado menor, à sua educação. São proporcionados aos meios de quem os presta e à necessidade de quem os recebe, fixados em prestações pecuniárias mensais e devidos desde a propositura da acção. Os alimentos devidos a menores seguem o processo da Organização Tutelar de Menores.',
      en: 'Maintenance covers what is indispensable for food, housing, clothing, health and, for minors, education; it is proportionate to the payer’s means and the recipient’s needs, set as monthly payments and owed from the filing of the action. Child maintenance follows the Minors’ Court procedure.',
    },
    law: 'pcLeiFamilia',
    sourceUrl: `${TS}/2026/05/Ac-proc-70-2025-C.pdf`,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Lei n.º 22/2019 e Lei n.º 8/2008 (o TS, Proc. 70/2025-C, enquadra os alimentos a menores na jurisdição de menores e admite a alteração por circunstâncias supervenientes). Confirme os artigos.', en: 'Laws 22/2019 and 8/2008 (Supreme Court, case 70/2025-C). Confirm the articles.' },
  },
  pcPoderParental: {
    title: { pt: 'Regulação do exercício do poder parental', en: 'Parental responsibility order' },
    summary: {
      pt: 'Em caso de divórcio, separação ou quando os pais não vivam juntos, o destino do filho, os alimentos e a forma de os prestar e o regime de visitas são regulados por acordo homologado ou, na falta dele, pelo tribunal de menores, de harmonia com o superior interesse da criança. Qualquer dos pais ou o Ministério Público pode requerer a regulação ou a sua alteração.',
      en: 'When parents divorce, separate or do not live together, residence, maintenance and contact are set by an approved agreement or, failing that, by the minors’ court in the child’s best interests. Either parent or the Public Prosecutor may apply.',
    },
    law: 'pcOtm',
    sourceUrl: `${TS}/2024/01/Processo-no-318.pdf`,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'O TS (Proc. 318/13) refere os arts. 118.º e seguintes da Lei n.º 8/2008, conjugados com a Lei da Família; confirme a numeração.', en: 'The Supreme Court (case 318/13) refers to arts. 118 ff. of Law 8/2008 with the Family Law; confirm.' },
  },
  pcFiliacao: {
    title: { pt: 'Investigação e impugnação da paternidade', en: 'Paternity claims and challenges' },
    summary: {
      pt: 'Quando a paternidade não resulte da presunção legal nem de perfilhação, o filho pode propor acção de investigação de paternidade contra o pretenso pai, ou os seus herdeiros, invocando a filiação biológica e os factos que a lei admite como base de presunção (convivência notória, posse de estado, relações durante o período legal de concepção). A paternidade presumida pode ser impugnada nos termos e prazos legais. É admitida a prova científica (exame de ADN).',
      en: 'Where paternity is not presumed or acknowledged, the child may sue the alleged father or his heirs, relying on biological parentage and the facts the law accepts for a presumption. Presumed paternity may be challenged within the legal terms. DNA evidence is admissible.',
    },
    law: 'pcLeiFamilia',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirme na Lei n.º 22/2019 os prazos de propositura e a legitimidade.', en: 'Confirm the filing periods and standing in Law 22/2019.' },
  },
  pcInventario: {
    title: { pt: 'Processo de inventário', en: 'Probate inventory proceedings' },
    summary: {
      pt: 'O inventário destina-se a relacionar os bens que constituem objecto de sucessão e a partilhá-los entre os herdeiros, ou a partilhar os bens comuns do casal após divórcio ou separação. É requerido por qualquer interessado; o cabeça-de-casal presta compromisso e declarações e apresenta a relação de bens (activo e passivo), sobre a qual os interessados podem reclamar. O inventário é obrigatório nos casos previstos na lei (por exemplo, havendo herdeiros menores ou incapazes).',
      en: 'Inventory proceedings list the estate assets and divide them among the heirs, or divide a couple’s common property after divorce. Any interested party may apply; the estate administrator lists the assets and debts, and the parties may object. It is mandatory in some cases (e.g. minor heirs).',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 1326.º e seguintes do CPC (1961), com a Lei das Sucessões (Lei n.º 23/2019). Confirme os casos de inventário obrigatório.', en: 'CPC arts. 1326 ff. (1961), with the Succession Law. Confirm when inventory is mandatory.' },
  },
  pcCabecaCasal: {
    title: { pt: 'Cabeça-de-casal', en: 'Estate administrator' },
    summary: {
      pt: 'O cargo de cabeça-de-casal cabe, pela ordem legal, ao cônjuge sobrevivo não separado, ao testamenteiro e aos herdeiros, e administra a herança até à liquidação e partilha.',
      en: 'The estate administrator is, in the legal order, the surviving spouse not separated, the executor and the heirs; he or she manages the estate until it is divided.',
    },
    law: 'pcLeiSucessoes',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Regra do Código Civil retomada pela Lei das Sucessões; confirme a ordem e o artigo.', en: 'Civil Code rule taken up by the Succession Law; confirm the order and article.' },
  },

  // ---------------------------------------------------------------- Arbitragem
  pcConvencaoArbitragem: {
    title: { pt: 'Convenção de arbitragem', en: 'Arbitration agreement' },
    summary: {
      pt: 'As partes podem submeter a árbitros a resolução de litígios sobre direitos disponíveis, por compromisso arbitral (litígio actual) ou cláusula compromissória (litígios futuros de uma relação determinada). A convenção deve ser reduzida a escrito, sob pena de nulidade, e pode indicar o número de árbitros, o modo de os designar, o lugar, a língua, as regras do processo ou um centro de arbitragem institucionalizada.',
      en: 'Parties may submit disputes over rights they can freely dispose of to arbitration, by a submission agreement (existing dispute) or an arbitration clause (future disputes). It must be in writing, or it is void, and may set the number of arbitrators, how they are appointed, the seat, language, rules or an arbitration centre.',
    },
    law: 'pcLeiArbitragem',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Lei n.º 11/99, ainda em vigor segundo as fontes consultadas (a sua revisão está em discussão); confirme os artigos.', en: 'Law 11/99, still in force according to the sources consulted; confirm the articles.' },
  },
  pcInicioArbitragem: {
    title: { pt: 'Início da arbitragem', en: 'Commencement of arbitration' },
    summary: {
      pt: 'A parte que pretenda instaurar a arbitragem notifica a outra parte por escrito (ou apresenta o requerimento ao centro de arbitragem escolhido), indicando a convenção de arbitragem, o objecto do litígio, o pedido e, se lhe couber, o árbitro que designa, convidando a outra parte a designar o seu no prazo previsto na convenção, no regulamento ou na lei.',
      en: 'The party starting the arbitration notifies the other in writing (or files with the chosen centre), stating the arbitration agreement, the dispute, the claim and its arbitrator, inviting the other party to appoint one within the period in the agreement, rules or law.',
    },
    law: 'pcLeiArbitragem',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirme o prazo para designação do árbitro na Lei n.º 11/99 ou no regulamento do centro (por exemplo, o CACM).', en: 'Confirm the appointment period in Law 11/99 or the centre’s rules (e.g. CACM).' },
  },
} satisfies Record<string, LegalEntryDef>;
