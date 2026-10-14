// Pedido de suspensão de eficácia de acto administrativo: since a judicial
// review does not suspend the act, the applicant asks the administrative court
// to suspend it (demolition, closure of a business, eviction, dismissal of a
// public servant) while the case is decided. Urgent process.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, l, localField, placeDate } from './_shared';
import { FECHO_OPTIONS, artigos, documentosList, juntaText, linePara, papel } from './_advocacia';
import { applicantDesc, applicantFields, optionalLawyerFields, partySignature, str, taAddressee, taFields, viaMandatario, keepTail } from './_processo-penal';

export default defineTemplate({
  id: 'suspensao-eficacia',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal', 'Court') },
    { id: 'requerente', title: l('Requerente', 'Applicant'), personRole: 'cliente' },
    { id: 'acto', title: l('Acto a suspender', 'Act to suspend') },
    { id: 'requisitos', title: l('Requisitos', 'Requirements') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...taFields('tribunal'),
    ...applicantFields('requerente', 'requerente'),
    { name: 'orgao', type: 'text', section: 'acto', required: true, label: l('Órgão autor do acto', 'Body that issued the act'), placeholder: l('Ex.: Presidente do Conselho Municipal da Matola', 'E.g. Mayor of Matola') },
    { name: 'orgaoGenero', type: 'radio', section: 'acto', width: 'half', label: l('Género gramatical do órgão', 'Grammatical gender of the body'), options: [{ value: 'M', label: l('O …', 'Masculine') }, { value: 'F', label: l('A …', 'Feminine') }], default: 'M' },
    { name: 'actoDescricao', type: 'text', section: 'acto', required: true, label: l('O que o acto determina', 'What the act orders'), placeholder: l('Ex.: a demolição do armazém do requerente no prazo de dez dias', 'E.g. demolition of the warehouse') },
    { name: 'actoReferencia', type: 'text', section: 'acto', width: 'half', label: l('Referência', 'Reference'), placeholder: l('Ex.: Notificação n.º 33/DMU/2026', 'E.g. Notice no. 33/2026') },
    { name: 'dataActo', type: 'date', section: 'acto', width: 'half', label: l('Data do acto', 'Date of the act') },
    { name: 'dataNotificacao', type: 'date', section: 'acto', width: 'half', label: l('Data da notificação', 'Date of notification') },
    {
      name: 'recurso',
      type: 'radio',
      section: 'acto',
      label: l('Recurso contencioso', 'Judicial review'),
      default: 'simultaneo',
      options: [
        { value: 'simultaneo', label: l('Apresentado agora, juntamente', 'Filed now, together') },
        { value: 'pendente', label: l('Já está pendente', 'Already pending') },
      ],
    },
    { name: 'processoNumero', type: 'text', section: 'acto', width: 'half', label: l('Processo do recurso n.º', 'Review case no.'), showIf: (v) => v.recurso === 'pendente' },
    {
      name: 'prejuizo',
      type: 'textarea',
      section: 'requisitos',
      rows: 6,
      required: true,
      label: l('Prejuízo de difícil reparação (um artigo por linha)', 'Hard-to-repair harm (one article per line)'),
      help: l('O que acontece se o acto for executado já: perda do negócio, da casa, do emprego, dos bens; por que não se repara depois com dinheiro.', 'What happens if the act is carried out now and why money cannot repair it later.'),
    },
    {
      name: 'interessePublico',
      type: 'textarea',
      section: 'requisitos',
      rows: 3,
      label: l('Falta de lesão grave do interesse público (um artigo por linha)', 'No serious harm to the public interest'),
      default: 'A suspensão do acto não causa grave lesão do interesse público, uma vez que a situação se mantém inalterada há vários anos sem prejuízo para terceiros.',
    },
    { name: 'ilegalidade', type: 'textarea', section: 'requisitos', rows: 4, label: l('Indícios da ilegalidade do acto (um artigo por linha)', 'Signs the act is unlawful (one article per line)'), help: l('Resumo dos vícios invocados no recurso contencioso.', 'Summary of the grounds raised in the review.') },
    { name: 'documentos', type: 'textarea', section: 'requisitos', rows: 3, label: l('Documentos juntos (um por linha)', 'Documents attached (one per line)'), default: 'Cópia do acto e da notificação' },
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
          `A suspensão é concedida só se se verificarem, em conjunto: prejuízo de difícil reparação para o requerente; falta de grave lesão do interesse público; e falta de fortes indícios de ilegalidade da interposição do recurso (${cite('ppSuspensaoEficacia')}). É um processo urgente: apresente-o o mais cedo possível, com o recurso contencioso.`,
          'Suspension is granted only if, together: hard-to-repair harm; no serious harm to the public interest; no strong signs the appeal is unlawful. It is urgent: file early, with the judicial review.',
        ),
      },
      { level: 'info', message: l(`O recurso contencioso, por si, não suspende o acto (${cite('ppRecursoContencioso')}).`, 'Judicial review alone does not suspend the act.') },
    ];
    return w;
  },

  personName: (v) => v.requerenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const OR = papel(v, 'requerente', 'O requerente', 'A requerente');
    const orgaoF = v.orgaoGenero === 'F';
    const orgao = str(v.orgao) || '____________________';
    const acto = `o acto ${orgaoF ? 'da' : 'do'} ${orgao}${str(v.actoReferencia) ? ` (${str(v.actoReferencia)})` : ''}${v.dataActo ? `, de ${dateLong(v.dataActo)}` : ''}, que determina ${str(v.actoDescricao).replace(/[.;]$/, '') || '____________________'}`;
    const pendente = v.recurso === 'pendente';
    const enquadramento = [
      `${OR} foi ${papel(v, 'requerente', 'notificado', 'notificada')}${v.dataNotificacao ? ` em ${dateLong(v.dataNotificacao)}` : ''} do acto acima identificado, que se junta como Documento n.º 1.`,
      pendente
        ? `Do referido acto foi interposto recurso contencioso, que corre termos nesse Tribunal${str(v.processoNumero) ? ` sob o n.º ${str(v.processoNumero)}` : ''}.`
        : `Do referido acto ${OR.toLowerCase()} interpõe, nesta data, o competente recurso contencioso.`,
      `O recurso contencioso não tem, em regra, efeito suspensivo, pelo que a execução do acto pode ocorrer a todo o momento (${cite('ppRecursoContencioso')}).`,
    ];
    const prejuizo = artigos(v.prejuizo);
    const interesse = artigos(v.interessePublico);
    const ilegal = artigos(v.ilegalidade);
    const docs = documentosList(v.documentos);
    const blocks: Block[] = [
      { type: 'tags', items: ['URGENTE'] },
      { type: 'courtHeader', processo: pendente ? str(v.processoNumero) || undefined : undefined, addressee: taAddressee(v) },
      { type: 'paragraph', id: 'requerente', text: `${applicantDesc(v, 'requerente', { docBlank: true })}, vem${viaMandatario(v)} requerer a`, en: 'The applicant requests the' },
      { type: 'paragraph', id: 'titulo', align: 'center', text: '**SUSPENSÃO DE EFICÁCIA**', en: 'SUSPENSION OF EFFECTS' },
      { type: 'paragraph', id: 'objecto', text: `d${acto}, sendo entidade requerida ${orgaoF ? 'a' : 'o'} ${orgao}, nos termos e com os fundamentos seguintes:`, en: 'of the act identified, on the following grounds:' },
      {
        type: 'articulado',
        sections: [
          { heading: 'I — Do acto e do recurso', items: enquadramento },
          { heading: 'II — Do prejuízo de difícil reparação', items: prejuizo.length ? prejuizo : ['____________________'] },
          { heading: 'III — Da inexistência de grave lesão do interesse público', items: interesse.length ? interesse : ['____________________'] },
          {
            heading: 'IV — Da viabilidade do recurso',
            items: [...ilegal, 'Do processo não resultam fortes indícios de ilegalidade da interposição do recurso, que é tempestivo e interposto por quem tem legitimidade.'],
          },
        ],
      },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Nestes termos, verificados cumulativamente os requisitos legais (${cite('ppSuspensaoEficacia')}), requer a V. Ex.ª se digne decretar a suspensão da eficácia do acto identificado até decisão final do recurso contencioso, ordenando-se a citação da entidade requerida para responder, querendo, e a sua imediata notificação para se abster de executar o acto.`,
        en: 'The applicant asks the court to suspend the act until the review is decided.',
      },
      linePara('junta', 'Junta', `${juntaText({ procuracao: Boolean(v.viaAdvogado), documentos: docs.length })}.`, 'Attached documents.', true),
      { type: 'paragraph', id: 'fecho', text: String(v.fecho || 'Pede deferimento.'), en: 'Closing formula.', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [partySignature(v, 'requerente', papel(v, 'requerente', 'O Requerente', 'A Requerente'))] },
    ];
    if (docs.length) blocks.push({ type: 'annexList', title: 'Documentos juntos', items: docs });
    return keepTail(blocks, 'pedido');
  },
});
