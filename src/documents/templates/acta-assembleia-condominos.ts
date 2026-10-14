// Acta da assembleia de condóminos: attendance by per-mille share, accounts,
// budget and the resulting fee table per unit, reserve fund, election of the
// administrator and the decisions, with votes counted by share.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateLong, l, lineItems, money, splitLines } from './_shared';
import { num, semPonto, str } from './_contratos';
import { condominioFields, dataPorExtenso, edificio, hora, mt, permil, r2 } from './_construcao';

const SITUACAO = [
  { value: 'presente', label: l('Presente', 'Present') },
  { value: 'representado', label: l('Representado', 'Represented') },
  { value: 'ausente', label: l('Ausente', 'Absent') },
];
const RESULTADO = [
  { value: 'unanimidade', label: l('Aprovado por unanimidade', 'Approved unanimously') },
  { value: 'maioria', label: l('Aprovado por maioria', 'Approved by majority') },
  { value: 'rejeitado', label: l('Rejeitado', 'Rejected') },
  { value: 'informativo', label: l('Ponto informativo (sem votação)', 'For information (no vote)') },
];

type Fr = { fraccao: string; condomino: string; permilagem: number; situacao: string; representante: string };

export default defineTemplate({
  id: 'acta-assembleia-condominos',
  family: 'acta',
  sections: [
    { id: 'reuniao', title: l('Reunião', 'Meeting') },
    { id: 'presencas', title: l('Fracções e presenças', 'Units and attendance') },
    { id: 'orcamento', title: l('Contas, orçamento e quotas', 'Accounts, budget and fees') },
    { id: 'deliberacoes', title: l('Deliberações', 'Decisions') },
    { id: 'encerramento', title: l('Encerramento', 'Closing') },
  ],
  fields: [
    { name: 'numero', type: 'text', section: 'reuniao', width: 'half', required: true, label: l('Acta n.º', 'Minutes no.') },
    ...condominioFields('reuniao', { administrador: false }),
    { name: 'tipo', type: 'radio', section: 'reuniao', label: l('Assembleia', 'Meeting'), options: [{ value: 'ordinaria', label: l('Ordinária', 'Ordinary') }, { value: 'extraordinaria', label: l('Extraordinária', 'Extraordinary') }], default: 'ordinaria' },
    { name: 'data', type: 'date', section: 'reuniao', width: 'half', required: true, label: l('Data da reunião', 'Meeting date'), default: (c) => c.today },
    { name: 'horaInicio', type: 'text', section: 'reuniao', width: 'half', label: l('Hora de início', 'Start time'), placeholder: l('Ex.: 18:00', 'E.g. 18:00') },
    { name: 'localReuniao', type: 'text', section: 'reuniao', label: l('Local', 'Place'), default: 'na sala de condomínio do edifício' },
    { name: 'convocatoria', type: 'radio', section: 'reuniao', label: l('Convocatória', 'Call'), options: [{ value: 'primeira', label: l('Primeira convocatória', 'First call') }, { value: 'segunda', label: l('Segunda convocatória', 'Second call') }], default: 'primeira' },
    { name: 'dataConvocatoria', type: 'date', section: 'reuniao', width: 'half', label: l('Data da convocatória', 'Date of the notice') },
    { name: 'meioConvocatoria', type: 'text', section: 'reuniao', width: 'half', default: 'carta registada', label: l('Meio da convocatória', 'Notice sent by') },
    { name: 'ordemTrabalhos', type: 'textarea', section: 'reuniao', required: true, rows: 4, label: l('Ordem de trabalhos (um ponto por linha)', 'Agenda (one item per line)') },
    { name: 'presidente', type: 'text', section: 'reuniao', width: 'half', required: true, label: l('Presidente da mesa', 'Chair') },
    { name: 'secretario', type: 'text', section: 'reuniao', width: 'half', required: true, label: l('Secretário', 'Secretary') },

    {
      name: 'fraccoes',
      type: 'lines',
      section: 'presencas',
      label: l('Fracções (todas, incluindo as ausentes)', 'Units (all, including absent)'),
      help: l('A permilagem consta do título constitutivo. O quórum e as quotas são calculados a partir desta lista.', 'The per-mille share is in the deed. Quorum and fees are computed from this list.'),
      addLabel: l('Adicionar fracção', 'Add unit'),
      columns: [
        { name: 'fraccao', type: 'text', label: l('Fracção', 'Unit') },
        { name: 'condomino', type: 'text', label: l('Condómino', 'Owner') },
        { name: 'permilagem', type: 'number', label: l('Permilagem (‰)', 'Share (‰)') },
        { name: 'situacao', type: 'select', label: l('Situação', 'Attendance'), options: SITUACAO },
        { name: 'representante', type: 'text', label: l('Representado por', 'Represented by') },
      ],
    },

    { name: 'contasReceitas', type: 'money', section: 'orcamento', width: 'half', label: l('Receitas do exercício anterior', 'Last year’s income') },
    { name: 'contasDespesas', type: 'money', section: 'orcamento', width: 'half', label: l('Despesas do exercício anterior', 'Last year’s expenses') },
    { name: 'contasResultado', type: 'select', section: 'orcamento', width: 'half', label: l('Contas', 'Accounts'), options: RESULTADO, default: 'unanimidade' },
    { name: 'orcamentoAnual', type: 'money', section: 'orcamento', width: 'half', label: l('Orçamento anual das despesas comuns', 'Annual budget of common expenses') },
    { name: 'orcamentoResultado', type: 'select', section: 'orcamento', width: 'half', label: l('Orçamento', 'Budget'), options: RESULTADO, default: 'unanimidade' },
    { name: 'fundoReservaPct', type: 'number', section: 'orcamento', width: 'half', min: 0, max: 100, label: l('Fundo comum de reserva (% das quotas)', 'Reserve fund (% of fees)'), help: l('Vazio = mínimo legal.', 'Empty = legal minimum.') },
    { name: 'quadroQuotas', type: 'toggle', section: 'orcamento', default: true, label: l('Incluir quadro de quotas por fracção', 'Include fee table per unit') },
    { name: 'administradorEleito', type: 'text', section: 'orcamento', width: 'half', label: l('Administrador eleito (se houve eleição)', 'Administrator elected (if any)') },
    { name: 'mandatoFim', type: 'date', section: 'orcamento', width: 'half', label: l('Mandato até', 'Term until'), showIf: (v) => Boolean(str(v.administradorEleito)) },

    {
      name: 'deliberacoes',
      type: 'lines',
      section: 'deliberacoes',
      label: l('Outros pontos e deliberações', 'Other items and decisions'),
      addLabel: l('Adicionar ponto', 'Add item'),
      columns: [
        { name: 'assunto', type: 'text', label: l('Assunto', 'Item') },
        { name: 'texto', type: 'textarea', label: l('Discussão e decisão', 'Discussion and decision') },
        { name: 'resultado', type: 'select', label: l('Resultado', 'Result'), options: RESULTADO },
        { name: 'contra', type: 'number', label: l('Votos contra (‰)', 'Against (‰)') },
        { name: 'abstencao', type: 'number', label: l('Abstenções (‰)', 'Abstentions (‰)') },
      ],
    },

    { name: 'horaEncerramento', type: 'text', section: 'encerramento', width: 'half', label: l('Hora de encerramento', 'Closing time') },
    { name: 'notificarAusentes', type: 'toggle', section: 'encerramento', default: true, label: l('Notificar os ausentes por carta registada', 'Notify absent owners by registered letter') },
    { name: 'assinaturaTodos', type: 'toggle', section: 'encerramento', label: l('Lista de assinaturas dos condóminos presentes', 'Signature list of owners present') },
  ],

  computed: (v, { legal }) => {
    const fr: Fr[] = lineItems(v.fraccoes)
      .filter((f) => str(f.fraccao) || str(f.condomino))
      .map((f) => ({ fraccao: str(f.fraccao), condomino: str(f.condomino), permilagem: num(f.permilagem) ?? 0, situacao: str(f.situacao) || 'presente', representante: str(f.representante) }));
    const total = fr.reduce((s, f) => s + f.permilagem, 0);
    const presente = fr.filter((f) => f.situacao !== 'ausente').reduce((s, f) => s + f.permilagem, 0);
    const minimo = legal.value<{ minimo: number }>('condominioFundoReserva').minimo * 100;
    const fundoPct = num(v.fundoReservaPct) ?? minimo;
    const orc = money(v.orcamentoAnual);
    const quotas = orc != null && total > 0
      ? fr.map((f) => {
          const mensal = r2((orc * f.permilagem) / total / 12);
          const fundo = r2((mensal * fundoPct) / 100);
          return { ...f, mensal, fundo, totalMes: r2(mensal + fundo) };
        })
      : [];
    return { fr, total, presente, fundoPct, minimo, orc, quotas };
  },

  warnings: (v, { computed: c, legal }) => {
    const w: Warning[] = [];
    if (c.fr.length && Math.abs(c.total - 1000) > 0.01) w.push({ level: 'warning', field: 'fraccoes', message: l(`A permilagem das fracções soma ${c.total}‰; deve somar 1000‰.`, `Shares add up to ${c.total}‰; they must total 1000‰.`) });
    const q = legal.value<{ segundaReuniaoQuorum: number }>('condominioAssembleia');
    if (c.fr.length && c.total > 0) {
      if (v.convocatoria === 'primeira' && c.presente / c.total <= 0.5) {
        w.push({ level: 'warning', field: 'fraccoes', message: l(`Em primeira convocatória a assembleia delibera por maioria do valor do prédio; estão presentes ${permil(c.presente)} (${cite('condominioAssembleia')}).`, 'At the first call, decisions need a majority of the building’s value.') });
      }
      if (v.convocatoria === 'segunda' && c.presente / c.total < q.segundaReuniaoQuorum) {
        w.push({ level: 'warning', field: 'fraccoes', message: l(`Em segunda convocatória os presentes devem representar pelo menos ${Math.round(q.segundaReuniaoQuorum * 100)}% do valor do prédio.`, 'At the second call, those present must hold the minimum share of the building’s value.') });
      }
    }
    if (c.fundoPct < c.minimo) w.push({ level: 'warning', field: 'fundoReservaPct', message: l(`A contribuição para o fundo comum de reserva é inferior ao mínimo legal (${cite('condominioFundoReserva')}).`, 'The reserve fund contribution is below the legal minimum.') });
    w.push({ level: 'info', message: l(`Comunique as deliberações aos condóminos ausentes por carta registada, sobretudo as que aprovem obras (${cite('condominioObrasComuns')}). Guarde as actas em livro ou pasta própria.`, 'Send the decisions to absent owners by registered letter, especially works approvals. Keep the minutes in a dedicated book or file.') });
    return w;
  },

  personName: (v) => v.edificioNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const ed = edificio(v);
    const tipo = v.tipo === 'extraordinaria' ? 'Extraordinária' : 'Ordinária';
    const pontos = splitLines(v.ordemTrabalhos);
    const resultadoTxt = (r: string, contra?: number | null, abst?: number | null) => {
      const favor = r2(c.presente - (contra ?? 0) - (abst ?? 0));
      if (r === 'informativo') return 'O ponto foi apresentado para informação, sem votação.';
      if (r === 'rejeitado') return `Posto à votação, foi rejeitado${contra ? `, com votos contra correspondentes a ${permil(contra)}` : ''}.`;
      if (r === 'maioria') return `Posto à votação, foi aprovado por maioria, com votos a favor correspondentes a ${permil(favor)}${contra ? `, ${permil(contra)} contra` : ''}${abst ? ` e ${permil(abst)} de abstenções` : ''}.`;
      return 'Posto à votação, foi aprovado por unanimidade dos presentes.';
    };

    const blocks: Block[] = [
      { type: 'title', text: `Acta n.º ${str(v.numero) || BLANK}`, subtitle: `Assembleia ${tipo} de Condóminos do ${ed}` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${dataPorExtenso(v.data)}${str(v.horaInicio) ? `, ${hora(v.horaInicio, 'pelas')}` : ''}, ${v.convocatoria === 'segunda' ? 'em segunda convocatória' : 'em primeira convocatória'}, reuniu ${semPonto(v.localReuniao) || BLANK} a Assembleia ${tipo} dos Condóminos do ${ed}, sito em ${semPonto(v.edificioMorada) || BLANK}${v.dataConvocatoria ? `, convocada por ${semPonto(v.meioConvocatoria) || 'carta'} de ${dateLong(v.dataConvocatoria)}` : ''}, com a seguinte ordem de trabalhos:`,
        en: 'Opening: date, place, call and agenda.',
        keepWithNext: true,
      },
      { type: 'list', style: 'numeric', items: pontos.length ? pontos.map(semPonto) : [BLANK] },
      { type: 'paragraph', id: 'mesa', text: `Presidiu à reunião ${semPonto(v.presidente) || BLANK}, secretariado por ${semPonto(v.secretario) || BLANK}.`, en: 'Chair and secretary.' },
    ];
    if (c.fr.length) {
      blocks.push({
        type: 'table',
        caption: 'Presenças',
        columns: [
          { label: 'Fracção', width: 0.9 },
          { label: 'Condómino', width: 3.2 },
          { label: 'Permilagem', width: 1.1, align: 'right' },
          { label: 'Situação', width: 2.6 },
        ],
        rows: (c.fr as Fr[]).map((f) => [f.fraccao, f.condomino, permil(f.permilagem), f.situacao === 'representado' ? `Representado${f.representante ? ` por ${f.representante}` : ''}` : f.situacao === 'ausente' ? 'Ausente' : 'Presente']),
        totals: [['', 'Presentes e representados', permil(c.presente), `de ${permil(c.total)}`]],
      });
      blocks.push({ type: 'paragraph', id: 'quorum', text: `Estavam presentes ou representados condóminos correspondentes a ${permil(c.presente)} do valor total do prédio, pelo que a assembleia ${v.convocatoria === 'segunda' ? 'reuniu em segunda convocatória, nos termos legais' : 'podia deliberar validamente'}.`, en: 'Quorum.' });
    }

    let n = 0;
    const ponto = (t: string): Block => ({ type: 'heading', text: `Ponto ${++n} — ${t}` });
    if (money(v.contasReceitas) != null || money(v.contasDespesas) != null) {
      const rec = money(v.contasReceitas) ?? 0;
      const desp = money(v.contasDespesas) ?? 0;
      blocks.push(ponto('Contas do exercício anterior'), { type: 'paragraph', id: 'contas', text: `O administrador apresentou as contas do exercício anterior, com receitas de ${mt(rec)} MT, despesas de ${mt(desp)} MT e um saldo de ${mt(rec - desp)} MT. ${resultadoTxt(String(v.contasResultado))}`, en: 'Accounts.' });
    }
    if (c.orc != null) {
      blocks.push(ponto('Orçamento e quotas'), {
        type: 'paragraph',
        id: 'orcamento',
        text: `Foi apresentado o orçamento das despesas comuns para o ano, no valor de ${mt(c.orc)} MT, a repartir pelos condóminos na proporção da permilagem das suas fracções, acrescido da contribuição de ${String(c.fundoPct).replace('.', ',')}% para o fundo comum de reserva. ${resultadoTxt(String(v.orcamentoResultado))}${v.quadroQuotas && c.quotas.length ? ' As quotas mensais ficam fixadas conforme o quadro seguinte:' : ''}`,
        en: 'Budget and fees.',
        keepWithNext: Boolean(v.quadroQuotas && c.quotas.length),
      });
      if (v.quadroQuotas && c.quotas.length) {
        const tot = (k: 'mensal' | 'fundo' | 'totalMes') => r2(c.quotas.reduce((s: number, q: Record<string, number>) => s + q[k], 0));
        blocks.push({
          type: 'table',
          columns: [
            { label: 'Fracção', width: 0.9 },
            { label: 'Condómino', width: 3 },
            { label: 'Permil.', width: 1, align: 'right' },
            { label: 'Quota (MT)', width: 1.2, align: 'right' },
            { label: 'Fundo reserva', width: 1.2, align: 'right' },
            { label: 'Total/mês (MT)', width: 1.3, align: 'right' },
          ],
          rows: c.quotas.map((q: Fr & { mensal: number; fundo: number; totalMes: number }) => [q.fraccao, q.condomino, permil(q.permilagem), mt(q.mensal), mt(q.fundo), mt(q.totalMes)]),
          totals: [['Total', '', permil(c.total), mt(tot('mensal')), mt(tot('fundo')), mt(tot('totalMes'))]],
        });
      }
    }
    if (str(v.administradorEleito)) {
      blocks.push(ponto('Eleição do administrador'), { type: 'paragraph', id: 'eleicao', text: `Foi eleito administrador do condomínio ${semPonto(v.administradorEleito)}${v.mandatoFim ? `, com mandato até ${dateLong(v.mandatoFim)}` : ''}, que aceitou o cargo.`, en: 'Election of the administrator.' });
    }
    lineItems(v.deliberacoes)
      .filter((d) => str(d.assunto) || str(d.texto))
      .forEach((d, i) => {
        blocks.push(ponto(semPonto(d.assunto) || 'Outros assuntos'), {
          type: 'paragraph',
          id: `deliberacao-${i + 1}`,
          text: `${str(d.texto) ? `${semPonto(d.texto)}. ` : ''}${resultadoTxt(str(d.resultado) || 'unanimidade', num(d.contra), num(d.abstencao))}`,
          en: 'Item and decision.',
        });
      });

    blocks.push({
      type: 'paragraph',
      id: 'encerramento',
      text: `Nada mais havendo a tratar, foi encerrada a sessão${str(v.horaEncerramento) ? ` ${hora(v.horaEncerramento, 'pelas')}` : ''}, dela se lavrando a presente acta, que, depois de lida e aprovada, vai ser assinada pelo Presidente e pelo Secretário${v.assinaturaTodos ? ' e pelos condóminos presentes' : ''}.${v.notificarAusentes ? ' As deliberações são comunicadas aos condóminos ausentes por carta registada.' : ''}`,
      en: 'Closing of the meeting and signature of the minutes.',
      keepWithNext: true,
    });
    blocks.push({ type: 'signatures', columns: [{ role: 'O Presidente da Mesa', name: str(v.presidente) || undefined }, { role: 'O Secretário', name: str(v.secretario) || undefined }] });
    if (v.assinaturaTodos) {
      const presentes = (c.fr as Fr[]).filter((f) => f.situacao !== 'ausente');
      blocks.push({
        type: 'table',
        caption: 'Assinaturas dos condóminos presentes ou representantes',
        columns: [
          { label: 'Fracção', width: 0.9 },
          { label: 'Nome', width: 3.6 },
          { label: 'Assinatura', width: 3.5 },
        ],
        rows: (presentes.length ? presentes : [{ fraccao: '', condomino: '', representante: '' } as Fr]).map((f) => [f.fraccao, f.representante || f.condomino, '']),
      });
    }
    return blocks;
  },
});
