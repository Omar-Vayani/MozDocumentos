import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, g, isF, l, localField, placeDate } from './_shared';
import {
  clinicianDesc, clinicianFields, clinicianSignature, clinicianWarnings, countText, hivWarning, mentionsHiv,
  patientFields, patientIdent, senhor,
} from './_saude';

const FINALIDADE_OPTIONS = [
  { value: 'trabalho', label: l('Justificar faltas ao trabalho (empresa)', 'Justify absence from work (company)') },
  { value: 'funcao-publica', label: l('Justificar faltas na função pública', 'Justify absence in the public service') },
  { value: 'escola', label: l('Justificar faltas à escola ou universidade', 'Justify absence from school or university') },
  { value: 'ferias', label: l('Doença durante as férias', 'Illness during annual leave') },
  { value: 'outro', label: l('Outro fim', 'Other purpose') },
];

const ACTIVIDADE: Record<string, { pt: string; en: string }> = {
  trabalho: { pt: 'exercer a sua actividade profissional', en: 'carry out their work' },
  'funcao-publica': { pt: 'exercer as suas funções', en: 'carry out their duties' },
  escola: { pt: 'frequentar as aulas e realizar provas', en: 'attend classes and sit examinations' },
  ferias: { pt: 'exercer a sua actividade profissional', en: 'carry out their work' },
};

const toEmployer = (v: Values) => v.finalidade === 'trabalho' || v.finalidade === 'funcao-publica' || v.finalidade === 'ferias';

function dias(v: Values): number | null {
  const d = diffDays(v.dataInicio, v.dataFim);
  return Number.isFinite(d) && d >= 0 ? d + 1 : null;
}

