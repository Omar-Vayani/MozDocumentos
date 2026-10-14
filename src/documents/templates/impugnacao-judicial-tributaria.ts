// Impugnação judicial de acto tributário (recurso contencioso tributário) no
// tribunal fiscal, subscrita por advogado.

import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, lawyerFields, lawyerSignature, localField, money, placeDate } from './_shared';
import { courtAddressee, courtFields, juntaText, linePara, moneyExt, testemunhasList } from './_advocacia';
import { actoFields, actoTexto, clienteFields, clienteWarnings, contrair, endDot, linhas, nomeCliente, requerenteTexto, s, semPonto } from './_financas';

const VICIO_OPTIONS: FieldOption[] = [
  { value: 'quantificacao', label: l('Erro nos factos ou na quantificação', 'Error in facts or amounts') },
  { value: 'fundamentacao', label: l('Falta de fundamentação', 'No statement of reasons') },
  { value: 'audicao', label: l('Falta de audição prévia do contribuinte', 'Taxpayer not heard beforehand') },
  { value: 'caducidade', label: l('Caducidade do direito à liquidação', 'Assessment time-barred') },
  { value: 'incompetencia', label: l('Incompetência do autor do acto', 'Act issued by an incompetent body') },
  { value: 'inexistencia', label: l('Inexistência do facto tributário / isenção', 'No taxable event / exemption') },
];

const VICIO_TEXTO: Record<string, string> = {
  quantificacao: 'erro sobre os pressupostos de facto e na quantificação da matéria tributável',
  fundamentacao: 'falta de fundamentação',
  audicao: 'preterição do direito de audição do contribuinte',
  caducidade: 'caducidade do direito à liquidação',
  incompetencia: 'incompetência do autor do acto',
  inexistencia: 'inexistência do facto tributário',
};

