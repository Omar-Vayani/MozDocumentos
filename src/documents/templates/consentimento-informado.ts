import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, DOC_TIPO_OPTIONS, g, isF, l, localField, placeDate } from './_shared';
import {
  clinicianFields, clinicianRole, clinicianWarnings, clinicianSignature, mentionsHiv, patientAge, patientFields, patientIdent, practitionerHeader,
} from './_saude';

const ANESTESIA_OPTIONS = [
  { value: 'nenhuma', label: l('Sem anestesia', 'No anaesthesia') },
  { value: 'local', label: l('Anestesia local', 'Local anaesthesia') },
  { value: 'regional', label: l('Anestesia regional (raquidiana, epidural, bloqueio)', 'Regional anaesthesia') },
  { value: 'sedacao', label: l('Sedação', 'Sedation') },
  { value: 'geral', label: l('Anestesia geral', 'General anaesthesia') },
];
const ANESTESIA_TXT: Record<string, string> = {
  nenhuma: 'o procedimento não requer anestesia',
  local: 'está prevista anestesia local',
  regional: 'está prevista anestesia regional',
  sedacao: 'está prevista sedação',
  geral: 'está prevista anestesia geral',
};

const QUALIDADE_OPTIONS = [
  { value: 'pai', label: l('Pai', 'Father') },
  { value: 'mãe', label: l('Mãe', 'Mother') },
  { value: 'tutor', label: l('Tutor(a) ou representante legal', 'Guardian or legal representative') },
];

function maioridade(v: Values, anos: number): boolean {
  const age = patientAge(v);
  return age != null && age < anos;
}

