import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, l, localField, placeDate, splitLines } from './_shared';
import {
  TRATAMENTO_OPTIONS,
  anexosBlock,
  anexosField,
  autorDesc,
  autorFields,
  autorSignature,
  autorWarnings,
  cleanEntidade,
  endDot,
  envioBlock,
  envioField,
  isEmpresa,
  lowerFirst,
  opt,
  reciboBlock,
  reciboField,
  str,
} from './_cidadao';

const FORMAS = [
  opt('consulta', 'Consulta no local', 'Inspection on site'),
  opt('copia', 'Cópia em papel', 'Paper copy'),
  opt('digital', 'Cópia digital por email', 'Digital copy by email'),
  opt('certidao', 'Certidão', 'Certified copy'),
];
const FORMA_TEXTO: Record<string, string> = {
  consulta: 'consulta dos documentos nas instalações dessa entidade',
  copia: 'reprodução em cópia de papel',
  digital: 'envio de cópia digital para o email indicado',
  certidao: 'emissão de certidão',
};

export default defineTemplate({
  id: 'pedido-acesso-informacao',
  official: 'estado',
  sections: [
    { id: 'destinatario', title: l('Entidade que tem a informação', 'Body holding the information') },
    { id: 'autor', title: l('Requerente', 'Requester'), personRole: 'outro' },
    { id: 'informacao', title: l('Informação pedida', 'Information requested') },
    { id: 'documento', title: l('Local, data e entrega', 'Place, date and delivery') },
  ],
  fields: [
    { name: 'tratamento', type: 'select', section: 'destinatario', width: 'half', label: l('Forma de tratamento', 'Form of address'), options: TRATAMENTO_OPTIONS.slice(0, 6), default: 'Exmo. Senhor' },
    {
      name: 'entidade',
      type: 'text',
      section: 'destinatario',
      required: true,
      label: l('Cargo do dirigente e entidade', 'Head of the body'),
      placeholder: l('Ex.: Director Provincial de Obras Públicas e Recursos Hídricos de Gaza', 'E.g. Provincial Director of Public Works'),
      help: l('Pode pedir informação a órgãos do Estado, autarquias, institutos e empresas públicas e a entidades privadas que exerçam funções de interesse público ou recebam fundos públicos.', 'You may ask State bodies, municipalities, public institutes and companies, and private bodies with public-interest functions or public funds.'),
    },
    { name: 'destinatarioMorada', type: 'text', section: 'destinatario', label: l('Endereço (opcional)', 'Address (optional)') },
    { name: 'destinatarioLocal', type: 'text', section: 'destinatario', width: 'half', label: l('Cidade', 'City'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    ...autorFields(['nome', 'genero', 'estadoCivil', 'nacionalidade', 'profissao', 'docTipo', 'docNumero', 'morada', 'telefone', 'email'], { empresa: true, required: ['nome'] }),
    {
      name: 'informacao',
      type: 'textarea',
      section: 'informacao',
      required: true,
      rows: 5,
      label: l('Que informação pede', 'Information requested'),
      help: l('Um pedido por linha, o mais concreto possível: documento, período, local, projecto. Ex.: «Contrato de empreitada da reabilitação da Estrada R852, incluindo adendas».', 'One item per line, as specific as possible: document, period, place, project.'),
    },
    { name: 'periodo', type: 'text', section: 'informacao', label: l('Período a que respeita (opcional)', 'Period covered (optional)'), placeholder: l('Ex.: de Janeiro de 2024 a Junho de 2026', 'E.g. January 2024 to June 2026') },
    { name: 'forma', type: 'select', section: 'informacao', width: 'half', label: l('Forma de acesso', 'Form of access'), options: FORMAS, default: 'digital' },
    {
      name: 'finalidade',
      type: 'text',
      section: 'informacao',
      label: l('Finalidade (opcional)', 'Purpose (optional)'),
      help: l('Não é obrigatório explicar para que quer a informação. Indicar a finalidade pode facilitar a resposta (ex.: trabalho jornalístico, estudo académico, defesa de um direito).', 'You do not have to say why you want it; giving a reason may help.'),
    },
    anexosField('informacao', l('Ex.: Cópia do cartão de jornalista', 'E.g. Copy of press card')),
    localField('documento'),
    dateField('data'),
    envioField('documento'),
    reciboField('documento'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx, { contacto: true });
    const prazo = ctx.legal.value<number>('direitoInformacaoPrazo');
    if (!str(v.entidade)) w.push({ level: 'warning', field: 'entidade', message: l('Indique a entidade que tem a informação.', 'State the body holding the information.') });
    if (!splitLines(v.informacao).length) w.push({ level: 'warning', field: 'informacao', message: l('Descreva a informação que pede.', 'Describe the information requested.') });
    if (v.forma === 'digital' && !str(v.autorEmail)) w.push({ level: 'warning', field: 'autorEmail', message: l('Indique o email para onde a informação deve ser enviada.', 'Give the email for the reply.') });
    w.push({
      level: 'info',
      field: 'envio',
      message: l(
        `A entidade deve responder em ${prazo} dias a contar da recepção; o silêncio vale como recusa, de que pode reclamar e recorrer (${cite('cidInformacaoRecurso')}). Guarde a cópia com a data de entrada.`,
        `The body must reply within ${prazo} days of receipt; silence counts as refusal, which you can challenge. Keep the stamped copy.`,
      ),
    });
    return w;
  },

  personName: (v) => (v.autorTipo === 'empresa' ? undefined : v.autorNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const tratamento = str(v.tratamento) || 'Exmo. Senhor';
    const entidade = cleanEntidade(str(v.entidade), tratamento) || BLANK;
    const itens = splitLines(v.informacao);
    const prazo = ctx.legal.value<number>('direitoInformacaoPrazo');
    const forma = FORMA_TEXTO[String(v.forma)] ?? FORMA_TEXTO.digital;
    const req = isEmpresa(ctx) ? 'A requerente' : v.autorGenero === 'F' ? 'A requerente' : 'O requerente';

    const blocks: Block[] = [
      ...envioBlock(v),
      { type: 'recipient', salutation: tratamento, lines: [entidade, str(v.destinatarioMorada), str(v.destinatarioLocal).toUpperCase()].filter(Boolean) },
      { type: 'subject', text: 'Pedido de acesso à informação' },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${autorDesc(ctx, { contactos: true })}, vem, ao abrigo do direito à informação consagrado na Constituição da República e na ${cite('direitoInformacaoPrazo')} (Lei do Direito à Informação), requerer a V. Ex.ª o acesso à seguinte informação${str(v.periodo) ? `, relativa ao período ${/^(de|entre)\s/i.test(str(v.periodo)) ? '' : 'de '}${str(v.periodo).replace(/\.$/, '')}` : ''}:`,
        en: 'The requester, under the right to information in the Constitution and the Access to Information Law, asks for access to the following information:',
        keepWithNext: true,
      },
      { type: 'list', style: 'alpha', items: itens.length ? itens.map(endDot) : [BLANK, BLANK] },
      {
        type: 'paragraph',
        id: 'forma',
        text: `${req} pretende o acesso por ${forma}${v.forma === 'digital' && str(v.autorEmail) ? ` (${str(v.autorEmail)})` : ''}, suportando os custos de reprodução que forem devidos.${str(v.finalidade) ? ` A informação destina-se a ${lowerFirst(str(v.finalidade).replace(/\.$/, ''))}.` : ''}`,
        en: 'The requester asks for access in the form stated and will bear any copying costs.',
      },
      {
        type: 'paragraph',
        id: 'parcial',
        text: 'Se alguma parte da informação estiver legalmente protegida, requer-se o acesso às restantes partes e a indicação, por escrito, do fundamento legal da restrição.',
        en: 'If part of the information is legally protected, access to the rest is requested, with the legal ground for the restriction in writing.',
      },
      {
        type: 'paragraph',
        id: 'prazo',
        text: `Solicita-se que a informação seja disponibilizada no prazo legal de ${prazo} dias a contar da recepção do presente pedido.`,
        en: `The information should be provided within the legal period of ${prazo} days from receipt.`,
      },
      ...anexosBlock(v, 'Junta:'),
      { type: 'paragraph', id: 'deferimento', text: 'Pede deferimento.', en: 'Requests approval.', align: 'center', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [autorSignature(ctx, 'O Requerente', 'A Requerente', { roleEmpresa: 'A Requerente' })] },
      ...reciboBlock(v),
    ];
    return blocks;
  },
});
