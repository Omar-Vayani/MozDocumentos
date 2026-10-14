import { defineTemplate, type Block } from '../model';
import { cite, dateField, l, lawyerFields, localField, splitLines } from './_shared';
import { artigos, courtAddressee, nomeParte, parteF } from './_advocacia';
import { QUALIDADE_PC, QUALIDADE_PC_OPTIONS, closing, lawyerWarnings, parteNome, processoFields, sem, str } from './_processo-civil';

export default defineTemplate({
  id: 'alegacoes-de-direito',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e processo', 'Court and case') },
    { id: 'partes', title: l('Partes', 'Parties') },
    { id: 'alegacoes', title: l('Alegações', 'Submissions') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...processoFields('tribunal'),
    ...parteNome('parte', 'partes', 'Parte que alega (o seu cliente)', 'Party (your client)', 'empresa'),
    { name: 'qualidade', type: 'select', section: 'partes', width: 'half', label: l('Posição no processo', 'Role in the case'), options: QUALIDADE_PC_OPTIONS, default: 'autor' },
    ...parteNome('contraria', 'partes', 'Parte contrária (opcional)', 'Other party (optional)', 'empresa', false),
    {
      name: 'factosProvados',
      type: 'textarea',
      section: 'alegacoes',
      rows: 6,
      label: l('Factos provados relevantes (um por linha)', 'Relevant proven facts (one per line)'),
      help: l('Os factos dados como assentes e as respostas à matéria de facto que favorecem o seu cliente.', 'The settled facts that favour your client.'),
    },
    {
      name: 'direito',
      type: 'textarea',
      section: 'alegacoes',
      rows: 8,
      required: true,
      label: l('Argumentação jurídica (um parágrafo por linha)', 'Legal argument (one paragraph per line)'),
      help: l('Interpretação e aplicação da lei aos factos provados; doutrina e jurisprudência.', 'Interpretation and application of the law to the proven facts.'),
    },
    { name: 'conclusao', type: 'text', section: 'alegacoes', label: l('Conclusão pedida', 'Conclusion sought'), placeholder: l('Ex.: ser a acção julgada procedente e a Ré condenada no pedido', 'E.g. uphold the claim'), help: l('Completa «… deve …».', 'Completes “… should …”.') },
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => [
    { level: 'info', message: l(`${cite('pcAlegacoesDireito')}: confirme se as alegações são orais ou escritas e o prazo fixado no despacho.`, 'Confirm whether submissions are oral or written and the time limit set by the judge.') },
    ...lawyerWarnings(v),
  ],

  personName: (v) => v.parteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const q = QUALIDADE_PC[v.qualidade as string] ?? QUALIDADE_PC.autor;
    const f = parteF(v, 'parte');
    const papel = f ? q.f : q.m;
    const contraPapel = parteF(v, 'contraria') ? q.cf : q.cm;
    const contra = str(v.contrariaNome) ? `, em que é ${contraPapel} ${nomeParte(v, 'contraria')}` : '';
    const tipo = str(v.tipoAccao) || '____________________';
    const autor = v.qualidade === 'autor' || v.qualidade === 'requerente' || v.qualidade === 'exequente';
    const provados = splitLines(v.factosProvados).map((s) => (/[.:;]$/.test(s) ? s : `${s}.`));
    const sections = [
      ...(provados.length ? [{ heading: 'I — Da matéria de facto provada', items: provados }] : []),
      { heading: `${provados.length ? 'II' : 'I'} — Do direito`, items: artigos(v.direito).length ? artigos(v.direito) : ['____________________'] },
    ];
    const conclusao = sem(v.conclusao) || (autor ? 'ser a acção julgada procedente, por provada, com as legais consequências' : 'ser a acção julgada improcedente, por não provada, com a absolvição do pedido');
    const blocks: Block[] = [
      { type: 'courtHeader', processo: str(v.processoNumero) || '________/______', extra: str(v.seccao) || undefined, addressee: courtAddressee(v) },
      {
        type: 'paragraph',
        id: 'identificacao',
        text: `${nomeParte(v, 'parte')}, ${papel} nos autos de ${tipo}${contra}, e neles melhor ${f ? 'identificada' : 'identificado'}, vem, por intermédio do seu mandatário judicial, apresentar as suas`,
        en: 'The party files its',
      },
      { type: 'paragraph', id: 'titulo', align: 'center', text: '**ALEGAÇÕES DE DIREITO**,', en: 'LEGAL SUBMISSIONS' },
      { type: 'paragraph', id: 'termos', text: 'o que faz nos termos seguintes:', en: 'as follows:' },
      { type: 'articulado', sections },
      ...closing(ctx, {
        intro: `Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, deve ${conclusao}.`,
        introEn: 'On these grounds, the court should decide as requested.',
        fecho: 'Assim se fará JUSTIÇA!',
      }),
    ];
    return blocks;
  },
});
