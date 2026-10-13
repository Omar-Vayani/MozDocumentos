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
      { id: 'outro', label: l('Outro assunto da empresa', 'Other company matter'), next: 'empresa-outro' },
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
      { id: 'familia', label: l('Família e viagens', 'Family and travel'), hint: l('Menores, união de facto, cônjuge, convites.', 'Children, partnerships, spouse, invitations.'), next: 'pessoa-familia' },
      { id: 'autorizar', label: l('Autorizar alguém a tratar por mim', 'Authorise someone to act for me'), result: { doc: 'procuracao', why: l('A procuração dá poderes a outra pessoa para agir em seu nome.', 'A power of attorney lets another person act on your behalf.') } },
      { id: 'instituicao', label: l('Fazer um pedido a uma instituição pública', 'Make a request to a public body'), result: { doc: 'requerimento', why: l('O requerimento é a forma habitual de pedir algo a um serviço público.', 'The standard way to ask a public office for something.') } },
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
      { id: 'recibo', label: l('Um recibo de renda', 'A rent receipt'), result: { doc: 'recibo-de-renda', why: l('Confirma o pagamento da renda de um mês.', 'Confirms payment of a month’s rent.') } },
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
