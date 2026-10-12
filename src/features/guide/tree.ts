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
      { id: 'outro', label: l('Outro assunto da empresa', 'Other company matter'), next: 'empresa-outro' },
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
  'pessoa-outro': {
    id: 'pessoa-outro',
    question: l('O que precisa?', 'What do you need?'),
    options: [
      { id: 'reclamar', label: l('Reclamar de um produto ou serviço', 'Complain about a product or service'), result: { doc: 'carta-de-reclamacao', why: l('Expõe o problema e pede uma solução com prazo.', 'Sets out the problem and asks for a remedy with a deadline.') } },
      { id: 'declarar', label: l('Declarar que algo é verdade', 'Declare that something is true'), result: { doc: 'compromisso-de-honra', why: l('Uma declaração sob compromisso de honra.', 'A sworn statement on your honour.') } },
      { id: 'carta', label: l('Escrever uma carta formal', 'Write a formal letter'), result: { doc: 'carta-oficial', why: l('Uma carta formal com destinatário e assunto.', 'A formal letter with addressee and subject.') } },
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
