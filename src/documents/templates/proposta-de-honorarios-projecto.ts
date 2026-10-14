// Proposta de honorários for architecture or engineering services: scope by
// phase, deliverables, timing, fees, payment, exclusions, copyright and
// validity. A letter from the professional or firm to the client.

import { formatPercent } from '@/lib/format';
import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { BLANK, cite, dateLong, exmo, GENERO_OPTIONS, l, lineItems, localField, money, professionalSignature, refField, splitLines } from './_shared';
import { int, num, semPonto, str } from './_contratos';
import { IVA_OPTIONS, mt, r2 } from './_construcao';

const SERVICOS = [
  { value: 'arquitectura', label: l('Projecto de arquitectura', 'Architectural design'), pt: 'elaboração do projecto de arquitectura' },
  { value: 'completo', label: l('Arquitectura e especialidades', 'Architecture and engineering'), pt: 'elaboração do projecto de arquitectura e dos projectos de especialidades' },
  { value: 'engenharia', label: l('Projectos de engenharia (especialidades)', 'Engineering design'), pt: 'elaboração dos projectos de especialidades de engenharia' },
  { value: 'fiscalizacao', label: l('Fiscalização da obra', 'Site supervision'), pt: 'fiscalização da execução da obra' },
];

const FASES_DEFAULT = [
  { fase: 'Levantamento e programa preliminar', entregaveis: 'Programa aprovado pelo cliente', prazoDias: 7, valor: '', percentagem: 5 },
  { fase: 'Estudo prévio', entregaveis: 'Plantas, cortes e alçados de princípio; estimativa de custo', prazoDias: 15, valor: '', percentagem: 20 },
  { fase: 'Projecto para licenciamento', entregaveis: 'Peças desenhadas e escritas para o município', prazoDias: 20, valor: '', percentagem: 25 },
  { fase: 'Projecto de execução', entregaveis: 'Pormenores, mapa de quantidades e caderno de encargos', prazoDias: 30, valor: '', percentagem: 35 },
  { fase: 'Assistência técnica à obra', entregaveis: 'Visitas à obra e esclarecimentos', prazoDias: '', valor: '', percentagem: 15 },
];

const EXCLUSOES = [
  'Taxas e emolumentos municipais',
  'Levantamento topográfico e estudo geotécnico',
  'Cópias e impressões além de três jogos',
  'Alterações ao programa depois de aprovado o estudo prévio',
].join('\n');

