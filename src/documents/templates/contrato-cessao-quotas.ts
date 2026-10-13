// Contrato de cessão de quota: a member sells all or part of a quota, with the
// company intervening to acknowledge it and undertake the registration.
import { defineTemplate, type Block, type ClauseItem, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, FORMA_PAGAMENTO_OPTIONS, isF, l, localField, money } from './_shared';
import {
  companyColumns, isEmpresa, numerar, parte, parteFields, parteNome, parteSignature, pct, quantos, comReconhecimento, representadaPor, representantes,
  REPRESENTANTE_COLUMNS, representantesDefault, semPonto, signatureRows, sociedadeFields, sociedadeIdent, sociedadeNome, str, valorTexto,
} from './_sociedades';

const papel = (v: Values, p: string, m: string, f: string) => (!isEmpresa(v, p) && isF(v[`${p}Genero`]) ? f : m);

export default defineTemplate({
  id: 'contrato-cessao-quotas',
  family: 'contrato',
  official: 'registo',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'cedente', title: l('Cedente (quem vende a quota)', 'Transferor (seller)'), personRole: 'outro' },
    { id: 'cessionario', title: l('Cessionário (quem compra)', 'Transferee (buyer)'), personRole: 'outro' },
    { id: 'sociedade', title: l('Sociedade', 'Company'), description: l('A sociedade cujas quotas são cedidas. Intervém para tomar conhecimento e promover o registo.', 'The company whose quota is transferred. It intervenes to acknowledge and register.') },
    { id: 'quota', title: l('Quota e preço', 'Quota and price') },
    { id: 'condicoes', title: l('Consentimento e outras condições', 'Consent and other terms') },
    { id: 'final', title: l('Disposições finais', 'Final provisions') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data de assinatura', 'Signing date')),
    ...parteFields('cedente', 'cedente'),
    ...parteFields('cessionario', 'cessionario'),
    ...sociedadeFields('sociedade', { tipo: false }),
    {
      name: 'representantes',
      type: 'lines',
      section: 'sociedade',
      label: l('Quem assina pela sociedade', 'Who signs for the company'),
      help: l('Os gerentes que obrigam a sociedade, segundo o contrato de sociedade.', 'The managers who bind the company under its articles.'),
      addLabel: l('Adicionar', 'Add'),
      columns: REPRESENTANTE_COLUMNS,
      default: representantesDefault,
    },
    { name: 'quotaCedente', type: 'money', section: 'quota', width: 'half', required: true, label: l('Quota do cedente (valor nominal, MT)', 'Transferor’s quota (nominal, MT)') },
    {
      name: 'tipoCessao',
      type: 'radio',
      section: 'quota',
      label: l('Cede', 'Transfers'),
      options: [
        { value: 'total', label: l('Toda a quota', 'The whole quota') },
        { value: 'parcial', label: l('Parte da quota (divisão)', 'Part of the quota (division)') },
      ],
      default: 'total',
    },
    { name: 'valorCedido', type: 'money', section: 'quota', width: 'half', label: l('Valor nominal cedido (MT)', 'Nominal value transferred (MT)'), showIf: (v) => v.tipoCessao === 'parcial' },
    { name: 'preco', type: 'money', section: 'quota', width: 'half', required: true, label: l('Preço da cessão (MT)', 'Price (MT)') },
    {
      name: 'pagamento',
      type: 'select',
      section: 'quota',
      width: 'half',
      label: l('Pagamento do preço', 'Payment of the price'),
      options: [
        { value: 'pago', label: l('Pago na assinatura (quitação)', 'Paid on signing (receipt)') },
        { value: 'data', label: l('Pago até uma data', 'Paid by a date') },
        { value: 'prestacoes', label: l('Em prestações', 'In instalments') },
      ],
      default: 'pago',
    },
    { name: 'formaPagamento', type: 'select', section: 'quota', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    { name: 'dataPagamento', type: 'date', section: 'quota', width: 'half', label: l('Data limite de pagamento', 'Payment deadline'), showIf: (v) => v.pagamento === 'data' },
    {
      name: 'prestacoesDescricao',
      type: 'textarea',
      section: 'quota',
      rows: 2,
      label: l('Prestações', 'Instalments'),
      placeholder: l('Ex.: três prestações mensais de 100.000,00 MT, vencendo-se a primeira em 30 de Novembro de 2026', 'E.g. three monthly instalments of…, the first due on…'),
      showIf: (v) => v.pagamento === 'prestacoes',
    },
    {
      name: 'consentimento',
      type: 'select',
      section: 'condicoes',
      label: l('Consentimento da sociedade', 'Company consent'),
      options: [
        { value: 'deliberacao', label: l('Dado por deliberação dos sócios', 'Given by members’ resolution') },
        { value: 'entreSocios', label: l('Cessão entre sócios (livre)', 'Transfer between members (free)') },
        { value: 'nesteActo', label: l('Dado neste contrato pela sociedade', 'Given in this contract by the company') },
      ],
      default: 'deliberacao',
    },
    { name: 'dataDeliberacao', type: 'date', section: 'condicoes', width: 'half', label: l('Data da deliberação', 'Date of the resolution'), showIf: (v) => v.consentimento === 'deliberacao' },
    {
      name: 'suprimentos',
      type: 'toggle',
      section: 'condicoes',
      label: l('Ceder também o crédito de suprimentos', 'Also assign the shareholder loan'),
      help: l('O dinheiro que o cedente emprestou à sociedade passa para o cessionário.', 'Money the transferor lent the company passes to the transferee.'),
    },
    { name: 'suprimentosValor', type: 'money', section: 'condicoes', width: 'half', label: l('Valor dos suprimentos (MT)', 'Loan amount (MT)'), showIf: (v) => Boolean(v.suprimentos) },
    {
      name: 'suprimentosPreco',
      type: 'select',
      section: 'condicoes',
      width: 'half',
      label: l('Preço dos suprimentos', 'Price of the loan'),
      options: [
        { value: 'incluido', label: l('Incluído no preço da quota', 'Included in the price') },
        { value: 'igual', label: l('Pelo seu valor nominal, além do preço', 'At face value, on top of the price') },
      ],
      default: 'incluido',
      showIf: (v) => Boolean(v.suprimentos),
    },
    { name: 'cedenteGerente', type: 'toggle', section: 'condicoes', label: l('O cedente era gerente e renuncia ao cargo', 'The transferor was a manager and resigns') },
    {
      name: 'artigoCapital',
      type: 'text',
      section: 'condicoes',
      width: 'half',
      label: l('Artigo do contrato sobre o capital', 'Article on the capital'),
      placeholder: l('Ex.: quinto', 'E.g. fifth'),
    },
    {
      name: 'novaRedaccao',
      type: 'textarea',
      section: 'condicoes',
      rows: 4,
      label: l('Nova redacção do artigo do capital', 'New wording of the capital article'),
      help: l('Como o artigo fica depois da cessão, com as quotas de cada sócio.', 'How the article reads after the transfer, with each member’s quota.'),
      placeholder: l('Ex.: O capital social, integralmente subscrito e realizado em dinheiro, é de 500.000,00 MT, correspondente à soma de duas quotas…', 'E.g. The share capital… is divided into two quotas…'),
    },
    {
      name: 'despesas',
      type: 'select',
      section: 'final',
      width: 'half',
      label: l('Despesas de reconhecimento, registo e publicação', 'Notary, registration and publication costs'),
      options: [
        { value: 'cessionario', label: l('Cessionário', 'Transferee') },
        { value: 'cedente', label: l('Cedente', 'Transferor') },
        { value: 'iguais', label: l('Em partes iguais', 'Shared equally') },
        { value: 'sociedade', label: l('Sociedade', 'Company') },
      ],
      default: 'cessionario',
    },
    { name: 'foro', type: 'text', section: 'final', width: 'half', label: l('Tribunal competente', 'Competent court'), default: 'Tribunal Judicial da Cidade de Maputo' },
    {
      name: 'conjuge',
      type: 'toggle',
      section: 'final',
      label: l('Consentimento do cônjuge do cedente', 'Consent of the transferor’s spouse'),
      help: l('Quando a quota é bem comum do casal.', 'When the quota is joint marital property.'),
      showIf: (v) => !isEmpresa(v, 'cedente'),
    },
    { name: 'conjugeNome', type: 'text', section: 'final', label: l('Nome do cônjuge', 'Spouse’s name'), showIf: (v) => Boolean(v.conjuge) && !isEmpresa(v, 'cedente') },
    {
      name: 'reconhecimento',
      type: 'toggle',
      section: 'final',
      default: true,
      label: l('Espaço para o reconhecimento notarial', 'Space for notarial recognition'),
      legal: l('A Conservatória exige, para o registo, as assinaturas reconhecidas.', 'The registry requires certified signatures for registration.'),
    },
  ],

  personName: (v) => parteNome(v, 'cessionario') || undefined,
  documentDate: (v) => v.data,

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const quota = money(v.quotaCedente);
    const cedido = v.tipoCessao === 'parcial' ? money(v.valorCedido) : quota;
    if (v.tipoCessao === 'parcial' && quota != null && cedido != null && cedido >= quota) {
      w.push({ level: 'error', field: 'valorCedido', message: l('Na cessão parcial, o valor cedido tem de ser inferior à quota do cedente.', 'In a partial transfer the value transferred must be less than the quota.') });
    }
    if (v.tipoCessao === 'parcial') {
      w.push({ level: 'info', field: 'tipoCessao', message: l('A divisão de quotas depende do consentimento da assembleia geral.', 'Dividing a quota needs the general meeting’s consent.') });
    }
    if (v.consentimento !== 'entreSocios') {
      w.push({ level: 'info', field: 'consentimento', message: l(`Verifique o contrato de sociedade: a cessão a terceiros depende normalmente do consentimento da sociedade, e a sociedade e os sócios têm direito de preferência (${cite('transmissaoQuotas')}). Sem isso a cessão pode levar à exclusão do sócio.`, 'Check the articles: transfers to third parties usually need company consent and the company and members have pre-emption rights.') });
    }
    w.push(
      {
        level: 'info',
        message: l(
          `Registo: a cessão é ineficaz perante a sociedade enquanto não lhe for comunicada por escrito e registada. Requeira o registo na Conservatória do Registo das Entidades Legais no prazo de ${quantos(ctx.legal.value<number>('registoEntidadesPrazo'), 'dia', 'dias')}, com o texto actualizado do contrato de sociedade.`,
          `Registration: the transfer has no effect on the company until notified in writing and registered. Register within ${ctx.legal.value<number>('registoEntidadesPrazo')} days with the updated articles.`,
        ),
      },
      {
        level: 'info',
        message: l(
          `Beneficiário efectivo: a alteração dos sócios obriga a actualizar a declaração do beneficiário efectivo no prazo de ${quantos(ctx.legal.value<number>('beneficiarioEfectivoSociedade'), 'dia', 'dias')} (${cite('beneficiarioEfectivoSociedade')}).`,
          'Beneficial owner: the change of members requires an updated beneficial owner declaration.',
        ),
      },
      {
        level: 'info',
        message: l(
          'Impostos: a mais-valia do cedente é tributada em IRPS ou IRPC; pode haver imposto do selo e, se a sociedade tiver imóveis, SISA. Confirme junto da Autoridade Tributária.',
          'Tax: the transferor’s gain is taxed (IRPS or IRPC); stamp duty and, if the company owns real estate, SISA may apply. Check with the Tax Authority.',
        ),
      },
    );
    if (!str(v.novaRedaccao)) {
      w.push({ level: 'warning', field: 'novaRedaccao', message: l('Escreva a nova redacção do artigo do capital: a Conservatória regista a alteração do contrato de sociedade.', 'Write the new wording of the capital article: the registry records the amendment.') });
    }
    return w;
  },

  blocks: (ctx) => {
    const v = ctx.values;
    const Ced = papel(v, 'cedente', 'Cedente', 'Cedente');
    const Ces = papel(v, 'cessionario', 'Cessionário', 'Cessionária');
    const oCed = `${!isEmpresa(v, 'cedente') && isF(v.cedenteGenero) ? 'a' : 'o'} ${Ced}`;
    const oCes = `${!isEmpresa(v, 'cessionario') && isF(v.cessionarioGenero) ? 'a' : 'o'} ${Ces}`;
    const OCed = oCed.charAt(0).toUpperCase() + oCed.slice(1);
    const OCes = oCes.charAt(0).toUpperCase() + oCes.slice(1);
    const aoCes = oCes.replace(/^o /, 'ao ').replace(/^a /, 'à ');
    const doCed = oCed.replace(/^o /, 'do ').replace(/^a /, 'da ');
    const capital = money(v.sociedadeCapital);
    const quota = money(v.quotaCedente);
    const parcial = v.tipoCessao === 'parcial';
    const cedido = parcial ? money(v.valorCedido) : quota;
    const resto = parcial && quota != null && cedido != null ? quota - cedido : null;
    const reps = representantes(v.representantes);

    const consid = [
      `a) ${OCed} é titular de uma quota com o valor nominal de ${valorTexto(v.quotaCedente, false)}, correspondente a ${pct(quota, capital)} do capital social da Sociedade;`,
      v.consentimento === 'deliberacao'
        ? `b) Por deliberação dos sócios de ${dateLong(v.dataDeliberacao)}, a Sociedade consentiu na presente cessão, tendo a Sociedade e os demais sócios renunciado ao direito de preferência;`
        : v.consentimento === 'entreSocios'
          ? `b) ${OCes} é ${!isEmpresa(v, 'cessionario') && isF(v.cessionarioGenero) ? 'sócia' : 'sócio'} da Sociedade, sendo a cessão de quotas entre sócios livre nos termos do contrato de sociedade;`
          : 'b) A Sociedade, pelo presente contrato, consente na cessão e renuncia ao direito de preferência, o mesmo fazendo os demais sócios que, querendo, o assinam;',
    ];

    const pagamento =
      v.pagamento === 'prestacoes'
        ? `O preço é pago ${semPonto(v.prestacoesDescricao) || BLANK}, por ${v.formaPagamento || 'transferência bancária'}.`
        : v.pagamento === 'data'
          ? `O preço é pago até ${dateLong(v.dataPagamento)}, por ${v.formaPagamento || 'transferência bancária'}.`
          : `O preço é pago nesta data, por ${v.formaPagamento || 'transferência bancária'}, dando ${oCed} a respectiva quitação com a assinatura do presente contrato.`;

    const despesas: Record<string, string> = {
      cessionario: `pel${oCes.startsWith('a ') ? 'a' : 'o'} ${Ces}`,
      cedente: `pel${oCed.startsWith('a ') ? 'a' : 'o'} ${Ced}`,
      iguais: `pel${oCed.startsWith('a ') ? 'a' : 'o'} ${Ced} e pel${oCes.startsWith('a ') ? 'a' : 'o'} ${Ces}, em partes iguais`,
      sociedade: 'pela Sociedade',
    };

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: parcial
          ? `Pelo presente contrato, ${oCed} divide a sua quota em duas, uma com o valor nominal de ${valorTexto(v.valorCedido, false)} e outra com o valor nominal de ${resto != null ? valorTexto(resto, false) : `${BLANK} MT`}, e cede a primeira ${aoCes}, livre de quaisquer ónus ou encargos, com todos os direitos e obrigações a ela inerentes, ficando com a segunda.`
          : `Pelo presente contrato, ${oCed} cede ${aoCes} a totalidade da sua quota, livre de quaisquer ónus ou encargos, com todos os direitos e obrigações a ela inerentes, e ${oCes} aceita a cessão.`,
        en: parcial ? 'The transferor divides the quota and transfers the part stated to the transferee, free of encumbrances, keeping the rest.' : 'The transferor transfers the whole quota to the transferee, free of encumbrances, with all rights and duties attached.',
      },
      {
        id: 'preco',
        heading: 'Preço',
        text: numerar([`O preço da cessão é de ${valorTexto(v.preco)}.`, pagamento]),
        en: `The price is ${money(v.preco) ?? '—'} MT, ${v.pagamento === 'pago' ? 'paid on signing' : v.pagamento === 'data' ? 'payable by the date stated' : 'payable in instalments'}.`,
      },
      {
        id: 'declaracoes',
        heading: `Declarações ${doCed}`,
        text: `${OCed} declara que a quota cedida se encontra integralmente realizada, que é livre de penhoras, ónus ou encargos, que não existem prestações suplementares em dívida e que não tem conhecimento de dívidas da Sociedade que não constem da sua contabilidade.`,
        en: 'The transferor declares the quota is fully paid, free of encumbrances, with no supplementary contributions owed and no undisclosed company debts known.',
      },
    ];
    if (v.suprimentos) {
      clauses.push({
        id: 'suprimentos',
        heading: 'Suprimentos',
        text: `Juntamente com a quota, ${oCed} cede ${aoCes} o crédito de suprimentos que detém sobre a Sociedade, no montante de ${valorTexto(v.suprimentosValor, false)}, ${v.suprimentosPreco === 'igual' ? 'pelo seu valor nominal, que acresce ao preço da cessão' : 'cujo valor se encontra incluído no preço da cessão'}.`,
        en: 'The transferor also assigns the shareholder loan to the transferee, as stated.',
      });
    }
    if (v.cedenteGerente) {
      clauses.push({
        id: 'gerencia',
        heading: 'Gerência',
        text: `${OCed} renuncia, com efeitos na presente data, ao cargo de gerente da Sociedade, de cujo exercício a Sociedade lhe dá quitação.`,
        en: 'The transferor resigns as manager of the company as of today and is released.',
      });
    }
    clauses.push(
      {
        id: 'intervencao',
        heading: 'Intervenção da Sociedade',
        text: 'A Sociedade declara tomar conhecimento da presente cessão, que considera eficaz em relação a si a partir desta data, e obriga-se a promover o respectivo registo.',
        en: 'The company acknowledges the transfer, treats it as effective towards it from today and will register it.',
      },
      {
        id: 'alteracao',
        heading: 'Alteração do contrato de sociedade e registo',
        text: numerar([
          `Em consequência da presente cessão, o artigo ${semPonto(v.artigoCapital) || '______'} do contrato de sociedade passa a ter a seguinte redacção: «${semPonto(v.novaRedaccao) ? `${semPonto(v.novaRedaccao)}.` : BLANK}»`,
          `As partes obrigam-se a requerer o registo da cessão na Conservatória do Registo das Entidades Legais no prazo de ${quantos(ctx.legal.value<number>('registoEntidadesPrazo'), 'dia', 'dias')}.`,
        ]),
        en: 'The capital article of the articles is amended as worded; the parties will apply for registration within the legal period.',
      },
      {
        id: 'despesas',
        heading: 'Despesas',
        text: `As despesas com o reconhecimento das assinaturas, o registo e a publicação são suportadas ${despesas[v.despesas] ?? despesas.cessionario}.`,
        en: 'Notary, registration and publication costs are borne as stated.',
      },
      {
        id: 'lei',
        heading: 'Lei aplicável e foro',
        text: `O presente contrato rege-se pela lei moçambicana. Para dirimir quaisquer litígios dele emergentes, as partes elegem o foro do ${semPonto(v.foro) || 'tribunal competente'}, com expressa renúncia a qualquer outro.`,
        en: 'Mozambican law applies; disputes go to the court named.',
      },
    );

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de Cessão de Quota', subtitle: sociedadeNome(v) },
      { type: 'paragraph', id: 'parteCedente', text: `Entre:\n${parte(v, 'cedente', Ced)};`, en: 'Between the transferor, identified above;' },
      { type: 'paragraph', id: 'parteCessionario', text: `${parte(v, 'cessionario', Ces)};`, en: 'the transferee, identified above;' },
      {
        type: 'paragraph',
        id: 'parteSociedade',
        text: `e, como interveniente, ${sociedadeIdent(v)}, ${representadaPor(reps)}, adiante designada por **Sociedade**;`,
        en: 'and, intervening, the company identified above;',
      },
      { type: 'paragraph', id: 'considerandos', text: `Considerando que:\n${consid.join('\n')}`, en: 'Whereas the transferor holds the quota stated and the transfer has the required consent;' },
      { type: 'paragraph', id: 'celebracao', text: 'é celebrado o presente contrato de cessão de quota, que se rege pelas cláusulas seguintes:', en: 'this quota transfer agreement is entered into on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      {
        type: 'paragraph',
        id: 'feito',
        text: `Feito em ${ctx.place}, a ${dateLong(v.data)}, em três exemplares de igual teor e valor, que vão ser assinados e rubricados pelas partes.`,
        en: 'Made in three copies of equal value, signed and initialled by the parties.',
        keepWithNext: true,
      },
    ];
    const cols: SignatureColumn[] = [parteSignature(v, 'cedente', OCed), parteSignature(v, 'cessionario', OCes), ...companyColumns(ctx, reps)];
    blocks.push(...signatureRows(cols));
    if (v.conjuge && !isEmpresa(v, 'cedente')) {
      blocks.push(
        {
          type: 'paragraph',
          id: 'conjuge',
          text: `${isF(v.cedenteGenero) ? 'O cônjuge da Cedente' : 'O cônjuge do Cedente'}, **${str(v.conjugeNome) || BLANK}**, declara dar o seu consentimento à presente cessão.`,
          en: 'The transferor’s spouse consents to this transfer.',
          keepWithNext: true,
        },
        { type: 'signatures', columns: [{ role: 'O Cônjuge', name: str(v.conjugeNome) || undefined }] },
      );
    }
    if (v.reconhecimento) comReconhecimento(blocks);
    return blocks;
  },
});
