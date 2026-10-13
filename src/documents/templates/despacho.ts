// Despacho: written decision or order of a minister, governor, director or
// other official ("…, ao abrigo do disposto…, determino:").

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, placeDate, splitLines } from './_shared';
import { endDot, estadoRef, estadoWarnings, numeroField, rodapeBlocks, rodapeFields, signatarioColumn, signatarioFields, str, stripNumber } from './_estado';

export default defineTemplate({
  id: 'despacho',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Número e data', 'Number and date') },
    { id: 'fundamento', title: l('Fundamento', 'Grounds') },
    { id: 'decisao', title: l('Decisão', 'Decision') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    {
      name: 'numerado',
      type: 'toggle',
      section: 'documento',
      label: l('Despacho numerado', 'Numbered order'),
      help: l('Os despachos normativos e os que são publicados levam número. Uma decisão simples pode não levar.', 'Normative orders and published ones are numbered. A simple decision may not be.'),
      default: true,
    },
    { ...numeroField(), showIf: (v) => v.numerado !== false },
    localField(),
    dateField('data'),
    { name: 'assunto', type: 'text', section: 'documento', label: l('Assunto (opcional)', 'Subject (optional)'), placeholder: l('Ex.: Criação do Grupo de Trabalho para a Campanha de Vacinação', 'E.g. Setting up the Vaccination Campaign Working Group') },
    {
      name: 'motivo',
      type: 'textarea',
      section: 'fundamento',
      required: true,
      rows: 3,
      label: l('Motivo', 'Reason'),
      placeholder: l('Ex.: Havendo necessidade de assegurar a coordenação das actividades da campanha de vacinação na província', 'E.g. Since the activities of the vaccination campaign need to be coordinated'),
      help: l('Comece por «Havendo necessidade de…», «Tornando-se necessário…» ou «Considerando que…».', 'Start with “Since it is necessary to…” or “Considering that…”.'),
    },
    {
      name: 'fundamentoLegal',
      type: 'text',
      section: 'fundamento',
      label: l('Norma que dá competência', 'Enabling rule'),
      placeholder: l('Ex.: na alínea c) do n.º 1 do artigo … do Decreto n.º …/…', 'E.g. in paragraph (c) of article … of Decree no. …'),
      help: l('Escreva a continuação de «ao abrigo do disposto…». Se ficar vazio, o texto refere «as competências que me são conferidas por lei».', 'Continue “under the provisions of…”. If empty, the text refers to “the powers conferred on me by law”.'),
    },
    {
      name: 'determinacoes',
      type: 'textarea',
      section: 'decisao',
      required: true,
      rows: 6,
      label: l('O que se determina', 'What is ordered'),
      help: l('Um ponto por linha, sem numeração. Ex.: «É criado o Grupo de Trabalho para…», «O Grupo de Trabalho é coordenado por…».', 'One point per line, without numbers.'),
    },
    {
      name: 'vigor',
      type: 'select',
      section: 'decisao',
      width: 'half',
      label: l('Entrada em vigor', 'Entry into force'),
      options: [
        { value: 'imediata', label: l('Imediatamente', 'Immediately') },
        { value: 'assinatura', label: l('Na data da assinatura', 'On signature') },
        { value: 'data', label: l('Numa data', 'On a date') },
        { value: '', label: l('Não indicar', 'Do not state') },
      ],
      default: 'imediata',
    },
    { name: 'vigorData', type: 'date', section: 'decisao', width: 'half', label: l('Data de entrada em vigor', 'Date in force'), showIf: (v) => v.vigor === 'data' },
    {
      name: 'formulaFinal',
      type: 'select',
      section: 'decisao',
      label: l('Fórmula final', 'Final formula'),
      options: [
        { value: 'Registe-se, comunique-se e cumpra-se.', label: l('Registe-se, comunique-se e cumpra-se.', 'Register, communicate and comply.') },
        { value: 'Publique-se.', label: l('Publique-se. (despacho a publicar no Boletim da República)', 'Publish. (order to be published in the gazette)') },
        { value: 'Cumpra-se.', label: l('Cumpra-se.', 'Comply.') },
      ],
      default: 'Registe-se, comunique-se e cumpra-se.',
    },
    ...signatarioFields('assinatura', l('Cargo de quem decide', 'Decision-maker’s position')),
    ...rodapeFields('assinatura', { anexos: false, iniciais: false }),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = estadoWarnings(v, ctx);
    if (!splitLines(v.determinacoes).length) w.push({ level: 'warning', field: 'determinacoes', message: l('Escreva o que se determina.', 'Write what is ordered.') });
    if (!str(v.fundamentoLegal)) {
      w.push({ level: 'info', field: 'fundamentoLegal', message: l('Indique a norma que dá competência para o despacho; a falta de fundamento legal enfraquece o acto.', 'State the rule giving power to decide; a missing legal basis weakens the act.') });
    }
    if (/delega/i.test(`${v.assunto ?? ''} ${v.determinacoes ?? ''}`)) {
      w.push({
        level: 'info',
        field: 'determinacoes',
        message: l(
          `Na delegação de competências indique a norma habilitante e os poderes delegados; os despachos de delegação de alcance geral são publicados no Boletim da República (${cite('delegacaoCompetencias')} — confirmar).`,
          'A delegation must state the enabling rule and the powers delegated; general delegations are published in the official gazette.',
        ),
      });
    }
    return w;
  },

  personName: (v) => v.assunto,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const motivo = str(v.motivo).replace(/[.,;:]+$/, '') || `Havendo necessidade de ${BLANK}`;
    const fundamento = str(v.fundamentoLegal).replace(/[.,;:]+$/, '');
    const ao = fundamento ? `ao abrigo do disposto ${fundamento}` : 'no uso das competências que me são conferidas por lei';
    const pontos = splitLines(v.determinacoes).map((p) => endDot(stripNumber(p)));
    if (!pontos.length) pontos.push(`${BLANK}.`);
    const vigor =
      v.vigor === 'imediata'
        ? 'O presente Despacho entra imediatamente em vigor.'
        : v.vigor === 'assinatura'
          ? 'O presente Despacho entra em vigor na data da sua assinatura.'
          : v.vigor === 'data'
            ? `O presente Despacho entra em vigor no dia ${dateLong(v.vigorData)}.`
            : '';
    if (vigor) pontos.push(vigor);

    const blocks: Block[] = [{ type: 'title', text: 'Despacho', subtitle: v.numerado === false ? undefined : estadoRef(ctx, 'Despacho').replace(/^Despacho n\.º/, 'N.º') }];
    if (str(v.assunto)) blocks.push({ type: 'subject', text: str(v.assunto) });
    blocks.push(
      { type: 'paragraph', id: 'preambulo', text: `${motivo}, ${ao}, determino:`, keepWithNext: true, en: 'Reason and legal basis, followed by “I order:”.' },
      ...pontos.map((p, i): Block => ({ type: 'paragraph', id: `ponto-${i + 1}`, text: `${i + 1}. ${p}`, en: 'Point of the decision.' })),
      { type: 'paragraph', id: 'formula', text: str(v.formulaFinal) || 'Registe-se, comunique-se e cumpra-se.', align: 'left', keepWithNext: true, en: 'Final formula: register, communicate and comply.' },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [signatarioColumn(v)] },
      ...rodapeBlocks(v),
    );
    return blocks;
  },
});
