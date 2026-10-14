// Declaração de origem dos fundos (proveniência de fundos), pedida por bancos,
// notários, imobiliárias e outras entidades obrigadas no âmbito da prevenção do
// branqueamento de capitais.

import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, money, moneyText } from './_shared';
import { anexosField, anexosList, assinaturaCliente, clienteFields, clienteIdent, clienteWarnings, contrair, eu, isEmp, nomeCliente, s, semPonto } from './_financas';

const OPERACAO_OPTIONS: FieldOption[] = [
  { value: 'deposito', label: l('Depósito em numerário', 'Cash deposit') },
  { value: 'recebida', label: l('Transferência recebida', 'Incoming transfer') },
  { value: 'enviada', label: l('Transferência para o estrangeiro', 'Transfer abroad') },
  { value: 'imovel', label: l('Compra de imóvel', 'Purchase of real estate') },
  { value: 'viatura', label: l('Compra de viatura ou bem de valor elevado', 'Purchase of a vehicle or high-value item') },
  { value: 'investimento', label: l('Investimento ou entrada de capital numa sociedade', 'Investment or capital contribution') },
  { value: 'outra', label: l('Outra operação', 'Other transaction') },
];

const OPERACAO_TEXTO: Record<string, string> = {
  deposito: 'o depósito em numerário',
  recebida: 'a transferência recebida',
  enviada: 'a transferência para o estrangeiro',
  imovel: 'o pagamento do preço da compra de imóvel',
  viatura: 'o pagamento do preço da compra de bem',
  investimento: 'o investimento ou entrada de capital',
  outra: 'a operação',
};

const ORIGEM_OPTIONS: FieldOption[] = [
  { value: 'salario', label: l('Salários e poupanças', 'Salary and savings') },
  { value: 'negocio', label: l('Lucros ou receitas da actividade', 'Business income') },
  { value: 'venda', label: l('Venda de um bem', 'Sale of an asset') },
  { value: 'heranca', label: l('Herança', 'Inheritance') },
  { value: 'doacao', label: l('Doação', 'Gift') },
  { value: 'emprestimo', label: l('Empréstimo', 'Loan') },
  { value: 'indemnizacao', label: l('Indemnização ou seguro', 'Compensation or insurance') },
  { value: 'outra', label: l('Outra', 'Other') },
];

const ORIGEM_TEXTO: Record<string, string> = {
  salario: 'de rendimentos do trabalho e de poupanças acumuladas',
  negocio: 'de receitas da actividade comercial ou profissional',
  venda: 'do produto da venda de um bem',
  heranca: 'de herança',
  doacao: 'de doação',
  emprestimo: 'de empréstimo',
  indemnizacao: 'de indemnização ou pagamento de seguro',
};

