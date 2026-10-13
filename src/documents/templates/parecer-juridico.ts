import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, lawyerFields, lawyerSignature, localField, placeDate, refField, splitLines } from './_shared';

const trim = (s: unknown) => String(s ?? '').trim();
const ponto = (s: string) => (/[.:;!?]$/.test(s) ? s : `${s}.`);

export default defineTemplate({
  id: 'parecer-juridico',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Número, local e data', 'Number, place and date') },
    { id: 'consulta', title: l('Consulta', 'Request') },
    { id: 'factos', title: l('Factos e documentos', 'Facts and documents') },
    { id: 'analise', title: l('Direito e análise', 'Law and analysis') },
    { id: 'conclusoes', title: l('Conclusões', 'Conclusions') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
  ],
  fields: [
    { ...refField(), label: l('Parecer n.º', 'Opinion no.') },
    localField(),
    dateField('data'),
    { name: 'confidencial', type: 'toggle', section: 'documento', default: true, label: l('Marcar como confidencial', 'Mark as confidential') },
    {
      name: 'pessoa',
      type: 'radio',
      section: 'documento',
      label: l('Escrever em nome de', 'Write as'),
      default: 'plural',
      options: [
        { value: 'plural', label: l('Escritório («o nosso parecer»)', 'The firm (“our opinion”)') },
        { value: 'singular', label: l('Advogado («o meu parecer»)', 'The lawyer (“my opinion”)') },
      ],
    },
    { name: 'consulente', type: 'text', section: 'consulta', required: true, label: l('Consulente (quem pede o parecer)', 'Client requesting the opinion'), personKey: 'nome' },
    { name: 'assunto', type: 'text', section: 'consulta', required: true, label: l('Assunto', 'Subject'), placeholder: l('Ex.: Validade da cláusula de não concorrência no contrato de trabalho do Director Comercial', 'E.g. validity of a non-compete clause') },
    {
      name: 'questao',
      type: 'textarea',
      section: 'consulta',
      rows: 3,
      required: true,
      label: l('Questão colocada', 'Question asked'),
      help: l('Completa «Solicita-nos o Consulente parecer sobre a seguinte questão: …».', 'Completes “The client asks for an opinion on the following question: …”.'),
    },
    { name: 'factos', type: 'textarea', section: 'factos', rows: 6, label: l('Factos relevantes (um por linha)', 'Relevant facts (one per line)') },
    { name: 'documentos', type: 'textarea', section: 'factos', rows: 3, label: l('Documentos analisados (um por linha)', 'Documents reviewed (one per line)') },
    { name: 'enquadramento', type: 'textarea', section: 'analise', rows: 5, label: l('Enquadramento jurídico (um parágrafo por linha)', 'Legal framework (one paragraph per line)'), help: l('Legislação e jurisprudência aplicáveis.', 'Applicable law and case law.') },
    { name: 'analise', type: 'textarea', section: 'analise', rows: 8, required: true, label: l('Análise (um parágrafo por linha)', 'Analysis (one paragraph per line)') },
    { name: 'conclusoes', type: 'textarea', section: 'conclusoes', rows: 4, required: true, label: l('Conclusões (uma por linha)', 'Conclusions (one per line)') },
    ...lawyerFields('advogado'),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (splitLines(v.conclusoes).length === 0) w.push({ level: 'warning', field: 'conclusoes', message: l('Escreva pelo menos uma conclusão.', 'Write at least one conclusion.') });
    w.push({
      level: 'info',
      message: l(
        'A consulta jurídica é um acto próprio de advogado. Indique os factos e documentos em que o parecer se baseia: se forem incompletos, as conclusões podem não se aplicar.',
        'Legal advice is a lawyer’s reserved act. State the facts and documents relied on: if they are incomplete, the conclusions may not apply.',
      ),
    });
    return w;
  },

  personName: (v) => v.consulente,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const nos = v.pessoa !== 'singular';
    const factos = splitLines(v.factos).map(ponto);
    const docs = splitLines(v.documentos).map((s) => s.replace(/[.;]$/, ''));
    const enquadramento = splitLines(v.enquadramento).map(ponto);
    const analise = splitLines(v.analise).map(ponto);
    const conclusoes = splitLines(v.conclusoes).map((s) => s.replace(/[.;]$/, ''));
    let n = 0;
    const sec = (t: string) => `${['I', 'II', 'III', 'IV', 'V', 'VI'][n++]} — ${t}`;

    const blocks: Block[] = [];
    if (v.confidencial) blocks.push({ type: 'tags', items: ['Confidencial'] });
    blocks.push(
      { type: 'title', text: 'Parecer jurídico', subtitle: trim(v.ref) ? `N.º ${trim(v.ref)}` : undefined },
      {
        type: 'keyValue',
        columns: 1,
        items: [
          { label: 'Consulente', value: trim(v.consulente) || BLANK },
          { label: 'Assunto', value: trim(v.assunto) || BLANK },
          { label: 'Data', value: dateLong(v.data) },
        ],
      },
      { type: 'heading', text: sec('Da consulta') },
      {
        type: 'paragraph',
        id: 'consulta',
        text: `Solicita-${nos ? 'nos' : 'me'} o Consulente parecer sobre a seguinte questão: ${ponto(trim(v.questao).replace(/\n+/g, ' ') || BLANK)}`,
        en: 'The client asks for an opinion on the following question.',
      },
    );
    if (factos.length || docs.length) {
      blocks.push({ type: 'heading', text: sec('Dos factos') });
      blocks.push({
        type: 'paragraph',
        id: 'factosIntro',
        text: `Para efeitos do presente parecer, ${nos ? 'tomámos' : 'tomei'} em consideração os factos e documentos a seguir indicados, cuja veracidade e completude se presumem.`,
        en: 'For this opinion we relied on the facts and documents below, presumed true and complete.',
      });
      if (factos.length) blocks.push({ type: 'list', style: 'numeric', items: factos });
      if (docs.length) blocks.push({ type: 'annexList', title: 'Documentos analisados', items: docs });
    }
    if (enquadramento.length) {
      blocks.push({ type: 'heading', text: sec('Do enquadramento jurídico') });
      enquadramento.forEach((t, i) => blocks.push({ type: 'paragraph', id: `enquadramento${i + 1}`, text: t, en: 'Legal framework.' }));
    }
    blocks.push({ type: 'heading', text: sec('Da análise') });
    (analise.length ? analise : [BLANK]).forEach((t, i) => blocks.push({ type: 'paragraph', id: `analise${i + 1}`, text: t, en: 'Analysis.' }));
    blocks.push(
      { type: 'heading', text: sec('Das conclusões') },
      { type: 'paragraph', id: 'conclusoesIntro', text: `Face ao exposto, ${nos ? 'concluímos' : 'concluo'} que:`, en: 'In view of the above, we conclude that:', keepWithNext: true },
      { type: 'list', style: 'alpha', items: (conclusoes.length ? conclusoes : [BLANK]).map((s, i, a) => `${s}${i === a.length - 1 ? '.' : ';'}`) },
      {
        type: 'paragraph',
        id: 'fecho',
        text: `É este, salvo melhor opinião, o ${nos ? 'nosso' : 'meu'} parecer.`,
        en: 'This is our opinion, subject to any better view.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [lawyerSignature(v)] },
      {
        type: 'note',
        text: 'O presente parecer destina-se exclusivamente ao Consulente, baseia-se na legislação em vigor e nos factos indicados à data da sua emissão e não pode ser utilizado para outros fins sem autorização.',
        en: 'This opinion is solely for the client, is based on the law in force and the facts stated at its date, and may not be used for other purposes without consent.',
      },
    );
    return blocks;
  },
});
