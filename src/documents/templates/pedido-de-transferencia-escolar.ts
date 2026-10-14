// Pedido de transferência de escola: the parent/guardian asks the director of
// the current school to authorise the transfer and issue the transfer form
// (guia de transferência, an official school document) and the pupil's file.
// Without an authorised transfer a pupil may be registered as having dropped
// out. Plain request, no letterhead; presented to a public body when the
// school is public.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, DOC_TIPO_OPTIONS, dateField, dateLong, exmo, GENERO_OPTIONS, isF, l, localField } from './_shared';
import { mesAno, semPonto, str } from './_educacao';

const MOTIVOS: Record<string, string> = {
  residencia: 'mudança de residência',
  trabalho: 'transferência do local de trabalho do Encarregado de Educação',
  proximidade: 'maior proximidade da escola de destino em relação à residência',
  ensino: 'opção por outro estabelecimento de ensino',
  saude: 'razões de saúde',
  outro: '',
};

export default defineTemplate({
  id: 'pedido-de-transferencia-escolar',
  family: 'carta',
  letterhead: false,
  official: (v) => (v.escolaPublica === false ? undefined : 'estado'),
  sections: [
    { id: 'documento', title: l('Escola actual', 'Current school') },
    { id: 'encarregado', title: l('Encarregado de educação (requerente)', 'Parent / guardian (applicant)'), personRole: 'cliente' },
    { id: 'aluno', title: l('Aluno', 'Pupil'), personRole: 'outro' },
    { id: 'transferencia', title: l('Transferência', 'Transfer') },
  ],
  fields: [
    localField(),
    dateField(),
    { name: 'escolaActual', type: 'text', section: 'documento', required: true, label: l('Escola actual', 'Current school'), placeholder: l('Ex.: Escola Primária Completa 3 de Fevereiro', 'E.g. 3 de Fevereiro Primary School') },
    { name: 'directorGenero', type: 'radio', section: 'documento', width: 'half', label: l('Director(a)', 'Director'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'escolaPublica', type: 'toggle', section: 'documento', label: l('A escola actual é pública', 'The current school is public'), default: true },
    { name: 'encarregadoNome', type: 'text', section: 'encarregado', required: true, label: l('Nome completo', 'Full name'), personKey: 'nome', default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.nome ?? '' : '') },
    { name: 'encarregadoGenero', type: 'radio', section: 'encarregado', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, personKey: 'genero', default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.genero ?? 'M' : 'M') },
    { name: 'encarregadoDocTipo', type: 'select', section: 'encarregado', width: 'half', label: l('Documento', 'ID document'), options: DOC_TIPO_OPTIONS, personKey: 'docTipo', default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.docTipo ?? 'BI' : 'BI') },
    { name: 'encarregadoDocNumero', type: 'text', section: 'encarregado', width: 'half', label: l('Número do documento', 'Document number'), personKey: 'docNumero', default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.docNumero ?? '' : '') },
    { name: 'encarregadoMorada', type: 'text', section: 'encarregado', label: l('Residência', 'Address'), personKey: 'morada' },
    { name: 'encarregadoTelefone', type: 'tel', section: 'encarregado', width: 'half', label: l('Telefone', 'Phone'), default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.telefones ?? '' : '') },
    { name: 'alunoNome', type: 'text', section: 'aluno', required: true, label: l('Nome do aluno', "Pupil's name"), personKey: 'nome' },
    { name: 'alunoGenero', type: 'radio', section: 'aluno', width: 'half', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'alunoNumero', type: 'text', section: 'aluno', width: 'half', label: l('N.º do aluno (opcional)', 'Pupil no. (optional)') },
    { name: 'classe', type: 'text', section: 'aluno', width: 'half', required: true, label: l('Classe', 'Grade'), placeholder: l('Ex.: 5.ª classe', 'E.g. 5.ª classe') },
    { name: 'turma', type: 'text', section: 'aluno', width: 'half', label: l('Turma', 'Class') },
    { name: 'anoLectivo', type: 'text', section: 'aluno', width: 'half', label: l('Ano lectivo', 'School year'), default: (c) => (c.today || '').slice(0, 4) },
    { name: 'escolaDestino', type: 'text', section: 'transferencia', required: true, label: l('Escola de destino', 'Destination school') },
    { name: 'localidadeDestino', type: 'text', section: 'transferencia', label: l('Localidade / distrito / província', 'Town / district / province') },
    { name: 'motivo', type: 'select', section: 'transferencia', width: 'half', label: l('Motivo', 'Reason'), options: [
      { value: 'residencia', label: l('Mudança de residência', 'Moving house') },
      { value: 'trabalho', label: l('Transferência do trabalho do encarregado', "Parent's job transfer") },
      { value: 'proximidade', label: l('Escola mais próxima de casa', 'Closer to home') },
      { value: 'ensino', label: l('Opção por outra escola', 'Choice of another school') },
      { value: 'saude', label: l('Razões de saúde', 'Health reasons') },
      { value: 'outro', label: l('Outro', 'Other') },
    ], default: 'residencia' },
    { name: 'motivoTexto', type: 'text', section: 'transferencia', width: 'half', label: l('Pormenor (opcional)', 'Details (optional)'), placeholder: l('Ex.: para o bairro de Malhampsene, Matola', 'E.g. to Malhampsene, Matola') },
    { name: 'vagaConfirmada', type: 'toggle', section: 'transferencia', label: l('Junto a declaração de vaga da escola de destino', 'Attaching the place confirmation from the new school') },
    { name: 'propinasAte', type: 'month', section: 'transferencia', width: 'half', label: l('Propinas pagas até (escola privada)', 'Fees paid up to (private school)'), showIf: (v) => v.escolaPublica === false },
    { name: 'dataPretendida', type: 'date', section: 'transferencia', width: 'half', label: l('A partir de (opcional)', 'From (optional)') },
  ],
  warnings: (v) => {
    const w: Warning[] = [];
    if (!v.vagaConfirmada)
      w.push({ level: 'info', field: 'vagaConfirmada', message: l('Confirme primeiro a vaga na escola de destino: muitas escolas pedem a declaração de vaga para emitir a guia de transferência.', 'Confirm the place at the new school first; many schools ask for it before issuing the transfer form.') });
    w.push({
      level: 'info',
      message: l(
        'A guia de transferência é emitida pela escola no modelo oficial. Sem transferência autorizada por despacho, o aluno pode ser considerado desistente.',
        'The school issues the official transfer form. Without an authorised transfer the pupil may be registered as having dropped out.',
      ),
    });
    return w;
  },
  personName: (v) => str(v.alunoNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
  blocks: (ctx) => {
    const v = ctx.values;
    const fe = isF(v.encarregadoGenero);
    const fa = isF(v.alunoGenero);
    const fd = isF(v.directorGenero);
    const motivo = [MOTIVOS[str(v.motivo)] ?? '', semPonto(v.motivoTexto)].filter(Boolean).join(', ') || BLANK;
    const ident = [
      `**${str(v.encarregadoNome) || BLANK}**`,
      str(v.encarregadoDocNumero) ? `${fe ? 'portadora' : 'portador'} do ${str(v.encarregadoDocTipo) || 'BI'} n.º ${str(v.encarregadoDocNumero)}` : '',
      str(v.encarregadoMorada) ? `residente em ${semPonto(v.encarregadoMorada)}` : '',
      str(v.encarregadoTelefone) ? `contacto ${str(v.encarregadoTelefone)}` : '',
    ].filter(Boolean).join(', ');
    const turma = [semPonto(v.classe) || BLANK, str(v.turma) ? `turma ${str(v.turma)}` : ''].filter(Boolean).join(', ');
    const blocks: Block[] = [
      { type: 'recipient', salutation: exmo(v.directorGenero), lines: [`${fd ? 'Directora' : 'Director'} da ${semPonto(v.escolaActual) || BLANK}`] },
      { type: 'subject', text: 'Pedido de transferência' },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${ident}, Encarregad${fe ? 'a' : 'o'} de Educação ${fa ? 'da aluna' : 'do aluno'} **${str(v.alunoNome) || BLANK}**${str(v.alunoNumero) ? `, n.º ${str(v.alunoNumero)}` : ''}, que frequenta nesta Escola a ${turma}, no ano lectivo de ${str(v.anoLectivo) || BLANK}, vem requerer a V. Ex.ª se digne autorizar a transferência ${fa ? 'da sua educanda' : 'do seu educando'} para a **${semPonto(v.escolaDestino) || BLANK}**${str(v.localidadeDestino) ? `, em ${semPonto(v.localidadeDestino)}` : ''}${v.dataPretendida ? `, a partir de ${dateLong(v.dataPretendida)}` : ''}, e mandar emitir a respectiva guia de transferência e demais documentação escolar.`,
        en: 'The parent asks the director to authorise the transfer of the pupil to the stated school and to issue the transfer form and school records.',
      },
      { type: 'paragraph', id: 'motivo', text: `O pedido fundamenta-se em ${motivo}.`, en: 'Reason for the request.' },
    ];
    if (v.vagaConfirmada) blocks.push({ type: 'paragraph', id: 'vaga', text: 'Junta-se a declaração de existência de vaga emitida pela escola de destino.', en: 'Place confirmation from the new school attached.' });
    if (v.escolaPublica === false && str(v.propinasAte))
      blocks.push({ type: 'paragraph', id: 'propinas', text: `Declaro que as propinas se encontram pagas até ao mês de ${mesAno(v.propinasAte)}.`, en: 'Fees are paid up to the stated month.' });
    blocks.push(
      { type: 'paragraph', id: 'deferimento', text: 'Pede deferimento.', en: 'Respectfully requested.', keepWithNext: true },
      { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [{ role: fe ? 'A Requerente' : 'O Requerente', name: str(v.encarregadoNome) || undefined }] },
      { type: 'box', label: 'Despacho', lines: 3, dashed: true },
    );
    return blocks;
  },
});
