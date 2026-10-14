import { formatDateShort, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, formatMoney, l, lineItems, localField, money, placeDate, splitLines } from './_shared';
import { isEmpresa, moneyExt, papel, partyDesc, partyFields } from './_advocacia';

// ---------------------------------------------------------------- Local helpers

const trim = (s: unknown) => String(s ?? '').trim();
const sem = (s: string) => s.replace(/[.;]$/, '');

type Prestacao = { data: string; valor: number | null };

function prestacoes(v: unknown): Prestacao[] {
  return lineItems(v)
    .map((r) => ({ data: trim(r.data), valor: money(r.valor) }))
    .filter((p) => p.data || p.valor != null);
}

/** "o Primeiro Outorgante" / "a Primeira Outorgante". */
function outorgante(v: Values, p: 'primeiro' | 'segundo', art: 'o' | 'ao' | 'do' | 'pelo' | 'O' = 'o'): string {
  const f = papel(v, p, '', 'f') === 'f';
  const nome = p === 'primeiro' ? (f ? 'Primeira Outorgante' : 'Primeiro Outorgante') : f ? 'Segunda Outorgante' : 'Segundo Outorgante';
  const arts: Record<string, [string, string]> = { o: ['o', 'a'], O: ['O', 'A'], ao: ['ao', 'à'], do: ['do', 'da'], pelo: ['pelo', 'pela'] };
  return `${arts[art][f ? 1 : 0]} ${nome}`;
}

function signature(v: Values, p: 'primeiro' | 'segundo'): SignatureColumn {
  const role = outorgante(v, p, 'O');
  if (isEmpresa(v, p)) return { role, name: trim(v[`${p}Representante`]) || undefined, detail: trim(v[`${p}Nome`]) || undefined };
  return { role, name: trim(v[`${p}Nome`]) || undefined };
}

