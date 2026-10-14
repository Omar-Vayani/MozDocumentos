import { defineTemplate, type Block, type FieldDef, type Values, type Warning } from '../model';
import { cite, dateField, l, localField, placeDate, refField } from './_shared';
import { clinicianFields, clinicianSignature, clinicianWarnings, patientAge, patientFields } from './_saude';

type Exame = { key: string; pt: string; en: string };
type Grupo = { id: string; titulo: string; en: string; exames: Exame[] };

const GRUPOS: Grupo[] = [
  {
    id: 'hematologia',
    titulo: 'Hematologia',
    en: 'Haematology',
    exames: [
      { key: 'hemograma', pt: 'Hemograma completo', en: 'Full blood count' },
      { key: 'vs', pt: 'Velocidade de sedimentação (VS)', en: 'ESR' },
      { key: 'grupo', pt: 'Grupo sanguíneo e factor Rh', en: 'Blood group and Rh' },
      { key: 'coagulacao', pt: 'Coagulação (TP/INR, TTPa)', en: 'Coagulation (PT/INR, aPTT)' },
    ],
  },
  {
    id: 'bioquimica',
    titulo: 'Bioquímica',
    en: 'Biochemistry',
    exames: [
      { key: 'glicemia', pt: 'Glicemia', en: 'Blood glucose' },
      { key: 'hba1c', pt: 'Hemoglobina glicada (HbA1c)', en: 'HbA1c' },
      { key: 'renal', pt: 'Ureia e creatinina', en: 'Urea and creatinine' },
      { key: 'transaminases', pt: 'Transaminases (AST/ALT)', en: 'Transaminases (AST/ALT)' },
      { key: 'bilirrubinas', pt: 'Bilirrubinas', en: 'Bilirubin' },
      { key: 'lipidos', pt: 'Perfil lipídico', en: 'Lipid profile' },
      { key: 'acidoUrico', pt: 'Ácido úrico', en: 'Uric acid' },
      { key: 'ionograma', pt: 'Ionograma (Na, K, Cl)', en: 'Electrolytes' },
      { key: 'pcr', pt: 'Proteína C reactiva (PCR)', en: 'C-reactive protein' },
    ],
  },
  {
    id: 'micro',
    titulo: 'Parasitologia e microbiologia',
    en: 'Parasitology and microbiology',
    exames: [
      { key: 'malaria', pt: 'Malária (teste rápido / gota espessa)', en: 'Malaria (RDT / thick smear)' },
      { key: 'urina', pt: 'Urina II (sumária)', en: 'Urinalysis' },
      { key: 'urocultura', pt: 'Urocultura e antibiograma', en: 'Urine culture' },
      { key: 'fezes', pt: 'Parasitológico de fezes', en: 'Stool parasitology' },
      { key: 'bk', pt: 'Expectoração — BK / GeneXpert', en: 'Sputum — AFB / GeneXpert' },
      { key: 'hemocultura', pt: 'Hemocultura', en: 'Blood culture' },
    ],
  },
  {
    id: 'serologia',
    titulo: 'Serologia',
    en: 'Serology',
    exames: [
      { key: 'hiv', pt: 'HIV (com aconselhamento e consentimento)', en: 'HIV (with counselling and consent)' },
      { key: 'sifilis', pt: 'Sífilis (VDRL/RPR)', en: 'Syphilis (VDRL/RPR)' },
      { key: 'hbsag', pt: 'Hepatite B (HBsAg)', en: 'Hepatitis B (HBsAg)' },
      { key: 'hcv', pt: 'Hepatite C (anti-HCV)', en: 'Hepatitis C (anti-HCV)' },
      { key: 'widal', pt: 'Reacção de Widal', en: 'Widal test' },
      { key: 'gravidez', pt: 'Teste de gravidez (beta-hCG)', en: 'Pregnancy test (beta-hCG)' },
      { key: 'psa', pt: 'PSA', en: 'PSA' },
    ],
  },
  {
    id: 'imagem',
    titulo: 'Imagiologia e outros',
    en: 'Imaging and other',
    exames: [
      { key: 'rx', pt: 'Radiografia', en: 'X-ray' },
      { key: 'eco', pt: 'Ecografia', en: 'Ultrasound' },
      { key: 'ecg', pt: 'Electrocardiograma (ECG)', en: 'ECG' },
    ],
  },
];

const fieldName = (k: string) => `exame${k.charAt(0).toUpperCase()}${k.slice(1)}`;
const IMAGEM_RADIACAO = (v: Values) => Boolean(v.exameRx);

