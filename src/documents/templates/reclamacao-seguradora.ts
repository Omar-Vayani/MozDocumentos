// Reclamação à seguradora: recusa ou atraso da indemnização, valor
// insuficiente, prémio cobrado indevidamente, anulação da apólice.

import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { BLANK, cite, dateLong, l, money, moneyText } from './_shared';
import {
  anexosField, anexosList, assinaturaCliente, cartaInicio, clienteF, clienteFields, clienteWarnings, documentoFields, endDot, entidadeFields, eu, fechoCarta, linhas, lowerFirst,
  nomeCliente, reciboField, s, semPonto, sujeito,
} from './_financas';

const ASSUNTO_OPTIONS: FieldOption[] = [
  { value: 'recusa', label: l('Recusa da indemnização', 'Claim refused') },
  { value: 'atraso', label: l('Atraso na regularização ou no pagamento', 'Delay in settling or paying') },
  { value: 'valor', label: l('Valor da indemnização insuficiente', 'Compensation too low') },
  { value: 'premio', label: l('Prémio ou encargos cobrados indevidamente', 'Premium or charges wrongly billed') },
  { value: 'anulacao', label: l('Anulação ou alteração da apólice sem fundamento', 'Policy cancelled or changed without grounds') },
  { value: 'outro', label: l('Outro', 'Other') },
];

const ASSUNTO_TEXTO: Record<string, string> = {
  recusa: 'recusa de indemnização',
  atraso: 'atraso na regularização do sinistro',
  valor: 'valor da indemnização',
  premio: 'prémio cobrado',
  anulacao: 'anulação da apólice',
  outro: 'contrato de seguro',
};

