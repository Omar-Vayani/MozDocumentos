import { defineTemplate, type Block, type FieldOption, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, formatMoney, l, lawyerFields, localField, money } from './_shared';
import { artigos, courtFields, partyFields } from './_advocacia';
import { closing, g3, lawyerWarnings, petitionHead, prova, provaFields, sem, str } from './_processo-civil';

const RELACAO_OPTIONS: FieldOption[] = [
  { value: 'mandatario', label: l('Mandatário ou procurador', 'Agent or attorney') },
  { value: 'gerente', label: l('Gerente ou administrador de sociedade', 'Company manager') },
  { value: 'cabeca', label: l('Cabeça-de-casal da herança', 'Estate administrator') },
  { value: 'administrador', label: l('Administrador de bens alheios', 'Manager of another’s property') },
  { value: 'socio', label: l('Sócio gestor de negócio comum', 'Partner managing a joint business') },
  { value: 'outro', label: l('Outra relação (escrever)', 'Other (write it)') },
];

const RELACAO_TEXTO: Record<string, [string, string]> = {
  mandatario: ['mandatário', 'mandatária'],
  gerente: ['gerente', 'gerente'],
  cabeca: ['cabeça-de-casal da herança', 'cabeça-de-casal da herança'],
  administrador: ['administrador dos bens', 'administradora dos bens'],
  socio: ['sócio gestor do negócio comum', 'sócia gestora do negócio comum'],
};

const exigir = (v: Values) => v.modo !== 'prestar';

