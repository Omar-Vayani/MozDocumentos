// Legal values for the "digital" (technology, media, intellectual property)
// and "turismo" (tourism, transport, agriculture, fisheries, private security)
// documents. Keys must be unique across all legal files: prefix `dig` / `tur`.
//
// Primary texts (Boletim da República, FAOLEX, WIPO Lex) could not be read for
// most of these entries; they are marked `confidence: 'confirm'` and carry no
// article number (the article reported by secondary sources is kept in `note`).
// The Código Comercial entries were read in the Boletim da República text.
//
// Reused from other files: leiTransaccoesElectronicas3_2017 and
// protecaoDadosRegime (eventos), consumidorRetractacao and livroReclamacoes
// (comercio), clausulasNaoEscritas, terraPropriedadeEstado and
// codigoCivilPrestacaoServicos (contratos / core), maioridade (pessoal-rh),
// transporteRegime and concessaoCulturas (comercio).
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-14';
const CCOM = 'https://www.mdradvogados.com/xms/files/2022/Aprovacao_do_Novo_Codigo_Comercial_-_Legal_Alert_MDR.pdf';

export const LAWS_DIGITAL = {
  digDireitosAutor9_2022: {
    short: 'Lei dos Direitos de Autor e Direitos Conexos',
    cite: 'da Lei dos Direitos de Autor e Direitos Conexos',
    title: 'Lei n.º 9/2022, de 29 de Junho — Lei dos Direitos de Autor e Direitos Conexos (revoga a Lei n.º 4/2001, de 27 de Fevereiro)',
    url: 'https://www.wipo.int/wipolex/en/legislation/details/21426',
  },
  digRegDireitosAutor46_2024: {
    short: 'Regulamento da Lei dos Direitos de Autor',
    cite: 'do Regulamento da Lei dos Direitos de Autor e Direitos Conexos',
    title: 'Decreto n.º 46/2024, de 27 de Junho — Regulamento da Lei dos Direitos de Autor e Direitos Conexos',
    url: 'https://archive.gazettes.africa/archive/mz/2024/mz-government-gazette-series-i-dated-2024-06-27-no-124.pdf',
  },
  digComunicacaoSocial2026: {
    short: 'Lei da Comunicação Social',
    cite: 'da Lei da Comunicação Social',
    title: 'Lei da Comunicação Social (aprovada pela Assembleia da República em Março de 2026 e promulgada a 27 de Maio de 2026; substitui a Lei de Imprensa, Lei n.º 18/91, de 10 de Agosto)',
    url: 'https://aimnews.org/2026/05/27/nova-lei-da-comunicacao-social-entra-em-vigor-em-mocambique/',
  },
  turLeiTurismo4_2004: {
    short: 'Lei do Turismo',
    cite: 'da Lei do Turismo',
    title: 'Lei n.º 4/2004, de 17 de Junho — Lei do Turismo',
    url: 'https://faolex.fao.org/docs/pdf/moz208350.pdf',
  },
  turRegAlojamento97_2013: {
    short: 'Regulamento de Alojamento Turístico',
    cite: 'do Regulamento de Alojamento Turístico, Restauração e Bebidas e Salas de Dança',
    title: 'Decreto n.º 97/2013, de 31 de Dezembro — Regulamento de Alojamento Turístico, Restauração e Bebidas e Salas de Dança',
    url: 'https://pdf.usaid.gov/pdf_docs/PA00KRXR.pdf',
  },
  turLeiPescas22_2013: {
    short: 'Lei das Pescas',
    cite: 'da Lei das Pescas',
    title: 'Lei n.º 22/2013, de 1 de Novembro — Lei das Pescas',
    url: 'https://faolex.fao.org/docs/pdf/moz198043.pdf',
  },
  turRepmar89_2020: {
    short: 'Regulamento da Pesca Marítima (REPMAR)',
    cite: 'do Regulamento da Pesca Marítima',
    title: 'Decreto n.º 89/2020, de 8 de Outubro — Regulamento da Pesca Marítima (REPMAR), que revoga o Decreto n.º 43/2003',
    url: 'https://faolex.fao.org/docs/pdf/moz198043.pdf',
  },
  turSegPrivada9_2007: {
    short: 'Regulamento das Empresas de Segurança Privada',
    cite: 'do regime das empresas de segurança privada',
    title: 'Decreto n.º 9/2007, de 30 de Abril — Regulamento das Empresas de Segurança Privada (parcialmente declarado inconstitucional pelo Acórdão n.º 5/CC/2008)',
    url: 'https://cddmoz.org/wp-content/uploads/2025/12/Papel-do-Governo-na-supervisao-da-seguranca-privada-e-na-regulacao-das-relacoes-empresa-comunidade.pdf',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_DIGITAL = {
  // ------------------------------------------------------------------ Online services and data
  digComercioElectronico: {
    title: { pt: 'Comércio electrónico e contratos celebrados online', en: 'E-commerce and contracts made online' },
    summary: {
      pt: 'A Lei das Transacções Electrónicas reconhece a validade dos contratos e das declarações feitos por meios electrónicos e das assinaturas electrónicas. Quem presta serviços ou vende online deve identificar-se (nome, sede, NUIT, contactos), indicar com clareza os preços, as etapas para contratar e as condições aplicáveis, e confirmar a encomenda ao cliente.',
      en: 'The Electronic Transactions Law recognises contracts, declarations and e-signatures made electronically. Whoever sells or provides services online must identify itself (name, seat, NUIT, contacts), state prices, the steps to contract and the applicable terms clearly, and confirm the order to the customer.',
    },
    law: 'leiTransaccoesElectronicas3_2017',
    sourceUrl: 'https://insights.afriwise.com/blog/electronic-transactions-in-the-mozambican-legal-system',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Regras do comércio electrónico reportadas a partir do art. 33.º da Lei n.º 3/2017; confirmar no texto publicado.', en: 'E-commerce rules reported from art. 33 of Law 3/2017; confirm in the published text.' },
  },
  digDadosPessoaisOnline: {
    title: { pt: 'Dados pessoais tratados por meios electrónicos', en: 'Personal data processed electronically' },
    summary: {
      pt: 'Quem recolhe, trata ou guarda dados pessoais por meios electrónicos deve fazê-lo para fins determinados e legítimos, com conhecimento do titular, garantir a segurança dos dados e designar um responsável pelo cumprimento das regras de protecção de dados. Até à aprovação de uma lei geral de protecção de dados, aplicam-se estas regras e a protecção constitucional da vida privada.',
      en: 'Whoever collects, processes or stores personal data electronically must do so for specified, legitimate purposes, with the data subject’s knowledge, keep the data secure and appoint a person responsible for data-protection compliance. Until a general data-protection law is passed, these rules and the constitutional protection of privacy apply.',
    },
    law: 'leiTransaccoesElectronicas3_2017',
    sourceUrl: 'https://dti.eui.eu/database/page/240/',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Capítulo de protecção de dados reportado nos arts. 63.º a 65.º da Lei n.º 3/2017. A proposta de Lei de Protecção de Dados Pessoais foi aprovada pelo Conselho de Ministros em 2026 e estava na Assembleia da República em Agosto de 2026; reveja esta política quando for publicada.',
      en: 'Data-protection chapter reported at arts. 63–65 of Law 3/2017. The Personal Data Protection bill was approved by the Council of Ministers in 2026 and was before Parliament in August 2026; review the policy when it is published.',
    },
  },
  digCookiesConsentimento: {
    title: { pt: 'Cookies e tecnologias de rastreamento', en: 'Cookies and tracking technologies' },
    summary: {
      pt: 'A lei moçambicana não tem regras próprias sobre cookies. Os cookies que identificam o utilizador tratam dados pessoais e seguem as regras gerais: informação clara ao utilizador e, para cookies não essenciais (análise e publicidade), a boa prática é pedir o consentimento antes de os activar.',
      en: 'Mozambican law has no cookie-specific rules. Cookies that identify the user process personal data and follow the general rules: clear information and, for non-essential cookies (analytics, advertising), good practice is to ask consent before setting them.',
    },
    law: 'leiTransaccoesElectronicas3_2017',
    lastVerified: V,
    confidence: 'confirm',
  },

  // ------------------------------------------------------------------ Image and copyright
  digDireitoImagem: {
    title: { pt: 'Direito à imagem', en: 'Right to one’s image' },
    summary: {
      pt: 'O retrato de uma pessoa não pode ser exposto, reproduzido ou usado comercialmente sem o seu consentimento, salvo nos casos previstos na lei (notoriedade, cargo público, fins culturais, lugares públicos ou factos de interesse público, desde que não ofendam a honra ou o decoro da pessoa). O consentimento pode ser limitado no tempo, no meio e na finalidade, e é revogável.',
      en: 'A person’s portrait may not be displayed, reproduced or used commercially without consent, except as the law allows (public figures, public office, cultural purposes, public places or events of public interest, provided honour and decency are not harmed). Consent may be limited in time, medium and purpose, and can be withdrawn.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Art. 79.º do Código Civil (direito à imagem) e art. 81.º (limitação voluntária dos direitos de personalidade, revogável). Confirmar a redacção em vigor em Moçambique.', en: 'Civil Code art. 79 (image) and art. 81 (voluntary, revocable limitation of personality rights). Confirm the text in force in Mozambique.' },
  },
  digImagemMenor: {
    title: { pt: 'Imagem de crianças', en: 'Images of children' },
    summary: {
      pt: 'Pela criança decidem os pais ou quem exerce o poder parental. A criança tem direito à protecção da sua imagem e da sua vida privada, e a sua opinião deve ser tida em conta de acordo com a idade e a maturidade. Não use imagens que a exponham a risco, a identifiquem como vítima ou a ridicularizem.',
      en: 'Parents or whoever holds parental authority decide for the child. The child has a right to protection of image and privacy, and the child’s views count according to age and maturity. Do not use images that expose the child to risk, identify the child as a victim or ridicule the child.',
    },
    law: 'eduCrianca7_2008',
    lastVerified: V,
    confidence: 'confirm',
  },
  digDireitosAutorTransmissao: {
    title: { pt: 'Transmissão e licença de direitos de autor', en: 'Transfer and licensing of copyright' },
    summary: {
      pt: 'O autor pode transmitir, total ou parcialmente, ou autorizar a utilização dos direitos patrimoniais sobre a obra. O contrato deve ser escrito e indicar os modos de utilização, as condições de tempo, de lugar e de preço. Os direitos morais (paternidade e integridade da obra) são inalienáveis e irrenunciáveis.',
      en: 'The author may transfer, wholly or partly, or license the economic rights in a work. The contract must be in writing and state the forms of use and the conditions of time, place and price. Moral rights (authorship and integrity) cannot be transferred or waived.',
    },
    law: 'digDireitosAutor9_2022',
    sourceUrl: 'https://www.wipo.int/wipolex/en/legislation/details/21426',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Ler os artigos sobre transmissão, oneração e licença na Lei n.º 9/2022 e verificar se exige reconhecimento notarial da assinatura na transmissão total.', en: 'Read the articles on transfer, encumbrance and licensing in Law 9/2022 and check whether a notarised signature is required for a full transfer.' },
  },
  digObraEncomenda: {
    title: { pt: 'Obra feita por encomenda ou por conta de outrem', en: 'Commissioned works and works for hire' },
    summary: {
      pt: 'Na obra feita por encomenda ou por conta de outrem, a titularidade dos direitos patrimoniais é a que resultar do contrato. Na falta de acordo, presume-se que pertence ao autor, podendo o comitente usar a obra para o fim previsto na encomenda. Por isso, o contrato deve dizer expressamente a quem ficam os direitos.',
      en: 'For commissioned works and works for hire, ownership of the economic rights is as agreed. Without agreement it is presumed to belong to the author, and the commissioning party may use the work for the purpose of the commission. The contract should say expressly who owns the rights.',
    },
    law: 'digDireitosAutor9_2022',
    lastVerified: V,
    confidence: 'confirm',
  },
  digDireitosAutorDuracao: {
    title: { pt: 'Duração dos direitos de autor', en: 'Term of copyright' },
    summary: {
      pt: 'Os direitos patrimoniais duram toda a vida do autor e um período após a sua morte fixado na lei, findo o qual a obra cai no domínio público.',
      en: 'Economic rights last for the author’s life and a period after death fixed by law, after which the work enters the public domain.',
    },
    law: 'digDireitosAutor9_2022',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirmar o prazo após a morte do autor na Lei n.º 9/2022.', en: 'Confirm the post-mortem term in Law 9/2022.' },
  },
  digContratoEdicao: {
    title: { pt: 'Contrato de edição', en: 'Publishing contract' },
    summary: {
      pt: 'Pelo contrato de edição, o autor autoriza o editor a reproduzir a obra e a distribuí-la por sua conta, mediante remuneração. O contrato deve ser escrito e indicar o número de edições, a tiragem, o prazo para publicar, o preço de venda e a remuneração do autor. A edição não transfere a propriedade da obra.',
      en: 'Under a publishing contract, the author authorises the publisher to reproduce and distribute the work at its own cost, for remuneration. It must be in writing and state the number of editions, print run, publication deadline, retail price and the author’s remuneration. Publishing does not transfer ownership of the work.',
    },
    law: 'digDireitosAutor9_2022',
    lastVerified: V,
    confidence: 'confirm',
  },
  digDireitoResposta: {
    title: { pt: 'Direito de resposta e de rectificação', en: 'Right of reply and correction' },
    summary: {
      pt: 'Quem for referido num órgão de comunicação social de forma que possa afectar a sua reputação, ou em factos inverídicos ou erróneos, tem direito de resposta ou de rectificação. O pedido é dirigido ao director do órgão, por escrito e com assinatura identificada, dentro do prazo legal após a publicação ou emissão. A resposta é publicada gratuitamente, no mesmo lugar e com o mesmo destaque.',
      en: 'Anyone named by the media in a way that may damage their reputation, or in untrue or wrong facts, has a right of reply or correction. The request goes to the editor in writing, signed, within the legal period after publication or broadcast. The reply is published free of charge, in the same place and with the same prominence.',
    },
    law: 'digComunicacaoSocial2026',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Regime previsto na Lei de Imprensa (Lei n.º 18/91) e retomado na Lei da Comunicação Social de 2026; confirme o prazo e os limites de extensão no texto publicado no Boletim da República.', en: 'Provided for in the Press Law (Law 18/91) and carried into the 2026 Media Law; confirm the deadline and length limits in the published text.' },
  },
  digResponsabilidadeOnline: {
    title: { pt: 'Conteúdos publicados na Internet', en: 'Content published online' },
    summary: {
      pt: 'Pelos conteúdos difundidos na Internet respondem o autor do conteúdo e o responsável pelo sítio ou pela página que o publica. Quem gere uma página ou plataforma deve retirar ou corrigir prontamente o conteúdo ilícito de que tenha conhecimento.',
      en: 'For content spread online, both the author and whoever runs the website or page that publishes it are liable. Whoever runs a page or platform should promptly remove or correct unlawful content it becomes aware of.',
    },
    law: 'digComunicacaoSocial2026',
    sourceUrl: 'https://www.rtp.pt/noticias/mundo/nova-lei-cria-regulador-da-comunicacao-social-em-mocambique-e-carteira-obrigatoria_n1684695',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Segundo a versão da proposta em consulta pública; confirmar no texto final.', en: 'From the public-consultation version of the bill; confirm in the final text.' },
  },
  digPublicidadeIdentificavel: {
    title: { pt: 'Publicidade identificável', en: 'Advertising must be identifiable' },
    summary: {
      pt: 'A publicidade deve ser identificada como tal, de forma clara, qualquer que seja o meio. A publicidade oculta ou enganosa ao consumidor é proibida. Nas redes sociais, isto significa assinalar as publicações pagas ou patrocinadas.',
      en: 'Advertising must be clearly identified as such in any medium. Hidden or misleading advertising to consumers is prohibited. On social media this means labelling paid or sponsored posts.',
    },
    law: 'lei22_2009',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Princípio da Lei de Defesa do Consumidor e do Código da Publicidade (Decreto n.º 38/2016); confirmar artigos.', en: 'Principle of the Consumer Protection Law and the Advertising Code (Decree 38/2016); confirm articles.' },
  },

  // ------------------------------------------------------------------ Tourism
  turLicencaAlojamento: {
    title: { pt: 'Licença e classificação do alojamento turístico', en: 'Licence and classification of tourist accommodation' },
    summary: {
      pt: 'Os estabelecimentos de alojamento turístico, restauração e bebidas só podem funcionar com licença e classificação atribuídas pela entidade competente do turismo. Devem afixar a licença, a classificação e os preços, e ter livro de reclamações à disposição dos clientes.',
      en: 'Tourist accommodation, restaurants and bars may operate only with a licence and classification from the tourism authority. They must display the licence, the classification and the prices, and keep a complaints book available.',
    },
    law: 'turRegAlojamento97_2013',
    lastVerified: V,
    confidence: 'confirm',
  },
  turRegistoHospedes: {
    title: { pt: 'Registo de hóspedes e comunicação de estrangeiros', en: 'Guest register and reporting of foreign guests' },
    summary: {
      pt: 'Os estabelecimentos de alojamento mantêm o registo dos hóspedes, com a identificação e as datas de entrada e saída, e comunicam os hóspedes estrangeiros aos serviços de migração (SENAMI), no modelo e no prazo legais.',
      en: 'Accommodation establishments keep a guest register with identification and arrival and departure dates, and report foreign guests to the migration service (SENAMI) on the official form and within the legal period.',
    },
    law: 'turRegAlojamento97_2013',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'O boletim de alojamento de estrangeiros segue modelo oficial dos serviços de migração; confirmar prazo e diploma aplicável.', en: 'The foreign-guest form follows an official migration-service model; confirm the deadline and the applicable regulation.' },
  },
  turRegulamentoInterno: {
    title: { pt: 'Regulamento interno do estabelecimento', en: 'House rules of the establishment' },
    summary: {
      pt: 'O estabelecimento pode fixar regras de funcionamento para os hóspedes (horários, visitas, segurança, uso das instalações). As regras devem estar afixadas ou ser entregues antes da estadia e não podem afastar os direitos do consumidor.',
      en: 'The establishment may set house rules for guests (hours, visitors, safety, use of facilities). They must be displayed or handed over before the stay and cannot override consumer rights.',
    },
    law: 'turRegAlojamento97_2013',
    lastVerified: V,
    confidence: 'confirm',
  },
  turAgenciaViagens: {
    title: { pt: 'Agências de viagens e operadores turísticos', en: 'Travel agencies and tour operators' },
    summary: {
      pt: 'A organização e venda de viagens e de pacotes turísticos é actividade de agências de viagens e operadores licenciados. O cliente deve receber, antes do contrato, o programa, o preço total, o que está incluído e as condições de cancelamento.',
      en: 'Organising and selling trips and package tours is an activity for licensed travel agencies and operators. The customer must receive the programme, total price, inclusions and cancellation terms before contracting.',
    },
    law: 'turLeiTurismo4_2004',
    lastVerified: V,
    confidence: 'confirm',
  },
  turGuiaTurismo: {
    title: { pt: 'Guias de turismo', en: 'Tour guides' },
    summary: {
      pt: 'A actividade de guia de turismo está sujeita ao regime do turismo e ao licenciamento das actividades económicas. Nas áreas de conservação, a entrada e a condução de visitantes seguem as regras e as taxas da área.',
      en: 'Tour guiding falls under the tourism regime and business licensing. In conservation areas, entry and guiding of visitors follow the area’s rules and fees.',
    },
    law: 'turLeiTurismo4_2004',
    lastVerified: V,
    confidence: 'confirm',
  },
  turRenunciaResponsabilidade: {
    title: { pt: 'Limites à exclusão de responsabilidade', en: 'Limits on excluding liability' },
    summary: {
      pt: 'É nula a cláusula pela qual o credor renuncia antecipadamente aos seus direitos em caso de incumprimento, e não se pode excluir a responsabilidade por dolo ou culpa grave, nem por danos à vida e à integridade física causados por negligência. Um termo de aceitação de risco informa o participante dos riscos próprios da actividade, mas não isenta o organizador dos seus deveres de segurança.',
      en: 'A clause by which a creditor waives in advance their rights on breach is void, and liability for wilful misconduct, gross negligence or negligent harm to life and physical integrity cannot be excluded. A risk acknowledgement informs participants of the inherent risks but does not release the organiser from its safety duties.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Art. 809.º do Código Civil e regime das cláusulas contratuais gerais; confirmar a redacção em vigor.', en: 'Civil Code art. 809 and the general contract terms rules; confirm the text in force.' },
  },
  turAluguerViatura: {
    title: { pt: 'Aluguer de viaturas sem condutor', en: 'Self-drive vehicle hire' },
    summary: {
      pt: 'O aluguer de viaturas é uma locação de coisa móvel. Quem o exerce como actividade comercial precisa de licença. A viatura deve ter seguro obrigatório de responsabilidade civil e os documentos a bordo; o locatário responde pelas multas e pelos danos durante o aluguer, nos termos do contrato.',
      en: 'Car hire is a lease of a movable thing. Doing it as a business requires a licence. The car must carry compulsory third-party insurance and its documents; the hirer is liable for fines and damage during the hire, as agreed.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Locação: arts. 1022.º e seguintes do Código Civil. Seguro obrigatório automóvel: Decreto n.º 45/2003. Confirmar o regime de licenciamento do aluguer de viaturas.', en: 'Lease: Civil Code arts. 1022 ff. Compulsory motor insurance: Decree 45/2003. Confirm the licensing rules for car hire.' },
  },
  turTransportePassageiros: {
    title: { pt: 'Transporte ocasional de passageiros', en: 'Occasional passenger transport' },
    summary: {
      pt: 'O transporte de passageiros por conta de outrem, incluindo o aluguer de autocarro ou viatura com motorista, exige licença de transportador, viaturas inspeccionadas, seguro de passageiros e motoristas com carta da categoria adequada. A lotação da viatura não pode ser excedida.',
      en: 'Carrying passengers for hire, including renting a bus or car with driver, requires a carrier licence, inspected vehicles, passenger insurance and drivers with the right licence category. Seating capacity may not be exceeded.',
    },
    law: 'regimeContratosComerciais',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirmar o regulamento de transporte rodoviário de passageiros em vigor e o seguro obrigatório.', en: 'Confirm the road passenger transport regulation in force and the compulsory insurance.' },
  },

  // ------------------------------------------------------------------ Business lease
  turCessaoExploracaoForma: {
    title: { pt: 'Locação (cessão de exploração) do estabelecimento — forma', en: 'Lease of a business (operating lease) — form' },
    summary: {
      pt: 'O contrato que tenha por objecto a negociação do estabelecimento empresarial, incluindo a sua locação ou usufruto, é feito por escrito, e o contrato deve especificar o objecto da negociação e os elementos do estabelecimento que são locados.',
      en: 'A contract dealing with a business, including its lease or usufruct, must be in writing and specify the object and the elements of the business that are leased.',
    },
    law: 'codigoComercial',
    article: 'art. 46',
    sourceUrl: CCOM,
    lastVerified: V,
    confidence: 'verified',
    note: { pt: 'Lido no texto do Código Comercial publicado no Boletim da República (Decreto-Lei n.º 1/2022). Se o estabelecimento incluir imóvel em transmissão, aplica-se a forma exigida para imóveis.', en: 'Read in the Commercial Code text published in the Boletim da República (Decree-Law 1/2022). If real estate is transferred, the form required for real estate applies.' },
  },
  turCessaoExploracaoDeveres: {
    title: { pt: 'Deveres do locatário do estabelecimento', en: 'Duties of the lessee of a business' },
    summary: {
      pt: 'O locatário administra o estabelecimento preservando a unidade dos seus elementos, sem modificar o fim a que se destina, e zela pelos bens que o integram, com a responsabilidade de quem administra bens alheios, incluindo a sua guarda.',
      en: 'The lessee runs the business keeping its elements together, without changing its purpose, and looks after its assets with the responsibility of one managing another’s property, including their safekeeping.',
    },
    law: 'codigoComercial',
    article: 'art. 50',
    sourceUrl: CCOM,
    lastVerified: V,
    confidence: 'verified',
  },
  turCessaoExploracaoJustaCausa: {
    title: { pt: 'Justa causa para pôr fim à locação do estabelecimento', en: 'Just cause to end the lease of a business' },
    summary: {
      pt: 'São motivos de justa causa para rescindir a locação do estabelecimento, entre outros, o incumprimento das obrigações do contrato (em especial a falta de pagamento), a concorrência desleal e a prática de actos abusivos ou incompatíveis com as condições acordadas.',
      en: 'Just causes to terminate the lease of a business include breach of contract (especially non-payment), unfair competition and abusive acts incompatible with the agreed terms.',
    },
    law: 'codigoComercial',
    article: 'art. 52',
    sourceUrl: CCOM,
    lastVerified: V,
    confidence: 'verified',
  },
  turCessaoExploracaoRenovacao: {
    title: { pt: 'Renovação compulsória da locação do estabelecimento', en: 'Compulsory renewal of a business lease' },
    summary: {
      pt: 'O locatário pode ter direito a uma renovação compulsória, uma única vez, quando o contrato escrito tiver prazo longo e ele explore o mesmo ramo há vários anos seguidos. O direito não existe se o locatário incumprir ou se o locador precisar de fazer obras substanciais no local.',
      en: 'The lessee may be entitled to one compulsory renewal when a long written contract exists and the lessee has run the same business for several consecutive years. There is no such right if the lessee is in breach or the lessor needs substantial works on the premises.',
    },
    law: 'codigoComercial',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Art. 47 do Código Comercial (ponto empresarial): o texto lido indica contrato escrito não inferior a cinco anos e exploração no mesmo ramo por três anos ininterruptos; confirmar a redacção completa.', en: 'Commercial Code art. 47: the text read indicates a written contract of at least five years and three uninterrupted years in the same line; confirm the full wording.' },
  },

  // ------------------------------------------------------------------ Agriculture and fisheries
  turParceriaPecuaria: {
    title: { pt: 'Parceria pecuária', en: 'Livestock partnership' },
    summary: {
      pt: 'Pela parceria pecuária, uma ou mais pessoas entregam a outra animais para esta os criar, pensar e vigiar, com o ajuste de repartirem entre si os lucros futuros (crias, leite, valorização). O parceiro criador deve tratar os animais com o cuidado de um bom criador; o risco de perda dos animais por causa que não lhe seja imputável corre pelo proprietário. Na falta de acordo, seguem-se os usos da terra.',
      en: 'Under a livestock partnership, one party hands animals to another to raise, tend and watch over them, sharing future profits (offspring, milk, increased value). The keeper must care for them as a good stockman; loss not attributable to the keeper falls on the owner. Local custom fills gaps.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 1121.º a 1128.º do Código Civil; confirmar a redacção em vigor em Moçambique.', en: 'Civil Code arts. 1121–1128; confirm the text in force in Mozambique.' },
  },
  turDepositoGado: {
    title: { pt: 'Guarda remunerada de animais', en: 'Paid keeping of animals' },
    summary: {
      pt: 'Quem recebe animais para guardar mediante pagamento, sem participar nos lucros, é depositário: deve guardá-los e restituí-los com os seus frutos e responde pela perda ou dano que resultem de falta de cuidado.',
      en: 'Whoever keeps animals for a fee, without a share of profits, is a depositary: must keep and return them with their produce and is liable for loss or damage caused by lack of care.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Depósito: arts. 1185.º e seguintes do Código Civil; confirmar.', en: 'Deposit: Civil Code arts. 1185 ff; confirm.' },
  },
  turTransitoGado: {
    title: { pt: 'Circulação e marcação de gado', en: 'Movement and branding of livestock' },
    summary: {
      pt: 'A movimentação de gado entre distritos ou para abate exige guia de trânsito dos serviços de veterinária. Os animais devem estar marcados ou registados e cumprir as campanhas de vacinação obrigatórias.',
      en: 'Moving livestock between districts or for slaughter requires a veterinary movement permit. Animals must be branded or registered and follow compulsory vaccination campaigns.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Regulamento de sanidade animal e regras de trânsito de gado; confirmar o diploma em vigor.', en: 'Animal health regulation and livestock movement rules; confirm the regulation in force.' },
  },
  turParceriaAgricola: {
    title: { pt: 'Parceria agrícola e terra', en: 'Farming partnership and land' },
    summary: {
      pt: 'A terra é do Estado e o DUAT não pode ser vendido nem arrendado. Numa parceria agrícola, o titular do DUAT mantém a posse e participa na produção (com a terra e, se for o caso, insumos), o parceiro cultivador contribui com o trabalho, e a colheita é repartida. O acordo não transmite o DUAT nem dá ao cultivador direitos sobre a terra.',
      en: 'Land belongs to the State and a DUAT cannot be sold or leased. In a farming partnership the DUAT holder keeps possession and takes part in production (land and, where agreed, inputs), the cultivator contributes labour, and the harvest is shared. The agreement does not transfer the DUAT or give the cultivator rights over the land.',
    },
    law: 'leiTerras1997',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Construção a partir da Lei de Terras e do Código Civil; a ocupação de boa-fé por mais de dez anos pode gerar DUAT — limite o prazo e documente que a ocupação é por tolerância do titular.', en: 'Built on the Land Law and the Civil Code; good-faith occupation for over ten years can create a DUAT — limit the term and record that occupation is by the holder’s permission.' },
  },
  turPescaLicenca: {
    title: { pt: 'Licenças de pesca e comercialização de pescado', en: 'Fishing and fish-trading licences' },
    summary: {
      pt: 'A pesca, incluindo a artesanal, exige licença válida para a embarcação e a arte de pesca. É proibido comprar, transportar ou vender espécies e tamanhos proibidos ou pescado capturado durante os períodos de defeso. O pescado comercializado deve cumprir as regras sanitárias e ser transportado em condições de frio adequadas.',
      en: 'Fishing, including artisanal fishing, requires a valid licence for the vessel and gear. Buying, carrying or selling prohibited species or sizes, or fish caught in closed seasons, is forbidden. Fish traded must meet sanitary rules and be kept cold in transport.',
    },
    law: 'turRepmar89_2020',
    lastVerified: V,
    confidence: 'confirm',
  },

  // ------------------------------------------------------------------ Private security
  turSegurancaPrivadaLicenca: {
    title: { pt: 'Empresas de segurança privada', en: 'Private security companies' },
    summary: {
      pt: 'Só empresas licenciadas pelo Ministério do Interior podem prestar serviços de segurança privada. Os vigilantes devem estar registados e ter formação; o uso de armas exige autorização e licença de uso e porte. A segurança privada não substitui a polícia: não pode fazer detenções fora do flagrante delito nem revistas sem consentimento.',
      en: 'Only companies licensed by the Ministry of the Interior may provide private security. Guards must be registered and trained; firearms require authorisation and a carry licence. Private security does not replace the police: no arrests outside flagrante delicto and no searches without consent.',
    },
    law: 'turSegPrivada9_2007',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'O Decreto n.º 9/2007 foi parcialmente declarado inconstitucional (Acórdão n.º 5/CC/2008) e o regime está em revisão; confirme o diploma e a entidade licenciadora.', en: 'Decree 9/2007 was partly declared unconstitutional (Ruling 5/CC/2008) and the regime is under review; confirm the regulation and the licensing body.' },
  },
} satisfies Record<string, LegalEntryDef>;
