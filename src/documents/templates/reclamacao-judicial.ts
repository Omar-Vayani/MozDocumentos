import { defineTemplate, type Block, type FieldOption, type Values, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateField, dateLong, isF, l, lawyerFields, localField } from './_shared';
import { artigos, courtAddressee, nomeParte, parteF } from './_advocacia';
import { QUALIDADE_PC, QUALIDADE_PC_OPTIONS, closing, fechoField, lawyerWarnings, parteNome, processoFields, sem, str } from './_processo-civil';

type Tipo = 'naoAdmissao' | 'nulidade' | 'sentenca' | 'conta';

const TIPO_OPTIONS: FieldOption[] = [
  { value: 'naoAdmissao', label: l('Contra o despacho que não admitiu o recurso', 'Against refusal to admit an appeal') },
  { value: 'nulidade', label: l('Arguição de nulidade processual', 'Procedural nullity') },
  { value: 'sentenca', label: l('Nulidade ou aclaração da sentença', 'Nullity or clarification of the judgment') },
  { value: 'conta', label: l('Reclamação da conta de custas', 'Challenge to the costs account') },
];

const tipoOf = (v: Values): Tipo => (['naoAdmissao', 'nulidade', 'sentenca', 'conta'].includes(v.tipo as string) ? (v.tipo as Tipo) : 'nulidade');
const is = (...t: Tipo[]) => (v: Values) => t.includes(tipoOf(v));

