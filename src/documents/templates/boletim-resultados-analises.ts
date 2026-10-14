import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, l, lineItems, localField, placeDate } from './_shared';
import { CONFIDENCIAL, mentionsHiv, patientAge, patientFields, practitionerHeader, sigiloNote } from './_saude';

const AMOSTRA_OPTIONS = ['sangue total', 'soro', 'plasma', 'urina', 'fezes', 'expectoração', 'exsudado', 'líquido biológico', 'outra'].map((x) => ({
  value: x,
  label: l(x.charAt(0).toUpperCase() + x.slice(1), x),
}));

const num = (s: unknown): number | null => {
  if (typeof s === 'number') return Number.isFinite(s) ? s : null;
  if (typeof s !== 'string' || !s.trim()) return null;
  const n = Number(s.trim().replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

type Linha = { parametro: string; resultado: string; unidade: string; ref: string; flag: '' | 'Alto' | 'Baixo' };

function linhas(v: Values): Linha[] {
  return lineItems(v.resultados)
    .filter((r) => String(r.parametro ?? '').trim() || String(r.resultado ?? '').trim())
    .map((r) => {
      const res = num(r.resultado);
      const min = num(r.refMin);
      const max = num(r.refMax);
      let flag: Linha['flag'] = '';
      if (res != null && min != null && res < min) flag = 'Baixo';
      if (res != null && max != null && res > max) flag = 'Alto';
      const txt = String(r.refTexto ?? '').trim();
      const ref = txt || (min != null && max != null ? `${r.refMin} – ${r.refMax}` : min != null ? `> ${r.refMin}` : max != null ? `< ${r.refMax}` : '');
      return { parametro: String(r.parametro ?? '').trim(), resultado: String(r.resultado ?? '').trim(), unidade: String(r.unidade ?? '').trim(), ref, flag };
    });
}

export default defineTemplate({
  id: 'boletim-resultados-analises',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Boletim', 'Report') },
    { id: 'doente', title: l('Doente', 'Patient'), personRole: 'outro' },
    { id: 'amostra', title: l('Amostra', 'Sample') },
    { id: 'resultados', title: l('Resultados', 'Results') },
    { id: 'validacao', title: l('Validação', 'Validation') },
  ],
  fields: [
    { name: 'numeroAmostra', type: 'text', section: 'documento', width: 'half', required: true, label: l('N.º da amostra / registo', 'Sample / accession no.') },
    localField(),
    dateField('data', 'documento', l('Data de emissão', 'Issue date')),
    ...patientFields(['nome', 'genero', 'dataNascimento', 'idade', 'processo'], 'doente'),
    { name: 'medicoRequisitante', type: 'text', section: 'doente', width: 'half', label: l('Médico requisitante', 'Requesting doctor') },
    { name: 'tipoAmostra', type: 'select', section: 'amostra', width: 'half', label: l('Tipo de amostra', 'Sample type'), options: AMOSTRA_OPTIONS, default: 'sangue total' },
    { name: 'dataColheita', type: 'date', section: 'amostra', width: 'half', required: true, label: l('Data da colheita', 'Collection date'), default: (c) => c.today },
    { name: 'horaColheita', type: 'text', section: 'amostra', width: 'half', label: l('Hora da colheita', 'Collection time'), placeholder: l('07:45', '07:45') },
    { name: 'dataValidacao', type: 'date', section: 'amostra', width: 'half', label: l('Data da validação', 'Validation date'), default: (c) => c.today },
    {
      name: 'resultados',
      type: 'lines',
      section: 'resultados',
      required: true,
      label: l('Resultados', 'Results'),
      help: l('Indique os valores de referência: os resultados fora do intervalo ficam assinalados.', 'Give reference values: results out of range are flagged.'),
      addLabel: l('Adicionar parâmetro', 'Add parameter'),
      columns: [
        { name: 'parametro', type: 'text', label: l('Parâmetro', 'Parameter') },
        { name: 'resultado', type: 'text', label: l('Resultado', 'Result') },
        { name: 'unidade', type: 'text', label: l('Unidade', 'Unit') },
        { name: 'refMin', type: 'text', label: l('Referência mín.', 'Ref. min') },
        { name: 'refMax', type: 'text', label: l('Referência máx.', 'Ref. max') },
        { name: 'refTexto', type: 'text', label: l('Ou referência em texto', 'Or reference as text'), placeholder: l('Negativo', 'Negative') },
      ],
    },
    { name: 'metodo', type: 'text', section: 'resultados', label: l('Método / equipamento (opcional)', 'Method / analyser (optional)') },
    { name: 'observacoes', type: 'textarea', section: 'resultados', rows: 2, label: l('Observações (opcional)', 'Comments (optional)') },
    { name: 'validadorNome', type: 'text', section: 'validacao', width: 'half', required: true, label: l('Validado por', 'Validated by'), default: (c) => c.profile?.representanteNome ?? c.profile?.nome ?? '' },
    { name: 'validadorCargo', type: 'text', section: 'validacao', width: 'half', label: l('Cargo', 'Position'), default: 'Director Técnico do Laboratório' },
    { name: 'validadorRegisto', type: 'text', section: 'validacao', width: 'half', label: l('N.º de registo profissional (opcional)', 'Professional registration (optional)') },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    const ls = linhas(v);
    if (!ls.length) w.push({ level: 'error', field: 'resultados', message: l('Indique pelo menos um resultado.', 'Enter at least one result.') });
    if (ls.some((x) => x.resultado && !x.ref)) w.push({ level: 'info', field: 'resultados', message: l('Há resultados sem valores de referência.', 'Some results have no reference values.') });
    if (mentionsHiv(...ls.map((x) => x.parametro))) {
      w.push({
        level: 'warning',
        field: 'resultados',
        message: l(`O resultado de HIV é confidencial e entregue apenas ao próprio (${cite('hivConfidencialidade')}). Emita-o num boletim separado.`, `HIV results are confidential and given only to the patient (${cite('hivConfidencialidade')}). Issue them on a separate report.`),
      });
    }
    if (!v.validadorNome) w.push({ level: 'warning', field: 'validadorNome', message: l('Indique quem valida os resultados.', 'Enter who validates the results.') });
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const age = patientAge(v);
    const amostra = [
      { label: 'Doente', value: v.doenteNome || '____________________' },
      { label: 'Amostra n.º', value: v.numeroAmostra || '__________' },
      { label: 'Sexo / idade', value: `${v.doenteGenero === 'F' ? 'Feminino' : 'Masculino'}${age != null ? `, ${age} anos` : ''}` },
      { label: 'Tipo de amostra', value: String(v.tipoAmostra || 'sangue total').replace(/^./, (c) => c.toUpperCase()) },
      { label: 'Colheita', value: `${dateLong(v.dataColheita)}${v.horaColheita ? `, ${v.horaColheita}` : ''}` },
      { label: 'Médico requisitante', value: v.medicoRequisitante || '—' },
    ];
    if (v.doenteProcesso) amostra.push({ label: 'Processo n.º', value: String(v.doenteProcesso) });
    if (v.dataValidacao) amostra.push({ label: 'Validação', value: dateLong(v.dataValidacao) });
    const ls = linhas(v);
    const rows = ls.map((x) => [x.parametro, x.resultado, x.unidade, x.ref, x.flag]);
    const sig: SignatureColumn = {
      role: 'Validado por',
      name: v.validadorNome || undefined,
      detail: [v.validadorCargo, v.validadorRegisto ? `Registo n.º ${v.validadorRegisto}` : ''].filter(Boolean).join('\n') || undefined,
      image: 'both',
    };
    const blocks: Block[] = [
      ...practitionerHeader(ctx),
      CONFIDENCIAL,
      { type: 'title', text: 'Boletim de Resultados de Análises Clínicas' },
      { type: 'keyValue', items: amostra, columns: 2 },
      {
        type: 'table',
        columns: [
          { label: 'Parâmetro', width: 34 },
          { label: 'Resultado', width: 16, align: 'right' },
          { label: 'Unidade', width: 14 },
          { label: 'Valores de referência', width: 26 },
          { label: 'Fora do intervalo', width: 12, align: 'center' },
        ],
        rows: rows.length ? rows : [['____________', '______', '______', '____________', '']],
        note: ls.some((x) => x.flag) ? 'Alto / Baixo: resultado acima ou abaixo dos valores de referência.' : undefined,
      },
    ];
    if (v.metodo) blocks.push({ type: 'paragraph', id: 'metodo', size: 'small', text: `**Método:** ${v.metodo}`, en: `Method: ${v.metodo}` });
    if (v.observacoes) blocks.push({ type: 'paragraph', id: 'observacoes', size: 'small', text: `**Observações:** ${v.observacoes}`, en: `Comments: ${v.observacoes}` });
    blocks.push(
      { type: 'paragraph', id: 'interpretacao', size: 'small', text: 'Os resultados devem ser interpretados pelo médico assistente, em conjunto com a situação clínica.', en: 'Results must be interpreted by the attending doctor in the clinical context.', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [sig] },
      sigiloNote(),
    );
    return blocks;
  },
});
