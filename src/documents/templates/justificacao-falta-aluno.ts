// Justificação de falta do aluno: the parent/guardian (or an adult student)
// justifies a pupil's absence to the class director. School rules require a
// written note signed by the guardian, handed in within a short deadline
// (Regulamento Geral do Ensino Básico; schools' internal rules may differ).
// A5, no letterhead: it is written by the family, not by the school.

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, exmo, GENERO_OPTIONS, isF, l, localField } from './_shared';
import { intervalo, semPonto, str } from './_educacao';

const MOTIVOS: Record<string, string> = {
  doenca: 'doença',
  consulta: 'consulta ou tratamento médico',
  falecimento: 'falecimento de familiar',
  familiar: 'assunto familiar inadiável',
  transporte: 'falta de transporte',
  intemperie: 'condições climatéricas adversas',
  outro: '',
};

export default defineTemplate({
  id: 'justificacao-falta-aluno',
  family: 'carta',
  page: 'A5',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'aluno', title: l('Aluno', 'Pupil'), personRole: 'outro' },
    { id: 'falta', title: l('Falta', 'Absence') },
    { id: 'encarregado', title: l('Quem justifica', 'Who justifies'), personRole: 'cliente' },
  ],
  fields: [
    localField(),
    dateField(),
    {
      name: 'autor',
      type: 'radio',
      section: 'documento',
      label: l('Quem escreve', 'Written by'),
      options: [
        { value: 'encarregado', label: l('O encarregado de educação', 'The parent / guardian') },
        { value: 'aluno', label: l('O próprio aluno (maior de idade)', 'The adult student') },
      ],
      default: 'encarregado',
    },
    {
      name: 'destinatario',
      type: 'select',
      section: 'documento',
      width: 'half',
      label: l('Dirigida a', 'Addressed to'),
      options: [
        { value: 'Director de Turma', label: l('Director(a) de Turma', 'Class director') },
        { value: 'Professor da Turma', label: l('Professor(a) da turma', 'Class teacher') },
        { value: 'Director Pedagógico', label: l('Director(a) Pedagógico(a)', 'Academic director') },
        { value: 'Coordenador do Curso', label: l('Coordenador(a) do curso', 'Course coordinator') },
      ],
      default: 'Director de Turma',
    },
    { name: 'destinatarioGenero', type: 'radio', section: 'documento', width: 'half', label: l('Tratamento do destinatário', 'Addressee'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'escola', type: 'text', section: 'documento', label: l('Escola', 'School'), placeholder: l('Ex.: Escola Secundária Josina Machel', 'E.g. Josina Machel Secondary School') },
    { name: 'alunoNome', type: 'text', section: 'aluno', required: true, label: l('Nome do aluno', "Pupil's name"), personKey: 'nome' },
    { name: 'alunoGenero', type: 'radio', section: 'aluno', width: 'half', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'alunoNumero', type: 'text', section: 'aluno', width: 'half', label: l('N.º do aluno', 'Pupil no.') },
    { name: 'classe', type: 'text', section: 'aluno', width: 'half', label: l('Classe', 'Grade'), placeholder: l('Ex.: 8.ª', 'E.g. 8.ª') },
    { name: 'turma', type: 'text', section: 'aluno', width: 'half', label: l('Turma', 'Class') },
    { name: 'dataInicio', type: 'date', section: 'falta', width: 'half', required: true, label: l('Dia da falta (ou primeiro dia)', 'Day of absence (or first day)') },
    { name: 'dataFim', type: 'date', section: 'falta', width: 'half', label: l('Último dia (se mais de um)', 'Last day (if several)') },
    { name: 'disciplinas', type: 'text', section: 'falta', label: l('Disciplinas (se faltou só a algumas aulas)', 'Subjects (if only some classes)') },
    { name: 'motivo', type: 'select', section: 'falta', width: 'half', label: l('Motivo', 'Reason'), options: [
      { value: 'doenca', label: l('Doença', 'Illness') },
      { value: 'consulta', label: l('Consulta / tratamento médico', 'Medical appointment') },
      { value: 'falecimento', label: l('Falecimento de familiar', 'Death in the family') },
      { value: 'familiar', label: l('Assunto familiar inadiável', 'Urgent family matter') },
      { value: 'transporte', label: l('Falta de transporte', 'No transport') },
      { value: 'intemperie', label: l('Chuvas / ciclone', 'Rain / cyclone') },
      { value: 'outro', label: l('Outro', 'Other') },
    ], default: 'doenca' },
    { name: 'motivoTexto', type: 'text', section: 'falta', width: 'half', label: l('Pormenor do motivo (opcional)', 'Details (optional)') },
    {
      name: 'anexo',
      type: 'select',
      section: 'falta',
      width: 'half',
      label: l('Documento junto', 'Attached document'),
      options: [
        { value: '', label: l('Nenhum', 'None') },
        { value: 'atestado médico', label: l('Atestado médico', 'Medical certificate') },
        { value: 'declaração da unidade sanitária', label: l('Declaração da unidade sanitária', 'Health facility note') },
        { value: 'certidão de óbito', label: l('Certidão de óbito', 'Death certificate') },
      ],
      default: '',
    },
    { name: 'testePerdido', type: 'toggle', section: 'falta', label: l('Faltou a um teste e pede nova data', 'Missed a test and asks for a new date') },
    { name: 'testeDisciplina', type: 'text', section: 'falta', width: 'half', label: l('Teste de', 'Test in'), showIf: (v) => Boolean(v.testePerdido) },
    { name: 'encarregadoNome', type: 'text', section: 'encarregado', label: l('Nome do encarregado', "Parent's name"), personKey: 'nome', default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.nome ?? '' : ''), showIf: (v) => v.autor !== 'aluno' },
    { name: 'encarregadoGenero', type: 'radio', section: 'encarregado', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.genero ?? 'M' : 'M'), showIf: (v) => v.autor !== 'aluno' },
    { name: 'encarregadoTelefone', type: 'tel', section: 'encarregado', width: 'half', label: l('Telefone', 'Phone'), default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.telefones ?? '' : '') },
  ],
  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const ultimo = str(v.dataFim) || str(v.dataInicio);
    const horas = ctx.legal.value<{ prazoHoras: number }>('eduJustificacaoFaltaAluno').prazoHoras;
    if (ultimo && v.data && diffDays(ultimo, v.data) * 24 > horas)
      w.push({
        level: 'warning',
        field: 'data',
        message: l(
          `O prazo para justificar faltas é normalmente de ${horas} horas (confirme no regulamento da escola). Entregue de imediato e explique o atraso.`,
          `The usual deadline to justify absences is ${horas} hours (check the school rules). Hand it in now and explain the delay.`,
        ),
      });
    if (v.dataFim && v.dataInicio && diffDays(v.dataInicio, v.dataFim) >= 2 && (v.motivo === 'doenca' || v.motivo === 'consulta') && !v.anexo)
      w.push({ level: 'info', field: 'anexo', message: l('Para uma doença de vários dias, junte o atestado médico ou a declaração da unidade sanitária.', 'For several days of illness, attach a medical certificate.') });
    if (v.dataFim && v.dataInicio && str(v.dataFim) < str(v.dataInicio)) w.push({ level: 'error', field: 'dataFim', message: l('O último dia é anterior ao primeiro.', 'Last day is before the first.') });
    return w;
  },
  personName: (v) => str(v.alunoNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
  blocks: (ctx) => {
    const v = ctx.values;
    const proprio = v.autor === 'aluno';
    const fa = isF(v.alunoGenero);
    const fe = isF(v.encarregadoGenero);
    const fd = isF(v.destinatarioGenero);
    const dest = str(v.destinatario) || 'Director de Turma';
    const destF = fd ? dest.replace(/^Director/, 'Directora').replace(/^Professor/, 'Professora').replace(/^Coordenador/, 'Coordenadora').replace('Pedagógico', 'Pedagógica') : dest;
    const turma = [str(v.classe) ? `${semPonto(v.classe).replace(/\s*classe$/i, '')} classe` : '', str(v.turma) ? `turma ${str(v.turma)}` : ''].filter(Boolean).join(', ');
    const dias = v.dataFim && v.dataFim !== v.dataInicio ? intervalo(str(v.dataInicio), str(v.dataFim)) : `no dia ${dateLong(v.dataInicio)}`;
    const aulas = str(v.disciplinas) ? `às aulas de ${semPonto(v.disciplinas)}` : 'a todas as aulas';
    const motivo = [MOTIVOS[str(v.motivo)] ?? '', semPonto(v.motivoTexto)].filter(Boolean).join(' — ') || BLANK;
    const quem = proprio
      ? `Eu, **${str(v.alunoNome) || BLANK}**${str(v.alunoNumero) ? `, n.º ${str(v.alunoNumero)}` : ''}${turma ? `, da ${turma}` : ''}, venho justificar as faltas que dei ${dias}, ${aulas}, por motivo de **${motivo}**.`
      : `Eu, **${str(v.encarregadoNome) || BLANK}**, Encarregad${fe ? 'a' : 'o'} de Educação ${fa ? 'da aluna' : 'do aluno'} **${str(v.alunoNome) || BLANK}**${str(v.alunoNumero) ? `, n.º ${str(v.alunoNumero)}` : ''}${turma ? `, da ${turma}` : ''}, venho justificar as faltas dadas pel${fa ? 'a minha educanda' : 'o meu educando'} ${dias}, ${aulas}, por motivo de **${motivo}**.`;
    const blocks: Block[] = [
      { type: 'recipient', salutation: exmo(v.destinatarioGenero), lines: [destF, str(v.escola)].filter(Boolean) },
      { type: 'subject', text: 'Justificação de falta' },
      { type: 'paragraph', id: 'corpo', text: quem, en: 'I hereby justify the absence on the stated dates, for the stated reason.' },
    ];
    if (v.anexo) blocks.push({ type: 'paragraph', id: 'anexo', text: `Junto ${str(v.anexo)}.`, en: 'Supporting document attached.' });
    if (v.testePerdido)
      blocks.push({ type: 'paragraph', id: 'teste', text: `Uma vez que nesse período se realizou o teste de ${semPonto(v.testeDisciplina) || BLANK}, solicito que ${proprio ? 'me' : fa ? 'lhe' : 'lhe'} seja concedida a oportunidade de o realizar em nova data.`, en: 'A test took place during the absence; I ask for a new date.' });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Kind regards,', keepWithNext: true },
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.data)}`,
        columns: [{ role: proprio ? (fa ? 'A Aluna' : 'O Aluno') : fe ? 'A Encarregada de Educação' : 'O Encarregado de Educação', name: (proprio ? str(v.alunoNome) : str(v.encarregadoNome)) || undefined, detail: str(v.encarregadoTelefone) ? `Tel. ${str(v.encarregadoTelefone)}` : undefined }],
      },
      { type: 'box', label: `Despacho ${fd ? 'da' : 'do'} ${destF}`, text: '☐ Justificada      ☐ Não justificada\nData: ___/___/______     Assinatura: ____________________', dashed: true },
    );
    return blocks;
  },
});
