// Carta de conforto (comfort letter): a sociedade-mãe ou o sócio informa o
// banco sobre a sua participação numa sociedade financiada e assume, conforme
// o grau escolhido, compromissos de apoio que não são uma fiança.

import { defineTemplate, type Block, type FieldOption, type SignatureColumn, type Warning } from '../model';
import { BLANK, employerRep, l, money, moneyText } from './_shared';
import { pct } from './_contratos';
import { cartaInicio, documentoFields, entidadeFields, s, semPonto } from './_financas';

const GRAU_OPTIONS: FieldOption[] = [
  { value: 'informativa', label: l('Informativa — confirma a participação, sem compromissos', 'Informative — confirms the stake, no undertakings') },
  { value: 'intermedia', label: l('Intermédia — mantém a participação e acompanha a gestão', 'Intermediate — keeps the stake and oversees management') },
  { value: 'forte', label: l('Forte — assegura os meios financeiros da participada', 'Strong — ensures the subsidiary has the funds') },
];

export default defineTemplate({
  id: 'carta-de-conforto',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'banco', title: l('Banco financiador', 'Lending bank') },
    { id: 'participada', title: l('Sociedade financiada', 'Borrowing company') },
    { id: 'financiamento', title: l('Financiamento', 'Facility') },
    { id: 'compromissos', title: l('Compromissos', 'Undertakings') },
    { id: 'assinaturas', title: l('Assinaturas', 'Signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...entidadeFields('banco', 'banco', 'banco'),
    { name: 'participadaNome', type: 'text', section: 'participada', required: true, label: l('Denominação da sociedade financiada', 'Borrowing company name') },
    { name: 'participadaNuit', type: 'text', section: 'participada', width: 'half', label: l('NUIT', 'Tax number (NUIT)') },
    { name: 'participadaSede', type: 'text', section: 'participada', width: 'half', label: l('Sede', 'Registered office') },
    { name: 'participacao', type: 'number', section: 'participada', width: 'half', min: 0, max: 100, label: l('Participação no capital (%)', 'Shareholding (%)') },
    { name: 'participacaoForma', type: 'radio', section: 'participada', width: 'half', label: l('Participação', 'Holding'), options: [{ value: 'directa', label: l('Directa', 'Direct') }, { value: 'indirecta', label: l('Directa e indirecta', 'Direct and indirect') }], default: 'directa' },
    { name: 'financiamentoTipo', type: 'text', section: 'financiamento', label: l('Tipo de financiamento', 'Type of facility'), default: 'financiamento', placeholder: l('Ex.: linha de crédito em conta corrente; empréstimo de médio prazo; garantias bancárias', 'E.g. credit line; term loan; guarantee line') },
    { name: 'financiamentoValor', type: 'money', section: 'financiamento', width: 'half', label: l('Valor', 'Amount') },
    { name: 'financiamentoRef', type: 'text', section: 'financiamento', width: 'half', label: l('Contrato ou proposta (opcional)', 'Contract or offer (optional)'), placeholder: l('Ex.: carta-proposta de 2 de Outubro de 2026', 'E.g. offer letter of 2 October 2026') },
    { name: 'concedido', type: 'radio', section: 'financiamento', label: l('Situação', 'Status'), options: [{ value: 'proposto', label: l('Em análise / a conceder', 'Proposed') }, { value: 'concedido', label: l('Já concedido', 'Already granted') }], default: 'proposto' },
    {
      name: 'grau',
      type: 'select',
      section: 'compromissos',
      required: true,
      label: l('Grau de compromisso', 'Level of commitment'),
      options: GRAU_OPTIONS,
      default: 'intermedia',
      help: l('Quanto mais forte, mais perto fica de uma garantia: o banco pode pedir indemnização se a sociedade-mãe não cumprir o que prometeu.', 'The stronger it is, the closer to a guarantee: the bank may claim damages if the parent breaks its promise.'),
    },
    { name: 'informarAlienacao', type: 'toggle', section: 'compromissos', default: true, label: l('Informar o banco antes de vender ou reduzir a participação', 'Tell the bank before selling or reducing the stake'), showIf: (v) => v.grau !== 'informativa' },
    { name: 'deliberacao', type: 'text', section: 'assinaturas', label: l('Deliberação que autoriza (opcional)', 'Authorising resolution (optional)'), placeholder: l('Ex.: deliberação do Conselho de Administração de 30 de Setembro de 2026', 'E.g. board resolution of 30 September 2026') },
    { name: 'segundoSignatario', type: 'text', section: 'assinaturas', width: 'half', label: l('Segundo signatário (opcional)', 'Second signatory (optional)') },
    { name: 'segundoCargo', type: 'text', section: 'assinaturas', width: 'half', label: l('Cargo', 'Position') },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (ctx.profile?.kind !== 'empresa') w.push({ level: 'warning', message: l('A carta é emitida pela sociedade-mãe ou sócio: use o perfil dessa empresa.', 'The letter is issued by the parent company: use its profile.') });
    if (!s(v.participadaNome)) w.push({ level: 'warning', field: 'participadaNome', message: l('Indique a sociedade financiada.', 'Enter the borrowing company.') });
    if (!s(v.bancoNome)) w.push({ level: 'warning', field: 'bancoNome', message: l('Indique o banco.', 'Enter the bank.') });
    w.push({
      level: 'info',
      message: l(
        'A carta de conforto não é uma fiança nem uma garantia autónoma, mas os compromissos que contém obrigam quem a assina: no grau forte, o incumprimento pode gerar responsabilidade pelos prejuízos do banco. Deve ser assinada por quem obriga a sociedade, com a autorização do órgão competente.',
        'A comfort letter is not a guarantee, but its undertakings bind the signer: at the strong level, a breach may make the parent liable for the bank’s losses. It must be signed by those who bind the company, with the competent body’s approval.',
      ),
    });
    return w;
  },

  personName: (v) => s(v.participadaNome) || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const part = `**${s(v.participadaNome) || BLANK}**${s(v.participadaNuit) ? `, NUIT ${s(v.participadaNuit)}` : ''}${s(v.participadaSede) ? `, com sede em ${semPonto(v.participadaSede)}` : ''}`;
    const valor = money(v.financiamentoValor) != null ? `, no montante de **${moneyText(v.financiamentoValor)}**` : '';
    const ref = s(v.financiamentoRef) ? ` (${semPonto(v.financiamentoRef)})` : '';
    const tipo = semPonto(v.financiamentoTipo) || 'financiamento';
    const blocks: Block[] = [
      ...cartaInicio(ctx, null, 'banco', `Carta de conforto — ${s(v.participadaNome) || BLANK}`),
      {
        type: 'paragraph',
        id: 'conhecimento',
        text: `Tomámos conhecimento de que V. Ex.as ${v.concedido === 'concedido' ? 'concederam' : 'se propõem conceder'} à nossa participada ${part}, um ${tipo}${valor}${ref}, adiante designado por «Financiamento».`,
        en: 'We are aware that you have granted or propose to grant our subsidiary the facility described.',
      },
      {
        type: 'paragraph',
        id: 'participacao',
        text: `Confirmamos que detemos, ${v.participacaoForma === 'indirecta' ? 'directa e indirectamente' : 'directamente'}, ${pct(v.participacao)} do capital social da ${s(v.participadaNome) || BLANK}, e que temos conhecimento dos termos do Financiamento.`,
        en: 'We confirm our shareholding in the company and that we know the terms of the facility.',
      },
    ];
    const compromissos: string[] = [];
    if (v.grau !== 'informativa') {
      if (v.informarAlienacao) compromissos.push('informar V. Ex.as, com antecedência razoável, de qualquer intenção de alienar ou reduzir a nossa participação enquanto o Financiamento estiver em dívida');
      compromissos.push('acompanhar a gestão da nossa participada, exercendo os nossos direitos de sócio no sentido de que cumpra pontualmente as obrigações assumidas perante V. Ex.as');
    }
    if (v.grau === 'forte') {
      compromissos.push('assegurar que a nossa participada disponha, durante a vigência do Financiamento, dos meios financeiros necessários ao cumprimento pontual das obrigações dele decorrentes');
    }
    if (compromissos.length) {
      blocks.push(
        { type: 'paragraph', id: 'compromissosIntro', text: 'Nestas circunstâncias, comprometemo-nos a:', en: 'We therefore undertake to:', keepWithNext: true },
        { type: 'list', style: 'alpha', items: compromissos.map((c, i) => `${c}${i === compromissos.length - 1 ? '.' : ';'}`) },
      );
    } else {
      blocks.push({
        type: 'paragraph',
        id: 'politica',
        text: 'É nossa política acompanhar a actividade das sociedades em que participamos e apoiá-las no cumprimento das suas obrigações, nos limites da nossa qualidade de sócio.',
        en: 'It is our policy to follow and support the companies we hold, within our role as shareholder.',
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'natureza',
        text:
          v.grau === 'forte'
            ? 'A presente carta não constitui fiança nem garantia autónoma, mas os compromissos nela assumidos vinculam a signatária nos termos gerais de direito.'
            : 'A presente carta destina-se apenas a informar V. Ex.as e não constitui fiança, garantia autónoma ou qualquer outra garantia pessoal das obrigações da nossa participada.',
        en: v.grau === 'forte' ? 'This letter is not a guarantee, but its undertakings bind the signer under general law.' : 'This letter is for information only and is not a guarantee of the subsidiary’s obligations.',
      },
      {
        type: 'paragraph',
        id: 'confidencialidade',
        text: `A presente carta é confidencial, destina-se exclusivamente a V. Ex.as e no âmbito do Financiamento, e rege-se pela lei moçambicana.${s(v.deliberacao) ? ` É emitida ao abrigo da ${semPonto(v.deliberacao).replace(/^(a|da)\s+/i, '')}.` : ''}`,
        en: 'This letter is confidential, for your use in connection with the facility only, and governed by Mozambican law.',
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
    );
    const rep = employerRep(ctx);
    const cols: SignatureColumn[] = [{ role: ctx.profile?.kind === 'empresa' ? ctx.profile.firma || 'A Sociedade' : 'A Sociedade', name: rep.nome || undefined, detail: rep.cargo || undefined, image: 'both' }];
    if (s(v.segundoSignatario)) cols.push({ role: cols[0].role, name: s(v.segundoSignatario), detail: s(v.segundoCargo) || undefined });
    blocks.push({ type: 'signatures', columns: cols });
    return blocks;
  },
});
