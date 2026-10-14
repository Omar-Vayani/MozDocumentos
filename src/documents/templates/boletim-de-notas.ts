// Boletim de avaliação (caderneta) of a private school: the marks of one pupil
// per subject and term, absences, behaviour and the class director's remarks,
// sent to the parent, who signs that they have seen it. Internal document: it
// does not replace the official records (pautas) or the certificate.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateLong, l, localField } from './_shared';
import { academicFields, alunoFields, licenceWarning } from './_educacao';
import { cell, rows, str } from './_saude-educacao';

const TRIMESTRES = ['1.º Trimestre', '2.º Trimestre', '3.º Trimestre'];

const COMPORTAMENTO_OPTIONS = [
  { value: '', label: l('— não indicar —', '— do not state —') },
  { value: 'Muito Bom', label: l('Muito Bom', 'Very good') },
  { value: 'Bom', label: l('Bom', 'Good') },
  { value: 'Satisfatório', label: l('Satisfatório', 'Satisfactory') },
  { value: 'Não satisfatório', label: l('Não satisfatório', 'Unsatisfactory') },
];

const nota = (x: unknown): number | null => {
  const s = str(x).replace(',', '.');
  const n = Number(s);
  return s && Number.isFinite(n) ? n : null;
};
const fmt = (n: number | null) => (n == null ? ' ' : (Math.round(n * 10) / 10).toString().replace('.', ','));

