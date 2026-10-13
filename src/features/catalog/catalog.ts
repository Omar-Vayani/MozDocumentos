// Catalogue metadata: what documents exist, how they are found and described.
// Kept separate from the template content (src/documents/templates) so the
// home page and search do not load every template's text.

import type { L10n } from '@/documents/model';
import type { LegalRefId } from '@/legal/mz-legal';
import type { CategoryId } from './categories';
import type { SectorId } from './sectors';
import { CATALOG_ADVOCACIA } from './extra/advocacia';
import { CATALOG_SAUDE } from './extra/saude';
import { CATALOG_EDUCACAO } from './extra/educacao';
import { CATALOG_ASSOCIACOES } from './extra/associacoes';
import { CATALOG_COMUNIDADE } from './extra/comunidade';
import { CATALOG_CONSTRUCAO } from './extra/construcao';
import { CATALOG_EVENTOS } from './extra/eventos';
import { CATALOG_COMERCIO } from './extra/comercio';
import { CATALOG_CONTRATOS } from './extra/contratos';
import { CATALOG_ESTADO } from './extra/estado';
import { CATALOG_PESSOAL_RH } from './extra/pessoal-rh';
import { CATALOG_SOCIEDADES } from './extra/sociedades';

export type TemplateMeta = {
  id: string;
  category: CategoryId;
  /** Who issues it: a company, an individual, either, a lawyer, or a public body. */
  audience: 'empresa' | 'pessoa' | 'ambos' | 'advogado' | 'estado';
  phase: 'A' | 'B';
  /** Plain-language title. */
  title: L10n;
  /** Formal title as printed on the document. */
  formalTitle: string;
  /** One sentence: when to use it. */
  summary: L10n;
  /** Synonyms, common speech and English terms. */
  tags: string[];
  legalRefs: LegalRefId[];
  /** Next documents in the process. */
  related?: string[];
  /** Optional bilingual PT/EN output. */
  bilingual?: boolean;
  lastReviewed: string;
  /** Ranking hint for "most used" (higher first). */
  popularity?: number;
  /** Extra user areas this document belongs to, beyond its category's areas. */
  sectors?: SectorId[];
};

const REVIEWED = '2026-10-12';

