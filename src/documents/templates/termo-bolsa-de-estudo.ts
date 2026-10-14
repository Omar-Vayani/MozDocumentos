// Termo de compromisso de bolsa de estudo: a company, foundation, NGO, church,
// private school or sponsor grants a scholarship and the student (with the
// parent when under 18) accepts its conditions. State scholarships (Instituto
// de Bolsas de Estudo) and foreign-government scholarships use their own
// contracts. When the student is the sponsor's employee, the Labour Law rules
// on training and worker-students apply.

import { yearsBetween } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, dateField, dateLong, DOC_TIPO_OPTIONS, employerParty, employerSignature, formatMoney, GENERO_OPTIONS, isF, l, localField, money } from './_shared';
import { foroField } from './_contratos';
import { num, pct, quantos, rows, semPonto, str } from './_educacao';

function bolseiroParty(v: Values): string {
  const f = isF(v.bolseiroGenero);
  const parts = [
    `**${str(v.bolseiroNome) || BLANK}**`,
    v.bolseiroNascimento ? `${f ? 'nascida' : 'nascido'} a ${dateLong(v.bolseiroNascimento)}` : '',
    str(v.bolseiroDocNumero) ? `${f ? 'portadora' : 'portador'} do ${str(v.bolseiroDocTipo) || 'BI'} n.º ${str(v.bolseiroDocNumero)}` : '',
    str(v.bolseiroNuit) ? `NUIT ${str(v.bolseiroNuit)}` : '',
    str(v.bolseiroMorada) ? `residente em ${semPonto(v.bolseiroMorada)}` : '',
  ].filter(Boolean);
  return `${parts.join(', ')}, adiante ${f ? 'designada' : 'designado'} por **${f ? 'Bolseira' : 'Bolseiro'}**`;
}

const menor = (v: Values, today: string) => Boolean(v.bolseiroNascimento) && yearsBetween(v.bolseiroNascimento, str(v.data) || today) < 18;

