// Declaração de convivência marital: the neighbourhood confirms since when a
// couple lives together. It supports the administrative recognition of a de
// facto union (the certificate itself is issued by the administrative authority
// or the court) and is also used by social security, banks and embassies.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField } from './_shared';
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
  testemunhas,
  testemunhasField,
  testemunhasSignatures,
  unidadeField,
} from './_comunidade';

const mesAno = (ym: unknown) => {
  const s = str(ym);
  return /^\d{4}-\d{2}$/.test(s) ? dateLong(`${s}-01`).replace(/^\d+\.?º? de /, '') : '';
};

const ESTADOS_LIVRES = ['solteiro', 'divorciado', 'viúvo', ''];

export default defineTemplate({
  id: 'declaracao-de-convivencia',
  family: 'declaracao',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Declaração', 'Declaration') },
    { id: 'companheiro1', title: l('Primeiro companheiro', 'First partner'), personRole: 'outro' },
    { id: 'companheiro2', title: l('Segundo companheiro', 'Second partner'), personRole: 'outro' },
    { id: 'convivencia', title: l('Vida em comum', 'Life together') },
    { id: 'assinatura', title: l('Assinatura e testemunhas', 'Signature and witnesses') },
  ],
  fields: [
    numeroComunidadeField(),
    unidadeField(),
    localField(),
    dateField('data'),
    ...pessoaFields(['nome', 'genero', 'nascimento', 'nacionalidade', 'estadoCivil', 'docTipo', 'docNumero', 'docEmissao', 'docLocal'], 'companheiro1', 'companheiro1'),
    ...pessoaFields(['nome', 'genero', 'nascimento', 'nacionalidade', 'estadoCivil', 'docTipo', 'docNumero', 'docEmissao', 'docLocal'], 'companheiro2', 'companheiro2').map((f) =>
      f.name === 'companheiro2Genero' ? { ...f, default: 'F' } : f,
    ),
    ...pessoaFields(['quarteirao', 'casa', 'rua'], 'casal', 'convivencia'),
    { name: 'desde', type: 'month', section: 'convivencia', width: 'half', required: true, label: l('Vivem juntos desde', 'Living together since') },
    { name: 'filhosComuns', type: 'number', section: 'convivencia', width: 'half', min: 0, label: l('Filhos em comum', 'Children together') },
    {
      name: 'entidadeDestino',
      type: 'text',
      section: 'convivencia',
      label: l('Entidade de destino', 'Receiving body'),
      placeholder: l('Ex.: Posto Administrativo Municipal de KaMpfumo', 'E.g. the administrative post'),
      help: l('O reconhecimento da união de facto é feito pela autoridade administrativa da área de residência ou pelo tribunal.', 'The de facto union is recognised by the local administrative authority or by a court.'),
    },
    {
      name: 'finalidade',
      type: 'text',
      section: 'convivencia',
      label: l('Para que serve', 'Purpose'),
      default: 'instruir o pedido de reconhecimento da união de facto',
    },
    testemunhasField('assinatura', 'testemunhas', l('Testemunhas (vizinhos, opcional)', 'Witnesses (neighbours, optional)')),
    ...assinaturaFields(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = comunidadeWarnings(v, ctx);
    const casado = [v.companheiro1EstadoCivil, v.companheiro2EstadoCivil].some((e) => !ESTADOS_LIVRES.includes(str(e)) && str(e) !== 'união de facto');
    if (casado) {
      w.push({ level: 'error', message: l('Um dos companheiros está casado. A união de facto exige que ambos possam casar; a estrutura não deve declarar convivência marital neste caso.', 'One partner is married. A de facto union requires both to be free to marry.') });
    }
    const min = ctx.legal.value<{ anosMin: number }>('uniaoFactoNocao').anosMin;
    const [y, m] = str(v.desde).split('-').map(Number);
    const [ty, tm] = str(v.data || ctx.today).split('-').map(Number);
    if (y && m && (ty - y) * 12 + (tm - m) < min * 12) {
      w.push({
        level: 'warning',
        field: 'desde',
        message: l(
          `A Lei da Família exige comunhão de vida há mais de ${min} anos para a união de facto (${cite('uniaoFactoNocao')}). A declaração pode ser passada, mas o reconhecimento pode ser recusado.`,
          `The Family Law requires more than ${min} years of life together for a de facto union. Recognition may be refused.`,
        ),
      });
    }
    w.push(avisoTaxa);
    return w;
  },

  personName: (v) => [str(v.companheiro1Nome), str(v.companheiro2Nome)].filter(Boolean).join(' e '),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const end = enderecoBairro(v, 'casal');
    const filhos = Number(v.filhosComuns);
    const destino = str(v.entidadeDestino);
    const ts = testemunhas(v);
    const ambosF = v.companheiro1Genero === 'F' && v.companheiro2Genero === 'F';
    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Convivência Marital', subtitle: str(v.numero) ? numeroRef(ctx) : undefined },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `Declara-se, para os devidos efeitos, que ${identificacao(v, 'companheiro1')}, e ${identificacao(v, 'companheiro2')}, residem juntos ${neste(str(v.unidade))}${end ? `, ${end}` : ''}, vivendo em comunhão de mesa, leito e habitação desde ${mesAno(v.desde) || BLANK}${Number.isFinite(filhos) && filhos > 0 ? `, tendo ${filhos} ${filhos === 1 ? 'filho' : 'filhos'} em comum` : ''}.`,
        en: 'It is declared that the two people named live together in this neighbourhood as a couple since the date stated.',
      },
      {
        type: 'paragraph',
        id: 'conhecimento',
        text: `A convivência é do conhecimento desta estrutura e dos vizinhos${ts.length ? ', que abaixo também assinam' : ''}.`,
        en: 'The community structure and the neighbours know of this life together.',
      },
      {
        type: 'paragraph',
        id: 'fecho',
        text: `Por ser verdade e a pedido ${ambosF ? 'das interessadas' : 'dos interessados'}, passa-se a presente declaração, ${finalidadeFrase(v)}${destino ? `, junto ${/^(Posto|Distrito|Tribunal|Instituto|Banco|INSS)/i.test(destino) ? 'do' : 'da'} ${destino}` : ''}, que vai assinada e autenticada com o carimbo em uso.`,
        keepWithNext: true,
        en: 'Issued at the couple’s request for the stated purpose, signed and stamped.',
      },
      ...assinaturaBlocks(ctx),
    ];
    if (ts.length) blocks.push({ type: 'heading', text: 'Testemunhas' }, ...testemunhasSignatures(ts));
    blocks.push(...notaBlocks('M', 'O reconhecimento da união de facto compete à autoridade administrativa ou ao tribunal, nos termos da Lei da Família.', ambosF ? 'pelas interessadas' : 'pelos interessados'));
    return blocks;
  },
});
