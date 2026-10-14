// Minuta de testamento: prepares a will for the notary. Two forms:
// - testamento cerrado: the testator signs this text and initials every page,
//   then takes it to the notary, who approves it (auto de aprovação); it is not
//   valid before that approval;
// - testamento público: the text is only a draft for the notary, who writes the
//   will in the notarial book.
// A printed, signed document without the notary is not a valid will.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, isF, l, lineItems, localField, splitLines } from './_shared';
import { identificacao, pessoaFields } from './_pessoal-rh';
import { itensLista, semPonto, str } from './_familia';

const KEYS = ['nome', 'genero', 'estadoCivil', 'nacionalidade', 'naturalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada'] as const;

const DISPOSICOES_TIPO = [
  { value: 'herdeiro', label: l('Herdeiro de uma parte da quota disponível', 'Heir to a share of the free part') },
  { value: 'legado', label: l('Legado de um bem determinado', 'Bequest of a specific asset') },
];

export default defineTemplate({
  id: 'minuta-de-testamento',
  family: 'declaracao',
  official: 'notario',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Forma e data', 'Form and date') },
    { id: 'testador', title: l('Testador', 'Testator'), description: l('Os dados vêm do seu perfil pessoal.', 'Details come from your personal profile.'), personRole: 'outro' },
    { id: 'familia', title: l('Família (herdeiros legitimários)', 'Family (forced heirs)') },
    { id: 'disposicoes', title: l('Disposições', 'Dispositions') },
    { id: 'outras', title: l('Outras disposições', 'Other provisions') },
  ],
  fields: [
    {
      name: 'forma',
      type: 'radio',
      section: 'documento',
      required: true,
      label: l('Forma do testamento', 'Form of the will'),
      options: [
        { value: 'cerrado', label: l('Testamento cerrado (assino e levo ao notário para aprovar)', 'Closed will (I sign it and take it to the notary for approval)') },
        { value: 'publico', label: l('Minuta para testamento público (o notário escreve)', 'Draft for a public will (the notary writes it)') },
      ],
      default: 'cerrado',
      legal: l('Sem a intervenção do notário, o documento não vale como testamento.', 'Without the notary the document is not a valid will.'),
    },
    localField(),
    dateField('data', 'documento', l('Data', 'Date')),
    ...pessoaFields('testador', 'testador', { profile: true, keys: KEYS }),
    { name: 'testadorPai', type: 'text', section: 'testador', width: 'half', label: l('Nome do pai', 'Father’s name') },
    { name: 'testadorMae', type: 'text', section: 'testador', width: 'half', label: l('Nome da mãe', 'Mother’s name') },
    { name: 'conjugeNome', type: 'text', section: 'familia', label: l('Cônjuge ou companheiro(a) da união de facto (opcional)', 'Spouse or de facto partner (optional)') },
    {
      name: 'conjugeRelacao',
      type: 'radio',
      section: 'familia',
      label: l('Relação', 'Relationship'),
      options: [
        { value: 'casado', label: l('Casamento', 'Marriage') },
        { value: 'uniao', label: l('União de facto', 'De facto union') },
      ],
      default: 'casado',
      showIf: (v) => Boolean(str(v.conjugeNome)),
    },
    {
      name: 'filhos',
      type: 'lines',
      section: 'familia',
      label: l('Filhos', 'Children'),
      addLabel: l('Adicionar filho', 'Add child'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome completo', 'Full name') },
        { name: 'genero', type: 'select', label: l('Sexo', 'Sex'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }] },
        { name: 'nascimento', type: 'date', label: l('Data de nascimento', 'Date of birth') },
      ],
      default: [],
    },
    {
      name: 'disposicoes',
      type: 'lines',
      section: 'disposicoes',
      required: true,
      label: l('Deixo a', 'I leave to'),
      addLabel: l('Adicionar disposição', 'Add disposition'),
      help: l('Só pode dispor livremente da quota disponível. A parte reservada aos filhos, ao cônjuge e ao companheiro (legítima) segue a lei.', 'You may freely dispose only of the free share. The part reserved to children, spouse and partner follows the law.'),
      columns: [
        { name: 'tipo', type: 'select', label: l('Tipo', 'Type'), options: DISPOSICOES_TIPO },
        { name: 'beneficiario', type: 'text', label: l('Beneficiário (nome e BI)', 'Beneficiary (name and ID)') },
        { name: 'objecto', type: 'text', label: l('Parte ou bem', 'Share or asset'), placeholder: l('Ex.: metade da quota disponível; a viatura AFJ 123 MC', 'E.g. half of the free share; the car …') },
      ],
      default: [{ tipo: 'legado', beneficiario: '', objecto: '' }],
    },
    { name: 'testamenteiro', type: 'text', section: 'outras', label: l('Testamenteiro (opcional)', 'Executor (optional)'), help: l('Pessoa que fica encarregada de cumprir o testamento.', 'Person in charge of carrying out the will.') },
    { name: 'tutor', type: 'text', section: 'outras', label: l('Tutor para os filhos menores (opcional)', 'Guardian for minor children (optional)'), help: l('Pessoa que indica para tutor se o outro progenitor não puder exercer o poder parental. O tribunal decide.', 'Person you name as guardian if the other parent cannot act. The court decides.') },
    { name: 'outras', type: 'textarea', section: 'outras', rows: 3, label: l('Outras disposições (opcional)', 'Other provisions (optional)'), help: l('Uma por linha. Ex.: desejo ser sepultado no cemitério de Lhanguene.', 'One per line. E.g. burial wishes.') },
    { name: 'revoga', type: 'toggle', section: 'outras', default: true, label: l('Revogo testamentos anteriores', 'Revoke earlier wills') },
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: 'error',
        message: l(
          `Um testamento só é válido com a intervenção do notário (${cite('famTestamentoFormas')}). ${v.forma === 'cerrado' ? 'Assine o texto, rubrique todas as folhas e leve-o ao notário com o BI, para o auto de aprovação. Até lá não é testamento.' : 'Leve esta minuta ao notário com o BI: o notário lavra o testamento público no livro de notas, na presença de testemunhas, se exigidas.'}`,
          `A will is valid only with a notary. ${v.forma === 'cerrado' ? 'Sign, initial every page and take it to the notary for approval. Until then it is not a will.' : 'Take this draft to the notary, who writes the public will in the notarial book.'}`,
        ),
      },
      {
        level: 'warning',
        field: 'disposicoes',
        message: l(
          `Os filhos, o cônjuge e o companheiro da união de facto têm direito à legítima (${cite('famLegitima')}); disposições que a ofendam são reduzidas. Consulte um advogado ou o IPAJ antes de ir ao notário.`,
          'Children, spouse and de facto partner are entitled to a reserved share; gifts that encroach on it are reduced. Get legal advice first.',
        ),
      },
    ];
    if (!str(v.testadorNome)) w.push({ level: 'error', field: 'testadorNome', message: l('Indique o nome do testador.', 'Enter the testator’s name.') });
    return w;
  },

  personName: (v) => v.testadorNome || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.testadorGenero);
    const cerrado = v.forma === 'cerrado';
    const filhos = lineItems(v.filhos).filter((r) => str(r.nome));
    const disp = lineItems(v.disposicoes).filter((r) => str(r.beneficiario) || str(r.objecto));
    const filiacao = [str(v.testadorPai), str(v.testadorMae)].filter(Boolean);
    const outras = splitLines(v.outras);

    const blocks: Block[] = [
      { type: 'tags', items: [cerrado ? 'PARA APROVAÇÃO NOTARIAL' : 'MINUTA — SEM VALOR DE TESTAMENTO'] },
      { type: 'title', text: cerrado ? 'Testamento cerrado' : 'Minuta de testamento público', subtitle: cerrado ? 'Só é válido depois de aprovado pelo notário' : 'Para entrega ao notário' },
      {
        type: 'paragraph',
        id: 'identificacao',
        text: `Eu, ${identificacao(v, 'testador')}${filiacao.length ? `, ${f ? 'filha' : 'filho'} de ${filiacao.join(' e de ')}` : ''}, no pleno uso das minhas faculdades mentais e de livre vontade, faço o meu testamento ${cerrado ? 'cerrado' : 'público'} nos termos seguintes:`,
        en: 'I, the testator named above, of sound mind and free will, make my will as follows:',
      },
    ];

    const pontos: string[] = [];
    if (v.revoga) pontos.push('Revogo todos os testamentos e disposições de última vontade que tenha feito anteriormente.');
    const familia = [
      str(v.conjugeNome) ? `${v.conjugeRelacao === 'uniao' ? 'vivo em união de facto' : f ? 'sou casada' : 'sou casado'} com ${semPonto(v.conjugeNome)}` : '',
      filhos.length ? `tenho ${filhos.length === 1 ? 'um filho' : `${filhos.length} filhos`}: ${filhos.map((r) => `${str(r.nome)}${str(r.nascimento) ? `, ${isF(r.genero) ? 'nascida' : 'nascido'} a ${dateLong(r.nascimento)}` : ''}`).join('; ')}` : 'não tenho filhos',
    ].filter(Boolean);
    pontos.push(`${familia.join('; ').replace(/^./, (x) => x.toUpperCase())}.`);
    pontos.push('Respeitando a legítima dos meus herdeiros legitimários, disponho da minha quota disponível da forma seguinte:');
    blocks.push({ type: 'list', style: 'numeric', items: pontos });
    blocks.push({
      type: 'list',
      style: 'alpha',
      items: itensLista(
        (disp.length ? disp : [{ tipo: 'legado', beneficiario: BLANK, objecto: BLANK }]).map((r) =>
          r.tipo === 'herdeiro'
            ? `Instituo herdeiro(a) ${semPonto(r.beneficiario) || BLANK} de ${semPonto(r.objecto) || BLANK}`
            : `Lego a ${semPonto(r.beneficiario) || BLANK} ${semPonto(r.objecto) || BLANK}`,
        ),
      ),
    });
    const finais: string[] = [];
    if (str(v.testamenteiro)) finais.push(`Nomeio testamenteiro(a) ${semPonto(v.testamenteiro)}, a quem peço que cumpra este testamento.`);
    if (str(v.tutor)) finais.push(`Para o caso de os meus filhos menores ficarem sem quem exerça o poder parental, indico para tutor(a) ${semPonto(v.tutor)}.`);
    finais.push(...outras.map((s) => `${semPonto(s)}.`));
    if (finais.length) blocks.push({ type: 'list', style: 'bullet', items: finais });

    if (cerrado) {
      blocks.push(
        {
          type: 'paragraph',
          id: 'fecho',
          text: `Este testamento, que assinei e de que rubriquei todas as folhas, contém a minha última vontade e será apresentado ao notário para aprovação.`,
          en: 'This will, signed and initialled on every page by me, contains my last wishes and will be presented to the notary for approval.',
          keepWithNext: true,
        },
        { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [{ role: f ? 'A Testadora' : 'O Testador', name: str(v.testadorNome) || undefined }], keepWithNext: true },
        { type: 'box', label: 'Reservado ao notário — auto de aprovação', lines: 5, dashed: true },
      );
    } else {
      blocks.push({
        type: 'note',
        text: 'Minuta preparada pelo testador para o notário lavrar o testamento público no livro de notas. Não assinar: este documento não é um testamento.',
        en: 'Draft for the notary to write the public will. Do not sign: this document is not a will.',
      });
    }
    return blocks;
  },
});

