// Contrato de trabalho doméstico.
//
// Domestic work is a special regime (art. 3 of the Labour Law): the Domestic
// Work Regulation applies first and the Labour Law fills the gaps insofar as
// it suits the relationship. A new regulation (Decreto n.º 52/2026) replaces
// the 2008 one; the contract uses the stricter limits of both so it stays
// valid across the change. All values come from src/legal/mz-legal.ts.

import { addDays, addMonths, formatPercent, roundMoney } from '@/lib/format';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type ClauseItem, type DefaultsContext, type FieldDef, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, isF, l, lineItems, localField, money, placeDate, splitLines, workerFields } from './_shared';
import { clFinais, clLitigios, doCite, enumerate, lc, moneyExt, noCite, num, qty, startDateField, wk } from './_contrato-trabalho';

// ---------------------------------------------------------------- Helpers

const str = (x: unknown) => String(x ?? '').trim();
const semPonto = (x: unknown) => str(x).replace(/[.;,:]+$/, '');

/** Gendered references to the (individual) employer. */
function em(genero: unknown) {
  const f = isF(genero);
  return {
    T: f ? 'Empregadora' : 'Empregador',
    o: f ? 'a Empregadora' : 'o Empregador',
    O: f ? 'A Empregadora' : 'O Empregador',
    ao: f ? 'à Empregadora' : 'ao Empregador',
    do: f ? 'da Empregadora' : 'do Empregador',
    pelo: f ? 'pela Empregadora' : 'pelo Empregador',
  };
}

const PROFILE_DEFAULTS: Record<string, (c: DefaultsContext) => string | undefined> = {
  empregadorNome: (c) => c.profile?.nome,
  empregadorGenero: (c) => c.profile?.genero,
  empregadorEstadoCivil: (c) => c.profile?.estadoCivil,
  empregadorNacionalidade: (c) => c.profile?.nacionalidade,
  empregadorDocTipo: (c) => c.profile?.docTipo,
  empregadorDocNumero: (c) => c.profile?.docNumero,
  empregadorDocEmissao: (c) => c.profile?.docEmissao,
  empregadorDocLocal: (c) => c.profile?.docLocal,
  empregadorNuit: (c) => c.profile?.nuit,
  empregadorMorada: (c) => (c.profile ? addressLine(c.profile) : ''),
  empregadorTelefone: (c) => c.profile?.telefones,
};

/** Employer fields, defaulted from a personal profile. */
function empregadorFields(): FieldDef[] {
  return workerFields(
    ['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada', 'telefone'],
    'empregador',
    'empregador',
  ).map((f) => {
    const pick = PROFILE_DEFAULTS[f.name];
    const { personKey: _drop, ...rest } = f;
    const fallback = f.default;
    const field: FieldDef = {
      ...rest,
      default: (c: DefaultsContext) => {
        const fromProfile = c.profile?.kind === 'pessoa' && pick ? pick(c) : '';
        if (fromProfile) return fromProfile;
        return typeof fallback === 'function' ? fallback(c) : fallback ?? '';
      },
    };
    if (f.name === 'empregadorNome') field.label = l('Nome completo do empregador', 'Employer’s full name');
    if (f.name === 'empregadorMorada') {
      field.label = l('Residência do empregador', 'Employer’s residence');
      field.required = true;
    }
    return field;
  });
}

const DOC_NOME: Record<string, string> = { BI: 'Bilhete de Identidade', DIRE: 'DIRE', Passaporte: 'Passaporte' };

/** "**Nome**, casada, de nacionalidade moçambicana, portadora do Bilhete de Identidade n.º …, residente em …" */
function identificacao(v: Values, p: string, designacao: string): string {
  const get = (k: string) => str(v[`${p}${k}`]);
  const f = isF(get('Genero'));
  const ec = get('EstadoCivil');
  const estado = !ec ? '' : ec === 'união de facto' ? 'em união de facto' : f ? ec.replace(/o$/, 'a') : ec;
  const emissao = [get('DocLocal') ? `em ${get('DocLocal')}` : '', get('DocEmissao') ? `a ${dateLong(get('DocEmissao'))}` : '']
    .filter(Boolean)
    .join(', ');
  return [
    `**${get('Nome') || BLANK}**`,
    estado,
    get('Nacionalidade') ? `de nacionalidade ${get('Nacionalidade')}` : '',
    `${f ? 'portadora' : 'portador'} do ${DOC_NOME[get('DocTipo')] ?? 'Bilhete de Identidade'} n.º ${get('DocNumero') || BLANK}${emissao ? `, emitido ${emissao}` : ''}`,
    get('Nuit') ? `titular do NUIT ${get('Nuit')}` : '',
    `residente em ${semPonto(get('Morada')) || BLANK}`,
    get('Telefone') ? `com o contacto telefónico ${get('Telefone')}` : '',
  ]
    .filter(Boolean)
    .join(', ') + `, adiante ${f ? 'designada' : 'designado'} por **${designacao}**`;
}

