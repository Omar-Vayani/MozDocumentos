import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, formatMoney, l, lawyerFields, lawyerSignature, localField, money, placeDate, splitLines } from './_shared';
import {
  alcadas,
  artigos,
  courtAddressee,
  courtFields,
  documentosList,
  juntaText,
  linePara,
  moneyExt,
  papel,
  partyDesc,
  partyFields,
  testemunhasList,
} from './_advocacia';

// ---------------------------------------------------------------- Local helpers

type Forma = 'ordinario' | 'sumario';

function valorCausa(v: Values): number | null {
  const manual = money(v.valorCausa);
  if (manual != null) return manual;
  const capital = money(v.capital);
  if (capital == null) return null;
  return capital + (money(v.jurosVencidos) ?? 0);
}

const FORMA_TEXTO: Record<Forma, string> = { ordinario: 'ORDINÁRIO', sumario: 'SUMÁRIO' };

export default defineTemplate({
  id: 'peticao-inicial',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal', 'Court') },
    { id: 'autor', title: l('Autor (quem propõe a acção)', 'Claimant'), personRole: 'cliente' },
    { id: 'reu', title: l('Réu (contra quem)', 'Defendant'), personRole: 'outro' },
    { id: 'divida', title: l('A dívida', 'The debt') },
    { id: 'factos', title: l('Factos e direito', 'Facts and law') },
    { id: 'pedido', title: l('Pedido e valor da causa', 'Claim and value of the case') },
    { id: 'prova', title: l('Documentos e testemunhas', 'Documents and witnesses') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...courtFields('tribunal'),
    ...partyFields('autor', 'autor', { defaultTipo: 'empresa' }),
    ...partyFields('reu', 'reu', { defaultTipo: 'empresa' }),
    {
      name: 'origemDescricao',
      type: 'text',
      section: 'divida',
      required: true,
      label: l('O que foi fornecido ou prestado', 'What was supplied or provided'),
      placeholder: l('Ex.: material de construção (cimento, varão e chapas de zinco)', 'E.g. building materials'),
      help: l('Completa a frase «…forneceu à Ré, a pedido desta, …».', 'Completes “…supplied to the defendant, at its request, …”.'),
    },
    {
      name: 'origemDocs',
      type: 'text',
      section: 'divida',
      label: l('Documentos que titulam a dívida (opcional)', 'Documents evidencing the debt (optional)'),
      placeholder: l('Ex.: as facturas n.º 112/2026 e n.º 118/2026', 'E.g. invoices no. 112/2026 and 118/2026'),
    },
    { name: 'dataVencimento', type: 'date', section: 'divida', width: 'half', label: l('Data de vencimento', 'Due date') },
    { name: 'dataInterpelacao', type: 'date', section: 'divida', width: 'half', label: l('Data da carta de interpelação (opcional)', 'Date of the demand letter (optional)') },
    { name: 'capital', type: 'money', section: 'divida', width: 'half', required: true, label: l('Capital em dívida', 'Principal owed') },
    {
      name: 'modoFactos',
      type: 'radio',
      section: 'factos',
      label: l('Factos', 'Facts'),
      default: 'padrao',
      options: [
        { value: 'padrao', label: l('Factos-modelo de cobrança + os meus', 'Standard debt facts + my own') },
        { value: 'livre', label: l('Só os factos que eu escrever', 'Only the facts I write') },
      ],
      help: l('Os factos-modelo descrevem o fornecimento, o vencimento, a falta de pagamento e a interpelação.', 'The standard facts describe the supply, due date, non-payment and demand.'),
    },
    {
      name: 'factosAdicionais',
      type: 'textarea',
      section: 'factos',
      rows: 6,
      label: l('Factos (um artigo por linha)', 'Facts (one article per line)'),
      help: l(
        'Cada linha é um artigo numerado (1.º, 2.º…). Um facto por artigo. Refira os documentos como «Documento n.º 2».',
        'Each line becomes a numbered article. One fact per article. Refer to documents as “Documento n.º 2”.',
      ),
    },
    {
      name: 'direitoAdicional',
      type: 'textarea',
      section: 'factos',
      rows: 3,
      label: l('Fundamentos de direito adicionais (opcional)', 'Additional legal grounds (optional)'),
      help: l('Um artigo por linha. Já inclui o regime do incumprimento e da mora do Código Civil.', 'One article per line. The Civil Code rules on default are already included.'),
    },
    { name: 'jurosVencidos', type: 'money', section: 'pedido', width: 'half', label: l('Juros de mora já vencidos (opcional)', 'Interest already accrued (optional)') },
    { name: 'dataCalculoJuros', type: 'date', section: 'pedido', width: 'half', label: l('Juros calculados até', 'Interest calculated up to'), showIf: (v) => money(v.jurosVencidos) != null },
    {
      name: 'taxaJuros',
      type: 'radio',
      section: 'pedido',
      label: l('Taxa de juros', 'Interest rate'),
      default: 'legal',
      options: [
        { value: 'legal', label: l('Taxa legal', 'Legal rate') },
        { value: 'convencionada', label: l('Taxa acordada no contrato', 'Rate agreed in the contract') },
      ],
    },
    { name: 'taxaConvencionada', type: 'text', section: 'pedido', width: 'half', label: l('Taxa acordada', 'Agreed rate'), placeholder: l('Ex.: dois por cento ao mês', 'E.g. two per cent a month'), showIf: (v) => v.taxaJuros === 'convencionada' },
    {
      name: 'outrosPedidos',
      type: 'textarea',
      section: 'pedido',
      rows: 2,
      label: l('Outros pedidos (opcional)', 'Other claims (optional)'),
      help: l('Um por linha. Ex.: «A quantia de 50.000,00 MT a título de cláusula penal».', 'One per line, e.g. a contractual penalty.'),
    },
    {
      name: 'valorCausa',
      type: 'money',
      section: 'pedido',
      width: 'half',
      label: l('Valor da causa', 'Value of the case'),
      legal: l('A petição tem de declarar o valor da causa.', 'The claim must state the value of the case.'),
      help: l('Se deixar vazio, usa capital + juros vencidos.', 'If empty, principal + accrued interest is used.'),
    },
    {
      name: 'formaProcesso',
      type: 'radio',
      section: 'pedido',
      label: l('Forma de processo', 'Form of process'),
      default: 'auto',
      options: [
        { value: 'auto', label: l('Automática (pelo valor)', 'Automatic (by value)') },
        { value: 'ordinario', label: l('Ordinário', 'Ordinary') },
        { value: 'sumario', label: l('Sumário', 'Summary') },
      ],
      help: l('Ordinário quando o valor excede a alçada do Tribunal Judicial de Província.', 'Ordinary when the value exceeds the Provincial Court’s limit.'),
    },
    {
      name: 'documentos',
      type: 'textarea',
      section: 'prova',
      rows: 4,
      label: l('Documentos juntos (um por linha)', 'Documents attached (one per line)'),
      placeholder: l('Factura n.º 112/2026\nFactura n.º 118/2026\nCarta de interpelação de 4 de Setembro de 2026', 'Invoice no. 112/2026\nDemand letter'),
      help: l('São numerados «Documento n.º 1, 2…» pela ordem indicada.', 'Numbered “Documento n.º 1, 2…” in this order.'),
    },
    { name: 'juntaProcuracao', type: 'toggle', section: 'prova', default: true, label: l('Junta procuração forense', 'Power of attorney attached') },
    {
      name: 'testemunhas',
      type: 'textarea',
      section: 'prova',
      rows: 3,
      label: l('Rol de testemunhas (opcional)', 'Witnesses (optional)'),
      help: l('Uma por linha: nome, profissão e morada.', 'One per line: name, occupation and address.'),
    },
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  computed: (v, ctx) => {
    const valor = valorCausa(v);
    const a = alcadas(ctx);
    const auto: Forma = valor != null && a != null && valor <= a.provincia ? 'sumario' : 'ordinario';
    const forma: Forma = v.formaProcesso === 'ordinario' || v.formaProcesso === 'sumario' ? v.formaProcesso : auto;
    return { valor, forma, auto, alcadaProvincia: a?.provincia ?? null, alcadaDistrito: a?.distrito ?? null };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [];
    if (c.valor == null) {
      w.push({ level: 'error', field: 'valorCausa', message: l('Indique o capital ou o valor da causa: a petição sem valor pode ser recusada.', 'Enter the principal or the value of the case: a claim with no value may be refused.') });
    }
    if (c.alcadaProvincia != null) {
      w.push({
        level: 'info',
        field: 'formaProcesso',
        message: l(
          `Alçadas (cível): Tribunal Judicial de Província ${formatMoney(c.alcadaProvincia)}; Tribunal Judicial de Distrito ${formatMoney(c.alcadaDistrito)} — ${cite('advAlcadas')}, com o salário mínimo da Função Pública da tabela em Definições. Confirme o valor em vigor.`,
          `Jurisdictional limits (civil): Provincial Court ${formatMoney(c.alcadaProvincia)}; District Court ${formatMoney(c.alcadaDistrito)}, based on the public-service minimum wage in Settings. Confirm the current value.`,
        ),
      });
    }
    if (v.formaProcesso && v.formaProcesso !== 'auto' && c.valor != null && c.alcadaProvincia != null && v.formaProcesso !== c.auto) {
      w.push({
        level: 'warning',
        field: 'formaProcesso',
        message: l(
          `Pelo valor da causa, a forma seria o processo ${c.auto === 'ordinario' ? 'ordinário' : 'sumário'} (${cite('advFormaProcesso')}).`,
          `Given the value of the case, the form would be ${c.auto === 'ordinario' ? 'ordinary' : 'summary'} process.`,
        ),
      });
    }
    if (!v.advogadoCarteira) {
      w.push({ level: 'warning', field: 'advogadoCarteira', message: l('Indique o número da carteira profissional do advogado.', 'Enter the lawyer’s bar card number.') });
    }
    if (v.juntaProcuracao) {
      w.push({
        level: 'info',
        message: l(
          'A procuração forense deve ter a assinatura do cliente reconhecida presencialmente por notário (documento «Procuração forense»).',
          'The litigation power of attorney needs the client’s signature certified in person by a notary.',
        ),
      });
    }
    const p = ctx.legal.value<{ ordinaria: number; periodicas: number }>('advPrescricaoOrdinaria');
    w.push({
      level: 'info',
      message: l(
        `Verifique a prescrição: prazo ordinário de ${p.ordinaria} anos; ${p.periodicas} anos para rendas, juros e prestações periódicas (${cite('advPrescricaoOrdinaria')}). Se a dívida constar de título executivo (cheque, livrança, letra, documento com assinatura reconhecida), pode propor directamente acção executiva.`,
        `Check limitation: general period ${p.ordinaria} years; ${p.periodicas} years for rents, interest and periodic payments. If the debt is in an enforceable title (cheque, promissory note, notarised document), you can file enforcement proceedings directly.`,
      ),
    });
    w.push({
      level: 'info',
      message: l('A taxa de justiça e os preparos são calculados pela secretaria do tribunal (Código das Custas Judiciais).', 'Court fees are calculated by the court office.'),
    });
    return w;
  },

  personName: (v) => v.reuNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const forma = c.forma as Forma;
    const autorF = papel(v, 'autor', 'Autor', 'Autora');
    const reuF = papel(v, 'reu', 'Réu', 'Ré');
    const oReu = papel(v, 'reu', 'o Réu', 'a Ré');
    const OReu = papel(v, 'reu', 'O Réu', 'A Ré');
    const aoReu = papel(v, 'reu', 'ao Réu', 'à Ré');
    const doReu = papel(v, 'reu', 'do Réu', 'da Ré');
    const desteReu = papel(v, 'reu', 'deste', 'desta');
    const ao = papel(v, 'autor', 'ao Autor', 'à Autora');
    const oAutor = papel(v, 'autor', 'o Autor', 'a Autora');
    const condenado = papel(v, 'reu', 'condenado', 'condenada');
    const interpelado = papel(v, 'reu', 'interpelado', 'interpelada');
    const capital = money(v.capital);
    const juros = money(v.jurosVencidos);

    const factosPadrao: string[] =
      v.modoFactos === 'livre'
        ? []
        : [
            `No exercício da sua actividade, ${oAutor} forneceu ${aoReu}, a pedido ${desteReu}, ${String(v.origemDescricao ?? '').trim() || '____________________'}${v.origemDocs ? `, conforme ${String(v.origemDocs).trim()}` : ''}.`,
            `${OReu} aceitou a prestação sem qualquer reclamação.`,
            `O preço acordado, no montante de ${moneyExt(v.capital)}, devia ser pago até ${dateLong(v.dataVencimento)}.`,
            `Vencida a obrigação, ${oReu} não pagou o preço, nem total nem parcialmente${v.dataInterpelacao ? `, apesar de ter sido ${interpelado} para o efeito por carta de ${dateLong(v.dataInterpelacao)}` : ''}.`,
            `Encontra-se, assim, em dívida o capital de ${formatMoney(capital)}.`,
          ];
    const factos = [...factosPadrao, ...artigos(v.factosAdicionais)];

    const taxa = v.taxaJuros === 'convencionada' ? `à taxa acordada de ${String(v.taxaConvencionada ?? '').trim() || '________'}` : 'à taxa legal';
    const dataMora = v.dataInterpelacao || v.dataVencimento;
    const direito = [
      `O devedor cumpre a obrigação quando realiza a prestação a que está vinculado e, faltando culposamente ao cumprimento, torna-se responsável pelo prejuízo que causa ao credor.`,
      `${OReu} constituiu-se em mora em ${dateLong(dataMora)}, sendo devidos juros moratórios desde essa data, ${taxa}, até efectivo e integral pagamento (${cite('codigoCivilMora')}).`,
      ...(juros != null ? [`Os juros de mora vencidos até ${dateLong(v.dataCalculoJuros || v.data)} ascendem a ${formatMoney(juros)}.`] : []),
      ...artigos(v.direitoAdicional),
    ];

    const pedidos = [
      `A quantia de ${moneyExt(v.capital)}, a título de capital em dívida;`,
      ...(juros != null ? [`A quantia de ${formatMoney(juros)}, a título de juros de mora vencidos até ${dateLong(v.dataCalculoJuros || v.data)};`] : []),
      `Os juros de mora vincendos, ${taxa}, desde a data da propositura da acção até efectivo e integral pagamento;`,
      ...splitLines(v.outrosPedidos).map((s) => `${s.replace(/[.;]$/, '')};`),
      'As custas judiciais e procuradoria condigna.',
    ];

    const docs = documentosList(v.documentos);
    const testemunhas = testemunhasList(v.testemunhas);

    const blocks: Block[] = [
      { type: 'courtHeader', addressee: courtAddressee(v) },
      {
        type: 'paragraph',
        id: 'autor',
        text: `${partyDesc(v, 'autor')}, adiante ${papel(v, 'autor', 'designado', 'designada')} por **${autorF}**,`,
        en: 'Identification of the claimant.',
      },
      { type: 'paragraph', id: 'propoe', text: 'vem, por intermédio do seu mandatário judicial, propor contra', en: 'through its lawyer, brings against' },
      {
        type: 'paragraph',
        id: 'reu',
        text: `${partyDesc(v, 'reu')}, adiante ${papel(v, 'reu', 'designado', 'designada')} por **${reuF}**,`,
        en: 'Identification of the defendant.',
      },
      {
        type: 'paragraph',
        id: 'accao',
        align: 'center',
        text: `a presente\n**ACÇÃO DECLARATIVA DE CONDENAÇÃO, SOB A FORMA DE PROCESSO ${FORMA_TEXTO[forma]}**,`,
        en: `this declaratory action for a money judgment, under ${forma === 'ordinario' ? 'ordinary' : 'summary'} process,`,
      },
      { type: 'paragraph', id: 'fundamentos', text: 'o que faz nos termos e com os fundamentos seguintes:', en: 'on the following terms and grounds:' },
      {
        type: 'articulado',
        sections: [
          { heading: 'I — Dos factos', items: factos.length ? factos : ['____________________'] },
          { heading: 'II — Do direito', items: direito },
        ],
      },
      { type: 'paragraph', id: 'pedidoTitulo', align: 'center', text: '**III — DO PEDIDO**', en: 'III — Claim', keepWithNext: true },
      {
        type: 'paragraph',
        id: 'nestesTermos',
        text: `Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, deve a presente acção ser julgada procedente, por provada, e, em consequência, ser ${oReu} ${condenado} a pagar ${ao}:`,
        en: 'On these grounds, the action should be upheld and the defendant ordered to pay the claimant:',
        keepWithNext: true,
      },
      { type: 'list', style: 'alpha', items: pedidos },
      {
        type: 'paragraph',
        id: 'citacao',
        text: `Para tanto, requer a V. Ex.ª se digne ordenar a citação ${doReu} para, querendo, contestar no prazo e sob a cominação legais, seguindo-se os ulteriores termos até final.`,
        en: 'The claimant asks the court to order service on the defendant to file a defence within the legal time limit, with the further steps until judgment.',
      },
      linePara('valor', 'Valor', `${moneyExt(c.valor)}.`, 'Value of the case.'),
    ];
    const junta = linePara(
      'junta',
      'Junta',
      `${juntaText({ procuracao: Boolean(v.juntaProcuracao), documentos: docs.length })}.`,
      'Attached: power of attorney, documents and copies.',
      testemunhas.length === 0,
    );
    blocks.push(junta);
    if (testemunhas.length) {
      blocks.push(
        { type: 'paragraph', id: 'rol', text: '**Rol de testemunhas:**', en: 'Witnesses:', keepWithNext: true },
        { type: 'list', style: 'numeric', items: testemunhas, keepWithNext: true },
      );
    }
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [lawyerSignature(v)] });
    if (docs.length) blocks.push({ type: 'annexList', title: 'Documentos juntos', items: docs });
    return blocks;
  },
});
