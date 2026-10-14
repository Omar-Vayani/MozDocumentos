// Contrato de formação de condutores: a driving school licensed by INATRO and
// a learner, for the theory and practical training for a licence category.
// Exam registration, the learner's permit and the licence itself are INATRO
// procedures with official forms; exam fees are paid to INATRO.

import { isPublicBody } from '@/lib/storage/types';
import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, dateField, dateLong, DOC_TIPO_OPTIONS, employerParty, employerSignature, formatMoney, GENERO_OPTIONS, isF, l, localField, money } from './_shared';
import { foroField } from './_contratos';
import { juntar, licenca, num, quantos, rows, semPonto, str } from './_educacao';

function formandoParty(v: Values): string {
  const f = isF(v.formandoGenero);
  const parts = [
    `**${str(v.formandoNome) || BLANK}**`,
    v.formandoNascimento ? `${f ? 'nascida' : 'nascido'} a ${dateLong(v.formandoNascimento)}` : '',
    str(v.formandoDocNumero) ? `${f ? 'portadora' : 'portador'} do ${str(v.formandoDocTipo) || 'BI'} n.º ${str(v.formandoDocNumero)}` : '',
    str(v.formandoMorada) ? `residente em ${semPonto(v.formandoMorada)}` : '',
    str(v.formandoTelefone) ? `telefone ${str(v.formandoTelefone)}` : '',
  ].filter(Boolean);
  return `${parts.join(', ')}, adiante ${f ? 'designada' : 'designado'} por **${f ? 'Formanda' : 'Formando'}**`;
}

