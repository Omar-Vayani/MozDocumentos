// Declaração de agregado familiar: the neighbourhood structure lists the people
// who live with the head of household (scholarships, school enrolment, social
// support, employer allowances, dependants' claims).

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, g, l, lineItems, localField } from './_shared';
import {
  PARENTESCO_OPTIONS,
  assinaturaBlocks,
  assinaturaFields,
  avisoTaxa,
  comunidadeWarnings,
  enderecoBairro,
  finalidadeField,
  finalidadeFrase,
  identificacao,
  neste,
  notaBlocks,
  numeroComunidadeField,
  numeroRef,
  pessoaFields,
  str,
  unidadeField,
  validadeField,
  validadeTexto,
} from './_comunidade';

export default defineTemplate({
  id: 'declaracao-agregado-familiar',
  family: 'declaracao',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Declaração', 'Declaration') },
    { id: 'cidadao', title: l('Chefe do agregado', 'Head of household'), personRole: 'outro' },
    { id: 'membros', title: l('Membros do agregado', 'Household members') },
    { id: 'finalidade', title: l('Finalidade', 'Purpose') },
    { id: 'assinatura', title: l('Assinatura e confirmações', 'Signature and confirmations') },
  ],
  fields: [
    numeroComunidadeField(),
    unidadeField(),
    localField(),
    dateField('data'),
    validadeField(),
    ...pessoaFields(['nome', 'genero', 'nacionalidade', 'estadoCivil', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'quarteirao', 'casa', 'rua']),
    {
      name: 'membros',
      type: 'lines',
      section: 'membros',
      required: true,
      label: l('Pessoas que vivem com o chefe do agregado', 'People living with the head of household'),
      help: l('Não inclua o chefe do agregado; ele já está identificado acima.', 'Do not include the head of household, already identified above.'),
      addLabel: l('Adicionar pessoa', 'Add person'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'parentesco', type: 'select', label: l('Parentesco', 'Relationship'), options: PARENTESCO_OPTIONS.filter((o) => o.value !== 'chefe do agregado') },
        { name: 'nascimento', type: 'date', label: l('Data de nascimento', 'Date of birth') },
        { name: 'documento', type: 'text', label: l('Documento (opcional)', 'ID (optional)') },
        { name: 'ocupacao', type: 'text', label: l('Ocupação', 'Occupation') },
      ],
      default: [],
    },
    finalidadeField('finalidade', l('Ex.: candidatura a bolsa de estudo', 'E.g. scholarship application')),
    ...assinaturaFields(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = comunidadeWarnings(v, ctx);
    if (!lineItems(v.membros).some((r) => str(r.nome))) w.push({ level: 'warning', field: 'membros', message: l('Acrescente as pessoas do agregado.', 'Add the household members.') });
    w.push({ level: 'info', message: l('Os dados dos menores servem só o fim indicado; não entregue cópias a terceiros.', 'Children’s data serve the stated purpose only; do not hand copies to third parties.') });
    w.push(avisoTaxa);
    return w;
  },

  personName: (v) => v.cidadaoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const gen = v.cidadaoGenero;
    const end = enderecoBairro(v);
    const membros = lineItems(v.membros).filter((r) => str(r.nome));
    const rows = [
      [`1`, str(v.cidadaoNome) || BLANK, 'Chefe do agregado', '', str(v.cidadaoDocNumero), ''],
      ...membros.map((r, i) => [String(i + 2), str(r.nome), str(r.parentesco), r.nascimento ? dateLong(r.nascimento) : '', str(r.documento), str(r.ocupacao)]),
    ];
    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Agregado Familiar', subtitle: str(v.numero) ? numeroRef(ctx) : undefined },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `Declara-se, para os devidos efeitos, que ${identificacao(v)}, residente ${neste(str(v.unidade))}${end ? `, ${end}` : ''}, é chefe de um agregado familiar composto por ${membros.length + 1} ${membros.length ? 'pessoas' : 'pessoa'}, que vivem em comunhão de mesa e habitação, a saber:`,
        keepWithNext: true,
        en: 'It is declared that the person named heads a household made up of the people listed, who live and eat together.',
      },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.4, align: 'center' },
          { label: 'Nome', width: 3 },
          { label: 'Parentesco', width: 1.5 },
          { label: 'Nascimento', width: 1.6 },
          { label: 'Documento', width: 1.5 },
          { label: 'Ocupação', width: 1.4 },
        ],
        rows: rows.map((r) => r.map((c) => c || '—')),
      },
      {
        type: 'paragraph',
        id: 'fecho',
        text: `Por ser verdade e a pedido ${g(gen, 'do interessado', 'da interessada')}, passa-se a presente declaração, ${finalidadeFrase(v)}, que vai assinada e autenticada com o carimbo em uso. ${validadeTexto(v)}`.trim(),
        keepWithNext: true,
        en: 'Issued at the person’s request for the stated purpose, signed and stamped.',
      },
      ...assinaturaBlocks(ctx),
      ...notaBlocks(gen),
    ];
    return blocks;
  },
});
