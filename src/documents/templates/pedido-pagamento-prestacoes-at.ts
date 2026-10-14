// Requerimento à Autoridade Tributária para pagar uma dívida tributária em
// prestações.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, l, localField, money, moneyText, placeDate } from './_shared';
import { quantos } from './_contratos';
import {
  anexosField, anexosList, assinaturaFiscal, clienteFields, clienteWarnings, destinatarioFiscalFields, endDot, IMPOSTO_OPTIONS, linhas, mandatarioFields, nomeCliente,
  requerenteTexto, requerimentoInicio, s, semPonto,
} from './_financas';

export default defineTemplate({
  id: 'pedido-pagamento-prestacoes-at',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'destinatario', title: l('A quem se dirige', 'Addressee') },
    { id: 'contribuinte', title: l('Contribuinte', 'Taxpayer'), personRole: 'outro' },
    { id: 'divida', title: l('Dívida', 'Debt') },
    { id: 'pedido', title: l('Pedido', 'Request') },
    { id: 'documento', title: l('Assinatura, local e data', 'Signature, place and date') },
  ],
  fields: [
    ...destinatarioFiscalFields('destinatario'),
    ...clienteFields('contribuinte', 'contribuinte'),
    { name: 'imposto', type: 'select', section: 'divida', width: 'half', label: l('Imposto', 'Tax'), options: IMPOSTO_OPTIONS, default: 'IVA' },
    { name: 'impostoOutro', type: 'text', section: 'divida', width: 'half', label: l('Qual imposto ou taxa', 'Which tax or levy'), showIf: (v) => v.imposto === 'outro' },
    { name: 'periodo', type: 'text', section: 'divida', width: 'half', label: l('Período', 'Period'), placeholder: l('Ex.: Janeiro a Junho de 2026', 'E.g. January to June 2026') },
    { name: 'documentoDivida', type: 'text', section: 'divida', width: 'half', label: l('Nota de cobrança / processo de execução n.º', 'Payment notice / enforcement case no.') },
    { name: 'valorDivida', type: 'money', section: 'divida', width: 'half', required: true, label: l('Valor total em dívida', 'Total amount owed') },
    { name: 'execucao', type: 'toggle', section: 'divida', label: l('Já há processo de execução fiscal', 'Enforcement proceedings already opened') },
    { name: 'prestacoes', type: 'number', section: 'pedido', width: 'half', min: 2, max: 120, default: 12, required: true, label: l('Número de prestações pedidas', 'Number of instalments requested') },
    { name: 'entrada', type: 'money', section: 'pedido', width: 'half', label: l('Pagamento inicial que oferece (opcional)', 'Initial payment offered (optional)') },
    {
      name: 'motivos',
      type: 'textarea',
      section: 'pedido',
      required: true,
      rows: 5,
      label: l('Porque não pode pagar de uma vez (um motivo por linha)', 'Why you cannot pay at once (one reason per line)'),
      help: l('Situação económica concreta: quebra de receitas, clientes que não pagaram (incluindo o Estado), investimentos, número de trabalhadores que quer manter.', 'Concrete situation: lower revenue, unpaid customers (including the State), employees to keep.'),
    },
    { name: 'garantia', type: 'text', section: 'pedido', label: l('Garantia oferecida (opcional)', 'Security offered (optional)'), placeholder: l('Ex.: garantia bancária; penhor do equipamento; hipoteca do armazém', 'E.g. bank guarantee; pledge of equipment') },
    anexosField('pedido', l('Ex.: Demonstrações financeiras de 2025; extractos bancários', 'E.g. Financial statements; bank statements')),
    ...mandatarioFields('documento'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  computed: (v) => {
    const total = money(v.valorDivida);
    const entrada = money(v.entrada) ?? 0;
    const n = Math.max(0, Math.round(Number(v.prestacoes) || 0));
    return { total, prestacao: total != null && n > 0 ? Math.round(((total - entrada) / n) * 100) / 100 : null, n };
  },

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'contribuinte')];
    if (!linhas(v.motivos).length) w.push({ level: 'warning', field: 'motivos', message: l('Explique porque não pode pagar de uma só vez.', 'Explain why you cannot pay at once.') });
    w.push({
      level: 'warning',
      message: l(
        `O número máximo de prestações, a entidade que autoriza e a garantia exigida são fixados por lei (${cite('finPrestacoesTributarias')}): confirme-os na Direcção de Área Fiscal antes de entregar. Enquanto o pedido não for deferido, a dívida continua exigível e a falta de pagamento de uma prestação autorizada faz vencer as restantes.`,
        'The maximum number of instalments, the approving authority and the security required are set by law: check them at the tax office. Until approved, the debt remains due; missing an approved instalment makes the rest due.',
      ),
    });
    return w;
  },

  personName: (v) => nomeCliente(v, 'contribuinte') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const P = 'contribuinte';
    const imposto = v.imposto === 'outro' ? s(v.impostoOutro) || BLANK : s(v.imposto) || BLANK;
    const motivos = linhas(v.motivos);
    const anexos = anexosList(v);
    const divida = `a dívida de ${imposto}${s(v.periodo) ? ` relativa ao período de ${semPonto(v.periodo)}` : ''}${s(v.documentoDivida) ? `, constante ${v.execucao ? 'do processo de execução fiscal' : 'da nota de cobrança'} n.º ${s(v.documentoDivida)}` : ''}, no valor total de **${c.total != null ? moneyText(c.total) : `${BLANK} MT`}**`;
    const blocks: Block[] = [
      ...requerimentoInicio(v, `Pedido de pagamento em prestações — ${imposto}`),
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${requerenteTexto(v, P)}, ${v.mandatario ? `por intermédio do seu mandatário, ${s(v.mandatarioNome) || BLANK}, ` : ''}reconhecendo ${divida}, e não lhe sendo possível pagá-la de uma só vez, vem requerer a V. Ex.ª autorização para o seu pagamento em prestações, pelos motivos seguintes:`,
        en: 'The taxpayer acknowledges the tax debt and asks to pay it in instalments, for the reasons below.',
        keepWithNext: true,
      },
      { type: 'list', style: 'numeric', items: motivos.length ? motivos.map(endDot) : [BLANK] },
      {
        type: 'paragraph',
        id: 'proposta',
        text: `Propõe o pagamento ${money(v.entrada) != null ? `de **${moneyText(v.entrada)}** na data do deferimento e do remanescente ` : ''}em ${quantos(c.n, 'prestação', 'prestações', true)} mensais e sucessivas de cerca de **${c.prestacao != null ? moneyText(c.prestacao) : `${BLANK} MT`}**, acrescidas dos juros devidos nos termos legais${s(v.garantia) ? `, oferecendo como garantia ${semPonto(v.garantia).replace(/^(a|o)\s+/i, (m) => m.toLowerCase())}` : ''}, ou noutros termos que V. Ex.ª entenda fixar dentro dos limites legais.`,
        en: 'Proposal: an initial payment if offered and monthly instalments with interest, with any security offered.',
      },
      {
        type: 'paragraph',
        id: 'compromisso',
        text: `Compromete-se a cumprir pontualmente as prestações autorizadas e as obrigações fiscais correntes${v.execucao ? ', requerendo a suspensão do processo de execução fiscal enquanto o plano for cumprido' : ''}.`,
        en: 'The taxpayer undertakes to pay the instalments and current taxes on time.',
      },
    ];
    if (anexos.length) blocks.push({ type: 'annexList', title: 'Junta:', items: anexos });
    blocks.push(
      { type: 'paragraph', id: 'deferimento', text: 'Pede deferimento.', align: 'center', keepWithNext: true, en: 'Requests approval.' },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [assinaturaFiscal(ctx, P, 'O Requerente', 'A Requerente')] },
    );
    return blocks;
  },
});
