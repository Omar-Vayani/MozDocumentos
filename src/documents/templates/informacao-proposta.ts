// Informação / Informação-Proposta: a technician or head of unit sets out a
// matter to a superior for opinion and decision. The boxes at the top are left
// blank for the superior's "Despacho" and for intermediate "Pareceres".

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, splitLines } from './_shared';
import {
  classificacaoFields, codigoField, comArtigo, endDot, estadoRef, estadoWarnings, numeroField, paragraphs, rodapeBlocks,
  rodapeFields, signatarioColumn, signatarioFields, str, stripNumber, tagsBlocks,
} from './_estado';

const isProposta = (v: Record<string, unknown>) => v.tipo !== 'informacao';

export default defineTemplate({
  id: 'informacao-proposta',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Tipo, número e data', 'Type, number and date') },
    { id: 'despacho', title: l('Quadros para despacho e parecer', 'Decision and opinion boxes') },
    { id: 'cabecalho', title: l('Para, de e assunto', 'To, from and subject') },
    { id: 'conteudo', title: l('Conteúdo', 'Content') },
    { id: 'assinatura', title: l('Quem informa', 'Author') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'radio',
      section: 'documento',
      label: l('Tipo', 'Type'),
      options: [
        { value: 'proposta', label: l('Informação-Proposta (pede uma decisão)', 'Proposal (asks for a decision)') },
        { value: 'informacao', label: l('Informação (dá conhecimento)', 'Briefing (for information)') },
      ],
      default: 'proposta',
    },
    numeroField(),
    codigoField(),
    ...classificacaoFields(),
    localField(),
    dateField('data'),
    {
      name: 'posicaoDespacho',
      type: 'select',
      section: 'despacho',
      width: 'half',
      label: l('Quadro do despacho', 'Decision box'),
      options: [
        { value: 'topo', label: l('No topo (habitual)', 'At the top (usual)') },
        { value: 'fim', label: l('No fim do documento', 'At the end') },
      ],
      default: 'topo',
    },
    {
      name: 'pareceres',
      type: 'select',
      section: 'despacho',
      width: 'half',
      label: l('Quadros de parecer', 'Opinion boxes'),
      options: [
        { value: '0', label: l('Nenhum', 'None') },
        { value: '1', label: l('Um', 'One') },
        { value: '2', label: l('Dois', 'Two') },
      ],
      default: '1',
      help: l('Para o superior intermédio (ex.: o Director antes do Ministro) dar o seu parecer.', 'For an intermediate superior (e.g. the Director before the Minister) to give an opinion.'),
    },
    { name: 'parecer1', type: 'text', section: 'despacho', width: 'half', label: l('Parecer de (opcional)', 'Opinion by (optional)'), placeholder: l('Ex.: Director Nacional', 'E.g. National Director'), showIf: (v) => v.pareceres === '1' || v.pareceres === '2' },
    { name: 'parecer2', type: 'text', section: 'despacho', width: 'half', label: l('Segundo parecer de (opcional)', 'Second opinion by (optional)'), placeholder: l('Ex.: Secretário Permanente', 'E.g. Permanent Secretary'), showIf: (v) => v.pareceres === '2' },
    {
      name: 'para',
      type: 'text',
      section: 'cabecalho',
      required: true,
      label: l('Para', 'To'),
      placeholder: l('Ex.: Sua Excelência o Ministro da Saúde', 'E.g. His Excellency the Minister of Health'),
      help: l('Quem decide. Ex.: «Sua Excelência o Governador da Província», «Exmo. Senhor Director Provincial».', 'Who decides. E.g. “His Excellency the Governor”, “The Provincial Director”.'),
    },
    {
      name: 'de',
      type: 'text',
      section: 'cabecalho',
      label: l('De', 'From'),
      placeholder: l('Ex.: Chefe do Departamento de Recursos Humanos', 'E.g. Head of Human Resources'),
      help: l('Se ficar vazio, usa-se o cargo de quem assina.', 'If left empty, the signatory’s position is used.'),
    },
    { name: 'assunto', type: 'text', section: 'cabecalho', required: true, label: l('Assunto', 'Subject') },
    {
      name: 'enquadramento',
      type: 'textarea',
      section: 'conteudo',
      required: true,
      rows: 5,
      label: l('1. Enquadramento', '1. Background'),
      help: l('Os factos e antecedentes: o pedido recebido, a norma aplicável, o que já foi feito.', 'Facts and background: the request received, the rule that applies, what has been done.'),
    },
    {
      name: 'analise',
      type: 'textarea',
      section: 'conteudo',
      rows: 6,
      label: l('2. Análise', '2. Analysis'),
      help: l('A apreciação do assunto: opções, vantagens, riscos, conformidade legal.', 'Assessment: options, advantages, risks, legal compliance.'),
    },
    {
      name: 'implicacoes',
      type: 'textarea',
      section: 'conteudo',
      rows: 3,
      label: l('Implicações financeiras (opcional)', 'Financial implications (optional)'),
      help: l('Custo, rubrica orçamental e disponibilidade de verba.', 'Cost, budget line and availability of funds.'),
    },
    {
      name: 'proposta',
      type: 'textarea',
      section: 'conteudo',
      rows: 4,
      label: l('Proposta', 'Proposal'),
      help: l(
        'Uma proposta por linha, a seguir a «Face ao exposto, propõe-se…». Ex.: «A afectação de dois técnicos ao Distrito de Ribáuè», «A autorização da despesa com a formação».',
        'One proposal per line, following “In view of the above, it is proposed…”. E.g. “The assignment of two staff to Ribáuè District”.',
      ),
      showIf: isProposta,
    },
    {
      name: 'fecho',
      type: 'select',
      section: 'conteudo',
      label: l('Fecho', 'Closing'),
      options: [
        { value: 'À consideração superior.', label: l('À consideração superior.', 'For the superior’s consideration.') },
        { value: 'À consideração de Sua Excelência.', label: l('À consideração de Sua Excelência.', 'For His/Her Excellency’s consideration.') },
        { value: 'Submete-se à consideração superior.', label: l('Submete-se à consideração superior.', 'Submitted for the superior’s consideration.') },
      ],
      default: 'À consideração superior.',
    },
    ...signatarioFields('assinatura', l('Cargo de quem informa', 'Author’s position')),
    ...rodapeFields('assinatura', { cc: false }),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = estadoWarnings(v, ctx, { assunto: true });
    if (!str(v.para)) w.push({ level: 'warning', field: 'para', message: l('Indique a quem é dirigida (quem decide).', 'Enter who it is addressed to (the decision-maker).') });
    if (!paragraphs(v.enquadramento).length) w.push({ level: 'warning', field: 'enquadramento', message: l('Descreva o enquadramento do assunto.', 'Describe the background.') });
    if (isProposta(v) && !splitLines(v.proposta).length) {
      w.push({ level: 'warning', field: 'proposta', message: l('Escreva o que propõe que seja decidido.', 'Write what you propose to be decided.') });
    }
    w.push({
      level: 'info',
      message: l(
        `O expediente deve ser apresentado a despacho no prazo de ${ctx.legal.value<number>('prazoApresentacaoDespacho')} dias após a entrada e decidido no prazo de ${ctx.legal.value<number>('prazoDespacho')} dias após a apresentação (${cite('prazoDespacho')} — confirmar).`,
        `The file should be put to the decision-maker within ${ctx.legal.value<number>('prazoApresentacaoDespacho')} days of entry and decided within ${ctx.legal.value<number>('prazoDespacho')} days.`,
      ),
    });
    return w;
  },

  personName: (v) => v.assunto,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const proposta = isProposta(v);
    const tipo = proposta ? 'Informação-Proposta' : 'Informação';
    const n = Number(v.pareceres ?? 1) || 0;
    // One parecer: Despacho and Parecer side by side; two: Despacho above, pareceres side by side.
    const caixas: Block[] = [{ type: 'box', label: 'Despacho', lines: 3, width: n === 1 ? 'half' : 'full' }];
    for (let i = 1; i <= n; i++) {
      const de = str(v[`parecer${i}`]);
      caixas.push({ type: 'box', label: de ? `Parecer — ${de}` : 'Parecer', lines: n === 1 ? 3 : 2, width: 'half' });
    }
    const de = str(v.de) || comArtigo(str(v.signatarioCargo), v.signatarioGenero).replace(/^(O|A) /, '') || BLANK;
    const cab = [
      `**Para:** ${str(v.para) || BLANK}`,
      `**De:** ${de}`,
      `**Data:** ${dateLong(v.data)}`,
      `**Assunto:** ${str(v.assunto) || BLANK}`,
    ].join('\n');

    const blocks: Block[] = [...tagsBlocks(v), { type: 'title', text: estadoRef(ctx, tipo) }];
    if (v.posicaoDespacho !== 'fim') blocks.push(...caixas);
    blocks.push({ type: 'paragraph', id: 'cabecalho', text: cab, align: 'left', en: 'To, from, date and subject.' });

    let sec = 0;
    const secao = (titulo: string, text: unknown, id: string, en: string) => {
      const ps = paragraphs(text);
      if (!ps.length) return;
      sec++;
      blocks.push({ type: 'heading', text: `${sec}. ${titulo}` });
      ps.forEach((p, i) => blocks.push({ type: 'paragraph', id: `${id}-${i + 1}`, text: p, en }));
    };
    secao('Enquadramento', v.enquadramento, 'enquadramento', 'Background of the matter.');
    secao('Análise', v.analise, 'analise', 'Analysis of the matter.');
    secao('Implicações financeiras', v.implicacoes, 'implicacoes', 'Financial implications.');
    if (proposta) {
      sec++;
      const props = splitLines(v.proposta).map((p) => endDot(stripNumber(p)).replace(/\.$/, ''));
      blocks.push({ type: 'heading', text: `${sec}. Proposta` });
      if (props.length > 1) {
        blocks.push(
          { type: 'paragraph', id: 'proposta', text: 'Face ao exposto, propõe-se:', keepWithNext: true, en: 'In view of the above, it is proposed:' },
          { type: 'list', style: 'alpha', items: props.map((p, i) => `${p}${i === props.length - 1 ? '.' : ';'}`) },
        );
      } else {
        const p = props[0] ? props[0].charAt(0).toLowerCase() + props[0].slice(1) : BLANK;
        blocks.push({ type: 'paragraph', id: 'proposta', text: `Face ao exposto, propõe-se ${p}.`, en: 'In view of the above, the measure stated is proposed.' });
      }
    }
    const fecho = str(v.fecho) || 'À consideração superior.';
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: fecho, align: 'right', keepWithNext: true, en: 'For the superior’s consideration.' },
      { type: 'signatures', columns: [signatarioColumn(v)] },
    );
    if (v.posicaoDespacho === 'fim') blocks.push(...caixas);
    blocks.push(...rodapeBlocks(v));
    return blocks;
  },
});
