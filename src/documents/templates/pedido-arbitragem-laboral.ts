// Pedido de arbitragem laboral: when mediation ends without agreement (certidão
// de impasse), a worker or employer refers the dispute to arbitration at the
// Labour Mediation and Arbitration Centre; the other party must accept it.

import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, formatMoney, l, lineItems, localField, money } from './_shared';
import { artigos, documentosList, moneyExt, papel, partyDesc, partyFields } from './_advocacia';
import { applicantDesc, applicantFields, str, keepTail } from './_processo-penal';

type Pedido = { descricao?: string; valor?: string };

function pedidos(v: Values) {
  return (lineItems(v.pedidos) as Pedido[]).map((p) => ({ descricao: str(p.descricao), valor: money(p.valor) })).filter((p) => p.descricao || p.valor != null);
}

export default defineTemplate({
  id: 'pedido-arbitragem-laboral',
  family: 'carta',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'destino', title: l('Centro de arbitragem', 'Arbitration centre') },
    { id: 'requerente', title: l('Quem pede', 'Applicant'), personRole: 'trabalhador' },
    { id: 'requerido', title: l('A outra parte', 'Other party'), personRole: 'outro' },
    { id: 'conflito', title: l('Conflito', 'Dispute') },
    { id: 'arbitro', title: l('Árbitro e representação', 'Arbitrator and representation') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'centro', type: 'text', section: 'destino', label: l('Centro de Mediação e Arbitragem Laboral de', 'Labour Mediation and Arbitration Centre of'), default: 'Cidade de Maputo', placeholder: l('Ex.: Província de Sofala', 'E.g. Sofala Province') },
    ...applicantFields('requerente', 'requerente'),
    {
      name: 'posicao',
      type: 'radio',
      section: 'requerente',
      label: l('O requerente é', 'The applicant is'),
      default: 'trabalhador',
      options: [
        { value: 'trabalhador', label: l('Trabalhador', 'Worker') },
        { value: 'empregador', label: l('Empregador', 'Employer') },
      ],
    },
    ...partyFields('requerido', 'requerido', { light: true, defaultTipo: 'empresa' }),
    { name: 'mediacaoNumero', type: 'text', section: 'conflito', width: 'half', label: l('Processo de mediação n.º', 'Mediation case no.') },
    { name: 'dataImpasse', type: 'date', section: 'conflito', width: 'half', label: l('Data da certidão de impasse', 'Date of the deadlock certificate') },
    { name: 'materia', type: 'text', section: 'conflito', required: true, label: l('Matéria em litígio', 'Matter in dispute'), placeholder: l('Ex.: despedimento sem justa causa e salários em atraso', 'E.g. unfair dismissal and unpaid wages') },
    { name: 'factos', type: 'textarea', section: 'conflito', rows: 6, label: l('Factos e fundamentos (um por linha)', 'Facts and grounds (one per line)') },
    {
      name: 'pedidos',
      type: 'lines',
      section: 'conflito',
      label: l('O que pede', 'What is claimed'),
      addLabel: l('Acrescentar pedido', 'Add claim'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Pedido', 'Claim'), placeholder: l('Ex.: indemnização por despedimento ilícito', 'E.g. unfair dismissal compensation') },
        { name: 'valor', type: 'money', label: l('Valor (opcional)', 'Amount (optional)') },
      ],
      default: [{ descricao: '', valor: '' }],
    },
    {
      name: 'formaArbitragem',
      type: 'radio',
      section: 'arbitro',
      label: l('Arbitragem por', 'Arbitration by'),
      default: 'singular',
      options: [
        { value: 'singular', label: l('Árbitro único nomeado pelo centro', 'Sole arbitrator appointed by the centre') },
        { value: 'comite', label: l('Comité arbitral (três árbitros)', 'Arbitral committee (three)') },
      ],
    },
    { name: 'arbitroNome', type: 'text', section: 'arbitro', label: l('Árbitro que indica', 'Arbitrator appointed by the applicant'), showIf: (v) => v.formaArbitragem === 'comite' },
    {
      name: 'representante',
      type: 'select',
      section: 'arbitro',
      width: 'half',
      label: l('Representado por', 'Represented by'),
      default: 'nenhum',
      options: [
        { value: 'nenhum', label: l('Comparece pessoalmente', 'In person') },
        { value: 'sindicato', label: l('Sindicato', 'Trade union') },
        { value: 'associacao', label: l('Associação de empregadores', 'Employers’ association') },
        { value: 'advogado', label: l('Advogado / mandatário', 'Lawyer / attorney') },
      ],
    },
    { name: 'representanteNome', type: 'text', section: 'arbitro', width: 'half', label: l('Nome do representante', 'Representative’s name'), showIf: (v) => v.representante !== 'nenhum' },
    { name: 'documentos', type: 'textarea', section: 'arbitro', rows: 3, label: l('Documentos juntos (um por linha)', 'Documents attached (one per line)'), default: 'Certidão de impasse' },
    localField('documento'),
    dateField('data', 'documento'),
  ],

  computed: (v) => {
    const p = pedidos(v);
    return { total: p.some((x) => x.valor != null) ? p.reduce((s, x) => s + (x.valor ?? 0), 0) : null };
  },

  warnings: (_v, ctx) => {
    const a = ctx.legal.value<{ nomeacaoDias: number; decisaoDias: number }>('ppArbitragemLaboral');
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `Não resolvido o conflito na mediação, qualquer das partes pode submetê-lo à arbitragem e a outra deve aceitar. O centro nomeia o árbitro em ${a.nomeacaoDias} dias; a decisão é proferida em ${a.decisaoDias} dias após a última audiência, vale como sentença e admite recurso de anulação para o tribunal do trabalho (${cite('ppArbitragemLaboral')}).`,
          `If mediation fails, either party may refer the dispute to arbitration and the other must accept. The arbitrator is appointed within ${a.nomeacaoDias} days; the award, given within ${a.decisaoDias} days of the last hearing, has the effect of a judgment.`,
        ),
      },
      { level: 'info', message: l(`Lembre-se do prazo de prescrição dos créditos laborais (${cite('prescricaoCreditosLaborais')}); a arbitragem suspende-o. Podem ser devidas custas de arbitragem.`, 'Mind the limitation period for employment claims; arbitration suspends it. Fees may apply.') },
    ];
    return w;
  },

  personName: (v) => v.requerenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const centro = str(v.centro);
    const OR = papel(v, 'requerente', 'O requerente', 'A requerente');
    const p = pedidos(v);
    const factos = artigos(v.factos);
    const docs = documentosList(v.documentos);
    const rep: Record<string, string> = { sindicato: 'pelo organismo sindical', associacao: 'pela associação de empregadores', advogado: 'por mandatário' };
    const blocks: Block[] = [
      { type: 'reference', place: ctx.place, date: v.data },
      { type: 'recipient', salutation: 'Exmo. Senhor', lines: ['Director do Centro de Mediação e Arbitragem Laboral', centro ? (/^(cidade|prov[ií]ncia)/i.test(centro) ? `da ${centro}` : `de ${centro}`) : 'de ____________________'] },
      { type: 'subject', text: `Pedido de arbitragem laboral${str(v.mediacaoNumero) ? ` — processo de mediação n.º ${str(v.mediacaoNumero)}` : ''}` },
      { type: 'salutation', text: 'Exmo. Senhor Director,' },
      {
        type: 'paragraph',
        id: 'requerente',
        text: `${applicantDesc(v, 'requerente', { docBlank: true })}, na qualidade de ${v.posicao === 'empregador' ? 'empregador' : papel(v, 'requerente', 'trabalhador', 'trabalhadora')}, vem, ao abrigo dos ${cite('ppArbitragemLaboral')}, submeter a **arbitragem** o conflito laboral que ${papel(v, 'requerente', 'o', 'a')} opõe a ${partyDesc(v, 'requerido')}, relativo a ${str(v.materia).replace(/[.;]$/, '') || '____________________'}.`,
        en: 'The applicant refers the labour dispute with the other party to arbitration.',
      },
      {
        type: 'paragraph',
        id: 'mediacao',
        text: `O conflito foi submetido a mediação${str(v.mediacaoNumero) ? ` no processo n.º ${str(v.mediacaoNumero)}` : ''}, que terminou sem acordo, conforme certidão de impasse${v.dataImpasse ? ` emitida em ${dateLong(v.dataImpasse)}` : ''}, que se junta.`,
        en: 'Mediation ended without agreement (deadlock certificate attached).',
      },
    ];
    if (factos.length) {
      blocks.push(
        { type: 'paragraph', id: 'factosIntro', text: 'Os factos e fundamentos do pedido são, em síntese, os seguintes:', en: 'Facts and grounds:', keepWithNext: true },
        { type: 'list', style: 'numeric', items: factos },
      );
    }
    if (p.length) {
      blocks.push({
        type: 'table',
        caption: `${OR} pede que seja ${papel(v, 'requerido', 'o requerido condenado', 'a requerida condenada')} no seguinte:`,
        columns: [
          { label: 'Pedido', width: 5 },
          { label: 'Valor', width: 2, align: 'right' },
        ],
        rows: p.map((x) => [x.descricao || '—', x.valor != null ? formatMoney(x.valor) : '—']),
        totals: ctx.computed.total != null ? [['Valor total', formatMoney(ctx.computed.total)]] : undefined,
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'arbitro',
      text:
        v.formaArbitragem === 'comite'
          ? `Requer que a arbitragem seja realizada por comité arbitral, indicando como seu árbitro ${str(v.arbitroNome) || '____________________'}, devendo a outra parte ser notificada para indicar o seu.`
          : 'Requer a nomeação de árbitro pelo Centro e a notificação das partes da data, hora e local da arbitragem.',
      en: 'Request on how the arbitration is conducted.',
    });
    if (v.representante && v.representante !== 'nenhum') {
      blocks.push({ type: 'paragraph', id: 'rep', text: `${OR} far-se-á representar ${rep[v.representante] ?? ''}${str(v.representanteNome) ? `, ${str(v.representanteNome)}` : ''}.`, en: 'Representation.' });
    }
    if (ctx.computed.total != null) blocks.push({ type: 'paragraph', id: 'valor', text: `**Valor do pedido:** ${moneyExt(ctx.computed.total)}.`, en: 'Value of the claim.' });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Pede deferimento.', en: 'Closing formula.', keepWithNext: true },
      { type: 'signatures', columns: [{ role: papel(v, 'requerente', 'O Requerente', 'A Requerente'), name: str(v.requerenteNome) || undefined }] },
    );
    if (docs.length) blocks.push({ type: 'annexList', title: 'Anexos', items: docs });
    return keepTail(blocks, 'arbitro');
  },
});