export default defineTemplate({
  id: 'atestado-medico-doenca',
  family: 'declaracao',
  page: 'A5',
  official: (v) => (v.finalidade === 'funcao-publica' ? 'estado' : undefined),
  sections: [
    { id: 'clinico', title: l('Profissional que atesta', 'Certifying professional') },
    { id: 'doente', title: l('Doente', 'Patient'), personRole: 'outro' },
    { id: 'periodo', title: l('Incapacidade', 'Incapacity') },
    { id: 'clinica', title: l('Informação clínica (opcional)', 'Clinical information (optional)') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...clinicianFields('clinico'),
    ...patientFields(['nome', 'genero', 'dataNascimento', 'idade', 'docTipo', 'docNumero'], 'doente'),
    {
      name: 'dataObservacao',
      type: 'date',
      section: 'periodo',
      width: 'half',
      required: true,
      label: l('Data da observação clínica', 'Date of the clinical examination'),
      default: (c) => c.today,
    },
    {
      name: 'finalidade',
      type: 'select',
      section: 'periodo',
      width: 'half',
      label: l('Para que serve', 'Purpose'),
      options: FINALIDADE_OPTIONS,
      default: 'trabalho',
    },
    {
      name: 'actividadeOutra',
      type: 'text',
      section: 'periodo',
      label: l('Impossibilitado(a) de…', 'Unable to…'),
      placeholder: l('Ex.: participar no estágio de formação', 'E.g. take part in the training course'),
      showIf: (v) => v.finalidade === 'outro',
    },
    { name: 'dataInicio', type: 'date', section: 'periodo', width: 'half', required: true, label: l('Incapacidade desde', 'Unable from'), default: (c) => c.today },
    { name: 'dataFim', type: 'date', section: 'periodo', width: 'half', required: true, label: l('Até (inclusive)', 'Until (inclusive)') },
    {
      name: 'repouso',
      type: 'toggle',
      section: 'periodo',
      label: l('Deve guardar repouso domiciliário', 'Must rest at home'),
      default: true,
    },
    {
      name: 'dataRetoma',
      type: 'date',
      section: 'periodo',
      width: 'half',
      label: l('Pode retomar a actividade em (opcional)', 'May resume on (optional)'),
    },
    {
      name: 'recomendacoes',
      type: 'textarea',
      section: 'periodo',
      rows: 2,
      label: l('Recomendações para o regresso (opcional)', 'Recommendations on return (optional)'),
      placeholder: l('Ex.: evitar esforços físicos durante uma semana', 'E.g. avoid physical effort for a week'),
      help: l('Só restrições funcionais, sem diagnóstico.', 'Functional restrictions only, no diagnosis.'),
    },
    {
      name: 'incluirDiagnostico',
      type: 'toggle',
      section: 'clinica',
      label: l('Indicar o diagnóstico (o doente autorizou expressamente)', 'State the diagnosis (the patient expressly agreed)'),
      help: l(
        'Por regra o atestado não indica a doença. Só active com autorização expressa do doente.',
        'As a rule the certificate does not name the illness. Turn on only with the patient’s express consent.',
      ),
    },
    {
      name: 'diagnostico',
      type: 'text',
      section: 'clinica',
      label: l('Diagnóstico', 'Diagnosis'),
      showIf: (v) => Boolean(v.incluirDiagnostico),
    },
    localField(),
    dateField(),
  ],

  computed: (v) => ({ dias: dias(v) }),

  warnings: (v, ctx) => {
    const w: Warning[] = [...clinicianWarnings(v)];
    const n = dias(v);
    if (v.dataInicio && v.dataFim && n == null) {
      w.push({ level: 'error', field: 'dataFim', message: l('A data final é anterior à data inicial.', 'The end date is before the start date.') });
    }
    if (!v.dataFim) w.push({ level: 'warning', field: 'dataFim', message: l('Indique até quando dura a incapacidade.', 'Enter when the incapacity ends.') });
    if (v.dataInicio && v.dataObservacao && diffDays(v.dataObservacao, v.dataInicio) < 0) {
      w.push({
        level: 'warning',
        field: 'dataInicio',
        message: l(
          'A incapacidade começa antes da observação clínica. Atestados com efeitos anteriores à observação só devem ser emitidos quando clinicamente fundamentados.',
          'The incapacity starts before the examination. Backdated certificates should only be issued when clinically justified.',
        ),
      });
    }
    const junta = ctx.legal.value<{ diasSeguidos: number }>('juntaDeSaude');
    if (n != null && toEmployer(v) && n > junta.diasSeguidos) {
      w.push({
        level: 'info',
        field: 'dataFim',
        message: l(
          `Com faltas por doença por mais de ${junta.diasSeguidos} dias seguidos, o empregador pode submeter o trabalhador à Junta de Saúde (${cite('juntaDeSaude')}).`,
          `After more than ${junta.diasSeguidos} consecutive days of sick absence the employer may refer the worker to the Medical Board (${cite('juntaDeSaude')}).`,
        ),
      });
    }
    if (v.finalidade === 'ferias') {
      w.push({
        level: 'info',
        message: l(
          `Para que os dias de doença não contem como férias, o trabalhador deve informar o empregador no prazo legal (${cite('doencaNasFerias')}).`,
          `For sick days not to count as leave, the worker must inform the employer within the legal period (${cite('doencaNasFerias')}).`,
        ),
      });
    }
    if (v.incluirDiagnostico && toEmployer(v)) {
      w.push({
        level: 'warning',
        field: 'incluirDiagnostico',
        message: l(
          `Ao empregador só se comunica a capacidade ou incapacidade para o trabalho (${cite('examesMedicosTrabalho')}). Indique o diagnóstico apenas com autorização expressa do doente.`,
          `The employer is told only whether the person is fit or unfit for work (${cite('examesMedicosTrabalho')}). State the diagnosis only with the patient’s express consent.`,
        ),
      });
    }
    if (v.incluirDiagnostico && mentionsHiv(v.diagnostico)) w.push(hivWarning('diagnostico', 'error'));
    if (mentionsHiv(v.recomendacoes)) w.push(hivWarning('recomendacoes', 'error'));
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fd = isF(v.doenteGenero);
    const fc = isF(v.clinicoGenero);
    const who = clinicianDesc(v);
    const pat = patientIdent(v);
    const n = ctx.computed.dias as number | null;
    const act =
      v.finalidade === 'outro'
        ? { pt: String(v.actividadeOutra || '').trim() || 'exercer a sua actividade', en: String(v.actividadeOutra || 'carry out their activity') }
        : ACTIVIDADE[String(v.finalidade ?? 'trabalho')] ?? ACTIVIDADE.trabalho;
    const periodo =
      v.dataInicio === v.dataFim && v.dataInicio
        ? `no dia **${dateLong(v.dataInicio)}**`
        : `no período de **${dateLong(v.dataInicio)} a ${dateLong(v.dataFim)}**${n != null ? `, num total de **${countText(n)} ${n === 1 ? 'dia' : 'dias'}**` : ''}`;
    const blocks: Block[] = [
      { type: 'title', text: 'Atestado Médico' },
      {
        type: 'paragraph',
        id: 'atesta',
        text: `${who.pt}, atesta, sob compromisso de honra profissional, que observou clinicamente, no dia ${dateLong(v.dataObservacao)}, ${senhor(v)} ${pat.pt}, e que ${g(v.doenteGenero, 'o mesmo', 'a mesma')} se encontra, por motivo de doença, **${fd ? 'impossibilitada' : 'impossibilitado'} de ${act.pt}** ${periodo}${v.repouso ? ', devendo guardar repouso domiciliário' : ''}.`,
        en: `${who.en} certifies on professional honour that on ${v.dataObservacao || '___'} ${fc ? 'she' : 'he'} examined ${pat.en}, who, owing to illness, is unable to ${act.en} from ${v.dataInicio || '___'} to ${v.dataFim || '___'}${n != null ? ` (${n} days)` : ''}${v.repouso ? ', and must rest at home' : ''}.`,
      },
    ];
    if (v.finalidade === 'ferias') {
      blocks.push({
        type: 'paragraph',
        id: 'ferias',
        text: `A doença declarou-se em ${dateLong(v.dataInicio)}, durante o período de férias ${g(v.doenteGenero, 'do doente', 'da doente')}.`,
        en: 'The illness began during the patient’s annual leave.',
      });
    }
    if (v.incluirDiagnostico && v.diagnostico) {
      blocks.push({
        type: 'paragraph',
        id: 'diagnostico',
        text: `Por autorização expressa ${g(v.doenteGenero, 'do doente', 'da doente')}, declara-se que a incapacidade resulta de: ${v.diagnostico}.`,
        en: `With the patient’s express consent, the incapacity results from: ${v.diagnostico}.`,
      });
    }
    if (v.dataRetoma || v.recomendacoes) {
      const retoma = v.dataRetoma ? `${g(v.doenteGenero, 'O doente', 'A doente')} pode retomar a sua actividade em ${dateLong(v.dataRetoma)}` : 'No regresso à actividade';
      const rec = String(v.recomendacoes ?? '').trim().replace(/[.;]+$/, '');
      blocks.push({
        type: 'paragraph',
        id: 'retoma',
        text: rec ? `${retoma}, com as seguintes recomendações: ${rec}.` : `${retoma}.`,
        en: v.dataRetoma ? `The patient may resume on ${v.dataRetoma}${rec ? `, with these recommendations: ${rec}` : ''}.` : `On return: ${rec}.`,
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: 'Por ser verdade e lhe ter sido solicitado, passa o presente atestado, que assina e autentica com o carimbo em uso.',
        en: 'Issued at the patient’s request, signed and stamped.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [clinicianSignature(ctx)] },
    );
    return blocks;
  },
});