export default defineTemplate({
  id: 'prestacao-de-contas',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e modalidade', 'Court and type') },
    { id: 'autor', title: l('Autor', 'Claimant'), personRole: 'cliente' },
    { id: 'reu', title: l('Réu', 'Defendant'), personRole: 'outro' },
    { id: 'relacao', title: l('Relação e período', 'Relationship and period') },
    { id: 'pedido', title: l('Pedido e valor', 'Claim and value') },
    { id: 'prova', title: l('Documentos e testemunhas', 'Documents and witnesses') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...courtFields('tribunal'),
    {
      name: 'modo',
      type: 'radio',
      section: 'tribunal',
      label: l('Acção', 'Action'),
      default: 'exigir',
      options: [
        { value: 'exigir', label: l('Exigir contas a quem administrou', 'Demand an account') },
        { value: 'prestar', label: l('Prestar contas (quem administrou)', 'Render an account') },
      ],
    },
    ...partyFields('autor', 'autor', { defaultTipo: 'pessoa' }),
    ...partyFields('reu', 'reu', { defaultTipo: 'pessoa', light: true }),
    { name: 'relacao', type: 'select', section: 'relacao', required: true, label: l('Quem administrou era', 'The administrator was'), options: RELACAO_OPTIONS, default: 'mandatario' },
    { name: 'relacaoOutro', type: 'text', section: 'relacao', label: l('Relação (escrever)', 'Relationship (write it)'), showIf: (v) => v.relacao === 'outro' },
    { name: 'objecto', type: 'text', section: 'relacao', required: true, label: l('Bens ou negócio administrado', 'Property or business managed'), placeholder: l('Ex.: as rendas dos três apartamentos do prédio sito na Rua de Kassuende, n.º 70, Maputo', 'E.g. the rents of three flats') },
    { name: 'periodoInicio', type: 'date', section: 'relacao', width: 'half', label: l('Desde', 'From') },
    { name: 'periodoFim', type: 'date', section: 'relacao', width: 'half', label: l('Até', 'To') },
    { name: 'factos', type: 'textarea', section: 'relacao', rows: 6, label: l('Factos (um artigo por linha)', 'Facts (one article per line)'), help: l('Origem do dever de prestar contas, valores recebidos, pedidos de contas feitos e recusa.', 'Source of the duty, amounts received, requests made and refusal.') },
    { name: 'saldoEstimado', type: 'money', section: 'pedido', width: 'half', label: l('Saldo estimado a favor do autor (opcional)', 'Estimated balance (optional)') },
    { name: 'valorCausa', type: 'money', section: 'pedido', width: 'half', label: l('Valor da causa', 'Value of the case'), help: l('Em regra, o valor da receita bruta ou o saldo estimado. Confirme.', 'Usually gross income or estimated balance. Confirm.') },
    ...provaFields('prova', { docsPlaceholder: 'Procuração\nCartas a pedir contas\nExtractos bancários' }),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => [
    { level: 'info', message: l(`${cite('pcPrestacaoContas')}. ${exigir(v) ? 'Citado, o réu presta as contas ou contesta a obrigação; se não as prestar, o autor pode apresentá-las.' : 'As contas são apresentadas em forma de conta-corrente, com receitas, despesas e saldo, e os documentos.'}`, 'Special procedure for an account.') },
    ...lawyerWarnings(v),
  ] satisfies Warning[],

  personName: (v) => v.reuNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const A = g3(v, 'autor');
    const R = g3(v, 'reu');
    const ex = exigir(v);
    const OAutor = `${A.O} ${A.w('Autor', 'Autora')}`;
    const OReu = `${R.O} ${R.w('Réu', 'Ré')}`;
    const oReu = `${R.o} ${R.w('Réu', 'Ré')}`;
    // Who managed: the defendant (demand) or the claimant (rendering).
    const G = ex ? R : A;
    const quemGere = ex ? OReu : OAutor;
    const outro = ex ? `${A.ao} ${A.w('Autor', 'Autora')}` : `${R.ao} ${R.w('Réu', 'Ré')}`;
    const rel = v.relacao === 'outro' ? sem(v.relacaoOutro) || '____________________' : (RELACAO_TEXTO[v.relacao as string] ?? RELACAO_TEXTO.mandatario)[G.f ? 1 : 0];
    const periodo = v.periodoInicio || v.periodoFim ? `, no período de ${dateLong(v.periodoInicio)} a ${v.periodoFim ? dateLong(v.periodoFim) : 'esta data'}` : '';
    const factos = [
      `${quemGere} actuou como ${rel}, administrando ${sem(v.objecto) || '____________________'}${periodo}, no interesse ${ex ? `${A.do} ${A.w('Autor', 'Autora')}` : `${R.do} ${R.w('Réu', 'Ré')}`}.`,
      `Nessa qualidade, ${ex ? oReu : `${A.o} ${A.w('Autor', 'Autora')}`} recebeu quantias e realizou despesas por conta ${ex ? `${A.do} ${A.w('Autor', 'Autora')}` : `${R.do} ${R.w('Réu', 'Ré')}`}, estando obrigad${G.f ? 'a' : 'o'} a prestar-lhe contas.`,
      ...artigos(v.factos),
      ...(ex ? [`Apesar de ${R.w('instado', 'instada')} para o efeito, ${oReu} não prestou contas.`] : [`${OAutor} pretende prestar as contas ${outro}, que se recusa a recebê-las ou a aprová-las extrajudicialmente.`]),
    ];
    const saldo = money(v.saldoEstimado);
    const pedidos = ex
      ? [
          `Ser ${oReu} ${R.w('citado', 'citada')} para, no prazo legal, prestar contas da sua administração${periodo}, ou contestar a obrigação de as prestar`,
          `Serem as contas julgadas e ${oReu} ${R.w('condenado', 'condenada')} a pagar ${A.ao} ${A.w('Autor', 'Autora')} o saldo que se apurar${saldo != null ? `, que se estima em ${formatMoney(saldo)}` : ''}, acrescido de juros de mora à taxa legal desde a citação`,
          `Ser ${oReu} ${R.w('condenado', 'condenada')} nas custas e procuradoria condigna`,
        ]
      : [
          `Ser ${oReu} ${R.w('citado', 'citada')} para, querendo, contestar as contas que ${A.w('o Autor', 'a Autora')} apresenta`,
          'Serem as contas julgadas e aprovadas, fixando-se o saldo e condenando-se no seu pagamento quem for devedor',
        ];
    const pv = prova(v);
    const blocks: Block[] = [
      ...petitionHead(v, { accao: ex ? 'a presente\n**ACÇÃO ESPECIAL DE PRESTAÇÃO DE CONTAS**,' : 'a presente\n**ACÇÃO ESPECIAL DE PRESTAÇÃO DE CONTAS**,\nem que as presta,', accaoEn: 'this action for an account,' }),
      { type: 'articulado', sections: [{ heading: 'I — Dos factos', items: factos }] },
      ...closing(ctx, {
        intro: 'Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, requer:',
        introEn: 'On these grounds, the claimant requests:',
        pedidos,
        valor: money(v.valorCausa),
        docs: pv.docs,
        procuracao: pv.procuracao,
        testemunhas: pv.testemunhas,
      }),
    ];
    return blocks;
  },
});
