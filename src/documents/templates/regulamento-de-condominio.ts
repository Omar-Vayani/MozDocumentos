// Regulamento interno do condomínio: house rules of a building under
// condominium ownership, approved by the owners' meeting. It may not
// contradict the Condominium Regulation (Decreto) or the Civil Code.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, l, lineItems, splitLines } from './_shared';
import { int, num, semPonto, str } from './_contratos';
import { administradorColumn, condominioFields, edificio, fraccoesFields, permil } from './_construcao';

const PARTES_COMUNS = [
  'o solo, os alicerces, as colunas, os pilares, as paredes mestras e todas as partes da estrutura',
  'a cobertura, os terraços de cobertura e as fachadas',
  'as entradas, os vestíbulos, as escadas, os corredores e os elevadores',
  'as instalações gerais de água, electricidade, esgotos, gás e telecomunicações',
  'os reservatórios de água, a bomba, o gerador e a portaria',
  'os pátios, jardins e lugares de estacionamento comuns',
].join('\n');

export default defineTemplate({
  id: 'regulamento-de-condominio',
  family: 'contrato',
  rubricas: false,
  sections: [
    { id: 'edificio', title: l('Edifício', 'Building') },
    { id: 'utilizacao', title: l('Utilização', 'Use') },
    { id: 'encargos', title: l('Quotas e fundo de reserva', 'Fees and reserve fund') },
    { id: 'administracao', title: l('Administração e aprovação', 'Administration and approval') },
  ],
  fields: [
    ...condominioFields('edificio'),
    fraccoesFields('edificio'),
    { name: 'partesComuns', type: 'textarea', section: 'edificio', rows: 5, default: PARTES_COMUNS, label: l('Partes comuns (uma por linha)', 'Common parts (one per line)') },

    {
      name: 'usoFraccoes',
      type: 'radio',
      section: 'utilizacao',
      label: l('Uso das fracções', 'Use of units'),
      options: [
        { value: 'habitacao', label: l('Habitação', 'Housing') },
        { value: 'misto', label: l('Habitação e comércio', 'Housing and shops') },
      ],
      default: 'habitacao',
    },
    { name: 'silencioInicio', type: 'text', section: 'utilizacao', width: 'half', default: '22h00', label: l('Silêncio a partir das', 'Quiet hours from') },
    { name: 'silencioFim', type: 'text', section: 'utilizacao', width: 'half', default: '06h00', label: l('Silêncio até às', 'Quiet hours until') },
    { name: 'obrasHorario', type: 'text', section: 'utilizacao', width: 'half', default: 'das 8h00 às 17h00, nos dias úteis, e das 8h00 às 13h00 aos sábados', label: l('Horário de obras nas fracções', 'Hours for works in units') },
    {
      name: 'animais',
      type: 'radio',
      section: 'utilizacao',
      label: l('Animais de estimação', 'Pets'),
      options: [
        { value: 'regras', label: l('Permitidos, com regras', 'Allowed, with rules') },
        { value: 'omitir', label: l('Não regular', 'Do not regulate') },
      ],
      default: 'regras',
    },
    { name: 'lixo', type: 'text', section: 'utilizacao', label: l('Lixo (local e horário)', 'Rubbish (place and times)'), default: 'em sacos fechados, no contentor do edifício, entre as 18h00 e as 6h00' },
    { name: 'estacionamento', type: 'text', section: 'utilizacao', label: l('Estacionamento', 'Parking'), default: 'cada fracção usa apenas o lugar que lhe está atribuído; é proibido estacionar nas entradas e nas rampas' },
    { name: 'seguranca', type: 'textarea', section: 'utilizacao', rows: 2, label: l('Segurança (portaria, visitantes, gerador, bomba)', 'Security (gate, visitors, generator, pump)'), default: 'Os visitantes identificam-se na portaria. O gerador e a bomba de água são operados apenas pelo pessoal autorizado pelo administrador.' },

    { name: 'diaPagamento', type: 'number', section: 'encargos', width: 'half', min: 1, max: 31, default: 8, label: l('Quotas pagas até ao dia (de cada mês)', 'Fees due by day (each month)') },
    { name: 'contaBancaria', type: 'text', section: 'encargos', width: 'half', label: l('Conta do condomínio (banco e NIB)', 'Condominium account (bank and NIB)'), default: (c) => [c.profile?.banco, c.profile?.nib ? `NIB ${c.profile.nib}` : ''].filter(Boolean).join(', ') },
    { name: 'fundoReservaPct', type: 'number', section: 'encargos', width: 'half', min: 0, max: 100, label: l('Fundo de reserva (% das quotas)', 'Reserve fund (% of fees)'), help: l('Deixe vazio para usar o mínimo legal.', 'Leave empty to use the legal minimum.') },
    { name: 'penalizacao', type: 'text', section: 'encargos', label: l('Consequência do atraso (opcional)', 'Late payment consequence (optional)'), placeholder: l('Ex.: juros de mora à taxa legal', 'E.g. statutory default interest') },

    { name: 'mandatoAnos', type: 'number', section: 'administracao', width: 'half', min: 1, max: 5, default: 1, label: l('Mandato do administrador (anos)', 'Administrator’s term (years)') },
    { name: 'comissaoMoradores', type: 'toggle', section: 'administracao', default: true, label: l('Prever comissão de moradores', 'Provide for a residents’ committee') },
    { name: 'artigosAdicionais', type: 'textarea', section: 'administracao', rows: 3, label: l('Regras adicionais (uma por linha, cada uma vira um artigo)', 'Additional rules (one per line, each becomes an article)') },
    { name: 'dataAprovacao', type: 'date', section: 'administracao', width: 'half', required: true, label: l('Aprovado na assembleia de', 'Approved at the meeting of'), default: (c) => c.today },
    { name: 'actaNumero', type: 'text', section: 'administracao', width: 'half', label: l('Acta n.º', 'Minutes no.') },
    { name: 'presidenteMesa', type: 'text', section: 'administracao', width: 'half', label: l('Presidente da mesa da assembleia', 'Chair of the meeting') },
  ],

  computed: (v, { legal }) => {
    const fr = lineItems(v.fraccoes).filter((f) => str(f.fraccao));
    const soma = fr.reduce((s, f) => s + (num(f.permilagem) ?? 0), 0);
    const minimo = legal.value<{ minimo: number }>('condominioFundoReserva').minimo * 100;
    return { fr, soma, minimo, fundo: num(v.fundoReservaPct) };
  },

  warnings: (_v, { computed: c }) => {
    const w: Warning[] = [];
    if (c.fr.length && Math.abs(c.soma - 1000) > 0.01) w.push({ level: 'error', field: 'fraccoes', message: l(`A permilagem soma ${c.soma}‰; deve somar 1000‰.`, `Shares add up to ${c.soma}‰; they must total 1000‰.`) });
    if (c.fundo != null && c.fundo < c.minimo) w.push({ level: 'warning', field: 'fundoReservaPct', message: l(`A contribuição para o fundo comum de reserva é inferior ao mínimo legal de ${c.minimo}% (${cite('condominioFundoReserva')}).`, `The reserve fund contribution is below the legal minimum of ${c.minimo}%.`) });
    w.push({ level: 'info', message: l(`O regulamento só vincula depois de aprovado em assembleia e não pode contrariar o ${cite('condominioRegulamento')} nem o Código Civil. Entregue cópia a cada condómino e arrendatário.`, 'The rules bind only once approved by the meeting and may not contradict the law. Give a copy to every owner and tenant.') });
    return w;
  },

  personName: (v) => v.edificioNome,
  documentDate: (v) => v.dataAprovacao,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const ed = edificio(v);
    const partes = splitLines(v.partesComuns);
    const fundo = c.fundo ?? c.minimo;
    const mandato = int(v.mandatoAnos);
    const extras = splitLines(v.artigosAdicionais);

    const cap1: ClauseItem[] = [
      { id: 'objecto', heading: 'Objecto e âmbito', text: `O presente Regulamento estabelece as regras de utilização, conservação e administração das partes comuns do ${ed}, sito em ${semPonto(v.edificioMorada) || BLANK}, constituído em regime de propriedade horizontal, e aplica-se a todos os condóminos, arrendatários e ocupantes das fracções, sem prejuízo do disposto no Regulamento do Regime Jurídico do Condomínio e no Código Civil.`, en: 'Purpose and scope.' },
      {
        id: 'composicao',
        heading: 'Composição',
        text: c.fr.length ? `O edifício é composto por ${c.fr.length} fracções autónomas, com as permilagens constantes do quadro anexo a este Regulamento, que corresponde ao título constitutivo da propriedade horizontal.` : 'O edifício é composto pelas fracções autónomas constantes do título constitutivo da propriedade horizontal, com as respectivas permilagens.',
        en: 'Units and shares.',
      },
      { id: 'partesComuns', heading: 'Partes comuns', text: 'São partes comuns do edifício, nomeadamente:', items: partes.length ? partes.map(semPonto) : [BLANK], en: 'Common parts.' },
    ];
    const cap2: ClauseItem[] = [
      { id: 'uso', heading: 'Uso das fracções', text: `As fracções destinam-se a ${v.usoFraccoes === 'misto' ? 'habitação e, as do rés-do-chão, a comércio ou serviços' : 'habitação'}, não podendo ser usadas para actividades ruidosas, insalubres, perigosas ou contrárias aos bons costumes.`, en: 'Use of units.' },
      { id: 'sossego', heading: 'Sossego', text: `Entre as ${str(v.silencioInicio) || BLANK} e as ${str(v.silencioFim) || BLANK} os ocupantes evitam ruídos que perturbem os vizinhos, nomeadamente música, festas e obras.`, en: 'Quiet hours.' },
      { id: 'usoComuns', heading: 'Partes comuns', text: 'É proibido ocupar os corredores, escadas, entradas e garagens comuns com objectos, bem como alterar a fachada, a cor exterior, as grades ou as varandas, ou instalar aparelhos de ar condicionado e antenas nas fachadas, sem autorização da assembleia.', en: 'Use of common parts.' },
      { id: 'obras', heading: 'Obras nas fracções', text: `As obras nas fracções são comunicadas previamente ao administrador, realizam-se ${semPonto(v.obrasHorario) || BLANK}, não podem afectar a estrutura do edifício nem as instalações comuns, e o entulho é removido por conta do condómino.`, en: 'Works inside units.' },
    ];
    if (v.animais === 'regras') cap2.push({ id: 'animais', heading: 'Animais', text: 'É permitida a permanência de animais de estimação nas fracções, desde que não perturbem os vizinhos nem sujem as partes comuns, onde circulam sempre acompanhados e, no caso de cães, com trela.', en: 'Pets.' });
    cap2.push(
      { id: 'lixo', heading: 'Lixo', text: `O lixo é depositado ${semPonto(v.lixo) || BLANK}.`, en: 'Rubbish.' },
      { id: 'estacionamento', heading: 'Estacionamento', text: `${semPonto(v.estacionamento).replace(/^./, (s) => s.toUpperCase()) || BLANK}.`, en: 'Parking.' },
    );
    if (str(v.seguranca)) cap2.push({ id: 'seguranca', heading: 'Segurança', text: semPonto(v.seguranca) + '.', en: 'Security.' });
    cap2.push({ id: 'arrendamento', heading: 'Arrendamento das fracções', text: 'O condómino que arrende a sua fracção comunica ao administrador a identificação do arrendatário e entrega-lhe cópia do presente Regulamento. O contrato de arrendamento indica quem é responsável pelo pagamento das quotas.', en: 'Letting of units; the lease states who pays the fees.' });

    const cap3: ClauseItem[] = [
      { id: 'quotas', heading: 'Quotas', text: `Os condóminos contribuem para as despesas comuns na proporção da permilagem da sua fracção. As quotas são fixadas anualmente pela assembleia no orçamento e pagas até ao dia ${int(v.diaPagamento) ?? BLANK} de cada mês${str(v.contaBancaria) ? `, por depósito ou transferência para a conta do condomínio (${semPonto(v.contaBancaria)})` : ''}.`, en: 'Fees by per-mille share, due monthly.' },
      { id: 'fundo', heading: 'Fundo comum de reserva', text: `É constituído um fundo comum de reserva para as despesas de conservação do edifício, para o qual cada condómino contribui com ${String(fundo).replace('.', ',')}% da sua quota, depositado em conta bancária própria e que não pode ser usado em despesas correntes.`, en: 'Reserve fund.' },
      { id: 'atraso', heading: 'Atraso no pagamento', text: `${str(v.penalizacao) ? `Os condóminos em atraso ficam sujeitos a ${semPonto(v.penalizacao).replace(/^./, (s) => s.toLowerCase())}. ` : ''}O acesso às partes e serviços comuns pode ser condicionado ao pagamento das quotas, nos termos da lei, e o administrador promove a cobrança das quotas em dívida.`, en: 'Late payment.' },
    ];
    const cap4: ClauseItem[] = [
      { id: 'orgaos', heading: 'Órgãos', text: `São órgãos do condomínio a assembleia de condóminos e o administrador${v.comissaoMoradores ? ', apoiados por uma comissão de moradores' : ''}.`, en: 'Bodies of the condominium.' },
      { id: 'assembleia', heading: 'Assembleia de condóminos', text: 'A assembleia reúne ordinariamente uma vez por ano, para aprovar as contas e o orçamento, e extraordinariamente quando convocada pelo administrador ou pelos condóminos nos termos da lei. É convocada por carta registada, ou por outro meio aceite por escrito por todos os condóminos, com a antecedência legal, e delibera por maioria dos votos correspondentes à permilagem.', en: 'Owners’ meeting.' },
      { id: 'administrador', heading: 'Administrador', text: `O administrador é eleito pela assembleia por ${mandato ? `${mandato} ${mandato === 1 ? 'ano' : 'anos'}` : `${BLANK} anos`}, renovável, podendo ser um condómino ou uma empresa de administração. Compete-lhe convocar a assembleia, elaborar o orçamento, cobrar as quotas, pagar as despesas comuns, conservar as partes comuns, executar as deliberações e prestar contas anualmente.`, en: 'Administrator.' },
    ];
    if (v.comissaoMoradores) cap4.push({ id: 'comissao', heading: 'Comissão de moradores', text: 'A comissão de moradores é composta por condóminos ou arrendatários eleitos pela assembleia e apoia o administrador, acompanha os serviços comuns e procura resolver amigavelmente os conflitos entre moradores.', en: 'Residents’ committee.' });
    extras.forEach((t, i) => cap4.push({ id: `extra-${i + 1}`, text: semPonto(t) + '.', en: 'Additional rule.' }));

    const cap5: ClauseItem[] = [
      { id: 'infraccoes', heading: 'Infracções', text: 'As infracções ao presente Regulamento são advertidas por escrito pelo administrador; persistindo, a assembleia delibera as medidas adequadas, nos termos da lei.', en: 'Breaches.' },
      { id: 'alteracao', heading: 'Alteração', text: 'O presente Regulamento pode ser alterado por deliberação da assembleia de condóminos.', en: 'Amendment.' },
      { id: 'vigor', heading: 'Aprovação e entrada em vigor', text: `O presente Regulamento foi aprovado na assembleia de condóminos de ${dateLong(v.dataAprovacao)}${str(v.actaNumero) ? ` (acta n.º ${semPonto(v.actaNumero)})` : ''} e entra em vigor na data da sua aprovação.`, en: 'Approval and entry into force.' },
    ];

    const caps: [string, ClauseItem[]][] = [
      ['CAPÍTULO I — Disposições gerais', cap1],
      ['CAPÍTULO II — Utilização', cap2],
      ['CAPÍTULO III — Encargos', cap3],
      ['CAPÍTULO IV — Administração', cap4],
      ['CAPÍTULO V — Disposições finais', cap5],
    ];
    const blocks: Block[] = [{ type: 'title', text: 'Regulamento Interno do Condomínio', subtitle: ed }];
    let start = 1;
    for (const [h, items] of caps) {
      blocks.push({ type: 'heading', text: h, align: 'center' });
      // One block per article so a chapter can flow across pages.
      for (const it of items) blocks.push({ type: 'numberedClauses', style: 'artigo', items: [it], start: start++ });
    }
    const last = blocks[blocks.length - 1];
    last.keepWithNext = true;
    blocks.push({ type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.dataAprovacao)}`, columns: [{ role: 'O Presidente da Mesa', name: str(v.presidenteMesa) || undefined }, administradorColumn(v)] });
    if (c.fr.length) {
      blocks.push({ type: 'pageBreakHint' }, {
        type: 'table',
        caption: 'Anexo — Fracções e permilagem',
        columns: [
          { label: 'Fracção', width: 1.2 },
          { label: 'Condómino', width: 4 },
          { label: 'Permilagem', width: 1.3, align: 'right' },
        ],
        rows: c.fr.map((f: Record<string, unknown>) => [str(f.fraccao), str(f.condomino), permil(num(f.permilagem))]),
        totals: [['Total', '', permil(c.soma)]],
      });
    }
    return blocks;
  },
});
