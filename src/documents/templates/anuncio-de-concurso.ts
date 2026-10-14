// Anúncio de concurso: the public notice of a tender (open, restricted with
// pre-qualification, two-stage…), published in the press, on the public
// procurement portal and on the contracting body's notice board.

import { defineTemplate, type Block, type Warning } from '../model';
import { dateField, dateLong, entityName, formatMoney, l, lineItems, localField, money } from './_shared';
import { numeroField, rodapeBlocks, rodapeFields, signatarioColumn, signatarioFields } from './_estado';
import {
  aEntidade, condicoesFields, condicoesItems, condicoesWarnings, entidadeProfileWarning, objectoComArtigo, procedimentoFields, procedimentoNome, semPonto, str, TIPO_CONTRATACAO_OPTIONS,
} from './_contratacao';

export default defineTemplate({
  id: 'anuncio-de-concurso',
  family: 'oficio',
  official: 'estado',
  noBrand: true,
  sections: [
    { id: 'documento', title: l('Número, local e data', 'Number, place and date') },
    { id: 'procedimento', title: l('Concurso', 'Tender') },
    { id: 'dc', title: l('Documento de concurso', 'Tender document') },
    { id: 'condicoes', title: l('Propostas e abertura', 'Bids and opening') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    numeroField(),
    localField(),
    dateField('data'),
    ...procedimentoFields('procedimento', { lote: false }),
    { name: 'tipo', type: 'select', section: 'procedimento', width: 'half', label: l('Tipo de contratação', 'Type of contract'), options: TIPO_CONTRATACAO_OPTIONS, default: 'bens' },
    { name: 'financiamento', type: 'text', section: 'procedimento', width: 'half', label: l('Fonte de financiamento', 'Source of funds'), placeholder: l('Ex.: Orçamento do Estado de 2026', 'E.g. 2026 State Budget') },
    {
      name: 'lotes',
      type: 'lines',
      section: 'procedimento',
      label: l('Lotes (opcional)', 'Lots (optional)'),
      addLabel: l('Adicionar lote', 'Add lot'),
      columns: [
        { name: 'lote', type: 'text', label: l('Lote', 'Lot') },
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'garantia', type: 'money', label: l('Garantia provisória (opcional)', 'Bid security (optional)') },
      ],
      default: [],
    },
    {
      name: 'elegibilidade',
      type: 'textarea',
      section: 'procedimento',
      rows: 2,
      label: l('Quem pode concorrer', 'Who may bid'),
      default: 'Podem concorrer pessoas singulares ou colectivas, nacionais ou estrangeiras, inscritas no Cadastro Único de fornecedores do Estado e titulares de licença ou alvará adequado ao objecto do concurso.',
    },
    { name: 'dcLocal', type: 'text', section: 'dc', label: l('Onde se obtém o documento de concurso', 'Where to obtain the tender document'), default: (c) => (c.profile ? `Secretaria da UGEA ${c.profile.firma ? `da ${c.profile.firma}` : ''}`.trim() : '') },
    { name: 'dcHorario', type: 'text', section: 'dc', width: 'half', label: l('Horário', 'Office hours'), default: 'dias úteis, das 8:00 às 15:30' },
    { name: 'dcPreco', type: 'money', section: 'dc', width: 'half', label: l('Preço do documento (vazio = gratuito)', 'Price of the document (empty = free)') },
    { name: 'dcPagamento', type: 'text', section: 'dc', label: l('Forma de pagamento do documento (opcional)', 'How to pay for the document (optional)'), placeholder: l('Ex.: depósito na conta n.º … do BCI, com entrega do talão', 'E.g. deposit into account no. …') },
    ...condicoesFields('condicoes', { documentos: false }),
    ...signatarioFields(),
    ...rodapeFields('assinatura', { anexos: false }),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...entidadeProfileWarning(ctx), ...condicoesWarnings(v)];
    w.push({ level: 'info', message: l('Publique o anúncio nos meios previstos no regulamento (portal de contratação pública, jornal de maior circulação, vitrina da entidade) e respeite o prazo mínimo entre a publicação e a entrega das propostas.', 'Publish the notice in the media required by the regulation (procurement portal, national newspaper, notice board) and respect the minimum period before the bid deadline.') });
    return w;
  },

  personName: (v) => v.concursoNumero,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const lotes = lineItems(v.lotes).filter((r) => str(r.descricao) || str(r.lote));
    const preco = money(v.dcPreco);
    let n = 1;
    const blocks: Block[] = [
      { type: 'title', text: 'Anúncio de concurso', subtitle: procedimentoNome(v) },
      {
        type: 'paragraph',
        id: 'convite',
        text: `${n++}. ${aEntidade(entityName(ctx))}, através da sua Unidade Gestora Executora das Aquisições, convida os interessados a apresentar propostas em envelope fechado para ${objectoComArtigo(v)}${str(v.financiamento) ? `, com financiamento ${semPonto(v.financiamento).replace(/^(pelo|do|da|pela)\s+/i, 'do ')}` : ''}.`,
        en: 'The contracting body invites sealed bids for the stated object.',
      },
    ];
    if (lotes.length) {
      blocks.push(
        { type: 'paragraph', id: 'lotes', text: `${n++}. O concurso compreende os seguintes lotes, podendo os concorrentes apresentar proposta para um ou mais lotes:`, keepWithNext: true, en: 'Lots:' },
        {
          type: 'table',
          columns: [
            { label: 'Lote', width: 0.7, align: 'center' },
            { label: 'Descrição', width: 4.2 },
            { label: 'Garantia provisória', width: 1.6, align: 'right' },
          ],
          rows: lotes.map((r) => [str(r.lote), str(r.descricao), money(r.garantia) != null ? formatMoney(money(r.garantia)) : '—']),
        },
      );
    }
    if (str(v.elegibilidade)) blocks.push({ type: 'paragraph', id: 'elegibilidade', text: `${n++}. ${semPonto(v.elegibilidade)}.`, en: 'Eligibility.' });
    blocks.push({
      type: 'paragraph',
      id: 'dc',
      text: `${n++}. O documento de concurso pode ser consultado e obtido ${str(v.dcLocal) ? `na ${semPonto(v.dcLocal).replace(/^(na|no|a)\s+/i, '')}` : 'na entidade contratante'}${str(v.dcHorario) ? `, ${semPonto(v.dcHorario)}` : ''}, ${preco != null ? `mediante o pagamento da importância não reembolsável de ${formatMoney(preco)}${str(v.dcPagamento) ? `, por ${semPonto(v.dcPagamento).replace(/^por\s+/i, '')}` : ''}` : 'gratuitamente'}.`,
      en: 'Where and how to obtain the tender document.',
    });
    const conds = condicoesItems(v);
    if (lotes.length && money(v.garantiaProvisoria) == null) {
      const i = conds.findIndex((t) => t.startsWith('**Garantia provisória:**'));
      if (i >= 0) conds[i] = '**Garantia provisória:** a indicada para cada lote, prestada por depósito, garantia bancária ou seguro-caução.';
    }
    conds.forEach((t, i) => blocks.push({ type: 'paragraph', id: `condicao-${i + 1}`, text: `${n++}. ${t}`, en: 'Condition.' }));
    blocks.push(
      { type: 'paragraph', id: 'local', text: `${ctx.place}, ${dateLong(v.data)}.`, align: 'left', keepWithNext: true, en: 'Place and date.' },
      { type: 'signatures', columns: [signatarioColumn(v)] },
      ...rodapeBlocks(v),
    );
    return blocks;
  },
});
