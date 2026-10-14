// Relatório psicológico: report of a psychological assessment or follow-up,
// for the person, a school, a doctor, an employer or a court. Confidential;
// released to third parties only with consent (or by court order). No
// professional order of psychologists was found in Mozambique, so the
// registration line is optional and free text.

import { formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type OfficialUse, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, g, l, localField, refField } from './_shared';
import { CONFIDENCIAL, hivWarning, mentionsHiv, patientAge, patientFields } from './_saude';
import { lines, profFields, profSignature, str } from './_saude-educacao';

const TIPO_OPTIONS = [
  { value: 'avaliacao', label: l('Avaliação psicológica', 'Psychological assessment'), title: 'Relatório de Avaliação Psicológica' },
  { value: 'acompanhamento', label: l('Acompanhamento psicoterapêutico', 'Psychotherapy follow-up'), title: 'Relatório de Acompanhamento Psicológico' },
  { value: 'escolar', label: l('Avaliação psicopedagógica (escola)', 'Educational assessment (school)'), title: 'Relatório de Avaliação Psicopedagógica' },
  { value: 'pericial', label: l('Avaliação a pedido do tribunal', 'Court-ordered assessment'), title: 'Relatório de Avaliação Psicológica' },
];

const PEDIDO_OPTIONS = [
  { value: 'proprio', label: l('O próprio ou o encarregado', 'The person or their parent'), pt: 'a pedido {do avaliado}' },
  { value: 'escola', label: l('Escola', 'School'), pt: 'a pedido do estabelecimento de ensino' },
  { value: 'medico', label: l('Médico ou unidade sanitária', 'Doctor or facility'), pt: 'por referência médica' },
  { value: 'empregador', label: l('Entidade empregadora', 'Employer'), pt: 'a pedido da entidade empregadora' },
  { value: 'tribunal', label: l('Tribunal ou Ministério Público', 'Court or Public Prosecutor'), pt: 'em cumprimento do pedido do tribunal' },
];

const official = (v: Values): OfficialUse | undefined => (v.pedidoPor === 'tribunal' ? 'tribunal' : undefined);

const SECOES = [
  { name: 'motivo', titulo: 'Motivo do pedido', en: 'Reason for referral', required: true, rows: 2 },
  { name: 'historia', titulo: 'História relevante', en: 'Relevant history', rows: 3 },
  { name: 'observacao', titulo: 'Observação e comportamento nas sessões', en: 'Observation and behaviour', rows: 3 },
  { name: 'resultados', titulo: 'Resultados', en: 'Findings', required: true, rows: 4 },
  { name: 'conclusao', titulo: 'Conclusão', en: 'Conclusion', required: true, rows: 3 },
  { name: 'recomendacoes', titulo: 'Recomendações', en: 'Recommendations', rows: 3 },
];

