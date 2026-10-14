// Shared building blocks for the employment-contract templates
// (indeterminado, prazo certo, prazo incerto) and small text helpers.

import { LAWS, MINIMUM_WAGES_2026, type LegalRefId, type MinimumWage } from '@/legal/mz-legal';
import { inteiroPorExtenso, MAX_EXTENSO, numeroPorExtenso } from '@/lib/format';
import { type Block, type ClauseItem, type FieldDef, type SectionDef, type TemplateContext, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, employerParty, employerSignature, FORMA_PAGAMENTO_OPTIONS, formatMoney, isF, l, lineItems, localField, money, placeDate, refField, splitLines, workerFields, workerParty, workerSignature } from './_shared';

// ---------------------------------------------------------------- Text helpers (shared)

export const num = (x: unknown): number | null => {
  if (x === '' || x == null || typeof x === 'boolean') return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
};

/** "12 (doze)"; feminine forms for nouns such as "horas" ("2 (duas)"). */
export function nExt(n: number, fem = false): string {
  if (!Number.isInteger(n) || n < 0 || n > 999_999) return String(n);
  let w = inteiroPorExtenso(n);
  if (fem) w = w.replace(/\bum\b/g, 'uma').replace(/\bdois\b/g, 'duas').replace(/entos\b/g, 'entas');
  return `${n} (${w})`;
}

/** "1 (um) mês" / "3 (três) meses". */
export const qty = (n: number, sing: string, plural: string, fem = false) => `${nExt(n, fem)} ${n === 1 ? sing : plural}`;

/** "15.000,00 MT (quinze mil meticais)" */
export function moneyExt(value: unknown): string {
  const n = money(value);
  if (n == null) return formatMoney(null);
  const ext = n >= 0 && n <= MAX_EXTENSO ? ` (${numeroPorExtenso(n)})` : '';
  return `${formatMoney(n)}${ext}`;
}

/** "do art. 48.º da Lei n.º 13/2023" or "dos arts. 41.º, 43.º e 44.º da Lei n.º 13/2023". */
export const doCite = (id: LegalRefId) => {
  const c = cite(id);
  return c.startsWith('arts.') ? `dos ${c}` : `do ${c}`;
};

/** "no art. 46.º da Lei n.º 13/2023" or "nos arts. …". */
export const noCite = (id: LegalRefId) => {
  const c = cite(id);
  return c.startsWith('arts.') ? `nos ${c}` : `no ${c}`;
};

/** "Lei n.º 13/2023, de 25 de Agosto (Lei do Trabalho)" */
export const LEI_TRABALHO = `${LAWS.lei13_2023.title.split(' — ')[0]} (Lei do Trabalho)`;

/** Adds ";" to each item and "." to the last. */
export function enumerate(items: string[]): string[] {
  const clean = items.map((s) => s.trim().replace(/[.;,:]+$/, '')).filter(Boolean);
  return clean.map((s, i) => `${s.charAt(0).toLowerCase()}${s.slice(1)}${i === clean.length - 1 ? '.' : ';'}`);
}

/** "dever de pontualidade; dever de lealdade e dever de zelo" from a textarea with one item per line (or separated by ";"). */
export function listaTexto(x: unknown): string {
  const items = String(x ?? '')
    .split(/\n+|;\s*/)
    .map((d) => d.trim().replace(/[.;,]+$/, ''))
    .filter(Boolean)
    .map((d) => (/^[A-ZÀ-Ý][a-zà-ÿ]/.test(d) ? d.charAt(0).toLowerCase() + d.slice(1) : d));
  return items.length > 1 ? `${items.slice(0, -1).join('; ')} e ${items[items.length - 1]}` : items[0] ?? '';
}

/**
 * Refusal of receipt confirmed by two witnesses, as a compact dashed box under the
 * acknowledgement (two signature lines on one row), so it never fills a page of its own.
 */
export function recusaBox(text: string, segunda = 'Testemunha'): Block {
  return {
    type: 'box',
    label: 'Recusa de recepção',
    dashed: true,
    text: `${text}\n\nTestemunha: ____________________${'\u00a0'.repeat(4)}${segunda}: ____________________`,
  };
}

