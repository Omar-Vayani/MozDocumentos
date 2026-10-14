import { formatPercent } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type SignatureColumn, type TemplateContext, type Warning } from '../model';
import { BLANK, cite, dateField, employerParty, formatMoney, isF, l, lawyerFields, localField, money, placeDate, refField } from './_shared';
import { isEmpresa, moneyExt, papel, partyDesc, partyFields } from './_advocacia';

// ---------------------------------------------------------------- Local helpers

const trim = (s: unknown) => String(s ?? '').trim();

const MODALIDADE_OPTIONS = [
  { value: 'fixo', label: l('Valor fixo pelo assunto', 'Fixed fee for the matter') },
  { value: 'hora', label: l('Por hora de trabalho', 'Hourly rate') },
  { value: 'avenca', label: l('Avença mensal', 'Monthly retainer') },
  { value: 'misto', label: l('Valor fixo + prémio de sucesso', 'Fixed fee + success fee') },
];

/** The lawyer's or firm's designation and party paragraph. */
function advogadoParte(ctx: TemplateContext): { designacao: string; texto: string; sociedade: boolean } {
  const v = ctx.values;
  const sociedade = ctx.profile?.kind === 'empresa';
  if (sociedade) {
    const designacao = 'Sociedade';
    return { designacao, sociedade, texto: employerParty(ctx, designacao) };
  }
  const f = isF(v.advogadoGenero);
  const designacao = f ? 'Advogada' : 'Advogado';
  const nuit = ctx.profile?.nuit ? `, NUIT ${ctx.profile.nuit}` : '';
  return {
    designacao,
    sociedade,
    texto: `**${trim(v.advogadoNome) || BLANK}**, ${f ? 'Advogada inscrita' : 'Advogado inscrito'} na Ordem dos Advogados de Moçambique, titular da Carteira Profissional n.º ${trim(v.advogadoCarteira) || '________'}${nuit}, com domicílio profissional em ${trim(v.advogadoDomicilio) || BLANK}, adiante ${f ? 'designada' : 'designado'} por **${designacao}**`,
  };
}

