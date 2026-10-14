// Contrato de arrendamento de quarto: lease of a room in a house or flat, with
// shared use of kitchen, bathroom and living room, house rules and utilities.
// Common for students and workers who move to another city.

import { addDays, addMonths, roundMoney } from '@/lib/format';
import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, l, lineItems, money, splitLines } from './_shared';
import {
  assinatura, clausulasFinais, documentoFields, fecho, foroField, int, juntar, numerar, partesBlocks, partyName, partyWarnings, quantos, testemunhasField, valorTexto,
} from './_contratos';
import { fechoJunto, itensLista, papeisArrendamento, partyFieldsWhen, semPonto, str } from './_familia';

const REGRAS_DEFAULT = [
  'Silêncio entre as 22h00 e as 06h00',
  'Cada ocupante limpa o seu quarto e deixa limpos os espaços comuns depois de os usar',
  'Visitas até às 21h00; pernoita de visitas só com acordo prévio do Senhorio',
  'É proibido fumar dentro de casa',
  'Não é permitido ter animais sem autorização',
].join('\n');

export default defineTemplate({
  id: 'contrato-arrendamento-quarto',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'senhorio', title: l('Senhorio', 'Landlord'), description: l('Os dados vêm do seu perfil pessoal.', 'Details come from your personal profile.'), personRole: 'senhorio' },
    { id: 'inquilino', title: l('Inquilino (quem fica com o quarto)', 'Tenant (room occupant)'), personRole: 'inquilino' },
    { id: 'quarto', title: l('Quarto e espaços comuns', 'Room and shared areas') },
    { id: 'prazo', title: l('Prazo', 'Term') },
    { id: 'renda', title: l('Renda, consumos e caução', 'Rent, utilities and deposit') },
    { id: 'regras', title: l('Regras da casa', 'House rules') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFieldsWhen('senhorio', ['pessoa', 'empresa']),
    ...partyFieldsWhen('inquilino', []),
    { name: 'imovelMorada', type: 'text', section: 'quarto', required: true, label: l('Morada da casa', 'Address of the house') },
    {
      name: 'quartoDescricao',
      type: 'text',
      section: 'quarto',
      required: true,
      label: l('Quarto', 'Room'),
      placeholder: l('Ex.: quarto n.º 2, com janela para a rua e roupeiro embutido', 'E.g. room 2, street-facing window, built-in wardrobe'),
    },
    { name: 'casaBanhoPrivativa', type: 'toggle', section: 'quarto', label: l('Com casa de banho privativa', 'With private bathroom') },
    {
      name: 'espacosComuns',
      type: 'text',
      section: 'quarto',
      label: l('Espaços de uso comum', 'Shared areas'),
      default: 'cozinha, sala, casa de banho e quintal',
    },
    { name: 'senhorioResideNaCasa', type: 'toggle', section: 'quarto', default: true, label: l('O senhorio também vive na casa', 'The landlord also lives in the house') },
    {
      name: 'mobilia',
      type: 'lines',
      section: 'quarto',
      label: l('Mobília do quarto (opcional)', 'Room furniture (optional)'),
      addLabel: l('Adicionar artigo', 'Add item'),
      columns: [
        { name: 'item', type: 'text', label: l('Artigo', 'Item') },
        { name: 'quantidade', type: 'number', label: l('Quant.', 'Qty'), min: 1 },
      ],
      default: [],
    },
    { name: 'dataInicio', type: 'date', section: 'prazo', width: 'half', required: true, label: l('Início', 'Start date'), default: (c) => c.today },
    { name: 'duracaoMeses', type: 'number', section: 'prazo', width: 'half', min: 1, max: 60, default: 6, required: true, label: l('Duração (meses)', 'Term (months)') },
    { name: 'renovacao', type: 'toggle', section: 'prazo', default: true, label: l('Renova-se por iguais períodos', 'Renews for equal periods') },
    { name: 'avisoDias', type: 'number', section: 'prazo', width: 'half', min: 1, max: 180, default: 30, label: l('Aviso prévio para sair (dias)', 'Notice to leave (days)') },
    { name: 'rendaMensal', type: 'money', section: 'renda', width: 'half', required: true, label: l('Renda mensal', 'Monthly rent') },
    { name: 'diaPagamento', type: 'number', section: 'renda', width: 'half', min: 1, max: 31, default: 5, label: l('Pagar até ao dia', 'Pay by day') },
    { name: 'formaPagamento', type: 'select', section: 'renda', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'M-Pesa' },
    { name: 'conta', type: 'text', section: 'renda', width: 'half', label: l('Conta ou número do senhorio', 'Landlord’s account or number') },
    {
      name: 'consumos',
      type: 'select',
      section: 'renda',
      label: l('Água, energia e internet', 'Water, electricity and internet'),
      options: [
        { value: 'incluidos', label: l('Incluídos na renda', 'Included in the rent') },
        { value: 'divididos', label: l('Divididos entre os ocupantes', 'Shared between occupants') },
        { value: 'fixo', label: l('Valor fixo mensal à parte', 'Fixed monthly amount on top') },
      ],
      default: 'incluidos',
    },
    { name: 'consumosValor', type: 'money', section: 'renda', width: 'half', label: l('Valor fixo de consumos', 'Fixed utilities amount'), showIf: (v) => v.consumos === 'fixo' },
    { name: 'consumosLimite', type: 'text', section: 'renda', label: l('Limite de consumo (opcional)', 'Usage limit (optional)'), placeholder: l('Ex.: até 100 kWh de energia por mês', 'E.g. up to 100 kWh a month'), showIf: (v) => v.consumos === 'incluidos' },
    { name: 'caucaoValor', type: 'money', section: 'renda', width: 'half', label: l('Caução (opcional)', 'Deposit (optional)') },
    {
      name: 'regras',
      type: 'textarea',
      section: 'regras',
      rows: 6,
      label: l('Regras da casa', 'House rules'),
      help: l('Uma regra por linha.', 'One rule per line.'),
      default: REGRAS_DEFAULT,
    },
    { name: 'chaves', type: 'text', section: 'regras', label: l('Chaves entregues', 'Keys handed over'), default: 'uma chave da porta principal e uma chave do quarto' },
    foroField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const meses = int(v.duracaoMeses) ?? 0;
    const inicio = str(v.dataInicio);
    return {
      renda: money(v.rendaMensal),
      meses,
      dataFim: inicio && meses > 0 ? addDays(addMonths(inicio, meses), -1) : '',
      mobilia: lineItems(v.mobilia).filter((r) => str(r.item)),
      regras: splitLines(v.regras),
    };
  },

  warnings: (v, { computed: c, legal }) => {
    const w: Warning[] = [...partyWarnings(v, 'senhorio', 'senhorio', 'landlord'), ...partyWarnings(v, 'inquilino', 'inquilino', 'tenant')];
    if (c.renda == null) w.push({ level: 'error', field: 'rendaMensal', message: l('Indique a renda mensal.', 'Enter the monthly rent.') });
    if (!str(v.quartoDescricao)) w.push({ level: 'warning', field: 'quartoDescricao', message: l('Identifique o quarto.', 'Identify the room.') });
    if (c.renda != null && c.renda > 0) {
      w.push({
        level: 'info',
        message: l(
          `Imposto do selo sobre o arrendamento: ${formatMoney(roundMoney(c.renda * legal.value<number>('impostoSeloArrendamento')))}, pago pelo senhorio. As rendas são rendimentos a declarar no IRPS.`,
          'Stamp duty on the lease is paid by the landlord. Rent is income to declare for IRPS.',
        ),
      });
    }
    w.push({
      level: 'info',
      message: l(
        `Se o senhorio quiser que o inquilino saia antes do fim do prazo ou não renove, as limitações da lei do arrendamento podem aplicar-se (${cite('famDenunciaArrendamento')}). Quando o senhorio vive na casa, confirme o regime com um jurista.`,
        'If the landlord wants the tenant out early or does not want to renew, lease-law limits may apply. Where the landlord lives in the house, check the rules with a lawyer.',
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
    const forma = str(v.formaPagamento) || 'numerário';
    const conta = str(v.conta);
    const modo = forma === 'numerário' ? 'em numerário, contra recibo' : `por ${forma}${conta ? ` para ${forma === 'transferência bancária' ? 'a conta' : 'o número'} ${conta}` : ''}`;
    const dia = int(v.diaPagamento);
    const aviso = int(v.avisoDias);
    const avisoTxt = aviso ? quantos(aviso, 'dia', 'dias') : `${BLANK} dias`;
    const comuns = semPonto(v.espacosComuns);
    const caucao = money(v.caucaoValor);

    const consumos =
      v.consumos === 'divididos'
        ? 'As despesas de água, energia eléctrica e internet da casa são divididas em partes iguais pelos ocupantes, mediante apresentação das facturas ou comprovativos de carregamento.'
        : v.consumos === 'fixo'
          ? `Pelas despesas de água, energia eléctrica e internet, ${I.o} paga mensalmente, juntamente com a renda, a quantia fixa de ${valorTexto(money(v.consumosValor))}.`
          : `A renda inclui o consumo de água, energia eléctrica e internet${str(v.consumosLimite) ? `, ${semPonto(v.consumosLimite)}, sendo o excesso pago à parte por ${I.o}` : ', em quantidade razoável para uso doméstico'}.`;

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: numerar([
          `${S.O} dá de arrendamento ${I.ao}, que aceita, ${semPonto(v.quartoDescricao) || 'um quarto'}${v.casaBanhoPrivativa ? ', com casa de banho privativa,' : ''} da casa sita em ${semPonto(v.imovelMorada) || BLANK}, para habitação exclusiva ${I.de}.`,
          comuns ? `${I.O} tem direito a usar, em comum com os demais ocupantes${v.senhorioResideNaCasa ? ` e com ${S.o}` : ''}, os seguintes espaços: ${comuns}.` : '',
          c.mobilia.length
            ? `O quarto é entregue mobilado com: ${juntar(c.mobilia.map((r: Record<string, unknown>) => `${str(r.item)}${Number(r.quantidade) > 1 ? ` (${Number(r.quantidade)})` : ''}`))}.`
            : '',
          `${I.O} recebe ${semPonto(v.chaves) || 'as chaves necessárias'}, que restitui no fim do contrato, não podendo fazer cópias sem autorização.`,
        ]),
        en: `The landlord lets the room described at the address above to the tenant as their home, with shared use of ${comuns || 'the common areas'}.`,
      },
      {
        id: 'prazo',
        heading: 'Prazo',
        text: numerar([
          `O contrato é celebrado pelo prazo de ${c.meses > 0 ? quantos(c.meses, 'mês', 'meses') : `${BLANK} meses`}, com início em ${dateLong(v.dataInicio)} e termo em ${dateLong(c.dataFim)}${v.renovacao ? ', renovando-se por períodos iguais e sucessivos, salvo oposição de qualquer das partes nos termos da cláusula seguinte' : ''}.`,
        ]),
        en: `Term of ${c.meses || '—'} months from ${v.dataInicio || '—'}${v.renovacao ? ', renewing for equal periods' : ''}.`,
      },
      {
        id: 'denuncia',
        heading: 'Denúncia',
        text: numerar([
          `${I.O} pode pôr fim ao contrato a todo o tempo, mediante aviso escrito ${S.ao} com a antecedência mínima de ${avisoTxt}.`,
          v.renovacao ? `${S.O} pode opor-se à renovação do contrato, mediante aviso escrito com a mesma antecedência relativamente ao termo do prazo, nos termos e com os limites previstos na lei.` : '',
        ]),
        en: `The tenant may leave at any time with ${aviso || '—'} days’ written notice${v.renovacao ? '; the landlord may object to renewal with the same notice, within the limits of the law' : ''}.`,
      },
      {
        id: 'renda',
        heading: 'Renda e consumos',
        text: numerar([
          `A renda mensal é de ${valorTexto(c.renda)}, paga até ao dia ${dia || '____'} do mês a que respeita, ${modo}, contra recibo.`,
          consumos,
        ]),
        en: `Monthly rent ${c.renda != null ? formatMoney(c.renda) : '—'} paid by day ${dia || '—'} by ${forma}. Utilities: ${v.consumos === 'divididos' ? 'shared equally' : v.consumos === 'fixo' ? 'fixed monthly amount' : 'included'}.`,
      },
    ];
    if (caucao != null) {
      clauses.push({
        id: 'caucao',
        heading: 'Caução',
        text: `${I.O} entrega ${S.ao}, nesta data, a quantia de ${valorTexto(caucao)}, a título de caução, que não pode ser imputada nas rendas e lhe é restituída no fim do contrato, após a entrega do quarto e das chaves, deduzida dos montantes comprovadamente devidos.`,
        en: `The tenant pays a ${formatMoney(caucao)} deposit, returned at the end less proven amounts due.`,
      });
    }
    clauses.push(
      {
        id: 'regras',
        heading: 'Regras da casa',
        text: `${I.O} obriga-se a usar o quarto e os espaços comuns com cuidado e a respeitar as seguintes regras de convivência:`,
        items: itensLista(c.regras.length ? c.regras : [BLANK]),
        en: 'The tenant will take care of the room and shared areas and follow the house rules listed.',
      },
      {
        id: 'cessao',
        heading: 'Cedência e alojamento de terceiros',
        text: `${I.O} não pode ceder, subarrendar ou emprestar o quarto, nem alojar nele outra pessoa, sem autorização escrita ${S.de}.`,
        en: 'The tenant may not assign, sublet or lend the room or let anyone else stay without written consent.',
      },
      {
        id: 'restituicao',
        heading: 'Restituição',
        text: `No fim do contrato, ${I.o} restitui o quarto limpo e no estado em que o recebeu, ressalvado o desgaste normal, com a mobília e as chaves.`,
        en: 'At the end the tenant returns the room clean, in the condition received apart from normal wear, with furniture and keys.',
      },
      ...clausulasFinais(v).filter((x) => x.id !== 'alteracoes'),
    );

    return [
      { type: 'title', text: 'Contrato de arrendamento de quarto' },
      ...partesBlocks(v, [
        { p: 'senhorio', role: S, en: 'Landlord' },
        { p: 'inquilino', role: I, en: 'Tenant' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'é celebrado o presente contrato de arrendamento de quarto, que se rege pelas cláusulas seguintes e pelas normas legais sobre arrendamento:', en: 'this room lease is entered into on the following terms and the lease rules of the law:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fechoJunto(fecho(ctx, [assinatura(ctx, 'senhorio', S, true), assinatura(ctx, 'inquilino', I)])),
    ];
  },
});