const TAREFAS: { name: string; pt: string; en: string; text: string }[] = [
  { name: 'tarefaLimpeza', pt: 'Limpeza e arrumação da casa', en: 'Cleaning and tidying the house', text: 'Limpeza e arrumação da residência' },
  { name: 'tarefaCozinha', pt: 'Preparação de refeições', en: 'Cooking', text: 'Preparação e confecção de refeições' },
  { name: 'tarefaLavandaria', pt: 'Lavagem e engomagem de roupa', en: 'Laundry and ironing', text: 'Lavagem, secagem e engomagem de roupa' },
  { name: 'tarefaCriancas', pt: 'Cuidar de crianças', en: 'Childcare', text: 'Cuidado e acompanhamento das crianças do agregado familiar' },
  { name: 'tarefaIdosos', pt: 'Cuidar de idosos ou doentes', en: 'Care of elderly or sick people', text: 'Acompanhamento e cuidado de pessoas idosas ou doentes do agregado familiar' },
  { name: 'tarefaCompras', pt: 'Compras e recados', en: 'Shopping and errands', text: 'Compras e recados relacionados com a vida doméstica' },
  { name: 'tarefaJardim', pt: 'Jardinagem e quintal', en: 'Gardening and yard', text: 'Tratamento do jardim e manutenção do quintal' },
  { name: 'tarefaGuarda', pt: 'Guarda da residência', en: 'Guarding the house', text: 'Guarda e vigilância da residência' },
  { name: 'tarefaMotorista', pt: 'Motorista da família', en: 'Family driver', text: 'Condução da viatura do agregado familiar' },
];