export default defineTemplate({
  id: 'reclamacao-seguradora',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'cliente', title: l('Quem reclama', 'Complainant'), personRole: 'outro' },
    { id: 'seguradora', title: l('Seguradora', 'Insurer') },
    { id: 'reclamacao', title: l('Reclamação', 'Complaint') },
  ],
  fields: [
    ...documentoFields(),
    ...clienteFields('cliente', 'cliente'),
    {
      name: 'qualidade',
      type: 'radio',
      section: 'cliente',
      label: l('Na qualidade de', 'As'),
      options: [
        { value: 'tomador', label: l('Tomador do seguro / segurado', 'Policyholder / insured') },
        { value: 'lesado', label: l('Lesado (terceiro)', 'Injured third party') },
        { value: 'beneficiario', label: l('Beneficiário', 'Beneficiary') },
      ],
      default: 'tomador',
    },
    ...entidadeFields('seguradora', 'seguradora', 'seguradora'),
    { name: 'apolice', type: 'text', section: 'reclamacao', width: 'half', label: l('Apólice n.º', 'Policy no.') },
    { name: 'processo', type: 'text', section: 'reclamacao', width: 'half', label: l('Processo de sinistro n.º (opcional)', 'Claim no. (optional)') },
    { name: 'assunto', type: 'select', section: 'reclamacao', width: 'half', label: l('Assunto', 'Subject'), options: ASSUNTO_OPTIONS, default: 'atraso' },
    { name: 'dataParticipacao', type: 'date', section: 'reclamacao', width: 'half', label: l('Data da participação (opcional)', 'Claim date (optional)') },
    { name: 'valor', type: 'money', section: 'reclamacao', width: 'half', label: l('Valor reclamado (opcional)', 'Amount claimed (optional)') },
    { name: 'factos', type: 'textarea', section: 'reclamacao', rows: 6, required: true, label: l('O que aconteceu (um facto por linha)', 'What happened (one fact per line)') },
    { name: 'pedido', type: 'textarea', section: 'reclamacao', rows: 2, required: true, label: l('O que pede', 'What you ask for'), help: l('Continua «Solicito…». Ex.: «o pagamento da indemnização de 185.000,00 MT fixada no relatório de peritagem».', 'Continues “I request…”.') },
    { name: 'prazoResposta', type: 'number', section: 'reclamacao', width: 'half', min: 1, max: 90, label: l('Prazo que dá para resposta (dias, opcional)', 'Reply deadline you set (days, optional)') },
    anexosField('reclamacao', l('Ex.: Relatório de peritagem', 'E.g. Inspection report')),
    reciboField('reclamacao'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'cliente')];
    if (!s(v.seguradoraNome)) w.push({ level: 'warning', field: 'seguradoraNome', message: l('Indique a seguradora.', 'Enter the insurer.') });
    if (!linhas(v.factos).length) w.push({ level: 'warning', field: 'factos', message: l('Descreva o que aconteceu.', 'Describe what happened.') });
    w.push({
      level: 'info',
      message: l(
        `Sem resposta satisfatória, pode reclamar à autoridade de supervisão de seguros, juntando esta carta e a resposta recebida, ou recorrer à arbitragem ou ao tribunal (${cite('finSeguroReclamacoes')}).`,
        'If unsatisfied, you can complain to the insurance supervisor, attaching this letter and any reply, or go to arbitration or court.',
      ),
    });
    return w;
  },

  personName: (v) => nomeCliente(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'cliente';
    const f = clienteF(v, P);
    const qual = v.qualidade === 'lesado' ? 'lesad' : v.qualidade === 'beneficiario' ? 'beneficiári' : 'tomador';
    const qualTxt = qual === 'tomador' ? (f ? 'tomadora do seguro' : 'tomador do seguro') : `${qual}${f ? 'a' : 'o'}`;
    const factos = linhas(v.factos);
    const prazo = Number(v.prazoResposta) > 0 ? Math.round(Number(v.prazoResposta)) : 0;
    const refs = [s(v.apolice) ? `apólice n.º ${s(v.apolice)}` : '', s(v.processo) ? `processo n.º ${s(v.processo)}` : ''].filter(Boolean).join(' — ');
    const blocks: Block[] = [
      ...cartaInicio(ctx, P, 'seguradora', `Reclamação — ${ASSUNTO_TEXTO[v.assunto] ?? 'contrato de seguro'}${refs ? ` — ${refs}` : ''}`),
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${sujeito(v, P)}, na qualidade de ${qualTxt}${s(v.apolice) ? ` no âmbito da apólice n.º ${s(v.apolice)}` : ''}${s(v.processo) ? ` e do processo de sinistro n.º ${s(v.processo)}` : ''}${v.dataParticipacao ? `, participado em ${dateLong(v.dataParticipacao)}` : ''}, ${eu(v, P, 'apresento', 'apresenta')} a seguinte reclamação:`,
        en: 'The complainant submits the following complaint.',
        keepWithNext: true,
      },
      { type: 'list', style: 'numeric', items: factos.length ? factos.map(endDot) : [BLANK] },
    ];
    if (money(v.valor) != null) blocks.push({ type: 'paragraph', id: 'valor', text: `Valor reclamado: **${moneyText(v.valor)}**.`, en: 'Amount claimed.' });
    blocks.push(
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Face ao exposto, ${eu(v, P, 'solicito', 'solicita')} ${s(v.pedido) ? endDot(lowerFirst(semPonto(v.pedido).replace(/^(solicito|solicita)\s+/i, ''))) : `${BLANK}.`}`,
        en: 'Request.',
      },
      {
        type: 'paragraph',
        id: 'resposta',
        text: `${eu(v, P, 'Agradeço', 'Agradece-se')} resposta escrita e fundamentada ${prazo ? `no prazo de ${prazo} ${prazo === 1 ? 'dia' : 'dias'}` : 'com a maior brevidade'}. Não sendo a situação resolvida, ${eu(v, P, 'reservo-me', 'a reclamante reserva-se')} o direito de recorrer à autoridade de supervisão de seguros e aos meios judiciais ou arbitrais.`,
        en: 'Please reply in writing; otherwise the complaint may go to the supervisor, arbitration or court.',
      },
    );
    blocks.push(...fechoCarta([assinaturaCliente(ctx, P, { m: 'O Reclamante', f: 'A Reclamante', empresa: s(v.clienteEmpresaNome) || 'A Reclamante' })], { anexos: anexosList(v), recibo: Boolean(v.recibo) }));
    return blocks;
  },
});
