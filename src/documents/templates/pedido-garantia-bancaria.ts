// Pedido ao banco de emissão de garantia bancária (provisória, definitiva, de
// adiantamento, aduaneira ou a favor de um fornecedor).

import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { BLANK, cite, dateLong, l, money, moneyText } from './_shared';
import {
  anexosField, anexosList, assinaturaCliente, cartaInicio, clienteFields, clienteWarnings, contaFields, contaTexto, deEntidade, documentoFields, entidadeFields, eu,
  fechoCarta, nomeCliente, reciboField, s, semPonto, sujeito,
} from './_financas';

const TIPO_OPTIONS: FieldOption[] = [
  { value: 'provisoria', label: l('Garantia provisória (de proposta, concurso)', 'Bid bond (tender)') },
  { value: 'definitiva', label: l('Garantia definitiva (de boa execução do contrato)', 'Performance bond') },
  { value: 'adiantamento', label: l('Garantia de adiantamento', 'Advance payment guarantee') },
  { value: 'aduaneira', label: l('Garantia aduaneira', 'Customs guarantee') },
  { value: 'pagamento', label: l('Garantia de pagamento a fornecedor', 'Payment guarantee to a supplier') },
  { value: 'arrendamento', label: l('Garantia de arrendamento', 'Rental guarantee') },
];

const TIPO_TEXTO: Record<string, string> = {
  provisoria: 'garantia bancária provisória',
  definitiva: 'garantia bancária definitiva, para caução do bom e pontual cumprimento do contrato',
  adiantamento: 'garantia bancária de adiantamento, para caução do reembolso do adiantamento a receber',
  aduaneira: 'garantia bancária a favor das Alfândegas',
  pagamento: 'garantia bancária de pagamento',
  arrendamento: 'garantia bancária para caução das obrigações do arrendatário',
};

const CONTRA_OPTIONS: FieldOption[] = [
  { value: 'limite', label: l('Dentro do limite de garantias já aprovado', 'Within an approved guarantee line') },
  { value: 'cativo', label: l('Cativo do valor na conta (depósito caução)', 'Cash collateral blocked in the account') },
  { value: 'analisar', label: l('A acordar com o banco', 'To be agreed with the bank') },
];