export default defineTemplate({
  id: 'boletim-de-notas',
  family: 'mapa',
  sections: [
    { id: 'aluno', title: l('Aluno', 'Pupil'), personRole: 'outro' },
    { id: 'frequencia', title: l('Classe e período', 'Grade and term') },
    { id: 'notas', title: l('Classificações', 'Marks') },
    { id: 'apreciacao', title: l('Apreciação', 'Assessment') },
    { id: 'documento', title: l('Assinaturas', 'Signatures') },
  ],
  fields: [
    ...alunoFields(['nome', 'genero', 'numero']),
    ...academicFields('frequencia', { curso: false, turno: false }),
    {
      name: 'periodo',
      type: 'select',
      section: 'frequencia',
      width: 'half',
      label: l('Boletim referente ao', 'Report for'),
      options: [
        { value: '1', label: l('1.º Trimestre', '1st term') },
        { value: '2', label: l('2.º Trimestre', '2nd term') },
        { value: '3', label: l('3.º Trimestre (final)', '3rd term (final)') },
      ],
      default: '1',
    },
    { name: 'escalaMax', type: 'number', section: 'frequencia', width: 'half', min: 5, max: 100, label: l('Escala: classificação máxima', 'Scale: maximum mark'), default: 20 },
    { name: 'escalaPositiva', type: 'number', section: 'frequencia', width: 'half', min: 1, max: 100, label: l('Classificação positiva a partir de', 'Pass mark'), default: 10 },
    {
      name: 'disciplinas',
      type: 'lines',
      section: 'notas',
      label: l('Disciplinas', 'Subjects'),
      addLabel: l('Adicionar disciplina', 'Add subject'),
      columns: [
        { name: 'disciplina', type: 'text', label: l('Disciplina', 'Subject') },
        { name: 't1', type: 'text', label: l('1.º T', 'T1') },
        { name: 't2', type: 'text', label: l('2.º T', 'T2') },
        { name: 't3', type: 'text', label: l('3.º T', 'T3') },
        { name: 'faltas', type: 'text', label: l('Faltas', 'Absences') },
      ],
      default: ['Português', 'Inglês', 'Matemática', 'Biologia', 'Física', 'Química', 'Geografia', 'História', 'Educação Física'].map((d) => ({ disciplina: d, t1: '', t2: '', t3: '', faltas: '' })),
    },
    { name: 'comportamento', type: 'select', section: 'apreciacao', width: 'half', label: l('Comportamento', 'Behaviour'), options: COMPORTAMENTO_OPTIONS, default: '' },
    {
      name: 'resultado',
      type: 'select',
      section: 'apreciacao',
      width: 'half',
      label: l('Resultado final', 'Final result'),
      options: [
        { value: '', label: l('— ainda não —', '— not yet —') },
        { value: 'Transita', label: l('Transita de classe', 'Passes') },
        { value: 'Não transita', label: l('Não transita', 'Repeats') },
        { value: 'Admitido a exame', label: l('Admitido a exame', 'Admitted to exam') },
        { value: 'Excluído', label: l('Excluído', 'Excluded') },
      ],
      default: '',
      showIf: (v) => v.periodo === '3',
    },
    { name: 'observacoes', type: 'textarea', section: 'apreciacao', rows: 3, label: l('Observações do Director de Turma', 'Class director’s remarks') },
    { name: 'directorTurma', type: 'text', section: 'documento', width: 'half', label: l('Director(a) de Turma', 'Class director') },
    { name: 'directorPedagogico', type: 'text', section: 'documento', width: 'half', label: l('Director(a) Pedagógico(a)', 'Academic director'), default: (c) => c.profile?.representanteNome ?? '' },
    localField(),
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data', 'Date'), default: (c) => c.today },
  ],

  computed: (v) => {
    const max = Number(v.periodo) || 1;
    const linhas = rows(v.disciplinas)
      .filter((r) => str(r.disciplina))
      .map((r) => {
        const ns = [r.t1, r.t2, r.t3].slice(0, max).map(nota);
        const validas = ns.filter((n): n is number => n != null);
        return { r, ns, media: validas.length ? validas.reduce((a, b) => a + b, 0) / validas.length : null };
      });
    const medias = linhas.map((x) => x.media).filter((n): n is number => n != null);
    return { linhas, mediaGeral: medias.length ? medias.reduce((a, b) => a + b, 0) / medias.length : null };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [...licenceWarning(ctx)];
    const max = Number(v.escalaMax) || 20;
    if (!str(v.alunoNome)) w.push({ level: 'error', field: 'alunoNome', message: l('Indique o nome do aluno.', "Enter the pupil's name.") });
    const fora = rows(v.disciplinas).some((r) => [r.t1, r.t2, r.t3].map(nota).some((n) => n != null && (n < 0 || n > max)));
    if (fora) w.push({ level: 'error', field: 'disciplinas', message: l(`Há classificações fora da escala de 0 a ${max}.`, `Some marks are outside the 0–${max} scale.`) });
    const esc = ctx.legal.value<{ maximo: number; positiva: number }>('eduEscalaClassificacao');
    w.push({ level: 'info', message: l(`No Ensino Secundário Geral a escala é de 0 a ${esc.maximo}, positiva a partir de ${esc.positiva} (${cite('eduEscalaClassificacao')}). O boletim é interno e não substitui a pauta oficial nem o certificado.`, `Secondary scale 0–${esc.maximo}, pass from ${esc.positiva}. Internal document only.`) });
    return w;
  },

  personName: (v) => v.alunoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const max = Number(v.periodo) || 1;
    const pos = Number(v.escalaPositiva) || 10;
    const head = TRIMESTRES.slice(0, max);
    const linhas = c.linhas as { r: Record<string, any>; ns: (number | null)[]; media: number | null }[];
    const blocks: Block[] = [
      { type: 'title', text: 'Boletim de Avaliação', subtitle: `${TRIMESTRES[max - 1]}${max === 3 ? ' — final' : ''} · Ano lectivo de ${str(v.anoLectivo) || '______'}` },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Aluno', value: str(v.alunoNome) || ' ' },
          { label: 'N.º', value: str(v.alunoNumero) || ' ' },
          { label: 'Classe', value: str(v.classe) || ' ' },
          { label: 'Turma', value: str(v.turma) || ' ' },
        ],
      },
      {
        type: 'table',
        grid: true,
        columns: [
          { label: 'Disciplina', width: 34 },
          ...head.map((h) => ({ label: h.replace(' Trimestre', ' T.'), width: 12, align: 'center' as const })),
          { label: max > 1 ? 'Média' : 'Classif.', width: 12, align: 'center' as const },
          { label: 'Faltas', width: 10, align: 'center' as const },
        ],
        rows: (linhas.length ? linhas : [{ r: {}, ns: head.map(() => null), media: null }]).map((x) => [
          cell(x.r.disciplina),
          ...x.ns.map((n, k) => (n == null ? cell([x.r.t1, x.r.t2, x.r.t3][k]) : fmt(n))),
          x.media == null ? ' ' : `${fmt(x.media)}${x.media < pos ? ' *' : ''}`,
          cell(x.r.faltas),
        ]),
        totals: c.mediaGeral != null ? [['Média geral', ...head.map(() => ''), fmt(c.mediaGeral), '']] : undefined,
        note: `Escala de 0 a ${Number(v.escalaMax) || 20}; positiva a partir de ${pos}. * Classificação negativa.`,
      },
    ];
    const ap: { label: string; value: string }[] = [];
    if (str(v.comportamento)) ap.push({ label: 'Comportamento', value: str(v.comportamento) });
    if (max === 3 && str(v.resultado)) ap.push({ label: 'Resultado final', value: str(v.resultado) });
    if (ap.length) blocks.push({ type: 'keyValue', items: ap, columns: 2 });
    blocks.push(
      { type: 'box', label: 'Observações do Director de Turma', text: str(v.observacoes) || undefined, lines: str(v.observacoes) ? 0 : 3 },
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.data)}`,
        columns: [
          { role: 'Director(a) de Turma', name: str(v.directorTurma) || undefined },
          { role: 'A Direcção Pedagógica', name: str(v.directorPedagogico) || undefined, image: 'both' },
          { role: 'Tomei conhecimento', detail: 'Encarregado(a) de Educação' },
        ],
      },
      { type: 'note', text: `Documento interno da escola. Não substitui a pauta oficial nem o certificado de habilitações.`, en: 'Internal school document; not the official record or certificate.' },
    );
    return blocks;
  },
});
