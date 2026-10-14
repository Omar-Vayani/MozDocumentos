import { formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type OfficialUse, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, g, l, lineItems, localField, refField } from './_shared';
import {
  CONFIDENCIAL, clinicianFields, clinicianSignature, clinicianWarnings, hivWarning, mentionsHiv, patientAge, patientFields, sigiloNote,
} from './_saude';

const PEDIDO_OPTIONS = [
  { value: 'doente', label: l('O próprio doente', 'The patient'), pt: 'a pedido {do doente}' },
  { value: 'medico', label: l('Outro médico ou unidade sanitária', 'Another doctor or health facility'), pt: 'para continuidade de cuidados' },
  { value: 'junta', label: l('Junta de Saúde', 'Medical Board'), pt: 'a pedido da Junta de Saúde' },
  { value: 'inss', label: l('INSS ou seguradora', 'Social security or insurer'), pt: 'a pedido da entidade destinatária' },
  { value: 'empregador', label: l('Empregador', 'Employer'), pt: 'a pedido da entidade empregadora' },
  { value: 'tribunal', label: l('Tribunal ou Ministério Público', 'Court or Public Prosecutor'), pt: 'em resposta ao pedido da entidade destinatária' },
];

const official = (v: Values): OfficialUse | undefined =>
  v.pedidoPor === 'tribunal' ? 'tribunal' : v.pedidoPor === 'junta' || v.pedidoPor === 'inss' ? 'estado' : undefined;

const SECOES: { name: string; titulo: string; en: string; required?: boolean; rows?: number; help?: [string, string] }[] = [
  { name: 'motivo', titulo: 'Motivo do relatório', en: 'Reason for the report', required: true, rows: 2 },
  { name: 'historia', titulo: 'História clínica', en: 'Clinical history', required: true, rows: 5, help: ['Antecedentes e história da doença actual.', 'Past history and present illness.'] },
  { name: 'exameObjectivo', titulo: 'Exame objectivo', en: 'Physical examination', rows: 3 },
  { name: 'diagnostico', titulo: 'Diagnóstico', en: 'Diagnosis', required: true, rows: 2 },
  { name: 'tratamento', titulo: 'Tratamento efectuado', en: 'Treatment given', rows: 3 },
  { name: 'evolucao', titulo: 'Evolução e estado actual', en: 'Course and current condition', rows: 3 },
  { name: 'conclusao', titulo: 'Conclusão e recomendações', en: 'Conclusion and recommendations', required: true, rows: 3, help: ['Incapacidade, prognóstico, tratamento necessário, necessidade de evacuação…', 'Incapacity, prognosis, treatment needed, need for transfer…'] },
];