export default defineTemplate({
  id: 'acordo-de-transaccao',
  family: 'contrato',
  letterhead: false,
  sections: [
    { id: 'primeiro', title: l('Primeiro outorgante (credor)', 'First party (creditor)'), personRole: 'cliente' },
    { id: 'segundo', title: l('Segundo outorgante (devedor)', 'Second party (debtor)'), personRole: 'outro' },
    { id: 'litigio', title: l('O litígio', 'The dispute') },
    { id: 'acordo', title: l('O acordo', 'The settlement') },
    { id: 'pagamento', title: l('Pagamento', 'Payment') },
    { id: 'opcoes', title: l('Cláusulas e assinatura', 'Clauses and signature') },
  ],
  fields: [
    ...partyFields('primeiro', 'primeiro', { defaultTipo: 'empresa' }),
    ...partyFields('segundo', 'segundo', { defaultTipo: 'empresa' }),
    {
      name: 'litigio',
      type: 'textarea',
      section: 'litigio',
      rows: 3,
      required: true,
      label: l('Qual é o litígio', 'What the dispute is about'),
      placeholder: l(
        'Ex.: o Primeiro Outorgante reclama do Segundo o pagamento do preço de material de construção fornecido entre Março e Junho de 2026, no montante de 1.250.000,00 MT, que o Segundo Outorgante não pagou',
        'E.g. the first party claims payment of …',
      ),
      help: l('Completa «Entre as partes existe um litígio relativo a …» ou descreva-o por inteiro.', 'Completes “There is a dispute between the parties concerning …”.'),
    },
    { name: 'processoPendente', type: 'toggle', section: 'litigio', label: l('Já existe processo em tribunal', 'A court case is pending') },
    { name: 'processoNumero', type: 'text', section: 'litigio', width: 'half', label: l('Processo n.º', 'Case no.'), showIf: (v) => Boolean(v.processoPendente) },
    { name: 'tribunal', type: 'text', section: 'litigio', width: 'half', label: l('Tribunal e secção', 'Court and section'), placeholder: l('Ex.: 3.ª Secção Cível do Tribunal Judicial da Cidade de Maputo', 'E.g. 3rd Civil Section, Maputo City Court'), showIf: (v) => Boolean(v.processoPendente) },
    {
      name: 'custas',
      type: 'select',
      section: 'litigio',
      label: l('Custas do processo', 'Court costs'),
      default: 'iguais',
      options: [
        { value: 'iguais', label: l('Em partes iguais', 'Split equally') },
        { value: 'segundo', label: l('Pagas pelo segundo outorgante', 'Paid by the second party') },
        { value: 'primeiro', label: l('Pagas pelo primeiro outorgante', 'Paid by the first party') },
      ],
      showIf: (v) => Boolean(v.processoPendente),
    },
    { name: 'valorReconhecido', type: 'money', section: 'acordo', width: 'half', label: l('Dívida reconhecida pelo devedor (opcional)', 'Debt acknowledged by the debtor (optional)') },
    { name: 'valorAcordado', type: 'money', section: 'acordo', width: 'half', required: true, label: l('Valor que o devedor paga', 'Amount the debtor pays') },
    {
      name: 'concessoes',
      type: 'textarea',
      section: 'acordo',
      rows: 3,
      label: l('Concessões recíprocas (uma por linha)', 'Mutual concessions (one per line)'),
      placeholder: l(
        'O Primeiro Outorgante prescinde dos juros de mora vencidos\nO Segundo Outorgante desiste da reclamação apresentada quanto à qualidade do material',
        'The first party waives accrued interest\nThe second party withdraws its complaint',
      ),
      help: l('Sem concessões recíprocas não há transacção.', 'Without mutual concessions there is no settlement.'),
    },
    {
      name: 'prestacoes',
      type: 'lines',
      section: 'pagamento',
      label: l('Prestações (deixe vazio para pagamento único)', 'Instalments (leave empty for a single payment)'),
      addLabel: l('Adicionar prestação', 'Add instalment'),
      columns: [
        { name: 'data', type: 'date', label: l('Vencimento', 'Due date') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
      default: [],
    },
    { name: 'dataPagamento', type: 'date', section: 'pagamento', width: 'half', label: l('Data do pagamento único', 'Single payment date'), showIf: (v) => prestacoes(v.prestacoes).length === 0 },
    { name: 'formaPagamento', type: 'text', section: 'pagamento', label: l('Forma de pagamento', 'Payment method'), placeholder: l('Ex.: transferência para a conta do Primeiro Outorgante no BCI, NIB 0008 0000 1234 5678 101 23', 'E.g. bank transfer to account …') },
    { name: 'vencimentoAntecipado', type: 'toggle', section: 'opcoes', default: true, label: l('A falta de uma prestação vence todas', 'Missing one instalment makes all due'), showIf: (v) => prestacoes(v.prestacoes).length > 1 },
    { name: 'clausulaPenal', type: 'money', section: 'opcoes', width: 'half', label: l('Cláusula penal em caso de incumprimento (opcional)', 'Penalty for breach (optional)') },
    { name: 'quitacao', type: 'toggle', section: 'opcoes', default: true, label: l('Quitação total após o pagamento', 'Full release after payment') },
    { name: 'confidencialidade', type: 'toggle', section: 'opcoes', label: l('Acordo confidencial', 'Confidential settlement') },
    { name: 'foro', type: 'text', section: 'opcoes', width: 'half', label: l('Foro', 'Jurisdiction'), default: 'Tribunal Judicial da Cidade de Maputo' },
    { name: 'reconhecimento', type: 'toggle', section: 'opcoes', default: true, label: l('Deixar espaço para o reconhecimento notarial das assinaturas', 'Leave space for notarial certification') },
    localField('opcoes'),
    dateField('data', 'opcoes'),
  ],

  computed: (v) => {
    const ps = prestacoes(v.prestacoes);
    const soma = roundMoney(ps.reduce((s, p) => s + (p.valor ?? 0), 0));
    return { ps, soma };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `A transacção exige concessões recíprocas e forma escrita; se envolver direitos sobre imóveis, é necessária escritura pública (${cite('advTransaccao')}).`,
          'A settlement requires mutual concessions and written form; if it involves rights over real estate, a notarial deed is needed.',
        ),
      },
      {
        level: 'info',
        field: 'reconhecimento',
        message: l(
          'Com as assinaturas reconhecidas por notário, o acordo pode servir de título executivo se o devedor não pagar.',
          'With notarised signatures, the settlement can be enforced directly if the debtor does not pay.',
        ),
      },
    ];
    if (v.processoPendente) {
      w.push({
        level: 'info',
        field: 'processoPendente',
        message: l(`Junte o acordo ao processo com um requerimento de homologação (documento «Requerimento ao tribunal») — ${cite('advHomologacaoTransaccao')}.`, 'File the settlement in the case with an application for court approval.'),
      });
    }
    const valor = money(v.valorAcordado);
    if (c.ps.length && valor != null && Math.abs(c.soma - valor) > 0.009) {
      w.push({ level: 'error', field: 'prestacoes', message: l(`A soma das prestações (${formatMoney(c.soma)}) não coincide com o valor acordado (${formatMoney(valor)}).`, 'The instalments do not add up to the agreed amount.') });
    }
    if (splitLines(v.concessoes).length === 0) {
      w.push({ level: 'warning', field: 'concessoes', message: l('Indique as concessões de cada parte.', 'State each party’s concessions.') });
    }
    return w;
  },

  personName: (v) => v.segundoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const ps: Prestacao[] = c.ps;
    const P = (art: 'o' | 'ao' | 'do' | 'pelo' | 'O' = 'o') => outorgante(v, 'primeiro', art);
    const S = (art: 'o' | 'ao' | 'do' | 'pelo' | 'O' = 'o') => outorgante(v, 'segundo', art);
    const designado = (p: 'primeiro' | 'segundo') => (papel(v, p, '', 'f') === 'f' ? 'designada' : 'designado');
    const processo = v.processoPendente
      ? `Corre termos ${/^\d|^sec/i.test(trim(v.tribunal)) ? 'na' : 'no'} ${trim(v.tribunal) || BLANK} o processo n.º ${trim(v.processoNumero) || BLANK}, relativo ao referido litígio`
      : '';
    const considerandos = [
      `Entre as partes existe um litígio relativo ao seguinte: ${sem(trim(v.litigio).replace(/\n+/g, ' ')) || BLANK};`,
      ...(processo ? [`${processo};`] : []),
      'As partes pretendem pôr termo ao litígio mediante concessões recíprocas.',
    ];

    const forma = trim(v.formaPagamento) ? `, por ${sem(trim(v.formaPagamento)).replace(/^por\s+/i, '')}` : '';
    const pagamento = ps.length
      ? `${S('O')} paga ${P('ao')} a quantia de ${moneyExt(v.valorAcordado)}, em ${ps.length} prestações${forma}, nas datas e montantes seguintes:`
      : `${S('O')} paga ${P('ao')} a quantia de ${moneyExt(v.valorAcordado)}, até ${v.dataPagamento ? formatDateShort(v.dataPagamento) : '___/___/______'}${forma}.`;

    const reconhece = money(v.valorReconhecido) != null;
    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: reconhece ? 'Objecto e reconhecimento da dívida' : 'Objecto',
        text: `Pelo presente acordo, as partes põem termo ao litígio descrito nos considerandos, nos termos das cláusulas seguintes.${reconhece ? ` ${S('O')} reconhece dever ${P('ao')} a quantia de ${moneyExt(v.valorReconhecido)}.` : ''}`,
        en: 'The parties end the dispute described above on the following terms; the second party acknowledges the debt where stated.',
      },
    ];
    const conc = splitLines(v.concessoes).map(sem);
    clauses.push({
      id: 'concessoes',
      heading: 'Concessões recíprocas',
      text: conc.length ? 'As partes fazem as seguintes concessões recíprocas:' : `${BLANK}.`,
      items: conc.length ? conc.map((s, i, a) => `${s}${i === a.length - 1 ? '.' : ';'}`) : undefined,
      en: 'Mutual concessions of the parties.',
    });
    clauses.push({
      id: 'pagamento',
      heading: 'Pagamento',
      text: pagamento,
      items: ps.length
        ? ps.map((p, i) => `${i + 1}.ª prestação: ${p.valor != null ? formatMoney(p.valor) : '________ MT'}, até ${p.data ? formatDateShort(p.data) : '___/___/______'}${i === ps.length - 1 ? '.' : ';'}`)
        : undefined,
      en: 'Payment of the agreed amount.',
    });
    if (ps.length > 1 && v.vencimentoAntecipado) {
      clauses.push({
        id: 'vencimento',
        heading: 'Vencimento antecipado',
        text: `A falta de pagamento de qualquer prestação na data do seu vencimento importa o vencimento imediato de todas as restantes (${cite('codigoCivilPrestacoes')}).`,
        en: 'Missing any instalment makes all remaining instalments immediately due.',
      });
    }
    if (money(v.clausulaPenal) != null) {
      clauses.push({
        id: 'penal',
        heading: 'Cláusula penal',
        text: `Em caso de incumprimento, ${S()} paga ${P('ao')}, a título de cláusula penal, a quantia de ${moneyExt(v.clausulaPenal)}, sem prejuízo da exigibilidade do montante em dívida.`,
        en: 'A penalty is payable on breach, in addition to the amount owed.',
      });
    }
    if (v.quitacao) {
      clauses.push({
        id: 'quitacao',
        heading: 'Quitação',
        text: 'Com o integral cumprimento do presente acordo, as partes dão-se mútua, plena e geral quitação, nada mais tendo a reclamar uma da outra relativamente ao objecto do litígio.',
        en: 'Once the settlement is fully performed, the parties release each other from all claims on the dispute.',
      });
    }
    if (v.processoPendente) {
      const custas = v.custas === 'segundo' ? `a cargo ${S('do')}` : v.custas === 'primeiro' ? `a cargo ${P('do')}` : 'em partes iguais';
      clauses.push({
        id: 'homologacao',
        heading: 'Processo judicial',
        text: `As partes requerem a homologação do presente acordo por sentença no processo n.º ${trim(v.processoNumero) || BLANK}, com a consequente extinção da instância, sendo as custas ${custas}.`,
        en: 'The parties will ask the court to approve this settlement and end the case; costs as stated.',
      });
    }
    if (v.confidencialidade) {
      clauses.push({
        id: 'confidencialidade',
        heading: 'Confidencialidade',
        text: 'As partes obrigam-se a manter confidenciais os termos do presente acordo, salvo na medida necessária à sua execução ou homologação, ou quando exigido por lei.',
        en: 'The parties keep the terms confidential, except as needed to perform or approve it, or where required by law.',
      });
    }
    clauses.push({
      id: 'foro',
      heading: 'Lei aplicável e foro',
      text: `O presente acordo rege-se pela lei moçambicana. Para a resolução de quaisquer litígios emergentes do mesmo, as partes elegem o foro do ${trim(v.foro).replace(/^(o|do)\s+/i, '') || BLANK}, com expressa renúncia a qualquer outro.`,
      en: 'Mozambican law applies; the chosen court has jurisdiction.',
    });

    const blocks: Block[] = [
      { type: 'title', text: 'Acordo de transacção' },
      { type: 'paragraph', id: 'entre', text: '**Entre:**', align: 'left', editable: false },
      { type: 'paragraph', id: 'primeiro', text: `${partyDesc(v, 'primeiro')}, adiante ${designado('primeiro')} por **${P().replace(/^(o|a) /, '')}**;`, en: 'The first party identified above;' },
      { type: 'paragraph', id: 'e', text: '**e**', align: 'left', editable: false },
      { type: 'paragraph', id: 'segundo', text: `${partyDesc(v, 'segundo')}, adiante ${designado('segundo')} por **${S().replace(/^(o|a) /, '')}**;`, en: 'The second party identified above;' },
      { type: 'paragraph', id: 'considerando', text: '**Considerando que:**', align: 'left', en: 'Whereas:', keepWithNext: true },
      { type: 'list', style: 'alpha', items: considerandos },
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'É livremente celebrado o presente acordo de transacção, que se rege pelas cláusulas seguintes:',
        en: 'This settlement agreement is freely entered into on the following clauses:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      {
        type: 'paragraph',
        id: 'exemplares',
        text: `O presente acordo é feito em ${v.processoPendente ? 'três' : 'dois'} exemplares de igual valor${v.processoPendente ? ', um para cada parte e outro para juntar ao processo' : ', ficando um em poder de cada uma das partes'}.`,
        en: 'Made in counterparts of equal value.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [signature(v, 'primeiro'), signature(v, 'segundo')] },
    ];
    if (v.reconhecimento) {
      blocks.push({ type: 'box', label: 'Reconhecimento notarial', text: 'Reconhecimento presencial das assinaturas dos outorgantes (reservado ao notário).', lines: 4, dashed: true });
    }
    return blocks;
  },
});
