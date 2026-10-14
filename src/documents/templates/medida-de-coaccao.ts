// Requerimento de revogação ou substituição de medida de coacção, incluindo a
// liberdade provisória mediante caução: the accused asks the judge to revoke
// pre-trial detention or another coercive measure, or to replace it with a
// lighter one (bail, periodic reporting), because the reasons for it ceased or
// diminished.

import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateField, dateLong, l, lawyerFields, lawyerSignature, localField, placeDate } from './_shared';
import { FECHO_OPTIONS, artigos, documentosList, juntaText, linePara, moneyExt, papel } from './_advocacia';
import { faseValue, nosAutos, penalAddressee, penalCaseFields, str, keepTail } from './_processo-penal';

const PEDIDO_OPTIONS = [
  { value: 'caucao', label: l('Liberdade provisória mediante caução', 'Release on bail') },
  { value: 'substituicao', label: l('Substituir por medida menos grave', 'Replace with a lighter measure') },
  { value: 'revogacao', label: l('Revogar a medida (sem outra)', 'Revoke the measure') },
  { value: 'reducao', label: l('Reduzir o valor da caução', 'Reduce the bail amount') },
];

const TITULO: Record<string, string> = {
  caucao: 'LIBERDADE PROVISÓRIA MEDIANTE CAUÇÃO',
  substituicao: 'SUBSTITUIÇÃO DA MEDIDA DE COACÇÃO',
  revogacao: 'REVOGAÇÃO DA MEDIDA DE COACÇÃO',
  reducao: 'REDUÇÃO DO VALOR DA CAUÇÃO',
};

const MEDIDA_OPTIONS = [
  { value: 'prisao preventiva', label: l('Prisão preventiva', 'Pre-trial detention') },
  { value: 'caução', label: l('Caução', 'Bail') },
  { value: 'obrigação de apresentação periódica', label: l('Apresentação periódica', 'Periodic reporting') },
  { value: 'proibição de ausência e de contactos', label: l('Proibição de ausência e de contactos', 'Ban on leaving / contacts') },
  { value: 'suspensão do exercício de funções', label: l('Suspensão de funções', 'Suspension from duties') },
];

const CIRCUNSTANCIAS: { name: string; label: ReturnType<typeof l>; text: (v: Values) => string }[] = [
  { name: 'cResidencia', label: l('Tem residência fixa e conhecida', 'Has a fixed, known residence'), text: (v) => `${A(v)} tem residência fixa e conhecida${str(v.arguidoMorada) ? `, em ${str(v.arguidoMorada).replace(/[.;]$/, '')}` : ''}, onde sempre foi encontrad${o(v)} pelas autoridades.` },
  { name: 'cEmprego', label: l('Tem emprego ou actividade', 'Has a job or occupation'), text: (v) => `${A(v)} exerce actividade profissional regular${str(v.emprego) ? ` como ${str(v.emprego).replace(/[.;]$/, '')}` : ''}, da qual depende o sustento da família.` },
  { name: 'cFamilia', label: l('Tem família a seu cargo', 'Has dependants'), text: (v) => `${A(v)} tem família constituída e pessoas a seu cargo${str(v.familia) ? `: ${str(v.familia).replace(/[.;]$/, '')}` : ''}.` },
  { name: 'cPrimario', label: l('Não tem antecedentes criminais', 'No criminal record'), text: (v) => `${A(v)} é primári${o(v)}, não tendo antecedentes criminais.` },
  { name: 'cProva', label: l('A prova já foi recolhida', 'Evidence already gathered'), text: () => 'As diligências de prova essenciais encontram-se realizadas, pelo que deixou de existir perigo de perturbação do inquérito ou da instrução.' },
  { name: 'cColabora', label: l('Tem colaborado com a justiça', 'Has cooperated'), text: (v) => `${A(v)} tem colaborado com a justiça, comparecendo sempre que ${o(v) === 'a' ? 'convocada' : 'convocado'}.` },
  { name: 'cSaude', label: l('Problemas de saúde', 'Health problems'), text: (v) => `${A(v)} sofre de problemas de saúde que exigem acompanhamento médico regular, incompatível com a reclusão${str(v.saude) ? ` (${str(v.saude).replace(/[.;]$/, '')})` : ''}.` },
];

const A = (v: Values) => papel(v, 'arguido', 'O arguido', 'A arguida');
const o = (v: Values) => (v.arguidoGenero === 'F' ? 'a' : 'o');

