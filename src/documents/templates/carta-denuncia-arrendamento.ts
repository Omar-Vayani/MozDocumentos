// Carta de denúncia / oposição à renovação do contrato de arrendamento: the
// tenant (or the landlord) tells the other party the lease will end. In urban
// leases the landlord's right to end the lease is limited by law and is
// exercised in court, so the landlord's letter only gives notice and invites an
// agreed termination.

import { addMonths, diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, formatMoney, l, localField, money } from './_shared';
import { int, partyName, partyWarnings, quantos, valorTexto } from './_contratos';
import {
  arrendamentoFields, assinaturaCarta, contratoTexto, destinatarioLinhas, papeisArrendamento, partyFieldsWhen, remetenteBlock, saudacaoParte, semPonto, str,
} from './_familia';

const MOTIVOS_SENHORIO = [
  { value: 'termo', label: l('Fim do prazo (sem outro motivo)', 'End of term (no other reason)') },
  { value: 'habitacao', label: l('Preciso do imóvel para habitação própria ou de filho', 'I need the property as my own or my child’s home') },
  { value: 'obras', label: l('Obras de ampliação ou reconstrução', 'Enlargement or rebuilding works') },
  { value: 'venda', label: l('Vou vender o imóvel', 'I am going to sell the property') },
  { value: 'outro', label: l('Outro motivo', 'Other reason') },
];

const MOTIVO_TEXTO: Record<string, string> = {
  habitacao: 'necessita do imóvel para a sua própria habitação ou de descendente',
  obras: 'pretende realizar no imóvel obras de ampliação ou reconstrução que exigem a sua desocupação',
  venda: 'pretende proceder à venda do imóvel livre de ocupantes',
};

