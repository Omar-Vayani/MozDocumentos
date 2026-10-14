// Autorização de acesso e partilha de informação clínica: the patient (or the
// legal representative) authorises the health facility to release named
// clinical information to a named third party, for a stated purpose and
// period. Revocable. HIV status is excluded unless the patient ticks it.

import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { cite, dateField, dateLong, DOC_TIPO_OPTIONS, g, GENERO_OPTIONS, isF, l, localField, placeDate } from './_shared';
import { CONFIDENCIAL, establishmentName, patientAge, patientFields, patientIdent } from './_saude';
import { or, semPonto, str } from './_saude-educacao';

const DESTINO_OPTIONS = [
  { value: 'seguradora', label: l('Seguradora ou plano de saúde', 'Insurer or health plan') },
  { value: 'medico', label: l('Outro médico ou unidade sanitária', 'Another doctor or facility') },
  { value: 'familiar', label: l('Familiar ou pessoa de confiança', 'Relative or trusted person') },
  { value: 'empregador', label: l('Entidade empregadora', 'Employer') },
  { value: 'advogado', label: l('Advogado', 'Lawyer') },
  { value: 'outro', label: l('Outra entidade', 'Other') },
];

const INFO = [
  { name: 'infoRelatorio', pt: 'relatório médico', en: 'medical report', def: true },
  { name: 'infoExames', pt: 'resultados de análises e exames', en: 'test results', def: true },
  { name: 'infoInternamento', pt: 'informação sobre internamento e alta', en: 'admission and discharge information', def: false },
  { name: 'infoProcesso', pt: 'cópia do processo clínico', en: 'copy of the clinical file', def: false },
  { name: 'infoFacturas', pt: 'facturas e documentos de despesa', en: 'invoices and expense documents', def: false },
  { name: 'infoVerbal', pt: 'informação verbal sobre o estado de saúde', en: 'verbal information about the condition', def: false },
];

