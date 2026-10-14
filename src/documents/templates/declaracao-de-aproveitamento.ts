// Declaração de aproveitamento: the school or institution states the grades
// of a year, term or semester. It is a provisional or partial statement: the
// completion of a level is proven by the official certificate (national model,
// homologated by INECE when required), never by this declaration.

import { inteiroPorExtenso } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { blank, dateField, l, localField, placeDate } from './_shared';
import {
  academicFields, alunoFields, cap, alunoIdent, designacaoField, eSuperior, estudante, FINALIDADE_FIELD, finalidadeBlock, fechoDeclaracao,
  frequenciaTexto, inst, licenceNote, licenceWarning, num, rows, schoolSignatures, signatoryFields, str,
} from './_educacao';

const PERIODO: Record<string, string> = {
  ano: '',
  t1: 'no 1.º trimestre',
  t2: 'no 2.º trimestre',
  t3: 'no 3.º trimestre',
  s1: 'no 1.º semestre',
  s2: 'no 2.º semestre',
};

const RESULTADO: Record<string, { pt: string; en: string }> = {
  transitou: { pt: 'TRANSITOU', en: 'passed to the next grade' },
  aprovado: { pt: 'APROVADO', en: 'passed' },
  admitido: { pt: 'ADMITIDO A EXAME', en: 'admitted to the exam' },
  'nao-transitou': { pt: 'NÃO TRANSITOU', en: 'did not pass to the next grade' },
  reprovado: { pt: 'REPROVADO', en: 'failed' },
};

function fmtNota(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
}

