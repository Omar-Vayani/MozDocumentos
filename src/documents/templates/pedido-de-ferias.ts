import { addDays, addWorkingDays, diffDays, parseISODate, yearsBetween } from '@/lib/format';
import { defineTemplate, type Block, type DefaultsContext, type Warning } from '../model';
import {
  blank, cite, dateField, dateLong, exmo, g, GENERO_OPTIONS, isF, l, localField, workerFields, workerSignature,
} from './_shared';

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dateEn = (iso: unknown) => {
  const d = parseISODate(typeof iso === 'string' ? iso : '');
  return d ? `${d.getDate()} ${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}` : '____________';
};
const diasTxt = (n: number | null) => (n == null ? '____ dias' : `${n} ${n === 1 ? 'dia' : 'dias'}`);
const daysEn = (n: number | null) => (n == null ? '____ days' : `${n} ${n === 1 ? 'day' : 'days'}`);
const empresaDefault = (c: DefaultsContext) => (c.profile?.kind === 'empresa' ? c.profile.firma || c.profile.nomeComercial || '' : '');

type FeriasValue = { primeiroAno: number; anosSeguintes: number; blocoMinimo: number };

/** Public holidays (art. 105.º) between two ISO dates, inclusive. A holiday on a Sunday moves to the Monday. */
function feriadosNoPeriodo(ini: string, fim: string, mmdd: string[]): string[] {
  const a = parseISODate(ini);
  const b = parseISODate(fim);
  if (!a || !b) return [];
  const out: string[] = [];
  for (let y = a.getFullYear(); y <= b.getFullYear(); y++) {
    for (const md of mmdd) {
      let iso = `${y}-${md}`;
      if (parseISODate(iso)?.getDay() === 0) iso = addDays(iso, 1);
      if (diffDays(ini, iso) >= 0 && diffDays(iso, fim) >= 0) out.push(iso);
    }
  }
  return out.sort();
}

/** " (excluindo o feriado de 25 de Junho de 2026)" */
const exclFeriados = (f: string[]) =>
  f.length === 0 ? '' : ` (excluindo ${f.length === 1 ? 'o feriado de' : 'os feriados de'} ${f.map((d) => dateLong(d)).join(', ').replace(/, ([^,]*)$/, ' e $1')})`;

/** Next working day after `iso`, skipping weekends and public holidays. */
function diaUtilSeguinte(iso: string, mmdd: string[]): string {
  let r = addWorkingDays(iso, 1);
  for (let i = 0; i < 10 && feriadosNoPeriodo(r, r, mmdd).length; i++) r = addWorkingDays(r, 1);
  return r;
}