/** Lowercases the first letter of user text inserted mid-sentence. */
export const lc = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** Gendered references to the worker inside clauses. */
export function wk(genero: unknown) {
  const f = isF(genero);
  return {
    f,
    T: f ? 'Trabalhadora' : 'Trabalhador',
    o: f ? 'a Trabalhadora' : 'o Trabalhador',
    O: f ? 'A Trabalhadora' : 'O Trabalhador',
    ao: f ? 'à Trabalhadora' : 'ao Trabalhador',
    do: f ? 'da Trabalhadora' : 'do Trabalhador',
    pelo: f ? 'pela Trabalhadora' : 'pelo Trabalhador',
    a: (m: string, fem: string) => (f ? fem : m),
  };
}

function formaPagamentoTexto(forma: unknown, genero: unknown): string {
  const w = wk(genero);
  switch (forma) {
    case 'numerário':
      return 'em numerário';
    case 'cheque':
      return 'por cheque';
    case 'M-Pesa':
    case 'e-Mola':
    case 'mKesh':
      return `através de ${forma}, para o número indicado ${w.pelo}`;
    default:
      return `por transferência bancária para a conta indicada ${w.pelo}`;
  }
}

// ---------------------------------------------------------------- Fields (shared)

export const CONTRATO_SECTIONS: Record<string, SectionDef> = {
  documento: { id: 'documento', title: l('Documento', 'Document') },
  trabalhador: { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
  funcoes: { id: 'funcoes', title: l('Funções e local de trabalho', 'Duties and workplace') },
  horario: { id: 'horario', title: l('Período normal de trabalho', 'Working hours') },
  remuneracao: { id: 'remuneracao', title: l('Remuneração', 'Pay') },
  clausulas: { id: 'clausulas', title: l('Cláusulas opcionais', 'Optional clauses') },
};

export function documentoFields(): FieldDef[] {
  return [refField(), localField(), dateField('data', 'documento', l('Data de assinatura', 'Signing date'))];
}

export function contratoWorkerFields(): FieldDef[] {
  return workerFields([
    'nome', 'genero', 'cargo', 'categoria', 'departamento', 'estadoCivil', 'nacionalidade',
    'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'inss', 'morada',
  ]).map((f) => {
    if (f.name === 'trabalhadorCargo') return { ...f, required: true, label: l('Cargo / funções', 'Position') };
    if (f.name === 'trabalhadorCategoria') {
      return {
        ...f,
        legal: l(
          'O contrato deve indicar a categoria profissional e as tarefas acordadas. Se a empresa não tiver tabela de categorias, repita o cargo.',
          'The contract must state the job grade and agreed duties. If the company has no grading table, repeat the position.',
        ),
      };
    }
    if (f.name === 'trabalhadorDocNumero') {
      return { ...f, help: l('Identifica o trabalhador como parte do contrato.', 'Identifies the employee as a party to the contract.') };
    }
    return f;
  });
}

export function funcoesFields(): FieldDef[] {
  return [
    {
      name: 'funcoes',
      type: 'textarea',
      section: 'funcoes',
      rows: 5,
      label: l('Principais tarefas (opcional)', 'Main duties (optional)'),
      help: l('Uma tarefa por linha. Aparecem como lista na cláusula do objecto.', 'One duty per line. Listed in the subject-matter clause.'),
      placeholder: l('Ex.: Elaborar os relatórios mensais de vendas', 'E.g. Prepare monthly sales reports'),
    },
    {
      name: 'localTrabalho',
      type: 'text',
      section: 'funcoes',
      required: true,
      label: l('Local de trabalho', 'Workplace'),
      placeholder: l('Ex.: Sede da empresa, Avenida Julius Nyerere, Maputo', 'E.g. Head office, Avenida Julius Nyerere, Maputo'),
    },
    {
      name: 'deslocacoes',
      type: 'toggle',
      section: 'funcoes',
      default: true,
      label: l('Prever deslocações em serviço', 'Provide for business travel'),
      help: l('As despesas de deslocação ficam a cargo da empresa.', 'Travel expenses are paid by the company.'),
    },
  ];
}

export function startDateField(section: string, label = l('Data de início do contrato', 'Contract start date')): FieldDef {
  const [f] = workerFields(['dataAdmissao'], section);
  return { ...f, label, required: true, default: (c) => c.today };
}

export function horarioFields(): FieldDef[] {
  return [
    {
      name: 'horasDia',
      type: 'number',
      section: 'horario',
      width: 'half',
      min: 1,
      max: 24,
      computedKey: 'horasDiaMax',
      label: l('Horas por dia', 'Hours per day'),
      help: l('Por defeito, o máximo legal.', 'Defaults to the legal maximum.'),
    },
    {
      name: 'horasSemana',
      type: 'number',
      section: 'horario',
      width: 'half',
      min: 1,
      max: 168,
      computedKey: 'horasSemanaMax',
      label: l('Horas por semana', 'Hours per week'),
      help: l('Por defeito, o máximo legal.', 'Defaults to the legal maximum.'),
    },
    {
      name: 'horario',
      type: 'text',
      section: 'horario',
      label: l('Horário (opcional)', 'Schedule (optional)'),
      placeholder: l('Ex.: de segunda a sexta-feira, das 7h30 às 16h30, com intervalo para almoço', 'E.g. Monday to Friday, 7:30 to 16:30, with a lunch break'),
    },
  ];
}

export function remuneracaoFields(): FieldDef[] {
  const [salario] = workerFields(['salario'], 'remuneracao');
  return [
    { ...salario, required: true, label: l('Salário base mensal (ilíquido)', 'Monthly base salary (gross)') },
    {
      name: 'sector',
      type: 'select',
      section: 'remuneracao',
      width: 'half',
      label: l('Sector (salário mínimo)', 'Sector (minimum wage)'),
      help: l('Para verificar se o salário respeita o salário mínimo do sector.', 'Checks the salary against the sector minimum wage.'),
      options: [{ value: '', label: l('Não verificar', 'Do not check') }, ...MINIMUM_WAGES_2026.map((w) => ({ value: w.sector, label: l(w.sector, w.sector) }))],
      default: '',
    },
    {
      name: 'subsidios',
      type: 'lines',
      section: 'remuneracao',
      label: l('Subsídios', 'Allowances'),
      addLabel: l('Adicionar subsídio', 'Add allowance'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description'), placeholder: l('Ex.: Subsídio de transporte', 'E.g. Transport allowance') },
        { name: 'valor', type: 'money', label: l('Valor mensal', 'Monthly amount') },
      ],
      default: [],
    },
    {
      name: 'formaPagamento',
      type: 'select',
      section: 'remuneracao',
      width: 'half',
      label: l('Forma de pagamento', 'Payment method'),
      options: FORMA_PAGAMENTO_OPTIONS,
      default: 'transferência bancária',
    },
    {
      name: 'diaPagamento',
      type: 'text',
      section: 'remuneracao',
      width: 'half',
      label: l('Data de pagamento', 'Pay day'),
      default: 'até ao último dia útil do mês a que respeita',
      placeholder: l('Ex.: até ao dia 25 de cada mês', 'E.g. by the 25th of each month'),
    },
  ];
}

export function opcionaisFields(): FieldDef[] {
  return [
    {
      name: 'sigilo',
      type: 'toggle',
      section: 'clausulas',
      default: true,
      label: l('Cláusula de sigilo', 'Confidentiality clause'),
      help: l('O trabalhador não pode divulgar informação da empresa, mesmo depois de sair.', 'The employee may not disclose company information, even after leaving.'),
    },
    {
      name: 'exclusividade',
      type: 'toggle',
      section: 'clausulas',
      default: false,
      label: l('Cláusula de exclusividade', 'Exclusivity clause'),
      help: l('O trabalhador não pode exercer actividade concorrente sem autorização escrita.', 'The employee may not carry out competing work without written consent.'),
    },
    {
      name: 'regulamentoInterno',
      type: 'toggle',
      section: 'clausulas',
      default: false,
      label: l('A empresa tem regulamento interno', 'The company has internal regulations'),
      help: l(
        'O contrato refere o regulamento interno e o trabalhador declara conhecê-lo. Assim, presume-se que adere a ele.',
        'The contract mentions the internal regulations and the employee confirms knowing them, so they are presumed to accept them.',
      ),
    },
  ];
}

// ---------------------------------------------------------------- Computed (shared)

export function horasComputed(v: Values, ctx: Pick<TemplateContext, 'legal'>) {
  const pnt = ctx.legal.value<{ horasDia: number; horasSemana: number }>('periodoNormalTrabalho');
  return {
    horasDiaMax: pnt.horasDia,
    horasSemanaMax: pnt.horasSemana,
    horasDia: num(v.horasDia) ?? pnt.horasDia,
    horasSemana: num(v.horasSemana) ?? pnt.horasSemana,
  };
}

// ---------------------------------------------------------------- Clauses (shared)

export type Modalidade = 'indeterminado' | 'certo' | 'incerto';

const MODALIDADE: Record<Modalidade, { pt: string; en: string }> = {
  indeterminado: { pt: 'por tempo indeterminado', en: 'for an indefinite period' },
  certo: { pt: 'a prazo certo', en: 'for a fixed term' },
  incerto: { pt: 'a prazo incerto', en: 'for an uncertain term' },
};

export function clObjecto(v: Values, modalidade: Modalidade): ClauseItem {
  const w = wk(v.trabalhadorGenero);
  const cargo = v.trabalhadorCargo ? `**${String(v.trabalhadorCargo).trim()}**` : BLANK;
  const cat = v.trabalhadorCategoria ? `, com a categoria profissional de ${String(v.trabalhadorCategoria).trim()}` : '';
  const dep = v.trabalhadorDepartamento ? ` (${String(v.trabalhadorDepartamento).trim()})` : '';
  const funcoes = splitLines(v.funcoes);
  const lines = [
    `1. Pelo presente contrato, a Entidade Empregadora admite ao seu serviço, ${MODALIDADE[modalidade].pt}, ${w.o}, que aceita, para exercer as funções de ${cargo}${cat}${dep}, sob a autoridade e direcção daquela.`,
    `2. ${w.O} obriga-se a desempenhar as funções inerentes à sua categoria profissional, bem como as actividades afins ou funcionalmente ligadas para as quais possua qualificação adequada e que não impliquem desvalorização profissional.`,
  ];
  if (funcoes.length) lines.push(`3. Compete, em especial, ${w.ao}:`);
  return {
    id: 'objecto',
    heading: 'Objecto',
    text: lines.join('\n'),
    items: funcoes.length ? enumerate(funcoes) : undefined,
    en: `1. The Employer hires the Employee ${MODALIDADE[modalidade].en} as ${v.trabalhadorCargo || '—'}, under the Employer’s authority and direction. 2. The Employee shall perform the duties of the job grade and related tasks for which he or she is qualified.${funcoes.length ? ' 3. The main duties are listed below.' : ''}`,
  };
}

export function clLocal(v: Values): ClauseItem {
  const w = wk(v.trabalhadorGenero);
  const lines = [`1. ${w.O} prestará a sua actividade no seguinte local de trabalho: **${v.localTrabalho ? String(v.localTrabalho).trim().replace(/\.$/, '') : BLANK}**.`];
  if (v.deslocacoes) {
    lines.push(
      `2. ${w.O} pode ser ${w.a('chamado', 'chamada')} a efectuar deslocações em serviço, sendo as respectivas despesas de transporte, alojamento e alimentação suportadas pela Entidade Empregadora.`,
    );
  }
  return {
    id: 'local',
    heading: 'Local de trabalho',
    text: v.deslocacoes ? lines.join('\n') : lines[0].replace(/^1\. /, ''),
    en: `The Employee will work at: ${v.localTrabalho || '—'}.${v.deslocacoes ? ' The Employee may be required to travel on business; travel, accommodation and meal expenses are paid by the Employer.' : ''}`,
  };
}

export function clHorario(v: Values, c: Record<string, any>): ClauseItem {
  const w = wk(v.trabalhadorGenero);
  const horario = v.horario ? `, ${lc(String(v.horario).trim().replace(/\.$/, ''))}` : '';
  return {
    id: 'horario',
    heading: 'Período normal de trabalho',
    text: [
      `1. ${w.O} cumprirá um período normal de trabalho de ${qty(c.horasDia, 'hora', 'horas', true)} diárias e ${qty(c.horasSemana, 'hora', 'horas', true)} semanais${horario}, nos termos ${doCite('periodoNormalTrabalho')}.`,
      `2. O horário de trabalho pode ser alterado pela Entidade Empregadora, dentro dos limites legais, mediante comunicação prévia ${w.ao}.`,
      '3. O trabalho extraordinário só pode ser prestado nos casos e dentro dos limites previstos na lei e é remunerado nos termos da Lei do Trabalho.',
    ].join('\n'),
    en: `1. Normal working hours are ${c.horasDia} hours a day and ${c.horasSemana} hours a week${v.horario ? `, ${v.horario}` : ''}. 2. The Employer may change the schedule within legal limits, with prior notice. 3. Overtime only in the cases and limits set by law, paid under the Labour Law.`,
  };
}

export function clRemuneracao(v: Values): ClauseItem {
  const w = wk(v.trabalhadorGenero);
  const subs = lineItems(v.subsidios).filter((s) => s.descricao || money(s.valor) != null);
  const lines = [
    `1. Como contrapartida do trabalho prestado, a Entidade Empregadora pagará ${w.ao} a remuneração base mensal ilíquida de **${moneyExt(v.trabalhadorSalario)}**.`,
    `2. A remuneração é paga mensalmente, ${String(v.diaPagamento || 'até ao último dia útil do mês a que respeita').trim().replace(/\.$/, '')}, ${formaPagamentoTexto(v.formaPagamento, v.trabalhadorGenero)}.`,
    `3. No acto do pagamento, a Entidade Empregadora entrega ${w.ao} o recibo da remuneração, com a discriminação da remuneração base, das prestações adicionais, dos descontos e do valor líquido, nos termos ${doCite('reciboRemuneracao')}.`,
    '4. Sobre a remuneração incidem os descontos obrigatórios por lei, designadamente a contribuição para o sistema de segurança social obrigatória (INSS) e a retenção na fonte do IRPS.',
  ];
  if (subs.length) lines.push('5. Acrescem à remuneração base as seguintes prestações adicionais:');
  return {
    id: 'remuneracao',
    heading: 'Remuneração',
    text: lines.join('\n'),
    items: subs.length ? enumerate(subs.map((s) => `${String(s.descricao || 'Subsídio').trim()}: ${moneyExt(s.valor)} por mês`)) : undefined,
    en: `1. The Employer pays a gross monthly base salary of ${formatMoney(money(v.trabalhadorSalario))}. 2. Paid monthly, ${v.diaPagamento || 'by the last working day of the month'}, by ${v.formaPagamento || 'bank transfer'}. 3. A payslip showing base pay, additional payments, deductions and net pay is handed over on payment. 4. Statutory deductions apply (INSS and IRPS withholding).${subs.length ? ' 5. The following allowances are added.' : ''}`,
  };
}

/**
 * Annual leave. `prazoCurtoMeses`: duration of a fixed-term contract in months
 * when it is shorter than one year (the per-month rule applies); otherwise null.
 */
export function clFerias(v: Values, ctx: Pick<TemplateContext, 'legal'>, prazoCurto = false): ClauseItem {
  const w = wk(v.trabalhadorGenero);
  const fer = ctx.legal.value<{ primeiroAno: number; anosSeguintes: number; porMesPrazoCurto: number }>('feriasDireito');
  const first = prazoCurto
    ? `1. ${w.O} tem direito a ${qty(fer.porMesPrazoCurto, 'dia', 'dias')} de férias remuneradas por cada mês completo de serviço efectivo, nos termos ${doCite('feriasDireito')}.`
    : `1. ${w.O} tem direito a um período anual de férias remuneradas de ${qty(fer.primeiroAno, 'dia', 'dias')} no primeiro ano de serviço efectivo e de ${qty(fer.anosSeguintes, 'dia', 'dias')} em cada um dos anos seguintes, nos termos ${doCite('feriasDireito')}.`;
  return {
    id: 'ferias',
    heading: 'Férias',
    text: [
      first,
      `2. O período de férias é marcado por acordo entre as partes ou, na falta de acordo, pela Entidade Empregadora, tendo em conta as necessidades do serviço e os interesses ${w.do}.`,
    ].join('\n'),
    en: prazoCurto
      ? `1. The Employee is entitled to ${fer.porMesPrazoCurto} day(s) of paid leave per full month of service. 2. Leave dates are agreed or, failing agreement, set by the Employer.`
      : `1. The Employee is entitled to ${fer.primeiroAno} days of paid leave in the first year of effective service and ${fer.anosSeguintes} days in each following year. 2. Leave dates are agreed or, failing agreement, set by the Employer.`,
  };
}

export function clDeveresEmpregador(v: Values): ClauseItem {
  const w = wk(v.trabalhadorGenero);
  return {
    id: 'deveresEmpregador',
    heading: 'Deveres da Entidade Empregadora',
    text: 'Além dos deveres previstos na Lei do Trabalho, a Entidade Empregadora obriga-se a:',
    items: enumerate([
      'Pagar pontualmente a remuneração e as demais prestações devidas',
      `Proporcionar ${w.ao} boas condições de trabalho, tanto do ponto de vista físico como moral`,
      'Observar as normas de higiene, saúde e segurança no trabalho',
      `Inscrever ${w.o} no sistema de segurança social obrigatória e entregar as contribuições devidas`,
      `Proporcionar ${w.ao} formação profissional adequada às suas funções`,
      `Tratar ${w.o} com respeito e urbanidade`,
    ]),
    en: 'The Employer shall: pay wages on time; provide good working conditions; comply with health and safety rules; register the Employee with INSS and pay contributions; provide suitable training; treat the Employee with respect.',
  };
}

export function clDeveresTrabalhador(v: Values): ClauseItem {
  const w = wk(v.trabalhadorGenero);
  return {
    id: 'deveresTrabalhador',
    heading: `Deveres ${w.do}`,
    text: `Além dos deveres previstos na Lei do Trabalho, ${w.o} obriga-se a:`,
    items: enumerate([
      'Comparecer ao serviço com assiduidade e pontualidade',
      'Realizar o trabalho com zelo e diligência',
      'Cumprir as ordens e instruções legítimas da Entidade Empregadora e dos seus superiores hierárquicos',
      'Guardar lealdade à Entidade Empregadora, não negociando por conta própria ou alheia em concorrência com ela',
      'Zelar pela boa conservação e utilização dos bens e equipamentos que lhe forem confiados',
      'Cumprir as normas de higiene, saúde e segurança no trabalho e as normas internas da Entidade Empregadora',
    ]),
    en: 'The Employee shall: attend punctually; work with care and diligence; follow lawful instructions; be loyal and not compete with the Employer; look after equipment entrusted to them; comply with health and safety rules and the Employer’s internal rules.',
  };
}

export function clSigilo(v: Values): ClauseItem {
  const w = wk(v.trabalhadorGenero);
  return {
    id: 'sigilo',
    heading: 'Sigilo profissional',
    text: [
      `1. ${w.O} obriga-se a guardar sigilo sobre toda a informação de que tome conhecimento no exercício das suas funções ou por causa delas, designadamente sobre clientes, fornecedores, preços, métodos de trabalho, dados financeiros e dados pessoais, não a divulgando a terceiros nem a utilizando em proveito próprio ou alheio.`,
      '2. A obrigação de sigilo mantém-se após a cessação do presente contrato, enquanto a informação não se tornar do domínio público.',
      '3. A violação do dever de sigilo constitui infracção disciplinar grave, sem prejuízo da responsabilidade civil e criminal a que houver lugar.',
    ].join('\n'),
    en: '1. The Employee shall keep confidential all information obtained through the job (clients, suppliers, prices, methods, financial and personal data) and not disclose or use it. 2. This continues after the contract ends, while the information is not public. 3. Breach is a serious disciplinary offence, without prejudice to civil and criminal liability.',
  };
}

export function clExclusividade(v: Values): ClauseItem {
  const w = wk(v.trabalhadorGenero);
  return {
    id: 'exclusividade',
    heading: 'Exclusividade',
    text: `Durante a vigência do presente contrato, ${w.o} obriga-se a não exercer, directamente ou por interposta pessoa, qualquer actividade profissional, remunerada ou não, que concorra com a actividade da Entidade Empregadora ou que prejudique o cumprimento das suas obrigações contratuais, salvo autorização prévia e escrita desta.`,
    en: 'While the contract is in force, the Employee shall not carry out, directly or indirectly, any professional activity that competes with the Employer or impairs the Employee’s duties, without the Employer’s prior written consent.',
  };
}

export function clCessacao(v: Values, ctx: Pick<TemplateContext, 'legal'>, modalidade: Modalidade): ClauseItem {
  const w = wk(v.trabalhadorGenero);
  type Aviso = { ate3Anos: number; mais3Anos: number; minimoMeses: number; limiarMeses: number };
  let aviso: string;
  let avisoEn: string;
  if (modalidade === 'certo') {
    const ap = ctx.legal.value<{ prazo: number }>('avisoPrevioTrabalhador');
    aviso = `2. ${w.O} que pretenda denunciar o contrato antes do seu termo deve comunicá-lo por escrito à Entidade Empregadora com a antecedência mínima de ${qty(ap.prazo, 'dia', 'dias')}, nos termos ${doCite('avisoPrevioTrabalhador')}.`;
    avisoEn = `The Employee must give ${ap.prazo} days’ written notice to end the contract early.`;
  } else {
    // Indefinite term: notice by length of service (art. 140). Uncertain term: same periods by time worked (art. 46).
    const id = modalidade === 'indeterminado' ? 'avisoPrevioTrabalhador' : 'caducidadePrazoIncertoAviso';
    const ap = ctx.legal.value<Aviso>(id);
    const anos = Math.round(ap.limiarMeses / 12);
    const tempo = modalidade === 'indeterminado' ? 'a antiguidade' : 'o tempo de trabalho';
    aviso = `2. ${w.O} que pretenda denunciar o contrato deve comunicá-lo por escrito à Entidade Empregadora com a antecedência mínima de ${qty(ap.ate3Anos, 'dia', 'dias')}, se ${tempo} for superior a ${qty(ap.minimoMeses, 'mês', 'meses')} e não exceder ${qty(anos, 'ano', 'anos')}, ou de ${qty(ap.mais3Anos, 'dia', 'dias')}, se for superior a ${qty(anos, 'ano', 'anos')}, nos termos ${doCite(id)}.`;
    avisoEn = `The Employee must give ${ap.ate3Anos} days’ written notice if the ${modalidade === 'indeterminado' ? 'length of service' : 'time worked'} is over ${ap.minimoMeses} months and up to ${anos} years, or ${ap.mais3Anos} days if over ${anos} years.`;
  }
  return {
    id: 'cessacao',
    heading: 'Cessação do contrato',
    text: [
      '1. O presente contrato pode cessar por caducidade, por acordo revogatório, por denúncia de qualquer das partes ou por rescisão com justa causa, nos termos e com os efeitos previstos na Lei do Trabalho.',
      aviso,
      `3. Em qualquer caso de cessação, a Entidade Empregadora entrega ${w.ao} um certificado de trabalho, nos termos ${doCite('certificadoTrabalho')}.`,
    ].join('\n'),
    en: `1. The contract may end by expiry, mutual agreement, notice by either party or termination for just cause, as provided in the Labour Law. 2. ${avisoEn} 3. On termination the Employer issues a certificate of employment.`,
  };
}

export function clLegislacao(v: Values): ClauseItem {
  const w = wk(v.trabalhadorGenero);
  if (!v.regulamentoInterno) {
    return {
      id: 'legislacao',
      heading: 'Legislação aplicável',
      text: `Em tudo o que não estiver expressamente previsto no presente contrato aplica-se o disposto na ${LEI_TRABALHO} e nos instrumentos de regulamentação colectiva de trabalho aplicáveis.`,
      en: 'Anything not provided for in this contract is governed by the Labour Law and any applicable collective agreement.',
    };
  }
  return {
    id: 'legislacao',
    heading: 'Legislação aplicável e regulamento interno',
    text: [
      `1. Em tudo o que não estiver expressamente previsto no presente contrato aplica-se o disposto na ${LEI_TRABALHO}, nos instrumentos de regulamentação colectiva de trabalho aplicáveis e no regulamento interno da Entidade Empregadora.`,
      `2. ${w.O} declara ter tomado conhecimento do regulamento interno de trabalho em vigor na Entidade Empregadora, ao qual adere, nos termos ${doCite('regulamentoInterno')}.`,
    ].join('\n'),
    en: '1. Anything not provided for in this contract is governed by the Labour Law, any applicable collective agreement and the Employer’s internal regulations. 2. The Employee confirms having read the internal regulations in force and accepts them.',
  };
}

export function clLitigios(): ClauseItem {
  return {
    id: 'litigios',
    heading: 'Resolução de litígios',
    text: [
      '1. As partes comprometem-se a resolver por acordo os diferendos emergentes da interpretação e execução do presente contrato.',
      '2. Na falta de acordo, os litígios são submetidos aos mecanismos de mediação e arbitragem laboral previstos na lei e, sendo caso disso, ao tribunal competente.',
    ].join('\n'),
    en: '1. The parties will try to settle disputes by agreement. 2. Failing that, disputes go to labour mediation and arbitration as provided by law and, where necessary, to the competent court.',
  };
}

export function clFinais(): ClauseItem {
  return {
    id: 'finais',
    heading: 'Disposições finais',
    text: [
      '1. Qualquer alteração ao presente contrato só é válida se constar de documento escrito assinado por ambas as partes.',
      '2. As comunicações entre as partes são feitas por escrito, para os endereços indicados no presente contrato, obrigando-se cada uma delas a comunicar à outra qualquer alteração.',
    ].join('\n'),
    en: '1. Amendments are only valid in writing signed by both parties. 2. Notices are given in writing to the addresses stated in this contract; each party must report any change of address.',
  };
}

// ---------------------------------------------------------------- Blocks (shared)

export function contratoTitle(v: Values, text: string): Block {
  return { type: 'title', text, subtitle: v.ref ? `N.º ${v.ref}` : undefined };
}

export function partesBlocks(ctx: TemplateContext, celebracao: string, en: string): Block[] {
  return [
    { type: 'paragraph', id: 'entre', text: '**Entre:**', align: 'left', editable: false },
    {
      type: 'paragraph',
      id: 'parteEmpregador',
      text: `${employerParty(ctx, 'Entidade Empregadora')};`,
      en: 'The employer, identified above (the “Employer”);',
    },
    { type: 'paragraph', id: 'e', text: '**e**', align: 'left', editable: false },
    {
      type: 'paragraph',
      id: 'parteTrabalhador',
      text: `${workerParty(ctx.values)};`,
      en: 'The employee, identified above (the “Employee”);',
    },
    { type: 'paragraph', id: 'celebracao', text: celebracao, en },
  ];
}

export const employerSig = (ctx: TemplateContext, role = 'A Entidade Empregadora') => employerSignature(ctx, role);

export function fechoBlocks(ctx: TemplateContext): Block[] {
  return [
    {
      type: 'paragraph',
      id: 'exemplares',
      text: 'O presente contrato é feito em dois exemplares de igual valor, ficando um em poder de cada uma das partes.',
      en: 'This contract is made in two counterparts of equal value, one for each party.',
      keepWithNext: true,
    },
    {
      type: 'signatures',
      placeDate: placeDate(ctx, ctx.values.data),
      columns: [employerSig(ctx), workerSignature(ctx.values)],
    },
  ];
}

// ---------------------------------------------------------------- Warnings (shared)

export function commonWarnings(v: Values, ctx: TemplateContext): Warning[] {
  const w: Warning[] = [];
  const c = ctx.computed;
  if (num(v.horasDia) != null && c.horasDia > c.horasDiaMax) {
    w.push({
      level: 'warning',
      field: 'horasDia',
      message: l(
        `O período normal de trabalho excede o máximo legal de ${c.horasDiaMax} horas por dia (${cite('periodoNormalTrabalho')}), salvo regimes especiais previstos na lei.`,
        `Daily hours exceed the legal maximum of ${c.horasDiaMax} hours, unless a special regime applies.`,
      ),
    });
  }
  if (num(v.horasSemana) != null && c.horasSemana > c.horasSemanaMax) {
    w.push({
      level: 'error',
      field: 'horasSemana',
      message: l(
        `O período normal de trabalho excede o máximo legal de ${c.horasSemanaMax} horas por semana (${cite('periodoNormalTrabalho')}).`,
        `Weekly hours exceed the legal maximum of ${c.horasSemanaMax} hours.`,
      ),
    });
  }
  const salario = money(v.trabalhadorSalario);
  if (salario == null) {
    w.push({ level: 'warning', field: 'trabalhadorSalario', message: l('Indique o salário base mensal.', 'Enter the monthly base salary.') });
  } else if (v.sector) {
    const wage = (ctx.legal.table('salarioMinimo') as MinimumWage[]).find((m) => m.sector === v.sector);
    if (wage && salario < wage.value) {
      w.push({
        level: 'error',
        field: 'trabalhadorSalario',
        message: l(
          `O salário base é inferior ao salário mínimo do sector (${formatMoney(wage.value)}).`,
          `The base salary is below the sector minimum wage (${formatMoney(wage.value)}).`,
        ),
      });
    }
  }
  if (!v.trabalhadorDataAdmissao) {
    w.push({ level: 'warning', field: 'trabalhadorDataAdmissao', message: l('Indique a data de início do contrato.', 'Enter the contract start date.') });
  }
  if (!String(v.trabalhadorCategoria ?? '').trim()) {
    w.push({
      level: 'warning',
      field: 'trabalhadorCategoria',
      message: l(
        `Indique a categoria profissional: é uma menção obrigatória do contrato (${cite('contratoTrabalhoForma')}). Se não houver tabela de categorias, repita o cargo.`,
        'Enter the job grade: the contract must state it. If there is no grading table, repeat the position.',
      ),
    });
  }
  if (!v.trabalhadorDocNumero) {
    w.push({
      level: 'info',
      field: 'trabalhadorDocNumero',
      message: l('Falta o número do documento de identificação do trabalhador.', 'The employee’s ID document number is missing.'),
    });
  }
  if (!v.trabalhadorNuit || !v.trabalhadorInss) {
    w.push({
      level: 'info',
      field: !v.trabalhadorNuit ? 'trabalhadorNuit' : 'trabalhadorInss',
      message: l(
        'Falta o NUIT ou o número de beneficiário do INSS. São necessários para o processamento salarial.',
        'The NUIT or INSS number is missing. Both are needed for payroll.',
      ),
    });
  }
  if (ctx.profile?.kind === 'empresa' && !ctx.profile.representanteNome) {
    w.push({
      level: 'info',
      message: l(
        'O perfil da empresa não indica o representante que assina o contrato. Complete-o em Perfis.',
        'The company profile does not name the representative who signs. Complete it in Profiles.',
      ),
    });
  }
  return w;
}

