import { defineTemplate, type Block, type Values, type Warning } from '../model';
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
  despachoBlock,
  despachoField,
  endDot,
  isEmpresa,
  lowerFirst,
  opt,
  str,
} from './_cidadao';

const MODALIDADES = [
  opt('autorizacao', 'Novo pedido (autorização do DUAT)', 'New application (grant of the right)'),
  opt('boaFe', 'Titulação de ocupação de boa-fé', 'Title for good-faith occupation'),
  opt('costume', 'Titulação de ocupação segundo as normas costumeiras', 'Title for customary occupation'),
  opt('renovacao', 'Renovação do DUAT', 'Renewal of the right'),
];

const ASSUNTO: Record<string, string> = {
  autorizacao: 'Pedido de autorização do direito de uso e aproveitamento da terra (DUAT)',
  boaFe: 'Pedido de titulação do DUAT adquirido por ocupação de boa-fé',
  costume: 'Pedido de titulação do DUAT adquirido por ocupação costumeira',
  renovacao: 'Pedido de renovação do direito de uso e aproveitamento da terra (DUAT)',
};

const FINALIDADES = [
  opt('habitação própria', 'Habitação própria', 'Own home'),
  opt('agricultura familiar', 'Agricultura familiar', 'Family farming'),
  opt('actividade agro-pecuária', 'Actividade agro-pecuária comercial', 'Commercial farming / livestock'),
  opt('actividade comercial', 'Comércio ou serviços', 'Trade or services'),
  opt('actividade industrial', 'Indústria', 'Industry'),
  opt('actividade turística', 'Turismo', 'Tourism'),
  opt('outro', 'Outra', 'Other'),
];

const economica = (v: Values) => !['habitação própria', 'agricultura familiar'].includes(String(v.finalidade ?? ''));

function localizacao(v: Values): string {
  const parts = [
    str(v.terrenoBairro) ? str(v.terrenoBairro).charAt(0).toUpperCase() + str(v.terrenoBairro).slice(1) : '',
    str(v.terrenoLocalidade) ? `localidade de ${str(v.terrenoLocalidade)}` : '',
    str(v.terrenoPosto) ? `Posto Administrativo de ${str(v.terrenoPosto)}` : '',
    str(v.terrenoDistrito) ? `Distrito de ${str(v.terrenoDistrito)}` : '',
    str(v.terrenoProvincia) ? `Província de ${str(v.terrenoProvincia)}` : '',
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : BLANK;
}

function area(v: Values): string {
  const n = Number(v.area);
  if (!(n > 0)) return `${BLANK} ${v.areaUnidade === 'm²' ? 'm²' : 'hectares'}`;
  const txt = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 4 }).format(n);
  return v.areaUnidade === 'm²' ? `${txt} m²` : `${txt} ${n === 1 ? 'hectare' : 'hectares'}`;
}

