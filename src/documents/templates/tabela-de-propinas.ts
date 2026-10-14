// Tabela de propinas e emolumentos: a private school, college or training
// centre publishes its fees for the school year. Under the private-education
// rules the amounts are set every year and communicated to the supervising
// education authority; changes must be justified.

import { formatMoney } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, localField, money, splitLines } from './_shared';
import { licenceWarning, num, rows, semPonto, str } from './_educacao';

export default defineTemplate({
  id: 'tabela-de-propinas',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Tabela', 'Schedule') },
    { id: 'propinas', title: l('Matrícula e propinas', 'Enrolment and tuition') },
    { id: 'emolumentos', title: l('Emolumentos e outros serviços', 'Other fees and services') },
    { id: 'condicoes', title: l('Condições', 'Terms') },
    { id: 'assinatura', title: l('Comunicação e assinatura', 'Notice and signature') },
  ],
  fields: [
    { name: 'anoLectivo', type: 'text', section: 'documento', width: 'half', required: true, label: l('Ano lectivo', 'School year'), default: (c) => String(Number((c.today || '2026').slice(0, 4)) + 1) },
    localField(),
    dateField(),
    {
      name: 'niveis',
      type: 'lines',
      section: 'propinas',
      required: true,
      label: l('Níveis / classes', 'Levels / grades'),
      addLabel: l('Adicionar nível', 'Add level'),
      columns: [
        { name: 'nivel', type: 'text', label: l('Nível / classe', 'Level / grade') },
        { name: 'matricula', type: 'money', label: l('Matrícula', 'Enrolment') },
        { name: 'propina', type: 'money', label: l('Propina mensal', 'Monthly fee') },
        { name: 'prestacoes', type: 'number', label: l('N.º de prestações', 'Instalments'), min: 1, max: 12 },
      ],
      default: [],
    },
    {
      name: 'emolumentos',
      type: 'lines',
      section: 'emolumentos',
      label: l('Emolumentos e serviços', 'Fees and services'),
      addLabel: l('Adicionar serviço', 'Add service'),
      columns: [
        { name: 'servico', type: 'text', label: l('Serviço', 'Service') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
        { name: 'obs', type: 'text', label: l('Observação', 'Note'), placeholder: l('Ex.: por ano · opcional', 'E.g. per year · optional') },
      ],
      default: [
        { servico: 'Declaração de frequência', valor: '', obs: '' },
        { servico: 'Declaração com notas', valor: '', obs: '' },
        { servico: 'Segunda via do cartão de estudante', valor: '', obs: '' },
      ],
    },
    { name: 'diaPagamento', type: 'number', section: 'condicoes', width: 'half', min: 1, max: 31, label: l('Pagamento até ao dia', 'Pay by day'), default: 10 },
    { name: 'formasPagamento', type: 'text', section: 'condicoes', label: l('Formas de pagamento', 'Payment methods'), default: (c) => `transferência ou depósito na conta ${c.profile?.banco ? `${c.profile.banco}, ` : ''}${c.profile?.nib ? `NIB ${c.profile.nib}` : '____________'}; M-Pesa; numerário na Tesouraria, contra recibo` },
    {
      name: 'iva',
      type: 'radio',
      section: 'condicoes',
      label: l('IVA', 'VAT'),
      options: [
        { value: 'incluido', label: l('Valores com IVA incluído', 'VAT included') },
        { value: 'acresce', label: l('Aos valores acresce IVA', 'Plus VAT') },
        { value: 'nao', label: l('Não mencionar', 'Do not mention') },
      ],
      default: 'incluido',
    },
    { name: 'descontos', type: 'textarea', section: 'condicoes', rows: 3, label: l('Descontos (um por linha)', 'Discounts (one per line)'), placeholder: l('Ex.: Pagamento anual antecipado: desconto sobre as propinas', 'E.g. Annual payment: discount on tuition') },
    { name: 'atraso', type: 'text', section: 'condicoes', label: l('Pagamento em atraso', 'Late payment'), default: 'As propinas pagas depois do prazo estão sujeitas às condições do contrato de prestação de serviços educativos. O atraso não impede o aluno de frequentar as aulas, testes e exames.' },
    { name: 'restituicao', type: 'text', section: 'condicoes', label: l('Desistência e restituição', 'Withdrawal and refunds'), default: 'Em caso de desistência comunicada por escrito, os valores pagos antecipadamente por meses seguintes são restituídos.' },
    { name: 'outrasCondicoes', type: 'textarea', section: 'condicoes', rows: 3, label: l('Outras condições (uma por linha)', 'Other terms (one per line)') },
    { name: 'comunicada', type: 'toggle', section: 'assinatura', label: l('Indicar que a tabela foi comunicada à Direcção de Educação', 'State that the schedule was reported to the education authority'), default: true },
    { name: 'entidade', type: 'text', section: 'assinatura', width: 'half', label: l('Entidade', 'Authority'), default: (c) => `Direcção Provincial de Educação de ${c.profile?.morada?.provincia?.replace(/ Cidade$/, '') || 'Maputo'}`, showIf: (v) => Boolean(v.comunicada) },
    { name: 'comunicadaEm', type: 'date', section: 'assinatura', width: 'half', label: l('Comunicada em', 'Reported on'), showIf: (v) => Boolean(v.comunicada) },
    { name: 'vigorDesde', type: 'date', section: 'assinatura', width: 'half', label: l('Em vigor desde', 'In force from') },
    { name: 'assinante', type: 'text', section: 'assinatura', width: 'half', label: l('Assina', 'Signed by'), default: 'A Direcção' },
  ],
  warnings: (v, ctx) => {
    const w: Warning[] = [...licenceWarning(ctx)];
    w.push({
      level: 'info',
      message: l(
        'As instituições privadas devem fixar os valores anualmente, comunicá-los às autoridades que tutelam a Educação e fundamentar qualquer alteração nos serviços efectivamente prestados. Alterar valores sem comunicação prévia é infracção (regime do ensino privado, 2026).',
        'Private institutions must set fees yearly, report them to the education authority and justify changes; changing fees without prior notice is an offence (2026 rules).',
      ),
    });
    if (!rows(v.niveis).some((r) => str(r.nivel))) w.push({ level: 'warning', field: 'niveis', message: l('Acrescente pelo menos um nível com os valores.', 'Add at least one level with its fees.') });
    if (v.iva !== 'nao') w.push({ level: 'info', field: 'iva', message: l('Desde 2026 as propinas podem estar sujeitas a IVA. Confirme com o seu contabilista ou a Autoridade Tributária.', 'Since 2026 fees may carry VAT. Check with your accountant.') });
    const ano = str(v.anoLectivo).slice(0, 4);
    if (v.vigorDesde && ano && str(v.vigorDesde).slice(0, 4) === ano && str(v.vigorDesde).slice(5, 7) > '03')
      w.push({ level: 'warning', field: 'vigorDesde', message: l('Uma tabela que entra em vigor a meio do ano lectivo altera valores já contratados: deve ser fundamentada e comunicada previamente.', 'A schedule starting mid-year changes agreed fees: it must be justified and notified in advance.') });
    return w;
  },
  documentDate: (v) => str(v.data) || undefined,
  blocks: (ctx) => {
    const v = ctx.values;
    const niveis = rows(v.niveis).filter((r) => str(r.nivel));
    const totalAnual = (r: Record<string, any>) => {
      const p = money(r.propina);
      const n = num(r.prestacoes);
      return p != null && n != null ? formatMoney(p * n + (money(r.matricula) ?? 0), false) : '';
    };
    const m = (x: unknown) => (money(x) != null ? formatMoney(money(x), false) : '—');
    const ivaTxt = v.iva === 'incluido' ? 'Os valores indicados incluem IVA.' : v.iva === 'acresce' ? 'Aos valores indicados acresce IVA à taxa legal.' : '';
    const condicoes = [
      `As propinas são pagas mensalmente até ao dia ${num(v.diaPagamento) ?? BLANK} de cada mês.`,
      str(v.formasPagamento) ? `Formas de pagamento: ${semPonto(v.formasPagamento)}.` : '',
      ...splitLines(v.descontos).map((d) => `${semPonto(d)}.`),
      str(v.atraso),
      str(v.restituicao),
      ivaTxt,
      `Os valores vigoram durante todo o ano lectivo de ${str(v.anoLectivo) || BLANK}.`,
      ...splitLines(v.outrasCondicoes).map((d) => `${semPonto(d)}.`),
    ].filter(Boolean);
    const blocks: Block[] = [
      { type: 'title', text: 'Tabela de Propinas e Emolumentos', subtitle: `Ano lectivo ${str(v.anoLectivo) || BLANK}` },
      { type: 'heading', text: 'Matrícula e propinas (valores em meticais)' },
      {
        type: 'table',
        columns: [
          { label: 'Nível / classe', width: 34 },
          { label: 'Matrícula', width: 16, align: 'right' },
          { label: 'Propina mensal', width: 18, align: 'right' },
          { label: 'Meses', width: 12, align: 'center' },
          { label: 'Total anual', width: 20, align: 'right' },
        ],
        rows: (niveis.length ? niveis : [{}, {}]).map((r) => [
          str(r.nivel),
          str(r.nivel) ? m(r.matricula) : '',
          str(r.nivel) ? m(r.propina) : '',
          num(r.prestacoes) != null ? String(num(r.prestacoes)) : '',
          totalAnual(r),
        ]),
        note: 'Total anual = matrícula + propina mensal × número de meses.',
      },
    ];
    const emol = rows(v.emolumentos).filter((r) => str(r.servico));
    if (emol.length)
      blocks.push(
        { type: 'heading', text: 'Emolumentos e outros serviços (valores em meticais)' },
        { type: 'table', columns: [{ label: 'Serviço', width: 50 }, { label: 'Valor', width: 20, align: 'right' }, { label: 'Observação', width: 30 }], rows: emol.map((r) => [str(r.servico), m(r.valor), str(r.obs)]) },
      );
    blocks.push({ type: 'heading', text: 'Condições' }, { type: 'list', style: 'numeric', items: condicoes });
    if (v.comunicada)
      blocks.push({
        type: 'paragraph',
        id: 'comunicacao',
        text: `A presente tabela foi comunicada à ${semPonto(v.entidade) || BLANK}${v.comunicadaEm ? ` em ${dateLong(v.comunicadaEm)}` : ''}, nos termos da legislação aplicável ao ensino privado.`,
        en: 'This schedule was reported to the education authority under the private-education rules.',
      });
    if (v.vigorDesde) blocks.push({ type: 'paragraph', id: 'vigor', text: `Em vigor a partir de ${dateLong(v.vigorDesde)}.`, en: 'In force from the stated date.' });
    blocks.push({ type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [{ role: str(v.assinante) || 'A Direcção', name: ctx.profile?.representanteNome || undefined, image: 'both' }] });
    return blocks;
  },
});
