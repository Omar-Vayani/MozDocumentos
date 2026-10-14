import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { cite, dateField, dateLong, l, lawyerFields, localField, money } from './_shared';
import { artigos, courtAddressee, partyDesc, partyFields } from './_advocacia';
import { closing, g3, minuscula, lawyerWarnings, parteNome, processoFields, prova, provaFields, str } from './_processo-civil';

const DILIGENCIA_OPTIONS: FieldOption[] = [
  { value: 'penhora', label: l('Penhora', 'Attachment') },
  { value: 'arresto', label: l('Arresto', 'Pre-judgment attachment') },
  { value: 'arrolamento', label: l('Arrolamento', 'Inventory seizure') },
  { value: 'entrega', label: l('Entrega judicial de bens', 'Court-ordered delivery') },
  { value: 'outra', label: l('Outra diligência judicial', 'Other court step') },
];

const DIREITO_OPTIONS: FieldOption[] = [
  { value: 'propriedade', label: l('Proprietário e possuidor', 'Owner and possessor') },
  { value: 'posse', label: l('Possuidor', 'Possessor') },
  { value: 'arrendatario', label: l('Arrendatário', 'Tenant') },
  { value: 'duat', label: l('Titular do DUAT', 'Land-use right holder') },
];

const DIREITO_TEXTO: Record<string, [string, string]> = {
  propriedade: ['legítimo proprietário e possuidor', 'legítima proprietária e possuidora'],
  posse: ['legítimo possuidor', 'legítima possuidora'],
  arrendatario: ['arrendatário', 'arrendatária'],
  duat: ['titular do direito de uso e aproveitamento da terra e possuidor', 'titular do direito de uso e aproveitamento da terra e possuidora'],
};

