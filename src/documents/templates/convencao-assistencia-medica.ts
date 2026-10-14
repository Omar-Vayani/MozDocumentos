// Convenção de assistência médica e medicamentosa: a clinic (or pharmacy)
// treats a company's workers, and optionally their dependants, on credit, on
// presentation of the company's credencial, at the agreed price list, and
// invoices the company monthly. Occupational medicine has its own contract
// (contrato-medicina-trabalho); this one covers general care.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { cite, l, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, int, numerar, papel, partesBlocks, partyFields,
  partyName, partyWarnings, pct, quantos, semPonto, str, testemunhasField, valorTexto,
} from './_contratos';
import { juntar } from './_saude-educacao';

const CUIDADOS = [
  { name: 'cConsultas', pt: 'consultas de clínica geral e de especialidade', en: 'GP and specialist consultations', def: true },
  { name: 'cExames', pt: 'análises clínicas e exames complementares', en: 'laboratory and imaging tests', def: true },
  { name: 'cMedicamentos', pt: 'medicamentos prescritos, fornecidos pela farmácia da Prestadora', en: 'prescribed medicines from the provider’s pharmacy', def: true },
  { name: 'cUrgencia', pt: 'atendimento de urgência', en: 'emergency care', def: true },
  { name: 'cInternamento', pt: 'internamento e cirurgia', en: 'admission and surgery', def: false },
  { name: 'cEstomatologia', pt: 'estomatologia', en: 'dentistry', def: false },
  { name: 'cMaternidade', pt: 'consultas pré-natais e parto', en: 'antenatal care and delivery', def: false },
];

