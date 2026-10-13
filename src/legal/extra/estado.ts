// Legal values for the "estado" documents (public administration). Keys must
// not clash with other files.
//
// Sources were read through extracts of the Boletim da República and secondary
// summaries (training material, law-firm notes, university manuals). Entries
// whose wording or article number could not be read in the official text are
// marked `confirm` and carry no article number.
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-13';

export const LAWS_ESTADO = {
  nfsap: {
    short: 'Decreto n.º 30/2001',
    cite: 'do Decreto n.º 30/2001',
    title: 'Decreto n.º 30/2001, de 15 de Outubro — Normas de Funcionamento dos Serviços da Administração Pública (BR I Série n.º 41), que revogou o Decreto n.º 36/89, de 27 de Novembro',
    url: 'https://www.cedimo.gov.mz/index.php/documentos-e-arquivos-do-estado/legislacao?layout=table',
  },
  resolucao13_2001: {
    short: 'Resolução n.º 13/2001',
    cite: 'da Resolução n.º 13/2001',
    title: 'Resolução n.º 13/2001, de 26 de Dezembro — aprova os modelos de correspondência e impressos da Administração Pública (BR I Série n.º 52, 2.º Suplemento)',
    url: 'https://www.cedimo.gov.mz/index.php/documentos-e-arquivos-do-estado/legislacao?layout=table',
  },
  egfae: {
    short: 'Lei n.º 4/2022',
    cite: 'da Lei n.º 4/2022',
    title: 'Lei n.º 4/2022, de 11 de Fevereiro — Estatuto Geral dos Funcionários e Agentes do Estado (EGFAE), alterada pela Lei n.º 10/2026, de 29 de Junho',
    url: 'https://maefp.gov.mz/wp-content/uploads/2025/04/Lei-4_2022_11_Fevereiro-Novo-EGFAE-2022.pdf',
  },
  regfae: {
    short: 'Decreto n.º 28/2022',
    cite: 'do Decreto n.º 28/2022',
    title: 'Decreto n.º 28/2022, de 17 de Junho — Regulamento do Estatuto Geral dos Funcionários e Agentes do Estado (REGFAE), alterado pelo Decreto n.º 32/2023, de 8 de Junho',
    url: 'https://www.mef.gov.mz/index.php/publicacoes/legislacao-dngrh/recursos-humanos/1625-decreto-n-o-28-2022-aprova-o-regulamento-do-estatuto-geral-dos-funcionarios-e-agentes-do-estado/file',
  },
  decreto95_2018: {
    short: 'Decreto n.º 95/2018',
    cite: 'do Decreto n.º 95/2018',
    title: 'Decreto n.º 95/2018 — Regulamento de Atribuição de Ajudas de Custo e de Abono de Passagens nas Deslocações em Missão de Serviço (tabela interna: Diploma Ministerial n.º 69/2019)',
    url: 'https://ocam.org.mz/wp-content/uploads/2024/06/Regulamento-de-atribuicao-de-Ajudas-de-Custo.pdf',
  },
  decreto84_2018: {
    short: 'Decreto n.º 84/2018',
    cite: 'do Decreto n.º 84/2018',
    title: 'Decreto n.º 84/2018, de 26 de Dezembro — Sistema Nacional de Arquivos do Estado (SNAE), que revogou o Decreto n.º 36/2007, de 27 de Agosto',
  },
  lei34_2014: {
    short: 'Lei n.º 34/2014',
    cite: 'da Lei n.º 34/2014',
    title: 'Lei n.º 34/2014, de 31 de Dezembro — Lei do Direito à Informação (regulamentada pelo Decreto n.º 35/2015, de 31 de Dezembro)',
    url: 'https://www.cedimo.gov.mz/index.php/acesso-a-informacao/lei-de-direito-a-informacao',
  },
  constituicaoRepublica: {
    short: 'Constituição da República',
    cite: 'da Constituição da República',
    title: 'Constituição da República de Moçambique (2004), revista pela Lei n.º 1/2018, de 12 de Junho, e pela Lei n.º 11/2023, de 23 de Agosto, que a republicou',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_ESTADO = {
  correspondenciaRequisitos: {
    title: { pt: 'Requisitos da correspondência oficial', en: 'Requirements of official correspondence' },
    summary: {
      pt: 'Os documentos oficiais são redigidos de forma correcta, clara, concisa e cortês, tratam de um só assunto e indicam o destinatário, a data, o número do registo geral e a sigla ou código do sector que os emite.',
      en: 'Official documents are written correctly, clearly, concisely and courteously, deal with one subject only and state the addressee, the date, the general register number and the code of the issuing unit.',
    },
    law: 'nfsap',
    lastVerified: V,
    confidence: 'confirm',
  },
  correspondenciaClassificacao: {
    title: { pt: 'Classificação da correspondência', en: 'Classification of correspondence' },
    summary: {
      pt: 'A correspondência é classificada quanto à natureza da informação (normal ou classificada) e quanto à brevidade (normal, urgente ou muito urgente).',
      en: 'Correspondence is classified by the nature of its content (normal or classified) and by urgency (normal, urgent or very urgent).',
    },
    law: 'nfsap',
    lastVerified: V,
    confidence: 'confirm',
  },
  informacaoClassificada: {
    title: { pt: 'Graus de classificação da informação', en: 'Levels of classified information' },
    summary: {
      pt: 'A informação classificada pode ser segredo do Estado, secreta, confidencial ou restrita. A classificação em concreto compete a quem produz o documento, segundo o classificador de informações do órgão.',
      en: 'Classified information may be State secret, secret, confidential or restricted. The official who produces the document classifies it, following the body’s classification guide.',
    },
    law: 'lei34_2014',
    lastVerified: V,
    confidence: 'confirm',
  },
  emblemaUso: {
    title: { pt: 'Uso do emblema da República', en: 'Use of the national emblem' },
    summary: {
      pt: 'O papel e os impressos oficiais contêm o emblema da República (ou o logotipo ou a sigla da instituição), a designação oficial do serviço e os contactos. Os órgãos centrais e locais do aparelho do Estado usam o emblema da República.',
      en: 'Official paper and forms carry the national emblem (or the institution’s logo or acronym), the official name of the service and its contacts. Central and local State bodies use the national emblem.',
    },
    law: 'nfsap',
    lastVerified: V,
    confidence: 'confirm',
  },
  prazoApresentacaoDespacho: {
    title: { pt: 'Prazo para apresentar o expediente a despacho', en: 'Time to put a file before the decision-maker' },
    summary: {
      pt: 'O expediente recebido é apresentado a quem tem competência para decidir, com as informações ou pareceres necessários, no prazo máximo indicado, contado da entrada.',
      en: 'A file received is put before the competent decision-maker, with the necessary briefings or opinions, within the stated maximum period from its entry.',
    },
    law: 'nfsap',
    value: 10,
    lastVerified: V,
    confidence: 'confirm',
  },
  prazoDespacho: {
    title: { pt: 'Prazo para o despacho', en: 'Time for the decision' },
    summary: {
      pt: 'A decisão final do expediente é proferida no prazo máximo indicado, contado da data da sua apresentação a despacho.',
      en: 'The final decision on a file is given within the stated maximum period from the date it is put before the decision-maker.',
    },
    law: 'nfsap',
    value: 15,
    lastVerified: V,
    confidence: 'confirm',
  },
  delegacaoCompetencias: {
    title: { pt: 'Delegação de competências', en: 'Delegation of powers' },
    summary: {
      pt: 'O acto de delegação indica a norma que permite delegar, o órgão delegante e o delegado e os poderes delegados. Os despachos de delegação de alcance geral são publicados no Boletim da República.',
      en: 'A delegation states the enabling rule, who delegates, the delegate and the powers delegated. General delegations are published in the Boletim da República.',
    },
    law: 'lei14_2011',
    lastVerified: V,
    confidence: 'confirm',
  },
  actasOrgaosColegiais: {
    title: { pt: 'Actas das reuniões de serviço', en: 'Minutes of service meetings' },
    summary: {
      pt: 'De cada reunião de um órgão colegial lavra-se acta com a data e o local, os presentes, os assuntos tratados, as decisões e o resultado das votações. A acta é assinada por quem presidiu e por quem a secretariou.',
      en: 'Minutes are drawn up for each meeting of a collective body, with date and place, those present, the matters discussed, the decisions and the votes. They are signed by the chair and the secretary.',
    },
    law: 'lei14_2011',
    lastVerified: V,
    confidence: 'confirm',
  },
  notificacaoEdital: {
    title: { pt: 'Publicidade por edital', en: 'Notice by public posting' },
    summary: {
      pt: 'Quando os interessados são desconhecidos ou em número que torne inconveniente outra forma de notificação, esta faz-se por edital afixado nos lugares de estilo e, se necessário, por anúncio em jornal.',
      en: 'When the persons concerned are unknown or too many to notify otherwise, notice is given by a public notice posted in the usual places and, where needed, in a newspaper.',
    },
    law: 'lei14_2011',
    lastVerified: V,
    confidence: 'confirm',
  },
  possePrazo: {
    title: { pt: 'Prazo para a tomada de posse', en: 'Time to take office' },
    summary: {
      pt: 'A posse é tomada no prazo indicado, contado da data em que o nomeado é notificado por escrito, prorrogável uma vez por igual período.',
      en: 'Office is taken within the stated period from the date the appointee is notified in writing, extendable once for the same period.',
    },
    law: 'egfae',
    article: 'art. 24.º',
    value: 15,
    sourceUrl: 'https://maefp.gov.mz/wp-content/uploads/2025/04/Lei-4_2022_11_Fevereiro-Novo-EGFAE-2022.pdf',
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Prazo e número do artigo lidos em extractos do Boletim da República e em análises publicadas; confirme a redacção do n.º 2 sobre a prorrogação.',
      en: 'Period and article read in extracts of the official gazette and published analyses; confirm the wording of paragraph 2 on the extension.',
    },
  },
  posseActo: {
    title: { pt: 'Acto de posse e visto do Tribunal Administrativo', en: 'Swearing-in and Administrative Court clearance' },
    summary: {
      pt: 'A posse é conferida em acto solene pela entidade com competência para nomear. No acto é lido o auto de posse e o empossado presta compromisso de honra. Salvo disposição legal em contrário, a posse só tem lugar depois do visto do Tribunal Administrativo, quando a nomeação está sujeita a visto.',
      en: 'Office is conferred in a formal act by the appointing authority. The record is read and the appointee makes a solemn commitment. Unless the law provides otherwise, office is only taken after the Administrative Court’s clearance when the appointment needs it.',
    },
    law: 'egfae',
    lastVerified: V,
    confidence: 'confirm',
  },
  posseCompromissoHonra: {
    title: { pt: 'Fórmula do compromisso de honra', en: 'Wording of the solemn commitment' },
    summary: {
      pt: 'O compromisso de honra tem uma fórmula para as entidades nomeadas pelo Presidente da República e outra para os restantes funcionários. O texto abaixo segue essa estrutura e deve ser conferido com o Regulamento antes de usar.',
      en: 'There is one wording for people appointed by the President of the Republic and another for other officials. The text below follows that structure and must be checked against the Regulation before use.',
    },
    law: 'regfae',
    value: {
      presidente:
        'Eu, {nome}, juro, por minha honra, servir fielmente o Estado e a Pátria moçambicana e dedicar todas as minhas energias ao serviço do Povo Moçambicano, no exercício das funções que me são confiadas pelo Presidente da República.',
      geral:
        'Eu, {nome}, juro, por minha honra, servir fielmente o Estado e a Pátria moçambicana e dedicar todas as minhas energias ao serviço do Povo Moçambicano, no exercício das funções e tarefas que me são conferidas por lei.',
    },
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Texto reconstituído a partir de extractos; confirme a redacção oficial no REGFAE.',
      en: 'Wording reconstructed from extracts; confirm the official text in the Regulation.',
    },
  },
  ajudasCustoRegime: {
    title: { pt: 'Ajudas de custo nas deslocações em serviço', en: 'Per diem for official travel' },
    summary: {
      pt: 'O funcionário ou agente do Estado deslocado em missão de serviço, dentro ou fora do País, tem direito a ajudas de custo e ao abono de passagens, segundo o regulamento e a tabela em vigor para a sua categoria.',
      en: 'A State official travelling on mission, in or outside the country, is entitled to per diem and travel costs under the regulation and the table in force for their grade.',
    },
    law: 'decreto95_2018',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Os valores constam de diploma ministerial e são actualizados periodicamente; não são impressos na guia de marcha.',
      en: 'Amounts are set by ministerial order and updated periodically; they are not printed on the travel order.',
    },
  },
  arquivoClassificador: {
    title: { pt: 'Plano de classificação de documentos', en: 'Records classification plan' },
    summary: {
      pt: 'Os órgãos do Estado classificam os documentos segundo o plano de classificação e a tabela de temporalidade do Sistema Nacional de Arquivos do Estado. O código do plano pode integrar o número do documento.',
      en: 'State bodies classify records under the classification plan and retention schedule of the National State Archives System. The plan code may be part of the document number.',
    },
    law: 'decreto84_2018',
    lastVerified: V,
    confidence: 'confirm',
  },
  reclamacaoPrazo: {
    title: { pt: 'Prazo da reclamação', en: 'Time limit for a complaint' },
    summary: {
      pt: 'A reclamação é dirigida ao autor do acto, no prazo indicado, contado da notificação.',
      en: 'A complaint goes to the author of the act within the stated period from notification.',
    },
    law: 'lei14_2011',
    value: 15,
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Prazo indicado em guias de direitos que resumem a lei; confirme no texto oficial.',
      en: 'Period given in rights guides summarising the law; confirm in the official text.',
    },
  },
  recursoHierarquicoPrazo: {
    title: { pt: 'Prazo do recurso hierárquico', en: 'Time limit for a hierarchical appeal' },
    summary: {
      pt: 'O recurso hierárquico de actos anuláveis é interposto no prazo indicado em dias, contado da notificação; em caso de indeferimento tácito o prazo é o indicado em anos. Os actos nulos ou inexistentes podem ser impugnados a todo o tempo.',
      en: 'An appeal against a voidable act is lodged within the stated number of days from notification; after a tacit refusal, within the stated number of years. Null or non-existent acts may be challenged at any time.',
    },
    law: 'lei14_2011',
    value: { dias: 90, anosTacito: 1 },
    lastVerified: V,
    confidence: 'confirm',
  },
  recursoHierarquicoForma: {
    title: { pt: 'Forma do recurso hierárquico', en: 'Form of the hierarchical appeal' },
    summary: {
      pt: 'O recurso é interposto por requerimento escrito em que se expõem todos os fundamentos, podendo juntar-se documentos. O superior pode apreciar a legalidade e a conveniência do acto.',
      en: 'The appeal is a written application setting out all the grounds; documents may be attached. The superior may review both legality and merits.',
    },
    law: 'lei14_2011',
    lastVerified: V,
    confidence: 'confirm',
  },
  indeferimentoTacito: {
    title: { pt: 'Indeferimento tácito', en: 'Tacit refusal' },
    summary: {
      pt: 'A falta de decisão no prazo legal permite ao interessado presumir indeferida a sua pretensão, para poder reclamar, recorrer ou impugnar.',
      en: 'If no decision is given within the legal time, the applicant may presume the request refused, in order to complain, appeal or go to court.',
    },
    law: 'lei14_2011',
    lastVerified: V,
    confidence: 'confirm',
  },
  direitoInformacaoPrazo: {
    title: { pt: 'Prazo de resposta a pedidos de informação', en: 'Time to answer information requests' },
    summary: {
      pt: 'O órgão responde ao pedido de acesso à informação no prazo indicado, contado da recepção. A falta de resposta equivale a recusa, de que cabe recurso.',
      en: 'The body answers an information request within the stated period from receipt. No answer counts as refusal, which may be appealed.',
    },
    law: 'lei34_2014',
    value: 21,
    lastVerified: V,
    confidence: 'confirm',
  },
  direitoPeticao: {
    title: { pt: 'Direito de petição, queixa e reclamação', en: 'Right of petition and complaint' },
    summary: {
      pt: 'Os cidadãos podem apresentar petições, queixas e reclamações às autoridades para defesa dos seus direitos e da legalidade.',
      en: 'Citizens may submit petitions, complaints and objections to the authorities to defend their rights and legality.',
    },
    law: 'constituicaoRepublica',
    lastVerified: V,
    confidence: 'confirm',
  },
} satisfies Record<string, LegalEntryDef>;
