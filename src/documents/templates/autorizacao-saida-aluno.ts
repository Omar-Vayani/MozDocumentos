// Autorização de saída do aluno: the parent authorises the school to let the
// pupil leave early on a given day, to hand the pupil to other named adults
// for the school year, or to let an older pupil leave alone.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, exmo, GENERO_OPTIONS, isF, l, localField, placeDate } from './_shared';
import { encarregadoFields } from './_educacao';
import { horaText } from './_saude';
import { cell, or, rows, semPonto, str } from './_saude-educacao';

const TIPO_OPTIONS = [
  { value: 'pontual', label: l('Saída antecipada num dia', 'Early leave on one day') },
  { value: 'terceiros', label: l('Pessoas autorizadas a ir buscar o aluno (ano lectivo)', 'People allowed to collect the pupil (school year)') },
  { value: 'sozinho', label: l('O aluno pode sair sozinho no fim das aulas', 'The pupil may leave alone after school') },
];

export default defineTemplate({
  id: 'autorizacao-saida-aluno',
  family: 'declaracao',
  letterhead: false,
  page: (v) => (v.tipo === 'terceiros' ? 'A4' : 'A5'),
  sections: [
    { id: 'escola', title: l('Escola', 'School') },
    { id: 'encarregado', title: l('Encarregado de educação', 'Parent or guardian'), personRole: 'outro' },
    { id: 'aluno', title: l('Aluno', 'Pupil') },
    { id: 'autorizacao', title: l('Autorização', 'Authorisation') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'escola', type: 'text', section: 'escola', required: true, label: l('Escola', 'School') },
    { name: 'destinatarioCargo', type: 'text', section: 'escola', width: 'half', label: l('Dirigida a', 'Addressed to'), default: 'Director da Escola' },
    { name: 'destinatarioGenero', type: 'radio', section: 'escola', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    ...encarregadoFields(['nome', 'genero', 'parentesco', 'docTipo', 'docNumero', 'telefone']),
    { name: 'alunoNome', type: 'text', section: 'aluno', required: true, label: l('Nome do aluno', 'Pupil’s name') },
    { name: 'alunoGenero', type: 'radio', section: 'aluno', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'classe', type: 'text', section: 'aluno', width: 'half', label: l('Classe', 'Grade') },
    { name: 'turma', type: 'text', section: 'aluno', width: 'half', label: l('Turma', 'Class') },
    { name: 'tipo', type: 'select', section: 'autorizacao', label: l('Tipo de autorização', 'Kind of authorisation'), options: TIPO_OPTIONS, default: 'pontual' },
    { name: 'dataSaida', type: 'date', section: 'autorizacao', width: 'half', label: l('Dia', 'Day'), default: (c) => c.today, showIf: (v) => v.tipo === 'pontual' },
    { name: 'horaSaida', type: 'text', section: 'autorizacao', width: 'half', label: l('Hora', 'Time'), placeholder: l('10h30', '10:30'), showIf: (v) => v.tipo === 'pontual' },
    { name: 'motivo', type: 'text', section: 'autorizacao', label: l('Motivo', 'Reason'), placeholder: l('Ex.: consulta médica', 'E.g. doctor’s appointment'), showIf: (v) => v.tipo === 'pontual' },
    { name: 'quemRecolhe', type: 'text', section: 'autorizacao', label: l('Quem vem buscar (nome e BI)', 'Who collects (name and ID)'), placeholder: l('Em branco: o próprio encarregado', 'Blank: the parent'), showIf: (v) => v.tipo === 'pontual' },
    {
      name: 'pessoas',
      type: 'lines',
      section: 'autorizacao',
      label: l('Pessoas autorizadas', 'Authorised people'),
      addLabel: l('Adicionar pessoa', 'Add person'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'parentesco', type: 'text', label: l('Parentesco', 'Relationship') },
        { name: 'doc', type: 'text', label: l('BI n.º', 'ID no.') },
        { name: 'telefone', type: 'text', label: l('Telefone', 'Phone') },
      ],
      default: [],
      showIf: (v) => v.tipo === 'terceiros',
    },
    { name: 'anoLectivo', type: 'text', section: 'autorizacao', width: 'half', label: l('Ano lectivo', 'School year'), default: (c) => (c.today || '').slice(0, 4), showIf: (v) => v.tipo !== 'pontual' },
    localField(),
    dateField(),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (v.tipo === 'terceiros' && !rows(v.pessoas).some((p) => str(p.nome))) w.push({ level: 'error', field: 'pessoas', message: l('Indique as pessoas autorizadas.', 'List the authorised people.') });
    if (v.tipo === 'sozinho') {
      w.push({ level: 'warning', field: 'tipo', message: l(`Autorize a saída sozinho só quando a idade e o percurso o permitam: a responsabilidade pela criança é dos pais (${cite('seDireitosCrianca')}).`, 'Allow leaving alone only if age and route allow it.') });
    }
    w.push({ level: 'info', message: l(`Entregue o original na secretaria e guarde uma cópia. Quem vem buscar o aluno deve levar o BI (${cite('seRegulamentoInternoEscola')}).`, 'Hand in the original and keep a copy. Whoever collects the pupil must bring their ID.') });
    return w;
  },

  personName: (v) => v.alunoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fe = isF(v.encarregadoGenero);
    const fa = isF(v.alunoGenero);
    const educ = `${fa ? 'da aluna' : 'do aluno'} **${or(v.alunoNome)}**${str(v.classe) ? `, da ${str(v.classe)}${str(v.turma) ? `, turma ${str(v.turma)}` : ''}` : ''}`;
    const eu = `Eu, **${or(v.encarregadoNome)}**${str(v.encarregadoDocNumero) ? `, ${fe ? 'portadora' : 'portador'} do ${str(v.encarregadoDocTipo) || 'BI'} n.º ${str(v.encarregadoDocNumero)}` : ''}, ${fe ? 'encarregada' : 'encarregado'} de educação`;
    const blocks: Block[] = [
      { type: 'recipient', lines: [`${exmo(v.destinatarioGenero)} ${str(v.destinatarioCargo) || 'Director da Escola'}`, or(v.escola)] },
      { type: 'title', text: v.tipo === 'pontual' ? 'Autorização de Saída Antecipada' : v.tipo === 'sozinho' ? 'Autorização de Saída do Aluno' : 'Autorização de Recolha do Aluno' },
    ];
    if (v.tipo === 'pontual') {
      const quem = str(v.quemRecolhe);
      blocks.push({
        type: 'paragraph',
        id: 'pontual',
        text: `${eu} ${educ}, autorizo a sua saída da Escola no dia **${dateLong(v.dataSaida)}**, às ${horaText(v.horaSaida)}${str(v.motivo) ? `, por motivo de ${semPonto(v.motivo).replace(/^por\s+/i, '')}` : ''}, ${quem ? `sendo ${fa ? 'acompanhada' : 'acompanhado'} por **${semPonto(quem)}**, que apresentará o seu documento de identificação` : `sendo ${fa ? 'recolhida' : 'recolhido'} por mim`}.`,
        en: `As parent of ${v.alunoNome || '___'}, I authorise the pupil to leave school on ${v.dataSaida || '___'} at ${v.horaSaida || '___'}${quem ? `, collected by ${quem}` : ', collected by me'}.`,
      });
    } else if (v.tipo === 'sozinho') {
      blocks.push({
        type: 'paragraph',
        id: 'sozinho',
        text: `${eu} ${educ}, autorizo ${fa ? 'a minha educanda' : 'o meu educando'} a sair da Escola sem acompanhamento no fim das actividades lectivas, durante o ano lectivo de ${or(v.anoLectivo, '______')}, assumindo a responsabilidade pelo percurso entre a Escola e a residência.`,
        en: `As parent, I authorise the pupil to leave school alone after classes during the ${v.anoLectivo || '___'} school year, and take responsibility for the journey home.`,
      });
    } else {
      const ps = rows(v.pessoas).filter((p) => str(p.nome));
      blocks.push(
        {
          type: 'paragraph',
          id: 'terceiros',
          text: `${eu} ${educ}, autorizo a Escola a entregar ${fa ? 'a minha educanda' : 'o meu educando'}, durante o ano lectivo de ${or(v.anoLectivo, '______')}, a mim ou a qualquer das pessoas seguintes, mediante a apresentação do documento de identificação:`,
          en: `As parent, I authorise the school to hand the pupil, during the ${v.anoLectivo || '___'} school year, to me or any of the following people on presentation of ID:`,
          keepWithNext: true,
        },
        {
          type: 'table',
          grid: true,
          columns: [{ label: 'Nome', width: 38 }, { label: 'Parentesco', width: 18 }, { label: 'BI n.º', width: 22 }, { label: 'Telefone', width: 22 }],
          rows: (ps.length ? ps : [{}, {}, {}]).map((p) => [cell(p.nome), cell(p.parentesco), cell(p.doc), cell(p.telefone)]),
        },
        { type: 'paragraph', id: 'revogacao', text: 'Comunicarei por escrito à Escola qualquer alteração desta lista. A Escola não entrega o aluno a pessoa que não conste da lista sem o meu contacto prévio.', en: 'I will notify any change in writing; the school will not release the pupil to anyone not listed without contacting me first.' },
      );
    }
    blocks.push(
      { type: 'paragraph', id: 'contacto', text: `Contacto do encarregado de educação: ${str(v.encarregadoTelefone) || '____________________'}.`, en: `Parent’s contact: ${v.encarregadoTelefone || '___'}.`, keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [{ role: fe ? 'A Encarregada de Educação' : 'O Encarregado de Educação', name: str(v.encarregadoNome) || undefined }] },
    );
    if (v.tipo === 'pontual') blocks.push({ type: 'box', label: 'Para uso da escola', text: 'Saída às ____h____          Rubrica: ________________\nEntregue a: ______________________   BI n.º ______________', lines: 0 });
    return blocks;
  },
});
