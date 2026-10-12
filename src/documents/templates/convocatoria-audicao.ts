import type { LegalRefId } from '@/legal/mz-legal';
import { addDays, diffDays, parseISODate } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import {
  BLANK, cite, dateField, dateLong, employerName, employerSignature, exmo, g, l, localField, refField,
  workerFields,
} from './_shared';

const doCite = (id: LegalRefId) => {
  const c = cite(id);
  return `${/^arts\./.test(c) ? 'dos' : /^art/.test(c) ? 'do' : 'da'} ${c}`;
};

const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

/** "segunda-feira, 19 de Outubro de 2026" */
function dataComDia(iso: unknown): string {
  const d = typeof iso === 'string' ? parseISODate(iso) : null;
  return d ? `${DIAS_SEMANA[d.getDay()]}, ${dateLong(iso)}` : dateLong('');
}

/** "09:00" → "09:00 horas"; other formats ("09h00") are kept as typed. */
function hora(v: unknown): string {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return '____:____ horas';
  return /^\d{1,2}:\d{2}$/.test(s) ? `${s} horas` : s;
}

export default defineTemplate({
  id: 'convocatoria-audicao',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'audicao', title: l('Audição', 'Hearing') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    refField(),
    {
      name: 'processoNumero',
      type: 'text',
      section: 'documento',
      width: 'half',
      label: l('N.º do processo disciplinar', 'Disciplinary case number'),
      default: (c) => `PD/${c.today.slice(0, 4)}/001`,
    },
    localField(),
    dateField('data', 'documento', l('Data da convocatória', 'Date of the notice')),
    ...workerFields(['nome', 'genero', 'cargo', 'departamento']),
    {
      name: 'dataNotaCulpa',
      type: 'date',
      section: 'audicao',
      width: 'half',
      required: true,
      label: l('Data de entrega da nota de culpa', 'Date the charge was delivered'),
    },
    {
      name: 'dataAudicao',
      type: 'date',
      section: 'audicao',
      width: 'half',
      required: true,
      label: l('Data da audição', 'Hearing date'),
    },
    {
      name: 'horaAudicao',
      type: 'text',
      section: 'audicao',
      width: 'half',
      required: true,
      label: l('Hora', 'Time'),
      placeholder: l('Ex.: 09:00', 'E.g. 09:00'),
    },
    {
      name: 'localAudicao',
      type: 'text',
      section: 'audicao',
      required: true,
      label: l('Local da audição', 'Hearing place'),
      placeholder: l('Ex.: Sala de reuniões, 2.º andar da sede', 'E.g. Meeting room, head office 2nd floor'),
    },
    {
      name: 'instrutor',
      type: 'text',
      section: 'audicao',
      label: l('Quem conduz a audição (opcional)', 'Who conducts the hearing (optional)'),
      placeholder: l('Ex.: Dr. Carlos Mabunda, instrutor do processo', 'E.g. Mr Carlos Mabunda, case investigator'),
    },
    {
      name: 'pedidoTrabalhador',
      type: 'toggle',
      section: 'opcoes',
      label: l('A audição foi pedida pelo trabalhador na resposta', 'The employee asked to be heard in the reply'),
    },
    {
      name: 'acompanhamento',
      type: 'toggle',
      section: 'opcoes',
      default: true,
      label: l('Informar que pode ser acompanhado (sindicato ou advogado)', 'State that they may be accompanied (union or lawyer)'),
    },
    {
      name: 'provas',
      type: 'toggle',
      section: 'opcoes',
      default: true,
      label: l('Informar que pode trazer testemunhas e documentos', 'State that they may bring witnesses and documents'),
    },
    {
      name: 'orgaoSindical',
      type: 'text',
      section: 'opcoes',
      label: l('Comité sindical (cópia)', 'Union committee (copy)'),
      default: 'Comité Sindical',
    },
  ],

  computed: (v, { legal }) => {
    const prazo = legal.value<number>('notaCulpaPrazoResposta');
    return { prazoResposta: prazo, fimResposta: v.dataNotaCulpa ? addDays(v.dataNotaCulpa, prazo) : null };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (v.dataAudicao && v.data && diffDays(v.data, v.dataAudicao) < 1) {
      w.push({
        level: 'error',
        field: 'dataAudicao',
        message: l('A audição tem de ser marcada para depois da data da convocatória.', 'The hearing must be after the date of the notice.'),
      });
    }
    if (v.dataAudicao && v.dataNotaCulpa && diffDays(v.dataNotaCulpa, v.dataAudicao) < 0) {
      w.push({
        level: 'error',
        field: 'dataAudicao',
        message: l('A audição não pode ser anterior à entrega da nota de culpa.', 'The hearing cannot be before the charge was delivered.'),
      });
    } else if (!v.pedidoTrabalhador && c.fimResposta && v.dataAudicao && diffDays(c.fimResposta, v.dataAudicao) < 0) {
      w.push({
        level: 'warning',
        field: 'dataAudicao',
        message: l(
          `O prazo de resposta à nota de culpa (${c.prazoResposta} dias) só termina em ${dateLong(c.fimResposta)}. Marcar a audição antes pode limitar a defesa do trabalhador.`,
          `The reply period (${c.prazoResposta} days) only ends on ${c.fimResposta}. A hearing before then may limit the employee’s defence.`,
        ),
      });
    }
    const d = typeof v.dataAudicao === 'string' ? parseISODate(v.dataAudicao) : null;
    if (d && (d.getDay() === 0 || d.getDay() === 6)) {
      w.push({ level: 'info', field: 'dataAudicao', message: l('A audição está marcada para um fim de semana.', 'The hearing falls on a weekend.') });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ge = v.trabalhadorGenero;
    const empresa = employerName(ctx);
    // An individual employer (personal profile) takes no article and is not "a empresa".
    const pessoa = ctx.profile?.kind === 'pessoa';
    const quem = pessoa ? `**${empresa}**` : `a **${empresa}**`;
    const ouvido = g(ge, 'ouvido', 'ouvida');

    const blocks: Block[] = [
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: exmo(ge),
        lines: [v.trabalhadorNome || BLANK, [v.trabalhadorCargo, v.trabalhadorDepartamento].filter(Boolean).join(' — ')],
      },
      { type: 'subject', text: `Convocatória para audição — Processo disciplinar n.º ${v.processoNumero || BLANK}` },
      { type: 'salutation', text: `${exmo(ge)},` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `No âmbito do processo disciplinar acima referido, cuja nota de culpa foi entregue a V. Ex.ª em ${dateLong(v.dataNotaCulpa)}${v.pedidoTrabalhador ? ', e na sequência do pedido formulado na sua resposta' : ''}, ${quem} convoca V. Ex.ª para ser ${ouvido} em audição, nos termos ${doCite('procedimentoDisciplinar')} (Lei do Trabalho), no dia, hora e local seguintes:`,
        en: `In the above disciplinary case, whose charge was delivered to you${v.dataNotaCulpa ? ` on ${v.dataNotaCulpa}` : ''}${v.pedidoTrabalhador ? ' and following the request in your reply' : ''}, ${empresa} calls you to a hearing on the following date, time and place:`,
      },
      {
        type: 'keyValue',
        columns: 1,
        items: [
          { label: 'Data', value: dataComDia(v.dataAudicao) },
          { label: 'Hora', value: hora(v.horaAudicao) },
          { label: 'Local', value: v.localAudicao || BLANK },
          ...(v.instrutor ? [{ label: 'Conduzida por', value: String(v.instrutor) }] : []),
        ],
      },
      {
        type: 'paragraph',
        id: 'objecto',
        text: 'A audição destina-se a ouvir V. Ex.ª sobre os factos constantes da nota de culpa e a permitir-lhe apresentar pessoalmente a sua defesa.',
        en: 'The hearing is to hear you on the facts in the charge and to let you present your defence in person.',
      },
    ];
    if (v.acompanhamento) {
      blocks.push({
        type: 'paragraph',
        id: 'acompanhamento',
        text: 'V. Ex.ª pode fazer-se acompanhar por um representante do comité sindical ou por advogado.',
        en: 'You may be accompanied by a union committee representative or by a lawyer.',
      });
    }
    if (v.provas) {
      blocks.push({
        type: 'paragraph',
        id: 'provas',
        text: 'Pode ainda apresentar as testemunhas que pretenda que sejam ouvidas e os documentos que considere relevantes para a sua defesa.',
        en: 'You may also bring the witnesses you wish to be heard and any documents relevant to your defence.',
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'impedimento',
        text: 'Se, por motivo justificado, V. Ex.ª não puder comparecer, deve comunicá-lo por escrito antes da data marcada, indicando o motivo, para que seja designada nova data. A falta injustificada não impede o prosseguimento do processo.',
        en: 'If you cannot attend for a justified reason, inform us in writing before the date, stating the reason, so that a new date can be set. An unjustified absence does not stop the procedure.',
      },
      { type: 'paragraph', id: 'copia', text: `Cópia: ${v.orgaoSindical || 'Comité Sindical'}.`, size: 'small', align: 'left' },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [employerSignature(ctx)] },
      {
        type: 'acknowledgement',
        text: 'Recebi o original desta convocatória em ___/___/______, às ____:____ horas.',
        signer: g(ge, 'O Trabalhador', 'A Trabalhadora'),
      },
    );
    return blocks;
  },
});
