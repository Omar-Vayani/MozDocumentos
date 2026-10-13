import { defineTemplate, type Block, type FieldDef, type SignatureColumn, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, g, isF, l, localField, placeDate } from './_shared';
import {
  clinicianFields, clinicianSignature, clinicianWarnings, establishmentName, horaMin, horaText, patientFields, practitionerHeader,
} from './_saude';

const TIPO_OPTIONS = [
  { value: 'consulta', label: l('Consulta médica', 'Medical consultation') },
  { value: 'exames', label: l('Exames ou tratamento', 'Tests or treatment') },
  { value: 'acompanhante', label: l('Acompanhante de um doente', 'Accompanying a patient') },
];

/** Relatives whose illness justifies the companion's absence (Labour Law, justified absences). */
const PARENTESCO = [
  { value: 'filho', label: l('Filho(a) ou menor a seu cargo', 'Child or minor in their care'), m: 'seu filho', f: 'sua filha' },
  { value: 'conjuge', label: l('Cônjuge ou companheiro(a)', 'Spouse or partner'), m: 'seu cônjuge', f: 'sua cônjuge' },
  { value: 'progenitor', label: l('Pai ou mãe', 'Father or mother'), m: 'seu pai', f: 'sua mãe' },
  { value: 'irmao', label: l('Irmão ou irmã', 'Brother or sister'), m: 'seu irmão', f: 'sua irmã' },
  { value: 'avo', label: l('Avô ou avó', 'Grandparent'), m: 'seu avô', f: 'sua avó' },
  { value: 'sogro', label: l('Sogro(a), genro ou nora', 'Parent-in-law, son- or daughter-in-law'), m: 'seu familiar', f: 'sua familiar' },
  { value: 'enteado', label: l('Enteado(a), padrasto ou madrasta', 'Stepchild or step-parent'), m: 'seu familiar', f: 'sua familiar' },
  { value: 'outro', label: l('Outra pessoa', 'Someone else'), m: '', f: '' },
];

const FIM_OPTIONS = [
  { value: 'trabalho', label: l('Justificar a ausência ao trabalho', 'Justify absence from work') },
  { value: 'escola', label: l('Justificar a ausência às aulas', 'Justify absence from school') },
  { value: 'prova', label: l('Apenas fazer prova da presença', 'Prove attendance only') },
];

const porClinico = (v: Values) => v.assinante !== 'servicos';

