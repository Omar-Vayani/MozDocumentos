// Alteração das assinaturas autorizadas (condições de movimentação de contas
// bancárias de uma empresa ou associação), com espécimes de assinatura.

import { defineTemplate, type Block, type FieldOption, type SignatureColumn, type Warning } from '../model';
import { BLANK, dateLong, formatMoney, l, lineItems, money } from './_shared';
import {
  anexosField, anexosList, assinaturaCliente, cartaInicio, clienteFields, clienteWarnings, deEntidade, documentoFields, entidadeFields, eu, fechoCarta, juntar,
  linhas, nomeCliente, reciboField, s, semPonto, sujeito,
} from './_financas';

const ORGAO_OPTIONS: FieldOption[] = [
  { value: 'Assembleia Geral', label: l('Assembleia Geral (sócios)', 'General Meeting') },
  { value: 'Conselho de Administração', label: l('Conselho de Administração', 'Board of Directors') },
  { value: 'Direcção', label: l('Direcção (associação)', 'Executive Board (association)') },
  { value: 'Conselho de Gerência', label: l('Gerência', 'Management') },
];

const REGIME_OPTIONS: FieldOption[] = [
  { value: 'duas', label: l('Duas assinaturas em conjunto', 'Two signatures jointly') },
  { value: 'uma', label: l('Qualquer um, isoladamente', 'Any one alone') },
  { value: 'duasLimite', label: l('Uma até um valor, duas acima', 'One up to an amount, two above') },
  { value: 'outro', label: l('Outro regime (escrever)', 'Other (write it)') },
];

