// Atestado médico de gravidez: proves the pregnancy and the expected date of
// delivery (DPP). The worker uses it to inform the employer in writing, which
// triggers the maternity protection of the Labour Law, and to plan the
// maternity leave, which may start before the DPP. Also used for school and air
// travel. Never states anything else about the patient's health.

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, l, localField, placeDate } from './_shared';
import { clinicianDesc, clinicianFields, clinicianSignature, clinicianWarnings, countText, hivWarning, mentionsHiv, patientFields, patientIdent } from './_saude';
import { semPonto, str } from './_saude-educacao';

const FINALIDADE_OPTIONS = [
  { value: 'trabalho', label: l('Entidade empregadora (protecção e licença de maternidade)', 'Employer (maternity protection and leave)') },
  { value: 'escola', label: l('Escola ou universidade', 'School or university') },
  { value: 'viagem', label: l('Viagem aérea (companhia aérea)', 'Air travel (airline)') },
  { value: 'outro', label: l('Para os devidos efeitos', 'For all due purposes') },
];

const METODO_OPTIONS = [
  { value: 'ecografia', label: l('Ecografia', 'Ultrasound') },
  { value: 'dum', label: l('Data da última menstruação', 'Last menstrual period') },
  { value: 'clinico', label: l('Exame clínico', 'Clinical examination') },
];
const METODO_TXT: Record<string, string> = { ecografia: 'por ecografia', dum: 'pela data da última menstruação', clinico: 'por exame clínico' };

const dpp = (v: Values) => str(v.dataProvavelParto);

