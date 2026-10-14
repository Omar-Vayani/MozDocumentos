import { defineTemplate, type Block, type FieldOption, type Values } from '../model';
import { cite, dateField, l, lawyerFields, localField } from './_shared';
import { artigos, courtAddressee, courtFields, partyDesc, partyFields } from './_advocacia';
import { closing, g3, lawyerWarnings, prova, provaFields, sem, str } from './_processo-civil';

const FIM_OPTIONS: FieldOption[] = [
  { value: 'interpelacao', label: l('Interpelação para pagamento ou cumprimento', 'Demand for payment or performance') },
  { value: 'denuncia', label: l('Denúncia ou oposição à renovação de contrato', 'Notice of termination or non-renewal') },
  { value: 'resolucao', label: l('Resolução de contrato', 'Termination for breach') },
  { value: 'preferencia', label: l('Comunicação para exercício de preferência', 'Notice to exercise pre-emption') },
  { value: 'outro', label: l('Outra declaração (escrever)', 'Other statement (write it)') },
];

const FIM_INTRO: Record<string, string> = {
  interpelacao: 'para, no prazo indicado, cumprir a obrigação adiante descrita, sob pena de se considerar definitivamente incumprida e de o Requerente recorrer aos meios judiciais',
  denuncia: 'de que o Requerente denuncia o contrato adiante identificado, que cessará na data indicada',
  resolucao: 'de que o Requerente resolve, com fundamento no incumprimento adiante descrito, o contrato identificado',
  preferencia: 'do projecto de venda e das suas cláusulas, para, querendo, exercer o direito de preferência no prazo legal',
  outro: 'da declaração adiante transcrita',
};

const fimOf = (v: Values) => (String(v.fim ?? 'interpelacao') in FIM_INTRO ? String(v.fim ?? 'interpelacao') : 'interpelacao');

export default defineTemplate({
  id: 'notificacao-judicial-avulsa',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal', 'Court') },
    { id: 'requerente', title: l('Requerente', 'Applicant'), personRole: 'cliente' },
    { id: 'notificando', title: l('A notificar', 'Person to be notified'), personRole: 'outro' },
    { id: 'declaracao', title: l('O que se comunica', 'What is communicated') },
    { id: 'prova', title: l('Documentos', 'Documents') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...courtFields('tribunal').map((f) => (f.name === 'tribunal' ? { ...f, help: l('Tribunal da área da residência ou sede da pessoa a notificar.', 'Court of the area where the person to be notified lives.') } : f)),
    ...partyFields('requerente', 'requerente', { defaultTipo: 'empresa' }),
    ...partyFields('notificando', 'notificando', { defaultTipo: 'pessoa', light: true }),
    { name: 'fim', type: 'select', section: 'declaracao', required: true, label: l('Finalidade', 'Purpose'), options: FIM_OPTIONS, default: 'interpelacao' },
    {
      name: 'factos',
      type: 'textarea',
      section: 'declaracao',
      rows: 7,
      required: true,
      label: l('Factos e declaração (um artigo por linha)', 'Facts and statement (one article per line)'),
      help: l('Identifique o contrato ou a obrigação, o incumprimento, os valores e o prazo concedido. É isto que o notificando vai receber.', 'Identify the contract or obligation, the breach, amounts and the deadline given.'),
    },
    { name: 'prazoConcedido', type: 'text', section: 'declaracao', width: 'half', label: l('Prazo concedido (opcional)', 'Deadline given (optional)'), placeholder: l('Ex.: quinze dias a contar da notificação', 'E.g. fifteen days from notice'), showIf: (v) => fimOf(v) === 'interpelacao' },
    { name: 'pessoal', type: 'toggle', section: 'declaracao', default: true, label: l('Notificação na pessoa do notificando, com entrega de duplicado', 'Personal service with a copy') },
    ...provaFields('prova', { testemunhas: false }),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => [
    { level: 'info', message: l(`${cite('pcNotificacaoAvulsa')}: a notificação avulsa não admite oposição e serve de prova da comunicação. Entregue duplicados para o notificando.`, 'The notice admits no opposition and proves the communication. File copies for the recipient.') },
    ...lawyerWarnings(v),
  ],

  personName: (v) => v.notificandoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const N = g3(v, 'notificando');
    const fim = fimOf(v);
    const factos = artigos(v.factos);
    if (fim === 'interpelacao' && str(v.prazoConcedido)) factos.push(`Para o efeito, é concedido ${N.ao} ${N.w('Notificando', 'Notificanda')} o prazo de ${sem(v.prazoConcedido)}.`);
    const pv = prova(v);
    const blocks: Block[] = [
      { type: 'courtHeader', addressee: courtAddressee(v) },
      { type: 'paragraph', id: 'requerente', text: `${partyDesc(v, 'requerente')}, adiante ${g3(v, 'requerente').w('designado', 'designada')} por **Requerente**,`, en: 'Identification of the applicant.' },
      { type: 'paragraph', id: 'vem', text: 'vem, por intermédio do seu mandatário judicial, requerer a', en: 'through its lawyer, applies for the' },
      { type: 'paragraph', id: 'titulo', align: 'center', text: '**NOTIFICAÇÃO JUDICIAL AVULSA**', en: 'STAND-ALONE JUDICIAL NOTICE' },
      { type: 'paragraph', id: 'notificando', text: `de ${partyDesc(v, 'notificando')}, adiante ${N.w('designado', 'designada')} por **${N.w('Notificando', 'Notificanda')}**,`, en: 'of the person identified.' },
    ];
    blocks.push(
      { type: 'paragraph', id: 'fundamentos', text: 'nos termos e com os fundamentos seguintes:', en: 'on the following terms and grounds:' },
      { type: 'articulado', sections: [{ items: factos.length ? factos : ['____________________'] }] },
      ...closing(ctx, {
        intro: `Nestes termos, requer a V. Ex.ª se digne ordenar a notificação judicial avulsa ${N.do} ${N.w('Notificando', 'Notificanda')}${v.pessoal ? `, na ${v.notificandoTipo === 'empresa' ? 'pessoa do seu representante legal' : 'sua própria pessoa'}` : ''}, ${FIM_INTRO[fim].replace(/o Requerente/g, `${g3(v, 'requerente').o} Requerente`)}, nos termos expostos, entregando-se-lhe duplicado do presente requerimento e dos documentos juntos e, feita a notificação, sejam os autos entregues ${g3(v, 'requerente').ao} Requerente, independentemente de traslado.`,
        introEn: 'The applicant asks the court to serve the notice and hand over the record afterwards.',
        docs: pv.docs,
        procuracao: pv.procuracao,
      }),
    );
    return blocks;
  },
});
