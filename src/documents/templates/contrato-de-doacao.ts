// Contrato de doação de bens móveis ou de dinheiro. A gift of real estate
// needs a notarial deed and is not produced here.

import { roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  assinatura, conjugeColumn, consentimentoTexto, documentoFields, fecho, lines, numerar, papel, partesBlocks, partyFields, partyName, partyWarnings, semPonto,
  str, testemunhasField, valorTexto,
} from './_contratos';

const IMOVEL = /\b(casa|moradia|terreno|talh[aã]o|im[oó]vel|pr[eé]dio|apartamento|flat|fracç[aã]o|machamba|duat)\b/i;

export default defineTemplate({
  id: 'contrato-de-doacao',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'doador', title: l('Doador (quem dá)', 'Donor'), personRole: 'outro' },
    { id: 'donatario', title: l('Donatário (quem recebe)', 'Recipient'), personRole: 'outro' },
    {
      id: 'objecto',
      title: l('O que é doado', 'What is given'),
      description: l('Só dinheiro ou bens móveis. A doação de casas ou terrenos exige escritura pública no notário.', 'Money or movable goods only. Gifts of houses or land require a notarial deed.'),
    },
    { id: 'clausulas', title: l('Condições e assinaturas', 'Conditions and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('doador', { fromProfile: true, conjuge: true }),
    ...partyFields('donatario'),

    {
      name: 'objectoTipo',
      type: 'radio',
      section: 'objecto',
      label: l('Doação de', 'Gift of'),
      options: [
        { value: 'bens', label: l('Bens (equipamento, mobiliário, material)', 'Goods (equipment, furniture, materials)') },
        { value: 'dinheiro', label: l('Dinheiro', 'Money') },
      ],
      default: 'bens',
    },
    { name: 'valor', type: 'money', section: 'objecto', width: 'half', label: l('Quantia doada', 'Amount given'), showIf: (v) => v.objectoTipo === 'dinheiro' },
    {
      name: 'bens',
      type: 'lines',
      section: 'objecto',
      label: l('Bens doados', 'Goods given'),
      addLabel: l('Adicionar bem', 'Add item'),
      showIf: (v) => v.objectoTipo !== 'dinheiro',
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'quantidade', type: 'number', label: l('Quant.', 'Qty'), min: 1 },
        { name: 'valorEstimado', type: 'money', label: l('Valor estimado', 'Estimated value') },
      ],
      default: [{ descricao: '', quantidade: 1, valorEstimado: '' }],
    },
    {
      name: 'entrega',
      type: 'radio',
      section: 'objecto',
      label: l('Entrega', 'Handover'),
      options: [
        { value: 'agora', label: l('Entregues nesta data', 'Handed over today') },
        { value: 'futura', label: l('Entrega posterior', 'Later handover') },
      ],
      default: 'agora',
    },
    { name: 'dataEntrega', type: 'date', section: 'objecto', width: 'half', label: l('Data de entrega', 'Handover date'), showIf: (v) => v.entrega === 'futura' },
    { name: 'localEntrega', type: 'text', section: 'objecto', width: 'half', label: l('Local de entrega', 'Handover place'), showIf: (v) => v.entrega === 'futura' },

    {
      name: 'encargo',
      type: 'toggle',
      section: 'clausulas',
      label: l('A doação tem um encargo ou fim obrigatório', 'The gift comes with a condition or required use'),
      help: l('Ex.: os computadores destinam-se exclusivamente à sala de informática da escola.', 'E.g. the computers are only for the school’s IT room.'),
    },
    { name: 'encargoTexto', type: 'textarea', section: 'clausulas', rows: 2, label: l('Encargo', 'Condition'), showIf: (v) => Boolean(v.encargo) },
    {
      name: 'beneficente',
      type: 'toggle',
      section: 'clausulas',
      label: l('Doação com fim de caridade, assistência ou beneficência', 'Charitable, assistance or benevolent gift'),
      help: l('Ex.: doação a uma escola, hospital, associação ou comunidade.', 'E.g. a gift to a school, hospital, association or community.'),
    },
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const bens = lines(v.bens)
      .filter((r) => str(r.descricao))
      .map((r) => {
        const q = Number(r.quantidade) > 0 ? Number(r.quantidade) : 1;
        return { descricao: str(r.descricao), q, valor: money(r.valorEstimado) };
      });
    const total = v.objectoTipo === 'dinheiro' ? money(v.valor) : bens.some((b) => b.valor != null) ? roundMoney(bens.reduce((s, b) => s + (b.valor ?? 0), 0)) : null;
    return { bens, total };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'doador', 'doador', 'donor', { conjuge: true }), ...partyWarnings(v, 'donatario', 'donatário', 'recipient')];
    if (v.objectoTipo === 'dinheiro' && c.total == null) w.push({ level: 'error', field: 'valor', message: l('Indique a quantia doada.', 'Enter the amount.') });
    if (v.objectoTipo !== 'dinheiro' && !c.bens.length) w.push({ level: 'error', field: 'bens', message: l('Indique os bens doados.', 'List the goods.') });
    if (c.bens.some((b: { descricao: string }) => IMOVEL.test(b.descricao))) {
      w.push({
        level: 'error',
        field: 'bens',
        message: l(
          `A doação de imóveis exige escritura pública (${cite('doacaoForma')}). Dirija-se ao notário. A terra não pode ser doada; só as benfeitorias, com autorização do Estado.`,
          'A gift of real estate requires a notarial deed. Go to a notary. Land cannot be given; only improvements, with State authorisation.',
        ),
      });
    }
    w.push({
      level: 'info',
      message: v.beneficente
        ? l(`As doações com fim de caridade, assistência ou beneficência estão excluídas do imposto sobre doações (${cite('impostoDoacoes')}). Guarde este contrato como comprovativo.`, 'Charitable gifts are excluded from gift tax. Keep this contract as proof.')
        : l(`A doação pode estar sujeita ao imposto sobre sucessões e doações (${cite('impostoDoacoes')}). Confirme na Direcção de Área Fiscal.`, 'The gift may be subject to gift tax. Check with the tax office.'),
    });
    return w;
  },

  personName: (v) => partyName(v, 'donatario') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const D = papel(v, 'doador', 'Doador', 'Doadora');
    const R = papel(v, 'donatario', 'Donatário', 'Donatária');
    const dinheiro = v.objectoTipo === 'dinheiro';

    const clauses: ClauseItem[] = [];
    clauses.push({
      id: 'objecto',
      heading: 'Objecto',
      text: dinheiro
        ? `Pelo presente contrato, ${D.o}, por espírito de liberalidade, doa ${R.ao}, que aceita, a quantia de ${valorTexto(c.total)}.`
        : `Pelo presente contrato, ${D.o}, por espírito de liberalidade, doa ${R.ao}, que aceita, os bens descritos no Anexo, que faz parte integrante do presente contrato${c.total != null ? `, com o valor global estimado de ${valorTexto(c.total)}` : ''}.`,
      en: dinheiro ? `The Donor gives the Recipient ${c.total != null ? formatMoney(c.total) : '—'}, and the Recipient accepts.` : 'The Donor gives the Recipient the goods listed in the Annex, and the Recipient accepts.',
    });
    clauses.push({
      id: 'entrega',
      heading: 'Entrega',
      text: numerar([
        v.entrega === 'futura'
          ? `${dinheiro ? 'A quantia doada é entregue' : 'Os bens são entregues'} ${R.ao} em ${dateLong(v.dataEntrega)}${str(v.localEntrega) ? `, em ${semPonto(v.localEntrega)}` : ''}${dinheiro ? '' : ', mediante termo de entrega assinado por ambas as partes'}.`
          : `${dinheiro ? 'A quantia doada foi entregue' : 'Os bens foram entregues'} ${R.ao} nesta data, que declara ${dinheiro ? 'tê-la' : 'tê-los'} recebido.`,
        dinheiro ? '' : `A partir da entrega, ${R.o} fica responsável pela guarda, conservação e utilização dos bens, que recebe no estado em que se encontram.`,
      ]),
      en: v.entrega === 'futura' ? `Handover on ${v.dataEntrega || '—'}.` : 'Handed over today; receipt acknowledged.',
    });
    if (v.encargo) {
      clauses.push({
        id: 'encargo',
        heading: 'Encargo',
        text: `A presente doação é feita com o seguinte encargo, que ${R.o} aceita: ${semPonto(v.encargoTexto) || BLANK}.`,
        en: `The gift is subject to this condition: ${v.encargoTexto || '—'}.`,
      });
    }
    clauses.push({
      id: 'aceitacao',
      heading: 'Aceitação',
      text: numerar([
        `${R.O} declara aceitar a presente doação nos termos exarados.`,
        v.beneficente ? `A presente doação é feita com fim de ${dinheiro ? 'apoio' : 'assistência'} e beneficência, para prossecução das actividades ${R.de}.` : '',
      ]),
      en: `The Recipient accepts the gift.${v.beneficente ? ' It is made for charitable purposes.' : ''}`,
    });
    clauses.push({
      id: 'lei',
      heading: 'Lei aplicável',
      text: 'Em tudo o que não estiver previsto no presente contrato aplicam-se as disposições da lei civil sobre a doação.',
      en: 'Civil law on gifts applies to anything not covered.',
    });

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de doação' },
      ...partesBlocks(v, [
        { p: 'doador', role: D, en: 'Donor' },
        { p: 'donatario', role: R, en: 'Recipient' },
      ]),
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'É celebrado e reciprocamente aceite o presente contrato de doação, que se rege pelas cláusulas seguintes:',
        en: 'This gift agreement is entered into on the following terms:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fecho(ctx, [assinatura(ctx, 'doador', D, true), assinatura(ctx, 'donatario', R)], { extraCols: [conjugeColumn(v, 'doador')],
          consentimento: consentimentoTexto(v, 'doador', D) }),
    ];
    if (!dinheiro) {
      blocks.push(
        { type: 'heading', text: 'Anexo — Bens doados', keepWithNext: true },
        {
          type: 'table',
          columns: [
            { label: 'N.º', width: 0.5, align: 'right' },
            { label: 'Descrição', width: 4 },
            { label: 'Quant.', width: 0.8, align: 'right' },
            { label: 'Valor estimado', width: 1.5, align: 'right' },
          ],
          rows: c.bens.length
            ? c.bens.map((b: { descricao: string; q: number; valor: number | null }, i: number) => [String(i + 1), b.descricao, String(b.q), b.valor != null ? formatMoney(b.valor, false) : '—'])
            : [['1', BLANK, '', '']],
          totals: c.total != null ? [['', 'Total, em MT', '', formatMoney(c.total, false)]] : undefined,
        },
      );
    }
    return blocks;
  },
});