export default defineTemplate({
  id: 'requisicao-exames',
  family: 'declaracao',
  page: 'A5',
  sections: [
    { id: 'documento', title: l('Requisição', 'Request') },
    { id: 'doente', title: l('Doente', 'Patient'), personRole: 'outro' },
    { id: 'clinica', title: l('Informação clínica', 'Clinical information') },
    ...GRUPOS.map((gr) => ({ id: gr.id, title: l(gr.titulo, gr.en) })),
    { id: 'clinico', title: l('Médico requisitante', 'Requesting doctor') },
  ],
  fields: [
    { ...refField(), label: l('Requisição n.º', 'Request no.') },
    localField(),
    dateField(),
    ...patientFields(['nome', 'genero', 'dataNascimento', 'idade', 'processo'], 'doente'),
    {
      name: 'gravidez',
      type: 'radio',
      section: 'doente',
      label: l('Gravidez', 'Pregnancy'),
      options: [
        { value: 'nao', label: l('Não', 'No') },
        { value: 'sim', label: l('Sim', 'Yes') },
        { value: 'desconhece', label: l('Desconhece', 'Unknown') },
      ],
      default: 'nao',
      showIf: (v) => v.doenteGenero === 'F',
    },
    { name: 'informacaoClinica', type: 'textarea', section: 'clinica', rows: 2, required: true, label: l('Informação clínica / hipótese diagnóstica', 'Clinical information / working diagnosis') },
    { name: 'urgente', type: 'toggle', section: 'clinica', label: l('Urgente', 'Urgent') },
    { name: 'jejum', type: 'toggle', section: 'clinica', label: l('Colheita em jejum', 'Fasting sample') },
    ...GRUPOS.flatMap((gr) =>
      gr.exames.map((e): FieldDef => ({ name: fieldName(e.key), type: 'toggle', section: gr.id, label: l(e.pt, e.en), width: 'half' })),
    ),
    { name: 'rxRegiao', type: 'text', section: 'imagem', width: 'half', label: l('Radiografia — região', 'X-ray — region'), placeholder: l('Ex.: tórax PA', 'E.g. chest PA'), showIf: (v) => Boolean(v.exameRx) },
    { name: 'ecoRegiao', type: 'text', section: 'imagem', width: 'half', label: l('Ecografia — região', 'Ultrasound — region'), placeholder: l('Ex.: abdominal', 'E.g. abdominal'), showIf: (v) => Boolean(v.exameEco) },
    { name: 'outrosExames', type: 'textarea', section: 'imagem', rows: 2, label: l('Outros exames', 'Other tests') },
    ...clinicianFields('clinico'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clinicianWarnings(v)];
    const any = GRUPOS.some((gr) => gr.exames.some((e) => v[fieldName(e.key)])) || String(v.outrosExames ?? '').trim();
    if (!any) w.push({ level: 'error', message: l('Seleccione pelo menos um exame.', 'Select at least one test.') });
    if (v.exameHiv) {
      w.push({
        level: 'info',
        field: 'exameHiv',
        message: l(`O teste de HIV exige aconselhamento e consentimento, e o resultado é entregue ao próprio (${cite('hivConfidencialidade')}).`, `HIV testing requires counselling and consent; results go to the patient (${cite('hivConfidencialidade')}).`),
      });
    }
    if (IMAGEM_RADIACAO(v) && v.doenteGenero === 'F' && v.gravidez !== 'nao') {
      w.push({ level: 'warning', field: 'gravidez', message: l('Radiografia numa doente que pode estar grávida: confirme a indicação e a protecção.', 'X-ray in a possibly pregnant patient: confirm the indication and shielding.') });
    }
    if (v.exameRx && !v.rxRegiao) w.push({ level: 'warning', field: 'rxRegiao', message: l('Indique a região a radiografar.', 'Enter the region for the X-ray.') });
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const age = patientAge(v);
    // One compact identification line: an A5 request has little room.
    const doente = [
      `**Doente:** ${v.doenteNome || '____________________'}`,
      `${v.doenteGenero === 'F' ? 'sexo feminino' : 'sexo masculino'}${age != null ? `, ${age} ${age === 1 ? 'ano' : 'anos'}` : ''}`,
      v.doenteProcesso ? `processo n.º ${v.doenteProcesso}` : '',
      v.doenteGenero === 'F' && v.gravidez && v.gravidez !== 'nao' ? `gravidez: ${v.gravidez === 'sim' ? 'sim' : 'desconhece'}` : '',
    ].filter(Boolean).join(' · ');
    const tags = [...(v.urgente ? ['URGENTE'] : []), 'CONFIDENCIAL'];
    const blocks: Block[] = [
      { type: 'tags', items: tags },
      { type: 'title', text: 'Requisição de Exames', subtitle: v.ref ? `N.º ${v.ref}` : undefined },
      { type: 'paragraph', id: 'doente', align: 'left', text: doente, en: `Patient: ${v.doenteNome || '___'}` },
      {
        type: 'paragraph',
        id: 'informacao',
        size: 'small',
        text: `**Informação clínica:** ${String(v.informacaoClinica || '____________________').trim()}${v.jejum ? ' **Colheita em jejum.**' : ''}`,
        en: `Clinical information: ${v.informacaoClinica || ''}`,
      },
    ];
    const items = GRUPOS.flatMap((gr) =>
      gr.exames
        .filter((e) => v[fieldName(e.key)])
        .map((e) => {
          let label = e.pt;
          if (e.key === 'rx' && v.rxRegiao) label = `Radiografia: ${v.rxRegiao}`;
          if (e.key === 'eco' && v.ecoRegiao) label = `Ecografia: ${v.ecoRegiao}`;
          return label;
        }),
    );
    if (items.length) blocks.push({ type: 'heading', text: 'Exames pedidos' }, { type: 'checklist', columns: items.length > 3 ? 2 : 1, items: items.map((label) => ({ label, checked: true })) });
    const outros = String(v.outrosExames ?? '').trim();
    if (outros) blocks.push({ type: 'heading', text: 'Outros' }, { type: 'paragraph', id: 'outros', size: 'small', text: outros, en: outros });
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [clinicianSignature(ctx)] });
    return blocks;
  },
});
