import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, g, l, localField, placeDate, workerFields } from './_shared';
import { clinicianFields, clinicianSignature, clinicianWarnings, hivWarning, mentionsHiv, practitionerHeader } from './_saude';

const TIPO_OPTIONS = [
  { value: 'admissao', label: l('Admissão', 'Pre-employment') },
  { value: 'periodico', label: l('Periódico', 'Periodic') },
  { value: 'regresso', label: l('Regresso ao trabalho (após doença ou acidente)', 'Return to work (after illness or accident)') },
  { value: 'ocasional', label: l('Ocasional (mudança de funções, pedido)', 'Occasional (change of job, on request)') },
];

const CONCLUSOES = [
  { value: 'apto', label: 'Apto', en: 'Fit' },
  { value: 'condicional', label: 'Apto condicionalmente', en: 'Fit with conditions' },
  { value: 'inapto-temporario', label: 'Inapto temporariamente', en: 'Temporarily unfit' },
  { value: 'inapto-definitivo', label: 'Inapto definitivamente para a função', en: 'Permanently unfit for the job' },
];

/** Words that suggest a diagnosis was typed into the restrictions. */
const DIAG_RE = /\b(diabet|hipertens|epileps|asma|tubercul|hepatit|cancro|tumor|depress|esquizofren|gravidez|grávida|diagn[oó]stic)/i;

