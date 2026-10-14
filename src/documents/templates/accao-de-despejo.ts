import { defineTemplate, type Block, type FieldOption, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, formatMoney, l, lawyerFields, localField, money } from './_shared';
import { artigos, courtFields, moneyExt, partyFields } from './_advocacia';
import { closing, g3, lawyerWarnings, petitionHead, prova, provaFields, sem, str } from './_processo-civil';

const FUNDAMENTO_OPTIONS: FieldOption[] = [
  { value: 'rendas', label: l('Falta de pagamento de rendas', 'Unpaid rent') },
  { value: 'fim', label: l('Uso para fim diverso do contratado', 'Use for another purpose') },
  { value: 'obras', label: l('Obras não autorizadas que alteram o prédio', 'Unauthorised structural works') },
  { value: 'subarrendamento', label: l('Subarrendamento ou cedência sem autorização', 'Unauthorised sub-letting or assignment') },
  { value: 'encerrado', label: l('Prédio encerrado ou desabitado', 'Property closed or unoccupied') },
  { value: 'outro', label: l('Outro fundamento (escrever)', 'Other ground (write it)') },
];

const FUND_TEXTO: Record<string, string> = {
  rendas: 'falta de pagamento das rendas no tempo e lugar próprios',
  fim: 'uso do prédio para fim diverso daquele a que se destina',
  obras: 'realização, sem consentimento do senhorio, de obras que alteram substancialmente a estrutura externa ou a disposição interna do prédio',
  subarrendamento: 'subarrendamento ou cedência do gozo do prédio sem autorização do senhorio',
  encerrado: 'conservação do prédio encerrado ou desabitado por período superior ao legalmente admitido',
};

const isRendas = (v: Values) => v.fundamento === 'rendas';

