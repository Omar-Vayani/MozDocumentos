// Declaração de vaga: the receiving school states that it has a place for a
// pupil in a given grade, so that the school of origin can process the
// transfer (guia de transferência) and send the pupil's file.

import { defineTemplate, type Block, type Warning } from '../model';
import { blank, cite, dateField, dateLong, l, localField, placeDate } from './_shared';
import { academicFields, alunoFields, alunoIdent, designacaoField, estudante, fechoDeclaracao, inst, licenceWarning, num, schoolSignatures, signatoryFields, str } from './_educacao';

export default defineTemplate({
  id: 'declaracao-de-vaga',
  family: 'declaracao',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'aluno', title: l('Aluno', 'Pupil'), personRole: 'outro' },
    { id: 'frequencia', title: l('Vaga', 'Place') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    { name: 'numero', type: 'text', section: 'documento', width: 'half', label: l('Declaração n.º (opcional)', 'Declaration no. (optional)'), default: (c) => c.nextRef },
    localField(),
    dateField(),
    designacaoField('documento'),
    ...alunoFields(['nome', 'genero', 'nascimento', 'docTipo', 'docNumero', 'pai', 'mae']),
    { name: 'escolaOrigem', type: 'text', section: 'frequencia', required: true, label: l('Escola de origem', 'School of origin') },
    ...academicFields('frequencia', { curso: false }).filter((f) => f.name !== 'turma'),
    { name: 'entregaAte', type: 'date', section: 'frequencia', width: 'half', label: l('Guia de transferência até (opcional)', 'Transfer form by (optional)') },
    { name: 'validadeDias', type: 'number', section: 'frequencia', width: 'half', min: 1, label: l('Vaga reservada por (dias, opcional)', 'Place held for (days, optional)') },
    ...signatoryFields(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...licenceWarning(ctx)];
    if (!str(v.alunoNome)) w.push({ level: 'error', field: 'alunoNome', message: l('Indique o nome do aluno.', "Enter the pupil's name.") });
    if (!str(v.classe)) w.push({ level: 'warning', field: 'classe', message: l('Indique a classe em que há vaga.', 'Enter the grade.') });
    w.push({ level: 'info', message: l(`A transferência só fica concluída com a guia de transferência da escola de origem, no modelo oficial (${cite('eduTransferenciaEscolar')}).`, 'The transfer is completed only with the official transfer form from the school of origin.') });
    return w;
  },

  personName: (v) => str(v.alunoNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,

  blocks: (ctx) => {
    const v = ctx.values;
    const e = estudante(v);
    const i = inst(v);
    const dias = num(v.validadeDias);
    const turno = str(v.turno) ? `, turno ${str(v.turno)}` : '';
    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Vaga', subtitle: str(v.numero) ? `N.º ${str(v.numero)}` : undefined },
      {
        type: 'paragraph',
        id: 'corpo',
        text: `Para efeitos de transferência, declara-se que existe ${i.nesta} vaga para ${e.o} ${alunoIdent(v)} actualmente ${e.matriculado} na **${blank(v.escolaOrigem)}**, na **${blank(v.classe)}**${turno}, no ano lectivo de ${blank(v.anoLectivo)}.`,
        en: `For transfer purposes, there is a place at this school for ${str(v.alunoNome) || 'the pupil'}, currently at ${str(v.escolaOrigem) || '___'}, in ${str(v.classe) || '___'}, school year ${str(v.anoLectivo) || '___'}.`,
      },
      {
        type: 'paragraph',
        id: 'condicoes',
        text: `A matrícula ${i.nesta} fica dependente da entrega da guia de transferência e do processo individual ${e.do}${str(v.entregaAte) ? ` até ${dateLong(v.entregaAte)}` : ''}${dias ? `, ficando a vaga reservada durante ${dias} ${dias === 1 ? 'dia' : 'dias'} a contar desta data` : ''}.`,
        en: `Enrolment depends on receiving the transfer form and the pupil’s file${str(v.entregaAte) ? ` by ${v.entregaAte}` : ''}${dias ? `; the place is held for ${dias} days` : ''}.`,
      },
      fechoDeclaracao(v, ctx),
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: schoolSignatures(v) },
    ];
    return blocks;
  },
});
