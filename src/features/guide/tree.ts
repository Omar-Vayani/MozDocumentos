// The guided assistant: one question per screen. Every branch reaches a
// recommended document in at most four answers.

import type { L10n } from '@/documents/model';

export type GuideResult = {
  doc: string;
  why: L10n;
  also?: string[];
  process?: string;
};

export type GuideOption = {
  id: string;
  label: L10n;
  hint?: L10n;
  next?: string;
  result?: GuideResult;
};

export type GuideNode = { id: string; question: L10n; hint?: L10n; options: GuideOption[] };

const l = (pt: string, en: string): L10n => ({ pt, en });

export const GUIDE: Record<string, GuideNode> = {
  inicio: {
    id: 'inicio',
    question: l('Para quem é o documento?', 'Who is the document for?'),
    options: [
      { id: 'empresa', label: l('A minha empresa', 'My business'), hint: l('Trabalhadores, clientes, assuntos da empresa.', 'Employees, clients, company matters.'), next: 'empresa' },
      { id: 'pessoa', label: l('Para mim', 'For me'), hint: l('Assuntos pessoais, ou sou trabalhador.', 'Personal matters, or I am an employee.'), next: 'pessoa' },
      { id: 'advogado', label: l('Sou advogado', "I'm a lawyer"), hint: l('Peças processuais, procurações, honorários, pareceres.', 'Court filings, powers of attorney, fees, opinions.'), next: 'advogado' },
      { id: 'estado', label: l('Uma entidade pública', 'A public body'), hint: l('Ofícios, informações, despachos, circulares, guias de marcha.', 'Official letters, briefings, orders, circulars, travel orders.'), next: 'estado' },
      { id: 'saude', label: l('Saúde', 'Health'), hint: l('Médicos, clínicas, laboratórios.', 'Doctors, clinics, laboratories.'), next: 'saude' },
      { id: 'comunidade', label: l('Autoridade comunitária', 'Community authority'), hint: l('Secretário do bairro, chefe de quarteirão, régulo.', 'Neighbourhood secretary, block chief, traditional leader.'), next: 'comunidade' },
      { id: 'educacao', label: l('Escola ou centro de formação', 'School or training centre'), hint: l('Declarações, certificados, propinas, pais e encarregados.', 'Certificates, fees, parents and guardians.'), next: 'educacao' },
      { id: 'associacoes', label: l('Associação, igreja ou ONG', 'Association, church or NGO'), hint: l('Estatutos, membros, quotas, xitique, certificados.', 'Statutes, members, dues, savings groups, certificates.'), next: 'associacoes' },
      { id: 'construcao', label: l('Obras e imobiliário', 'Construction and property'), hint: l('Orçamentos de obra, autos, mediação, condomínio.', 'Building quotes, site records, agency, condominium.'), next: 'construcao' },
    ],
  },

  // ---------------------------------------------------------------- Educação
  educacao: {
    id: 'educacao',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'alunos', label: l('Documentos para um aluno', 'Documents for a student'), next: 'educacao-alunos' },
      { id: 'pais', label: l('Comunicar com os pais', 'Communicate with parents'), next: 'educacao-pais' },
      { id: 'contratos', label: l('Matrícula, propinas e contratos', 'Enrolment, fees and contracts'), next: 'educacao-contratos' },
    ],
  },
  'educacao-alunos': {
    id: 'educacao-alunos',
    question: l('Que documento?', 'Which document?'),
    options: [
      { id: 'frequencia', label: l('Confirmar que frequenta a escola', 'Confirm enrolment'), result: { doc: 'declaracao-de-frequencia', why: l('Classe, turma e ano lectivo, para bolsas, abonos ou viagens.', 'Grade, class and school year, for grants or travel.') } },
      { id: 'aproveitamento', label: l('Notas e aproveitamento', 'Grades and results'), result: { doc: 'declaracao-de-aproveitamento', why: l('Disciplinas, classificações e resultado final.', 'Subjects, marks and final result.') } },
      { id: 'certificado', label: l('Certificado de um curso', 'Course certificate'), result: { doc: 'certificado-de-formacao', why: l('Certificado em A4 horizontal, um por formando.', 'A4 landscape certificate, one per trainee.') } },
      { id: 'transferencia', label: l('Transferir de escola', 'Transfer school'), result: { doc: 'pedido-de-transferencia-escolar', why: l('Pedido do encarregado à direcção da escola.', "The guardian's request to the school.") } },
      { id: 'recomendacao', label: l('Recomendar um aluno', 'Recommend a student'), result: { doc: 'carta-recomendacao-academica', why: l('Para bolsas, universidades ou estágios, em português e inglês.', 'For scholarships, universities or internships, in Portuguese and English.'), also: ['declaracao-de-estagio'] } },
    ],
  },
  'educacao-pais': {
    id: 'educacao-pais',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'comunicado', label: l('Informar os encarregados', 'Inform guardians'), result: { doc: 'comunicado-encarregados', why: l('Comunicado com destacável de tomada de conhecimento.', 'A notice with a tear-off acknowledgement slip.') } },
      { id: 'reuniao', label: l('Convocar uma reunião de pais', 'Call a parents\' meeting'), result: { doc: 'convocatoria-reuniao-pais', why: l('Data, hora, local e ordem de trabalhos.', 'Date, time, place and agenda.') } },
      { id: 'visita', label: l('Autorizar uma visita de estudo', 'Authorise a school trip'), result: { doc: 'autorizacao-visita-de-estudo', why: l('Autorização do encarregado com destacável.', "The guardian's consent with a tear-off slip.") } },
      { id: 'falta', label: l('Justificar a falta de um aluno', "Justify a student's absence"), result: { doc: 'justificacao-falta-aluno', why: l('Justificação do encarregado em A5.', "The guardian's note on A5.") } },
    ],
  },
  'educacao-contratos': {
    id: 'educacao-contratos',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'inscricao', label: l('Ficha de inscrição', 'Enrolment form'), result: { doc: 'ficha-de-inscricao', why: l('Dados do aluno e do encarregado, preenchida ou em branco.', 'Student and guardian details, filled or blank.') } },
      { id: 'contrato', label: l('Contrato com o encarregado', 'Contract with the guardian'), result: { doc: 'contrato-servicos-educativos', why: l('Serviços, propinas, pagamento e rescisão.', 'Services, fees, payment and termination.'), also: ['tabela-de-propinas'] } },
      { id: 'atraso', label: l('Propinas em atraso', 'Overdue fees'), result: { doc: 'aviso-propinas-em-atraso', why: l('Aviso ao encarregado, sem prejudicar o aluno.', 'A notice to the guardian that never penalises the child.') } },
      { id: 'bolsa', label: l('Atribuir uma bolsa de estudo', 'Award a scholarship'), result: { doc: 'termo-bolsa-de-estudo', why: l('Condições, obrigações do bolseiro e reembolso.', "Terms, the holder's duties and repayment.") } },
      { id: 'conducao', label: l('Escola de condução', 'Driving school'), result: { doc: 'contrato-escola-de-conducao', why: l('Aulas, exames, preço e desistência.', 'Lessons, tests, price and withdrawal.') } },
    ],
  },

  // ---------------------------------------------------------------- Associações
  associacoes: {
    id: 'associacoes',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'constituir', label: l('Constituir ou organizar a associação', 'Set up or organise the association'), next: 'associacoes-constituir' },
      { id: 'membros', label: l('Membros e quotas', 'Members and dues'), next: 'associacoes-membros' },
      { id: 'poupanca', label: l('Grupo de poupança (xitique)', 'Savings group (xitique)'), next: 'associacoes-poupanca' },
      { id: 'igreja', label: l('Baptismo ou casamento religioso', 'Baptism or religious wedding'), next: 'associacoes-igreja' },
    ],
  },
  'associacoes-constituir': {
    id: 'associacoes-constituir',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'estatutos', label: l('Estatutos', 'Statutes'), result: { doc: 'estatutos-associacao', why: l('Fins, membros, órgãos sociais e património.', 'Purpose, members, governing bodies and assets.'), also: ['acta-constituicao-associacao'] } },
      { id: 'reconhecimento', label: l('Pedir o reconhecimento', 'Apply for recognition'), result: { doc: 'requerimento-reconhecimento-associacao', why: l('Requerimento à entidade competente para reconhecer a associação.', 'The application for legal recognition.') } },
      { id: 'regulamento', label: l('Regulamento interno', 'Internal rules'), result: { doc: 'regulamento-interno-associacao', why: l('Regras de funcionamento que completam os estatutos.', 'Operating rules that complete the statutes.') } },
      { id: 'contas', label: l('Relatório de actividades e contas', 'Activity report and accounts'), result: { doc: 'relatorio-actividades-contas', why: l('Para a assembleia geral, com o parecer do Conselho Fiscal.', 'For the general meeting, with the audit board opinion.') } },
      { id: 'voluntario', label: l('Acordo com um voluntário', 'Agreement with a volunteer'), result: { doc: 'acordo-de-voluntariado', why: l('Funções, horário, seguro e despesas.', 'Duties, schedule, insurance and expenses.') } },
    ],
  },
  'associacoes-membros': {
    id: 'associacoes-membros',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'inscricao', label: l('Inscrever um membro', 'Register a member'), result: { doc: 'ficha-de-inscricao-membro', why: l('Ficha de inscrição, também em branco.', 'Membership form, also blank.') } },
      { id: 'cartao', label: l('Cartões de membro', 'Membership cards'), result: { doc: 'cartao-de-membro', why: l('Dez cartões por folha A4.', 'Ten cards per A4 sheet.') } },
      { id: 'quota', label: l('Recibo de quota', 'Dues receipt'), result: { doc: 'recibo-de-quota', why: l('Original e duplicado em A5.', 'Original and duplicate on A5.') } },
      { id: 'declaracao', label: l('Confirmar que é membro', 'Confirm membership'), result: { doc: 'declaracao-de-membro', why: l('Declaração de membro, em português e inglês.', 'A membership letter, in Portuguese and English.'), also: ['carta-transferencia-membro'] } },
      { id: 'presencas', label: l('Lista de presenças', 'Attendance list'), result: { doc: 'lista-de-presencas', why: l('Para reuniões e assembleias.', 'For meetings and assemblies.') } },
    ],
  },
  'associacoes-poupanca': {
    id: 'associacoes-poupanca',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'regulamento', label: l('Regras do grupo', 'Group rules'), result: { doc: 'regulamento-grupo-poupanca', why: l('Rotativo ou de poupança e crédito, com a ordem de recebimento.', 'Rotating or savings-and-loan, with the payout order.') } },
      { id: 'mapa', label: l('Registar as contribuições', 'Record contributions'), result: { doc: 'mapa-contribuicoes-poupanca', why: l('Mapa mensal das contribuições de cada membro.', "A monthly sheet of each member's contributions.") } },
    ],
  },
  'associacoes-igreja': {
    id: 'associacoes-igreja',
    question: l('Que certificado?', 'Which certificate?'),
    options: [
      { id: 'baptismo', label: l('Baptismo', 'Baptism'), result: { doc: 'certificado-de-baptismo', why: l('Certificado religioso; não substitui o registo civil.', 'A religious certificate; not a civil record.') } },
      { id: 'casamento', label: l('Casamento religioso', 'Religious wedding'), result: { doc: 'certificado-casamento-religioso', why: l('Certificado religioso; o casamento prova-se pela certidão do Registo Civil.', 'A religious certificate; the civil record is the proof of marriage.') } },
    ],
  },

  // ---------------------------------------------------------------- Construção
  construcao: {
    id: 'construcao',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'obra', label: l('Uma obra', 'A building job'), next: 'construcao-obra' },
      { id: 'imobiliario', label: l('Mediação imobiliária', 'Estate agency'), next: 'construcao-imobiliario' },
      { id: 'condominio', label: l('Condomínio', 'Condominium'), next: 'construcao-condominio' },
    ],
  },
  'construcao-obra': {
    id: 'construcao-obra',
    question: l('Em que fase?', 'At which stage?'),
    options: [
      { id: 'orcamento', label: l('Orçamentar a obra', 'Quote the job'), result: { doc: 'orcamento-de-obra', why: l('Capítulos, quantidades, preços unitários e IVA.', 'Chapters, quantities, unit prices and VAT.'), also: ['proposta-de-honorarios-projecto'] } },
      { id: 'inicio', label: l('Entregar o terreno e começar', 'Hand over the site and start'), result: { doc: 'auto-de-consignacao-obra', why: l('Regista a entrega do local e o início do prazo.', 'Records the site handover and the start of the period.'), also: ['termo-de-responsabilidade-tecnica'] } },
      { id: 'medicao', label: l('Medir os trabalhos feitos', 'Measure the work done'), result: { doc: 'auto-de-medicao', why: l('Quantidades executadas e valor a facturar.', 'Quantities done and the amount to invoice.'), also: ['ordem-de-trabalhos-a-mais'] } },
      { id: 'subempreitada', label: l('Subcontratar parte da obra', 'Subcontract part of the job'), result: { doc: 'contrato-de-subempreitada', why: l('Trabalhos, preço, prazos e responsabilidade.', 'Work, price, deadlines and liability.') } },
      { id: 'recepcao', label: l('Receber a obra', 'Accept the work'), result: { doc: 'auto-de-recepcao-obra', why: l('Recepção provisória ou definitiva, com os defeitos a corrigir.', 'Provisional or final acceptance, with defects to fix.'), also: ['relatorio-de-vistoria'] } },
    ],
  },
  'construcao-imobiliario': {
    id: 'construcao-imobiliario',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'mediacao', label: l('Contrato com o proprietário', 'Contract with the owner'), result: { doc: 'contrato-de-mediacao-imobiliaria', why: l('Imóvel, preço, exclusividade e comissão.', 'Property, price, exclusivity and commission.') } },
      { id: 'visita', label: l('Registar uma visita', 'Record a viewing'), result: { doc: 'ficha-de-visita-imovel', why: l('Quem visitou, quando e com que interesse.', 'Who viewed, when and how interested.') } },
    ],
  },
  'construcao-condominio': {
    id: 'construcao-condominio',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'regulamento', label: l('Regulamento do condomínio', 'Condominium rules'), result: { doc: 'regulamento-de-condominio', why: l('Partes comuns, despesas, administração e assembleia.', 'Common parts, expenses, administration and meetings.') } },
      { id: 'convocar', label: l('Convocar a assembleia', 'Call the meeting'), result: { doc: 'convocatoria-assembleia-condominos', why: l('Com o destacável de procuração.', 'With the tear-off proxy slip.'), also: ['acta-assembleia-condominos'] } },
      { id: 'quotas', label: l('Cobrar quotas', 'Collect dues'), result: { doc: 'aviso-de-quotas-condominio', why: l('Aviso mensal ou interpelação por atraso.', 'A monthly notice or a demand for arrears.') } },
    ],
  },

  // ---------------------------------------------------------------- Advogado
  advogado: {
    id: 'advogado',
    question: l('Para que fase do assunto?', 'For which stage of the matter?'),
    options: [
      { id: 'tribunal', label: l('Peças para o tribunal', 'Court filings'), next: 'advogado-tribunal' },
      { id: 'cliente', label: l('Relação com o cliente', 'Client relationship'), hint: l('Procuração, honorários, parecer.', 'Power of attorney, fees, opinion.'), next: 'advogado-cliente' },
      { id: 'extrajudicial', label: l('Antes ou fora do tribunal', 'Before or outside court'), hint: l('Interpelação, acordo, queixa.', 'Demand letter, settlement, complaint.'), next: 'advogado-extrajudicial' },
      { id: 'penal', label: l('Processo penal', 'Criminal proceedings'), hint: l('Participação, assistente, habeas corpus, recurso.', 'Report, assistant, habeas corpus, appeal.'), next: 'advogado-penal' },
      { id: 'execucao', label: l('Execuções, providências e recursos', 'Enforcement, injunctions and appeals'), next: 'advogado-execucao' },
      { id: 'familia', label: l('Família e sucessões em tribunal', 'Family and succession in court'), next: 'advogado-familia' },
      { id: 'laboral', label: l('Trabalho, administrativo e fiscal', 'Labour, administrative and tax'), next: 'advogado-laboral' },
    ],
  },
  'advogado-tribunal': {
    id: 'advogado-tribunal',
    question: l('Que peça precisa?', 'Which filing do you need?'),
    options: [
      { id: 'peticao', label: l('Iniciar uma acção (petição inicial)', 'Start a claim (statement of claim)'), result: { doc: 'peticao-inicial', why: l('Articulado com os factos, o direito, o pedido e o valor da acção.', 'Sets out the facts, the law, the request and the value of the claim.'), also: ['procuracao-forense'] } },
      { id: 'contestacao', label: l('Defender o réu (contestação)', 'Defend the claim (defence)'), result: { doc: 'contestacao', why: l('Resposta à petição: excepções, impugnação e, se for o caso, reconvenção.', 'Reply to the claim: objections, denial and any counterclaim.') } },
      { id: 'requerimento', label: l('Requerer algo num processo pendente', 'Apply in a pending case'), result: { doc: 'requerimento-ao-tribunal', why: l('Junção de documentos, prorrogação de prazo, consulta, certidão, homologação.', 'Filing documents, extension, inspection, certificate, approval of a settlement.') } },
      { id: 'substabelecimento', label: l('Passar poderes a outro advogado', 'Delegate to another lawyer'), result: { doc: 'substabelecimento', why: l('Transfere, com ou sem reserva, os poderes da procuração forense.', 'Transfers the court mandate, with or without reservation.') } },
    ],
  },
  'advogado-cliente': {
    id: 'advogado-cliente',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'procuracao', label: l('Procuração forense', 'Court power of attorney'), result: { doc: 'procuracao-forense', why: l('O cliente confere os poderes forenses gerais e, se for o caso, especiais.', 'The client grants general and any special court powers.') } },
      { id: 'contrato', label: l('Acordar os honorários', 'Agree the fees'), result: { doc: 'contrato-de-honorarios', why: l('Define o objecto do mandato, os honorários, a provisão e as despesas.', 'Sets the scope, fees, retainer and expenses.') } },
      { id: 'nota', label: l('Cobrar honorários e despesas', 'Bill fees and expenses'), result: { doc: 'nota-de-honorarios', why: l('Discrimina serviços, despesas, provisões e saldo a pagar.', 'Itemises services, expenses, retainers and balance due.') } },
      { id: 'parecer', label: l('Dar um parecer jurídico', 'Give a legal opinion'), result: { doc: 'parecer-juridico', why: l('Consulta, factos, análise e conclusões numeradas.', 'Question, facts, analysis and numbered conclusions.') } },
    ],
  },
  'advogado-extrajudicial': {
    id: 'advogado-extrajudicial',
    question: l('Qual é a situação?', 'What is the situation?'),
    options: [
      { id: 'interpelacao', label: l('Exigir o cumprimento ao devedor', 'Demand payment or performance'), result: { doc: 'interpelacao-extrajudicial', why: l('Constitui o devedor em mora e dá um prazo antes da acção judicial.', 'Puts the debtor in default and gives a deadline before suing.') } },
      { id: 'transaccao', label: l('Fechar um acordo entre as partes', 'Settle between the parties'), result: { doc: 'acordo-de-transaccao', why: l('Concessões recíprocas que põem fim ao litígio, com ou sem processo pendente.', 'Mutual concessions ending the dispute, with or without a pending case.') } },
      { id: 'queixa', label: l('Apresentar uma queixa-crime', 'File a criminal complaint'), result: { doc: 'queixa-crime', why: l('Participação dos factos ao Ministério Público, dentro do prazo do direito de queixa.', 'Reports the facts to the Public Prosecutor within the complaint deadline.') } },
    ],
  },

  // ---------------------------------------------------------------- Estado
  estado: {
    id: 'estado',
    question: l('Que tipo de documento?', 'What kind of document?'),
    hint: l('Use um perfil de entidade pública para o cabeçalho da República.', 'Use a public body profile for the República header.'),
    options: [
      { id: 'correspondencia', label: l('Correspondência e decisões', 'Correspondence and decisions'), next: 'estado-correspondencia' },
      { id: 'reunioes', label: l('Reuniões e avisos públicos', 'Meetings and public notices'), next: 'estado-reunioes' },
      { id: 'pessoal', label: l('Pessoal e serviço', 'Staff and service'), next: 'estado-pessoal' },
      { id: 'contratacao', label: l('Contratação pública', 'Public procurement'), hint: l('Convites, concursos, júri, adjudicação, contratos.', 'Invitations, tenders, panel, award, contracts.'), next: 'estado-contratacao' },
    ],
  },
  'estado-correspondencia': {
    id: 'estado-correspondencia',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'oficio', label: l('Escrever a outra entidade (ofício)', 'Write to another body (ofício)'), result: { doc: 'oficio', why: l('Correspondência oficial externa, numerada e com classificação.', 'Numbered external official correspondence.') } },
      { id: 'nota', label: l('Comunicar dentro da instituição', 'Communicate internally'), result: { doc: 'nota-interna', why: l('Nota interna ou memorando entre serviços.', 'Internal note or memorandum between departments.') } },
      { id: 'informacao', label: l('Propor uma decisão ao superior', 'Propose a decision to a superior'), result: { doc: 'informacao-proposta', why: l('Informação com espaço para o despacho e os pareceres.', 'Briefing with space for the decision and opinions.'), also: ['despacho'] } },
      { id: 'despacho', label: l('Decidir (despacho)', 'Decide (despacho)'), result: { doc: 'despacho', why: l('Decisão do dirigente, com fundamento e determinação.', 'A decision by the head of the body, with grounds.') } },
      { id: 'circular', label: l('Instruções para vários serviços', 'Instructions to several units'), result: { doc: 'circular', why: l('Circular com orientações gerais.', 'A circular with general instructions.'), also: ['ordem-de-servico'] } },
    ],
  },
  'estado-reunioes': {
    id: 'estado-reunioes',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'convocar', label: l('Convocar uma reunião', 'Call a meeting'), result: { doc: 'convocatoria-reuniao-servico', why: l('Data, local e ordem de trabalhos.', 'Date, place and agenda.'), also: ['acta-reuniao-servico'] } },
      { id: 'acta', label: l('Registar uma reunião', 'Record a meeting'), result: { doc: 'acta-reuniao-servico', why: l('Presenças, deliberações e responsáveis.', 'Attendance, decisions and owners.') } },
      { id: 'edital', label: l('Afixar um edital ou aviso', 'Post a public notice'), result: { doc: 'edital-aviso', why: l('Torna público um acto ou convoca interessados.', 'Makes an act public or calls interested parties.') } },
      { id: 'imprensa', label: l('Informar a imprensa', 'Inform the press'), result: { doc: 'comunicado-de-imprensa', why: l('Comunicado oficial para os órgãos de comunicação social.', 'Official statement for the media.') } },
    ],
  },
  'estado-pessoal': {
    id: 'estado-pessoal',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'missao', label: l('Deslocação em serviço', 'Official trip'), result: { doc: 'guia-de-marcha', why: l('Guia de marcha com os vistos nos locais de destino.', 'Travel order with stamps at each destination.') } },
      { id: 'posse', label: l('Dar posse a um funcionário', 'Swear in an official'), result: { doc: 'auto-de-posse', why: l('Auto ou termo de posse com o compromisso de honra.', 'Record of taking office with the oath.') } },
      { id: 'entrega', label: l('Passar o serviço a outro titular', 'Hand over a post'), result: { doc: 'auto-de-entrega-servico', why: l('Auto de entrega com processos, bens e pendentes.', 'Handover record of files, assets and pending matters.') } },
      { id: 'declaracao', label: l('Declarar que alguém trabalha aqui', 'Certify that someone works here'), result: { doc: 'declaracao-de-servico', why: l('Declaração de serviço ou de efectividade.', 'Certificate of service or active service.') } },
      { id: 'ordem', label: l('Organizar o serviço', 'Organise the service'), result: { doc: 'ordem-de-servico', why: l('Ordem de serviço com determinações internas.', 'A service order with internal instructions.') } },
    ],
  },

  // ---------------------------------------------------------------- Empresa
  empresa: {
    id: 'empresa',
    question: l('O que precisa de fazer?', 'What do you need to do?'),
    options: [
      { id: 'contratar', label: l('Contratar', 'Hire someone'), next: 'empresa-contratar' },
      { id: 'pagar', label: l('Pagar ou confirmar salários', 'Pay or confirm salaries'), next: 'empresa-pagar' },
      { id: 'ferias', label: l('Férias e faltas', 'Leave and absences'), next: 'empresa-ferias' },
      { id: 'disciplinar', label: l('Disciplinar um trabalhador', 'Discipline an employee'), next: 'empresa-disciplinar' },
      { id: 'terminar', label: l('Terminar um contrato', 'End a contract'), next: 'empresa-terminar' },
      { id: 'contratos', label: l('Contratos com clientes, fornecedores ou parceiros', 'Contracts with clients, suppliers or partners'), next: 'contratos-negocio' },
      { id: 'sociedade', label: l('Sócios, quotas e gerência', 'Shareholders, quotas and management'), hint: l('Constituir a sociedade, deliberações, cessão de quotas.', 'Incorporation, resolutions, quota transfers.'), next: 'empresa-sociedade' },
      { id: 'vendas', label: l('Clientes, vendas e encomendas', 'Customers, sales and orders'), hint: l('Encomendas, extractos, garantias, preços.', 'Orders, statements, warranties, prices.'), next: 'empresa-vendas' },
      { id: 'eventos', label: l('Convites, certificados e cerimónias', 'Invitations, certificates and ceremonies'), next: 'empresa-eventos' },
      { id: 'politicas', label: l('Regulamentos, políticas e sindicatos', 'Rules, policies and unions'), next: 'empresa-politicas' },
      { id: 'financas', label: l('Banco, seguros e impostos', 'Bank, insurance and tax'), next: 'empresa-financas' },
      { id: 'concursos', label: l('Concorrer a um concurso público', 'Bid for a public tender'), next: 'empresa-concursos' },
      { id: 'digital', label: l('Website, software e imagem', 'Website, software and image'), next: 'empresa-digital' },
      { id: 'turismo', label: l('Turismo, transportes e agricultura', 'Tourism, transport and farming'), next: 'empresa-turismo' },
      { id: 'outro', label: l('Outro assunto da empresa', 'Other company matter'), next: 'empresa-outro' },
    ],
  },
  'empresa-vendas': {
    id: 'empresa-vendas',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'encomenda', label: l('Encomendar a um fornecedor', 'Order from a supplier'), result: { doc: 'nota-de-encomenda', why: l('Lista os artigos, preços e prazo de entrega. Não é uma factura.', 'Lists items, prices and delivery date. Not an invoice.'), also: ['protocolo-entrega-documentos'] } },
      { id: 'extracto', label: l('Mostrar a um cliente o que deve', 'Show a customer what they owe'), result: { doc: 'extracto-conta-corrente', why: l('Movimentos, saldo e antiguidade da dívida, com destacável de confirmação.', 'Entries, balance and ageing, with a tear-off confirmation slip.'), also: ['carta-confirmacao-saldos'] } },
      { id: 'condicoes', label: l('Definir as regras de venda', 'Set the terms of sale'), result: { doc: 'condicoes-gerais-venda', why: l('Preços, pagamento, entrega, garantia e reclamações.', 'Prices, payment, delivery, warranty and complaints.'), also: ['politica-trocas-devolucoes', 'tabela-de-precos'] } },
      { id: 'garantia', label: l('Dar garantia de um produto', 'Give a product warranty'), result: { doc: 'certificado-de-garantia', why: l('Prazo, cobertura e exclusões, dentro do mínimo legal.', 'Period, coverage and exclusions, within the legal minimum.') } },
      { id: 'cliente', label: l('Abrir conta a um cliente', 'Open a customer account'), result: { doc: 'ficha-de-cliente', why: l('Identificação, crédito e documentos a juntar.', 'Identification, credit and documents to attach.') } },
      { id: 'vale', label: l('Vales de oferta', 'Gift vouchers'), result: { doc: 'vale-oferta', why: l('Quatro vales numerados por folha.', 'Four numbered vouchers per sheet.') } },
    ],
  },
  'empresa-eventos': {
    id: 'empresa-eventos',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'convite', label: l('Convidar para um evento', 'Invite to an event'), result: { doc: 'convite-institucional', why: l('Convite formal da instituição, com programa e confirmação.', 'A formal invitation from the institution, with RSVP.'), also: ['programa-de-cerimonia', 'menu-de-evento'] } },
      { id: 'participacao', label: l('Certificar a participação', 'Certify attendance'), result: { doc: 'certificado-de-participacao', why: l('Certificado de curso, seminário ou formação.', 'A certificate for a course, seminar or training.') } },
      { id: 'reconhecimento', label: l('Reconhecer um trabalhador ou parceiro', 'Recognise an employee or partner'), result: { doc: 'certificado-de-reconhecimento', why: l('Certificado de mérito ou de anos de serviço.', 'A certificate of merit or long service.') } },
      { id: 'pesar', label: l('Lamentar um falecimento', 'Express condolences'), result: { doc: 'nota-de-pesar', why: l('Nota de pesar da instituição.', 'A condolence notice from the institution.') } },
    ],
  },
  'contratos-negocio': {
    id: 'contratos-negocio',
    question: l('Que contrato?', 'Which contract?'),
    options: [
      { id: 'fornecimento', label: l('Fornecimento regular de bens', 'Regular supply of goods'), result: { doc: 'contrato-de-fornecimento', why: l('Encomendas, preços, entregas e qualidade ao longo do tempo.', 'Orders, prices, deliveries and quality over time.') } },
      { id: 'venda', label: l('Venda de equipamento ou mercadoria', 'Sale of equipment or goods'), result: { doc: 'contrato-compra-venda-bens', why: l('Preço, entrega, garantia e reserva de propriedade.', 'Price, delivery, warranty and retention of title.') } },
      { id: 'obra', label: l('Uma obra ou construção', 'Building or construction work'), result: { doc: 'contrato-de-empreitada', why: l('Obra, preço, prazo, fiscalização e defeitos.', 'Works, price, deadline, supervision and defects.') } },
      { id: 'agente', label: l('Um agente que promove os meus produtos', 'An agent promoting my products'), result: { doc: 'contrato-de-agencia', why: l('Zona, comissões, exclusividade e indemnização de clientela.', 'Territory, commissions, exclusivity and goodwill compensation.') } },
      { id: 'parceria', label: l('Uma parceria ou negociação', 'A partnership or negotiation'), result: { doc: 'memorando-de-entendimento', why: l('Regista o que foi acordado antes do contrato definitivo.', 'Records what was agreed before the final contract.'), also: ['carta-de-intencao', 'contrato-de-consorcio'] } },
      { id: 'trespasse', label: l('Vender o estabelecimento comercial', 'Sell the business'), result: { doc: 'contrato-de-trespasse', why: l('Transmite o estabelecimento com o seu inventário e clientela.', 'Transfers the business with its inventory and goodwill.') } },
    ],
  },
  'contratos-pessoa': {
    id: 'contratos-pessoa',
    question: l('O que quer fazer?', 'What do you want to do?'),
    options: [
      { id: 'casa', label: l('Comprar ou vender uma casa', 'Buy or sell a house'), result: { doc: 'contrato-promessa-compra-venda', why: l('A promessa fixa preço e sinal; a venda faz-se depois por escritura.', 'The promise sets price and deposit; the sale itself is by notarial deed.') } },
      { id: 'emprestar', label: l('Emprestar dinheiro', 'Lend money'), result: { doc: 'contrato-de-mutuo', why: l('Valor, juros, prazo e plano de reembolso.', 'Amount, interest, term and repayment plan.'), also: ['declaracao-de-divida'] } },
      { id: 'ceder', label: l('Emprestar uma coisa sem cobrar', 'Lend an item for free'), result: { doc: 'contrato-de-comodato', why: l('Uso gratuito com obrigação de devolver.', 'Free use with a duty to return it.') } },
      { id: 'doar', label: l('Doar dinheiro ou bens', 'Give money or goods'), result: { doc: 'contrato-de-doacao', why: l('Doação de bens móveis ou dinheiro, com aceitação.', 'Gift of movable goods or money, with acceptance.') } },
      { id: 'vender', label: l('Vender um bem', 'Sell an item'), result: { doc: 'contrato-compra-venda-bens', why: l('Identifica o bem, o preço e a entrega.', 'Identifies the item, price and delivery.'), also: ['declaracao-de-venda'] } },
    ],
  },
  'empresa-sociedade': {
    id: 'empresa-sociedade',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'constituir', label: l('Constituir uma sociedade por quotas', 'Incorporate a limited company'), result: { doc: 'pacto-social-lda', why: l('Pacto social (estatutos) para registo na Conservatória.', 'Articles of association for registration.'), also: ['pacto-social-unipessoal', 'declaracao-beneficiario-efectivo'] } },
      { id: 'unipessoal', label: l('Constituir com um único sócio', 'Incorporate with one shareholder'), result: { doc: 'pacto-social-unipessoal', why: l('Estatutos da sociedade unipessoal por quotas.', 'Articles of a single-member company.') } },
      { id: 'deliberar', label: l('Tomar uma deliberação dos sócios', 'Pass a shareholders’ resolution'), result: { doc: 'deliberacao-unanime-escrita', why: l('Deliberação unânime por escrito ou decisão do sócio único, sem reunião.', 'Unanimous written resolution or sole-member decision, no meeting.'), also: ['extracto-de-acta'] } },
      { id: 'quotas', label: l('Vender ou ceder uma quota', 'Sell or transfer a quota'), result: { doc: 'contrato-cessao-quotas', why: l('Contrato de cessão, com consentimento da sociedade quando exigido.', 'Transfer agreement, with company consent where required.') } },
      { id: 'beneficiario', label: l('Declarar o beneficiário efectivo', 'Declare the beneficial owner'), result: { doc: 'declaracao-beneficiario-efectivo', why: l('Exigida no registo e em concursos públicos.', 'Required for registration and public tenders.') } },
      { id: 'gerencia', label: l('Gerência e representação', 'Management and representation'), result: { doc: 'procuracao-sociedade', why: l('Procuração da sociedade; também aceitação e renúncia de cargos.', 'Company power of attorney; also accepting or resigning posts.'), also: ['aceitacao-de-cargo', 'renuncia-gerente'] } },
    ],
  },
  'empresa-contratar': {
    id: 'empresa-contratar',
    question: l('Em que fase está a contratação?', 'Where are you in the hiring?'),
    options: [
      {
        id: 'proposta',
        label: l('Quero fazer uma proposta por escrito', 'I want to make a written offer'),
        result: { doc: 'proposta-de-emprego', why: l('Formaliza a oferta antes do contrato: função, salário e data de início.', 'Formalises the offer before the contract: role, salary and start date.'), also: ['contrato-indeterminado', 'contrato-prazo-certo'] },
      },
      {
        id: 'permanente',
        label: l('Contrato sem data de fim', 'Permanent contract'),
        result: { doc: 'contrato-indeterminado', why: l('É o contrato normal para um posto de trabalho permanente.', 'The standard contract for a permanent position.'), also: ['ficha-de-admissao', 'descricao-de-funcoes'], process: 'contratar-trabalhador' },
      },
      {
        id: 'prazo',
        label: l('Contrato com data de fim', 'Contract with an end date'),
        hint: l('Para uma necessidade temporária, com datas certas.', 'For a temporary need with set dates.'),
        result: { doc: 'contrato-prazo-certo', why: l('Para necessidades temporárias com início e fim conhecidos. A lei exige o motivo.', 'For temporary needs with a known start and end. The law requires the reason.'), also: ['ficha-de-admissao'] },
      },
      {
        id: 'incerto',
        label: l('Até acabar uma tarefa ou substituição', 'Until a task or replacement ends'),
        result: { doc: 'contrato-prazo-incerto', why: l('Quando não se sabe a data de fim: substituição, obra ou projecto.', 'When the end date is unknown: replacement, project or works.'), also: ['ficha-de-admissao'] },
      },
      {
        id: 'freelancer',
        label: l('Um freelancer ou prestador de serviços', 'A freelancer or contractor'),
        result: { doc: 'contrato-prestacao-servicos', why: l('Para serviços sem relação de trabalho: sem horário fixo nem subordinação.', 'For services without an employment relationship: no fixed hours or subordination.') },
      },
      {
        id: 'ficha',
        label: l('Registar os dados de quem entrou', 'Record a new employee’s details'),
        result: { doc: 'ficha-de-admissao', why: l('Reúne os dados pessoais, NUIT, INSS, banco e contacto de emergência.', 'Collects personal details, NUIT, INSS, bank and emergency contact.') },
      },
      { id: 'estagio', label: l('Receber um estagiário', 'Take on an intern'), result: { doc: 'contrato-estagio', why: l('Estágio com plano, orientador, duração e bolsa.', 'Internship with plan, supervisor, duration and allowance.') } },
      { id: 'parcial', label: l('Contrato a tempo parcial', 'Part-time contract'), result: { doc: 'contrato-tempo-parcial', why: l('Horário reduzido com remuneração proporcional.', 'Reduced hours with proportional pay.') } },
      { id: 'teletrabalho', label: l('Trabalho a partir de casa', 'Working from home'), result: { doc: 'acordo-teletrabalho', why: l('Regras de teletrabalho: equipamento, horário, despesas e controlo.', 'Telework rules: equipment, hours, expenses and monitoring.') } },
      { id: 'estrangeiro', label: l('Contratar um estrangeiro', 'Hire a foreign national'), result: { doc: 'contratacao-estrangeiro', why: l('Pedido ou comunicação à administração do trabalho, dentro das quotas.', 'Request or notice to the labour administration, within quotas.') } },
    ],
  },
  'empresa-pagar': {
    id: 'empresa-pagar',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'recibo', label: l('Recibo de salário do mês', 'Monthly payslip'), result: { doc: 'recibo-de-salario', why: l('Mostra o salário bruto, os descontos de INSS e IRPS e o líquido.', 'Shows gross pay, INSS and IRPS deductions and net pay.') } },
      { id: 'banco', label: l('Confirmar o salário para um banco', 'Confirm salary for a bank'), result: { doc: 'declaracao-de-vencimento', why: l('Os bancos pedem uma declaração com o salário e a antiguidade.', 'Banks ask for a statement with salary and length of service.'), also: ['declaracao-de-trabalho'] } },
      { id: 'trabalha', label: l('Confirmar que alguém trabalha aqui', 'Confirm someone works here'), result: { doc: 'declaracao-de-trabalho', why: l('Declara o vínculo, a função e a data de admissão.', 'States the employment, role and start date.') } },
      { id: 'adiantamento', label: l('Adiantar parte do salário', 'Advance part of a salary'), result: { doc: 'adiantamento-salarial', why: l('Regista o pedido, a autorização e como será descontado.', 'Records the request, approval and how it will be deducted.') } },
      { id: 'outro', label: l('Recibo de outro pagamento', 'Receipt for another payment'), result: { doc: 'recibo-de-pagamento', why: l('Um recibo simples para qualquer valor recebido.', 'A simple receipt for any amount received.') } },
      { id: 'promocao', label: l('Promover ou mudar de categoria', 'Promote or change category'), result: { doc: 'carta-promocao', why: l('Nova categoria, funções e salário, por escrito.', 'New category, duties and pay, in writing.') } },
    ],
  },
  'empresa-ferias': {
    id: 'empresa-ferias',
    question: l('O que aconteceu?', 'What is the situation?'),
    options: [
      { id: 'aprovar', label: l('Aprovar ou marcar férias', 'Approve or schedule leave'), result: { doc: 'autorizacao-de-ferias', why: l('Confirma por escrito o período de férias e a data de regresso.', 'Confirms the leave period and return date in writing.') } },
      { id: 'pedido', label: l('Um formulário de pedido de férias', 'A leave request form'), result: { doc: 'pedido-de-ferias', why: l('O trabalhador preenche e a chefia decide no mesmo documento.', 'The employee fills it in and the manager decides on the same form.') } },
      { id: 'falta', label: l('Um trabalhador faltou', 'An employee was absent'), result: { doc: 'justificacao-de-falta', why: l('Regista o motivo da falta e a decisão: justificada ou injustificada.', 'Records the reason and the decision: justified or not.') } },
      { id: 'parental', label: l('Licença de maternidade ou paternidade', 'Maternity or paternity leave'), result: { doc: 'licenca-parental', why: l('Calcula as datas da licença de acordo com a lei.', 'Calculates the leave dates under the law.') } },
      { id: 'horario', label: l('Afixar o horário de trabalho', 'Post the working hours'), result: { doc: 'mapa-horario-trabalho', why: l('Mapa de horário com intervalos e descanso semanal.', 'Working-hours schedule with breaks and weekly rest.') } },
    ],
  },
  'empresa-disciplinar': {
    id: 'empresa-disciplinar',
    question: l('Qual é a situação?', 'What is the situation?'),
    options: [
      {
        id: 'leve',
        label: l('Uma falta leve', 'A minor offence'),
        hint: l('Ex.: um atraso, primeira ocorrência.', 'E.g. lateness, first time.'),
        result: { doc: 'advertencia-escrita', why: l('A repreensão registada não exige processo disciplinar, mas o trabalhador deve ser ouvido.', 'A recorded reprimand needs no formal procedure, but the employee must be heard.') },
      },
      {
        id: 'grave',
        label: l('Uma falta grave, que pode levar a despedimento', 'A serious offence that may lead to dismissal'),
        result: {
          doc: 'nota-de-culpa',
          why: l('O processo disciplinar começa com a nota de culpa, que descreve os factos. Tem prazos legais.', 'The procedure starts with the written charge describing the facts. It has legal deadlines.'),
          also: ['suspensao-preventiva', 'convocatoria-audicao', 'decisao-disciplinar'],
          process: 'despedimento-justa-causa',
        },
      },
      { id: 'decorrer', label: l('Já tenho um processo a decorrer', 'A procedure is already under way'), next: 'empresa-disciplinar-fase' },
    ],
  },
  'empresa-disciplinar-fase': {
    id: 'empresa-disciplinar-fase',
    question: l('Em que fase está o processo?', 'Which stage is the procedure at?'),
    options: [
      { id: 'suspender', label: l('Afastar o trabalhador durante o processo', 'Keep the employee away during the procedure'), result: { doc: 'suspensao-preventiva', why: l('Suspende o trabalhador sem perda de remuneração enquanto o processo decorre.', 'Suspends the employee on full pay while the procedure runs.'), process: 'despedimento-justa-causa' } },
      { id: 'audicao', label: l('Marcar a audição do trabalhador', 'Schedule the employee’s hearing'), result: { doc: 'convocatoria-audicao', why: l('Convoca o trabalhador para ser ouvido, com data, hora e local.', 'Calls the employee to be heard, with date, time and place.'), process: 'despedimento-justa-causa' } },
      { id: 'decisao', label: l('Comunicar a decisão', 'Communicate the decision'), result: { doc: 'decisao-disciplinar', why: l('A decisão é escrita, fundamentada e indica os factos provados.', 'The decision is written, reasoned and lists the facts proven.'), also: ['certificado-de-trabalho'], process: 'despedimento-justa-causa' } },
    ],
  },
  'empresa-terminar': {
    id: 'empresa-terminar',
    question: l('Como termina o contrato?', 'How is the contract ending?'),
    options: [
      { id: 'nao-renovar', label: l('Contrato com data de fim que não vamos renovar', 'Fixed-term contract we will not renew'), result: { doc: 'nao-renovacao', why: l('A lei exige aviso com antecedência antes do fim do contrato.', 'The law requires advance notice before the contract ends.'), also: ['certificado-de-trabalho'], process: 'fim-contrato-prazo' } },
      { id: 'acordo', label: l('De comum acordo com o trabalhador', 'By mutual agreement'), result: { doc: 'acordo-de-revogacao', why: l('Regista a data de fim e a compensação acordada, assinado pelas duas partes.', 'Records the end date and agreed compensation, signed by both.'), also: ['certificado-de-trabalho', 'declaracao-de-quitacao'] } },
      { id: 'despedir', label: l('Despedimento por falta grave', 'Dismissal for serious misconduct'), result: { doc: 'nota-de-culpa', why: l('Só é possível com processo disciplinar, que começa com a nota de culpa.', 'Only possible through a disciplinary procedure, starting with the charge.'), process: 'despedimento-justa-causa' } },
      { id: 'saiu', label: l('O trabalhador já saiu', 'The employee has already left'), result: { doc: 'certificado-de-trabalho', why: l('A lei obriga a entregar um certificado de trabalho em qualquer cessação.', 'The law requires a certificate of employment on any termination.'), also: ['declaracao-de-quitacao'] } },
      { id: 'economicos', label: l('Reduzir pessoal por motivos económicos', 'Lay off staff for economic reasons'), result: { doc: 'rescisao-motivos-economicos', why: l('Aviso ao trabalhador, ao órgão sindical e ao ministério, com a indemnização calculada.', 'Notice to the worker, the union and the ministry, with the compensation calculated.') } },
    ],
  },
  'empresa-outro': {
    id: 'empresa-outro',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'credencial', label: l('Autorizar um funcionário a representar a empresa', 'Authorise an employee to represent the company'), result: { doc: 'credencial', why: l('Credencia uma pessoa para tratar de um assunto junto de uma entidade.', 'Authorises a person to handle a matter with another body.') } },
      { id: 'carta', label: l('Escrever uma carta oficial', 'Write an official letter'), result: { doc: 'carta-oficial', why: l('Uma carta em papel timbrado, com referência, destinatário e assunto.', 'A letter on letterhead, with reference, addressee and subject.') } },
      { id: 'acta', label: l('Registar uma reunião', 'Record a meeting'), result: { doc: 'acta', why: l('A acta regista as presenças e as deliberações.', 'Minutes record attendance and resolutions.') } },
      { id: 'orcamento', label: l('Enviar preços a um cliente', 'Send prices to a client'), result: { doc: 'orcamento', why: l('Um orçamento com itens, totais e validade. Não é uma factura.', 'A quote with items, totals and validity. Not an invoice.') } },
      { id: 'funcoes', label: l('Descrever um posto de trabalho', 'Describe a position'), result: { doc: 'descricao-de-funcoes', why: l('Define tarefas, responsabilidades e requisitos.', 'Defines tasks, responsibilities and requirements.') } },
      { id: 'sigilo', label: l('Proteger informação confidencial', 'Protect confidential information'), result: { doc: 'acordo-confidencialidade', why: l('Compromete a outra parte a não divulgar informação da empresa.', 'Commits the other party not to disclose company information.') } },
    ],
  },

  // ---------------------------------------------------------------- Pessoa
  pessoa: {
    id: 'pessoa',
    question: l('O que precisa de fazer?', 'What do you need to do?'),
    options: [
      { id: 'trabalho', label: l('Um assunto do meu emprego', 'Something about my job'), hint: l('Sair, pedir férias, responder a uma acusação…', 'Resign, request leave, reply to a charge…'), next: 'pessoa-trabalho' },
      { id: 'casa', label: l('Arrendar uma casa', 'Rent a house'), next: 'pessoa-casa' },
      { id: 'dinheiro', label: l('Dinheiro: recibos, dívidas, rendimentos, vendas', 'Money: receipts, debts, income, sales'), next: 'pessoa-dinheiro' },
      { id: 'contratos', label: l('Comprar, vender, emprestar ou doar', 'Buy, sell, lend or give'), next: 'contratos-pessoa' },
      { id: 'eventos', label: l('Convites, currículo e cartas pessoais', 'Invitations, CV and personal letters'), next: 'pessoa-eventos' },
      { id: 'familia', label: l('Família e viagens', 'Family and travel'), hint: l('Menores, união de facto, cônjuge, convites.', 'Children, partnerships, spouse, invitations.'), next: 'pessoa-familia' },
      { id: 'autorizar', label: l('Autorizar alguém a tratar por mim', 'Authorise someone to act for me'), result: { doc: 'procuracao', why: l('A procuração dá poderes a outra pessoa para agir em seu nome.', 'A power of attorney lets another person act on your behalf.') } },
      { id: 'instituicao', label: l('Fazer um pedido a uma instituição pública', 'Make a request to a public body'), result: { doc: 'requerimento', why: l('O requerimento é a forma habitual de pedir algo a um serviço público.', 'The standard way to ask a public office for something.') } },
      { id: 'servicos', label: l('Reclamar ou pedir a um serviço', 'Complain to or ask a service'), hint: l('Energia, água, telefone, município, loja, banco.', 'Power, water, phone, municipality, shop, bank.'), next: 'pessoa-servicos' },
      { id: 'crime', label: l('Denunciar um crime', 'Report a crime'), result: { doc: 'participacao-criminal', why: l('Participação ao Ministério Público ou à polícia. Se foi vítima de um crime que depende de queixa, use a queixa-crime.', 'Report to the prosecutor or police. Victims of complaint-dependent crimes use the criminal complaint.'), also: ['queixa-crime'] } },
      { id: 'outro', label: l('Outro', 'Something else'), next: 'pessoa-outro' },
    ],
  },
  'pessoa-trabalho': {
    id: 'pessoa-trabalho',
    question: l('O que quer fazer?', 'What do you want to do?'),
    options: [
      { id: 'sair', label: l('Sair do emprego', 'Leave my job'), result: { doc: 'rescisao-pelo-trabalhador', why: l('Comunica a saída por escrito, respeitando o aviso prévio legal.', 'Gives written notice, respecting the legal notice period.'), process: 'rescisao-trabalhador' } },
      { id: 'resposta', label: l('Responder a uma nota de culpa', 'Reply to a disciplinary charge'), result: { doc: 'resposta-nota-de-culpa', why: l('É a sua defesa escrita. Tem um prazo legal para a entregar.', 'Your written defence. There is a legal deadline.') } },
      { id: 'ferias', label: l('Pedir férias', 'Request leave'), result: { doc: 'pedido-de-ferias', why: l('Pede por escrito as datas de férias à empresa.', 'Requests leave dates from the employer in writing.') } },
      { id: 'falta', label: l('Justificar uma falta', 'Justify an absence'), result: { doc: 'justificacao-de-falta', why: l('Explica o motivo da ausência e junta os comprovativos.', 'Explains the reason and attaches proof.') } },
      { id: 'parental', label: l('Licença de maternidade ou paternidade', 'Maternity or paternity leave'), result: { doc: 'licenca-parental', why: l('Comunica a licença à empresa com as datas calculadas.', 'Notifies the employer with the calculated dates.') } },
      { id: 'adiantamento', label: l('Pedir um adiantamento de salário', 'Ask for a salary advance'), result: { doc: 'adiantamento-salarial', why: l('Pedido e autorização no mesmo documento.', 'Request and approval in one document.') } },
      { id: 'mediacao', label: l('Resolver um conflito com o empregador', 'Resolve a dispute with my employer'), result: { doc: 'pedido-mediacao-laboral', why: l('Pedido de mediação ao centro de mediação e arbitragem laboral.', 'Request for mediation at the labour mediation centre.') } },
    ],
  },
  'pessoa-casa': {
    id: 'pessoa-casa',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'contrato', label: l('O contrato de arrendamento', 'The lease contract'), result: { doc: 'contrato-de-arrendamento', why: l('Define renda, caução, duração e regras do imóvel.', 'Sets rent, deposit, duration and house rules.'), also: ['recibo-de-renda'] } },
      { id: 'recibo', label: l('Um recibo de renda', 'A rent receipt'), result: { doc: 'recibo-de-renda', why: l('Confirma o pagamento da renda de um mês.', 'Confirms payment of a month’s rent.'), also: ['recibo-de-caucao'] } },
      { id: 'vistoria', label: l('Entregar ou receber a casa', 'Hand over or take back the house'), result: { doc: 'auto-vistoria-imovel', why: l('Estado do imóvel e inventário, na entrada ou na saída.', 'Condition and inventory at move-in or move-out.') } },
      { id: 'terminar', label: l('Terminar o arrendamento', 'End the lease'), result: { doc: 'carta-denuncia-arrendamento', why: l('Pelo inquilino ou pelo senhorio, com o pré-aviso.', 'By tenant or landlord, with notice.'), also: ['revogacao-arrendamento'] } },
      { id: 'atraso', label: l('Rendas em atraso', 'Rent arrears'), result: { doc: 'interpelacao-rendas-atraso', why: l('Interpela o inquilino e dá um prazo para pagar.', 'Formal demand with a deadline.') } },
      { id: 'quarto', label: l('Arrendar um quarto', 'Rent out a room'), result: { doc: 'contrato-arrendamento-quarto', why: l('Com partes comuns e regras da casa.', 'With shared areas and house rules.') } },
    ],
  },
  'pessoa-dinheiro': {
    id: 'pessoa-dinheiro',
    question: l('Qual é a situação?', 'What is the situation?'),
    options: [
      { id: 'recebi', label: l('Recebi um pagamento', 'I received a payment'), result: { doc: 'recibo-de-pagamento', why: l('Um recibo para quem lhe pagou.', 'A receipt for the person who paid you.') } },
      { id: 'divida', label: l('Alguém me deve ou eu devo', 'Someone owes me or I owe'), result: { doc: 'declaracao-de-divida', why: l('Reconhece a dívida e define um plano de pagamento.', 'Acknowledges the debt and sets a payment plan.') } },
      { id: 'rendimentos', label: l('Provar os meus rendimentos', 'Prove my income'), result: { doc: 'declaracao-de-rendimentos-pessoal', why: l('Declara, sob compromisso de honra, quanto ganha.', 'Declares on your honour how much you earn.') } },
      { id: 'vender', label: l('Vender um carro ou outro bem', 'Sell a car or other item'), result: { doc: 'declaracao-de-venda', why: l('Regista a venda, o preço e a identificação do bem.', 'Records the sale, price and item details.') } },
    ],
  },
  'pessoa-familia': {
    id: 'pessoa-familia',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'viagem', label: l('Autorizar a viagem de um filho menor', 'Authorise a child to travel'), result: { doc: 'autorizacao-viagem-menor', why: l('Consentimento do pai ou da mãe ausente, com assinatura reconhecida.', 'Consent of the absent parent, with a certified signature.') } },
      { id: 'uniao', label: l('Declarar uma união de facto', 'Declare a de facto union'), result: { doc: 'declaracao-uniao-de-facto', why: l('Declaração conjunta para obter a certidão administrativa.', 'Joint declaration to obtain the administrative certificate.') } },
      { id: 'filhos', label: l('Acordar a guarda e a pensão dos filhos', 'Agree custody and child support'), result: { doc: 'acordo-poder-parental', why: l('Acordo de regulação do poder parental e alimentos, para homologação.', 'Parenting and support agreement, for court approval.') } },
      { id: 'conjuge', label: l('Consentimento do cônjuge', 'Spouse’s consent'), result: { doc: 'consentimento-conjuge', why: l('Consentimento para um acto concreto que a lei exige.', 'Consent to a specific act where the law requires it.') } },
      { id: 'convite', label: l('Convidar um estrangeiro (visto)', 'Invite a foreigner (visa)'), result: { doc: 'carta-convite-visto', why: l('Carta-convite e termo de responsabilidade para o pedido de visto.', 'Invitation and guarantee for the visa application.') } },
    ],
  },
  'pessoa-eventos': {
    id: 'pessoa-eventos',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'cv', label: l('O meu currículo (CV)', 'My CV'), result: { doc: 'curriculum-vitae', why: l('Currículo claro, numa página, sem dados pessoais desnecessários.', 'A clear one-page CV without unnecessary personal data.'), also: ['carta-de-candidatura'] } },
      { id: 'casamento', label: l('Convite de casamento', 'Wedding invitation'), result: { doc: 'convite-de-casamento', why: l('Convite em A5, com os pais, os noivos, a cerimónia e a recepção.', 'A5 invitation with parents, couple, ceremony and reception.'), also: ['programa-de-cerimonia', 'menu-de-evento', 'envelope-dl'] } },
      { id: 'lobolo', label: l('Lobolo ou cerimónia tradicional', 'Lobolo or traditional ceremony'), result: { doc: 'convite-cerimonia-tradicional', why: l('Convite para a cerimónia tradicional das famílias.', 'Invitation to the families’ traditional ceremony.') } },
      { id: 'festa', label: l('Aniversário, bodas ou graduação', 'Birthday, anniversary or graduation'), result: { doc: 'convite-de-festa', why: l('Convite em A6, quatro por folha.', 'A6 invitation, four per sheet.') } },
      { id: 'luto', label: l('Falecimento ou missa', 'A death or memorial mass'), result: { doc: 'participacao-de-falecimento', why: l('Participação de falecimento com velório, missa e funeral.', 'Death notice with wake, mass and funeral.'), also: ['convite-missa-sufragio', 'cartao-de-agradecimento'] } },
      { id: 'carta', label: l('Carta de pêsames, agradecimento ou felicitações', 'Condolence, thank-you or congratulations letter'), result: { doc: 'carta-pessoal', why: l('Carta pessoal em A5.', 'A personal letter on A5.') } },
      { id: 'cartao', label: l('Cartões de visita', 'Business cards'), result: { doc: 'cartao-de-visita', why: l('Dez cartões por folha A4, com marcas de corte.', 'Ten cards per A4 sheet, with cutting marks.') } },
    ],
  },
  'saude': {
    id: 'saude',
    question: l('Para que situação?', 'For which situation?'),
    options: [
      { id: 'doente', label: l('Um doente que precisa de um documento', 'A patient needs a document'), next: 'saude-doente' },
      { id: 'procedimentos', label: l('Exames, procedimentos e referências', 'Tests, procedures and referrals'), next: 'saude-procedimentos' },
      { id: 'gestao', label: l('Empresas e orçamentos', 'Employers and estimates'), next: 'saude-gestao' },
    ],
  },
  'saude-doente': {
    id: 'saude-doente',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'atestado', label: l('Atestado de doença', 'Sick note'), result: { doc: 'atestado-medico-doenca', why: l('Justifica a ausência, sem diagnóstico salvo autorização do doente.', 'Justifies absence, without diagnosis unless the patient authorises it.') } },
      { id: 'comparencia', label: l('Comprovar a ida à consulta', 'Prove attendance at an appointment'), result: { doc: 'declaracao-de-comparencia', why: l('Declara a presença e o período na unidade de saúde.', 'States attendance and time at the health unit.') } },
      { id: 'receita', label: l('Receita médica', 'Prescription'), result: { doc: 'receita-medica', why: l('Receita em A5; estupefacientes exigem impresso oficial.', 'A5 prescription; narcotics need the official form.') } },
      { id: 'internamento', label: l('Internamento e alta', 'Admission and discharge'), result: { doc: 'declaracao-internamento-alta', why: l('Declara o período de internamento.', 'States the period in hospital.') } },
      { id: 'relatorio', label: l('Relatório médico', 'Medical report'), result: { doc: 'relatorio-medico', why: l('Relatório clínico confidencial para o doente, tribunal ou junta.', 'Confidential report for the patient, a court or a medical board.') } },
    ],
  },
  'saude-procedimentos': {
    id: 'saude-procedimentos',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'consentimento', label: l('Consentimento para um procedimento', 'Consent to a procedure'), result: { doc: 'consentimento-informado', why: l('Riscos, alternativas e assinatura do doente.', 'Risks, alternatives and the patient’s signature.'), also: ['termo-recusa-tratamento'] } },
      { id: 'referencia', label: l('Referir o doente a outra unidade', 'Refer the patient elsewhere'), result: { doc: 'guia-referencia-doente', why: l('Guia de referência com talão de resposta.', 'Referral with a reply slip.') } },
      { id: 'exames', label: l('Pedir análises ou exames', 'Request tests'), result: { doc: 'requisicao-exames', why: l('Requisição em A5.', 'A5 test request.'), also: ['boletim-resultados-analises'] } },
      { id: 'resultados', label: l('Entregar resultados de análises', 'Issue test results'), result: { doc: 'boletim-resultados-analises', why: l('Boletim com valores de referência e alertas.', 'Report with reference ranges and flags.') } },
    ],
  },
  'saude-gestao': {
    id: 'saude-gestao',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'aptidao', label: l('Aptidão para o trabalho ou para a carta', 'Fitness for work or a licence'), result: { doc: 'atestado-aptidao-fisica', why: l('Atestado de aptidão física e mental.', 'Certificate of physical and mental fitness.'), also: ['ficha-aptidao-trabalho'] } },
      { id: 'empresa', label: l('Serviço de medicina no trabalho', 'Occupational health service'), result: { doc: 'contrato-medicina-trabalho', why: l('Contrato entre a clínica e a empresa.', 'Contract between the clinic and the employer.') } },
      { id: 'dentario', label: l('Orçamento dentário', 'Dental estimate'), result: { doc: 'orcamento-tratamento-dentario', why: l('Plano de tratamento com valores.', 'Treatment plan with prices.') } },
    ],
  },
  'comunidade': {
    id: 'comunidade',
    question: l('O que precisa de passar?', 'What do you need to issue?'),
    options: [
      { id: 'declaracoes', label: l('Declarações para moradores', 'Declarations for residents'), next: 'comunidade-declaracoes' },
      { id: 'reunioes', label: l('Reuniões, acordos e registos', 'Meetings, agreements and registers'), next: 'comunidade-reunioes' },
    ],
  },
  'comunidade-declaracoes': {
    id: 'comunidade-declaracoes',
    question: l('Que declaração?', 'Which declaration?'),
    options: [
      { id: 'residencia', label: l('Residência', 'Residence'), result: { doc: 'declaracao-de-residencia', why: l('Declaração do bairro; o atestado oficial é do posto ou município.', 'Neighbourhood declaration; the official certificate is issued by the post or municipality.'), also: ['atestado-de-residencia'] } },
      { id: 'carencia', label: l('Família carenciada', 'Family in need'), result: { doc: 'declaracao-de-carencia', why: l('Comprova a situação económica para apoios.', 'Supports applications for assistance.') } },
      { id: 'agregado', label: l('Agregado familiar', 'Household'), result: { doc: 'declaracao-agregado-familiar', why: l('Quem vive na casa.', 'Who lives in the home.') } },
      { id: 'conduta', label: l('Boa conduta', 'Good conduct'), result: { doc: 'declaracao-de-boa-conduta', why: l('Não substitui o registo criminal.', 'Does not replace the criminal record certificate.') } },
      { id: 'falecimento', label: l('Falecimento', 'Death'), result: { doc: 'declaracao-de-falecimento', why: l('Apoia o registo do óbito na Conservatória.', 'Supports death registration at the registry.') } },
      { id: 'terreno', label: l('Ocupação de terreno', 'Land occupation'), result: { doc: 'declaracao-ocupacao-terreno', why: l('Confirma a ocupação; não atribui o DUAT.', 'Confirms occupation; it does not grant a DUAT.') } },
      { id: 'casal', label: l('Casal que vive junto', 'Couple living together'), result: { doc: 'declaracao-de-convivencia', why: l('Apoia a declaração de união de facto.', 'Supports the de facto union declaration.') } },
    ],
  },
  'comunidade-reunioes': {
    id: 'comunidade-reunioes',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'convocar', label: l('Convocar a população', 'Call residents to a meeting'), result: { doc: 'convocatoria-reuniao-comunitaria', why: l('Aviso para afixar.', 'Notice to post.'), also: ['acta-reuniao-comunitaria'] } },
      { id: 'acta', label: l('Acta da reunião', 'Meeting minutes'), result: { doc: 'acta-reuniao-comunitaria', why: l('Presenças, assuntos e decisões.', 'Attendance, matters and decisions.') } },
      { id: 'conciliacao', label: l('Acordo entre vizinhos', 'Agreement between neighbours'), result: { doc: 'acta-de-conciliacao', why: l('Regista um acordo voluntário; crimes e terras ficam de fora.', 'Records a voluntary agreement; crimes and land are excluded.') } },
      { id: 'encaminhar', label: l('Encaminhar um morador', 'Refer a resident'), result: { doc: 'guia-de-encaminhamento', why: l('Guia para outra entidade.', 'Referral to another body.') } },
      { id: 'testemunhas', label: l('Testemunhas confirmam um facto', 'Witnesses confirm a fact'), result: { doc: 'declaracao-de-testemunhas', why: l('Declaração de duas testemunhas.', 'Statement by two witnesses.') } },
      { id: 'registo', label: l('Lista de moradores', 'List of residents'), result: { doc: 'registo-de-moradores', why: l('Registo do quarteirão, com cuidado nos dados pessoais.', 'Block register, careful with personal data.') } },
    ],
  },
  'advogado-penal': {
    id: 'advogado-penal',
    question: l('O que precisa de apresentar?', 'What do you need to file?'),
    options: [
      { id: 'participacao', label: l('Denunciar um crime (participação criminal)', 'Report a crime'), result: { doc: 'participacao-criminal', why: l('Qualquer pessoa pode participar um crime público ao Ministério Público ou à polícia.', 'Anyone may report a public crime.') } },
      { id: 'assistente', label: l('Constituir-se assistente', 'Join as assistant'), result: { doc: 'constituicao-de-assistente', why: l('O ofendido intervém no processo ao lado do Ministério Público.', 'The victim joins the prosecution.'), also: ['pedido-indemnizacao-civil'] } },
      { id: 'defesa', label: l('Defender o arguido', 'Defend the accused'), result: { doc: 'contestacao-penal', why: l('Contestação com o rol de testemunhas.', 'Defence with the list of witnesses.'), also: ['requerimento-audiencia-preliminar'] } },
      { id: 'liberdade', label: l('Pedir a libertação', 'Seek release'), result: { doc: 'habeas-corpus', why: l('Contra prisão ilegal; para medidas de coacção use o pedido próprio.', 'Against unlawful detention.'), also: ['medida-de-coaccao', 'liberdade-condicional'] } },
      { id: 'recurso', label: l('Recorrer de uma decisão penal', 'Appeal a criminal decision'), result: { doc: 'recurso-penal', why: l('Interposição, motivação e conclusões.', 'Notice, grounds and conclusions.') } },
      { id: 'desistir', label: l('Desistir da queixa', 'Withdraw the complaint'), result: { doc: 'desistencia-de-queixa', why: l('Nos crimes que dependem de queixa.', 'For crimes that depend on a complaint.') } },
    ],
  },
  'advogado-execucao': {
    id: 'advogado-execucao',
    question: l('O que pretende?', 'What do you want?'),
    options: [
      { id: 'executar', label: l('Executar uma dívida ou sentença', 'Enforce a debt or judgment'), result: { doc: 'requerimento-executivo', why: l('Pagamento de quantia, entrega de coisa ou prestação de facto.', 'Payment, delivery or performance.') } },
      { id: 'opor', label: l('Opor-se a uma execução', 'Oppose enforcement'), result: { doc: 'embargos-de-executado', why: l('Defesa do executado; terceiros usam embargos de terceiro.', 'The debtor’s defence.'), also: ['embargos-de-terceiro'] } },
      { id: 'cautelar', label: l('Uma medida urgente (providência cautelar)', 'An urgent measure (injunction)'), result: { doc: 'providencia-cautelar', why: l('Arresto, embargo de obra nova, restituição de posse e outras.', 'Attachment, stop works, possession and others.'), also: ['arresto', 'embargo-de-obra-nova'] } },
      { id: 'recorrer', label: l('Recorrer de uma sentença', 'Appeal a judgment'), result: { doc: 'requerimento-de-recurso', why: l('Requerimento de interposição; depois as alegações.', 'Notice of appeal; then the arguments.'), also: ['alegacoes-de-recurso'] } },
      { id: 'despejo', label: l('Despejar um inquilino', 'Evict a tenant'), result: { doc: 'accao-de-despejo', why: l('Acção para resolver o arrendamento e entregar o imóvel.', 'Action to end the lease and recover the property.') } },
    ],
  },
  'advogado-familia': {
    id: 'advogado-familia',
    question: l('Que acção?', 'Which action?'),
    options: [
      { id: 'divorcio', label: l('Divórcio litigioso', 'Contested divorce'), result: { doc: 'divorcio-litigioso', why: l('Quando um dos cônjuges não concorda.', 'When one spouse does not agree.'), also: ['divorcio-nao-litigioso'] } },
      { id: 'alimentos', label: l('Alimentos', 'Maintenance'), result: { doc: 'accao-de-alimentos', why: l('Fixar a pensão de alimentos.', 'Set maintenance.'), also: ['regulacao-poder-parental'] } },
      { id: 'paternidade', label: l('Paternidade', 'Paternity'), result: { doc: 'investigacao-paternidade', why: l('Investigação ou impugnação.', 'Establish or challenge paternity.') } },
      { id: 'inventario', label: l('Herança: inventário e herdeiros', 'Estate: inventory and heirs'), result: { doc: 'requerimento-inventario', why: l('Partilha judicial com relação de bens.', 'Court division with the list of assets.'), also: ['relacao-de-bens', 'habilitacao-de-herdeiros'] } },
    ],
  },
  'advogado-laboral': {
    id: 'advogado-laboral',
    question: l('Que matéria?', 'Which matter?'),
    options: [
      { id: 'despedimento', label: l('Impugnar um despedimento', 'Challenge a dismissal'), result: { doc: 'peticao-laboral', why: l('Petição no tribunal do trabalho, com os créditos.', 'Labour court claim, with amounts owed.'), also: ['suspensao-despedimento'] } },
      { id: 'inspeccao', label: l('Queixa à Inspecção do Trabalho', 'Complaint to the labour inspectorate'), result: { doc: 'denuncia-inspeccao-trabalho', why: l('Denúncia de violações da lei laboral.', 'Report labour law breaches.') } },
      { id: 'administrativo', label: l('Contra um acto da Administração', 'Against an administrative act'), result: { doc: 'recurso-contencioso', why: l('No Tribunal Administrativo; pode pedir a suspensão da eficácia.', 'In the Administrative Court.'), also: ['suspensao-eficacia', 'reclamacao-recurso'] } },
      { id: 'fiscal', label: l('Contra um imposto ou multa fiscal', 'Against a tax assessment'), result: { doc: 'reclamacao-graciosa', why: l('Primeiro à própria Autoridade Tributária.', 'First to the tax authority.'), also: ['recurso-hierarquico-fiscal', 'impugnacao-judicial-tributaria'] } },
    ],
  },
  'empresa-politicas': {
    id: 'empresa-politicas',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'regulamento', label: l('Regulamento interno', 'Internal work rules'), result: { doc: 'regulamento-interno-trabalho', why: l('Organização, horários, disciplina e segurança.', 'Organisation, hours, discipline and safety.'), also: ['codigo-de-conduta'] } },
      { id: 'assedio', label: l('Política contra o assédio', 'Anti-harassment policy'), result: { doc: 'politica-assedio', why: l('Prevenção, queixa e investigação.', 'Prevention, complaints and investigation.'), also: ['politica-hiv-sida', 'politica-seguranca-saude-trabalho'] } },
      { id: 'acidente', label: l('Registar um acidente de trabalho', 'Record a work accident'), result: { doc: 'participacao-acidente-trabalho', why: l('Registo interno e carta à seguradora.', 'Internal record and insurer letter.') } },
      { id: 'greve', label: l('Greve e serviços mínimos', 'Strike and minimum services'), result: { doc: 'acordo-servicos-minimos', why: l('Acordo com os representantes dos trabalhadores.', 'Agreement with worker representatives.'), also: ['pre-aviso-greve'] } },
      { id: 'avaliacao', label: l('Avaliar o desempenho', 'Appraise performance'), result: { doc: 'ficha-avaliacao-desempenho', why: l('Objectivos, competências e plano de desenvolvimento.', 'Objectives, skills and development plan.') } },
    ],
  },
  'empresa-financas': {
    id: 'empresa-financas',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'banco', label: l('Escrever ao banco', 'Write to the bank'), result: { doc: 'pedido-extracto-bancario', why: l('Extractos, declarações e cartas bancárias.', 'Statements and bank letters.'), also: ['alteracao-assinaturas-bancarias', 'reclamacao-ao-banco'] } },
      { id: 'garantia', label: l('Pedir uma garantia bancária', 'Request a bank guarantee'), result: { doc: 'pedido-garantia-bancaria', why: l('Para concursos e contratos.', 'For tenders and contracts.'), also: ['carta-de-conforto'] } },
      { id: 'sinistro', label: l('Participar um sinistro ao seguro', 'Report an insurance claim'), result: { doc: 'participacao-de-sinistro', why: l('Automóvel, incêndio, roubo e outros.', 'Motor, fire, theft and others.'), also: ['reclamacao-seguradora'] } },
      { id: 'imposto', label: l('Contestar um imposto', 'Dispute a tax'), result: { doc: 'reclamacao-graciosa', why: l('Reclamação à Autoridade Tributária.', 'Objection to the tax authority.'), also: ['pedido-pagamento-prestacoes-at', 'pedido-certidao-quitacao-fiscal'] } },
      { id: 'credito', label: l('Penhor ou cessão de créditos', 'Pledge or assignment of receivables'), result: { doc: 'contrato-de-penhor', why: l('Garantias sobre bens e créditos.', 'Security over goods and receivables.'), also: ['contrato-cessao-creditos'] } },
    ],
  },
  'empresa-concursos': {
    id: 'empresa-concursos',
    question: l('Em que fase?', 'At which stage?'),
    options: [
      { id: 'proposta', label: l('Apresentar a proposta', 'Submit the bid'), result: { doc: 'carta-apresentacao-proposta', why: l('Carta de apresentação e documentos da proposta.', 'Cover letter and bid documents.'), also: ['proposta-financeira', 'proposta-tecnica'] } },
      { id: 'declaracoes', label: l('Declarações do concorrente', 'Bidder declarations'), result: { doc: 'declaracao-nao-impedimento', why: l('Não impedimento, aceitação e integridade.', 'Non-impediment, acceptance and integrity.'), also: ['declaracao-aceitacao-concurso', 'declaracao-integridade-concorrente'] } },
      { id: 'duvidas', label: l('Pedir esclarecimentos', 'Ask for clarification'), result: { doc: 'pedido-esclarecimentos-concurso', why: l('Dentro do prazo do documento do concurso.', 'Within the tender deadline.') } },
      { id: 'reclamar', label: l('Reclamar do resultado', 'Challenge the result'), result: { doc: 'reclamacao-concurso', why: l('Reclamação e, depois, recurso hierárquico.', 'Complaint, then hierarchical appeal.'), also: ['recurso-hierarquico-concurso'] } },
      { id: 'garantia', label: l('Garantia bancária do concurso', 'Tender bank guarantee'), result: { doc: 'garantia-provisoria', why: l('Texto que o banco emite.', 'The wording the bank issues.'), also: ['garantia-definitiva', 'garantia-de-adiantamento'] } },
    ],
  },
  'empresa-digital': {
    id: 'empresa-digital',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'website', label: l('Termos e privacidade do website', 'Website terms and privacy'), result: { doc: 'termos-e-condicoes-website', why: l('Termos de uso, privacidade e cookies.', 'Terms of use, privacy and cookies.'), also: ['politica-de-privacidade', 'politica-de-cookies'] } },
      { id: 'software', label: l('Encomendar software ou um website', 'Commission software or a website'), result: { doc: 'contrato-desenvolvimento-software', why: l('Especificação, fases, aceitação e propriedade.', 'Specification, milestones, acceptance and ownership.'), also: ['contrato-suporte-informatico'] } },
      { id: 'imagem', label: l('Autorização de uso de imagem', 'Image release'), result: { doc: 'autorizacao-uso-imagem', why: l('Para fotografias, vídeo e voz.', 'For photos, video and voice.') } },
      { id: 'autor', label: l('Direitos de autor', 'Copyright'), result: { doc: 'contrato-cessao-direitos-autor', why: l('Cessão, encomenda de obra ou licença.', 'Assignment, commissioned work or licence.') } },
      { id: 'marketing', label: l('Marketing e influenciadores', 'Marketing and influencers'), result: { doc: 'contrato-marketing-digital', why: l('Gestão de redes sociais e campanhas.', 'Social media and campaigns.'), also: ['contrato-influenciador', 'contrato-de-patrocinio'] } },
    ],
  },
  'empresa-turismo': {
    id: 'empresa-turismo',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'reserva', label: l('Confirmar uma reserva', 'Confirm a booking'), result: { doc: 'confirmacao-de-reserva', why: l('Voucher com datas, preço e condições.', 'Voucher with dates, price and terms.'), also: ['condicoes-gerais-alojamento'] } },
      { id: 'alojamento', label: l('Regras e registo de hóspedes', 'House rules and guest register'), result: { doc: 'regulamento-interno-alojamento', why: l('Regulamento bilingue do estabelecimento.', 'Bilingual house rules.'), also: ['ficha-registo-hospede'] } },
      { id: 'viatura', label: l('Alugar uma viatura', 'Hire out a car'), result: { doc: 'contrato-aluguer-viatura', why: l('Com vistoria de entrega e devolução.', 'With pick-up and return inspection.') } },
      { id: 'transporte', label: l('Transportar passageiros', 'Carry passengers'), result: { doc: 'contrato-transporte-passageiros', why: l('Autocarro ou mini-bus com motorista.', 'Bus or minibus with driver.'), also: ['contrato-viagem-organizada'] } },
      { id: 'agricultura', label: l('Parceria agrícola ou pecuária', 'Farming or livestock partnership'), result: { doc: 'contrato-parceria-agricola', why: l('Partilha da produção entre as partes.', 'Sharing the produce.'), also: ['contrato-parceria-pecuaria', 'contrato-servicos-mecanizacao'] } },
    ],
  },
  'pessoa-servicos': {
    id: 'pessoa-servicos',
    question: l('A quem?', 'To whom?'),
    options: [
      { id: 'energia', label: l('Energia (EDM)', 'Electricity'), result: { doc: 'reclamacao-energia', why: l('Facturação, cortes e avarias.', 'Billing, cuts and faults.'), also: ['pedido-servico-agua-energia'] } },
      { id: 'agua', label: l('Água', 'Water'), result: { doc: 'reclamacao-agua', why: l('Facturação, falta de água e ligações.', 'Billing, supply and connections.') } },
      { id: 'telefone', label: l('Telefone e internet', 'Phone and internet'), result: { doc: 'reclamacao-telecomunicacoes', why: l('Operadora; se não resolver, ao regulador.', 'The operator; then the regulator.'), also: ['reclamacao-ao-regulador'] } },
      { id: 'municipio', label: l('Município ou terreno', 'Municipality or land'), result: { doc: 'requerimento-municipal', why: l('Talhão, licenças, isenções e outros pedidos.', 'Plots, licences, exemptions and more.'), also: ['pedido-de-duat'] } },
      { id: 'loja', label: l('Uma loja ou empresa', 'A shop or company'), result: { doc: 'pedido-de-reembolso', why: l('Reembolso, troca ou reparação.', 'Refund, exchange or repair.'), also: ['accionamento-garantia', 'queixa-defesa-consumidor'] } },
      { id: 'cancelar', label: l('Cancelar um contrato', 'Cancel a contract'), result: { doc: 'cancelamento-de-contrato', why: l('Televisão, internet, ginásio, seguro e outros.', 'TV, internet, gym, insurance and others.') } },
      { id: 'informacao', label: l('Pedir informação pública', 'Request public information'), result: { doc: 'pedido-acesso-informacao', why: l('Ao abrigo do direito à informação.', 'Under the right to information.') } },
    ],
  },
  'estado-contratacao': {
    id: 'estado-contratacao',
    question: l('Em que fase?', 'At which stage?'),
    options: [
      { id: 'lancar', label: l('Lançar o procedimento', 'Launch the procedure'), result: { doc: 'convite-apresentacao-propostas', why: l('Convite ou anúncio, com termos de referência ou caderno de encargos.', 'Invitation or notice, with terms of reference.'), also: ['anuncio-de-concurso', 'termos-de-referencia', 'caderno-de-encargos'] } },
      { id: 'abrir', label: l('Abrir e avaliar propostas', 'Open and evaluate bids'), result: { doc: 'acta-abertura-propostas', why: l('Acta de abertura e relatório do júri.', 'Opening minutes and panel report.'), also: ['relatorio-avaliacao-propostas'] } },
      { id: 'adjudicar', label: l('Adjudicar e notificar', 'Award and notify'), result: { doc: 'notificacao-adjudicacao', why: l('Notificação ao adjudicatário e aos restantes concorrentes.', 'Notify the winner and the others.'), also: ['notificacao-resultado-concurso'] } },
      { id: 'contrato', label: l('Celebrar o contrato', 'Sign the contract'), result: { doc: 'contrato-fornecimento-estado', why: l('Fornecimento de bens ou prestação de serviços.', 'Supply of goods or services.'), also: ['contrato-servicos-estado', 'auto-recepcao-bens'] } },
    ],
  },
  'pessoa-outro': {
    id: 'pessoa-outro',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'reclamar', label: l('Reclamar de um produto ou serviço', 'Complain about a product or service'), result: { doc: 'carta-de-reclamacao', why: l('Expõe o problema e pede uma solução com prazo.', 'Sets out the problem and asks for a remedy with a deadline.') } },
      { id: 'declarar', label: l('Declarar que algo é verdade', 'Declare that something is true'), result: { doc: 'compromisso-de-honra', why: l('Uma declaração sob compromisso de honra.', 'A sworn statement on your honour.') } },
      { id: 'carta', label: l('Escrever uma carta formal', 'Write a formal letter'), result: { doc: 'carta-oficial', why: l('Uma carta formal com destinatário e assunto.', 'A formal letter with addressee and subject.') } },
      { id: 'extravio', label: l('Perdi um documento', 'I lost a document'), result: { doc: 'declaracao-extravio-documento', why: l('Declara a perda ou o furto para pedir a segunda via.', 'Declares the loss or theft to request a replacement.') } },
      { id: 'residencia', label: l('Preciso de uma declaração de residência', 'I need proof of residence'), result: { doc: 'pedido-declaracao-residencia', why: l('Pedido ao Secretário do Bairro, que emite a declaração.', 'Request to the neighbourhood secretary, who issues it.') } },
      { id: 'viatura', label: l('Autorizar alguém a usar o meu carro', 'Allow someone to use my car'), result: { doc: 'autorizacao-uso-viatura', why: l('Autorização para conduzir e circular com a viatura.', 'Authorisation to drive the vehicle.') } },
    ],
  },
};

export const GUIDE_START = 'inicio';

/** Walks the path of option ids from the start; returns the visited nodes and the final result if reached. */
export function walk(path: string[]): { nodes: GuideNode[]; result?: GuideResult; valid: boolean } {
  const nodes: GuideNode[] = [GUIDE[GUIDE_START]];
  for (let i = 0; i < path.length; i++) {
    const node = nodes[nodes.length - 1];
    const opt = node.options.find((o) => o.id === path[i]);
    if (!opt) return { nodes, valid: false };
    if (opt.result) return { nodes, result: opt.result, valid: i === path.length - 1 };
    if (!opt.next || !GUIDE[opt.next]) return { nodes, valid: false };
    nodes.push(GUIDE[opt.next]);
  }
  return { nodes, valid: true };
}
