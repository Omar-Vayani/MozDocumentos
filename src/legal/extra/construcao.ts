// Legal values for the "construcao" documents: works records (autos), technical
// responsibility, real-estate mediation and condominiums. Keys must not clash
// with other files. Civil Code rules are those of the 1966 Code as applied in
// Mozambique; where the Mozambican text could not be read, the entry has
// `confidence: 'confirm'` and no article (the 1966 numbering is in the note).
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-13';
const POSTURA_MAPUTO =
  'https://cmmaputo.gov.mz/wp-content/uploads/2025/10/BR_136_III_SERIE_2018.pdf-_-POSTURA-MUNICIPAL-SOBRE-CONSTRUCOES-E-EDIFICACOES-1.pdf';
const CONDOMINIO = 'https://www.lexlink.eu/fileget.aspx?fileid=51919';
const CHAMBERS = 'https://practiceguides.chambers.com/practice-guides/construction-law-2026/mozambique';

export const LAWS_CONSTRUCAO = {
  licenciamentoObrasParticulares: {
    short: 'Decreto n.º 2/2004',
    cite: 'do Decreto n.º 2/2004, de 31 de Março',
    title: 'Decreto n.º 2/2004, de 31 de Março — Regime de Licenciamento de Obras Particulares',
    url: 'https://www.lexlink.eu/conteudo/mocambique/ia-serie/121469/decreto-no-22004/20525/por-tipo-de-documentolegal',
  },
  posturaMaputoConstrucoes2018: {
    short: 'Postura Municipal sobre Construções e Edificações (Maputo)',
    cite: 'da Postura Municipal sobre Construções e Edificações do Município de Maputo',
    title: 'Postura Municipal sobre Construções e Edificações do Município de Maputo (Boletim da República, III Série, n.º 136, de 12 de Julho de 2018)',
    url: POSTURA_MAPUTO,
  },
  dm77_2015: {
    short: 'Diploma Ministerial n.º 77/2015',
    cite: 'do Diploma Ministerial n.º 77/2015, de 22 de Maio',
    title: 'Diploma Ministerial n.º 77/2015, de 22 de Maio — requisitos de licenciamento de empreiteiros e consultores de construção civil por classe',
    url: 'https://www.lexlink.eu/FileGet.aspx?FileId=1149432',
  },
  leiOrdemEngenheiros: {
    short: 'Lei n.º 16/2002',
    cite: 'da Lei n.º 16/2002, de 26 de Junho',
    title: 'Lei n.º 16/2002, de 26 de Junho — cria a Ordem dos Engenheiros de Moçambique e aprova o seu Estatuto',
    url: 'https://ordeng.org.mz/porque-ser-membro/',
  },
  estatutoOrdemArquitectos: {
    short: 'Estatuto da Ordem dos Arquitectos de Moçambique',
    cite: 'do Estatuto da Ordem dos Arquitectos de Moçambique',
    title: 'Lei da Assembleia da República (2017) que cria a Ordem dos Arquitectos de Moçambique e aprova o respectivo Estatuto',
    url: 'https://verdade.co.mz/parlamento-mocambicano-aprova-criacao-da-ordem-dos-arquitectos-e-seu-estatuto/',
  },
  regulamentoCondominio2013: {
    short: 'Decreto n.º 17/2013',
    cite: 'do Decreto n.º 17/2013, de 26 de Abril',
    title: 'Decreto n.º 17/2013, de 26 de Abril — Regulamento do Regime Jurídico do Condomínio (revoga o Decreto n.º 53/99, de 8 de Setembro)',
    url: CONDOMINIO,
  },
  contratacaoPublica2022: {
    short: 'Decreto n.º 79/2022',
    cite: 'do Decreto n.º 79/2022, de 30 de Dezembro',
    title: 'Decreto n.º 79/2022, de 30 de Dezembro — Regulamento de Contratação de Empreitada de Obras Públicas, Fornecimento de Bens e Prestação de Serviços ao Estado',
    url: 'https://www.ufsa.gov.mz/query/Baixar_documento.php?nome=DECRETO+79%2F2022%2C+DE+30+DE+DEZEMBRO',
  },
  licenciamentoSimplificado2026: {
    short: 'Decreto n.º 41/2026',
    cite: 'do Decreto n.º 41/2026',
    title: 'Decreto n.º 41/2026 — Regulamento do Licenciamento Simplificado para o Exercício de Actividades Económicas (em vigor a 25 de Outubro de 2026; revoga o Decreto n.º 39/2017)',
    url: 'https://www.jlaadvogados.com/post/aprova%C3%A7%C3%A3o-do-regulamento-sobre-o-licenciamento-simplificado-para-o-exerc%C3%ADcio-de-actividades-econ%C3%B3mic',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_CONSTRUCAO = {
  // ------------------------------------------------------------------ Licensing of works
  obraLicencaPrevia: {
    title: { pt: 'Licença municipal de obra particular', en: 'Municipal permit for private works' },
    summary: {
      pt: 'As obras particulares de construção, reconstrução, ampliação, alteração e demolição precisam de licença prévia do município. Estão dispensadas, entre outras, as obras de conservação, restauro, reparação ou limpeza que não alterem a estrutura. Obras sem licença podem ser embargadas, multadas e demolidas.',
      en: 'Private construction, rebuilding, extension, alteration and demolition works need a prior municipal permit. Conservation, restoration, repair or cleaning works that do not change the structure are among those exempt. Unlicensed works may be stopped, fined and demolished.',
    },
    law: 'licenciamentoObrasParticulares',
    sourceUrl: 'https://portaldogoverno.gov.mz/index.php/por/Empresas/Licenciamentos/Actividades-Municipais/Dispensa-de-licenciamento-as-obras-particulares',
    lastVerified: V,
    confidence: 'verified',
  },
  obraTermoResponsabilidade: {
    title: { pt: 'Termo de responsabilidade do técnico', en: 'Technician’s statement of responsibility' },
    summary: {
      pt: 'Depois de aprovado o projecto e antes de emitida a licença de construção, é entregue ao município uma declaração, com assinatura reconhecida por notário, de técnico habilitado e inscrito no município que assume a responsabilidade pela obra. Os autores dos projectos e o director técnico da obra subscrevem termos de responsabilidade.',
      en: 'After the design is approved and before the building permit is issued, a statement by a qualified technician registered with the municipality, taking responsibility for the works, is filed with a notarised signature. Project authors and the site director sign statements of responsibility.',
    },
    law: 'posturaMaputoConstrucoes2018',
    sourceUrl: POSTURA_MAPUTO,
    lastVerified: V,
    confidence: 'verified',
    note: { pt: 'Regra do Município de Maputo. Outros municípios têm posturas e, por vezes, modelos próprios: confirme.', en: 'Maputo rule. Other municipalities have their own by-laws and sometimes their own forms: check.' },
  },
  obraLicencaUtilizacao: {
    title: { pt: 'Licença de utilização', en: 'Occupancy permit' },
    summary: {
      pt: 'Concluída a obra, o dono da obra pede ao município a licença de utilização, emitida após vistoria municipal e encerramento da caderneta da obra pela fiscalização. O auto de recepção entre as partes não substitui esta licença.',
      en: 'When the works are finished, the owner applies to the municipality for the occupancy permit, issued after a municipal inspection and the closing of the site book. The acceptance record between the parties does not replace it.',
    },
    law: 'posturaMaputoConstrucoes2018',
    sourceUrl: POSTURA_MAPUTO,
    lastVerified: V,
    confidence: 'verified',
  },
  obrasPublicasRegime: {
    title: { pt: 'Empreitadas de obras públicas', en: 'Public works contracts' },
    summary: {
      pt: 'Nas obras do Estado, a consignação, as medições, os pagamentos e a recepção provisória e definitiva seguem o regulamento de contratação pública e os modelos da entidade contratante.',
      en: 'In State works, site handover, measurements, payments and provisional and final acceptance follow the public procurement regulation and the contracting body’s own forms.',
    },
    law: 'contratacaoPublica2022',
    sourceUrl: 'https://www.mdradvogados.com/xms/files/2023/Novidades_na_contratacao_publica_-_Legal_Alert_MDR_-PT-.pdf',
    lastVerified: V,
    confidence: 'verified',
  },

  // ------------------------------------------------------------------ Professionals and licences
  inscricaoOrdemEngenheiros: {
    title: { pt: 'Inscrição na Ordem dos Engenheiros', en: 'Registration with the Engineers’ Order' },
    summary: {
      pt: 'Só pode exercer a engenharia em Moçambique quem estiver inscrito na Ordem dos Engenheiros de Moçambique como membro efectivo. O engenheiro só assina projectos e trabalhos de que seja autor ou colaborador.',
      en: 'Only engineers registered with the Mozambican Order of Engineers as full members may practise engineering. An engineer signs only projects and work of which they are author or collaborator.',
    },
    law: 'leiOrdemEngenheiros',
    sourceUrl: 'https://ordeng.org.mz/porque-ser-membro/',
    lastVerified: V,
    confidence: 'verified',
  },
  inscricaoOrdemArquitectos: {
    title: { pt: 'Inscrição na Ordem dos Arquitectos', en: 'Registration with the Architects’ Order' },
    summary: {
      pt: 'A Ordem dos Arquitectos de Moçambique foi criada por lei em 2017. A inscrição na Ordem é condição para exercer a profissão de arquitecto.',
      en: 'The Mozambican Order of Architects was created by law in 2017. Registration is required to practise as an architect.',
    },
    law: 'estatutoOrdemArquitectos',
    sourceUrl: 'https://www.folhademaputo.co.mz/pt/noticias/nacional/ar-aprova-criacao-da-ordem-dos-arquitectos/',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Número da lei por confirmar (indicado como Lei n.º 13/2017 num sumário do Boletim da República).', en: 'Law number to be confirmed (listed as Law 13/2017 in a gazette summary).' },
  },
  alvaraConsultor: {
    title: { pt: 'Alvará de consultor de construção civil', en: 'Construction consultant’s licence' },
    summary: {
      pt: 'A consultoria de construção civil (projecto, fiscalização e gestão de obras) é uma actividade licenciada: as empresas que a exercem precisam de alvará de consultor, da classe correspondente ao valor dos serviços.',
      en: 'Construction consultancy (design, supervision and project management) is a licensed activity: firms need a consultant’s licence of the class matching the value of the services.',
    },
    law: 'regulamentoEmpreiteiro2013',
    sourceUrl: 'https://www.mdradvogados.com/xms/files/v1/Publicacoes/2013/Regime_Juridico_Aplicavel_a_Actividade_de_Empreiteiro_e_de_Consultor_de_Construcao_Civil.pdf',
    lastVerified: V,
    confidence: 'verified',
  },
  quadroTecnicoEmpreiteiro: {
    title: { pt: 'Quadro técnico e director técnico do empreiteiro', en: 'Contractor’s technical staff and technical director' },
    summary: {
      pt: 'Os requisitos de cada classe de alvará incluem capital mínimo, quadro técnico permanente e director técnico.',
      en: 'The requirements of each licence class include minimum capital, permanent technical staff and a technical director.',
    },
    law: 'dm77_2015',
    lastVerified: V,
    confidence: 'confirm',
  },

  // ------------------------------------------------------------------ Works contracts (Civil Code)
  empreitadaAceitacao: {
    title: { pt: 'Verificação e aceitação da obra', en: 'Inspection and acceptance of the works' },
    summary: {
      pt: 'Antes de aceitar a obra, o dono deve verificá-la e comunicar o resultado ao empreiteiro; a falta de verificação ou de comunicação vale como aceitação. O empreiteiro não responde pelos defeitos que o dono conhecia quando aceitou a obra sem reserva, e os defeitos aparentes presumem-se conhecidos.',
      en: 'Before accepting the works the owner must inspect them and tell the contractor the result; failing to inspect or to report counts as acceptance. The contractor is not liable for defects the owner knew of when accepting without reservation, and apparent defects are presumed known.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 1218.º e 1219.º do Código Civil de 1966.', en: 'Corresponds to arts. 1218 and 1219 of the 1966 Civil Code.' },
  },
  empreitadaAlteracoes: {
    title: { pt: 'Alterações e trabalhos a mais', en: 'Changes and extra works' },
    summary: {
      pt: 'O empreiteiro não pode alterar a obra sem autorização do dono; sendo o contrato escrito, a autorização deve ser escrita e fixar o aumento do preço. Sem ela, o empreiteiro pode perder o direito ao pagamento das alterações.',
      en: 'The contractor may not change the works without the owner’s authorisation; where the contract is written, the authorisation must be written and fix the price increase. Without it the contractor may lose the right to be paid for the changes.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 1214.º a 1216.º do Código Civil de 1966.', en: 'Corresponds to arts. 1214–1216 of the 1966 Civil Code.' },
  },
  subempreitadaRegime: {
    title: { pt: 'Subempreitada', en: 'Subcontracting' },
    summary: {
      pt: 'Subempreitada é o contrato pelo qual um terceiro se obriga para com o empreiteiro a realizar a obra, ou parte dela. O empreiteiro só conserva o direito de regresso contra o subempreiteiro pelos defeitos se lhe comunicar a denúncia do dono da obra nos 30 dias seguintes à sua recepção.',
      en: 'A subcontract is an agreement by which a third party undertakes towards the contractor to carry out all or part of the works. The contractor keeps its recourse for defects only if it passes the owner’s defect notice to the subcontractor within 30 days of receiving it.',
    },
    law: 'codigoCivil',
    value: { regressoDias: 30 },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 1213.º e 1226.º do Código Civil de 1966.', en: 'Corresponds to arts. 1213 and 1226 of the 1966 Civil Code.' },
  },
  subcontratacaoAutorizacao: {
    title: { pt: 'Autorização para subcontratar', en: 'Consent to subcontract' },
    summary: {
      pt: 'Na prática moçambicana, os subempreiteiros são contratados com autorização do dono da obra, que o contrato principal normalmente exige.',
      en: 'In Mozambican practice subcontractors are engaged with the owner’s authorisation, which the main contract usually requires.',
    },
    law: 'regulamentoEmpreiteiro2013',
    sourceUrl: CHAMBERS,
    lastVerified: V,
    confidence: 'confirm',
  },

  // ------------------------------------------------------------------ Condominium
  propriedadeHorizontalRegime: {
    title: { pt: 'Propriedade horizontal', en: 'Condominium ownership' },
    summary: {
      pt: 'Num prédio em propriedade horizontal, cada condómino é dono da sua fracção e comproprietário das partes comuns. As despesas comuns são pagas na proporção do valor (permilagem) de cada fracção, salvo disposição em contrário. As partes comuns são administradas pela assembleia dos condóminos e por um administrador.',
      en: 'In a building under condominium ownership, each owner owns their unit and shares the common parts. Common expenses are paid in proportion to each unit’s value (per mille share) unless otherwise agreed. The common parts are run by the owners’ meeting and an administrator.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 1414.º a 1438.º do Código Civil de 1966 (1424.º e 1430.º).', en: 'Corresponds to arts. 1414–1438 of the 1966 Civil Code (1424 and 1430).' },
  },
  condominioRegulamento: {
    title: { pt: 'Regulamento do Regime Jurídico do Condomínio', en: 'Condominium Regulation' },
    summary: {
      pt: 'O regulamento é obrigatório para todos os proprietários e inquilinos de fracções autónomas, pessoas singulares e colectivas, públicas e privadas. Define a assembleia de condóminos, o administrador eleito pela assembleia e a comissão de moradores, e encarrega as autarquias de zelar pelo seu cumprimento e manter um cadastro de condomínios.',
      en: 'The regulation binds all owners and tenants of units, individuals and companies, public and private. It defines the owners’ meeting, the administrator elected by it and the residents’ committee, and makes municipalities responsible for enforcing it and keeping a register of condominiums.',
    },
    law: 'regulamentoCondominio2013',
    sourceUrl: 'https://www.mdradvogados.com/xms/files/v1/Publicacoes/2013/2013_10_Regulamento_do_Regime_Juridico_do_condominio.PDF',
    lastVerified: V,
    confidence: 'verified',
  },
  condominioQuotas: {
    title: { pt: 'Quotas do condomínio', en: 'Condominium fees' },
    summary: {
      pt: 'O acesso às partes comuns está condicionado ao pagamento das quotas pelos condóminos. O contrato de arrendamento deve indicar quem é responsável pelo pagamento das quotas.',
      en: 'Access to the common parts depends on payment of the fees. A lease must state who pays the condominium fees.',
    },
    law: 'regulamentoCondominio2013',
    sourceUrl: 'https://www.mdradvogados.com/xms/files/v1/Publicacoes/2013/2013_10_Regulamento_do_Regime_Juridico_do_condominio.PDF',
    lastVerified: V,
    confidence: 'verified',
  },
  condominioFundoReserva: {
    title: { pt: 'Fundo comum de reserva', en: 'Common reserve fund' },
    summary: {
      pt: 'Cada condomínio tem obrigatoriamente um fundo comum de reserva para as despesas de conservação, com uma contribuição anual mínima de 10% do orçamento das despesas de utilização e serviços, repartida pelos condóminos na proporção da sua quota. Os valores são depositados em banco e não podem ser usados em despesas correntes.',
      en: 'Every condominium must keep a common reserve fund for maintenance, with a minimum yearly contribution of 10% of the budget for running and service expenses, shared in proportion to each unit. The money is kept in a bank and may not pay current expenses.',
    },
    law: 'regulamentoCondominio2013',
    value: { minimo: 0.1 },
    sourceUrl: CONDOMINIO,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Lido num excerto do Regulamento (art. 23). Confirme o artigo e a percentagem no texto oficial.', en: 'Read in an extract of the Regulation (art. 23). Confirm the article and the rate in the official text.' },
  },
  condominioObrasComuns: {
    title: { pt: 'Obras nas partes comuns', en: 'Works on common parts' },
    summary: {
      pt: 'As obras nas partes comuns são aprovadas pela assembleia de condóminos e, em regra, pagas pelo fundo comum de reserva. Depois da aprovação, o administrador comunica aos condóminos ausentes, por carta registada, a natureza das obras e os orçamentos. As obras urgentes abaixo do limite fixado pela assembleia podem ser ordenadas pelo administrador.',
      en: 'Works on common parts are approved by the owners’ meeting and as a rule paid from the reserve fund. After approval the administrator informs absent owners by registered letter of the works and quotes. Urgent works below the limit set by the meeting may be ordered by the administrator.',
    },
    law: 'regulamentoCondominio2013',
    sourceUrl: CONDOMINIO,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Lido num excerto do Regulamento (art. 21). Confirme o artigo.', en: 'Read in an extract of the Regulation (art. 21). Confirm the article.' },
  },
  condominioConvocatoria: {
    title: { pt: 'Convocação da assembleia de condóminos', en: 'Notice of the owners’ meeting' },
    summary: {
      pt: 'A assembleia é convocada por carta registada enviada com 10 dias de antecedência, indicando o dia, a hora, o local e a ordem de trabalhos.',
      en: 'The meeting is called by registered letter sent 10 days in advance, stating the day, time, place and agenda.',
    },
    law: 'codigoCivil',
    value: { antecedenciaDias: 10 },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde ao art. 1432.º do Código Civil de 1966. Confirme se o Regulamento do Condomínio fixa outra regra.', en: 'Corresponds to art. 1432 of the 1966 Civil Code. Check whether the Condominium Regulation sets another rule.' },
  },
  condominioAssembleia: {
    title: { pt: 'Assembleia de condóminos', en: 'Owners’ meeting' },
    summary: {
      pt: 'A assembleia ordinária reúne na primeira quinzena de Janeiro para aprovar as contas do ano anterior e o orçamento do ano. Há reuniões extraordinárias quando convocadas pelo administrador ou por condóminos que representem 25% do capital. As deliberações são tomadas por maioria dos votos representativos do capital; se faltar quórum, há nova reunião uma semana depois, que delibera por maioria dos presentes desde que representem um quarto do valor do prédio.',
      en: 'The ordinary meeting is held in the first half of January to approve last year’s accounts and the year’s budget. Extraordinary meetings are called by the administrator or by owners holding 25% of the capital. Decisions are by majority of the votes representing the capital; without a quorum, a new meeting a week later decides by majority of those present if they hold a quarter of the building’s value.',
    },
    law: 'codigoCivil',
    value: { extraordinariaCapital: 0.25, segundaReuniaoDias: 7, segundaReuniaoQuorum: 0.25 },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 1431.º e 1432.º do Código Civil de 1966.', en: 'Corresponds to arts. 1431 and 1432 of the 1966 Civil Code.' },
  },
  condominioAdministrador: {
    title: { pt: 'Administrador do condomínio', en: 'Condominium administrator' },
    summary: {
      pt: 'O administrador é eleito e exonerado pela assembleia. Compete-lhe convocar a assembleia, elaborar o orçamento, cobrar as receitas e pagar as despesas comuns, exigir a cada condómino a sua quota-parte, conservar as partes comuns, executar as deliberações e prestar contas.',
      en: 'The administrator is elected and removed by the meeting. Their duties are to call the meeting, prepare the budget, collect income and pay common expenses, demand each owner’s share, maintain the common parts, carry out decisions and render accounts.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 1435.º e 1436.º do Código Civil de 1966 e ao Regulamento do Condomínio.', en: 'Corresponds to arts. 1435 and 1436 of the 1966 Civil Code and the Condominium Regulation.' },
  },

  // ------------------------------------------------------------------ Real-estate mediation
  mediacaoImobiliariaRegime: {
    title: { pt: 'Contrato de mediação imobiliária', en: 'Estate agency agreement' },
    summary: {
      pt: 'Não foi identificada lei moçambicana específica sobre mediação imobiliária. O contrato rege-se pelas regras gerais dos contratos e da prestação de serviços: a exclusividade, a comissão, o momento em que é devida e a duração valem nos termos escritos no contrato.',
      en: 'No specific Mozambican law on estate agency was found. The agreement follows the general rules on contracts and services: exclusivity, commission, when it is due and duration apply as written in the contract.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Contrato atípico (arts. 405.º e 1154.º do Código Civil de 1966). Confirme se existe regulamentação sectorial.', en: 'Atypical contract (arts. 405 and 1154 of the 1966 Civil Code). Check whether sector rules exist.' },
  },
  mediacaoBranqueamento: {
    title: { pt: 'Prevenção do branqueamento de capitais no imobiliário', en: 'Anti-money-laundering in real estate' },
    summary: {
      pt: 'As transacções imobiliárias estão abrangidas pelas regras de prevenção do branqueamento de capitais: identificação dos clientes, conservação dos documentos e comunicação de operações suspeitas. O GIFiM emitiu directrizes próprias para o sector imobiliário.',
      en: 'Real-estate transactions are covered by anti-money-laundering rules: identifying clients, keeping records and reporting suspicious transactions. The financial intelligence unit (GIFiM) issued guidelines for the real-estate sector.',
    },
    law: 'leiBranqueamento2023',
    sourceUrl: 'https://www.mlgts.pt/xms/files/site_2018/Newsletters/2022/Legal_Alert_MDR_Directrizes_e_orientacoes_para_a_prevencao_e_combate_ao_branqueamento_de_capitais_e_financiamento_ao_terrorismo_no_sector_imobiliario.pdf',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirme se a lei inclui expressamente os mediadores imobiliários entre as entidades obrigadas.', en: 'Check whether the law expressly lists estate agents among obliged entities.' },
  },
  licencaActividadeEconomica: {
    title: { pt: 'Licença de actividade económica', en: 'Business activity licence' },
    summary: {
      pt: 'O exercício de actividades comerciais e de prestação de serviços exige licença. O novo regime de licenciamento simplificado entra em vigor a 25 de Outubro de 2026 e revoga o regime de 2017.',
      en: 'Commercial and service activities need a licence. The new simplified licensing regime enters into force on 25 October 2026, replacing the 2017 regime.',
    },
    law: 'licenciamentoSimplificado2026',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirme no Anexo II se a mediação imobiliária está abrangida pelo licenciamento simplificado.', en: 'Check in Annex II whether estate agency is covered by simplified licensing.' },
  },
} satisfies Record<string, LegalEntryDef>;
