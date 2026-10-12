import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type FieldDef, type TemplateContext, type Values, type Warning } from '../model';
import {
  BLANK, dateField, dateLong, employerParty, employerSignature, FORMA_PAGAMENTO_OPTIONS, formatMoney, isF, l, localField, money,
  placeDate, refField, splitLines, workerFields, workerParty,
} from './_shared';
import { doCite, enumerate, lc, moneyExt, num, qty } from './_contrato-trabalho';

const trim = (s: unknown) => String(s ?? '').trim();
const isEmpresa = (v: Values) => v.prestadorTipo === 'empresa';
const isSingular = (v: Values) => !isEmpresa(v);

type Periodicidade = 'mensal' | 'global' | 'hora' | 'fases';

/** Article forms for a party name used as a designation ("a Contratante", "do Prestador"…). */
function forms(noun: string, fem: boolean) {
  return {
    n: noun,
    o: `${fem ? 'a' : 'o'} ${noun}`,
    O: `${fem ? 'A' : 'O'} ${noun}`,
    ao: `${fem ? 'à' : 'ao'} ${noun}`,
    do: `${fem ? 'da' : 'do'} ${noun}`,
    pelo: `${fem ? 'pela' : 'pelo'} ${noun}`,
    a: (m: string, f: string) => (fem ? f : m),
  };
}
const contratante = (ctx: Pick<TemplateContext, 'profile'>) => forms('Contratante', ctx.profile?.kind !== 'pessoa');
const prestador = (v: Values) => {
  const fem = isEmpresa(v) || isF(v.prestadorGenero);
  return forms(fem ? 'Prestadora' : 'Prestador', fem);
};

function formaTexto(forma: unknown, pelo: string): string {
  switch (forma) {
    case 'numerário':
      return 'em numerário, contra recibo';
    case 'cheque':
      return 'por cheque';
    case 'M-Pesa':
    case 'e-Mola':
    case 'mKesh':
      return `através de ${forma}`;
    default:
      return `por transferência bancária para a conta indicada ${pelo}`;
  }
}

function defaultForo(city: string): string {
  const da = ['Beira', 'Matola'].includes(city) ? 'da' : 'de';
  return `Tribunal Judicial da Cidade ${da} ${city}`;
}

function prestadorEmpresaParty(v: Values, designation: string): string {
  const rep = trim(v.prestadorRepresentante);
  const parts = [
    `**${trim(v.prestadorNome) || BLANK}**`,
    trim(v.prestadorMorada) ? `com sede em ${trim(v.prestadorMorada)}` : '',
    trim(v.prestadorNuit) ? `com o NUIT ${trim(v.prestadorNuit)}` : '',
    trim(v.prestadorNuel) ? `registada sob o NUEL ${trim(v.prestadorNuel)}` : '',
    rep ? `neste acto representada por ${rep}${trim(v.prestadorRepresentanteCargo) ? `, na qualidade de ${trim(v.prestadorRepresentanteCargo)}` : ''}` : '',
  ].filter(Boolean);
  return `${parts.join(', ')}, adiante designada por **${designation}**`;
}

const singularOnly = (f: FieldDef): FieldDef => ({ ...f, showIf: isSingular });

