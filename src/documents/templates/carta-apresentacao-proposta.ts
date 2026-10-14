// Carta de apresentação da proposta (formulário de proposta): the bidder's
// covering letter to the contracting body, stating the price, validity,
// delivery period, the bid security and the standard bidder declarations.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateLong, l, lineItems, money, refField } from './_shared';
import {
  concorrenteFields, concorrenteIdent, concorrenteSignature, concorrenteWarnings, daEntidade, diasTexto, entidadeFields, entidadeRecipient, formularioWarning,
  IVA_OPTIONS, procedimentoCompleto, procedimentoFields, procedimentoNome, semPonto, str, TIPO_CONTRATACAO_OPTIONS, valorTexto,
} from './_contratacao';

const IVA_TEXTO: Record<string, string> = {
  incluido: 'com IVA incluído',
  acrescer: 'a que acresce o IVA à taxa legal',
  isento: 'isento de IVA',
};

const VERBO: Record<string, string> = {
  bens: 'fornecer os bens',
  servicos: 'prestar os serviços',
  consultoria: 'prestar os serviços de consultoria',
  obras: 'executar a empreitada',
};

export default defineTemplate({
  id: 'carta-apresentacao-proposta',
  family: 'carta',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Referência, local e data', 'Reference, place and date') },
    { id: 'entidade', title: l('Entidade contratante', 'Contracting body') },
    { id: 'procedimento', title: l('Concurso', 'Tender') },
    { id: 'concorrente', title: l('Concorrente', 'Bidder'), personRole: 'outro' },
    { id: 'proposta', title: l('Proposta', 'Bid') },
    { id: 'garantia', title: l('Garantia provisória', 'Bid security') },
    { id: 'anexos', title: l('Documentos que acompanham a proposta', 'Documents enclosed') },
  ],
  fields: [
    refField(),
    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', label: l('Data', 'Date'), default: (c) => c.today },
    ...entidadeFields(),
    ...procedimentoFields(),
    { name: 'tipo', type: 'select', section: 'procedimento', width: 'half', label: l('Tipo de contratação', 'Type of contract'), options: TIPO_CONTRATACAO_OPTIONS, default: 'bens' },
    { name: 'aditamentos', type: 'text', section: 'procedimento', label: l('Esclarecimentos / aditamentos recebidos (opcional)', 'Clarifications / addenda received (optional)'), placeholder: l('Ex.: Esclarecimentos n.º 1 e n.º 2', 'E.g. Clarifications no. 1 and no. 2') },
    ...concorrenteFields(),
    { name: 'valor', type: 'money', section: 'proposta', required: true, width: 'half', label: l('Preço total da proposta', 'Total bid price') },
    { name: 'ivaModo', type: 'select', section: 'proposta', width: 'half', label: l('IVA', 'VAT'), options: IVA_OPTIONS, default: 'incluido' },
    {
      name: 'validadeDias',
      type: 'number',
      section: 'proposta',
      width: 'half',
      min: 1,
      max: 365,
      label: l('Validade da proposta (dias)', 'Bid validity (days)'),
      help: l('O prazo fixado no documento de concurso, contado da data-limite de entrega das propostas.', 'The period set in the tender document, from the bid deadline.'),
    },
    {
      name: 'prazoExecucao',
      type: 'text',
      section: 'proposta',
      width: 'half',
      label: l('Prazo de entrega / execução', 'Delivery / performance period'),
      placeholder: l('Ex.: quinze dias após a assinatura do contrato', 'E.g. fifteen days after signing'),
    },
    { name: 'contactoNome', type: 'text', section: 'proposta', width: 'half', label: l('Pessoa de contacto', 'Contact person') },
    { name: 'contactoTelefone', type: 'text', section: 'proposta', width: 'half', label: l('Telefone e email de contacto', 'Contact phone and email'), default: (c) => [c.profile?.telefones, c.profile?.email].filter(Boolean).join(' · ') },
    { name: 'garantia', type: 'toggle', section: 'garantia', default: true, label: l('Junta garantia provisória', 'Bid security enclosed') },
    { name: 'garantiaNumero', type: 'text', section: 'garantia', width: 'half', label: l('Garantia n.º', 'Guarantee no.'), showIf: (v) => Boolean(v.garantia) },
    { name: 'garantiaBanco', type: 'text', section: 'garantia', width: 'half', label: l('Emitida por (banco / seguradora)', 'Issued by (bank / insurer)'), showIf: (v) => Boolean(v.garantia) },
    { name: 'garantiaValor', type: 'money', section: 'garantia', width: 'half', label: l('Valor da garantia', 'Security amount'), showIf: (v) => Boolean(v.garantia) },
    { name: 'garantiaValidade', type: 'date', section: 'garantia', width: 'half', label: l('Válida até', 'Valid until'), showIf: (v) => Boolean(v.garantia) },
    {
      name: 'anexos',
      type: 'lines',
      section: 'anexos',
      label: l('Anexos', 'Enclosures'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: [
        { descricao: 'Proposta financeira (lista de preços)' },
        { descricao: 'Proposta técnica / especificações dos bens propostos' },
        { descricao: 'Declaração de não impedimento' },
        { descricao: 'Certidão de inscrição no Cadastro Único' },
        { descricao: 'Certidão de quitação da Autoridade Tributária' },
        { descricao: 'Declaração de situação regularizada no INSS' },
        { descricao: 'Garantia provisória' },
      ],
      help: l('Siga a lista e a ordem do documento de concurso.', 'Follow the list and order of the tender document.'),
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [...concorrenteWarnings(v), formularioWarning()];
    if (!str(v.entidadeNome)) w.push({ level: 'warning', field: 'entidadeNome', message: l('Indique a entidade contratante.', 'Enter the contracting body.') });
    if (money(v.valor) == null) w.push({ level: 'error', field: 'valor', message: l('Indique o preço total da proposta.', 'Enter the total bid price.') });
    if (!v.validadeDias) w.push({ level: 'warning', field: 'validadeDias', message: l(`Indique a validade da proposta fixada no documento de concurso (${cite('ctValidadeProposta')}).`, 'Enter the bid validity set in the tender document.') });
    if (v.garantia && !v.garantiaValidade) w.push({ level: 'warning', field: 'garantiaValidade', message: l('A garantia provisória deve cobrir todo o prazo de validade da proposta.', 'The bid security must cover the whole bid validity period.') });
    if (!v.garantia) {
      w.push({
        level: 'info',
        field: 'garantia',
        message: l(`Confirme no documento de concurso se é exigida garantia provisória: a proposta sem a garantia exigida é desclassificada (${cite('ctGarantiaProvisoria')}).`, 'Check whether a bid security is required: a bid without it is disqualified.'),
      });
    }
    return w;
  },

  personName: (v) => v.entidadeNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const verbo = VERBO[str(v.tipo)] ?? VERBO.bens;
    const anexos = lineItems(v.anexos).map((r) => str(r.descricao)).filter(Boolean);
    const blocks: Block[] = [
      { type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
      entidadeRecipient(v),
      { type: 'subject', text: `Apresentação de proposta — ${procedimentoNome(v)}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'apresentacao',
        text: `${concorrenteIdent(v)}, vem apresentar a sua proposta ao ${procedimentoCompleto(v)}, lançado ${daEntidade(str(v.entidadeNome))}.`,
        en: 'The bidder, identified above, submits its bid to the tender stated.',
      },
      {
        type: 'paragraph',
        id: 'aceitacao',
        text: `Tendo examinado o documento de concurso${str(v.aditamentos) ? `, incluindo ${semPonto(v.aditamentos)}` : ' e os esclarecimentos prestados'}, aceitamos sem reservas o seu conteúdo e propomo-nos ${verbo} que constituem o seu objecto, em conformidade com o mesmo e com a proposta que se junta, pelo preço total de ${valorTexto(money(v.valor))}, ${IVA_TEXTO[str(v.ivaModo)] ?? IVA_TEXTO.incluido}.`,
        en: 'Having examined the tender document, we accept it without reservation and offer to perform the contract for the total price stated.',
      },
      {
        type: 'paragraph',
        id: 'validade',
        text: `A presente proposta é válida pelo prazo de ${diasTexto(v.validadeDias)}, contado da data-limite fixada para a apresentação das propostas, e mantém-se obrigatória para nós durante esse prazo, podendo ser aceite a todo o tempo antes do seu termo.`,
        en: 'The bid is valid and binding for the stated number of days from the bid deadline.',
      },
    ];
    if (str(v.prazoExecucao)) {
      blocks.push({
        type: 'paragraph',
        id: 'prazo',
        text: `Comprometemo-nos a ${verbo.replace(/^(fornecer|prestar|executar)/, (m) => ({ fornecer: 'entregar', prestar: 'prestar', executar: 'executar' })[m] ?? m)} no prazo de ${semPonto(v.prazoExecucao)}.`,
        en: `Delivery / performance period: ${v.prazoExecucao}.`,
      });
    }
    if (v.garantia) {
      blocks.push({
        type: 'paragraph',
        id: 'garantia',
        text: `Juntamos a garantia provisória${str(v.garantiaNumero) ? ` n.º ${semPonto(v.garantiaNumero)}` : ''}, emitida ${str(v.garantiaBanco) ? `pelo ${semPonto(v.garantiaBanco).replace(/^(o|pelo)\s+/i, '')}` : `por ${BLANK}`}, no valor de ${valorTexto(money(v.garantiaValor))}, válida até ${dateLong(v.garantiaValidade)}.`,
        en: 'We enclose the bid security stated.',
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'compromissos',
        text: 'Em caso de adjudicação, comprometemo-nos a prestar a garantia definitiva, a apresentar os documentos de habilitação exigidos e a assinar o contrato nos prazos fixados.',
        en: 'If awarded, we will provide the performance security and the required documents and sign the contract on time.',
      },
      {
        type: 'paragraph',
        id: 'declaracoes',
        text: `Declaramos, sob compromisso de honra, que não nos encontramos em nenhuma situação de impedimento prevista no regulamento de contratação pública e no documento de concurso, que não apresentamos outra proposta neste procedimento, isoladamente ou em agrupamento, e que não oferecemos nem prometemos qualquer pagamento ou vantagem a servidor público relacionado com este procedimento (${cite('ctImpedimentos')}).`,
        en: 'We declare on our honour that no ground for exclusion applies, that we submit no other bid in this procedure and that we have offered no payment or advantage to any public servant.',
      },
    );
    if (str(v.contactoNome) || str(v.contactoTelefone)) {
      blocks.push({
        type: 'paragraph',
        id: 'contacto',
        text: `Para qualquer esclarecimento sobre a proposta, a pessoa de contacto é ${str(v.contactoNome) || BLANK}${str(v.contactoTelefone) ? ` (${str(v.contactoTelefone)})` : ''}.`,
        en: 'Contact person for the bid.',
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', columns: [concorrenteSignature(ctx)] },
    );
    if (anexos.length) blocks.push({ type: 'annexList', items: anexos });
    return blocks;
  },
});
