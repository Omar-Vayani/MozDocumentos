// Ficha de inscrição / boletim de matrícula of a private school, nursery,
// training centre, tutoring centre or driving school. It prints filled in or
// blank, to be completed by hand at the secretariat. Health data of minors is
// sensitive: the form collects only what is needed and says it is confidential.
// Public schools use the Ministry's own enrolment form.

import { formatDateShort } from '@/lib/format';
import { isPublicBody } from '@/lib/storage/types';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { dateLong, l } from './_shared';
import { alunoFields, encarregadoFields, NIVEL_OPTIONS, rows, str } from './_educacao';

const B = '______________________';

/** Key/value pairs in chunks of two rows, so a long section can break across pages. */
function kv(items: { label: string; value: string }[]): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < items.length; i += 4) out.push({ type: 'keyValue', columns: 2, items: items.slice(i, i + 4) });
  return out;
}
const val = (v: Values, k: string, blank = B) => (v.emBranco ? blank : str(v[k]) || blank);
const pequenos = (v: Values) => ['pre-escolar', 'primario'].includes(str(v.nivel));

export default defineTemplate({
  id: 'ficha-de-inscricao',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Inscrição', 'Registration') },
    { id: 'aluno', title: l('Dados do aluno', 'Pupil'), personRole: 'outro' },
    { id: 'pais', title: l('Filiação', 'Parents') },
    { id: 'encarregado', title: l('Encarregado de educação', 'Parent / guardian'), personRole: 'cliente' },
    { id: 'saude', title: l('Saúde e emergência', 'Health and emergency') },
    { id: 'autorizados', title: l('Pessoas autorizadas a buscar o aluno', 'People allowed to collect the pupil') },
    { id: 'documentos', title: l('Documentos e autorizações', 'Documents and consents') },
  ],
  fields: [
    {
      name: 'emBranco',
      type: 'toggle',
      section: 'documento',
      label: l('Imprimir em branco (para preencher à mão)', 'Print blank (to fill by hand)'),
      help: l('Gera a ficha com linhas em branco para a secretaria entregar aos encarregados.', 'Produces the form with blank lines for parents to fill.'),
    },
    { name: 'anoLectivo', type: 'text', section: 'documento', width: 'half', label: l('Ano lectivo', 'School year'), default: (c) => String(Number((c.today || '2026').slice(0, 4)) + 1) },
    { name: 'nivel', type: 'select', section: 'documento', width: 'half', label: l('Nível / tipo de ensino', 'Level'), options: NIVEL_OPTIONS, default: 'primario' },
    { name: 'inscricaoNumero', type: 'text', section: 'documento', width: 'half', label: l('N.º de inscrição', 'Registration no.'), default: (c) => c.nextRef },
    { name: 'inscricaoData', type: 'date', section: 'documento', width: 'half', label: l('Data', 'Date'), default: (c) => c.today },
    { name: 'classe', type: 'text', section: 'documento', width: 'half', label: l('Classe / curso pretendido', 'Grade / course applied for') },
    { name: 'turno', type: 'text', section: 'documento', width: 'half', label: l('Turno pretendido', 'Preferred shift') },
    ...alunoFields(['nome', 'genero', 'nascimento', 'naturalidade', 'docTipo', 'docNumero']).map((f) => ({ ...f, required: false })),
    { name: 'alunoNacionalidade', type: 'text', section: 'aluno', width: 'half', label: l('Nacionalidade', 'Nationality'), default: 'moçambicana' },
    { name: 'alunoMorada', type: 'text', section: 'aluno', label: l('Morada (bairro, quarteirão, casa n.º)', 'Address') },
    { name: 'escolaAnterior', type: 'text', section: 'aluno', width: 'half', label: l('Escola anterior', 'Previous school') },
    { name: 'classeConcluida', type: 'text', section: 'aluno', width: 'half', label: l('Última classe concluída', 'Last grade completed') },
    { name: 'linguaMaterna', type: 'text', section: 'aluno', width: 'half', label: l('Língua materna (opcional)', 'Mother tongue (optional)') },
    { name: 'nee', type: 'text', section: 'aluno', width: 'half', label: l('Necessidades educativas especiais', 'Special educational needs'), placeholder: l('Ex.: Não · Baixa visão', 'E.g. No · Low vision') },
    { name: 'paiNome', type: 'text', section: 'pais', width: 'half', label: l('Nome do pai', "Father's name") },
    { name: 'paiProfissao', type: 'text', section: 'pais', width: 'half', label: l('Profissão do pai', "Father's occupation") },
    { name: 'paiTelefone', type: 'tel', section: 'pais', width: 'half', label: l('Telefone do pai', "Father's phone") },
    { name: 'maeNome', type: 'text', section: 'pais', width: 'half', label: l('Nome da mãe', "Mother's name") },
    { name: 'maeProfissao', type: 'text', section: 'pais', width: 'half', label: l('Profissão da mãe', "Mother's occupation") },
    { name: 'maeTelefone', type: 'tel', section: 'pais', width: 'half', label: l('Telefone da mãe', "Mother's phone") },
    ...encarregadoFields(['nome', 'genero', 'parentesco', 'docTipo', 'docNumero', 'telefone', 'email']).map((f) => ({ ...f, required: false, default: f.name === 'encarregadoDocTipo' ? 'BI' : f.name === 'encarregadoParentesco' ? 'pai' : f.name === 'encarregadoGenero' ? 'M' : '' })),
    { name: 'encarregadoTrabalho', type: 'text', section: 'encarregado', width: 'half', label: l('Local de trabalho', 'Workplace') },
    { name: 'alergias', type: 'text', section: 'saude', label: l('Alergias', 'Allergies') },
    { name: 'doencas', type: 'text', section: 'saude', label: l('Doenças crónicas (asma, epilepsia, diabetes…)', 'Chronic conditions') },
    { name: 'medicacao', type: 'text', section: 'saude', width: 'half', label: l('Medicação habitual', 'Regular medication') },
    { name: 'grupoSanguineo', type: 'text', section: 'saude', width: 'half', label: l('Grupo sanguíneo (opcional)', 'Blood group (optional)') },
    { name: 'emergencia1', type: 'text', section: 'saude', width: 'half', label: l('Contacto de emergência 1 (nome e telefone)', 'Emergency contact 1') },
    { name: 'emergencia2', type: 'text', section: 'saude', width: 'half', label: l('Contacto de emergência 2 (nome e telefone)', 'Emergency contact 2') },
    { name: 'unidadeSanitaria', type: 'text', section: 'saude', label: l('Unidade sanitária de preferência', 'Preferred health facility') },
    {
      name: 'autorizados',
      type: 'lines',
      section: 'autorizados',
      label: l('Pessoas autorizadas', 'Authorised people'),
      help: l('Para o pré-escolar e o ensino primário.', 'For pre-school and primary.'),
      addLabel: l('Adicionar pessoa', 'Add person'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'parentesco', type: 'text', label: l('Parentesco', 'Relationship') },
        { name: 'documento', type: 'text', label: l('Documento', 'ID') },
        { name: 'telefone', type: 'tel', label: l('Telefone', 'Phone') },
      ],
      default: [],
    },
    { name: 'docIdentificacao', type: 'toggle', section: 'documentos', label: l('Cópia do BI / cédula / certidão de nascimento', 'Copy of ID / birth certificate') },
    { name: 'docCertificado', type: 'toggle', section: 'documentos', label: l('Certificado ou declaração da classe anterior', 'Certificate of previous grade') },
    { name: 'docTransferencia', type: 'toggle', section: 'documentos', label: l('Guia de transferência (se vem de outra escola)', 'Transfer form') },
    { name: 'docFotos', type: 'toggle', section: 'documentos', label: l('Fotografias tipo passe', 'Passport photos') },
    { name: 'docVacinas', type: 'toggle', section: 'documentos', label: l('Cartão de vacinas (pré-escolar)', 'Vaccination card (pre-school)') },
    { name: 'docEncarregado', type: 'toggle', section: 'documentos', label: l('Cópia do documento do encarregado', "Copy of guardian's ID") },
    { name: 'docPagamento', type: 'toggle', section: 'documentos', label: l('Comprovativo de pagamento da matrícula', 'Proof of enrolment payment') },
    {
      name: 'imagem',
      type: 'select',
      section: 'documentos',
      label: l('Uso da imagem do aluno', 'Use of the pupil’s image'),
      options: [
        { value: '', label: l('— a assinalar à mão —', '— tick by hand —') },
        { value: 'nao', label: l('Não autorizo', 'Not authorised') },
        { value: 'interno', label: l('Só para fins internos e pedagógicos', 'Internal use only') },
        { value: 'publico', label: l('Também nas publicações e redes sociais', 'Also publications and social media') },
      ],
      default: '',
    },
    { name: 'saidas', type: 'toggle', section: 'documentos', label: l('Autoriza saídas curtas acompanhadas por professores', 'Allows short supervised outings') },
    { name: 'socorros', type: 'toggle', section: 'documentos', label: l('Autoriza primeiros socorros e encaminhamento a unidade sanitária', 'Allows first aid and referral to a health unit') },
  ],
  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (isPublicBody(ctx.profile))
      w.push({ level: 'info', message: l('Escolas públicas: use a ficha de matrícula do modelo do Ministério da Educação. Esta ficha serve de apoio interno.', 'Public schools: use the Ministry enrolment form; this one is for internal use.') });
    if (str(v.alergias) || str(v.doencas) || str(v.medicacao))
      w.push({ level: 'info', message: l('Os dados de saúde são confidenciais: guarde a ficha no processo individual do aluno, em local de acesso restrito, e não a partilhe.', 'Health data are confidential: keep the form in the pupil’s file with restricted access.') });
    w.push({ level: 'info', message: l('Recolha só os dados necessários. Não publique fotografias de alunos sem autorização escrita do encarregado.', 'Collect only necessary data. Do not publish pupils’ photos without written consent.') });
    return w;
  },
  personName: (v) => str(v.alunoNome) || undefined,
  documentDate: (v) => str(v.inscricaoData) || undefined,
  blocks: (ctx) => {
    const v = ctx.values;
    const sexo = (g: unknown) => (v.emBranco ? '☐ M     ☐ F' : g === 'F' ? 'Feminino' : g === 'M' ? 'Masculino' : '☐ M     ☐ F');
    const data = (k: string) => (v.emBranco || !str(v[k]) ? '___/___/______' : formatDateShort(v[k]));
    const doc = (t: string, n: string) => (v.emBranco ? `${B}` : [str(v[t]), str(v[n])].filter(Boolean).join(' n.º ') || B);
    const blocks: Block[] = [
      { type: 'title', text: 'Ficha de Inscrição', subtitle: `Ano lectivo ${str(v.anoLectivo) || '______'}` },
      {
        type: 'box',
        label: 'Inscrição (a preencher pela Secretaria)',
        text: [`N.º: ${val(v, 'inscricaoNumero', '__________')}`, `Data: ${data('inscricaoData')}`, `Classe / curso: ${val(v, 'classe', '______________')}`, `Turno: ${val(v, 'turno', '______________')}`, 'Turma: ________    Processo n.º: ________'].join('\n'),
        width: 'half',
      },
      { type: 'box', label: 'Fotografia', text: ' ', lines: 3, width: 'half', align: 'right' },
      { type: 'heading', text: '1. Dados do aluno' },
      ...kv([
          { label: 'Nome', value: val(v, 'alunoNome') },
          { label: 'Sexo', value: sexo(v.alunoGenero) },
          { label: 'Nascimento', value: data('alunoNascimento') },
          { label: 'Naturalidade', value: val(v, 'alunoNaturalidade') },
          { label: 'Documento', value: doc('alunoDocTipo', 'alunoDocNumero') },
          { label: 'Nacionalidade', value: val(v, 'alunoNacionalidade') },
          { label: 'Morada', value: val(v, 'alunoMorada') },
          { label: 'Escola anterior', value: val(v, 'escolaAnterior') },
          { label: 'Classe feita', value: val(v, 'classeConcluida') },
          { label: 'Necessid. especiais', value: val(v, 'nee') },
          ...(str(v.linguaMaterna) && !v.emBranco ? [{ label: 'Língua materna', value: str(v.linguaMaterna) }] : []),
      ]),
      { type: 'heading', text: '2. Filiação e encarregado de educação' },
      ...kv([
          { label: 'Pai', value: val(v, 'paiNome') },
          { label: 'Profissão / tel.', value: v.emBranco ? B : [str(v.paiProfissao), str(v.paiTelefone)].filter(Boolean).join(', ') || B },
          { label: 'Mãe', value: val(v, 'maeNome') },
          { label: 'Profissão / tel.', value: v.emBranco ? B : [str(v.maeProfissao), str(v.maeTelefone)].filter(Boolean).join(', ') || B },
          { label: 'Encarregado', value: val(v, 'encarregadoNome') },
          { label: 'Parentesco', value: val(v, 'encarregadoParentesco') },
          { label: 'Documento', value: doc('encarregadoDocTipo', 'encarregadoDocNumero') },
          { label: 'Contactos', value: v.emBranco ? B : [str(v.encarregadoTelefone), str(v.encarregadoEmail)].filter(Boolean).join(', ') || B },
          ...(v.emBranco || str(v.encarregadoTrabalho) ? [{ label: 'Trabalho', value: val(v, 'encarregadoTrabalho') }] : []),
      ]),
      { type: 'heading', text: '3. Saúde e emergência (informação confidencial)' },
      ...kv([
          { label: 'Alergias', value: val(v, 'alergias') },
          { label: 'Doenças', value: val(v, 'doencas') },
          { label: 'Medicação', value: val(v, 'medicacao') },
          ...(v.emBranco || str(v.grupoSanguineo) ? [{ label: 'Grupo sanguíneo', value: val(v, 'grupoSanguineo') }] : []),
          { label: 'Emergência 1', value: val(v, 'emergencia1') },
          { label: 'Emergência 2', value: val(v, 'emergencia2') },
          { label: 'Unidade sanitária', value: val(v, 'unidadeSanitaria') },
      ]),
    ];
    const aut = rows(v.autorizados).filter((r) => str(r.nome));
    let n = 4;
    if (pequenos(v) || aut.length) {
      blocks.push(
        { type: 'heading', text: `${n}. Pessoas autorizadas a buscar o aluno` },
        {
          type: 'table',
          columns: [{ label: 'Nome', width: 38 }, { label: 'Parentesco', width: 18 }, { label: 'Documento', width: 22 }, { label: 'Telefone', width: 22 }],
          rows: (aut.length && !v.emBranco ? aut : [{}, {}]).map((r) => [str(r.nome), str(r.parentesco), str(r.documento), str(r.telefone)]),
        },
      );
      n++;
    }
    const chk = (k: string) => !v.emBranco && Boolean(v[k]);
    const box = (on: boolean) => (on && !v.emBranco ? '☑' : '☐');
    const docs = [
      { label: 'Cópia do BI / cédula / certidão de nascimento', checked: chk('docIdentificacao') },
      { label: 'Certificado ou declaração da classe anterior', checked: chk('docCertificado') },
      { label: 'Guia de transferência', checked: chk('docTransferencia') },
      { label: 'Fotografias tipo passe', checked: chk('docFotos') },
      ...(pequenos(v) ? [{ label: 'Cartão de vacinas', checked: chk('docVacinas') }] : []),
      { label: 'Cópia do documento do encarregado', checked: chk('docEncarregado') },
      { label: 'Comprovativo de pagamento da matrícula', checked: chk('docPagamento') },
    ];
    blocks.push(
      { type: 'heading', text: `${n}. Documentos entregues` },
      { type: 'checklist', columns: 2, items: docs },
      { type: 'heading', text: `${n + 1}. Autorizações do encarregado de educação` },
      {
        type: 'paragraph',
        id: 'imagem',
        text: `Imagem do aluno:   ${box(v.imagem === 'nao')} não autorizo   ${box(v.imagem === 'interno')} só uso interno   ${box(v.imagem === 'publico')} também nas redes sociais da escola`,
        en: 'Use of the pupil’s image: not authorised / internal use only / also publications and social media.',
        editable: false,
      },
      {
        type: 'paragraph',
        id: 'autorizacoes',
        text: `Saídas curtas acompanhadas por professores:   ${box(chk('saidas'))} sim   ${box(!v.emBranco && !v.saidas)} não\nPrimeiros socorros e ida a unidade sanitária em caso de urgência:   ${box(chk('socorros'))} sim   ${box(!v.emBranco && !v.socorros)} não`,
        en: 'Supervised short outings: yes / no. First aid and taking the pupil to a health unit in an emergency: yes / no.',
        editable: false,
      },
      {
        type: 'box',
        label: 'Declaração e assinaturas',
        text: `Declaro que as informações prestadas são verdadeiras e que tomei conhecimento do Regulamento Interno e da tabela de propinas em vigor.\n${ctx.place}, ${v.emBranco || !str(v.inscricaoData) ? '___ de ______________ de ______' : dateLong(v.inscricaoData)}\n\nO(A) Encarregado(a) de Educação${!v.emBranco && str(v.encarregadoNome) ? ` (${str(v.encarregadoNome)})` : ''}: ______________________________\n\nRecebido pela Secretaria: ______________________________`,
      },
    );
    return blocks;
  },
});
