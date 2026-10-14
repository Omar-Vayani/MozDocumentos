import { numeroPorExtenso } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, employerParty, employerSignature, formatMoney, l, localField, money, placeDate } from './_shared';
import { countText, ORDEM_MEDICOS } from './_saude';

const PERIODICIDADE_OPTIONS = [
  { value: 'anual', label: l('Anual', 'Yearly'), pt: 'uma vez por ano' },
  { value: 'semestral', label: l('Semestral', 'Every six months'), pt: 'uma vez por semestre' },
  { value: 'risco', label: l('Conforme o risco do posto de trabalho', 'According to job risk'), pt: 'com a periodicidade fixada para cada posto de trabalho no Anexo II' },
];
const PRECO_OPTIONS = [
  { value: 'capitacao', label: l('Valor mensal por trabalhador (capitação)', 'Monthly fee per worker'), en: '' },
  { value: 'acto', label: l('Por acto, segundo tabela de preços', 'Per service, per price list'), en: '' },
];
const MEDICAMENTOS_OPTIONS = [
  { value: 'incluidos', label: l('Incluídos no preço', 'Included in the price') },
  { value: 'tabela', label: l('Facturados pela tabela anexa', 'Billed per the price list') },
  { value: 'excluidos', label: l('Não incluídos', 'Not included') },
];

const ext = (n: number | null) => (n != null && n > 0 ? ` (${numeroPorExtenso(n)})` : '');

function empresaParty(v: Values): string {
  const parts = [
    `**${v.empresaNome || '____________________'}**`,
    v.empresaSede ? `com sede em ${v.empresaSede}` : '',
    v.empresaNuit ? `com o NUIT ${v.empresaNuit}` : '',
    v.empresaRepNome ? `neste acto representada por ${v.empresaRepNome}${v.empresaRepCargo ? `, na qualidade de ${v.empresaRepCargo}` : ''}` : '',
  ].filter(Boolean);
  return `${parts.join(', ')}, adiante designada por **Empresa**`;
}