export default defineTemplate({
  id: 'relatorio-medico',
  family: 'carta',
  official,
  sections: [
    { id: 'documento', title: l('Destinatário', 'Addressee') },
    { id: 'doente', title: l('Doente', 'Patient'), personRole: 'outro' },
    { id: 'relatorio', title: l('Relatório', 'Report') },
    { id: 'exames', title: l('Exames complementares', 'Investigations') },
    { id: 'clinico', title: l('Médico', 'Doctor') },
  ],
  fields: [
    refField(),
    localField(),
    dateField(),
    { name: 'pedidoPor', type: 'select', section: 'documento', width: 'half', label: l('Pedido por', 'Requested by'), options: PEDIDO_OPTIONS.map(({ value, label }) => ({ value, label })), default: 'doente' },
    {
      name: 'consentimento',
      type: 'toggle',
      section: 'documento',
      label: l('O doente autorizou a entrega do relatório a esta entidade', 'The patient authorised release to this addressee'),
      showIf: (v) => v.pedidoPor !== 'doente' && v.pedidoPor !== 'tribunal',
    },
    {
      name: 'destinatario',
      type: 'textarea',
      section: 'documento',
      rows: 3,
      label: l('Destinatário (opcional)', 'Addressee (optional)'),
      placeholder: l('Exmo. Senhor Director Clínico\nHospital Central de Maputo', 'Exmo. Senhor Director Clínico\nHospital Central de Maputo'),
      help: l('Uma linha por linha do endereço. Em branco: "A quem possa interessar".', 'One line per address line. Blank: "To whom it may concern".'),
    },
    { name: 'finalidade', type: 'text', section: 'documento', label: l('Finalidade (opcional)', 'Purpose (optional)'), placeholder: l('Ex.: tratamento no estrangeiro', 'E.g. treatment abroad') },
    ...patientFields(['nome', 'genero', 'dataNascimento', 'idade', 'docTipo', 'docNumero', 'processo'], 'doente'),
    ...SECOES.map((s) => ({
      name: s.name,
      type: 'textarea' as const,
      section: 'relatorio',
      rows: s.rows,
      required: s.required,
      label: l(s.titulo, s.en),
      help: s.help ? l(s.help[0], s.help[1]) : undefined,
    })),
    { name: 'cid10', type: 'text', section: 'relatorio', width: 'half', label: l('Código CID-10 (opcional)', 'ICD-10 code (optional)') },
    {
      name: 'exames',
      type: 'lines',
      section: 'exames',
      label: l('Exames complementares', 'Investigations'),
      addLabel: l('Adicionar exame', 'Add test'),
      columns: [
        { name: 'exame', type: 'text', label: l('Exame', 'Test') },
        { name: 'data', type: 'date', label: l('Data', 'Date') },
        { name: 'resultado', type: 'text', label: l('Resultado', 'Result') },
      ],
    },
    ...clinicianFields('clinico'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clinicianWarnings(v)];
    if (v.pedidoPor !== 'doente' && v.pedidoPor !== 'tribunal' && !v.consentimento) {
      w.push({
        level: 'error',
        field: 'consentimento',
        message: l(
          `O relatório só pode ser entregue a terceiros com o consentimento expresso do doente, salvo obrigação legal (${cite('sigiloMedico')}).`,
          `The report may be released to third parties only with the patient’s express consent, unless the law requires it (${cite('sigiloMedico')}).`,
        ),
      });
    }
    if (v.pedidoPor === 'empregador') {
      w.push({
        level: 'warning',
        field: 'pedidoPor',
        message: l(
          `Ao empregador só se comunica a capacidade ou incapacidade para o trabalho (${cite('examesMedicosTrabalho')}). Prefira um atestado ou uma ficha de aptidão.`,
          `The employer is told only about fitness for work (${cite('examesMedicosTrabalho')}). Prefer a certificate or a fitness form.`,
        ),
      });
    }
    if (v.pedidoPor === 'tribunal') {
      w.push({ level: 'info', message: l('Responda nos termos e no âmbito do ofício recebido do tribunal.', 'Answer within the scope of the court’s request.') });
    }
    if (v.pedidoPor !== 'doente' && v.pedidoPor !== 'medico' && mentionsHiv(...SECOES.map((s) => v[s.name]))) w.push(hivWarning('diagnostico'));
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const age = patientAge(v);
    const dest = String(v.destinatario ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
    const blocks: Block[] = [CONFIDENCIAL, { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) }];
    if (dest.length) blocks.push({ type: 'recipient', lines: dest });
    blocks.push({ type: 'title', text: 'Relatório Médico', subtitle: dest.length ? undefined : 'A quem possa interessar' });
    const ident = [
      { label: 'Doente', value: v.doenteNome || '____________________' },
      { label: 'Sexo', value: v.doenteGenero === 'F' ? 'Feminino' : 'Masculino' },
      { label: 'Idade', value: age != null ? `${age} anos` : '______' },
    ];
    if (v.doenteDataNascimento) ident.push({ label: 'Data de nascimento', value: dateLong(v.doenteDataNascimento) });
    if (v.doenteDocNumero) ident.push({ label: 'Documento', value: `${v.doenteDocTipo || 'BI'} n.º ${v.doenteDocNumero}` });
    if (v.doenteProcesso) ident.push({ label: 'Processo clínico', value: String(v.doenteProcesso) });
    blocks.push({ type: 'keyValue', items: ident, columns: 2 });

    let n = 0;
    const add = (titulo: string, id: string, text: string, en: string) => {
      n++;
      blocks.push({ type: 'heading', text: `${n}. ${titulo}` }, { type: 'paragraph', id, text, en });
    };
    for (const s of SECOES) {
      const t = String(v[s.name] ?? '').trim();
      if (s.name === 'diagnostico') {
        const ex = lineItems(v.exames).filter((r) => r.exame || r.resultado);
        if (ex.length) {
          n++;
          blocks.push(
            { type: 'heading', text: `${n}. Exames complementares` },
            { type: 'table', columns: [{ label: 'Exame', width: 40 }, { label: 'Data', width: 20 }, { label: 'Resultado', width: 40 }], rows: ex.map((r) => [String(r.exame ?? ''), r.data ? formatDateShort(r.data) : '', String(r.resultado ?? '')]) },
          );
        }
      }
      if (!t && !s.required) continue;
      const txt = s.name === 'diagnostico' && v.cid10 ? `${t || '____________________'} (CID-10: ${v.cid10})` : t || '____________________';
      add(s.titulo, s.name, txt, `${s.en}: ${t}`);
    }
    const pedido = PEDIDO_OPTIONS.find((p) => p.value === v.pedidoPor) ?? PEDIDO_OPTIONS[0];
    const pedidoPt = pedido.pt.replace('{do doente}', g(v.doenteGenero, 'do doente', 'da doente'));
    const consent = v.pedidoPor !== 'doente' && v.pedidoPor !== 'tribunal' && v.consentimento ? `, com o consentimento ${g(v.doenteGenero, 'do doente', 'da doente')}` : '';
    const fin = String(v.finalidade ?? '').trim().replace(/[.;]+$/, '');
    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: `O presente relatório é emitido ${pedidoPt}${consent}${fin ? `, para efeitos de ${fin}` : ''}, e destina-se exclusivamente ao seu destinatário.`,
        en: 'This report is issued for its addressee only.',
        keepWithNext: true,
      },
      { type: 'signatures', columns: [clinicianSignature(ctx)] },
      sigiloNote(),
    );
    return blocks;
  },
});
