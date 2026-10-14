import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { cite, dateField, dateLong, formatMoney, l, lawyerFields, localField, money } from './_shared';
import { artigos, moneyExt } from './_advocacia';
import { closing, g3, lawyerWarnings, parteNome, pendingHead, processoFields, prova, provaFields, seccoes, str } from './_processo-civil';

const FUNDAMENTOS: { value: string; label: string; en: string; texto: string }[] = [
  { value: 'titulo', label: 'Inexistência ou inexequibilidade do título', en: 'No enforceable title', texto: 'O documento dado à execução não constitui título executivo, por não reunir os requisitos legais, pelo que a execução carece de base.' },
  { value: 'obrigacao', label: 'Incerteza, iliquidez ou inexigibilidade da obrigação', en: 'Obligation not certain, liquid or due', texto: 'A obrigação exequenda não é certa, líquida e exigível, como a lei impõe para que possa ser executada.' },
  { value: 'ilegitimidade', label: 'Ilegitimidade das partes', en: 'Lack of standing', texto: 'O Embargante não figura no título como devedor nem é sucessor de quem nele figura, sendo parte ilegítima na execução.' },
  { value: 'pagamento', label: 'Pagamento ou outra causa de extinção da dívida', en: 'Payment or other extinction', texto: 'A dívida exequenda encontra-se extinta, no todo ou em parte, por pagamento ou outra causa, como se demonstra e prova pelos documentos juntos.' },
  { value: 'prescricao', label: 'Prescrição', en: 'Limitation', texto: 'O direito de crédito invocado encontra-se prescrito, o que expressamente se invoca para todos os efeitos legais.' },
  { value: 'excesso', label: 'Excesso de execução', en: 'Excess enforcement', texto: 'A quantia exequenda excede o que é efectivamente devido, como adiante se demonstra.' },
];

const FUND_OPTIONS: FieldOption[] = FUNDAMENTOS.map((f) => ({ value: f.value, label: l(f.label, f.en) }));

