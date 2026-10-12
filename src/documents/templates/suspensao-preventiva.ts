import type { LegalRefId } from '@/legal/mz-legal';
import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import {
  BLANK, cite, dateField, dateLong, employerName, employerSignature, exmo, g, l, localField, refField,
  splitLines, workerFields,
} from './_shared';

const doCite = (id: LegalRefId) => {
  const c = cite(id);
  return `${/^arts\./.test(c) ? 'dos' : /^art/.test(c) ? 'do' : 'da'} ${c}`;
};

export default defineTemplate({
  id: 'suspensao-preventiva',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'suspensao', title: l('Suspensão', 'Suspension') },
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
    dateField('data'),
    ...workerFields(['nome', 'genero', 'cargo', 'departamento']),
    {
      name: 'dataNotaCulpa',
      type: 'date',
      section: 'suspensao',
      width: 'half',
      required: true,
      label: l('Data de entrega da nota de culpa', 'Date the charge was delivered'),
      legal: l('A suspensão preventiva é decidida com a nota de culpa.', 'Preventive suspension is decided together with the charge.'),
      default: (c) => c.today,
    },
    {
      name: 'dataInicio',
      type: 'date',
      section: 'suspensao',
      width: 'half',
      required: true,
      label: l('Início da suspensão', 'Suspension starts'),
      default: (c) => c.today,
    },
    {
      name: 'motivo',
      type: 'textarea',
      section: 'suspensao',
      rows: 3,
      label: l('Porque a presença do trabalhador pode prejudicar o processo (opcional)', 'Why the employee’s presence could harm the procedure (optional)'),
      placeholder: l(
        'Ex.: acesso aos registos de caixa que estão a ser analisados; contacto diário com as testemunhas',
        'E.g. access to the cash records under review; daily contact with the witnesses',
      ),
    },
    {
      name: 'contacto',
      type: 'text',
      section: 'suspensao',
      label: l('Contacto do trabalhador durante a suspensão', 'Employee contact during the suspension'),
      placeholder: l('Ex.: +258 84 123 4567', 'E.g. +258 84 123 4567'),
    },
    {
      name: 'bens',
      type: 'textarea',
      section: 'opcoes',
      rows: 2,
      label: l('Bens a entregar (opcional)', 'Items to hand over (optional)'),
      help: l('Um por linha. Ex.: cartão de acesso; chaves do armazém; computador portátil.', 'One per line. E.g. access card; warehouse keys; laptop.'),
    },
    {
      name: 'orgaoSindical',
      type: 'text',
      section: 'opcoes',
      label: l('Comité sindical (cópia)', 'Union committee (copy)'),
      default: 'Comité Sindical',
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (v.dataNotaCulpa && v.dataInicio && diffDays(v.dataNotaCulpa, v.dataInicio) < 0) {
      w.push({
        level: 'warning',
        field: 'dataInicio',
        message: l(
          'A lei prevê a suspensão preventiva com a nota de culpa, não antes. Entregue primeiro a nota de culpa.',
          'The law provides for preventive suspension with the charge, not before it. Deliver the charge first.',
        ),
      });
    }
    if (v.dataInicio && v.data && diffDays(v.data, v.dataInicio) < 0) {
      w.push({ level: 'warning', field: 'dataInicio', message: l('A suspensão começa antes da data desta comunicação.', 'The suspension starts before the date of this notice.') });
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
    const emp = pessoa ? 'entidade empregadora' : 'empresa';
    const bens = splitLines(v.bens);
    const motivos = splitLines(v.motivo);

    const motivoBlocks: Block[] =
      motivos.length === 0
        ? [
            {
              type: 'paragraph',
              id: 'motivo',
              text: 'A suspensão justifica-se porque a presença de V. Ex.ª no local de trabalho pode prejudicar o apuramento dos factos e o normal andamento do processo.',
              en: 'The suspension is justified because your presence at work could harm the investigation and the normal course of the procedure.',
            },
          ]
        : motivos.length === 1
          ? [
              {
                type: 'paragraph',
                id: 'motivo',
                text: `A suspensão justifica-se porque a presença de V. Ex.ª no local de trabalho pode prejudicar o normal andamento do processo, designadamente pelo seguinte: ${motivos[0].replace(/\.$/, '')}.`,
                en: `The suspension is justified because your presence at work could harm the procedure, namely: ${motivos[0]}`,
              },
            ]
          : [
              {
                type: 'paragraph',
                id: 'motivo',
                text: 'A suspensão justifica-se porque a presença de V. Ex.ª no local de trabalho pode prejudicar o normal andamento do processo, designadamente pelo seguinte:',
                en: 'The suspension is justified because your presence at work could harm the procedure, namely:',
              },
              { type: 'list', style: 'bullet', items: motivos },
            ];

    const blocks: Block[] = [
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: exmo(ge),
        lines: [v.trabalhadorNome || BLANK, [v.trabalhadorCargo, v.trabalhadorDepartamento].filter(Boolean).join(' — ')],
      },
      { type: 'subject', text: `Suspensão preventiva — Processo disciplinar n.º ${v.processoNumero || BLANK}` },
      { type: 'salutation', text: `${exmo(ge)},` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `No âmbito do processo disciplinar acima referido, cuja nota de culpa foi entregue a V. Ex.ª em ${dateLong(v.dataNotaCulpa)}, ${quem} comunica que, nos termos ${doCite('suspensaoPreventiva')} (Lei do Trabalho), V. Ex.ª fica ${g(ge, 'suspenso', 'suspensa')} preventivamente a partir de **${dateLong(v.dataInicio)}**, até à decisão final do processo.`,
        en: `In the above disciplinary case, whose charge was delivered to you${v.dataNotaCulpa ? ` on ${v.dataNotaCulpa}` : ''}, ${empresa} informs you that you are preventively suspended from ${v.dataInicio || '___'} until the final decision.`,
      },
      ...motivoBlocks,
      {
        type: 'paragraph',
        id: 'remuneracao',
        text: 'A suspensão preventiva não é uma sanção disciplinar e **não implica perda de remuneração**: V. Ex.ª continua a receber a remuneração e as demais prestações a que tem direito, nas datas habituais.',
        en: 'Preventive suspension is not a disciplinary sanction and involves no loss of pay: you continue to receive your pay and other benefits on the usual dates.',
      },
      {
        type: 'paragraph',
        id: 'deveres',
        text: `Durante a suspensão, V. Ex.ª fica ${g(ge, 'dispensado', 'dispensada')} de comparecer ao trabalho e não deve aceder às instalações da ${emp}, salvo quando for ${g(ge, 'convocado', 'convocada')}. Deve manter-se contactável e disponível para comparecer às diligências do processo para que seja ${g(ge, 'chamado', 'chamada')}${v.contacto ? `, sendo os contactos feitos através de ${String(v.contacto).trim()}` : ''}.`,
        en: `During the suspension you are released from work and must not enter the premises unless called. You must remain reachable and available to attend the steps of the procedure${v.contacto ? ` (contact: ${v.contacto})` : ''}.`,
      },
    ];
    if (bens.length) {
      blocks.push(
        {
          type: 'paragraph',
          id: 'bens',
          text: `V. Ex.ª deve entregar, no início da suspensão, os seguintes bens da ${emp}, que lhe serão restituídos se regressar ao serviço:`,
          en: 'At the start of the suspension you must hand over the following company items, which will be returned if you resume work:',
        },
        { type: 'list', style: 'bullet', items: bens },
      );
    }
    blocks.push(
      { type: 'paragraph', id: 'copia', text: `Cópia: ${v.orgaoSindical || 'Comité Sindical'}.`, size: 'small', align: 'left' },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [employerSignature(ctx)] },
      {
        type: 'acknowledgement',
        text: 'Recebi o original desta comunicação em ___/___/______, às ____:____ horas.',
        signer: g(ge, 'O Trabalhador', 'A Trabalhadora'),
      },
    );
    return blocks;
  },
});
