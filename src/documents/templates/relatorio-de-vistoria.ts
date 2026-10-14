// Relatório de vistoria técnica: an engineer's or architect's report on the
// condition of a property or works (before buying or renting, defects,
// damage after a storm, acceptance of works, common parts of a building).
// Facts, method, findings, analysis and conclusions are kept apart.

import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { BLANK, cite, dateLong, l, lineItems, localField, money, professionalSignature, refField, splitLines } from './_shared';
import { semPonto, str } from './_contratos';
import { mt } from './_construcao';

const FINALIDADES = [
  { value: 'compra', label: l('Antes da compra do imóvel', 'Before buying'), pt: 'avaliar o estado de conservação do imóvel antes da sua aquisição' },
  { value: 'arrendamento', label: l('Entrada ou saída de arrendamento', 'Start or end of a lease'), pt: 'registar o estado do imóvel no início ou no fim do arrendamento' },
  { value: 'defeitos', label: l('Defeitos ou anomalias', 'Defects'), pt: 'identificar as anomalias existentes e as suas causas prováveis' },
  { value: 'sinistro', label: l('Danos (cheia, ciclone, incêndio)', 'Damage (flood, cyclone, fire)'), pt: 'avaliar os danos sofridos pelo imóvel e as intervenções necessárias' },
  { value: 'recepcao', label: l('Recepção de obra', 'Acceptance of works'), pt: 'verificar a conformidade da obra executada com o contrato e o projecto' },
  { value: 'condominio', label: l('Partes comuns de condomínio', 'Common parts of a building'), pt: 'avaliar o estado das partes comuns do edifício' },
  { value: 'outra', label: l('Outra', 'Other'), pt: '' },
];
const GRAVIDADE = [
  { value: 'Ligeira', label: l('Ligeira', 'Minor') },
  { value: 'Moderada', label: l('Moderada', 'Moderate') },
  { value: 'Grave', label: l('Grave', 'Serious') },
  { value: 'Urgente', label: l('Urgente', 'Urgent') },
];
const ESTADO = [
  { value: 'bom', label: l('Bom', 'Good') },
  { value: 'razoavel', label: l('Razoável', 'Fair') },
  { value: 'mau', label: l('Mau', 'Poor') },
  { value: 'omitir', label: l('Não classificar', 'Do not rate') },
];

const METODO = 'A vistoria foi visual e não destrutiva, complementada por medições simples no local. Não foram inspeccionados elementos ocultos ou inacessíveis. As conclusões referem-se ao estado observado à data da vistoria.';