export default defineTemplate({
  id: 'reclamacao-judicial',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e processo', 'Court and case') },
    { id: 'partes', title: l('Partes', 'Parties') },
    { id: 'reclamacao', title: l('Reclamação', 'Complaint') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...processoFields('tribunal'),
    ...parteNome('reclamante', 'partes', 'Parte que reclama (o seu cliente)', 'Complaining party (your client)', 'empresa'),
    { name: 'qualidade', type: 'select', section: 'partes', width: 'half', label: l('Posição no processo', 'Role in the case'), options: QUALIDADE_PC_OPTIONS, default: 'reu' },
    ...parteNome('contraria', 'partes', 'Parte contrária (opcional)', 'Other party (optional)', 'empresa', false),
    { name: 'tipo', type: 'select', section: 'reclamacao', required: true, label: l('Tipo de reclamação', 'Type of complaint'), options: TIPO_OPTIONS, default: 'nulidade' },
    { name: 'tribunalSuperior', type: 'text', section: 'reclamacao', label: l('Tribunal que conheceria do recurso', 'Court that would hear the appeal'), default: 'Tribunal Superior de Recurso de Maputo', showIf: is('naoAdmissao') },
    { name: 'presidenteGenero', type: 'radio', section: 'reclamacao', width: 'half', label: l('Presidente', 'President'), options: GENERO_OPTIONS, default: 'M', showIf: is('naoAdmissao') },
    {
      name: 'acto',
      type: 'text',
      section: 'reclamacao',
      required: true,
      label: l('Acto ou decisão de que reclama', 'Act or decision complained of'),
      placeholder: l('Ex.: o despacho de 2 de Outubro de 2026, que não admitiu o recurso de apelação', 'E.g. the order of 2 October 2026'),
      help: l('Comece pelo artigo: «o despacho…», «a sentença…», «a conta de custas…», «a citação…».', 'Start with the article: “o despacho…”, “a sentença…”.'),
    },
    { name: 'dataNotificacao', type: 'date', section: 'reclamacao', width: 'half', label: l('Notificado ou conhecido em', 'Notified or learned on') },
    {
      name: 'fundamentos',
      type: 'textarea',
      section: 'reclamacao',
      rows: 7,
      required: true,
      label: l('Fundamentos (um artigo por linha)', 'Grounds (one article per line)'),
      help: l('Recurso não admitido: porque é admissível (valor, prazo, legitimidade). Nulidade: o acto omitido ou praticado e a influência na decisão. Conta: as verbas mal calculadas.', 'Explain why the complaint is well founded.'),
    },
    {
      name: 'pedidoNulidade',
      type: 'text',
      section: 'reclamacao',
      label: l('O que pede (opcional)', 'What you ask (optional)'),
      placeholder: l('Ex.: anulada a citação e repetido o acto, com nova contagem do prazo de contestação', 'E.g. annul the service and repeat it'),
      help: l('Completa «… deve ser …». Se vazio, usa a fórmula-padrão do tipo escolhido.', 'Completes “… should be …”.'),
    },
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
    fechoField('documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: 'info',
        field: 'dataNotificacao',
        message: l(
          `A reclamação e a arguição de nulidades têm prazos curtos, contados da notificação ou do conhecimento do acto (${cite('pcReclamacao')}). Confirme o prazo aplicável.`,
          'Complaints and nullities have short periods from notice or knowledge of the act. Confirm the period.',
        ),
      },
    ];
    if (tipoOf(v) === 'conta') w.push({ level: 'info', message: l(`A reclamação da conta segue o ${cite('advCustasJudiciais')}.`, 'The costs complaint follows the Court Fees Code.') });
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.reclamanteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const t = tipoOf(v);
    const q = QUALIDADE_PC[v.qualidade as string] ?? QUALIDADE_PC.reu;
    const f = parteF(v, 'reclamante');
    const papel = f ? q.f : q.m;
    const contraPapel = parteF(v, 'contraria') ? q.cf : q.cm;
    const ident = f ? 'identificada' : 'identificado';
    const tipo = str(v.tipoAccao) || '____________________';
    const contra = str(v.contrariaNome) ? `, em que é ${contraPapel} ${nomeParte(v, 'contraria')}` : '';
    const acto = sem(v.acto) || 'o acto ____________________';
    const notif = v.dataNotificacao ? `, ${/^a\s/i.test(acto) ? 'notificada' : 'notificado'} em ${dateLong(v.dataNotificacao)}` : '';
    const conformado = f ? 'conformada' : 'conformado';

    let addressee = courtAddressee(v);
    let verbo = '';
    let titulo = '';
    let pedido = '';
    switch (t) {
      case 'naoAdmissao': {
        const trib = sem(v.tribunalSuperior) || 'Tribunal Superior de Recurso';
        addressee = `${isF(v.presidenteGenero) ? 'Exma. Senhora Juíza Presidente' : 'Exmo. Senhor Juiz Presidente'} do ${trib}`.toLocaleUpperCase('pt');
        verbo = `não se ${conformado} com ${acto}${notif}, vem, por intermédio do seu mandatário judicial, dele apresentar`;
        titulo = 'RECLAMAÇÃO';
        pedido = `deve a presente reclamação ser julgada procedente e, em consequência, ${sem(v.pedidoNulidade) || 'ser revogado o despacho reclamado e ordenada a admissão do recurso, seguindo-se os ulteriores termos'}.`;
        break;
      }
      case 'nulidade':
        verbo = `vem, por intermédio do seu mandatário judicial, relativamente a ${acto}${notif}, deduzir`;
        titulo = 'ARGUIÇÃO DE NULIDADE';
        pedido = `deve ser julgada procedente a nulidade arguida e, em consequência, ${sem(v.pedidoNulidade) || 'ser anulado o acto e os termos subsequentes que dele dependam absolutamente, ordenando-se a sua repetição'}.`;
        break;
      case 'sentenca':
        verbo = `${notif ? `tendo sido ${f ? 'notificada' : 'notificado'} de ${acto}` : `relativamente a ${acto}`}, vem, por intermédio do seu mandatário judicial, nos termos legais, deduzir`;
        titulo = 'ARGUIÇÃO DE NULIDADE E PEDIDO DE ACLARAÇÃO';
        pedido = `deve ${sem(v.pedidoNulidade) || 'ser declarada a nulidade arguida e suprida a omissão ou esclarecida a obscuridade ou ambiguidade apontada, com as legais consequências'}.`;
        break;
      case 'conta':
        verbo = `${notif ? `tendo sido ${f ? 'notificada' : 'notificado'} de ${acto}` : `relativamente a ${acto}`}, vem, por intermédio do seu mandatário judicial, dela apresentar`;
        titulo = 'RECLAMAÇÃO DA CONTA';
        pedido = `deve a presente reclamação ser atendida e, em consequência, ${sem(v.pedidoNulidade) || 'ser ordenada a reforma da conta, nos termos expostos'}.`;
        break;
    }
    const intro = `${nomeParte(v, 'reclamante')}, ${papel} nos autos de ${tipo}${contra}, e neles melhor ${ident}, ${verbo}`;

    const blocks: Block[] = [
      { type: 'courtHeader', processo: str(v.processoNumero) || '________/______', extra: str(v.seccao) || undefined, addressee },
      { type: 'paragraph', id: 'identificacao', text: intro, en: 'The party files the following complaint.' },
      { type: 'paragraph', id: 'titulo', align: 'center', text: `**${titulo}**,`, en: titulo },
      { type: 'paragraph', id: 'fundamentos', text: 'o que faz nos termos e com os fundamentos seguintes:', en: 'on the following terms and grounds:' },
      { type: 'articulado', sections: [{ items: artigos(v.fundamentos).length ? artigos(v.fundamentos) : ['____________________'] }] },
      ...closing(ctx, {
        intro: `Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, ${pedido}`,
        introEn: 'On these grounds, the complaint should be upheld.',
      }),
    ];
    return blocks;
  },
});
