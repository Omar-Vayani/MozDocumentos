// Carta de anulação de apólice de seguro: não renovação no termo (denúncia)
// ou resolução antecipada (venda do bem, outro seguro), com estorno do prémio.

import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { BLANK, cite, dateLong, l } from './_shared';
import {
  anexosField, anexosList, assinaturaCliente, cartaInicio, clienteF, clienteFields, contrair, clienteWarnings, documentoFields, entidadeFields, eu, fechoCarta, nomeCliente, reciboField, s, semPonto,
  sujeito,
} from './_financas';

const MOTIVO_OPTIONS: FieldOption[] = [
  { value: 'venda', label: l('Venda ou transmissão do bem seguro', 'Sale of the insured item') },
  { value: 'outro-seguro', label: l('Contratei seguro noutra seguradora', 'Insured elsewhere') },
  { value: 'cessacao', label: l('Encerramento da actividade ou do risco', 'Business or risk ended') },
  { value: 'perda', label: l('Perda total ou abate do bem', 'Total loss or scrapping') },
  { value: 'sem-motivo', label: l('Não renovar, sem indicar motivo', 'Non-renewal, no reason given') },
];

const MOTIVO_TEXTO: Record<string, string> = {
  venda: 'a venda do bem seguro',
  'outro-seguro': 'a contratação de seguro noutra seguradora',
  cessacao: 'a cessação da actividade ou do risco seguro',
  perda: 'a perda total do bem seguro',
};

export default defineTemplate({
  id: 'anulacao-apolice-seguro',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'cliente', title: l('Tomador do seguro', 'Policyholder'), personRole: 'outro' },
    { id: 'seguradora', title: l('Seguradora', 'Insurer') },
    { id: 'apolice', title: l('Apólice e anulação', 'Policy and cancellation') },
  ],
  fields: [
    ...documentoFields(),
    ...clienteFields('cliente', 'cliente'),
    ...entidadeFields('seguradora', 'seguradora', 'seguradora'),
    { name: 'apolice', type: 'text', section: 'apolice', width: 'half', required: true, label: l('Apólice n.º', 'Policy no.') },
    { name: 'objecto', type: 'text', section: 'apolice', width: 'half', label: l('Objecto seguro', 'Insured item'), placeholder: l('Ex.: a viatura AGH 123 MC; a moradia da Rua das Acácias, n.º 45', 'E.g. vehicle …; house …'), help: l('Comece com o artigo: «a viatura…», «o armazém…».', 'Start with the article.') },
    { name: 'modalidade', type: 'radio', section: 'apolice', label: l('Quando', 'When'), options: [{ value: 'termo', label: l('No fim do período em curso (não renovar)', 'At the end of the current period (no renewal)') }, { value: 'data', label: l('A partir de uma data', 'From a given date') }], default: 'termo' },
    { name: 'dataTermo', type: 'date', section: 'apolice', width: 'half', label: l('Fim do período / data da anulação', 'End of period / cancellation date') },
    { name: 'motivo', type: 'select', section: 'apolice', width: 'half', label: l('Motivo', 'Reason'), options: MOTIVO_OPTIONS, default: 'sem-motivo' },
    { name: 'estorno', type: 'toggle', section: 'apolice', default: true, label: l('Pedir a devolução do prémio do período não decorrido', 'Ask for a refund of the unexpired premium'), showIf: (v) => v.modalidade === 'data' },
    { name: 'nib', type: 'text', section: 'apolice', width: 'half', label: l('NIB para a devolução', 'NIB for the refund'), showIf: (v) => v.modalidade === 'data' && Boolean(v.estorno) },
    { name: 'cancelarDebito', type: 'toggle', section: 'apolice', default: true, label: l('Cancelar o débito directo do prémio', 'Cancel the premium direct debit') },
    anexosField('apolice', l('Ex.: Cópia da declaração de venda da viatura', 'E.g. Copy of the vehicle sale document')),
    reciboField('apolice'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'cliente')];
    if (!s(v.apolice)) w.push({ level: 'warning', field: 'apolice', message: l('Indique o número da apólice.', 'Enter the policy number.') });
    w.push({
      level: 'warning',
      message: l(
        `Envie a carta com a antecedência fixada nas condições da apólice para a não renovação; sem ela, o seguro renova-se e o prémio é devido (${cite('finSeguroCessacao')}). O seguro de responsabilidade civil automóvel é obrigatório: não anule o de uma viatura que continua a circular sem ter outro seguro.`,
        'Send the letter within the notice period in the policy; otherwise it renews and the premium is due. Motor third-party insurance is compulsory: do not cancel it for a car still in use without other cover.',
      ),
    });
    return w;
  },

  personName: (v) => nomeCliente(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'cliente';
    const termo = v.modalidade !== 'data';
    const motivo = MOTIVO_TEXTO[v.motivo];
    const tom = clienteF(v, P) ? 'tomadora' : 'tomador';
    const blocks: Block[] = [
      ...cartaInicio(ctx, P, 'seguradora', `${termo ? 'Denúncia (não renovação)' : 'Anulação'} da apólice n.º ${s(v.apolice) || BLANK}`),
      {
        type: 'paragraph',
        id: 'pedido',
        text: termo
          ? `${sujeito(v, P)}, ${tom} do seguro titulado pela apólice n.º ${s(v.apolice) || BLANK}${s(v.objecto) ? `, relativo ${contrair('a', semPonto(v.objecto))}` : ''}, ${eu(v, P, 'comunico', 'comunica')} que ${eu(v, P, 'não pretendo', 'não pretende')} a renovação do contrato, que deve cessar no termo do período em curso${v.dataTermo ? `, em ${dateLong(v.dataTermo)}` : ''}${motivo ? `, em virtude de ${motivo}` : ''}.`
          : `${sujeito(v, P)}, ${tom} do seguro titulado pela apólice n.º ${s(v.apolice) || BLANK}${s(v.objecto) ? `, relativo ${contrair('a', semPonto(v.objecto))}` : ''}, ${eu(v, P, 'solicito', 'solicita')} a anulação do contrato com efeitos a partir de ${dateLong(v.dataTermo)}${motivo ? `, em virtude de ${motivo}` : ''}.`,
        en: termo ? 'The policyholder gives notice not to renew the policy at the end of the current period.' : 'The policyholder asks to cancel the policy from the date given.',
      },
    ];
    const extras: string[] = [];
    if (!termo && v.estorno) extras.push(`a devolução da parte do prémio correspondente ao período não decorrido${s(v.nib) ? `, por transferência para a conta com o NIB ${s(v.nib)}` : ''}`);
    if (v.cancelarDebito) extras.push('o cancelamento da autorização de débito directo do prémio, sem cobrança de novos prémios');
    extras.push('a confirmação escrita da cessação do contrato');
    blocks.push({
      type: 'paragraph',
      id: 'extras',
      text: `${eu(v, P, 'Solicito', 'Solicita')} ainda ${extras.length > 1 ? `${extras.slice(0, -1).join(', ')} e ${extras[extras.length - 1]}` : extras[0]}.`,
      en: 'Further requests: premium refund, cancellation of the direct debit and written confirmation.',
    });
    blocks.push(...fechoCarta([assinaturaCliente(ctx, P, { m: 'O Tomador do Seguro', f: 'A Tomadora do Seguro', empresa: s(v.clienteEmpresaNome) || 'A Tomadora do Seguro' })], { anexos: anexosList(v), recibo: Boolean(v.recibo) }));
    return blocks;
  },
});
