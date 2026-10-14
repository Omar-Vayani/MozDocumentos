import { defineTemplate, type Block, type FieldOption, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, l, lawyerFields, localField, lineItems, money } from './_shared';
import { artigos, courtFields, moneyExt, partyFields } from './_advocacia';
import { closing, g3, lawyerWarnings, petitionHead, prova, provaFields, sem, str } from './_processo-civil';

const FUND_OPTIONS: FieldOption[] = [
  { value: 'deveres', label: l('Violação culposa dos deveres conjugais', 'Culpable breach of marital duties') },
  { value: 'violencia', label: l('Violência doméstica', 'Domestic violence') },
  { value: 'separacao', label: l('Separação de facto', 'De facto separation') },
  { value: 'abandono', label: l('Abandono do lar / ausência sem notícias', 'Desertion / absence without news') },
  { value: 'outro', label: l('Outro fundamento legal', 'Other legal ground') },
];

const FUND_TEXTO: Record<string, string> = {
  deveres: 'violação culposa, pelo cônjuge réu, dos deveres conjugais, que pela sua gravidade e reiteração compromete a possibilidade da vida em comum',
  violencia: 'prática de actos de violência doméstica contra o cônjuge autor, que tornam insuportável a vida em comum',
  separacao: 'separação de facto dos cônjuges, sem comunhão de vida e sem propósito de a restabelecer, pelo período exigido pela lei',
  abandono: 'abandono do lar conjugal pelo cônjuge réu, sem notícias, pelo período exigido pela lei',
  outro: 'fundamento previsto na lei, adiante exposto',
};

const REGIME_OPTIONS: FieldOption[] = [
  { value: 'comunhão de adquiridos', label: l('Comunhão de adquiridos', 'Community of acquired property') },
  { value: 'comunhão geral de bens', label: l('Comunhão geral', 'Full community') },
  { value: 'separação de bens', label: l('Separação de bens', 'Separation of property') },
];

const isSep = (v: Values) => v.modalidade === 'separacao';

