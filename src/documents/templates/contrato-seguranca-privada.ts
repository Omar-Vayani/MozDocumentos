// Contrato de prestação de serviços de segurança privada: guarding posts,
// shifts, armed or unarmed guards, patrols, occurrence book, supervision,
// limits of private security (no arrests outside flagrante delicto, no
// searches without consent), liability and insurance, price per post. Only
// companies licensed by the Ministry of the Interior may provide the service.

import { roundMoney } from '@/lib/format';
import type { MinimumWage } from '@/legal/mz-legal';
import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, lines, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import { clCessacao, clConfidencialidade, clForcaMaior, contratoBlocks, formaPagamentoFields, ivaField, ivaTexto, modoPagamento, prazo, titularDe } from './_digital';

type Posto = { local: string; horario: string; vigilantes: number | null; armado: string; preco: number | null };
const postos = (v: Values): Posto[] =>
  lines(v.postos)
    .map((r) => ({ local: str(r.local), horario: str(r.horario), vigilantes: Number(r.vigilantes) || null, armado: str(r.armado) || 'nao', preco: money(r.preco) }))
    .filter((r) => r.local);

export default defineTemplate({
  id: 'contrato-seguranca-privada',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'prestador', title: l('Empresa de segurança', 'Security company'), personRole: 'outro' },
    { id: 'cliente', title: l('Cliente', 'Client'), personRole: 'cliente' },
    { id: 'servico', title: l('Postos e serviços', 'Posts and services') },
    { id: 'preco', title: l('Preço e duração', 'Price and term') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('prestador', { fromProfile: true, tipoDefault: 'empresa' }),
    { name: 'alvara', type: 'text', section: 'prestador', required: true, label: l('Alvará ou licença de segurança privada', 'Private security licence'), default: (c) => c.profile?.licenca || '' },
    ...partyFields('cliente', { tipoDefault: 'empresa', osfl: true }),

    { name: 'instalacoes', type: 'text', section: 'servico', required: true, label: l('Instalações a proteger', 'Premises to protect'), placeholder: l('Ex.: armazém e escritórios na Avenida das Indústrias, n.º 1200, Machava', 'E.g. warehouse and offices') },
    {
      name: 'postos',
      type: 'lines',
      section: 'servico',
      label: l('Postos de vigilância', 'Guard posts'),
      addLabel: l('Adicionar posto', 'Add post'),
      columns: [
        { name: 'local', type: 'text', label: l('Posto', 'Post') },
        { name: 'horario', type: 'text', label: l('Horário', 'Hours') },
        { name: 'vigilantes', type: 'number', label: l('Vigilantes por turno', 'Guards per shift') },
        { name: 'armado', type: 'select', label: l('Armado', 'Armed'), options: [{ value: 'nao', label: l('Não', 'No') }, { value: 'sim', label: l('Sim', 'Yes') }] },
        { name: 'preco', type: 'money', label: l('Preço mensal', 'Monthly price') },
      ],
      default: [{ local: 'Portão principal', horario: 'diurno e nocturno, todos os dias', vigilantes: 1, armado: 'nao', preco: '' }],
    },
    { name: 'rondas', type: 'toggle', section: 'servico', default: true, label: l('Rondas de supervisão', 'Supervisor patrols') },
    { name: 'reaccao', type: 'toggle', section: 'servico', default: true, label: l('Equipa de reacção rápida (piquete)', 'Rapid response team') },
    { name: 'reaccaoMin', type: 'number', section: 'servico', width: 'half', min: 1, max: 240, default: 20, label: l('Tempo máximo de chegada do piquete (minutos)', 'Response team arrival time (minutes)'), showIf: (v) => Boolean(v.reaccao) },
    { name: 'equipamento', type: 'text', section: 'servico', label: l('Equipamento dos vigilantes', 'Guards’ equipment'), default: 'farda, cartão de identificação, rádio ou telemóvel, lanterna e cassetete' },
    { name: 'cctv', type: 'toggle', section: 'servico', default: false, label: l('Inclui monitorização de câmaras ou alarme', 'Includes CCTV or alarm monitoring') },

    ivaField('preco'),
    { name: 'pagamentoDia', type: 'number', section: 'preco', width: 'half', min: 1, max: 31, default: 10, label: l('Pagamento até ao dia', 'Payment by day') },
    ...formaPagamentoFields('preco'),
    { name: 'dataInicio', type: 'date', section: 'preco', width: 'half', required: true, label: l('Início do serviço', 'Start of service') },
    { name: 'duracaoMeses', type: 'number', section: 'preco', width: 'half', min: 1, max: 60, default: 12, label: l('Duração (meses)', 'Term (months)') },
    { name: 'avisoDias', type: 'number', section: 'preco', width: 'half', min: 0, max: 180, default: 30, label: l('Aviso prévio para não renovar ou denunciar (dias)', 'Notice (days)') },
    { name: 'seguroValor', type: 'money', section: 'preco', width: 'half', label: l('Seguro de responsabilidade civil (capital)', 'Liability insurance cover') },
    { name: 'limiteIndemnizacao', type: 'money', section: 'preco', width: 'half', label: l('Limite de indemnização por ocorrência (opcional)', 'Liability cap per incident (optional)') },

    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const ps = postos(v);
    const total = ps.some((p) => p.preco != null) ? roundMoney(ps.reduce((s, p) => s + (p.preco ?? 0), 0)) : null;
    return { postos: ps, total };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [...partyWarnings(v, 'prestador', 'empresa de segurança', 'security company'), ...partyWarnings(v, 'cliente', 'cliente', 'client')];
    if (!str(v.alvara)) w.push({ level: 'error', field: 'alvara', message: l(`Indique o alvará: só empresas licenciadas pelo Ministério do Interior podem prestar segurança privada (${cite('turSegurancaPrivadaLicenca')}). Peça cópia do alvará antes de contratar.`, 'Enter the licence: only companies licensed by the Ministry of the Interior may provide private security. Ask for a copy before contracting.') });
    if (c.total == null) w.push({ level: 'warning', field: 'postos', message: l('Indique o preço mensal de cada posto.', 'Enter the monthly price of each post.') });
    const tabela = ctx.legal.value<MinimumWage[]>('salarioMinimo');
    const sm = Array.isArray(tabela) ? tabela.find((x) => /seguran/i.test(x.sector)) : undefined;
    if (sm && c.postos.some((p: Posto) => p.preco != null && p.vigilantes != null && p.preco < sm.value * p.vigilantes * (/noct|24|dia e noite|diurno e nocturno/i.test(p.horario) ? 2 : 1))) {
      w.push({ level: 'warning', field: 'postos', message: l(`Há postos com preço inferior ao custo do salário mínimo do sector da segurança privada (${formatMoney(sm.value)} por vigilante e turno). Um preço tão baixo sugere incumprimento das obrigações laborais.`, `Some posts are priced below the private-security minimum wage cost (${formatMoney(sm.value)} per guard and shift), suggesting labour non-compliance.`) });
    }
    if (c.postos.some((p: Posto) => p.armado === 'sim')) w.push({ level: 'info', field: 'postos', message: l('Vigilantes armados exigem armas registadas em nome da empresa e licença de uso e porte de arma de cada vigilante.', 'Armed guards need firearms registered to the company and a carry licence for each guard.') });
    return w;
  },

  personName: (v) => partyName(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const P = papel(v, 'prestador', 'Prestador', 'Prestadora', true);
    const C = papel(v, 'cliente', 'Cliente', 'Cliente');
    const ps: Posto[] = c.postos;
    const extras = [
      v.rondas ? 'rondas periódicas de supervisão' : '',
      v.reaccao ? `intervenção de uma equipa de reacção rápida, que chega ao local no prazo máximo de ${prazo(v.reaccaoMin, 'minuto')} após o alerta` : '',
      v.cctv ? `monitorização dos sistemas de vídeo e de alarme ${C.de}` : '',
    ].filter(Boolean);

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        `Pelo presente contrato, ${P.o}, empresa de segurança privada ${str(v.alvara) ? titularDe(v.alvara) : `titular do alvará n.º ${BLANK}`}, presta ${C.ao} serviços de vigilância e protecção das instalações situadas em ${semPonto(v.instalacoes) || BLANK}, nos postos e horários indicados no quadro do Anexo.`,
        extras.length ? `O serviço inclui ainda: ${extras.join('; ')}.` : '',
      ]),
      en: 'The licensed security company guards the premises at the posts and hours in the Annex, with patrols, response team and monitoring as stated.',
    });
    cl.push({
      id: 'vigilantes',
      heading: 'Vigilantes',
      text: numerar([
        `${P.O} afecta ao serviço vigilantes seus trabalhadores, maiores, com formação, registados nos termos da lei, sem antecedentes criminais, fardados e identificados, equipados com ${semPonto(v.equipamento) || BLANK}.`,
        `${P.O} assegura a substituição imediata dos vigilantes ausentes e substitui, a pedido fundamentado ${C.de}, o vigilante cujo comportamento seja inadequado.`,
        `Os vigilantes são trabalhadores ${P.de}, que é o único responsável pelo pagamento dos seus salários, da segurança social e dos demais encargos laborais, e lhes dá as ordens e instruções de serviço.`,
      ]),
      en: 'Guards are the company’s trained, registered, vetted, uniformed and equipped employees; absences are covered at once and unsuitable guards replaced on request; the company alone pays wages and social security and gives orders.',
    });
    cl.push({
      id: 'actuacao',
      heading: 'Limites da actuação',
      text: numerar([
        'Os vigilantes controlam as entradas e as saídas, registam visitantes e viaturas, previnem furtos e intrusões e alertam as autoridades em caso de crime ou emergência.',
        'Os vigilantes não podem deter pessoas, salvo em flagrante delito e apenas pelo tempo necessário para as entregar à polícia, nem revistar pessoas ou viaturas sem o seu consentimento, nem usar força para além do estritamente necessário à legítima defesa.',
        'As instruções específicas de cada posto constam de uma ordem de serviço escrita, aprovada pelas duas partes.',
      ]),
      en: 'Guards control access, register visitors and vehicles, prevent theft and call the authorities. No arrests except in flagrante delicto until handover to police, no searches without consent, no force beyond self-defence. Post orders in writing.',
    });
    cl.push({
      id: 'ocorrencias',
      heading: 'Livro de ocorrências e relatórios',
      text: `Em cada posto existe um livro de ocorrências, onde se registam as entradas e saídas de turno e todos os incidentes. ${P.O} comunica de imediato ${C.ao} qualquer ocorrência grave e apresenta-lhe um relatório mensal do serviço.`,
      en: 'An occurrence book at each post records shift changes and incidents; serious incidents are reported at once and a monthly report given.',
    });
    cl.push({
      id: 'obrigacoesCliente',
      heading: `Obrigações ${C.de}`,
      text: `${C.O} assegura iluminação adequada, um abrigo para o posto com acesso a água e instalação sanitária, comunica ${P.ao} as alterações relevantes nas instalações e dirige as suas instruções aos supervisores ${P.de}, e não directamente aos vigilantes.`,
      en: 'The client provides lighting, a guard shelter with water and toilet, reports relevant changes and gives instructions through the company’s supervisors.',
    });
    cl.push({
      id: 'responsabilidade',
      heading: 'Responsabilidade e seguro',
      text: numerar([
        `${P.O} responde pelos danos causados ${C.ao} ou a terceiros por acção ou omissão culposa dos seus vigilantes, incluindo os furtos que resultem de falta de vigilância, desde que participados à polícia e comunicados ${P.ao} no prazo de vinte e quatro horas após a sua descoberta.`,
        money(v.seguroValor) != null ? `${P.O} mantém em vigor um seguro de responsabilidade civil com o capital mínimo de ${valorTexto(money(v.seguroValor))} e entrega cópia da apólice ${C.ao}.` : `${P.O} mantém em vigor um seguro de responsabilidade civil adequado e entrega cópia da apólice ${C.ao}.`,
        money(v.limiteIndemnizacao) != null ? `Salvo dolo ou culpa grave, a indemnização por cada ocorrência não excede ${valorTexto(money(v.limiteIndemnizacao))}.` : '',
        `${P.O} não responde pelos bens que não estejam à guarda do posto, nem pelos danos que resultem de assalto à mão armada ou de força maior, quando os vigilantes tenham actuado com a diligência devida.`,
      ]),
      en: 'The company is liable for loss caused by its guards’ fault, including theft from lack of vigilance if reported to police and notified within 24 hours; keeps liability insurance; cap as stated; no liability for armed robbery or force majeure when guards acted diligently.',
    });
    cl.push({
      id: 'preco',
      heading: 'Preço e pagamento',
      text: numerar([
        `${C.O} paga ${P.ao} o preço mensal de ${valorTexto(c.total)}${ivaTexto(v.iva)}, correspondente aos postos do Anexo, até ao dia ${Number(v.pagamentoDia) > 0 ? Number(v.pagamentoDia) : BLANK} do mês a que respeita, contra factura, ${modoPagamento(v, P)}.`,
        'Os postos adicionais ou temporários são pedidos por escrito e pagos ao preço acordado; as faltas de vigilantes não substituídas são descontadas proporcionalmente no preço.',
        `O preço pode ser revisto por acordo quando for alterado o salário mínimo do sector.`,
      ]),
      en: `Monthly price ${c.total != null ? formatMoney(c.total) : '—'} for the posts in the Annex, due by the stated day against invoice; extra posts by written request; uncovered absences deducted; price review when the sector minimum wage changes.`,
    });
    cl.push({
      id: 'duracao',
      heading: 'Duração',
      text: `O contrato produz efeitos a partir de ${dateLong(v.dataInicio)}, pelo prazo de ${prazo(v.duracaoMeses, 'mês')}, renovando-se automaticamente por períodos iguais se nenhuma das partes o denunciar por escrito com a antecedência mínima de ${prazo(v.avisoDias)}.`,
      en: 'Term as stated, renewing automatically unless notice is given.',
    });
    cl.push(clConfidencialidade(P, C));
    cl.push(clCessacao({ curaDias: 8, extra: [`O contrato caduca se ${P.o} perder o alvará de segurança privada, devendo comunicá-lo de imediato ${C.ao}.`] }));
    cl.push(clForcaMaior());

    const annex: Block[] = [
      { type: 'spacer', size: 'medium' },
      { type: 'heading', text: 'Anexo — Postos de vigilância', align: 'center' },
      ps.length
        ? {
            type: 'table',
            columns: [
              { label: 'Posto', width: 2 },
              { label: 'Horário', width: 2.2 },
              { label: 'Vigilantes', width: 0.9, align: 'right' },
              { label: 'Armado', width: 0.8 },
              { label: 'Preço mensal (MT)', width: 1.4, align: 'right' },
            ],
            rows: ps.map((p) => [p.local, p.horario || BLANK, p.vigilantes != null ? String(p.vigilantes) : BLANK, p.armado === 'sim' ? 'Sim' : 'Não', p.preco != null ? formatMoney(p.preco, false) : BLANK]),
            totals: [['Total mensal', '', '', '', c.total != null ? formatMoney(c.total, false) : BLANK]],
          }
        : { type: 'box', label: 'Posto, horário, vigilantes, armado e preço', lines: 5 },
    ];

    return contratoBlocks(ctx, {
      title: 'Contrato de prestação de serviços de segurança privada',
      parties: [
        { p: 'cliente', role: C, en: 'Client' },
        { p: 'prestador', role: P, en: 'Security company' },
      ],
      clauses: cl,
      signatures: [assinatura(ctx, 'cliente', C), assinatura(ctx, 'prestador', P, true)],
      annex,
    });
  },
});