export default defineTemplate({
  id: 'declaracao-de-comparencia',
  family: 'declaracao',
  page: 'A5',
  sections: [
    { id: 'presenca', title: l('Quem esteve presente', 'Who attended'), personRole: 'outro' },
    { id: 'motivo', title: l('Motivo e horário', 'Reason and times') },
    { id: 'assinatura', title: l('Quem assina', 'Signed by') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...patientFields(['nome', 'genero', 'docTipo', 'docNumero'], 'presenca', 'presente'),
    { name: 'tipo', type: 'radio', section: 'motivo', label: l('Motivo da presença', 'Reason for attending'), options: TIPO_OPTIONS, default: 'consulta' },
    {
      name: 'acompanhadoNome',
      type: 'text',
      section: 'motivo',
      width: 'half',
      label: l('Nome do doente acompanhado', 'Name of the patient accompanied'),
      showIf: (v) => v.tipo === 'acompanhante',
    },
    {
      name: 'acompanhadoGenero',
      type: 'radio',
      section: 'motivo',
      label: l('Sexo do doente', 'Patient’s sex'),
      options: [
        { value: 'M', label: l('Masculino', 'Male') },
        { value: 'F', label: l('Feminino', 'Female') },
      ],
      default: 'M',
      showIf: (v) => v.tipo === 'acompanhante',
    },
    {
      name: 'parentesco',
      type: 'select',
      section: 'motivo',
      width: 'half',
      label: l('Relação com quem acompanhou', 'Relationship to the companion'),
      options: PARENTESCO.map(({ value, label }) => ({ value, label })),
      default: 'filho',
      showIf: (v) => v.tipo === 'acompanhante',
    },
    { name: 'dataComparencia', type: 'date', section: 'motivo', width: 'half', required: true, label: l('Dia', 'Date'), default: (c) => c.today },
    { name: 'horaEntrada', type: 'text', section: 'motivo', width: 'half', required: true, label: l('Hora de chegada', 'Arrival time'), placeholder: l('08:30', '08:30') },
    { name: 'horaSaida', type: 'text', section: 'motivo', width: 'half', required: true, label: l('Hora de saída', 'Departure time'), placeholder: l('11:15', '11:15') },
    { name: 'fim', type: 'select', section: 'motivo', width: 'half', label: l('Para que serve', 'Purpose'), options: FIM_OPTIONS, default: 'trabalho' },
    {
      name: 'assinante',
      type: 'radio',
      section: 'assinatura',
      label: l('Assinado por', 'Signed by'),
      options: [
        { value: 'clinico', label: l('Profissional de saúde', 'Health professional') },
        { value: 'servicos', label: l('Serviços administrativos (recepção)', 'Administration (front desk)') },
      ],
      default: 'clinico',
    },
    ...clinicianFields('assinatura').map((f): FieldDef => ({ ...f, showIf: (v) => porClinico(v) && (f.showIf ? f.showIf(v) : true) })),
    {
      name: 'servicosNome',
      type: 'text',
      section: 'assinatura',
      width: 'half',
      label: l('Nome de quem assina pelos serviços', 'Name of the signing staff member'),
      showIf: (v) => !porClinico(v),
    },
    localField(),
    dateField(),
  ],

  warnings: (v) => {
    const w: Warning[] = porClinico(v) ? clinicianWarnings(v) : [];
    const a = horaMin(v.horaEntrada);
    const b = horaMin(v.horaSaida);
    if (v.horaEntrada && a == null) w.push({ level: 'warning', field: 'horaEntrada', message: l('Escreva a hora no formato 08:30.', 'Write the time as 08:30.') });
    if (v.horaSaida && b == null) w.push({ level: 'warning', field: 'horaSaida', message: l('Escreva a hora no formato 11:15.', 'Write the time as 11:15.') });
    if (a != null && b != null && b <= a) w.push({ level: 'error', field: 'horaSaida', message: l('A hora de saída deve ser posterior à de chegada.', 'Departure must be after arrival.') });
    if (v.tipo === 'acompanhante' && v.fim === 'trabalho' && v.parentesco === 'outro') {
      w.push({
        level: 'info',
        field: 'parentesco',
        message: l(
          `A lei só justifica faltas para assistência a certos familiares (${cite('faltasPorDoenca')}); nos outros casos depende de autorização do empregador.`,
          `The law justifies absence only to assist certain relatives (${cite('faltasPorDoenca')}); otherwise it depends on the employer’s permission.`,
        ),
      });
    }
    return w;
  },

  personName: (v) => v.presenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.presenteGenero);
    const est = establishmentName(ctx);
    const local = est ? `nesta unidade sanitária (${est})` : 'neste consultório';
    const doc = v.presenteDocNumero ? `, ${f ? 'portadora' : 'portador'} do ${v.presenteDocTipo || 'BI'} n.º ${v.presenteDocNumero}` : '';
    let motivo = 'para consulta médica';
    let motivoEn = 'for a medical consultation';
    if (v.tipo === 'exames') {
      motivo = 'para a realização de exames ou tratamento';
      motivoEn = 'for tests or treatment';
    } else if (v.tipo === 'acompanhante') {
      const p = PARENTESCO.find((x) => x.value === v.parentesco);
      const rel = p && p.value !== 'outro' ? `${isF(v.acompanhadoGenero) ? p.f : p.m} ` : '';
      motivo = `como acompanhante de ${rel}**${v.acompanhadoNome || '____________________'}**, que necessitou de assistência médica`;
      motivoEn = `accompanying ${v.acompanhadoNome || '___'}, who needed medical care`;
    }
    const fimPt =
      v.fim === 'escola'
        ? 'e destina-se a justificar a ausência às aulas'
        : v.fim === 'prova'
          ? 'e destina-se a fazer prova da presença'
          : 'e destina-se a justificar a ausência ao trabalho';
    const sig: SignatureColumn = porClinico(v)
      ? clinicianSignature(ctx)
      : { role: 'Pelos Serviços', name: v.servicosNome || undefined, image: 'stamp' };
    const blocks: Block[] = [
      ...practitionerHeader(ctx),
      { type: 'title', text: 'Declaração de Comparência' },
      {
        type: 'paragraph',
        id: 'declara',
        text: `Declara-se, para os devidos efeitos, que ${g(v.presenteGenero, 'o Senhor', 'a Senhora')} **${v.presenteNome || '____________________'}**${doc}, esteve presente ${local} no dia **${dateLong(v.dataComparencia)}**, das **${horaText(v.horaEntrada)}** às **${horaText(v.horaSaida)}**, ${motivo}.`,
        en: `This is to certify that ${v.presenteNome || '___'} attended ${est || 'this practice'} on ${v.dataComparencia || '___'}, from ${v.horaEntrada || '___'} to ${v.horaSaida || '___'}, ${motivoEn}.`,
      },
      {
        type: 'paragraph',
        id: 'sem-informacao-clinica',
        text: `A presente declaração não contém informação clínica ${fimPt}.`,
        en: 'This statement contains no clinical information.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [sig] },
    ];
    return blocks;
  },
});
