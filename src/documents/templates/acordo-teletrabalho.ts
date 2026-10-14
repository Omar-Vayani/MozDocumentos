// Acordo de teletrabalho (or addendum to an existing employment contract).
// The Labour Law requires remote work to be agreed in writing and refers its
// detailed rules to special legislation not yet published, so the clauses are
// contractual; remote monitoring follows the general rule on surveillance.

import { diffDays } from '@/lib/format';
import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerParty, l, lineItems, localField, money, placeDate, refField, workerFields, workerParty, workerSignature } from './_shared';
import { CONTRATO_SECTIONS, doCite, employerSig, enumerate, horarioFields, horasComputed, lc, moneyExt, num, qty, wk } from './_contrato-trabalho';
import { str } from './_pessoal-rh';

export default defineTemplate({
  id: 'acordo-teletrabalho',
  family: 'contrato',
  sections: [
    CONTRATO_SECTIONS.documento,
    CONTRATO_SECTIONS.trabalhador,
    { id: 'regime', title: l('Regime e local', 'Arrangement and place') },
    CONTRATO_SECTIONS.horario,
    { id: 'meios', title: l('Equipamentos e despesas', 'Equipment and expenses') },
    { id: 'vigencia', title: l('Vigência e controlo', 'Term and monitoring') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data de assinatura', 'Signing date')),
    ...workerFields(['nome', 'genero', 'cargo', 'categoria', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada']),
    {
      name: 'contratoData',
      type: 'date',
      section: 'trabalhador',
      width: 'half',
      label: l('Data do contrato de trabalho (opcional)', 'Date of the employment contract (optional)'),
      help: l('Se o trabalhador já tem contrato, o documento é um aditamento a esse contrato.', 'If the employee already has a contract, this becomes an addendum to it.'),
    },
    {
      name: 'regime',
      type: 'radio',
      section: 'regime',
      label: l('Regime', 'Arrangement'),
      default: 'parcial',
      options: [
        { value: 'total', label: l('Teletrabalho total', 'Fully remote') },
        { value: 'parcial', label: l('Híbrido (parte em casa, parte na empresa)', 'Hybrid (part at home, part on site)') },
      ],
    },
    {
      name: 'diasTeletrabalho',
      type: 'text',
      section: 'regime',
      label: l('Dias de teletrabalho', 'Remote days'),
      placeholder: l('Ex.: segunda e sexta-feira', 'E.g. Monday and Friday'),
      showIf: (v) => v.regime === 'parcial',
    },
    {
      name: 'localEmpresa',
      type: 'text',
      section: 'regime',
      label: l('Local de trabalho nos dias presenciais', 'Workplace on on-site days'),
      default: (c) => (c.profile?.morada?.cidade ? `Sede da empresa, ${c.profile.morada.cidade}` : ''),
      showIf: (v) => v.regime === 'parcial',
    },
    {
      name: 'localTeletrabalho',
      type: 'text',
      section: 'regime',
      required: true,
      label: l('Local do teletrabalho', 'Remote work location'),
      placeholder: l('Ex.: residência do trabalhador, Bairro da Sommerschield, Maputo', 'E.g. employee’s home address'),
    },
    { name: 'inicio', type: 'date', section: 'regime', width: 'half', required: true, label: l('Início do teletrabalho', 'Start of remote work'), default: (c) => c.today },
    ...horarioFields(),
    {
      name: 'meiosContacto',
      type: 'text',
      section: 'horario',
      label: l('Meios de contacto no horário', 'Contact channels during working hours'),
      default: 'telefone, correio electrónico e plataformas de comunicação da Entidade Empregadora',
    },
    {
      name: 'equipamentos',
      type: 'lines',
      section: 'meios',
      label: l('Equipamentos fornecidos pela empresa', 'Equipment provided by the company'),
      addLabel: l('Adicionar equipamento', 'Add equipment'),
      columns: [
        { name: 'item', type: 'text', label: l('Equipamento', 'Item') },
        { name: 'serie', type: 'text', label: l('N.º de série / inventário', 'Serial / asset no.') },
      ],
      default: [{ item: 'Computador portátil', serie: '' }],
    },
    {
      name: 'compensacao',
      type: 'money',
      section: 'meios',
      width: 'half',
      label: l('Compensação mensal de despesas (internet, energia)', 'Monthly expense allowance (internet, power)'),
      help: l('Deixe vazio se a empresa não pagar despesas.', 'Leave empty if the company does not pay expenses.'),
    },
    {
      name: 'compensacaoForma',
      type: 'select',
      section: 'meios',
      width: 'half',
      label: l('Forma', 'How'),
      default: 'fixo',
      options: [
        { value: 'fixo', label: l('Valor fixo, com o salário', 'Fixed amount, with pay') },
        { value: 'comprovativo', label: l('Até esse valor, contra comprovativo', 'Up to that amount, against receipts') },
      ],
    },
    {
      name: 'meiosControlo',
      type: 'toggle',
      section: 'vigencia',
      default: false,
      label: l('Existem sistemas de registo ou controlo (VPN, registo de acessos)', 'There are logging or monitoring systems (VPN, access logs)'),
      help: l('A lei proíbe vigilância à distância para controlar o desempenho. Se existirem sistemas por segurança, o trabalhador tem de ser informado por escrito.', 'The law forbids remote monitoring of performance. Security systems must be disclosed in writing.'),
    },
    { name: 'descricaoControlo', type: 'text', section: 'vigencia', label: l('Quais e para quê', 'Which and why'), placeholder: l('Ex.: registo de acessos à rede privada virtual (VPN), para segurança da informação', 'E.g. VPN access logs, for information security'), showIf: (v) => Boolean(v.meiosControlo) },
    {
      name: 'duracao',
      type: 'radio',
      section: 'vigencia',
      label: l('Vigência', 'Term'),
      default: 'indeterminado',
      options: [
        { value: 'indeterminado', label: l('Sem prazo', 'Open-ended') },
        { value: 'ate', label: l('Até uma data', 'Until a date') },
      ],
    },
    { name: 'dataFimAcordo', type: 'date', section: 'vigencia', width: 'half', label: l('Termo do acordo', 'End of the agreement'), showIf: (v) => v.duracao === 'ate' },
    { name: 'avisoReversao', type: 'number', section: 'vigencia', width: 'half', min: 1, max: 180, default: 30, label: l('Aviso para regressar ao trabalho presencial (dias)', 'Notice to return on site (days)') },
  ],

  computed: (v, ctx) => horasComputed(v, ctx),

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `O teletrabalho tem de ser acordado por escrito (${cite('teletrabalho')}). A lei remete as regras de pormenor para legislação especial ainda não publicada; reveja o acordo quando for publicada.`,
          'Remote work must be agreed in writing. Detailed rules are left to special legislation not yet published; review the agreement when it is.',
        ),
      },
    ];
    if (num(v.horasDia) != null && c.horasDia > c.horasDiaMax) {
      w.push({ level: 'warning', field: 'horasDia', message: l(`Excede o máximo de ${c.horasDiaMax} horas por dia (${cite('periodoNormalTrabalho')}).`, `Exceeds the ${c.horasDiaMax}-hour daily maximum.`) });
    }
    if (num(v.horasSemana) != null && c.horasSemana > c.horasSemanaMax) {
      w.push({ level: 'error', field: 'horasSemana', message: l(`Excede o máximo de ${c.horasSemanaMax} horas por semana (${cite('periodoNormalTrabalho')}).`, `Exceeds the ${c.horasSemanaMax}-hour weekly maximum.`) });
    }
    if (v.meiosControlo && !str(v.descricaoControlo)) {
      w.push({ level: 'warning', field: 'descricaoControlo', message: l(`Descreva os sistemas e a sua finalidade: o trabalhador tem de ser informado por escrito (${cite('vigilanciaDistancia')}).`, 'Describe the systems and their purpose: the employee must be told in writing.') });
    }
    if (v.duracao === 'ate' && v.dataFimAcordo && v.inicio && diffDays(v.inicio, v.dataFimAcordo) <= 0) {
      w.push({ level: 'error', field: 'dataFimAcordo', message: l('O termo é anterior ao início.', 'The end is before the start.') });
    }
    if (!str(v.localTeletrabalho)) w.push({ level: 'warning', field: 'localTeletrabalho', message: l('Indique o local do teletrabalho.', 'Enter the remote work location.') });
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const w = wk(v.trabalhadorGenero);
    const aditamento = Boolean(v.contratoData);
    const parcial = v.regime === 'parcial';
    const equip = lineItems(v.equipamentos).filter((r) => str(r.item));
    const aviso = num(v.avisoReversao) ?? 30;
    const comp = money(v.compensacao);

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto e regime',
        text: parcial
          ? `1. ${w.O} passa a prestar a sua actividade em regime de teletrabalho parcial, a partir de **${dateLong(v.inicio)}**, trabalhando à distância ${str(v.diasTeletrabalho) ? `nos seguintes dias da semana: ${lc(str(v.diasTeletrabalho)).replace(/^(às|nas|aos)\s/, '')},` : 'nos dias acordados com a Entidade Empregadora'} e nas instalações da Entidade Empregadora${str(v.localEmpresa) ? ` (${str(v.localEmpresa)})` : ''} nos restantes dias.\n2. O teletrabalho consiste na prestação de trabalho fora das instalações da Entidade Empregadora, com recurso a tecnologias de informação e comunicação, mantendo-se a subordinação jurídica ${w.do} à Entidade Empregadora.`
          : `1. ${w.O} passa a prestar a sua actividade em regime de teletrabalho, a partir de **${dateLong(v.inicio)}**.\n2. O teletrabalho consiste na prestação de trabalho fora das instalações da Entidade Empregadora, com recurso a tecnologias de informação e comunicação, mantendo-se a subordinação jurídica ${w.do} à Entidade Empregadora.`,
        en: `From ${v.inicio || '—'} the Employee works remotely${parcial ? ' part of the week, on the agreed days, and on site on the other days' : ''}, using information and communication technology, still under the Employer’s direction.`,
      },
      {
        id: 'local',
        heading: 'Local',
        text: `O teletrabalho é prestado no seguinte local: ${str(v.localTeletrabalho).replace(/\.$/, '') || BLANK}. Qualquer alteração deste local é comunicada previamente, por escrito, à Entidade Empregadora.`,
        en: 'Remote work is done from the stated location. Any change must be notified in advance in writing.',
      },
      {
        id: 'horario',
        heading: 'Tempo de trabalho e contacto',
        text: `1. Mantém-se o período normal de trabalho de ${qty(c.horasDia, 'hora', 'horas', true)} diárias e ${qty(c.horasSemana, 'hora', 'horas', true)} semanais${str(v.horario) ? `, ${lc(str(v.horario).replace(/\.$/, ''))}` : ''}, nos termos ${doCite('periodoNormalTrabalho')}.\n2. Durante o horário de trabalho, ${w.o} mantém-se contactável através de ${str(v.meiosContacto) || BLANK}.\n3. Fora do horário de trabalho, ${w.o} não é ${w.a('obrigado', 'obrigada')} a responder a contactos profissionais, salvo em situações urgentes e excepcionais.`,
        en: `Normal hours remain ${c.horasDia} a day and ${c.horasSemana} a week. The Employee is reachable during working hours and need not respond outside them except in urgent cases.`,
      },
      {
        id: 'equipamentos',
        heading: 'Equipamentos',
        text: equip.length
          ? `1. A Entidade Empregadora fornece ${w.ao} os seguintes equipamentos, que continuam a ser sua propriedade: ${enumerate(equip.map((r) => `${str(r.item)}${str(r.serie) ? ` (n.º ${str(r.serie)})` : ''}`)).map((t, i) => `${String.fromCharCode(97 + i)}) ${t}`).join(' ')}\n2. ${w.O} utiliza os equipamentos apenas para fins profissionais, zela pela sua boa conservação e devolve-os no termo do presente acordo ou quando lhe forem pedidos.`
          : `${w.O} utiliza equipamento próprio, devendo a Entidade Empregadora assegurar as aplicações informáticas e os acessos necessários ao trabalho.`,
        en: equip.length ? 'The Employer provides the listed equipment, which remains its property; it is for work use only and must be returned at the end.' : 'The Employee uses their own equipment; the Employer provides the software and access needed.',
      },
      {
        id: 'despesas',
        heading: 'Despesas',
        text:
          comp != null
            ? v.compensacaoForma === 'comprovativo'
              ? `A Entidade Empregadora reembolsa ${w.ao} as despesas de comunicações e energia decorrentes do teletrabalho, até ao limite mensal de ${moneyExt(v.compensacao)}, mediante apresentação dos comprovativos.`
              : `A Entidade Empregadora paga ${w.ao}, juntamente com a remuneração, uma compensação mensal de ${moneyExt(v.compensacao)} pelas despesas de comunicações e energia decorrentes do teletrabalho.`
            : `As despesas de comunicações e energia decorrentes do teletrabalho são suportadas nos termos que as partes venham a acordar por escrito.`,
        en: comp != null ? `The Employer pays up to ${comp} MT a month towards communication and power costs.` : 'Communication and power costs are covered as the parties agree in writing.',
      },
      {
        id: 'sigilo',
        heading: 'Segurança da informação e sigilo',
        text: `${w.O} cumpre as instruções da Entidade Empregadora sobre segurança informática e protecção de dados, não permite o acesso de terceiros à informação e aos equipamentos de trabalho e mantém a confidencialidade da informação a que tenha acesso.`,
        en: 'The Employee follows the Employer’s IT security and data protection instructions, does not let third parties access work information or equipment, and keeps information confidential.',
      },
      {
        id: 'controlo',
        heading: 'Controlo',
        text: v.meiosControlo
          ? `1. A Entidade Empregadora não utiliza meios de vigilância à distância para controlar o desempenho profissional ${w.do}.\n2. Para efeitos ${doCite('vigilanciaDistancia')}, informa-se ${w.o} de que existem os seguintes meios, destinados exclusivamente à segurança da informação: ${str(v.descricaoControlo).replace(/\.$/, '') || BLANK}.`
          : `A Entidade Empregadora não utiliza meios de vigilância à distância para controlar o desempenho profissional ${w.do}, nos termos ${doCite('vigilanciaDistancia')}.`,
        en: v.meiosControlo ? 'The Employer does not monitor performance remotely; the systems listed exist only for information security.' : 'The Employer does not use remote monitoring to control performance.',
      },
      {
        id: 'direitos',
        heading: 'Direitos e segurança no trabalho',
        text: `1. ${w.O} mantém os mesmos direitos e deveres dos trabalhadores em regime presencial, designadamente quanto à remuneração, férias, formação e progressão.\n2. As normas de higiene e segurança no trabalho aplicam-se ao teletrabalho. Qualquer visita ao local de teletrabalho depende de aviso prévio e do acordo ${w.do}.`,
        en: '1. The Employee keeps the same rights and duties as on-site staff (pay, leave, training, progression). 2. Health and safety rules apply; any visit to the remote location needs notice and the Employee’s consent.',
      },
      {
        id: 'vigencia',
        heading: 'Vigência e regresso ao regime presencial',
        text: `1. O presente acordo vigora ${v.duracao === 'ate' ? `até ${dateLong(v.dataFimAcordo)}` : 'por tempo indeterminado'}.\n2. Qualquer das partes pode pôr-lhe termo mediante comunicação escrita com a antecedência mínima de ${qty(aviso, 'dia', 'dias')}, regressando ${w.o} ao regime presencial, sem perda de quaisquer direitos.\n3. ${aditamento ? `Mantêm-se em vigor todas as demais cláusulas do contrato de trabalho celebrado em ${dateLong(v.contratoData)}.` : 'Em tudo o que não estiver previsto no presente acordo, aplica-se o contrato de trabalho e a Lei do Trabalho.'}`,
        en: `1. This agreement runs ${v.duracao === 'ate' ? `until ${v.dataFimAcordo || '—'}` : 'indefinitely'}. 2. Either party may end it with ${aviso} days’ written notice; the Employee then returns on site with no loss of rights. 3. All other terms of the employment contract remain in force.`,
      },
    ];

    return [
      { type: 'title', text: aditamento ? 'Aditamento ao Contrato de Trabalho — Teletrabalho' : 'Acordo de Teletrabalho', subtitle: v.ref ? `N.º ${v.ref}` : undefined },
      { type: 'paragraph', id: 'entre', text: '**Entre:**', align: 'left', editable: false },
      { type: 'paragraph', id: 'parteEmpregador', text: `${employerParty(ctx, 'Entidade Empregadora')};`, en: 'The employer (the “Employer”);' },
      { type: 'paragraph', id: 'e', text: '**e**', align: 'left', editable: false },
      { type: 'paragraph', id: 'parteTrabalhador', text: `${str(v.trabalhadorCategoria) || str(v.trabalhadorCargo) ? workerParty(v).replace(/, adiante (designad[oa])/, `, com a categoria de ${str(v.trabalhadorCategoria) || str(v.trabalhadorCargo)}, adiante $1`) : workerParty(v)};`, en: 'The employee (the “Employee”);' },
      {
        type: 'paragraph',
        id: 'celebracao',
        text: `É celebrado o presente ${aditamento ? `aditamento ao contrato de trabalho celebrado em ${dateLong(v.contratoData)}` : 'acordo de teletrabalho'}, nos termos ${doCite('teletrabalho')}, que se rege pelas cláusulas seguintes:`,
        en: 'The parties enter into this remote work agreement on the following terms:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      {
        type: 'paragraph',
        id: 'exemplares',
        text: 'O presente acordo é feito em dois exemplares de igual valor, ficando um em poder de cada uma das partes.',
        en: 'Made in two counterparts of equal value, one for each party.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [employerSig(ctx), workerSignature(v)] },
    ];
  },
});