export default defineTemplate({
  id: 'accao-de-despejo',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal', 'Court') },
    { id: 'autor', title: l('Senhorio (autor)', 'Landlord (claimant)'), personRole: 'senhorio' },
    { id: 'reu', title: l('Inquilino (réu)', 'Tenant (defendant)'), personRole: 'inquilino' },
    { id: 'arrendamento', title: l('Arrendamento', 'Lease') },
    { id: 'fundamento', title: l('Fundamento do despejo', 'Ground for eviction') },
    { id: 'pedido', title: l('Pedido e valor', 'Claim and value') },
    { id: 'prova', title: l('Documentos e testemunhas', 'Documents and witnesses') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...courtFields('tribunal'),
    ...partyFields('autor', 'autor', { defaultTipo: 'pessoa' }),
    ...partyFields('reu', 'reu', { defaultTipo: 'pessoa', light: true }),
    { name: 'imovel', type: 'text', section: 'arrendamento', required: true, label: l('Imóvel arrendado', 'Leased property'), placeholder: l('Ex.: flat n.º 3, 2.º andar, do prédio sito na Avenida Ahmed Sekou Touré, n.º 1450, Maputo', 'E.g. flat 3, 2nd floor'), help: l('Identifique o prédio e, se houver, a descrição predial.', 'Identify the property and, if any, its land registry number.') },
    { name: 'finalidade', type: 'select', section: 'arrendamento', width: 'half', label: l('Fim do arrendamento', 'Purpose of the lease'), default: 'habitação', options: [
      { value: 'habitação', label: l('Habitação', 'Housing') },
      { value: 'comércio', label: l('Comércio', 'Commerce') },
      { value: 'indústria', label: l('Indústria', 'Industry') },
      { value: 'exercício de profissão liberal', label: l('Profissão liberal', 'Professional use') },
    ] },
    { name: 'dataContrato', type: 'date', section: 'arrendamento', width: 'half', label: l('Data do contrato', 'Date of the lease') },
    { name: 'renda', type: 'money', section: 'arrendamento', width: 'half', required: true, label: l('Renda mensal', 'Monthly rent') },
    { name: 'diaPagamento', type: 'text', section: 'arrendamento', width: 'half', label: l('Pagamento da renda', 'Rent due'), default: 'até ao dia 8 de cada mês', placeholder: l('Ex.: até ao dia 8 de cada mês', 'E.g. by the 8th of each month') },
    { name: 'contratoEscrito', type: 'toggle', section: 'arrendamento', default: true, label: l('Contrato escrito (junta-se)', 'Written lease (attached)') },
    { name: 'fundamento', type: 'select', section: 'fundamento', required: true, label: l('Fundamento', 'Ground'), options: FUNDAMENTO_OPTIONS, default: 'rendas' },
    { name: 'fundamentoOutro', type: 'text', section: 'fundamento', label: l('Fundamento (escrever)', 'Ground (write it)'), showIf: (v) => v.fundamento === 'outro' },
    { name: 'mesesDivida', type: 'text', section: 'fundamento', label: l('Rendas em falta', 'Rents unpaid'), placeholder: l('Ex.: Junho a Outubro de 2026', 'E.g. June to October 2026'), showIf: isRendas },
    { name: 'valorDivida', type: 'money', section: 'fundamento', width: 'half', label: l('Total das rendas em dívida', 'Total rent owed'), showIf: isRendas },
    { name: 'dataInterpelacao', type: 'date', section: 'fundamento', width: 'half', label: l('Carta de interpelação (opcional)', 'Demand letter (optional)') },
    { name: 'factos', type: 'textarea', section: 'fundamento', rows: 5, label: l('Factos adicionais (um artigo por linha)', 'Additional facts (one article per line)') },
    { name: 'pedirRendas', type: 'toggle', section: 'pedido', default: true, label: l('Pedir também as rendas em dívida e as vincendas', 'Also claim unpaid and future rent') },
    { name: 'indemnizacao', type: 'text', section: 'pedido', label: l('Outra indemnização (opcional)', 'Other damages (optional)'), placeholder: l('Ex.: 85.000,00 MT pela reparação dos danos causados no imóvel', 'E.g. repair of damage') },
    { name: 'valorCausa', type: 'money', section: 'pedido', width: 'half', required: true, label: l('Valor da causa', 'Value of the case'), legal: l('A petição declara o valor da causa.', 'The claim states the value.'), help: l('Nas acções de despejo, o valor segue regra própria (renda de certo período mais as rendas em dívida). Confirme no Código de Processo Civil.', 'Eviction actions have a special value rule; confirm it.') },
    ...provaFields('prova', { docsPlaceholder: 'Contrato de arrendamento\nCarta de interpelação e aviso de recepção\nCertidão predial' }),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      { level: 'info', message: l(`Fundamentos e regime da acção de despejo: ${cite('pcDespejo')}. Confirme a legislação especial do arrendamento urbano aplicável.`, 'Grounds and procedure of the eviction action; confirm the special lease legislation.') },
    ];
    if (isRendas(v)) w.push({ level: 'info', field: 'valorDivida', message: l('Na falta de pagamento de rendas, o inquilino pode fazer caducar o direito à resolução pagando ou depositando as rendas em atraso com a indemnização legal até à contestação.', 'For unpaid rent, the tenant may stop termination by paying the arrears with the legal indemnity up to the defence.') });
    if (money(v.valorCausa) == null) w.push({ level: 'error', field: 'valorCausa', message: l('Indique o valor da causa.', 'Enter the value of the case.') });
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.reuNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const A = g3(v, 'autor');
    const R = g3(v, 'reu');
    const oAutor = `${A.o} ${A.w('Autor', 'Autora')}`;
    const oReu = `${R.o} ${R.w('Réu', 'Ré')}`;
    const OReu = `${R.O} ${R.w('Réu', 'Ré')}`;
    const fund = v.fundamento === 'outro' ? sem(v.fundamentoOutro) || '____________________' : FUND_TEXTO[v.fundamento as string] ?? FUND_TEXTO.rendas;

    const factos = [
      `${v.contratoEscrito ? 'Por contrato escrito' : 'Por contrato verbal'}${v.dataContrato ? ` celebrado em ${dateLong(v.dataContrato)}` : ''}, ${oAutor} deu de arrendamento ${R.ao} ${R.w('Réu', 'Ré')}, para ${str(v.finalidade) || 'habitação'}, ${sem(v.imovel) || '____________________'}${v.contratoEscrito ? ' (Documento n.º 1)' : ''}.`,
      `A renda mensal é de ${moneyExt(v.renda)}, a pagar ${sem(v.diaPagamento) || '____________________'}.`,
    ];
    if (isRendas(v)) {
      factos.push(
        `${OReu} não pagou as rendas relativas a ${sem(v.mesesDivida) || '____________________'}, no montante total de ${formatMoney(money(v.valorDivida))}.`,
        ...(v.dataInterpelacao ? [`Por carta de ${dateLong(v.dataInterpelacao)}, ${oAutor} interpelou ${oReu} para pagar, sem qualquer resultado.`] : []),
      );
    } else if (v.dataInterpelacao) {
      factos.push(`Por carta de ${dateLong(v.dataInterpelacao)}, ${oAutor} interpelou ${oReu} para pôr termo à situação, sem qualquer resultado.`);
    }
    factos.push(...artigos(v.factos));
    const direito = [
      `A ${fund} constitui fundamento de resolução do contrato de arrendamento pelo senhorio, que a lei manda decretar judicialmente, através da acção de despejo.`,
      ...(isRendas(v) ? ['Pelas rendas em dívida responde o arrendatário, acrescidas da indemnização legal, e são devidas as rendas que se vencerem até à entrega efectiva do imóvel.'] : []),
    ];
    const pedidos = [
      `Ser decretada a resolução do contrato de arrendamento e ${oReu} ${R.w('condenado', 'condenada')} a despejar imediatamente o imóvel e a entregá-lo ${A.ao} ${A.w('Autor', 'Autora')} livre de pessoas e bens`,
      ...(v.pedirRendas && isRendas(v) ? [`Ser ${oReu} ${R.w('condenado', 'condenada')} a pagar as rendas vencidas, no montante de ${formatMoney(money(v.valorDivida))}, e as vincendas até à entrega efectiva do imóvel, acrescidas de juros de mora à taxa legal`] : []),
      ...(str(v.indemnizacao) ? [`Ser ${oReu} ${R.w('condenado', 'condenada')} a pagar ${sem(v.indemnizacao)}`] : []),
      `Ser ${oReu} ${R.w('condenado', 'condenada')} nas custas e procuradoria condigna`,
    ];
    const pv = prova(v);
    const blocks: Block[] = [
      ...petitionHead(v, {
        accao: 'a presente\n**ACÇÃO DE DESPEJO**,',
        accaoEn: 'this eviction action,',
      }),
      { type: 'articulado', sections: [{ heading: 'I — Dos factos', items: factos }, { heading: 'II — Do direito', items: direito }] },
      ...closing(ctx, {
        intro: 'Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, deve a presente acção ser julgada procedente, por provada, e, em consequência:',
        introEn: 'On these grounds, the action should be upheld and:',
        pedidos,
        depois: [{ id: 'citacao', text: `Para tanto, requer a V. Ex.ª se digne ordenar a citação ${R.do} ${R.w('Réu', 'Ré')} para, querendo, contestar no prazo e sob a cominação legais, seguindo-se os ulteriores termos até final.`, en: 'The claimant asks for service on the defendant.' }],
        valor: money(v.valorCausa),
        docs: pv.docs,
        procuracao: pv.procuracao,
        testemunhas: pv.testemunhas,
      }),
    ];
    return blocks;
  },
});
