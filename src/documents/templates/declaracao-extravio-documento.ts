// Declaração de perda/extravio de documento: the holder declares that an
// identity or other document was lost or stolen, to support the police report
// and the request for a replacement.

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type DefaultsContext, type Values, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, lineItems, localField, placeDate, workerFields } from './_shared';
import { endDot, gx, porEntidade, identificacao, lowerFirst, notaryBox, pessoaFields, str } from './_pessoal-rh';

const TIPOS = [
  { value: 'Bilhete de Identidade', label: l('Bilhete de Identidade (BI)', 'Identity card (BI)') },
  { value: 'Passaporte', label: l('Passaporte', 'Passport') },
  { value: 'Carta de Condução', label: l('Carta de condução', 'Driving licence') },
  { value: 'DIRE', label: l('DIRE', 'Residence permit (DIRE)') },
  { value: 'Cartão de Eleitor', label: l('Cartão de eleitor', 'Voter card') },
  { value: 'Cartão do NUIT', label: l('Cartão do NUIT', 'NUIT card') },
  { value: 'Livrete da viatura', label: l('Livrete da viatura', 'Vehicle registration book') },
  { value: 'Título de propriedade', label: l('Título de propriedade', 'Title deed') },
  { value: 'Certificado de habilitações', label: l('Certificado de habilitações / diploma', 'Academic certificate') },
  { value: 'Cartão bancário', label: l('Cartão bancário', 'Bank card') },
  { value: 'Outro', label: l('Outro', 'Other') },
];

type Doc = { tipo: string; outro: string; numero: string; entidade: string; emissao: string };

function docs(v: Values): Doc[] {
  return lineItems(v.documentos)
    .map((r) => ({ tipo: str(r.tipo), outro: str(r.outro), numero: str(r.numero), entidade: str(r.entidade), emissao: str(r.emissao) }))
    .filter((d) => d.tipo || d.numero);
}

