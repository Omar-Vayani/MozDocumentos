// Pedido ao banco, depois de pago o crédito, da declaração de liquidação e do
// documento (distrate) que autoriza o cancelamento do registo da hipoteca.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateLong, l } from './_shared';
import {
  anexosField, anexosList, assinaturaCliente, cartaInicio, clienteFields, clienteIdent, clienteWarnings, deEntidade, documentoFields, entidadeFields, eu, fechoCarta, juntar,
  linhas, nomeCliente, reciboField, s, semPonto, sujeito,
} from './_financas';

export default defineTemplate({
  id: 'pedido-distrate-hipoteca',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'cliente', title: l('Cliente (devedor hipotecário)', 'Customer (mortgagor)'), personRole: 'outro' },
    { id: 'banco', title: l('Banco credor', 'Lending bank') },
    { id: 'credito', title: l('Crédito e imóvel', 'Loan and property') },
    { id: 'pedido', title: l('O que pede', 'What you request') },
  ],
  fields: [
    ...documentoFields(),
    ...clienteFields('cliente', 'cliente'),
    { name: 'outrosTitulares', type: 'textarea', section: 'cliente', rows: 2, label: l('Outros mutuários que assinam (um por linha)', 'Other borrowers who sign (one per line)') },
    ...entidadeFields('banco', 'banco', 'banco'),
    { name: 'contratoNumero', type: 'text', section: 'credito', width: 'half', label: l('N.º do contrato de crédito', 'Loan contract no.') },
    { name: 'dataLiquidacao', type: 'date', section: 'credito', width: 'half', required: true, label: l('Data da liquidação total', 'Date of full repayment') },
    { name: 'imovel', type: 'text', section: 'credito', required: true, label: l('Imóvel hipotecado', 'Mortgaged property'), placeholder: l('Ex.: apartamento do tipo 3, no 4.º andar do prédio n.º 210 da Avenida Vladimir Lenine, Maputo', 'E.g. a flat at …') },
    { name: 'conservatoria', type: 'text', section: 'credito', width: 'half', label: l('Conservatória do Registo Predial', 'Land Registry'), placeholder: l('Ex.: de Maputo', 'E.g. of Maputo') },
    { name: 'descricaoPredial', type: 'text', section: 'credito', width: 'half', label: l('Descrição predial n.º', 'Land Registry description no.') },
    { name: 'inscricaoHipoteca', type: 'text', section: 'credito', label: l('Inscrição da hipoteca (n.º e data, opcional)', 'Mortgage registration (no. and date, optional)') },
    { name: 'pedirDeclaracao', type: 'toggle', section: 'pedido', default: true, label: l('Declaração de liquidação total e de inexistência de dívida', 'Statement of full repayment and no debt') },
    { name: 'pedirDistrate', type: 'toggle', section: 'pedido', default: true, label: l('Documento de distrate / autorização de cancelamento da hipoteca, com assinaturas reconhecidas', 'Mortgage release with certified signatures') },
    {
      name: 'devolucao',
      type: 'textarea',
      section: 'pedido',
      rows: 2,
      label: l('Documentos a devolver (um por linha)', 'Documents to return (one per line)'),
      default: 'Livrança em branco entregue como garantia\nCertidão do registo predial e título de propriedade entregues ao banco',
    },
    { name: 'cancelarSeguros', type: 'toggle', section: 'pedido', default: true, label: l('Cancelar os seguros associados ao crédito e a respectiva cobrança', 'Cancel loan-linked insurance and its charges') },
    anexosField('pedido', l('Ex.: Comprovativo do último pagamento', 'E.g. Proof of last payment')),
    reciboField('pedido'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'cliente')];
    if (!s(v.bancoNome)) w.push({ level: 'warning', field: 'bancoNome', message: l('Indique o banco.', 'Enter the bank.') });
    if (!s(v.descricaoPredial)) w.push({ level: 'info', field: 'descricaoPredial', message: l('O número da descrição predial consta da certidão do registo: ajuda o banco a preparar o distrate.', 'The Land Registry description number is on the registry certificate.') });
    w.push({
      level: 'info',
      message: l(
        `Com o documento do banco, peça o cancelamento da inscrição da hipoteca na Conservatória do Registo Predial (${cite('finDistrateHipoteca')}). Enquanto não for cancelada, a hipoteca continua a constar do registo e dificulta a venda ou novo crédito.`,
        'With the bank’s document, apply to the Land Registry to cancel the mortgage registration. Until then the mortgage stays on the register and hinders a sale or new loan.',
      ),
    });
    return w;
  },

  personName: (v) => nomeCliente(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'cliente';
    const outros = linhas(v.outrosTitulares);
    const registo = [
      s(v.conservatoria) ? `descrito na Conservatória do Registo Predial ${/^d[eao]\s/i.test(s(v.conservatoria)) ? s(v.conservatoria) : `de ${s(v.conservatoria)}`}` : '',
      s(v.descricaoPredial) ? `sob o n.º ${s(v.descricaoPredial)}` : '',
      s(v.inscricaoHipoteca) ? `onde a hipoteca se encontra inscrita sob ${semPonto(v.inscricaoHipoteca).replace(/^(sob|a)\s+/i, '')}` : '',
    ]
      .filter(Boolean)
      .join(' ');
    const pedidos: string[] = [];
    if (v.pedirDeclaracao) pedidos.push('a emissão de declaração de que o crédito se encontra integralmente liquidado e de que nada mais é devido ao abrigo do referido contrato');
    if (v.pedirDistrate) pedidos.push('a emissão de documento de distrate ou de consentimento para o cancelamento do registo da hipoteca, com as assinaturas dos representantes do banco reconhecidas, para apresentação na Conservatória do Registo Predial');
    const dev = linhas(v.devolucao);
    if (dev.length) pedidos.push(`a devolução dos seguintes documentos: ${juntar(dev.map((d) => semPonto(d).replace(/^./, (c) => c.toLowerCase())))}`);
    if (v.cancelarSeguros) pedidos.push('o cancelamento dos seguros de vida e multirriscos associados ao crédito, cessando a respectiva cobrança, salvo instrução em contrário');
    const blocks: Block[] = [
      ...cartaInicio(ctx, P, 'banco', `Liquidação do crédito${s(v.contratoNumero) ? ` n.º ${s(v.contratoNumero)}` : ''} — pedido de distrate da hipoteca`),
      {
        type: 'paragraph',
        id: 'liquidacao',
        text: `${outros.length ? `${clienteIdent(v, P)}, e ${juntar(outros.map((n) => `**${semPonto(n)}**`))}, informam` : `${sujeito(v, P)}, ${eu(v, P, 'informo', 'informa')}`} que em ${dateLong(v.dataLiquidacao)} foi liquidado integralmente o crédito ${s(v.contratoNumero) ? `titulado pelo contrato n.º ${s(v.contratoNumero)} ` : ''}concedido ${deEntidade(s(v.bancoNome), 'por esse banco').replace(/^d([oa]) /, 'pel$1 ')}, garantido por hipoteca sobre ${semPonto(v.imovel) || BLANK}${registo ? `, ${registo}` : ''}.`,
        en: 'The borrower reports that the loan secured by the mortgage was repaid in full on the date given.',
      },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Extinta a obrigação garantida, ${outros.length ? 'solicitam' : eu(v, P, 'solicito', 'solicita')}:`,
        en: 'The obligation being extinguished, the borrower requests:',
        keepWithNext: true,
      },
      { type: 'list', style: 'alpha', items: pedidos.length ? pedidos.map((p, i) => `${p.charAt(0).toUpperCase()}${p.slice(1)}${i === pedidos.length - 1 ? '.' : ';'}`) : [BLANK] },
      {
        type: 'paragraph',
        id: 'contacto',
        text: `Os documentos podem ser levantados no balcão, mediante contacto prévio para o telefone ${s(v.clienteTelefone) || BLANK}.`,
        en: 'Documents can be collected at the branch after a phone call.',
      },
    ];
    const cols = [assinaturaCliente(ctx, P, { m: 'O Cliente', f: 'A Cliente', empresa: s(v.clienteEmpresaNome) || 'A Cliente' }), ...outros.slice(0, 2).map((n) => ({ role: 'Co-mutuário', name: semPonto(n) }))];
    blocks.push(...fechoCarta(cols, { anexos: anexosList(v), recibo: Boolean(v.recibo) }));
    return blocks;
  },
});
