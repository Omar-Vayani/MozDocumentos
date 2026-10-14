// Convocatória / aviso à população: a notice the neighbourhood structure posts
// at the office, market, schools and churches, and the chefes de quarteirão
// read out: a meeting, a clean-up campaign, a vaccination day.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, lineItems, localField } from './_shared';
import { hora, stripNumber } from './_estado';
import { assinanteColumn, assinaturaFields, comunidadeWarnings, str, unidadeField } from './_comunidade';

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

const diaSemana = (iso: unknown) => {
  const s = str(iso);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : DIAS[d.getDay()];
};

export default defineTemplate({
  id: 'convocatoria-reuniao-comunitaria',
  family: 'carta',
  page: 'A4',
  frame: 'simple',
  noBrand: true,
  sections: [
    { id: 'aviso', title: l('Aviso', 'Notice') },
    { id: 'quando', title: l('Quando e onde', 'When and where') },
    { id: 'agenda', title: l('Agenda', 'Agenda') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'select',
      section: 'aviso',
      width: 'half',
      label: l('Tipo', 'Type'),
      options: [
        { value: 'reuniao', label: l('Convocatória para reunião', 'Meeting notice') },
        { value: 'campanha', label: l('Campanha / actividade', 'Campaign / activity') },
        { value: 'aviso', label: l('Aviso à população', 'Public notice') },
      ],
      default: 'reuniao',
    },
    unidadeField('aviso'),
    {
      name: 'destinatarios',
      type: 'text',
      section: 'aviso',
      label: l('Quem é convocado', 'Who is called'),
      default: 'todos os moradores',
      placeholder: l('Ex.: todos os moradores do Quarteirão n.º 12', 'E.g. all residents of block 12'),
    },
    { name: 'actividade', type: 'text', section: 'aviso', label: l('Actividade', 'Activity'), placeholder: l('Ex.: campanha de limpeza das valas de drenagem', 'E.g. drain clean-up'), showIf: (v) => v.tipo !== 'reuniao' },
    { name: 'dataReuniao', type: 'date', section: 'quando', width: 'half', required: true, label: l('Dia', 'Day') },
    { name: 'hora', type: 'text', section: 'quando', width: 'half', required: true, label: l('Hora', 'Time'), placeholder: l('Ex.: 09:00', 'E.g. 09:00') },
    { name: 'localReuniao', type: 'text', section: 'quando', required: true, label: l('Local', 'Place'), placeholder: l('Ex.: campo da Escola Primária Completa de Malhangalene', 'E.g. primary school field') },
    {
      name: 'agenda',
      type: 'lines',
      section: 'agenda',
      label: l('Agenda (opcional)', 'Agenda (optional)'),
      addLabel: l('Adicionar ponto', 'Add item'),
      columns: [{ name: 'ponto', type: 'text', label: l('Ponto', 'Item') }],
      default: [],
    },
    { name: 'trazer', type: 'text', section: 'agenda', label: l('Trazer (opcional)', 'Bring (optional)'), placeholder: l('Ex.: enxadas, pás e sacos', 'E.g. hoes, shovels and bags') },
    { name: 'mobilizacao', type: 'toggle', section: 'agenda', label: l('Pedir aos chefes de quarteirão e de dez casas que mobilizem os moradores', 'Ask block and ten-house leaders to mobilise residents'), default: true },
    {
      name: 'textoLocal',
      type: 'textarea',
      section: 'agenda',
      rows: 3,
      label: l('O mesmo aviso em língua local (opcional)', 'The same notice in a local language (optional)'),
      placeholder: l('Ex.: texto em changana, emakhuwa ou sena', 'E.g. text in Changana, Emakhuwa or Sena'),
    },
    localField('assinatura'),
    dateField('data', 'assinatura'),
    ...assinaturaFields('assinatura', { visto: false, confirmacoes: false }),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = comunidadeWarnings(v, ctx);
    if (str(v.dataReuniao) && str(v.data) && str(v.dataReuniao) < str(v.data)) w.push({ level: 'warning', field: 'dataReuniao', message: l('A data da reunião é anterior à data do aviso.', 'The meeting date is before the notice date.') });
    w.push({ level: 'info', message: l('Afixe o aviso com antecedência na secretaria, no mercado, nas escolas e nas igrejas, e peça aos chefes de quarteirão que o leiam aos moradores.', 'Post the notice in advance at the office, market, schools and churches, and ask block chiefs to read it to residents.') });
    return w;
  },

  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const unidade = str(v.unidade);
    const titulo = v.tipo === 'aviso' ? 'Aviso' : 'Convocatória';
    const dia = diaSemana(v.dataReuniao);
    const quando = `${dia ? `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ` : ''}${dateLong(v.dataReuniao)}`;
    const agenda = lineItems(v.agenda).map((r) => stripNumber(str(r.ponto))).filter(Boolean);
    const secretaria = unidade ? `A estrutura ${/^(Povoação|Aldeia|Localidade|Comunidade)/i.test(unidade) ? 'da' : 'do'} ${unidade}` : 'A estrutura do bairro';
    const o_que = v.tipo === 'reuniao' ? 'uma reunião' : str(v.actividade) ? str(v.actividade).replace(/[.;]+$/, '') : BLANK;
    const verbo = v.tipo === 'aviso' ? 'informa' : 'convoca';
    const corpo =
      v.tipo === 'aviso'
        ? `${secretaria} informa ${str(v.destinatarios) || 'todos os moradores'} de que terá lugar ${o_que}, nos termos seguintes:`
        : `${secretaria} ${verbo} **${str(v.destinatarios) || 'todos os moradores'}** para ${v.tipo === 'reuniao' ? 'uma reunião' : `a ${o_que.replace(/^(a|uma)\s+/i, '')}`}, a realizar-se:`;

    const blocks: Block[] = [
      { type: 'spacer', size: 'medium' },
      { type: 'display', text: titulo, size: 'xxl', uppercase: true, weight: 'bold', tone: 'text', after: 6 },
      { type: 'ornament', style: 'rule', width: 'short' },
      { type: 'spacer', size: 'medium' },
      { type: 'paragraph', id: 'corpo', text: corpo, align: 'center', en: 'The community structure calls the residents named to the meeting or activity below.' },
      { type: 'spacer', size: 'small' },
      { type: 'display', text: quando, size: 'lg', weight: 'bold', tone: 'accent', fit: true, after: 4 },
      { type: 'display', text: hora(v.hora, 'às').replace(/^à(s)? /, (m) => m.charAt(0).toUpperCase() + m.slice(1)), size: 'md', weight: 'bold', tone: 'text', after: 4 },
      { type: 'display', text: str(v.localReuniao) || BLANK, size: 'md', tone: 'text', fit: true, after: 8 },
    ];
    if (agenda.length) {
      blocks.push(
        { type: 'heading', text: v.tipo === 'reuniao' ? 'Agenda' : 'Programa', align: 'center' },
        { type: 'list', style: 'numeric', items: agenda.map((a, i, arr) => `${a.replace(/[.;]+$/, '')}${i === arr.length - 1 ? '.' : ';'}`) },
      );
    }
    if (str(v.trazer)) blocks.push({ type: 'paragraph', id: 'trazer', text: `**Trazer:** ${str(v.trazer).replace(/[.;]+$/, '')}.`, align: 'center', en: 'What to bring.' });
    blocks.push({
      type: 'paragraph',
      id: 'presenca',
      text: `A presença de todos é importante.${v.mobilizacao ? ' Os chefes de quarteirão e de dez casas devem mobilizar os moradores.' : ''}`,
      align: 'center',
      en: 'Everyone’s presence matters. Block and ten-house leaders should mobilise residents.',
    });
    if (str(v.textoLocal)) {
      blocks.push({ type: 'ornament', style: 'dots', width: 'short' }, { type: 'paragraph', id: 'texto-local', text: str(v.textoLocal), align: 'center', en: 'The same notice in a local language.' });
    }
    blocks.push({ type: 'spacer', size: 'medium' }, { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [assinanteColumn(ctx)] });
    return blocks;
  },
});