export default defineTemplate({
  id: 'embargos-de-terceiro',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e processo', 'Court and case') },
    { id: 'embargante', title: l('Embargante (o terceiro)', 'Third party (applicant)'), personRole: 'cliente' },
    { id: 'embargados', title: l('Embargados (partes do processo)', 'Respondents (parties to the case)') },
    { id: 'diligencia', title: l('Diligência e bens', 'Court step and assets') },
    { id: 'prova', title: l('Documentos e testemunhas', 'Documents and witnesses') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...processoFields('tribunal', 'execução para pagamento de quantia certa, com processo ordinário'),
    ...partyFields('embargante', 'embargante', { defaultTipo: 'pessoa' }),
    ...parteNome('exequente', 'embargados', 'Exequente (ou requerente)', 'Creditor (or applicant)', 'empresa'),
    ...parteNome('executado', 'embargados', 'Executado (ou requerido)', 'Debtor (or respondent)', 'pessoa'),
    { name: 'diligencia', type: 'select', section: 'diligencia', width: 'half', label: l('Diligência que ofende o direito', 'Court step complained of'), options: DILIGENCIA_OPTIONS, default: 'penhora' },
    { name: 'preventivos', type: 'toggle', section: 'diligencia', width: 'half', label: l('Embargos preventivos (diligência ainda não feita)', 'Preventive (step not yet carried out)') },
    { name: 'dataDiligencia', type: 'date', section: 'diligencia', width: 'half', label: l('Data da diligência', 'Date of the step'), showIf: (v) => !v.preventivos },
    { name: 'dataConhecimento', type: 'date', section: 'diligencia', width: 'half', label: l('Data em que teve conhecimento', 'Date learned of it'), showIf: (v) => !v.preventivos },
    { name: 'bens', type: 'textarea', section: 'diligencia', rows: 3, required: true, label: l('Bens atingidos', 'Assets affected'), placeholder: l('Ex.: viatura ligeira Toyota Corolla, matrícula ABC 123 MC; frigorífico Samsung', 'E.g. Toyota Corolla, registration ABC 123 MC'), help: l('Um bem por linha, bem identificado.', 'One asset per line.') },
    { name: 'direitoTipo', type: 'select', section: 'diligencia', width: 'half', label: l('O embargante é', 'The applicant is'), options: DIREITO_OPTIONS, default: 'propriedade' },
    { name: 'valorBens', type: 'money', section: 'diligencia', width: 'half', label: l('Valor dos bens', 'Value of the assets'), legal: l('O valor dos embargos é o dos bens.', 'The value is that of the assets.') },
    {
      name: 'factos',
      type: 'textarea',
      section: 'diligencia',
      rows: 6,
      required: true,
      label: l('Factos da posse ou do direito (um artigo por linha)', 'Facts of possession or right (one article per line)'),
      help: l('Como e quando adquiriu os bens, desde quando os usa, à vista de todos, e porque nada tem a ver com a dívida.', 'How and when you acquired the assets, how you use them openly, and why the debt is not yours.'),
    },
    ...provaFields('prova'),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: 'info',
        field: 'dataConhecimento',
        message: l(
          `Os embargos de terceiro são deduzidos no prazo legal a contar da diligência ou do seu conhecimento, e nunca depois de vendidos ou adjudicados os bens (${cite('pcEmbargosTerceiro')}). Confirme o prazo.`,
          'Third-party opposition is filed within the legal period from the step or from learning of it, and never after the assets are sold. Confirm the period.',
        ),
      },
    ];
    if (money(v.valorBens) == null) w.push({ level: 'warning', field: 'valorBens', message: l('Indique o valor dos bens (valor da causa).', 'Enter the value of the assets.') });
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.embarganteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const E = g3(v, 'embargante');
    const Q = g3(v, 'exequente');
    const X = g3(v, 'executado');
    const dil = String(v.diligencia ?? 'penhora');
    const dilNome: Record<string, string> = { penhora: 'penhora', arresto: 'arresto', arrolamento: 'arrolamento', entrega: 'entrega judicial', outra: 'diligência' };
    const nomeDil = dilNome[dil] ?? 'diligência';
    const bens = str(v.bens).split('\n').map((s) => s.trim().replace(/[.;]+$/, '')).filter(Boolean).map(minuscula);
    const exNome = `**${(str(v.exequenteNome) || '____________').toLocaleUpperCase('pt')}**`;
    const xNome = `**${(str(v.executadoNome) || '____________').toLocaleUpperCase('pt')}**`;
    const tipo = str(v.tipoAccao) || '____________________';

    const items: string[] = [
      v.preventivos
        ? `Nos autos à margem referenciados foi ordenada, ou está iminente, a ${nomeDil} dos bens adiante identificados.`
        : `Nos autos à margem referenciados, em ${dateLong(v.dataDiligencia)}, foi realizada a ${nomeDil} dos seguintes bens: ${bens.join('; ') || '____________________'}.`,
      ...(v.dataConhecimento && !v.preventivos ? [`${E.O} Embargante só teve conhecimento da ${nomeDil} em ${dateLong(v.dataConhecimento)}.`] : []),
      `${E.O} Embargante não é parte na causa, nem é responsável pela obrigação nela discutida.`,
      `${E.O} Embargante é ${(DIREITO_TEXTO[v.direitoTipo as string] ?? DIREITO_TEXTO.propriedade)[E.f ? 1 : 0]} dos referidos bens, como se demonstra.`,
      ...artigos(v.factos),
      `A ${nomeDil} ofende, assim, a posse e o direito ${E.do} Embargante, que é incompatível com a realização ou o âmbito da diligência.`,
    ];
    const pedidos = [
      `Serem os presentes embargos recebidos, ordenando-se a suspensão dos termos do processo quanto aos bens embargados${v.preventivos ? ' e a não realização da diligência' : ' e a restituição provisória da posse ' + E.ao + ' Embargante'}`,
      `Serem ${Q.o} ${Q.w('Embargado', 'Embargada')} e ${X.o} ${X.w('Embargado', 'Embargada')} notificados para, querendo, contestar`,
      `A final, serem os embargos julgados procedentes, por provados, reconhecendo-se o direito ${E.do} Embargante sobre os bens e ordenando-se o levantamento da ${nomeDil}`,
      'Serem os Embargados condenados nas custas e procuradoria condigna',
    ];
    const pv = prova(v);
    const blocks: Block[] = [
      { type: 'courtHeader', processo: `${str(v.processoNumero) || '________/______'} (por apenso)`, extra: str(v.seccao) || undefined, addressee: courtAddressee(v) },
      { type: 'paragraph', id: 'embargante', text: `${partyDesc(v, 'embargante')}, adiante ${E.w('designado', 'designada')} por **Embargante**,`, en: 'Identification of the third party.' },
      {
        type: 'paragraph',
        id: 'vem',
        text: `vem, por intermédio do seu mandatário judicial, nos autos de ${tipo} em que é Exequente ${exNome} e ${X.w('Executado', 'Executada')} ${xNome}, deduzir contra ambos, adiante designados por **Embargados**,`,
        en: 'through its lawyer, in the case between the creditor and the debtor, files against both',
      },
      { type: 'paragraph', id: 'titulo', align: 'center', text: `**EMBARGOS DE TERCEIRO${v.preventivos ? ', COM FUNÇÃO PREVENTIVA' : ''}**,`, en: 'THIRD-PARTY OPPOSITION' },
      { type: 'paragraph', id: 'fundamentos', text: 'o que faz nos termos e com os fundamentos seguintes:', en: 'on the following terms and grounds:' },
      { type: 'articulado', sections: [{ items }] },
      ...closing(ctx, {
        intro: 'Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, requer:',
        introEn: 'On these grounds, the applicant requests:',
        pedidos,
        valor: money(v.valorBens),
        docs: pv.docs,
        procuracao: pv.procuracao,
        testemunhas: pv.testemunhas,
      }),
    ];
    return blocks;
  },
});