export default defineTemplate({
  id: 'convencao-assistencia-medica',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'prestadora', title: l('Clínica ou farmácia (prestadora)', 'Clinic or pharmacy (provider)') },
    { id: 'empresa', title: l('Empresa (cliente)', 'Company (client)') },
    { id: 'beneficiarios', title: l('Beneficiários e cuidados', 'Beneficiaries and care') },
    { id: 'precos', title: l('Preços, limites e pagamento', 'Prices, limits and payment') },
    { id: 'duracao', title: l('Duração e outras cláusulas', 'Term and other clauses') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('prestadora', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('empresa', { tipoDefault: 'empresa' }),
    { name: 'numeroTrabalhadores', type: 'number', section: 'beneficiarios', width: 'half', min: 1, label: l('N.º aproximado de trabalhadores', 'Approx. number of workers') },
    { name: 'dependentes', type: 'toggle', section: 'beneficiarios', default: true, label: l('Inclui dependentes (cônjuge e filhos)', 'Includes dependants (spouse and children)') },
    { name: 'idadeFilhos', type: 'number', section: 'beneficiarios', width: 'half', min: 1, max: 30, default: 21, label: l('Filhos até à idade de (anos)', 'Children up to age'), showIf: (v) => Boolean(v.dependentes) },
    ...CUIDADOS.map((c) => ({ name: c.name, type: 'toggle' as const, section: 'beneficiarios', label: l(c.pt.charAt(0).toUpperCase() + c.pt.slice(1), c.en), default: c.def })),
    { name: 'exclusoes', type: 'text', section: 'beneficiarios', label: l('Exclusões', 'Exclusions'), default: 'tratamentos estéticos, óculos e lentes, medicamentos não prescritos e evacuações para o estrangeiro' },
    { name: 'desconto', type: 'number', section: 'precos', width: 'half', min: 0, max: 100, label: l('Desconto sobre a tabela (%)', 'Discount on price list (%)') },
    { name: 'limite', type: 'money', section: 'precos', width: 'half', label: l('Limite anual por beneficiário (opcional)', 'Annual limit per beneficiary (optional)') },
    { name: 'comparticipacao', type: 'number', section: 'precos', width: 'half', min: 0, max: 100, label: l('Parte paga pelo trabalhador (%) (opcional)', 'Share paid by the worker (%) (optional)') },
    { name: 'prazoPagamento', type: 'number', section: 'precos', width: 'half', min: 1, max: 120, default: 30, label: l('Pagamento das facturas em (dias)', 'Invoices payable within (days)') },
    { name: 'avisoPrecos', type: 'number', section: 'precos', width: 'half', min: 0, max: 180, default: 30, label: l('Aviso de alteração de preços (dias)', 'Notice of price changes (days)') },
    { name: 'suspensaoAtraso', type: 'toggle', section: 'precos', default: true, label: l('A Prestadora pode suspender o crédito se houver facturas em atraso', 'Provider may suspend credit if invoices are overdue') },
    { name: 'duracaoMeses', type: 'number', section: 'duracao', width: 'half', min: 1, max: 60, default: 12, label: l('Duração (meses)', 'Term (months)') },
    { name: 'renovacao', type: 'toggle', section: 'duracao', default: true, label: l('Renovação automática', 'Automatic renewal') },
    { name: 'avisoDias', type: 'number', section: 'duracao', width: 'half', min: 1, max: 180, default: 60, label: l('Aviso prévio para denúncia (dias)', 'Notice to terminate (days)') },
    foroField('duracao'),
    arbitragemField('duracao'),
    testemunhasField('duracao'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'prestadora', 'prestadora', 'provider'), ...partyWarnings(v, 'empresa', 'empresa', 'company')];
    if (!CUIDADOS.some((c) => v[c.name])) w.push({ level: 'error', field: 'cConsultas', message: l('Escolha os cuidados abrangidos.', 'Choose the care covered.') });
    w.push({
      level: 'info',
      message: l(
        `A empresa recebe apenas os actos e os valores, nunca o diagnóstico (${cite('examesMedicosTrabalho')}; ${cite('dadosPessoaisTrabalhador')}). Para exames de admissão e periódicos use o contrato de medicina no trabalho.`,
        'The company receives only services and amounts, never the diagnosis. For pre-employment and periodic exams use the occupational-medicine contract.',
      ),
    });
    return w;
  },

  personName: (v) => partyName(v, 'empresa') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = { ...papel(v, 'prestadora', 'Prestadora', 'Prestadora', true), f: true, o: 'a Prestadora', O: 'A Prestadora', de: 'da Prestadora', ao: 'à Prestadora', pelo: 'pela Prestadora' };
    const E = { ...papel(v, 'empresa', 'Empresa', 'Empresa', true), f: true, o: 'a Empresa', O: 'A Empresa', de: 'da Empresa', ao: 'à Empresa', pelo: 'pela Empresa' };
    const nt = int(v.numeroTrabalhadores);
    const cuidados = CUIDADOS.filter((c) => v[c.name]).map((c) => c.pt);
    const lim = money(v.limite);
    const desc = int(v.desconto);
    const comp = int(v.comparticipacao);
    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `Pela presente convenção, ${P.o} presta assistência médica e medicamentosa, a crédito, aos trabalhadores ${E.de}${nt ? ` (cerca de ${quantos(nt, 'trabalhador', 'trabalhadores')})` : ''}${v.dependentes ? ' e aos respectivos dependentes' : ''}, adiante designados por beneficiários, nos termos das cláusulas seguintes.`,
        en: 'The provider gives medical and pharmaceutical care on credit to the company’s workers (and dependants), the beneficiaries.',
      },
      {
        id: 'beneficiarios',
        heading: 'Beneficiários',
        text: numerar([
          `${E.O} entrega ${P.ao} a lista nominal dos beneficiários e comunica por escrito, no prazo de cinco dias úteis, as entradas e saídas.`,
          v.dependentes ? `São dependentes o cônjuge ou companheiro em união de facto e os filhos até ${quantos(int(v.idadeFilhos), 'ano', 'anos')} de idade, desde que constem da lista.` : '',
          'O beneficiário identifica-se com o documento de identificação e a credencial emitida pela Empresa para cada episódio de cuidados.',
          'Em caso de urgência, o beneficiário é atendido sem credencial, devendo a Empresa emiti-la no primeiro dia útil seguinte.',
        ]),
        en: 'The company keeps the beneficiary list updated; dependants as defined; access with ID and the company’s authorisation; emergencies without it, regularised the next working day.',
      },
      {
        id: 'cuidados',
        heading: 'Cuidados abrangidos',
        text: numerar([
          `A convenção abrange ${cuidados.length ? juntar(cuidados) : '____________________'}.`,
          str(v.exclusoes) ? `Estão excluídos ${semPonto(v.exclusoes)}.` : '',
          `${P.O} decide, com autonomia técnica, os cuidados clinicamente necessários; os cuidados não abrangidos só são prestados a crédito com autorização prévia e escrita ${E.de}.`,
        ]),
        en: 'Care covered and excluded; clinical decisions are the provider’s; anything else needs the company’s prior written approval.',
      },
      {
        id: 'precos',
        heading: 'Preços e limites',
        text: numerar([
          `Os cuidados são facturados pela tabela de preços constante do Anexo I${desc ? `, com o desconto de ${pct(v.desconto)}` : ''}.`,
          `${P.O} comunica qualquer alteração da tabela com a antecedência mínima de ${quantos(int(v.avisoPrecos), 'dia', 'dias')}.`,
          lim != null ? `O valor dos cuidados prestados a cada beneficiário não pode exceder ${valorTexto(lim)} por ano, salvo autorização escrita ${E.de}.` : '',
          comp ? `O beneficiário paga directamente ${P.ao} ${pct(v.comparticipacao)} do valor de cada acto, sendo o restante facturado ${E.ao}.` : '',
        ]),
        en: 'Prices per the annexed list (with discount); notice of changes; annual limit; co-payment.',
      },
      {
        id: 'facturacao',
        heading: 'Facturação e pagamento',
        text: numerar([
          `${P.O} emite factura mensal em nome ${E.de}, acompanhada das credenciais assinadas pelos beneficiários, discriminando por beneficiário a data, os actos e os medicamentos, sem indicação de diagnóstico.`,
          `${E.O} paga cada factura no prazo de ${quantos(int(v.prazoPagamento), 'dia', 'dias')} a contar da sua recepção, podendo reclamar por escrito, no mesmo prazo, dos valores que não reconheça.`,
          v.suspensaoAtraso ? `Havendo facturas vencidas e não pagas, ${P.o} pode, após aviso escrito, suspender o atendimento a crédito até à regularização, mantendo o atendimento de urgência.` : '',
        ]),
        en: 'Monthly invoice with signed authorisations, no diagnosis; payment term; disputes in writing; credit may be suspended if overdue, emergencies excepted.',
      },
      {
        id: 'sigilo',
        heading: 'Sigilo médico',
        text: `A informação clínica dos beneficiários é confidencial. ${P.O} não comunica ${E.ao} diagnósticos nem informação clínica, salvo autorização escrita do beneficiário, e ${E.o} não pode pedir essa informação nem usá-la para fins laborais.`,
        en: 'Clinical information is confidential; no diagnosis is disclosed to the company without the beneficiary’s written consent, and the company may not use it for employment purposes.',
      },
      {
        id: 'duracao',
        heading: 'Duração e denúncia',
        text: `A convenção vigora por ${quantos(int(v.duracaoMeses), 'mês', 'meses')} a contar da data da assinatura${v.renovacao ? ', renovando-se automaticamente por iguais períodos' : ''}, podendo qualquer das partes denunciá-la por escrito com a antecedência mínima de ${quantos(int(v.avisoDias), 'dia', 'dias')}. Os cuidados iniciados antes da cessação são pagos nos termos desta convenção.`,
        en: 'Term, renewal and notice; care already started is paid under these terms.',
      },
      ...clausulasFinais(v),
    ];
    return [
      { type: 'title', text: 'Convenção de Assistência Médica e Medicamentosa' },
      ...partesBlocks(v, [
        { p: 'prestadora', role: P, en: 'Provider' },
        { p: 'empresa', role: E, en: 'Company' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'É celebrada a presente convenção de assistência médica e medicamentosa, que se rege pelas cláusulas seguintes:', en: 'This medical-care agreement is made on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      { type: 'annexList', items: ['Anexo I — Tabela de preços', 'Anexo II — Modelo de credencial da Empresa', 'Anexo III — Lista inicial de beneficiários'] },
      ...fecho(ctx, [assinatura(ctx, 'prestadora', P, true), assinatura(ctx, 'empresa', E)]),
    ] as Block[];
  },
});