function docDesc(d: Doc): string {
  const nome = d.tipo === 'Outro' || !d.tipo ? d.outro || 'documento' : d.tipo;
  return [
    `${nome} n.º ${d.numero || BLANK}`,
    d.entidade ? `emitido ${porEntidade(d.entidade)}` : '',
    d.emissao ? `em ${dateLong(d.emissao)}` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

export default defineTemplate({
  id: 'declaracao-extravio-documento',
  family: 'declaracao',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'declarante', title: l('Declarante (titular)', 'Declarant (holder)'), description: l('Os dados vêm do seu perfil pessoal.', 'Details come from your personal profile.'), personRole: 'outro' },
    { id: 'perdidos', title: l('Documentos perdidos', 'Lost documents') },
    { id: 'ocorrencia', title: l('O que aconteceu', 'What happened') },
    { id: 'destino', title: l('Finalidade e opções', 'Purpose and options') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data da declaração', 'Date of the declaration')),
    ...pessoaFields('declarante', 'declarante', { profile: true }),
    ...workerFields(['telefone'], 'declarante', 'declarante').map((f) => ({ ...f, default: (c: DefaultsContext) => (c.profile?.kind === 'pessoa' ? c.profile.telefones || '' : '') })),
    {
      name: 'documentos',
      type: 'lines',
      section: 'perdidos',
      required: true,
      label: l('Documentos', 'Documents'),
      addLabel: l('Adicionar documento', 'Add document'),
      help: l('Se não souber o número, consulte uma cópia ou a entidade emissora.', 'If you do not know the number, check a copy or ask the issuer.'),
      columns: [
        { name: 'tipo', type: 'select', label: l('Tipo', 'Type'), options: TIPOS },
        { name: 'outro', type: 'text', label: l('Outro (qual)', 'Other (which)') },
        { name: 'numero', type: 'text', label: l('Número', 'Number') },
        { name: 'entidade', type: 'text', label: l('Emitido por', 'Issued by') },
        { name: 'emissao', type: 'date', label: l('Data de emissão', 'Issue date') },
      ],
      default: [{ tipo: 'Bilhete de Identidade', outro: '', numero: '', entidade: 'Direcção Nacional de Identificação Civil', emissao: '' }],
    },
    {
      name: 'tipoEvento',
      type: 'radio',
      section: 'ocorrencia',
      label: l('O que aconteceu', 'What happened'),
      default: 'perda',
      options: [
        { value: 'perda', label: l('Perdi o documento', 'I lost it') },
        { value: 'furto', label: l('Foi furtado (sem violência)', 'It was stolen') },
        { value: 'roubo', label: l('Foi roubado (com violência ou ameaça)', 'It was taken by force') },
      ],
    },
    { name: 'dataPerda', type: 'date', section: 'ocorrencia', width: 'half', required: true, label: l('Data (aproximada)', 'Date (approximate)') },
    { name: 'localPerda', type: 'text', section: 'ocorrencia', width: 'half', label: l('Local', 'Place'), placeholder: l('Ex.: no mercado do Xipamanine', 'E.g. at Xipamanine market') },
    { name: 'circunstancias', type: 'textarea', section: 'ocorrencia', rows: 3, label: l('Circunstâncias (opcional)', 'Circumstances (optional)'), placeholder: l('Ex.: a carteira onde estava o documento caiu durante a viagem de chapa', 'E.g. the wallet fell out during a minibus ride') },
    { name: 'participacaoEsquadra', type: 'text', section: 'ocorrencia', width: 'half', label: l('Esquadra da PRM onde participou', 'Police station where reported'), placeholder: l('Ex.: 7.ª Esquadra da PRM, Maputo', 'E.g. 7th Police Station, Maputo') },
    { name: 'participacaoData', type: 'date', section: 'ocorrencia', width: 'half', label: l('Data da participação', 'Date reported') },
    { name: 'participacaoNumero', type: 'text', section: 'ocorrencia', width: 'half', label: l('N.º da participação', 'Report no.') },
    {
      name: 'finalidade',
      type: 'text',
      section: 'destino',
      label: l('Para que serve (opcional)', 'Purpose (optional)'),
      placeholder: l('Ex.: instruir o pedido de segunda via do Bilhete de Identidade', 'E.g. support the request for a replacement ID card'),
    },
    {
      name: 'espacoReconhecimento',
      type: 'toggle',
      section: 'destino',
      default: false,
      label: l('Deixar espaço para o reconhecimento da assinatura', 'Leave space for signature certification'),
      help: l('Algumas entidades exigem a assinatura reconhecida.', 'Some institutions require a certified signature.'),
    },
  ],

  computed: (v) => ({ lista: docs(v) }),

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const lista = ctx.computed.lista as Doc[];
    if (!lista.length) w.push({ level: 'error', field: 'documentos', message: l('Indique o documento perdido.', 'Enter the lost document.') });
    if (lista.some((d) => !d.numero)) w.push({ level: 'warning', field: 'documentos', message: l('Falta o número de um dos documentos.', 'A document number is missing.') });
    if (v.tipoEvento !== 'perda' && !str(v.participacaoEsquadra)) {
      w.push({
        level: 'warning',
        field: 'participacaoEsquadra',
        message: l('Em caso de furto ou roubo, faça a participação na esquadra da PRM. Esta declaração não a substitui.', 'For theft, report it at a police station. This declaration does not replace the police report.'),
      });
    }
    if (lista.some((d) => d.tipo === 'Cartão bancário')) {
      w.push({ level: 'warning', field: 'documentos', message: l('Cancele já o cartão bancário junto do banco.', 'Cancel the bank card with the bank straight away.') });
    }
    if (v.dataPerda && v.data && diffDays(v.dataPerda, v.data) < 0) {
      w.push({ level: 'error', field: 'dataPerda', message: l('A data da perda é posterior à data da declaração.', 'The loss date is after the declaration date.') });
    }
    w.push({ level: 'info', message: l('A prestação de falsas declarações é punida por lei.', 'False statements are punishable by law.') });
    return w;
  },

  personName: (v) => v.declaranteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const lista = ctx.computed.lista as Doc[];
    const evento = v.tipoEvento === 'furto' ? 'lhe foi furtado' : v.tipoEvento === 'roubo' ? 'lhe foi roubado' : 'perdeu';
    const plural = lista.length > 1;
    const eventoTxt = plural
      ? v.tipoEvento === 'furto'
        ? 'lhe foram furtados'
        : v.tipoEvento === 'roubo'
          ? 'lhe foram roubados'
          : 'perdeu'
      : evento;
    const local = str(v.localPerda) ? `, ${lowerFirst(str(v.localPerda))}` : '';
    const circ = str(v.circunstancias) ? ` ${endDot(str(v.circunstancias).charAt(0).toUpperCase() + str(v.circunstancias).slice(1))}` : '';
    const docsTxt = plural ? 'os seguintes documentos, emitidos em seu nome:' : `o seguinte documento, emitido em seu nome: ${lista[0] ? docDesc(lista[0]) : BLANK}.`;

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Perda de Documento' },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `${identificacao(v, 'declarante')}${str(v.declaranteTelefone) ? `, contacto ${str(v.declaranteTelefone)}` : ''}, **declara, sob compromisso de honra**, que no dia ${dateLong(v.dataPerda)}${local}, ${eventoTxt} ${docsTxt}${plural ? '' : circ}`,
        en: `The declarant, identified above, declares on their honour that on ${v.dataPerda || '—'} they ${v.tipoEvento === 'perda' ? 'lost' : 'had stolen'} the document(s) listed.`,
      },
    ];
    if (plural) {
      blocks.push({ type: 'list', style: 'alpha', items: lista.map((d, i) => `${docDesc(d)}${i === lista.length - 1 ? '.' : ';'}`) });
      if (circ) blocks.push({ type: 'paragraph', id: 'circunstancias', text: circ.trim(), en: 'Circumstances as described.' });
    }
    if (str(v.participacaoEsquadra)) {
      blocks.push({
        type: 'paragraph',
        id: 'participacao',
        text: `O facto foi participado ${/^(a|à|na)\s/i.test(str(v.participacaoEsquadra)) ? '' : 'na '}${str(v.participacaoEsquadra)}${v.participacaoData ? `, em ${dateLong(v.participacaoData)}` : ''}${str(v.participacaoNumero) ? `, sob o n.º ${str(v.participacaoNumero)}` : ''}.`,
        en: 'The matter was reported to the police as stated.',
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'compromisso',
        text: `Mais declara que, até à presente data, não ${plural ? 'os recuperou' : 'o recuperou'}, que não ${plural ? 'os cedeu' : 'o cedeu'} nem autorizou a sua utilização por terceiros e que se compromete a ${plural ? 'entregá-los' : 'entregá-lo'} à entidade emissora caso ${plural ? 'venham a ser encontrados' : 'venha a ser encontrado'}.`,
        en: 'The declarant also states that the document(s) have not been recovered, were not handed to anyone or authorised for use by others, and will be returned to the issuer if found.',
      },
    );
    if (str(v.finalidade)) {
      blocks.push({ type: 'paragraph', id: 'finalidade', text: `A presente declaração destina-se a ${endDot(lowerFirst(str(v.finalidade)))}`, en: `This declaration is intended to: ${v.finalidade}.` });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: `Por ser verdade, ${gx(v.declaranteGenero, 'o declarante', 'a declarante')} assina a presente declaração, ciente de que a prestação de falsas declarações é punida por lei.`,
        en: 'In witness whereof, the declarant signs this declaration, aware that false statements are punishable by law.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [{ role: gx(v.declaranteGenero, 'O Declarante', 'A Declarante'), name: str(v.declaranteNome) || undefined }],
      },
    );
    if (v.espacoReconhecimento) blocks.push(notaryBox());
    return blocks;
  },
});
