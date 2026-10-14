// Declaração de conclusão: the school, university or training centre states
// that a student completed a grade, level or course, with the final mark, while
// the official certificate or diploma is pending. Presented to employers,
// universities, scholarship bodies and embassies, so it prints plain.

import { defineTemplate, type Block, type Warning } from '../model';
import { blank, cite, dateField, dateLong, l, localField, placeDate } from './_shared';
import {
  academicFields, alunoFields, alunoIdent, designacaoField, estudante, eSuperior, fechoDeclaracao, FINALIDADE_FIELD, finalidadeBlock,
  frequenciaTexto, inst, licenceWarning, schoolSignatures, semPonto, signatoryFields, str,
} from './_educacao';

export default defineTemplate({
  id: 'declaracao-de-conclusao',
  family: 'declaracao',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'aluno', title: l('Aluno / estudante', 'Student'), personRole: 'outro' },
    { id: 'frequencia', title: l('Conclusão', 'Completion') },
    { id: 'opcoes', title: l('Informação adicional', 'Additional information') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    { name: 'numero', type: 'text', section: 'documento', width: 'half', label: l('Declaração n.º (opcional)', 'Declaration no. (optional)'), default: (c) => c.nextRef },
    localField(),
    dateField(),
    designacaoField('documento'),
    ...alunoFields(['nome', 'genero', 'nascimento', 'naturalidade', 'docTipo', 'docNumero', 'pai', 'mae', 'numero']),
    { name: 'incluirFiliacao', type: 'toggle', section: 'aluno', default: true, label: l('Indicar a filiação (nomes dos pais)', "State the parents' names") },
    ...academicFields('frequencia', { turma: false }),
    { name: 'dataConclusao', type: 'date', section: 'frequencia', width: 'half', label: l('Data de conclusão (opcional)', 'Completion date (optional)'), help: l('No ensino geral basta o ano lectivo.', 'In general education the school year is enough.') },
    { name: 'classificacao', type: 'text', section: 'frequencia', width: 'half', label: l('Classificação / média final', 'Final mark'), placeholder: l('Ex.: 14 valores', 'E.g. 14 / 20') },
    { name: 'trabalhoFinal', type: 'text', section: 'frequencia', label: l('Trabalho de fim de curso (opcional)', 'Final project (optional)'), placeholder: l('Ex.: monografia "Gestão de tesouraria nas PME da cidade de Maputo"', 'E.g. dissertation title'), showIf: eSuperior },
    { name: 'dataDefesa', type: 'date', section: 'frequencia', width: 'half', label: l('Data da defesa', 'Defence date'), showIf: (v) => eSuperior(v) && Boolean(str(v.trabalhoFinal)) },
    {
      name: 'documentoPendente',
      type: 'select',
      section: 'opcoes',
      width: 'half',
      label: l('Documento oficial em preparação', 'Official document pending'),
      options: [
        { value: 'certificado de habilitações', label: l('Certificado de habilitações', 'Certificate of qualifications') },
        { value: 'certificado de conclusão e diploma', label: l('Certificado e diploma (ensino superior)', 'Certificate and diploma') },
        { value: 'certificado do curso', label: l('Certificado do curso', 'Course certificate') },
        { value: '', label: l('— não indicar —', '— do not state —') },
      ],
      default: 'certificado de habilitações',
    },
    FINALIDADE_FIELD('opcoes'),
    ...signatoryFields(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...licenceWarning(ctx)];
    if (!str(v.alunoNome)) w.push({ level: 'error', field: 'alunoNome', message: l('Indique o nome do aluno.', "Enter the student's name.") });
    if (!str(v.classe) && !str(v.curso)) w.push({ level: 'warning', field: 'classe', message: l('Indique a classe, o nível ou o curso concluído.', 'Enter the grade, level or course completed.') });
    w.push({
      level: 'info',
      message: l(
        `Esta declaração prova a conclusão enquanto o documento oficial não é emitido; não o substitui (${cite('eduCertificadoHabilitacoes')}). Confirme as classificações na pauta antes de assinar.`,
        'This declaration proves completion until the official document is issued; it does not replace it. Check the marks against the official record.',
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
    const quando = str(v.dataConclusao) ? `em ${dateLong(v.dataConclusao)}` : `no ano lectivo de ${blank(v.anoLectivo)}`;
    const o = frequenciaTexto(v);
    const cls = str(v.classificacao) ? `, com a classificação final de **${semPonto(v.classificacao)}**` : '';
    const trab =
      eSuperior(v) && str(v.trabalhoFinal)
        ? `, tendo apresentado e defendido ${semPonto(v.trabalhoFinal).replace(/^(a|o)\s+/i, (m) => m.toLowerCase())}${str(v.dataDefesa) ? ` em ${dateLong(v.dataDefesa)}` : ''}`
        : '';
    const numero = str(v.alunoNumero) ? `, com o número ${eSuperior(v) ? 'de estudante' : 'de processo'} ${str(v.alunoNumero)}` : '';
    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Conclusão', subtitle: str(v.numero) ? `N.º ${str(v.numero)}` : undefined },
      {
        type: 'paragraph',
        id: 'corpo',
        text: `Para os devidos efeitos, declara-se que ${alunoIdent(v, { filiacao: Boolean(v.incluirFiliacao) })} concluiu ${i.nesta}, ${quando}, ${o}${cls}${trab}${numero}.`,
        en: `This is to certify that ${str(v.alunoNome) || 'the student'} completed ${str(v.classe) || str(v.curso) || 'the course'} at this institution${str(v.classificacao) ? `, final mark ${str(v.classificacao)}` : ''}.`,
      },
    ];
    if (str(v.documentoPendente)) {
      blocks.push({
        type: 'paragraph',
        id: 'pendente',
        text: `${e.O} aguarda a emissão do respectivo ${str(v.documentoPendente)}, valendo a presente declaração como prova da conclusão até à sua entrega.`,
        en: `The ${str(v.documentoPendente)} is being prepared; this declaration proves completion until then.`,
      });
    }
    blocks.push(...finalidadeBlock(v), fechoDeclaracao(v, ctx), { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: schoolSignatures(v) });
    return blocks;
  },
});
