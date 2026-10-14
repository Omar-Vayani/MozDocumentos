// Oposição ao pagamento (revogação) de cheques extraviados, roubados ou
// obtidos de forma fraudulenta, e anulação de cheques em branco.

import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, lineItems, money } from './_shared';
import { formatDateShort } from '@/lib/format';
import {
  anexosField, anexosList, assinaturaCliente, cartaInicio, clienteFields, clienteWarnings, contaFields, contaTexto, deEntidade, documentoFields, entidadeFields, eu,
  fechoCarta, nomeCliente, reciboField, s, semPonto, sujeito,
} from './_financas';

const MOTIVO_OPTIONS: FieldOption[] = [
  { value: 'extravio', label: l('Extravio', 'Lost') },
  { value: 'roubo', label: l('Roubo ou furto', 'Stolen') },
  { value: 'falsificacao', label: l('Falsificação ou viciação', 'Forged or altered') },
  { value: 'fraude', label: l('Obtido por fraude ou coacção', 'Obtained by fraud or duress') },
];

/** [singular, plural] */
const MOTIVO_TEXTO: Record<string, [string, string]> = {
  extravio: ['se extraviou', 'se extraviaram'],
  roubo: ['foi roubado', 'foram roubados'],
  falsificacao: ['foi objecto de falsificação ou viciação', 'foram objecto de falsificação ou viciação'],
  fraude: ['foi obtido de forma fraudulenta', 'foram obtidos de forma fraudulenta'],
};