export default defineTemplate({
  id: 'autorizacao-partilha-informacao-clinica',
  family: 'declaracao',
  sections: [
    { id: 'doente', title: l('Doente', 'Patient'), personRole: 'outro' },
    { id: 'representante', title: l('Representante legal (se for o caso)', 'Legal representative (if any)') },
    { id: 'destino', title: l('A quem se autoriza', 'Who may receive it') },
    { id: 'informacao', title: l('Informação abrangida', 'Information covered') },
    { id: 'documento', title: l('Unidade, validade, local e data', 'Facility, validity, place and date') },
  ],
  fields: [
    ...patientFields(['nome', 'genero', 'dataNascimento', 'idade', 'docTipo', 'docNumero', 'processo', 'telefone'], 'doente'),
    { name: 'temRepresentante', type: 'toggle', section: 'representante', label: l('Assina o representante legal (menor ou incapaz)', 'The legal representative signs (minor or incapable)') },
    { name: 'repNome', type: 'text', section: 'representante', width: 'half', label: l('Nome do representante', 'Representative’s name'), showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'repGenero', type: 'radio', section: 'representante', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'F', showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'repQualidade', type: 'text', section: 'representante', width: 'half', label: l('Qualidade', 'Capacity'), placeholder: l('Ex.: mãe, tutor', 'E.g. mother, guardian'), showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'repDocTipo', type: 'select', section: 'representante', width: 'half', label: l('Documento', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'repDocNumero', type: 'text', section: 'representante', width: 'half', label: l('Número do documento', 'Document number'), showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'destinoTipo', type: 'select', section: 'destino', width: 'half', label: l('Tipo de destinatário', 'Kind of recipient'), options: DESTINO_OPTIONS, default: 'seguradora' },
    { name: 'destinoNome', type: 'text', section: 'destino', required: true, label: l('Nome da pessoa ou entidade', 'Person or entity'), placeholder: l('Ex.: Companhia de Seguros X, S.A.', 'E.g. the insurer’s name') },
    { name: 'destinoDoc', type: 'text', section: 'destino', width: 'half', label: l('BI / NUIT do destinatário (opcional)', 'Recipient’s ID / tax no. (optional)') },
    { name: 'finalidade', type: 'text', section: 'destino', required: true, label: l('Finalidade', 'Purpose'), placeholder: l('Ex.: análise do pedido de reembolso de despesas médicas', 'E.g. assessing a claim for medical expenses') },
    ...INFO.map((i) => ({ name: i.name, type: 'toggle' as const, section: 'informacao', label: l(cap(i.pt), cap(i.en)), default: i.def })),
    { name: 'periodo', type: 'text', section: 'informacao', label: l('Período dos cuidados abrangidos (opcional)', 'Period of care covered (optional)'), placeholder: l('Ex.: internamento de 3 a 9 de Outubro de 2026', 'E.g. admission 3–9 October 2026') },
    {
      name: 'incluiHiv',
      type: 'toggle',
      section: 'informacao',
      label: l('Inclui informação sobre HIV (o doente autoriza expressamente)', 'Includes HIV information (patient expressly agrees)'),
      help: l('Por defeito a autorização exclui o estado serológico de HIV e a saúde sexual e reprodutiva.', 'By default HIV status and sexual and reproductive health are excluded.'),
    },
    { name: 'unidade', type: 'text', section: 'documento', label: l('Unidade sanitária que guarda a informação', 'Facility holding the information'), default: (c) => (c.profile?.kind === 'empresa' ? c.profile.nomeComercial || c.profile.firma || '' : '') },
    {
      name: 'validade',
      type: 'radio',
      section: 'documento',
      label: l('Validade', 'Validity'),
      options: [
        { value: 'unica', label: l('Uma só vez', 'Once') },
        { value: 'data', label: l('Até uma data', 'Until a date') },
      ],
      default: 'data',
    },
    { name: 'validadeData', type: 'date', section: 'documento', width: 'half', label: l('Válida até', 'Valid until'), showIf: (v) => v.validade === 'data' },
    localField(),
    dateField(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!str(v.destinoNome)) w.push({ level: 'error', field: 'destinoNome', message: l('Indique a quem a informação pode ser entregue.', 'Enter who may receive the information.') });
    if (!INFO.some((i) => v[i.name])) w.push({ level: 'error', field: 'infoRelatorio', message: l('Escolha a informação abrangida.', 'Choose the information covered.') });
    const maior = ctx.legal.value<{ anos: number }>('maioridade').anos;
    const age = patientAge(v);
    if (age != null && age < maior && !v.temRepresentante) {
      w.push({ level: 'warning', field: 'temRepresentante', message: l(`Doente menor (${cite('maioridade')}): assina o pai, a mãe ou o representante legal.`, 'Minor patient: a parent or legal representative signs.') });
    }
    if (v.destinoTipo === 'empregador') {
      w.push({
        level: 'warning',
        field: 'destinoTipo',
        message: l(
          `O empregador só pode pedir a aptidão ou inaptidão para o trabalho (${cite('examesMedicosTrabalho')}). Limite a informação ao estritamente necessário.`,
          'The employer may ask only about fitness for work. Limit the information to what is strictly needed.',
        ),
      });
    }
    if (v.incluiHiv) w.push({ level: 'warning', field: 'incluiHiv', message: l(`Confirme que o doente compreendeu e quer partilhar o estado de HIV (${cite('hivConfidencialidade')}).`, 'Confirm the patient understands and wants to share their HIV status.') });
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const rep = Boolean(v.temRepresentante);
    const fr = isF(v.repGenero);
    const pat = patientIdent(v);
    const unidade = str(v.unidade) || establishmentName(ctx) || 'esta unidade sanitária';
    const eu = rep
      ? `Eu, **${or(v.repNome)}**, ${fr ? 'portadora' : 'portador'} do ${str(v.repDocTipo) || 'BI'} n.º ${or(v.repDocNumero, '__________')}, na qualidade de ${str(v.repQualidade) || 'representante legal'} de ${pat.pt}`
      : `Eu, ${pat.pt}`;
    const proc = str(v.doenteProcesso) ? ` (processo clínico n.º ${str(v.doenteProcesso)})` : '';
    const destino = `**${or(v.destinoNome)}**${str(v.destinoDoc) ? ` (${str(v.destinoDoc)})` : ''}`;
    const blocks: Block[] = [
      CONFIDENCIAL,
      { type: 'title', text: 'Autorização de Acesso e Partilha de Informação Clínica' },
      {
        type: 'paragraph',
        id: 'autoriza',
        text: `${eu}${proc}, autorizo a **${unidade}** e os seus profissionais de saúde a facultar a ${destino} a seguinte informação clínica ${rep ? g(v.doenteGenero, 'do meu representado', 'da minha representada') : 'que me diz respeito'}${str(v.periodo) ? `, relativa a ${semPonto(v.periodo)}` : ''}:`,
        en: `I authorise ${unidade} and its health professionals to release the following clinical information to ${v.destinoNome || '___'}.`,
      },
      { type: 'checklist', columns: 2, items: INFO.map((i) => ({ label: cap(i.pt), checked: Boolean(v[i.name]) })) },
      {
        type: 'paragraph',
        id: 'finalidade',
        text: `A informação destina-se exclusivamente a ${semPonto(v.finalidade).replace(/^(a|para)\s+/i, '') || '____________________'} e não pode ser utilizada para outro fim nem transmitida a terceiros.`,
        en: `The information is only for: ${v.finalidade || '___'}; it may not be used otherwise or passed on.`,
      },
      {
        type: 'paragraph',
        id: 'exclusoes',
        text: v.incluiHiv
          ? 'Autorizo expressamente que a informação inclua o estado serológico de HIV e o respectivo tratamento.'
          : 'Esta autorização **não abrange** informação sobre o estado serológico de HIV nem sobre saúde sexual e reprodutiva, que só pode ser revelada com autorização específica.',
        en: v.incluiHiv ? 'I expressly agree that HIV status and treatment may be included.' : 'This authorisation does not cover HIV status or sexual and reproductive health.',
      },
      {
        type: 'paragraph',
        id: 'validade',
        text: `${v.validade === 'unica' ? 'A presente autorização vale para uma só entrega de informação' : `A presente autorização é válida até ${dateLong(v.validadeData)}`} e pode ser revogada por mim, a qualquer momento, por escrito, sem efeito sobre a informação já entregue. Fui ${rep ? (fr ? 'informada' : 'informado') : g(v.doenteGenero, 'informado', 'informada')} de que a recusa ou a revogação não prejudica os cuidados de saúde que me são prestados.`,
        en: 'Valid once or until the date stated; revocable in writing at any time; refusal does not affect care.',
        keepWithNext: true,
      },
    ];
    const signer: SignatureColumn = rep
      ? { role: fr ? 'A Representante Legal' : 'O Representante Legal', name: str(v.repNome) || undefined }
      : { role: isF(v.doenteGenero) ? 'A Doente' : 'O Doente', name: str(v.doenteNome) || undefined, detail: 'Assinatura ou impressão digital' };
    blocks.push(
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [signer] },
      { type: 'box', label: 'Para uso dos serviços', text: 'Identidade verificada por: ______________________   Documento: ______________\nInformação entregue em ____/____/______ a: ______________________   Rubrica: ________', lines: 0 },
    );
    return blocks;
  },
});

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
