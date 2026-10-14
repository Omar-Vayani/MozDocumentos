// Contrato de prestação de serviços de contabilidade e assessoria fiscal:
// accountant (or accounting firm) and client. The titles "Contabilista
// Certificado" and "Auditor Certificado" are reserved to OCAM members.

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { cite, dateLong, l, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, int, numerar, papel, partesBlocks, partyFields, partyWarnings,
  quantos, str, testemunhasField, valorTexto,
} from './_contratos';

const SERVICOS = [
  { key: 'contabilidade', pt: 'organização e execução da contabilidade, de acordo com o sistema de contabilidade aplicável ao Cliente', label: 'Contabilidade organizada' },
  { key: 'iva', pt: 'preparação e submissão das declarações periódicas do IVA', label: 'Declarações do IVA' },
  { key: 'retencoes', pt: 'apuramento e declaração das retenções na fonte do IRPS e do IRPC', label: 'Retenções na fonte' },
  { key: 'anual', pt: 'preparação e submissão das declarações anuais de rendimentos e de informação contabilística e fiscal', label: 'Declarações anuais (IRPC / IRPS)' },
  { key: 'salarios', pt: 'processamento de salários e preparação das folhas de remunerações e das declarações à Segurança Social (INSS)', label: 'Salários e INSS' },
  { key: 'demonstracoes', pt: 'preparação das demonstrações financeiras anuais', label: 'Demonstrações financeiras' },
  { key: 'assessoria', pt: 'assessoria fiscal e contabilística corrente, por telefone, correio electrónico ou reunião', label: 'Assessoria corrente' },
] as const;

