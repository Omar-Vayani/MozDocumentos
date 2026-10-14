// Contrato de serviços de marketing digital e gestão de redes sociais: monthly
// services (content, posting, paid campaigns, reports), approval of content,
// ownership of the accounts and content, and the rule that advertising must be
// identifiable as such.

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import {
  clAutonomia, clCessacao, clConfidencialidade, clDadosPessoais, clForcaMaior, contratoBlocks, formaPagamentoFields, ivaField, ivaTexto,
  modoPagamento, prazo,
} from './_digital';

const SV: { name: string; pt: string; en: string; texto: string }[] = [
  { name: 'svGestao', pt: 'Gestão das páginas e redes sociais', en: 'Social media management', texto: 'gestão das páginas e perfis do Cliente nas redes sociais, incluindo a publicação e a resposta a comentários e mensagens dentro do horário acordado' },
  { name: 'svConteudos', pt: 'Criação de conteúdos (texto, imagem, vídeo)', en: 'Content creation', texto: 'criação de conteúdos (textos, imagens, vídeos curtos e animações)' },
  { name: 'svAnuncios', pt: 'Campanhas de publicidade paga', en: 'Paid advertising campaigns', texto: 'planeamento, configuração e acompanhamento de campanhas de publicidade paga nas plataformas digitais' },
  { name: 'svSeo', pt: 'Optimização para motores de busca (SEO)', en: 'Search engine optimisation', texto: 'optimização do sítio na Internet para motores de busca' },
  { name: 'svEmail', pt: 'Campanhas de e-mail e mensagens', en: 'E-mail and messaging campaigns', texto: 'campanhas de correio electrónico e de mensagens a clientes que tenham dado o seu consentimento' },
  { name: 'svRelatorios', pt: 'Relatório mensal de resultados', en: 'Monthly results report', texto: 'relatório mensal com os resultados e as recomendações' },
];

