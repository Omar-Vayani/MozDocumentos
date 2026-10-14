import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, lineItems, localField, placeDate } from './_shared';
import { TRATAMENTO_OPTIONS, cleanEntidade, daysBetween, joinE, lowerFirst, opt, reciboBlock, reciboField, str } from './_cidadao';

const TIPOS = [
  opt('manifestação', 'Manifestação', 'Demonstration'),
  opt('marcha', 'Marcha ou desfile', 'March or parade'),
  opt('reunião', 'Reunião pública', 'Public meeting'),
  opt('comício', 'Comício', 'Rally'),
  opt('vigília', 'Vigília', 'Vigil'),
];
const ART: Record<string, string> = { manifestação: 'a', marcha: 'a', reunião: 'a', comício: 'o', vigília: 'a' };
const promotores = (v: Values) => lineItems(v.promotores).filter((r) => str(r.nome));

export default defineTemplate({
  id: 'aviso-previo-manifestacao',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'destinatario', title: l('Autoridade', 'Authority') },
    { id: 'promotores', title: l('Promotores', 'Organisers') },
    { id: 'evento', title: l('Reunião ou manifestação', 'Meeting or demonstration') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'tratamento', type: 'select', section: 'destinatario', width: 'half', label: l('Forma de tratamento', 'Form of address'), options: TRATAMENTO_OPTIONS.slice(0, 4), default: 'Exmo. Senhor' },
    {
      name: 'entidade',
      type: 'text',
      section: 'destinatario',
      required: true,
      label: l('Autoridade civil do local', 'Local civil authority'),
      help: l('Na cidade ou vila com município: Presidente do Conselho Municipal. Fora dele: Administrador do Distrito.', 'In a municipality: the Mayor. Elsewhere: the District Administrator.'),
      default: (c) => `Presidente do Conselho Municipal da Cidade de ${c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo'}`,
    },
    { name: 'destinatarioLocal', type: 'text', section: 'destinatario', width: 'half', label: l('Cidade', 'City'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'organizacao', type: 'text', section: 'promotores', label: l('Organização promotora (opcional)', 'Organising body (optional)'), placeholder: l('Ex.: Associação dos Vendedores do Mercado do Peixe', 'E.g. a traders’ association') },
    {
      name: 'promotores',
      type: 'lines',
      section: 'promotores',
      label: l('Promotores', 'Organisers'),
      addLabel: l('Adicionar promotor', 'Add organiser'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome completo', 'Full name') },
        { name: 'doc', type: 'text', label: l('BI n.º', 'ID no.') },
        { name: 'morada', type: 'text', label: l('Residência', 'Residence') },
        { name: 'telefone', type: 'tel', label: l('Telefone', 'Phone') },
      ],
      default: [],
    },
    { name: 'tipo', type: 'select', section: 'evento', width: 'half', label: l('Tipo', 'Type'), options: TIPOS, default: 'manifestação' },
    { name: 'objecto', type: 'text', section: 'evento', required: true, label: l('Objectivo', 'Purpose'), placeholder: l('Ex.: exigir a reabilitação da estrada de acesso ao bairro', 'E.g. to demand the repair of the access road') },
    { name: 'dataEvento', type: 'date', section: 'evento', width: 'half', required: true, label: l('Data', 'Date') },
    { name: 'horaInicio', type: 'text', section: 'evento', width: 'half', label: l('Hora de início', 'Start time'), placeholder: l('Ex.: 08h00', 'E.g. 08:00') },
    { name: 'horaFim', type: 'text', section: 'evento', width: 'half', label: l('Hora de fim', 'End time'), placeholder: l('Ex.: 12h00', 'E.g. 12:00') },
    { name: 'participantes', type: 'number', section: 'evento', width: 'half', min: 1, label: l('Participantes previstos', 'Expected participants') },
    { name: 'localEvento', type: 'text', section: 'evento', required: true, label: l('Local (ou ponto de concentração)', 'Place (or assembly point)'), placeholder: l('Ex.: Praça da Independência', 'E.g. Independence Square') },
    { name: 'trajecto', type: 'textarea', section: 'evento', rows: 2, label: l('Trajecto (marcha ou desfile)', 'Route (march or parade)'), help: l('Ruas por onde passa e local de chegada.', 'Streets and end point.'), showIf: (v) => v.tipo === 'marcha' || v.tipo === 'manifestação' },
    { name: 'servicoOrdem', type: 'text', section: 'evento', label: l('Responsável pelo serviço de ordem (opcional)', 'Stewarding contact (optional)'), placeholder: l('Ex.: Lurdes Macamo, telefone 84 765 4321', 'E.g. name and phone') },
    { name: 'copiaPolicia', type: 'toggle', section: 'evento', default: true, label: l('Indicar cópia ao Comando da PRM', 'Copy to the police command') },
    { name: 'comando', type: 'text', section: 'evento', label: l('Comando da PRM', 'Police command'), default: (c) => `Comando da PRM da Cidade de ${c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo'}`, showIf: (v) => v.copiaPolicia !== false },
    localField('documento'),
    dateField('data'),
    reciboField('documento'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const lei = ctx.legal.value<{ diasUteis: number; promotores: number }>('cidManifestacaoAviso');
    if (!str(v.entidade)) w.push({ level: 'warning', field: 'entidade', message: l('Indique a autoridade civil do local.', 'State the local civil authority.') });
    if (promotores(v).length < lei.promotores) {
      w.push({ level: 'warning', field: 'promotores', message: l(`Identifique pelo menos ${lei.promotores} promotores com nome, BI e residência; todos assinam o aviso (${cite('cidManifestacaoAviso')}).`, `Identify at least ${lei.promotores} organisers with name, ID and residence; all sign.`) });
    }
    const d = daysBetween(v.data, v.dataEvento);
    if (d != null && d < lei.diasUteis + 2) {
      w.push({ level: 'warning', field: 'dataEvento', message: l(`O aviso deve ser entregue com a antecedência mínima de ${lei.diasUteis} dias úteis (${cite('cidManifestacaoAviso')}). Confirme que há dias úteis suficientes até ${dateLong(v.dataEvento)}.`, `Notice must be given at least ${lei.diasUteis} working days ahead.`) });
    } else {
      w.push({ level: 'info', field: 'dataEvento', message: l(`É um aviso, não um pedido de autorização: entregue-o com pelo menos ${lei.diasUteis} dias úteis de antecedência e guarde a cópia carimbada. A autoridade só pode impedir a realização nos casos previstos na lei, por escrito e com fundamento.`, `It is a notice, not a request for permission: give it at least ${lei.diasUteis} working days ahead and keep the stamped copy.`) });
    }
    return w;
  },

  personName: (v) => v.organizacao || promotores(v)[0]?.nome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const tratamento = str(v.tratamento) || 'Exmo. Senhor';
    const entidade = cleanEntidade(str(v.entidade), tratamento) || BLANK;
    const ps = promotores(v);
    const tipo = String(v.tipo || 'manifestação');
    const pl = ps.length !== 1;
    const art = ART[tipo] ?? 'a';
    const quem = ps.length
      ? joinE(ps.map((p) => `**${str(p.nome)}**${str(p.doc) ? `, BI n.º ${str(p.doc)}` : ''}${str(p.morada) ? `, residente em ${str(p.morada)}` : ''}${str(p.telefone) ? `, telefone ${str(p.telefone)}` : ''}`))
      : `${BLANK}, ${BLANK} e ${BLANK}`;
    const horario = [str(v.horaInicio) ? `das ${str(v.horaInicio)}` : '', str(v.horaFim) ? `às ${str(v.horaFim)}` : ''].filter(Boolean).join(' ');

    const dados = [
      { label: 'Data', value: v.dataEvento ? dateLong(v.dataEvento) : BLANK },
      { label: 'Horário', value: horario || BLANK },
      { label: tipo === 'marcha' ? 'Concentração' : 'Local', value: str(v.localEvento) || BLANK },
      ...(str(v.trajecto) && (tipo === 'marcha' || tipo === 'manifestação') ? [{ label: 'Trajecto', value: str(v.trajecto).replace(/\n+/g, '; ') }] : []),
      ...(Number(v.participantes) > 0 ? [{ label: 'Participantes previstos', value: `cerca de ${Math.round(Number(v.participantes))}` }] : []),
      ...(str(v.servicoOrdem) ? [{ label: 'Serviço de ordem', value: str(v.servicoOrdem) }] : []),
    ];

    const blocks: Block[] = [
      { type: 'recipient', salutation: tratamento, lines: [entidade, str(v.destinatarioLocal).toUpperCase()].filter(Boolean) },
      { type: 'subject', text: `Aviso prévio de ${tipo}` },
      {
        type: 'paragraph',
        id: 'aviso',
        text: `${pl ? 'Os abaixo-assinados' : 'O abaixo-assinado'}, ${quem}${str(v.organizacao) ? `, em nome da organização ${str(v.organizacao)}` : ''}, na qualidade de ${pl ? 'promotores, vêm' : 'promotor, vem'}, no exercício do direito de reunião e de manifestação reconhecido pela Constituição da República e nos termos da ${cite('cidManifestacaoAviso')}, comunicar a V. Ex.ª que se realizará ${art} ${tipo} abaixo indicad${art}, com o objectivo de ${lowerFirst(str(v.objecto).replace(/\.$/, '')) || BLANK}.`,
        en: 'The organisers give notice, under the Constitution and the law on assembly and demonstration, of the event described below.',
      },
      { type: 'keyValue', columns: 1, items: dados },
      {
        type: 'paragraph',
        id: 'compromisso',
        text: `${art === 'o' ? 'O' : 'A'} ${tipo} terá carácter pacífico e decorrerá sem armas. Os promotores assegurarão um serviço de ordem, respeitarão o trajecto e o horário indicados e colaborarão com as autoridades policiais na manutenção da ordem e da segurança.`,
        en: 'The event will be peaceful and unarmed; the organisers will provide stewards and cooperate with the police.',
      },
      {
        type: 'paragraph',
        id: 'pedido',
        text: 'Solicita-se a V. Ex.ª que dê conhecimento do presente aviso às autoridades policiais competentes, para os efeitos convenientes.',
        en: 'Please inform the competent police authorities.',
        keepWithNext: true,
      },
    ];
    const cols: SignatureColumn[] = (ps.length ? ps : [{ nome: '' }, { nome: '' }, { nome: '' }]).map((p) => ({ role: 'Promotor', name: str(p.nome) || undefined }));
    for (let i = 0; i < cols.length; i += 3) {
      blocks.push({ type: 'signatures', placeDate: i === 0 ? placeDate(ctx, v.data) : undefined, columns: cols.slice(i, i + 3) });
    }
    if (v.copiaPolicia !== false) blocks.push({ type: 'paragraph', id: 'copia', text: `C/c: ${str(v.comando) || 'Comando da PRM'}`, size: 'small', align: 'left', en: 'Copy to the police command.' });
    blocks.push(...reciboBlock(v));
    return blocks;
  },
});
