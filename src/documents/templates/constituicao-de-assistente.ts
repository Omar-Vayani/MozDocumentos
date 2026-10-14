// Requerimento de constituição de assistente: the offended party (or whoever
// the law allows) asks to join a criminal case as assistant prosecutor,
// through a lawyer. Filed with the Ministério Público during the instrução or
// with the judge afterwards.

import { defineTemplate, type Block, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateField, dateLong, l, lawyerFields, lawyerSignature, localField, placeDate } from './_shared';
import { FECHO_OPTIONS, juntaText, linePara, papel, partyDesc, partyFields } from './_advocacia';
import { faseValue, nosAutos, penalAddressee, penalCaseFields, str, keepTail } from './_processo-penal';

const QUALIDADE_OPTIONS = [
  { value: 'ofendido', label: l('Ofendido (a vítima)', 'Offended party (victim)') },
  { value: 'representante', label: l('Representante legal do ofendido menor ou incapaz', 'Legal representative of a minor or incapacitated victim') },
  { value: 'familiar', label: l('Cônjuge, filho ou familiar do ofendido falecido', 'Spouse, child or relative of a deceased victim') },
  { value: 'outro', label: l('Outra (escrever)', 'Other (write it)') },
];

export default defineTemplate({
  id: 'constituicao-de-assistente',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'processo', title: l('Processo', 'Case') },
    { id: 'requerente', title: l('Quem pede (futuro assistente)', 'Applicant'), personRole: 'cliente' },
    { id: 'fundamentos', title: l('Fundamentos', 'Grounds') },
    { id: 'advogado', title: l('Advogado (obrigatório)', 'Lawyer (required)') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...penalCaseFields('processo'),
    ...partyFields('requerente', 'requerente'),
    { name: 'qualidade', type: 'select', section: 'fundamentos', label: l('Qualidade do requerente', 'Applicant’s standing'), options: QUALIDADE_OPTIONS, default: 'ofendido' },
    { name: 'ofendidoNome', type: 'text', section: 'fundamentos', width: 'half', label: l('Nome do ofendido', 'Name of the victim'), showIf: (v) => v.qualidade === 'representante' || v.qualidade === 'familiar' },
    { name: 'relacao', type: 'text', section: 'fundamentos', width: 'half', label: l('Relação com o ofendido', 'Relationship to the victim'), placeholder: l('Ex.: mãe e representante legal; viúva', 'E.g. mother; widow'), showIf: (v) => v.qualidade === 'representante' || v.qualidade === 'familiar' },
    { name: 'qualidadeLivre', type: 'text', section: 'fundamentos', label: l('Fundamento da legitimidade', 'Basis of standing'), showIf: (v) => v.qualidade === 'outro' },
    { name: 'arguidoNome', type: 'text', section: 'fundamentos', width: 'half', label: l('Arguido ou denunciado (opcional)', 'Accused (optional)') },
    { name: 'arguidoGenero', type: 'radio', section: 'fundamentos', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', showIf: (v) => Boolean(str(v.arguidoNome)) },
    { name: 'crimeNome', type: 'text', section: 'fundamentos', width: 'half', label: l('Crime em causa', 'Offence'), placeholder: l('Ex.: burla; ofensas corporais', 'E.g. fraud; assault') },
    {
      name: 'origem',
      type: 'select',
      section: 'fundamentos',
      width: 'half',
      label: l('Como começou o processo', 'How the case started'),
      default: 'queixa',
      options: [
        { value: 'queixa', label: l('Queixa do requerente', 'Applicant’s complaint') },
        { value: 'participacao', label: l('Participação de terceiro', 'Third-party report') },
        { value: 'oficio', label: l('Por iniciativa das autoridades', 'Authorities’ own initiative') },
      ],
    },
    { name: 'dataQueixa', type: 'date', section: 'fundamentos', width: 'half', label: l('Data da queixa (opcional)', 'Date of the complaint (optional)'), showIf: (v) => v.origem === 'queixa' },
    {
      name: 'taxa',
      type: 'radio',
      section: 'fundamentos',
      label: l('Taxa de justiça', 'Court fee'),
      default: 'junta',
      options: [
        { value: 'junta', label: l('Junto o comprovativo de pagamento', 'Proof of payment attached') },
        { value: 'guia', label: l('Peço a guia para pagar', 'Request the payment slip') },
      ],
    },
    { name: 'indemnizacao', type: 'toggle', section: 'fundamentos', default: true, label: l('Declarar que vai pedir indemnização civil', 'State the intention to claim damages') },
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
    { name: 'fecho', type: 'select', section: 'documento', width: 'half', label: l('Fecho', 'Closing formula'), options: FECHO_OPTIONS, default: 'Pede deferimento.' },
  ],

  warnings: (v, ctx) => {
    const a = ctx.legal.value<{ diasAntesJulgamento: number }>('ppAssistente');
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `O assistente é sempre representado por advogado e pode intervir em qualquer fase, aceitando o processo no estado em que se encontrar, desde que o requeira até ${a.diasAntesJulgamento} dias antes do início da audiência de julgamento (${cite('ppAssistente')}; confirme).`,
          `The assistant prosecutor is always represented by a lawyer and may join at any stage if the application is made up to ${a.diasAntesJulgamento} days before the trial starts.`,
        ),
      },
      { level: 'info', field: 'taxa', message: l('A constituição de assistente está sujeita a taxa de justiça, calculada pela secretaria.', 'Joining as assistant prosecutor is subject to a court fee calculated by the court office.') },
    ];
    if (!str(v.advogadoCarteira)) w.push({ level: 'warning', field: 'advogadoCarteira', message: l('Indique o advogado: o assistente tem de ser representado por advogado.', 'Enter the lawyer: the assistant must be represented by a lawyer.') });
    return w;
  },

  personName: (v) => v.requerenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fase = faseValue(v);
    const oReq = papel(v, 'requerente', 'o requerente', 'a requerente');
    const OReq = papel(v, 'requerente', 'O requerente', 'A requerente');
    const arguido = str(v.arguidoNome);
    const crime = str(v.crimeNome);
    const ofendido = str(v.ofendidoNome) || '____________________';
    const relacao = str(v.relacao);
    const legitimidade: Record<string, string> = {
      ofendido: `${OReq} é ${papel(v, 'requerente', 'o ofendido', 'a ofendida')}, titular dos interesses que a lei quis especialmente proteger com a incriminação.`,
      representante: `${OReq} é ${relacao || 'representante legal'} de **${ofendido.toLocaleUpperCase('pt')}**, pessoa ofendida nos autos que, por ser menor ou incapaz, não pode exercer por si os seus direitos.`,
      familiar: `${OReq} é ${relacao || 'familiar'} de **${ofendido.toLocaleUpperCase('pt')}**, pessoa ofendida nos autos, entretanto falecida.`,
      outro: `${str(v.qualidadeLivre) || '____________________'}.`.replace(/\.\.$/, '.'),
    };
    const origem: Record<string, string> = {
      queixa: `na sequência de queixa apresentada ${papel(v, 'requerente', 'pelo requerente', 'pela requerente')}${v.dataQueixa ? ` em ${dateLong(v.dataQueixa)}` : ''}`,
      participacao: 'na sequência de participação',
      oficio: 'por iniciativa das autoridades',
    };
    const onde = fase === 'mp' ? 'nos serviços do Ministério Público' : 'nesse Tribunal';
    const items = [
      `Corre termos ${onde} o processo à margem referenciado, instaurado ${origem[v.origem] ?? origem.queixa}${crime ? `, pela prática de crime de ${crime}` : ''}${arguido ? `, em que é ${isArgF(v) ? 'arguida' : 'arguido'} **${arguido.toLocaleUpperCase('pt')}**` : ''}.`,
      legitimidade[v.qualidade] ?? legitimidade.ofendido,
      `Tem, por isso, legitimidade para se constituir assistente nos presentes autos, nos termos do ${cite('ppAssistente')}.`,
      `${OReq} encontra-se ${papel(v, 'requerente', 'representado', 'representada')} por advogado, conforme procuração forense que se junta.`,
      v.taxa === 'guia'
        ? `${OReq} requer a emissão da guia para pagamento da taxa de justiça devida, que pagará no prazo que lhe for fixado.`
        : `${OReq} procedeu ao pagamento da taxa de justiça devida, conforme comprovativo que se junta.`,
      ...(v.indemnizacao ? [`${OReq} declara, desde já, que pretende deduzir pedido de indemnização civil pelos danos sofridos, no momento e nos termos legais.`] : []),
    ];

    const blocks: Block[] = [
      { type: 'courtHeader', processo: str(v.processoNumero) || '________/______', extra: fase !== 'mp' ? str(v.seccao) || undefined : undefined, addressee: penalAddressee(v, fase) },
      {
        type: 'paragraph',
        id: 'requerente',
        text: `${partyDesc(v, 'requerente', { docBlank: true })}, ${nosAutos(v)}, vem, por intermédio do seu mandatário, requerer a V. Ex.ª a sua admissão a intervir nos autos como`,
        en: 'The applicant, through counsel, asks to be admitted to the case as',
      },
      { type: 'paragraph', id: 'titulo', align: 'center', text: '**ASSISTENTE**,', en: 'ASSISTANT PROSECUTOR,' },
      { type: 'paragraph', id: 'fundamentos', text: 'o que faz nos termos e com os fundamentos seguintes:', en: 'on the following grounds:' },
      { type: 'articulado', sections: [{ items }] },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Nestes termos, requer a V. Ex.ª se digne admitir ${oReq} a intervir nos autos na qualidade de assistente, ordenando-se que seja ${papel(v, 'requerente', 'notificado', 'notificada')}, na pessoa do seu mandatário, de todos os actos processuais.`,
        en: 'The applicant asks to be admitted as assistant prosecutor and to be notified of all steps through counsel.',
      },
      linePara('junta', 'Junta', `${juntaText({ procuracao: true, documentos: 0, outros: v.taxa === 'guia' ? [] : ['comprovativo do pagamento da taxa de justiça'], duplicados: false })}.`, 'Attached: power of attorney and proof of fee payment.'),
      { type: 'paragraph', id: 'fecho', text: String(v.fecho || 'Pede deferimento.'), en: 'Closing formula.', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [lawyerSignature(v)] },
    ];
    return keepTail(blocks, 'pedido');
  },
});

function isArgF(v: Record<string, unknown>): boolean {
  return v.arguidoGenero === 'F';
}