const DIAS_SEMANA = ['domingo', 'sábado', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira'];
const DIAS_EN: Record<string, string> = {
  domingo: 'Sunday', sábado: 'Saturday', 'segunda-feira': 'Monday', 'terça-feira': 'Tuesday', 'quarta-feira': 'Wednesday', 'quinta-feira': 'Thursday', 'sexta-feira': 'Friday',
};
const aoDia = (d: string) => (d === 'domingo' || d === 'sábado' ? `ao ${d}` : `à ${d}`);

const vive = (v: Values) => v.alojamento === 'interno';
const temEspecie = (v: Values) => vive(v) || Boolean(v.alimentacao);

function formaPagamento(forma: unknown, pelo: string): string {
  switch (forma) {
    case 'numerário':
      return 'em numerário';
    case 'cheque':
      return 'por cheque';
    case 'M-Pesa':
    case 'e-Mola':
    case 'mKesh':
      return `através de ${forma}, para o número indicado ${pelo}`;
    default:
      return `por transferência bancária para a conta indicada ${pelo}`;
  }
}

type Horas = { horasDia: number; horasSemana: number };

// ---------------------------------------------------------------- Template

export default defineTemplate({
  id: 'contrato-trabalho-domestico',
  family: 'contrato',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'empregador', title: l('Empregador (quem contrata)', 'Employer (who hires)') },
    { id: 'trabalhador', title: l('Trabalhador doméstico', 'Domestic worker'), personRole: 'trabalhador' },
    { id: 'funcoes', title: l('Tarefas e local de trabalho', 'Duties and workplace') },
    { id: 'inicio', title: l('Início e período probatório', 'Start and probation') },
    { id: 'horario', title: l('Horário e descanso', 'Hours and rest') },
    { id: 'remuneracao', title: l('Remuneração', 'Pay') },
    { id: 'cessacao', title: l('Cessação', 'Termination') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data de assinatura', 'Signing date')),
    ...empregadorFields(),
    ...workerFields([
      'nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'inss', 'morada', 'telefone',
    ]).map((f) => (f.name === 'trabalhadorDocNumero' ? { ...f, required: true } : f)),
    {
      name: 'trabalhadorCargo',
      type: 'text',
      section: 'funcoes',
      personKey: 'cargo',
      label: l('Designação da função (opcional)', 'Job title (optional)'),
      placeholder: l('Ex.: Empregada doméstica, Ama, Jardineiro', 'E.g. Housekeeper, Nanny, Gardener'),
    },
    ...TAREFAS.map(
      (t): FieldDef => ({
        name: t.name,
        type: 'toggle',
        section: 'funcoes',
        width: 'half',
        default: t.name === 'tarefaLimpeza',
        label: l(t.pt, t.en),
      }),
    ),
    {
      name: 'outrasTarefas',
      type: 'textarea',
      section: 'funcoes',
      rows: 3,
      label: l('Outras tarefas (opcional)', 'Other duties (optional)'),
      help: l('Uma tarefa por linha.', 'One duty per line.'),
    },
    {
      name: 'localTrabalho',
      type: 'text',
      section: 'funcoes',
      required: true,
      label: l('Residência onde o trabalho é prestado', 'Home where the work is done'),
      help: l('Normalmente a residência do empregador.', 'Usually the employer’s home.'),
      default: (c) => (c.profile?.kind === 'pessoa' ? addressLine(c.profile) : ''),
      legal: l('O contrato deve indicar o local de trabalho.', 'The contract must state the workplace.'),
    },
    {
      name: 'alojamento',
      type: 'radio',
      section: 'funcoes',
      label: l('Alojamento', 'Accommodation'),
      options: [
        { value: 'externo', label: l('Não reside na casa', 'Does not live in') },
        { value: 'interno', label: l('Reside na casa do empregador', 'Lives in the employer’s home') },
      ],
      default: 'externo',
    },
    {
      name: 'alimentacao',
      type: 'toggle',
      section: 'funcoes',
      default: false,
      label: l('O empregador fornece as refeições', 'The employer provides meals'),
    },
    {
      name: 'especieValor',
      type: 'money',
      section: 'funcoes',
      width: 'half',
      showIf: temEspecie,
      label: l('Valor mensal atribuído ao alojamento e alimentação (opcional)', 'Monthly value of board and lodging (optional)'),
      help: l(
        'Preencha só se as partes acordarem que fazem parte da remuneração (em espécie). Deixe vazio para que sejam gratuitos e não contem como salário.',
        'Fill in only if the parties agree they form part of pay (in kind). Leave empty so they are free and do not count as pay.',
      ),
    },
    startDateField('inicio'),
    {
      name: 'periodoProbatorio',
      type: 'toggle',
      section: 'inicio',
      default: false,
      label: l('Incluir período probatório', 'Include a probation period'),
      help: l(
        'Período inicial em que qualquer das partes pode terminar o contrato com aviso curto. Só existe se constar do contrato.',
        'Initial period in which either party may end the contract with short notice. It only applies if written into the contract.',
      ),
    },
    {
      name: 'probatorioMeses',
      type: 'number',
      section: 'inicio',
      width: 'half',
      min: 1,
      max: 12,
      computedKey: 'probatorioMax',
      showIf: (v) => Boolean(v.periodoProbatorio),
      label: l('Duração do período probatório (meses)', 'Probation length (months)'),
    },
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
      placeholder: l('Ex.: de segunda-feira a sábado, das 7h00 às 16h00, com uma hora para almoço', 'E.g. Monday to Saturday, 7:00 to 16:00, with a one-hour lunch break'),
    },
    {
      name: 'diaDescanso',
      type: 'select',
      section: 'horario',
      width: 'half',
      label: l('Dia de descanso semanal', 'Weekly rest day'),
      options: DIAS_SEMANA.map((d) => ({ value: d, label: l(d.charAt(0).toUpperCase() + d.slice(1), DIAS_EN[d]) })),
      default: 'domingo',
    },
    {
      ...workerFields(['salario'], 'remuneracao')[0],
      required: true,
      label: l('Salário mensal em dinheiro (ilíquido)', 'Monthly cash wage (gross)'),
      legal: l('O contrato deve indicar o montante, a forma e a periodicidade da remuneração.', 'The contract must state the amount, method and frequency of pay.'),
    },
    {
      name: 'subsidios',
      type: 'lines',
      section: 'remuneracao',
      label: l('Subsídios (opcional)', 'Allowances (optional)'),
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
      default: 'numerário',
    },
    {
      name: 'diaPagamento',
      type: 'text',
      section: 'remuneracao',
      width: 'half',
      label: l('Data de pagamento', 'Pay day'),
      default: 'até ao último dia do mês a que respeita',
      placeholder: l('Ex.: até ao dia 5 do mês seguinte', 'E.g. by the 5th of the following month'),
    },
    {
      name: 'avisoPrevioDias',
      type: 'number',
      section: 'cessacao',
      width: 'half',
      min: 1,
      max: 90,
      label: l('Aviso prévio acordado (dias, opcional)', 'Agreed notice (days, optional)'),
      help: l(
        'Deixe vazio para remeter para os prazos legais. Se indicar um número, aplica-se sem prejuízo de prazo legal mais longo.',
        'Leave empty to refer to the statutory periods. If you set a number, any longer statutory period still prevails.',
      ),
    },
  ],

  computed: (v, { legal }) => {
    const antigo = legal.value<Horas>('trabalhoDomesticoRegulamento');
    const novo = legal.value<Horas & { emVigorDesde: string }>('trabalhoDomesticoNovoRegime');
    const geral = legal.value<{ geral: number }>('periodoProbatorioIndeterminado').geral;
    // The stricter of the two regulations, so the contract stays lawful after the new one takes effect.
    const horasDiaMax = Math.min(antigo.horasDia, novo.horasDia);
    const horasSemanaMax = Math.min(antigo.horasSemana, novo.horasSemana);
    const probatorioMeses = num(v.probatorioMeses) ?? geral;
    const inicio = str(v.trabalhadorDataAdmissao);
    const tarefas = [
      ...TAREFAS.filter((t) => v[t.name]).map((t) => t.text),
      ...splitLines(v.outrasTarefas),
    ];
    const salario = money(v.trabalhadorSalario);
    const subs = lineItems(v.subsidios).filter((s) => str(s.descricao) || money(s.valor) != null);
    const especie = temEspecie(v) ? money(v.especieValor) : null;
    const global = roundMoney((salario ?? 0) + subs.reduce((t, s) => t + (money(s.valor) ?? 0), 0) + (especie ?? 0));
    return {
      antigo,
      novo,
      horasDiaMax,
      horasSemanaMax,
      horasDia: num(v.horasDia) ?? horasDiaMax,
      horasSemana: num(v.horasSemana) ?? horasSemanaMax,
      probatorioMax: geral,
      probatorioMeses,
      probatorioFim: v.periodoProbatorio && inicio && probatorioMeses > 0 ? addDays(addMonths(inicio, probatorioMeses), -1) : null,
      tarefas,
      subs,
      especie,
      especieFracao: especie != null && global > 0 ? especie / global : 0,
    };
  },

  warnings: (v, { computed: c, legal }) => {
    const w: Warning[] = [];
    const novoDesde = dateLong(c.novo.emVigorDesde);
    if (!str(v.empregadorNome)) {
      w.push({ level: 'warning', field: 'empregadorNome', message: l('Indique o nome do empregador.', 'Enter the employer’s name.') });
    }
    if (!c.tarefas.length) {
      w.push({ level: 'warning', field: 'tarefaLimpeza', message: l('Seleccione pelo menos uma tarefa.', 'Select at least one duty.') });
    }
    if (num(v.horasDia) != null && c.horasDia > c.antigo.horasDia) {
      w.push({
        level: 'error',
        field: 'horasDia',
        message: l(
          `O período normal de trabalho excede o máximo de ${c.antigo.horasDia} horas por dia do Regulamento do Trabalho Doméstico em vigor.`,
          `Daily hours exceed the maximum of ${c.antigo.horasDia} hours in the current Domestic Work Regulation.`,
        ),
      });
    } else if (num(v.horasDia) != null && c.horasDia > c.novo.horasDia) {
      w.push({
        level: 'warning',
        field: 'horasDia',
        message: l(
          `A partir de ${novoDesde}, o novo Regulamento do Trabalho Doméstico limita o período normal de trabalho a ${c.novo.horasDia} horas por dia.`,
          `From ${c.novo.emVigorDesde}, the new Domestic Work Regulation limits normal hours to ${c.novo.horasDia} a day.`,
        ),
      });
    }
    if (num(v.horasSemana) != null && c.horasSemana > c.antigo.horasSemana) {
      w.push({
        level: 'error',
        field: 'horasSemana',
        message: l(
          `O período normal de trabalho excede o máximo de ${c.antigo.horasSemana} horas por semana do Regulamento do Trabalho Doméstico em vigor.`,
          `Weekly hours exceed the maximum of ${c.antigo.horasSemana} hours in the current Domestic Work Regulation.`,
        ),
      });
    } else if (num(v.horasSemana) != null && c.horasSemana > c.novo.horasSemana) {
      w.push({
        level: 'warning',
        field: 'horasSemana',
        message: l(
          `A partir de ${novoDesde}, o novo Regulamento do Trabalho Doméstico limita o período normal de trabalho a ${c.novo.horasSemana} horas por semana.`,
          `From ${c.novo.emVigorDesde}, the new Domestic Work Regulation limits normal hours to ${c.novo.horasSemana} a week.`,
        ),
      });
    }
    if (money(v.trabalhadorSalario) == null) {
      w.push({ level: 'warning', field: 'trabalhadorSalario', message: l('Indique o salário mensal.', 'Enter the monthly wage.') });
    }
    w.push({
      level: 'info',
      field: 'trabalhadorSalario',
      message: l(
        'O novo Regulamento do Trabalho Doméstico prevê um salário mínimo para a categoria, a fixar pelo Governo. Confirme se já foi fixado e se o salário o respeita.',
        'The new Domestic Work Regulation provides for a minimum wage for the category, to be set by the Government. Check whether it has been set and whether the wage meets it.',
      ),
    });
    const maxEspecie = legal.value<{ fracaoMaxima: number }>('remuneracaoEspecie').fracaoMaxima;
    if (c.especie != null && c.especieFracao > maxEspecie) {
      w.push({
        level: 'error',
        field: 'especieValor',
        message: l(
          `A parte da remuneração paga em espécie excede ${formatPercent(maxEspecie)} da remuneração global (${cite('remuneracaoEspecie')}).`,
          `Pay in kind exceeds ${formatPercent(maxEspecie)} of total pay.`,
        ),
      });
    }
    if (v.periodoProbatorio && c.probatorioMeses > c.probatorioMax) {
      w.push({
        level: 'error',
        field: 'probatorioMeses',
        message: l(
          `O período probatório excede o máximo geral de ${c.probatorioMax} ${c.probatorioMax === 1 ? 'mês' : 'meses'} (${cite('periodoProbatorioIndeterminado')}).`,
          `Probation exceeds the general maximum of ${c.probatorioMax} month(s).`,
        ),
      });
    }
    if (v.periodoProbatorio) {
      w.push({
        level: 'info',
        field: 'probatorioMeses',
        message: l(
          'O Regulamento do Trabalho Doméstico pode fixar um período probatório mais curto do que a Lei do Trabalho. Confirme antes de assinar.',
          'The Domestic Work Regulation may set a shorter probation than the Labour Law. Confirm before signing.',
        ),
      });
    }
    if (!v.trabalhadorDataAdmissao) {
      w.push({ level: 'warning', field: 'trabalhadorDataAdmissao', message: l('Indique a data de início do contrato.', 'Enter the contract start date.') });
    }
    if (!str(v.trabalhadorDocNumero)) {
      w.push({
        level: 'info',
        field: 'trabalhadorDocNumero',
        message: l('Falta o número do documento de identificação do trabalhador.', 'The worker’s ID document number is missing.'),
      });
    }
    if (!str(v.trabalhadorInss)) {
      w.push({
        level: 'info',
        field: 'trabalhadorInss',
        message: l(
          'O trabalhador ainda não tem número de beneficiário do INSS. O empregador deve inscrevê-lo e pagar as contribuições mensais.',
          'The worker has no INSS number yet. The employer must register them and pay monthly contributions.',
        ),
      });
    }
    if (v.tarefaMotorista) {
      w.push({
        level: 'info',
        field: 'tarefaMotorista',
        message: l('Confirme que o trabalhador tem carta de condução válida para a viatura.', 'Check that the worker holds a valid driving licence for the vehicle.'),
      });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const w = wk(v.trabalhadorGenero);
    const e = em(v.empregadorGenero);
    const domestico = w.a('trabalhador doméstico', 'trabalhadora doméstica');
    const cargo = str(v.trabalhadorCargo);
    const fer = ctx.legal.value<{ primeiroAno: number; anosSeguintes: number }>('feriasDireito');
    const descanso = ctx.legal.value<{ horas: number }>('descansoSemanal');
    const taxaT = ctx.legal.value<number>('inssTaxaTrabalhador');
    const taxaE = ctx.legal.value<number>('inssTaxaEmpregador');
    const dia = DIAS_SEMANA.includes(v.diaDescanso) ? (v.diaDescanso as string) : 'domingo';

    const clauses: ClauseItem[] = [];

    // Objecto
    clauses.push({
      id: 'objecto',
      heading: 'Objecto',
      text: [
        `1. Pelo presente contrato, ${e.o} admite ao seu serviço, por tempo indeterminado, ${w.o}, que aceita, para prestar trabalho doméstico${cargo ? `, com a função de **${cargo}**` : ''}, em benefício do seu agregado familiar e sob a sua autoridade e direcção.`,
        `2. Compete ${w.ao} a execução das seguintes tarefas:`,
      ].join('\n'),
      items: c.tarefas.length ? enumerate(c.tarefas) : [`${BLANK};`, `${BLANK}.`],
      en: `1. The Employer hires the Employee for an indefinite period to do domestic work${cargo ? ` as ${cargo}` : ''} for the Employer’s household, under the Employer’s authority and direction. 2. The Employee’s duties are listed below.`,
    });
    clauses.push({
      id: 'ambito',
      heading: 'Âmbito das tarefas',
      text: `${w.O} não está ${w.a('obrigado', 'obrigada')} a prestar trabalho a terceiros, nem em actividade comercial ou profissional ${e.do}, nem a executar tarefas diferentes das acordadas, salvo acordo escrito e, sendo caso disso, remuneração adicional.`,
      en: 'The Employee is not required to work for third parties, in the Employer’s business or profession, or to perform tasks other than those agreed, unless agreed in writing and, where applicable, paid additionally.',
    });

    // Local de trabalho
    clauses.push({
      id: 'local',
      heading: 'Local de trabalho',
      text: `${w.O} presta a sua actividade na residência ${e.do}, sita em **${semPonto(v.localTrabalho) || BLANK}**, e nas deslocações inerentes às tarefas acordadas.`,
      en: `The Employee works at the Employer’s home at ${v.localTrabalho || '—'}, and on trips required by the agreed duties.`,
    });

    // Início e duração
    clauses.push({
      id: 'inicio',
      heading: 'Início e duração',
      text: `O presente contrato é celebrado por tempo indeterminado e produz efeitos a partir de **${dateLong(v.trabalhadorDataAdmissao)}**.${v.periodoProbatorio ? '' : ' As partes acordam em não sujeitar o contrato a período probatório.'}`,
      en: `This contract is for an indefinite period and takes effect on ${v.trabalhadorDataAdmissao || '—'}.${v.periodoProbatorio ? '' : ' No probation period applies.'}`,
    });
    if (v.periodoProbatorio) {
      const pd = ctx.legal.value<{ geral: number }>('denunciaPeriodoProbatorio');
      clauses.push({
        id: 'probatorio',
        heading: 'Período probatório',
        text: [
          `1. O contrato fica sujeito a um período probatório de ${qty(c.probatorioMeses, 'mês', 'meses')}, contado a partir do início da prestação de trabalho${c.probatorioFim ? ` e com termo em ${dateLong(c.probatorioFim)}` : ''}.`,
          `2. Durante o período probatório, qualquer das partes pode denunciar o contrato mediante aviso prévio escrito de ${qty(pd.geral, 'dia', 'dias')}, sem necessidade de invocar justa causa, nos termos ${doCite('denunciaPeriodoProbatorio')}.`,
        ].join('\n'),
        en: `1. Probation of ${c.probatorioMeses} month(s) from the start of work${c.probatorioFim ? `, ending on ${c.probatorioFim}` : ''}. 2. During probation either party may end the contract with ${pd.geral} days’ written notice, without stating just cause.`,
      });
    }

    // Horário e descanso
    const horario = str(v.horario) ? `, ${lc(semPonto(v.horario))}` : '';
    const horarioLines = [
      `1. ${w.O} cumpre um período normal de trabalho de ${qty(c.horasDia, 'hora', 'horas', true)} diárias e ${qty(c.horasSemana, 'hora', 'horas', true)} semanais${horario}, com intervalo para refeição e descanso.`,
      `2. ${w.O} tem direito a um descanso semanal de, pelo menos, ${qty(descanso.horas, 'hora', 'horas', true)} consecutivas, gozado ${aoDia(dia)}, nos termos ${doCite('descansoSemanal')}.`,
      '3. O trabalho prestado para além do horário acordado ou no dia de descanso semanal só pode ser exigido nos casos previstos na lei e confere direito a descanso compensatório ou a remuneração adicional, nos termos legais.',
    ];
    if (vive(v)) {
      horarioLines.push(
        `4. O facto de ${w.o} residir na casa ${e.do} não implica disponibilidade permanente: os períodos fora do horário de trabalho e o dia de descanso pertencem-lhe, podendo ausentar-se da residência.`,
      );
    }
    clauses.push({
      id: 'horario',
      heading: 'Período normal de trabalho e descanso',
      text: horarioLines.join('\n'),
      en: `1. Normal hours: ${c.horasDia} a day and ${c.horasSemana} a week${v.horario ? `, ${v.horario}` : ''}, with a meal and rest break. 2. Weekly rest of at least ${descanso.horas} consecutive hours, on ${DIAS_EN[dia]}. 3. Work beyond the agreed hours or on the rest day may only be required where the law allows and entitles the Employee to compensatory rest or extra pay.${vive(v) ? ' 4. Living in does not mean being permanently available: time off and the rest day belong to the Employee, who may leave the house.' : ''}`,
    });

    // Remuneração
    const remLines = [
      `1. Como contrapartida do trabalho prestado, ${e.o} paga ${w.ao} a remuneração mensal ilíquida de **${moneyExt(v.trabalhadorSalario)}**, em dinheiro.`,
      `2. A remuneração é paga mensalmente, ${semPonto(v.diaPagamento) || 'até ao último dia do mês a que respeita'}, ${formaPagamento(v.formaPagamento, w.pelo)}, contra recibo com a indicação do período a que respeita, dos descontos efectuados e do valor líquido, nos termos ${doCite('reciboRemuneracao')}.`,
      `3. Sobre a remuneração incidem apenas os descontos obrigatórios por lei, designadamente a contribuição ${w.do} para a segurança social e, quando aplicável, a retenção na fonte do IRPS.`,
    ];
    if (c.subs.length) remLines.push('4. Acrescem à remuneração os seguintes subsídios:');
    clauses.push({
      id: 'remuneracao',
      heading: 'Remuneração',
      text: remLines.join('\n'),
      items: c.subs.length ? enumerate(c.subs.map((s: Values) => `${str(s.descricao) || 'Subsídio'}: ${moneyExt(s.valor)} por mês`)) : undefined,
      en: `1. The Employer pays a gross monthly cash wage of ${formatMoney(money(v.trabalhadorSalario))}. 2. Paid monthly, ${v.diaPagamento || 'by the last day of the month'}, by ${v.formaPagamento || 'cash'}, against a payslip. 3. Only statutory deductions apply (the Employee’s social security contribution and, where applicable, IRPS).${c.subs.length ? ' 4. The following allowances are added.' : ''}`,
    });

    // Alojamento e alimentação
    if (temEspecie(v)) {
      const ambos = vive(v) && Boolean(v.alimentacao);
      const presta = [vive(v) ? 'o alojamento' : '', v.alimentacao ? 'a alimentação' : ''].filter(Boolean).join(' e ');
      const Presta = presta.charAt(0).toUpperCase() + presta.slice(1);
      const flex = (m: string) => (ambos ? `${m}s` : vive(v) ? m : `${m.slice(0, -1)}a`);
      const oferta = [
        vive(v) ? 'alojamento na sua residência, em compartimento próprio, com condições de higiene, segurança e privacidade' : '',
        v.alimentacao ? 'refeições adequadas durante o período de trabalho' : '',
      ]
        .filter(Boolean)
        .join(', bem como ');
      const lines = [
        `1. ${e.O} proporciona ${w.ao} ${oferta}.`,
        c.especie != null
          ? `2. As partes acordam que ${presta} ${ambos ? 'constituem' : 'constitui'} remuneração em espécie, com o valor mensal de ${moneyExt(c.especie)}, que acresce à remuneração em dinheiro e não pode exceder o limite fixado ${noCite('remuneracaoEspecie')}.`
          : `2. ${Presta} ${ambos ? 'são' : 'é'} ${flex('prestado')} gratuitamente e não ${ambos ? 'são' : 'é'} ${flex('descontado')} na remuneração em dinheiro.`,
      ];
      if (vive(v)) {
        lines.push(
          `3. Cessando o contrato, ${w.o} deixa livre o alojamento no prazo acordado entre as partes, que deve permitir-lhe encontrar nova residência.`,
        );
      }
      clauses.push({
        id: 'alojamento',
        heading: vive(v) && v.alimentacao ? 'Alojamento e alimentação' : vive(v) ? 'Alojamento' : 'Alimentação',
        text: lines.join('\n'),
        en: `1. The Employer provides ${[vive(v) ? 'accommodation in the home (own room, hygienic, safe and private)' : '', v.alimentacao ? 'meals during working hours' : ''].filter(Boolean).join(' and ')}. 2. ${
          c.especie != null ? `These count as pay in kind worth ${formatMoney(c.especie)} a month, on top of the cash wage, within the legal limit.` : 'These are free and are not deducted from the cash wage.'
        }${vive(v) ? ' 3. When the contract ends, the Employee vacates the room within the period agreed, allowing time to find new housing.' : ''}`,
      });
    }

    // Férias e feriados
    clauses.push({
      id: 'ferias',
      heading: 'Férias e feriados',
      text: [
        `1. ${w.O} tem direito a um período anual de férias remuneradas de ${qty(fer.primeiroAno, 'dia', 'dias')} no primeiro ano de serviço efectivo e de ${qty(fer.anosSeguintes, 'dia', 'dias')} em cada um dos anos seguintes, nos termos ${doCite('feriasDireito')}.`,
        `2. As férias são marcadas por acordo entre as partes, tendo em conta as necessidades do agregado familiar e os interesses ${w.do}.`,
        `3. ${w.O} tem direito ao gozo dos feriados obrigatórios, nos termos ${doCite('feriadosNacionais')}; o trabalho prestado nesses dias é compensado nos termos legais.`,
      ].join('\n'),
      en: `1. The Employee is entitled to ${fer.primeiroAno} days of paid leave in the first year of effective service and ${fer.anosSeguintes} days in each following year. 2. Leave dates are agreed, taking into account the household’s needs and the Employee’s interests. 3. The Employee is entitled to public holidays; work on those days is compensated as provided by law.`,
    });

    // Segurança social
    clauses.push({
      id: 'inss',
      heading: 'Segurança social',
      text: [
        `1. ${e.O} inscreve ${w.o} no sistema de segurança social obrigatória, gerido pelo Instituto Nacional de Segurança Social (INSS), e entrega mensalmente as contribuições devidas.`,
        `2. A contribuição a cargo ${w.do}, de ${formatPercent(taxaT)} da remuneração, é descontada no salário; a contribuição a cargo ${e.do} é de ${formatPercent(taxaE)} da remuneração e não pode ser descontada ${w.ao}.`,
        str(v.trabalhadorInss)
          ? `3. ${w.O} está ${w.a('inscrito', 'inscrita')} no INSS com o número de beneficiário ${str(v.trabalhadorInss)}.`
          : `3. ${w.O} entrega ${e.ao} os documentos necessários à inscrição.`,
      ].join('\n'),
      en: `1. The Employer registers the Employee with the mandatory social security system (INSS) and pays the contributions monthly. 2. The Employee’s contribution (${formatPercent(taxaT)} of pay) is deducted from the wage; the Employer’s contribution (${formatPercent(taxaE)}) may not be deducted. 3. ${v.trabalhadorInss ? `INSS number: ${v.trabalhadorInss}.` : 'The Employee provides the documents needed for registration.'}`,
    });

    // Deveres
    clauses.push({
      id: 'deveresEmpregador',
      heading: `Deveres ${e.do}`,
      text: `${e.O} obriga-se, designadamente, a:`,
      items: enumerate([
        'Pagar pontualmente a remuneração e as demais prestações devidas',
        `Tratar ${w.o} com respeito e urbanidade, abstendo-se de qualquer forma de assédio, violência ou discriminação`,
        `Respeitar o horário de trabalho, os períodos de descanso e as férias ${w.do}`,
        'Proporcionar condições de trabalho seguras e os meios e produtos necessários à execução das tarefas',
        `Não reter os documentos de identificação nem outros bens pessoais ${w.do}`,
        `Inscrever ${w.o} no INSS e entregar as contribuições devidas`,
      ]),
      en: 'The Employer shall: pay on time; treat the Employee with respect, free from harassment, violence or discrimination; respect working hours, rest and leave; provide safe working conditions and the materials needed; not keep the Employee’s ID documents or personal belongings; register the Employee with INSS and pay contributions.',
    });
    clauses.push({
      id: 'deveresTrabalhador',
      heading: `Deveres ${w.do}`,
      text: `${w.O} obriga-se, designadamente, a:`,
      items: enumerate([
        'Comparecer ao serviço com assiduidade e pontualidade e comunicar as faltas com a antecedência possível',
        'Executar as tarefas acordadas com zelo e diligência, seguindo as instruções legítimas recebidas',
        `Zelar pela boa conservação dos bens, utensílios e equipamentos da residência que lhe forem confiados`,
        `Guardar sigilo sobre a vida privada ${e.do} e do seu agregado familiar e sobre os factos de que tome conhecimento no serviço`,
        `Não permitir a entrada de terceiros na residência sem autorização ${e.do}`,
      ]),
      en: 'The Employee shall: attend punctually and give notice of absences as early as possible; perform the agreed duties with care, following lawful instructions; look after the household’s belongings and equipment; keep the family’s private life confidential; not let third parties into the house without the Employer’s permission.',
    });

    // Cessação
    const aviso = num(v.avisoPrevioDias);
    clauses.push({
      id: 'cessacao',
      heading: 'Cessação do contrato',
      text: [
        '1. O presente contrato pode cessar por acordo das partes, por denúncia de qualquer delas, por rescisão com justa causa ou por caducidade, nos termos da legislação aplicável ao trabalho doméstico e, subsidiariamente, da Lei do Trabalho.',
        aviso != null
          ? `2. A parte que pretenda denunciar o contrato comunica-o à outra por escrito, com a antecedência mínima de ${qty(aviso, 'dia', 'dias')}, sem prejuízo de prazo legal mais longo.`
          : '2. A parte que pretenda denunciar o contrato comunica-o à outra por escrito, com a antecedência prevista na lei.',
        `3. Em caso de cessação, ${e.o} paga ${w.ao} os créditos vencidos, designadamente a remuneração em dívida e as férias vencidas e não gozadas, e entrega-lhe um certificado de trabalho, nos termos ${doCite('certificadoTrabalho')}.`,
      ].join('\n'),
      en: `1. The contract may end by agreement, by notice from either party, by termination for just cause or by expiry, under the domestic work rules and, subsidiarily, the Labour Law. 2. Notice is given in writing ${aviso != null ? `at least ${aviso} days in advance, unless the law requires longer` : 'within the statutory period'}. 3. On termination the Employer pays all amounts due (unpaid wages, accrued untaken leave) and issues a certificate of employment.`,
    });

    clauses.push({
      id: 'legislacao',
      heading: 'Legislação aplicável',
      text: `Em tudo o que não estiver expressamente previsto no presente contrato aplica-se a legislação especial sobre o trabalho doméstico em vigor e, em tudo o que se mostrar adaptado à natureza desta relação de trabalho, a Lei do Trabalho, nos termos ${doCite('trabalhoDomestico')}.`,
      en: 'Anything not provided for in this contract is governed by the special legislation on domestic work in force and, insofar as it suits the nature of this relationship, by the Labour Law.',
    });
    clauses.push(clLitigios(), clFinais());

    const empregadorSig: SignatureColumn = { role: e.O, name: str(v.empregadorNome) || undefined, image: 'signature' };
    const trabalhadorSig: SignatureColumn = { role: w.O, name: str(v.trabalhadorNome) || undefined };

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de trabalho doméstico' },
      { type: 'paragraph', id: 'entre', text: '**Entre:**', align: 'left', editable: false },
      {
        type: 'paragraph',
        id: 'parteEmpregador',
        text: `${identificacao(v, 'empregador', e.T)};`,
        en: 'The employer, an individual identified above (the “Employer”);',
      },
      { type: 'paragraph', id: 'e', text: '**e**', align: 'left', editable: false },
      {
        type: 'paragraph',
        id: 'parteTrabalhador',
        text: `${identificacao(v, 'trabalhador', w.T)};`,
        en: 'The domestic worker identified above (the “Employee”);',
      },
      {
        type: 'paragraph',
        id: 'celebracao',
        text: `É celebrado, de boa-fé, o presente contrato de trabalho doméstico, pelo qual ${w.o} se obriga a prestar a sua actividade como ${domestico}, que se rege pelas cláusulas seguintes:`,
        en: 'This domestic employment contract is entered into in good faith and is governed by the following clauses:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      {
        type: 'paragraph',
        id: 'exemplares',
        text: `O presente contrato é feito em dois exemplares de igual valor, ficando um em poder de cada uma das partes, e foi lido e explicado ${w.ao}, que declara ter compreendido o seu conteúdo.`,
        en: 'This contract is made in two counterparts of equal value, one for each party; it was read and explained to the Employee, who confirms understanding it.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [empregadorSig, trabalhadorSig] },
    ];
    return blocks;
  },
});
