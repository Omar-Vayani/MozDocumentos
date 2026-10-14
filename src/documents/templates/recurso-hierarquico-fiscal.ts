// Recurso hierárquico em matéria tributária: da decisão (expressa ou tácita)
// de uma reclamação graciosa ou de outro acto tributário, para o superior
// hierárquico do órgão que decidiu.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, placeDate } from './_shared';
import {
  actoFields, actoTexto, anexosField, anexosList, assinaturaFiscal, clienteFields, clienteWarnings, contrair, destinatarioFiscalFields, endDot, linhas, mandatarioFields,
  nomeCliente, requerenteTexto, requerimentoInicio, s, semPonto,
} from './_financas';

export default defineTemplate({
  id: 'recurso-hierarquico-fiscal',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'destinatario', title: l('A quem se dirige', 'Addressee') },
    { id: 'contribuinte', title: l('Recorrente (contribuinte)', 'Appellant (taxpayer)'), personRole: 'outro' },
    { id: 'acto', title: l('Acto tributário de origem', 'Original tax act') },
    { id: 'decisao', title: l('Decisão recorrida', 'Decision appealed') },
    { id: 'fundamentos', title: l('Fundamentos e pedido', 'Grounds and request') },
    { id: 'documento', title: l('Assinatura, local e data', 'Signature, place and date') },
  ],
  fields: [
    ...destinatarioFiscalFields('destinatario', 'Presidente da Autoridade Tributária de Moçambique').map((f) =>
      f.name === 'entidade'
        ? { ...f, help: l('O superior hierárquico do órgão que decidiu: em regra o Presidente da Autoridade Tributária ou o Director-Geral de Impostos, conforme a competência. Entregue o recurso no serviço que decidiu, que o remete.', 'The superior of the deciding body; file it with the office that decided, which forwards it.') }
        : f,
    ),
    ...clienteFields('contribuinte', 'contribuinte'),
    ...actoFields('acto').map((f) => (f.name === 'notificacaoData' ? { ...f, required: false, label: l('Data da notificação do acto de origem', 'Date the original act was notified') } : f)),
    {
      name: 'origem',
      type: 'radio',
      section: 'decisao',
      label: l('Recorre de', 'Appeal against'),
      options: [
        { value: 'expressa', label: l('Decisão expressa da reclamação graciosa', 'Express decision on the objection') },
        { value: 'tacita', label: l('Falta de decisão no prazo (indeferimento tácito)', 'No decision in time (deemed rejection)') },
        { value: 'directo', label: l('O próprio acto tributário, sem reclamação prévia', 'The tax act itself, no prior objection') },
      ],
      default: 'expressa',
    },
    { name: 'reclamacaoData', type: 'date', section: 'decisao', width: 'half', label: l('Data em que apresentou a reclamação', 'Date the objection was filed'), showIf: (v) => v.origem !== 'directo' },
    { name: 'decisaoNumero', type: 'text', section: 'decisao', width: 'half', label: l('Despacho / ofício n.º', 'Decision / letter no.'), showIf: (v) => v.origem === 'expressa' },
    { name: 'decisaoAutor', type: 'text', section: 'decisao', label: l('Quem decidiu', 'Who decided'), placeholder: l('Ex.: Director da Área Fiscal do 2.º Bairro Fiscal de Maputo', 'E.g. the head of the tax office'), showIf: (v) => v.origem === 'expressa' },
    { name: 'decisaoData', type: 'date', section: 'decisao', width: 'half', label: l('Data da decisão', 'Decision date'), showIf: (v) => v.origem === 'expressa' },
    { name: 'decisaoNotificacao', type: 'date', section: 'decisao', width: 'half', label: l('Notificado da decisão em', 'Notified of the decision on'), showIf: (v) => v.origem === 'expressa' },
    { name: 'fundamentos', type: 'textarea', section: 'fundamentos', required: true, rows: 8, label: l('Fundamentos (um artigo por linha)', 'Grounds (one article per line)'), help: l('Explique porque a decisão está errada: factos não considerados, documentos ignorados, erro de direito, falta de fundamentação.', 'Explain why the decision is wrong.') },
    { name: 'restituicao', type: 'toggle', section: 'fundamentos', label: l('Pedir também a restituição do imposto pago', 'Also ask for a refund of tax paid') },
    anexosField('fundamentos', l('Ex.: Cópia da decisão recorrida', 'E.g. Copy of the decision')),
    ...mandatarioFields('documento'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...clienteWarnings(v, 'contribuinte')];
    if (!linhas(v.fundamentos).length) w.push({ level: 'warning', field: 'fundamentos', message: l('Escreva os fundamentos do recurso.', 'Write the grounds.') });
    const dias = ctx.legal.value<{ decisaoDias: number }>('finRecursoHierarquico').decisaoDias;
    w.push({
      level: 'warning',
      message: l(
        `Interponha o recurso dentro do prazo legal contado da notificação da decisão (ou do fim do prazo de decisão da reclamação). Confirme o prazo e a entidade competente (${cite('finRecursoHierarquico')}). O superior deve decidir em ${dias} dias; da decisão cabe impugnação no tribunal fiscal.`,
        `File within the legal period from notification of the decision. Check the period and the competent authority. The superior must decide in ${dias} days; the decision can be challenged in the tax court.`,
      ),
    });
    return w;
  },

  personName: (v) => nomeCliente(v, 'contribuinte') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'contribuinte';
    const fund = linhas(v.fundamentos);
    const anexos = anexosList(v);
    const acto = actoTexto(v);
    const f = v.contribuinteTipo === 'empresa' || v.contribuinteGenero === 'F';
    let objecto: string;
    if (v.origem === 'tacita') {
      objecto = `do indeferimento tácito da reclamação graciosa apresentada${v.reclamacaoData ? ` em ${dateLong(v.reclamacaoData)}` : ''} contra ${acto}, por não ter sido proferida decisão no prazo legal (${cite('finIndeferimentoTacito')})`;
    } else if (v.origem === 'directo') {
      objecto = contrair('de', acto);
    } else {
      objecto = `da decisão${s(v.decisaoNumero) ? ` n.º ${s(v.decisaoNumero)}` : ''}${s(v.decisaoAutor) ? ` ${contrair('de', /^(o|a)\s/i.test(s(v.decisaoAutor)) ? s(v.decisaoAutor) : `o ${s(v.decisaoAutor)}`)}` : ''}${v.decisaoData ? `, de ${dateLong(v.decisaoData)}` : ''}, que indeferiu a reclamação graciosa${v.reclamacaoData ? ` apresentada em ${dateLong(v.reclamacaoData)}` : ''} contra ${acto}${v.decisaoNotificacao ? `, decisão de que foi ${f ? 'notificada' : 'notificado'} em ${dateLong(v.decisaoNotificacao)}` : ''}`;
    }
    const blocks: Block[] = [
      ...requerimentoInicio(v, `Recurso hierárquico${s(v.actoNumero) ? ` — ${s(v.imposto) === 'outro' ? s(v.impostoOutro) || 'imposto' : s(v.imposto)} n.º ${s(v.actoNumero)}` : ''}`),
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${requerenteTexto(v, P)}, ${v.mandatario ? `por intermédio do seu mandatário, ${s(v.mandatarioNome) || BLANK}, ` : ''}não se conformando, vem interpor **RECURSO HIERÁRQUICO** ${objecto}, com os fundamentos seguintes:`,
        en: 'The taxpayer appeals to the superior authority against the decision identified, on the following grounds:',
        keepWithNext: true,
      },
      { type: 'articulado', sections: [{ items: fund.length ? fund.map(endDot) : [BLANK] }] },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Nestes termos, requer a V. Ex.ª se digne dar provimento ao presente recurso, revogando a decisão recorrida e anulando ${acto.split(', no valor')[0]}${v.restituicao ? ', com a restituição do imposto pago, acrescido dos juros devidos nos termos legais' : ''}.`,
        en: 'The taxpayer asks for the decision to be revoked and the tax act annulled.',
      },
    ];
    if (anexos.length) blocks.push({ type: 'annexList', title: 'Junta:', items: anexos.map(semPonto) });
    blocks.push(
      { type: 'paragraph', id: 'deferimento', text: 'Pede deferimento.', align: 'center', keepWithNext: true, en: 'Requests approval.' },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [assinaturaFiscal(ctx, P, 'O Recorrente', 'A Recorrente')] },
    );
    return blocks;
  },
});
