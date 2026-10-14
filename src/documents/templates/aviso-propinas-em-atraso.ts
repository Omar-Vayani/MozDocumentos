// Aviso de propinas em atraso: the school's finance office reminds the parent
// (never the child) of unpaid instalments. The written reminder puts the
// debtor in default (Código Civil). The notice must not threaten the child's
// schooling: no barring from tests or exams, no withholding of documents.

import { diffDays, formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateLong, exmo, formatMoney, FORMA_PAGAMENTO_OPTIONS, g, GENERO_OPTIONS, isF, l, localField, money, dateField, refField } from './_shared';
import { rows, semPonto, str } from './_educacao';

const PROIBIDO = /(teste|exame|prova|certificad|declara[cç]|reter|reten|impedid|proibid|expuls|sala de aula)/i;

export default defineTemplate({
  id: 'aviso-propinas-em-atraso',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'encarregado', title: l('Encarregado de educação', 'Parent / guardian'), personRole: 'cliente' },
    { id: 'divida', title: l('Prestações em atraso', 'Overdue instalments') },
    { id: 'pagamento', title: l('Pagamento', 'Payment') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    refField(),
    localField(),
    dateField(),
    { name: 'encarregadoNome', type: 'text', section: 'encarregado', required: true, label: l('Nome do encarregado', "Parent's name"), personKey: 'nome' },
    { name: 'encarregadoGenero', type: 'radio', section: 'encarregado', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'alunoNome', type: 'text', section: 'encarregado', required: true, width: 'half', label: l('Nome do aluno', "Pupil's name") },
    { name: 'alunoGenero', type: 'radio', section: 'encarregado', width: 'half', label: l('Sexo do aluno', "Pupil's sex"), options: GENERO_OPTIONS, default: 'M' },
    { name: 'alunoClasse', type: 'text', section: 'encarregado', width: 'half', label: l('Classe / turma', 'Grade / class'), placeholder: l('Ex.: 5.ª classe, turma B', 'E.g. Grade 5, class B') },
    { name: 'anoLectivo', type: 'text', section: 'encarregado', width: 'half', label: l('Ano lectivo', 'School year'), default: (c) => (c.today || '').slice(0, 4) },
    {
      name: 'prestacoes',
      type: 'lines',
      section: 'divida',
      required: true,
      label: l('Prestações em atraso', 'Overdue instalments'),
      addLabel: l('Adicionar prestação', 'Add instalment'),
      columns: [
        { name: 'mes', type: 'text', label: l('Mês / descrição', 'Month / item'), placeholder: l('Ex.: Propina de Agosto', 'E.g. August fee') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
        { name: 'vencimento', type: 'date', label: l('Vencimento', 'Due date') },
        { name: 'penalizacao', type: 'money', label: l('Penalização (se prevista no contrato)', 'Late charge (if in the contract)') },
      ],
      default: [],
    },
    { name: 'prazoPagamento', type: 'date', section: 'pagamento', width: 'half', required: true, label: l('Pagar até', 'Pay by') },
    { name: 'formaPagamento', type: 'select', section: 'pagamento', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    { name: 'contaPagamento', type: 'text', section: 'pagamento', label: l('Conta / NIB / número M-Pesa', 'Account / NIB / M-Pesa no.'), default: (c) => [c.profile?.banco, c.profile?.nib ? `NIB ${c.profile.nib}` : ''].filter(Boolean).join(', ') },
    { name: 'planoPagamento', type: 'toggle', section: 'pagamento', label: l('Oferecer um plano de pagamento', 'Offer a payment plan'), default: true },
    {
      name: 'consequencia',
      type: 'select',
      section: 'pagamento',
      label: l('Consequência prevista no contrato (opcional)', 'Consequence in the contract (optional)'),
      options: [
        { value: '', label: l('Nenhuma', 'None') },
        { value: 'renovacao', label: l('Não renovação da matrícula no ano seguinte', 'No re-enrolment next year') },
        { value: 'judicial', label: l('Cobrança pelos meios legais', 'Collection through legal means') },
        { value: 'outra', label: l('Outra', 'Other') },
      ],
      default: '',
    },
    { name: 'consequenciaTexto', type: 'text', section: 'pagamento', label: l('Descreva a consequência', 'Describe it'), showIf: (v) => v.consequencia === 'outra' },
    { name: 'clausula', type: 'text', section: 'pagamento', width: 'half', label: l('Cláusula do contrato (opcional)', 'Contract clause (optional)'), placeholder: l('Ex.: Sétima', 'E.g. Seventh'), showIf: (v) => Boolean(v.consequencia) },
    {
      name: 'entrega',
      type: 'radio',
      section: 'assinatura',
      label: l('Como é entregue', 'Delivery'),
      options: [
        { value: 'mao', label: l('Em mão ao encarregado', 'By hand to the parent') },
        { value: 'email', label: l('Por email / mensagem', 'By e-mail / message') },
        { value: 'aluno', label: l('Através do aluno', 'Through the pupil') },
      ],
      default: 'mao',
    },
    { name: 'recibo', type: 'toggle', section: 'assinatura', label: l('Incluir recibo de entrega (o encarregado assina)', 'Add a receipt line for the parent to sign'), help: l('Útil quando o aviso é entregue em mão.', 'Useful when delivered by hand.') },
    { name: 'assinante', type: 'text', section: 'assinatura', width: 'half', label: l('Assina', 'Signed by'), default: 'O Departamento Financeiro' },
    { name: 'assinanteNome', type: 'text', section: 'assinatura', width: 'half', label: l('Nome (opcional)', 'Name (optional)') },
  ],
  computed: (v) => {
    const linhas = rows(v.prestacoes).filter((r) => str(r.mes) || money(r.valor) != null);
    const total = linhas.reduce((s, r) => s + (money(r.valor) ?? 0) + (money(r.penalizacao) ?? 0), 0);
    return { total: linhas.length ? total : null };
  },
  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const txt = `${str(v.consequenciaTexto)}`;
    if (PROIBIDO.test(txt))
      w.push({
        level: 'error',
        field: 'consequenciaTexto',
        message: l(
          'Não ameace impedir o aluno de fazer testes ou exames, nem reter os seus documentos ou afastá-lo das aulas: as Direcções de Educação proíbem estas práticas e a dívida é do encarregado.',
          'Do not threaten to bar the pupil from tests or exams, withhold documents or remove the child from class.',
        ),
      });
    if (v.entrega === 'aluno')
      w.push({ level: 'warning', field: 'entrega', message: l('Evite entregar avisos de dívida através da criança. Prefira envelope fechado entregue ao encarregado, email ou mensagem.', 'Avoid sending debt notices through the child.') });
    if (v.prazoPagamento && v.data && diffDays(v.data, v.prazoPagamento) < 8)
      w.push({ level: 'warning', field: 'prazoPagamento', message: l('Dê um prazo razoável para pagar (pelo menos uma semana).', 'Give a reasonable deadline (at least a week).') });
    if (ctx.computed.total == null) w.push({ level: 'warning', field: 'prestacoes', message: l('Indique as prestações em atraso.', 'Enter the overdue instalments.') });
    w.push({ level: 'info', message: l(`A interpelação escrita constitui o devedor em mora (${cite('codigoCivilMora')}). Guarde cópia com a data de entrega.`, 'The written reminder puts the debtor in default. Keep a copy with the delivery date.') });
    return w;
  },
  personName: (v) => str(v.alunoNome) || str(v.encarregadoNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
  blocks: (ctx) => {
    const v = ctx.values;
    const fa = isF(v.alunoGenero);
    const linhas = rows(v.prestacoes).filter((r) => str(r.mes) || money(r.valor) != null);
    const total = ctx.computed.total as number | null;
    const comPen = linhas.some((r) => money(r.penalizacao) != null);
    const fmt = (x: unknown) => (money(x) != null ? formatMoney(money(x), false) : '');
    const consequencia =
      v.consequencia === 'renovacao'
        ? 'pode determinar a não renovação da matrícula para o ano lectivo seguinte'
        : v.consequencia === 'judicial'
          ? 'implica a cobrança do valor em dívida pelos meios legais'
          : v.consequencia === 'outra' && str(v.consequenciaTexto) && !PROIBIDO.test(str(v.consequenciaTexto))
            ? semPonto(v.consequenciaTexto)
            : '';
    const blocks: Block[] = [
      { type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', salutation: exmo(v.encarregadoGenero), lines: [str(v.encarregadoNome) || BLANK, `Encarregad${isF(v.encarregadoGenero) ? 'a' : 'o'} de Educação ${fa ? 'da aluna' : 'do aluno'} ${str(v.alunoNome) || BLANK}${str(v.alunoClasse) ? ` (${semPonto(v.alunoClasse)})` : ''}`] },
      { type: 'subject', text: `Propinas em atraso — ${str(v.alunoNome) || BLANK}` },
      { type: 'salutation', text: `${exmo(v.encarregadoGenero)},` },
      {
        type: 'paragraph',
        id: 'divida',
        text: `Comunicamos que, até à presente data, não se encontra registado o pagamento das seguintes prestações relativas à frequência ${fa ? 'da sua educanda' : 'do seu educando'} **${str(v.alunoNome) || BLANK}** no ano lectivo de ${str(v.anoLectivo) || BLANK}:`,
        en: 'Our records show the following unpaid instalments for your child this school year:',
        keepWithNext: true,
      },
      {
        type: 'table',
        columns: [
          { label: 'Prestação', width: comPen ? 34 : 46 },
          { label: 'Vencimento', width: comPen ? 22 : 26 },
          { label: 'Valor (MT)', width: comPen ? 22 : 28, align: 'right' },
          ...(comPen ? [{ label: 'Penalização (MT)', width: 22, align: 'right' as const }] : []),
        ],
        rows: (linhas.length ? linhas : [{}]).map((r) => [str(r.mes), r.vencimento ? formatDateShort(r.vencimento) : '', fmt(r.valor), ...(comPen ? [fmt(r.penalizacao)] : [])]),
        totals:
          total == null
            ? undefined
            : comPen
              ? [
                  ['Subtotal', '', formatMoney(linhas.reduce((a, r) => a + (money(r.valor) ?? 0), 0), false), formatMoney(linhas.reduce((a, r) => a + (money(r.penalizacao) ?? 0), 0), false)],
                  ['Total em dívida', '', '', formatMoney(total, false)],
                ]
              : [['Total em dívida', '', formatMoney(total, false)]],
      },
      {
        type: 'paragraph',
        id: 'prazo',
        text: `Solicitamos a regularização do valor de **${total != null ? formatMoney(total) : `${BLANK} MT`}** até ao dia **${dateLong(v.prazoPagamento)}**, por ${str(v.formaPagamento) || BLANK}${str(v.contaPagamento) ? ` (${semPonto(v.contaPagamento)})` : ''}, devendo o comprovativo ser entregue na Secretaria.${v.planoPagamento !== false ? ' Caso tenha dificuldades em pagar de uma só vez, pode contactar a Direcção Administrativa para acordar um plano de pagamento.' : ''} Se já efectuou o pagamento, queira desconsiderar este aviso.`,
        en: 'Please pay the total by the stated date and hand the proof of payment to the office.',
      },
    ];
    if (consequencia)
      blocks.push({
        type: 'paragraph',
        id: 'consequencia',
        text: `Informamos que, nos termos ${str(v.clausula) ? `da Cláusula ${semPonto(v.clausula)} ` : ''}do contrato de prestação de serviços educativos, a falta de pagamento ${consequencia}.`,
        en: 'Under the contract, non-payment may have the stated consequence.',
      });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Kind regards,', keepWithNext: true },
      { type: 'signatures', columns: [{ role: str(v.assinante) || 'O Departamento Financeiro', name: str(v.assinanteNome) || undefined, image: 'both' }] },
    );
    if (v.recibo) blocks.push({ type: 'acknowledgement', text: 'Recebi o original em ___/___/______', signer: g(v.encarregadoGenero, 'O Encarregado de Educação', 'A Encarregada de Educação') });
    return blocks;
  },
});