export default defineTemplate({
  id: 'declaracao-de-aproveitamento',
  family: 'declaracao',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'aluno', title: l('Aluno / estudante', 'Student'), personRole: 'outro' },
    { id: 'frequencia', title: l('Ano e turma', 'Year and class') },
    { id: 'notas', title: l('Classificações', 'Grades') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    { name: 'numero', type: 'text', section: 'documento', width: 'half', label: l('Declaração n.º (opcional)', 'Declaration no. (optional)'), default: (c) => c.nextRef },
    localField(),
    dateField(),
    designacaoField('documento'),
    FINALIDADE_FIELD('documento'),
    ...alunoFields(['nome', 'genero', 'nascimento', 'naturalidade', 'docTipo', 'docNumero', 'pai', 'mae', 'numero']),
    { name: 'incluirFiliacao', type: 'toggle', section: 'aluno', label: l('Indicar a filiação (nomes dos pais)', "State the parents' names"), default: true },
    ...academicFields('frequencia'),
    {
      name: 'periodo',
      type: 'select',
      section: 'frequencia',
      width: 'half',
      label: l('Período avaliado', 'Period'),
      options: [
        { value: 'ano', label: l('Ano lectivo completo', 'Whole year') },
        { value: 't1', label: l('1.º trimestre', '1st term') },
        { value: 't2', label: l('2.º trimestre', '2nd term') },
        { value: 't3', label: l('3.º trimestre', '3rd term') },
        { value: 's1', label: l('1.º semestre', '1st semester') },
        { value: 's2', label: l('2.º semestre', '2nd semester') },
      ],
      default: 'ano',
    },
    {
      name: 'escala',
      type: 'select',
      section: 'notas',
      width: 'half',
      label: l('Escala de classificação', 'Grading scale'),
      options: [
        { value: '20', label: l('0 a 20 valores', '0–20') },
        { value: '100', label: l('0 a 100', '0–100') },
        { value: 'qualitativa', label: l('Qualitativa (Bom, Muito Bom…)', 'Qualitative') },
      ],
      default: '20',
    },
    {
      name: 'disciplinas',
      type: 'lines',
      section: 'notas',
      required: true,
      label: l('Disciplinas e classificações', 'Subjects and grades'),
      addLabel: l('Adicionar disciplina', 'Add subject'),
      columns: [
        { name: 'disciplina', type: 'text', label: l('Disciplina / cadeira', 'Subject') },
        { name: 'nota', type: 'text', label: l('Classificação', 'Grade') },
        { name: 'observacao', type: 'text', label: l('Observação (opcional)', 'Remark (optional)'), placeholder: l('Ex.: Dispensado', 'E.g. Exempt') },
      ],
      default: [],
    },
    { name: 'mostrarExtenso', type: 'toggle', section: 'notas', label: l('Escrever a classificação por extenso', 'Write grades in words'), default: true, showIf: (v) => v.escala !== 'qualitativa' },
    { name: 'mostrarMedia', type: 'toggle', section: 'notas', label: l('Indicar a média', 'Show the average'), default: true, showIf: (v) => v.escala !== 'qualitativa' },
    {
      name: 'resultado',
      type: 'select',
      section: 'notas',
      width: 'half',
      label: l('Resultado final', 'Final result'),
      options: [
        { value: '', label: l('— não indicar —', '— do not state —') },
        { value: 'transitou', label: l('Transitou de classe', 'Passed to the next grade') },
        { value: 'aprovado', label: l('Aprovado', 'Passed') },
        { value: 'admitido', label: l('Admitido a exame', 'Admitted to the exam') },
        { value: 'nao-transitou', label: l('Não transitou', 'Did not pass') },
        { value: 'reprovado', label: l('Reprovado', 'Failed') },
      ],
      default: '',
    },
    { name: 'semExame', type: 'toggle', section: 'notas', label: l('A progressão verificou-se sem exames', 'Progression without exams'), help: l('Use só quando o Ministério dispensou os exames nesse ano.', 'Only when the Ministry waived exams that year.') },
    { name: 'notaProvisoria', type: 'toggle', section: 'notas', label: l('Indicar que não substitui o certificado', 'State that it does not replace the certificate'), default: true },
    ...signatoryFields(),
  ],
  computed: (v) => {
    const notas = rows(v.disciplinas).map((r) => num(r.nota)).filter((n): n is number => n != null);
    const media = notas.length ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10 : null;
    return { media };
  },
  warnings: (v, ctx) => {
    const w: Warning[] = [...licenceWarning(ctx)];
    if (!str(v.alunoNome)) w.push({ level: 'error', field: 'alunoNome', message: l('Indique o nome do aluno.', "Enter the student's name.") });
    const linhas = rows(v.disciplinas).filter((r) => str(r.disciplina));
    if (!linhas.length) w.push({ level: 'warning', field: 'disciplinas', message: l('Acrescente as disciplinas e as classificações.', 'Add the subjects and grades.') });
    if (v.escala === '20' || !v.escala) {
      const escala = ctx.legal.value<{ maximo: number; positiva: number }>('eduEscalaClassificacao');
      const fora = linhas.filter((r) => {
        const n = num(r.nota);
        return n != null && (n < 0 || n > escala.maximo);
      });
      if (fora.length) w.push({ level: 'error', field: 'disciplinas', message: l(`Há classificações fora da escala de 0 a ${escala.maximo}.`, `Some grades are outside the 0–${escala.maximo} scale.`) });
      const negativas = linhas.filter((r) => {
        const n = num(r.nota);
        return n != null && n < escala.positiva;
      });
      if (negativas.length && (v.resultado === 'aprovado' || v.resultado === 'transitou'))
        w.push({
          level: 'warning',
          field: 'resultado',
          message: l(
            `Há classificações negativas (abaixo de ${escala.positiva}) e o resultado diz "aprovado/transitou". Confirme as regras de transição.`,
            `Some grades are below ${escala.positiva} but the result says passed. Check the progression rules.`,
          ),
        });
    }
    w.push({
      level: 'info',
      message: l(
        'A conclusão de uma classe ou nível prova-se com o certificado de habilitações no modelo oficial (homologado pelo INECE quando exigido). Esta declaração não o substitui.',
        'Completion is proven by the official certificate (homologated by INECE when required). This declaration does not replace it.',
      ),
    });
    if (/empreg|trabalh/i.test(str(v.finalidade)))
      w.push({
        level: 'info',
        message: l(
          'Trabalhador-estudante: a manutenção do estatuto depende de aproveitamento escolar positivo (Lei do Trabalho).',
          'Worker-student: keeping the status depends on positive results (Labour Law).',
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
    const qual = v.escala === 'qualitativa';
    const extenso = !qual && v.mostrarExtenso !== false;
    const periodo = PERIODO[str(v.periodo)] ?? '';
    const ano = eSuperior(v) ? `${periodo ? `${periodo} ` : ''}do ano académico de ${blank(v.anoLectivo)}` : `${periodo ? `${periodo} ` : ''}do ano lectivo de ${blank(v.anoLectivo)}`;
    const linhas = rows(v.disciplinas).filter((r) => str(r.disciplina) || str(r.nota));
    const unidade = v.escala === '100' ? 'pontos' : 'valores';
    const palavras = (n: number | null) => (n != null && Number.isInteger(n) && n >= 0 ? `${inteiroPorExtenso(n)} ${n === 1 ? unidade.replace(/es$|s$/, '') : unidade}` : '');
    const notaDe = (r: Record<string, any>) => {
      const n = num(r.nota);
      return { n, txt: str(r.nota) ? (n != null ? fmtNota(n) : str(r.nota)) : '' };
    };
    const lista = linhas.length ? linhas : [{}, {}, {}];
    const media = ctx.computed.media as number | null;
    const comMedia = !qual && v.mostrarMedia !== false && media != null;
    const notaLabel = qual ? 'Menção' : v.escala === '100' ? 'Classificação (0–100)' : 'Classificação (0–20)';
    const discLabel = eSuperior(v) ? 'Disciplina / cadeira' : 'Disciplina';
    // Many subjects: two subjects per row so the declaration fits one page.
    const duplo = lista.length > 8;
    let columns: { label: string; width?: number; align?: 'left' | 'right' | 'center' }[];
    let tableRows: string[][];
    let totals: string[][] | undefined;
    if (duplo) {
      const cell = (r: Record<string, any>) => {
        const { n, txt } = notaDe(r);
        const ext = extenso && palavras(n) ? ` (${palavras(n)})` : '';
        return `${txt}${ext}${str(r.observacao) ? ` — ${str(r.observacao)}` : ''}`;
      };
      const half = Math.ceil(lista.length / 2);
      columns = [
        { label: discLabel, width: 24 },
        { label: notaLabel, width: 26 },
        { label: discLabel, width: 24 },
        { label: notaLabel, width: 26 },
      ];
      tableRows = Array.from({ length: half }, (_, k) => {
        const r1 = lista[k];
        const r2 = lista[k + half];
        return [str(r1.disciplina), cell(r1), r2 ? str(r2.disciplina) : '', r2 ? cell(r2) : ''];
      });
      totals = comMedia ? [['Média', `${fmtNota(media!)} ${unidade}`, '', '']] : undefined;
    } else {
      tableRows = lista.map((r) => {
        const { n, txt } = notaDe(r);
        return [str(r.disciplina), txt, ...(extenso ? [palavras(n)] : []), str(r.observacao)];
      });
      columns = [
        { label: discLabel, width: extenso ? 38 : 50 },
        { label: notaLabel, width: 18, align: 'center' },
        ...(extenso ? [{ label: 'Por extenso', width: 24 }] : []),
        { label: 'Observação', width: extenso ? 20 : 32 },
      ];
      totals = comMedia ? [['Média', fmtNota(media!), ...(extenso ? [''] : []), '']] : undefined;
    }

    const blocks: Block[] = [];
    blocks.push(
      { type: 'title', text: 'Declaração de Aproveitamento', subtitle: str(v.numero) ? `N.º ${str(v.numero)}` : undefined },
      {
        type: 'paragraph',
        id: 'corpo',
        text: `Para os devidos efeitos, declara-se que ${alunoIdent(v, { filiacao: Boolean(v.incluirFiliacao) })} frequentou ${i.nesta}, ${ano}, ${frequenciaTexto(v)}${str(v.alunoNumero) ? `, com o número ${eSuperior(v) ? 'de estudante' : 'de processo'} ${str(v.alunoNumero)}` : ''}, tendo obtido as seguintes classificações:`,
        en: `This is to certify that ${str(v.alunoNome) || 'the student'} attended this institution in ${str(v.anoLectivo) || 'the year'} and obtained the following grades:`,
        keepWithNext: true,
      },
      { type: 'table', columns, rows: tableRows, totals },
    );
    const res = RESULTADO[str(v.resultado)];
    if (res) {
      const mediaTxt = !qual && media != null ? `, com a média final de ${fmtNota(media)} ${v.escala === '100' ? 'pontos' : 'valores'}` : '';
      const pal = e.f ? res.pt.replace(/O$/, 'A').replace('ADMITIDO', 'ADMITIDA').replace('APROVADO', 'APROVADA').replace('REPROVADO', 'REPROVADA') : res.pt;
      blocks.push({
        type: 'paragraph',
        id: 'resultado',
        text: res.pt === 'TRANSITOU' || res.pt === 'NÃO TRANSITOU' ? `Em resultado, ${e.o} **${res.pt}** de classe${mediaTxt}.` : `Em resultado, ${e.o} foi considerad${e.f ? 'a' : 'o'} **${pal}**${mediaTxt}.`,
        en: `As a result, the student ${res.en}.`,
      });
    }
    if (v.semExame)
      blocks.push({
        type: 'paragraph',
        id: 'semExame',
        text: 'A progressão verificou-se sem realização de exames, nos termos das orientações do Ministério que superintende a área da Educação.',
        en: 'Progression took place without exams, under the Ministry of Education guidelines.',
      });
    const fin = finalidadeBlock(v)[0];
    if (v.notaProvisoria !== false) {
      const finTxt = fin && fin.type === 'paragraph' ? ` ${cap(fin.text.replace(/^A presente declaração /, ''))}` : '';
      blocks.push({
        type: 'paragraph',
        id: 'provisoria',
        text: `A presente declaração não substitui o certificado de habilitações, que é emitido nos termos regulamentares.${finTxt}`,
        en: 'This declaration does not replace the certificate of qualifications, issued under the regulations.',
      });
    } else if (fin) blocks.push(fin);
    blocks.push(fechoDeclaracao(v, ctx), { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: schoolSignatures(v) }, ...licenceNote(ctx));
    return blocks;
  },
});
