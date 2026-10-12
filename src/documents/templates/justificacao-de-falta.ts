import type { LegalRefId } from '@/legal/mz-legal';
import { diffDays, parseISODate } from '@/lib/format';
import { defineTemplate, type Block, type DefaultsContext, type Values, type Warning } from '../model';
import {
  BLANK, blank, cite, dateField, dateLong, exmo, g, GENERO_OPTIONS, l, lineItems, localField, splitLines, workerFields,
  workerSignature,
} from './_shared';

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dateEn = (iso: unknown) => {
  const d = parseISODate(typeof iso === 'string' ? iso : '');
  return d ? `${d.getDate()} ${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}` : '____________';
};
const diasTxt = (n: number) => `${n} ${n === 1 ? 'dia' : 'dias'}`;
const inline = (t: unknown) => splitLines(t).map((s) => s.replace(/[.;]+$/, '')).join('; ');
const empresaDefault = (c: DefaultsContext) => (c.profile?.kind === 'empresa' ? c.profile.firma || c.profile.nomeComercial || '' : '');
/** "nos termos do art. X…" / "dos arts. …" / "da Lei …" */
const nosTermos = (id: LegalRefId) => {
  const c = cite(id);
  return `nos termos ${c.startsWith('arts.') ? 'dos' : c.startsWith('art.') ? 'do' : 'da'} ${c}`;
};

type Faltas = { casamento: number; falecimentoProximo: number; falecimentoOutro: number };

const MOTIVOS = [
  { value: 'doenca', label: l('Doença', 'Illness') },
  { value: 'acidente', label: l('Acidente', 'Accident') },
  { value: 'casamento', label: l('Casamento', 'Marriage') },
  {
    value: 'falecimentoProximo',
    label: l(
      'Falecimento de familiar próximo (cônjuge, pais, filhos, irmãos, avós, netos, sogros, genros, noras)',
      'Death of a close relative (spouse, parents, children, siblings, grandparents, grandchildren, in-laws)',
    ),
  },
  {
    value: 'falecimentoOutro',
    label: l('Falecimento de outro familiar (tios, primos, sobrinhos, cunhados)', 'Death of another relative (uncles, cousins, nephews, siblings-in-law)'),
  },
  { value: 'assistencia', label: l('Assistência inadiável a familiar', 'Urgent care of a family member') },
  { value: 'consulta', label: l('Consulta médica ou exame', 'Medical appointment or test') },
  { value: 'outro', label: l('Outro motivo', 'Other reason') },
];

const isFalecimento = (v: Values) => v.motivo === 'falecimentoProximo' || v.motivo === 'falecimentoOutro';
/** Absences the worker can foresee and must announce in advance. */
const isPrevisivel = (v: Values) => v.motivo === 'casamento' || v.motivo === 'consulta';
/** Reasons expressly listed as justified absences in the Labour Law. */
const isLegal = (v: Values) => ['doenca', 'acidente', 'casamento', 'falecimentoProximo', 'falecimentoOutro', 'assistencia'].includes(v.motivo);

function motivoTexto(v: Values): { pt: string; en: string } {
  switch (v.motivo) {
    case 'doenca':
      return { pt: 'por motivo de doença', en: 'due to illness' };
    case 'acidente':
      return { pt: 'por motivo de acidente', en: 'due to an accident' };
    case 'casamento':
      return { pt: 'por motivo do meu casamento', en: 'due to my marriage' };
    case 'falecimentoProximo':
    case 'falecimentoOutro': {
      const nome = String(v.familiarNome ?? '').trim();
      const par = String(v.parentesco ?? '').trim();
      return {
        pt: `por motivo do falecimento de ${nome ? `**${nome}**` : 'familiar'}${par ? ` (${par})` : ''}`,
        en: `due to the death of ${nome || 'a relative'}${par ? ` (${par})` : ''}`,
      };
    }
    case 'assistencia':
      return { pt: 'por necessidade de prestar assistência inadiável a membro do meu agregado familiar', en: 'to provide urgent care to a member of my household' };
    case 'consulta':
      return { pt: 'por motivo de consulta médica', en: 'due to a medical appointment' };
    default: {
      const d = inline(v.descricao);
      return { pt: `pelo seguinte motivo: ${d || BLANK}`, en: `for the following reason: ${d || '____'}` };
    }
  }
}

