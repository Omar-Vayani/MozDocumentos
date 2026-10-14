// Declaração de aceitação do conteúdo do documento de concurso (caderno de
// encargos): the bidder accepts the tender document without reservation and
// undertakes to perform the contract accordingly.

import { defineTemplate, type Block, type Warning } from '../model';
import { l } from './_shared';
import { concorrenteWarnings, DECLARACAO_SECTIONS, declaracaoBaseFields, declaracaoFecho, declaracaoTitulo, declaranteAbertura, formularioWarning, semPonto, str } from './_contratacao';

/** "do documento de concurso" / "dos termos de referência" */
const DO_DOC: Record<string, string> = {
  'documento de concurso': 'do documento de concurso',
  'caderno de encargos': 'do caderno de encargos',
  'convite e respectivas especificações': 'do convite e das respectivas especificações',
  'termos de referência': 'dos termos de referência',
};

export default defineTemplate({
  id: 'declaracao-aceitacao-concurso',
  family: 'declaracao',
  official: 'estado',
  sections: [...DECLARACAO_SECTIONS, { id: 'declaracao', title: l('Declaração', 'Declaration') }],
  fields: [
    ...declaracaoBaseFields(),
    {
      name: 'documentoNome',
      type: 'select',
      section: 'declaracao',
      width: 'half',
      label: l('Documento aceite', 'Document accepted'),
      options: [
        { value: 'documento de concurso', label: l('Documento de concurso', 'Tender document') },
        { value: 'caderno de encargos', label: l('Caderno de encargos', 'Specifications') },
        { value: 'convite e respectivas especificações', label: l('Convite e especificações', 'Invitation and specifications') },
        { value: 'termos de referência', label: l('Termos de referência', 'Terms of reference') },
      ],
      default: 'documento de concurso',
    },
    { name: 'aditamentos', type: 'text', section: 'declaracao', width: 'half', label: l('Esclarecimentos / aditamentos (opcional)', 'Clarifications / addenda (optional)'), placeholder: l('Ex.: Aditamento n.º 1', 'E.g. Addendum no. 1') },
  ],

  warnings: (v) => {
    const w: Warning[] = [...concorrenteWarnings(v), formularioWarning()];
    if (!str(v.entidadeNome)) w.push({ level: 'warning', field: 'entidadeNome', message: l('Indique a entidade contratante.', 'Enter the contracting body.') });
    w.push({
      level: 'info',
      message: l(
        'Uma proposta com reservas ou condições que alterem o documento de concurso pode ser desclassificada. Não acrescente condições à proposta que contrariem esta declaração.',
        'A bid with reservations or conditions that change the tender document may be disqualified. Do not add conditions contradicting this declaration.',
      ),
    });
    return w;
  },

  personName: (v) => v.entidadeNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const doDoc = DO_DOC[str(v.documentoNome)] ?? DO_DOC['documento de concurso'];
    const ad = semPonto(v.aditamentos);
    const blocks: Block[] = [
      declaracaoTitulo(`Declaração de aceitação do conteúdo ${doDoc}`, v),
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `${declaranteAbertura(v)} que tomou inteiro e perfeito conhecimento do conteúdo ${doDoc}${ad ? `, incluindo ${ad}` : ', incluindo os esclarecimentos e aditamentos prestados'}, e que:`,
        en: 'The bidder declares on its honour that it has full knowledge of the tender document, including clarifications and addenda, and that:',
      },
      {
        type: 'list',
        style: 'alpha',
        items: [
          'aceita, sem reservas nem condições, todas as cláusulas, especificações e requisitos nele contidos;',
          'a proposta apresentada cumpre integralmente esses requisitos e não contém condições que os alterem ou contrariem;',
          'em caso de adjudicação, se obriga a executar o contrato em conformidade com o documento de concurso e com a proposta apresentada;',
          'aceita que o documento de concurso, os esclarecimentos e a proposta façam parte integrante do contrato a celebrar.',
        ],
      },
      {
        type: 'paragraph',
        id: 'lei',
        text: 'Mais declara que se submete, em tudo o que respeitar ao procedimento e à execução do contrato, à legislação moçambicana aplicável à contratação pública.',
        keepWithNext: true,
        en: 'It submits to Mozambican public procurement law for the procedure and the contract.',
      },
      ...declaracaoFecho(ctx),
    ];
    return blocks;
  },
});
