import { formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, dateLong, formatMoney, l, localField, money } from './_shared';
import { ext, membrosPoupanca, num, PERIODO_OPTIONS, PERIODO_TXT, quantos, semPonto, str, valorTexto, vezes, type MembroPoupanca } from './_associacoes';

// Regulamento de um grupo de poupança (xitique rotativo ou poupança e
// empréstimo). No specific law: a private agreement among the members. The
// group is not a bank, so it never takes money from outsiders.

export default defineTemplate({
  id: 'regulamento-grupo-poupanca',
  family: 'contrato',
  letterhead: false,
  sections: [
    { id: 'grupo', title: l('Grupo', 'Group') },
    { id: 'contribuicoes', title: l('Contribuições', 'Contributions') },
    { id: 'emprestimos', title: l('Empréstimos (poupança e empréstimo)', 'Loans (savings and loan)') },
    { id: 'membros', title: l('Membros', 'Members') },
    { id: 'regras', title: l('Regras e coordenação', 'Rules and coordination') },
  ],
  fields: [
    { name: 'nomeGrupo', type: 'text', section: 'grupo', required: true, label: l('Nome do grupo', 'Group name'), placeholder: l('Ex.: Xitique das Colegas do Mercado Janet', 'E.g. Market vendors’ xitique') },
    {
      name: 'modalidade',
      type: 'radio',
      section: 'grupo',
      required: true,
      label: l('Tipo de grupo', 'Type of group'),
      options: [
        { value: 'rotativo', label: l('Xitique rotativo: cada membro recebe tudo uma vez', 'Rotating: each member receives the pot once') },
        { value: 'acumulativo', label: l('Poupança e empréstimo: o fundo cresce e reparte-se no fim', 'Savings and loan: the fund grows and is shared at the end') },
      ],
      default: 'rotativo',
    },
    { name: 'valor', type: 'money', section: 'contribuicoes', width: 'half', required: true, label: l('Contribuição de cada membro', 'Each member’s contribution') },
    { name: 'periodicidade', type: 'select', section: 'contribuicoes', width: 'half', required: true, label: l('Periodicidade', 'Frequency'), options: PERIODO_OPTIONS, default: 'mes' },
    { name: 'diaPagamento', type: 'text', section: 'contribuicoes', width: 'half', label: l('Pagar até', 'Pay by'), placeholder: l('Ex.: dia 5 de cada mês / cada sexta-feira', 'E.g. the 5th of each month') },
    { name: 'dataInicio', type: 'date', section: 'contribuicoes', width: 'half', required: true, label: l('Primeira entrega', 'First payout'), default: (c) => c.today },
    {
      name: 'meio',
      type: 'select',
      section: 'contribuicoes',
      width: 'half',
      label: l('Como se entrega o dinheiro', 'How money is paid'),
      options: [
        { value: 'numerario', label: l('Em mão, ao tesoureiro', 'Cash to the treasurer') },
        { value: 'carteira', label: l('M-Pesa / e-Mola', 'Mobile money') },
        { value: 'conta', label: l('Conta bancária', 'Bank account') },
      ],
      default: 'numerario',
    },
    { name: 'numeroCarteira', type: 'text', section: 'contribuicoes', width: 'half', label: l('Número / conta', 'Number / account'), showIf: (v) => v.meio !== 'numerario' },
    { name: 'titularCarteira', type: 'text', section: 'contribuicoes', label: l('Em nome de', 'Account holder'), showIf: (v) => v.meio !== 'numerario' },
    { name: 'ordem', type: 'radio', section: 'contribuicoes', label: l('Ordem de recebimento', 'Order of payout'), options: [{ value: 'sorteio', label: l('Por sorteio', 'By draw') }, { value: 'acordo', label: l('Por acordo', 'By agreement') }], default: 'sorteio', showIf: (v) => v.modalidade !== 'acumulativo' },
    { name: 'multiplo', type: 'number', section: 'emprestimos', width: 'half', label: l('Empréstimo máximo (vezes a poupança do membro)', 'Maximum loan (times the member’s savings)'), default: 3, min: 1, showIf: (v) => v.modalidade === 'acumulativo' },
    { name: 'taxaServico', type: 'number', section: 'emprestimos', width: 'half', label: l('Contribuição de serviço por mês (%)', 'Monthly service charge (%)'), help: l('Valor combinado pelo grupo; reverte para o fundo.', 'Set by the group; goes into the fund.'), default: 5, min: 0, showIf: (v) => v.modalidade === 'acumulativo' },
    { name: 'prazoEmprestimo', type: 'number', section: 'emprestimos', width: 'half', label: l('Prazo máximo de reembolso (meses)', 'Maximum repayment term (months)'), default: 3, min: 1, showIf: (v) => v.modalidade === 'acumulativo' },
    { name: 'dataReparticao', type: 'date', section: 'emprestimos', width: 'half', label: l('Data da repartição do fundo', 'Share-out date'), showIf: (v) => v.modalidade === 'acumulativo' },
    {
      name: 'membros',
      type: 'lines',
      section: 'membros',
      required: true,
      label: l('Membros (pela ordem de recebimento)', 'Members (in payout order)'),
      addLabel: l('Adicionar membro', 'Add member'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'doc', type: 'text', label: l('BI n.º', 'ID no.') },
        { name: 'telefone', type: 'tel', label: l('Telefone', 'Phone') },
      ],
      default: [],
    },
    { name: 'multa', type: 'money', section: 'regras', width: 'half', label: l('Multa por atraso', 'Late fee') },
    { name: 'multaPor', type: 'select', section: 'regras', width: 'half', label: l('Por cada', 'Per'), options: [{ value: 'dia', label: l('Dia de atraso', 'Day late') }, { value: 'semana', label: l('Semana de atraso', 'Week late') }, { value: 'vez', label: l('Atraso (valor único)', 'Late payment (flat)') }], default: 'semana' },
    { name: 'multaDestino', type: 'select', section: 'regras', width: 'half', label: l('A multa vai para', 'Late fee goes to'), options: [{ value: 'beneficiario', label: l('Quem recebe nesse período', 'That period’s recipient') }, { value: 'fundo', label: l('O fundo do grupo', 'The group fund') }], default: 'beneficiario' },
    { name: 'coordenador', type: 'text', section: 'regras', width: 'half', label: l('Coordenador(a)', 'Coordinator') },
    { name: 'tesoureiro', type: 'text', section: 'regras', width: 'half', label: l('Tesoureiro(a)', 'Treasurer') },
    {
      name: 'conflitos',
      type: 'select',
      section: 'regras',
      label: l('Se não houver acordo num conflito', 'If a dispute cannot be settled'),
      options: [
        { value: 'tribunalComunitario', label: l('Tribunal comunitário', 'Community court') },
        { value: 'tribunal', label: l('Tribunal judicial', 'Court') },
      ],
      default: 'tribunalComunitario',
    },
    localField('regras'),
    { name: 'data', type: 'date', section: 'regras', width: 'half', label: l('Data de assinatura', 'Date signed'), default: (c) => c.today },
  ],

  computed: (v) => {
    const m = membrosPoupanca(v);
    const valor = money(v.valor);
    return { membros: m, pote: valor != null ? valor * m.length : null };
  },

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const rot = v.modalidade !== 'acumulativo';
    const m: MembroPoupanca[] = c.membros ?? [];
    const per = PERIODO_TXT[v.periodicidade] ?? 'mês';
    const nome = str(v.nomeGrupo) || BLANK;
    const multa = money(v.multa);
    const meio =
      v.meio === 'carteira'
        ? `por M-Pesa ou e-Mola para o número ${str(v.numeroCarteira) || BLANK}${str(v.titularCarteira) ? `, em nome de ${str(v.titularCarteira)}` : ''}`
        : v.meio === 'conta'
          ? `por depósito na conta ${str(v.numeroCarteira) || BLANK}${str(v.titularCarteira) ? `, em nome de ${str(v.titularCarteira)}` : ''}`
          : 'em mão ao Tesoureiro, contra assinatura no mapa de contribuições';
    const fim = m.length ? m[m.length - 1].data : '';

    const items: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: rot
          ? 'O grupo tem por objecto a poupança regular dos seus membros e a entrega rotativa dos valores poupados, em benefício exclusivo dos membros.'
          : 'O grupo tem por objecto a poupança regular dos seus membros, a concessão de pequenos empréstimos exclusivamente aos membros e a repartição do fundo no fim de cada ciclo.',
        en: rot ? 'Regular saving and rotating payout among members only.' : 'Regular saving, small loans to members only and share-out at the end of the cycle.',
      },
      {
        id: 'membros',
        heading: 'Membros',
        text: `1. O grupo é composto pelos ${m.length ? `${m.length} (${ext(m.length)})` : BLANK} membros identificados no quadro final, que assinam o presente regulamento.\n2. A entrada de novos membros durante o ciclo depende do acordo de todos os membros.\n3. O grupo não recebe dinheiro de pessoas que não sejam membros.`,
        en: 'Members are listed at the end; new members only with everyone’s agreement; no money from outsiders.',
      },
      {
        id: 'contribuicoes',
        heading: 'Contribuições',
        text: `1. Cada membro contribui com ${valorTexto(v.valor)} por ${per}${str(v.diaPagamento) ? `, até ${semPonto(v.diaPagamento)}` : ''}.\n2. As contribuições são entregues ${meio}.`,
        en: 'Amount, frequency and method of contributions.',
      },
      rot
        ? {
            id: 'ordem',
            heading: 'Ordem de recebimento',
            text: `1. Em cada ${per}, um membro recebe a totalidade das contribuições, no valor de ${c.pote != null && c.pote > 0 ? `**${formatMoney(c.pote)}**` : `${BLANK} MT`}, segundo a ordem fixada ${v.ordem === 'acordo' ? 'por acordo' : 'por sorteio'} e indicada no quadro final.\n2. A troca de posição entre dois membros é permitida com o acordo de ambos, comunicado ao Coordenador.\n3. O ciclo termina quando todos os membros tiverem recebido uma vez${fim ? `, previsivelmente em ${dateLong(fim)}` : ''}.`,
            en: 'Each period one member receives the whole pot in the agreed order; swaps by agreement; the cycle ends when all have received.',
          }
        : {
            id: 'fundo',
            heading: 'Fundo e empréstimos',
            text: `1. As contribuições constituem um fundo comum, guardado ${v.meio === 'numerario' ? 'em caixa com registo de todas as entradas e saídas' : 'na conta indicada'}.\n2. Os membros podem pedir empréstimos ao fundo até ${vezes(num(v.multiplo))} o valor das suas poupanças, a reembolsar no prazo máximo de ${quantos(num(v.prazoEmprestimo), 'mês', 'meses')}, com uma contribuição de serviço de ${num(v.taxaServico) ?? BLANK}% por mês, que reverte para o fundo.\n3. No fim do ciclo${str(v.dataReparticao) ? `, em ${dateLong(v.dataReparticao)}` : ''}, o fundo é repartido entre os membros na proporção das suas poupanças.`,
            en: 'A common fund; loans to members only, with a monthly service charge that goes to the fund; share-out at the end in proportion to savings.',
          },
      {
        id: 'atrasos',
        heading: 'Atrasos e faltas',
        text: `1. ${multa != null && multa > 0 ? `O membro que se atrase no pagamento paga uma multa de ${valorTexto(multa, false)} ${v.multaPor === 'dia' ? 'por cada dia de atraso' : v.multaPor === 'vez' ? 'por cada atraso' : 'por cada semana de atraso'}, que reverte para ${v.multaDestino === 'fundo' ? 'o fundo do grupo' : 'o membro que recebe nesse período'}.` : 'O membro que se atrase no pagamento deve regularizá-lo no mais curto prazo, sob pena de as faltas serem apreciadas pelo grupo.'}\n2. ${rot ? 'O membro que já tenha recebido e deixe de contribuir continua obrigado a pagar todas as contribuições em falta até ao fim do ciclo, ficando devedor dos restantes membros pelo valor em dívida.' : 'O membro que não reembolse um empréstimo no prazo fica devedor do fundo pelo valor em falta, que é descontado na sua parte da repartição.'}\n3. O membro que ainda não recebeu e queira sair do grupo recebe as contribuições já pagas no fim do ciclo, sem juros.`,
        en: 'Late fees; members who stop paying remain debtors; leaving members are repaid at the end of the cycle.',
      },
      {
        id: 'coordenacao',
        heading: 'Coordenação',
        text: `1. O grupo é coordenado por **${str(v.coordenador) || BLANK}** e as contribuições são recebidas por **${str(v.tesoureiro) || BLANK}**, que mantém o mapa de contribuições actualizado e o mostra a qualquer membro que o peça.\n2. Cada entrega e cada recebimento são registados no mapa, com a assinatura de quem recebe.`,
        en: 'Coordinator and treasurer; the contribution sheet is kept up to date and open to members.',
      },
      {
        id: 'conflitos',
        heading: 'Conflitos',
        text: `Os conflitos são resolvidos em reunião de todos os membros, por maioria. Não havendo acordo, as partes podem recorrer ${v.conflitos === 'tribunal' ? 'ao tribunal judicial competente' : 'ao tribunal comunitário da área de residência'}.`,
        en: 'Disputes are settled by the members; failing agreement, by the community court or the courts.',
      },
      {
        id: 'vigencia',
        heading: 'Vigência',
        text: `O presente regulamento entra em vigor na data da sua assinatura e vigora até ao fim do ciclo iniciado em ${dateLong(v.dataInicio)}, podendo ser renovado.`,
        en: 'In force from signature until the end of the cycle; renewable.',
      },
    ];

    const rows = (m.length ? m : Array.from({ length: 8 }, () => ({ nome: '', doc: '', telefone: '', data: '' }))).map((r, i) => [
      String(i + 1),
      r.nome,
      r.doc,
      r.telefone,
      ...(rot ? [r.data ? formatDateShort(r.data) : ''] : []),
      '',
    ]);
    const blocks: Block[] = [
      { type: 'title', text: 'Regulamento do Grupo de Poupança', subtitle: `«${nome}»` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `Os membros abaixo identificados e assinados acordam em constituir um grupo de poupança ${rot ? 'de tipo xitique rotativo' : 'de poupança e empréstimo'}, denominado «${nome}», que se rege pelas regras seguintes:`,
        en: 'The undersigned members agree to form a savings group governed by the following rules:',
      },
      { type: 'numberedClauses', style: 'artigo', items },
      { type: 'paragraph', id: 'lugarData', text: `${ctx.place}, ${dateLong(v.data)}.`, en: 'Place and date.', align: 'left', keepWithNext: true },
      { type: 'heading', text: 'Quadro dos membros' },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.4, align: 'center' },
          { label: 'Nome', width: 2.8 },
          { label: 'BI n.º', width: 2.1 },
          { label: 'Telefone', width: 2.1 },
          ...(rot ? [{ label: 'Recebe em', width: 1.6 }] : []),
          { label: 'Assinatura', width: 3.2 },
        ],
        rows,
      },
    ];
    return blocks;
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const m: MembroPoupanca[] = ctx.computed.membros ?? [];
    if (m.length < 2) w.push({ level: 'warning', field: 'membros', message: l('Indique os membros do grupo, pela ordem de recebimento.', 'List the members in payout order.') });
    if (money(v.valor) == null) w.push({ level: 'warning', field: 'valor', message: l('Indique o valor da contribuição.', 'Enter the contribution amount.') });
    w.push({
      level: 'info',
      message: l(
        'Um grupo de poupança não é um banco: não aceite dinheiro de pessoas de fora do grupo nem empreste a terceiros. Guarde o mapa de contribuições assinado.',
        'A savings group is not a bank: do not take money from outsiders or lend to non-members. Keep the signed contribution sheet.',
      ),
    });
    if (m.length > 30) w.push({ level: 'info', field: 'membros', message: l('Com muitos membros, considere constituir uma associação.', 'With many members, consider forming an association.') });
    return w;
  },
  personName: (v) => str(v.nomeGrupo) || undefined,
  documentDate: (v) => str(v.data) || undefined,
});
