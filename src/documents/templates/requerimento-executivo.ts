import { defineTemplate, type Block, type FieldOption, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, formatMoney, l, lawyerFields, localField, money, splitLines } from './_shared';
import { artigos, courtFields, moneyExt, partyFields } from './_advocacia';
import { closing, g3, lawyerWarnings, petitionHead, prova, provaFields, sem, str } from './_processo-civil';

type Fim = 'pagamento' | 'entrega' | 'facto';

const FIM_OPTIONS: FieldOption[] = [
  { value: 'pagamento', label: l('Pagamento de quantia certa', 'Payment of a sum of money') },
  { value: 'entrega', label: l('Entrega de coisa certa', 'Delivery of a specific thing') },
  { value: 'facto', label: l('Prestação de facto', 'Performance of an act') },
];

const TITULO_OPTIONS: FieldOption[] = [
  { value: 'sentenca', label: l('Sentença condenatória', 'Judgment') },
  { value: 'notarial', label: l('Escritura ou documento autenticado por notário', 'Notarial deed or authenticated document') },
  { value: 'particular', label: l('Documento particular assinado pelo devedor', 'Private document signed by the debtor') },
  { value: 'letra', label: l('Letra de câmbio', 'Bill of exchange') },
  { value: 'livranca', label: l('Livrança', 'Promissory note') },
  { value: 'cheque', label: l('Cheque', 'Cheque') },
  { value: 'outro', label: l('Outro título com força executiva', 'Other enforceable title') },
];

const FIM_TEXTO: Record<Fim, string> = {
  pagamento: 'EXECUÇÃO PARA PAGAMENTO DE QUANTIA CERTA',
  entrega: 'EXECUÇÃO PARA ENTREGA DE COISA CERTA',
  facto: 'EXECUÇÃO PARA PRESTAÇÃO DE FACTO',
};

const fim = (v: Values): Fim => (v.fim === 'entrega' || v.fim === 'facto' ? v.fim : 'pagamento');
const isSentenca = (v: Values) => v.tituloTipo === 'sentenca';

function valorExecucao(v: Values): number | null {
  const manual = money(v.valorCausa);
  if (manual != null) return manual;
  if (fim(v) !== 'pagamento') return null;
  const c = money(v.capital);
  return c == null ? null : c + (money(v.jurosVencidos) ?? 0) + (money(v.outrasQuantias) ?? 0);
}