export default defineTemplate({
  id: 'pedido-de-duat',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'destinatario', title: l('Entidade que decide', 'Deciding authority') },
    { id: 'autor', title: l('Requerente', 'Applicant'), personRole: 'outro' },
    { id: 'terreno', title: l('Terreno', 'Land') },
    { id: 'pedido', title: l('Pedido e uso da terra', 'Request and land use') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'tratamento', type: 'select', section: 'destinatario', width: 'half', label: l('Forma de tratamento', 'Form of address'), options: TRATAMENTO_OPTIONS.slice(0, 6), default: 'Exmo. Senhor' },
    {
      name: 'entidade',
      type: 'text',
      section: 'destinatario',
      required: true,
      label: l('Cargo de quem decide', 'Position of the decision-maker'),
      help: l(
        'Na área de um município: Presidente do Conselho Municipal. Fora dela: Governador da Província (até 1.000 ha), Ministro que superintende a área da terra (1.000 a 10.000 ha) ou Conselho de Ministros (acima). O pedido entrega-se nos serviços de cadastro (SDAE do distrito ou Serviços Provinciais de Geografia e Cadastro).',
        'In a municipal area: the Mayor. Elsewhere: the Provincial Governor (up to 1,000 ha), the land minister (1,000–10,000 ha) or the Council of Ministers. File it at the cadastre services.',
      ),
      default: (c) => `Presidente do Conselho Municipal da Cidade de ${c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo'}`,
    },
    { name: 'destinatarioLocal', type: 'text', section: 'destinatario', width: 'half', label: l('Cidade', 'City'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    ...autorFields(['nome', 'genero', 'estadoCivil', 'nacionalidade', 'naturalidade', 'profissao', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada', 'telefone', 'email'], { empresa: true, required: ['nome'] }),
    { name: 'terrenoBairro', type: 'text', section: 'terreno', label: l('Povoação, bairro ou lugar', 'Village, neighbourhood or place'), placeholder: l('Ex.: povoação de Mahubo, junto à EN2', 'E.g. Mahubo village, by the EN2') },
    { name: 'terrenoLocalidade', type: 'text', section: 'terreno', width: 'half', label: l('Localidade', 'Locality') },
    { name: 'terrenoPosto', type: 'text', section: 'terreno', width: 'half', label: l('Posto Administrativo', 'Administrative post') },
    { name: 'terrenoDistrito', type: 'text', section: 'terreno', width: 'half', label: l('Distrito', 'District') },
    { name: 'terrenoProvincia', type: 'text', section: 'terreno', width: 'half', label: l('Província', 'Province') },
    { name: 'area', type: 'number', section: 'terreno', width: 'half', min: 0, label: l('Área', 'Area'), required: true },
    { name: 'areaUnidade', type: 'radio', section: 'terreno', width: 'half', label: l('Unidade', 'Unit'), options: [opt('ha', 'Hectares', 'Hectares'), opt('m²', 'm²', 'm²')], default: 'ha' },
    { name: 'confNorte', type: 'text', section: 'terreno', width: 'half', label: l('Confronta a Norte com', 'Bounded to the North by') },
    { name: 'confSul', type: 'text', section: 'terreno', width: 'half', label: l('A Sul com', 'South') },
    { name: 'confEste', type: 'text', section: 'terreno', width: 'half', label: l('A Este com', 'East') },
    { name: 'confOeste', type: 'text', section: 'terreno', width: 'half', label: l('A Oeste com', 'West') },
    { name: 'coordenadas', type: 'text', section: 'terreno', label: l('Coordenadas (opcional)', 'Coordinates (optional)'), placeholder: l('Ex.: 25°58′12″ S, 32°27′40″ E', 'E.g. 25°58′12″ S, 32°27′40″ E') },
    { name: 'modalidade', type: 'select', section: 'pedido', required: true, label: l('Tipo de pedido', 'Type of application'), options: MODALIDADES, default: 'autorizacao' },
    { name: 'anosOcupacao', type: 'number', section: 'pedido', width: 'half', min: 0, label: l('Há quantos anos ocupa o terreno', 'Years of occupation'), showIf: (v) => v.modalidade === 'boaFe' || v.modalidade === 'costume' },
    { name: 'tituloAnterior', type: 'text', section: 'pedido', width: 'half', label: l('Título / processo n.º', 'Title / file no.'), showIf: (v) => v.modalidade === 'renovacao' },
    { name: 'finalidade', type: 'select', section: 'pedido', width: 'half', required: true, label: l('Uso da terra', 'Land use'), options: FINALIDADES, default: 'habitação própria' },
    { name: 'finalidadeOutra', type: 'text', section: 'pedido', label: l('Descreva o uso', 'Describe the use'), showIf: (v) => v.finalidade === 'outro' },
    {
      name: 'plano',
      type: 'textarea',
      section: 'pedido',
      rows: 4,
      label: l('Plano de exploração (resumo)', 'Exploitation plan (summary)'),
      help: l('Para actividades económicas: o que vai fazer, em que prazo, investimento e empregos previstos. Um ponto por linha. O plano completo vai em anexo.', 'For economic activities: what, when, investment and jobs. One point per line; the full plan is attached.'),
      showIf: economica,
    },
    {
      name: 'fundamentacao',
      type: 'textarea',
      section: 'pedido',
      rows: 3,
      label: l('Outros factos (opcional)', 'Other facts (optional)'),
      help: l('Ex.: como obteve o terreno, quem o cedeu, se há benfeitorias, se a comunidade concorda.', 'E.g. how you got the land, improvements, community agreement.'),
    },
    anexosField('pedido', l('Ex.: Esboço de localização do terreno', 'E.g. Location sketch')),
    despachoField('documento'),
    localField('documento'),
    dateField('data'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx, { doc: true, morada: true });
    if (!str(v.entidade)) w.push({ level: 'warning', field: 'entidade', message: l('Indique a entidade que decide.', 'State the deciding authority.') });
    if (!(Number(v.area) > 0)) w.push({ level: 'warning', field: 'area', message: l('Indique a área do terreno.', 'State the land area.') });
    w.push({
      level: 'info',
      field: 'entidade',
      message: l(
        `Quem decide depende do local e da área (${cite('cidDuatCompetencia')}). Os serviços de cadastro usam impressos próprios e pedem esboço, memória descritiva, parecer do Administrador e acta da consulta às comunidades (${cite('cidDuatPedido')}); este requerimento acompanha esse processo.`,
        'Who decides depends on place and size. The cadastre services use their own forms and ask for a sketch, description, the administrator’s opinion and community consultation minutes; this request goes with that file.',
      ),
    });
    if (v.modalidade === 'boaFe') {
      const anos = ctx.legal.value<{ anos: number }>('duatOcupacaoBoaFe').anos;
      if (Number(v.anosOcupacao) > 0 && Number(v.anosOcupacao) < anos) {
        w.push({ level: 'warning', field: 'anosOcupacao', message: l(`A ocupação de boa-fé só dá direito ao DUAT ao fim de ${anos} anos (${cite('duatOcupacaoBoaFe')}). Com menos tempo, faça um novo pedido.`, `Good-faith occupation gives a right only after ${anos} years. With less, make a new application.`) });
      }
      if (str(v.autorNacionalidade) && !/mo[cç]ambican/i.test(str(v.autorNacionalidade))) {
        w.push({ level: 'warning', field: 'autorNacionalidade', message: l('A aquisição por ocupação de boa-fé é reservada a pessoas singulares nacionais.', 'Acquisition by good-faith occupation is reserved for Mozambican individuals.') });
      }
    }
    if (economica(v)) {
      const p = ctx.legal.value<{ nacionaisAnos: number; estrangeirosAnos: number }>('cidDuatProvisorio');
      w.push({
        level: 'info',
        field: 'plano',
        message: l(
          `Para actividades económicas a autorização é primeiro provisória (até ${p.nacionaisAnos} anos para nacionais e ${p.estrangeirosAnos} para estrangeiros) e torna-se definitiva quando o plano de exploração é cumprido (${cite('cidDuatProvisorio')}). Junte o plano de exploração.`,
          `For economic activities the authorisation is first provisional (up to ${p.nacionaisAnos} years for nationals, ${p.estrangeirosAnos} for foreigners); attach the exploitation plan.`,
        ),
      });
      if (v.modalidade === 'autorizacao' && !/^presidente do conselho municipal/i.test(str(v.entidade))) {
        w.push({ level: 'info', field: 'anexos', message: l(`Fora das cidades e vilas, o pedido exige consulta às comunidades locais (${cite('consultaComunitariaDuat')}). Junte a acta da consulta.`, 'Outside towns, the application needs a community consultation; attach the minutes.') });
      }
    }
    return w;
  },

  personName: (v) => (v.autorTipo === 'empresa' ? undefined : v.autorNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const tratamento = str(v.tratamento) || 'Exmo. Senhor';
    const entidade = cleanEntidade(str(v.entidade), tratamento) || BLANK;
    const fin = v.finalidade === 'outro' ? lowerFirst(str(v.finalidadeOutra)) || BLANK : String(v.finalidade || BLANK);
    const loc = localizacao(v);
    const anos = Number(v.anosOcupacao) > 0 ? Math.round(Number(v.anosOcupacao)) : 0;

    let pedido: string;
    switch (v.modalidade) {
      case 'boaFe':
        pedido = `o reconhecimento e a titulação do direito de uso e aproveitamento da terra que adquiriu por ocupação de boa-fé${anos ? `, há ${anos} anos,` : ''} sobre o terreno abaixo identificado`;
        break;
      case 'costume':
        pedido = `o reconhecimento e a titulação do direito de uso e aproveitamento da terra que ocupa segundo as normas e práticas costumeiras${anos ? `, há ${anos} anos,` : ''} sobre o terreno abaixo identificado`;
        break;
      case 'renovacao':
        pedido = `a renovação do direito de uso e aproveitamento da terra${str(v.tituloAnterior) ? ` titulado pelo título/processo n.º ${str(v.tituloAnterior)}` : ''}, sobre o terreno abaixo identificado`;
        break;
      default:
        pedido = 'a autorização do direito de uso e aproveitamento da terra sobre o terreno abaixo identificado';
    }

    const conf = [
      ['Norte', str(v.confNorte)],
      ['Sul', str(v.confSul)],
      ['Este', str(v.confEste)],
      ['Oeste', str(v.confOeste)],
    ];
    const terreno = [
      { label: 'Localização', value: str(v.coordenadas) ? `${loc} (coordenadas ${str(v.coordenadas)})` : loc },
      { label: 'Área', value: area(v) },
      { label: 'Confrontações', value: conf.map(([k, x]) => `${k}: ${x || BLANK}`).join('; ') },
    ];
    const plano = economica(v) ? splitLines(v.plano) : [];
    const fundamentos = splitLines(v.fundamentacao);

    const blocks: Block[] = [
      despachoBlock(v),
      { type: 'recipient', salutation: tratamento, lines: [entidade, str(v.destinatarioLocal).toUpperCase()].filter(Boolean) },
      { type: 'subject', text: ASSUNTO[String(v.modalidade)] ?? ASSUNTO.autorizacao },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${autorDesc(ctx, { upper: true, contactos: true })}, vem, mui respeitosamente, requerer a V. Ex.ª ${pedido}, destinado a ${fin}.`,
        en: 'The applicant respectfully requests the land use right over the plot identified below.',
      },
      { type: 'keyValue', title: 'Identificação do terreno', columns: 1, items: terreno },
    ];
    if (plano.length) {
      blocks.push(
        { type: 'paragraph', id: 'plano', text: 'O plano de exploração prevê, em resumo:', en: 'The exploitation plan provides, in summary:', keepWithNext: true },
        { type: 'list', style: 'bullet', items: plano.map(endDot) },
      );
    }
    if (fundamentos.length) {
      blocks.push(
        { type: 'paragraph', id: 'fundamentacao', text: fundamentos.length === 1 ? `Mais se informa que ${endDot(lowerFirst(fundamentos[0]))}` : 'Mais se informa o seguinte:', en: 'The applicant further states the following.', keepWithNext: fundamentos.length > 1 },
      );
      if (fundamentos.length > 1) blocks.push({ type: 'list', style: 'numeric', items: fundamentos.map(endDot) });
    }
    blocks.push({
      type: 'paragraph',
      id: 'compromisso',
      text: `${isEmpresa(ctx) ? 'A requerente' : v.autorGenero === 'F' ? 'A requerente' : 'O requerente'} declara que, tanto quanto sabe, o terreno não está ocupado por terceiros nem em zona de protecção, e compromete-se a respeitar os direitos das comunidades locais, os limites e o uso autorizado, e a pagar as taxas devidas.`,
      en: 'The applicant declares that, to their knowledge, the land is not occupied by others or in a protected zone, and undertakes to respect community rights, the boundaries and the authorised use, and to pay the fees due.',
    });
    blocks.push(...anexosBlock(v, 'Junta:'));
    blocks.push(
      { type: 'paragraph', id: 'deferimento', text: 'Pede deferimento.', en: 'Requests approval.', align: 'center', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [autorSignature(ctx, 'O Requerente', 'A Requerente', { roleEmpresa: 'A Requerente' })] },
    );
    return blocks;
  },
});