export default defineTemplate({
  id: 'carta-denuncia-arrendamento',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Carta', 'Letter') },
    { id: 'inquilino', title: l('Inquilino', 'Tenant'), personRole: 'inquilino' },
    { id: 'senhorio', title: l('Senhorio', 'Landlord'), personRole: 'senhorio' },
    { id: 'contrato', title: l('Contrato e imóvel', 'Lease and property') },
    { id: 'fim', title: l('Fim do contrato', 'End of the lease') },
    { id: 'entrega', title: l('Entrega do imóvel e caução', 'Hand-over and deposit') },
  ],
  fields: [
    {
      name: 'remetente',
      type: 'radio',
      section: 'documento',
      required: true,
      label: l('Quem escreve a carta', 'Who writes the letter'),
      options: [
        { value: 'inquilino', label: l('O inquilino (quero sair)', 'The tenant (I want to leave)') },
        { value: 'senhorio', label: l('O senhorio (não quero renovar)', 'The landlord (I do not want to renew)') },
      ],
      default: (c) => (c.profile?.kind === 'empresa' ? 'senhorio' : 'inquilino'),
    },
    localField(),
    dateField('data', 'documento', l('Data da carta', 'Date of the letter')),
    { name: 'telefone', type: 'tel', section: 'documento', width: 'half', label: l('Telefone de quem escreve', 'Sender’s phone'), default: (c) => c.profile?.telefones || '' },
    ...partyFieldsWhen('inquilino', ['pessoa']),
    ...partyFieldsWhen('senhorio', ['empresa']),
    ...arrendamentoFields('contrato'),
    {
      name: 'duracaoMeses',
      type: 'number',
      section: 'contrato',
      width: 'half',
      min: 1,
      max: 600,
      label: l('Prazo do contrato (meses)', 'Lease term (months)'),
      help: l('Serve para calcular a antecedência mínima da lei.', 'Used to work out the minimum legal notice.'),
    },
    {
      name: 'avisoContrato',
      type: 'number',
      section: 'contrato',
      width: 'half',
      min: 0,
      max: 365,
      label: l('Aviso prévio previsto no contrato (dias)', 'Notice set in the lease (days)'),
      help: l('Veja a cláusula de denúncia do seu contrato. Deixe vazio se não houver.', 'See the termination clause of your lease. Leave empty if none.'),
    },
    {
      name: 'modalidade',
      type: 'radio',
      section: 'fim',
      required: true,
      label: l('Quando termina', 'When it ends'),
      options: [
        { value: 'termo', label: l('No fim do prazo (não renovar)', 'At the end of the term (no renewal)') },
        { value: 'antecipada', label: l('Antes do fim do prazo (saída antecipada)', 'Before the end of the term (early exit)') },
      ],
      default: 'termo',
      showIf: (v) => v.remetente !== 'senhorio',
      help: l('A saída antecipada só é possível se o contrato a permitir ou se o senhorio aceitar.', 'Leaving early is only possible if the lease allows it or the landlord agrees.'),
    },
    {
      name: 'dataFim',
      type: 'date',
      section: 'fim',
      width: 'half',
      required: true,
      label: l('Data em que o contrato termina', 'Date the lease ends'),
      default: (c) => addMonths(c.today, 2),
    },
    {
      name: 'motivoSenhorio',
      type: 'select',
      section: 'fim',
      label: l('Motivo', 'Reason'),
      options: MOTIVOS_SENHORIO,
      default: 'termo',
      showIf: (v) => v.remetente === 'senhorio',
    },
    {
      name: 'motivoOutro',
      type: 'text',
      section: 'fim',
      label: l('Descreva o motivo', 'Describe the reason'),
      placeholder: l('Ex.: o imóvel vai ser ocupado pelo meu filho, que regressa do estrangeiro', 'E.g. my son is returning from abroad and will live there'),
      showIf: (v) => v.remetente === 'senhorio' && v.motivoSenhorio === 'outro',
    },
    {
      name: 'arrendamentoUrbano',
      type: 'toggle',
      section: 'fim',
      default: true,
      label: l('É um arrendamento de casa, apartamento, loja ou escritório (urbano)', 'It is a lease of a house, flat, shop or office (urban)'),
      showIf: (v) => v.remetente === 'senhorio',
    },
    {
      name: 'dataEntregaChaves',
      type: 'date',
      section: 'entrega',
      width: 'half',
      label: l('Entrega das chaves (proposta)', 'Key hand-over (proposed)'),
      help: l('Deixe vazio para entregar no último dia do contrato.', 'Leave empty to hand over on the last day.'),
    },
    {
      name: 'vistoria',
      type: 'toggle',
      section: 'entrega',
      default: true,
      label: l('Pedir vistoria conjunta na entrega', 'Ask for a joint inspection at hand-over'),
    },
    {
      name: 'caucaoValor',
      type: 'money',
      section: 'entrega',
      width: 'half',
      label: l('Caução entregue no início (se houver)', 'Deposit paid at the start (if any)'),
    },
    {
      name: 'caucaoConta',
      type: 'text',
      section: 'entrega',
      width: 'half',
      label: l('Conta para devolução da caução', 'Account for the deposit refund'),
      placeholder: l('Ex.: NIB 0003 0000 1234 5678 9012 3 (BCI)', 'E.g. bank account or mobile wallet'),
      showIf: (v) => v.remetente !== 'senhorio',
    },
    {
      name: 'recibo',
      type: 'toggle',
      section: 'entrega',
      default: true,
      label: l('Incluir espaço para o destinatário assinar a recepção', 'Include a receipt line for the recipient'),
      help: l('Entregue a carta em mão e peça assinatura na sua cópia, ou envie por carta registada com aviso de recepção.', 'Hand-deliver and get your copy signed, or send by registered mail with proof of delivery.'),
    },
  ],

  computed: (v, ctx) => {
    const autor = v.remetente === 'senhorio' ? 'senhorio' : 'inquilino';
    const dest = autor === 'senhorio' ? 'inquilino' : 'senhorio';
    const antecedencia = v.data && v.dataFim ? diffDays(v.data, v.dataFim) : null;
    const meses = int(v.duracaoMeses);
    const L = ctx.legal.value<{ ate1AnoDias: number; ate6AnosDias: number; maisDe6AnosMeses: number }>('famDenunciaArrendamento');
    const minimoLegal = meses == null ? null : meses >= 72 ? L.maisDe6AnosMeses * 30 : meses >= 12 ? L.ate6AnosDias : meses >= 3 ? L.ate1AnoDias : Math.ceil((meses * 30) / 3);
    return { autor, dest, antecedencia, minimoLegal, aviso: int(v.avisoContrato) };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'inquilino', 'inquilino', 'tenant'), ...partyWarnings(v, 'senhorio', 'senhorio', 'landlord')];
    if (!str(v.imovelMorada)) w.push({ level: 'error', field: 'imovelMorada', message: l('Indique a morada do imóvel.', 'Enter the property address.') });
    if (!v.dataFim) w.push({ level: 'error', field: 'dataFim', message: l('Indique a data em que o contrato termina.', 'Enter the date the lease ends.') });
    if (c.antecedencia != null && c.antecedencia < 0) w.push({ level: 'error', field: 'dataFim', message: l('A data de fim é anterior à data da carta.', 'The end date is before the letter date.') });
    if (c.antecedencia != null && c.aviso != null && c.aviso > 0 && c.antecedencia < c.aviso) {
      w.push({
        level: 'warning',
        field: 'dataFim',
        message: l(
          `O contrato exige ${c.aviso} dias de aviso e esta carta dá ${c.antecedencia}. ${v.remetente === 'senhorio' ? 'A oposição pode não produzir efeito na data indicada.' : 'Pode ter de pagar as rendas do aviso em falta.'}`,
          `The lease requires ${c.aviso} days’ notice and this letter gives ${c.antecedencia}.`,
        ),
      });
    }
    if (c.antecedencia != null && c.minimoLegal != null && c.antecedencia < c.minimoLegal) {
      w.push({
        level: 'warning',
        field: 'dataFim',
        message: l(
          `Para um contrato deste prazo, a lei pede uma antecedência mínima de cerca de ${c.minimoLegal} dias antes do fim do prazo ou da renovação (${cite('famDenunciaArrendamento')}; valor a confirmar). Escolha uma data de fim mais tardia ou confirme com um jurista.`,
          `For a lease of this length the law asks for about ${c.minimoLegal} days’ notice before the end of the term (to be confirmed). Pick a later end date or check with a lawyer.`,
        ),
      });
    }
    if (v.remetente === 'senhorio' && v.arrendamentoUrbano) {
      w.push({
        level: 'warning',
        message: l(
          'Nos arrendamentos urbanos, o senhorio não pode pôr fim ao contrato apenas por chegar o fim do prazo: só pode denunciá-lo nos casos previstos na lei (por exemplo, para habitação própria ou obras) e através de acção judicial. Esta carta comunica a intenção e propõe uma saída por acordo; se o inquilino não aceitar, consulte um advogado ou o IPAJ. Nunca mude fechaduras nem corte a água ou a energia.',
          'In urban leases the landlord cannot end the lease just because the term ends: only in cases set by law (e.g. own housing, works) and through a court action. This letter states the intention and proposes an agreed exit; if the tenant refuses, see a lawyer or IPAJ. Never change locks or cut utilities.',
        ),
      });
    }
    if (v.remetente !== 'senhorio' && v.modalidade === 'antecipada') {
      w.push({
        level: 'info',
        field: 'modalidade',
        message: l('Confirme no contrato se pode sair antes do fim do prazo e com que aviso. Se o contrato for omisso, a saída antecipada depende do acordo do senhorio (pode usar o Acordo de revogação do arrendamento).', 'Check whether the lease allows leaving early and with what notice. If silent, an early exit needs the landlord’s agreement (see the lease termination agreement).'),
      });
    }
    w.push({ level: 'info', message: l('Guarde prova da entrega: assinatura do destinatário na sua cópia ou carta registada com aviso de recepção.', 'Keep proof of delivery: the recipient’s signature on your copy or registered mail with proof of delivery.') });
    return w;
  },

  personName: (v) => partyName(v, v.remetente === 'senhorio' ? 'inquilino' : 'senhorio') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const { S, I } = papeisArrendamento(v);
    const doSenhorio = c.autor === 'senhorio';
    const autor = doSenhorio ? S : I;
    const contrato = contratoTexto(v);
    const chaves = str(v.dataEntregaChaves) ? dateLong(v.dataEntregaChaves) : dateLong(v.dataFim);
    const caucao = money(v.caucaoValor);
    const aviso = c.aviso != null && c.aviso > 0 ? `, com a antecedência de ${quantos(c.aviso, 'dia', 'dias')} prevista no contrato` : '';

    const corpo: Block[] = [];
    if (!doSenhorio) {
      const antecipada = v.modalidade === 'antecipada';
      corpo.push({
        type: 'paragraph',
        id: 'comunicacao',
        text: antecipada
          ? `Na qualidade de ${I.n.toLowerCase()}, comunico a V. Ex.ª que denuncio ${contrato}, que cessará os seus efeitos em **${dateLong(v.dataFim)}**${aviso}.`
          : `Na qualidade de ${I.n.toLowerCase()}, comunico a V. Ex.ª que me oponho à renovação ${contratoTexto(v, 'do')}, que cessará os seus efeitos no termo do prazo em curso, em **${dateLong(v.dataFim)}**${aviso}.`,
        en: antecipada
          ? `As tenant, I give notice terminating the lease of the property above, effective ${v.dataFim || '—'}.`
          : `As tenant, I give notice that I will not renew the lease of the property above, which ends at the end of the current term, on ${v.dataFim || '—'}.`,
      });
      corpo.push({
        type: 'paragraph',
        id: 'rendas',
        text: `Pagarei as rendas e os consumos de água e energia até à data da cessação do contrato, apresentando os respectivos comprovativos na entrega do imóvel.`,
        en: 'I will pay the rent and utilities until the end date and show the receipts at hand-over.',
      });
    } else {
      const motivo = v.motivoSenhorio === 'outro' ? semPonto(v.motivoOutro) : MOTIVO_TEXTO[v.motivoSenhorio] ?? '';
      corpo.push({
        type: 'paragraph',
        id: 'comunicacao',
        text: `Na qualidade de ${S.n.toLowerCase()}, comunico a V. Ex.ª que não pretendo a renovação ${contratoTexto(v, 'do')}, pelo que é minha intenção que o contrato cesse no termo do prazo em curso, em **${dateLong(v.dataFim)}**${aviso}.`,
        en: `As landlord, I give notice that I do not wish to renew the lease of the property above and intend it to end at the end of the current term, on ${v.dataFim || '—'}.`,
      });
      if (motivo) {
        corpo.push({
          type: 'paragraph',
          id: 'motivo',
          text: `Esta decisão deve-se ao facto de ${S.f ? 'a signatária' : 'o signatário'} ${motivo.replace(/^que\s+/i, '')}.`,
          en: 'The reason is stated above.',
        });
      }
      corpo.push({
        type: 'paragraph',
        id: 'acordo',
        text: v.arrendamentoUrbano
          ? `Assim, proponho a V. Ex.ª a cessação do contrato por acordo nessa data, ficando disponível para combinar os termos da desocupação, nos termos e com os limites previstos na lei (${cite('famDenunciaArrendamento')}). Agradeço resposta escrita.`
          : 'Agradeço que o imóvel me seja restituído nessa data, livre de pessoas e bens.',
        en: v.arrendamentoUrbano ? 'I therefore propose ending the lease by agreement on that date and am available to agree the terms of vacating, within the limits set by law. Please reply in writing.' : 'Please return the property on that date, vacant.',
      });
    }

    const entrega = doSenhorio
      ? `${v.vistoria ? 'Proponho que, na data da entrega das chaves, se proceda a uma vistoria conjunta do imóvel, de que se lavrará auto assinado por ambos. ' : ''}${caucao != null ? `A caução de ${valorTexto(caucao)} será restituída após a entrega do imóvel, deduzida dos montantes que comprovadamente forem devidos.` : ''}`.trim()
      : `Proponho entregar as chaves em ${chaves}${v.vistoria ? ', procedendo-se nessa data a uma vistoria conjunta do imóvel, de que se lavrará auto assinado por ambos' : ''}.${caucao != null ? ` Solicito a restituição da caução de ${valorTexto(caucao)} após a entrega do imóvel, deduzida apenas dos montantes que comprovadamente forem devidos${str(v.caucaoConta) ? `, para a conta ${str(v.caucaoConta)}` : ''}.` : ''}`;
    if (entrega) {
      corpo.push({
        type: 'paragraph',
        id: 'entrega',
        text: entrega,
        en: `${doSenhorio ? '' : `I propose to hand over the keys on ${v.dataEntregaChaves || v.dataFim || '—'}. `}${v.vistoria ? 'A joint inspection will be recorded. ' : ''}${caucao != null ? `The deposit of ${formatMoney(caucao)} is to be returned after hand-over, less proven amounts due.` : ''}`,
      });
    }

    const blocks: Block[] = [
      ...remetenteBlock(ctx, c.autor, v.telefone),
      { type: 'reference', ref: undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', salutation: saudacaoParte(v, c.dest), lines: destinatarioLinhas(v, c.dest) },
      {
        type: 'subject',
        text: doSenhorio
          ? 'Comunicação de oposição à renovação do contrato de arrendamento'
          : v.modalidade === 'antecipada'
            ? 'Denúncia do contrato de arrendamento'
            : 'Oposição à renovação do contrato de arrendamento',
      },
      { type: 'salutation', text: `${saudacaoParte(v, c.dest)},` },
      ...corpo,
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, editable: false },
      { type: 'signatures', columns: [assinaturaCarta(ctx, c.autor, autor)] },
    ];
    if (v.recibo) {
      blocks.push({ type: 'acknowledgement', text: 'Recebi o original desta carta em ___/___/______', signer: c.dest === 'senhorio' ? S.O : I.O });
    }
    return blocks;
  },
});