export default defineTemplate({
  id: 'contrato-escola-de-conducao',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Contrato', 'Contract') },
    { id: 'formando', title: l('Formando', 'Learner'), personRole: 'cliente' },
    { id: 'formacao', title: l('Formação', 'Training') },
    { id: 'preco', title: l('Preço e pagamento', 'Price and payment') },
    { id: 'regras', title: l('Regras', 'Rules') },
  ],
  fields: [
    localField(),
    dateField(),
    { name: 'formandoNome', type: 'text', section: 'formando', required: true, label: l('Nome completo', 'Full name'), personKey: 'nome' },
    { name: 'formandoGenero', type: 'radio', section: 'formando', width: 'half', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'formandoNascimento', type: 'date', section: 'formando', width: 'half', label: l('Data de nascimento', 'Date of birth') },
    { name: 'formandoDocTipo', type: 'select', section: 'formando', width: 'half', label: l('Documento', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', personKey: 'docTipo' },
    { name: 'formandoDocNumero', type: 'text', section: 'formando', width: 'half', label: l('Número do documento', 'Document number'), personKey: 'docNumero' },
    { name: 'formandoMorada', type: 'text', section: 'formando', label: l('Residência', 'Address'), personKey: 'morada' },
    { name: 'formandoTelefone', type: 'tel', section: 'formando', width: 'half', label: l('Telefone', 'Phone'), personKey: 'telefone' },
    { name: 'categoria', type: 'text', section: 'formacao', width: 'half', required: true, label: l('Categoria da carta', 'Licence category'), placeholder: l('Ex.: B (ligeiros)', 'E.g. B (light vehicles)') },
    { name: 'aulasTeoricas', type: 'number', section: 'formacao', width: 'half', min: 0, label: l('Aulas teóricas (n.º)', 'Theory lessons') },
    { name: 'aulasPraticas', type: 'number', section: 'formacao', width: 'half', min: 0, label: l('Aulas práticas (n.º)', 'Driving lessons') },
    { name: 'duracaoAula', type: 'number', section: 'formacao', width: 'half', min: 0, label: l('Duração de cada aula prática (minutos)', 'Length of each driving lesson (minutes)'), default: 50 },
    { name: 'validadeMeses', type: 'number', section: 'formacao', width: 'half', min: 1, label: l('Prazo para usar o pacote (meses)', 'Package valid for (months)'), default: 6 },
    { name: 'horario', type: 'text', section: 'formacao', label: l('Horário', 'Schedule'), placeholder: l('Ex.: teoria de segunda a sexta, 17h00–18h30; prática a combinar', 'E.g. theory weekdays 17:00–18:30') },
    {
      name: 'precos',
      type: 'lines',
      section: 'preco',
      required: true,
      label: l('Preços', 'Prices'),
      addLabel: l('Adicionar linha', 'Add line'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Item'), placeholder: l('Ex.: inscrição · pacote de formação · aula extra', 'E.g. registration · package · extra lesson') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
      default: [
        { descricao: 'Inscrição', valor: '' },
        { descricao: 'Pacote de formação teórica e prática', valor: '' },
        { descricao: 'Aula prática extra (cada)', valor: '' },
      ],
    },
    { name: 'prestacoes', type: 'number', section: 'preco', width: 'half', min: 1, label: l('Pagamento em prestações (n.º)', 'Instalments'), default: 1 },
    { name: 'incluiTaxas', type: 'toggle', section: 'preco', label: l('O preço inclui as taxas de exame do INATRO', 'Price includes INATRO exam fees') },
    { name: 'remarcacaoHoras', type: 'number', section: 'regras', width: 'half', min: 0, label: l('Aviso para desmarcar uma aula (horas)', 'Notice to cancel a lesson (hours)'), default: 24 },
    { name: 'restituicao', type: 'radio', section: 'regras', label: l('Em caso de desistência', 'On withdrawal'), options: [
      { value: 'proporcional', label: l('Restitui as aulas não dadas (menos a inscrição)', 'Refund lessons not given (minus registration)') },
      { value: 'nao', label: l('Não há restituição', 'No refund') },
    ], default: 'proporcional' },
    { name: 'instrutorLicenca', type: 'text', section: 'regras', width: 'half', label: l('Instrutor e n.º de licença (opcional)', 'Instructor and licence no. (optional)') },
    { ...foroField('regras'), width: 'half' },
  ],
  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (ctx.profile?.kind === 'empresa' && !isPublicBody(ctx.profile) && !licenca(ctx))
      w.push({ level: 'warning', message: l('Indique no perfil a licença (alvará) da escola de condução emitida pelo INATRO.', 'Add the INATRO driving-school licence to the profile.') });
    if (!rows(v.precos).some((r) => money(r.valor) != null)) w.push({ level: 'warning', field: 'precos', message: l('Indique os preços.', 'Enter the prices.') });
    w.push({ level: 'info', message: l('As idades mínimas por categoria, os exames e a licença de aprendizagem seguem o Código da Estrada e as regras do INATRO; confirme os requisitos da categoria antes de inscrever o formando.', 'Minimum ages, exams and the learner permit follow the Highway Code and INATRO rules; check the category requirements.') });
    if (!v.incluiTaxas) w.push({ level: 'info', field: 'incluiTaxas', message: l('As taxas de exame são pagas ao INATRO; o contrato diz que não estão incluídas.', 'Exam fees are paid to INATRO; the contract says they are not included.') });
    return w;
  },
  personName: (v) => str(v.formandoNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.formandoGenero);
    const F = f ? 'Formanda' : 'Formando';
    const oF = `${f ? 'a' : 'o'} ${F}`;
    const OF = `${f ? 'A' : 'O'} ${F}`;
    const aoF = `${f ? 'à' : 'ao'} ${F}`;
    const doF = `${f ? 'da' : 'do'} ${F}`;
    const precos = rows(v.precos).filter((r) => str(r.descricao));
    const lic = licenca(ctx);
    const clausulas: ClauseItem[] = [
      { id: 'objecto', heading: 'Objecto', text: `A Escola obriga-se a ministrar ${aoF} a formação teórica e prática necessária à preparação para os exames de condução da categoria **${semPonto(v.categoria) || BLANK}**, nos termos da legislação aplicável ao ensino de condução.`, en: 'The school provides the theory and practical training for the stated licence category.' },
      {
        id: 'formacao',
        heading: 'Formação',
        text: `A formação compreende ${quantos(num(v.aulasTeoricas), 'aula teórica', 'aulas teóricas', true)} e ${quantos(num(v.aulasPraticas), 'aula prática', 'aulas práticas', true)} de ${quantos(num(v.duracaoAula), 'minuto', 'minutos')} cada${str(v.horario) ? `, com o seguinte horário: ${semPonto(v.horario)}` : ''}. O pacote deve ser utilizado no prazo de ${quantos(num(v.validadeMeses), 'mês', 'meses')} a contar da assinatura.`,
        en: 'Number and length of lessons, schedule and validity of the package.',
      },
      {
        id: 'preco',
        heading: 'Preço',
        text: `${precos.length ? `Os preços são os seguintes: ${juntar(precos.map((r) => `${semPonto(r.descricao).toLowerCase()}, ${money(r.valor) != null ? formatMoney(money(r.valor)) : `${BLANK} MT`}`))}.` : `O preço é de ${BLANK} MT.`} ${(num(v.prestacoes) ?? 1) > 1 ? `O pacote pode ser pago em ${quantos(num(v.prestacoes), 'prestação', 'prestações', true)} mensais, a primeira na assinatura.` : 'O pagamento é feito na assinatura do contrato, contra recibo.'} ${v.incluiTaxas ? 'O preço inclui as taxas de exame devidas ao INATRO.' : 'As taxas de exame e de emissão da carta, devidas ao INATRO, não estão incluídas e são pagas pelo formando.'}`,
        en: 'Prices, payment and whether INATRO exam fees are included.',
      },
      { id: 'exames', heading: 'Exames', text: `A Escola apresenta ${oF} aos exames depois de concluída a formação mínima e de o instrutor considerar que está preparad${f ? 'a' : 'o'}. A repetição de exames e as aulas adicionais necessárias são pagas à parte, aos preços indicados.`, en: 'The school presents the learner to exams after the minimum training; repeats and extra lessons are paid separately.' },
      { id: 'veiculos', heading: 'Veículos e seguro', text: 'As aulas práticas são dadas em veículos aprovados para o ensino de condução, com duplos comandos, cobertos por seguro que abrange o formando durante as aulas.', en: 'Lessons in approved dual-control vehicles with insurance covering the learner.' },
      { id: 'instrutores', heading: 'Instrutores', text: `A formação é ministrada por instrutores licenciados${str(v.instrutorLicenca) ? ` (${semPonto(v.instrutorLicenca)})` : ''}. ${OF} pode pedir a mudança de instrutor, com fundamento.`, en: 'Licensed instructors; the learner may ask to change instructor.' },
      { id: 'faltas', heading: 'Faltas e remarcações', text: `As aulas práticas desmarcadas com menos de ${quantos(num(v.remarcacaoHoras), 'hora', 'horas', true)} de antecedência, ou a que ${oF} falte, consideram-se dadas, salvo motivo de força maior.`, en: 'Lessons cancelled late or missed count as given, except force majeure.' },
      { id: 'deveres', heading: `Deveres ${doF}`, text: `${OF} obriga-se a entregar os documentos exigidos para a inscrição, a ser pontual, a seguir as instruções do instrutor e a não conduzir sob a influência de álcool ou de substâncias que afectem a condução.`, en: 'Learner duties: documents, punctuality, follow instructions, no alcohol or drugs.' },
      {
        id: 'desistencia',
        heading: 'Desistência',
        text: v.restituicao === 'nao' ? `${OF} pode desistir a todo o tempo, por escrito, não havendo lugar a restituição dos valores pagos.` : `${OF} pode desistir a todo o tempo, por escrito. A Escola restitui o valor das aulas não dadas, deduzida a inscrição, no prazo de trinta dias.`,
        en: 'The learner may withdraw in writing; refund as stated.',
      },
      { id: 'litigios', heading: 'Litígios', text: `As partes procuram resolver por acordo qualquer divergência, sem prejuízo do direito de reclamação junto do INATRO e das entidades de defesa do consumidor. Não sendo possível o acordo, é competente o ${semPonto(v.foro) || 'tribunal judicial competente'}.`, en: 'Disputes: agreement, complaint to INATRO or consumer bodies, then the court.' },
    ];
    const party = employerParty(ctx, 'Escola');
    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de Formação de Condutores' },
      {
        type: 'paragraph',
        id: 'partes',
        text: `Entre:\n${lic ? party.replace(', adiante designada', `, titular da ${lic.replace(/^Alvará/, 'licença (alvará)')}, adiante designada`) : party};\ne\n${formandoParty(v)},\né celebrado o presente contrato de formação de condutores, que se rege pelas cláusulas seguintes:`,
        en: 'Between the driving school and the learner, this training contract is made on the following terms:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clausulas },
      { type: 'paragraph', id: 'feito', text: `Feito em ${ctx.place}, aos ${dateLong(v.data)}, em dois exemplares de igual teor e valor, ficando um em poder de cada parte.`, en: 'Made in two copies of equal value.', keepWithNext: true },
      { type: 'signatures', columns: [employerSignature(ctx, 'Pela Escola de Condução'), { role: OF, name: str(v.formandoNome) || undefined }] },
    ];
    return blocks;
  },
});
