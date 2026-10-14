// Declaração de matrícula e/ou frequência: the school, college, university,
// training centre or driving school certifies that a person is enrolled in or
// attends a class or course. Mostly presented to employers (worker-student),
// the migration services, embassies, INSS and courts, so it prints plain.

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { blank, dateField, dateLong, l, localField, placeDate } from './_shared';
import { academicFields, alunoFields, alunoIdent, designacaoField, eCurso, estudante, eSuperior, fechoDeclaracao, FINALIDADE_FIELD, finalidadeBlock, frequenciaTexto, inst, intervalo, licenceWarning, mesAno, num, schoolSignatures, signatoryFields, str } from './_educacao';

export default defineTemplate({
  id: 'declaracao-de-frequencia',
  family: 'declaracao',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'aluno', title: l('Aluno / estudante', 'Student'), personRole: 'outro' },
    { id: 'frequencia', title: l('Matrícula e frequência', 'Enrolment and attendance') },
    { id: 'opcoes', title: l('Informação adicional', 'Additional information') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    { name: 'numero', type: 'text', section: 'documento', width: 'half', label: l('Declaração n.º (opcional)', 'Declaration no. (optional)'), default: (c) => c.nextRef },
    localField(),
    dateField(),
    designacaoField('documento'),
    {
      name: 'tipo',
      type: 'radio',
      section: 'documento',
      label: l('O que declara', 'What it certifies'),
      options: [
        { value: 'matricula-frequencia', label: l('Está matriculado e frequenta', 'Is enrolled and attends') },
        { value: 'matricula', label: l('Está matriculado (ainda não iniciou)', 'Is enrolled (not started yet)') },
        { value: 'frequentou', label: l('Frequentou (ano ou curso já terminado)', 'Attended (past year or course)') },
      ],
      default: 'matricula-frequencia',
    },
    ...alunoFields(['nome', 'genero', 'nascimento', 'naturalidade', 'docTipo', 'docNumero', 'pai', 'mae', 'numero']),
    {
      name: 'incluirFiliacao',
      type: 'toggle',
      section: 'aluno',
      label: l('Indicar a filiação (nomes dos pais)', "State the parents' names"),
      help: l('Fórmula habitual nas declarações escolares em Moçambique.', 'Customary in Mozambican school declarations.'),
      default: true,
    },
    ...academicFields('frequencia'),
    { name: 'dataInicio', type: 'date', section: 'frequencia', width: 'half', label: l('Início do curso', 'Course start'), showIf: eCurso },
    { name: 'dataFim', type: 'date', section: 'frequencia', width: 'half', label: l('Fim previsto', 'Expected end'), showIf: eCurso },
    { name: 'cargaHoraria', type: 'number', section: 'frequencia', width: 'half', min: 0, label: l('Carga horária total (horas)', 'Total hours'), showIf: eCurso },
    { name: 'semestre', type: 'text', section: 'frequencia', width: 'half', label: l('Semestre (opcional)', 'Semester (optional)'), placeholder: l('Ex.: 1.º semestre', 'E.g. 1st semester'), showIf: eSuperior },
    { name: 'horario', type: 'text', section: 'opcoes', label: l('Horário das aulas (opcional)', 'Class times (optional)'), placeholder: l('Ex.: de segunda a sexta-feira, das 7h00 às 12h30', 'E.g. Monday to Friday, 7:00 to 12:30'), help: l('Útil para a entidade empregadora e para o tribunal.', 'Useful for employers and courts.') },
    {
      name: 'assiduidade',
      type: 'select',
      section: 'opcoes',
      width: 'half',
      label: l('Assiduidade', 'Attendance record'),
      options: [
        { value: '', label: l('— não indicar —', '— do not state —') },
        { value: 'regular', label: l('Regular', 'Regular') },
        { value: 'irregular', label: l('Irregular', 'Irregular') },
      ],
      default: '',
    },
    { name: 'propinasAte', type: 'month', section: 'opcoes', width: 'half', label: l('Propinas pagas até (opcional)', 'Fees paid up to (optional)'), help: l('Só se a entidade destinatária o pedir (por exemplo, Serviços de Migração).', 'Only if the recipient asks for it (e.g. migration services).') },
    FINALIDADE_FIELD('opcoes'),
    { name: 'validadeDias', type: 'number', section: 'opcoes', width: 'half', min: 0, label: l('Validade em dias (opcional)', 'Validity in days (optional)'), help: l('Prática de algumas escolas; não é exigência legal.', 'Some schools state a validity; not a legal requirement.') },
    ...signatoryFields(),
  ],
  warnings: (v, ctx) => {
    const w: Warning[] = [...licenceWarning(ctx)];
    if (!str(v.alunoNome)) w.push({ level: 'error', field: 'alunoNome', message: l('Indique o nome do aluno.', "Enter the student's name.") });
    if (!str(v.classe) && !str(v.curso)) w.push({ level: 'warning', field: 'classe', message: l('Indique a classe, o ano ou o curso.', 'Enter the grade, year or course.') });
    if (eCurso(v) && v.dataInicio && v.dataFim && diffDays(v.dataInicio, v.dataFim) < 0)
      w.push({ level: 'error', field: 'dataFim', message: l('A data de fim é anterior à de início.', 'The end date is before the start date.') });
    if (/empreg|trabalh|servi[cç]o/i.test(str(v.finalidade))) {
      const dias = ctx.legal.value<{ avisoExamesDias: number }>('eduTrabalhadorEstudante').avisoExamesDias;
      w.push({
        level: 'info',
        message: l(
          `Trabalhador-estudante: o estatuto mantém-se com aproveitamento positivo, e o trabalhador pode faltar para provas e exames sem perda de remuneração, avisando o empregador com ${dias} dias de antecedência (Lei do Trabalho).`,
          `Worker-student: the status depends on positive results; the worker may miss work for exams without loss of pay with ${dias} days' notice (Labour Law).`,
        ),
      });
    }
    w.push({
      level: 'info',
      message: l(
        'Esta declaração não substitui o certificado de habilitações. A conclusão de um nível prova-se com o certificado no modelo oficial.',
        'This declaration does not replace the official certificate of qualifications.',
      ),
    });
    return w;
  },
  personName: (v) => str(v.alunoNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
  blocks: (ctx) => {
    const v = ctx.values;
    const e = estudante(v);
    const i = inst(v);
    const tipo = str(v.tipo) || 'matricula-frequencia';
    const verbo =
      tipo === 'matricula'
        ? `se encontra ${e.matriculado}`
        : tipo === 'frequentou'
          ? 'frequentou'
          : `se encontra ${e.matriculado} e frequenta`;
    const ano = eSuperior(v)
      ? `${str(v.semestre) ? `no ${str(v.semestre)} ` : ''}do ano académico de ${blank(v.anoLectivo)}`
      : `no ano lectivo de ${blank(v.anoLectivo)}`;
    const numero = str(v.alunoNumero) ? `, com o número ${eSuperior(v) ? 'de estudante' : 'de processo'} ${str(v.alunoNumero)}` : '';
    let corpo: string;
    if (eCurso(v)) {
      const horas = num(v.cargaHoraria);
      const periodo = v.dataInicio
        ? tipo === 'frequentou'
          ? v.dataFim ? `, ${intervalo(str(v.dataInicio), str(v.dataFim))}` : `, com início em ${dateLong(v.dataInicio)}`
          : `, com início em ${dateLong(v.dataInicio)}${v.dataFim ? ` e termo previsto para ${dateLong(v.dataFim)}` : ''}`
        : '';
      const curso = `${str(v.classe) ? `o ${str(v.classe)} do ` : 'o '}curso de **${blank(v.curso)}**`;
      const acc = tipo === 'frequentou' ? `frequentou ${curso}` : tipo === 'matricula' ? `se encontra ${e.matriculado} no${curso.slice(1)}` : `frequenta ${curso}`;
      corpo = `Para os devidos efeitos, declara-se que ${alunoIdent(v, { filiacao: Boolean(v.incluirFiliacao) })} ${acc}, ministrado por ${i.esta}${periodo}${horas ? `, com a carga horária de ${horas} horas` : ''}, em regime presencial${numero}.`;
    } else {
      corpo = `Para os devidos efeitos, declara-se que ${alunoIdent(v, { filiacao: Boolean(v.incluirFiliacao) })} ${verbo}, ${i.nesta}, ${ano}, ${frequenciaTexto(v)}${numero}.`;
    }
    const blocks: Block[] = [];
    blocks.push(
      { type: 'title', text: tipo === 'matricula' ? 'Declaração de Matrícula' : tipo === 'frequentou' ? 'Declaração' : 'Declaração de Matrícula e Frequência', subtitle: str(v.numero) ? `N.º ${str(v.numero)}` : undefined },
      { type: 'paragraph', id: 'corpo', text: corpo, en: `This is to certify that ${str(v.alunoNome) || 'the student'} ${tipo === 'frequentou' ? 'attended' : tipo === 'matricula' ? 'is enrolled at' : 'is enrolled at and attends'} this institution in ${str(v.anoLectivo) || 'the current year'}${str(v.classe) ? `, ${str(v.classe)}` : ''}${str(v.curso) ? `, course: ${str(v.curso)}` : ''}.` },
    );
    if (str(v.horario))
      blocks.push({ type: 'paragraph', id: 'horario', text: `As aulas decorrem ${semPontoLocal(v.horario)}.`, en: `Classes take place ${str(v.horario)}.` });
    if (v.assiduidade)
      blocks.push({ type: 'paragraph', id: 'assiduidade', text: `Até à presente data, ${e.o} tem demonstrado assiduidade ${v.assiduidade}.`, en: `To date, attendance has been ${v.assiduidade === 'regular' ? 'regular' : 'irregular'}.` });
    if (str(v.propinasAte))
      blocks.push({ type: 'paragraph', id: 'propinas', text: `As propinas encontram-se pagas até ao mês de ${mesAno(v.propinasAte)}.`, en: `Fees are paid up to ${str(v.propinasAte)}.` });
    blocks.push(...finalidadeBlock(v));
    blocks.push(fechoDeclaracao(v, ctx), { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: schoolSignatures(v) });
    const validade = num(v.validadeDias);
    if (validade && validade > 0) blocks.push({ type: 'note', text: `Válida por ${validade} dias a contar da data de emissão.`, en: `Valid for ${validade} days from the date of issue.` });
    return blocks;
  },
});

function semPontoLocal(x: unknown): string {
  return String(x ?? '').trim().replace(/[.;,:]+$/, '');
}
