// Acordo de estágio pré-profissional between a host organisation (entidade
// promotora) and a final-year student or recent graduate. It is not an
// employment contract; the rules come from the Regulamento de Estágios
// Pré-profissionais (values marked 'confirm' in the legal file).

import { addDays, addMonths } from '@/lib/format';
import { MINIMUM_WAGES_2026, type MinimumWage } from '@/legal/mz-legal';
import { defineTemplate, type ClauseItem, type SignatureColumn, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerParty, formatMoney, isF, l, lineItems, localField, money, placeDate, refField, workerFields, workerParty } from './_shared';
import { employerSig, enumerate, lc, moneyExt, num, qty } from './_contrato-trabalho';
import { ageOn, str } from './_pessoal-rh';

export default defineTemplate({
  id: 'contrato-estagio',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Estagiário', 'Intern'), personRole: 'trabalhador' },
    { id: 'formacao', title: l('Formação', 'Education') },
    { id: 'estagio', title: l('Estágio', 'Internship') },
    { id: 'subsidio', title: l('Subsídio e benefícios', 'Allowance and benefits') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data de assinatura', 'Signing date')),
    ...workerFields(['nome', 'genero', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada', 'telefone']),
    {
      name: 'dataNascimento',
      type: 'date',
      section: 'trabalhador',
      width: 'half',
      required: true,
      label: l('Data de nascimento', 'Date of birth'),
      legal: l('O estágio pré-profissional destina-se a jovens dentro de um limite de idade.', 'Pre-professional internships are for young people within an age range.'),
    },
    { name: 'curso', type: 'text', section: 'formacao', required: true, label: l('Curso / formação', 'Course / qualification'), placeholder: l('Ex.: Licenciatura em Contabilidade e Auditoria', 'E.g. BA in Accounting and Auditing') },
    { name: 'instituicao', type: 'text', section: 'formacao', width: 'half', label: l('Instituição de ensino', 'School / university'), placeholder: l('Ex.: Universidade Eduardo Mondlane', 'E.g. Eduardo Mondlane University') },
    {
      name: 'situacaoAcademica',
      type: 'select',
      section: 'formacao',
      width: 'half',
      label: l('Situação', 'Status'),
      default: 'graduado',
      options: [
        { value: 'graduado', label: l('Recém-graduado', 'Recent graduate') },
        { value: 'finalista', label: l('Finalista', 'Final-year student') },
      ],
    },
    { name: 'area', type: 'text', section: 'estagio', width: 'half', required: true, label: l('Área do estágio', 'Internship area'), placeholder: l('Ex.: Contabilidade', 'E.g. Accounting') },
    { name: 'departamento', type: 'text', section: 'estagio', width: 'half', label: l('Departamento', 'Department') },
    {
      name: 'actividades',
      type: 'textarea',
      section: 'estagio',
      rows: 3,
      label: l('Principais actividades (opcional)', 'Main activities (optional)'),
      help: l('Uma por linha.', 'One per line.'),
    },
    { name: 'orientadorNome', type: 'text', section: 'estagio', width: 'half', required: true, label: l('Orientador', 'Supervisor') },
    { name: 'orientadorCargo', type: 'text', section: 'estagio', width: 'half', label: l('Cargo do orientador', 'Supervisor’s position') },
    { name: 'localEstagio', type: 'text', section: 'estagio', label: l('Local do estágio', 'Place of the internship'), default: (c) => (c.profile?.morada?.cidade ? `Instalações da Entidade Promotora, ${c.profile.morada.cidade}` : '') },
    { name: 'dataInicio', type: 'date', section: 'estagio', width: 'half', required: true, label: l('Início', 'Start'), default: (c) => c.today },
    { name: 'duracaoMeses', type: 'number', section: 'estagio', width: 'half', min: 1, max: 24, required: true, default: 6, label: l('Duração (meses)', 'Length (months)') },
    { name: 'horario', type: 'text', section: 'estagio', width: 'half', label: l('Horário', 'Schedule'), default: 'de segunda a sexta-feira, das 8h00 às 16h00, com uma hora de intervalo' },
    { name: 'horasSemana', type: 'number', section: 'estagio', width: 'half', min: 1, max: 60, label: l('Horas por semana', 'Hours per week'), default: 35 },
    {
      name: 'remunerado',
      type: 'toggle',
      section: 'subsidio',
      default: true,
      label: l('O estágio tem subsídio mensal', 'The internship has a monthly allowance'),
    },
    { name: 'subsidio', type: 'money', section: 'subsidio', width: 'half', label: l('Subsídio mensal', 'Monthly allowance'), showIf: (v) => Boolean(v.remunerado) },
    {
      name: 'sector',
      type: 'select',
      section: 'subsidio',
      width: 'half',
      label: l('Sector (salário mínimo)', 'Sector (minimum wage)'),
      help: l('Para verificar o subsídio mínimo.', 'Checks the minimum allowance.'),
      options: [{ value: '', label: l('Não verificar', 'Do not check') }, ...MINIMUM_WAGES_2026.map((w) => ({ value: w.sector, label: l(w.sector, w.sector) }))],
      default: '',
      showIf: (v) => Boolean(v.remunerado),
    },
    {
      name: 'beneficios',
      type: 'lines',
      section: 'subsidio',
      label: l('Outros benefícios (opcional)', 'Other benefits (optional)'),
      addLabel: l('Adicionar benefício', 'Add benefit'),
      columns: [{ name: 'descricao', type: 'text', label: l('Benefício', 'Benefit'), placeholder: l('Ex.: subsídio de transporte de 1.500,00 MT', 'E.g. transport allowance') }],
      default: [],
    },
    { name: 'seguro', type: 'toggle', section: 'opcoes', default: true, label: l('A entidade promotora assegura seguro de acidentes pessoais', 'The host provides personal accident insurance') },
    { name: 'avisoDenuncia', type: 'number', section: 'opcoes', width: 'half', min: 1, max: 60, default: 15, label: l('Aviso para terminar antes do fim (dias)', 'Notice to end early (days)') },
    { name: 'instituicaoAssina', type: 'toggle', section: 'opcoes', default: false, label: l('A instituição de ensino também assina', 'The school also signs') },
    { name: 'instituicaoRepresentante', type: 'text', section: 'opcoes', label: l('Representante da instituição', 'School representative'), showIf: (v) => Boolean(v.instituicaoAssina) },
  ],

  computed: (v, ctx) => {
    const e = ctx.legal.value<{ idadeMin: number; idadeMax: number; duracaoMaxMeses: number; subsidioMinPercentSM: number }>('estagioPreProfissional');
    const meses = num(v.duracaoMeses);
    const fim = v.dataInicio && meses ? addDays(addMonths(v.dataInicio, meses), -1) : null;
    const pnt = ctx.legal.value<{ horasDia: number; horasSemana: number }>('periodoNormalTrabalho');
    return { e, meses, fim, pnt };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `O estágio pré-profissional não é contrato de trabalho (${cite('estagioPreProfissional')}). Se o estagiário fizer trabalho produtivo regular sob ordens, presume-se um contrato de trabalho (${cite('presuncaoContratoTrabalho')}). O estágio laboral de recém-formados com contrato de trabalho segue outra regra: pelo menos ${ctx.legal.value<{ percentagem: number }>('estagioPosFormacao').percentagem} por cento da remuneração da categoria (${cite('estagioPosFormacao')}).`,
          'A pre-professional internship is not an employment contract. Regular productive work under orders is presumed to be employment. A graduate work placement under an employment contract follows another rule: at least a set share of the grade’s pay.',
        ),
      },
    ];
    const idade = ageOn(v.dataNascimento, v.dataInicio || v.data);
    if (idade != null && (idade < c.e.idadeMin || idade > c.e.idadeMax)) {
      w.push({ level: 'warning', field: 'dataNascimento', message: l(`O estagiário tem ${idade} anos; o regulamento abrange jovens dos ${c.e.idadeMin} aos ${c.e.idadeMax} anos (confirme).`, `The intern is ${idade}; the regulation covers ages ${c.e.idadeMin} to ${c.e.idadeMax} (confirm).`) });
    }
    const maior = ctx.legal.value<{ anos: number }>('maioridade').anos;
    if (idade != null && idade < maior) {
      w.push({ level: 'warning', field: 'dataNascimento', message: l('Estagiário menor: o acordo deve ser assinado também pelo representante legal, e as tarefas devem ser adequadas à idade.', 'Minor intern: the legal representative must also sign, and tasks must suit the age.') });
    }
    if (c.meses != null && c.meses > c.e.duracaoMaxMeses) {
      w.push({ level: 'warning', field: 'duracaoMeses', message: l(`A duração excede o máximo de ${c.e.duracaoMaxMeses} meses previsto no regulamento (confirme).`, `The length exceeds the ${c.e.duracaoMaxMeses}-month maximum (confirm).`) });
    }
    if (num(v.horasSemana) != null && Number(v.horasSemana) > c.pnt.horasSemana) {
      w.push({ level: 'error', field: 'horasSemana', message: l(`Excede o máximo de ${c.pnt.horasSemana} horas semanais (${cite('periodoNormalTrabalho')}).`, `Exceeds the ${c.pnt.horasSemana}-hour weekly maximum.`) });
    }
    if (v.remunerado) {
      const s = money(v.subsidio);
      if (s == null) w.push({ level: 'warning', field: 'subsidio', message: l('Indique o valor do subsídio.', 'Enter the allowance.') });
      else if (v.sector) {
        const wage = (ctx.legal.table('salarioMinimo') as MinimumWage[]).find((m) => m.sector === v.sector);
        const min = wage ? Math.round(wage.value * c.e.subsidioMinPercentSM) / 100 : null;
        if (min != null && s < min) {
          w.push({ level: 'warning', field: 'subsidio', message: l(`O subsídio é inferior a ${c.e.subsidioMinPercentSM} por cento do salário mínimo do sector (${formatMoney(min)}) (confirme).`, `The allowance is below ${c.e.subsidioMinPercentSM}% of the sector minimum wage (${formatMoney(min)}) (confirm).`) });
        }
      }
    }
    w.push({ level: 'info', message: l('No fim, emita o certificado de estágio no modelo da entidade de emprego (INEP) e, se aplicável, comunique o estágio a essa entidade.', 'At the end, issue the internship certificate on the employment agency’s (INEP) model and, where applicable, notify the agency.') });
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const f = isF(v.trabalhadorGenero);
    const E = f ? 'Estagiária' : 'Estagiário';
    const o = f ? 'a Estagiária' : 'o Estagiário';
    const O = f ? 'A Estagiária' : 'O Estagiário';
    const ao = f ? 'à Estagiária' : 'ao Estagiário';
    const doE = f ? 'da Estagiária' : 'do Estagiário';
    const actividades = str(v.actividades).split(/\n+/).map((s) => s.trim()).filter(Boolean);
    const beneficios = lineItems(v.beneficios).map((r) => str(r.descricao)).filter(Boolean);
    const aviso = num(v.avisoDenuncia) ?? 15;
    const formacao = `${str(v.curso) || BLANK}${str(v.instituicao) ? `, ${v.situacaoAcademica === 'finalista' ? 'que frequenta' : 'concluído'} na ${str(v.instituicao).replace(/^(a|na)\s/i, '')}` : ''}`;

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `1. A Entidade Promotora proporciona ${ao} um estágio pré-profissional na área de **${str(v.area) || BLANK}**${str(v.departamento) ? `, no departamento de ${str(v.departamento)}` : ''}, com vista à aquisição de experiência prática complementar à sua formação em ${formacao}.${actividades.length ? `\n2. Durante o estágio, ${o} participa, em especial, nas seguintes actividades:` : ''}`,
        items: actividades.length ? enumerate(actividades) : undefined,
        en: `The host offers the intern a pre-professional internship in ${v.area || '—'} to gain practical experience complementing their training.`,
      },
      {
        id: 'natureza',
        heading: 'Natureza',
        text: `O presente acordo não constitui contrato de trabalho e rege-se pelo ${cite('estagioPreProfissional')}, sem prejuízo da celebração posterior de contrato de trabalho entre as partes.`,
        en: 'This agreement is not an employment contract; it is governed by the pre-professional internship regulation, without prejudice to a later employment contract.',
      },
      {
        id: 'duracao',
        heading: 'Duração',
        text: `O estágio tem a duração de ${c.meses ? qty(c.meses, 'mês', 'meses') : `${BLANK} meses`}, com início em **${dateLong(v.dataInicio)}** e termo em **${dateLong(c.fim ?? '')}**.`,
        en: `The internship lasts ${c.meses ?? '—'} months, from ${v.dataInicio || '—'} to ${c.fim || '—'}.`,
      },
      {
        id: 'local',
        heading: 'Local e horário',
        text: `1. O estágio decorre em ${lc(str(v.localEstagio).replace(/\.$/, '')) || BLANK}.\n2. ${O} cumpre o horário ${str(v.horario) ? lc(str(v.horario).replace(/\.$/, '')) : BLANK}${num(v.horasSemana) ? `, num total de ${qty(Number(v.horasSemana), 'hora', 'horas', true)} semanais` : ''}.`,
        en: `The internship takes place at the stated location, ${v.horario || ''}.`,
      },
      {
        id: 'orientacao',
        heading: 'Orientação e avaliação',
        text: `1. A Entidade Promotora designa como orientador ${str(v.orientadorNome) || BLANK}${str(v.orientadorCargo) ? `, ${str(v.orientadorCargo)}` : ''}, que acompanha, orienta e avalia ${o}.\n2. No fim do estágio, ${o} apresenta um relatório das actividades realizadas, sobre o qual o orientador emite parecer.`,
        en: '1. The host appoints the named supervisor to guide and assess the intern. 2. At the end the intern submits an activity report for the supervisor’s opinion.',
      },
      {
        id: 'subsidio',
        heading: 'Subsídio',
        text: v.remunerado
          ? `A Entidade Promotora paga ${ao} um subsídio mensal de estágio de **${moneyExt(v.subsidio)}**, até ao último dia útil de cada mês${beneficios.length ? ', e ainda os seguintes benefícios:' : '.'}`
          : `O estágio não é remunerado${beneficios.length ? ', assegurando a Entidade Promotora os seguintes benefícios:' : '.'}`,
        items: beneficios.length ? enumerate(beneficios) : undefined,
        en: v.remunerado ? `The host pays a monthly allowance of ${formatMoney(money(v.subsidio))}${beneficios.length ? ' plus the listed benefits' : ''}.` : 'The internship is unpaid.',
      },
      {
        id: 'deveresPromotora',
        heading: 'Deveres da Entidade Promotora',
        text: 'A Entidade Promotora obriga-se a:',
        items: enumerate([
          `Proporcionar ${ao} condições de higiene e segurança adequadas e a orientação necessária`,
          'Atribuir actividades relacionadas com a área de formação e o objecto do estágio',
          `Avaliar o desempenho ${doE} e emitir, no fim, o certificado de estágio`,
          `Tratar ${o} com respeito e urbanidade`,
        ]),
        en: 'The host shall provide health and safety conditions and guidance, assign relevant tasks, assess the intern and issue a certificate, and treat the intern with respect.',
      },
      {
        id: 'deveresEstagiario',
        heading: `Deveres ${doE}`,
        text: `${O} obriga-se a:`,
        items: enumerate([
          'Cumprir o horário e comparecer com assiduidade e pontualidade',
          'Seguir as orientações do orientador e as normas internas e de segurança da Entidade Promotora',
          'Guardar sigilo sobre a informação a que tenha acesso, mesmo após o fim do estágio',
          'Zelar pelos bens e equipamentos que lhe forem confiados',
          'Apresentar o relatório final de estágio',
        ]),
        en: 'The intern shall keep to the schedule, follow instructions and safety rules, keep information confidential, look after equipment and submit the final report.',
      },
    ];
    if (v.seguro) {
      clauses.push({
        id: 'seguro',
        heading: 'Seguro',
        text: `A Entidade Promotora assegura, durante o estágio, um seguro de acidentes pessoais a favor ${doE}.`,
        en: 'The host provides personal accident insurance for the intern during the internship.',
      });
    }
    clauses.push(
      {
        id: 'cessacao',
        heading: 'Cessação',
        text: `1. O presente acordo cessa no termo do prazo, por acordo das partes ou por denúncia de qualquer delas, comunicada por escrito com a antecedência mínima de ${qty(aviso, 'dia', 'dias')}.\n2. Qualquer das partes pode pôr termo imediato ao acordo em caso de incumprimento grave dos deveres da outra.\n3. Em qualquer caso de cessação, a Entidade Promotora emite declaração do período de estágio cumprido.`,
        en: `1. The agreement ends at the end of the term, by mutual agreement or by either party with ${aviso} days’ written notice. 2. Either party may end it at once for serious breach. 3. The host certifies the period completed.`,
      },
      {
        id: 'finais',
        heading: 'Disposições finais',
        text: `Em tudo o que não estiver previsto no presente acordo aplica-se o ${cite('estagioPreProfissional')}. As alterações ao presente acordo só são válidas por escrito.`,
        en: 'Anything not covered is governed by the internship regulation. Amendments must be in writing.',
      },
    );

    const cols: SignatureColumn[] = [employerSig(ctx, 'A Entidade Promotora'), { role: `${f ? 'A' : 'O'} ${E}`, name: str(v.trabalhadorNome) || undefined }];
    if (v.instituicaoAssina) cols.push({ role: 'A Instituição de Ensino', name: str(v.instituicaoRepresentante) || undefined, detail: str(v.instituicao) || undefined });

    return [
      { type: 'title', text: 'Acordo de Estágio Pré-Profissional', subtitle: v.ref ? `N.º ${v.ref}` : undefined },
      { type: 'paragraph', id: 'entre', text: '**Entre:**', align: 'left', editable: false },
      { type: 'paragraph', id: 'partePromotora', text: `${employerParty(ctx, 'Entidade Promotora')};`, en: 'The host organisation (the “Host”);' },
      { type: 'paragraph', id: 'e', text: '**e**', align: 'left', editable: false },
      { type: 'paragraph', id: 'parteEstagiario', text: `${v.dataNascimento ? workerParty(v, E).replace(/, adiante (designad[oa])/, `, ${f ? 'nascida' : 'nascido'} a ${dateLong(v.dataNascimento)}, adiante $1`) : workerParty(v, E)};`, en: 'The intern (the “Intern”);' },
      { type: 'paragraph', id: 'celebracao', text: 'É celebrado o presente acordo de estágio pré-profissional, que se rege pelas cláusulas seguintes:', en: 'This pre-professional internship agreement is governed by the following clauses:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      {
        type: 'paragraph',
        id: 'exemplares',
        text: `O presente acordo é feito em ${v.instituicaoAssina ? 'três' : 'dois'} exemplares de igual valor, ficando um em poder de cada uma das partes.`,
        en: 'Made in counterparts of equal value, one for each party.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: cols },
    ];
  },
});

