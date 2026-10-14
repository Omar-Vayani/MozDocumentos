// Acordo de revogação do contrato de arrendamento: landlord and tenant agree to
// end the lease on a date, settle rent, the deposit and any compensation, and
// give each other a discharge.

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, numerar, partesBlocks, partyName, partyWarnings, testemunhasField, valorTexto,
} from './_contratos';
import { fechoJunto, arrendamentoFields, contratoTexto, papeisArrendamento, partyFieldsWhen, str } from './_familia';

export default defineTemplate({
  id: 'revogacao-arrendamento',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'senhorio', title: l('Senhorio', 'Landlord'), personRole: 'senhorio' },
    { id: 'inquilino', title: l('Inquilino', 'Tenant'), personRole: 'inquilino' },
    { id: 'contrato', title: l('Contrato e imóvel', 'Lease and property') },
    { id: 'cessacao', title: l('Cessação e entrega', 'Termination and hand-over') },
    { id: 'contas', title: l('Rendas, caução e compensação', 'Rent, deposit and compensation') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFieldsWhen('senhorio', ['empresa']),
    ...partyFieldsWhen('inquilino', ['pessoa']),
    ...arrendamentoFields('contrato', { renda: true }),
    { name: 'dataCessacao', type: 'date', section: 'cessacao', width: 'half', required: true, label: l('O contrato termina em', 'The lease ends on') },
    { name: 'dataEntrega', type: 'date', section: 'cessacao', width: 'half', label: l('Entrega das chaves até', 'Keys handed over by'), help: l('Vazio = na data de cessação.', 'Empty = on the end date.') },
    { name: 'vistoria', type: 'toggle', section: 'cessacao', default: true, label: l('Vistoria conjunta na entrega, com auto', 'Joint inspection at hand-over, with a record') },
    {
      name: 'rendas',
      type: 'radio',
      section: 'contas',
      label: l('Rendas', 'Rent'),
      options: [
        { value: 'pagas', label: l('Pagas até à cessação', 'Paid up to the end date') },
        { value: 'divida', label: l('Há rendas em dívida', 'There is rent owed') },
      ],
      default: 'pagas',
    },
    { name: 'dividaValor', type: 'money', section: 'contas', width: 'half', label: l('Valor em dívida', 'Amount owed'), showIf: (v) => v.rendas === 'divida' },
    { name: 'dividaPagamento', type: 'date', section: 'contas', width: 'half', label: l('Pagar até', 'Pay by'), showIf: (v) => v.rendas === 'divida' },
    { name: 'caucaoValor', type: 'money', section: 'contas', width: 'half', label: l('Caução (se houver)', 'Deposit (if any)') },
    {
      name: 'caucaoDestino',
      type: 'select',
      section: 'contas',
      width: 'half',
      label: l('A caução', 'The deposit'),
      options: [
        { value: 'devolver', label: l('É devolvida após a vistoria', 'Is returned after the inspection') },
        { value: 'compensar', label: l('Compensa as últimas rendas', 'Covers the last rents') },
      ],
      default: 'devolver',
      showIf: (v) => money(v.caucaoValor) != null,
    },
    { name: 'compensacao', type: 'money', section: 'contas', width: 'half', label: l('Compensação paga pelo senhorio ao inquilino (opcional)', 'Compensation from landlord to tenant (optional)'), help: l('Por exemplo, quando o senhorio pede a saída antecipada.', 'E.g. when the landlord asks the tenant to leave early.') },
    { name: 'quitacao', type: 'toggle', section: 'clausulas', default: true, label: l('Quitação recíproca (nada mais a exigir)', 'Mutual discharge (no further claims)') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'senhorio', 'senhorio', 'landlord'), ...partyWarnings(v, 'inquilino', 'inquilino', 'tenant')];
    if (!str(v.imovelMorada)) w.push({ level: 'error', field: 'imovelMorada', message: l('Indique a morada do imóvel.', 'Enter the property address.') });
    if (!v.dataCessacao) w.push({ level: 'error', field: 'dataCessacao', message: l('Indique a data de cessação.', 'Enter the end date.') });
    if (v.quitacao && v.rendas === 'divida') w.push({ level: 'info', field: 'quitacao', message: l('A quitação só abrange o que está regulado neste acordo: a dívida de rendas mantém-se até ser paga.', 'The discharge covers only what this agreement settles; rent owed stays due until paid.') });
    return w;
  },

  personName: (v) => partyName(v, 'inquilino') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const { S, I } = papeisArrendamento(v);
    const caucao = money(v.caucaoValor);
    const comp = money(v.compensacao);
    const entrega = str(v.dataEntrega) ? dateLong(v.dataEntrega) : dateLong(v.dataCessacao);

    const clauses: ClauseItem[] = [
      {
        id: 'revogacao',
        heading: 'Revogação',
        text: `Por mútuo acordo, as partes revogam ${contratoTexto(v)}${money(v.rendaMensal) != null ? `, com a renda mensal de ${valorTexto(money(v.rendaMensal))}` : ''}, que cessa os seus efeitos em **${dateLong(v.dataCessacao)}**.`,
        en: `By mutual agreement the parties end the lease of the property above, effective ${v.dataCessacao || '—'}.`,
      },
      {
        id: 'entrega',
        heading: 'Restituição do imóvel',
        text: numerar([
          `${I.O} restitui o imóvel ${S.ao} até ${entrega}, livre de pessoas e bens que não lhe pertençam, no estado em que o recebeu, ressalvadas as deteriorações inerentes a uma utilização normal e prudente, e entrega todas as chaves.`,
          v.vistoria ? 'Na data da entrega, as partes procedem a uma vistoria conjunta do imóvel, de que lavram auto assinado por ambas.' : '',
          `${I.O} apresenta os comprovativos de pagamento dos consumos de água e energia até à data da entrega.`,
        ]),
        en: `The tenant returns the property and keys by ${v.dataEntrega || v.dataCessacao || '—'}, in the condition received apart from normal wear${v.vistoria ? ', with a joint inspection record' : ''}, and shows proof that utilities are paid.`,
      },
    ];
    const contas: string[] = [];
    if (v.rendas === 'divida') {
      contas.push(`${I.O} reconhece dever ${S.ao} a quantia de ${valorTexto(money(v.dividaValor))}, por rendas vencidas e não pagas, que se obriga a pagar até ${dateLong(v.dividaPagamento)}.`);
    } else {
      contas.push(`As partes declaram que as rendas se encontram pagas até à data da cessação do contrato.`);
    }
    if (caucao != null) {
      contas.push(
        v.caucaoDestino === 'compensar'
          ? `A caução de ${valorTexto(caucao)} prestada por ${I.o} é imputada no pagamento das últimas rendas, o que ${S.o} aceita, sem prejuízo da responsabilidade ${I.de} pelos danos verificados na vistoria.`
          : `${S.O} restitui ${I.ao} a caução de ${valorTexto(caucao)} após a entrega do imóvel e das chaves, deduzida apenas dos montantes que comprovadamente forem devidos por rendas, consumos ou danos verificados na vistoria.`,
      );
    }
    if (comp != null && comp > 0) {
      contas.push(`${S.O} paga ${I.ao}, a título de compensação pela cessação antecipada do contrato, a quantia de ${valorTexto(comp)}, na data da entrega das chaves.`);
    }
    clauses.push({
      id: 'contas',
      heading: 'Rendas, caução e compensação',
      text: numerar(contas),
      en: `${v.rendas === 'divida' ? `The tenant owes ${formatMoney(money(v.dividaValor))} in rent. ` : 'Rent is paid up. '}${caucao != null ? `The deposit of ${formatMoney(caucao)} is ${v.caucaoDestino === 'compensar' ? 'set against the last rents' : 'returned after hand-over, less proven amounts'}. ` : ''}${comp ? `The landlord pays ${formatMoney(comp)} compensation.` : ''}`,
    });
    if (v.quitacao) {
      clauses.push({
        id: 'quitacao',
        heading: 'Quitação',
        text: `Cumprido o disposto no presente acordo, as partes dão-se mútua e plena quitação, nada mais tendo a exigir uma da outra com fundamento no contrato de arrendamento ou na sua cessação${v.rendas === 'divida' ? ', salvo quanto às rendas em dívida acima reconhecidas' : ''}.`,
        en: 'Once this agreement is performed, the parties give each other a full discharge, with no further claims under the lease or its termination.',
      });
    }
    clauses.push(...clausulasFinais(v).filter((x) => x.id !== 'alteracoes'));

    return [
      { type: 'title', text: 'Acordo de revogação do contrato de arrendamento' },
      ...partesBlocks(v, [
        { p: 'senhorio', role: S, en: 'Landlord' },
        { p: 'inquilino', role: I, en: 'Tenant' },
      ]),
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'é celebrado, de livre vontade, o presente acordo de revogação, que se rege pelas cláusulas seguintes:',
        en: 'this termination agreement is freely entered into on the following terms:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fechoJunto(fecho(ctx, [assinatura(ctx, 'senhorio', S, ctx.profile?.kind === 'empresa'), assinatura(ctx, 'inquilino', I, ctx.profile?.kind === 'pessoa')])),
    ];
  },
});
