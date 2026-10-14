// Ficha de ocorrência disciplinar (participação): a teacher or staff member
// records an incident involving a pupil; the class director hears the pupil,
// informs the parent and proposes a measure under the school rules. Measures
// are educational, graduated and preceded by hearing the pupil and parent.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateLong, GENERO_OPTIONS, isF, l, localField } from './_shared';
import { horaText } from './_saude';
import { or, semPonto, str } from './_saude-educacao';

const GRAVIDADE_OPTIONS = [
  { value: 'leve', label: l('Leve', 'Minor') },
  { value: 'grave', label: l('Grave', 'Serious') },
  { value: 'muito grave', label: l('Muito grave', 'Very serious') },
];

const MEDIDAS = [
  { value: 'advertencia', label: l('Advertência oral', 'Oral warning'), pt: 'advertência oral' },
  { value: 'repreensao', label: l('Repreensão registada', 'Recorded reprimand'), pt: 'repreensão registada' },
  { value: 'tarefas', label: l('Tarefas de integração na escola', 'School integration tasks'), pt: 'realização de tarefas de integração na escola' },
  { value: 'suspensao', label: l('Suspensão da frequência', 'Suspension'), pt: 'suspensão da frequência' },
  { value: 'conselho', label: l('Remeter ao Conselho de Escola / Direcção', 'Refer to the School Council / management'), pt: 'apreciação pela Direcção e pelo Conselho de Escola' },
];

