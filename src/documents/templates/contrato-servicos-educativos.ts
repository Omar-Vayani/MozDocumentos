// Contrato de prestação de serviços educativos: a private school, nursery,
// training centre, language institute, tutoring centre or individual tutor
// and the parent/guardian (or the adult student). The parent is a consumer
// (Lei de Defesa do Consumidor); fees follow the private-education rules
// (annual amounts communicated to the authority, justified changes). The child
// keeps the right to attend tests and exams while a fee debt is pending.

import { isPublicBody, profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type ClauseItem, type TemplateContext, type Values, type Warning } from '../model';
import { BLANK, dateField, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, g, l, localField, money } from './_shared';
import {
  alunoFields, encarregadoFields, estudante, juntar, licenca, mesAno, NIVEL_OPTIONS, NIVEL_TEXTO, num, pct, quantos, rows, semPonto, str,
} from './_educacao';
import { foroField } from './_contratos';
import { inteiroPorExtenso, MAX_EXTENSO, numeroPorExtenso } from '@/lib/format';

const valor = (x: unknown) => {
  const n = money(x);
  if (n == null) return `${BLANK} MT`;
  return `**${formatMoney(n)}**${n > 0 && n <= MAX_EXTENSO ? ` (${numeroPorExtenso(n)})` : ''}`;
};

const PRESTADOR: Record<string, { n: string; m: boolean }> = {
  escola: { n: 'Escola', m: false },
  creche: { n: 'Escola', m: false },
  centro: { n: 'Centro', m: true },
  explicacoes: { n: 'Centro', m: true },
  explicador: { n: 'Explicador', m: true },
};

function escolaParty(ctx: TemplateContext, v: Values, des: string): string {
  const p = ctx.profile;
  if (!p) return `${BLANK}, adiante designado por **${des}**`;
  if (p.kind === 'pessoa') {
    const f = p.genero === 'F';
    const parts = [
      `**${p.nome || BLANK}**`,
      p.nacionalidade ? `de nacionalidade ${p.nacionalidade}` : '',
      p.docNumero ? `${f ? 'portadora' : 'portador'} do ${p.docTipo || 'BI'} n.º ${p.docNumero}` : '',
      p.nuit ? `NUIT ${p.nuit}` : '',
      addressLine(p) ? `residente em ${addressLine(p)}` : '',
      `que presta serviços de explicação a título individual`,
    ].filter(Boolean);
    const d = des === 'Explicador' && f ? 'Explicadora' : des;
    return `${parts.join(', ')}, adiante ${f ? 'designada' : 'designado'} por **${d}**`;
  }
  const m = PRESTADOR[str(v.prestadorTipo)]?.m ?? false;
  const parts = [
    `**${profileDisplayName(p) || BLANK}**`,
    licenca(ctx) ? `titular do ${licenca(ctx).replace(/^(Alvará|Licença)/, (x) => x.toLowerCase())}`.replace('titular do licença', 'titular da licença') : '',
    addressLine(p) ? `com sede em ${addressLine(p)}` : '',
    p.nuit ? `NUIT ${p.nuit}` : '',
    p.representanteNome ? `neste acto representada por ${p.representanteNome}${p.representanteCargo ? `, na qualidade de ${p.representanteCargo}` : ''}` : '',
  ].filter(Boolean);
  return `${parts.join(', ')}, adiante ${m ? 'designado' : 'designada'} por **${des}**`;
}

function encParty(v: Values, des: string): string {
  const f = v.encarregadoGenero === 'F';
  const parts = [
    `**${str(v.encarregadoNome) || BLANK}**`,
    str(v.encarregadoDocNumero) ? `${f ? 'portadora' : 'portador'} do ${str(v.encarregadoDocTipo) || 'BI'} n.º ${str(v.encarregadoDocNumero)}` : '',
    str(v.encarregadoMorada) ? `residente em ${semPonto(v.encarregadoMorada)}` : '',
    str(v.encarregadoTelefone) ? `telefone ${str(v.encarregadoTelefone)}` : '',
  ].filter(Boolean);
  return `${parts.join(', ')}, adiante ${f ? 'designada' : 'designado'} por **${des}**`;
}