export default defineTemplate({
  id: 'contrato-servicos-contabilidade',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'contabilista', title: l('Contabilista ou gabinete', 'Accountant or firm'), personRole: 'outro' },
    { id: 'cliente', title: l('Cliente', 'Client'), personRole: 'cliente' },
    { id: 'servicos', title: l('Serviços', 'Services') },
    { id: 'honorarios', title: l('Honorários e prazos', 'Fees and deadlines') },
    { id: 'vigencia', title: l('Vigência e outras cláusulas', 'Term and other clauses') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('contabilista', { fromProfile: true, tipoDefault: 'pessoa' }),
    {
      name: 'ocamNumero',
      type: 'text',
      section: 'contabilista',
      width: 'half',
      required: true,
      label: l('N.º de inscrição na OCAM', 'OCAM registration no.'),
      legal: l('O título de Contabilista Certificado é reservado aos inscritos na OCAM.', 'The Certified Accountant title is reserved to OCAM members.'),
      default: (c) => (/contabilistas/i.test(c.profile?.ordemProfissional ?? '') ? c.profile?.ordemNumero || '' : ''),
    },
    ...partyFields('cliente', { tipoDefault: 'empresa' }),
    ...SERVICOS.map((s, i) => ({ name: `serv_${s.key}`, type: 'toggle' as const, section: 'servicos', width: 'half' as const, label: l(s.label, s.label), default: i < 4 || s.key === 'assessoria' })),
    { name: 'outrosServicos', type: 'textarea', section: 'servicos', rows: 2, label: l('Outros serviços (opcional)', 'Other services (optional)'), help: l('Um por linha.', 'One per line.') },
    { name: 'diaEntregaDocumentos', type: 'number', section: 'honorarios', width: 'half', min: 1, max: 28, default: 5, label: l('Dia do mês até ao qual o cliente entrega os documentos', 'Day of the month by which the client delivers documents') },
    {
      name: 'acessoPlataformas',
      type: 'radio',
      section: 'honorarios',
      label: l('Submissão electrónica das declarações', 'Electronic filing'),
      options: [
        { value: 'credenciais', label: l('O cliente faculta as credenciais de acesso', 'The client provides the login credentials') },
        { value: 'procuracao', label: l('O cliente passa procuração ao contabilista', 'The client grants a power of attorney') },
      ],
      default: 'credenciais',
    },
    { name: 'avenca', type: 'money', section: 'honorarios', width: 'half', required: true, label: l('Avença mensal', 'Monthly fee') },
    { name: 'avencaIva', type: 'toggle', section: 'honorarios', width: 'half', default: true, label: l('Acresce IVA à avença', 'VAT added to the fee') },
    { name: 'diaPagamento', type: 'number', section: 'honorarios', width: 'half', min: 1, max: 28, default: 10, label: l('Dia de pagamento da avença', 'Fee payment day') },
    { name: 'honorarioFecho', type: 'money', section: 'honorarios', width: 'half', label: l('Honorário do fecho anual (opcional)', 'Year-end fee (optional)') },
    { name: 'dataInicio', type: 'date', section: 'vigencia', width: 'half', label: l('Início dos serviços', 'Start date') },
    { name: 'duracaoMeses', type: 'number', section: 'vigencia', width: 'half', min: 1, max: 60, default: 12, label: l('Duração (meses)', 'Term (months)') },
    { name: 'renovacao', type: 'toggle', section: 'vigencia', default: true, label: l('Renova-se automaticamente', 'Renews automatically') },
    { name: 'avisoDenunciaDias', type: 'number', section: 'vigencia', width: 'half', min: 1, max: 180, default: 60, label: l('Aviso de denúncia (dias)', 'Notice to terminate (days)') },
    { name: 'devolucaoDias', type: 'number', section: 'vigencia', width: 'half', min: 1, max: 90, default: 30, label: l('Prazo para devolver os documentos no fim (dias)', 'Days to return documents at the end') },
    foroField('vigencia'),
    arbitragemField('vigencia'),
    testemunhasField('vigencia'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      ...partyWarnings(v, 'contabilista', 'contabilista', 'accountant'),
      ...partyWarnings(v, 'cliente', 'cliente', 'client'),
    ];
    if (!str(v.ocamNumero)) {
      w.push({ level: 'warning', field: 'ocamNumero', message: l(`Indique o número de inscrição na OCAM. Só os inscritos podem usar o título de Contabilista Certificado (${cite('ocamTitulos')}).`, 'Enter the OCAM registration number. Only members may use the Certified Accountant title.') });
    }
    if (money(v.avenca) == null) w.push({ level: 'warning', field: 'avenca', message: l('Indique a avença mensal.', 'Enter the monthly fee.') });
    if (v.acessoPlataformas === 'procuracao') {
      w.push({ level: 'info', field: 'acessoPlataformas', message: l('Use o modelo de procuração com a opção "Representação junto da Autoridade Tributária".', 'Use the power of attorney template with the "Tax Authority" option.') });
    }
    w.push({ level: 'info', message: l('A auditoria de contas é reservada a Auditores Certificados e sociedades de auditoria; não a inclua neste contrato.', 'Statutory audit is reserved to certified auditors; do not include it here.') });
    return w;
  },

  personName: (v) => (v.clienteTipo === 'empresa' ? v.clienteEmpresaNome : v.clienteNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const C = papel(v, 'contabilista', 'Contabilista', 'Contabilista');
    const K = papel(v, 'cliente', 'Cliente', 'Cliente');
    const servicos = SERVICOS.filter((s) => v[`serv_${s.key}`]).map((s) => s.pt);
    const outros = str(v.outrosServicos).split(/\n+/).map((s) => s.trim().replace(/[.;]+$/, '')).filter(Boolean)
      .map((s) => (/^\p{Lu}\p{Ll}/u.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s));
    const lista = [...servicos, ...outros];
    const dia = int(v.diaEntregaDocumentos);
    const diaPag = int(v.diaPagamento);
    const fecho1 = money(v.honorarioFecho);
    const dur = int(v.duracaoMeses);
    const aviso = int(v.avisoDenunciaDias);
    const dev = int(v.devolucaoDias);
    const ocam = str(v.ocamNumero);

    const items: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `${C.O}${ocam ? `, inscrit${C.f ? 'a' : 'o'} na Ordem dos Contabilistas e Auditores de Moçambique sob o n.º ${ocam},` : ''} presta ${K.ao} os seguintes serviços:`,
        items: lista.length ? lista : ['____________________'],
        en: 'The accountant provides the client with the services listed.',
      },
      {
        id: 'exclusoes',
        heading: 'Serviços não incluídos',
        text: 'Não estão incluídos a auditoria ou revisão legal de contas, a representação em processos de inspecção, reclamação ou impugnação, nem serviços extraordinários de consultoria, que são orçamentados à parte.',
        en: 'Audit, representation in tax inspections or disputes and extraordinary consulting are not included and are quoted separately.',
      },
      {
        id: 'obrigacoesCliente',
        heading: `Obrigações ${K.de}`,
        text: numerar([
          `${K.O} entrega ${C.ao}${dia ? `, até ao dia ${dia} de cada mês,` : ' mensalmente,'} todos os documentos relativos ao mês anterior, designadamente as facturas emitidas e recebidas, os recibos, os extractos bancários e de carteiras móveis, as folhas de salários e os contratos, organizados e completos, mediante protocolo de entrega.`,
          `${K.O} é ${K.f ? 'a única responsável' : 'o único responsável'} pela veracidade, legalidade e integridade dos documentos e das informações que fornece, e pelo pagamento atempado dos impostos e contribuições apurados.`,
        ]),
        en: 'The client delivers all monthly documents by the agreed day, against a handover log, and is solely responsible for their accuracy and for paying the taxes and contributions due.',
      },
      {
        id: 'obrigacoesContabilista',
        heading: `Obrigações ${C.de}`,
        text: `${C.O} executa os serviços com diligência e de acordo com as normas legais, contabilísticas e deontológicas aplicáveis, e informa ${K.o}, por escrito e com a antecedência possível, dos prazos, dos valores a pagar e de qualquer irregularidade que detecte.`,
        en: 'The accountant works diligently under the applicable legal, accounting and ethical rules and informs the client in writing of deadlines, amounts payable and any irregularity.',
      },
      {
        id: 'responsabilidade',
        heading: 'Responsabilidade',
        text: `${C.O} não responde por multas, juros ou outras consequências resultantes da entrega tardia ou incompleta de documentos ${K.pelo}, de informações falsas ou da falta de pagamento dos impostos e contribuições apurados.`,
        en: 'The accountant is not liable for penalties or interest caused by late or incomplete documents, false information or the client’s failure to pay taxes.',
      },
      {
        id: 'plataformas',
        heading: 'Submissão electrónica',
        text:
          v.acessoPlataformas === 'procuracao'
            ? `Para a submissão electrónica das declarações, ${K.o} confere ${C.ao} procuração com os poderes necessários junto da Autoridade Tributária e da Segurança Social.`
            : `Para a submissão electrónica das declarações, ${K.o} faculta ${C.ao} as credenciais de acesso às plataformas da Autoridade Tributária e da Segurança Social. ${C.O} utiliza-as apenas para os fins deste contrato e deixa de as usar no seu termo, devendo ${K.o} alterá-las.`,
        en: 'The client provides access credentials (or a power of attorney) for electronic filing; the accountant uses them only for this contract.',
      },
      {
        id: 'honorarios',
        heading: 'Honorários',
        text: numerar([
          `Pelos serviços, ${K.o} paga ${C.ao} uma avença mensal de ${valorTexto(money(v.avenca))}${v.avencaIva ? ', acrescida de IVA à taxa legal' : ''}, até ao dia ${diaPag ?? '____'} de cada mês, contra a respectiva factura.`,
          fecho1 != null ? `Pela preparação das demonstrações financeiras e das declarações anuais é devido um honorário de ${valorTexto(fecho1)}${v.avencaIva ? ', acrescido de IVA' : ''}.` : '',
          'Os serviços extraordinários são cobrados conforme orçamento previamente aceite.',
          `O atraso no pagamento permite ${C.ao} suspender os serviços, após aviso escrito, sem responsabilidade pelas consequências da suspensão.`,
        ]),
        en: 'The client pays the monthly fee (plus VAT where applicable) by the agreed day against invoice; year-end and extra work are charged separately; late payment allows suspension after written notice.',
      },
      {
        id: 'sigilo',
        heading: 'Confidencialidade',
        text: `${C.O} guarda sigilo sobre todas as informações ${K.de} de que tome conhecimento, salvo dever legal de comunicação às autoridades.`,
        en: 'The accountant keeps all client information confidential, save legal reporting duties.',
      },
      {
        id: 'documentos',
        heading: 'Guarda e devolução de documentos',
        text: `Os livros, registos e documentos são propriedade ${K.de}. No termo do contrato, ${C.o} entrega-os ${K.ao}, ou a quem este indicar, mediante protocolo, no prazo de ${quantos(dev, 'dia', 'dias')}.`,
        en: 'Books and records belong to the client and are returned against a handover log within the stated period after the end of the contract.',
      },
      {
        id: 'vigencia',
        heading: 'Vigência e denúncia',
        text: numerar([
          `O presente contrato produz efeitos a partir de ${v.dataInicio ? dateLong(v.dataInicio) : 'a data da sua assinatura'} e vigora por ${quantos(dur, 'mês', 'meses')}${v.renovacao ? ', renovando-se automaticamente por iguais períodos' : ''}.`,
          `Qualquer das partes pode denunciar o contrato por escrito, com a antecedência mínima de ${quantos(aviso, 'dia', 'dias')}. A denúncia não dispensa ${C.o} de concluir as obrigações declarativas relativas ao período já decorrido, desde que pagas.`,
        ]),
        en: 'Term and renewal as stated; either party may terminate in writing with the stated notice; filings for the period already elapsed are completed if paid.',
      },
      ...clausulasFinais(v),
    ];

    return [
      { type: 'title', text: 'Contrato de prestação de serviços de contabilidade', subtitle: 'e assessoria fiscal' },
      ...partesBlocks(v, [
        { p: 'contabilista', role: C, en: 'accountant' },
        { p: 'cliente', role: K, en: 'client' },
      ]),
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'É celebrado o presente contrato de prestação de serviços, que se rege pelas cláusulas seguintes:',
        en: 'This services contract is made on the following terms:',
      },
      { type: 'numberedClauses', style: 'clausula', items },
      ...fecho(ctx, [
        (() => {
          const col = assinatura(ctx, 'contabilista', C, true);
          return ocam ? { ...col, detail: [col.detail, `OCAM n.º ${ocam}`].filter(Boolean).join('\n') } : col;
        })(),
        assinatura(ctx, 'cliente', K),
      ]),
    ];
  },
});