export default defineTemplate({
  id: 'termo-bolsa-de-estudo',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Termo', 'Agreement') },
    { id: 'bolseiro', title: l('Bolseiro', 'Scholarship holder'), personRole: 'outro' },
    { id: 'encarregado', title: l('Encarregado de educação (se menor)', 'Parent / guardian (if minor)') },
    { id: 'bolsa', title: l('Curso e bolsa', 'Course and scholarship') },
    { id: 'deveres', title: l('Deveres e cessação', 'Duties and termination') },
  ],
  fields: [
    localField(),
    dateField(),
    { name: 'bolsaNome', type: 'text', section: 'documento', label: l('Nome do programa de bolsas (opcional)', 'Scholarship programme (optional)'), placeholder: l('Ex.: Programa de Bolsas de Mérito 2027', 'E.g. Merit Scholarship Programme 2027') },
    { name: 'bolseiroNome', type: 'text', section: 'bolseiro', required: true, label: l('Nome completo', 'Full name'), personKey: 'nome' },
    { name: 'bolseiroGenero', type: 'radio', section: 'bolseiro', width: 'half', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'bolseiroNascimento', type: 'date', section: 'bolseiro', width: 'half', label: l('Data de nascimento', 'Date of birth') },
    { name: 'bolseiroDocTipo', type: 'select', section: 'bolseiro', width: 'half', label: l('Documento', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', personKey: 'docTipo' },
    { name: 'bolseiroDocNumero', type: 'text', section: 'bolseiro', width: 'half', label: l('Número do documento', 'Document number'), personKey: 'docNumero' },
    { name: 'bolseiroNuit', type: 'text', section: 'bolseiro', width: 'half', label: l('NUIT (opcional)', 'NUIT (optional)'), personKey: 'nuit' },
    { name: 'bolseiroTelefone', type: 'tel', section: 'bolseiro', width: 'half', label: l('Telefone', 'Phone') },
    { name: 'bolseiroMorada', type: 'text', section: 'bolseiro', label: l('Residência', 'Address'), personKey: 'morada' },
    { name: 'trabalhador', type: 'toggle', section: 'bolseiro', label: l('O bolseiro é trabalhador da entidade concedente', 'The student is an employee of the sponsor') },
    { name: 'encarregadoNome', type: 'text', section: 'encarregado', label: l('Nome do encarregado', "Parent's name") },
    { name: 'encarregadoGenero', type: 'radio', section: 'encarregado', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'encarregadoDocNumero', type: 'text', section: 'encarregado', width: 'half', label: l('N.º do BI', 'ID number') },
    { name: 'curso', type: 'text', section: 'bolsa', required: true, label: l('Curso', 'Course'), placeholder: l('Ex.: Licenciatura em Engenharia Informática · 11.ª e 12.ª classes', 'E.g. BSc Computer Engineering') },
    { name: 'instituicao', type: 'text', section: 'bolsa', required: true, label: l('Instituição de ensino', 'School / university') },
    { name: 'duracaoAnos', type: 'number', section: 'bolsa', width: 'half', min: 1, label: l('Duração prevista (anos lectivos)', 'Expected duration (years)'), default: 4 },
    { name: 'dataInicio', type: 'date', section: 'bolsa', width: 'half', label: l('Início', 'Start') },
    { name: 'tipoBolsa', type: 'radio', section: 'bolsa', label: l('Tipo de bolsa', 'Type'), options: [
      { value: 'integral', label: l('Integral', 'Full') },
      { value: 'parcial', label: l('Parcial', 'Partial') },
    ], default: 'integral' },
    {
      name: 'beneficios',
      type: 'lines',
      section: 'bolsa',
      required: true,
      label: l('Benefícios', 'Benefits'),
      addLabel: l('Adicionar benefício', 'Add benefit'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description'), placeholder: l('Ex.: propinas pagas à instituição', 'E.g. tuition paid to the school') },
        { name: 'valor', type: 'money', label: l('Valor (opcional)', 'Amount (optional)') },
        { name: 'periodicidade', type: 'text', label: l('Periodicidade', 'Frequency'), placeholder: l('Ex.: mensal · anual · por semestre', 'E.g. monthly') },
      ],
      default: [],
    },
    { name: 'diaSubsidio', type: 'number', section: 'bolsa', width: 'half', min: 1, max: 31, label: l('Subsídio pago até ao dia', 'Allowance paid by day') },
    { name: 'contaBolseiro', type: 'text', section: 'bolsa', width: 'half', label: l('Conta / M-Pesa do bolseiro', "Student's account / M-Pesa") },
    { name: 'aproveitamentoMinimo', type: 'text', section: 'deveres', label: l('Aproveitamento mínimo exigido', 'Minimum results'), default: 'média anual igual ou superior a 12 valores e aprovação em pelo menos três quartos das disciplinas' },
    { name: 'comprovativos', type: 'select', section: 'deveres', width: 'half', label: l('Entregar comprovativos de aproveitamento', 'Proof of results due'), options: [
      { value: 'no fim de cada semestre', label: l('No fim de cada semestre', 'Each semester') },
      { value: 'no fim de cada trimestre', label: l('No fim de cada trimestre', 'Each term') },
      { value: 'no fim de cada ano lectivo', label: l('No fim de cada ano lectivo', 'Each year') },
    ], default: 'no fim de cada semestre' },
    { name: 'tolerancia', type: 'toggle', section: 'deveres', label: l('Admitir um ano de tolerância por insuficiência de aproveitamento', 'Allow one grace year for poor results'), default: true },
    { name: 'renunciaDias', type: 'number', section: 'deveres', width: 'half', min: 0, label: l('Aviso de renúncia (dias)', 'Notice to give up (days)'), default: 30 },
    { name: 'reembolso', type: 'toggle', section: 'deveres', label: l('Reembolso em caso de abandono injustificado ou falsas declarações', 'Refund for unjustified abandonment or false statements') },
    { name: 'reembolsoPct', type: 'number', section: 'deveres', width: 'half', min: 0, max: 100, label: l('Percentagem a restituir', 'Share to refund (%)'), default: 100, showIf: (v) => Boolean(v.reembolso) },
    { name: 'contrapartida', type: 'toggle', section: 'deveres', label: l('Contrapartida: trabalhar para a entidade depois do curso', 'Work for the sponsor after the course') },
    { name: 'contrapartidaTipo', type: 'radio', section: 'deveres', label: l('Natureza', 'Nature'), options: [
      { value: 'obrigacao', label: l('Compromisso de prestar serviço', 'Commitment to work') },
      { value: 'prioridade', label: l('Só prioridade na admissão', 'Priority in hiring only') },
    ], default: 'prioridade', showIf: (v) => Boolean(v.contrapartida) },
    { name: 'contrapartidaMeses', type: 'number', section: 'deveres', width: 'half', min: 1, label: l('Durante (meses)', 'For (months)'), showIf: (v) => Boolean(v.contrapartida) && v.contrapartidaTipo === 'obrigacao' },
    { name: 'publicidade', type: 'toggle', section: 'deveres', label: l('O bolseiro autoriza a divulgação do seu nome e fotografia como bolseiro', 'Student allows publicity of name and photo') },
    { ...foroField('deveres'), width: 'half' },
  ],
  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (menor(v, ctx.today) && !str(v.encarregadoNome))
      w.push({ level: 'error', field: 'encarregadoNome', message: l('O bolseiro é menor de idade: o encarregado de educação deve assinar o termo.', 'The student is a minor: the parent must sign.') });
    if (!rows(v.beneficios).some((r) => str(r.descricao))) w.push({ level: 'warning', field: 'beneficios', message: l('Indique os benefícios da bolsa.', 'List the benefits.') });
    const dur = num(v.duracaoAnos);
    if (v.contrapartida && v.contrapartidaTipo === 'obrigacao' && dur && (num(v.contrapartidaMeses) ?? 0) > dur * 12)
      w.push({ level: 'warning', field: 'contrapartidaMeses', message: l('O período de contrapartida é maior que a duração do curso: a cláusula pode ser considerada excessiva. Confirme com um jurista.', 'The work commitment is longer than the course; the clause may be excessive.') });
    if (v.contrapartida && v.contrapartidaTipo === 'obrigacao' && v.reembolso && (num(v.reembolsoPct) ?? 0) >= 100)
      w.push({ level: 'warning', field: 'reembolsoPct', message: l('Reembolso total somado a uma obrigação de trabalho pode ser desproporcionado. Prefira um reembolso proporcional ao tempo de serviço em falta.', 'Full refund plus a work obligation may be disproportionate; prefer a pro-rata refund.') });
    if (v.trabalhador)
      w.push({ level: 'info', field: 'trabalhador', message: l('Bolseiro trabalhador: a formação dos trabalhadores no activo é dever do empregador e o trabalhador-estudante pode faltar para exames sem perda de remuneração, com aviso prévio (Lei do Trabalho). Confirme com um jurista qualquer obrigação de permanência.', 'Employee: training is an employer duty and worker-students may miss work for exams; check any obligation to stay with a lawyer.') });
    w.push({ level: 'info', message: l('As bolsas do Estado (Instituto de Bolsas de Estudo) e de governos estrangeiros usam contratos próprios: não use este modelo para elas.', 'State and foreign-government scholarships use their own contracts.') });
    return w;
  },
  personName: (v) => str(v.bolseiroNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.bolseiroGenero);
    const B = f ? 'Bolseira' : 'Bolseiro';
    const oB = `${f ? 'a' : 'o'} ${B}`;
    const OB = `${f ? 'A' : 'O'} ${B}`;
    const aoB = `${f ? 'à' : 'ao'} ${B}`;
    const doB = `${f ? 'da' : 'do'} ${B}`;
    const min = menor(v, ctx.today);
    const ben = rows(v.beneficios).filter((r) => str(r.descricao));
    const mensal = ben.some((r) => /mensal/i.test(str(r.periodicidade)));
    const enc = str(v.encarregadoNome);
    const fe = isF(v.encarregadoGenero);
    const clausulas: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `A Entidade Concedente atribui ${aoB} uma bolsa de estudo ${v.tipoBolsa === 'parcial' ? 'parcial' : 'integral'}${str(v.bolsaNome) ? `, no âmbito do ${semPonto(v.bolsaNome)}` : ''}, para a frequência do curso de **${semPonto(v.curso) || BLANK}**, na ${semPonto(v.instituicao) || BLANK}, com a duração prevista de ${quantos(num(v.duracaoAnos), 'ano lectivo', 'anos lectivos')}${v.dataInicio ? `, com início em ${dateLong(v.dataInicio)}` : ''}.`,
        en: 'The sponsor grants a scholarship for the stated course and institution.',
      },
      {
        id: 'beneficios',
        heading: 'Benefícios',
        text: ben.length ? 'A bolsa compreende os seguintes benefícios:' : `A bolsa compreende os benefícios seguintes: ${BLANK}.`,
        items: ben.map((r) => `${semPonto(r.descricao)}${money(r.valor) != null ? `, no valor de ${formatMoney(money(r.valor))}` : ''}${str(r.periodicidade) ? ` (${semPonto(r.periodicidade)})` : ''};`),
        en: 'Benefits of the scholarship.',
      },
      {
        id: 'pagamentos',
        heading: 'Pagamentos',
        text: `Os valores devidos à instituição de ensino são pagos directamente pela Entidade Concedente, contra factura.${mensal ? ` O subsídio mensal é pago ${aoB} até ao dia ${num(v.diaSubsidio) ?? BLANK} de cada mês${str(v.contaBolseiro) ? `, para ${semPonto(v.contaBolseiro)}` : ''}.` : ''}`,
        en: 'Tuition is paid directly to the institution; any allowance is paid monthly to the student.',
      },
      {
        id: 'deveres',
        heading: `Deveres ${doB}`,
        text: `${OB} obriga-se a:`,
        items: [
          'frequentar o curso com assiduidade e cumprir os regulamentos da instituição de ensino;',
          `obter aproveitamento escolar com ${semPonto(v.aproveitamentoMinimo) || BLANK};`,
          `entregar à Entidade Concedente, ${str(v.comprovativos) || 'no fim de cada semestre'}, a declaração de aproveitamento ou a pauta com as classificações obtidas;`,
          'comunicar de imediato qualquer mudança de curso ou de instituição, interrupção dos estudos ou atribuição de outra bolsa;',
          'utilizar os benefícios exclusivamente para os fins da bolsa e manter conduta compatível com a condição de bolseiro.',
        ],
        en: 'Student duties: attendance, minimum results, proof of results, report changes, proper use of benefits.',
      },
      {
        id: 'renovacao',
        heading: 'Renovação',
        text: `A bolsa é renovada em cada ano lectivo, desde que ${oB} cumpra os deveres da cláusula anterior.${v.tolerancia !== false ? ` Em caso de insuficiência de aproveitamento, a Entidade Concedente pode conceder um ano de tolerância, uma única vez durante o curso.` : ''}`,
        en: 'The scholarship is renewed yearly if duties are met; one grace year may be granted.',
      },
      {
        id: 'cessacao',
        heading: 'Suspensão e cessação',
        text: `1. A bolsa cessa por conclusão do curso, por insuficiência de aproveitamento não tolerada, por abandono ou interrupção injustificada dos estudos, por prestação de falsas declarações ou por sanção disciplinar grave aplicada pela instituição de ensino.\n2. ${OB} pode renunciar à bolsa a todo o tempo, mediante aviso escrito com ${quantos(num(v.renunciaDias), 'dia', 'dias')} de antecedência.\n3. A Entidade Concedente comunica por escrito a suspensão ou cessação da bolsa, indicando o motivo.`,
        en: 'Termination grounds, resignation by the student with notice, written notice of suspension.',
      },
    ];
    if (v.reembolso)
      clausulas.push({
        id: 'reembolso',
        heading: 'Restituição',
        text: `Em caso de abandono injustificado dos estudos ou de prestação de falsas declarações, ${oB} restitui ${pct(v.reembolsoPct)} dos valores recebidos, em prestações a acordar com a Entidade Concedente. Não há lugar a restituição quando a cessação resulte de insuficiência de aproveitamento, doença ou outro motivo atendível.`,
        en: 'Refund only for unjustified abandonment or false statements, not for poor results or illness.',
      });
    if (v.contrapartida)
      clausulas.push({
        id: 'contrapartida',
        heading: 'Contrapartida',
        text:
          v.contrapartidaTipo === 'obrigacao'
            ? `Concluído o curso, ${oB} compromete-se a prestar serviço à Entidade Concedente durante ${quantos(num(v.contrapartidaMeses), 'mês', 'meses')}, mediante contrato de trabalho remunerado nos termos da lei, se tal lhe for proposto no prazo de seis meses após a conclusão do curso.`
            : `Concluído o curso, ${oB} tem prioridade na admissão para as vagas da Entidade Concedente compatíveis com a sua formação.`,
        en: v.contrapartidaTipo === 'obrigacao' ? 'After the course the student will work for the sponsor for the stated period under a paid employment contract, if offered.' : 'Priority in hiring after the course.',
      });
    clausulas.push(
      {
        id: 'dados',
        heading: 'Dados pessoais e divulgação',
        text: v.publicidade
          ? `${OB} autoriza a Entidade Concedente a divulgar o seu nome e fotografia na qualidade de bolseiro, podendo retirar a autorização por escrito.`
          : `A Entidade Concedente usa os dados ${doB} apenas para a gestão da bolsa e não divulga o seu nome ou imagem sem autorização escrita.`,
        en: 'Use of personal data and publicity.',
      },
      { id: 'litigios', heading: 'Litígios', text: `As partes procuram resolver por acordo qualquer divergência. Não sendo possível, é competente o ${semPonto(v.foro) || 'tribunal judicial competente'}.`, en: 'Disputes: agreement first, then the competent court.' },
    );
    const sig: SignatureColumn[] = [employerSignature(ctx, 'A Entidade Concedente'), { role: OB, name: str(v.bolseiroNome) || undefined }];
    if (min || enc) sig.push({ role: fe ? 'A Encarregada de Educação' : 'O Encarregado de Educação', name: enc || undefined, detail: str(v.encarregadoDocNumero) ? `BI n.º ${str(v.encarregadoDocNumero)}` : undefined });
    const blocks: Block[] = [
      { type: 'title', text: 'Termo de Compromisso de Bolsa de Estudo', subtitle: str(v.bolsaNome) || undefined },
      {
        type: 'paragraph',
        id: 'partes',
        text: `Entre:\n${employerParty(ctx, 'Entidade Concedente')};\ne\n${bolseiroParty(v)}${enc ? `, ${min ? 'menor, ' : ''}representad${f ? 'a' : 'o'} neste acto pel${fe ? 'a sua encarregada' : 'o seu encarregado'} de educação **${enc}**${str(v.encarregadoDocNumero) ? `, ${fe ? 'portadora' : 'portador'} do BI n.º ${str(v.encarregadoDocNumero)}` : ''}` : ''},\né celebrado o presente termo de compromisso, que se rege pelas cláusulas seguintes:`,
        en: 'Between the sponsor and the student (represented by the parent if a minor), this scholarship agreement is made on the following terms:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clausulas },
      { type: 'paragraph', id: 'feito', text: `Feito em ${ctx.place}, aos ${dateLong(v.data)}, em dois exemplares de igual teor e valor, ficando um em poder de cada parte.`, en: 'Made in two copies of equal value.', keepWithNext: true },
      { type: 'signatures', columns: sig },
    ];
    return blocks;
  },
});
