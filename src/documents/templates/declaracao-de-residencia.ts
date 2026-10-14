// Declaração de residência issued by the neighbourhood structure (secretário or
// chefe do bairro, chefe de quarteirão) or a community leader, at the
// resident's request. Evidence only: it does not replace the municipal or
// administrative atestado when the receiving body demands one.

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

const mesAno = (ym: unknown) => {
  const s = str(ym);
  if (!/^\d{4}-\d{2}$/.test(s)) return '';
  return dateLong(`${s}-01`).replace(/^1\.?º? de |^\d+ de /, '');
};

export default defineTemplate({
  id: 'declaracao-de-residencia',
  family: 'declaracao',
  official: 'estado',
  page: 'A5',
  sections: [
    { id: 'documento', title: l('Declaração', 'Declaration') },
    { id: 'cidadao', title: l('Morador', 'Resident'), personRole: 'outro' },
    { id: 'residencia', title: l('Residência', 'Residence') },
    { id: 'finalidade', title: l('Finalidade', 'Purpose') },
    { id: 'assinatura', title: l('Assinatura e confirmações', 'Signature and confirmations') },
  ],
  fields: [
    {
      name: 'tipoDeclaracao',
      type: 'radio',
      section: 'documento',
      label: l('O que se declara', 'What is declared'),
      options: [
        { value: 'actual', label: l('Reside no bairro', 'Lives in the neighbourhood') },
        { value: 'mudanca', label: l('Mudou-se do bairro (transferência)', 'Moved out (transfer)') },
      ],
      default: 'actual',
    },
    numeroComunidadeField(),
    unidadeField(),
    localField(),
    dateField('data'),
    validadeField(),
    ...pessoaFields(['nome', 'genero', 'pai', 'mae', 'nascimento', 'naturalidade', 'nacionalidade', 'estadoCivil', 'docTipo', 'docNumero', 'docEmissao', 'docLocal']),
    ...pessoaFields(['quarteirao', 'casa', 'rua'], 'cidadao', 'residencia'),
    {
      name: 'desde',
      type: 'month',
      section: 'residencia',
      width: 'half',
      required: true,
      label: l('Reside no bairro desde', 'Living here since'),
    },
    { name: 'ate', type: 'month', section: 'residencia', width: 'half', label: l('Saiu do bairro em', 'Moved out in'), showIf: (v) => v.tipoDeclaracao === 'mudanca' },
    {
      name: 'novoEndereco',
      type: 'text',
      section: 'residencia',
      label: l('Novo endereço', 'New address'),
      placeholder: l('Ex.: Bairro de Laulane, Quarteirão n.º 5, Cidade de Maputo', 'E.g. new neighbourhood and city'),
      showIf: (v) => v.tipoDeclaracao === 'mudanca',
    },
    {
      name: 'nadaConsta',
      type: 'toggle',
      section: 'residencia',
      label: l('Acrescentar «nada consta nesta estrutura contra o seu comportamento»', 'Add “nothing is recorded against the person”'),
      showIf: (v) => v.tipoDeclaracao === 'mudanca',
      default: true,
    },
    {
      name: 'agregado',
      type: 'lines',
      section: 'residencia',
      label: l('Agregado familiar (opcional)', 'Household (optional)'),
      help: l('Só se a entidade de destino o pedir. Para uma lista completa use a «Declaração de Agregado Familiar».', 'Only if the receiving body asks. For a full list use the household declaration.'),
      addLabel: l('Adicionar pessoa', 'Add person'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'parentesco', type: 'select', label: l('Parentesco', 'Relationship'), options: PARENTESCO_OPTIONS },
        { name: 'idade', type: 'number', label: l('Idade', 'Age') },
      ],
      default: [],
      showIf: (v) => v.tipoDeclaracao !== 'mudanca',
    },
    finalidadeField(),
    {
      name: 'destino',
      type: 'text',
      section: 'finalidade',
      label: l('A apresentar a (opcional)', 'To be presented to (optional)'),
      placeholder: l('Ex.: Banco Comercial e de Investimentos', 'E.g. a bank'),
    },
    ...assinaturaFields(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = comunidadeWarnings(v, ctx);
    if (!str(v.cidadaoDocNumero)) w.push({ level: 'warning', field: 'cidadaoDocNumero', message: l('Indique o documento de identificação do morador; sem ele a declaração vale pouco.', 'Enter the resident’s ID document; without it the declaration carries little weight.') });
    if (!str(v.desde)) w.push({ level: 'warning', field: 'desde', message: l('Indique desde quando o morador reside no bairro.', 'Enter since when the person has lived here.') });
    else {
      const [y, m] = str(v.desde).split('-').map(Number);
      const [ty, tm] = str(v.data || ctx.today).split('-').map(Number);
      const meses = (ty - y) * 12 + (tm - m);
      if (meses >= 0 && meses < 6) {
        w.push({
          level: 'info',
          field: 'desde',
          message: l(
            'Residência recente: alguns municípios exigem vários meses de residência para o atestado de residência.',
            'Recent residence: some municipalities require several months of residence for the municipal certificate.',
          ),
        });
      }
    }
    w.push({
      level: 'info',
      message: l(
        'Esta declaração é um meio de prova e não substitui o atestado de residência do Posto Administrativo ou do Município quando a entidade o exigir.',
        'This declaration is evidence and does not replace the administrative or municipal residence certificate when it is required.',
      ),
    });
    w.push(avisoTaxa);
    return w;
  },

  personName: (v) => v.cidadaoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const gen = v.cidadaoGenero;
    const unidade = str(v.unidade);
    const end = enderecoBairro(v);
    const desde = mesAno(v.desde) || BLANK;
    const mudanca = v.tipoDeclaracao === 'mudanca';

    const corpo = mudanca
      ? `Para os devidos efeitos, declara-se que ${identificacao(v)}, residiu ${neste(unidade)}${end ? `, ${end}` : ''}, desde ${desde} até ${mesAno(v.ate) || BLANK}, tendo-se mudado para ${str(v.novoEndereco) || BLANK}.`
      : `Para os devidos efeitos, declara-se que ${identificacao(v)}, reside ${neste(unidade)}${end ? `, ${end}` : ''}, desde ${desde}.`;

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Residência', subtitle: str(v.numero) ? numeroRef(ctx) : undefined },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: corpo,
        en: mudanca ? 'It is declared that the person named lived in this neighbourhood during the period stated and moved to the new address.' : 'It is declared that the person named lives in this neighbourhood, at the address stated, since the date given.',
      },
    ];

    if (mudanca && v.nadaConsta) {
      blocks.push({
        type: 'paragraph',
        id: 'nada-consta',
        text: `Durante esse período, nada consta nesta estrutura que desabone o comportamento ${g(gen, 'do interessado', 'da interessada')}.`,
        en: 'During that period nothing was recorded against the person’s conduct.',
      });
    }

    const agregado = mudanca ? [] : lineItems(v.agregado).filter((r) => str(r.nome));
    if (agregado.length) {
      blocks.push({
        type: 'paragraph',
        id: 'agregado-intro',
        text: "Vive com o seguinte agregado familiar:",
        en: 'Lives with the following household:',
        keepWithNext: true,
      });
      blocks.push({
        type: 'table',
        columns: [
          { label: 'Nome', width: 3 },
          { label: 'Parentesco', width: 1.6 },
          { label: 'Idade', width: 0.8, align: 'center' },
        ],
        rows: agregado.map((r) => [str(r.nome), str(r.parentesco) || '—', str(r.idade) || '—']),
      });
    }

    const destino = str(v.destino);
    blocks.push({
      type: 'paragraph',
      id: 'fecho',
      text: `A presente declaração é passada a pedido ${g(gen, 'do interessado', 'da interessada')}, ${finalidadeFrase(v)}${destino ? `, a apresentar ${/^(ao|à|aos|às|a)\s/i.test(destino) ? '' : 'a '}${destino}` : ''}, e vai assinada e autenticada com o carimbo em uso. ${validadeTexto(v)}`.trim(),
      keepWithNext: true,
      en: 'Issued at the person’s request for the stated purpose, signed and stamped. Validity as stated.',
    });
    blocks.push(...assinaturaBlocks(ctx));
    blocks.push(...notaBlocks(gen));
    return blocks;
  },
});