export default defineTemplate({
  id: 'contrato-medicina-trabalho',
  family: 'contrato',
  sections: [
    { id: 'empresa', title: l('Empresa cliente', 'Client company') },
    { id: 'servicos', title: l('Serviços', 'Services') },
    { id: 'equipa', title: l('Médico responsável', 'Responsible doctor') },
    { id: 'preco', title: l('Preço e pagamento', 'Price and payment') },
    { id: 'duracao', title: l('Duração e litígios', 'Term and disputes') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'empresaNome', type: 'text', section: 'empresa', required: true, label: l('Firma da empresa', 'Company name') },
    { name: 'empresaSede', type: 'text', section: 'empresa', label: l('Sede', 'Registered office') },
    { name: 'empresaNuit', type: 'text', section: 'empresa', width: 'half', label: l('NUIT', 'NUIT') },
    { name: 'empresaRepNome', type: 'text', section: 'empresa', width: 'half', label: l('Representante', 'Representative') },
    { name: 'empresaRepCargo', type: 'text', section: 'empresa', width: 'half', label: l('Cargo do representante', 'Representative’s position') },
    { name: 'numeroTrabalhadores', type: 'number', section: 'empresa', width: 'half', min: 1, label: l('N.º de trabalhadores abrangidos', 'Number of workers covered') },
    { name: 'svAdmissao', type: 'toggle', section: 'servicos', default: true, label: l('Exames médicos de admissão', 'Pre-employment examinations') },
    { name: 'svPeriodicos', type: 'toggle', section: 'servicos', default: true, label: l('Exames médicos periódicos', 'Periodic examinations') },
    { name: 'periodicidade', type: 'select', section: 'servicos', width: 'half', label: l('Periodicidade', 'Frequency'), options: PERIODICIDADE_OPTIONS.map(({ value, label }) => ({ value, label })), default: 'anual', showIf: (v) => Boolean(v.svPeriodicos) },
    { name: 'svRegresso', type: 'toggle', section: 'servicos', default: true, label: l('Exames de regresso ao trabalho e ocasionais', 'Return-to-work and occasional examinations') },
    { name: 'svConsultas', type: 'toggle', section: 'servicos', default: true, label: l('Consultas de clínica geral aos trabalhadores', 'GP consultations for workers') },
    { name: 'svDependentes', type: 'toggle', section: 'servicos', label: l('Incluir os dependentes dos trabalhadores', 'Include workers’ dependants'), showIf: (v) => Boolean(v.svConsultas) },
    { name: 'svSocorros', type: 'toggle', section: 'servicos', default: true, label: l('Serviço de primeiros socorros', 'First-aid service') },
    {
      name: 'socorrosLocal',
      type: 'radio',
      section: 'servicos',
      label: l('Primeiros socorros', 'First aid'),
      options: [
        { value: 'local', label: l('No local de trabalho (posto da Prestadora)', 'At the workplace') },
        { value: 'clinica', label: l('Nas instalações da Prestadora', 'At the provider’s premises') },
      ],
      default: 'clinica',
      showIf: (v) => Boolean(v.svSocorros),
    },
    { name: 'svCampanhas', type: 'toggle', section: 'servicos', default: true, label: l('Campanhas de prevenção (malária, TB, HIV voluntário)', 'Prevention campaigns (malaria, TB, voluntary HIV)') },
    { name: 'svRelatorios', type: 'toggle', section: 'servicos', default: true, label: l('Relatórios estatísticos anónimos', 'Anonymous statistical reports') },
    { name: 'localServicos', type: 'text', section: 'servicos', label: l('Local de prestação', 'Place of service'), placeholder: l('Ex.: Clínica, Av. Eduardo Mondlane, n.º 2104, Maputo', 'E.g. the clinic’s address') },
    { name: 'horario', type: 'text', section: 'servicos', label: l('Horário', 'Hours'), placeholder: l('Ex.: dias úteis, das 07h30 às 17h00', 'E.g. weekdays 7:30–17:00') },
    { name: 'medicoNome', type: 'text', section: 'equipa', width: 'half', required: true, label: l('Médico do trabalho responsável', 'Responsible occupational doctor'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'medicoNumero', type: 'text', section: 'equipa', width: 'half', required: true, label: l('Carteira profissional n.º', 'Registration no.'), legal: l('Só médicos inscritos na Ordem dos Médicos podem exercer.', 'Only registered doctors may practise.') },
    { name: 'modeloPreco', type: 'radio', section: 'preco', label: l('Preço', 'Price'), options: PRECO_OPTIONS.map(({ value, label }) => ({ value, label })), default: 'capitacao' },
    { name: 'valorCapitacao', type: 'money', section: 'preco', width: 'half', label: l('Valor mensal por trabalhador', 'Monthly fee per worker'), showIf: (v) => v.modeloPreco === 'capitacao' },
    { name: 'medicamentos', type: 'select', section: 'preco', width: 'half', label: l('Medicamentos e exames complementares', 'Medicines and tests'), options: MEDICAMENTOS_OPTIONS, default: 'tabela' },
    { name: 'prazoPagamento', type: 'number', section: 'preco', width: 'half', min: 1, max: 90, default: 30, label: l('Pagamento das facturas em (dias)', 'Invoices payable within (days)') },
    { name: 'seguro', type: 'toggle', section: 'preco', label: l('A Prestadora mantém seguro de responsabilidade civil profissional', 'Provider keeps professional liability insurance') },
    { name: 'duracaoMeses', type: 'number', section: 'duracao', width: 'half', min: 1, max: 60, default: 12, label: l('Duração (meses)', 'Term (months)') },
    { name: 'dataInicio', type: 'date', section: 'duracao', width: 'half', label: l('Início', 'Start date'), default: (c) => c.today },
    { name: 'renovacao', type: 'toggle', section: 'duracao', default: true, label: l('Renovação automática por iguais períodos', 'Automatic renewal for equal periods') },
    { name: 'avisoDias', type: 'number', section: 'duracao', width: 'half', min: 1, max: 180, default: 60, label: l('Aviso para denúncia (dias)', 'Notice to terminate (days)') },
    { name: 'foro', type: 'text', section: 'duracao', width: 'half', label: l('Tribunal competente', 'Competent court'), default: (c) => `Tribunal Judicial da Cidade de ${c.profile?.morada?.cidade || 'Maputo'}` },
    localField(),
    dateField(),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!v.empresaNome) w.push({ level: 'warning', field: 'empresaNome', message: l('Indique a empresa cliente.', 'Enter the client company.') });
    if (!v.medicoNumero) {
      w.push({ level: 'error', field: 'medicoNumero', message: l('Indique a carteira profissional do médico responsável: a inscrição na Ordem dos Médicos é obrigatória.', 'Enter the responsible doctor’s registration number: Medical Council registration is mandatory.') });
    }
    if (v.modeloPreco === 'capitacao' && money(v.valorCapitacao) == null) w.push({ level: 'warning', field: 'valorCapitacao', message: l('Indique o valor por trabalhador.', 'Enter the fee per worker.') });
    w.push({ level: 'info', message: l('Este contrato pode estar sujeito a imposto do selo. Confirme junto da Direcção de Área Fiscal.', 'This contract may be subject to stamp duty. Check with the tax office.') });
    return w;
  },

  personName: (v) => v.empresaNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const servicos: string[] = [];
    if (v.svAdmissao) servicos.push('exames médicos de admissão dos trabalhadores e candidatos indicados pela Empresa');
    if (v.svPeriodicos) {
      const p = PERIODICIDADE_OPTIONS.find((x) => x.value === v.periodicidade) ?? PERIODICIDADE_OPTIONS[0];
      servicos.push(`exames médicos periódicos, ${p.pt}`);
    }
    if (v.svRegresso) servicos.push('exames de regresso ao trabalho após ausência por doença ou acidente, e exames ocasionais a pedido da Empresa ou do trabalhador');
    if (v.svConsultas) servicos.push(`consultas de clínica geral aos trabalhadores${v.svDependentes ? ' e aos seus dependentes' : ''}`);
    if (v.svSocorros) servicos.push(`serviço de primeiros socorros em caso de acidente, doença súbita, intoxicação ou indisposição, ${v.socorrosLocal === 'local' ? 'num posto instalado no local de trabalho' : 'nas instalações da Prestadora'}`);
    if (v.svCampanhas) servicos.push('campanhas de educação e prevenção em saúde (malária, tuberculose, HIV e outras), sendo o aconselhamento e a testagem de HIV sempre voluntários e confidenciais');
    if (v.svRelatorios) servicos.push('relatórios estatísticos periódicos, anónimos, sobre a saúde dos trabalhadores');

    const cap = money(v.valorCapitacao);
    const nt = Number(v.numeroTrabalhadores) || null;
    const meses = Number(v.duracaoMeses) || 0;
    const aviso = Number(v.avisoDias) || 0;
    const prazo = Number(v.prazoPagamento) || 0;
    const medIncl = v.medicamentos === 'incluidos'
      ? 'Os medicamentos de uso corrente e os exames complementares de rotina estão incluídos no preço.'
      : v.medicamentos === 'excluidos'
        ? 'Os medicamentos e os exames complementares não estão incluídos no preço e são suportados pela Empresa ou pelo trabalhador, conforme as regras internas da Empresa.'
        : 'Os medicamentos e os exames complementares são facturados à Empresa segundo a tabela de preços do Anexo I.';

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `Pelo presente contrato, a Prestadora obriga-se a prestar à Empresa serviços de medicina no trabalho${nt ? ` para cerca de ${countText(nt)} trabalhadores` : ''}, designadamente:`,
        en: 'The provider will supply occupational health services to the company, namely the services listed.',
        items: servicos.length ? servicos.map((x, i) => `${x}${i === servicos.length - 1 ? '.' : ';'}`) : ['____________________'],
      },
      {
        id: 'local',
        heading: 'Local e horário',
        text: `Os serviços são prestados em ${v.localServicos || '____________________'}${v.horario ? `, ${v.horario}` : ''}. As urgências são atendidas a qualquer hora, dentro da capacidade da Prestadora.`,
        en: 'Place and hours of service; emergencies are seen at any time within capacity.',
      },
      {
        id: 'equipa',
        heading: 'Equipa técnica',
        text: `A Prestadora garante que os médicos ao seu serviço estão inscritos na ${ORDEM_MEDICOS} e os enfermeiros na respectiva Ordem. É médico do trabalho responsável ${v.medicoNome || '____________________'}, carteira profissional n.º ${v.medicoNumero || '________'}.`,
        en: 'All doctors and nurses are registered with their professional orders; the responsible occupational doctor is named.',
      },
      {
        id: 'sigilo',
        heading: 'Sigilo médico e protecção de dados',
        text: `A Prestadora comunica à Empresa apenas a aptidão ou inaptidão dos trabalhadores para o trabalho, através de ficha de aptidão, nos termos do ${cite('examesMedicosTrabalho')}. Os processos clínicos ficam na posse e sob a responsabilidade da Prestadora e só são revelados com o consentimento expresso do trabalhador ou por imposição legal. A Empresa não pode pedir testes de HIV aos candidatos ou trabalhadores; o aconselhamento e a testagem voluntários são confidenciais e os seus resultados nunca são comunicados à Empresa.`,
        en: 'The company receives only fitness results; clinical files stay with the provider; no HIV testing at the company’s request, and voluntary results are never disclosed.',
      },
      {
        id: 'obrigacoes-empresa',
        heading: 'Obrigações da Empresa',
        text: 'A Empresa obriga-se a:',
        en: 'The company’s obligations.',
        items: [
          'enviar à Prestadora a lista dos trabalhadores abrangidos e mantê-la actualizada;',
          'informar a Prestadora sobre os riscos de cada posto de trabalho e facultar o acesso aos locais de trabalho;',
          'dispensar os trabalhadores, no horário de trabalho, para os exames e consultas;',
          'pagar o preço nos prazos acordados.',
        ],
      },
      {
        id: 'preco',
        heading: 'Preço e pagamento',
        text:
          v.modeloPreco === 'capitacao'
            ? `A Empresa paga à Prestadora o valor mensal de ${cap != null ? `**${formatMoney(cap)}**${ext(cap)}` : '____________________'} por trabalhador abrangido. A Prestadora emite factura mensal, que é paga no prazo de ${prazo ? countText(prazo) : '____'} dias a contar da sua recepção.`
            : `Os serviços são pagos por acto, segundo a tabela de preços do Anexo I. A Prestadora emite factura mensal, que é paga no prazo de ${prazo ? countText(prazo) : '____'} dias a contar da sua recepção.`,
        en: 'Price per worker per month or per service; monthly invoices payable within the agreed term.',
      },
      { id: 'medicamentos', heading: 'Medicamentos e exames complementares', text: medIncl, en: 'Medicines and tests as agreed.' },
    ];
    if (v.seguro) {
      clauses.push({ id: 'seguro', heading: 'Seguro', text: 'A Prestadora mantém em vigor, durante todo o contrato, seguro de responsabilidade civil profissional.', en: 'The provider keeps professional liability insurance.' });
    }
    clauses.push(
      {
        id: 'duracao',
        heading: 'Duração e denúncia',
        text: `O contrato tem a duração de ${meses ? countText(meses) : '____'} ${meses === 1 ? 'mês' : 'meses'}, com início em ${dateLong(v.dataInicio)}${v.renovacao ? ', e renova-se automaticamente por iguais períodos' : ''}. Qualquer das partes pode denunciá-lo por carta, com a antecedência mínima de ${aviso ? countText(aviso) : '____'} dias em relação ao seu termo.`,
        en: 'Term, renewal and notice of termination.',
      },
      {
        id: 'litigios',
        heading: 'Litígios',
        text: `Os litígios emergentes deste contrato são resolvidos por acordo e, na sua falta, pelo ${v.foro || 'Tribunal Judicial da Cidade de Maputo'}.`,
        en: 'Disputes go to the competent court if not settled by agreement.',
      },
    );

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de Prestação de Serviços de Medicina no Trabalho' },
      {
        type: 'paragraph',
        id: 'partes',
        text: `Entre:\n${employerParty(ctx, 'Prestadora')};\ne\n${empresaParty(v)};\né celebrado o presente contrato de prestação de serviços de medicina no trabalho, que se rege pelas cláusulas seguintes:`,
        en: 'Between the provider and the company, this occupational health services contract is made on the following terms.',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      { type: 'annexList', items: ['Anexo I — Tabela de preços', ...(v.periodicidade === 'risco' ? ['Anexo II — Exames por posto de trabalho e periodicidade'] : [])] },
      { type: 'paragraph', id: 'fecho', text: 'Feito em dois exemplares de igual valor, ficando um em poder de cada parte.', en: 'Made in two copies of equal value, one for each party.', keepWithNext: true },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [employerSignature(ctx, 'Pela Prestadora'), { role: 'Pela Empresa', name: v.empresaRepNome || undefined, detail: v.empresaRepCargo || undefined }],
      },
    ];
    return blocks;
  },
});
