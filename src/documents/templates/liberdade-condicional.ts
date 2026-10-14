// Requerimento de liberdade condicional: a prisoner (or the lawyer) asks the
// judge responsible for the execution of the sentence for release on parole,
// once the portion of the sentence fixed by law has been served.

import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateField, dateLong, l, lawyerSignature, localField, placeDate } from './_shared';
import { FECHO_OPTIONS, artigos, courtAddressee, courtFields, deArtigo, documentosList, juntaText, linePara } from './_advocacia';
import { optionalLawyerFields, str, viaMandatario, keepTail } from './_processo-penal';

const F = (v: Values) => v.reclusoGenero === 'F';
const g = (v: Values, m: string, f: string) => (F(v) ? f : m);

const FRACCAO_OPTIONS = [
  { value: 'metade', label: l('Metade da pena', 'Half of the sentence') },
  { value: 'dois terços', label: l('Dois terços da pena', 'Two thirds') },
  { value: 'três quartos', label: l('Três quartos da pena', 'Three quarters') },
];

export default defineTemplate({
  id: 'liberdade-condicional',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal', 'Court') },
    { id: 'recluso', title: l('Recluso', 'Prisoner'), personRole: 'cliente' },
    { id: 'pena', title: l('Condenação e cumprimento', 'Sentence and time served') },
    { id: 'fundamentos', title: l('Fundamentos', 'Grounds') },
    { id: 'advogado', title: l('Advogado (opcional)', 'Lawyer (optional)') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    {
      name: 'processoNumero',
      type: 'text',
      section: 'tribunal',
      width: 'half',
      label: l('Processo de execução n.º (se houver)', 'Enforcement case no. (if any)'),
    },
    ...courtFields('tribunal').map((f) =>
      f.name === 'tribunal'
        ? {
            ...f,
            help: l(
              'Dirija ao tribunal competente para a execução das penas da área do estabelecimento prisional (ou ao tribunal da condenação, onde aquele não esteja instalado). Confirme na secretaria.',
              'Address the court responsible for the execution of sentences in the prison’s area (or the sentencing court). Check with the court office.',
            ),
          }
        : f,
    ),
    { name: 'reclusoNome', type: 'text', section: 'recluso', required: true, label: l('Nome do recluso', 'Prisoner’s name'), personKey: 'nome' },
    { name: 'reclusoGenero', type: 'radio', section: 'recluso', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'reclusoNumero', type: 'text', section: 'recluso', width: 'half', label: l('Número de recluso (opcional)', 'Prisoner number (optional)') },
    { name: 'estabelecimento', type: 'text', section: 'recluso', label: l('Estabelecimento penitenciário', 'Prison'), placeholder: l('Ex.: Estabelecimento Penitenciário Provincial de Maputo', 'E.g. Maputo Provincial Prison') },
    { name: 'processoCondenacao', type: 'text', section: 'pena', width: 'half', label: l('Processo da condenação n.º', 'Sentencing case no.') },
    { name: 'tribunalCondenacao', type: 'text', section: 'pena', width: 'half', label: l('Tribunal que condenou', 'Sentencing court'), placeholder: l('Ex.: 5.ª Secção Criminal do Tribunal Judicial da Cidade de Maputo', 'E.g. 5th Criminal Section') },
    { name: 'crimeNome', type: 'text', section: 'pena', width: 'half', label: l('Crime', 'Offence') },
    { name: 'penaTexto', type: 'text', section: 'pena', width: 'half', required: true, label: l('Pena aplicada', 'Sentence'), placeholder: l('Ex.: oito anos de prisão', 'E.g. eight years’ imprisonment') },
    { name: 'dataInicio', type: 'date', section: 'pena', width: 'half', label: l('Início do cumprimento (incl. prisão preventiva)', 'Start of the sentence (incl. pre-trial detention)') },
    { name: 'fraccao', type: 'select', section: 'pena', width: 'half', label: l('Parte da pena já cumprida', 'Portion served'), options: FRACCAO_OPTIONS, default: 'metade', help: l('Indique a fracção que a lei exige para o seu caso (confirme com o advogado ou o estabelecimento).', 'Choose the fraction the law requires in your case.') },
    { name: 'dataFraccao', type: 'date', section: 'pena', width: 'half', label: l('Data em que a atingiu', 'Date reached') },
    { name: 'comportamento', type: 'toggle', section: 'fundamentos', default: true, label: l('Bom comportamento prisional', 'Good conduct in prison') },
    { name: 'actividades', type: 'text', section: 'fundamentos', label: l('Trabalho, estudo ou formação na prisão (opcional)', 'Work, study or training in prison (optional)'), placeholder: l('Ex.: trabalha na carpintaria do estabelecimento e concluiu a 10.ª classe', 'E.g. works in the carpentry shop and completed grade 10') },
    { name: 'residencia', type: 'text', section: 'fundamentos', label: l('Onde vai viver', 'Where he or she will live'), placeholder: l('Ex.: com a mãe, no Bairro de Laulane, quarteirão 30, casa 12, Maputo', 'E.g. with the mother in Laulane') },
    { name: 'trabalhoFuturo', type: 'text', section: 'fundamentos', label: l('Trabalho garantido à saída (opcional)', 'Job on release (optional)'), placeholder: l('Ex.: oferta de emprego da Carpintaria Muianga, Lda', 'E.g. job offer') },
    { name: 'outrosFundamentos', type: 'textarea', section: 'fundamentos', rows: 3, label: l('Outros fundamentos (um artigo por linha)', 'Other grounds (one article per line)'), placeholder: l('Reparou o dano causado à vítima.', 'Compensated the victim.') },
    { name: 'documentos', type: 'textarea', section: 'fundamentos', rows: 3, label: l('Documentos juntos (um por linha)', 'Documents attached (one per line)'), placeholder: l('Declaração de residência do bairro\nOferta de emprego\nCertificado de formação', 'Residence declaration\nJob offer\nTraining certificate') },
    ...optionalLawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
    { name: 'fecho', type: 'select', section: 'documento', width: 'half', label: l('Fecho', 'Closing formula'), options: FECHO_OPTIONS, default: 'Pede deferimento.' },
  ],

  warnings: () => {
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `A liberdade condicional depende de ter cumprido a parte da pena que a lei fixa para o crime em causa e de o recluso mostrar capacidade e vontade de se adaptar à vida em liberdade; o conselho técnico do estabelecimento dá parecer e o juiz decide (${cite('ppLiberdadeCondicional')}). A fracção exigida mudou com o Código Penal de 2019 para alguns crimes: aplica-se a lei mais favorável. Confirme.`,
          'Parole requires serving the portion fixed by law and showing ability to adapt to life in freedom; the prison’s technical council gives an opinion and the judge decides. The most favourable law applies. Confirm the fraction.',
        ),
      },
      { level: 'info', field: 'documentos', message: l('Junte prova da residência, do apoio familiar e, se possível, de uma oferta de emprego.', 'Attach proof of residence, family support and, if possible, a job offer.') },
    ];
    return w;
  },

  personName: (v) => v.reclusoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const OR = g(v, 'O requerente', 'A requerente');
    const nome = `**${(str(v.reclusoNome) || '____________________').toLocaleUpperCase('pt')}**`;
    const numero = str(v.reclusoNumero);
    const estab = str(v.estabelecimento);
    const crime = str(v.crimeNome);
    const pena = [
      `${OR} foi ${g(v, 'condenado', 'condenada')}${str(v.processoCondenacao) ? ` no processo n.º ${str(v.processoCondenacao)}` : ''}${str(v.tribunalCondenacao) ? `, ${deArtigo(str(v.tribunalCondenacao))}` : ''}, na pena de ${str(v.penaTexto) || '____________________'}${crime ? `, pela prática de crime de ${crime}` : ''}, por decisão transitada em julgado.`,
      `Encontra-se ${g(v, 'privado', 'privada')} da liberdade desde ${dateLong(v.dataInicio)}, tendo atingido ${v.dataFraccao ? `em ${dateLong(v.dataFraccao)}` : 'já'} ${v.fraccao || 'metade'} da pena aplicada.`,
    ];
    const fund = [
      ...(v.comportamento ? [`Durante a reclusão, ${OR.toLowerCase()} tem mantido bom comportamento, sem qualquer infracção disciplinar.`] : []),
      ...(str(v.actividades) ? [`${OR} ${str(v.actividades).replace(/[.;]$/, '')}.`] : []),
      ...(str(v.residencia) ? [`Em liberdade, ${OR.toLowerCase()} irá residir ${str(v.residencia).replace(/[.;]$/, '')}, contando com o apoio da família.`] : []),
      ...(str(v.trabalhoFuturo) ? [`Tem trabalho assegurado à saída: ${str(v.trabalhoFuturo).replace(/[.;]$/, '')}.`] : []),
      ...artigos(v.outrosFundamentos),
      `Revela, assim, capacidade e vontade séria de se readaptar à vida em liberdade e de conduzir a sua vida de modo socialmente responsável, sem cometer crimes.`,
    ];
    const docs = documentosList(v.documentos);
    const blocks: Block[] = [
      { type: 'courtHeader', processo: str(v.processoNumero) || undefined, extra: str(v.seccao) || undefined, addressee: courtAddressee(v) },
      {
        type: 'paragraph',
        id: 'recluso',
        text: `${nome}, ${g(v, 'recluso', 'reclusa')}${numero ? ` n.º ${numero}` : ''}${estab ? ` no ${estab.replace(/^o\s/i, '')}` : ''}, vem${viaMandatario(v)} requerer a concessão de`,
        en: 'The prisoner requests',
      },
      { type: 'paragraph', id: 'titulo', align: 'center', text: '**LIBERDADE CONDICIONAL**,', en: 'RELEASE ON PAROLE,' },
      { type: 'paragraph', id: 'fundamentos', text: 'nos termos e com os fundamentos seguintes:', en: 'on the following grounds:' },
      {
        type: 'articulado',
        sections: [
          { heading: 'I — Da pena', items: pena },
          { heading: 'II — Dos pressupostos', items: fund },
        ],
      },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Nestes termos, requer a V. Ex.ª se digne, obtido o parecer do conselho técnico do estabelecimento e realizadas as demais diligências legais, conceder ${g(v, 'ao requerente', 'à requerente')} a liberdade condicional, sujeita às condições que V. Ex.ª entenda fixar (${cite('ppLiberdadeCondicional')}).`,
        en: 'The prisoner asks the judge to grant parole on the conditions the judge sets.',
      },
    ];
    if (docs.length) blocks.push(linePara('junta', 'Junta', `${juntaText({ procuracao: Boolean(v.viaAdvogado), documentos: docs.length, duplicados: false })}.`, 'Attached documents.', true));
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: String(v.fecho || 'Pede deferimento.'), en: 'Closing formula.', keepWithNext: true },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [v.viaAdvogado ? lawyerSignature(v) : { role: g(v, 'O Requerente', 'A Requerente'), name: str(v.reclusoNome) || undefined }],
      },
    );
    if (docs.length) blocks.push({ type: 'annexList', title: 'Documentos juntos', items: docs });
    return keepTail(blocks, 'pedido');
  },
});
