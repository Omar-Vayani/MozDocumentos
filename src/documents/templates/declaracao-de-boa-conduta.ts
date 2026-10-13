// Declaração de boa conduta: a character reference from the neighbourhood
// structure ("nada consta nesta estrutura"). It never states the absence of a
// criminal record: the official proof is the criminal record certificate.

import { defineTemplate, type Block, type Warning } from '../model';
import { dateField, g, l, localField } from './_shared';
import {
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

const EXIGE_REGISTO = /emprego p[úu]blico|fun[cç][aã]o p[úu]blica|arma|carta de condu|visto|nacionalidade|seguran[cç]a privada|pol[íi]cia|tribunal|concurso/i;

export default defineTemplate({
  id: 'declaracao-de-boa-conduta',
  family: 'declaracao',
  official: 'estado',
  page: 'A5',
  sections: [
    { id: 'documento', title: l('Declaração', 'Declaration') },
    { id: 'cidadao', title: l('Morador', 'Resident'), personRole: 'outro' },
    { id: 'finalidade', title: l('Finalidade', 'Purpose') },
    { id: 'assinatura', title: l('Assinatura e confirmações', 'Signature and confirmations') },
  ],
  fields: [
    numeroComunidadeField(),
    unidadeField(),
    localField(),
    dateField('data'),
    validadeField(),
    ...pessoaFields(['nome', 'genero', 'pai', 'mae', 'nascimento', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'quarteirao', 'casa']),
    { name: 'anosResidencia', type: 'number', section: 'cidadao', width: 'half', min: 0, label: l('Anos de residência no bairro', 'Years living here') },
    finalidadeField('finalidade', l('Ex.: candidatura a emprego como empregada doméstica', 'E.g. job application')),
    {
      name: 'observacoes',
      type: 'textarea',
      section: 'finalidade',
      rows: 2,
      label: l('Informação adicional (opcional)', 'Additional information (optional)'),
      placeholder: l('Ex.: participa activamente nas actividades do bairro', 'E.g. takes part in community activities'),
      help: l('Só factos conhecidos pela estrutura. Não mencione queixas não provadas.', 'Only facts known to the structure. Do not mention unproven complaints.'),
    },
    ...assinaturaFields(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = comunidadeWarnings(v, ctx);
    if (EXIGE_REGISTO.test(str(v.finalidade))) {
      w.push({ level: 'warning', field: 'finalidade', message: l('Para este fim a entidade exige normalmente o certificado de registo criminal; esta declaração só o complementa.', 'For this purpose the body usually requires the criminal record certificate; this declaration only complements it.') });
    }
    w.push({ level: 'info', message: l('Declare apenas que «nada consta nesta estrutura». Nunca afirme que a pessoa não tem antecedentes criminais.', 'Only state that nothing is recorded by the structure; never claim the person has no criminal record.') });
    w.push(avisoTaxa);
    return w;
  },

  personName: (v) => v.cidadaoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const gen = v.cidadaoGenero;
    const end = enderecoBairro(v);
    const anos = Number(v.anosResidencia);
    const ha = Number.isFinite(anos) && anos > 0 ? `, há ${anos} ${anos === 1 ? 'ano' : 'anos'}` : '';
    const obs = str(v.observacoes).replace(/\s+/g, ' ');
    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Boa Conduta', subtitle: str(v.numero) ? numeroRef(ctx) : undefined },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `Declara-se, para os devidos efeitos, que ${identificacao(v)}, reside ${neste(str(v.unidade))}${end ? `, ${end}` : ''}${ha}, sendo pessoa conhecida desta estrutura e da comunidade, e que **nada consta nesta estrutura que desabone o seu comportamento cívico e moral**.`,
        en: 'It is declared that the resident is known to the community and that nothing recorded by this structure reflects badly on their conduct.',
      },
    ];
    if (obs) blocks.push({ type: 'paragraph', id: 'observacoes', text: obs.replace(/[^.]$/, (c) => `${c}.`), en: 'Additional information known to the structure.' });
    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: `A presente declaração é passada a pedido ${g(gen, 'do interessado', 'da interessada')}, ${finalidadeFrase(v)}, e não substitui o certificado de registo criminal. ${validadeTexto(v)}`.trim(),
        keepWithNext: true,
        en: 'Issued at the person’s request for the stated purpose; it does not replace the criminal record certificate.',
      },
      ...assinaturaBlocks(ctx),
      ...notaBlocks(gen),
    );
    return blocks;
  },
});
