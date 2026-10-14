import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { cite, dateField, dateLong, DOC_TIPO_OPTIONS, g, isF, l, localField, placeDate } from './_shared';
import {
  clinicianFields, clinicianSignature, clinicianWarnings, countText, establishmentName, patientFields, patientIdent, senhor,
} from './_saude';

const QUALIDADE = [
  { value: 'pai', label: l('Pai', 'Father'), pt: 'seu pai' },
  { value: 'mae', label: l('Mãe', 'Mother'), pt: 'sua mãe' },
  { value: 'tutor', label: l('Tutor(a) / responsável', 'Guardian'), pt: 'responsável' },
  { value: 'familiar', label: l('Outro familiar', 'Other relative'), pt: 'familiar' },
];

export default defineTemplate({
  id: 'declaracao-internamento-alta',
  family: 'declaracao',
  page: 'A5',
  sections: [
    { id: 'doente', title: l('Doente', 'Patient'), personRole: 'outro' },
    { id: 'internamento', title: l('Internamento', 'Admission') },
    { id: 'acompanhante', title: l('Acompanhante (opcional)', 'Companion (optional)') },
    { id: 'clinico', title: l('Quem assina', 'Signed by') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...patientFields(['nome', 'genero', 'dataNascimento', 'idade', 'docTipo', 'docNumero'], 'doente'),
    { name: 'servico', type: 'text', section: 'internamento', width: 'half', label: l('Serviço / enfermaria', 'Ward'), placeholder: l('Ex.: Pediatria', 'E.g. Paediatrics') },
    { name: 'dataAdmissao', type: 'date', section: 'internamento', width: 'half', required: true, label: l('Data de admissão', 'Admission date') },
    { name: 'aindaInternado', type: 'toggle', section: 'internamento', label: l('Continua internado(a)', 'Still in hospital') },
    { name: 'dataAlta', type: 'date', section: 'internamento', width: 'half', label: l('Data da alta', 'Discharge date'), showIf: (v) => !v.aindaInternado },
    {
      name: 'convalescencaDias',
      type: 'number',
      section: 'internamento',
      width: 'half',
      min: 1,
      max: 120,
      label: l('Dias de convalescença após a alta (opcional)', 'Days of convalescence after discharge (optional)'),
      showIf: (v) => !v.aindaInternado,
    },
    { name: 'temAcompanhante', type: 'toggle', section: 'acompanhante', label: l('Declarar a presença de um acompanhante', 'Certify a companion’s presence'), help: l('Para o pai ou a mãe justificarem as faltas ao trabalho.', 'So that a parent can justify absence from work.') },
    { name: 'acompNome', type: 'text', section: 'acompanhante', width: 'half', label: l('Nome do acompanhante', 'Companion’s name'), showIf: (v) => Boolean(v.temAcompanhante) },
    { name: 'acompGenero', type: 'radio', section: 'acompanhante', label: l('Tratamento', 'Form of address'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }], default: 'F', showIf: (v) => Boolean(v.temAcompanhante) },
    { name: 'acompQualidade', type: 'select', section: 'acompanhante', width: 'half', label: l('Relação com o doente', 'Relationship'), options: QUALIDADE.map(({ value, label }) => ({ value, label })), default: 'mae', showIf: (v) => Boolean(v.temAcompanhante) },
    { name: 'acompDocTipo', type: 'select', section: 'acompanhante', width: 'half', label: l('Documento', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', showIf: (v) => Boolean(v.temAcompanhante) },
    { name: 'acompDocNumero', type: 'text', section: 'acompanhante', width: 'half', label: l('Número do documento', 'Document number'), showIf: (v) => Boolean(v.temAcompanhante) },
    ...clinicianFields('clinico'),
    localField(),
    dateField(),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clinicianWarnings(v)];
    if (!v.aindaInternado && v.dataAdmissao && v.dataAlta && diffDays(v.dataAdmissao, v.dataAlta) < 0) {
      w.push({ level: 'error', field: 'dataAlta', message: l('A data da alta é anterior à admissão.', 'Discharge is before admission.') });
    }
    if (!v.aindaInternado && !v.dataAlta) w.push({ level: 'warning', field: 'dataAlta', message: l('Indique a data da alta ou marque "continua internado".', 'Enter the discharge date or mark "still in hospital".') });
    if (v.temAcompanhante) {
      w.push({
        level: 'info',
        message: l(
          `As faltas dos pais que acompanham filhos internados são justificadas e não são descontadas nas férias (${cite('faltasDoencaRemuneracao')}). Outros familiares cabem na assistência à família (${cite('faltasPorDoenca')}).`,
          `Absences of parents accompanying a hospitalised child are justified and not deducted from leave (${cite('faltasDoencaRemuneracao')}). Other relatives fall under family care (${cite('faltasPorDoenca')}).`,
        ),
      });
    }
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fd = isF(v.doenteGenero);
    const pat = patientIdent(v);
    const est = establishmentName(ctx);
    const onde = `${est ? `nesta unidade sanitária (${est})` : 'nesta unidade sanitária'}${v.servico ? `, no serviço de ${v.servico}` : ''}`;
    const periodo = v.aindaInternado
      ? `se encontra ${fd ? 'internada' : 'internado'} ${onde} desde **${dateLong(v.dataAdmissao)}**, à presente data`
      : `esteve ${fd ? 'internada' : 'internado'} ${onde} de **${dateLong(v.dataAdmissao)}** a **${dateLong(v.dataAlta)}**, data em que teve alta`;
    const semInfo = ' A presente declaração não contém informação clínica.';
    const blocks: Block[] = [
      { type: 'title', text: v.aindaInternado ? 'Declaração de Internamento' : 'Declaração de Internamento e Alta' },
      {
        type: 'paragraph',
        id: 'internamento',
        text: `Declara-se, para os devidos efeitos, que ${senhor(v)} ${pat.pt}, ${periodo}.`,
        en: `${v.doenteNome || '___'} was admitted from ${v.dataAdmissao || '___'}${v.aindaInternado ? ' and remains in hospital' : ` to ${v.dataAlta || '___'}`}.`,
      },
    ];
    if (v.temAcompanhante) {
      const q = QUALIDADE.find((x) => x.value === v.acompQualidade) ?? QUALIDADE[1];
      const fa = isF(v.acompGenero);
      const rel = q.value === 'tutor' || q.value === 'familiar' ? `${fa ? 'sua' : 'seu'} ${q.pt}` : q.pt;
      blocks.push({
        type: 'paragraph',
        id: 'acompanhante',
        text: `Durante o internamento, ${g(v.doenteGenero, 'o doente', 'a doente')} foi ${fd ? 'acompanhada' : 'acompanhado'} por ${rel}, **${v.acompNome || '____________________'}**${v.acompDocNumero ? `, ${fa ? 'portadora' : 'portador'} do ${v.acompDocTipo || 'BI'} n.º ${v.acompDocNumero}` : ''}, cuja presença junto ${g(v.doenteGenero, 'do doente', 'da doente')} foi necessária.`,
        en: `During the stay the patient was accompanied by ${v.acompNome || '___'}, whose presence was necessary.`,
      });
    }
    const conv = Number(v.convalescencaDias);
    if (!v.aindaInternado && v.convalescencaDias && Number.isFinite(conv) && conv > 0) {
      blocks.push({
        type: 'paragraph',
        id: 'convalescenca',
        text: `Após a alta, ${g(v.doenteGenero, 'o doente', 'a doente')} necessita de ${countText(conv)} ${conv === 1 ? 'dia' : 'dias'} de convalescença.`,
        en: `After discharge the patient needs ${conv} days of convalescence.`,
      });
    }
    // The last paragraph says the document carries no clinical information and stays with the signature.
    const last = blocks[blocks.length - 1];
    if (last.type === 'paragraph') {
      last.text += semInfo;
      last.keepWithNext = true;
    }
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [clinicianSignature(ctx) as SignatureColumn] });
    return blocks;
  },
});
