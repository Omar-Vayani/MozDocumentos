// Ordem de Serviço: internal instruction of the head of a unit on how the
// service works (hours, rosters, assignments, stand-ins, procedures).

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, localField, placeDate, splitLines } from './_shared';
import { endDot, estadoRef, estadoWarnings, numeroField, signatarioColumn, signatarioFields, str, stripNumber } from './_estado';

export default defineTemplate({
  id: 'ordem-de-servico',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Número e data', 'Number and date') },
    { id: 'ordem', title: l('Determinações', 'Orders') },
    { id: 'assinatura', title: l('Assinatura e distribuição', 'Signature and distribution') },
  ],
  fields: [
    numeroField(),
    localField(),
    dateField('data'),
    { name: 'assunto', type: 'text', section: 'ordem', label: l('Assunto (opcional)', 'Subject (optional)'), placeholder: l('Ex.: Horário de atendimento ao público', 'E.g. Public opening hours') },
    {
      name: 'preambulo',
      type: 'textarea',
      section: 'ordem',
      rows: 2,
      label: l('Motivo (opcional)', 'Reason (optional)'),
      placeholder: l('Ex.: Com vista a melhorar o atendimento aos utentes', 'E.g. To improve service to users'),
    },
    {
      name: 'determinacoes',
      type: 'textarea',
      section: 'ordem',
      required: true,
      rows: 7,
      label: l('O que se determina', 'What is ordered'),
      help: l('Um ponto por linha, sem numeração.', 'One point per line, without numbers.'),
    },
    { name: 'revoga', type: 'text', section: 'ordem', label: l('Revoga (opcional)', 'Revokes (optional)'), placeholder: l('Ex.: a Ordem de Serviço n.º 2/DPS-NPL/2025', 'E.g. Service Order no. 2/DPS-NPL/2025') },
    {
      name: 'vigor',
      type: 'select',
      section: 'ordem',
      width: 'half',
      label: l('Entrada em vigor', 'Entry into force'),
      options: [
        { value: 'assinatura', label: l('Na data da assinatura', 'On signature') },
        { value: 'imediata', label: l('Imediatamente', 'Immediately') },
        { value: 'data', label: l('Numa data', 'On a date') },
      ],
      default: 'assinatura',
    },
    { name: 'vigorData', type: 'date', section: 'ordem', width: 'half', label: l('Data de entrada em vigor', 'Date in force'), showIf: (v) => v.vigor === 'data' },
    { name: 'afixacao', type: 'toggle', section: 'ordem', label: l('Mandar afixar no quadro de avisos', 'Order it posted on the notice board'), default: true },
    ...signatarioFields(),
    {
      name: 'distribuicao',
      type: 'textarea',
      section: 'assinatura',
      rows: 3,
      label: l('Distribuição (opcional)', 'Distribution (optional)'),
      placeholder: l('Um sector por linha. Ex.: Repartição de Recursos Humanos', 'One unit per line'),
    },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = estadoWarnings(v, ctx);
    if (!splitLines(v.determinacoes).length) w.push({ level: 'warning', field: 'determinacoes', message: l('Escreva o que se determina.', 'Write what is ordered.') });
    return w;
  },

  personName: (v) => v.assunto,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const pontos = splitLines(v.determinacoes).map((p) => endDot(stripNumber(p)));
    if (!pontos.length) pontos.push(`${BLANK}.`);
    const vigor =
      v.vigor === 'imediata'
        ? 'A presente Ordem de Serviço entra imediatamente em vigor'
        : v.vigor === 'data'
          ? `A presente Ordem de Serviço entra em vigor no dia ${dateLong(v.vigorData)}`
          : 'A presente Ordem de Serviço entra em vigor na data da sua assinatura';
    const revoga = str(v.revoga).replace(/[.;]$/, '');
    pontos.push(`${vigor}${revoga ? ` e revoga ${revoga}` : ''}.`);

    const motivo = str(v.preambulo).replace(/[.,;:]+$/, '');
    const blocks: Block[] = [{ type: 'title', text: estadoRef(ctx, 'Ordem de Serviço') }];
    if (str(v.assunto)) blocks.push({ type: 'subject', text: str(v.assunto) });
    blocks.push(
      { type: 'paragraph', id: 'preambulo', text: motivo ? `${motivo}, determino:` : 'Determino:', keepWithNext: true, en: 'I order:' },
      ...pontos.map((p, i): Block => ({ type: 'paragraph', id: `ponto-${i + 1}`, text: `${i + 1}. ${p}`, en: 'Point of the order.' })),
      {
        type: 'paragraph',
        id: 'formula',
        text: v.afixacao === false ? 'Registe-se, comunique-se e cumpra-se.' : 'Registe-se, afixe-se no quadro de avisos e cumpra-se.',
        align: 'left',
        keepWithNext: true,
        en: 'Register, post on the notice board and comply.',
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [signatarioColumn(v)] },
    );
    const dist = splitLines(v.distribuicao);
    if (dist.length) blocks.push({ type: 'annexList', title: 'Distribuição:', items: dist });
    return blocks;
  },
});
