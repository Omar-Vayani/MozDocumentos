// Convite para apresentação de propostas / cotações: the contracting body (UGEA)
// invites suppliers in a request for quotations, restricted tender, small-value
// tender or direct award, with the goods required and the conditions.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, entityName, l, localField } from './_shared';
import { estadoRef, numeroField, rodapeBlocks, rodapeFields, signatarioColumn, signatarioFields, tagsBlocks } from './_estado';
import {
  condicoesFields, condicoesItems, condicoesWarnings, empresaDestBlock, empresaDestFields, entidadeProfileWarning, itensField, items, modalidadeNome, objectoComArtigo, procedimentoFields,
  procedimentoNome, qtd, str, TIPO_CONTRATACAO_OPTIONS, aEntidade,
} from './_contratacao';

export default defineTemplate({
  id: 'convite-apresentacao-propostas',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Número, local e data', 'Number, place and date') },
    { id: 'destinatario', title: l('Empresa convidada', 'Invited company') },
    { id: 'procedimento', title: l('Procedimento', 'Procedure') },
    { id: 'objecto', title: l('Bens ou serviços pedidos', 'Goods or services requested') },
    { id: 'condicoes', title: l('Condições', 'Conditions') },
    { id: 'assinatura', title: l('Assinatura, anexos e cópias', 'Signature, enclosures and copies') },
  ],
  fields: [
    numeroField(),
    localField(),
    dateField('data'),
    ...empresaDestFields(),
    ...procedimentoFields('procedimento', { defaultModalidade: 'cotacoes' }),
    { name: 'tipo', type: 'select', section: 'procedimento', width: 'half', label: l('Tipo de contratação', 'Type of contract'), options: TIPO_CONTRATACAO_OPTIONS, default: 'bens' },
    itensField('objecto', { especificacao: true, label: l('Lista de bens (opcional)', 'List of goods (optional)') }),
    {
      name: 'descricao',
      type: 'textarea',
      section: 'objecto',
      rows: 3,
      label: l('Descrição dos serviços ou observações (opcional)', 'Description of services or notes (optional)'),
      help: l('Para serviços, descreva o trabalho ou remeta para os termos de referência em anexo.', 'For services, describe the work or refer to the attached terms of reference.'),
    },
    ...condicoesFields(),
    ...signatarioFields(),
    ...rodapeFields(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...entidadeProfileWarning(ctx), ...condicoesWarnings(v)];
    if (!str(v.destEmpresa)) w.push({ level: 'warning', field: 'destEmpresa', message: l('Indique a empresa convidada.', 'Enter the invited company.') });
    if (v.modalidade === 'cotacoes') {
      const min = ctx.legal.value<number>('ctCotacoesMinimo');
      w.push({ level: 'info', field: 'modalidade', message: l(`No concurso por cotações, convide fornecedores suficientes para obter pelo menos ${min} cotações válidas (${cite('ctCotacoesMinimo')}). Envie o mesmo convite, com a mesma data-limite, a todos.`, `In a request for quotations, invite enough suppliers to get at least ${min} valid quotations. Send the same invitation and deadline to all.`) });
    }
    if (v.modalidade === 'ajuste') w.push({ level: 'info', field: 'modalidade', message: l(`O ajuste directo só é admitido nos casos e limites previstos na lei, com fundamentação e autorização da autoridade competente (${cite('ctModalidades')}).`, 'Direct award is allowed only in the cases and limits set by law, with reasons and authorisation.') });
    return w;
  },

  personName: (v) => v.destEmpresa,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const cot = v.modalidade === 'cotacoes';
    const list = items(v);
    const entidade = aEntidade(entityName(ctx));
    const blocks: Block[] = [
      ...tagsBlocks(v),
      { type: 'reference', ref: estadoRef(ctx, 'Ofício'), place: ctx.place, date: dateLong(v.data) },
      empresaDestBlock(v),
      { type: 'subject', text: `Convite para apresentação de ${cot ? 'cotação' : 'proposta'} — ${procedimentoNome(v)}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'convite',
        text: `1. ${entidade}, através da sua Unidade Gestora Executora das Aquisições, convida V. Exas. a apresentar ${cot ? 'cotação' : 'proposta'} para ${objectoComArtigo(v)}, no âmbito do ${modalidadeNome(v)} acima referido, nos termos do regulamento de contratação de empreitada de obras públicas, fornecimento de bens e prestação de serviços ao Estado e das condições seguintes.`,
        en: 'The contracting body invites the company to submit a quotation / bid for the stated object, under the procurement regulation and the following conditions.',
      },
    ];
    if (list.length) {
      blocks.push(
        { type: 'paragraph', id: 'bens', text: '2. Os bens, as quantidades e as especificações mínimas são os seguintes:', keepWithNext: true, en: 'Goods, quantities and minimum specifications:' },
        {
          type: 'table',
          columns: [
            { label: 'N.º', width: 0.4, align: 'right' },
            { label: 'Descrição', width: 2.6 },
            { label: 'Especificação mínima', width: 3 },
            { label: 'Un.', width: 0.6, align: 'center' },
            { label: 'Qtd.', width: 0.7, align: 'right' },
          ],
          rows: list.map((i, n) => [String(n + 1), i.descricao, i.especificacao, i.unidade, qtd(i.quantidade)]),
        },
      );
    }
    const desc = str(v.descricao);
    let n = list.length ? 3 : 2;
    if (desc) blocks.push({ type: 'paragraph', id: 'descricao', text: `${n++}. ${desc}`, en: 'Description of the services.' });
    blocks.push({ type: 'paragraph', id: 'condicoes', text: `${n}. Condições do procedimento:`, keepWithNext: true, en: 'Conditions:' });
    blocks.push({ type: 'list', style: 'alpha', items: condicoesItems(v, { cotacao: cot }).map((t, i, a) => (i === a.length - 1 ? t : t.replace(/\.$/, ';'))) });
    blocks.push(
      { type: 'paragraph', id: 'reserva', text: `${n + 1}. A entidade contratante reserva-se o direito de não adjudicar, nos casos previstos na lei, sem que daí resulte qualquer direito a indemnização.`, en: 'The contracting body may decide not to award, in the cases provided by law, without compensation.' },
      { type: 'paragraph', id: 'fecho', text: 'Melhores cumprimentos.', align: 'left', keepWithNext: true, en: 'Best regards.' },
      { type: 'signatures', columns: [signatarioColumn(v)] },
      ...rodapeBlocks(v),
    );
    return blocks;
  },
});