export default defineTemplate({
  id: 'ficha-aptidao-trabalho',
  family: 'declaracao',
  sections: [
    { id: 'empresa', title: l('Empresa', 'Employer') },
    { id: 'trabalhador', title: l('Trabalhador', 'Worker'), personRole: 'trabalhador' },
    { id: 'exame', title: l('Exame e resultado', 'Examination and result') },
    { id: 'clinico', title: l('Médico do trabalho', 'Occupational doctor') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'empresaNome', type: 'text', section: 'empresa', width: 'half', required: true, label: l('Empresa (empregador)', 'Company (employer)') },
    { name: 'empresaNuit', type: 'text', section: 'empresa', width: 'half', label: l('NUIT da empresa (opcional)', 'Company NUIT (optional)') },
    ...workerFields(['nome', 'genero', 'cargo', 'departamento', 'dataAdmissao']).map((f) => (f.name === 'trabalhadorCargo' ? { ...f, required: true, label: l('Função / posto de trabalho', 'Job / workstation') } : f)),
    { name: 'trabalhadorNumero', type: 'text', section: 'trabalhador', width: 'half', label: l('N.º de trabalhador (opcional)', 'Employee no. (optional)') },
    { name: 'tipoExame', type: 'select', section: 'exame', width: 'half', label: l('Tipo de exame', 'Type of examination'), options: TIPO_OPTIONS, default: 'admissao' },
    { name: 'dataExame', type: 'date', section: 'exame', width: 'half', required: true, label: l('Data do exame', 'Examination date'), default: (c) => c.today },
    {
      name: 'conclusao',
      type: 'radio',
      section: 'exame',
      label: l('Resultado', 'Result'),
      options: CONCLUSOES.map((c) => ({ value: c.value, label: l(c.label, c.en) })),
      default: 'apto',
    },
    {
      name: 'restricoes',
      type: 'textarea',
      section: 'exame',
      rows: 2,
      label: l('Restrições ou recomendações funcionais', 'Functional restrictions or recommendations'),
      placeholder: l('Ex.: não trabalhar em altura; não levantar cargas pesadas', 'E.g. no work at height; no heavy lifting'),
      help: l('Só o que o trabalhador pode ou não fazer. Nunca o diagnóstico.', 'Only what the worker can or cannot do. Never the diagnosis.'),
      showIf: (v) => v.conclusao !== 'apto',
    },
    { name: 'reavaliarEm', type: 'date', section: 'exame', width: 'half', label: l('Reavaliar em', 'Reassess on'), showIf: (v) => v.conclusao === 'inapto-temporario' },
    { name: 'proximoExame', type: 'date', section: 'exame', width: 'half', label: l('Próximo exame periódico (opcional)', 'Next periodic exam (optional)') },
    ...clinicianFields('clinico'),
    localField(),
    dateField(),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clinicianWarnings(v)];
    if (!v.empresaNome) w.push({ level: 'warning', field: 'empresaNome', message: l('Indique a empresa a que se destina a ficha.', 'Enter the employer.') });
    if (v.conclusao === 'condicional' && !v.restricoes) w.push({ level: 'warning', field: 'restricoes', message: l('Indique as restrições.', 'Enter the restrictions.') });
    if (v.conclusao === 'inapto-temporario' && !v.reavaliarEm) w.push({ level: 'warning', field: 'reavaliarEm', message: l('Indique quando será reavaliado.', 'Enter the reassessment date.') });
    if (mentionsHiv(v.restricoes)) w.push(hivWarning('restricoes', 'error'));
    if (DIAG_RE.test(String(v.restricoes ?? ''))) {
      w.push({
        level: 'warning',
        field: 'restricoes',
        message: l(
          `Indique apenas restrições funcionais, sem diagnóstico: o médico só comunica ao empregador a aptidão para o trabalho (${cite('examesMedicosTrabalho')}).`,
          `Give functional restrictions only, no diagnosis: the doctor tells the employer only about fitness for work (${cite('examesMedicosTrabalho')}).`,
        ),
      });
    }
    if (v.conclusao === 'inapto-definitivo') {
      w.push({
        level: 'info',
        message: l(
          `A inaptidão definitiva pode afectar o contrato. O empregador pode pedir o parecer da Junta de Saúde (${cite('juntaDeSaude')}).`,
          `Permanent unfitness may affect the contract. The employer may ask the Medical Board for an opinion (${cite('juntaDeSaude')}).`,
        ),
      });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const tipo = TIPO_OPTIONS.find((t) => t.value === v.tipoExame)?.label.pt.toLowerCase() ?? 'admissão';
    const items = [
      { label: 'Empresa', value: `${v.empresaNome || '____________________'}${v.empresaNuit ? ` (NUIT ${v.empresaNuit})` : ''}` },
      { label: g(v.trabalhadorGenero, 'Trabalhador', 'Trabalhadora'), value: `${v.trabalhadorNome || '____________________'}${v.trabalhadorNumero ? ` (n.º ${v.trabalhadorNumero})` : ''}` },
      { label: 'Função', value: v.trabalhadorCargo || '____________________' },
    ];
    if (v.trabalhadorDepartamento) items.push({ label: 'Departamento', value: v.trabalhadorDepartamento });
    if (v.trabalhadorDataAdmissao) items.push({ label: 'Data de admissão', value: dateLong(v.trabalhadorDataAdmissao) });
    items.push({ label: 'Exame', value: `${tipo.charAt(0).toUpperCase()}${tipo.slice(1)}, realizado em ${dateLong(v.dataExame)}` });

    const blocks: Block[] = [
      ...practitionerHeader(ctx),
      { type: 'tags', items: ['CONFIDENCIAL'] },
      { type: 'title', text: 'Ficha de Aptidão para o Trabalho' },
      {
        type: 'paragraph',
        id: 'intro',
        text: `Comunica-se o resultado do exame médico de ${tipo} realizado ao trabalhador abaixo identificado, nos termos do ${cite('examesMedicosTrabalho')}. Em cumprimento do sigilo médico, esta ficha indica apenas a aptidão para o trabalho.`,
        en: 'This form gives the result of the medical examination of the worker named below. Under medical confidentiality it states only fitness for work.',
      },
      { type: 'keyValue', items, columns: 1 },
      { type: 'heading', text: 'Resultado' },
      { type: 'checklist', columns: 2, items: CONCLUSOES.map((c) => ({ label: c.label, checked: v.conclusao === c.value })) },
    ];
    const rest = String(v.restricoes ?? '').trim();
    if (v.conclusao !== 'apto' && rest) {
      blocks.push({ type: 'paragraph', id: 'restricoes', text: `**Restrições / recomendações:** ${rest}`, en: `Restrictions / recommendations: ${rest}` });
    }
    const datas: string[] = [];
    if (v.conclusao === 'inapto-temporario' && v.reavaliarEm) datas.push(`**Reavaliação em:** ${dateLong(v.reavaliarEm)}`);
    if (v.proximoExame) datas.push(`**Próximo exame periódico:** ${dateLong(v.proximoExame)}`);
    if (datas.length) blocks.push({ type: 'paragraph', id: 'datas', text: datas.join('\n'), en: 'Reassessment / next examination dates.' });
    blocks.push({
      type: 'signatures',
      placeDate: placeDate(ctx, v.data),
      columns: [clinicianSignature(ctx, v.clinicoGenero === 'F' ? 'A Médica do Trabalho' : 'O Médico do Trabalho'), { role: 'Tomei conhecimento', name: v.trabalhadorNome || undefined }],
    });
    return blocks;
  },
});
