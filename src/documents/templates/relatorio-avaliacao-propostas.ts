// Relatório de avaliação das propostas (relatório do júri): verification of the
// bidders' qualification and of the bids' conformity, evaluation under the
// tender criterion, ranking and the proposed award, for the competent
// authority's decision.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, formatMoney, l, lineItems, localField, money } from './_shared';
import { estadoRef, numeroField, paragraphs } from './_estado';
import { CRITERIO_OPTIONS, entidadeProfileWarning, juriField, juriSignatures, juriTexto, objectoComArtigo, procedimentoFields, procedimentoNome, semPonto, str, valorTexto } from './_contratacao';

type Linha = { concorrente: string; preco: number | null; conforme: boolean; motivo: string; pontos: number | null };

function linhas(v: Record<string, unknown>): Linha[] {
  return lineItems(v.avaliacao)
    .filter((r) => str(r.concorrente))
    .map((r) => ({
      concorrente: str(r.concorrente),
      preco: money(r.preco),
      conforme: r.conforme !== 'nao',
      motivo: str(r.motivo),
      pontos: r.pontos === '' || r.pontos == null || !Number.isFinite(Number(r.pontos)) ? null : Number(r.pontos),
    }));
}

/** Qualified bids ranked: by score (highest first) when scores are given, otherwise by price (lowest first). */
function ranking(ls: Linha[]): Linha[] {
  const ok = ls.filter((x) => x.conforme);
  const porPontos = ok.some((x) => x.pontos != null);
  return [...ok].sort((a, b) => (porPontos ? (b.pontos ?? -1) - (a.pontos ?? -1) : (a.preco ?? Infinity) - (b.preco ?? Infinity)));
}

const CRITERIO_FRASE: Record<string, string> = {
  preco: 'menor preço avaliado',
  combinacao: 'combinação da qualidade técnica e do preço',
  qualidade: 'qualidade técnica',
};

