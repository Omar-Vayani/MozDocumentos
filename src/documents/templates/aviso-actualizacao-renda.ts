// Aviso de actualização de renda: the landlord tells the tenant the new rent.
// No statutory annual coefficient was found in Mozambique, so the increase is
// either applied under a clause of the lease or proposed for the tenant's
// acceptance (with a tear-off reply slip).

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, formatMoney, l, localField, money } from './_shared';
import { partyName, partyWarnings, valorTexto } from './_contratos';
import {
  arrendamentoFields, assinaturaCarta, contratoTexto, destinatarioLinhas, papeisArrendamento, partyFieldsWhen, remetenteBlock, saudacaoParte, semPonto, str,
} from './_familia';

export default defineTemplate({
  id: 'aviso-actualizacao-renda',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Carta', 'Letter') },
    { id: 'senhorio', title: l('Senhorio (quem escreve)', 'Landlord (sender)'), personRole: 'senhorio' },
    { id: 'inquilino', title: l('Inquilino', 'Tenant'), personRole: 'inquilino' },
    { id: 'contrato', title: l('Contrato e imóvel', 'Lease and property') },
    { id: 'renda', title: l('Nova renda', 'New rent') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data da carta', 'Date of the letter')),
    { name: 'telefone', type: 'tel', section: 'documento', width: 'half', label: l('Telefone do senhorio', 'Landlord’s phone'), default: (c) => c.profile?.telefones || '' },
    ...partyFieldsWhen('senhorio', ['pessoa', 'empresa']),
    ...partyFieldsWhen('inquilino', []),
    ...arrendamentoFields('contrato', { renda: true }),
    {
      name: 'fundamento',
      type: 'radio',
      section: 'renda',
      required: true,
      label: l('Base do aumento', 'Basis of the increase'),
      options: [
        { value: 'clausula', label: l('O contrato prevê a actualização', 'The lease provides for the increase') },
        { value: 'proposta', label: l('Proposta ao inquilino (precisa do acordo dele)', 'Proposal to the tenant (needs their agreement)') },
      ],
      default: 'clausula',
      help: l('Se o contrato nada diz, o aumento só vale se o inquilino aceitar.', 'If the lease says nothing, the increase only applies if the tenant agrees.'),
    },
    {
      name: 'clausula',
      type: 'text',
      section: 'renda',
      width: 'half',
      label: l('Cláusula do contrato', 'Clause of the lease'),
      placeholder: l('Ex.: Cláusula Quarta, n.º 5', 'E.g. Clause 4(5)'),
      showIf: (v) => v.fundamento === 'clausula',
    },
    { name: 'novaRenda', type: 'money', section: 'renda', width: 'half', required: true, label: l('Nova renda mensal', 'New monthly rent') },
    { name: 'dataInicio', type: 'date', section: 'renda', width: 'half', required: true, label: l('A partir da renda de (data)', 'Starting with the rent due on') },
    {
      name: 'justificacao',
      type: 'textarea',
      section: 'renda',
      rows: 2,
      label: l('Justificação (opcional)', 'Reason (optional)'),
      placeholder: l('Ex.: aumento do custo de vida e das despesas de manutenção do prédio no último ano.', 'E.g. higher cost of living and building maintenance costs over the last year.'),
    },
    { name: 'respostaAte', type: 'date', section: 'renda', width: 'half', label: l('Resposta até', 'Reply by'), showIf: (v) => v.fundamento === 'proposta' },
  ],

  computed: (v) => {
    const actual = money(v.rendaMensal);
    const nova = money(v.novaRenda);
    const pctAumento = actual && nova ? ((nova - actual) / actual) * 100 : null;
    return { actual, nova, pctAumento };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'senhorio', 'senhorio', 'landlord'), ...partyWarnings(v, 'inquilino', 'inquilino', 'tenant')];
    if (c.nova == null) w.push({ level: 'error', field: 'novaRenda', message: l('Indique a nova renda.', 'Enter the new rent.') });
    if (c.actual != null && c.nova != null && c.nova <= c.actual) w.push({ level: 'warning', field: 'novaRenda', message: l('A nova renda não é superior à actual.', 'The new rent is not higher than the current one.') });
    if (v.data && v.dataInicio && diffDays(v.data, v.dataInicio) < 30) {
      w.push({ level: 'warning', field: 'dataInicio', message: l('Dê ao inquilino um aviso razoável (pelo menos um mês) e respeite a antecedência prevista no contrato.', 'Give the tenant reasonable notice (at least a month) and any notice set in the lease.') });
    }
    w.push({
      level: 'info',
      field: 'fundamento',
      message: l(
        `Não há em Moçambique um coeficiente legal de actualização das rendas (${cite('famActualizacaoRenda')}; a confirmar). A renda só sobe nos termos do contrato ou por acordo; durante o prazo em curso, o inquilino que não aceite continua a pagar a renda acordada.`,
        'Mozambique has no statutory rent-increase coefficient (to be confirmed). Rent rises only under the lease or by agreement; during the current term a tenant who refuses keeps paying the agreed rent.',
      ),
    });
    return w;
  },

  personName: (v) => partyName(v, 'inquilino') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const { S, I } = papeisArrendamento(v);
    const proposta = v.fundamento === 'proposta';
    const pctTxt = c.pctAumento != null && c.pctAumento > 0 ? ` (aumento de ${c.pctAumento.toFixed(1).replace('.', ',')} por cento)` : '';
    const just = semPonto(v.justificacao);

    const corpo: Block[] = [
      {
        type: 'paragraph',
        id: 'aviso',
        text: proposta
          ? `Na qualidade de ${S.n.toLowerCase()} e relativamente ${contratoTexto(v, 'ao')}, proponho a V. Ex.ª a actualização da renda mensal de ${valorTexto(c.actual)} para ${valorTexto(c.nova)}${pctTxt}, a partir da renda que se vence em ${dateLong(v.dataInicio)}.`
          : `Na qualidade de ${S.n.toLowerCase()} e nos termos ${str(v.clausula) ? `da ${semPonto(v.clausula)}` : 'da cláusula de actualização'} ${contratoTexto(v, 'do')}, comunico a V. Ex.ª que a renda mensal é actualizada de ${valorTexto(c.actual)} para ${valorTexto(c.nova)}${pctTxt}, a partir da renda que se vence em ${dateLong(v.dataInicio)}.`,
        en: `${proposta ? 'I propose' : 'Under the lease, I give notice of'} a rent increase from ${c.actual != null ? formatMoney(c.actual) : '—'} to ${c.nova != null ? formatMoney(c.nova) : '—'} starting with the rent due on ${v.dataInicio || '—'}.`,
      },
    ];
    if (just) corpo.push({ type: 'paragraph', id: 'justificacao', text: `Esta actualização justifica-se pelo seguinte: ${just.charAt(0).toLowerCase()}${just.slice(1)}.`, en: 'The reason for the increase is stated above.' });
    corpo.push({
      type: 'paragraph',
      id: 'restante',
      text: proposta
        ? `Agradeço que me comunique por escrito se aceita a nova renda${str(v.respostaAte) ? ` até ${dateLong(v.respostaAte)}` : ''}, podendo usar o destacável abaixo. Mantêm-se inalteradas as demais condições do contrato.`
        : 'Mantêm-se inalteradas as demais condições do contrato, incluindo a forma e a data de pagamento da renda.',
      en: proposta ? 'Please confirm in writing whether you accept, using the slip below. All other terms stay the same.' : 'All other terms of the lease, including how and when rent is paid, stay the same.',
    });

    const blocks: Block[] = [
      ...remetenteBlock(ctx, 'senhorio', v.telefone),
      { type: 'reference', ref: undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', salutation: saudacaoParte(v, 'inquilino'), lines: destinatarioLinhas(v, 'inquilino') },
      { type: 'subject', text: proposta ? 'Proposta de actualização da renda' : 'Actualização da renda' },
      { type: 'salutation', text: `${saudacaoParte(v, 'inquilino')},` },
      ...corpo,
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, editable: false },
      { type: 'signatures', columns: [assinaturaCarta(ctx, 'senhorio', S)] },
    ];
    if (proposta) {
      blocks.push({
        type: 'box',
        cut: true,
        label: `Resposta ${I.de}`,
        text: `Eu, ${partyName(v, 'inquilino') || '____________________'}, ${I.n.toLowerCase()} do imóvel sito em ${semPonto(v.imovelMorada) || '____________________'}:\n☐ Aceito a nova renda mensal de ${c.nova != null ? formatMoney(c.nova) : '____________ MT'}, a partir de ${dateLong(v.dataInicio)}.\n☐ Não aceito a actualização proposta.\n\nData: ___/___/______          Assinatura: ______________________________`,
      });
    } else {
      blocks.push({ type: 'acknowledgement', text: 'Recebi o original desta carta em ___/___/______', signer: I.O });
    }
    return blocks;
  },
});
