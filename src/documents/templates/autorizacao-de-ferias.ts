import { addWorkingDays, diffDays, parseISODate, yearsBetween } from '@/lib/format';
import { defineTemplate, type Block, type SignatureColumn, type TemplateContext, type Warning } from '../model';
import {
  BLANK, cite, dateField, dateLong, employerSignature, exmo, g, l, localField, refField, workerFields,
} from './_shared';

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dateEn = (iso: unknown) => {
  const d = parseISODate(typeof iso === 'string' ? iso : '');
  return d ? `${d.getDate()} ${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}` : '____________';
};
const diasTxt = (n: number | null) => (n == null ? '____ dias' : `${n} ${n === 1 ? 'dia' : 'dias'}`);
const daysEn = (n: number | null) => (n == null ? '____ days' : `${n} ${n === 1 ? 'day' : 'days'}`);
const clean = (s: unknown) => String(s ?? '').trim().replace(/[.;]+$/, '');

type FeriasValue = { primeiroAno: number; anosSeguintes: number; blocoMinimo: number };

/** Employer signature; an individual employer signs in their own name. */
function signer(ctx: TemplateContext): SignatureColumn {
  const s = employerSignature(ctx);
  return ctx.profile?.kind === 'pessoa' && !s.name ? { ...s, name: ctx.profile.nome || undefined } : s;
}

