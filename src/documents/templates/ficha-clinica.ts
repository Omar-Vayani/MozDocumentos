// Ficha clínica (anamnese) da primeira consulta: a confidential form filled by
// hand at the consultation, pre-filled with the patient's identification and
// any history already known. A dental variant adds the odontogram (FDI
// notation) and the dental treatment plan.

import { defineTemplate, type Block } from '../model';
import { dateLong, isF, l, localField } from './_shared';
import { CONFIDENCIAL, clinicianFields, clinicianSignature, patientAge, patientFields } from './_saude';
import { str } from './_saude-educacao';

const ANTECEDENTES = [
  'Hipertensão arterial', 'Diabetes', 'Asma ou doença respiratória', 'Doença cardíaca', 'Epilepsia', 'Tuberculose',
  'Doença renal', 'Hepatite', 'Infecção por HIV', 'Anemia falciforme', 'Cirurgias anteriores', 'Internamentos anteriores',
];
const HABITOS = ['Tabaco', 'Álcool', 'Outras substâncias', 'Actividade física regular'];
const DENTARIO = [
  'Sangramento gengival', 'Sensibilidade dentária', 'Dor ao mastigar', 'Bruxismo (ranger os dentes)',
  'Uso de prótese', 'Tratamento ortodôntico', 'Reacção a anestesia local', 'Hemorragia após extracção',
  'Hábitos tabágicos', 'Gravidez actual (se aplicável)',
];

const box = (label: string, n: number, text?: string): Block => ({ type: 'box', label, lines: text ? Math.max(1, n - 1) : n, text: text || undefined });

