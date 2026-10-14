// Declaração de estágio curricular: the host organisation confirms that a
// student completed (or is doing) the internship required by the course,
// usually with the supervisor's assessment, for the school or university.
// Pre-professional internships (Regulamento de Estágios Pré-profissionais)
// get a certificate on the employment agency's model instead.

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { BLANK, dateField, dateLong, employerName, isF, l, localField, placeDate, splitLines } from './_shared';
import { alunoFields, num, semPonto, str } from './_educacao';

export default defineTemplate({
  id: 'declaracao-de-estagio',
  family: 'declaracao',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'aluno', title: l('Estagiário', 'Intern'), personRole: 'outro' },
    { id: 'estagio', title: l('Estágio', 'Internship') },
    { id: 'avaliacao', title: l('Avaliação (opcional)', 'Assessment (optional)') },
    { id: 'assinatura', title: l('Assinaturas', 'Signatures') },
  ],
  fields: [
    { name: 'numero', type: 'text', section: 'documento', width: 'half', label: l('Referência (opcional)', 'Reference (optional)'), default: (c) => c.nextRef },
    localField(),
    dateField(),
    {
      name: 'tipoEstagio',
      type: 'radio',
      section: 'documento',
      label: l('Tipo de estágio', 'Type of internship'),
      options: [
        { value: 'curricular', label: l('Curricular (exigido pelo curso)', 'Curricular (required by the course)') },
        { value: 'pre-profissional', label: l('Pré-profissional (recém-graduado)', 'Pre-professional (graduate)') },
      ],
      default: 'curricular',
    },
    { name: 'situacao', type: 'radio', section: 'documento', label: l('Situação', 'Status'), options: [
      { value: 'concluido', label: l('Concluído', 'Completed') },
      { value: 'curso', label: l('Em curso', 'Ongoing') },
    ], default: 'concluido' },
    ...alunoFields(['nome', 'genero', 'docTipo', 'docNumero']),
    { name: 'curso', type: 'text', section: 'aluno', required: true, label: l('Curso', 'Course'), placeholder: l('Ex.: Licenciatura em Gestão de Recursos Humanos', 'E.g. BA in Human Resources') },
    { name: 'instituicaoEnsino', type: 'text', section: 'aluno', required: true, label: l('Instituição de ensino', 'School / university'), placeholder: l('Ex.: Universidade Eduardo Mondlane', 'E.g. Eduardo Mondlane University') },
    { name: 'departamento', type: 'text', section: 'estagio', width: 'half', label: l('Departamento / área', 'Department') },
    { name: 'dataInicio', type: 'date', section: 'estagio', width: 'half', required: true, label: l('Início', 'Start') },
    { name: 'dataFim', type: 'date', section: 'estagio', width: 'half', required: true, label: l('Fim', 'End') },
    { name: 'cargaHoraria', type: 'number', section: 'estagio', width: 'half', min: 0, label: l('Carga horária total (horas)', 'Total hours') },
    { name: 'supervisorNome', type: 'text', section: 'estagio', width: 'half', label: l('Supervisor / orientador', 'Supervisor') },
    { name: 'supervisorCargo', type: 'text', section: 'estagio', width: 'half', label: l('Cargo do supervisor', "Supervisor's position") },
    { name: 'actividades', type: 'textarea', section: 'estagio', rows: 5, label: l('Actividades desenvolvidas (uma por linha)', 'Tasks (one per line)') },
    { name: 'remuneracao', type: 'select', section: 'estagio', width: 'half', label: l('Remuneração', 'Pay'), options: [
      { value: '', label: l('— não indicar —', '— do not state —') },
      { value: 'nao', label: l('Não remunerado', 'Unpaid') },
      { value: 'subsidio', label: l('Com subsídio', 'With allowance') },
    ], default: '' },
    { name: 'avaliar', type: 'toggle', section: 'avaliacao', label: l('Incluir a avaliação do supervisor', "Include the supervisor's assessment"), default: true },
    { name: 'comportamento', type: 'text', section: 'avaliacao', label: l('Qualidades demonstradas', 'Qualities shown'), default: 'assiduidade, pontualidade, interesse e boa capacidade de integração na equipa', showIf: (v) => Boolean(v.avaliar) },
    { name: 'classificacao', type: 'text', section: 'avaliacao', width: 'half', label: l('Classificação (opcional)', 'Grade (optional)'), placeholder: l('Ex.: 16 valores · Muito Bom', 'E.g. 16 / 20 · Very good'), showIf: (v) => Boolean(v.avaliar) },
    { name: 'assinanteCargo', type: 'text', section: 'assinatura', width: 'half', label: l('Cargo de quem assina pela entidade', 'Signatory position'), default: (c) => c.profile?.representanteCargo || 'Director de Recursos Humanos' },
    { name: 'assinanteNome', type: 'text', section: 'assinatura', width: 'half', label: l('Nome', 'Name'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'supervisorAssina', type: 'toggle', section: 'assinatura', label: l('O supervisor também assina', 'Supervisor also signs'), default: true },
  ],
  warnings: (v) => {
    const w: Warning[] = [];
    if (v.tipoEstagio === 'pre-profissional')
      w.push({
        level: 'warning',
        field: 'tipoEstagio',
        message: l(
          'No estágio pré-profissional, a entidade promotora emite o certificado de estágio no modelo definido pela entidade de emprego (INEP). Use este modelo apenas como declaração complementar.',
          'For a pre-professional internship the host issues the certificate on the employment agency’s model; use this only as a supplementary letter.',
        ),
      });
    if (v.dataInicio && v.dataFim && diffDays(v.dataInicio, v.dataFim) < 0) w.push({ level: 'error', field: 'dataFim', message: l('A data de fim é anterior à de início.', 'End date is before start date.') });
    w.push({ level: 'info', message: l('Muitas universidades entregam uma ficha própria de avaliação do estagiário: preencha-a e junte-a a esta declaração.', 'Many universities have their own assessment form: fill it in and attach it.') });
    return w;
  },
  personName: (v) => str(v.alunoNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.alunoGenero);
    const est = f ? 'a estagiária' : 'o estagiário';
    const Est = f ? 'A estagiária' : 'O estagiário';
    const concluido = v.situacao !== 'curso';
    const horas = num(v.cargaHoraria);
    const empresa = ctx.profile?.kind === 'pessoa' ? 'nesta entidade' : `na ${employerName(ctx)}`;
    const doc = str(v.alunoDocNumero) ? `, ${f ? 'portadora' : 'portador'} do ${str(v.alunoDocTipo) || 'BI'} n.º ${str(v.alunoDocNumero)}` : '';
    const tipo = v.tipoEstagio === 'pre-profissional' ? 'um estágio pré-profissional' : 'o estágio curricular previsto no plano do seu curso';
    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Estágio', subtitle: str(v.numero) ? `Ref.ª ${str(v.numero)}` : undefined },
      {
        type: 'paragraph',
        id: 'corpo',
        text: `Declara-se, para os devidos efeitos, que **${str(v.alunoNome) || BLANK}**${doc}, estudante do curso de ${semPonto(v.curso) || BLANK} ${/^(a|o) /i.test(str(v.instituicaoEnsino)) ? 'd' : 'da '}${semPonto(v.instituicaoEnsino) || BLANK}, ${concluido ? 'realizou' : 'está a realizar'} ${empresa}${str(v.departamento) ? `, no ${semPonto(v.departamento).replace(/^(no|na) /i, '')}` : ''}, ${tipo}, ${concluido ? `no período de ${dateLong(v.dataInicio)} a ${dateLong(v.dataFim)}` : `desde ${dateLong(v.dataInicio)}, com termo previsto para ${dateLong(v.dataFim)}`}${horas ? `, com a carga horária total de ${horas} horas` : ''}${str(v.supervisorNome) ? `, sob a orientação de ${semPonto(v.supervisorNome)}${str(v.supervisorCargo) ? `, ${semPonto(v.supervisorCargo)}` : ''}` : ''}.`,
        en: 'This is to certify that the student completed (or is doing) the internship at this organisation in the stated period, under the stated supervisor.',
      },
    ];
    const acts = splitLines(v.actividades);
    if (acts.length)
      blocks.push(
        { type: 'paragraph', id: 'actividades', text: `Durante o estágio, ${est} desenvolveu as seguintes actividades:`, en: 'During the internship the intern carried out the following tasks:', keepWithNext: true },
        { type: 'list', style: 'bullet', items: acts.map((a) => semPonto(a)) },
      );
    if (v.avaliar)
      blocks.push({
        type: 'paragraph',
        id: 'avaliacao',
        text: `${Est} demonstrou ${semPonto(v.comportamento) || BLANK}${str(v.classificacao) ? `, tendo obtido na avaliação do supervisor a classificação de ${semPonto(v.classificacao)}` : ''}.`,
        en: "Supervisor's assessment.",
      });
    if (v.remuneracao)
      blocks.push({ type: 'paragraph', id: 'remuneracao', text: v.remuneracao === 'nao' ? 'O estágio não foi remunerado.' : `O estágio foi acompanhado de um subsídio pago pela entidade.`, en: v.remuneracao === 'nao' ? 'The internship was unpaid.' : 'The internship carried an allowance.' });
    const cols: SignatureColumn[] = [{ role: str(v.assinanteCargo) || 'A Direcção', name: str(v.assinanteNome) || undefined, image: 'both' }];
    if (v.supervisorAssina !== false && str(v.supervisorNome)) cols.unshift({ role: 'O Supervisor do Estágio', name: semPonto(v.supervisorNome) });
    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: ctx.profile?.kind === 'pessoa' ? 'Por ser verdade, passa-se a presente declaração, que vai por mim assinada.' : 'Por ser verdade, passa-se a presente declaração, que vai assinada e autenticada com o carimbo em uso nesta entidade.',
        en: 'Issued as true, signed and stamped.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: cols },
    );
    return blocks;
  },
});