export default defineTemplate({
  id: 'pedido-garantia-bancaria',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'cliente', title: l('Ordenante (quem pede a garantia)', 'Applicant') },
    { id: 'banco', title: l('Banco', 'Bank') },
    { id: 'garantia', title: l('Garantia', 'Guarantee') },
    { id: 'contragarantia', title: l('Contragarantia e comissões', 'Counter-security and fees') },
  ],
  fields: [
    ...documentoFields(),
    ...clienteFields('cliente', 'cliente').map((f) => (f.name === 'clienteTipo' ? { ...f, default: 'empresa' } : f)),
    ...entidadeFields('banco', 'banco', 'banco'),
    { name: 'tipo', type: 'select', section: 'garantia', required: true, label: l('Tipo de garantia', 'Type of guarantee'), options: TIPO_OPTIONS, default: 'provisoria' },
    { name: 'beneficiario', type: 'text', section: 'garantia', required: true, label: l('Beneficiário', 'Beneficiary'), placeholder: l('Ex.: Direcção Provincial de Obras Públicas e Recursos Hídricos de Sofala', 'E.g. the contracting authority') },
    { name: 'beneficiarioMorada', type: 'text', section: 'garantia', label: l('Morada do beneficiário (opcional)', 'Beneficiary’s address (optional)') },
    { name: 'referencia', type: 'text', section: 'garantia', label: l('Concurso, contrato ou operação', 'Tender, contract or transaction'), placeholder: l('Ex.: Concurso Público n.º 14/UGEA/DPOPRH/2026 — reabilitação da Escola Primária de Munhava', 'E.g. Public Tender no. 14/2026 — school rehabilitation') },
    { name: 'valor', type: 'money', section: 'garantia', width: 'half', required: true, label: l('Valor da garantia', 'Guarantee amount') },
    { name: 'validade', type: 'date', section: 'garantia', width: 'half', label: l('Válida até', 'Valid until') },
    { name: 'dataNecessaria', type: 'date', section: 'garantia', width: 'half', label: l('Necessária até (prazo de entrega)', 'Needed by') },
    { name: 'modeloAnexo', type: 'toggle', section: 'garantia', default: true, label: l('O texto deve seguir o modelo do beneficiário, em anexo', 'The wording must follow the beneficiary’s model, attached') },
    { name: 'primeiraSolicitacao', type: 'toggle', section: 'garantia', default: true, label: l('Garantia autónoma, à primeira solicitação', 'Independent, on-first-demand guarantee'), help: l('É o que os documentos de concurso exigem normalmente: o banco paga a pedido do beneficiário, sem discutir o contrato.', 'Usually required by tender documents: the bank pays on demand without disputing the contract.') },
    { name: 'contragarantia', type: 'select', section: 'contragarantia', width: 'half', label: l('Contragarantia', 'Counter-security'), options: CONTRA_OPTIONS, default: 'limite' },
    ...contaFields('contragarantia'),
    {
      ...anexosField('contragarantia', l('Ex.: Modelo de garantia do documento do concurso', 'E.g. Guarantee model from the tender documents')),
      default: [{ descricao: 'Modelo de garantia constante do documento do concurso' }, { descricao: 'Cópia do anúncio do concurso ou do contrato' }],
    },
    reciboField('contragarantia', false),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'cliente')];
    if (!s(v.bancoNome)) w.push({ level: 'warning', field: 'bancoNome', message: l('Indique o banco.', 'Enter the bank.') });
    if (money(v.valor) == null) w.push({ level: 'warning', field: 'valor', message: l('Indique o valor da garantia.', 'Enter the guarantee amount.') });
    if (!s(v.beneficiario)) w.push({ level: 'warning', field: 'beneficiario', message: l('Indique o beneficiário.', 'Enter the beneficiary.') });
    w.push({
      level: 'info',
      message: l(
        `Em concursos públicos, o valor, a validade e o texto da garantia constam do documento do concurso; uma garantia diferente do modelo pode levar à exclusão da proposta (${cite('finGarantiaBancaria')}). Peça a garantia com antecedência: o banco precisa de tempo para aprovar e emitir.`,
        'In public tenders, the amount, validity and wording are set in the tender documents; a guarantee that departs from the model can exclude the bid. Ask early: the bank needs time to approve and issue it.',
      ),
    });
    return w;
  },

  personName: (v) => nomeCliente(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'cliente';
    const tipo = TIPO_TEXTO[v.tipo] ?? TIPO_TEXTO.provisoria;
    const contra =
      v.contragarantia === 'cativo'
        ? `${eu(v, P, 'Autorizo', 'A ordenante autoriza')} o banco a cativar na ${contaTexto(v)} o valor da garantia, até à sua extinção, bem como a debitar na mesma conta as comissões e encargos devidos.`
        : v.contragarantia === 'analisar'
          ? `${eu(v, P, 'Estou', 'A ordenante está')} disponível para prestar as contragarantias que o banco considere adequadas, e ${eu(v, P, 'autorizo', 'autoriza')} o débito das comissões e encargos na ${contaTexto(v)}.`
          : `A garantia deve ser emitida ao abrigo do limite de garantias bancárias aprovado a favor ${eu(v, P, 'do signatário', 'da ordenante')}, ${eu(v, P, 'autorizando', 'autorizando-se')} o débito das comissões e encargos na ${contaTexto(v)}.`;
    const blocks: Block[] = [
      ...cartaInicio(ctx, P, 'banco', `Pedido de emissão de garantia bancária${s(v.referencia) ? ` — ${semPonto(v.referencia)}` : ''}`),
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${sujeito(v, P)}, cliente ${deEntidade(s(v.bancoNome), 'desse banco')}, ${eu(v, P, 'solicito', 'solicita')} a emissão de ${tipo}${v.primeiraSolicitacao ? ', autónoma e à primeira solicitação,' : ''} nas condições seguintes:`,
        en: 'The applicant asks the bank to issue a guarantee on the following terms:',
        keepWithNext: true,
      },
      {
        type: 'keyValue',
        columns: 1,
        items: [
          { label: 'Beneficiário', value: `${s(v.beneficiario) || BLANK}${s(v.beneficiarioMorada) ? `, ${s(v.beneficiarioMorada)}` : ''}` },
          { label: 'Referência', value: s(v.referencia) || BLANK },
          { label: 'Valor', value: money(v.valor) != null ? moneyText(v.valor) : `${BLANK} MT` },
          { label: 'Validade', value: v.validade ? `até ${dateLong(v.validade)}` : BLANK },
          ...(v.dataNecessaria ? [{ label: 'Entrega necessária até', value: dateLong(v.dataNecessaria) }] : []),
        ],
      },
    ];
    const modelo = v.modeloAnexo
      ? 'O texto da garantia deve seguir integralmente o modelo exigido pelo beneficiário, que se junta, sem condições ou prazos diferentes dos nele previstos. '
      : '';
    blocks.push(
      { type: 'paragraph', id: 'condicoes', text: `${modelo}${contra}`, en: 'Wording per the beneficiary’s model; counter-security and authorisation to debit fees.' },
      {
        type: 'paragraph',
        id: 'entrega',
        text: `O original da garantia será levantado no balcão pelos representantes ${eu(v, P, 'do ordenante', 'da ordenante')}, mediante contacto prévio para o telefone ${s(v.clienteTelefone) || BLANK}.`,
        en: 'The original will be collected at the branch after a phone call.',
      },
    );
    blocks.push(...fechoCarta([assinaturaCliente(ctx, P, { m: 'O Ordenante', f: 'A Ordenante', empresa: s(v.clienteEmpresaNome) || 'A Ordenante' })], { anexos: anexosList(v), recibo: Boolean(v.recibo) }));
    return blocks;
  },
});