const CORE_CATALOG: TemplateMeta[] = [
  // ------------------------------------------------------------------ Contratar
  {
    id: 'proposta-de-emprego',
    category: 'contratar',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Oferecer um emprego', en: 'Offer a job' },
    formalTitle: 'Proposta de emprego',
    summary: {
      pt: 'Para propor por escrito um posto de trabalho, salário e data de início antes de assinar o contrato.',
      en: 'To offer a position, salary and start date in writing before signing the contract.',
    },
    tags: ['oferta', 'carta de oferta', 'admissao', 'contratar', 'job offer', 'offer letter', 'recrutamento', 'vaga'],
    legalRefs: ['leiTrabalho'],
    related: ['contrato-indeterminado', 'contrato-prazo-certo', 'ficha-de-admissao'],
    lastReviewed: REVIEWED,
    popularity: 5,
  },
  {
    id: 'contrato-indeterminado',
    category: 'contratar',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Contrato de trabalho sem data de fim', en: 'Permanent employment contract' },
    formalTitle: 'Contrato de trabalho por tempo indeterminado',
    summary: {
      pt: 'Para contratar alguém de forma permanente, sem data de fim.',
      en: 'To hire someone permanently, with no end date.',
    },
    tags: ['contrato', 'efectivo', 'efetivo', 'permanente', 'contratar', 'admitir', 'employment contract', 'permanent', 'hire'],
    legalRefs: ['leiTrabalho', 'periodoProbatorioIndeterminado', 'periodoNormalTrabalho', 'feriasDireito'],
    related: ['ficha-de-admissao', 'descricao-de-funcoes', 'acordo-confidencialidade'],
    lastReviewed: REVIEWED,
    popularity: 9,
  },
  {
    id: 'contrato-prazo-certo',
    category: 'contratar',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Contrato de trabalho com data de fim', en: 'Fixed-term employment contract' },
    formalTitle: 'Contrato de trabalho a prazo certo',
    summary: {
      pt: 'Para contratar alguém por um período definido, com data de início e de fim.',
      en: 'To hire someone for a set period with a start and end date.',
    },
    tags: ['contrato a termo', 'prazo', 'temporario', 'determinado', 'fixed term', 'temporary', 'contract'],
    legalRefs: ['leiTrabalho', 'contratoPrazoCerto', 'periodoProbatorioPrazo', 'periodoNormalTrabalho'],
    related: ['ficha-de-admissao', 'nao-renovacao'],
    lastReviewed: REVIEWED,
    popularity: 8,
  },
  {
    id: 'contrato-prazo-incerto',
    category: 'contratar',
    audience: 'empresa',
    phase: 'B',
    title: { pt: 'Contrato de trabalho temporário sem data fixa', en: 'Temporary contract with no fixed end date' },
    formalTitle: 'Contrato de trabalho a prazo incerto',
    summary: {
      pt: 'Para contratar alguém até terminar uma tarefa, obra ou substituição, sem data certa de fim.',
      en: 'To hire someone until a task, project or replacement ends, with no fixed end date.',
    },
    tags: ['prazo incerto', 'substituicao', 'obra', 'projecto', 'sazonal', 'temporary', 'replacement', 'project'],
    legalRefs: ['leiTrabalho', 'contratoPrazoIncerto', 'periodoProbatorioPrazo'],
    related: ['ficha-de-admissao'],
    lastReviewed: REVIEWED,
  },
  {
    id: 'ficha-de-admissao',
    category: 'contratar',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Ficha de registo do trabalhador', en: 'Employee record form' },
    formalTitle: 'Ficha de admissão',
    summary: {
      pt: 'Para registar os dados pessoais, fiscais, bancários e o contacto de emergência de um novo trabalhador.',
      en: "To record a new employee's personal, tax, bank and emergency contact details.",
    },
    tags: ['ficha', 'cadastro', 'dados pessoais', 'nuit', 'inss', 'registo', 'onboarding', 'employee form', 'new hire'],
    legalRefs: ['leiTrabalho', 'inssTaxaTrabalhador'],
    related: ['contrato-indeterminado', 'contrato-prazo-certo'],
    lastReviewed: REVIEWED,
    popularity: 6,
  },
  {
    id: 'descricao-de-funcoes',
    category: 'contratar',
    audience: 'empresa',
    phase: 'B',
    title: { pt: 'Descrição de funções', en: 'Job description' },
    formalTitle: 'Descrição de funções',
    summary: {
      pt: 'Para descrever as tarefas, responsabilidades e requisitos de um posto de trabalho.',
      en: 'To describe the tasks, responsibilities and requirements of a position.',
    },
    tags: ['funcoes', 'cargo', 'tarefas', 'perfil', 'job description', 'role', 'responsibilities'],
    legalRefs: ['leiTrabalho'],
    related: ['contrato-indeterminado'],
    lastReviewed: REVIEWED,
  },
  {
    id: 'acordo-confidencialidade',
    category: 'contratar',
    audience: 'ambos',
    phase: 'B',
    title: { pt: 'Acordo de confidencialidade', en: 'Confidentiality agreement' },
    formalTitle: 'Acordo de confidencialidade',
    summary: {
      pt: 'Para que um trabalhador ou parceiro se comprometa a não divulgar informação da empresa.',
      en: 'For an employee or partner to agree not to disclose company information.',
    },
    tags: ['nda', 'sigilo', 'segredo', 'confidencial', 'non-disclosure', 'confidentiality'],
    legalRefs: ['leiTrabalho', 'deverSigilo'],
    lastReviewed: REVIEWED,
  },
  {
    id: 'contrato-prestacao-servicos',
    category: 'contratar',
    audience: 'ambos',
    phase: 'A',
    title: { pt: 'Contratar um prestador de serviços', en: 'Hire a contractor or freelancer' },
    formalTitle: 'Contrato de prestação de serviços',
    summary: {
      pt: 'Para contratar um freelancer, consultor ou empresa para um serviço, sem relação de trabalho subordinado.',
      en: 'To hire a freelancer, consultant or company for a service, without an employment relationship.',
    },
    tags: ['freelancer', 'consultor', 'consultoria', 'avenca', 'servicos', 'biscate', 'contractor', 'consultant', 'services'],
    legalRefs: ['codigoCivilPrestacaoServicos'],
    lastReviewed: REVIEWED,
    popularity: 6,
  },

  // ------------------------------------------------------------------ Salário
  {
    id: 'recibo-de-salario',
    category: 'salario',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Recibo de salário', en: 'Payslip' },
    formalTitle: 'Recibo de vencimento',
    summary: {
      pt: 'Para entregar ao trabalhador o detalhe do salário do mês: bruto, subsídios, descontos e líquido.',
      en: 'To give the employee the month’s pay detail: gross, allowances, deductions and net pay.',
    },
    tags: ['recibo', 'salario', 'vencimento', 'folha de salario', 'talao', 'contracheque', 'holerite', 'payslip', 'pay stub', 'salary slip', 'inss', 'irps'],
    legalRefs: ['inssTaxaTrabalhador', 'inssTaxaEmpregador', 'irpsRetencao', 'salarioMinimo'],
    lastReviewed: REVIEWED,
    popularity: 10,
  },
  {
    id: 'declaracao-de-vencimento',
    category: 'salario',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Confirmar o salário de alguém — para banco ou crédito', en: "Confirm someone's salary — for a bank or loan" },
    formalTitle: 'Declaração de vencimento',
    summary: {
      pt: 'Para declarar a um banco ou outra entidade quanto um trabalhador ganha.',
      en: 'To state to a bank or other body how much an employee earns.',
    },
    tags: ['declaracao de rendimentos', 'salario', 'credito', 'banco', 'emprestimo', 'salary certificate', 'income letter', 'loan'],
    legalRefs: ['leiTrabalho'],
    bilingual: true,
    lastReviewed: REVIEWED,
    popularity: 8,
  },
  {
    id: 'declaracao-de-trabalho',
    category: 'salario',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Confirmar que alguém trabalha aqui', en: 'Confirm someone works here' },
    formalTitle: 'Declaração de trabalho',
    summary: {
      pt: 'Para declarar que uma pessoa trabalha na empresa, desde quando e em que função.',
      en: 'To state that a person works at the company, since when and in what role.',
    },
    tags: ['declaracao de servico', 'comprovativo de emprego', 'vinculo', 'employment letter', 'proof of employment', 'visa'],
    legalRefs: ['leiTrabalho'],
    bilingual: true,
    lastReviewed: REVIEWED,
    popularity: 9,
  },
  {
    id: 'adiantamento-salarial',
    category: 'salario',
    audience: 'empresa',
    phase: 'B',
    title: { pt: 'Adiantamento de salário', en: 'Salary advance' },
    formalTitle: 'Pedido e autorização de adiantamento salarial',
    summary: {
      pt: 'Para o trabalhador pedir parte do salário antes do fim do mês e a empresa autorizar e definir o desconto.',
      en: 'For an employee to request part of their salary early and the company to approve it and set the deduction.',
    },
    tags: ['vale', 'adiantamento', 'emprestimo', 'advance', 'salary advance', 'loan'],
    legalRefs: ['leiTrabalho'],
    lastReviewed: REVIEWED,
  },
  {
    id: 'recibo-de-pagamento',
    category: 'salario',
    audience: 'ambos',
    phase: 'A',
    title: { pt: 'Recibo de pagamento', en: 'Payment receipt' },
    formalTitle: 'Recibo',
    summary: {
      pt: 'Para confirmar que recebeu um pagamento em dinheiro, transferência ou M-Pesa.',
      en: 'To confirm you received a payment in cash, by transfer or M-Pesa.',
    },
    tags: ['recibo', 'quitacao', 'pagamento', 'comprovativo', 'm-pesa', 'mpesa', 'e-mola', 'receipt', 'payment'],
    legalRefs: [],
    lastReviewed: REVIEWED,
    popularity: 7,
  },

  // ------------------------------------------------------------------ Férias
  {
    id: 'pedido-de-ferias',
    category: 'ferias',
    audience: 'ambos',
    phase: 'A',
    title: { pt: 'Pedir férias', en: 'Request annual leave' },
    formalTitle: 'Pedido de férias',
    summary: {
      pt: 'Para o trabalhador pedir à empresa o gozo de dias de férias.',
      en: 'For an employee to ask to take annual leave.',
    },
    tags: ['ferias', 'descanso', 'leave', 'vacation', 'holiday', 'annual leave'],
    legalRefs: ['feriasDireito'],
    related: ['autorizacao-de-ferias'],
    lastReviewed: REVIEWED,
    popularity: 7,
  },
  {
    id: 'autorizacao-de-ferias',
    category: 'ferias',
    audience: 'empresa',
    phase: 'B',
    title: { pt: 'Aprovar férias', en: 'Approve annual leave' },
    formalTitle: 'Autorização de férias',
    summary: {
      pt: 'Para a empresa aprovar e marcar as férias de um trabalhador.',
      en: "For the company to approve and schedule an employee's leave.",
    },
    tags: ['marcacao de ferias', 'aprovar', 'mapa de ferias', 'leave approval', 'vacation approval'],
    legalRefs: ['feriasDireito'],
    lastReviewed: REVIEWED,
  },
  {
    id: 'justificacao-de-falta',
    category: 'ferias',
    audience: 'ambos',
    phase: 'A',
    title: { pt: 'Justificar uma falta', en: 'Justify an absence' },
    formalTitle: 'Justificação de falta',
    summary: {
      pt: 'Para o trabalhador explicar por escrito o motivo de uma ausência ao trabalho.',
      en: 'For an employee to explain an absence from work in writing.',
    },
    tags: ['falta', 'ausencia', 'doenca', 'atestado', 'luto', 'absence', 'sick', 'excuse'],
    legalRefs: ['faltasJustificadas', 'faltasComunicacao'],
    lastReviewed: REVIEWED,
    popularity: 6,
  },
  {
    id: 'licenca-parental',
    category: 'ferias',
    audience: 'ambos',
    phase: 'B',
    title: { pt: 'Comunicar licença de maternidade / paternidade', en: 'Notify maternity / paternity leave' },
    formalTitle: 'Comunicação de licença de maternidade / paternidade',
    summary: {
      pt: 'Para comunicar à empresa o início e a duração da licença por nascimento de um filho.',
      en: 'To notify the employer of the start and length of leave for the birth of a child.',
    },
    tags: ['maternidade', 'paternidade', 'parto', 'gravidez', 'bebe', 'maternity', 'paternity', 'parental leave'],
    legalRefs: ['licencaMaternidade', 'licencaPaternidade'],
    lastReviewed: REVIEWED,
  },

  // ------------------------------------------------------------------ Disciplina
  {
    id: 'advertencia-escrita',
    category: 'disciplina',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Advertir por escrito', en: 'Give a written warning' },
    formalTitle: 'Repreensão registada',
    summary: {
      pt: 'Para registar por escrito uma advertência a um trabalhador por uma falta leve.',
      en: 'To record a written warning to an employee for a minor offence.',
    },
    tags: ['advertencia', 'repreensao', 'aviso', 'chamada de atencao', 'warning', 'written warning', 'reprimand'],
    legalRefs: ['sancoesDisciplinares', 'procedimentoDisciplinar'],
    lastReviewed: REVIEWED,
    popularity: 7,
  },
  {
    id: 'nota-de-culpa',
    category: 'disciplina',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Acusar formalmente de uma falta', en: 'Formally charge an employee' },
    formalTitle: 'Nota de culpa',
    summary: {
      pt: 'Primeiro passo de um processo disciplinar: descreve os factos de que o trabalhador é acusado.',
      en: 'First step of a disciplinary procedure: describes the facts the employee is charged with.',
    },
    tags: ['processo disciplinar', 'acusacao', 'despedir', 'despedimento', 'justa causa', 'mandar embora', 'infraccao', 'disciplinary charge', 'dismiss', 'fire'],
    legalRefs: ['procedimentoDisciplinar', 'notaCulpaPrazoResposta', 'prescricaoInfraccao', 'sancoesDisciplinares'],
    related: ['convocatoria-audicao', 'decisao-disciplinar', 'suspensao-preventiva'],
    lastReviewed: REVIEWED,
    popularity: 8,
  },
  {
    id: 'convocatoria-audicao',
    category: 'disciplina',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Chamar o trabalhador para ser ouvido', en: 'Call the employee to a hearing' },
    formalTitle: 'Convocatória para audição',
    summary: {
      pt: 'Para marcar a audição do trabalhador no processo disciplinar.',
      en: 'To schedule the employee’s hearing in the disciplinary procedure.',
    },
    tags: ['audiencia', 'audicao', 'convocatoria', 'reuniao disciplinar', 'hearing', 'disciplinary hearing'],
    legalRefs: ['procedimentoDisciplinar'],
    related: ['decisao-disciplinar'],
    lastReviewed: REVIEWED,
  },
  {
    id: 'resposta-nota-de-culpa',
    category: 'disciplina',
    audience: 'pessoa',
    phase: 'A',
    title: { pt: 'Responder a uma acusação — para o trabalhador', en: 'Reply to a charge — for the employee' },
    formalTitle: 'Resposta à nota de culpa',
    summary: {
      pt: 'Para o trabalhador apresentar a sua defesa por escrito a uma nota de culpa.',
      en: 'For the employee to submit a written defence to a disciplinary charge.',
    },
    tags: ['defesa', 'resposta', 'contestacao', 'nota de culpa', 'reply', 'defence', 'defense'],
    legalRefs: ['procedimentoDisciplinar', 'notaCulpaPrazoResposta'],
    lastReviewed: REVIEWED,
  },
  {
    id: 'decisao-disciplinar',
    category: 'disciplina',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Comunicar a decisão do processo', en: 'Communicate the disciplinary decision' },
    formalTitle: 'Decisão disciplinar',
    summary: {
      pt: 'Para comunicar a sanção aplicada no fim do processo disciplinar, incluindo despedimento com justa causa.',
      en: 'To communicate the sanction at the end of the procedure, including dismissal with just cause.',
    },
    tags: ['decisao', 'sancao', 'despedimento', 'justa causa', 'despedir', 'mandar embora', 'suspensao', 'dismissal', 'fire', 'termination'],
    legalRefs: ['procedimentoDisciplinar', 'sancoesDisciplinares', 'decisaoDisciplinarPrazo'],
    related: ['certificado-de-trabalho'],
    lastReviewed: REVIEWED,
    popularity: 6,
  },
  {
    id: 'suspensao-preventiva',
    category: 'disciplina',
    audience: 'empresa',
    phase: 'B',
    title: { pt: 'Suspender durante o processo', en: 'Suspend during the procedure' },
    formalTitle: 'Suspensão preventiva',
    summary: {
      pt: 'Para afastar o trabalhador do local de trabalho enquanto decorre o processo disciplinar.',
      en: 'To keep the employee away from work while the disciplinary procedure runs.',
    },
    tags: ['suspensao', 'afastamento', 'preventiva', 'suspension'],
    legalRefs: ['suspensaoPreventiva', 'procedimentoDisciplinar'],
    lastReviewed: REVIEWED,
  },

  // ------------------------------------------------------------------ Fim
  {
    id: 'rescisao-pelo-trabalhador',
    category: 'fim',
    audience: 'pessoa',
    phase: 'A',
    title: { pt: 'Sair do emprego — para o trabalhador', en: 'Resign — for the employee' },
    formalTitle: 'Carta de rescisão com aviso prévio',
    summary: {
      pt: 'Para o trabalhador comunicar que vai deixar o emprego, respeitando o aviso prévio.',
      en: 'For an employee to give notice that they are leaving, respecting the notice period.',
    },
    tags: ['rescisao', 'demissao', 'despedir-me', 'sair', 'pedido de demissao', 'resign', 'resignation', 'quit', 'notice'],
    legalRefs: ['avisoPrevioTrabalhador'],
    related: ['certificado-de-trabalho', 'declaracao-de-quitacao'],
    lastReviewed: REVIEWED,
    popularity: 8,
  },
  {
    id: 'acordo-de-revogacao',
    category: 'fim',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Terminar o contrato de comum acordo', en: 'End the contract by mutual agreement' },
    formalTitle: 'Acordo de revogação do contrato de trabalho',
    summary: {
      pt: 'Para empresa e trabalhador acordarem o fim do contrato, a data e a compensação.',
      en: 'For employer and employee to agree on ending the contract, the date and any compensation.',
    },
    tags: ['revogacao', 'mutuo acordo', 'comum acordo', 'rescisao amigavel', 'mutual agreement', 'settlement'],
    legalRefs: ['revogacaoAcordo'],
    related: ['certificado-de-trabalho', 'declaracao-de-quitacao'],
    lastReviewed: REVIEWED,
  },
  {
    id: 'nao-renovacao',
    category: 'fim',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Não renovar um contrato com data de fim', en: 'Do not renew a fixed-term contract' },
    formalTitle: 'Comunicação de não renovação do contrato',
    summary: {
      pt: 'Para avisar o trabalhador, com antecedência, de que o contrato a prazo não será renovado.',
      en: 'To give the employee advance notice that a fixed-term contract will not be renewed.',
    },
    tags: ['caducidade', 'nao renovacao', 'fim do contrato', 'termo', 'non-renewal', 'contract end', 'expiry'],
    legalRefs: ['naoRenovacaoAviso', 'contratoPrazoCerto'],
    related: ['certificado-de-trabalho'],
    lastReviewed: REVIEWED,
    popularity: 6,
  },
  {
    id: 'certificado-de-trabalho',
    category: 'fim',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Certificado de trabalho', en: 'Certificate of employment' },
    formalTitle: 'Certificado de trabalho',
    summary: {
      pt: 'Entregue ao trabalhador quando o contrato termina, com as datas e funções exercidas.',
      en: 'Given to the employee when the contract ends, with dates and roles held.',
    },
    tags: ['certificado', 'fim de contrato', 'referencia', 'experiencia', 'certificate', 'reference', 'work certificate'],
    legalRefs: ['certificadoTrabalho'],
    lastReviewed: REVIEWED,
    popularity: 7,
  },
  {
    id: 'declaracao-de-quitacao',
    category: 'fim',
    audience: 'ambos',
    phase: 'B',
    title: { pt: 'Declaração de quitação', en: 'Final settlement release' },
    formalTitle: 'Declaração de quitação',
    summary: {
      pt: 'Para o trabalhador declarar que recebeu todos os valores devidos no fim do contrato.',
      en: 'For the employee to declare they received all amounts due at the end of the contract.',
    },
    tags: ['quitacao', 'contas finais', 'acerto', 'release', 'final pay', 'settlement'],
    legalRefs: ['leiTrabalho'],
    lastReviewed: REVIEWED,
  },

  // ------------------------------------------------------------------ Pessoal
  {
    id: 'procuracao',
    category: 'pessoal',
    audience: 'pessoa',
    phase: 'A',
    title: { pt: 'Autorizar alguém a tratar por mim', en: 'Authorise someone to act for me' },
    formalTitle: 'Procuração',
    summary: {
      pt: 'Para dar poderes a outra pessoa para tratar de um assunto em seu nome.',
      en: 'To give another person powers to handle a matter on your behalf.',
    },
    tags: ['procuracao', 'autorizacao', 'representar', 'mandato', 'power of attorney', 'authorisation', 'proxy'],
    legalRefs: ['codigoCivilProcuracao', 'procuracaoForma'],
    lastReviewed: REVIEWED,
    popularity: 8,
  },
  {
    id: 'declaracao-de-rendimentos-pessoal',
    category: 'pessoal',
    audience: 'pessoa',
    phase: 'A',
    title: { pt: 'Declarar os meus rendimentos', en: 'Declare my income' },
    formalTitle: 'Declaração de rendimentos',
    summary: {
      pt: 'Para declarar, sob compromisso de honra, quanto ganha e de onde vem o rendimento.',
      en: 'To declare on your honour how much you earn and where the income comes from.',
    },
    tags: ['rendimentos', 'renda', 'ganhos', 'conta-propria', 'informal', 'income', 'proof of income', 'self-employed'],
    legalRefs: [],
    bilingual: true,
    lastReviewed: REVIEWED,
  },
  {
    id: 'compromisso-de-honra',
    category: 'pessoal',
    audience: 'pessoa',
    phase: 'A',
    title: { pt: 'Compromisso de honra', en: 'Sworn statement' },
    formalTitle: 'Declaração sob compromisso de honra',
    summary: {
      pt: 'Para declarar por escrito, sob compromisso de honra, que um facto é verdadeiro.',
      en: 'To state in writing, on your honour, that a fact is true.',
    },
    tags: ['declaracao', 'honra', 'juramento', 'afirmacao', 'sworn statement', 'affidavit', 'declaration'],
    legalRefs: [],
    lastReviewed: REVIEWED,
    popularity: 6,
  },
  {
    id: 'contrato-de-arrendamento',
    category: 'pessoal',
    audience: 'ambos',
    phase: 'A',
    title: { pt: 'Arrendar uma casa', en: 'Rent out a house' },
    formalTitle: 'Contrato de arrendamento',
    summary: {
      pt: 'Para senhorio e inquilino acordarem a renda, a caução, a duração e as regras do arrendamento.',
      en: 'For landlord and tenant to agree rent, deposit, duration and rules of the lease.',
    },
    tags: ['arrendamento', 'aluguer', 'aluguel', 'renda', 'casa', 'inquilino', 'senhorio', 'lease', 'rent', 'tenancy', 'landlord'],
    legalRefs: ['codigoCivilArrendamento', 'impostoSeloArrendamento'],
    related: ['recibo-de-renda'],
    lastReviewed: REVIEWED,
    popularity: 7,
  },
  {
    id: 'recibo-de-renda',
    category: 'pessoal',
    audience: 'ambos',
    phase: 'A',
    title: { pt: 'Recibo de renda', en: 'Rent receipt' },
    formalTitle: 'Recibo de renda',
    summary: {
      pt: 'Para o senhorio confirmar que recebeu a renda de um mês.',
      en: 'For a landlord to confirm receipt of a month’s rent.',
    },
    tags: ['renda', 'aluguer', 'recibo', 'rent receipt', 'landlord'],
    legalRefs: ['codigoCivilArrendamento'],
    lastReviewed: REVIEWED,
    popularity: 5,
  },
  {
    id: 'declaracao-de-venda',
    category: 'pessoal',
    audience: 'ambos',
    phase: 'B',
    title: { pt: 'Vender um bem, por ex. um carro', en: 'Sell an item, e.g. a car' },
    formalTitle: 'Declaração de venda',
    summary: {
      pt: 'Para registar a venda de um bem (viatura, mota, equipamento) entre vendedor e comprador.',
      en: 'To record the sale of an item (vehicle, motorbike, equipment) between seller and buyer.',
    },
    tags: ['venda', 'compra', 'carro', 'viatura', 'mota', 'bill of sale', 'sale', 'vehicle'],
    legalRefs: ['codigoCivilCompraVenda'],
    lastReviewed: REVIEWED,
  },
  {
    id: 'requerimento',
    category: 'pessoal',
    audience: 'ambos',
    phase: 'A',
    title: { pt: 'Pedir algo a uma instituição pública', en: 'Make a request to a public body' },
    formalTitle: 'Requerimento',
    summary: {
      pt: 'Para fazer um pedido formal a um ministério, município, escola ou outra instituição pública.',
      en: 'To make a formal request to a ministry, municipality, school or other public body.',
    },
    tags: ['requerimento', 'pedido', 'solicitar', 'municipio', 'ministerio', 'escola', 'application', 'petition', 'request'],
    legalRefs: ['requerimentoConteudo'],
    lastReviewed: REVIEWED,
    popularity: 7,
  },
  {
    id: 'carta-de-reclamacao',
    category: 'pessoal',
    audience: 'ambos',
    phase: 'B',
    title: { pt: 'Fazer uma reclamação', en: 'Make a complaint' },
    formalTitle: 'Carta de reclamação',
    summary: {
      pt: 'Para reclamar por escrito de um produto, serviço ou cobrança e pedir uma solução.',
      en: 'To complain in writing about a product, service or charge and ask for a remedy.',
    },
    tags: ['reclamacao', 'queixa', 'consumidor', 'complaint', 'consumer'],
    legalRefs: ['consumidorDefeito'],
    lastReviewed: REVIEWED,
  },
  {
    id: 'declaracao-de-divida',
    category: 'pessoal',
    audience: 'ambos',
    phase: 'B',
    title: { pt: 'Reconhecer uma dívida', en: 'Acknowledge a debt' },
    formalTitle: 'Declaração de dívida e acordo de pagamento',
    summary: {
      pt: 'Para o devedor reconhecer o valor em dívida e acordar um plano de pagamento.',
      en: 'For the debtor to acknowledge the amount owed and agree a payment plan.',
    },
    tags: ['divida', 'emprestimo', 'prestacoes', 'confissao de divida', 'debt', 'iou', 'payment plan', 'loan'],
    legalRefs: ['codigoCivilReconhecimentoDivida', 'codigoCivilPrestacoes'],
    lastReviewed: REVIEWED,
  },

  // ------------------------------------------------------------------ Empresa
  {
    id: 'credencial',
    category: 'empresa',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Autorizar um funcionário a representar a empresa', en: 'Authorise an employee to represent the company' },
    formalTitle: 'Credencial',
    summary: {
      pt: 'Para credenciar um funcionário a tratar de um assunto da empresa junto de uma entidade.',
      en: 'To authorise an employee to handle a company matter with another body.',
    },
    tags: ['credencial', 'autorizacao', 'representar', 'levantar', 'credentials', 'authorisation letter'],
    legalRefs: [],
    bilingual: true,
    lastReviewed: REVIEWED,
    popularity: 7,
  },
  {
    id: 'acta',
    category: 'empresa',
    audience: 'empresa',
    phase: 'B',
    title: { pt: 'Acta de reunião ou assembleia', en: 'Meeting minutes' },
    formalTitle: 'Acta',
    summary: {
      pt: 'Para registar o que foi discutido e deliberado numa reunião ou assembleia geral.',
      en: 'To record what was discussed and decided at a meeting or general assembly.',
    },
    tags: ['acta', 'ata', 'assembleia', 'reuniao', 'deliberacao', 'socios', 'minutes', 'meeting', 'resolution'],
    legalRefs: ['actaConteudo'],
    lastReviewed: REVIEWED,
  },
  {
    id: 'carta-oficial',
    category: 'empresa',
    audience: 'ambos',
    phase: 'A',
    title: { pt: 'Carta oficial em branco', en: 'Blank official letter' },
    formalTitle: 'Ofício',
    summary: {
      pt: 'Uma carta formal com o seu papel timbrado, para escrever o que precisar.',
      en: 'A formal letter on your letterhead, to write whatever you need.',
    },
    tags: ['carta', 'oficio', 'comunicacao', 'papel timbrado', 'letter', 'official letter', 'letterhead'],
    legalRefs: [],
    lastReviewed: REVIEWED,
    popularity: 8,
  },
  {
    id: 'orcamento',
    category: 'empresa',
    audience: 'empresa',
    phase: 'B',
    title: { pt: 'Orçamento ou cotação', en: 'Quote' },
    formalTitle: 'Orçamento',
    summary: {
      pt: 'Para apresentar preços a um cliente. Não é uma factura.',
      en: 'To give prices to a customer. It is not a tax invoice.',
    },
    tags: ['orcamento', 'cotacao', 'proforma', 'preco', 'quote', 'quotation', 'estimate'],
    legalRefs: [],
    lastReviewed: REVIEWED,
    popularity: 6,
  },

  // ------------------------------------------------------------------ Novos (v1.1)
  {
    id: 'folha-de-salarios',
    category: 'salario',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Folha de salários do mês', en: 'Monthly payroll sheet' },
    formalTitle: 'Folha de remunerações',
    summary: {
      pt: 'Para listar os salários de todos os trabalhadores do mês, com INSS, IRPS e totais a pagar.',
      en: 'To list the month’s pay for all employees, with INSS, IRPS and totals to pay.',
    },
    tags: ['folha de salarios', 'mapa de salarios', 'payroll', 'processamento salarial', 'inss', 'irps', 'contribuicoes', 'remuneracoes', 'salary sheet'],
    legalRefs: ['inssTaxaTrabalhador', 'inssTaxaEmpregador', 'irpsRetencao'],
    related: ['recibo-de-salario'],
    lastReviewed: REVIEWED,
    popularity: 7,
  },
  {
    id: 'mapa-de-ferias',
    category: 'ferias',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Plano de férias da equipa', en: 'Team leave schedule' },
    formalTitle: 'Mapa de férias',
    summary: {
      pt: 'Para planear e afixar as férias de todos os trabalhadores no ano.',
      en: 'To plan and publish every employee’s annual leave for the year.',
    },
    tags: ['mapa de ferias', 'plano de ferias', 'calendario', 'escala', 'leave schedule', 'vacation plan'],
    legalRefs: ['feriasDireito'],
    related: ['autorizacao-de-ferias'],
    lastReviewed: REVIEWED,
  },
  {
    id: 'contrato-trabalho-domestico',
    category: 'contratar',
    audience: 'pessoa',
    phase: 'A',
    title: { pt: 'Contratar uma empregada ou empregado doméstico', en: 'Hire a domestic worker' },
    formalTitle: 'Contrato de trabalho doméstico',
    summary: {
      pt: 'Para quem contrata alguém para trabalhar em casa: limpeza, cozinha, cuidar de crianças, jardim ou guarda.',
      en: 'For hiring someone to work in your home: cleaning, cooking, childcare, gardening or guarding.',
    },
    tags: ['empregada domestica', 'empregado domestico', 'mainato', 'baba', 'ama', 'jardineiro', 'guarda', 'cozinheira', 'domestic worker', 'maid', 'nanny', 'housekeeper'],
    legalRefs: ['trabalhoDomestico', 'leiTrabalho'],
    lastReviewed: REVIEWED,
    popularity: 7,
  },
  {
    id: 'termo-de-entrega',
    category: 'empresa',
    audience: 'ambos',
    phase: 'A',
    title: { pt: 'Entregar equipamento a alguém', en: 'Hand over equipment' },
    formalTitle: 'Termo de entrega e responsabilidade',
    summary: {
      pt: 'Para registar a entrega de equipamento (telemóvel, computador, viatura, fardamento) e quem fica responsável por ele.',
      en: 'To record handing over equipment (phone, laptop, vehicle, uniform) and who is responsible for it.',
    },
    tags: ['termo de entrega', 'responsabilidade', 'equipamento', 'computador', 'telemovel', 'viatura', 'fardamento', 'devolucao', 'handover', 'equipment', 'custody'],
    legalRefs: [],
    lastReviewed: REVIEWED,
  },
  {
    id: 'comunicado-interno',
    category: 'empresa',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Avisar todos os trabalhadores', en: 'Notify all staff' },
    formalTitle: 'Comunicado interno',
    summary: {
      pt: 'Para informar a equipa de horários, regras, feriados, encerramentos ou mudanças na empresa.',
      en: 'To inform staff about hours, rules, holidays, closures or changes at the company.',
    },
    tags: ['comunicado', 'aviso', 'circular', 'memorando', 'informacao', 'notice', 'memo', 'announcement', 'staff notice'],
    legalRefs: [],
    lastReviewed: REVIEWED,
  },
  {
    id: 'convocatoria-assembleia',
    category: 'empresa',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Convocar os sócios para uma assembleia', en: 'Call a shareholders’ meeting' },
    formalTitle: 'Convocatória para assembleia geral',
    summary: {
      pt: 'Para convocar os sócios ou membros para uma assembleia geral, com data, local e ordem de trabalhos.',
      en: 'To call shareholders or members to a general meeting, with date, place and agenda.',
    },
    tags: ['convocatoria', 'assembleia geral', 'socios', 'reuniao', 'ordem de trabalhos', 'notice of meeting', 'agm', 'shareholders'],
    legalRefs: [],
    related: ['acta'],
    lastReviewed: REVIEWED,
  },
  {
    id: 'carta-de-recomendacao',
    category: 'fim',
    audience: 'ambos',
    phase: 'A',
    title: { pt: 'Recomendar um antigo trabalhador', en: 'Recommend a former employee' },
    formalTitle: 'Carta de recomendação',
    summary: {
      pt: 'Para recomendar um trabalhador ou colaborador a outra empresa, escola ou entidade.',
      en: 'To recommend an employee or colleague to another company, school or body.',
    },
    tags: ['recomendacao', 'referencia', 'carta de referencia', 'recommendation', 'reference letter'],
    legalRefs: [],
    related: ['certificado-de-trabalho'],
    lastReviewed: REVIEWED,
  },
  {
    id: 'carta-de-candidatura',
    category: 'pessoal',
    audience: 'pessoa',
    phase: 'A',
    title: { pt: 'Candidatar-me a um emprego', en: 'Apply for a job' },
    formalTitle: 'Carta de candidatura',
    summary: {
      pt: 'Para apresentar a sua candidatura a uma vaga ou enviar uma candidatura espontânea.',
      en: 'To apply for a vacancy or send an unsolicited application.',
    },
    tags: ['candidatura', 'pedido de emprego', 'carta de apresentacao', 'vaga', 'emprego', 'cover letter', 'job application'],
    legalRefs: [],
    lastReviewed: REVIEWED,
    popularity: 6,
  },
  {
    id: 'carta-de-cobranca',
    category: 'empresa',
    audience: 'ambos',
    phase: 'A',
    title: { pt: 'Cobrar um valor em atraso', en: 'Chase an overdue payment' },
    formalTitle: 'Carta de interpelação para pagamento',
    summary: {
      pt: 'Para pedir formalmente a um cliente ou devedor que pague um valor em atraso até uma data.',
      en: 'To formally ask a client or debtor to pay an overdue amount by a date.',
    },
    tags: ['cobranca', 'interpelacao', 'divida', 'pagamento em atraso', 'aviso de pagamento', 'payment reminder', 'debt collection', 'overdue'],
    legalRefs: ['codigoCivilMora'],
    related: ['declaracao-de-divida'],
    lastReviewed: REVIEWED,
  },
  // ------------------------------------------------------------------ Eventos e pessoal
  {
    id: 'cartao-de-visita',
    category: 'eventos',
    audience: 'ambos',
    phase: 'A',
    title: { pt: 'Cartões de visita', en: 'Business cards' },
    formalTitle: 'Cartão de visita',
    summary: {
      pt: 'Cartões de 85 × 55 mm, dez por folha A4, com marcas de corte.',
      en: '85 × 55 mm cards, ten per A4 sheet, with cutting marks.',
    },
    tags: ['cartao de visita', 'cartao', 'contactos', 'business card', 'visiting card', 'cartoes'],
    legalRefs: [],
    sectors: ['empresa', 'particular', 'advocacia', 'saude', 'construcao', 'educacao', 'associacoes'],
    lastReviewed: '2026-10-13',
  },
  {
    id: 'certificado-de-participacao',
    category: 'eventos',
    audience: 'ambos',
    phase: 'A',
    title: { pt: 'Certificado de participação ou mérito', en: 'Certificate of attendance or merit' },
    formalTitle: 'Certificado de Participação',
    summary: {
      pt: 'Certificado em A4 horizontal, com moldura, para cursos, workshops, seminários e reconhecimentos.',
      en: 'Framed landscape certificate for courses, workshops, seminars and awards.',
    },
    tags: ['certificado', 'diploma', 'participacao', 'workshop', 'formacao', 'merito', 'certificate', 'attendance', 'award'],
    legalRefs: [],
    sectors: ['empresa', 'educacao', 'associacoes', 'saude', 'estado'],
    lastReviewed: '2026-10-13',
  },
];

