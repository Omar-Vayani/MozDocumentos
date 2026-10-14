// Declaração de ocupação de terreno: the community leader and the neighbours
// (confrontantes, men and women) confirm who occupies a plot, since when, its
// boundaries and improvements. Testimonial evidence for the regularisation of a
// DUAT by good-faith or customary occupation. It is not a title and never
// records a "sale" of land, which belongs to the State.

import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, lineItems, localField } from './_shared';
import {
  assinaturaBlocks,
  assinaturaFields,
  comunidadeWarnings,
  finalidadeFrase,
  identificacao,
  notaBlocks,
  numeroComunidadeField,
  numeroRef,
  pessoaFields,
  residenteEm,
  str,
  unidadeField,
} from './_comunidade';

const USOS = [
  { value: 'habitação', label: l('Habitação', 'Housing') },
  { value: 'machamba (agricultura)', label: l('Machamba (agricultura)', 'Farming') },
  { value: 'habitação e machamba', label: l('Habitação e machamba', 'Housing and farming') },
  { value: 'comércio', label: l('Comércio', 'Trade') },
  { value: 'pastagem', label: l('Pastagem', 'Grazing') },
  { value: 'outro fim', label: l('Outro', 'Other') },
];

export default defineTemplate({
  id: 'declaracao-ocupacao-terreno',
  family: 'declaracao',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Declaração', 'Declaration') },
    { id: 'cidadao', title: l('Ocupante', 'Occupant'), personRole: 'outro' },
    { id: 'terreno', title: l('Terreno', 'Plot') },
    { id: 'confrontacoes', title: l('Limites e vizinhos', 'Boundaries and neighbours') },
    { id: 'finalidade', title: l('Finalidade', 'Purpose') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    numeroComunidadeField(),
    unidadeField(),
    localField(),
    dateField('data'),
    ...pessoaFields(['nome', 'genero', 'pai', 'mae', 'nascimento', 'nacionalidade', 'estadoCivil', 'docTipo', 'docNumero', 'docEmissao', 'docLocal']),
    {
      name: 'localizacao',
      type: 'text',
      section: 'terreno',
      required: true,
      label: l('Localização do terreno', 'Location of the plot'),
      placeholder: l('Ex.: Bairro de Chiango, Quarteirão n.º 7, junto à Escola Primária', 'E.g. neighbourhood, block, landmark'),
    },
    { name: 'area', type: 'number', section: 'terreno', width: 'half', min: 0, label: l('Área aproximada', 'Approximate area') },
    {
      name: 'areaUnidade',
      type: 'select',
      section: 'terreno',
      width: 'half',
      label: l('Unidade', 'Unit'),
      options: [
        { value: 'm²', label: l('metros quadrados (m²)', 'square metres') },
        { value: 'ha', label: l('hectares (ha)', 'hectares') },
      ],
      default: 'm²',
    },
    { name: 'uso', type: 'select', section: 'terreno', width: 'half', label: l('Uso', 'Use'), options: USOS, default: 'habitação' },
    { name: 'desde', type: 'number', section: 'terreno', width: 'half', required: true, min: 1900, max: 2100, label: l('Ocupa o terreno desde (ano)', 'Occupying since (year)') },
    {
      name: 'origem',
      type: 'select',
      section: 'terreno',
      width: 'half',
      label: l('Como obteve o terreno', 'How the plot was obtained'),
      options: [
        { value: '', label: l('Não indicar', 'Do not state') },
        { value: 'atribuído pela estrutura local segundo as práticas costumeiras', label: l('Atribuído pelo líder / costume', 'Allocated by the leader / custom') },
        { value: 'herdado da família', label: l('Herança da família', 'Inherited') },
        { value: 'ocupado de boa-fé', label: l('Ocupação de boa-fé', 'Good-faith occupation') },
      ],
      default: '',
    },
    { name: 'benfeitorias', type: 'textarea', section: 'terreno', rows: 2, label: l('Benfeitorias (opcional)', 'Improvements (optional)'), placeholder: l('Ex.: casa de alvenaria tipo 2, poço, cajueiros', 'E.g. brick house, well, cashew trees') },
    { name: 'coordenadas', type: 'text', section: 'terreno', label: l('Coordenadas GPS (opcional)', 'GPS coordinates (optional)') },
    { name: 'norte', type: 'text', section: 'confrontacoes', width: 'half', required: true, label: l('A Norte confronta com', 'North boundary') },
    { name: 'sul', type: 'text', section: 'confrontacoes', width: 'half', required: true, label: l('A Sul confronta com', 'South boundary') },
    { name: 'este', type: 'text', section: 'confrontacoes', width: 'half', required: true, label: l('A Este confronta com', 'East boundary') },
    { name: 'oeste', type: 'text', section: 'confrontacoes', width: 'half', required: true, label: l('A Oeste confronta com', 'West boundary') },
    {
      name: 'confrontantes',
      type: 'lines',
      section: 'confrontacoes',
      label: l('Vizinhos que confirmam (homens e mulheres)', 'Neighbours confirming (men and women)'),
      addLabel: l('Adicionar vizinho', 'Add neighbour'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'documento', type: 'text', label: l('BI n.º', 'ID no.') },
        { name: 'lado', type: 'text', label: l('Lado (N/S/E/O)', 'Side') },
      ],
      default: [],
    },
    { name: 'conflito', type: 'toggle', section: 'confrontacoes', label: l('Existe conflito sobre o terreno', 'There is a dispute over the plot'), default: false },
    { name: 'conflitoDescricao', type: 'textarea', section: 'confrontacoes', rows: 2, label: l('Descreva o diferendo', 'Describe the dispute'), showIf: (v) => !!v.conflito },
    { name: 'croqui', type: 'toggle', section: 'confrontacoes', label: l('Incluir quadro para croqui de localização', 'Include a box for a location sketch'), default: true },
    {
      name: 'finalidade',
      type: 'text',
      section: 'finalidade',
      required: true,
      label: l('Para que serve', 'Purpose'),
      default: 'regularização do direito de uso e aproveitamento da terra',
    },
    { name: 'entidade', type: 'text', section: 'finalidade', label: l('A apresentar a (opcional)', 'To be presented to (optional)'), placeholder: l('Ex.: Serviços Distritais de Actividades Económicas de Boane', 'E.g. district land services') },
    ...assinaturaFields('assinatura', { confirmacoes: false }),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = comunidadeWarnings(v, ctx);
    const anosMin = ctx.legal.value<{ anos: number }>('duatOcupacaoBoaFe').anos;
    const ano = Number(v.desde);
    const anoDoc = Number(str(v.data || ctx.today).slice(0, 4));
    if (ano && anoDoc && anoDoc - ano < anosMin) {
      w.push({
        level: 'info',
        field: 'desde',
        message: l(
          `A aquisição do DUAT por ocupação de boa-fé exige pelo menos ${anosMin} anos de uso (${cite('duatOcupacaoBoaFe')}). Abaixo disso, o pedido segue a via de autorização.`,
          `Acquiring the land right by good-faith occupation requires at least ${anosMin} years of use. Below that, an application for authorisation is needed.`,
        ),
      });
    }
    if (str(v.cidadaoNacionalidade) && !/mo[çc]ambican/i.test(str(v.cidadaoNacionalidade))) {
      w.push({ level: 'warning', field: 'cidadaoNacionalidade', message: l('A ocupação de boa-fé só aproveita a pessoas singulares nacionais. Estrangeiros obtêm o DUAT por pedido autorizado.', 'Good-faith occupation applies only to Mozambican individuals. Foreigners obtain the right by an authorised application.') });
    }
    if (/vend|compr/i.test(`${str(v.benfeitorias)} ${str(v.finalidade)}`)) {
      w.push({ level: 'warning', message: l('A terra é propriedade do Estado e não se vende. Só as benfeitorias se transmitem, por escritura e com autorização.', 'Land belongs to the State and cannot be sold. Only improvements are transferred, by deed and with authorisation.') });
    }
    const conf = lineItems(v.confrontantes).filter((r) => str(r.nome));
    if (conf.length < 2) w.push({ level: 'warning', field: 'confrontantes', message: l('Junte pelo menos dois vizinhos confrontantes, homens e mulheres, que confirmem a ocupação.', 'Add at least two neighbours, men and women, who confirm the occupation.') });
    w.push({ level: 'info', message: l('Esta declaração não confere o DUAT. A consulta comunitária para atribuição de terra segue o procedimento oficial dos Serviços de Cadastro.', 'This declaration does not grant the land right. Community consultation for land allocation follows the official cadastre procedure.') });
    return w;
  },

  personName: (v) => v.cidadaoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const area = str(v.area) ? `${str(v.area).replace('.', ',')} ${str(v.areaUnidade) || 'm²'}` : `${BLANK} ${str(v.areaUnidade) || 'm²'}`;
    const origem = str(v.origem) ? `, ${str(v.origem).replace(/[.,;]+$/, '')},` : ',';
    const entidade = str(v.entidade);
    const conf = lineItems(v.confrontantes).filter((r) => str(r.nome) || str(r.documento));
    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Ocupação de Terreno', subtitle: str(v.numero) ? numeroRef(ctx) : undefined },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `Declara-se, ${finalidadeFrase(v)}${entidade ? ` junto ${/^(Serviço|Conselho|Município|Posto|Distrito)/i.test(entidade) ? 'dos' : 'de'} ${entidade.replace(/^(os|as|o|a)\s+/i, '')}` : ''}, que ${identificacao(v)}, ocupa e utiliza, **de forma pacífica, contínua e de boa-fé, desde ${str(v.desde) || BLANK}**${origem} uma parcela de terreno situada ${str(v.localizacao) ? residenteEm(str(v.localizacao)).replace(/^residente /, '') : `em ${BLANK}`}, com a área aproximada de ${area}, destinada a ${str(v.uso) || BLANK}, com as seguintes confrontações:`,
        keepWithNext: true,
        en: 'It is declared that the person named has occupied and used the plot described peacefully, continuously and in good faith since the year stated, with these boundaries:',
      },
      {
        type: 'table',
        columns: [{ label: 'Lado', width: 1 }, { label: 'Confronta com', width: 4 }],
        rows: [
          ['Norte', str(v.norte) || BLANK],
          ['Sul', str(v.sul) || BLANK],
          ['Este', str(v.este) || BLANK],
          ['Oeste', str(v.oeste) || BLANK],
        ],
      },
    ];
    if (str(v.benfeitorias)) blocks.push({ type: 'paragraph', id: 'benfeitorias', text: `No terreno existem as seguintes benfeitorias: ${str(v.benfeitorias).replace(/\s*\n+\s*/g, '; ').replace(/[.;]+$/, '')}.`, en: 'Improvements on the plot.' });
    if (str(v.coordenadas)) blocks.push({ type: 'paragraph', id: 'coordenadas', text: `Coordenadas de referência: ${str(v.coordenadas)}.`, en: 'GPS reference.' });
    blocks.push({
      type: 'paragraph',
      id: 'conflito',
      text: v.conflito
        ? `Existe o seguinte diferendo sobre a parcela, do conhecimento desta estrutura: ${str(v.conflitoDescricao).replace(/[.;]+$/, '') || BLANK}.`
        : 'A ocupação é do conhecimento desta estrutura e da comunidade, **não havendo conhecimento de qualquer conflito** sobre a parcela.',
      en: v.conflito ? 'A dispute over the plot is known to the structure.' : 'The occupation is known to the community and no dispute over the plot is known.',
    });
    blocks.push({
      type: 'paragraph',
      id: 'limite',
      text: 'A presente declaração não confere, por si só, o direito de uso e aproveitamento da terra, cuja titulação compete às entidades estatais competentes, nos termos da Lei de Terras. A terra é propriedade do Estado e não pode ser vendida.',
      en: 'This declaration does not by itself grant the land use right; titling belongs to the State. Land belongs to the State and cannot be sold.',
    });
    blocks.push({
      type: 'paragraph',
      id: 'confrontantes-intro',
      text: 'Os vizinhos confrontantes abaixo assinados, membros da comunidade, confirmam o que antecede. Quem não souber assinar apõe a impressão digital junto do seu nome.',
      keepWithNext: true,
      en: 'The neighbours below, community members, confirm the above.',
    });
    // Each neighbour signs on a line of their own (or presses a thumbprint next to it).
    const LADOS: Record<string, string> = { N: 'Norte', S: 'Sul', E: 'Este', O: 'Oeste', W: 'Oeste' };
    const linhas: Record<string, unknown>[] = conf.length ? conf : [{}, {}, {}];
    const cols: SignatureColumn[] = linhas.map((r) => {
      const lado = str(r.lado);
      const ladoTxt = LADOS[lado.toUpperCase()] ?? lado;
      const doc = str(r.documento).replace(/^(BI\s*)?n\.?\s*º\s*/i, '');
      return { role: `Confrontante${ladoTxt ? ` — ${ladoTxt}` : ''}`, name: str(r.nome) || undefined, detail: doc ? `BI n.º ${doc}` : undefined };
    });
    for (let i = 0; i < cols.length; i += 3) {
      blocks.push({ type: 'signatures', placeDate: i === 0 ? `${ctx.place}, ${dateLong(v.data)}` : undefined, columns: cols.slice(i, i + 3), keepWithNext: true });
    }
    blocks.push(...assinaturaBlocks(ctx, { placeDate: false }), ...notaBlocks(v.cidadaoGenero));
    // Blank area (no ruled lines) for a hand-drawn sketch.
    if (v.croqui !== false) blocks.push({ type: 'box', label: 'Anexo — Croqui de localização (indicar o norte, os caminhos e as referências)', space: 70 });
    return blocks;
  },
});