export default defineTemplate({
  id: 'justificacao-de-falta',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador (quem justifica)', 'Employee'), personRole: 'trabalhador' },
    { id: 'empresa', title: l('Destinatário', 'Addressee') },
    { id: 'falta', title: l('Falta', 'Absence') },
  ],
  fields: [
    localField(),
    dateField(),
    ...workerFields(['nome', 'genero', 'cargo', 'departamento']).map((f) =>
      f.name === 'trabalhadorNome' ? { ...f, default: (c: DefaultsContext) => (c.profile?.kind === 'pessoa' ? c.profile.nome || '' : '') } : f,
    ),
    { name: 'empresaNome', type: 'text', section: 'empresa', required: true, label: l('Empresa (entidade empregadora)', 'Employer'), default: empresaDefault },
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
    { name: 'dataInicio', type: 'date', section: 'falta', width: 'half', required: true, label: l('Dia da falta (ou primeiro dia)', 'Day of absence (or first day)') },
    {
      name: 'dataFim',
      type: 'date',
      section: 'falta',
      width: 'half',
      label: l('Último dia (se faltou mais de um dia)', 'Last day (if more than one day)'),
    },
    { name: 'motivo', type: 'select', section: 'falta', required: true, label: l('Motivo', 'Reason'), options: MOTIVOS, default: 'doenca' },
    {
      name: 'familiarNome',
      type: 'text',
      section: 'falta',
      width: 'half',
      label: l('Nome do familiar falecido', 'Name of the deceased'),
      showIf: isFalecimento,
    },
    {
      name: 'parentesco',
      type: 'text',
      section: 'falta',
      width: 'half',
      label: l('Parentesco', 'Relationship'),
      placeholder: l('Ex.: pai, sogra, tio', 'E.g. father, mother-in-law, uncle'),
      showIf: isFalecimento,
    },
    {
      name: 'descricao',
      type: 'textarea',
      section: 'falta',
      rows: 3,
      label: l('Descrição', 'Description'),
      help: l('Obrigatória para "Outro motivo". Nos restantes casos, acrescente pormenores se for útil.', 'Required for "Other reason". Otherwise add details if useful.'),
    },
    {
      name: 'dataComunicacao',
      type: 'date',
      section: 'falta',
      width: 'half',
      label: l('Data em que avisou a empresa (opcional)', 'Date you notified the employer (optional)'),
    },
    {
      name: 'anexos',
      type: 'lines',
      section: 'falta',
      label: l('Documentos anexos', 'Attached documents'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document'), placeholder: l('Ex.: Atestado médico', 'E.g. Medical certificate') }],
      default: [],
    },
  ],

  computed: (v, { legal }) => {
    const fj = legal.value<Faltas>('faltasJustificadas');
    const ini = v.dataInicio || '';
    const fim = v.dataFim && v.dataFim !== v.dataInicio ? v.dataFim : '';
    const span = ini && fim ? diffDays(ini, fim) : 0;
    const dias = ini ? (Number.isFinite(span) ? span + 1 : 1) : null;
    const limite =
      v.motivo === 'casamento' ? fj.casamento
      : v.motivo === 'falecimentoProximo' ? fj.falecimentoProximo
      : v.motivo === 'falecimentoOutro' ? fj.falecimentoOutro
      : null;
    return {
      dias,
      multi: Boolean(fim) && dias != null && dias > 1,
      limite,
      antecedencia: legal.value<{ antecedenciaDias: number }>('faltasComunicacao').antecedenciaDias,
      anexos: lineItems(v.anexos).map((r) => String(r.descricao ?? '').trim()).filter(Boolean),
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (!v.dataInicio) {
      w.push({ level: 'warning', field: 'dataInicio', message: l('Indique o dia da falta.', 'Enter the day of the absence.') });
    }
    if (c.dias != null && c.dias < 1) {
      w.push({ level: 'error', field: 'dataFim', message: l('O último dia é anterior ao primeiro.', 'The last day is before the first.') });
    }
    if (c.limite != null && c.dias != null && c.dias > c.limite) {
      w.push({
        level: 'warning',
        field: 'dataFim',
        message: l(
          `A lei considera justificadas até ${c.limite} dias de falta por este motivo (${cite('faltasJustificadas')}). Os dias a mais podem ser considerados injustificados.`,
          `The law treats up to ${c.limite} days as justified for this reason. Extra days may be treated as unjustified.`,
        ),
      });
    }
    if ((v.motivo === 'doenca' || v.motivo === 'acidente') && c.anexos.length === 0) {
      w.push({ level: 'warning', field: 'anexos', message: l('Junte o atestado médico ou outro comprovativo.', 'Attach the medical certificate or other proof.') });
    }
    if (v.motivo === 'consulta' && c.anexos.length === 0) {
      w.push({ level: 'info', field: 'anexos', message: l('Junte a declaração de presença passada pela unidade sanitária.', 'Attach the attendance note from the clinic.') });
    }
    if (isFalecimento(v) && !v.parentesco) {
      w.push({ level: 'info', field: 'parentesco', message: l('Indique o grau de parentesco: dele depende o número de dias justificados.', 'State the relationship: the number of justified days depends on it.') });
    }
    if (isPrevisivel(v)) {
      const aviso = v.dataComunicacao && v.dataInicio ? diffDays(v.dataComunicacao, v.dataInicio) : null;
      if (aviso == null || !Number.isFinite(aviso) || aviso < c.antecedencia) {
        w.push({
          level: 'info',
          field: 'dataComunicacao',
          message: l(
            `As faltas previsíveis devem ser comunicadas com pelo menos ${c.antecedencia} dias de antecedência (${cite('faltasComunicacao')}).`,
            `Foreseeable absences must be notified at least ${c.antecedencia} days in advance.`,
          ),
        });
      }
    }
    if (v.motivo === 'outro' && !inline(v.descricao)) {
      w.push({ level: 'warning', field: 'descricao', message: l('Descreva o motivo da falta.', 'Describe the reason for the absence.') });
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
    const dg = v.destinatarioGenero;
    const motivo = motivoTexto(v);
    const anexos: string[] = c.anexos;
    const funcao = v.trabalhadorCargo
      ? `, com a função de ${v.trabalhadorCargo}${v.trabalhadorDepartamento ? ` (${v.trabalhadorDepartamento})` : ''}`
      : '';
    const periodoPt = c.multi
      ? `no período de **${dateLong(v.dataInicio)}** a **${dateLong(v.dataFim)}** (${diasTxt(c.dias)})`
      : `no dia **${dateLong(v.dataInicio)}**`;
    const periodoEn = c.multi ? `from ${dateEn(v.dataInicio)} to ${dateEn(v.dataFim)}` : `on ${dateEn(v.dataInicio)}`;

    const blocks: Block[] = [
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: exmo(dg),
        lines: [v.destinatarioCargo || g(dg, 'Director de Recursos Humanos', 'Directora de Recursos Humanos'), v.empresaNome || ''],
      },
      { type: 'subject', text: 'Justificação de falta' },
      { type: 'salutation', text: `${exmo(dg)},` },
      {
        type: 'paragraph',
        id: 'justificacao',
        text: `Eu, **${blank(v.trabalhadorNome)}**, ${g(ge, 'trabalhador', 'trabalhadora')} desta empresa${funcao}, venho justificar a minha falta ao serviço ${periodoPt}, ${motivo.pt}.`,
        en: `I, ${blank(v.trabalhadorNome)}, an employee of this company, hereby justify my absence from work ${periodoEn}, ${motivo.en}.`,
      },
    ];
    const pormenores = v.motivo !== 'outro' ? splitLines(v.descricao).join(' ') : '';
    if (pormenores) {
      blocks.push({ type: 'paragraph', id: 'pormenores', text: /[.!?]$/.test(pormenores) ? pormenores : `${pormenores}.` });
    }
    if (v.dataComunicacao) {
      blocks.push({
        type: 'paragraph',
        id: 'comunicacao',
        text: `A ausência foi comunicada à empresa em ${dateLong(v.dataComunicacao)}.`,
        en: `The employer was notified of the absence on ${dateEn(v.dataComunicacao)}.`,
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'pedido',
      text: `Solicito a V. Ex.ª que a presente falta seja considerada justificada${isLegal(v) ? `, ${nosTermos('faltasJustificadas')}` : ''}${anexos.length ? `, para o que junto ${anexos.length === 1 ? 'o documento comprovativo indicado abaixo' : 'os documentos comprovativos indicados abaixo'}` : ''}.`,
      en: `I request that this absence be treated as justified${anexos.length ? '; supporting documents are listed below' : ''}.`,
    });
    if (anexos.length) blocks.push({ type: 'annexList', items: anexos });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [{ ...workerSignature(v), detail: v.trabalhadorCargo || undefined }] },
      { type: 'spacer', size: 'small' },
      { type: 'heading', text: 'Despacho', keepWithNext: true },
      {
        type: 'checklist',
        keepWithNext: true,
        items: [
          { label: 'Falta justificada', checked: false },
          { label: 'Falta justificada, com perda de remuneração', checked: false },
          { label: 'Falta injustificada', checked: false },
        ],
      },
      { type: 'note', text: 'Observações: ____________________________________________________________________________', keepWithNext: true },
      { type: 'signatures', columns: [{ role: 'A Chefia', detail: 'Data: ___/___/______' }] },
    );
    return blocks;
  },
});
