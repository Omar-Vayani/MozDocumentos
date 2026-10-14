import { defineTemplate, type Block, type FieldOption, type Values, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateField, dateLong, l, lawyerFields, localField, money } from './_shared';
import { artigos, courtFields, moneyExt, partyDesc, partyFields } from './_advocacia';
import { closing, g3, lawyerWarnings, petitionHead, prova, provaFields, sem, str } from './_processo-civil';

const RELACAO_OPTIONS: FieldOption[] = [
  { value: 'filhoMenor', label: l('Filho menor do réu', 'Minor child of the defendant') },
  { value: 'filhoMaior', label: l('Filho maior em formação', 'Adult child still studying') },
  { value: 'conjuge', label: l('Cônjuge (casados)', 'Spouse') },
  { value: 'exConjuge', label: l('Ex-cônjuge', 'Former spouse') },
  { value: 'ascendente', label: l('Pai ou mãe do réu', 'Parent of the defendant') },
  { value: 'outro', label: l('Outro familiar', 'Other relative') },
];

const menor = (v: Values) => v.relacao === 'filhoMenor';

export default defineTemplate({
  id: 'accao-de-alimentos',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal', 'Court') },
    { id: 'autor', title: l('Quem pede alimentos', 'Person claiming maintenance'), personRole: 'cliente' },
    { id: 'reu', title: l('Quem deve pagar', 'Person liable'), personRole: 'outro' },
    { id: 'factos', title: l('Necessidades e possibilidades', 'Needs and means') },
    { id: 'pedido', title: l('Pedido', 'Claim') },
    { id: 'prova', title: l('Documentos e testemunhas', 'Documents and witnesses') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...courtFields('tribunal').map((f) =>
      f.name === 'tribunal'
        ? { ...f, help: l('Alimentos a menores: Tribunal de Menores ou secção de menores do tribunal judicial da área de residência do menor.', 'Child maintenance: the minors’ court of the child’s residence.') }
        : f,
    ),
    { name: 'relacao', type: 'select', section: 'autor', required: true, label: l('Quem pede é', 'The claimant is'), options: RELACAO_OPTIONS, default: 'filhoMenor' },
    ...partyFields('autor', 'autor', { defaultTipo: 'pessoa' }).filter((f) => !/(Tipo|Nuel|Representante)$/.test(f.name)),
    { name: 'dataNascimento', type: 'date', section: 'autor', width: 'half', label: l('Data de nascimento do menor', 'Child’s date of birth'), showIf: menor },
    { name: 'representanteNome', type: 'text', section: 'autor', label: l('Representado por (mãe, pai ou tutor)', 'Represented by (mother, father or guardian)'), showIf: menor },
    { name: 'representanteGenero', type: 'radio', section: 'autor', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'F', showIf: menor },
    { name: 'representanteQualidade', type: 'text', section: 'autor', width: 'half', label: l('Qualidade', 'Capacity'), default: 'mãe', showIf: menor },
    ...partyFields('reu', 'reu', { defaultTipo: 'pessoa', light: true }).filter((f) => !/(Tipo|Nuel|Representante)$/.test(f.name)),
    {
      name: 'necessidades',
      type: 'textarea',
      section: 'factos',
      rows: 5,
      required: true,
      label: l('Necessidades de quem pede (um artigo por linha)', 'Needs of the claimant (one article per line)'),
      help: l('Despesas mensais com alimentação, renda, escola, saúde, transporte, vestuário, com valores.', 'Monthly costs: food, rent, school, health, transport, clothing, with amounts.'),
    },
    {
      name: 'possibilidades',
      type: 'textarea',
      section: 'factos',
      rows: 4,
      required: true,
      label: l('Possibilidades de quem deve pagar (um artigo por linha)', 'Means of the person liable (one article per line)'),
      help: l('Emprego, salário, negócios, bens, nível de vida.', 'Job, salary, business, assets, lifestyle.'),
    },
    { name: 'incumprimento', type: 'textarea', section: 'factos', rows: 3, label: l('O que o réu tem pago (um artigo por linha, opcional)', 'What the defendant has paid (optional)'), placeholder: l('Ex.: Desde Março de 2026 o Réu deixou de contribuir para o sustento do menor.', 'E.g. since March 2026 he stopped contributing') },
    { name: 'mensal', type: 'money', section: 'pedido', width: 'half', required: true, label: l('Alimentos por mês', 'Maintenance per month') },
    { name: 'dia', type: 'number', section: 'pedido', width: 'half', min: 1, max: 31, label: l('Pagar até ao dia', 'Pay by day'), default: 10 },
    { name: 'formaPagamento', type: 'text', section: 'pedido', label: l('Forma de pagamento', 'Payment method'), placeholder: l('Ex.: por depósito na conta n.º 1234567 do BCI, titulada pela mãe do menor', 'E.g. deposit into account no. …') },
    { name: 'actualizacao', type: 'toggle', section: 'pedido', default: true, label: l('Actualização anual', 'Annual update'), help: l('Pede a actualização anual do valor, de acordo com a inflação ou o salário mínimo.', 'Asks for an annual update.') },
    { name: 'extraordinarias', type: 'toggle', section: 'pedido', default: true, label: l('Metade das despesas extraordinárias (saúde e educação)', 'Half of extraordinary costs (health, education)'), showIf: (v) => menor(v) || v.relacao === 'filhoMaior' },
    { name: 'provisorios', type: 'money', section: 'pedido', width: 'half', label: l('Alimentos provisórios por mês (opcional)', 'Interim maintenance per month (optional)'), help: l('Valor a pagar já, enquanto a acção decorre.', 'Amount payable while the case runs.') },
    { name: 'valorCausa', type: 'money', section: 'pedido', width: 'half', label: l('Valor da causa', 'Value of the case'), legal: l('A petição declara o valor da causa.', 'The claim states the value.') },
    ...provaFields('prova', { docsPlaceholder: 'Certidão de nascimento do menor\nRecibos de propinas e despesas de saúde\nDeclaração de rendimentos do Réu' }),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      { level: 'info', field: 'mensal', message: l(`Os alimentos são fixados segundo as necessidades de quem os pede e as possibilidades de quem os presta, e são devidos desde a propositura da acção (${cite('pcAlimentos')}).`, 'Maintenance depends on the claimant’s needs and the payer’s means, and is owed from filing.') },
    ];
    if (menor(v)) w.push({ level: 'info', field: 'tribunal', message: l(`Alimentos a menores seguem o processo da ${cite('pcPoderParental')}; se os pais não vivem juntos, considere pedir também a regulação do exercício do poder parental.`, 'Child maintenance follows the minors’ court procedure; consider a parental responsibility order.') });
    if (money(v.valorCausa) == null) w.push({ level: 'warning', field: 'valorCausa', message: l('Indique o valor da causa.', 'Enter the value of the case.') });
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.reuNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const A = g3(v, 'autor');
    const R = g3(v, 'reu');
    const m = menor(v);
    const OAutor = `${A.O} ${A.w('Autor', 'Autora')}`;
    const oReu = `${R.o} ${R.w('Réu', 'Ré')}`;
    const OReu = `${R.O} ${R.w('Réu', 'Ré')}`;
    const pai = R.w('pai', 'mãe');
    const relacaoTxt: Record<string, string> = {
      filhoMenor: `${OAutor} é ${A.w('filho', 'filha')} ${R.do} ${R.w('Réu', 'Ré')}, como consta da certidão de nascimento junta (Documento n.º 1), e é menor${v.dataNascimento ? `, tendo nascido em ${dateLong(v.dataNascimento)}` : ''}.`,
      filhoMaior: `${OAutor} é ${A.w('filho', 'filha')} ${R.do} ${R.w('Réu', 'Ré')} e, embora maior, não completou a sua formação profissional, que frequenta com aproveitamento.`,
      conjuge: `${OAutor} e ${oReu} são casados entre si (Documento n.º 1).`,
      exConjuge: `${OAutor} e ${oReu} foram casados entre si, estando o casamento dissolvido por divórcio (Documento n.º 1).`,
      ascendente: `${OAutor} é ${A.w('pai', 'mãe')} ${R.do} ${R.w('Réu', 'Ré')} (Documento n.º 1).`,
      outro: `${OAutor} e ${oReu} são familiares, nos termos que constam dos documentos juntos.`,
    };
    const relacao = relacaoTxt[v.relacao as string] ?? relacaoTxt.outro;
    const repNome = `**${(str(v.representanteNome) || '____________').toLocaleUpperCase('pt')}**`;

    const factos = [relacao, ...artigos(v.necessidades), ...artigos(v.possibilidades), ...artigos(v.incumprimento)];
    const direito = [
      `${m ? `Os pais estão obrigados a prover ao sustento dos filhos menores, e ${oReu}, como ${pai}, deve contribuir na medida dos seus meios.` : `${OReu} está legalmente ${R.w('obrigado', 'obrigada')} a prestar alimentos ${A.ao} ${A.w('Autor', 'Autora')}.`}`,
      'Os alimentos devem ser proporcionados aos meios daquele que houver de prestá-los e à necessidade daquele que houver de recebê-los, e são devidos desde a propositura da acção.',
    ];
    const pedidos = [
      `Ser ${oReu} ${R.w('condenado', 'condenada')} a prestar ${A.ao} ${A.w('Autor', 'Autora')} alimentos no montante mensal de ${moneyExt(v.mensal)}, a pagar até ao dia ${v.dia || '____'} de cada mês${str(v.formaPagamento) ? `, ${sem(v.formaPagamento)}` : ''}, desde a data da propositura da acção`,
      ...(v.actualizacao ? ['Ser o montante dos alimentos actualizado anualmente, de acordo com a taxa de inflação publicada ou com a variação do salário mínimo'] : []),
      ...(v.extraordinarias && (m || v.relacao === 'filhoMaior') ? [`Ser ${oReu} ${R.w('condenado', 'condenada')} a pagar metade das despesas extraordinárias de saúde e de educação ${A.do} ${A.w('Autor', 'Autora')}, mediante apresentação dos respectivos comprovativos`] : []),
      `Ser ${oReu} ${R.w('condenado', 'condenada')} nas custas e procuradoria condigna`,
    ];
    const depois = [
      ...(money(v.provisorios) != null
        ? [{ id: 'provisorios', text: `Mais requer que, enquanto não houver pagamento da primeira prestação definitiva, sejam fixados alimentos provisórios no montante mensal de ${moneyExt(v.provisorios)}.`, en: 'The claimant also asks for interim maintenance.' }]
        : []),
      { id: 'citacao', text: `Requer a citação ${R.do} ${R.w('Réu', 'Ré')} para, querendo, contestar no prazo e sob a cominação legais, seguindo-se os ulteriores termos até final.`, en: 'The claimant asks for service on the defendant.' },
    ];
    const pv = prova(v);
    const head = petitionHead(v, {
      accao: m ? 'a presente\n**ACÇÃO DE ALIMENTOS DEVIDOS A MENOR**,' : 'a presente\n**ACÇÃO DE ALIMENTOS**,',
      accaoEn: 'this maintenance action,',
    });
    if (m) {
      head[1] = {
        type: 'paragraph',
        id: 'autor',
        text: `${partyDesc(v, 'autor')}, menor, neste acto ${A.w('representado', 'representada')} por sua ${sem(v.representanteQualidade) || 'mãe'}, ${repNome}, adiante ${A.w('designado', 'designada')} por **${A.w('Autor', 'Autora')}**,`,
        en: 'Identification of the minor claimant and the representative.',
      };
    }
    const blocks: Block[] = [
      ...head,
      { type: 'articulado', sections: [{ heading: 'I — Dos factos', items: factos }, { heading: 'II — Do direito', items: direito }] },
      ...closing(ctx, {
        intro: 'Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, deve a presente acção ser julgada procedente, por provada, e, em consequência:',
        introEn: 'On these grounds, the action should be upheld and:',
        pedidos,
        depois,
        valor: money(v.valorCausa),
        docs: pv.docs,
        procuracao: pv.procuracao,
        testemunhas: pv.testemunhas,
      }),
    ];
    return blocks;
  },
});
