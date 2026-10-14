// Contrato de alojamento de website, registo de domínio e correio electrónico
// (hosting): the provider keeps the site online and the client owns the
// domain and the content, with clear rules for unlawful content, backups,
// suspension for non-payment and migration at the end.

import { defineTemplate, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import { clCessacao, clConfidencialidade, clDadosPessoais, clForcaMaior, contratoBlocks, formaPagamentoFields, ivaField, ivaTexto, modoPagamento, prazo } from './_digital';

const SV: { name: string; pt: string; en: string }[] = [
  { name: 'svAlojamento', pt: 'Alojamento do website', en: 'Website hosting' },
  { name: 'svDominio', pt: 'Registo e renovação do domínio', en: 'Domain registration and renewal' },
  { name: 'svEmail', pt: 'Contas de correio electrónico', en: 'E-mail accounts' },
  { name: 'svSsl', pt: 'Certificado de segurança (SSL)', en: 'SSL certificate' },
  { name: 'svBackups', pt: 'Cópias de segurança', en: 'Backups' },
];

const has = (n: string) => (v: Values) => Boolean(v[n]);

export default defineTemplate({
  id: 'contrato-alojamento-web',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'prestador', title: l('Prestador (alojamento)', 'Hosting provider'), personRole: 'outro' },
    { id: 'cliente', title: l('Cliente', 'Client'), personRole: 'cliente' },
    { id: 'servico', title: l('Serviços', 'Services') },
    { id: 'preco', title: l('Preço e duração', 'Price and term') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('prestador', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('cliente', { tipoDefault: 'empresa' }),

    { name: 'dominio', type: 'text', section: 'servico', width: 'half', required: true, label: l('Domínio', 'Domain'), placeholder: l('Ex.: minhaempresa.co.mz', 'E.g. mycompany.co.mz') },
    { name: 'plano', type: 'text', section: 'servico', width: 'half', label: l('Plano (opcional)', 'Plan (optional)'), placeholder: l('Ex.: Empresarial, 20 GB', 'E.g. Business, 20 GB') },
    ...SV.map((s) => ({ name: s.name, type: 'toggle' as const, section: 'servico', default: true, label: l(s.pt, s.en) })),
    { name: 'emailContas', type: 'number', section: 'servico', width: 'half', min: 1, max: 10000, default: 10, label: l('Número de contas de e-mail', 'Number of e-mail accounts'), showIf: has('svEmail') },
    { name: 'espaco', type: 'text', section: 'servico', width: 'half', label: l('Espaço e tráfego', 'Storage and traffic'), placeholder: l('Ex.: 20 GB de espaço, tráfego ilimitado', 'E.g. 20 GB storage, unlimited traffic') },
    {
      name: 'backupFrequencia',
      type: 'select',
      section: 'servico',
      width: 'half',
      label: l('Frequência das cópias', 'Backup frequency'),
      options: [
        { value: 'diárias', label: l('Diárias', 'Daily') },
        { value: 'semanais', label: l('Semanais', 'Weekly') },
        { value: 'mensais', label: l('Mensais', 'Monthly') },
      ],
      default: 'diárias',
      showIf: has('svBackups'),
    },
    { name: 'disponibilidade', type: 'number', section: 'servico', width: 'half', min: 0, max: 100, default: 99, label: l('Disponibilidade garantida (%)', 'Guaranteed availability (%)') },

    { name: 'preco', type: 'money', section: 'preco', width: 'half', required: true, label: l('Preço', 'Price') },
    { name: 'periodicidade', type: 'select', section: 'preco', width: 'half', label: l('Periodicidade', 'Billing'), options: [{ value: 'mês', label: l('Mensal', 'Monthly') }, { value: 'ano', label: l('Anual', 'Yearly') }], default: 'ano' },
    ivaField('preco'),
    ...formaPagamentoFields('preco'),
    { name: 'dataInicio', type: 'date', section: 'preco', width: 'half', label: l('Início', 'Start'), default: (c) => c.today },
    { name: 'avisoDias', type: 'number', section: 'preco', width: 'half', min: 0, max: 180, default: 30, label: l('Aviso para não renovar (dias)', 'Notice not to renew (days)') },
    { name: 'suspensaoDias', type: 'number', section: 'preco', width: 'half', min: 1, max: 90, default: 15, label: l('Dias de atraso antes da suspensão', 'Days late before suspension') },

    { name: 'dadosPessoais', type: 'toggle', section: 'clausulas', default: true, label: l('Incluir cláusula de dados pessoais', 'Include a personal data clause') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'prestador', 'prestador', 'provider'), ...partyWarnings(v, 'cliente', 'cliente', 'client')];
    if (money(v.preco) == null) w.push({ level: 'error', field: 'preco', message: l('Indique o preço.', 'Enter the price.') });
    if (v.svDominio) w.push({ level: 'info', field: 'dominio', message: l('Registe o domínio em nome do cliente: quem consta como titular é o dono do domínio.', 'Register the domain in the client’s name: the registrant owns the domain.') });
    w.push({ level: 'info', message: l(`O responsável pela página também responde pelos conteúdos ilícitos que nela publique (${cite('digResponsabilidadeOnline')}).`, 'Whoever runs a page is also liable for unlawful content on it.') });
    return w;
  },

  personName: (v) => partyName(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = papel(v, 'prestador', 'Prestador', 'Prestadora', true);
    const C = papel(v, 'cliente', 'Cliente', 'Cliente');
    const dominio = str(v.dominio) || BLANK;
    const disp = Number(v.disponibilidade);
    const servicos = [
      v.svAlojamento ? `alojamento do sítio na Internet associado ao domínio **${dominio}**${str(v.espaco) ? `, com ${semPonto(v.espaco)}` : ''}` : '',
      v.svDominio ? `registo e renovação do domínio **${dominio}** junto da entidade gestora competente` : '',
      v.svEmail ? `${Number(v.emailContas) > 0 ? Number(v.emailContas) : BLANK} ${Number(v.emailContas) === 1 ? 'conta' : 'contas'} de correio electrónico no domínio` : '',
      v.svSsl ? 'certificado de segurança (SSL) para ligações cifradas' : '',
      v.svBackups ? `cópias de segurança ${str(v.backupFrequencia) || 'diárias'} dos ficheiros e das bases de dados` : '',
    ].filter(Boolean);

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: `Pelo presente contrato, ${P.o} presta ${C.ao}${str(v.plano) ? `, no plano "${semPonto(v.plano)}",` : ''} os seguintes serviços:`,
      items: servicos.length ? servicos.map((s, i) => `${s}${i === servicos.length - 1 ? '.' : ';'}`) : [`${BLANK}.`],
      en: `Hosting services for ${v.dominio || '—'}: ${SV.filter((s) => v[s.name]).map((s) => s.en).join('; ') || '—'}.`,
    });
    if (v.svDominio) {
      cl.push({
        id: 'dominio',
        heading: 'Titularidade do domínio',
        text: `O domínio é registado em nome ${C.de}, que é o seu titular. ${P.O} actua apenas como intermediário no registo e entrega ${C.ao}, a pedido e sem custos adicionais, os códigos e as autorizações necessários para transferir o domínio para outro prestador.`,
        en: 'The domain is registered in the client’s name; the provider only acts as intermediary and hands over transfer codes on request at no extra cost.',
      });
    }
    cl.push({
      id: 'disponibilidade',
      heading: 'Disponibilidade e manutenção',
      text: numerar([
        Number.isFinite(disp) && disp > 0
          ? `${P.O} garante a disponibilidade dos serviços em, pelo menos, ${String(disp).replace('.', ',')}% do tempo de cada mês, excluindo as manutenções programadas avisadas com antecedência e as falhas alheias ao seu controlo.`
          : `${P.O} procura manter os serviços disponíveis de forma contínua, salvo manutenções programadas avisadas com antecedência.`,
        `${P.O} mantém os servidores actualizados e protegidos e informa ${C.o} de imediato de qualquer incidente de segurança que afecte o seu sítio ou os seus dados.`,
      ]),
      en: 'Availability as stated, excluding planned maintenance and external failures; servers kept updated and secure; security incidents reported at once.',
    });
    cl.push({
      id: 'conteudos',
      heading: 'Conteúdos',
      text: numerar([
        `${C.O} é o único responsável pelos conteúdos que publica, que lhe pertencem, e garante que não violam a lei nem direitos de terceiros, designadamente direitos de autor, direito à imagem e dados pessoais.`,
        `É proibido utilizar os serviços para conteúdos ilícitos, envio de correio electrónico não solicitado em massa, distribuição de programas maliciosos ou actividades que prejudiquem os servidores ou outros clientes.`,
        `${P.O} pode retirar ou bloquear um conteúdo manifestamente ilícito de que tome conhecimento ou que lhe seja ordenado por autoridade, avisando ${C.o} de imediato.`,
      ]),
      en: 'The client owns and is solely responsible for its content. No unlawful content, spam or malware. The provider may remove manifestly unlawful content or on an authority’s order, notifying the client.',
    });
    cl.push({
      id: 'preco',
      heading: 'Preço e pagamento',
      text: numerar([
        `${C.O} paga ${P.ao} ${valorTexto(money(v.preco))} por ${str(v.periodicidade) || 'ano'}${ivaTexto(v.iva)}, adiantadamente, no início de cada período, ${modoPagamento(v, P)}.`,
        `As taxas de registo e renovação do domínio cobradas pela entidade gestora ${v.svDominio ? 'estão incluídas no preço, salvo alteração dessas taxas' : 'não estão incluídas'}.`,
        `Em caso de atraso superior a ${prazo(v.suspensaoDias)}, após aviso escrito, ${P.o} pode suspender os serviços até ao pagamento, conservando os dados ${C.de} durante pelo menos trinta dias após a suspensão.`,
      ]),
      en: `Price ${money(v.preco) != null ? formatMoney(money(v.preco)) : '—'} per ${v.periodicidade === 'mês' ? 'month' : 'year'}, in advance. Services may be suspended after the stated delay and written notice; data kept at least thirty days.`,
    });
    cl.push({
      id: 'duracao',
      heading: 'Duração e renovação',
      text: `O contrato produz efeitos a partir de ${dateLong(v.dataInicio)}, pelo período de um ${str(v.periodicidade) || 'ano'}, renovando-se automaticamente por períodos iguais se nenhuma das partes o denunciar por escrito com a antecedência mínima de ${prazo(v.avisoDias)}.`,
      en: 'Runs from the start date for one billing period, renewing automatically unless either party gives the stated notice.',
    });
    cl.push({
      id: 'migracao',
      heading: 'Fim do contrato e migração',
      text: `Cessando o contrato por qualquer motivo, ${P.o} disponibiliza ${C.ao}, durante trinta dias, uma cópia completa dos ficheiros, das bases de dados e das mensagens de correio electrónico, e apaga-os depois desse prazo.`,
      en: 'At the end, the provider makes a full copy of files, databases and e-mail available for thirty days, then deletes them.',
    });
    cl.push(clConfidencialidade(P, C));
    if (v.dadosPessoais) cl.push(clDadosPessoais(C, P));
    cl.push({
      id: 'responsabilidade',
      heading: 'Limitação de responsabilidade',
      text: `Salvo dolo ou culpa grave, a responsabilidade ${P.de} não excede o valor pago ${C.pelo} nos doze meses anteriores ao facto, e não abrange lucros cessantes.`,
      en: 'Except for wilful misconduct or gross negligence, liability is capped at twelve months’ fees, excluding lost profits.',
    });
    cl.push(clCessacao({ curaDias: v.suspensaoDias }));
    cl.push(clForcaMaior());

    return contratoBlocks(ctx, {
      title: 'Contrato de alojamento web',
      subtitle: [v.svDominio ? 'domínio' : '', v.svEmail ? 'correio electrónico' : ''].filter(Boolean).length ? `Alojamento${v.svDominio ? ', domínio' : ''}${v.svEmail ? ' e correio electrónico' : ''} — ${dominio}` : dominio,
      parties: [
        { p: 'cliente', role: C, en: 'Client' },
        { p: 'prestador', role: P, en: 'Provider' },
      ],
      clauses: cl,
      signatures: [assinatura(ctx, 'cliente', C), assinatura(ctx, 'prestador', P, true)],
    });
  },
});