export default defineTemplate({
  id: 'medida-de-coaccao',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'processo', title: l('Tribunal e processo', 'Court and case') },
    { id: 'arguido', title: l('Arguido', 'Accused'), personRole: 'cliente' },
    { id: 'pedido', title: l('O que se pede', 'Request') },
    { id: 'fundamentos', title: l('Fundamentos', 'Grounds') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...penalCaseFields('processo', { fases: ['instrucao', 'julgamento'] }),
    { name: 'arguidoNome', type: 'text', section: 'arguido', required: true, label: l('Nome do arguido', 'Name of the accused'), personKey: 'nome' },
    { name: 'arguidoGenero', type: 'radio', section: 'arguido', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'arguidoMorada', type: 'text', section: 'arguido', label: l('Residência', 'Residence'), personKey: 'morada' },
    { name: 'crimeNome', type: 'text', section: 'arguido', width: 'half', label: l('Crime imputado', 'Offence'), placeholder: l('Ex.: furto qualificado', 'E.g. aggravated theft') },
    { name: 'medidaActual', type: 'select', section: 'pedido', width: 'half', label: l('Medida actual', 'Current measure'), options: MEDIDA_OPTIONS, default: 'prisao preventiva' },
    { name: 'dataMedida', type: 'date', section: 'pedido', width: 'half', label: l('Aplicada em', 'Applied on') },
    { name: 'tipoPedido', type: 'select', section: 'pedido', label: l('Pedido', 'Request'), options: PEDIDO_OPTIONS, default: 'caucao' },
    { name: 'medidaProposta', type: 'text', section: 'pedido', label: l('Medida proposta em substituição', 'Proposed replacement measure'), default: 'obrigação de apresentação periódica às autoridades e proibição de se ausentar da área de residência sem autorização', showIf: (v) => v.tipoPedido === 'substituicao' },
    { name: 'caucaoValor', type: 'money', section: 'pedido', width: 'half', label: l('Caução que pode prestar', 'Bail the accused can pay'), showIf: (v) => v.tipoPedido === 'caucao' || v.tipoPedido === 'reducao' },
    {
      name: 'caucaoForma',
      type: 'select',
      section: 'pedido',
      width: 'half',
      label: l('Forma da caução', 'Form of bail'),
      default: 'depósito',
      options: [
        { value: 'depósito', label: l('Depósito em dinheiro', 'Cash deposit') },
        { value: 'garantia bancária', label: l('Garantia bancária', 'Bank guarantee') },
        { value: 'fiança', label: l('Fiança', 'Surety') },
        { value: 'hipoteca ou penhor', label: l('Hipoteca ou penhor', 'Mortgage or pledge') },
      ],
      showIf: (v) => v.tipoPedido === 'caucao' || v.tipoPedido === 'reducao',
    },
    { name: 'caucaoActual', type: 'money', section: 'pedido', width: 'half', label: l('Caução fixada', 'Bail set'), showIf: (v) => v.tipoPedido === 'reducao' },
    ...CIRCUNSTANCIAS.map((c) => ({ name: c.name, type: 'toggle' as const, section: 'fundamentos', label: c.label, default: c.name !== 'cSaude' && c.name !== 'cProva' })),
    { name: 'emprego', type: 'text', section: 'fundamentos', width: 'half', label: l('Profissão / emprego', 'Occupation'), showIf: (v) => Boolean(v.cEmprego) },
    { name: 'familia', type: 'text', section: 'fundamentos', width: 'half', label: l('Família a cargo', 'Dependants'), placeholder: l('Ex.: a esposa e três filhos menores', 'E.g. wife and three children'), showIf: (v) => Boolean(v.cFamilia) },
    { name: 'saude', type: 'text', section: 'fundamentos', label: l('Problema de saúde', 'Health problem'), showIf: (v) => Boolean(v.cSaude) },
    { name: 'outrosFundamentos', type: 'textarea', section: 'fundamentos', rows: 4, label: l('Outros fundamentos (um artigo por linha)', 'Other grounds (one article per line)') },
    { name: 'documentos', type: 'textarea', section: 'fundamentos', rows: 3, label: l('Documentos juntos (um por linha)', 'Documents attached (one per line)'), placeholder: l('Declaração de residência do bairro\nDeclaração da entidade empregadora\nCertificado de registo criminal', 'Residence declaration\nEmployer’s letter\nCriminal record certificate') },
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
    { name: 'fecho', type: 'select', section: 'documento', width: 'half', label: l('Fecho', 'Closing formula'), options: FECHO_OPTIONS, default: 'Pede deferimento.' },
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `As medidas de coacção são revogadas quando deixam de existir as circunstâncias que as justificaram e substituídas por outras menos graves quando as exigências cautelares se atenuam; a prisão preventiva só se aplica quando as outras medidas forem insuficientes (${cite('ppMedidasCoaccao')}). Junte prova das circunstâncias alegadas (residência, emprego, família).`,
          'Measures are revoked when the reasons cease and replaced when risks diminish; detention only when other measures are insufficient. Attach proof of residence, work and family.',
        ),
      },
    ];
    if ((v.tipoPedido === 'caucao' || v.tipoPedido === 'reducao') && !str(v.caucaoValor)) {
      w.push({ level: 'info', field: 'caucaoValor', message: l('Indique o valor que o arguido consegue prestar: a caução atende à sua situação económica.', 'State the amount the accused can pay: bail takes means into account.') });
    }
    if (v.medidaActual === 'prisao preventiva') {
      w.push({ level: 'info', message: l('Se a prisão excedeu os prazos legais, considere também a providência de habeas corpus.', 'If detention exceeded the legal time limits, also consider habeas corpus.') });
    }
    return w;
  },

  personName: (v) => v.arguidoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fase = faseValue(v, ['instrucao', 'julgamento']);
    const tipo = TITULO[v.tipoPedido] ? v.tipoPedido : 'caucao';
    const medida = String(v.medidaActual || 'prisão preventiva').replace('prisao', 'prisão');
    const crime = str(v.crimeNome);
    const circ = CIRCUNSTANCIAS.filter((c) => v[c.name]).map((c) => c.text(v));
    const outros = artigos(v.outrosFundamentos);
    const enquadramento = [
      `${A(v)} encontra-se ${o(v) === 'a' ? 'sujeita' : 'sujeito'} à medida de coacção de ${medida}${v.dataMedida ? ` desde ${dateLong(v.dataMedida)}` : ''}${crime ? `, por indícios da prática de crime de ${crime}` : ''}.`,
      'As medidas de coacção devem ser necessárias, adequadas e proporcionais à gravidade do crime e às exigências cautelares do caso, sendo revogadas quando deixem de subsistir as circunstâncias que as justificaram e substituídas por outras menos graves quando aquelas exigências se atenuem.',
    ];
    const caucao = moneyExt(v.caucaoValor);
    const pedidoTxt: Record<string, string> = {
      caucao: `seja revogada a ${medida} e concedida ${papel(v, 'arguido', 'ao arguido', 'à arguida')} a liberdade provisória mediante caução, que se propõe no valor de ${caucao}, a prestar por ${v.caucaoForma || 'depósito'}, cumulada com as obrigações que V. Ex.ª entenda adequadas`,
      substituicao: `seja a medida de ${medida} substituída por ${str(v.medidaProposta) || 'medida de coacção menos gravosa'}`,
      revogacao: `seja revogada a medida de coacção de ${medida}, ficando ${papel(v, 'arguido', 'o arguido', 'a arguida')} ${o(v) === 'a' ? 'sujeita' : 'sujeito'} apenas a termo de identidade e residência`,
      reducao: `seja reduzido o valor da caução fixada${str(v.caucaoActual) ? `, de ${moneyExt(v.caucaoActual)}` : ''}, para ${caucao}, montante compatível com a situação económica ${papel(v, 'arguido', 'do arguido', 'da arguida')}`,
    };
    const docs = documentosList(v.documentos);
    const blocks: Block[] = [
      { type: 'courtHeader', processo: str(v.processoNumero) || '________/______', extra: str(v.seccao) || undefined, addressee: penalAddressee(v, fase) },
      {
        type: 'paragraph',
        id: 'arguido',
        text: `**${(str(v.arguidoNome) || '____________________').toLocaleUpperCase('pt')}**, ${papel(v, 'arguido', 'arguido', 'arguida')} ${nosAutos(v)}, neles melhor ${o(v) === 'a' ? 'identificada' : 'identificado'}, vem, por intermédio do seu mandatário, requerer a`,
        en: 'The accused, through counsel, requests',
      },
      { type: 'paragraph', id: 'titulo', align: 'center', text: `**${TITULO[tipo]}**,`, en: 'Request concerning a coercive measure,' },
      { type: 'paragraph', id: 'fundamentos', text: 'o que faz nos termos e com os fundamentos seguintes:', en: 'on the following grounds:' },
      {
        type: 'articulado',
        sections: [
          { heading: 'I — Da medida aplicada', items: enquadramento },
          { heading: 'II — Da alteração das circunstâncias', items: [...circ, ...outros].length ? [...circ, ...outros] : ['____________________'] },
          {
            heading: 'III — Do direito',
            items: [
              `Perante estas circunstâncias, as exigências cautelares que justificaram a medida aplicada atenuaram-se ou deixaram de existir, mostrando-se suficiente medida menos gravosa (${cite('ppMedidasCoaccao')}).`,
            ],
          },
        ],
      },
      { type: 'paragraph', id: 'pedido', text: `Nestes termos, requer a V. Ex.ª que ${pedidoTxt[tipo]}.`, en: 'The accused asks the judge to grant the request.' },
      ...(docs.length ? [linePara('junta', 'Junta', `${juntaText({ procuracao: false, documentos: docs.length, duplicados: false })}.`, 'Attached documents.', true)] : []),
      { type: 'paragraph', id: 'fecho', text: String(v.fecho || 'Pede deferimento.'), en: 'Closing formula.', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [lawyerSignature(v)] },
    ];
    if (docs.length) blocks.push({ type: 'annexList', title: 'Documentos juntos', items: docs });
    return keepTail(blocks, 'pedido');
  },
});
