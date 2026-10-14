// Contrato de manutenção e suporte informático com níveis de serviço (SLA):
// a monthly service contract with response and resolution times per priority,
// availability target, service credits and the usual confidentiality and data
// clauses.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import {
  clAutonomia, clCessacao, clConfidencialidade, clDadosPessoais, clForcaMaior, contratoBlocks, formaPagamentoFields, ivaField, ivaTexto,
  linhas, modoPagamento, prazo,
} from './_digital';

const SERVICOS: { name: string; pt: string; en: string; texto: string }[] = [
  { name: 'svHelpdesk', pt: 'Apoio aos utilizadores (helpdesk) por telefone, e-mail ou acesso remoto', en: 'User helpdesk (phone, e-mail, remote)', texto: 'apoio aos utilizadores por telefone, correio electrónico e acesso remoto' },
  { name: 'svLocal', pt: 'Assistência nas instalações do cliente', en: 'On-site support', texto: 'assistência nas instalações do Cliente, quando o problema não possa ser resolvido à distância' },
  { name: 'svPreventiva', pt: 'Manutenção preventiva periódica', en: 'Preventive maintenance', texto: 'manutenção preventiva periódica dos equipamentos e sistemas' },
  { name: 'svBackups', pt: 'Gestão e verificação de cópias de segurança', en: 'Backup management', texto: 'gestão e verificação periódica das cópias de segurança' },
  { name: 'svActualizacoes', pt: 'Actualizações de segurança e antivírus', en: 'Security updates and antivirus', texto: 'instalação das actualizações de segurança e gestão do antivírus' },
  { name: 'svMonitorizacao', pt: 'Monitorização de servidores e rede', en: 'Server and network monitoring', texto: 'monitorização dos servidores, da rede e dos serviços críticos' },
  { name: 'svSoftware', pt: 'Correcção de erros e pequenas alterações a software', en: 'Software bug fixes and small changes', texto: 'correcção de erros e pequenas alterações às aplicações abrangidas' },
];

const NIVEIS = [
  { k: 'critico', nome: 'Crítica', def: 'Paragem total de um sistema essencial ou falha de segurança, sem alternativa de trabalho.', resp: 1, res: 4 },
  { k: 'alto', nome: 'Alta', def: 'Falha grave que afecta vários utilizadores ou uma função importante, com alternativa limitada.', resp: 2, res: 8 },
  { k: 'medio', nome: 'Média', def: 'Falha que afecta um utilizador ou uma função secundária.', resp: 4, res: 24 },
  { k: 'baixo', nome: 'Baixa', def: 'Pedidos de informação, configurações e alterações não urgentes.', resp: 8, res: 72 },
];

