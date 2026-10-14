import { defineTemplate, type Block, type Warning } from '../model';
import { dateField, dateLong, l, localField, refField } from './_shared';
import {
  clinicianFields, clinicianSignature, clinicianWarnings, patientAge, patientFields, sigiloNote,
} from './_saude';

const URGENCIA_OPTIONS = [
  { value: 'normal', label: l('Normal', 'Routine') },
  { value: 'prioritario', label: l('Prioritário', 'Priority') },
  { value: 'urgente', label: l('Urgente', 'Urgent') },
];
const MOTIVO_OPTIONS = [
  { value: 'avaliação', label: l('Avaliação por especialista', 'Specialist assessment') },
  { value: 'tratamento', label: l('Tratamento', 'Treatment') },
  { value: 'internamento', label: l('Internamento', 'Admission') },
  { value: 'exames', label: l('Exames complementares', 'Investigations') },
];
const TRANSPORTE_OPTIONS = [
  { value: 'meios próprios', label: l('Meios próprios', 'Own means') },
  { value: 'ambulância', label: l('Ambulância', 'Ambulance') },
  { value: 'evacuação aérea', label: l('Evacuação aérea', 'Air evacuation') },
];

const SINAIS = [
  ['ta', 'Tensão arterial', 'mmHg'],
  ['fc', 'Freq. cardíaca', 'bpm'],
  ['fr', 'Freq. respiratória', 'cpm'],
  ['temp', 'Temperatura', '°C'],
  ['sat', 'Sat. de oxigénio', '%'],
  ['glasgow', 'Glasgow', ''],
] as const;

