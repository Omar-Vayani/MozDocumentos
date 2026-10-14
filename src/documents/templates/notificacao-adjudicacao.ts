// Notificação de adjudicação: the contracting body tells the winning bidder of
// the award and asks for the performance security and the documents required
// before the contract is signed.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, l, lineItems, localField, money } from './_shared';
import { estadoRef, numeroField, rodapeBlocks, rodapeFields, signatarioColumn, signatarioFields, tagsBlocks } from './_estado';
import { diasTexto, empresaDestBlock, empresaDestFields, entidadeProfileWarning, objectoComArtigo, procedimentoFields, procedimentoNome, semPonto, str, valorTexto } from './_contratacao';

export default defineTemplate({
  id: 'notificacao-adjudicacao',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Número, local e data', 'Number, place and date') },
    { id: 'destinatario', title: l('Adjudicatário', 'Successful bidder') },
    { id: 'procedimento', title: l('Concurso e adjudicação', 'Tender and award') },
    { id: 'requisitos', title: l('Garantia e documentos', 'Security and documents') },
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
    { name: 'valor', type: 'money', section: 'procedimento', width: 'half', required: true, label: l('Valor adjudicado', 'Amount awarded') },
    { name: 'ivaIncluido', type: 'toggle', section: 'procedimento', width: 'half', default: true, label: l('Valor com IVA incluído', 'Amount includes VAT') },
    { name: 'prazoDias', type: 'number', section: 'requisitos', width: 'half', min: 1, max: 60, label: l('Prazo para apresentar (dias)', 'Time to submit (days)'), help: l('O prazo fixado no documento de concurso.', 'The time set in the tender document.') },
    { name: 'garantiaValor', type: 'money', section: 'requisitos', width: 'half', label: l('Garantia definitiva (vazio = não exigida)', 'Performance security (empty = none)') },
    {
      name: 'documentos',
      type: 'lines',
      section: 'requisitos',
      label: l('Documentos a apresentar', 'Documents to submit'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: [
        { descricao: 'Certidão de quitação da Autoridade Tributária, válida' },
        { descricao: 'Declaração de situação contributiva regularizada no INSS' },
        { descricao: 'Declaração do beneficiário efectivo, em papel e em formato digital' },
        { descricao: 'Certidão de inscrição no Cadastro Único, actualizada' },
      ],
    },
    { name: 'contratoData', type: 'date', section: 'requisitos', width: 'half', label: l('Assinatura do contrato prevista para (opcional)', 'Contract signing planned for (optional)') },
    { name: 'contratoLocal', type: 'text', section: 'requisitos', width: 'half', label: l('Local da assinatura (opcional)', 'Place of signing (optional)') },
    ...signatarioFields(),
    ...rodapeFields(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...entidadeProfileWarning(ctx)];
    if (!str(v.destEmpresa)) w.push({ level: 'warning', field: 'destEmpresa', message: l('Indique o adjudicatário.', 'Enter the successful bidder.') });
    if (money(v.valor) == null) w.push({ level: 'error', field: 'valor', message: l('Indique o valor adjudicado.', 'Enter the amount awarded.') });
    const be = ctx.legal.value<number>('beneficiarioEfectivoConcurso');
    w.push({ level: 'info', field: 'documentos', message: l(`A declaração do beneficiário efectivo é entregue antes da assinatura do contrato, no prazo de ${be} dias úteis (${cite('beneficiarioEfectivoConcurso')}).`, `The beneficial owner declaration is due before signing, within ${be} working days.`) });
    w.push({ level: 'info', message: l(`Notifique a decisão também aos restantes concorrentes, com o prazo para reclamar (${cite('ctAdjudicacao')}).`, 'Also notify the other bidders, with the time to complain.') });
    return w;
  },

  personName: (v) => v.destEmpresa,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const docs = lineItems(v.documentos).map((r) => str(r.descricao)).filter(Boolean);
    const gv = money(v.garantiaValor);
    const lista = [...(gv != null ? [`garantia definitiva no valor de ${valorTexto(gv).replace(/\*\*/g, '')}, por garantia bancária, seguro-caução ou depósito`] : []), ...docs].map((d, i, a) => `${semPonto(d)}${i === a.length - 1 ? '.' : ';'}`);
    const desp = v.dataDespacho ? `por despacho de ${dateLong(v.dataDespacho)}${str(v.autoridade) ? ` ${/^(do|da)\s/i.test(str(v.autoridade)) ? '' : 'do '}${semPonto(v.autoridade)}` : ''}, ` : '';
    const blocks: Block[] = [
      ...tagsBlocks(v),
      { type: 'reference', ref: estadoRef(ctx, 'Ofício'), place: ctx.place, date: dateLong(v.data) },
      empresaDestBlock(v),
      { type: 'subject', text: `Notificação de adjudicação — ${procedimentoNome(v)}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'adjudicacao',
        text: `1. Comunicamos a V. Exas. que, ${desp}foi adjudicado a essa empresa o ${procedimentoNome(v)}, para ${objectoComArtigo(v)}, pelo valor de ${valorTexto(money(v.valor))}${v.ivaIncluido !== false ? ', com IVA incluído' : ''}.`,
        en: 'We inform you that the tender was awarded to your company for the stated amount.',
      },
    ];
    if (lista.length) {
      blocks.push(
        { type: 'paragraph', id: 'documentos', text: `2. Nos termos do documento de concurso, devem V. Exas., no prazo de ${diasTexto(v.prazoDias)} contados da recepção da presente notificação, apresentar:`, keepWithNext: true, en: 'Within the stated time, please submit:' },
        { type: 'list', style: 'alpha', items: lista },
      );
    }
    const n = lista.length ? 3 : 2;
    blocks.push(
      {
        type: 'paragraph',
        id: 'contrato',
        text: `${n}. Cumpridas estas formalidades, V. Exas. serão convocados para a assinatura do contrato${v.contratoData ? `, prevista para ${dateLong(v.contratoData)}` : ''}${str(v.contratoLocal) ? `, em ${semPonto(v.contratoLocal)}` : ''}.`,
        en: 'You will then be called to sign the contract.',
      },
      {
        type: 'paragraph',
        id: 'caducidade',
        text: `${n + 1}. A falta de apresentação da garantia e dos documentos exigidos no prazo fixado, ou a recusa em assinar o contrato, determina a caducidade da adjudicação, podendo a entidade contratante adjudicar ao concorrente classificado em lugar seguinte e executar a garantia provisória.`,
        en: 'Failing this, the award lapses and may go to the next-ranked bidder; the bid security may be called.',
      },
      { type: 'paragraph', id: 'fecho', text: 'Melhores cumprimentos.', align: 'left', keepWithNext: true, en: 'Best regards.' },
      { type: 'signatures', columns: [signatarioColumn(v)] },
      ...rodapeBlocks(v),
      { type: 'acknowledgement', text: 'Recebi a presente notificação em ___/___/______', signer: 'Pelo adjudicatário' },
    );
    return blocks;
  },
});
