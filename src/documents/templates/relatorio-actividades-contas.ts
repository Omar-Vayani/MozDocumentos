import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, formatMoney, l, lineItems, localField, money, placeDate, splitLines } from './_shared';
import { daEntidade, entidadeNome, naturezaField, naturezaOf, num, str, deNome } from './_associacoes';

// Relatório de actividades e contas do exercício, presented by the board to
// the annual general meeting with the audit council's opinion. Simple
// cash-basis statement of income and expenditure with balances.

const RECEITAS_DEFAULT = ['Jóias e quotas dos membros', 'Donativos', 'Subsídios e financiamentos de parceiros', 'Rendimentos de actividades', 'Outras receitas'];
const DESPESAS_DEFAULT = ['Pessoal e colaboradores', 'Funcionamento (renda, água, energia, comunicações)', 'Actividades e projectos', 'Equipamento e investimentos', 'Outras despesas'];

const somar = (rows: Record<string, any>[]) => rows.reduce((s, r) => s + (money(r.valor) ?? 0), 0);

export default defineTemplate({
  id: 'relatorio-actividades-contas',
  family: 'carta',
  sections: [
    { id: 'geral', title: l('Exercício', 'Financial year') },
    { id: 'actividades', title: l('Actividades', 'Activities') },
    { id: 'membros', title: l('Membros', 'Members') },
    { id: 'contas', title: l('Contas', 'Accounts') },
    { id: 'perspectivas', title: l('Perspectivas e proposta', 'Outlook and proposal') },
    { id: 'assinaturas', title: l('Assinaturas e parecer', 'Signatures and opinion') },
  ],
  fields: [
    naturezaField('geral'),
    { name: 'ano', type: 'number', section: 'geral', width: 'half', required: true, label: l('Exercício (ano)', 'Year'), default: (c) => Number(c.today.slice(0, 4)) - 1, min: 1990, max: 2100 },
    { name: 'introducao', type: 'textarea', section: 'geral', rows: 4, label: l('Introdução / mensagem da Direcção', 'Introduction'), help: l('Contexto do ano, principais conquistas e dificuldades.', 'Context of the year, main achievements and difficulties.') },
    {
      name: 'actividades',
      type: 'lines',
      section: 'actividades',
      label: l('Actividades realizadas', 'Activities carried out'),
      addLabel: l('Adicionar actividade', 'Add activity'),
      columns: [
        { name: 'actividade', type: 'text', label: l('Actividade', 'Activity') },
        { name: 'periodo', type: 'text', label: l('Período', 'When') },
        { name: 'local', type: 'text', label: l('Local', 'Where') },
        { name: 'beneficiarios', type: 'number', label: l('Beneficiários', 'Beneficiaries') },
        { name: 'resultados', type: 'text', label: l('Resultados', 'Results') },
      ],
      default: [],
    },
    { name: 'membrosInicio', type: 'number', section: 'membros', width: 'third', label: l('Membros a 1 de Janeiro', 'Members at start'), min: 0 },
    { name: 'admitidos', type: 'number', section: 'membros', width: 'third', label: l('Admitidos', 'Admitted'), min: 0 },
    { name: 'saidas', type: 'number', section: 'membros', width: 'third', label: l('Saídas', 'Left'), min: 0 },
    { name: 'voluntarios', type: 'text', section: 'membros', label: l('Pessoal e voluntários (opcional)', 'Staff and volunteers (optional)'), placeholder: l('Ex.: 2 colaboradores a tempo parcial e 15 voluntários', 'E.g. 2 part-time staff and 15 volunteers') },
    { name: 'saldoInicial', type: 'money', section: 'contas', width: 'half', label: l('Saldo inicial (caixa e bancos)', 'Opening balance (cash and bank)') },
    { name: 'saldoFinalReal', type: 'money', section: 'contas', width: 'half', label: l('Saldo final confirmado (opcional)', 'Confirmed closing balance (optional)'), help: l('Valor contado em caixa e nos extractos. Serve para conferir as contas.', 'Counted cash and bank statements, used to check the accounts.') },
    {
      name: 'receitas',
      type: 'lines',
      section: 'contas',
      label: l('Receitas', 'Income'),
      addLabel: l('Adicionar receita', 'Add income'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição (e financiador)', 'Description (and funder)') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
      default: RECEITAS_DEFAULT.map((descricao) => ({ descricao, valor: '' })),
    },
    {
      name: 'despesas',
      type: 'lines',
      section: 'contas',
      label: l('Despesas', 'Expenditure'),
      addLabel: l('Adicionar despesa', 'Add expenditure'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
      default: DESPESAS_DEFAULT.map((descricao) => ({ descricao, valor: '' })),
    },
    { name: 'perspectivas', type: 'textarea', section: 'perspectivas', rows: 3, label: l('Perspectivas para o ano seguinte', 'Plans for next year'), help: l('Uma linha por prioridade.', 'One line per priority.') },
    { name: 'proposta', type: 'textarea', section: 'perspectivas', rows: 2, label: l('Proposta de aplicação do resultado', 'Proposal for the result'), default: 'A Direcção propõe que o resultado do exercício transite para o exercício seguinte, para financiamento das actividades da Associação.' },
    localField('assinaturas'),
    { name: 'data', type: 'date', section: 'assinaturas', width: 'half', label: l('Data', 'Date'), default: (c) => c.today },
    { name: 'presidenteNome', type: 'text', section: 'assinaturas', width: 'half', label: l('Presidente da Direcção', 'Chair of the board'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'tesoureiroNome', type: 'text', section: 'assinaturas', width: 'half', label: l('Tesoureiro(a)', 'Treasurer') },
    { name: 'parecer', type: 'toggle', section: 'assinaturas', label: l('Incluir o parecer do Conselho Fiscal', 'Include the audit council’s opinion'), default: true },
    { name: 'conselhoFiscal', type: 'textarea', section: 'assinaturas', rows: 3, label: l('Membros do Conselho Fiscal (um por linha)', 'Audit council members (one per line)'), showIf: (v) => Boolean(v.parecer) },
  ],

  computed: (v) => {
    const rec = lineItems(v.receitas);
    const des = lineItems(v.despesas);
    const totalReceitas = somar(rec);
    const totalDespesas = somar(des);
    const resultado = totalReceitas - totalDespesas;
    const ini = money(v.saldoInicial);
    return { totalReceitas, totalDespesas, resultado, saldoFinal: ini != null ? ini + resultado : null };
  },

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const n = naturezaOf(v);
    const nome = entidadeNome(ctx);
    const p = ctx.profile;
    const ano = num(v.ano) ?? BLANK;
    const acts = lineItems(v.actividades).filter((r) => str(r.actividade));
    const rec = lineItems(v.receitas).filter((r) => str(r.descricao) || money(r.valor));
    const des = lineItems(v.despesas).filter((r) => str(r.descricao) || money(r.valor));
    const mi = num(v.membrosInicio);
    const ad = num(v.admitidos) ?? 0;
    const sa = num(v.saidas) ?? 0;
    const fmt = (x: number | null | undefined) => (x == null ? '' : formatMoney(x, false));
    let sec = 0;
    const h = (t: string): Block => ({ type: 'heading', text: `${++sec}. ${t}` });

    const blocks: Block[] = [
      { type: 'title', text: 'Relatório de Actividades e Contas', subtitle: `Exercício de ${ano}` },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Entidade', value: nome },
          ...(p && addressLine(p) ? [{ label: 'Sede', value: addressLine(p) }] : []),
          ...(p?.licenca ? [{ label: 'Reconhecimento', value: p.licenca }] : []),
          ...(p?.nuel ? [{ label: 'NUEL', value: p.nuel }] : []),
          ...(p?.nuit ? [{ label: 'NUIT', value: p.nuit }] : []),
        ],
      },
    ];
    if (str(v.introducao)) {
      blocks.push(h('Introdução'));
      splitLines(v.introducao).forEach((t, i) => blocks.push({ type: 'paragraph', id: `intro-${i}`, text: t, en: 'Introduction.' }));
    }
    blocks.push(h('Actividades realizadas'));
    if (acts.length) {
      const totalBen = acts.reduce((s, r) => s + (num(r.beneficiarios) ?? 0), 0);
      blocks.push({
        type: 'table',
        columns: [
          { label: 'Actividade', width: 3.4 },
          { label: 'Período', width: 1.4 },
          { label: 'Local', width: 1.6 },
          { label: 'Benef.', width: 0.9, align: 'right' },
          { label: 'Resultados', width: 3 },
        ],
        rows: acts.map((r) => [str(r.actividade), str(r.periodo), str(r.local), num(r.beneficiarios) != null ? String(num(r.beneficiarios)) : '', str(r.resultados)]),
        totals: totalBen ? [['Total de beneficiários', '', '', String(totalBen), '']] : undefined,
      });
    } else {
      blocks.push({ type: 'paragraph', id: 'semActividades', text: BLANK, en: 'Activities.' });
    }
    if (mi != null || ad || sa || str(v.voluntarios)) {
      blocks.push(h('Membros e recursos humanos'));
      blocks.push({
        type: 'keyValue',
        columns: 2,
        items: [
          ...(mi != null ? [{ label: 'Membros no início do exercício', value: String(mi) }] : []),
          { label: 'Admitidos', value: String(ad) },
          { label: 'Saídas', value: String(sa) },
          ...(mi != null ? [{ label: 'Membros no fim do exercício', value: String(mi + ad - sa) }] : []),
          ...(str(v.voluntarios) ? [{ label: 'Pessoal e voluntários', value: str(v.voluntarios) }] : []),
        ],
      });
    }
    blocks.push(h('Receitas e despesas (MT)'));
    blocks.push({
      type: 'table',
      columns: [
        { label: 'Descrição', width: 6 },
        { label: 'Valor (MT)', width: 2, align: 'right' },
      ],
      rows: [
        ['§ Receitas', ''],
        ...rec.map((r) => [str(r.descricao), fmt(money(r.valor))]),
        ['= Total das receitas', fmt(c.totalReceitas)],
        ['§ Despesas', ''],
        ...des.map((r) => [str(r.descricao), fmt(money(r.valor))]),
        ['= Total das despesas', fmt(c.totalDespesas)],
      ],
      totals: [[c.resultado >= 0 ? 'Resultado do exercício (excedente)' : 'Resultado do exercício (défice)', fmt(c.resultado)]],
    });
    if (money(v.saldoInicial) != null) {
      blocks.push({
        type: 'keyValue',
        title: 'Saldos de caixa e bancos',
        columns: 2,
        items: [
          { label: `Saldo a 1 de Janeiro de ${ano}`, value: formatMoney(money(v.saldoInicial)) },
          { label: `Saldo a 31 de Dezembro de ${ano}`, value: formatMoney(c.saldoFinal) },
        ],
      });
    }
    if (str(v.perspectivas)) {
      blocks.push(h(`Perspectivas para ${typeof ano === 'number' ? ano + 1 : BLANK}`));
      blocks.push({ type: 'list', style: 'bullet', items: splitLines(v.perspectivas) });
    }
    if (str(v.proposta)) {
      blocks.push(h('Proposta de aplicação do resultado'));
      blocks.push({ type: 'paragraph', id: 'proposta', text: str(v.proposta), en: 'Proposal for the year’s result.', keepWithNext: true });
    } else {
      const last = blocks[blocks.length - 1];
      last.keepWithNext = true;
    }
    blocks.push({
      type: 'signatures',
      placeDate: placeDate(ctx, v.data),
      columns: [
        { role: 'O(A) Presidente da Direcção', name: str(v.presidenteNome) || undefined, image: 'both' },
        { role: 'O(A) Tesoureiro(a)', name: str(v.tesoureiroNome) || undefined },
      ],
    });
    if (v.parecer) {
      const cf = splitLines(v.conselhoFiscal);
      blocks.push(
        { type: 'heading', text: 'Parecer do Conselho Fiscal' },
        {
          type: 'paragraph',
          id: 'parecer',
          text: `O Conselho Fiscal ${deNome(n, nome)} examinou o relatório de actividades e as contas do exercício de ${ano}, bem como os respectivos documentos de suporte, e é de parecer que os mesmos reflectem adequadamente a actividade e a situação financeira ${daEntidade(n)}, pelo que recomenda a sua aprovação pela Assembleia Geral.`,
          en: 'The audit council examined the report and accounts and recommends their approval by the general meeting.',
          keepWithNext: true,
        },
        {
          type: 'signatures',
          placeDate: `${ctx.place}, ___ de ______________ de ______`,
          columns: (cf.length ? cf.slice(0, 3) : ['', '', '']).map((nm, i) => ({ role: i === 0 ? 'O(A) Presidente do Conselho Fiscal' : 'O(A) Vogal', name: nm || undefined })),
        },
      );
    }
    return blocks;
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const c = ctx.computed;
    const real = money(v.saldoFinalReal);
    if (real != null && c.saldoFinal != null && Math.abs(real - c.saldoFinal) > 0.5) {
      w.push({
        level: 'warning',
        field: 'saldoFinalReal',
        message: l(
          `As contas não conferem: o saldo calculado é ${formatMoney(c.saldoFinal)}, mas o saldo confirmado é ${formatMoney(real)}. Verifique receitas e despesas.`,
          `Accounts do not reconcile: computed balance ${formatMoney(c.saldoFinal)} vs confirmed ${formatMoney(real)}.`,
        ),
      });
    }
    w.push({
      level: 'info',
      message: l(
        `O relatório e as contas são apreciados na assembleia geral ordinária anual (${cite('assocAGAnual')}). Se a entidade exerce actividade comercial ou é sujeito passivo de IRPC, as contas seguem as normas contabilísticas aplicáveis.`,
        'The report and accounts go to the annual general meeting. If the entity trades or pays corporate tax, accounting standards apply.',
      ),
    });
    return w;
  },
  documentDate: (v) => str(v.data) || undefined,
});
