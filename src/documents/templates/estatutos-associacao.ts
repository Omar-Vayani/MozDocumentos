import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, l, lineItems } from './_shared';
import { deNomeSimples, ext, fracao, minus, num, provinciaNome, quantos, semPonto, str, vezes } from './_associacoes';

// Estatutos de uma associação sem fins lucrativos (Lei n.º 8/91 + Código
// Civil). Filed with the recognising authority and published in the Boletim
// da República: plain layout, no letterhead (the association does not exist
// yet as a legal person). Signed through the acta da assembleia constituinte.

const AMBITO_OPTIONS = [
  { value: 'nacional', label: l('Nacional (todo o país)', 'National') },
  { value: 'provincial', label: l('Provincial (uma província)', 'Provincial (one province)') },
  { value: 'distrital', label: l('Distrital (um distrito)', 'District') },
];

const TIPO_OPTIONS = [
  { value: 'civica', label: l('Cívica / desenvolvimento comunitário', 'Civic / community development') },
  { value: 'profissional', label: l('Profissional ou empresarial', 'Professional or business') },
  { value: 'cultural', label: l('Cultural, artística ou recreativa', 'Cultural or recreational') },
  { value: 'desportiva', label: l('Desportiva (clube)', 'Sports club') },
  { value: 'moradores', label: l('De moradores', 'Residents') },
  { value: 'juvenil', label: l('Juvenil ou estudantil', 'Youth or students') },
  { value: 'mulheres', label: l('De mulheres', 'Women') },
  { value: 'pais', label: l('De pais e encarregados de educação', 'Parents') },
  { value: 'outra', label: l('Outra', 'Other') },
];

const OBJECTIVO_DEFAULT: Record<string, string> = {
  civica: 'contribuir para o desenvolvimento social, económico e cultural das comunidades da sua área de actuação',
  profissional: 'representar e defender os interesses dos seus membros e promover o desenvolvimento da respectiva profissão ou sector de actividade',
  cultural: 'promover, divulgar e preservar a cultura e as artes, bem como a ocupação dos tempos livres dos seus membros',
  desportiva: 'promover e desenvolver a prática desportiva, recreativa e cultural dos seus membros e da comunidade',
  moradores: 'promover a melhoria das condições de vida, de saneamento e de segurança dos moradores da sua área de residência',
  juvenil: 'promover a participação dos jovens na vida social, económica e cultural do país',
  mulheres: 'promover a igualdade de género e o empoderamento social e económico da mulher',
  pais: 'promover a participação dos pais e encarregados de educação na vida escolar e na educação dos seus educandos',
  outra: '',
};

const PALAVRAS_PROIBIDAS = /partido|pol[ií]tic[oa] partid|sindica|cooperativ|igreja|culto|confiss[aã]o religiosa/i;