export default defineTemplate({
  id: 'embargos-de-executado',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e execução', 'Court and enforcement case') },
    { id: 'partes', title: l('Partes', 'Parties') },
    { id: 'fundamentos', title: l('Fundamentos', 'Grounds') },
    { id: 'pedido', title: l('Pedido e valor', 'Claim and value') },
    { id: 'prova', title: l('Documentos e testemunhas', 'Documents and witnesses') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...processoFields('tribunal', 'execução para pagamento de quantia certa, com processo ordinário'),
    { name: 'dataCitacao', type: 'date', section: 'tribunal', width: 'half', required: true, label: l('Data da citação', 'Date of service') },
    {
      name: 'tituloBase',
      type: 'radio',
      section: 'tribunal',
      width: 'half',
      label: l('A execução baseia-se em', 'The enforcement is based on'),
      default: 'outro',
      options: [
        { value: 'sentenca', label: l('Sentença', 'A judgment') },
        { value: 'outro', label: l('Outro título', 'Another title') },
      ],
    },
    ...parteNome('executado', 'partes', 'Executado (o seu cliente)', 'Debtor (your client)', 'pessoa'),
    ...parteNome('exequente', 'partes', 'Exequente', 'Creditor', 'empresa'),
    { name: 'fundamento1', type: 'select', section: 'fundamentos', label: l('Fundamento principal', 'Main ground'), options: FUND_OPTIONS, default: 'pagamento' },
    { name: 'fundamento2', type: 'select', section: 'fundamentos', label: l('Outro fundamento (opcional)', 'Other ground (optional)'), options: [{ value: '', label: l('— nenhum —', '— none —') }, ...FUND_OPTIONS], default: '' },
    {
      name: 'factos',
      type: 'textarea',
      section: 'fundamentos',
      rows: 7,
      required: true,
      label: l('Factos (um artigo por linha)', 'Facts (one article per line)'),
      help: l('Descreva os factos que provam cada fundamento. Refira os documentos como «Documento n.º 1».', 'Describe the facts proving each ground; refer to “Documento n.º 1”.'),
    },
    { name: 'direito', type: 'textarea', section: 'fundamentos', rows: 3, label: l('Fundamentos de direito (opcional)', 'Legal grounds (optional)') },
    { name: 'valorExecucao', type: 'money', section: 'pedido', width: 'half', label: l('Quantia exequenda', 'Amount enforced') },
    { name: 'valorDevido', type: 'money', section: 'pedido', width: 'half', label: l('Quantia que reconhece dever (excesso)', 'Amount admitted (excess)'), showIf: (v) => v.fundamento1 === 'excesso' || v.fundamento2 === 'excesso' },
    {
      name: 'suspensao',
      type: 'toggle',
      section: 'pedido',
      label: l('Pedir a suspensão da execução (mediante caução)', 'Ask to stay the enforcement (with security)'),
      help: l('O recebimento dos embargos só suspende a execução nos casos previstos na lei, em regra mediante caução.', 'Receiving the opposition only stays enforcement in the cases set by law, usually with security.'),
    },
    { name: 'caucao', type: 'text', section: 'pedido', label: l('Caução oferecida', 'Security offered'), placeholder: l('Ex.: garantia bancária no valor da quantia exequenda', 'E.g. a bank guarantee'), showIf: (v) => Boolean(v.suspensao) },
    ...provaFields('prova'),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: 'info',
        field: 'dataCitacao',
        message: l(
          `Os embargos são deduzidos no prazo legal a contar da citação${v.dataCitacao ? ` (${dateLong(v.dataCitacao)})` : ''} e autuados por apenso (${cite('pcEmbargosExecutado')}). Confirme o prazo e a dilação.`,
          'The opposition is filed within the legal period from service and joined to the enforcement case. Confirm the period.',
        ),
      },
    ];
    if (v.tituloBase === 'sentenca') {
      w.push({ level: 'warning', field: 'fundamento1', message: l('Contra execução de sentença só são admitidos os fundamentos taxativos da lei (por exemplo, facto extintivo posterior ao encerramento da discussão, provado por documento). A prescrição e o pagamento anteriores à sentença não podem ser invocados.', 'Against a judgment only the grounds listed by law are allowed.') });
    }
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.exequenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const X = g3(v, 'executado');
    const Q = g3(v, 'exequente');
    const escolhidos = [v.fundamento1, v.fundamento2].filter((x, i, a) => x && a.indexOf(x) === i);
    const base = FUNDAMENTOS.filter((f) => escolhidos.includes(f.value)).map((f) => f.texto.replace(/O Embargante/g, `${X.O} Embargante`));
    const excesso = escolhidos.includes('excesso');
    const devido = money(v.valorDevido);
    const factos = artigos(v.factos);
    const exc: string[] = [];
    if (excesso && devido != null) exc.push(`${X.O} ${X.w('Executado', 'Executada')} apenas deve a quantia de ${moneyExt(v.valorDevido)}, sendo a execução excessiva na parte restante${money(v.valorExecucao) != null ? `, no montante de ${formatMoney((money(v.valorExecucao) ?? 0) - devido)}` : ''}.`);

    const sections = seccoes([
      ['Dos fundamentos', [...base, ...factos]],
      ['Do excesso de execução', exc],
      ['Do direito', artigos(v.direito)],
    ], ['Dos fundamentos']);

    const pedidos = [
      excesso && devido != null
        ? `Serem os presentes embargos julgados procedentes, por provados, reduzindo-se a execução à quantia de ${formatMoney(devido)}`
        : 'Serem os presentes embargos julgados procedentes, por provados, e, em consequência, julgada extinta a execução',
      ...(v.suspensao ? [`Ser suspensa a execução, mediante a prestação de caução${str(v.caucao) ? ` por ${str(v.caucao).replace(/[.;]$/, '')}` : ''}`] : []),
      `Ser ${Q.o} Exequente ${Q.w('condenado', 'condenada')} nas custas e procuradoria condigna`,
    ];
    const pv = prova(v);
    const blocks: Block[] = [
      ...pendingHead(v, {
        p: 'executado',
        papel: X.w('Executado', 'Executada'),
        contra: 'exequente',
        contraPapel: 'Exequente',
        verbo: `tendo sido ${X.w('citado', 'citada')}${v.dataCitacao ? ` em ${dateLong(v.dataCitacao)}` : ''}, deduzir, por apenso, os presentes`,
        titulo: '**EMBARGOS DE EXECUTADO**,',
        tituloEn: 'OPPOSITION TO ENFORCEMENT',
      }),
      { type: 'articulado', sections },
      ...closing(ctx, {
        intro: `Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, devem os presentes embargos ser recebidos, notificando-se ${Q.o} Exequente para, querendo, os contestar, e, a final:`,
        introEn: 'On these grounds, the opposition should be received, the creditor notified to answer, and finally:',
        pedidos,
        valor: excesso && devido != null && money(v.valorExecucao) != null ? (money(v.valorExecucao) ?? 0) - devido : money(v.valorExecucao),
        docs: pv.docs,
        procuracao: pv.procuracao,
        testemunhas: pv.testemunhas,
      }),
    ];
    return blocks;
  },
});
