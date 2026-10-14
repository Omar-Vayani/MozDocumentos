// Pedido de esclarecimentos: a prospective bidder asks the contracting body,
// in writing and within the time set by the tender document, to clarify it.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateLong, l, lineItems, refField } from './_shared';
import {
  concorrenteFields, concorrenteIdent, concorrenteSignature, concorrenteWarnings, daEntidade, isEmpresaConcorrente, entidadeFields, entidadeRecipient, procedimentoCompleto, procedimentoFields,
  procedimentoNome, semPonto, str,
} from './_contratacao';

export default defineTemplate({
  id: 'pedido-esclarecimentos-concurso',
  family: 'carta',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Referência, local e data', 'Reference, place and date') },
    { id: 'entidade', title: l('Entidade contratante', 'Contracting body') },
    { id: 'procedimento', title: l('Concurso', 'Tender') },
    { id: 'concorrente', title: l('Interessado', 'Interested party'), personRole: 'outro' },
    { id: 'questoes', title: l('Questões', 'Questions') },
  ],
  fields: [
    refField(),
    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', label: l('Data', 'Date'), default: (c) => c.today },
    ...entidadeFields(),
    ...procedimentoFields(),
    { name: 'dataAquisicao', type: 'date', section: 'procedimento', width: 'half', label: l('Data em que obteve o documento de concurso (opcional)', 'Date the tender document was obtained (optional)') },
    ...concorrenteFields(),
    {
      name: 'questoes',
      type: 'lines',
      section: 'questoes',
      label: l('Questões', 'Questions'),
      addLabel: l('Adicionar questão', 'Add question'),
      columns: [
        { name: 'referencia', type: 'text', label: l('Referência no documento (secção, cláusula, item)', 'Reference in the document (section, clause, item)'), placeholder: l('Ex.: Secção VI, item 12', 'E.g. Section VI, item 12') },
        { name: 'questao', type: 'text', label: l('Questão', 'Question') },
      ],
      default: [{ referencia: '', questao: '' }],
    },
    { name: 'respostaEmail', type: 'text', section: 'questoes', width: 'half', label: l('Email para a resposta', 'Email for the reply'), default: (c) => c.profile?.email ?? '' },
  ],

  warnings: (v) => {
    const w: Warning[] = [...concorrenteWarnings(v)];
    if (!lineItems(v.questoes).some((q) => str(q.questao))) w.push({ level: 'error', field: 'questoes', message: l('Escreva pelo menos uma questão.', 'Write at least one question.') });
    w.push({
      level: 'info',
      message: l(
        `Os esclarecimentos só são respondidos se pedidos dentro do prazo fixado no documento de concurso. A resposta é comunicada a todos os interessados, sem identificar quem perguntou (${cite('ctEsclarecimentos')}).`,
        'Clarifications are answered only if requested within the time set in the tender document. The answer goes to all bidders without naming who asked.',
      ),
    });
    return w;
  },

  personName: (v) => v.entidadeNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const qs = lineItems(v.questoes).filter((q) => str(q.questao) || str(q.referencia));
    const blocks: Block[] = [
      { type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
      entidadeRecipient(v),
      { type: 'subject', text: `Pedido de esclarecimentos — ${procedimentoNome(v)}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${concorrenteIdent(v)}, ${isEmpresaConcorrente(v) || v.concorrenteGenero === 'F' ? 'interessada' : 'interessado'} no ${procedimentoCompleto(v)}, lançado ${daEntidade(str(v.entidadeNome))}${v.dataAquisicao ? `, cujo documento de concurso obteve em ${dateLong(v.dataAquisicao)}` : ''}, vem, dentro do prazo fixado no documento de concurso, solicitar os seguintes esclarecimentos:`,
        en: 'The interested party, within the time set by the tender document, asks for the following clarifications:',
      },
    ];
    (qs.length ? qs : [{ referencia: '', questao: '' }]).forEach((q, i) =>
      blocks.push({
        type: 'paragraph',
        id: `questao-${i + 1}`,
        text: `${i + 1}. ${str(q.referencia) ? `**${semPonto(q.referencia)}** — ` : ''}${str(q.questao) || '____________________________________________________________'}`,
        en: 'Question.',
      }),
    );
    blocks.push(
      {
        type: 'paragraph',
        id: 'resposta',
        text: `Solicitamos que a resposta nos seja comunicada${str(v.respostaEmail) ? ` para o endereço electrónico ${str(v.respostaEmail)}` : ' por escrito'}, com a antecedência necessária à preparação da proposta.`,
        en: 'Please send the reply in writing in good time to prepare the bid.',
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', columns: [concorrenteSignature(ctx, 'O Interessado')] },
    );
    return blocks;
  },
});
