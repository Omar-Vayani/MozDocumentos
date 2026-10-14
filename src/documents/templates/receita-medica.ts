import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { cite, dateField, l, lineItems, localField, placeDate, refField } from './_shared';
import {
  clinicianFields, clinicianSignature, clinicianWarnings, countText, patientAge, patientFields,
} from './_saude';

const FORMA_OPTIONS = [
  'comprimido', 'cápsula', 'xarope', 'suspensão oral', 'solução oral', 'gotas', 'injectável', 'pomada', 'creme', 'gel',
  'supositório', 'óvulo', 'inalador', 'colírio', 'saqueta', 'outra',
].map((x) => ({ value: x, label: l(x.charAt(0).toUpperCase() + x.slice(1), x) }));

/** Unit: [singular, plural, feminine]. */
const UNIDADES: Record<string, [string, string, boolean]> = {
  embalagem: ['embalagem', 'embalagens', true],
  comprimido: ['comprimido', 'comprimidos', false],
  'cápsula': ['cápsula', 'cápsulas', true],
  frasco: ['frasco', 'frascos', false],
  ampola: ['ampola', 'ampolas', true],
  tubo: ['tubo', 'tubos', false],
  saqueta: ['saqueta', 'saquetas', true],
  unidade: ['unidade', 'unidades', true],
};
const UNIDADE_OPTIONS = Object.keys(UNIDADES).map((k) => ({ value: k, label: l(k.charAt(0).toUpperCase() + k.slice(1), k) }));

const MAX_ITENS = 6;
const IDADE_PESO = 12;

type Med = { dci: string; forma: string; dosagem: string; quantidade: number | null; unidade: string; posologia: string; duracao: string };

function meds(v: Values): Med[] {
  return lineItems(v.medicamentos)
    .map((r) => ({
      dci: String(r.dci ?? '').trim(),
      forma: String(r.forma ?? '').trim(),
      dosagem: String(r.dosagem ?? '').trim(),
      quantidade: r.quantidade === '' || r.quantidade == null ? null : Number(r.quantidade),
      unidade: String(r.unidade ?? 'embalagem'),
      posologia: String(r.posologia ?? '').trim().replace(/[.;]+$/, ''),
      duracao: String(r.duracao ?? '').trim().replace(/[.;]+$/, ''),
    }))
    .filter((m) => m.dci || m.posologia);
}

function qtd(m: Med): string {
  const [s, p, fem] = UNIDADES[m.unidade] ?? UNIDADES.embalagem;
  if (m.quantidade == null || !Number.isFinite(m.quantidade)) return `____ ${p}`;
  return `${countText(m.quantidade, fem)} ${m.quantidade === 1 ? s : p}`;
}