export default defineTemplate({
  id: 'contrato-marketing-digital',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'agencia', title: l('Agência ou gestor de redes', 'Agency or social media manager'), personRole: 'outro' },
    { id: 'cliente', title: l('Cliente', 'Client'), personRole: 'cliente' },
    { id: 'servicos', title: l('Serviços', 'Services') },
    { id: 'preco', title: l('Preço e duração', 'Price and term') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('agencia', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('cliente', { tipoDefault: 'empresa' }),

    { name: 'plataformas', type: 'text', section: 'servicos', required: true, label: l('Plataformas', 'Platforms'), default: 'Facebook, Instagram e LinkedIn', placeholder: l('Ex.: Facebook, Instagram, TikTok, LinkedIn, WhatsApp Business', 'E.g. Facebook, Instagram, TikTok') },
    ...SV.map((s, i) => ({ name: s.name, type: 'toggle' as const, section: 'servicos', default: i < 3 || s.name === 'svRelatorios', label: l(s.pt, s.en) })),
    { name: 'publicacoesMes', type: 'number', section: 'servicos', width: 'half', min: 0, max: 500, default: 12, label: l('Publicações por mês', 'Posts per month'), showIf: (v) => Boolean(v.svConteudos || v.svGestao) },
    { name: 'videosMes', type: 'number', section: 'servicos', width: 'half', min: 0, max: 100, default: 2, label: l('Vídeos por mês', 'Videos per month'), showIf: (v) => Boolean(v.svConteudos) },
    { name: 'horarioResposta', type: 'text', section: 'servicos', label: l('Horário de resposta a mensagens', 'Hours for answering messages'), default: 'dias úteis, das 8h00 às 18h00', showIf: (v) => Boolean(v.svGestao) },
    { name: 'investimento', type: 'money', section: 'servicos', width: 'half', label: l('Orçamento mensal de anúncios (opcional)', 'Monthly ad budget (optional)'), showIf: (v) => Boolean(v.svAnuncios) },
    {
      name: 'investimentoPago',
      type: 'radio',
      section: 'servicos',
      label: l('Quem paga os anúncios às plataformas', 'Who pays the platforms for ads'),
      options: [
        { value: 'cliente', label: l('O cliente, directamente, com o seu cartão', 'The client, directly') },
        { value: 'agencia', label: l('A agência, e factura ao cliente', 'The agency, billed to the client') },
      ],
      default: 'cliente',
      showIf: (v) => Boolean(v.svAnuncios),
    },
    { name: 'aprovacaoDias', type: 'number', section: 'servicos', width: 'half', min: 1, max: 15, default: 2, label: l('Prazo do cliente para aprovar conteúdos (dias úteis)', 'Client approval time (working days)') },
    { name: 'aprovacaoTacita', type: 'toggle', section: 'servicos', default: false, label: l('Sem resposta no prazo, o conteúdo considera-se aprovado', 'No reply in time = approved') },

    { name: 'mensalidade', type: 'money', section: 'preco', width: 'half', required: true, label: l('Mensalidade', 'Monthly fee') },
    ivaField('preco'),
    ...formaPagamentoFields('preco'),
    { name: 'pagamentoDia', type: 'number', section: 'preco', width: 'half', min: 1, max: 31, default: 5, label: l('Pagamento até ao dia', 'Payment by day') },
    { name: 'dataInicio', type: 'date', section: 'preco', width: 'half', label: l('Início', 'Start'), default: (c) => c.today },
    { name: 'duracaoMeses', type: 'number', section: 'preco', width: 'half', min: 1, max: 36, default: 6, label: l('Duração mínima (meses)', 'Minimum term (months)') },
    { name: 'avisoDias', type: 'number', section: 'preco', width: 'half', min: 0, max: 90, default: 30, label: l('Aviso prévio para terminar (dias)', 'Notice to end (days)') },

    { name: 'dadosPessoais', type: 'toggle', section: 'clausulas', default: true, label: l('A agência terá acesso a dados de clientes (mensagens, listas)', 'The agency will access customer data') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'agencia', 'agência', 'agency'), ...partyWarnings(v, 'cliente', 'cliente', 'client')];
    if (money(v.mensalidade) == null) w.push({ level: 'error', field: 'mensalidade', message: l('Indique a mensalidade.', 'Enter the monthly fee.') });
    w.push({ level: 'info', message: l(`Os conteúdos pagos ou patrocinados devem ser identificados como publicidade (${cite('digPublicidadeIdentificavel')}). Para usar fotografias de pessoas, obtenha a autorização de uso de imagem.`, 'Paid or sponsored content must be labelled as advertising. Get image releases for photos of people.') });
    return w;
  },

  personName: (v) => partyName(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const A = papel(v, 'agencia', 'Agência', 'Agência', true);
    // An individual manager is "o Prestador"/"a Prestadora"; a company is "a Agência".
    const Ag = v.agenciaTipo === 'empresa' ? A : papel(v, 'agencia', 'Prestador', 'Prestadora');
    const C = papel(v, 'cliente', 'Cliente', 'Cliente');
    const sv = SV.filter((s) => v[s.name]).map((s) => s.texto.replace('do Cliente', C.de));
    const pub = Number(v.publicacoesMes);
    const vid = Number(v.videosMes);

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: `Pelo presente contrato, ${Ag.o} presta ${C.ao} serviços de marketing digital nas plataformas ${semPonto(v.plataformas) || BLANK}, compreendendo:`,
      items: sv.length ? sv.map((s, i) => `${s}${i === sv.length - 1 ? '.' : ';'}`) : [`${BLANK}.`],
      en: `Digital marketing on ${v.plataformas || '—'}: ${SV.filter((s) => v[s.name]).map((s) => s.en).join('; ') || '—'}.`,
    });
    if (v.svConteudos || v.svGestao) {
      cl.push({
        id: 'volume',
        heading: 'Volume e calendário',
        text: numerar([
          `${Ag.O} publica, em cada mês, ${Number.isFinite(pub) && pub > 0 ? pub : BLANK} conteúdos${v.svConteudos && Number.isFinite(vid) && vid > 0 ? `, dos quais ${vid} em vídeo` : ''}, de acordo com um calendário editorial mensal apresentado ${C.ao} até ao dia vinte e cinco do mês anterior.`,
          v.svGestao ? `As mensagens e os comentários são respondidos em ${semPonto(v.horarioResposta) || BLANK}, segundo as orientações e as respostas-tipo aprovadas ${C.pelo}; as reclamações e as questões sensíveis são encaminhadas ${C.ao}.` : '',
        ]),
        en: 'Monthly volume of posts as stated, per an editorial calendar presented by the 25th of the previous month; messages answered within the agreed hours, sensitive matters passed to the client.',
      });
    }
    cl.push({
      id: 'aprovacao',
      heading: 'Aprovação dos conteúdos',
      text: `Nenhum conteúdo é publicado sem aprovação ${C.de}, que se pronuncia no prazo de ${prazo(v.aprovacaoDias, 'dia útil')}${v.aprovacaoTacita ? '; na falta de resposta nesse prazo, considera-se o conteúdo aprovado' : ''}. ${C.O} é responsável pela exactidão das informações sobre os seus produtos, preços e promoções.`,
      en: `No content is published without the client’s approval within the stated working days${v.aprovacaoTacita ? ' (silence = approval)' : ''}. The client is responsible for the accuracy of product, price and promotion information.`,
    });
    if (v.svAnuncios) {
      const inv = money(v.investimento);
      cl.push({
        id: 'anuncios',
        heading: 'Publicidade paga',
        text: numerar([
          inv != null ? `O orçamento mensal para anúncios é de ${valorTexto(inv)}, que não está incluído na mensalidade.` : 'O orçamento para anúncios é definido mensalmente por escrito e não está incluído na mensalidade.',
          v.investimentoPago === 'agencia'
            ? `${Ag.O} paga os anúncios às plataformas e factura-os ${C.ao} pelo valor efectivamente cobrado, com os respectivos comprovativos.`
            : `Os anúncios são pagos directamente ${C.pelo} às plataformas, através do meio de pagamento associado à sua conta de anúncios.`,
          `${Ag.O} não garante resultados determinados de vendas, alcance ou seguidores, que dependem das plataformas e do mercado, mas obriga-se a gerir as campanhas com diligência e a informar ${C.o} dos resultados obtidos.`,
        ]),
        en: 'Ad budget is separate from the fee and paid as stated. No specific results are guaranteed; campaigns are managed diligently and results reported.',
      });
    }
    cl.push({
      id: 'contas',
      heading: 'Contas e acessos',
      text: numerar([
        `As páginas, os perfis, as contas de anúncios e os seguidores pertencem ${C.ao}, e as contas são registadas em seu nome. ${Ag.O} recebe acessos de administrador apenas para executar o contrato e não pode alterar os titulares nem retirar ${C.ao} os seus acessos.`,
        `No fim do contrato, ${Ag.o} devolve todos os acessos, retira-se das contas e entrega ${C.ao} os ficheiros dos conteúdos produzidos.`,
      ]),
      en: 'Pages, profiles, ad accounts and followers belong to the client and are registered in its name; the agency has admin access only to perform the contract and returns all access at the end.',
    });
    cl.push({
      id: 'direitos',
      heading: 'Direitos sobre os conteúdos',
      text: numerar([
        `Com o pagamento de cada mensalidade, os direitos patrimoniais de autor sobre os conteúdos criados nesse mês especificamente para ${C.o} transmitem-se ${C.ao}, que os pode utilizar livremente, sem limite de tempo ou de lugar.`,
        `As imagens, as músicas e os tipos de letra de terceiros são utilizados ao abrigo das respectivas licenças, que ${Ag.o} indica quando solicitado. ${Ag.O} obtém as autorizações de uso de imagem das pessoas que fotografe ou filme para ${C.o}.`,
        `Os conteúdos pagos ou patrocinados são identificados como publicidade, de acordo com a lei e as regras das plataformas.`,
      ]),
      en: 'On payment, the economic rights in content created for the client pass to the client. Third-party assets are used under their licences; image releases are obtained for people filmed or photographed. Sponsored content is labelled as advertising.',
    });
    cl.push({
      id: 'preco',
      heading: 'Preço e pagamento',
      text: numerar([
        `${C.O} paga ${Ag.ao} a mensalidade de ${valorTexto(money(v.mensalidade))}${ivaTexto(v.iva)}, até ao dia ${str(v.pagamentoDia) || BLANK} de cada mês, ${modoPagamento(v, Ag)}.`,
        'Os trabalhos não incluídos nos serviços acima, como sessões fotográficas, produção de vídeo profissional ou material impresso, são orçamentados e aprovados por escrito antes da execução.',
        `O atraso no pagamento confere ${Ag.ao} o direito a juros de mora à taxa legal e, após aviso escrito, a suspender os serviços.`,
      ]),
      en: `Monthly fee ${money(v.mensalidade) != null ? formatMoney(money(v.mensalidade)) : '—'}${v.iva === 'incluido' ? ' (VAT included)' : v.iva === 'isento' ? '' : ' plus VAT'}, due by the stated day. Extra work quoted separately. Late payment bears interest and may suspend services.`,
    });
    cl.push({
      id: 'duracao',
      heading: 'Duração',
      text: `O contrato produz efeitos a partir de ${dateLong(v.dataInicio)}, por um prazo mínimo de ${prazo(v.duracaoMeses, 'mês')}, e continua depois por tempo indeterminado, podendo qualquer das partes pôr-lhe fim no termo do prazo mínimo ou a todo o tempo após este, por comunicação escrita com a antecedência de ${prazo(v.avisoDias)}.`,
      en: 'Minimum term as stated, then open-ended, ending on written notice.',
    });
    cl.push(clConfidencialidade(Ag, C));
    if (v.dadosPessoais) cl.push(clDadosPessoais(C, Ag));
    cl.push(clAutonomia(Ag));
    cl.push(clCessacao({ curaDias: 10, extra: [`Qualquer das partes pode também resolver o contrato se a outra publicar ou mandar publicar conteúdos ilícitos, ofensivos ou que lesem gravemente a sua reputação.`] }));
    cl.push(clForcaMaior());

    return contratoBlocks(ctx, {
      title: 'Contrato de prestação de serviços de marketing digital',
      subtitle: 'Gestão de redes sociais',
      parties: [
        { p: 'cliente', role: C, en: 'Client' },
        { p: 'agencia', role: Ag, en: 'Agency' },
      ],
      clauses: cl,
      signatures: [assinatura(ctx, 'cliente', C), assinatura(ctx, 'agencia', Ag, true)],
    });
  },
});
