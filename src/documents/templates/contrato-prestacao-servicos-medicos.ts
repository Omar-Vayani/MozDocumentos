// Contrato de prestação de serviços médicos: a clinic engages an independent
// doctor (or a doctor's company) for consultations, procedures or on-call work,
// with technical autonomy and fees per month, per act or per hour. The Labour
// Law presumes employment where there is economic dependence, so the contract
// keeps the doctor's autonomy explicit and the warnings say so.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { cite, dateLong, l, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, int, numerar, papel, partesBlocks, partyFields,
  partyName, partyWarnings, pct, quantos, semPonto, str, testemunhasField, valorTexto,
} from './_contratos';
import { ORDEM_MEDICOS } from './_saude';

const HONORARIOS_OPTIONS = [
  { value: 'mensal', label: l('Valor fixo mensal (avença)', 'Fixed monthly fee') },
  { value: 'acto', label: l('Percentagem do valor facturado por acto', 'Percentage of billed acts') },
  { value: 'hora', label: l('Valor por hora ou por turno', 'Per hour or per shift') },
];

export default defineTemplate({
  id: 'contrato-prestacao-servicos-medicos',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'clinica', title: l('Clínica (contratante)', 'Clinic (client)') },
    { id: 'medico', title: l('Médico (prestador)', 'Doctor (provider)'), personRole: 'outro' },
    { id: 'servicos', title: l('Serviços e disponibilidade', 'Services and availability') },
    { id: 'honorarios', title: l('Honorários', 'Fees') },
    { id: 'duracao', title: l('Duração e outras cláusulas', 'Term and other clauses') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('clinica', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('medico'),
    { name: 'medicoEspecialidade', type: 'text', section: 'medico', width: 'half', label: l('Especialidade', 'Specialty'), placeholder: l('Ex.: Pediatria · Clínica Geral', 'E.g. Paediatrics') },
    { name: 'medicoOrdemNumero', type: 'text', section: 'medico', width: 'half', required: true, label: l('Inscrição na Ordem dos Médicos n.º', 'Medical Council registration no.'), legal: l('Só pode exercer medicina quem está inscrito na Ordem dos Médicos.', 'Only registered doctors may practise.') },
    {
      name: 'servicos',
      type: 'textarea',
      section: 'servicos',
      rows: 3,
      required: true,
      label: l('Serviços a prestar', 'Services'),
      placeholder: l('Um por linha. Ex.:\nconsultas de pediatria\nurgência pediátrica em regime de escala\npequena cirurgia em ambulatório', 'One per line'),
    },
    { name: 'localServicos', type: 'text', section: 'servicos', label: l('Local de prestação', 'Place of work'), placeholder: l('Ex.: instalações da Clínica, Av. Eduardo Mondlane, n.º 2104, Maputo', 'E.g. the clinic’s premises') },
    { name: 'disponibilidade', type: 'text', section: 'servicos', label: l('Disponibilidade acordada', 'Agreed availability'), placeholder: l('Ex.: três manhãs por semana, em dias a acordar mensalmente', 'E.g. three mornings a week, agreed monthly') },
    { name: 'substituicao', type: 'toggle', section: 'servicos', default: true, label: l('O médico pode fazer-se substituir por colega habilitado, com acordo da clínica', 'The doctor may send a qualified substitute with the clinic’s consent') },
    { name: 'honorariosModo', type: 'select', section: 'honorarios', width: 'half', label: l('Modalidade', 'Basis'), options: HONORARIOS_OPTIONS, default: 'acto' },
    { name: 'honorariosValor', type: 'money', section: 'honorarios', width: 'half', label: l('Valor mensal / por hora', 'Monthly / hourly amount'), showIf: (v) => v.honorariosModo !== 'acto' },
    { name: 'honorariosPct', type: 'number', section: 'honorarios', width: 'half', min: 1, max: 100, label: l('Percentagem para o médico (%)', 'Doctor’s percentage (%)'), showIf: (v) => v.honorariosModo === 'acto' },
    { name: 'diaPagamento', type: 'number', section: 'honorarios', width: 'half', min: 1, max: 31, default: 10, label: l('Pagamento até ao dia (do mês seguinte)', 'Paid by day (of the next month)') },
    {
      name: 'seguro',
      type: 'radio',
      section: 'duracao',
      label: l('Seguro de responsabilidade civil profissional', 'Professional liability insurance'),
      options: [
        { value: 'medico', label: l('A cargo do médico', 'Paid by the doctor') },
        { value: 'clinica', label: l('A cargo da clínica', 'Paid by the clinic') },
        { value: 'nenhum', label: l('Não exigido', 'Not required') },
      ],
      default: 'medico',
    },
    { name: 'naoDesvio', type: 'toggle', section: 'duracao', default: true, label: l('Proibição de desviar doentes da clínica', 'No diverting the clinic’s patients') },
    { name: 'duracaoMeses', type: 'number', section: 'duracao', width: 'half', min: 1, max: 60, default: 12, label: l('Duração (meses)', 'Term (months)') },
    { name: 'dataInicio', type: 'date', section: 'duracao', width: 'half', label: l('Início', 'Start date'), default: (c) => c.today },
    { name: 'renovacao', type: 'toggle', section: 'duracao', default: true, label: l('Renovação automática por iguais períodos', 'Automatic renewal') },
    { name: 'avisoDias', type: 'number', section: 'duracao', width: 'half', min: 1, max: 180, default: 30, label: l('Aviso prévio para denúncia (dias)', 'Notice to terminate (days)') },
    foroField('duracao'),
    arbitragemField('duracao'),
    testemunhasField('duracao'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'clinica', 'clínica', 'clinic'), ...partyWarnings(v, 'medico', 'médico', 'doctor')];
    if (!str(v.medicoOrdemNumero)) w.push({ level: 'error', field: 'medicoOrdemNumero', message: l('Indique a inscrição do médico na Ordem dos Médicos: é obrigatória para exercer.', 'Enter the doctor’s Medical Council registration: it is mandatory.') });
    if (v.honorariosModo === 'acto' && !int(v.honorariosPct)) w.push({ level: 'warning', field: 'honorariosPct', message: l('Indique a percentagem do médico.', 'Enter the doctor’s percentage.') });
    if (v.honorariosModo !== 'acto' && money(v.honorariosValor) == null) w.push({ level: 'warning', field: 'honorariosValor', message: l('Indique o valor dos honorários.', 'Enter the fee.') });
    w.push({
      level: 'warning',
      message: l(
        `Prestação de serviços não é emprego: o médico não pode ter horário imposto, ordens sobre o modo de exercer nem depender economicamente da clínica. Se depender, a lei presume contrato de trabalho (${cite('presuncaoContratoTrabalho')}).`,
        'A service contract is not employment: no imposed hours, no orders on how to practise, no economic dependence. Otherwise the law presumes employment.',
      ),
    });
    w.push({ level: 'info', message: l('Os honorários estão sujeitos a IRPS (retenção na fonte) e podem estar sujeitos a imposto do selo. Confirme com o contabilista.', 'Fees are subject to income-tax withholding and may attract stamp duty. Check with an accountant.') });
    return w;
  },

  personName: (v) => partyName(v, 'medico') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const C2 = { ...papel(v, 'clinica', 'Clínica', 'Clínica', true), f: true, o: 'a Clínica', O: 'A Clínica', de: 'da Clínica', ao: 'à Clínica', pelo: 'pela Clínica' };
    const M = papel(v, 'medico', 'Médico', 'Médica');
    const servicos = str(v.servicos).split(/\n+/).map((s) => s.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim()).filter(Boolean);
    const esp = str(v.medicoEspecialidade);
    const modo = str(v.honorariosModo) || 'acto';
    const val = money(v.honorariosValor);
    const dia = int(v.diaPagamento);
    const meses = int(v.duracaoMeses);
    const aviso = int(v.avisoDias);
    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `Pelo presente contrato, ${M.o} obriga-se a prestar ${C2.ao}, em regime de prestação de serviços, serviços médicos${esp ? ` na área de ${esp}` : ''}, designadamente:`,
        en: 'The doctor will provide medical services to the clinic as an independent provider, namely:',
        items: servicos.length ? servicos.map((s, i) => `${s.replace(/[.;]+$/, '')}${i === servicos.length - 1 ? '.' : ';'}`) : ['____________________'],
      },
      {
        id: 'autonomia',
        heading: 'Autonomia técnica',
        text: numerar([
          `${M.O} exerce a sua actividade com plena autonomia técnica e deontológica, sem subordinação jurídica ${C2.ao}, decidindo livremente sobre os actos clínicos que pratica.`,
          `${C2.O} não fixa a ${M.o} horário de trabalho; ${str(v.disponibilidade) ? `as partes acordam a seguinte disponibilidade: ${semPonto(v.disponibilidade)}, sendo a escala` : 'a escala de disponibilidade é'} acordada mensalmente entre ambos.`,
          v.substituicao ? `${M.O} pode fazer-se substituir por colega devidamente habilitado e inscrito na ${ORDEM_MEDICOS}, mediante acordo prévio ${C2.de}.` : '',
        ]),
        en: 'The doctor has full technical autonomy, no subordination and no fixed working hours; availability is agreed monthly; substitution by a qualified colleague with consent.',
      },
      {
        id: 'habilitacao',
        heading: 'Habilitação profissional',
        text: numerar([
          `${M.O} declara estar ${M.f ? 'inscrita' : 'inscrito'} na ${ORDEM_MEDICOS} sob o n.º ${str(v.medicoOrdemNumero) || '________'}, obrigando-se a manter a inscrição válida durante todo o contrato e a informar de imediato ${C2.o} de qualquer suspensão.`,
          v.seguro === 'medico'
            ? `${M.O} mantém em vigor seguro de responsabilidade civil profissional e entrega cópia da apólice ${C2.ao}.`
            : v.seguro === 'clinica'
              ? `${C2.O} inclui ${M.o} no seu seguro de responsabilidade civil profissional.`
              : '',
        ]),
        en: 'The doctor is registered with the Medical Council and keeps the registration valid; professional liability insurance as agreed.',
      },
      {
        id: 'local',
        heading: 'Local e meios',
        text: `Os serviços são prestados em ${semPonto(v.localServicos) || 'instalações da Clínica'}. ${C2.O} disponibiliza as instalações licenciadas, o equipamento, os materiais e o pessoal auxiliar necessários, e assegura o agendamento, a facturação aos doentes e às seguradoras e a guarda dos processos clínicos.`,
        en: 'The clinic provides licensed premises, equipment, materials and support staff, and handles bookings, billing and custody of clinical files.',
      },
      {
        id: 'honorarios',
        heading: 'Honorários',
        text: numerar([
          modo === 'acto'
            ? `Pelos serviços prestados, ${M.o} recebe ${pct(v.honorariosPct)} do valor efectivamente cobrado pelos actos que pratica, excluídos os medicamentos, materiais e exames complementares.`
            : modo === 'hora'
              ? `Pelos serviços prestados, ${M.o} recebe ${valorTexto(val)} por hora de disponibilidade efectiva, conforme registo mensal confirmado pelas partes.`
              : `Pelos serviços prestados, ${M.o} recebe o valor mensal fixo de ${valorTexto(val)}.`,
          `${C2.O} envia ${M.ao} o mapa mensal dos actos ou horas e paga os honorários até ao dia ${dia ?? '____'} do mês seguinte, contra a emissão do respectivo recibo ou factura, com as retenções na fonte previstas na lei fiscal.`,
          `${M.O} não cobra directamente aos doentes da Clínica qualquer valor pelos actos abrangidos por este contrato.`,
        ]),
        en: 'Fees as agreed; monthly statement and payment against receipt, with tax withholding; no direct charges to patients.',
      },
      {
        id: 'sigilo',
        heading: 'Registos clínicos e sigilo',
        text: numerar([
          `${M.O} regista no processo clínico de cada doente os actos praticados. Os processos clínicos ficam à guarda ${C2.de}.`,
          'Ambas as partes guardam sigilo sobre a informação clínica dos doentes e sobre a informação comercial da outra parte, durante o contrato e depois de este terminar.',
        ]),
        en: 'The doctor records all acts in the clinical file kept by the clinic; both parties keep patient and business information confidential, during and after the contract.',
      },
    ];
    if (v.naoDesvio) {
      clauses.push({
        id: 'desvio',
        heading: 'Doentes da Clínica',
        text: `Durante o contrato, ${M.o} não pode encaminhar para consultório próprio ou de terceiros, para os mesmos actos, os doentes que lhe sejam marcados pela Clínica, salvo pedido expresso do doente ou necessidade clínica.`,
        en: 'The doctor may not divert the clinic’s patients to their own or another practice, unless the patient asks or it is clinically necessary.',
      });
    }
    clauses.push(
      {
        id: 'duracao',
        heading: 'Duração e cessação',
        text: numerar([
          `O contrato tem a duração de ${quantos(meses, 'mês', 'meses')}, com início em ${dateLong(v.dataInicio)}${v.renovacao ? ', renovando-se automaticamente por iguais períodos' : ''}.`,
          `Qualquer das partes pode denunciá-lo por escrito, com a antecedência mínima de ${quantos(aviso, 'dia', 'dias')}, sem necessidade de invocar motivo.`,
          'O contrato pode ser resolvido de imediato, por escrito, em caso de incumprimento grave, nomeadamente a suspensão da inscrição na Ordem, a violação do sigilo ou a falta de pagamento dos honorários.',
          `${M.O} conclui ou transfere para outro médico, de forma segura, o acompanhamento dos doentes em tratamento à data da cessação.`,
        ]),
        en: 'Term and renewal; termination on notice; immediate termination for serious breach; safe handover of patients.',
      },
      ...clausulasFinais(v),
    );
    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de Prestação de Serviços Médicos' },
      ...partesBlocks(v, [
        { p: 'clinica', role: C2, en: 'Clinic' },
        { p: 'medico', role: M, en: 'Doctor' },
      ]),
      {
        type: 'paragraph',
        id: 'celebracao',
        text: `É celebrado o presente contrato de prestação de serviços médicos, ao abrigo do ${cite('codigoCivilPrestacaoServicos')}, que se rege pelas cláusulas seguintes:`,
        en: 'This medical services contract is made on the following terms:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fecho(ctx, [assinatura(ctx, 'clinica', C2, true), assinatura(ctx, 'medico', M)]),
    ];
    return blocks;
  },
});