export default defineTemplate({
  id: 'guia-referencia-doente',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Referência', 'Referral') },
    { id: 'doente', title: l('Doente', 'Patient'), personRole: 'outro' },
    { id: 'clinica', title: l('Resumo clínico', 'Clinical summary') },
    { id: 'sinais', title: l('Sinais vitais à saída (opcional)', 'Vital signs at departure (optional)') },
    { id: 'clinico', title: l('Médico que refere', 'Referring doctor') },
  ],
  fields: [
    refField(),
    localField(),
    dateField(),
    {
      name: 'destino',
      type: 'textarea',
      section: 'documento',
      rows: 3,
      required: true,
      label: l('Unidade e serviço de destino', 'Receiving facility and department'),
      placeholder: l('Serviço de Cardiologia\nHospital Central de Maputo', 'Serviço de Cardiologia\nHospital Central de Maputo'),
    },
    { name: 'motivoTipo', type: 'select', section: 'documento', width: 'half', label: l('Para', 'For'), options: MOTIVO_OPTIONS, default: 'avaliação' },
    { name: 'especialidadeDestino', type: 'text', section: 'documento', width: 'half', label: l('Especialidade (opcional)', 'Specialty (optional)'), placeholder: l('Ex.: Cardiologia', 'E.g. Cardiology') },
    { name: 'urgencia', type: 'radio', section: 'documento', label: l('Prioridade', 'Priority'), options: URGENCIA_OPTIONS, default: 'normal' },
    { name: 'transporte', type: 'select', section: 'documento', width: 'half', label: l('Transporte', 'Transport'), options: TRANSPORTE_OPTIONS, default: 'meios próprios' },
    { name: 'acompanhado', type: 'toggle', section: 'documento', label: l('Acompanhado por profissional de saúde', 'Escorted by a health professional') },
    ...patientFields(['nome', 'genero', 'dataNascimento', 'idade', 'processo', 'telefone'], 'doente'),
    { name: 'motivo', type: 'textarea', section: 'clinica', rows: 2, required: true, label: l('Motivo da referência', 'Reason for referral') },
    { name: 'resumo', type: 'textarea', section: 'clinica', rows: 5, required: true, label: l('Resumo clínico', 'Clinical summary'), help: l('História, achados relevantes e evolução.', 'History, relevant findings and course.') },
    { name: 'diagnostico', type: 'text', section: 'clinica', required: true, label: l('Diagnóstico ou hipótese diagnóstica', 'Diagnosis or working diagnosis') },
    { name: 'examesFeitos', type: 'textarea', section: 'clinica', rows: 2, label: l('Exames realizados (anexos)', 'Tests done (attached)') },
    { name: 'tratamentoFeito', type: 'textarea', section: 'clinica', rows: 2, label: l('Tratamento efectuado (medicamento, dose, hora da última toma)', 'Treatment given (drug, dose, time of last dose)') },
    { name: 'alergias', type: 'text', section: 'clinica', width: 'half', label: l('Alergias', 'Allergies') },
    { name: 'pedido', type: 'textarea', section: 'clinica', rows: 2, label: l('O que se pede à unidade de destino (opcional)', 'What is asked of the receiving unit (optional)') },
    ...SINAIS.map(([k, label, unit]) => ({ name: `sinal${k.charAt(0).toUpperCase()}${k.slice(1)}`, type: 'text' as const, section: 'sinais', width: 'third' as const, label: l(`${label}${unit ? ` (${unit})` : ''}`, `${label}${unit ? ` (${unit})` : ''}`) })),
    { name: 'contraReferencia', type: 'toggle', section: 'clinico', label: l('Incluir talão de contra-referência', 'Include a reply slip'), default: true },
    ...clinicianFields('clinico'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clinicianWarnings(v)];
    if (v.urgencia === 'urgente' && !SINAIS.some(([k]) => v[`sinal${k.charAt(0).toUpperCase()}${k.slice(1)}`])) {
      w.push({ level: 'warning', field: 'sinalTa', message: l('Numa referência urgente, registe os sinais vitais à saída.', 'For an urgent referral, record the vital signs at departure.') });
    }
    w.push({
      level: 'info',
      message: l(
        'Nas unidades do Serviço Nacional de Saúde a referência faz-se na guia oficial de referência e contra-referência. Este modelo destina-se a clínicas e médicos privados.',
        'Public health units use the official referral form. This model is for private clinics and doctors.',
      ),
    });
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const age = patientAge(v);
    const tags = [...(v.urgencia === 'urgente' ? ['URGENTE'] : v.urgencia === 'prioritario' ? ['PRIORITÁRIO'] : []), 'CONFIDENCIAL'];
    const dest = String(v.destino ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
    const motivo = MOTIVO_OPTIONS.find((m) => m.value === v.motivoTipo)?.value ?? 'avaliação';
    const esp = String(v.especialidadeDestino ?? '').trim();
    const ident = [
      { label: 'Doente', value: v.doenteNome || '____________________' },
      { label: 'Sexo / idade', value: `${v.doenteGenero === 'F' ? 'Feminino' : 'Masculino'}${age != null ? `, ${age} anos` : ''}` },
    ];
    if (v.doenteProcesso) ident.push({ label: 'Processo n.º', value: String(v.doenteProcesso) });
    if (v.doenteTelefone) ident.push({ label: 'Contacto', value: String(v.doenteTelefone) });
    ident.push({ label: 'Transporte', value: `${v.transporte || 'meios próprios'}${v.acompanhado ? ', acompanhado por profissional de saúde' : ''}` });

    const blocks: Block[] = [
      { type: 'tags', items: tags },
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', lines: dest.length ? dest : ['____________________'] },
      { type: 'title', text: 'Guia de Referência de Doente' },
      {
        type: 'paragraph',
        id: 'refere',
        text: `Refere-se a V. Ex.ª ${v.doenteGenero === 'F' ? 'a doente abaixo identificada' : 'o doente abaixo identificado'}, para **${motivo}${esp ? ` em ${esp}` : ''}**, pelos motivos e com os dados clínicos seguintes.`,
        en: `We refer the patient below for ${motivo}${esp ? ` in ${esp}` : ''}, for the reasons and with the clinical data below.`,
      },
      { type: 'keyValue', items: ident, columns: 2 },
    ];
    const sec = (titulo: string, id: string, t: unknown, en: string) => {
      const s = String(t ?? '').trim();
      if (!s) return;
      blocks.push({ type: 'heading', text: titulo }, { type: 'paragraph', id, text: s, en });
    };
    sec('Motivo da referência', 'motivo', v.motivo || '____________________', 'Reason for referral.');
    sec('Resumo clínico', 'resumo', v.resumo || '____________________', 'Clinical summary.');
    const sv = SINAIS.filter(([k]) => v[`sinal${k.charAt(0).toUpperCase()}${k.slice(1)}`]).map(([k, label, unit]) => ({ label, value: `${v[`sinal${k.charAt(0).toUpperCase()}${k.slice(1)}`]}${unit ? ` ${unit}` : ''}` }));
    if (sv.length) blocks.push({ type: 'heading', text: 'Sinais vitais à saída' }, { type: 'keyValue', items: sv, columns: 2 });
    sec('Diagnóstico / hipótese diagnóstica', 'diagnostico', v.diagnostico || '____________________', 'Diagnosis.');
    sec('Exames realizados', 'exames', v.examesFeitos, 'Tests done.');
    sec('Tratamento efectuado', 'tratamento', v.tratamentoFeito, 'Treatment given.');
    if (v.alergias) blocks.push({ type: 'paragraph', id: 'alergias', text: `**Alergias:** ${v.alergias}`, en: `Allergies: ${v.alergias}` });
    sec('Pedido', 'pedido', v.pedido, 'Request.');
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Agradece-se a contra-referência com o diagnóstico e o tratamento instituído.', en: 'Please reply with the diagnosis and treatment given.', keepWithNext: true },
      { type: 'signatures', columns: [clinicianSignature(ctx)] },
      sigiloNote(),
    );
    if (v.contraReferencia) {
      blocks.push({
        type: 'box',
        cut: true,
        label: `Contra-referência — a preencher pela unidade de destino (doente: ${v.doenteNome || '__________'})`,
        text: 'Diagnóstico, tratamento efectuado e recomendações:',
        lines: 5,
      });
    }
    return blocks;
  },
});
