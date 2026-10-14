// Declaração de recepção e tomada de conhecimento: the employee confirms
// receiving and reading the internal regulations, code of conduct, policies,
// job description or safety rules. Kept in the personnel file; it does not
// remove the legal right to object to the internal regulations.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, employerName, isF, l, lineItems, localField, placeDate, workerFields, workerSignature } from './_shared';
import { str } from './_rh-politicas';

export default defineTemplate({
  id: 'declaracao-tomada-conhecimento',
  family: 'declaracao',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'documentos', title: l('Documentos recebidos', 'Documents received') },
  ],
  fields: [
    localField(),
    dateField('data'),
    ...workerFields(['nome', 'genero', 'cargo', 'departamento', 'docNumero']),
    {
      name: 'documentos',
      type: 'lines',
      section: 'documentos',
      label: l('Documentos', 'Documents'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [
        { name: 'titulo', type: 'text', label: l('Documento', 'Document') },
        { name: 'versao', type: 'text', label: l('Versão / data', 'Version / date') },
      ],
      default: [
        { titulo: 'Regulamento Interno de Trabalho', versao: '' },
        { titulo: 'Código de Conduta e Ética', versao: '' },
        { titulo: 'Política de Higiene, Saúde e Segurança no Trabalho', versao: '' },
        { titulo: 'Descrição de funções', versao: '' },
      ],
    },
    { name: 'esclarecimentos', type: 'toggle', section: 'documentos', default: true, label: l('Foram explicados ao trabalhador', 'They were explained to the employee'), help: l('Útil quando o trabalhador tem pouca escolaridade: a empresa explicou o conteúdo oralmente.', 'Useful when the employee has limited literacy: the company explained the content orally.') },
    { name: 'linguaExplicacao', type: 'text', section: 'documentos', width: 'half', label: l('Língua da explicação (opcional)', 'Language of explanation (optional)'), placeholder: l('Ex.: changana', 'E.g. Changana'), showIf: (v) => v.esclarecimentos !== false },
  ],

  warnings: () => {
    const w: Warning[] = [];
    w.push({ level: 'info', message: l(`A declaração não afasta o direito do trabalhador de se opor por escrito ao regulamento interno no prazo legal (${cite('regulamentoInterno')}).`, 'This does not remove the employee’s right to object in writing to the internal regulations within the legal period.') });
    return w;
  },
  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.trabalhadorGenero);
    const docs = lineItems(v.documentos).filter((r) => str(r.titulo));
    const empresa = employerName(ctx);
    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Recepção e Tomada de Conhecimento' },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `Eu, **${str(v.trabalhadorNome) || BLANK}**${str(v.trabalhadorDocNumero) ? `, ${f ? 'portadora' : 'portador'} do BI n.º ${str(v.trabalhadorDocNumero)}` : ''}, ${f ? 'trabalhadora' : 'trabalhador'} ${empresa === BLANK ? 'desta empresa' : `de ${empresa}`}${str(v.trabalhadorCargo) ? `, com a função de ${str(v.trabalhadorCargo)}` : ''}${str(v.trabalhadorDepartamento) ? ` (${str(v.trabalhadorDepartamento)})` : ''}, declaro que recebi um exemplar dos documentos a seguir indicados, que os li e que tomei conhecimento do seu conteúdo:`,
        en: 'I confirm I received, read and understood the documents listed.',
        keepWithNext: true,
      },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.08, align: 'center' },
          { label: 'Documento', width: 0.62 },
          { label: 'Versão / data', width: 0.3 },
        ],
        rows: (docs.length ? docs : [{ titulo: BLANK, versao: '' }]).map((r, i) => [String(i + 1), str(r.titulo), str(r.versao) || '—']),
      },
    ];
    if (v.esclarecimentos !== false) {
      blocks.push({ type: 'paragraph', id: 'esclarecimentos', text: `O conteúdo dos documentos foi-me explicado${str(v.linguaExplicacao) ? ` em ${str(v.linguaExplicacao)}` : ''} e foram esclarecidas as dúvidas que coloquei.`, en: 'The content was explained to me and my questions were answered.' });
    }
    blocks.push(
      { type: 'paragraph', id: 'compromisso', text: 'Comprometo-me a cumprir as normas neles contidas, sem prejuízo dos direitos que a lei me confere.', en: 'I undertake to comply with them, without prejudice to my legal rights.', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [workerSignature(v), { role: 'Pelos Recursos Humanos' }] },
    );
    return blocks;
  },
});