export default defineTemplate({
  id: 'impugnacao-judicial-tributaria',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal', 'Court') },
    { id: 'impugnante', title: l('Impugnante (contribuinte)', 'Claimant (taxpayer)'), personRole: 'cliente' },
    { id: 'acto', title: l('Acto impugnado', 'Act challenged') },
    { id: 'peca', title: l('Factos, direito e pedido', 'Facts, law and relief') },
    { id: 'prova', title: l('Prova e garantia', 'Evidence and security') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...courtFields('tribunal').map((f) =>
      f.name === 'tribunal'
        ? { ...f, default: 'Tribunal Fiscal da Cidade de Maputo', placeholder: l('Ex.: Tribunal Fiscal da Província de Sofala', 'E.g. Tax Court of Sofala'), help: l('O tribunal fiscal da área do serviço que praticou o acto. Confirme a designação e a competência territorial.', 'The tax court for the area of the office that issued the act.') }
        : f,
    ),
    ...clienteFields('impugnante', 'impugnante', { contactos: false }),
    { name: 'servico', type: 'text', section: 'acto', required: true, label: l('Serviço que praticou o acto', 'Office that issued the act'), placeholder: l('Ex.: Direcção da Área Fiscal do 1.º Bairro Fiscal de Maputo', 'E.g. the tax office') },
    ...actoFields('acto'),
    {
      name: 'graciosa',
      type: 'radio',
      section: 'acto',
      label: l('Houve reclamação ou recurso antes?', 'Prior objection or appeal?'),
      options: [
        { value: 'nao', label: l('Não', 'No') },
        { value: 'indeferida', label: l('Sim, indeferida expressamente', 'Yes, expressly rejected') },
        { value: 'tacita', label: l('Sim, sem decisão no prazo', 'Yes, no decision in time') },
      ],
      default: 'nao',
    },
    { name: 'graciosaDescricao', type: 'text', section: 'acto', label: l('Reclamação / recurso e decisão', 'Objection / appeal and decision'), placeholder: l('Ex.: reclamação graciosa de 3 de Junho de 2026, indeferida por despacho de 2 de Setembro de 2026, notificado em 10 de Setembro', 'E.g. objection of 3 June 2026, rejected on …'), showIf: (v) => v.graciosa !== 'nao' },
    { name: 'factos', type: 'textarea', section: 'peca', required: true, rows: 8, label: l('I — Factos (um artigo por linha)', 'I — Facts (one article per line)') },
    { name: 'vicios', type: 'select', section: 'peca', label: l('Ilegalidade principal', 'Main ground of illegality'), options: VICIO_OPTIONS, default: 'quantificacao' },
    { name: 'direito', type: 'textarea', section: 'peca', rows: 6, label: l('II — Direito (um artigo por linha)', 'II — Law (one article per line)'), help: l('Desenvolva a ilegalidade e cite as normas aplicáveis do código do imposto e da Lei Geral Tributária.', 'Develop the illegality and cite the applicable provisions.') },
    { name: 'pedidoRestituicao', type: 'toggle', section: 'peca', label: l('Pedir a restituição do imposto pago, com juros', 'Ask for a refund with interest') },
    { name: 'documentos', type: 'textarea', section: 'prova', rows: 3, label: l('Documentos (um por linha)', 'Documents (one per line)'), default: 'Cópia da notificação do acto impugnado\nCópia da nota de liquidação' },
    { name: 'testemunhas', type: 'textarea', section: 'prova', rows: 3, label: l('Testemunhas (nome e morada, uma por linha)', 'Witnesses (name and address, one per line)') },
    { name: 'garantia', type: 'toggle', section: 'prova', label: l('Prestou garantia para suspender a execução fiscal', 'Security given to suspend enforcement') },
    { name: 'garantiaDescricao', type: 'text', section: 'prova', label: l('Garantia', 'Security'), placeholder: l('Ex.: garantia bancária n.º 45/2026 do BCI', 'E.g. bank guarantee'), showIf: (v) => Boolean(v.garantia) },
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'impugnante')];
    if (!linhas(v.factos).length) w.push({ level: 'warning', field: 'factos', message: l('Escreva os factos.', 'Write the facts.') });
    if (!s(v.advogadoCarteira)) w.push({ level: 'warning', field: 'advogadoCarteira', message: l('Indique a carteira profissional do advogado.', 'Enter the lawyer’s bar number.') });
    w.push({
      level: 'warning',
      message: l(
        `Confirme o prazo de impugnação, o tribunal fiscal competente e as custas antes de apresentar; a impugnação não suspende a cobrança sem garantia (${cite('finImpugnacaoJudicial')}). Junte procuração forense e duplicados.`,
        'Check the filing deadline, the competent tax court and fees; filing does not suspend collection without security. Attach the power of attorney and copies.',
      ),
    });
    return w;
  },

  personName: (v) => nomeCliente(v, 'impugnante') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'impugnante';
    const acto = actoTexto(v);
    const f = v.impugnanteTipo === 'empresa' || v.impugnanteGenero === 'F';
    const factos = linhas(v.factos);
    const direito = linhas(v.direito);
    const docs = linhas(v.documentos);
    const test = testemunhasList(v.testemunhas);
    const vicio = VICIO_TEXTO[v.vicios] ?? VICIO_TEXTO.quantificacao;
    const servico = semPonto(v.servico) || BLANK;
    const tempestividade =
      v.graciosa === 'indeferida'
        ? `O acto foi objecto de ${semPonto(v.graciosaDescricao) || BLANK}, pelo que a presente impugnação é tempestiva.`
        : v.graciosa === 'tacita'
          ? `O acto foi objecto de ${semPonto(v.graciosaDescricao) || BLANK}, sem que tenha sido proferida decisão no prazo legal, presumindo-se o seu indeferimento (${cite('finIndeferimentoTacito')}).`
          : `${f ? 'A Impugnante foi notificada' : 'O Impugnante foi notificado'} do acto em ${dateLong(v.notificacaoData)}, pelo que a presente impugnação é tempestiva.`;
    const valor = money(v.actoValor);
    const actoCurto = acto.split(', no valor')[0];
    const fem = /^a /.test(acto);
    const blocks: Block[] = [
      { type: 'courtHeader', addressee: courtAddressee(v) },
      {
        type: 'paragraph',
        id: 'identificacao',
        text: `${requerenteTexto(v, P)}, vem, por intermédio do seu mandatário judicial, deduzir **IMPUGNAÇÃO JUDICIAL** ${contrair('de', acto)}, ${fem ? 'praticada' : 'praticado'} pela ${servico.replace(/^(a|pela)\s+/i, '')}, sendo Impugnada a Fazenda Pública, nos termos e com os fundamentos seguintes:`,
        en: 'The taxpayer, through counsel, challenges the tax act identified in court, against the Treasury, on the following grounds:',
      },
      {
        type: 'articulado',
        sections: [
          { heading: 'I — DO ACTO IMPUGNADO E DA TEMPESTIVIDADE', items: [`${f ? 'A Impugnante' : 'O Impugnante'} foi ${f ? 'notificada' : 'notificado'} ${contrair('de', acto)}.`, tempestividade] },
          { heading: 'II — DOS FACTOS', items: factos.length ? factos.map(endDot) : [BLANK] },
          {
            heading: 'III — DO DIREITO',
            items: [`O acto impugnado enferma de ilegalidade, por ${vicio}.`, ...direito.map(endDot), 'Devendo, por isso, ser anulado.'],
          },
        ],
      },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Nestes termos e nos melhores de Direito, que V. Ex.ª doutamente suprirá, deve a presente impugnação ser julgada procedente, por provada, e, em consequência, ser ${fem ? 'anulada' : 'anulado'} ${actoCurto}${v.pedidoRestituicao ? ', condenando-se a Fazenda Pública a restituir o imposto pago, acrescido dos juros devidos nos termos legais' : ''}, com as legais consequências.`,
        en: 'The court is asked to annul the act and order a refund with interest where applicable.',
      },
      {
        type: 'paragraph',
        id: 'requer',
        text: `Requer ainda a citação do representante da Fazenda Pública e a requisição do processo administrativo ao serviço que praticou o acto${v.garantia ? `, bem como a suspensão da execução fiscal, estando prestada garantia (${semPonto(v.garantiaDescricao) || BLANK})` : ''}.`,
        en: 'The claimant also asks for service on the Treasury’s representative and the administrative file to be produced.',
      },
    ];
    if (test.length) blocks.push({ type: 'heading', text: 'Rol de testemunhas' }, { type: 'list', style: 'numeric', items: test.map(endDot) });
    blocks.push(
      linePara('valor', 'Valor', valor != null ? `${moneyExt(v.actoValor)}.` : `${BLANK} MT.`, 'Value of the claim.'),
      linePara('junta', 'Junta', `${juntaText({ procuracao: true, documentos: docs.length })}.`, 'Enclosures.', true),
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [lawyerSignature(v)] },
    );
    if (docs.length) blocks.push({ type: 'annexList', title: 'Documentos juntos', items: docs });
    return blocks;
  },
});