export default defineTemplate({
  id: 'oposicao-pagamento-cheque',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'cliente', title: l('Titular da conta (sacador)', 'Account holder (drawer)'), personRole: 'outro' },
    { id: 'banco', title: l('Banco', 'Bank') },
    { id: 'cheques', title: l('Cheques', 'Cheques') },
  ],
  fields: [
    ...documentoFields(),
    ...clienteFields('cliente', 'cliente'),
    ...entidadeFields('banco', 'banco', 'banco'),
    ...contaFields('cheques', { required: true }),
    {
      name: 'cheques',
      type: 'lines',
      section: 'cheques',
      label: l('Cheques', 'Cheques'),
      addLabel: l('Adicionar cheque', 'Add cheque'),
      help: l('Para uma série de cheques em branco, escreva o intervalo no número (ex.: 0045012 a 0045025) e deixe o valor vazio.', 'For a series of blank cheques, write the range and leave the amount empty.'),
      columns: [
        { name: 'numero', type: 'text', label: l('N.º do cheque', 'Cheque no.') },
        { name: 'data', type: 'date', label: l('Data de emissão (se preenchido)', 'Issue date (if filled in)') },
        { name: 'valor', type: 'money', label: l('Valor (se preenchido)', 'Amount (if filled in)') },
        { name: 'beneficiario', type: 'text', label: l('Beneficiário (se preenchido)', 'Payee (if filled in)') },
      ],
      default: [],
    },
    { name: 'motivo', type: 'select', section: 'cheques', required: true, label: l('Motivo', 'Reason'), options: MOTIVO_OPTIONS, default: 'extravio' },
    { name: 'dataConhecimento', type: 'date', section: 'cheques', width: 'half', label: l('Data em que deu pela falta', 'Date you noticed') },
    { name: 'participacaoPolicial', type: 'text', section: 'cheques', label: l('Participação à polícia (esquadra e número, opcional)', 'Police report (optional)') },
    { name: 'circunstancias', type: 'textarea', section: 'cheques', rows: 3, label: l('Circunstâncias (opcional)', 'Circumstances (optional)') },
    anexosField('cheques'),
    reciboField('cheques'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'cliente')];
    if (!s(v.bancoNome)) w.push({ level: 'warning', field: 'bancoNome', message: l('Indique o banco.', 'Enter the bank.') });
    if (!lineItems(v.cheques).some((r) => s(r.numero))) w.push({ level: 'warning', field: 'cheques', message: l('Indique o número dos cheques.', 'Enter the cheque numbers.') });
    w.push({
      level: 'warning',
      message: l(
        `Use este pedido só para cheques extraviados, roubados, falsificados ou obtidos por fraude. Revogar um cheque entregue legitimamente para não pagar uma dívida, ou emitir cheque sem provisão, pode constituir crime (${cite('finChequeRevogacao')}).`,
        'Use this only for lost, stolen, forged or fraudulently obtained cheques. Stopping a cheque given legitimately to avoid paying, or writing a bad cheque, may be a crime.',
      ),
    });
    if ((v.motivo === 'roubo' || v.motivo === 'fraude') && !s(v.participacaoPolicial)) {
      w.push({ level: 'info', field: 'participacaoPolicial', message: l('Participe o facto à polícia e junte a cópia: o banco pode exigi-la.', 'Report it to the police and attach a copy: the bank may require it.') });
    }
    return w;
  },

  personName: (v) => nomeCliente(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'cliente';
    const cheques = lineItems(v.cheques).filter((r) => s(r.numero) || money(r.valor) != null);
    const varios = cheques.length !== 1 || /\sa\s|-/.test(s(cheques[0]?.numero));
    const blocks: Block[] = [
      ...cartaInicio(ctx, P, 'banco', `Oposição ao pagamento de ${varios ? 'cheques' : 'cheque'} — conta n.º ${s(v.contaNumero) || BLANK}`),
      {
        type: 'paragraph',
        id: 'comunicacao',
        text: `${sujeito(v, P)}, titular da ${contaTexto(v)} ${deEntidade(s(v.bancoNome), 'desse banco')}, ${eu(v, P, 'comunico', 'comunica')} que ${varios ? 'os cheques abaixo identificados, sacados sobre essa conta,' : 'o cheque abaixo identificado, sacado sobre essa conta,'} ${(MOTIVO_TEXTO[v.motivo] ?? MOTIVO_TEXTO.extravio)[varios ? 1 : 0]}${v.dataConhecimento ? `, facto de que ${eu(v, P, 'tive', 'teve')} conhecimento em ${dateLong(v.dataConhecimento)}` : ''}:`,
        en: 'The drawer reports that the cheques below were lost, stolen, forged or fraudulently obtained.',
        keepWithNext: true,
      },
      {
        type: 'table',
        columns: [
          { label: 'Cheque n.º', width: 1.6 },
          { label: 'Data', width: 1.1 },
          { label: 'Beneficiário', width: 2.4 },
          { label: 'Valor (MT)', width: 1.3, align: 'right' },
        ],
        rows: (cheques.length ? cheques : [{}]).map((r: Record<string, any>) => [
          s(r.numero) || BLANK,
          s(r.data) ? formatDateShort(s(r.data)) : '—',
          s(r.beneficiario) || '—',
          money(r.valor) != null ? formatMoney(money(r.valor), false) : '—',
        ]),
      },
    ];
    if (s(v.circunstancias)) blocks.push({ type: 'paragraph', id: 'circunstancias', text: `Circunstâncias: ${semPonto(v.circunstancias)}.`, en: 'Circumstances.' });
    if (s(v.participacaoPolicial)) blocks.push({ type: 'paragraph', id: 'policia', text: `O facto foi participado às autoridades policiais (${semPonto(v.participacaoPolicial)}), cuja cópia se junta.`, en: 'Reported to the police; copy attached.' });
    blocks.push({
      type: 'paragraph',
      id: 'pedido',
      text: `Nestes termos, ${eu(v, P, 'solicito', 'solicita')} que o banco recuse o pagamento ${varios ? 'dos referidos cheques' : 'do referido cheque'}, se ${varios ? 'forem apresentados' : 'for apresentado'} a pagamento ou a compensação, registando a oposição pelo motivo indicado, e que ${eu(v, P, 'me', 'a')} informe de imediato de qualquer tentativa de apresentação.`,
      en: 'Request that the bank refuse payment if presented and report any attempt to present them.',
    });
    blocks.push({
      type: 'paragraph',
      id: 'responsabilidade',
      text: `${eu(v, P, 'Declaro', 'Declara')} que as informações prestadas são verdadeiras e ${eu(v, P, 'assumo', 'assume')} a responsabilidade pelos efeitos da oposição perante terceiros portadores de boa-fé.`,
      en: 'The drawer declares the information true and accepts responsibility towards good-faith holders.',
    });
    blocks.push(...fechoCarta([assinaturaCliente(ctx, P, { m: 'O Titular', f: 'A Titular', empresa: s(v.clienteEmpresaNome) || 'A Titular' })], { anexos: anexosList(v), recibo: Boolean(v.recibo) }));
    return blocks;
  },
});
