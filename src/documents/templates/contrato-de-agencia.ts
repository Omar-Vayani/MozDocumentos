// Contrato de agência (representação comercial): an independent agent promotes
// the principal's sales in a territory for a commission.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, l, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, int, isEmpresa, numerar, papel, partesBlocks, partyFields,
  partyName, partyWarnings, pct, quantos, semPonto, str, testemunhasField, valorTexto,
} from './_contratos';

export default defineTemplate({
  id: 'contrato-de-agencia',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'principal', title: l('Principal (empresa representada)', 'Principal'), personRole: 'outro' },
    { id: 'agente', title: l('Agente', 'Agent'), personRole: 'outro' },
    { id: 'ambito', title: l('Produtos, zona e exclusividade', 'Products, territory and exclusivity') },
    { id: 'comissao', title: l('Comissão', 'Commission') },
    { id: 'vigencia', title: l('Duração e outras cláusulas', 'Term and other terms') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('principal', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('agente'),

    { name: 'produtos', type: 'textarea', section: 'ambito', required: true, rows: 3, label: l('Produtos ou serviços a promover', 'Products or services'), placeholder: l('Um por linha', 'One per line') },
    { name: 'zona', type: 'text', section: 'ambito', required: true, label: l('Zona', 'Territory'), placeholder: l('Ex.: Províncias de Nampula e Cabo Delgado', 'E.g. Nampula and Cabo Delgado provinces') },
    { name: 'clientela', type: 'text', section: 'ambito', label: l('Grupo de clientes (opcional)', 'Customer group (optional)'), placeholder: l('Ex.: supermercados e grossistas', 'E.g. supermarkets and wholesalers') },
    { name: 'exclusividadePrincipal', type: 'toggle', section: 'ambito', default: true, label: l('O principal não nomeia outro agente na mesma zona', 'No other agent in the territory') },
    { name: 'exclusividadeAgente', type: 'toggle', section: 'ambito', default: true, label: l('O agente não promove produtos concorrentes', 'Agent does not promote competing products') },
    {
      name: 'poderesRepresentacao',
      type: 'toggle',
      section: 'ambito',
      label: l('O agente pode assinar contratos em nome do principal', 'Agent may sign contracts for the principal'),
      help: l('Sem esta opção, o agente só angaria encomendas, que o principal aceita ou recusa.', 'Without this, the agent only collects orders, which the principal accepts or refuses.'),
    },
    { name: 'poderesCobranca', type: 'toggle', section: 'ambito', label: l('O agente pode receber pagamentos dos clientes', 'Agent may collect payments') },
    { name: 'objectivos', type: 'textarea', section: 'ambito', rows: 2, label: l('Objectivos de vendas (opcional)', 'Sales targets (optional)') },

    { name: 'comissaoPct', type: 'number', section: 'comissao', required: true, width: 'half', min: 0, max: 50, label: l('Comissão (%)', 'Commission (%)') },
    {
      name: 'comissaoBase',
      type: 'radio',
      section: 'comissao',
      label: l('A comissão incide sobre', 'Commission is paid on'),
      options: [
        { value: 'angariados', label: l('Vendas a clientes angariados pelo agente', 'Sales to customers found by the agent') },
        { value: 'zona', label: l('Todas as vendas na zona', 'All sales in the territory') },
      ],
      default: 'angariados',
    },
    { name: 'diaPagamento', type: 'number', section: 'comissao', width: 'half', min: 1, max: 31, default: 10, label: l('Dia de pagamento da comissão', 'Commission payment day') },
    { name: 'delCredere', type: 'toggle', section: 'comissao', label: l('Del credere: o agente garante o pagamento dos clientes', 'Del credere: agent guarantees customer payment') },
    { name: 'delCrederePct', type: 'number', section: 'comissao', width: 'half', min: 0, max: 20, label: l('Comissão adicional del credere (%)', 'Del credere commission (%)'), showIf: (v) => Boolean(v.delCredere) },
    { name: 'retribuicaoFixa', type: 'money', section: 'comissao', width: 'half', label: l('Valor fixo mensal (opcional)', 'Fixed monthly amount (optional)'), help: l('Um valor fixo com horário e ordens pode tornar a relação um contrato de trabalho.', 'A fixed amount with hours and orders may turn this into employment.') },

    {
      name: 'duracao',
      type: 'radio',
      section: 'vigencia',
      label: l('Duração', 'Term'),
      options: [
        { value: 'indeterminado', label: l('Por tempo indeterminado', 'Indefinite') },
        { value: 'certo', label: l('Por prazo certo', 'Fixed term') },
      ],
      default: 'indeterminado',
    },
    { name: 'dataInicio', type: 'date', section: 'vigencia', width: 'half', label: l('Início', 'Start'), default: (c) => c.today },
    { name: 'duracaoMeses', type: 'number', section: 'vigencia', width: 'half', min: 1, max: 120, default: 12, label: l('Duração (meses)', 'Term (months)'), showIf: (v) => v.duracao === 'certo' },
    { name: 'avisoDenunciaDias', type: 'number', section: 'vigencia', width: 'half', required: true, min: 1, max: 180, default: 60, label: l('Aviso prévio para terminar (dias)', 'Notice to terminate (days)') },
    { name: 'confidencialidade', type: 'toggle', section: 'vigencia', default: true, label: l('Cláusula de confidencialidade', 'Confidentiality clause') },
    foroField('vigencia'),
    arbitragemField('vigencia'),
    testemunhasField('vigencia'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'principal', 'principal', 'principal'), ...partyWarnings(v, 'agente', 'agente', 'agent')];
    if (!str(v.zona)) w.push({ level: 'error', field: 'zona', message: l('Indique a zona de actuação do agente.', 'Enter the territory.') });
    if (v.comissaoPct == null || v.comissaoPct === '') w.push({ level: 'error', field: 'comissaoPct', message: l('Indique a percentagem de comissão.', 'Enter the commission rate.') });
    w.push({
      level: 'info',
      message: l(
        `O contrato de agência é regulado pelo ${cite('agenciaRegime')}. A lei pode reconhecer ao agente uma indemnização de clientela quando o contrato termina: confirme com um jurista antes de terminar o contrato.`,
        'Agency is governed by the Commercial Contracts Regime. The law may give the agent a goodwill indemnity at the end: check with a lawyer before terminating.',
      ),
    });
    const fixo = money(v.retribuicaoFixa);
    if (!isEmpresa(v, 'agente') && fixo != null && fixo > 0) {
      w.push({
        level: 'warning',
        field: 'retribuicaoFixa',
        message: l(
          `Um agente individual com retribuição fixa, horário e ordens pode ser considerado trabalhador por conta de outrem (${cite('presuncaoContratoTrabalho')}).`,
          'An individual agent with fixed pay, hours and orders may be deemed an employee.',
        ),
      });
    }
    if (v.poderesCobranca) w.push({ level: 'info', field: 'poderesCobranca', message: l('Defina como o agente entrega o dinheiro recebido e emita-lhe uma credencial para apresentar aos clientes.', 'Set how the agent hands over collected money and give the agent a letter of authority for customers.') });
    return w;
  },

  personName: (v) => partyName(v, 'agente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = papel(v, 'principal', 'Principal', 'Principal');
    const A = papel(v, 'agente', 'Agente', 'Agente');
    const produtos = str(v.produtos)
      .split(/\n+/)
      .map((s) => semPonto(s.replace(/^\s*[-•*]\s*/, '')))
      .filter(Boolean);
    const aviso = int(v.avisoDenunciaDias);
    const fixo = money(v.retribuicaoFixa);

    const clauses: ClauseItem[] = [];
    clauses.push({
      id: 'objecto',
      heading: 'Objecto',
      text: `${P.O} encarrega ${A.o}, que aceita, de promover por conta ${P.de}, de modo autónomo e estável e mediante retribuição, a celebração de contratos de venda dos seguintes produtos ou serviços${produtos.length ? ':' : `: ${BLANK}.`}`,
      items: produtos.length ? produtos.map((p, i) => `${/^[A-ZÁÉÍÓÚ][a-záéíóúâêôãõç]/.test(p) ? p.charAt(0).toLowerCase() + p.slice(1) : p}${i === produtos.length - 1 ? '.' : ';'}`) : undefined,
      en: 'The Principal appoints the Agent to promote, independently and on a stable basis, sales of the listed products or services for a commission.',
    });
    clauses.push({
      id: 'zona',
      heading: 'Zona e clientela',
      text: numerar([
        `A actividade ${A.de} exerce-se na seguinte zona: ${semPonto(v.zona) || BLANK}${str(v.clientela) ? `, junto do seguinte grupo de clientes: ${semPonto(v.clientela)}` : ''}.`,
        v.exclusividadePrincipal ? `${P.O} não nomeia outro agente para a mesma zona e grupo de clientes durante a vigência do contrato.` : '',
        v.exclusividadeAgente ? `${A.O} não promove, por conta própria ou de terceiros, produtos ou serviços concorrentes dos ${P.de} durante a vigência do contrato.` : '',
      ]),
      en: `Territory: ${v.zona || '—'}.${v.exclusividadePrincipal ? ' Exclusive agent for the territory.' : ''}${v.exclusividadeAgente ? ' The Agent will not promote competing products.' : ''}`,
    });
    clauses.push({
      id: 'poderes',
      heading: 'Poderes de representação',
      text: numerar([
        v.poderesRepresentacao
          ? `${A.O} pode celebrar contratos em nome ${P.de}, dentro dos preços e condições por este fixados por escrito.`
          : `${A.O} não tem poderes para celebrar contratos em nome ${P.de}. As encomendas angariadas são submetidas à aceitação ${P.de}, que as aceita ou recusa por escrito.`,
        v.poderesCobranca
          ? `${A.O} pode receber pagamentos dos clientes em nome ${P.de}, contra recibo emitido em nome deste, devendo entregar-lhe as quantias recebidas no prazo de três dias úteis.`
          : `${A.O} não pode receber pagamentos em nome ${P.de}.`,
      ]),
      en: `${v.poderesRepresentacao ? 'The Agent may sign contracts within the set prices.' : 'The Agent has no power to sign contracts; orders are subject to the Principal’s acceptance.'} ${v.poderesCobranca ? 'The Agent may collect payments and hand them over within three working days.' : 'The Agent may not collect payments.'}`,
    });
    clauses.push({
      id: 'obrigacoesAgente',
      heading: `Obrigações ${A.de}`,
      text: `${A.O} obriga-se a:`,
      items: [
        `promover activamente os produtos ${P.de} na zona, com zelo e boa-fé;`,
        `seguir as instruções razoáveis ${P.de} quanto a preços, condições de venda e imagem comercial;`,
        `informar mensalmente ${P.ao} sobre as encomendas angariadas, a situação do mercado e a solvabilidade dos clientes;`,
        str(v.objectivos) ? `procurar atingir os seguintes objectivos: ${semPonto(v.objectivos)};` : `procurar atingir os objectivos de vendas acordados por escrito com ${P.o};`,
        'suportar as despesas da sua actividade, salvo acordo escrito em contrário.',
      ],
      en: 'The Agent promotes the products diligently, follows reasonable instructions, reports monthly and bears its own costs.',
    });
    clauses.push({
      id: 'obrigacoesPrincipal',
      heading: `Obrigações ${P.de}`,
      text: `${P.O} obriga-se a:`,
      items: [
        `fornecer ${A.ao} amostras, catálogos, tabelas de preços e demais informação necessária;`,
        `informar ${A.o}, no prazo razoável, da aceitação ou recusa das encomendas e de qualquer redução significativa da sua capacidade de fornecimento;`,
        'pagar a comissão nos termos da cláusula seguinte.',
      ],
      en: 'The Principal provides samples, catalogues and price lists, informs the Agent of accepted orders and pays the commission.',
    });
    clauses.push({
      id: 'comissao',
      heading: 'Comissão',
      text: numerar([
        `${A.O} tem direito a uma comissão de ${pct(v.comissaoPct)} sobre o valor, sem IVA, das vendas ${v.comissaoBase === 'zona' ? 'realizadas na zona, ainda que sem a sua intervenção' : 'a clientes por si angariados'}, efectivamente pagas pelos clientes.`,
        `A comissão é paga até ao dia ${int(v.diaPagamento) ?? BLANK} do mês seguinte ao do pagamento pelo cliente, mediante factura ou recibo ${A.de}, acompanhado da relação das vendas.`,
        fixo != null && fixo > 0 ? `${P.O} paga ainda ${A.ao} um valor fixo mensal de ${valorTexto(fixo)}, por conta das despesas da actividade.` : '',
        v.delCredere ? `${A.O} garante o cumprimento das obrigações dos clientes por si angariados, recebendo por isso uma comissão adicional de ${pct(v.delCrederePct)}.` : '',
      ]),
      en: `Commission of ${v.comissaoPct ?? '—'}% on paid sales (net of VAT), paid by day ${v.diaPagamento ?? '—'} of the following month against an invoice.${v.delCredere ? ' Del credere guarantee for an extra commission.' : ''}`,
    });
    if (v.confidencialidade) {
      clauses.push({
        id: 'confidencialidade',
        heading: 'Confidencialidade',
        text: `${A.O} guarda sigilo sobre as informações comerciais ${P.de}, nomeadamente preços, margens e lista de clientes, durante a vigência do contrato e após a sua cessação.`,
        en: 'The Agent keeps the Principal’s commercial information confidential during and after the contract.',
      });
    }
    clauses.push({
      id: 'vigencia',
      heading: 'Duração e cessação',
      text: numerar([
        v.duracao === 'certo'
          ? `O presente contrato tem início em ${dateLong(v.dataInicio)} e vigora pelo prazo de ${quantos(int(v.duracaoMeses), 'mês', 'meses')}, convertendo-se em contrato por tempo indeterminado se as partes o continuarem a executar após o seu termo.`
          : `O presente contrato tem início em ${dateLong(v.dataInicio)} e é celebrado por tempo indeterminado.`,
        `Qualquer das partes pode denunciar o contrato mediante comunicação escrita com a antecedência mínima de ${quantos(aviso, 'dia', 'dias')}, sem prejuízo de prazos mínimos superiores previstos na lei.`,
        'Qualquer das partes pode resolver o contrato com fundamento em incumprimento grave da outra.',
        `Cessado o contrato, ${A.o} devolve as amostras, catálogos e documentos em seu poder e tem direito às comissões sobre as encomendas aceites antes da cessação, sem prejuízo da indemnização que a lei lhe reconheça.`,
      ]),
      en: `Starts ${v.dataInicio || '—'}; ${v.duracao === 'certo' ? 'fixed term' : 'indefinite'}; ${aviso ?? '—'} days’ written notice to terminate (or longer legal minimum); termination for serious breach; commissions on accepted orders remain due.`,
    });
    clauses.push(...clausulasFinais(v, { lei: `sobre o contrato de agência (${cite('agenciaRegime')})` }));

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de agência' },
      ...partesBlocks(v, [
        { p: 'principal', role: P, en: 'Principal' },
        { p: 'agente', role: A, en: 'Agent' },
      ]),
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'É celebrado e reciprocamente aceite o presente contrato de agência, que se rege pelas cláusulas seguintes e, no que nelas for omisso, pela legislação aplicável:',
        en: 'This agency agreement is entered into on the following terms and, where silent, the applicable law:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fecho(ctx, [assinatura(ctx, 'principal', P, true), assinatura(ctx, 'agente', A)]),
    ];
    return blocks;
  },
});
