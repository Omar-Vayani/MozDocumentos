// Declaração de não impedimento: the bidder states on its honour that no ground
// for exclusion from public procurement applies to it. The regulation's
// standard tender documents carry their own form; this one follows the usual
// content and is for tenders that leave the format free.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, l, splitLines } from './_shared';
import { concorrenteWarnings, DECLARACAO_SECTIONS, declaracaoBaseFields, declaracaoFecho, declaracaoTitulo, declaranteAbertura, formularioWarning, isEmpresaConcorrente, str } from './_contratacao';

/** The usual situations, worded for a company or for an individual bidder. */
function situacoes(empresa: boolean, f: boolean): string[] {
  const quem = empresa ? 'os seus sócios, administradores ou gerentes' : f ? 'a declarante' : 'o declarante';
  const o = f ? 'a' : 'o';
  return [
    `não se encontra suspens${o} nem impedid${o} de participar em procedimentos de contratação pública ou de contratar com o Estado;`,
    'não se encontra em situação de falência, insolvência, liquidação ou cessação de actividade;',
    'tem a situação regularizada perante a Autoridade Tributária e a segurança social;',
    `${quem} não ${empresa ? 'foram condenados' : f ? 'foi condenada' : 'foi condenado'}, por sentença transitada em julgado, por corrupção, fraude, branqueamento de capitais ou outro crime relativo à contratação pública;`,
    'nenhum membro do júri ou servidor da entidade contratante que intervenha no procedimento tem, por si, pelo cônjuge ou por parente, interesse no concorrente;',
    'não participou na preparação do documento de concurso.',
  ];
}

export default defineTemplate({
  id: 'declaracao-nao-impedimento',
  family: 'declaracao',
  official: 'estado',
  sections: [...DECLARACAO_SECTIONS, { id: 'declaracao', title: l('Declaração', 'Declaration') }],
  fields: [
    ...declaracaoBaseFields(),
    {
      name: 'detalhar',
      type: 'toggle',
      section: 'declaracao',
      default: true,
      label: l('Enumerar as situações de impedimento', 'List the grounds for exclusion'),
      help: l(
        'Imprime as situações habituais (suspensão, falência, dívidas fiscais, condenações, conflito de interesses). Compare com o documento de concurso e acrescente as que este exigir.',
        'Prints the usual grounds (debarment, insolvency, tax debts, convictions, conflict of interest). Compare with the tender document and add any it requires.',
      ),
    },
    {
      name: 'situacoesExtra',
      type: 'textarea',
      section: 'declaracao',
      rows: 3,
      label: l('Outras declarações exigidas (opcional)', 'Other required statements (optional)'),
      placeholder: l('Uma por linha, começando por «que» ou por um verbo. Ex.: não tem processos de contencioso pendentes com a entidade contratante', 'One per line. E.g. has no pending litigation with the contracting body'),
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [...concorrenteWarnings(v), formularioWarning()];
    if (!str(v.entidadeNome)) w.push({ level: 'warning', field: 'entidadeNome', message: l('Indique a entidade contratante.', 'Enter the contracting body.') });
    w.push({
      level: 'info',
      message: l(
        `A declaração não dispensa os documentos que provam a situação (certidão de quitação fiscal, declaração do INSS, certidão do Cadastro Único), quando o documento de concurso os exigir. A falsa declaração leva à exclusão ou à anulação da adjudicação (${cite('ctImpedimentos')}).`,
        'The declaration does not replace the supporting certificates (tax clearance, social security, single register) when the tender requires them. A false declaration leads to exclusion or annulment of the award.',
      ),
    });
    return w;
  },

  personName: (v) => v.entidadeNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const empresa = isEmpresaConcorrente(v);
    const f = empresa || v.concorrenteGenero === 'F';
    const extra = splitLines(v.situacoesExtra).map((s) => {
      const t = s.replace(/^que\s+/i, '').replace(/[.;]+$/, '');
      return `${t.charAt(0).toLowerCase()}${t.slice(1)};`;
    });
    const lista = [...(v.detalhar !== false ? situacoes(empresa, f) : []), ...extra];
    if (lista.length) lista[lista.length - 1] = lista[lista.length - 1].replace(/;$/, '.');
    const blocks: Block[] = [
      declaracaoTitulo('Declaração de não impedimento', v),
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `${declaranteAbertura(v)} que não se encontra em nenhuma das situações de impedimento previstas no regulamento de contratação pública do Estado e no documento de concurso${lista.length ? ', e designadamente que:' : '.'}`,
        en: 'The bidder declares on its honour that no ground for exclusion from public procurement under the regulation and the tender document applies to it, namely:',
      },
    ];
    if (lista.length) blocks.push({ type: 'list', style: 'alpha', items: lista });
    blocks.push({
      type: 'paragraph',
      id: 'consequencias',
      text: 'Mais declara saber que a falsa declaração determina a exclusão da proposta ou a anulação da adjudicação, sem prejuízo da responsabilidade civil e criminal, e obriga-se a comunicar à entidade contratante qualquer alteração destas circunstâncias.',
      keepWithNext: true,
      en: 'A false declaration leads to exclusion or annulment, besides civil and criminal liability; any change will be reported.',
    });
    blocks.push(...declaracaoFecho(ctx));
    return blocks;
  },
});