export default defineTemplate({
  id: 'receita-medica',
  family: 'declaracao',
  page: 'A5',
  sections: [
    { id: 'documento', title: l('Receita', 'Prescription') },
    { id: 'doente', title: l('Doente', 'Patient'), personRole: 'outro' },
    { id: 'prescricao', title: l('Medicamentos', 'Medicines') },
    { id: 'clinico', title: l('Prescritor', 'Prescriber') },
  ],
  fields: [
    { ...refField(), label: l('Receita n.º', 'Prescription no.') },
    localField(),
    dateField(),
    ...patientFields(['nome', 'genero', 'dataNascimento', 'idade', 'processo'], 'doente'),
    {
      name: 'doentePeso',
      type: 'number',
      section: 'doente',
      width: 'half',
      label: l('Peso (kg)', 'Weight (kg)'),
      help: l('Obrigatório em crianças: a dose depende do peso.', 'Required for children: the dose depends on weight.'),
      min: 0,
      max: 300,
    },
    {
      name: 'alergias',
      type: 'text',
      section: 'doente',
      width: 'half',
      label: l('Alergias conhecidas (opcional)', 'Known allergies (optional)'),
      placeholder: l('Ex.: penicilina', 'E.g. penicillin'),
    },
    {
      name: 'medicamentos',
      type: 'lines',
      section: 'prescricao',
      required: true,
      label: l('Medicamentos', 'Medicines'),
      help: l('Escreva o nome genérico (DCI), não a marca comercial.', 'Write the generic name (INN), not the brand.'),
      addLabel: l('Adicionar medicamento', 'Add medicine'),
      columns: [
        { name: 'dci', type: 'text', label: l('Medicamento (DCI)', 'Medicine (INN)'), placeholder: l('Ex.: Amoxicilina', 'E.g. Amoxicillin') },
        { name: 'forma', type: 'select', label: l('Forma', 'Form'), options: FORMA_OPTIONS },
        { name: 'dosagem', type: 'text', label: l('Dosagem', 'Strength'), placeholder: l('Ex.: 500 mg', 'E.g. 500 mg') },
        { name: 'quantidade', type: 'number', label: l('Quantidade', 'Quantity'), min: 0 },
        { name: 'unidade', type: 'select', label: l('Unidade', 'Unit'), options: UNIDADE_OPTIONS },
        { name: 'posologia', type: 'text', label: l('Posologia', 'Directions'), placeholder: l('Ex.: 1 comprimido de oito em oito horas', 'E.g. 1 tablet three times a day') },
        { name: 'duracao', type: 'text', label: l('Duração', 'Duration'), placeholder: l('Ex.: durante uma semana', 'E.g. for one week') },
      ],
    },
    {
      name: 'observacoes',
      type: 'textarea',
      section: 'prescricao',
      rows: 2,
      label: l('Indicações ao doente (opcional)', 'Instructions to the patient (optional)'),
      placeholder: l('Ex.: tomar às refeições; uso externo', 'E.g. take with meals; external use'),
    },
    {
      name: 'semControlados',
      type: 'toggle',
      section: 'prescricao',
      label: l('Confirmo que a receita não inclui estupefacientes nem psicotrópicos', 'I confirm the prescription contains no narcotics or psychotropics'),
      help: l('Estes medicamentos exigem impresso oficial próprio.', 'These medicines require a special official form.'),
    },
    ...clinicianFields('clinico'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clinicianWarnings(v)];
    const list = meds(v);
    if (!list.length) w.push({ level: 'error', field: 'medicamentos', message: l('Indique pelo menos um medicamento.', 'Enter at least one medicine.') });
    if (list.length > MAX_ITENS) {
      w.push({
        level: 'warning',
        field: 'medicamentos',
        message: l(`Mais de ${MAX_ITENS} medicamentos não cabem numa receita A5. Divida-os por duas receitas.`, `More than ${MAX_ITENS} medicines do not fit an A5 prescription. Split them into two.`),
      });
    }
    list.forEach((m, i) => {
      if (!m.posologia) w.push({ level: 'warning', field: 'medicamentos', message: l(`Medicamento ${i + 1}: indique a posologia.`, `Medicine ${i + 1}: enter the directions.`) });
      if (m.quantidade == null) w.push({ level: 'warning', field: 'medicamentos', message: l(`Medicamento ${i + 1}: indique a quantidade.`, `Medicine ${i + 1}: enter the quantity.`) });
      if (/[®™]/.test(m.dci)) {
        w.push({ level: 'info', field: 'medicamentos', message: l(`Medicamento ${i + 1}: prescreva pela denominação comum internacional (DCI), não pela marca.`, `Medicine ${i + 1}: prescribe by INN, not brand.`) });
      }
    });
    const age = patientAge(v);
    if (age != null && age < IDADE_PESO && !v.doentePeso) {
      w.push({ level: 'warning', field: 'doentePeso', message: l('Numa criança, indique o peso: a dose depende dele.', 'For a child, enter the weight: the dose depends on it.') });
    }
    if (!v.semControlados) {
      w.push({
        level: 'error',
        field: 'semControlados',
        message: l(
          `Confirme que a receita não inclui estupefacientes nem psicotrópicos: estes seguem regime e impressos próprios (${cite('estupefacientesPrescricao')}).`,
          `Confirm the prescription has no narcotics or psychotropics: these follow their own regime and forms (${cite('estupefacientesPrescricao')}).`,
        ),
      });
    }
    w.push({
      level: 'info',
      message: l('Confirme na farmácia o prazo de validade da receita.', 'Check the prescription’s validity period with the pharmacy.'),
    });
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const age = patientAge(v);
    // One compact identification line: an A5 prescription has little room.
    const linha = [
      `**Doente:** ${v.doenteNome || '____________________'}`,
      age != null ? `${age} ${age === 1 ? 'ano' : 'anos'}` : 'idade: ______',
      v.doenteGenero === 'F' ? 'sexo feminino' : 'sexo masculino',
      v.doentePeso ? `${v.doentePeso} kg` : '',
      v.doenteProcesso ? `processo n.º ${v.doenteProcesso}` : '',
    ].filter(Boolean).join(' · ');

    const blocks: Block[] = [
      { type: 'title', text: 'Receita Médica', subtitle: v.ref ? `N.º ${v.ref}` : undefined },
      {
        type: 'paragraph',
        id: 'doente',
        align: 'left',
        text: `${linha}${v.alergias ? `\n**Alergias:** ${v.alergias}` : ''}`,
        en: `Patient: ${v.doenteNome || '___'}${v.alergias ? `; allergies: ${v.alergias}` : ''}`,
      },
      { type: 'display', text: 'Rp/', size: 'md', align: 'left', weight: 'bold', tone: 'accent', italic: true, after: 2 },
    ];
    const list = meds(v);
    const rows = list.length ? list : [{ dci: '', forma: '', dosagem: '', quantidade: null, unidade: 'embalagem', posologia: '', duracao: '' }];
    rows.forEach((m, i) => {
      const nome = [m.dci || '____________________', m.forma && m.forma !== 'outra' ? m.forma : '', m.dosagem].filter(Boolean).join(' ');
      const usoRaw = [m.posologia, m.duracao].filter(Boolean).join(', ');
      const uso = usoRaw.charAt(0).toUpperCase() + usoRaw.slice(1);
      blocks.push({
        type: 'paragraph',
        id: `medicamento-${i + 1}`,
        align: 'left',
        text: `${i + 1}. **${nome}** — Qtd.: ${qtd(m)}${uso ? `\n${uso}.` : ''}`,
        en: `${i + 1}. ${nome} — quantity ${m.quantidade ?? '___'}${uso ? `; ${uso}` : ''}.`,
      });
    });
    blocks.push({ type: 'display', text: '— fim da prescrição —', size: 'xs', tone: 'muted', italic: true, after: 2 });
    if (v.observacoes) {
      blocks.push({ type: 'paragraph', id: 'observacoes', size: 'small', align: 'left', text: `**Indicações:** ${v.observacoes}`, en: `Instructions: ${v.observacoes}` });
    }
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [clinicianSignature(ctx)] });
    return blocks;
  },
});