export default defineTemplate({
  id: 'contrato-de-honorarios',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Referência, local e data', 'Reference, place and date') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'cliente', title: l('Cliente', 'Client'), personRole: 'cliente' },
    { id: 'objecto', title: l('Serviços', 'Services') },
    { id: 'honorarios', title: l('Honorários e provisão', 'Fees and advance') },
    { id: 'condicoes', title: l('Despesas, pagamento e foro', 'Expenses, payment and jurisdiction') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    ...lawyerFields('advogado'),
    ...partyFields('cliente', 'cliente', { defaultTipo: 'empresa' }),
    {
      name: 'objecto',
      type: 'textarea',
      section: 'objecto',
      rows: 3,
      required: true,
      label: l('Serviços a prestar', 'Services to be provided'),
      placeholder: l(
        'Ex.: patrocínio forense na acção de cobrança a propor contra Sol Nascente Imobiliária, Lda, no Tribunal Judicial da Cidade de Maputo, até decisão final em primeira instância',
        'E.g. representation in the debt claim against … until first-instance judgment',
      ),
      help: l('Completa «…prestar ao Cliente os seguintes serviços jurídicos: …».', 'Completes “…provide the client with the following legal services: …”.'),
    },
    {
      name: 'exclusoes',
      type: 'text',
      section: 'objecto',
      label: l('Não incluído (opcional)', 'Not included (optional)'),
      default: 'recursos para tribunais superiores, incidentes autónomos, acções executivas e processos conexos',
    },
    { name: 'modalidade', type: 'select', section: 'honorarios', required: true, label: l('Modalidade', 'Fee basis'), options: MODALIDADE_OPTIONS, default: 'fixo' },
    { name: 'valorFixo', type: 'money', section: 'honorarios', width: 'half', label: l('Honorários fixos', 'Fixed fee'), showIf: (v) => v.modalidade === 'fixo' || v.modalidade === 'misto' },
    { name: 'taxaHora', type: 'money', section: 'honorarios', width: 'half', label: l('Valor por hora', 'Hourly rate'), showIf: (v) => v.modalidade === 'hora' },
    { name: 'estimativaHoras', type: 'number', section: 'honorarios', width: 'half', min: 0, max: 5000, label: l('Estimativa de horas (opcional)', 'Estimated hours (optional)'), showIf: (v) => v.modalidade === 'hora' },
    { name: 'avencaMensal', type: 'money', section: 'honorarios', width: 'half', label: l('Avença mensal', 'Monthly retainer'), showIf: (v) => v.modalidade === 'avenca' },
    {
      name: 'avencaInclui',
      type: 'text',
      section: 'honorarios',
      label: l('A avença inclui', 'The retainer covers'),
      placeholder: l('Ex.: até dez horas mensais de consultoria jurídica e revisão de contratos', 'E.g. up to ten hours a month of legal advice'),
      showIf: (v) => v.modalidade === 'avenca',
    },
    { name: 'sucessoValor', type: 'money', section: 'honorarios', width: 'half', label: l('Prémio de sucesso (valor fixo)', 'Success fee (fixed amount)'), showIf: (v) => v.modalidade === 'misto' },
    {
      name: 'sucessoPercentagem',
      type: 'number',
      section: 'honorarios',
      width: 'half',
      min: 0,
      max: 50,
      label: l('ou % do valor da causa', 'or % of the value of the case'),
      help: l('Calculado sobre o valor da causa, nunca sobre o montante obtido (quota litis é proibida).', 'Calculated on the value of the case, never on the amount obtained (contingency fees are banned).'),
      showIf: (v) => v.modalidade === 'misto',
    },
    { name: 'valorCausa', type: 'money', section: 'honorarios', width: 'half', label: l('Valor da causa (opcional)', 'Value of the case (optional)'), showIf: (v) => v.modalidade === 'misto' },
    { name: 'provisao', type: 'money', section: 'honorarios', width: 'half', label: l('Provisão inicial (opcional)', 'Initial advance (optional)'), help: l('Quantia paga à cabeça por conta dos honorários.', 'Amount paid upfront on account of fees.') },
    {
      name: 'despesas',
      type: 'radio',
      section: 'condicoes',
      label: l('Despesas (custas, certidões, deslocações)', 'Expenses (court fees, certificates, travel)'),
      default: 'adiantamento',
      options: [
        { value: 'adiantamento', label: l('O cliente adianta os valores', 'The client pays them in advance') },
        { value: 'reembolso', label: l('O advogado paga e o cliente reembolsa', 'The lawyer pays and the client reimburses') },
      ],
    },
    { name: 'iva', type: 'toggle', section: 'condicoes', default: true, label: l('Aos honorários acresce IVA', 'VAT is added to the fees'), help: l('Desligue se o advogado não estiver registado para efeitos de IVA.', 'Turn off if the lawyer is not VAT-registered.') },
    { name: 'prazoPagamento', type: 'number', section: 'condicoes', width: 'half', min: 0, max: 90, default: 15, label: l('Prazo de pagamento das notas (dias)', 'Payment term for fee notes (days)') },
    { name: 'nib', type: 'text', section: 'condicoes', width: 'half', label: l('Conta para pagamento (NIB)', 'Account for payment (NIB)'), default: (c) => c.profile?.nib ?? '' },
    { name: 'foro', type: 'text', section: 'condicoes', width: 'half', label: l('Foro', 'Jurisdiction'), default: 'Tribunal Judicial da Cidade de Maputo' },
  ],

  computed: (v, ctx) => {
    const fixo = money(v.valorFixo);
    const total = v.modalidade === 'hora' && money(v.taxaHora) != null && Number(v.estimativaHoras) > 0 ? money(v.taxaHora)! * Number(v.estimativaHoras) : fixo;
    const limite = ctx.legal.value<number>('advProvisaoHonorarios');
    return { total, limite };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [];
    const prov = money(v.provisao);
    if (prov != null && c.total != null && prov > c.total * c.limite) {
      w.push({
        level: 'warning',
        field: 'provisao',
        message: l(
          `A provisão não deve exceder ${formatPercent(c.limite)} do total estimado dos honorários (${formatMoney(c.total * c.limite)}) — ${cite('advProvisaoHonorarios')}.`,
          `The advance should not exceed ${formatPercent(c.limite)} of the estimated total fees.`,
        ),
      });
    }
    if (v.modalidade === 'misto') {
      w.push({
        level: 'info',
        field: 'sucessoPercentagem',
        message: l(
          `É proibido o pacto de quota litis (honorários calculados sobre o que o cliente vier a receber). É permitido fixar previamente os honorários em função do valor da causa (${cite('advQuotaLitis')}).`,
          'Contingency fees based on what the client recovers are banned. Fixing the fee in advance by reference to the value of the case is allowed.',
        ),
      });
    }
    if (isEmpresa(v, 'cliente') && !v.clienteRepresentante) {
      w.push({ level: 'info', field: 'clienteRepresentante', message: l('Indique quem assina pelo cliente e em que qualidade.', 'State who signs for the client and in what capacity.') });
    }
    return w;
  },

  personName: (v) => v.clienteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const adv = advogadoParte(ctx);
    const A = adv.designacao;
    const aA = adv.sociedade ? 'a Sociedade' : isF(v.advogadoGenero) ? 'a Advogada' : 'o Advogado';
    const AA = aA.charAt(0).toUpperCase() + aA.slice(1);
    const aoA = adv.sociedade ? 'à Sociedade' : isF(v.advogadoGenero) ? 'à Advogada' : 'ao Advogado';
    const daA = adv.sociedade ? 'da Sociedade' : isF(v.advogadoGenero) ? 'da Advogada' : 'do Advogado';
    const iva = ctx.legal.value<number>('ivaTaxaNormal');
    const dias = Number(v.prazoPagamento) > 0 ? Number(v.prazoPagamento) : null;
    const prazo = dias ? `${dias} ${dias === 1 ? 'dia' : 'dias'}` : 'oito dias';

    let honorarios: string;
    switch (v.modalidade) {
      case 'hora':
        honorarios = `Os honorários são calculados à razão de ${moneyExt(v.taxaHora)} por hora de trabalho efectivo, com registo do tempo despendido, que ${aA} disponibiliza ao Cliente com cada nota de honorários${Number(v.estimativaHoras) > 0 ? `. Estima-se, sem carácter vinculativo, um total de ${Number(v.estimativaHoras)} horas` : ''}.`;
        break;
      case 'avenca':
        honorarios = `Pelos serviços objecto do presente contrato, o Cliente paga ${aoA} uma avença mensal de ${moneyExt(v.avencaMensal)}${trim(v.avencaInclui) ? `, que inclui ${trim(v.avencaInclui).replace(/[.;]$/, '')}` : ''}. Os serviços que excedam o âmbito da avença são cobrados mediante acordo prévio.`;
        break;
      case 'misto': {
        const pct = Number(v.sucessoPercentagem) > 0 ? Number(v.sucessoPercentagem) : null;
        const sucesso = money(v.sucessoValor) != null ? moneyExt(v.sucessoValor) : pct ? `${pct}% do valor da causa${money(v.valorCausa) != null ? `, fixado em ${formatMoney(money(v.valorCausa))}` : ''}` : BLANK;
        honorarios = `Os honorários são de ${moneyExt(v.valorFixo)}, acrescidos de um prémio de sucesso de ${sucesso}, devido em caso de decisão final favorável ao Cliente ou de acordo que lhe seja favorável. O prémio é fixado previamente e não depende do montante que o Cliente venha a receber.`;
        break;
      }
      default:
        honorarios = `Pelos serviços objecto do presente contrato, o Cliente paga ${aoA} honorários no montante global de ${moneyExt(v.valorFixo)}.`;
    }

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: trim(v.exclusoes) ? 'Objecto e âmbito' : 'Objecto',
        text: `Pelo presente contrato, ${aA} obriga-se a prestar ao Cliente os seguintes serviços jurídicos: ${trim(v.objecto).replace(/[.;]$/, '') || BLANK}.${trim(v.exclusoes) ? ` Não se incluem no presente contrato ${trim(v.exclusoes).replace(/[.;]$/, '')}, que serão objecto de acordo separado.` : ''}`,
        en: 'The lawyer will provide the client with the legal services described; any excluded services require a separate agreement.',
      },
      { id: 'honorarios', heading: 'Honorários', text: honorarios, en: 'Fees.' },
      ...(money(v.provisao) != null
        ? [
            {
              id: 'provisao',
              heading: 'Provisão',
              text: `Na data da assinatura do presente contrato, o Cliente entrega ${aoA}, a título de provisão por conta de honorários, a quantia de ${moneyExt(v.provisao)}, que será levada em conta na nota de honorários final. A falta de pagamento da provisão confere ${aoA} o direito de renunciar ao mandato.`,
              en: 'The client pays an advance on account of fees, credited in the final fee note. If unpaid, the lawyer may withdraw.',
            },
          ]
        : []),
      {
        id: 'despesas',
        heading: 'Despesas e encargos',
        text:
          v.despesas === 'reembolso'
            ? `As despesas e encargos do processo, designadamente custas judiciais, preparos, certidões, registos, traduções e deslocações para fora da cidade de ${ctx.place}, são suportados pelo Cliente, que os reembolsa ${aoA} contra apresentação dos respectivos comprovativos.`
            : `As despesas e encargos do processo, designadamente custas judiciais, preparos, certidões, registos, traduções e deslocações para fora da cidade de ${ctx.place}, são suportados pelo Cliente, que adianta os respectivos valores mediante pedido ${daA}.`,
        en: 'Court fees and other expenses are borne by the client.',
      },
      {
        id: 'pagamento',
        heading: 'Pagamento',
        text: `${AA} apresenta notas de honorários e despesas, que o Cliente paga no prazo de ${prazo} a contar da sua recepção${trim(v.nib) ? `, por transferência para a conta com o NIB ${trim(v.nib)}` : ''}.${v.iva ? ` Aos honorários acresce o IVA à taxa legal em vigor (actualmente ${formatPercent(iva)}), sendo emitida a respectiva factura.` : ''}`,
        en: 'The lawyer issues fee notes, payable within the agreed period; VAT is added where applicable.',
      },
      {
        id: 'deveresCliente',
        heading: 'Deveres das partes',
        text: `O Cliente obriga-se a prestar informações verdadeiras e completas, a entregar atempadamente os documentos necessários e a outorgar a procuração forense, com a assinatura reconhecida por notário. ${AA} está ${adv.sociedade || isF(v.advogadoGenero) ? 'obrigada' : 'obrigado'} ao sigilo profissional sobre todos os factos de que tome conhecimento no exercício do mandato, nos termos do Estatuto da Ordem dos Advogados de Moçambique, e declara não ter conflito de interesses no assunto.`,
        en: 'The client must give true and complete information, deliver documents on time and sign the power of attorney before a notary. The lawyer is bound by professional secrecy and declares no conflict of interest.',
      },
      {
        id: 'cessacao',
        heading: 'Cessação',
        text: `O Cliente pode revogar o mandato a todo o tempo, ficando obrigado ao pagamento dos honorários correspondentes aos serviços já prestados e das despesas efectuadas. ${AA} pode renunciar ao mandato nos termos estatutários, nomeadamente por falta de pagamento da provisão ou das notas de honorários, com a antecedência necessária para que o Cliente possa constituir novo mandatário.`,
        en: 'The client may revoke the mandate at any time, paying for work done; the lawyer may withdraw on statutory grounds with reasonable notice.',
      },
      {
        id: 'foro',
        heading: 'Litígios e foro',
        text: `As questões relativas a honorários podem ser submetidas à apreciação da Ordem dos Advogados de Moçambique. Para a resolução de quaisquer litígios emergentes do presente contrato, as partes elegem o foro do ${trim(v.foro).replace(/^(o|do)\s+/i, '') || BLANK}, com expressa renúncia a qualquer outro.`,
        en: 'Fee questions may be referred to the Bar; the chosen court has jurisdiction over disputes.',
      },
    ];

    const clienteF = papel(v, 'cliente', 'designado', 'designada');
    const clienteSig: SignatureColumn = isEmpresa(v, 'cliente')
      ? { role: 'O Cliente', name: trim(v.clienteRepresentante) || undefined, detail: trim(v.clienteNome) || undefined }
      : { role: papel(v, 'cliente', 'O Cliente', 'A Cliente'), name: trim(v.clienteNome) || undefined };
    const advSig: SignatureColumn = adv.sociedade
      ? { role: 'A Sociedade', name: trim(v.advogadoNome) || ctx.profile?.representanteNome || undefined, detail: `Carteira Profissional n.º ${trim(v.advogadoCarteira) || '________'} — OAM`, image: 'both' }
      : { role: A === 'Advogada' ? 'A Advogada' : 'O Advogado', name: trim(v.advogadoNome) || undefined, detail: `Carteira Profissional n.º ${trim(v.advogadoCarteira) || '________'} — OAM`, image: 'signature' };

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de prestação de serviços jurídicos', subtitle: v.ref ? `N.º ${v.ref}` : undefined },
      { type: 'paragraph', id: 'entre', text: '**Entre:**', align: 'left', editable: false },
      { type: 'paragraph', id: 'parteAdvogado', text: `${adv.texto};`, en: 'The lawyer (or law firm) identified above;' },
      { type: 'paragraph', id: 'e', text: '**e**', align: 'left', editable: false },
      { type: 'paragraph', id: 'parteCliente', text: `${partyDesc(v, 'cliente')}, adiante ${clienteF} por **Cliente**;`, en: 'The client identified above;' },
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'É celebrado o presente contrato de prestação de serviços jurídicos e de fixação de honorários, que se rege pelas cláusulas seguintes:',
        en: 'This legal services and fee agreement is governed by the following clauses:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      {
        type: 'paragraph',
        id: 'exemplares',
        text: 'O presente contrato é feito em dois exemplares de igual valor, ficando um em poder de cada uma das partes.',
        en: 'Made in two counterparts of equal value, one for each party.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [advSig, clienteSig] },
    ];
    return blocks;
  },
});