export default defineTemplate({
  id: 'consentimento-informado',
  family: 'declaracao',
  sections: [
    { id: 'procedimento', title: l('Procedimento', 'Procedure') },
    { id: 'doente', title: l('Doente', 'Patient'), personRole: 'outro' },
    { id: 'representante', title: l('Representante legal (menor ou incapaz)', 'Legal representative (minor or incapable)') },
    { id: 'informacao', title: l('Informação prestada', 'Information given') },
    { id: 'autorizacoes', title: l('Autorizações e assinaturas', 'Authorisations and signatures') },
    { id: 'clinico', title: l('Médico responsável', 'Responsible doctor') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'procedimento', type: 'text', section: 'procedimento', required: true, label: l('Procedimento', 'Procedure'), placeholder: l('Ex.: colecistectomia laparoscópica', 'E.g. laparoscopic cholecystectomy') },
    { name: 'dataProcedimento', type: 'date', section: 'procedimento', width: 'half', label: l('Data prevista (opcional)', 'Planned date (optional)') },
    { name: 'anestesia', type: 'select', section: 'procedimento', width: 'half', label: l('Anestesia', 'Anaesthesia'), options: ANESTESIA_OPTIONS, default: 'local' },
    ...patientFields(['nome', 'genero', 'dataNascimento', 'idade', 'docTipo', 'docNumero', 'processo'], 'doente'),
    {
      name: 'temRepresentante',
      type: 'toggle',
      section: 'representante',
      label: l('Assina um representante legal', 'A legal representative signs'),
      help: l('Obrigatório quando o doente é menor ou não pode decidir.', 'Required when the patient is a minor or cannot decide.'),
    },
    { name: 'repNome', type: 'text', section: 'representante', width: 'half', label: l('Nome do representante', 'Representative’s name'), showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'repGenero', type: 'radio', section: 'representante', label: l('Tratamento', 'Form of address'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }], default: 'F', showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'repQualidade', type: 'select', section: 'representante', width: 'half', label: l('Qualidade', 'Capacity'), options: QUALIDADE_OPTIONS, default: 'mãe', showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'repDocTipo', type: 'select', section: 'representante', width: 'half', label: l('Documento', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'repDocNumero', type: 'text', section: 'representante', width: 'half', label: l('Número do documento', 'Document number'), showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'diagnostico', type: 'textarea', section: 'informacao', rows: 2, label: l('Diagnóstico e natureza do procedimento', 'Diagnosis and nature of the procedure'), required: true },
    { name: 'beneficios', type: 'textarea', section: 'informacao', rows: 2, label: l('Benefícios esperados', 'Expected benefits'), required: true },
    { name: 'riscos', type: 'textarea', section: 'informacao', rows: 3, label: l('Riscos e complicações (frequentes e graves)', 'Risks and complications (common and serious)'), required: true },
    { name: 'alternativas', type: 'textarea', section: 'informacao', rows: 2, label: l('Alternativas e consequências de não fazer', 'Alternatives and consequences of not doing it'), required: true },
    { name: 'interprete', type: 'toggle', section: 'informacao', label: l('Informação prestada com intérprete', 'Information given through an interpreter') },
    { name: 'interpreteLingua', type: 'text', section: 'informacao', width: 'half', label: l('Língua', 'Language'), placeholder: l('Ex.: Changana', 'E.g. Changana'), showIf: (v) => Boolean(v.interprete) },
    { name: 'transfusao', type: 'toggle', section: 'autorizacoes', label: l('Autoriza transfusão de sangue, se necessária', 'Authorises blood transfusion if needed'), default: true },
    { name: 'imagens', type: 'toggle', section: 'autorizacoes', label: l('Autoriza o registo de imagens para o processo clínico', 'Authorises images for the clinical record') },
    {
      name: 'naoAssina',
      type: 'toggle',
      section: 'autorizacoes',
      label: l('O doente não sabe ou não pode assinar (assina uma testemunha a rogo)', 'The patient cannot sign (a witness signs on their behalf)'),
    },
    { name: 'testemunhaNome', type: 'text', section: 'autorizacoes', width: 'half', label: l('Nome da testemunha', 'Witness name'), showIf: (v) => Boolean(v.naoAssina) },
    ...clinicianFields('clinico'),
    localField(),
    dateField(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...clinicianWarnings(v)];
    const anos = ctx.legal.value<{ anos: number }>('maioridade').anos;
    if (maioridade(v, anos) && !v.temRepresentante) {
      w.push({
        level: 'error',
        field: 'temRepresentante',
        message: l(`O doente é menor (${cite('maioridade')}): o consentimento é dado pelos pais ou pelo representante legal.`, `The patient is a minor (${cite('maioridade')}): consent is given by the parents or legal representative.`),
      });
    }
    for (const k of ['riscos', 'alternativas', 'beneficios', 'diagnostico']) {
      if (!String(v[k] ?? '').trim()) {
        w.push({
          level: 'error',
          field: k,
          message: l('O consentimento só é válido se o doente for informado do procedimento, benefícios, riscos e alternativas.', 'Consent is valid only if the patient is told of the procedure, benefits, risks and alternatives.'),
        });
        break;
      }
    }
    if (mentionsHiv(v.procedimento, v.diagnostico)) {
      w.push({
        level: 'error',
        field: 'procedimento',
        message: l(`O teste de HIV segue aconselhamento e formulários próprios do Ministério da Saúde (${cite('hivConfidencialidade')}). Não use este modelo.`, `HIV testing follows the Ministry of Health counselling and forms (${cite('hivConfidencialidade')}). Do not use this model.`),
      });
    }
    if (v.naoAssina && !v.testemunhaNome) w.push({ level: 'warning', field: 'testemunhaNome', message: l('Indique a testemunha que assina a rogo.', 'Enter the witness signing on the patient’s behalf.') });
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const rep = Boolean(v.temRepresentante);
    const fr = isF(v.repGenero);
    const pat = patientIdent(v);
    const proc = String(v.procedimento || '____________________');
    const clin = `${String(v.clinicoTitulo ?? '').trim() ? `${v.clinicoTitulo} ` : ''}${v.clinicoNome || '____________________'}`;
    const ordemNum = v.clinicoNumero ? ` (carteira profissional n.º ${v.clinicoNumero})` : '';
    const strip = (s: unknown) => String(s ?? '').trim().replace(/[.;]+$/, '') || '____________________';
    const eu = rep
      ? `Eu, **${v.repNome || '____________________'}**, ${fr ? 'portadora' : 'portador'} do ${v.repDocTipo || 'BI'} n.º ${v.repDocNumero || '__________'}, na qualidade de ${v.repQualidade === 'tutor' ? (fr ? 'tutora' : 'tutor') : v.repQualidade || 'representante'} e representante legal de ${pat.pt}`
      : `Eu, ${pat.pt}`;
    const blocks: Block[] = [
      ...practitionerHeader(ctx),
      { type: 'title', text: 'Declaração de Consentimento Informado', subtitle: proc },
      {
        type: 'paragraph',
        id: 'identificacao',
        text: `${eu}${v.doenteProcesso ? ` (processo clínico n.º ${v.doenteProcesso})` : ''}, declaro que ${clinicianRole(v).toLowerCase()} **${clin}**${ordemNum} me explicou, em linguagem que compreendi${v.interprete ? `, com a ajuda de intérprete em ${v.interpreteLingua || '__________'}` : ''}:`,
        en: `I, ${rep ? `${v.repNome || '___'}, legal representative of ` : ''}${v.doenteNome || '___'}, declare that Dr ${v.clinicoNome || '___'} explained to me in language I understood:`,
      },
      {
        type: 'list',
        style: 'alpha',
        items: [
          `o diagnóstico e a natureza do procedimento: ${strip(v.diagnostico)};`,
          `os benefícios esperados: ${strip(v.beneficios)};`,
          `os riscos e as complicações frequentes e graves: ${strip(v.riscos)};`,
          `as alternativas existentes e as consequências de não realizar o procedimento: ${strip(v.alternativas)};`,
          `que ${ANESTESIA_TXT[String(v.anestesia ?? 'local')] ?? ANESTESIA_TXT.local}${v.dataProcedimento ? ` e que o procedimento está previsto para ${dateLong(v.dataProcedimento)}` : ''}.`,
        ],
      },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: 'Tive oportunidade de fazer perguntas, que foram respondidas. Compreendi que posso retirar este consentimento a qualquer momento antes do procedimento, sem prejuízo dos cuidados de que necessite.',
        en: 'I was able to ask questions, which were answered. I understand I may withdraw this consent at any time before the procedure without losing the care I need.',
      },
      {
        type: 'paragraph',
        id: 'autorizo',
        text: `Assim, **autorizo** a realização ${rep ? `${g(v.doenteGenero, 'no menor', 'na menor')}` : 'em mim'} do procedimento acima indicado e dos actos complementares que, durante a sua execução, se mostrem clinicamente necessários e urgentes para a vida ou a saúde${rep ? ` ${g(v.doenteGenero, 'do doente', 'da doente')}` : ''}.`,
        en: 'I therefore authorise the procedure and any additional acts that prove clinically necessary and urgent during it.',
      },
    ];
    const extra: string[] = [];
    extra.push(v.transfusao ? 'Autorizo a transfusão de sangue ou derivados, se necessária.' : 'Não autorizo a transfusão de sangue ou derivados.');
    if (v.imagens) extra.push('Autorizo o registo de imagens do procedimento, exclusivamente para o processo clínico.');
    blocks.push({ type: 'paragraph', id: 'autorizacoes', text: extra.join(' '), en: v.transfusao ? 'I authorise blood transfusion if needed.' : 'I do not authorise blood transfusion.', keepWithNext: true });
    const signer: SignatureColumn = rep
      ? { role: fr ? 'A Representante Legal' : 'O Representante Legal', name: v.repNome || undefined }
      : { role: isF(v.doenteGenero) ? 'A Doente' : 'O Doente', name: v.doenteNome || undefined, detail: v.naoAssina ? 'Impressão digital' : undefined };
    const cols: SignatureColumn[] = [signer, clinicianSignature(ctx)];
    if (v.naoAssina && !rep) cols.push({ role: 'A Testemunha (a rogo)', name: v.testemunhaNome || undefined });
    blocks.push(
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: cols },
      { type: 'note', text: 'Feito em dois exemplares: um para o processo clínico e outro para o doente.', en: 'Made in two copies: one for the clinical record, one for the patient.' },
    );
    return blocks;
  },
});