export default defineTemplate({
  id: 'contrato-suporte-informatico',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'prestador', title: l('Prestador de serviços informáticos', 'IT service provider'), personRole: 'outro' },
    { id: 'cliente', title: l('Cliente', 'Client'), personRole: 'cliente' },
    { id: 'servicos', title: l('Sistemas e serviços', 'Systems and services') },
    { id: 'sla', title: l('Níveis de serviço (SLA)', 'Service levels (SLA)') },
    { id: 'preco', title: l('Preço e duração', 'Price and term') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('prestador', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('cliente', { tipoDefault: 'empresa' }),

    {
      name: 'sistemas',
      type: 'textarea',
      section: 'servicos',
      rows: 4,
      required: true,
      label: l('Equipamentos e sistemas abrangidos', 'Equipment and systems covered'),
      help: l('Um por linha: computadores, servidores, rede, impressoras, programas. Pode remeter para um inventário anexo.', 'One per line: computers, servers, network, printers, software. You may refer to an attached inventory.'),
      placeholder: l('Ex.: 25 computadores e 4 impressoras da sede\nServidor de ficheiros e rede local\nSistema de facturação Primavera', 'E.g. 25 PCs and 4 printers at head office\nFile server and LAN\nInvoicing software'),
    },
    ...SERVICOS.map((s, i) => ({ name: s.name, type: 'toggle' as const, section: 'servicos', default: i < 5, label: l(s.pt, s.en) })),
    { name: 'preventivaPeriodicidade', type: 'select', section: 'servicos', width: 'half', label: l('Manutenção preventiva', 'Preventive maintenance'), options: [{ value: 'mensal', label: l('Mensal', 'Monthly') }, { value: 'trimestral', label: l('Trimestral', 'Quarterly') }, { value: 'semestral', label: l('Semestral', 'Half-yearly') }], default: 'trimestral', showIf: (v) => Boolean(v.svPreventiva) },
    { name: 'horario', type: 'text', section: 'servicos', label: l('Horário de suporte', 'Support hours'), default: 'dias úteis, das 8h00 às 17h00', help: l('Fora deste horário, o suporte só é prestado nos casos acordados e é facturado à parte.', 'Outside these hours support is given only as agreed and billed separately.') },
    { name: 'canais', type: 'text', section: 'servicos', label: l('Como abrir um pedido', 'How to open a ticket'), placeholder: l('Ex.: suporte@empresa.co.mz, +258 84 000 0000 (também WhatsApp)', 'E.g. support e-mail and phone') },
    { name: 'exclusoes', type: 'textarea', section: 'servicos', rows: 2, label: l('Não incluído (opcional)', 'Not included (optional)'), placeholder: l('Ex.: peças e consumíveis; licenças de software; novos projectos', 'E.g. spare parts and consumables; licences; new projects') },

    ...NIVEIS.flatMap((n) => [
      { name: `sla_${n.k}_resp`, type: 'number' as const, section: 'sla', width: 'half' as const, min: 0, max: 240, default: n.resp, label: l(`Prioridade ${n.nome.toLowerCase()} — resposta (horas úteis)`, `${n.k} priority — response (business hours)`) },
      { name: `sla_${n.k}_res`, type: 'number' as const, section: 'sla', width: 'half' as const, min: 0, max: 720, default: n.res, label: l(`Prioridade ${n.nome.toLowerCase()} — resolução (horas úteis)`, `${n.k} priority — resolution (business hours)`) },
    ]),
    { name: 'disponibilidade', type: 'number', section: 'sla', width: 'half', min: 0, max: 100, default: 99, label: l('Disponibilidade garantida dos sistemas críticos (%)', 'Guaranteed availability of critical systems (%)'), help: l('Deixe vazio se o prestador não garante disponibilidade (por exemplo, se não gere servidores).', 'Leave empty if the provider does not guarantee availability.') },
    { name: 'creditos', type: 'toggle', section: 'sla', default: true, label: l('Desconto na mensalidade quando o SLA não é cumprido', 'Service credits when the SLA is missed') },
    { name: 'creditoPct', type: 'number', section: 'sla', width: 'half', min: 0, max: 100, default: 5, label: l('Desconto por cada incumprimento (% da mensalidade)', 'Credit per breach (% of the monthly fee)'), showIf: (v) => Boolean(v.creditos) },
    { name: 'creditoMax', type: 'number', section: 'sla', width: 'half', min: 0, max: 100, default: 25, label: l('Desconto máximo por mês (%)', 'Maximum credit per month (%)'), showIf: (v) => Boolean(v.creditos) },

    { name: 'mensalidade', type: 'money', section: 'preco', width: 'half', required: true, label: l('Mensalidade', 'Monthly fee') },
    ivaField('preco'),
    { name: 'horasIncluidas', type: 'number', section: 'preco', width: 'half', min: 0, max: 744, label: l('Horas incluídas por mês (opcional)', 'Hours included per month (optional)'), help: l('Vazio = sem limite de horas para os serviços incluídos.', 'Empty = no hour limit for included services.') },
    { name: 'precoHora', type: 'money', section: 'preco', width: 'half', label: l('Preço por hora adicional', 'Price per extra hour') },
    { name: 'deslocacao', type: 'money', section: 'preco', width: 'half', label: l('Deslocação fora da cidade (por visita, opcional)', 'Travel outside the city (per visit, optional)') },
    { name: 'pagamentoDias', type: 'number', section: 'preco', width: 'half', min: 0, max: 90, default: 10, label: l('Pagamento até ao dia do mês', 'Payment by day of the month') },
    ...formaPagamentoFields('preco'),
    { name: 'dataInicio', type: 'date', section: 'preco', width: 'half', label: l('Início', 'Start'), default: (c) => c.today },
    { name: 'duracaoMeses', type: 'number', section: 'preco', width: 'half', min: 1, max: 60, default: 12, label: l('Duração (meses)', 'Term (months)') },
    { name: 'renovacao', type: 'toggle', section: 'preco', default: true, label: l('Renova-se automaticamente por períodos iguais', 'Renews automatically for equal periods') },
    { name: 'avisoDias', type: 'number', section: 'preco', width: 'half', min: 0, max: 180, default: 60, label: l('Aviso prévio para não renovar ou denunciar (dias)', 'Notice to end or not renew (days)') },

    { name: 'dadosPessoais', type: 'toggle', section: 'clausulas', default: true, label: l('O prestador terá acesso a dados pessoais', 'The provider will access personal data') },
    { name: 'limiteResponsabilidade', type: 'toggle', section: 'clausulas', default: true, label: l('Limitar a responsabilidade a doze mensalidades (excepto dolo ou culpa grave)', 'Cap liability at twelve monthly fees (except wilful misconduct or gross negligence)') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'prestador', 'prestador', 'provider'), ...partyWarnings(v, 'cliente', 'cliente', 'client')];
    if (money(v.mensalidade) == null) w.push({ level: 'error', field: 'mensalidade', message: l('Indique a mensalidade.', 'Enter the monthly fee.') });
    if (!linhas(v.sistemas).length) w.push({ level: 'warning', field: 'sistemas', message: l('Indique os equipamentos e sistemas abrangidos; o que não estiver listado não está coberto.', 'List the equipment and systems covered; anything not listed is not covered.') });
    return w;
  },

  personName: (v) => partyName(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = papel(v, 'prestador', 'Prestador', 'Prestadora', true);
    const C = papel(v, 'cliente', 'Cliente', 'Cliente');
    const servicos = SERVICOS.filter((s) => v[s.name]).map((s) => (s.name === 'svPreventiva' ? `${s.texto}, com periodicidade ${str(v.preventivaPeriodicidade) || 'trimestral'}` : s.texto));
    const exclusoes = linhas(v.exclusoes);
    const disp = Number(v.disponibilidade);
    const temDisp = v.disponibilidade !== '' && v.disponibilidade != null && Number.isFinite(disp) && disp > 0;
    const pctTxt = (x: unknown) => `${String(x ?? BLANK).replace('.', ',')}%`;
    const horas = Number(v.horasIncluidas);

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: `Pelo presente contrato, ${P.o} presta ${C.ao} serviços de manutenção e suporte informático aos equipamentos e sistemas indicados no Anexo I, nos termos e com os níveis de serviço definidos nas cláusulas seguintes.`,
      en: 'The provider supplies IT maintenance and support for the systems in Annex I at the service levels below.',
    });
    cl.push({
      id: 'servicos',
      heading: 'Serviços incluídos',
      text: 'Os serviços compreendem:',
      items: servicos.length ? servicos.map((s, i) => `${s}${i === servicos.length - 1 ? '.' : ';'}`) : [`${BLANK}.`],
      en: `Included services: ${SERVICOS.filter((s) => v[s.name]).map((s) => s.en).join('; ') || '—'}.`,
    });
    cl.push({
      id: 'exclusoes',
      heading: 'Serviços não incluídos',
      text: numerar([
        `Não estão incluídos na mensalidade${exclusoes.length ? ` ${exclusoes.map(semPonto).join('; ')}, nem` : ''} a reparação de danos causados por uso indevido, acidente, sobretensão, intervenção de terceiros não autorizados ou falta de cumprimento das recomendações ${P.de}, nem a instalação de novos sistemas, que são orçamentados à parte.`,
        'As peças, os consumíveis e as licenças de software necessários são pagos pelo Cliente, mediante orçamento aprovado.',
      ]),
      en: 'Excluded from the fee: the items listed, damage from misuse, accidents, power surges or unauthorised third parties, and new installations (quoted separately). Parts, consumables and licences are paid by the client on an approved quote.',
    });
    cl.push({
      id: 'pedidos',
      heading: 'Pedidos de suporte e horário',
      text: numerar([
        `O suporte é prestado em ${semPonto(v.horario) || BLANK}. Os pedidos são feitos${str(v.canais) ? ` através de ${semPonto(v.canais)}` : ' pelos canais indicados pelo Prestador'}, e cada pedido recebe um número de registo.`,
        `A prioridade de cada pedido é atribuída de acordo com o quadro de níveis de serviço, podendo ${C.o} indicar a prioridade que considera adequada.`,
        'Os tempos de resposta e de resolução contam-se em horas do horário de suporte, a partir do registo do pedido.',
      ]),
      en: 'Support hours and channels as stated; each request gets a ticket number. Times are counted in support hours from logging.',
    });
    const quadro = NIVEIS.map((n) => [n.nome, n.def, prazo(v[`sla_${n.k}_resp`], 'hora'), prazo(v[`sla_${n.k}_res`], 'hora')]);
    cl.push({
      id: 'sla',
      heading: 'Níveis de serviço',
      text: numerar([
        `${P.O} obriga-se a responder e a resolver os pedidos dentro dos tempos máximos indicados no quadro do Anexo II. Entende-se por resposta o início do tratamento do pedido por um técnico, e por resolução a reposição do funcionamento, ainda que por solução provisória.`,
        temDisp ? `${P.O} garante uma disponibilidade mensal dos sistemas críticos sob a sua gestão de, pelo menos, ${pctTxt(v.disponibilidade)}, não contando as paragens programadas e comunicadas com antecedência, nem as falhas de energia, de comunicações ou de fornecedores externos.` : '',
        'Os tempos não correm enquanto o Cliente não facultar o acesso, a informação ou a autorização de que a resolução dependa.',
        `${P.O} apresenta ${C.ao}, até ao dia dez de cada mês, um relatório dos pedidos do mês anterior, com o cumprimento dos níveis de serviço.`,
      ]),
      en: 'Response and resolution within the maximum times in Annex II (response = a technician starts work; resolution = service restored, even by a workaround). Availability target as stated, excluding planned and external outages. Clocks stop while the client delays access. Monthly SLA report by the 10th.',
    });
    if (v.creditos) {
      cl.push({
        id: 'creditos',
        heading: 'Incumprimento dos níveis de serviço',
        text: `Por cada pedido de prioridade crítica ou alta resolvido fora do tempo máximo, e por cada mês em que a disponibilidade fique abaixo da garantida, ${C.o} tem direito a um desconto de ${pctTxt(v.creditoPct)} na mensalidade seguinte, até ao máximo de ${pctTxt(v.creditoMax)} por mês, sem prejuízo do direito de resolver o contrato em caso de incumprimento reiterado.`,
        en: 'For each critical or high-priority ticket resolved late, and each month below the availability target, the client gets the stated credit on the next fee, up to the monthly cap, without prejudice to termination for repeated breach.',
      });
    }
    cl.push({
      id: 'obrigacoesCliente',
      heading: `Obrigações ${C.de}`,
      text: `${C.O} obriga-se a designar um interlocutor, a facultar o acesso aos equipamentos e sistemas, a utilizar apenas software licenciado, a não permitir intervenções de terceiros sem conhecimento ${P.de} e a pagar pontualmente a mensalidade.`,
      en: 'The client appoints a contact person, gives access, uses only licensed software, does not let third parties intervene without telling the provider, and pays on time.',
    });
    cl.push({
      id: 'preco',
      heading: 'Preço e pagamento',
      text: numerar([
        `Pelos serviços incluídos, ${C.o} paga ${P.ao} a mensalidade de ${valorTexto(money(v.mensalidade))}${ivaTexto(v.iva)}, até ao dia ${str(v.pagamentoDias) || BLANK} do mês a que respeita, contra factura, ${modoPagamento(v, P)}.`,
        Number.isFinite(horas) && horas > 0
          ? `A mensalidade inclui até ${prazo(horas, 'hora')} de serviço por mês; as horas adicionais são pagas a ${valorTexto(money(v.precoHora))} por hora.`
          : money(v.precoHora) != null
            ? `Os serviços não incluídos são pagos a ${valorTexto(money(v.precoHora))} por hora, mediante orçamento aprovado.`
            : '',
        money(v.deslocacao) != null ? `As deslocações fora da cidade onde ${P.o} tem sede são pagas a ${valorTexto(money(v.deslocacao))} por visita.` : '',
        `O preço pode ser actualizado uma vez por ano, por acordo escrito, com efeitos a partir da renovação.`,
        `O atraso no pagamento confere ${P.ao} o direito a juros de mora à taxa legal e, após interpelação escrita não atendida, o direito de suspender os serviços até à regularização.`,
      ]),
      en: `Monthly fee ${money(v.mensalidade) != null ? formatMoney(money(v.mensalidade)) : '—'}${v.iva === 'incluido' ? ' (VAT included)' : v.iva === 'isento' ? '' : ' plus VAT'}, payable by the stated day. Extra hours and travel as stated. Annual price review by agreement. Late payment bears interest and may lead to suspension.`,
    });
    cl.push({
      id: 'duracao',
      heading: 'Duração',
      text: `O contrato produz efeitos a partir de ${dateLong(v.dataInicio)} e vigora pelo prazo de ${prazo(v.duracaoMeses, 'mês')}${v.renovacao ? `, renovando-se automaticamente por períodos iguais se nenhuma das partes o denunciar por escrito com a antecedência mínima de ${prazo(v.avisoDias)} em relação ao termo do prazo ou da renovação` : ''}.`,
      en: `Starts on ${v.dataInicio || '—'} for ${v.duracaoMeses || '—'} months${v.renovacao ? ', renewing automatically unless either party gives written notice' : ''}.`,
    });
    cl.push(clConfidencialidade(P, C));
    if (v.dadosPessoais) cl.push(clDadosPessoais(C, P));
    if (v.limiteResponsabilidade) {
      cl.push({
        id: 'responsabilidade',
        heading: 'Limitação de responsabilidade',
        text: `Salvo dolo ou culpa grave, a responsabilidade ${P.de} por danos emergentes do contrato não excede o valor de doze mensalidades, e ${P.o} não responde por lucros cessantes nem pela perda de dados que não estivessem incluídos nas cópias de segurança a seu cargo.`,
        en: 'Except for wilful misconduct or gross negligence, the provider’s liability is capped at twelve monthly fees, excluding lost profits and loss of data outside the backups it manages.',
      });
    }
    cl.push(clAutonomia(P));
    cl.push(
      clCessacao({
        curaDias: 15,
        extra: [`No fim do contrato, ${P.o} entrega ${C.ao} as palavras-passe, as configurações e a documentação dos sistemas, e colabora na transição para o novo prestador durante, pelo menos, o mês seguinte, mediante pagamento das horas utilizadas.`],
      }),
    );
    cl.push(clForcaMaior());

    const annex: Block[] = [
      { type: 'pageBreakHint' },
      { type: 'title', text: 'Anexo I — Equipamentos e sistemas abrangidos' },
      linhas(v.sistemas).length ? { type: 'list', style: 'numeric', items: linhas(v.sistemas).map((s) => semPonto(s) + '.') } : { type: 'box', label: 'Equipamentos e sistemas', lines: 8 },
      { type: 'spacer', size: 'medium' },
      { type: 'heading', text: 'Anexo II — Níveis de serviço', align: 'center' },
      {
        type: 'table',
        columns: [
          { label: 'Prioridade', width: 1 },
          { label: 'Definição', width: 3.4 },
          { label: 'Resposta', width: 1.2 },
          { label: 'Resolução', width: 1.2 },
        ],
        rows: quadro,
        note: `Tempos máximos em horas do horário de suporte (${semPonto(v.horario) || BLANK}).${temDisp ? ` Disponibilidade mensal garantida dos sistemas críticos: ${pctTxt(v.disponibilidade)}.` : ''}`,
      },
    ];

    return contratoBlocks(ctx, {
      title: 'Contrato de manutenção e suporte informático',
      subtitle: 'com níveis de serviço (SLA)',
      parties: [
        { p: 'cliente', role: C, en: 'Client' },
        { p: 'prestador', role: P, en: 'Provider' },
      ],
      clauses: cl,
      signatures: [assinatura(ctx, 'cliente', C), assinatura(ctx, 'prestador', P, true)],
      annex,
    });
  },
});