export default defineTemplate({
  id: 'alteracao-assinaturas-bancarias',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'cliente', title: l('Empresa ou organização titular', 'Company or organisation holding the account') },
    { id: 'banco', title: l('Banco', 'Bank') },
    { id: 'deliberacao', title: l('Deliberação que autoriza', 'Resolution') },
    { id: 'assinaturas', title: l('Assinaturas', 'Signatories') },
    { id: 'outros', title: l('Anexos e fecho', 'Enclosures and closing') },
  ],
  fields: [
    ...documentoFields(),
    ...clienteFields('cliente', 'cliente').map((f) => (f.name === 'clienteTipo' ? { ...f, default: 'empresa' } : f)),
    { name: 'segundoSignatario', type: 'text', section: 'cliente', width: 'half', label: l('Segundo signatário (opcional)', 'Second signatory (optional)') },
    { name: 'segundoCargo', type: 'text', section: 'cliente', width: 'half', label: l('Cargo do segundo signatário', 'Second signatory’s position') },
    ...entidadeFields('banco', 'banco', 'banco'),
    {
      name: 'contas',
      type: 'textarea',
      section: 'banco',
      rows: 2,
      required: true,
      label: l('Contas abrangidas (uma por linha)', 'Accounts concerned (one per line)'),
      placeholder: l('Ex.: Conta à ordem em MT n.º 0012 3456 789', 'E.g. MZN current account no. 0012 3456 789'),
    },
    { name: 'orgao', type: 'select', section: 'deliberacao', width: 'half', label: l('Órgão que deliberou', 'Body that resolved'), options: ORGAO_OPTIONS, default: 'Assembleia Geral' },
    { name: 'actaNumero', type: 'text', section: 'deliberacao', width: 'half', label: l('Acta n.º', 'Minutes no.') },
    { name: 'actaData', type: 'date', section: 'deliberacao', width: 'half', label: l('Data da deliberação', 'Date of the resolution') },
    { name: 'dataEfeito', type: 'date', section: 'deliberacao', width: 'half', label: l('Produz efeitos a partir de', 'Effective from'), help: l('Deixe vazio para «a partir da recepção desta carta».', 'Leave empty for “from receipt of this letter”.') },
    {
      name: 'removidos',
      type: 'textarea',
      section: 'assinaturas',
      rows: 2,
      label: l('Deixam de assinar (um nome por linha)', 'No longer authorised (one name per line)'),
    },
    {
      name: 'signatarios',
      type: 'lines',
      section: 'assinaturas',
      label: l('Assinaturas autorizadas a partir de agora', 'Authorised signatories from now on'),
      addLabel: l('Adicionar signatário', 'Add signatory'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'cargo', type: 'text', label: l('Cargo', 'Position') },
        { name: 'doc', type: 'text', label: l('BI / DIRE n.º', 'ID no.') },
        { name: 'classe', type: 'text', label: l('Classe (opcional)', 'Class (optional)'), placeholder: l('A ou B', 'A or B') },
      ],
      default: [],
    },
    { name: 'regime', type: 'radio', section: 'assinaturas', label: l('Como se movimenta a conta', 'How the account is operated'), options: REGIME_OPTIONS, default: 'duas' },
    { name: 'limite', type: 'money', section: 'assinaturas', width: 'half', label: l('Valor até ao qual basta uma assinatura', 'Amount up to which one signature suffices'), showIf: (v) => v.regime === 'duasLimite' },
    { name: 'regimeOutro', type: 'textarea', section: 'assinaturas', rows: 2, label: l('Regime de movimentação', 'Signing rules'), placeholder: l('Ex.: duas assinaturas, sendo uma obrigatoriamente de um signatário da classe A', 'E.g. two signatures, one of them from class A'), showIf: (v) => v.regime === 'outro' },
    { name: 'canaisDigitais', type: 'toggle', section: 'assinaturas', default: true, label: l('Aplicar também ao banco electrónico (internet e mobile banking)', 'Apply also to internet and mobile banking') },
    {
      ...anexosField('outros'),
      default: [
        { descricao: 'Cópia da acta da deliberação' },
        { descricao: 'Cópia da certidão de registo comercial actualizada' },
        { descricao: 'Cópias dos documentos de identificação e NUIT dos novos signatários' },
      ],
    },
    reciboField('outros'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'cliente')];
    if (!s(v.bancoNome)) w.push({ level: 'warning', field: 'bancoNome', message: l('Indique o banco.', 'Enter the bank.') });
    if (!linhas(v.contas).length) w.push({ level: 'warning', field: 'contas', message: l('Indique as contas abrangidas.', 'List the accounts concerned.') });
    if (!lineItems(v.signatarios).some((r) => s(r.nome))) w.push({ level: 'warning', field: 'signatarios', message: l('Indique os novos signatários.', 'List the new signatories.') });
    if (!s(v.actaNumero) && !v.actaData) {
      w.push({
        level: 'warning',
        field: 'actaNumero',
        message: l(
          'Os poderes para movimentar as contas resultam do pacto social e de deliberação do órgão competente. O banco pede a acta: indique o seu número e data.',
          'Authority to operate the accounts comes from the articles and a resolution of the competent body. The bank will ask for the minutes.',
        ),
      });
    }
    w.push({
      level: 'info',
      message: l(
        'Os novos signatários devem assinar no quadro de espécimes, com a mesma assinatura do documento de identificação. O banco pode exigir que se desloquem ao balcão para recolha de assinatura e dados (identificação do cliente).',
        'New signatories sign the specimen table with the same signature as on their ID. The bank may ask them to come to the branch to give their signature and details.',
      ),
    });
    return w;
  },

  personName: (v) => nomeCliente(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'cliente';
    const contas = linhas(v.contas);
    const sig = lineItems(v.signatarios).filter((r) => s(r.nome) || s(r.doc));
    const removidos = linhas(v.removidos);
    const deliberacao = `${s(v.actaNumero) ? `acta n.º ${s(v.actaNumero)}` : 'acta'}${v.actaData ? `, de ${dateLong(v.actaData)}` : ''}`;
    const blocks: Block[] = [
      ...cartaInicio(ctx, P, 'banco', 'Alteração das assinaturas autorizadas e das condições de movimentação de conta'),
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${sujeito(v, P)}, em execução da deliberação ${/^Assembleia|^Direcção/.test(String(v.orgao ?? '')) ? 'da' : 'do'} ${s(v.orgao) || 'Assembleia Geral'} constante da ${deliberacao}, cuja cópia se junta, ${eu(v, P, 'solicito', 'solicita')} a alteração das assinaturas autorizadas e das condições de movimentação ${contas.length > 1 ? 'das contas abaixo indicadas' : 'da conta abaixo indicada'}, de que ${eu(v, P, 'sou titular', 'é titular')} ${deEntidade(s(v.bancoNome), 'nesse banco')}:`,
        en: 'Pursuant to the resolution in the attached minutes, the company asks the bank to change the authorised signatories and signing rules of the accounts below.',
      },
      { type: 'list', style: 'bullet', items: contas.length ? contas.map(semPonto) : [BLANK] },
    ];
    if (removidos.length) {
      blocks.push({
        type: 'paragraph',
        id: 'removidos',
        text: `Com efeitos a partir ${v.dataEfeito ? `de ${dateLong(v.dataEfeito)}` : 'da recepção desta carta'}, ${removidos.length > 1 ? 'deixam' : 'deixa'} de ter poderes para movimentar ${contas.length > 1 ? 'as contas' : 'a conta'} ${juntar(removidos.map((n) => `**${semPonto(n)}**`))}, devendo o banco recusar instruções ${removidos.length > 1 ? 'por eles' : 'por si'} assinadas a partir dessa data.`,
        en: 'The persons named no longer have authority to operate the accounts; the bank must refuse instructions signed by them from that date.',
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'novos',
      text: `${removidos.length ? 'Passam' : `Com efeitos a partir ${v.dataEfeito ? `de ${dateLong(v.dataEfeito)}` : 'da recepção desta carta'}, passam`} a ter poderes para movimentar ${contas.length > 1 ? 'as contas' : 'a conta'} as pessoas abaixo identificadas, cujos espécimes de assinatura constam do quadro seguinte:`,
      en: 'The persons below are authorised to operate the accounts; their specimen signatures follow.',
      keepWithNext: true,
    });
    const temClasse = sig.some((r) => s(r.classe));
    const vazio = sig.length ? sig : [{}, {}];
    blocks.push({
      type: 'table',
      grid: true,
      columns: [
        { label: 'Nome', width: 2.1 },
        { label: 'Cargo', width: 1.5 },
        { label: 'BI / DIRE n.º', width: 1.5 },
        ...(temClasse ? [{ label: 'Classe', width: 0.8, align: 'center' as const }] : []),
        { label: 'Assinatura', width: 2.4 },
      ],
      rows: vazio.map((r: Record<string, any>) => [s(r.nome) || ' ', s(r.cargo) || ' ', s(r.doc) || ' ', ...(temClasse ? [s(r.classe) || ' '] : []), `\n${BLANK}`]),
    });

    let regime: string;
    switch (v.regime) {
      case 'uma':
        regime = `${contas.length > 1 ? 'As contas passam' : 'A conta passa'} a ser movimentada${contas.length > 1 ? 's' : ''} com a assinatura de qualquer um dos signatários acima indicados, isoladamente.`;
        break;
      case 'duasLimite': {
        const lim = money(v.limite);
        regime = `${contas.length > 1 ? 'As contas passam' : 'A conta passa'} a ser movimentada${contas.length > 1 ? 's' : ''} com a assinatura de um dos signatários acima indicados para operações de valor até **${lim != null ? formatMoney(lim) : `${BLANK} MT`}**, e com duas assinaturas em conjunto para operações de valor superior.`;
        break;
      }
      case 'outro':
        regime = `Regime de movimentação: ${semPonto(v.regimeOutro) || BLANK}.`;
        break;
      default:
        regime = `${contas.length > 1 ? 'As contas passam' : 'A conta passa'} a ser movimentada${contas.length > 1 ? 's' : ''} com duas assinaturas em conjunto de quaisquer dos signatários acima indicados.`;
    }
    blocks.push({ type: 'paragraph', id: 'regime', text: regime, en: 'Signing rules for the accounts.' });
    blocks.push({
      type: 'paragraph',
      id: 'canais',
      text: `${v.canaisDigitais ? 'As mesmas regras aplicam-se às ordens dadas através do banco electrónico (internet e mobile banking), devendo os perfis de autorização ser ajustados e cancelados os acessos de quem deixou de ter poderes. ' : ''}Solicita-se a confirmação escrita da alteração logo que efectuada.`,
      en: `${v.canaisDigitais ? 'The same rules apply to online banking; access must be adjusted. ' : ''}Please confirm the change in writing.`,
    });
    const cols: SignatureColumn[] = [assinaturaCliente(ctx, P, { m: 'O Titular', f: 'A Titular', empresa: s(v.clienteEmpresaNome) || 'A Titular' })];
    if (s(v.segundoSignatario)) cols.push({ role: s(v.clienteEmpresaNome) || 'A Titular', name: s(v.segundoSignatario), detail: s(v.segundoCargo) || undefined });
    blocks.push(...fechoCarta(cols, { anexos: anexosList(v), recibo: Boolean(v.recibo) }));
    return blocks;
  },
});
