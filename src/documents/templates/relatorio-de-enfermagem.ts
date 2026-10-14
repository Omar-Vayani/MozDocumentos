// Relatório de enfermagem: nursing report at the end of home care, on transfer
// to another facility or at discharge, so that the next carer knows the
// patient's condition, the care given and what must continue. Confidential.

import { formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { dateField, dateLong, l, localField, refField } from './_shared';
import { CONFIDENCIAL, hivWarning, mentionsHiv, ORDEM_ENFERMEIROS, patientAge, patientFields, sigiloNote } from './_saude';
import { cell, lines, profFields, profSignature, rows, str } from './_saude-educacao';

const TIPO_OPTIONS = [
  { value: 'domicilio', label: l('Cuidados domiciliários', 'Home care'), sub: 'Cuidados domiciliários' },
  { value: 'transferencia', label: l('Transferência para outra unidade', 'Transfer to another facility'), sub: 'Nota de transferência' },
  { value: 'alta', label: l('Alta', 'Discharge'), sub: 'Nota de alta de enfermagem' },
];

const SECOES = [
  { name: 'avaliacao', titulo: 'Avaliação de enfermagem', en: 'Nursing assessment', required: true, rows: 3 },
  { name: 'problemas', titulo: 'Problemas e diagnósticos de enfermagem', en: 'Nursing problems', rows: 3 },
  { name: 'intervencoes', titulo: 'Intervenções realizadas', en: 'Interventions', required: true, rows: 4 },
  { name: 'evolucao', titulo: 'Evolução e estado actual', en: 'Course and current condition', rows: 3 },
  { name: 'plano', titulo: 'Cuidados a manter e recomendações', en: 'Care to continue', required: true, rows: 3 },
];

export default defineTemplate({
  id: 'relatorio-de-enfermagem',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Relatório', 'Report') },
    { id: 'doente', title: l('Doente', 'Patient'), personRole: 'outro' },
    { id: 'relatorio', title: l('Conteúdo', 'Content') },
    { id: 'sinais', title: l('Sinais vitais (opcional)', 'Vital signs (optional)') },
    { id: 'profissional', title: l('Enfermeiro(a)', 'Nurse') },
  ],
  fields: [
    refField(),
    localField(),
    dateField(),
    { name: 'tipo', type: 'select', section: 'documento', width: 'half', label: l('Tipo', 'Kind'), options: TIPO_OPTIONS.map(({ value, label }) => ({ value, label })), default: 'domicilio' },
    { name: 'periodo', type: 'text', section: 'documento', width: 'half', label: l('Período dos cuidados', 'Period of care'), placeholder: l('Ex.: de 1 a 12 de Outubro de 2026', 'E.g. 1–12 October 2026') },
    { name: 'destinatario', type: 'textarea', section: 'documento', rows: 2, label: l('Destinatário (opcional)', 'Addressee (optional)'), placeholder: l('Ex.: Exmo. Senhor Médico Assistente\nClínica Sorriso Saudável', 'E.g. the attending doctor') },
    { name: 'medicoAssistente', type: 'text', section: 'documento', width: 'half', label: l('Médico assistente (opcional)', 'Attending doctor (optional)') },
    ...patientFields(['nome', 'genero', 'dataNascimento', 'idade', 'processo', 'morada'], 'doente'),
    { name: 'diagnosticoMedico', type: 'text', section: 'doente', label: l('Diagnóstico médico (opcional)', 'Medical diagnosis (optional)') },
    { name: 'alergias', type: 'text', section: 'doente', width: 'half', label: l('Alergias', 'Allergies'), default: 'Sem alergias conhecidas' },
    { name: 'dispositivos', type: 'text', section: 'doente', width: 'half', label: l('Dispositivos (opcional)', 'Devices (optional)'), placeholder: l('Ex.: sonda vesical, cateter periférico', 'E.g. urinary catheter') },
    ...SECOES.map((s) => ({ name: s.name, type: 'textarea' as const, section: 'relatorio', rows: s.rows, required: s.required, label: l(s.titulo, s.en) })),
    {
      name: 'sinais',
      type: 'lines',
      section: 'sinais',
      label: l('Registos de sinais vitais', 'Vital-sign records'),
      addLabel: l('Adicionar registo', 'Add record'),
      columns: [
        { name: 'data', type: 'date', label: l('Data', 'Date') },
        { name: 'ta', type: 'text', label: l('TA', 'BP') },
        { name: 'fc', type: 'text', label: l('FC', 'HR') },
        { name: 'temp', type: 'text', label: l('Temp.', 'Temp.') },
        { name: 'outros', type: 'text', label: l('Outros (SpO2, glicemia, dor)', 'Other') },
      ],
      default: [],
    },
    ...profFields('profissional', { profissao: 'Enfermeira geral', profissaoF: 'Enfermeira geral', ordem: ORDEM_ENFERMEIROS, registoLabel: ['Ordem', 'Professional order'] }),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.profNome)) w.push({ level: 'error', field: 'profNome', message: l('Indique o enfermeiro que assina.', 'Enter the nurse who signs.') });
    if (!str(v.profNumero)) w.push({ level: 'warning', field: 'profNumero', message: l(`Indique a carteira profissional: os enfermeiros inscrevem-se na ${ORDEM_ENFERMEIROS}.`, 'Enter the nursing registration number.') });
    if (mentionsHiv(v.diagnosticoMedico, ...SECOES.map((s) => v[s.name])) && !str(v.destinatario).match(/m[ée]dic|cl[íi]nic|hospital|centro de sa[úu]de/i)) w.push(hivWarning('diagnosticoMedico'));
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const t = TIPO_OPTIONS.find((x) => x.value === v.tipo) ?? TIPO_OPTIONS[0];
    const age = patientAge(v);
    const dest = lines(v.destinatario);
    const blocks: Block[] = [CONFIDENCIAL, { type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) }];
    if (dest.length) blocks.push({ type: 'recipient', lines: dest });
    blocks.push({ type: 'title', text: 'Relatório de Enfermagem', subtitle: t.sub });
    const ident = [
      { label: 'Doente', value: str(v.doenteNome) || '____________________' },
      { label: 'Idade', value: age != null ? `${age} anos` : '______' },
    ];
    if (str(v.doenteProcesso)) ident.push({ label: 'Processo', value: str(v.doenteProcesso) });
    if (str(v.periodo)) ident.push({ label: 'Período', value: str(v.periodo) });
    if (str(v.diagnosticoMedico)) ident.push({ label: 'Diagnóstico médico', value: str(v.diagnosticoMedico) });
    if (str(v.medicoAssistente)) ident.push({ label: 'Médico assistente', value: str(v.medicoAssistente) });
    ident.push({ label: 'Alergias', value: str(v.alergias) || '______' });
    if (str(v.dispositivos)) ident.push({ label: 'Dispositivos', value: str(v.dispositivos) });
    blocks.push({ type: 'keyValue', items: ident, columns: 2 });
    let n = 0;
    for (const s of SECOES) {
      const text = str(v[s.name]);
      if (!text && !s.required) continue;
      n++;
      blocks.push({ type: 'heading', text: `${n}. ${s.titulo}` }, { type: 'paragraph', id: s.name, text: text || '____________________', en: `${s.en}: ${text}` });
      if (s.name === 'evolucao' || (s.name === 'intervencoes' && !str(v.evolucao))) {
        const sv = rows(v.sinais).filter((r) => str(r.data) || str(r.ta) || str(r.fc) || str(r.temp) || str(r.outros));
        if (sv.length) {
          blocks.push({
            type: 'table',
            columns: [{ label: 'Data', width: 16 }, { label: 'TA (mmHg)', width: 16, align: 'center' }, { label: 'FC (bpm)', width: 14, align: 'center' }, { label: 'Temp. (°C)', width: 14, align: 'center' }, { label: 'Outros', width: 40 }],
            rows: sv.map((r) => [str(r.data) ? formatDateShort(r.data) : ' ', cell(r.ta), cell(r.fc), cell(r.temp), cell(r.outros)]),
          });
        }
      }
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Fico à disposição para qualquer esclarecimento sobre os cuidados prestados.', en: 'I remain available for any clarification about the care given.', keepWithNext: true },
      { type: 'signatures', columns: [profSignature(ctx, 'O Enfermeiro', 'A Enfermeira')] },
      sigiloNote(),
    );
    return blocks;
  },
});