export default defineTemplate({
  id: 'contrato-servicos-educativos',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Contrato', 'Contract') },
    { id: 'encarregado', title: l('Encarregado de educação (contratante)', 'Parent / guardian (client)'), personRole: 'cliente' },
    { id: 'aluno', title: l('Aluno (educando)', 'Pupil'), personRole: 'outro' },
    { id: 'servico', title: l('Serviço e ano lectivo', 'Service and school year') },
    { id: 'valores', title: l('Matrícula e propinas', 'Enrolment and fees') },
    { id: 'encargos', title: l('Outros encargos (opcional)', 'Other charges (optional)') },
    { id: 'regras', title: l('Atrasos, desistência e outras regras', 'Late payment, withdrawal and other rules') },
  ],
  fields: [
    localField(),
    dateField(),
    {
      name: 'prestadorTipo',
      type: 'select',
      section: 'documento',
      width: 'half',
      label: l('Quem presta o serviço', 'Provider'),
      options: [
        { value: 'escola', label: l('Escola / colégio', 'School') },
        { value: 'creche', label: l('Creche / escolinha (pré-escolar)', 'Nursery / pre-school') },
        { value: 'centro', label: l('Instituto ou centro de formação / línguas', 'Training or language centre') },
        { value: 'explicacoes', label: l('Centro de explicações', 'Tutoring centre') },
        { value: 'explicador', label: l('Explicador individual', 'Individual tutor') },
      ],
      default: (c) => (c.profile?.kind === 'pessoa' ? 'explicador' : 'escola'),
    },
    {
      name: 'contratante',
      type: 'radio',
      section: 'documento',
      label: l('Quem contrata', 'Who signs as client'),
      options: [
        { value: 'encarregado', label: l('O encarregado de educação (aluno menor)', 'The parent / guardian (minor pupil)') },
        { value: 'aluno', label: l('O próprio aluno (maior de idade)', 'The adult student'), },
      ],
      default: 'encarregado',
    },
    ...encarregadoFields(['nome', 'genero', 'parentesco', 'docTipo', 'docNumero', 'telefone', 'email', 'morada']).map((f) =>
      f.name === 'encarregadoParentesco' ? { ...f, showIf: (v: Values) => v.contratante !== 'aluno' } : f,
    ),
    ...alunoFields(['nome', 'genero', 'nascimento']).map((f) => ({ ...f, showIf: (v: Values) => v.contratante !== 'aluno' })),
    { name: 'nivel', type: 'select', section: 'servico', width: 'half', label: l('Nível / tipo de ensino', 'Level'), options: NIVEL_OPTIONS, default: 'primario' },
    { name: 'classe', type: 'text', section: 'servico', width: 'half', label: l('Classe, ano ou curso', 'Grade, year or course'), required: true, placeholder: l('Ex.: 3.ª classe · Inglês Intermédio', 'E.g. Grade 3 · Intermediate English') },
    { name: 'disciplinas', type: 'text', section: 'servico', label: l('Disciplinas (explicações)', 'Subjects (tutoring)'), placeholder: l('Ex.: Matemática e Física', 'E.g. Maths and Physics'), showIf: (v) => v.prestadorTipo === 'explicacoes' || v.prestadorTipo === 'explicador' },
    { name: 'sessoes', type: 'text', section: 'servico', label: l('Frequência das sessões (explicações)', 'Sessions (tutoring)'), placeholder: l('Ex.: 3 sessões semanais de 90 minutos, em grupo até 8 alunos', 'E.g. 3 weekly sessions of 90 minutes'), showIf: (v) => v.prestadorTipo === 'explicacoes' || v.prestadorTipo === 'explicador' },
    { name: 'anoLectivo', type: 'text', section: 'servico', width: 'half', required: true, label: l('Ano lectivo', 'School year'), default: (c) => (c.today || '').slice(0, 4) },
    {
      name: 'turno',
      type: 'select',
      section: 'servico',
      width: 'half',
      label: l('Turno', 'Shift'),
      options: [
        { value: '', label: l('— não indicar —', '— do not state —') },
        { value: 'da manhã', label: l('Manhã', 'Morning') },
        { value: 'da tarde', label: l('Tarde', 'Afternoon') },
        { value: 'integral', label: l('Dia inteiro', 'Full day') },
        { value: 'pós-laboral', label: l('Pós-laboral', 'After-work') },
      ],
      default: '',
    },
    { name: 'dataInicio', type: 'date', section: 'servico', width: 'half', required: true, label: l('Início do ano lectivo / curso', 'Start') },
    { name: 'dataFim', type: 'date', section: 'servico', width: 'half', required: true, label: l('Fim do ano lectivo / curso', 'End') },
    { name: 'matriculaValor', type: 'money', section: 'valores', width: 'half', label: l('Matrícula / inscrição', 'Enrolment fee') },
    {
      name: 'matriculaReembolso',
      type: 'select',
      section: 'valores',
      width: 'half',
      label: l('A matrícula é restituída?', 'Is the enrolment fee refundable?'),
      options: [
        { value: 'vaga', label: l('Só se a escola não garantir a vaga', 'Only if the school cannot provide the place') },
        { value: 'antesInicio', label: l('Sim, se desistir antes do início das aulas', 'Yes, if withdrawn before classes start') },
        { value: 'nao', label: l('Não é restituída', 'Not refundable') },
      ],
      default: 'vaga',
    },
    { name: 'propinaValor', type: 'money', section: 'valores', width: 'half', required: true, label: l('Propina mensal', 'Monthly fee') },
    { name: 'propinaMeses', type: 'number', section: 'valores', width: 'half', min: 1, max: 12, label: l('Número de prestações (meses)', 'Number of monthly instalments'), default: 10 },
    { name: 'primeiroMes', type: 'month', section: 'valores', width: 'half', label: l('Primeira prestação (mês)', 'First instalment (month)') },
    { name: 'propinaDia', type: 'number', section: 'valores', width: 'half', min: 1, max: 31, label: l('Pagar até ao dia', 'Pay by day'), default: 10 },
    {
      name: 'iva',
      type: 'radio',
      section: 'valores',
      label: l('IVA', 'VAT'),
      help: l('Desde 2026 as propinas podem estar sujeitas a IVA. Confirme com o seu contabilista.', 'Since 2026 tuition fees may be subject to VAT. Check with your accountant.'),
      options: [
        { value: 'incluido', label: l('Valores com IVA incluído', 'VAT included') },
        { value: 'acresce', label: l('Ao valor acresce IVA', 'Plus VAT') },
        { value: 'nao', label: l('Não mencionar', 'Do not mention') },
      ],
      default: 'incluido',
    },
    { name: 'formaPagamento', type: 'select', section: 'valores', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    { name: 'contaPagamento', type: 'text', section: 'valores', width: 'half', label: l('Conta / NIB / número M-Pesa', 'Account / NIB / M-Pesa no.'), default: (c) => c.profile?.nib || '' },
    { name: 'descontoAnual', type: 'number', section: 'valores', width: 'half', min: 0, max: 100, label: l('Desconto por pagamento anual (%)', 'Discount for paying the year upfront (%)') },
    { name: 'descontoIrmaos', type: 'number', section: 'valores', width: 'half', min: 0, max: 100, label: l('Desconto de irmãos (%)', 'Sibling discount (%)') },
    {
      name: 'encargos',
      type: 'lines',
      section: 'encargos',
      label: l('Outros encargos aceites', 'Other agreed charges'),
      help: l('Uniforme, material, alimentação, transporte, actividades extracurriculares, seguro escolar…', 'Uniform, materials, meals, transport, extracurricular activities, insurance…'),
      addLabel: l('Adicionar encargo', 'Add charge'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
        { name: 'periodicidade', type: 'text', label: l('Periodicidade', 'Frequency'), placeholder: l('Ex.: mensal · uma vez', 'E.g. monthly · once') },
      ],
      default: [],
    },
    { name: 'avisoAlteracaoDias', type: 'number', section: 'regras', width: 'half', min: 0, label: l('Aviso prévio de alteração de valores (dias)', 'Notice of fee changes (days)'), default: 60 },
    { name: 'atrasoDias', type: 'number', section: 'regras', width: 'half', min: 1, label: l('Interpelação após atraso de (dias)', 'Written reminder after (days late)'), default: 15 },
    {
      name: 'penalizacao',
      type: 'select',
      section: 'regras',
      width: 'half',
      label: l('Penalização por atraso', 'Late-payment charge'),
      options: [
        { value: 'nenhuma', label: l('Nenhuma', 'None') },
        { value: 'percentagem', label: l('Percentagem sobre a prestação', 'Percentage of the instalment') },
        { value: 'juros', label: l('Juros de mora à taxa legal', 'Statutory default interest') },
      ],
      default: 'nenhuma',
    },
    { name: 'penalizacaoPct', type: 'number', section: 'regras', width: 'half', min: 0, label: l('Penalização (%)', 'Charge (%)'), showIf: (v) => v.penalizacao === 'percentagem' },
    { name: 'naoRenovacaoDias', type: 'number', section: 'regras', width: 'half', min: 0, label: l('Dívida que impede a renovação (dias de atraso)', 'Debt that blocks renewal (days late)'), default: 60 },
    {
      name: 'naoReterDocumentos',
      type: 'toggle',
      section: 'regras',
      label: l('A escola não retém documentos do aluno por dívidas', 'The school does not withhold documents over debts'),
      help: l('Boa prática recomendada. As Direcções de Educação proíbem impedir testes ou exames por falta de pagamento.', 'Recommended good practice.'),
      default: true,
    },
    { name: 'desistenciaAvisoDias', type: 'number', section: 'regras', width: 'half', min: 0, label: l('Aviso de desistência (dias)', 'Withdrawal notice (days)'), default: 30 },
    { name: 'restituicaoDias', type: 'number', section: 'regras', width: 'half', min: 0, label: l('Prazo para restituir valores (dias)', 'Refund period (days)'), default: 30 },
    {
      name: 'imagem',
      type: 'select',
      section: 'regras',
      label: l('Uso da imagem do aluno', 'Use of the pupil’s image'),
      options: [
        { value: 'nao', label: l('Não autorizado', 'Not authorised') },
        { value: 'interno', label: l('Só para fins internos e pedagógicos', 'Internal and teaching use only') },
        { value: 'publico', label: l('Também nas publicações e redes sociais da escola', 'Also in publications and social media') },
      ],
      default: 'interno',
    },
    { name: 'regulamentoEntregue', type: 'toggle', section: 'regras', label: l('O regulamento interno foi entregue', 'Internal rules were handed over'), default: true },
    { name: 'tabelaAnexa', type: 'toggle', section: 'regras', label: l('A tabela de propinas segue em anexo', 'Fee schedule attached'), default: false },
    { ...foroField('regras'), width: 'half' },
    { name: 'entidadeEducacao', type: 'text', section: 'regras', width: 'half', label: l('Direcção de Educação (reclamações)', 'Education directorate (complaints)'), default: (c) => `Direcção Provincial de Educação de ${c.profile?.morada?.provincia?.replace(/ Cidade$/, '') || 'Maputo'}` },
  ],
  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const indiv = v.prestadorTipo === 'explicador';
    if (!indiv && ctx.profile?.kind === 'empresa' && !isPublicBody(ctx.profile) && !licenca(ctx))
      w.push({ level: 'warning', message: l('Indique no perfil o alvará/licença do estabelecimento: o ensino privado sem licença é infracção.', 'Add the licence to the profile: private teaching without a licence is an offence.') });
    if (indiv || v.prestadorTipo === 'explicacoes')
      w.push({ level: 'info', message: l('Confirme se a sua actividade de explicações está abrangida pelo novo regime do ensino privado (2026), que exige licença às instituições privadas de ensino.', 'Check whether your tutoring activity is covered by the 2026 private-education rules, which require a licence.') });
    w.push({ level: 'info', message: l('As escolas privadas devem fixar os valores anualmente, comunicá-los às autoridades da Educação e fundamentar qualquer alteração (regime do ensino privado, 2026).', 'Private schools must set fees yearly, report them to the education authorities and justify any change (2026 rules).') });
    if (money(v.propinaValor) == null) w.push({ level: 'warning', field: 'propinaValor', message: l('Indique o valor da propina.', 'Enter the monthly fee.') });
    if (v.penalizacao === 'percentagem' && (num(v.penalizacaoPct) ?? 0) > 10)
      w.push({ level: 'warning', field: 'penalizacaoPct', message: l('Penalizações elevadas podem ser consideradas abusivas à luz da Lei de Defesa do Consumidor.', 'High late charges may be abusive under consumer law.') });
    if (!v.naoReterDocumentos)
      w.push({ level: 'warning', field: 'naoReterDocumentos', message: l('Reter documentos ou impedir o aluno de fazer testes por dívidas tem sido proibido pelas Direcções de Educação e pode ser prática abusiva.', 'Withholding documents or barring tests over debts has been prohibited by education directorates and may be abusive.') });
    if (v.iva !== 'nao') w.push({ level: 'info', field: 'iva', message: l('Desde 2026 as propinas podem estar sujeitas a IVA. As facturas e recibos fiscais saem do sistema de facturação da escola.', 'Since 2026 fees may carry VAT. Fiscal invoices come from the school’s billing system.') });
    if (v.dataInicio && v.dataFim && str(v.dataFim) < str(v.dataInicio)) w.push({ level: 'error', field: 'dataFim', message: l('A data de fim é anterior à de início.', 'End date is before start date.') });
    return w;
  },
  personName: (v) => str(v.alunoNome) || str(v.encarregadoNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
  blocks: (ctx) => {
    const v = ctx.values;
    const adulto = v.contratante === 'aluno';
    const pt0 = PRESTADOR[str(v.prestadorTipo)] ?? PRESTADOR.escola;
    const pt = v.prestadorTipo === 'explicador' && ctx.profile?.kind === 'pessoa' && ctx.profile.genero === 'F' ? { n: 'Explicadora', m: false } : pt0;
    const desP = pt.n;
    const P = desP;
    const fP = !pt.m;
    const aP = fP ? 'A' : 'O';
    const aPm = fP ? 'a' : 'o';
    const ap = `${aP} ${P}`;
    const apm = `${aPm} ${P}`;
    const daP = `${fP ? 'da' : 'do'} ${P}`;
    const fE = v.encarregadoGenero === 'F';
    const desE = adulto ? (fE ? 'Estudante' : 'Estudante') : fE ? 'Encarregada de Educação' : 'Encarregado de Educação';
    const E = desE;
    const oE = `${fE ? 'a' : 'o'} ${E}`;
    const OE = `${fE ? 'A' : 'O'} ${E}`;
    const doE = `${fE ? 'da' : 'do'} ${E}`;
    const aoE = `${fE ? 'à' : 'ao'} ${E}`;
    const al = estudante(v);
    const educ = adulto ? oE : `${al.f ? 'a' : 'o'} ${al.Educando}`;
    const doEduc = adulto ? doE : `${al.f ? 'da' : 'do'} ${al.Educando}`;
    const nivel = NIVEL_TEXTO[str(v.nivel)] ?? '';
    const explic = v.prestadorTipo === 'explicacoes' || v.prestadorTipo === 'explicador';
    const meses = num(v.propinaMeses);
    const dia = num(v.propinaDia);
    const ivaTxt = v.iva === 'incluido' ? ', com IVA incluído' : v.iva === 'acresce' ? ', a que acresce o IVA à taxa legal' : '';
    const conta = str(v.contaPagamento);
    const encargos = rows(v.encargos).filter((r) => str(r.descricao));

    const partes = adulto
      ? encParty(v, desE)
      : `${encParty(v, desE)}, na qualidade de ${str(v.encarregadoParentesco) && v.encarregadoParentesco !== 'outro' ? `${str(v.encarregadoParentesco).split('/')[fE ? 1 : 0] ?? str(v.encarregadoParentesco)} e ` : ''}${fE ? 'encarregada' : 'encarregado'} de educação ${al.f ? 'da menor' : 'do menor'} **${str(v.alunoNome) || BLANK}**${v.alunoNascimento ? `, ${al.nascido} a ${dateLong(v.alunoNascimento)}` : ''}, adiante ${al.f ? 'designada' : 'designado'} por **${al.Educando}**`;

    const objecto = explic
      ? `Pelo presente contrato, ${apm} obriga-se a prestar ${adulto ? aoE : `${al.f ? 'à' : 'ao'} ${al.Educando}`} serviços de explicação ${str(v.disciplinas) ? `nas disciplinas de ${semPonto(v.disciplinas)}` : ''}, correspondentes à ${semPonto(v.classe) || BLANK}${str(v.sessoes) ? `, com a frequência de ${semPonto(v.sessoes)}` : ''}, no ano lectivo de ${str(v.anoLectivo) || BLANK}.`
      : `Pelo presente contrato, ${apm} obriga-se a prestar ${adulto ? aoE : `${al.f ? 'à' : 'ao'} ${al.Educando}`} os serviços educativos correspondentes ${/^(o|a) /i.test(str(v.classe)) ? 'a' : 'à'} **${semPonto(v.classe) || BLANK}**${nivel && !['formação', 'curso de línguas', 'explicações', 'formação de condutores'].includes(nivel) ? ` do ${nivel}` : ''}, no ano lectivo de ${str(v.anoLectivo) || BLANK}, em regime presencial${str(v.turno) ? `, turno ${str(v.turno)}` : ''}, de acordo com os planos curriculares aprovados e o Regulamento Interno ${daP}.`;

    const reembolsoMat = v.matriculaReembolso === 'nao' ? 'não reembolsável' : v.matriculaReembolso === 'antesInicio' ? `restituída se ${oE} desistir por escrito antes do início das aulas` : `restituída se ${apm} não puder assegurar a vaga`;
    const clausulas: ClauseItem[] = [
      { id: 'objecto', heading: 'Objecto', text: objecto, en: 'The provider will deliver the educational services for the stated class/course and school year, under the approved curricula and internal rules.' },
      {
        id: 'duracao',
        heading: 'Duração',
        text: `O presente contrato vigora de ${dateLong(v.dataInicio)} a ${dateLong(v.dataFim)}, correspondente ao ano lectivo. A continuação no ano seguinte depende de nova matrícula ou renovação, nas condições então em vigor.`,
        en: 'The contract runs for the school year; continuing next year requires a new enrolment or renewal.',
      },
    ];
    if (money(v.matriculaValor) != null)
      clausulas.push({ id: 'matricula', heading: 'Matrícula', text: `Pela matrícula, ${oE} paga a quantia de ${valor(v.matriculaValor)}${ivaTxt}, ${reembolsoMat}.`, en: 'The enrolment fee and when it is refunded.' });
    clausulas.push({
      id: 'propinas',
      heading: 'Propinas',
      text: [
        `1. A propina mensal é de ${valor(v.propinaValor)}${ivaTxt}, devida durante ${quantos(meses, 'mês', 'meses')}${str(v.primeiroMes) ? `, a partir de ${mesAno(v.primeiroMes)}` : ''}.`,
        `2. A propina é paga até ao dia ${dia ?? BLANK} de cada mês, por ${str(v.formaPagamento) || BLANK}${conta ? ` (${conta})` : ''}, contra recibo.`,
        num(v.descontoAnual) ? `3. O pagamento antecipado de todo o ano lectivo tem o desconto de ${pct(v.descontoAnual)}.` : '',
        num(v.descontoIrmaos) ? `${num(v.descontoAnual) ? 4 : 3}. Os irmãos matriculados ${apm.startsWith('a') ? 'na mesma Escola' : `no mesmo ${P}`} beneficiam de um desconto de ${pct(v.descontoIrmaos)} na propina.` : '',
      ].filter(Boolean).join('\n'),
      en: 'Monthly fee, number of instalments, due date, payment method and discounts.',
    });
    clausulas.push({
      id: 'encargos',
      heading: 'Outros encargos',
      text: encargos.length
        ? `${oE.replace(/^./, (c) => c.toUpperCase())} aceita os seguintes encargos, além das propinas: ${juntar(encargos.map((r) => `${semPonto(r.descricao)}${money(r.valor) != null ? `, ${formatMoney(money(r.valor))}` : ''}${str(r.periodicidade) ? ` (${semPonto(r.periodicidade)})` : ''}`))}. Os encargos não previstos neste contrato só são devidos se aceites por escrito ${pelo(fE, E)}.`
        : `Além da matrícula e das propinas, os encargos não previstos neste contrato (uniforme, material, actividades, visitas de estudo) só são devidos se aceites por escrito ${pelo(fE, E)}.`,
      en: 'Other charges are owed only if listed here or accepted in writing.',
    });
    clausulas.push({
      id: 'alteracao',
      heading: 'Alteração dos valores',
      text: `Os valores fixados vigoram durante todo o ano lectivo. Qualquer alteração para o ano seguinte é fundamentada nos serviços efectivamente prestados, comunicada às autoridades competentes da Educação e ${aoE} com a antecedência mínima de ${quantos(num(v.avisoAlteracaoDias), 'dia', 'dias')}, nos termos da legislação aplicável ao ensino privado.`,
      en: 'Fees are fixed for the whole year; changes for the next year must be justified, reported to the authorities and notified in advance.',
    });
    const atraso = [
      `Em caso de atraso superior a ${quantos(num(v.atrasoDias), 'dia', 'dias')}, ${apm} interpela ${oE} por escrito para pagar o valor em dívida.`,
      v.penalizacao === 'percentagem' ? `Sobre cada prestação paga com atraso incide uma penalização de ${pct(v.penalizacaoPct)}.` : v.penalizacao === 'juros' ? 'Sobre os valores em atraso são devidos juros de mora à taxa legal, a contar da interpelação.' : '',
      `O atraso no pagamento não prejudica a frequência das aulas, testes e exames ${doEduc}, nem a sua participação nas actividades lectivas.`,
      num(v.naoRenovacaoDias) ? `Persistindo a dívida por mais de ${quantos(num(v.naoRenovacaoDias), 'dia', 'dias')}, ${apm} pode recusar a renovação da matrícula para o ano lectivo seguinte, sem prejuízo da cobrança pelos meios legais.` : '',
      v.naoReterDocumentos !== false ? `${ap} não retém documentos escolares ${doEduc} como meio de cobrança.` : '',
    ].filter(Boolean).map((t, i) => `${i + 1}. ${t}`);
    clausulas.push({ id: 'atraso', heading: 'Atraso no pagamento', text: atraso.join('\n'), en: 'Late payment: written reminder, optional charge; the pupil keeps attending classes, tests and exams; renewal may be refused; documents are not withheld.' });
    clausulas.push({
      id: 'deveresEscola',
      heading: `Obrigações ${daP}`,
      text: `${ap} obriga-se a:`,
      items: [
        'ministrar o ensino de acordo com os planos curriculares aprovados, com professores devidamente habilitados;',
        `zelar pela segurança e vigilância ${doEduc} no recinto escolar e durante as actividades organizadas ${fP ? 'pela' : 'pelo'} ${P};`,
        `informar ${oE} regularmente sobre o aproveitamento e a assiduidade ${doEduc}, pelo menos no fim de cada trimestre;`,
        'emitir recibo de todos os pagamentos recebidos;',
        'emitir as declarações e certificados nos termos regulamentares;',
        `comunicar de imediato ${aoE} qualquer acidente, doença ou ocorrência grave.`,
      ],
      en: 'Provider duties: teach the approved curriculum with qualified teachers, keep the pupil safe, report results each term, issue receipts and documents, report incidents immediately.',
    });
    clausulas.push({
      id: 'deveresEncarregado',
      heading: `Obrigações ${doE}`,
      text: `${OE} obriga-se a:`,
      items: [
        'pagar pontualmente os valores acordados;',
        `cumprir e fazer cumprir o Regulamento Interno ${daP};`,
        adulto ? 'frequentar as aulas com assiduidade e pontualidade;' : `garantir a assiduidade e a pontualidade ${doEduc} e justificar as faltas nos termos regulamentares;`,
        adulto ? '' : `comparecer às reuniões e sempre que for convocad${fE ? 'a' : 'o'};`,
        'manter actualizados os contactos e as informações de saúde relevantes;',
        `reparar os danos causados intencionalmente ao património ${daP}, nos termos gerais.`,
      ].filter(Boolean),
      en: 'Client duties: pay on time, follow the internal rules, ensure attendance, attend meetings, keep contacts and health data up to date, repair intentional damage.',
    });
    if (v.regulamentoEntregue !== false)
      clausulas.push({ id: 'regulamento', heading: 'Regulamento interno', text: `${OE} declara ter recebido e aceite o Regulamento Interno ${daP}, que faz parte integrante deste contrato. Em caso de contradição, prevalece o presente contrato.`, en: 'The client received and accepts the internal rules, which form part of the contract; this contract prevails.' });
    clausulas.push({
      id: 'saude',
      heading: 'Saúde e emergências',
      text: `${OE} informa ${apm} das condições de saúde relevantes ${doEduc}. Em caso de urgência, ${apm} presta os primeiros socorros, contacta de imediato ${oE} e, se necessário, encaminha ${educ} à unidade sanitária mais próxima.`,
      en: 'Health information and emergencies: first aid, immediate contact, referral to the nearest health unit.',
    });
    clausulas.push({
      id: 'dados',
      heading: 'Dados pessoais e imagem',
      text: `${ap} trata os dados ${doEduc} e ${doE} apenas para fins escolares e administrativos e não os cede a terceiros, salvo obrigação legal. ${v.imagem === 'publico' ? `É autorizada a captação de imagens ${doEduc} e a sua divulgação nas publicações e redes sociais ${daP}` : v.imagem === 'interno' ? `É autorizada a captação de imagens ${doEduc} apenas para fins internos e pedagógicos, não sendo permitida a sua divulgação pública` : `Não é autorizada a captação nem a divulgação de imagens ${doEduc}`}. A autorização pode ser alterada ou retirada a qualquer momento, por escrito.`,
      en: 'Personal data are used only for school purposes; image use as authorised; consent can be withdrawn in writing.',
    });
    clausulas.push({
      id: 'desistencia',
      heading: 'Desistência',
      text: `${OE} pode pôr termo ao contrato a todo o tempo, mediante aviso escrito com ${quantos(num(v.desistenciaAvisoDias), 'dia', 'dias')} de antecedência. São devidas as propinas até ao fim do mês em que termina o aviso; os valores pagos antecipadamente por meses seguintes são restituídos no prazo de ${quantos(num(v.restituicaoDias), 'dia', 'dias')}. ${ap} entrega os documentos necessários à transferência ${doEduc}.`,
      en: 'The client may end the contract with written notice; fees are owed until the end of the notice month; advance payments are refunded; transfer documents are handed over.',
    });
    clausulas.push({
      id: 'resolucao',
      heading: `Resolução ${fP ? 'pela' : 'pelo'} ${P}`,
      text: `${ap} só pode resolver o contrato por incumprimento grave e reiterado ${doE} ou por infracção disciplinar muito grave ${doEduc}, apurada nos termos do Regulamento Interno, mediante aviso escrito e, sempre que possível, no fim do período lectivo, de modo a não prejudicar a continuidade dos estudos ${doEduc}.`,
      en: 'The provider may terminate only for serious repeated breach or a very serious disciplinary offence, with written notice, preferably at the end of a term.',
    });
    clausulas.push({
      id: 'comunicacoes',
      heading: 'Comunicações',
      text: `As comunicações entre as partes fazem-se por escrito, entregues em mão ou por correio electrónico${str(v.encarregadoEmail) ? ` (${str(v.encarregadoEmail)}${ctx.profile?.email ? ` e ${ctx.profile.email}` : ''})` : ''}, podendo os avisos correntes ser enviados por SMS ou mensagem para ${str(v.encarregadoTelefone) || 'o telefone indicado'}.`,
      en: 'Notices in writing, by hand or e-mail; routine notices by SMS or message.',
    });
    clausulas.push({
      id: 'litigios',
      heading: 'Reclamações e litígios',
      text: `As partes procuram resolver qualquer divergência por acordo. Sem prejuízo do direito de reclamação junto da ${semPonto(v.entidadeEducacao) || 'Direcção de Educação competente'} e das entidades de defesa do consumidor, é competente o ${semPonto(v.foro) || 'tribunal judicial competente'}.`,
      en: 'Disputes: first by agreement; complaints to the education directorate and consumer bodies; then the competent court.',
    });

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de Prestação de Serviços Educativos', subtitle: `Ano lectivo ${str(v.anoLectivo) || BLANK}` },
      { type: 'paragraph', id: 'partes', text: `Entre:\n${escolaParty(ctx, v, desP)};\ne\n${partes},\né celebrado o presente contrato de prestação de serviços educativos, que se rege pelas cláusulas seguintes:`, en: 'Between the provider and the parent/guardian (or adult student), this education services contract is made on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: clausulas },
    ];
    if (v.tabelaAnexa) blocks.push({ type: 'annexList', items: ['Tabela de propinas e emolumentos do ano lectivo'] });
    blocks.push(
      { type: 'paragraph', id: 'feito', text: `Feito em ${ctx.place}, aos ${dateLong(v.data)}, em dois exemplares de igual teor e valor, ficando um em poder de cada parte.`, en: 'Made in two copies of equal value, one for each party.', keepWithNext: true },
      {
        type: 'signatures',
        columns: [
          { role: ctx.profile?.kind === 'pessoa' ? (ctx.profile.genero === 'F' ? 'A Explicadora' : 'O Explicador') : `Pel${fP ? 'a' : 'o'} ${P}`, name: ctx.profile?.kind === 'pessoa' ? ctx.profile.nome || undefined : ctx.profile?.representanteNome || undefined, detail: ctx.profile?.kind === 'pessoa' ? undefined : ctx.profile?.representanteCargo || undefined, image: 'both' },
          { role: adulto ? (fE ? 'A Estudante' : 'O Estudante') : fE ? 'A Encarregada de Educação' : 'O Encarregado de Educação', name: str(v.encarregadoNome) || undefined },
        ],
      },
    );
    void g;
    void inteiroPorExtenso;
    return blocks;
  },
});

function pelo(f: boolean, e: string): string {
  return `${f ? 'pela' : 'pelo'} ${e}`;
}
