import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, placeDate, splitLines } from './_shared';
import {
  TRATAMENTO_OPTIONS,
  anexosBlock,
  anexosField,
  autorDesc,
  autorFields,
  autorSignature,
  autorWarnings,
  cleanEntidade,
  despachoBlock,
  despachoField,
  endDot,
  isEmpresa,
  lowerFirst,
  opt,
  str,
} from './_cidadao';

// ---------------------------------------------------------------- Request types

type Tipo = {
  value: string;
  pt: string;
  en: string;
  /** Subject line. */
  assunto: string;
  /** Location fields shown. */
  local?: boolean;
  area?: boolean;
  periodo?: boolean;
  /** Label of the "finalidade" field, when used. */
  finalidade?: [string, string, string?];
  /** The request, continuing "vem requerer a V. Ex.ª …". */
  texto: (x: { loc: string; area: string; fin: string; periodo: string }) => string;
  /** Documents usually asked for. */
  documentos: string;
};

const TIPOS: Tipo[] = [
  {
    value: 'parcela',
    pt: 'Atribuição de parcela de terreno (DUAT em área urbana)',
    en: 'Allocation of a plot (urban land use right)',
    assunto: 'Pedido de atribuição de parcela de terreno',
    local: true,
    area: true,
    finalidade: ['Finalidade', 'Purpose', 'Ex.: construção de habitação própria'],
    texto: ({ loc, area, fin }) =>
      `a atribuição de uma parcela de terreno${area ? ` com a área aproximada de ${area} m²` : ''}, ${loc ? `situada ${loc}` : `em local a indicar pelos serviços`}, destinada a ${fin || BLANK}, com o respectivo direito de uso e aproveitamento da terra`,
    documentos: 'cópia do documento de identificação, NUIT, declaração do bairro, esboço de localização e comprovativo de pagamento da taxa de tramitação',
  },
  {
    value: 'construcao',
    pt: 'Licença de construção',
    en: 'Building permit',
    assunto: 'Pedido de licença de construção',
    local: true,
    finalidade: ['Obra a realizar', 'Works', 'Ex.: construção de moradia unifamiliar de tipo 3'],
    texto: ({ loc, fin }) => `a concessão de licença de construção para ${fin || BLANK}, ${loc ? `no imóvel situado ${loc}` : `no imóvel situado em ${BLANK}`}, de acordo com o projecto que junta`,
    documentos: 'título do DUAT ou documento que o substitua, planta de localização, projecto de arquitectura e especialidades assinado por técnico inscrito, termo de responsabilidade técnica e cópia do documento de identificação',
  },
  {
    value: 'obras',
    pt: 'Obras de pequena dimensão (vedação, muro, reabilitação)',
    en: 'Minor works (fence, wall, renovation)',
    assunto: 'Pedido de autorização para obras de pequena dimensão',
    local: true,
    finalidade: ['Obra a realizar', 'Works', 'Ex.: construção de muro de vedação com 1,80 m de altura'],
    texto: ({ loc, fin }) => `autorização para a execução de ${fin || 'obras de pequena dimensão'}${loc ? ` no imóvel situado ${loc}` : ''}`,
    documentos: 'título do DUAT ou documento que o substitua, croqui ou desenho da obra e cópia do documento de identificação',
  },
  {
    value: 'actividade',
    pt: 'Licença para actividade económica (estabelecimento)',
    en: 'Licence for a business activity (premises)',
    assunto: 'Pedido de licença de actividade',
    local: true,
    finalidade: ['Actividade', 'Activity', 'Ex.: comércio a retalho de produtos alimentares (mercearia)'],
    texto: ({ loc, fin }) => `a concessão de licença para o exercício da actividade de ${fin || BLANK}${loc ? `, no estabelecimento situado ${loc}` : ''}`,
    documentos: 'cópia do documento de identificação ou certidão do registo comercial, NUIT, título ou contrato de arrendamento do espaço e planta ou croqui do estabelecimento',
  },
  {
    value: 'banca',
    pt: 'Banca ou espaço em mercado municipal',
    en: 'Stall in a municipal market',
    assunto: 'Pedido de atribuição de banca no mercado',
    local: true,
    finalidade: ['Produtos a vender', 'Goods to sell', 'Ex.: hortícolas e frutas'],
    texto: ({ loc, fin }) => `a atribuição de uma banca (espaço de venda)${loc ? ` ${loc}` : ` no mercado ${BLANK}`}, para a venda de ${fin || BLANK}`,
    documentos: 'cópia do documento de identificação, declaração do bairro e fotografias tipo passe',
  },
  {
    value: 'viaPublica',
    pt: 'Ocupação temporária da via pública',
    en: 'Temporary use of a public road or pavement',
    assunto: 'Pedido de ocupação temporária da via pública',
    local: true,
    periodo: true,
    finalidade: ['Para quê', 'What for', 'Ex.: colocação de andaimes e depósito de materiais de construção'],
    texto: ({ loc, fin, periodo }) => `autorização para ocupar temporariamente a via pública${loc ? ` ${loc}` : ''}${periodo ? `, ${periodo}` : ''}, para ${fin || BLANK}`,
    documentos: 'croqui da área a ocupar e, sendo o caso, a licença da obra',
  },
  {
    value: 'publicidade',
    pt: 'Licença de publicidade (placa, painel, letreiro)',
    en: 'Advertising licence (sign, billboard)',
    assunto: 'Pedido de licença de publicidade',
    local: true,
    finalidade: ['Suporte e dimensões', 'Sign and size', 'Ex.: um letreiro luminoso de 3 m × 1 m na fachada'],
    texto: ({ loc, fin }) => `licença para a afixação de ${fin || BLANK}${loc ? `, ${loc}` : ''}`,
    documentos: 'desenho ou fotomontagem do suporte com as dimensões, autorização do proprietário do imóvel e cópia do documento de identificação ou da certidão comercial',
  },
  {
    value: 'evento',
    pt: 'Licença para evento, festa ou espectáculo',
    en: 'Licence for an event, party or show',
    assunto: 'Pedido de licença para realização de evento',
    local: true,
    periodo: true,
    finalidade: ['Evento', 'Event', 'Ex.: festa de casamento com música ao vivo, para cerca de 200 convidados'],
    texto: ({ loc, fin, periodo }) => `licença para a realização de ${fin || BLANK}${loc ? `, ${loc}` : ''}${periodo ? `, ${periodo}` : ''}`,
    documentos: 'programa do evento, autorização do proprietário do local e plano de segurança, quando exigido',
  },
  {
    value: 'isencao',
    pt: 'Isenção, redução ou pagamento de taxas em prestações',
    en: 'Fee exemption, reduction or instalments',
    assunto: 'Pedido de isenção ou redução de taxas',
    finalidade: ['Taxa ou imposto', 'Fee or tax', 'Ex.: taxa de licença de construção — processo n.º 245/2026'],
    texto: ({ fin }) => `a isenção ou, não sendo possível, a redução ou o pagamento em prestações de ${fin || BLANK}`,
    documentos: 'documento de cobrança, declaração de carência ou de rendimentos e cópia do documento de identificação',
  },
  {
    value: 'planta',
    pt: 'Planta topográfica ou de localização',
    en: 'Survey or location plan',
    assunto: 'Pedido de emissão de planta',
    local: true,
    finalidade: ['Tipo de planta', 'Type of plan', 'Ex.: planta topográfica'],
    texto: ({ loc, fin }) => `a emissão de ${fin ? lowerFirst(fin) : 'planta de localização'} do imóvel situado ${loc || BLANK}`,
    documentos: 'título do DUAT ou documento que prove a ocupação e cópia do documento de identificação',
  },
  {
    value: 'transmissao',
    pt: 'Averbamento ou transmissão do DUAT (mudança de titular)',
    en: 'Transfer of the land use right (change of holder)',
    assunto: 'Pedido de averbamento de transmissão',
    local: true,
    finalidade: ['Motivo da transmissão', 'Reason for the transfer', 'Ex.: compra das benfeitorias a João Mabunda, por escritura de 3 de Março de 2026'],
    texto: ({ loc, fin }) => `o averbamento, em seu nome, do direito de uso e aproveitamento da terra do imóvel situado ${loc || BLANK}, por ${fin ? lowerFirst(fin) : BLANK}`,
    documentos: 'título do DUAT anterior, escritura ou documento da transmissão, certidão de óbito e habilitação de herdeiros (por herança) e cópia do documento de identificação',
  },
  {
    value: 'cemiterio',
    pt: 'Cemitério (coval, campa perpétua, trasladação)',
    en: 'Cemetery (grave, perpetual plot, transfer of remains)',
    assunto: 'Pedido relativo a sepultura no cemitério municipal',
    finalidade: ['O que pede', 'What you ask', 'Ex.: concessão de campa perpétua para os restos mortais de Maria Cossa, falecida em 2 de Maio de 2026, no Cemitério de Lhanguene'],
    texto: ({ fin }) => (fin ? lowerFirst(fin) : BLANK),
    documentos: 'certidão de óbito, guia de enterro e cópia do documento de identificação do requerente',
  },
  {
    value: 'arvore',
    pt: 'Abate ou poda de árvore',
    en: 'Felling or pruning a tree',
    assunto: 'Pedido de autorização para abate ou poda de árvore',
    local: true,
    finalidade: ['Árvore e motivo', 'Tree and reason', 'Ex.: abate de uma mangueira cujas raízes danificam o muro e a fossa'],
    texto: ({ loc, fin }) => `autorização para ${fin ? lowerFirst(fin) : `o abate de uma árvore`}${loc ? `, ${loc}` : ''}`,
    documentos: 'fotografias da árvore e, se a árvore estiver no terreno de outro, a sua autorização',
  },
  {
    value: 'outro',
    pt: 'Outro pedido',
    en: 'Another request',
    assunto: '',
    local: true,
    texto: () => '',
    documentos: '',
  },
];
const tipoOf = (v: Values) => TIPOS.find((t) => t.value === v.tipo) ?? TIPOS[0];

