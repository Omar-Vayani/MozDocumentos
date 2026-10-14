// Legal values for the "cidadao" documents (citizen and consumer: requests to
// public services, the municipality, utilities, operators and regulators).
// Keys must be unique across all legal files (prefix `cid`).
//
// The official texts (Boletim da República) could not be opened for this
// area: entries were built from gazette extracts quoted in resolutions,
// regulators' reports and secondary summaries. Every entry is therefore
// `confirm` and carries no article number; the article believed to apply is
// given in the note only, for the owner's lawyer to check.
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-14';

export const LAWS_CIDADAO = {
  cidLei26_2014Peticoes: {
    short: 'Lei n.º 26/2014',
    cite: 'da Lei n.º 26/2014, de 23 de Setembro',
    title: 'Lei n.º 26/2014, de 23 de Setembro — regulamenta e disciplina o direito de apresentar petições, queixas e reclamações perante autoridade competente',
    url: 'https://www.cedimo.gov.mz/index.php/acesso-a-informacao/outra-legislacao-da-administracao-publica/2-lei-que-regulamenta-e-disciplina-o-diteito-a-peticoes-26-2014-23-de-setembro',
  },
  cidLei7_2006Provedor: {
    short: 'Lei n.º 7/2006',
    cite: 'da Lei n.º 7/2006, de 16 de Agosto',
    title: 'Lei n.º 7/2006, de 16 de Agosto — organização e funcionamento do Provedor de Justiça',
  },
  cidLei6_2004Anticorrupcao: {
    short: 'Lei n.º 6/2004',
    cite: 'da Lei n.º 6/2004, de 17 de Junho',
    title: 'Lei n.º 6/2004, de 17 de Junho — Lei Anticorrupção (os crimes de corrupção constam hoje do Código Penal aprovado pela Lei n.º 24/2019)',
  },
  cidLei15_2012Proteccao: {
    short: 'Lei n.º 15/2012',
    cite: 'da Lei n.º 15/2012, de 14 de Agosto',
    title: 'Lei n.º 15/2012, de 14 de Agosto — protecção de vítimas, denunciantes, testemunhas, declarantes e peritos em processo penal',
  },
  cidLei9_91Reuniao: {
    short: 'Lei n.º 9/91',
    cite: 'da Lei n.º 9/91, de 18 de Julho, alterada pela Lei n.º 7/2001, de 7 de Julho',
    title: 'Lei n.º 9/91, de 18 de Julho — exercício do direito à liberdade de reunião e de manifestação, alterada pela Lei n.º 7/2001, de 7 de Julho',
    url: 'https://www.dlapiperafrica.com/export/sites/africa/mozambique/insights/legislation-series/associations-and-ngos/downloads/lei_9_91.pdf_2063068952.pdf',
  },
  cidDecreto60_2006SoloUrbano: {
    short: 'Regulamento do Solo Urbano',
    cite: 'do Regulamento do Solo Urbano (Decreto n.º 60/2006, de 26 de Dezembro)',
    title: 'Decreto n.º 60/2006, de 26 de Dezembro — Regulamento do Solo Urbano',
  },
  cidDecreto2_2004Obras: {
    short: 'Regulamento de Licenciamento de Obras Particulares',
    cite: 'do Regulamento de Licenciamento de Obras Particulares (Decreto n.º 2/2004, de 31 de Março)',
    title: 'Decreto n.º 2/2004, de 31 de Março — Regulamento de Licenciamento de Obras Particulares',
  },
  cidLei4_2016Telecom: {
    short: 'Lei das Telecomunicações',
    cite: 'da Lei das Telecomunicações (Lei n.º 4/2016, de 3 de Junho)',
    title: 'Lei n.º 4/2016, de 3 de Junho — Lei das Telecomunicações; regulador: Instituto Nacional das Comunicações de Moçambique (INCM)',
  },
  cidLeiElectricidade: {
    short: 'Lei de Electricidade',
    cite: 'da Lei de Electricidade',
    title: 'Lei de Electricidade (Lei n.º 12/2022, de 11 de Julho); regulador: Autoridade Reguladora de Energia (ARENE)',
  },
  cidRegulacaoAgua: {
    short: 'Regulação do abastecimento de água',
    cite: 'do regime de regulação do abastecimento de água',
    title: 'Regime de regulação dos serviços de abastecimento de água e saneamento; regulador: Autoridade Reguladora de Águas, Instituto Público (AURA, IP)',
  },
  cidConvencaoMontreal: {
    short: 'Convenção de Montreal',
    cite: 'da Convenção para a Unificação de Certas Regras Relativas ao Transporte Aéreo Internacional (Montreal, 1999)',
    title: 'Convenção para a Unificação de Certas Regras Relativas ao Transporte Aéreo Internacional, Montreal, 28 de Maio de 1999',
  },
  cidSanidadeAnimal: {
    short: 'Regulamento de Sanidade Animal',
    cite: 'do Regulamento de Sanidade Animal',
    title: 'Regulamento de Sanidade Animal (Decreto n.º 26/2009) e posturas municipais sobre animais domésticos',
  },
  cidRegulacaoFinanceira: {
    short: 'Regulamentação do Banco de Moçambique',
    cite: 'da regulamentação do Banco de Moçambique sobre reclamações',
    title: 'Regulamentação do Banco de Moçambique sobre o tratamento de reclamações dos clientes de instituições de crédito e sociedades financeiras',
    url: 'https://amomif.org.mz/wp-content/uploads/2025/01/Avisos-8-9-e-10-2020.pdf',
  },
  cidRegimeSeguros: {
    short: 'Regime Jurídico dos Seguros',
    cite: 'do Regime Jurídico dos Seguros',
    title: 'Regime Jurídico dos Seguros (Decreto-Lei n.º 1/2010, de 31 de Dezembro); supervisor: Instituto de Supervisão de Seguros de Moçambique (ISSM)',
  },
  cidRegimeEstrangeiro: {
    short: 'Lei n.º 5/93',
    cite: 'da Lei n.º 5/93, de 28 de Dezembro',
    title: 'Lei n.º 5/93, de 28 de Dezembro — regime jurídico do cidadão estrangeiro (entrada, permanência e saída), e o seu regulamento',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_CIDADAO = {
  // ------------------------------------------------------------------ Petitions, information, ombudsman, corruption
  cidPeticaoForma: {
    title: { pt: 'Petição, queixa e reclamação — forma', en: 'Petition, complaint and objection — form' },
    summary: {
      pt: 'Qualquer cidadão, sozinho ou em conjunto com outros, pode dirigir petições, queixas ou reclamações à autoridade competente. O documento é escrito, identifica os peticionários (nome, documento de identificação e residência), expõe o assunto e o pedido e é assinado por todos. Numa petição colectiva, os signatários podem indicar um representante para os contactos.',
      en: 'Any citizen, alone or with others, may address petitions, complaints or objections to the competent authority. The document is written, identifies the petitioners (name, ID and residence), sets out the matter and the request and is signed by all. In a collective petition the signatories may name a representative for contacts.',
    },
    law: 'cidLei26_2014Peticoes',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Texto oficial não consultado; confirme os requisitos de forma e o número de assinaturas para petições à Assembleia da República.', en: 'Official text not read; confirm the formal requirements and the number of signatures for petitions to Parliament.' },
  },
  cidPeticaoIndeferimento: {
    title: { pt: 'Petição — indeferimento liminar', en: 'Petition — outright rejection' },
    summary: {
      pt: 'É indeferida logo à entrada a petição que vise reapreciar decisões dos tribunais ou actos administrativos definitivos de que já não caiba recurso, a que careça de qualquer fundamento ou a que respeite a direitos já prescritos.',
      en: 'A petition is rejected outright if it seeks to review court decisions or final administrative acts no longer open to appeal, has no basis at all or concerns time-barred rights.',
    },
    law: 'cidLei26_2014Peticoes',
    sourceUrl: 'https://gazettes.africa/akn/mz/officialGazette/government-gazette-series-i-supplement-no-8/2020-12-31/250/por@2020-12-31/source',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'A Resolução n.º 85/2020 da Assembleia da República cita o art. 14 da Lei n.º 26/2014; confirme no texto da lei.', en: 'Parliament Resolution 85/2020 cites art. 14 of Law 26/2014; confirm in the text of the law.' },
  },
  cidInformacaoPedido: {
    title: { pt: 'Pedido de acesso à informação', en: 'Request for access to information' },
    summary: {
      pt: 'O pedido é apresentado por escrito (ou oralmente, sendo reduzido a escrito) à entidade pública ou privada de interesse público que detém a informação. Identifica o requerente e os seus contactos, a informação pretendida com a precisão possível e a forma de acesso preferida (consulta, cópia, certidão, email). O acesso é gratuito, salvo o custo de reprodução.',
      en: 'The request is made in writing (or orally, then recorded in writing) to the public body or private body of public interest that holds the information. It identifies the requester and contacts, the information sought as precisely as possible and the preferred form of access (inspection, copy, certificate, email). Access is free, except for copying costs.',
    },
    law: 'lei34_2014',
    sourceUrl: 'https://www.irex.org/sites/default/files/pdf/guide-for-journalists-on-right-to-access-information.pdf',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Conteúdo do pedido conforme o Regulamento (Decreto n.º 35/2015) e o manual de procedimentos; confirme os artigos.', en: 'Content of the request per the Regulation (Decree 35/2015) and the procedures manual; confirm the articles.' },
  },
  cidInformacaoRecurso: {
    title: { pt: 'Recusa de informação — meios de reacção', en: 'Refusal of information — remedies' },
    summary: {
      pt: 'A recusa, total ou parcial, é fundamentada. Da recusa ou da falta de resposta no prazo cabe reclamação, recurso hierárquico e recurso contencioso para o tribunal administrativo; pode também apresentar-se queixa ao Provedor de Justiça.',
      en: 'A total or partial refusal must give reasons. A refusal or no answer within the time limit may be challenged by objection, hierarchical appeal and judicial review in the administrative court; a complaint may also go to the Ombudsman.',
    },
    law: 'lei34_2014',
    lastVerified: V,
    confidence: 'confirm',
  },
  cidProvedorQueixa: {
    title: { pt: 'Queixa ao Provedor de Justiça', en: 'Complaint to the Ombudsman' },
    summary: {
      pt: 'Qualquer cidadão pode queixar-se ao Provedor de Justiça de acções ou omissões da Administração Pública que violem os seus direitos. A queixa pode ser apresentada pessoalmente, por escrito, por correio, por email ou oralmente. O Provedor aprecia e dirige recomendações aos órgãos; não anula actos nem substitui os tribunais, e a queixa não suspende os prazos de recurso.',
      en: 'Any citizen may complain to the Ombudsman about acts or omissions of the public administration that violate their rights, in person, in writing, by post, by email or orally. The Ombudsman reviews and makes recommendations; it does not annul acts or replace the courts, and a complaint does not suspend appeal deadlines.',
    },
    law: 'cidLei7_2006Provedor',
    sourceUrl: 'https://aimnews.org/2025/11/05/provedor-de-justica-recebe-mais-de-3-500-peticoes-num-ano',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'O relatório anual do Provedor cita o art. 20 da Lei n.º 7/2006 para as formas de apresentação; confirme.', en: 'The Ombudsman’s annual report cites art. 20 of Law 7/2006 for the ways to file; confirm.' },
  },
  cidDenunciaCorrupcao: {
    title: { pt: 'Denúncia de corrupção', en: 'Reporting corruption' },
    summary: {
      pt: 'Qualquer pessoa pode denunciar ao Ministério Público, através do Gabinete Central de Combate à Corrupção (GCCC) ou dos Gabinetes Provinciais, factos que possam constituir corrupção, peculato, concussão ou outros crimes contra o Estado. A denúncia pode ser escrita ou oral e pode ser anónima.',
      en: 'Anyone may report to the Public Prosecutor, through the Central Office for Combating Corruption (GCCC) or the provincial offices, facts that may amount to bribery, embezzlement, extortion or other crimes against the State. Reports may be written or oral, and may be anonymous.',
    },
    law: 'cidLei6_2004Anticorrupcao',
    sourceUrl: 'https://cipmoz.org/wp-content/uploads/2021/02/Gabinete-Central-de-Combate-à-Corrupção-1.pdf',
    lastVerified: V,
    confidence: 'confirm',
  },
  cidDenunciaProteccao: {
    title: { pt: 'Protecção do denunciante', en: 'Whistleblower protection' },
    summary: {
      pt: 'O denunciante, a vítima e as testemunhas em processo penal podem pedir medidas de protecção, incluindo a reserva da identidade, aplicadas pelo Gabinete Central de Protecção à Vítima.',
      en: 'Whistleblowers, victims and witnesses in criminal proceedings may ask for protection measures, including confidentiality of identity, applied by the Central Victim Protection Office.',
    },
    law: 'cidLei15_2012Proteccao',
    sourceUrl: 'https://aimnews.org/2024/07/11/mocambique-escassez-de-recursos-condiciona-proteccao-dos-denunciantes/',
    lastVerified: V,
    confidence: 'confirm',
  },
  cidDenunciaCaluniosa: {
    title: { pt: 'Denúncia caluniosa', en: 'False accusation' },
    summary: {
      pt: 'Quem, por qualquer meio, denunciar ou lançar suspeita sobre pessoa determinada da prática de crime, sabendo que a imputação é falsa, com intenção de que contra ela se instaure procedimento, comete crime de denúncia caluniosa.',
      en: 'Anyone who accuses a specific person of a crime knowing the accusation is false, intending that proceedings be brought, commits the crime of false accusation.',
    },
    law: 'codigoPenal2019',
    lastVerified: V,
    confidence: 'confirm',
  },
  cidAudiencia: {
    title: { pt: 'Atendimento do público e audiências', en: 'Public reception and audiences' },
    summary: {
      pt: 'Os dirigentes dos órgãos e serviços públicos reservam períodos para atendimento do público. O pedido de audiência é feito por escrito, com a identificação do requerente e o assunto, e marcado pelo secretariado do dirigente.',
      en: 'Heads of public bodies set aside time to receive the public. An audience is requested in writing, stating who asks and the subject, and scheduled by the head’s office.',
    },
    law: 'nfsap',
    lastVerified: V,
    confidence: 'confirm',
  },
  cidManifestacaoAviso: {
    title: { pt: 'Reunião ou manifestação — aviso prévio', en: 'Meeting or demonstration — prior notice' },
    summary: {
      pt: 'Quem pretenda realizar reunião, comício, manifestação ou desfile em lugar público ou aberto ao público avisa previamente, por escrito, a autoridade civil do local (Presidente do Conselho Municipal ou Administrador do Distrito). O aviso indica o dia, a hora, o local ou o trajecto e o objecto, e é assinado pelos promotores identificados. É um aviso, não um pedido de autorização.',
      en: 'Anyone wishing to hold a meeting, rally, demonstration or march in a public place gives prior written notice to the local civil authority (municipal council chair or district administrator), stating day, time, place or route and purpose, signed by identified organisers. It is a notice, not a request for permission.',
    },
    law: 'cidLei9_91Reuniao',
    value: { diasUteis: 4, promotores: 3 },
    sourceUrl: 'https://cddmoz.org/wp-content/uploads/2022/07/Legislacao-desfasada-da-realidade-constitucional-e-ingerencia-ilegal-da-Policia-limitam-o-exercicio-do-direito-a-liberdade-de-reuniao-e-manifestacao.pdf',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Antecedência (quatro dias úteis) e número de promotores (três) por confirmar no texto consolidado da Lei n.º 9/91.', en: 'Notice period (four working days) and number of organisers (three) to be confirmed in the consolidated text of Law 9/91.' },
  },

  // ------------------------------------------------------------------ Land and municipality
  cidDuatCompetencia: {
    title: { pt: 'DUAT — quem autoriza o pedido', en: 'Land use right — who decides' },
    summary: {
      pt: 'Nas áreas dos municípios com serviços de cadastro, decide o Presidente do Conselho Municipal. Fora delas, decide o Governador Provincial (até 1.000 hectares), o Ministro que superintende a área da terra (de 1.000 a 10.000 hectares) ou o Conselho de Ministros (acima disso).',
      en: 'In municipal areas with a cadastre service, the municipal council chair decides. Elsewhere the Provincial Governor (up to 1,000 ha), the minister in charge of land (1,000 to 10,000 ha) or the Council of Ministers (above that).',
    },
    law: 'leiTerras1997',
    value: { governadorHa: 1000, ministroHa: 10000 },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 22 e 23 da Lei de Terras segundo fontes secundárias; uma nova Lei de Terras está em preparação.', en: 'Arts. 22 and 23 of the Land Law per secondary sources; a new Land Law is being prepared.' },
  },
  cidDuatPedido: {
    title: { pt: 'DUAT — instrução do pedido', en: 'Land use right — application file' },
    summary: {
      pt: 'O pedido é entregue nos serviços de cadastro (SDAE ou Serviços Provinciais de Geografia e Cadastro) ou no município, instruído com: documento de identificação do requerente; esboço de localização do terreno; memória descritiva; indicação da natureza e dimensão do empreendimento ou plano de exploração; parecer do Administrador do Distrito e acta da consulta às comunidades, quando exigidos; comprovativo do pagamento da taxa de autorização. Os serviços usam impressos próprios.',
      en: 'The application is lodged with the cadastre services (district services or provincial cadastre) or the municipality, with: the applicant’s ID; a location sketch; a descriptive note; the nature and size of the project or exploitation plan; the district administrator’s opinion and the community consultation minutes, where required; proof of the authorisation fee. The services use their own forms.',
    },
    law: 'regulamentoLeiTerras',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Art. 24 do Regulamento (Decreto n.º 66/98) segundo fontes secundárias; confirme a lista e os impressos.', en: 'Art. 24 of the Regulation (Decree 66/98) per secondary sources; confirm the list and forms.' },
  },
  cidDuatProvisorio: {
    title: { pt: 'Autorização provisória do DUAT', en: 'Provisional land use authorisation' },
    summary: {
      pt: 'O pedido para fins de actividade económica dá lugar a autorização provisória, durante a qual o titular executa o plano de exploração: até cinco anos para nacionais e até dois anos para estrangeiros. Cumprido o plano, é emitida a autorização definitiva e o título.',
      en: 'An application for an economic activity first gets a provisional authorisation while the holder carries out the exploitation plan: up to five years for nationals and two years for foreigners. Once the plan is met, the final authorisation and title are issued.',
    },
    law: 'leiTerras1997',
    value: { nacionaisAnos: 5, estrangeirosAnos: 2 },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Art. 25 da Lei de Terras segundo fontes secundárias.', en: 'Art. 25 of the Land Law per secondary sources.' },
  },
  cidDuatPrazo: {
    title: { pt: 'Prazo do DUAT', en: 'Term of the land use right' },
    summary: {
      pt: 'O DUAT para actividades económicas tem o prazo máximo de cinquenta anos, renovável a pedido do titular. Não está sujeito a prazo o DUAT adquirido por ocupação pelas comunidades locais, o destinado a habitação própria e o adquirido por pessoas singulares nacionais por ocupação de boa-fé.',
      en: 'A land use right for economic activities lasts up to fifty years, renewable at the holder’s request. Rights acquired by local communities by occupation, for one’s own home, or by nationals through good-faith occupation have no term.',
    },
    law: 'leiTerras1997',
    value: { anos: 50 },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Art. 17 da Lei de Terras segundo fontes secundárias.', en: 'Art. 17 of the Land Law per secondary sources.' },
  },
  cidSoloUrbano: {
    title: { pt: 'Terreno em área urbana', en: 'Land in urban areas' },
    summary: {
      pt: 'Nas cidades e vilas, o DUAT é atribuído pelo Presidente do Conselho Municipal (ou pelo Administrador do Distrito onde não haja município), de acordo com os planos de urbanização. O requerente obriga-se a ocupar e a construir nos prazos e nos termos do plano.',
      en: 'In cities and towns, the land use right is granted by the municipal council chair (or the district administrator where there is no municipality), in line with urban plans. The applicant must occupy and build within the plan’s terms and deadlines.',
    },
    law: 'cidDecreto60_2006SoloUrbano',
    lastVerified: V,
    confidence: 'confirm',
  },
  cidLicencaObra: {
    title: { pt: 'Licença de construção', en: 'Building permit' },
    summary: {
      pt: 'As obras de construção, reconstrução, ampliação, alteração e demolição em área urbana dependem de licença municipal. O pedido é instruído com o título do DUAT (ou documento que prove o direito ao terreno), a planta de localização e o projecto. Obras de pequena dimensão podem ter regime simplificado. Muitos municípios exigem impresso próprio.',
      en: 'Construction, rebuilding, extension, alteration and demolition in urban areas need a municipal permit. The application includes the land use title (or proof of the right to the plot), a location plan and the design. Small works may follow a simplified procedure. Many municipalities require their own form.',
    },
    law: 'cidDecreto2_2004Obras',
    lastVerified: V,
    confidence: 'confirm',
  },

  // ------------------------------------------------------------------ Utilities, telecommunications, transport
  cidTelecomReclamacao: {
    title: { pt: 'Reclamação de serviços de telecomunicações', en: 'Telecommunications complaints' },
    summary: {
      pt: 'O utilizador reclama primeiro junto da operadora (loja, linha de apoio ou por escrito). Sem resposta ou sem solução, pode reclamar ao Instituto Nacional das Comunicações de Moçambique (INCM), que aprecia as reclamações dos consumidores e decide os recursos.',
      en: 'The user first complains to the operator (shop, helpline or in writing). With no answer or solution, the user may complain to the National Communications Institute (INCM), which handles consumer complaints and appeals.',
    },
    law: 'cidLei4_2016Telecom',
    sourceUrl: 'https://allafrica.com/stories/202609110253.html',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'O regulador continua a designar-se INCM em 2026 (a ARC é a Autoridade Reguladora da Concorrência). Prazos de resposta das operadoras por confirmar no regulamento do INCM.', en: 'The regulator is still called INCM in 2026 (ARC is the competition authority). Operator response deadlines to be confirmed in the INCM regulation.' },
  },
  cidEnergiaReclamacao: {
    title: { pt: 'Reclamação do fornecimento de energia', en: 'Electricity supply complaints' },
    summary: {
      pt: 'O consumidor reclama primeiro junto da distribuidora (EDM ou concessionária local). Não sendo atendido, pode recorrer à Autoridade Reguladora de Energia (ARENE), que regula a qualidade do serviço e as relações com os consumidores.',
      en: 'The consumer first complains to the distributor (EDM or a local concessionaire). If not satisfied, the consumer may turn to the Energy Regulatory Authority (ARENE), which regulates service quality and consumer relations.',
    },
    law: 'cidLeiElectricidade',
    lastVerified: V,
    confidence: 'confirm',
  },
  cidAguaReclamacao: {
    title: { pt: 'Reclamação do abastecimento de água', en: 'Water supply complaints' },
    summary: {
      pt: 'O consumidor reclama primeiro junto do fornecedor (Águas da Região de Maputo, FIPAG ou outro operador). Não sendo atendido, pode reclamar à Autoridade Reguladora de Águas (AURA, IP), que dispõe de plataforma de reclamações e pode ordenar a revisão de facturas.',
      en: 'The consumer first complains to the supplier (Águas da Região de Maputo, FIPAG or another operator). If not satisfied, the consumer may complain to the water regulator (AURA, IP), which runs a complaints platform and can order bills to be revised.',
    },
    law: 'cidRegulacaoAgua',
    sourceUrl: 'https://clubofmozambique.com/news/mozambique-regulatory-authority-orders-revision-of-quadruplicate-water-bills/',
    lastVerified: V,
    confidence: 'confirm',
  },
  cidAviacaoReclamacao: {
    title: { pt: 'Transporte aéreo — prazos de reclamação', en: 'Air transport — complaint deadlines' },
    summary: {
      pt: 'Nos voos internacionais abrangidos pela Convenção de Montreal, o passageiro reclama por escrito à transportadora: bagagem danificada, até sete dias após a recepção; bagagem atrasada, até vinte e um dias após a data em que devia ser entregue. A acção judicial caduca ao fim de dois anos.',
      en: 'On international flights covered by the Montreal Convention, the passenger complains in writing to the carrier: damaged baggage within seven days of receipt; delayed baggage within twenty-one days of the date it should have been delivered. Court action lapses after two years.',
    },
    law: 'cidConvencaoMontreal',
    value: { danoDias: 7, atrasoDias: 21, accaoAnos: 2 },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 31 e 35 da Convenção; confirme a vinculação de Moçambique e as regras do IACM para voos domésticos.', en: 'Arts. 31 and 35 of the Convention; confirm Mozambique’s accession and the civil aviation authority’s rules for domestic flights.' },
  },
  cidFinanceiroReclamacao: {
    title: { pt: 'Reclamações a bancos e instituições financeiras', en: 'Complaints to banks and financial institutions' },
    summary: {
      pt: 'O cliente reclama primeiro junto do banco, da microfinança ou do agente de moeda electrónica (M-Pesa, e-Mola, mKesh). Sem resposta no prazo ou sem solução, pode reclamar ao Banco de Moçambique, que supervisiona a conduta das instituições.',
      en: 'The customer first complains to the bank, microfinance institution or e-money provider. With no answer in time or no solution, the customer may complain to the Bank of Mozambique, which supervises conduct.',
    },
    law: 'cidRegulacaoFinanceira',
    sourceUrl: 'https://amomif.org.mz/wp-content/uploads/2025/01/Avisos-8-9-e-10-2020.pdf',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Avisos do Banco de Moçambique de 2020 sobre reclamações (revisão em consulta pública em 2025); confirme os prazos.', en: 'Bank of Mozambique notices of 2020 on complaints (revision consulted in 2025); confirm the deadlines.' },
  },
  cidSegurosReclamacao: {
    title: { pt: 'Reclamações a seguradoras', en: 'Complaints to insurers' },
    summary: {
      pt: 'O tomador do seguro ou o lesado reclama primeiro junto da seguradora. Sem solução, pode apresentar reclamação ao Instituto de Supervisão de Seguros de Moçambique (ISSM).',
      en: 'The policyholder or injured party first complains to the insurer. Without a solution, they may complain to the insurance supervisor (ISSM).',
    },
    law: 'cidRegimeSeguros',
    lastVerified: V,
    confidence: 'confirm',
  },
  cidInaeQueixa: {
    title: { pt: 'Queixa às autoridades de defesa do consumidor', en: 'Complaint to consumer protection authorities' },
    summary: {
      pt: 'A Inspecção Nacional das Actividades Económicas (INAE) fiscaliza o comércio e as regras de defesa do consumidor e recebe denúncias e queixas dos consumidores. As associações de consumidores podem apoiar e representar os consumidores.',
      en: 'The National Inspectorate of Economic Activities (INAE) supervises trade and consumer protection rules and receives consumer reports and complaints. Consumer associations may support and represent consumers.',
    },
    law: 'lei22_2009',
    lastVerified: V,
    confidence: 'confirm',
  },
  cidClausulasAbusivas: {
    title: { pt: 'Fim de contratos de consumo', en: 'Ending consumer contracts' },
    summary: {
      pt: 'O consumidor tem direito à protecção contra cláusulas abusivas: não valem as cláusulas que o impeçam de pôr fim ao contrato ou lhe imponham penalizações desproporcionadas. Nos contratos por tempo indeterminado, cada parte pode pôr-lhes termo com o pré-aviso contratado ou, na falta dele, razoável.',
      en: 'Consumers are protected against unfair terms: terms preventing them from ending the contract or imposing disproportionate penalties are invalid. Open-ended contracts may be ended by either party with the agreed or, failing that, reasonable notice.',
    },
    law: 'lei22_2009',
    lastVerified: V,
    confidence: 'confirm',
  },

  // ------------------------------------------------------------------ Civil law (Código Civil de 1966, como aplicado em Moçambique)
  cidResponsabilidadeCivil: {
    title: { pt: 'Responsabilidade civil por danos', en: 'Civil liability for damage' },
    summary: {
      pt: 'Aquele que, com dolo ou mera culpa, violar ilicitamente o direito de outrem fica obrigado a indemnizar o lesado pelos danos resultantes. A indemnização cobre os danos causados e os lucros cessantes.',
      en: 'Whoever, intentionally or negligently, unlawfully violates another’s right must compensate the injured party for the resulting damage, including lost profits.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 483.º e 562.º e seguintes do Código Civil de 1966.', en: 'Arts. 483 and 562 ff. of the 1966 Civil Code.' },
  },
  cidPrescricaoIndemnizacao: {
    title: { pt: 'Prazo para pedir indemnização', en: 'Time limit for damages claims' },
    summary: {
      pt: 'O direito de indemnização por facto ilícito prescreve no prazo de três anos a contar da data em que o lesado teve conhecimento do direito.',
      en: 'The right to damages for a wrongful act is time-barred three years after the injured party learned of the right.',
    },
    law: 'codigoCivil',
    value: { anos: 3 },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Art. 498.º do Código Civil de 1966.', en: 'Art. 498 of the 1966 Civil Code.' },
  },
  cidPagamentoIndevido: {
    title: { pt: 'Restituição do que foi pago sem causa', en: 'Return of undue payments' },
    summary: {
      pt: 'Quem recebe, sem causa justificativa, uma prestação que não lhe era devida (pagamento em duplicado, serviço não prestado, caução sem danos a compensar) é obrigado a restituí-la.',
      en: 'Whoever receives, without cause, a payment that was not owed (double payment, service not provided, deposit with no damage to offset) must return it.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 473.º e 476.º do Código Civil de 1966 (enriquecimento sem causa; repetição do indevido).', en: 'Arts. 473 and 476 of the 1966 Civil Code (unjust enrichment; recovery of undue payment).' },
  },
  cidVizinhanca: {
    title: { pt: 'Relações de vizinhança', en: 'Neighbour relations' },
    summary: {
      pt: 'O proprietário pode opor-se à emissão de fumo, fuligem, vapores, cheiros, calor, ruídos e factos semelhantes vindos de prédio vizinho, quando causem prejuízo substancial ao uso do seu imóvel ou não resultem da utilização normal do prédio de onde vêm. Há também regras sobre o escoamento de águas, árvores e construções junto à estrema. As posturas municipais fixam horários de ruído.',
      en: 'An owner may object to smoke, soot, fumes, smells, heat, noise and similar emissions from a neighbouring property when they substantially impair the use of their property or do not result from normal use. There are also rules on water run-off, trees and buildings near the boundary. Municipal by-laws set noise hours.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 1346.º, 1351.º e 1366.º do Código Civil de 1966.', en: 'Arts. 1346, 1351 and 1366 of the 1966 Civil Code.' },
  },
  cidAnimalResponsabilidade: {
    title: { pt: 'Danos causados por animais', en: 'Damage caused by animals' },
    summary: {
      pt: 'Quem tiver assumido o encargo da vigilância de um animal responde pelos danos que ele causar, salvo se provar que não houve culpa sua; quem utiliza animais no seu interesse responde pelos danos resultantes do perigo especial que envolvem.',
      en: 'Whoever undertakes to watch over an animal is liable for the damage it causes unless they prove no fault; whoever uses animals in their own interest is liable for damage from the special danger they involve.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 493.º e 502.º do Código Civil de 1966.', en: 'Arts. 493 and 502 of the 1966 Civil Code.' },
  },
  cidAnimalVacina: {
    title: { pt: 'Vacinação e registo de cães e gatos', en: 'Vaccination and registration of dogs and cats' },
    summary: {
      pt: 'A vacinação anti-rábica de cães e gatos é obrigatória e repete-se nos intervalos fixados pelos serviços de veterinária. Os municípios podem exigir o registo e a licença dos cães e regras de circulação na via pública (trela, açaime para raças perigosas).',
      en: 'Rabies vaccination of dogs and cats is compulsory and repeated at the intervals set by the veterinary services. Municipalities may require dog registration and licences and rules for public places (lead, muzzle for dangerous breeds).',
    },
    law: 'cidSanidadeAnimal',
    lastVerified: V,
    confidence: 'confirm',
  },

  // ------------------------------------------------------------------ Registries and residence
  cidCertidaoPublicidade: {
    title: { pt: 'Certidões dos registos', en: 'Registry certificates' },
    summary: {
      pt: 'Os registos predial, comercial e automóvel são públicos: qualquer pessoa pode pedir certidão dos actos registados, pagando os emolumentos. No registo civil, as certidões de nascimento, casamento e óbito são passadas a quem as peça, salvo as que contenham menções reservadas, passadas apenas ao próprio, aos seus familiares ou a quem prove interesse legítimo.',
      en: 'The land, commercial and vehicle registries are public: anyone may ask for a certificate of a registered act, paying the fees. At the civil registry, birth, marriage and death certificates are issued on request, except those with confidential entries, issued only to the person, their family or someone showing a legitimate interest.',
    },
    law: 'codigoRegistoPredial2018',
    lastVerified: V,
    confidence: 'confirm',
  },
  cidMoradaEstrangeiro: {
    title: { pt: 'Estrangeiros — mudança de residência', en: 'Foreigners — change of address' },
    summary: {
      pt: 'O cidadão estrangeiro residente comunica aos serviços de migração a mudança de residência e outras alterações dos dados do DIRE, nos prazos do regulamento.',
      en: 'A resident foreign national notifies the migration services of a change of address and other changes to the residence permit data, within the regulation’s deadlines.',
    },
    law: 'cidRegimeEstrangeiro',
    lastVerified: V,
    confidence: 'confirm',
  },
} satisfies Record<string, LegalEntryDef>;