export default defineTemplate({
  id: 'declaracao-origem-fundos',
  family: 'declaracao',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'declarante', title: l('Declarante', 'Declarant'), personRole: 'outro' },
    { id: 'operacao', title: l('Operação', 'Transaction') },
    { id: 'origem', title: l('Origem dos fundos', 'Source of funds') },
  ],
  fields: [
    localField(),
    dateField('data'),
    ...clienteFields('declarante', 'declarante', { contactos: false }),
    { name: 'declaranteProfissao', type: 'text', section: 'declarante', width: 'half', label: l('Profissão ou actividade', 'Occupation or business'), personKey: 'cargo' },
    { name: 'entidade', type: 'text', section: 'operacao', label: l('Entidade a quem se destina', 'Addressed to'), placeholder: l('Ex.: Millennium bim; Cartório Notarial de Maputo', 'E.g. the bank or notary') },
    { name: 'operacao', type: 'select', section: 'operacao', required: true, label: l('Operação', 'Transaction'), options: OPERACAO_OPTIONS, default: 'deposito' },
    { name: 'operacaoDescricao', type: 'text', section: 'operacao', label: l('Descrição (opcional)', 'Description (optional)'), placeholder: l('Ex.: viatura Toyota Hilux, matrícula AGH 123 MC; ordenante John Smith, Londres', 'E.g. the vehicle; the sender') },
    { name: 'valor', type: 'money', section: 'operacao', width: 'half', required: true, label: l('Valor', 'Amount') },
    { name: 'moeda', type: 'text', section: 'operacao', width: 'half', default: 'MT', label: l('Moeda', 'Currency'), help: l('Escreva USD, ZAR ou EUR se não for em meticais.', 'Write USD, ZAR or EUR if not meticais.') },
    { name: 'dataOperacao', type: 'date', section: 'operacao', width: 'half', label: l('Data da operação', 'Date of the transaction') },
    { name: 'conta', type: 'text', section: 'operacao', width: 'half', label: l('Conta (opcional)', 'Account (optional)') },
    {
      name: 'origens',
      type: 'select',
      section: 'origem',
      required: true,
      label: l('Origem principal', 'Main source'),
      options: ORIGEM_OPTIONS,
      default: 'salario',
    },
    {
      name: 'origemDescricao',
      type: 'textarea',
      section: 'origem',
      rows: 3,
      required: true,
      label: l('Explique a origem', 'Explain the source'),
      help: l('Concreto e verificável: quem pagou, quando, de quê. Ex.: «venda da moradia de Tsalala a Rui Mabote, por escritura de 2 de Setembro de 2026, pelo preço de 3.500.000,00 MT».', 'Specific and verifiable: who paid, when, for what.'),
    },
    { name: 'pep', type: 'toggle', section: 'origem', label: l('Sou pessoa politicamente exposta (ou familiar / associado próximo)', 'I am a politically exposed person (or close family / associate)'), help: l('Titulares de cargos políticos ou públicos relevantes, em Moçambique ou no estrangeiro, e seus familiares próximos.', 'Holders of prominent public office, in Mozambique or abroad, and close family.'), showIf: (v) => !isEmp(v, 'declarante') },
    { name: 'pepCargo', type: 'text', section: 'origem', label: l('Cargo ou relação', 'Office or relationship'), showIf: (v) => Boolean(v.pep) && !isEmp(v, 'declarante') },
    { name: 'terceiro', type: 'toggle', section: 'origem', label: l('Os fundos pertencem a outra pessoa (actuo por conta de terceiro)', 'The funds belong to someone else') },
    { name: 'terceiroNome', type: 'text', section: 'origem', label: l('Nome e BI do beneficiário dos fundos', 'Name and ID of the beneficial owner'), showIf: (v) => Boolean(v.terceiro) },
    anexosField('origem', l('Ex.: Cópia da escritura de venda', 'E.g. Copy of the sale deed')),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'declarante')];
    if (money(v.valor) == null) w.push({ level: 'warning', field: 'valor', message: l('Indique o valor.', 'Enter the amount.') });
    if (!s(v.origemDescricao)) w.push({ level: 'warning', field: 'origemDescricao', message: l('Explique de onde vem o dinheiro.', 'Explain where the money comes from.') });
    if (!anexosList(v).length) w.push({ level: 'info', field: 'anexos', message: l('Junte comprovativos (recibos de vencimento, escritura, contrato, extractos): a declaração sozinha raramente basta.', 'Attach proof (payslips, deed, contract, statements): the statement alone rarely suffices.') });
    w.push({
      level: 'warning',
      message: l(
        `A entidade é obrigada a conhecer a origem dos fundos e a comunicar operações suspeitas ao GIFiM, sem avisar o cliente (${cite('finBranqueamentoDeveres')}). Declarações falsas podem constituir crime (${cite('finOrigemFundos')}).`,
        'The entity must know the source of funds and report suspicious transactions to the FIU without telling the customer. False statements may be a crime.',
      ),
    });
    return w;
  },

  personName: (v) => nomeCliente(v, 'declarante') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'declarante';
    const moeda = s(v.moeda) || 'MT';
    const valor = money(v.valor) != null ? (moeda === 'MT' ? `**${moneyText(v.valor)}**` : `**${moneyText(v.valor).replace(/\s*MT$/, '')} ${moeda}**`) : `${BLANK} ${moeda}`;
    const operacao = `${OPERACAO_TEXTO[v.operacao] ?? 'a operação'}${s(v.operacaoDescricao) ? ` (${semPonto(v.operacaoDescricao)})` : ''}`;
    const origemTipo = v.origens === 'outra' ? '' : ORIGEM_TEXTO[v.origens] ?? '';
    const prof = s(v.declaranteProfissao);
    const anexos = anexosList(v);
    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de origem dos fundos' },
    ];
    if (s(v.entidade)) blocks.push({ type: 'paragraph', id: 'destino', text: `**Destinatário:** ${s(v.entidade)}`, align: 'left', en: 'Addressee.' });
    blocks.push(
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `${isEmp(v, P) ? 'A' : 'Eu,'} ${clienteIdent(v, P)}${prof ? `, ${isEmp(v, P) ? 'com a actividade de' : 'de profissão'} ${prof}` : ''}, ${eu(v, P, 'declaro', 'declara')}, sob compromisso de honra, que os fundos utilizados ${contrair('em', operacao)}${s(v.conta) ? `, na conta n.º ${s(v.conta)}` : ''}, no valor de ${valor}${v.dataOperacao ? `, em ${dateLong(v.dataOperacao)}` : ''}, têm origem lícita e provêm ${origemTipo ? `${origemTipo}, nos termos seguintes: ` : 'do seguinte: '}${semPonto(v.origemDescricao) || BLANK}.`,
        en: 'The declarant states on their honour that the funds used in the transaction are of lawful origin and come from the source described.',
      },
    );
    blocks.push({
      type: 'paragraph',
      id: 'titularidade',
      text: v.terceiro
        ? `Os fundos pertencem a ${semPonto(v.terceiroNome) || BLANK}, por conta de quem ${eu(v, P, 'actuo', 'actua')}.`
        : isEmp(v, P)
          ? 'Declara ainda que actua por conta própria e é a titular dos fundos.'
          : `Declaro ainda que actuo por conta própria, que sou ${v.declaranteGenero === 'F' ? 'a' : 'o'} titular dos fundos e que ${v.pep ? `sou pessoa politicamente exposta (${semPonto(v.pepCargo) || BLANK})` : 'não sou pessoa politicamente exposta'}.`,
      en: v.terceiro ? 'The funds belong to the third party named.' : 'The declarant acts on their own account and owns the funds; PEP status as stated.',
    });
    blocks.push({
      type: 'paragraph',
      id: 'compromisso',
      text: `${eu(v, P, 'Comprometo-me', 'Compromete-se')} a apresentar os documentos comprovativos que ${eu(v, P, 'me', 'lhe')} sejam pedidos e ${eu(v, P, 'tenho', 'tem')} conhecimento de que a prestação de declarações falsas ${eu(v, P, 'me', 'a')} faz incorrer em responsabilidade civil e criminal.`,
      en: 'The declarant undertakes to provide proof and knows that false statements carry civil and criminal liability.',
    });
    if (anexos.length) blocks.push({ type: 'annexList', title: 'Documentos juntos', items: anexos });
    blocks.push(
      { type: 'paragraph', id: 'local', text: `${ctx.place}, ${dateLong(v.data)}.`, align: 'center', keepWithNext: true, en: 'Place and date.' },
      { type: 'signatures', columns: [assinaturaCliente(ctx, P, { m: 'O Declarante', f: 'A Declarante', empresa: s(v.declaranteEmpresaNome) || 'A Declarante' })] },
    );
    return blocks;
  },
});
