// Guia de Marcha: authorises an official's travel on a service mission and
// carries the arrival and departure stamps of each destination. It is the basis
// for paying per diem; the amounts follow the table in force and are not printed.

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, GENERO_OPTIONS, cite, dateField, dateLong, g, l, lineItems, localField, placeDate } from './_shared';
import { estadoRef, estadoWarnings, numeroField, signatarioColumn, signatarioFields, str } from './_estado';

const TRANSPORTE: Record<string, string> = {
  viatura: 'Viatura do Estado',
  publico: 'Transporte público (terrestre)',
  aereo: 'Transporte aéreo',
  proprio: 'Viatura própria',
  outro: 'Outro',
};

export default defineTemplate({
  id: 'guia-de-marcha',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Número e data', 'Number and date') },
    { id: 'funcionario', title: l('Funcionário', 'Official'), personRole: 'trabalhador' },
    { id: 'missao', title: l('Missão', 'Mission') },
    { id: 'encargos', title: l('Encargos', 'Costs') },
    { id: 'assinatura', title: l('Autorização', 'Authorisation') },
  ],
  fields: [
    numeroField(),
    localField(),
    dateField('data'),
    { name: 'funcionarioNome', type: 'text', section: 'funcionario', required: true, label: l('Nome completo', 'Full name'), personKey: 'nome' },
    { name: 'funcionarioGenero', type: 'radio', section: 'funcionario', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'funcionarioCategoria', type: 'text', section: 'funcionario', width: 'half', label: l('Carreira / categoria', 'Career grade'), placeholder: l('Ex.: Técnico de Medicina Geral N3', 'E.g. Técnico de Medicina Geral N3'), personKey: 'categoria' },
    { name: 'funcionarioFuncao', type: 'text', section: 'funcionario', width: 'half', label: l('Função / cargo', 'Position'), personKey: 'cargo' },
    { name: 'funcionarioSector', type: 'text', section: 'funcionario', width: 'half', label: l('Sector / unidade orgânica', 'Unit'), personKey: 'departamento' },
    { name: 'funcionarioNuit', type: 'text', section: 'funcionario', width: 'half', label: l('NUIT (opcional)', 'Tax number (optional)'), personKey: 'nuit' },
    {
      name: 'destinos',
      type: 'lines',
      section: 'missao',
      label: l('Destinos', 'Destinations'),
      addLabel: l('Adicionar destino', 'Add destination'),
      help: l('Cada destino recebe um quadro para o carimbo de chegada e de partida.', 'Each destination gets a box for the arrival and departure stamps.'),
      columns: [
        { name: 'local', type: 'text', label: l('Local', 'Place'), placeholder: l('Ex.: Distrito de Ribáuè', 'E.g. Ribáuè District') },
        { name: 'entidade', type: 'text', label: l('Entidade que visa (opcional)', 'Body that stamps (optional)'), placeholder: l('Ex.: Serviço Distrital de Saúde', 'E.g. District Health Service') },
      ],
      default: [{ local: '', entidade: '' }],
    },
    {
      name: 'objectivo',
      type: 'textarea',
      section: 'missao',
      required: true,
      rows: 3,
      label: l('Objectivo da missão', 'Purpose of the mission'),
      placeholder: l('Ex.: Supervisão das actividades da campanha de vacinação', 'E.g. Supervising the vaccination campaign'),
    },
    { name: 'dataPartida', type: 'date', section: 'missao', width: 'half', required: true, label: l('Data de partida', 'Departure date') },
    { name: 'dataRegresso', type: 'date', section: 'missao', width: 'half', required: true, label: l('Data prevista de regresso', 'Expected return date') },
    {
      name: 'transporte',
      type: 'select',
      section: 'missao',
      width: 'half',
      label: l('Meio de transporte', 'Transport'),
      options: Object.entries(TRANSPORTE).map(([value, pt]) => ({ value, label: l(pt, value === 'viatura' ? 'State vehicle' : value === 'publico' ? 'Public transport' : value === 'aereo' ? 'Air' : value === 'proprio' ? 'Own vehicle' : 'Other') })),
      default: 'viatura',
    },
    { name: 'matricula', type: 'text', section: 'missao', width: 'half', label: l('Matrícula da viatura', 'Vehicle registration'), showIf: (v) => v.transporte === 'viatura' || v.transporte === 'proprio' },
    { name: 'transporteOutro', type: 'text', section: 'missao', width: 'half', label: l('Qual?', 'Which?'), showIf: (v) => v.transporte === 'outro' },
    { name: 'acompanhantes', type: 'text', section: 'missao', label: l('Acompanhantes (opcional)', 'Accompanied by (optional)') },
    {
      name: 'ajudasCusto',
      type: 'toggle',
      section: 'encargos',
      label: l('Tem direito a ajudas de custo', 'Entitled to per diem'),
      help: l('Os valores dependem da tabela em vigor e da categoria; não são impressos na guia.', 'Amounts depend on the table in force and the grade; they are not printed.'),
      default: true,
    },
    { name: 'passagens', type: 'toggle', section: 'encargos', label: l('Abono de passagens', 'Travel fares paid'), default: false },
    { name: 'fonteFinanciamento', type: 'text', section: 'encargos', label: l('Fonte de financiamento (opcional)', 'Funding source (optional)'), placeholder: l('Ex.: Orçamento do Estado — Campanha de Vacinação', 'E.g. State budget — vaccination campaign') },
    ...signatarioFields('assinatura', l('Cargo de quem autoriza', 'Authorising officer’s position')),
    { name: 'regresso', type: 'toggle', section: 'assinatura', label: l('Quadro para confirmar o regresso', 'Box to confirm the return'), default: true },
  ],

  computed: (v) => {
    const d = v.dataPartida && v.dataRegresso ? diffDays(v.dataPartida, v.dataRegresso) : Number.NaN;
    return { dias: Number.isFinite(d) && d >= 0 ? d + 1 : null };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = estadoWarnings(v, ctx);
    if (!str(v.funcionarioNome)) w.push({ level: 'warning', field: 'funcionarioNome', message: l('Indique o funcionário que se desloca.', 'Enter the official who travels.') });
    if (!lineItems(v.destinos).some((d) => str(d.local))) w.push({ level: 'warning', field: 'destinos', message: l('Indique pelo menos um destino.', 'Enter at least one destination.') });
    if (v.dataPartida && v.dataRegresso && diffDays(v.dataPartida, v.dataRegresso) < 0) {
      w.push({ level: 'error', field: 'dataRegresso', message: l('A data de regresso é anterior à de partida.', 'The return date is before the departure date.') });
    }
    if (v.ajudasCusto !== false) {
      w.push({
        level: 'info',
        field: 'ajudasCusto',
        message: l(
          `As ajudas de custo são calculadas pela unidade financeira segundo ${cite('ajudasCustoRegime')} e a tabela em vigor para a categoria do funcionário.`,
          'Per diem is calculated by the finance unit under the regulation and the table in force for the official’s grade.',
        ),
      });
    }
    return w;
  },

  personName: (v) => v.funcionarioNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const dias = ctx.computed.dias as number | null;
    const destinos = lineItems(v.destinos).filter((d) => str(d.local) || str(d.entidade));
    const listaDestinos = destinos.map((d) => str(d.local) || BLANK).join('; ') || BLANK;
    let transporte = TRANSPORTE[v.transporte as string] ?? BLANK;
    if (v.transporte === 'outro' && str(v.transporteOutro)) transporte = str(v.transporteOutro);
    if ((v.transporte === 'viatura' || v.transporte === 'proprio') && str(v.matricula)) transporte += `, matrícula ${str(v.matricula)}`;

    const blocks: Block[] = [
      { type: 'title', text: 'Guia de Marcha', subtitle: estadoRef(ctx, 'N.º').replace(/^N\.º n\.º /, 'N.º ') },
      {
        type: 'keyValue',
        title: 'Identificação',
        columns: 2,
        items: [
          { label: 'Nome', value: str(v.funcionarioNome) || BLANK },
          { label: 'Carreira / categoria', value: str(v.funcionarioCategoria) || BLANK },
          { label: 'Função', value: str(v.funcionarioFuncao) || BLANK },
          { label: 'Sector', value: str(v.funcionarioSector) || BLANK },
          ...(str(v.funcionarioNuit) ? [{ label: 'NUIT', value: str(v.funcionarioNuit) }] : []),
        ],
      },
      {
        type: 'keyValue',
        title: 'Missão',
        columns: 1,
        items: [
          { label: destinos.length > 1 ? 'Destinos' : 'Destino', value: listaDestinos },
          { label: 'Objectivo', value: str(v.objectivo).replace(/\s*\n+\s*/g, '; ') || BLANK },
        ],
      },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Partida', value: dateLong(v.dataPartida) },
          { label: 'Regresso previsto', value: dateLong(v.dataRegresso) },
          { label: 'Duração', value: dias ? `${dias} ${dias === 1 ? 'dia' : 'dias'}` : BLANK },
          { label: 'Transporte', value: transporte },
          { label: 'Ajudas de custo', value: v.ajudasCusto === false ? 'Não' : 'Sim, segundo a tabela em vigor' },
          { label: 'Passagens', value: v.passagens ? 'Sim' : 'Não' },
          ...(str(v.acompanhantes) ? [{ label: 'Acompanhantes', value: str(v.acompanhantes) }] : []),
          ...(str(v.fonteFinanciamento) ? [{ label: 'Financiamento', value: str(v.fonteFinanciamento) }] : []),
        ],
      },
      {
        type: 'paragraph',
        id: 'autorizacao',
        text: `Autorizo a deslocação acima indicada, em missão de serviço. Solicita-se às entidades dos locais de destino que visem a presente guia à chegada e à partida ${g(v.funcionarioGenero, 'do funcionário', 'da funcionária')}.`,
        keepWithNext: true,
        en: 'I authorise the travel above on official mission. The bodies at the destination are asked to stamp this order on the official’s arrival and departure.',
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [signatarioColumn(v)] },
      { type: 'heading', text: 'Vistos nos locais de destino' },
    ];
    const lista = destinos.length ? destinos : [{ local: '', entidade: '' }];
    lista.forEach((d) => {
      const titulo = [str(d.local), str(d.entidade)].filter(Boolean).join(' — ') || 'Local de destino';
      blocks.push({
        type: 'box',
        label: titulo,
        text: 'Chegou em ___/___/______ às ____h____          Partiu em ___/___/______ às ____h____\nCarimbo e assinatura:',
        lines: 2,
      });
    });
    if (v.regresso !== false) {
      blocks.push({ type: 'box', label: 'Regresso', text: `Apresentou-se ao serviço em ___/___/______.\n\nO responsável do sector:`, lines: 1, dashed: true });
    }
    return blocks;
  },
});
