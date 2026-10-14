// Notificação do resultado do concurso aos concorrentes não seleccionados: the
// award decision, the bidder's ranking or the reason for disqualification and
// the time to lodge a complaint.

import { defineTemplate, type Block, type Warning } from '../model';
import { dateField, dateLong, l, localField, money } from './_shared';
import { estadoRef, numeroField, rodapeBlocks, rodapeFields, signatarioColumn, signatarioFields, tagsBlocks } from './_estado';
import { empresaDestBlock, empresaDestFields, entidadeProfileWarning, objectoComArtigo, procedimentoFields, procedimentoNome, semPonto, str, valorTexto } from './_contratacao';

export default defineTemplate({
  id: 'notificacao-resultado-concurso',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Número, local e data', 'Number, place and date') },
    { id: 'destinatario', title: l('Concorrente notificado', 'Bidder notified') },
    { id: 'procedimento', title: l('Concurso e adjudicação', 'Tender and award') },
    { id: 'resultado', title: l('Resultado da proposta', 'Result of the bid') },
    { id: 'assinatura', title: l('Assinatura, anexos e cópias', 'Signature, enclosures and copies') },
  ],
  fields: [
    numeroField(),
    localField(),
    dateField('data'),
    ...empresaDestFields(),
    ...procedimentoFields(),
    { name: 'dataDespacho', type: 'date', section: 'procedimento', width: 'half', label: l('Data do despacho de adjudicação', 'Date of the award decision') },
    { name: 'autoridade', type: 'text', section: 'procedimento', width: 'half', label: l('Quem adjudicou', 'Awarding authority'), placeholder: l('Ex.: Director Provincial de Saúde', 'E.g. Provincial Director of Health') },
    { name: 'vencedor', type: 'text', section: 'procedimento', width: 'half', required: true, label: l('Adjudicatário', 'Successful bidder') },
    { name: 'valor', type: 'money', section: 'procedimento', width: 'half', label: l('Valor adjudicado', 'Amount awarded') },
    {
      name: 'situacao',
      type: 'radio',
      section: 'resultado',
      label: l('Situação da proposta notificada', 'Status of the notified bid'),
      options: [
        { value: 'classificada', label: l('Admitida, não vencedora', 'Admitted, not successful') },
        { value: 'desclassificada', label: l('Desclassificada', 'Disqualified') },
      ],
      default: 'classificada',
    },
    { name: 'ordem', type: 'number', section: 'resultado', width: 'half', min: 2, max: 50, label: l('Lugar na classificação', 'Ranking position'), showIf: (v) => v.situacao !== 'desclassificada' },
    { name: 'precoAvaliado', type: 'money', section: 'resultado', width: 'half', label: l('Preço avaliado da proposta (opcional)', 'Evaluated price of the bid (optional)'), showIf: (v) => v.situacao !== 'desclassificada' },
    { name: 'motivo', type: 'textarea', section: 'resultado', rows: 2, label: l('Fundamento da desclassificação', 'Reason for disqualification'), showIf: (v) => v.situacao === 'desclassificada' },
    { name: 'garantiaDevolucao', type: 'toggle', section: 'resultado', default: true, label: l('Informar a devolução da garantia provisória', 'Mention release of the bid security') },
    ...signatarioFields(),
    ...rodapeFields(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...entidadeProfileWarning(ctx)];
    if (!str(v.vencedor)) w.push({ level: 'warning', field: 'vencedor', message: l('Indique o adjudicatário.', 'Enter the successful bidder.') });
    if (v.situacao === 'desclassificada' && !str(v.motivo)) w.push({ level: 'warning', field: 'motivo', message: l('A notificação deve indicar o fundamento da desclassificação.', 'The notice must state the reason for disqualification.') });
    return w;
  },

  personName: (v) => v.destEmpresa,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const dias = ctx.legal.value<number>('ctReclamacaoPrazo');
    const desp = v.dataDespacho ? `por despacho de ${dateLong(v.dataDespacho)}${str(v.autoridade) ? ` ${/^(do|da)\s/i.test(str(v.autoridade)) ? '' : 'do '}${semPonto(v.autoridade)}` : ''}, ` : '';
    const vl = money(v.valor);
    const ordem = Number(v.ordem);
    const resultado =
      v.situacao === 'desclassificada'
        ? `A proposta de V. Exas. foi desclassificada com o seguinte fundamento: ${semPonto(v.motivo) || '____________________'}.`
        : `A proposta de V. Exas. foi admitida e ficou classificada em ${Number.isFinite(ordem) && ordem > 1 ? `${ordem}.º` : '___.º'} lugar${money(v.precoAvaliado) != null ? `, com o preço avaliado de ${valorTexto(money(v.precoAvaliado)).replace(/\*\*/g, '')}` : ''}.`;
    const blocks: Block[] = [
      ...tagsBlocks(v),
      { type: 'reference', ref: estadoRef(ctx, 'Ofício'), place: ctx.place, date: dateLong(v.data) },
      empresaDestBlock(v),
      { type: 'subject', text: `Resultado do ${procedimentoNome(v)}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'adjudicacao',
        text: `1. Comunicamos a V. Exas. que, ${desp}o ${procedimentoNome(v)}, para ${objectoComArtigo(v)}, foi adjudicado a **${str(v.vencedor) || '____________________'}**${vl != null ? `, pelo valor de ${valorTexto(vl)}` : ''}.`,
        en: 'The tender was awarded to the stated bidder.',
      },
      { type: 'paragraph', id: 'resultado', text: `2. ${resultado}`, en: 'Result of your bid.' },
      {
        type: 'paragraph',
        id: 'reclamacao',
        text: `3. Desta decisão podem V. Exas. apresentar reclamação, por escrito e devidamente fundamentada, dirigida à entidade contratante, no prazo de ${dias} dias úteis contados da recepção da presente notificação, nos termos do regulamento de contratação pública.`,
        en: `You may lodge a written complaint within ${dias} working days of receiving this notice.`,
      },
    ];
    if (v.garantiaDevolucao) {
      blocks.push({ type: 'paragraph', id: 'garantia', text: '4. A garantia provisória prestada por V. Exas. será devolvida depois da assinatura do contrato com o adjudicatário, podendo ser levantada na Unidade Gestora Executora das Aquisições.', en: 'The bid security will be returned after the contract is signed with the winner.' });
    }
    blocks.push(
      { type: 'paragraph', id: 'agradecimento', text: 'Agradecemos a participação de V. Exas. no procedimento.', en: 'Thank you for taking part.' },
      { type: 'paragraph', id: 'fecho', text: 'Melhores cumprimentos.', align: 'left', keepWithNext: true, en: 'Best regards.' },
      { type: 'signatures', columns: [signatarioColumn(v)] },
      ...rodapeBlocks(v),
    );
    return blocks;
  },
});
