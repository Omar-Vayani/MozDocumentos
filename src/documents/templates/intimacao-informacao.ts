// Intimação para prestação de informações, consulta de processo ou passagem de
// certidão: when a public body does not answer such a request in time, the
// applicant asks the administrative court to order it to. Urgent process.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, l, localField, placeDate } from './_shared';
import { FECHO_OPTIONS, artigos, documentosList, juntaText, linePara, papel } from './_advocacia';
import { applicantDesc, applicantFields, optionalLawyerFields, partySignature, str, taAddressee, taFields, viaMandatario, keepTail } from './_processo-penal';

const PEDIDO_OPTIONS = [
  { value: 'informacao', label: l('Prestação de informações', 'Information') },
  { value: 'consulta', label: l('Consulta do processo', 'Access to the file') },
  { value: 'certidao', label: l('Passagem de certidão', 'Certificate / certified copies') },
];

const PEDIDO_TXT: Record<string, string> = {
  informacao: 'a prestação das seguintes informações',
  consulta: 'a consulta do processo administrativo',
  certidao: 'a passagem de certidão',
};

const SITUACAO_OPTIONS = [
  { value: 'silencio', label: l('Não respondeu', 'No answer') },
  { value: 'recusa', label: l('Recusou', 'Refused') },
  { value: 'parcial', label: l('Respondeu só em parte', 'Partial answer') },
];

