// Aviso de quotas do condomínio: a monthly notice of the fees due for a unit,
// or a formal demand (interpelação) to an owner in arrears before court
// collection. The demand puts the debtor in default.

import { formatMonthYear } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateLong, exmo, g, GENERO_OPTIONS, l, lineItems, money, refField } from './_shared';
import { int, semPonto, str, valorTexto } from './_contratos';
import { administradorColumn, condominioFields, edificio, mt, r2 } from './_construcao';

const isInterp = (v: Record<string, unknown>) => v.tipo === 'interpelacao';

export default defineTemplate({
  id: 'aviso-de-quotas-condominio',
  family: 'carta',
  // The monthly notice is a half sheet (A5); the formal demand is a full A4 letter.
  page: (v) => (isInterp(v) ? 'A4' : 'A5'),
  sections: [
    { id: 'documento', title: l('Tipo e data', 'Type and date') },
    { id: 'condomino', title: l('Condómino', 'Owner') },
    { id: 'valores', title: l('Valores', 'Amounts') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'radio',
      section: 'documento',
      required: true,
      label: l('Documento', 'Document'),
      options: [
        { value: 'aviso', label: l('Aviso de pagamento (mensal)', 'Payment notice (monthly)') },
        { value: 'interpelacao', label: l('Interpelação por quotas em atraso', 'Demand for arrears') },
      ],
      default: 'aviso',
    },
    refField(),
    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data', 'Date'), default: (c) => c.today },
    ...condominioFields('documento'),

    { name: 'fraccao', type: 'text', section: 'condomino', width: 'half', required: true, label: l('Fracção', 'Unit') },
    { name: 'condominoNome', type: 'text', section: 'condomino', width: 'half', required: true, label: l('Nome', 'Name') },
    { name: 'condominoGenero', type: 'radio', section: 'condomino', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    {
      name: 'qualidade',
      type: 'radio',
      section: 'condomino',
      label: l('Responsável pelo pagamento', 'Liable for payment'),
      options: [
        { value: 'proprietario', label: l('Proprietário', 'Owner') },
        { value: 'arrendatario', label: l('Arrendatário (nos termos do arrendamento)', 'Tenant (under the lease)') },
      ],
      default: 'proprietario',
    },

    { name: 'periodo', type: 'month', section: 'valores', width: 'half', label: l('Mês a pagar', 'Month due'), showIf: (v) => !isInterp(v), default: (c) => c.today.slice(0, 7) },
    { name: 'quotaOrdinaria', type: 'money', section: 'valores', width: 'half', label: l('Quota ordinária', 'Regular fee'), showIf: (v) => !isInterp(v) },
    { name: 'fundoReserva', type: 'money', section: 'valores', width: 'half', label: l('Fundo comum de reserva', 'Reserve fund'), showIf: (v) => !isInterp(v) },
    { name: 'quotaExtra', type: 'money', section: 'valores', width: 'half', label: l('Quota extraordinária (se houver)', 'Special levy (if any)'), showIf: (v) => !isInterp(v) },
    { name: 'atrasos', type: 'money', section: 'valores', width: 'half', label: l('Valores em atraso de meses anteriores', 'Arrears from earlier months'), showIf: (v) => !isInterp(v) },
    { name: 'dataLimite', type: 'date', section: 'valores', width: 'half', label: l('Pagar até', 'Pay by'), showIf: (v) => !isInterp(v) },
    {
      name: 'dividas',
      type: 'lines',
      section: 'valores',
      label: l('Quotas em dívida', 'Fees owed'),
      addLabel: l('Adicionar mês', 'Add month'),
      showIf: isInterp,
      columns: [
        { name: 'periodo', type: 'text', label: l('Período', 'Period') },
        { name: 'quota', type: 'money', label: l('Quota', 'Fee') },
        { name: 'fundo', type: 'money', label: l('Fundo de reserva', 'Reserve fund') },
        { name: 'extra', type: 'money', label: l('Extraordinária', 'Special levy') },
      ],
    },
    { name: 'dataAssembleia', type: 'date', section: 'valores', width: 'half', label: l('Quotas aprovadas na assembleia de', 'Fees approved at the meeting of') },
    { name: 'actaNumero', type: 'text', section: 'valores', width: 'half', label: l('Acta n.º', 'Minutes no.') },
    { name: 'prazoDias', type: 'number', section: 'valores', width: 'half', min: 1, max: 60, default: 8, label: l('Prazo para pagar (dias)', 'Days to pay'), showIf: isInterp },
    { name: 'pagamentoConta', type: 'text', section: 'valores', label: l('Pagamento por (conta, NIB, M-Pesa…)', 'Pay by (account, NIB, M-Pesa…)'), default: (c) => [c.profile?.banco, c.profile?.nib ? `NIB ${c.profile.nib}` : ''].filter(Boolean).join(', ') },
    { name: 'referencia', type: 'text', section: 'valores', width: 'half', label: l('Referência a indicar no pagamento', 'Payment reference'), default: '' },
    { name: 'planoPagamento', type: 'toggle', section: 'valores', default: true, label: l('Admitir proposta de plano de pagamento', 'Allow a payment plan proposal'), showIf: isInterp },
    { name: 'restricaoAcesso', type: 'toggle', section: 'valores', label: l('Avisar da restrição de acesso às partes comuns', 'Warn of restricted access to common parts'), showIf: isInterp },
  ],

  computed: (v) => {
    const dividas = lineItems(v.dividas)
      .filter((d) => str(d.periodo))
      .map((d) => {
        const q = money(d.quota) ?? 0;
        const f = money(d.fundo) ?? 0;
        const e = money(d.extra) ?? 0;
        return { periodo: str(d.periodo), q, f, e, t: r2(q + f + e) };
      });
    const totalDivida = r2(dividas.reduce((s, d) => s + d.t, 0));
    const totalAviso = r2(['quotaOrdinaria', 'fundoReserva', 'quotaExtra', 'atrasos'].reduce((s, k) => s + (money(v[k]) ?? 0), 0));
    return { dividas, totalDivida, totalAviso };
  },

  warnings: (v) => {
    const w: Warning[] = [];
    if (isInterp(v)) {
      w.push({ level: 'info', message: l(`Envie por carta registada ou entregue contra assinatura e guarde a prova. O administrador deve exigir a cada condómino a sua quota-parte (${cite('condominioAdministrador')}).`, 'Send by registered letter or hand over against signature and keep proof.') });
      if (v.restricaoAcesso) w.push({ level: 'warning', field: 'restricaoAcesso', message: l(`A restrição do acesso às partes comuns tem de respeitar o ${cite('condominioQuotas')} e não deve cortar serviços essenciais (água, electricidade) nem o acesso à própria fracção.`, 'Restricting access to common parts must follow the regulation and must not cut essential services or access to the unit itself.') });
      if (v.qualidade === 'arrendatario') w.push({ level: 'info', message: l('Envie também cópia ao proprietário da fracção.', 'Also send a copy to the unit owner.') });
    }
    return w;
  },

  personName: (v) => v.condominoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const ed = edificio(v);
    const acta = v.dataAssembleia ? `na assembleia de condóminos de ${dateLong(v.dataAssembleia)}${str(v.actaNumero) ? ` (acta n.º ${semPonto(v.actaNumero)})` : ''}` : 'pela assembleia de condóminos';

    if (!isInterp(v)) {
      const items = [
        ['Quota ordinária', money(v.quotaOrdinaria)],
        ['Fundo comum de reserva', money(v.fundoReserva)],
        ['Quota extraordinária', money(v.quotaExtra)],
        ['Valores em atraso', money(v.atrasos)],
      ].filter(([, n]) => n != null && (n as number) > 0) as [string, number][];
      const blocks: Block[] = [
        { type: 'title', text: 'Aviso de Pagamento de Quotas', subtitle: `${ed} · ${formatMonthYear(v.periodo ? `${v.periodo}-01` : '')}` },
        {
          type: 'keyValue',
          columns: 2,
          items: [
            { label: 'Fracção', value: str(v.fraccao) || BLANK },
            { label: 'Condómino', value: str(v.condominoNome) || BLANK },
            { label: 'Pagar até', value: dateLong(v.dataLimite) },
            { label: 'Referência', value: str(v.referencia) || `Fracção ${str(v.fraccao) || BLANK}` },
          ],
        },
        {
          type: 'table',
          columns: [
            { label: 'Descrição', width: 5 },
            { label: 'Valor (MT)', width: 1.6, align: 'right' },
          ],
          rows: items.length ? items.map(([lb, n]) => [lb, mt(n)]) : [['Quota ordinária', '']],
          totals: [['Total a pagar', mt(c.totalAviso)]],
        },
        {
          type: 'paragraph',
          id: 'aviso',
          text: `Solicita-se o pagamento das quotas acima indicadas até ${dateLong(v.dataLimite)}, conforme deliberado ${acta}${str(v.pagamentoConta) ? `, por depósito ou transferência para ${semPonto(v.pagamentoConta)}` : ''}. Após o pagamento, envie o comprovativo ao administrador.`,
          en: 'Please pay the fees above by the date stated and send the receipt to the administrator.',
          keepWithNext: true,
        },
        { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [administradorColumn(v, 'O Administrador')] },
      ];
      return blocks;
    }

    const f = v.condominoGenero === 'F';
    const prazo = int(v.prazoDias);
    const rows = (c.dividas as { periodo: string; q: number; f: number; e: number; t: number }[]).map((d) => [d.periodo, mt(d.q), mt(d.f), d.e ? mt(d.e) : '', mt(d.t)]);
    const blocks: Block[] = [
      { type: 'reference', ref: v.ref, place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', salutation: exmo(v.condominoGenero), lines: [str(v.condominoNome) || BLANK, `Fracção ${str(v.fraccao) || BLANK} do ${ed}`, semPonto(v.edificioMorada)].filter(Boolean) },
      { type: 'subject', text: `Quotas de condomínio em atraso — Fracção ${str(v.fraccao) || BLANK}` },
      { type: 'salutation', text: `${exmo(v.condominoGenero)},` },
      {
        type: 'paragraph',
        id: 'divida',
        text: `Verificamos que, até à presente data, não foram pagas as quotas de condomínio relativas à fracção ${str(v.fraccao) || BLANK}, de que V. Ex.ª é ${v.qualidade === 'arrendatario' ? g(v.condominoGenero, 'arrendatário', 'arrendatária') + ' e responsável pelo pagamento nos termos do contrato de arrendamento' : g(v.condominoGenero, 'proprietário', 'proprietária')}, conforme o quadro seguinte:`,
        en: 'The condominium fees for your unit listed below have not been paid.',
        keepWithNext: true,
      },
      {
        type: 'table',
        columns: [
          { label: 'Período', width: 2.4 },
          { label: 'Quota (MT)', width: 1.4, align: 'right' },
          { label: 'Fundo reserva', width: 1.4, align: 'right' },
          { label: 'Extraordinária', width: 1.4, align: 'right' },
          { label: 'Total (MT)', width: 1.5, align: 'right' },
        ],
        rows: rows.length ? rows : [[BLANK, '', '', '', '']],
        totals: [['Total em dívida', '', '', '', mt(c.totalDivida)]],
      },
      { type: 'paragraph', id: 'base', text: `As quotas foram fixadas ${acta}, nos termos do Código Civil e do Regulamento do Regime Jurídico do Condomínio, e são devidas na proporção da permilagem da fracção.`, en: 'Basis of the fees.' },
      {
        type: 'paragraph',
        id: 'interpelacao',
        text: `Fica V. Ex.ª ${f ? 'interpelada' : 'interpelado'} para pagar o valor em dívida, de ${valorTexto(c.totalDivida)}, no prazo de ${prazo ? `${prazo} ${prazo === 1 ? 'dia' : 'dias'}` : `${BLANK} dias`} a contar da recepção desta carta${str(v.pagamentoConta) ? `, por depósito ou transferência para ${semPonto(v.pagamentoConta)}` : ''}${v.planoPagamento ? ', ou para apresentar, no mesmo prazo, uma proposta escrita de plano de pagamento' : ''}.`,
        en: 'You are hereby required to pay the amount owed within the period stated.',
      },
      {
        type: 'paragraph',
        id: 'consequencias',
        text: `Findo esse prazo sem pagamento, o condomínio ${v.restricaoAcesso ? 'poderá condicionar o acesso às partes e serviços comuns, nos termos legais, e ' : ''}recorrerá aos meios judiciais para cobrança da dívida, acrescida de juros de mora e das despesas a que der causa.`,
        en: 'Otherwise the condominium will take legal action to collect the debt with default interest and costs.',
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Kind regards,', keepWithNext: true },
      { type: 'signatures', columns: [administradorColumn(v, 'O Administrador')] },
      { type: 'acknowledgement', text: 'Recebi em ___/___/______', signer: g(v.condominoGenero, 'O Condómino', 'A Condómina') },
    ];
    return blocks;
  },
});