export default defineTemplate({
  id: 'proposta-de-honorarios-projecto',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Referência', 'Reference') },
    { id: 'cliente', title: l('Cliente', 'Client'), personRole: 'cliente' },
    { id: 'servico', title: l('Serviço e obra', 'Service and project') },
    { id: 'fases', title: l('Fases e honorários', 'Phases and fees') },
    { id: 'condicoes', title: l('Condições', 'Terms') },
  ],
  fields: [
    refField(),
    localField(),
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data', 'Date'), default: (c) => c.today },
    { name: 'dataPedido', type: 'date', section: 'documento', width: 'half', label: l('Data do pedido do cliente', 'Date of the client’s request') },

    { name: 'clienteNome', type: 'text', section: 'cliente', required: true, label: l('Nome ou empresa', 'Name or company'), personKey: 'nome' },
    { name: 'clienteGenero', type: 'radio', section: 'cliente', label: l('Tratamento', 'Form of address'), options: [...GENERO_OPTIONS, { value: 'E', label: l('Empresa', 'Company') }], default: 'M' },
    { name: 'clienteAtencao', type: 'text', section: 'cliente', width: 'half', label: l('Ao cuidado de (opcional)', 'Attention of (optional)') },
    { name: 'clienteMorada', type: 'text', section: 'cliente', width: 'half', label: l('Morada', 'Address'), personKey: 'morada' },

    { name: 'servico', type: 'select', section: 'servico', required: true, label: l('Serviço', 'Service'), options: SERVICOS.map(({ value, label }) => ({ value, label })), default: 'completo' },
    { name: 'obraDescricao', type: 'text', section: 'servico', required: true, label: l('Obra', 'Project'), placeholder: l('Ex.: moradia unifamiliar do tipo 4 com piscina', 'E.g. four-bedroom house with pool') },
    { name: 'obraLocal', type: 'text', section: 'servico', required: true, width: 'half', label: l('Local', 'Location') },
    { name: 'areaBruta', type: 'number', section: 'servico', width: 'half', min: 0, label: l('Área bruta de construção (m²)', 'Gross floor area (m²)') },
    { name: 'especialidades', type: 'text', section: 'servico', label: l('Especialidades incluídas', 'Engineering disciplines included'), default: 'estabilidade; águas e esgotos; instalações eléctricas', showIf: (v) => v.servico !== 'arquitectura' && v.servico !== 'fiscalizacao' },
    { name: 'visitasMes', type: 'number', section: 'servico', width: 'half', min: 1, max: 30, label: l('Visitas à obra por mês', 'Site visits per month'), showIf: (v) => v.servico === 'fiscalizacao' },

    {
      name: 'metodo',
      type: 'radio',
      section: 'fases',
      label: l('Forma de cálculo', 'Fee basis'),
      options: [
        { value: 'global', label: l('Valor por fase', 'Amount per phase') },
        { value: 'percentagem', label: l('Percentagem do custo estimado da obra', 'Percentage of the estimated cost') },
      ],
      default: 'global',
    },
    { name: 'custoObra', type: 'money', section: 'fases', width: 'half', label: l('Custo estimado da obra', 'Estimated construction cost'), showIf: (v) => v.metodo === 'percentagem' },
    { name: 'percentagem', type: 'number', section: 'fases', width: 'half', min: 0, max: 30, label: l('Honorários (% do custo)', 'Fee (% of cost)'), showIf: (v) => v.metodo === 'percentagem' },
    {
      name: 'fases',
      type: 'lines',
      section: 'fases',
      label: l('Fases', 'Phases'),
      help: l('Preencha o valor de cada fase, ou, na base percentual, a parte (%) do total que lhe cabe.', 'Enter each phase’s amount or, on the percentage basis, its share (%) of the total.'),
      addLabel: l('Adicionar fase', 'Add phase'),
      columns: [
        { name: 'fase', type: 'text', label: l('Fase', 'Phase') },
        { name: 'entregaveis', type: 'text', label: l('Entregáveis', 'Deliverables') },
        { name: 'prazoDias', type: 'number', label: l('Prazo (dias)', 'Time (days)') },
        { name: 'valor', type: 'money', label: l('Valor (valor por fase)', 'Amount (per-phase basis)') },
        { name: 'percentagem', type: 'number', label: l('% do total (base percentual)', '% of total (percentage basis)') },
      ],
      default: FASES_DEFAULT,
    },
    { name: 'ivaRegime', type: 'radio', section: 'fases', label: l('IVA', 'VAT'), options: IVA_OPTIONS, default: 'acrescido' },

    { name: 'pagamento', type: 'textarea', section: 'condicoes', rows: 2, label: l('Pagamento', 'Payment'), default: 'Cada fase é paga na entrega dos respectivos elementos, sendo o valor da primeira fase pago na adjudicação.' },
    { name: 'exclusoes', type: 'textarea', section: 'condicoes', rows: 4, default: EXCLUSOES, label: l('Não incluído (um por linha)', 'Not included (one per line)') },
    { name: 'direitosAutor', type: 'toggle', section: 'condicoes', default: true, label: l('Cláusula de direitos de autor do projecto', 'Copyright clause') },
    { name: 'validadeDias', type: 'number', section: 'condicoes', width: 'half', min: 1, max: 180, default: 30, label: l('Validade (dias)', 'Valid for (days)') },
    { name: 'aceitacao', type: 'toggle', section: 'condicoes', default: true, label: l('Espaço para aceitação do cliente', 'Space for the client’s acceptance') },
  ],

  computed: (v, { legal }) => {
    const pctMode = v.metodo === 'percentagem';
    const custo = money(v.custoObra);
    const totalPct = pctMode && custo != null && num(v.percentagem) != null ? r2((custo * (num(v.percentagem) ?? 0)) / 100) : null;
    const fases = lineItems(v.fases)
      .filter((f) => str(f.fase))
      .map((f) => {
        const share = pctMode ? num(f.percentagem) : null;
        const valor = pctMode ? (totalPct != null && share != null ? r2((totalPct * share) / 100) : null) : money(f.valor);
        return { fase: str(f.fase), entregaveis: str(f.entregaveis), prazo: int(f.prazoDias), share, valor };
      });
    const soma = r2(fases.reduce((s, f) => s + (f.valor ?? 0), 0));
    const somaShares = fases.reduce((s, f) => s + (f.share ?? 0), 0);
    const taxa = legal.value<number>('ivaTaxaNormal');
    const iva = v.ivaRegime === 'acrescido' ? r2(soma * taxa) : 0;
    return { fases, soma, somaShares, taxa, iva, total: r2(soma + iva), totalPct };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [];
    if (v.metodo === 'percentagem' && c.fases.length && Math.abs(c.somaShares - 100) > 0.01) {
      w.push({ level: 'error', field: 'fases', message: l(`As fases somam ${c.somaShares}% do total; devem somar cem por cento.`, `Phases add up to ${c.somaShares}%; they must total one hundred per cent.`) });
    }
    if (!ctx.profile?.ordemNumero) {
      w.push({ level: 'warning', message: l(`Acrescente ao perfil o número de inscrição na Ordem: o exercício da engenharia e da arquitectura exige inscrição (${cite('inscricaoOrdemEngenheiros')}).`, 'Add your Order registration number to the profile: practising engineering or architecture requires registration.') });
    }
    if (ctx.profile?.kind === 'empresa' && !ctx.profile.licenca) {
      w.push({ level: 'info', message: l(`As empresas de projecto e fiscalização precisam de alvará de consultor de construção civil (${cite('alvaraConsultor')}).`, 'Design and supervision firms need a construction consultant’s licence.') });
    }
    w.push({ level: 'info', message: l('Uma proposta aceite por escrito vincula as partes. Em projectos grandes, celebre também um contrato de prestação de serviços.', 'A proposal accepted in writing binds the parties. For large projects, also sign a services contract.') });
    return w;
  },

  personName: (v) => v.clienteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const serv = SERVICOS.find((s) => s.value === v.servico) ?? SERVICOS[1];
    const empresa = v.clienteGenero === 'E';
    const area = num(v.areaBruta);
    const exclusoes = splitLines(v.exclusoes);
    const validade = int(v.validadeDias);
    const pctMode = v.metodo === 'percentagem';

    const rows = (c.fases as { fase: string; entregaveis: string; prazo: number | null; share: number | null; valor: number | null }[]).map((f, i) => [
      String(i + 1),
      f.fase,
      f.entregaveis,
      f.prazo ? String(f.prazo) : '—',
      ...(pctMode ? [f.share != null ? formatPercent(f.share / 100) : ''] : []),
      mt(f.valor),
    ]);
    const blank = pctMode ? ['', '', '', '', ''] : ['', '', '', ''];
    const totals: string[][] = [];
    if (v.ivaRegime === 'acrescido') totals.push(['', 'Honorários sem IVA', ...blank.slice(2), mt(c.soma)], ['', `IVA (${formatPercent(c.taxa)})`, ...blank.slice(2), mt(c.iva)]);
    totals.push(['', v.ivaRegime === 'acrescido' ? 'Total com IVA' : 'Total dos honorários', ...blank.slice(2), mt(c.total)]);

    const signer = professionalSignature(ctx, ctx.profile?.kind === 'empresa' ? 'Pela empresa' : ctx.profile?.genero === 'F' ? 'A Proponente' : 'O Proponente');
    const cols: SignatureColumn[] = [signer];
    if (v.aceitacao) cols.push({ role: 'Aceito — O Cliente', name: str(v.clienteNome) || undefined, detail: 'Data: ___/___/______' });

    const blocks: Block[] = [
      { type: 'reference', ref: v.ref, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: empresa ? undefined : exmo(v.clienteGenero),
        lines: [str(v.clienteNome) || BLANK, str(v.clienteAtencao) ? `A/C ${v.clienteAtencao}` : '', str(v.clienteMorada)].filter(Boolean),
      },
      { type: 'subject', text: `Proposta de honorários — ${semPonto(v.obraDescricao) || BLANK}${str(v.obraLocal) ? `, ${semPonto(v.obraLocal)}` : ''}` },
      { type: 'salutation', text: empresa ? 'Exmos. Senhores,' : `${exmo(v.clienteGenero)},` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `Em resposta ao pedido de V. Ex.ª${v.dataPedido ? ` de ${dateLong(v.dataPedido)}` : ''}, apresentamos a nossa proposta de honorários para a ${serv.pt}${str(v.especialidades) && v.servico !== 'arquitectura' && v.servico !== 'fiscalizacao' ? ` (${semPonto(v.especialidades)})` : ''} de ${semPonto(v.obraDescricao).replace(/^./, (s) => s.toLowerCase()) || BLANK}, sita em ${semPonto(v.obraLocal) || BLANK}${area ? `, com uma área bruta de construção estimada de ${String(area).replace('.', ',')} m²` : ''}.`,
        en: 'In reply to your request, we submit our fee proposal for the services and project stated.',
      },
      { type: 'heading', text: '1. Âmbito, prazos e honorários' },
      {
        type: 'paragraph',
        id: 'ambito',
        text: v.servico === 'fiscalizacao'
          ? `A fiscalização compreende o acompanhamento da execução da obra${int(v.visitasMes) ? `, com ${int(v.visitasMes)} visitas por mês` : ''}, a verificação da conformidade com o projecto, a medição e aprovação dos autos e a participação nas recepções, conforme o quadro seguinte${pctMode && c.totalPct != null ? `, com honorários de ${String(num(v.percentagem)).replace('.', ',')}% do custo estimado da obra` : ''}:`
          : `Os serviços são prestados nas fases seguintes${pctMode && c.totalPct != null ? `, com honorários de ${String(num(v.percentagem)).replace('.', ',')}% do custo estimado da obra, de ${mt(money(v.custoObra))} MT` : ''}:`,
        en: 'Scope by phase, timing and fees.',
        keepWithNext: true,
      },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.4, align: 'center' },
          { label: 'Fase', width: 2.2 },
          { label: 'Entregáveis', width: 2.9 },
          { label: 'Prazo (dias)', width: 0.9, align: 'center' },
          ...(pctMode ? [{ label: '%', width: 0.7, align: 'right' as const }] : []),
          { label: 'Valor (MT)', width: 1.7, align: 'right' },
        ],
        rows: rows.length ? rows : [['1', BLANK, '', '', ...(pctMode ? [''] : []), '']],
        totals,
        note: 'Os prazos contam-se a partir da aprovação da fase anterior pelo cliente e da entrega dos elementos de que dependam.',
      },
      { type: 'heading', text: '2. Condições de pagamento' },
      { type: 'paragraph', id: 'pagamento', text: semPonto(v.pagamento) ? `${semPonto(v.pagamento)}.` : BLANK, en: 'Payment terms.' },
    ];
    let n = 2;
    if (exclusoes.length) {
      blocks.push({ type: 'heading', text: `${++n}. Não incluído` }, { type: 'paragraph', id: 'exclusoes', text: `A presente proposta não inclui: ${exclusoes.map((e) => semPonto(e).replace(/^./, (s) => s.toLowerCase())).join('; ')}. Estes elementos, quando necessários, são orçamentados à parte.`, en: 'Exclusions.' });
    }
    if (v.direitosAutor) {
      blocks.push({ type: 'heading', text: `${++n}. Direitos de autor` }, {
        type: 'paragraph',
        id: 'direitosAutor',
        text: 'O projecto é obra protegida pelo direito de autor e destina-se exclusivamente à construção da obra identificada. A sua utilização noutra obra, ou a sua alteração por terceiros, depende de autorização escrita do autor.',
        en: 'The design is protected by copyright and may be used only for this project; other use or changes by others need the author’s written consent.',
      });
    }
    blocks.push(
      { type: 'heading', text: `${++n}. Validade` },
      { type: 'paragraph', id: 'validade', text: `A presente proposta é válida por ${validade ? `${validade} ${validade === 1 ? 'dia' : 'dias'}` : `${BLANK} dias`} a contar da sua data.`, en: 'Validity of the proposal.' },
      { type: 'paragraph', id: 'fecho', text: 'Ficamos ao dispor de V. Ex.ª para qualquer esclarecimento.\nCom os melhores cumprimentos,', en: 'We remain available for any clarification. Kind regards,', keepWithNext: true },
      { type: 'signatures', columns: cols },
    );
    return blocks;
  },
});