function localizacao(v: Values): string {
  const parts = [
    str(v.talhao) ? `no talhão/parcela n.º ${str(v.talhao)}` : '',
    str(v.quarteirao) ? `quarteirão ${str(v.quarteirao)}` : '',
    lugar(str(v.localBairro)),
  ].filter(Boolean);
  return parts.join(', ');
}

/** "no bairro X", "na Rua Y", "no Mercado Z" from what the user typed. */
function lugar(s: string): string {
  if (!s) return '';
  if (/^(no|na|nos|nas|em|junto|entre|ao|à)\s/i.test(s)) return s;
  if (/^(rua|avenida|av\.|estrada|praça|travessa)\b/i.test(s)) return `na ${s}`;
  if (/^(bairro|mercado|largo|cemitério|distrito|posto)\b/i.test(s)) return `no ${s}`;
  return `no bairro ${s}`;
}

function periodo(v: Values): string {
  if (!v.dataInicio) return '';
  if (!v.dataFim || v.dataFim === v.dataInicio) return `no dia ${dateLong(v.dataInicio)}`;
  return `de ${dateLong(v.dataInicio)} a ${dateLong(v.dataFim)}`;
}

export default defineTemplate({
  id: 'requerimento-municipal',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'destinatario', title: l('Município', 'Municipality') },
    { id: 'autor', title: l('Requerente', 'Applicant'), personRole: 'outro' },
    { id: 'pedido', title: l('Pedido', 'Request') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'tratamento', type: 'select', section: 'destinatario', width: 'half', label: l('Forma de tratamento', 'Form of address'), options: TRATAMENTO_OPTIONS.slice(0, 4), default: 'Exmo. Senhor' },
    {
      name: 'entidade',
      type: 'text',
      section: 'destinatario',
      required: true,
      label: l('Cargo de quem decide', 'Position of the decision-maker'),
      help: l(
        'Normalmente o Presidente do Conselho Municipal. Alguns pedidos vão ao Vereador do pelouro (Urbanização, Mercados e Feiras…) ou ao Administrador do Distrito Municipal. Nas vilas sem município, ao Administrador do Distrito.',
        'Usually the Mayor (Presidente do Conselho Municipal). Some requests go to the councillor in charge or the municipal district administrator. In towns without a municipality, the District Administrator.',
      ),
      default: (c) => `Presidente do Conselho Municipal da Cidade de ${c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo'}`,
    },
    { name: 'destinatarioLocal', type: 'text', section: 'destinatario', width: 'half', label: l('Cidade', 'City'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    ...autorFields(['nome', 'genero', 'estadoCivil', 'nacionalidade', 'profissao', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada', 'telefone', 'email'], { empresa: true, required: ['nome'] }),
    {
      name: 'tipo',
      type: 'select',
      section: 'pedido',
      required: true,
      label: l('Tipo de pedido', 'Type of request'),
      options: TIPOS.map((t) => opt(t.value, t.pt, t.en)),
      default: 'parcela',
    },
    {
      name: 'finalidade',
      type: 'text',
      section: 'pedido',
      label: l('Finalidade / objecto', 'Purpose / object'),
      help: l('O texto muda com o tipo de pedido; veja o exemplo no campo.', 'The wording changes with the request type; see the example in the field.'),
      placeholder: l('Ex.: construção de habitação própria', 'E.g. building a family home'),
      showIf: (v) => v.tipo !== 'outro',
    },
    {
      name: 'pedidoOutro',
      type: 'textarea',
      section: 'pedido',
      rows: 3,
      label: l('O que pede', 'What you request'),
      help: l('Continua a frase «vem requerer a V. Ex.ª…». Ex.: «a emissão de certidão de não dívida de taxas municipais».', 'Continues “requests Your Excellency…”.'),
      showIf: (v) => v.tipo === 'outro',
    },
    { name: 'localBairro', type: 'text', section: 'pedido', label: l('Bairro, rua ou mercado', 'Neighbourhood, street or market'), placeholder: l('Ex.: bairro de Magoanine C, Distrito Municipal KaMubukwana', 'E.g. Magoanine C'), showIf: (v) => Boolean(tipoOf(v).local) },
    { name: 'quarteirao', type: 'text', section: 'pedido', width: 'half', label: l('Quarteirão', 'Block'), showIf: (v) => Boolean(tipoOf(v).local) },
    { name: 'talhao', type: 'text', section: 'pedido', width: 'half', label: l('Talhão / parcela n.º', 'Plot no.'), showIf: (v) => Boolean(tipoOf(v).local) },
    { name: 'area', type: 'number', section: 'pedido', width: 'half', min: 1, label: l('Área aproximada (m²)', 'Approximate area (m²)'), showIf: (v) => Boolean(tipoOf(v).area) },
    { name: 'dataInicio', type: 'date', section: 'pedido', width: 'half', label: l('Data de início', 'Start date'), showIf: (v) => Boolean(tipoOf(v).periodo) },
    { name: 'dataFim', type: 'date', section: 'pedido', width: 'half', label: l('Data de fim', 'End date'), showIf: (v) => Boolean(tipoOf(v).periodo) },
    { name: 'processo', type: 'text', section: 'pedido', width: 'half', label: l('Processo anterior n.º (opcional)', 'Earlier file no. (optional)') },
    {
      name: 'fundamentacao',
      type: 'textarea',
      section: 'pedido',
      rows: 4,
      label: l('Fundamentação', 'Grounds'),
      help: l('Os factos que justificam o pedido, um por linha: há quanto tempo ocupa o terreno, o agregado familiar, a situação económica, prazos.', 'The facts behind the request, one per line.'),
    },
    anexosField('pedido'),
    despachoField('documento'),
    localField('documento'),
    dateField('data'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx, { doc: true, morada: true });
    const t = tipoOf(v);
    if (!str(v.entidade)) w.push({ level: 'warning', field: 'entidade', message: l('Indique a quem se dirige o requerimento.', 'State who the request is addressed to.') });
    if (t.value === 'outro' && !str(v.pedidoOutro)) w.push({ level: 'warning', field: 'pedidoOutro', message: l('Escreva o pedido.', 'Write the request.') });
    if (t.value !== 'outro' && t.finalidade && !str(v.finalidade)) w.push({ level: 'warning', field: 'finalidade', message: l(`Preencha «${t.finalidade[0]}».`, `Fill in “${t.finalidade[1]}”.`) });
    if (t.documentos) {
      w.push({ level: 'info', field: 'anexos', message: l(`Documentos que os municípios costumam pedir: ${t.documentos}. Confirme a lista no balcão de atendimento.`, 'Check the usual supporting documents at the municipal desk.') });
    }
    if (t.value === 'construcao' || t.value === 'obras') {
      w.push({
        level: 'info',
        field: 'tipo',
        message: l(
          `As obras em área urbana precisam de licença municipal (${cite('cidLicencaObra')}). Muitos municípios exigem impresso próprio, vendido no balcão; use este requerimento quando o município aceita requerimento livre ou para o acompanhar.`,
          'Urban building works need a municipal permit. Many municipalities require their own form; use this request where a free-form request is accepted or as a cover letter.',
        ),
      });
    }
    if (t.value === 'parcela' || t.value === 'transmissao') {
      w.push({
        level: 'info',
        field: 'tipo',
        message: l(
          `A terra é propriedade do Estado: o município atribui o direito de uso e aproveitamento, não vende a terra (${cite('cidSoloUrbano')}). Fora da área do município, use o «Pedido de DUAT».`,
          'Land belongs to the State: the municipality grants a use right, it does not sell land. Outside the municipal area, use the land use right application.',
        ),
      });
    }
    if (t.value === 'evento') {
      w.push({ level: 'info', field: 'tipo', message: l('Para uma reunião pública ou manifestação use o «Aviso prévio de reunião ou manifestação»: a lei pede aviso, não licença.', 'For a public meeting or demonstration use the prior notice document: the law requires notice, not a licence.') });
    }
    if (t.periodo && v.dataInicio && v.dataFim && v.dataFim < v.dataInicio) w.push({ level: 'warning', field: 'dataFim', message: l('A data de fim é anterior à de início.', 'The end date is before the start date.') });
    if (!splitLines(v.fundamentacao).length) {
      w.push({ level: 'info', field: 'fundamentacao', message: l(`O requerimento deve expor os factos em que se baseia o pedido (${cite('requerimentoConteudo')}).`, 'The request should set out the facts it is based on.') });
    }
    return w;
  },

  personName: (v) => (v.autorTipo === 'empresa' ? undefined : v.autorNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const t = tipoOf(v);
    const tratamento = str(v.tratamento) || 'Exmo. Senhor';
    const entidade = cleanEntidade(str(v.entidade), tratamento) || BLANK;
    const area = Number(v.area) > 0 ? new Intl.NumberFormat('pt-PT').format(Number(v.area)) : '';
    const pedido =
      t.value === 'outro'
        ? str(v.pedidoOutro) ? lowerFirst(str(v.pedidoOutro).replace(/\.$/, '')) : BLANK
        : t.texto({ loc: localizacao(v), area, fin: str(v.finalidade).replace(/\.$/, ''), periodo: periodo(v) });
    const fundamentos = splitLines(v.fundamentacao);
    const assunto = t.value === 'outro' ? '' : t.assunto;

    const blocks: Block[] = [
      despachoBlock(v),
      { type: 'recipient', salutation: tratamento, lines: [entidade, str(v.destinatarioLocal).toUpperCase()].filter(Boolean) },
    ];
    if (assunto || str(v.processo)) blocks.push({ type: 'subject', text: [assunto, str(v.processo) ? `Processo n.º ${str(v.processo)}` : ''].filter(Boolean).join(' — ') });
    blocks.push({
      type: 'paragraph',
      id: 'pedido',
      text: `${autorDesc(ctx, { upper: true, contactos: true })}, vem, mui respeitosamente, requerer a V. Ex.ª ${endDot(pedido)}`,
      en: 'The applicant, identified above, respectfully requests Your Excellency what is stated.',
    });
    if (fundamentos.length === 1) {
      blocks.push({ type: 'paragraph', id: 'fundamentacao', text: `O pedido fundamenta-se no seguinte: ${endDot(lowerFirst(fundamentos[0]))}`, en: 'The request is based on the grounds stated.' });
    } else if (fundamentos.length > 1) {
      blocks.push(
        { type: 'paragraph', id: 'fundamentacao', text: 'O pedido fundamenta-se no seguinte:', en: 'The request is based on the following:', keepWithNext: true },
        { type: 'list', style: 'numeric', items: fundamentos.map(endDot) },
      );
    }
    if (t.value !== 'isencao' && t.value !== 'outro' && t.value !== 'cemiterio') {
      blocks.push({
        type: 'paragraph',
        id: 'compromisso',
        text: isEmpresa(ctx)
          ? 'A requerente compromete-se a cumprir as posturas e regulamentos municipais aplicáveis e a pagar as taxas devidas.'
          : `${ga(v)} compromete-se a cumprir as posturas e regulamentos municipais aplicáveis e a pagar as taxas devidas.`,
        en: 'The applicant undertakes to comply with the applicable municipal by-laws and to pay the fees due.',
      });
    }
    blocks.push(...anexosBlock(v, 'Junta:'));
    blocks.push(
      { type: 'paragraph', id: 'deferimento', text: 'Pede deferimento.', en: 'Requests approval.', align: 'center', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [autorSignature(ctx, 'O Requerente', 'A Requerente', { roleEmpresa: 'A Requerente' })] },
    );
    return blocks;
  },
});

/** "O requerente" / "A requerente". */
function ga(v: Values): string {
  return v.autorGenero === 'F' ? 'A requerente' : 'O requerente';
}