export default defineTemplate({
  id: 'requerimento-executivo',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal', 'Court') },
    { id: 'exequente', title: l('Exequente (credor)', 'Creditor'), personRole: 'cliente' },
    { id: 'executado', title: l('Executado (devedor)', 'Debtor'), personRole: 'outro' },
    { id: 'titulo', title: l('Título executivo', 'Enforceable title') },
    { id: 'obrigacao', title: l('Obrigação exequenda', 'Obligation to enforce') },
    { id: 'penhora', title: l('Bens à penhora', 'Assets to attach') },
    { id: 'prova', title: l('Documentos', 'Documents') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...courtFields('tribunal'),
    { name: 'fim', type: 'select', section: 'tribunal', required: true, label: l('Finalidade da execução', 'Purpose of the enforcement'), options: FIM_OPTIONS, default: 'pagamento' },
    {
      name: 'forma',
      type: 'radio',
      section: 'tribunal',
      width: 'half',
      label: l('Forma de processo', 'Form of process'),
      default: 'ordinaria',
      options: [
        { value: 'ordinaria', label: l('Ordinária', 'Ordinary') },
        { value: 'sumaria', label: l('Sumária', 'Summary') },
      ],
      help: l('Depende do valor e do título. Confirme no Código de Processo Civil.', 'Depends on the value and the title. Confirm in the Civil Procedure Code.'),
    },
    { name: 'processoNumero', type: 'text', section: 'tribunal', width: 'half', label: l('Processo onde foi proferida a sentença', 'Case where the judgment was given'), placeholder: l('Ex.: 245/2026', 'E.g. 245/2026'), showIf: isSentenca },
    ...partyFields('exequente', 'exequente', { defaultTipo: 'empresa' }),
    ...partyFields('executado', 'executado', { defaultTipo: 'pessoa' }),
    { name: 'tituloTipo', type: 'select', section: 'titulo', required: true, label: l('Tipo de título', 'Type of title'), options: TITULO_OPTIONS, default: 'particular' },
    {
      name: 'tituloDescricao',
      type: 'text',
      section: 'titulo',
      required: true,
      label: l('Descrição do título', 'Description of the title'),
      placeholder: l('Ex.: declaração de dívida e acordo de pagamento de 10 de Março de 2026, com assinatura reconhecida presencialmente', 'E.g. acknowledgement of debt of 10 March 2026, with certified signature'),
      help: l('Identifique o documento, a data e, sendo sentença, o tribunal que a proferiu.', 'Identify the document, its date and, for a judgment, the court.'),
    },
    { name: 'dataTransito', type: 'date', section: 'titulo', width: 'half', label: l('Trânsito em julgado em', 'Final since'), showIf: isSentenca },
    {
      name: 'tituloFactos',
      type: 'textarea',
      section: 'titulo',
      rows: 3,
      label: l('Factos adicionais (um artigo por linha, opcional)', 'Additional facts (one article per line, optional)'),
      help: l('Ex.: origem da dívida, prestações vencidas, interpelação.', 'E.g. origin of the debt, instalments due, demand.'),
    },
    { name: 'capital', type: 'money', section: 'obrigacao', width: 'half', label: l('Capital em dívida', 'Principal owed'), showIf: (v) => fim(v) === 'pagamento' },
    { name: 'dataVencimento', type: 'date', section: 'obrigacao', width: 'half', label: l('Vencida em', 'Due since'), showIf: (v) => fim(v) === 'pagamento' },
    { name: 'jurosVencidos', type: 'money', section: 'obrigacao', width: 'half', label: l('Juros vencidos (opcional)', 'Interest accrued (optional)'), showIf: (v) => fim(v) === 'pagamento' },
    { name: 'dataCalculoJuros', type: 'date', section: 'obrigacao', width: 'half', label: l('Juros calculados até', 'Interest calculated up to'), showIf: (v) => fim(v) === 'pagamento' && money(v.jurosVencidos) != null },
    {
      name: 'taxaJuros',
      type: 'text',
      section: 'obrigacao',
      width: 'half',
      label: l('Taxa de juros', 'Interest rate'),
      default: 'à taxa legal',
      placeholder: l('Ex.: à taxa legal; à taxa convencionada de dois por cento ao mês', 'E.g. at the legal rate'),
      showIf: (v) => fim(v) === 'pagamento',
    },
    { name: 'outrasQuantias', type: 'money', section: 'obrigacao', width: 'half', label: l('Outras quantias (opcional)', 'Other sums (optional)'), showIf: (v) => fim(v) === 'pagamento' },
    { name: 'outrasDescricao', type: 'text', section: 'obrigacao', label: l('A que respeitam as outras quantias', 'What the other sums are'), placeholder: l('Ex.: despesas de protesto; cláusula penal', 'E.g. protest costs; penalty'), showIf: (v) => fim(v) === 'pagamento' && money(v.outrasQuantias) != null },
    { name: 'coisa', type: 'textarea', section: 'obrigacao', rows: 2, label: l('Coisa a entregar', 'Thing to deliver'), placeholder: l('Ex.: a viatura ligeira marca Toyota, modelo Hilux, matrícula AFG 123 MC', 'E.g. the Toyota Hilux, registration AFG 123 MC'), showIf: (v) => fim(v) === 'entrega' },
    { name: 'facto', type: 'textarea', section: 'obrigacao', rows: 2, label: l('Facto a prestar', 'Act to perform'), placeholder: l('Ex.: concluir a cobertura do armazém sito na Machava, conforme o contrato', 'E.g. finish the roof of the warehouse'), showIf: (v) => fim(v) === 'facto' },
    { name: 'factoPrazo', type: 'text', section: 'obrigacao', width: 'half', label: l('Prazo a fixar para a prestação', 'Time to set for the act'), placeholder: l('Ex.: trinta dias', 'E.g. thirty days'), showIf: (v) => fim(v) === 'facto' },
    {
      name: 'factoAlternativa',
      type: 'select',
      section: 'obrigacao',
      width: 'half',
      label: l('Se o devedor não cumprir', 'If the debtor does not perform'),
      default: 'outrem',
      options: [
        { value: 'outrem', label: l('Prestação por outrem, à custa do executado', 'Performance by another at the debtor’s cost') },
        { value: 'indemnizacao', label: l('Indemnização pelo dano', 'Damages') },
      ],
      showIf: (v) => fim(v) === 'facto',
    },
    {
      name: 'valorCausa',
      type: 'money',
      section: 'obrigacao',
      width: 'half',
      label: l('Valor da execução', 'Value of the enforcement'),
      legal: l('O requerimento declara o valor da causa.', 'The application states the value.'),
      help: l('Na execução para pagamento, se vazio, usa capital + juros + outras quantias.', 'For payment, if empty, principal + interest + other sums is used.'),
    },
    {
      name: 'bensPenhora',
      type: 'textarea',
      section: 'penhora',
      rows: 4,
      label: l('Bens que indica à penhora (um por linha, opcional)', 'Assets to attach (one per line, optional)'),
      placeholder: l('Saldo da conta n.º 0012345678 do Banco X, agência da Baixa\nViatura ligeira, matrícula AFG 123 MC\nRendas do imóvel sito na Rua Y, n.º 10, Maputo', 'Bank account balance\nVehicle\nRents'),
      help: l('Indique bens concretos e identificados. A lei define a ordem e os bens impenhoráveis.', 'Name specific assets. The law sets the order and exempt assets.'),
      showIf: (v) => fim(v) === 'pagamento',
    },
    ...provaFields('prova', { testemunhas: false, docsPlaceholder: 'Original do título executivo\nCertidão de registo comercial' }),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  computed: (v) => ({ valor: valorExecucao(v) }),

  warnings: (v, ctx) => {
    const w: Warning[] = [
      {
        level: 'info',
        field: 'tituloTipo',
        message: l(
          `Toda a execução tem por base um título executivo; junte o original ou certidão (${cite('pcTitulosExecutivos')}). A obrigação deve ser certa, líquida e exigível.`,
          'Every enforcement needs an enforceable title; attach the original or a certified copy. The obligation must be certain, liquid and due.',
        ),
      },
    ];
    if (isSentenca(v)) {
      w.push({ level: 'info', field: 'processoNumero', message: l('A execução de sentença corre por apenso ou nos próprios autos da acção; indique o número do processo e junte certidão com nota de trânsito em julgado, se for o caso.', 'Enforcement of a judgment runs in the same case or as an annex; state the case number.') });
    }
    if (v.tituloTipo === 'particular') {
      w.push({ level: 'warning', field: 'tituloTipo', message: l('O documento particular só é título executivo nos termos da lei (assinatura do devedor e, em regra, reconhecimento notarial). Confirme os requisitos.', 'A private document is only enforceable as the law allows (debtor’s signature, usually notarised). Confirm.') });
    }
    if (ctx.computed.valor == null) w.push({ level: 'error', field: 'valorCausa', message: l('Indique o valor da execução.', 'Enter the value of the enforcement.') });
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.executadoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = fim(v);
    const E = g3(v, 'exequente');
    const X = g3(v, 'executado');
    const oExecutado = `${X.o} ${X.w('Executado', 'Executada')}`;
    const OExecutado = `${X.O} ${X.w('Executado', 'Executada')}`;
    const forma = v.forma === 'sumaria' ? 'SUMÁRIA' : 'ORDINÁRIA';

    const tituloItems: string[] = [];
    if (isSentenca(v)) {
      tituloItems.push(
        `${E.O} Exequente dispõe de título executivo: ${sem(v.tituloDescricao) || '____________________'}${str(v.processoNumero) ? `, proferida no processo n.º ${sem(v.processoNumero)}` : ''}, que condenou ${oExecutado} nos termos que adiante se descrevem.`,
        `A sentença transitou em julgado${v.dataTransito ? ` em ${dateLong(v.dataTransito)}` : ''}.`,
      );
    } else {
      tituloItems.push(`${E.O} Exequente é ${E.w('portador', 'portadora')} do seguinte título executivo: ${sem(v.tituloDescricao) || '____________________'}, que se junta como Documento n.º 1.`);
      tituloItems.push(`Por esse título, ${oExecutado} constituiu-se ou reconheceu-se ${X.w('devedor', 'devedora')} ${E.ao} Exequente da obrigação adiante descrita.`);
    }
    tituloItems.push(...artigos(v.tituloFactos));

    const capital = money(v.capital);
    const juros = money(v.jurosVencidos);
    const outras = money(v.outrasQuantias);
    const taxa = sem(v.taxaJuros) || 'à taxa legal';
    const obrig: string[] = [];
    if (f === 'pagamento') {
      obrig.push(`${OExecutado} deve ${E.ao} Exequente a quantia de ${moneyExt(v.capital)}, a título de capital${v.dataVencimento ? `, vencida em ${dateLong(v.dataVencimento)}` : ''}, que não pagou, apesar de instado para o efeito.`.replace('instado', X.w('instado', 'instada')));
      if (juros != null) obrig.push(`Sobre o capital venceram-se juros de mora, ${taxa}, que até ${dateLong(v.dataCalculoJuros || v.data)} ascendem a ${formatMoney(juros)}.`);
      if (outras != null) obrig.push(`É ainda devida a quantia de ${formatMoney(outras)}${str(v.outrasDescricao) ? `, a título de ${sem(v.outrasDescricao)}` : ''}.`);
      obrig.push('A obrigação é certa, líquida e exigível.');
    } else if (f === 'entrega') {
      obrig.push(`${OExecutado} está ${X.w('obrigado', 'obrigada')} a entregar ${E.ao} Exequente ${sem(v.coisa) || '____________________'}, e não o fez.`, 'A obrigação é certa e exigível.');
    } else {
      obrig.push(`${OExecutado} está ${X.w('obrigado', 'obrigada')} a ${sem(v.facto) || '____________________'}, e não o fez.`, 'A obrigação é certa e exigível, não tendo sido fixado prazo para o seu cumprimento ou estando o mesmo esgotado.');
    }

    const bens = f === 'pagamento' ? splitLines(v.bensPenhora).map((s) => s.replace(/[.;]+$/, '')) : [];
    const sections = [
      { heading: 'I — Do título executivo', items: tituloItems },
      { heading: 'II — Da obrigação exequenda', items: obrig },
    ];

    const totalTxt = capital != null ? formatMoney((capital ?? 0) + (juros ?? 0) + (outras ?? 0)) : formatMoney(null);
    let pedido: string;
    if (f === 'pagamento') {
      pedido = `Nestes termos, requer a V. Ex.ª se digne ordenar a citação ${X.do} ${X.w('Executado', 'Executada')} para, no prazo e sob a cominação legais, pagar ${E.ao} Exequente a quantia de ${totalTxt}, acrescida dos juros de mora vincendos, ${taxa}, até efectivo e integral pagamento, ou nomear bens à penhora, querendo deduzir embargos, seguindo-se os ulteriores termos até final.`;
    } else if (f === 'entrega') {
      pedido = `Nestes termos, requer a V. Ex.ª se digne ordenar a citação ${X.do} ${X.w('Executado', 'Executada')} para, no prazo e sob a cominação legais, fazer a entrega da coisa acima identificada ou, querendo, deduzir embargos, seguindo-se os ulteriores termos até final.`;
    } else {
      pedido = `Nestes termos, requer a V. Ex.ª se digne ordenar a citação ${X.do} ${X.w('Executado', 'Executada')} para, no prazo de ${sem(v.factoPrazo) || '________'}, que se requer seja fixado, prestar o facto acima descrito ou, querendo, deduzir embargos e, não o prestando, ${v.factoAlternativa === 'indemnizacao' ? `ser ${X.w('condenado', 'condenada')} na indemnização do dano sofrido ${E.pelo} Exequente, a liquidar` : 'ser o facto prestado por outrem, à custa do executado, nos termos legais'}, seguindo-se os ulteriores termos até final.`.replace('à custa do executado', `à custa ${X.do} ${X.w('Executado', 'Executada')}`);
    }

    const pv = prova(v);
    const blocks: Block[] = [
      ...petitionHead(v, {
        autor: 'exequente',
        reu: 'executado',
        autorM: 'Exequente',
        autorF: 'Exequente',
        reuM: 'Executado',
        reuF: 'Executada',
        verbo: 'instaurar contra',
        accao: `a presente\n**${FIM_TEXTO[f]}, SOB A FORMA ${forma}**,`,
        accaoEn: 'these enforcement proceedings,',
        processo: isSentenca(v) && str(v.processoNumero) ? `${sem(v.processoNumero)} (por apenso)` : undefined,
      }),
      { type: 'articulado', sections },
      { type: 'paragraph', id: 'pedido', text: pedido, en: 'The creditor asks the court to serve the debtor to pay, deliver or perform, or oppose the enforcement.' },
    ];
    if (bens.length) {
      blocks.push(
        { type: 'paragraph', id: 'bensIntro', text: `Para o caso de o direito de nomeação de bens à penhora se devolver ${E.ao} Exequente, indica desde já à penhora os seguintes bens ${X.do} ${X.w('Executado', 'Executada')}:`, en: 'Should the right to name assets pass to the creditor, it names the following:', keepWithNext: true },
        { type: 'list', style: 'alpha', items: bens.map((b, i) => `${b}${i === bens.length - 1 ? '.' : ';'}`) },
      );
    }
    blocks.push(
      ...closing(ctx, {
        valor: ctx.computed.valor,
        docs: pv.docs,
        procuracao: pv.procuracao,
      }),
    );
    return blocks;
  },
});