export default defineTemplate({
  id: 'estatutos-associacao',
  family: 'contrato',
  official: 'registo',
  letterhead: false,
  sections: [
    { id: 'associacao', title: l('Associação', 'Association') },
    { id: 'objectivos', title: l('Objectivos', 'Objectives') },
    { id: 'membros', title: l('Membros e quotas', 'Members and dues') },
    { id: 'orgaos', title: l('Órgãos sociais', 'Governing bodies') },
    { id: 'final', title: l('Património e disposições finais', 'Assets and final provisions') },
  ],
  fields: [
    { name: 'nome', type: 'text', section: 'associacao', required: true, label: l('Nome da associação', 'Name of the association'), placeholder: l('Ex.: Associação Juvenil Esperança de Mafalala', 'E.g. Associação Juvenil Esperança') },
    { name: 'sigla', type: 'text', section: 'associacao', width: 'half', label: l('Sigla (opcional)', 'Acronym (optional)') },
    { name: 'tipo', type: 'select', section: 'associacao', width: 'half', label: l('Tipo de associação', 'Kind of association'), options: TIPO_OPTIONS, default: 'civica' },
    { name: 'sede', type: 'text', section: 'associacao', required: true, label: l('Sede (morada completa)', 'Seat (full address)'), placeholder: l('Ex.: Rua da Mafalala, n.º 25, Bairro da Mafalala, Cidade de Maputo', 'Full address') },
    {
      name: 'ambito',
      type: 'select',
      section: 'associacao',
      width: 'half',
      required: true,
      label: l('Âmbito de actuação', 'Area of activity'),
      legal: l('Decide quem reconhece a associação: o Ministro da Justiça (nacional) ou o órgão do Estado na província.', 'Decides who recognises the association: the Minister of Justice (national) or the provincial authority.'),
      options: AMBITO_OPTIONS,
      default: 'provincial',
    },
    { name: 'provincia', type: 'text', section: 'associacao', width: 'half', label: l('Província', 'Province'), default: (c) => c.profile?.morada?.provincia || 'Cidade de Maputo', showIf: (v) => v.ambito !== 'nacional' },
    { name: 'distrito', type: 'text', section: 'associacao', width: 'half', label: l('Distrito', 'District'), showIf: (v) => v.ambito === 'distrital' },
    {
      name: 'objectivoGeral',
      type: 'textarea',
      section: 'objectivos',
      required: true,
      rows: 2,
      label: l('Objectivo geral', 'General objective'),
      help: l('Continua a frase «A Associação tem por objectivo geral…». Os fins devem ser lícitos, determinados e possíveis.', 'Continues “The Association’s general objective is…”. Aims must be lawful, specific and possible.'),
      default: OBJECTIVO_DEFAULT.civica,
    },
    {
      name: 'objectivos',
      type: 'lines',
      section: 'objectivos',
      required: true,
      label: l('Objectivos específicos', 'Specific objectives'),
      addLabel: l('Adicionar objectivo', 'Add objective'),
      columns: [{ name: 'objectivo', type: 'text', label: l('Objectivo', 'Objective'), placeholder: l('Ex.: promover acções de formação profissional para jovens', 'E.g. run vocational training for young people') }],
      default: [
        { objectivo: 'promover acções de formação, capacitação e educação cívica dos membros e da comunidade' },
        { objectivo: 'desenvolver projectos de geração de rendimento e de apoio social às famílias mais vulneráveis' },
        { objectivo: 'colaborar com as autoridades locais e outras organizações na resolução dos problemas da comunidade' },
      ],
    },
    { name: 'idadeMinima', type: 'number', section: 'membros', width: 'half', label: l('Idade mínima dos membros', 'Minimum age of members'), default: 18, min: 0 },
    { name: 'pessoasColectivas', type: 'toggle', section: 'membros', label: l('Admitir pessoas colectivas como membros', 'Admit organisations as members'), default: false },
    { name: 'proponentes', type: 'number', section: 'membros', width: 'half', label: l('Proponentes da admissão', 'Members who must propose'), help: l('Número de membros efectivos que propõem o candidato. 0 = sem proponentes.', 'Members who propose a candidate. 0 = none.'), default: 2, min: 0 },
    { name: 'mesesQuotas', type: 'number', section: 'membros', width: 'half', label: l('Meses de quotas em atraso para perder a qualidade de membro', 'Months of unpaid dues before losing membership'), default: 12, min: 1 },
    { name: 'suspensaoMeses', type: 'number', section: 'membros', width: 'half', label: l('Suspensão máxima (meses)', 'Maximum suspension (months)'), default: 6, min: 1 },
    { name: 'mandato', type: 'number', section: 'orgaos', width: 'half', required: true, label: l('Duração do mandato (anos)', 'Term of office (years)'), default: 3, min: 1 },
    { name: 'renovacoes', type: 'number', section: 'orgaos', width: 'half', label: l('Reeleições consecutivas permitidas', 'Consecutive re-elections'), default: 1, min: 0 },
    {
      name: 'direccao',
      type: 'lines',
      section: 'orgaos',
      required: true,
      label: l('Composição da Direcção (cargos)', 'Board composition (positions)'),
      help: l('A lei exige um número ímpar de titulares.', 'The law requires an odd number of members.'),
      addLabel: l('Adicionar cargo', 'Add position'),
      columns: [{ name: 'cargo', type: 'text', label: l('Cargo', 'Position') }],
      default: [{ cargo: 'Presidente' }, { cargo: 'Vice-Presidente' }, { cargo: 'Secretário-Geral' }, { cargo: 'Tesoureiro' }, { cargo: 'Vogal' }],
    },
    { name: 'conselhoFiscal', type: 'number', section: 'orgaos', width: 'half', label: l('Membros do Conselho Fiscal', 'Members of the audit council'), default: 3, min: 1 },
    { name: 'prazoAG', type: 'text', section: 'orgaos', width: 'half', label: l('Assembleia ordinária anual até', 'Annual meeting by'), default: '31 de Março' },
    { name: 'convocacaoEmail', type: 'toggle', section: 'orgaos', label: l('Permitir também convocatória por email com aviso de recepção', 'Also allow notice by email with receipt'), help: l('A lei prevê aviso postal; o email fica como meio complementar.', 'The law provides for postal notice; email is a complement.'), default: true },
    {
      name: 'formaObrigar',
      type: 'textarea',
      section: 'orgaos',
      rows: 2,
      label: l('Forma de obrigar a associação', 'How the association is bound'),
      default: 'duas assinaturas de membros da Direcção, sendo obrigatoriamente uma delas a do Presidente ou a do Tesoureiro',
    },
    { name: 'cargosGratuitos', type: 'toggle', section: 'orgaos', label: l('Cargos exercidos gratuitamente (com reembolso de despesas)', 'Unpaid positions (expenses reimbursed)'), default: true },
    { name: 'destinoBens', type: 'text', section: 'final', label: l('Destino dos bens em caso de dissolução', 'Assets on dissolution'), default: 'uma instituição sem fins lucrativos com objectivos semelhantes, designada pela Assembleia Geral' },
    { name: 'dataAprovacao', type: 'date', section: 'final', width: 'half', label: l('Data da assembleia constituinte (opcional)', 'Founding meeting date (optional)') },
  ],

  blocks: (ctx) => {
    const v = ctx.values;
    const L = ctx.legal;
    const nome = str(v.nome) || BLANK;
    const sigla = str(v.sigla);
    const q = L.value<{ primeira: number; estatutos: number; dissolucao: number }>('assocQuorum');
    const ag = L.value<{ requerimento: number }>('assocAGAnual');
    const prazoConv = L.value<number>('convocatoriaAssociacao');
    const mandato = num(v.mandato);
    const renov = num(v.renovacoes);
    const cargos = lineItems(v.direccao).map((r) => str(r.cargo)).filter(Boolean);
    const cf = num(v.conselhoFiscal) ?? 3;
    const prop = num(v.proponentes) ?? 0;
    const objectivos = lineItems(v.objectivos).map((r) => semPonto(r.objectivo)).filter(Boolean).map(minus);
    const ambito =
      v.ambito === 'nacional'
        ? 'em todo o território nacional'
        : v.ambito === 'distrital'
          ? `no Distrito de ${str(v.distrito) || BLANK}, ${provinciaNome(v.provincia)}`
          : `na ${provinciaNome(v.provincia)}`;
    const vogais = Math.max(0, cf - 1);

    const cap = (t: string) => ({ type: 'heading', text: t, align: 'center' }) as Block;

    const c1: ClauseItem[] = [
      {
        id: 'denominacao',
        heading: 'Denominação e natureza',
        text: `1. A **${nome}**${sigla ? `, abreviadamente designada por **${sigla}**,` : ''} é uma pessoa colectiva de direito privado, sem fins lucrativos, dotada de personalidade jurídica e de autonomia administrativa, financeira e patrimonial.\n2. A Associação rege-se pelos presentes estatutos, pelo regulamento interno e pela legislação aplicável.`,
        en: 'The association is a private non-profit legal person with administrative, financial and property autonomy, governed by these statutes, its internal rules and the law.',
      },
      {
        id: 'sede',
        heading: 'Sede e âmbito',
        text: `1. A Associação tem a sua sede em ${str(v.sede) || BLANK}, podendo, por deliberação da Assembleia Geral, transferi-la e abrir delegações ou outras formas de representação em qualquer ponto do território nacional.\n2. A Associação desenvolve as suas actividades ${ambito}.`,
        en: 'Seat and area of activity; the general meeting may move the seat and open branches.',
      },
      {
        id: 'duracao',
        heading: 'Duração',
        text: 'A Associação é constituída por tempo indeterminado, contando-se o seu início a partir da data do seu reconhecimento.',
        en: 'The association is formed for an indefinite period from the date of its recognition.',
      },
      {
        id: 'objectivos',
        heading: 'Objectivos',
        text: `1. A Associação tem por objectivo geral ${semPonto(v.objectivoGeral) || BLANK}.\n2. São objectivos específicos da Associação:`,
        items: [...(objectivos.length ? objectivos : [BLANK]).map((o) => `${o};`)],
        en: 'General and specific objectives.',
      },
      {
        id: 'cooperacao',
        heading: 'Cooperação',
        text: 'Para a prossecução dos seus objectivos, a Associação pode estabelecer relações de cooperação com entidades públicas e privadas, nacionais e estrangeiras, e filiar-se em organizações congéneres, mediante deliberação da Assembleia Geral.',
        en: 'The association may cooperate with public and private bodies and join similar organisations.',
      },
      {
        id: 'principios',
        heading: 'Princípios',
        text: 'A Associação é apartidária e rege-se pelos princípios da democraticidade, da transparência, da igualdade dos membros e da não discriminação em razão da cor, raça, sexo, origem étnica, lugar de nascimento, religião, grau de instrução, posição social, condição física ou mental, estado civil dos pais ou profissão.',
        en: 'The association is non-partisan and follows principles of democracy, transparency, equality and non-discrimination.',
      },
    ];
    // Last list item ends with a full stop.
    const it = c1[3].items!;
    it[it.length - 1] = it[it.length - 1].replace(/;$/, '.');

    const c2: ClauseItem[] = [
      {
        id: 'categorias',
        heading: 'Categorias de membros',
        text: 'A Associação tem as seguintes categorias de membros:',
        items: [
          '**Membros fundadores**: os que subscreveram a acta da assembleia constituinte;',
          `**Membros efectivos**: as pessoas singulares${v.pessoasColectivas ? ' ou colectivas' : ''} admitidas nos termos dos presentes estatutos;`,
          '**Membros honorários**: as pessoas singulares ou colectivas que, pelo seu contributo relevante, sejam como tal proclamadas pela Assembleia Geral, sob proposta da Direcção; os membros honorários não estão sujeitos ao pagamento de quotas e não têm direito de voto.',
        ],
        en: 'Founding, full and honorary members; honorary members pay no dues and do not vote.',
      },
      {
        id: 'admissao',
        heading: 'Admissão',
        text: `1. Podem ser membros as pessoas singulares maiores de ${quantos(num(v.idadeMinima), 'ano', 'anos')}${v.pessoasColectivas ? ' e as pessoas colectivas' : ''} que aceitem os presentes estatutos e o regulamento interno.\n2. A admissão é feita mediante pedido escrito, em ficha própria${prop > 0 ? `, proposto por ${ext(prop)} ${prop === 1 ? 'membro efectivo' : 'membros efectivos'}` : ''}, e aprovada pela Direcção.\n3. Da recusa de admissão cabe recurso para a Assembleia Geral.`,
        en: 'Admission by written application approved by the board; refusal may be appealed to the general meeting.',
      },
      {
        id: 'direitos',
        heading: 'Direitos dos membros',
        text: 'São direitos dos membros fundadores e efectivos:',
        items: [
          'participar e votar nas reuniões da Assembleia Geral;',
          'eleger e ser eleito para os órgãos sociais;',
          'requerer a convocação da Assembleia Geral, nos termos da lei e dos presentes estatutos;',
          'ser informado das actividades e da gestão da Associação e examinar as contas;',
          'beneficiar dos serviços e das actividades da Associação;',
          'recorrer para a Assembleia Geral das decisões da Direcção que considerem lesivas dos seus direitos.',
        ],
        en: 'Rights of members.',
      },
      {
        id: 'deveres',
        heading: 'Deveres dos membros',
        text: 'São deveres dos membros:',
        items: [
          'cumprir os estatutos, o regulamento interno e as deliberações dos órgãos sociais;',
          'pagar pontualmente a jóia e as quotas fixadas pela Assembleia Geral;',
          'exercer com zelo os cargos para que forem eleitos;',
          'contribuir para o prestígio e o desenvolvimento da Associação.',
        ],
        en: 'Duties of members.',
      },
      {
        id: 'sancoes',
        heading: 'Sanções',
        text: 'Os membros que violem os seus deveres estão sujeitos às seguintes sanções, consoante a gravidade da infracção:',
        items: ['advertência escrita;', `suspensão até ${quantos(num(v.suspensaoMeses), 'mês', 'meses')};`, 'expulsão.'],
        en: 'Sanctions: written warning, suspension, expulsion.',
      },
      {
        id: 'processoDisciplinar',
        heading: 'Processo disciplinar',
        text: '1. Nenhuma sanção é aplicada sem que o membro seja previamente ouvido por escrito, no prazo fixado no regulamento interno.\n2. A advertência e a suspensão são aplicadas pela Direcção; a expulsão é deliberada pela Assembleia Geral, sob proposta da Direcção.\n3. Das sanções aplicadas pela Direcção cabe recurso para a Assembleia Geral.',
        en: 'The member is always heard first; the board warns and suspends, the general meeting expels; appeal to the general meeting.',
      },
      {
        id: 'perda',
        heading: 'Perda da qualidade de membro',
        text: 'Perde a qualidade de membro:',
        items: [
          'o que o solicitar por escrito à Direcção;',
          `o que deixar de pagar as quotas durante ${quantos(num(v.mesesQuotas), 'mês', 'meses')} consecutivos e não regularizar a situação depois de notificado para o efeito;`,
          'o que for expulso.',
        ],
        en: 'Loss of membership: resignation, unpaid dues after notice, expulsion.',
      },
    ];

    const direccaoTxt = cargos.length ? cargos.map((c) => `um ${c}`).join(', ').replace(/, ([^,]*)$/, ' e $1') : BLANK;
    const c3: ClauseItem[] = [
      {
        id: 'orgaos',
        heading: 'Órgãos sociais',
        text: `1. São órgãos da Associação a Assembleia Geral, a Direcção e o Conselho Fiscal.\n2. Os titulares dos órgãos sociais são eleitos pela Assembleia Geral, por voto secreto, para um mandato de ${quantos(mandato, 'ano', 'anos')}${renov != null ? (renov === 0 ? ', não renovável' : `, podendo ser reeleitos ${vezes(renov)} consecutivamente`) : ''}.\n3. O exercício de cargos nos órgãos sociais é ${v.cargosGratuitos !== false ? 'gratuito, sem prejuízo do reembolso das despesas comprovadamente realizadas ao serviço da Associação' : 'remunerado nos termos fixados pela Assembleia Geral'}.`,
        en: 'Bodies, election by secret ballot, term of office.',
      },
      {
        id: 'ag',
        heading: 'Assembleia Geral',
        text: '1. A Assembleia Geral é o órgão máximo da Associação e é constituída por todos os membros no pleno gozo dos seus direitos.\n2. A Mesa da Assembleia Geral é composta por um Presidente, um Vice-Presidente e um Secretário.',
        en: 'The general meeting is the supreme body; its chair, vice-chair and secretary.',
      },
      {
        id: 'agCompetencias',
        heading: 'Competências da Assembleia Geral',
        text: 'Compete à Assembleia Geral:',
        items: [
          'eleger e destituir os titulares dos órgãos sociais;',
          'aprovar o plano de actividades e o orçamento, bem como o relatório de actividades e as contas de cada exercício;',
          'fixar o valor da jóia e das quotas;',
          'aprovar e alterar os estatutos e o regulamento interno;',
          'deliberar sobre a expulsão de membros e proclamar membros honorários;',
          'autorizar a aquisição, oneração e alienação de bens imóveis;',
          'deliberar sobre a filiação da Associação em organizações congéneres;',
          'deliberar sobre a dissolução da Associação e o destino dos seus bens.',
        ],
        en: 'Powers of the general meeting.',
      },
      {
        id: 'agReunioes',
        heading: 'Reuniões e convocação',
        text: `1. A Assembleia Geral reúne ordinariamente uma vez por ano, até ${str(v.prazoAG) || BLANK}, para apreciar e votar o relatório de actividades e as contas do exercício anterior e o plano e orçamento do ano em curso, e extraordinariamente sempre que convocada pelo Presidente da Mesa, a pedido da Direcção, do Conselho Fiscal ou de, pelo menos, ${fracao(ag.requerimento)} dos membros no pleno gozo dos seus direitos.\n2. A convocatória é feita pelo Presidente da Mesa por aviso postal expedido a cada membro com a antecedência mínima de ${quantos(prazoConv, 'dia', 'dias')}${v.convocacaoEmail !== false ? ', podendo ainda ser enviada por correio electrónico com pedido de confirmação de recepção' : ''}, e afixada na sede, indicando o dia, a hora, o local e a ordem de trabalhos.`,
        en: 'Annual and extraordinary meetings; notice by post at least the legal number of days before.',
      },
      {
        id: 'agQuorum',
        heading: 'Quórum e deliberações',
        text: `1. A Assembleia Geral não pode deliberar, em primeira convocação, sem a presença de, pelo menos, ${fracao(q.primeira)} dos seus membros; em segunda convocação, delibera com qualquer número de membros presentes.\n2. As deliberações são tomadas por maioria absoluta de votos dos membros presentes.\n3. As deliberações sobre alteração dos estatutos exigem o voto favorável de ${fracao(q.estatutos)} do número de membros presentes, e as deliberações sobre a dissolução da Associação o voto favorável de ${fracao(q.dissolucao)} do número de todos os membros.`,
        en: 'Quorum on first call, absolute majority, qualified majorities for amendment and dissolution.',
      },
      {
        id: 'direccao',
        heading: 'Direcção',
        text: `1. A Direcção é o órgão de gestão e representação da Associação e é composta por ${cargos.length ? `${ext(cargos.length)} membros: ${direccaoTxt}` : BLANK}.\n2. A Direcção reúne ordinariamente uma vez por mês e delibera por maioria dos membros presentes, tendo o Presidente voto de qualidade.`,
        en: 'Composition and meetings of the board.',
      },
      {
        id: 'direccaoCompetencias',
        heading: 'Competências da Direcção',
        text: 'Compete à Direcção:',
        items: [
          'gerir a Associação e representá-la em juízo e fora dele;',
          'executar as deliberações da Assembleia Geral;',
          'elaborar o plano de actividades, o orçamento, o relatório de actividades e as contas;',
          'admitir membros e aplicar as sanções da sua competência;',
          'contratar pessoal e colaboradores;',
          'abrir e movimentar contas bancárias.',
        ],
        en: 'Powers of the board.',
      },
      {
        id: 'obrigar',
        heading: 'Forma de obrigar',
        text: `A Associação obriga-se com ${semPonto(v.formaObrigar) || BLANK}, salvo nos actos de mero expediente, em que basta a assinatura de um membro da Direcção.`,
        en: 'How the association is bound.',
      },
      {
        id: 'conselhoFiscal',
        heading: 'Conselho Fiscal',
        text: `1. O Conselho Fiscal é composto por ${ext(cf)} ${cf === 1 ? 'membro' : 'membros'}: um Presidente${vogais ? ` e ${vogais === 1 ? 'um Vogal' : `${ext(vogais)} Vogais`}` : ''}.\n2. Compete ao Conselho Fiscal fiscalizar a gestão financeira e patrimonial da Associação, examinar a escrita e dar parecer sobre o relatório de actividades, as contas e o orçamento.`,
        en: 'Composition and powers of the audit council.',
      },
    ];

    const c4: ClauseItem[] = [
      {
        id: 'receitas',
        heading: 'Receitas',
        text: 'Constituem receitas da Associação:',
        items: [
          'a jóia e as quotas dos membros;',
          'os donativos, subsídios, legados e heranças aceites pela Direcção;',
          'os rendimentos dos seus bens e das actividades que realize;',
          'quaisquer outras receitas permitidas por lei.',
        ],
        en: 'Sources of income.',
      },
      {
        id: 'transparencia',
        heading: 'Transparência',
        text: '1. A Associação mantém registos actualizados dos seus membros, dos titulares dos órgãos sociais e dos seus beneficiários efectivos, e declara-os nos termos da legislação de prevenção e combate ao branqueamento de capitais e ao financiamento do terrorismo.\n2. A Associação não aceita donativos cuja origem não possa ser identificada.\n3. Os rendimentos e bens da Associação não podem ser distribuídos pelos membros.',
        en: 'Records of members, officers and beneficial owners; no donations of unknown origin; no distribution to members.',
      },
    ];

    const c5: ClauseItem[] = [
      {
        id: 'dissolucao',
        heading: 'Dissolução e liquidação',
        text: `1. A Associação dissolve-se por deliberação da Assembleia Geral, tomada nos termos destes estatutos, e nos demais casos previstos na lei.\n2. Dissolvida a Associação, a Assembleia Geral nomeia uma comissão liquidatária. Os bens remanescentes, depois de pagas as dívidas, são entregues a ${semPonto(v.destinoBens) || BLANK}, não podendo ser distribuídos pelos membros.`,
        en: 'Dissolution and liquidation; remaining assets go to a similar non-profit body.',
      },
      {
        id: 'omissos',
        heading: 'Casos omissos',
        text: 'Os casos omissos são resolvidos pela Assembleia Geral, de acordo com a legislação aplicável.',
        en: 'Matters not covered are decided by the general meeting under the law.',
      },
      {
        id: 'provisorios',
        heading: 'Órgãos provisórios',
        text: 'Até à realização da primeira Assembleia Geral eleitoral, a Associação é dirigida pela Comissão Instaladora eleita na assembleia constituinte, à qual compete promover o reconhecimento, a publicação e o registo da Associação.',
        en: 'An interim committee runs the association until the first elections.',
      },
      {
        id: 'vigor',
        heading: 'Entrada em vigor',
        text: 'Os presentes estatutos entram em vigor na data do reconhecimento da Associação.',
        en: 'These statutes enter into force on recognition.',
      },
    ];

    let n = 0;
    const chapter = (title: string, items: ClauseItem[]): Block[] => {
      const start = n + 1;
      n += items.length;
      return [cap(title), { type: 'numberedClauses', style: 'artigo', items, start }];
    };

    const blocks: Block[] = [
      { type: 'title', text: `Estatutos ${deNomeSimples(nome)}`, subtitle: sigla ? `(${sigla})` : undefined },
      ...chapter('CAPÍTULO I — Da denominação, natureza, sede, duração e objectivos', c1),
      ...chapter('CAPÍTULO II — Dos membros', c2),
      ...chapter('CAPÍTULO III — Dos órgãos sociais', c3),
      ...chapter('CAPÍTULO IV — Do património e das receitas', c4),
      ...chapter('CAPÍTULO V — Da dissolução e disposições finais', c5),
    ];
    if (str(v.dataAprovacao)) {
      blocks.push({
        type: 'paragraph',
        id: 'aprovacao',
        text: `Aprovados em Assembleia Constituinte realizada em ${dateLong(v.dataAprovacao)}.`,
        en: 'Approved at the founding meeting.',
        align: 'center',
      });
    }
    return blocks;
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const L = ctx.legal;
    const min = L.value<number>('assocRequisitos');
    const prazo = L.value<{ despacho: number; recurso: number }>('assocReconhecimentoPrazo');
    if (!str(v.nome)) w.push({ level: 'warning', field: 'nome', message: l('Indique o nome da associação.', 'Enter the name of the association.') });
    if (PALAVRAS_PROIBIDAS.test(`${v.nome ?? ''} ${v.objectivoGeral ?? ''}`)) {
      w.push({
        level: 'error',
        field: 'objectivoGeral',
        message: l(
          'Partidos políticos, sindicatos, cooperativas e confissões religiosas têm leis próprias e não se constituem com estes estatutos.',
          'Political parties, trade unions, cooperatives and religious bodies have their own laws and are not formed with these statutes.',
        ),
      });
    }
    const cargos = lineItems(v.direccao).filter((r) => str(r.cargo));
    if (cargos.length && cargos.length % 2 === 0)
      w.push({ level: 'warning', field: 'direccao', message: l(`A Direcção deve ter um número ímpar de membros (${cite('assocOrgaos')}).`, 'The board must have an odd number of members.') });
    const cf = num(v.conselhoFiscal);
    if (cf != null && cf % 2 === 0)
      w.push({ level: 'warning', field: 'conselhoFiscal', message: l(`O Conselho Fiscal deve ter um número ímpar de membros (${cite('assocOrgaos')}).`, 'The audit council must have an odd number of members.') });
    w.push({
      level: 'info',
      message: l(
        `São necessários pelo menos ${min} fundadores, estatutos conformes à lei e a prova dos meios de funcionamento (${cite('assocRequisitos')}). O reconhecimento compete ao Ministro da Justiça, Assuntos Constitucionais e Religiosos ou, se a actividade se limitar a uma província, ao órgão do Estado na província (${cite('assocReconhecimento')}). O despacho deve ser proferido em ${prazo.despacho} dias e é publicado no Boletim da República com os estatutos; depois, registe a associação na Conservatória do Registo das Entidades Legais (${cite('assocRegisto')}) e declare os beneficiários efectivos.`,
        `At least ${min} founders, lawful statutes and proof of means are required. The Minister of Justice (or the provincial authority) decides within ${prazo.despacho} days; the decision and statutes are published in the official gazette; then register with the Legal Entities Registry and declare beneficial owners.`,
      ),
    });
    w.push({
      level: 'info',
      message: l(
        `Se os fundadores entrarem com bens imóveis, o acto de constituição e os estatutos têm de ser feitos por escritura pública (${cite('assocForma')}).`,
        'If founders contribute real property, the founding act and statutes require a notarial deed.',
      ),
    });
    return w;
  },
  personName: (v) => str(v.sigla) || str(v.nome) || undefined,
  documentDate: (v) => str(v.dataAprovacao) || undefined,
});
