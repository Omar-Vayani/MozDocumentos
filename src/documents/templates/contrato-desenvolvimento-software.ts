// Contrato de desenvolvimento de software, website, aplicação móvel ou loja
// online: a service contract (Civil Code prestação de serviços / RJCC) with a
// specification annex, milestones, acceptance tests, warranty and an express
// clause on who owns the copyright in the code (commissioned work: without
// agreement, the rights stay with the author).

import { formatDateShort, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, lines, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import {
  clAutonomia, clCessacao, clConfidencialidade, clDadosPessoais, clForcaMaior, contratoBlocks, formaPagamentoFields, ivaField, ivaTexto,
  linhas, modoPagamento, prazo,
} from './_digital';

const TIPOS: Record<string, { o: string; nome: string }> = {
  software: { o: 'um sistema informático (software) desenvolvido à medida', nome: 'software' },
  website: { o: 'um sítio na Internet (website)', nome: 'website' },
  app: { o: 'uma aplicação para dispositivos móveis (app)', nome: 'aplicação' },
  loja: { o: 'uma loja online (plataforma de comércio electrónico)', nome: 'loja online' },
};

type Fase = { fase: string; entrega: string; valor: number | null };

function fases(v: Values): Fase[] {
  return lines(v.fases)
    .map((r) => ({ fase: str(r.fase), entrega: str(r.entrega), valor: money(r.valor) }))
    .filter((r) => r.fase || r.entrega || r.valor != null);
}

export default defineTemplate({
  id: 'contrato-desenvolvimento-software',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'prestador', title: l('Prestador (quem desenvolve)', 'Developer'), personRole: 'outro' },
    { id: 'cliente', title: l('Cliente', 'Client'), personRole: 'cliente' },
    { id: 'projecto', title: l('Projecto', 'Project') },
    { id: 'prazos', title: l('Fases, prazos e pagamentos', 'Milestones, deadlines and payments') },
    { id: 'direitos', title: l('Direitos sobre o código e garantia', 'Rights in the code and warranty') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('prestador', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('cliente', { tipoDefault: 'empresa' }),

    {
      name: 'tipo',
      type: 'select',
      section: 'projecto',
      width: 'half',
      label: l('O que vai ser desenvolvido', 'What will be developed'),
      options: [
        { value: 'software', label: l('Software à medida', 'Custom software') },
        { value: 'website', label: l('Website', 'Website') },
        { value: 'app', label: l('Aplicação móvel (app)', 'Mobile app') },
        { value: 'loja', label: l('Loja online', 'Online shop') },
      ],
      default: 'website',
    },
    { name: 'nomeProjecto', type: 'text', section: 'projecto', width: 'half', label: l('Nome do projecto', 'Project name'), placeholder: l('Ex.: Portal de clientes', 'E.g. Customer portal') },
    {
      name: 'especificacao',
      type: 'textarea',
      section: 'projecto',
      rows: 7,
      required: true,
      label: l('Funcionalidades e requisitos (Anexo I)', 'Features and requirements (Annex I)'),
      help: l('Uma funcionalidade por linha. Quanto mais concreto, menos discussões na entrega.', 'One feature per line. The more specific, the fewer disputes at delivery.'),
      placeholder: l('Ex.: Página inicial, sobre nós, serviços e contactos\nFormulário de contacto com envio para o e-mail da empresa\nPainel para a empresa publicar notícias', 'E.g. Home, about, services and contact pages\nContact form sent to the company e-mail\nPanel to publish news'),
    },
    { name: 'tecnologias', type: 'text', section: 'projecto', label: l('Tecnologias e plataformas (opcional)', 'Technologies and platforms (optional)'), placeholder: l('Ex.: WordPress; Android e iOS; React e PostgreSQL', 'E.g. WordPress; Android and iOS; React and PostgreSQL') },
    { name: 'exclusoes', type: 'textarea', section: 'projecto', rows: 2, label: l('Não incluído (opcional)', 'Not included (optional)'), placeholder: l('Ex.: produção de textos e fotografias; alojamento; taxas das lojas de aplicações', 'E.g. copywriting and photos; hosting; app store fees') },

    { name: 'dataInicio', type: 'date', section: 'prazos', width: 'half', label: l('Início dos trabalhos', 'Start date'), default: (c) => c.today },
    { name: 'dataEntrega', type: 'date', section: 'prazos', width: 'half', label: l('Entrega final', 'Final delivery') },
    {
      name: 'fases',
      type: 'lines',
      section: 'prazos',
      label: l('Fases e pagamentos (opcional)', 'Milestones and payments (optional)'),
      help: l('Ex.: adiantamento na assinatura, protótipo, versão de testes, entrega final.', 'E.g. advance on signing, prototype, test version, final delivery.'),
      addLabel: l('Adicionar fase', 'Add milestone'),
      columns: [
        { name: 'fase', type: 'text', label: l('Fase / entregável', 'Milestone') },
        { name: 'entrega', type: 'date', label: l('Data', 'Date') },
        { name: 'valor', type: 'money', label: l('Valor a pagar', 'Amount') },
      ],
    },
    { name: 'preco', type: 'money', section: 'prazos', width: 'half', label: l('Preço total', 'Total price'), help: l('Se preencher as fases, o total é a soma dos valores.', 'If you fill in milestones, the total is their sum.') },
    ivaField('prazos'),
    ...formaPagamentoFields('prazos'),
    { name: 'pagamentoDias', type: 'number', section: 'prazos', width: 'half', min: 0, max: 90, default: 15, label: l('Prazo para pagar cada factura (dias)', 'Days to pay each invoice') },
    { name: 'testesDias', type: 'number', section: 'prazos', width: 'half', min: 1, max: 60, default: 10, label: l('Prazo para testar e aceitar (dias)', 'Days to test and accept') },
    { name: 'respostaDias', type: 'number', section: 'prazos', width: 'half', min: 1, max: 30, default: 5, label: l('Prazo do cliente para dar materiais e respostas (dias)', 'Days for the client to provide content and feedback') },
    { name: 'penalidade', type: 'toggle', section: 'prazos', label: l('Penalização por atraso na entrega', 'Late-delivery penalty') },
    { name: 'penalidadeDia', type: 'money', section: 'prazos', width: 'half', label: l('Valor por dia de atraso', 'Amount per day of delay'), showIf: (v) => Boolean(v.penalidade) },
    { name: 'penalidadeMax', type: 'money', section: 'prazos', width: 'half', label: l('Limite máximo da penalização', 'Penalty cap'), showIf: (v) => Boolean(v.penalidade) },

    {
      name: 'direitos',
      type: 'radio',
      section: 'direitos',
      label: l('A quem ficam os direitos sobre o resultado', 'Who owns the result'),
      options: [
        { value: 'cliente', label: l('Ao cliente, depois de pagar tudo (cessão)', 'The client, once paid in full (assignment)') },
        { value: 'licenca', label: l('Ao prestador; o cliente recebe licença perpétua de uso', 'The developer; the client gets a perpetual licence') },
      ],
      default: 'cliente',
      help: l('Se o contrato nada disser, os direitos ficam com o autor. Escolha expressamente.', 'If the contract is silent, rights stay with the author. Choose expressly.'),
    },
    { name: 'codigoFonte', type: 'toggle', section: 'direitos', default: true, label: l('Entregar o código-fonte e os acessos de administrador', 'Deliver the source code and admin access') },
    { name: 'portfolio', type: 'toggle', section: 'direitos', default: true, label: l('O prestador pode mostrar o trabalho no seu portefólio', 'The developer may show the work in its portfolio') },
    { name: 'garantiaMeses', type: 'number', section: 'direitos', width: 'half', min: 0, max: 24, default: 3, label: l('Garantia de correcção de erros (meses)', 'Bug-fix warranty (months)') },

    { name: 'dadosPessoais', type: 'toggle', section: 'clausulas', default: true, label: l('O prestador terá acesso a dados pessoais do cliente', 'The developer will access the client’s personal data') },
    { name: 'limiteResponsabilidade', type: 'toggle', section: 'clausulas', default: true, label: l('Limitar a responsabilidade ao preço do contrato (excepto dolo ou culpa grave)', 'Cap liability at the contract price (except wilful misconduct or gross negligence)') },
    { name: 'avisoDias', type: 'number', section: 'clausulas', width: 'half', min: 0, max: 180, default: 30, label: l('Aviso prévio para desistir (dias)', 'Notice to withdraw (days)') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const fs = fases(v);
    const soma = fs.reduce((s, f) => s + (f.valor ?? 0), 0);
    const total = fs.some((f) => f.valor != null) ? roundMoney(soma) : money(v.preco);
    return { fases: fs, total };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'prestador', 'prestador', 'developer'), ...partyWarnings(v, 'cliente', 'cliente', 'client')];
    if (c.total == null) w.push({ level: 'warning', field: 'preco', message: l('Indique o preço total ou os valores das fases.', 'Enter the total price or the milestone amounts.') });
    if (!linhas(v.especificacao).length) w.push({ level: 'error', field: 'especificacao', message: l('Descreva as funcionalidades: é o Anexo I que define o que deve ser entregue.', 'Describe the features: Annex I defines what must be delivered.') });
    const p = money(v.preco);
    if (c.fases.some((f: Fase) => f.valor != null) && p != null && Math.abs(p - c.total) > 0.5) {
      w.push({ level: 'warning', field: 'preco', message: l(`O preço indicado (${formatMoney(p)}) é diferente da soma das fases (${formatMoney(c.total)}). Vale a soma das fases.`, 'The price differs from the milestone total; the milestone total is used.') });
    }
    w.push({
      level: 'info',
      field: 'direitos',
      message: l(
        `Na obra feita por encomenda, os direitos patrimoniais são de quem o contrato disser; no silêncio, ficam com o autor (${cite('digObraEncomenda')}).`,
        'For commissioned works the economic rights belong to whoever the contract says; if silent, to the author.',
      ),
    });
    return w;
  },

  personName: (v) => partyName(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const P = papel(v, 'prestador', 'Prestador', 'Prestadora', true);
    const C = papel(v, 'cliente', 'Cliente', 'Cliente');
    const tipo = TIPOS[str(v.tipo)] ?? TIPOS.software;
    const nome = str(v.nomeProjecto);
    const fs: Fase[] = c.fases;
    const comFases = fs.length > 0;
    const exclusoes = linhas(v.exclusoes);

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        `Pelo presente contrato, ${P.o} obriga-se a conceber, desenvolver, testar e entregar ${C.ao} ${tipo.o}${nome ? `, designado "${nome}"` : ''}, com as funcionalidades e os requisitos descritos no Anexo I, que faz parte integrante do contrato.`,
        str(v.tecnologias) ? `O projecto é desenvolvido com as seguintes tecnologias e plataformas: ${semPonto(v.tecnologias)}.` : '',
        exclusoes.length ? `Não estão incluídos no objecto do contrato: ${exclusoes.map(semPonto).join('; ')}.` : '',
      ]),
      en: `The developer designs, builds, tests and delivers the ${tipo.nome}${nome ? ` "${nome}"` : ''} described in Annex I.`,
    });
    cl.push({
      id: 'alteracoesProjecto',
      heading: 'Alterações ao projecto',
      text: numerar([
        `Qualquer alteração às funcionalidades do Anexo I é pedida por escrito ${C.pelo}. ${P.O} indica, no prazo de ${prazo(v.respostaDias)}, o impacto da alteração no preço e nos prazos, e a alteração só é executada depois de aceite por escrito por ambas as partes.`,
        'Os pedidos de alteração aceites passam a fazer parte do Anexo I.',
      ]),
      en: 'Changes to Annex I are requested in writing; the developer quotes the impact on price and time, and changes are made only once both parties accept in writing.',
    });
    cl.push({
      id: 'obrigacoesPrestador',
      heading: `Obrigações ${P.de}`,
      text: `${P.O} obriga-se a:`,
      items: [
        'executar o trabalho com diligência, segundo as boas práticas da profissão, e com pessoal qualificado;',
        `manter ${C.o} ${C.f ? 'informada' : 'informado'} sobre o andamento do projecto e disponibilizar versões de teste;`,
        `garantir que o resultado não infringe direitos de terceiros, salvo quanto aos materiais fornecidos ${C.pelo};`,
        'identificar os componentes de terceiros e de código aberto utilizados e as respectivas licenças;',
        v.codigoFonte
          ? 'entregar, com a versão final, o código-fonte, a documentação técnica essencial e os acessos de administrador.'
          : 'entregar, com a versão final, a documentação de utilização e os acessos de administrador.',
      ],
      en: 'The developer works diligently with qualified staff, reports progress, provides test versions, ensures no infringement of third-party rights, lists third-party and open-source components, and hands over the deliverables stated.',
    });
    cl.push({
      id: 'obrigacoesCliente',
      heading: `Obrigações ${C.de}`,
      text: `${C.O} obriga-se a:`,
      items: [
        `fornecer os textos, imagens, logótipos, dados e demais materiais, bem como os acessos necessários, e responder às questões ${P.de} no prazo de ${prazo(v.respostaDias)};`,
        'garantir que tem os direitos sobre os materiais que fornece e que estes não violam a lei nem direitos de terceiros;',
        'designar uma pessoa de contacto com poderes para aprovar as fases do projecto;',
        'pagar o preço nos termos acordados.',
      ],
      en: 'The client provides content and access, answers within the stated time, warrants its rights in the materials, appoints a contact person with approval powers and pays as agreed.',
    });
    cl.push({
      id: 'prazos',
      heading: 'Prazos',
      text: numerar([
        `Os trabalhos iniciam-se em ${dateLong(v.dataInicio)} e a entrega final ocorre até ${dateLong(v.dataEntrega)}${comFases ? ', de acordo com as fases indicadas no Anexo II' : ''}.`,
        `Os prazos ${P.de} suspendem-se enquanto ${C.o} não fornecer os materiais, os acessos ou as aprovações de que o trabalho dependa, prorrogando-se por igual período.`,
      ]),
      en: `Work starts on ${v.dataInicio || '—'} and final delivery is by ${v.dataEntrega || '—'}. Deadlines are extended while the client delays materials, access or approvals.`,
    });
    cl.push({
      id: 'preco',
      heading: 'Preço e pagamento',
      text: numerar([
        `Pelo trabalho objecto do contrato, ${C.o} paga ${P.ao} o preço global de ${valorTexto(c.total)}${ivaTexto(v.iva)}${comFases ? ', repartido pelas fases indicadas no Anexo II' : ''}.`,
        comFases
          ? ''
          : 'O preço é pago contra a apresentação da factura correspondente, salvo acordo escrito de pagamento por fases.',
        `Cada factura é paga no prazo de ${prazo(v.pagamentoDias)} a contar da sua apresentação, ${modoPagamento(v, P)}.`,
        `O atraso no pagamento confere ${P.ao} o direito a juros de mora à taxa legal e, decorridos ${prazo(v.respostaDias)} sobre interpelação escrita, o direito de suspender os trabalhos até à regularização, com prorrogação dos prazos.`,
      ]),
      en: `The client pays a total of ${c.total != null ? formatMoney(c.total) : '—'}${v.iva === 'incluido' ? ' (VAT included)' : v.iva === 'isento' ? '' : ' plus VAT'}${comFases ? ' by milestones' : ''}; invoices are due within the stated days. Late payment bears legal interest and lets the developer suspend work.`,
    });
    cl.push({
      id: 'aceitacao',
      heading: 'Testes e aceitação',
      text: numerar([
        `Em cada entrega, ${C.o} dispõe de ${prazo(v.testesDias)} para testar o trabalho e comunicar por escrito os erros ou as desconformidades com o Anexo I, descrevendo-os de forma que possam ser reproduzidos.`,
        `${P.O} corrige, sem custos adicionais, os erros e as desconformidades comunicados, e submete de novo o trabalho a testes.`,
        `Considera-se aceite a entrega quando ${C.o} a aprovar por escrito, quando não comunicar erros dentro do prazo referido no n.º 1, ou quando passar a utilizá-la na sua actividade.`,
      ]),
      en: 'After each delivery the client has the stated days to test and report errors in writing; the developer fixes them free of charge. A delivery is accepted on written approval, on silence after the period, or when put into use.',
    });
    cl.push(
      v.direitos === 'licenca'
        ? {
            id: 'direitos',
            heading: 'Direitos de autor',
            text: numerar([
              `${P.O} mantém os direitos de autor sobre o código e os demais elementos que criou, e concede ${C.ao}, com o pagamento integral do preço, uma licença perpétua, não exclusiva e intransmissível de utilização, reprodução e modificação do resultado para as necessidades da sua actividade.`,
              `${C.O} não pode vender, licenciar ou ceder o resultado a terceiros sem autorização escrita ${P.de}.`,
              'Os componentes de terceiros e de código aberto continuam sujeitos às respectivas licenças.',
            ]),
            en: 'The developer keeps the copyright and grants the client, on full payment, a perpetual, non-exclusive, non-transferable licence to use, copy and modify the result for its business; no resale or sublicensing. Third-party components keep their licences.',
          }
        : {
            id: 'direitos',
            heading: 'Direitos de autor',
            text: numerar([
              `Com o pagamento integral do preço, ${P.o} transmite ${C.ao}, em exclusivo e sem limite de tempo ou de lugar, os direitos patrimoniais de autor sobre o resultado desenvolvido especificamente para este contrato, incluindo o código${v.codigoFonte ? '-fonte' : ''}, os desenhos e a documentação, podendo ${C.o} utilizá-lo, reproduzi-lo, modificá-lo e explorá-lo por qualquer forma.`,
              `${P.O} mantém os direitos sobre as ferramentas, bibliotecas e componentes que já detinha antes do contrato ou que desenvolve de forma genérica, concedendo ${C.ao} uma licença perpétua e gratuita de utilização desses elementos, na medida necessária ao uso do resultado.`,
              'Os componentes de terceiros e de código aberto continuam sujeitos às respectivas licenças.',
              `Até ao pagamento integral, a utilização do resultado ${C.pelo} é feita a título de licença provisória.`,
            ]),
            en: 'On full payment the developer assigns to the client exclusively, without limit of time or place, the economic rights in the work created for this contract. The developer keeps its pre-existing tools and generic components, licensed free and perpetually to the client as needed. Third-party components keep their licences.',
          },
    );
    if (v.portfolio) {
      cl.push({
        id: 'portfolio',
        heading: 'Referência ao trabalho',
        text: `${P.O} pode referir o projecto e mostrar imagens do resultado no seu portefólio e nos seus meios de promoção, sem divulgar informação confidencial ${C.de}.`,
        en: 'The developer may show the project in its portfolio without disclosing confidential information.',
      });
    }
    cl.push({
      id: 'garantia',
      heading: 'Garantia',
      text: numerar([
        `${P.O} garante, durante ${prazo(v.garantiaMeses, 'mês')} a contar da aceitação final, a correcção gratuita dos erros de funcionamento que sejam imputáveis ao seu trabalho.`,
        `A garantia não abrange os erros causados por alterações feitas ${C.pelo} ou por terceiros, por uso indevido, por falhas do alojamento, da rede ou de serviços de terceiros, nem novas funcionalidades.`,
        'A manutenção e o suporte após o período de garantia podem ser objecto de contrato próprio.',
      ]),
      en: 'Free correction of errors attributable to the developer for the stated months after final acceptance; excludes third-party changes, misuse, hosting or network failures and new features. Later maintenance may be contracted separately.',
    });
    if (v.penalidade) {
      cl.push({
        id: 'penalidade',
        heading: 'Atraso na entrega',
        text: `Se a entrega final se atrasar por facto imputável ${P.ao}, ${P.f ? 'esta' : 'este'} paga ${C.ao}, a título de cláusula penal, ${valorTexto(money(v.penalidadeDia))} por cada dia de atraso, até ao limite de ${valorTexto(money(v.penalidadeMax))}, sem prejuízo do direito de resolução do contrato.`,
        en: 'For delay attributable to the developer, a penalty per day applies up to the cap stated, without prejudice to termination.',
      });
    }
    cl.push(clConfidencialidade(P, C));
    if (v.dadosPessoais) cl.push(clDadosPessoais(C, P));
    if (v.limiteResponsabilidade) {
      cl.push({
        id: 'responsabilidade',
        heading: 'Limitação de responsabilidade',
        text: `Salvo em caso de dolo ou culpa grave, a responsabilidade de cada parte por danos emergentes do presente contrato não excede o valor total do preço, e nenhuma das partes responde por lucros cessantes ou por perda de dados de que a outra não tenha feito cópia de segurança.`,
        en: 'Except for wilful misconduct or gross negligence, each party’s liability is capped at the contract price, excluding lost profits and loss of data not backed up.',
      });
    }
    cl.push(clAutonomia(P));
    cl.push(
      clCessacao({
        avisoDias: v.avisoDias,
        curaDias: v.respostaDias,
        quem: `${C.O}`,
        extra: [`Em caso de desistência ${C.de}, ${C.f ? 'esta' : 'este'} paga o trabalho já realizado e as despesas feitas, e recebe o que estiver desenvolvido até essa data.`],
      }),
    );
    cl.push(clForcaMaior());

    const annex: Block[] = [
      { type: 'pageBreakHint' },
      { type: 'title', text: 'Anexo I — Especificação', subtitle: nome || undefined },
      linhas(v.especificacao).length
        ? { type: 'list', style: 'numeric', items: linhas(v.especificacao).map((s) => semPonto(s) + '.') }
        : { type: 'box', label: 'Funcionalidades e requisitos', lines: 10 },
    ];

    const quadro: Block[] = comFases
      ? [
          {
            type: 'table',
                        columns: [
              { label: 'N.º', width: 0.5, align: 'right' },
              { label: 'Fase / entregável', width: 3.5 },
              { label: 'Data', width: 1.4 },
              { label: 'Valor (MT)', width: 1.5, align: 'right' },
            ],
            rows: fs.map((f, i) => [String(i + 1), f.fase || BLANK, f.entrega ? formatDateShort(f.entrega) : BLANK, f.valor != null ? formatMoney(f.valor, false) : BLANK]),
            totals: [['', 'Total', '', c.total != null ? formatMoney(c.total, false) : BLANK]],
          },
        ]
      : [];

    if (quadro.length) annex.push({ type: 'spacer', size: 'medium' }, { type: 'heading', text: 'Anexo II — Fases, prazos e pagamentos', align: 'center' }, ...quadro);
    return contratoBlocks(ctx, {
      title: 'Contrato de desenvolvimento de ' + tipo.nome,
      subtitle: nome || undefined,
      parties: [
        { p: 'cliente', role: C, en: 'Client' },
        { p: 'prestador', role: P, en: 'Developer' },
      ],
      clauses: cl,
      signatures: [assinatura(ctx, 'cliente', C), assinatura(ctx, 'prestador', P, true)],
      annex,
    });
  },
});