export default defineTemplate({
  id: 'pedido-de-ferias',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador (quem pede)', 'Employee (requester)'), personRole: 'trabalhador' },
    { id: 'empresa', title: l('Destinatário', 'Addressee') },
    { id: 'ferias', title: l('Férias pedidas', 'Leave requested') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data do pedido', 'Date of request')),
    ...workerFields(['nome', 'genero', 'cargo', 'departamento', 'dataAdmissao']).map((f) =>
      f.name === 'trabalhadorNome'
        ? { ...f, default: (c: DefaultsContext) => (c.profile?.kind === 'pessoa' ? c.profile.nome || '' : '') }
        : f.name === 'trabalhadorDataAdmissao'
          ? { ...f, help: l('Usada para verificar quantos dias de férias tem por ano.', 'Used to check your yearly leave entitlement.') }
          : f,
    ),
    {
      name: 'empresaNome',
      type: 'text',
      section: 'empresa',
      required: true,
      label: l('Empresa (entidade empregadora)', 'Employer'),
      default: empresaDefault,
    },
    {
      name: 'destinatarioCargo',
      type: 'text',
      section: 'empresa',
      width: 'half',
      label: l('Cargo do destinatário', "Addressee's position"),
      default: 'Director de Recursos Humanos',
    },
    {
      name: 'destinatarioGenero',
      type: 'radio',
      section: 'empresa',
      width: 'half',
      label: l('Tratamento do destinatário', 'Addressee form of address'),
      options: GENERO_OPTIONS,
      default: 'M',
    },
    { name: 'dataInicio', type: 'date', section: 'ferias', width: 'half', required: true, label: l('Primeiro dia de férias', 'First day of leave') },
    { name: 'dataFim', type: 'date', section: 'ferias', width: 'half', required: true, label: l('Último dia de férias', 'Last day of leave') },
    {
      name: 'diasGozados',
      type: 'number',
      section: 'ferias',
      width: 'half',
      min: 0,
      max: 60,
      label: l('Dias de férias já gozados este ano (opcional)', 'Leave days already taken this year (optional)'),
    },
    {
      name: 'substituto',
      type: 'text',
      section: 'ferias',
      label: l('Quem o substitui (opcional)', 'Who covers for you (optional)'),
      placeholder: l('Ex.: o colega Carlos Mabunda, Técnico de Contabilidade', 'E.g. colleague Carlos Mabunda, Accounting Technician'),
    },
    {
      name: 'contactoFerias',
      type: 'tel',
      section: 'ferias',
      width: 'half',
      label: l('Contacto durante as férias (opcional)', 'Contact during leave (optional)'),
    },
  ],

  computed: (v, { legal }) => {
    const fer = legal.value<FeriasValue>('feriasDireito');
    const ok = v.dataInicio && v.dataFim && Number.isFinite(diffDays(v.dataInicio, v.dataFim));
    const mmdd = legal.value<string[]>('feriadosNacionais');
    const feriados = ok ? feriadosNoPeriodo(v.dataInicio, v.dataFim, mmdd) : [];
    const corridos = ok ? diffDays(v.dataInicio, v.dataFim) + 1 : null;
    // Leave counts in calendar days, but public holidays in the period are not leave days (art. 111.º, n.º 1).
    const dias = corridos != null ? corridos - feriados.length : null;
    const anos = v.trabalhadorDataAdmissao && v.dataInicio ? yearsBetween(v.trabalhadorDataAdmissao, v.dataInicio) : null;
    return {
      dias,
      regresso: corridos != null && corridos > 0 ? diaUtilSeguinte(v.dataFim, mmdd) : '',
      feriados: corridos != null && corridos > 0 ? feriados : [],
      corridos,
      anosServico: anos,
      direito: anos == null ? null : anos < 1 ? fer.primeiroAno : fer.anosSeguintes,
      blocoMinimo: fer.blocoMinimo,
      gozados: Math.max(0, Number(v.diasGozados) || 0),
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (!v.dataInicio || !v.dataFim) {
      w.push({ level: 'warning', field: !v.dataInicio ? 'dataInicio' : 'dataFim', message: l('Indique o primeiro e o último dia de férias.', 'Enter the first and last day of leave.') });
    }
    if (c.corridos != null && c.corridos < 1) {
      w.push({ level: 'error', field: 'dataFim', message: l('O último dia é anterior ao primeiro.', 'The last day is before the first.') });
      return w;
    }
    if (c.dias != null && c.direito != null && c.dias + c.gozados > c.direito) {
      w.push({
        level: 'warning',
        field: 'dataFim',
        message: l(
          `Os dias pedidos${c.gozados ? `, somados aos ${c.gozados} já gozados,` : ''} excedem o direito anual de ${c.direito} dias (${cite('feriasDireito')}).`,
          `The days requested${c.gozados ? `, plus the ${c.gozados} already taken,` : ''} exceed the yearly entitlement of ${c.direito} days.`,
        ),
      });
    }
    if (c.dias != null && c.dias > 0 && c.dias < c.blocoMinimo) {
      w.push({
        level: 'warning',
        field: 'dataFim',
        message: l(
          `O período pedido é inferior ao bloco mínimo de ${c.blocoMinimo} dias seguidos previsto para o gozo de férias (${cite('feriasDireito')}).`,
          `The period requested is shorter than the minimum block of ${c.blocoMinimo} consecutive days.`,
        ),
      });
    }
    if (!v.trabalhadorDataAdmissao) {
      w.push({
        level: 'info',
        field: 'trabalhadorDataAdmissao',
        message: l('Indique a data de admissão para verificar o número de dias de férias a que tem direito.', 'Enter the start date to check the leave entitlement.'),
      });
    }
    if (v.dataInicio && v.data && diffDays(v.data, v.dataInicio) < 0) {
      w.push({ level: 'info', field: 'dataInicio', message: l('O início das férias é anterior à data do pedido.', 'Leave starts before the date of the request.') });
    }
    if (!v.empresaNome) {
      w.push({ level: 'warning', field: 'empresaNome', message: l('Indique o nome da empresa.', 'Enter the employer name.') });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const { values: v, computed: c } = ctx;
    const ge = v.trabalhadorGenero;
    const f = isF(ge);
    const dg = v.destinatarioGenero;
    const funcao = v.trabalhadorCargo
      ? `, com a função de ${v.trabalhadorCargo}${v.trabalhadorDepartamento ? ` (${v.trabalhadorDepartamento})` : ''}`
      : v.trabalhadorDepartamento
        ? `, colocad${f ? 'a' : 'o'} em ${v.trabalhadorDepartamento}`
        : '';
    const dias: number | null = c.dias != null && c.dias > 0 ? c.dias : null;

    const blocks: Block[] = [
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: exmo(dg),
        lines: [v.destinatarioCargo || g(dg, 'Director de Recursos Humanos', 'Directora de Recursos Humanos'), v.empresaNome || ''],
      },
      { type: 'subject', text: 'Pedido de férias' },
      { type: 'salutation', text: `${exmo(dg)},` },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Eu, **${blank(v.trabalhadorNome)}**, ${g(ge, 'trabalhador', 'trabalhadora')} desta empresa${funcao}, venho requerer a V. Ex.ª autorização para gozar **${diasTxt(dias)}** de férias, no período de **${dateLong(v.dataInicio)}** a **${dateLong(v.dataFim)}**${exclFeriados(c.feriados)}, retomando o serviço no dia ${c.regresso ? dateLong(c.regresso) : dateLong('')}.`,
        en: `I, ${blank(v.trabalhadorNome)}, an employee of this company${v.trabalhadorCargo ? ` (${v.trabalhadorCargo})` : ''}, request authorisation to take ${daysEn(dias)} of annual leave from ${dateEn(v.dataInicio)} to ${dateEn(v.dataFim)}, returning to work on ${dateEn(c.regresso)}.`,
      },
    ];
    if (c.gozados > 0) {
      blocks.push({
        type: 'paragraph',
        id: 'gozados',
        text: `Informo que, no corrente ano, já gozei ${diasTxt(c.gozados)} de férias.`,
        en: `I have already taken ${daysEn(c.gozados)} of leave this year.`,
      });
    }
    if (v.substituto) {
      blocks.push({
        type: 'paragraph',
        id: 'substituto',
        text: `Proponho que, durante a minha ausência, as minhas funções sejam asseguradas por ${String(v.substituto).trim().replace(/\.$/, '')}.`,
        en: `I propose that ${String(v.substituto).trim().replace(/\.$/, '')} covers my duties during my absence.`,
      });
    }
    if (v.contactoFerias) {
      blocks.push({
        type: 'paragraph',
        id: 'contacto',
        text: `Durante o período de férias poderei ser ${g(ge, 'contactado', 'contactada')} através do número ${v.contactoFerias}.`,
        en: `During my leave I can be reached on ${v.contactoFerias}.`,
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [{ ...workerSignature(v), detail: v.trabalhadorCargo || undefined }] },
      { type: 'spacer', size: 'small' },
      { type: 'heading', text: 'Despacho', keepWithNext: true },
      {
        type: 'checklist',
        keepWithNext: true,
        items: [
          { label: 'Autorizado', checked: false },
          { label: 'Autorizado no período de ___/___/______ a ___/___/______', checked: false },
          { label: 'Não autorizado', checked: false },
        ],
      },
      { type: 'note', text: 'Observações: ____________________________________________________________________________', keepWithNext: true },
      { type: 'signatures', columns: [{ role: 'A Chefia', detail: 'Data: ___/___/______' }] },
    );
    return blocks;
  },
});