export default defineTemplate({
  id: 'intimacao-informacao',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal', 'Court') },
    { id: 'requerente', title: l('Requerente', 'Applicant'), personRole: 'cliente' },
    { id: 'pedido', title: l('Pedido feito à Administração', 'Request to the administration') },
    { id: 'advogado', title: l('Advogado (opcional)', 'Lawyer (optional)') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...taFields('tribunal'),
    ...applicantFields('requerente', 'requerente'),
    { name: 'orgao', type: 'text', section: 'pedido', required: true, label: l('Órgão a intimar', 'Body to be ordered'), placeholder: l('Ex.: Director Provincial de Terras e Ambiente de Gaza', 'E.g. Provincial Land Director') },
    { name: 'orgaoGenero', type: 'radio', section: 'pedido', width: 'half', label: l('Género gramatical do órgão', 'Grammatical gender'), options: [{ value: 'M', label: l('O …', 'Masculine') }, { value: 'F', label: l('A …', 'Feminine') }], default: 'M' },
    { name: 'tipoPedido', type: 'select', section: 'pedido', width: 'half', label: l('O que foi pedido', 'What was requested'), options: PEDIDO_OPTIONS, default: 'certidao' },
    { name: 'objecto', type: 'textarea', section: 'pedido', rows: 3, required: true, label: l('Informações, processo ou documentos pedidos', 'Information, file or documents requested'), placeholder: l('Certidão do despacho que atribuiu o DUAT sobre a parcela n.º 1234, em Xai-Xai', 'Certificate of the land-use decision') },
    { name: 'finalidade', type: 'text', section: 'pedido', label: l('Para que fim', 'Purpose'), placeholder: l('Ex.: instruir o recurso contencioso a interpor do referido despacho', 'E.g. to support a judicial review') },
    { name: 'dataPedido', type: 'date', section: 'pedido', width: 'half', required: true, label: l('Data do pedido à Administração', 'Date of the request') },
    { name: 'situacao', type: 'select', section: 'pedido', width: 'half', label: l('Resposta da Administração', 'Administration’s response'), options: SITUACAO_OPTIONS, default: 'silencio' },
    { name: 'factos', type: 'textarea', section: 'pedido', rows: 3, label: l('Outros factos (um artigo por linha)', 'Other facts (one article per line)') },
    { name: 'documentos', type: 'textarea', section: 'pedido', rows: 2, label: l('Documentos juntos (um por linha)', 'Documents attached (one per line)'), default: 'Cópia do requerimento com o carimbo de entrada' },
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
          `A intimação pressupõe um pedido prévio à Administração não satisfeito no prazo legal. É um processo urgente (${cite('ppIntimacao')}). Junte cópia do pedido com o carimbo de entrada.`,
          'The order requires a prior request not answered in time. It is urgent. Attach the stamped copy of the request.',
        ),
      },
    ];
    return w;
  },

  personName: (v) => v.requerenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const OR = papel(v, 'requerente', 'O requerente', 'A requerente');
    const f = v.orgaoGenero === 'F';
    const orgao = str(v.orgao) || '____________________';
    const tipo = PEDIDO_TXT[v.tipoPedido] ? v.tipoPedido : 'certidao';
    const objecto = str(v.objecto).replace(/\n+/g, '; ').replace(/[.;]$/, '');
    const sit: Record<string, string> = {
      silencio: 'Até à presente data, e decorrido o prazo legal, o pedido não foi satisfeito nem obteve qualquer resposta.',
      recusa: 'O pedido foi recusado, sem fundamento legal bastante.',
      parcial: 'O pedido foi satisfeito apenas em parte, mantendo-se em falta o restante.',
    };
    const items = [
      `Em ${dateLong(v.dataPedido)}, ${OR.toLowerCase()} requereu ${f ? 'à' : 'ao'} ${orgao} ${PEDIDO_TXT[tipo]}: ${objecto || '____________________'}${str(v.finalidade) ? `, destinada a ${str(v.finalidade).replace(/[.;]$/, '')}` : ''}, conforme cópia do requerimento que se junta como Documento n.º 1.`,
      sit[v.situacao] ?? sit.silencio,
      ...artigos(v.factos),
      `${OR} tem interesse legítimo no pedido, que respeita a procedimento em que é ${papel(v, 'requerente', 'directamente interessado', 'directamente interessada')}, assistindo-lhe o direito de requerer a intimação da entidade em falta (${cite('ppIntimacao')}).`,
    ];
    const docs = documentosList(v.documentos);
    const blocks: Block[] = [
      { type: 'tags', items: ['URGENTE'] },
      { type: 'courtHeader', addressee: taAddressee(v) },
      { type: 'paragraph', id: 'requerente', text: `${applicantDesc(v, 'requerente', { docBlank: true })}, vem${viaMandatario(v)} requerer, contra ${f ? 'a' : 'o'} ${orgao}, a presente`, en: 'The applicant files against the public body this' },
      { type: 'paragraph', id: 'titulo', align: 'center', text: `**INTIMAÇÃO PARA ${tipo === 'informacao' ? 'PRESTAÇÃO DE INFORMAÇÕES' : tipo === 'consulta' ? 'CONSULTA DE PROCESSO' : 'PASSAGEM DE CERTIDÃO'}**,`, en: 'APPLICATION FOR AN ORDER TO PROVIDE INFORMATION,' },
      { type: 'paragraph', id: 'fundamentos', text: 'nos termos e com os fundamentos seguintes:', en: 'on the following grounds:' },
      { type: 'articulado', sections: [{ items }] },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Nestes termos, requer a V. Ex.ª se digne intimar ${f ? 'a' : 'o'} ${orgao} a satisfazer o pedido, ${tipo === 'informacao' ? 'prestando as informações pedidas' : tipo === 'consulta' ? 'facultando a consulta do processo' : 'passando a certidão pedida'}, no prazo que V. Ex.ª fixar, sob as cominações legais.`,
        en: 'The applicant asks the court to order the body to comply within the period it sets.',
      },
      linePara('junta', 'Junta', `${juntaText({ procuracao: Boolean(v.viaAdvogado), documentos: docs.length })}.`, 'Attached documents.', true),
      { type: 'paragraph', id: 'fecho', text: String(v.fecho || 'Pede deferimento.'), en: 'Closing formula.', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [partySignature(v, 'requerente', papel(v, 'requerente', 'O Requerente', 'A Requerente'))] },
    ];
    if (docs.length) blocks.push({ type: 'annexList', title: 'Documentos juntos', items: docs });
    return keepTail(blocks, 'pedido');
  },
});

