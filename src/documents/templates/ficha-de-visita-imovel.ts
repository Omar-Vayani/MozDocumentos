// Ficha de visita: the visitor confirms by signing that the listed properties
// were shown by the agency on the date stated. It is the agency's evidence
// that it introduced the client (basis for the commission).

import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateLong, DOC_TIPO_OPTIONS, l, lineItems, money } from './_shared';
import { int, semPonto, str } from './_contratos';
import { mt } from './_construcao';

export default defineTemplate({
  id: 'ficha-de-visita-imovel',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Ficha', 'Record') },
    { id: 'visitante', title: l('Visitante', 'Visitor'), personRole: 'cliente' },
    { id: 'imoveis', title: l('Imóveis visitados', 'Properties viewed') },
  ],
  fields: [
    { name: 'numero', type: 'text', section: 'documento', width: 'half', label: l('Ficha n.º', 'Record no.'), default: (c) => c.nextRef },
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data', 'Date'), default: (c) => c.today },
    { name: 'agenteNome', type: 'text', section: 'documento', width: 'half', required: true, label: l('Agente que acompanhou', 'Agent'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Cidade', 'City'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },

    { name: 'visitanteNome', type: 'text', section: 'visitante', required: true, label: l('Nome do visitante', 'Visitor’s name'), personKey: 'nome' },
    { name: 'visitanteDocTipo', type: 'select', section: 'visitante', width: 'half', label: l('Documento', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', personKey: 'docTipo' },
    { name: 'visitanteDocNumero', type: 'text', section: 'visitante', width: 'half', label: l('N.º do documento', 'Document no.'), personKey: 'docNumero' },
    { name: 'visitanteContacto', type: 'text', section: 'visitante', width: 'half', required: true, label: l('Telefone', 'Phone'), personKey: 'telefone' },
    { name: 'visitanteEmail', type: 'email', section: 'visitante', width: 'half', label: l('Email (opcional)', 'Email (optional)'), personKey: 'email' },
    { name: 'representa', type: 'text', section: 'visitante', label: l('Em representação de (opcional)', 'On behalf of (optional)'), placeholder: l('Ex.: empresa compradora ou familiar', 'E.g. buying company or relative') },

    {
      name: 'imoveis',
      type: 'lines',
      section: 'imoveis',
      required: true,
      label: l('Imóveis', 'Properties'),
      addLabel: l('Adicionar imóvel', 'Add property'),
      columns: [
        { name: 'ref', type: 'text', label: l('Ref.ª', 'Ref.') },
        { name: 'morada', type: 'text', label: l('Imóvel / morada', 'Property / address') },
        { name: 'tipologia', type: 'text', label: l('Tipologia', 'Type') },
        { name: 'preco', type: 'money', label: l('Preço ou renda', 'Price or rent') },
        { name: 'hora', type: 'text', label: l('Hora', 'Time') },
      ],
      default: [{ ref: '', morada: '', tipologia: '', preco: '', hora: '' }],
    },
    { name: 'compromisso', type: 'toggle', section: 'imoveis', default: true, label: l('O visitante compromete-se a negociar através da imobiliária', 'Visitor agrees to deal through the agency') },
    { name: 'mesesCompromisso', type: 'number', section: 'imoveis', width: 'half', min: 1, max: 24, default: 6, label: l('Durante (meses)', 'For (months)'), showIf: (v) => Boolean(v.compromisso) },
    { name: 'consentimentoContacto', type: 'toggle', section: 'imoveis', default: true, label: l('Pedir autorização para contactos futuros', 'Ask consent for future contact') },
    { name: 'observacoes', type: 'textarea', section: 'imoveis', rows: 2, label: l('Observações (interesse, proposta…)', 'Notes (interest, offer…)') },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!lineItems(v.imoveis).some((i) => str(i.morada))) w.push({ level: 'warning', field: 'imoveis', message: l('Indique os imóveis visitados.', 'List the properties viewed.') });
    w.push({ level: 'info', message: l('Peça ao visitante que rubrique cada linha e assine no fim. A ficha prova que a imobiliária apresentou o imóvel.', 'Ask the visitor to initial each line and sign. The record proves the agency introduced the property.') });
    w.push({ level: 'info', message: l('A ficha não obriga, por si só, o visitante a pagar comissão: a comissão é paga por quem contratou a imobiliária, nos termos do contrato.', 'The record alone does not make the visitor pay commission: whoever hired the agency pays, per the contract.') });
    return w;
  },

  personName: (v) => v.visitanteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const firma = profileDisplayName(ctx.profile) || 'a imobiliária';
    const imoveis = lineItems(v.imoveis).filter((i) => str(i.morada) || str(i.ref));
    const rows = (imoveis.length ? imoveis : [{}, {}, {}]).map((i: Record<string, unknown>, n) => [String(n + 1), str(i.ref), str(i.morada), str(i.tipologia), mt(money(i.preco)), str(i.hora), '']);
    const meses = int(v.mesesCompromisso);
    const blocks: Block[] = [
      { type: 'title', text: 'Ficha de Visita', subtitle: `N.º ${str(v.numero) || BLANK} · ${dateLong(v.data)}` },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Visitante', value: str(v.visitanteNome) || BLANK },
          { label: 'Documento', value: str(v.visitanteDocNumero) ? `${v.visitanteDocTipo || 'BI'} n.º ${v.visitanteDocNumero}` : BLANK },
          { label: 'Telefone', value: str(v.visitanteContacto) || BLANK },
          { label: 'Email', value: str(v.visitanteEmail) },
          { label: 'Em representação de', value: str(v.representa) },
          { label: 'Agente', value: str(v.agenteNome) || BLANK },
        ].filter((i) => i.value),
      },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.4, align: 'center' },
          { label: 'Ref.ª', width: 0.8 },
          { label: 'Imóvel / morada', width: 3.3 },
          { label: 'Tipologia', width: 1.1 },
          { label: 'Preço / renda (MT)', width: 1.4, align: 'right' },
          { label: 'Hora', width: 0.9, align: 'center' },
          { label: 'Rubrica', width: 1.1 },
        ],
        rows,
      },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `O(A) visitante declara que os imóveis acima identificados lhe foram apresentados por **${firma}**, na data indicada, e que tomou conhecimento das respectivas condições.${v.compromisso ? ` Caso pretenda adquirir ou arrendar algum deles${meses ? ` nos ${meses} ${meses === 1 ? 'mês seguinte' : 'meses seguintes'}` : ''}, compromete-se a fazê-lo por intermédio de ${firma}.` : ''}`,
        en: 'The visitor confirms the properties were shown by the agency on this date.',
      },
    ];
    if (v.consentimentoContacto) blocks.push({ type: 'paragraph', id: 'contactos', text: `Autorizo ${firma} a contactar-me sobre estes e outros imóveis:    Sim ______    Não ______`, en: 'Consent to future contact: yes / no.', size: 'small' });
    if (str(v.observacoes)) blocks.push({ type: 'paragraph', id: 'observacoes', text: `Observações: ${semPonto(v.observacoes)}.`, en: 'Notes.', size: 'small' });
    blocks.push({ type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [{ role: 'O(A) Visitante', name: str(v.visitanteNome) || undefined }, { role: 'O(A) Agente', name: str(v.agenteNome) || undefined, detail: firma, image: 'stamp' }] });
    return blocks;
  },
});