/** Every document: core list plus per-category files in ./extra. */
export const CATALOG: TemplateMeta[] = [
  ...CORE_CATALOG,
  ...CATALOG_CONTRATOS,
  ...CATALOG_SOCIEDADES,
  ...CATALOG_ADVOCACIA,
  ...CATALOG_ESTADO,
  ...CATALOG_PESSOAL_RH,
  ...CATALOG_SAUDE,
  ...CATALOG_EDUCACAO,
  ...CATALOG_ASSOCIACOES,
  ...CATALOG_COMUNIDADE,
  ...CATALOG_CONSTRUCAO,
  ...CATALOG_EVENTOS,
  ...CATALOG_COMERCIO,
];

export const catalogById = new Map(CATALOG.map((m) => [m.id, m]));

export function popularDocuments(n = 6): TemplateMeta[] {
  return [...CATALOG].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)).slice(0, n);
}

export function getMeta(id: string): TemplateMeta | undefined {
  return catalogById.get(id);
}

/** Documents only an authority can issue — the app links to the issuer instead. */
export const OUT_OF_SCOPE: { title: L10n; issuer: L10n; url?: string }[] = [
  {
    title: { pt: 'Bilhete de Identidade (BI)', en: 'Identity card (BI)' },
    issuer: { pt: 'Direcção Nacional de Identificação Civil — Ministério do Interior', en: 'National Directorate of Civil Identification — Ministry of the Interior' },
    url: 'https://www.mint.gov.mz',
  },
  {
    title: { pt: 'NUIT e certidões fiscais', en: 'NUIT and tax certificates' },
    issuer: { pt: 'Autoridade Tributária de Moçambique', en: 'Mozambique Tax Authority' },
    url: 'https://www.at.gov.mz',
  },
  {
    title: { pt: 'Formulários e declarações do INSS', en: 'INSS forms and statements' },
    issuer: { pt: 'Instituto Nacional de Segurança Social', en: 'National Social Security Institute' },
    url: 'https://www.inss.gov.mz',
  },
  {
    title: { pt: 'Facturas e documentos fiscais', en: 'Invoices and tax documents' },
    issuer: { pt: 'Regras da Autoridade Tributária de Moçambique', en: 'Mozambique Tax Authority rules' },
    url: 'https://www.at.gov.mz',
  },
  {
    title: { pt: 'Certidões de nascimento, casamento e registo', en: 'Birth, marriage and registry certificates' },
    issuer: { pt: 'Conservatórias do Registo Civil — Ministério da Justiça', en: 'Civil Registry Offices — Ministry of Justice' },
  },
  {
    title: { pt: 'Declaração de residência', en: 'Proof of residence' },
    issuer: { pt: 'Secretaria do bairro / Posto Administrativo da sua área', en: 'Neighbourhood secretary / local administrative post' },
  },
];