export default defineTemplate({
  id: 'autorizacao-de-ferias',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'ferias', title: l('Férias autorizadas', 'Approved leave') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    refField(),
    localField(),
    dateField(),
    ...workerFields(['nome', 'genero', 'cargo', 'departamento', 'dataAdmissao']),
    {
      name: 'dataPedido',
      type: 'date',
      section: 'ferias',
      width: 'half',
      label: l('Data do pedido do trabalhador (opcional)', "Date of the employee's request (optional)"),
    },
    { name: 'dataInicio', type: 'date', section: 'ferias', width: 'half', required: true, label: l('Primeiro dia de férias', 'First day of leave') },
    { name: 'dataFim', type: 'date', section: 'ferias', width: 'half', required: true, label: l('Último dia de férias', 'Last day of leave') },
    {
      name: 'dataRegresso',
      type: 'date',
      section: 'ferias',
      width: 'half',
      label: l('Data de regresso', 'Return date'),
      help: l(
        'Por defeito, o dia útil seguinte ao último dia de férias (feriados não são considerados). Altere se necessário.',
        'Defaults to the working day after the last day of leave (public holidays are not considered). Change if needed.',
      ),
    },
    {
      name: 'diasGozados',
      type: 'number',
      section: 'ferias',
      width: 'half',
      min: 0,
      max: 60,
      label: l('Dias já gozados este ano (opcional)', 'Days already taken this year (optional)'),
    },
    {
      name: 'indicarSaldo',
      type: 'toggle',
      section: 'opcoes',
      label: l('Indicar os dias de férias que ficam por gozar', 'State the remaining leave days'),
      help: l('Calculado a partir da data de admissão e dos dias já gozados.', 'Computed from the start date and days already taken.'),
    },
    {
      name: 'substituto',
      type: 'text',
      section: 'opcoes',
      label: l('Substituto durante as férias (opcional)', 'Cover during leave (optional)'),
      placeholder: l('Ex.: o Sr. Carlos Mabunda, Técnico de Contabilidade', 'E.g. Mr Carlos Mabunda, Accounting Technician'),
    },
    {
      name: 'passagemServico',
      type: 'toggle',
      section: 'opcoes',
      default: true,
      label: l('Pedir a passagem dos assuntos pendentes antes das férias', 'Ask for a handover before the leave'),
    },
  ],

  computed: (v, { legal }) => {
    const fer = legal.value<FeriasValue>('feriasDireito');
    const ok = v.dataInicio && v.dataFim && Number.isFinite(diffDays(v.dataInicio, v.dataFim));
    const dias = ok ? diffDays(v.dataInicio, v.dataFim) + 1 : null;
    const regressoCalc = dias != null && dias > 0 ? addWorkingDays(v.dataFim, 1) : '';
    const anos = v.trabalhadorDataAdmissao && v.dataInicio ? yearsBetween(v.trabalhadorDataAdmissao, v.dataInicio) : null;
    const direito = anos == null ? null : anos < 1 ? fer.primeiroAno : fer.anosSeguintes;
    const gozados = Math.max(0, Number(v.diasGozados) || 0);
    return {
      dias,
      regressoCalc,
      regresso: v.dataRegresso || regressoCalc,
      direito,
      gozados,
      saldo: direito != null && dias != null && dias > 0 ? direito - gozados - dias : null,
      blocoMinimo: fer.blocoMinimo,
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (!v.dataInicio || !v.dataFim) {
      w.push({ level: 'warning', field: !v.dataInicio ? 'dataInicio' : 'dataFim', message: l('Indique o primeiro e o último dia de férias.', 'Enter the first and last day of leave.') });
    }
    if (c.dias != null && c.dias < 1) {
      w.push({ level: 'error', field: 'dataFim', message: l('O último dia é anterior ao primeiro.', 'The last day is before the first.') });
      return w;
    }
    if (v.dataRegresso && v.dataFim && diffDays(v.dataFim, v.dataRegresso) < 1) {
      w.push({ level: 'error', field: 'dataRegresso', message: l('A data de regresso deve ser posterior ao último dia de férias.', 'The return date must be after the last day of leave.') });
    }
    if (c.saldo != null && c.saldo < 0) {
      w.push({
        level: 'warning',
        field: 'dataFim',
        message: l(
          `O período autorizado${c.gozados ? `, somado aos ${c.gozados} dias já gozados,` : ''} excede o direito anual de ${c.direito} dias (${cite('feriasDireito')}).`,
          `The approved period${c.gozados ? `, plus the ${c.gozados} days already taken,` : ''} exceeds the yearly entitlement of ${c.direito} days.`,
        ),
      });
    }
    if (c.dias != null && c.dias > 0 && c.dias < c.blocoMinimo) {
      w.push({
        level: 'warning',
        field: 'dataFim',
        message: l(
          `O período é inferior ao bloco mínimo de ${c.blocoMinimo} dias seguidos previsto para o gozo de férias (${cite('feriasDireito')}).`,
          `The period is shorter than the minimum block of ${c.blocoMinimo} consecutive days.`,
        ),
      });
    }
    if (!v.trabalhadorDataAdmissao) {
      w.push({
        level: v.indicarSaldo ? 'warning' : 'info',
        field: 'trabalhadorDataAdmissao',
        message: l('Indique a data de admissão para verificar o direito a férias.', 'Enter the start date to check the leave entitlement.'),
      });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const { values: v, computed: c } = ctx;
    const ge = v.trabalhadorGenero;
    const dias: number | null = c.dias != null && c.dias > 0 ? c.dias : null;
    const sub = clean(v.substituto);

    const blocks: Block[] = [
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: exmo(ge),
        lines: [v.trabalhadorNome || BLANK, [v.trabalhadorCargo, v.trabalhadorDepartamento].filter(Boolean).join(' — ')],
      },
      { type: 'subject', text: 'Autorização de férias' },
      { type: 'salutation', text: `${exmo(ge)},` },
      {
        type: 'paragraph',
        id: 'autorizacao',
        text: `${v.dataPedido ? `Em resposta ao pedido apresentado por V. Ex.ª em ${dateLong(v.dataPedido)}, comunicamos` : 'Comunicamos'} que foi autorizado o gozo de **${diasTxt(dias)}** de férias, no período de **${dateLong(v.dataInicio)}** a **${dateLong(v.dataFim)}**, inclusive.`,
        en: `${v.dataPedido ? `In reply to your request of ${dateEn(v.dataPedido)}, we` : 'We'} confirm that ${daysEn(dias)} of annual leave have been approved, from ${dateEn(v.dataInicio)} to ${dateEn(v.dataFim)} inclusive.`,
      },
      {
        type: 'paragraph',
        id: 'regresso',
        text: `V. Ex.ª deverá retomar o serviço no dia **${dateLong(c.regresso)}**, à hora normal de início do trabalho.`,
        en: `You are to return to work on ${dateEn(c.regresso)} at the normal starting time.`,
      },
      {
        type: 'paragraph',
        id: 'remuneracao',
        text: 'Durante o período de férias, V. Ex.ª mantém o direito à remuneração que receberia se estivesse em serviço efectivo.',
        en: 'During the leave you keep the right to the pay you would receive if you were at work.',
      },
    ];
    if (v.indicarSaldo && c.saldo != null && c.saldo >= 0) {
      blocks.push({
        type: 'paragraph',
        id: 'saldo',
        text: `Após o gozo deste período, ficam por gozar ${diasTxt(c.saldo)} de férias no corrente ano.`,
        en: `After this period, ${daysEn(c.saldo)} of leave remain for the current year.`,
      });
    }
    if (sub) {
      blocks.push({
        type: 'paragraph',
        id: 'substituto',
        text: `Durante a ausência de V. Ex.ª, as suas funções serão asseguradas por ${sub}.`,
        en: `During your absence your duties will be covered by ${sub}.`,
      });
    }
    if (v.passagemServico) {
      blocks.push({
        type: 'paragraph',
        id: 'passagem',
        text: `Antes do início das férias, V. Ex.ª deverá entregar os assuntos pendentes ${sub ? g(ge, 'a quem o substitui', 'a quem a substitui') : 'à chefia directa'}, de forma a assegurar a continuidade do serviço.`,
        en: `Before the leave starts, please hand over pending matters to ${sub ? 'the person covering for you' : 'your line manager'} to ensure continuity.`,
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [signer(ctx)] },
      {
        type: 'acknowledgement',
        text: 'Tomei conhecimento e recebi o original em ___/___/______.',
        signer: g(ge, 'O Trabalhador', 'A Trabalhadora'),
      },
    );
    return blocks;
  },
});

