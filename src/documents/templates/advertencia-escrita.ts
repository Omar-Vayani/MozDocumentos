import type { LegalRefId } from '@/legal/mz-legal';
import { addMonths, diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import {
  BLANK, cite, dateField, dateLong, employerName, employerSignature, exmo, g, l, localField, refField,
  splitLines, workerFields,
} from './_shared';
import { listaTexto, recusaBox } from './_contrato-trabalho';

/** "do art. 70.º …" / "dos arts. 64.º e 65.º …" */
const doCite = (id: LegalRefId) => {
  const c = cite(id);
  return `${/^arts\./.test(c) ? 'dos' : /^art/.test(c) ? 'do' : 'da'} ${c}`;
};

export default defineTemplate({
  id: 'advertencia-escrita',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'factos', title: l('Factos', 'Facts') },
    { id: 'audicao', title: l('Audição do trabalhador', 'Hearing the employee') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    ...workerFields(['nome', 'genero', 'cargo', 'departamento']),
    {
      name: 'dataInfraccao',
      type: 'date',
      section: 'factos',
      width: 'half',
      label: l('Data dos factos', 'Date of the facts'),
      legal: l('A infracção prescreve se a sanção não for aplicada a tempo.', 'The offence lapses if the sanction is not applied in time.'),
    },
    {
      name: 'localFactos',
      type: 'text',
      section: 'factos',
      width: 'half',
      label: l('Local dos factos', 'Where it happened'),
      placeholder: l('Ex.: Loja da Baixa', 'E.g. Downtown shop'),
    },
    {
      name: 'factos',
      type: 'textarea',
      section: 'factos',
      required: true,
      rows: 6,
      label: l('Descrição dos factos', 'Description of the facts'),
      help: l('Um facto por linha: o que aconteceu, quando, onde e como.', 'One fact per line: what happened, when, where and how.'),
    },
    {
      name: 'deveres',
      type: 'textarea',
      section: 'factos',
      rows: 2,
      label: l('Deveres violados (opcional)', 'Duties breached (optional)'),
      placeholder: l('Ex.: dever de pontualidade', 'E.g. duty of punctuality'),
    },
    {
      name: 'dataAudicao',
      type: 'date',
      section: 'audicao',
      width: 'half',
      label: l('Data em que o trabalhador foi ouvido', 'Date the employee was heard'),
      legal: l('Nenhuma sanção pode ser aplicada sem ouvir primeiro o trabalhador.', 'No sanction may be applied without first hearing the employee.'),
    },
    {
      name: 'testemunhas',
      type: 'toggle',
      section: 'opcoes',
      default: false,
      label: l('Incluir espaço para testemunhas (se recusar receber)', 'Include witness lines (if receipt is refused)'),
    },
  ],

  computed: (v, { legal }) => {
    const prescricao = legal.value<{ meses: number }>('prescricaoInfraccao').meses;
    return {
      limitePrescricao: v.dataInfraccao ? addMonths(v.dataInfraccao, prescricao) : null,
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (!v.dataAudicao) {
      w.push({
        level: 'warning',
        field: 'dataAudicao',
        message: l(
          'A lei não permite aplicar uma sanção sem ouvir primeiro o trabalhador. Indique a data em que foi ouvido.',
          'The law does not allow a sanction without first hearing the employee. Enter the date they were heard.',
        ),
      });
    } else if (v.data && diffDays(v.dataAudicao, v.data) < 0) {
      w.push({
        level: 'error',
        field: 'dataAudicao',
        message: l('A audição tem de ser anterior à data da repreensão.', 'The hearing must take place before the date of the reprimand.'),
      });
    }
    if (c.limitePrescricao && v.data && diffDays(c.limitePrescricao, v.data) > 0) {
      w.push({
        level: 'error',
        field: 'dataInfraccao',
        message: l(`A infracção pode ter prescrito em ${dateLong(c.limitePrescricao)}.`, `The offence may have lapsed on ${c.limitePrescricao}.`),
      });
    }
    if (v.dataInfraccao && v.data && diffDays(v.dataInfraccao, v.data) < 0) {
      w.push({ level: 'error', field: 'dataInfraccao', message: l('A data dos factos é posterior à data do documento.', 'The date of the facts is after the document date.') });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ge = v.trabalhadorGenero;
    const empresa = employerName(ctx);
    // An individual employer (personal profile) takes no article and is not "a empresa".
    const pessoa = ctx.profile?.kind === 'pessoa';
    const factos = splitLines(v.factos);
    // When and where, in the opening sentence: ", ocorridos em 6 de Outubro de 2026, no seguinte local: …".
    const local = String(v.localFactos ?? '').trim().replace(/\.$/, '');
    const quando = v.dataInfraccao || local
      ? `, ocorridos${v.dataInfraccao ? ` em ${dateLong(v.dataInfraccao)}` : ''}${local ? `${v.dataInfraccao ? ',' : ''} no seguinte local: ${local}` : ''}`
      : '';

    const blocks: Block[] = [
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: exmo(ge),
        lines: [v.trabalhadorNome || BLANK, [v.trabalhadorCargo, v.trabalhadorDepartamento].filter(Boolean).join(' — ')],
      },
      { type: 'subject', text: 'Repreensão registada' },
      { type: 'salutation', text: `${exmo(ge)},` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${pessoa ? `**${empresa}**` : `A **${empresa}**`} comunica a V. Ex.ª que, nos termos ${doCite('sancoesDisciplinares')} (Lei do Trabalho), lhe é aplicada a sanção disciplinar de **repreensão registada**, pelos factos seguintes${quando}:`,
        en: `${empresa} informs you that, under the Labour Law, you are given the disciplinary sanction of a recorded reprimand for the following facts:`,
      },
      { type: 'list', style: 'numeric', items: factos.length ? factos : [BLANK] },
    ];
    blocks.push(
      {
        type: 'paragraph',
        id: 'deveres',
        text: v.deveres
          ? `Tais factos constituem infracção disciplinar, por violação dos seguintes deveres: ${listaTexto(v.deveres)}.`
          : `Tais factos constituem infracção disciplinar, por violação dos deveres do trabalhador previstos na Lei do Trabalho${pessoa ? '' : ' e no regulamento interno da empresa'}.`,
        en: 'These facts constitute a disciplinary offence for breach of the employee’s duties.',
      },
      {
        type: 'paragraph',
        id: 'audicao',
        text: `Antes da aplicação desta sanção, V. Ex.ª foi ${g(ge, 'ouvido', 'ouvida')} sobre os factos em ${dateLong(v.dataAudicao)}, tendo tido oportunidade de apresentar a sua versão e os elementos que entendeu relevantes. Na escolha da sanção foram ponderados a natureza e a gravidade da infracção, o grau de culpa e o comportamento anterior de V. Ex.ª. A presente repreensão fica registada no processo individual de V. Ex.ª.`,
        en: `Before this sanction was applied, you were heard on the facts${v.dataAudicao ? ` on ${v.dataAudicao}` : ''} and had the opportunity to give your account. In choosing the sanction, the nature and seriousness of the offence, the degree of fault and your previous conduct were taken into account. This reprimand is recorded in your personal file.`,
      },
      {
        type: 'paragraph',
        id: 'advertencia',
        text: `Adverte-se V. Ex.ª de que a repetição de comportamentos desta natureza poderá dar lugar à instauração de processo disciplinar e à aplicação de sanções mais graves, nos termos ${doCite('procedimentoDisciplinar')}. V. Ex.ª pode reclamar desta decisão junto de quem a proferiu ou dela recorrer para o superior hierárquico.`,
        en: 'You are warned that repeating such conduct may lead to disciplinary proceedings and heavier sanctions. You may lodge a complaint about this decision with whoever took it or appeal to the next level of management.',
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [employerSignature(ctx)] },
      {
        type: 'acknowledgement',
        text: 'Recebi o original desta repreensão em ___/___/______. A assinatura confirma apenas a recepção do documento.',
        signer: g(ge, 'O Trabalhador', 'A Trabalhadora'),
      },
    );
    if (v.testemunhas) blocks.push(recusaBox(`Em caso de recusa de recepção, ${g(ge, 'o trabalhador foi notificado', 'a trabalhadora foi notificada')} na presença das testemunhas abaixo, em ___/___/______.`));
    return blocks;
  },
});
