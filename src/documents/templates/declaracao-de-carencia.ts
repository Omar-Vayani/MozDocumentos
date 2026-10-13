// Declaração de carência económica ("atestado de pobreza"): the neighbourhood
// structure states the facts it knows about a household's lack of means, to
// support a request for fee exemption, legal aid or social support. The
// receiving body decides whether it also needs the local administration's visto.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, g, l, localField, moneyText } from './_shared';
import {
  assinaturaBlocks,
  assinaturaFields,
  avisoTaxa,
  comunidadeWarnings,
  enderecoBairro,
  finalidadeFrase,
  identificacao,
  neste,
  notaBlocks,
  numeroComunidadeField,
  numeroRef,
  pessoaFields,
  str,
  unidadeField,
} from './_comunidade';

const SITUACOES = [
  { value: 'viuvez', label: l('Viúvo(a)', 'Widowed'), m: 'é viúvo', f: 'é viúva' },
  { value: 'idoso', label: l('Pessoa idosa', 'Elderly person'), m: 'é pessoa idosa', f: 'é pessoa idosa' },
  { value: 'deficiencia', label: l('Pessoa com deficiência', 'Person with a disability'), m: 'é pessoa com deficiência', f: 'é pessoa com deficiência' },
  { value: 'doenca', label: l('Doença crónica', 'Chronic illness'), m: 'sofre de doença crónica', f: 'sofre de doença crónica' },
  { value: 'deslocado', label: l('Deslocado(a)', 'Displaced person'), m: 'é deslocado', f: 'é deslocada' },
  { value: 'desemprego', label: l('Sem emprego', 'Unemployed'), m: 'encontra-se sem emprego', f: 'encontra-se sem emprego' },
  { value: 'orfao', label: l('Órfão / órfã', 'Orphan'), m: 'é órfão', f: 'é órfã' },
  { value: 'chefeMenor', label: l('Criança chefe de agregado', 'Child head of household'), m: 'é menor e chefe de agregado', f: 'é menor e chefe de agregado' },
];

