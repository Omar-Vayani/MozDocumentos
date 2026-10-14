// Requerimento de certidão de quitação fiscal (situação tributária
// regularizada) à Direcção de Área Fiscal.

import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { BLANK, cite, dateField, l, localField, placeDate } from './_shared';
import { anexosField, anexosList, assinaturaFiscal, clienteFields, clienteWarnings, destinatarioFiscalFields, mandatarioFields, nomeCliente, requerenteTexto, requerimentoInicio, s, semPonto } from './_financas';

const FIM_OPTIONS: FieldOption[] = [
  { value: 'concurso', label: l('Concurso público / contratação com o Estado', 'Public tender / State contract') },
  { value: 'licenciamento', label: l('Licenciamento ou alvará', 'Licence or permit') },
  { value: 'financiamento', label: l('Financiamento bancário', 'Bank financing') },
  { value: 'repatriamento', label: l('Repatriamento de capitais / câmbios', 'Repatriation of capital / foreign exchange') },
  { value: 'outro', label: l('Outro fim', 'Other purpose') },
];

const FIM_TEXTO: Record<string, string> = {
  concurso: 'instruir propostas em concursos públicos e contratos com o Estado',
  licenciamento: 'instruir processo de licenciamento',
  financiamento: 'instruir pedido de financiamento bancário',
  repatriamento: 'instruir operação cambial ou de repatriamento de capitais',
};

export default defineTemplate({
  id: 'pedido-certidao-quitacao-fiscal',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'destinatario', title: l('A quem se dirige', 'Addressee') },
    { id: 'contribuinte', title: l('Contribuinte', 'Taxpayer'), personRole: 'outro' },
    { id: 'pedido', title: l('Pedido', 'Request') },
    { id: 'documento', title: l('Assinatura, local e data', 'Signature, place and date') },
  ],
  fields: [
    ...destinatarioFiscalFields('destinatario'),
    ...clienteFields('contribuinte', 'contribuinte'),
    { name: 'finalidade', type: 'select', section: 'pedido', width: 'half', label: l('Para que fim', 'Purpose'), options: FIM_OPTIONS, default: 'concurso' },
    { name: 'finalidadeOutra', type: 'text', section: 'pedido', label: l('Descreva o fim', 'Describe the purpose'), showIf: (v) => v.finalidade === 'outro' },
    { name: 'referencia', type: 'text', section: 'pedido', label: l('Concurso ou processo (opcional)', 'Tender or case (optional)'), placeholder: l('Ex.: Concurso Público n.º 14/UGEA/DPOPRH/2026', 'E.g. Public Tender no. …') },
    { name: 'copias', type: 'number', section: 'pedido', width: 'half', min: 0, max: 20, default: 0, label: l('Cópias autenticadas pedidas', 'Certified copies requested') },
    {
      ...anexosField('pedido'),
      default: [{ descricao: 'Cópia do cartão de NUIT' }, { descricao: 'Comprovativo de pagamento dos emolumentos' }],
    },
    ...mandatarioFields('documento'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...clienteWarnings(v, 'contribuinte')];
    const nuit = v.contribuinteTipo === 'empresa' ? s(v.contribuinteEmpresaNuit) : s(v.contribuinteNuit);
    if (!nuit) w.push({ level: 'error', field: v.contribuinteTipo === 'empresa' ? 'contribuinteEmpresaNuit' : 'contribuinteNuit', message: l('O NUIT é indispensável para emitir a certidão.', 'The NUIT is required.') });
    const meses = ctx.legal.value<{ validadeMeses: number }>('finCertidaoQuitacao').validadeMeses;
    w.push({
      level: 'info',
      message: l(
        `A certidão só é emitida com todas as declarações entregues e os impostos pagos (ou em prestações autorizadas). É válida por ${meses} meses e pode também ser pedida por via electrónica no portal da Autoridade Tributária (${cite('finCertidaoQuitacao')}). Confirme os emolumentos no balcão.`,
        `The certificate is issued only if all returns are filed and taxes paid (or in approved instalments). It is valid for ${meses} months and can also be requested online. Check the fee at the counter.`,
      ),
    });
    return w;
  },

  personName: (v) => nomeCliente(v, 'contribuinte') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'contribuinte';
    const fim = v.finalidade === 'outro' ? semPonto(v.finalidadeOutra) || 'os fins convenientes' : FIM_TEXTO[v.finalidade] ?? 'os fins convenientes';
    const copias = Math.max(0, Math.round(Number(v.copias) || 0));
    const anexos = anexosList(v);
    const blocks: Block[] = [
      ...requerimentoInicio(v, 'Pedido de certidão de quitação'),
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${requerenteTexto(v, P)}, ${v.mandatario ? `por intermédio do seu mandatário, ${s(v.mandatarioNome) || BLANK}, ` : ''}vem, mui respeitosamente, requerer a V. Ex.ª se digne mandar emitir **certidão de quitação**, comprovativa de que tem a sua situação tributária regularizada, destinada a ${fim}${s(v.referencia) ? `, designadamente ${semPonto(v.referencia)}` : ''}${copias ? `, bem como ${copias === 1 ? 'uma cópia autenticada' : `${copias} cópias autenticadas`}` : ''}.`,
        en: 'The taxpayer requests a tax clearance certificate for the purpose stated.',
      },
    ];
    if (anexos.length) blocks.push({ type: 'annexList', title: 'Junta:', items: anexos });
    blocks.push(
      { type: 'paragraph', id: 'deferimento', text: 'Pede deferimento.', align: 'center', keepWithNext: true, en: 'Requests approval.' },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [assinaturaFiscal(ctx, P, 'O Requerente', 'A Requerente')] },
    );
    return blocks;
  },
});