export default defineTemplate({
  id: 'atestado-de-gravidez',
  family: 'declaracao',
  page: 'A5',
  sections: [
    { id: 'clinico', title: l('Profissional que atesta', 'Certifying professional') },
    { id: 'doente', title: l('Grávida', 'Pregnant patient'), personRole: 'outro' },
    { id: 'gravidez', title: l('Gravidez', 'Pregnancy') },
    { id: 'recomendacoes', title: l('Recomendações (opcional)', 'Recommendations (optional)') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...clinicianFields('clinico'),
    ...patientFields(['nome', 'dataNascimento', 'idade', 'docTipo', 'docNumero'], 'doente'),
    { name: 'dataObservacao', type: 'date', section: 'gravidez', width: 'half', required: true, label: l('Data da observação', 'Examination date'), default: (c) => c.today },
    { name: 'semanas', type: 'number', section: 'gravidez', width: 'half', min: 1, max: 44, label: l('Idade gestacional (semanas)', 'Gestational age (weeks)') },
    { name: 'metodo', type: 'select', section: 'gravidez', width: 'half', label: l('Determinada por', 'Determined by'), options: METODO_OPTIONS, default: 'ecografia' },
    {
      name: 'dataProvavelParto',
      type: 'date',
      section: 'gravidez',
      width: 'half',
      required: true,
      label: l('Data provável do parto', 'Expected date of delivery'),
      legal: l('A licença de maternidade conta-se a partir desta data.', 'Maternity leave is planned from this date.'),
    },
    { name: 'gemelar', type: 'toggle', section: 'gravidez', label: l('Gravidez gemelar', 'Twin pregnancy') },
    { name: 'finalidade', type: 'select', section: 'gravidez', label: l('Destina-se a', 'For'), options: FINALIDADE_OPTIONS, default: 'trabalho' },
    {
      name: 'restricoes',
      type: 'textarea',
      section: 'recomendacoes',
      rows: 2,
      label: l('Trabalhos ou actividades desaconselhados (opcional)', 'Work or activities to avoid (optional)'),
      placeholder: l('Ex.: levantamento de cargas, trabalho nocturno, exposição a produtos químicos', 'E.g. lifting loads, night work, exposure to chemicals'),
      help: l('Só restrições, sem diagnóstico. A trabalhadora não perde a remuneração por deixar de os fazer.', 'Restrictions only, no diagnosis. The worker keeps her pay.'),
    },
    {
      name: 'dispensa',
      type: 'toggle',
      section: 'recomendacoes',
      label: l('Prescrever dispensa do trabalho por risco clínico', 'Prescribe time off for clinical risk'),
      help: l('A grávida tem direito a dispensa, por prescrição médica, pelo tempo necessário para prevenir o risco, além da licença de maternidade.', 'Pregnant workers are entitled to time off on prescription, besides maternity leave.'),
      showIf: (v) => v.finalidade === 'trabalho',
    },
    { name: 'dispensaInicio', type: 'date', section: 'recomendacoes', width: 'half', label: l('Dispensa desde', 'Time off from'), showIf: (v) => v.finalidade === 'trabalho' && Boolean(v.dispensa) },
    { name: 'dispensaFim', type: 'date', section: 'recomendacoes', width: 'half', label: l('Até', 'Until'), showIf: (v) => v.finalidade === 'trabalho' && Boolean(v.dispensa) },
    {
      name: 'aptaViagem',
      type: 'toggle',
      section: 'recomendacoes',
      default: true,
      label: l('Sem contra-indicação para viajar de avião', 'Fit to fly'),
      showIf: (v) => v.finalidade === 'viagem',
    },
    { name: 'viagemAte', type: 'date', section: 'recomendacoes', width: 'half', label: l('Viagem prevista até', 'Travel up to'), showIf: (v) => v.finalidade === 'viagem' && Boolean(v.aptaViagem) },
    localField(),
    dateField(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...clinicianWarnings({ ...v, doenteGenero: 'F' })];
    if (!dpp(v)) w.push({ level: 'error', field: 'dataProvavelParto', message: l('Indique a data provável do parto.', 'Enter the expected date of delivery.') });
    if (dpp(v) && str(v.dataObservacao) && diffDays(v.dataObservacao, dpp(v)) < 0) {
      w.push({ level: 'error', field: 'dataProvavelParto', message: l('A data provável do parto é anterior à observação.', 'The expected delivery date is before the examination.') });
    }
    const sem = Number(v.semanas);
    if (str(v.semanas) && Number.isFinite(sem) && sem > 42) w.push({ level: 'warning', field: 'semanas', message: l('Confirme a idade gestacional.', 'Check the gestational age.') });
    if (v.finalidade === 'trabalho') {
      const lic = ctx.legal.value<{ dias: number; antesParto: number }>('licencaMaternidade');
      w.push({
        level: 'info',
        message: l(
          `A trabalhadora deve entregar este atestado ao empregador, por escrito: os direitos de protecção da maternidade dependem dessa comunicação (${cite('protecaoMaternidade')}). A licença de maternidade é de ${lic.dias} dias e pode começar ${lic.antesParto} dias antes da data provável do parto (${cite('licencaMaternidade')}).`,
          `The worker must hand this certificate to the employer in writing: maternity protection depends on it (${cite('protecaoMaternidade')}). Maternity leave is ${lic.dias} days and may start ${lic.antesParto} days before the expected date (${cite('licencaMaternidade')}).`,
        ),
      });
      if (v.dispensa && (!str(v.dispensaInicio) || !str(v.dispensaFim))) {
        w.push({ level: 'warning', field: 'dispensaFim', message: l('Indique o período da dispensa.', 'Enter the time-off period.') });
      }
    }
    if (mentionsHiv(v.restricoes)) w.push(hivWarning('restricoes', 'error'));
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v: Values = { ...ctx.values, doenteGenero: 'F' };
    const who = clinicianDesc(v);
    const pat = patientIdent(v);
    const sem = Number(v.semanas);
    const idade = str(v.semanas) && Number.isFinite(sem) && sem > 0
      ? `, com a idade gestacional de **${countText(sem, true)} ${sem === 1 ? 'semana' : 'semanas'}** à data da observação, determinada ${METODO_TXT[str(v.metodo)] ?? 'por ecografia'}`
      : '';
    const blocks: Block[] = [
      { type: 'title', text: 'Atestado Médico de Gravidez' },
      {
        type: 'paragraph',
        id: 'atesta',
        text: `${who.pt}, atesta, sob compromisso de honra profissional, que observou clinicamente, no dia ${dateLong(v.dataObservacao)}, a Senhora ${pat.pt}, e que a mesma se encontra **grávida**${v.gemelar ? ' (gravidez gemelar)' : ''}${idade}, sendo a **data provável do parto ${dateLong(v.dataProvavelParto)}**.`,
        en: `${who.en} certifies that on ${v.dataObservacao || '___'} she/he examined ${pat.en}, who is pregnant${v.gemelar ? ' (twins)' : ''}${str(v.semanas) ? ` at ${v.semanas} weeks` : ''}, expected delivery date ${v.dataProvavelParto || '___'}.`,
      },
    ];
    const fin = str(v.finalidade);
    if (fin === 'trabalho') {
      blocks.push({
        type: 'paragraph',
        id: 'trabalho',
        text: 'O presente atestado destina-se a comprovar o estado de gravidez junto da entidade empregadora, para efeitos de protecção da maternidade e de marcação da licença de maternidade.',
        en: 'For the employer, for maternity protection and planning maternity leave.',
      });
    } else if (fin === 'escola') {
      blocks.push({ type: 'paragraph', id: 'escola', text: 'O presente atestado destina-se a ser apresentado no estabelecimento de ensino que a interessada frequenta.', en: 'For the school or university the patient attends.' });
    }
    const rest = semPonto(v.restricoes);
    if (rest) {
      blocks.push({
        type: 'paragraph',
        id: 'restricoes',
        text: `Do ponto de vista clínico, desaconselham-se durante a gravidez: ${rest}.`,
        en: `Clinically, the following should be avoided during pregnancy: ${rest}.`,
      });
    }
    if (fin === 'trabalho' && v.dispensa) {
      blocks.push({
        type: 'paragraph',
        id: 'dispensa',
        text: `Por prescrição médica, e para prevenção de risco clínico, a trabalhadora deve ser dispensada do trabalho de ${dateLong(v.dispensaInicio)} a ${dateLong(v.dispensaFim)}, sem prejuízo da licença de maternidade.`,
        en: `On medical prescription, to prevent clinical risk, the worker should be released from work from ${v.dispensaInicio || '___'} to ${v.dispensaFim || '___'}, besides maternity leave.`,
      });
    }
    if (fin === 'viagem') {
      blocks.push({
        type: 'paragraph',
        id: 'viagem',
        text: v.aptaViagem
          ? `À data da observação não existe contra-indicação clínica para viagem aérea${str(v.viagemAte) ? ` até ${dateLong(v.viagemAte)}` : ''}.`
          : 'À data da observação, desaconselha-se a viagem aérea.',
        en: v.aptaViagem ? `No clinical contraindication to air travel${str(v.viagemAte) ? ` until ${v.viagemAte}` : ''}.` : 'Air travel is not advised.',
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