export default defineTemplate({
  id: 'ficha-ocorrencia-disciplinar',
  family: 'mapa',
  sections: [
    { id: 'ocorrencia', title: l('Ocorrência', 'Incident') },
    { id: 'aluno', title: l('Aluno', 'Pupil'), personRole: 'outro' },
    { id: 'descricao', title: l('Descrição', 'Description') },
    { id: 'seguimento', title: l('Seguimento', 'Follow-up') },
  ],
  fields: [
    { name: 'numero', type: 'text', section: 'ocorrencia', width: 'half', label: l('Ocorrência n.º', 'Incident no.'), default: (c) => c.nextRef },
    { name: 'dataOcorrencia', type: 'date', section: 'ocorrencia', width: 'half', required: true, label: l('Data', 'Date'), default: (c) => c.today },
    { name: 'hora', type: 'text', section: 'ocorrencia', width: 'half', label: l('Hora', 'Time'), placeholder: l('10:15', '10:15') },
    { name: 'localOcorrencia', type: 'text', section: 'ocorrencia', width: 'half', label: l('Local', 'Place'), placeholder: l('Ex.: sala 12, recreio', 'E.g. classroom 12') },
    { name: 'participante', type: 'text', section: 'ocorrencia', width: 'half', required: true, label: l('Participante (quem relata)', 'Reported by') },
    { name: 'participanteCargo', type: 'text', section: 'ocorrencia', width: 'half', label: l('Função', 'Role'), placeholder: l('Ex.: Professor de Matemática', 'E.g. Maths teacher') },
    { name: 'alunoNome', type: 'text', section: 'aluno', required: true, label: l('Nome do aluno', 'Pupil’s name'), personKey: 'nome' },
    { name: 'alunoGenero', type: 'radio', section: 'aluno', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'alunoNumero', type: 'text', section: 'aluno', width: 'third', label: l('N.º', 'No.') },
    { name: 'classe', type: 'text', section: 'aluno', width: 'third', label: l('Classe', 'Grade') },
    { name: 'turma', type: 'text', section: 'aluno', width: 'third', label: l('Turma', 'Class') },
    { name: 'encarregado', type: 'text', section: 'aluno', width: 'half', label: l('Encarregado de educação', 'Parent or guardian') },
    { name: 'encarregadoTelefone', type: 'tel', section: 'aluno', width: 'half', label: l('Telefone do encarregado', 'Parent’s phone') },
    { name: 'descricaoTexto', type: 'textarea', section: 'descricao', rows: 5, required: true, label: l('O que aconteceu', 'What happened'), help: l('Factos objectivos: o que se viu e ouviu, sem juízos.', 'Objective facts, no judgements.') },
    { name: 'testemunhas', type: 'text', section: 'descricao', label: l('Testemunhas (opcional)', 'Witnesses (optional)') },
    { name: 'gravidade', type: 'select', section: 'descricao', width: 'half', label: l('Gravidade (apreciação inicial)', 'Seriousness (initial)'), options: GRAVIDADE_OPTIONS, default: 'leve' },
    { name: 'medidaImediata', type: 'text', section: 'descricao', label: l('Medida imediata tomada (opcional)', 'Immediate action (optional)'), placeholder: l('Ex.: separação dos alunos e encaminhamento ao gabinete do Director de Turma', 'E.g. pupils separated and sent to the class director') },
    { name: 'convocar', type: 'toggle', section: 'seguimento', default: true, label: l('Convocar o encarregado de educação', 'Call the parent in') },
    { name: 'dataReuniao', type: 'date', section: 'seguimento', width: 'half', label: l('Data da reunião', 'Meeting date'), showIf: (v) => Boolean(v.convocar) },
    { name: 'horaReuniao', type: 'text', section: 'seguimento', width: 'half', label: l('Hora', 'Time'), showIf: (v) => Boolean(v.convocar) },
    { name: 'medida', type: 'select', section: 'seguimento', width: 'half', label: l('Medida proposta', 'Proposed measure'), options: [{ value: '', label: l('— a decidir após audição —', '— after hearing —') }, ...MEDIDAS.map(({ value, label }) => ({ value, label }))], default: '' },
    { name: 'suspensaoDias', type: 'number', section: 'seguimento', width: 'half', min: 1, max: 30, label: l('Dias de suspensão', 'Days of suspension'), showIf: (v) => v.medida === 'suspensao' },
    { name: 'directorTurma', type: 'text', section: 'seguimento', width: 'half', label: l('Director(a) de Turma', 'Class director') },
    localField('seguimento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.descricaoTexto)) w.push({ level: 'error', field: 'descricaoTexto', message: l('Descreva a ocorrência.', 'Describe the incident.') });
    if (v.medida && v.medida !== 'advertencia') w.push({ level: 'warning', field: 'medida', message: l(`Antes de aplicar a medida, ouça o aluno e o encarregado de educação e decida por escrito (${cite('seRegulamentoInternoEscola')}).`, 'Hear the pupil and parent and decide in writing before applying the measure.') });
    if (/bat|agred|castig|chicot|palmat/i.test(str(v.medidaImediata))) w.push({ level: 'error', field: 'medidaImediata', message: l(`Castigos corporais são proibidos (${cite('seDireitosCrianca')}).`, 'Corporal punishment is prohibited.') });
    if (/abus|ass[ée]dio|sexual|viol[êe]ncia dom/i.test(str(v.descricaoTexto))) w.push({ level: 'warning', field: 'descricaoTexto', message: l('Suspeita de abuso ou violência contra a criança: comunique de imediato à Direcção, que avalia a participação às autoridades. Não exponha a criança.', 'Suspected abuse: tell the management at once, who will consider reporting to the authorities.') });
    return w;
  },

  personName: (v) => v.alunoNome,
  documentDate: (v) => v.dataOcorrencia,

  blocks: (ctx) => {
    const v = ctx.values;
    const fa = isF(v.alunoGenero);
    const medida = MEDIDAS.find((m) => m.value === v.medida);
    const sd = Number(v.suspensaoDias);
    const blocks: Block[] = [
      { type: 'title', text: 'Participação de Ocorrência Disciplinar', subtitle: `N.º ${or(v.numero, '______')}` },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Aluno', value: str(v.alunoNome) || ' ' },
          { label: 'N.º / classe / turma', value: [str(v.alunoNumero), str(v.classe), str(v.turma)].filter(Boolean).join(' · ') || ' ' },
          { label: 'Data e hora', value: `${dateLong(v.dataOcorrencia)}${str(v.hora) ? `, ${horaText(v.hora)}` : ''}` },
          { label: 'Local', value: str(v.localOcorrencia) || ' ' },
          { label: 'Participante', value: [str(v.participante), str(v.participanteCargo)].filter(Boolean).join(', ') || ' ' },
          { label: 'Gravidade (inicial)', value: str(v.gravidade) || 'leve' },
          { label: 'Encarregado', value: [str(v.encarregado), str(v.encarregadoTelefone)].filter(Boolean).join(' · ') || ' ' },
          { label: 'Testemunhas', value: str(v.testemunhas) || ' ' },
        ],
      },
      { type: 'box', label: 'Descrição dos factos', text: str(v.descricaoTexto) || undefined, lines: str(v.descricaoTexto) ? 0 : 5 },
    ];
    if (str(v.medidaImediata)) blocks.push({ type: 'paragraph', id: 'imediata', text: `Medida imediata: ${semPonto(v.medidaImediata)}.`, en: `Immediate action: ${v.medidaImediata}.` });
    blocks.push(
      { type: 'box', label: `Declaração ${fa ? 'da aluna' : 'do aluno'} (audição)`, lines: 3, keepWithNext: true },
      { type: 'paragraph', id: 'assinaturaAluno', text: `Assinatura ${fa ? 'da aluna' : 'do aluno'}: ______________________________     Data: ____/____/______`, en: 'Pupil’s signature and date.', size: 'small', align: 'right' },
    );
    const seg: string[] = [];
    if (v.convocar) seg.push(`O encarregado de educação é convocado para uma reunião com o Director de Turma no dia ${dateLong(v.dataReuniao)}, às ${horaText(v.horaReuniao)}, para ser ouvido sobre a ocorrência.`);
    if (medida) seg.push(`Medida proposta: **${medida.pt}${medida.value === 'suspensao' && str(v.suspensaoDias) && Number.isFinite(sd) ? ` por ${sd} ${sd === 1 ? 'dia lectivo' : 'dias lectivos'}, com plano de actividades` : ''}**, a decidir por escrito depois da audição ${fa ? 'da aluna' : 'do aluno'} e do encarregado de educação, nos termos do regulamento interno.`);
    else seg.push('A medida é decidida por escrito depois da audição do aluno e do encarregado de educação, nos termos do regulamento interno.');
    blocks.push(
      { type: 'paragraph', id: 'seguimento', text: seg.join(' '), en: 'The parent is called in; the measure is decided in writing after hearing the pupil and parent, under the school rules.', keepWithNext: true },
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.dataOcorrencia)}`,
        columns: [
          { role: 'Participante', name: str(v.participante) || undefined },
          { role: 'Director(a) de Turma', name: str(v.directorTurma) || undefined },
          { role: 'Encarregado(a) de Educação', name: str(v.encarregado) || undefined, detail: 'Tomei conhecimento' },
        ],
      },
      { type: 'note', text: 'Documento confidencial do processo individual do aluno. Não pode ser afixado nem divulgado a terceiros.', en: 'Confidential pupil record; not to be posted or shared.' },
    );
    return blocks;
  },
});