export default defineTemplate({
  id: 'declaracao-de-carencia',
  family: 'declaracao',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Declaração', 'Declaration') },
    { id: 'cidadao', title: l('Morador', 'Resident'), personRole: 'outro' },
    { id: 'situacao', title: l('Situação do agregado', 'Household situation') },
    { id: 'finalidade', title: l('Finalidade', 'Purpose') },
    { id: 'assinatura', title: l('Assinatura e confirmações', 'Signature and confirmations') },
  ],
  fields: [
    numeroComunidadeField(),
    unidadeField(),
    localField(),
    dateField('data'),
    ...pessoaFields(['nome', 'genero', 'pai', 'mae', 'nascimento', 'idade', 'nacionalidade', 'estadoCivil', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'quarteirao', 'casa']),
    { name: 'agregadoN', type: 'number', section: 'situacao', width: 'half', min: 1, label: l('Pessoas no agregado', 'People in the household'), required: true },
    { name: 'menoresN', type: 'number', section: 'situacao', width: 'half', min: 0, label: l('Das quais menores', 'Of whom children') },
    {
      name: 'meioSubsistencia',
      type: 'text',
      section: 'situacao',
      required: true,
      label: l('De que vive o agregado', 'Means of living'),
      placeholder: l('Ex.: venda informal no mercado, biscates, agricultura de subsistência', 'E.g. informal trading, odd jobs, subsistence farming'),
    },
    { name: 'rendimentoMensal', type: 'money', section: 'situacao', width: 'half', label: l('Rendimento mensal estimado (opcional)', 'Estimated monthly income (optional)') },
    ...SITUACOES.map((s) => ({ name: `sit_${s.value}`, type: 'toggle' as const, section: 'situacao', width: 'half' as const, label: s.label, default: false })),
    {
      name: 'outraSituacao',
      type: 'text',
      section: 'situacao',
      label: l('Outra situação (opcional)', 'Other circumstances (optional)'),
      placeholder: l('Ex.: a casa foi destruída pelas chuvas de Fevereiro', 'E.g. the house was destroyed by the floods'),
    },
    {
      name: 'despesa',
      type: 'text',
      section: 'finalidade',
      required: true,
      label: l('Despesa que não consegue suportar', 'Expense the person cannot afford'),
      placeholder: l('Ex.: as despesas de tratamento hospitalar', 'E.g. hospital treatment costs'),
    },
    {
      name: 'finalidade',
      type: 'text',
      section: 'finalidade',
      required: true,
      label: l('Para que serve', 'Purpose'),
      placeholder: l('Ex.: instruir pedido de isenção de pagamento no Hospital Geral de Mavalane', 'E.g. support a fee-exemption request at a hospital'),
    },
    ...assinaturaFields(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = comunidadeWarnings(v, ctx);
    if (!str(v.meioSubsistencia)) w.push({ level: 'warning', field: 'meioSubsistencia', message: l('Descreva de que vive o agregado: é o facto principal da declaração.', 'Describe how the household lives: it is the main fact declared.') });
    w.push({
      level: 'info',
      message: l(
        'Pergunte à entidade de destino (hospital, escola, IPAJ, tribunal, acção social) se aceita a declaração do bairro ou se exige também o visto do Posto Administrativo ou da Localidade.',
        'Ask the receiving body whether it accepts the neighbourhood declaration or also requires the local administration’s endorsement.',
      ),
    });
    if (v.sit_deficiencia || v.sit_doenca) {
      w.push({ level: 'info', message: l('Doença e deficiência são dados sensíveis: indique-os só com o consentimento da pessoa e se forem necessários para o pedido.', 'Illness and disability are sensitive data: state them only with the person’s consent and if needed.') });
    }
    w.push(avisoTaxa);
    return w;
  },

  personName: (v) => v.cidadaoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const gen = v.cidadaoGenero;
    const f = gen === 'F';
    const end = enderecoBairro(v);
    const n = Number(v.agregadoN);
    const menores = Number(v.menoresN);
    const agregado = Number.isFinite(n) && n > 0
      ? `O agregado familiar é composto por ${n} ${n === 1 ? 'pessoa' : 'pessoas'}${Number.isFinite(menores) && menores > 0 ? `, das quais ${menores} ${menores === 1 ? 'menor' : 'menores'}` : ''}`
      : `O agregado familiar é composto por ${BLANK} pessoas`;
    const rend = str(v.rendimentoMensal) ? `, com um rendimento mensal estimado em ${moneyText(v.rendimentoMensal)}` : '';
    const sits = SITUACOES.filter((s) => v[`sit_${s.value}`]).map((s) => (f ? s.f : s.m));
    if (str(v.outraSituacao)) sits.push(str(v.outraSituacao).replace(/[.;]+$/, '').replace(/^./, (c) => c.toLowerCase()));

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Carência Económica', subtitle: str(v.numero) ? numeroRef(ctx) : undefined },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `Declara-se, para os devidos efeitos, que ${identificacao(v)}, residente ${neste(str(v.unidade))}${end ? `, ${end}` : ''}, é pessoa de **fracos recursos económicos**, não dispondo de meios suficientes para suportar ${str(v.despesa).replace(/[.;]+$/, '') || BLANK}.`,
        en: 'It is declared that the person named has limited means and cannot afford the expense stated.',
      },
      {
        type: 'paragraph',
        id: 'agregado',
        text: `${agregado}, e a sua subsistência depende de ${str(v.meioSubsistencia).replace(/[.;]+$/, '') || BLANK}${rend}.`,
        en: 'Household size and how it makes a living.',
      },
    ];
    if (sits.length) {
      blocks.push({
        type: 'paragraph',
        id: 'situacao',
        text: `É do conhecimento desta estrutura que ${g(gen, 'o declarado', 'a declarada')} ${sits.length > 1 ? `${sits.slice(0, -1).join(', ')} e ${sits[sits.length - 1]}` : sits[0]}.`,
        en: 'Circumstances known to the community structure.',
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: `Por ser verdade e a pedido ${g(gen, 'do interessado', 'da interessada')}, passa-se a presente declaração, ${finalidadeFrase(v)}, que vai assinada e autenticada com o carimbo em uso.`,
        keepWithNext: true,
        en: 'Issued at the person’s request for the stated purpose, signed and stamped.',
      },
      ...assinaturaBlocks(ctx),
      ...notaBlocks(gen),
    );
    return blocks;
  },
});
