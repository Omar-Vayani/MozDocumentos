// Reclamação graciosa: o contribuinte pede à Administração Tributária a
// anulação, total ou parcial, de um acto tributário (liquidação, multa,
// correcção), dirigida ao órgão que o praticou.

import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, money, moneyText, placeDate } from './_shared';
import {
  actoFields, actoTexto, anexosField, anexosList, assinaturaFiscal, clienteFields, clienteWarnings, contrair, destinatarioFiscalFields, endDot, linhas, mandatarioFields,
  nomeCliente, requerenteTexto, requerimentoInicio, s, semPonto,
} from './_financas';

const PEDIDO_OPTIONS: FieldOption[] = [
  { value: 'total', label: l('Anulação total do acto', 'Annul the whole act') },
  { value: 'parcial', label: l('Anulação parcial (indicar o valor)', 'Partial annulment (state the amount)') },
];

export default defineTemplate({
  id: 'reclamacao-graciosa',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'destinatario', title: l('A quem se dirige', 'Addressee') },
    { id: 'contribuinte', title: l('Contribuinte', 'Taxpayer'), personRole: 'outro' },
    { id: 'acto', title: l('Acto reclamado', 'Act challenged') },
    { id: 'fundamentos', title: l('Fundamentos e pedido', 'Grounds and request') },
    { id: 'documento', title: l('Assinatura, local e data', 'Signature, place and date') },
  ],
  fields: [
    ...destinatarioFiscalFields('destinatario'),
    ...clienteFields('contribuinte', 'contribuinte'),
    ...actoFields('acto'),
    {
      name: 'fundamentos',
      type: 'textarea',
      section: 'fundamentos',
      required: true,
      rows: 8,
      label: l('Fundamentos (um artigo por linha)', 'Grounds (one article per line)'),
      help: l(
        'Factos e razões de direito, por ordem. Ex.: o imposto já foi pago (indique o comprovativo); a factura foi correctamente emitida; a liquidação não está fundamentada; o rendimento é isento; houve erro no cálculo.',
        'Facts and legal reasons, in order. E.g. already paid; the invoice was correct; the assessment gives no reasons; the income is exempt; calculation error.',
      ),
    },
    { name: 'pedido', type: 'radio', section: 'fundamentos', label: l('O que pede', 'What you ask for'), options: PEDIDO_OPTIONS, default: 'total' },
    { name: 'valorAnular', type: 'money', section: 'fundamentos', width: 'half', label: l('Valor a anular', 'Amount to annul'), showIf: (v) => v.pedido === 'parcial' },
    { name: 'restituicao', type: 'toggle', section: 'fundamentos', label: l('O imposto já foi pago: pedir a restituição', 'Tax already paid: ask for a refund') },
    { name: 'garantia', type: 'toggle', section: 'fundamentos', label: l('Prestei / vou prestar garantia para suspender a cobrança', 'I gave / will give security to suspend collection') },
    { name: 'garantiaDescricao', type: 'text', section: 'fundamentos', label: l('Garantia', 'Security'), placeholder: l('Ex.: garantia bancária n.º 45/2026 do BCI', 'E.g. bank guarantee no. …'), showIf: (v) => Boolean(v.garantia) },
    anexosField('fundamentos', l('Ex.: Cópia da nota de liquidação', 'E.g. Copy of the assessment')),
    ...mandatarioFields('documento'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...clienteWarnings(v, 'contribuinte')];
    const nuit = v.contribuinteTipo === 'empresa' ? s(v.contribuinteEmpresaNuit) : s(v.contribuinteNuit);
    if (!nuit) w.push({ level: 'warning', field: v.contribuinteTipo === 'empresa' ? 'contribuinteEmpresaNuit' : 'contribuinteNuit', message: l('Indique o NUIT do contribuinte.', 'Enter the taxpayer’s NUIT.') });
    if (!linhas(v.fundamentos).length) w.push({ level: 'warning', field: 'fundamentos', message: l('Escreva os fundamentos da reclamação.', 'Write the grounds.') });
    const dias = ctx.legal.value<{ decisaoDias: number }>('finReclamacaoGraciosa').decisaoDias;
    w.push({
      level: 'warning',
      message: l(
        `Apresente a reclamação dentro do prazo legal contado da notificação: confirme-o na própria nota ou na Direcção de Área Fiscal (${cite('finReclamacaoGraciosa')}). A Administração deve decidir em ${dias} dias; sem decisão, presume-se o indeferimento e pode recorrer hierarquicamente ou ao tribunal fiscal (${cite('finIndeferimentoTacito')}).`,
        `File within the legal period from notification: check it on the notice or at the tax office. The Authority must decide in ${dias} days; without a decision, rejection is presumed and you may appeal or go to the tax court.`,
      ),
    });
    if (!v.garantia) w.push({ level: 'info', field: 'garantia', message: l('A reclamação, por si só, não suspende a cobrança: para evitar a execução fiscal, pague (e peça a restituição) ou preste garantia.', 'The objection alone does not stop collection: pay and ask for a refund, or give security.') });
    return w;
  },

  personName: (v) => nomeCliente(v, 'contribuinte') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'contribuinte';
    const fund = linhas(v.fundamentos);
    const anexos = anexosList(v);
    const valorAnular = money(v.valorAnular);
    const acto = actoTexto(v);
    const blocks: Block[] = [
      ...requerimentoInicio(v, `Reclamação graciosa — ${s(v.imposto) === 'outro' ? s(v.impostoOutro) || 'imposto' : s(v.imposto) || 'imposto'}${s(v.actoNumero) ? ` — n.º ${s(v.actoNumero)}` : ''}`),
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${requerenteTexto(v, P)}, ${v.mandatario ? `por intermédio do seu mandatário, ${s(v.mandatarioNome) || BLANK}, ` : ''}vem apresentar **RECLAMAÇÃO GRACIOSA** ${contrair('de', acto)}, ${v.notificacaoData ? `de que foi ${v.contribuinteTipo === 'empresa' || v.contribuinteGenero === 'F' ? 'notificada' : 'notificado'} em ${dateLong(v.notificacaoData)}` : 'de cuja notificação ainda não decorreu o prazo legal'}, ao abrigo ${cite('finReclamacaoGraciosa').startsWith('art') ? `do ${cite('finReclamacaoGraciosa')}` : `da ${cite('finReclamacaoGraciosa')}`}, com os fundamentos seguintes:`,
        en: 'The taxpayer files an administrative objection to the tax act identified, on the following grounds:',
        keepWithNext: true,
      },
      { type: 'articulado', sections: [{ items: fund.length ? fund.map(endDot) : [BLANK] }] },
    ];
    const pedidos: string[] = [
      v.pedido === 'parcial'
        ? `a anulação parcial ${contrair('de', acto.split(', no valor')[0])}, na parte correspondente a **${valorAnular != null ? moneyText(valorAnular) : `${BLANK} MT`}**`
        : `a anulação ${contrair('de', acto.split(', no valor')[0])}`,
    ];
    if (v.restituicao) pedidos.push('a restituição do imposto indevidamente pago, acrescido dos juros devidos nos termos legais');
    if (v.garantia) pedidos.push(`a suspensão da cobrança coerciva até à decisão final, estando prestada garantia${s(v.garantiaDescricao) ? ` (${semPonto(v.garantiaDescricao)})` : ''}`);
    blocks.push({
      type: 'paragraph',
      id: 'pedido',
      text: `Nestes termos, requer a V. Ex.ª se digne deferir a presente reclamação e, em consequência, ordenar ${pedidos.length > 1 ? `${pedidos.slice(0, -1).join('; ')}; e ${pedidos[pedidos.length - 1]}` : pedidos[0]}.`,
      en: 'The taxpayer asks for the act to be annulled, with a refund and suspension of collection where applicable.',
    });
    if (anexos.length) blocks.push({ type: 'annexList', title: 'Junta:', items: anexos });
    blocks.push(
      { type: 'paragraph', id: 'deferimento', text: 'Pede deferimento.', align: 'center', keepWithNext: true, en: 'Requests approval.' },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [assinaturaFiscal(ctx, P, 'O Reclamante', 'A Reclamante')] },
    );
    return blocks;
  },
});