export default defineTemplate({
  id: 'relatorio-de-vistoria',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Relatório', 'Report') },
    { id: 'cliente', title: l('Cliente e imóvel', 'Client and property'), personRole: 'cliente' },
    { id: 'vistoria', title: l('Vistoria', 'Inspection') },
    { id: 'constatacoes', title: l('Constatações', 'Findings') },
    { id: 'conclusoes', title: l('Conclusões e recomendações', 'Conclusions and recommendations') },
  ],
  fields: [
    refField(),
    localField(),
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data do relatório', 'Report date'), default: (c) => c.today },

    { name: 'clienteNome', type: 'text', section: 'cliente', required: true, width: 'half', label: l('Cliente (quem pediu)', 'Client'), personKey: 'nome' },
    { name: 'clienteContacto', type: 'text', section: 'cliente', width: 'half', label: l('Contacto', 'Contact'), personKey: 'telefone' },
    { name: 'imovelDescricao', type: 'text', section: 'cliente', required: true, label: l('Imóvel ou obra', 'Property or works'), placeholder: l('Ex.: apartamento do tipo 3, 4.º andar esquerdo', 'E.g. three-bedroom flat, 4th floor') },
    { name: 'imovelLocal', type: 'text', section: 'cliente', required: true, label: l('Localização', 'Location') },
    { name: 'anoConstrucao', type: 'text', section: 'cliente', width: 'half', label: l('Ano de construção (aprox.)', 'Year built (approx.)') },
    { name: 'finalidade', type: 'select', section: 'cliente', width: 'half', required: true, label: l('Finalidade', 'Purpose'), options: FINALIDADES.map(({ value, label }) => ({ value, label })), default: 'defeitos' },
    { name: 'objectivo', type: 'textarea', section: 'cliente', rows: 2, label: l('Objectivo (se quiser detalhar)', 'Objective (optional detail)') },

    { name: 'dataVistoria', type: 'date', section: 'vistoria', width: 'half', required: true, label: l('Data da vistoria', 'Inspection date'), default: (c) => c.today },
    { name: 'horaVistoria', type: 'text', section: 'vistoria', width: 'half', label: l('Hora', 'Time') },
    { name: 'presentes', type: 'text', section: 'vistoria', label: l('Presentes na vistoria', 'Present at the inspection'), placeholder: l('Ex.: o proprietário, Sr. João Cossa, e o inquilino', 'E.g. the owner and the tenant') },
    { name: 'metodologia', type: 'textarea', section: 'vistoria', rows: 3, default: METODO, label: l('Metodologia e limitações', 'Method and limitations') },
    { name: 'documentos', type: 'textarea', section: 'vistoria', rows: 2, label: l('Documentos consultados (um por linha)', 'Documents consulted (one per line)') },

    {
      name: 'constatacoes',
      type: 'lines',
      section: 'constatacoes',
      label: l('Constatações', 'Findings'),
      addLabel: l('Adicionar constatação', 'Add finding'),
      columns: [
        { name: 'local', type: 'text', label: l('Local / elemento', 'Location / element') },
        { name: 'descricao', type: 'text', label: l('Constatação', 'Finding') },
        { name: 'gravidade', type: 'select', label: l('Gravidade', 'Severity'), options: GRAVIDADE },
        { name: 'foto', type: 'text', label: l('Foto n.º', 'Photo no.') },
      ],
    },
    { name: 'analise', type: 'textarea', section: 'constatacoes', rows: 4, label: l('Análise e causas prováveis', 'Analysis and likely causes') },

    { name: 'estadoGeral', type: 'radio', section: 'conclusoes', label: l('Estado geral de conservação', 'Overall condition'), options: ESTADO, default: 'razoavel' },
    { name: 'conclusoes', type: 'textarea', section: 'conclusoes', required: true, rows: 4, label: l('Conclusões', 'Conclusions') },
    {
      name: 'recomendacoes',
      type: 'lines',
      section: 'conclusoes',
      label: l('Recomendações', 'Recommendations'),
      addLabel: l('Adicionar intervenção', 'Add action'),
      columns: [
        { name: 'intervencao', type: 'text', label: l('Intervenção', 'Action') },
        { name: 'prioridade', type: 'select', label: l('Prioridade', 'Priority'), options: [{ value: 'Imediata', label: l('Imediata', 'Immediate') }, { value: 'Curto prazo', label: l('Curto prazo', 'Short term') }, { value: 'Médio prazo', label: l('Médio prazo', 'Medium term') }] },
        { name: 'custo', type: 'money', label: l('Custo estimado', 'Estimated cost') },
      ],
    },
    { name: 'anexos', type: 'textarea', section: 'conclusoes', rows: 2, default: 'Registo fotográfico', label: l('Anexos (um por linha)', 'Annexes (one per line)') },
    { name: 'tomeiConhecimento', type: 'toggle', section: 'conclusoes', label: l('Linha "Tomei conhecimento" para o cliente (e outra parte)', '"Acknowledged" line for the client (and other party)') },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!ctx.profile?.ordemNumero) {
      w.push({ level: 'warning', message: l(`Conclusões técnicas (segurança estrutural, causas de anomalias) devem ser assinadas por engenheiro ou arquitecto inscrito na Ordem (${cite('inscricaoOrdemEngenheiros')}). Acrescente o número de inscrição ao perfil.`, 'Technical conclusions should be signed by a registered engineer or architect. Add your registration number to the profile.') });
    }
    if (!lineItems(v.constatacoes).some((x) => str(x.descricao))) w.push({ level: 'warning', field: 'constatacoes', message: l('Registe as constatações da vistoria.', 'Record the findings.') });
    if (v.finalidade === 'arrendamento') w.push({ level: 'info', field: 'tomeiConhecimento', message: l('Peça ao senhorio e ao inquilino que assinem um exemplar.', 'Ask landlord and tenant to sign a copy.') });
    w.push({ level: 'info', message: l('Junte as fotografias como anexo numerado e indique o número de cada foto na tabela.', 'Attach the photos as a numbered annex and give each photo number in the table.') });
    return w;
  },

  personName: (v) => v.clienteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fin = FINALIDADES.find((f) => f.value === v.finalidade);
    const objectivo = semPonto(v.objectivo) || fin?.pt || BLANK;
    const cons = lineItems(v.constatacoes).filter((x) => str(x.descricao));
    const recs = lineItems(v.recomendacoes).filter((x) => str(x.intervencao));
    const docs = splitLines(v.documentos);
    const anexos = splitLines(v.anexos);
    const estado = { bom: 'bom', razoavel: 'razoável', mau: 'mau' }[String(v.estadoGeral)];
    let n = 0;
    const h = (t: string): Block => ({ type: 'heading', text: `${++n}. ${t}` });

    const blocks: Block[] = [
      { type: 'title', text: 'Relatório de Vistoria Técnica', subtitle: `Ref.ª ${v.ref || BLANK} · ${ctx.place}, ${dateLong(v.data)}` },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Cliente', value: str(v.clienteNome) || BLANK },
          { label: 'Contacto', value: str(v.clienteContacto) },
          { label: 'Imóvel', value: str(v.imovelDescricao) || BLANK },
          { label: 'Localização', value: str(v.imovelLocal) || BLANK },
          { label: 'Ano de construção', value: str(v.anoConstrucao) },
          { label: 'Vistoria', value: `${dateLong(v.dataVistoria)}${str(v.horaVistoria) ? `, ${v.horaVistoria}` : ''}` },
          { label: 'Presentes', value: str(v.presentes) },
          { label: 'Técnico', value: [professionalSignature(ctx, '').name, ctx.profile?.ordemNumero ? `${/arquitect/i.test(ctx.profile.ordemProfissional ?? '') ? 'OArQ' : 'OrdEM'} n.º ${ctx.profile.ordemNumero}` : ''].filter(Boolean).join(', ') },
        ].filter((i) => i.value),
      },
      h('Objecto'),
      { type: 'paragraph', id: 'objecto', text: `O presente relatório resulta da vistoria realizada em ${dateLong(v.dataVistoria)}, a pedido de ${semPonto(v.clienteNome) || BLANK}, ao imóvel acima identificado, com o objectivo de ${objectivo.replace(/^./, (s) => s.toLowerCase())}.`, en: 'Purpose of the report.' },
      h('Metodologia e limitações'),
      { type: 'paragraph', id: 'metodologia', text: str(v.metodologia) || METODO, en: 'Method and limitations of the inspection.' },
    ];
    if (docs.length) blocks.push(h('Documentos consultados'), { type: 'list', items: docs.map(semPonto) });
    blocks.push(h('Constatações'));
    blocks.push({
      type: 'table',
      columns: [
        { label: 'N.º', width: 0.5, align: 'center' },
        { label: 'Local / elemento', width: 2.1 },
        { label: 'Constatação', width: 4.4 },
        { label: 'Gravidade', width: 1.1, align: 'center' },
        { label: 'Foto', width: 0.7, align: 'center' },
      ],
      rows: cons.length ? cons.map((x, i) => [String(i + 1), str(x.local), str(x.descricao), str(x.gravidade), str(x.foto)]) : [['1', '', BLANK, '', '']],
    });
    if (str(v.analise)) {
      blocks.push(h('Análise e causas prováveis'));
      splitLines(v.analise).forEach((t, i) => blocks.push({ type: 'paragraph', id: `analise-${i + 1}`, text: t, en: 'Analysis.' }));
    }
    blocks.push(h('Conclusões'));
    if (estado) blocks.push({ type: 'paragraph', id: 'estado', text: `O imóvel apresenta, no geral, um estado de conservação **${estado}**.`, en: 'Overall condition.' });
    const conc = splitLines(v.conclusoes);
    (conc.length ? conc : [BLANK]).forEach((t, i) => blocks.push({ type: 'paragraph', id: `conclusao-${i + 1}`, text: t, en: 'Conclusion.' }));
    if (recs.length) {
      const total = recs.reduce((s, r) => s + (money(r.custo) ?? 0), 0);
      blocks.push(h('Recomendações'), {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.5, align: 'center' },
          { label: 'Intervenção recomendada', width: 5.2 },
          { label: 'Prioridade', width: 1.3, align: 'center' },
          { label: 'Custo estimado (MT)', width: 1.6, align: 'right' },
        ],
        rows: recs.map((r, i) => [String(i + 1), str(r.intervencao), str(r.prioridade), mt(money(r.custo))]),
        totals: total > 0 ? [['', 'Total estimado', '', mt(total)]] : undefined,
        note: total > 0 ? 'Custos indicativos, a confirmar por orçamento de empreiteiro.' : undefined,
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'reserva',
      // The annexes are named in this closing paragraph, which stays with the signature (no annex list alone on a last page).
      text: `O presente relatório destina-se exclusivamente ao cliente e ao fim indicado, e baseia-se nas condições observadas à data da vistoria.${anexos.length ? `\n**${anexos.length === 1 ? 'Anexo' : 'Anexos'}:** ${anexos.map((a, i) => (anexos.length === 1 ? a : `${i + 1}. ${a}`)).join('; ')}.` : ''}`,
      en: 'This report is for the client and the stated purpose only, based on conditions at the time of the inspection.',
      size: 'small',
      keepWithNext: true,
    });
    const cols: SignatureColumn[] = [professionalSignature(ctx, 'O Técnico Responsável')];
    if (v.tomeiConhecimento) cols.push({ role: 'Tomei conhecimento', name: str(v.clienteNome) || undefined, detail: 'Data: ___/___/______' });
    blocks.push({ type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: cols });
    return blocks;
  },
});
