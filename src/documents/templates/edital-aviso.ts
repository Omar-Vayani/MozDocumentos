// Edital / Aviso: public notice by which a body makes a fact, competition,
// consultation or deadline known, posted "nos lugares de estilo" and, where
// needed, published in a newspaper.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, GENERO_OPTIONS, cite, dateField, l, localField, placeDate, splitLines } from './_shared';
import { comArtigo, daOuDo, endDot, estadoRef, estadoWarnings, numeroField, paragraphs, str, stripNumber } from './_estado';

const isEdital = (v: Record<string, unknown>) => v.tipo !== 'aviso';
const lowerFirst = (s: string) => (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

export default defineTemplate({
  id: 'edital-aviso',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Tipo, número e data', 'Type, number and date') },
    { id: 'autoridade', title: l('Autoridade', 'Authority') },
    { id: 'texto', title: l('Texto', 'Text') },
    { id: 'publicidade', title: l('Prazo e afixação', 'Deadline and posting') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'radio',
      section: 'documento',
      label: l('Tipo', 'Type'),
      options: [
        { value: 'edital', label: l('Edital (formal: «… faz saber que…»)', 'Edict (formal: “… makes known that…”)') },
        { value: 'aviso', label: l('Aviso («Torna-se público que…»)', 'Notice (“It is hereby made public that…”)') },
      ],
      default: 'edital',
    },
    { name: 'numerado', type: 'toggle', section: 'documento', label: l('Com número', 'Numbered'), default: true },
    { ...numeroField(), showIf: (v) => v.numerado !== false },
    localField(),
    dateField('data'),
    { name: 'autoridadeNome', type: 'text', section: 'autoridade', width: 'half', label: l('Nome da autoridade', 'Name of the authority'), default: (c) => c.profile?.representanteNome ?? '', showIf: isEdital },
    { name: 'autoridadeGenero', type: 'radio', section: 'autoridade', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    {
      name: 'autoridadeCargo',
      type: 'text',
      section: 'autoridade',
      required: true,
      label: l('Cargo', 'Position'),
      placeholder: l('Ex.: Presidente do Conselho Municipal da Cidade de Nampula', 'E.g. Mayor of Nampula City'),
      help: l('Sem artigo. Aparece na abertura do edital e na assinatura.', 'Without article. Used in the opening and the signature.'),
      default: (c) => c.profile?.representanteCargo ?? '',
    },
    { name: 'assunto', type: 'text', section: 'texto', label: l('Assunto (opcional)', 'Subject (optional)'), placeholder: l('Ex.: Recenseamento de vendedores do Mercado Central', 'E.g. Registration of Central Market vendors') },
    {
      name: 'texto',
      type: 'textarea',
      section: 'texto',
      required: true,
      rows: 7,
      label: l('O que se torna público', 'What is made public'),
      help: l(
        'Escreva a continuação de «faz saber que…» (edital) ou «Torna-se público que…» (aviso). Parágrafos seguintes separados por uma linha em branco.',
        'Continue “makes known that…” (edict) or “It is made public that…” (notice). Further paragraphs separated by a blank line.',
      ),
    },
    {
      name: 'condicoes',
      type: 'textarea',
      section: 'texto',
      rows: 4,
      label: l('Requisitos ou documentos (opcional)', 'Requirements or documents (optional)'),
      help: l('Um por linha. Aparecem numa lista.', 'One per line. Shown as a list.'),
    },
    { name: 'condicoesTitulo', type: 'text', section: 'texto', label: l('Título da lista', 'List heading'), default: 'Os interessados devem apresentar os seguintes documentos:', showIf: (v) => Boolean(str(v.condicoes)) },
    { name: 'prazoDias', type: 'number', section: 'publicidade', width: 'half', min: 0, max: 365, label: l('Prazo em dias (opcional)', 'Deadline in days (optional)') },
    {
      name: 'prazoContagem',
      type: 'select',
      section: 'publicidade',
      width: 'half',
      label: l('Contado a partir da', 'Counted from'),
      options: [
        { value: 'afixação', label: l('Afixação', 'Posting') },
        { value: 'publicação', label: l('Publicação', 'Publication') },
      ],
      default: 'afixação',
    },
    { name: 'localEntrega', type: 'text', section: 'publicidade', label: l('Onde se dirigir (opcional)', 'Where to go (optional)'), placeholder: l('Ex.: Secretaria-Geral do Conselho Municipal, das 7h30 às 15h30', 'E.g. Municipal Council registry') },
    {
      name: 'publicacao',
      type: 'select',
      section: 'publicidade',
      label: l('Publicidade', 'Publicity'),
      options: [
        { value: 'afixacao', label: l('Afixação nos lugares de estilo', 'Posted in the usual places') },
        { value: 'jornal', label: l('Afixação e publicação em jornal', 'Posted and published in a newspaper') },
      ],
      default: 'afixacao',
    },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = estadoWarnings(v, ctx);
    if (!paragraphs(v.texto).length) w.push({ level: 'warning', field: 'texto', message: l('Escreva o que se torna público.', 'Write what is being made public.') });
    if (!str(v.autoridadeCargo)) w.push({ level: 'warning', field: 'autoridadeCargo', message: l('Indique o cargo da autoridade que assina.', 'Enter the signing authority’s position.') });
    if (isEdital(v)) {
      w.push({
        level: 'info',
        message: l(
          `Quando os interessados são desconhecidos ou muitos, a notificação faz-se por edital afixado nos lugares de estilo (${cite('notificacaoEdital')} — confirmar). Registe a data de afixação.`,
          'When those concerned are unknown or many, notice is given by a posted edict. Record the posting date.',
        ),
      });
    }
    return w;
  },

  personName: (v) => v.assunto,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const edital = isEdital(v);
    const nomeTipo = edital ? 'Edital' : 'Aviso';
    const cargo = comArtigo(str(v.autoridadeCargo), v.autoridadeGenero) || BLANK;
    const ps = paragraphs(v.texto);
    const primeiro = ps[0] ? lowerFirst(endDot(ps[0]).replace(/^que\s+/i, '')) : `${BLANK}.`;
    const subtitle = [v.numerado === false ? '' : estadoRef(ctx, `${nomeTipo}`), str(v.assunto)].filter(Boolean).join(' — ') || undefined;

    const abertura = edital
      ? `**${(str(v.autoridadeNome) || BLANK).toLocaleUpperCase('pt')}**, ${cargo.replace(/^(O|A) /, '')}, faz saber que ${primeiro}`
      : `Torna-se público que ${primeiro}`;
    const blocks: Block[] = [
      { type: 'title', text: nomeTipo, subtitle },
      { type: 'paragraph', id: 'abertura', text: abertura, en: edital ? 'The authority makes known the following.' : 'It is hereby made public that…' },
    ];
    ps.slice(1).forEach((p, i) => blocks.push({ type: 'paragraph', id: `texto-${i + 2}`, text: p, en: 'Further text of the notice.' }));

    const cond = splitLines(v.condicoes).map((c) => endDot(stripNumber(c)).replace(/\.$/, ''));
    if (cond.length) {
      blocks.push(
        { type: 'paragraph', id: 'condicoesTitulo', text: str(v.condicoesTitulo) || 'Os interessados devem apresentar os seguintes documentos:', keepWithNext: true, en: 'Those interested must submit the following:' },
        { type: 'list', style: 'alpha', items: cond.map((c, i) => `${c}${i === cond.length - 1 ? '.' : ';'}`) },
      );
    }
    const dias = Number(v.prazoDias);
    const local = str(v.localEntrega).replace(/[.;]+$/, '');
    if (dias > 0 || local) {
      const prazo = dias > 0 ? `no prazo de ${dias} ${dias === 1 ? 'dia' : 'dias'} a contar da data da ${str(v.prazoContagem) || 'afixação'} do presente ${nomeTipo}` : '';
      const texto = [
        'Os interessados devem dirigir-se',
        local ? ` ${/^(à|ao|aos|às|a)\s/i.test(local) ? local : daOuDo(local).replace(/^do /, 'ao ').replace(/^da /, 'à ')}` : '',
        prazo ? `, ${prazo}` : '',
        '.',
      ].join('');
      blocks.push({ type: 'paragraph', id: 'prazo', text: texto, en: 'Where and by when those interested must come forward.' });
    }
    const fecho = edital
      ? `Para constar e para os devidos efeitos, se lavrou o presente Edital e outros de igual teor, que vão ser afixados nos lugares de estilo${v.publicacao === 'jornal' ? ' e publicados num dos jornais de maior circulação' : ''}.`
      : `O presente Aviso é afixado nos lugares de estilo${v.publicacao === 'jornal' ? ' e publicado num dos jornais de maior circulação' : ''}.`;
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: fecho, keepWithNext: true, en: 'This notice is posted in the usual public places.' },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [{ role: cargo, name: str(v.autoridadeNome) || undefined, image: 'both' }],
      },
    );
    return blocks;
  },
});