export default defineTemplate({
  id: 'ficha-clinica',
  family: 'mapa',
  sections: [
    { id: 'consulta', title: l('Consulta', 'Consultation') },
    { id: 'doente', title: l('Doente', 'Patient'), personRole: 'outro' },
    { id: 'historia', title: l('História já conhecida (opcional)', 'Known history (optional)') },
    { id: 'clinico', title: l('Profissional', 'Clinician') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'radio',
      section: 'consulta',
      label: l('Modelo', 'Form'),
      options: [
        { value: 'geral', label: l('Ficha clínica (medicina)', 'Medical record') },
        { value: 'dentaria', label: l('Ficha clínica dentária (com odontograma)', 'Dental record (with chart)') },
      ],
      default: (c) => (/dent|estomat|sorriso/i.test(`${c.profile?.especialidade ?? ''} ${c.profile?.firma ?? ''}`) ? 'dentaria' : 'geral'),
    },
    { name: 'dataConsulta', type: 'date', section: 'consulta', width: 'half', label: l('Data da consulta', 'Consultation date'), default: (c) => c.today },
    localField('consulta'),
    { name: 'especialidade', type: 'text', section: 'consulta', width: 'half', label: l('Especialidade / serviço (opcional)', 'Specialty / department (optional)') },
    ...patientFields(['nome', 'genero', 'dataNascimento', 'idade', 'docTipo', 'docNumero', 'processo', 'morada', 'telefone'], 'doente'),
    { name: 'profissao', type: 'text', section: 'doente', width: 'half', label: l('Profissão (opcional)', 'Occupation (optional)') },
    { name: 'emergencia', type: 'text', section: 'doente', width: 'half', label: l('Contacto de emergência (nome e telefone)', 'Emergency contact (name and phone)') },
    { name: 'seguro', type: 'text', section: 'doente', width: 'half', label: l('Seguro, convenção ou empresa (opcional)', 'Insurer, agreement or employer (optional)') },
    { name: 'alergias', type: 'text', section: 'historia', label: l('Alergias conhecidas', 'Known allergies'), placeholder: l('Ex.: penicilina', 'E.g. penicillin') },
    { name: 'medicacao', type: 'textarea', section: 'historia', rows: 2, label: l('Medicação habitual', 'Regular medication') },
    { name: 'antecedentesTexto', type: 'textarea', section: 'historia', rows: 2, label: l('Antecedentes relevantes', 'Relevant history') },
    ...clinicianFields('clinico'),
  ],

  warnings: () => [
    {
      level: 'info',
      message: l(
        'A ficha clínica é confidencial: guarde-a no processo do doente, em arquivo fechado, e não a entregue a terceiros sem autorização escrita do doente.',
        'The record is confidential: keep it in the patient’s file, locked, and do not release it without the patient’s written consent.',
      ),
    },
  ],

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.dataConsulta,

  blocks: (ctx) => {
    const v = ctx.values;
    const dent = v.tipo === 'dentaria';
    const age = patientAge(v, 'doente', str(v.dataConsulta) || undefined);
    const fem = isF(v.doenteGenero);
    const sig = clinicianSignature(ctx);
    const id = [
      { label: 'Nome', value: str(v.doenteNome) || ' ' },
      { label: 'Processo n.º', value: str(v.doenteProcesso) || ' ' },
      { label: 'Sexo', value: str(v.doenteNome) ? (fem ? 'Feminino' : 'Masculino') : '☐ M   ☐ F' },
      { label: 'Data de nascimento / idade', value: [str(v.doenteDataNascimento) ? dateLong(v.doenteDataNascimento) : '', age != null ? `${age} anos` : ''].filter(Boolean).join(' — ') || ' ' },
      { label: 'Documento', value: str(v.doenteDocNumero) ? `${str(v.doenteDocTipo) || 'BI'} n.º ${str(v.doenteDocNumero)}` : ' ' },
      { label: 'Telefone', value: str(v.doenteTelefone) || ' ' },
      { label: 'Residência', value: str(v.doenteMorada) || ' ' },
      { label: 'Profissão', value: str(v.profissao) || ' ' },
      { label: 'Contacto de emergência', value: str(v.emergencia) || ' ' },
      { label: 'Seguro / convenção', value: str(v.seguro) || ' ' },
    ];
    const blocks: Block[] = [
      CONFIDENCIAL,
      { type: 'title', text: dent ? 'Ficha Clínica Dentária' : 'Ficha Clínica', subtitle: [`Primeira consulta — ${dateLong(v.dataConsulta)}`, str(v.especialidade)].filter(Boolean).join(' · ') },
      { type: 'keyValue', title: 'Identificação', items: id, columns: 2 },
      box('Motivo da consulta (queixa principal)', 2),
      box(dent ? 'História da queixa actual' : 'História da doença actual', dent ? 2 : 4),
      { type: 'heading', text: 'Antecedentes pessoais' },
      { type: 'checklist', columns: 2, items: ANTECEDENTES.map((a) => ({ label: a, checked: false })) },
      box('Especificar antecedentes, cirurgias e internamentos', 1, str(v.antecedentesTexto)),
      { type: 'box', label: 'Alergias', text: str(v.alergias) || undefined, lines: str(v.alergias) ? 0 : 1, width: 'half' },
      { type: 'box', label: 'Medicação habitual', text: str(v.medicacao) || undefined, lines: str(v.medicacao) ? 0 : 1, width: 'half' },
    ];
    if (!dent) blocks.push({ type: 'heading', text: 'Hábitos' }, { type: 'checklist', columns: 2, items: HABITOS.map((a) => ({ label: a, checked: false })) });
    if (!dent && (fem || !str(v.doenteNome))) {
      blocks.push({ type: 'box', label: 'Antecedentes ginecológicos e obstétricos', text: 'Data da última menstruação: ____/____/______    Gestações: ____  Partos: ____  Abortos: ____\nContracepção: ______________________    Gravidez actual: ☐ Não  ☐ Sim  ☐ Não sabe', lines: 0 });
    }
    if (!dent) blocks.push(box('Antecedentes familiares', 1));
    blocks.push(
      { type: 'heading', text: 'Exame objectivo' },
      {
        type: 'table',
        grid: true,
        columns: [
          { label: 'TA (mmHg)', align: 'center' },
          { label: 'FC (bpm)', align: 'center' },
          { label: 'FR (cpm)', align: 'center' },
          { label: 'Temp. (°C)', align: 'center' },
          { label: 'SpO2 (%)', align: 'center' },
          { label: 'Peso (kg)', align: 'center' },
          { label: 'Altura (cm)', align: 'center' },
          { label: 'IMC', align: 'center' },
        ],
        rows: [[' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']],
      },
    );
    if (dent) {
      blocks.push(
        { type: 'heading', text: 'Antecedentes dentários' },
        { type: 'checklist', columns: 2, items: DENTARIO.map((a) => ({ label: a, checked: false })) },
        { type: 'heading', text: 'Odontograma (notação FDI)' },
        {
          type: 'table',
          grid: true,
          columns: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'].map((n) => ({ label: n, align: 'center' as const })),
          rows: [
            Array.from({ length: 16 }, () => ' '),
            Array.from({ length: 16 }, () => ' '),
            ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'],
          ],
          note: 'Legenda: C — cárie · O — obturado · A — ausente · E — extracção indicada · X — resto radicular · Co — coroa · I — implante',
        },
        box('Exame intra-oral (gengivas, mucosas, oclusão, higiene oral) e diagnóstico', 3),
        box('Plano de tratamento dentário e próxima consulta', 3),
      );
    } else {
      blocks.push(
        box('Exame físico', 4),
        box('Hipóteses de diagnóstico e exames complementares pedidos', 3),
        box('Plano terapêutico, recomendações e próxima consulta', 3),
      );
    }
    blocks.push(
      {
        type: 'box',
        label: 'Profissional de saúde',
        text: `${[sig.name, sig.detail?.replace(/\n/g, ' · ')].filter(Boolean).join(' — ') || '______________________________'}\nAssinatura e carimbo: ______________________________`,
        lines: 0,
      },
    );
    return blocks;
  },
});