export default defineTemplate({
  id: 'contrato-prestacao-servicos',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'prestador', title: l('Prestador de serviços', 'Service provider'), personRole: 'outro' },
    { id: 'servicos', title: l('Serviços e prazo', 'Services and term') },
    { id: 'honorarios', title: l('Honorários', 'Fees') },
    { id: 'clausulas', title: l('Cláusulas', 'Clauses') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data de assinatura', 'Signing date')),
    {
      name: 'prestadorTipo',
      type: 'radio',
      section: 'prestador',
      default: 'singular',
      label: l('O prestador é', 'The provider is'),
      options: [
        { value: 'singular', label: l('Pessoa singular (freelancer, consultor)', 'Individual (freelancer, consultant)') },
        { value: 'empresa', label: l('Empresa', 'Company') },
      ],
    },
    ...workerFields(['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada'], 'prestador', 'prestador').map(
      (f) => {
        if (f.name === 'prestadorNome') return { ...f, label: l('Nome completo ou firma', 'Full name or company name') };
        if (f.name === 'prestadorNuit') return { ...f, legal: l('Necessário para a factura ou recibo e para as retenções na fonte.', 'Needed for the invoice or receipt and for withholding.') };
        if (f.name === 'prestadorMorada') return { ...f, label: l('Morada ou sede', 'Address or registered office') };
        return singularOnly(f);
      },
    ),
    { name: 'prestadorNuel', type: 'text', section: 'prestador', width: 'half', label: l('NUEL', 'Company registration (NUEL)'), showIf: isEmpresa },
    { name: 'prestadorRepresentante', type: 'text', section: 'prestador', width: 'half', label: l('Representante', 'Representative'), showIf: isEmpresa },
    {
      name: 'prestadorRepresentanteCargo',
      type: 'text',
      section: 'prestador',
      width: 'half',
      label: l('Cargo do representante', 'Representative’s position'),
      placeholder: l('Ex.: Sócio-gerente', 'E.g. Managing partner'),
      showIf: isEmpresa,
    },
    {
      name: 'objecto',
      type: 'textarea',
      section: 'servicos',
      rows: 5,
      required: true,
      label: l('Serviços a prestar', 'Services to be provided'),
      help: l('Um serviço ou entregável por linha. Seja concreto.', 'One service or deliverable per line. Be specific.'),
      placeholder: l('Ex.: Elaboração do plano de marketing para 2027\nGestão das redes sociais da empresa', 'E.g. Preparing the 2027 marketing plan\nManaging the company’s social media'),
    },
    {
      name: 'localExecucao',
      type: 'text',
      section: 'servicos',
      label: l('Local de execução (opcional)', 'Place of performance (optional)'),
      placeholder: l('Ex.: nas instalações do prestador e, quando necessário, nas do contratante', 'E.g. at the provider’s premises and, when needed, at the client’s'),
    },
    { name: 'dataInicio', type: 'date', section: 'servicos', width: 'half', required: true, label: l('Data de início', 'Start date'), default: (c) => c.today },
    {
      name: 'dataFim',
      type: 'date',
      section: 'servicos',
      width: 'half',
      label: l('Data de fim (opcional)', 'End date (optional)'),
      help: l('Se ficar vazia, o contrato vigora até à conclusão dos serviços.', 'If empty, the contract lasts until the services are completed.'),
    },
    {
      name: 'renovacao',
      type: 'toggle',
      section: 'servicos',
      default: false,
      label: l('Renovação automática por períodos iguais', 'Automatic renewal for equal periods'),
      showIf: (v) => Boolean(v.dataFim),
    },
    {
      name: 'honorarios',
      type: 'money',
      section: 'honorarios',
      width: 'half',
      required: true,
      label: l('Valor dos honorários', 'Fee amount'),
    },
    {
      name: 'periodicidade',
      type: 'select',
      section: 'honorarios',
      width: 'half',
      default: 'global',
      label: l('O valor é', 'The amount is'),
      options: [
        { value: 'global', label: l('Valor global pelo serviço', 'A fixed total for the service') },
        { value: 'fases', label: l('Valor global pago por fases', 'A fixed total paid in stages') },
        { value: 'mensal', label: l('Avença mensal', 'A monthly retainer') },
        { value: 'hora', label: l('Por hora de trabalho', 'Per hour of work') },
      ],
    },
    {
      name: 'faseamento',
      type: 'textarea',
      section: 'honorarios',
      rows: 3,
      label: l('Fases de pagamento', 'Payment stages'),
      help: l('Uma por linha. Ex.: metade na assinatura do contrato; o restante na entrega do relatório final.', 'One per line. E.g. half on signing; the rest on delivery of the final report.'),
      showIf: (v) => v.periodicidade === 'fases',
    },
    {
      name: 'prazoPagamento',
      type: 'number',
      section: 'honorarios',
      width: 'half',
      min: 0,
      max: 120,
      default: 15,
      label: l('Prazo de pagamento após a factura (dias)', 'Payment term after invoice (days)'),
    },
    {
      name: 'formaPagamento',
      type: 'select',
      section: 'honorarios',
      width: 'half',
      options: FORMA_PAGAMENTO_OPTIONS,
      default: 'transferência bancária',
      label: l('Forma de pagamento', 'Payment method'),
    },
    {
      name: 'despesas',
      type: 'select',
      section: 'honorarios',
      width: 'half',
      default: 'incluidas',
      label: l('Despesas (deslocações, materiais)', 'Expenses (travel, materials)'),
      options: [
        { value: 'incluidas', label: l('Incluídas nos honorários', 'Included in the fee') },
        { value: 'reembolso', label: l('Reembolsadas mediante comprovativo e aprovação prévia', 'Reimbursed against receipts, with prior approval') },
      ],
    },
    {
      name: 'notaFiscal',
      type: 'textarea',
      section: 'honorarios',
      rows: 3,
      label: l('Regime fiscal (IRPS / IVA)', 'Tax treatment (IRPS / VAT)'),
      help: l(
        'Texto livre. Confirme com o seu contabilista se há IVA a acrescer e que retenções se aplicam.',
        'Free text. Check with your accountant whether VAT applies and which withholdings apply.',
      ),
      default:
        'Os honorários são facturados nos termos da legislação fiscal aplicável, acrescendo o IVA quando devido, e sobre eles são efectuadas as retenções na fonte que forem legalmente exigidas, com entrega do respectivo comprovativo.',
    },
    {
      name: 'confidencialidade',
      type: 'toggle',
      section: 'clausulas',
      default: true,
      label: l('Cláusula de confidencialidade', 'Confidentiality clause'),
    },
    {
      name: 'propriedadeIntelectual',
      type: 'toggle',
      section: 'clausulas',
      default: true,
      label: l('Os resultados do trabalho passam a pertencer ao contratante', 'Work results become the client’s property'),
      help: l('Relatórios, desenhos, programas e outros resultados, após o pagamento.', 'Reports, designs, software and other results, after payment.'),
    },
    {
      name: 'avisoPrevio',
      type: 'number',
      section: 'clausulas',
      width: 'half',
      min: 0,
      max: 180,
      default: 30,
      label: l('Aviso prévio para terminar o contrato (dias)', 'Notice to end the contract (days)'),
    },
    {
      name: 'foro',
      type: 'text',
      section: 'clausulas',
      width: 'half',
      label: l('Tribunal competente', 'Competent court'),
      default: (c) => defaultForo(c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo'),
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (money(v.honorarios) == null) {
      w.push({ level: 'warning', field: 'honorarios', message: l('Indique o valor dos honorários.', 'Enter the fee amount.') });
    }
    if (!trim(v.prestadorNuit)) {
      w.push({
        level: 'warning',
        field: 'prestadorNuit',
        message: l('Falta o NUIT do prestador. É necessário para a factura ou recibo e para as retenções na fonte.', 'The provider’s NUIT is missing. It is needed for invoicing and withholding.'),
      });
    }
    if (v.periodicidade === 'mensal' && isSingular(v)) {
      w.push({
        level: 'info',
        field: 'periodicidade',
        message: l(
          'Atenção: pagamento mensal fixo, horário definido e ordens directas são indícios de contrato de trabalho. Se o prestador trabalhar nessas condições, use um contrato de trabalho.',
          'Note: a fixed monthly payment, set hours and direct orders indicate an employment contract. If the provider works like that, use an employment contract.',
        ),
      });
    }
    if (v.dataInicio && v.dataFim && diffDays(v.dataInicio, v.dataFim) < 0) {
      w.push({ level: 'error', field: 'dataFim', message: l('A data de fim é anterior à data de início.', 'The end date is before the start date.') });
    }
    if (isSingular(v) && !trim(v.prestadorDocNumero)) {
      w.push({ level: 'info', field: 'prestadorDocNumero', message: l('Falta o número do documento de identificação do prestador.', 'The provider’s ID number is missing.') });
    }
    if (isEmpresa(v) && !trim(v.prestadorRepresentante)) {
      w.push({ level: 'info', field: 'prestadorRepresentante', message: l('Indique quem representa a empresa prestadora.', 'State who represents the provider company.') });
    }
    if (splitLines(v.objecto).join(' ').length > 0 && splitLines(v.objecto).join(' ').length < 30) {
      w.push({
        level: 'warning',
        field: 'objecto',
        message: l('A descrição dos serviços parece curta. Indique concretamente o que deve ser entregue.', 'The description looks short. State specifically what must be delivered.'),
      });
    }
    return w;
  },

  personName: (v) => v.prestadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const C = contratante(ctx);
    const P = prestador(v);
    const empresa = isEmpresa(v);
    const servicos = splitLines(v.objecto);
    const periodicidade = (v.periodicidade || 'global') as Periodicidade;
    const aviso = num(v.avisoPrevio) ?? 30;
    const prazoPag = num(v.prazoPagamento);

    // Objecto
    let objectoText: string;
    let objectoItems: string[] | undefined;
    if (servicos.length === 1) {
      objectoText = `Pelo presente contrato, ${P.o} obriga-se a prestar ${C.ao} o seguinte serviço: ${lc(servicos[0].replace(/\.$/, ''))}.`;
    } else if (servicos.length > 1) {
      objectoText = `Pelo presente contrato, ${P.o} obriga-se a prestar ${C.ao} os seguintes serviços:`;
      objectoItems = enumerate(servicos);
    } else {
      objectoText = `Pelo presente contrato, ${P.o} obriga-se a prestar ${C.ao} os seguintes serviços: ${BLANK}.`;
    }

    // Execução
    const exec = [
      `1. ${P.O} presta os serviços com autonomia técnica e organizativa, segundo os seus próprios métodos e com os seus próprios meios, obrigando-se a executá-los com diligência, competência e de acordo com as boas práticas profissionais.`,
    ];
    if (trim(v.localExecucao)) exec.push(`2. Os serviços são prestados no seguinte local: ${lc(trim(v.localExecucao).replace(/\.$/, ''))}.`);
    exec.push(
      `${exec.length + 1}. ${C.O} pode dar orientações gerais sobre o resultado pretendido, sem que tal implique qualquer subordinação ${P.do}.`,
      `${exec.length + 2}. ${P.O} informa ${C.o} sobre o andamento dos trabalhos sempre que tal lhe for solicitado e cumpre os prazos de entrega acordados.`,
    );

    // Prazo
    const prazo = v.dataFim
      ? [
          `1. O presente contrato produz efeitos a partir de **${dateLong(v.dataInicio)}** e vigora até **${dateLong(v.dataFim)}**.`,
          v.renovacao
            ? `2. Findo o prazo, o contrato renova-se automaticamente por períodos iguais, salvo se qualquer das partes o denunciar por escrito com a antecedência mínima de ${qty(aviso, 'dia', 'dias')} relativamente ao seu termo.`
            : '',
        ].filter(Boolean)
      : [`O presente contrato produz efeitos a partir de **${dateLong(v.dataInicio)}** e vigora até à conclusão dos serviços contratados.`];

    // Honorários
    const valor = `**${moneyExt(v.honorarios)}**`;
    const honorarioPrincipal: Record<Periodicidade, string> = {
      global: `Pelos serviços objecto do presente contrato, ${C.o} paga ${P.ao} honorários no valor global de ${valor}.`,
      fases: `Pelos serviços objecto do presente contrato, ${C.o} paga ${P.ao} honorários no valor global de ${valor}, pagos por fases, nos termos seguintes:`,
      mensal: `Pelos serviços objecto do presente contrato, ${C.o} paga ${P.ao}, a título de avença, honorários mensais no valor de ${valor}.`,
      hora: `Pelos serviços objecto do presente contrato, ${C.o} paga ${P.ao} honorários à razão de ${valor} por hora de trabalho efectivamente prestado, com base em relatório de horas aprovado ${C.pelo}.`,
    };
    const fases = periodicidade === 'fases' ? splitLines(v.faseamento) : [];
    const hon = [
      `2. O pagamento é efectuado ${prazoPag != null && prazoPag > 0 ? `no prazo de ${qty(prazoPag, 'dia', 'dias')} a contar da recepção da` : 'contra a apresentação da'} respectiva factura ou recibo, ${formaTexto(v.formaPagamento, P.pelo)}.`,
      trim(v.notaFiscal) ? `3. ${trim(v.notaFiscal).replace(/\s*\n\s*/g, ' ').replace(/([^.])$/, '$1.')}` : '',
      v.despesas === 'reembolso'
        ? `${trim(v.notaFiscal) ? 4 : 3}. As despesas de deslocação, alojamento e materiais necessárias à execução dos serviços são reembolsadas ${C.pelo}, desde que previamente aprovadas por escrito e documentadas com os respectivos comprovativos.`
        : `${trim(v.notaFiscal) ? 4 : 3}. O valor acordado inclui todas as despesas em que ${P.o} incorra na execução dos serviços, nada mais sendo devido a esse título.`,
    ].filter(Boolean);
    // Payment stages are printed as a) b) lines right after the amount, before the other numbers.
    const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
    const faseLines = enumerate(fases).map((f, i) => `${ALPHA[i] ?? '-'}) ${f}`);
    const principal = honorarioPrincipal[periodicidade === 'fases' && !fases.length ? 'global' : periodicidade];
    const honText = [`1. ${principal}`, ...faseLines, ...hon].join('\n');

    // Independência
    const indep = [
      `1. O presente contrato é celebrado como contrato de prestação de serviços, nos termos ${doCite('codigoCivilPrestacaoServicos')}, e não constitui nem pode ser interpretado como contrato de trabalho.`,
      `2. ${P.O} não está ${P.a('sujeito', 'sujeita')} à autoridade, à direcção nem ao poder disciplinar ${C.do}, não tem horário de trabalho fixado por esta e organiza livremente o seu tempo, sem prejuízo dos prazos e das reuniões acordados.`,
      `3. ${P.O} pode prestar serviços a terceiros, desde que tal não prejudique o cumprimento do presente contrato${v.confidencialidade ? ' nem a obrigação de confidencialidade' : ''}.`,
      `4. É da exclusiva responsabilidade ${P.do} o cumprimento das suas obrigações fiscais e, quando aplicável, de segurança social${
        empresa ? ', bem como de todas as obrigações legais relativas ao pessoal que afecte à execução dos serviços, o qual fica exclusivamente sob a sua direcção' : ''
      }.`,
      '5. Os honorários constituem a única contrapartida pelos serviços prestados, não sendo devida qualquer outra prestação.',
    ];

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: objectoText,
        items: objectoItems,
        en: `The Provider shall provide the Client with the following services: ${servicos.join('; ') || '—'}.`,
      },
      {
        id: 'execucao',
        heading: 'Execução dos serviços',
        text: exec.join('\n'),
        en: `The Provider performs the services with technical and organisational autonomy, using its own methods and means, with diligence and in line with good professional practice.${
          trim(v.localExecucao) ? ` Place: ${v.localExecucao}.` : ''
        } The Client may give general guidance on the expected result without creating subordination. The Provider reports on progress on request and meets agreed deadlines.`,
      },
      {
        id: 'prazo',
        heading: 'Prazo',
        text: prazo.join('\n'),
        en: v.dataFim
          ? `The contract runs from ${v.dataInicio || '—'} to ${v.dataFim}.${v.renovacao ? ` It renews automatically for equal periods unless either party gives ${aviso} days’ written notice.` : ''}`
          : `The contract runs from ${v.dataInicio || '—'} until the services are completed.`,
      },
      {
        id: 'honorarios',
        heading: 'Honorários e pagamento',
        text: honText,
        en: `Fees: ${formatMoney(money(v.honorarios))} (${periodicidade}). Paid ${prazoPag ? `within ${prazoPag} days of` : 'on'} the invoice or receipt, by ${v.formaPagamento || 'bank transfer'}. ${trim(v.notaFiscal) ? 'Tax treatment as stated. ' : ''}${
          v.despesas === 'reembolso' ? 'Pre-approved, documented expenses are reimbursed.' : 'Fees include all expenses.'
        }`,
      },
      {
        id: 'independencia',
        heading: 'Inexistência de relação de trabalho',
        text: indep.join('\n'),
        en: 'This is a contract for services under the Civil Code, not an employment contract. The Provider is not subject to the Client’s authority, direction or disciplinary power, has no set working hours and may work for others. The Provider is solely responsible for its own tax and social security obligations (and, for a company, for its staff). The fees are the only consideration due.',
      },
      {
        id: 'obrigacoesContratante',
        heading: `Obrigações ${C.do}`,
        text: `${C.O} obriga-se a pagar pontualmente os honorários e a disponibilizar ${P.ao}, em tempo útil, a informação, os documentos e o acesso necessários à execução dos serviços.`,
        en: 'The Client shall pay the fees on time and provide, in good time, the information, documents and access needed for the services.',
      },
    ];

    if (v.confidencialidade) {
      clauses.push({
        id: 'confidencialidade',
        heading: 'Confidencialidade',
        text: [
          `1. ${P.O} obriga-se a guardar sigilo sobre toda a informação ${C.do} a que tenha acesso no âmbito do presente contrato, não a divulgando a terceiros nem a utilizando para fins diferentes da execução dos serviços${
            empresa ? ', e a impor a mesma obrigação ao pessoal e aos subcontratados de que se sirva' : ''
          }.`,
          '2. Esta obrigação mantém-se após a cessação do contrato, enquanto a informação não se tornar do domínio público.',
        ].join('\n'),
        en: 'The Provider keeps confidential all of the Client’s information obtained under this contract and uses it only to perform the services. This continues after the contract ends, while the information is not public.',
      });
    }
    if (v.propriedadeIntelectual) {
      clauses.push({
        id: 'propriedade',
        heading: 'Propriedade dos resultados',
        text: [
          `1. Os direitos patrimoniais sobre os documentos, relatórios, desenhos, programas e demais resultados produzidos no âmbito do presente contrato transmitem-se para ${C.o} com o pagamento integral dos honorários correspondentes.`,
          `2. ${P.O} garante que os resultados não violam direitos de terceiros.`,
          `3. ${P.O} mantém a titularidade dos conhecimentos, métodos e ferramentas que já detinha, concedendo ${C.ao} o direito de os utilizar na medida necessária ao aproveitamento dos resultados.`,
        ].join('\n'),
        en: 'Economic rights in all results transfer to the Client upon full payment. The Provider warrants that results do not infringe third-party rights and keeps its pre-existing know-how and tools, licensing their use as needed to exploit the results.',
      });
    }

    clauses.push(
      {
        id: 'cessacao',
        heading: 'Cessação',
        text: [
          `1. Qualquer das partes pode denunciar o presente contrato, a todo o tempo, mediante comunicação escrita à outra com a antecedência mínima de ${qty(aviso, 'dia', 'dias')}.`,
          '2. Qualquer das partes pode resolver o contrato, com efeitos imediatos, em caso de incumprimento grave da outra que não seja sanado no prazo razoável fixado em interpelação escrita.',
          `3. Em caso de cessação, são devidos os honorários correspondentes aos serviços efectivamente prestados até essa data, e ${P.o} entrega ${C.ao} os trabalhos realizados e os documentos que lhe pertençam.`,
        ].join('\n'),
        en: `1. Either party may end the contract at any time with ${aviso} days’ written notice. 2. Either party may terminate immediately for serious breach not remedied within the reasonable period set in a written notice. 3. On termination, fees for services actually performed are due and the Provider hands over the work done and the Client’s documents.`,
      },
      {
        id: 'finais',
        heading: 'Disposições finais',
        text: [
          '1. Qualquer alteração ao presente contrato só é válida se constar de documento escrito assinado por ambas as partes.',
          `2. ${P.O} não pode ceder a sua posição contratual nem subcontratar os serviços sem autorização prévia e escrita ${C.do}.`,
          '3. As comunicações entre as partes são feitas por escrito, para os endereços indicados no presente contrato.',
        ].join('\n'),
        en: '1. Amendments only in writing signed by both parties. 2. The Provider may not assign the contract or subcontract without prior written consent. 3. Notices are given in writing to the addresses stated in this contract.',
      },
      {
        id: 'foro',
        heading: 'Lei aplicável e foro',
        text: [
          '1. O presente contrato rege-se pela lei moçambicana.',
          `2. Para a resolução de quaisquer litígios emergentes do presente contrato, as partes elegem o foro do ${trim(v.foro) || BLANK}, com expressa renúncia a qualquer outro.`,
        ].join('\n'),
        en: `1. Mozambican law applies. 2. Disputes go to the ${v.foro || 'competent court'}, to the exclusion of any other.`,
      },
    );

    const prestadorParty = empresa ? prestadorEmpresaParty(v, P.n) : workerParty(v, P.n, 'prestador');
    const prestadorSig = empresa
      ? {
          role: P.O,
          name: trim(v.prestadorRepresentante) || trim(v.prestadorNome) || undefined,
          detail: trim(v.prestadorRepresentante) ? [trim(v.prestadorRepresentanteCargo), trim(v.prestadorNome)].filter(Boolean).join(', ') : undefined,
        }
      : { role: P.O, name: trim(v.prestadorNome) || undefined };

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de prestação de serviços', subtitle: v.ref ? `N.º ${v.ref}` : undefined },
      { type: 'paragraph', id: 'entre', text: '**Entre:**', align: 'left', editable: false },
      { type: 'paragraph', id: 'parteContratante', text: `${employerParty(ctx, 'Contratante')};`, en: 'The client identified above (the “Client”);' },
      { type: 'paragraph', id: 'e', text: '**e**', align: 'left', editable: false },
      { type: 'paragraph', id: 'partePrestador', text: `${prestadorParty};`, en: 'The service provider identified above (the “Provider”);' },
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'É celebrado, de boa-fé, o presente contrato de prestação de serviços, que se rege pelas cláusulas seguintes:',
        en: 'This contract for services is entered into in good faith and is governed by the following clauses:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      {
        type: 'paragraph',
        id: 'exemplares',
        text: 'O presente contrato é feito em dois exemplares de igual valor, ficando um em poder de cada uma das partes.',
        en: 'This contract is made in two counterparts of equal value, one for each party.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [employerSignature(ctx, C.O), prestadorSig],
      },
    ];
    return blocks;
  },
});