export default defineTemplate({
  id: 'divorcio-litigioso',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e modalidade', 'Court and type') },
    { id: 'autor', title: l('Cônjuge autor', 'Petitioning spouse'), personRole: 'cliente' },
    { id: 'reu', title: l('Cônjuge réu', 'Respondent spouse'), personRole: 'outro' },
    { id: 'casamento', title: l('Casamento e filhos', 'Marriage and children') },
    { id: 'fundamentos', title: l('Fundamentos', 'Grounds') },
    { id: 'pedido', title: l('Pedidos', 'Claims') },
    { id: 'prova', title: l('Documentos e testemunhas', 'Documents and witnesses') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...courtFields('tribunal'),
    {
      name: 'modalidade',
      type: 'radio',
      section: 'tribunal',
      label: l('Pede', 'Asks for'),
      default: 'divorcio',
      options: [
        { value: 'divorcio', label: l('Divórcio litigioso', 'Contested divorce') },
        { value: 'separacao', label: l('Separação judicial de pessoas e bens', 'Judicial separation') },
      ],
    },
    ...partyFields('autor', 'autor', { defaultTipo: 'pessoa' }).filter((f) => !/(Tipo|Nuel|Representante)$/.test(f.name)),
    ...partyFields('reu', 'reu', { defaultTipo: 'pessoa' }).filter((f) => !/(Tipo|Nuel|Representante)$/.test(f.name)),
    { name: 'dataCasamento', type: 'date', section: 'casamento', width: 'half', required: true, label: l('Data do casamento', 'Date of marriage') },
    { name: 'localCasamento', type: 'text', section: 'casamento', width: 'half', label: l('Conservatória ou local', 'Registry or place'), placeholder: l('Ex.: 1.ª Conservatória do Registo Civil de Maputo', 'E.g. 1st Civil Registry of Maputo') },
    { name: 'assento', type: 'text', section: 'casamento', width: 'half', label: l('Assento n.º (opcional)', 'Registration no. (optional)') },
    { name: 'regime', type: 'select', section: 'casamento', width: 'half', label: l('Regime de bens', 'Property regime'), options: REGIME_OPTIONS, default: 'comunhão de adquiridos' },
    {
      name: 'filhos',
      type: 'lines',
      section: 'casamento',
      label: l('Filhos menores', 'Minor children'),
      addLabel: l('Adicionar filho', 'Add child'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'nascimento', type: 'date', label: l('Data de nascimento', 'Date of birth') },
      ],
      default: [],
    },
    { name: 'fundamento', type: 'select', section: 'fundamentos', required: true, label: l('Fundamento principal', 'Main ground'), options: FUND_OPTIONS, default: 'deveres' },
    { name: 'dataSeparacao', type: 'date', section: 'fundamentos', width: 'half', label: l('Separados de facto desde (opcional)', 'Separated since (optional)') },
    {
      name: 'factos',
      type: 'textarea',
      section: 'fundamentos',
      rows: 8,
      required: true,
      label: l('Factos (um artigo por linha)', 'Facts (one article per line)'),
      help: l('Descreva factos concretos, com datas e lugares. Evite expressões genéricas.', 'Describe concrete facts with dates and places.'),
    },
    { name: 'culpa', type: 'toggle', section: 'pedido', label: l('Pedir a declaração do réu como culpado', 'Ask for the respondent to be declared at fault'), help: l('Só quando a lei aplicável preveja a declaração de culpa e o fundamento o permita. Confirme na Lei da Família.', 'Only where the Family Law provides for it.') },
    { name: 'casaMorada', type: 'text', section: 'pedido', label: l('Casa de morada de família (opcional)', 'Family home (optional)'), placeholder: l('Ex.: atribuição à Autora da casa sita no Bairro da Coop, Rua C, n.º 14, Maputo', 'E.g. attribution of the home to the claimant') },
    { name: 'alimentosConjuge', type: 'money', section: 'pedido', width: 'half', label: l('Alimentos ao cônjuge por mês (opcional)', 'Spousal maintenance per month (optional)') },
    { name: 'alimentosFilhos', type: 'money', section: 'pedido', width: 'half', label: l('Alimentos aos filhos por mês (opcional)', 'Child maintenance per month (optional)') },
    { name: 'regulacaoApenso', type: 'toggle', section: 'pedido', default: true, label: l('Requerer a regulação do poder parental por apenso', 'Ask for a parental responsibility order as an annex'), showIf: (v) => lineItems(v.filhos).length > 0 },
    { name: 'valorCausa', type: 'money', section: 'pedido', width: 'half', label: l('Valor da causa', 'Value of the case'), help: l('Acção sobre o estado das pessoas: o valor é o fixado na lei para estas acções (acima da alçada). Confirme.', 'Personal status action: the value is set by law. Confirm.') },
    ...provaFields('prova', { docsPlaceholder: 'Certidão de casamento\nCertidões de nascimento dos filhos\nAuto de denúncia' }),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      { level: 'info', field: 'fundamento', message: l(`Fundamentos e tramitação: ${cite('pcDivorcioLitigioso')}. Confirme o período de separação de facto exigido. Haverá tentativa de conciliação.`, 'Grounds and procedure under the Family Law; confirm the separation period. There is a conciliation attempt.') },
      { level: 'info', message: l('Junte a certidão de casamento e as certidões de nascimento dos filhos menores. Pode requerer o arrolamento dos bens comuns (documento «Providência cautelar»).', 'Attach the marriage and birth certificates. You may ask for an inventory seizure of common property.') },
    ];
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.reuNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const sep = isSep(v);
    const A = g3(v, 'autor');
    const R = g3(v, 'reu');
    const oAutor = `${A.o} ${A.w('Autor', 'Autora')}`;
    const OAutor = `${A.O} ${A.w('Autor', 'Autora')}`;
    const oReu = `${R.o} ${R.w('Réu', 'Ré')}`;
    const filhos = lineItems(v.filhos).filter((f) => str(f.nome));

    const factos = [
      `${OAutor} e ${oReu} contraíram casamento em ${dateLong(v.dataCasamento)}${str(v.localCasamento) ? `, na ${sem(v.localCasamento).replace(/^(n?a)\s+/i, '')}` : ''}${str(v.assento) ? `, conforme assento n.º ${sem(v.assento)}` : ''}, sob o regime de ${str(v.regime) || 'comunhão de adquiridos'} (Documento n.º 1).`,
      filhos.length
        ? `Do casamento ${filhos.length === 1 ? 'nasceu um filho, ainda menor' : 'nasceram os seguintes filhos, ainda menores'}: ${filhos.map((f) => `${f.nome}${f.nascimento ? `, com data de nascimento de ${dateLong(f.nascimento)}` : ''}`).join('; ')}.`
        : 'Do casamento não existem filhos menores.',
      ...(v.dataSeparacao ? [`${OAutor} e ${oReu} vivem separados de facto desde ${dateLong(v.dataSeparacao)}, sem comunhão de vida.`] : []),
      ...artigos(v.factos),
    ];
    const direito = [
      `Os factos descritos integram ${FUND_TEXTO[v.fundamento as string] ?? FUND_TEXTO.deveres}, fundamento ${sep ? 'de separação judicial de pessoas e bens' : 'de divórcio litigioso'} nos termos da Lei da Família.`,
    ];
    const alC = money(v.alimentosConjuge);
    const alF = money(v.alimentosFilhos);
    const pedidos = [
      sep
        ? `Ser decretada a separação judicial de pessoas e bens entre ${oAutor} e ${oReu}`
        : `Ser decretado o divórcio entre ${oAutor} e ${oReu}, com a consequente dissolução do casamento`,
      ...(v.culpa ? [`Ser ${oReu} ${R.w('declarado único culpado', 'declarada única culpada')}, com as legais consequências`] : []),
      ...(str(v.casaMorada) ? [`Ser decidido o destino da casa de morada de família, com a ${sem(v.casaMorada).replace(/^a\s+/i, '')}`] : []),
      ...(alC != null ? [`Ser ${oReu} ${R.w('condenado', 'condenada')} a pagar ${A.ao} ${A.w('Autor', 'Autora')} alimentos no montante mensal de ${moneyExt(alC)}`] : []),
      ...(alF != null && filhos.length ? [`Ser ${oReu} ${R.w('condenado', 'condenada')} a prestar alimentos ${filhos.length === 1 ? 'ao filho menor' : 'aos filhos menores'} no montante mensal de ${moneyExt(alF)}`] : []),
      `Ser ${oReu} ${R.w('condenado', 'condenada')} nas custas e procuradoria condigna`,
    ];
    const depois = [
      {
        id: 'citacao',
        text: `Para tanto, requer a V. Ex.ª se digne designar data para a tentativa de conciliação, ordenando a citação ${R.do} ${R.w('Réu', 'Ré')} para comparecer e, frustrada a conciliação, para contestar no prazo e sob a cominação legais, seguindo-se os ulteriores termos até final.`,
        en: 'The claimant asks the court to set a conciliation attempt and serve the defendant.',
      },
      ...(filhos.length && v.regulacaoApenso
        ? [{ id: 'regulacao', text: `Mais requer que, por apenso, se proceda à regulação do exercício do poder parental relativamente ${filhos.length === 1 ? 'ao filho menor' : 'aos filhos menores'}.`, en: 'The claimant also asks for a parental responsibility order as an annex.' }]
        : []),
    ];
    const pv = prova(v);
    const blocks: Block[] = [
      ...petitionHead(v, {
        accao: sep ? 'a presente\n**ACÇÃO DE SEPARAÇÃO JUDICIAL DE PESSOAS E BENS LITIGIOSA**,' : 'a presente\n**ACÇÃO DE DIVÓRCIO LITIGIOSO**,',
        accaoEn: sep ? 'this action for judicial separation,' : 'this contested divorce action,',
      }),
      { type: 'articulado', sections: [{ heading: 'I — Dos factos', items: factos }, { heading: 'II — Do direito', items: direito }] },
      ...closing(ctx, {
        intro: 'Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, deve a presente acção ser julgada procedente, por provada, e, em consequência:',
        introEn: 'On these grounds, the action should be upheld and:',
        pedidos,
        depois,
        valor: money(v.valorCausa) ?? null,
        docs: pv.docs,
        procuracao: pv.procuracao,
        testemunhas: pv.testemunhas,
      }),
    ];
    return blocks;
  },
});
