import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { cite, dateField, DOC_TIPO_OPTIONS, g, isF, l, localField, placeDate } from './_shared';
import {
  clinicianFields, clinicianRole, clinicianSignature, clinicianWarnings, horaText, patientAge, patientFields, patientIdent,
} from './_saude';

const RECUSA_OPTIONS = [
  { value: 'tratamento', label: l('O tratamento proposto', 'The proposed treatment'), pt: 'o tratamento proposto' },
  { value: 'internamento', label: l('O internamento (alta a pedido)', 'Admission (discharge on request)'), pt: 'a continuação do internamento, e solicito alta a pedido' },
  { value: 'transferencia', label: l('A transferência para outra unidade', 'Transfer to another facility'), pt: 'a transferência para outra unidade sanitária' },
  { value: 'exame', label: l('Um exame ou procedimento', 'A test or procedure'), pt: 'a realização do exame ou procedimento proposto' },
];

export default defineTemplate({
  id: 'termo-recusa-tratamento',
  family: 'declaracao',
  sections: [
    { id: 'doente', title: l('Doente', 'Patient'), personRole: 'outro' },
    { id: 'representante', title: l('Representante legal (se for o caso)', 'Legal representative (if any)') },
    { id: 'recusa', title: l('O que é recusado', 'What is refused') },
    { id: 'clinico', title: l('Médico que informou', 'Informing doctor') },
    { id: 'documento', title: l('Local, data e testemunha', 'Place, date and witness') },
  ],
  fields: [
    ...patientFields(['nome', 'genero', 'dataNascimento', 'idade', 'docTipo', 'docNumero', 'processo'], 'doente'),
    { name: 'temRepresentante', type: 'toggle', section: 'representante', label: l('Quem recusa é o representante legal', 'The legal representative refuses') },
    { name: 'repNome', type: 'text', section: 'representante', width: 'half', label: l('Nome do representante', 'Representative’s name'), showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'repGenero', type: 'radio', section: 'representante', label: l('Tratamento', 'Form of address'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }], default: 'F', showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'repDocTipo', type: 'select', section: 'representante', width: 'half', label: l('Documento', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'repDocNumero', type: 'text', section: 'representante', width: 'half', label: l('Número do documento', 'Document number'), showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'recusa', type: 'select', section: 'recusa', width: 'half', label: l('Recusa', 'Refuses'), options: RECUSA_OPTIONS.map(({ value, label }) => ({ value, label })), default: 'tratamento' },
    { name: 'proposto', type: 'text', section: 'recusa', required: true, label: l('Tratamento ou acto recomendado', 'Recommended treatment or act'), placeholder: l('Ex.: internamento para antibioterapia endovenosa', 'E.g. admission for IV antibiotics') },
    { name: 'riscos', type: 'textarea', section: 'recusa', rows: 3, required: true, label: l('Riscos da recusa explicados', 'Risks of refusal explained') },
    { name: 'hora', type: 'text', section: 'documento', width: 'half', required: true, label: l('Hora', 'Time'), placeholder: l('14:30', '14:30') },
    { name: 'testemunhaNome', type: 'text', section: 'documento', width: 'half', label: l('Testemunha (recomendado)', 'Witness (recommended)') },
    ...clinicianFields('clinico'),
    localField(),
    dateField(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...clinicianWarnings(v)];
    if (!String(v.riscos ?? '').trim()) w.push({ level: 'error', field: 'riscos', message: l('Registe os riscos explicados: protege o doente e a unidade sanitária.', 'Record the risks explained: it protects patient and facility.') });
    const anos = ctx.legal.value<{ anos: number }>('maioridade').anos;
    const age = patientAge(v);
    if (age != null && age < anos) {
      w.push({
        level: 'warning',
        field: 'temRepresentante',
        message: l(
          `Doente menor (${cite('maioridade')}): a recusa é dos pais ou do representante legal. Se a recusa puser em risco a vida da criança, informe o Ministério Público.`,
          `Minor patient (${cite('maioridade')}): the parents or legal representative decide. If refusal endangers the child’s life, inform the Public Prosecutor.`,
        ),
      });
    }
    if (!v.testemunhaNome) w.push({ level: 'info', field: 'testemunhaNome', message: l('Uma testemunha reforça o valor do termo.', 'A witness strengthens the form.') });
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const rep = Boolean(v.temRepresentante);
    const fr = isF(v.repGenero);
    const pat = patientIdent(v);
    const r = RECUSA_OPTIONS.find((x) => x.value === v.recusa) ?? RECUSA_OPTIONS[0];
    const clin = `${String(v.clinicoTitulo ?? '').trim() ? `${v.clinicoTitulo} ` : ''}${v.clinicoNome || '____________________'}`;
    const eu = rep
      ? `Eu, **${v.repNome || '____________________'}**, ${fr ? 'portadora' : 'portador'} do ${v.repDocTipo || 'BI'} n.º ${v.repDocNumero || '__________'}, na qualidade de representante legal de ${pat.pt}`
      : `Eu, ${pat.pt}`;
    const riscos = String(v.riscos ?? '').trim().replace(/[.;]+$/, '') || '____________________';
    const blocks: Block[] = [
      { type: 'title', text: 'Termo de Recusa de Tratamento' },
      {
        type: 'paragraph',
        id: 'informacao',
        text: `${eu}${v.doenteProcesso ? ` (processo clínico n.º ${v.doenteProcesso})` : ''}, declaro que ${clinicianRole(v).toLowerCase()} **${clin}** me informou, em linguagem que compreendi, de que é clinicamente recomendado **${v.proposto || '____________________'}** e me explicou os riscos da sua não realização, designadamente: ${riscos}.`,
        en: `I declare that ${v.clinicoNome || 'the doctor'} told me in language I understood that ${v.proposto || '___'} is recommended, and of the risks of refusing: ${riscos}.`,
      },
      {
        type: 'paragraph',
        id: 'recusa',
        text: `Apesar dessa informação, **recuso ${r.pt}**, assumindo a responsabilidade pelas consequências desta decisão. Fui ${rep ? (fr ? 'informada' : 'informado') : g(v.doenteGenero, 'informado', 'informada')} de que ${rep ? `${g(v.doenteGenero, 'o doente', 'a doente')} pode` : 'posso'} regressar a esta unidade sanitária a qualquer momento e de que a recusa não prejudica os outros cuidados de que necessite.`,
        en: 'Despite this information I refuse, accepting responsibility for the consequences. I was told I may return at any time and that other care is not affected.',
      },
      { type: 'paragraph', id: 'hora', text: `${placeDate(ctx, v.data)}, às ${horaText(v.hora)}.`, en: 'Place, date and time.', keepWithNext: true },
    ];
    const signer: SignatureColumn = rep
      ? { role: fr ? 'A Representante Legal' : 'O Representante Legal', name: v.repNome || undefined }
      : { role: isF(v.doenteGenero) ? 'A Doente' : 'O Doente', name: v.doenteNome || undefined, detail: 'Assinatura ou impressão digital' };
    const cols: SignatureColumn[] = [signer, clinicianSignature(ctx)];
    if (v.testemunhaNome) cols.push({ role: 'A Testemunha', name: v.testemunhaNome });
    blocks.push({ type: 'signatures', columns: cols });
    return blocks;
  },
});