export default defineTemplate({
  id: 'relatorio-psicologico',
  family: 'carta',
  official,
  sections: [
    { id: 'documento', title: l('Relatório e destinatário', 'Report and addressee') },
    { id: 'avaliado', title: l('Pessoa avaliada', 'Person assessed'), personRole: 'outro' },
    { id: 'metodo', title: l('Procedimentos', 'Procedures') },
    { id: 'relatorio', title: l('Conteúdo', 'Content') },
    { id: 'profissional', title: l('Psicólogo(a)', 'Psychologist') },
  ],
  fields: [
    refField(),
    localField(),
    dateField(),
    { name: 'tipo', type: 'select', section: 'documento', width: 'half', label: l('Tipo de relatório', 'Kind of report'), options: TIPO_OPTIONS.map(({ value, label }) => ({ value, label })), default: 'avaliacao' },
    { name: 'pedidoPor', type: 'select', section: 'documento', width: 'half', label: l('Pedido por', 'Requested by'), options: PEDIDO_OPTIONS.map(({ value, label }) => ({ value, label })), default: 'proprio' },
    {
      name: 'consentimento',
      type: 'toggle',
      section: 'documento',
      label: l('A pessoa (ou o encarregado) autorizou a entrega a esta entidade', 'The person (or parent) authorised release'),
      showIf: (v) => v.pedidoPor !== 'proprio' && v.pedidoPor !== 'tribunal',
    },
    { name: 'destinatario', type: 'textarea', section: 'documento', rows: 3, label: l('Destinatário (opcional)', 'Addressee (optional)'), help: l('Uma linha por linha do endereço. Em branco: "A quem possa interessar".', 'One line per address line.') },
    { name: 'processoTribunal', type: 'text', section: 'documento', width: 'half', label: l('Processo n.º (tribunal)', 'Case no. (court)'), showIf: (v) => v.pedidoPor === 'tribunal' },
    ...patientFields(['nome', 'genero', 'dataNascimento', 'idade'], 'avaliado', 'avaliado'),
    { name: 'escolaridade', type: 'text', section: 'avaliado', width: 'half', label: l('Escolaridade / classe (opcional)', 'Schooling / grade (optional)') },
    { name: 'encarregado', type: 'text', section: 'avaliado', width: 'half', label: l('Encarregado de educação (menores)', 'Parent or guardian (minors)') },
    { name: 'sessoes', type: 'number', section: 'metodo', width: 'half', min: 1, max: 500, label: l('N.º de sessões', 'Number of sessions') },
    { name: 'periodo', type: 'text', section: 'metodo', width: 'half', label: l('Período', 'Period'), placeholder: l('Ex.: de 4 de Agosto a 30 de Setembro de 2026', 'E.g. 4 August to 30 September 2026') },
    {
      name: 'instrumentos',
      type: 'textarea',
      section: 'metodo',
      rows: 3,
      label: l('Procedimentos e instrumentos', 'Procedures and instruments'),
      placeholder: l('Um por linha. Ex.:\nentrevista clínica com a criança e com a mãe\nobservação em contexto escolar\nWISC-IV (escala de inteligência)', 'One per line'),
    },
    ...SECOES.map((s) => ({ name: s.name, type: 'textarea' as const, section: 'relatorio', rows: s.rows, required: s.required, label: l(s.titulo, s.en) })),
    ...profFields('profissional', { profissao: 'Psicóloga clínica', profissaoF: 'Psicóloga clínica', registoLabel: ['Registo profissional (opcional)', 'Professional registration (optional)'] }),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.profNome)) w.push({ level: 'error', field: 'profNome', message: l('Indique o psicólogo que assina.', 'Enter the psychologist who signs.') });
    if (v.pedidoPor !== 'proprio' && v.pedidoPor !== 'tribunal' && !v.consentimento) {
      w.push({
        level: 'error',
        field: 'consentimento',
        message: l(`O relatório só pode ser entregue a terceiros com o consentimento da pessoa ou do encarregado (${cite('sigiloMedico')}).`, 'Release to third parties requires consent.'),
      });
    }
    if (v.pedidoPor === 'empregador') w.push({ level: 'warning', field: 'pedidoPor', message: l(`Ao empregador comunique apenas a conclusão sobre a aptidão para a função (${cite('examesMedicosTrabalho')}).`, 'Tell the employer only the conclusion on fitness for the job.') });
    if (mentionsHiv(...SECOES.map((s) => v[s.name]))) w.push(hivWarning('resultados'));
    w.push({ level: 'info', message: l('Não foi encontrada uma Ordem dos Psicólogos em Moçambique; indique o registo profissional que tiver (ex.: associação profissional ou Ministério da Saúde).', 'No psychologists’ order was found in Mozambique; give whatever professional registration you hold.') });
    return w;
  },

  personName: (v) => v.avaliadoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const t = TIPO_OPTIONS.find((x) => x.value === v.tipo) ?? TIPO_OPTIONS[0];
    const age = patientAge(v, 'avaliado');
    const dest = lines(v.destinatario);
    const blocks: Block[] = [CONFIDENCIAL, { type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) }];
    if (dest.length) blocks.push({ type: 'recipient', lines: dest });
    if (v.pedidoPor === 'tribunal' && str(v.processoTribunal)) blocks.push({ type: 'subject', text: `Processo n.º ${str(v.processoTribunal)}` });
    blocks.push({ type: 'title', text: t.title, subtitle: dest.length ? undefined : 'A quem possa interessar' });
    const ident = [
      { label: 'Nome', value: str(v.avaliadoNome) || '____________________' },
      { label: 'Idade', value: age != null ? `${age} anos` : '______' },
    ];
    if (str(v.avaliadoDataNascimento)) ident.push({ label: 'Data de nascimento', value: formatDateShort(v.avaliadoDataNascimento) });
    if (str(v.escolaridade)) ident.push({ label: 'Escolaridade', value: str(v.escolaridade) });
    if (str(v.encarregado)) ident.push({ label: 'Encarregado', value: str(v.encarregado) });
    const sess = Number(v.sessoes);
    if (str(v.sessoes) && Number.isFinite(sess)) ident.push({ label: 'Sessões', value: `${sess}${str(v.periodo) ? ` (${str(v.periodo)})` : ''}` });
    else if (str(v.periodo)) ident.push({ label: 'Período', value: str(v.periodo) });
    blocks.push({ type: 'keyValue', items: ident, columns: 2 });

    let n = 0;
    const head = (titulo: string) => {
      n++;
      blocks.push({ type: 'heading', text: `${n}. ${titulo}` });
    };
    const inst = lines(v.instrumentos);
    for (const s of SECOES) {
      const text = str(v[s.name]);
      if (s.name === 'historia' && inst.length) {
        head('Procedimentos e instrumentos');
        blocks.push({ type: 'list', items: inst.map((x, i) => `${x.replace(/[.;]+$/, '')}${i === inst.length - 1 ? '.' : ';'}`) });
      }
      if (!text && !s.required) continue;
      head(s.titulo);
      blocks.push({ type: 'paragraph', id: s.name, text: text || '____________________', en: `${s.en}: ${text}` });
    }
    const pedido = (PEDIDO_OPTIONS.find((p) => p.value === v.pedidoPor) ?? PEDIDO_OPTIONS[0]).pt.replace('{do avaliado}', g(v.avaliadoGenero, 'do avaliado', 'da avaliada'));
    const consent = v.pedidoPor !== 'proprio' && v.pedidoPor !== 'tribunal' && v.consentimento ? ', com o consentimento da pessoa avaliada ou do seu representante legal' : '';
    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: `O presente relatório é emitido ${pedido}${consent}, reflecte a situação observada no período indicado e destina-se exclusivamente ao seu destinatário, não devendo ser usado para outro fim.`,
        en: 'This report reflects the period stated and is for its addressee only.',
        keepWithNext: true,
      },
      { type: 'signatures', columns: [profSignature(ctx, 'O Psicólogo', 'A Psicóloga')] },
      { type: 'note', text: 'Documento confidencial, sujeito a sigilo profissional. Os resultados de testes psicológicos devem ser interpretados por um profissional.', en: 'Confidential; test results must be interpreted by a professional.' },
    );
    return blocks;
  },
});