export default defineTemplate({
  id: 'relatorio-avaliacao-propostas',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Número, local e data', 'Number, place and date') },
    { id: 'procedimento', title: l('Concurso', 'Tender') },
    { id: 'juri', title: l('Júri', 'Jury') },
    { id: 'avaliacao', title: l('Qualificação e avaliação', 'Qualification and evaluation') },
    { id: 'conclusao', title: l('Conclusão', 'Conclusion') },
  ],
  fields: [
    numeroField(),
    localField(),
    dateField('data'),
    ...procedimentoFields(),
    { name: 'dataAbertura', type: 'date', section: 'procedimento', width: 'half', label: l('Data da abertura das propostas', 'Bid opening date') },
    { name: 'criterio', type: 'select', section: 'procedimento', width: 'half', label: l('Critério de avaliação', 'Evaluation criterion'), options: CRITERIO_OPTIONS, default: 'preco' },
    { name: 'despachoJuri', type: 'text', section: 'juri', label: l('Acto que designou o júri', 'Act appointing the jury'), placeholder: l('Ex.: Despacho n.º 12/DPS-NPL/2026, de 2 de Outubro', 'E.g. Order 12/DPS-NPL/2026') },
    juriField('juri'),
    {
      name: 'avaliacao',
      type: 'lines',
      section: 'avaliacao',
      label: l('Propostas analisadas', 'Bids examined'),
      addLabel: l('Adicionar proposta', 'Add bid'),
      columns: [
        { name: 'concorrente', type: 'text', label: l('Concorrente', 'Bidder') },
        { name: 'preco', type: 'money', label: l('Preço avaliado', 'Evaluated price') },
        {
          name: 'conforme',
          type: 'select',
          label: l('Qualificado e conforme', 'Qualified and compliant'),
          options: [
            { value: 'sim', label: l('Sim', 'Yes') },
            { value: 'nao', label: l('Não (desclassificada)', 'No (disqualified)') },
          ],
          default: 'sim',
        },
        { name: 'motivo', type: 'text', label: l('Fundamento / observações', 'Reason / notes') },
        { name: 'pontos', type: 'number', label: l('Pontuação final (se aplicável)', 'Final score (if any)') },
      ],
      default: [],
      help: l('O preço avaliado é o preço lido, corrigido de erros aritméticos e ajustado segundo o documento de concurso.', 'The evaluated price is the price read out, corrected for arithmetic errors and adjusted as the tender document provides.'),
    },
    { name: 'analise', type: 'textarea', section: 'avaliacao', rows: 4, label: l('Análise do júri (opcional)', 'Jury’s analysis (optional)'), help: l('Correcções aritméticas, esclarecimentos pedidos, verificação dos documentos, preços anormalmente baixos.', 'Arithmetic corrections, clarifications asked, document checks, abnormally low prices.') },
    { name: 'adjudicatario', type: 'text', section: 'conclusao', width: 'half', label: l('Proposta de adjudicação a', 'Proposed award to'), help: l('Vazio: usa a primeira classificada.', 'Empty: uses the first ranked bid.') },
    { name: 'valorAdjudicacao', type: 'money', section: 'conclusao', width: 'half', label: l('Valor a adjudicar', 'Amount to award') },
    { name: 'autoridade', type: 'text', section: 'conclusao', width: 'half', label: l('Autoridade competente (despacho)', 'Competent authority'), placeholder: l('Ex.: Director Provincial de Saúde', 'E.g. Provincial Director of Health') },
  ],

  computed: (v) => {
    const ls = linhas(v);
    const rank = ranking(ls);
    const venc = str(v.adjudicatario) || rank[0]?.concorrente || '';
    const vl = money(v.valorAdjudicacao) ?? ls.find((x) => x.concorrente === venc)?.preco ?? null;
    return { ls, rank, venc, valor: vl };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [...entidadeProfileWarning(ctx)];
    if (!c.ls.length) w.push({ level: 'warning', field: 'avaliacao', message: l('Registe as propostas analisadas.', 'Record the bids examined.') });
    if (c.ls.some((x: Linha) => !x.conforme && !x.motivo)) w.push({ level: 'warning', field: 'avaliacao', message: l('Indique o fundamento de cada desclassificação: sem ele a decisão pode ser anulada em reclamação.', 'State the reason for each disqualification: without it the decision may be annulled on complaint.') });
    if (v.modalidade === 'cotacoes') {
      const min = ctx.legal.value<number>('ctCotacoesMinimo');
      if (c.ls.length < min) w.push({ level: 'warning', field: 'avaliacao', message: l(`No concurso por cotações devem ser avaliadas pelo menos ${min} cotações (${cite('ctCotacoesMinimo')}); justifique se houver menos.`, `At least ${min} quotations should be evaluated; justify if fewer.`) });
    }
    w.push({ level: 'info', message: l(`O relatório é submetido à autoridade competente para a decisão de adjudicação, que é notificada a todos os concorrentes (${cite('ctAdjudicacao')}).`, 'The report goes to the competent authority for the award decision, which is notified to all bidders.') });
    return w;
  },

  personName: (v) => v.concursoNumero,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const ls: Linha[] = c.ls;
    const rank: Linha[] = c.rank;
    const criterio = CRITERIO_FRASE[str(v.criterio)] ?? CRITERIO_FRASE.preco;
    const despacho = semPonto(v.despachoJuri);
    const desc = ls.filter((x) => !x.conforme);
    const temPontos = ls.some((x) => x.pontos != null);
    const blocks: Block[] = [
      { type: 'reference', ref: estadoRef(ctx, 'Relatório'), place: ctx.place, date: dateLong(v.data) },
      { type: 'title', text: 'Relatório de avaliação das propostas', subtitle: procedimentoNome(v) },
      { type: 'heading', text: '1. Introdução' },
      {
        type: 'paragraph',
        id: 'introducao',
        text: `O júri do ${procedimentoNome(v)}, para ${objectoComArtigo(v)}${despacho ? `, designado por ${despacho.replace(/^(pelo|por)\s+/i, '')}` : ''}, composto por ${juriTexto(v)}, procedeu à análise e avaliação das propostas abertas em acto público${v.dataAbertura ? ` em ${dateLong(v.dataAbertura)}` : ''}, segundo o critério do ${criterio}, e apresenta o seguinte relatório.`,
        en: 'The jury examined and evaluated the bids under the tender criterion and presents this report.',
      },
      { type: 'heading', text: '2. Propostas analisadas' },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.4, align: 'right' },
          { label: 'Concorrente', width: 2.4 },
          { label: 'Preço avaliado (MT)', width: 1.5, align: 'right' },
          { label: 'Situação', width: 1.1, align: 'center' },
          { label: 'Fundamento / observações', width: 2.4 },
        ],
        rows: (ls.length ? ls : [null, null, null]).map((x, i) => (x ? [String(i + 1), x.concorrente, x.preco != null ? formatMoney(x.preco, false) : '', x.conforme ? 'Admitida' : 'Desclassificada', x.motivo] : [String(i + 1), '', '', '', ''])),
        grid: !ls.length,
      },
    ];
    const an = paragraphs(v.analise);
    if (an.length || desc.length) {
      blocks.push({ type: 'heading', text: '3. Análise' });
      an.forEach((p, i) => blocks.push({ type: 'paragraph', id: `analise-${i + 1}`, text: p, en: 'Jury’s analysis.' }));
      if (desc.length) {
        blocks.push({
          type: 'paragraph',
          id: 'desclassificacoes',
          text: `${desc.length === 1 ? 'Foi desclassificada a proposta' : 'Foram desclassificadas as propostas'} de ${desc.map((x) => `${x.concorrente}${x.motivo ? ` (${semPonto(x.motivo)})` : ''}`).join('; ')}.`,
          en: 'Disqualified bids and reasons.',
        });
      }
    }
    const nClass = an.length || desc.length ? 4 : 3;
    blocks.push(
      { type: 'heading', text: `${nClass}. Classificação` },
      {
        type: 'table',
        columns: [
          { label: 'Ordem', width: 0.7, align: 'center' },
          { label: 'Concorrente', width: 3.2 },
          { label: 'Preço avaliado (MT)', width: 1.6, align: 'right' },
          ...(temPontos ? [{ label: 'Pontuação', width: 1, align: 'right' as const }] : []),
        ],
        rows: (rank.length ? rank : [null]).map((x, i) => (x ? [`${i + 1}.º`, x.concorrente, x.preco != null ? formatMoney(x.preco, false) : '', ...(temPontos ? [x.pontos != null ? String(x.pontos).replace('.', ',') : ''] : [])] : ['', '', '', ...(temPontos ? [''] : [])])),
      },
      { type: 'heading', text: `${nClass + 1}. Proposta de adjudicação` },
      {
        type: 'paragraph',
        id: 'proposta',
        text: `Face ao exposto, o júri propõe a adjudicação do ${procedimentoNome(v)} a **${c.venc || '____________________'}**, pelo valor de ${valorTexto(c.valor)}, por ter apresentado a proposta mais vantajosa segundo o critério do ${criterio}.`,
        keepWithNext: true,
        en: 'The jury proposes the award to the first-ranked bidder for the stated amount.',
      },
      { type: 'paragraph', id: 'local', text: `${ctx.place}, ${dateLong(v.data)}.`, align: 'left', keepWithNext: true, en: 'Place and date.' },
      { type: 'heading', text: 'O Júri', keepWithNext: true },
      ...juriSignatures(v),
      {
        type: 'box',
        label: `Despacho${str(v.autoridade) ? ` — ${semPonto(v.autoridade)}` : ''}`,
        text: 'Homologo o relatório e adjudico nos termos propostos. / Outra decisão:',
        lines: 3,
      },
    );
    return blocks;
  },
});
