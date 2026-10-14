import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, localField } from './_shared';
import { anexosBlock, anexosField, autorFields, autorSignature, autorWarnings, envioBlock, envioField, eu, isEmpresa, opt, reciboBlock, reciboField, senderBlock, str } from './_cidadao';

const DOCS = [
  opt('factura', 'Factura ou recibo', 'Invoice or receipt'),
  opt('cartao', 'Cartão (estudante, sócio, cliente, seguro de saúde)', 'Card (student, member, customer, health plan)'),
  opt('certificado', 'Certificado, diploma ou declaração', 'Certificate, diploma or statement'),
  opt('contrato', 'Contrato ou apólice', 'Contract or policy'),
  opt('extracto', 'Extracto ou declaração de conta', 'Statement'),
  opt('outro', 'Outro documento', 'Other document'),
];
const ART: Record<string, string> = { factura: 'da factura', cartao: 'do cartão', certificado: 'do certificado', contrato: 'do contrato', extracto: 'do extracto', outro: 'do documento' };
const MOTIVOS = [
  opt('extravio', 'Perdi-o', 'Lost'),
  opt('furto', 'Foi roubado', 'Stolen'),
  opt('deterioracao', 'Está danificado ou ilegível', 'Damaged or illegible'),
  opt('naoRecebido', 'Nunca o recebi', 'Never received'),
  opt('copia', 'Preciso de mais um exemplar', 'Need another copy'),
];
const MOTIVO_TXT: Record<string, string> = {
  extravio: 'por extravio do original',
  furto: 'por o original ter sido furtado',
  deterioracao: 'por o original se encontrar danificado e ilegível',
  naoRecebido: 'por não ter recebido o original',
  copia: 'por necessitar de mais um exemplar',
};

export default defineTemplate({
  id: 'pedido-segunda-via',
  sections: [
    { id: 'autor', title: l('Quem pede', 'Who is asking'), personRole: 'outro' },
    { id: 'destinatario', title: l('A quem pede', 'Who issues it') },
    { id: 'pedido', title: l('Documento', 'Document') },
    { id: 'documento', title: l('Local, data e entrega', 'Place, date and delivery') },
  ],
  fields: [
    ...autorFields(['nome', 'genero', 'docTipo', 'docNumero', 'morada', 'telefone', 'email'], { empresa: true, required: ['nome'] }),
    { name: 'destinatario', type: 'text', section: 'destinatario', required: true, label: l('Entidade', 'Organisation'), placeholder: l('Ex.: Universidade Pedagógica de Maputo — Registo Académico', 'E.g. the issuer') },
    { name: 'destinatarioAc', type: 'text', section: 'destinatario', label: l('À atenção de (opcional)', 'Attention of (optional)') },
    { name: 'destinatarioMorada', type: 'text', section: 'destinatario', label: l('Endereço (opcional)', 'Address (optional)') },
    { name: 'tipoDoc', type: 'select', section: 'pedido', width: 'half', label: l('Documento', 'Document'), options: DOCS, default: 'factura' },
    { name: 'descricao', type: 'text', section: 'pedido', required: true, label: l('Identificação do documento', 'Document details'), placeholder: l('Ex.: n.º 2026/0451, de 3 de Março de 2026, no valor de 12.500,00 MT', 'E.g. no., date, amount') },
    { name: 'referencia', type: 'text', section: 'pedido', width: 'half', label: l('N.º de cliente, estudante ou apólice', 'Customer, student or policy no.') },
    { name: 'motivo', type: 'select', section: 'pedido', width: 'half', label: l('Motivo', 'Reason'), options: MOTIVOS, default: 'extravio' },
    { name: 'participacao', type: 'text', section: 'pedido', label: l('Participação à polícia n.º (opcional)', 'Police report no. (optional)'), showIf: (v) => v.motivo === 'furto' || v.motivo === 'extravio' },
    { name: 'forma', type: 'radio', section: 'pedido', label: l('Como quer receber', 'How you want it'), options: [opt('levantar', 'Levanto no balcão', 'I will collect it'), opt('email', 'Por email', 'By email'), opt('correio', 'Por correio', 'By post')], default: 'levantar' },
    { name: 'emolumentos', type: 'toggle', section: 'pedido', default: true, label: l('Disponível para pagar a taxa da 2.ª via', 'Willing to pay the duplicate fee') },
    anexosField('pedido', l('Ex.: Cópia do documento de identificação', 'E.g. Copy of ID')),
    localField('documento'),
    dateField('data'),
    envioField('documento'),
    reciboField('documento', false),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx, { contacto: true });
    if (!str(v.destinatario)) w.push({ level: 'warning', field: 'destinatario', message: l('Indique a entidade que emitiu o documento.', 'State who issued the document.') });
    w.push({ level: 'info', field: 'tipoDoc', message: l('Bilhete de identidade, passaporte, carta de condução, DIRE e cartão de eleitor têm processo próprio de 2.ª via nos serviços que os emitem; use a «Declaração de perda de documento» e o impresso oficial.', 'ID cards, passports, driving licences and residence permits have their own replacement procedure; use the loss declaration and the official form.') });
    if (v.motivo === 'furto' && !str(v.participacao)) w.push({ level: 'info', field: 'participacao', message: l('Em caso de furto, junte a participação feita na esquadra.', 'For theft, attach the police report.') });
    return w;
  },

  personName: (v) => v.destinatario,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const doc = ART[String(v.tipoDoc)] ?? ART.outro;
    const desc = str(v.descricao).replace(/\.$/, '');
    const forma = v.forma === 'email' ? `envio por email${str(v.autorEmail) ? ` para ${str(v.autorEmail)}` : ''}` : v.forma === 'correio' ? 'envio por correio para a morada indicada' : 'levantamento no vosso balcão';

    const blocks: Block[] = [
      ...senderBlock(ctx),
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      ...envioBlock(v),
      { type: 'recipient', lines: [str(v.destinatario) || BLANK, str(v.destinatarioAc) ? `A/C: ${str(v.destinatarioAc)}` : '', str(v.destinatarioMorada)].filter(Boolean) },
      { type: 'subject', text: `Pedido de segunda via ${doc}${str(v.referencia) ? ` — ref. ${str(v.referencia)}` : ''}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${isEmpresa(ctx) ? `A **${profileDisplayName(ctx.profile)}** solicita` : 'Solicito'} a emissão de segunda via ${doc}${desc ? ` (${desc}${str(v.referencia) ? `; ref. ${str(v.referencia)}` : ''})` : str(v.referencia) ? ` (ref. ${str(v.referencia)})` : ` ${BLANK}`}, ${MOTIVO_TXT[String(v.motivo)] ?? MOTIVO_TXT.extravio}${str(v.participacao) ? ` (participação policial n.º ${str(v.participacao)})` : ''}.`,
        en: 'I request a duplicate of the document described, for the reason stated.',
      },
      {
        type: 'paragraph',
        id: 'forma',
        text: `${eu(ctx, 'Prefiro', 'Preferimos')} o ${forma}.${v.emolumentos !== false ? ` ${eu(ctx, 'Disponho-me', 'Dispomo-nos')} a pagar a taxa devida pela emissão.` : ''}${v.motivo === 'extravio' || v.motivo === 'furto' ? ` ${eu(ctx, 'Comprometo-me', 'Comprometemo-nos')} a devolver o original, se for encontrado.` : ''}`,
        en: 'Preferred delivery and willingness to pay the fee are stated.',
      },
      ...anexosBlock(v),
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', columns: [autorSignature(ctx, 'O Requerente', 'A Requerente')] },
      ...reciboBlock(v),
    ];
    return blocks;
  },
});
