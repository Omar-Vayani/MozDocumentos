import { addDays, addMonths, formatDateShort, MESES, parseISODate } from '@/lib/format';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, formatMoney, l, money } from './_shared';
import { membrosPoupanca, num, PERIODO_OPTIONS, PERIODO_TXT, str } from './_associacoes';

// Mapa de contribuições de um xitique: the treasurer's control sheet, printed
// once per cycle (A4 landscape) and filled in by hand: one row per member, one
// column per period, then who received the pot and their signature.

const MAX_COLS = 12;

function datasPeriodos(v: Values, n: number): string[] {
  const ini = str(v.dataInicio);
  return Array.from({ length: n }, (_, i) => {
    if (!ini) return `${i + 1}.º`;
    const iso = v.periodicidade === 'semana' ? addDays(ini, 7 * i) : v.periodicidade === 'quinzena' ? addDays(ini, 14 * i) : addMonths(ini, i);
    if (v.periodicidade === 'mes') {
      const d = parseISODate(iso);
      return d ? `${MESES[d.getMonth()].slice(0, 3)}/${String(d.getFullYear()).slice(2)}` : `${i + 1}.º`;
    }
    return formatDateShort(iso).slice(0, 5);
  });
}

export default defineTemplate({
  id: 'mapa-contribuicoes-poupanca',
  family: 'mapa',
  page: 'A4-paisagem',
  letterhead: false,
  sections: [
    { id: 'grupo', title: l('Grupo', 'Group') },
    { id: 'membros', title: l('Membros', 'Members') },
  ],
  fields: [
    { name: 'nomeGrupo', type: 'text', section: 'grupo', required: true, label: l('Nome do grupo', 'Group name') },
    {
      name: 'modalidade',
      type: 'radio',
      section: 'grupo',
      label: l('Tipo de grupo', 'Type of group'),
      options: [
        { value: 'rotativo', label: l('Xitique rotativo', 'Rotating') },
        { value: 'acumulativo', label: l('Poupança e empréstimo', 'Savings and loan') },
      ],
      default: 'rotativo',
    },
    { name: 'valor', type: 'money', section: 'grupo', width: 'half', label: l('Contribuição por período', 'Contribution per period') },
    { name: 'periodicidade', type: 'select', section: 'grupo', width: 'half', label: l('Periodicidade', 'Frequency'), options: PERIODO_OPTIONS, default: 'mes' },
    { name: 'dataInicio', type: 'date', section: 'grupo', width: 'half', label: l('Primeiro período', 'First period'), default: (c) => c.today },
    { name: 'periodos', type: 'number', section: 'grupo', width: 'half', label: l('Número de períodos', 'Number of periods'), help: l('Vazio = um período por membro.', 'Empty = one period per member.'), min: 1, max: 36 },
    { name: 'coordenador', type: 'text', section: 'grupo', width: 'half', label: l('Coordenador(a)', 'Coordinator') },
    { name: 'tesoureiro', type: 'text', section: 'grupo', width: 'half', label: l('Tesoureiro(a)', 'Treasurer') },
    {
      name: 'membros',
      type: 'lines',
      section: 'membros',
      label: l('Membros (pela ordem de recebimento)', 'Members (in payout order)'),
      help: l('Deixe vazio para imprimir linhas em branco.', 'Leave empty to print blank rows.'),
      addLabel: l('Adicionar membro', 'Add member'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'telefone', type: 'tel', label: l('Telefone', 'Phone') },
      ],
      default: [],
    },
    { name: 'linhasEmBranco', type: 'number', section: 'membros', width: 'half', label: l('Linhas em branco (sem membros)', 'Blank rows (no members)'), default: 12, min: 1, max: 40 },
  ],

  blocks: (ctx) => {
    const v = ctx.values;
    const rot = v.modalidade !== 'acumulativo';
    const m = membrosPoupanca(v);
    const nRows = m.length || Math.min(40, Math.max(1, num(v.linhasEmBranco) ?? 12));
    const nPer = Math.min(36, Math.max(1, num(v.periodos) ?? (m.length || 12)));
    const datas = datasPeriodos(v, nPer);
    const valor = money(v.valor);
    const pote = valor != null && m.length ? valor * m.length : null;
    const blocks: Block[] = [
      { type: 'title', text: 'Mapa de Contribuições', subtitle: `Grupo de poupança «${str(v.nomeGrupo) || BLANK}»` },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Contribuição', value: valor != null ? `${formatMoney(valor)} por ${PERIODO_TXT[v.periodicidade] ?? 'mês'}` : BLANK },
          { label: rot ? 'Valor a receber em cada período' : 'Membros', value: rot ? (pote != null ? formatMoney(pote) : BLANK) : String(m.length || BLANK) },
          { label: 'Coordenador(a)', value: str(v.coordenador) || BLANK },
          { label: 'Tesoureiro(a)', value: str(v.tesoureiro) || BLANK },
        ],
      },
    ];
    for (let start = 0; start < nPer; start += MAX_COLS) {
      const cols = datas.slice(start, start + MAX_COLS);
      const last = start + MAX_COLS >= nPer;
      const extra = rot && last ? [{ label: 'Recebe em', width: 1.3 }, { label: 'Assinatura', width: 2.2 }] : [];
      blocks.push({
        type: 'table',
        caption: nPer > MAX_COLS ? `Períodos ${start + 1} a ${Math.min(nPer, start + MAX_COLS)}` : undefined,
        columns: [
          { label: 'N.º', width: 0.5, align: 'center' },
          { label: 'Nome', width: 3.2 },
          ...cols.map((d) => ({ label: d, width: 0.9, align: 'center' as const })),
          ...extra,
        ],
        rows: Array.from({ length: nRows }, (_, i) => [
          String(i + 1),
          m[i]?.nome ?? '',
          ...cols.map(() => ''),
          ...(extra.length ? [rot && m[i]?.data ? formatDateShort(m[i].data) : '', ''] : []),
        ]),
        note: last ? 'Assinale cada contribuição recebida com a rubrica do tesoureiro. Quem recebe assina na última coluna.' : undefined,
      });
    }
    blocks.push({
      type: 'signatures',
      columns: [
        { role: 'O(A) Coordenador(a)', name: str(v.coordenador) || undefined },
        { role: 'O(A) Tesoureiro(a)', name: str(v.tesoureiro) || undefined },
      ],
    });
    return blocks;
  },

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.nomeGrupo)) w.push({ level: 'warning', field: 'nomeGrupo', message: l('Indique o nome do grupo.', 'Enter the group name.') });
    return w;
  },
  personName: (v) => str(v.nomeGrupo) || undefined,
});
